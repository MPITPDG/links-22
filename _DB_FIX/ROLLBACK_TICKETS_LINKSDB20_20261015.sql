/*  Rollback for TICKETS_LINKSDB20_20261015.sql (LinksDB20 only).
    None of these objects existed on LinksDB20 before, so rollback is a drop.
    After it, every api/Tickets/... call returns an error row (STATUS 101) and the Links tickets
    board shows nothing; nothing else in Links uses these objects.

    The 13 procedures and 5 functions are always dropped (they hold no data).
    The 3 tables hold the raised tickets, their attachments list and their history, so they are
    dropped only when ALL THREE are empty. If any has rows the script keeps all three and says
    how many rows each has; set @DropTablesEvenIfNotEmpty = 1 below to discard those tickets too.
    Re-running the deploy script afterwards recreates the procedures and functions around the
    kept tables.

    Files on disk are not touched: uploaded attachments stay under
    <Links API site root>\DATA\Tickets\ until someone deletes that folder by hand.

    Never touches the 2018 tbl_ticket_raise / USP_TICKET_RAISE_* objects.
    Re-runnable.  SQL Server 2008 R2.                                                       */
USE [LinksDB20]
GO
SET NOCOUNT ON;

DECLARE @DropTablesEvenIfNotEmpty BIT;
SET @DropTablesEvenIfNotEmpty = 0;      -- 0 = keep the tables if any of them has rows, 1 = drop them regardless

DECLARE @tickets INT, @files INT, @events INT;

-- never drop these names anywhere else: the manilal database has the live MP Cargo copies of them
IF UPPER(DB_NAME()) <> 'LINKSDB20'
BEGIN
    PRINT '*** Connected to ' + DB_NAME() + ', not LinksDB20. Nothing done.';
    RETURN;
END

/* ---- procedures ---- */
IF OBJECT_ID('dbo.USP_TICKET_BOOTSTRAP', 'P') IS NOT NULL   BEGIN DROP PROCEDURE dbo.USP_TICKET_BOOTSTRAP;   PRINT 'USP_TICKET_BOOTSTRAP dropped.';   END
IF OBJECT_ID('dbo.USP_TICKET_LIST', 'P') IS NOT NULL        BEGIN DROP PROCEDURE dbo.USP_TICKET_LIST;        PRINT 'USP_TICKET_LIST dropped.';        END
IF OBJECT_ID('dbo.USP_TICKET_IU', 'P') IS NOT NULL          BEGIN DROP PROCEDURE dbo.USP_TICKET_IU;          PRINT 'USP_TICKET_IU dropped.';          END
IF OBJECT_ID('dbo.USP_TICKET_FILE_ADD', 'P') IS NOT NULL    BEGIN DROP PROCEDURE dbo.USP_TICKET_FILE_ADD;    PRINT 'USP_TICKET_FILE_ADD dropped.';    END
IF OBJECT_ID('dbo.USP_TICKET_FILE_DEL', 'P') IS NOT NULL    BEGIN DROP PROCEDURE dbo.USP_TICKET_FILE_DEL;    PRINT 'USP_TICKET_FILE_DEL dropped.';    END
IF OBJECT_ID('dbo.USP_TICKET_FILE_GET', 'P') IS NOT NULL    BEGIN DROP PROCEDURE dbo.USP_TICKET_FILE_GET;    PRINT 'USP_TICKET_FILE_GET dropped.';    END
IF OBJECT_ID('dbo.USP_TICKET_GET', 'P') IS NOT NULL         BEGIN DROP PROCEDURE dbo.USP_TICKET_GET;         PRINT 'USP_TICKET_GET dropped.';         END
IF OBJECT_ID('dbo.USP_TICKET_MOVE', 'P') IS NOT NULL        BEGIN DROP PROCEDURE dbo.USP_TICKET_MOVE;        PRINT 'USP_TICKET_MOVE dropped.';        END
IF OBJECT_ID('dbo.USP_TICKET_REASSIGN', 'P') IS NOT NULL    BEGIN DROP PROCEDURE dbo.USP_TICKET_REASSIGN;    PRINT 'USP_TICKET_REASSIGN dropped.';    END
IF OBJECT_ID('dbo.USP_TICKET_COMMENT', 'P') IS NOT NULL     BEGIN DROP PROCEDURE dbo.USP_TICKET_COMMENT;     PRINT 'USP_TICKET_COMMENT dropped.';     END
IF OBJECT_ID('dbo.USP_TICKET_EVENTS', 'P') IS NOT NULL      BEGIN DROP PROCEDURE dbo.USP_TICKET_EVENTS;      PRINT 'USP_TICKET_EVENTS dropped.';      END
IF OBJECT_ID('dbo.USP_TICKET_EVENTS_SEEN', 'P') IS NOT NULL BEGIN DROP PROCEDURE dbo.USP_TICKET_EVENTS_SEEN; PRINT 'USP_TICKET_EVENTS_SEEN dropped.'; END
IF OBJECT_ID('dbo.USP_TICKET_STATS', 'P') IS NOT NULL       BEGIN DROP PROCEDURE dbo.USP_TICKET_STATS;       PRINT 'USP_TICKET_STATS dropped.';       END

/* ---- functions (dependants first) ---- */
IF OBJECT_ID('dbo.FN_TICKET_BY_NAME', 'FN') IS NOT NULL     BEGIN DROP FUNCTION dbo.FN_TICKET_BY_NAME;       PRINT 'FN_TICKET_BY_NAME dropped.';      END
IF OBJECT_ID('dbo.FN_TICKET_DEV_CMPIDS', 'IF') IS NOT NULL  BEGIN DROP FUNCTION dbo.FN_TICKET_DEV_CMPIDS;    PRINT 'FN_TICKET_DEV_CMPIDS dropped.';   END
IF OBJECT_ID('dbo.FN_TICKET_IS_DEV', 'FN') IS NOT NULL      BEGIN DROP FUNCTION dbo.FN_TICKET_IS_DEV;        PRINT 'FN_TICKET_IS_DEV dropped.';       END
IF OBJECT_ID('dbo.FN_TICKET_DEV_MAILS', 'IF') IS NOT NULL   BEGIN DROP FUNCTION dbo.FN_TICKET_DEV_MAILS;     PRINT 'FN_TICKET_DEV_MAILS dropped.';    END
IF OBJECT_ID('dbo.FN_TICKET_ASSIGNEES', 'IF') IS NOT NULL   BEGIN DROP FUNCTION dbo.FN_TICKET_ASSIGNEES;     PRINT 'FN_TICKET_ASSIGNEES dropped.';    END

/* ---- tables: all three together, and only when empty (or when forced) ---- */
SET @tickets = 0; SET @files = 0; SET @events = 0;
IF OBJECT_ID('dbo.TBL_TICKET', 'U') IS NOT NULL       SELECT @tickets = COUNT(*) FROM dbo.TBL_TICKET;
IF OBJECT_ID('dbo.TBL_TICKET_FILE', 'U') IS NOT NULL  SELECT @files   = COUNT(*) FROM dbo.TBL_TICKET_FILE;
IF OBJECT_ID('dbo.TBL_TICKET_EVENT', 'U') IS NOT NULL SELECT @events  = COUNT(*) FROM dbo.TBL_TICKET_EVENT;

IF OBJECT_ID('dbo.TBL_TICKET', 'U') IS NULL
   AND OBJECT_ID('dbo.TBL_TICKET_FILE', 'U') IS NULL
   AND OBJECT_ID('dbo.TBL_TICKET_EVENT', 'U') IS NULL
    PRINT 'Ticket tables not present - nothing to do.';
ELSE IF @tickets + @files + @events = 0 OR @DropTablesEvenIfNotEmpty = 1
BEGIN
    IF OBJECT_ID('dbo.TBL_TICKET_EVENT', 'U') IS NOT NULL BEGIN DROP TABLE dbo.TBL_TICKET_EVENT; PRINT 'TBL_TICKET_EVENT dropped (' + CAST(@events AS VARCHAR(10)) + ' row(s) discarded).'; END
    IF OBJECT_ID('dbo.TBL_TICKET_FILE', 'U') IS NOT NULL  BEGIN DROP TABLE dbo.TBL_TICKET_FILE;  PRINT 'TBL_TICKET_FILE dropped (' + CAST(@files AS VARCHAR(10)) + ' row(s) discarded).';   END
    IF OBJECT_ID('dbo.TBL_TICKET', 'U') IS NOT NULL       BEGIN DROP TABLE dbo.TBL_TICKET;       PRINT 'TBL_TICKET dropped (' + CAST(@tickets AS VARCHAR(10)) + ' row(s) discarded).';      END
    IF @files > 0
        PRINT 'Attachment files are still on disk under <Links API site root>\DATA\Tickets\ - delete that folder by hand if they are no longer wanted.';
END
ELSE
BEGIN
    PRINT '*** Ticket tables KEPT: TBL_TICKET has ' + CAST(@tickets AS VARCHAR(10)) + ' row(s), TBL_TICKET_FILE '
          + CAST(@files AS VARCHAR(10)) + ', TBL_TICKET_EVENT ' + CAST(@events AS VARCHAR(10)) + '.';
    PRINT '    Set @DropTablesEvenIfNotEmpty = 1 at the top and re-run to discard those tickets as well.';
END
GO
