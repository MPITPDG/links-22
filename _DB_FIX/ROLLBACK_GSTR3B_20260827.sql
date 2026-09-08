USE [LinksDB]
GO
/**********************************************************************************************
 ROLLBACK : GSTR-3B Report port (GSTR3B_REPORT_PORT_20260827.sql)
 Drops the 4 procs + 4 filing tables and removes the form-rights registration.
 WARNING: dropping the filing tables loses any archived "Mark as Filed" snapshots.
**********************************************************************************************/
IF OBJECT_ID('dbo.USP_ACC_RPT_GSTR3B_BRANCHWISE') IS NOT NULL DROP PROCEDURE dbo.USP_ACC_RPT_GSTR3B_BRANCHWISE
IF OBJECT_ID('dbo.USP_ACC_GSTR3B_FILING_SAVE')    IS NOT NULL DROP PROCEDURE dbo.USP_ACC_GSTR3B_FILING_SAVE
IF OBJECT_ID('dbo.USP_ACC_GSTR3B_FILING_LIST')    IS NOT NULL DROP PROCEDURE dbo.USP_ACC_GSTR3B_FILING_LIST
IF OBJECT_ID('dbo.USP_ACC_GSTR3B_FILING_VIEW')    IS NOT NULL DROP PROCEDURE dbo.USP_ACC_GSTR3B_FILING_VIEW
GO
IF OBJECT_ID('dbo.TBL_ACCT_GSTR3B_FILING_SUMMARY') IS NOT NULL DROP TABLE dbo.TBL_ACCT_GSTR3B_FILING_SUMMARY
IF OBJECT_ID('dbo.TBL_ACCT_GSTR3B_FILING_STMT')    IS NOT NULL DROP TABLE dbo.TBL_ACCT_GSTR3B_FILING_STMT
IF OBJECT_ID('dbo.TBL_ACCT_GSTR3B_FILING_LEDGER')  IS NOT NULL DROP TABLE dbo.TBL_ACCT_GSTR3B_FILING_LEDGER
IF OBJECT_ID('dbo.TBL_ACCT_GSTR3B_FILING')         IS NOT NULL DROP TABLE dbo.TBL_ACCT_GSTR3B_FILING
GO
DELETE FROM dbo.tbl_Mst_FormWiseRights WHERE fk_FormId = 419
DELETE FROM dbo.tbl_mst_form WHERE pk_FormId = 419 AND FormName = 'gstr3b-report.component.html'
GO
