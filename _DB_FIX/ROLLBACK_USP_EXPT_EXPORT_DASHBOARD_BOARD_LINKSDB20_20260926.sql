/*  Rollback for USP_EXPT_EXPORT_DASHBOARD_BOARD_LINKSDB20_20260926.sql (LinksDB20 only).
    The proc did not exist on LinksDB20 before, so rollback is a drop. The Export home page then
    shows "Could not load the Export dashboard" until the proc is back.                       */
USE [LinksDB20]
GO
IF OBJECT_ID('dbo.USP_EXPT_EXPORT_DASHBOARD_BOARD','P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.USP_EXPT_EXPORT_DASHBOARD_BOARD;
    PRINT 'USP_EXPT_EXPORT_DASHBOARD_BOARD dropped from ' + DB_NAME() + '.';
END
ELSE
    PRINT 'USP_EXPT_EXPORT_DASHBOARD_BOARD not present - nothing to do.';
GO
