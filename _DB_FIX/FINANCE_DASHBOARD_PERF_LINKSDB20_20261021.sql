/*===============================================================================================
  FINANCE_DASHBOARD_PERF_LINKSDB20_20261021.sql         (LinksDB20)

  Why  : the Finance dashboard (USP_ACC_RPT_FINANCE_DASHBOARD) took 21-28 s per uncached call on
         LinksDB20 (company 30, 01/04/2026-21/10/2026: Mumbai 23 s, ALL branches 22 s, October 28 s).
         Measured from sys.dm_exec_query_stats, most of it was a few statements that look up
         un-indexed accounting tables (acc_invjobno, acc_bankdtls, acc_creditnote, journal and
         purchase lines) once per invoice or per job, often on trimmed codes no index can serve:
         the #INV credit-period ladder alone was 3.6 s.
  Fix  : those lookups now read small keyed #temp copies built once per call (#IJN / #JIV invoice-job
         links, #WOJV, #BRCR / #SETTLEX, #CNLINK, #EXK, #SSJ, #JECX, #PURJ, #EXPM), with exactly the
         same comparisons, trimming and duplicate handling as before; five statements run with
         OPTION (MAXDOP 1) and the new temp tables are dropped at the end. Results are unchanged.
         Tested 2026-10-21 on LinksDB20 in temp-table-only sessions, old text against new text, row
         for row on all 17 result sets: Mumbai 01/04-21/10/2026 identical; ALL branches and Mumbai
         01/10-21/10/2026 identical except INCOME on jobs 301102610003766 / 3767, which move by 0.01
         between runs of the OLD text too (a float sum whose row order follows a parallel plan).
         About 11-15 s per call instead of 21-28 s.
  
  Safety : step 1 stops before altering anything unless the procedure exists, is the expected version
           (its text has the ARITHABORT comment of the live version) and you may ALTER it. ALTER
           keeps the procedure's permissions. No table, row or other object is touched. Step 3 calls
           the procedure once (read-only: temp tables only) and prints its time - set @RunCheck = 0 to
           skip it. The API caches dashboard answers for up to 2 hours, so the dashboard shows the new
           timing only for periods not cached yet. Re-runnable.
  Note   : FINANCE_DASHBOARD_SETUP.sql holds an older text of this procedure than the live one;
           re-running that script would replace both the live changes and this fix.
  Rollback: ROLLBACK_FINANCE_DASHBOARD_PERF_LINKSDB20_20261021.sql
  Run as : any login that may ALTER the procedure (normal login). SQL Server 2008 R2.
===============================================================================================*/
USE [LinksDB20]
GO
/* ---- 1. checks (read-only) ----------------------------------------------------------------- */
SET NOEXEC OFF;
DECLARE @problems TABLE (n INT IDENTITY(1,1), problem NVARCHAR(400));
DECLARE @d NVARCHAR(MAX);
SET @d = OBJECT_DEFINITION(OBJECT_ID('dbo.USP_ACC_RPT_FINANCE_DASHBOARD', 'P'));

IF DB_NAME() <> 'LinksDB20'
    INSERT INTO @problems (problem) VALUES ('Connected to ' + DB_NAME() + ', not LinksDB20.');
IF @d IS NULL
    INSERT INTO @problems (problem) VALUES ('dbo.USP_ACC_RPT_FINANCE_DASHBOARD not found.');
ELSE IF CHARINDEX('measured 52s from sqlcmd against', @d) = 0
    INSERT INTO @problems (problem) VALUES ('dbo.USP_ACC_RPT_FINANCE_DASHBOARD is not the expected version (the live version of 2026-10-21) - left alone.');
IF @d IS NOT NULL AND ISNULL(HAS_PERMS_BY_NAME('dbo.USP_ACC_RPT_FINANCE_DASHBOARD', 'OBJECT', 'ALTER'), 0) = 0
    INSERT INTO @problems (problem) VALUES ('No ALTER permission on dbo.USP_ACC_RPT_FINANCE_DASHBOARD.');

IF EXISTS (SELECT 1 FROM @problems)
BEGIN
    PRINT '*** Check failed on ' + DB_NAME() + ' - NOTHING was altered:';
    SELECT n AS [#], problem FROM @problems ORDER BY n;
    RAISERROR('Check failed - see the list above.', 16, 1);
    SET NOEXEC ON;     -- skip the rest of the script, including the ALTER below
END
ELSE IF CHARINDEX('INTO #IJN', @d) > 0
    PRINT 'Prerequisites OK on ' + DB_NAME() + '. The procedure is already the fast version; altering it again changes nothing.';
ELSE
    PRINT 'Prerequisites OK on ' + DB_NAME() + '.';
GO
/* ---- 2. alter -------------------------------------------------------------------------------- */
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
ALTER PROCEDURE dbo.USP_ACC_RPT_FINANCE_DASHBOARD
    -- Every parameter has a default so a null / omitted value from the API layer is
    -- tolerated rather than failing with "expects parameter, which was not supplied".
    @FROMDATE   NVARCHAR(15) = NULL,
    @TODATE     NVARCHAR(15) = NULL,
    @CMPCODE    NVARCHAR(2)  = NULL,
    @CITYCODE   NVARCHAR(20) = NULL,
    @CLIENTCODE NVARCHAR(50) = NULL,
    -- NVARCHAR, not INT, on purpose: the whole stack passes strings (Angular builds a
    -- query string, the controller takes String, and the DAL assigns the value straight
    -- onto the derived SqlParameter). An INT parameter here makes ADO.NET throw
    -- "Failed to convert parameter value from a String to a Int32", which the
    -- controller swallows and returns as an empty DataSet.
    @TOPN       NVARCHAR(10) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    -- ADO.NET connects with ARITHABORT OFF while sqlcmd/SSMS use ON, which produces a
    -- different cached plan for the same statement: measured 52s from sqlcmd against
    -- 136s for the identical call through SqlDataAdapter. Forcing it ON here makes the
    -- API path use the same plan as the tools it was tuned with.
    SET ARITHABORT ON;

    ---------------------------------------------------------------------------------
    -- 0. Normalise parameters
    ---------------------------------------------------------------------------------
    -- guard against a null / blank period so the string date maths cannot produce junk
    IF LEN(LTRIM(RTRIM(ISNULL(@FROMDATE, '')))) <> 10 OR LEN(LTRIM(RTRIM(ISNULL(@TODATE, '')))) <> 10
    BEGIN
        SELECT '101' AS STATUS,
               'FROMDATE and TODATE are required in dd/MM/yyyy format.' AS STATUSMSG
        RETURN
    END

    DECLARE @TOPN_N INT
    SET @TOPN_N = CASE WHEN ISNUMERIC(LTRIM(RTRIM(ISNULL(@TOPN, ''))) + '.0e0') = 1
                       THEN CONVERT(INT, CONVERT(FLOAT, LTRIM(RTRIM(@TOPN)))) ELSE 0 END
    IF ISNULL(@TOPN_N, 0) <= 0 SET @TOPN_N = 10
    SET @CLIENTCODE = LTRIM(RTRIM(ISNULL(@CLIENTCODE, '')))
    SET @CITYCODE   = LTRIM(RTRIM(ISNULL(@CITYCODE,   '')))
    SET @CMPCODE    = LTRIM(RTRIM(ISNULL(@CMPCODE,    '')))

    DECLARE @FROM_YMD CHAR(8), @TO_YMD CHAR(8), @T90_YMD CHAR(8)
    DECLARE @FROMDT DATETIME, @ASON DATETIME

    -- Dates arrive as dd/MM/yyyy varchar. Convert by string surgery to yyyymmdd, then
    -- with style 112, which is unambiguous and never hits the dd/mm vs mm/dd trap.
    SET @FROM_YMD = SUBSTRING(@FROMDATE,7,4) + SUBSTRING(@FROMDATE,4,2) + SUBSTRING(@FROMDATE,1,2)
    SET @TO_YMD   = SUBSTRING(@TODATE,  7,4) + SUBSTRING(@TODATE,  4,2) + SUBSTRING(@TODATE,  1,2)
    SET @FROMDT   = CONVERT(DATETIME, @FROM_YMD, 112)
    SET @ASON     = CONVERT(DATETIME, @TO_YMD,   112)
    SET @T90_YMD  = CONVERT(CHAR(8), DATEADD(DAY, -90, @ASON), 112)

    ---------------------------------------------------------------------------------
    -- 1. Branch scope.  The UI sends CITYCODE1 ('101'); the accounting tables carry the
    --    3-letter code ('MUM').  Accept either, and 'ALL' for consolidated.
    ---------------------------------------------------------------------------------
    CREATE TABLE #CITY (CITYCODE VARCHAR(10))

    IF @CITYCODE = '' OR @CITYCODE = 'ALL'
        INSERT INTO #CITY (CITYCODE)
        SELECT DISTINCT LTRIM(RTRIM(citycode)) FROM CITY WHERE ISNULL(citycode,'') <> ''
    ELSE
        INSERT INTO #CITY (CITYCODE)
        SELECT DISTINCT LTRIM(RTRIM(citycode)) FROM CITY
         WHERE LTRIM(RTRIM(ISNULL(citycode1,''))) = @CITYCODE
            OR LTRIM(RTRIM(ISNULL(citycode ,''))) = @CITYCODE

    CREATE CLUSTERED INDEX IX_CITY ON #CITY (CITYCODE)

    ---------------------------------------------------------------------------------
    -- #IJN - acc_invjobno (72k rows, a heap with no index) trimmed ONCE. Five statements
    -- below join it on LTRIM(RTRIM(inv_no)) / LTRIM(RTRIM(inv_jobno)), which no index can
    -- serve: each one scanned and re-trimmed the whole table and, planning on a guessed
    -- row count, spilled its sort / hash to tempdb (perf 2026-10-21 on the Mumbai call:
    -- #INVMODE 1.17, #INVJOBPD 0.77, #JOBCLI 0.33, #INVJOB 0.27, #INVJOBCNT 0.76 s;
    -- now 0.03 - 0.10 s each, plus 0.08 s to build #IJN).
    -- One row per acc_invjobno row - nothing is de-duplicated, so every join keeps its
    -- multiplicity - with exactly the trimmed values the statements compared before.
    -- #JOBINV is left reading acc_invjobno on purpose: the order its rows come out in
    -- decides the order #JOBINC / #JIC add up the halves of a two-job invoice, and a
    -- different order moved a half-paisa income from one job to the other.
    ---------------------------------------------------------------------------------
    CREATE TABLE #IJN (INV_NO VARCHAR(15), JOBNO VARCHAR(20))
    INSERT INTO #IJN (INV_NO, JOBNO)
    SELECT LTRIM(RTRIM(inv_no)), LTRIM(RTRIM(inv_jobno)) FROM acc_invjobno
    CREATE CLUSTERED INDEX IX_IJN ON #IJN (INV_NO, JOBNO)

    ---------------------------------------------------------------------------------
    -- 2. #INV - every invoice up to @TODATE in scope (AS-ON population).
    --    IN_PERIOD marks the subset that falls inside @FROMDATE..@TODATE.
    ---------------------------------------------------------------------------------
    CREATE TABLE #INV
    (
        INV_NO        VARCHAR(15),
        INV_DT        DATETIME,
        CLIENTCODE    VARCHAR(10),
        CITYCODE      VARCHAR(10),
        BILLTYPE      VARCHAR(25),
        INV_CUR       VARCHAR(10),
        TOTALAMT      FLOAT,
        PAYBY         DATETIME,
        CREDIT_PERIOD INT,
        HAS_TERMS     BIT,
        DUE_DT        DATETIME,
        IN_PERIOD     BIT
    )

    -- CREDIT_PERIOD / HAS_TERMS / DUE_DT start at the ladder's fallback (30 days, no
    -- terms, due 30 days after the invoice); section 3 moves only the rows that resolve
    -- to a real term (see there)
    INSERT INTO #INV (INV_NO, INV_DT, CLIENTCODE, CITYCODE, BILLTYPE, INV_CUR, TOTALAMT, PAYBY,
                      CREDIT_PERIOD, HAS_TERMS, DUE_DT, IN_PERIOD)
    SELECT LTRIM(RTRIM(i.inv_no)),
           D.INV_DT,
           LTRIM(RTRIM(i.inv_client)),
           LTRIM(RTRIM(i.citycode)),
           LTRIM(RTRIM(ISNULL(i.inv_billtype, ''))),
           LTRIM(RTRIM(ISNULL(i.inv_cur, 'CR115'))),
           CONVERT(FLOAT, ISNULL(i.totalamt, 0)),
           i.PAYBYDT,
           30, 0, DATEADD(DAY, 30, D.INV_DT),
           CASE WHEN SUBSTRING(i.inv_date,7,4)+SUBSTRING(i.inv_date,4,2)+SUBSTRING(i.inv_date,1,2)
                     BETWEEN @FROM_YMD AND @TO_YMD THEN 1 ELSE 0 END
      FROM acc_invoice i
     INNER JOIN #CITY c ON c.CITYCODE = LTRIM(RTRIM(i.citycode))
     CROSS APPLY (SELECT CASE WHEN ISDATE(SUBSTRING(i.inv_date,7,4)+SUBSTRING(i.inv_date,4,2)+SUBSTRING(i.inv_date,1,2)) = 1 THEN CONVERT(DATETIME, SUBSTRING(i.inv_date,7,4)+SUBSTRING(i.inv_date,4,2)+SUBSTRING(i.inv_date,1,2), 112) END AS INV_DT) D
     WHERE LTRIM(RTRIM(ISNULL(i.cmpcode, ''))) = @CMPCODE
       -- string date compare: ISDATE()/CONVERT guards are unreliable here because the
       -- optimizer may evaluate CONVERT before the guard and blow up on dirty rows
       AND LEN(ISNULL(i.inv_date, '')) = 10
       /* rows whose date is not a real calendar date (Links had 85 junk rows such as
          '30/58/2023', inv_no NULL) are skipped. The CASE in the SELECT list is what
          makes the CONVERT safe; this line keeps such rows out of the population. */
       AND ISDATE(SUBSTRING(i.inv_date,7,4)+SUBSTRING(i.inv_date,4,2)+SUBSTRING(i.inv_date,1,2)) = 1
       AND SUBSTRING(i.inv_date,7,4)+SUBSTRING(i.inv_date,4,2)+SUBSTRING(i.inv_date,1,2) <= @TO_YMD
       AND LTRIM(RTRIM(ISNULL(i.inv_client, ''))) LIKE 'E%'
       AND (@CLIENTCODE = '' OR LTRIM(RTRIM(i.inv_client)) = @CLIENTCODE)

    CREATE CLUSTERED INDEX IX_INV ON #INV (INV_NO)
    CREATE NONCLUSTERED INDEX IX_INV_CL ON #INV (CLIENTCODE)

    -- Job cost counts only the heads the Job Profit statement counts: GENACCT_MASTER
    -- ISJOBREPORT = 'Y' (USP_ACCT_RPT_JOB_PROFIT uses exactly this list). GST paid on
    -- purchases - 'GST Central / State (Paid by us)' - is not on it: it is input tax
    -- recovered, not a cost of the job, and counting it made the dashboard's expense
    -- higher than the Job Profit statement for the same job.
    -- Customs duty is paid for the client and billed straight back under a duty head.
    -- It is not trading, and carrying it on both sides only dilutes the margin, so it
    -- is kept out of job cost and job income and reported on its own (DUTY_PAID /
    -- DUTY_RECO, from TBL_SHIPMENT_SUMMARY_JOB). STAMP DUTY is our own cost and stays.
    -- The Job Profit statement applies the same rule, so job and dashboard still agree.
    CREATE TABLE #DUTYHEAD (ACCTCODE VARCHAR(10) PRIMARY KEY)
    INSERT INTO #DUTYHEAD (ACCTCODE)
    SELECT DISTINCT LTRIM(RTRIM(ACCTCODE)) FROM dbo.TBL_MST_DUTY_HEAD WHERE IS_ENABLED = 1

    CREATE TABLE #JOBHEAD (ACCTCODE VARCHAR(10) PRIMARY KEY)
    INSERT INTO #JOBHEAD (ACCTCODE)
    SELECT DISTINCT LTRIM(RTRIM(acctcode)) FROM GENACCT_MASTER
     WHERE ISJOBREPORT = 'Y' AND ISNULL(acctcode, '') <> ''
       AND LTRIM(RTRIM(acctcode)) NOT IN (SELECT ACCTCODE FROM #DUTYHEAD)

    -- the service map with duty forced into its own category, so every income test
    -- below drops it in one place rather than five
    CREATE TABLE #SVCCAT (ACCTCODE VARCHAR(15) PRIMARY KEY, CATEGORY VARCHAR(10))
    INSERT INTO #SVCCAT (ACCTCODE, CATEGORY)
    SELECT LTRIM(RTRIM(c.ACCTCODE)),
           CASE WHEN d.ACCTCODE IS NOT NULL THEN 'DUTY' ELSE c.CATEGORY END
      FROM dbo.TBL_MST_FIN_SERVICE_CATEGORY c
      LEFT JOIN #DUTYHEAD d ON d.ACCTCODE = LTRIM(RTRIM(c.ACCTCODE))
    INSERT INTO #SVCCAT (ACCTCODE, CATEGORY)
    SELECT d.ACCTCODE, 'DUTY' FROM #DUTYHEAD d
     WHERE NOT EXISTS (SELECT 1 FROM #SVCCAT s WHERE s.ACCTCODE = d.ACCTCODE)

    ---------------------------------------------------------------------------------
    -- 2b. Opening balance brought forward from before the ERP went live.
    --     The Billwise Receivable statement starts a client with an "OP. BALANCE" line:
    --     the client's balance in the first year table that carries client openings,
    --     less the AO (against opening) receipts that settled it, i.e. AO lines that do
    --     not name an invoice. Invoices only exist from go-live, so without this a client
    --     still owing - or owed - from before then is missing from outstanding.
    --        Manilal: TBL_MASTER_010420063103007_ALLGL (01/04/2006, company 01 columns)
    --        Links:   tbl_Master_010420203103021_AllGL (01/04/2020, company 30 columns;
    --                 the 2006 and 2019-20 tables carry nothing for company 30)
    --     The table is found, not hard-coded: the earliest TBL_MASTER_<fy>_ALLGL with a
    --     non-zero client balance in this company's branch columns (<cmp><citycode1>OP).
    --     A net debit becomes one open bill dated at go-live (INV_NO 'OPBAL-<client>');
    --     a net credit is money held on account (#UNADJ below).
    ---------------------------------------------------------------------------------
    CREATE TABLE #OPBASE (CLIENTCODE VARCHAR(10), OPAMT FLOAT)
    DECLARE @OPTAB SYSNAME, @OPUSED SYSNAME, @OPEXPR NVARCHAR(MAX), @OPFOUND INT, @OPSQL NVARCHAR(MAX), @OPBASE_DT DATETIME
    SET @OPUSED = NULL

    DECLARE opc CURSOR LOCAL FAST_FORWARD FOR
        SELECT t.name
          FROM sys.tables t
         WHERE t.name LIKE 'TBL[_]MASTER[_]%[_]ALLGL'
           AND ISNUMERIC(SUBSTRING(t.name, 12, 8)) = 1
         ORDER BY SUBSTRING(t.name, 16, 4)
    OPEN opc
    FETCH NEXT FROM opc INTO @OPTAB
    WHILE @@FETCH_STATUS = 0 AND @OPUSED IS NULL
    BEGIN
        SET @OPEXPR = ''
        SELECT @OPEXPR = @OPEXPR + N' + ISNULL([' + c.name + N'], 0)'
          FROM sys.columns c
         WHERE c.object_id = OBJECT_ID(N'dbo.' + QUOTENAME(@OPTAB))
           AND c.name IN (SELECT @CMPCODE + LTRIM(RTRIM(cy.citycode1)) + 'OP'
                            FROM CITY cy
                           INNER JOIN #CITY ct ON ct.CITYCODE = LTRIM(RTRIM(cy.citycode)))
        IF @OPEXPR <> ''
        BEGIN
            SET @OPFOUND = 0
            SET @OPSQL = N'SELECT @n = COUNT(*) FROM dbo.' + QUOTENAME(@OPTAB)
                       + N' WHERE LTRIM(RTRIM(REPLACE(REPLACE(Code, CHAR(13), ''''), CHAR(10), ''''))) LIKE ''E%'''
                       + N' AND (0' + @OPEXPR + N') <> 0'
            EXEC sp_executesql @OPSQL, N'@n INT OUTPUT', @n = @OPFOUND OUTPUT
            IF @OPFOUND > 0
            BEGIN
                SET @OPUSED = @OPTAB
                SET @OPSQL = N'INSERT INTO #OPBASE (CLIENTCODE, OPAMT)'
                           + N' SELECT LTRIM(RTRIM(REPLACE(REPLACE(Code, CHAR(13), ''''), CHAR(10), ''''))), SUM(0' + @OPEXPR + N')'
                           + N' FROM dbo.' + QUOTENAME(@OPTAB)
                           + N' WHERE LTRIM(RTRIM(REPLACE(REPLACE(Code, CHAR(13), ''''), CHAR(10), ''''))) LIKE ''E%'''
                           + N' AND (0' + @OPEXPR + N') <> 0'
                           + N' GROUP BY LTRIM(RTRIM(REPLACE(REPLACE(Code, CHAR(13), ''''), CHAR(10), '''')))'
                EXEC sp_executesql @OPSQL
            END
        END
        FETCH NEXT FROM opc INTO @OPTAB
    END
    CLOSE opc
    DEALLOCATE opc

    -- the table name carries the year start: TBL_MASTER_ddMMyyyy...
    SET @OPBASE_DT = CASE WHEN @OPUSED IS NOT NULL
                          THEN CONVERT(DATETIME, SUBSTRING(@OPUSED, 16, 4) + SUBSTRING(@OPUSED, 14, 2) + SUBSTRING(@OPUSED, 12, 2), 112) END

    -- AO receipts that do not name an invoice settle the opening balance. Staged first and
    -- then thinned with a direct match on inv_no: a trimmed NOT EXISTS against acc_invoice
    -- inside the bank-line query was evaluated far more often than the AO lines it was
    -- meant for and took 345 of 368 seconds on Manilal.
    CREATE TABLE #OPAO (CLIENTCODE VARCHAR(10), BILLNO VARCHAR(30), AMT FLOAT)
    IF @OPUSED IS NOT NULL
        INSERT INTO #OPAO (CLIENTCODE, BILLNO, AMT)
        SELECT LTRIM(RTRIM(d.client)),
               LTRIM(RTRIM(ISNULL(d.billno, ''))),
               CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(d.amount)), ''), '0'))
          FROM acc_bankdtls d
         INNER JOIN acc_bank b ON b.entryno = d.entryno
         INNER JOIN #CITY ct ON ct.CITYCODE = LTRIM(RTRIM(b.citycode))
         WHERE b.status IN ('BR', 'CR')
           AND d.entrytype = 'AO'
           AND LTRIM(RTRIM(ISNULL(d.client, ''))) LIKE 'E%'
           AND SUBSTRING(d.entryno, 1, 2) = @CMPCODE
           AND LEN(ISNULL(b.entrydt, '')) = 10
           AND SUBSTRING(b.entrydt,7,4)+SUBSTRING(b.entrydt,4,2)+SUBSTRING(b.entrydt,1,2) <= @TO_YMD

    -- an AO line naming a real invoice settles that invoice (section 4), not the opening
    DELETE a
      FROM #OPAO a
     WHERE a.BILLNO <> ''
       AND EXISTS (SELECT 1 FROM acc_invoice iv WHERE iv.inv_no = a.BILLNO)

    CREATE TABLE #OPNET (CLIENTCODE VARCHAR(10), NETAMT FLOAT)
    INSERT INTO #OPNET (CLIENTCODE, NETAMT)
    SELECT X.CLIENTCODE, SUM(X.AMT)
      FROM (
            SELECT CLIENTCODE, OPAMT AS AMT FROM #OPBASE
            UNION ALL
            SELECT CLIENTCODE, -AMT FROM #OPAO
           ) X
     GROUP BY X.CLIENTCODE

    INSERT INTO #INV (INV_NO, INV_DT, CLIENTCODE, CITYCODE, BILLTYPE, INV_CUR, TOTALAMT, PAYBY,
                      CREDIT_PERIOD, HAS_TERMS, DUE_DT, IN_PERIOD)
    SELECT 'OPBAL-' + n.CLIENTCODE, @OPBASE_DT, n.CLIENTCODE, (SELECT TOP 1 CITYCODE FROM #CITY),
           'OPENING', 'CR115', n.NETAMT, NULL, 30, 0, DATEADD(DAY, 30, @OPBASE_DT), 0
      FROM #OPNET n
     WHERE n.NETAMT > 0.01
       AND (@CLIENTCODE = '' OR n.CLIENTCODE = @CLIENTCODE)

    ---------------------------------------------------------------------------------
    -- #JVADJ - journal lines on a client's ledger that are NOT bill-wise knock-offs.
    --          A bad debt nullified by JV (how a 12-14 year old debt is normally
    --          closed), a waiver, or a balance moved from one client ledger to another
    --          all live here. The Account Statement counts every one of them; the
    --          dashboards used to see only entrytype 'AB' lines carrying a bill number,
    --          so a client written off years ago still showed the whole debt - Links
    --          HECTOR TRANSPORTATION CAMBODIA: 18,72,029.43 written off by journal and
    --          18,72,040.43 still displayed as overdue - while the client who RECEIVED
    --          a transferred balance showed nothing.
    --          Over the whole book the two sides nearly cancel (Links -9.08 lakh,
    --          Manilal +2.53 crore), which is why the totals looked right while the
    --          individual clients were wrong.
    --          Counted from the opening-balance date onward; anything older already
    --          sits inside the opening brought forward and would count twice.
    ---------------------------------------------------------------------------------
    -- the heads a bad debt is written off to, found by name so both companies' charts
    -- are covered: "Debit Balance Written Off", "BAD DEBTS", "SUNDRY DEBTORS W/OFF PAID"
    CREATE TABLE #WOHEAD (ACCTCODE VARCHAR(10) PRIMARY KEY)
    INSERT INTO #WOHEAD (ACCTCODE)
    SELECT DISTINCT LTRIM(RTRIM(acctcode)) FROM GENACCT_MASTER
     WHERE ISNULL(acctcode, '') <> ''
       AND (UPPER(acctname) LIKE '%BAD DEBT%'
         OR UPPER(acctname) LIKE '%DEBIT BALANCE WRITTEN OFF%'
         OR UPPER(acctname) LIKE '%DEBTORS W/OFF%')
       AND UPPER(acctname) NOT LIKE '%RECOVERY%'

    -- the vouchers that carry a write-off line, found once: as a correlated EXISTS the
    -- optimizer expected 10 client lines and re-scanned acc_JournalVoucDtls (35k rows) for
    -- every one of the ~450 it got (perf 2026-10-21: #JVADJ 1.63 s / 185k reads; now
    -- 0.05 s, #WOJV 0.01 s)
    CREATE TABLE #WOJV (JVCODE VARCHAR(15) PRIMARY KEY)
    INSERT INTO #WOJV (JVCODE)
    SELECT DISTINCT w.jvcode
      FROM acc_JournalVoucDtls w
     INNER JOIN #WOHEAD wh ON wh.ACCTCODE = LTRIM(RTRIM(w.jv_account))
     WHERE w.jvcode IS NOT NULL

    CREATE TABLE #JVADJ (CLIENTCODE VARCHAR(10), NETCR FLOAT, CREDITS FLOAT, LASTDT DATETIME)
    INSERT INTO #JVADJ (CLIENTCODE, NETCR, CREDITS, LASTDT)
    SELECT LTRIM(RTRIM(jd.jv_account)),
           SUM(CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(jd.jv_credit)), ''), '0'))
             - CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(jd.jv_debit)), ''), '0'))),
           SUM(CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(jd.jv_credit)), ''), '0'))),
           MAX(CONVERT(DATETIME, SUBSTRING(jh.jv_date,7,4)+SUBSTRING(jh.jv_date,4,2)+SUBSTRING(jh.jv_date,1,2), 112))
      FROM acc_JournalVoucDtls jd
     INNER JOIN acc_JournalVouc jh ON jh.jvcode = jd.jvcode
     INNER JOIN #CITY ct ON ct.CITYCODE = LTRIM(RTRIM(jh.citycode))
     WHERE LTRIM(RTRIM(ISNULL(jd.jv_account, ''))) LIKE 'E%'
       AND LTRIM(RTRIM(ISNULL(jh.cmpcode, ''))) = @CMPCODE
       -- AB lines naming a bill are already applied bill by bill in #SETTLEX
       AND NOT (jd.entrytype = 'AB' AND ISNULL(jd.jv_InvoiceNo, '') <> '')
       -- and the voucher must actually be writing a bad debt off
       AND EXISTS (SELECT 1 FROM #WOJV w WHERE w.JVCODE = jd.jvcode)
       AND LEN(ISNULL(jh.jv_date, '')) = 10
       AND ISDATE(SUBSTRING(jh.jv_date,7,4)+SUBSTRING(jh.jv_date,4,2)+SUBSTRING(jh.jv_date,1,2)) = 1
       AND SUBSTRING(jh.jv_date,7,4)+SUBSTRING(jh.jv_date,4,2)+SUBSTRING(jh.jv_date,1,2) <= @TO_YMD
       AND (@OPBASE_DT IS NULL
            OR CONVERT(DATETIME, SUBSTRING(jh.jv_date,7,4)+SUBSTRING(jh.jv_date,4,2)+SUBSTRING(jh.jv_date,1,2), 112) >= @OPBASE_DT)
       AND (@CLIENTCODE = '' OR LTRIM(RTRIM(jd.jv_account)) = @CLIENTCODE)
     GROUP BY LTRIM(RTRIM(jd.jv_account))
    CREATE CLUSTERED INDEX IX_JVADJ ON #JVADJ (CLIENTCODE)



    ---------------------------------------------------------------------------------
    -- 3. Credit period ladder
    --      (a) DATEDIFF(inv_date, PAYBYDT) when > 0   - per invoice, ~50% of invoices
    --      (b) exp_master.CREDITPERIOD_SEA / _AIR     - by shipment mode
    --      (c) default 30                             - modal value in both sources
    --    exp_master.DueDays is 100% NULL and is deliberately not used.
    ---------------------------------------------------------------------------------
    -- Bounded at 180 days on purpose. PAYBYDT is sometimes keyed far into the future
    -- (MP-CARGO FRANCE came out at 305 days, FOPPIANI at 389), which is not a credit
    -- term and produced recovery gaps of -287 days. Anything outside 1..180 falls
    -- through to the client master value below.
    --
    -- Every #INV row (invoices and OPBAL- lines) is written with (c) already in place:
    -- 30 days, HAS_TERMS 0, due 30 days after the invoice. One UPDATE then moves only the
    -- rows that resolve to a real term, (a) else (b), to that term with HAS_TERMS 1 and
    -- the matching due date. That is the final state the four UPDATE passes used to leave
    -- (PAYBYDT; client master; fall back to 30; due date), but it rewrites ~5k rows
    -- instead of ~190k (perf 2026-10-21 on the Mumbai call: #INVMODE 1.17 s and the four
    -- updates 0.04 + 0.91 + 0.84 + 0.61 s, about 3.6 s together; now about 0.45 s).

    -- shipment mode per invoice, from the job number's type digit
    --   1 = sea export, 2 = air export, 5 = sea import, 6 = air import
    -- (from #IJN, and no longer joined to #INV first: the UPDATE below looks it up by
    -- invoice number, so the extra invoices are never read and MIN() is unchanged)
    CREATE TABLE #INVMODE (INV_NO VARCHAR(15), MODECH CHAR(1))
    INSERT INTO #INVMODE (INV_NO, MODECH)
    SELECT j.INV_NO, MIN(SUBSTRING(j.JOBNO, 8, 1))
      FROM #IJN j
     WHERE LEN(ISNULL(j.JOBNO, '')) >= 8
     GROUP BY j.INV_NO
    CREATE CLUSTERED INDEX IX_INVMODE ON #INVMODE (INV_NO)

    -- client credit terms, one row per trimmed exp_code, values raw (exp_master has no
    -- duplicate codes - checked 2026-10-21 - so this is the row UPDATE ... FROM exp_master
    -- used to join; were one ever duplicated, that UPDATE took an arbitrary row too)
    CREATE TABLE #EXPCP (EXP_CODE NVARCHAR(10) PRIMARY KEY, CREDITPERIOD_SEA NVARCHAR(5), CREDITPERIOD_AIR NVARCHAR(5))
    INSERT INTO #EXPCP (EXP_CODE, CREDITPERIOD_SEA, CREDITPERIOD_AIR)
    SELECT x.EXP_CODE, x.CREDITPERIOD_SEA, x.CREDITPERIOD_AIR
      FROM (SELECT LTRIM(RTRIM(exp_code)) AS EXP_CODE, CREDITPERIOD_SEA, CREDITPERIOD_AIR,
                   ROW_NUMBER() OVER (PARTITION BY LTRIM(RTRIM(exp_code)) ORDER BY exp_code) AS RN
              FROM exp_master
             WHERE exp_code IS NOT NULL) x
     WHERE x.RN = 1

    UPDATE v
       SET CREDIT_PERIOD = L.CP, HAS_TERMS = 1, DUE_DT = DATEADD(DAY, L.CP, v.INV_DT)
      FROM #INV v
      LEFT JOIN #INVMODE m ON m.INV_NO = v.INV_NO
      LEFT JOIN #EXPCP e ON e.EXP_CODE = v.CLIENTCODE
     CROSS APPLY (SELECT CASE WHEN v.PAYBY IS NOT NULL                                -- (a)
                               AND DATEDIFF(DAY, v.INV_DT, v.PAYBY) > 0
                               AND DATEDIFF(DAY, v.INV_DT, v.PAYBY) <= 180
                              THEN DATEDIFF(DAY, v.INV_DT, v.PAYBY)
                              WHEN e.EXP_CODE IS NULL THEN NULL                        -- no master row: (c)
                              WHEN ISNULL(m.MODECH,'1') IN ('2','6')                   -- (b)
                              THEN CASE WHEN ISNUMERIC(LTRIM(RTRIM(ISNULL(e.CREDITPERIOD_AIR,'')))+'.0e0') = 1
                                        THEN CONVERT(INT, CONVERT(FLOAT, LTRIM(RTRIM(e.CREDITPERIOD_AIR)))) END
                              ELSE CASE WHEN ISNUMERIC(LTRIM(RTRIM(ISNULL(e.CREDITPERIOD_SEA,'')))+'.0e0') = 1
                                        THEN CONVERT(INT, CONVERT(FLOAT, LTRIM(RTRIM(e.CREDITPERIOD_SEA)))) END
                         END AS CP) L
     WHERE L.CP > 0                                                                  -- else (c) stands

    ---------------------------------------------------------------------------------
    -- 4. #SETTLE - bill-wise knock-off, set based (no WHILE loop).
    --    Three sources, all keyed to the invoice number:
    --      a) acc_bankdtls  entrytype 'AB' on a receipt (BR/CR)  ~99% of value
    --      b) acc_JournalVoucDtls entrytype 'AB' -> jv_InvoiceNo
    --      c) acc_crtinvoice credit notes
    --    'deduction' is NOT added: on a receipt line it is a debit (bank charges etc),
    --    and 'amount' alone reconciles to totalamt.
    ---------------------------------------------------------------------------------
    -- A credit note is applied only up to what the bill still owes after the cash and
    -- journal knock-offs. A receipt books the GROSS invoice on its AB line and carries the
    -- note as a separate line worth zero (Links receipt 301102610081003 of 08/10/2026:
    -- 53 invoice lines 12,24,988, 29 note lines at zero, 1,76,874 actually banked), so
    -- counting the note again credited the same bill twice - invoice 301102607100956 of
    -- 38,117 showed 76,234 settled. What a note cannot absorb is dropped and is NOT
    -- carried to the client's credit: the cash line already carried it.
    CREATE TABLE #SETTLE (INV_NO VARCHAR(15), ALLOC FLOAT, LASTDT DATETIME, BANKJV FLOAT, CN_USED FLOAT, CN_SPARE FLOAT)

    -- The knock-off lines are staged in #SETTLEX and summed from there. As one statement
    -- the optimizer could only guess how many lines survive the substring date filters (it
    -- planned 128 invoices and got 60k), so its hash aggregate spilled to tempdb and #INV
    -- was probed by ~100k nested-loop seeks (perf 2026-10-21: #SETTLE 1.25 s / 328k reads;
    -- now 0.6 s for the three statements). The lines are exactly the three legs above; the
    -- join to #INV moves to the aggregate, where both sides have real row counts (same
    -- rows, same multiplicity). The receipt headers are staged first (#BRCR) so the bank
    -- leg's hash join is built on a real row count: built on a guess it spilled to tempdb,
    -- and a spilled join hands each invoice's lines to the SUM in an order that depends on
    -- the memory it happened to get. With the spill gone and MAXDOP 1 (a parallel plan
    -- reorders too), every invoice is summed in acc_bankdtls order, the same on every run.
    CREATE TABLE #BRCR (entryno VARCHAR(15), entrydt VARCHAR(10))
    INSERT INTO #BRCR (entryno, entrydt)
    SELECT b.entryno, b.entrydt
      FROM acc_bank b
     WHERE b.status IN ('BR', 'CR')
       AND LEN(ISNULL(b.entrydt, '')) = 10
       AND SUBSTRING(b.entrydt,7,4)+SUBSTRING(b.entrydt,4,2)+SUBSTRING(b.entrydt,1,2) <= @TO_YMD

    CREATE TABLE #SETTLEX (ROWID INT IDENTITY(1, 1) PRIMARY KEY CLUSTERED,
                           BILLNO VARCHAR(15), AMT FLOAT, DT DATETIME, SRC VARCHAR(4))

    INSERT INTO #SETTLEX (BILLNO, AMT, DT, SRC)
    SELECT X.BILLNO, X.AMT, X.DT, X.SRC
      FROM (
            SELECT LTRIM(RTRIM(d.billno)) AS BILLNO,
                   CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(d.amount)), ''), '0')) AS AMT,
                   CASE WHEN ISDATE(SUBSTRING(b.entrydt,7,4)+SUBSTRING(b.entrydt,4,2)+SUBSTRING(b.entrydt,1,2)) = 1 THEN CONVERT(DATETIME, SUBSTRING(b.entrydt,7,4)+SUBSTRING(b.entrydt,4,2)+SUBSTRING(b.entrydt,1,2), 112) END AS DT,
                   'BANK' AS SRC
              FROM acc_bankdtls d
             INNER JOIN #BRCR b ON b.entryno = d.entryno     -- BR / CR receipts up to @TODATE
             -- AB = against bill. AO = against opening: when an AO line names a real invoice
             -- it settles that invoice exactly like AB (the Billwise Receivable statement does
             -- the same); AO lines naming a pre-ERP or opening-balance reference fall out here
             -- because the join below keeps only invoices in scope.
             WHERE d.entrytype IN ('AB', 'AO')
               AND ISNULL(d.billno, '') <> ''

            UNION ALL

            SELECT LTRIM(RTRIM(jd.jv_InvoiceNo)),
                   CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(jd.jv_credit)), ''), '0')),
                   CASE WHEN ISDATE(SUBSTRING(jh.jv_date,7,4)+SUBSTRING(jh.jv_date,4,2)+SUBSTRING(jh.jv_date,1,2)) = 1 THEN CONVERT(DATETIME, SUBSTRING(jh.jv_date,7,4)+SUBSTRING(jh.jv_date,4,2)+SUBSTRING(jh.jv_date,1,2), 112) END,
                   'JV'
              FROM acc_JournalVoucDtls jd
             INNER JOIN acc_JournalVouc jh ON jh.jvcode = jd.jvcode
             WHERE jd.entrytype = 'AB'
               AND ISNULL(jd.jv_InvoiceNo, '') <> ''
               AND LEN(ISNULL(jh.jv_date, '')) = 10
               AND SUBSTRING(jh.jv_date,7,4)+SUBSTRING(jh.jv_date,4,2)+SUBSTRING(jh.jv_date,1,2) <= @TO_YMD

            UNION ALL

            -- A credit note can never knock off more than the note itself is worth.
            -- acc_crtinvoice sometimes carries the FULL INVOICE VALUE on the link row
            -- instead of the amount credited (Links company 30: 64 notes linked for
            -- 1.01cr more than their own value), which silently closed bills that the
            -- Billwise Outstanding statement still shows as pending. The allocation is
            -- therefore scaled down to the note's own total whenever the links exceed it.
            SELECT LTRIM(RTRIM(ci.crt_invno)),
                   CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(ci.crt_amount)), ''), '0'))
                     * CASE WHEN lt.LINKED > CONVERT(FLOAT, ISNULL(cn.totalamt, 0)) AND lt.LINKED > 0
                            THEN CONVERT(FLOAT, ISNULL(cn.totalamt, 0)) / lt.LINKED ELSE 1 END,
                   CASE WHEN ISDATE(SUBSTRING(cn.crt_date,7,4)+SUBSTRING(cn.crt_date,4,2)+SUBSTRING(cn.crt_date,1,2)) = 1 THEN CONVERT(DATETIME, SUBSTRING(cn.crt_date,7,4)+SUBSTRING(cn.crt_date,4,2)+SUBSTRING(cn.crt_date,1,2), 112) END,
                   'CN'
              FROM acc_crtinvoice ci
             INNER JOIN acc_creditnote cn ON LTRIM(RTRIM(cn.crt_no)) = LTRIM(RTRIM(ci.crt_no))
             INNER JOIN (SELECT LTRIM(RTRIM(crt_no)) AS CRT_NO,
                                SUM(CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(crt_amount)), ''), '0'))) AS LINKED
                           FROM acc_crtinvoice
                          GROUP BY LTRIM(RTRIM(crt_no))) lt ON lt.CRT_NO = LTRIM(RTRIM(ci.crt_no))
             WHERE ISNULL(ci.crt_invno, '') <> ''
               AND LEN(ISNULL(cn.crt_date, '')) = 10
               AND SUBSTRING(cn.crt_date,7,4)+SUBSTRING(cn.crt_date,4,2)+SUBSTRING(cn.crt_date,1,2) <= @TO_YMD
           ) X
    OPTION (MAXDOP 1)

    INSERT INTO #SETTLE (INV_NO, ALLOC, LASTDT, BANKJV, CN_USED, CN_SPARE)
    SELECT Y.BILLNO,
           Y.BANKJV + CASE WHEN Y.CNAMT > Y.ROOM THEN Y.ROOM ELSE Y.CNAMT END,
           Y.LASTDT,
           Y.BANKJV,
           CASE WHEN Y.CNAMT > Y.ROOM THEN Y.ROOM ELSE Y.CNAMT END,
           Y.CNAMT - CASE WHEN Y.CNAMT > Y.ROOM THEN Y.ROOM ELSE Y.CNAMT END
      FROM (
    SELECT X.BILLNO,
           SUM(CASE WHEN X.SRC IN ('BANK', 'JV') THEN X.AMT ELSE 0 END) AS BANKJV,
           SUM(CASE WHEN X.SRC = 'CN' THEN X.AMT ELSE 0 END)            AS CNAMT,
           CASE WHEN MAX(v.TOTALAMT) - SUM(CASE WHEN X.SRC IN ('BANK', 'JV') THEN X.AMT ELSE 0 END) > 0
                THEN MAX(v.TOTALAMT) - SUM(CASE WHEN X.SRC IN ('BANK', 'JV') THEN X.AMT ELSE 0 END)
                ELSE 0 END                                              AS ROOM,
           MAX(X.DT)                                                    AS LASTDT
      FROM #SETTLEX X
     INNER JOIN #INV v ON v.INV_NO = X.BILLNO
     GROUP BY X.BILLNO
           ) Y
    OPTION (MAXDOP 1)

    CREATE CLUSTERED INDEX IX_SETTLE ON #SETTLE (INV_NO)

    ---------------------------------------------------------------------------------
    -- 5. #OPEN - open items as-on @TODATE (this is the receivable)
    ---------------------------------------------------------------------------------
    CREATE TABLE #OPEN
    (
        INV_NO       VARCHAR(15),
        CLIENTCODE   VARCHAR(10),
        INV_DT       DATETIME,
        DUE_DT       DATETIME,
        PENDING      FLOAT,
        PENDING_DAYS INT,
        OVERDUE_DAYS INT
    )

    INSERT INTO #OPEN (INV_NO, CLIENTCODE, INV_DT, DUE_DT, PENDING, PENDING_DAYS, OVERDUE_DAYS)
    SELECT v.INV_NO, v.CLIENTCODE, v.INV_DT, v.DUE_DT,
           v.TOTALAMT - ISNULL(s.ALLOC, 0),
           DATEDIFF(DAY, v.INV_DT, @ASON),
           DATEDIFF(DAY, v.DUE_DT, @ASON)
      FROM #INV v
      LEFT JOIN #SETTLE s ON s.INV_NO = v.INV_NO
     WHERE v.TOTALAMT - ISNULL(s.ALLOC, 0) > 0.01

    CREATE CLUSTERED INDEX IX_OPEN ON #OPEN (CLIENTCODE)

    ---------------------------------------------------------------------------------
    -- 5b. #UNADJ - client credits that were never applied against a bill.
    --
    --     Bill-wise pending on its own badly OVERSTATES the receivable: for company 01
    --     only 1,258cr of 1,386cr of client receipts carry entrytype 'AB'.  The rest
    --     (GR 71.7cr general, OA 50.0cr on-account, AO 6.4cr adjustment) settle the
    --     customer without ever naming an invoice, so those invoices sit "open" for
    --     ever.  Ignoring this produced 170.8cr of outstanding, 97% of it overdue.
    --
    --     Same convention as usp_Acct_Rpt_Outstanding_ClientBill_35_Branch:
    --         net receivable = pending on bills - unadjusted credits
    --     and ADVANCE ('AD') is held separately rather than netted, matching the
    --     existing ledger and receivable reports.
    ---------------------------------------------------------------------------------
    ---------------------------------------------------------------------------------
    -- #CNFREE - credit notes that name no invoice at all: acc_crtinvoice carries no
    -- crt_invno row for the note, so there is nothing for the knock-off to attach to and
    -- the bill behind it stays fully open for ever. Links Mumbai holds 561 such notes
    -- worth 93.66 lakh, and one client - THE KAY-CEE AGENCIES - held 52.81 lakh of them
    -- while its Account Statement showed the account square. The money is genuinely the
    -- client's, so it joins the on-account pool, and it is reported on its own line so
    -- Accounts can see what to go back and link.
    ---------------------------------------------------------------------------------
    -- the notes that ARE linked, trimmed once: as a correlated NOT EXISTS the optimizer
    -- expected 8 notes and re-scanned and re-trimmed acc_crtinvoice for each of the ~2,200
    -- (perf 2026-10-21: #CNFREE 0.71 s / 65k reads; now 0.01 s)
    CREATE TABLE #CNLINK (CRT_NO VARCHAR(15) PRIMARY KEY)
    INSERT INTO #CNLINK (CRT_NO)
    SELECT DISTINCT LTRIM(RTRIM(ci.crt_no))
      FROM acc_crtinvoice ci
     WHERE ISNULL(ci.crt_invno, '') <> ''
       AND ci.crt_no IS NOT NULL

    CREATE TABLE #CNFREE (CLIENTCODE VARCHAR(10), NOTES INT, AMT FLOAT)
    INSERT INTO #CNFREE (CLIENTCODE, NOTES, AMT)
    SELECT LTRIM(RTRIM(cn.crt_client)), COUNT(*), SUM(CONVERT(FLOAT, ISNULL(cn.totalamt, 0)))
      FROM acc_creditnote cn
     INNER JOIN #CITY ct ON ct.CITYCODE = LTRIM(RTRIM(cn.citycode))
     WHERE LTRIM(RTRIM(ISNULL(cn.cmpcode, ''))) = @CMPCODE
       AND LTRIM(RTRIM(ISNULL(cn.crt_client, ''))) LIKE 'E%'
       AND LEN(ISNULL(cn.crt_date, '')) = 10
       AND SUBSTRING(cn.crt_date,7,4)+SUBSTRING(cn.crt_date,4,2)+SUBSTRING(cn.crt_date,1,2) <= @TO_YMD
       AND CONVERT(FLOAT, ISNULL(cn.totalamt, 0)) > 0.01
       AND (@CLIENTCODE = '' OR LTRIM(RTRIM(cn.crt_client)) = @CLIENTCODE)
       AND NOT EXISTS (SELECT 1 FROM #CNLINK k WHERE k.CRT_NO = LTRIM(RTRIM(cn.crt_no)))
     GROUP BY LTRIM(RTRIM(cn.crt_client))
    CREATE CLUSTERED INDEX IX_CNFREE ON #CNFREE (CLIENTCODE)

    CREATE TABLE #UNADJ (CLIENTCODE VARCHAR(10), UNADJUSTED FLOAT, ADVANCE FLOAT)

    INSERT INTO #UNADJ (CLIENTCODE, UNADJUSTED, ADVANCE)
    SELECT Z.CLIENTCODE, SUM(Z.UNADJ), SUM(Z.ADV)
      FROM (
            SELECT LTRIM(RTRIM(d.client)) AS CLIENTCODE,
                   CASE WHEN d.entrytype = 'AD' THEN 0
                        ELSE CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(d.amount)), ''), '0')) END AS UNADJ,
                   CASE WHEN d.entrytype = 'AD'
                        THEN CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(d.amount)), ''), '0')) ELSE 0 END AS ADV
              FROM acc_bankdtls d
             INNER JOIN acc_bank b ON b.entryno = d.entryno
             INNER JOIN #CITY ct ON ct.CITYCODE = LTRIM(RTRIM(b.citycode))
             WHERE b.status IN ('BR', 'CR')
               -- 'PE' lines are supplier payments that happen to carry a client code;
               -- they are money going OUT and must not be read as credit from a customer.
               -- not money on account: AB and AO settle bills or the opening balance (the
               -- Billwise statement folds opening-balance AO into its "OP. BALANCE" line, and
               -- that opening is not part of these figures); PE and JB are payment lines
               -- that happen to carry a client code
               AND ISNULL(d.entrytype, '') NOT IN ('AB', 'PE', 'AO', 'JB')
               AND LTRIM(RTRIM(ISNULL(d.client, ''))) LIKE 'E%'
               AND SUBSTRING(d.entryno, 1, 2) = @CMPCODE
               AND LEN(ISNULL(b.entrydt, '')) = 10
               AND SUBSTRING(b.entrydt,7,4)+SUBSTRING(b.entrydt,4,2)+SUBSTRING(b.entrydt,1,2) <= @TO_YMD
               AND (@CLIENTCODE = '' OR LTRIM(RTRIM(d.client)) = @CLIENTCODE)

            UNION ALL

            -- opening balance brought forward that stands in the client's favour
            SELECT n.CLIENTCODE, -n.NETAMT, 0
              FROM #OPNET n
             WHERE n.NETAMT < -0.01
               AND (@CLIENTCODE = '' OR n.CLIENTCODE = @CLIENTCODE)

            UNION ALL

            -- cash or a journal applied to a bill beyond its face value is unadjusted too.
            -- Only those two legs count: a credit note that over-reaches its bill is a
            -- posting artefact, not money owed back to the client (see #SETTLE above).
            SELECT v.CLIENTCODE, s.BANKJV - v.TOTALAMT, 0
              FROM #INV v
             INNER JOIN #SETTLE s ON s.INV_NO = v.INV_NO
             WHERE s.BANKJV - v.TOTALAMT > 0.01

            UNION ALL

            -- credit notes that were never linked to any bill
            SELECT f.CLIENTCODE, f.AMT, 0 FROM #CNFREE f

            UNION ALL

            -- bad debts nullified by journal, waivers, balances moved off a client
            SELECT j.CLIENTCODE, j.NETCR, 0 FROM #JVADJ j
             WHERE j.NETCR > 0.01
           ) Z
     GROUP BY Z.CLIENTCODE

    CREATE CLUSTERED INDEX IX_UNADJ ON #UNADJ (CLIENTCODE)

    ---------------------------------------------------------------------------------
    -- 5c. #AGE - ageing buckets per client, GROSS and NET.
    --
    --     Gross buckets alone are misleading here: the old invoices sit in the aged
    --     buckets while the credits that actually paid them (GR/OA/AO, 131cr) were
    --     never applied to a bill, so almost every client looked 100% over-365.
    --     Unapplied credit is therefore allocated OLDEST FIRST, which is how a
    --     receipt would have been applied had it named a bill.
    --
    --     Closed form, no loop: with CUM_k = the running total from the oldest bucket
    --     through bucket k, the amount surviving in bucket k is
    --          MAX(0, MIN(B_k, CUM_k - CREDIT))
    ---------------------------------------------------------------------------------
    CREATE TABLE #AGE
    (
        CLIENTCODE VARCHAR(10),
        B1 FLOAT, B2 FLOAT, B3 FLOAT, B4 FLOAT, B5 FLOAT,
        B6 FLOAT, B7 FLOAT, B8 FLOAT, B9 FLOAT,
        N1 FLOAT, N2 FLOAT, N3 FLOAT, N4 FLOAT, N5 FLOAT,
        N6 FLOAT, N7 FLOAT, N8 FLOAT, N9 FLOAT
    )

    INSERT INTO #AGE (CLIENTCODE, B1, B2, B3, B4, B5, B6, B7, B8, B9,
                                  N1, N2, N3, N4, N5, N6, N7, N8, N9)
    SELECT G.CLIENTCODE, G.B1, G.B2, G.B3, G.B4, G.B5, G.B6, G.B7, G.B8, G.B9,
           -- CUM is built from the OLDEST bucket (B9) downwards
           CASE WHEN G.B1 < G.B1+G.B2+G.B3+G.B4+G.B5+G.B6+G.B7+G.B8+G.B9 - G.CR
                THEN G.B1 ELSE G.B1+G.B2+G.B3+G.B4+G.B5+G.B6+G.B7+G.B8+G.B9 - G.CR END,
           CASE WHEN G.B2 <    G.B2+G.B3+G.B4+G.B5+G.B6+G.B7+G.B8+G.B9 - G.CR
                THEN G.B2 ELSE G.B2+G.B3+G.B4+G.B5+G.B6+G.B7+G.B8+G.B9 - G.CR END,
           CASE WHEN G.B3 <       G.B3+G.B4+G.B5+G.B6+G.B7+G.B8+G.B9 - G.CR
                THEN G.B3 ELSE    G.B3+G.B4+G.B5+G.B6+G.B7+G.B8+G.B9 - G.CR END,
           CASE WHEN G.B4 <          G.B4+G.B5+G.B6+G.B7+G.B8+G.B9 - G.CR
                THEN G.B4 ELSE       G.B4+G.B5+G.B6+G.B7+G.B8+G.B9 - G.CR END,
           CASE WHEN G.B5 <             G.B5+G.B6+G.B7+G.B8+G.B9 - G.CR
                THEN G.B5 ELSE          G.B5+G.B6+G.B7+G.B8+G.B9 - G.CR END,
           CASE WHEN G.B6 <                G.B6+G.B7+G.B8+G.B9 - G.CR
                THEN G.B6 ELSE             G.B6+G.B7+G.B8+G.B9 - G.CR END,
           CASE WHEN G.B7 <                   G.B7+G.B8+G.B9 - G.CR
                THEN G.B7 ELSE                G.B7+G.B8+G.B9 - G.CR END,
           CASE WHEN G.B8 <                      G.B8+G.B9 - G.CR
                THEN G.B8 ELSE                   G.B8+G.B9 - G.CR END,
           CASE WHEN G.B9 <                         G.B9 - G.CR
                THEN G.B9 ELSE                      G.B9 - G.CR END
      FROM (
            SELECT o.CLIENTCODE,
                   SUM(CASE WHEN o.PENDING_DAYS BETWEEN 0    AND 30   THEN o.PENDING ELSE 0 END) AS B1,
                   SUM(CASE WHEN o.PENDING_DAYS BETWEEN 31   AND 60   THEN o.PENDING ELSE 0 END) AS B2,
                   SUM(CASE WHEN o.PENDING_DAYS BETWEEN 61   AND 90   THEN o.PENDING ELSE 0 END) AS B3,
                   SUM(CASE WHEN o.PENDING_DAYS BETWEEN 91   AND 120  THEN o.PENDING ELSE 0 END) AS B4,
                   SUM(CASE WHEN o.PENDING_DAYS BETWEEN 121  AND 180  THEN o.PENDING ELSE 0 END) AS B5,
                   SUM(CASE WHEN o.PENDING_DAYS BETWEEN 181  AND 365  THEN o.PENDING ELSE 0 END) AS B6,
                   SUM(CASE WHEN o.PENDING_DAYS BETWEEN 366  AND 730  THEN o.PENDING ELSE 0 END) AS B7,
                   SUM(CASE WHEN o.PENDING_DAYS BETWEEN 731  AND 1095 THEN o.PENDING ELSE 0 END) AS B8,
                   SUM(CASE WHEN o.PENDING_DAYS > 1095                THEN o.PENDING ELSE 0 END) AS B9,
                   ISNULL(MAX(ua.UNADJUSTED), 0) AS CR
              FROM #OPEN o
              LEFT JOIN #UNADJ ua ON ua.CLIENTCODE = o.CLIENTCODE
             GROUP BY o.CLIENTCODE
           ) G

    -- the closed form can go negative when credit exceeds the bucket; floor at zero
    UPDATE #AGE SET N1 = CASE WHEN N1 > 0 THEN N1 ELSE 0 END,
                    N2 = CASE WHEN N2 > 0 THEN N2 ELSE 0 END,
                    N3 = CASE WHEN N3 > 0 THEN N3 ELSE 0 END,
                    N4 = CASE WHEN N4 > 0 THEN N4 ELSE 0 END,
                    N5 = CASE WHEN N5 > 0 THEN N5 ELSE 0 END,
                    N6 = CASE WHEN N6 > 0 THEN N6 ELSE 0 END,
                    N7 = CASE WHEN N7 > 0 THEN N7 ELSE 0 END,
                    N8 = CASE WHEN N8 > 0 THEN N8 ELSE 0 END,
                    N9 = CASE WHEN N9 > 0 THEN N9 ELSE 0 END

    CREATE CLUSTERED INDEX IX_AGE ON #AGE (CLIENTCODE)

    ---------------------------------------------------------------------------------
    -- #FYO - the receivable split by the financial year the BILL belongs to
    --        (April to March; FY_START 2026 means 01/04/2026 - 31/03/2027).
    --        Unapplied client credit is set against the OLDEST year first, by the same
    --        closed form the ageing buckets use, so the years add back to exactly the
    --        outstanding and overdue on the card. Credit is still netted client by
    --        client: one client's money never clears another client's year.
    --        The pre-go-live opening balance falls in the year of the opening date and
    --        is reported separately in OPENING_PART so it can be recognised on screen.
    ---------------------------------------------------------------------------------
    CREATE TABLE #FYO
    (
        CLIENTCODE    VARCHAR(10),
        FY_START      INT,
        BILLS         INT,
        GROSS         FLOAT,
        OVERDUE_GROSS FLOAT,
        OPENING       FLOAT,
        NETOUT        FLOAT,
        NETOVER       FLOAT,
        OLDEST_DT     DATETIME      -- the oldest bill of that client still open in that year
    )

    INSERT INTO #FYO (CLIENTCODE, FY_START, BILLS, GROSS, OVERDUE_GROSS, OPENING, NETOUT, NETOVER, OLDEST_DT)
    SELECT o.CLIENTCODE,
           CASE WHEN MONTH(v.INV_DT) >= 4 THEN YEAR(v.INV_DT) ELSE YEAR(v.INV_DT) - 1 END,
           COUNT(*),
           SUM(o.PENDING),
           SUM(CASE WHEN o.OVERDUE_DAYS > 0 THEN o.PENDING ELSE 0 END),
           SUM(CASE WHEN o.INV_NO LIKE 'OPBAL-%' THEN o.PENDING ELSE 0 END),
           0, 0,
           MIN(v.INV_DT)
      FROM #OPEN o
     INNER JOIN #INV v ON v.INV_NO = o.INV_NO
     GROUP BY o.CLIENTCODE,
              CASE WHEN MONTH(v.INV_DT) >= 4 THEN YEAR(v.INV_DT) ELSE YEAR(v.INV_DT) - 1 END

    -- A year keeps its own pending, capped by (that year plus every OLDER year) less
    -- the client's unapplied credit, and never below zero. Summed over the years that
    -- comes to total pending less the credit - the same answer as #CLI and #AGE.
    UPDATE f
       SET NETOUT  = CASE WHEN x.GROSS_INCL_OLDER - ISNULL(ua.UNADJUSTED, 0) < f.GROSS
                          THEN x.GROSS_INCL_OLDER - ISNULL(ua.UNADJUSTED, 0) ELSE f.GROSS END,
           NETOVER = CASE WHEN x.OVER_INCL_OLDER  - ISNULL(ua.UNADJUSTED, 0) < f.OVERDUE_GROSS
                          THEN x.OVER_INCL_OLDER  - ISNULL(ua.UNADJUSTED, 0) ELSE f.OVERDUE_GROSS END
      FROM #FYO f
     INNER JOIN (SELECT a.CLIENTCODE, a.FY_START,
                        SUM(b.GROSS)         AS GROSS_INCL_OLDER,
                        SUM(b.OVERDUE_GROSS) AS OVER_INCL_OLDER
                   FROM #FYO a
                  INNER JOIN #FYO b ON b.CLIENTCODE = a.CLIENTCODE AND b.FY_START <= a.FY_START
                  GROUP BY a.CLIENTCODE, a.FY_START) x
        ON x.CLIENTCODE = f.CLIENTCODE AND x.FY_START = f.FY_START
      LEFT JOIN #UNADJ ua ON ua.CLIENTCODE = f.CLIENTCODE

    UPDATE #FYO SET NETOUT  = 0 WHERE NETOUT  < 0
    UPDATE #FYO SET NETOVER = 0 WHERE NETOVER < 0

    CREATE CLUSTERED INDEX IX_FYO ON #FYO (CLIENTCODE, FY_START)


    ---------------------------------------------------------------------------------
    -- 6. #COLL - actual collection days, PERIOD bound.
    --    Per invoice raised in the period and since settled:
    --        days = invoice date -> date of the last allocation against it.
    --    Value weighted per client, because a few small stale bills badly distort a
    --    simple mean.  Negative days are real (clients who pay before invoicing) and
    --    are preserved, then flagged, rather than floored to zero.
    ---------------------------------------------------------------------------------
    CREATE TABLE #COLL
    (
        CLIENTCODE    VARCHAR(10),
        BILLS         INT,
        SETTLED_AMT   FLOAT,
        DAYS_WTD      FLOAT,
        DAYS_SIMPLE   FLOAT,
        MIN_DAYS      INT,
        MAX_DAYS      INT
    )

    -- per-invoice recovery days (the set behind #COLL); kept so the KPI row can name
    -- the single fastest / slowest bill without re-scanning #INV x #SETTLE
    CREATE TABLE #COLLX (INV_NO VARCHAR(15), CLIENTCODE VARCHAR(10), DAYS INT, ALLOC FLOAT)

    INSERT INTO #COLLX (INV_NO, CLIENTCODE, DAYS, ALLOC)
    SELECT v.INV_NO, v.CLIENTCODE, DATEDIFF(DAY, v.INV_DT, s.LASTDT), s.ALLOC
      FROM #INV v
     INNER JOIN #SETTLE s ON s.INV_NO = v.INV_NO
     WHERE v.IN_PERIOD = 1
       AND s.LASTDT IS NOT NULL
       AND s.ALLOC > 0.01

    INSERT INTO #COLL (CLIENTCODE, BILLS, SETTLED_AMT, DAYS_WTD, DAYS_SIMPLE, MIN_DAYS, MAX_DAYS)
    SELECT x.CLIENTCODE,
           COUNT(*),
           SUM(x.ALLOC),
           CASE WHEN SUM(x.ALLOC) <> 0
                THEN SUM(x.DAYS * x.ALLOC) / SUM(x.ALLOC) END,
           AVG(CONVERT(FLOAT, x.DAYS)),
           MIN(x.DAYS),
           MAX(x.DAYS)
      FROM #COLLX x
     GROUP BY x.CLIENTCODE

    CREATE CLUSTERED INDEX IX_COLL ON #COLL (CLIENTCODE)

    ---------------------------------------------------------------------------------
    -- 7. #JOBEXP - unbilled = expense booked against a job that has NOT been invoiced.
    --    PERIOD bound on the job date, matching the existing Pending-Invoicing report.
    --    Three expense sources; receipts (BR/CR) are deliberately excluded.
    ---------------------------------------------------------------------------------
    CREATE TABLE #JOBS
    (
        JOBNO        VARCHAR(25),
        MODE_        VARCHAR(10),
        CLIENTCODE   VARCHAR(10),
        JOB_DT       DATETIME,
        SERVICE_TYPE VARCHAR(25),   -- short codes: FFD = Freight Forwarding, CCLR = Custom Clearance,
                                    -- EX = Exwork, FFD+CCLR = both legs, MISC, UNCLASS (UI expands them)
        SERVICE_SRC  VARCHAR(12),
        JOB_CLASS    VARCHAR(10),
        IS_BILLED    BIT,
        -- CLIENTCODE above is the party ON THE JOB FILE (bill-to, else exporter).
        -- BILLCLIENT is who the invoice was actually raised on. On nomination /
        -- freight-collect export work these differ: the shipper is one company and
        -- the overseas agent pays. Receivables, the ledger and Outstanding all speak
        -- of the BILLED party, so margin has to be able to speak of it too.
        BILLCLIENT   VARCHAR(10)
    )

    -- exports: EXPT_MASTER, sea + air, excluding cancelled
    INSERT INTO #JOBS (JOBNO, MODE_, CLIENTCODE, JOB_DT, SERVICE_TYPE, SERVICE_SRC, JOB_CLASS, IS_BILLED)
    SELECT LTRIM(RTRIM(e.exptno)),
           CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(e.expt_mode,'')))) = 'air' THEN 'AIR EXPORT' ELSE 'SEA EXPORT' END,
           LTRIM(RTRIM(ISNULL(NULLIF(LTRIM(RTRIM(ISNULL(e.expt_billto,''))), ''), e.expt_exporter))),
           CASE WHEN ISDATE(SUBSTRING(e.expt_docrecd,7,4)+SUBSTRING(e.expt_docrecd,4,2)+SUBSTRING(e.expt_docrecd,1,2)) = 1 THEN CONVERT(DATETIME, SUBSTRING(e.expt_docrecd,7,4)+SUBSTRING(e.expt_docrecd,4,2)+SUBSTRING(e.expt_docrecd,1,2), 112) END,
           'UNCLASS', 'NONE', 'SHIPMENT', 0
      FROM EXPT_MASTER e
     INNER JOIN #CITY c ON c.CITYCODE = LTRIM(RTRIM(e.citycode))
     WHERE LTRIM(RTRIM(ISNULL(e.cmpcode, ''))) = @CMPCODE
       AND LEN(ISNULL(e.expt_docrecd, '')) = 10
       AND SUBSTRING(e.expt_docrecd,7,4)+SUBSTRING(e.expt_docrecd,4,2)+SUBSTRING(e.expt_docrecd,1,2)
           BETWEEN @FROM_YMD AND @TO_YMD
       AND LTRIM(RTRIM(ISNULL(e.exptcancel, ''))) = ''

    -- imports: TBL_IMP_IMPORT read directly (the VW35 view fans out sea jobs via containers)
    INSERT INTO #JOBS (JOBNO, MODE_, CLIENTCODE, JOB_DT, SERVICE_TYPE, SERVICE_SRC, JOB_CLASS, IS_BILLED)
    SELECT LTRIM(RTRIM(i.Import_Code)),
           CASE WHEN LTRIM(RTRIM(ISNULL(i.Mode,''))) = 'Air' THEN 'AIR IMPORT' ELSE 'SEA IMPORT' END,
           LTRIM(RTRIM(ISNULL(NULLIF(LTRIM(RTRIM(ISNULL(i.fk_BillTo,''))), ''), i.fk_Imp_Code))),
           i.Import_Date, 'UNCLASS', 'NONE', 'SHIPMENT', 0
      FROM TBL_IMP_IMPORT i
     INNER JOIN CITY ct ON LTRIM(RTRIM(ct.citycode1)) = LTRIM(RTRIM(i.citycode1))
     INNER JOIN #CITY c  ON c.CITYCODE = LTRIM(RTRIM(ct.citycode))
     WHERE LTRIM(RTRIM(ISNULL(i.cmp_code, ''))) = @CMPCODE
       AND i.Import_Date >= @FROMDT
       AND i.Import_Date < DATEADD(DAY, 1, @ASON)
       AND LTRIM(RTRIM(ISNULL(i.Doc_Cancel, 'N'))) <> 'Y'

    -- misc / non-shipment jobs: EXPT_MASTER_MISC (type digits 3, 7, 9 at position 8).
    -- These were missing from the dashboard entirely, yet they carry real invoiced
    -- value (~44M in FY2025-26 across 1,226 jobs), so margin and the funnel understated
    -- without them. MAKER_Date is the period key on purpose: DOCRECPTDT is 0% populated
    -- on types 7 and 9. CITYCODE here is already the 3-letter form, so #CITY joins
    -- directly with no CITY hop (unlike the import leg).
    INSERT INTO #JOBS (JOBNO, MODE_, CLIENTCODE, JOB_DT, SERVICE_TYPE, SERVICE_SRC, JOB_CLASS, IS_BILLED)
    SELECT LTRIM(RTRIM(m.JOBNO)),
           'MISC',
           LTRIM(RTRIM(ISNULL(m.CLIENT_CODE, ''))),
           m.MAKER_Date,
           'MISC', 'NONE', 'MISC', 0
      FROM EXPT_MASTER_MISC m
     INNER JOIN #CITY c ON c.CITYCODE = LTRIM(RTRIM(m.CITYCODE))
     WHERE LTRIM(RTRIM(ISNULL(m.CMPCODE, ''))) = @CMPCODE
       AND ISNULL(m.JOBNO, '') <> ''
       AND m.MAKER_Date >= @FROMDT
       AND m.MAKER_Date <  DATEADD(DAY, 1, @ASON)

    -- indexed here, not after the client filter: every NOT EXISTS in the carry-in
    -- block below probes #JOBS, and without the index they scan it once per master row
    CREATE CLUSTERED INDEX IX_JOBS ON #JOBS (JOBNO)

    ---------------------------------------------------------------------------------
    -- Jobs opened BEFORE the period but invoiced INSIDE it. A shipment handled in
    -- March and billed in April belongs to this period's recovery: the invoice is in
    -- Receivables, so its job must be on Margin too, or a client search shows bills
    -- whose job cannot be found (Links FY2026-27: 883 invoices, 612 jobs, 10.07 Cr).
    -- Same three masters, same company / branch / cancelled filters - only the job-date
    -- window is lifted, and only for jobs that carry an invoice raised in the period.
    ---------------------------------------------------------------------------------
    -- from #IJN (trimmed acc_invjobno; perf 2026-10-21: 0.77 s / 218k reads, now 0.08 s)
    CREATE TABLE #INVJOBPD (JOBNO VARCHAR(25))
    INSERT INTO #INVJOBPD (JOBNO)
    SELECT DISTINCT jn.JOBNO
      FROM #IJN jn
     INNER JOIN #INV v ON v.INV_NO = jn.INV_NO AND v.IN_PERIOD = 1
     WHERE ISNULL(jn.JOBNO, '') <> ''
       AND NOT EXISTS (SELECT 1 FROM #JOBS j WHERE j.JOBNO = jn.JOBNO)
    CREATE CLUSTERED INDEX IX_INVJOBPD ON #INVJOBPD (JOBNO)

    -- EXPT_MASTER is 16k pages of wide rows and the join below is on LTRIM(RTRIM(exptno)),
    -- so it was scanned whole for ~500 jobs (perf 2026-10-21: 0.23 s; now 0.02 s). The
    -- exptno values of those jobs, exactly as stored, are found first on the narrow exptno
    -- index (140 pages); the INSERT then seeks them. DISTINCT keeps one spelling per value
    -- that = treats as equal, so no EXPT_MASTER row can match twice; the trimmed join to
    -- #INVJOBPD stays.
    CREATE TABLE #EXK (exptno VARCHAR(25) PRIMARY KEY)
    INSERT INTO #EXK (exptno)
    SELECT DISTINCT e.exptno
      FROM EXPT_MASTER e
     WHERE LTRIM(RTRIM(e.exptno)) IN (SELECT JOBNO FROM #INVJOBPD)

    INSERT INTO #JOBS (JOBNO, MODE_, CLIENTCODE, JOB_DT, SERVICE_TYPE, SERVICE_SRC, JOB_CLASS, IS_BILLED)
    SELECT LTRIM(RTRIM(e.exptno)),
           CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(e.expt_mode,'')))) = 'air' THEN 'AIR EXPORT' ELSE 'SEA EXPORT' END,
           LTRIM(RTRIM(ISNULL(NULLIF(LTRIM(RTRIM(ISNULL(e.expt_billto,''))), ''), e.expt_exporter))),
           CASE WHEN ISDATE(SUBSTRING(e.expt_docrecd,7,4)+SUBSTRING(e.expt_docrecd,4,2)+SUBSTRING(e.expt_docrecd,1,2)) = 1 THEN CONVERT(DATETIME, SUBSTRING(e.expt_docrecd,7,4)+SUBSTRING(e.expt_docrecd,4,2)+SUBSTRING(e.expt_docrecd,1,2), 112) END,
           'UNCLASS', 'NONE', 'SHIPMENT', 0
      FROM EXPT_MASTER e
     INNER JOIN #EXK k ON k.exptno = e.exptno
     INNER JOIN #INVJOBPD p ON p.JOBNO = LTRIM(RTRIM(e.exptno))
     INNER JOIN #CITY c ON c.CITYCODE = LTRIM(RTRIM(e.citycode))
     WHERE LTRIM(RTRIM(ISNULL(e.cmpcode, ''))) = @CMPCODE
       AND LTRIM(RTRIM(ISNULL(e.exptcancel, ''))) = ''

    DELETE FROM #INVJOBPD WHERE EXISTS (SELECT 1 FROM #JOBS j WHERE j.JOBNO = #INVJOBPD.JOBNO)

    INSERT INTO #JOBS (JOBNO, MODE_, CLIENTCODE, JOB_DT, SERVICE_TYPE, SERVICE_SRC, JOB_CLASS, IS_BILLED)
    SELECT LTRIM(RTRIM(i.Import_Code)),
           CASE WHEN LTRIM(RTRIM(ISNULL(i.Mode,''))) = 'Air' THEN 'AIR IMPORT' ELSE 'SEA IMPORT' END,
           LTRIM(RTRIM(ISNULL(NULLIF(LTRIM(RTRIM(ISNULL(i.fk_BillTo,''))), ''), i.fk_Imp_Code))),
           i.Import_Date, 'UNCLASS', 'NONE', 'SHIPMENT', 0
      FROM TBL_IMP_IMPORT i
     INNER JOIN #INVJOBPD p ON p.JOBNO = LTRIM(RTRIM(i.Import_Code))
     INNER JOIN CITY ct ON LTRIM(RTRIM(ct.citycode1)) = LTRIM(RTRIM(i.citycode1))
     INNER JOIN #CITY c  ON c.CITYCODE = LTRIM(RTRIM(ct.citycode))
     WHERE LTRIM(RTRIM(ISNULL(i.cmp_code, ''))) = @CMPCODE
       AND LTRIM(RTRIM(ISNULL(i.Doc_Cancel, 'N'))) <> 'Y'

    DELETE FROM #INVJOBPD WHERE EXISTS (SELECT 1 FROM #JOBS j WHERE j.JOBNO = #INVJOBPD.JOBNO)

    INSERT INTO #JOBS (JOBNO, MODE_, CLIENTCODE, JOB_DT, SERVICE_TYPE, SERVICE_SRC, JOB_CLASS, IS_BILLED)
    SELECT LTRIM(RTRIM(m.JOBNO)), 'MISC', LTRIM(RTRIM(ISNULL(m.CLIENT_CODE, ''))),
           m.MAKER_Date, 'MISC', 'NONE', 'MISC', 0
      FROM EXPT_MASTER_MISC m
     INNER JOIN #INVJOBPD p ON p.JOBNO = LTRIM(RTRIM(m.JOBNO))
     INNER JOIN #CITY c ON c.CITYCODE = LTRIM(RTRIM(m.CITYCODE))
     WHERE LTRIM(RTRIM(ISNULL(m.CMPCODE, ''))) = @CMPCODE
       AND ISNULL(m.JOBNO, '') <> ''

    ---------------------------------------------------------------------------------
    -- Who was actually billed for each job. A job can be invoiced to more than one
    -- party (part charges to the shipper, freight to the agent); the party carrying
    -- the largest invoice value wins, which is the one a person would name if asked
    -- "who is this job billed to". Jobs with no invoice keep the job-file party.
    ---------------------------------------------------------------------------------
    -- every party invoiced on each job, kept in full: #JOBBILL names only the biggest,
    -- but a client drill has to keep a job the client was billed on even when another
    -- party carried the larger invoice (job 301102610002713: Torrent 36,199 and Team
    -- Leader Logistics 42,706 - a Torrent drill was losing the job entirely).
    -- #JIV - the acc_invoice rows of every invoice that names a job in #JOBS, with the
    -- invoice number trimmed once. #JOBCLI, #INVJOB and #JOBINVDT each joined the whole
    -- of acc_invoice on LTRIM(RTRIM(inv_no)) and planned on guessed row counts (perf
    -- 2026-10-21: 0.33 + 0.27 + 0.45 s; now 0.10 + 0.04 + 0.04 s, and 0.07 s to build
    -- #JIV; #JOBINV keeps its own join, see #IJN). Every
    -- acc_invoice row whose number matches such a job's invoice is kept, duplicates
    -- included, so each join below returns exactly the rows it did against acc_invoice.
    -- Built before the client-drill DELETE on #JOBS, so it covers the smaller #JOBS used
    -- after it too.
    CREATE TABLE #JIV (INV_NO VARCHAR(15), inv_client VARCHAR(10), totalamt DECIMAL(18,2),
                       cmpcode VARCHAR(10), inv_date VARCHAR(10))
    INSERT INTO #JIV (INV_NO, inv_client, totalamt, cmpcode, inv_date)
    SELECT LTRIM(RTRIM(iv.inv_no)), iv.inv_client, iv.totalamt, iv.cmpcode, iv.inv_date
      FROM acc_invoice iv
     WHERE LTRIM(RTRIM(iv.inv_no)) IN (SELECT jn.INV_NO FROM #IJN jn INNER JOIN #JOBS j ON j.JOBNO = jn.JOBNO)
    CREATE CLUSTERED INDEX IX_JIV ON #JIV (INV_NO)

    CREATE TABLE #JOBCLI (JOBNO VARCHAR(25), CLIENTCODE VARCHAR(10), AMT FLOAT)

    INSERT INTO #JOBCLI (JOBNO, CLIENTCODE, AMT)
    SELECT jn.JOBNO,
           LTRIM(RTRIM(iv.inv_client)),
           SUM(CONVERT(FLOAT, ISNULL(iv.totalamt, 0)))
      FROM #IJN jn
     INNER JOIN #JOBS j ON j.JOBNO = jn.JOBNO
     INNER JOIN #JIV iv ON iv.INV_NO = jn.INV_NO
     WHERE LTRIM(RTRIM(ISNULL(iv.inv_client, ''))) LIKE 'E%'
     GROUP BY jn.JOBNO, LTRIM(RTRIM(iv.inv_client))

    CREATE CLUSTERED INDEX IX_JOBCLI ON #JOBCLI (JOBNO, CLIENTCODE)

    CREATE TABLE #JOBBILL (JOBNO VARCHAR(25), CLIENTCODE VARCHAR(10))

    INSERT INTO #JOBBILL (JOBNO, CLIENTCODE)
    SELECT R.JOBNO, R.CLIENTCODE
      FROM (
            SELECT X.JOBNO, X.CLIENTCODE,
                   ROW_NUMBER() OVER (PARTITION BY X.JOBNO ORDER BY X.AMT DESC, X.CLIENTCODE) AS RN
              FROM #JOBCLI X
           ) R
     WHERE R.RN = 1

    CREATE CLUSTERED INDEX IX_JOBBILL ON #JOBBILL (JOBNO)

    UPDATE J SET BILLCLIENT = J.CLIENTCODE FROM #JOBS J
    UPDATE J SET BILLCLIENT = B.CLIENTCODE FROM #JOBS J INNER JOIN #JOBBILL B ON B.JOBNO = J.JOBNO

    -- a single-client drill keeps the job whether the client shipped it, is the main
    -- billed party, or simply holds one of the invoices on it
    DELETE FROM #JOBS
     WHERE @CLIENTCODE <> '' AND CLIENTCODE <> @CLIENTCODE AND BILLCLIENT <> @CLIENTCODE
       AND NOT EXISTS (SELECT 1 FROM #JOBCLI x WHERE x.JOBNO = #JOBS.JOBNO AND x.CLIENTCODE = @CLIENTCODE)

    DELETE FROM #JOBCLI WHERE NOT EXISTS (SELECT 1 FROM #JOBS j WHERE j.JOBNO = #JOBCLI.JOBNO)

    -- Mark what has already been invoiced.  Materialise the invoiced-job set ONCE and
    -- flag by join: a correlated EXISTS here re-joins acc_invjobno (456k) to
    -- acc_invoice (365k) for every job, which does not finish in useful time.
    -- Jobs are FLAGGED rather than deleted, because the billed ones are still needed
    -- for the service-wise margin further down.
    CREATE TABLE #INVJOB (JOBNO VARCHAR(25))

    INSERT INTO #INVJOB (JOBNO)
    SELECT DISTINCT jn.JOBNO
      FROM #IJN jn
     INNER JOIN #JOBS j ON j.JOBNO = jn.JOBNO
     INNER JOIN #JIV iv ON iv.INV_NO = jn.INV_NO

    CREATE CLUSTERED INDEX IX_INVJOB ON #INVJOB (JOBNO)

    UPDATE J SET IS_BILLED = 1 FROM #JOBS J INNER JOIN #INVJOB X ON X.JOBNO = J.JOBNO

    -- job -> invoice link, kept separately from #INVJOB so the verified IS_BILLED
    -- logic above is not disturbed.  Needed by the service-type backfill and by the
    -- invoicing-lag measure.
    CREATE TABLE #JOBINV (JOBNO VARCHAR(25), INV_NO VARCHAR(15))

    INSERT INTO #JOBINV (JOBNO, INV_NO)
    SELECT DISTINCT LTRIM(RTRIM(jn.inv_jobno)), LTRIM(RTRIM(jn.inv_no))
      FROM acc_invjobno jn
     INNER JOIN #JOBS j        ON j.JOBNO = LTRIM(RTRIM(jn.inv_jobno))
     INNER JOIN acc_invoice iv ON LTRIM(RTRIM(iv.inv_no)) = LTRIM(RTRIM(jn.inv_no))

    CREATE CLUSTERED INDEX IX_JOBINV ON #JOBINV (INV_NO)

    -- 7a-0. Service type recorded on the IMPORT job itself (TBL_IMP_IMPORT.ExWork /
    --       CustomClr / Freightfrd, written by the import entry screen which insists on
    --       at least one box: values 'EX' / 'CUSTOM' / 'FRTFRD', blank otherwise).
    --       This is data the operator keyed on the job, so it outranks the derived
    --       summary-table flags below; SERVICE_SRC='MASTER' says where it came from.
    --       EXWORK wins when ticked (ex-works = door-to-door, both legs included), then
    --       both legs -> 'FFD+CCLR', then the single leg.
    UPDATE J
       SET SERVICE_TYPE = CASE WHEN UPPER(LTRIM(RTRIM(ISNULL(i.ExWork,    '')))) = 'EX'     THEN 'EX'
                               WHEN UPPER(LTRIM(RTRIM(ISNULL(i.CustomClr, '')))) = 'CUSTOM'
                                AND UPPER(LTRIM(RTRIM(ISNULL(i.Freightfrd,'')))) = 'FRTFRD' THEN 'FFD+CCLR'
                               WHEN UPPER(LTRIM(RTRIM(ISNULL(i.CustomClr, '')))) = 'CUSTOM' THEN 'CCLR'
                               WHEN UPPER(LTRIM(RTRIM(ISNULL(i.Freightfrd,'')))) = 'FRTFRD' THEN 'FFD'
                               ELSE J.SERVICE_TYPE END,
           SERVICE_SRC  = 'MASTER'
      FROM #JOBS J
     INNER JOIN TBL_IMP_IMPORT i ON LTRIM(RTRIM(i.Import_Code)) = J.JOBNO
     WHERE J.MODE_ IN ('AIR IMPORT', 'SEA IMPORT')
       AND (   UPPER(LTRIM(RTRIM(ISNULL(i.ExWork,    '')))) = 'EX'
            OR UPPER(LTRIM(RTRIM(ISNULL(i.CustomClr, '')))) = 'CUSTOM'
            OR UPPER(LTRIM(RTRIM(ISNULL(i.Freightfrd,'')))) = 'FRTFRD')

    -- #SSJ - the summary rows of the jobs in #JOBS with JOBNO trimmed once (NVARCHAR, as
    -- the table has it, so the comparison is unchanged). The 7a UPDATE below and Table8
    -- each joined all 35k summary rows on LTRIM(RTRIM(JOBNO)); the UPDATE's guessed row
    -- count spilled its aggregate (perf 2026-10-21: 0.34 s; now 0.06 s for #SSJ plus the
    -- UPDATE). Every matching row is kept, duplicates included; #JOBS gains or loses no
    -- job after this point. (#MARGIN keeps its own join: it sums floats, and a different
    -- plan there would add them up in a different order.)
    CREATE TABLE #SSJ (JOBNO NVARCHAR(15), CCLR NVARCHAR(1), FFD NVARCHAR(1), EXW NVARCHAR(1), FFDCLR NVARCHAR(1),
                       TOT_PAID DECIMAL(18,2), TOT_RECO DECIMAL(18,2), TOT_DUTY_PAID DECIMAL(18,2), TOT_DUTY_RECO DECIMAL(18,2))
    INSERT INTO #SSJ (JOBNO, CCLR, FFD, EXW, FFDCLR, TOT_PAID, TOT_RECO, TOT_DUTY_PAID, TOT_DUTY_RECO)
    SELECT LTRIM(RTRIM(s.JOBNO)), s.CCLR, s.FFD, s.EXW, s.FFDCLR, s.TOT_PAID, s.TOT_RECO, s.TOT_DUTY_PAID, s.TOT_DUTY_RECO
      FROM TBL_SHIPMENT_SUMMARY_JOB s
     WHERE LTRIM(RTRIM(s.JOBNO)) IN (SELECT JOBNO FROM #JOBS)
    CREATE CLUSTERED INDEX IX_SSJ ON #SSJ (JOBNO)

    -- 7a. Service type from TBL_SHIPMENT_SUMMARY_JOB for everything the job master did
    -- not classify - the same flags the management dashboard uses
    -- (USP_DASHBOARD_MANAGEMENT_ENHANCED).  Only the CLASSIFICATION is
    -- taken from there - the money is computed from the ledger below, because that
    -- table's TOT_RECO covers only ~35% of invoiced value for FY25-26 and its
    -- TOT_DUTY_PAID is not a subset of TOT_PAID, so its TOT_DIFF is not a usable margin.
    -- SERVICE_SRC is set to 'FLAGGED' ONLY where a flag actually matched. A summary row
    -- with all four flags blank must stay SERVICE_SRC='NONE', otherwise the absence of
    -- a flag would be reported as recorded data.
    UPDATE J
       SET SERVICE_TYPE = CASE WHEN LTRIM(RTRIM(ISNULL(s.CCLR,   ''))) = '1' THEN 'CCLR'
                               WHEN LTRIM(RTRIM(ISNULL(s.FFD,    ''))) = '1' THEN 'FFD'
                               WHEN LTRIM(RTRIM(ISNULL(s.EXW,    ''))) = '1' THEN 'EX'
                               WHEN LTRIM(RTRIM(ISNULL(s.FFDCLR, ''))) = '1' THEN 'FFD+CCLR'
                               ELSE 'UNCLASS' END,
           SERVICE_SRC  = CASE WHEN LTRIM(RTRIM(ISNULL(s.CCLR,   ''))) = '1'
                                 OR LTRIM(RTRIM(ISNULL(s.FFD,    ''))) = '1'
                                 OR LTRIM(RTRIM(ISNULL(s.EXW,    ''))) = '1'
                                 OR LTRIM(RTRIM(ISNULL(s.FFDCLR, ''))) = '1'
                               THEN 'FLAGGED' ELSE 'NONE' END
      FROM #JOBS J
     INNER JOIN #SSJ s ON s.JOBNO = J.JOBNO
     WHERE J.SERVICE_SRC <> 'MASTER'

    ---------------------------------------------------------------------------------
    -- 7b. SERVICE-TYPE BACKFILL for sea exports whose flag was never written.
    --
    --     The flag writer broke on 2024-04-01 for EXPORT-SEA only: unflagged jobs went
    --     0% (2020-2023) -> 43% (2024) -> 61% (2026), and 98.6% of the unflagged are
    --     sea exports. Imports are 0% unflagged in every year.
    --
    --     Two GL heads on the job's own invoice separate the two legs cleanly:
    --         G100243 AGENCY CHARGES -> customs clearance leg
    --         G101608 ORIGIN THC     -> freight forwarding leg
    --     Validated on 11,451 flagged sea-export jobs (2022-01..2024-03):
    --         CCLR 98.3%, FFD 96.6%, FFDCLR 90.8%; 95.3% coverage, 96.5% accuracy.
    --
    --     RESTRICTED TO SEA EXPORT ON PURPOSE. Air export puts agency charges on nearly
    --     everything, so the same rule misclassifies 2,341 true FFDCLR jobs as CCLR.
    --     Anything backfilled is marked SERVICE_SRC='INFERRED' so the UI can badge it;
    --     an inference is never presented as recorded data.
    ---------------------------------------------------------------------------------
    --     LINKS uses its own chart of accounts, so the same two heads carry different
    --     codes there, and its billing practice differs: agency + THC together almost
    --     always means FORWARDING on Links (341 FFD v 28 CCLR), and ocean freight is
    --     billed as its own head. Validated on the 3,850 Links sea-export jobs that
    --     carry a recorded flag: fires on 97.1%, correct 96.8% (FFD 97.7%, CCLR 95.7%).
    --     Links never records FFD+CCLR (6 jobs ever), so its rule never emits it.
    --         Links:   G102094 AGENCY CHARGES RECEIVED
    --                  G101614 TERMINAL HANDLING CHARGES RECEIVED
    --                  G101610 OCEAN FREIGHT RECEIVED
    --                  THC or ocean freight -> FFD;  agency only -> CCLR
    ---------------------------------------------------------------------------------
    DECLARE @SVC_LINKS BIT, @SVC_AGENCY VARCHAR(10), @SVC_THC VARCHAR(10), @SVC_OFRT VARCHAR(10)
    SET @SVC_LINKS  = CASE WHEN UPPER(DB_NAME()) LIKE 'LINKS%' THEN 1 ELSE 0 END
    SET @SVC_AGENCY = CASE WHEN @SVC_LINKS = 1 THEN 'G102094' ELSE 'G100243' END
    SET @SVC_THC    = CASE WHEN @SVC_LINKS = 1 THEN 'G101614' ELSE 'G101608' END
    SET @SVC_OFRT   = CASE WHEN @SVC_LINKS = 1 THEN 'G101610' ELSE '~none~' END

    CREATE TABLE #SVCHEAD (JOBNO VARCHAR(25), HAS_AGENCY BIT, HAS_THC BIT, HAS_OFRT BIT)
    INSERT INTO #SVCHEAD (JOBNO, HAS_AGENCY, HAS_THC, HAS_OFRT)
    SELECT Z.JOBNO, MAX(Z.A), MAX(Z.T), MAX(Z.O)
      FROM (
            -- two separate GROUP BY legs (not a UNION-ALL derived table) so each charge
            -- table can be seeked on its inv_no index; inv_no is never padded, so it is
            -- deliberately NOT wrapped in LTRIM/RTRIM here
            SELECT ji.JOBNO,
                   MAX(CASE WHEN LTRIM(RTRIM(ISNULL(ic.inv_account,''))) = @SVC_AGENCY THEN 1 ELSE 0 END) AS A,
                   MAX(CASE WHEN LTRIM(RTRIM(ISNULL(ic.inv_account,''))) = @SVC_THC    THEN 1 ELSE 0 END) AS T,
                   MAX(CASE WHEN LTRIM(RTRIM(ISNULL(ic.inv_account,''))) = @SVC_OFRT   THEN 1 ELSE 0 END) AS O
              FROM #JOBINV ji
             INNER JOIN acc_invcharge ic ON ic.inv_no = ji.INV_NO
             GROUP BY ji.JOBNO
            UNION ALL
            SELECT ji.JOBNO,
                   MAX(CASE WHEN LTRIM(RTRIM(ISNULL(ic.inv_account,''))) = @SVC_AGENCY THEN 1 ELSE 0 END),
                   MAX(CASE WHEN LTRIM(RTRIM(ISNULL(ic.inv_account,''))) = @SVC_THC    THEN 1 ELSE 0 END),
                   MAX(CASE WHEN LTRIM(RTRIM(ISNULL(ic.inv_account,''))) = @SVC_OFRT   THEN 1 ELSE 0 END)
              FROM #JOBINV ji
             INNER JOIN acc_invcharge1 ic ON ic.inv_no = ji.INV_NO
             GROUP BY ji.JOBNO
           ) Z
     GROUP BY Z.JOBNO

    CREATE CLUSTERED INDEX IX_SVCHEAD ON #SVCHEAD (JOBNO)

    UPDATE J
       SET SERVICE_TYPE = CASE WHEN @SVC_LINKS = 1 THEN
                                    CASE WHEN h.HAS_THC = 1 OR h.HAS_OFRT = 1 THEN 'FFD' ELSE 'CCLR' END
                               WHEN h.HAS_AGENCY = 1 AND h.HAS_THC = 1 THEN 'FFD+CCLR'
                               WHEN h.HAS_AGENCY = 1                   THEN 'CCLR'
                               ELSE 'FFD' END,
           SERVICE_SRC  = 'INFERRED'
      FROM #JOBS J
     INNER JOIN #SVCHEAD h ON h.JOBNO = J.JOBNO
     WHERE J.SERVICE_TYPE = 'UNCLASS'
       AND J.MODE_        = 'SEA EXPORT'
       AND (h.HAS_AGENCY = 1 OR h.HAS_THC = 1 OR h.HAS_OFRT = 1)

    CREATE TABLE #JOBEXP
    (
        JOBNO        VARCHAR(25),
        PURCHASE_EXP FLOAT,
        BANKCASH_EXP FLOAT,
        JV_EXP       FLOAT
    )

    -- cost per job AND head: the client-wise split (9b) needs the head; #JOBEXP is its sum
    CREATE TABLE #JEC (JOBNO VARCHAR(25), HEAD VARCHAR(10), P FLOAT, B FLOAT, V FLOAT)

    -- #PURJ - the purchase lines of the jobs in #JOBS, jobno trimmed once. acc_purchasedtls
    -- is a 245k-row heap with no index, and #JEC, Table9 and Table16 each scanned and
    -- re-trimmed all of it to find these few thousand lines (perf 2026-10-21: Table9 0.55 s
    -- in the procedure, 0.85 s of CPU as a plain batch; now 0.17 s, #PURJ 0.10 s). Every
    -- matching line is kept and
    -- the raw columns with it, so each statement applies its own filters exactly as before;
    -- ROWID keeps acc_purchasedtls order. #DUTY still reads the table itself: it sums
    -- floats, and a different plan there would add them up in a different order.
    CREATE TABLE #PURJ (ROWID INT IDENTITY(1, 1) PRIMARY KEY CLUSTERED, JOBNO VARCHAR(20),
                        pur_jobno VARCHAR(20), pur_account VARCHAR(10), pur_amount VARCHAR(15), pur_code VARCHAR(15))
    INSERT INTO #PURJ (JOBNO, pur_jobno, pur_account, pur_amount, pur_code)
    SELECT LTRIM(RTRIM(pd.pur_jobno)), pd.pur_jobno, pd.pur_account, pd.pur_amount, pd.pur_code
      FROM acc_purchasedtls pd
     WHERE LTRIM(RTRIM(pd.pur_jobno)) IN (SELECT JOBNO FROM #JOBS)
    OPTION (MAXDOP 1)

    -- The cost lines of the jobs in #JOBS are staged in #JECX and summed from there. As
    -- one statement the optimizer summed the cost lines of EVERY job ever (~200k lines,
    -- planned as 324 groups) before joining #JOBS, and that aggregate spilled to tempdb
    -- (perf 2026-10-21: #JEC 2.09 s / 316k reads; now 0.10 s + 0.02 s). Same lines, same
    -- join to #JOBS (so the same multiplicity). Serial, like #SETTLEX, so each sum adds
    -- its lines in one fixed (ROWID) order on every run.
    CREATE TABLE #JECX (ROWID INT IDENTITY(1, 1) PRIMARY KEY CLUSTERED,
                        JOBNO VARCHAR(25), HEAD VARCHAR(10), P FLOAT, B FLOAT, V FLOAT)

    INSERT INTO #JECX (JOBNO, HEAD, P, B, V)
    SELECT X.JOBNO, X.HEAD, X.P, X.B, X.V
      FROM (
            SELECT pd.JOBNO AS JOBNO,                   -- LTRIM(RTRIM(pur_jobno)), see #PURJ
                   LTRIM(RTRIM(pd.pur_account)) AS HEAD,
                   CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(pd.pur_amount)), ''), '0')) AS P,
                   0 AS B, 0 AS V
              FROM #PURJ pd
             WHERE ISNULL(pd.pur_jobno, '') <> ''
               AND LTRIM(RTRIM(pd.pur_account)) IN (SELECT ACCTCODE FROM #JOBHEAD)

            UNION ALL

            SELECT LTRIM(RTRIM(d.jobno)), LTRIM(RTRIM(d.client)), 0,
                   CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(d.amount)), ''), '0')), 0
              FROM acc_bankdtls d
             INNER JOIN acc_bank b ON b.entryno = d.entryno
             WHERE ISNULL(d.jobno, '') <> ''
               AND d.entrytype = 'JB'
               AND LTRIM(RTRIM(d.client)) IN (SELECT ACCTCODE FROM #JOBHEAD)
               AND b.status IN ('BP', 'CP', 'CE')

            UNION ALL

            SELECT LTRIM(RTRIM(jd.jv_jobno)), LTRIM(RTRIM(jd.jv_account)), 0, 0,
                   CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(jd.jv_debit)), ''), '0'))
              FROM acc_JournalVoucDtls jd
             WHERE ISNULL(jd.jv_jobno, '') <> ''
               AND LTRIM(RTRIM(jd.jv_account)) IN (SELECT ACCTCODE FROM #JOBHEAD)
           ) X
     INNER JOIN #JOBS j ON j.JOBNO = X.JOBNO
    OPTION (MAXDOP 1)

    INSERT INTO #JEC (JOBNO, HEAD, P, B, V)
    SELECT X.JOBNO, X.HEAD, SUM(X.P), SUM(X.B), SUM(X.V)
      FROM #JECX X
     GROUP BY X.JOBNO, X.HEAD
    OPTION (MAXDOP 1)

    CREATE CLUSTERED INDEX IX_JEC ON #JEC (JOBNO, HEAD)

    INSERT INTO #JOBEXP (JOBNO, PURCHASE_EXP, BANKCASH_EXP, JV_EXP)
    SELECT JOBNO, SUM(P), SUM(B), SUM(V) FROM #JEC GROUP BY JOBNO

    CREATE CLUSTERED INDEX IX_JOBEXP ON #JOBEXP (JOBNO)

    ---------------------------------------------------------------------------------
    -- 7c. #JOBINC - ledger INCOME per job, for the margin.
    --     Invoice charge lines (BOTH charge tables) on every invoice naming the job,
    --     up to @TODATE, net of GST (TAX heads) and inter-branch (EXCL) postings, in
    --     INR. An invoice that names several jobs is split EQUALLY across them (the
    --     ERP does not apportion charge lines per job), counted over ALL jobs on the
    --     invoice, not only those in the period, so nothing is double counted.
    --     Income and expense are therefore both LEDGER figures, same as every other
    --     card - TBL_SHIPMENT_SUMMARY_JOB is used only for service type and duty.
    ---------------------------------------------------------------------------------
    CREATE TABLE #INVJOBCNT (INV_NO VARCHAR(15), NJOBS INT)
    INSERT INTO #INVJOBCNT (INV_NO, NJOBS)
    SELECT ji.INV_NO, COUNT(DISTINCT jn.JOBNO)
      FROM (SELECT DISTINCT INV_NO FROM #JOBINV) ji
     INNER JOIN #IJN jn ON jn.INV_NO = ji.INV_NO
     WHERE ISNULL(jn.JOBNO, '') <> ''
     GROUP BY ji.INV_NO
    CREATE CLUSTERED INDEX IX_INVJOBCNT ON #INVJOBCNT (INV_NO)

    -- Every invoice on the job up to @TODATE, whoever it was billed to. #INV cannot be
    -- used here: on a single-client drill it holds only THAT client's invoices, so a
    -- shipper's job whose freight was billed to an overseas agent kept its full cost
    -- but lost the other party's income (David Pieris on Links: -30% margin that was
    -- not a loss at all). Receivables still use #INV; job P&L uses this.
    CREATE TABLE #JOBINVDT (INV_NO VARCHAR(15), INV_DT DATETIME, INV_CLIENT VARCHAR(10))

    INSERT INTO #JOBINVDT (INV_NO, INV_DT, INV_CLIENT)
    SELECT iv.INV_NO,
           MAX(CASE WHEN ISDATE(SUBSTRING(iv.inv_date,7,4)+SUBSTRING(iv.inv_date,4,2)+SUBSTRING(iv.inv_date,1,2)) = 1
                    THEN CONVERT(DATETIME, SUBSTRING(iv.inv_date,7,4)+SUBSTRING(iv.inv_date,4,2)+SUBSTRING(iv.inv_date,1,2), 112) END),
           MAX(LTRIM(RTRIM(iv.inv_client)))
      FROM (SELECT DISTINCT INV_NO FROM #JOBINV) ji
     INNER JOIN #JIV iv ON iv.INV_NO = ji.INV_NO     -- #JIV: acc_invoice trimmed, see #JOBCLI
     WHERE LTRIM(RTRIM(ISNULL(iv.cmpcode, ''))) = @CMPCODE
       AND LEN(ISNULL(iv.inv_date, '')) = 10
       AND ISDATE(SUBSTRING(iv.inv_date,7,4)+SUBSTRING(iv.inv_date,4,2)+SUBSTRING(iv.inv_date,1,2)) = 1
       AND SUBSTRING(iv.inv_date,7,4)+SUBSTRING(iv.inv_date,4,2)+SUBSTRING(iv.inv_date,1,2) <= @TO_YMD
     GROUP BY iv.INV_NO

    CREATE CLUSTERED INDEX IX_JOBINVDT ON #JOBINVDT (INV_NO)

    CREATE TABLE #JOBINC (JOBNO VARCHAR(25), REVENUE FLOAT, GST_AMT FLOAT, LAST_INV_DT DATETIME)
    INSERT INTO #JOBINC (JOBNO, REVENUE, GST_AMT, LAST_INV_DT)
    SELECT Z.JOBNO, SUM(Z.REV), SUM(Z.GST),
           (SELECT MAX(v2.INV_DT) FROM #JOBINV j2 INNER JOIN #JOBINVDT v2 ON v2.INV_NO = j2.INV_NO WHERE j2.JOBNO = Z.JOBNO)
      FROM (
            SELECT ji.JOBNO,
                   SUM(CASE WHEN ISNULL(sc.CATEGORY, 'OTHER') NOT IN ('TAX', 'EXCL', 'DUTY')
                            THEN CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(ic.inv_inramt)), ''), '0')) ELSE 0 END)
                       / CONVERT(FLOAT, CASE WHEN ISNULL(n.NJOBS, 0) < 1 THEN 1 ELSE n.NJOBS END) AS REV,
                   SUM(ISNULL(ic.CGST_AMT, 0) + ISNULL(ic.SGST_AMT, 0) + ISNULL(ic.IGST_AMT, 0))
                       / CONVERT(FLOAT, CASE WHEN ISNULL(n.NJOBS, 0) < 1 THEN 1 ELSE n.NJOBS END) AS GST
              FROM #JOBINV ji
             INNER JOIN #JOBINVDT v ON v.INV_NO = ji.INV_NO     -- every party's invoices up to @TODATE
             INNER JOIN acc_invcharge ic ON ic.inv_no = ji.INV_NO
              LEFT JOIN #INVJOBCNT n ON n.INV_NO = ji.INV_NO
              LEFT JOIN #SVCCAT sc ON sc.ACCTCODE = LTRIM(RTRIM(ISNULL(ic.inv_account, '')))
             GROUP BY ji.JOBNO, n.NJOBS
            UNION ALL
            SELECT ji.JOBNO,
                   SUM(CASE WHEN ISNULL(sc.CATEGORY, 'OTHER') NOT IN ('TAX', 'EXCL', 'DUTY')
                            THEN CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(ic.inv_inramt)), ''), '0')) ELSE 0 END)
                       / CONVERT(FLOAT, CASE WHEN ISNULL(n.NJOBS, 0) < 1 THEN 1 ELSE n.NJOBS END),
                   SUM(ISNULL(ic.CGST_AMT, 0) + ISNULL(ic.SGST_AMT, 0) + ISNULL(ic.IGST_AMT, 0))
                       / CONVERT(FLOAT, CASE WHEN ISNULL(n.NJOBS, 0) < 1 THEN 1 ELSE n.NJOBS END)
              FROM #JOBINV ji
             INNER JOIN #JOBINVDT v ON v.INV_NO = ji.INV_NO     -- every party's invoices up to @TODATE
             INNER JOIN acc_invcharge1 ic ON ic.inv_no = ji.INV_NO
              LEFT JOIN #INVJOBCNT n ON n.INV_NO = ji.INV_NO
              LEFT JOIN #SVCCAT sc ON sc.ACCTCODE = LTRIM(RTRIM(ISNULL(ic.inv_account, '')))
             GROUP BY ji.JOBNO, n.NJOBS
           ) Z
     GROUP BY Z.JOBNO
    CREATE CLUSTERED INDEX IX_JOBINC ON #JOBINC (JOBNO)

    ---------------------------------------------------------------------------------
    -- 8. #MIX - billing mix, PERIOD bound: taxable vs non-taxable, by currency.
    --    Currency: charge line first, invoice header as fallback; CR115/blank = INR.
    --    Taxable : inv_taxable 'G' or a GST rate on the line.
    --    GST heads are excluded from the amounts and reported separately as GST_AMT.
    ---------------------------------------------------------------------------------
    CREATE TABLE #MIX
    (
        CUR_CODE     VARCHAR(10),
        IS_INR       BIT,
        TAXABLE_FLAG VARCHAR(12),
        CLIENTCODE   VARCHAR(10),
        LINES_       INT,
        AMT_ORIG_CUR FLOAT,
        AMT_INR      FLOAT,
        GST_AMT      FLOAT
    )

    -- One pass over acc_invcharge (2.4M rows) feeding BOTH the billing mix and the
    -- revenue side of the margin.  Scanning it twice roughly doubles the run time.
    -- The invoice currency comes from #INV, so no second join back to acc_invoice.
    -- In-period invoices only, as a small driving set (about 10k rows for a full year)
    -- so the two charge tables can be SEEKED on their inv_no indexes instead of scanned.
    -- inv_no is never padded (verified: 0 of 365,330 / 2,481,404 / 917,734 rows), so the
    -- join deliberately does NOT wrap the indexed column in LTRIM/RTRIM - doing so makes
    -- the predicate non-sargable and forces a full scan of ~3.4M charge rows.
    CREATE TABLE #INVP (INV_NO VARCHAR(15), CLIENTCODE VARCHAR(10), INV_CUR VARCHAR(10))
    INSERT INTO #INVP (INV_NO, CLIENTCODE, INV_CUR)
    SELECT INV_NO, CLIENTCODE, INV_CUR FROM #INV WHERE IN_PERIOD = 1
    CREATE CLUSTERED INDEX IX_INVP ON #INVP (INV_NO)

    CREATE TABLE #CHG
    (
        CLIENTCODE   VARCHAR(10),
        CATEGORY     VARCHAR(10),
        CUR_CODE     VARCHAR(10),
        IS_INR       BIT,
        TAXABLE_FLAG VARCHAR(12),
        AMT_ORIG_CUR FLOAT,
        AMT_INR      FLOAT,
        GST_AMT      FLOAT
    )

    -- The ERP keeps invoice charge lines in TWO tables and which one carries the real
    -- lines varies by branch: Mumbai's are in acc_invcharge1 while acc_invcharge holds
    -- only a 9999 / 0.00 placeholder; Ahmedabad is the reverse. They do not double
    -- count - for FY2025-26 company 01 the two together sum to 710,721,265, which is
    -- the invoice total to the rupee. Reading only acc_invcharge collapsed the Mumbai
    -- billing mix to 3,344. Kept as two separate INSERTs rather than a UNION ALL
    -- derived table so the optimizer can pick a seek plan per table.
    INSERT INTO #CHG (CLIENTCODE, CATEGORY, CUR_CODE, IS_INR, TAXABLE_FLAG,
                      AMT_ORIG_CUR, AMT_INR, GST_AMT)
    SELECT v.CLIENTCODE,
           ISNULL(sc.CATEGORY, 'OTHER'),
           CUR.CUR_CODE,
           CASE WHEN CUR.CUR_CODE IN ('CR115', '') THEN 1 ELSE 0 END,
           CASE WHEN LTRIM(RTRIM(ISNULL(ic.inv_taxable, ''))) = 'G' OR ISNULL(ic.GST_RATE, 0) > 0
                THEN 'TAXABLE' ELSE 'NON-TAXABLE' END,
           CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(ic.inv_amount)), ''), '0')),
           CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(ic.inv_inramt)), ''), '0')),
           ISNULL(ic.CGST_AMT, 0) + ISNULL(ic.SGST_AMT, 0) + ISNULL(ic.IGST_AMT, 0)
      FROM #INVP v
     INNER JOIN acc_invcharge ic ON ic.inv_no = v.INV_NO
      LEFT JOIN #SVCCAT sc
             ON sc.ACCTCODE = LTRIM(RTRIM(ISNULL(ic.inv_account, '')))
     CROSS APPLY (SELECT LTRIM(RTRIM(ISNULL(NULLIF(LTRIM(RTRIM(ISNULL(ic.INV_CURRENCY, ''))), ''),
                                            v.INV_CUR))) AS CUR_CODE) CUR

    INSERT INTO #CHG (CLIENTCODE, CATEGORY, CUR_CODE, IS_INR, TAXABLE_FLAG,
                      AMT_ORIG_CUR, AMT_INR, GST_AMT)
    SELECT v.CLIENTCODE,
           ISNULL(sc.CATEGORY, 'OTHER'),
           CUR.CUR_CODE,
           CASE WHEN CUR.CUR_CODE IN ('CR115', '') THEN 1 ELSE 0 END,
           CASE WHEN LTRIM(RTRIM(ISNULL(ic.inv_taxable, ''))) = 'G' OR ISNULL(ic.GST_RATE, 0) > 0
                THEN 'TAXABLE' ELSE 'NON-TAXABLE' END,
           CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(ic.inv_amount)), ''), '0')),
           CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(ic.inv_inramt)), ''), '0')),
           ISNULL(ic.CGST_AMT, 0) + ISNULL(ic.SGST_AMT, 0) + ISNULL(ic.IGST_AMT, 0)
      FROM #INVP v
     INNER JOIN acc_invcharge1 ic ON ic.inv_no = v.INV_NO
      LEFT JOIN #SVCCAT sc
             ON sc.ACCTCODE = LTRIM(RTRIM(ISNULL(ic.inv_account, '')))
     CROSS APPLY (SELECT LTRIM(RTRIM(ISNULL(NULLIF(LTRIM(RTRIM(ISNULL(ic.INV_CURRENCY, ''))), ''),
                                            v.INV_CUR))) AS CUR_CODE) CUR

    INSERT INTO #MIX (CUR_CODE, IS_INR, TAXABLE_FLAG, CLIENTCODE, LINES_, AMT_ORIG_CUR, AMT_INR, GST_AMT)
    SELECT CUR_CODE, IS_INR, TAXABLE_FLAG, CLIENTCODE,
           COUNT(*), SUM(AMT_ORIG_CUR), SUM(AMT_INR), SUM(GST_AMT)
      FROM #CHG
     WHERE CATEGORY NOT IN ('TAX', 'EXCL', 'DUTY')
     GROUP BY CUR_CODE, IS_INR, TAXABLE_FLAG, CLIENTCODE
    ---------------------------------------------------------------------------------
    ---------------------------------------------------------------------------------
    -- 9. #MARGIN - job-wise income / expense / P&L by CLIENT x SERVICE TYPE, PERIOD.
    --
    --    Source: the LEDGER, like every other card. Income = the job's invoice charge
    --    lines net of GST (#JOBINC); expense = purchases + JB payments + JV lines booked
    --    on the job (#JOBEXP). Grain = jobs opened in the period (Job Profit report
    --    grain), income and cost counted up to @TODATE.
    --    TBL_SHIPMENT_SUMMARY_JOB is NOT used for money any more: its TOT_RECO covered
    --    only ~35% of invoiced value for FY25-26, so the margin read far too low; it is
    --    kept only for the service flags and the duty columns. Spot check on export job
    --    011032520000276: booked purchases 2,189,427 and invoiced net of GST 2,186,650 -
    --    the ledger figures match what the summary table held for that job.
    --
    --    Joined on JOBNO to #JOBS rather than on its own COMPCODE/CITYCODE, because
    --    this table codes them differently ('MPCF', and BOM/TCR/CCU instead of
    --    MUM/TRN/CAL). #JOBS is already scoped to the requested company and branch.
    --
    --    Duty is carried in its own columns and is NOT inside TOT_PAID. On import
    --    clearance jobs the duty billed to the client is not in TOT_RECO either, so
    --    those jobs can show a negative P&L; DUTY_PAID / DUTY_RECO are returned so the
    --    distortion is visible instead of silently depressing the margin. A job that
    --    is costed but not yet fully invoiced also shows negative - that is its true
    --    position to date, not an error.
    ---------------------------------------------------------------------------------
    CREATE TABLE #MARGIN
    (
        CLIENTCODE    VARCHAR(10),   -- shipper / job party
        BILLCLIENT    VARCHAR(10),   -- who the invoice was raised on
        SERVICE_TYPE  VARCHAR(25),
        JOBS          INT,
        JOBS_SHIP     INT,     -- each job counted once, for the shipper view (a split job has several rows)
        INFERRED_SHIP INT,
        UNMATCHED     FLOAT,   -- cost with no matching income head, shared by income
        INFERRED_JOBS INT,   -- how many of JOBS got their type from the GL backfill
        REVENUE       FLOAT,
        COST          FLOAT,
        DUTY_PAID     FLOAT,
        DUTY_RECO     FLOAT,
        LAST_INV_DT   DATETIME   -- latest invoice date among the group's jobs ("last billed")
    )

    -- LEDGER figures: income from the job's invoices (#JOBINC, net of GST), expense
    -- from purchases + JB payments + JV lines on the job (#JOBEXP). Duty columns are
    -- informational and still come from the summary table where a row exists.
    ---------------------------------------------------------------------------------
    -- 9b. CLIENT-WISE SPLIT of each job's P&L.
    --     One job is often billed to several parties - the shipper for local charges, the
    --     overseas agent for freight, a clearance client for customs - while its cost
    --     arrives on one purchase voucher. Income goes to the client each invoice was
    --     raised on. Each cost line follows the client billed for the MATCHING income
    --     head (TBL_MST_JOB_COST_PAIRING: OCEAN FREIGHT PAID -> OCEAN FREIGHT RECEIVED),
    --     split by what each client was billed for that head. Cost with no matching
    --     income is shared by each client's share of the job's income and reported as
    --     UNMATCHED. A job with no income yet keeps its cost on the job party. Job
    --     totals do not change - only which client they sit under.
    ---------------------------------------------------------------------------------
    -- income per job, client and head: the same lines and split as #JOBINC
    CREATE TABLE #JIC (JOBNO VARCHAR(25), CLIENTCODE VARCHAR(10), HEAD VARCHAR(10), AMT FLOAT, LAST_DT DATETIME)
    INSERT INTO #JIC (JOBNO, CLIENTCODE, HEAD, AMT, LAST_DT)
    SELECT Z.JOBNO, Z.CLIENTCODE, Z.HEAD, SUM(Z.AMT), MAX(Z.DT)
      FROM (
            SELECT ji.JOBNO, v.INV_CLIENT AS CLIENTCODE, LTRIM(RTRIM(ISNULL(ic.inv_account, ''))) AS HEAD,
                   CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(ic.inv_inramt)), ''), '0'))
                       / CONVERT(FLOAT, CASE WHEN ISNULL(n.NJOBS, 0) < 1 THEN 1 ELSE n.NJOBS END) AS AMT,
                   v.INV_DT AS DT
              FROM #JOBINV ji
             INNER JOIN #JOBINVDT v ON v.INV_NO = ji.INV_NO
             INNER JOIN acc_invcharge ic ON ic.inv_no = ji.INV_NO
              LEFT JOIN #INVJOBCNT n ON n.INV_NO = ji.INV_NO
              LEFT JOIN #SVCCAT sc ON sc.ACCTCODE = LTRIM(RTRIM(ISNULL(ic.inv_account, '')))
             WHERE ISNULL(sc.CATEGORY, 'OTHER') NOT IN ('TAX', 'EXCL', 'DUTY')
            UNION ALL
            SELECT ji.JOBNO, v.INV_CLIENT, LTRIM(RTRIM(ISNULL(ic.inv_account, ''))),
                   CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(ic.inv_inramt)), ''), '0'))
                       / CONVERT(FLOAT, CASE WHEN ISNULL(n.NJOBS, 0) < 1 THEN 1 ELSE n.NJOBS END),
                   v.INV_DT
              FROM #JOBINV ji
             INNER JOIN #JOBINVDT v ON v.INV_NO = ji.INV_NO
             INNER JOIN acc_invcharge1 ic ON ic.inv_no = ji.INV_NO
              LEFT JOIN #INVJOBCNT n ON n.INV_NO = ji.INV_NO
              LEFT JOIN #SVCCAT sc ON sc.ACCTCODE = LTRIM(RTRIM(ISNULL(ic.inv_account, '')))
             WHERE ISNULL(sc.CATEGORY, 'OTHER') NOT IN ('TAX', 'EXCL', 'DUTY')
           ) Z
     INNER JOIN #JOBS j ON j.JOBNO = Z.JOBNO
     GROUP BY Z.JOBNO, Z.CLIENTCODE, Z.HEAD
    CREATE CLUSTERED INDEX IX_JIC ON #JIC (JOBNO, CLIENTCODE, HEAD)

    -- who was billed what on each job (positive amounts only drive the split)
    CREATE TABLE #JCH (JOBNO VARCHAR(25), CLIENTCODE VARCHAR(10), HEAD VARCHAR(10), AMT FLOAT)
    INSERT INTO #JCH (JOBNO, CLIENTCODE, HEAD, AMT)
    SELECT JOBNO, CLIENTCODE, HEAD, SUM(AMT) FROM #JIC GROUP BY JOBNO, CLIENTCODE, HEAD HAVING SUM(AMT) > 0.01
    CREATE CLUSTERED INDEX IX_JCH ON #JCH (JOBNO, HEAD)

    CREATE TABLE #JC (JOBNO VARCHAR(25), CLIENTCODE VARCHAR(10), INC FLOAT)
    INSERT INTO #JC (JOBNO, CLIENTCODE, INC)
    SELECT JOBNO, CLIENTCODE, SUM(AMT) FROM #JIC GROUP BY JOBNO, CLIENTCODE HAVING SUM(AMT) > 0.01
    CREATE CLUSTERED INDEX IX_JC ON #JC (JOBNO)

    CREATE TABLE #JECP (JOBNO VARCHAR(25), HEAD VARCHAR(10), AMT FLOAT)
    INSERT INTO #JECP (JOBNO, HEAD, AMT)
    SELECT JOBNO, HEAD, ISNULL(P, 0) + ISNULL(B, 0) + ISNULL(V, 0) FROM #JEC
    CREATE CLUSTERED INDEX IX_JECP ON #JECP (JOBNO, HEAD)

    -- every income head a cost head is charged on: the pairing table, plus the head itself
    -- (Manilal pays CUSTOM DUTY (SEA & AIR) on the client's behalf and bills it back under
    -- the same code)
    CREATE TABLE #PAIRS (COSTHEAD VARCHAR(10), INCHEAD VARCHAR(10))
    INSERT INTO #PAIRS (COSTHEAD, INCHEAD)
    SELECT DISTINCT LTRIM(RTRIM(COSTHEAD)), LTRIM(RTRIM(INCHEAD)) FROM dbo.TBL_MST_JOB_COST_PAIRING
    INSERT INTO #PAIRS (COSTHEAD, INCHEAD)
    SELECT DISTINCT e.HEAD, e.HEAD FROM #JECP e
     WHERE NOT EXISTS (SELECT 1 FROM #PAIRS p WHERE p.COSTHEAD = e.HEAD AND p.INCHEAD = e.HEAD)
    CREATE CLUSTERED INDEX IX_PAIRS ON #PAIRS (COSTHEAD, INCHEAD)

    -- for each job and cost head: what each client was billed on its paired heads
    CREATE TABLE #JECB (JOBNO VARCHAR(25), COSTHEAD VARCHAR(10), CLIENTCODE VARCHAR(10), BILLED FLOAT)
    INSERT INTO #JECB (JOBNO, COSTHEAD, CLIENTCODE, BILLED)
    SELECT e.JOBNO, e.HEAD, h.CLIENTCODE, SUM(h.AMT)
      FROM (SELECT DISTINCT JOBNO, HEAD FROM #JECP) e
     INNER JOIN #PAIRS p ON p.COSTHEAD = e.HEAD
     INNER JOIN #JCH h ON h.JOBNO = e.JOBNO AND h.HEAD = p.INCHEAD
     GROUP BY e.JOBNO, e.HEAD, h.CLIENTCODE
    CREATE CLUSTERED INDEX IX_JECB ON #JECB (JOBNO, COSTHEAD)

    CREATE TABLE #ALLOC (JOBNO VARCHAR(25), CLIENTCODE VARCHAR(10), COST FLOAT, UNMATCHED FLOAT)
    -- (a) cost follows the client(s) billed for the matching charge, in proportion
    INSERT INTO #ALLOC (JOBNO, CLIENTCODE, COST, UNMATCHED)
    SELECT e.JOBNO, b.CLIENTCODE, e.AMT * b.BILLED / t.TOT, 0
      FROM #JECP e
     INNER JOIN #JECB b ON b.JOBNO = e.JOBNO AND b.COSTHEAD = e.HEAD
     INNER JOIN (SELECT JOBNO, COSTHEAD, SUM(BILLED) AS TOT FROM #JECB GROUP BY JOBNO, COSTHEAD) t
             ON t.JOBNO = e.JOBNO AND t.COSTHEAD = e.HEAD
    -- (b) no matching charge billed: shared by each client's share of the job's income
    INSERT INTO #ALLOC (JOBNO, CLIENTCODE, COST, UNMATCHED)
    SELECT e.JOBNO, c.CLIENTCODE, e.AMT * c.INC / jt.TOT, e.AMT * c.INC / jt.TOT
      FROM #JECP e
     INNER JOIN #JC c ON c.JOBNO = e.JOBNO
     INNER JOIN (SELECT JOBNO, SUM(INC) AS TOT FROM #JC GROUP BY JOBNO) jt ON jt.JOBNO = e.JOBNO
     WHERE NOT EXISTS (SELECT 1 FROM #JECB b WHERE b.JOBNO = e.JOBNO AND b.COSTHEAD = e.HEAD)
    -- (c) nothing billed on the job yet: the cost stays with the job party
    INSERT INTO #ALLOC (JOBNO, CLIENTCODE, COST, UNMATCHED)
    SELECT e.JOBNO, j.BILLCLIENT, e.AMT, 0
      FROM #JECP e
     INNER JOIN #JOBS j ON j.JOBNO = e.JOBNO
     WHERE NOT EXISTS (SELECT 1 FROM #JECB b WHERE b.JOBNO = e.JOBNO AND b.COSTHEAD = e.HEAD)
       AND NOT EXISTS (SELECT 1 FROM #JC c WHERE c.JOBNO = e.JOBNO)

    CREATE CLUSTERED INDEX IX_ALLOC ON #ALLOC (JOBNO)

    -- one row per job and client
    CREATE TABLE #JCP (JOBNO VARCHAR(25), CLIENTCODE VARCHAR(10), REVENUE FLOAT, COST FLOAT, UNMATCHED FLOAT, LAST_DT DATETIME)
    INSERT INTO #JCP (JOBNO, CLIENTCODE, REVENUE, COST, UNMATCHED, LAST_DT)
    SELECT X.JOBNO, X.CLIENTCODE, SUM(X.R), SUM(X.C), SUM(X.U), MAX(X.D)
      FROM (
            SELECT JOBNO, CLIENTCODE, AMT AS R, 0 AS C, 0 AS U, LAST_DT AS D FROM #JIC
            UNION ALL
            SELECT JOBNO, CLIENTCODE, 0, COST, UNMATCHED, NULL FROM #ALLOC
            UNION ALL
            -- a shipment with nothing booked yet still counts as a job of its party
            SELECT j.JOBNO, j.BILLCLIENT, 0, 0, 0, NULL
              FROM #JOBS j
             WHERE j.JOB_CLASS = 'SHIPMENT'
               AND NOT EXISTS (SELECT 1 FROM #JIC i WHERE i.JOBNO = j.JOBNO)
               AND NOT EXISTS (SELECT 1 FROM #ALLOC a WHERE a.JOBNO = j.JOBNO)
           ) X
     GROUP BY X.JOBNO, X.CLIENTCODE
    CREATE CLUSTERED INDEX IX_JCP ON #JCP (JOBNO, CLIENTCODE)

    -- LEDGER figures by client: RN = 1 marks the job's main party, which carries the job
    -- count and duty for the shipper view so a split job is not counted twice there.
    INSERT INTO #MARGIN (CLIENTCODE, BILLCLIENT, SERVICE_TYPE, JOBS, JOBS_SHIP, INFERRED_JOBS, INFERRED_SHIP,
                         REVENUE, COST, UNMATCHED, DUTY_PAID, DUTY_RECO, LAST_INV_DT)
    SELECT j.CLIENTCODE,
           r.CLIENTCODE,
           j.SERVICE_TYPE,
           COUNT(*),
           SUM(CASE WHEN r.RN = 1 THEN 1 ELSE 0 END),
           SUM(CASE WHEN j.SERVICE_SRC = 'INFERRED' THEN 1 ELSE 0 END),
           SUM(CASE WHEN j.SERVICE_SRC = 'INFERRED' AND r.RN = 1 THEN 1 ELSE 0 END),
           SUM(r.REVENUE),
           SUM(r.COST),
           SUM(r.UNMATCHED),
           SUM(CASE WHEN r.RN = 1 THEN CONVERT(FLOAT, ISNULL(s.TOT_DUTY_PAID, 0)) ELSE 0 END),
           SUM(CASE WHEN r.RN = 1 THEN CONVERT(FLOAT, ISNULL(s.TOT_DUTY_RECO, 0)) ELSE 0 END),
           MAX(r.LAST_DT)
      FROM (
            SELECT p.JOBNO, p.CLIENTCODE, p.REVENUE, p.COST, p.UNMATCHED, p.LAST_DT,
                   ROW_NUMBER() OVER (PARTITION BY p.JOBNO
                                      ORDER BY CASE WHEN p.CLIENTCODE = jj.BILLCLIENT THEN 0 ELSE 1 END,
                                               p.REVENUE DESC, p.CLIENTCODE) AS RN
              FROM #JCP p
             INNER JOIN #JOBS jj ON jj.JOBNO = p.JOBNO
           ) r
     INNER JOIN #JOBS j ON j.JOBNO = r.JOBNO
      LEFT JOIN TBL_SHIPMENT_SUMMARY_JOB s ON LTRIM(RTRIM(s.JOBNO)) = j.JOBNO
     GROUP BY j.CLIENTCODE, r.CLIENTCODE, j.SERVICE_TYPE

    -- a single-client drill keeps a job that was billed to several parties, so #MARGIN
    -- now also holds the OTHER parties' shares of that job. Their revenue and cost are
    -- not this client's, and on a shared non-shipment job they can dwarf it, so drop
    -- them: a client search must show that client's own income and cost, nothing else.
    DELETE FROM #MARGIN
     WHERE @CLIENTCODE <> '' AND BILLCLIENT <> @CLIENTCODE AND CLIENTCODE <> @CLIENTCODE
    ---------------------------------------------------------------------------------
    -- 10. #CLIENT - one row per client: exposure, utilisation, risk
    ---------------------------------------------------------------------------------
    CREATE TABLE #CLIENT
    (
        CLIENTCODE      VARCHAR(10),
        CLIENTNAME      VARCHAR(200),
        CLIENT_STATUS   VARCHAR(50),
        CREDIT_PERIOD   INT,
        HAS_TERMS       BIT,
        GROSS_PENDING   FLOAT,
        UNADJUSTED      FLOAT,
        ADVANCE         FLOAT,
        OUTSTANDING     FLOAT,
        OVERDUE         FLOAT,
        OVER_180        FLOAT,
        OVER_365        FLOAT,
        UNBILLED        FLOAT,
        UNBILLED_JOBS   INT,
        BILLED_PERIOD   FLOAT,
        BILLED_90       FLOAT,
        DAYS_WTD        FLOAT,
        DAYS_SIMPLE     FLOAT,
        MIN_DAYS        INT,
        MAX_DAYS        INT,
        SUGGESTED_LIMIT FLOAT,
        -- the part of GROSS_PENDING on bills raised between @FROMDATE and @TODATE.
        -- Outstanding is a position as on @TODATE, so it carries bills from every
        -- year; management reads the date filter as "this period", so the card
        -- shows how much of the pending belongs to the period and how much is older.
        PENDING_PERIOD  FLOAT
    )

    INSERT INTO #CLIENT (CLIENTCODE, CLIENTNAME, CLIENT_STATUS, CREDIT_PERIOD, HAS_TERMS,
                         GROSS_PENDING, UNADJUSTED, ADVANCE,
                         OUTSTANDING, OVERDUE, OVER_180, OVER_365, UNBILLED, UNBILLED_JOBS,
                         BILLED_PERIOD, BILLED_90, DAYS_WTD, DAYS_SIMPLE, MIN_DAYS, MAX_DAYS, SUGGESTED_LIMIT,
                         PENDING_PERIOD)
    SELECT A.CLIENTCODE,
           LTRIM(RTRIM(ISNULL(e.exp_name, A.CLIENTCODE))),
           LTRIM(RTRIM(ISNULL(e.CLIENT_STATUS, ''))),
           A.CREDIT_PERIOD, A.HAS_TERMS,
           A.OUTSTANDING,
           ISNULL(ua.UNADJUSTED, 0),
           ISNULL(ua.ADVANCE, 0),
           -- net receivable = pending on bills less credits never applied to a bill,
           -- floored at zero so a client sitting on surplus credit does not net off
           -- against other clients in the portfolio total
           CASE WHEN A.OUTSTANDING - ISNULL(ua.UNADJUSTED, 0) > 0
                THEN A.OUTSTANDING - ISNULL(ua.UNADJUSTED, 0) ELSE 0 END,
           CASE WHEN A.OVERDUE - ISNULL(ua.UNADJUSTED, 0) > 0
                THEN A.OVERDUE - ISNULL(ua.UNADJUSTED, 0) ELSE 0 END,
           ISNULL(ag.N6 + ag.N7 + ag.N8 + ag.N9, 0),
           ISNULL(ag.N7 + ag.N8 + ag.N9, 0),
           ISNULL(U.UNBILLED, 0), ISNULL(U.UNBILLED_JOBS, 0),
           A.BILLED_PERIOD, A.BILLED_90,
           C.DAYS_WTD, C.DAYS_SIMPLE, C.MIN_DAYS, C.MAX_DAYS,
           (A.BILLED_90 / 90.0) * A.CREDIT_PERIOD * 1.5,
           A.PENDING_PERIOD
      FROM (
            SELECT v.CLIENTCODE,
                   MAX(v.CREDIT_PERIOD)                                            AS CREDIT_PERIOD,
                   MAX(CONVERT(INT, v.HAS_TERMS))                                  AS HAS_TERMS,
                   SUM(CASE WHEN o.PENDING IS NOT NULL THEN o.PENDING ELSE 0 END)  AS OUTSTANDING,
                   SUM(CASE WHEN o.PENDING IS NOT NULL AND v.IN_PERIOD = 1
                            THEN o.PENDING ELSE 0 END)                             AS PENDING_PERIOD,
                   SUM(CASE WHEN o.OVERDUE_DAYS > 0 THEN o.PENDING ELSE 0 END)     AS OVERDUE,
                   0                                                              AS OVER_180,
                   0                                                              AS OVER_365,
                   SUM(CASE WHEN v.IN_PERIOD = 1 THEN v.TOTALAMT ELSE 0 END)       AS BILLED_PERIOD,
                   SUM(CASE WHEN v.INV_DT >= CONVERT(DATETIME, @T90_YMD, 112)
                             AND v.INV_DT <= @ASON THEN v.TOTALAMT ELSE 0 END)     AS BILLED_90
              FROM #INV v
              LEFT JOIN #OPEN o ON o.INV_NO = v.INV_NO
             GROUP BY v.CLIENTCODE
           ) A
      LEFT JOIN exp_master e ON LTRIM(RTRIM(e.exp_code)) = A.CLIENTCODE
      LEFT JOIN #COLL C ON C.CLIENTCODE = A.CLIENTCODE
      LEFT JOIN #AGE ag ON ag.CLIENTCODE = A.CLIENTCODE
      LEFT JOIN #UNADJ ua ON ua.CLIENTCODE = A.CLIENTCODE
      LEFT JOIN (
                 SELECT j.CLIENTCODE,
                        SUM(ISNULL(x.PURCHASE_EXP,0) + ISNULL(x.BANKCASH_EXP,0) + ISNULL(x.JV_EXP,0)) AS UNBILLED,
                        COUNT(*) AS UNBILLED_JOBS
                   FROM #JOBS j
                   LEFT JOIN #JOBEXP x ON x.JOBNO = j.JOBNO
                  WHERE j.IS_BILLED = 0 AND (j.JOB_CLASS = 'SHIPMENT' OR EXISTS (SELECT 1 FROM #JOBEXP g WHERE g.JOBNO = j.JOBNO AND ISNULL(g.PURCHASE_EXP,0)+ISNULL(g.BANKCASH_EXP,0)+ISNULL(g.JV_EXP,0) > 0.01))
                  GROUP BY j.CLIENTCODE
                ) U ON U.CLIENTCODE = A.CLIENTCODE

    -- clients that have open jobs but no invoice history in scope still belong on the list
    INSERT INTO #CLIENT (CLIENTCODE, CLIENTNAME, CLIENT_STATUS, CREDIT_PERIOD, HAS_TERMS,
                         GROSS_PENDING, UNADJUSTED, ADVANCE,
                         OUTSTANDING, OVERDUE, OVER_180, OVER_365, UNBILLED, UNBILLED_JOBS,
                         BILLED_PERIOD, BILLED_90, DAYS_WTD, DAYS_SIMPLE, MIN_DAYS, MAX_DAYS, SUGGESTED_LIMIT)
    SELECT U.CLIENTCODE,
           LTRIM(RTRIM(ISNULL(e.exp_name, U.CLIENTCODE))),
           LTRIM(RTRIM(ISNULL(e.CLIENT_STATUS, ''))),
           30, 0, 0, 0, 0, 0, 0, 0, 0, U.UNBILLED, U.UNBILLED_JOBS, 0, 0, NULL, NULL, NULL, NULL, 0
      FROM (
            SELECT j.CLIENTCODE,
                   SUM(ISNULL(x.PURCHASE_EXP,0) + ISNULL(x.BANKCASH_EXP,0) + ISNULL(x.JV_EXP,0)) AS UNBILLED,
                   COUNT(*) AS UNBILLED_JOBS
              FROM #JOBS j
              LEFT JOIN #JOBEXP x ON x.JOBNO = j.JOBNO
             WHERE j.IS_BILLED = 0 AND (j.JOB_CLASS = 'SHIPMENT' OR EXISTS (SELECT 1 FROM #JOBEXP g WHERE g.JOBNO = j.JOBNO AND ISNULL(g.PURCHASE_EXP,0)+ISNULL(g.BANKCASH_EXP,0)+ISNULL(g.JV_EXP,0) > 0.01))
             GROUP BY j.CLIENTCODE
           ) U
      LEFT JOIN exp_master e ON LTRIM(RTRIM(e.exp_code)) = U.CLIENTCODE
     WHERE NOT EXISTS (SELECT 1 FROM #CLIENT c WHERE c.CLIENTCODE = U.CLIENTCODE)

    CREATE CLUSTERED INDEX IX_CLIENT ON #CLIENT (CLIENTCODE)

    ---------------------------------------------------------------------------------
    -- 11. Derived risk figures
    --     RISK_SCORE 0-100, higher is worse:
    --        40% utilisation (capped 200%), 30% recovery gap (capped 90 days),
    --        30% share of receivable older than 180 days.
    ---------------------------------------------------------------------------------
    CREATE TABLE #RISK
    (
        CLIENTCODE     VARCHAR(10),
        TOTAL_EXPOSURE FLOAT,
        UTILISATION    FLOAT,
        RECOVERY_GAP   FLOAT,
        PCT_OVER_180   FLOAT,
        RISK_SCORE     FLOAT,
        RISK_STATUS    VARCHAR(10),
        CLIENT_FLAG    VARCHAR(15)
    )

    INSERT INTO #RISK (CLIENTCODE, TOTAL_EXPOSURE, UTILISATION, RECOVERY_GAP, PCT_OVER_180,
                       RISK_SCORE, RISK_STATUS, CLIENT_FLAG)
    SELECT B.CLIENTCODE, B.TOTAL_EXPOSURE, B.UTILISATION, B.RECOVERY_GAP, B.PCT_OVER_180,
           B.RISK_SCORE,
           CASE WHEN B.TOTAL_EXPOSURE <= 0.01 THEN 'SETTLED'
                WHEN B.PCT_OVER_365 >= 50
                  OR UPPER(B.CLIENT_STATUS) IN ('DEFAULT', 'COURT MATTER', 'COURT CASE')
                  OR B.RISK_SCORE >= 60 THEN 'RED'
                WHEN B.HAS_TERMS = 0                THEN 'NO-TERMS'
                WHEN B.RISK_SCORE >= 30 OR B.PCT_OVER_180 >= 50 THEN 'AMBER'
                ELSE 'GREEN' END,
           CASE WHEN UPPER(B.CLIENT_STATUS) IN ('DEFAULT', 'COURT MATTER', 'COURT CASE') THEN 'WATCH'
                WHEN B.DAYS_WTD < 0                 THEN 'PREPAID'
                WHEN B.HAS_TERMS = 0                THEN 'NO-TERMS'
                ELSE '' END
      FROM (
            SELECT c.CLIENTCODE, c.CLIENT_STATUS, c.HAS_TERMS, c.OVER_365, c.DAYS_WTD, c.GROSS_PENDING,
                   c.OUTSTANDING + c.UNBILLED AS TOTAL_EXPOSURE,
                   CASE WHEN ISNULL(c.SUGGESTED_LIMIT, 0) > 0
                        THEN (c.OUTSTANDING + c.UNBILLED) / c.SUGGESTED_LIMIT * 100.0 END AS UTILISATION,
                   CASE WHEN c.DAYS_WTD IS NOT NULL THEN c.DAYS_WTD - c.CREDIT_PERIOD END AS RECOVERY_GAP,
                   CASE WHEN c.OUTSTANDING > 0 THEN c.OVER_180 / c.OUTSTANDING * 100.0 ELSE 0 END AS PCT_OVER_180,
                   CASE WHEN c.OUTSTANDING > 0 THEN c.OVER_365 / c.OUTSTANDING * 100.0 ELSE 0 END AS PCT_OVER_365,
                   0.40 * (CASE WHEN ISNULL(c.SUGGESTED_LIMIT,0) > 0
                                THEN (CASE WHEN (c.OUTSTANDING + c.UNBILLED) / c.SUGGESTED_LIMIT * 100.0 > 200
                                           THEN 200 ELSE (c.OUTSTANDING + c.UNBILLED) / c.SUGGESTED_LIMIT * 100.0 END)
                                ELSE 0 END) / 2.0
                 + 0.30 * (CASE WHEN c.DAYS_WTD IS NULL THEN 0
                                WHEN c.DAYS_WTD - c.CREDIT_PERIOD < 0 THEN 0
                                WHEN c.DAYS_WTD - c.CREDIT_PERIOD > 90 THEN 90
                                ELSE c.DAYS_WTD - c.CREDIT_PERIOD END) / 0.9
                 + 0.30 * (CASE WHEN c.OUTSTANDING > 0 THEN c.OVER_180 / c.OUTSTANDING * 100.0 ELSE 0 END)
                   AS RISK_SCORE
              FROM #CLIENT c
           ) B

    CREATE CLUSTERED INDEX IX_RISK ON #RISK (CLIENTCODE)


    /*=============================================================================
      RESULT SETS
    =============================================================================*/

    ---------------------------------------------------------------------------------
    -- Table : KPI summary (one row)
    ---------------------------------------------------------------------------------
    -- Duty recovery. Duty is OUT of margin because it is the client's money passing
    -- through - but it has to be visible somewhere, or duty paid and never billed back
    -- becomes invisible. Paid is every duty voucher on the job up to @TODATE; billed is
    -- every duty charge invoiced on it, whenever invoiced, because recovery often comes
    -- in a later month. PENDING is our cash still sitting with Customs for the client.
    ---------------------------------------------------------------------------------
    CREATE TABLE #DUTY (JOBNO VARCHAR(25), PAID FLOAT, BILLED FLOAT)

    INSERT INTO #DUTY (JOBNO, PAID, BILLED)
    SELECT X.JOBNO, SUM(X.PAID), SUM(X.BILLED)
      FROM (
            SELECT LTRIM(RTRIM(d.jobno)) AS JOBNO,
                   CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(d.amount)), ''), '0')) AS PAID,
                   0 AS BILLED
              FROM acc_bankdtls d
             INNER JOIN acc_bank b ON b.entryno = d.entryno
             WHERE ISNULL(d.jobno, '') <> ''
               AND d.entrytype = 'JB'
               AND b.status IN ('BP', 'CP', 'CE')
               AND LTRIM(RTRIM(d.client)) IN (SELECT ACCTCODE FROM #DUTYHEAD)
            UNION ALL
            SELECT LTRIM(RTRIM(pd.pur_jobno)),
                   CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(pd.pur_amount)), ''), '0')), 0
              FROM acc_purchasedtls pd
             WHERE ISNULL(pd.pur_jobno, '') <> ''
               AND LTRIM(RTRIM(pd.pur_account)) IN (SELECT ACCTCODE FROM #DUTYHEAD)
            UNION ALL
            SELECT LTRIM(RTRIM(jd.jv_jobno)),
                   CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(jd.jv_debit)), ''), '0')), 0
              FROM acc_JournalVoucDtls jd
             WHERE ISNULL(jd.jv_jobno, '') <> ''
               AND LTRIM(RTRIM(jd.jv_account)) IN (SELECT ACCTCODE FROM #DUTYHEAD)
            UNION ALL
            SELECT ji.JOBNO, 0,
                   CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(ic.inv_inramt)), ''), '0'))
                       / CONVERT(FLOAT, CASE WHEN ISNULL(n.NJOBS, 0) < 1 THEN 1 ELSE n.NJOBS END)
              FROM #JOBINV ji
             INNER JOIN acc_invcharge ic ON ic.inv_no = ji.INV_NO
              LEFT JOIN #INVJOBCNT n ON n.INV_NO = ji.INV_NO
             WHERE LTRIM(RTRIM(ISNULL(ic.inv_account, ''))) IN (SELECT ACCTCODE FROM #DUTYHEAD)
            UNION ALL
            SELECT ji.JOBNO, 0,
                   CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(ic.inv_inramt)), ''), '0'))
                       / CONVERT(FLOAT, CASE WHEN ISNULL(n.NJOBS, 0) < 1 THEN 1 ELSE n.NJOBS END)
              FROM #JOBINV ji
             INNER JOIN acc_invcharge1 ic ON ic.inv_no = ji.INV_NO
              LEFT JOIN #INVJOBCNT n ON n.INV_NO = ji.INV_NO
             WHERE LTRIM(RTRIM(ISNULL(ic.inv_account, ''))) IN (SELECT ACCTCODE FROM #DUTYHEAD)
           ) X
     INNER JOIN #JOBS j ON j.JOBNO = X.JOBNO
     GROUP BY X.JOBNO
    CREATE CLUSTERED INDEX IX_DUTY ON #DUTY (JOBNO)

    ---------------------------------------------------------------------------------
    SELECT
        '100'                                                        AS STATUS,
        @FROMDATE                                                    AS FROMDATE,
        @TODATE                                                      AS TODATE,
        CONVERT(DECIMAL(18,2), ISNULL(SUM(c.OUTSTANDING), 0))        AS TOTAL_OUTSTANDING,
        CONVERT(DECIMAL(18,2), ISNULL(SUM(c.OVERDUE), 0))            AS OVERDUE_AMT,
        CONVERT(DECIMAL(18,2), ISNULL(SUM(c.GROSS_PENDING), 0))      AS GROSS_PENDING,
        CONVERT(DECIMAL(18,2), ISNULL(SUM(c.PENDING_PERIOD), 0))     AS PENDING_PERIOD,
        -- the part of bills pending that is the opening balance brought forward
        CONVERT(DECIMAL(18,2), (SELECT ISNULL(SUM(o.PENDING), 0) FROM #OPEN o WHERE o.INV_NO LIKE 'OPBAL-%')) AS OPENING_PENDING,
        CONVERT(VARCHAR(10), @OPBASE_DT, 103)                        AS OPENING_ASOF,
        CONVERT(DECIMAL(18,2), ISNULL(SUM(c.UNADJUSTED), 0))         AS UNADJUSTED_CREDITS,
        -- The card used to show pending and unadjusted side by side, and they do not
        -- subtract to the headline: credit is netted PER CLIENT, so a customer sitting
        -- on more credit than open bills cannot pay off anybody else's bills. Split the
        -- credit into the part that actually knocked bills off and the part left over,
        -- so that GROSS_PENDING - CREDIT_APPLIED = TOTAL_OUTSTANDING exactly.
        CONVERT(DECIMAL(18,2), ISNULL(SUM(CASE WHEN c.UNADJUSTED < c.GROSS_PENDING
                                               THEN c.UNADJUSTED ELSE c.GROSS_PENDING END), 0))
                                                                     AS CREDIT_APPLIED,
        CONVERT(DECIMAL(18,2), ISNULL(SUM(CASE WHEN c.UNADJUSTED > c.GROSS_PENDING
                                               THEN c.UNADJUSTED - c.GROSS_PENDING ELSE 0 END), 0))
                                                                     AS CREDIT_STRANDED,
        -- of the credit above, the part that is credit notes nobody linked to a bill.
        -- Shown on the card on its own line: it is money the client is owed, but it is
        -- also a posting Accounts should go back and attach to the right invoice.
        CONVERT(DECIMAL(18,2), (SELECT ISNULL(SUM(f.AMT), 0) FROM #CNFREE f))   AS CN_UNLINKED,
        (SELECT ISNULL(SUM(f.NOTES), 0) FROM #CNFREE f)                         AS CN_UNLINKED_NOTES,
        (SELECT COUNT(*) FROM #CNFREE f)                                        AS CN_UNLINKED_CLIENTS,
        CONVERT(DECIMAL(18,2), ISNULL(SUM(c.ADVANCE), 0))            AS ADVANCE_HELD,
        CONVERT(DECIMAL(18,2), ISNULL(SUM(c.UNBILLED), 0))           AS UNBILLED_VALUE,
        ISNULL(SUM(c.UNBILLED_JOBS), 0)                              AS UNBILLED_JOBS,
        CONVERT(DECIMAL(18,2), ISNULL(SUM(c.OUTSTANDING), 0) + ISNULL(SUM(c.UNBILLED), 0)) AS TOTAL_EXPOSURE,
        CONVERT(DECIMAL(18,2), ISNULL(SUM(c.BILLED_PERIOD), 0))      AS BILLED_PERIOD,
        -- portfolio DSO: value weighted, over clients that actually take time to pay.
        -- Prepaid clients (negative days) are excluded here so they cannot mask real delay.
        CONVERT(DECIMAL(18,2),
            CASE WHEN SUM(CASE WHEN c.DAYS_WTD > 0 THEN c.BILLED_PERIOD ELSE 0 END) > 0
                 THEN SUM(CASE WHEN c.DAYS_WTD > 0 THEN c.DAYS_WTD * c.BILLED_PERIOD ELSE 0 END)
                    / SUM(CASE WHEN c.DAYS_WTD > 0 THEN c.BILLED_PERIOD ELSE 0 END) END) AS AVG_COLLECTION_DAYS,
        -- range of recovery: the single fastest and slowest settled bill in the period.
        -- Fastest ignores prepaid bills (negative days) so it stays meaningful; slowest is the true max.
        (SELECT TOP 1 x.DAYS   FROM #COLLX x WHERE x.DAYS >= 0 ORDER BY x.DAYS ASC,  x.ALLOC DESC) AS FASTEST_DAYS,
        (SELECT TOP 1 x.INV_NO FROM #COLLX x WHERE x.DAYS >= 0 ORDER BY x.DAYS ASC,  x.ALLOC DESC) AS FASTEST_INV,
        (SELECT TOP 1 ISNULL(cl.CLIENTNAME, x.CLIENTCODE) FROM #COLLX x LEFT JOIN #CLIENT cl ON cl.CLIENTCODE = x.CLIENTCODE
          WHERE x.DAYS >= 0 ORDER BY x.DAYS ASC,  x.ALLOC DESC)                                  AS FASTEST_CLIENT,
        (SELECT TOP 1 x.DAYS   FROM #COLLX x ORDER BY x.DAYS DESC, x.ALLOC DESC)                 AS SLOWEST_DAYS,
        (SELECT TOP 1 x.INV_NO FROM #COLLX x ORDER BY x.DAYS DESC, x.ALLOC DESC)                 AS SLOWEST_INV,
        (SELECT TOP 1 ISNULL(cl.CLIENTNAME, x.CLIENTCODE) FROM #COLLX x LEFT JOIN #CLIENT cl ON cl.CLIENTCODE = x.CLIENTCODE
          ORDER BY x.DAYS DESC, x.ALLOC DESC)                                                    AS SLOWEST_CLIENT,
        (SELECT COUNT(*) FROM #COLLX)                                                            AS SETTLED_BILLS,
        CONVERT(DECIMAL(18,2),
            CASE WHEN SUM(CASE WHEN c.HAS_TERMS = 1 THEN 1 ELSE 0 END) > 0
                 THEN SUM(CASE WHEN c.HAS_TERMS = 1 THEN CONVERT(FLOAT, c.CREDIT_PERIOD) ELSE 0 END)
                    / SUM(CASE WHEN c.HAS_TERMS = 1 THEN 1 ELSE 0 END) END)              AS AVG_CREDIT_PERIOD,
        CONVERT(DECIMAL(18,2),
            CASE WHEN SUM(CASE WHEN c.DAYS_WTD > 0 THEN c.BILLED_PERIOD ELSE 0 END) > 0
                 THEN SUM(CASE WHEN c.DAYS_WTD > 0 THEN c.DAYS_WTD * c.BILLED_PERIOD ELSE 0 END)
                    / SUM(CASE WHEN c.DAYS_WTD > 0 THEN c.BILLED_PERIOD ELSE 0 END)
                    - CASE WHEN SUM(CASE WHEN c.HAS_TERMS = 1 THEN 1 ELSE 0 END) > 0
                           THEN SUM(CASE WHEN c.HAS_TERMS = 1 THEN CONVERT(FLOAT, c.CREDIT_PERIOD) ELSE 0 END)
                              / SUM(CASE WHEN c.HAS_TERMS = 1 THEN 1 ELSE 0 END) ELSE 0 END END) AS RECOVERY_GAP,
        (SELECT CONVERT(DECIMAL(18,2), ISNULL(SUM(AMT_INR), 0)) FROM #MIX WHERE IS_INR = 1 AND TAXABLE_FLAG = 'TAXABLE')     AS TAXABLE_INR,
        (SELECT CONVERT(DECIMAL(18,2), ISNULL(SUM(AMT_INR), 0)) FROM #MIX WHERE IS_INR = 1 AND TAXABLE_FLAG = 'NON-TAXABLE') AS NONTAXABLE_INR,
        (SELECT CONVERT(DECIMAL(18,2), ISNULL(SUM(AMT_INR), 0)) FROM #MIX WHERE IS_INR = 0 AND TAXABLE_FLAG = 'TAXABLE')     AS TAXABLE_FX_INR,
        (SELECT CONVERT(DECIMAL(18,2), ISNULL(SUM(AMT_INR), 0)) FROM #MIX WHERE IS_INR = 0 AND TAXABLE_FLAG = 'NON-TAXABLE') AS NONTAXABLE_FX_INR,
        (SELECT CONVERT(DECIMAL(18,2), ISNULL(SUM(GST_AMT), 0)) FROM #MIX)                                                   AS GST_AMT,
        (SELECT CONVERT(DECIMAL(18,2), ISNULL(SUM(PAID), 0))   FROM #DUTY)                                                  AS DUTY_PAID_TOT,
        (SELECT CONVERT(DECIMAL(18,2), ISNULL(SUM(BILLED), 0)) FROM #DUTY)                                                  AS DUTY_BILLED_TOT,
        (SELECT CONVERT(DECIMAL(18,2), ISNULL(SUM(CASE WHEN PAID - BILLED > 1 THEN PAID - BILLED END), 0)) FROM #DUTY)       AS DUTY_PENDING_TOT,
        (SELECT COUNT(*) FROM #DUTY WHERE PAID - BILLED > 1)                                                                AS DUTY_PENDING_JOBS,
        (SELECT CONVERT(DECIMAL(18,2), ISNULL(SUM(REVENUE), 0)) FROM #MARGIN)                                                AS REVENUE_PERIOD,
        (SELECT CONVERT(DECIMAL(18,2), ISNULL(SUM(COST), 0))    FROM #MARGIN)                                                AS COST_PERIOD,
        (SELECT CONVERT(DECIMAL(18,2),
                CASE WHEN SUM(REVENUE) > 0 THEN (SUM(REVENUE) - SUM(COST)) / SUM(REVENUE) * 100.0 END) FROM #MARGIN)         AS MARGIN_PCT,
        SUM(CASE WHEN c.OUTSTANDING > 0.01 THEN 1 ELSE 0 END)        AS CLIENT_COUNT,
        (SELECT COUNT(*) FROM #INV WHERE IN_PERIOD = 1)              AS INVOICE_COUNT,
        (SELECT COUNT(*) FROM #RISK WHERE RISK_STATUS = 'RED')       AS RED_CLIENTS,
        (SELECT COUNT(*) FROM #RISK WHERE RISK_STATUS = 'AMBER')     AS AMBER_CLIENTS,
        (SELECT COUNT(*) FROM #RISK WHERE RISK_STATUS = 'NO-TERMS')  AS NOTERMS_CLIENTS
      FROM #CLIENT c

    ---------------------------------------------------------------------------------
    -- Table1 : client exposure + risk
    ---------------------------------------------------------------------------------
    SELECT c.CLIENTCODE,
           c.CLIENTNAME,
           c.CREDIT_PERIOD,
           c.HAS_TERMS,
           CONVERT(DECIMAL(18,2), ISNULL(c.SUGGESTED_LIMIT, 0)) AS SUGGESTED_LIMIT,
           CONVERT(DECIMAL(18,2), c.OUTSTANDING)                AS OUTSTANDING,
           CONVERT(DECIMAL(18,2), c.OVERDUE)                    AS OVERDUE,
           CONVERT(DECIMAL(18,2), c.GROSS_PENDING)              AS GROSS_PENDING,
           CONVERT(DECIMAL(18,2), ISNULL(c.PENDING_PERIOD, 0))  AS PENDING_PERIOD,
           CONVERT(DECIMAL(18,2), c.UNADJUSTED)                 AS UNADJUSTED,
           CONVERT(DECIMAL(18,2), c.ADVANCE)                    AS ADVANCE,
           CONVERT(DECIMAL(18,2), c.UNBILLED)                   AS UNBILLED,
           c.UNBILLED_JOBS,
           CONVERT(DECIMAL(18,2), r.TOTAL_EXPOSURE)             AS TOTAL_EXPOSURE,
           CONVERT(DECIMAL(18,2), r.UTILISATION)                AS UTILISATION_PCT,
           CONVERT(DECIMAL(18,2), c.DAYS_WTD)                   AS AVG_COLLECTION_DAYS,
           CONVERT(DECIMAL(18,2), r.RECOVERY_GAP)               AS RECOVERY_GAP,
           CONVERT(DECIMAL(18,2), r.PCT_OVER_180)               AS PCT_OVER_180,
           CONVERT(DECIMAL(18,2), r.RISK_SCORE)                 AS RISK_SCORE,
           r.RISK_STATUS,
           r.CLIENT_FLAG,
           CONVERT(DECIMAL(18,2), c.BILLED_PERIOD)              AS BILLED_PERIOD
      FROM #CLIENT c
     INNER JOIN #RISK r ON r.CLIENTCODE = c.CLIENTCODE
     WHERE c.OUTSTANDING > 0.01 OR c.UNBILLED > 0.01 OR c.BILLED_PERIOD > 0.01
     ORDER BY r.TOTAL_EXPOSURE DESC

    ---------------------------------------------------------------------------------
    -- Table2 : credit period vs actual recovery, top @TOPN by billing in the period
    ---------------------------------------------------------------------------------
    SELECT TOP (@TOPN_N)
           c.CLIENTCODE,
           c.CLIENTNAME,
           c.CREDIT_PERIOD,
           c.HAS_TERMS,
           CONVERT(DECIMAL(18,2), c.DAYS_WTD)     AS ACTUAL_DAYS_WTD,
           CONVERT(DECIMAL(18,2), c.DAYS_SIMPLE)  AS ACTUAL_DAYS_SIMPLE,
           c.MIN_DAYS,
           c.MAX_DAYS,
           CONVERT(DECIMAL(18,2), r.RECOVERY_GAP) AS RECOVERY_GAP,
           CONVERT(DECIMAL(18,2), c.BILLED_PERIOD) AS BILLED_AMT,
           r.CLIENT_FLAG
      FROM #CLIENT c
     INNER JOIN #RISK r ON r.CLIENTCODE = c.CLIENTCODE
     WHERE c.DAYS_WTD IS NOT NULL
     ORDER BY c.BILLED_PERIOD DESC

    ---------------------------------------------------------------------------------
    -- Table3 : taxable / non-taxable by currency (PERIOD)
    ---------------------------------------------------------------------------------
    SELECT m.CUR_CODE,
           LTRIM(RTRIM(ISNULL(cm.cur_name, m.CUR_CODE))) AS CUR_NAME,
           m.IS_INR,
           m.TAXABLE_FLAG,
           SUM(m.LINES_)                                      AS LINES_,
           CONVERT(DECIMAL(18,2), SUM(m.AMT_ORIG_CUR))        AS AMT_ORIG_CUR,
           CONVERT(DECIMAL(18,2), SUM(m.AMT_INR))             AS AMT_INR,
           CONVERT(DECIMAL(18,2), SUM(m.GST_AMT))             AS GST_AMT
      FROM #MIX m
      LEFT JOIN cur_master cm ON LTRIM(RTRIM(cm.cur_code)) = m.CUR_CODE
     GROUP BY m.CUR_CODE, LTRIM(RTRIM(ISNULL(cm.cur_name, m.CUR_CODE))), m.IS_INR, m.TAXABLE_FLAG
     ORDER BY m.IS_INR DESC, SUM(m.AMT_INR) DESC

    ---------------------------------------------------------------------------------
    -- Table4 : unbilled ageing buckets (PERIOD, by job date)
    ---------------------------------------------------------------------------------
    SELECT BKT.AGE_BUCKET,
           BKT.SORTORDER,
           COUNT(*)                                                                        AS JOBS,
           SUM(CASE WHEN ISNULL(x.JOBNO,'') <> '' THEN 1 ELSE 0 END)                        AS JOBS_WITH_COST,
           CONVERT(DECIMAL(18,2),
               SUM(ISNULL(x.PURCHASE_EXP,0) + ISNULL(x.BANKCASH_EXP,0) + ISNULL(x.JV_EXP,0))) AS COST_VALUE
      FROM (
            SELECT j.JOBNO, j.MODE_,
                   CASE WHEN DATEDIFF(DAY, j.JOB_DT, @ASON) <= 7  THEN '0-7 days'
                        WHEN DATEDIFF(DAY, j.JOB_DT, @ASON) <= 15 THEN '8-15 days'
                        WHEN DATEDIFF(DAY, j.JOB_DT, @ASON) <= 30 THEN '16-30 days'
                        ELSE '31+ days' END AS AGE_BUCKET,
                   CASE WHEN DATEDIFF(DAY, j.JOB_DT, @ASON) <= 7  THEN 1
                        WHEN DATEDIFF(DAY, j.JOB_DT, @ASON) <= 15 THEN 2
                        WHEN DATEDIFF(DAY, j.JOB_DT, @ASON) <= 30 THEN 3
                        ELSE 4 END AS SORTORDER
              FROM #JOBS j
             WHERE j.IS_BILLED = 0 AND (j.JOB_CLASS = 'SHIPMENT' OR EXISTS (SELECT 1 FROM #JOBEXP g WHERE g.JOBNO = j.JOBNO AND ISNULL(g.PURCHASE_EXP,0)+ISNULL(g.BANKCASH_EXP,0)+ISNULL(g.JV_EXP,0) > 0.01))
           ) BKT
      LEFT JOIN #JOBEXP x ON x.JOBNO = BKT.JOBNO
     GROUP BY BKT.AGE_BUCKET, BKT.SORTORDER
     ORDER BY BKT.SORTORDER

    ---------------------------------------------------------------------------------
    -- Table5 : unbilled job list
    ---------------------------------------------------------------------------------
    SELECT j.JOBNO,
           j.MODE_,
           j.CLIENTCODE,
           LTRIM(RTRIM(ISNULL(e.exp_name, j.CLIENTCODE)))          AS CLIENTNAME,
           CONVERT(VARCHAR(10), j.JOB_DT, 103)                     AS JOB_DATE,
           DATEDIFF(DAY, j.JOB_DT, @ASON)                          AS AGE_DAYS,
           CONVERT(DECIMAL(18,2), ISNULL(x.PURCHASE_EXP, 0))       AS PURCHASE_EXP,
           CONVERT(DECIMAL(18,2), ISNULL(x.BANKCASH_EXP, 0))       AS BANKCASH_EXP,
           CONVERT(DECIMAL(18,2), ISNULL(x.JV_EXP, 0))             AS JV_EXP,
           CONVERT(DECIMAL(18,2), ISNULL(x.PURCHASE_EXP,0) + ISNULL(x.BANKCASH_EXP,0) + ISNULL(x.JV_EXP,0)) AS TOTAL_COST
      FROM #JOBS j
      LEFT JOIN #JOBEXP x   ON x.JOBNO = j.JOBNO
      LEFT JOIN exp_master e ON LTRIM(RTRIM(e.exp_code)) = j.CLIENTCODE
     WHERE j.IS_BILLED = 0 AND (j.JOB_CLASS = 'SHIPMENT' OR EXISTS (SELECT 1 FROM #JOBEXP g WHERE g.JOBNO = j.JOBNO AND ISNULL(g.PURCHASE_EXP,0)+ISNULL(g.BANKCASH_EXP,0)+ISNULL(g.JV_EXP,0) > 0.01))
     ORDER BY ISNULL(x.PURCHASE_EXP,0) + ISNULL(x.BANKCASH_EXP,0) + ISNULL(x.JV_EXP,0) DESC,
              j.JOB_DT

    ---------------------------------------------------------------------------------
    -- Table6 : receivable ageing, AS-ON. Buckets are NET of unapplied credit, allocated
    --          oldest first; GROSS_PENDING is returned alongside for reconciliation.
    ---------------------------------------------------------------------------------
    SELECT TOP (@TOPN_N)
           a.CLIENTCODE,
           LTRIM(RTRIM(ISNULL(e.exp_name, a.CLIENTCODE)))                       AS CLIENTNAME,
           CONVERT(DECIMAL(18,2), a.N1+a.N2+a.N3+a.N4+a.N5+a.N6+a.N7+a.N8+a.N9) AS RECEIVABLE,
           CONVERT(DECIMAL(18,2), a.N1)                                         AS DAYS_000_030,
           CONVERT(DECIMAL(18,2), a.N2)                                         AS DAYS_031_060,
           CONVERT(DECIMAL(18,2), a.N3)                                         AS DAYS_061_090,
           CONVERT(DECIMAL(18,2), a.N4)                                         AS DAYS_091_120,
           CONVERT(DECIMAL(18,2), a.N5)                                         AS DAYS_121_180,
           CONVERT(DECIMAL(18,2), a.N6)                                         AS DAYS_181_365,
           CONVERT(DECIMAL(18,2), a.N7)                                         AS DAYS_366_730,
           CONVERT(DECIMAL(18,2), a.N8)                                         AS DAYS_731_1095,
           CONVERT(DECIMAL(18,2), a.N9)                                         AS DAYS_1096_9999,
           CONVERT(DECIMAL(18,2), a.B1+a.B2+a.B3+a.B4+a.B5+a.B6+a.B7+a.B8+a.B9) AS GROSS_PENDING
      FROM #AGE a
      LEFT JOIN exp_master e ON LTRIM(RTRIM(e.exp_code)) = a.CLIENTCODE
     WHERE a.N1+a.N2+a.N3+a.N4+a.N5+a.N6+a.N7+a.N8+a.N9 > 0.01
     ORDER BY a.N1+a.N2+a.N3+a.N4+a.N5+a.N6+a.N7+a.N8+a.N9 DESC

    ---------------------------------------------------------------------------------
    -- Table7 : margin by CLIENT x SERVICE TYPE (PERIOD) - LEDGER income / expense
    --   SERVICE_TYPE: import master flags / summary-table flags / inference.  'UNCLASS'
    --   is returned as its own row rather than hidden: for FY2025-26 roughly 63% of
    --   jobs carry no service flag, and burying that would overstate confidence in
    --   the split.  REVENUE is allocated equally across the jobs named on an invoice.
    ---------------------------------------------------------------------------------
    -- exp_master trimmed once for Table7, Table8 and Table12: each looks up clients by
    -- LTRIM(RTRIM(exp_code)). Table7 / Table12 re-scanned and re-trimmed
    -- exp_master for every output row (perf 2026-10-21: 0.22 s / 88k reads and 0.20 s /
    -- 78k; now 0.05 and 0.01 s), and Table8 planned on a guess of 5.4M rows and sorted
    -- for it (0.29 s of CPU, now 0.10 s). One row per
    -- exp_master row, same column types, so a lookup returns exactly what it did.
    CREATE TABLE #EXPM (EXP_CODE NVARCHAR(10), exp_name NVARCHAR(70))
    INSERT INTO #EXPM (EXP_CODE, exp_name)
    SELECT LTRIM(RTRIM(exp_code)), exp_name FROM exp_master
    CREATE CLUSTERED INDEX IX_EXPM ON #EXPM (EXP_CODE)

    ;WITH AGG AS (
        SELECT m.BILLCLIENT AS CLIENTCODE, m.SERVICE_TYPE,
               SUM(m.JOBS) AS JOBS, SUM(m.INFERRED_JOBS) AS INFERRED_JOBS,
               SUM(m.REVENUE) AS REVENUE, SUM(m.COST) AS COST, SUM(m.UNMATCHED) AS UNMATCHED,
               SUM(m.DUTY_PAID) AS DUTY_PAID, SUM(m.DUTY_RECO) AS DUTY_RECO,
               MAX(m.LAST_INV_DT) AS LAST_INV_DT
          FROM #MARGIN m
         GROUP BY m.BILLCLIENT, m.SERVICE_TYPE
    ),
    OTH AS (
        -- the counterpart party on the same rows, biggest first, plus how many there are
        SELECT BILLCLIENT AS CLIENTCODE, SERVICE_TYPE, CLIENTCODE AS OTHERCODE,
               ROW_NUMBER() OVER (PARTITION BY BILLCLIENT, SERVICE_TYPE ORDER BY SUM(REVENUE) DESC, CLIENTCODE) AS RN,
               COUNT(*) OVER (PARTITION BY BILLCLIENT, SERVICE_TYPE) AS OTHER_COUNT
          FROM #MARGIN
         GROUP BY BILLCLIENT, SERVICE_TYPE, CLIENTCODE
    )
    SELECT a.CLIENTCODE,
           LTRIM(RTRIM(ISNULL(e.exp_name, a.CLIENTCODE)))       AS CLIENTNAME,
           a.SERVICE_TYPE,
           a.JOBS                                               AS JOBS,
           a.INFERRED_JOBS                                      AS INFERRED_JOBS,
           CONVERT(DECIMAL(18,2), a.REVENUE)                    AS REVENUE,
           CONVERT(DECIMAL(18,2), a.COST)                       AS COST,
           CONVERT(DECIMAL(18,2), a.REVENUE - a.COST)           AS MARGIN,
           CONVERT(DECIMAL(18,2),
               CASE WHEN a.REVENUE > 0
                    THEN (a.REVENUE - a.COST) / a.REVENUE * 100.0 END) AS MARGIN_PCT,
           CONVERT(DECIMAL(18,2), a.DUTY_PAID)                  AS DUTY_PAID,
           CONVERT(DECIMAL(18,2), a.DUTY_RECO)                  AS DUTY_RECO,
           CONVERT(VARCHAR(10), a.LAST_INV_DT, 103)             AS LAST_BILLED,      -- dd/MM/yyyy for display
           CONVERT(VARCHAR(8),  a.LAST_INV_DT, 112)             AS LAST_BILLED_YMD,  -- yyyyMMdd for sorting
           ISNULL(o.OTHERCODE, '')                              AS OTHER_CODE,
           LTRIM(RTRIM(ISNULL(o2.exp_name, ISNULL(o.OTHERCODE, '')))) AS OTHER_NAME,
           ISNULL(o.OTHER_COUNT, 0)                             AS OTHER_COUNT,
           CONVERT(DECIMAL(18,2), ISNULL(a.UNMATCHED, 0))       AS UNMATCHED_COST
      FROM AGG a
      LEFT JOIN OTH o ON o.CLIENTCODE = a.CLIENTCODE AND o.SERVICE_TYPE = a.SERVICE_TYPE AND o.RN = 1
      LEFT JOIN #EXPM e  ON e.EXP_CODE  = a.CLIENTCODE      -- #EXPM: see Table7
      LEFT JOIN #EXPM o2 ON o2.EXP_CODE = o.OTHERCODE
     WHERE a.REVENUE > 0.01 OR a.COST > 0.01
     ORDER BY a.REVENUE DESC

    ---------------------------------------------------------------------------------
    -- Table8 : JOB-WISE P&L detail (PERIOD) - the drill-down under the Margin view,
    --          same grain as the Job Profit report. One row per job in the period,
    --          income/expense/P&L from the LEDGER (#JOBINC / #JOBEXP); the summary
    --          table's figures are returned alongside for reference.
    ---------------------------------------------------------------------------------
    SELECT j.JOBNO,
           j.MODE_,
           j.SERVICE_TYPE,
           j.SERVICE_SRC,
           j.JOB_CLASS,
           j.CLIENTCODE,
           LTRIM(RTRIM(ISNULL(e.exp_name, j.CLIENTCODE)))            AS CLIENTNAME,
           j.BILLCLIENT,
           LTRIM(RTRIM(ISNULL(b.exp_name, j.BILLCLIENT)))            AS BILLCLIENTNAME,
           CONVERT(VARCHAR(10), j.JOB_DT, 103)                       AS JOB_DATE,
           j.IS_BILLED,
           -- ledger income (invoices net of GST) and expense (booked job cost)
           CONVERT(DECIMAL(18,2), ISNULL(inc.REVENUE, 0))                                           AS INCOME,
           CONVERT(DECIMAL(18,2), ISNULL(x.PURCHASE_EXP,0) + ISNULL(x.BANKCASH_EXP,0) + ISNULL(x.JV_EXP,0)) AS EXPENSE,
           CONVERT(DECIMAL(18,2), ISNULL(inc.REVENUE, 0)
                                - (ISNULL(x.PURCHASE_EXP,0) + ISNULL(x.BANKCASH_EXP,0) + ISNULL(x.JV_EXP,0))) AS PROFIT,
           CONVERT(DECIMAL(18,2),
               CASE WHEN ISNULL(inc.REVENUE, 0) <> 0
                    THEN (inc.REVENUE - (ISNULL(x.PURCHASE_EXP,0) + ISNULL(x.BANKCASH_EXP,0) + ISNULL(x.JV_EXP,0)))
                         / inc.REVENUE * 100.0 END)                                                 AS PROFIT_PCT,
           CONVERT(VARCHAR(10), inc.LAST_INV_DT, 103)                AS LAST_BILLED,
           CONVERT(DECIMAL(18,2), ISNULL(s.TOT_RECO, 0))             AS SUMMARY_INCOME,   -- reference only
           CONVERT(DECIMAL(18,2), ISNULL(s.TOT_PAID, 0))             AS SUMMARY_EXPENSE,  -- reference only
           CONVERT(DECIMAL(18,2), ISNULL(s.TOT_DUTY_PAID, 0))        AS DUTY_PAID,
           CONVERT(DECIMAL(18,2), ISNULL(s.TOT_DUTY_RECO, 0))        AS DUTY_RECO
      FROM #JOBS j
      LEFT JOIN #SSJ s ON s.JOBNO = j.JOBNO
      LEFT JOIN #EXPM e ON e.EXP_CODE = j.CLIENTCODE         -- #EXPM: see Table7
      LEFT JOIN #EXPM b ON b.EXP_CODE = j.BILLCLIENT
      LEFT JOIN #JOBEXP x ON x.JOBNO = j.JOBNO
      LEFT JOIN #JOBINC inc ON inc.JOBNO = j.JOBNO
     -- MISC jobs are absent from TBL_SHIPMENT_SUMMARY_JOB entirely (it carries only
     -- shipment type digits), so they have no job-wise P&L. Including the empty shells
     -- would add ~1,200 all-zero rows the UI can never reach. Keep only those with a
     -- P&L row or real booked cost; the overall gap is reported in Table11 instead.
     WHERE j.JOB_CLASS = 'SHIPMENT'
        OR s.JOBNO IS NOT NULL
        OR ISNULL(inc.REVENUE, 0) <> 0
        OR ISNULL(x.PURCHASE_EXP,0) + ISNULL(x.BANKCASH_EXP,0) + ISNULL(x.JV_EXP,0) > 0.01
     ORDER BY j.CLIENTCODE, ISNULL(inc.REVENUE, 0) DESC

    ---------------------------------------------------------------------------------
    -- Table9 : UNBILLED JOB EXPENSE LINES - the voucher-level breakdown behind each
    --          unbilled job: which purchase / payment / JV put cost on the job.
    --          GENACCT_MASTER carries every ledger (expense heads and suppliers), so
    --          one name lookup covers all three sources.
    ---------------------------------------------------------------------------------
    -- SOURCE_ groups the three cost buckets (PURCHASE / BANK-CASH / JV); VCH_TYPE is the
    -- ERP voucher abbreviation users know: PI purchase invoice, BP bank payment,
    -- CP cash payment, CE cash expense, JV journal voucher.
    SELECT X.JOBNO, X.SOURCE_, X.VCH_TYPE, X.REFNO, X.REF_DATE, X.ACCTCODE,
           LTRIM(RTRIM(ISNULL(g.ACCTNAME, X.ACCTCODE)))              AS ACCTNAME,
           CONVERT(DECIMAL(18,2), X.AMT)                             AS AMOUNT
      FROM (
            SELECT j.JOBNO, 'PURCHASE' AS SOURCE_, 'PI' AS VCH_TYPE,
                   LTRIM(RTRIM(pd.pur_code)) AS REFNO,
                   LTRIM(RTRIM(ISNULL(p.pur_date, ''))) AS REF_DATE,
                   LTRIM(RTRIM(ISNULL(pd.pur_account, ''))) AS ACCTCODE,
                   CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(pd.pur_amount)), ''), '0')) AS AMT
              FROM #PURJ pd                            -- purchase lines of #JOBS, see #JEC
             INNER JOIN #JOBS j ON j.JOBNO = pd.JOBNO AND j.IS_BILLED = 0
             INNER JOIN #JOBHEAD jhx ON jhx.ACCTCODE = LTRIM(RTRIM(pd.pur_account))
              LEFT JOIN acc_purchase p ON LTRIM(RTRIM(p.pur_code)) = LTRIM(RTRIM(pd.pur_code))

            UNION ALL

            SELECT j.JOBNO, 'BANK/CASH', LTRIM(RTRIM(ISNULL(b.status, ''))),
                   LTRIM(RTRIM(d.entryno)),
                   LTRIM(RTRIM(ISNULL(b.entrydt, ''))),
                   LTRIM(RTRIM(ISNULL(d.client, ''))),
                   CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(d.amount)), ''), '0'))
              FROM acc_bankdtls d
             INNER JOIN acc_bank b ON b.entryno = d.entryno
             INNER JOIN #JOBS j ON j.JOBNO = LTRIM(RTRIM(d.jobno)) AND j.IS_BILLED = 0
             INNER JOIN #JOBHEAD jhx ON jhx.ACCTCODE = LTRIM(RTRIM(d.client))
             WHERE d.entrytype = 'JB' AND b.status IN ('BP', 'CP', 'CE')

            UNION ALL

            SELECT j.JOBNO, 'JV', 'JV',
                   LTRIM(RTRIM(jd.jvcode)),
                   LTRIM(RTRIM(ISNULL(jh.jv_date, ''))),
                   LTRIM(RTRIM(ISNULL(jd.jv_account, ''))),
                   CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(jd.jv_debit)), ''), '0'))
              FROM acc_JournalVoucDtls jd
             INNER JOIN acc_JournalVouc jh ON jh.jvcode = jd.jvcode
             INNER JOIN #JOBS j ON j.JOBNO = LTRIM(RTRIM(jd.jv_jobno)) AND j.IS_BILLED = 0
             INNER JOIN #JOBHEAD jhx ON jhx.ACCTCODE = LTRIM(RTRIM(jd.jv_account))
           ) X
      LEFT JOIN GENACCT_MASTER g ON LTRIM(RTRIM(g.ACCTCODE)) = X.ACCTCODE
     WHERE X.AMT <> 0
     ORDER BY X.JOBNO, X.SOURCE_, X.REFNO


    ---------------------------------------------------------------------------------
    -- Table10 : CASH FUNNEL (PERIOD) - Jobs -> Invoiced -> Collected.
    --
    --   THREE stages, not four. A "POD / billing ready" stage is not buildable: every
    --   delivery-named column is 0% populated (expt_delivered, expt_delivereddt,
    --   deliverydt) and imports have no delivery signal at all
    --   (DELIVERY_VALIDATE_DT 27.6%, DO_RECEIVED_ON 0.8%). Note expt_pod is 99.8%
    --   populated but is PORT OF DISCHARGE (ANR/LIL/HAM), NOT proof of delivery.
    --   A stage that silently dropped 2/3 of exports and all imports would read as a
    --   business collapse rather than a data gap.
    --
    --   Stage 1 value is BOOKED COST, not revenue - a job that is not yet invoiced has
    --   no revenue figure. It is labelled as such so nobody reads it as a sales number.
    --   Stage 3 comes from #SETTLE, the SAME allocation set that DSO and net
    --   outstanding are derived from; re-deriving it from acc_bankdtls would guarantee
    --   the funnel eventually disagrees with the Receivables tab.
    ---------------------------------------------------------------------------------
    DECLARE @F1_JOBS INT, @F1_VAL FLOAT, @F2_JOBS INT, @F2_VAL FLOAT, @F3_JOBS INT, @F3_VAL FLOAT

    -- counts are the SHIPMENT pipeline only: ~790 MISC admin shells are never intended
    -- to be invoiced, and counting them would show a fake 8% billing leak at stage 2.
    -- Values stay on the all-invoice basis so stage 2 ties to BILLED_PERIOD on the KPI.
    SELECT @F1_JOBS = COUNT(*) FROM #JOBS WHERE JOB_CLASS = 'SHIPMENT'
    SELECT @F1_VAL  = ISNULL(SUM(ISNULL(x.PURCHASE_EXP,0) + ISNULL(x.BANKCASH_EXP,0) + ISNULL(x.JV_EXP,0)), 0)
      FROM #JOBS j LEFT JOIN #JOBEXP x ON x.JOBNO = j.JOBNO

    -- Stage 2 value is the FULL invoiced value (#INV.TOTALAMT, in period), not
    -- #MARGIN.REVENUE. #MARGIN.REVENUE is net of GST and covers only jobs present in
    -- the shipment summary, so it is not comparable with stage 3 (cash settled against
    -- whole invoices) - using it made Collected (611.4M) exceed Invoiced (249.1M) and
    -- the funnel grew instead of narrowing. On this basis stage2 -> stage3 is a true
    -- collection ratio and stage 2 ties to the BILLED_PERIOD figure on the KPI card.
    SELECT @F2_JOBS = COUNT(*) FROM #JOBS WHERE IS_BILLED = 1 AND JOB_CLASS = 'SHIPMENT'
    SELECT @F2_VAL  = ISNULL(SUM(TOTALAMT), 0) FROM #INV WHERE IN_PERIOD = 1

    SELECT @F3_JOBS = COUNT(DISTINCT ji.JOBNO)
      FROM #JOBINV ji INNER JOIN #SETTLE s ON s.INV_NO = ji.INV_NO
                      INNER JOIN #JOBS jj ON jj.JOBNO = ji.JOBNO AND jj.JOB_CLASS = 'SHIPMENT'
     WHERE s.ALLOC > 0.01
    SELECT @F3_VAL  = ISNULL(SUM(s.ALLOC), 0)
      FROM #SETTLE s INNER JOIN #INV v ON v.INV_NO = s.INV_NO AND v.IN_PERIOD = 1

    SELECT STAGE_NO, STAGE, JOBS,
           CONVERT(DECIMAL(18,2), VALUE_INR) AS VALUE_INR,
           VALUE_LABEL,
           CONVERT(DECIMAL(9,2), CASE WHEN PREV_JOBS > 0 THEN JOBS * 100.0 / PREV_JOBS END)  AS PCT_OF_PREV,
           CONVERT(DECIMAL(9,2), CASE WHEN @F1_JOBS > 0 THEN JOBS * 100.0 / @F1_JOBS END)    AS PCT_OF_FIRST
      FROM (
            SELECT 1 AS STAGE_NO, 'Jobs'      AS STAGE, @F1_JOBS AS JOBS, @F1_VAL AS VALUE_INR, 'Booked cost' AS VALUE_LABEL, @F1_JOBS AS PREV_JOBS
            UNION ALL
            SELECT 2, 'Invoiced', @F2_JOBS, @F2_VAL, 'Invoiced value', @F1_JOBS
            UNION ALL
            SELECT 3, 'Collected', @F3_JOBS, @F3_VAL, 'Cash received', @F2_JOBS
           ) F
     ORDER BY STAGE_NO

    ---------------------------------------------------------------------------------
    -- Table11 : BILLING COVERAGE / INVOICING LAG (PERIOD).
    --   Replaces the "estimated unbilled revenue" idea, which back-tested worse than
    --   booked cost (MAPE 3.85 vs 0.53 on air export). How FAST jobs get billed is the
    --   measure the data actually supports.
    --   Lag is floored at 0 because advance invoicing exists. No true median: 2008 R2
    --   has no PERCENTILE_CONT, so the modal bucket is reported instead.
    ---------------------------------------------------------------------------------
    CREATE TABLE #LAG (JOBNO VARCHAR(25), LAG_DAYS INT)

    INSERT INTO #LAG (JOBNO, LAG_DAYS)
    SELECT ji.JOBNO,
           CASE WHEN DATEDIFF(DAY, j.JOB_DT, MIN(v.INV_DT)) < 0 THEN 0
                ELSE DATEDIFF(DAY, j.JOB_DT, MIN(v.INV_DT)) END
      FROM #JOBINV ji
     INNER JOIN #JOBS j ON j.JOBNO = ji.JOBNO
     INNER JOIN #INV  v ON v.INV_NO = ji.INV_NO
     GROUP BY ji.JOBNO, j.JOB_DT

    SELECT (SELECT COUNT(*) FROM #JOBS WHERE JOB_CLASS = 'SHIPMENT')             AS TOTAL_JOBS,
           (SELECT COUNT(*) FROM #JOBS WHERE IS_BILLED = 1 AND JOB_CLASS = 'SHIPMENT') AS BILLED_JOBS,
           (SELECT COUNT(*) FROM #JOBS j WHERE j.IS_BILLED = 0 AND (j.JOB_CLASS = 'SHIPMENT' OR EXISTS (SELECT 1 FROM #JOBEXP g WHERE g.JOBNO = j.JOBNO AND ISNULL(g.PURCHASE_EXP,0)+ISNULL(g.BANKCASH_EXP,0)+ISNULL(g.JV_EXP,0) > 0.01))) AS UNBILLED_JOBS,
           CONVERT(DECIMAL(9,2),
               CASE WHEN (SELECT COUNT(*) FROM #JOBS WHERE JOB_CLASS = 'SHIPMENT') > 0
                    THEN (SELECT COUNT(*) FROM #JOBS WHERE IS_BILLED = 1 AND JOB_CLASS = 'SHIPMENT') * 100.0
                       / (SELECT COUNT(*) FROM #JOBS WHERE JOB_CLASS = 'SHIPMENT') END) AS COVERAGE_PCT,
           CONVERT(DECIMAL(9,2), (SELECT AVG(CONVERT(FLOAT, LAG_DAYS)) FROM #LAG)) AS AVG_LAG_DAYS,
           (SELECT COUNT(*) FROM #LAG WHERE LAG_DAYS BETWEEN 0  AND 7)          AS LAG_0_7,
           (SELECT COUNT(*) FROM #LAG WHERE LAG_DAYS BETWEEN 8  AND 15)         AS LAG_8_15,
           (SELECT COUNT(*) FROM #LAG WHERE LAG_DAYS BETWEEN 16 AND 30)         AS LAG_16_30,
           (SELECT COUNT(*) FROM #LAG WHERE LAG_DAYS BETWEEN 31 AND 60)         AS LAG_31_60,
           (SELECT COUNT(*) FROM #LAG WHERE LAG_DAYS > 60)                      AS LAG_60P,
           (SELECT MAX(DATEDIFF(DAY, j.JOB_DT, @ASON)) FROM #JOBS j WHERE j.IS_BILLED = 0 AND (j.JOB_CLASS = 'SHIPMENT' OR EXISTS (SELECT 1 FROM #JOBEXP g WHERE g.JOBNO = j.JOBNO AND ISNULL(g.PURCHASE_EXP,0)+ISNULL(g.BANKCASH_EXP,0)+ISNULL(g.JV_EXP,0) > 0.01))) AS OLDEST_UNBILLED_DAYS,
           (SELECT COUNT(*) FROM #JOBS WHERE SERVICE_SRC = 'INFERRED')          AS INFERRED_JOBS,
           (SELECT COUNT(*) FROM #JOBS WHERE SERVICE_SRC = 'MASTER')            AS MASTER_JOBS,
           (SELECT COUNT(*) FROM #JOBS WHERE SERVICE_TYPE = 'UNCLASS')     AS UNCLASSIFIED_JOBS,
           -- MISC (non-shipment) jobs carry real invoiced value but are absent from
           -- TBL_SHIPMENT_SUMMARY_JOB, so no job-wise P&L exists for them and they
           -- cannot appear in the margin view. Reported so the gap is visible.
           (SELECT COUNT(*) FROM #JOBS WHERE JOB_CLASS = 'MISC')                AS MISC_JOBS,
           (SELECT COUNT(*) FROM #JOBS WHERE JOB_CLASS = 'MISC' AND IS_BILLED = 1) AS MISC_BILLED_NO_PL

    ---------------------------------------------------------------------------------
    -- Table12 : the same margin grouped by SHIPPER (the party on the job file) instead
    --           of the billed party. Identical column contract to Table7, so the
    --           screen's "Show by" switch just swaps one array for the other. Totals
    --           are the same in both; only the name the money sits under changes.
    ---------------------------------------------------------------------------------
    ;WITH AGG AS (
        SELECT m.CLIENTCODE AS CLIENTCODE, m.SERVICE_TYPE,
               SUM(m.JOBS_SHIP) AS JOBS, SUM(m.INFERRED_SHIP) AS INFERRED_JOBS,
               SUM(m.REVENUE) AS REVENUE, SUM(m.COST) AS COST, SUM(m.UNMATCHED) AS UNMATCHED,
               SUM(m.DUTY_PAID) AS DUTY_PAID, SUM(m.DUTY_RECO) AS DUTY_RECO,
               MAX(m.LAST_INV_DT) AS LAST_INV_DT
          FROM #MARGIN m
         GROUP BY m.CLIENTCODE, m.SERVICE_TYPE
    ),
    OTH AS (
        -- the counterpart party on the same rows, biggest first, plus how many there are
        SELECT CLIENTCODE AS CLIENTCODE, SERVICE_TYPE, BILLCLIENT AS OTHERCODE,
               ROW_NUMBER() OVER (PARTITION BY CLIENTCODE, SERVICE_TYPE ORDER BY SUM(REVENUE) DESC, BILLCLIENT) AS RN,
               COUNT(*) OVER (PARTITION BY CLIENTCODE, SERVICE_TYPE) AS OTHER_COUNT
          FROM #MARGIN
         GROUP BY CLIENTCODE, SERVICE_TYPE, BILLCLIENT
    )
    SELECT a.CLIENTCODE,
           LTRIM(RTRIM(ISNULL(e.exp_name, a.CLIENTCODE)))       AS CLIENTNAME,
           a.SERVICE_TYPE,
           a.JOBS                                               AS JOBS,
           a.INFERRED_JOBS                                      AS INFERRED_JOBS,
           CONVERT(DECIMAL(18,2), a.REVENUE)                    AS REVENUE,
           CONVERT(DECIMAL(18,2), a.COST)                       AS COST,
           CONVERT(DECIMAL(18,2), a.REVENUE - a.COST)           AS MARGIN,
           CONVERT(DECIMAL(18,2),
               CASE WHEN a.REVENUE > 0
                    THEN (a.REVENUE - a.COST) / a.REVENUE * 100.0 END) AS MARGIN_PCT,
           CONVERT(DECIMAL(18,2), a.DUTY_PAID)                  AS DUTY_PAID,
           CONVERT(DECIMAL(18,2), a.DUTY_RECO)                  AS DUTY_RECO,
           CONVERT(VARCHAR(10), a.LAST_INV_DT, 103)             AS LAST_BILLED,      -- dd/MM/yyyy for display
           CONVERT(VARCHAR(8),  a.LAST_INV_DT, 112)             AS LAST_BILLED_YMD,  -- yyyyMMdd for sorting
           ISNULL(o.OTHERCODE, '')                              AS OTHER_CODE,
           LTRIM(RTRIM(ISNULL(o2.exp_name, ISNULL(o.OTHERCODE, '')))) AS OTHER_NAME,
           ISNULL(o.OTHER_COUNT, 0)                             AS OTHER_COUNT,
           CONVERT(DECIMAL(18,2), ISNULL(a.UNMATCHED, 0))       AS UNMATCHED_COST
      FROM AGG a
      LEFT JOIN OTH o ON o.CLIENTCODE = a.CLIENTCODE AND o.SERVICE_TYPE = a.SERVICE_TYPE AND o.RN = 1
      LEFT JOIN #EXPM e  ON e.EXP_CODE  = a.CLIENTCODE      -- #EXPM: see Table7
      LEFT JOIN #EXPM o2 ON o2.EXP_CODE = o.OTHERCODE
     WHERE a.REVENUE > 0.01 OR a.COST > 0.01
     ORDER BY a.REVENUE DESC

    ---------------------------------------------------------------------------------
    -- Table13 : each job's P&L split by client - the rows behind the Billed-party view.
    --           CLIENTS_ON_JOB > 1 marks a job billed to several parties.
    ---------------------------------------------------------------------------------
    SELECT p.JOBNO,
           p.CLIENTCODE,
           LTRIM(RTRIM(ISNULL(e.exp_name, p.CLIENTCODE)))                      AS CLIENTNAME,
           CONVERT(DECIMAL(18,2), p.REVENUE)                                   AS INCOME,
           CONVERT(DECIMAL(18,2), p.COST)                                      AS EXPENSE,
           CONVERT(DECIMAL(18,2), p.UNMATCHED)                                 AS UNMATCHED_COST,
           CONVERT(DECIMAL(18,2), p.REVENUE - p.COST)                          AS PROFIT,
           CONVERT(DECIMAL(18,2), CASE WHEN p.REVENUE <> 0
                THEN (p.REVENUE - p.COST) / p.REVENUE * 100.0 END)             AS PROFIT_PCT,
           CONVERT(VARCHAR(10), p.LAST_DT, 103)                                AS LAST_BILLED,
           c.N                                                                 AS CLIENTS_ON_JOB
      FROM #JCP p
     INNER JOIN (SELECT JOBNO, COUNT(*) AS N FROM #JCP GROUP BY JOBNO) c ON c.JOBNO = p.JOBNO
      LEFT JOIN exp_master e ON LTRIM(RTRIM(e.exp_code)) = p.CLIENTCODE
     ORDER BY p.JOBNO, p.REVENUE DESC
    ---------------------------------------------------------------------------------
    -- Table14 : Duty recovery - one row per job where duty is still to come back,
    --           biggest first, with the party to chase and how long it has been out.
    ---------------------------------------------------------------------------------
    SELECT d.JOBNO,
           LTRIM(RTRIM(ISNULL(e.exp_name, j.BILLCLIENT)))            AS CLIENTNAME,
           j.MODE_,
           CONVERT(VARCHAR(10), j.JOB_DT, 103)                       AS JOB_DATE,
           CONVERT(DECIMAL(18,2), d.PAID)                            AS DUTY_PAID,
           CONVERT(DECIMAL(18,2), d.BILLED)                          AS DUTY_BILLED,
           CONVERT(DECIMAL(18,2), d.PAID - d.BILLED)                 AS DUTY_PENDING,
           DATEDIFF(DAY, j.JOB_DT, @ASON)                            AS AGE_DAYS,
           CASE WHEN d.BILLED <= 0.01 THEN 'NOTHING BILLED BACK' ELSE 'PART BILLED' END AS STATUS_
      FROM #DUTY d
     INNER JOIN #JOBS j ON j.JOBNO = d.JOBNO
      LEFT JOIN exp_master e ON LTRIM(RTRIM(e.exp_code)) = j.BILLCLIENT
     WHERE d.PAID - d.BILLED > 1
     ORDER BY d.PAID - d.BILLED DESC


    ---------------------------------------------------------------------------------
    -- Table15 : outstanding by financial year of the bill
    ---------------------------------------------------------------------------------
    SELECT f.FY_START,
           CONVERT(VARCHAR(4), f.FY_START) + '-' + RIGHT('0' + CONVERT(VARCHAR(4), (f.FY_START + 1) % 100), 2)                                        AS FY,
           COUNT(DISTINCT f.CLIENTCODE)                              AS CLIENTS,
           SUM(f.BILLS)                                              AS BILLS,
           CONVERT(DECIMAL(18,2), SUM(f.GROSS))                      AS GROSS_PENDING,
           CONVERT(DECIMAL(18,2), SUM(f.GROSS - f.NETOUT))           AS CREDIT_APPLIED,
           CONVERT(DECIMAL(18,2), SUM(f.NETOUT))                     AS OUTSTANDING,
           CONVERT(DECIMAL(18,2), SUM(f.NETOVER))                    AS OVERDUE,
           CONVERT(DECIMAL(18,2), SUM(f.OPENING))                    AS OPENING_PART,
           -- what is still inside its credit period, and the oldest bill in the year
           CONVERT(DECIMAL(18,2), SUM(f.NETOUT) - SUM(f.NETOVER))     AS NOT_YET_DUE,
           CONVERT(VARCHAR(10), MIN(f.OLDEST_DT), 103)                AS OLDEST_BILL,
           DATEDIFF(DAY, MIN(f.OLDEST_DT), @ASON)                     AS OLDEST_DAYS
      FROM #FYO f
     GROUP BY f.FY_START
     ORDER BY f.FY_START DESC

    -- The client-by-client breakdown of each year used to be returned here. It is not
    -- any more: this procedure runs on every page load, and the extra result set was
    -- 639 rows on Links and 1,692 on Manilal of data the screen only needed if somebody
    -- opened a year. The dashboards show the year summary alone; the breakdown is in
    -- USP_ACC_RPT_ACCOUNTS_HOME_DRILL, which is called only when a card is clicked.

    ---------------------------------------------------------------------------------
    -- Table16 : the voucher lines behind the "unmatched cost" column of Table13. One row
    --           per cost line per client that carried a share of it; SHARE sums to that
    --           client's UNMATCHED_COST. VCH_TYPE is the Account Statement's own code.
    --
    --           Returned ONLY when one client is selected. Across all clients it was
    --           2,898 rows on Links and the dashboard already carries 8,700 job rows;
    --           this page runs on every open and the extra weight was holding up the
    --           other menus. The same lines for the current month are on the Accounts
    --           Home GOP drill, which is fetched on demand.
    ---------------------------------------------------------------------------------
    CREATE TABLE #UNM (JOBNO VARCHAR(25), HEAD VARCHAR(10))
    INSERT INTO #UNM (JOBNO, HEAD)
    SELECT e.JOBNO, e.HEAD
      FROM #JECP e
     WHERE NOT EXISTS (SELECT 1 FROM #JECB b WHERE b.JOBNO = e.JOBNO AND b.COSTHEAD = e.HEAD)
       AND EXISTS (SELECT 1 FROM #JC c WHERE c.JOBNO = e.JOBNO)
    CREATE CLUSTERED INDEX IX_UNM ON #UNM (JOBNO, HEAD)

    IF @CLIENTCODE = ''
        SELECT TOP 0
               CONVERT(VARCHAR(10), '') AS CLIENTCODE, CONVERT(VARCHAR(200), '') AS CLIENTNAME,
               CONVERT(VARCHAR(25), '') AS JOBNO, CONVERT(VARCHAR(10), '') AS SOURCE_,
               CONVERT(VARCHAR(4), '') AS VCH_TYPE, CONVERT(VARCHAR(30), '') AS REFNO,
               CONVERT(VARCHAR(12), '') AS REF_DATE, CONVERT(VARCHAR(10), '') AS ACCTCODE,
               CONVERT(VARCHAR(200), '') AS ACCTNAME, CONVERT(VARCHAR(200), '') AS SUPPLIER,
               CONVERT(DECIMAL(18,2), 0) AS LINE_AMOUNT, CONVERT(DECIMAL(18,2), 0) AS SHARE,
               CONVERT(DECIMAL(18,1), 0) AS SHARE_PCT
    ELSE
    SELECT c.CLIENTCODE,
           LTRIM(RTRIM(ISNULL(ec.exp_name, c.CLIENTCODE)))           AS CLIENTNAME,
           X.JOBNO,
           X.SOURCE_,
           X.VCH_TYPE,
           X.REFNO,
           X.REF_DATE,
           X.ACCTCODE,
           LTRIM(RTRIM(ISNULL(g.acctname, X.ACCTCODE)))              AS ACCTNAME,
           LTRIM(RTRIM(ISNULL(sp.acctname, '')))                     AS SUPPLIER,
           CONVERT(DECIMAL(18,2), X.AMT)                             AS LINE_AMOUNT,
           CONVERT(DECIMAL(18,2), X.AMT * c.INC / jt.TOT)            AS SHARE,
           CONVERT(DECIMAL(18,1), 100.0 * c.INC / jt.TOT)            AS SHARE_PCT
      FROM (
            SELECT u.JOBNO, 'PURCHASE' AS SOURCE_, 'PI' AS VCH_TYPE,
                   LTRIM(RTRIM(pd.pur_code))                         AS REFNO,
                   LTRIM(RTRIM(ISNULL(p.pur_date, '')))              AS REF_DATE,
                   u.HEAD                                            AS ACCTCODE,
                   LTRIM(RTRIM(ISNULL(p.pur_supplier, '')))          AS PARTYCODE,
                   CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(pd.pur_amount)), ''), '0')) AS AMT
              FROM #PURJ pd                            -- purchase lines of #JOBS, see #JEC
             INNER JOIN #UNM u ON u.JOBNO = pd.JOBNO
                               AND u.HEAD  = LTRIM(RTRIM(pd.pur_account))
              LEFT JOIN acc_purchase p ON LTRIM(RTRIM(p.pur_code)) = LTRIM(RTRIM(pd.pur_code))

            UNION ALL

            SELECT u.JOBNO, 'BANK/CASH', LTRIM(RTRIM(ISNULL(b.status, ''))),
                   LTRIM(RTRIM(d.entryno)),
                   LTRIM(RTRIM(ISNULL(b.entrydt, ''))),
                   u.HEAD,
                   '',
                   CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(d.amount)), ''), '0'))
              FROM acc_bankdtls d
             INNER JOIN acc_bank b ON b.entryno = d.entryno
             INNER JOIN #UNM u ON u.JOBNO = LTRIM(RTRIM(d.jobno))
                               AND u.HEAD  = LTRIM(RTRIM(d.client))
             WHERE d.entrytype = 'JB' AND b.status IN ('BP', 'CP', 'CE')

            UNION ALL

            SELECT u.JOBNO, 'JOURNAL', 'JV',
                   LTRIM(RTRIM(jd.jvcode)),
                   LTRIM(RTRIM(ISNULL(jh.jv_date, ''))),
                   u.HEAD,
                   '',
                   CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(jd.jv_debit)), ''), '0'))
              FROM acc_JournalVoucDtls jd
             INNER JOIN acc_JournalVouc jh ON jh.jvcode = jd.jvcode
             INNER JOIN #UNM u ON u.JOBNO = LTRIM(RTRIM(jd.jv_jobno))
                               AND u.HEAD  = LTRIM(RTRIM(jd.jv_account))
           ) X
     INNER JOIN #JC c ON c.JOBNO = X.JOBNO
     INNER JOIN (SELECT JOBNO, SUM(INC) AS TOT FROM #JC GROUP BY JOBNO) jt ON jt.JOBNO = X.JOBNO
      LEFT JOIN GENACCT_MASTER g  ON LTRIM(RTRIM(g.acctcode)) = X.ACCTCODE
      LEFT JOIN GENACCT_MASTER sp ON LTRIM(RTRIM(sp.acctcode)) = X.PARTYCODE
      LEFT JOIN exp_master ec ON LTRIM(RTRIM(ec.exp_code)) = c.CLIENTCODE
     WHERE X.AMT > 0.01
     ORDER BY c.CLIENTCODE, X.AMT DESC

    ---------------------------------------------------------------------------------
    -- cleanup
    ---------------------------------------------------------------------------------
    DROP TABLE #CITY
    DROP TABLE #UNM
    DROP TABLE #FYO
    DROP TABLE #INV
    DROP TABLE #OPBASE
    DROP TABLE #OPNET
    DROP TABLE #OPAO
    DROP TABLE #JOBHEAD
    DROP TABLE #DUTYHEAD
    DROP TABLE #DUTY
    DROP TABLE #SVCCAT
    DROP TABLE #JEC
    DROP TABLE #JIC
    DROP TABLE #JCH
    DROP TABLE #JC
    DROP TABLE #JECP
    DROP TABLE #PAIRS
    DROP TABLE #JECB
    DROP TABLE #ALLOC
    DROP TABLE #JCP
    DROP TABLE #INVMODE
    DROP TABLE #UNADJ
    DROP TABLE #AGE
    DROP TABLE #SETTLE
    DROP TABLE #OPEN
    DROP TABLE #COLL
    DROP TABLE #COLLX
    DROP TABLE #JOBS
    DROP TABLE #JOBCLI
    DROP TABLE #INVJOBPD
    DROP TABLE #INVJOB
    DROP TABLE #JOBEXP
    DROP TABLE #INVJOBCNT
    DROP TABLE #JOBINC
    DROP TABLE #JOBINVDT
    DROP TABLE #JOBINV
    DROP TABLE #SVCHEAD
    DROP TABLE #LAG
    DROP TABLE #CHG
    DROP TABLE #INVP
    DROP TABLE #MIX
    DROP TABLE #MARGIN
    DROP TABLE #CLIENT
    DROP TABLE #RISK
    -- the four below were never dropped; harmless in a procedure, but listed so the body
    -- can also be run as a plain batch (old vs new comparison) without leaving them behind
    DROP TABLE #WOHEAD
    DROP TABLE #JVADJ
    DROP TABLE #CNFREE
    DROP TABLE #JOBBILL
    DROP TABLE #IJN
    DROP TABLE #EXPCP
    DROP TABLE #WOJV
    DROP TABLE #CNLINK
    DROP TABLE #SETTLEX
    DROP TABLE #BRCR
    DROP TABLE #JIV
    DROP TABLE #SSJ
    DROP TABLE #JECX
    DROP TABLE #PURJ
    DROP TABLE #EXPM
    DROP TABLE #EXK
END
GO

SET NOEXEC OFF;
GO
/* ---- 3. verify + one timed call (read-only) -------------------------------------------------- */
DECLARE @RunCheck BIT, @FROM NVARCHAR(15), @TO NVARCHAR(15), @T0 DATETIME;
SET @RunCheck = 1;     -- 1 = call the procedure once (financial year to date) and print its time
SET @TO   = CONVERT(NVARCHAR(10), GETDATE(), 103);
SET @FROM = '01/04/' + CONVERT(NVARCHAR(4), YEAR(GETDATE()) - CASE WHEN MONTH(GETDATE()) < 4 THEN 1 ELSE 0 END);

IF CHARINDEX('INTO #IJN', OBJECT_DEFINITION(OBJECT_ID('dbo.USP_ACC_RPT_FINANCE_DASHBOARD', 'P'))) > 0
BEGIN
    PRINT 'OK: USP_ACC_RPT_FINANCE_DASHBOARD on ' + DB_NAME() + ' is the fast version.';
    IF @RunCheck = 1
    BEGIN
        SET @T0 = GETDATE();
        EXEC dbo.USP_ACC_RPT_FINANCE_DASHBOARD @FROMDATE = @FROM, @TODATE = @TO, @CMPCODE = '30', @CITYCODE = '110', @CLIENTCODE = '', @TOPN = '10';
        PRINT 'USP_ACC_RPT_FINANCE_DASHBOARD ' + @FROM + ' - ' + @TO + ': '
            + CONVERT(VARCHAR(12), DATEDIFF(MILLISECOND, @T0, GETDATE())) + ' ms (was about 23,000 ms).';
    END
END
ELSE
    PRINT '*** USP_ACC_RPT_FINANCE_DASHBOARD is not the fast version - see the messages above.';
GO
