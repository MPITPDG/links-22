/*===============================================================================================
  EXPORT_HOME_PERMISSION_20260926.sql

  Creates the tbl_mst_form row that gates the Export module home dashboard (#/export).

  export-home.component.ts calls verifyRights(<form id>) and renders only when viewForm comes
  back true (ROLETYPE 'SA' bypasses). A user without the right sees a blank Export home with
  the menu still working - no redirect, no message.

  Form ids (the Angular constant ExportHomeComponent.FORM_ID must carry the same number):
        manilal     449
        LinksDB20   443
  The id is picked from DB_NAME() below. If it is already taken by another form the script
  stops and prints the highest id in use - pick a free one, change it here AND in the
  component, and re-run.

  The row copies an existing Export form (Consignment, 214) so the module id and the flags
  come from a row known to work. RIGHTS = '1000' (view only).

  Re-runnable. Report-only until @Execute = 1.
  ROLLBACK: ROLLBACK_EXPORT_HOME_PERMISSION_20260926.sql
  SQL Server 2008 R2.
===============================================================================================*/
SET NOCOUNT ON;

DECLARE @Execute BIT = 1;          -- 0 = report only, 1 = apply
DECLARE @FormId  INT;

IF DB_NAME() = 'manilal'        SET @FormId = 449;
ELSE IF DB_NAME() = 'LinksDB20' SET @FormId = 443;
ELSE
BEGIN
    PRINT ' *** Connected to ' + DB_NAME() + '. Run this on manilal or LinksDB20. Nothing done.';
    RETURN;
END

/*  Sibling to copy: the Export Consignment form. Fallback: any form in the same module as
    another well-known Export form, newest first.                                       */
DECLARE @ModelFormId INT
SELECT @ModelFormId = pk_FormId FROM tbl_mst_form WHERE pk_FormId = 214;

PRINT '';
PRINT '=========================================================================';
PRINT ' 1  CURRENT STATE          Database: ' + DB_NAME() + '   target id: ' + CONVERT(VARCHAR(10), @FormId);
PRINT '=========================================================================';

SELECT  pk_FormId, fk_ModuleId, FormName, DisplayName, isReport, isFranceAct, SEQ, RIGHTS, ng_filename, FrmSrc
  FROM  tbl_mst_form
 WHERE  pk_FormId IN (@FormId, @ModelFormId)
 ORDER BY pk_FormId;

IF @ModelFormId IS NULL
BEGIN
    PRINT ' *** Form 214 (Export Consignment) not found to copy from.';
    PRINT ' *** Set @ModelFormId by hand to any Export form id and re-run.';
    RETURN;
END

PRINT '';
PRINT '=========================================================================';
PRINT ' 2  FORM ' + CONVERT(VARCHAR(10), @FormId);
PRINT '=========================================================================';

IF EXISTS (SELECT 1 FROM tbl_mst_form WHERE pk_FormId = @FormId
                                        AND UPPER(FormName) <> 'EXPORT-HOME DASHBOARD NG')
BEGIN
    PRINT ' *** Form ' + CONVERT(VARCHAR(10), @FormId) + ' already exists and is something else:';
    SELECT pk_FormId, fk_ModuleId, FormName, DisplayName FROM tbl_mst_form WHERE pk_FormId = @FormId;
    DECLARE @MaxId INT
    SELECT @MaxId = MAX(pk_FormId) FROM tbl_mst_form;
    PRINT ' *** Highest form id in use: ' + CONVERT(VARCHAR(10), @MaxId)
          + '. Pick a free id, set it here and in export-home.component.ts (FORM_ID), re-run.';
    RETURN;
END

IF EXISTS (SELECT 1 FROM tbl_mst_form WHERE pk_FormId = @FormId)
    PRINT ' 2  Form ' + CONVERT(VARCHAR(10), @FormId) + ' already exists as the Export home dashboard - nothing to do.';
ELSE IF @Execute = 0
BEGIN
    PRINT ' 2  Would create form ' + CONVERT(VARCHAR(10), @FormId) + ' by copying form '
          + CONVERT(VARCHAR(10), @ModelFormId) + ' and overriding:';
    PRINT '      FormName    = EXPORT-HOME DASHBOARD NG';
    PRINT '      DisplayName = EXPORT - HOME DASHBOARD';
    PRINT '      RIGHTS      = 1000   (view only)';
    PRINT '      isReport    = 0';
    PRINT '    Set @Execute = 1 to create it.';
END
ELSE
BEGIN
    DECLARE @isIdentity BIT
    SET @isIdentity = ISNULL((SELECT TOP 1 CONVERT(BIT, c.is_identity)
                                FROM sys.columns c
                               WHERE c.object_id = OBJECT_ID('dbo.tbl_mst_form')
                                 AND c.name = 'pk_FormId'), 0)

    BEGIN TRY
        IF @isIdentity = 1 SET IDENTITY_INSERT dbo.tbl_mst_form ON;

        INSERT INTO tbl_mst_form
              (pk_FormId, fk_ModuleId, FormName, DisplayName,
               isReport, isFranceAct, SEQ, RIGHTS, ng_filename, FrmSrc)
        SELECT  @FormId,
                fk_ModuleId,
                'EXPORT-HOME DASHBOARD NG',
                'EXPORT - HOME DASHBOARD',
                0,
                isFranceAct,
                SEQ,
                '1000',
                ng_filename,
                FrmSrc
          FROM  tbl_mst_form
         WHERE  pk_FormId = @ModelFormId;

        IF @isIdentity = 1 SET IDENTITY_INSERT dbo.tbl_mst_form OFF;

        PRINT ' 2  Form ' + CONVERT(VARCHAR(10), @FormId) + ' created (copied from '
              + CONVERT(VARCHAR(10), @ModelFormId) + ', RIGHTS 1000).';
    END TRY
    BEGIN CATCH
        IF @isIdentity = 1 SET IDENTITY_INSERT dbo.tbl_mst_form OFF;
        PRINT ' *** FAILED - nothing was created.';
        PRINT '     ' + ERROR_MESSAGE();
    END CATCH
END

PRINT '';
PRINT '=========================================================================';
PRINT ' 3  VERIFY';
PRINT '=========================================================================';

SELECT  pk_FormId, fk_ModuleId, FormName, DisplayName, isReport, SEQ, RIGHTS
  FROM  tbl_mst_form
 WHERE  pk_FormId = @FormId;

PRINT '';
PRINT ' NEXT: in the Form-wise Rights screen, grant View on "EXPORT - HOME DASHBOARD" to the users';
PRINT ' who should see the dashboard. Test with a user who is NOT an SA - SA skips every check.';
PRINT '';
