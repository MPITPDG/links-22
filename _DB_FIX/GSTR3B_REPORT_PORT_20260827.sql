USE [LinksDB]
GO
/**********************************************************************************************
 NEW FEATURE : GSTR-3B Report (ported from Manilal_V5, where it is live)
 DATE: 27-08-2026

 Adds the branch-wise GSTR-3B working report + "Mark as Filed" archive to LinksDB.
 Procedure bodies are taken VERBATIM from the live manilal database (27-08-2026) - the two
 ERPs share the same schema and GST ledger conventions (GENACCT_MASTER.UNDERGROUP='M000034',
 '%Paid by us%' = input set-off ledgers; verified present in LinksDB: 35 such ledgers).

 Objects created:
   Tables : TBL_ACCT_GSTR3B_FILING (+_LEDGER, _STMT, _SUMMARY)
   Procs  : USP_ACC_RPT_GSTR3B_BRANCHWISE, USP_ACC_GSTR3B_FILING_SAVE / _LIST / _VIEW
   Form   : tbl_mst_form pk_FormId 419 'GSTR-3B REPORT' (page access rights)

 Idempotent - guarded creates, drop-and-recreate procs.
 DEPLOY  : run on the LIVE LinksDB server.
 ROLLBACK: ROLLBACK_GSTR3B_20260827.sql
**********************************************************************************************/

SET NOCOUNT ON
GO

IF OBJECT_ID('dbo.TBL_ACCT_GSTR3B_FILING') IS NULL
BEGIN
    CREATE TABLE dbo.TBL_ACCT_GSTR3B_FILING
    (
        PK_ID       INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_TBL_ACCT_GSTR3B_FILING PRIMARY KEY,
        CMPCODE     VARCHAR(2)   NOT NULL,
        PERIOD_FROM VARCHAR(20)  NOT NULL,
        PERIOD_TO   VARCHAR(20)  NOT NULL,
        PERIOD_KEY  CHAR(17)     NOT NULL,
        FILED_BY    VARCHAR(50)  NULL,
        FILED_ON    DATETIME     NOT NULL CONSTRAINT DF_GSTR3B_FILING_ON DEFAULT (GETDATE()),
        REMARKS     VARCHAR(500) NULL,
        ISACTIVE    BIT          NOT NULL CONSTRAINT DF_GSTR3B_FILING_ACT DEFAULT ((1))
    )
END
GO

IF OBJECT_ID('dbo.TBL_ACCT_GSTR3B_FILING_LEDGER') IS NULL
BEGIN
    CREATE TABLE dbo.TBL_ACCT_GSTR3B_FILING_LEDGER
    (
        PK_ID        INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_TBL_ACCT_GSTR3B_FILING_LEDGER PRIMARY KEY,
        FK_FILING_ID INT           NOT NULL,
        BRANCH       NVARCHAR(50)  NULL,
        NATURE       VARCHAR(10)   NULL,
        RCM          VARCHAR(20)   NULL,
        ACCTCODE     VARCHAR(10)   NULL,
        LEDGER       NVARCHAR(200) NULL,
        AMOUNT       DECIMAL(18,2) NULL
    )
END
GO

IF OBJECT_ID('dbo.TBL_ACCT_GSTR3B_FILING_STMT') IS NULL
BEGIN
    CREATE TABLE dbo.TBL_ACCT_GSTR3B_FILING_STMT
    (
        PK_ID        INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_TBL_ACCT_GSTR3B_FILING_STMT PRIMARY KEY,
        FK_FILING_ID INT           NOT NULL,
        ENTRY_TYPE   VARCHAR(5)    NULL,
        ENTRY_NO     VARCHAR(50)   NULL,
        ENTRY_DATE   VARCHAR(20)   NULL,
        BRCODE       VARCHAR(5)    NULL,
        BRANCH       NVARCHAR(50)  NULL,
        ACCTCODE     VARCHAR(10)   NULL,
        LEDGER       NVARCHAR(200) NULL,
        NATURE       VARCHAR(10)   NULL,
        DRAMT        DECIMAL(18,2) NULL,
        CRAMT        DECIMAL(18,2) NULL,
        LINES        INT           NULL
    )
END
GO

IF OBJECT_ID('dbo.TBL_ACCT_GSTR3B_FILING_SUMMARY') IS NULL
BEGIN
    CREATE TABLE dbo.TBL_ACCT_GSTR3B_FILING_SUMMARY
    (
        PK_ID         INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_TBL_ACCT_GSTR3B_FILING_SUMMARY PRIMARY KEY,
        FK_FILING_ID  INT           NOT NULL,
        BRANCH        NVARCHAR(50)  NULL,
        BRCODE        VARCHAR(5)    NULL,
        SECTION       NVARCHAR(120) NULL,
        TAXABLE_VALUE DECIMAL(18,2) NULL,
        IGST          DECIMAL(18,2) NULL,
        CGST          DECIMAL(18,2) NULL,
        SGST          DECIMAL(18,2) NULL,
        TOTAL_TAX     DECIMAL(18,2) NULL
    )
END
GO

/* ---- page access rights registration ---- */
IF NOT EXISTS (SELECT 1 FROM dbo.tbl_mst_form WHERE FormName = 'gstr3b-report.component.html')
BEGIN
    INSERT INTO dbo.tbl_mst_form (pk_FormId, fk_ModuleId, FormName, DisplayName, isReport, isFranceAct, SEQ, RIGHTS)
    VALUES (419, 1, 'gstr3b-report.component.html', 'GSTR-3B REPORT', 1, 0, 70209, 1110)
END
GO

IF OBJECT_ID('dbo.USP_ACC_RPT_GSTR3B_BRANCHWISE') IS NOT NULL
    DROP PROCEDURE dbo.USP_ACC_RPT_GSTR3B_BRANCHWISE
GO
CREATE PROCEDURE [dbo].[USP_ACC_RPT_GSTR3B_BRANCHWISE]
    @FROMDATE VARCHAR(20), @TODATE VARCHAR(20), @COMPANY VARCHAR(2) = ''
AS
BEGIN
/* ============================================================================================
   RPT_GSTR3B_BRANCHWISE.sql
   --------------------------------------------------------------------------------------------
   PURPOSE : Branch-wise GSTR-3B working - OUTPUT LIABILITY vs INPUT SET-OFF, with taxable value.

   CLASSIFICATION (as defined by the accounts team)
             All GST ledgers sit under GENACCT_MASTER.UNDERGROUP = 'M000034' (Duties & Taxes).
                 ledger name NOT LIKE '%Paid by us%'  ->  LIABILITY   (tax we owe)
                 ledger name     LIKE '%Paid by us%'  ->  SET-OFF     (input tax credit)
             The mapping is read LIVE from GENACCT_MASTER, so a newly created GST ledger is
             picked up automatically - nothing to maintain in this script.

   WHERE THE FIGURES COME FROM
             3.1(a) Outward taxable supplies : ACC_INVCHARGE + ACC_INVCHARGE1  (sales invoice)
                                               less ACC_CRTCHARGE + ACC_CRTCHARGE1 (credit note)
                                               -> uses the stored TaxableAmtINR / CGST_AMT /
                                                  SGST_AMT / IGST_AMT columns (auto-calculated)
             3.1(d) Inward supplies on RCM   : ACC_PURCHASEDTLS lines flagged PUR_TAXABLE = '2'
             4(A)   ITC available            : ACC_PURCHASEDTLS lines on '%Paid by us%' ledgers
                                               taxable base = lines flagged PUR_TAXABLE = '1'

   PUR_TAXABLE FLAG (purchase lines) - decoded from live data
                 '1' = taxable, forward charge (18%)      '2' = taxable, REVERSE CHARGE (GTA 5%)
                 '0' = not taxable / is itself a GST line 'N' = not taxable
             Purchase entry has NO auto GST calculation, so these amounts are typed by hand.
             Run AUDIT_PURCHASE_GST_WRONG_LEDGER.sql first to clear wrong-ledger mistakes,
             otherwise the SET-OFF figures below inherit those errors.

   NOT USED HERE - TDS
             ISTDSAPP / PUR_TDS / TDS_TYPE / RATE / TDS_AMT on ACC_PURCHASEDTLS are the TDS
             flags and are auto-calculated by the ERP. TDS is a different levy and is excluded:
             its ledger (Tax Ded. Source Payable) is not under UNDERGROUP 'M000034', so it
             never enters these figures.

   IMPORTANT - INVOICE CHARGES LIVE IN TWO TABLES
             A sales invoice splits its charge lines across ACC_INVCHARGE *and* ACC_INVCHARGE1.
             Both must be added or the taxable value is understated. Same for credit notes.

   TARGET    SQL Server 2008 R2.  READ-ONLY - this script changes nothing.
   ============================================================================================ */


    SET NOCOUNT ON;

    /* ---------------------------------- PARAMETERS -------------------------------------------- */
    /* Keep VARCHAR(20): '01-JULY-2026' is 12 chars and a shorter type truncates it. */



    /* ------------------------------------------------------------------------------------------ */

    DECLARE @FROM CHAR(8) = CONVERT(CHAR(8), CONVERT(DATETIME, @FROMDATE), 112);
    DECLARE @TO   CHAR(8) = CONVERT(CHAR(8), CONVERT(DATETIME, @TODATE),   112);

    /* ---------------------------------------------------------------------------------------------
       REVERSE-CHARGE CREDIT IS AVAILED ONE MONTH LATER  (finance policy)
       The RCM liability of a month is discharged in that month's return, and the matching credit
       is taken in the IMMEDIATELY FOLLOWING month's return. So for the period being reported:
           - this period's own RCM credit  -> DEFERRED, shown separately, NOT in the net position
           - the PREVIOUS month's RCM credit -> availed now, and IS in the net position
       Without the second half the net position would defer credit every month and never claim it.
       --------------------------------------------------------------------------------------------- */
    DECLARE @DT_FROM DATETIME = CONVERT(DATETIME, @FROMDATE);
    DECLARE @MSTART  DATETIME = DATEADD(MONTH, DATEDIFF(MONTH, 0, @DT_FROM), 0);  -- 1st of that month
    DECLARE @PREV_FROM  CHAR(8)     = CONVERT(CHAR(8), DATEADD(MONTH,-1,@MSTART), 112);
    DECLARE @PREV_TO    CHAR(8)     = CONVERT(CHAR(8), DATEADD(DAY,  -1,@MSTART), 112);
    DECLARE @PREV_LABEL VARCHAR(20) = UPPER(LEFT(DATENAME(MONTH, DATEADD(MONTH,-1,@MSTART)),3))
                                      + '-' + CONVERT(VARCHAR(4), YEAR(DATEADD(MONTH,-1,@MSTART)));
    DECLARE @NEXT_LABEL VARCHAR(20) = UPPER(LEFT(DATENAME(MONTH, DATEADD(MONTH, 1,@MSTART)),3))
                                      + '-' + CONVERT(VARCHAR(4), YEAR(DATEADD(MONTH, 1,@MSTART)));

    /* =================== 1. LIVE GST LEDGER MAP =============================================== */
    IF OBJECT_ID('TEMPDB..#GSTLED') IS NOT NULL DROP TABLE #GSTLED;
    SELECT  ACCTCODE = LTRIM(RTRIM(G.ACCTCODE)),
            ACCTNAME = G.ACCTNAME,
            NATURE   = CASE WHEN G.ACCTNAME LIKE '%Paid by us%' THEN 'SETOFF' ELSE 'LIABILITY' END,
            SIDE     = CASE WHEN G.ACCTNAME LIKE '%Integrated%' THEN 'I'
                            WHEN G.ACCTNAME LIKE '%Central%'    THEN 'C'
                            WHEN G.ACCTNAME LIKE '%State%'      THEN 'S' ELSE '?' END,
            IS_RCM   = CASE WHEN G.ACCTNAME LIKE '%REV %' OR G.ACCTNAME LIKE '%TRANSPORT CHGS%'
                            THEN 1 ELSE 0 END,
            /* family key: the ledger name with the side word removed, so the Central / State /
               Integrated members of one family collapse to the same value. Used by the
               document-level warnings to spot a CGST paired with an SGST of another family. */
            GSTGROUP = UPPER(LTRIM(RTRIM(REPLACE(REPLACE(REPLACE(REPLACE(
                            G.ACCTNAME,'Integrated',''),'Central',''),'State',''),'  ',' '))))
    INTO    #GSTLED
    FROM    GENACCT_MASTER G WITH(NOLOCK)
    WHERE   G.UNDERGROUP = 'M000034'
            AND G.ACCTNAME LIKE '%GST%'
            AND G.ACCTNAME NOT LIKE '%REFUND%'   -- GST REFUND RECD is not a tax head
            AND (G.ACCTNAME LIKE '%Central%' OR G.ACCTNAME LIKE '%State%' OR G.ACCTNAME LIKE '%Integrated%');

    /* =================== 2. OUTWARD : SALES INVOICE less CREDIT NOTE =========================== */
    IF OBJECT_ID('TEMPDB..#OUTWARD') IS NOT NULL DROP TABLE #OUTWARD;
    SELECT  BRCODE = SUBSTRING(DOCNO,3,3),
            TAXABLE = SUM(TAXABLE), IGST = SUM(IGST), CGST = SUM(CGST), SGST = SUM(SGST)
    INTO    #OUTWARD
    FROM (
        SELECT DOCNO = I.INV_NO, TAXABLE = ISNULL(C.TaxableAmtINR,0),
               IGST = ISNULL(C.IGST_AMT,0), CGST = ISNULL(C.CGST_AMT,0), SGST = ISNULL(C.SGST_AMT,0)
        FROM   ACC_INVCHARGE C WITH(NOLOCK) INNER JOIN ACC_INVOICE I WITH(NOLOCK) ON I.INV_NO = C.INV_NO
        WHERE  SUBSTRING(I.INV_DATE,7,4)+SUBSTRING(I.INV_DATE,4,2)+SUBSTRING(I.INV_DATE,1,2) BETWEEN @FROM AND @TO
               AND (@COMPANY = '' OR LTRIM(RTRIM(I.CMPCODE)) = @COMPANY)
        UNION ALL
        SELECT I.INV_NO, ISNULL(C.TaxableAmtINR,0),
               ISNULL(C.IGST_AMT,0), ISNULL(C.CGST_AMT,0), ISNULL(C.SGST_AMT,0)
        FROM   ACC_INVCHARGE1 C WITH(NOLOCK) INNER JOIN ACC_INVOICE I WITH(NOLOCK) ON I.INV_NO = C.INV_NO
        WHERE  SUBSTRING(I.INV_DATE,7,4)+SUBSTRING(I.INV_DATE,4,2)+SUBSTRING(I.INV_DATE,1,2) BETWEEN @FROM AND @TO
               AND (@COMPANY = '' OR LTRIM(RTRIM(I.CMPCODE)) = @COMPANY)
        UNION ALL   /* credit notes reduce outward liability */
        SELECT N.CRT_NO, -ISNULL(C.crt_TaxableAmtINR,0),
               -ISNULL(C.IGST_AMT,0), -ISNULL(C.CGST_AMT,0), -ISNULL(C.SGST_AMT,0)
        FROM   ACC_CRTCHARGE C WITH(NOLOCK) INNER JOIN ACC_CREDITNOTE N WITH(NOLOCK) ON N.CRT_NO = C.CRT_NO
        WHERE  SUBSTRING(N.CRT_DATE,7,4)+SUBSTRING(N.CRT_DATE,4,2)+SUBSTRING(N.CRT_DATE,1,2) BETWEEN @FROM AND @TO
               AND (@COMPANY = '' OR LTRIM(RTRIM(N.CMPCODE)) = @COMPANY)
        UNION ALL
        SELECT N.CRT_NO, -ISNULL(C.crt_TaxableAmtINR,0),
               -ISNULL(C.IGST_AMT,0), -ISNULL(C.CGST_AMT,0), -ISNULL(C.SGST_AMT,0)
        FROM   ACC_CRTCHARGE1 C WITH(NOLOCK) INNER JOIN ACC_CREDITNOTE N WITH(NOLOCK) ON N.CRT_NO = C.CRT_NO
        WHERE  SUBSTRING(N.CRT_DATE,7,4)+SUBSTRING(N.CRT_DATE,4,2)+SUBSTRING(N.CRT_DATE,1,2) BETWEEN @FROM AND @TO
               AND (@COMPANY = '' OR LTRIM(RTRIM(N.CMPCODE)) = @COMPANY)
    ) Q
    GROUP BY SUBSTRING(DOCNO,3,3);

    /* =================== 3. GST LEDGER AMOUNTS - PURCHASE, BANK/CASH AND JV ===================
       Dr / Cr convention, the same one the statement SP uses:
           purchase   PUR_AMOUNT = DEBIT, PUR_DEDUCTION = CREDIT
           bank/cash  payment (BP/CP/CE) = DEBIT, receipt (BR/CR) = CREDIT
           journal    JV_DEBIT / JV_CREDIT
           input credit ledgers "(Paid by us)" sit on the DEBIT side,
           reverse-charge liability, e.g. TRANSPORT CHGS, on the CREDIT side.
       A reverse-charge purchase books BOTH sides. Reading only the debit column makes every RCM
       liability line look like 0.00, so AMT is taken in the ledger's natural direction:
           SET-OFF = Dr - Cr , LIABILITY = Cr - Dr.

       BANK/CASH AND JV ARE INCLUDED (finance team decision, Aug-2026). GST keyed straight into a
       bank payment or a journal never touches a purchase or invoice line, so before this it was
       absent from the return entirely - 494.90 of input credit in Jul-2026 alone. Those entries
       are still listed on the warnings tab, because they bypass the GST calculation and are worth
       a look, but they now count towards the figures.
       ========================================================================================== */
    IF OBJECT_ID('TEMPDB..#GSTPOST') IS NOT NULL DROP TABLE #GSTPOST;
    SELECT  BRCODE, ACCTCODE, DR, CR
    INTO    #GSTPOST
    FROM (
        /* ---- purchase ---- */
        SELECT  BRCODE = SUBSTRING(P.PUR_CODE,3,3), ACCTCODE = LTRIM(RTRIM(D.PUR_ACCOUNT)),
                V.DR, V.CR
        FROM    ACC_PURCHASEDTLS D WITH(NOLOCK)
                INNER JOIN ACC_PURCHASE P WITH(NOLOCK) ON P.PUR_CODE = D.PUR_CODE
                /* strip tab/CR/LF - SQL 2008 LTRIM removes spaces only and one live PUR_DEDUCTION
                   value contains a TAB, which breaks a plain CONVERT.                           */
                CROSS APPLY (SELECT DRS = LTRIM(RTRIM(REPLACE(REPLACE(REPLACE(ISNULL(D.PUR_AMOUNT,''),   CHAR(9),''),CHAR(10),''),CHAR(13),''))),
                                    CRS = LTRIM(RTRIM(REPLACE(REPLACE(REPLACE(ISNULL(D.PUR_DEDUCTION,''),CHAR(9),''),CHAR(10),''),CHAR(13),'')))) T
                CROSS APPLY (SELECT DR = CASE WHEN T.DRS LIKE '%[0-9]%' AND T.DRS NOT LIKE '%[^0-9.-]%' AND LEN(T.DRS) < 16
                                              THEN CONVERT(DECIMAL(18,2), T.DRS) ELSE 0 END,
                                    CR = CASE WHEN T.CRS LIKE '%[0-9]%' AND T.CRS NOT LIKE '%[^0-9.-]%' AND LEN(T.CRS) < 16
                                              THEN CONVERT(DECIMAL(18,2), T.CRS) ELSE 0 END) V
        WHERE   SUBSTRING(P.PUR_DATE,7,4)+SUBSTRING(P.PUR_DATE,4,2)+SUBSTRING(P.PUR_DATE,1,2) BETWEEN @FROM AND @TO
                AND (@COMPANY = '' OR SUBSTRING(P.PUR_CODE,1,2) = @COMPANY)

        UNION ALL   /* ---- bank / cash ----
           ACC_BANKDTLS carries BOTH sides, exactly like purchase: AMOUNT and DEDUCTION. On a bank
           payment the reverse-charge liability (TRANSPORT CHGS) is keyed into DEDUCTION while the
           matching credit (REV Paid by us) is keyed into AMOUNT, so reading AMOUNT alone reports
           the liability as zero and invents an RCM mismatch. Dr/Cr per status below is the same
           convention USP_ACC_RPT_CLIENT_OUTSTANDING_ALLCITY_LIST uses.                          */
        SELECT  SUBSTRING(D.ENTRYNO,3,3), LTRIM(RTRIM(D.CLIENT)),
                DR = CASE WHEN H.STATUS IN ('BP','CP','CE') THEN CONVERT(DECIMAL(18,2), CONVERT(FLOAT, ISNULL(D.AMOUNT,0)))
                          WHEN H.STATUS IN ('BR','CR')      THEN CONVERT(DECIMAL(18,2), CONVERT(FLOAT, ISNULL(D.DEDUCTION,0)))
                          ELSE 0 END,
                CR = CASE WHEN H.STATUS IN ('BP','CP')      THEN CONVERT(DECIMAL(18,2), CONVERT(FLOAT, ISNULL(D.DEDUCTION,0)))
                          WHEN H.STATUS IN ('BR','CR')      THEN CONVERT(DECIMAL(18,2), CONVERT(FLOAT, ISNULL(D.AMOUNT,0)))
                          ELSE 0 END
        FROM    ACC_BANKDTLS D WITH(NOLOCK)
                INNER JOIN ACC_BANK H WITH(NOLOCK) ON H.ENTRYNO = D.ENTRYNO
        WHERE   SUBSTRING(H.ENTRYDT,7,4)+SUBSTRING(H.ENTRYDT,4,2)+SUBSTRING(H.ENTRYDT,1,2) BETWEEN @FROM AND @TO
                AND (@COMPANY = '' OR LTRIM(RTRIM(H.CMPCODE)) = @COMPANY)

        UNION ALL   /* ---- journal voucher ---- */
        SELECT  SUBSTRING(D.JVCODE,3,3), LTRIM(RTRIM(D.JV_ACCOUNT)),
                CONVERT(DECIMAL(18,2), CONVERT(FLOAT, ISNULL(D.JV_DEBIT,0))),
                CONVERT(DECIMAL(18,2), CONVERT(FLOAT, ISNULL(D.JV_CREDIT,0)))
        FROM    ACC_JOURNALVOUCDTLS D WITH(NOLOCK)
                INNER JOIN ACC_JOURNALVOUC H WITH(NOLOCK) ON H.JVCODE = D.JVCODE
        WHERE   SUBSTRING(H.JV_DATE,7,4)+SUBSTRING(H.JV_DATE,4,2)+SUBSTRING(H.JV_DATE,1,2) BETWEEN @FROM AND @TO
                AND (@COMPANY = '' OR LTRIM(RTRIM(H.CMPCODE)) = @COMPANY)
    ) SRC;

    IF OBJECT_ID('TEMPDB..#PURGST') IS NOT NULL DROP TABLE #PURGST;
    SELECT  P.BRCODE,
            L.NATURE, L.SIDE, L.IS_RCM, L.ACCTCODE, L.ACCTNAME,
            AMT = SUM(CASE WHEN L.NATURE = 'SETOFF' THEN P.DR - P.CR ELSE P.CR - P.DR END),
            DR  = SUM(P.DR),
            CR  = SUM(P.CR)
    INTO    #PURGST
    FROM    #GSTPOST P
            INNER JOIN #GSTLED L ON L.ACCTCODE = P.ACCTCODE
    GROUP BY P.BRCODE, L.NATURE, L.SIDE, L.IS_RCM, L.ACCTCODE, L.ACCTNAME;

    /* =================== 3b. PREVIOUS MONTH'S RCM CREDIT - availed in THIS return ==============
       Same rule and the same three sources as section 3, run over the previous calendar month and
       restricted to the reverse-charge input ledgers ("REV (Paid by us)").
       ========================================================================================== */
    IF OBJECT_ID('TEMPDB..#GSTPOST_PREV') IS NOT NULL DROP TABLE #GSTPOST_PREV;
    SELECT  BRCODE, ACCTCODE, DR, CR
    INTO    #GSTPOST_PREV
    FROM (
        SELECT  BRCODE = SUBSTRING(P.PUR_CODE,3,3), ACCTCODE = LTRIM(RTRIM(D.PUR_ACCOUNT)), V.DR, V.CR
        FROM    ACC_PURCHASEDTLS D WITH(NOLOCK)
                INNER JOIN ACC_PURCHASE P WITH(NOLOCK) ON P.PUR_CODE = D.PUR_CODE
                CROSS APPLY (SELECT DRS = LTRIM(RTRIM(REPLACE(REPLACE(REPLACE(ISNULL(D.PUR_AMOUNT,''),   CHAR(9),''),CHAR(10),''),CHAR(13),''))),
                                    CRS = LTRIM(RTRIM(REPLACE(REPLACE(REPLACE(ISNULL(D.PUR_DEDUCTION,''),CHAR(9),''),CHAR(10),''),CHAR(13),'')))) T
                CROSS APPLY (SELECT DR = CASE WHEN T.DRS LIKE '%[0-9]%' AND T.DRS NOT LIKE '%[^0-9.-]%' AND LEN(T.DRS) < 16
                                              THEN CONVERT(DECIMAL(18,2), T.DRS) ELSE 0 END,
                                    CR = CASE WHEN T.CRS LIKE '%[0-9]%' AND T.CRS NOT LIKE '%[^0-9.-]%' AND LEN(T.CRS) < 16
                                              THEN CONVERT(DECIMAL(18,2), T.CRS) ELSE 0 END) V
        WHERE   SUBSTRING(P.PUR_DATE,7,4)+SUBSTRING(P.PUR_DATE,4,2)+SUBSTRING(P.PUR_DATE,1,2) BETWEEN @PREV_FROM AND @PREV_TO
                AND (@COMPANY = '' OR SUBSTRING(P.PUR_CODE,1,2) = @COMPANY)
        UNION ALL
        SELECT  SUBSTRING(D.ENTRYNO,3,3), LTRIM(RTRIM(D.CLIENT)),
                CASE WHEN H.STATUS IN ('BP','CP','CE') THEN CONVERT(DECIMAL(18,2), CONVERT(FLOAT, ISNULL(D.AMOUNT,0))) ELSE 0 END,
                CASE WHEN H.STATUS IN ('BR','CR')      THEN CONVERT(DECIMAL(18,2), CONVERT(FLOAT, ISNULL(D.AMOUNT,0))) ELSE 0 END
        FROM    ACC_BANKDTLS D WITH(NOLOCK)
                INNER JOIN ACC_BANK H WITH(NOLOCK) ON H.ENTRYNO = D.ENTRYNO
        WHERE   SUBSTRING(H.ENTRYDT,7,4)+SUBSTRING(H.ENTRYDT,4,2)+SUBSTRING(H.ENTRYDT,1,2) BETWEEN @PREV_FROM AND @PREV_TO
                AND (@COMPANY = '' OR LTRIM(RTRIM(H.CMPCODE)) = @COMPANY)
        UNION ALL
        SELECT  SUBSTRING(D.JVCODE,3,3), LTRIM(RTRIM(D.JV_ACCOUNT)),
                CONVERT(DECIMAL(18,2), CONVERT(FLOAT, ISNULL(D.JV_DEBIT,0))),
                CONVERT(DECIMAL(18,2), CONVERT(FLOAT, ISNULL(D.JV_CREDIT,0)))
        FROM    ACC_JOURNALVOUCDTLS D WITH(NOLOCK)
                INNER JOIN ACC_JOURNALVOUC H WITH(NOLOCK) ON H.JVCODE = D.JVCODE
        WHERE   SUBSTRING(H.JV_DATE,7,4)+SUBSTRING(H.JV_DATE,4,2)+SUBSTRING(H.JV_DATE,1,2) BETWEEN @PREV_FROM AND @PREV_TO
                AND (@COMPANY = '' OR LTRIM(RTRIM(H.CMPCODE)) = @COMPANY)
    ) SRC;

    IF OBJECT_ID('TEMPDB..#PURGST_PREV') IS NOT NULL DROP TABLE #PURGST_PREV;
    SELECT  P.BRCODE, L.SIDE,
            AMT = SUM(P.DR - P.CR)
    INTO    #PURGST_PREV
    FROM    #GSTPOST_PREV P
            INNER JOIN #GSTLED L ON L.ACCTCODE = P.ACCTCODE
    WHERE   L.NATURE = 'SETOFF' AND L.IS_RCM = 1
    GROUP BY P.BRCODE, L.SIDE;

    /* =================== 4. PURCHASE : TAXABLE BASE BY FLAG =================================== */
    IF OBJECT_ID('TEMPDB..#PURBASE') IS NOT NULL DROP TABLE #PURBASE;
    SELECT  BRCODE = SUBSTRING(P.PUR_CODE,3,3),
            BASE_FWD = SUM(CASE WHEN LTRIM(RTRIM(ISNULL(D.PUR_TAXABLE,''))) = '1' THEN V.AMT ELSE 0 END),
            BASE_RCM = SUM(CASE WHEN LTRIM(RTRIM(ISNULL(D.PUR_TAXABLE,''))) = '2' THEN V.AMT ELSE 0 END)
    INTO    #PURBASE
    FROM    ACC_PURCHASEDTLS D WITH(NOLOCK)
            INNER JOIN ACC_PURCHASE P WITH(NOLOCK) ON P.PUR_CODE = D.PUR_CODE
            CROSS APPLY (SELECT DRS = LTRIM(RTRIM(REPLACE(REPLACE(REPLACE(ISNULL(D.PUR_AMOUNT,''),CHAR(9),''),CHAR(10),''),CHAR(13),'')))) T
            CROSS APPLY (SELECT AMT = CASE WHEN T.DRS LIKE '%[0-9]%' AND T.DRS NOT LIKE '%[^0-9.-]%' AND LEN(T.DRS) < 16
                                           THEN CONVERT(DECIMAL(18,2), T.DRS) ELSE 0 END) V
    WHERE   SUBSTRING(P.PUR_DATE,7,4)+SUBSTRING(P.PUR_DATE,4,2)+SUBSTRING(P.PUR_DATE,1,2) BETWEEN @FROM AND @TO
            AND (@COMPANY = '' OR SUBSTRING(P.PUR_CODE,1,2) = @COMPANY)
    GROUP BY SUBSTRING(P.PUR_CODE,3,3);

    /* =================== 5. ALL BRANCHES TOUCHED ============================================== */
    IF OBJECT_ID('TEMPDB..#BR') IS NOT NULL DROP TABLE #BR;
    SELECT DISTINCT BRCODE INTO #BR FROM (
        SELECT BRCODE FROM #OUTWARD UNION SELECT BRCODE FROM #PURGST UNION SELECT BRCODE FROM #PURBASE
        UNION SELECT BRCODE FROM #PURGST_PREV
    ) Q WHERE BRCODE IS NOT NULL;

    /* ============================================================================================
       RESULT 1 : GSTR-3B BRANCH-WISE SUMMARY
       ============================================================================================ */
    SELECT
        BRANCH        = ISNULL(CT.CITYNAME, B.BRCODE),
        BRCODE        = B.BRCODE,
        SECTION       = S.SECTION,
        TAXABLE_VALUE = S.TAXABLE,
        IGST          = S.IGST,
        CGST          = S.CGST,
        SGST          = S.SGST,
        TOTAL_TAX     = S.IGST + S.CGST + S.SGST
    FROM        #BR B
    CROSS APPLY (
        /* 3.1(a) outward supplies - liability */
        SELECT SECTION = '3.1(a) OUTWARD TAXABLE SUPPLIES  [LIABILITY]', SEQ = 1,
               TAXABLE = ISNULL(O.TAXABLE,0), IGST = ISNULL(O.IGST,0),
               CGST    = ISNULL(O.CGST,0),    SGST = ISNULL(O.SGST,0)
        FROM  (SELECT TOP 1 * FROM #OUTWARD O2 WHERE O2.BRCODE = B.BRCODE) O
        UNION ALL
        /* 3.1(d) inward supplies liable to reverse charge - liability */
        SELECT '3.1(d) INWARD SUPPLIES - REVERSE CHARGE  [LIABILITY]', 2,
               ISNULL((SELECT BASE_RCM FROM #PURBASE X WHERE X.BRCODE = B.BRCODE),0),
               ISNULL((SELECT SUM(AMT) FROM #PURGST X WHERE X.BRCODE=B.BRCODE AND X.NATURE='LIABILITY' AND X.SIDE='I'),0),
               ISNULL((SELECT SUM(AMT) FROM #PURGST X WHERE X.BRCODE=B.BRCODE AND X.NATURE='LIABILITY' AND X.SIDE='C'),0),
               ISNULL((SELECT SUM(AMT) FROM #PURGST X WHERE X.BRCODE=B.BRCODE AND X.NATURE='LIABILITY' AND X.SIDE='S'),0)
        UNION ALL
        /* 4(A)(3) ITC on reverse charge brought forward from LAST month - claimable in THIS return */
        SELECT '4(A)(3) ITC - REVERSE CHARGE B/F FROM ' + @PREV_LABEL + '  [SET-OFF]', 3, 0,
               ISNULL((SELECT SUM(AMT) FROM #PURGST_PREV X WHERE X.BRCODE=B.BRCODE AND X.SIDE='I'),0),
               ISNULL((SELECT SUM(AMT) FROM #PURGST_PREV X WHERE X.BRCODE=B.BRCODE AND X.SIDE='C'),0),
               ISNULL((SELECT SUM(AMT) FROM #PURGST_PREV X WHERE X.BRCODE=B.BRCODE AND X.SIDE='S'),0)
        UNION ALL
        /* 4(A)(5) all other ITC - set-off */
        SELECT '4(A)(5) ITC - ALL OTHER  [SET-OFF]', 4,
               ISNULL((SELECT BASE_FWD FROM #PURBASE X WHERE X.BRCODE = B.BRCODE),0),
               ISNULL((SELECT SUM(AMT) FROM #PURGST X WHERE X.BRCODE=B.BRCODE AND X.NATURE='SETOFF' AND X.IS_RCM=0 AND X.SIDE='I'),0),
               ISNULL((SELECT SUM(AMT) FROM #PURGST X WHERE X.BRCODE=B.BRCODE AND X.NATURE='SETOFF' AND X.IS_RCM=0 AND X.SIDE='C'),0),
               ISNULL((SELECT SUM(AMT) FROM #PURGST X WHERE X.BRCODE=B.BRCODE AND X.NATURE='SETOFF' AND X.IS_RCM=0 AND X.SIDE='S'),0)
        UNION ALL
        /* MEMO ONLY - this period's own RCM credit. Deliberately excluded from the net position;
           it becomes claimable in next month's return. See the RCM ITC Deferred result set.      */
        SELECT 'MEMO: RCM ITC OF THIS PERIOD - AVAIL IN ' + @NEXT_LABEL + '  [NOT IN NET POSITION]', 5, 0,
               ISNULL((SELECT SUM(AMT) FROM #PURGST X WHERE X.BRCODE=B.BRCODE AND X.NATURE='SETOFF' AND X.IS_RCM=1 AND X.SIDE='I'),0),
               ISNULL((SELECT SUM(AMT) FROM #PURGST X WHERE X.BRCODE=B.BRCODE AND X.NATURE='SETOFF' AND X.IS_RCM=1 AND X.SIDE='C'),0),
               ISNULL((SELECT SUM(AMT) FROM #PURGST X WHERE X.BRCODE=B.BRCODE AND X.NATURE='SETOFF' AND X.IS_RCM=1 AND X.SIDE='S'),0)
    ) S
    LEFT JOIN CITY CT WITH(NOLOCK) ON CT.CITYCODE1 = B.BRCODE
    WHERE   S.TAXABLE <> 0 OR S.IGST <> 0 OR S.CGST <> 0 OR S.SGST <> 0
    ORDER BY BRANCH, S.SEQ;

    /* ============================================================================================
       RESULT 2 : NET POSITION PER BRANCH  (LIABILITY - SET-OFF = PAYABLE IN CASH)
       ============================================================================================ */
    SELECT
        BRANCH          = ISNULL(CT.CITYNAME, B.BRCODE),
        LIAB_IGST       = L.I, LIAB_CGST = L.C, LIAB_SGST = L.S, LIAB_TOTAL = L.I + L.C + L.S,
        SETOFF_IGST     = T.I, SETOFF_CGST = T.C, SETOFF_SGST = T.S, SETOFF_TOTAL = T.I + T.C + T.S,
        NET_PAYABLE     = (L.I + L.C + L.S) - (T.I + T.C + T.S)
    FROM        #BR B
    CROSS APPLY (SELECT I = ISNULL((SELECT IGST FROM #OUTWARD O WHERE O.BRCODE=B.BRCODE),0)
                           + ISNULL((SELECT SUM(AMT) FROM #PURGST X WHERE X.BRCODE=B.BRCODE AND X.NATURE='LIABILITY' AND X.SIDE='I'),0),
                        C = ISNULL((SELECT CGST FROM #OUTWARD O WHERE O.BRCODE=B.BRCODE),0)
                           + ISNULL((SELECT SUM(AMT) FROM #PURGST X WHERE X.BRCODE=B.BRCODE AND X.NATURE='LIABILITY' AND X.SIDE='C'),0),
                        S = ISNULL((SELECT SGST FROM #OUTWARD O WHERE O.BRCODE=B.BRCODE),0)
                           + ISNULL((SELECT SUM(AMT) FROM #PURGST X WHERE X.BRCODE=B.BRCODE AND X.NATURE='LIABILITY' AND X.SIDE='S'),0)) L
    /* SET-OFF = this period's NON-reverse-charge credit  +  LAST month's reverse-charge credit.
       This period's own RCM credit is deliberately excluded - it is availed next month.        */
    CROSS APPLY (SELECT I = ISNULL((SELECT SUM(AMT) FROM #PURGST      X WHERE X.BRCODE=B.BRCODE AND X.NATURE='SETOFF' AND X.IS_RCM=0 AND X.SIDE='I'),0)
                           + ISNULL((SELECT SUM(AMT) FROM #PURGST_PREV X WHERE X.BRCODE=B.BRCODE AND X.SIDE='I'),0),
                        C = ISNULL((SELECT SUM(AMT) FROM #PURGST      X WHERE X.BRCODE=B.BRCODE AND X.NATURE='SETOFF' AND X.IS_RCM=0 AND X.SIDE='C'),0)
                           + ISNULL((SELECT SUM(AMT) FROM #PURGST_PREV X WHERE X.BRCODE=B.BRCODE AND X.SIDE='C'),0),
                        S = ISNULL((SELECT SUM(AMT) FROM #PURGST      X WHERE X.BRCODE=B.BRCODE AND X.NATURE='SETOFF' AND X.IS_RCM=0 AND X.SIDE='S'),0)
                           + ISNULL((SELECT SUM(AMT) FROM #PURGST_PREV X WHERE X.BRCODE=B.BRCODE AND X.SIDE='S'),0)) T
    LEFT JOIN   CITY CT WITH(NOLOCK) ON CT.CITYCODE1 = B.BRCODE
    ORDER BY    BRANCH;

    /* ============================================================================================
       RESULT 3 : LEDGER-WISE BREAK-UP  (drill-down behind Result 1)
       ============================================================================================ */
    SELECT  BRANCH   = ISNULL(CT.CITYNAME, P.BRCODE),
            NATURE   = P.NATURE,
            RCM      = CASE WHEN P.IS_RCM = 1 THEN 'REVERSE CHARGE' ELSE 'NORMAL' END,
            ACCTCODE = P.ACCTCODE,
            LEDGER   = P.ACCTNAME,
            AMOUNT   = P.AMT
    FROM        #PURGST P
    LEFT JOIN   CITY CT WITH(NOLOCK) ON CT.CITYCODE1 = P.BRCODE
    WHERE       P.AMT <> 0
    ORDER BY    BRANCH, P.NATURE, P.ACCTNAME;

    /* ============================================================================================
       RESULT 4 : WARNINGS - read this before filing
       Document level: every row names the entry type, entry number and date so the accounts team
       can go straight to the document instead of hunting through a branch total.
       ============================================================================================ */

    /* ---- purchase, per document per GST family. Purchase entry has no automatic GST calculation,
            so this is where the wrong-ledger mistakes happen. Signed value Dr - Cr, because a
            reverse-charge liability line sits on the credit side.                              ---- */
    IF OBJECT_ID('TEMPDB..#PURDOCLINE') IS NOT NULL DROP TABLE #PURDOCLINE;
    SELECT  P.PUR_CODE, P.PUR_DATE, P.PUR_SUPPLIER,
            BRCODE = SUBSTRING(P.PUR_CODE,3,3),
            L.ACCTCODE, L.ACCTNAME, L.GSTGROUP, L.SIDE, L.NATURE, L.IS_RCM,
            VAL = V.DR - V.CR
    INTO    #PURDOCLINE
    FROM    ACC_PURCHASEDTLS D WITH(NOLOCK)
            INNER JOIN ACC_PURCHASE P WITH(NOLOCK) ON P.PUR_CODE = D.PUR_CODE
            INNER JOIN #GSTLED      L               ON L.ACCTCODE = LTRIM(RTRIM(D.PUR_ACCOUNT))
            CROSS APPLY (SELECT DRS = LTRIM(RTRIM(REPLACE(REPLACE(REPLACE(ISNULL(D.PUR_AMOUNT,''),   CHAR(9),''),CHAR(10),''),CHAR(13),''))),
                                CRS = LTRIM(RTRIM(REPLACE(REPLACE(REPLACE(ISNULL(D.PUR_DEDUCTION,''),CHAR(9),''),CHAR(10),''),CHAR(13),'')))) T
            CROSS APPLY (SELECT DR = CASE WHEN T.DRS LIKE '%[0-9]%' AND T.DRS NOT LIKE '%[^0-9.-]%' AND LEN(T.DRS) < 16
                                          THEN CONVERT(DECIMAL(18,2), T.DRS) ELSE 0 END,
                                CR = CASE WHEN T.CRS LIKE '%[0-9]%' AND T.CRS NOT LIKE '%[^0-9.-]%' AND LEN(T.CRS) < 16
                                          THEN CONVERT(DECIMAL(18,2), T.CRS) ELSE 0 END) V
    WHERE   SUBSTRING(P.PUR_DATE,7,4)+SUBSTRING(P.PUR_DATE,4,2)+SUBSTRING(P.PUR_DATE,1,2) BETWEEN @FROM AND @TO
            AND (@COMPANY = '' OR SUBSTRING(P.PUR_CODE,1,2) = @COMPANY)
            AND (V.DR - V.CR) <> 0;

    IF OBJECT_ID('TEMPDB..#PURDOCGRP') IS NOT NULL DROP TABLE #PURDOCGRP;
    SELECT  PUR_CODE, GSTGROUP,
            G_C = SUM(CASE WHEN SIDE='C' THEN VAL ELSE 0 END),
            G_S = SUM(CASE WHEN SIDE='S' THEN VAL ELSE 0 END),
            G_DUP = MAX(CASE WHEN SIDE IN ('C','S') THEN CNT_LED ELSE 0 END)
    INTO    #PURDOCGRP
    FROM   (SELECT L.*, CNT_LED = COUNT(*) OVER (PARTITION BY PUR_CODE, ACCTCODE) FROM #PURDOCLINE L) Q
    GROUP BY PUR_CODE, GSTGROUP;

    IF OBJECT_ID('TEMPDB..#PURDOC') IS NOT NULL DROP TABLE #PURDOC;
    SELECT  L.PUR_CODE,
            PUR_DATE = MAX(L.PUR_DATE), PUR_SUPPLIER = MAX(L.PUR_SUPPLIER), BRCODE = MAX(L.BRCODE),
            DOC_C = SUM(CASE WHEN L.SIDE='C' THEN L.VAL ELSE 0 END),
            DOC_S = SUM(CASE WHEN L.SIDE='S' THEN L.VAL ELSE 0 END),
            DOC_I = SUM(CASE WHEN L.SIDE='I' THEN L.VAL ELSE 0 END),
            C_LINES = SUM(CASE WHEN L.SIDE='C' THEN 1 ELSE 0 END),
            S_LINES = SUM(CASE WHEN L.SIDE='S' THEN 1 ELSE 0 END),
            DUP_CS  = (SELECT ISNULL(MAX(G.G_DUP),0) FROM #PURDOCGRP G WHERE G.PUR_CODE = L.PUR_CODE),
            GRP_BAD = (SELECT COUNT(*) FROM #PURDOCGRP G WHERE G.PUR_CODE = L.PUR_CODE AND ABS(G.G_C - G.G_S) > 1.00),
            LEDGERS = STUFF((SELECT ' | ' + L2.ACCTNAME + ' = ' + CONVERT(VARCHAR(20), L2.VAL)
                             FROM #PURDOCLINE L2 WHERE L2.PUR_CODE = L.PUR_CODE
                             ORDER BY L2.SIDE, L2.ACCTNAME FOR XML PATH(''), TYPE).value('.','NVARCHAR(MAX)'), 1, 3, '')
    INTO    #PURDOC
    FROM    #PURDOCLINE L
    GROUP BY L.PUR_CODE;

    /* ---- invoice and credit note: GST posted to the ledgers vs GST computed on the charge lines.
            Charges live in BOTH charge tables, so both are unioned.                            ---- */
    IF OBJECT_ID('TEMPDB..#OUTDOC') IS NOT NULL DROP TABLE #OUTDOC;
    SELECT  ENTRY_TYPE, DOCNO, DOCDT, PARTY,
            LED_C = SUM(LED_C), LED_S = SUM(LED_S), LED_I = SUM(LED_I),
            CMP_C = SUM(CMP_C), CMP_S = SUM(CMP_S), CMP_I = SUM(CMP_I)
    INTO    #OUTDOC
    FROM (
        SELECT ENTRY_TYPE='II', DOCNO=I.INV_NO, DOCDT=I.INV_DATE, PARTY=I.INV_CLIENT,
               LED_C = CASE WHEN L.SIDE='C' THEN Q.AMT ELSE 0 END,
               LED_S = CASE WHEN L.SIDE='S' THEN Q.AMT ELSE 0 END,
               LED_I = CASE WHEN L.SIDE='I' THEN Q.AMT ELSE 0 END,
               CMP_C = ISNULL(C.CGST_AMT,0), CMP_S = ISNULL(C.SGST_AMT,0), CMP_I = ISNULL(C.IGST_AMT,0)
        FROM   ACC_INVCHARGE C WITH(NOLOCK)
               INNER JOIN ACC_INVOICE I WITH(NOLOCK) ON I.INV_NO = C.INV_NO
               LEFT  JOIN #GSTLED L ON L.ACCTCODE = LTRIM(RTRIM(C.INV_ACCOUNT))
               CROSS APPLY (SELECT AMT = CASE WHEN ISNUMERIC(LTRIM(RTRIM(ISNULL(C.INV_INRAMT,'')))+'e0')=1
                                              THEN CONVERT(DECIMAL(18,2), C.INV_INRAMT) ELSE 0 END) Q
        WHERE  SUBSTRING(I.INV_DATE,7,4)+SUBSTRING(I.INV_DATE,4,2)+SUBSTRING(I.INV_DATE,1,2) BETWEEN @FROM AND @TO
               AND (@COMPANY = '' OR LTRIM(RTRIM(I.CMPCODE)) = @COMPANY)
        UNION ALL
        SELECT 'II', I.INV_NO, I.INV_DATE, I.INV_CLIENT,
               CASE WHEN L.SIDE='C' THEN Q.AMT ELSE 0 END,
               CASE WHEN L.SIDE='S' THEN Q.AMT ELSE 0 END,
               CASE WHEN L.SIDE='I' THEN Q.AMT ELSE 0 END,
               ISNULL(C.CGST_AMT,0), ISNULL(C.SGST_AMT,0), ISNULL(C.IGST_AMT,0)
        FROM   ACC_INVCHARGE1 C WITH(NOLOCK)
               INNER JOIN ACC_INVOICE I WITH(NOLOCK) ON I.INV_NO = C.INV_NO
               LEFT  JOIN #GSTLED L ON L.ACCTCODE = LTRIM(RTRIM(C.INV_ACCOUNT))
               CROSS APPLY (SELECT AMT = CASE WHEN ISNUMERIC(LTRIM(RTRIM(ISNULL(C.INV_INRAMT,'')))+'e0')=1
                                              THEN CONVERT(DECIMAL(18,2), C.INV_INRAMT) ELSE 0 END) Q
        WHERE  SUBSTRING(I.INV_DATE,7,4)+SUBSTRING(I.INV_DATE,4,2)+SUBSTRING(I.INV_DATE,1,2) BETWEEN @FROM AND @TO
               AND (@COMPANY = '' OR LTRIM(RTRIM(I.CMPCODE)) = @COMPANY)
        UNION ALL
        SELECT 'CN', N.CRT_NO, N.CRT_DATE, N.CRT_CLIENT,
               CASE WHEN L.SIDE='C' THEN Q.AMT ELSE 0 END,
               CASE WHEN L.SIDE='S' THEN Q.AMT ELSE 0 END,
               CASE WHEN L.SIDE='I' THEN Q.AMT ELSE 0 END,
               ISNULL(C.CGST_AMT,0), ISNULL(C.SGST_AMT,0), ISNULL(C.IGST_AMT,0)
        FROM   ACC_CRTCHARGE C WITH(NOLOCK)
               INNER JOIN ACC_CREDITNOTE N WITH(NOLOCK) ON N.CRT_NO = C.CRT_NO
               LEFT  JOIN #GSTLED L ON L.ACCTCODE = LTRIM(RTRIM(C.CRT_ACCOUNT))
               CROSS APPLY (SELECT AMT = CASE WHEN ISNUMERIC(LTRIM(RTRIM(ISNULL(C.CRT_INRAMT,'')))+'e0')=1
                                              THEN CONVERT(DECIMAL(18,2), C.CRT_INRAMT) ELSE 0 END) Q
        WHERE  SUBSTRING(N.CRT_DATE,7,4)+SUBSTRING(N.CRT_DATE,4,2)+SUBSTRING(N.CRT_DATE,1,2) BETWEEN @FROM AND @TO
               AND (@COMPANY = '' OR LTRIM(RTRIM(N.CMPCODE)) = @COMPANY)
        UNION ALL
        SELECT 'CN', N.CRT_NO, N.CRT_DATE, N.CRT_CLIENT,
               CASE WHEN L.SIDE='C' THEN Q.AMT ELSE 0 END,
               CASE WHEN L.SIDE='S' THEN Q.AMT ELSE 0 END,
               CASE WHEN L.SIDE='I' THEN Q.AMT ELSE 0 END,
               ISNULL(C.CGST_AMT,0), ISNULL(C.SGST_AMT,0), ISNULL(C.IGST_AMT,0)
        FROM   ACC_CRTCHARGE1 C WITH(NOLOCK)
               INNER JOIN ACC_CREDITNOTE N WITH(NOLOCK) ON N.CRT_NO = C.CRT_NO
               LEFT  JOIN #GSTLED L ON L.ACCTCODE = LTRIM(RTRIM(C.CRT_ACCOUNT))
               CROSS APPLY (SELECT AMT = CASE WHEN ISNUMERIC(LTRIM(RTRIM(ISNULL(C.CRT_INRAMT,'')))+'e0')=1
                                              THEN CONVERT(DECIMAL(18,2), C.CRT_INRAMT) ELSE 0 END) Q
        WHERE  SUBSTRING(N.CRT_DATE,7,4)+SUBSTRING(N.CRT_DATE,4,2)+SUBSTRING(N.CRT_DATE,1,2) BETWEEN @FROM AND @TO
               AND (@COMPANY = '' OR LTRIM(RTRIM(N.CMPCODE)) = @COMPANY)
    ) X
    GROUP BY ENTRY_TYPE, DOCNO, DOCDT, PARTY;

    SELECT ENTRY_TYPE, ENTRY_NO, ENTRY_DATE, BRANCH, PARTY, ISSUE, SEVERITY,
           CGST, SGST, IGST, DIFF, DETAIL, EDIT_URL
    FROM (
        /* ---------- PURCHASE : the wrong-ledger family ---------- */
        SELECT  ENTRY_TYPE = 'PI', ENTRY_NO = D.PUR_CODE, ENTRY_DATE = D.PUR_DATE,
                BRANCH = ISNULL(CT.CITYNAME, D.BRCODE),
                PARTY  = D.PUR_SUPPLIER + ISNULL(' - ' + SM.SUP_SNAME, ''),
                ISSUE  = CASE
                    WHEN D.DUP_CS >= 2 AND ABS(D.DOC_C - D.DOC_S) > 1.00 THEN 'SAME GST LEDGER SELECTED TWICE'
                    WHEN D.C_LINES > 0 AND D.S_LINES = 0 THEN 'SGST LINE MISSING'
                    WHEN D.S_LINES > 0 AND D.C_LINES = 0 THEN 'CGST LINE MISSING'
                    WHEN ABS(D.DOC_C - D.DOC_S) > 1.00
                         AND (ABS(D.DOC_C - 2*D.DOC_S) <= 0.02 OR ABS(D.DOC_S - 2*D.DOC_C) <= 0.02)
                         THEN 'ONE SIDE IS EXACTLY DOUBLE'
                    WHEN ABS(D.DOC_C - D.DOC_S) > 1.00 THEN 'CGST <> SGST AMOUNT'
                    WHEN D.GRP_BAD > 0 THEN 'CGST / SGST FROM DIFFERENT GST GROUPS'
                    ELSE NULL END,
                SEVERITY = CASE WHEN D.GRP_BAD > 0 AND ABS(D.DOC_C - D.DOC_S) <= 1.00 THEN 'MEDIUM' ELSE 'HIGH' END,
                CGST = D.DOC_C, SGST = D.DOC_S, IGST = D.DOC_I, DIFF = D.DOC_C - D.DOC_S,
                DETAIL = D.LEDGERS,
                EDIT_URL = 'FRM_ACC_TRAN_PURCHASE_IU.ASPX?STATUS=PI&PUR_CODE=' + D.PUR_CODE,
                SEQ = 1
        FROM    #PURDOC D
                LEFT JOIN SUPPLIER_MASTER SM WITH(NOLOCK) ON SM.SUP_CODE  = D.PUR_SUPPLIER
                LEFT JOIN CITY            CT WITH(NOLOCK) ON CT.CITYCODE1 = D.BRCODE

        UNION ALL
        /* ---------- INVOICE / CREDIT NOTE : ledgers vs computed tax ---------- */
        SELECT  O.ENTRY_TYPE, O.DOCNO, O.DOCDT,
                ISNULL(CT.CITYNAME, SUBSTRING(O.DOCNO,3,3)),
                O.PARTY + ISNULL(' - ' + EM.EXP_SNAME, ''),
                CASE WHEN ABS(O.LED_C-O.CMP_C) > 1.00 OR ABS(O.LED_S-O.CMP_S) > 1.00 OR ABS(O.LED_I-O.CMP_I) > 1.00
                     THEN 'GST LEDGER <> GST CALCULATED ON CHARGES'
                     WHEN ABS(O.CMP_C - O.CMP_S) > 1.00 THEN 'CGST <> SGST AMOUNT'
                     ELSE NULL END,
                'HIGH',
                O.CMP_C, O.CMP_S, O.CMP_I, O.CMP_C - O.CMP_S,
                'Ledger CGST/SGST/IGST = ' + CONVERT(VARCHAR(20),O.LED_C) + ' / ' + CONVERT(VARCHAR(20),O.LED_S)
                  + ' / ' + CONVERT(VARCHAR(20),O.LED_I)
                  + '   Calculated = ' + CONVERT(VARCHAR(20),O.CMP_C) + ' / ' + CONVERT(VARCHAR(20),O.CMP_S)
                  + ' / ' + CONVERT(VARCHAR(20),O.CMP_I),
                CASE O.ENTRY_TYPE WHEN 'II' THEN 'FRM_ACC_TRAN_INVOICE_VIEW.ASPX?INVOICENO=' + O.DOCNO
                                  ELSE 'FRM_ACC_TRAN_CREDITNOTE_VIEW.ASPX?CREDITNOTENO=' + O.DOCNO END,
                2
        FROM    #OUTDOC O
                LEFT JOIN EXP_MASTER EM WITH(NOLOCK) ON EM.EXP_CODE  = O.PARTY
                LEFT JOIN CITY       CT WITH(NOLOCK) ON CT.CITYCODE1 = SUBSTRING(O.DOCNO,3,3)

        UNION ALL
        /* ---------- JOURNAL VOUCHER and BANK / CASH ----------
           These post GST outside the GST screens, so they are worth checking - but only when the
           entry does not balance. A correctly keyed reverse-charge bank payment books the liability
           (TRANSPORT CHGS, on DEDUCTION) against the credit (REV Paid by us, on AMOUNT) and nets to
           nothing per side; flagging those was pure noise. Emitted per document, not per line.   */
        SELECT  X.ENTRY_TYPE, X.ENTRY_NO, X.ENTRY_DATE,
                ISNULL(CT.CITYNAME, SUBSTRING(X.ENTRY_NO,3,3)), X.LEDGERS,
                CASE WHEN X.ENTRY_TYPE = 'JV' THEN 'GST THROUGH JOURNAL VOUCHER DOES NOT BALANCE'
                     ELSE 'GST THROUGH BANK / CASH ENTRY DOES NOT BALANCE' END,
                'MEDIUM', X.NET_C, X.NET_S, X.NET_I, X.NET_C - X.NET_S,
                'Net CGST ' + CONVERT(VARCHAR(20), X.NET_C) + ' , net SGST ' + CONVERT(VARCHAR(20), X.NET_S)
                  + ' , net IGST ' + CONVERT(VARCHAR(20), X.NET_I),
                CASE WHEN X.ENTRY_TYPE = 'JV'
                     THEN 'FRM_ACC_TRAN_JOURNAL_VOUCHER_IU.ASPX?STATUS=JV&CODE=' + X.ENTRY_NO
                     ELSE 'FRM_ACC_TRAN_BRBPCRCP_PRINT.ASPX?ENTRYNO=' + X.ENTRY_NO END,
                3
        FROM (
            SELECT  ENTRY_TYPE, ENTRY_NO, ENTRY_DATE = MAX(ENTRY_DATE),
                    NET_C = SUM(CASE WHEN SIDE='C' THEN VAL ELSE 0 END),
                    NET_S = SUM(CASE WHEN SIDE='S' THEN VAL ELSE 0 END),
                    NET_I = SUM(CASE WHEN SIDE='I' THEN VAL ELSE 0 END),
                    LEDGERS = MAX(ACCTNAME)
            FROM (
                SELECT ENTRY_TYPE='JV', ENTRY_NO=D.JVCODE, ENTRY_DATE=H.JV_DATE, L.SIDE, L.ACCTNAME,
                       VAL = CONVERT(DECIMAL(18,2),CONVERT(FLOAT,ISNULL(D.JV_DEBIT,0)))
                           - CONVERT(DECIMAL(18,2),CONVERT(FLOAT,ISNULL(D.JV_CREDIT,0)))
                FROM   ACC_JOURNALVOUCDTLS D WITH(NOLOCK)
                       INNER JOIN ACC_JOURNALVOUC H WITH(NOLOCK) ON H.JVCODE = D.JVCODE
                       INNER JOIN #GSTLED L ON L.ACCTCODE = LTRIM(RTRIM(D.JV_ACCOUNT))
                WHERE  SUBSTRING(H.JV_DATE,7,4)+SUBSTRING(H.JV_DATE,4,2)+SUBSTRING(H.JV_DATE,1,2) BETWEEN @FROM AND @TO
                       AND (@COMPANY = '' OR LTRIM(RTRIM(H.CMPCODE)) = @COMPANY)
                UNION ALL
                SELECT '2'+H.STATUS, D.ENTRYNO, H.ENTRYDT, L.SIDE, L.ACCTNAME, V.DR - V.CR
                FROM   ACC_BANKDTLS D WITH(NOLOCK)
                       INNER JOIN ACC_BANK H WITH(NOLOCK) ON H.ENTRYNO = D.ENTRYNO
                       INNER JOIN #GSTLED L ON L.ACCTCODE = LTRIM(RTRIM(D.CLIENT))
                       CROSS APPLY (SELECT DR = CASE WHEN H.STATUS IN ('BP','CP','CE') THEN CONVERT(DECIMAL(18,2), CONVERT(FLOAT, ISNULL(D.AMOUNT,0)))
                                                     WHEN H.STATUS IN ('BR','CR')      THEN CONVERT(DECIMAL(18,2), CONVERT(FLOAT, ISNULL(D.DEDUCTION,0)))
                                                     ELSE 0 END,
                                           CR = CASE WHEN H.STATUS IN ('BP','CP')      THEN CONVERT(DECIMAL(18,2), CONVERT(FLOAT, ISNULL(D.DEDUCTION,0)))
                                                     WHEN H.STATUS IN ('BR','CR')      THEN CONVERT(DECIMAL(18,2), CONVERT(FLOAT, ISNULL(D.AMOUNT,0)))
                                                     ELSE 0 END) V
                WHERE  SUBSTRING(H.ENTRYDT,7,4)+SUBSTRING(H.ENTRYDT,4,2)+SUBSTRING(H.ENTRYDT,1,2) BETWEEN @FROM AND @TO
                       AND (@COMPANY = '' OR LTRIM(RTRIM(H.CMPCODE)) = @COMPANY)
            ) SRC
            GROUP BY ENTRY_TYPE, ENTRY_NO
            HAVING  ABS(SUM(CASE WHEN SIDE='C' THEN VAL ELSE 0 END)
                      - SUM(CASE WHEN SIDE='S' THEN VAL ELSE 0 END)) > 1.00
        ) X
        LEFT JOIN CITY CT WITH(NOLOCK) ON CT.CITYCODE1 = SUBSTRING(X.ENTRY_NO,3,3)

        UNION ALL
        /* ---------- PURCHASE : reverse charge that does not balance inside the document ----------
           On reverse charge the liability booked and the credit taken are the same figure, so a
           document where they differ is what makes the branch-level RCM row below move. Listing
           the document here is what lets the accounts team actually go and fix it.              */
        SELECT  'PI', R.PUR_CODE, R.PUR_DATE,
                ISNULL(CT.CITYNAME, R.BRCODE),
                R.PUR_SUPPLIER + ISNULL(' - ' + SM.SUP_SNAME, ''),
                'RCM ITC CLAIMED WITHOUT MATCHING RCM LIABILITY', 'HIGH',
                0, 0, 0, R.RCM_ITC - R.RCM_LIAB,
                'RCM ITC = ' + CONVERT(VARCHAR(20), R.RCM_ITC)
                  + ' , RCM liability booked = ' + CONVERT(VARCHAR(20), R.RCM_LIAB)
                  + ' , difference = ' + CONVERT(VARCHAR(20), R.RCM_ITC - R.RCM_LIAB),
                'FRM_ACC_TRAN_PURCHASE_IU.ASPX?STATUS=PI&PUR_CODE=' + R.PUR_CODE,
                2
        FROM (
            SELECT  PUR_CODE,
                    PUR_DATE     = MAX(PUR_DATE),
                    PUR_SUPPLIER = MAX(PUR_SUPPLIER),
                    BRCODE       = MAX(BRCODE),
                    /* VAL is Dr - Cr, so a liability sits negative: flip it to a magnitude */
                    RCM_ITC  = SUM(CASE WHEN NATURE = 'SETOFF'    AND IS_RCM = 1 THEN  VAL ELSE 0 END),
                    RCM_LIAB = SUM(CASE WHEN NATURE = 'LIABILITY' AND IS_RCM = 1 THEN -VAL ELSE 0 END)
            FROM    #PURDOCLINE
            GROUP BY PUR_CODE
            HAVING  ABS(SUM(CASE WHEN NATURE = 'SETOFF'    AND IS_RCM = 1 THEN  VAL ELSE 0 END)
                      - SUM(CASE WHEN NATURE = 'LIABILITY' AND IS_RCM = 1 THEN -VAL ELSE 0 END)) > 1.00
        ) R
        LEFT JOIN SUPPLIER_MASTER SM WITH(NOLOCK) ON SM.SUP_CODE  = R.PUR_SUPPLIER
        LEFT JOIN CITY            CT WITH(NOLOCK) ON CT.CITYCODE1 = R.BRCODE

        UNION ALL
        /* ---------- branch level : RCM liability vs RCM ITC (no single document to blame) ---------- */
        SELECT  'RCM', '', '',
                ISNULL(CT.CITYNAME, B.BRCODE), '',
                'RCM LIABILITY <> RCM ITC CLAIMED', 'HIGH',
                0, 0, 0, R.SETOFF_RCM - R.LIAB_RCM,
                'RCM liability = ' + CONVERT(VARCHAR(20), R.LIAB_RCM)
                  + ' , RCM ITC = ' + CONVERT(VARCHAR(20), R.SETOFF_RCM)
                  + ' , difference = ' + CONVERT(VARCHAR(20), R.SETOFF_RCM - R.LIAB_RCM)
                  + ' , RCM taxable base = ' + CONVERT(VARCHAR(20), ISNULL(PB.BASE_RCM,0)),
                '', 5
        FROM    #BR B
                CROSS APPLY (SELECT SETOFF_RCM = ISNULL((SELECT SUM(AMT) FROM #PURGST X WHERE X.BRCODE=B.BRCODE AND X.NATURE='SETOFF'    AND X.IS_RCM=1),0),
                                    LIAB_RCM   = ISNULL((SELECT SUM(AMT) FROM #PURGST X WHERE X.BRCODE=B.BRCODE AND X.NATURE='LIABILITY' AND X.IS_RCM=1),0)) R
                LEFT JOIN #PURBASE PB ON PB.BRCODE = B.BRCODE
                LEFT JOIN CITY CT WITH(NOLOCK) ON CT.CITYCODE1 = B.BRCODE
        WHERE   ABS(R.SETOFF_RCM - R.LIAB_RCM) > 1.00
    ) W
    WHERE   ISSUE IS NOT NULL
    ORDER BY SEQ,
             SUBSTRING(ENTRY_DATE,7,4)+SUBSTRING(ENTRY_DATE,4,2)+SUBSTRING(ENTRY_DATE,1,2),
             ENTRY_NO;

    /* ============================================================================================
       RESULT 5 : REVERSE-CHARGE ITC DEFERRED TO NEXT MONTH
       This period's RCM credit, kept OUT of the net position above. Carry these figures into the
       next month's return. The right-hand columns show what was brought in from last month, so
       the hand-over between months can be tied out.
       ============================================================================================ */
    SELECT
        BRANCH              = ISNULL(CT.CITYNAME, B.BRCODE),
        RCM_LIABILITY_PAID  = CUR.LIAB,
        DEFER_IGST          = CUR.I,
        DEFER_CGST          = CUR.C,
        DEFER_SGST          = CUR.S,
        DEFER_TOTAL         = CUR.I + CUR.C + CUR.S,
        AVAIL_IN_MONTH      = @NEXT_LABEL,
        BF_FROM_LAST_MONTH  = PRV.I + PRV.C + PRV.S,
        BF_MONTH            = @PREV_LABEL
    FROM        #BR B
    CROSS APPLY (SELECT I = ISNULL((SELECT SUM(AMT) FROM #PURGST X WHERE X.BRCODE=B.BRCODE AND X.NATURE='SETOFF' AND X.IS_RCM=1 AND X.SIDE='I'),0),
                        C = ISNULL((SELECT SUM(AMT) FROM #PURGST X WHERE X.BRCODE=B.BRCODE AND X.NATURE='SETOFF' AND X.IS_RCM=1 AND X.SIDE='C'),0),
                        S = ISNULL((SELECT SUM(AMT) FROM #PURGST X WHERE X.BRCODE=B.BRCODE AND X.NATURE='SETOFF' AND X.IS_RCM=1 AND X.SIDE='S'),0),
                        LIAB = ISNULL((SELECT SUM(AMT) FROM #PURGST X WHERE X.BRCODE=B.BRCODE AND X.NATURE='LIABILITY' AND X.IS_RCM=1),0)) CUR
    CROSS APPLY (SELECT I = ISNULL((SELECT SUM(AMT) FROM #PURGST_PREV X WHERE X.BRCODE=B.BRCODE AND X.SIDE='I'),0),
                        C = ISNULL((SELECT SUM(AMT) FROM #PURGST_PREV X WHERE X.BRCODE=B.BRCODE AND X.SIDE='C'),0),
                        S = ISNULL((SELECT SUM(AMT) FROM #PURGST_PREV X WHERE X.BRCODE=B.BRCODE AND X.SIDE='S'),0)) PRV
    LEFT JOIN   CITY CT WITH(NOLOCK) ON CT.CITYCODE1 = B.BRCODE
    WHERE       (CUR.I + CUR.C + CUR.S) <> 0 OR (PRV.I + PRV.C + PRV.S) <> 0
    ORDER BY    BRANCH;

END
GO

IF OBJECT_ID('dbo.USP_ACC_GSTR3B_FILING_SAVE') IS NOT NULL
    DROP PROCEDURE dbo.USP_ACC_GSTR3B_FILING_SAVE
GO
/* Archive a period as filed: the 3B figures, the ledger totals, and the full transaction-level
   GST ledger statement. Recomputed server-side so the archive is evidence, not a client echo. */
CREATE PROCEDURE [dbo].[USP_ACC_GSTR3B_FILING_SAVE]
    @FROMDATE VARCHAR(20),
    @TODATE   VARCHAR(20),
    @COMPANY  VARCHAR(2) = '',
    @FILEDBY  VARCHAR(50) = NULL,
    @REMARKS  VARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;



    SET NOCOUNT ON;




    /* ------------------------------------------------------------------------------------------ */

    DECLARE @FROM CHAR(8) = CONVERT(CHAR(8), CONVERT(DATETIME, @FROMDATE), 112);
    DECLARE @TO   CHAR(8) = CONVERT(CHAR(8), CONVERT(DATETIME, @TODATE),   112);

    /* ---------------------------------------------------------------------------------------------
       REVERSE-CHARGE CREDIT IS AVAILED ONE MONTH LATER  (finance policy)
       The RCM liability of a month is discharged in that month's return, and the matching credit
       is taken in the IMMEDIATELY FOLLOWING month's return. So for the period being reported:
           - this period's own RCM credit  -> DEFERRED, shown separately, NOT in the net position
           - the PREVIOUS month's RCM credit -> availed now, and IS in the net position
       Without the second half the net position would defer credit every month and never claim it.
       --------------------------------------------------------------------------------------------- */
    DECLARE @DT_FROM DATETIME = CONVERT(DATETIME, @FROMDATE);
    DECLARE @MSTART  DATETIME = DATEADD(MONTH, DATEDIFF(MONTH, 0, @DT_FROM), 0);  -- 1st of that month
    DECLARE @PREV_FROM  CHAR(8)     = CONVERT(CHAR(8), DATEADD(MONTH,-1,@MSTART), 112);
    DECLARE @PREV_TO    CHAR(8)     = CONVERT(CHAR(8), DATEADD(DAY,  -1,@MSTART), 112);
    DECLARE @PREV_LABEL VARCHAR(20) = UPPER(LEFT(DATENAME(MONTH, DATEADD(MONTH,-1,@MSTART)),3))
                                      + '-' + CONVERT(VARCHAR(4), YEAR(DATEADD(MONTH,-1,@MSTART)));
    DECLARE @NEXT_LABEL VARCHAR(20) = UPPER(LEFT(DATENAME(MONTH, DATEADD(MONTH, 1,@MSTART)),3))
                                      + '-' + CONVERT(VARCHAR(4), YEAR(DATEADD(MONTH, 1,@MSTART)));

    /* =================== 1. LIVE GST LEDGER MAP =============================================== */
    IF OBJECT_ID('TEMPDB..#GSTLED') IS NOT NULL DROP TABLE #GSTLED;
    SELECT  ACCTCODE = LTRIM(RTRIM(G.ACCTCODE)),
            ACCTNAME = G.ACCTNAME,
            NATURE   = CASE WHEN G.ACCTNAME LIKE '%Paid by us%' THEN 'SETOFF' ELSE 'LIABILITY' END,
            SIDE     = CASE WHEN G.ACCTNAME LIKE '%Integrated%' THEN 'I'
                            WHEN G.ACCTNAME LIKE '%Central%'    THEN 'C'
                            WHEN G.ACCTNAME LIKE '%State%'      THEN 'S' ELSE '?' END,
            IS_RCM   = CASE WHEN G.ACCTNAME LIKE '%REV %' OR G.ACCTNAME LIKE '%TRANSPORT CHGS%'
                            THEN 1 ELSE 0 END,
            /* family key: the ledger name with the side word removed, so the Central / State /
               Integrated members of one family collapse to the same value. Used by the
               document-level warnings to spot a CGST paired with an SGST of another family. */
            GSTGROUP = UPPER(LTRIM(RTRIM(REPLACE(REPLACE(REPLACE(REPLACE(
                            G.ACCTNAME,'Integrated',''),'Central',''),'State',''),'  ',' '))))
    INTO    #GSTLED
    FROM    GENACCT_MASTER G WITH(NOLOCK)
    WHERE   G.UNDERGROUP = 'M000034'
            AND G.ACCTNAME LIKE '%GST%'
            AND G.ACCTNAME NOT LIKE '%REFUND%'   -- GST REFUND RECD is not a tax head
            AND (G.ACCTNAME LIKE '%Central%' OR G.ACCTNAME LIKE '%State%' OR G.ACCTNAME LIKE '%Integrated%');

    /* =================== 2. OUTWARD : SALES INVOICE less CREDIT NOTE =========================== */
    IF OBJECT_ID('TEMPDB..#OUTWARD') IS NOT NULL DROP TABLE #OUTWARD;
    SELECT  BRCODE = SUBSTRING(DOCNO,3,3),
            TAXABLE = SUM(TAXABLE), IGST = SUM(IGST), CGST = SUM(CGST), SGST = SUM(SGST)
    INTO    #OUTWARD
    FROM (
        SELECT DOCNO = I.INV_NO, TAXABLE = ISNULL(C.TaxableAmtINR,0),
               IGST = ISNULL(C.IGST_AMT,0), CGST = ISNULL(C.CGST_AMT,0), SGST = ISNULL(C.SGST_AMT,0)
        FROM   ACC_INVCHARGE C WITH(NOLOCK) INNER JOIN ACC_INVOICE I WITH(NOLOCK) ON I.INV_NO = C.INV_NO
        WHERE  SUBSTRING(I.INV_DATE,7,4)+SUBSTRING(I.INV_DATE,4,2)+SUBSTRING(I.INV_DATE,1,2) BETWEEN @FROM AND @TO
               AND (@COMPANY = '' OR LTRIM(RTRIM(I.CMPCODE)) = @COMPANY)
        UNION ALL
        SELECT I.INV_NO, ISNULL(C.TaxableAmtINR,0),
               ISNULL(C.IGST_AMT,0), ISNULL(C.CGST_AMT,0), ISNULL(C.SGST_AMT,0)
        FROM   ACC_INVCHARGE1 C WITH(NOLOCK) INNER JOIN ACC_INVOICE I WITH(NOLOCK) ON I.INV_NO = C.INV_NO
        WHERE  SUBSTRING(I.INV_DATE,7,4)+SUBSTRING(I.INV_DATE,4,2)+SUBSTRING(I.INV_DATE,1,2) BETWEEN @FROM AND @TO
               AND (@COMPANY = '' OR LTRIM(RTRIM(I.CMPCODE)) = @COMPANY)
        UNION ALL   /* credit notes reduce outward liability */
        SELECT N.CRT_NO, -ISNULL(C.crt_TaxableAmtINR,0),
               -ISNULL(C.IGST_AMT,0), -ISNULL(C.CGST_AMT,0), -ISNULL(C.SGST_AMT,0)
        FROM   ACC_CRTCHARGE C WITH(NOLOCK) INNER JOIN ACC_CREDITNOTE N WITH(NOLOCK) ON N.CRT_NO = C.CRT_NO
        WHERE  SUBSTRING(N.CRT_DATE,7,4)+SUBSTRING(N.CRT_DATE,4,2)+SUBSTRING(N.CRT_DATE,1,2) BETWEEN @FROM AND @TO
               AND (@COMPANY = '' OR LTRIM(RTRIM(N.CMPCODE)) = @COMPANY)
        UNION ALL
        SELECT N.CRT_NO, -ISNULL(C.crt_TaxableAmtINR,0),
               -ISNULL(C.IGST_AMT,0), -ISNULL(C.CGST_AMT,0), -ISNULL(C.SGST_AMT,0)
        FROM   ACC_CRTCHARGE1 C WITH(NOLOCK) INNER JOIN ACC_CREDITNOTE N WITH(NOLOCK) ON N.CRT_NO = C.CRT_NO
        WHERE  SUBSTRING(N.CRT_DATE,7,4)+SUBSTRING(N.CRT_DATE,4,2)+SUBSTRING(N.CRT_DATE,1,2) BETWEEN @FROM AND @TO
               AND (@COMPANY = '' OR LTRIM(RTRIM(N.CMPCODE)) = @COMPANY)
    ) Q
    GROUP BY SUBSTRING(DOCNO,3,3);

    /* =================== 3. GST LEDGER AMOUNTS - PURCHASE, BANK/CASH AND JV ===================
       Dr / Cr convention, the same one the statement SP uses:
           purchase   PUR_AMOUNT = DEBIT, PUR_DEDUCTION = CREDIT
           bank/cash  payment (BP/CP/CE) = DEBIT, receipt (BR/CR) = CREDIT
           journal    JV_DEBIT / JV_CREDIT
           input credit ledgers "(Paid by us)" sit on the DEBIT side,
           reverse-charge liability, e.g. TRANSPORT CHGS, on the CREDIT side.
       A reverse-charge purchase books BOTH sides. Reading only the debit column makes every RCM
       liability line look like 0.00, so AMT is taken in the ledger's natural direction:
           SET-OFF = Dr - Cr , LIABILITY = Cr - Dr.

       BANK/CASH AND JV ARE INCLUDED (finance team decision, Aug-2026). GST keyed straight into a
       bank payment or a journal never touches a purchase or invoice line, so before this it was
       absent from the return entirely - 494.90 of input credit in Jul-2026 alone. Those entries
       are still listed on the warnings tab, because they bypass the GST calculation and are worth
       a look, but they now count towards the figures.
       ========================================================================================== */
    IF OBJECT_ID('TEMPDB..#GSTPOST') IS NOT NULL DROP TABLE #GSTPOST;
    SELECT  BRCODE, ACCTCODE, DR, CR
    INTO    #GSTPOST
    FROM (
        /* ---- purchase ---- */
        SELECT  BRCODE = SUBSTRING(P.PUR_CODE,3,3), ACCTCODE = LTRIM(RTRIM(D.PUR_ACCOUNT)),
                V.DR, V.CR
        FROM    ACC_PURCHASEDTLS D WITH(NOLOCK)
                INNER JOIN ACC_PURCHASE P WITH(NOLOCK) ON P.PUR_CODE = D.PUR_CODE
                /* strip tab/CR/LF - SQL 2008 LTRIM removes spaces only and one live PUR_DEDUCTION
                   value contains a TAB, which breaks a plain CONVERT.                           */
                CROSS APPLY (SELECT DRS = LTRIM(RTRIM(REPLACE(REPLACE(REPLACE(ISNULL(D.PUR_AMOUNT,''),   CHAR(9),''),CHAR(10),''),CHAR(13),''))),
                                    CRS = LTRIM(RTRIM(REPLACE(REPLACE(REPLACE(ISNULL(D.PUR_DEDUCTION,''),CHAR(9),''),CHAR(10),''),CHAR(13),'')))) T
                CROSS APPLY (SELECT DR = CASE WHEN T.DRS LIKE '%[0-9]%' AND T.DRS NOT LIKE '%[^0-9.-]%' AND LEN(T.DRS) < 16
                                              THEN CONVERT(DECIMAL(18,2), T.DRS) ELSE 0 END,
                                    CR = CASE WHEN T.CRS LIKE '%[0-9]%' AND T.CRS NOT LIKE '%[^0-9.-]%' AND LEN(T.CRS) < 16
                                              THEN CONVERT(DECIMAL(18,2), T.CRS) ELSE 0 END) V
        WHERE   SUBSTRING(P.PUR_DATE,7,4)+SUBSTRING(P.PUR_DATE,4,2)+SUBSTRING(P.PUR_DATE,1,2) BETWEEN @FROM AND @TO
                AND (@COMPANY = '' OR SUBSTRING(P.PUR_CODE,1,2) = @COMPANY)

        UNION ALL   /* ---- bank / cash ----
           ACC_BANKDTLS carries BOTH sides, exactly like purchase: AMOUNT and DEDUCTION. On a bank
           payment the reverse-charge liability (TRANSPORT CHGS) is keyed into DEDUCTION while the
           matching credit (REV Paid by us) is keyed into AMOUNT, so reading AMOUNT alone reports
           the liability as zero and invents an RCM mismatch. Dr/Cr per status below is the same
           convention USP_ACC_RPT_CLIENT_OUTSTANDING_ALLCITY_LIST uses.                          */
        SELECT  SUBSTRING(D.ENTRYNO,3,3), LTRIM(RTRIM(D.CLIENT)),
                DR = CASE WHEN H.STATUS IN ('BP','CP','CE') THEN CONVERT(DECIMAL(18,2), CONVERT(FLOAT, ISNULL(D.AMOUNT,0)))
                          WHEN H.STATUS IN ('BR','CR')      THEN CONVERT(DECIMAL(18,2), CONVERT(FLOAT, ISNULL(D.DEDUCTION,0)))
                          ELSE 0 END,
                CR = CASE WHEN H.STATUS IN ('BP','CP')      THEN CONVERT(DECIMAL(18,2), CONVERT(FLOAT, ISNULL(D.DEDUCTION,0)))
                          WHEN H.STATUS IN ('BR','CR')      THEN CONVERT(DECIMAL(18,2), CONVERT(FLOAT, ISNULL(D.AMOUNT,0)))
                          ELSE 0 END
        FROM    ACC_BANKDTLS D WITH(NOLOCK)
                INNER JOIN ACC_BANK H WITH(NOLOCK) ON H.ENTRYNO = D.ENTRYNO
        WHERE   SUBSTRING(H.ENTRYDT,7,4)+SUBSTRING(H.ENTRYDT,4,2)+SUBSTRING(H.ENTRYDT,1,2) BETWEEN @FROM AND @TO
                AND (@COMPANY = '' OR LTRIM(RTRIM(H.CMPCODE)) = @COMPANY)

        UNION ALL   /* ---- journal voucher ---- */
        SELECT  SUBSTRING(D.JVCODE,3,3), LTRIM(RTRIM(D.JV_ACCOUNT)),
                CONVERT(DECIMAL(18,2), CONVERT(FLOAT, ISNULL(D.JV_DEBIT,0))),
                CONVERT(DECIMAL(18,2), CONVERT(FLOAT, ISNULL(D.JV_CREDIT,0)))
        FROM    ACC_JOURNALVOUCDTLS D WITH(NOLOCK)
                INNER JOIN ACC_JOURNALVOUC H WITH(NOLOCK) ON H.JVCODE = D.JVCODE
        WHERE   SUBSTRING(H.JV_DATE,7,4)+SUBSTRING(H.JV_DATE,4,2)+SUBSTRING(H.JV_DATE,1,2) BETWEEN @FROM AND @TO
                AND (@COMPANY = '' OR LTRIM(RTRIM(H.CMPCODE)) = @COMPANY)
    ) SRC;

    IF OBJECT_ID('TEMPDB..#PURGST') IS NOT NULL DROP TABLE #PURGST;
    SELECT  P.BRCODE,
            L.NATURE, L.SIDE, L.IS_RCM, L.ACCTCODE, L.ACCTNAME,
            AMT = SUM(CASE WHEN L.NATURE = 'SETOFF' THEN P.DR - P.CR ELSE P.CR - P.DR END),
            DR  = SUM(P.DR),
            CR  = SUM(P.CR)
    INTO    #PURGST
    FROM    #GSTPOST P
            INNER JOIN #GSTLED L ON L.ACCTCODE = P.ACCTCODE
    GROUP BY P.BRCODE, L.NATURE, L.SIDE, L.IS_RCM, L.ACCTCODE, L.ACCTNAME;

    /* =================== 3b. PREVIOUS MONTH'S RCM CREDIT - availed in THIS return ==============
       Same rule and the same three sources as section 3, run over the previous calendar month and
       restricted to the reverse-charge input ledgers ("REV (Paid by us)").
       ========================================================================================== */
    IF OBJECT_ID('TEMPDB..#GSTPOST_PREV') IS NOT NULL DROP TABLE #GSTPOST_PREV;
    SELECT  BRCODE, ACCTCODE, DR, CR
    INTO    #GSTPOST_PREV
    FROM (
        SELECT  BRCODE = SUBSTRING(P.PUR_CODE,3,3), ACCTCODE = LTRIM(RTRIM(D.PUR_ACCOUNT)), V.DR, V.CR
        FROM    ACC_PURCHASEDTLS D WITH(NOLOCK)
                INNER JOIN ACC_PURCHASE P WITH(NOLOCK) ON P.PUR_CODE = D.PUR_CODE
                CROSS APPLY (SELECT DRS = LTRIM(RTRIM(REPLACE(REPLACE(REPLACE(ISNULL(D.PUR_AMOUNT,''),   CHAR(9),''),CHAR(10),''),CHAR(13),''))),
                                    CRS = LTRIM(RTRIM(REPLACE(REPLACE(REPLACE(ISNULL(D.PUR_DEDUCTION,''),CHAR(9),''),CHAR(10),''),CHAR(13),'')))) T
                CROSS APPLY (SELECT DR = CASE WHEN T.DRS LIKE '%[0-9]%' AND T.DRS NOT LIKE '%[^0-9.-]%' AND LEN(T.DRS) < 16
                                              THEN CONVERT(DECIMAL(18,2), T.DRS) ELSE 0 END,
                                    CR = CASE WHEN T.CRS LIKE '%[0-9]%' AND T.CRS NOT LIKE '%[^0-9.-]%' AND LEN(T.CRS) < 16
                                              THEN CONVERT(DECIMAL(18,2), T.CRS) ELSE 0 END) V
        WHERE   SUBSTRING(P.PUR_DATE,7,4)+SUBSTRING(P.PUR_DATE,4,2)+SUBSTRING(P.PUR_DATE,1,2) BETWEEN @PREV_FROM AND @PREV_TO
                AND (@COMPANY = '' OR SUBSTRING(P.PUR_CODE,1,2) = @COMPANY)
        UNION ALL
        SELECT  SUBSTRING(D.ENTRYNO,3,3), LTRIM(RTRIM(D.CLIENT)),
                CASE WHEN H.STATUS IN ('BP','CP','CE') THEN CONVERT(DECIMAL(18,2), CONVERT(FLOAT, ISNULL(D.AMOUNT,0))) ELSE 0 END,
                CASE WHEN H.STATUS IN ('BR','CR')      THEN CONVERT(DECIMAL(18,2), CONVERT(FLOAT, ISNULL(D.AMOUNT,0))) ELSE 0 END
        FROM    ACC_BANKDTLS D WITH(NOLOCK)
                INNER JOIN ACC_BANK H WITH(NOLOCK) ON H.ENTRYNO = D.ENTRYNO
        WHERE   SUBSTRING(H.ENTRYDT,7,4)+SUBSTRING(H.ENTRYDT,4,2)+SUBSTRING(H.ENTRYDT,1,2) BETWEEN @PREV_FROM AND @PREV_TO
                AND (@COMPANY = '' OR LTRIM(RTRIM(H.CMPCODE)) = @COMPANY)
        UNION ALL
        SELECT  SUBSTRING(D.JVCODE,3,3), LTRIM(RTRIM(D.JV_ACCOUNT)),
                CONVERT(DECIMAL(18,2), CONVERT(FLOAT, ISNULL(D.JV_DEBIT,0))),
                CONVERT(DECIMAL(18,2), CONVERT(FLOAT, ISNULL(D.JV_CREDIT,0)))
        FROM    ACC_JOURNALVOUCDTLS D WITH(NOLOCK)
                INNER JOIN ACC_JOURNALVOUC H WITH(NOLOCK) ON H.JVCODE = D.JVCODE
        WHERE   SUBSTRING(H.JV_DATE,7,4)+SUBSTRING(H.JV_DATE,4,2)+SUBSTRING(H.JV_DATE,1,2) BETWEEN @PREV_FROM AND @PREV_TO
                AND (@COMPANY = '' OR LTRIM(RTRIM(H.CMPCODE)) = @COMPANY)
    ) SRC;

    IF OBJECT_ID('TEMPDB..#PURGST_PREV') IS NOT NULL DROP TABLE #PURGST_PREV;
    SELECT  P.BRCODE, L.SIDE,
            AMT = SUM(P.DR - P.CR)
    INTO    #PURGST_PREV
    FROM    #GSTPOST_PREV P
            INNER JOIN #GSTLED L ON L.ACCTCODE = P.ACCTCODE
    WHERE   L.NATURE = 'SETOFF' AND L.IS_RCM = 1
    GROUP BY P.BRCODE, L.SIDE;

    /* =================== 4. PURCHASE : TAXABLE BASE BY FLAG =================================== */
    IF OBJECT_ID('TEMPDB..#PURBASE') IS NOT NULL DROP TABLE #PURBASE;
    SELECT  BRCODE = SUBSTRING(P.PUR_CODE,3,3),
            BASE_FWD = SUM(CASE WHEN LTRIM(RTRIM(ISNULL(D.PUR_TAXABLE,''))) = '1' THEN V.AMT ELSE 0 END),
            BASE_RCM = SUM(CASE WHEN LTRIM(RTRIM(ISNULL(D.PUR_TAXABLE,''))) = '2' THEN V.AMT ELSE 0 END)
    INTO    #PURBASE
    FROM    ACC_PURCHASEDTLS D WITH(NOLOCK)
            INNER JOIN ACC_PURCHASE P WITH(NOLOCK) ON P.PUR_CODE = D.PUR_CODE
            CROSS APPLY (SELECT DRS = LTRIM(RTRIM(REPLACE(REPLACE(REPLACE(ISNULL(D.PUR_AMOUNT,''),CHAR(9),''),CHAR(10),''),CHAR(13),'')))) T
            CROSS APPLY (SELECT AMT = CASE WHEN T.DRS LIKE '%[0-9]%' AND T.DRS NOT LIKE '%[^0-9.-]%' AND LEN(T.DRS) < 16
                                           THEN CONVERT(DECIMAL(18,2), T.DRS) ELSE 0 END) V
    WHERE   SUBSTRING(P.PUR_DATE,7,4)+SUBSTRING(P.PUR_DATE,4,2)+SUBSTRING(P.PUR_DATE,1,2) BETWEEN @FROM AND @TO
            AND (@COMPANY = '' OR SUBSTRING(P.PUR_CODE,1,2) = @COMPANY)
    GROUP BY SUBSTRING(P.PUR_CODE,3,3);

    /* =================== 5. ALL BRANCHES TOUCHED ============================================== */
    IF OBJECT_ID('TEMPDB..#BR') IS NOT NULL DROP TABLE #BR;
    SELECT DISTINCT BRCODE INTO #BR FROM (
        SELECT BRCODE FROM #OUTWARD UNION SELECT BRCODE FROM #PURGST UNION SELECT BRCODE FROM #PURBASE
        UNION SELECT BRCODE FROM #PURGST_PREV
    ) Q WHERE BRCODE IS NOT NULL;



    IF OBJECT_ID('TEMPDB..#STMT') IS NOT NULL DROP TABLE #STMT;
    CREATE TABLE #STMT (
        ENTRY_TYPE VARCHAR(5), ENTRY_NO VARCHAR(50), ENTRY_DATE VARCHAR(20),
        BRCODE VARCHAR(5), BRANCH NVARCHAR(50), ACCTCODE VARCHAR(10), LEDGER NVARCHAR(200),
        NATURE VARCHAR(10), DRAMT DECIMAL(18,2), CRAMT DECIMAL(18,2), LINES INT);
    INSERT INTO #STMT EXEC dbo.USP_ACC_GSTR3B_LEDGER_STMT @FROMDATE, @TODATE, @COMPANY;

    DECLARE @PERIOD_KEY CHAR(17) = @FROM + '-' + @TO;
    DECLARE @FILING_ID  INT;

    BEGIN TRY
        BEGIN TRANSACTION;

        /* re-filing a period supersedes the earlier archive but never deletes it, so the
           history of what was filed when is preserved */
        UPDATE dbo.TBL_ACCT_GSTR3B_FILING
        SET    ISACTIVE = 0
        WHERE  CMPCODE = @COMPANY AND PERIOD_KEY = @PERIOD_KEY AND ISACTIVE = 1;

        INSERT INTO dbo.TBL_ACCT_GSTR3B_FILING (CMPCODE, PERIOD_FROM, PERIOD_TO, PERIOD_KEY, FILED_BY, REMARKS)
        VALUES (@COMPANY, @FROMDATE, @TODATE, @PERIOD_KEY, @FILEDBY, @REMARKS);
        SET @FILING_ID = SCOPE_IDENTITY();

        INSERT INTO dbo.TBL_ACCT_GSTR3B_FILING_SUMMARY
              (FK_FILING_ID, BRANCH, BRCODE, SECTION, TAXABLE_VALUE, IGST, CGST, SGST, TOTAL_TAX)
        SELECT @FILING_ID,
    BRANCH        = ISNULL(CT.CITYNAME, B.BRCODE),
    BRCODE        = B.BRCODE,
    SECTION       = S.SECTION,
    TAXABLE_VALUE = S.TAXABLE,
    IGST          = S.IGST,
    CGST          = S.CGST,
    SGST          = S.SGST,
    TOTAL_TAX     = S.IGST + S.CGST + S.SGST
FROM        #BR B
CROSS APPLY (
    /* 3.1(a) outward supplies - liability */
    SELECT SECTION = '3.1(a) OUTWARD TAXABLE SUPPLIES  [LIABILITY]', SEQ = 1,
           TAXABLE = ISNULL(O.TAXABLE,0), IGST = ISNULL(O.IGST,0),
           CGST    = ISNULL(O.CGST,0),    SGST = ISNULL(O.SGST,0)
    FROM  (SELECT TOP 1 * FROM #OUTWARD O2 WHERE O2.BRCODE = B.BRCODE) O
    UNION ALL
    /* 3.1(d) inward supplies liable to reverse charge - liability */
    SELECT '3.1(d) INWARD SUPPLIES - REVERSE CHARGE  [LIABILITY]', 2,
           ISNULL((SELECT BASE_RCM FROM #PURBASE X WHERE X.BRCODE = B.BRCODE),0),
           ISNULL((SELECT SUM(AMT) FROM #PURGST X WHERE X.BRCODE=B.BRCODE AND X.NATURE='LIABILITY' AND X.SIDE='I'),0),
           ISNULL((SELECT SUM(AMT) FROM #PURGST X WHERE X.BRCODE=B.BRCODE AND X.NATURE='LIABILITY' AND X.SIDE='C'),0),
           ISNULL((SELECT SUM(AMT) FROM #PURGST X WHERE X.BRCODE=B.BRCODE AND X.NATURE='LIABILITY' AND X.SIDE='S'),0)
    UNION ALL
    /* 4(A)(3) ITC on reverse charge brought forward from LAST month - claimable in THIS return */
    SELECT '4(A)(3) ITC - REVERSE CHARGE B/F FROM ' + @PREV_LABEL + '  [SET-OFF]', 3, 0,
           ISNULL((SELECT SUM(AMT) FROM #PURGST_PREV X WHERE X.BRCODE=B.BRCODE AND X.SIDE='I'),0),
           ISNULL((SELECT SUM(AMT) FROM #PURGST_PREV X WHERE X.BRCODE=B.BRCODE AND X.SIDE='C'),0),
           ISNULL((SELECT SUM(AMT) FROM #PURGST_PREV X WHERE X.BRCODE=B.BRCODE AND X.SIDE='S'),0)
    UNION ALL
    /* 4(A)(5) all other ITC - set-off */
    SELECT '4(A)(5) ITC - ALL OTHER  [SET-OFF]', 4,
           ISNULL((SELECT BASE_FWD FROM #PURBASE X WHERE X.BRCODE = B.BRCODE),0),
           ISNULL((SELECT SUM(AMT) FROM #PURGST X WHERE X.BRCODE=B.BRCODE AND X.NATURE='SETOFF' AND X.IS_RCM=0 AND X.SIDE='I'),0),
           ISNULL((SELECT SUM(AMT) FROM #PURGST X WHERE X.BRCODE=B.BRCODE AND X.NATURE='SETOFF' AND X.IS_RCM=0 AND X.SIDE='C'),0),
           ISNULL((SELECT SUM(AMT) FROM #PURGST X WHERE X.BRCODE=B.BRCODE AND X.NATURE='SETOFF' AND X.IS_RCM=0 AND X.SIDE='S'),0)
    UNION ALL
    /* MEMO ONLY - this period's own RCM credit. Deliberately excluded from the net position;
       it becomes claimable in next month's return. See the RCM ITC Deferred result set.      */
    SELECT 'MEMO: RCM ITC OF THIS PERIOD - AVAIL IN ' + @NEXT_LABEL + '  [NOT IN NET POSITION]', 5, 0,
           ISNULL((SELECT SUM(AMT) FROM #PURGST X WHERE X.BRCODE=B.BRCODE AND X.NATURE='SETOFF' AND X.IS_RCM=1 AND X.SIDE='I'),0),
           ISNULL((SELECT SUM(AMT) FROM #PURGST X WHERE X.BRCODE=B.BRCODE AND X.NATURE='SETOFF' AND X.IS_RCM=1 AND X.SIDE='C'),0),
           ISNULL((SELECT SUM(AMT) FROM #PURGST X WHERE X.BRCODE=B.BRCODE AND X.NATURE='SETOFF' AND X.IS_RCM=1 AND X.SIDE='S'),0)
) S
LEFT JOIN CITY CT WITH(NOLOCK) ON CT.CITYCODE1 = B.BRCODE
WHERE   S.TAXABLE <> 0 OR S.IGST <> 0 OR S.CGST <> 0 OR S.SGST <> 0;

        INSERT INTO dbo.TBL_ACCT_GSTR3B_FILING_LEDGER
              (FK_FILING_ID, BRANCH, NATURE, RCM, ACCTCODE, LEDGER, AMOUNT)
        SELECT @FILING_ID,  BRANCH   = ISNULL(CT.CITYNAME, P.BRCODE),
        NATURE   = P.NATURE,
        RCM      = CASE WHEN P.IS_RCM = 1 THEN 'REVERSE CHARGE' ELSE 'NORMAL' END,
        ACCTCODE = P.ACCTCODE,
        LEDGER   = P.ACCTNAME,
        AMOUNT   = P.AMT
FROM        #PURGST P
LEFT JOIN   CITY CT WITH(NOLOCK) ON CT.CITYCODE1 = P.BRCODE
WHERE       P.AMT <> 0;

        INSERT INTO dbo.TBL_ACCT_GSTR3B_FILING_STMT
              (FK_FILING_ID, ENTRY_TYPE, ENTRY_NO, ENTRY_DATE, BRCODE, BRANCH, ACCTCODE, LEDGER, NATURE, DRAMT, CRAMT, LINES)
        SELECT @FILING_ID, ENTRY_TYPE, ENTRY_NO, ENTRY_DATE, BRCODE, BRANCH, ACCTCODE, LEDGER, NATURE, DRAMT, CRAMT, LINES FROM #STMT;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        DECLARE @MSG VARCHAR(2000) = ERROR_MESSAGE();
        RAISERROR(@MSG,16,1);
        RETURN;
    END CATCH

    SELECT FILING_ID    = @FILING_ID,
           PERIOD_FROM  = @FROMDATE,
           PERIOD_TO    = @TODATE,
           LEDGER_ROWS  = (SELECT COUNT(*) FROM dbo.TBL_ACCT_GSTR3B_FILING_LEDGER  WHERE FK_FILING_ID = @FILING_ID),
           SUMMARY_ROWS = (SELECT COUNT(*) FROM dbo.TBL_ACCT_GSTR3B_FILING_SUMMARY WHERE FK_FILING_ID = @FILING_ID),
           STMT_ROWS    = (SELECT COUNT(*) FROM dbo.TBL_ACCT_GSTR3B_FILING_STMT    WHERE FK_FILING_ID = @FILING_ID);
END
GO

IF OBJECT_ID('dbo.USP_ACC_GSTR3B_FILING_LIST') IS NOT NULL
    DROP PROCEDURE dbo.USP_ACC_GSTR3B_FILING_LIST
GO
CREATE PROCEDURE [dbo].[USP_ACC_GSTR3B_FILING_LIST]
    @COMPANY VARCHAR(2) = ''
AS
BEGIN
    SET NOCOUNT ON;
    SELECT  FILING_ID   = F.PK_ID,
            F.CMPCODE, F.PERIOD_FROM, F.PERIOD_TO,
            FILED_BY    = ISNULL(F.FILED_BY,''),
            FILED_ON    = CONVERT(VARCHAR(20), F.FILED_ON, 113),
            REMARKS     = ISNULL(F.REMARKS,''),
            STATUS      = CASE WHEN F.ISACTIVE = 1 THEN 'CURRENT' ELSE 'SUPERSEDED' END,
            LEDGER_ROWS = (SELECT COUNT(*) FROM dbo.TBL_ACCT_GSTR3B_FILING_LEDGER L WHERE L.FK_FILING_ID = F.PK_ID),
            STMT_ROWS   = (SELECT COUNT(*) FROM dbo.TBL_ACCT_GSTR3B_FILING_STMT  S WHERE S.FK_FILING_ID = F.PK_ID)
    FROM    dbo.TBL_ACCT_GSTR3B_FILING F
    WHERE   (@COMPANY = '' OR F.CMPCODE = @COMPANY)
    ORDER BY F.FILED_ON DESC;
END
GO

IF OBJECT_ID('dbo.USP_ACC_GSTR3B_FILING_VIEW') IS NOT NULL
    DROP PROCEDURE dbo.USP_ACC_GSTR3B_FILING_VIEW
GO
/* One filing beside live data.
   Result 1 = header with the counts that changed
   Result 2 = TRANSACTION-LEVEL statement, as filed vs as it stands now
   Result 3 = the 3B figures as filed
   Matching key is entry type + entry number + ledger, so a document edited after filing shows
   up as AMOUNT CHANGED, and one added or deleted shows up as such.                          */
CREATE PROCEDURE [dbo].[USP_ACC_GSTR3B_FILING_VIEW]
    @FILING_ID INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @FROMDATE VARCHAR(20), @TODATE VARCHAR(20), @COMPANY VARCHAR(2);
    SELECT  @FROMDATE = PERIOD_FROM, @TODATE = PERIOD_TO, @COMPANY = CMPCODE
    FROM    dbo.TBL_ACCT_GSTR3B_FILING WHERE PK_ID = @FILING_ID;

    IF @FROMDATE IS NULL
    BEGIN
        RAISERROR('Filing id not found.',16,1);
        RETURN;
    END

    IF OBJECT_ID('TEMPDB..#STMT') IS NOT NULL DROP TABLE #STMT;
    CREATE TABLE #STMT (
        ENTRY_TYPE VARCHAR(5), ENTRY_NO VARCHAR(50), ENTRY_DATE VARCHAR(20),
        BRCODE VARCHAR(5), BRANCH NVARCHAR(50), ACCTCODE VARCHAR(10), LEDGER NVARCHAR(200),
        NATURE VARCHAR(10), DRAMT DECIMAL(18,2), CRAMT DECIMAL(18,2), LINES INT);
    INSERT INTO #STMT EXEC dbo.USP_ACC_GSTR3B_LEDGER_STMT @FROMDATE, @TODATE, @COMPANY;

    IF OBJECT_ID('TEMPDB..#CMP') IS NOT NULL DROP TABLE #CMP;
    SELECT  ENTRY_TYPE   = ISNULL(A.ENTRY_TYPE, B.ENTRY_TYPE),
            ENTRY_NO     = ISNULL(A.ENTRY_NO,   B.ENTRY_NO),
            ENTRY_DATE   = ISNULL(A.ENTRY_DATE, B.ENTRY_DATE),
            BRANCH       = ISNULL(A.BRANCH,     B.BRANCH),
            ACCTCODE     = ISNULL(A.ACCTCODE,   B.ACCTCODE),
            LEDGER       = ISNULL(A.LEDGER,     B.LEDGER),
            NATURE       = ISNULL(A.NATURE,     B.NATURE),
            FILED_DR     = ISNULL(A.DRAMT,0), FILED_CR = ISNULL(A.CRAMT,0),
            LIVE_DR      = ISNULL(B.DRAMT,0), LIVE_CR  = ISNULL(B.CRAMT,0),
            DIFFERENCE   = (ISNULL(B.DRAMT,0) - ISNULL(B.CRAMT,0)) - (ISNULL(A.DRAMT,0) - ISNULL(A.CRAMT,0)),
            STATUS_      = CASE WHEN A.ENTRY_NO IS NULL THEN 'ADDED AFTER FILING'
                                WHEN B.ENTRY_NO IS NULL THEN 'DELETED AFTER FILING'
                                WHEN ABS(ISNULL(A.DRAMT,0)-ISNULL(B.DRAMT,0)) > 0.02
                                  OR ABS(ISNULL(A.CRAMT,0)-ISNULL(B.CRAMT,0)) > 0.02 THEN 'AMOUNT CHANGED'
                                ELSE 'UNCHANGED' END
    INTO    #CMP
    FROM   (SELECT * FROM dbo.TBL_ACCT_GSTR3B_FILING_STMT WHERE FK_FILING_ID = @FILING_ID) A
           FULL OUTER JOIN #STMT B
             ON  B.ENTRY_TYPE = A.ENTRY_TYPE
             AND B.ENTRY_NO   = A.ENTRY_NO
             AND B.ACCTCODE   = A.ACCTCODE;

    SELECT  FILING_ID    = F.PK_ID,
            F.CMPCODE, F.PERIOD_FROM, F.PERIOD_TO,
            FILED_BY     = ISNULL(F.FILED_BY,''),
            FILED_ON     = CONVERT(VARCHAR(20), F.FILED_ON, 113),
            REMARKS      = ISNULL(F.REMARKS,''),
            STATUS       = CASE WHEN F.ISACTIVE = 1 THEN 'CURRENT' ELSE 'SUPERSEDED' END,
            FILED_ROWS   = (SELECT COUNT(*) FROM dbo.TBL_ACCT_GSTR3B_FILING_STMT WHERE FK_FILING_ID = @FILING_ID),
            CHANGED_ROWS = (SELECT COUNT(*) FROM #CMP WHERE STATUS_ <> 'UNCHANGED'),
            ADDED_ROWS   = (SELECT COUNT(*) FROM #CMP WHERE STATUS_ = 'ADDED AFTER FILING'),
            DELETED_ROWS = (SELECT COUNT(*) FROM #CMP WHERE STATUS_ = 'DELETED AFTER FILING'),
            AMENDED_ROWS = (SELECT COUNT(*) FROM #CMP WHERE STATUS_ = 'AMOUNT CHANGED')
    FROM    dbo.TBL_ACCT_GSTR3B_FILING F
    WHERE   F.PK_ID = @FILING_ID;

    SELECT  ENTRY_TYPE, ENTRY_NO, ENTRY_DATE, BRANCH, ACCTCODE, LEDGER, NATURE,
            FILED_DR, FILED_CR, LIVE_DR, LIVE_CR, DIFFERENCE, STATUS = STATUS_
    FROM    #CMP
    ORDER BY CASE STATUS_ WHEN 'UNCHANGED' THEN 2 ELSE 1 END,   -- differences first
             BRANCH, LEDGER,
             SUBSTRING(ENTRY_DATE,7,4)+SUBSTRING(ENTRY_DATE,4,2)+SUBSTRING(ENTRY_DATE,1,2),
             ENTRY_NO;

    SELECT  BRANCH, SECTION, TAXABLE_VALUE, IGST, CGST, SGST, TOTAL_TAX
    FROM    dbo.TBL_ACCT_GSTR3B_FILING_SUMMARY
    WHERE   FK_FILING_ID = @FILING_ID
    ORDER BY BRANCH, SECTION;
END
GO
