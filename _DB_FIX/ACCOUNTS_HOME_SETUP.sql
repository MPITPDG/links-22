/*===============================================================================================
  ACCOUNTS_HOME_SETUP.sql

  USP_ACC_RPT_ACCOUNTS_HOME - the summary behind the Accounts module home page.

  WHAT IT IS
    A light, month-to-date cut of USP_ACC_RPT_FINANCE_DASHBOARD. That procedure is the trusted
    source for outstanding, overdue, ageing, revenue, cost and margin, but it returns eleven
    result sets and takes ~27s cold - far too heavy to run every time someone clicks the
    Finance module. This lifts the SAME temp-table logic (so the two agree to the rupee for the
    same period) and drops everything the home page does not show: collection days, billing
    mix, service-type inference, client risk scoring and the per-client TOPN joins.

    The API caches the result for 10 minutes per company/branch/day, so the proc runs once and
    every later click for ten minutes is a memory hit.

  PERIOD
    Month to date, compared with the same period last month:
        MTD   = 1st of @ASOF's month .. @ASOF
        PRIOR = 1st of previous month .. same day last month (SQL clamps the 31st to the 30th)
    Outstanding, overdue and ageing are AS-ON @ASOF, like the Finance Dashboard.

  "COLLECTED" (decision taken with Finance, 08-Sep-2026)
    Amounts APPLIED AGAINST BILLS in the period: bank-receipt lines (entrytype AB on BR/CR) and
    JV knock-offs (entrytype AB) dated in the window. Credit notes are not cash and are not
    counted. On-account receipts not yet applied to a bill are not counted either - they show
    up in outstanding falling instead.

  RESULT SETS
    Table   1 row    KPI row - see the SELECT for the column list
    Table1  5 rows   jobs opened by mode, fixed order, zeros never missing
    Table2  4 rows   receivable ageing 0-30 / 31-90 / 91-180 / over 180 (net of unapplied credit)
    Table3  <=5 rows top clients by outstanding
    Table4  30 rows  invoiced value per day for the last 30 days, zero-filled
    Table5  1 row    cash position and pipeline: payable, due windows both sides, DSO / DPO,
                     unapplied receipts, supplier advances, invoices pending authorisation,
                     proformas not converted, jobs unbilled beyond 15 days
    Table6  5 rows   cash forecast: money in vs money out - overdue, 7, 15, 30, beyond; NET of
                     unapplied credit / advances allocated oldest first, so 'overdue in' = KPI overdue
    Table7  <=5 rows client watch list: overdue, over-180, pays-beyond-terms, unapplied credit
    (the API appends CACHEINFO as the last table)

  PAYABLES (added 08-Sep-2026)
    The light form of USP_ACC_RPT_PAYABLE_DASHBOARD: supplier bills of the last 12 months
    before the month start, payments naming them, the remainder as the payable. Same value
    rules as that proc (a bill is pur_amount + pur_deduction; a payment is amount + deduction
    on a BP/CP/CE voucher, or a JV debit naming the bill) and the same due-date credibility
    rule (0..180 days after the bill, otherwise bill date + 30 and flagged as assumed).
    DSO and DPO are value-weighted over bills dated in the last 90 days that are since settled.

  Creates one new procedure; modifies nothing. Rollback: ROLLBACK_ACCOUNTS_HOME_SETUP.sql.
  SQL Server 2008 R2.
===============================================================================================*/

SET NOCOUNT ON;
GO

IF OBJECT_ID('dbo.USP_ACC_RPT_ACCOUNTS_HOME') IS NOT NULL
    DROP PROCEDURE dbo.USP_ACC_RPT_ACCOUNTS_HOME
GO

CREATE PROCEDURE dbo.USP_ACC_RPT_ACCOUNTS_HOME
    -- Every parameter defaults so a null from the API layer is tolerated. NVARCHAR, not INT
    -- or DATE, on purpose: the whole stack passes strings (see USP_ACC_RPT_FINANCE_DASHBOARD).
    @CMPCODE  NVARCHAR(2)  = NULL,
    @CITYCODE NVARCHAR(20) = NULL,   -- CITYCODE1 '101', 3-letter 'MUM', or 'ALL' / blank
    @ASOF     NVARCHAR(15) = NULL,   -- dd/MM/yyyy; blank = today
    @DEBUG    NVARCHAR(1)  = NULL    -- '1' prints the elapsed time of every section (SSMS Messages tab)
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @DBG BIT, @T0 DATETIME, @TSTART DATETIME
    SET @DBG = CASE WHEN ISNULL(@DEBUG, '0') = '1' THEN 1 ELSE 0 END
    SET @T0 = GETDATE()
    SET @TSTART = @T0
    -- ADO.NET connects with ARITHABORT OFF while SSMS uses ON, which produces a different
    -- cached plan for the same statement. Forcing it ON here makes the API path use the
    -- same plan as the tool it was tuned with.
    SET ARITHABORT ON;

    ---------------------------------------------------------------------------------
    -- 0. Parameters and the two windows
    ---------------------------------------------------------------------------------
    SET @CMPCODE  = LTRIM(RTRIM(ISNULL(@CMPCODE,  '')))
    SET @CITYCODE = LTRIM(RTRIM(ISNULL(@CITYCODE, '')))
    SET @ASOF     = LTRIM(RTRIM(ISNULL(@ASOF,     '')))

    IF @CMPCODE = ''
    BEGIN
        SELECT '101' AS STATUS, 'CMPCODE is required.' AS STATUSMSG
        RETURN
    END

    DECLARE @ASON DATETIME
    -- dd/MM/yyyy -> yyyymmdd by string surgery, then style 112: never hits the dd/mm trap.
    -- Anything that is not a readable date, including blank, means today.
    IF LEN(@ASOF) = 10 AND ISDATE(SUBSTRING(@ASOF,7,4)+SUBSTRING(@ASOF,4,2)+SUBSTRING(@ASOF,1,2)) = 1
        SET @ASON = CONVERT(DATETIME, SUBSTRING(@ASOF,7,4)+SUBSTRING(@ASOF,4,2)+SUBSTRING(@ASOF,1,2), 112)
    ELSE
        SET @ASON = CONVERT(DATETIME, CONVERT(CHAR(8), GETDATE(), 112), 112)

    DECLARE @M_FROM DATETIME, @P_FROM DATETIME, @P_TO DATETIME, @D30_FROM DATETIME
    SET @M_FROM   = DATEADD(MONTH, DATEDIFF(MONTH, 0, @ASON), 0)   -- 1st of the month
    SET @P_FROM   = DATEADD(MONTH, -1, @M_FROM)
    SET @P_TO     = DATEADD(MONTH, -1, @ASON)
    SET @D30_FROM = DATEADD(DAY, -29, @ASON)

    -- yyyymmdd twins for the varchar date columns
    DECLARE @TO_YMD CHAR(8), @M_FROM_YMD CHAR(8), @P_FROM_YMD CHAR(8), @P_TO_YMD CHAR(8), @D30_YMD CHAR(8)
    SET @TO_YMD     = CONVERT(CHAR(8), @ASON,     112)
    SET @M_FROM_YMD = CONVERT(CHAR(8), @M_FROM,   112)
    SET @P_FROM_YMD = CONVERT(CHAR(8), @P_FROM,   112)
    SET @P_TO_YMD   = CONVERT(CHAR(8), @P_TO,     112)
    SET @D30_YMD    = CONVERT(CHAR(8), @D30_FROM, 112)

    ---------------------------------------------------------------------------------
    -- 1. Branch scope - lifted from the Finance Dashboard. The UI sends CITYCODE1
    --    ('101'); the accounting tables carry the 3-letter code ('MUM'). Accept either.
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

    -- The branch NAME is not looked up here on purpose: the login already carries CITYNAME
    -- and the screen shows that. This only distinguishes one branch from all of them.
    DECLARE @BRANCH_LABEL VARCHAR(60)
    IF @CITYCODE = '' OR @CITYCODE = 'ALL'
        SET @BRANCH_LABEL = 'All branches'
    ELSE
        SELECT TOP 1 @BRANCH_LABEL = LTRIM(RTRIM(citycode))
          FROM #CITY
    SET @BRANCH_LABEL = ISNULL(@BRANCH_LABEL, @CITYCODE)

    IF @DBG = 1 BEGIN PRINT '  ' + RIGHT('        ' + CONVERT(VARCHAR(10), DATEDIFF(MS, @T0, GETDATE())), 8) + ' ms  up to section 2'; SET @T0 = GETDATE() END
    ---------------------------------------------------------------------------------
    -- 2. #INV - every invoice up to @ASON in scope. Outstanding is as-on, so the whole
    --    history is needed; PERIOD marks the MTD ('M') and prior ('P') subsets.
    ---------------------------------------------------------------------------------
    CREATE TABLE #INV
    (
        INV_NO        VARCHAR(15),
        INV_DT        DATETIME,
        CLIENTCODE    VARCHAR(10),
        CITYCODE      VARCHAR(10),
        TOTALAMT      FLOAT,
        PAYBY         DATETIME,
        CREDIT_PERIOD INT,
        HAS_TERMS     BIT,
        DUE_DT        DATETIME,
        PERIOD        CHAR(1),
        AUTH          CHAR(1)       -- P waiting on the Invoice Authorisation screen, A authorised to print
    )

    INSERT INTO #INV (INV_NO, INV_DT, CLIENTCODE, CITYCODE, TOTALAMT, PAYBY, CREDIT_PERIOD, HAS_TERMS, DUE_DT, PERIOD, AUTH)
    SELECT LTRIM(RTRIM(i.inv_no)),
           CASE WHEN ISDATE(SUBSTRING(i.inv_date,7,4)+SUBSTRING(i.inv_date,4,2)+SUBSTRING(i.inv_date,1,2)) = 1 THEN CONVERT(DATETIME, SUBSTRING(i.inv_date,7,4)+SUBSTRING(i.inv_date,4,2)+SUBSTRING(i.inv_date,1,2), 112) END,
           LTRIM(RTRIM(i.inv_client)),
           LTRIM(RTRIM(i.citycode)),
           CONVERT(FLOAT, ISNULL(i.totalamt, 0)),
           i.PAYBYDT,
           NULL, 0, NULL,
           CASE WHEN SUBSTRING(i.inv_date,7,4)+SUBSTRING(i.inv_date,4,2)+SUBSTRING(i.inv_date,1,2) BETWEEN @M_FROM_YMD AND @TO_YMD   THEN 'M'
                WHEN SUBSTRING(i.inv_date,7,4)+SUBSTRING(i.inv_date,4,2)+SUBSTRING(i.inv_date,1,2) BETWEEN @P_FROM_YMD AND @P_TO_YMD THEN 'P'
                ELSE NULL END,
           -- same rule as the Authorisation screen (USP_ACC_INV_PRINT_AUTHORISATION): an
           -- invoice is waiting while AuthorisedToPrint is blank, whoever touched it before
           CASE WHEN ISNULL(CONVERT(VARCHAR(10), i.AuthorisedToPrint), '') = '' THEN 'P' ELSE 'A' END
      FROM acc_invoice i
     INNER JOIN #CITY c ON c.CITYCODE = LTRIM(RTRIM(i.citycode))
     WHERE LTRIM(RTRIM(ISNULL(i.cmpcode, ''))) = @CMPCODE
       AND LEN(ISNULL(i.inv_date, '')) = 10
       AND SUBSTRING(i.inv_date,7,4)+SUBSTRING(i.inv_date,4,2)+SUBSTRING(i.inv_date,1,2) <= @TO_YMD
       AND LTRIM(RTRIM(ISNULL(i.inv_client, ''))) LIKE 'E%'

    -- An invoice whose date cannot be read (Links has a handful: ten characters long but not a
    -- date) is dropped here rather than aborting the whole procedure. The count is reported.
    DECLARE @BAD_DATES INT
    SELECT @BAD_DATES = COUNT(*) FROM #INV WHERE INV_DT IS NULL
    DELETE FROM #INV WHERE INV_DT IS NULL

    CREATE CLUSTERED INDEX IX_INV ON #INV (INV_NO)
    CREATE NONCLUSTERED INDEX IX_INV_CL ON #INV (CLIENTCODE)

    -- Job cost counts only the heads the Job Profit statement counts: GENACCT_MASTER
    -- ISJOBREPORT = 'Y' (USP_ACCT_RPT_JOB_PROFIT uses exactly this list). GST paid on
    -- purchases - 'GST Central / State (Paid by us)' - is not on it: it is input tax
    -- recovered, not a cost of the job, and counting it made the dashboard's expense
    -- higher than the Job Profit statement for the same job.
    CREATE TABLE #JOBHEAD (ACCTCODE VARCHAR(10) PRIMARY KEY)
    INSERT INTO #JOBHEAD (ACCTCODE)
    SELECT DISTINCT LTRIM(RTRIM(acctcode)) FROM GENACCT_MASTER
     WHERE ISJOBREPORT = 'Y' AND ISNULL(acctcode, '') <> ''

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

    INSERT INTO #INV (INV_NO, INV_DT, CLIENTCODE, CITYCODE, TOTALAMT, PAYBY, CREDIT_PERIOD, HAS_TERMS, DUE_DT, PERIOD, AUTH)
    SELECT 'OPBAL-' + n.CLIENTCODE, @OPBASE_DT, n.CLIENTCODE, (SELECT TOP 1 CITYCODE FROM #CITY),
           n.NETAMT, NULL, NULL, 0, NULL, NULL, 'A'
      FROM #OPNET n
     WHERE n.NETAMT > 0.01

    IF @DBG = 1 BEGIN PRINT '  ' + RIGHT('        ' + CONVERT(VARCHAR(10), DATEDIFF(MS, @T0, GETDATE())), 8) + ' ms  up to section 3'; SET @T0 = GETDATE() END
    ---------------------------------------------------------------------------------
    -- 3. Credit period ladder (verbatim from the Finance Dashboard): per-invoice PAYBYDT
    --    when 1..180 days, else the client master by mode, else 30.
    ---------------------------------------------------------------------------------
    UPDATE #INV
       SET CREDIT_PERIOD = DATEDIFF(DAY, INV_DT, PAYBY), HAS_TERMS = 1
     WHERE PAYBY IS NOT NULL
       AND DATEDIFF(DAY, INV_DT, PAYBY) > 0
       AND DATEDIFF(DAY, INV_DT, PAYBY) <= 180

    CREATE TABLE #INVMODE (INV_NO VARCHAR(15), MODECH CHAR(1))
    INSERT INTO #INVMODE (INV_NO, MODECH)
    SELECT LTRIM(RTRIM(j.inv_no)), MIN(SUBSTRING(LTRIM(RTRIM(j.inv_jobno)), 8, 1))
      FROM acc_invjobno j
     INNER JOIN #INV v ON v.INV_NO = LTRIM(RTRIM(j.inv_no))
     WHERE LEN(LTRIM(RTRIM(ISNULL(j.inv_jobno,'')))) >= 8
     GROUP BY LTRIM(RTRIM(j.inv_no))
    CREATE CLUSTERED INDEX IX_INVMODE ON #INVMODE (INV_NO)

    UPDATE v
       SET CREDIT_PERIOD =
             CASE WHEN ISNULL(m.MODECH,'1') IN ('2','6')
                  THEN CASE WHEN ISNUMERIC(LTRIM(RTRIM(ISNULL(e.CREDITPERIOD_AIR,'')))+'.0e0') = 1
                            THEN CONVERT(INT, CONVERT(FLOAT, LTRIM(RTRIM(e.CREDITPERIOD_AIR)))) END
                  ELSE CASE WHEN ISNUMERIC(LTRIM(RTRIM(ISNULL(e.CREDITPERIOD_SEA,'')))+'.0e0') = 1
                            THEN CONVERT(INT, CONVERT(FLOAT, LTRIM(RTRIM(e.CREDITPERIOD_SEA)))) END
             END,
           HAS_TERMS = 1
      FROM #INV v
      LEFT JOIN #INVMODE m ON m.INV_NO = v.INV_NO
     INNER JOIN exp_master e ON LTRIM(RTRIM(e.exp_code)) = v.CLIENTCODE
     WHERE v.CREDIT_PERIOD IS NULL

    UPDATE #INV SET CREDIT_PERIOD = 30, HAS_TERMS = 0 WHERE ISNULL(CREDIT_PERIOD, 0) <= 0
    UPDATE #INV SET DUE_DT = DATEADD(DAY, CREDIT_PERIOD, INV_DT)

    IF @DBG = 1 BEGIN PRINT '  ' + RIGHT('        ' + CONVERT(VARCHAR(10), DATEDIFF(MS, @T0, GETDATE())), 8) + ' ms  up to section 4'; SET @T0 = GETDATE() END
    ---------------------------------------------------------------------------------
    -- 4. #SETTLEX - every bill-wise knock-off line, with its date and source, then
    --    #SETTLE per invoice. Same three legs as the Finance Dashboard; the lines are kept
    --    because "collected in the period" is read from them.
    ---------------------------------------------------------------------------------
    CREATE TABLE #SETTLEX (INV_NO VARCHAR(15), AMT FLOAT, DT DATETIME, SRC CHAR(4))

    INSERT INTO #SETTLEX (INV_NO, AMT, DT, SRC)
    SELECT X.BILLNO, X.AMT, X.DT, X.SRC
      FROM (
            SELECT LTRIM(RTRIM(d.billno)) AS BILLNO,
                   CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(d.amount)), ''), '0')) AS AMT,
                   CASE WHEN ISDATE(SUBSTRING(b.entrydt,7,4)+SUBSTRING(b.entrydt,4,2)+SUBSTRING(b.entrydt,1,2)) = 1 THEN CONVERT(DATETIME, SUBSTRING(b.entrydt,7,4)+SUBSTRING(b.entrydt,4,2)+SUBSTRING(b.entrydt,1,2), 112) END AS DT,
                   'BANK' AS SRC
              FROM acc_bankdtls d
             INNER JOIN acc_bank b ON b.entryno = d.entryno
             -- AB = against bill. AO = against opening: when an AO line names a real invoice
             -- it settles that invoice exactly like AB (the Billwise Receivable statement does
             -- the same); AO lines naming a pre-ERP or opening-balance reference fall out here
             -- because the join below keeps only invoices in scope.
             WHERE d.entrytype IN ('AB', 'AO')
               AND b.status IN ('BR', 'CR')
               AND ISNULL(d.billno, '') <> ''
               AND LEN(ISNULL(b.entrydt, '')) = 10
               AND SUBSTRING(b.entrydt,7,4)+SUBSTRING(b.entrydt,4,2)+SUBSTRING(b.entrydt,1,2) <= @TO_YMD

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
            -- instead of the amount credited (Links company 30: 64 notes, 1.01cr more
            -- than their own value), which closed bills the Billwise Outstanding
            -- statement still shows as pending. Same fix as the Finance Dashboard.
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
     INNER JOIN #INV v ON v.INV_NO = X.BILLNO

    CREATE CLUSTERED INDEX IX_SETTLEX ON #SETTLEX (INV_NO)

    CREATE TABLE #SETTLE (INV_NO VARCHAR(15), ALLOC FLOAT)
    INSERT INTO #SETTLE (INV_NO, ALLOC)
    SELECT INV_NO, SUM(AMT) FROM #SETTLEX GROUP BY INV_NO
    CREATE CLUSTERED INDEX IX_SETTLE ON #SETTLE (INV_NO)

    IF @DBG = 1 BEGIN PRINT '  ' + RIGHT('        ' + CONVERT(VARCHAR(10), DATEDIFF(MS, @T0, GETDATE())), 8) + ' ms  up to section 5'; SET @T0 = GETDATE() END
    ---------------------------------------------------------------------------------
    -- 5. #OPEN - open items as-on @ASON (the receivable)
    ---------------------------------------------------------------------------------
    CREATE TABLE #OPEN
    (
        INV_NO       VARCHAR(15),
        CLIENTCODE   VARCHAR(10),
        PENDING      FLOAT,
        PENDING_DAYS INT,
        OVERDUE_DAYS INT
    )

    INSERT INTO #OPEN (INV_NO, CLIENTCODE, PENDING, PENDING_DAYS, OVERDUE_DAYS)
    SELECT v.INV_NO, v.CLIENTCODE,
           v.TOTALAMT - ISNULL(s.ALLOC, 0),
           DATEDIFF(DAY, v.INV_DT, @ASON),
           DATEDIFF(DAY, v.DUE_DT, @ASON)
      FROM #INV v
      LEFT JOIN #SETTLE s ON s.INV_NO = v.INV_NO
     WHERE v.TOTALAMT - ISNULL(s.ALLOC, 0) > 0.01

    CREATE CLUSTERED INDEX IX_OPEN ON #OPEN (CLIENTCODE)

    IF @DBG = 1 BEGIN PRINT '  ' + RIGHT('        ' + CONVERT(VARCHAR(10), DATEDIFF(MS, @T0, GETDATE())), 8) + ' ms  up to section 5b'; SET @T0 = GETDATE() END
    ---------------------------------------------------------------------------------
    -- 5b. #UNADJ - client credits never applied to a bill (GR / OA / AO). Netting these
    --     off is what stops every old invoice looking open for ever. Advances ('AD')
    --     are held separately, matching the receivable reports.
    ---------------------------------------------------------------------------------
    CREATE TABLE #UNADJ (CLIENTCODE VARCHAR(10), UNADJUSTED FLOAT)

    INSERT INTO #UNADJ (CLIENTCODE, UNADJUSTED)
    SELECT Z.CLIENTCODE, SUM(Z.UNADJ)
      FROM (
            SELECT LTRIM(RTRIM(d.client)) AS CLIENTCODE,
                   CASE WHEN d.entrytype = 'AD' THEN 0
                        ELSE CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(d.amount)), ''), '0')) END AS UNADJ
              FROM acc_bankdtls d
             INNER JOIN acc_bank b ON b.entryno = d.entryno
             INNER JOIN #CITY ct ON ct.CITYCODE = LTRIM(RTRIM(b.citycode))
             WHERE b.status IN ('BR', 'CR')
               -- 'PE' lines are supplier payments that happen to carry a client code;
               -- money going OUT, never credit from a customer
               -- not money on account: AB and AO settle bills or the opening balance (the
               -- Billwise statement folds opening-balance AO into its "OP. BALANCE" line, and
               -- that opening is not part of these figures); PE and JB are payment lines
               -- that happen to carry a client code
               AND ISNULL(d.entrytype, '') NOT IN ('AB', 'PE', 'AO', 'JB')
               AND LTRIM(RTRIM(ISNULL(d.client, ''))) LIKE 'E%'
               AND SUBSTRING(d.entryno, 1, 2) = @CMPCODE
               AND LEN(ISNULL(b.entrydt, '')) = 10
               AND SUBSTRING(b.entrydt,7,4)+SUBSTRING(b.entrydt,4,2)+SUBSTRING(b.entrydt,1,2) <= @TO_YMD

            UNION ALL

            -- opening balance brought forward that stands in the client's favour
            SELECT n.CLIENTCODE, -n.NETAMT
              FROM #OPNET n
             WHERE n.NETAMT < -0.01

            UNION ALL

            -- money applied to a bill beyond its face value is unadjusted too
            SELECT v.CLIENTCODE, s.ALLOC - v.TOTALAMT
              FROM #INV v
             INNER JOIN #SETTLE s ON s.INV_NO = v.INV_NO
             WHERE s.ALLOC - v.TOTALAMT > 0.01
           ) Z
     GROUP BY Z.CLIENTCODE

    CREATE CLUSTERED INDEX IX_UNADJ ON #UNADJ (CLIENTCODE)

    IF @DBG = 1 BEGIN PRINT '  ' + RIGHT('        ' + CONVERT(VARCHAR(10), DATEDIFF(MS, @T0, GETDATE())), 8) + ' ms  up to section 5c'; SET @T0 = GETDATE() END
    ---------------------------------------------------------------------------------
    -- 5c. #AGE - ageing per client, NET of unapplied credit allocated oldest first.
    --     Closed form, verbatim from the Finance Dashboard so the buckets tie out.
    ---------------------------------------------------------------------------------
    CREATE TABLE #AGE
    (
        CLIENTCODE VARCHAR(10),
        N1 FLOAT, N2 FLOAT, N3 FLOAT, N4 FLOAT, N5 FLOAT,
        N6 FLOAT, N7 FLOAT, N8 FLOAT, N9 FLOAT
    )

    INSERT INTO #AGE (CLIENTCODE, N1, N2, N3, N4, N5, N6, N7, N8, N9)
    SELECT G.CLIENTCODE,
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

    IF @DBG = 1 BEGIN PRINT '  ' + RIGHT('        ' + CONVERT(VARCHAR(10), DATEDIFF(MS, @T0, GETDATE())), 8) + ' ms  up to section 6'; SET @T0 = GETDATE() END
    ---------------------------------------------------------------------------------
    -- 6. #CLI - one row per client: net outstanding and overdue, the same expressions
    --    the Finance Dashboard uses for its client table (nothing else is needed here).
    ---------------------------------------------------------------------------------
    CREATE TABLE #CLI (CLIENTCODE VARCHAR(10), CLIENTNAME VARCHAR(200), OUTSTANDING FLOAT, OVERDUE FLOAT)

    INSERT INTO #CLI (CLIENTCODE, CLIENTNAME, OUTSTANDING, OVERDUE)
    SELECT A.CLIENTCODE,
           LTRIM(RTRIM(ISNULL(e.exp_name, A.CLIENTCODE))),
           CASE WHEN A.OUTSTANDING - ISNULL(ua.UNADJUSTED, 0) > 0
                THEN A.OUTSTANDING - ISNULL(ua.UNADJUSTED, 0) ELSE 0 END,
           CASE WHEN A.OVERDUE - ISNULL(ua.UNADJUSTED, 0) > 0
                THEN A.OVERDUE - ISNULL(ua.UNADJUSTED, 0) ELSE 0 END
      FROM (
            SELECT o.CLIENTCODE,
                   SUM(o.PENDING)                                             AS OUTSTANDING,
                   SUM(CASE WHEN o.OVERDUE_DAYS > 0 THEN o.PENDING ELSE 0 END) AS OVERDUE
              FROM #OPEN o
             GROUP BY o.CLIENTCODE
           ) A
      LEFT JOIN exp_master e ON LTRIM(RTRIM(e.exp_code)) = A.CLIENTCODE
      LEFT JOIN #UNADJ ua ON ua.CLIENTCODE = A.CLIENTCODE

    IF @DBG = 1 BEGIN PRINT '  ' + RIGHT('        ' + CONVERT(VARCHAR(10), DATEDIFF(MS, @T0, GETDATE())), 8) + ' ms  up to section 7'; SET @T0 = GETDATE() END
    ---------------------------------------------------------------------------------
    -- 7. #JOBS - jobs opened from the 1st of LAST month to @ASON, by mode. Same three
    --    sources and date keys as the Finance Dashboard; PERIOD = 'M' / 'P'.
    ---------------------------------------------------------------------------------
    -- export jobs whose document date cannot be read carry no period and are dropped
    -- (nothing to compare them against)
    CREATE TABLE #JOBS
    (
        JOBNO      VARCHAR(25),
        MODE_      VARCHAR(10),
        JOB_DT     DATETIME,
        JOB_CLASS  VARCHAR(10),
        PERIOD     CHAR(1),
        IS_BILLED  BIT
    )

    -- exports: EXPT_MASTER, sea + air, excluding cancelled
    INSERT INTO #JOBS (JOBNO, MODE_, JOB_DT, JOB_CLASS, PERIOD, IS_BILLED)
    SELECT LTRIM(RTRIM(e.exptno)),
           CASE WHEN LOWER(LTRIM(RTRIM(ISNULL(e.expt_mode,'')))) = 'air' THEN 'AIR EXPORT' ELSE 'SEA EXPORT' END,
           CASE WHEN ISDATE(SUBSTRING(e.expt_docrecd,7,4)+SUBSTRING(e.expt_docrecd,4,2)+SUBSTRING(e.expt_docrecd,1,2)) = 1 THEN CONVERT(DATETIME, SUBSTRING(e.expt_docrecd,7,4)+SUBSTRING(e.expt_docrecd,4,2)+SUBSTRING(e.expt_docrecd,1,2), 112) END,
           'SHIPMENT', NULL, 0
      FROM EXPT_MASTER e
     INNER JOIN #CITY c ON c.CITYCODE = LTRIM(RTRIM(e.citycode))
     WHERE LTRIM(RTRIM(ISNULL(e.cmpcode, ''))) = @CMPCODE
       AND LEN(ISNULL(e.expt_docrecd, '')) = 10
       AND SUBSTRING(e.expt_docrecd,7,4)+SUBSTRING(e.expt_docrecd,4,2)+SUBSTRING(e.expt_docrecd,1,2)
           BETWEEN @P_FROM_YMD AND @TO_YMD
       AND LTRIM(RTRIM(ISNULL(e.exptcancel, ''))) = ''

    -- imports: TBL_IMP_IMPORT read directly (the view fans sea jobs out via containers)
    INSERT INTO #JOBS (JOBNO, MODE_, JOB_DT, JOB_CLASS, PERIOD, IS_BILLED)
    SELECT LTRIM(RTRIM(i.Import_Code)),
           CASE WHEN UPPER(LTRIM(RTRIM(ISNULL(i.Mode,'')))) = 'AIR' THEN 'AIR IMPORT' ELSE 'SEA IMPORT' END,
           i.Import_Date, 'SHIPMENT', NULL, 0
      FROM TBL_IMP_IMPORT i
     INNER JOIN CITY ct ON LTRIM(RTRIM(ct.citycode1)) = LTRIM(RTRIM(i.citycode1))
     INNER JOIN #CITY c  ON c.CITYCODE = LTRIM(RTRIM(ct.citycode))
     WHERE LTRIM(RTRIM(ISNULL(i.cmp_code, ''))) = @CMPCODE
       AND i.Import_Date >= @P_FROM
       AND i.Import_Date <  DATEADD(DAY, 1, @ASON)
       AND LTRIM(RTRIM(ISNULL(i.Doc_Cancel, 'N'))) <> 'Y'

    -- misc / non-shipment jobs. MAKER_Date is the period key on purpose (DOCRECPTDT is
    -- unpopulated on types 7 and 9); CITYCODE is already the 3-letter form.
    INSERT INTO #JOBS (JOBNO, MODE_, JOB_DT, JOB_CLASS, PERIOD, IS_BILLED)
    SELECT LTRIM(RTRIM(m.JOBNO)), 'MISC', m.MAKER_Date, 'MISC', NULL, 0
      FROM EXPT_MASTER_MISC m
     INNER JOIN #CITY c ON c.CITYCODE = LTRIM(RTRIM(m.CITYCODE))
     WHERE LTRIM(RTRIM(ISNULL(m.CMPCODE, ''))) = @CMPCODE
       AND ISNULL(m.JOBNO, '') <> ''
       AND m.MAKER_Date >= @P_FROM
       AND m.MAKER_Date <  DATEADD(DAY, 1, @ASON)

    DELETE FROM #JOBS WHERE JOB_DT IS NULL

    UPDATE #JOBS
       SET PERIOD = CASE WHEN JOB_DT >= @M_FROM THEN 'M'
                         WHEN JOB_DT <= @P_TO   THEN 'P'
                         ELSE NULL END           -- the gap between last-month-same-day and month end

    CREATE CLUSTERED INDEX IX_JOBS ON #JOBS (JOBNO)

    -- Billed flag: materialise the invoiced-job set ONCE and flag by join (a correlated
    -- EXISTS re-joins acc_invjobno to acc_invoice per job and does not finish).
    CREATE TABLE #JOBINV (JOBNO VARCHAR(25), INV_NO VARCHAR(15))
    INSERT INTO #JOBINV (JOBNO, INV_NO)
    SELECT DISTINCT LTRIM(RTRIM(jn.inv_jobno)), LTRIM(RTRIM(jn.inv_no))
      FROM acc_invjobno jn
     INNER JOIN #JOBS j        ON j.JOBNO = LTRIM(RTRIM(jn.inv_jobno))
     INNER JOIN acc_invoice iv ON LTRIM(RTRIM(iv.inv_no)) = LTRIM(RTRIM(jn.inv_no))
    CREATE CLUSTERED INDEX IX_JOBINV ON #JOBINV (INV_NO)

    UPDATE J SET IS_BILLED = 1
      FROM #JOBS J
     WHERE EXISTS (SELECT 1 FROM #JOBINV x WHERE x.JOBNO = J.JOBNO)

    IF @DBG = 1 BEGIN PRINT '  ' + RIGHT('        ' + CONVERT(VARCHAR(10), DATEDIFF(MS, @T0, GETDATE())), 8) + ' ms  up to section 7b'; SET @T0 = GETDATE() END
    ---------------------------------------------------------------------------------
    -- 7b. #JOBEXP - cost booked against each job, three ledger sources (verbatim).
    ---------------------------------------------------------------------------------
    CREATE TABLE #JOBEXP (JOBNO VARCHAR(25), COST FLOAT)

    INSERT INTO #JOBEXP (JOBNO, COST)
    SELECT X.JOBNO, SUM(X.AMT)
      FROM (
            SELECT LTRIM(RTRIM(pd.pur_jobno)) AS JOBNO,
                   CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(pd.pur_amount)), ''), '0')) AS AMT
              FROM acc_purchasedtls pd
             WHERE ISNULL(pd.pur_jobno, '') <> ''
               AND LTRIM(RTRIM(pd.pur_account)) IN (SELECT ACCTCODE FROM #JOBHEAD)
            UNION ALL
            SELECT LTRIM(RTRIM(d.jobno)),
                   CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(d.amount)), ''), '0'))
              FROM acc_bankdtls d
             INNER JOIN acc_bank b ON b.entryno = d.entryno
             WHERE ISNULL(d.jobno, '') <> ''
               AND d.entrytype = 'JB'
               AND LTRIM(RTRIM(d.client)) IN (SELECT ACCTCODE FROM #JOBHEAD)
               AND b.status IN ('BP', 'CP', 'CE')
            UNION ALL
            SELECT LTRIM(RTRIM(jd.jv_jobno)),
                   CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(jd.jv_debit)), ''), '0'))
              FROM acc_JournalVoucDtls jd
             WHERE ISNULL(jd.jv_jobno, '') <> ''
               AND LTRIM(RTRIM(jd.jv_account)) IN (SELECT ACCTCODE FROM #JOBHEAD)
           ) X
     INNER JOIN #JOBS j ON j.JOBNO = X.JOBNO
     GROUP BY X.JOBNO

    CREATE CLUSTERED INDEX IX_JOBEXP ON #JOBEXP (JOBNO)

    IF @DBG = 1 BEGIN PRINT '  ' + RIGHT('        ' + CONVERT(VARCHAR(10), DATEDIFF(MS, @T0, GETDATE())), 8) + ' ms  up to section 7c'; SET @T0 = GETDATE() END
    ---------------------------------------------------------------------------------
    -- 7c. #JOBINC - ledger income per job, net of GST and inter-branch heads, an invoice
    --     naming several jobs split equally across ALL of them (verbatim).
    ---------------------------------------------------------------------------------
    CREATE TABLE #INVJOBCNT (INV_NO VARCHAR(15), NJOBS INT)
    INSERT INTO #INVJOBCNT (INV_NO, NJOBS)
    SELECT ji.INV_NO, COUNT(DISTINCT LTRIM(RTRIM(jn.inv_jobno)))
      FROM (SELECT DISTINCT INV_NO FROM #JOBINV) ji
     INNER JOIN acc_invjobno jn ON LTRIM(RTRIM(jn.inv_no)) = ji.INV_NO
     WHERE ISNULL(jn.inv_jobno, '') <> ''
     GROUP BY ji.INV_NO
    CREATE CLUSTERED INDEX IX_INVJOBCNT ON #INVJOBCNT (INV_NO)

    CREATE TABLE #JOBINC (JOBNO VARCHAR(25), REVENUE FLOAT)
    INSERT INTO #JOBINC (JOBNO, REVENUE)
    SELECT Z.JOBNO, SUM(Z.REV)
      FROM (
            SELECT ji.JOBNO,
                   SUM(CASE WHEN ISNULL(sc.CATEGORY, 'OTHER') NOT IN ('TAX', 'EXCL')
                            THEN CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(ic.inv_inramt)), ''), '0')) ELSE 0 END)
                       / CONVERT(FLOAT, CASE WHEN ISNULL(n.NJOBS, 0) < 1 THEN 1 ELSE n.NJOBS END) AS REV
              FROM #JOBINV ji
             INNER JOIN #INV v ON v.INV_NO = ji.INV_NO
             INNER JOIN acc_invcharge ic ON ic.inv_no = ji.INV_NO
              LEFT JOIN #INVJOBCNT n ON n.INV_NO = ji.INV_NO
              LEFT JOIN dbo.TBL_MST_FIN_SERVICE_CATEGORY sc ON sc.ACCTCODE = LTRIM(RTRIM(ISNULL(ic.inv_account, '')))
             GROUP BY ji.JOBNO, n.NJOBS
            UNION ALL
            SELECT ji.JOBNO,
                   SUM(CASE WHEN ISNULL(sc.CATEGORY, 'OTHER') NOT IN ('TAX', 'EXCL')
                            THEN CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(ic.inv_inramt)), ''), '0')) ELSE 0 END)
                       / CONVERT(FLOAT, CASE WHEN ISNULL(n.NJOBS, 0) < 1 THEN 1 ELSE n.NJOBS END)
              FROM #JOBINV ji
             INNER JOIN #INV v ON v.INV_NO = ji.INV_NO
             INNER JOIN acc_invcharge1 ic ON ic.inv_no = ji.INV_NO
              LEFT JOIN #INVJOBCNT n ON n.INV_NO = ji.INV_NO
              LEFT JOIN dbo.TBL_MST_FIN_SERVICE_CATEGORY sc ON sc.ACCTCODE = LTRIM(RTRIM(ISNULL(ic.inv_account, '')))
             GROUP BY ji.JOBNO, n.NJOBS
           ) Z
     GROUP BY Z.JOBNO
    CREATE CLUSTERED INDEX IX_JOBINC ON #JOBINC (JOBNO)

    IF @DBG = 1 BEGIN PRINT '  ' + RIGHT('        ' + CONVERT(VARCHAR(10), DATEDIFF(MS, @T0, GETDATE())), 8) + ' ms  up to section 8'; SET @T0 = GETDATE() END
    ---------------------------------------------------------------------------------
    -- 8. #PL - one row per job with revenue and cost. Same inclusion rule as the
    --    Finance Dashboard margin: every shipment, plus any MISC job carrying money.
    ---------------------------------------------------------------------------------
    CREATE TABLE #PL (JOBNO VARCHAR(25), MODE_ VARCHAR(10), PERIOD CHAR(1), IS_BILLED BIT, REVENUE FLOAT, COST FLOAT)

    INSERT INTO #PL (JOBNO, MODE_, PERIOD, IS_BILLED, REVENUE, COST)
    SELECT j.JOBNO, j.MODE_, j.PERIOD, j.IS_BILLED,
           ISNULL(inc.REVENUE, 0), ISNULL(x.COST, 0)
      FROM #JOBS j
      LEFT JOIN #JOBINC inc ON inc.JOBNO = j.JOBNO
      LEFT JOIN #JOBEXP x   ON x.JOBNO   = j.JOBNO
     WHERE j.JOB_CLASS = 'SHIPMENT'
        OR ISNULL(inc.REVENUE, 0) <> 0
        OR ISNULL(x.COST, 0) <> 0

    IF @DBG = 1 BEGIN PRINT '  ' + RIGHT('        ' + CONVERT(VARCHAR(10), DATEDIFF(MS, @T0, GETDATE())), 8) + ' ms  up to section 9'; SET @T0 = GETDATE() END
    ---------------------------------------------------------------------------------
    -- 9. Scalars for the KPI row
    ---------------------------------------------------------------------------------
    DECLARE @INV_COUNT_MTD INT, @INV_VALUE_MTD FLOAT, @INV_COUNT_PM INT, @INV_VALUE_PM FLOAT
    SELECT @INV_COUNT_MTD = SUM(CASE WHEN PERIOD = 'M' THEN 1 ELSE 0 END),
           @INV_VALUE_MTD = SUM(CASE WHEN PERIOD = 'M' THEN TOTALAMT ELSE 0 END),
           @INV_COUNT_PM  = SUM(CASE WHEN PERIOD = 'P' THEN 1 ELSE 0 END),
           @INV_VALUE_PM  = SUM(CASE WHEN PERIOD = 'P' THEN TOTALAMT ELSE 0 END)
      FROM #INV

    -- Collected = applied against bills in the window (bank + JV, not credit notes)
    DECLARE @COLLECTED_MTD FLOAT, @COLLECTED_PM FLOAT
    SELECT @COLLECTED_MTD = SUM(CASE WHEN DT >= @M_FROM AND DT <= @ASON THEN AMT ELSE 0 END),
           @COLLECTED_PM  = SUM(CASE WHEN DT >= @P_FROM AND DT <= @P_TO THEN AMT ELSE 0 END)
      FROM #SETTLEX
     WHERE SRC IN ('BANK', 'JV')

    DECLARE @TOTAL_OUTSTANDING FLOAT, @OVERDUE_AMT FLOAT
    SELECT @TOTAL_OUTSTANDING = SUM(OUTSTANDING), @OVERDUE_AMT = SUM(OVERDUE) FROM #CLI

    -- Unbilled: MTD jobs not yet invoiced, and the cost already booked on them
    DECLARE @UNBILLED_JOBS INT, @UNBILLED_VALUE FLOAT
    SELECT @UNBILLED_JOBS  = COUNT(*),
           @UNBILLED_VALUE = SUM(ISNULL(x.COST, 0))
      FROM #JOBS j
      LEFT JOIN #JOBEXP x ON x.JOBNO = j.JOBNO
     WHERE j.PERIOD = 'M'
       AND j.IS_BILLED = 0
       AND (j.JOB_CLASS = 'SHIPMENT' OR ISNULL(x.COST, 0) > 0.01)

    DECLARE @JOBS_MTD INT, @JOBS_PM INT
    SELECT @JOBS_MTD = SUM(CASE WHEN PERIOD = 'M' THEN 1 ELSE 0 END),
           @JOBS_PM  = SUM(CASE WHEN PERIOD = 'P' THEN 1 ELSE 0 END)
      FROM #JOBS

    DECLARE @REV_MTD FLOAT, @COST_MTD FLOAT, @REV_PM FLOAT, @COST_PM FLOAT
    SELECT @REV_MTD  = SUM(CASE WHEN PERIOD = 'M' THEN REVENUE ELSE 0 END),
           @COST_MTD = SUM(CASE WHEN PERIOD = 'M' THEN COST    ELSE 0 END),
           @REV_PM   = SUM(CASE WHEN PERIOD = 'P' THEN REVENUE ELSE 0 END),
           @COST_PM  = SUM(CASE WHEN PERIOD = 'P' THEN COST    ELSE 0 END)
      FROM #PL


    IF @DBG = 1 BEGIN PRINT '  ' + RIGHT('        ' + CONVERT(VARCHAR(10), DATEDIFF(MS, @T0, GETDATE())), 8) + ' ms  up to section 10'; SET @T0 = GETDATE() END
    ---------------------------------------------------------------------------------
    -- 10. Payables (light). Bills dated from 12 months before the month start; on this
    --     data 95% of payables settle inside 6 months, so older open bills are dead data
    --     rather than money we still owe (see USP_ACC_RPT_PAYABLE_DASHBOARD).
    ---------------------------------------------------------------------------------
    DECLARE @PFLOOR_YMD CHAR(8), @D90_FROM DATETIME, @ALLCITY BIT
    SET @PFLOOR_YMD = CONVERT(CHAR(8), DATEADD(MONTH, -12, @M_FROM), 112)
    SET @D90_FROM   = DATEADD(DAY, -89, @ASON)
    SET @ALLCITY    = CASE WHEN @CITYCODE = '' OR @CITYCODE = 'ALL' THEN 1 ELSE 0 END

    CREATE TABLE #PINV
    (
        PUR_CODE  VARCHAR(25),
        PUR_INVNO VARCHAR(50),
        SUPPLIER  VARCHAR(15),
        PUR_YMD   CHAR(8),
        DUE_YMD   CHAR(8),
        PUR_DT    DATETIME,
        DUE_DT    DATETIME,
        HAS_TERMS BIT,
        BILLAMT   FLOAT
    )

    -- pass 1: strings only, so nothing converts before it is validated (verbatim rule)
    INSERT INTO #PINV (PUR_CODE, PUR_INVNO, SUPPLIER, PUR_YMD, DUE_YMD, HAS_TERMS, BILLAMT)
    SELECT X.PUR_CODE, X.PUR_INVNO, X.SUPPLIER, X.PUR_YMD, X.DUE_YMD, 0, 0
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
             CROSS APPLY (
                    SELECT PUR_YMD = CASE WHEN D0.PUR_YMD LIKE '[12][0-9][0-9][0-9][01][0-9][0-3][0-9]'
                                           AND ISDATE(D0.PUR_YMD) = 1 THEN D0.PUR_YMD END,
                           DUE_YMD = CASE WHEN D0.DUE_YMD LIKE '[12][0-9][0-9][0-9][01][0-9][0-3][0-9]'
                                           AND ISDATE(D0.DUE_YMD) = 1 THEN D0.DUE_YMD END
                   ) D
             WHERE LTRIM(RTRIM(ISNULL(p.cmpcode, ''))) = @CMPCODE
               AND D.PUR_YMD IS NOT NULL
               AND D.PUR_YMD <= @TO_YMD
               AND D.PUR_YMD >= @PFLOOR_YMD
               AND LTRIM(RTRIM(ISNULL(p.pur_supplier, ''))) <> ''
           ) X
      LEFT JOIN #CITY c ON c.CITYCODE = X.CITYCODE
     WHERE (@ALLCITY = 1 OR c.CITYCODE IS NOT NULL)

    -- pur_code is not unique: keep one header per code (latest date) or the bill counts twice
    ;WITH D AS (
        SELECT RN = ROW_NUMBER() OVER (PARTITION BY PUR_CODE ORDER BY PUR_YMD DESC, PUR_INVNO DESC, SUPPLIER)
          FROM #PINV
    )
    DELETE FROM D WHERE RN > 1
    DECLARE @DUP_BILLS INT
    SET @DUP_BILLS = @@ROWCOUNT

    CREATE UNIQUE CLUSTERED INDEX IX_PINV ON #PINV (PUR_CODE)

    -- pass 2: every string is now a real date
    UPDATE #PINV SET PUR_DT = CONVERT(DATETIME, PUR_YMD, 112)

    UPDATE #PINV
       SET DUE_DT    = CASE WHEN V.DUE_OK = 1 THEN CONVERT(DATETIME, #PINV.DUE_YMD, 112)
                            ELSE DATEADD(DAY, 30, #PINV.PUR_DT) END,
           HAS_TERMS = V.DUE_OK
      FROM (SELECT PUR_CODE,
                   DUE_OK = CASE WHEN DUE_YMD IS NOT NULL
                                  AND CONVERT(DATETIME, DUE_YMD, 112) >= PUR_DT
                                  AND DATEDIFF(DAY, PUR_DT, CONVERT(DATETIME, DUE_YMD, 112)) <= 180
                                 THEN 1 ELSE 0 END
              FROM #PINV) V
     WHERE V.PUR_CODE = #PINV.PUR_CODE

    -- bill value: pur_amount + pur_deduction are two value columns (proved on live data)
    UPDATE v
       SET BILLAMT = ISNULL(l.TOTAL, 0)
      FROM #PINV v
     INNER JOIN (
            SELECT v2.PUR_CODE,
                   TOTAL = SUM(CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(pd.pur_amount)),    ''), '0')))
                         + SUM(CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(pd.pur_deduction)), ''), '0')))
              FROM acc_purchasedtls pd
             INNER JOIN #PINV v2 ON v2.PUR_CODE = pd.pur_code
             GROUP BY v2.PUR_CODE
           ) l ON l.PUR_CODE = v.PUR_CODE

    -- keys a payment can quote: the purchase code, or a UNIQUE supplier invoice number
    CREATE TABLE #PKEY (KEYVAL VARCHAR(50), PUR_CODE VARCHAR(25))
    INSERT INTO #PKEY (KEYVAL, PUR_CODE) SELECT PUR_CODE, PUR_CODE FROM #PINV
    INSERT INTO #PKEY (KEYVAL, PUR_CODE)
    SELECT v.PUR_INVNO, MIN(v.PUR_CODE)
      FROM #PINV v
     WHERE v.PUR_INVNO <> '' AND v.PUR_INVNO <> v.PUR_CODE
       AND NOT EXISTS (SELECT 1 FROM #PKEY k WHERE k.KEYVAL = v.PUR_INVNO)
     GROUP BY v.PUR_INVNO
    HAVING COUNT(*) = 1
    CREATE UNIQUE CLUSTERED INDEX IX_PKEY ON #PKEY (KEYVAL)

    -- payments naming a bill we hold (bank/cash BP CP CE, any entry type; JV debit lines)
    CREATE TABLE #PAYLINE (BILLNO VARCHAR(50), AMT FLOAT, DT DATETIME)
    INSERT INTO #PAYLINE (BILLNO, AMT, DT)
    SELECT LTRIM(RTRIM(d.billno)),
           CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(d.amount)),    ''), '0'))
         + CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(d.deduction)), ''), '0')),
           CASE WHEN ISDATE(SUBSTRING(b.entrydt,7,4)+SUBSTRING(b.entrydt,4,2)+SUBSTRING(b.entrydt,1,2)) = 1
                THEN CONVERT(DATETIME, SUBSTRING(b.entrydt,7,4)+SUBSTRING(b.entrydt,4,2)+SUBSTRING(b.entrydt,1,2), 112) END
      FROM acc_bankdtls d
     INNER JOIN acc_bank b ON b.entryno = d.entryno
     WHERE b.status IN ('BP', 'CP', 'CE')
       AND ISNULL(d.billno, '') <> ''
       AND EXISTS (SELECT 1 FROM #PKEY k WHERE k.KEYVAL = d.billno)
       AND LEN(ISNULL(b.entrydt, '')) = 10
       AND SUBSTRING(b.entrydt,7,4)+SUBSTRING(b.entrydt,4,2)+SUBSTRING(b.entrydt,1,2) <= @TO_YMD
       AND SUBSTRING(b.entrydt,7,4)+SUBSTRING(b.entrydt,4,2)+SUBSTRING(b.entrydt,1,2) >= @PFLOOR_YMD
    UNION ALL
    SELECT LTRIM(RTRIM(jd.jv_InvoiceNo)),
           CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(jd.jv_debit)), ''), '0')),
           CASE WHEN ISDATE(SUBSTRING(jh.jv_date,7,4)+SUBSTRING(jh.jv_date,4,2)+SUBSTRING(jh.jv_date,1,2)) = 1
                THEN CONVERT(DATETIME, SUBSTRING(jh.jv_date,7,4)+SUBSTRING(jh.jv_date,4,2)+SUBSTRING(jh.jv_date,1,2), 112) END
      FROM acc_JournalVoucDtls jd
     INNER JOIN acc_JournalVouc jh ON jh.jvcode = jd.jvcode
     WHERE ISNULL(jd.jv_InvoiceNo, '') <> ''
       AND EXISTS (SELECT 1 FROM #PKEY k WHERE k.KEYVAL = jd.jv_InvoiceNo)
       AND LEN(ISNULL(jh.jv_date, '')) = 10
       AND SUBSTRING(jh.jv_date,7,4)+SUBSTRING(jh.jv_date,4,2)+SUBSTRING(jh.jv_date,1,2) <= @TO_YMD
       AND SUBSTRING(jh.jv_date,7,4)+SUBSTRING(jh.jv_date,4,2)+SUBSTRING(jh.jv_date,1,2) >= @PFLOOR_YMD
    CREATE CLUSTERED INDEX IX_PAYLINE ON #PAYLINE (BILLNO)

    CREATE TABLE #PSETTLE (PUR_CODE VARCHAR(25), ALLOC FLOAT, LASTDT DATETIME)
    INSERT INTO #PSETTLE (PUR_CODE, ALLOC, LASTDT)
    SELECT k.PUR_CODE, SUM(z.AMT), MAX(z.DT)
      FROM #PAYLINE z
     INNER JOIN #PKEY k ON k.KEYVAL = z.BILLNO
     GROUP BY k.PUR_CODE
    CREATE UNIQUE CLUSTERED INDEX IX_PSETTLE ON #PSETTLE (PUR_CODE)

    -- the payable: unpaid remainder per bill, with days to / past due
    CREATE TABLE #POPEN (PUR_CODE VARCHAR(25), SUPPLIER VARCHAR(15), PENDING FLOAT, OVERDUE_DAYS INT, HAS_TERMS BIT)
    INSERT INTO #POPEN (PUR_CODE, SUPPLIER, PENDING, OVERDUE_DAYS, HAS_TERMS)
    SELECT v.PUR_CODE, v.SUPPLIER,
           v.BILLAMT - ISNULL(s.ALLOC, 0),
           DATEDIFF(DAY, v.DUE_DT, @ASON),
           v.HAS_TERMS
      FROM #PINV v
      LEFT JOIN #PSETTLE s ON s.PUR_CODE = v.PUR_CODE
     WHERE v.BILLAMT - ISNULL(s.ALLOC, 0) > 0.01
    CREATE CLUSTERED INDEX IX_POPEN ON #POPEN (SUPPLIER)

    -- money paid to a supplier that names no bill (advance / on account), plus over-payments.
    -- The two legs are loaded SEPARATELY and then grouped: as one UNION ALL under a GROUP BY
    -- the optimizer chose a plan that took 191 s on LinksDB20 (the same bank read alone: 73 ms).
    CREATE TABLE #PADVX (SUPPLIER VARCHAR(15), AMT FLOAT)
    INSERT INTO #PADVX (SUPPLIER, AMT)
    SELECT LTRIM(RTRIM(d.client)),
           CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(d.amount)),    ''), '0'))
         + CONVERT(FLOAT, ISNULL(NULLIF(LTRIM(RTRIM(d.deduction)), ''), '0'))
      FROM acc_bankdtls d
     INNER JOIN acc_bank b ON b.entryno = d.entryno
     INNER JOIN #CITY ct ON ct.CITYCODE = LTRIM(RTRIM(b.citycode))
     WHERE b.status IN ('BP', 'CP', 'CE')
       AND ISNULL(d.billno, '') = ''
       AND ISNULL(d.entrytype, '') <> 'JB'
       AND LTRIM(RTRIM(ISNULL(d.client, ''))) LIKE 'S%'
       AND SUBSTRING(d.entryno, 1, 2) = @CMPCODE
       AND LEN(ISNULL(b.entrydt, '')) = 10
       AND SUBSTRING(b.entrydt,7,4)+SUBSTRING(b.entrydt,4,2)+SUBSTRING(b.entrydt,1,2) <= @TO_YMD
       AND SUBSTRING(b.entrydt,7,4)+SUBSTRING(b.entrydt,4,2)+SUBSTRING(b.entrydt,1,2) >= @PFLOOR_YMD

    INSERT INTO #PADVX (SUPPLIER, AMT)
    SELECT v.SUPPLIER, s.ALLOC - v.BILLAMT
      FROM #PINV v
     INNER JOIN #PSETTLE s ON s.PUR_CODE = v.PUR_CODE
     WHERE s.ALLOC - v.BILLAMT > 0.01

    CREATE TABLE #PADV (SUPPLIER VARCHAR(15), UNADJUSTED FLOAT)
    INSERT INTO #PADV (SUPPLIER, UNADJUSTED)
    SELECT SUPPLIER, SUM(AMT) FROM #PADVX GROUP BY SUPPLIER
    CREATE UNIQUE CLUSTERED INDEX IX_PADV ON #PADV (SUPPLIER)

    -- per supplier, net of advances and floored at zero (mirror of #CLI)
    CREATE TABLE #SUPP (SUPPLIER VARCHAR(15), PAYABLE FLOAT, OVERDUE FLOAT)
    INSERT INTO #SUPP (SUPPLIER, PAYABLE, OVERDUE)
    SELECT A.SUPPLIER,
           CASE WHEN A.PENDING - ISNULL(ad.UNADJUSTED, 0) > 0 THEN A.PENDING - ISNULL(ad.UNADJUSTED, 0) ELSE 0 END,
           CASE WHEN A.OVERDUE - ISNULL(ad.UNADJUSTED, 0) > 0 THEN A.OVERDUE - ISNULL(ad.UNADJUSTED, 0) ELSE 0 END
      FROM (
            SELECT SUPPLIER,
                   SUM(PENDING)                                             AS PENDING,
                   SUM(CASE WHEN OVERDUE_DAYS > 0 THEN PENDING ELSE 0 END) AS OVERDUE
              FROM #POPEN
             GROUP BY SUPPLIER
           ) A
      LEFT JOIN #PADV ad ON ad.SUPPLIER = A.SUPPLIER

    DECLARE @TOTAL_PAYABLE FLOAT, @PAY_OVERDUE FLOAT, @PAY_DUE_7 FLOAT, @PAY_DUE_30 FLOAT,
            @PAY_ADV FLOAT, @PAY_BILLS_OPEN INT, @PAY_TERMS_PCT FLOAT
    SELECT @TOTAL_PAYABLE = SUM(PAYABLE), @PAY_OVERDUE = SUM(OVERDUE) FROM #SUPP
    SELECT @PAY_BILLS_OPEN = COUNT(*),
           @PAY_TERMS_PCT  = CASE WHEN SUM(PENDING) > 0
                                  THEN 100.0 * SUM(CASE WHEN HAS_TERMS = 1 THEN PENDING ELSE 0 END) / SUM(PENDING) ELSE 0 END
      FROM #POPEN
    SELECT @PAY_ADV = SUM(UNADJUSTED) FROM #PADV WHERE UNADJUSTED > 0

    -- due windows on both sides, NET of unapplied credit / advances allocated oldest first
    -- (#FLOW is also what Table6 prints, so the card and the forecast always agree)
    CREATE TABLE #FLOW (SIDE CHAR(1), N1 FLOAT, N2 FLOAT, N3 FLOAT, N4 FLOAT, N5 FLOAT)

    INSERT INTO #FLOW (SIDE, N1, N2, N3, N4, N5)
    SELECT 'I',
           CASE WHEN B1 < C1 - CR THEN B1 ELSE CASE WHEN C1 - CR > 0 THEN C1 - CR ELSE 0 END END,
           CASE WHEN B2 < C2 - CR THEN B2 ELSE CASE WHEN C2 - CR > 0 THEN C2 - CR ELSE 0 END END,
           CASE WHEN B3 < C3 - CR THEN B3 ELSE CASE WHEN C3 - CR > 0 THEN C3 - CR ELSE 0 END END,
           CASE WHEN B4 < C4 - CR THEN B4 ELSE CASE WHEN C4 - CR > 0 THEN C4 - CR ELSE 0 END END,
           CASE WHEN B5 < C5 - CR THEN B5 ELSE CASE WHEN C5 - CR > 0 THEN C5 - CR ELSE 0 END END
      FROM (
            SELECT G.*, G.B1 AS C1, G.B1+G.B2 AS C2, G.B1+G.B2+G.B3 AS C3,
                   G.B1+G.B2+G.B3+G.B4 AS C4, G.B1+G.B2+G.B3+G.B4+G.B5 AS C5,
                   ISNULL(ua.UNADJUSTED, 0) AS CR
              FROM (
                    SELECT o.CLIENTCODE,
                           SUM(CASE WHEN o.OVERDUE_DAYS > 0                   THEN o.PENDING ELSE 0 END) AS B1,
                           SUM(CASE WHEN o.OVERDUE_DAYS BETWEEN -7  AND 0     THEN o.PENDING ELSE 0 END) AS B2,
                           SUM(CASE WHEN o.OVERDUE_DAYS BETWEEN -15 AND -8    THEN o.PENDING ELSE 0 END) AS B3,
                           SUM(CASE WHEN o.OVERDUE_DAYS BETWEEN -30 AND -16   THEN o.PENDING ELSE 0 END) AS B4,
                           SUM(CASE WHEN o.OVERDUE_DAYS < -30                 THEN o.PENDING ELSE 0 END) AS B5
                      FROM #OPEN o
                     GROUP BY o.CLIENTCODE
                   ) G
              LEFT JOIN #UNADJ ua ON ua.CLIENTCODE = G.CLIENTCODE
           ) X

    INSERT INTO #FLOW (SIDE, N1, N2, N3, N4, N5)
    SELECT 'O',
           CASE WHEN B1 < C1 - CR THEN B1 ELSE CASE WHEN C1 - CR > 0 THEN C1 - CR ELSE 0 END END,
           CASE WHEN B2 < C2 - CR THEN B2 ELSE CASE WHEN C2 - CR > 0 THEN C2 - CR ELSE 0 END END,
           CASE WHEN B3 < C3 - CR THEN B3 ELSE CASE WHEN C3 - CR > 0 THEN C3 - CR ELSE 0 END END,
           CASE WHEN B4 < C4 - CR THEN B4 ELSE CASE WHEN C4 - CR > 0 THEN C4 - CR ELSE 0 END END,
           CASE WHEN B5 < C5 - CR THEN B5 ELSE CASE WHEN C5 - CR > 0 THEN C5 - CR ELSE 0 END END
      FROM (
            SELECT G.*, G.B1 AS C1, G.B1+G.B2 AS C2, G.B1+G.B2+G.B3 AS C3,
                   G.B1+G.B2+G.B3+G.B4 AS C4, G.B1+G.B2+G.B3+G.B4+G.B5 AS C5,
                   ISNULL(ad.UNADJUSTED, 0) AS CR
              FROM (
                    SELECT o.SUPPLIER,
                           SUM(CASE WHEN o.OVERDUE_DAYS > 0                   THEN o.PENDING ELSE 0 END) AS B1,
                           SUM(CASE WHEN o.OVERDUE_DAYS BETWEEN -7  AND 0     THEN o.PENDING ELSE 0 END) AS B2,
                           SUM(CASE WHEN o.OVERDUE_DAYS BETWEEN -15 AND -8    THEN o.PENDING ELSE 0 END) AS B3,
                           SUM(CASE WHEN o.OVERDUE_DAYS BETWEEN -30 AND -16   THEN o.PENDING ELSE 0 END) AS B4,
                           SUM(CASE WHEN o.OVERDUE_DAYS < -30                 THEN o.PENDING ELSE 0 END) AS B5
                      FROM #POPEN o
                     GROUP BY o.SUPPLIER
                   ) G
              LEFT JOIN #PADV ad ON ad.SUPPLIER = G.SUPPLIER
           ) X

    DECLARE @RECV_DUE_7 FLOAT, @RECV_DUE_30 FLOAT
    SELECT @RECV_DUE_7 = SUM(N2), @RECV_DUE_30 = SUM(N2 + N3 + N4) FROM #FLOW WHERE SIDE = 'I'
    SELECT @PAY_DUE_7  = SUM(N2), @PAY_DUE_30  = SUM(N2 + N3 + N4) FROM #FLOW WHERE SIDE = 'O'

    IF @DBG = 1 BEGIN PRINT '  ' + RIGHT('        ' + CONVERT(VARCHAR(10), DATEDIFF(MS, @T0, GETDATE())), 8) + ' ms  up to section 10b'; SET @T0 = GETDATE() END
    ---------------------------------------------------------------------------------
    -- 10b. DSO and DPO, last 90 days, value weighted: how long a bill raised in that
    --      window took to be settled. Prepaid (negative) days are excluded so they cannot
    --      mask real delay; a client who pays on the day counts as 0.
    ---------------------------------------------------------------------------------
    CREATE TABLE #DSOX (INV_NO VARCHAR(15), CLIENTCODE VARCHAR(10), DAYS INT, ALLOC FLOAT)
    INSERT INTO #DSOX (INV_NO, CLIENTCODE, DAYS, ALLOC)
    SELECT v.INV_NO, v.CLIENTCODE, DATEDIFF(DAY, v.INV_DT, s.LASTDT), s.ALLOC
      FROM #INV v
     INNER JOIN (SELECT INV_NO, SUM(AMT) AS ALLOC, MAX(DT) AS LASTDT FROM #SETTLEX GROUP BY INV_NO) s ON s.INV_NO = v.INV_NO
     WHERE v.INV_DT >= @D90_FROM AND s.LASTDT IS NOT NULL AND s.ALLOC > 0.01

    DECLARE @DSO_DAYS FLOAT, @DPO_DAYS FLOAT, @AVG_CREDIT_PERIOD FLOAT, @DSO_BILLS INT, @DPO_BILLS INT
    SELECT @DSO_DAYS  = CASE WHEN SUM(ALLOC) > 0 THEN SUM(DAYS * ALLOC) / SUM(ALLOC) END,
           @DSO_BILLS = COUNT(*)
      FROM #DSOX WHERE DAYS >= 0
    SELECT @DPO_DAYS  = CASE WHEN SUM(s.ALLOC) > 0 THEN SUM(DATEDIFF(DAY, v.PUR_DT, s.LASTDT) * s.ALLOC) / SUM(s.ALLOC) END,
           @DPO_BILLS = COUNT(*)
      FROM #PINV v
     INNER JOIN #PSETTLE s ON s.PUR_CODE = v.PUR_CODE
     WHERE v.PUR_DT >= @D90_FROM AND s.LASTDT IS NOT NULL AND s.ALLOC > 0.01
       AND DATEDIFF(DAY, v.PUR_DT, s.LASTDT) >= 0
    SELECT @AVG_CREDIT_PERIOD = AVG(CONVERT(FLOAT, CREDIT_PERIOD))
      FROM #INV WHERE INV_DT >= @D90_FROM AND HAS_TERMS = 1
    IF @AVG_CREDIT_PERIOD IS NULL
        SELECT @AVG_CREDIT_PERIOD = AVG(CONVERT(FLOAT, CREDIT_PERIOD)) FROM #INV WHERE INV_DT >= @D90_FROM

    IF @DBG = 1 BEGIN PRINT '  ' + RIGHT('        ' + CONVERT(VARCHAR(10), DATEDIFF(MS, @T0, GETDATE())), 8) + ' ms  up to section 11'; SET @T0 = GETDATE() END
    ---------------------------------------------------------------------------------
    -- 11. Pipeline: revenue that is earned but not yet on its way to the bank.
    ---------------------------------------------------------------------------------
    -- invoices waiting on the Authorisation screen: the SAME filter that screen applies
    -- (AuthorisedToPrint blank, non-zero amount, dated within the last 740 days), restricted
    -- to this branch scope, so the count here is what the user sees when they click through
    DECLARE @AUTH_PEND_COUNT INT, @AUTH_PEND_VALUE FLOAT, @AUTH_PEND_OLDEST INT
    SELECT @AUTH_PEND_COUNT  = COUNT(*),
           @AUTH_PEND_VALUE  = SUM(TOTALAMT),
           @AUTH_PEND_OLDEST = MAX(DATEDIFF(DAY, INV_DT, @ASON))
      FROM #INV
     WHERE AUTH = 'P'
       AND ABS(TOTALAMT) > 0.005
       AND INV_DT >= DATEADD(DAY, -740, @ASON)

    -- proformas: raised this month, and those of the last 90 days not yet converted
    DECLARE @PRF_MTD_COUNT INT, @PRF_MTD_VALUE FLOAT, @PRF_CONV_MTD INT,
            @PRF_OPEN_COUNT INT, @PRF_OPEN_VALUE FLOAT, @PRF_OPEN_OLDEST INT
    SELECT @PRF_MTD_COUNT  = SUM(CASE WHEN Q.DT >= @M_FROM THEN 1 ELSE 0 END),
           @PRF_MTD_VALUE  = SUM(CASE WHEN Q.DT >= @M_FROM THEN Q.AMT ELSE 0 END),
           @PRF_CONV_MTD   = SUM(CASE WHEN Q.DT >= @M_FROM AND Q.CONVERTED = 1 THEN 1 ELSE 0 END),
           @PRF_OPEN_COUNT = SUM(CASE WHEN Q.CONVERTED = 0 THEN 1 ELSE 0 END),
           @PRF_OPEN_VALUE = SUM(CASE WHEN Q.CONVERTED = 0 THEN Q.AMT ELSE 0 END),
           @PRF_OPEN_OLDEST= MAX(CASE WHEN Q.CONVERTED = 0 THEN DATEDIFF(DAY, Q.DT, @ASON) END)
      FROM (
            SELECT CASE WHEN ISDATE(SUBSTRING(p.inv_date,7,4)+SUBSTRING(p.inv_date,4,2)+SUBSTRING(p.inv_date,1,2)) = 1
                        THEN CONVERT(DATETIME, SUBSTRING(p.inv_date,7,4)+SUBSTRING(p.inv_date,4,2)+SUBSTRING(p.inv_date,1,2), 112) END AS DT,
                   CONVERT(FLOAT, ISNULL(p.totalamt, 0)) AS AMT,
                   CASE WHEN LTRIM(RTRIM(ISNULL(p.CONVERTED_INV_NO, ''))) <> '' THEN 1 ELSE 0 END AS CONVERTED
              FROM ACC_PROFORMA_INV p
             INNER JOIN #CITY c ON c.CITYCODE = LTRIM(RTRIM(p.citycode))
             WHERE LTRIM(RTRIM(ISNULL(p.cmpcode, ''))) = @CMPCODE
               AND LEN(ISNULL(p.inv_date, '')) = 10
               AND SUBSTRING(p.inv_date,7,4)+SUBSTRING(p.inv_date,4,2)+SUBSTRING(p.inv_date,1,2) BETWEEN CONVERT(CHAR(8), @D90_FROM, 112) AND @TO_YMD
           ) Q
     WHERE Q.DT IS NOT NULL

    -- shipments opened since the 1st of last month, still unbilled after 15 days
    DECLARE @UNB15_JOBS INT, @UNB15_COST FLOAT, @UNB15_OLDEST INT
    SELECT @UNB15_JOBS   = COUNT(*),
           @UNB15_COST   = SUM(ISNULL(x.COST, 0)),
           @UNB15_OLDEST = MAX(DATEDIFF(DAY, j.JOB_DT, @ASON))
      FROM #JOBS j
      LEFT JOIN #JOBEXP x ON x.JOBNO = j.JOBNO
     WHERE j.IS_BILLED = 0
       AND j.JOB_CLASS = 'SHIPMENT'
       AND j.JOB_DT <= DATEADD(DAY, -15, @ASON)

    -- client money received but never applied to a bill
    DECLARE @UNAPPLIED FLOAT, @UNAPPLIED_CLIENTS INT
    SELECT @UNAPPLIED = SUM(UNADJUSTED), @UNAPPLIED_CLIENTS = COUNT(*) FROM #UNADJ WHERE UNADJUSTED > 0.01

    IF @DBG = 1 BEGIN PRINT '  ' + RIGHT('        ' + CONVERT(VARCHAR(10), DATEDIFF(MS, @T0, GETDATE())), 8) + ' ms  up to the result sets'; SET @T0 = GETDATE() END
    ---------------------------------------------------------------------------------
    -- Table : KPI row
    ---------------------------------------------------------------------------------
    SELECT '100'                                              AS STATUS,
           CONVERT(VARCHAR(10), @ASON,   103)                 AS ASOF,
           CONVERT(VARCHAR(10), @M_FROM, 103)                 AS MTD_FROM,
           CONVERT(VARCHAR(10), @ASON,   103)                 AS MTD_TO,
           CONVERT(VARCHAR(10), @P_FROM, 103)                 AS PM_FROM,
           CONVERT(VARCHAR(10), @P_TO,   103)                 AS PM_TO,
           @BRANCH_LABEL                                      AS BRANCH_LABEL,

           ISNULL(@INV_COUNT_MTD, 0)                          AS INV_COUNT_MTD,
           CONVERT(DECIMAL(18,2), ISNULL(@INV_VALUE_MTD, 0))  AS INV_VALUE_MTD,
           ISNULL(@INV_COUNT_PM, 0)                           AS INV_COUNT_PM,
           CONVERT(DECIMAL(18,2), ISNULL(@INV_VALUE_PM, 0))   AS INV_VALUE_PM,

           CONVERT(DECIMAL(18,2), ISNULL(@COLLECTED_MTD, 0))  AS COLLECTED_MTD,
           CONVERT(DECIMAL(18,2), ISNULL(@COLLECTED_PM, 0))   AS COLLECTED_PM,

           CONVERT(DECIMAL(18,2), ISNULL(@TOTAL_OUTSTANDING, 0)) AS TOTAL_OUTSTANDING,
           CONVERT(DECIMAL(18,2), ISNULL(@OVERDUE_AMT, 0))    AS OVERDUE_AMT,
           CONVERT(DECIMAL(5,1),
               CASE WHEN ISNULL(@TOTAL_OUTSTANDING, 0) > 0
                    THEN 100.0 * ISNULL(@OVERDUE_AMT, 0) / @TOTAL_OUTSTANDING ELSE 0 END) AS OVERDUE_PCT,

           ISNULL(@UNBILLED_JOBS, 0)                          AS UNBILLED_JOBS,
           CONVERT(DECIMAL(18,2), ISNULL(@UNBILLED_VALUE, 0)) AS UNBILLED_VALUE,

           ISNULL(@JOBS_MTD, 0)                               AS JOBS_MTD,
           ISNULL(@JOBS_PM, 0)                                AS JOBS_PM,

           CONVERT(DECIMAL(18,2), ISNULL(@REV_MTD, 0))        AS REVENUE_MTD,
           CONVERT(DECIMAL(18,2), ISNULL(@COST_MTD, 0))       AS COST_MTD,
           CONVERT(DECIMAL(18,2), ISNULL(@REV_MTD, 0) - ISNULL(@COST_MTD, 0)) AS GOP_MTD,
           CONVERT(DECIMAL(5,1),
               CASE WHEN ISNULL(@REV_MTD, 0) <> 0
                    THEN 100.0 * (ISNULL(@REV_MTD, 0) - ISNULL(@COST_MTD, 0)) / @REV_MTD ELSE 0 END) AS MARGIN_PCT_MTD,
           CONVERT(DECIMAL(18,2), ISNULL(@REV_PM, 0))         AS REVENUE_PM,
           CONVERT(DECIMAL(18,2), ISNULL(@COST_PM, 0))        AS COST_PM,
           CONVERT(DECIMAL(18,2), ISNULL(@REV_PM, 0) - ISNULL(@COST_PM, 0))   AS GOP_PM,
           CONVERT(DECIMAL(5,1),
               CASE WHEN ISNULL(@REV_PM, 0) <> 0
                    THEN 100.0 * (ISNULL(@REV_PM, 0) - ISNULL(@COST_PM, 0)) / @REV_PM ELSE 0 END)   AS MARGIN_PCT_PM,

           ISNULL(@BAD_DATES, 0)                              AS SKIPPED_BAD_DATES,
           CONVERT(VARCHAR(19), GETDATE(), 120)               AS GENERATED_AT

    ---------------------------------------------------------------------------------
    -- Table1 : jobs by mode. A fixed five-row spine so a mode with no jobs still comes
    --          back as zeros rather than vanishing from the card.
    ---------------------------------------------------------------------------------
    SELECT S.MODE_,
           S.SORT_NO,
           ISNULL(P.JOBS_MTD, 0)                                   AS JOBS_MTD,
           ISNULL(P.BILLED_MTD, 0)                                 AS BILLED_MTD,
           ISNULL(P.JOBS_MTD, 0) - ISNULL(P.BILLED_MTD, 0)         AS UNBILLED_MTD,
           ISNULL(P.JOBS_PM, 0)                                    AS JOBS_PM,
           CONVERT(DECIMAL(18,2), ISNULL(P.REV_MTD, 0))            AS REVENUE_MTD,
           CONVERT(DECIMAL(18,2), ISNULL(P.COST_MTD, 0))           AS COST_MTD,
           CONVERT(DECIMAL(18,2), ISNULL(P.REV_MTD, 0) - ISNULL(P.COST_MTD, 0)) AS GOP_MTD,
           CONVERT(DECIMAL(5,1),
               CASE WHEN ISNULL(P.REV_MTD, 0) <> 0
                    THEN 100.0 * (ISNULL(P.REV_MTD, 0) - ISNULL(P.COST_MTD, 0)) / P.REV_MTD ELSE 0 END) AS MARGIN_PCT_MTD
      FROM (
            SELECT 'AIR EXPORT' AS MODE_, 1 AS SORT_NO UNION ALL
            SELECT 'SEA EXPORT', 2 UNION ALL
            SELECT 'AIR IMPORT', 3 UNION ALL
            SELECT 'SEA IMPORT', 4 UNION ALL
            SELECT 'MISC',       5
           ) S
      LEFT JOIN (
            SELECT MODE_,
                   SUM(CASE WHEN PERIOD = 'M' THEN 1 ELSE 0 END)                     AS JOBS_MTD,
                   SUM(CASE WHEN PERIOD = 'M' AND IS_BILLED = 1 THEN 1 ELSE 0 END)   AS BILLED_MTD,
                   SUM(CASE WHEN PERIOD = 'P' THEN 1 ELSE 0 END)                     AS JOBS_PM,
                   SUM(CASE WHEN PERIOD = 'M' THEN REVENUE ELSE 0 END)               AS REV_MTD,
                   SUM(CASE WHEN PERIOD = 'M' THEN COST    ELSE 0 END)               AS COST_MTD
              FROM #PL
             GROUP BY MODE_
           ) P ON P.MODE_ = S.MODE_
     ORDER BY S.SORT_NO

    ---------------------------------------------------------------------------------
    -- Table2 : receivable ageing, four buckets, net of unapplied credit. Sums to
    --          TOTAL_OUTSTANDING (both are built from the same #OPEN / #UNADJ).
    ---------------------------------------------------------------------------------
    SELECT B.BUCKET_NO, B.BUCKET,
           CONVERT(DECIMAL(18,2), B.AMOUNT) AS AMOUNT,
           CONVERT(DECIMAL(5,1),
               CASE WHEN ISNULL(@TOTAL_OUTSTANDING, 0) > 0
                    THEN 100.0 * B.AMOUNT / @TOTAL_OUTSTANDING ELSE 0 END) AS PCT_OF_TOTAL
      FROM (
            SELECT 1 AS BUCKET_NO, '0-30 days'    AS BUCKET, ISNULL(SUM(N1), 0)                               AS AMOUNT FROM #AGE UNION ALL
            SELECT 2,              '31-90 days',            ISNULL(SUM(N2 + N3), 0)                                    FROM #AGE UNION ALL
            SELECT 3,              '91-180 days',           ISNULL(SUM(N4 + N5), 0)                                    FROM #AGE UNION ALL
            SELECT 4,              'Over 180 days',         ISNULL(SUM(N6 + N7 + N8 + N9), 0)                          FROM #AGE
           ) B
     ORDER BY B.BUCKET_NO

    ---------------------------------------------------------------------------------
    -- Table3 : top five clients by net outstanding
    ---------------------------------------------------------------------------------
    SELECT TOP 5
           CLIENTCODE, CLIENTNAME,
           CONVERT(DECIMAL(18,2), OUTSTANDING) AS OUTSTANDING,
           CONVERT(DECIMAL(18,2), OVERDUE)     AS OVERDUE,
           CONVERT(DECIMAL(5,1),
               CASE WHEN ISNULL(@TOTAL_OUTSTANDING, 0) > 0
                    THEN 100.0 * OUTSTANDING / @TOTAL_OUTSTANDING ELSE 0 END) AS PCT_OF_TOTAL
      FROM #CLI
     WHERE OUTSTANDING > 0.01
     ORDER BY OUTSTANDING DESC

    ---------------------------------------------------------------------------------
    -- Table4 : invoiced value per day, last 30 days, zero-filled. A WHILE loop builds the
    --          30-row spine so nothing depends on master..spt_values.
    ---------------------------------------------------------------------------------
    CREATE TABLE #DAYS (DAY_NO INT, D DATETIME)
    DECLARE @i INT
    SET @i = 0
    WHILE @i < 30
    BEGIN
        INSERT INTO #DAYS (DAY_NO, D) VALUES (@i + 1, DATEADD(DAY, @i, @D30_FROM))
        SET @i = @i + 1
    END

    SELECT d.DAY_NO,
           CONVERT(VARCHAR(10), d.D, 103)                    AS INV_DT,
           LEFT(DATENAME(WEEKDAY, d.D), 3)                   AS DOW,
           ISNULL(v.INV_COUNT, 0)                            AS INV_COUNT,
           CONVERT(DECIMAL(18,2), ISNULL(v.INV_VALUE, 0))    AS INV_VALUE
      FROM #DAYS d
      LEFT JOIN (
            SELECT INV_DT, COUNT(*) AS INV_COUNT, SUM(TOTALAMT) AS INV_VALUE
              FROM #INV
             WHERE INV_DT >= @D30_FROM AND INV_DT <= @ASON
             GROUP BY INV_DT
           ) v ON v.INV_DT = d.D
     ORDER BY d.DAY_NO


    ---------------------------------------------------------------------------------
    -- Table5 : cash position and pipeline (one row)
    ---------------------------------------------------------------------------------
    SELECT CONVERT(DECIMAL(18,2), ISNULL(@TOTAL_OUTSTANDING, 0))                        AS RECEIVABLE,
           CONVERT(DECIMAL(18,2), ISNULL(@TOTAL_PAYABLE, 0))                            AS PAYABLE,
           CONVERT(DECIMAL(18,2), ISNULL(@TOTAL_OUTSTANDING, 0) - ISNULL(@TOTAL_PAYABLE, 0)) AS NET_POSITION,
           CONVERT(DECIMAL(18,2), ISNULL(@OVERDUE_AMT, 0))                              AS RECV_OVERDUE,
           CONVERT(DECIMAL(18,2), ISNULL(@RECV_DUE_7, 0))                               AS RECV_DUE_7,
           CONVERT(DECIMAL(18,2), ISNULL(@RECV_DUE_30, 0))                              AS RECV_DUE_30,
           CONVERT(DECIMAL(18,2), ISNULL(@PAY_OVERDUE, 0))                              AS PAY_OVERDUE,
           CONVERT(DECIMAL(18,2), ISNULL(@PAY_DUE_7, 0))                                AS PAY_DUE_7,
           CONVERT(DECIMAL(18,2), ISNULL(@PAY_DUE_30, 0))                               AS PAY_DUE_30,
           ISNULL(@PAY_BILLS_OPEN, 0)                                                   AS PAY_BILLS_OPEN,
           CONVERT(DECIMAL(5,1),  ISNULL(@PAY_TERMS_PCT, 0))                            AS PAY_TERMS_PCT,
           ISNULL(@DUP_BILLS, 0)                                                        AS DUPLICATE_BILL_CODES,
           CONVERT(DECIMAL(18,2), ISNULL(@PAY_ADV, 0))                                  AS SUPPLIER_ADVANCES,
           CONVERT(DECIMAL(18,2), ISNULL(@UNAPPLIED, 0))                                AS UNAPPLIED_RECEIPTS,
           ISNULL(@UNAPPLIED_CLIENTS, 0)                                                AS UNAPPLIED_CLIENTS,
           CONVERT(DECIMAL(5,1),  @DSO_DAYS)                                            AS DSO_DAYS,
           ISNULL(@DSO_BILLS, 0)                                                        AS DSO_BILLS,
           CONVERT(DECIMAL(5,1),  @DPO_DAYS)                                            AS DPO_DAYS,
           ISNULL(@DPO_BILLS, 0)                                                        AS DPO_BILLS,
           CONVERT(DECIMAL(5,1),  @AVG_CREDIT_PERIOD)                                   AS AVG_CREDIT_PERIOD,
           ISNULL(@AUTH_PEND_COUNT, 0)                                                  AS AUTH_PENDING_COUNT,
           CONVERT(DECIMAL(18,2), ISNULL(@AUTH_PEND_VALUE, 0))                          AS AUTH_PENDING_VALUE,
           ISNULL(@AUTH_PEND_OLDEST, 0)                                                 AS AUTH_PENDING_OLDEST_DAYS,
           ISNULL(@PRF_MTD_COUNT, 0)                                                    AS PROFORMA_MTD_COUNT,
           CONVERT(DECIMAL(18,2), ISNULL(@PRF_MTD_VALUE, 0))                            AS PROFORMA_MTD_VALUE,
           ISNULL(@PRF_CONV_MTD, 0)                                                     AS PROFORMA_MTD_CONVERTED,
           ISNULL(@PRF_OPEN_COUNT, 0)                                                   AS PROFORMA_OPEN_COUNT,
           CONVERT(DECIMAL(18,2), ISNULL(@PRF_OPEN_VALUE, 0))                           AS PROFORMA_OPEN_VALUE,
           ISNULL(@PRF_OPEN_OLDEST, 0)                                                  AS PROFORMA_OPEN_OLDEST_DAYS,
           ISNULL(@UNB15_JOBS, 0)                                                       AS UNBILLED15_JOBS,
           CONVERT(DECIMAL(18,2), ISNULL(@UNB15_COST, 0))                               AS UNBILLED15_COST,
           ISNULL(@UNB15_OLDEST, 0)                                                     AS UNBILLED15_OLDEST_DAYS

    ---------------------------------------------------------------------------------
    -- Table6 : cash forecast - money in vs money out, NET of unapplied credit on both
    --          sides, allocated oldest first per client / supplier (the same rule the
    --          KPI overdue uses), so "Already overdue" in equals the overdue KPI.
    --          Remaining in window k = max(0, min(B_k, cumulative(B_1..B_k) - credit)).
    ---------------------------------------------------------------------------------
    SELECT F.SORT_NO, F.BUCKET,
           CONVERT(DECIMAL(18,2), F.INFLOW)             AS INFLOW,
           CONVERT(DECIMAL(18,2), F.OUTFLOW)            AS OUTFLOW,
           CONVERT(DECIMAL(18,2), F.INFLOW - F.OUTFLOW) AS NET_GAP
      FROM (
            SELECT 0 AS SORT_NO, 'Already overdue' AS BUCKET,
                   (SELECT ISNULL(SUM(N1), 0) FROM #FLOW WHERE SIDE = 'I') AS INFLOW,
                   (SELECT ISNULL(SUM(N1), 0) FROM #FLOW WHERE SIDE = 'O') AS OUTFLOW
            UNION ALL SELECT 1, 'Next 7 days',
                   (SELECT ISNULL(SUM(N2), 0) FROM #FLOW WHERE SIDE = 'I'),
                   (SELECT ISNULL(SUM(N2), 0) FROM #FLOW WHERE SIDE = 'O')
            UNION ALL SELECT 2, '8-15 days',
                   (SELECT ISNULL(SUM(N3), 0) FROM #FLOW WHERE SIDE = 'I'),
                   (SELECT ISNULL(SUM(N3), 0) FROM #FLOW WHERE SIDE = 'O')
            UNION ALL SELECT 3, '16-30 days',
                   (SELECT ISNULL(SUM(N4), 0) FROM #FLOW WHERE SIDE = 'I'),
                   (SELECT ISNULL(SUM(N4), 0) FROM #FLOW WHERE SIDE = 'O')
            UNION ALL SELECT 4, 'Beyond 30 days',
                   (SELECT ISNULL(SUM(N5), 0) FROM #FLOW WHERE SIDE = 'I'),
                   (SELECT ISNULL(SUM(N5), 0) FROM #FLOW WHERE SIDE = 'O')
           ) F
     ORDER BY F.SORT_NO

    DROP TABLE #FLOW

    ---------------------------------------------------------------------------------
    -- Table7 : client watch list - the five clients management should ask about.
    --          Ranked by money unpaid over 180 days, then overdue. REASON says why the
    --          client is on the list in plain words.
    ---------------------------------------------------------------------------------
    SELECT TOP 5
           W.CLIENTCODE, W.CLIENTNAME,
           CONVERT(DECIMAL(18,2), W.OUTSTANDING)  AS OUTSTANDING,
           CONVERT(DECIMAL(18,2), W.OVERDUE)      AS OVERDUE,
           CONVERT(DECIMAL(18,2), W.OVER_180)     AS OVER_180,
           CONVERT(DECIMAL(5,1),  W.PCT_OVER_180) AS PCT_OVER_180,
           CONVERT(DECIMAL(5,1),  W.PAY_DAYS)     AS PAY_DAYS,
           W.CREDIT_PERIOD,
           CONVERT(DECIMAL(5,1),  W.RECOVERY_GAP) AS RECOVERY_GAP,
           CONVERT(DECIMAL(18,2), W.UNAPPLIED)    AS UNAPPLIED,
           CASE WHEN W.PCT_OVER_180 >= 50 THEN 'Half or more of the balance is unpaid for over 180 days'
                WHEN W.OVER_180 > 0.01    THEN 'Part of the balance is unpaid for over 180 days'
                WHEN W.RECOVERY_GAP > 30  THEN 'Pays about ' + CONVERT(VARCHAR(10), CONVERT(INT, W.RECOVERY_GAP)) + ' days beyond the agreed credit period'
                WHEN W.UNAPPLIED > 0.01   THEN 'Overdue while money received sits unapplied to bills'
                ELSE 'Overdue beyond the credit period' END AS REASON
      FROM (
            SELECT c.CLIENTCODE, c.CLIENTNAME, c.OUTSTANDING, c.OVERDUE,
                   ISNULL(ag.N6 + ag.N7 + ag.N8 + ag.N9, 0) AS OVER_180,
                   CASE WHEN c.OUTSTANDING > 0 THEN 100.0 * ISNULL(ag.N6 + ag.N7 + ag.N8 + ag.N9, 0) / c.OUTSTANDING ELSE 0 END AS PCT_OVER_180,
                   d.PAY_DAYS,
                   ISNULL(t.CREDIT_PERIOD, 30) AS CREDIT_PERIOD,
                   CASE WHEN d.PAY_DAYS IS NOT NULL THEN d.PAY_DAYS - ISNULL(t.CREDIT_PERIOD, 30) END AS RECOVERY_GAP,
                   ISNULL(ua.UNADJUSTED, 0) AS UNAPPLIED
              FROM #CLI c
              LEFT JOIN #AGE ag ON ag.CLIENTCODE = c.CLIENTCODE
              LEFT JOIN (SELECT CLIENTCODE, CASE WHEN SUM(ALLOC) > 0 THEN SUM(DAYS * ALLOC) / SUM(ALLOC) END AS PAY_DAYS
                           FROM #DSOX WHERE DAYS >= 0 GROUP BY CLIENTCODE) d ON d.CLIENTCODE = c.CLIENTCODE
              LEFT JOIN (SELECT CLIENTCODE, MAX(CREDIT_PERIOD) AS CREDIT_PERIOD FROM #INV GROUP BY CLIENTCODE) t ON t.CLIENTCODE = c.CLIENTCODE
              LEFT JOIN #UNADJ ua ON ua.CLIENTCODE = c.CLIENTCODE
             WHERE c.OVERDUE > 0.01
           ) W
     ORDER BY W.OVER_180 DESC, W.OVERDUE DESC

    IF @DBG = 1 BEGIN PRINT '  ' + RIGHT('        ' + CONVERT(VARCHAR(10), DATEDIFF(MS, @T0, GETDATE())), 8) + ' ms  result sets'; PRINT '  ' + RIGHT('        ' + CONVERT(VARCHAR(10), DATEDIFF(MS, @TSTART, GETDATE())), 8) + ' ms  TOTAL' END
    ---------------------------------------------------------------------------------
    DROP TABLE #DSOX
    DROP TABLE #SUPP
    DROP TABLE #PADV
    DROP TABLE #PADVX
    DROP TABLE #POPEN
    DROP TABLE #PSETTLE
    DROP TABLE #PAYLINE
    DROP TABLE #PKEY
    DROP TABLE #PINV
    DROP TABLE #DAYS
    DROP TABLE #PL
    DROP TABLE #JOBINC
    DROP TABLE #INVJOBCNT
    DROP TABLE #JOBEXP
    DROP TABLE #JOBINV
    DROP TABLE #JOBS
    DROP TABLE #CLI
    DROP TABLE #AGE
    DROP TABLE #UNADJ
    DROP TABLE #OPEN
    DROP TABLE #SETTLE
    DROP TABLE #SETTLEX
    DROP TABLE #INVMODE
    DROP TABLE #INV
    DROP TABLE #CITY
END
GO

IF OBJECT_ID('dbo.USP_ACC_RPT_ACCOUNTS_HOME') IS NOT NULL
    PRINT ' USP_ACC_RPT_ACCOUNTS_HOME created.';
ELSE
    PRINT ' *** USP_ACC_RPT_ACCOUNTS_HOME WAS NOT CREATED - see the error above.';
GO

/*  Test (manilal_dev). Compare the KPI row with USP_ACC_RPT_FINANCE_DASHBOARD for the same
    MTD range - TOTAL_OUTSTANDING, OVERDUE_AMT, BILLED_PERIOD, INVOICE_COUNT, REVENUE_PERIOD,
    COST_PERIOD and MARGIN_PCT must agree to the rupee, and Table2 must sum to TOTAL_OUTSTANDING.

    Tie-outs for the new sets: Table5.PAYABLE / PAY_OVERDUE / PAY_DUE_7 against
    USP_ACC_RPT_PAYABLE_DASHBOARD (TOTAL_PAYABLE, OVERDUE, DUE_7) for the same TODATE and a
    12-month lookback; Table5.DSO_DAYS is over the last 90 days, so compare with the Finance
    Dashboard run for that range.

    Per-section timings without STATISTICS TIME noise: pass @DEBUG = '1' and read the Messages tab.
    EXEC dbo.USP_ACC_RPT_ACCOUNTS_HOME '01', '101', '', '1'

    SET STATISTICS TIME ON
    EXEC dbo.USP_ACC_RPT_ACCOUNTS_HOME '01', '101', ''
    EXEC dbo.USP_ACC_RPT_ACCOUNTS_HOME '01', 'ALL', ''
    EXEC dbo.USP_ACC_RPT_FINANCE_DASHBOARD '01/09/2026', '08/09/2026', '01', '101', '', '10'
*/
