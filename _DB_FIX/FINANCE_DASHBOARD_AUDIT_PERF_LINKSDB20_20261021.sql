/*===============================================================================================
  FINANCE_DASHBOARD_AUDIT_PERF_LINKSDB20_20261021.sql         (LinksDB20)

  Why  : the Finance dashboard's AUDIT panel (USP_ACC_RPT_FINANCE_DASHBOARD_AUDIT, created by step 5
         FINANCE_DASHBOARD_AUDIT.sql) took 445 s and 130 million logical reads for one call on
         LinksDB20 (2026-10-21, company 30, 01/04/2026-21/10/2026), a full CPU core on the shared
         server. Measured from sys.dm_exec_query_stats:
           check 4 AB_UNRESOLVED_BILLNO  421 s, 127 million reads
           check 3 UNAPPLIED_RECEIPTS     24 s,   2.7 million reads
           everything else                 under 1 s
         acc_bank, acc_bankdtls, acc_invoice and acc_creditnote have no indexes, and check 4 looks
         up every receipt's bill number in acc_invoice and in acc_creditnote (on trimmed crt_no),
         so each of the 8,059 receipts scanned both tables; check 3 looped over acc_bank the same
         way. exp_master was joined on trimmed exp_code, which its index cannot serve.
  Fix  : before checks 3 and 4 the procedure builds four indexed temp sets once - #BANK (acc_bank
         rows already filtered by the checks' own status / date predicates), #EXP (trimmed exp_code,
         exp_name), #INVNO (acc_invoice.inv_no) and #CNNO (trimmed acc_creditnote.crt_no) - and the
         two checks read those instead. Every comparison is unchanged. Nothing else changes.
         Tested 2026-10-21 on LinksDB20 in temp-table-only sessions, old text against new text, row
         for row: identical summary and drill rows for company 30 MUM 01/04-21/10/2026 (6 / 351),
         MUM 01/10-21/10/2026 (6 / 101) and ALL branches 01/04-21/10/2026 (6 / 351). About 2 s per
         call instead of 445 s. No index is added to the shared business tables.

  Safety : step 1 stops before altering anything unless the procedure exists, is the one from
           FINANCE_DASHBOARD_AUDIT.sql (its text has that script's CHECK 4 marker) and you may ALTER
           it. ALTER keeps the procedure's permissions (EXECUTE to PUBLIC). No table, row or other
           object is touched. Step 3 calls the procedure once (read-only: temp tables only) and
           prints its time - set @RunCheck = 0 to skip it. Re-runnable.
  Rollback: ROLLBACK_FINANCE_DASHBOARD_AUDIT_PERF_LINKSDB20_20261021.sql
  Run as : any login that may ALTER the procedure (normal login). SQL Server 2008 R2.
===============================================================================================*/
USE [LinksDB20]
GO
/* ---- 1. checks (read-only) ----------------------------------------------------------------- */
SET NOEXEC OFF;
DECLARE @problems TABLE (n INT IDENTITY(1,1), problem NVARCHAR(400));
DECLARE @d NVARCHAR(MAX);
SET @d = OBJECT_DEFINITION(OBJECT_ID('dbo.USP_ACC_RPT_FINANCE_DASHBOARD_AUDIT', 'P'));

IF DB_NAME() <> 'LinksDB20'
    INSERT INTO @problems (problem) VALUES ('Connected to ' + DB_NAME() + ', not LinksDB20.');
IF @d IS NULL
    INSERT INTO @problems (problem) VALUES ('dbo.USP_ACC_RPT_FINANCE_DASHBOARD_AUDIT not found - run FINANCE_DASHBOARD_AUDIT.sql first.');
ELSE IF CHARINDEX('CHECK 4 : AB_UNRESOLVED_BILLNO (INFO, canary)', @d) = 0
    INSERT INTO @problems (problem) VALUES ('dbo.USP_ACC_RPT_FINANCE_DASHBOARD_AUDIT is not the procedure from FINANCE_DASHBOARD_AUDIT.sql - left alone.');
IF @d IS NOT NULL AND ISNULL(HAS_PERMS_BY_NAME('dbo.USP_ACC_RPT_FINANCE_DASHBOARD_AUDIT', 'OBJECT', 'ALTER'), 0) = 0
    INSERT INTO @problems (problem) VALUES ('No ALTER permission on dbo.USP_ACC_RPT_FINANCE_DASHBOARD_AUDIT.');

IF EXISTS (SELECT 1 FROM @problems)
BEGIN
    PRINT '*** Check failed on ' + DB_NAME() + ' - NOTHING was altered:';
    SELECT n AS [#], problem FROM @problems ORDER BY n;
    RAISERROR('Check failed - see the list above.', 16, 1);
    SET NOEXEC ON;     -- skip the rest of the script, including the ALTER below
END
ELSE IF CHARINDEX('INTO #INVNO FROM acc_invoice', @d) > 0
    PRINT 'Prerequisites OK on ' + DB_NAME() + '. The procedure is already the fast version; altering it again changes nothing.';
ELSE
    PRINT 'Prerequisites OK on ' + DB_NAME() + '.';
GO
/* ---- 2. alter -------------------------------------------------------------------------------- */
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
ALTER PROCEDURE dbo.USP_ACC_RPT_FINANCE_DASHBOARD_AUDIT
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

SET NOEXEC OFF;
GO
/* ---- 3. verify + one timed call (read-only) -------------------------------------------------- */
DECLARE @RunCheck BIT, @FROM NVARCHAR(15), @TO NVARCHAR(15), @T0 DATETIME;
SET @RunCheck = 1;     -- 1 = call the procedure once for company 30, all branches, financial year to date
SET @TO   = CONVERT(NVARCHAR(10), GETDATE(), 103);
SET @FROM = '01/04/' + CONVERT(NVARCHAR(4), YEAR(GETDATE()) - CASE WHEN MONTH(GETDATE()) < 4 THEN 1 ELSE 0 END);

IF CHARINDEX('INTO #INVNO FROM acc_invoice', OBJECT_DEFINITION(OBJECT_ID('dbo.USP_ACC_RPT_FINANCE_DASHBOARD_AUDIT', 'P'))) > 0
BEGIN
    PRINT 'OK: USP_ACC_RPT_FINANCE_DASHBOARD_AUDIT on ' + DB_NAME() + ' is the fast (indexed temp sets) version.';
    IF @RunCheck = 1
    BEGIN
        SET @T0 = GETDATE();
        EXEC dbo.USP_ACC_RPT_FINANCE_DASHBOARD_AUDIT @FROMDATE = @FROM, @TODATE = @TO, @CMPCODE = '30', @CITYCODE = 'ALL', @CLIENTCODE = '', @TOPN = '';
        PRINT 'Audit ' + @FROM + ' - ' + @TO + ', company 30, all branches: '
            + CONVERT(VARCHAR(12), DATEDIFF(MILLISECOND, @T0, GETDATE())) + ' ms (was about 445,000 ms).';
    END
END
ELSE
    PRINT '*** USP_ACC_RPT_FINANCE_DASHBOARD_AUDIT is not the fast version - see the messages above.';
GO
