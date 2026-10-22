/*===============================================================================================
  TEST_EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql         (LinksDB20)

  Post-deploy self-test of EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql (Export > Sheet view). Run it once after that script.

  What it does: inside ONE transaction that is always rolled back at the end, it creates a throwaway month
  (CMPCODE ZZ, CITYCODE ZZZ, SHEET_MONTH 1900-01), a test role ZZTEST and three fake users that exist nowhere in
  Links (ZZT_EDITOR holds ZZTEST, ZZT_ADMIN holds ADMIN, ZZT_NONE holds nothing) - plus one real Links SA user, picked
  read only and used only inside the transaction, to show that SA counts as sheet ADMIN - and drives the procedures: month
  create / duplicate / rename / copy with carried rows, row insert / duplicate / move / delete / restore, cell saves
  (date normalisation, ranges and notes kept, a version conflict, the owner hard lock, ADMIN, an ALL-owned column,
  refused keys and over-long values, no-change saves), linking to a real export job picked read-only (a job of another
  branch is refused first; then the month is moved to the job's branch inside the transaction), the Links-owned live
  values and their lock, the mirror into EXPT_JOB_TRACKING (+ its log), history and restore, cell formats and row
  status, the KPI, unlink, convert draft, legend / roles / aliases / alias seed / views, grid rows, tab layouts and
  changes-since. Each check prints PASS or FAIL (Messages tab; the same list comes back as the last result grid).
  The procedures' own result sets also come back as grids - they can be ignored.

  Leaves no trace: everything is rolled back; the last checks prove it (no 1900-xx month, no ZZ role / users / alias /
  status, the job's EXPT_JOB_TRACKING row and log exactly as before, every Sheet view table back to its row count).
  The only thing SQL Server never rolls back is IDENTITY counters: the next real row of a Sheet view table (and of
  EXPT_JOB_TRACKING_LOG) gets an id a few numbers higher - printed at the end. If the transaction were ever lost
  (it cannot be committed by this script), the test stops at once and says so.

  While it runs (a few seconds) it holds row locks on what it writes, including the picked job's EXPT_JOB_TRACKING
  row: run it at a quiet moment (a real user writing to a Sheet view table meanwhile would also make the "row count"
  no-trace check fail). IF YOU STOP IT PART WAY: run ROLLBACK TRANSACTION in the same window, and never answer Yes
  when SSMS offers to commit open transactions on closing it. Nothing is sent anywhere; no user gets any right.

  Run as : the login that ran EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql. SQL Server 2008 R2.
===============================================================================================*/
USE [LinksDB20]
GO
SET NOCOUNT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET ARITHABORT ON;
SET CONCAT_NULL_YIELDS_NULL ON;
SET XACT_ABORT ON;        -- a cancel, a timeout or an error outside the checks rolls the test transaction back by itself
                          -- (the procedures switch it off for themselves inside a caller's transaction)
GO

DECLARE @STEP NVARCHAR(200), @HS VARCHAR(3), @HT NVARCHAR(1000), @H1 INT, @H2 INT, @H3 INT, @HN INT, @X NVARCHAR(MAX), @IDS VARCHAR(100),
        @M INT, @R1 INT, @R2 INT, @R3 INT, @R4 INT, @R5 INT, @RA INT, @RB INT, @RC INT, @G1 INT, @V INT, @VIEWID INT, @LOGID BIGINT,
        @LOGN INT, @TLOGN INT, @KOWN VARCHAR(40), @ALLREMARK BIT, @T0 DATETIME, @OK BIT, @PASS INT, @FAIL INT, @i INT, @n INT,
        @JOB VARCHAR(25), @JCMP VARCHAR(6), @JCITY VARCHAR(3), @JINV NVARCHAR(4000), @JPOD NVARCHAR(4000), @JCON NVARCHAR(4000), @JCONCODE VARCHAR(50),
        @P_EXISTS BIT, @P_SUM INT, @P_TLOG INT, @P_TS VARCHAR(40), @P_SC VARCHAR(10), @P_DO_ETD DATETIME, @P_LC_DATE DATETIME,
        @P_DO_RECEIVE_DT DATETIME, @P_ROWS BIGINT, @A_ROWS BIGINT, @A_SUM INT, @A_EXISTS BIT, @A_TLOG INT, @NM NVARCHAR(MAX), @DT NVARCHAR(MAX), @RAISED BIT, @ERRMSG NVARCHAR(MAX),
        @SAID VARCHAR(50), @P_SALOG INT, @A_SALOG INT, @G2 INT, @T1 DATETIME, @KV NVARCHAR(200);
DECLARE @RES TABLE (N INT IDENTITY(1,1) PRIMARY KEY, OK BIT NOT NULL, CHECK_NAME NVARCHAR(400) NOT NULL, DETAIL NVARCHAR(MAX) NULL);
DECLARE @IDENT TABLE (T SYSNAME NOT NULL PRIMARY KEY, BEFORE_ID NUMERIC(38, 0) NULL);
SELECT @HN = 0, @T0 = DATEADD(MINUTE, -1, GETDATE());

/* ---- 0. preconditions (read only) --------------------------------------------------------- */
IF UPPER(DB_NAME()) <> 'LINKSDB20'
BEGIN
    PRINT '*** Connected to ' + DB_NAME() + ', not LinksDB20. Nothing done.';
    RETURN;
END
IF @@TRANCOUNT > 0
BEGIN
    PRINT '*** A transaction is already open in this session - run the self-test in a fresh session. Nothing done.';
    RETURN;
END
IF (SELECT COUNT(*) FROM sys.procedures WHERE name LIKE 'USP[_]EXPT[_]SHEET[_]%'
      AND CHARINDEX('EXPORT_SHEET_VIEW_LINKSDB20_20261021', OBJECT_DEFINITION(object_id)) > 0) <> 36
   OR (SELECT COUNT(*) FROM sys.tables WHERE name IN ('TBL_EXPT_SHEET_MONTH', 'TBL_EXPT_SHEET_ROW', 'TBL_EXPT_SHEET_GRIDROW', 'TBL_EXPT_SHEET_TABMETA', 'TBL_EXPT_SHEET_STATUS', 'TBL_EXPT_SHEET_ROLE', 'TBL_EXPT_SHEET_ROLE_COL', 'TBL_EXPT_SHEET_ROLE_USER', 'TBL_EXPT_SHEET_ALIAS', 'TBL_EXPT_SHEET_LOG', 'TBL_EXPT_SHEET_VIEW')) <> 11
BEGIN
    PRINT '*** The 11 tables / 36 procedures of EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql are not all in place. Run that script first. Nothing done.';
    RETURN;
END
IF EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_MONTH WHERE SHEET_MONTH LIKE '1900-%')
   OR EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_ROLE WHERE CODE = 'ZZTEST')
   OR EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_STATUS WHERE CODE = 'ZZTEST')
BEGIN
    PRINT '*** A 1900-xx month or a ZZTEST role / status already exists - a self-test left something behind? Look at it first. Nothing done.';
    RETURN;
END

-- the seeds
INSERT INTO @RES (OK, CHECK_NAME, DETAIL)
SELECT CASE WHEN (SELECT COUNT(*) FROM dbo.TBL_EXPT_SHEET_STATUS WHERE CODE IN ('COMPLETE', 'SI_DONE', 'BKG_RELEASE', 'HAZ', 'PLAN_CHANGED', 'BKG_AVAILABLE',
                  'TAKE_BKG', 'LC_AWAITED', 'HOLD', 'UNKNOWN')) = 10 THEN 1 ELSE 0 END, N'S00 seeds | the 10 Colour CODE statuses', NULL
UNION ALL
SELECT CASE WHEN (SELECT COUNT(*) FROM dbo.TBL_EXPT_SHEET_ROLE WHERE CODE IN ('OPS', 'BOOKING', 'OPSLEAD', 'DOCS', 'BLDESK', 'YARD', 'ALL', 'ADMIN')) = 8
            THEN 1 ELSE 0 END, N'S00 seeds | the 8 roles', NULL
UNION ALL
SELECT CASE WHEN EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_ROLE_COL) THEN 1 ELSE 0 END, N'S00 seeds | column owners present',
       N'rows: ' + CONVERT(NVARCHAR(10), (SELECT COUNT(*) FROM dbo.TBL_EXPT_SHEET_ROLE_COL))
UNION ALL
SELECT CASE WHEN (SELECT COUNT(*) FROM dbo.tbl_Mst_Form WHERE pk_FormId IN (448, 449, 450) AND fk_ModuleId = 3
                  AND FormName IN ('sheet-view.component.html', 'sheet-view.convert', 'sheet-view.settings')) = 3 THEN 1 ELSE 0 END,
       N'S00 seeds | form rows 448-450 (module 3)', NULL;
SELECT @n = COUNT(*) FROM dbo.tbl_Mst_FormWiseRights WHERE fk_FormId IN (448, 449, 450);
PRINT 'Info: ' + CONVERT(VARCHAR(10), @n) + ' form-wise rights row(s) on 448-450 (0 right after the deploy: the script grants nothing).';

-- a real Bajaj export job, read only: the newest with an invoice no., not cancelled, held once in EXPT_MASTER;
-- one without an EXPT_JOB_TRACKING row first (so the mirror's insert path is tested)
;WITH C AS (SELECT TOP 300 E.EXPTNO, E.CMPCODE, E.CITYCODE, E.ID FROM dbo.EXPT_MASTER E
            WHERE E.EXPT_EXPORTER = 'E100001' AND ISNULL(E.EXPTCANCEL, '') <> 'Y' AND LTRIM(RTRIM(ISNULL(E.EXPT_INVNO, ''))) <> ''
              AND LTRIM(RTRIM(ISNULL(E.EXPT_CONSIGNEE, ''))) <> '' AND LTRIM(RTRIM(ISNULL(E.EXPT_POD, ''))) <> ''
              AND LTRIM(RTRIM(ISNULL(E.CMPCODE, ''))) <> '' AND LTRIM(RTRIM(ISNULL(E.CITYCODE, ''))) <> ''
              AND EXISTS (SELECT 1 FROM dbo.CONSIGNEE_MASTER CM WHERE CM.CON_CODE = E.EXPT_CONSIGNEE AND LTRIM(RTRIM(ISNULL(CM.CON_NAME, ''))) <> '')
            ORDER BY E.ID DESC),
      D AS (SELECT E.EXPTNO FROM dbo.EXPT_MASTER E JOIN C ON C.EXPTNO = E.EXPTNO GROUP BY E.EXPTNO HAVING COUNT(*) = 1)
SELECT TOP 1 @JOB = LTRIM(RTRIM(C.EXPTNO)), @JCMP = LTRIM(RTRIM(C.CMPCODE)), @JCITY = LTRIM(RTRIM(C.CITYCODE))
FROM   C JOIN D ON D.EXPTNO = C.EXPTNO
ORDER BY CASE WHEN EXISTS (SELECT 1 FROM dbo.EXPT_JOB_TRACKING T WHERE T.EXPTNO = C.EXPTNO) THEN 1 ELSE 0 END, C.ID DESC;
IF @JOB IS NULL
BEGIN
    PRINT '*** No Bajaj export job found to link to (E100001 with an invoice no.). Nothing done.';
    RETURN;
END
SELECT @JINV = LTRIM(RTRIM(ISNULL(E.EXPT_INVNO, ''))), @JPOD = LTRIM(RTRIM(ISNULL(E.EXPT_POD, ''))), @JCONCODE = LTRIM(RTRIM(ISNULL(E.EXPT_CONSIGNEE, ''))),
       @JCON = (SELECT MAX(LTRIM(RTRIM(CM.CON_NAME))) FROM dbo.CONSIGNEE_MASTER CM WHERE CM.CON_CODE = E.EXPT_CONSIGNEE)
FROM   dbo.EXPT_MASTER E WHERE E.EXPTNO = @JOB;
PRINT 'Self-test job (read only): ' + @JOB + ' (' + @JCMP + ' / ' + @JCITY + ', WO ' + @JINV + ').';

-- the job's tracking row before the test (compared again after the rollback)
SELECT @P_EXISTS = 0, @P_TLOG = 0;
SELECT @P_EXISTS = 1, @P_SUM = BINARY_CHECKSUM(*), @P_TS = TRACKING_STATUS, @P_SC = SHIPMENT_CATEGORY, @P_DO_ETD = DO_ETD, @P_LC_DATE = LC_DATE,
       @P_DO_RECEIVE_DT = DO_RECEIVE_DT
FROM   dbo.EXPT_JOB_TRACKING WHERE EXPTNO = @JOB;
SELECT @P_TLOG = COUNT(*) FROM dbo.EXPT_JOB_TRACKING_LOG WHERE EXPTNO = @JOB;
SELECT @P_ROWS = (SELECT COUNT_BIG(*) FROM dbo.TBL_EXPT_SHEET_MONTH)
               + (SELECT COUNT_BIG(*) FROM dbo.TBL_EXPT_SHEET_ROW)
               + (SELECT COUNT_BIG(*) FROM dbo.TBL_EXPT_SHEET_GRIDROW)
               + (SELECT COUNT_BIG(*) FROM dbo.TBL_EXPT_SHEET_TABMETA)
               + (SELECT COUNT_BIG(*) FROM dbo.TBL_EXPT_SHEET_STATUS)
               + (SELECT COUNT_BIG(*) FROM dbo.TBL_EXPT_SHEET_ROLE)
               + (SELECT COUNT_BIG(*) FROM dbo.TBL_EXPT_SHEET_ROLE_COL)
               + (SELECT COUNT_BIG(*) FROM dbo.TBL_EXPT_SHEET_ROLE_USER)
               + (SELECT COUNT_BIG(*) FROM dbo.TBL_EXPT_SHEET_ALIAS)
               + (SELECT COUNT_BIG(*) FROM dbo.TBL_EXPT_SHEET_LOG)
               + (SELECT COUNT_BIG(*) FROM dbo.TBL_EXPT_SHEET_VIEW);
INSERT INTO @IDENT (T, BEFORE_ID)
SELECT x.t, IDENT_CURRENT('dbo.' + x.t) FROM (VALUES ('TBL_EXPT_SHEET_MONTH'), ('TBL_EXPT_SHEET_ROW'), ('TBL_EXPT_SHEET_GRIDROW'), ('TBL_EXPT_SHEET_LOG'),
                                                    ('TBL_EXPT_SHEET_VIEW'), ('EXPT_JOB_TRACKING_LOG')) x (t);

-- a column the test role does not own and nobody owns through ALL (for the owner lock check)
SELECT TOP 1 @KOWN = x.k
FROM   (VALUES (1, 'SB_NO'), (2, 'BL_NO'), (3, 'VSL_NAME'), (4, 'PICKUP_DT'), (5, 'BUFFER_YARD'), (6, 'SI_SUBMITTED_DT')) x (n, k)
WHERE  NOT EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_ROLE_COL RC WHERE RC.COL_KEY = x.k AND RC.ROLE_CODE = 'ALL')
ORDER BY x.n;
SET @ALLREMARK = CASE WHEN EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_ROLE_COL WHERE ROLE_CODE = 'ALL' AND COL_KEY = 'REMARK1') THEN 1 ELSE 0 END;

-- a Links SA user (cmp_dtls.RoleType = 'SA', the login's ROLETYPE), read only: the test acts as that CMPID inside the
-- rolled-back transaction (a fake SA would need a row in the live login table cmp_dtls, which this test never writes)
SELECT @SAID = CONVERT(VARCHAR(50), MIN(cmpid)) FROM dbo.cmp_dtls WHERE LTRIM(RTRIM(ISNULL(RoleType, ''))) = 'SA';
SELECT @P_SALOG = COUNT(*) FROM dbo.TBL_EXPT_SHEET_LOG WHERE USER_ID = ISNULL(@SAID, '?');
PRINT 'Self-test SA user (read only): CMPID ' + ISNULL(@SAID, 'none found') + '.';

IF OBJECT_ID('tempdb..#EXPT_SHEET_SELFTEST') IS NOT NULL DROP TABLE #EXPT_SHEET_SELFTEST;   -- left by an interrupted run
IF OBJECT_ID('tempdb..#SHEET_LK') IS NOT NULL DROP TABLE #SHEET_LK;
CREATE TABLE #EXPT_SHEET_SELFTEST (N INT IDENTITY(1,1) PRIMARY KEY, PROC_NAME VARCHAR(80) NULL, STATUS VARCHAR(3) NULL, STATUSTEXT NVARCHAR(1000) NULL,
                                   N1 INT NULL, N2 INT NULL, N3 INT NULL);

/* ---- 1. everything below runs in this transaction and is rolled back -------------------------- */
BEGIN TRANSACTION;

-- test role and users (fake ids: no Links user has them)
INSERT INTO dbo.TBL_EXPT_SHEET_ROLE (CODE, LABEL, SORT) VALUES ('ZZTEST', N'Self-test role', 99);
INSERT INTO dbo.TBL_EXPT_SHEET_ROLE_COL (ROLE_CODE, COL_KEY)
SELECT 'ZZTEST', x.k FROM (VALUES ('WO'), ('VEH'), ('QTY'), ('CONT'), ('STUFFING_DT'), ('DO_ETD'), ('DO_RECEIVE_DT'), ('LC_DATE'), ('GATE_OPEN_DT'), ('PLANT'), ('HAZ'), ('CONSIGNEE'), ('CNTR_DISPATCH_DT'), ('CONTAINER_NO')) x (k);
INSERT INTO dbo.TBL_EXPT_SHEET_ROLE_USER (ROLE_CODE, USER_ID, MAKER_ID) VALUES ('ZZTEST', 'ZZT_EDITOR', 'SELFTEST'), ('ADMIN', 'ZZT_ADMIN', 'SELFTEST');

-- ---- S01 create the throwaway month ZZ / ZZZ / 1900-01 ---------------------------------------------------
SET @STEP = N'S01 create the throwaway month ZZ / ZZZ / 1900-01';
SET @RAISED = 0;
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_MONTH_IU 0, 'ZZ', 'ZZZ', '1900-01', N'Sheet view self-test', N'[{"code":"ZZT","title":"Self-test","kind":"wo","layout":"A"},{"code":"SLPF","title":"Parts and frames","kind":"wo","layout":"B"}]', 0, 0, 0, 'ZZT_ADMIN', N'Self-test admin';
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN ISNULL(@HS, '') = '100' THEN 1 ELSE 0 END, @STEP + N' | ' + N'status 100', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_MONTH WHERE ID = @H1 AND CMPCODE = 'ZZ' AND CITYCODE = 'ZZZ' AND SHEET_MONTH = '1900-01') THEN 1 ELSE 0 END, @STEP + N' | ' + N'month row exists', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));

-- ---- S02 the same month again is refused -----------------------------------------------------------------
SET @STEP = N'S02 the same month again is refused';
SET @RAISED = 0;
SELECT @M = ID FROM dbo.TBL_EXPT_SHEET_MONTH WHERE CMPCODE = 'ZZ' AND CITYCODE = 'ZZZ' AND SHEET_MONTH = '1900-01';
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_MONTH_IU 0, 'ZZ', 'ZZZ', '1900-01', N'again', N'', 0, 0, 0, 'ZZT_ADMIN', N'Self-test admin';
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN ISNULL(@HS, '') = '102' THEN 1 ELSE 0 END, @STEP + N' | ' + N'status 102 (already exists)', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));

-- ---- S03 rows: insert 3 at the top of tab ZZT ------------------------------------------------------------
SET @STEP = N'S03 rows: insert 3 at the top of tab ZZT';
SET @RAISED = 0;
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_ROWS_OP @M, 'ZZT', 'insert', '', 0, 3, 'ZZT_EDITOR', N'Self-test editor';
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN ISNULL(@HS, '') = '100' THEN 1 ELSE 0 END, @STEP + N' | ' + N'status 100', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN (SELECT COUNT(*) FROM dbo.TBL_EXPT_SHEET_ROW WHERE MONTH_ID = @M AND TAB_CODE = 'ZZT' AND ROWVER = 1 AND ISDELETED = 0) = 3
            AND (SELECT COUNT(*) FROM dbo.TBL_EXPT_SHEET_LOG L JOIN dbo.TBL_EXPT_SHEET_ROW R ON R.ID = L.ROW_ID AND L.ROW_KIND = 'W' WHERE R.MONTH_ID = @M AND L.ACTION = 'insert') = 3 THEN 1 ELSE 0 END, @STEP + N' | ' + N'3 rows, ROWVER 1, 3 insert log rows', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));

-- ---- S04 rows: insert 1 after the first row --------------------------------------------------------------
SET @STEP = N'S04 rows: insert 1 after the first row';
SET @RAISED = 0;
SELECT @R1 = MAX(CASE WHEN RN = 1 THEN ID END), @R2 = MAX(CASE WHEN RN = 2 THEN ID END), @R3 = MAX(CASE WHEN RN = 3 THEN ID END)
FROM   (SELECT ID, ROW_NUMBER() OVER (ORDER BY SORT_ORDER, ID) AS RN FROM dbo.TBL_EXPT_SHEET_ROW WHERE MONTH_ID = @M AND TAB_CODE = 'ZZT') X;
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_ROWS_OP @M, 'ZZT', 'insert', '', @R1, 1, 'ZZT_EDITOR', N'Self-test editor';
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
SELECT @R4 = MAX(ID) FROM dbo.TBL_EXPT_SHEET_ROW WHERE MONTH_ID = @M AND TAB_CODE = 'ZZT' AND ID NOT IN (@R1, @R2, @R3);
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN ISNULL(@HS, '') = '100' THEN 1 ELSE 0 END, @STEP + N' | ' + N'status 100', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN (SELECT SORT_ORDER FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R4) > (SELECT SORT_ORDER FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R1) AND (SELECT SORT_ORDER FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R4) < (SELECT SORT_ORDER FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R2) THEN 1 ELSE 0 END, @STEP + N' | ' + N'the new row sits between rows 1 and 2', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));

-- ---- S05 save cells: 12 edits on row 1 (dates, a range, notes, HAZ) --------------------------------------
SET @STEP = N'S05 save cells: 12 edits on row 1 (dates, a range, notes, HAZ)';
SET @RAISED = 0;
SET @X = REPLACE(REPLACE(N'<e r="#R" v="#V" k="WO">ZZWO-1</e><e r="#R" v="#V" k="QTY">5</e><e r="#R" v="#V" k="VEH">MODEL A&#x0A;PARTS</e><e r="#R" v="#V" k="STUFFING_DT">14/10/2026</e><e r="#R" v="#V" k="DO_ETD">26-08/27-08</e><e r="#R" v="#V" k="DO_RECEIVE_DT">Will be updated</e><e r="#R" v="#V" k="LC_DATE">31-02-2026</e><e r="#R" v="#V" k="GATE_OPEN_DT">2026-10-15</e><e r="#R" v="#V" k="HAZ">YES</e><e r="#R" v="#V" k="PLANT">WA10</e><e r="#R" v="#V" k="CONSIGNEE">ZZ CONSIGNEE</e><e r="#R" v="#V" k="CNTR_DISPATCH_DT">16.10.2026</e>', N'#R', CONVERT(NVARCHAR(10), @R1)), N'#V', CONVERT(NVARCHAR(10), 1));
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_SAVE_CELLS @M, 'ZZT', @X, 'ZZT_EDITOR', N'Self-test editor';
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN ISNULL(@HS, '') = '100' AND @H1 = 12 AND @H2 = 0 AND ISNULL(@H3, -1) = 0 THEN 1 ELSE 0 END, @STEP + N' | ' + N'status 100, 12 applied, nothing refused, no tracking (not linked)', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN (SELECT STUFFING_DT FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R1) = N'14-10-2026' THEN 1 ELSE 0 END, @STEP + N' | ' + N'date normalised: 14/10/2026 -> 14-10-2026', N'STUFFING_DT = ' + ISNULL((SELECT STUFFING_DT FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R1), N'NULL'));
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN (SELECT GATE_OPEN_DT FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R1) = N'15-10-2026' THEN 1 ELSE 0 END, @STEP + N' | ' + N'date normalised: 2026-10-15 -> 15-10-2026', N'GATE_OPEN_DT = ' + ISNULL((SELECT GATE_OPEN_DT FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R1), N'NULL'));
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN (SELECT CNTR_DISPATCH_DT FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R1) = N'16-10-2026' THEN 1 ELSE 0 END, @STEP + N' | ' + N'date normalised: 16.10.2026 -> 16-10-2026', N'CNTR_DISPATCH_DT = ' + ISNULL((SELECT CNTR_DISPATCH_DT FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R1), N'NULL'));
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN (SELECT DO_ETD FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R1) = N'26-08/27-08' THEN 1 ELSE 0 END, @STEP + N' | ' + N'range kept as typed (26-08/27-08)', N'DO_ETD = ' + ISNULL((SELECT DO_ETD FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R1), N'NULL'));
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN (SELECT DO_RECEIVE_DT FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R1) = N'Will be updated' THEN 1 ELSE 0 END, @STEP + N' | ' + N'note kept as typed (Will be updated)', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN (SELECT LC_DATE FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R1) = N'31-02-2026' THEN 1 ELSE 0 END, @STEP + N' | ' + N'impossible date kept as typed (31-02-2026)', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN (SELECT VEH FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R1) = N'MODEL A' + NCHAR(10) + N'PARTS' THEN 1 ELSE 0 END, @STEP + N' | ' + N'multi-line text kept (VEH with a line break)', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN (SELECT ROWVER FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R1) = 2 THEN 1 ELSE 0 END, @STEP + N' | ' + N'ROWVER 1 -> 2', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN (SELECT COUNT(*) FROM dbo.TBL_EXPT_SHEET_LOG WHERE ROW_KIND = 'W' AND ROW_ID = @R1 AND ACTION = 'edit') = 12 THEN 1 ELSE 0 END, @STEP + N' | ' + N'one log row per changed cell (12 edit rows)', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));

-- ---- S06 save cells: a stale version is a conflict -------------------------------------------------------
SET @STEP = N'S06 save cells: a stale version is a conflict';
SET @RAISED = 0;
SELECT @LOGN = (SELECT COUNT(*) FROM dbo.TBL_EXPT_SHEET_LOG WHERE ROW_KIND = 'W' AND ROW_ID = @R1);
SET @X = REPLACE(REPLACE(N'<e r="#R" v="#V" k="WO">CONFLICT</e>', N'#R', CONVERT(NVARCHAR(10), @R1)), N'#V', CONVERT(NVARCHAR(10), 1));
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_SAVE_CELLS @M, 'ZZT', @X, 'ZZT_EDITOR', N'Self-test editor';
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN ISNULL(@HS, '') = '102' AND @H2 = 1 THEN 1 ELSE 0 END, @STEP + N' | ' + N'status 102, 1 refused', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN (SELECT WO FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R1) = N'ZZWO-1' AND (SELECT ROWVER FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R1) = 2 AND (SELECT COUNT(*) FROM dbo.TBL_EXPT_SHEET_LOG WHERE ROW_KIND = 'W' AND ROW_ID = @R1) = @LOGN THEN 1 ELSE 0 END, @STEP + N' | ' + N'value, version and history untouched', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));

-- ---- S07 save cells: the same value again changes nothing ------------------------------------------------
SET @STEP = N'S07 save cells: the same value again changes nothing';
SET @RAISED = 0;
SET @X = REPLACE(REPLACE(N'<e r="#R" v="#V" k="WO">ZZWO-1</e>', N'#R', CONVERT(NVARCHAR(10), @R1)), N'#V', CONVERT(NVARCHAR(10), 2));
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_SAVE_CELLS @M, 'ZZT', @X, 'ZZT_EDITOR', N'Self-test editor';
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN ISNULL(@HS, '') = '100' AND @H1 = 0 AND @H2 = 0 THEN 1 ELSE 0 END, @STEP + N' | ' + N'status 100, 0 applied', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN (SELECT ROWVER FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R1) = 2 AND (SELECT COUNT(*) FROM dbo.TBL_EXPT_SHEET_LOG WHERE ROW_KIND = 'W' AND ROW_ID = @R1) = @LOGN THEN 1 ELSE 0 END, @STEP + N' | ' + N'no version bump, no log row', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));

-- ---- S08 owner lock: a column the role does not own ------------------------------------------------------
SET @STEP = N'S08 owner lock: a column the role does not own';
SET @RAISED = 0;
SET @X = REPLACE(REPLACE(N'<e r="#R" v="1" k="#K">ZZ OWNER TEST</e>', N'#R', CONVERT(NVARCHAR(10), @R2)), N'#K', @KOWN);
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_SAVE_CELLS @M, 'ZZT', @X, 'ZZT_EDITOR', N'Self-test editor';
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN ISNULL(@HS, '') = '104' AND @H2 = 1 THEN 1 ELSE 0 END, @STEP + N' | ' + N'status 104, refused as owner', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN (SELECT ROWVER FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R2) = 1 AND NOT EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_LOG WHERE ROW_KIND = 'W' AND ROW_ID = @R2 AND COL_KEY = @KOWN) THEN 1 ELSE 0 END, @STEP + N' | ' + N'value untouched (no version bump, no log row)', N'key ' + ISNULL(@KOWN, N'?') + N'; status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));

-- ---- S09 owner lock: ADMIN may edit that column ----------------------------------------------------------
SET @STEP = N'S09 owner lock: ADMIN may edit that column';
SET @RAISED = 0;
SET @X = REPLACE(REPLACE(N'<e r="#R" v="1" k="#K">ZZ OWNER TEST</e>', N'#R', CONVERT(NVARCHAR(10), @R2)), N'#K', @KOWN);
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_SAVE_CELLS @M, 'ZZT', @X, 'ZZT_ADMIN', N'Self-test admin';
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN ISNULL(@HS, '') = '100' AND @H1 = 1 THEN 1 ELSE 0 END, @STEP + N' | ' + N'status 100, 1 applied', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN (SELECT ROWVER FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R2) = 2 AND EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_LOG WHERE ROW_KIND = 'W' AND ROW_ID = @R2 AND COL_KEY = @KOWN AND NEW_VALUE = N'ZZ OWNER TEST') THEN 1 ELSE 0 END, @STEP + N' | ' + N'saved (log row written, ROWVER 2)', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));

-- ---- S10 owner lock: an ALL-owned column (REMARK1) for a user without roles ------------------------------
SET @STEP = N'S10 owner lock: an ALL-owned column (REMARK1) for a user without roles';
SET @RAISED = 0;
SET @X = REPLACE(REPLACE(N'<e r="#R" v="#V" k="REMARK1">line one&#x0A;line two</e>', N'#R', CONVERT(NVARCHAR(10), @R2)), N'#V', CONVERT(NVARCHAR(10), 2));
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_SAVE_CELLS @M, 'ZZT', @X, 'ZZT_NONE', N'Self-test, no roles';
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN (@ALLREMARK = 1 AND ISNULL(@HS, '') = '100' AND @H1 = 1) OR (@ALLREMARK = 0 AND ISNULL(@HS, '') = '104') THEN 1 ELSE 0 END, @STEP + N' | ' + N'REMARK1 owned by ALL: saved; else refused as owner', N'ALL owns REMARK1: ' + CONVERT(NVARCHAR(1), @ALLREMARK) + N'; status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));

-- ---- S11 owner lock: a Links SA user (no sheet role) counts as ADMIN -------------------------------------
SET @STEP = N'S11 owner lock: a Links SA user (no sheet role) counts as ADMIN';
SET @RAISED = 0;
SET @X = REPLACE(REPLACE(N'<e r="#R" v="1" k="#K">ZZ SA TEST</e><e r="#R" v="1" k="BL_HANDOVER_DT">20/10/2026</e>', N'#R', CONVERT(NVARCHAR(10), @R4)), N'#K', @KOWN);
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_SAVE_CELLS @M, 'ZZT', @X, @SAID, N'Self-test SA user';
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN @SAID IS NOT NULL THEN 1 ELSE 0 END, @STEP + N' | ' + N'an SA user was found (read only)', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN ISNULL(@HS, '') = '100' AND @H1 = 2 THEN 1 ELSE 0 END, @STEP + N' | ' + N'status 100, 2 applied (columns no role of the user owns)', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN (SELECT ROWVER FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R4) = 2 AND (SELECT BL_HANDOVER_DT FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R4) = N'20-10-2026'
            AND EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_LOG WHERE ROW_KIND = 'W' AND ROW_ID = @R4 AND COL_KEY = @KOWN AND USER_ID = @SAID) THEN 1 ELSE 0 END, @STEP + N' | ' + N'saved, ROWVER 2', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));

-- ---- S12 owner lock: a non-SA user without roles still cannot --------------------------------------------
SET @STEP = N'S12 owner lock: a non-SA user without roles still cannot';
SET @RAISED = 0;
SET @X = REPLACE(REPLACE(N'<e r="#R" v="2" k="#K">ZZ NONE TEST</e>', N'#R', CONVERT(NVARCHAR(10), @R4)), N'#K', @KOWN);
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_SAVE_CELLS @M, 'ZZT', @X, 'ZZT_NONE', N'Self-test, no roles';
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN ISNULL(@HS, '') = '104' AND @H2 = 1 THEN 1 ELSE 0 END, @STEP + N' | ' + N'status 104, refused as owner', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN (SELECT ROWVER FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R4) = 2 AND NOT EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_LOG WHERE ROW_KIND = 'W' AND ROW_ID = @R4 AND USER_ID = 'ZZT_NONE') THEN 1 ELSE 0 END, @STEP + N' | ' + N'value untouched', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));

-- ---- S13 invalid key and too long value are refused, nothing cut -----------------------------------------
SET @STEP = N'S13 invalid key and too long value are refused, nothing cut';
SET @RAISED = 0;
SET @X = REPLACE(N'<e r="#R" v="1" k="NOT_A_KEY">x</e><e r="#R" v="1" k="WO">' + REPLICATE(N'x', 501) + N'</e>', N'#R', CONVERT(NVARCHAR(10), @R3));
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_SAVE_CELLS @M, 'ZZT', @X, 'ZZT_ADMIN', N'Self-test admin';
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN ISNULL(@HS, '') = '101' AND @H2 = 2 THEN 1 ELSE 0 END, @STEP + N' | ' + N'status 101, 2 refused', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN (SELECT ROWVER FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R3) = 1 AND (SELECT WO FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R3) IS NULL THEN 1 ELSE 0 END, @STEP + N' | ' + N'row 3 untouched', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));

-- ---- S14 rows: duplicate row 1 (goes right after it) -----------------------------------------------------
SET @STEP = N'S14 rows: duplicate row 1 (goes right after it)';
SET @RAISED = 0;
SET @IDS = CONVERT(VARCHAR(20), @R1);
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_ROWS_OP @M, 'ZZT', 'duplicate', @IDS, 0, 0, 'ZZT_EDITOR', N'Self-test editor';
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
SELECT @R5 = MAX(ID) FROM dbo.TBL_EXPT_SHEET_ROW WHERE MONTH_ID = @M AND TAB_CODE = 'ZZT' AND ID NOT IN (@R1, @R2, @R3, @R4);
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN ISNULL(@HS, '') = '100' THEN 1 ELSE 0 END, @STEP + N' | ' + N'status 100', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN (SELECT WO FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R5) = N'ZZWO-1' AND (SELECT ROWVER FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R5) = 1
            AND (SELECT SORT_ORDER FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R5) > (SELECT SORT_ORDER FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R1) AND (SELECT SORT_ORDER FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R5) < (SELECT SORT_ORDER FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R4) THEN 1 ELSE 0 END, @STEP + N' | ' + N'copy has the values, ROWVER 1, between row 1 and the next row', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));

-- ---- S15 rows: move row 3 to the top ---------------------------------------------------------------------
SET @STEP = N'S15 rows: move row 3 to the top';
SET @RAISED = 0;
SET @IDS = CONVERT(VARCHAR(20), @R3);
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_ROWS_OP @M, 'ZZT', 'move', @IDS, 0, 0, 'ZZT_EDITOR', N'Self-test editor';
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN ISNULL(@HS, '') = '100' THEN 1 ELSE 0 END, @STEP + N' | ' + N'status 100', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN (SELECT SORT_ORDER FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R3) < (SELECT MIN(SORT_ORDER) FROM dbo.TBL_EXPT_SHEET_ROW WHERE MONTH_ID = @M AND TAB_CODE = 'ZZT' AND ID <> @R3)
            AND (SELECT ROWVER FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R3) = 1 THEN 1 ELSE 0 END, @STEP + N' | ' + N'row 3 is first, ROWVER unchanged', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));

-- ---- S16 rows: delete row 2 (soft) -----------------------------------------------------------------------
SET @STEP = N'S16 rows: delete row 2 (soft)';
SET @RAISED = 0;
SET @IDS = CONVERT(VARCHAR(20), @R2);
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_ROWS_OP @M, 'ZZT', 'delete', @IDS, 0, 0, 'ZZT_EDITOR', N'Self-test editor';
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN ISNULL(@HS, '') = '100' AND (SELECT ISDELETED FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R2) = 1 THEN 1 ELSE 0 END, @STEP + N' | ' + N'status 100, row 2 ISDELETED = 1', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));

-- ---- S17 rows: restore row 2 -----------------------------------------------------------------------------
SET @STEP = N'S17 rows: restore row 2';
SET @RAISED = 0;
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_ROWS_OP @M, 'ZZT', 'restore', @IDS, 0, 0, 'ZZT_EDITOR', N'Self-test editor';
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN ISNULL(@HS, '') = '100' AND (SELECT ISDELETED FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R2) = 0 THEN 1 ELSE 0 END, @STEP + N' | ' + N'status 100, row 2 ISDELETED = 0', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));

-- ---- S18 link: a job of another branch is refused --------------------------------------------------------
SET @STEP = N'S18 link: a job of another branch is refused';
SET @RAISED = 0;
SET @IDS = CONVERT(VARCHAR(20), @R1);
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_LINK @IDS, @JOB, 'ZZT_ADMIN', N'Self-test admin';
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN ISNULL(@HS, '') = '103' THEN 1 ELSE 0 END, @STEP + N' | ' + N'status 103 (month is ZZ / ZZZ)', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN (SELECT EXPTNO FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R1) IS NULL THEN 1 ELSE 0 END, @STEP + N' | ' + N'row 1 still unlinked', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));

-- ---- S19 link rows 1 + its copy to the real job (month moved to the job's branch inside the transaction) ----
SET @STEP = N'S19 link rows 1 + its copy to the real job (month moved to the job''s branch inside the transaction)';
SET @RAISED = 0;
UPDATE dbo.TBL_EXPT_SHEET_MONTH SET CMPCODE = @JCMP, CITYCODE = @JCITY WHERE ID = @M;   -- test only, rolled back
SET @IDS = CONVERT(VARCHAR(20), @R1) + ',' + CONVERT(VARCHAR(20), @R5);
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_LINK @IDS, @JOB, 'ZZT_ADMIN', N'Self-test admin';
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN ISNULL(@HS, '') = '100' AND @H1 = 2 THEN 1 ELSE 0 END, @STEP + N' | ' + N'status 100, 2 rows linked', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN (SELECT EXPTNO FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R1) = @JOB AND (SELECT FF_JOB FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R1) = @JOB AND (SELECT EXPTNO FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R5) = @JOB THEN 1 ELSE 0 END, @STEP + N' | ' + N'EXPTNO and FF_JOB set on both rows', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN EXISTS (SELECT 1 FROM dbo.EXPT_JOB_TRACKING WHERE EXPTNO = @JOB) THEN 1 ELSE 0 END, @STEP + N' | ' + N'mirror: EXPT_JOB_TRACKING row exists', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN (SELECT STUFFING_DT FROM dbo.EXPT_JOB_TRACKING WHERE EXPTNO = @JOB) = '20261014' AND (SELECT GATE_OPEN_DT FROM dbo.EXPT_JOB_TRACKING WHERE EXPTNO = @JOB) = '20261015' AND (SELECT CNTR_DISPATCH_DT FROM dbo.EXPT_JOB_TRACKING WHERE EXPTNO = @JOB) = '20261016' THEN 1 ELSE 0 END, @STEP + N' | ' + N'mirror: real dates in, as DATETIME', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN (SELECT VEHICLE_MODEL FROM dbo.EXPT_JOB_TRACKING WHERE EXPTNO = @JOB) = 'MODEL A' + CHAR(10) + 'PARTS' AND (SELECT HAZ FROM dbo.EXPT_JOB_TRACKING WHERE EXPTNO = @JOB) = 'Y' AND (SELECT PLANT FROM dbo.EXPT_JOB_TRACKING WHERE EXPTNO = @JOB) = 'WA10' THEN 1 ELSE 0 END, @STEP + N' | ' + N'mirror: text and HAZ YES -> Y', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN ISNULL(CONVERT(VARCHAR(23), (SELECT DO_ETD FROM dbo.EXPT_JOB_TRACKING WHERE EXPTNO = @JOB), 121), '') = ISNULL(CONVERT(VARCHAR(23), @P_DO_ETD, 121), '')
            AND ISNULL(CONVERT(VARCHAR(23), (SELECT LC_DATE FROM dbo.EXPT_JOB_TRACKING WHERE EXPTNO = @JOB), 121), '') = ISNULL(CONVERT(VARCHAR(23), @P_LC_DATE, 121), '')
            AND ISNULL(CONVERT(VARCHAR(23), (SELECT DO_RECEIVE_DT FROM dbo.EXPT_JOB_TRACKING WHERE EXPTNO = @JOB), 121), '') = ISNULL(CONVERT(VARCHAR(23), @P_DO_RECEIVE_DT, 121), '') THEN 1 ELSE 0 END, @STEP + N' | ' + N'mirror: a range / note / impossible date leaves the tracking date as it was', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN ISNULL((SELECT TRACKING_STATUS FROM dbo.EXPT_JOB_TRACKING WHERE EXPTNO = @JOB), '') = ISNULL(@P_TS, '') AND ISNULL((SELECT SHIPMENT_CATEGORY FROM dbo.EXPT_JOB_TRACKING WHERE EXPTNO = @JOB), '') = ISNULL(@P_SC, '') THEN 1 ELSE 0 END, @STEP + N' | ' + N'mirror: TRACKING_STATUS and SHIPMENT_CATEGORY untouched', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN (SELECT COUNT(*) FROM dbo.TBL_EXPT_SHEET_LOG WHERE ROW_KIND = 'W' AND ROW_ID IN (@R1, @R5) AND ACTION = 'link') = 2 THEN 1 ELSE 0 END, @STEP + N' | ' + N'link logged on both rows', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));

-- ---- S20 Links-owned live values for the linked job (USP_EXPT_SHEET_LINKS_FILL) --------------------------
SET @STEP = N'S20 Links-owned live values for the linked job (USP_EXPT_SHEET_LINKS_FILL)';
SET @RAISED = 0;
CREATE TABLE #SHEET_LK (EXPTNO VARCHAR(25) NOT NULL PRIMARY KEY, FILLED BIT NOT NULL DEFAULT 0, JOB_FOUND BIT NOT NULL DEFAULT 0,
                            JOB_CANCELLED BIT NOT NULL DEFAULT 0,
                            L_WO NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_PORT NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_COUNTRY NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_QTY NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_CONT NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_CNTR_TYPE NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_VSL_NAME NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_SLINE NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_BOOKING_NO NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_PO_NO NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_CONSIGNEE NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_CONTAINER_NO NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_CURRENT_ETD NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_ETA_DEST NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_FINAL_VSL_SOB NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_BL_NO NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_BL_DT NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_EDOC_STATUS NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_COURIER_DT NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_SB_NO NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_SB_DT NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_FOR_HBL NVARCHAR(4000) NOT NULL DEFAULT N'');
INSERT INTO #SHEET_LK (EXPTNO) VALUES (@JOB), ('ZZ-NO-SUCH-JOB');
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_LINKS_FILL;
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
-- (checks below read #SHEET_LK, dropped right after them: the procedures create their own)
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN EXISTS (SELECT 1 FROM #SHEET_LK WHERE EXPTNO = @JOB AND JOB_FOUND = 1 AND FILLED = 1 AND L_WO = @JINV AND L_PORT = @JPOD) THEN 1 ELSE 0 END, @STEP + N' | ' + N'job found, L_WO = EXPT_INVNO, L_PORT = EXPT_POD', N'L_WO = ' + ISNULL((SELECT L_WO FROM #SHEET_LK WHERE EXPTNO = @JOB), N'NULL') + N', expected ' + ISNULL(@JINV, N'NULL'));
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN EXISTS (SELECT 1 FROM #SHEET_LK WHERE EXPTNO = @JOB AND L_CONSIGNEE = ISNULL(@JCON, N'')) THEN 1 ELSE 0 END, @STEP + N' | ' + N'L_CONSIGNEE = the consignee name', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN EXISTS (SELECT 1 FROM #SHEET_LK WHERE EXPTNO = 'ZZ-NO-SUCH-JOB' AND FILLED = 1 AND JOB_FOUND = 0 AND L_WO = N'') THEN 1 ELSE 0 END, @STEP + N' | ' + N'an unknown export number is JOB_FOUND = 0 with empty values', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));
DROP TABLE #SHEET_LK;

-- ---- S21 load the tab ------------------------------------------------------------------------------------
SET @STEP = N'S21 load the tab';
SET @RAISED = 0;
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_LOAD @M, 'ZZT';
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN @H1 = 5 AND @H2 = 1 THEN 1 ELSE 0 END, @STEP + N' | ' + N'5 rows, the linked job found with its Links values', N'rows ' + ISNULL(CONVERT(NVARCHAR(10), @H1), N'?') + N', linked ' + ISNULL(CONVERT(NVARCHAR(10), @H2), N'?'));

-- ---- S22 Links-owned column of a linked row is locked once Links has a value; FF_JOB follows the link ----
SET @STEP = N'S22 Links-owned column of a linked row is locked once Links has a value; FF_JOB follows the link';
SET @RAISED = 0;
SELECT @V = ROWVER FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R1;
SET @X = REPLACE(REPLACE(N'<e r="#R" v="#V" k="WO">ZZ LOCKED</e><e r="#R" v="#V" k="FF_JOB">ZZ OTHER JOB</e>', N'#R', CONVERT(NVARCHAR(10), @R1)), N'#V', CONVERT(NVARCHAR(10), @V));
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_SAVE_CELLS @M, 'ZZT', @X, 'ZZT_ADMIN', N'Self-test admin';
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN ISNULL(@HS, '') = '104' AND @H2 = 2 THEN 1 ELSE 0 END, @STEP + N' | ' + N'status 104, both refused (ADMIN too)', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN (SELECT WO FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R1) = N'ZZWO-1' AND (SELECT FF_JOB FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R1) = @JOB AND (SELECT ROWVER FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R1) = @V THEN 1 ELSE 0 END, @STEP + N' | ' + N'values untouched', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));

-- ---- S23 edit tracking columns of the linked row: mirrored into EXPT_JOB_TRACKING ------------------------
SET @STEP = N'S23 edit tracking columns of the linked row: mirrored into EXPT_JOB_TRACKING';
SET @RAISED = 0;
SELECT @V = ROWVER FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R1;
SELECT @TLOGN = COUNT(*) FROM dbo.EXPT_JOB_TRACKING_LOG WHERE EXPTNO = @JOB;
SET @X = REPLACE(REPLACE(N'<e r="#R" v="#V" k="PLANT">WA01</e><e r="#R" v="#V" k="CNTR_DISPATCH_DT">17/10/2026</e><e r="#R" v="#V" k="STUFFING_DT"></e><e r="#R" v="#V" k="GATE_OPEN_DT">Will be updated</e>', N'#R', CONVERT(NVARCHAR(10), @R1)), N'#V', CONVERT(NVARCHAR(10), @V));
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_SAVE_CELLS @M, 'ZZT', @X, 'ZZT_EDITOR', N'Self-test editor';
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN ISNULL(@HS, '') = '100' AND @H1 = 4 AND @H3 = 3 THEN 1 ELSE 0 END, @STEP + N' | ' + N'status 100, 4 applied, 3 tracking fields', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN (SELECT PLANT FROM dbo.EXPT_JOB_TRACKING WHERE EXPTNO = @JOB) = 'WA01' AND (SELECT CNTR_DISPATCH_DT FROM dbo.EXPT_JOB_TRACKING WHERE EXPTNO = @JOB) = '20261017' AND (SELECT STUFFING_DT FROM dbo.EXPT_JOB_TRACKING WHERE EXPTNO = @JOB) IS NULL THEN 1 ELSE 0 END, @STEP + N' | ' + N'PLANT changed, CNTR_DISPATCH 17-10-2026, STUFFING cleared', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN (SELECT GATE_OPEN_DT FROM dbo.EXPT_JOB_TRACKING WHERE EXPTNO = @JOB) = '20261015' THEN 1 ELSE 0 END, @STEP + N' | ' + N'a note in a date cell leaves the tracking date as it was', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN (SELECT COUNT(*) FROM dbo.EXPT_JOB_TRACKING_LOG WHERE EXPTNO = @JOB) = @TLOGN + 3 THEN 1 ELSE 0 END, @STEP + N' | ' + N'3 EXPT_JOB_TRACKING_LOG rows', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));

-- ---- S24 history of row 1 --------------------------------------------------------------------------------
SET @STEP = N'S24 history of row 1';
SET @RAISED = 0;
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_HISTORY 'W', @R1;
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN (SELECT COUNT(*) FROM dbo.TBL_EXPT_SHEET_LOG WHERE ROW_KIND = 'W' AND ROW_ID = @R1) >= 17 THEN 1 ELSE 0 END, @STEP + N' | ' + N'at least 17 log rows (12 edits, link, 4 edits)', N'log rows ' + CONVERT(NVARCHAR(10), (SELECT COUNT(*) FROM dbo.TBL_EXPT_SHEET_LOG WHERE ROW_KIND = 'W' AND ROW_ID = @R1)));

-- ---- S25 restore an old value (LC_DATE back to empty) ----------------------------------------------------
SET @STEP = N'S25 restore an old value (LC_DATE back to empty)';
SET @RAISED = 0;
SELECT @LOGID = MIN(ID) FROM dbo.TBL_EXPT_SHEET_LOG WHERE ROW_KIND = 'W' AND ROW_ID = @R1 AND COL_KEY = 'LC_DATE' AND ACTION = 'edit';
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_RESTORE_VALUE @LOGID, 'ZZT_EDITOR', N'Self-test editor';
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN ISNULL(@HS, '') = '100' AND @H1 = 1 THEN 1 ELSE 0 END, @STEP + N' | ' + N'status 100, 1 applied', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN (SELECT LC_DATE FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R1) IS NULL AND EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_LOG WHERE ROW_KIND = 'W' AND ROW_ID = @R1 AND COL_KEY = 'LC_DATE' AND ACTION = 'restore') THEN 1 ELSE 0 END, @STEP + N' | ' + N'LC_DATE empty again, logged as restore', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));

-- ---- S26 a history row that is not a cell edit cannot be restored ----------------------------------------
SET @STEP = N'S26 a history row that is not a cell edit cannot be restored';
SET @RAISED = 0;
SELECT @LOGID = MIN(ID) FROM dbo.TBL_EXPT_SHEET_LOG WHERE ROW_KIND = 'W' AND ROW_ID = @R1 AND ACTION = 'link';
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_RESTORE_VALUE @LOGID, 'ZZT_EDITOR', N'Self-test editor';
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN ISNULL(@HS, '') = '104' THEN 1 ELSE 0 END, @STEP + N' | ' + N'status 104', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));

-- ---- S27 format: fill colour of a cell -------------------------------------------------------------------
SET @STEP = N'S27 format: fill colour of a cell';
SET @RAISED = 0;
SET @X = REPLACE(N'<f r="#R" k="WO" bg="#FF00FF"/>', N'#R', CONVERT(NVARCHAR(10), @R1));
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_SAVE_FMT @X, 'ZZT_EDITOR', N'Self-test editor';
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN ISNULL(@HS, '') = '100' AND @H1 = 1 THEN 1 ELSE 0 END, @STEP + N' | ' + N'status 100, 1 cell', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN (SELECT CELL_FMT FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R1) = N'{"WO":{"bg":"#ff00ff"}}' THEN 1 ELSE 0 END, @STEP + N' | ' + N'CELL_FMT = {"WO":{"bg":"#ff00ff"}}', ISNULL((SELECT CELL_FMT FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R1), N'NULL'));

-- ---- S28 format: bold merged in, a second cell, the row status -------------------------------------------
SET @STEP = N'S28 format: bold merged in, a second cell, the row status';
SET @RAISED = 0;
SELECT @V = ROWVER FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R1;
SET @X = REPLACE(N'<f r="#R" k="WO" b="1"/><f r="#R" k="VEH" fg="#305496"/><f r="#R" k="*ROW" s="HOLD"/>', N'#R', CONVERT(NVARCHAR(10), @R1));
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_SAVE_FMT @X, 'ZZT_EDITOR', N'Self-test editor';
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN ISNULL(@HS, '') = '100' AND @H1 = 2 AND @H2 = 1 THEN 1 ELSE 0 END, @STEP + N' | ' + N'status 100, 2 cells, 1 status', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN (SELECT CELL_FMT FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R1) = N'{"VEH":{"fg":"#305496"},"WO":{"bg":"#ff00ff","b":1}}' THEN 1 ELSE 0 END, @STEP + N' | ' + N'CELL_FMT merged and sorted', ISNULL((SELECT CELL_FMT FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R1), N'NULL'));
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN (SELECT STATUS_CODE FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R1) = 'HOLD' AND (SELECT ROWVER FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R1) = @V THEN 1 ELSE 0 END, @STEP + N' | ' + N'STATUS_CODE = HOLD, ROWVER not bumped', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));

-- ---- S29 format: clear one property, refuse a bad colour -------------------------------------------------
SET @STEP = N'S29 format: clear one property, refuse a bad colour';
SET @RAISED = 0;
SET @X = REPLACE(N'<f r="#R" k="WO" bg=""/><f r="#R" k="PLANT" bg="red"/>', N'#R', CONVERT(NVARCHAR(10), @R1));
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_SAVE_FMT @X, 'ZZT_EDITOR', N'Self-test editor';
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN ISNULL(@HS, '') = '101' AND @H1 = 1 AND @H3 = 1 THEN 1 ELSE 0 END, @STEP + N' | ' + N'status 101, 1 cell saved, 1 refused', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN (SELECT CELL_FMT FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R1) = N'{"VEH":{"fg":"#305496"},"WO":{"b":1}}' THEN 1 ELSE 0 END, @STEP + N' | ' + N'CELL_FMT = {"VEH":{"fg":"#305496"},"WO":{"b":1}}', ISNULL((SELECT CELL_FMT FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R1), N'NULL'));

-- ---- S30 format: a row-level format (k="*ROW" bg / b) is stored under *ROW, status kept ------------------
SET @STEP = N'S30 format: a row-level format (k="*ROW" bg / b) is stored under *ROW, status kept';
SET @RAISED = 0;
SET @X = REPLACE(N'<f r="#R" k="*ROW" bg="#FBBC04" b="1"/>', N'#R', CONVERT(NVARCHAR(10), @R1));
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_SAVE_FMT @X, 'ZZT_EDITOR', N'Self-test editor';
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN ISNULL(@HS, '') = '100' AND @H1 = 1 AND @H2 = 0 THEN 1 ELSE 0 END, @STEP + N' | ' + N'status 100, 1 cell (the row), no status change', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN (SELECT CELL_FMT FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R1) = N'{"*ROW":{"bg":"#fbbc04","b":1},"VEH":{"fg":"#305496"},"WO":{"b":1}}' AND (SELECT STATUS_CODE FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R1) = 'HOLD' THEN 1 ELSE 0 END, @STEP + N' | ' + N'CELL_FMT = {"*ROW":{"bg":"#fbbc04","b":1},"VEH":..,"WO":..}, STATUS_CODE still HOLD', ISNULL((SELECT CELL_FMT FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R1), N'NULL'));
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_LOG WHERE ROW_KIND = 'W' AND ROW_ID = @R1 AND COL_KEY = '*ROW' AND ACTION = 'fmt') THEN 1 ELSE 0 END, @STEP + N' | ' + N'logged as fmt on *ROW', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));

-- ---- S31 KPI: 3 parts / frames rows on the SLPF tab ------------------------------------------------------
SET @STEP = N'S31 KPI: 3 parts / frames rows on the SLPF tab';
SET @RAISED = 0;
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_ROWS_OP @M, 'SLPF', 'insert', '', 0, 3, 'ZZT_EDITOR', N'Self-test editor';
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN ISNULL(@HS, '') = '100' THEN 1 ELSE 0 END, @STEP + N' | ' + N'status 100', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));

-- ---- S32 KPI: fill them (vessel 1 carries parts and frames) ----------------------------------------------
SET @STEP = N'S32 KPI: fill them (vessel 1 carries parts and frames)';
SET @RAISED = 0;
SELECT @RA = MAX(CASE WHEN RN = 1 THEN ID END), @RB = MAX(CASE WHEN RN = 2 THEN ID END), @RC = MAX(CASE WHEN RN = 3 THEN ID END)
FROM   (SELECT ID, ROW_NUMBER() OVER (ORDER BY SORT_ORDER, ID) AS RN FROM dbo.TBL_EXPT_SHEET_ROW WHERE MONTH_ID = @M AND TAB_CODE = 'SLPF') X;
SET @X = REPLACE(REPLACE(REPLACE(N'<e r="#A" v="1" k="VEH">CT 100 - PARTS</e><e r="#A" v="1" k="VSL_NAME">ZZ VESSEL ONE 001E</e><e r="#A" v="1" k="STUFFING_DT">20-10-2026</e>'
                               + N'<e r="#B" v="1" k="VEH">CT 100 - Frames</e><e r="#B" v="1" k="VSL_NAME">ZZ VESSEL ONE 001E</e><e r="#B" v="1" k="STUFFING_DT">21-10-2026</e>'
                               + N'<e r="#C" v="1" k="VEH">DISCOVER FRAMES</e><e r="#C" v="1" k="VSL_NAME">ZZ VESSEL TWO 002E</e><e r="#C" v="1" k="STUFFING_DT">21-10-2026</e>',
                 N'#A', CONVERT(NVARCHAR(10), @RA)), N'#B', CONVERT(NVARCHAR(10), @RB)), N'#C', CONVERT(NVARCHAR(10), @RC));
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_SAVE_CELLS @M, 'SLPF', @X, 'ZZT_ADMIN', N'Self-test admin';
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN ISNULL(@HS, '') = '100' AND @H1 = 9 THEN 1 ELSE 0 END, @STEP + N' | ' + N'status 100, 9 applied', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));

-- ---- S33 KPI: parts and frames on one vessel = 1 violation -----------------------------------------------
SET @STEP = N'S33 KPI: parts and frames on one vessel = 1 violation';
SET @RAISED = 0;
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_KPI @M;
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN @H1 = 1 AND @H2 = 2 AND @H3 = 3 THEN 1 ELSE 0 END, @STEP + N' | ' + N'1 violation, 2 vessels, 3 rows', N'violations ' + ISNULL(CONVERT(NVARCHAR(10), @H1), N'?') + N', vessels ' + ISNULL(CONVERT(NVARCHAR(10), @H2), N'?') + N', rows ' + ISNULL(CONVERT(NVARCHAR(10), @H3), N'?'));

-- ---- S34 KPI: link the vessel-one parts row to the real job ----------------------------------------------
SET @STEP = N'S34 KPI: link the vessel-one parts row to the real job';
SET @RAISED = 0;
SET @IDS = CONVERT(VARCHAR(20), @RA);
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_LINK @IDS, @JOB, 'ZZT_ADMIN', N'Self-test admin';
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN ISNULL(@HS, '') = '100' AND @H1 = 1 THEN 1 ELSE 0 END, @STEP + N' | ' + N'status 100, 1 row linked', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));

-- ---- S35 KPI: a linked row keeps the sheet's vessel name (still 1 violation) -----------------------------
SET @STEP = N'S35 KPI: a linked row keeps the sheet''s vessel name (still 1 violation)';
SET @RAISED = 0;
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_KPI @M;
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN @H1 = 1 AND @H2 = 2 AND @H3 = 3 THEN 1 ELSE 0 END, @STEP + N' | ' + N'1 violation, 2 vessels, 3 rows', N'violations ' + ISNULL(CONVERT(NVARCHAR(10), @H1), N'?') + N', vessels ' + ISNULL(CONVERT(NVARCHAR(10), @H2), N'?') + N', rows ' + ISNULL(CONVERT(NVARCHAR(10), @H3), N'?'));

-- ---- S36 KPI: a linked row with no sheet vessel falls back to the Links vessel name ----------------------
SET @STEP = N'S36 KPI: a linked row with no sheet vessel falls back to the Links vessel name';
SET @RAISED = 0;
UPDATE dbo.TBL_EXPT_SHEET_ROW SET VSL_NAME = NULL WHERE ID = @RA;   -- test only, rolled back
SELECT TOP 1 @KV = VM.VSL_NAME
FROM   dbo.EXPT_MASTER E
       LEFT JOIN (SELECT V.VSL_RTNO, MAX(LTRIM(RTRIM(V.VSL_NAME))) AS VSL_NAME FROM dbo.VSL_MASTER V GROUP BY V.VSL_RTNO) VM
              ON VM.VSL_RTNO = LTRIM(RTRIM(ISNULL(E.EXPT_VESSEL, '')))
WHERE  LTRIM(RTRIM(E.EXPTNO)) = @JOB
ORDER  BY E.SYSEXPT_DOCRECD, E.ID;
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_KPI @M;
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN @H1 = 0 AND @H3 = 3 AND @H2 = CASE WHEN ISNULL(@KV, N'') <> N'' THEN 3 ELSE 2 END THEN 1 ELSE 0 END, @STEP + N' | ' + N'0 violations; 3 vessels when Links names one, else 2', N'violations ' + ISNULL(CONVERT(NVARCHAR(10), @H1), N'?') + N', vessels ' + ISNULL(CONVERT(NVARCHAR(10), @H2), N'?') + N', rows ' + ISNULL(CONVERT(NVARCHAR(10), @H3), N'?') + N', Links vessel ' + ISNULL(@KV, N'(none)'));

-- ---- S37 unlink the copy (FF_JOB text stays) -------------------------------------------------------------
SET @STEP = N'S37 unlink the copy (FF_JOB text stays)';
SET @RAISED = 0;
SET @IDS = CONVERT(VARCHAR(20), @R5);
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_UNLINK @IDS, 'ZZT_ADMIN', N'Self-test admin';
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN ISNULL(@HS, '') = '100' AND @H1 = 1 THEN 1 ELSE 0 END, @STEP + N' | ' + N'status 100, 1 row', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN (SELECT EXPTNO FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R5) IS NULL AND (SELECT FF_JOB FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @R5) = @JOB THEN 1 ELSE 0 END, @STEP + N' | ' + N'EXPTNO cleared, FF_JOB kept', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));

-- ---- S38 convert draft for row 1 -------------------------------------------------------------------------
SET @STEP = N'S38 convert draft for row 1';
SET @RAISED = 0;
SET @IDS = CONVERT(VARCHAR(20), @R1);
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_CONVERT_DRAFT @IDS;
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN ISNULL(@H1, 0) >= 1 THEN 1 ELSE 0 END, @STEP + N' | ' + N'ran, sheet values to resolve found', N'values ' + ISNULL(CONVERT(NVARCHAR(10), @H1), N'?') + N', voyages ' + ISNULL(CONVERT(NVARCHAR(10), @H2), N'?'));

-- ---- S39 legend: add a status ----------------------------------------------------------------------------
SET @STEP = N'S39 legend: add a status';
SET @RAISED = 0;
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_LEGEND_IU 'ZZTEST', N'Self-test status', N'rolled back', '#123456', NULL, 99, 1, 'ZZT_ADMIN', N'Self-test admin';
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN ISNULL(@HS, '') = '100' AND EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_STATUS WHERE CODE = 'ZZTEST' AND BG = '#123456') THEN 1 ELSE 0 END, @STEP + N' | ' + N'status 100, row exists', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));

-- ---- S40 roles: an unknown Links user is refused ---------------------------------------------------------
SET @STEP = N'S40 roles: an unknown Links user is refused';
SET @RAISED = 0;
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_ROLES_IU 'ZZTEST', 'WO', 'ZZ_NOT_A_USER', 'ZZT_ADMIN', N'Self-test admin';
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN ISNULL(@HS, '') = '101' THEN 1 ELSE 0 END, @STEP + N' | ' + N'status 101', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));

-- ---- S41 roles: an unknown column key is refused ---------------------------------------------------------
SET @STEP = N'S41 roles: an unknown column key is refused';
SET @RAISED = 0;
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_ROLES_IU 'ZZTEST', 'WO,NOT_A_KEY', '', 'ZZT_ADMIN', N'Self-test admin';
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN ISNULL(@HS, '') = '101' THEN 1 ELSE 0 END, @STEP + N' | ' + N'status 101', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));

-- ---- S42 my roles: a Links SA user is ADMIN (IMPLICIT) and may edit all 52 columns -----------------------
SET @STEP = N'S42 my roles: a Links SA user is ADMIN (IMPLICIT) and may edit all 52 columns';
SET @RAISED = 0;
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_MY_ROLES @SAID;
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN @H2 = 1 AND @H1 = 52 THEN 1 ELSE 0 END, @STEP + N' | ' + N'ADMIN, 52 editable columns', N'admin ' + ISNULL(CONVERT(NVARCHAR(10), @H2), N'?') + N', editable ' + ISNULL(CONVERT(NVARCHAR(10), @H1), N'?'));

-- ---- S43 my roles: a user without roles may edit only the ALL-owned columns ------------------------------
SET @STEP = N'S43 my roles: a user without roles may edit only the ALL-owned columns';
SET @RAISED = 0;
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_MY_ROLES 'ZZT_NONE';
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN @H2 = 0 AND @H1 = (SELECT COUNT(*) FROM dbo.TBL_EXPT_SHEET_ROLE_COL WHERE ROLE_CODE = 'ALL') THEN 1 ELSE 0 END, @STEP + N' | ' + N'not ADMIN, editable = the ALL columns', N'admin ' + ISNULL(CONVERT(NVARCHAR(10), @H2), N'?') + N', editable ' + ISNULL(CONVERT(NVARCHAR(10), @H1), N'?'));

-- ---- S44 my roles: the test role -------------------------------------------------------------------------
SET @STEP = N'S44 my roles: the test role';
SET @RAISED = 0;
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_MY_ROLES 'ZZT_EDITOR';
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN @H2 = 0 AND @H1 = (SELECT COUNT(DISTINCT COL_KEY) FROM dbo.TBL_EXPT_SHEET_ROLE_COL WHERE ROLE_CODE IN ('ZZTEST', 'ALL')) THEN 1 ELSE 0 END, @STEP + N' | ' + N'not ADMIN, editable = its columns + the ALL columns', N'admin ' + ISNULL(CONVERT(NVARCHAR(10), @H2), N'?') + N', editable ' + ISNULL(CONVERT(NVARCHAR(10), @H1), N'?'));

-- ---- S45 alias: add one ----------------------------------------------------------------------------------
SET @STEP = N'S45 alias: add one';
SET @RAISED = 0;
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_ALIAS_IU 'PORT', N'ZZ PORT', 'ZZP', N'Self-test port', 1, 'ZZT_ADMIN', N'Self-test admin';
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN ISNULL(@HS, '') = '100' AND EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_ALIAS WHERE KIND = 'PORT' AND SHEET_VALUE = N'ZZ PORT' AND SOURCE = 'admin') THEN 1 ELSE 0 END, @STEP + N' | ' + N'status 100, saved as admin', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));

-- ---- S46 alias seed from linked rows (row 1: ZZ CONSIGNEE -> the job's consignee) ------------------------
SET @STEP = N'S46 alias seed from linked rows (row 1: ZZ CONSIGNEE -> the job''s consignee)';
SET @RAISED = 0;
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_ALIAS_SEED @JCMP, @JCITY, 'ZZT_ADMIN', N'Self-test admin';
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN ISNULL(@HS, '') = '100' THEN 1 ELSE 0 END, @STEP + N' | ' + N'status 100', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_ALIAS WHERE KIND = 'CONSIGNEE' AND SHEET_VALUE = N'ZZ CONSIGNEE' AND LINKS_CODE = @JCONCODE AND SOURCE = 'auto') THEN 1 ELSE 0 END, @STEP + N' | ' + N'auto alias for ZZ CONSIGNEE = the job''s consignee code', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));

-- ---- S47 history of the settings (ROW_KIND M, ROW_ID 0) --------------------------------------------------
SET @STEP = N'S47 history of the settings (ROW_KIND M, ROW_ID 0)';
SET @RAISED = 0;
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_HISTORY 'M', 0;
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN @H1 = (SELECT COUNT(*) FROM dbo.TBL_EXPT_SHEET_LOG WHERE ROW_KIND = 'M' AND ROW_ID = 0)
            AND EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_LOG WHERE ROW_KIND = 'M' AND ROW_ID = 0 AND COL_KEY = 'LEGEND.ZZTEST')
            AND EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_LOG WHERE ROW_KIND = 'M' AND ROW_ID = 0 AND COL_KEY = 'ALIAS.PORT' AND USER_ID = 'ZZT_ADMIN') THEN 1 ELSE 0 END, @STEP + N' | ' + N'every settings log row, incl. the legend and alias changes above', N'rows ' + ISNULL(CONVERT(NVARCHAR(10), @H1), N'?'));

-- ---- S48 history of the month (ROW_KIND M, ROW_ID = the month) -------------------------------------------
SET @STEP = N'S48 history of the month (ROW_KIND M, ROW_ID = the month)';
SET @RAISED = 0;
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_HISTORY 'M', @M;
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN @H1 >= 1 AND @H1 = (SELECT COUNT(*) FROM dbo.TBL_EXPT_SHEET_LOG WHERE ROW_KIND = 'M' AND ROW_ID = @M) AND EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_LOG WHERE ROW_KIND = 'M' AND ROW_ID = @M AND ACTION = 'insert') THEN 1 ELSE 0 END, @STEP + N' | ' + N'the month insert, exactly as logged', N'rows ' + ISNULL(CONVERT(NVARCHAR(10), @H1), N'?'));

-- ---- S49 views: save a layout ----------------------------------------------------------------------------
SET @STEP = N'S49 views: save a layout';
SET @RAISED = 0;
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_VIEW_IU 0, @M, 'ZZT', N'zz layout', 'layout', N'{"widths":{"WO":80}}', 'ZZT_EDITOR', N'Self-test editor';
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN ISNULL(@HS, '') = '100' AND @H1 IS NOT NULL THEN 1 ELSE 0 END, @STEP + N' | ' + N'status 100', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));

-- ---- S50 views: another user cannot delete it ------------------------------------------------------------
SET @STEP = N'S50 views: another user cannot delete it';
SET @RAISED = 0;
SET @VIEWID = (SELECT MAX(ID) FROM dbo.TBL_EXPT_SHEET_VIEW WHERE USER_ID = 'ZZT_EDITOR' AND NAME = N'zz layout');
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_VIEW_DEL @VIEWID, 'ZZT_ADMIN', N'Self-test admin';
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN ISNULL(@HS, '') = '104' THEN 1 ELSE 0 END, @STEP + N' | ' + N'status 104', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));

-- ---- S51 views: the owner deletes it ---------------------------------------------------------------------
SET @STEP = N'S51 views: the owner deletes it';
SET @RAISED = 0;
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_VIEW_DEL @VIEWID, 'ZZT_EDITOR', N'Self-test editor';
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN ISNULL(@HS, '') = '100' AND NOT EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_VIEW WHERE ID = @VIEWID) THEN 1 ELSE 0 END, @STEP + N' | ' + N'status 100, gone', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));

-- ---- S52 grid: 2 rows on PRICE ---------------------------------------------------------------------------
SET @STEP = N'S52 grid: 2 rows on PRICE';
SET @RAISED = 0;
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_GRID_ROWS_OP @M, 'PRICE', 'insert', '', 0, 2, 'ZZT_EDITOR', N'Self-test editor';
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN ISNULL(@HS, '') = '100' AND (SELECT COUNT(*) FROM dbo.TBL_EXPT_SHEET_GRIDROW WHERE MONTH_ID = @M AND TAB_CODE = 'PRICE') = 2 THEN 1 ELSE 0 END, @STEP + N' | ' + N'status 100, 2 rows', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));

-- ---- S53 grid: save a row --------------------------------------------------------------------------------
SET @STEP = N'S53 grid: save a row';
SET @RAISED = 0;
SET @G1 = (SELECT MIN(ID) FROM dbo.TBL_EXPT_SHEET_GRIDROW WHERE MONTH_ID = @M AND TAB_CODE = 'PRICE');
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_GRID_SAVE @M, 'PRICE', @G1, 1, N'{"A":"ZZ","B":"100"}', 'ZZT_EDITOR', N'Self-test editor';
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN ISNULL(@HS, '') = '100' AND (SELECT ROWVER FROM dbo.TBL_EXPT_SHEET_GRIDROW WHERE ID = @G1) = 2 THEN 1 ELSE 0 END, @STEP + N' | ' + N'status 100, ROWVER 2', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));

-- ---- S54 grid format: two cells (lower-case key accepted) ------------------------------------------------
SET @STEP = N'S54 grid format: two cells (lower-case key accepted)';
SET @RAISED = 0;
SET @X = REPLACE(N'<f r="#G" k="a" bg="#00FF00"/><f r="#G" k="B" b="1"/>', N'#G', CONVERT(NVARCHAR(10), @G1));
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_GRID_SAVE_FMT @X, 'ZZT_EDITOR', N'Self-test editor';
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN ISNULL(@HS, '') = '100' AND @H1 = 2 AND @H3 = 0 THEN 1 ELSE 0 END, @STEP + N' | ' + N'status 100, 2 cells', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN (SELECT CELL_FMT FROM dbo.TBL_EXPT_SHEET_GRIDROW WHERE ID = @G1) = N'{"A":{"bg":"#00ff00"},"B":{"b":1}}' AND (SELECT ROWVER FROM dbo.TBL_EXPT_SHEET_GRIDROW WHERE ID = @G1) = 2 THEN 1 ELSE 0 END, @STEP + N' | ' + N'CELL_FMT = {"A":{"bg":"#00ff00"},"B":{"b":1}}, ROWVER not bumped', ISNULL((SELECT CELL_FMT FROM dbo.TBL_EXPT_SHEET_GRIDROW WHERE ID = @G1), N'NULL'));
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN (SELECT COUNT(*) FROM dbo.TBL_EXPT_SHEET_LOG WHERE ROW_KIND = 'G' AND ROW_ID = @G1 AND ACTION = 'fmt') = 2 THEN 1 ELSE 0 END, @STEP + N' | ' + N'logged as G / fmt', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));

-- ---- S55 grid format: clear one, refuse a bad key and a *ROW ---------------------------------------------
SET @STEP = N'S55 grid format: clear one, refuse a bad key and a *ROW';
SET @RAISED = 0;
SET @X = REPLACE(N'<f r="#G" k="A" bg=""/><f r="#G" k="A1" bg="#000000"/><f r="#G" k="*ROW" bg="#000000"/>', N'#G', CONVERT(NVARCHAR(10), @G1));
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_GRID_SAVE_FMT @X, 'ZZT_EDITOR', N'Self-test editor';
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN ISNULL(@HS, '') = '101' AND @H1 = 1 AND @H3 = 2 THEN 1 ELSE 0 END, @STEP + N' | ' + N'status 101, 1 cell, 2 refused', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN (SELECT CELL_FMT FROM dbo.TBL_EXPT_SHEET_GRIDROW WHERE ID = @G1) = N'{"B":{"b":1}}' THEN 1 ELSE 0 END, @STEP + N' | ' + N'CELL_FMT = {"B":{"b":1}}', ISNULL((SELECT CELL_FMT FROM dbo.TBL_EXPT_SHEET_GRIDROW WHERE ID = @G1), N'NULL'));

-- ---- S56 grid: a stale version is a conflict -------------------------------------------------------------
SET @STEP = N'S56 grid: a stale version is a conflict';
SET @RAISED = 0;
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_GRID_SAVE @M, 'PRICE', @G1, 1, N'{"A":"OTHER"}', 'ZZT_EDITOR', N'Self-test editor';
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN ISNULL(@HS, '') = '102' AND (SELECT DATA FROM dbo.TBL_EXPT_SHEET_GRIDROW WHERE ID = @G1) = N'{"A":"ZZ","B":"100"}' THEN 1 ELSE 0 END, @STEP + N' | ' + N'status 102, DATA kept', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));

-- ---- S57 grid: load --------------------------------------------------------------------------------------
SET @STEP = N'S57 grid: load';
SET @RAISED = 0;
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_GRID_LOAD @M, 'PRICE';
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN @RAISED = 0 THEN 1 ELSE 0 END, @STEP + N' | ' + N'ran without error', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));

-- ---- S58 tab layout: first save --------------------------------------------------------------------------
SET @STEP = N'S58 tab layout: first save';
SET @RAISED = 0;
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_TABMETA_IU @M, 'PRICE', N'{"frozenRows":2}', 0, 'ZZT_EDITOR', N'Self-test editor';
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN ISNULL(@HS, '') = '100' AND (SELECT ROWVER FROM dbo.TBL_EXPT_SHEET_TABMETA WHERE MONTH_ID = @M AND TAB_CODE = 'PRICE') = 1 THEN 1 ELSE 0 END, @STEP + N' | ' + N'status 100, ROWVER 1', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));

-- ---- S59 tab layout: a stale version is a conflict -------------------------------------------------------
SET @STEP = N'S59 tab layout: a stale version is a conflict';
SET @RAISED = 0;
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_TABMETA_IU @M, 'PRICE', N'{"frozenRows":3}', 0, 'ZZT_EDITOR', N'Self-test editor';
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN ISNULL(@HS, '') = '102' THEN 1 ELSE 0 END, @STEP + N' | ' + N'status 102', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));

-- ---- S60 month: change the title (version check) ---------------------------------------------------------
SET @STEP = N'S60 month: change the title (version check)';
SET @RAISED = 0;
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_MONTH_IU @M, '', '', '', N'Self-test renamed', N'', 1, 0, 0, 'ZZT_ADMIN', N'Self-test admin';
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN ISNULL(@HS, '') = '100' AND (SELECT ROWVER FROM dbo.TBL_EXPT_SHEET_MONTH WHERE ID = @M) = 2 THEN 1 ELSE 0 END, @STEP + N' | ' + N'status 100, ROWVER 2', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));

-- ---- S61 month: a stale version is a conflict ------------------------------------------------------------
SET @STEP = N'S61 month: a stale version is a conflict';
SET @RAISED = 0;
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_MONTH_IU @M, '', '', '', N'again', N'', 1, 0, 0, 'ZZT_ADMIN', N'Self-test admin';
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN ISNULL(@HS, '') = '102' THEN 1 ELSE 0 END, @STEP + N' | ' + N'status 102', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));

-- ---- S62 month: a new month copied from it, WO rows carried ----------------------------------------------
SET @STEP = N'S62 month: a new month copied from it, WO rows carried';
SET @RAISED = 0;
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_MONTH_IU 0, @JCMP, @JCITY, '1900-02', N'Self-test copy', N'', 0, @M, 1, 'ZZT_ADMIN', N'Self-test admin';
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN ISNULL(@HS, '') = '100' THEN 1 ELSE 0 END, @STEP + N' | ' + N'status 100', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN (SELECT TABS FROM dbo.TBL_EXPT_SHEET_MONTH WHERE ID = @H1) = (SELECT TABS FROM dbo.TBL_EXPT_SHEET_MONTH WHERE ID = @M)
            AND (SELECT COUNT(*) FROM dbo.TBL_EXPT_SHEET_TABMETA WHERE MONTH_ID = @H1) = 1
            AND (SELECT COUNT(*) FROM dbo.TBL_EXPT_SHEET_GRIDROW WHERE MONTH_ID = @H1) = 2
            AND @H2 = 8 AND (SELECT COUNT(*) FROM dbo.TBL_EXPT_SHEET_ROW WHERE MONTH_ID = @H1) = 8
            AND EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_ROW WHERE MONTH_ID = @H1 AND EXPTNO = @JOB) THEN 1 ELSE 0 END, @STEP + N' | ' + N'TABS, tab layout, PRICE rows and the 8 WO rows copied (none is COMPLETE)', N'carried ' + ISNULL(CONVERT(NVARCHAR(10), @H2), N'?') + N', grid rows ' + ISNULL(CONVERT(NVARCHAR(10), @H3), N'?'));

-- ---- S63 changes since the start of the test (deleted rows included) -------------------------------------
SET @STEP = N'S63 changes since the start of the test (deleted rows included)';
SET @RAISED = 0;
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_CHANGES @M, 'ZZT', @T0;
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN @H1 = 5 THEN 1 ELSE 0 END, @STEP + N' | ' + N'the 5 rows of the tab', N'rows ' + ISNULL(CONVERT(NVARCHAR(10), @H1), N'?'));

-- ---- S64 grid: delete the second PRICE row ---------------------------------------------------------------
SET @STEP = N'S64 grid: delete the second PRICE row';
SET @RAISED = 0;
SET @G2 = (SELECT MAX(ID) FROM dbo.TBL_EXPT_SHEET_GRIDROW WHERE MONTH_ID = @M AND TAB_CODE = 'PRICE');
SET @IDS = CONVERT(VARCHAR(20), @G2);
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_GRID_ROWS_OP @M, 'PRICE', 'delete', @IDS, 0, 0, 'ZZT_EDITOR', N'Self-test editor';
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN ISNULL(@HS, '') = '100' AND (SELECT ISDELETED FROM dbo.TBL_EXPT_SHEET_GRIDROW WHERE ID = @G2) = 1 THEN 1 ELSE 0 END, @STEP + N' | ' + N'status 100, ISDELETED = 1', N'status ' + ISNULL(@HS, 'none') + N': ' + ISNULL(@HT, N''));

-- ---- S65 grid changes since the start of the test (the deleted row included, the tab layout changed) -----
SET @STEP = N'S65 grid changes since the start of the test (the deleted row included, the tab layout changed)';
SET @RAISED = 0;
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_GRID_CHANGES @M, 'PRICE', @T0;
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN @H1 = 2 AND @H2 = 1 THEN 1 ELSE 0 END, @STEP + N' | ' + N'2 rows (one deleted) and the tab layout', N'rows ' + ISNULL(CONVERT(NVARCHAR(10), @H1), N'?') + N', tab layouts ' + ISNULL(CONVERT(NVARCHAR(10), @H2), N'?'));

-- ---- S66 grid changes since now: nothing -----------------------------------------------------------------
SET @STEP = N'S66 grid changes since now: nothing';
SET @RAISED = 0;
SET @T1 = DATEADD(SECOND, 5, GETDATE());
BEGIN TRY
    EXEC dbo.USP_EXPT_SHEET_GRID_CHANGES @M, 'PRICE', @T1;
END TRY
BEGIN CATCH
    SELECT @RAISED = 1, @ERRMSG = N'raised: ' + ERROR_MESSAGE();
    IF XACT_STATE() = 1 INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (0, @STEP, @ERRMSG);
END CATCH
IF @@TRANCOUNT <> 1 OR XACT_STATE() <> 1 GOTO LOST;
SELECT @HS = NULL, @HT = NULL, @H1 = NULL, @H2 = NULL, @H3 = NULL;
SELECT TOP 1 @HS = STATUS, @HT = STATUSTEXT, @H1 = N1, @H2 = N2, @H3 = N3 FROM #EXPT_SHEET_SELFTEST WHERE N > @HN ORDER BY N DESC;
SELECT @HN = ISNULL(MAX(N), 0) FROM #EXPT_SHEET_SELFTEST;
INSERT INTO @RES (OK, CHECK_NAME, DETAIL) VALUES (CASE WHEN @H1 = 0 AND @H2 = 0 THEN 1 ELSE 0 END, @STEP + N' | ' + N'no rows, no tab layout', N'rows ' + ISNULL(CONVERT(NVARCHAR(10), @H1), N'?') + N', tab layouts ' + ISNULL(CONVERT(NVARCHAR(10), @H2), N'?'));

GOTO FINISH;

LOST:
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;      -- first: an uncommittable transaction allows nothing else
    INSERT INTO @RES (OK, CHECK_NAME, DETAIL)
    VALUES (0, N'transaction', N'The test transaction could not go on at ' + ISNULL(@STEP, N'?') + N' - rolled back; the remaining checks did not run. '
               + ISNULL(@ERRMSG, N''));

FINISH:
IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;

/* ---- 2. no trace left ------------------------------------------------------------------------- */
SELECT @A_ROWS = (SELECT COUNT_BIG(*) FROM dbo.TBL_EXPT_SHEET_MONTH)
               + (SELECT COUNT_BIG(*) FROM dbo.TBL_EXPT_SHEET_ROW)
               + (SELECT COUNT_BIG(*) FROM dbo.TBL_EXPT_SHEET_GRIDROW)
               + (SELECT COUNT_BIG(*) FROM dbo.TBL_EXPT_SHEET_TABMETA)
               + (SELECT COUNT_BIG(*) FROM dbo.TBL_EXPT_SHEET_STATUS)
               + (SELECT COUNT_BIG(*) FROM dbo.TBL_EXPT_SHEET_ROLE)
               + (SELECT COUNT_BIG(*) FROM dbo.TBL_EXPT_SHEET_ROLE_COL)
               + (SELECT COUNT_BIG(*) FROM dbo.TBL_EXPT_SHEET_ROLE_USER)
               + (SELECT COUNT_BIG(*) FROM dbo.TBL_EXPT_SHEET_ALIAS)
               + (SELECT COUNT_BIG(*) FROM dbo.TBL_EXPT_SHEET_LOG)
               + (SELECT COUNT_BIG(*) FROM dbo.TBL_EXPT_SHEET_VIEW);
SELECT @A_EXISTS = 0, @A_SUM = NULL;
SELECT @A_EXISTS = 1, @A_SUM = BINARY_CHECKSUM(*) FROM dbo.EXPT_JOB_TRACKING WHERE EXPTNO = @JOB;
SELECT @A_TLOG = COUNT(*) FROM dbo.EXPT_JOB_TRACKING_LOG WHERE EXPTNO = @JOB;
SELECT @A_SALOG = COUNT(*) FROM dbo.TBL_EXPT_SHEET_LOG WHERE USER_ID = ISNULL(@SAID, '?');
INSERT INTO @RES (OK, CHECK_NAME, DETAIL)
SELECT CASE WHEN @@TRANCOUNT = 0 THEN 1 ELSE 0 END, N'no trace | transaction rolled back', NULL
UNION ALL
SELECT CASE WHEN @A_ROWS = @P_ROWS THEN 1 ELSE 0 END, N'no trace | every Sheet view table back to its row count',
       N'before ' + CONVERT(NVARCHAR(20), @P_ROWS) + N', after ' + CONVERT(NVARCHAR(20), @A_ROWS)
UNION ALL
SELECT CASE WHEN NOT EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_MONTH WHERE SHEET_MONTH LIKE '1900-%' OR CMPCODE = 'ZZ')
             AND NOT EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_ROLE WHERE CODE = 'ZZTEST')
             AND NOT EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_ROLE_USER WHERE USER_ID LIKE 'ZZT[_]%')
             AND NOT EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_STATUS WHERE CODE = 'ZZTEST')
             AND NOT EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_ALIAS WHERE SHEET_VALUE IN (N'ZZ PORT', N'ZZ CONSIGNEE'))
             AND NOT EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_LOG WHERE USER_ID LIKE 'ZZT[_]%')
             AND @A_SALOG = @P_SALOG
            THEN 1 ELSE 0 END, N'no trace | no test month, role, users, status, alias or history (also none for the SA user)', NULL
UNION ALL
SELECT CASE WHEN @A_EXISTS = @P_EXISTS AND ISNULL(@A_SUM, 0) = ISNULL(@P_SUM, 0) AND @A_TLOG = @P_TLOG THEN 1 ELSE 0 END,
       N'no trace | the job''s EXPT_JOB_TRACKING row and log exactly as before',
       N'row ' + CASE WHEN @P_EXISTS = 1 THEN N'existed' ELSE N'did not exist' END + N' before, ' + CASE WHEN @A_EXISTS = 1 THEN N'exists' ELSE N'does not exist' END
       + N' now; log rows ' + CONVERT(NVARCHAR(10), @P_TLOG) + N' -> ' + CONVERT(NVARCHAR(10), @A_TLOG);

/* ---- 3. report -------------------------------------------------------------------------------- */
SELECT @PASS = SUM(CASE WHEN OK = 1 THEN 1 ELSE 0 END), @FAIL = SUM(CASE WHEN OK = 0 THEN 1 ELSE 0 END), @n = MAX(N) FROM @RES;
PRINT '';
PRINT '================ Export > Sheet view self-test (' + CONVERT(VARCHAR(19), GETDATE(), 120) + ') ================';
SET @i = 1;
WHILE @i <= @n
BEGIN
    SELECT @OK = OK, @NM = CHECK_NAME, @DT = DETAIL FROM @RES WHERE N = @i;
    PRINT CASE WHEN @OK = 1 THEN 'PASS  ' ELSE 'FAIL  ' END + @NM + CASE WHEN @OK = 0 AND @DT IS NOT NULL THEN N'   [' + @DT + N']' ELSE N'' END;
    SET @i = @i + 1;
END
PRINT '';
PRINT CONVERT(VARCHAR(10), ISNULL(@PASS, 0)) + ' passed, ' + CONVERT(VARCHAR(10), ISNULL(@FAIL, 0)) + ' failed.'
      + CASE WHEN ISNULL(@FAIL, 0) = 0 THEN ' All good.' ELSE ' See the FAIL lines above.' END;
SELECT @NM = STUFF((SELECT N', ' + I.T + N' +' + CONVERT(NVARCHAR(20), ISNULL(IDENT_CURRENT('dbo.' + I.T), 0) - ISNULL(I.BEFORE_ID, 0))
                    FROM @IDENT I WHERE ISNULL(IDENT_CURRENT('dbo.' + I.T), 0) <> ISNULL(I.BEFORE_ID, 0) ORDER BY I.T
                    FOR XML PATH(''), TYPE).value('.', 'NVARCHAR(MAX)'), 1, 2, N'');
PRINT 'Identity counters moved (SQL Server never rolls them back; no rows remain): ' + ISNULL(@NM, N'none') + '.';
SELECT N AS [#], CASE WHEN OK = 1 THEN 'PASS' ELSE 'FAIL' END AS RESULT, CHECK_NAME, DETAIL FROM @RES ORDER BY N;
DROP TABLE #EXPT_SHEET_SELFTEST;
GO
