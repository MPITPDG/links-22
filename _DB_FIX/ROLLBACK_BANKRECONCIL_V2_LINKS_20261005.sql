-- Rollback for BANKRECONCIL_V2_LINKS_20261005.sql
-- Removes the V2 proc only. The original USP_ACC_BANKRECONCIL_UPDATECLEARANCEDT was never changed.
-- After this, the client falls back by pointing the upload page at Accounts/UploadBnkReconcilFile.
USE [LinksDB20_20260930]
GO
IF OBJECT_ID('dbo.USP_ACC_BANKRECONCIL_UPDATECLEARANCEDT_V2', 'P') IS NOT NULL
    DROP PROCEDURE dbo.USP_ACC_BANKRECONCIL_UPDATECLEARANCEDT_V2;
GO
