-- Apply
-- NEW proc USP_ACC_BANKRECONCIL_UPDATECLEARANCEDT_V2 for Links (port of the Manilal V2 matching engine).
-- The original USP_ACC_BANKRECONCIL_UPDATECLEARANCEDT is NOT touched; the API endpoint
-- Accounts/UploadBnkReconcilFileV2 runs this one, UploadBnkReconcilFile still runs the original.
--
-- Differences from the Manilal V2 script (Links bank statement formats differ):
--   * Reference extraction branches = Manilal's full set (IMPS|, UPI, NEFT RETURN, CASH WITHDRAWAL, international transfer
--     pipe@17 and 'IT' prefix, pipe@5, pipe@3, other pipe, no pipe), same as USP_ACC_BANKRECONCIL_UPDATECLEARANCEDT in Links now.
--   * Keeps the Links IDFC .xls UTR extraction (NEFT / NEFTIN / RTGS / IMPS-...-UTR#) added in BANKRECONCIL_TRUNCATE_FIX_20261001.
--   * Keeps the Links fallback: ledger entries with a blank / '.' bank ref are matched on amount + direction + date (+/-7 days),
--     only when the pair is unique both ways.
--   * All reference values are cut with LEFT(..,50) so descriptions of ~190 chars cannot raise "string or binary data would be truncated".
--
-- Why V2: the original derives the ledger search window from @FROMDT, which the upload page sent as the logged-in
-- financial year start, so back-period statements never matched. V2 derives the window from the dates inside the file.
--
-- Result sets: 1 = reconciled, 2 = unreconciled. Ledger clearance date column is LCLEARANCEDT (statement side is CLEARANCEDT).
-- Target SQL Server 2008 R2: no TRY_CONVERT / TRY_CAST / TRY_PARSE.
USE [LinksDB20_20260930]
GO

IF OBJECT_ID('dbo.USP_ACC_BANKRECONCIL_UPDATECLEARANCEDT_V2', 'P') IS NOT NULL
    DROP PROCEDURE dbo.USP_ACC_BANKRECONCIL_UPDATECLEARANCEDT_V2;
GO

CREATE PROCEDURE [dbo].[USP_ACC_BANKRECONCIL_UPDATECLEARANCEDT_V2]
    @OURBANK        VARCHAR(7),
    @FROMDT         VARCHAR(20),
    @TODT           VARCHAR(20),
    @FK_LOGID       INT,
    @LOOKBACKYEARS  INT = 2,     -- how far before the statement to search the ledger
    @DEBUG          BIT = 0      -- 1 = dump intermediate temp tables
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @USERASONDT  VARCHAR(8),   -- As On Date picked on the page
            @PAGEFROM    VARCHAR(8),   -- @FROMDT as sent by the page; DIAGNOSTIC ONLY
            @STMTFROM    VARCHAR(8),   -- earliest date inside the uploaded statement
            @STMTTO      VARCHAR(8),   -- latest date inside the uploaded statement
            @SEARCHFROM  VARCHAR(8),   -- @STMTFROM minus @LOOKBACKYEARS
            @LISTTO      VARCHAR(8),   -- cutoff for the pending-ledger listing
            @LEDGERTO    VARCHAR(8);   -- latest ledger ENTRYDT considered (statement end + look-ahead)

    ------------------------------------------------------------------------
    -- 0. Parameter validation
    ------------------------------------------------------------------------
    SELECT @PAGEFROM    = DBO.CONVERTDATE_YYYYMMDD(@FROMDT),
           @USERASONDT  = DBO.CONVERTDATE_YYYYMMDD(@TODT);

    IF @USERASONDT IS NULL
    BEGIN
        RAISERROR('USP_ACC_BANKRECONCIL_UPDATECLEARANCEDT_V2: @TODT (''%s'') is not a valid dd/MM/yyyy date.', 16, 1, @TODT);
        RETURN;
    END

    IF @OURBANK IS NULL OR LTRIM(RTRIM(@OURBANK)) = ''
    BEGIN
        RAISERROR('USP_ACC_BANKRECONCIL_UPDATECLEARANCEDT_V2: @OURBANK is required.', 16, 1);
        RETURN;
    END

    IF @LOOKBACKYEARS IS NULL OR @LOOKBACKYEARS < 0
        SET @LOOKBACKYEARS = 2;

    ------------------------------------------------------------------------
    -- 1. Staging tables
    ------------------------------------------------------------------------
    IF OBJECT_ID('TEMPDB..#TMPRAW')              IS NOT NULL DROP TABLE #TMPRAW;
    IF OBJECT_ID('TEMPDB..#TMPBANKRECONCILSTMT') IS NOT NULL DROP TABLE #TMPBANKRECONCILSTMT;
    IF OBJECT_ID('TEMPDB..#TMPINWARD')           IS NOT NULL DROP TABLE #TMPINWARD;
    IF OBJECT_ID('TEMPDB..#LEDGER')              IS NOT NULL DROP TABLE #LEDGER;
    IF OBJECT_ID('TEMPDB..#LBLANK')              IS NOT NULL DROP TABLE #LBLANK;
    IF OBJECT_ID('TEMPDB..#FBPAIRS')             IS NOT NULL DROP TABLE #FBPAIRS;

    CREATE TABLE #TMPRAW (
        ID               INT,
        PRIORITY         TINYINT,        -- lower = more specific branch
        CLEARANCEDT      VARCHAR(20),
        BTRANSACTION     VARCHAR(500),
        BEFOREPIPE       VARCHAR(200),
        BEFOREFIRSTSPACE VARCHAR(200),
        DEPOSIT          DECIMAL(18, 2),
        WITHDRAWAL       DECIMAL(18, 2),
        TRANSTYPE        VARCHAR(2),
        BANKREFNO        VARCHAR(50)
    );

    CREATE TABLE #TMPBANKRECONCILSTMT (
        ID               INT PRIMARY KEY,
        CLEARANCEDT      VARCHAR(20),
        STMTYMD          VARCHAR(8),     -- CLEARANCEDT normalised to yyyymmdd
        BTRANSACTION     VARCHAR(500),
        BEFOREPIPE       VARCHAR(200),
        BEFOREFIRSTSPACE VARCHAR(200),
        DEPOSIT          DECIMAL(18, 2),
        WITHDRAWAL       DECIMAL(18, 2),
        TRANSTYPE        VARCHAR(2),
        BANKREFNO        VARCHAR(50)
    );

    CREATE TABLE #TMPINWARD (
        ID          INT,
        BANKREFNO   VARCHAR(50)
    );

    ------------------------------------------------------------------------
    -- 2. Promote the uploaded rows from the TMP table (unchanged behaviour)
    ------------------------------------------------------------------------
    IF NOT EXISTS (SELECT 1 FROM ACC_BANKRECONCIL_UPLOADSTATEMENT WHERE FK_LOGID = @FK_LOGID)
    BEGIN
        INSERT INTO ACC_BANKRECONCIL_UPLOADSTATEMENT
            (FK_LOGID, [DATE], BTRANSACTION, CURRENCY, DEPOSIT, WITHDRAWAL,
             RUNNINGBAL, UPLOADEDBY, UPLOADEDDATE, OURBANK)
        SELECT FK_LOGID, [DATE], BTRANSACTION, CURRENCY, DEPOSIT, WITHDRAWAL,
               RUNNINGBAL, UPLOADEDBY, UPLOADEDDATE, @OURBANK
        FROM   ACC_BANKRECONCIL_UPLOADSTATEMENT_TMP
        WHERE  FK_LOGID = @FK_LOGID;
    END

    -- Clear prior match results so a re-run for the same log is clean.
    UPDATE ACC_BANKRECONCIL_UPLOADSTATEMENT
    SET    ENTRYNO       = NULL,
           ENTRYDT       = NULL,
           ENTRYTYPE     = NULL,
           USERBANKREFNO = NULL,
           LCLEARNCEDT   = NULL,
           LAMOUNT       = NULL,
           LDEDUCTION    = NULL
    WHERE  FK_LOGID = @FK_LOGID;

    ------------------------------------------------------------------------
    -- 3. Extract the bank reference number from the narration.
    --    Same branches as the Links original; every extraction is guarded
    --    against a negative SUBSTRING length.
    ------------------------------------------------------------------------

    /* P1 -- IMPS: 12 characters after "IMPS|" */
    INSERT INTO #TMPRAW (ID, PRIORITY, CLEARANCEDT, BTRANSACTION, BEFOREPIPE, BEFOREFIRSTSPACE, DEPOSIT, WITHDRAWAL, TRANSTYPE, BANKREFNO)
    SELECT S.PK_ID, 1, LTRIM(RTRIM(S.[DATE])), S.BTRANSACTION,
           LEFT(S.BTRANSACTION, P.PIPE - 1),
           SUBSTRING(S.BTRANSACTION, P.PIPE + 1, 12),
           S.DEPOSIT, S.WITHDRAWAL,
           CASE WHEN S.DEPOSIT <> 0.00 THEN 'BR' ELSE 'BP' END, ''
    FROM   ACC_BANKRECONCIL_UPLOADSTATEMENT S
           CROSS APPLY (SELECT PIPE = CHARINDEX('|', S.BTRANSACTION)) P
    WHERE  S.FK_LOGID = @FK_LOGID
           AND S.BTRANSACTION LIKE 'IMPS|%'
           AND P.PIPE > 1;

    /* P2 -- UPI: value between the 1st and 2nd '/' */
    INSERT INTO #TMPRAW (ID, PRIORITY, CLEARANCEDT, BTRANSACTION, BEFOREPIPE, BEFOREFIRSTSPACE, DEPOSIT, WITHDRAWAL, TRANSTYPE, BANKREFNO)
    SELECT S.PK_ID, 2, LTRIM(RTRIM(S.[DATE])), S.BTRANSACTION,
           LEFT(S.BTRANSACTION, P.SL1 - 1),
           CASE WHEN P.SL2 > P.SL1 THEN SUBSTRING(S.BTRANSACTION, P.SL1 + 1, P.SL2 - P.SL1 - 1)
                ELSE SUBSTRING(S.BTRANSACTION, P.SL1 + 1, 50)
           END,
           S.DEPOSIT, S.WITHDRAWAL,
           CASE WHEN S.DEPOSIT <> 0.00 THEN 'BR' ELSE 'BP' END, ''
    FROM   ACC_BANKRECONCIL_UPLOADSTATEMENT S
           CROSS APPLY (SELECT SL1 = CHARINDEX('/', S.BTRANSACTION)) A
           CROSS APPLY (SELECT SL1 = A.SL1,
                               SL2 = CASE WHEN A.SL1 > 0
                                          THEN CHARINDEX('/', S.BTRANSACTION, A.SL1 + 2) ELSE 0 END) P
    WHERE  S.FK_LOGID = @FK_LOGID
           AND S.BTRANSACTION LIKE 'UPI%'
           AND P.SL1 > 1;

    /* P3 -- NEFT RETURN: pipe at position 12 (branch carried over from the Manilal procedure) */
    INSERT INTO #TMPRAW (ID, PRIORITY, CLEARANCEDT, BTRANSACTION, BEFOREPIPE, BEFOREFIRSTSPACE, DEPOSIT, WITHDRAWAL, TRANSTYPE, BANKREFNO)
    SELECT S.PK_ID, 3, LTRIM(RTRIM(S.[DATE])), S.BTRANSACTION,
           LEFT(S.BTRANSACTION, P.PIPE - 1),
           CASE WHEN P.SPC > P.PIPE THEN SUBSTRING(S.BTRANSACTION, P.PIPE + 1, P.SPC - P.PIPE - 1)
                ELSE SUBSTRING(S.BTRANSACTION, P.PIPE + 1, 50)
           END,
           S.DEPOSIT, S.WITHDRAWAL,
           CASE WHEN S.DEPOSIT <> 0.00 THEN 'BR' ELSE 'BP' END, ''
    FROM   ACC_BANKRECONCIL_UPLOADSTATEMENT S
           CROSS APPLY (SELECT PIPE = CHARINDEX('|', S.BTRANSACTION)) A
           CROSS APPLY (SELECT PIPE = A.PIPE,
                               SPC  = CASE WHEN A.PIPE > 0
                                           THEN CHARINDEX(' ', S.BTRANSACTION, A.PIPE + 1) ELSE 0 END) P
    WHERE  S.FK_LOGID = @FK_LOGID
           AND S.BTRANSACTION LIKE 'NEFT RETURN%'
           AND CHARINDEX('|', S.BTRANSACTION, 12) = 12;

    /* P4 -- CASH WITHDRAWAL: reference = last 6 characters (Manilal branch) */
    INSERT INTO #TMPRAW (ID, PRIORITY, CLEARANCEDT, BTRANSACTION, BEFOREPIPE, BEFOREFIRSTSPACE, DEPOSIT, WITHDRAWAL, TRANSTYPE, BANKREFNO)
    SELECT S.PK_ID, 4, LTRIM(RTRIM(S.[DATE])), S.BTRANSACTION,
           SUBSTRING(S.BTRANSACTION, 1, 4),
           RIGHT(S.BTRANSACTION, 6),
           S.DEPOSIT, S.WITHDRAWAL,
           CASE WHEN S.DEPOSIT <> 0.00 THEN 'BR' ELSE 'BP' END, ''
    FROM   ACC_BANKRECONCIL_UPLOADSTATEMENT S
    WHERE  S.FK_LOGID = @FK_LOGID
           AND S.BTRANSACTION LIKE 'CASH WITHDRAWAL%'
           AND LEN(S.BTRANSACTION) >= 6;

    /* P5 -- International transfer: pipe at position 17, reference = text BEFORE the pipe (Manilal branch) */
    INSERT INTO #TMPRAW (ID, PRIORITY, CLEARANCEDT, BTRANSACTION, BEFOREPIPE, BEFOREFIRSTSPACE, DEPOSIT, WITHDRAWAL, TRANSTYPE, BANKREFNO)
    SELECT S.PK_ID, 5, LTRIM(RTRIM(S.[DATE])), S.BTRANSACTION,
           SUBSTRING(S.BTRANSACTION, 1, 2),
           LEFT(S.BTRANSACTION, 16),
           S.DEPOSIT, S.WITHDRAWAL,
           CASE WHEN S.DEPOSIT <> 0.00 THEN 'BR' ELSE 'BP' END, ''
    FROM   ACC_BANKRECONCIL_UPLOADSTATEMENT S
    WHERE  S.FK_LOGID = @FK_LOGID
           AND CHARINDEX('|', S.BTRANSACTION, 17) = 17
           AND S.BTRANSACTION NOT LIKE 'NEFT RETURN%';

    /* P6 -- International transfer variant: "IT" prefix, space at position 17 (Manilal branch) */
    INSERT INTO #TMPRAW (ID, PRIORITY, CLEARANCEDT, BTRANSACTION, BEFOREPIPE, BEFOREFIRSTSPACE, DEPOSIT, WITHDRAWAL, TRANSTYPE, BANKREFNO)
    SELECT S.PK_ID, 6, LTRIM(RTRIM(S.[DATE])), S.BTRANSACTION,
           SUBSTRING(S.BTRANSACTION, 1, 2),
           LEFT(S.BTRANSACTION, 16),
           S.DEPOSIT, S.WITHDRAWAL,
           CASE WHEN S.DEPOSIT <> 0.00 THEN 'BR' ELSE 'BP' END, ''
    FROM   ACC_BANKRECONCIL_UPLOADSTATEMENT S
    WHERE  S.FK_LOGID = @FK_LOGID
           AND CHARINDEX(' ', S.BTRANSACTION, 17) = 17
           AND SUBSTRING(S.BTRANSACTION, 1, 2) = 'IT'
           AND S.BTRANSACTION NOT LIKE 'NEFT RETURN%';

    /* P7 -- NEFT / RTGS: pipe at position 5, ref number up to the first space */
    INSERT INTO #TMPRAW (ID, PRIORITY, CLEARANCEDT, BTRANSACTION, BEFOREPIPE, BEFOREFIRSTSPACE, DEPOSIT, WITHDRAWAL, TRANSTYPE, BANKREFNO)
    SELECT S.PK_ID, 7, LTRIM(RTRIM(S.[DATE])), S.BTRANSACTION,
           LEFT(S.BTRANSACTION, P.PIPE - 1),
           CASE WHEN P.SPC > P.PIPE THEN SUBSTRING(S.BTRANSACTION, P.PIPE + 1, P.SPC - P.PIPE - 1)
                ELSE SUBSTRING(S.BTRANSACTION, P.PIPE + 1, 50)
           END,
           S.DEPOSIT, S.WITHDRAWAL,
           CASE WHEN S.DEPOSIT <> 0.00 THEN 'BR' ELSE 'BP' END, ''
    FROM   ACC_BANKRECONCIL_UPLOADSTATEMENT S
           CROSS APPLY (SELECT PIPE = CHARINDEX('|', S.BTRANSACTION)) A
           CROSS APPLY (SELECT PIPE = A.PIPE,
                               SPC  = CASE WHEN A.PIPE > 0
                                           THEN CHARINDEX(' ', S.BTRANSACTION, A.PIPE + 1) ELSE 0 END) P
    WHERE  S.FK_LOGID = @FK_LOGID
           AND CHARINDEX('|', S.BTRANSACTION, 5) = 5
           AND S.BTRANSACTION NOT LIKE 'IMPS|%';

    /* P8 -- Bank transfer: pipe at position 3, ref number up to the first space */
    INSERT INTO #TMPRAW (ID, PRIORITY, CLEARANCEDT, BTRANSACTION, BEFOREPIPE, BEFOREFIRSTSPACE, DEPOSIT, WITHDRAWAL, TRANSTYPE, BANKREFNO)
    SELECT S.PK_ID, 8, LTRIM(RTRIM(S.[DATE])), S.BTRANSACTION,
           LEFT(S.BTRANSACTION, P.PIPE - 1),
           CASE WHEN P.SPC > P.PIPE THEN SUBSTRING(S.BTRANSACTION, P.PIPE + 1, P.SPC - P.PIPE - 1)
                ELSE SUBSTRING(S.BTRANSACTION, P.PIPE + 1, 50)
           END,
           S.DEPOSIT, S.WITHDRAWAL,
           CASE WHEN S.DEPOSIT <> 0.00 THEN 'BR' ELSE 'BP' END, ''
    FROM   ACC_BANKRECONCIL_UPLOADSTATEMENT S
           CROSS APPLY (SELECT PIPE = CHARINDEX('|', S.BTRANSACTION)) A
           CROSS APPLY (SELECT PIPE = A.PIPE,
                               SPC  = CASE WHEN A.PIPE > 0
                                           THEN CHARINDEX(' ', S.BTRANSACTION, A.PIPE + 1) ELSE 0 END) P
    WHERE  S.FK_LOGID = @FK_LOGID
           AND CHARINDEX('|', S.BTRANSACTION, 3) = 3;

    /* P9 -- pipe present but not at 3 / 5 / 17: fall back to the first token */
    INSERT INTO #TMPRAW (ID, PRIORITY, CLEARANCEDT, BTRANSACTION, BEFOREPIPE, BEFOREFIRSTSPACE, DEPOSIT, WITHDRAWAL, TRANSTYPE, BANKREFNO)
    SELECT S.PK_ID, 9, LTRIM(RTRIM(S.[DATE])), S.BTRANSACTION,
           '',
           LEFT(S.BTRANSACTION, CHARINDEX(' ', S.BTRANSACTION + ' ') - 1),
           S.DEPOSIT, S.WITHDRAWAL,
           CASE WHEN S.DEPOSIT <> 0.00 THEN 'BR' ELSE 'BP' END, ''
    FROM   ACC_BANKRECONCIL_UPLOADSTATEMENT S
    WHERE  S.FK_LOGID = @FK_LOGID
           AND CHARINDEX('|', S.BTRANSACTION) > 0
           AND CHARINDEX('|', S.BTRANSACTION) NOT IN (3, 5, 17);

    /* P10 -- no pipe at all (and not UPI, handled by P2): first token.
              This is where the new IDFC .xls rows land; their UTR is applied below. */
    INSERT INTO #TMPRAW (ID, PRIORITY, CLEARANCEDT, BTRANSACTION, BEFOREPIPE, BEFOREFIRSTSPACE, DEPOSIT, WITHDRAWAL, TRANSTYPE, BANKREFNO)
    SELECT S.PK_ID, 10, LTRIM(RTRIM(S.[DATE])), S.BTRANSACTION,
           '',
           LEFT(S.BTRANSACTION, CHARINDEX(' ', S.BTRANSACTION + ' ') - 1),
           S.DEPOSIT, S.WITHDRAWAL,
           CASE WHEN S.DEPOSIT <> 0.00 THEN 'BR' ELSE 'BP' END, ''
    FROM   ACC_BANKRECONCIL_UPLOADSTATEMENT S
    WHERE  S.FK_LOGID = @FK_LOGID
           AND CHARINDEX('|', S.BTRANSACTION) = 0
           AND S.BTRANSACTION NOT LIKE 'UPI%';

    ------------------------------------------------------------------------
    -- 4. Collapse to one row per statement line (lowest PRIORITY wins) and
    --    normalise the statement date to yyyymmdd. dd/MM/yyyy is shape-checked
    --    with LIKE, flipped, then validated with ISDATE() (ISDATE on the raw
    --    dd/MM/yyyy string is unreliable under the default us_english format).
    ------------------------------------------------------------------------
    INSERT INTO #TMPBANKRECONCILSTMT
        (ID, CLEARANCEDT, STMTYMD, BTRANSACTION, BEFOREPIPE, BEFOREFIRSTSPACE, DEPOSIT, WITHDRAWAL, TRANSTYPE, BANKREFNO)
    SELECT X.ID, X.CLEARANCEDT, D.YMD, X.BTRANSACTION, X.BEFOREPIPE, X.BEFOREFIRSTSPACE,
           X.DEPOSIT, X.WITHDRAWAL, X.TRANSTYPE, X.BANKREFNO
    FROM   (SELECT *, RN = ROW_NUMBER() OVER (PARTITION BY ID ORDER BY PRIORITY) FROM #TMPRAW) X
           CROSS APPLY (SELECT V = LTRIM(RTRIM(ISNULL(X.CLEARANCEDT, '')))) R
           CROSS APPLY (SELECT YMD = CASE
                            WHEN R.V LIKE '[0-9][0-9]/[0-9][0-9]/[0-9][0-9][0-9][0-9]'
                                 AND ISDATE(SUBSTRING(R.V, 7, 4) + SUBSTRING(R.V, 4, 2) + SUBSTRING(R.V, 1, 2)) = 1
                            THEN SUBSTRING(R.V, 7, 4) + SUBSTRING(R.V, 4, 2) + SUBSTRING(R.V, 1, 2)
                            ELSE NULL END) D
    WHERE  X.RN = 1;

    -- Default ref number = the extracted token (cut to the column width)
    UPDATE #TMPBANKRECONCILSTMT
    SET    BANKREFNO = LEFT(LTRIM(RTRIM(BEFOREFIRSTSPACE)), 50)
    WHERE  ISNULL(BEFOREFIRSTSPACE, '') NOT IN ('INWARD', 'CHQ', 'GST', 'EEFC');

    ------------------------------------------------------------------------
    -- 4b. NEW BANK STATEMENT FORMAT (IDFC .xls): take the UTR as BANKREFNO
    --     NEFT <utr> ... | NEFTIN <utr> ... | RTGS <utr> ... | IMPS-<n>-... UTR# <utr>
    --     A leading 'TRANSFER ' (Transaction Description 1) is ignored.
    --     Pipe-format rows are left untouched.  (Same logic as the Links original.)
    ------------------------------------------------------------------------
    ;WITH N AS (
        SELECT  ID,
                LTRIM(CASE WHEN BTRANSACTION LIKE 'TRANSFER %' THEN SUBSTRING(BTRANSACTION, 10, 500) ELSE BTRANSACTION END) T
        FROM    #TMPBANKRECONCILSTMT
        WHERE   BTRANSACTION NOT LIKE '%|%'
    ), N2 AS (
        SELECT  ID, T,
                LTRIM(SUBSTRING(T, CHARINDEX(' ', T + ' ') + 1, 500)) AFTERTOKEN1,
                CASE WHEN CHARINDEX('UTR#', T) > 0 THEN LTRIM(SUBSTRING(T, CHARINDEX('UTR#', T) + 4, 500)) ELSE '' END AFTERUTR
        FROM    N
    )
    UPDATE A SET A.BANKREFNO = LEFT(
            CASE WHEN N2.T LIKE 'IMPS-%' AND N2.AFTERUTR <> '' THEN LEFT(N2.AFTERUTR, CHARINDEX(' ', N2.AFTERUTR + ' ') - 1)
                 WHEN N2.T LIKE 'NEFT %' OR N2.T LIKE 'NEFTIN %' OR N2.T LIKE 'RTGS %'
                      THEN LEFT(N2.AFTERTOKEN1, CHARINDEX(' ', N2.AFTERTOKEN1 + ' ') - 1)
                 ELSE LEFT(N2.T, CHARINDEX(' ', N2.T + ' ') - 1)
            END, 50)
    FROM    #TMPBANKRECONCILSTMT A INNER JOIN N2 ON A.ID = N2.ID
    WHERE   N2.T LIKE 'NEFT %' OR N2.T LIKE 'NEFTIN %' OR N2.T LIKE 'RTGS %'
            OR (N2.T LIKE 'IMPS-%' AND N2.AFTERUTR <> '')
            OR (A.BTRANSACTION LIKE 'TRANSFER %' AND N2.T NOT LIKE 'BY %');

    ------------------------------------------------------------------------
    -- 4c. IDFC narrations whose reference is not the 2nd word (the step above leaves
    --     'RETURN' / 'TRANSFER' / 'Cr.' / 'AGENT' / 'REMITTANCE' as the reference):
    --       NEFT RETURN <ref> ...           TRANSFER <ref> <ref2> <party> ...     Cr. for PORD Payment <ref> ...
    --       AGENT CHARGES <ref> ...         REMITTANCE CHARGES - ... <ref> ...
    --     The reference is the first token shaped like 0000AA0... (e.g. 0811OP6177464799, 0853RF0609800, 0853IT0520683).
    ------------------------------------------------------------------------
    ;WITH P AS (
        SELECT  ID,
                T = LTRIM(CASE WHEN BTRANSACTION LIKE 'TRANSFER %' THEN SUBSTRING(BTRANSACTION, 10, 500) ELSE BTRANSACTION END)
        FROM    #TMPBANKRECONCILSTMT
        WHERE   BTRANSACTION NOT LIKE '%|%'
    ), Q AS (
        SELECT  ID, T, POS = PATINDEX('% [0-9][0-9][0-9][0-9][A-Z][A-Z][0-9]%', ' ' + T)
        FROM    P
        WHERE   T LIKE 'NEFT RETURN %' OR T LIKE 'TRANSFER %' OR T LIKE 'Cr. %'
                OR T LIKE 'AGENT CHARGES%' OR T LIKE 'REMITTANCE CHARGES%'
    )
    UPDATE A SET A.BANKREFNO = LEFT(SUBSTRING(Q.T, Q.POS, CHARINDEX(' ', Q.T + ' ', Q.POS) - Q.POS), 50)
    FROM    #TMPBANKRECONCILSTMT A INNER JOIN Q ON A.ID = Q.ID
    WHERE   Q.POS > 0;

    -- Cheque clearing credit  "BY OWCLG/<cheque no>/<date>/<bank>" : reference = the cheque number
    ;WITH C AS (
        SELECT  ID, T = LTRIM(CASE WHEN BTRANSACTION LIKE 'TRANSFER %' THEN SUBSTRING(BTRANSACTION, 10, 500) ELSE BTRANSACTION END)
        FROM    #TMPBANKRECONCILSTMT
        WHERE   BTRANSACTION NOT LIKE '%|%'
    ), C2 AS (
        SELECT  ID, T, S1 = CHARINDEX('/', T), S2 = CHARINDEX('/', T, CHARINDEX('/', T) + 1)
        FROM    C
        WHERE   T LIKE 'BY OWCLG/%'
    )
    UPDATE A SET A.BANKREFNO = LEFT(SUBSTRING(C2.T, C2.S1 + 1, C2.S2 - C2.S1 - 1), 50)
    FROM    #TMPBANKRECONCILSTMT A INNER JOIN C2 ON A.ID = C2.ID
    WHERE   C2.S2 > C2.S1;

    ------------------------------------------------------------------------
    -- 5. Special narrations where the ref number sits deeper in the string
    ------------------------------------------------------------------------
    /* INWARD -- token after the 4th space */
    INSERT INTO #TMPINWARD (ID, BANKREFNO)
    SELECT T.ID,
           CASE WHEN P.S4 > 0 THEN SUBSTRING(T.BTRANSACTION, P.S4 + 1, 6) ELSE '' END
    FROM   #TMPBANKRECONCILSTMT T
           CROSS APPLY (SELECT S1 = CHARINDEX(' ', T.BTRANSACTION)) A1
           CROSS APPLY (SELECT S2 = CASE WHEN A1.S1 > 0 THEN CHARINDEX(' ', T.BTRANSACTION, A1.S1 + 1) ELSE 0 END) A2
           CROSS APPLY (SELECT S3 = CASE WHEN A2.S2 > 0 THEN CHARINDEX(' ', T.BTRANSACTION, A2.S2 + 1) ELSE 0 END) A3
           CROSS APPLY (SELECT S4 = CASE WHEN A3.S3 > 0 THEN CHARINDEX(' ', T.BTRANSACTION, A3.S3 + 1) ELSE 0 END) P
    WHERE  T.BEFOREFIRSTSPACE = 'INWARD';

    /* CHQ -- cheque number after the word DEPOSIT */
    INSERT INTO #TMPINWARD (ID, BANKREFNO)
    SELECT T.ID,
           LEFT(CASE WHEN P.SPC > P.POS THEN SUBSTRING(T.BTRANSACTION, P.POS, P.SPC - P.POS)
                     WHEN P.POS > 0     THEN SUBSTRING(T.BTRANSACTION, P.POS, 20)
                     ELSE '' END, 50)
    FROM   #TMPBANKRECONCILSTMT T
           CROSS APPLY (SELECT D = CHARINDEX('DEPOSIT', T.BTRANSACTION)) A
           CROSS APPLY (SELECT POS = CASE WHEN A.D > 0 THEN A.D + LEN('DEPOSIT') ELSE 0 END) B
           CROSS APPLY (SELECT POS = B.POS,
                               SPC = CASE WHEN B.POS > 0 THEN CHARINDEX(' ', T.BTRANSACTION, B.POS) ELSE 0 END) P
    WHERE  T.BEFOREFIRSTSPACE = 'CHQ';

    /* GST / EEFC -- the token itself is the reference */
    INSERT INTO #TMPINWARD (ID, BANKREFNO)
    SELECT ID, LEFT(BEFOREFIRSTSPACE, 50)
    FROM   #TMPBANKRECONCILSTMT
    WHERE  BEFOREFIRSTSPACE IN ('GST', 'EEFC');

    UPDATE T
    SET    T.BANKREFNO = LEFT(LTRIM(RTRIM(I.BANKREFNO)), 50)
    FROM   #TMPBANKRECONCILSTMT T
           INNER JOIN #TMPINWARD I ON I.ID = T.ID;

    -- Push the resolved reference back onto the statement rows
    UPDATE S
    SET    S.BANKREFNO = T.BANKREFNO
    FROM   ACC_BANKRECONCIL_UPLOADSTATEMENT S
           INNER JOIN #TMPBANKRECONCILSTMT T ON T.ID = S.PK_ID
    WHERE  S.FK_LOGID = @FK_LOGID;

    IF @DEBUG = 1 SELECT '#TMPBANKRECONCILSTMT' AS DBG, * FROM #TMPBANKRECONCILSTMT ORDER BY ID;

    ------------------------------------------------------------------------
    -- 6. Resolve the ledger search window from the STATEMENT ITSELF.
    --    (The original used the login financial year start, so a back-period
    --     statement found no ledger rows and nothing reconciled.)
    ------------------------------------------------------------------------
    SELECT @STMTFROM = MIN(STMTYMD),
           @STMTTO   = MAX(STMTYMD)
    FROM   #TMPBANKRECONCILSTMT
    WHERE  STMTYMD IS NOT NULL;

    IF @STMTFROM IS NULL
    BEGIN
        RAISERROR('USP_ACC_BANKRECONCIL_UPDATECLEARANCEDT_V2: no usable dates in the uploaded statement for FK_LOGID %d. The DATE column must be dd/MM/yyyy.', 16, 1, @FK_LOGID);
        RETURN;
    END

    SET @SEARCHFROM = CONVERT(VARCHAR(8), DATEADD(YEAR, -@LOOKBACKYEARS, CONVERT(DATETIME, @STMTFROM, 112)), 112);

    -- LINKS: payments are often keyed AFTER the bank has already cleared them (a payment that cleared on 13/07 is
    -- entered as a voucher dated 20/07), so a voucher dated after the statement line is a normal match, not an error.
    -- Manilal's rule "voucher must not post-date the statement line" rejected every such pair here.
    -- Look ahead of the statement end by 60 days instead.
    SET @LEDGERTO = CONVERT(VARCHAR(8), DATEADD(DAY, 60, CONVERT(DATETIME, @STMTTO, 112)), 112);

    -- Pending-ledger listing runs to the later of As On Date and the end of the statement.
    SET @LISTTO = CASE WHEN @USERASONDT > @STMTTO THEN @USERASONDT ELSE @STMTTO END;

    IF @DEBUG = 1
        SELECT 'WINDOW'                 AS DBG,
               @STMTFROM                AS STATEMENT_FROM,
               @STMTTO                  AS STATEMENT_TO,
               @SEARCHFROM              AS LEDGER_SEARCH_FROM,
               @STMTTO                  AS LEDGER_SEARCH_TO,
               @LISTTO                  AS PENDING_LIST_TO,
               @USERASONDT              AS AS_ON_DATE_FROM_PAGE,
               @PAGEFROM                AS FROMDT_SENT_BY_PAGE_IGNORED;

    ------------------------------------------------------------------------
    -- 7. Deduplicated ledger snapshot (one ACC_BANK row cannot be claimed twice)
    ------------------------------------------------------------------------
    SELECT B.ENTRYNO,
           B.ENTRYDT,
           ENTRYYMD  = DBO.CONVERTDATE_YYYYMMDD(B.ENTRYDT),
           ENTRYDTM  = CASE WHEN ISDATE(DBO.CONVERTDATE_YYYYMMDD(B.ENTRYDT)) = 1
                            THEN CONVERT(DATETIME, DBO.CONVERTDATE_YYYYMMDD(B.ENTRYDT), 112) END,
           B.STATUS,
           B.BANKREFNO,
           B.CLEARANCEDATE,
           GROSSAMT  = CONVERT(DECIMAL(18, 2), B.ACTUALAMOUNT),
           DEDUCTAMT = CONVERT(DECIMAL(18, 2), 0),
           NETAMT    = CONVERT(DECIMAL(18, 2), B.ACTUALAMOUNT),
           CLAIMED   = CONVERT(BIT, 0)
    INTO   #LEDGER
    FROM   ACC_BANK B
    WHERE  B.OURBANK = @OURBANK
           AND B.STATUS IN ('BR', 'BP')
           AND DBO.CONVERTDATE_YYYYMMDD(B.ENTRYDT) >= @SEARCHFROM
           -- vouchers may be keyed after the bank cleared them - allow a look-ahead past the statement end
           AND DBO.CONVERTDATE_YYYYMMDD(B.ENTRYDT) <= @LEDGERTO
           AND ISNULL(B.BANKREFNO, '') <> '';

    -- Deductions per entry, summed in ONE pass over ACC_BANKDTLS. (ACC_BANKDTLS has no index on ENTRYNO, so the
    -- earlier per-row OUTER APPLY rescanned its ~160k rows once for every ledger row and took minutes.)
    SELECT DTL.ENTRYNO,
           DEDUCTION = SUM(CASE
                    WHEN X.V <> ''
                         AND X.V NOT LIKE '%[^0-9.-]%'
                         AND X.V NOT LIKE '%.%.%'
                         AND X.V NOT LIKE '%-%-%'
                    THEN CONVERT(DECIMAL(18, 2), X.V)
                    ELSE 0 END)
    INTO   #DED
    FROM   ACC_BANKDTLS DTL
           CROSS APPLY (SELECT V = LTRIM(RTRIM(REPLACE(ISNULL(CONVERT(VARCHAR(50), DTL.DEDUCTION), ''), ',', '')))) X
    WHERE  DTL.ENTRYNO IN (SELECT ENTRYNO FROM #LEDGER)
    GROUP BY DTL.ENTRYNO;

    UPDATE L
    SET    L.DEDUCTAMT = ISNULL(D.DEDUCTION, 0),
           L.NETAMT    = L.GROSSAMT - ISNULL(D.DEDUCTION, 0)
    FROM   #LEDGER L INNER JOIN #DED D ON D.ENTRYNO = L.ENTRYNO;
    DROP TABLE #DED;

    CREATE INDEX IX_LEDGER_MATCH ON #LEDGER (BANKREFNO, STATUS, CLAIMED, ENTRYYMD);

    IF @DEBUG = 1 SELECT '#LEDGER' AS DBG, * FROM #LEDGER;

    ------------------------------------------------------------------------
    -- 8. Match statement -> ledger on BANKREFNO.
    --    Pass 1 = gross amount, pass 2 = net of deduction. Each pass only
    --    touches still-unmatched rows and marks the ledger row as claimed.
    ------------------------------------------------------------------------
    DECLARE @PASS INT = 1, @ROWS INT;

    WHILE @PASS <= 2
    BEGIN
      SET @ROWS = 1;

      WHILE @ROWS > 0
      BEGIN
        ;WITH CANDIDATE AS
        (
            SELECT S.PK_ID,
                   L.ENTRYNO, L.ENTRYDT, L.STATUS, L.BANKREFNO AS LBANKREFNO,
                   L.CLEARANCEDATE, L.GROSSAMT, L.DEDUCTAMT,
                   RN  = ROW_NUMBER() OVER (PARTITION BY S.PK_ID   ORDER BY ABS(DATEDIFF(DAY, L.ENTRYDTM, CONVERT(DATETIME, T.STMTYMD, 112))), L.ENTRYNO),
                   LRN = ROW_NUMBER() OVER (PARTITION BY L.ENTRYNO ORDER BY T.STMTYMD, S.PK_ID)
            FROM   ACC_BANKRECONCIL_UPLOADSTATEMENT S
                   INNER JOIN #TMPBANKRECONCILSTMT T ON T.ID = S.PK_ID
                   INNER JOIN #LEDGER L
                           ON L.BANKREFNO = S.BANKREFNO
                          AND L.CLAIMED   = 0
                          AND (
                                (L.STATUS = 'BR' AND S.DEPOSIT    = CASE WHEN @PASS = 1 THEN L.GROSSAMT ELSE L.NETAMT END)
                             OR (L.STATUS = 'BP' AND S.WITHDRAWAL = CASE WHEN @PASS = 1 THEN L.GROSSAMT ELSE L.NETAMT END)
                              )
            WHERE  S.FK_LOGID = @FK_LOGID
                   AND S.ENTRYNO IS NULL
                   AND ISNULL(S.BANKREFNO, '') <> ''
                   AND T.STMTYMD IS NOT NULL
        )
        UPDATE S
        SET    S.ENTRYNO       = C.ENTRYNO,
               S.ENTRYDT       = C.ENTRYDT,
               S.ENTRYTYPE     = C.STATUS,
               S.USERBANKREFNO = C.LBANKREFNO,
               S.LCLEARNCEDT   = CONVERT(VARCHAR(10), C.CLEARANCEDATE, 103),
               S.LAMOUNT       = C.GROSSAMT,
               S.LDEDUCTION    = C.DEDUCTAMT
        FROM   ACC_BANKRECONCIL_UPLOADSTATEMENT S
               INNER JOIN CANDIDATE C ON C.PK_ID = S.PK_ID
        WHERE  C.RN = 1 AND C.LRN = 1;

        SET @ROWS = @@ROWCOUNT;

        UPDATE L
        SET    L.CLAIMED = 1
        FROM   #LEDGER L
               INNER JOIN ACC_BANKRECONCIL_UPLOADSTATEMENT S
                       ON S.ENTRYNO = L.ENTRYNO
        WHERE  S.FK_LOGID = @FK_LOGID;
      END

      SET @PASS = @PASS + 1;
    END

    ------------------------------------------------------------------------
    -- 8b. FALLBACK (kept from the Links original): ledger entries whose bank ref
    --     is blank or '.' are matched on AMOUNT + DIRECTION + DATE (+/- 7 days).
    --     Linked only when the pair is UNIQUE both ways (one statement row <->
    --     one ledger entry); ambiguous ones are left for manual reconciliation.
    ------------------------------------------------------------------------
    -- Already-cleared rows are included on purpose: a previous run of this upload stamped their CLEARANCEDATE, and
    -- without them a re-run could no longer find those pairs and would silently drop the matches (see join below).
    SELECT  ENTRYNO, ENTRYDT, STATUS, BANKREFNO, ACTUALAMOUNT, CLEARANCEDATE,
            LDT = CASE WHEN ISDATE(DBO.CONVERTDATE_YYYYMMDD(ENTRYDT)) = 1
                       THEN CONVERT(DATETIME, DBO.CONVERTDATE_YYYYMMDD(ENTRYDT), 112) END
    INTO    #LBLANK
    FROM    ACC_BANK
    WHERE   OURBANK = @OURBANK
            AND STATUS IN ('BR', 'BP')
            AND ISNULL(LTRIM(RTRIM(BANKREFNO)), '') IN ('', '.')
            AND DBO.CONVERTDATE_YYYYMMDD(ENTRYDT) >= @SEARCHFROM;

    SELECT DISTINCT S.PK_ID AS SID, L.ENTRYNO, L.ENTRYDT, L.STATUS, L.BANKREFNO AS LBANKREFNO
    INTO    #FBPAIRS
    FROM    ACC_BANKRECONCIL_UPLOADSTATEMENT S
            INNER JOIN #TMPBANKRECONCILSTMT T ON T.ID = S.PK_ID
            INNER JOIN #LBLANK L
                    ON ( (L.STATUS = 'BR' AND S.DEPOSIT    > 0 AND L.ACTUALAMOUNT = S.DEPOSIT)
                      OR (L.STATUS = 'BP' AND S.WITHDRAWAL > 0 AND L.ACTUALAMOUNT = S.WITHDRAWAL) )
                   AND ABS(DATEDIFF(DAY, CONVERT(DATETIME, T.STMTYMD, 112), L.LDT)) <= 7
                   -- not yet cleared, OR already cleared on exactly this statement line's date (i.e. by an earlier run of this
                   -- same upload). A row cleared on any other date belongs to a different statement line - leave it alone.
                   AND (L.CLEARANCEDATE IS NULL OR L.CLEARANCEDATE = CONVERT(DATETIME, T.STMTYMD, 112))
    WHERE   S.FK_LOGID = @FK_LOGID
            AND S.ENTRYNO IS NULL
            AND T.STMTYMD IS NOT NULL
            AND L.LDT IS NOT NULL;

    DELETE FROM #FBPAIRS
    WHERE   SID IN (SELECT SID FROM #FBPAIRS GROUP BY SID HAVING COUNT(*) > 1)
            OR ENTRYNO IN (SELECT ENTRYNO FROM #FBPAIRS GROUP BY ENTRYNO HAVING COUNT(*) > 1);

    UPDATE S
    SET    S.ENTRYNO       = P.ENTRYNO,
           S.ENTRYDT       = P.ENTRYDT,
           S.ENTRYTYPE     = P.STATUS,
           S.USERBANKREFNO = P.LBANKREFNO
    FROM   ACC_BANKRECONCIL_UPLOADSTATEMENT S
           INNER JOIN #FBPAIRS P ON S.PK_ID = P.SID
    WHERE  S.FK_LOGID = @FK_LOGID AND S.ENTRYNO IS NULL;

    ------------------------------------------------------------------------
    -- 9. Stamp the clearance date back onto the ledger (only rows not already
    --    cleared, and only via the match established above).
    ------------------------------------------------------------------------
    UPDATE B
    SET    B.CLEARANCEDATE = CONVERT(DATETIME, D.YMD, 112)
    FROM   ACC_BANK B
           INNER JOIN ACC_BANKRECONCIL_UPLOADSTATEMENT S ON S.ENTRYNO = B.ENTRYNO
           CROSS APPLY (SELECT V = LTRIM(RTRIM(ISNULL(S.[DATE], '')))) R
           CROSS APPLY (SELECT YMD = CASE
                            WHEN R.V LIKE '[0-9][0-9]/[0-9][0-9]/[0-9][0-9][0-9][0-9]'
                                 AND ISDATE(SUBSTRING(R.V, 7, 4) + SUBSTRING(R.V, 4, 2) + SUBSTRING(R.V, 1, 2)) = 1
                            THEN SUBSTRING(R.V, 7, 4) + SUBSTRING(R.V, 4, 2) + SUBSTRING(R.V, 1, 2)
                            ELSE NULL END) D
    WHERE  S.FK_LOGID = @FK_LOGID
           AND B.OURBANK = @OURBANK
           AND B.CLEARANCEDATE IS NULL
           AND D.YMD IS NOT NULL;

    -- refresh the displayed ledger clearance date after the stamp above
    UPDATE S
    SET    S.LCLEARNCEDT = CONVERT(VARCHAR(10), B.CLEARANCEDATE, 103)
    FROM   ACC_BANKRECONCIL_UPLOADSTATEMENT S
           INNER JOIN ACC_BANK B ON B.ENTRYNO = S.ENTRYNO
    WHERE  S.FK_LOGID = @FK_LOGID
           AND B.OURBANK = @OURBANK;

    ------------------------------------------------------------------------
    -- 10. Ledger amount / deduction totals, scoped to this log.
    ------------------------------------------------------------------------
    UPDATE S
    SET    S.LAMOUNT    = T.AMOUNT,
           S.LDEDUCTION = T.DEDUCTION
    FROM   ACC_BANKRECONCIL_UPLOADSTATEMENT S
           INNER JOIN (
               SELECT DTL.ENTRYNO,
                      AMOUNT = SUM(CASE
                            WHEN XA.V <> '' AND XA.V NOT LIKE '%[^0-9.-]%'
                                 AND XA.V NOT LIKE '%.%.%' AND XA.V NOT LIKE '%-%-%'
                            THEN CONVERT(DECIMAL(18, 2), XA.V) ELSE 0 END),
                      DEDUCTION = SUM(CASE
                            WHEN XD.V <> '' AND XD.V NOT LIKE '%[^0-9.-]%'
                                 AND XD.V NOT LIKE '%.%.%' AND XD.V NOT LIKE '%-%-%'
                            THEN CONVERT(DECIMAL(18, 2), XD.V) ELSE 0 END)
               FROM   ACC_BANKDTLS DTL
                      INNER JOIN ACC_BANK B ON B.ENTRYNO = DTL.ENTRYNO
                      CROSS APPLY (SELECT V = LTRIM(RTRIM(REPLACE(ISNULL(CONVERT(VARCHAR(50), DTL.AMOUNT), ''), ',', '')))) XA
                      CROSS APPLY (SELECT V = LTRIM(RTRIM(REPLACE(ISNULL(CONVERT(VARCHAR(50), DTL.DEDUCTION), ''), ',', '')))) XD
               -- only the entries matched in this upload (was: every ledger row in the date window, which ran a
               -- scalar date function over the whole bank ledger and made the proc very slow)
               WHERE  B.OURBANK = @OURBANK
                      AND DTL.ENTRYNO IN (SELECT M.ENTRYNO
                                          FROM   ACC_BANKRECONCIL_UPLOADSTATEMENT M
                                          WHERE  M.FK_LOGID = @FK_LOGID AND M.ENTRYNO IS NOT NULL)
               GROUP BY DTL.ENTRYNO
           ) T ON T.ENTRYNO = S.ENTRYNO
    WHERE  S.FK_LOGID = @FK_LOGID;

    ------------------------------------------------------------------------
    -- 11. Result set 1 -- RECONCILED
    ------------------------------------------------------------------------
    SELECT BANKREFNO,
           DEPOSIT,
           WITHDRAWAL,
           CLEARANCEDT   = [DATE],
           SPACER        = '  ',
           USERBANKREFNO,
           ENTRYNO,
           ENTRYDT,
           ENTRYTYPE,
           AMOUNT        = LAMOUNT,
           DEDUCTION     = LDEDUCTION,
           LCLEARANCEDT  = LCLEARNCEDT
    FROM   ACC_BANKRECONCIL_UPLOADSTATEMENT
    WHERE  FK_LOGID = @FK_LOGID
           AND ENTRYNO IS NOT NULL
    ORDER BY PK_ID;

    ------------------------------------------------------------------------
    -- 12. Result set 2 -- UNRECONCILED (statement side + pending ledger side)
    ------------------------------------------------------------------------
    SELECT BANKREFNO,
           DEPOSIT,
           WITHDRAWAL,
           CLEARANCEDT   = [DATE],
           SPACER        = '  ',
           USERBANKREFNO,
           ENTRYNO,
           ENTRYDT,
           ENTRYTYPE,
           AMOUNT        = LAMOUNT,
           DEDUCTION     = LDEDUCTION,
           LCLEARANCEDT  = LCLEARNCEDT
    FROM   ACC_BANKRECONCIL_UPLOADSTATEMENT
    WHERE  FK_LOGID = @FK_LOGID
           AND ENTRYNO IS NULL

    UNION ALL

    SELECT BANKREFNO     = '',
           DEPOSIT       = CONVERT(DECIMAL(18, 2), 0),
           WITHDRAWAL    = CONVERT(DECIMAL(18, 2), 0),
           CLEARANCEDT   = '',
           SPACER        = '  ',
           USERBANKREFNO = BANKREFNO,
           ENTRYNO,
           ENTRYDT,
           ENTRYTYPE     = [STATUS],
           AMOUNT        = CONVERT(DECIMAL(18, 2), ACTUALAMOUNT),
           DEDUCTION     = CONVERT(DECIMAL(18, 2), 0),
           LCLEARANCEDT  = CONVERT(VARCHAR(10), CLEARANCEDATE, 103)
    FROM   ACC_BANK
    WHERE  CLEARANCEDATE IS NULL
           AND OURBANK = @OURBANK
           AND DBO.CONVERTDATE_YYYYMMDD(ENTRYDT) BETWEEN @SEARCHFROM AND @LISTTO;

    ------------------------------------------------------------------------
    -- 13. Cleanup
    ------------------------------------------------------------------------
    DELETE FROM ACC_BANKRECONCIL_UPLOADSTATEMENT_TMP WHERE FK_LOGID = @FK_LOGID;
END
GO
