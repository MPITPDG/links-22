/*===============================================================================================
  USP_EXPT_EXPORT_DASHBOARD_BOARD_LINKSDB20_20260926.sql         (LinksDB20)

  Why  : the Export home dashboard (#/export, export-home.component) calls
         Export/EXPT_EXPORT_DASHBOARD_Board. The action now exists in the Links API; this creates
         the stored procedure behind it. Copied from the Manilal proc
         (Manilal_V5NG\Database\StoredProcedures\Export\USP_EXPT_EXPORT_DASHBOARD_BOARD.sql),
         unchanged apart from this header and the column check.

  Table  : STATUS, STAGE_CODE, N     complete per-stage counts over the window
  Table1 : newest @PERCOLUMN jobs per stage - a SAMPLE, the page labels it so
  '103'  : no job in the window

  Links books sea only (air is Links Forwarding, another system), so the AIR call returns '103'
  and the page shows Air 0 - that is correct.

  Safety : step 1 checks every table/column the proc reads and stops before creating anything
           if one is missing. Re-runnable (drops and recreates the proc).
  Rollback: ROLLBACK_USP_EXPT_EXPORT_DASHBOARD_BOARD_LINKSDB20_20260926.sql
  SQL Server 2008 R2.
===============================================================================================*/
USE [LinksDB20]
GO
SET NOCOUNT ON;

/* ---- 1. column check ------------------------------------------------------------------- */
DECLARE @missing TABLE (obj SYSNAME, col SYSNAME);
INSERT INTO @missing (obj, col)
SELECT x.obj, x.col
FROM (
          SELECT 'EXPT_MASTER' obj, 'ID' col
    UNION SELECT 'EXPT_MASTER','EXPTNO'          UNION SELECT 'EXPT_MASTER','CMPCODE'
    UNION SELECT 'EXPT_MASTER','CITYCODE'        UNION SELECT 'EXPT_MASTER','SYSEXPT_DOCRECD'
    UNION SELECT 'EXPT_MASTER','EXPT_MODE'       UNION SELECT 'EXPT_MASTER','EXPT_CONSIGNEE'
    UNION SELECT 'EXPT_MASTER','EXPT_VESSEL'     UNION SELECT 'EXPT_MASTER','VSL_PORT'
    UNION SELECT 'EXPT_MASTER','EXPT_HBLNO'      UNION SELECT 'EXPT_MASTER','EXPT_BLNO'
    UNION SELECT 'EXPT_MASTER','AEROBILLNO'      UNION SELECT 'EXPT_MASTER','HOUSEBILLNO'
    UNION SELECT 'EXPT_MASTER','EXPTCANCEL'      UNION SELECT 'EXPT_MASTER','PREALERTDT'
    UNION SELECT 'EXPT_MASTER','OUTCHARGEDT'     UNION SELECT 'EXPT_MASTER','CARTEDDT'
    UNION SELECT 'EXPT_MASTER','EXPT_SHIPBILLNO'
    UNION SELECT 'EXPT_CARGORECPT','EXPTNO'      UNION SELECT 'EXPT_CARTING','EXPTNO'
    UNION SELECT 'EXPT_CONTAINER1','EXPTNO'
    UNION SELECT 'CONSIGNEE_MASTER','CON_CODE'   UNION SELECT 'CONSIGNEE_MASTER','CON_NAME'
    UNION SELECT 'VSL_MASTER','VSL_RTNO'         UNION SELECT 'VSL_MASTER','VSL_NAME'
    UNION SELECT 'VSL_MASTER','VSL_VOYNO'
    UNION SELECT 'VSL_PORTDTLS','VSL_RTNO'       UNION SELECT 'VSL_PORTDTLS','PORT'
    UNION SELECT 'VSL_PORTDTLS','ETD'
) x
WHERE COL_LENGTH('dbo.' + x.obj, x.col) IS NULL;

IF EXISTS (SELECT 1 FROM @missing)
BEGIN
    PRINT '*** These columns are missing on ' + DB_NAME() + ' - the procedure was NOT created:';
    SELECT obj AS [table], col AS [column] FROM @missing ORDER BY obj, col;
    RAISERROR('Column check failed - see the list above.', 16, 1);
    SET NOEXEC ON;     -- skip the rest of the script, including the CREATE below
END
GO

IF OBJECT_ID('dbo.USP_EXPT_EXPORT_DASHBOARD_BOARD','P') IS NOT NULL
    DROP PROCEDURE dbo.USP_EXPT_EXPORT_DASHBOARD_BOARD;
GO

/* ---- 2. the procedure (verbatim from Manilal) ------------------------------------------- */
CREATE PROCEDURE [dbo].[USP_EXPT_EXPORT_DASHBOARD_BOARD]
    @CMPCODE    VARCHAR(6),
    @CITYCODE   VARCHAR(3),
    @DAYS       INT           = 90,
    @MODE       VARCHAR(5)    = 'ALL',   -- ALL | SEA | AIR
    @PERCOLUMN  INT           = 50
AS
BEGIN
    SET NOCOUNT ON;

    IF @DAYS IS NULL OR @DAYS < 1     SET @DAYS = 90;
    IF @DAYS > 1095                   SET @DAYS = 1095;
    IF @PERCOLUMN IS NULL OR @PERCOLUMN < 1 SET @PERCOLUMN = 50;
    IF @PERCOLUMN > 50                SET @PERCOLUMN = 50;
    SET @MODE = UPPER(LTRIM(RTRIM(ISNULL(@MODE,'ALL'))));

    -- Parameters copied into locals on purpose (stops parameter sniffing; ~3s vs 46s on
    -- Manilal). Do not "simplify" this by using the parameters directly.
    DECLARE @lCMP VARCHAR(6)  = @CMPCODE;
    DECLARE @lCITY VARCHAR(3) = @CITYCODE;
    DECLARE @lDAYS INT        = @DAYS;
    DECLARE @lMODE VARCHAR(5) = @MODE;
    DECLARE @lPER  INT        = @PERCOLUMN;

    SELECT DISTINCT EM.EXPTNO
    INTO #scope
    FROM EXPT_MASTER EM
    WHERE EM.CMPCODE  = @lCMP
      AND EM.CITYCODE = @lCITY
      AND EM.SYSEXPT_DOCRECD >= DATEADD(day, -@lDAYS, GETDATE())
      AND ( @lMODE = 'ALL'
         OR (@lMODE = 'AIR' AND LOWER(LTRIM(RTRIM(ISNULL(EM.EXPT_MODE,'')))) = 'air')
         OR (@lMODE = 'SEA' AND LOWER(LTRIM(RTRIM(ISNULL(EM.EXPT_MODE,'')))) <> 'air') );

    CREATE CLUSTERED INDEX IX_scope ON #scope (EXPTNO);

    SELECT
        EM.ID,
        EM.EXPTNO,
        LOWER(LTRIM(RTRIM(ISNULL(EM.EXPT_MODE,''))))    AS MODE,
        ISNULL(CO.CON_NAME,'')                          AS CONSIGNEE,
        ISNULL(VM.VSL_NAME,'')                          AS VSL_NAME,
        ISNULL(VM.VSL_VOYNO,'')                         AS VSL_VOYNO,
        ISNULL(VP.ETD,'')                               AS ETD,
        EM.SYSEXPT_DOCRECD,
        LTRIM(RTRIM(ISNULL(EM.EXPT_HBLNO,'')))          AS HBLNO,
        LTRIM(RTRIM(ISNULL(EM.EXPT_BLNO,'')))           AS BLNO,
        LTRIM(RTRIM(ISNULL(EM.AEROBILLNO,'')))          AS MAWB,
        LTRIM(RTRIM(ISNULL(EM.HOUSEBILLNO,'')))         AS HAWB,
        CASE WHEN LTRIM(RTRIM(ISNULL(EM.EXPTCANCEL,''))) = 'Y'
             THEN 1 ELSE 0 END                          AS CANCELLED,
        CASE
            WHEN LTRIM(RTRIM(ISNULL(EM.EXPTCANCEL,''))) = 'Y'  THEN 99
            WHEN LTRIM(RTRIM(ISNULL(EM.PREALERTDT,'')))  <> '' THEN 7
            WHEN ( LTRIM(RTRIM(ISNULL(EM.EXPT_HBLNO,'')))  <> ''
                OR LTRIM(RTRIM(ISNULL(EM.EXPT_BLNO,'')))   <> ''
                OR LTRIM(RTRIM(ISNULL(EM.AEROBILLNO,'')))  <> ''
                OR LTRIM(RTRIM(ISNULL(EM.HOUSEBILLNO,''))) <> '' ) THEN 6
            WHEN LTRIM(RTRIM(ISNULL(EM.OUTCHARGEDT,''))) <> '' THEN 5
            WHEN ISNULL(CN.N,0) > 0                            THEN 4
            WHEN ( ISNULL(CT.N,0) > 0
                OR LTRIM(RTRIM(ISNULL(EM.CARTEDDT,''))) <> '' ) THEN 3
            WHEN ISNULL(CR.N,0) > 0                            THEN 2
            WHEN LTRIM(RTRIM(ISNULL(EM.EXPT_SHIPBILLNO,''))) <> '' THEN 1
            ELSE 0
        END                                             AS STAGE_CODE
    INTO #facts
    FROM EXPT_MASTER EM
    JOIN #scope SC ON SC.EXPTNO = EM.EXPTNO
    LEFT JOIN ( SELECT R.EXPTNO, COUNT(*) AS N
                FROM EXPT_CARGORECPT R
                JOIN #scope S ON S.EXPTNO = R.EXPTNO
                GROUP BY R.EXPTNO ) CR ON CR.EXPTNO = EM.EXPTNO
    LEFT JOIN ( SELECT C.EXPTNO, COUNT(*) AS N
                FROM EXPT_CARTING C
                JOIN #scope S ON S.EXPTNO = C.EXPTNO
                GROUP BY C.EXPTNO ) CT ON CT.EXPTNO = EM.EXPTNO
    LEFT JOIN ( SELECT K.EXPTNO, COUNT(*) AS N
                FROM EXPT_CONTAINER1 K
                JOIN #scope S ON S.EXPTNO = K.EXPTNO
                GROUP BY K.EXPTNO ) CN ON CN.EXPTNO = EM.EXPTNO
    LEFT JOIN CONSIGNEE_MASTER CO ON CO.CON_CODE = EM.EXPT_CONSIGNEE
    LEFT JOIN VSL_MASTER       VM ON VM.VSL_RTNO = EM.EXPT_VESSEL
    LEFT JOIN ( SELECT P.VSL_RTNO, P.PORT, MAX(P.ETD) AS ETD
                FROM VSL_PORTDTLS P
                WHERE LEN(LTRIM(RTRIM(ISNULL(P.ETD,'')))) = 10
                GROUP BY P.VSL_RTNO, P.PORT ) VP
           ON VP.VSL_RTNO = EM.EXPT_VESSEL AND VP.PORT = EM.VSL_PORT;

    IF (SELECT COUNT(*) FROM #facts) > 0
    BEGIN
        SELECT '100' AS STATUS, STAGE_CODE, COUNT(*) AS N
        FROM #facts
        GROUP BY STAGE_CODE
        ORDER BY STAGE_CODE;

        SELECT EXPTNO, STAGE_CODE, MODE, CONSIGNEE, VSL_NAME, VSL_VOYNO, ETD,
               SYSEXPT_DOCRECD, CANCELLED, HBLNO, BLNO, MAWB, HAWB
        FROM ( SELECT F.*,
                      ROW_NUMBER() OVER ( PARTITION BY F.STAGE_CODE
                                          ORDER BY F.SYSEXPT_DOCRECD DESC, F.ID DESC ) AS RN
               FROM #facts F ) R
        WHERE R.RN <= @lPER
        ORDER BY R.STAGE_CODE, R.RN;
    END
    ELSE
    BEGIN
        SELECT '103' AS STATUS, 'NO RECORD FOUND' AS statustext;
    END

    DROP TABLE #facts;
    DROP TABLE #scope;
END
GO

SET NOEXEC OFF;
GO

/* ---- 3. smoke test: the branch/company pairs with the most jobs in the last 90 days ------- */
IF OBJECT_ID('dbo.USP_EXPT_EXPORT_DASHBOARD_BOARD','P') IS NOT NULL
BEGIN
    PRINT 'USP_EXPT_EXPORT_DASHBOARD_BOARD created on ' + DB_NAME() + '.';
    SELECT TOP 5 CMPCODE, CITYCODE, COUNT(*) AS JOBS_90D
      FROM EXPT_MASTER
     WHERE SYSEXPT_DOCRECD >= DATEADD(day, -90, GETDATE())
     GROUP BY CMPCODE, CITYCODE
     ORDER BY COUNT(*) DESC;
    PRINT 'Try: EXEC USP_EXPT_EXPORT_DASHBOARD_BOARD ''<CMPCODE>'', ''<CITYCODE>'', 90, ''SEA'', 50';
END
GO
