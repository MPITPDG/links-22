/*===============================================================================================
  ROLLBACK_USP35_IMP_IMPORT_RPT_SEARCH_LINKSDB20_20261015.sql         (LinksDB20)

  Rollback for USP35_IMP_IMPORT_RPT_SEARCH_LINKSDB20_20261015.sql.
  Puts dbo.USP35_IMP_IMPORT_RPT_Search back to the definition it had on LinksDB20 before that
  script, captured on 2026-10-15 from OBJECT_DEFINITION (8795 characters, BINARY_CHECKSUM
  1797244521, create / modify date 2023-08-20 18:43:37.460), byte for byte, with only the keyword
  CREATE turned into ALTER. That is the version in which SearchType 2 to 7 sit inside a
  comment block (so they return no result set and the API answers {}); only SearchType 1 works.

  Safety : stops by itself on any database other than LinksDB20, and when the procedure does not
           exist or you may not ALTER it. ALTER keeps the object id and permissions. Nothing
           else is touched. If the procedure already is the old version, the ALTER simply
           writes the same text again. Re-runnable.  SQL Server 2008 R2.
===============================================================================================*/
USE [LinksDB20]
GO
SET NOCOUNT ON;

/* ---- 1. guards ------------------------------------------------------------------------- */
DECLARE @problems TABLE (n INT IDENTITY(1,1), problem VARCHAR(600));
DECLARE @def NVARCHAR(MAX);

IF UPPER(DB_NAME()) <> 'LINKSDB20'
    INSERT INTO @problems (problem) VALUES ('Connected to ' + DB_NAME() + ', not LinksDB20.');

IF OBJECT_ID('dbo.USP35_IMP_IMPORT_RPT_Search', 'P') IS NULL
    INSERT INTO @problems (problem) VALUES ('dbo.USP35_IMP_IMPORT_RPT_Search does not exist as a stored procedure on ' + DB_NAME() + '.')
ELSE
BEGIN
    IF ISNULL(HAS_PERMS_BY_NAME('dbo.USP35_IMP_IMPORT_RPT_Search', 'OBJECT', 'ALTER'), 0) = 0
        INSERT INTO @problems (problem) VALUES ('No ALTER permission on dbo.USP35_IMP_IMPORT_RPT_Search.');

    IF NOT EXISTS (SELECT 1 FROM sys.sql_modules
                    WHERE object_id = OBJECT_ID('dbo.USP35_IMP_IMPORT_RPT_Search')
                      AND uses_ansi_nulls = 1 AND uses_quoted_identifier = 1 AND execute_as_principal_id IS NULL)
        INSERT INTO @problems (problem) VALUES ('dbo.USP35_IMP_IMPORT_RPT_Search is stored with ANSI_NULLS / QUOTED_IDENTIFIER OFF or an EXECUTE AS clause - the ALTER below would change that.');
END

IF EXISTS (SELECT 1 FROM @problems)
BEGIN
    PRINT '*** Guard check failed on ' + DB_NAME() + ' - NOTHING was altered:';
    SELECT n AS [#], problem FROM @problems ORDER BY n;
    RAISERROR('Guard check failed - see the list above.', 16, 1);
    SET NOEXEC ON;     -- skip the rest of the script, including the ALTER below
END
ELSE
BEGIN
    SET @def = OBJECT_DEFINITION(OBJECT_ID('dbo.USP35_IMP_IMPORT_RPT_Search'));
    IF CHARINDEX(CHAR(9) + CHAR(47) + CHAR(42) + CHAR(13) + CHAR(10) + CHAR(9) + 'else if(@SearchType=''2'')', @def) > 0
        PRINT 'Guards OK on ' + DB_NAME() + ': the procedure already is the old (branches 2-7 commented out) version - the ALTER below rewrites the same text.'
    ELSE
        PRINT 'Guards OK on ' + DB_NAME() + ': restoring the old definition (SearchType 2-7 commented out again).';
END
GO

/* ---- 2. ALTER PROCEDURE: the exact definition captured before the fix --------------------
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
	/*
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
	*/
--end








GO

SET NOEXEC OFF;
GO

/* ---- 3. verify (read-only) --------------------------------------------------------------- */
DECLARE @d NVARCHAR(MAX);
SET @d = OBJECT_DEFINITION(OBJECT_ID('dbo.USP35_IMP_IMPORT_RPT_Search'));

SELECT o.name AS PROCEDURE_NAME,
       CONVERT(VARCHAR(23), o.modify_date, 121) AS MODIFY_DATE,
       m.uses_ansi_nulls AS ANSI_NULLS, m.uses_quoted_identifier AS QUOTED_IDENTIFIER
  FROM sys.objects o
  JOIN sys.sql_modules m ON m.object_id = o.object_id
 WHERE o.object_id = OBJECT_ID('dbo.USP35_IMP_IMPORT_RPT_Search') AND o.type = 'P';

IF @d IS NOT NULL
   AND CHARINDEX(CHAR(9) + CHAR(47) + CHAR(42) + CHAR(13) + CHAR(10) + CHAR(9) + 'else if(@SearchType=''2'')', @d) > 0
   AND CHARINDEX(CHAR(9) + CHAR(42) + CHAR(47) + CHAR(13) + CHAR(10) + '--end', @d) > 0
    PRINT DB_NAME() + ': USP35_IMP_IMPORT_RPT_Search restored to the pre-fix definition (SearchType 2-7 commented out).'
ELSE
    PRINT '*** The procedure is not in the pre-fix state on ' + DB_NAME() + ' - see the messages above.';
GO
