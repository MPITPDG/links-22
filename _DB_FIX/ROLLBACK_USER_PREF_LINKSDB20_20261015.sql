/*  Rollback for USER_PREF_LINKSDB20_20261015.sql (LinksDB20 only).
    None of the three objects existed on LinksDB20 before, so rollback is a drop.
    After it, api/Common/UserPref/Get|Set return an error row (STATUS 101) and the Links theme
    picker quietly falls back to the theme saved in the browser - nothing else is affected.

    The two procedures are always dropped. The table holds users' saved themes, so it is dropped
    only when it is empty. If it has rows the script leaves it and says how many; set
    @DropTableEvenIfNotEmpty = 1 below to discard those saved themes as well.
    Re-runnable.  SQL Server 2008 R2.                                                       */
USE [LinksDB20]
GO
SET NOCOUNT ON;

DECLARE @DropTableEvenIfNotEmpty BIT = 0;      -- 0 = keep the table if it has rows, 1 = drop it regardless
DECLARE @rows INT;

-- never drop these names anywhere else (e.g. the Manilal database has live copies of them)
IF UPPER(DB_NAME()) <> 'LINKSDB20'
BEGIN
    PRINT '*** Connected to ' + DB_NAME() + ', not LinksDB20. Nothing done.';
    RETURN;
END

IF OBJECT_ID('dbo.USP_USER_PREF_GET', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.USP_USER_PREF_GET;
    PRINT 'USP_USER_PREF_GET dropped from ' + DB_NAME() + '.';
END
ELSE
    PRINT 'USP_USER_PREF_GET not present - nothing to do.';

IF OBJECT_ID('dbo.USP_USER_PREF_SET', 'P') IS NOT NULL
BEGIN
    DROP PROCEDURE dbo.USP_USER_PREF_SET;
    PRINT 'USP_USER_PREF_SET dropped from ' + DB_NAME() + '.';
END
ELSE
    PRINT 'USP_USER_PREF_SET not present - nothing to do.';

IF OBJECT_ID('dbo.TBL_USER_PREF', 'U') IS NOT NULL
BEGIN
    SELECT @rows = COUNT(*) FROM dbo.TBL_USER_PREF;
    IF @rows = 0 OR @DropTableEvenIfNotEmpty = 1
    BEGIN
        DROP TABLE dbo.TBL_USER_PREF;
        PRINT 'TBL_USER_PREF dropped from ' + DB_NAME() + ' (' + CAST(@rows AS VARCHAR(10)) + ' row(s) discarded).';
    END
    ELSE
        PRINT 'TBL_USER_PREF kept: it holds ' + CAST(@rows AS VARCHAR(10)) + ' saved preference row(s). Set @DropTableEvenIfNotEmpty = 1 and re-run to drop it.';
END
ELSE
    PRINT 'TBL_USER_PREF not present - nothing to do.';
GO
