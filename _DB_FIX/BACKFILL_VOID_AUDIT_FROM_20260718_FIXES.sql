USE [LinksDB20]
GO

/*
	Purpose : One-time backfill for the 74 ACC_BANK entries already hand-fixed on 2026-07-18
			  (40 via FIX_ACC_BANK_ZERO_AMOUNT_20260718.sql, 34 via ..._BATCH2.sql), BEFORE the
			  Void feature existed. Populates the new VOIDREASON/VOIDEDBY/VOIDEDON columns and
			  a FULL pre-fix snapshot in the two audit-history tables, so these 74 rows are
			  visible to the same "is this voided" queries/reports as entries voided going
			  forward via USP_ACC_BANK_VOID_NG.

	Only ACTUALAMOUNT (both batches) and NARRATION (batch 2 only) were ever touched by the
	original fix scripts - every other column on these rows is untouched, so "current live
	value" IS the pre-fix value for everything except those two. The snapshot below pulls
	ACTUALAMOUNT/NARRATION from the dated BACKUP_* tables (pre-fix values) and every other
	column live from ACC_BANK/ACC_BANKDTLS.

	Run ADD_ACC_BANK_VOID_COLUMNS_AND_AUDIT_TABLES.sql first. Safe to re-run: every INSERT/UPDATE
	below is guarded to skip rows that already have VOIDEDON populated.

	Marker: VOIDEDBY = 'DBFIX' distinguishes these pre-feature manual fixes from genuine in-app
	Void actions (which stamp the real accountant USERNAME) - do not treat 'DBFIX' as a real login.
*/

DECLARE @Reason1 NVARCHAR(500) = 'Accountant audit finding: entry recorded in ERP as a completed bank payment but not effected at the bank (identified during bank reconciliation, 18/07/2026). Fixed via manual DB script prior to the in-app Void feature.'
DECLARE @Reason2 NVARCHAR(500) = 'Accountant audit finding: entry recorded in ERP as a completed bank payment but not effected at the bank (confirmed via reconciliation, 18/07/2026; wrong-bank/duplicate-payment pattern identified on related entries). Fixed via manual DB script prior to the in-app Void feature.'

-- === Batch 1 (40 entries) - BACKUP_ACC_BANK_ZERO_20260718 only captured ACTUALAMOUNT;
--     NARRATION on these rows was never touched by the original fix, so pull it (and every
--     other untouched column) live from ACC_BANK. ===
UPDATE b
SET		b.VOIDREASON = @Reason1,
		b.VOIDEDBY = 'DBFIX',
		b.VOIDEDON = bak.BACKED_UP_ON
FROM	ACC_BANK b
JOIN	dbo.BACKUP_ACC_BANK_ZERO_20260718 bak ON bak.ID = b.ID
WHERE	b.VOIDEDON IS NULL

INSERT INTO dbo.ACC_BANK_VOID_AUDIT
(
	ACC_BANK_ID, ENTRYNO, ENTRYDT, [STATUS], BANK, CHEQUETYPE, CHEQUENO, CHEQUEDT, OURBANK,
	NARRATION1, NARRATION2, CITYCODE, CMPCODE, ENTMM, ENTYR, ENTDD, ENTNO, EXPENSE, USERNAME,
	CMPID, ACTUALAMOUNT, NARRATION, ADVAMT, AMTWITHOUTADV, CLEARANCEDATE, COMPUTERISEDCHEQUE,
	PAYEENAME, NOTOVERFLAG, BANKREFNO,
	VOIDEDBY, VOIDEDON, VOIDREASON
)
SELECT
	bak.ID, bak.ENTRYNO, b.ENTRYDT, b.[STATUS], b.BANK, b.CHEQUETYPE, b.CHEQUENO, b.CHEQUEDT, b.OURBANK,
	b.NARRATION1, b.NARRATION2, b.CITYCODE, b.CMPCODE, b.ENTMM, b.ENTYR, b.ENTDD, b.ENTNO, b.EXPENSE, b.USERNAME,
	b.CMPID, bak.ACTUALAMOUNT, b.NARRATION, b.ADVAMT, b.AMTWITHOUTADV, b.clearanceDate, b.ComputerisedCheque,
	b.PayeeName, b.NotOverFlag, b.BANKREFNO,
	'DBFIX', bak.BACKED_UP_ON, @Reason1
FROM	dbo.BACKUP_ACC_BANK_ZERO_20260718 bak
JOIN	ACC_BANK b ON b.ID = bak.ID
WHERE	NOT EXISTS (SELECT 1 FROM dbo.ACC_BANK_VOID_AUDIT v WHERE v.ACC_BANK_ID = bak.ID AND v.VOIDEDBY = 'DBFIX')

INSERT INTO dbo.ACC_BANKDTLS_VOID_AUDIT
(
	VOID_AUDIT_ID, ACC_BANKDTLS_ID, ENTRYNO, CLIENT, JOBNO, BILLNO, DEDUCTION, AMOUNT,
	ENTRYTYPE, EMP_CODE, USERNAME, CRParentEntryNo, NARRATION, IS_NOT_EDIT_ABLE, ITEMCODE,
	DeptId, Act_EntryType, Entry_StartDate, IS_GST, ISTDSCALC, IS_TDS, TDS_TYPE, RATE,
	TDS_AMT, GSTRATE
)
SELECT
	v.ID, bakd.ID, bakd.ENTRYNO, d.CLIENT, d.JOBNO, d.BILLNO, bakd.DEDUCTION, bakd.AMOUNT,
	d.ENTRYTYPE, d.EMP_CODE, d.USERNAME, d.CRParentEntryNo, d.NARRATION, d.IS_NOT_EDIT_ABLE, d.ITEMCODE,
	d.DeptId, d.Act_EntryType, d.Entry_StartDate, d.IS_GST, d.ISTDSCALC, d.IS_TDS, d.TDS_TYPE, d.RATE,
	d.TDS_AMT, d.GSTRATE
FROM	dbo.BACKUP_ACC_BANKDTLS_ZERO_20260718 bakd
JOIN	ACC_BANKDTLS d ON d.ID = bakd.ID
JOIN	dbo.ACC_BANK_VOID_AUDIT v ON v.ENTRYNO = bakd.ENTRYNO AND v.VOIDEDBY = 'DBFIX'
WHERE	NOT EXISTS (SELECT 1 FROM dbo.ACC_BANKDTLS_VOID_AUDIT ad WHERE ad.ACC_BANKDTLS_ID = bakd.ID)

-- === Batch 2 (34 entries) - BACKUP_ACC_BANK_ZERO_20260718_B2 captured both ACTUALAMOUNT
--     AND the pre-tag NARRATION; every other column is untouched, pulled live. ===
UPDATE b
SET		b.VOIDREASON = @Reason2,
		b.VOIDEDBY = 'DBFIX',
		b.VOIDEDON = bak.BACKED_UP_ON
FROM	ACC_BANK b
JOIN	dbo.BACKUP_ACC_BANK_ZERO_20260718_B2 bak ON bak.ID = b.ID
WHERE	b.VOIDEDON IS NULL

INSERT INTO dbo.ACC_BANK_VOID_AUDIT
(
	ACC_BANK_ID, ENTRYNO, ENTRYDT, [STATUS], BANK, CHEQUETYPE, CHEQUENO, CHEQUEDT, OURBANK,
	NARRATION1, NARRATION2, CITYCODE, CMPCODE, ENTMM, ENTYR, ENTDD, ENTNO, EXPENSE, USERNAME,
	CMPID, ACTUALAMOUNT, NARRATION, ADVAMT, AMTWITHOUTADV, CLEARANCEDATE, COMPUTERISEDCHEQUE,
	PAYEENAME, NOTOVERFLAG, BANKREFNO,
	VOIDEDBY, VOIDEDON, VOIDREASON
)
SELECT
	bak.ID, bak.ENTRYNO, b.ENTRYDT, b.[STATUS], b.BANK, b.CHEQUETYPE, b.CHEQUENO, b.CHEQUEDT, b.OURBANK,
	b.NARRATION1, b.NARRATION2, b.CITYCODE, b.CMPCODE, b.ENTMM, b.ENTYR, b.ENTDD, b.ENTNO, b.EXPENSE, b.USERNAME,
	b.CMPID, bak.ACTUALAMOUNT, bak.NARRATION, b.ADVAMT, b.AMTWITHOUTADV, b.clearanceDate, b.ComputerisedCheque,
	b.PayeeName, b.NotOverFlag, b.BANKREFNO,
	'DBFIX', bak.BACKED_UP_ON, @Reason2
FROM	dbo.BACKUP_ACC_BANK_ZERO_20260718_B2 bak
JOIN	ACC_BANK b ON b.ID = bak.ID
WHERE	NOT EXISTS (SELECT 1 FROM dbo.ACC_BANK_VOID_AUDIT v WHERE v.ACC_BANK_ID = bak.ID AND v.VOIDEDBY = 'DBFIX')

INSERT INTO dbo.ACC_BANKDTLS_VOID_AUDIT
(
	VOID_AUDIT_ID, ACC_BANKDTLS_ID, ENTRYNO, CLIENT, JOBNO, BILLNO, DEDUCTION, AMOUNT,
	ENTRYTYPE, EMP_CODE, USERNAME, CRParentEntryNo, NARRATION, IS_NOT_EDIT_ABLE, ITEMCODE,
	DeptId, Act_EntryType, Entry_StartDate, IS_GST, ISTDSCALC, IS_TDS, TDS_TYPE, RATE,
	TDS_AMT, GSTRATE
)
SELECT
	v.ID, bakd.ID, bakd.ENTRYNO, d.CLIENT, d.JOBNO, d.BILLNO, bakd.DEDUCTION, bakd.AMOUNT,
	d.ENTRYTYPE, d.EMP_CODE, d.USERNAME, d.CRParentEntryNo, d.NARRATION, d.IS_NOT_EDIT_ABLE, d.ITEMCODE,
	d.DeptId, d.Act_EntryType, d.Entry_StartDate, d.IS_GST, d.ISTDSCALC, d.IS_TDS, d.TDS_TYPE, d.RATE,
	d.TDS_AMT, d.GSTRATE
FROM	dbo.BACKUP_ACC_BANKDTLS_ZERO_20260718_B2 bakd
JOIN	ACC_BANKDTLS d ON d.ID = bakd.ID
JOIN	dbo.ACC_BANK_VOID_AUDIT v ON v.ENTRYNO = bakd.ENTRYNO AND v.VOIDEDBY = 'DBFIX'
WHERE	NOT EXISTS (SELECT 1 FROM dbo.ACC_BANKDTLS_VOID_AUDIT ad WHERE ad.ACC_BANKDTLS_ID = bakd.ID)

-- PRINT does not accept a subquery inline (Msg 1046) - resolve counts into variables first,
-- same fix already applied once to FIX_ACC_BANK_ZERO_AMOUNT_20260718_BATCH2.sql this session.
DECLARE @BankBackfilledCount INT, @VoidAuditCount INT, @DtlsVoidAuditCount INT
SELECT @BankBackfilledCount = COUNT(*) FROM ACC_BANK WHERE VOIDEDBY = 'DBFIX'
SELECT @VoidAuditCount = COUNT(*) FROM dbo.ACC_BANK_VOID_AUDIT WHERE VOIDEDBY = 'DBFIX'
SELECT @DtlsVoidAuditCount = COUNT(*) FROM dbo.ACC_BANKDTLS_VOID_AUDIT d JOIN dbo.ACC_BANK_VOID_AUDIT v ON v.ID = d.VOID_AUDIT_ID WHERE v.VOIDEDBY = 'DBFIX'

PRINT 'Backfilled ' + CONVERT(VARCHAR, @BankBackfilledCount) + ' ACC_BANK row(s) into VOIDEDON/VOIDEDBY/VOIDREASON.'
PRINT CONVERT(VARCHAR, @VoidAuditCount) + ' row(s) in ACC_BANK_VOID_AUDIT.'
PRINT CONVERT(VARCHAR, @DtlsVoidAuditCount) + ' row(s) in ACC_BANKDTLS_VOID_AUDIT.'
GO
