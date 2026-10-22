/* LINKS-ERP copy - target database: Linksdb20 (host 180.179.207.163,15787).
   Ported from Manilal _DB_FIX on 2026-08-27; schema parity verified against the live DB. */
/*=====================================================================================
  PAYABLE & CASH DASHBOARD                    (phase 1 - re-runnable)

     USP_ACC_RPT_PAYABLE_DASHBOARD - the supplier-side twin of
     USP_ACC_RPT_FINANCE_DASHBOARD. Same shape, same conventions, same caveats.

  WHY THIS EXISTS
     The receivable dashboard answers "who owes us". Nothing in the ERP answers
     "whom do we owe" - there is no vendor ageing report anywhere in the estate
     (verified: only USP_ACCOUNTS_PAYMENT_POPULATE_SUPPLIERBILL, which is per-supplier
     and drives the Bank Payment screen). Without this half, a cash position cannot be
     stated at all.

  SOURCE TABLES
     acc_purchase      header : pur_code, pur_date, pur_supplier, pur_invno, pur_duedt,
                                cmpcode, citycode
                                (NOTE: there is NO pur_suppliername and NO pur_tds on the
                                 header - verified on the live DB. TDS comes from the DETAIL
                                 lines; the supplier NAME comes from SUPPLIER_MASTER.)
     SUPPLIER_MASTER          SUP_CODE = acc_purchase.pur_supplier, SUP_NAME / SUP_SNAME.
                              Name resolution follows the house convention already used by
                              the GST audit reports: SUP_NAME -> SUP_SNAME -> GENACCT_MASTER
                              .ACCTNAME -> the bare code, so a row never shows blank.
     acc_purchasedtls  lines  : pur_code, pur_account, pur_jobno, pur_amount (VARCHAR),
                                pur_deduction, TDS_AMT, PUR_TDS, TDS_TYPE, RATE, pur_desc
     acc_bank / acc_bankdtls  payments: status IN ('BP','CP','CE'), entrytype 'AB'
     acc_JournalVoucDtls      JV settlements (entrytype 'AB')
     GENACCT_MASTER           supplier / ledger names

  THREE ASSUMPTIONS THIS PROC MAKES - RUN THE CHECKS BELOW BEFORE TRUSTING THE OUTPUT
     A. pur_duedt holds a real due date. Handled for BOTH storage forms (varchar
        dd/MM/yyyy and datetime). Where it is blank OR NOT A REAL CALENDAR DATE the
        proc falls back to pur_date + @DEFTERM days and flags HAS_TERMS = 0 - the same
        honesty rule the receivable side uses for clients with no credit period.
        DIRTY DATES: purchase rows carry values that pass a dd/MM/yyyy shape test but
        are not real dates (00/00/0000, 31/02/...). Because an ISDATE() filter in a
        WHERE does NOT protect a CONVERT in the same SELECT (the optimizer may reorder
        them - see README section 9), the ymd STRING is built and validated in one
        statement and converted to DATETIME in a SEPARATE statement. Statement order is
        then guaranteed and the conversion can never see a bad value.
     B. HOW A SUPPLIER PAYMENT IS RECORDED - measured, not assumed.
        The receivable side knocks a bill off with entrytype 'AB'. THE PAYABLE SIDE
        DOES NOT. On this database, payment lines to S% suppliers on BP/CP/CE vouchers
        break down as:
             PE  billno filled   7,798 lines   50.28 Cr   <- payment against a bill
             GR  billno blank      218 lines    1.72 Cr   <- on account, no bill named
             OA  billno blank      153 lines    0.54 Cr   <- on account
             JB  billno blank       42 lines    0.38 Cr   <- DIRECT JOB COST, no bill exists
             GR  billno filled       5 lines    0.11 Cr   <- payment against a bill
             AD  billno blank        2 lines    0.006 Cr  <- true advance
        So the rule this proc uses is DELIBERATELY not entrytype-based:
             on a payment voucher, a line that NAMES A BILL settles that bill,
             whatever its entrytype code.
        That survives a customer whose entry codes differ - which matters for a product.
        Lines with no billno are unapplied credit, EXCEPT 'JB': that is cost booked
        straight to a job with no purchase bill behind it, so it can never settle a
        payable and is reported separately as JOBCOST_PAID.
        billno itself may hold pur_code OR the supplier's own invoice no - both are
        matched through #PKEY.
     C. THE BILL IS ALREADY NET OF TDS. The purchase itself carries deduction lines
        (TDS, round-off) alongside the charge lines, so:
              gross      = SUM(pur_amount)          -- service + GST lines
              deductions = SUM(pur_deduction)       -- TDS + round off
              NET PAYABLE = gross - deductions      -- what the supplier is actually paid
        Verified against live rows: bill 011082608219029 base 2700 + GST 486, TDS 54
        (= 12.21 + 41.79 line-level TDS_AMT); bill ...28 gross 5522.40 - 94.40 = 5428.00.
        Because TDS is already netted here, the payment voucher's own 'deduction' is NOT
        added to the allocation by default (@INCDED = '0'); set '1' only if the check
        below shows payments carrying a further deduction that clears the bill.

  DEPLOY
     sqlcmd -S <server> -d <db> -i _DB_FIX/PAYABLE_DASHBOARD_SETUP.sql
=====================================================================================*/

/*=====================================================================================
  PREREQUISITE CHECKS - run this block on its own FIRST and read the results.
  Nothing below depends on it; it exists so the assumptions above are verified with
  data rather than hope.
-------------------------------------------------------------------------------------
-- 1. how are pur_date / pur_duedt stored, and how full is the due date?
SELECT c.name, t.name AS DATATYPE, c.max_length
  FROM sys.columns c INNER JOIN sys.types t ON t.user_type_id = c.user_type_id
 WHERE c.object_id = OBJECT_ID('acc_purchase') AND c.name IN ('pur_date','pur_duedt','cmpcode','citycode','pur_supplier','pur_invno')

SELECT TOTAL      = COUNT(*),
       DUE_FILLED = SUM(CASE WHEN LEN(LTRIM(RTRIM(ISNULL(CONVERT(VARCHAR(30), pur_duedt, 120), '')))) >= 8 THEN 1 ELSE 0 END),
       DUE_PCT    = CONVERT(DECIMAL(5,1), SUM(CASE WHEN LEN(LTRIM(RTRIM(ISNULL(CONVERT(VARCHAR(30), pur_duedt, 120), '')))) >= 8 THEN 1.0 ELSE 0 END) * 100 / NULLIF(COUNT(*), 0))
  FROM acc_purchase
 WHERE LTRIM(RTRIM(ISNULL(cmpcode, ''))) = '01'
--    if DUE_PCT is low, the ageing below is mostly "assumed terms" - say so on screen.

-- 2. sample the two date columns so the dd/MM/yyyy vs datetime branch can be eyeballed
SELECT TOP 20 pur_code, RAW_DATE = CONVERT(VARCHAR(30), pur_date, 120), RAW_DUE = CONVERT(VARCHAR(30), pur_duedt, 120)
  FROM acc_purchase ORDER BY pur_code DESC

-- 3. what does billno hold on a PAYMENT voucher - pur_code or the supplier invoice no?
SELECT TOP 30 d.entryno, b.status, d.client, d.billno, d.entrytype, d.amount, d.deduction,
       MATCHES_PURCODE = (SELECT COUNT(*) FROM acc_purchase p WHERE LTRIM(RTRIM(p.pur_code))  = LTRIM(RTRIM(d.billno))),
       MATCHES_INVNO   = (SELECT COUNT(*) FROM acc_purchase p WHERE LTRIM(RTRIM(p.pur_invno)) = LTRIM(RTRIM(d.billno)))
  FROM acc_bankdtls d INNER JOIN acc_bank b ON b.entryno = d.entryno
 WHERE b.status IN ('BP','CP','CE') AND ISNULL(d.billno,'') <> '' AND LTRIM(RTRIM(ISNULL(d.client,''))) LIKE 'S%'
 ORDER BY d.entryno DESC

-- 4a. WHICH ENTRY TYPE CARRIES A SUPPLIER PAYMENT, and is billno filled?
--     Run this on any new customer database BEFORE trusting the payable: this proc
--     settles on "the line names a bill", but if a customer books payments with no
--     billno at all, bill-wise ageing is impossible for them and the payable can only
--     be stated at supplier-balance level. Measured here: PE/filled = 7,798 lines.
SELECT d.entrytype,
       BILLNO_ = CASE WHEN ISNULL(d.billno,'') = '' THEN 'blank' ELSE 'filled' END,
       LINES_  = COUNT(*),
       AMT     = SUM(CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(d.amount)),''),'0')))
  FROM acc_bankdtls d
 INNER JOIN acc_bank b ON b.entryno = d.entryno
 WHERE b.status IN ('BP','CP','CE')
   AND LTRIM(RTRIM(ISNULL(d.client,''))) LIKE 'S%'
 GROUP BY d.entrytype, CASE WHEN ISNULL(d.billno,'') = '' THEN 'blank' ELSE 'filled' END
 ORDER BY 4 DESC

-- 4b. does the payment voucher carry a FURTHER deduction beyond the bill's own TDS?
--    If DED is ~0 the default @INCDED='0' is right; if it is material, investigate
--    what it is before switching @INCDED to '1'.
SELECT TOP 20 BILLNO = LTRIM(RTRIM(d.billno)),
              PAID = SUM(CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(d.amount)),''),'0'))),
              DED  = SUM(CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(d.deduction)),''),'0')))
  FROM acc_bankdtls d
 INNER JOIN acc_bank b ON b.entryno = d.entryno AND b.status IN ('BP','CP','CE')
 WHERE d.entrytype = 'AB' AND ISNULL(d.billno,'') <> ''
 GROUP BY LTRIM(RTRIM(d.billno)) ORDER BY 3 DESC

-- 5. THE BILL ARITHMETIC - gross, deductions (TDS + round off) and the net payable.
--    NET should equal what the Bank Payment screen offers to pay for that bill, and
--    TDS_LINES should equal DEDUCTION where the only deduction is TDS.
--    Reconcile a handful against usp_Acc_Purchase_Register before shipping.
SELECT TOP 20 pd.pur_code,
       LINES     = COUNT(*),
       GROSS     = SUM(CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(pd.pur_amount)),''),'0'))),
       DEDUCTION = SUM(CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(pd.pur_deduction)),''),'0'))),
       TDS_LINES = SUM(CONVERT(FLOAT, ISNULL(pd.TDS_AMT, 0))),
       NET       = SUM(CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(pd.pur_amount)),''),'0')))
                 - SUM(CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(pd.pur_deduction)),''),'0')))
  FROM acc_purchasedtls pd
 GROUP BY pd.pur_code ORDER BY pd.pur_code DESC

-- 5b. supplier name resolution - every open payable should find a master row
SELECT TOP 20 p.pur_supplier, sm.SUP_NAME, sm.SUP_SNAME, g.ACCTNAME
  FROM acc_purchase p
  LEFT JOIN SUPPLIER_MASTER sm ON LTRIM(RTRIM(sm.SUP_CODE)) = LTRIM(RTRIM(p.pur_supplier))
  LEFT JOIN GENACCT_MASTER  g  ON LTRIM(RTRIM(g.ACCTCODE))  = LTRIM(RTRIM(p.pur_supplier))
 GROUP BY p.pur_supplier, sm.SUP_NAME, sm.SUP_SNAME, g.ACCTNAME
 ORDER BY p.pur_supplier DESC
--    if SUP_NAME is blank but SUP_SNAME is filled, the fallback chain already handles it.

-- 6. NET CASH POSITION prerequisite: which GENACCT_MASTER heads are bank / cash?
--    The widget CASH_POSITION stays PENDING until this returns a usable group.
SELECT TOP 100 ACCTCODE, ACCTNAME FROM GENACCT_MASTER
 WHERE ACCTNAME LIKE '%BANK%' OR ACCTNAME LIKE '%CASH%' ORDER BY ACCTNAME
=====================================================================================*/

SET NOCOUNT ON
GO

IF OBJECT_ID('dbo.USP_ACC_RPT_PAYABLE_DASHBOARD') IS NOT NULL
    DROP PROCEDURE dbo.USP_ACC_RPT_PAYABLE_DASHBOARD
GO

CREATE PROCEDURE dbo.USP_ACC_RPT_PAYABLE_DASHBOARD
    /* every parameter defaults, so a null from the API layer degrades gracefully
       instead of failing with "expects parameter, which was not supplied" */
    @FROMDATE     NVARCHAR(15) = NULL,   -- dd/MM/yyyy, period start
    @TODATE       NVARCHAR(15) = NULL,   -- dd/MM/yyyy, period end AND the as-on date
    @CMPCODE      NVARCHAR(2)  = NULL,
    @CITYCODE     NVARCHAR(20) = NULL,   -- CITYCODE1 ('101'), 3-letter ('MUM'), or 'ALL'
    @SUPPLIERCODE NVARCHAR(50) = NULL,   -- blank = all suppliers
    @TOPN         NVARCHAR(10) = NULL,   -- NVARCHAR on purpose: the stack passes strings
    @DEFTERM      NVARCHAR(10) = NULL,   -- assumed credit days when pur_duedt is blank (default 30)
    @LOOKBACK     NVARCHAR(10) = NULL,   -- months of purchase history to load (default 12)
    @INFLOW       NVARCHAR(1)  = NULL,   -- '1' = also compute the RECEIVABLE side for the
                                         -- cash forecast. Default '0': a payables screen
                                         -- does not need A/R, and computing it here
                                         -- doubles the work of the whole proc.
    @INCDED       NVARCHAR(1)  = NULL    -- RETIRED and ignored. 'deduction' is a value
                                         -- column, not optional TDS, so it is ALWAYS
                                         -- counted. The parameter survives only so
                                         -- existing positional callers still bind.
AS
BEGIN
    SET NOCOUNT ON;
    /* ADO.NET connects with ARITHABORT OFF and gets a different cached plan from the
       one this was tuned with in SSMS. Forcing it ON makes the API path match. */
    SET ARITHABORT ON;

    ---------------------------------------------------------------------------------
    -- 0. Normalise parameters
    ---------------------------------------------------------------------------------
    IF LEN(LTRIM(RTRIM(ISNULL(@FROMDATE, '')))) <> 10 OR LEN(LTRIM(RTRIM(ISNULL(@TODATE, '')))) <> 10
    BEGIN
        SELECT '101' AS STATUS, 'FROMDATE and TODATE are required in dd/MM/yyyy format.' AS STATUSMSG
        RETURN
    END

    DECLARE @TOPN_N INT, @DEFTERM_N INT, @INCDED_B BIT
    SET @TOPN_N = CASE WHEN ISNUMERIC(LTRIM(RTRIM(ISNULL(@TOPN, ''))) + '.0e0') = 1
                       THEN CONVERT(INT, CONVERT(FLOAT, LTRIM(RTRIM(@TOPN)))) ELSE 0 END
    IF ISNULL(@TOPN_N, 0) <= 0 SET @TOPN_N = 10
    SET @DEFTERM_N = CASE WHEN ISNUMERIC(LTRIM(RTRIM(ISNULL(@DEFTERM, ''))) + '.0e0') = 1
                          THEN CONVERT(INT, CONVERT(FLOAT, LTRIM(RTRIM(@DEFTERM)))) ELSE 0 END
    IF ISNULL(@DEFTERM_N, 0) <= 0 SET @DEFTERM_N = 30
    SET @INCDED_B     = CASE WHEN ISNULL(@INCDED, '0') = '1' THEN 1 ELSE 0 END
    SET @SUPPLIERCODE = LTRIM(RTRIM(ISNULL(@SUPPLIERCODE, '')))
    SET @CITYCODE     = LTRIM(RTRIM(ISNULL(@CITYCODE,     '')))
    SET @CMPCODE      = LTRIM(RTRIM(ISNULL(@CMPCODE,      '')))

    DECLARE @FROM_YMD CHAR(8), @TO_YMD CHAR(8), @FROMDT DATETIME, @ASON DATETIME, @ALLCITY BIT
    DECLARE @LOOKBACK_N INT, @FLOOR_YMD CHAR(8), @BILLCAP_N INT, @INFLOW_B BIT, @DUP_BILLS INT, @DUE_IGNORED INT
    SET @DUP_BILLS = 0
    SET @DUE_IGNORED = 0
    SET @BILLCAP_N = 2000
    SET @INFLOW_B  = CASE WHEN ISNULL(@INFLOW, '0') = '1' THEN 1 ELSE 0 END
    SET @FROM_YMD = SUBSTRING(@FROMDATE,7,4) + SUBSTRING(@FROMDATE,4,2) + SUBSTRING(@FROMDATE,1,2)
    SET @TO_YMD   = SUBSTRING(@TODATE,  7,4) + SUBSTRING(@TODATE,  4,2) + SUBSTRING(@TODATE,  1,2)

    /* the parameters are length-checked above; make sure they are REAL dates too,
       otherwise the two SETs below throw the same out-of-range error the data guards
       are there to prevent */
    IF ISDATE(@FROM_YMD) <> 1 OR ISDATE(@TO_YMD) <> 1
    BEGIN
        SELECT '101' AS STATUS, 'FROMDATE / TODATE is not a valid calendar date (expected dd/MM/yyyy).' AS STATUSMSG
        RETURN
    END

    SET @FROMDT   = CONVERT(DATETIME, @FROM_YMD, 112)
    SET @ASON     = CONVERT(DATETIME, @TO_YMD,   112)

    /* HISTORY WINDOW. Without this the proc loads every purchase since inception - the
       first run found bills 6,238 days (17 years) old still flagged "open", which is
       dead data, and made the whole proc a full-history scan (13 minutes).
       The floor is measured back from the PERIOD START, not from today, so a report on
       an old period still sees the bills that belong to it.
       Pass @LOOKBACK = '0' to load everything (slow - use only to reconcile). */
    SET @LOOKBACK_N = CASE WHEN ISNUMERIC(LTRIM(RTRIM(ISNULL(@LOOKBACK, ''))) + '.0e0') = 1
                           THEN CONVERT(INT, CONVERT(FLOAT, LTRIM(RTRIM(@LOOKBACK)))) ELSE -1 END
    /* 12 months by default: on this data 95% of payables settle inside 6 months, and a
       shorter window is the single biggest lever on run time. Widen it per call when a
       full reconciliation is needed. */
    IF @LOOKBACK_N < 0 SET @LOOKBACK_N = 12
    SET @FLOOR_YMD = CASE WHEN @LOOKBACK_N = 0 THEN '19000101'
                          ELSE CONVERT(CHAR(8), DATEADD(MONTH, -@LOOKBACK_N, @FROMDT), 112) END
    SET @ALLCITY  = CASE WHEN @CITYCODE = '' OR @CITYCODE = 'ALL' THEN 1 ELSE 0 END

    ---------------------------------------------------------------------------------
    -- 1. Branch scope (identical to the receivable proc: accept CITYCODE1 or the
    --    3-letter code, 'ALL' = consolidated)
    ---------------------------------------------------------------------------------
    /* UNIQUE keys on the working tables: a unique index tells the optimizer each probe
       returns at most one row, which is worth far more than a plain index on a temp
       table. Every one below is provably unique at the point it is declared - see the
       comment on each. Never do this on a table the proc has not deduped first
       (#PINV is keyed only AFTER the duplicate-code collapse). */
    CREATE TABLE #CITY (CITYCODE VARCHAR(10) PRIMARY KEY)   -- SELECT DISTINCT

    IF @ALLCITY = 1
        INSERT INTO #CITY (CITYCODE)
        SELECT DISTINCT LTRIM(RTRIM(citycode)) FROM CITY WHERE ISNULL(citycode,'') <> ''
    ELSE
        INSERT INTO #CITY (CITYCODE)
        SELECT DISTINCT LTRIM(RTRIM(citycode)) FROM CITY
         WHERE LTRIM(RTRIM(ISNULL(citycode1,''))) = @CITYCODE
            OR LTRIM(RTRIM(ISNULL(citycode ,''))) = @CITYCODE


    ---------------------------------------------------------------------------------
    -- #DQ - DATA DISCREPANCIES FOUND WHILE BUILDING THIS REPORT.
    --   The proc has to make a decision every time it meets a bad row (drop it, assume
    --   a term, collapse a duplicate). Making that decision silently teaches nobody.
    --   Every such decision is recorded here with the actual bill number, so the period
    --   report doubles as a correction worklist for the accounts team.
    --   SEVERITY: 1 = the figures on this screen are affected, fix first
    --             2 = a value had to be assumed, the figure is directional
    --             3 = worth knowing, no effect on the totals
    ---------------------------------------------------------------------------------
    CREATE TABLE #DQ
    (
        ISSUE_CODE  VARCHAR(25),
        SEVERITY    TINYINT,
        PUR_CODE    VARCHAR(25),
        PUR_INVNO   VARCHAR(50),
        SUPPLIER    VARCHAR(15),
        SUPNAME     VARCHAR(200),
        BILL_DATE   VARCHAR(20),
        DUE_DATE    VARCHAR(20),
        AMOUNT      FLOAT,
        DETAIL_     VARCHAR(300)
    )

    ---------------------------------------------------------------------------------
    -- 2. #PINV - every supplier bill dated up to @TODATE, in scope.
    --
    --    Date handling: CONVERT(VARCHAR(30), col, 120) renders a DATETIME as
    --    'yyyy-mm-dd hh:mi:ss' and leaves a VARCHAR untouched, so ONE expression
    --    copes with either storage form (this DB stores dates both ways in different
    --    modules and the purchase columns could not be verified from the app code).
    --
    --    On the branch join: rows whose citycode is blank or unknown would silently
    --    vanish on an INNER JOIN. For a consolidated view they are kept (a payable is
    --    a payable); for a single branch they are excluded.
    ---------------------------------------------------------------------------------
    CREATE TABLE #PINV
    (
        PUR_CODE     VARCHAR(25),
        PUR_INVNO    VARCHAR(50),
        PUR_DT       DATETIME,
        DUE_DT       DATETIME,
        HAS_TERMS    BIT,
        SUPPLIER     VARCHAR(15),
        SUPNAME      VARCHAR(200),
        CITYCODE     VARCHAR(10),
        PUR_YMD      CHAR(8),      -- validated yyyymmdd, converted in a later statement
        DUE_YMD      CHAR(8),      -- NULL when the keyed due date is missing or invalid
        GROSSAMT     FLOAT,       -- the bill's value = pur_amount + pur_deduction
        BOTHLINES    INT,         -- lines carrying a value in BOTH columns (rare, flagged)
        DEDUCTION    FLOAT,       -- TDS + round off booked on the bill itself
        TDS_AMT      FLOAT,       -- line-level TDS_AMT (cross-check on DEDUCTION)
        BILLAMT      FLOAT,       -- what the supplier is owed for this bill = GROSSAMT
        IN_PERIOD    BIT
    )

    /* supplier / ledger names keyed on the TRIMMED code, built once. Joined inline as
       LTRIM(RTRIM(code)) = X.SUPPLIER no index could serve the comparison, so both masters
       were scanned once per purchase bill: 7.5 s and 3.5 million reads of an 11.3 s run on
       LinksDB20 (2026-10-21). Same comparison, same rows (no DISTINCT - duplicates kept). */
    SELECT LTRIM(RTRIM(SUP_CODE)) AS SUP_CODE, SUP_NAME, SUP_SNAME INTO #SUPM FROM SUPPLIER_MASTER
    CREATE CLUSTERED INDEX IX_SUPM ON #SUPM (SUP_CODE)
    SELECT LTRIM(RTRIM(ACCTCODE)) AS ACCTCODE, ACCTNAME INTO #GACC FROM GENACCT_MASTER
    CREATE CLUSTERED INDEX IX_GACC ON #GACC (ACCTCODE)

    /* PASS 1 - strings only. Not one CONVERT to DATETIME in this statement, so there is
       nothing for the optimizer to reorder ahead of the validation. */
    INSERT INTO #PINV (PUR_CODE, PUR_INVNO, PUR_YMD, DUE_YMD, HAS_TERMS, SUPPLIER, SUPNAME,
                       CITYCODE, GROSSAMT, DEDUCTION, TDS_AMT, BILLAMT, IN_PERIOD)
    SELECT X.PUR_CODE, X.PUR_INVNO, X.PUR_YMD, X.DUE_YMD,
           CASE WHEN X.DUE_YMD IS NOT NULL THEN 1 ELSE 0 END,
           X.SUPPLIER,
           /* name from the supplier master; ledger name then the bare code as fallbacks */
           LTRIM(RTRIM(ISNULL(NULLIF(LTRIM(RTRIM(ISNULL(sm.SUP_NAME, ''))), ''),
                        ISNULL(NULLIF(LTRIM(RTRIM(ISNULL(sm.SUP_SNAME, ''))), ''),
                        ISNULL(NULLIF(LTRIM(RTRIM(ISNULL(g.ACCTNAME, ''))), ''), X.SUPPLIER))))),
           X.CITYCODE,
           /* amounts are filled by the #PLINE step below. Aggregating acc_purchasedtls
              inline meant GROUPing the ENTIRE detail table before the join - the single
              biggest cost in the first version. */
           0, 0, 0, 0,
           /* period flag stays a STRING compare - no conversion needed */
           CASE WHEN X.PUR_YMD >= @FROM_YMD AND X.PUR_YMD <= @TO_YMD THEN 1 ELSE 0 END
      FROM (
            SELECT PUR_CODE  = LTRIM(RTRIM(p.pur_code)),
                   PUR_INVNO = LTRIM(RTRIM(ISNULL(p.pur_invno, ''))),
                   SUPPLIER  = LTRIM(RTRIM(ISNULL(p.pur_supplier, ''))),
                   CITYCODE  = LTRIM(RTRIM(ISNULL(p.citycode, ''))),
                   D.PUR_YMD, D.DUE_YMD
              FROM acc_purchase p
             CROSS APPLY (
                    SELECT RAW_D = LTRIM(RTRIM(ISNULL(CONVERT(VARCHAR(30), p.pur_date,  120), ''))),
                           RAW_U = LTRIM(RTRIM(ISNULL(CONVERT(VARCHAR(30), p.pur_duedt, 120), '')))
                   ) R
             CROSS APPLY (
                    SELECT PUR_YMD =
                             CASE WHEN LEN(R.RAW_D) = 10 AND SUBSTRING(R.RAW_D,3,1) = '/'
                                       THEN SUBSTRING(R.RAW_D,7,4)+SUBSTRING(R.RAW_D,4,2)+SUBSTRING(R.RAW_D,1,2)
                                  WHEN LEN(R.RAW_D) >= 10 AND SUBSTRING(R.RAW_D,5,1) = '-'
                                       THEN SUBSTRING(R.RAW_D,1,4)+SUBSTRING(R.RAW_D,6,2)+SUBSTRING(R.RAW_D,9,2)
                                  ELSE NULL END,
                           DUE_YMD =
                             CASE WHEN LEN(R.RAW_U) = 10 AND SUBSTRING(R.RAW_U,3,1) = '/'
                                       THEN SUBSTRING(R.RAW_U,7,4)+SUBSTRING(R.RAW_U,4,2)+SUBSTRING(R.RAW_U,1,2)
                                  WHEN LEN(R.RAW_U) >= 10 AND SUBSTRING(R.RAW_U,5,1) = '-'
                                       THEN SUBSTRING(R.RAW_U,1,4)+SUBSTRING(R.RAW_U,6,2)+SUBSTRING(R.RAW_U,9,2)
                                  ELSE NULL END
                   ) D0
             /* second pass over the built strings: keep only REAL calendar dates.
                A LIKE mask alone would still admit 20260231 - ISDATE on a yyyymmdd
                string rejects it, and here it is safe because this statement performs
                no date conversion at all. */
             CROSS APPLY (
                    SELECT PUR_YMD = CASE WHEN D0.PUR_YMD LIKE '[12][0-9][0-9][0-9][01][0-9][0-3][0-9]'
                                           AND ISDATE(D0.PUR_YMD) = 1 THEN D0.PUR_YMD END,
                           DUE_YMD = CASE WHEN D0.DUE_YMD LIKE '[12][0-9][0-9][0-9][01][0-9][0-3][0-9]'
                                           AND ISDATE(D0.DUE_YMD) = 1 THEN D0.DUE_YMD END
                   ) D
             WHERE LTRIM(RTRIM(ISNULL(p.cmpcode, ''))) = @CMPCODE
               AND D.PUR_YMD IS NOT NULL
               AND D.PUR_YMD <= @TO_YMD
               AND D.PUR_YMD >= @FLOOR_YMD          -- history window, see @LOOKBACK
               AND LTRIM(RTRIM(ISNULL(p.pur_supplier, ''))) <> ''
               AND (@SUPPLIERCODE = '' OR LTRIM(RTRIM(p.pur_supplier)) = @SUPPLIERCODE)
           ) X
      LEFT JOIN #CITY c ON c.CITYCODE = X.CITYCODE
      LEFT JOIN #SUPM sm ON sm.SUP_CODE = X.SUPPLIER
      LEFT JOIN #GACC g  ON g.ACCTCODE  = X.SUPPLIER
     WHERE (@ALLCITY = 1 OR c.CITYCODE IS NOT NULL)

    /* bills whose date cannot be read at all: they were never loaded above, because a
       row with no date cannot be aged or placed in a period. Captured separately (and
       capped) so they are visible instead of just missing. */
    INSERT INTO #DQ (ISSUE_CODE, SEVERITY, PUR_CODE, PUR_INVNO, SUPPLIER, BILL_DATE, DUE_DATE, AMOUNT, DETAIL_)
    SELECT TOP 200 'BILL_DATE_UNREADABLE', 1,
           LTRIM(RTRIM(p.pur_code)), LTRIM(RTRIM(ISNULL(p.pur_invno, ''))),
           LTRIM(RTRIM(ISNULL(p.pur_supplier, ''))),
           LTRIM(RTRIM(ISNULL(CONVERT(VARCHAR(30), p.pur_date,  120), ''))),
           LTRIM(RTRIM(ISNULL(CONVERT(VARCHAR(30), p.pur_duedt, 120), ''))),
           NULL,
           'Bill date is not a readable dd/MM/yyyy date, so this bill is EXCLUDED from '
           + 'the payable and from every ageing bucket. Correct the date on the purchase entry.'
      FROM acc_purchase p
     CROSS APPLY (SELECT RAW_D = LTRIM(RTRIM(ISNULL(CONVERT(VARCHAR(30), p.pur_date, 120), '')))) R
     CROSS APPLY (SELECT YMD = CASE WHEN LEN(R.RAW_D) = 10 AND SUBSTRING(R.RAW_D,3,1) = '/'
                                    THEN SUBSTRING(R.RAW_D,7,4)+SUBSTRING(R.RAW_D,4,2)+SUBSTRING(R.RAW_D,1,2)
                               WHEN LEN(R.RAW_D) >= 10 AND SUBSTRING(R.RAW_D,5,1) = '-'
                                    THEN SUBSTRING(R.RAW_D,1,4)+SUBSTRING(R.RAW_D,6,2)+SUBSTRING(R.RAW_D,9,2) END) D
     WHERE LTRIM(RTRIM(ISNULL(p.cmpcode, ''))) = @CMPCODE
       AND LTRIM(RTRIM(ISNULL(p.pur_supplier, ''))) <> ''
       AND (D.YMD IS NULL OR ISDATE(D.YMD) = 0)

    /*-----------------------------------------------------------------------------
      DUPLICATE BILL CODES. acc_purchase.pur_code is NOT unique (proved by a PK
      violation when keying a table on it). Left alone this DOUBLE COUNTS the payable:
      each duplicate header row gets the same #PLINE bill total joined to it.
      One row per code is kept - the latest bill date - and the number collapsed is
      returned as DUPLICATE_BILL_CODES so the distortion is reported, not hidden.
      If that number is material, the source rows need investigating: the real key may
      be cmpcode + citycode + pur_code, in which case this proc must be re-scoped.
    -----------------------------------------------------------------------------*/
    INSERT INTO #DQ (ISSUE_CODE, SEVERITY, PUR_CODE, PUR_INVNO, SUPPLIER, SUPNAME, BILL_DATE, AMOUNT, DETAIL_)
    SELECT TOP 200 'DUPLICATE_BILL_CODE', 1, PUR_CODE, PUR_INVNO, SUPPLIER, SUPNAME, PUR_YMD, NULL,
           'This purchase code appears on more than one header row. Only one is counted, '
           + 'otherwise the same bill value would be added twice to the payable. '
           + 'Check whether these are two different bills sharing a code.'
      FROM #PINV
     WHERE PUR_CODE IN (SELECT PUR_CODE FROM #PINV GROUP BY PUR_CODE HAVING COUNT(*) > 1)

    ;WITH D AS (
        SELECT RN = ROW_NUMBER() OVER (PARTITION BY PUR_CODE
                                       ORDER BY PUR_YMD DESC, PUR_INVNO DESC, SUPPLIER)
          FROM #PINV
    )
    DELETE FROM D WHERE RN > 1
    SET @DUP_BILLS = @@ROWCOUNT

    /* PASS 2 - now every PUR_YMD / DUE_YMD in the table is known to be a real date,
       so these conversions cannot fail. Bills with no usable due date fall back to
       bill date + @DEFTERM and were already flagged HAS_TERMS = 0 above. */
    UPDATE #PINV SET PUR_DT = CONVERT(DATETIME, PUR_YMD, 112)

    /*-----------------------------------------------------------------------------
      IS THE KEYED DUE DATE CREDIBLE? Live data says often not: bills dated 29/07/2025
      carry pur_duedt = 07/10/2024 - due TEN MONTHS BEFORE the bill exists. Trusting
      those makes a bill look 631 days overdue when it is 336 days old, and inflates
      both the overdue KPI and the cash-forecast "already overdue" bucket.
      Same rule the receivable proc applies to client credit terms: a due date counts
      only when it falls 0..180 days AFTER the bill date. Anything else falls back to
      bill date + @DEFTERM and is flagged HAS_TERMS = 0, so the screen can say the
      ageing is assumed rather than agreed. The count is returned as DUEDATE_IGNORED.
    -----------------------------------------------------------------------------*/
    UPDATE #PINV
       SET DUE_DT = CASE WHEN DUE_OK = 1 THEN CONVERT(DATETIME, DUE_YMD, 112)
                         ELSE DATEADD(DAY, @DEFTERM_N, PUR_DT) END,
           HAS_TERMS = DUE_OK
      FROM (SELECT PUR_CODE, DUE_OK = CASE WHEN DUE_YMD IS NOT NULL
                                            AND CONVERT(DATETIME, DUE_YMD, 112) >= PUR_DT
                                            AND DATEDIFF(DAY, PUR_DT, CONVERT(DATETIME, DUE_YMD, 112)) <= 180
                                           THEN 1 ELSE 0 END
              FROM #PINV) V
     WHERE V.PUR_CODE = #PINV.PUR_CODE

    SELECT @DUE_IGNORED = COUNT(*) FROM #PINV WHERE DUE_YMD IS NOT NULL AND HAS_TERMS = 0

    /* due-date problems, only for bills RAISED IN THE SELECTED PERIOD - that is the
       window the user is looking at and the one they can still act on */
    INSERT INTO #DQ (ISSUE_CODE, SEVERITY, PUR_CODE, PUR_INVNO, SUPPLIER, SUPNAME, BILL_DATE, DUE_DATE, AMOUNT, DETAIL_)
    SELECT TOP 300
           CASE WHEN CONVERT(DATETIME, DUE_YMD, 112) < PUR_DT THEN 'DUE_BEFORE_BILL'
                ELSE 'DUE_TOO_FAR' END,
           2, PUR_CODE, PUR_INVNO, SUPPLIER, SUPNAME,
           CONVERT(VARCHAR(10), PUR_DT, 103),
           CONVERT(VARCHAR(10), CONVERT(DATETIME, DUE_YMD, 112), 103),
           BILLAMT,
           CASE WHEN CONVERT(DATETIME, DUE_YMD, 112) < PUR_DT
                THEN 'Due date is BEFORE the bill date ('
                     + CONVERT(VARCHAR(10), DATEDIFF(DAY, CONVERT(DATETIME, DUE_YMD, 112), PUR_DT))
                     + ' days earlier). Ignored; the bill is aged on bill date + assumed terms instead.'
                ELSE 'Due date is '
                     + CONVERT(VARCHAR(10), DATEDIFF(DAY, PUR_DT, CONVERT(DATETIME, DUE_YMD, 112)))
                     + ' days after the bill - beyond any credit term we recognise (180). '
                     + 'Ignored; bill date + assumed terms used instead.' END
      FROM #PINV
     WHERE IN_PERIOD = 1 AND DUE_YMD IS NOT NULL AND HAS_TERMS = 0

    INSERT INTO #DQ (ISSUE_CODE, SEVERITY, PUR_CODE, PUR_INVNO, SUPPLIER, SUPNAME, BILL_DATE, AMOUNT, DETAIL_)
    SELECT TOP 300 'DUE_DATE_MISSING', 2, PUR_CODE, PUR_INVNO, SUPPLIER, SUPNAME,
           CONVERT(VARCHAR(10), PUR_DT, 103), BILLAMT,
           'No due date on the bill. Aged on bill date + ' + CONVERT(VARCHAR(10), @DEFTERM_N)
           + ' days, so its overdue status is an assumption, not the agreed term.'
      FROM #PINV
     WHERE IN_PERIOD = 1 AND DUE_YMD IS NULL

    /* a bill with no value at all */
    INSERT INTO #DQ (ISSUE_CODE, SEVERITY, PUR_CODE, PUR_INVNO, SUPPLIER, SUPNAME, BILL_DATE, AMOUNT, DETAIL_)
    SELECT TOP 200 'BILL_VALUE_ZERO', 3, PUR_CODE, PUR_INVNO, SUPPLIER, SUPNAME,
           CONVERT(VARCHAR(10), PUR_DT, 103), BILLAMT,
           'Bill carries no net value. Either the charge lines were never entered, or the '
           + 'deductions cancel the bill exactly.'
      FROM #PINV
     WHERE IN_PERIOD = 1 AND ABS(BILLAMT) <= 0.01

    /* supplier code with no row in the supplier master */
    INSERT INTO #DQ (ISSUE_CODE, SEVERITY, PUR_CODE, PUR_INVNO, SUPPLIER, SUPNAME, BILL_DATE, AMOUNT, DETAIL_)
    SELECT TOP 200 'SUPPLIER_NOT_IN_MASTER', 3, v.PUR_CODE, v.PUR_INVNO, v.SUPPLIER, v.SUPNAME,
           CONVERT(VARCHAR(10), v.PUR_DT, 103), v.BILLAMT,
           'This supplier code has no row in SUPPLIER_MASTER, so the report can only show the code.'
      FROM #PINV v
     WHERE v.IN_PERIOD = 1
       AND NOT EXISTS (SELECT 1 FROM #SUPM sm WHERE sm.SUP_CODE = v.SUPPLIER)

    /* UNIQUE is safe here and only here: the duplicate-code collapse ran above. If it
       ever throws, duplicates survived the dedupe and the payable is double counted -
       a loud failure is the right outcome. */
    CREATE UNIQUE CLUSTERED INDEX IX_PINV ON #PINV (PUR_CODE)

    ---------------------------------------------------------------------------------
    -- 2b. #PLINE - bill amounts, aggregated ONLY for the bills actually loaded.
    --     The join is written as pd.pur_code = v.PUR_CODE (no LTRIM on the base table)
    --     so it can seek: SQL Server ignores TRAILING spaces in a varchar '=' compare,
    --     which is the only padding these codes carry.
    ---------------------------------------------------------------------------------
    /* pur_amount and pur_deduction are TWO VALUE COLUMNS, not value-and-TDS. Measured
       over all 17,06,357 detail lines: 14,38,023 carry a value in pur_amount only,
       2,66,441 in pur_deduction only, and just 27 carry both. A bill's value is
       therefore amount + deduction, NOT amount - deduction. TDS has its own column
       (TDS_AMT). Subtracting the deduction column understated the payable by the whole
       of that Rs 136.8 Cr and made such bills look massively over-paid - see the
       LINE_AMOUNT_AND_DEDUCTION and PAID_MORE_THAN_BILL checks. */
    CREATE TABLE #PLINE (PUR_CODE VARCHAR(25), GROSSTOTAL FLOAT, DEDTOTAL FLOAT, TDSTOTAL FLOAT,
                         BOTHLINES INT)

    INSERT INTO #PLINE (PUR_CODE, GROSSTOTAL, DEDTOTAL, TDSTOTAL, BOTHLINES)
    SELECT v.PUR_CODE,
           SUM(CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(pd.pur_amount)),    ''), '0'))),
           SUM(CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(pd.pur_deduction)), ''), '0'))),
           SUM(CONVERT(FLOAT, ISNULL(pd.TDS_AMT, 0))),
           SUM(CASE WHEN CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(pd.pur_amount)),    ''), '0')) <> 0
                     AND CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(pd.pur_deduction)), ''), '0')) <> 0
                    THEN 1 ELSE 0 END)
      FROM acc_purchasedtls pd
     INNER JOIN #PINV v ON v.PUR_CODE = pd.pur_code
     GROUP BY v.PUR_CODE

    CREATE UNIQUE CLUSTERED INDEX IX_PLINE ON #PLINE (PUR_CODE)      -- GROUP BY PUR_CODE

    UPDATE v
       SET GROSSAMT  = ISNULL(l.GROSSTOTAL, 0) + ISNULL(l.DEDTOTAL, 0),
           DEDUCTION = ISNULL(l.DEDTOTAL, 0),      -- kept for visibility, NOT subtracted
           TDS_AMT   = ISNULL(l.TDSTOTAL, 0),
           BOTHLINES = ISNULL(l.BOTHLINES, 0),
           BILLAMT   = ISNULL(l.GROSSTOTAL, 0) + ISNULL(l.DEDTOTAL, 0)
      FROM #PINV v INNER JOIN #PLINE l ON l.PUR_CODE = v.PUR_CODE

    CREATE NONCLUSTERED INDEX IX_PINV_SUP ON #PINV (SUPPLIER)

    ---------------------------------------------------------------------------------
    -- 3. #PKEY - both keys a payment could quote, mapped back to the bill.
    --    Materialised once so the settlement join stays a single equi-join instead of
    --    an OR predicate (which would scan acc_bankdtls for every bill).
    ---------------------------------------------------------------------------------
    CREATE TABLE #PKEY (KEYVAL VARCHAR(50), PUR_CODE VARCHAR(25))

    INSERT INTO #PKEY (KEYVAL, PUR_CODE) SELECT PUR_CODE, PUR_CODE FROM #PINV

    /* The supplier's own invoice number is only usable as a key when it is UNIQUE and
       does not collide with a pur_code. Two bills sharing one supplier invoice no
       cannot be attributed, so they are left out rather than double counted - a
       payment against such a bill simply shows as unallocated (visible as an advance
       in #PADV), which is the honest outcome. */
    INSERT INTO #PKEY (KEYVAL, PUR_CODE)
    SELECT v.PUR_INVNO, MIN(v.PUR_CODE)
      FROM #PINV v
     WHERE v.PUR_INVNO <> '' AND v.PUR_INVNO <> v.PUR_CODE
       AND NOT EXISTS (SELECT 1 FROM #PKEY k WHERE k.KEYVAL = v.PUR_INVNO)
     GROUP BY v.PUR_INVNO
    HAVING COUNT(*) = 1

    CREATE UNIQUE CLUSTERED INDEX IX_PKEY ON #PKEY (KEYVAL)          -- NOT EXISTS + HAVING COUNT(*) = 1

    ---------------------------------------------------------------------------------
    -- 4. #PSETTLE - what has been paid against each bill, up to @TODATE.
    --      a) bank / cash payments  : acc_bank.status IN ('BP','CP','CE'), entrytype 'AB'
    --      b) JV adjustments        : acc_JournalVoucDtls.entrytype 'AB' -> jv_InvoiceNo
    --    acc_bankdtls.amount and .deduction are the same two-value-column pair as on
    --    the purchase side: 6,38,488 bill-bearing lines use 'amount', 26,606 use
    --    'deduction', 3 use both. Allocation is therefore amount + deduction. The old
    --    @INCDED switch (which treated 'deduction' as optional TDS) is retired: leaving
    --    it off dropped 26,606 real payments and made those bills look unpaid.
    ---------------------------------------------------------------------------------
    CREATE TABLE #PSETTLE (PUR_CODE VARCHAR(25), ALLOC FLOAT, CASHPAID FLOAT, TDSDED FLOAT, LASTDT DATETIME)

    /* Materialise ONLY the voucher lines that name a bill we hold, using EXISTS against
       the indexed #PKEY, before any aggregation. Joining the full bank/JV set to #PKEY
       after building a derived table made SQL Server read every payment line ever
       entered; this filters at the source instead. */
    CREATE TABLE #PAYLINE (BILLNO VARCHAR(50), AMT FLOAT, DED FLOAT, DT DATETIME)

    INSERT INTO #PAYLINE (BILLNO, AMT, DED, DT)
    SELECT Z.BILLNO, Z.AMT, Z.DED, Z.DT
      FROM (
            SELECT BILLNO = LTRIM(RTRIM(d.billno)),
                   AMT    = CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(d.amount)),    ''), '0')),
                   DED    = CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(d.deduction)), ''), '0')),
                   /* same dirty-date guard: CASE returns NULL rather than throwing */
                   DT     = CASE WHEN ISDATE(SUBSTRING(b.entrydt,7,4)+SUBSTRING(b.entrydt,4,2)+SUBSTRING(b.entrydt,1,2)) = 1
                                 THEN CONVERT(DATETIME, SUBSTRING(b.entrydt,7,4)+SUBSTRING(b.entrydt,4,2)+SUBSTRING(b.entrydt,1,2), 112) END
              FROM acc_bankdtls d
             INNER JOIN acc_bank b ON b.entryno = d.entryno
             /* NOT entrytype = 'AB': on this ERP supplier payments are 'PE'. Any line
                that names a bill on a payment voucher settles that bill. */
             WHERE b.status IN ('BP', 'CP', 'CE')
               AND ISNULL(d.billno, '') <> ''
               /* SARGABLE: probe the indexed temp table instead of joining later */
               AND EXISTS (SELECT 1 FROM #PKEY k WHERE k.KEYVAL = d.billno)
               AND LEN(ISNULL(b.entrydt, '')) = 10
               AND SUBSTRING(b.entrydt,7,4)+SUBSTRING(b.entrydt,4,2)+SUBSTRING(b.entrydt,1,2) <= @TO_YMD
               /* a payment older than the oldest loaded bill cannot settle one */
               AND SUBSTRING(b.entrydt,7,4)+SUBSTRING(b.entrydt,4,2)+SUBSTRING(b.entrydt,1,2) >= @FLOOR_YMD

            UNION ALL

            SELECT LTRIM(RTRIM(jd.jv_InvoiceNo)),
                   CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(jd.jv_debit)), ''), '0')),
                   0,
                   CASE WHEN ISDATE(SUBSTRING(jh.jv_date,7,4)+SUBSTRING(jh.jv_date,4,2)+SUBSTRING(jh.jv_date,1,2)) = 1
                        THEN CONVERT(DATETIME, SUBSTRING(jh.jv_date,7,4)+SUBSTRING(jh.jv_date,4,2)+SUBSTRING(jh.jv_date,1,2), 112) END
              FROM acc_JournalVoucDtls jd
             INNER JOIN acc_JournalVouc jh ON jh.jvcode = jd.jvcode
             /* same rule as the bank leg: a JV line that NAMES a purchase bill settles
                it. #PKEY holds only purchase keys, so client invoice numbers referenced
                in other JVs cannot match here. */
             WHERE ISNULL(jd.jv_InvoiceNo, '') <> ''
               AND EXISTS (SELECT 1 FROM #PKEY k WHERE k.KEYVAL = jd.jv_InvoiceNo)
               AND LEN(ISNULL(jh.jv_date, '')) = 10
               AND SUBSTRING(jh.jv_date,7,4)+SUBSTRING(jh.jv_date,4,2)+SUBSTRING(jh.jv_date,1,2) <= @TO_YMD
               AND SUBSTRING(jh.jv_date,7,4)+SUBSTRING(jh.jv_date,4,2)+SUBSTRING(jh.jv_date,1,2) >= @FLOOR_YMD
           ) Z

    CREATE CLUSTERED INDEX IX_PAYLINE ON #PAYLINE (BILLNO)

    /* now the grouping runs over a few thousand rows instead of the whole ledger */
    INSERT INTO #PSETTLE (PUR_CODE, ALLOC, CASHPAID, TDSDED, LASTDT)
    SELECT k.PUR_CODE,
           SUM(z.AMT) + SUM(z.DED),
           SUM(z.AMT) + SUM(z.DED), SUM(z.DED), MAX(z.DT)
      FROM #PAYLINE z
     INNER JOIN #PKEY k ON k.KEYVAL = z.BILLNO
     GROUP BY k.PUR_CODE

    CREATE UNIQUE CLUSTERED INDEX IX_PSETTLE ON #PSETTLE (PUR_CODE)  -- GROUP BY PUR_CODE

    ---------------------------------------------------------------------------------
    -- 5. #POPEN - unpaid supplier bills as on @TODATE (this is the payable)
    ---------------------------------------------------------------------------------
    CREATE TABLE #POPEN
    (
        PUR_CODE     VARCHAR(25),
        SUPPLIER     VARCHAR(15),
        PUR_DT       DATETIME,
        DUE_DT       DATETIME,
        PENDING      FLOAT,
        PENDING_DAYS INT,
        OVERDUE_DAYS INT
    )

    INSERT INTO #POPEN (PUR_CODE, SUPPLIER, PUR_DT, DUE_DT, PENDING, PENDING_DAYS, OVERDUE_DAYS)
    SELECT v.PUR_CODE, v.SUPPLIER, v.PUR_DT, v.DUE_DT,
           v.BILLAMT - ISNULL(s.ALLOC, 0),
           DATEDIFF(DAY, v.PUR_DT, @ASON),
           DATEDIFF(DAY, v.DUE_DT, @ASON)
      FROM #PINV v
      LEFT JOIN #PSETTLE s ON s.PUR_CODE = v.PUR_CODE
     WHERE v.BILLAMT - ISNULL(s.ALLOC, 0) > 0.01

    CREATE CLUSTERED INDEX IX_POPEN ON #POPEN (SUPPLIER)
    /* one row per bill (built from the deduped #PINV); Table5 joins it back on PUR_CODE */
    CREATE UNIQUE NONCLUSTERED INDEX IX_POPEN_CODE ON #POPEN (PUR_CODE)

    ---------------------------------------------------------------------------------
    -- 6. #PADV - money paid to a supplier that names no bill (advances / on-account).
    --    Exactly the mirror of #UNADJ on the receivable side, and just as important:
    --    without it the payable is overstated for every supplier we pay on account.
    ---------------------------------------------------------------------------------
    CREATE TABLE #PADV (SUPPLIER VARCHAR(15), UNADJUSTED FLOAT)

    INSERT INTO #PADV (SUPPLIER, UNADJUSTED)
    SELECT Z.SUPPLIER, SUM(Z.AMT)
      FROM (
            SELECT SUPPLIER = LTRIM(RTRIM(d.client)),
                   AMT      = CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(d.amount)),    ''), '0'))
                            + CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(d.deduction)), ''), '0'))
              FROM acc_bankdtls d
             INNER JOIN acc_bank b ON b.entryno = d.entryno
             INNER JOIN #CITY ct ON ct.CITYCODE = LTRIM(RTRIM(b.citycode))
             /* unapplied = the line names NO bill. 'JB' is excluded on purpose: it is
                cost booked directly to a job with no purchase bill behind it, so it can
                never settle a payable - counting it here would understate what we owe. */
             WHERE b.status IN ('BP', 'CP', 'CE')
               AND ISNULL(d.billno, '') = ''
               AND ISNULL(d.entrytype, '') <> 'JB'
               AND LTRIM(RTRIM(ISNULL(d.client, ''))) LIKE 'S%'
               AND SUBSTRING(d.entryno, 1, 2) = @CMPCODE
               AND LEN(ISNULL(b.entrydt, '')) = 10
               AND SUBSTRING(b.entrydt,7,4)+SUBSTRING(b.entrydt,4,2)+SUBSTRING(b.entrydt,1,2) <= @TO_YMD
               AND SUBSTRING(b.entrydt,7,4)+SUBSTRING(b.entrydt,4,2)+SUBSTRING(b.entrydt,1,2) >= @FLOOR_YMD
               AND (@SUPPLIERCODE = '' OR LTRIM(RTRIM(d.client)) = @SUPPLIERCODE)

            UNION ALL

            -- paid beyond the face value of a bill is an advance too
            SELECT v.SUPPLIER, s.ALLOC - v.BILLAMT
              FROM #PINV v
             INNER JOIN #PSETTLE s ON s.PUR_CODE = v.PUR_CODE
             WHERE s.ALLOC - v.BILLAMT > 0.01
           ) Z
     GROUP BY Z.SUPPLIER

    CREATE UNIQUE CLUSTERED INDEX IX_PADV ON #PADV (SUPPLIER)        -- GROUP BY SUPPLIER

    /* paid more than the bill is worth - either a wrong knock-off or a genuine advance
       sitting against the bill */
    INSERT INTO #DQ (ISSUE_CODE, SEVERITY, PUR_CODE, PUR_INVNO, SUPPLIER, SUPNAME, BILL_DATE, AMOUNT, DETAIL_)
    SELECT TOP 200 'PAID_MORE_THAN_BILL', 1, v.PUR_CODE, v.PUR_INVNO, v.SUPPLIER, v.SUPNAME,
           CONVERT(VARCHAR(10), v.PUR_DT, 103), s.ALLOC - v.BILLAMT,
           'Payments against this bill exceed its net value by '
           + CONVERT(VARCHAR(30), CONVERT(DECIMAL(18,2), s.ALLOC - v.BILLAMT))
           + '. Treated as an advance to the supplier; check the knock-off.'
      FROM #PINV v
     INNER JOIN #PSETTLE s ON s.PUR_CODE = v.PUR_CODE
     WHERE s.ALLOC - v.BILLAMT > 0.01

    ---------------------------------------------------------------------------------
    -- 7. #DPO - how long we actually take to pay, value weighted, period bound.
    --    Mirror of #COLL: bills raised in the period that have since been settled.
    ---------------------------------------------------------------------------------
    CREATE TABLE #DPOX (PUR_CODE VARCHAR(25), SUPPLIER VARCHAR(15), DAYS INT, ALLOC FLOAT)
    INSERT INTO #DPOX (PUR_CODE, SUPPLIER, DAYS, ALLOC)
    SELECT v.PUR_CODE, v.SUPPLIER, DATEDIFF(DAY, v.PUR_DT, s.LASTDT), s.ALLOC
      FROM #PINV v
     INNER JOIN #PSETTLE s ON s.PUR_CODE = v.PUR_CODE
     WHERE v.IN_PERIOD = 1 AND s.LASTDT IS NOT NULL AND s.ALLOC > 0.01

    CREATE TABLE #DPO (SUPPLIER VARCHAR(15), BILLS INT, PAID_AMT FLOAT, DAYS_WTD FLOAT, MIN_DAYS INT, MAX_DAYS INT)
    INSERT INTO #DPO (SUPPLIER, BILLS, PAID_AMT, DAYS_WTD, MIN_DAYS, MAX_DAYS)
    SELECT x.SUPPLIER, COUNT(*), SUM(x.ALLOC),
           CASE WHEN SUM(x.ALLOC) <> 0 THEN SUM(x.DAYS * x.ALLOC) / SUM(x.ALLOC) END,
           MIN(x.DAYS), MAX(x.DAYS)
      FROM #DPOX x GROUP BY x.SUPPLIER

    CREATE UNIQUE CLUSTERED INDEX IX_DPO ON #DPO (SUPPLIER)          -- GROUP BY SUPPLIER

    ---------------------------------------------------------------------------------
    -- 8. #SUPP - one row per supplier: gross, advances, net payable, overdue, ageing
    ---------------------------------------------------------------------------------
    CREATE TABLE #SUPP
    (
        SUPPLIER    VARCHAR(15),
        SUPNAME     VARCHAR(200),
        GROSS_DUE   FLOAT,
        ADVANCE     FLOAT,
        PAYABLE     FLOAT,
        OVERDUE     FLOAT,
        BILLS_OPEN  INT,
        OLDEST_DAYS INT,
        B1 FLOAT, B2 FLOAT, B3 FLOAT, B4 FLOAT, B5 FLOAT,
        DUE_7 FLOAT, DUE_15 FLOAT, DUE_30 FLOAT,
        PURCHASED   FLOAT,       -- NET of TDS, in the period
        GROSSBILLED FLOAT,       -- gross bill value in the period
        TDS_DED     FLOAT,       -- TDS + round off deducted on the bills
        PAID        FLOAT,
        DAYS_WTD    FLOAT,
        HAS_TERMS   BIT
    )

    INSERT INTO #SUPP (SUPPLIER, SUPNAME, GROSS_DUE, ADVANCE, PAYABLE, OVERDUE, BILLS_OPEN, OLDEST_DAYS,
                       B1, B2, B3, B4, B5, DUE_7, DUE_15, DUE_30, PURCHASED, GROSSBILLED, TDS_DED,
                       PAID, DAYS_WTD, HAS_TERMS)
    SELECT A.SUPPLIER,
           LTRIM(RTRIM(ISNULL(NULLIF(LTRIM(RTRIM(ISNULL(sm.SUP_NAME, ''))), ''),
                        ISNULL(NULLIF(LTRIM(RTRIM(ISNULL(sm.SUP_SNAME, ''))), ''),
                        ISNULL(NULLIF(LTRIM(RTRIM(ISNULL(g.ACCTNAME, ''))), ''), A.SUPNAME))))),
           A.GROSS_DUE,
           ISNULL(ad.UNADJUSTED, 0),
           /* net payable, floored at zero so one supplier's advance cannot net off
              against another supplier in the portfolio total (same rule as the
              receivable side) */
           CASE WHEN A.GROSS_DUE - ISNULL(ad.UNADJUSTED, 0) > 0
                THEN A.GROSS_DUE - ISNULL(ad.UNADJUSTED, 0) ELSE 0 END,
           CASE WHEN A.OVERDUE - ISNULL(ad.UNADJUSTED, 0) > 0
                THEN A.OVERDUE - ISNULL(ad.UNADJUSTED, 0) ELSE 0 END,
           A.BILLS_OPEN, A.OLDEST_DAYS,
           A.B1, A.B2, A.B3, A.B4, A.B5,
           A.DUE_7, A.DUE_15, A.DUE_30,
           A.PURCHASED, A.GROSSBILLED, A.TDS_DED, ISNULL(pd.PAID, 0), dp.DAYS_WTD, A.HAS_TERMS
      FROM (
            SELECT v.SUPPLIER,
                   SUPNAME     = MAX(v.SUPNAME),
                   HAS_TERMS   = MAX(CONVERT(INT, v.HAS_TERMS)),
                   GROSS_DUE   = SUM(CASE WHEN o.PENDING IS NOT NULL THEN o.PENDING ELSE 0 END),
                   OVERDUE     = SUM(CASE WHEN o.OVERDUE_DAYS > 0 THEN o.PENDING ELSE 0 END),
                   BILLS_OPEN  = SUM(CASE WHEN o.PENDING IS NOT NULL THEN 1 ELSE 0 END),
                   OLDEST_DAYS = MAX(o.PENDING_DAYS),
                   /* ageing on the AGE of the bill, same buckets the accounts team
                      already reads on the receivable side (0-30 ... 180+) */
                   B1 = SUM(CASE WHEN o.PENDING_DAYS BETWEEN 0   AND 30  THEN o.PENDING ELSE 0 END),
                   B2 = SUM(CASE WHEN o.PENDING_DAYS BETWEEN 31  AND 60  THEN o.PENDING ELSE 0 END),
                   B3 = SUM(CASE WHEN o.PENDING_DAYS BETWEEN 61  AND 90  THEN o.PENDING ELSE 0 END),
                   B4 = SUM(CASE WHEN o.PENDING_DAYS BETWEEN 91  AND 180 THEN o.PENDING ELSE 0 END),
                   B5 = SUM(CASE WHEN o.PENDING_DAYS > 180                THEN o.PENDING ELSE 0 END),
                   /* forward view: what falls due inside the next 7 / 15 / 30 days
                      (already-overdue money is NOT counted here - it sits in OVERDUE) */
                   DUE_7  = SUM(CASE WHEN o.OVERDUE_DAYS BETWEEN -7  AND 0 THEN o.PENDING ELSE 0 END),
                   DUE_15 = SUM(CASE WHEN o.OVERDUE_DAYS BETWEEN -15 AND 0 THEN o.PENDING ELSE 0 END),
                   DUE_30 = SUM(CASE WHEN o.OVERDUE_DAYS BETWEEN -30 AND 0 THEN o.PENDING ELSE 0 END),
                   PURCHASED   = SUM(CASE WHEN v.IN_PERIOD = 1 THEN v.BILLAMT - v.TDS_AMT ELSE 0 END),
                   GROSSBILLED = SUM(CASE WHEN v.IN_PERIOD = 1 THEN v.GROSSAMT ELSE 0 END),
                   /* TDS comes from TDS_AMT. It is NOT pur_deduction - that is a value
                      column, and reading it as TDS reported Rs 136.8 Cr of purchases as
                      tax withheld. */
                   TDS_DED     = SUM(CASE WHEN v.IN_PERIOD = 1 THEN v.TDS_AMT ELSE 0 END)
              FROM #PINV v
              LEFT JOIN #POPEN o ON o.PUR_CODE = v.PUR_CODE
             GROUP BY v.SUPPLIER
           ) A
      LEFT JOIN SUPPLIER_MASTER sm ON LTRIM(RTRIM(sm.SUP_CODE)) = A.SUPPLIER
      LEFT JOIN GENACCT_MASTER  g  ON LTRIM(RTRIM(g.ACCTCODE))  = A.SUPPLIER
      LEFT JOIN #PADV ad ON ad.SUPPLIER = A.SUPPLIER
      LEFT JOIN #DPO  dp ON dp.SUPPLIER = A.SUPPLIER
      LEFT JOIN (
                 SELECT v.SUPPLIER, PAID = SUM(s.ALLOC)
                   FROM #PINV v INNER JOIN #PSETTLE s ON s.PUR_CODE = v.PUR_CODE
                  WHERE v.IN_PERIOD = 1
                  GROUP BY v.SUPPLIER
                ) pd ON pd.SUPPLIER = A.SUPPLIER

    CREATE UNIQUE CLUSTERED INDEX IX_SUPP ON #SUPP (SUPPLIER)        -- GROUP BY SUPPLIER

    /*=============================================================================
      RESULT SETS
    =============================================================================*/

    ---------------------------------------------------------------------------------
    -- Table : KPI summary (one row)
    ---------------------------------------------------------------------------------
    SELECT
        '100'                                                        AS STATUS,
        @FROMDATE                                                    AS FROMDATE,
        @TODATE                                                      AS TODATE,
        CONVERT(DECIMAL(18,2), ISNULL(SUM(s.PAYABLE), 0))            AS TOTAL_PAYABLE,
        CONVERT(DECIMAL(18,2), ISNULL(SUM(s.GROSS_DUE), 0))          AS GROSS_PENDING,
        CONVERT(DECIMAL(18,2), ISNULL(SUM(s.ADVANCE), 0))            AS ADVANCE_PAID,
        CONVERT(DECIMAL(18,2), ISNULL(SUM(s.OVERDUE), 0))            AS OVERDUE_AMT,
        CONVERT(DECIMAL(18,2), ISNULL(SUM(s.DUE_7),  0))             AS DUE_7,
        CONVERT(DECIMAL(18,2), ISNULL(SUM(s.DUE_15), 0))             AS DUE_15,
        CONVERT(DECIMAL(18,2), ISNULL(SUM(s.DUE_30), 0))             AS DUE_30,
        (SELECT COUNT(*) FROM #POPEN)                                AS OPEN_BILLS,
        @DUP_BILLS                                                   AS DUPLICATE_BILL_CODES,
        @DUE_IGNORED                                                 AS DUEDATE_IGNORED,
        @INFLOW_B                                                    AS INFLOW_INCLUDED,
        @BILLCAP_N                                                   AS BILL_LIST_CAP,
        CONVERT(VARCHAR(10), CONVERT(DATETIME, @FLOOR_YMD, 112), 103) AS HISTORY_FROM,
        @LOOKBACK_N                                                  AS HISTORY_MONTHS,
        /* direct job cost paid with no purchase bill behind it - reported so the money
           is visible somewhere rather than vanishing between the two buckets */
        (SELECT CONVERT(DECIMAL(18,2), ISNULL(SUM(CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(d.amount)), ''), '0'))), 0))
           FROM acc_bankdtls d
          INNER JOIN acc_bank b ON b.entryno = d.entryno
          WHERE b.status IN ('BP','CP','CE') AND ISNULL(d.entrytype,'') = 'JB'
            AND ISNULL(d.billno,'') = '' AND LTRIM(RTRIM(ISNULL(d.client,''))) LIKE 'S%'
            AND SUBSTRING(d.entryno, 1, 2) = @CMPCODE
            AND LEN(ISNULL(b.entrydt,'')) = 10
            AND SUBSTRING(b.entrydt,7,4)+SUBSTRING(b.entrydt,4,2)+SUBSTRING(b.entrydt,1,2) BETWEEN @FROM_YMD AND @TO_YMD)
                                                                     AS JOBCOST_PAID_PERIOD,
        CONVERT(DECIMAL(18,2), ISNULL(SUM(s.PURCHASED), 0))          AS PURCHASED_PERIOD,   -- net of TDS
        CONVERT(DECIMAL(18,2), ISNULL(SUM(s.GROSSBILLED), 0))        AS GROSS_BILLED_PERIOD,
        CONVERT(DECIMAL(18,2), ISNULL(SUM(s.TDS_DED), 0))            AS TDS_DEDUCTED_PERIOD,
        CONVERT(DECIMAL(18,2), ISNULL(SUM(s.PAID), 0))               AS PAID_PERIOD,
        SUM(CASE WHEN s.PAYABLE > 0.01 THEN 1 ELSE 0 END)            AS SUPPLIER_COUNT,
        ISNULL(SUM(s.BILLS_OPEN), 0)                                 AS BILLS_OPEN,
        MAX(s.OLDEST_DAYS)                                           AS OLDEST_BILL_DAYS,
        /* DPO: value weighted over suppliers we actually take time to pay */
        CONVERT(DECIMAL(18,2),
            CASE WHEN SUM(CASE WHEN s.DAYS_WTD > 0 THEN s.PURCHASED ELSE 0 END) > 0
                 THEN SUM(CASE WHEN s.DAYS_WTD > 0 THEN s.DAYS_WTD * s.PURCHASED ELSE 0 END)
                    / SUM(CASE WHEN s.DAYS_WTD > 0 THEN s.PURCHASED ELSE 0 END) END) AS DPO_DAYS,
        (SELECT CONVERT(DECIMAL(18,2), ISNULL(MIN(DAYS), 0)) FROM #DPOX WHERE DAYS >= 0)  AS FASTEST_PAID_DAYS,
        (SELECT CONVERT(DECIMAL(18,2), ISNULL(MAX(DAYS), 0)) FROM #DPOX)                  AS SLOWEST_PAID_DAYS,
        (SELECT COUNT(*) FROM #PINV WHERE IN_PERIOD = 1)             AS BILLS_IN_PERIOD,
        /* honesty flag for the UI: what share of open bills carries a real due date */
        CONVERT(DECIMAL(9,2),
            CASE WHEN COUNT(*) > 0
                 THEN SUM(CONVERT(FLOAT, s.HAS_TERMS)) * 100.0 / COUNT(*) END)           AS PCT_WITH_DUEDATE
      FROM #SUPP s

    ---------------------------------------------------------------------------------
    -- Table0b is deliberately NOT emitted: the count of purchase rows dropped for an
    -- unusable bill date is reported through PCT_WITH_DUEDATE and the checks at the top
    -- of this file. If rows go missing versus usp_Acc_Purchase_Register, run check 2.
    ---------------------------------------------------------------------------------
    -- Table1 : supplier exposure, biggest payable first
    ---------------------------------------------------------------------------------
    SELECT s.SUPPLIER,
           s.SUPNAME,
           CONVERT(DECIMAL(18,2), s.GROSS_DUE)  AS GROSS_PENDING,
           CONVERT(DECIMAL(18,2), s.ADVANCE)    AS ADVANCE_PAID,
           CONVERT(DECIMAL(18,2), s.PAYABLE)    AS PAYABLE,
           CONVERT(DECIMAL(18,2), s.OVERDUE)    AS OVERDUE,
           s.BILLS_OPEN,
           s.OLDEST_DAYS,
           CONVERT(DECIMAL(18,2), s.DUE_7)      AS DUE_7,
           CONVERT(DECIMAL(18,2), s.DUE_30)     AS DUE_30,
           CONVERT(DECIMAL(18,2), s.PURCHASED)  AS PURCHASED_PERIOD,
           CONVERT(DECIMAL(18,2), s.GROSSBILLED) AS GROSS_BILLED_PERIOD,
           CONVERT(DECIMAL(18,2), s.TDS_DED)    AS TDS_DEDUCTED,
           CONVERT(DECIMAL(18,2), s.PAID)       AS PAID_PERIOD,
           CONVERT(DECIMAL(18,2), s.DAYS_WTD)   AS DPO_DAYS,
           s.HAS_TERMS,
           CASE WHEN s.OVERDUE > 0.01 AND s.OLDEST_DAYS > 180 THEN 'OVERDUE-OLD'
                WHEN s.OVERDUE > 0.01                         THEN 'OVERDUE'
                WHEN s.PAYABLE <= 0.01                        THEN 'SETTLED'
                ELSE 'CURRENT' END               AS PAY_STATUS
      FROM #SUPP s
     WHERE s.PAYABLE > 0.01 OR s.PURCHASED > 0.01 OR s.ADVANCE > 0.01
     ORDER BY s.PAYABLE DESC

    ---------------------------------------------------------------------------------
    -- Table2 : supplier ageing, top @TOPN by payable
    ---------------------------------------------------------------------------------
    SELECT TOP (@TOPN_N)
           s.SUPPLIER, s.SUPNAME,
           CONVERT(DECIMAL(18,2), s.PAYABLE) AS PAYABLE,
           CONVERT(DECIMAL(18,2), s.B1)      AS DAYS_000_030,
           CONVERT(DECIMAL(18,2), s.B2)      AS DAYS_031_060,
           CONVERT(DECIMAL(18,2), s.B3)      AS DAYS_061_090,
           CONVERT(DECIMAL(18,2), s.B4)      AS DAYS_091_180,
           CONVERT(DECIMAL(18,2), s.B5)      AS DAYS_180_PLUS
      FROM #SUPP s
     WHERE s.PAYABLE > 0.01
     ORDER BY s.PAYABLE DESC

    ---------------------------------------------------------------------------------
    -- Table3 : portfolio ageing buckets (for the chart)
    ---------------------------------------------------------------------------------
    SELECT BUCKET, SORTORDER, CONVERT(DECIMAL(18,2), AMT) AS AMOUNT
      FROM (
            SELECT '0-30 days'   AS BUCKET, 1 AS SORTORDER, SUM(B1) AS AMT FROM #SUPP
            UNION ALL SELECT '31-60 days',   2, SUM(B2) FROM #SUPP
            UNION ALL SELECT '61-90 days',   3, SUM(B3) FROM #SUPP
            UNION ALL SELECT '91-180 days',  4, SUM(B4) FROM #SUPP
            UNION ALL SELECT '180+ days',    5, SUM(B5) FROM #SUPP
           ) A
     ORDER BY SORTORDER

    ---------------------------------------------------------------------------------
    -- Table4 : CASH FORECAST - money in vs money out over the next 7 / 15 / 30 days.
    --   IN  : receivable bills falling due (same #INV logic as the receivable proc,
    --         recomputed here so this proc stands alone)
    --   OUT : supplier bills falling due
    --   Overdue on both sides is shown as its own row: it is due NOW, and hiding it
    --   inside "0-7 days" would make the gap look better than it is.
    ---------------------------------------------------------------------------------
    CREATE TABLE #RECV (DUE_DT DATETIME, PENDING FLOAT)

    /* the A/R leg is the single most expensive block in this proc, and a payables user
       does not need it. It runs only when @INFLOW = '1'. */
    IF @INFLOW_B = 1
    INSERT INTO #RECV (DUE_DT, PENDING)
    SELECT DATEADD(DAY, 30, V.INV_DT), V.PENDING     -- flat 30d fallback: see note below
      FROM (
            SELECT INV_DT = CASE WHEN ISDATE(SUBSTRING(i.inv_date,7,4)+SUBSTRING(i.inv_date,4,2)+SUBSTRING(i.inv_date,1,2)) = 1
                                 THEN CONVERT(DATETIME, SUBSTRING(i.inv_date,7,4)+SUBSTRING(i.inv_date,4,2)+SUBSTRING(i.inv_date,1,2), 112) END,
                   PENDING = CONVERT(FLOAT, ISNULL(i.totalamt, 0)) - ISNULL(A.ALLOC, 0)
              FROM acc_invoice i
             INNER JOIN #CITY c ON c.CITYCODE = LTRIM(RTRIM(i.citycode))
              LEFT JOIN (
                    SELECT BILLNO = LTRIM(RTRIM(d.billno)),
                           ALLOC  = SUM(CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(d.amount)), ''), '0')))
                      FROM acc_bankdtls d
                     INNER JOIN acc_bank b ON b.entryno = d.entryno
                     WHERE d.entrytype = 'AB' AND b.status IN ('BR','CR') AND ISNULL(d.billno,'') <> ''
                       AND LEN(ISNULL(b.entrydt,'')) = 10
                       AND SUBSTRING(b.entrydt,7,4)+SUBSTRING(b.entrydt,4,2)+SUBSTRING(b.entrydt,1,2) <= @TO_YMD
                     GROUP BY LTRIM(RTRIM(d.billno))
                  ) A ON A.BILLNO = LTRIM(RTRIM(i.inv_no))
             WHERE LTRIM(RTRIM(ISNULL(i.cmpcode, ''))) = @CMPCODE
               AND LEN(ISNULL(i.inv_date, '')) = 10
               AND SUBSTRING(i.inv_date,7,4)+SUBSTRING(i.inv_date,4,2)+SUBSTRING(i.inv_date,1,2) <= @TO_YMD
               AND LTRIM(RTRIM(ISNULL(i.inv_client, ''))) LIKE 'E%'
           ) V
     WHERE V.PENDING > 0.01 AND V.INV_DT IS NOT NULL
    /* NOTE: the inflow leg uses a flat 30-day term on purpose - the full credit-period
       ladder lives in USP_ACC_RPT_FINANCE_DASHBOARD and duplicating it here would let
       the two drift apart. When the two procs are merged behind the @WIDGETS switch,
       replace this block with the #INV.DUE_DT set. Labelled INFLOW_BASIS below so the
       UI can say so. */

    SELECT BUCKET, SORTORDER,
           CONVERT(DECIMAL(18,2), INFLOW)          AS INFLOW,
           CONVERT(DECIMAL(18,2), OUTFLOW)         AS OUTFLOW,
           CONVERT(DECIMAL(18,2), INFLOW - OUTFLOW) AS NET_GAP,
           /* never let a switched-off leg read as "no money coming in" */
           CASE WHEN @INFLOW_B = 1 THEN 'invoice date + 30 days'
                ELSE 'NOT COMPUTED - call with @INFLOW = ''1'' to include receivables' END AS INFLOW_BASIS,
           @INFLOW_B                               AS INFLOW_INCLUDED
      FROM (
            SELECT 'Already overdue' AS BUCKET, 0 AS SORTORDER,
                   (SELECT ISNULL(SUM(PENDING),0) FROM #RECV WHERE DUE_DT <  @ASON) AS INFLOW,
                   (SELECT ISNULL(SUM(PENDING),0) FROM #POPEN WHERE OVERDUE_DAYS > 0) AS OUTFLOW
            UNION ALL
            SELECT 'Next 7 days', 1,
                   (SELECT ISNULL(SUM(PENDING),0) FROM #RECV  WHERE DUE_DT >= @ASON AND DUE_DT <= DATEADD(DAY, 7, @ASON)),
                   (SELECT ISNULL(SUM(PENDING),0) FROM #POPEN WHERE OVERDUE_DAYS BETWEEN -7 AND 0)
            UNION ALL
            SELECT '8-15 days', 2,
                   (SELECT ISNULL(SUM(PENDING),0) FROM #RECV  WHERE DUE_DT >  DATEADD(DAY, 7, @ASON) AND DUE_DT <= DATEADD(DAY, 15, @ASON)),
                   (SELECT ISNULL(SUM(PENDING),0) FROM #POPEN WHERE OVERDUE_DAYS BETWEEN -15 AND -8)
            UNION ALL
            SELECT '16-30 days', 3,
                   (SELECT ISNULL(SUM(PENDING),0) FROM #RECV  WHERE DUE_DT >  DATEADD(DAY, 15, @ASON) AND DUE_DT <= DATEADD(DAY, 30, @ASON)),
                   (SELECT ISNULL(SUM(PENDING),0) FROM #POPEN WHERE OVERDUE_DAYS BETWEEN -30 AND -16)
            UNION ALL
            SELECT 'Beyond 30 days', 4,
                   (SELECT ISNULL(SUM(PENDING),0) FROM #RECV  WHERE DUE_DT >  DATEADD(DAY, 30, @ASON)),
                   (SELECT ISNULL(SUM(PENDING),0) FROM #POPEN WHERE OVERDUE_DAYS < -30)
           ) F
     ORDER BY SORTORDER

    ---------------------------------------------------------------------------------
    -- Table5 : the open bill list (the payment worklist - oldest / biggest first).
    --   CAPPED. The first run returned 248,578 rows, which no screen can use and which
    --   dominated the run time on its own. The cap is the worklist depth, not a filter
    --   on the totals: KPI.OPEN_BILLS always reports the true count, so a user can see
    --   when the list is truncated.
    ---------------------------------------------------------------------------------
    SELECT TOP (@BILLCAP_N)
           o.PUR_CODE,
           v.PUR_INVNO,
           o.SUPPLIER,
           s.SUPNAME,
           CONVERT(VARCHAR(10), o.PUR_DT, 103)              AS BILL_DATE,
           CONVERT(VARCHAR(10), o.DUE_DT, 103)              AS DUE_DATE,
           v.HAS_TERMS,
           o.PENDING_DAYS                                   AS AGE_DAYS,
           o.OVERDUE_DAYS,
           CONVERT(DECIMAL(18,2), v.GROSSAMT)               AS GROSS_AMOUNT,
           CONVERT(DECIMAL(18,2), v.TDS_AMT)                AS TDS_DEDUCTED,
           CONVERT(DECIMAL(18,2), v.BILLAMT)                AS NET_PAYABLE,
           CONVERT(DECIMAL(18,2), ISNULL(ps.ALLOC, 0))      AS PAID_AMOUNT,
           CONVERT(DECIMAL(18,2), o.PENDING)                AS PENDING
      FROM #POPEN o
     INNER JOIN #PINV v ON v.PUR_CODE = o.PUR_CODE
      LEFT JOIN #SUPP s ON s.SUPPLIER = o.SUPPLIER
      LEFT JOIN #PSETTLE ps ON ps.PUR_CODE = o.PUR_CODE
     ORDER BY o.OVERDUE_DAYS DESC, o.PENDING DESC

    ---------------------------------------------------------------------------------
    -- Table6 : how fast we pay, top @TOPN by purchase value (the mirror of the
    --          client recovery chart - useful when negotiating terms)
    ---------------------------------------------------------------------------------
    SELECT TOP (@TOPN_N)
           s.SUPPLIER, s.SUPNAME,
           CONVERT(DECIMAL(18,2), s.PURCHASED) AS PURCHASED_PERIOD,
           CONVERT(DECIMAL(18,2), d.DAYS_WTD)  AS PAY_DAYS_WTD,
           d.MIN_DAYS                          AS FASTEST_DAYS,
           d.MAX_DAYS                          AS SLOWEST_DAYS,
           d.BILLS
      FROM #SUPP s
     INNER JOIN #DPO d ON d.SUPPLIER = s.SUPPLIER
     ORDER BY s.PURCHASED DESC

    ---------------------------------------------------------------------------------
    -- Table7 : UNLINKED EXPENSE - purchase value in the period carrying no job number.
    --   Cost that names no job can never reach a job P&L, so it silently inflates
    --   margin. This is the measure of that leak.
    ---------------------------------------------------------------------------------
    SELECT LINKED_VALUE   = CONVERT(DECIMAL(18,2), ISNULL(SUM(CASE WHEN Z.HASJOB = 1 THEN Z.AMT ELSE 0 END), 0)),
           UNLINKED_VALUE = CONVERT(DECIMAL(18,2), ISNULL(SUM(CASE WHEN Z.HASJOB = 0 THEN Z.AMT ELSE 0 END), 0)),
           UNLINKED_LINES = ISNULL(SUM(CASE WHEN Z.HASJOB = 0 THEN 1 ELSE 0 END), 0),
           UNLINKED_PCT   = CONVERT(DECIMAL(9,2),
                                CASE WHEN SUM(Z.AMT) > 0
                                     THEN SUM(CASE WHEN Z.HASJOB = 0 THEN Z.AMT ELSE 0 END) * 100.0 / SUM(Z.AMT) END)
      FROM (
            SELECT AMT    = CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(pd.pur_amount)),    ''), '0'))
                            + CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(pd.pur_deduction)), ''), '0')),
                   HASJOB = CASE WHEN LTRIM(RTRIM(ISNULL(pd.pur_jobno, ''))) = '' THEN 0 ELSE 1 END
              FROM acc_purchasedtls pd
             INNER JOIN #PINV v ON pd.pur_code = v.PUR_CODE AND v.IN_PERIOD = 1
           ) Z

    /* the 27 lines (of 17 lakh) that carry a value in BOTH columns. Adding them is the
       only consistent reading, but it is a guess on those rows, so say so. */
    INSERT INTO #DQ (ISSUE_CODE, SEVERITY, PUR_CODE, SUPPLIER, SUPNAME, BILL_DATE, AMOUNT, DETAIL_)
    SELECT TOP 100 'LINE_AMOUNT_AND_DEDUCTION', 2, v.PUR_CODE, v.SUPPLIER, v.SUPNAME,
           CONVERT(VARCHAR(10), v.PUR_DT, 103), v.BILLAMT,
           'This bill has ' + CONVERT(VARCHAR(10), v.BOTHLINES) + ' line(s) carrying a value '
           + 'in BOTH the Amount and the Deduction column. Everywhere else only one of the '
           + 'two is used, so both have been added together here. Check the entry.'
      FROM #PINV v
     WHERE v.IN_PERIOD = 1 AND ISNULL(v.BOTHLINES, 0) > 0
     ORDER BY v.BILLAMT DESC

    ---------------------------------------------------------------------------------
    -- Table8 : DATA DISCREPANCIES - summary. One row per issue type found in the
    --          period, worst first. This is what the screen shows as a banner.
    ---------------------------------------------------------------------------------
    INSERT INTO #DQ (ISSUE_CODE, SEVERITY, PUR_CODE, SUPPLIER, SUPNAME, BILL_DATE, AMOUNT, DETAIL_)
    SELECT TOP 300 'COST_WITHOUT_JOBNO', 2, v.PUR_CODE, v.SUPPLIER, v.SUPNAME,
           CONVERT(VARCHAR(10), v.PUR_DT, 103),
           SUM(CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(pd.pur_amount)),    ''), '0'))
             + CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(pd.pur_deduction)), ''), '0'))),
           'Cost lines on this bill carry no job number, so this value can never reach a '
           + 'job P&L and the margin on those jobs is overstated.'
      FROM acc_purchasedtls pd
     INNER JOIN #PINV v ON pd.pur_code = v.PUR_CODE AND v.IN_PERIOD = 1
     WHERE LTRIM(RTRIM(ISNULL(pd.pur_jobno, ''))) = ''
       AND (CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(pd.pur_amount)),    ''), '0')) <> 0
         OR  CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(pd.pur_deduction)), ''), '0')) <> 0)
     GROUP BY v.PUR_CODE, v.SUPPLIER, v.SUPNAME, v.PUR_DT
     ORDER BY SUM(CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(pd.pur_amount)), ''), '0'))) DESC

    SELECT d.ISSUE_CODE,
           MIN(d.SEVERITY)                                   AS SEVERITY,
           CASE d.ISSUE_CODE
                WHEN 'BILL_DATE_UNREADABLE'   THEN 'Bill date cannot be read'
                WHEN 'DUPLICATE_BILL_CODE'    THEN 'Same purchase code used twice'
                WHEN 'DUE_BEFORE_BILL'        THEN 'Due date is before the bill date'
                WHEN 'DUE_TOO_FAR'            THEN 'Due date beyond any credit term'
                WHEN 'DUE_DATE_MISSING'       THEN 'No due date on the bill'
                WHEN 'BILL_VALUE_ZERO'        THEN 'Bill has no value'
                WHEN 'SUPPLIER_NOT_IN_MASTER' THEN 'Supplier missing from the master'
                WHEN 'PAID_MORE_THAN_BILL'    THEN 'Paid more than the bill'
                WHEN 'LINE_AMOUNT_AND_DEDUCTION' THEN 'Amount and Deduction both filled'
                WHEN 'COST_WITHOUT_JOBNO'     THEN 'Cost not linked to a job'
                ELSE d.ISSUE_CODE END                        AS ISSUE_TITLE,
           COUNT(*)                                          AS ROWS_LISTED,
           CONVERT(DECIMAL(18,2), ISNULL(SUM(d.AMOUNT), 0))  AS VALUE_,
           /* a GENERIC description of the issue. MIN(DETAIL_) was wrong here: it showed
              one arbitrary bill's message - "exceeds by 0.01" - as the heading for a
              group of 74 bills worth a crore. The per-bill wording stays on Table9. */
           CASE d.ISSUE_CODE
                WHEN 'BILL_DATE_UNREADABLE'   THEN 'The bill date cannot be read, so these bills are EXCLUDED from the payable and from every ageing bucket. Correct the date on the purchase entry.'
                WHEN 'DUPLICATE_BILL_CODE'    THEN 'The same purchase code appears on more than one header row. Only one is counted, otherwise the bill value would be added twice.'
                WHEN 'DUE_BEFORE_BILL'        THEN 'The due date falls BEFORE the bill date, so it cannot be a credit term. Ignored; these bills are aged on bill date + assumed terms.'
                WHEN 'DUE_TOO_FAR'            THEN 'The due date is more than 180 days after the bill - beyond any credit term we recognise. Ignored; bill date + assumed terms used instead.'
                WHEN 'DUE_DATE_MISSING'       THEN 'No due date on the bill, so its overdue status is an assumption (bill date + the default term), not the agreed term.'
                WHEN 'BILL_VALUE_ZERO'        THEN 'The bill carries no net value - either the charge lines were never entered, or the deductions cancel it exactly.'
                WHEN 'SUPPLIER_NOT_IN_MASTER' THEN 'The supplier code has no row in SUPPLIER_MASTER, so only the code can be shown.'
                WHEN 'PAID_MORE_THAN_BILL'    THEN 'Payments naming these bills exceed what the bills are worth. Usually one payment covering several bills but quoting only one bill number, or a wrong knock-off. The excess is treated as an advance to the supplier.'
                WHEN 'LINE_AMOUNT_AND_DEDUCTION' THEN 'A charge line has a value in both the Amount and the Deduction column. Almost every line in the system uses one or the other, so these two values have been added. Verify the entry.'
                WHEN 'COST_WITHOUT_JOBNO'     THEN 'Cost lines carry no job number, so this value can never reach a job P&L and the margin on those jobs is overstated.'
                ELSE MIN(d.DETAIL_) END                       AS WHAT_IT_MEANS
      FROM #DQ d
     GROUP BY d.ISSUE_CODE
     ORDER BY MIN(d.SEVERITY), COUNT(*) DESC

    ---------------------------------------------------------------------------------
    -- Table9 : DATA DISCREPANCIES - the rows themselves, so a user can act on them.
    --          Capped per issue above; ROWS_LISTED on Table8 says how many are shown.
    ---------------------------------------------------------------------------------
    SELECT ISSUE_CODE, SEVERITY, PUR_CODE, PUR_INVNO, SUPPLIER, SUPNAME,
           BILL_DATE, DUE_DATE,
           CONVERT(DECIMAL(18,2), ISNULL(AMOUNT, 0)) AS AMOUNT,
           DETAIL_                                   AS WHAT_TO_DO
      FROM #DQ
     ORDER BY SEVERITY, ISSUE_CODE, ISNULL(AMOUNT, 0) DESC

    ---------------------------------------------------------------------------------
    -- cleanup
    ---------------------------------------------------------------------------------
    DROP TABLE #CITY
    DROP TABLE #DQ
    DROP TABLE #PINV
    DROP TABLE #PLINE
    DROP TABLE #PKEY
    DROP TABLE #PAYLINE
    DROP TABLE #PSETTLE
    DROP TABLE #POPEN
    DROP TABLE #PADV
    DROP TABLE #DPOX
    DROP TABLE #DPO
    DROP TABLE #SUPP
    DROP TABLE #RECV
    DROP TABLE #SUPM
    DROP TABLE #GACC
END
GO

GRANT EXECUTE ON dbo.USP_ACC_RPT_PAYABLE_DASHBOARD TO PUBLIC
GO

/*=====================================================================================
  SMOKE TEST
     PARAMETER ORDER (positional - get this wrong and you silently test the wrong thing):
        1 @FROMDATE  2 @TODATE  3 @CMPCODE  4 @CITYCODE  5 @SUPPLIERCODE
        6 @TOPN      7 @DEFTERM 8 @LOOKBACK 9 @INCDED    10 @INFLOW

     -- normal call: 12-month window, no A/R leg
     EXEC dbo.USP_ACC_RPT_PAYABLE_DASHBOARD '01/04/2026', '30/06/2026', '01', 'ALL', '', '10'

     -- named parameters are safer than positional - prefer this form
     EXEC dbo.USP_ACC_RPT_PAYABLE_DASHBOARD
          @FROMDATE = '01/04/2026', @TODATE = '30/06/2026', @CMPCODE = '01',
          @CITYCODE = 'ALL', @TOPN = '10', @DEFTERM = '30', @LOOKBACK = '12', @INFLOW = '0'

     -- with the cash-forecast (A/R) leg switched on - noticeably slower
     EXEC dbo.USP_ACC_RPT_PAYABLE_DASHBOARD
          @FROMDATE = '01/04/2026', @TODATE = '30/06/2026', @CMPCODE = '01', @INFLOW = '1'

     -- everything since inception (SLOW - reconciliation only)
     EXEC dbo.USP_ACC_RPT_PAYABLE_DASHBOARD
          @FROMDATE = '01/04/2026', @TODATE = '30/06/2026', @CMPCODE = '01', @LOOKBACK = '0'

  RECONCILE BEFORE SHIPPING (a tile that cannot be tied to an existing statement
  does not ship):
     - Table1 PAYABLE per supplier   vs  the Bank Payment screen's own bill list
                                         (Accounts/ACC_PAYMENT_POPULATE_SUPPLIERBILL)
     - PURCHASED_PERIOD              vs  usp_Acc_Purchase_Register for the same period
     - TDS_DEDUCTED on Table5        vs  acc_purchase.pur_tds for the same bills
=====================================================================================*/
