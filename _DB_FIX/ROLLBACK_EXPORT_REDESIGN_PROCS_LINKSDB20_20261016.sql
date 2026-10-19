/*===============================================================================================
  ROLLBACK_EXPORT_REDESIGN_PROCS_LINKSDB20_20261016.sql         (LinksDB20)

  Rollback for EXPORT_REDESIGN_PROCS_LINKSDB20_20261016.sql.
  None of its five procedures existed on LinksDB20 before that script (checked 2026-10-16), so the
  rollback is a drop; there is no older definition to restore. A procedure is dropped only when
  its text names that script (so that script created it); a same-named procedure from anywhere
  else is left alone and reported.

  After it, these Links API actions answer STATUS 101 (procedure not found) and the redesigned
  screens that call them stop working; nothing else is affected:
    GET  api/Export/EXPT_SHIPMENT_PROGRESS_GETBLDATA         dbo.USP_EXPT_SHIPMENT_PROGRESS_GETBLDATA
    POST api/Export/EXPT_SHIPMENTPROGRESS_BLDETAILS_UPDATE   dbo.USP_EXP_SHIPMENT_PROGRESS_BL_UPDATE
    GET  api/Export/EXP_RPT_MISSING_DOCS                     dbo.USP_EXP_RPT_MISSING_DOCS
    POST api/Export/ExportEditCo2Update                      dbo.USP_EXP_MST_EDIT_CO2_UPDATE
    POST api/Export/UpdateJob                                dbo.USP_EXP_MST_EXPORT_JOB_UPDATE
  Data already written through them (BL numbers / dates, CO2 values, job edits, EXPT_AIRBACK,
  USERTRACK and TBL_USERTRACK_EXPTMASTER rows) is NOT undone - it is ordinary business data.

  Safety : stops by itself on any database other than LinksDB20. Re-runnable.  SQL Server 2008 R2.
===============================================================================================*/
USE [LinksDB20]
GO
SET NOCOUNT ON;

-- never drop these names anywhere else (the Manilal database has live copies of them)
IF UPPER(DB_NAME()) <> 'LINKSDB20'
BEGIN
    PRINT '*** Connected to ' + DB_NAME() + ', not LinksDB20. Nothing done.';
    RETURN;
END

DECLARE @marker VARCHAR(100);
SET @marker = 'EXPORT_REDESIGN_PROCS_LINKSDB20_20261016';

IF OBJECT_ID('dbo.USP_EXPT_SHIPMENT_PROGRESS_GETBLDATA', 'P') IS NULL
    PRINT 'USP_EXPT_SHIPMENT_PROGRESS_GETBLDATA not present - nothing to do.';
ELSE IF CHARINDEX(@marker, ISNULL(OBJECT_DEFINITION(OBJECT_ID('dbo.USP_EXPT_SHIPMENT_PROGRESS_GETBLDATA')), '')) = 0
    PRINT '*** USP_EXPT_SHIPMENT_PROGRESS_GETBLDATA kept: it was not created by EXPORT_REDESIGN_PROCS_LINKSDB20_20261016.sql.';
ELSE
BEGIN
    DROP PROCEDURE dbo.USP_EXPT_SHIPMENT_PROGRESS_GETBLDATA;
    PRINT 'USP_EXPT_SHIPMENT_PROGRESS_GETBLDATA dropped from ' + DB_NAME() + '.';
END

IF OBJECT_ID('dbo.USP_EXP_SHIPMENT_PROGRESS_BL_UPDATE', 'P') IS NULL
    PRINT 'USP_EXP_SHIPMENT_PROGRESS_BL_UPDATE not present - nothing to do.';
ELSE IF CHARINDEX(@marker, ISNULL(OBJECT_DEFINITION(OBJECT_ID('dbo.USP_EXP_SHIPMENT_PROGRESS_BL_UPDATE')), '')) = 0
    PRINT '*** USP_EXP_SHIPMENT_PROGRESS_BL_UPDATE kept: it was not created by EXPORT_REDESIGN_PROCS_LINKSDB20_20261016.sql.';
ELSE
BEGIN
    DROP PROCEDURE dbo.USP_EXP_SHIPMENT_PROGRESS_BL_UPDATE;
    PRINT 'USP_EXP_SHIPMENT_PROGRESS_BL_UPDATE dropped from ' + DB_NAME() + '.';
END

IF OBJECT_ID('dbo.USP_EXP_RPT_MISSING_DOCS', 'P') IS NULL
    PRINT 'USP_EXP_RPT_MISSING_DOCS not present - nothing to do.';
ELSE IF CHARINDEX(@marker, ISNULL(OBJECT_DEFINITION(OBJECT_ID('dbo.USP_EXP_RPT_MISSING_DOCS')), '')) = 0
    PRINT '*** USP_EXP_RPT_MISSING_DOCS kept: it was not created by EXPORT_REDESIGN_PROCS_LINKSDB20_20261016.sql.';
ELSE
BEGIN
    DROP PROCEDURE dbo.USP_EXP_RPT_MISSING_DOCS;
    PRINT 'USP_EXP_RPT_MISSING_DOCS dropped from ' + DB_NAME() + '.';
END

IF OBJECT_ID('dbo.USP_EXP_MST_EDIT_CO2_UPDATE', 'P') IS NULL
    PRINT 'USP_EXP_MST_EDIT_CO2_UPDATE not present - nothing to do.';
ELSE IF CHARINDEX(@marker, ISNULL(OBJECT_DEFINITION(OBJECT_ID('dbo.USP_EXP_MST_EDIT_CO2_UPDATE')), '')) = 0
    PRINT '*** USP_EXP_MST_EDIT_CO2_UPDATE kept: it was not created by EXPORT_REDESIGN_PROCS_LINKSDB20_20261016.sql.';
ELSE
BEGIN
    DROP PROCEDURE dbo.USP_EXP_MST_EDIT_CO2_UPDATE;
    PRINT 'USP_EXP_MST_EDIT_CO2_UPDATE dropped from ' + DB_NAME() + '.';
END

IF OBJECT_ID('dbo.USP_EXP_MST_EXPORT_JOB_UPDATE', 'P') IS NULL
    PRINT 'USP_EXP_MST_EXPORT_JOB_UPDATE not present - nothing to do.';
ELSE IF CHARINDEX(@marker, ISNULL(OBJECT_DEFINITION(OBJECT_ID('dbo.USP_EXP_MST_EXPORT_JOB_UPDATE')), '')) = 0
    PRINT '*** USP_EXP_MST_EXPORT_JOB_UPDATE kept: it was not created by EXPORT_REDESIGN_PROCS_LINKSDB20_20261016.sql.';
ELSE
BEGIN
    DROP PROCEDURE dbo.USP_EXP_MST_EXPORT_JOB_UPDATE;
    PRINT 'USP_EXP_MST_EXPORT_JOB_UPDATE dropped from ' + DB_NAME() + '.';
END
GO
