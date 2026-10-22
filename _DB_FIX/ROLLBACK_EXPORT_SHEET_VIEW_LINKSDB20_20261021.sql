/*===============================================================================================
  ROLLBACK_EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql         (LinksDB20)

  Rollback for EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql (Export > Sheet view). None of its objects existed on
  LinksDB20 before that script (checked 2026-10-21), so the rollback is a removal, in this order:

   1. the 36 USP_EXPT_SHEET_* procedures - each one only when its text names that script (so that script created
      it); a same-named procedure from anywhere else is left alone and reported.
   2. the Links form rows 448 EXPORT - SHEET VIEW, 449 EXPORT - SHEET VIEW CONVERT / LINK JOB and 450 EXPORT - SHEET
      VIEW SETTINGS (only when the row is that script's form, matched by id + FormName), with the form-wise rights
      granted on them since (rights on a form that no longer exists mean nothing).
   3. the 11 TBL_EXPT_SHEET_* tables. Once people use the page they hold the sheet itself (months, rows, history,
      roles, aliases, views), so they are dropped only while those tables are empty; otherwise they are kept and the
      row counts are printed. Set @DropEvenIfData = 1 below to drop them anyway (the data is then gone for good -
      take a backup first). The seeded legend / roles / column owners alone do not count as data.

  NOT undone: EXPT_JOB_TRACKING / EXPT_JOB_TRACKING_LOG rows written when sheet rows were linked or edited - they are
  the 12 Oct tracking module's ordinary data.
  After it: api/Export/Sheet/... answers STATUS 101 (procedure not found); nothing else is affected.

  Safety : stops by itself on any database other than LinksDB20. Re-runnable.  SQL Server 2008 R2.
===============================================================================================*/
USE [LinksDB20]
GO
SET NOCOUNT ON;

IF UPPER(DB_NAME()) <> 'LINKSDB20'
BEGIN
    PRINT '*** Connected to ' + DB_NAME() + ', not LinksDB20. Nothing done.';
    RETURN;
END

DECLARE @DropEvenIfData BIT;
SET @DropEvenIfData = 0;          -- 1 = drop the tables even when they hold sheet data (gone for good)

DECLARE @marker VARCHAR(100), @i INT, @n INT, @p SYSNAME, @sql NVARCHAR(400), @rows BIGINT, @forms INT, @rights INT;
SET @marker = 'EXPORT_SHEET_VIEW_LINKSDB20_20261021';

/* ---- 1. procedures (only this script's own) --------------------------------------------- */
DECLARE @procs TABLE (n INT IDENTITY(1,1) PRIMARY KEY, p SYSNAME NOT NULL);
INSERT INTO @procs (p) VALUES
    ('USP_EXPT_SHEET_MONTHS'), ('USP_EXPT_SHEET_MONTH_IU'), ('USP_EXPT_SHEET_LOAD'), ('USP_EXPT_SHEET_CHANGES'),
    ('USP_EXPT_SHEET_SAVE_CELLS'), ('USP_EXPT_SHEET_SAVE_FMT'), ('USP_EXPT_SHEET_ROWS_OP'), ('USP_EXPT_SHEET_GRID_ROWS_OP'),
    ('USP_EXPT_SHEET_LINK'), ('USP_EXPT_SHEET_CONVERT_DONE'), ('USP_EXPT_SHEET_UNLINK'), ('USP_EXPT_SHEET_CONVERT_DRAFT'),
    ('USP_EXPT_SHEET_HISTORY'), ('USP_EXPT_SHEET_RESTORE_VALUE'), ('USP_EXPT_SHEET_LEGEND'), ('USP_EXPT_SHEET_LEGEND_IU'),
    ('USP_EXPT_SHEET_ROLES'), ('USP_EXPT_SHEET_ROLES_IU'), ('USP_EXPT_SHEET_MY_ROLES'), ('USP_EXPT_SHEET_ALIAS'),
    ('USP_EXPT_SHEET_ALIAS_IU'), ('USP_EXPT_SHEET_ALIAS_SEED'), ('USP_EXPT_SHEET_VIEWS'), ('USP_EXPT_SHEET_VIEW_IU'),
    ('USP_EXPT_SHEET_VIEW_DEL'), ('USP_EXPT_SHEET_GRID_LOAD'), ('USP_EXPT_SHEET_GRID_SAVE'), ('USP_EXPT_SHEET_TABMETA_IU'),
    ('USP_EXPT_SHEET_GRID_CHANGES'), ('USP_EXPT_SHEET_GRID_SAVE_FMT'),
    ('USP_EXPT_SHEET_KPI'),
    -- the internal ones last (the public ones call them)
    ('USP_EXPT_SHEET_SAVE_APPLY'), ('USP_EXPT_SHEET_LINK_APPLY'), ('USP_EXPT_SHEET_ROWS_OUT'), ('USP_EXPT_SHEET_TRACK_MIRROR'),
    ('USP_EXPT_SHEET_LINKS_FILL');

SELECT @i = 1, @n = MAX(n) FROM @procs;
WHILE @i <= @n
BEGIN
    SELECT @p = p FROM @procs WHERE n = @i;
    IF OBJECT_ID('dbo.' + @p, 'P') IS NULL
        PRINT @p + ' not present - nothing to do.';
    ELSE IF CHARINDEX(@marker, ISNULL(OBJECT_DEFINITION(OBJECT_ID('dbo.' + @p)), '')) = 0
        PRINT '*** ' + @p + ' kept: it was not created by EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql.';
    ELSE
    BEGIN
        SET @sql = N'DROP PROCEDURE dbo.' + QUOTENAME(@p) + N';';
        EXEC (@sql);
        PRINT @p + ' dropped.';
    END
    SET @i = @i + 1;
END

/* ---- 2. form rows 448-450 (only this script's own) and the rights granted on them -------- */
DECLARE @myforms TABLE (id INT NOT NULL PRIMARY KEY);
INSERT INTO @myforms (id)
SELECT f.pk_FormId
  FROM dbo.tbl_Mst_Form f
       JOIN (VALUES (448, 'sheet-view.component.html'), (449, 'sheet-view.convert'), (450, 'sheet-view.settings')) x (id, nm)
         ON x.id = f.pk_FormId AND f.FormName = x.nm AND f.fk_ModuleId = 3;

SELECT @rights = COUNT(*) FROM dbo.tbl_Mst_FormWiseRights WHERE fk_FormId IN (SELECT id FROM @myforms);
DELETE FROM dbo.tbl_Mst_FormWiseRights WHERE fk_FormId IN (SELECT id FROM @myforms);
DELETE FROM dbo.tbl_Mst_Form WHERE pk_FormId IN (SELECT id FROM @myforms);
SET @forms = @@ROWCOUNT;
PRINT 'tbl_Mst_Form: ' + CAST(@forms AS VARCHAR(10)) + ' form row(s) removed, with ' + CAST(@rights AS VARCHAR(10)) + ' rights row(s).';
IF EXISTS (SELECT 1 FROM dbo.tbl_Mst_Form WHERE pk_FormId IN (448, 449, 450) AND pk_FormId NOT IN (SELECT id FROM @myforms))
    PRINT '*** Form id(s) among 448-450 that belong to another form were left alone.';

/* ---- 3. tables ------------------------------------------------------------------------------ */
SET @rows = 0;
IF OBJECT_ID('dbo.TBL_EXPT_SHEET_MONTH', 'U') IS NOT NULL     SELECT @rows = @rows + COUNT_BIG(*) FROM dbo.TBL_EXPT_SHEET_MONTH;
IF OBJECT_ID('dbo.TBL_EXPT_SHEET_ROW', 'U') IS NOT NULL       SELECT @rows = @rows + COUNT_BIG(*) FROM dbo.TBL_EXPT_SHEET_ROW;
IF OBJECT_ID('dbo.TBL_EXPT_SHEET_GRIDROW', 'U') IS NOT NULL   SELECT @rows = @rows + COUNT_BIG(*) FROM dbo.TBL_EXPT_SHEET_GRIDROW;
IF OBJECT_ID('dbo.TBL_EXPT_SHEET_TABMETA', 'U') IS NOT NULL   SELECT @rows = @rows + COUNT_BIG(*) FROM dbo.TBL_EXPT_SHEET_TABMETA;
IF OBJECT_ID('dbo.TBL_EXPT_SHEET_ROLE_USER', 'U') IS NOT NULL SELECT @rows = @rows + COUNT_BIG(*) FROM dbo.TBL_EXPT_SHEET_ROLE_USER;
IF OBJECT_ID('dbo.TBL_EXPT_SHEET_ALIAS', 'U') IS NOT NULL     SELECT @rows = @rows + COUNT_BIG(*) FROM dbo.TBL_EXPT_SHEET_ALIAS;
IF OBJECT_ID('dbo.TBL_EXPT_SHEET_LOG', 'U') IS NOT NULL       SELECT @rows = @rows + COUNT_BIG(*) FROM dbo.TBL_EXPT_SHEET_LOG;
IF OBJECT_ID('dbo.TBL_EXPT_SHEET_VIEW', 'U') IS NOT NULL      SELECT @rows = @rows + COUNT_BIG(*) FROM dbo.TBL_EXPT_SHEET_VIEW;

IF @rows > 0 AND @DropEvenIfData = 0
BEGIN
    PRINT '*** The 11 TBL_EXPT_SHEET_* tables were KEPT: they hold ' + CAST(@rows AS VARCHAR(20))
          + ' row(s) of sheet data (months, rows, grid rows, tab layouts, role users, aliases, history, views).';
    PRINT '    Set @DropEvenIfData = 1 at the top and re-run to drop them as well (take a backup first).';
END
ELSE
BEGIN
    -- children before parents (foreign keys)
    IF OBJECT_ID('dbo.TBL_EXPT_SHEET_ROW', 'U') IS NOT NULL       BEGIN DROP TABLE dbo.TBL_EXPT_SHEET_ROW;       PRINT 'TBL_EXPT_SHEET_ROW dropped.'; END
    IF OBJECT_ID('dbo.TBL_EXPT_SHEET_GRIDROW', 'U') IS NOT NULL   BEGIN DROP TABLE dbo.TBL_EXPT_SHEET_GRIDROW;   PRINT 'TBL_EXPT_SHEET_GRIDROW dropped.'; END
    IF OBJECT_ID('dbo.TBL_EXPT_SHEET_TABMETA', 'U') IS NOT NULL   BEGIN DROP TABLE dbo.TBL_EXPT_SHEET_TABMETA;   PRINT 'TBL_EXPT_SHEET_TABMETA dropped.'; END
    IF OBJECT_ID('dbo.TBL_EXPT_SHEET_ROLE_COL', 'U') IS NOT NULL  BEGIN DROP TABLE dbo.TBL_EXPT_SHEET_ROLE_COL;  PRINT 'TBL_EXPT_SHEET_ROLE_COL dropped.'; END
    IF OBJECT_ID('dbo.TBL_EXPT_SHEET_ROLE_USER', 'U') IS NOT NULL BEGIN DROP TABLE dbo.TBL_EXPT_SHEET_ROLE_USER; PRINT 'TBL_EXPT_SHEET_ROLE_USER dropped.'; END
    IF OBJECT_ID('dbo.TBL_EXPT_SHEET_LOG', 'U') IS NOT NULL       BEGIN DROP TABLE dbo.TBL_EXPT_SHEET_LOG;       PRINT 'TBL_EXPT_SHEET_LOG dropped.'; END
    IF OBJECT_ID('dbo.TBL_EXPT_SHEET_VIEW', 'U') IS NOT NULL      BEGIN DROP TABLE dbo.TBL_EXPT_SHEET_VIEW;      PRINT 'TBL_EXPT_SHEET_VIEW dropped.'; END
    IF OBJECT_ID('dbo.TBL_EXPT_SHEET_ALIAS', 'U') IS NOT NULL     BEGIN DROP TABLE dbo.TBL_EXPT_SHEET_ALIAS;     PRINT 'TBL_EXPT_SHEET_ALIAS dropped.'; END
    IF OBJECT_ID('dbo.TBL_EXPT_SHEET_STATUS', 'U') IS NOT NULL    BEGIN DROP TABLE dbo.TBL_EXPT_SHEET_STATUS;    PRINT 'TBL_EXPT_SHEET_STATUS dropped.'; END
    IF OBJECT_ID('dbo.TBL_EXPT_SHEET_ROLE', 'U') IS NOT NULL      BEGIN DROP TABLE dbo.TBL_EXPT_SHEET_ROLE;      PRINT 'TBL_EXPT_SHEET_ROLE dropped.'; END
    IF OBJECT_ID('dbo.TBL_EXPT_SHEET_MONTH', 'U') IS NOT NULL     BEGIN DROP TABLE dbo.TBL_EXPT_SHEET_MONTH;     PRINT 'TBL_EXPT_SHEET_MONTH dropped.'; END
    IF @rows > 0
        PRINT '*** ' + CAST(@rows AS VARCHAR(20)) + ' row(s) of sheet data were dropped with the tables (@DropEvenIfData = 1).';
END
GO
