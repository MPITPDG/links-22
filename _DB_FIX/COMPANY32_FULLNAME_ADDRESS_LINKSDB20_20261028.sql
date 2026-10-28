/*===============================================================================================
  COMPANY32_FULLNAME_ADDRESS_LINKSDB20_20261028.sql                       (LinksDB20)

  Why    : Company 32 (OCEAN LINKS SHIPPING PVT. LTD., MUM) has no cmp_fullname in cmp_address, so the prints
           that read it come out short: the Tax Invoice header said "Ocean Links Shipping" and the Proforma
           signature line reads "For " with no name. Its address line also says "601/602, Star Hub" where the
           office is 601 only. This sets, on the company 32 / MUM row only (PK_id 11):
             cmp_fullname  NULL                            ->  'OCEAN LINKS SHIPPING PVT. LTD.'
             cmp_add1      '601/602, Star Hub, Tower 1,'   ->  '601, Star Hub, Tower 1,'
           75 procedures read cmp_fullname (invoice, proforma, credit note, MIS headers ...); for company 32
           they now print the full name, as they already do for company 30. Companies 30 and 31 keep their
           "601/602" address. The letterhead image HEADER_OCEAN_LINKS.JPG is not touched.
  Safety : stops before changing anything unless the database is LinksDB20, the login may update cmp_address,
           and exactly one company 32 / MUM row holds the old values. One transaction; it checks that exactly
           one row changed. Re-runnable: when the new values are already there it says so and changes nothing.
           ROLLBACK_COMPANY32_FULLNAME_ADDRESS_LINKSDB20_20261028.sql puts the old values back.
  Run as : any login that may update dbo.cmp_address. SQL Server 2008 R2.
===============================================================================================*/
USE [LinksDB20]
GO
SET NOCOUNT ON;
GO

/* ---- 1. checks (read-only) -------------------------------------------------------------------- */
SET NOEXEC OFF;
IF DB_NAME() <> 'LinksDB20'
BEGIN
    PRINT '*** Connected to ' + DB_NAME() + ', not LinksDB20 - NOTHING was changed.';
    RAISERROR('Wrong database.', 16, 1);
    SET NOEXEC ON;
END
GO

DECLARE @rows INT, @old INT, @new INT;
SELECT @rows = COUNT(*),
       @old  = SUM(CASE WHEN cmp_fullname IS NULL AND cmp_add1 = '601/602, Star Hub, Tower 1,' THEN 1 ELSE 0 END),
       @new  = SUM(CASE WHEN RTRIM(cmp_fullname) = 'OCEAN LINKS SHIPPING PVT. LTD.' AND cmp_add1 = '601, Star Hub, Tower 1,' THEN 1 ELSE 0 END)
  FROM dbo.cmp_address
 WHERE cmp_code = '32' AND RTRIM(cmp_city) = 'MUM';

IF @rows = 1 AND @new = 1
BEGIN
    PRINT 'Company 32 / MUM already has the full name and the 601 address - nothing to do, nothing was changed.';
    SET NOEXEC ON;
END
ELSE IF @rows <> 1 OR ISNULL(@old, 0) <> 1
BEGIN
    PRINT '*** Check failed on ' + DB_NAME() + ' - NOTHING was changed: expected one company 32 / MUM row with cmp_fullname NULL'
        + ' and cmp_add1 ''601/602, Star Hub, Tower 1,''; found ' + CAST(@rows AS VARCHAR(10)) + ' row(s), '
        + CAST(ISNULL(@old, 0) AS VARCHAR(10)) + ' with those values.';
    RAISERROR('Check failed - see the message above.', 16, 1);
    SET NOEXEC ON;
END
ELSE IF ISNULL(HAS_PERMS_BY_NAME('dbo.cmp_address', 'OBJECT', 'UPDATE'), 0) = 0
BEGIN
    PRINT '*** No UPDATE permission on dbo.cmp_address - NOTHING was changed.';
    RAISERROR('Check failed - see the message above.', 16, 1);
    SET NOEXEC ON;
END
ELSE
    PRINT 'Prerequisites OK on ' + DB_NAME() + '.';
GO

/* ---- 2. update - one transaction ---------------------------------------------------------------- */
SET XACT_ABORT ON;
DECLARE @n INT, @err NVARCHAR(400);
BEGIN TRY
    BEGIN TRANSACTION;
    UPDATE dbo.cmp_address
       SET cmp_fullname = 'OCEAN LINKS SHIPPING PVT. LTD.',
           cmp_add1     = '601, Star Hub, Tower 1,'
     WHERE cmp_code = '32' AND RTRIM(cmp_city) = 'MUM'
       AND cmp_fullname IS NULL AND cmp_add1 = '601/602, Star Hub, Tower 1,';
    SET @n = @@ROWCOUNT;
    IF @n <> 1 RAISERROR('Updated %d rows instead of 1 - rolled back.', 16, 1, @n);
    COMMIT TRANSACTION;
    PRINT 'Done: company 32 / MUM now has cmp_fullname ''OCEAN LINKS SHIPPING PVT. LTD.'' and cmp_add1 ''601, Star Hub, Tower 1,''.';
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0 ROLLBACK TRANSACTION;
    SET @err = ERROR_MESSAGE();
    PRINT '*** Update failed and was rolled back - nothing was changed: ' + @err;
    RAISERROR('%s', 16, 1, @err);
END CATCH
GO

SET NOEXEC OFF;
GO

/* ---- 3. verify (read-only) -------------------------------------------------------------------- */
SELECT PK_id, cmp_code, cmp_city, cmp_name, cmp_fullname, cmp_boldname, cmp_add1, cmp_add2, cmp_add3
  FROM dbo.cmp_address
 WHERE cmp_code = '32';
GO
