-- READ-ONLY review queries (nothing is changed). Database: LinksDB20.
-- Cause: general-invoice.component.ts / proforma-invoice.component.ts called DatePipe.transform(date, 'dd/mm/yyyy') in Editjob() and
-- resetjob(). In Angular's DatePipe "mm" is MINUTES, so the invoice date became dd/<minute-of-the-hour>/yyyy and was saved.
USE LinksDB20
GO

-- 1) Abandoned drafts: no invoice number and a date that is not a valid date (e.g. 17/48/2026). Safe for the registers after
--    REGISTER_EXPORT_PROC_FIXES_20261017.sql; the team decides whether to delete them.
SELECT id, inv_no, inv_date, MakerDT, cmpid, inv_client, inv_hawbno
FROM   acc_invoice
WHERE  ISDATE(SUBSTRING(inv_date, 4, 3) + SUBSTRING(inv_date, 1, 3) + SUBSTRING(inv_date, 7, 4)) = 0
ORDER  BY id DESC
GO

-- 2) Invoices that DO have a number but were saved with the minute as the month: the day and year equal the creation date,
--    the month differs from the creation month, and the month digits in INV_NO equal the (wrong) month of INV_DATE.
--    These need a manual correction of INV_DATE (and of the month part of the invoice number) by accounts.
SELECT id, inv_no, inv_date, CONVERT(VARCHAR(16), MakerDT, 120) AS created_on, cmpid, inv_client, totalamt
FROM   acc_invoice
WHERE  inv_no IS NOT NULL
  AND  ISDATE(SUBSTRING(inv_date, 4, 3) + SUBSTRING(inv_date, 1, 3) + SUBSTRING(inv_date, 7, 4)) = 1
  AND  MakerDT >= '2023-04-01'
  AND  SUBSTRING(inv_date, 1, 2) = RIGHT('0' + CAST(DAY(MakerDT) AS VARCHAR(2)), 2)
  AND  SUBSTRING(inv_date, 7, 4) = CAST(YEAR(MakerDT) AS VARCHAR(4))
  AND  CAST(SUBSTRING(inv_date, 4, 2) AS INT) <> MONTH(MakerDT)
  AND  SUBSTRING(inv_no, 8, 2) = SUBSTRING(inv_date, 4, 2)
ORDER  BY id DESC
GO
