/*===============================================================================================
  ROLLBACK_GRANT_SHEET_ADMIN_YASH_YOGESH_RAJESH_LINKSDB20_20261030.sql   (LinksDB20)

  Removes what GRANT_SHEET_ADMIN_YASH_YOGESH_RAJESH_LINKSDB20_20261030.sql gave 81 JYASH, 82 PYOGESH and 45 LRAJESH:
    - form 450 (View, Add, Modify) on 30110, 30-Oct-2026 to 31-Dec-2027: only rows with exactly those values;
    - the ADMIN sheet role rows the script added (MAKER_ID 'DBFIX'). An ADMIN row given later on the Column Access
      tab (another MAKER_ID) is left alone.
  Their 448 / 449 rights and OPS / BOOKING roles are not touched. The removal is logged in TBL_EXPT_SHEET_LOG like a
  Column Access save.

  Safety : stops unless the database is LinksDB20. One transaction. Re-runnable: with the rows gone it says 0.
  Run as : any login that may delete from dbo.tbl_Mst_FormWiseRights and dbo.TBL_EXPT_SHEET_ROLE_USER and insert
           into dbo.TBL_EXPT_SHEET_LOG. SQL Server 2008 R2.
===============================================================================================*/
USE [LinksDB20]
GO
SET NOCOUNT ON;
GO

SET NOEXEC OFF;
IF DB_NAME() <> 'LinksDB20'
BEGIN
    PRINT '*** Connected to ' + DB_NAME() + ', not LinksDB20 - NOTHING was changed.';
    RAISERROR('Wrong database.', 16, 1);
    SET NOEXEC ON;
END
GO

SET XACT_ABORT ON;
DECLARE @n INT, @m INT, @now DATETIME, @old NVARCHAR(2000), @new NVARCHAR(2000), @err NVARCHAR(400);
SET @now = GETDATE();
BEGIN TRY
    BEGIN TRANSACTION;

    DELETE FROM dbo.tbl_Mst_FormWiseRights
     WHERE fk_cmpId IN (45, 81, 82) AND fk_cmp_code = '30110' AND fk_ModuleId = 3 AND fk_FormId = 450
       AND FromDt = '20261030' AND ToDt = '20271231'
       AND viewForm = 1 AND AddForm = 1 AND modifyForm = 1 AND DeleteForm = 0;
    SET @n = @@ROWCOUNT;
    IF @n > 3 RAISERROR('Would delete %d form 450 rows instead of at most 3 - rolled back.', 16, 1, @n);

    SET @old = ISNULL(STUFF((SELECT N',' + USER_ID FROM dbo.TBL_EXPT_SHEET_ROLE_USER WITH (UPDLOCK, HOLDLOCK)
                              WHERE ROLE_CODE = 'ADMIN' ORDER BY USER_ID FOR XML PATH(''), TYPE).value('.', 'NVARCHAR(MAX)'), 1, 1, N''), N'');
    DELETE FROM dbo.TBL_EXPT_SHEET_ROLE_USER
     WHERE ROLE_CODE = 'ADMIN' AND USER_ID IN ('P100045', 'P100081', 'P100082') AND MAKER_ID = 'DBFIX';
    SET @m = @@ROWCOUNT;
    IF @m > 3 RAISERROR('Would delete %d ADMIN role rows instead of at most 3 - rolled back.', 16, 1, @m);
    SET @new = ISNULL(STUFF((SELECT N',' + USER_ID FROM dbo.TBL_EXPT_SHEET_ROLE_USER
                              WHERE ROLE_CODE = 'ADMIN' ORDER BY USER_ID FOR XML PATH(''), TYPE).value('.', 'NVARCHAR(MAX)'), 1, 1, N''), N'');
    IF @m > 0
        INSERT INTO dbo.TBL_EXPT_SHEET_LOG (ROW_KIND, ROW_ID, COL_KEY, OLD_VALUE, NEW_VALUE, ACTION, USER_ID, USER_NAME, LOG_DT)
        VALUES ('M', 0, 'ROLE.ADMIN.USERS', LEFT(@old, 2000), LEFT(@new, 2000), 'edit', 'DBFIX',
                N'ROLLBACK_GRANT_SHEET_ADMIN_YASH_YOGESH_RAJESH script', @now);

    COMMIT TRANSACTION;
    PRINT CONVERT(VARCHAR(12), @n) + ' form 450 row(s) and ' + CONVERT(VARCHAR(12), @m) + ' ADMIN role row(s) removed.';
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    SET @err = ERROR_MESSAGE();
    PRINT '*** Rollback failed and was undone - nothing was changed: ' + @err;
    RAISERROR('%s', 16, 1, @err);
END CATCH
GO

SET NOEXEC OFF;
GO

SELECT fk_cmpId, fk_FormId, fk_cmp_code, viewForm, AddForm, modifyForm,
       CONVERT(VARCHAR(10), FromDt, 120) AS FromDt, CONVERT(VARCHAR(10), ToDt, 120) AS ToDt
  FROM dbo.tbl_Mst_FormWiseRights
 WHERE fk_cmpId IN (45, 81, 82) AND fk_FormId IN (448, 449, 450)
 ORDER BY fk_cmpId, fk_FormId;
SELECT ROLE_CODE, USER_ID, MAKER_ID FROM dbo.TBL_EXPT_SHEET_ROLE_USER
 WHERE USER_ID IN ('P100045', 'P100081', 'P100082')
 ORDER BY USER_ID, ROLE_CODE;
GO
