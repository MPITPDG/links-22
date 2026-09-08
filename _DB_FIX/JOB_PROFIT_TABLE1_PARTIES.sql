/* LINKS-ERP copy - target database: Linksdb20 (host 180.179.207.163,15787).
   Ported from Manilal _DB_FIX on 2026-08-27; schema parity verified against the live DB. */
/*=====================================================================================
  USP_ACCT_RPT_JOB_PROFIT  -  TABLE 1 : show the job's parties, billed or not
  ------------------------------------------------------------------------------------
  WHY

  Table 1 is built FROM ACC_INVOICE. A job with no invoice yet therefore returns ZERO
  ROWS, and the Job Profit page shows a blank where the customer's name belongs - on
  the one report the accounts team opens BEFORE posting entries, where "not billed yet"
  is the most important thing on the screen.

  A job has an exporter / importer and a bill-to party from the moment it is opened.
  This change makes Table 1 return EXACTLY ONE ROW ALWAYS: the invoice block when there
  is an invoice (unchanged), plus the parties read from whichever job master owns the
  job number.

  WHAT CHANGES

    - four new columns, APPENDED after the existing ones:
          EXPORTER_CODE, EXPORTER_NAME, BILLTO_CODE, BILLTO_NAME
    - one more, JOB_SOURCE : 'EXPORT' | 'IMPORT' | 'MISC' | '' - so the screen can
      label the party "Exporter" or "Importer" correctly instead of guessing
    - Table 1 now returns one row even when the job is unbilled. The invoice columns
      are NULL in that case, exactly as they read today when the row is absent.

  Every existing column keeps its name, type and position, so nothing that reads
  Table 1 by name can break.

  ONE THING TO CHECK BEFORE DEPLOYING
  If any OTHER consumer of this proc tests "Table1 has no rows" to mean "this job is
  not billed", it must be changed to test INV_NO instead. The Angular Job Profit page
  already reads by column name and is safe. Find other callers with:

      SELECT OBJECT_NAME(object_id) FROM sys.sql_modules
       WHERE definition LIKE '%USP_ACCT_RPT_JOB_PROFIT%'

  HOW TO APPLY
  Open USP_ACCT_RPT_JOB_PROFIT in SSMS (Modify), find the block marked
  "/*TABLE 1: INVOICE DETAILS*/", replace that ONE SELECT with section B below, and
  execute the ALTER. Nothing else in the proc is touched.
=====================================================================================*/


/*=====================================================================================
  SECTION A - the block to REPLACE. This is exactly what is in the proc today.
=====================================================================================*/
/*
/*TABLE 1: INVOICE DETAILS*/
SELECT 	TOP 1 ACC_INVOICE.INV_NO,
		ACC_INVOICE.INV_DATE,
		ACC_INVOICE.INV_CLIENT,
		ACC_INVOICE.INV_PKGS,
		ACC_INVOICE.INV_TYPEOFPKG,
		ACC_INVOICE.INV_WT,
		ACC_INVOICE.INV_CARRIER,
		EXP_NAME = isnull(EXP_MASTER.EXP_NAME,'')
FROM 	ACC_INVOICE
		LEFT OUTER JOIN ACC_INVJOBNO ON ACC_INVJOBNO.INV_NO= ACC_INVOICE.INV_NO
		LEFT OUTER JOIN  EXP_MASTER ON EXP_MASTER.EXP_CODE = ACC_INVOICE.INV_CLIENT
WHERE	ACC_INVJOBNO.INV_JOBNO =  @JOBNO
*/


/*=====================================================================================
  SECTION B - paste this IN ITS PLACE.
=====================================================================================*/

/*TABLE 1: INVOICE DETAILS + THE JOB'S OWN PARTIES

  The invoice half is the ORIGINAL query, unchanged, captured into a temp table by
  SELECT ... INTO so every column keeps the exact type it has today - no CONVERT, no
  guessing whether INV_PKGS is numeric or varchar. With no invoice the table is created
  empty, and the CROSS JOIN below still yields one row with NULL invoice columns.       */

IF OBJECT_ID('TEMPDB..#JP_INV') IS NOT NULL
	DROP TABLE #JP_INV

SELECT 	TOP 1 ACC_INVOICE.INV_NO,
		ACC_INVOICE.INV_DATE,
		ACC_INVOICE.INV_CLIENT,
		ACC_INVOICE.INV_PKGS,
		ACC_INVOICE.INV_TYPEOFPKG,
		ACC_INVOICE.INV_WT,
		ACC_INVOICE.INV_CARRIER,
		EXP_NAME = isnull(EXP_MASTER.EXP_NAME,'')
INTO	#JP_INV
FROM 	ACC_INVOICE
		LEFT OUTER JOIN ACC_INVJOBNO ON ACC_INVJOBNO.INV_NO= ACC_INVOICE.INV_NO
		LEFT OUTER JOIN  EXP_MASTER ON EXP_MASTER.EXP_CODE = ACC_INVOICE.INV_CLIENT
WHERE	ACC_INVJOBNO.INV_JOBNO =  @JOBNO

/*  The parties. Looked up by JOB NUMBER in each master in turn rather than by decoding
	the type digit at position 8 of the job no: a job number lives in exactly one of
	these three tables, so the lookup is unambiguous, and it cannot be broken by a job
	type that was never in the 1/2/5/6/3/7/9 list.                                      */

DECLARE @EXPORTER_CODE VARCHAR(20),
		@BILLTO_CODE   VARCHAR(20),
		@JOB_SOURCE    VARCHAR(10)

-- exports (sea + air) : EXPT_MASTER
SELECT	TOP 1
		@EXPORTER_CODE = LTRIM(RTRIM(ISNULL(e.expt_exporter, ''))),
		@BILLTO_CODE   = LTRIM(RTRIM(ISNULL(e.expt_billto,   ''))),
		@JOB_SOURCE    = 'EXPORT'
FROM	EXPT_MASTER e
WHERE	LTRIM(RTRIM(e.exptno)) = LTRIM(RTRIM(@JOBNO))

-- imports (sea + air) : TBL_IMP_IMPORT
IF @JOB_SOURCE IS NULL
SELECT	TOP 1
		@EXPORTER_CODE = LTRIM(RTRIM(ISNULL(i.fk_Imp_Code, ''))),
		@BILLTO_CODE   = LTRIM(RTRIM(ISNULL(i.fk_BillTo,   ''))),
		@JOB_SOURCE    = 'IMPORT'
FROM	TBL_IMP_IMPORT i
WHERE	LTRIM(RTRIM(i.Import_Code)) = LTRIM(RTRIM(@JOBNO))

/* misc / non-shipment jobs : EXPT_MASTER_MISC carries ONE party, so it fills BILL TO
   and leaves the exporter empty - the screen then shows a single "Bill to party" line
   rather than inventing an exporter that the job never had. */
IF @JOB_SOURCE IS NULL
SELECT	TOP 1
		@EXPORTER_CODE = '',
		@BILLTO_CODE   = LTRIM(RTRIM(ISNULL(m.CLIENT_CODE, ''))),
		@JOB_SOURCE    = 'MISC'
FROM	EXPT_MASTER_MISC m
WHERE	LTRIM(RTRIM(m.JOBNO)) = LTRIM(RTRIM(@JOBNO))

/* Name for a party code: client master first, then the ledger name, then the bare code.
   Never blank when a code exists - a code with no name is a master-data problem, and
   showing the code says so. */
SELECT	i.INV_NO,
		i.INV_DATE,
		i.INV_CLIENT,
		i.INV_PKGS,
		i.INV_TYPEOFPKG,
		i.INV_WT,
		i.INV_CARRIER,
		i.EXP_NAME,
		EXPORTER_CODE = ISNULL(@EXPORTER_CODE, ''),
		EXPORTER_NAME = CASE WHEN ISNULL(@EXPORTER_CODE, '') = '' THEN '' ELSE
			ISNULL(NULLIF(LTRIM(RTRIM(ISNULL(
				(SELECT TOP 1 x.EXP_NAME FROM EXP_MASTER x
				  WHERE LTRIM(RTRIM(x.EXP_CODE)) = @EXPORTER_CODE), ''))), ''),
			ISNULL(NULLIF(LTRIM(RTRIM(ISNULL(
				(SELECT TOP 1 g.ACCTNAME FROM GENACCT_MASTER g
				  WHERE LTRIM(RTRIM(g.ACCTCODE)) = @EXPORTER_CODE), ''))), ''),
				@EXPORTER_CODE)) END,
		BILLTO_CODE   = ISNULL(@BILLTO_CODE, ''),
		BILLTO_NAME   = CASE WHEN ISNULL(@BILLTO_CODE, '') = '' THEN '' ELSE
			ISNULL(NULLIF(LTRIM(RTRIM(ISNULL(
				(SELECT TOP 1 x.EXP_NAME FROM EXP_MASTER x
				  WHERE LTRIM(RTRIM(x.EXP_CODE)) = @BILLTO_CODE), ''))), ''),
			ISNULL(NULLIF(LTRIM(RTRIM(ISNULL(
				(SELECT TOP 1 g.ACCTNAME FROM GENACCT_MASTER g
				  WHERE LTRIM(RTRIM(g.ACCTCODE)) = @BILLTO_CODE), ''))), ''),
				@BILLTO_CODE)) END,
		JOB_SOURCE    = ISNULL(@JOB_SOURCE, '')
FROM	(SELECT ONE_ = 1) D
		LEFT OUTER JOIN #JP_INV i ON 1 = 1

/* ---- end of Table 1 ---- */


/*=====================================================================================
  SECTION C - verify (read only, run before and after)
=====================================================================================*/

-- C.1 a job that IS billed - must look exactly as it does today, plus the new columns
-- EXEC dbo.USP_ACCT_RPT_JOB_PROFIT '011051812100031'

-- C.2 an UNBILLED job - pick a real one first:
/*
SELECT TOP 10 e.exptno, e.expt_exporter, e.expt_billto, e.expt_docrecd
  FROM EXPT_MASTER e
 WHERE LTRIM(RTRIM(ISNULL(e.exptcancel,''))) = ''
   AND NOT EXISTS (SELECT 1 FROM ACC_INVJOBNO j
                    WHERE LTRIM(RTRIM(j.INV_JOBNO)) = LTRIM(RTRIM(e.exptno)))
 ORDER BY e.exptno DESC
*/
--   then run the proc on it. Table 1 must come back with ONE row:
--   INV_NO NULL, EXPORTER_NAME and BILLTO_NAME filled, JOB_SOURCE = 'EXPORT'.

-- C.3 the same for an import and for a misc job, so all three lookups are proven:
/*
SELECT TOP 5 i.Import_Code, i.fk_Imp_Code, i.fk_BillTo FROM TBL_IMP_IMPORT i
 WHERE ISNULL(i.Doc_Cancel,'N') <> 'Y' ORDER BY i.Import_Code DESC
SELECT TOP 5 m.JOBNO, m.CLIENT_CODE FROM EXPT_MASTER_MISC m ORDER BY m.JOBNO DESC
*/

-- C.4 no party code should come back without a name. Any row here is master data to fix,
--     not a proc bug - the screen will show the bare code for these.
/*
SELECT TOP 50 e.exptno, e.expt_billto
  FROM EXPT_MASTER e
 WHERE LTRIM(RTRIM(ISNULL(e.expt_billto,''))) <> ''
   AND NOT EXISTS (SELECT 1 FROM EXP_MASTER    x WHERE LTRIM(RTRIM(x.EXP_CODE)) = LTRIM(RTRIM(e.expt_billto)))
   AND NOT EXISTS (SELECT 1 FROM GENACCT_MASTER g WHERE LTRIM(RTRIM(g.ACCTCODE)) = LTRIM(RTRIM(e.expt_billto)))
 ORDER BY e.exptno DESC
*/
