/*===============================================================================================
  GRANT_SHEET_ADMIN_YASH_YOGESH_RAJESH_LINKSDB20_20261030.sql            (LinksDB20)

  Why    : JYASH, PYOGESH and LRAJESH should run Export > Sheet view as admins: edit every column (today they can
           edit only the columns of their roles OPS / BOOKING) and change the settings (Colour CODE, Column Access,
           aliases), which so far only SA users can. Requested 2026-10-30.
  What   : for 81 JYASH (P100081), 82 PYOGESH (P100082), 45 LRAJESH (P100045):
             1. form 450 EXPORT - SHEET VIEW SETTINGS: View, Add, Modify on company 30 / Mumbai (30110),
                30-Oct-2026 to 31-Dec-2027 (3 rows). Their 448 / 449 rights from 28-Oct stay as they are.
             2. Sheet role ADMIN (dbo.TBL_EXPT_SHEET_ROLE_USER): ADMIN edits every column - the database's column
                lock lets ADMIN through (3 rows). Their OPS / BOOKING roles stay. Logged in TBL_EXPT_SHEET_LOG like a
                Column Access save, so it shows in the Sheet view settings history.
  Safety : stops before changing anything unless the database is LinksDB20, every cmpid has the expected login and
           user code, form 450 is the Export settings form, role ADMIN exists, and none of the 3 users has a 450 row
           on 30110 or the ADMIN role yet (if all 6 rows are already there it says so and changes nothing). One
           transaction; it checks 3 + 3 rows went in. ROLLBACK_ twin removes exactly these rows.
  Run as : any login that may insert into dbo.tbl_Mst_FormWiseRights, dbo.TBL_EXPT_SHEET_ROLE_USER and
           dbo.TBL_EXPT_SHEET_LOG. SQL Server 2008 R2.
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

DECLARE @U TABLE (CMPID INT PRIMARY KEY, LOGIN VARCHAR(30) NOT NULL, CODE VARCHAR(20) NOT NULL);
INSERT INTO @U (CMPID, LOGIN, CODE) VALUES (81, 'JYASH', 'P100081');
INSERT INTO @U (CMPID, LOGIN, CODE) VALUES (82, 'PYOGESH', 'P100082');
INSERT INTO @U (CMPID, LOGIN, CODE) VALUES (45, 'LRAJESH', 'P100045');

DECLARE @r450 INT, @x450 INT, @radm INT, @problem NVARCHAR(400);
SELECT @r450 = COUNT(*),
       @x450 = SUM(CASE WHEN W.fk_ModuleId = 3 AND W.FromDt = '20261030' AND W.ToDt = '20271231'
                         AND W.viewForm = 1 AND W.AddForm = 1 AND W.modifyForm = 1 AND W.DeleteForm = 0 THEN 1 ELSE 0 END)
  FROM dbo.tbl_Mst_FormWiseRights W
  JOIN @U U ON U.CMPID = W.fk_cmpId
 WHERE W.fk_cmp_code = '30110' AND W.fk_FormId = 450;
SELECT @radm = COUNT(*)
  FROM dbo.TBL_EXPT_SHEET_ROLE_USER R
  JOIN @U U ON U.CODE = R.USER_ID
 WHERE R.ROLE_CODE = 'ADMIN';

SELECT TOP 1 @problem = 'User ' + CONVERT(VARCHAR(12), U.CMPID) + ' is not ' + U.LOGIN + ' / ' + U.CODE + '.'
  FROM @U U
 WHERE NOT EXISTS (SELECT 1 FROM dbo.cmp_dtls D WHERE D.cmpid = U.CMPID AND LTRIM(RTRIM(D.cmp_username)) = U.LOGIN
                                                   AND LTRIM(RTRIM(D.cmp_usercode)) = U.CODE);

IF @problem IS NULL AND NOT EXISTS (SELECT 1 FROM dbo.tbl_Mst_Form WHERE pk_FormId = 450 AND fk_ModuleId = 3)
    SET @problem = 'Form 450 is missing or not in module 3 (Export).';
IF @problem IS NULL AND NOT EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_ROLE WHERE CODE = 'ADMIN')
    SET @problem = 'Sheet role ADMIN not found.';
IF @problem IS NULL AND NOT EXISTS (SELECT 1 FROM dbo.cmp_address WHERE cmp_code = '30' AND RTRIM(cmp_ctycode) = '110')
    SET @problem = 'Company / branch 30110 not found.';
IF @problem IS NULL AND ISNULL(HAS_PERMS_BY_NAME('dbo.tbl_Mst_FormWiseRights', 'OBJECT', 'INSERT'), 0) = 0
    SET @problem = 'No INSERT permission on dbo.tbl_Mst_FormWiseRights.';
IF @problem IS NULL AND ISNULL(HAS_PERMS_BY_NAME('dbo.TBL_EXPT_SHEET_ROLE_USER', 'OBJECT', 'INSERT'), 0) = 0
    SET @problem = 'No INSERT permission on dbo.TBL_EXPT_SHEET_ROLE_USER.';
IF @problem IS NULL AND ISNULL(HAS_PERMS_BY_NAME('dbo.TBL_EXPT_SHEET_LOG', 'OBJECT', 'INSERT'), 0) = 0
    SET @problem = 'No INSERT permission on dbo.TBL_EXPT_SHEET_LOG.';

IF @problem IS NULL AND @r450 = 3 AND @x450 = 3 AND @radm = 3
BEGIN
    PRINT 'All 3 users already have form 450 on 30110 and the ADMIN sheet role - nothing to do, nothing was changed.';
    SET NOEXEC ON;
END
ELSE
BEGIN
    IF @problem IS NULL AND @r450 > 0
        SET @problem = CONVERT(VARCHAR(12), @r450) + ' form 450 row(s) on 30110 already exist for these users - check them first.';
    IF @problem IS NULL AND @radm > 0
        SET @problem = CONVERT(VARCHAR(12), @radm) + ' of these users already hold the ADMIN sheet role - check them first.';
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
DECLARE @n INT, @m INT, @now DATETIME, @old NVARCHAR(2000), @new NVARCHAR(2000), @err NVARCHAR(400);
SET @now = GETDATE();
BEGIN TRY
    BEGIN TRANSACTION;

    INSERT INTO dbo.tbl_Mst_FormWiseRights
           (fk_cmpId, fk_ModuleId, fk_cmp_code, fk_FormId, viewForm, AddForm, modifyForm, DeleteForm, CheckedBy, AuthorizedBy, FromDt, ToDt)
    SELECT U.CMPID, 3, '30110', 450, 1, 1, 1, 0, 0, 0, '20261030', '20271231'
      FROM (SELECT 81 AS CMPID UNION ALL SELECT 82 UNION ALL SELECT 45) U;
    SET @n = @@ROWCOUNT;
    IF @n <> 3 RAISERROR('Inserted %d form 450 rows instead of 3 - rolled back.', 16, 1, @n);

    SET @old = ISNULL(STUFF((SELECT N',' + USER_ID FROM dbo.TBL_EXPT_SHEET_ROLE_USER WITH (UPDLOCK, HOLDLOCK)
                              WHERE ROLE_CODE = 'ADMIN' ORDER BY USER_ID FOR XML PATH(''), TYPE).value('.', 'NVARCHAR(MAX)'), 1, 1, N''), N'');
    INSERT INTO dbo.TBL_EXPT_SHEET_ROLE_USER (ROLE_CODE, USER_ID, MAKER_ID, MAKER_DT)
    SELECT 'ADMIN', C.CODE, 'DBFIX', @now
      FROM (SELECT 'P100045' AS CODE UNION ALL SELECT 'P100081' UNION ALL SELECT 'P100082') C;
    SET @m = @@ROWCOUNT;
    IF @m <> 3 RAISERROR('Inserted %d ADMIN role rows instead of 3 - rolled back.', 16, 1, @m);
    SET @new = ISNULL(STUFF((SELECT N',' + USER_ID FROM dbo.TBL_EXPT_SHEET_ROLE_USER
                              WHERE ROLE_CODE = 'ADMIN' ORDER BY USER_ID FOR XML PATH(''), TYPE).value('.', 'NVARCHAR(MAX)'), 1, 1, N''), N'');

    -- same history row a Column Access save writes (USP_EXPT_SHEET_ROLES_IU)
    INSERT INTO dbo.TBL_EXPT_SHEET_LOG (ROW_KIND, ROW_ID, COL_KEY, OLD_VALUE, NEW_VALUE, ACTION, USER_ID, USER_NAME, LOG_DT)
    VALUES ('M', 0, 'ROLE.ADMIN.USERS', LEFT(@old, 2000), LEFT(@new, 2000), 'edit', 'DBFIX',
            N'GRANT_SHEET_ADMIN_YASH_YOGESH_RAJESH script', @now);

    COMMIT TRANSACTION;
    PRINT 'Done: JYASH, PYOGESH and LRAJESH have Sheet view settings (450 View/Add/Modify) on 30110 until 31-Dec-2027 and the ADMIN sheet role (every column).';
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
 WHERE W.fk_cmp_code = '30110' AND W.fk_FormId IN (448, 449, 450) AND W.fk_cmpId IN (45, 81, 82)
 ORDER BY W.fk_cmpId, W.fk_FormId;
SELECT ROLE_CODE, USER_ID, MAKER_ID, CONVERT(VARCHAR(19), MAKER_DT, 120) AS MAKER_DT
  FROM dbo.TBL_EXPT_SHEET_ROLE_USER
 WHERE USER_ID IN ('P100045', 'P100081', 'P100082')
 ORDER BY USER_ID, ROLE_CODE;
GO
