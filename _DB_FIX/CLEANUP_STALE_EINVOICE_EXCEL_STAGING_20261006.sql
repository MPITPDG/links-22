-- Links (LinksDB20): remove stale rows left in ACC_INVOICE_EINVOICE_EXCEL by an aborted upload (user 11 ROHITS, GUID below).
-- These are 3 INV rows for 2023 invoices 301102302100056 / 059 / 060 that got re-applied to ACC_INVOICE_EINV_GSTIRN by upload 4896.
-- Their IRN data in ACC_INVOICE_EINV_GSTIRN is correct (unchanged), so no data restore is needed. Run AFTER (or before) the SP fix.
-- No rollback needed: staging data is transient (upload SP deletes it after every upload).
USE LinksDB20
GO
SELECT USERID, VGUID, TRANSTYPE, COUNT(1) AS N FROM ACC_INVOICE_EINVOICE_EXCEL GROUP BY USERID, VGUID, TRANSTYPE   -- preview
GO
BEGIN TRAN
	DELETE FROM ACC_INVOICE_EINVOICE_EXCEL
	WHERE USERID = 11 AND VGUID = '219ef286-1fb7-4e56-978f-946d52fa6237' AND TRANSTYPE = 'INV'
	  AND INV_NO IN ('301102302100056', '301102302100059', '301102302100060')

	IF @@ROWCOUNT <> 3
	BEGIN
		ROLLBACK TRAN
		RAISERROR('Expected 3 stale rows - nothing deleted, check staging table', 16, 1)
	END
	ELSE COMMIT TRAN
GO
SELECT COUNT(1) AS STAGING_LEFT FROM ACC_INVOICE_EINVOICE_EXCEL   -- expect 0 when no upload is in progress
GO
