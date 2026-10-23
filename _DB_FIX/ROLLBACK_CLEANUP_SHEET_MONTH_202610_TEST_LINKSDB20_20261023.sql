/*===============================================================================================
  ROLLBACK_CLEANUP_SHEET_MONTH_202610_TEST_LINKSDB20_20261023.sql         (LinksDB20)

  Puts back everything CLEANUP_SHEET_MONTH_202610_TEST_LINKSDB20_20261023.sql removed - sheet month 3 (2026-10),
  its WO rows, grid rows, tab layouts, personal views and history - from the BAK_EXPT_SHEET_202610_TEST_* tables,
  with the same ids (IDENTITY_INSERT), in one transaction. With @DropBackup = 1 (the default) the backup tables
  are dropped once the restore has committed.

  Safety : stops before changing anything unless the database is LinksDB20, all six backup tables exist, and
           none of the ids being restored is in use again. It also stops when another 2026-10 month for company
           30 / MUM exists (for example the workbook import already ran): restoring the test month next to it
           is not possible (one month per company / branch / month) and would not be wanted. Re-runnable: with
           the backup tables gone it says so and changes nothing.
  Run as : any login that may insert into the Sheet view tables (and drop the backup tables). SQL Server 2008 R2.
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
    SET NOEXEC ON;
END
GO

DECLARE @problems TABLE (n INT IDENTITY(1,1), problem NVARCHAR(400));

IF OBJECT_ID('dbo.BAK_EXPT_SHEET_202610_TEST_MONTH', 'U') IS NULL
BEGIN
    PRINT 'No BAK_EXPT_SHEET_202610_TEST_MONTH table - nothing to restore (never cleaned, or already restored). Nothing was changed.';
    SET NOEXEC ON;
END
ELSE
BEGIN
    IF OBJECT_ID('dbo.BAK_EXPT_SHEET_202610_TEST_ROW', 'U') IS NULL OR OBJECT_ID('dbo.BAK_EXPT_SHEET_202610_TEST_GRIDROW', 'U') IS NULL
       OR OBJECT_ID('dbo.BAK_EXPT_SHEET_202610_TEST_TABMETA', 'U') IS NULL OR OBJECT_ID('dbo.BAK_EXPT_SHEET_202610_TEST_VIEW', 'U') IS NULL
       OR OBJECT_ID('dbo.BAK_EXPT_SHEET_202610_TEST_LOG', 'U') IS NULL
        INSERT INTO @problems (problem) VALUES ('One of the six BAK_EXPT_SHEET_202610_TEST_* backup tables is missing.');
    ELSE
    BEGIN
        IF EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_MONTH WHERE ID IN (SELECT ID FROM dbo.BAK_EXPT_SHEET_202610_TEST_MONTH))
            INSERT INTO @problems (problem) VALUES ('Sheet month 3 is already back.');
        IF EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_MONTH WHERE CMPCODE = '30' AND CITYCODE = 'MUM' AND SHEET_MONTH = '2026-10')
            INSERT INTO @problems (problem) VALUES ('Another 2026-10 month for company 30 / MUM exists now (the import ran?) - the test month cannot sit next to it.');
        IF EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID IN (SELECT ID FROM dbo.BAK_EXPT_SHEET_202610_TEST_ROW))
           OR EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_GRIDROW WHERE ID IN (SELECT ID FROM dbo.BAK_EXPT_SHEET_202610_TEST_GRIDROW))
           OR EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_VIEW WHERE ID IN (SELECT ID FROM dbo.BAK_EXPT_SHEET_202610_TEST_VIEW))
           OR EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_LOG WHERE ID IN (SELECT ID FROM dbo.BAK_EXPT_SHEET_202610_TEST_LOG))
            INSERT INTO @problems (problem) VALUES ('Some of the ids to restore are in use again.');
    END
    IF ISNULL(HAS_PERMS_BY_NAME('dbo.TBL_EXPT_SHEET_ROW', 'OBJECT', 'INSERT'), 0) = 0
       OR ISNULL(HAS_PERMS_BY_NAME('dbo.TBL_EXPT_SHEET_LOG', 'OBJECT', 'INSERT'), 0) = 0
       OR ISNULL(HAS_PERMS_BY_NAME('dbo.TBL_EXPT_SHEET_MONTH', 'OBJECT', 'INSERT'), 0) = 0
        INSERT INTO @problems (problem) VALUES ('No INSERT permission on the Sheet view tables.');

    IF EXISTS (SELECT 1 FROM @problems)
    BEGIN
        PRINT '*** Check failed on ' + DB_NAME() + ' - NOTHING was changed:';
        SELECT n AS [#], problem FROM @problems ORDER BY n;
        RAISERROR('Check failed - see the list above.', 16, 1);
        SET NOEXEC ON;
    END
    ELSE
        PRINT 'Prerequisites OK on ' + DB_NAME() + '.';
END
GO

/* ---- 2. restore - one transaction --------------------------------------------------------------- */
SET XACT_ABORT ON;
DECLARE @DropBackup BIT;
SET @DropBackup = 1;      -- 1 = drop the BAK_EXPT_SHEET_202610_TEST_* tables after a successful restore

DECLARE @pairs TABLE (n INT IDENTITY(1,1) PRIMARY KEY, live SYSNAME NOT NULL, bak SYSNAME NOT NULL);
INSERT INTO @pairs (live, bak) VALUES        -- parents first: the month, then its rows, then the history
    ('TBL_EXPT_SHEET_MONTH',   'BAK_EXPT_SHEET_202610_TEST_MONTH'),
    ('TBL_EXPT_SHEET_ROW',     'BAK_EXPT_SHEET_202610_TEST_ROW'),
    ('TBL_EXPT_SHEET_GRIDROW', 'BAK_EXPT_SHEET_202610_TEST_GRIDROW'),
    ('TBL_EXPT_SHEET_TABMETA', 'BAK_EXPT_SHEET_202610_TEST_TABMETA'),
    ('TBL_EXPT_SHEET_VIEW',    'BAK_EXPT_SHEET_202610_TEST_VIEW'),
    ('TBL_EXPT_SHEET_LOG',     'BAK_EXPT_SHEET_202610_TEST_LOG');

DECLARE @i INT, @live SYSNAME, @bak SYSNAME, @cols NVARCHAR(MAX), @sql NVARCHAR(MAX), @n INT, @b INT, @err NVARCHAR(400);
BEGIN TRY
    BEGIN TRANSACTION;
    SET @i = 1;
    WHILE @i <= 6
    BEGIN
        SELECT @live = live, @bak = bak FROM @pairs WHERE n = @i;
        -- every stored column of the live table, in order (the backup was made with SELECT * from it)
        SET @cols = STUFF((SELECT ', ' + QUOTENAME(c.name)
                             FROM sys.columns c
                            WHERE c.object_id = OBJECT_ID('dbo.' + @live) AND c.is_computed = 0
                            ORDER BY c.column_id
                              FOR XML PATH(''), TYPE).value('.', 'NVARCHAR(MAX)'), 1, 2, '');
        SET @sql = CASE WHEN OBJECTPROPERTY(OBJECT_ID('dbo.' + @live), 'TableHasIdentity') = 1
                        THEN N'SET IDENTITY_INSERT dbo.' + QUOTENAME(@live) + N' ON; ' ELSE N'' END
                 + N'INSERT INTO dbo.' + QUOTENAME(@live) + N' (' + @cols + N') SELECT ' + @cols + N' FROM dbo.' + QUOTENAME(@bak) + N'; '
                 + N'SELECT @n = @@ROWCOUNT; '
                 + CASE WHEN OBJECTPROPERTY(OBJECT_ID('dbo.' + @live), 'TableHasIdentity') = 1
                        THEN N'SET IDENTITY_INSERT dbo.' + QUOTENAME(@live) + N' OFF; ' ELSE N'' END;
        EXEC sp_executesql @sql, N'@n INT OUTPUT', @n = @n OUTPUT;
        SET @sql = N'SELECT @b = COUNT(*) FROM dbo.' + QUOTENAME(@bak);
        EXEC sp_executesql @sql, N'@b INT OUTPUT', @b = @b OUTPUT;
        IF @n <> @b RAISERROR('%s: restored %d of %d rows - rolled back.', 16, 1, @live, @n, @b);
        PRINT @live + ': ' + CAST(@n AS VARCHAR(10)) + ' row(s) restored.';
        SET @i = @i + 1;
    END
    COMMIT TRANSACTION;
    PRINT 'Done: sheet month 3 is back with the same ids.';

    IF @DropBackup = 1
    BEGIN
        DROP TABLE dbo.BAK_EXPT_SHEET_202610_TEST_LOG;
        DROP TABLE dbo.BAK_EXPT_SHEET_202610_TEST_VIEW;
        DROP TABLE dbo.BAK_EXPT_SHEET_202610_TEST_TABMETA;
        DROP TABLE dbo.BAK_EXPT_SHEET_202610_TEST_GRIDROW;
        DROP TABLE dbo.BAK_EXPT_SHEET_202610_TEST_ROW;
        DROP TABLE dbo.BAK_EXPT_SHEET_202610_TEST_MONTH;
        PRINT 'Backup tables dropped.';
    END
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    SET @err = ERROR_MESSAGE();
    PRINT '*** Restore failed and was rolled back - nothing was changed: ' + @err;
    RAISERROR('%s', 16, 1, @err);
END CATCH
GO

SET NOEXEC OFF;
GO

/* ---- 3. verify (read-only) -------------------------------------------------------------------- */
SELECT ID, CMPCODE, CITYCODE, SHEET_MONTH, TITLE, MAKER_ID FROM dbo.TBL_EXPT_SHEET_MONTH ORDER BY SHEET_MONTH DESC;
SELECT TAB_CODE, COUNT(*) AS rows_ FROM dbo.TBL_EXPT_SHEET_ROW WHERE MONTH_ID = 3 GROUP BY TAB_CODE ORDER BY TAB_CODE;
GO
