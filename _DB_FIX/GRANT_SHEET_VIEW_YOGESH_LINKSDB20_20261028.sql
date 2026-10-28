/*===============================================================================================
  GRANT_SHEET_VIEW_YOGESH_LINKSDB20_20261028.sql                          (LinksDB20)

  Why    : P YOGESH (cmpid 82, user code P100082; sheet roles BOOKING and OPS) gets "no view right on EXPORT - SHEET
           VIEW" because nobody holds rights on the Sheet view forms yet and the new Links has no rights screen
           (Admin > User Rights comes with ADMIN_USER_RIGHTS_LINKSDB20_20261028.sql). Requested 2026-10-28.
  What   : two tbl_Mst_FormWiseRights rows for user 82 on company 30 / Mumbai (30110), 28-Oct-2026 to 31-Dec-2027
           (the end date of his other rights):
             448 EXPORT - SHEET VIEW                    View, Add, Modify   (open, add rows, edit his columns)
             449 EXPORT - SHEET VIEW CONVERT / LINK JOB View                (Convert to job, Link, Unlink)
           Form 450 (settings) stays with SA users.
  Safety : stops before changing anything unless the database is LinksDB20, user 82 is P100082, forms 448 and 449
           are Export forms, and user 82 has no rows yet for those forms on 30110 (if the exact rows are already
           there it says so and changes nothing). One transaction. ROLLBACK_ twin deletes exactly these two rows.
  Run as : any login that may insert into dbo.tbl_Mst_FormWiseRights. SQL Server 2008 R2.
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

DECLARE @have INT, @exact INT, @problem NVARCHAR(400);
SELECT @have  = COUNT(*),
       @exact = SUM(CASE WHEN fk_ModuleId = 3 AND FromDt = '20261028' AND ToDt = '20271231'
                          AND ((fk_FormId = 448 AND viewForm = 1 AND AddForm = 1 AND modifyForm = 1 AND DeleteForm = 0)
                            OR (fk_FormId = 449 AND viewForm = 1 AND AddForm = 0 AND modifyForm = 0 AND DeleteForm = 0))
                         THEN 1 ELSE 0 END)
  FROM dbo.tbl_Mst_FormWiseRights
 WHERE fk_cmpId = 82 AND fk_cmp_code = '30110' AND fk_FormId IN (448, 449);

IF NOT EXISTS (SELECT 1 FROM dbo.cmp_dtls WHERE cmpid = 82 AND LTRIM(RTRIM(cmp_usercode)) = 'P100082')
    SET @problem = 'User 82 is not P100082.';
ELSE IF (SELECT COUNT(*) FROM dbo.tbl_Mst_Form WHERE pk_FormId IN (448, 449) AND fk_ModuleId = 3) <> 2
    SET @problem = 'Forms 448 / 449 are missing or not in module 3 (Export).';
ELSE IF NOT EXISTS (SELECT 1 FROM dbo.cmp_address WHERE cmp_code = '30' AND RTRIM(cmp_ctycode) = '110')
    SET @problem = 'Company / branch 30110 not found.';
ELSE IF ISNULL(HAS_PERMS_BY_NAME('dbo.tbl_Mst_FormWiseRights', 'OBJECT', 'INSERT'), 0) = 0
    SET @problem = 'No INSERT permission on dbo.tbl_Mst_FormWiseRights.';
ELSE IF @have = 2 AND @exact = 2
BEGIN
    PRINT 'User 82 already has these two rights on 30110 - nothing to do, nothing was changed.';
    SET NOEXEC ON;
END
ELSE IF @have > 0
    SET @problem = 'User 82 already has ' + CONVERT(VARCHAR(12), @have) + ' other row(s) for forms 448 / 449 on 30110 - check them first.';

IF @problem IS NOT NULL
BEGIN
    PRINT '*** Check failed on ' + DB_NAME() + ' - NOTHING was changed: ' + @problem;
    RAISERROR('Check failed - see the message above.', 16, 1);
    SET NOEXEC ON;
END
ELSE
    PRINT 'Prerequisites OK on ' + DB_NAME() + '.';
GO

SET XACT_ABORT ON;
DECLARE @n INT, @err NVARCHAR(400);
BEGIN TRY
    BEGIN TRANSACTION;
    INSERT INTO dbo.tbl_Mst_FormWiseRights
           (fk_cmpId, fk_ModuleId, fk_cmp_code, fk_FormId, viewForm, AddForm, modifyForm, DeleteForm, CheckedBy, AuthorizedBy, FromDt, ToDt)
    SELECT 82, 3, '30110', 448, 1, 1, 1, 0, 0, 0, '20261028', '20271231'
    UNION ALL
    SELECT 82, 3, '30110', 449, 1, 0, 0, 0, 0, 0, '20261028', '20271231';
    SET @n = @@ROWCOUNT;
    IF @n <> 2 RAISERROR('Inserted %d rows instead of 2 - rolled back.', 16, 1, @n);
    COMMIT TRANSACTION;
    PRINT 'Done: P YOGESH (82) has Sheet view (448 View/Add/Modify) and Convert / Link (449 View) on 30110 until 31-Dec-2027.';
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    SET @err = ERROR_MESSAGE();
    PRINT '*** Grant failed and was rolled back - nothing was changed: ' + @err;
    RAISERROR('%s', 16, 1, @err);
END CATCH
GO

SET NOEXEC OFF;
GO

SELECT pk_UserFormWiseRights, fk_cmpId, fk_ModuleId, fk_cmp_code, fk_FormId, viewForm, AddForm, modifyForm, DeleteForm,
       CONVERT(VARCHAR(10), FromDt, 120) AS FromDt, CONVERT(VARCHAR(10), ToDt, 120) AS ToDt
  FROM dbo.tbl_Mst_FormWiseRights
 WHERE fk_cmpId = 82 AND fk_FormId IN (448, 449, 450)
 ORDER BY fk_FormId;
GO
