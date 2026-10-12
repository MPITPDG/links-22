/*  Rollback for EXPORT_HOME_PERMISSION_20260926.sql.
    Removes the Export home dashboard form and any rights granted on it. Only deletes the row
    if it is the one that script created (matched by FormName).  SQL Server 2008 R2.        */
SET NOCOUNT ON;

DECLARE @FormId INT;
IF DB_NAME() = 'manilal'        SET @FormId = 449;
ELSE IF DB_NAME() = 'LinksDB20' SET @FormId = 443;
ELSE
BEGIN
    PRINT ' *** Connected to ' + DB_NAME() + '. Run this on manilal or LinksDB20. Nothing done.';
    RETURN;
END

IF NOT EXISTS (SELECT 1 FROM tbl_mst_form WHERE pk_FormId = @FormId AND FormName = 'EXPORT-HOME DASHBOARD NG')
BEGIN
    PRINT ' Form ' + CONVERT(VARCHAR(10), @FormId) + ' is not the Export home dashboard (or is absent). Nothing done.';
    RETURN;
END

DELETE FROM tbl_Mst_FormWiseRights WHERE fk_FormId = @FormId;
DELETE FROM tbl_mst_form           WHERE pk_FormId = @FormId;
PRINT ' Form ' + CONVERT(VARCHAR(10), @FormId) + ' and its rights removed.';
