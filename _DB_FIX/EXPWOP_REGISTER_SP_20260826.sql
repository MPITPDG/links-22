/*
  EXPWOP Register - Foreign currency invoice register with receipt details
  New report: Accounts -> Reports -> Register -> EXPWOP
  Lists invoices prepared in foreign currency (ACC_INVOICE.INV_CUR <> 'CR115')
  with receipt details from ACC_BANK / ACC_BANKDTLS (receipts = STATUS 'BR'/'CR').
  Receipt currency/rate derived from the invoice (bank tables store INR only).
  One row per invoice-receipt pair; invoices without receipts show blank receipt columns.
  Rollback: ROLLBACK_EXPWOP_REGISTER_SP_20260826.sql
*/
IF EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[USP_Acc_Rpt_EXPWOP_Register]') AND type = N'P')
    DROP PROCEDURE [dbo].[USP_Acc_Rpt_EXPWOP_Register]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
--USP_Acc_Rpt_EXPWOP_Register '01-Apr-2026','31-Mar-2027','01','MUM','01-Apr-2026','31-Mar-2027'
CREATE PROCEDURE [dbo].[USP_Acc_Rpt_EXPWOP_Register]
@FromDt varchar(30),
@ToDt varchar(30),
@cmpcode varchar(3),
@citycode varchar(3),
@FinStartDate varchar(30),
@FinEndDate varchar(30)
AS
BEGIN
    SET NOCOUNT ON

    SELECT  '''' + LTRIM(RTRIM(I.INV_NO))                                       AS [Inv. No],
            CONVERT(VARCHAR, DBO.CONVERTDATE_IN_US(I.INV_DATE, '/'), 106)       AS [Inv. Date],
            LTRIM(RTRIM(ISNULL(E.EXP_NAME, '')))                                AS [Party Name],
            LTRIM(RTRIM(ISNULL(C.CUR_NAME, '')))                                AS [Curr. In word],
            CASE WHEN X.CURRATE = 0 THEN NULL
                 ELSE CONVERT(DECIMAL(18, 2), ROUND(X.TOTALAMT / X.CURRATE, 2)) END AS [Curr.],
            X.CURRATE                                                           AS [Ex. Rate],
            X.TOTALAMT                                                          AS [Amt in INR],
            ISNULL('''' + LTRIM(RTRIM(R.ENTRYNO)), '')                          AS [Voucher No],
            ISNULL(CONVERT(VARCHAR, R.ENTRYDT, 103), '')                        AS [Recd. Date],
            ISNULL('''' + LTRIM(RTRIM(R.BILLNO)), '')                           AS [Bill No],
            ISNULL(LTRIM(RTRIM(R.CHEQUENO)), '')                                AS [Cheque/Ref No],
            ISNULL(CONVERT(VARCHAR, R.CHEQUEDT, 103), '')                       AS [Cheque Date],
            CASE WHEN R.STATUS = 'CR' THEN 'CASH RECEIPT'
                 ELSE ISNULL((SELECT LTRIM(RTRIM(ACCTNAME)) FROM GENACCT_MASTER WHERE ACCTCODE = R.OURBANK), '') END AS [Bank],
            ISNULL(LTRIM(RTRIM(R.NARRATION)), '')                               AS [Narration],
            CASE WHEN R.BILLNO IS NULL THEN ''
                 ELSE LTRIM(RTRIM(ISNULL(C.CUR_NAME, ''))) END                  AS [Recd. Curr. In word],
            CASE WHEN R.BILLNO IS NULL OR X.CURRATE = 0 THEN 0
                 ELSE CONVERT(DECIMAL(18, 2), ROUND(R.AMOUNT / X.CURRATE, 2)) END AS [Recd. Curr.],
            CASE WHEN R.BILLNO IS NULL THEN NULL ELSE X.CURRATE END             AS [Recd. Ex. Rate],
            ISNULL(R.AMOUNT, 0)                                                 AS [Recd. Amt in INR]
    FROM    ACC_INVOICE I
            CROSS APPLY (
                SELECT  CONVERT(MONEY, ISNULL(NULLIF(LTRIM(RTRIM(CONVERT(VARCHAR(30), I.TOTALAMT))), ''), '0'))      AS TOTALAMT,
                        CONVERT(DECIMAL(18, 6), ISNULL(NULLIF(LTRIM(RTRIM(CONVERT(VARCHAR(30), I.INV_CURRATE))), ''), '0')) AS CURRATE
            ) X
            LEFT OUTER JOIN EXP_MASTER E ON I.INV_CLIENT = E.EXP_CODE
            LEFT OUTER JOIN CUR_MASTER C ON I.INV_CUR = C.CUR_CODE
            LEFT OUTER JOIN (
                SELECT  BD.BILLNO,
                        CONVERT(MONEY, ISNULL(NULLIF(LTRIM(RTRIM(CONVERT(VARCHAR(30), BD.AMOUNT))), ''), '0')) AS AMOUNT,
                        B.ENTRYNO, B.ENTRYDT, B.CHEQUENO, B.CHEQUEDT, B.OURBANK, B.STATUS, B.NARRATION
                FROM    ACC_BANKDTLS BD
                        INNER JOIN ACC_BANK B ON B.ENTRYNO = BD.ENTRYNO
                WHERE   B.STATUS IN ('BR', 'CR')
                        AND B.CMPCODE = @cmpcode AND B.CITYCODE = @citycode
            ) R ON R.BILLNO = I.INV_NO
    WHERE   ISNULL(I.INV_CUR, '') <> '' AND I.INV_CUR <> 'CR115'
            AND CASE WHEN ISDATE(SUBSTRING(I.INV_DATE, 4, 3) + SUBSTRING(I.INV_DATE, 1, 3) + SUBSTRING(I.INV_DATE, 7, 4)) = 1
                     THEN CONVERT(DATETIME, SUBSTRING(I.INV_DATE, 4, 3) + SUBSTRING(I.INV_DATE, 1, 3) + SUBSTRING(I.INV_DATE, 7, 4)) END >= @FromDt
            AND CASE WHEN ISDATE(SUBSTRING(I.INV_DATE, 4, 3) + SUBSTRING(I.INV_DATE, 1, 3) + SUBSTRING(I.INV_DATE, 7, 4)) = 1
                     THEN CONVERT(DATETIME, SUBSTRING(I.INV_DATE, 4, 3) + SUBSTRING(I.INV_DATE, 1, 3) + SUBSTRING(I.INV_DATE, 7, 4)) END <= @ToDt
            AND DBO.CONVERTDATE_IN_US(I.INV_DATE, '/') BETWEEN @FinStartDate AND @FinEndDate
            AND I.CMPCODE = @cmpcode AND I.CITYCODE = @citycode
    ORDER BY DBO.CONVERTDATE_IN_US(I.INV_DATE, '/'), I.INV_NO, DBO.CONVERTDATE_YYYYMMDD(R.ENTRYDT)
END
GO
