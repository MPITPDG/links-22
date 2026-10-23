/*===============================================================================================
  CLEANUP_SHEET_MONTH_202610_TEST_LINKSDB20_20261023.sql         (LinksDB20)

  Why  : on 2026-10-23, right after the Sheet view went live, the October 2026 sheet month (ID 3, company 30,
         MUM) was created by hand on the page to try it out: Vipar 79 rows (its first row is the pasted header
         line), RK 1,000 rows of which 997 are empty, nothing linked to a job. The one-time workbook import needs
         that month to be free (its @Replace only replaces an earlier run of the import itself), so this test
         month has to go before the cut-over.
  What : removes sheet month 3 completely - the month row, its WO rows, grid rows, tab layouts, personal views
         and its history (TBL_EXPT_SHEET_LOG entries of its rows, grid rows and the month itself). Every row is
         first copied into BAK_EXPT_SHEET_202610_TEST_* tables, so the rollback can put it all back with the
         same ids. Settings history (legend / roles / aliases) and every other month are not touched.

  Safety : step 1 stops before changing anything unless: the database is LinksDB20; month 3 is company 30,
           MUM, 2026-10 and was created by user 1; no row of it is linked to a job (so nothing of it was ever
           mirrored into EXPT_JOB_TRACKING); every row, grid row and history entry of it is user 1's (nobody
           else has started using it); no backup table of this script exists yet; and the login may create
           tables and delete from the Sheet view tables. Step 2 runs in one transaction and checks that every
           count deleted equals the count backed up, else it rolls back. Re-runnable: once month 3 is gone it
           says so and changes nothing.
  Rollback: ROLLBACK_CLEANUP_SHEET_MONTH_202610_TEST_LINKSDB20_20261023.sql (restores from the backup tables).
  Run as : any login that may create tables on LinksDB20 (normal login). SQL Server 2008 R2.
===============================================================================================*/
USE [LinksDB20]
GO
SET NOCOUNT ON;
GO

/* ---- 1. checks (read-only) -------------------------------------------------------------------- */
SET NOEXEC OFF;
IF DB_NAME() <> 'LinksDB20'
BEGIN
    PRINT '*** Connected to ' + DB_NAME() + ', not LinksDB20 - NOTHING was changed.';
    RAISERROR('Wrong database.', 16, 1);
    SET NOEXEC ON;         -- skip everything below
END
GO

DECLARE @problems TABLE (n INT IDENTITY(1,1), problem NVARCHAR(400));
DECLARE @M INT, @rows INT, @grid INT, @meta INT, @views INT, @log INT;
SET @M = 3;

IF NOT EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_MONTH WHERE ID = @M)
BEGIN
    PRINT 'Sheet month 3 is not there - nothing to clean (already done?). Nothing was changed.';
    SET NOEXEC ON;      -- skip the rest, no error
END
ELSE
BEGIN
    IF NOT EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_MONTH
                    WHERE ID = @M AND CMPCODE = '30' AND CITYCODE = 'MUM' AND SHEET_MONTH = '2026-10' AND MAKER_ID = '1')
        INSERT INTO @problems (problem) VALUES ('Sheet month 3 is not the expected test month (company 30, MUM, 2026-10, created by user 1).');
    IF EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_ROW WHERE MONTH_ID = @M AND EXPTNO IS NOT NULL)
        INSERT INTO @problems (problem) VALUES ('A row of month 3 is linked to a job - its tracking columns were mirrored into EXPT_JOB_TRACKING, which this script would not undo.');
    IF EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_ROW WHERE MONTH_ID = @M AND (ISNULL(MAKER_ID, '') <> '1' OR ISNULL(MODIFY_ID, '') <> '1'))
       OR EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_GRIDROW WHERE MONTH_ID = @M AND (ISNULL(MAKER_ID, '') <> '1' OR ISNULL(MODIFY_ID, '') <> '1'))
       OR EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_LOG L
                   WHERE ISNULL(L.USER_ID, '') <> '1'
                     AND (   (L.ROW_KIND = 'W' AND L.ROW_ID IN (SELECT ID FROM dbo.TBL_EXPT_SHEET_ROW WHERE MONTH_ID = @M))
                          OR (L.ROW_KIND = 'G' AND L.ROW_ID IN (SELECT ID FROM dbo.TBL_EXPT_SHEET_GRIDROW WHERE MONTH_ID = @M))
                          OR (L.ROW_KIND = 'M' AND L.ROW_ID = @M)))
        INSERT INTO @problems (problem) VALUES ('Someone other than user 1 has written to month 3 - it is in real use; left alone.');
    IF OBJECT_ID('dbo.BAK_EXPT_SHEET_202610_TEST_MONTH', 'U') IS NOT NULL OR OBJECT_ID('dbo.BAK_EXPT_SHEET_202610_TEST_ROW', 'U') IS NOT NULL
       OR OBJECT_ID('dbo.BAK_EXPT_SHEET_202610_TEST_GRIDROW', 'U') IS NOT NULL OR OBJECT_ID('dbo.BAK_EXPT_SHEET_202610_TEST_TABMETA', 'U') IS NOT NULL
       OR OBJECT_ID('dbo.BAK_EXPT_SHEET_202610_TEST_VIEW', 'U') IS NOT NULL OR OBJECT_ID('dbo.BAK_EXPT_SHEET_202610_TEST_LOG', 'U') IS NOT NULL
        INSERT INTO @problems (problem) VALUES ('A BAK_EXPT_SHEET_202610_TEST_* backup table already exists (an earlier run?). Restore or drop it first.');
    IF ISNULL(HAS_PERMS_BY_NAME(DB_NAME(), 'DATABASE', 'CREATE TABLE'), 0) = 0
        INSERT INTO @problems (problem) VALUES ('No CREATE TABLE permission (needed for the backup tables).');
    IF ISNULL(HAS_PERMS_BY_NAME('dbo.TBL_EXPT_SHEET_ROW', 'OBJECT', 'DELETE'), 0) = 0
       OR ISNULL(HAS_PERMS_BY_NAME('dbo.TBL_EXPT_SHEET_LOG', 'OBJECT', 'DELETE'), 0) = 0
       OR ISNULL(HAS_PERMS_BY_NAME('dbo.TBL_EXPT_SHEET_MONTH', 'OBJECT', 'DELETE'), 0) = 0
        INSERT INTO @problems (problem) VALUES ('No DELETE permission on the Sheet view tables.');

    IF EXISTS (SELECT 1 FROM @problems)
    BEGIN
        PRINT '*** Check failed on ' + DB_NAME() + ' - NOTHING was changed:';
        SELECT n AS [#], problem FROM @problems ORDER BY n;
        RAISERROR('Check failed - see the list above.', 16, 1);
        SET NOEXEC ON;     -- skip the rest of the script
    END
    ELSE
    BEGIN
        SELECT @rows  = (SELECT COUNT(*) FROM dbo.TBL_EXPT_SHEET_ROW WHERE MONTH_ID = @M),
               @grid  = (SELECT COUNT(*) FROM dbo.TBL_EXPT_SHEET_GRIDROW WHERE MONTH_ID = @M),
               @meta  = (SELECT COUNT(*) FROM dbo.TBL_EXPT_SHEET_TABMETA WHERE MONTH_ID = @M),
               @views = (SELECT COUNT(*) FROM dbo.TBL_EXPT_SHEET_VIEW WHERE MONTH_ID = @M),
               @log   = (SELECT COUNT(*) FROM dbo.TBL_EXPT_SHEET_LOG L
                          WHERE (L.ROW_KIND = 'W' AND L.ROW_ID IN (SELECT ID FROM dbo.TBL_EXPT_SHEET_ROW WHERE MONTH_ID = @M))
                             OR (L.ROW_KIND = 'G' AND L.ROW_ID IN (SELECT ID FROM dbo.TBL_EXPT_SHEET_GRIDROW WHERE MONTH_ID = @M))
                             OR (L.ROW_KIND = 'M' AND L.ROW_ID = @M));
        PRINT 'Prerequisites OK on ' + DB_NAME() + '. To back up and remove: month 3, '
              + CAST(@rows AS VARCHAR(10)) + ' WO rows, ' + CAST(@grid AS VARCHAR(10)) + ' grid rows, '
              + CAST(@meta AS VARCHAR(10)) + ' tab layouts, ' + CAST(@views AS VARCHAR(10)) + ' personal views, '
              + CAST(@log AS VARCHAR(10)) + ' history entries.';
    END
END
GO

/* ---- 2. back up, then delete - one transaction ------------------------------------------------ */
SET XACT_ABORT ON;
DECLARE @M INT, @n INT, @b INT, @err NVARCHAR(400);
SET @M = 3;
BEGIN TRY
    BEGIN TRANSACTION;

    SELECT * INTO dbo.BAK_EXPT_SHEET_202610_TEST_MONTH   FROM dbo.TBL_EXPT_SHEET_MONTH   WHERE ID = @M;
    SELECT * INTO dbo.BAK_EXPT_SHEET_202610_TEST_ROW     FROM dbo.TBL_EXPT_SHEET_ROW     WHERE MONTH_ID = @M;
    SELECT * INTO dbo.BAK_EXPT_SHEET_202610_TEST_GRIDROW FROM dbo.TBL_EXPT_SHEET_GRIDROW WHERE MONTH_ID = @M;
    SELECT * INTO dbo.BAK_EXPT_SHEET_202610_TEST_TABMETA FROM dbo.TBL_EXPT_SHEET_TABMETA WHERE MONTH_ID = @M;
    SELECT * INTO dbo.BAK_EXPT_SHEET_202610_TEST_VIEW    FROM dbo.TBL_EXPT_SHEET_VIEW    WHERE MONTH_ID = @M;
    SELECT L.* INTO dbo.BAK_EXPT_SHEET_202610_TEST_LOG
      FROM dbo.TBL_EXPT_SHEET_LOG L
     WHERE (L.ROW_KIND = 'W' AND L.ROW_ID IN (SELECT ID FROM dbo.BAK_EXPT_SHEET_202610_TEST_ROW))
        OR (L.ROW_KIND = 'G' AND L.ROW_ID IN (SELECT ID FROM dbo.BAK_EXPT_SHEET_202610_TEST_GRIDROW))
        OR (L.ROW_KIND = 'M' AND L.ROW_ID = @M);

    -- history first, then the children, the month last
    DELETE L FROM dbo.TBL_EXPT_SHEET_LOG L INNER JOIN dbo.BAK_EXPT_SHEET_202610_TEST_LOG B ON B.ID = L.ID;
    SET @n = @@ROWCOUNT; SELECT @b = COUNT(*) FROM dbo.BAK_EXPT_SHEET_202610_TEST_LOG;
    IF @n <> @b RAISERROR('History: deleted %d, backed up %d - rolled back.', 16, 1, @n, @b);

    DELETE FROM dbo.TBL_EXPT_SHEET_VIEW WHERE MONTH_ID = @M;
    SET @n = @@ROWCOUNT; SELECT @b = COUNT(*) FROM dbo.BAK_EXPT_SHEET_202610_TEST_VIEW;
    IF @n <> @b RAISERROR('Views: deleted %d, backed up %d - rolled back.', 16, 1, @n, @b);

    DELETE FROM dbo.TBL_EXPT_SHEET_TABMETA WHERE MONTH_ID = @M;
    SET @n = @@ROWCOUNT; SELECT @b = COUNT(*) FROM dbo.BAK_EXPT_SHEET_202610_TEST_TABMETA;
    IF @n <> @b RAISERROR('Tab layouts: deleted %d, backed up %d - rolled back.', 16, 1, @n, @b);

    DELETE FROM dbo.TBL_EXPT_SHEET_GRIDROW WHERE MONTH_ID = @M;
    SET @n = @@ROWCOUNT; SELECT @b = COUNT(*) FROM dbo.BAK_EXPT_SHEET_202610_TEST_GRIDROW;
    IF @n <> @b RAISERROR('Grid rows: deleted %d, backed up %d - rolled back.', 16, 1, @n, @b);

    DELETE FROM dbo.TBL_EXPT_SHEET_ROW WHERE MONTH_ID = @M;
    SET @n = @@ROWCOUNT; SELECT @b = COUNT(*) FROM dbo.BAK_EXPT_SHEET_202610_TEST_ROW;
    IF @n <> @b RAISERROR('WO rows: deleted %d, backed up %d - rolled back.', 16, 1, @n, @b);

    DELETE FROM dbo.TBL_EXPT_SHEET_MONTH WHERE ID = @M;
    SET @n = @@ROWCOUNT;
    IF @n <> 1 RAISERROR('Month: deleted %d rows, expected 1 - rolled back.', 16, 1, @n);

    COMMIT TRANSACTION;
    PRINT 'Done: sheet month 3 removed; every row is kept in the BAK_EXPT_SHEET_202610_TEST_* tables.';
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    SET @err = ERROR_MESSAGE();
    PRINT '*** Cleanup failed and was rolled back - nothing was changed: ' + @err;
    RAISERROR('%s', 16, 1, @err);
END CATCH
GO

SET NOEXEC OFF;
GO

/* ---- 3. verify (read-only) -------------------------------------------------------------------- */
SELECT 'live month 3 rows left' AS [check],
       (SELECT COUNT(*) FROM dbo.TBL_EXPT_SHEET_MONTH WHERE ID = 3)
     + (SELECT COUNT(*) FROM dbo.TBL_EXPT_SHEET_ROW WHERE MONTH_ID = 3)
     + (SELECT COUNT(*) FROM dbo.TBL_EXPT_SHEET_GRIDROW WHERE MONTH_ID = 3)
     + (SELECT COUNT(*) FROM dbo.TBL_EXPT_SHEET_TABMETA WHERE MONTH_ID = 3)
     + (SELECT COUNT(*) FROM dbo.TBL_EXPT_SHEET_VIEW WHERE MONTH_ID = 3) AS [count];
IF OBJECT_ID('dbo.BAK_EXPT_SHEET_202610_TEST_MONTH', 'U') IS NOT NULL
    EXEC ('SELECT ''backed up'' AS [check],
                  (SELECT COUNT(*) FROM dbo.BAK_EXPT_SHEET_202610_TEST_MONTH) AS months,
                  (SELECT COUNT(*) FROM dbo.BAK_EXPT_SHEET_202610_TEST_ROW) AS wo_rows,
                  (SELECT COUNT(*) FROM dbo.BAK_EXPT_SHEET_202610_TEST_GRIDROW) AS grid_rows,
                  (SELECT COUNT(*) FROM dbo.BAK_EXPT_SHEET_202610_TEST_TABMETA) AS tab_layouts,
                  (SELECT COUNT(*) FROM dbo.BAK_EXPT_SHEET_202610_TEST_VIEW) AS views_,
                  (SELECT COUNT(*) FROM dbo.BAK_EXPT_SHEET_202610_TEST_LOG) AS history');
SELECT ID, CMPCODE, CITYCODE, SHEET_MONTH, TITLE FROM dbo.TBL_EXPT_SHEET_MONTH ORDER BY SHEET_MONTH DESC;
GO
