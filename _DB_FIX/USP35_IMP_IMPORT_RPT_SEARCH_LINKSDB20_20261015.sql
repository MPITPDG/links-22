/*===============================================================================================
  USP35_IMP_IMPORT_RPT_SEARCH_LINKSDB20_20261015.sql         (LinksDB20)

  Why  : dbo.USP35_IMP_IMPORT_RPT_Search is the Import job search (Links API
         POST api/Import/Report_Search -> ImportController.Report_Search; the Import home
         dashboard and the Import Sea / Air search screens all call it). On LinksDB20 only the
         @SearchType = '1' branch is live: a slash-star comment opener was left on its own line
         right after that branch's  end  and the matching star-slash closer on its own line just
         before the final  --end  (about lines 91 and 279 of OBJECT_DEFINITION). Everything
         between them is therefore a comment, so SearchType 2 to 7 run no SELECT, return no
         result set, and the API answers {}. The same procedure in the Manilal (MP Cargo)
         database has all seven branches live. A read-only run of the SearchType 2 query on
         LinksDB20 (2026-10-15) returns 823 jobs, and every column and table the commented
         branches use exists on LinksDB20 (step 1 re-checks that).

  *** CONFIRM BEFORE DEPLOYING ***
         Branches 2 to 7 were commented out on 2023-08-20 (the create / modify date of this
         procedure on LinksDB20 is 2023-08-20 18:43:37) for a reason nobody recorded. Before
         running this script, confirm that nobody disabled them on purpose, for example for
         performance (SearchType 2 and 7 filter on dbo.CONVERTDATE_YYYYMMDD(convert(...)) per
         row, and the "not delivered" variants of 3 to 6 use a correlated NOT IN) or because a
         screen was withdrawn. If someone did, do not run it.

  Changes : exactly ONE object: ALTER PROCEDURE dbo.USP35_IMP_IMPORT_RPT_Search. The new text is
         the CURRENT LinksDB20 definition (captured 2026-10-15; 8795 characters; BINARY_CHECKSUM
         1797244521) with ONLY these differences: the keyword CREATE became ALTER, and the
         two lines that hold nothing but the comment opener and the comment closer are removed.
         Every other character is unchanged, including the points where LinksDB20 differs from
         MP's copy (listed below). Parameters and result columns are unchanged:
           SearchType 1 job by Import_Code (already live)    4 by bill-to party
                      2 by import date range                 5 by vessel / airline
                      3 by importer                          6 by agent
                                                             7 by GL date range
         (3 to 6: BillToType / VesselType / ImporterType / AgentType = 'All' lists every job,
         anything else lists only jobs with no row in Tbl_Imp_Mst_Delivery yet.)

  LinksDB20 vs MP differences in this procedure (LinksDB20's text is kept in every case):
    1. LinksDB20 runs  SET NOCOUNT ON;  before the date conversions and has a commented-out
       "--begin" ... "--end" pair; MP wraps the whole body in a real begin ... end and has no
       SET NOCOUNT ON. Functionally the same apart from the suppressed row-count messages.
    2. The commented sample-parameter block under  As  (the "SET @Mode = 'Sea' ..." lines) holds
       different sample values (@ImportCode, @citycode1, @cmp_code). Comment only.
    3. Whitespace only: a different number of blank lines at the top of the text, and one
       whitespace-only line inside the old SearchType 2 region.
    The code of branches 2 to 7 is otherwise identical to MP's (compared line by line after
    removing the carriage returns). The date handling is the same in both: @ImpDateFrom / To and
    @GlDateFrom / To arrive as mm/dd/yyyy text.

  Safety : step 1 checks everything first and stops before altering anything if one check fails:
           the procedure exists and its current text still contains the disabled region (so it
           aborts if somebody already changed it), the text is still the one captured here, the
           columns / table / function the re-enabled branches use exist, you may ALTER it, and
           its stored SET options (ANSI_NULLS ON, QUOTED_IDENTIFIER ON, no EXECUTE AS) are ones
           this script keeps. ALTER (not DROP and CREATE) keeps the object id and any permissions
           granted on it. Nothing is created, dropped or written in any table; the procedure
           only reads VW35_IMP_IMPORT_MASTER and Tbl_Imp_Mst_Delivery. If the ALTER fails to
           compile, the old definition stays in place. Run it against LinksDB20 only: it stops
           by itself on any other database. NOT re-runnable by design: after a successful run
           step 1 finds no disabled region and stops with a message.
  Rollback: ROLLBACK_USP35_IMP_IMPORT_RPT_SEARCH_LINKSDB20_20261015.sql puts the captured
            definition back (branches 2 to 7 commented out again).
  Run as : any login that may ALTER the procedure (normal login). SQL Server 2008 R2.
===============================================================================================*/
USE [LinksDB20]
GO
SET NOCOUNT ON;

/* ---- 1. prerequisites ------------------------------------------------------------------ */
DECLARE @problems TABLE (n INT IDENTITY(1,1), problem VARCHAR(600));
DECLARE @def         NVARCHAR(MAX);
DECLARE @startMarker NVARCHAR(100);
DECLARE @endMarker   NVARCHAR(100);
DECLARE @p1 INT, @p2 INT;

-- 1a. we must really be on LinksDB20 (if USE failed above the session is still in another DB)
IF UPPER(DB_NAME()) <> 'LINKSDB20'
    INSERT INTO @problems (problem) VALUES ('Connected to ' + DB_NAME() + ', not LinksDB20.');

-- 1b. the procedure exists
IF OBJECT_ID('dbo.USP35_IMP_IMPORT_RPT_Search', 'P') IS NULL
    INSERT INTO @problems (problem) VALUES ('dbo.USP35_IMP_IMPORT_RPT_Search does not exist as a stored procedure on ' + DB_NAME() + '.')
ELSE
BEGIN
    SET @def = OBJECT_DEFINITION(OBJECT_ID('dbo.USP35_IMP_IMPORT_RPT_Search'));

    -- Distinctive text of the disabled region (CHAR(47)+CHAR(42) = slash-star, CHAR(42)+CHAR(47) = star-slash):
    --   start : <tab> slash-star <CRLF> <tab> else if(@SearchType='2')          (right after the SearchType 1 branch)
    --   end   : <tab> star-slash <CRLF> --end                                    (just before the final --end)
    SET @startMarker = CHAR(9) + CHAR(47) + CHAR(42) + CHAR(13) + CHAR(10) + CHAR(9) + 'else if(@SearchType=''2'')';
    SET @endMarker   = CHAR(9) + CHAR(42) + CHAR(47) + CHAR(13) + CHAR(10) + '--end';

    IF @def IS NULL
        INSERT INTO @problems (problem) VALUES ('The definition of dbo.USP35_IMP_IMPORT_RPT_Search cannot be read (encrypted, or no VIEW DEFINITION permission).')
    ELSE
    BEGIN
        -- 1c. the commented-out block is still there, exactly once, start before end
        SET @p1 = CHARINDEX(@startMarker, @def);
        SET @p2 = CHARINDEX(@endMarker, @def);

        IF @p1 = 0 OR @p2 = 0 OR @p2 < @p1
            INSERT INTO @problems (problem) VALUES ('The disabled block (comment opener before ''else if(@SearchType=2)'' and comment closer before ''--end'') is not in the current definition - the procedure was already changed. Compare OBJECT_DEFINITION with this script before going on.')
        ELSE IF CHARINDEX(@startMarker, @def, @p1 + 1) > 0 OR CHARINDEX(@endMarker, @def, @p2 + 1) > 0
            INSERT INTO @problems (problem) VALUES ('The disabled-block markers occur more than once - the procedure is not the one this script was written for.')
        ELSE IF CHARINDEX(CHAR(47) + CHAR(42), SUBSTRING(@def, @p1 + 3, @p2 - @p1 - 2)) > 0
              OR CHARINDEX(CHAR(42) + CHAR(47), SUBSTRING(@def, @p1 + 3, @p2 - @p1 - 2)) > 0
            INSERT INTO @problems (problem) VALUES ('There is another comment opener / closer inside the disabled block (block comments nest) - removing just the two outer lines would not enable the branches.');

        -- 1d. it is still the text this script was generated from (so no later edit is overwritten)
        IF LEN(@def) <> 8795 OR BINARY_CHECKSUM(@def) <> 1797244521
            INSERT INTO @problems (problem)
            VALUES ('The current definition is not the one captured on 2026-10-15 (expected 8795 characters and BINARY_CHECKSUM 1797244521; found '
                    + CAST(LEN(@def) AS VARCHAR(20)) + ' and ' + CAST(BINARY_CHECKSUM(@def) AS VARCHAR(20)) + '). Re-diff it against the ALTER below before going on.');
    END

    -- 1e. stored SET options the ALTER below keeps (it sets ANSI_NULLS ON and QUOTED_IDENTIFIER ON, no EXECUTE AS)
    IF NOT EXISTS (SELECT 1 FROM sys.sql_modules
                    WHERE object_id = OBJECT_ID('dbo.USP35_IMP_IMPORT_RPT_Search')
                      AND uses_ansi_nulls = 1 AND uses_quoted_identifier = 1 AND execute_as_principal_id IS NULL)
        INSERT INTO @problems (problem) VALUES ('dbo.USP35_IMP_IMPORT_RPT_Search is stored with ANSI_NULLS / QUOTED_IDENTIFIER OFF or an EXECUTE AS clause - the ALTER below would change that.');

    -- 1f. permission to alter it
    IF ISNULL(HAS_PERMS_BY_NAME('dbo.USP35_IMP_IMPORT_RPT_Search', 'OBJECT', 'ALTER'), 0) = 0
        INSERT INTO @problems (problem) VALUES ('No ALTER permission on dbo.USP35_IMP_IMPORT_RPT_Search.');
END

-- 1g. everything the re-enabled branches read must exist
DECLARE @need TABLE (obj VARCHAR(128), col VARCHAR(128));
INSERT INTO @need (obj, col)
SELECT 'dbo.VW35_IMP_IMPORT_MASTER', 'pk_ImpoterId'
UNION ALL SELECT 'dbo.VW35_IMP_IMPORT_MASTER', 'Doc_Cancel'
UNION ALL SELECT 'dbo.VW35_IMP_IMPORT_MASTER', 'Import_Code'
UNION ALL SELECT 'dbo.VW35_IMP_IMPORT_MASTER', 'Import_Date'
UNION ALL SELECT 'dbo.VW35_IMP_IMPORT_MASTER', 'Importer'
UNION ALL SELECT 'dbo.VW35_IMP_IMPORT_MASTER', 'Vessel_Airline'
UNION ALL SELECT 'dbo.VW35_IMP_IMPORT_MASTER', 'Agent_Name'
UNION ALL SELECT 'dbo.VW35_IMP_IMPORT_MASTER', 'Desc_Good'
UNION ALL SELECT 'dbo.VW35_IMP_IMPORT_MASTER', 'NumOfPkg1'
UNION ALL SELECT 'dbo.VW35_IMP_IMPORT_MASTER', 'GrossWt'
UNION ALL SELECT 'dbo.VW35_IMP_IMPORT_MASTER', 'Mode'
UNION ALL SELECT 'dbo.VW35_IMP_IMPORT_MASTER', 'citycode1'
UNION ALL SELECT 'dbo.VW35_IMP_IMPORT_MASTER', 'cmp_code'
UNION ALL SELECT 'dbo.VW35_IMP_IMPORT_MASTER', 'fk_Importer'
UNION ALL SELECT 'dbo.VW35_IMP_IMPORT_MASTER', 'fk_BillTo'
UNION ALL SELECT 'dbo.VW35_IMP_IMPORT_MASTER', 'fk_Vessel_Airline'
UNION ALL SELECT 'dbo.VW35_IMP_IMPORT_MASTER', 'fk_Agent_Name'
UNION ALL SELECT 'dbo.VW35_IMP_IMPORT_MASTER', 'GlDate'
UNION ALL SELECT 'dbo.Tbl_Imp_Mst_Delivery', 'fk_ImpoterId';

INSERT INTO @problems (problem)
SELECT 'Column ' + x.obj + '.' + x.col + ' not found - the re-enabled branches would fail at run time.'
  FROM @need x
 WHERE NOT EXISTS (SELECT 1 FROM sys.columns c WHERE c.object_id = OBJECT_ID(x.obj) AND c.name = x.col);

IF OBJECT_ID('dbo.CONVERTDATE_YYYYMMDD') IS NULL
    INSERT INTO @problems (problem) VALUES ('Function dbo.CONVERTDATE_YYYYMMDD not found (branches 2 and 7 use it).');

IF EXISTS (SELECT 1 FROM @problems)
BEGIN
    PRINT '*** Prerequisite check failed on ' + DB_NAME() + ' - NOTHING was altered:';
    SELECT n AS [#], problem FROM @problems ORDER BY n;
    RAISERROR('Prerequisite check failed - see the list above.', 16, 1);
    SET NOEXEC ON;     -- skip the rest of the script, including the ALTER below
END
ELSE
    PRINT 'Prerequisites OK on ' + DB_NAME() + ': SearchType 2-7 are still commented out; altering now.';
GO

/* ---- 2. ALTER PROCEDURE: the current definition minus the two comment-marker lines ---------
   The two SET options below match the stored ones (ANSI_NULLS ON, QUOTED_IDENTIFIER ON). The
   procedure text is the batch between the next GO and the one after it, stored as typed.  */
SET QUOTED_IDENTIFIER ON;
SET ANSI_NULLS ON;
GO

 
 



--select * from Tbl_Imp_Import
--select * from Tbl_Imp_Mst_Delivery
--USP35_IMP_IMPORT_RPT_Search 'SEA','011011350000006','07/01/2009','07/10/2009','E104847','UC','A100348','','6','','A100348','','07/01/2009','07/10/2009','1','101','01'

--USP35_IMP_IMPORT_RPT_Search 'SEA','011011350000006','','','','','','','','','','','','','1','101','01'

ALTER PROCEDURE [dbo].[USP35_IMP_IMPORT_RPT_Search]
--DECLARE 
@Mode varchar(5),
@ImportCode varchar(15),
@ImpDateFrom varchar(15),
@ImpDateTo varchar(15),
@Importer varchar(15),
@ImporterType varchar(5),
@BillTo varchar(15),
@BillToType varchar(5),
@Vessel varchar(15),
@VesselType varchar(5),
@Agent varchar(15),
@AgentType varchar(5),
@GlDateFrom varchar(15),
@GlDateTo varchar(15),
@SearchType varchar(2),
@citycode1 varchar(3),
@cmp_code varchar(2)

As/*

SET @Mode='Sea'
SET @ImportCode ='301102050000047'
SET @ImpDateFrom =''
SET @ImpDateTo =''
SET @Importer =''
SET @ImporterType ='All'
SET @BillTo =''
SET @BillToType ='All'
SET @Vessel =''
SET @VesselType ='All'
SET @Agent =''
SET @AgentType ='All'
SET @GlDateFrom=''
SET @GlDateTo =''
SET @SearchType ='1'
SET @citycode1='110'
SET @cmp_code ='30'
--*/
SET NOCOUNT ON;

--begin

select  @ImpDateFrom =dbo.CONVERTDATE_YYYYMMDD(convert(varchar,convert(Datetime,@ImpDateFrom,101),103) ) ,
		@ImpDateTo =dbo.CONVERTDATE_YYYYMMDD(convert(varchar,convert(Datetime,@ImpDateTo,101),103)) 
 
select  @GlDateFrom =dbo.CONVERTDATE_YYYYMMDD(convert(varchar,convert(Datetime,@GlDateFrom,101),103) ) ,
		@GlDateTo =dbo.CONVERTDATE_YYYYMMDD(convert(varchar,convert(Datetime,@GlDateTo,101),103)) 
 	
 	
--select  @ImpDateFrom =dbo.CONVERTDATE_YYYYMMDD(@ImpDateFrom)  ,
--		@ImpDateTo =dbo.CONVERTDATE_YYYYMMDD(@ImpDateTo) 

--select  GlDateFrom =dbo.CONVERTDATE_YYYYMMDD(@GlDateFrom) ,
--		GlDateTo =dbo.CONVERTDATE_YYYYMMDD(@GlDateTo) 

 	--select	ImpDateFrom=@ImpDateFrom,ImpDateTo	=@ImpDateTo
		
	if(@SearchType='1')
	begin
		SELECT DISTINCT	pk_ImpoterId,
				Doc_Cancel,
				Import_Code 'Import Code',
				convert(varchar,Import_Date,103) 'Import Date',
				Importer ,
				Vessel_Airline "Vessel" ,
				Agent_Name "Agent", --,pk_ImpoterId
				DESC_GOOD 'Desc of Goods',
				NUMOFPKG1 'No. of Pkgs.',
				GROSSWT 'Gross Weight'
		FROM	[VW35_IMP_IMPORT_MASTER] 
		WHERE	Import_Code=@ImportCode 
				AND Mode=@Mode 
				AND citycode1=@citycode1 
				AND cmp_code=@cmp_code
		ORDER BY Import_Code desc
	end
	else if(@SearchType='2')
	begin
		SELECT	  pk_ImpoterId,
				Doc_Cancel,
				Import_Code 'Import Code',
				convert(varchar,Import_Date,103) 'Import Date' , 
				Importer ,
				Vessel_Airline "Vessel" ,
				Agent_Name "Agent", --,pk_ImpoterId
				DESC_GOOD 'Desc of Goods',
				NUMOFPKG1 'No. of Pkgs.',
				GROSSWT 'Gross Weight'
		FROM	[VW35_IMP_IMPORT_MASTER] 
		WHERE	--convert(varchar,Import_Date,101) between @ImpDateFrom AND @ImpDateTo 
				 dbo.CONVERTDATE_YYYYMMDD(convert(varchar,Import_Date,103)) between  @ImpDateFrom  AND   @ImpDateTo 
				AND Mode=@Mode
				AND citycode1=@citycode1 
				AND cmp_code=@cmp_code
		ORDER BY dbo.CONVERTDATE_YYYYMMDD(convert(varchar,Import_Date,103))
		
		--select * from TBL_IMP_IMPORT
	end
	
	else if(@SearchType='3')
	begin
		if(@ImporterType='All')
		begin
			SELECT DISTINCT	pk_ImpoterId,Doc_Cancel,
					Import_Code 'Import Code',convert(varchar,Import_Date,103) 'Import Date',
					Importer ,
					Vessel_Airline "Vessel" ,
					Agent_Name "Agent", --,pk_ImpoterId
					DESC_GOOD 'Desc of Goods',
					NUMOFPKG1 'No. of Pkgs.',
					GROSSWT 'Gross Weight'
			FROM [VW35_IMP_IMPORT_MASTER] 
			WHERE fk_Importer=@Importer AND Mode=@Mode
			AND citycode1=@citycode1 AND cmp_code=@cmp_code
			ORDER BY Import_Code desc
		end
		else
		begin
			SELECT DISTINCT	pk_ImpoterId,Doc_Cancel,
					Import_Code 'Import Code',convert(varchar,Import_Date,103) 'Import Date',
					Importer ,
					Vessel_Airline "Vessel" ,
					Agent_Name "Agent" , --,pk_ImpoterId
					DESC_GOOD 'Desc of Goods',
					NUMOFPKG1 'No. of Pkgs.',
					GROSSWT 'Gross Weight'
			FROM [VW35_IMP_IMPORT_MASTER] 
			WHERE fk_Importer=@Importer AND Mode=@Mode
			AND pk_ImpoterId not in (select fk_ImpoterId from Tbl_Imp_Mst_Delivery where fk_ImpoterId=[VW35_IMP_IMPORT_MASTER].pk_ImpoterId)
			AND citycode1=@citycode1 AND cmp_code=@cmp_code
			ORDER BY Import_Code desc
		end
	end
	else if(@SearchType='4')
	begin
		if(@BillToType='All')
		begin
			SELECT DISTINCT	pk_ImpoterId,Doc_Cancel,
					Import_Code 'Import Code',convert(varchar,Import_Date,103) 'Import Date',
					Importer ,
					Vessel_Airline "Vessel" ,
					Agent_Name "Agent" , --,pk_ImpoterId
					DESC_GOOD 'Desc of Goods',
					NUMOFPKG1 'No. of Pkgs.',
					GROSSWT 'Gross Weight'
			FROM [VW35_IMP_IMPORT_MASTER] 
			WHERE fk_BillTo=@BillTo AND Mode=@Mode
			AND citycode1=@citycode1 AND cmp_code=@cmp_code
			ORDER BY Import_Code desc
		end
		else
		begin
			SELECT DISTINCT	pk_ImpoterId,Doc_Cancel,
					Import_Code 'Import Code',convert(varchar,Import_Date,103) 'Import Date',
					Importer ,
					Vessel_Airline "Vessel" ,
					Agent_Name "Agent" , --,pk_ImpoterId
					DESC_GOOD 'Desc of Goods',
					NUMOFPKG1 'No. of Pkgs.',
					GROSSWT 'Gross Weight'
			FROM [VW35_IMP_IMPORT_MASTER] 
			WHERE fk_BillTo=@BillTo AND Mode=@Mode
			AND pk_ImpoterId not in (select fk_ImpoterId from Tbl_Imp_Mst_Delivery where fk_ImpoterId=[VW35_IMP_IMPORT_MASTER].pk_ImpoterId)
			AND citycode1=@citycode1 AND cmp_code=@cmp_code
			ORDER BY Import_Code desc
		end
	end
	else if(@SearchType='5')
	begin
		if(@VesselType='All')
		begin
			SELECT DISTINCT	pk_ImpoterId,Doc_Cancel,
					Import_Code 'Import Code',convert(varchar,Import_Date,103) 'Import Date',
					Importer ,
					Vessel_Airline "Vessel" ,
					Agent_Name "Agent" , --,pk_ImpoterId
					DESC_GOOD 'Desc of Goods',
					NUMOFPKG1 'No. of Pkgs.',
					GROSSWT 'Gross Weight'
			FROM [VW35_IMP_IMPORT_MASTER] 
			WHERE fk_Vessel_Airline LIKE @Vessel+'|%' AND Mode=@Mode
			AND citycode1=@citycode1 AND cmp_code=@cmp_code
			ORDER BY Import_Code desc
		end
		else
		begin
			SELECT DISTINCT	pk_ImpoterId,Doc_Cancel,
					Import_Code 'Import Code',
					convert(varchar,Import_Date,103) 'Import Date',
					Importer ,
					Vessel_Airline "Vessel" ,
					Agent_Name "Agent" , --,pk_ImpoterId
					DESC_GOOD 'Desc of Goods',
					NUMOFPKG1 'No. of Pkgs.',
					GROSSWT 'Gross Weight'
			FROM	[VW35_IMP_IMPORT_MASTER] 
			WHERE	fk_Vessel_Airline LIKE @Vessel+'|%' 
					AND Mode=@Mode
					AND pk_ImpoterId not in (select fk_ImpoterId from Tbl_Imp_Mst_Delivery where fk_ImpoterId=[VW35_IMP_IMPORT_MASTER].pk_ImpoterId)
					AND citycode1=@citycode1 AND cmp_code=@cmp_code
			ORDER BY Import_Code desc
		end
		
	end
	else if(@SearchType='6')
	begin
		if(@AgentType='All')
		begin
			SELECT	DISTINCT pk_ImpoterId,Doc_Cancel,
					Import_Code 'Import Code',
					convert(varchar,Import_Date,103) 'Import Date',
					Importer ,
					Vessel_Airline "Vessel" ,
					Agent_Name "Agent" , --,pk_ImpoterId
					DESC_GOOD 'Desc of Goods',
					NUMOFPKG1 'No. of Pkgs.',
					GROSSWT 'Gross Weight'
			FROM	[VW35_IMP_IMPORT_MASTER] 
			WHERE	fk_Agent_Name=@Agent 
					AND Mode=@Mode
					AND citycode1=@citycode1 
					AND cmp_code=@cmp_code
			ORDER BY Import_Code desc
		end
		else
		begin
			SELECT	DISTINCT pk_ImpoterId,Doc_Cancel,
					Import_Code 'Import Code',
					convert(varchar,Import_Date,103) 'Import Date',
					Importer ,
					Vessel_Airline "Vessel" ,
					Agent_Name "Agent" , --,pk_ImpoterId
					DESC_GOOD 'Desc of Goods',
					NUMOFPKG1 'No. of Pkgs.',
					GROSSWT 'Gross Weight'
			FROM	[VW35_IMP_IMPORT_MASTER] 
			WHERE	fk_Agent_Name=@Agent 
					AND Mode=@Mode
					AND pk_ImpoterId not in (select fk_ImpoterId from Tbl_Imp_Mst_Delivery where fk_ImpoterId=[VW35_IMP_IMPORT_MASTER].pk_ImpoterId)
					AND citycode1=@citycode1 
					AND cmp_code=@cmp_code
			ORDER BY Import_Code desc
		end
	end
	else if(@SearchType='7')
	begin
		SELECT DISTINCT	pk_ImpoterId,Doc_Cancel,
				Import_Code 'Import Code',
				convert(varchar,Import_Date,103) 'Import Date',
				Importer ,
				Vessel_Airline "Vessel" ,
				Agent_Name "Agent" , --,pk_ImpoterId
				DESC_GOOD 'Desc of Goods',
				NUMOFPKG1 'No. of Pkgs.',
				GROSSWT 'Gross Weight'
		FROM	[VW35_IMP_IMPORT_MASTER] 
		WHERE	--convert(varchar,gldate,101) between @GlDateFrom AND @GlDateTo  
				dbo.CONVERTDATE_YYYYMMDD(convert(varchar,gldate,103)) between @GlDateFrom AND @GlDateTo 
				AND Mode=@Mode
				AND citycode1=@citycode1 
				AND cmp_code=@cmp_code
		ORDER BY Import_Code desc
	end
--end








GO

SET NOEXEC OFF;
GO

/* ---- 3. verify (read-only) --------------------------------------------------------------- */
DECLARE @d NVARCHAR(MAX);
DECLARE @s NVARCHAR(100);
DECLARE @e NVARCHAR(100);
SET @d = OBJECT_DEFINITION(OBJECT_ID('dbo.USP35_IMP_IMPORT_RPT_Search'));
SET @s = CHAR(9) + CHAR(47) + CHAR(42) + CHAR(13) + CHAR(10) + CHAR(9) + 'else if(@SearchType=''2'')';
SET @e = CHAR(9) + CHAR(42) + CHAR(47) + CHAR(13) + CHAR(10) + '--end';

SELECT o.name AS PROCEDURE_NAME,
       CONVERT(VARCHAR(23), o.modify_date, 121) AS MODIFY_DATE,
       m.uses_ansi_nulls AS ANSI_NULLS, m.uses_quoted_identifier AS QUOTED_IDENTIFIER
  FROM sys.objects o
  JOIN sys.sql_modules m ON m.object_id = o.object_id
 WHERE o.object_id = OBJECT_ID('dbo.USP35_IMP_IMPORT_RPT_Search') AND o.type = 'P';

-- PRINT takes no subquery, so read modify_date into a variable first.
DECLARE @md VARCHAR(23);
SELECT @md = CONVERT(VARCHAR(23), modify_date, 121) FROM sys.objects WHERE object_id = OBJECT_ID('dbo.USP35_IMP_IMPORT_RPT_Search');
PRINT DB_NAME() + ': USP35_IMP_IMPORT_RPT_Search modify_date = '
    + ISNULL(@md, '(procedure missing)')
    + '  (before this script: 2023-08-20 18:43:37.460).';

IF @d IS NOT NULL AND CHARINDEX(@s, @d) = 0 AND CHARINDEX(@e, @d) = 0
   AND CHARINDEX('else if(@SearchType=''7'')', @d) > 0
    PRINT 'OK: SearchType 2-7 are live again (the disabled block is gone). Smoke test (read-only): the Import home page, or the example below.'
ELSE
    PRINT '*** The procedure still has the disabled block, or is missing - nothing was altered. See the messages above.';
-- EXEC dbo.USP35_IMP_IMPORT_RPT_Search @Mode = 'SEA', @ImportCode = '', @ImpDateFrom = '01/01/2026', @ImpDateTo = '12/31/2026',
--      @Importer = '', @ImporterType = 'All', @BillTo = '', @BillToType = 'All', @Vessel = '', @VesselType = 'All',
--      @Agent = '', @AgentType = 'All', @GlDateFrom = '01/01/2026', @GlDateTo = '12/31/2026',
--      @SearchType = '2', @citycode1 = '<your city code>', @cmp_code = '<your company code>';   -- dates are mm/dd/yyyy
GO
