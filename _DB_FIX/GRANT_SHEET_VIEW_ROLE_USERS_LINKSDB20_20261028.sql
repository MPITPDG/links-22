/*===============================================================================================
  GRANT_SHEET_VIEW_ROLE_USERS_LINKSDB20_20261028.sql                      (LinksDB20)

  Why    : the users who hold Sheet view column roles (Sheet view > Column Access) still get "no view right on
           EXPORT - SHEET VIEW": nobody but P YOGESH (GRANT_SHEET_VIEW_YOGESH_LINKSDB20_20261028.sql) has rights on
           the Sheet view forms, and the new Links has no rights screen yet. Requested 2026-10-28.
  What   : the same two rights P YOGESH has, for 7 users, on company 30 / Mumbai (30110), 28-Oct-2026 to 31-Dec-2027:
             448 EXPORT - SHEET VIEW                    View, Add, Modify   (open, add rows, edit their columns)
             449 EXPORT - SHEET VIEW CONVERT / LINK JOB View                (Convert to job, Link, Unlink)
           Users (cmpid / login): 19 LUISED, 22 YUGA, 45 LRAJESH, 71 YJaywant, 79 PEKTA, 80 PSAGAR, 81 JYASH.
           Form 450 (settings) stays with SA users. 14 rows.
  Safety : stops before changing anything unless the database is LinksDB20, every cmpid has the expected login,
           forms 448 and 449 are Export forms, and none of the 7 users has rows yet for those forms on 30110 (if all
           14 exact rows are already there it says so and changes nothing). One transaction; it checks 14 rows went
           in. ROLLBACK_ twin deletes exactly these rows.
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

DECLARE @U TABLE (CMPID INT PRIMARY KEY, LOGIN VARCHAR(30) NOT NULL);
INSERT INTO @U (CMPID, LOGIN) VALUES (19, 'LUISED');
INSERT INTO @U (CMPID, LOGIN) VALUES (22, 'YUGA');
INSERT INTO @U (CMPID, LOGIN) VALUES (45, 'LRAJESH');
INSERT INTO @U (CMPID, LOGIN) VALUES (71, 'YJaywant');
INSERT INTO @U (CMPID, LOGIN) VALUES (79, 'PEKTA');
INSERT INTO @U (CMPID, LOGIN) VALUES (80, 'PSAGAR');
INSERT INTO @U (CMPID, LOGIN) VALUES (81, 'JYASH');

DECLARE @have INT, @exact INT, @problem NVARCHAR(400);
SELECT @have  = COUNT(*),
       @exact = SUM(CASE WHEN W.fk_ModuleId = 3 AND W.FromDt = '20261028' AND W.ToDt = '20271231'
                          AND ((W.fk_FormId = 448 AND W.viewForm = 1 AND W.AddForm = 1 AND W.modifyForm = 1 AND W.DeleteForm = 0)
                            OR (W.fk_FormId = 449 AND W.viewForm = 1 AND W.AddForm = 0 AND W.modifyForm = 0 AND W.DeleteForm = 0))
                         THEN 1 ELSE 0 END)
  FROM dbo.tbl_Mst_FormWiseRights W
  JOIN @U U ON U.CMPID = W.fk_cmpId
 WHERE W.fk_cmp_code = '30110' AND W.fk_FormId IN (448, 449);

SELECT TOP 1 @problem = 'User ' + CONVERT(VARCHAR(12), U.CMPID) + ' is not ' + U.LOGIN + '.'
  FROM @U U
 WHERE NOT EXISTS (SELECT 1 FROM dbo.cmp_dtls D WHERE D.cmpid = U.CMPID AND LTRIM(RTRIM(D.cmp_username)) = U.LOGIN);

IF @problem IS NULL AND (SELECT COUNT(*) FROM dbo.tbl_Mst_Form WHERE pk_FormId IN (448, 449) AND fk_ModuleId = 3) <> 2
    SET @problem = 'Forms 448 / 449 are missing or not in module 3 (Export).';
IF @problem IS NULL AND NOT EXISTS (SELECT 1 FROM dbo.cmp_address WHERE cmp_code = '30' AND RTRIM(cmp_ctycode) = '110')
    SET @problem = 'Company / branch 30110 not found.';
IF @problem IS NULL AND ISNULL(HAS_PERMS_BY_NAME('dbo.tbl_Mst_FormWiseRights', 'OBJECT', 'INSERT'), 0) = 0
    SET @problem = 'No INSERT permission on dbo.tbl_Mst_FormWiseRights.';

IF @problem IS NULL AND @have = 14 AND @exact = 14
BEGIN
    PRINT 'All 7 users already have these two rights on 30110 - nothing to do, nothing was changed.';
    SET NOEXEC ON;
END
ELSE
BEGIN
    IF @problem IS NULL AND @have > 0
        SET @problem = CONVERT(VARCHAR(12), @have) + ' row(s) for forms 448 / 449 on 30110 already exist for these users - check them first.';
    IF @problem IS NOT NULL
    BEGIN
        PRINT '*** Check failed on ' + DB_NAME() + ' - NOTHING was changed: ' + @problem;
        RAISERROR('Check failed - see the message above.', 16, 1);
        SET NOEXEC ON;
    END
    ELSE
        PRINT 'Prerequisites OK on ' + DB_NAME() + '.';
END
GO

SET XACT_ABORT ON;
DECLARE @n INT, @err NVARCHAR(400);
BEGIN TRY
    BEGIN TRANSACTION;
    INSERT INTO dbo.tbl_Mst_FormWiseRights
           (fk_cmpId, fk_ModuleId, fk_cmp_code, fk_FormId, viewForm, AddForm, modifyForm, DeleteForm, CheckedBy, AuthorizedBy, FromDt, ToDt)
    SELECT U.CMPID, 3, '30110', F.FORMID, F.V, F.A, F.M, 0, 0, 0, '20261028', '20271231'
      FROM (SELECT 19 AS CMPID UNION ALL SELECT 22 UNION ALL SELECT 45 UNION ALL SELECT 71
            UNION ALL SELECT 79 UNION ALL SELECT 80 UNION ALL SELECT 81) U
     CROSS JOIN (SELECT 448 AS FORMID, 1 AS V, 1 AS A, 1 AS M UNION ALL SELECT 449, 1, 0, 0) F;
    SET @n = @@ROWCOUNT;
    IF @n <> 14 RAISERROR('Inserted %d rows instead of 14 - rolled back.', 16, 1, @n);
    COMMIT TRANSACTION;
    PRINT 'Done: 7 users have Sheet view (448 View/Add/Modify) and Convert / Link (449 View) on 30110 until 31-Dec-2027.';
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

SELECT W.fk_cmpId, RTRIM(D.cmp_username) AS login, W.fk_FormId, W.viewForm, W.AddForm, W.modifyForm,
       CONVERT(VARCHAR(10), W.FromDt, 120) AS FromDt, CONVERT(VARCHAR(10), W.ToDt, 120) AS ToDt
  FROM dbo.tbl_Mst_FormWiseRights W
  JOIN dbo.cmp_dtls D ON D.cmpid = W.fk_cmpId
 WHERE W.fk_cmp_code = '30110' AND W.fk_FormId IN (448, 449, 450)
 ORDER BY W.fk_cmpId, W.fk_FormId;
GO
