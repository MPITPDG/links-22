/*===============================================================================================
  USER_PREF_LINKSDB20_20261015.sql         (LinksDB20)

  Why  : the Links front end's theme picker saves the chosen theme per login. It calls the
         Links API  POST api/Common/UserPref/Get  and  /Set  (UserPrefController), which run
         USP_USER_PREF_GET / USP_USER_PREF_SET against the table below. None of the three
         exist on LinksDB20 yet. Copied from the Manilal / MP Cargo store
         (ManilalV5_WebApi\Database\StoredProcedures\Common\UserPref\ALL_IN_ONE.sql), unchanged
         apart from this header and the prerequisite checks.

  Creates:
    dbo.TBL_USER_PREF        cmpid INT, pref_key VARCHAR(50), pref_value VARCHAR(500) NULL,
                             updated_at DATETIME (default GETDATE()); PK (cmpid, pref_key).
                             cmpid is the login id = CMP_DTLS.cmpid (INT). No foreign key, same
                             as the Manilal copy (CMP_DTLS.cmpid has no unique index to point at).
    dbo.USP_USER_PREF_GET    @CMPID INT, @KEY VARCHAR(50) = NULL
                             -> PREF_KEY, PREF_VALUE, UPDATED_AT (one key, or all when @KEY is NULL)
    dbo.USP_USER_PREF_SET    @CMPID INT, @KEY VARCHAR(50), @VALUE VARCHAR(500)
                             -> STATUS, MSG   ('100' saved / cleared, '104' bad input);
                                empty or NULL @VALUE deletes that preference row.

  Safety : step 1 checks everything the objects depend on and stops before creating anything
           if one is missing or if a name is already taken by something else. The table is
           created only when it does not exist (rows are never touched on a re-run); the two
           procedures are dropped and recreated. Nothing here reads or changes any existing
           business table. Re-runnable.
  Rollback: ROLLBACK_USER_PREF_LINKSDB20_20261015.sql
  SQL Server 2008 R2.
===============================================================================================*/
USE [LinksDB20]
GO
SET NOCOUNT ON;

/* ---- 1. prerequisites ------------------------------------------------------------------ */
DECLARE @problems TABLE (n INT IDENTITY(1,1), problem VARCHAR(400));

-- 1a. we must really be on LinksDB20 (if USE failed above the session is still in another DB)
IF UPPER(DB_NAME()) <> 'LINKSDB20'
    INSERT INTO @problems (problem) VALUES ('Connected to ' + DB_NAME() + ', not LinksDB20.');

-- 1b. the login table the key refers to: CMP_DTLS.cmpid INT
IF NOT EXISTS (SELECT 1
                 FROM sys.columns c
                 JOIN sys.types   t ON t.user_type_id = c.user_type_id
                WHERE c.object_id = OBJECT_ID('dbo.CMP_DTLS')
                  AND c.name = 'cmpid' AND t.name = 'int')
    INSERT INTO @problems (problem) VALUES ('dbo.CMP_DTLS.cmpid (INT) not found - the key would not match the login id.');

-- 1c. permissions to create the objects
IF ISNULL(HAS_PERMS_BY_NAME(DB_NAME(), 'DATABASE', 'CREATE TABLE'), 0) = 0
    INSERT INTO @problems (problem) VALUES ('No CREATE TABLE permission on ' + DB_NAME() + '.');
IF ISNULL(HAS_PERMS_BY_NAME(DB_NAME(), 'DATABASE', 'CREATE PROCEDURE'), 0) = 0
    INSERT INTO @problems (problem) VALUES ('No CREATE PROCEDURE permission on ' + DB_NAME() + '.');

-- 1d. TBL_USER_PREF: absent (will be created) or already the exact shape the procedures expect
IF OBJECT_ID('dbo.TBL_USER_PREF') IS NOT NULL AND OBJECT_ID('dbo.TBL_USER_PREF', 'U') IS NULL
    INSERT INTO @problems (problem) VALUES ('dbo.TBL_USER_PREF exists but is not a table.');

IF OBJECT_ID('dbo.TBL_USER_PREF', 'U') IS NOT NULL
BEGIN
    INSERT INTO @problems (problem)
    SELECT 'dbo.TBL_USER_PREF.' + x.col + ' should be ' + x.typ + '(' + CAST(x.len AS VARCHAR(10)) + ') but is missing or different.'
      FROM (          SELECT 'cmpid'      col, 'int'      typ, 4   len
            UNION ALL SELECT 'pref_key',      'varchar',       50
            UNION ALL SELECT 'pref_value',    'varchar',       500
            UNION ALL SELECT 'updated_at',    'datetime',      8   ) x
     WHERE NOT EXISTS (SELECT 1
                         FROM sys.columns c
                         JOIN sys.types   t ON t.user_type_id = c.user_type_id
                        WHERE c.object_id = OBJECT_ID('dbo.TBL_USER_PREF')
                          AND c.name = x.col AND t.name = x.typ AND c.max_length = x.len);

    IF NOT EXISTS (SELECT 1 FROM sys.indexes
                    WHERE object_id = OBJECT_ID('dbo.TBL_USER_PREF') AND is_primary_key = 1)
        INSERT INTO @problems (problem) VALUES ('dbo.TBL_USER_PREF has no primary key (cmpid, pref_key) - duplicates would be possible.');
END
ELSE IF EXISTS (SELECT 1 FROM sys.objects
                 WHERE name IN ('PK_TBL_USER_PREF', 'DF_TBL_USER_PREF_UPDATED_AT'))
    INSERT INTO @problems (problem) VALUES ('Constraint name PK_TBL_USER_PREF or DF_TBL_USER_PREF_UPDATED_AT is already used by another object.');

-- 1e. procedure names must be free, or be procedures (those are dropped and recreated)
IF OBJECT_ID('dbo.USP_USER_PREF_GET') IS NOT NULL AND OBJECT_ID('dbo.USP_USER_PREF_GET', 'P') IS NULL
    INSERT INTO @problems (problem) VALUES ('dbo.USP_USER_PREF_GET exists but is not a stored procedure.');
IF OBJECT_ID('dbo.USP_USER_PREF_SET') IS NOT NULL AND OBJECT_ID('dbo.USP_USER_PREF_SET', 'P') IS NULL
    INSERT INTO @problems (problem) VALUES ('dbo.USP_USER_PREF_SET exists but is not a stored procedure.');

IF EXISTS (SELECT 1 FROM @problems)
BEGIN
    PRINT '*** Prerequisite check failed on ' + DB_NAME() + ' - NOTHING was created:';
    SELECT n AS [#], problem FROM @problems ORDER BY n;
    RAISERROR('Prerequisite check failed - see the list above.', 16, 1);
    SET NOEXEC ON;     -- skip the rest of the script, including the CREATEs below
END
ELSE
    PRINT 'Prerequisites OK on ' + DB_NAME() + '.';
GO

/* ---- 2. the table (only when absent; existing rows are never touched) -------------------- */
IF OBJECT_ID('dbo.TBL_USER_PREF', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TBL_USER_PREF (
        cmpid      INT          NOT NULL,
        pref_key   VARCHAR(50)  NOT NULL,
        pref_value VARCHAR(500) NULL,
        updated_at DATETIME     NOT NULL CONSTRAINT DF_TBL_USER_PREF_UPDATED_AT DEFAULT GETDATE(),
        CONSTRAINT PK_TBL_USER_PREF PRIMARY KEY (cmpid, pref_key)
    );
    PRINT 'TBL_USER_PREF created.';
END
ELSE
    PRINT 'TBL_USER_PREF already exists with the expected shape - left as it is.';
GO

/* ---- 3. USP_USER_PREF_GET ---------------------------------------------------------------- */
IF OBJECT_ID('dbo.USP_USER_PREF_GET', 'P') IS NOT NULL
    DROP PROCEDURE dbo.USP_USER_PREF_GET;
GO
CREATE PROCEDURE dbo.USP_USER_PREF_GET
    @CMPID INT,
    @KEY   VARCHAR(50) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    SELECT pref_key AS PREF_KEY, pref_value AS PREF_VALUE, updated_at AS UPDATED_AT
    FROM dbo.TBL_USER_PREF
    WHERE cmpid = @CMPID
      AND (@KEY IS NULL OR pref_key = @KEY)
    ORDER BY pref_key;
END
GO

/* ---- 4. USP_USER_PREF_SET ---------------------------------------------------------------- */
IF OBJECT_ID('dbo.USP_USER_PREF_SET', 'P') IS NOT NULL
    DROP PROCEDURE dbo.USP_USER_PREF_SET;
GO
CREATE PROCEDURE dbo.USP_USER_PREF_SET
    @CMPID INT,
    @KEY   VARCHAR(50),
    @VALUE VARCHAR(500)
AS
BEGIN
    SET NOCOUNT ON;

    IF @CMPID IS NULL OR @CMPID <= 0 OR @KEY IS NULL OR LTRIM(RTRIM(@KEY)) = ''
    BEGIN
        SELECT '104' AS STATUS, 'cmpid and key are required' AS MSG;
        RETURN;
    END

    IF @VALUE IS NULL OR @VALUE = ''
    BEGIN
        DELETE FROM dbo.TBL_USER_PREF WHERE cmpid = @CMPID AND pref_key = @KEY;
        SELECT '100' AS STATUS, 'Preference cleared' AS MSG;
        RETURN;
    END

    UPDATE dbo.TBL_USER_PREF
       SET pref_value = @VALUE, updated_at = GETDATE()
     WHERE cmpid = @CMPID AND pref_key = @KEY;

    IF @@ROWCOUNT = 0
        INSERT INTO dbo.TBL_USER_PREF (cmpid, pref_key, pref_value, updated_at)
        VALUES (@CMPID, @KEY, @VALUE, GETDATE());

    SELECT '100' AS STATUS, 'Preference saved' AS MSG;
END
GO

SET NOEXEC OFF;
GO

/* ---- 5. verify (read-only) --------------------------------------------------------------- */
IF OBJECT_ID('dbo.TBL_USER_PREF', 'U') IS NOT NULL
   AND OBJECT_ID('dbo.USP_USER_PREF_GET', 'P') IS NOT NULL
   AND OBJECT_ID('dbo.USP_USER_PREF_SET', 'P') IS NOT NULL
BEGIN
    PRINT 'User preference store is in place on ' + DB_NAME() + ' (TBL_USER_PREF, USP_USER_PREF_GET, USP_USER_PREF_SET).';
    SELECT COUNT(*) AS PREF_ROWS FROM dbo.TBL_USER_PREF;
    EXEC dbo.USP_USER_PREF_GET @CMPID = 1;          -- read-only; empty until someone saves a theme
    PRINT 'API contract: POST api/Common/UserPref/Get {userId, key}  and  /Set {userId, key, value}; userId = CMP_DTLS.cmpid.';
END
ELSE
    PRINT '*** One or more user-preference objects are missing on ' + DB_NAME() + ' - see the messages above.';
GO
