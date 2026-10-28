/*===============================================================================================
  ROLLBACK_GRANT_SHEET_VIEW_ROLE_USERS_LINKSDB20_20261028.sql             (LinksDB20)

  Removes the rights GRANT_SHEET_VIEW_ROLE_USERS_LINKSDB20_20261028.sql gave 7 users (cmpid 19, 22, 45, 71, 79, 80,
  81) on 30110: 448 (View, Add, Modify) and 449 (View), 28-Oct-2026 to 31-Dec-2027. Only rows with exactly those
  values are deleted; rows changed since are left alone and listed. P YOGESH (82) is not touched (his grant has its
  own rollback).

  Safety : stops unless the database is LinksDB20. One transaction. Re-runnable: with the rows gone it says 0.
  Run as : any login that may delete from dbo.tbl_Mst_FormWiseRights. SQL Server 2008 R2.
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
DECLARE @n INT, @err NVARCHAR(400);
BEGIN TRY
    BEGIN TRANSACTION;
    DELETE FROM dbo.tbl_Mst_FormWiseRights
     WHERE fk_cmpId IN (19, 22, 45, 71, 79, 80, 81) AND fk_cmp_code = '30110' AND fk_ModuleId = 3
       AND FromDt = '20261028' AND ToDt = '20271231' AND DeleteForm = 0
       AND (   (fk_FormId = 448 AND viewForm = 1 AND AddForm = 1 AND modifyForm = 1)
            OR (fk_FormId = 449 AND viewForm = 1 AND AddForm = 0 AND modifyForm = 0));
    SET @n = @@ROWCOUNT;
    IF @n > 14 RAISERROR('Would delete %d rows instead of at most 14 - rolled back.', 16, 1, @n);
    COMMIT TRANSACTION;
    PRINT CONVERT(VARCHAR(12), @n) + ' row(s) removed.';
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
 WHERE fk_cmpId IN (19, 22, 45, 71, 79, 80, 81) AND fk_FormId IN (448, 449, 450)
 ORDER BY fk_cmpId, fk_FormId;
GO
