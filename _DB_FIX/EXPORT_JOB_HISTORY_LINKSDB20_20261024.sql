/*===============================================================================================
  EXPORT_JOB_HISTORY_LINKSDB20_20261024.sql         (LinksDB20)

  Why  : Export job view (export/Consignment/view/:expt_no) gets a History card for Links SA users - phase 1, read-only.
         Links already records who changed what on a job, in three places nobody can see from the ERP:
           dbo.TBL_USERTRACK_EXPTMASTER  written by the job screens' procedures since 2020-04 (ADD / AUTOJOB creation
                                         snapshot, EDIT, DBFIX; pipe-delimited COLUMNNAME / ORIGINALDATA / MODIFIEDDATA).
                                         About 139k rows and NO index, so finding one job's rows scans all of them.
           dbo.EXPT_JOB_TRACKING_LOG     the tracking module (and the Sheet view mirror, CHANGED_IP 'EXPORT SHEET VIEW').
           dbo.TBL_EXPT_SHEET_LOG        Sheet view history (rows linked to a job through TBL_EXPT_SHEET_ROW.EXPTNO).
         This script adds one read-only procedure that returns them together, and the index that lets it find a
         job's audit rows without a table scan. The Links API calls it as POST api/Export/JobHistory.

  Creates (nothing existing is altered):
    proc   dbo.USP_EXPT_JOB_HISTORY(@EXPTNO, @USER_ID)  - read-only, temp tables only; its header says what it returns.
    index  IX_TBL_USERTRACK_EXPTMASTER_CODE  nonclustered on dbo.TBL_USERTRACK_EXPTMASTER (CODE, DATETIME), only when the
           table has no index on CODE yet. The table is a heap of about 150 MB and this is Standard Edition (no ONLINE
           index build): while the index builds (a few seconds), inserts into TBL_USERTRACK_EXPTMASTER wait, which means
           job saves on the Export screens pause for that long. Run the script at a quiet moment.

  Safety : step 1 checks everything first and stops before creating anything if one check fails: the database is
           LinksDB20, the login may CREATE PROCEDURE and ALTER the audit table (for the index), every table / column
           the procedure reads exists, the procedure name is free or a procedure this script created before (its text
           names this file - a same-named procedure from anywhere else stops the script), and the index name is free
           on the audit table or already this script's index (keys CODE, DATETIME). The procedure is dropped (only ever
           this script's own) and recreated; the index is created only when absent. No row of any table is written.
           Re-runnable. The last step only reads (one EXEC with an empty user, which returns STATUS 104 and reads no
           job data).
  Rollback: ROLLBACK_EXPORT_JOB_HISTORY_LINKSDB20_20261024.sql
  Run as : any login that may create procedures and indexes on LinksDB20 (normal login). SQL Server 2008 R2 (no
           CREATE OR ALTER, DROP IF EXISTS, STRING_SPLIT, TRY_CONVERT, IIF, CONCAT, FORMAT).
===============================================================================================*/
USE [LinksDB20]
GO
SET NOCOUNT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_PADDING ON;
GO

/* ---- 1. prerequisites (read-only) ---------------------------------------------------------- */
SET NOEXEC OFF;
DECLARE @problems TABLE (n INT IDENTITY(1,1), problem VARCHAR(600));
DECLARE @marker   VARCHAR(100);
SET @marker = 'EXPORT_JOB_HISTORY_LINKSDB20_20261024';      -- the procedure below carries this text

-- 1a. we must really be on LinksDB20 (if USE failed above the session is still in another DB)
IF UPPER(DB_NAME()) <> 'LINKSDB20'
    INSERT INTO @problems (problem) VALUES ('Connected to ' + DB_NAME() + ', not LinksDB20.');

-- 1b. permissions
IF ISNULL(HAS_PERMS_BY_NAME(DB_NAME(), 'DATABASE', 'CREATE PROCEDURE'), 0) = 0
    INSERT INTO @problems (problem) VALUES ('No CREATE PROCEDURE permission on ' + DB_NAME() + '.');
IF ISNULL(HAS_PERMS_BY_NAME('dbo', 'SCHEMA', 'ALTER'), 0) = 0
    INSERT INTO @problems (problem) VALUES ('No ALTER permission on schema dbo (needed to create the procedure in it).');
IF OBJECT_ID('dbo.TBL_USERTRACK_EXPTMASTER', 'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.TBL_USERTRACK_EXPTMASTER') AND name = 'IX_TBL_USERTRACK_EXPTMASTER_CODE')
   AND ISNULL(HAS_PERMS_BY_NAME('dbo.TBL_USERTRACK_EXPTMASTER', 'OBJECT', 'ALTER'), 0) = 0
    INSERT INTO @problems (problem) VALUES ('No ALTER permission on dbo.TBL_USERTRACK_EXPTMASTER (needed to create its index).');

-- 1c. every table and column the procedure reads
INSERT INTO @problems (problem)
SELECT 'Column dbo.' + x.t + '.' + x.c + ' not found.'
  FROM (VALUES
        ('TBL_USERTRACK_EXPTMASTER', 'TRACKID'), ('TBL_USERTRACK_EXPTMASTER', 'USERID'), ('TBL_USERTRACK_EXPTMASTER', 'DATETIME'),
        ('TBL_USERTRACK_EXPTMASTER', 'MODE'), ('TBL_USERTRACK_EXPTMASTER', 'TABLENAME'), ('TBL_USERTRACK_EXPTMASTER', 'COLUMNNAME'),
        ('TBL_USERTRACK_EXPTMASTER', 'ORIGINALDATA'), ('TBL_USERTRACK_EXPTMASTER', 'MODIFIEDDATA'), ('TBL_USERTRACK_EXPTMASTER', 'RECORDID'),
        ('TBL_USERTRACK_EXPTMASTER', 'CODE'), ('TBL_USERTRACK_EXPTMASTER', 'LOCALIPADD'), ('TBL_USERTRACK_EXPTMASTER', 'ROUTERIPADD'),
        ('EXPT_JOB_TRACKING_LOG', 'ID'), ('EXPT_JOB_TRACKING_LOG', 'EXPTNO'), ('EXPT_JOB_TRACKING_LOG', 'FIELD_NAME'),
        ('EXPT_JOB_TRACKING_LOG', 'OLD_VALUE'), ('EXPT_JOB_TRACKING_LOG', 'NEW_VALUE'), ('EXPT_JOB_TRACKING_LOG', 'CHANGED_BY'),
        ('EXPT_JOB_TRACKING_LOG', 'CHANGED_IP'), ('EXPT_JOB_TRACKING_LOG', 'CHANGED_DT'),
        ('TBL_EXPT_SHEET_LOG', 'ID'), ('TBL_EXPT_SHEET_LOG', 'ROW_KIND'), ('TBL_EXPT_SHEET_LOG', 'ROW_ID'), ('TBL_EXPT_SHEET_LOG', 'COL_KEY'),
        ('TBL_EXPT_SHEET_LOG', 'OLD_VALUE'), ('TBL_EXPT_SHEET_LOG', 'NEW_VALUE'), ('TBL_EXPT_SHEET_LOG', 'ACTION'), ('TBL_EXPT_SHEET_LOG', 'USER_ID'),
        ('TBL_EXPT_SHEET_LOG', 'USER_NAME'), ('TBL_EXPT_SHEET_LOG', 'LOG_DT'), ('TBL_EXPT_SHEET_ROW', 'ID'), ('TBL_EXPT_SHEET_ROW', 'EXPTNO'),
        ('EXPT_MASTER', 'ID'), ('EXPT_MASTER', 'EXPTNO'), ('EXPT_MASTER', 'CMPCODE'), ('EXPT_MASTER', 'CITYCODE'),
        ('EXPT_MASTER', 'USERNAME'), ('EXPT_MASTER', 'SYSEXPT_DOCRECD'),
        ('CMP_DTLS', 'CMPID'), ('CMP_DTLS', 'CMP_USERCODE'), ('CMP_DTLS', 'CMP_USERNAME'), ('CMP_DTLS', 'FULLNAME'), ('CMP_DTLS', 'RoleType')
       ) x (t, c)
 WHERE COL_LENGTH('dbo.' + x.t, x.c) IS NULL;

-- 1d. the procedure name: free, or a procedure this script created on an earlier run
INSERT INTO @problems (problem)
SELECT 'dbo.USP_EXPT_JOB_HISTORY already exists (' + o.type_desc + ') and was not created by this script - it would be replaced. Compare it with this script first.'
  FROM sys.objects o
 WHERE o.object_id = OBJECT_ID('dbo.USP_EXPT_JOB_HISTORY')
   AND (o.type <> 'P' OR CHARINDEX(@marker, ISNULL(OBJECT_DEFINITION(o.object_id), '')) = 0);

-- 1e. the index name on the audit table: free, or this script's index (keys CODE, DATETIME in that order, nothing else)
IF EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.TBL_USERTRACK_EXPTMASTER') AND name = 'IX_TBL_USERTRACK_EXPTMASTER_CODE')
   AND ISNULL((SELECT STUFF((SELECT ',' + c.name
                               FROM sys.indexes i
                                    JOIN sys.index_columns ic ON ic.object_id = i.object_id AND ic.index_id = i.index_id
                                    JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
                              WHERE i.object_id = OBJECT_ID('dbo.TBL_USERTRACK_EXPTMASTER') AND i.name = 'IX_TBL_USERTRACK_EXPTMASTER_CODE'
                              ORDER BY ic.is_included_column, ic.key_ordinal, c.name
                                FOR XML PATH('')), 1, 1, '')), '') <> 'CODE,DATETIME'
    INSERT INTO @problems (problem) VALUES ('dbo.TBL_USERTRACK_EXPTMASTER already has an index named IX_TBL_USERTRACK_EXPTMASTER_CODE on other columns - not this script''s; rename one of them first.');

IF EXISTS (SELECT 1 FROM @problems)
BEGIN
    PRINT '*** Prerequisite check failed on ' + DB_NAME() + ' - NOTHING was created or dropped:';
    SELECT n AS [#], problem FROM @problems ORDER BY n;
    RAISERROR('Prerequisite check failed - see the list above.', 16, 1);
    SET NOEXEC ON;     -- skip the rest of the script, including the CREATEs below
END
ELSE
    PRINT 'Prerequisites OK on ' + DB_NAME() + '.';
GO

/* ---- 2. index on the audit table (only when the table has none on CODE) -------------------- */
-- Blocks inserts into TBL_USERTRACK_EXPTMASTER while it builds (Standard Edition: no ONLINE build) - a few seconds.
DECLARE @t0 DATETIME, @other SYSNAME;
SELECT TOP 1 @other = i.name
  FROM sys.indexes i
       JOIN sys.index_columns ic ON ic.object_id = i.object_id AND ic.index_id = i.index_id AND ic.key_ordinal = 1
       JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
 WHERE i.object_id = OBJECT_ID('dbo.TBL_USERTRACK_EXPTMASTER') AND c.name = 'CODE';

IF EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.TBL_USERTRACK_EXPTMASTER') AND name = 'IX_TBL_USERTRACK_EXPTMASTER_CODE')
    PRINT 'IX_TBL_USERTRACK_EXPTMASTER_CODE already exists - left as it is.';
ELSE IF @other IS NOT NULL
    PRINT 'dbo.TBL_USERTRACK_EXPTMASTER already has an index leading with CODE (' + @other + ') - IX_TBL_USERTRACK_EXPTMASTER_CODE not created.';
ELSE
BEGIN
    SET @t0 = GETDATE();
    CREATE NONCLUSTERED INDEX IX_TBL_USERTRACK_EXPTMASTER_CODE ON dbo.TBL_USERTRACK_EXPTMASTER (CODE, [DATETIME]);
    PRINT 'IX_TBL_USERTRACK_EXPTMASTER_CODE created in ' + CONVERT(VARCHAR(20), DATEDIFF(MILLISECOND, @t0, GETDATE())) + ' ms.';
END
GO

/* ---- 3. dbo.USP_EXPT_JOB_HISTORY ----------------------------------------------------------- */
IF OBJECT_ID('dbo.USP_EXPT_JOB_HISTORY', 'P') IS NOT NULL
    DROP PROCEDURE dbo.USP_EXPT_JOB_HISTORY;      -- step 1 made sure it is this script's own
GO
CREATE PROCEDURE dbo.USP_EXPT_JOB_HISTORY
    @EXPTNO  VARCHAR(25),
    @USER_ID VARCHAR(50)
AS
BEGIN
    -- Deployed by links-22/_DB_FIX/EXPORT_JOB_HISTORY_LINKSDB20_20261024.sql (Export job view > History). Do not edit here: change that script.
    -- Read-only: writes temp tables only. The history of one export job, from the audit rows Links already keeps:
    --   SRC 'JOB'      dbo.TBL_USERTRACK_EXPTMASTER where CODE = the job (job screens: ADD / AUTOJOB = creation snapshot,
    --                  EDIT, DBFIX, ...; COLUMNNAME / ORIGINALDATA / MODIFIEDDATA are the stored pipe-delimited lists).
    --   SRC 'TRACKING' dbo.EXPT_JOB_TRACKING_LOG of the job, one field per row (IP 'EXPORT SHEET VIEW' = Sheet view mirror).
    --   SRC 'SHEET'    dbo.TBL_EXPT_SHEET_LOG, ROW_KIND 'W': every entry of the sheet rows linked to the job now, plus the
    --                  link / convert / unlink entries that name the job (rows linked to it earlier). One field per row.
    -- @USER_ID is the login's CMPID (or cmp_usercode). Only Links SA users (cmp_dtls.RoleType 'SA', the login's ROLETYPE)
    -- get the history.
    -- Returns
    --   not SA       Table:  STATUS '104', STATUSTEXT
    --   unknown job  Table:  STATUS '103', STATUSTEXT
    --   otherwise    Table:  STATUS '100', STATUSTEXT '', EXPTNO, CMPCODE, CITYCODE, CREATED_BY (expt_master.username),
    --                        CREATED_BY_NAME, DOCRECD (dd-mm-yyyy), EVENTS (rows in Table1)
    --                Table1: SRC, EVENT_ID, EVENT_DT, USER_ID, USER_NAME, MODE (sheet: ACTION), TABLENAME, COLUMNNAME,
    --                        ORIGINALDATA, MODIFIEDDATA, IP, RECORD_ID - oldest first. Values are returned raw; the page
    --                        pairs the pipe lists and drops unchanged values.
    SET NOCOUNT ON;

    DECLARE @NO VARCHAR(25), @CODE NVARCHAR(100), @UID VARCHAR(50), @FOUND BIT, @CMPCODE VARCHAR(6), @CITYCODE VARCHAR(3),
            @OWNER VARCHAR(20), @OWNER_NAME VARCHAR(60), @DOCRECD DATETIME, @N INT;
    SET @NO   = LTRIM(RTRIM(ISNULL(@EXPTNO, '')));
    SET @CODE = CONVERT(NVARCHAR(100), @NO);          -- TBL_USERTRACK_EXPTMASTER.CODE is NVARCHAR(100): seek on its index
    SET @UID  = LTRIM(RTRIM(ISNULL(@USER_ID, '')));

    -- Links SA only. Same test as the Sheet view procedures: the CMPID (e.g. 37) or the user code (e.g. P100037) of an
    -- SA user.
    IF @UID = '' OR NOT EXISTS (SELECT 1 FROM dbo.cmp_dtls C
                                WHERE (CONVERT(VARCHAR(50), C.cmpid) = @UID OR LTRIM(RTRIM(C.cmp_usercode)) = @UID)
                                  AND LTRIM(RTRIM(ISNULL(C.RoleType, ''))) = 'SA')
    BEGIN
        SELECT '104' AS STATUS, N'Only administrators can see job history.' AS STATUSTEXT;
        RETURN;
    END

    -- the job (an export number can be in expt_master twice: the first-opened one is the header)
    SET @FOUND = 0;
    SELECT TOP 1 @FOUND = 1, @CMPCODE = LTRIM(RTRIM(E.cmpcode)), @CITYCODE = LTRIM(RTRIM(E.citycode)),
                 @OWNER = LTRIM(RTRIM(E.username)), @DOCRECD = E.sysexpt_docrecd
    FROM   dbo.EXPT_MASTER E
    WHERE  E.exptno = @NO AND @NO <> ''
    ORDER BY E.sysexpt_docrecd, E.id;

    IF @FOUND = 0
    BEGIN
        SELECT '103' AS STATUS,
               CASE WHEN @NO = '' THEN N'No export number given.' ELSE N'Export job ' + @NO + N' not found.' END AS STATUSTEXT;
        RETURN;
    END

    IF ISNULL(@OWNER, '') <> ''
        SELECT TOP 1 @OWNER_NAME = COALESCE(NULLIF(LTRIM(RTRIM(C.fullname)), ''), NULLIF(LTRIM(RTRIM(C.cmp_username)), ''))
        FROM   dbo.cmp_dtls C
        WHERE  CONVERT(VARCHAR(50), C.cmpid) = @OWNER OR LTRIM(RTRIM(C.cmp_usercode)) = @OWNER
        ORDER BY CASE WHEN CONVERT(VARCHAR(50), C.cmpid) = @OWNER THEN 0 ELSE 1 END;

    IF OBJECT_ID('tempdb..#JH_EV') IS NOT NULL DROP TABLE #JH_EV;
    CREATE TABLE #JH_EV (
        SEQ          INT IDENTITY(1,1) NOT NULL,
        SRC          VARCHAR(10)                              NOT NULL,
        EVENT_ID     BIGINT                                   NOT NULL,
        EVENT_DT     DATETIME                                 NULL,
        USER_ID      NVARCHAR(50)   COLLATE DATABASE_DEFAULT  NULL,
        USER_NAME    NVARCHAR(100)  COLLATE DATABASE_DEFAULT  NULL,
        MODE         NVARCHAR(50)   COLLATE DATABASE_DEFAULT  NULL,
        TABLENAME    NVARCHAR(100)  COLLATE DATABASE_DEFAULT  NULL,
        COLUMNNAME   NVARCHAR(4000) COLLATE DATABASE_DEFAULT  NULL,
        ORIGINALDATA NVARCHAR(4000) COLLATE DATABASE_DEFAULT  NULL,
        MODIFIEDDATA NVARCHAR(4000) COLLATE DATABASE_DEFAULT  NULL,
        IP           NVARCHAR(110)  COLLATE DATABASE_DEFAULT  NULL,
        RECORD_ID    NVARCHAR(100)  COLLATE DATABASE_DEFAULT  NULL
    );

    -- JOB: the job screens' audit rows (IX_TBL_USERTRACK_EXPTMASTER_CODE). IP = local address, plus the router address
    -- when it differs.
    INSERT INTO #JH_EV (SRC, EVENT_ID, EVENT_DT, USER_ID, MODE, TABLENAME, COLUMNNAME, ORIGINALDATA, MODIFIEDDATA, IP, RECORD_ID)
    SELECT 'JOB', U.TRACKID, U.[DATETIME], LTRIM(RTRIM(U.USERID)), LTRIM(RTRIM(U.MODE)), LTRIM(RTRIM(U.TABLENAME)),
           U.COLUMNNAME, U.ORIGINALDATA, U.MODIFIEDDATA,
           CASE WHEN ISNULL(U.ROUTERIPADD, N'') = N'' OR U.ROUTERIPADD = U.LOCALIPADD THEN NULLIF(U.LOCALIPADD, N'')
                WHEN ISNULL(U.LOCALIPADD, N'') = N'' THEN U.ROUTERIPADD
                ELSE U.LOCALIPADD + N' / ' + U.ROUTERIPADD END,
           NULLIF(LTRIM(RTRIM(U.RECORDID)), N'')
    FROM   dbo.TBL_USERTRACK_EXPTMASTER U
    WHERE  U.CODE = @CODE;

    -- TRACKING: the tracking module's field log (IX_EXPT_JOB_TRACKING_LOG_EXPTNO)
    INSERT INTO #JH_EV (SRC, EVENT_ID, EVENT_DT, USER_ID, MODE, TABLENAME, COLUMNNAME, ORIGINALDATA, MODIFIEDDATA, IP, RECORD_ID)
    SELECT 'TRACKING', T.ID, T.CHANGED_DT, LTRIM(RTRIM(T.CHANGED_BY)), N'EDIT', N'EXPT_JOB_TRACKING', LTRIM(RTRIM(T.FIELD_NAME)),
           T.OLD_VALUE, T.NEW_VALUE, NULLIF(LTRIM(RTRIM(T.CHANGED_IP)), ''), NULL
    FROM   dbo.EXPT_JOB_TRACKING_LOG T
    WHERE  T.EXPTNO = @NO;

    -- SHEET 1: every WO-row entry of the sheet rows linked to the job now (IX_TBL_EXPT_SHEET_ROW_EXPTNO, IX_TBL_EXPT_SHEET_LOG_ROW)
    INSERT INTO #JH_EV (SRC, EVENT_ID, EVENT_DT, USER_ID, USER_NAME, MODE, TABLENAME, COLUMNNAME, ORIGINALDATA, MODIFIEDDATA, IP, RECORD_ID)
    SELECT 'SHEET', L.ID, L.LOG_DT, LTRIM(RTRIM(L.USER_ID)), NULLIF(LTRIM(RTRIM(L.USER_NAME)), N''), L.ACTION, N'TBL_EXPT_SHEET_ROW',
           L.COL_KEY, L.OLD_VALUE, L.NEW_VALUE, NULL, CONVERT(NVARCHAR(100), L.ROW_ID)
    FROM   dbo.TBL_EXPT_SHEET_ROW R
           JOIN dbo.TBL_EXPT_SHEET_LOG L ON L.ROW_KIND = 'W' AND L.ROW_ID = R.ID
    WHERE  R.EXPTNO = @NO;

    -- SHEET 2: link / convert / unlink entries naming the job, of rows no longer linked to it (no index on the values:
    -- this reads the sheet log once)
    INSERT INTO #JH_EV (SRC, EVENT_ID, EVENT_DT, USER_ID, USER_NAME, MODE, TABLENAME, COLUMNNAME, ORIGINALDATA, MODIFIEDDATA, IP, RECORD_ID)
    SELECT 'SHEET', L.ID, L.LOG_DT, LTRIM(RTRIM(L.USER_ID)), NULLIF(LTRIM(RTRIM(L.USER_NAME)), N''), L.ACTION, N'TBL_EXPT_SHEET_ROW',
           L.COL_KEY, L.OLD_VALUE, L.NEW_VALUE, NULL, CONVERT(NVARCHAR(100), L.ROW_ID)
    FROM   dbo.TBL_EXPT_SHEET_LOG L
    WHERE  L.ROW_KIND = 'W'
      AND  ((L.ACTION IN ('link', 'convert') AND L.COL_KEY = 'FF_JOB' AND L.NEW_VALUE = @CODE)
            OR (L.ACTION = 'unlink' AND L.COL_KEY = 'EXPTNO' AND L.OLD_VALUE = @CODE))
      AND  NOT EXISTS (SELECT 1 FROM #JH_EV X WHERE X.SRC = 'SHEET' AND X.EVENT_ID = L.ID);

    -- user names: the name the sheet stored, else cmp_dtls by CMPID, else by user code
    UPDATE E
    SET    USER_NAME = COALESCE(E.USER_NAME, NM.NM)
    FROM   #JH_EV E
           OUTER APPLY (SELECT TOP 1 COALESCE(NULLIF(LTRIM(RTRIM(C.fullname)), ''), NULLIF(LTRIM(RTRIM(C.cmp_username)), '')) AS NM
                        FROM   dbo.cmp_dtls C
                        WHERE  CONVERT(NVARCHAR(50), C.cmpid) = E.USER_ID OR LTRIM(RTRIM(C.cmp_usercode)) = E.USER_ID
                        ORDER BY CASE WHEN CONVERT(NVARCHAR(50), C.cmpid) = E.USER_ID THEN 0 ELSE 1 END) NM
    WHERE  ISNULL(E.USER_ID, N'') <> N'';

    SELECT @N = COUNT(*) FROM #JH_EV;

    -- Table: status + job header
    SELECT '100' AS STATUS, N'' AS STATUSTEXT, @NO AS EXPTNO, @CMPCODE AS CMPCODE, @CITYCODE AS CITYCODE,
           @OWNER AS CREATED_BY, @OWNER_NAME AS CREATED_BY_NAME, CONVERT(VARCHAR(10), @DOCRECD, 105) AS DOCRECD, @N AS EVENTS;

    -- Table1: the events, oldest first
    SELECT SRC, EVENT_ID, EVENT_DT, USER_ID, USER_NAME, MODE, TABLENAME, COLUMNNAME, ORIGINALDATA, MODIFIEDDATA, IP, RECORD_ID
    FROM   #JH_EV
    ORDER BY EVENT_DT, CASE SRC WHEN 'JOB' THEN 0 WHEN 'TRACKING' THEN 1 ELSE 2 END, EVENT_ID;

    DROP TABLE #JH_EV;
END
GO

SET NOEXEC OFF;
GO

/* ---- 4. verify (read-only) ----------------------------------------------------------------- */
SELECT 'dbo.USP_EXPT_JOB_HISTORY' AS [object],
       CASE WHEN p.object_id IS NULL THEN '*** MISSING'
            WHEN CHARINDEX('EXPORT_JOB_HISTORY_LINKSDB20_20261024', OBJECT_DEFINITION(p.object_id)) > 0 THEN 'ok - this script'
            ELSE '*** NOT this script' END AS [state],
       CONVERT(VARCHAR(19), p.modify_date, 120) AS created
  FROM (SELECT 1 AS one) d
       LEFT JOIN sys.procedures p ON p.object_id = OBJECT_ID('dbo.USP_EXPT_JOB_HISTORY');

SELECT i.name AS [index on TBL_USERTRACK_EXPTMASTER], i.type_desc,
       STUFF((SELECT ',' + c.name
                FROM sys.index_columns ic JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
               WHERE ic.object_id = i.object_id AND ic.index_id = i.index_id
               ORDER BY ic.key_ordinal
                 FOR XML PATH('')), 1, 1, '') AS keys
  FROM sys.indexes i
 WHERE i.object_id = OBJECT_ID('dbo.TBL_USERTRACK_EXPTMASTER') AND i.type > 0;

IF OBJECT_ID('dbo.USP_EXPT_JOB_HISTORY', 'P') IS NOT NULL
BEGIN
    PRINT 'Smoke call with no user (expected: STATUS 104, no job data read):';
    EXEC dbo.USP_EXPT_JOB_HISTORY @EXPTNO = '', @USER_ID = '';
    PRINT 'Export job history: procedure in place on ' + DB_NAME() + '. Next: publish the Links API (api/Export/JobHistory).';
END
ELSE
    PRINT '*** dbo.USP_EXPT_JOB_HISTORY is missing on ' + DB_NAME() + ' - see the messages above.';
GO
