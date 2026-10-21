/* LINKS-ERP copy - target database: Linksdb20 (host 180.179.207.163,15787).
   Ported from Manilal _DB_FIX on 2026-08-27; schema parity verified against the live DB. */
/*=====================================================================================
  FINANCE DASHBOARD - DATA QUALITY AUDIT
  ------------------------------------------------------------------------------------
  Creates USP_ACC_RPT_FINANCE_DASHBOARD_AUDIT - the on-demand audit behind the
  dashboard's AUDIT tab.

  A SEPARATE proc from USP_ACC_RPT_FINANCE_DASHBOARD on purpose:
    - it needs credit-note and exp_master scans the dashboard hot path does not;
    - it is monthly-hygiene, not daily-decision - paying for it on every load is waste;
    - it must be LIVE (fix a credit period, see it disappear) while the dashboard
      response is cached for up to 2 hours. One proc would force one cache policy on both.

  Checks that returned ZERO in research are deliberately absent (invoices with no job
  link: 1 of 10,160 / Rs.0; orphan inv_no: 18 all-time). Tiles that always read zero
  erode trust in the ones that matter.

  Target: SQL Server 2008 R2. Re-runnable (drop/recreate).

  2026-10-21: checks 3 and 4 read indexed temp sets (#BANK, #EXP, #INVNO, #CNNO) built once,
  445 s -> about 2 s per call on LinksDB20, same rows. Where this script already ran, apply
  FINANCE_DASHBOARD_AUDIT_PERF_LINKSDB20_20261021.sql instead.

  RESULT SETS
    Table   summary - one row per check
    Table1  drill   - one flat shape for every check, TOP 500 per check by value
=====================================================================================*/

USE [Linksdb20]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

IF OBJECT_ID('dbo.USP_ACC_RPT_FINANCE_DASHBOARD_AUDIT') IS NOT NULL
    DROP PROCEDURE dbo.USP_ACC_RPT_FINANCE_DASHBOARD_AUDIT
GO

CREATE PROCEDURE dbo.USP_ACC_RPT_FINANCE_DASHBOARD_AUDIT
    @FROMDATE   NVARCHAR(15) = NULL,
    @TODATE     NVARCHAR(15) = NULL,
    @CMPCODE    NVARCHAR(2)  = NULL,
    @CITYCODE   NVARCHAR(20) = NULL,
    @CLIENTCODE NVARCHAR(50) = NULL,   -- accepted for interface parity; checks are portfolio-level
    @TOPN       NVARCHAR(10) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SET ARITHABORT ON;

    IF LEN(LTRIM(RTRIM(ISNULL(@FROMDATE, '')))) <> 10 OR LEN(LTRIM(RTRIM(ISNULL(@TODATE, '')))) <> 10
    BEGIN
        SELECT '101' AS STATUS, 'FROMDATE and TODATE are required in dd/MM/yyyy format.' AS STATUSMSG
        RETURN
    END

    SET @CMPCODE  = LTRIM(RTRIM(ISNULL(@CMPCODE, '')))
    SET @CITYCODE = LTRIM(RTRIM(ISNULL(@CITYCODE, '')))

    DECLARE @FROM_YMD CHAR(8), @TO_YMD CHAR(8)
    SET @FROM_YMD = SUBSTRING(@FROMDATE,7,4) + SUBSTRING(@FROMDATE,4,2) + SUBSTRING(@FROMDATE,1,2)
    SET @TO_YMD   = SUBSTRING(@TODATE,  7,4) + SUBSTRING(@TODATE,  4,2) + SUBSTRING(@TODATE,  1,2)

    CREATE TABLE #CITY (CITYCODE VARCHAR(10))
    IF @CITYCODE = '' OR @CITYCODE = 'ALL'
        INSERT INTO #CITY SELECT DISTINCT LTRIM(RTRIM(citycode)) FROM CITY WHERE ISNULL(citycode,'') <> ''
    ELSE
        INSERT INTO #CITY SELECT DISTINCT LTRIM(RTRIM(citycode)) FROM CITY
         WHERE LTRIM(RTRIM(ISNULL(citycode1,''))) = @CITYCODE OR LTRIM(RTRIM(ISNULL(citycode,''))) = @CITYCODE

    CREATE TABLE #SUMMARY
    (
        SORT_NO    INT,
        CHECK_CODE VARCHAR(30),
        CHECK_NAME VARCHAR(80),
        SEVERITY   VARCHAR(10),      -- HIGH / MEDIUM / INFO
        ITEMS      INT,
        VALUE_INR  DECIMAL(18,2),
        BY_DESIGN_ITEMS INT,
        BY_DESIGN_VALUE DECIMAL(18,2),
        NOTE       VARCHAR(250)
    )

    CREATE TABLE #DETAIL
    (
        CHECK_CODE  VARCHAR(30),
        ENTITY_CODE VARCHAR(20),
        ENTITY_NAME VARCHAR(150),
        REF_NO      VARCHAR(25),
        REF_DATE    VARCHAR(12),
        VALUE_INR   DECIMAL(18,2),
        BY_DESIGN   BIT,
        DETAIL      VARCHAR(200)
    )

    ---------------------------------------------------------------------------------
    -- in-period invoices, reused by several checks
    ---------------------------------------------------------------------------------
    CREATE TABLE #PINV (INV_NO VARCHAR(15), INV_YMD CHAR(8), CLIENTCODE VARCHAR(10),
                        TOTALAMT FLOAT, PAYBY DATETIME, INV_DT DATETIME)
    INSERT INTO #PINV
    SELECT LTRIM(RTRIM(i.inv_no)),
           SUBSTRING(i.inv_date,7,4)+SUBSTRING(i.inv_date,4,2)+SUBSTRING(i.inv_date,1,2),
           LTRIM(RTRIM(i.inv_client)),
           CONVERT(FLOAT, ISNULL(i.totalamt,0)),
           i.PAYBYDT,
           CASE WHEN ISDATE(SUBSTRING(i.inv_date,7,4)+SUBSTRING(i.inv_date,4,2)+SUBSTRING(i.inv_date,1,2)) = 1 THEN CONVERT(DATETIME, SUBSTRING(i.inv_date,7,4)+SUBSTRING(i.inv_date,4,2)+SUBSTRING(i.inv_date,1,2), 112) END
      FROM acc_invoice i
     INNER JOIN #CITY c ON c.CITYCODE = LTRIM(RTRIM(i.citycode))
     WHERE LTRIM(RTRIM(ISNULL(i.cmpcode,''))) = @CMPCODE
       AND LEN(ISNULL(i.inv_date,'')) = 10
       AND ISDATE(SUBSTRING(i.inv_date,7,4)+SUBSTRING(i.inv_date,4,2)+SUBSTRING(i.inv_date,1,2)) = 1
       AND SUBSTRING(i.inv_date,7,4)+SUBSTRING(i.inv_date,4,2)+SUBSTRING(i.inv_date,1,2)
           BETWEEN @FROM_YMD AND @TO_YMD
       AND LTRIM(RTRIM(ISNULL(i.inv_client,''))) LIKE 'E%'
    CREATE CLUSTERED INDEX IX_PINV ON #PINV (INV_NO)

    ---------------------------------------------------------------------------------
    -- lookup sets for checks 3 and 4, built once. acc_bank, acc_bankdtls, acc_invoice and
    -- acc_creditnote have no indexes and exp_code is compared trimmed, so the per-receipt
    -- lookups scanned those tables once per row: check 4 took 421 s and 127 million reads
    -- for 8,059 receipts on LinksDB20 (2026-10-21), check 3 took 24 s. Same comparisons
    -- as before, same rows (#BANK is only pre-filtered with the checks' own predicates).
    ---------------------------------------------------------------------------------
    SELECT entryno, entrydt, status, citycode INTO #BANK FROM acc_bank
     WHERE status IN ('BR','CR')
       AND LEN(ISNULL(entrydt,'')) = 10
       AND SUBSTRING(entrydt,7,4)+SUBSTRING(entrydt,4,2)+SUBSTRING(entrydt,1,2)
           BETWEEN @FROM_YMD AND @TO_YMD
    CREATE CLUSTERED INDEX IX_BANK ON #BANK (entryno)

    SELECT LTRIM(RTRIM(exp_code)) AS EXP_CODE, exp_name INTO #EXP FROM exp_master
    CREATE CLUSTERED INDEX IX_EXP ON #EXP (EXP_CODE)

    SELECT DISTINCT inv_no INTO #INVNO FROM acc_invoice WHERE inv_no IS NOT NULL
    CREATE CLUSTERED INDEX IX_INVNO ON #INVNO (inv_no)

    SELECT DISTINCT LTRIM(RTRIM(crt_no)) AS CRT_NO INTO #CNNO FROM acc_creditnote WHERE crt_no IS NOT NULL
    CREATE CLUSTERED INDEX IX_CNNO ON #CNNO (CRT_NO)

    ---------------------------------------------------------------------------------
    -- CHECK 1 : CREDIT_PERIOD_MISSING (HIGH) - the headline finding.
    --   ~50% of invoiced clients have no credit period on the client master; every
    --   overdue / ageing / recovery-gap figure for them runs on the default 30.
    ---------------------------------------------------------------------------------
    ;WITH ACT AS (
        SELECT CLIENTCODE, SUM(TOTALAMT) AS BILLED
          FROM #PINV GROUP BY CLIENTCODE
    ), GAP AS (
        SELECT a.CLIENTCODE, a.BILLED, LTRIM(RTRIM(ISNULL(e.exp_name, a.CLIENTCODE))) AS CLIENTNAME
          FROM ACT a
          LEFT JOIN exp_master e ON LTRIM(RTRIM(e.exp_code)) = a.CLIENTCODE
         WHERE (e.exp_code IS NULL)
            OR ( (ISNUMERIC(LTRIM(RTRIM(ISNULL(e.CREDITPERIOD_SEA,''))) + '.0e0') <> 1
                  OR CONVERT(FLOAT, LTRIM(RTRIM(e.CREDITPERIOD_SEA))) = 0)
             AND (ISNUMERIC(LTRIM(RTRIM(ISNULL(e.CREDITPERIOD_AIR,''))) + '.0e0') <> 1
                  OR CONVERT(FLOAT, LTRIM(RTRIM(e.CREDITPERIOD_AIR))) = 0) )
    )
    INSERT INTO #DETAIL (CHECK_CODE, ENTITY_CODE, ENTITY_NAME, REF_NO, REF_DATE, VALUE_INR, BY_DESIGN, DETAIL)
    SELECT TOP 500 'CREDIT_PERIOD_MISSING', CLIENTCODE, CLIENTNAME, '', '',
           CONVERT(DECIMAL(18,2), BILLED), 0,
           'No CREDITPERIOD_SEA / _AIR on the client master; ageing runs on the default 30 days.'
      FROM GAP ORDER BY BILLED DESC

    INSERT INTO #SUMMARY
    SELECT 1, 'CREDIT_PERIOD_MISSING', 'Clients invoiced without a credit period', 'HIGH',
           COUNT(*), CONVERT(DECIMAL(18,2), SUM(VALUE_INR)), 0, 0,
           'Fix in the client master (Credit Period Sea / Air). Until then their overdue and recovery-gap figures assume 30 days.'
      FROM #DETAIL WHERE CHECK_CODE = 'CREDIT_PERIOD_MISSING'

    ---------------------------------------------------------------------------------
    -- CHECK 2 : PAYBYDT_ZERO (INFO) - corroboration of check 1, not a second defect.
    ---------------------------------------------------------------------------------
    INSERT INTO #SUMMARY
    SELECT 2, 'PAYBYDT_ZERO', 'Invoices due on the day they were raised', 'INFO',
           COUNT(*), CONVERT(DECIMAL(18,2), SUM(TOTALAMT)), 0, 0,
           'PAYBYDT equals the invoice date - the system fallback when no credit term exists. A symptom of the missing credit periods above.'
      FROM #PINV
     WHERE PAYBY IS NOT NULL AND DATEDIFF(DAY, INV_DT, PAYBY) = 0

    ---------------------------------------------------------------------------------
    -- CHECK 3 : UNAPPLIED_RECEIPTS (MEDIUM).
    --   Client receipts booked without naming a bill. OA (on-account) and AD (advance)
    --   are BY DESIGN; GR / PE / JB are the actionable subset.
    ---------------------------------------------------------------------------------
    INSERT INTO #DETAIL (CHECK_CODE, ENTITY_CODE, ENTITY_NAME, REF_NO, REF_DATE, VALUE_INR, BY_DESIGN, DETAIL)
    SELECT TOP 500 'UNAPPLIED_RECEIPTS',
           LTRIM(RTRIM(d.client)),
           LTRIM(RTRIM(ISNULL(e.exp_name, d.client))),
           LTRIM(RTRIM(d.entryno)),
           LTRIM(RTRIM(ISNULL(b.entrydt,''))),
           CONVERT(DECIMAL(18,2), CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(d.amount)),''),'0'))),
           CASE WHEN d.entrytype IN ('OA','AD') THEN 1 ELSE 0 END,
           'Receipt entrytype ' + ISNULL(d.entrytype,'?') +
           CASE WHEN d.entrytype IN ('OA','AD')
                THEN ' (on-account / advance - unapplied by design)'
                ELSE ' - not applied to any bill; match it or the client ages incorrectly' END
      FROM acc_bankdtls d
     INNER JOIN #BANK b ON b.entryno = d.entryno
     INNER JOIN #CITY c ON c.CITYCODE = LTRIM(RTRIM(b.citycode))
      LEFT JOIN #EXP e ON e.EXP_CODE = LTRIM(RTRIM(d.client))
     WHERE b.status IN ('BR','CR')
       AND ISNULL(d.entrytype,'') <> 'AB'
       AND LTRIM(RTRIM(ISNULL(d.client,''))) LIKE 'E%'
       AND SUBSTRING(d.entryno,1,2) = @CMPCODE
       AND LEN(ISNULL(b.entrydt,'')) = 10
       AND SUBSTRING(b.entrydt,7,4)+SUBSTRING(b.entrydt,4,2)+SUBSTRING(b.entrydt,1,2)
           BETWEEN @FROM_YMD AND @TO_YMD
     ORDER BY CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(d.amount)),''),'0')) DESC

    INSERT INTO #SUMMARY
    SELECT 3, 'UNAPPLIED_RECEIPTS', 'Client receipts not applied to a bill', 'MEDIUM',
           COUNT(*), CONVERT(DECIMAL(18,2), SUM(VALUE_INR)),
           SUM(CASE WHEN BY_DESIGN = 1 THEN 1 ELSE 0 END),
           CONVERT(DECIMAL(18,2), SUM(CASE WHEN BY_DESIGN = 1 THEN VALUE_INR ELSE 0 END)),
           'OA / AD are legitimately on-account; the actionable amount is the GR / PE / JB remainder. Matching these makes the ageing honest.'
      FROM #DETAIL WHERE CHECK_CODE = 'UNAPPLIED_RECEIPTS'

    ---------------------------------------------------------------------------------
    -- CHECK 4 : AB_UNRESOLVED_BILLNO (INFO, canary).
    --   'Against Bill' rows whose billno resolves to neither an invoice NOR a credit
    --   note. Research showed the raw mismatches are a credit-note series
    --   (...037000xx), so the CN join is applied before anything is flagged.
    ---------------------------------------------------------------------------------
    INSERT INTO #DETAIL (CHECK_CODE, ENTITY_CODE, ENTITY_NAME, REF_NO, REF_DATE, VALUE_INR, BY_DESIGN, DETAIL)
    SELECT TOP 500 'AB_UNRESOLVED_BILLNO',
           LTRIM(RTRIM(d.client)),
           LTRIM(RTRIM(ISNULL(e.exp_name, d.client))),
           LTRIM(RTRIM(d.entryno)),
           LTRIM(RTRIM(ISNULL(b.entrydt,''))),
           CONVERT(DECIMAL(18,2), CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(d.amount)),''),'0'))),
           0,
           'billno ' + LTRIM(RTRIM(ISNULL(d.billno,''))) + ' matches no invoice and no credit note'
      FROM acc_bankdtls d
     INNER JOIN #BANK b ON b.entryno = d.entryno
     INNER JOIN #CITY c ON c.CITYCODE = LTRIM(RTRIM(b.citycode))
      LEFT JOIN #EXP e ON e.EXP_CODE = LTRIM(RTRIM(d.client))
     WHERE b.status IN ('BR','CR')
       AND d.entrytype = 'AB'
       AND ISNULL(d.billno,'') <> ''
       AND SUBSTRING(d.entryno,1,2) = @CMPCODE
       AND LEN(ISNULL(b.entrydt,'')) = 10
       AND SUBSTRING(b.entrydt,7,4)+SUBSTRING(b.entrydt,4,2)+SUBSTRING(b.entrydt,1,2)
           BETWEEN @FROM_YMD AND @TO_YMD
       AND NOT EXISTS (SELECT 1 FROM #INVNO iv
                        WHERE iv.inv_no = LTRIM(RTRIM(d.billno)))
       AND NOT EXISTS (SELECT 1 FROM #CNNO cn
                        WHERE cn.CRT_NO = LTRIM(RTRIM(d.billno)))
     ORDER BY CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(d.amount)),''),'0')) DESC

    INSERT INTO #SUMMARY
    SELECT 4, 'AB_UNRESOLVED_BILLNO', 'Against-bill receipts with an unknown bill number', 'INFO',
           ISNULL(COUNT(*),0), CONVERT(DECIMAL(18,2), ISNULL(SUM(VALUE_INR),0)), 0, 0,
           'Canary check - normally ~0 after excluding credit-note numbers. Growth means receipts are being keyed against numbers that do not exist.'
      FROM #DETAIL WHERE CHECK_CODE = 'AB_UNRESOLVED_BILLNO'

    ---------------------------------------------------------------------------------
    -- CHECK 5 : JOB_NOT_IN_MASTER (INFO, canary).
    --   Invoiced job numbers found in none of the three job masters
    --   (EXPT_MASTER / TBL_IMP_IMPORT / EXPT_MASTER_MISC). Expected residue: the
    --   type-8 monthly series (~12 rows). Growth = a new job series has appeared and
    --   the dashboard's job population is silently under-counting again.
    ---------------------------------------------------------------------------------
    CREATE TABLE #PJOB (JOBNO VARCHAR(25), INV_NO VARCHAR(15))
    INSERT INTO #PJOB
    SELECT DISTINCT LTRIM(RTRIM(jn.inv_jobno)), LTRIM(RTRIM(jn.inv_no))
      FROM acc_invjobno jn
     INNER JOIN #PINV v ON v.INV_NO = LTRIM(RTRIM(jn.inv_no))
     WHERE LEN(LTRIM(RTRIM(ISNULL(jn.inv_jobno,'')))) >= 8

    CREATE TABLE #KNOWN (JOBNO VARCHAR(25))
    INSERT INTO #KNOWN SELECT DISTINCT p.JOBNO FROM #PJOB p INNER JOIN EXPT_MASTER e ON LTRIM(RTRIM(e.exptno)) = p.JOBNO
    INSERT INTO #KNOWN SELECT DISTINCT p.JOBNO FROM #PJOB p INNER JOIN TBL_IMP_IMPORT i ON LTRIM(RTRIM(i.Import_Code)) = p.JOBNO
    INSERT INTO #KNOWN SELECT DISTINCT p.JOBNO FROM #PJOB p INNER JOIN EXPT_MASTER_MISC m ON LTRIM(RTRIM(m.JOBNO)) = p.JOBNO
    CREATE CLUSTERED INDEX IX_KNOWN ON #KNOWN (JOBNO)

    INSERT INTO #DETAIL (CHECK_CODE, ENTITY_CODE, ENTITY_NAME, REF_NO, REF_DATE, VALUE_INR, BY_DESIGN, DETAIL)
    SELECT TOP 500 'JOB_NOT_IN_MASTER',
           SUBSTRING(p.JOBNO,8,1), 'Job type digit ' + SUBSTRING(p.JOBNO,8,1),
           p.JOBNO, '',
           CONVERT(DECIMAL(18,2), ISNULL(v.TOTALAMT,0)), 0,
           'Invoiced on ' + p.INV_NO + ' but present in no job master'
      FROM #PJOB p
      LEFT JOIN #PINV v ON v.INV_NO = p.INV_NO
     WHERE NOT EXISTS (SELECT 1 FROM #KNOWN k WHERE k.JOBNO = p.JOBNO)
     ORDER BY ISNULL(v.TOTALAMT,0) DESC

    INSERT INTO #SUMMARY
    SELECT 5, 'JOB_NOT_IN_MASTER', 'Invoiced jobs found in no job master', 'INFO',
           ISNULL(COUNT(*),0), CONVERT(DECIMAL(18,2), ISNULL(SUM(VALUE_INR),0)), 0, 0,
           'Canary. Expected residue is the type-8 monthly retainer series. Growth means a new job series exists that the dashboard does not count.'
      FROM #DETAIL WHERE CHECK_CODE = 'JOB_NOT_IN_MASTER'

    ---------------------------------------------------------------------------------
    -- CHECK 6 : MILESTONE_COVERAGE (INFO).
    --   Why the cash funnel has 3 stages, on the record: delivery/POD milestone dates
    --   are largely unrecorded, so a "delivered / billing ready" stage cannot be built.
    ---------------------------------------------------------------------------------
    DECLARE @EXP_TOT INT, @EXP_DLV INT, @IMP_TOT INT, @IMP_DLV INT

    SELECT @EXP_TOT = COUNT(*),
           @EXP_DLV = SUM(CASE WHEN LEN(LTRIM(RTRIM(ISNULL(s.DELIVERY,'')))) = 10 THEN 1 ELSE 0 END)
      FROM TBL_SHIPMENT_SUMMARY_JOB s
     WHERE s.DOCDATE_YYYYMMDD BETWEEN @FROM_YMD AND @TO_YMD
       AND LTRIM(RTRIM(ISNULL(s.SHIPTYPE,''))) = 'EXPORT'

    SELECT @IMP_TOT = COUNT(*),
           @IMP_DLV = SUM(CASE WHEN i.DELIVERY_VALIDATE_DT IS NOT NULL THEN 1 ELSE 0 END)
      FROM TBL_IMP_IMPORT i
     WHERE LTRIM(RTRIM(ISNULL(i.cmp_code,''))) = @CMPCODE
       AND CONVERT(CHAR(8), i.Import_Date, 112) BETWEEN @FROM_YMD AND @TO_YMD

    INSERT INTO #SUMMARY
    SELECT 6, 'MILESTONE_COVERAGE', 'Delivery / POD milestone dates recorded', 'INFO',
           ISNULL(@EXP_TOT,0) + ISNULL(@IMP_TOT,0), 0, 0, 0,
           'Delivery date present on '
           + CONVERT(VARCHAR(12), ISNULL(@EXP_DLV,0)) + ' of ' + CONVERT(VARCHAR(12), ISNULL(@EXP_TOT,0)) + ' export jobs and '
           + CONVERT(VARCHAR(12), ISNULL(@IMP_DLV,0)) + ' of ' + CONVERT(VARCHAR(12), ISNULL(@IMP_TOT,0)) + ' import jobs. '
           + 'This is why the cash funnel has no "delivered / billing ready" stage.'

    ---------------------------------------------------------------------------------
    -- output
    ---------------------------------------------------------------------------------
    SELECT CHECK_CODE, CHECK_NAME, SEVERITY, ITEMS, VALUE_INR,
           BY_DESIGN_ITEMS, BY_DESIGN_VALUE,
           CONVERT(DECIMAL(18,2), VALUE_INR - BY_DESIGN_VALUE) AS ACTIONABLE_VALUE,
           NOTE
      FROM #SUMMARY
     ORDER BY SORT_NO

    SELECT CHECK_CODE, ENTITY_CODE, ENTITY_NAME, REF_NO, REF_DATE, VALUE_INR, BY_DESIGN, DETAIL
      FROM #DETAIL
     ORDER BY CHECK_CODE, VALUE_INR DESC

    DROP TABLE #CITY
    DROP TABLE #SUMMARY
    DROP TABLE #DETAIL
    DROP TABLE #PINV
    DROP TABLE #PJOB
    DROP TABLE #KNOWN
    DROP TABLE #BANK
    DROP TABLE #EXP
    DROP TABLE #INVNO
    DROP TABLE #CNNO
END
GO

GRANT EXECUTE ON dbo.USP_ACC_RPT_FINANCE_DASHBOARD_AUDIT TO PUBLIC
GO
