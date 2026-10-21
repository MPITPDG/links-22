/*===============================================================================================
  TICKETS_LINKSDB20_20261015.sql           (LinksDB20)

  Why  : the Links ERP gets the same "Tickets" feature MP Cargo has (support / issue tickets that
         any ERP user raises, with screenshots or PDFs, and the developers work on a board
         RAISED -> INPROGRESS -> COMPLETED, or DISCARDED). The Links API TicketController
         (api/Tickets/...) runs the procedures below. This is a SEPARATE queue: it lives in
         LinksDB20 only and shares nothing with the MP Cargo queue in the manilal database.
         Copied from ManilalV5_WebApi\Database\StoredProcedures\Tickets\ALL_IN_ONE.sql
         (commits b973b48 .. c7959b8), checked on 2026-10-15 against the LIVE definitions in the
         manilal database: identical, except that live FN_TICKET_ASSIGNEES says 'Nalini G' where
         the repo says 'Nalini Selvam'. The live text is used.

  Links adaptations (everything else is the MP text, unchanged):
    1. FN_TICKET_DEV_MAILS returns 'sujit@manilal.com', the mail on the Links login PDG
       (CMP_DTLS.cmpid 1, "Software Development Team"); MP's pdg.mp@manilal.com is not a Links
       login. That function is the ONLY place the developer list lives: add a login by adding
       one  UNION ALL SELECT '<mail>'  line to it and re-running this script.
    2. ticket_no is 'L-000001', 'L-000002', ... instead of MP's 'T-...', so a Links ticket can
       never be mistaken for an MP Cargo ticket of the same number (the developers see both).
    3. MP's one-off "DROP FUNCTION FN_TICKET_DEVELOPERS" (its v1 leftover) is not carried over:
       that object never existed on LinksDB20.

  Creates (dbo):
    tables      TBL_TICKET, TBL_TICKET_FILE, TBL_TICKET_EVENT
    functions   FN_TICKET_DEV_MAILS   developer logins, by CMP_DTLS.mail (the one list)
                FN_TICKET_ASSIGNEES   assignee labels P | S | N (not logins)
                FN_TICKET_IS_DEV      1 when a cmpid is a developer login
                FN_TICKET_DEV_CMPIDS  every developer cmpid (notification targets)
                FN_TICKET_BY_NAME     event "by" name (assignee label or CMP_DTLS.fullname)
    procedures  USP_TICKET_BOOTSTRAP, USP_TICKET_LIST, USP_TICKET_IU, USP_TICKET_FILE_ADD,
                USP_TICKET_FILE_DEL, USP_TICKET_FILE_GET, USP_TICKET_GET, USP_TICKET_MOVE,
                USP_TICKET_REASSIGN, USP_TICKET_COMMENT, USP_TICKET_EVENTS,
                USP_TICKET_EVENTS_SEEN, USP_TICKET_STATS
    Status rows: STATUS '100' = ok, '104' = rejected (MSG says why).

  Leaves alone: the 2018 design tbl_ticket_raise, tbl_ticket_raise_random_number and
                USP_TICKET_RAISE_IU / _LIST / _VIEW (empty, unused). No name created here
                matches any of them; step 1 refuses to run if one of our names is taken by
                an object of another kind.

  Safety : step 1 checks everything the objects depend on and stops before creating anything
           if one is missing or a name is taken. Tables are created only when absent (rows are
           never touched on a re-run); functions and procedures are dropped and recreated.
           Nothing here reads or changes any existing business table (CMP_DTLS is only read,
           by the functions, for cmpid / mail / fullname). Re-runnable.
           Uploaded files are NOT in the database: the API writes them under
           <Links API site root>\DATA\Tickets\{ticket_id}\{file_id}_{name}.
  Rollback: ROLLBACK_TICKETS_LINKSDB20_20261015.sql
  Source copy: Links_v5_API\LINKS_V8NG_API\Database\StoredProcedures\Common\Tickets\ALL_IN_ONE.sql
  SQL Server 2008 R2.
===============================================================================================*/
USE [LinksDB20]
GO
SET NOCOUNT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

/* ---- 1. prerequisites ------------------------------------------------------------------ */
DECLARE @problems TABLE (n INT IDENTITY(1,1), problem VARCHAR(400));

-- 1a. we must really be on LinksDB20 (if USE failed above the session is still in another DB;
--     the manilal database has the live MP Cargo copies of every name below)
IF UPPER(DB_NAME()) <> 'LINKSDB20'
    INSERT INTO @problems (problem) VALUES ('Connected to ' + DB_NAME() + ', not LinksDB20.');

-- 1b. the login table the functions read: CMP_DTLS.cmpid INT, mail, fullname
IF NOT EXISTS (SELECT 1
                 FROM sys.columns c
                 JOIN sys.types   t ON t.user_type_id = c.user_type_id
                WHERE c.object_id = OBJECT_ID('dbo.CMP_DTLS')
                  AND c.name = 'cmpid' AND t.name = 'int')
    INSERT INTO @problems (problem) VALUES ('dbo.CMP_DTLS.cmpid (INT) not found - ticket user ids would not match the login id.');
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.CMP_DTLS') AND name = 'mail')
    INSERT INTO @problems (problem) VALUES ('dbo.CMP_DTLS.mail not found - developers are identified by it.');
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('dbo.CMP_DTLS') AND name = 'fullname')
    INSERT INTO @problems (problem) VALUES ('dbo.CMP_DTLS.fullname not found - ticket events show it.');

-- 1c. permissions to create the objects
IF ISNULL(HAS_PERMS_BY_NAME(DB_NAME(), 'DATABASE', 'CREATE TABLE'), 0) = 0
    INSERT INTO @problems (problem) VALUES ('No CREATE TABLE permission on ' + DB_NAME() + '.');
IF ISNULL(HAS_PERMS_BY_NAME(DB_NAME(), 'DATABASE', 'CREATE PROCEDURE'), 0) = 0
    INSERT INTO @problems (problem) VALUES ('No CREATE PROCEDURE permission on ' + DB_NAME() + '.');
IF ISNULL(HAS_PERMS_BY_NAME(DB_NAME(), 'DATABASE', 'CREATE FUNCTION'), 0) = 0
    INSERT INTO @problems (problem) VALUES ('No CREATE FUNCTION permission on ' + DB_NAME() + '.');

-- 1d. each table: absent (will be created) or already a table with the columns the procedures use
DECLARE @expect TABLE (tbl SYSNAME, col SYSNAME, typ SYSNAME, len SMALLINT);
INSERT INTO @expect (tbl, col, typ, len)
          SELECT 'TBL_TICKET',       'ticket_id',      'int',      4
UNION ALL SELECT 'TBL_TICKET',       'ticket_no',      'varchar',  8
UNION ALL SELECT 'TBL_TICKET',       'subject',        'varchar',  200
UNION ALL SELECT 'TBL_TICKET',       'description',    'varchar',  -1
UNION ALL SELECT 'TBL_TICKET',       'page_url',       'varchar',  500
UNION ALL SELECT 'TBL_TICKET',       'page_title',     'varchar',  200
UNION ALL SELECT 'TBL_TICKET',       'status',         'varchar',  12
UNION ALL SELECT 'TBL_TICKET',       'assigned_code',  'char',     1
UNION ALL SELECT 'TBL_TICKET',       'raised_by',      'int',      4
UNION ALL SELECT 'TBL_TICKET',       'raised_by_name', 'varchar',  100
UNION ALL SELECT 'TBL_TICKET',       'raised_city',    'varchar',  5
UNION ALL SELECT 'TBL_TICKET',       'raised_at',      'datetime', 8
UNION ALL SELECT 'TBL_TICKET',       'updated_at',     'datetime', 8
UNION ALL SELECT 'TBL_TICKET',       'updated_by',     'int',      4
UNION ALL SELECT 'TBL_TICKET',       'last_remark',    'varchar',  500
UNION ALL SELECT 'TBL_TICKET',       'order_index',    'int',      4
UNION ALL SELECT 'TBL_TICKET_FILE',  'file_id',        'int',      4
UNION ALL SELECT 'TBL_TICKET_FILE',  'ticket_id',      'int',      4
UNION ALL SELECT 'TBL_TICKET_FILE',  'file_name',      'varchar',  255
UNION ALL SELECT 'TBL_TICKET_FILE',  'stored_path',    'varchar',  500
UNION ALL SELECT 'TBL_TICKET_FILE',  'content_type',   'varchar',  100
UNION ALL SELECT 'TBL_TICKET_FILE',  'size_bytes',     'int',      4
UNION ALL SELECT 'TBL_TICKET_FILE',  'uploaded_by',    'int',      4
UNION ALL SELECT 'TBL_TICKET_FILE',  'uploaded_at',    'datetime', 8
UNION ALL SELECT 'TBL_TICKET_EVENT', 'event_id',       'int',      4
UNION ALL SELECT 'TBL_TICKET_EVENT', 'ticket_id',      'int',      4
UNION ALL SELECT 'TBL_TICKET_EVENT', 'event_type',     'varchar',  10
UNION ALL SELECT 'TBL_TICKET_EVENT', 'from_status',    'varchar',  12
UNION ALL SELECT 'TBL_TICKET_EVENT', 'to_status',      'varchar',  12
UNION ALL SELECT 'TBL_TICKET_EVENT', 'remark',         'varchar',  -1
UNION ALL SELECT 'TBL_TICKET_EVENT', 'by_cmpid',       'int',      4
UNION ALL SELECT 'TBL_TICKET_EVENT', 'by_name',        'varchar',  100
UNION ALL SELECT 'TBL_TICKET_EVENT', 'by_code',        'char',     1
UNION ALL SELECT 'TBL_TICKET_EVENT', 'target_cmpid',   'int',      4
UNION ALL SELECT 'TBL_TICKET_EVENT', 'at',             'datetime', 8
UNION ALL SELECT 'TBL_TICKET_EVENT', 'seen',           'bit',      1
UNION ALL SELECT 'TBL_TICKET_EVENT', 'seen_at',        'datetime', 8;

INSERT INTO @problems (problem)
SELECT DISTINCT 'dbo.' + e.tbl + ' exists but is not a table.'
  FROM @expect e
 WHERE OBJECT_ID('dbo.' + e.tbl) IS NOT NULL AND OBJECT_ID('dbo.' + e.tbl, 'U') IS NULL;

INSERT INTO @problems (problem)
SELECT 'dbo.' + e.tbl + '.' + e.col + ' should be ' + e.typ + '(' + CAST(e.len AS VARCHAR(10)) + ') but is missing or different.'
  FROM @expect e
 WHERE OBJECT_ID('dbo.' + e.tbl, 'U') IS NOT NULL
   AND NOT EXISTS (SELECT 1
                     FROM sys.columns c
                     JOIN sys.types   t ON t.user_type_id = c.user_type_id
                    WHERE c.object_id = OBJECT_ID('dbo.' + e.tbl)
                      AND c.name = e.col AND t.name = e.typ AND c.max_length = e.len);

-- constraint names of a table that is about to be created must be free
INSERT INTO @problems (problem)
SELECT 'Constraint name ' + o.name + ' is already used by another object - ' + x.tbl + ' cannot be created.'
  FROM (          SELECT 'TBL_TICKET' tbl,  'PK_TBL_TICKET' con
        UNION ALL SELECT 'TBL_TICKET',       'DF_TBL_TICKET_status'
        UNION ALL SELECT 'TBL_TICKET',       'DF_TBL_TICKET_raised_at'
        UNION ALL SELECT 'TBL_TICKET',       'DF_TBL_TICKET_updated_at'
        UNION ALL SELECT 'TBL_TICKET',       'DF_TBL_TICKET_order_index'
        UNION ALL SELECT 'TBL_TICKET_FILE',  'PK_TBL_TICKET_FILE'
        UNION ALL SELECT 'TBL_TICKET_FILE',  'DF_TBL_TICKET_FILE_uploaded_at'
        UNION ALL SELECT 'TBL_TICKET_EVENT', 'PK_TBL_TICKET_EVENT'
        UNION ALL SELECT 'TBL_TICKET_EVENT', 'DF_TBL_TICKET_EVENT_at'
        UNION ALL SELECT 'TBL_TICKET_EVENT', 'DF_TBL_TICKET_EVENT_seen') x
  JOIN sys.objects o ON o.name = x.con AND o.schema_id = SCHEMA_ID('dbo')
 WHERE OBJECT_ID('dbo.' + x.tbl) IS NULL;

-- 1e. function / procedure names must be free, or already be a function / procedure
--     (those are dropped and recreated below)
INSERT INTO @problems (problem)
SELECT 'dbo.' + o.name + ' exists but is not a function (type ' + RTRIM(o.type) + ').'
  FROM sys.objects o
 WHERE o.schema_id = SCHEMA_ID('dbo')
   AND o.name IN ('FN_TICKET_DEV_MAILS', 'FN_TICKET_ASSIGNEES', 'FN_TICKET_IS_DEV',
                  'FN_TICKET_DEV_CMPIDS', 'FN_TICKET_BY_NAME')
   AND o.type NOT IN ('FN', 'IF', 'TF');

INSERT INTO @problems (problem)
SELECT 'dbo.' + o.name + ' exists but is not a stored procedure (type ' + RTRIM(o.type) + ').'
  FROM sys.objects o
 WHERE o.schema_id = SCHEMA_ID('dbo')
   AND o.name IN ('USP_TICKET_BOOTSTRAP', 'USP_TICKET_LIST', 'USP_TICKET_IU', 'USP_TICKET_FILE_ADD',
                  'USP_TICKET_FILE_DEL', 'USP_TICKET_FILE_GET', 'USP_TICKET_GET', 'USP_TICKET_MOVE',
                  'USP_TICKET_REASSIGN', 'USP_TICKET_COMMENT', 'USP_TICKET_EVENTS',
                  'USP_TICKET_EVENTS_SEEN', 'USP_TICKET_STATS')
   AND o.type <> 'P';

IF EXISTS (SELECT 1 FROM @problems)
BEGIN
    PRINT '*** Prerequisite check failed on ' + DB_NAME() + ' - NOTHING was created:';
    SELECT n AS [#], problem FROM @problems ORDER BY n;
    RAISERROR('Prerequisite check failed - see the list above.', 16, 1);
    SET NOEXEC ON;     -- skip the rest of the script, including every CREATE below
END
ELSE
    PRINT 'Prerequisites OK on ' + DB_NAME() + '.';
GO

/* ---- 2. identity functions (dropped and recreated) -------------------------------------- */
IF OBJECT_ID('dbo.FN_TICKET_BY_NAME') IS NOT NULL DROP FUNCTION dbo.FN_TICKET_BY_NAME;
IF OBJECT_ID('dbo.FN_TICKET_DEV_CMPIDS') IS NOT NULL DROP FUNCTION dbo.FN_TICKET_DEV_CMPIDS;
IF OBJECT_ID('dbo.FN_TICKET_IS_DEV') IS NOT NULL DROP FUNCTION dbo.FN_TICKET_IS_DEV;
IF OBJECT_ID('dbo.FN_TICKET_DEV_MAILS') IS NOT NULL DROP FUNCTION dbo.FN_TICKET_DEV_MAILS;
IF OBJECT_ID('dbo.FN_TICKET_ASSIGNEES') IS NOT NULL DROP FUNCTION dbo.FN_TICKET_ASSIGNEES;
GO

/* developer logins, by mail. THE ONLY PLACE THE DEVELOPER LIST LIVES.
   Links: 'sujit@manilal.com' is the mail on login PDG (CMP_DTLS.cmpid 1). Lower case, trimmed.
   To add a developer login:  UNION ALL SELECT 'name@manilal.com'  and re-run the script. */
CREATE FUNCTION dbo.FN_TICKET_DEV_MAILS()
RETURNS TABLE
AS
RETURN
(
    SELECT CONVERT(VARCHAR(100), 'sujit@manilal.com') AS mail
);
GO

/* assignee labels */
CREATE FUNCTION dbo.FN_TICKET_ASSIGNEES()
RETURNS TABLE
AS
RETURN
(
    SELECT CONVERT(CHAR(1), 'P') AS code, CONVERT(VARCHAR(100), 'Pranav Nair') AS display_name, 1 AS sort_order
    UNION ALL SELECT 'S', 'Sujit Sahoo', 2
    UNION ALL SELECT 'N', 'Nalini G', 3
);
GO

CREATE FUNCTION dbo.FN_TICKET_IS_DEV(@cmpid INT)
RETURNS BIT
AS
BEGIN
    DECLARE @r BIT;
    SET @r = 0;
    IF EXISTS (SELECT 1
               FROM dbo.CMP_DTLS c
               INNER JOIN dbo.FN_TICKET_DEV_MAILS() m ON m.mail = LOWER(RTRIM(c.MAIL))
               WHERE c.CMPID = @cmpid)
        SET @r = 1;
    RETURN @r;
END
GO

/* every developer login (event targets for "the developers") */
CREATE FUNCTION dbo.FN_TICKET_DEV_CMPIDS()
RETURNS TABLE
AS
RETURN
(
    SELECT DISTINCT c.CMPID AS cmpid
    FROM dbo.CMP_DTLS c
    INNER JOIN dbo.FN_TICKET_DEV_MAILS() m ON m.mail = LOWER(RTRIM(c.MAIL))
);
GO

/* event by_name: developer acting as a valid assignee code -> that label; otherwise CMP_DTLS.FULLNAME */
CREATE FUNCTION dbo.FN_TICKET_BY_NAME(@cmpid INT, @actorCode VARCHAR(5))
RETURNS VARCHAR(100)
AS
BEGIN
    DECLARE @n VARCHAR(100);
    IF dbo.FN_TICKET_IS_DEV(@cmpid) = 1
        SELECT @n = display_name FROM dbo.FN_TICKET_ASSIGNEES() WHERE code = UPPER(LTRIM(RTRIM(ISNULL(@actorCode, ''))));
    IF @n IS NULL
        SELECT @n = RTRIM(FULLNAME) FROM dbo.CMP_DTLS WHERE CMPID = @cmpid;
    RETURN @n;
END
GO

/* ---- 3. tables (only when absent; existing rows are never touched) ---------------------- */
IF OBJECT_ID('dbo.TBL_TICKET', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TBL_TICKET
    (
        ticket_id       INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_TBL_TICKET PRIMARY KEY,
        ticket_no       AS ('L-' + RIGHT('000000' + CONVERT(VARCHAR(10), ticket_id), 6)) PERSISTED,   -- Links: 'L-', MP: 'T-'
        subject         VARCHAR(200) NOT NULL,
        description     VARCHAR(MAX) NULL,
        page_url        VARCHAR(500) NULL,
        page_title      VARCHAR(200) NULL,
        status          VARCHAR(12) NOT NULL CONSTRAINT DF_TBL_TICKET_status DEFAULT ('RAISED'),
        assigned_code   CHAR(1) NULL,          -- label from FN_TICKET_ASSIGNEES(): P | S | N
        raised_by       INT NOT NULL,
        raised_by_name  VARCHAR(100) NULL,
        raised_city     VARCHAR(5) NULL,
        raised_at       DATETIME NOT NULL CONSTRAINT DF_TBL_TICKET_raised_at DEFAULT (GETDATE()),
        updated_at      DATETIME NOT NULL CONSTRAINT DF_TBL_TICKET_updated_at DEFAULT (GETDATE()),
        updated_by      INT NULL,
        last_remark     VARCHAR(500) NULL,
        order_index     INT NOT NULL CONSTRAINT DF_TBL_TICKET_order_index DEFAULT (0)
    );
    PRINT 'TBL_TICKET created.';
END
ELSE
    PRINT 'TBL_TICKET already exists - left as it is.';
GO

/* ticket_no is derived from the identity, so it is unique by construction; no index on the
   computed column (avoids SET ARITHABORT / QUOTED_IDENTIFIER requirements on legacy connections). */
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_TBL_TICKET_raised_by_status' AND object_id = OBJECT_ID('dbo.TBL_TICKET'))
    CREATE INDEX IX_TBL_TICKET_raised_by_status ON dbo.TBL_TICKET (raised_by, status);
IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_TBL_TICKET_assigned_code_status' AND object_id = OBJECT_ID('dbo.TBL_TICKET'))
    CREATE INDEX IX_TBL_TICKET_assigned_code_status ON dbo.TBL_TICKET (assigned_code, status);
GO

IF OBJECT_ID('dbo.TBL_TICKET_FILE', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TBL_TICKET_FILE
    (
        file_id       INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_TBL_TICKET_FILE PRIMARY KEY,
        ticket_id     INT NOT NULL,
        file_name     VARCHAR(255) NOT NULL,
        stored_path   VARCHAR(500) NULL,
        content_type  VARCHAR(100) NULL,
        size_bytes    INT NULL,
        uploaded_by   INT NULL,
        uploaded_at   DATETIME NOT NULL CONSTRAINT DF_TBL_TICKET_FILE_uploaded_at DEFAULT (GETDATE())
    );
    CREATE INDEX IX_TBL_TICKET_FILE_ticket_id ON dbo.TBL_TICKET_FILE (ticket_id);
    PRINT 'TBL_TICKET_FILE created.';
END
ELSE
    PRINT 'TBL_TICKET_FILE already exists - left as it is.';
GO

IF OBJECT_ID('dbo.TBL_TICKET_EVENT', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TBL_TICKET_EVENT
    (
        event_id      INT IDENTITY(1,1) NOT NULL CONSTRAINT PK_TBL_TICKET_EVENT PRIMARY KEY,
        ticket_id     INT NOT NULL,
        event_type    VARCHAR(10) NOT NULL,   -- RAISED | STATUS | ASSIGN | COMMENT
        from_status   VARCHAR(12) NULL,
        to_status     VARCHAR(12) NULL,
        remark        VARCHAR(MAX) NULL,
        by_cmpid      INT NULL,
        by_name       VARCHAR(100) NULL,
        by_code       CHAR(1) NULL,           -- 'acting as' assignee code (developer login only)
        target_cmpid  INT NULL,
        at            DATETIME NOT NULL CONSTRAINT DF_TBL_TICKET_EVENT_at DEFAULT (GETDATE()),
        seen          BIT NOT NULL CONSTRAINT DF_TBL_TICKET_EVENT_seen DEFAULT (0),
        seen_at       DATETIME NULL
    );
    CREATE INDEX IX_TBL_TICKET_EVENT_target_seen ON dbo.TBL_TICKET_EVENT (target_cmpid, seen);
    CREATE INDEX IX_TBL_TICKET_EVENT_ticket_id ON dbo.TBL_TICKET_EVENT (ticket_id);
    PRINT 'TBL_TICKET_EVENT created.';
END
ELSE
    PRINT 'TBL_TICKET_EVENT already exists - left as it is.';
GO

/* ---- 4. stored procedures (contract v3; dropped and recreated) ---------------------------
   Developer = dbo.FN_TICKET_IS_DEV(cmpid) = 1; assignee = code from dbo.FN_TICKET_ASSIGNEES().
   Events: one row per notification target. "The developers" = every login in FN_TICKET_DEV_CMPIDS().
   A fan-out writes rows with identical (ticket_id, event_type, at, by_cmpid); USP_TICKET_GET shows only the first. */

/* ------------------------------------------------------------------ BOOTSTRAP */
IF OBJECT_ID('dbo.USP_TICKET_BOOTSTRAP', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_TICKET_BOOTSTRAP;
GO
CREATE PROCEDURE dbo.USP_TICKET_BOOTSTRAP
    @USERID INT
AS
BEGIN
    SET NOCOUNT ON;

    SELECT code, display_name
    FROM dbo.FN_TICKET_ASSIGNEES()
    ORDER BY sort_order;

    SELECT
        CONVERT(INT, dbo.FN_TICKET_IS_DEV(@USERID)) AS IS_DEVELOPER,
        (SELECT COUNT(*) FROM dbo.TBL_TICKET_EVENT WHERE target_cmpid = @USERID AND seen = 0) AS UNREAD_EVENTS;
END
GO

/* ------------------------------------------------------------------ LIST */
IF OBJECT_ID('dbo.USP_TICKET_LIST', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_TICKET_LIST;
GO
CREATE PROCEDURE dbo.USP_TICKET_LIST
    @USERID     INT,
    @SCOPE      VARCHAR(10)  = 'mine',   -- mine | dev
    @ASSIGNEDTO VARCHAR(5)   = '',       -- '' = everyone, else P | S | N
    @CITYCODE   VARCHAR(5)   = '',       -- '' = any
    @SHOW       VARCHAR(12)  = 'open',   -- open | all | discarded
    @Q          VARCHAR(200) = ''
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @ISDEV BIT;
    DECLARE @BLOCK BIT;
    DECLARE @LIKE VARCHAR(210);
    SET @ISDEV = dbo.FN_TICKET_IS_DEV(@USERID);
    SET @BLOCK = 0;

    SET @SCOPE = LOWER(LTRIM(RTRIM(ISNULL(@SCOPE, 'mine'))));
    SET @SHOW = LOWER(LTRIM(RTRIM(ISNULL(@SHOW, 'open'))));
    SET @CITYCODE = LTRIM(RTRIM(ISNULL(@CITYCODE, '')));
    SET @Q = LTRIM(RTRIM(ISNULL(@Q, '')));
    SET @ASSIGNEDTO = UPPER(LTRIM(RTRIM(ISNULL(@ASSIGNEDTO, ''))));
    IF @SCOPE <> 'dev' SET @SCOPE = 'mine';
    IF @SCOPE = 'dev' AND @ISDEV = 0 SET @BLOCK = 1;
    SET @LIKE = '%' + @Q + '%';

    /* base set = every filter except status/show */
    SELECT t.ticket_id, t.status
    INTO #B
    FROM dbo.TBL_TICKET t
    WHERE @BLOCK = 0
      AND (@SCOPE = 'dev' OR t.raised_by = @USERID)
      AND (@ASSIGNEDTO = '' OR t.assigned_code = @ASSIGNEDTO)
      AND (@CITYCODE = '' OR t.raised_city = @CITYCODE)
      AND (@Q = ''
           OR t.subject LIKE @LIKE
           OR t.ticket_no LIKE @LIKE
           OR t.raised_by_name LIKE @LIKE
           OR t.page_title LIKE @LIKE);

    SELECT
        t.ticket_id, t.ticket_no, t.subject, t.status,
        t.assigned_code, a.display_name AS assigned_name,
        t.raised_by, t.raised_by_name, t.raised_city,
        t.raised_at, t.updated_at, t.last_remark,
        (SELECT COUNT(*) FROM dbo.TBL_TICKET_FILE f WHERE f.ticket_id = t.ticket_id) AS file_count,
        (SELECT COUNT(*) FROM dbo.TBL_TICKET_EVENT e WHERE e.ticket_id = t.ticket_id AND e.event_type = 'COMMENT'
            AND NOT EXISTS (SELECT 1 FROM dbo.TBL_TICKET_EVENT x
                            WHERE x.ticket_id = e.ticket_id AND x.event_type = e.event_type AND x.at = e.at
                              AND ISNULL(x.by_cmpid, 0) = ISNULL(e.by_cmpid, 0) AND x.event_id < e.event_id)) AS comment_count,
        t.page_url, t.page_title, t.order_index,
        DATEDIFF(MINUTE, t.raised_at, GETDATE()) AS age_minutes
    FROM #B b
    INNER JOIN dbo.TBL_TICKET t ON t.ticket_id = b.ticket_id
    LEFT JOIN dbo.FN_TICKET_ASSIGNEES() a ON a.code = t.assigned_code
    WHERE (@SHOW = 'all')
       OR (@SHOW = 'discarded' AND t.status = 'DISCARDED')
       OR (@SHOW NOT IN ('all', 'discarded')
           AND (t.status IN ('RAISED', 'INPROGRESS')
                OR (t.status IN ('COMPLETED', 'DISCARDED') AND t.updated_at >= DATEADD(DAY, -30, GETDATE()))))
    ORDER BY
        CASE t.status WHEN 'RAISED' THEN 1 WHEN 'INPROGRESS' THEN 2 WHEN 'COMPLETED' THEN 3 ELSE 4 END,
        t.order_index, t.updated_at DESC;

    SELECT
        ISNULL(SUM(CASE WHEN status = 'RAISED' THEN 1 ELSE 0 END), 0) AS RAISED,
        ISNULL(SUM(CASE WHEN status = 'INPROGRESS' THEN 1 ELSE 0 END), 0) AS INPROGRESS,
        ISNULL(SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END), 0) AS COMPLETED,
        ISNULL(SUM(CASE WHEN status = 'DISCARDED' THEN 1 ELSE 0 END), 0) AS DISCARDED
    FROM #B;

    DROP TABLE #B;
END
GO

/* ------------------------------------------------------------------ IU (create header + RAISED event to the developers) */
IF OBJECT_ID('dbo.USP_TICKET_IU', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_TICKET_IU;
GO
CREATE PROCEDURE dbo.USP_TICKET_IU
    @USERID      INT,
    @USERNAME    VARCHAR(100),
    @CITYCODE    VARCHAR(5),
    @ASSIGNEDTO  VARCHAR(5),      -- assignee code P | S | N
    @SUBJECT     VARCHAR(200),
    @DESCRIPTION VARCHAR(MAX),
    @PAGEURL     VARCHAR(500),
    @PAGETITLE   VARCHAR(200)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    SET @SUBJECT = LTRIM(RTRIM(ISNULL(@SUBJECT, '')));
    SET @ASSIGNEDTO = UPPER(LTRIM(RTRIM(ISNULL(@ASSIGNEDTO, ''))));
    SET @USERNAME = LTRIM(RTRIM(ISNULL(@USERNAME, '')));

    IF @SUBJECT = ''
    BEGIN
        SELECT '104' AS STATUS, 'Subject is required' AS MSG, 0 AS TICKET_ID, '' AS TICKET_NO;
        RETURN;
    END
    IF ISNULL(@USERID, 0) = 0
    BEGIN
        SELECT '104' AS STATUS, 'userId is required' AS MSG, 0 AS TICKET_ID, '' AS TICKET_NO;
        RETURN;
    END
    IF NOT EXISTS (SELECT 1 FROM dbo.FN_TICKET_ASSIGNEES() WHERE code = @ASSIGNEDTO)
    BEGIN
        SELECT '104' AS STATUS, 'Choose who the ticket is for' AS MSG, 0 AS TICKET_ID, '' AS TICKET_NO;
        RETURN;
    END
    IF @USERNAME = ''
        SELECT @USERNAME = RTRIM(FULLNAME) FROM dbo.CMP_DTLS WHERE CMPID = @USERID;

    DECLARE @ID INT;
    DECLARE @NOW DATETIME;
    SET @NOW = GETDATE();

    BEGIN TRAN;

    INSERT INTO dbo.TBL_TICKET
        (subject, description, page_url, page_title, status, assigned_code, raised_by, raised_by_name,
         raised_city, raised_at, updated_at, updated_by, last_remark, order_index)
    VALUES
        (@SUBJECT, @DESCRIPTION, @PAGEURL, @PAGETITLE, 'RAISED', @ASSIGNEDTO, @USERID, @USERNAME,
         @CITYCODE, @NOW, @NOW, @USERID, NULL, 0);

    SET @ID = SCOPE_IDENTITY();

    INSERT INTO dbo.TBL_TICKET_EVENT
        (ticket_id, event_type, from_status, to_status, remark, by_cmpid, by_name, by_code, target_cmpid, at, seen, seen_at)
    SELECT @ID, 'RAISED', NULL, 'RAISED', @SUBJECT, @USERID, @USERNAME, NULL, d.cmpid, @NOW,
           CASE WHEN d.cmpid = @USERID THEN 1 ELSE 0 END,
           CASE WHEN d.cmpid = @USERID THEN @NOW ELSE NULL END
    FROM dbo.FN_TICKET_DEV_CMPIDS() d;

    COMMIT TRAN;

    SELECT '100' AS STATUS, 'Ticket raised' AS MSG, t.ticket_id AS TICKET_ID, t.ticket_no AS TICKET_NO
    FROM dbo.TBL_TICKET t
    WHERE t.ticket_id = @ID;
END
GO

/* ------------------------------------------------------------------ FILE_ADD */
IF OBJECT_ID('dbo.USP_TICKET_FILE_ADD', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_TICKET_FILE_ADD;
GO
CREATE PROCEDURE dbo.USP_TICKET_FILE_ADD
    @TICKETID    INT,
    @FILENAME    VARCHAR(255),   -- already sanitised by the API
    @CONTENTTYPE VARCHAR(100),
    @SIZEBYTES   INT,
    @USERID      INT
AS
BEGIN
    SET NOCOUNT ON;

    IF NOT EXISTS (SELECT 1 FROM dbo.TBL_TICKET WHERE ticket_id = @TICKETID)
    BEGIN
        SELECT '104' AS STATUS, 'Ticket not found' AS MSG, 0 AS FILE_ID, '' AS STORED_PATH;
        RETURN;
    END

    DECLARE @FID INT;

    INSERT INTO dbo.TBL_TICKET_FILE (ticket_id, file_name, stored_path, content_type, size_bytes, uploaded_by, uploaded_at)
    VALUES (@TICKETID, @FILENAME, NULL, @CONTENTTYPE, @SIZEBYTES, @USERID, GETDATE());

    SET @FID = SCOPE_IDENTITY();

    /* relative to <site root>\DATA\Tickets\ */
    UPDATE dbo.TBL_TICKET_FILE
    SET stored_path = CONVERT(VARCHAR(10), @TICKETID) + '\' + CONVERT(VARCHAR(10), @FID) + '_' + @FILENAME
    WHERE file_id = @FID;

    SELECT '100' AS STATUS, 'File added' AS MSG, file_id AS FILE_ID, stored_path AS STORED_PATH
    FROM dbo.TBL_TICKET_FILE
    WHERE file_id = @FID;
END
GO

/* ------------------------------------------------------------------ FILE_DEL (API rollback when the disk write fails) */
IF OBJECT_ID('dbo.USP_TICKET_FILE_DEL', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_TICKET_FILE_DEL;
GO
CREATE PROCEDURE dbo.USP_TICKET_FILE_DEL
    @FILEID INT
AS
BEGIN
    SET NOCOUNT ON;
    DELETE FROM dbo.TBL_TICKET_FILE WHERE file_id = @FILEID;
    SELECT '100' AS STATUS, 'File removed' AS MSG;
END
GO

/* ------------------------------------------------------------------ FILE_GET (GET api/Tickets/File/{id}) */
IF OBJECT_ID('dbo.USP_TICKET_FILE_GET', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_TICKET_FILE_GET;
GO
CREATE PROCEDURE dbo.USP_TICKET_FILE_GET
    @FILEID INT
AS
BEGIN
    SET NOCOUNT ON;
    SELECT file_id, ticket_id, file_name, stored_path, content_type, size_bytes
    FROM dbo.TBL_TICKET_FILE
    WHERE file_id = @FILEID;
END
GO

/* ------------------------------------------------------------------ GET */
IF OBJECT_ID('dbo.USP_TICKET_GET', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_TICKET_GET;
GO
CREATE PROCEDURE dbo.USP_TICKET_GET
    @TICKETID INT,
    @USERID   INT
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @ISDEV BIT;
    DECLARE @RAISEDBY INT;
    SET @ISDEV = dbo.FN_TICKET_IS_DEV(@USERID);

    SELECT @RAISEDBY = raised_by FROM dbo.TBL_TICKET WHERE ticket_id = @TICKETID;

    IF @RAISEDBY IS NULL
    BEGIN
        SELECT '104' AS STATUS, 'Ticket not found' AS MSG;
        RETURN;
    END
    IF @ISDEV = 0 AND @RAISEDBY <> @USERID
    BEGIN
        SELECT '104' AS STATUS, 'Not your ticket' AS MSG;
        RETURN;
    END

    /* timeline without fan-out duplicates */
    SELECT e.event_id
    INTO #E
    FROM dbo.TBL_TICKET_EVENT e
    WHERE e.ticket_id = @TICKETID
      AND NOT EXISTS (SELECT 1 FROM dbo.TBL_TICKET_EVENT x
                      WHERE x.ticket_id = e.ticket_id
                        AND x.event_type = e.event_type
                        AND x.at = e.at
                        AND ISNULL(x.by_cmpid, 0) = ISNULL(e.by_cmpid, 0)
                        AND x.event_id < e.event_id);

    SELECT
        '100' AS STATUS, '' AS MSG,
        t.ticket_id, t.ticket_no, t.subject, t.status,
        t.assigned_code, a.display_name AS assigned_name,
        t.raised_by, t.raised_by_name, t.raised_city,
        t.raised_at, t.updated_at, t.last_remark,
        (SELECT COUNT(*) FROM dbo.TBL_TICKET_FILE f WHERE f.ticket_id = t.ticket_id) AS file_count,
        (SELECT COUNT(*) FROM #E x INNER JOIN dbo.TBL_TICKET_EVENT e ON e.event_id = x.event_id
         WHERE e.event_type = 'COMMENT') AS comment_count,
        t.page_url, t.page_title, t.order_index,
        DATEDIFF(MINUTE, t.raised_at, GETDATE()) AS age_minutes,
        t.description
    FROM dbo.TBL_TICKET t
    LEFT JOIN dbo.FN_TICKET_ASSIGNEES() a ON a.code = t.assigned_code
    WHERE t.ticket_id = @TICKETID;

    SELECT file_id, file_name, content_type, size_bytes, uploaded_at
    FROM dbo.TBL_TICKET_FILE
    WHERE ticket_id = @TICKETID
    ORDER BY file_id;

    SELECT e.event_id, e.event_type, e.from_status, e.to_status, e.remark, e.by_cmpid, e.by_name, e.by_code, e.at
    FROM #E x
    INNER JOIN dbo.TBL_TICKET_EVENT e ON e.event_id = x.event_id
    ORDER BY e.at, e.event_id;

    DROP TABLE #E;

    UPDATE dbo.TBL_TICKET_EVENT
    SET seen = 1, seen_at = GETDATE()
    WHERE ticket_id = @TICKETID AND target_cmpid = @USERID AND seen = 0;
END
GO

/* ------------------------------------------------------------------ MOVE */
IF OBJECT_ID('dbo.USP_TICKET_MOVE', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_TICKET_MOVE;
GO
CREATE PROCEDURE dbo.USP_TICKET_MOVE
    @TICKETID   INT,
    @USERID     INT,
    @TOSTATUS   VARCHAR(12),
    @REMARK     VARCHAR(MAX) = '',
    @ORDERINDEX INT = NULL,       -- NULL = keep current order_index
    @ACTORCODE  VARCHAR(5) = ''   -- developer "acting as" P | S | N
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @ISDEV BIT;
    DECLARE @RAISEDBY INT;
    DECLARE @CUR VARCHAR(12);
    DECLARE @BYNAME VARCHAR(100);
    DECLARE @BYCODE CHAR(1);
    DECLARE @NOW DATETIME;

    SET @NOW = GETDATE();
    SET @ISDEV = dbo.FN_TICKET_IS_DEV(@USERID);
    SET @TOSTATUS = UPPER(LTRIM(RTRIM(ISNULL(@TOSTATUS, ''))));
    SET @REMARK = LTRIM(RTRIM(ISNULL(@REMARK, '')));
    SET @ACTORCODE = UPPER(LTRIM(RTRIM(ISNULL(@ACTORCODE, ''))));

    IF @TOSTATUS NOT IN ('RAISED', 'INPROGRESS', 'COMPLETED', 'DISCARDED')
    BEGIN
        SELECT '104' AS STATUS, 'Invalid status' AS MSG;
        RETURN;
    END

    SELECT @RAISEDBY = raised_by, @CUR = status
    FROM dbo.TBL_TICKET WHERE ticket_id = @TICKETID;

    IF @RAISEDBY IS NULL
    BEGIN
        SELECT '104' AS STATUS, 'Ticket not found' AS MSG;
        RETURN;
    END

    IF @ISDEV = 0 AND NOT (@RAISEDBY = @USERID AND @CUR = 'RAISED' AND @TOSTATUS = 'DISCARDED')
    BEGIN
        SELECT '104' AS STATUS,
               CASE WHEN @RAISEDBY <> @USERID THEN 'Not your ticket'
                    ELSE 'You can only discard your ticket while it is RAISED' END AS MSG;
        RETURN;
    END

    SET @BYNAME = dbo.FN_TICKET_BY_NAME(@USERID, @ACTORCODE);
    IF @ISDEV = 1 SELECT @BYCODE = code FROM dbo.FN_TICKET_ASSIGNEES() WHERE code = @ACTORCODE;

    BEGIN TRAN;

    IF @CUR = @TOSTATUS
    BEGIN
        /* reorder within the same column: no event */
        UPDATE dbo.TBL_TICKET
        SET order_index = ISNULL(@ORDERINDEX, order_index)
        WHERE ticket_id = @TICKETID;
    END
    ELSE
    BEGIN
        UPDATE dbo.TBL_TICKET
        SET status = @TOSTATUS,
            order_index = ISNULL(@ORDERINDEX, order_index),
            updated_at = @NOW,
            updated_by = @USERID,
            last_remark = CASE WHEN @REMARK <> '' THEN LEFT(@REMARK, 500) ELSE last_remark END
        WHERE ticket_id = @TICKETID;

        /* developer -> raiser; owner discarding -> the developers */
        INSERT INTO dbo.TBL_TICKET_EVENT
            (ticket_id, event_type, from_status, to_status, remark, by_cmpid, by_name, by_code, target_cmpid, at, seen, seen_at)
        SELECT @TICKETID, 'STATUS', @CUR, @TOSTATUS, NULLIF(@REMARK, ''), @USERID, @BYNAME, @BYCODE, g.cmpid, @NOW,
               CASE WHEN g.cmpid = @USERID THEN 1 ELSE 0 END,
               CASE WHEN g.cmpid = @USERID THEN @NOW ELSE NULL END
        FROM (SELECT @RAISEDBY AS cmpid WHERE @ISDEV = 1
              UNION
              SELECT cmpid FROM dbo.FN_TICKET_DEV_CMPIDS() WHERE @ISDEV = 0) g;
    END

    COMMIT TRAN;

    SELECT '100' AS STATUS, 'Ticket updated' AS MSG;
END
GO

/* ------------------------------------------------------------------ REASSIGN */
IF OBJECT_ID('dbo.USP_TICKET_REASSIGN', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_TICKET_REASSIGN;
GO
CREATE PROCEDURE dbo.USP_TICKET_REASSIGN
    @TICKETID   INT,
    @USERID     INT,
    @ASSIGNEDTO VARCHAR(5),       -- new assignee code P | S | N
    @ACTORCODE  VARCHAR(5) = ''
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @RAISEDBY INT;
    DECLARE @OLD CHAR(1);
    DECLARE @CUR VARCHAR(12);
    DECLARE @BYNAME VARCHAR(100);
    DECLARE @BYCODE CHAR(1);
    DECLARE @NEWNAME VARCHAR(100);
    DECLARE @REMARK VARCHAR(200);
    DECLARE @NOW DATETIME;
    SET @NOW = GETDATE();
    SET @ASSIGNEDTO = UPPER(LTRIM(RTRIM(ISNULL(@ASSIGNEDTO, ''))));
    SET @ACTORCODE = UPPER(LTRIM(RTRIM(ISNULL(@ACTORCODE, ''))));

    IF dbo.FN_TICKET_IS_DEV(@USERID) = 0
    BEGIN
        SELECT '104' AS STATUS, 'Only developers can reassign' AS MSG;
        RETURN;
    END

    SELECT @NEWNAME = display_name FROM dbo.FN_TICKET_ASSIGNEES() WHERE code = @ASSIGNEDTO;
    IF @NEWNAME IS NULL
    BEGIN
        SELECT '104' AS STATUS, 'Unknown assignee' AS MSG;
        RETURN;
    END

    SELECT @RAISEDBY = raised_by, @OLD = assigned_code, @CUR = status
    FROM dbo.TBL_TICKET WHERE ticket_id = @TICKETID;
    IF @RAISEDBY IS NULL
    BEGIN
        SELECT '104' AS STATUS, 'Ticket not found' AS MSG;
        RETURN;
    END
    IF ISNULL(@OLD, '') = @ASSIGNEDTO
    BEGIN
        SELECT '100' AS STATUS, 'Already assigned' AS MSG;
        RETURN;
    END

    SET @BYNAME = dbo.FN_TICKET_BY_NAME(@USERID, @ACTORCODE);
    SELECT @BYCODE = code FROM dbo.FN_TICKET_ASSIGNEES() WHERE code = @ACTORCODE;
    SET @REMARK = 'Assigned to ' + @NEWNAME;

    BEGIN TRAN;

    UPDATE dbo.TBL_TICKET
    SET assigned_code = @ASSIGNEDTO, updated_at = @NOW, updated_by = @USERID
    WHERE ticket_id = @TICKETID;

    /* the developers + the raiser */
    INSERT INTO dbo.TBL_TICKET_EVENT
        (ticket_id, event_type, from_status, to_status, remark, by_cmpid, by_name, by_code, target_cmpid, at, seen, seen_at)
    SELECT @TICKETID, 'ASSIGN', @CUR, @CUR, @REMARK, @USERID, @BYNAME, @BYCODE, g.cmpid, @NOW,
           CASE WHEN g.cmpid = @USERID THEN 1 ELSE 0 END,
           CASE WHEN g.cmpid = @USERID THEN @NOW ELSE NULL END
    FROM (SELECT cmpid FROM dbo.FN_TICKET_DEV_CMPIDS()
          UNION
          SELECT @RAISEDBY) g;

    COMMIT TRAN;

    SELECT '100' AS STATUS, 'Ticket reassigned' AS MSG;
END
GO

/* ------------------------------------------------------------------ COMMENT */
IF OBJECT_ID('dbo.USP_TICKET_COMMENT', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_TICKET_COMMENT;
GO
CREATE PROCEDURE dbo.USP_TICKET_COMMENT
    @TICKETID  INT,
    @USERID    INT,
    @USERNAME  VARCHAR(100),
    @TEXT      VARCHAR(MAX),
    @ACTORCODE VARCHAR(5) = ''
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @ISDEV BIT;
    DECLARE @RAISEDBY INT;
    DECLARE @CUR VARCHAR(12);
    DECLARE @BYNAME VARCHAR(100);
    DECLARE @BYCODE CHAR(1);
    DECLARE @NOW DATETIME;
    SET @NOW = GETDATE();
    SET @ISDEV = dbo.FN_TICKET_IS_DEV(@USERID);
    SET @TEXT = LTRIM(RTRIM(ISNULL(@TEXT, '')));
    SET @USERNAME = LTRIM(RTRIM(ISNULL(@USERNAME, '')));
    SET @ACTORCODE = UPPER(LTRIM(RTRIM(ISNULL(@ACTORCODE, ''))));

    IF @TEXT = ''
    BEGIN
        SELECT '104' AS STATUS, 'Comment text is required' AS MSG;
        RETURN;
    END

    SELECT @RAISEDBY = raised_by, @CUR = status
    FROM dbo.TBL_TICKET WHERE ticket_id = @TICKETID;
    IF @RAISEDBY IS NULL
    BEGIN
        SELECT '104' AS STATUS, 'Ticket not found' AS MSG;
        RETURN;
    END
    IF @ISDEV = 0 AND @RAISEDBY <> @USERID
    BEGIN
        SELECT '104' AS STATUS, 'Not your ticket' AS MSG;
        RETURN;
    END

    IF @ISDEV = 1
    BEGIN
        SELECT @BYCODE = code FROM dbo.FN_TICKET_ASSIGNEES() WHERE code = @ACTORCODE;
        SET @BYNAME = dbo.FN_TICKET_BY_NAME(@USERID, @ACTORCODE);
    END
    ELSE
    BEGIN
        SET @BYNAME = CASE WHEN @USERNAME <> '' THEN @USERNAME ELSE dbo.FN_TICKET_BY_NAME(@USERID, '') END;
    END

    BEGIN TRAN;

    UPDATE dbo.TBL_TICKET
    SET updated_at = @NOW, updated_by = @USERID, last_remark = LEFT(@TEXT, 500)
    WHERE ticket_id = @TICKETID;

    /* developer -> raiser; owner -> the developers */
    INSERT INTO dbo.TBL_TICKET_EVENT
        (ticket_id, event_type, from_status, to_status, remark, by_cmpid, by_name, by_code, target_cmpid, at, seen, seen_at)
    SELECT @TICKETID, 'COMMENT', @CUR, @CUR, @TEXT, @USERID, @BYNAME, @BYCODE, g.cmpid, @NOW,
           CASE WHEN g.cmpid = @USERID THEN 1 ELSE 0 END,
           CASE WHEN g.cmpid = @USERID THEN @NOW ELSE NULL END
    FROM (SELECT @RAISEDBY AS cmpid WHERE @ISDEV = 1
          UNION
          SELECT cmpid FROM dbo.FN_TICKET_DEV_CMPIDS() WHERE @ISDEV = 0) g;

    COMMIT TRAN;

    SELECT '100' AS STATUS, 'Comment added' AS MSG;
END
GO

/* ------------------------------------------------------------------ EVENTS */
IF OBJECT_ID('dbo.USP_TICKET_EVENTS', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_TICKET_EVENTS;
GO
CREATE PROCEDURE dbo.USP_TICKET_EVENTS
    @USERID     INT,
    @UNREADONLY BIT = 0,
    @TOP        INT = 50
AS
BEGIN
    SET NOCOUNT ON;

    IF ISNULL(@TOP, 0) <= 0 SET @TOP = 50;
    IF @TOP > 500 SET @TOP = 500;

    SELECT TOP (@TOP)
        e.event_id, e.ticket_id, t.ticket_no, t.subject, e.event_type, e.from_status, e.to_status,
        e.remark, e.by_name, e.at, e.seen
    FROM dbo.TBL_TICKET_EVENT e
    INNER JOIN dbo.TBL_TICKET t ON t.ticket_id = e.ticket_id
    WHERE e.target_cmpid = @USERID
      AND (ISNULL(@UNREADONLY, 0) = 0 OR e.seen = 0)
    ORDER BY e.at DESC, e.event_id DESC;

    SELECT COUNT(*) AS UNREAD
    FROM dbo.TBL_TICKET_EVENT
    WHERE target_cmpid = @USERID AND seen = 0;
END
GO

/* ------------------------------------------------------------------ EVENTS_SEEN */
IF OBJECT_ID('dbo.USP_TICKET_EVENTS_SEEN', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_TICKET_EVENTS_SEEN;
GO
CREATE PROCEDURE dbo.USP_TICKET_EVENTS_SEEN
    @USERID   INT,
    @TICKETID INT = 0     -- 0 = all tickets
AS
BEGIN
    SET NOCOUNT ON;

    UPDATE dbo.TBL_TICKET_EVENT
    SET seen = 1, seen_at = GETDATE()
    WHERE target_cmpid = @USERID
      AND seen = 0
      AND (ISNULL(@TICKETID, 0) = 0 OR ticket_id = @TICKETID);

    SELECT '100' AS STATUS, 'Marked as seen' AS MSG;
END
GO

/* ------------------------------------------------------------------ STATS (developer dashboard, contract v3) */
IF OBJECT_ID('dbo.USP_TICKET_STATS', 'P') IS NOT NULL DROP PROCEDURE dbo.USP_TICKET_STATS;
GO
CREATE PROCEDURE dbo.USP_TICKET_STATS
    @USERID INT
AS
BEGIN
    SET NOCOUNT ON;

    IF dbo.FN_TICKET_IS_DEV(@USERID) = 0
    BEGIN
        SELECT '104' AS STATUS, 'Developers only' AS MSG;
        RETURN;
    END

    DECLARE @NOW DATETIME;
    DECLARE @D7 DATETIME;
    DECLARE @D30 DATETIME;
    DECLARE @WK0 DATETIME;
    SET @NOW = GETDATE();
    SET @D7 = DATEADD(DAY, -7, @NOW);
    SET @D30 = DATEADD(DAY, -30, @NOW);
    /* Monday of the current week (day 0 = 1900-01-01 was a Monday) */
    SET @WK0 = DATEADD(DAY, (DATEDIFF(DAY, 0, @NOW) / 7) * 7, 0);

    /* one row per ticket; resolved_at only for COMPLETED */
    SELECT t.ticket_id, t.status, t.assigned_code, t.raised_city, t.raised_at,
           CASE WHEN t.status = 'COMPLETED'
                THEN ISNULL((SELECT MAX(e.at) FROM dbo.TBL_TICKET_EVENT e
                             WHERE e.ticket_id = t.ticket_id AND e.event_type = 'STATUS' AND e.to_status = 'COMPLETED'),
                            t.updated_at)
                ELSE NULL END AS resolved_at
    INTO #T
    FROM dbo.TBL_TICKET t;

    /* Table: totals */
    SELECT
        SUM(CASE WHEN status IN ('RAISED', 'INPROGRESS') THEN 1 ELSE 0 END) AS [OPEN],
        SUM(CASE WHEN status = 'RAISED' THEN 1 ELSE 0 END) AS RAISED,
        SUM(CASE WHEN status = 'INPROGRESS' THEN 1 ELSE 0 END) AS INPROGRESS,
        SUM(CASE WHEN resolved_at >= @D7 THEN 1 ELSE 0 END) AS RESOLVED_7D,
        SUM(CASE WHEN resolved_at >= @D30 THEN 1 ELSE 0 END) AS RESOLVED_30D,
        SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS RESOLVED_ALL,
        SUM(CASE WHEN status = 'DISCARDED' THEN 1 ELSE 0 END) AS DISCARDED_ALL,
        SUM(CASE WHEN raised_at >= @D7 THEN 1 ELSE 0 END) AS RAISED_7D,
        SUM(CASE WHEN raised_at >= @D30 THEN 1 ELSE 0 END) AS RAISED_30D,
        CONVERT(DECIMAL(9,1), AVG(CASE WHEN resolved_at >= @D30
                                       THEN CONVERT(DECIMAL(18,2), DATEDIFF(MINUTE, raised_at, resolved_at)) END) / 60.0) AS AVG_RESOLVE_HOURS_30D,
        MAX(CASE WHEN status IN ('RAISED', 'INPROGRESS') THEN DATEDIFF(DAY, raised_at, @NOW) END) AS OLDEST_OPEN_DAYS
    INTO #TOT
    FROM #T;

    SELECT ISNULL([OPEN], 0) AS [OPEN], ISNULL(RAISED, 0) AS RAISED, ISNULL(INPROGRESS, 0) AS INPROGRESS,
           ISNULL(RESOLVED_7D, 0) AS RESOLVED_7D, ISNULL(RESOLVED_30D, 0) AS RESOLVED_30D,
           ISNULL(RESOLVED_ALL, 0) AS RESOLVED_ALL, ISNULL(DISCARDED_ALL, 0) AS DISCARDED_ALL,
           ISNULL(RAISED_7D, 0) AS RAISED_7D, ISNULL(RAISED_30D, 0) AS RAISED_30D,
           AVG_RESOLVE_HOURS_30D, OLDEST_OPEN_DAYS
    FROM #TOT;

    /* Table1: per assignee */
    SELECT
        a.code, a.display_name,
        ISNULL(SUM(CASE WHEN t.status IN ('RAISED', 'INPROGRESS') THEN 1 ELSE 0 END), 0) AS [open],
        ISNULL(SUM(CASE WHEN t.status = 'INPROGRESS' THEN 1 ELSE 0 END), 0) AS inprogress,
        ISNULL(SUM(CASE WHEN t.resolved_at >= @D30 THEN 1 ELSE 0 END), 0) AS resolved_30d,
        ISNULL(SUM(CASE WHEN t.status = 'COMPLETED' THEN 1 ELSE 0 END), 0) AS resolved_all,
        CONVERT(DECIMAL(9,1), AVG(CASE WHEN t.resolved_at >= @D30
                                       THEN CONVERT(DECIMAL(18,2), DATEDIFF(MINUTE, t.raised_at, t.resolved_at)) END) / 60.0) AS avg_resolve_hours_30d
    FROM dbo.FN_TICKET_ASSIGNEES() a
    LEFT JOIN #T t ON t.assigned_code = a.code
    GROUP BY a.code, a.display_name, a.sort_order
    ORDER BY a.sort_order;

    /* Table2: last 8 weeks (Monday start), oldest first, zero-filled */
    SELECT
        w.week_start,
        (SELECT COUNT(*) FROM #T t WHERE t.raised_at >= w.week_start AND t.raised_at < DATEADD(DAY, 7, w.week_start)) AS raised,
        (SELECT COUNT(*) FROM #T t WHERE t.resolved_at >= w.week_start AND t.resolved_at < DATEADD(DAY, 7, w.week_start)) AS resolved
    FROM (SELECT DATEADD(WEEK, -n.n, @WK0) AS week_start
          FROM (SELECT 0 AS n UNION ALL SELECT 1 UNION ALL SELECT 2 UNION ALL SELECT 3
                UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7) n) w
    ORDER BY w.week_start;

    /* Table3: per branch, top 10 by open */
    SELECT TOP 10
        ISNULL(raised_city, '') AS raised_city,
        SUM(CASE WHEN status IN ('RAISED', 'INPROGRESS') THEN 1 ELSE 0 END) AS [open],
        SUM(CASE WHEN resolved_at >= @D30 THEN 1 ELSE 0 END) AS resolved_30d
    FROM #T
    GROUP BY ISNULL(raised_city, '')
    ORDER BY [open] DESC, resolved_30d DESC, raised_city;

    DROP TABLE #T;
    DROP TABLE #TOT;
END
GO

SET NOEXEC OFF;
GO

/* ---- 5. verify (read-only) --------------------------------------------------------------- */
DECLARE @missing TABLE (name SYSNAME);
INSERT INTO @missing (name)
SELECT x.name
  FROM (          SELECT 'TBL_TICKET' name,         'U'  typ
        UNION ALL SELECT 'TBL_TICKET_FILE',          'U'
        UNION ALL SELECT 'TBL_TICKET_EVENT',         'U'
        UNION ALL SELECT 'FN_TICKET_DEV_MAILS',      'IF'
        UNION ALL SELECT 'FN_TICKET_ASSIGNEES',      'IF'
        UNION ALL SELECT 'FN_TICKET_IS_DEV',         'FN'
        UNION ALL SELECT 'FN_TICKET_DEV_CMPIDS',     'IF'
        UNION ALL SELECT 'FN_TICKET_BY_NAME',        'FN'
        UNION ALL SELECT 'USP_TICKET_BOOTSTRAP',     'P'
        UNION ALL SELECT 'USP_TICKET_LIST',          'P'
        UNION ALL SELECT 'USP_TICKET_IU',            'P'
        UNION ALL SELECT 'USP_TICKET_FILE_ADD',      'P'
        UNION ALL SELECT 'USP_TICKET_FILE_DEL',      'P'
        UNION ALL SELECT 'USP_TICKET_FILE_GET',      'P'
        UNION ALL SELECT 'USP_TICKET_GET',           'P'
        UNION ALL SELECT 'USP_TICKET_MOVE',          'P'
        UNION ALL SELECT 'USP_TICKET_REASSIGN',      'P'
        UNION ALL SELECT 'USP_TICKET_COMMENT',       'P'
        UNION ALL SELECT 'USP_TICKET_EVENTS',        'P'
        UNION ALL SELECT 'USP_TICKET_EVENTS_SEEN',   'P'
        UNION ALL SELECT 'USP_TICKET_STATS',         'P') x
 WHERE OBJECT_ID('dbo.' + x.name, x.typ) IS NULL;

IF UPPER(DB_NAME()) <> 'LINKSDB20'
BEGIN
    PRINT '*** Connected to ' + DB_NAME() + ', not LinksDB20 - nothing was created; verification skipped.';
    SET NOEXEC ON;
END
ELSE IF EXISTS (SELECT 1 FROM @missing)
BEGIN
    PRINT '*** Ticket objects missing on ' + DB_NAME() + ' - see the messages above:';
    SELECT name AS missing_object FROM @missing ORDER BY name;
    SET NOEXEC ON;     -- skip the checks below (they use these objects)
END
ELSE
    PRINT 'Tickets module is in place on ' + DB_NAME() + ' (3 tables, 5 functions, 13 procedures).';
GO

/* the developer logins the list resolves to (expect PDG, cmpid 1) */
DECLARE @dev INT;
SELECT c.cmpid, RTRIM(c.cmp_username) AS login_name, RTRIM(c.fullname) AS fullname
  FROM dbo.CMP_DTLS c
 WHERE c.cmpid IN (SELECT cmpid FROM dbo.FN_TICKET_DEV_CMPIDS())
 ORDER BY c.cmpid;
SELECT @dev = MIN(cmpid) FROM dbo.FN_TICKET_DEV_CMPIDS();
IF @dev IS NULL
    PRINT '*** WARNING: no CMP_DTLS login has a mail listed in FN_TICKET_DEV_MAILS - nobody can work the board and no developer is notified. Fix the function and re-run.';
ELSE
BEGIN
    SELECT (SELECT COUNT(*) FROM dbo.TBL_TICKET) AS TICKETS,
           (SELECT COUNT(*) FROM dbo.TBL_TICKET_FILE) AS FILES,
           (SELECT COUNT(*) FROM dbo.TBL_TICKET_EVENT) AS EVENTS;
    EXEC dbo.USP_TICKET_BOOTSTRAP @USERID = @dev;     -- read-only: assignees P/S/N + IS_DEVELOPER = 1
    PRINT 'API contract: api/Tickets/Bootstrap|List|Create|Get|Move|Reassign|Comment|Stats|Events|EventsSeen (POST), File/{id} (GET); userId = CMP_DTLS.cmpid.';
END
GO

SET NOEXEC OFF;
GO
