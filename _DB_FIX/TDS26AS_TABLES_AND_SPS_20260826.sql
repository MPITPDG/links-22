USE [LinksDB]
GO
/**********************************************************************************************
 NEW FEATURE : 26AS TDS Reconciliation  -  tables + stored procedures
 DATE: 26-08-2026

 Purpose
 -------
 The user uploads the TRACES Form 26AS statement (native ^-delimited .txt download, or an
 .xlsx conversion of it). The API parses PART-I (TDS deducted by customers) and stores it
 here; deductors are auto-matched to clients (EXP_MASTER) first via a persisted TAN->client
 map, else by normalized name; the report compares 26AS Amount Paid/Credited + TDS vs the
 total invoiced to that client in the financial year.

 Objects created (all new, nothing existing is touched):
   Tables : ACC_TDS26AS_UPLOADLOG, ACC_TDS26AS_DEDUCTOR, ACC_TDS26AS_DETAIL,
            ACC_TDS26AS_TANCLIENTMAP
   Procs  : USP_ACC_TDS26AS_UPLOADLOG, USP_ACC_TDS26AS_MATCH, USP_TDS26AS_GETSUMMARY,
            USP_TDS26AS_GETDETAIL, USP_TDS26AS_SAVEMAPPING

 Idempotent: safe to run more than once (CREATEs are guarded, procs CREATE OR ALTER-style
 via drop-and-create guards).

 ASSUMPTIONS TO CONFIRM ON THE LIVE DB (flagged, not blocking):
   1) Invoiced total = SUM(INV_INRAMT) over ACC_INVCHARGE plus ACC_INVCHARGE1 (the two
      tables supplement each other, as in USP_Acc_INV_Print_New) joined to ACC_INVOICE on
      INV_NO, filtered on INV_DATE within the FY and INV_CLIENT = matched EXP_CODE.
   2) No cancelled-invoice flag is excluded yet - if live has one (e.g. a status column on
      ACC_INVOICE), add it to the WHERE in USP_TDS26AS_GETSUMMARY / GETDETAIL.

 DEPLOY  : run on the LIVE LinksDB server. Verify catalog name in the USE above.
           (Same script is used for Manilal - change USE to the Manilal catalog there.)
 ROLLBACK: ROLLBACK_TDS26AS_20260826.sql (drops the 5 procs + 4 tables).
**********************************************************************************************/

SET NOCOUNT ON
GO

/* ================================ TABLES ================================ */

IF OBJECT_ID('dbo.ACC_TDS26AS_UPLOADLOG') IS NULL
BEGIN
    CREATE TABLE dbo.ACC_TDS26AS_UPLOADLOG
    (
        PK_LOGID      INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ACC_TDS26AS_UPLOADLOG PRIMARY KEY,
        FILENAME      VARCHAR(255)  NULL,
        FILEPATH      VARCHAR(500)  NULL,
        PANNO         VARCHAR(10)   NULL,
        FINYEAR       VARCHAR(10)   NULL,   -- as printed on 26AS, e.g. '2025-26'
        ASSESSEENAME  VARCHAR(200)  NULL,
        UPLOADEDBY    INT           NULL,
        UPLOADEDIP    VARCHAR(50)   NULL,
        UPLOADEDDATE  DATETIME      NULL CONSTRAINT DF_TDS26AS_LOG_DT DEFAULT (GETDATE()),
        STATUS        VARCHAR(10)   NULL    -- 'P' parsing, 'C' complete
    )
END
GO

IF OBJECT_ID('dbo.ACC_TDS26AS_DEDUCTOR') IS NULL
BEGIN
    CREATE TABLE dbo.ACC_TDS26AS_DEDUCTOR
    (
        PK_DEDID         INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ACC_TDS26AS_DEDUCTOR PRIMARY KEY,
        FK_LOGID         INT           NOT NULL,
        SRNO             INT           NULL,
        DEDUCTOR_NAME    VARCHAR(200)  NULL,
        TAN              VARCHAR(10)   NULL,
        TOT_AMTCREDITED  DECIMAL(15,2) NULL,
        TOT_TAXDEDUCTED  DECIMAL(15,2) NULL,
        TOT_TDSDEPOSITED DECIMAL(15,2) NULL,
        MATCHED_EXPCODE  VARCHAR(10)   NULL,
        MATCHTYPE        VARCHAR(10)   NULL    -- 'TAN' / 'NAME' / 'MANUAL' / NULL = unmatched
    )
    CREATE INDEX IX_TDS26AS_DEDUCTOR_LOG ON dbo.ACC_TDS26AS_DEDUCTOR (FK_LOGID)
END
GO

IF OBJECT_ID('dbo.ACC_TDS26AS_DETAIL') IS NULL
BEGIN
    CREATE TABLE dbo.ACC_TDS26AS_DETAIL
    (
        PK_ID          INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ACC_TDS26AS_DETAIL PRIMARY KEY,
        FK_DEDID       INT           NOT NULL,
        FK_LOGID       INT           NOT NULL,
        SRNO           INT           NULL,
        SECTION        VARCHAR(10)   NULL,
        TXNDATE        DATETIME      NULL,
        BOOKINGSTATUS  VARCHAR(2)    NULL,    -- F / O / U / P / Z
        BOOKINGDATE    DATETIME      NULL,
        REMARKS        VARCHAR(100)  NULL,
        AMTCREDITED    DECIMAL(15,2) NULL,
        TAXDEDUCTED    DECIMAL(15,2) NULL,
        TDSDEPOSITED   DECIMAL(15,2) NULL
    )
    CREATE INDEX IX_TDS26AS_DETAIL_DED ON dbo.ACC_TDS26AS_DETAIL (FK_DEDID)
    CREATE INDEX IX_TDS26AS_DETAIL_LOG ON dbo.ACC_TDS26AS_DETAIL (FK_LOGID)
END
GO

IF OBJECT_ID('dbo.ACC_TDS26AS_TANCLIENTMAP') IS NULL
BEGIN
    CREATE TABLE dbo.ACC_TDS26AS_TANCLIENTMAP
    (
        PK_ID       INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_ACC_TDS26AS_TANCLIENTMAP PRIMARY KEY,
        TAN         VARCHAR(10)  NOT NULL CONSTRAINT UQ_TDS26AS_TAN UNIQUE,
        EXP_CODE    VARCHAR(10)  NOT NULL,
        MAPPEDBY    INT          NULL,
        MAPPEDDATE  DATETIME     NULL CONSTRAINT DF_TDS26AS_MAP_DT DEFAULT (GETDATE()),
        ISACTIVE    CHAR(1)      NOT NULL CONSTRAINT DF_TDS26AS_MAP_ACT DEFAULT ('Y')
    )
END
GO

/* ==================== FORM REGISTRATION (page access rights) ====================
   Registers the screen in tbl_mst_form so administrators can grant/revoke user
   access via the standard form-wise rights screen (tbl_Mst_FormWiseRights).
   pk_FormId is assigned manually per database: 418 on LinksDB, 444 on manilal.
   Non-SA users need a rights row granted before they can open the page. */
DECLARE @FORMID INT = 418   -- LinksDB next free id (manilal script uses 444)
IF NOT EXISTS (SELECT 1 FROM dbo.tbl_mst_form WHERE FormName = 'tds26as-reconcil.component.html')
BEGIN
    INSERT INTO dbo.tbl_mst_form (pk_FormId, fk_ModuleId, FormName, DisplayName, isReport, isFranceAct, SEQ, RIGHTS)
    VALUES (@FORMID, 1, 'tds26as-reconcil.component.html', '26AS TDS RECONCILIATION', 1, 0, 70208, 1110)
END
GO

/* ================================ PROCS ================================ */

IF OBJECT_ID('dbo.USP_ACC_TDS26AS_UPLOADLOG') IS NOT NULL
    DROP PROCEDURE dbo.USP_ACC_TDS26AS_UPLOADLOG
GO
/* Creates the upload batch. A re-upload for the same PAN + FINYEAR replaces the previous
   batch (old deductor/detail/log rows are deleted) so the statement can be refreshed freely.
   The TAN->client map is NEVER touched by a re-upload. */
CREATE PROCEDURE dbo.USP_ACC_TDS26AS_UPLOADLOG
    @CMPID     VARCHAR(10),
    @MAKERIP   VARCHAR(50),
    @VGUID     VARCHAR(50),
    @FILENAME  VARCHAR(255),
    @FILEPATH  VARCHAR(500),
    @PANNO     VARCHAR(10),
    @FINYEAR   VARCHAR(10),
    @ASSESSEENAME VARCHAR(200)
AS
BEGIN
    SET NOCOUNT ON
    BEGIN TRY
        DECLARE @LOGID INT

        /* replace any earlier batch for the same statement */
        DELETE D FROM dbo.ACC_TDS26AS_DETAIL D
            INNER JOIN dbo.ACC_TDS26AS_UPLOADLOG L ON L.PK_LOGID = D.FK_LOGID
            WHERE L.PANNO = @PANNO AND L.FINYEAR = @FINYEAR
        DELETE D FROM dbo.ACC_TDS26AS_DEDUCTOR D
            INNER JOIN dbo.ACC_TDS26AS_UPLOADLOG L ON L.PK_LOGID = D.FK_LOGID
            WHERE L.PANNO = @PANNO AND L.FINYEAR = @FINYEAR
        DELETE FROM dbo.ACC_TDS26AS_UPLOADLOG WHERE PANNO = @PANNO AND FINYEAR = @FINYEAR

        INSERT INTO dbo.ACC_TDS26AS_UPLOADLOG (FILENAME, FILEPATH, PANNO, FINYEAR, ASSESSEENAME, UPLOADEDBY, UPLOADEDIP, STATUS)
        VALUES (@FILENAME, @FILEPATH, @PANNO, @FINYEAR, @ASSESSEENAME,
                CASE WHEN ISNUMERIC(@CMPID) = 1 THEN CAST(@CMPID AS INT) ELSE NULL END,
                @MAKERIP, 'P')
        SET @LOGID = SCOPE_IDENTITY()

        SELECT '100' AS STATUS, CAST(@LOGID AS VARCHAR(10)) AS LOGID, 'Upload log created' AS STATUSTEXT
    END TRY
    BEGIN CATCH
        SELECT '104' AS STATUS, '' AS LOGID, ERROR_MESSAGE() AS STATUSTEXT
    END CATCH
END
GO

IF OBJECT_ID('dbo.USP_ACC_TDS26AS_MATCH') IS NOT NULL
    DROP PROCEDURE dbo.USP_ACC_TDS26AS_MATCH
GO
/* Auto-match deductors of one batch to EXP_MASTER:
   1) persisted TAN map (MATCHTYPE 'TAN' - or 'MANUAL' is preserved semantics: map rows
      created by the user give 'TAN' on later uploads)
   2) normalized company-name equality (MATCHTYPE 'NAME'):
      upper-case, strip . , & - ' and spaces, normalize PRIVATE->PVT, LIMITED->LTD. */
CREATE PROCEDURE dbo.USP_ACC_TDS26AS_MATCH
    @LOGID INT
AS
BEGIN
    SET NOCOUNT ON

    /* 1) TAN map */
    UPDATE D
       SET D.MATCHED_EXPCODE = M.EXP_CODE, D.MATCHTYPE = 'TAN'
    FROM dbo.ACC_TDS26AS_DEDUCTOR D
         INNER JOIN dbo.ACC_TDS26AS_TANCLIENTMAP M ON M.TAN = D.TAN AND M.ISACTIVE = 'Y'
    WHERE D.FK_LOGID = @LOGID

    /* 2) normalized-name match for the rest */
    ;WITH EXPN AS
    (
        SELECT EXP_CODE,
               REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
                   UPPER(LTRIM(RTRIM(EXP_NAME)))
                   ,'PRIVATE','PVT'),'LIMITED','LTD')
                   ,'.',''),',',''),'&',''),'-',''),'''',''),' ','') AS NRM
        FROM dbo.EXP_MASTER
        WHERE ISNULL(EXP_NAME,'') <> ''
    ),
    UNIQ AS
    (   /* only names that normalize uniquely - ambiguous names stay unmatched */
        SELECT NRM, MIN(EXP_CODE) AS EXP_CODE
        FROM EXPN GROUP BY NRM HAVING COUNT(DISTINCT EXP_CODE) = 1
    )
    UPDATE D
       SET D.MATCHED_EXPCODE = U.EXP_CODE, D.MATCHTYPE = 'NAME'
    FROM dbo.ACC_TDS26AS_DEDUCTOR D
         INNER JOIN UNIQ U
            ON U.NRM = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(
                   UPPER(LTRIM(RTRIM(D.DEDUCTOR_NAME)))
                   ,'PRIVATE','PVT'),'LIMITED','LTD')
                   ,'.',''),',',''),'&',''),'-',''),'''',''),' ','')
    WHERE D.FK_LOGID = @LOGID AND D.MATCHED_EXPCODE IS NULL

    UPDATE dbo.ACC_TDS26AS_UPLOADLOG SET STATUS = 'C' WHERE PK_LOGID = @LOGID

    SELECT '100' AS STATUS,
           (SELECT COUNT(*) FROM dbo.ACC_TDS26AS_DEDUCTOR WHERE FK_LOGID = @LOGID AND MATCHED_EXPCODE IS NOT NULL) AS MATCHED,
           (SELECT COUNT(*) FROM dbo.ACC_TDS26AS_DEDUCTOR WHERE FK_LOGID = @LOGID) AS TOTAL
END
GO

IF OBJECT_ID('dbo.USP_TDS26AS_GETSUMMARY') IS NOT NULL
    DROP PROCEDURE dbo.USP_TDS26AS_GETSUMMARY
GO
/* Table  : per-deductor reconciliation summary
   Table1 : client dropdown for manual mapping
   Table2 : STATUS / MSG + batch header info */
CREATE PROCEDURE dbo.USP_TDS26AS_GETSUMMARY
    @LOGID    INT,
    @CMPCODE  VARCHAR(2),
    @CITYCODE VARCHAR(3),
    @CITYCODE1 VARCHAR(3)
AS
BEGIN
    SET NOCOUNT ON

    /* LOGID 0 (or negative) = most recent completed batch, so the screen can
       reopen the last uploaded statement without re-uploading the file. */
    IF ISNULL(@LOGID,0) <= 0
        SELECT TOP 1 @LOGID = PK_LOGID FROM dbo.ACC_TDS26AS_UPLOADLOG ORDER BY PK_LOGID DESC

    DECLARE @FINYEAR VARCHAR(10), @FYFROM DATETIME, @FYTO DATETIME
    SELECT @FINYEAR = FINYEAR FROM dbo.ACC_TDS26AS_UPLOADLOG WHERE PK_LOGID = @LOGID
    /* '2025-26' -> 01-Apr-2025 .. 31-Mar-2026 */
    SET @FYFROM = CONVERT(DATETIME, LEFT(@FINYEAR,4) + '-04-01', 120)
    SET @FYTO   = DATEADD(DAY, -1, DATEADD(YEAR, 1, @FYFROM))

    /* FY invoiced INR total per client: charge lines of both charge tables
       (they supplement each other, as in USP_Acc_INV_Print_New).
       NOTE: no cancelled-invoice exclusion yet - see script header. */
    ;WITH CHG AS
    (
        SELECT INV_NO,
               CASE WHEN ISNUMERIC(LTRIM(RTRIM(ISNULL(INV_INRAMT,'0')))) = 1
                    THEN CONVERT(DECIMAL(15,2), CONVERT(MONEY, LTRIM(RTRIM(INV_INRAMT))))
                    ELSE 0 END AS AMT
        FROM dbo.ACC_INVCHARGE
        UNION ALL
        SELECT INV_NO,
               CASE WHEN ISNUMERIC(LTRIM(RTRIM(ISNULL(INV_INRAMT,'0')))) = 1
                    THEN CONVERT(DECIMAL(15,2), CONVERT(MONEY, LTRIM(RTRIM(INV_INRAMT))))
                    ELSE 0 END AS AMT
        FROM dbo.ACC_INVCHARGE1
    ),
    INVTOT AS
    (
        SELECT I.INV_CLIENT, SUM(C.AMT) AS INVOICED, COUNT(DISTINCT I.INV_NO) AS INVCOUNT
        FROM dbo.ACC_INVOICE I
             INNER JOIN CHG C ON C.INV_NO = I.INV_NO
        /* INV_DATE is a varchar column holding dd/MM/yyyy on the live DBs -
           guard the pattern, then convert with style 103 (deterministic). */
        WHERE I.INV_DATE LIKE '[0-3][0-9]/[0-1][0-9]/[1-2][0-9][0-9][0-9]'
          AND CONVERT(DATETIME, I.INV_DATE, 103) >= @FYFROM
          AND CONVERT(DATETIME, I.INV_DATE, 103) < DATEADD(DAY,1,@FYTO)
          AND (ISNULL(@CMPCODE,'') = '' OR SUBSTRING(I.INV_NO,1,2) = @CMPCODE)
        GROUP BY I.INV_CLIENT
    )
    SELECT  D.PK_DEDID,
            D.SRNO,
            D.DEDUCTOR_NAME,
            D.TAN,
            D.TOT_AMTCREDITED,
            D.TOT_TAXDEDUCTED,
            D.TOT_TDSDEPOSITED,
            ISNULL(D.MATCHED_EXPCODE,'')                        AS EXP_CODE,
            ISNULL(E.EXP_NAME,'')                               AS CLIENT_NAME,
            ISNULL(D.MATCHTYPE,'')                              AS MATCHTYPE,
            ISNULL(T.INVOICED,0)                                AS FY_INVOICED,
            ISNULL(T.INVCOUNT,0)                                AS FY_INVCOUNT,
            ISNULL(T.INVOICED,0) - ISNULL(D.TOT_AMTCREDITED,0)  AS DIFFERENCE,
            (SELECT COUNT(*) FROM dbo.ACC_TDS26AS_DETAIL X WHERE X.FK_DEDID = D.PK_DEDID) AS TXNCOUNT
    FROM dbo.ACC_TDS26AS_DEDUCTOR D
         LEFT JOIN dbo.EXP_MASTER E ON E.EXP_CODE = D.MATCHED_EXPCODE
         LEFT JOIN INVTOT T ON T.INV_CLIENT = D.MATCHED_EXPCODE
    WHERE D.FK_LOGID = @LOGID
    ORDER BY D.SRNO

    /* Table1 : client list for the manual-map dropdown */
    SELECT EXP_CODE AS VALUEFIELD,
           LTRIM(RTRIM(EXP_NAME)) + ' | ' + EXP_CODE AS TEXTFIELD
    FROM dbo.EXP_MASTER
    WHERE ISNULL(EXP_NAME,'') <> ''
    ORDER BY EXP_NAME

    /* Table2 : status + batch header */
    SELECT '100' AS STATUS, 'OK' AS MSG,
           L.PANNO, L.FINYEAR, L.ASSESSEENAME, L.FILENAME, L.UPLOADEDDATE
    FROM dbo.ACC_TDS26AS_UPLOADLOG L WHERE L.PK_LOGID = @LOGID
END
GO

IF OBJECT_ID('dbo.USP_TDS26AS_GETDETAIL') IS NOT NULL
    DROP PROCEDURE dbo.USP_TDS26AS_GETDETAIL
GO
/* Table  : 26AS transaction rows of one deductor
   Table1 : FY invoices of the matched client (empty when unmatched) */
CREATE PROCEDURE dbo.USP_TDS26AS_GETDETAIL
    @DEDID INT
AS
BEGIN
    SET NOCOUNT ON

    DECLARE @LOGID INT, @EXPCODE VARCHAR(10), @FINYEAR VARCHAR(10), @FYFROM DATETIME, @FYTO DATETIME
    SELECT @LOGID = FK_LOGID, @EXPCODE = MATCHED_EXPCODE FROM dbo.ACC_TDS26AS_DEDUCTOR WHERE PK_DEDID = @DEDID
    SELECT @FINYEAR = FINYEAR FROM dbo.ACC_TDS26AS_UPLOADLOG WHERE PK_LOGID = @LOGID
    SET @FYFROM = CONVERT(DATETIME, LEFT(@FINYEAR,4) + '-04-01', 120)
    SET @FYTO   = DATEADD(DAY, -1, DATEADD(YEAR, 1, @FYFROM))

    SELECT SRNO, SECTION,
           CONVERT(VARCHAR(10), TXNDATE, 103)     AS TXNDATE,
           BOOKINGSTATUS,
           CONVERT(VARCHAR(10), BOOKINGDATE, 103) AS BOOKINGDATE,
           REMARKS, AMTCREDITED, TAXDEDUCTED, TDSDEPOSITED
    FROM dbo.ACC_TDS26AS_DETAIL
    WHERE FK_DEDID = @DEDID
    ORDER BY TXNDATE DESC, SRNO

    ;WITH CHG AS
    (
        SELECT INV_NO,
               CASE WHEN ISNUMERIC(LTRIM(RTRIM(ISNULL(INV_INRAMT,'0')))) = 1
                    THEN CONVERT(DECIMAL(15,2), CONVERT(MONEY, LTRIM(RTRIM(INV_INRAMT))))
                    ELSE 0 END AS AMT
        FROM dbo.ACC_INVCHARGE
        UNION ALL
        SELECT INV_NO,
               CASE WHEN ISNUMERIC(LTRIM(RTRIM(ISNULL(INV_INRAMT,'0')))) = 1
                    THEN CONVERT(DECIMAL(15,2), CONVERT(MONEY, LTRIM(RTRIM(INV_INRAMT))))
                    ELSE 0 END AS AMT
        FROM dbo.ACC_INVCHARGE1
    )
    SELECT I.INV_NO,
           I.INV_DATE AS INV_DATE,   -- already stored as dd/MM/yyyy varchar
           SUM(C.AMT) AS INV_INRAMT
    FROM dbo.ACC_INVOICE I
         INNER JOIN CHG C ON C.INV_NO = I.INV_NO
    /* INV_DATE is a varchar dd/MM/yyyy column - see USP_TDS26AS_GETSUMMARY */
    WHERE I.INV_CLIENT = @EXPCODE
      AND I.INV_DATE LIKE '[0-3][0-9]/[0-1][0-9]/[1-2][0-9][0-9][0-9]'
      AND CONVERT(DATETIME, I.INV_DATE, 103) >= @FYFROM
      AND CONVERT(DATETIME, I.INV_DATE, 103) < DATEADD(DAY,1,@FYTO)
    GROUP BY I.INV_NO, I.INV_DATE
    ORDER BY CONVERT(DATETIME, I.INV_DATE, 103) DESC
END
GO

IF OBJECT_ID('dbo.USP_TDS26AS_CLEARSTATEMENT') IS NOT NULL
    DROP PROCEDURE dbo.USP_TDS26AS_CLEARSTATEMENT
GO
/* Deletes one uploaded batch (LOGID 0 / negative = the latest one) so the screen
   returns to the upload form. The TAN->client map is NEVER touched. */
CREATE PROCEDURE dbo.USP_TDS26AS_CLEARSTATEMENT
    @LOGID INT
AS
BEGIN
    SET NOCOUNT ON
    BEGIN TRY
        IF ISNULL(@LOGID,0) <= 0
            SELECT TOP 1 @LOGID = PK_LOGID FROM dbo.ACC_TDS26AS_UPLOADLOG ORDER BY PK_LOGID DESC

        DELETE FROM dbo.ACC_TDS26AS_DETAIL   WHERE FK_LOGID = @LOGID
        DELETE FROM dbo.ACC_TDS26AS_DEDUCTOR WHERE FK_LOGID = @LOGID
        DELETE FROM dbo.ACC_TDS26AS_UPLOADLOG WHERE PK_LOGID = @LOGID

        SELECT '100' AS STATUS, 'Statement cleared. Saved TAN-client mappings are kept.' AS MSG
    END TRY
    BEGIN CATCH
        SELECT '104' AS STATUS, ERROR_MESSAGE() AS MSG
    END CATCH
END
GO

IF OBJECT_ID('dbo.USP_TDS26AS_SAVEMAPPING') IS NOT NULL
    DROP PROCEDURE dbo.USP_TDS26AS_SAVEMAPPING
GO
/* Upsert the TAN->client map and re-point every deductor row with that TAN.
   Future uploads then auto-match via the map. */
CREATE PROCEDURE dbo.USP_TDS26AS_SAVEMAPPING
    @TAN     VARCHAR(10),
    @EXPCODE VARCHAR(10),
    @CMPID   VARCHAR(10)
AS
BEGIN
    SET NOCOUNT ON
    BEGIN TRY
        IF ISNULL(@TAN,'') = '' OR ISNULL(@EXPCODE,'') = ''
        BEGIN
            SELECT '104' AS STATUS, 'TAN and client are both required' AS MSG
            RETURN
        END

        IF EXISTS (SELECT 1 FROM dbo.ACC_TDS26AS_TANCLIENTMAP WHERE TAN = @TAN)
            UPDATE dbo.ACC_TDS26AS_TANCLIENTMAP
               SET EXP_CODE = @EXPCODE, ISACTIVE = 'Y', MAPPEDDATE = GETDATE(),
                   MAPPEDBY = CASE WHEN ISNUMERIC(@CMPID) = 1 THEN CAST(@CMPID AS INT) ELSE MAPPEDBY END
             WHERE TAN = @TAN
        ELSE
            INSERT INTO dbo.ACC_TDS26AS_TANCLIENTMAP (TAN, EXP_CODE, MAPPEDBY)
            VALUES (@TAN, @EXPCODE,
                    CASE WHEN ISNUMERIC(@CMPID) = 1 THEN CAST(@CMPID AS INT) ELSE NULL END)

        UPDATE dbo.ACC_TDS26AS_DEDUCTOR
           SET MATCHED_EXPCODE = @EXPCODE, MATCHTYPE = 'MANUAL'
         WHERE TAN = @TAN

        SELECT '100' AS STATUS, 'Mapping saved' AS MSG
    END TRY
    BEGIN CATCH
        SELECT '104' AS STATUS, ERROR_MESSAGE() AS MSG
    END CATCH
END
GO
