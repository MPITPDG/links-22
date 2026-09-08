/* Rollback for EXPWOP_REGISTER_SP_20260826.sql - removes the EXPWOP register SP */
IF EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[USP_Acc_Rpt_EXPWOP_Register]') AND type = N'P')
    DROP PROCEDURE [dbo].[USP_Acc_Rpt_EXPWOP_Register]
GO
