-- Apply
-- NEW proc USP_Acc_CashBook_BankRecousillation_UpdateNew for Links (port of the Manilal version incl. the
-- 29-07-2026 "stale stamp" fix). Used by the Upload Statement Search page (Mismatched Data submit + manual
-- UnReconcil <-> Our Bank Ledger link) through API  Accounts/Acc_CashBook_BankRecousillation_UpdateNew.
--
-- Input @str : "EntryNo|BankRefNo|ClearanceDt(dd-mmm-yyyy)|AccBankId|BankAmt|ErpAmt;" repeated.
-- Differences from the Manilal script:
--   * does not need dbo.SplitString (Links DB has none) - the string is parsed with CHARINDEX/SUBSTRING.
--   * Manilal's one-off data repair (PK_ID 9500) is NOT included - it is Manilal data.
-- Result sets: 1 = '100' STATUS row, then everything USP_ACC_BANKRECONCIL_GETUPLOADDATA returns
-- (header, reconciled, unreconciled, statement-only, ledger, mismatch).
USE [LinksDB20_20260930]
GO

IF OBJECT_ID('dbo.USP_Acc_CashBook_BankRecousillation_UpdateNew', 'P') IS NULL
    EXEC('CREATE PROC [dbo].[USP_Acc_CashBook_BankRecousillation_UpdateNew] AS RETURN');
GO

ALTER PROC [dbo].[USP_Acc_CashBook_BankRecousillation_UpdateNew]
@str     VARCHAR(2000),
@OURBANK VARCHAR(7),
@FROMDT  VARCHAR(20),
@TODT    VARCHAR(20)
AS
SET NOCOUNT ON;

IF OBJECT_ID('TEMPDB..#TempTable') IS NOT NULL
    DROP TABLE #TempTable

CREATE TABLE #TempTable (
    ID            INT IDENTITY(1,1),
    entryno       VARCHAR(15),
    bankrefno     NVARCHAR(50),
    ClearanceDate VARCHAR(12),
    accbankid     INT,
    BankAmt       DECIMAL(18,3),
    ErpAmt        DECIMAL(18,3)
)

DECLARE @Row VARCHAR(500), @Pos INT = 0, @NextPos INT
DECLARE @p1 INT, @p2 INT, @p3 INT, @p4 INT, @p5 INT

-- one record per ';' , six fields per record separated by '|'
WHILE CHARINDEX(';', @str, @Pos + 1) > 0
BEGIN
    SET @NextPos = CHARINDEX(';', @str, @Pos + 1)
    SET @Row = SUBSTRING(@str, @Pos + 1, @NextPos - @Pos - 1)

    SET @p1 = CHARINDEX('|', @Row)
    SET @p2 = CASE WHEN @p1 > 0 THEN CHARINDEX('|', @Row, @p1 + 1) ELSE 0 END
    SET @p3 = CASE WHEN @p2 > 0 THEN CHARINDEX('|', @Row, @p2 + 1) ELSE 0 END
    SET @p4 = CASE WHEN @p3 > 0 THEN CHARINDEX('|', @Row, @p3 + 1) ELSE 0 END
    SET @p5 = CASE WHEN @p4 > 0 THEN CHARINDEX('|', @Row, @p4 + 1) ELSE 0 END

    IF @p5 > 0
        INSERT INTO #TempTable (entryno, bankrefno, ClearanceDate, accbankid, BankAmt, ErpAmt)
        VALUES (
            LTRIM(RTRIM(SUBSTRING(@Row, 1,       @p1 - 1))),
            LTRIM(RTRIM(SUBSTRING(@Row, @p1 + 1, @p2 - @p1 - 1))),
            LTRIM(RTRIM(SUBSTRING(@Row, @p2 + 1, @p3 - @p2 - 1))),
            CAST(LTRIM(RTRIM(SUBSTRING(@Row, @p3 + 1, @p4 - @p3 - 1))) AS INT),
            CAST(LTRIM(RTRIM(SUBSTRING(@Row, @p4 + 1, @p5 - @p4 - 1))) AS DECIMAL(18,3)),
            CAST(LTRIM(RTRIM(SUBSTRING(@Row, @p5 + 1, 50))) AS DECIMAL(18,3))
        )

    SET @Pos = @NextPos
END

-- (1) Ledger: stamp clearance date + submitted bank ref on the exact row the user picked.
--     Keyed on ENTRYNO + ID (ACC_BANK primary key).
UPDATE A SET A.CLEARANCEDATE = B.CLEARANCEDATE, A.BANKREFNO = B.bankrefno
FROM ACC_BANK A
INNER JOIN (SELECT ENTRYNO, CLEARANCEDATE = CONVERT(DATETIME, ClearanceDate, 103), accbankid, bankrefno FROM #TempTable) B
        ON A.ENTRYNO = B.ENTRYNO AND A.ID = B.accbankid

-- (2) Un-stamp stale statement rows: a row still carrying one of the submitted entry nos under a
--     DIFFERENT bank ref is a leftover of an earlier (since corrected) mapping. Only cleared when
--     its ref no longer matches ANY ACC_BANK line of that entry.
UPDATE S SET S.ENTRYNO = NULL, S.ENTRYDT = NULL, S.ENTRYTYPE = NULL, S.USERBANKREFNO = NULL,
             S.LAMOUNT = NULL, S.LDEDUCTION = NULL, S.LCLEARNCEDT = NULL
FROM ACC_BANKRECONCIL_UPLOADSTATEMENT S
INNER JOIN #TempTable T ON S.ENTRYNO = T.entryno AND S.BANKREFNO <> T.bankrefno
WHERE S.OURBANK = @OURBANK
  AND NOT EXISTS (SELECT 1 FROM ACC_BANK A
                  WHERE A.ENTRYNO = S.ENTRYNO AND A.BANKREFNO = S.BANKREFNO AND A.OURBANK = S.OURBANK)

-- (3) Stamp the statement row the user actually linked, addressed directly by the submitted bank ref no,
--     and fill LAMOUNT / LDEDUCTION / LCLEARNCEDT so the Reconcil tab shows them.
UPDATE S SET S.ENTRYNO       = A.ENTRYNO,
             S.ENTRYDT       = A.ENTRYDT,
             S.ENTRYTYPE     = A.[STATUS],
             S.USERBANKREFNO = T.bankrefno,
             S.LAMOUNT       = A.ACTUALAMOUNT,
             S.LDEDUCTION    = 0,
             S.LCLEARNCEDT   = CONVERT(VARCHAR(10), CONVERT(DATETIME, T.ClearanceDate, 103), 103)
FROM ACC_BANKRECONCIL_UPLOADSTATEMENT S
INNER JOIN #TempTable T ON S.BANKREFNO = T.bankrefno AND S.OURBANK = @OURBANK
INNER JOIN ACC_BANK A ON A.ENTRYNO = T.entryno AND A.ID = T.accbankid

SELECT '100' STATUS, STATUSTXT = 'BANKREFNO UPDATED SUCCESSFULLY'
EXEC USP_ACC_BANKRECONCIL_GETUPLOADDATA @OURBANK, @FROMDT, @TODT
GO
