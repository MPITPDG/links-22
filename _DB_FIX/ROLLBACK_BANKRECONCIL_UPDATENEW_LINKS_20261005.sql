-- Rollback for BANKRECONCIL_UPDATENEW_LINKS_20261005.sql
-- The proc did not exist in the Links database before this change, so rollback = drop it.
USE [LinksDB20_20260930]
GO
IF OBJECT_ID('dbo.USP_Acc_CashBook_BankRecousillation_UpdateNew', 'P') IS NOT NULL
    DROP PROCEDURE dbo.USP_Acc_CashBook_BankRecousillation_UpdateNew;
GO
