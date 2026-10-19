-- Rollback: restores the three register export procs as they were before REGISTER_EXPORT_PROC_FIXES_20261017.sql
USE LinksDB20
GO



--usp_Acct_N_Inv_Search_Register '1-Apr-2006','15-Apr-2006', '01', 'MUM','1-Apr-2006', '31-Mar-2007'
ALTER PROCEDURE [dbo].[usp_Acct_N_Inv_Search_Register]
--DECLARE
@FromDt varchar(30),
@ToDt varchar(30),
@cmpcode varchar(3),
@citycode varchar(3),
@FinStartDate varchar(30),
@FinEndDate varchar(30)

As
/*

SET @FromDt ='01-Nov-2009'
SET @ToDt ='12-Nov-2009'
SET @cmpcode='01'
SET @citycode ='MUM'
SET @FinStartDate ='01-Apr-2009'
SET @FinEndDate='31-Mar-2010'

*/

	SELECT  ''''+(INV_NO) AS INV_NO,
			--('''' + INV_NO) AS INV_NO,
			CONVERT(VARCHAR, DBO.CONVERTDATE_IN_US(ACC_INVOICE.INV_DATE,'/'),  106) AS INV_DATE,
			--INV_DATE,
			INV_CLIENT,
			TOTALAMT,
			EXP_MASTER.EXP_NAME AS CLIENTNAME--,
			--JOBNO=(select [DBO].[FN35_ACCOUNT_GET_INVOICE_JOBNO] (ACC_INVOICE.INV_NO))

	FROM   ACC_INVOICE LEFT OUTER JOIN			                  
	EXP_MASTER ON ACC_INVOICE.INV_CLIENT = EXP_MASTER.EXP_CODE
	WHERE   CONVERT(DATETIME,  SUBSTRING(ACC_INVOICE.INV_DATE, 4, 3) + SUBSTRING(ACC_INVOICE.INV_DATE, 1, 3) + 
			SUBSTRING(ACC_INVOICE.INV_DATE, 7, 4)) >= @FROMDT AND CONVERT(DATETIME,  SUBSTRING(ACC_INVOICE.INV_DATE, 4, 3) + 
			SUBSTRING(ACC_INVOICE.INV_DATE, 1, 3) + SUBSTRING(ACC_INVOICE.INV_DATE, 7, 4)) <=  @TODT AND
			DBO.CONVERTDATE_IN_US(ACC_INVOICE.INV_DATE, '/') BETWEEN @FINSTARTDATE AND @FINENDDATE AND 
			CMPCODE = @CMPCODE AND CITYCODE =  @CITYCODE 
	ORDER BY INV_NO


--select * from ACC_INVOICE order by 1 desc
--
--
-- select inv_jobno from acc_invjobno where inv_no = @inv_no order by id    


GO





ALTER PROCEDURE [dbo].[Usp_Acct_Invoice_Register_Acct_Detail]
--DECLARE 
@FROMDT VARCHAR(30),
@TODT VARCHAR(30),
@CMPCODE VARCHAR(3),
@CITYCODE VARCHAR(3),
@FINSTARTDATE VARCHAR(30),
@FINENDDATE VARCHAR(30)

AS
/*

SET @FROMDT ='1-APR-2010'
SET @TODT ='31-MAR-2011'
SET @CMPCODE ='01'
SET @CITYCODE='AMD'
SET @FINSTARTDATE ='1-APR-2010'
SET @FINENDDATE ='31-MAR-2011'

--*/

--=========================================================
DECLARE @MYERROR INT -- LOCAL @@ERROR
       , @MYROWCOUNT INT -- LOCAL @@ROWCOUNT

SET NOCOUNT ON

--BEGIN TRANSACTION

IF OBJECT_ID('TEMPDB..#INVACCT_ACTCODE') IS NOT NULL                      
DROP TABLE #INVACCT_ACTCODE   
                   
CREATE TABLE #INVACCT_ACTCODE 
(	PK_ID INT IDENTITY NOT FOR REPLICATION PRIMARY KEY, 
	ID INT,
	INVOICENO VARCHAR(15),
	INV_CHRGCODE VARCHAR(15),
	INV_ACCOUNT VARCHAR(15),
	INV_ACCOUNTNAME VARCHAR(500),
	INV_TAXABLE VARCHAR(15),
	INV_INRAMT DECIMAL(18,2),
	INV_DATE VARCHAR(25), 
	INV_CLIENT VARCHAR(30)
)
--============================
INSERT INTO #INVACCT_ACTCODE(ID ,INVOICENO,INV_CHRGCODE ,INV_ACCOUNT ,INV_ACCOUNTNAME,INV_TAXABLE,INV_INRAMT ,INV_DATE ,INV_CLIENT )
SELECT  ACC_INVCHARGE.ID, 
		ACC_INVCHARGE.INV_NO, 
		ACC_INVCHARGE.INV_CHRGCODE, 
		ACC_INVCHARGE.INV_ACCOUNT, 
		GENACCT_MASTER.ACCTNAME, 
		ISNULL(ACC_INVCHARGE.INV_TAXABLE, '') AS INV_TAXABLE, 
--		ISNULL(DBO.ACC_INVCHARGE.INV_INRAMT, 0) AS INV_INRAMT, 
--		CASE WHEN DBO.ACC_INVCHARGE.INV_INRAMT <> '' THEN  CONVERT(DECIMAL(18,2),ISNULL(DBO.ACC_INVCHARGE.INV_INRAMT, 0)) ELSE 0 END AS INV_INRAMT, 
		CASE WHEN ACC_INVCHARGE.INV_INRAMT <> '' THEN   CONVERT(DECIMAL(18,2),CONVERT(FLOAT,ISNULL(ACC_INVCHARGE.INV_INRAMT, 0))) ELSE 0 END AS INV_INRAMT, 
		ACC_INVOICE.INV_DATE, 
		ACC_INVOICE.INV_CLIENT
FROM  ACC_INVCHARGE INNER JOIN
      ACC_INVOICE ON ACC_INVCHARGE.INV_NO = ACC_INVOICE.INV_NO LEFT OUTER JOIN
      GENACCT_MASTER ON ACC_INVCHARGE.INV_ACCOUNT = GENACCT_MASTER.ACCTCODE
WHERE (DBO.CONVERTDATE_IN_US(DBO.ACC_INVOICE.INV_DATE, '/') >= @FROMDT) AND 
	  (DBO.CONVERTDATE_IN_US(DBO.ACC_INVOICE.INV_DATE, '/') <= @TODT) AND 
	  (DBO.CONVERTDATE_IN_US(DBO.ACC_INVOICE.INV_DATE, '/') >= @FINSTARTDATE) AND 
	  (DBO.CONVERTDATE_IN_US(DBO.ACC_INVOICE.INV_DATE, '/') <= @FINENDDATE)   AND 
	   CMPCODE = @CMPCODE AND 
	   CITYCODE =@CITYCODE 
--AND DBO.ACC_INVCHARGE.INV_NO='011010804100129'
--ORDER BY DBO.GENACCT_MASTER.ACCTNAME --,DBO.ACC_INVCHARGE.ID -- DBO.CONVERTDATE_IN_US(DBO.ACC_INVOICE.INV_DATE, '/')

--SELECT * FROM ACC_INVCHARGE WHERE INV_NO='011010804100129'
--==============
INSERT INTO #INVACCT_ACTCODE(ID ,INVOICENO,INV_CHRGCODE ,INV_ACCOUNT ,INV_ACCOUNTNAME,INV_TAXABLE,INV_INRAMT ,INV_DATE ,INV_CLIENT )
SELECT  DBO.ACC_INVCHARGE1.ID, 
		DBO.ACC_INVCHARGE1.INV_NO, 
		DBO.ACC_INVCHARGE1.INV_CHRGCODE, 
		DBO.ACC_INVCHARGE1.INV_ACCOUNT, 
		DBO.GENACCT_MASTER.ACCTNAME, 
		ISNULL(DBO.ACC_INVCHARGE1.INV_TAXABLE, '') AS INV_TAXABLE, 
--		ISNULL(DBO.ACC_INVCHARGE1.INV_INRAMT, 0) AS INV_INRAMT, 
--		CASE WHEN DBO.ACC_INVCHARGE1.INV_INRAMT <> '' THEN  CONVERT(DECIMAL(18,2),ISNULL(DBO.ACC_INVCHARGE1.INV_INRAMT, 0)) ELSE 0 END AS INV_INRAMT, 
		CASE WHEN DBO.ACC_INVCHARGE1.INV_INRAMT <> '' THEN  CONVERT(DECIMAL(18,2),CONVERT(FLOAT,ISNULL(DBO.ACC_INVCHARGE1.INV_INRAMT, 0))) ELSE 0 END AS INV_INRAMT, 
		DBO.ACC_INVOICE.INV_DATE, 
		DBO.ACC_INVOICE.INV_CLIENT
FROM  DBO.ACC_INVCHARGE1 INNER JOIN
      DBO.ACC_INVOICE ON DBO.ACC_INVCHARGE1.INV_NO = DBO.ACC_INVOICE.INV_NO INNER JOIN
      DBO.GENACCT_MASTER ON DBO.ACC_INVCHARGE1.INV_ACCOUNT = DBO.GENACCT_MASTER.ACCTCODE
WHERE   (DBO.CONVERTDATE_IN_US(DBO.ACC_INVOICE.INV_DATE, '/') >= @FROMDT) 
	AND (DBO.CONVERTDATE_IN_US(DBO.ACC_INVOICE.INV_DATE, '/') <= @TODT) 
	AND (DBO.CONVERTDATE_IN_US(DBO.ACC_INVOICE.INV_DATE, '/') >= @FINSTARTDATE) 
	AND (DBO.CONVERTDATE_IN_US(DBO.ACC_INVOICE.INV_DATE, '/') <= @FINENDDATE) 
	AND  CMPCODE = @CMPCODE 
	AND CITYCODE = @CITYCODE 
--  AND DBO.ACC_INVCHARGE1.INV_NO='011010804100129'
ORDER BY DBO.ACC_INVCHARGE1.ID --DBO.CONVERTDATE_IN_US(DBO.ACC_INVOICE.INV_DATE, '/')
----/*
--SELECT * FROM #INVACCT_ACTCODE WHERE INVOICENO='011010901101067'
--=======================================================
IF OBJECT_ID('TEMPDB..#INVACCT_DETAILFINAL ') IS NOT NULL                      
DROP TABLE #INVACCT_DETAILFINAL    

CREATE TABLE #INVACCT_DETAILFINAL 
(PK_ID INT IDENTITY NOT FOR REPLICATION PRIMARY KEY, 
INVOICENO VARCHAR(15),
INVDATE VARCHAR(25),
CLIENTNAME VARCHAR(500),
INVAMOUNT DECIMAL(18,2))

INSERT INTO #INVACCT_DETAILFINAL(INVOICENO,INVDATE,CLIENTNAME,INVAMOUNT)
SELECT ACC_INVOICE.INV_NO,ACC_INVOICE.INV_DATE,EXP_MASTER.EXP_NAME,ACC_INVOICE.TOTALAMT 
FROM ACC_INVOICE INNER JOIN EXP_MASTER ON ACC_INVOICE.INV_CLIENT=EXP_MASTER.EXP_CODE
WHERE   (DBO.CONVERTDATE_IN_US(DBO.ACC_INVOICE.INV_DATE, '/') >= @FROMDT) 
	AND (DBO.CONVERTDATE_IN_US(DBO.ACC_INVOICE.INV_DATE, '/') <= @TODT) 
	AND (DBO.CONVERTDATE_IN_US(DBO.ACC_INVOICE.INV_DATE, '/') >= @FINSTARTDATE) 
	AND (DBO.CONVERTDATE_IN_US(DBO.ACC_INVOICE.INV_DATE, '/') <= @FINENDDATE) 
	AND  ACC_INVOICE.CMPCODE = @CMPCODE 
	AND ACC_INVOICE.CITYCODE = @CITYCODE
	AND ACC_INVOICE.INV_NO IN(SELECT DISTINCT INVOICENO FROM #INVACCT_ACTCODE)
ORDER BY DBO.CONVERTDATE_IN_US(DBO.ACC_INVOICE.INV_DATE, '/')
--==================================================================================
--SELECT * FROM #INVACCT_ACTCODE WHERE INV_ACCOUNT='UNDEFIN'

IF OBJECT_ID('TEMPDB..#ACCT_CODE') IS NOT NULL                      
DROP TABLE #ACCT_CODE   

 CREATE TABLE #ACCT_CODE    
 (	ID  INT IDENTITY, 
	INV_ACCOUNT VARCHAR(50),
	INV_ACCOUNTNAME  VARCHAR(500)
 )     

INSERT INTO #ACCT_CODE
SELECT DISTINCT CASE WHEN RTRIM(INV_ACCOUNT)='UNDEFIN' THEN 
						'UNDEFIN' 
					 ELSE RTRIM(INV_ACCOUNT) 
				END AS INV_ACCOUNT,
				CASE WHEN RTRIM(INV_ACCOUNTNAME) IS NULL THEN 
						'UNDEFIN' 
					 ELSE  RTRIM(INV_ACCOUNTNAME) 
				END AS INV_ACCOUNTNAME 
FROM #INVACCT_ACTCODE 
--WHERE INV_CHRGCODE <> ''
ORDER BY INV_ACCOUNTNAME --INV_ACCOUNTNAME

--=======================================================================================
--SELECT * FROM #ACCT_CODE
--SELECT * FROM #INVACCT_ACTCODE --WHERE INV_ACCOUNT='G100243'INVOICENO='011031012100183'
--SELECT * FROM #INVACCT_DETAILFINAL
--=======================================================================================

DECLARE @ACCTSTR VARCHAR(8000)
DECLARE @STRACCTNAME VARCHAR(8000)
DECLARE @STRFIELDNAME VARCHAR(8000)
DECLARE @CALCULATEFIELDNAME VARCHAR(8000)

SET @ACCTSTR=''
SET @STRFIELDNAME=''
SET @CALCULATEFIELDNAME =''

SELECT @CALCULATEFIELDNAME = @CALCULATEFIELDNAME+ 'SUM(ISNULL([' + INV_ACCOUNTNAME +'],0))' + ','  FROM #ACCT_CODE 
SET @CALCULATEFIELDNAME=(SELECT SUBSTRING(@CALCULATEFIELDNAME,0,LEN(@CALCULATEFIELDNAME)))

--select @CALCULATEFIELDNAME

SELECT @STRFIELDNAME = @STRFIELDNAME+ 'RTRIM(ISNULL([' + INV_ACCOUNTNAME +'],''0'')) ['+ INV_ACCOUNTNAME + '],'  FROM #ACCT_CODE 
SET @STRFIELDNAME=(SELECT SUBSTRING(@STRFIELDNAME,0,LEN(@STRFIELDNAME)))
--PRINT(@STRFIELDNAME)

SELECT @ACCTSTR = @ACCTSTR+ '[' + INV_ACCOUNTNAME +']' + ' DECIMAL(18,2),'  FROM #ACCT_CODE 
SET @STRACCTNAME=(SELECT SUBSTRING(@ACCTSTR,0,LEN(@ACCTSTR)))

/*
	--** FOR BETTER PERFORMANCE OF QUERY **--

	CHANGES BY SUJIT ON 08-06-2011.
	INSTAED OF MULTIPLE LOOPS USE UPDATE STATEMENT 
	WITHIN A SINGLE LOOP ACCOUNT HEAD WISE.

*/

IF @STRACCTNAME <> ''
BEGIN

	DECLARE @ACCTNAME VARCHAR(4000),
			@INVOICENO VARCHAR(15),
			@ACCT_CODE VARCHAR(10),
			@INVACCTNAME_COL VARCHAR(500),
			@INVACCTNM_SEL VARCHAR(500),
			@INVACCTNM_COND VARCHAR(500)
			
	DECLARE @CNT INT
	DECLARE @CNTR INT
	SET @CNT=(SELECT COUNT(INV_ACCOUNT) FROM #ACCT_CODE)
	SET @CNTR=1
	WHILE @CNTR<=@CNT
	BEGIN
		
		SELECT	@ACCT_CODE=INV_ACCOUNT,
				@INVACCTNAME_COL= '['+INV_ACCOUNTNAME+']' + ' DECIMAL(18,2),',
				@INVACCTNM_SEL= '['+INV_ACCOUNTNAME+']',
				@INVACCTNM_COND= ''+INV_ACCOUNTNAME+''
		FROM	#ACCT_CODE WHERE ID=@CNTR
		
		PRINT 'LOOP NO : ' + CONVERT(VARCHAR,@CNTR) + '  For ' + @ACCT_CODE +'['+@INVACCTNM_COND+']'
	
		SET @INVACCTNAME_COL=(SELECT SUBSTRING(@INVACCTNAME_COL,0,LEN(@INVACCTNAME_COL)))
		EXEC('ALTER TABLE #INVACCT_DETAILFINAL ADD ' + @INVACCTNAME_COL )        
		--EXEC('UPDATE	INVDETFIN
		--	  SET		INVDETFIN.'+ @INVACCTNM_SEL + ' = INVACT.INV_INRAMT
		--	  FROM		#INVACCT_ACTCODE INVACT
		--				INNER JOIN #INVACCT_DETAILFINAL INVDETFIN  ON INVACT.INVOICENO=INVDETFIN.INVOICENO
		--	  WHERE		INV_ACCOUNT='''+@ACCT_CODE +'''
		--				AND INV_ACCOUNTNAME='''+ @INVACCTNM_COND +'''')

		  EXEC (  ' UPDATE A SET A.'+ @INVACCTNM_SEL + ' = B.INV_INRAMT   FROM #INVACCT_DETAILFINAL A INNER JOIN
			  (SELECT SUM(INVACT.INV_INRAMT)INV_INRAMT,INVACT.INVOICENO FROM  #INVACCT_ACTCODE INVACT 
			  INNER JOIN #INVACCT_DETAILFINAL INVDETFIN  ON INVACT.INVOICENO=INVDETFIN.INVOICENO
			  
			   WHERE		INVACT.INV_ACCOUNT='''+@ACCT_CODE +'''
						AND INVACT.INV_ACCOUNTNAME='''+ @INVACCTNM_COND +''' GROUP BY INVACT.INVOICENO )B
			  ON A.INVOICENO=B.INVOICENO'	 )

		
		--==================================================
			SELECT @MYERROR = @@ERROR, @MYROWCOUNT = @@ROWCOUNT
			IF @MYERROR != 0 GOTO HANDLE_ERROR
		--===================================================

		SET @CNTR=@CNTR+1
	END

	--=========================================================

	EXEC('INSERT INTO #INVACCT_DETAILFINAL 
		  SELECT '''' AS INVOICENO,''TOTAL'' AS INVDATE ,'''' AS CLIENTNAME ,SUM(ISNULL(INVAMOUNT,0)) AS INVAMOUNT,'+@CALCULATEFIELDNAME+' FROM #INVACCT_DETAILFINAL')

	EXEC('SELECT '''''''' + INVOICENO AS INVOICENO,INVDATE ,CLIENTNAME ,INVAMOUNT,'+@STRFIELDNAME+' 
		  FROM #INVACCT_DETAILFINAL ORDER BY PK_ID ')
END
ELSE
BEGIN
	SELECT	''''+ INVOICENO AS INVOICENO,
			INVDATE ,
			CLIENTNAME ,
			INVAMOUNT
	FROM #INVACCT_DETAILFINAL 
	ORDER BY PK_ID 

END

-- COMMIT TRAN -- NO ERRORS, SO GO AHEAD

HANDLE_ERROR:
--    ROLLBACK TRAN
--    RETURN @MYERROR
--========================================================
----CHECCK DUPLICATE RECORD
----SELECT INV_ACCOUNTNAME FROM #INVACCT_ACTCODE 
----GROUP BY INVOICENO
----HAVING  COUNT(INV_ACCOUNTNAME)>1  
----=======================================================
----INSERT INTO #INVACCT_DETAILFINAL 
--SELECT '' AS INVOICENO,'TOTAL' AS INVDATE ,'' AS CLIENTNAME ,SUM(ISNULL(INVAMOUNT,0)) AS INVAMOUNT,SUM(ISNULL([TRANSPORTATION CHARGES],0)) FROM #INVACCT_DETAILFINAL













GO





ALTER PROCEDURE [dbo].[Usp_Acct_CreditNote_Register_Act_Detail]
--declare 
@FromDt varchar(30),
@ToDt varchar(30),
@cmpcode varchar(3),
@citycode varchar(3),
@FinStartDate varchar(30),
@FinEndDate varchar(30)

As/*
Set @FromDt ='1-Apr-2009'
Set @ToDt ='31-Mar-2010'
Set @cmpcode ='01'
Set @citycode='AMD'
Set @FinStartDate ='1-Apr-2009'
Set @FinEndDate ='31-Mar-2010'
--*/

--======================================================================================================
if object_id('tempdb..#CNAcct_Actcode') is not null                      
drop table #CNAcct_Actcode   
                   
create Table #CNAcct_Actcode 
(pk_id int IDENTITY Not For Replication Primary Key, 
CNNo varchar(50),
CN_chrgcode varchar(15),
CN_account varchar(15),
CN_accountName varchar(500),
CN_inramt decimal(18,2),
CN_date varchar(25), 
CN_client varchar(30))

--============================
Insert Into #CNAcct_Actcode(CNNo,CN_chrgcode ,CN_account ,CN_accountName,CN_inramt ,CN_date ,CN_client )
SELECT  dbo.acc_crtcharge.crt_no, 
	dbo.acc_crtcharge.crt_chrgcode, 
	dbo.acc_crtcharge.crt_account, 
	dbo.genacct_master.acctname, 
	case when dbo.acc_crtcharge.crt_inramt <> '' then  CONVERT(decimal(18,2),convert(FLOAT,ISNULL(dbo.acc_crtcharge.crt_inramt, 0))) Else 0 end AS CN_inramt, 
	dbo.acc_creditnote.crt_date, 
	dbo.acc_creditnote.crt_client
FROM  dbo.acc_creditnote INNER JOIN
      dbo.acc_crtcharge ON dbo.acc_creditnote.crt_no = dbo.acc_crtcharge.crt_no LEFT OUTER JOIN
      dbo.genacct_master ON dbo.acc_crtcharge.crt_account = dbo.genacct_master.acctcode
WHERE   (dbo.ConvertDate_IN_US(dbo.acc_creditnote.crt_date, '/') >= @FromDt) AND 
	(dbo.ConvertDate_IN_US(dbo.acc_creditnote.crt_date, '/') <= @ToDt) AND 
	(dbo.ConvertDate_IN_US(dbo.acc_creditnote.crt_date, '/') >= @FinStartDate) AND 
	(dbo.ConvertDate_IN_US(dbo.acc_creditnote.crt_date, '/') <= @FinEndDate) AND 
	(dbo.acc_creditnote.cmpcode = @cmpcode) AND 
	(dbo.acc_creditnote.citycode = @citycode)
order by dbo.ConvertDate_IN_US(dbo.acc_creditnote.crt_date, '/')

--SELECT * FROM acc_invcharge WHERE inv_no='011010804100129'
--==============
Insert Into #CNAcct_Actcode(CNNo,CN_chrgcode ,CN_account ,CN_accountName,CN_inramt ,CN_date ,CN_client )
SELECT  dbo.acc_crtcharge1.crt_no, 
	dbo.acc_crtcharge1.crt_chrgcode, 
	dbo.acc_crtcharge1.crt_account, 
	dbo.genacct_master.acctname, 
	case when dbo.acc_crtcharge1.crt_inramt <> '' then CONVERT(decimal(18,2),convert(FLOAT,ISNULL(dbo.acc_crtcharge1.crt_inramt, 0))) Else 0 end AS CN_inramt, 
	dbo.acc_creditnote.crt_date, 
	dbo.acc_creditnote.crt_client
FROM  dbo.acc_creditnote INNER JOIN
      dbo.acc_crtcharge1 ON dbo.acc_creditnote.crt_no = dbo.acc_crtcharge1.crt_no LEFT OUTER JOIN
      dbo.genacct_master ON dbo.acc_crtcharge1.crt_account = dbo.genacct_master.acctcode
WHERE (dbo.ConvertDate_IN_US(dbo.acc_creditnote.crt_date, '/') >= @FromDt) AND 
	(dbo.ConvertDate_IN_US(dbo.acc_creditnote.crt_date, '/') <= @ToDt) AND 
	(dbo.ConvertDate_IN_US(dbo.acc_creditnote.crt_date, '/') >= @FinStartDate) AND 
	(dbo.ConvertDate_IN_US(dbo.acc_creditnote.crt_date, '/') <= @FinEndDate) AND 
	(dbo.acc_creditnote.cmpcode = @cmpcode) AND 
	(dbo.acc_creditnote.citycode = @citycode)
order by dbo.ConvertDate_IN_US(dbo.acc_creditnote.crt_date, '/')

----/*
--select * from #CNAcct_Actcode WHERE InvoiceNo='011010804100002'
--=======================================================
if object_id('tempdb..#CNAcct_DetailFinal ') is not null                      
drop table #CNAcct_DetailFinal    

create Table #CNAcct_DetailFinal 
(pk_id int IDENTITY Not For Replication Primary Key, 
CNNo varchar(15),
CNdate varchar(25),
ClientName varchar(500),
CNAmount decimal(18,2))

Insert Into #CNAcct_DetailFinal(CNNo,CNdate,Clientname,CNAmount)
SELECT  acc_creditnote.crt_no, 
	acc_creditnote.crt_date, 
	exp_master.exp_name, 
	acc_creditnote.totalamt
FROM  acc_creditnote INNER JOIN exp_master ON acc_creditnote.crt_client = exp_master.exp_code
WHERE (dbo.ConvertDate_IN_US(dbo.acc_creditnote.crt_date, '/') >= @FromDt) AND 
	(dbo.ConvertDate_IN_US(dbo.acc_creditnote.crt_date, '/') <= @ToDt) AND 
	(dbo.ConvertDate_IN_US(dbo.acc_creditnote.crt_date, '/') >= @FinStartDate) AND 
	(dbo.ConvertDate_IN_US(dbo.acc_creditnote.crt_date, '/') <= @FinEndDate) AND 
	(dbo.acc_creditnote.cmpcode = @cmpcode)  AND 
	(dbo.acc_creditnote.citycode = @citycode) AND 
	acc_creditnote.crt_no IN(select distinct CNNo from #CNAcct_Actcode)
ORDER BY dbo.ConvertDate_IN_US(dbo.acc_creditnote.crt_date, '/')

--==================================================================================

if object_id('tempdb..#Crt_Acct_Code') is not null                      
drop table #Crt_Acct_Code   

 create TABLE #Crt_Acct_Code    
 ( id  int identity, CN_account varchar(50),CN_accountName  varchar(500))     

Insert Into #Crt_Acct_Code
select distinct rtrim(CN_account),rtrim(CN_accountName)  from #CNAcct_Actcode order by rtrim(CN_accountname) --inv_accountName
--==============================================================
Declare @AcctStr varchar(8000),@StrAcctname varchar(8000),@StrFieldName varchar(8000),@CalculateFieldName varchar(8000)
set @AcctStr=''
set @StrFieldName=''
Set @CalculateFieldName =''

select @CalculateFieldName = @CalculateFieldName+ 'SUM(ISNULL([' + CN_accountName +'],0))' + ','  from #Crt_Acct_Code 
set @CalculateFieldName=(select substring(@CalculateFieldName,0,len(@CalculateFieldName)))


select @StrFieldName = @StrFieldName+ '[' + CN_accountName +']' + ','  from #Crt_Acct_Code 
set @StrFieldName=(select substring(@StrFieldName,0,len(@StrFieldName)))


select @AcctStr = @AcctStr+ '[' + CN_accountName +']' + ' decimal(18,2),'  from #Crt_Acct_Code 
set @StrAcctname=(select substring(@AcctStr,0,len(@AcctStr)))

IF @STRACCTNAME <> ''
BEGIN
	EXEC ('ALTER TABLE #CNACCT_DETAILFINAL ADD ' + @STRACCTNAME )        
	--=====================================================================
	--SELECT @CalculateFieldName
	--select @StrFieldName
	--SELECT @StrAcctname
	--========================================================================
	Declare @CNAcctName varchar(4000),@CNNO VARCHAR(15)
	Declare @Cnt int,@cntr int
	Set @Cnt=(select count(CNNO) from #CNAcct_DetailFinal)
	Set @Cntr=1
	WHILE @cntr<=@cnt
	BEGIN
		set @CNNO=(select CNNO from #CNAcct_DetailFinal WHERE PK_ID=@cntr)

		if object_id('tempdb..#CN_Acct_Code_Amt') is not null                      
		drop table #CN_Acct_Code_Amt  
	 
		Create TABLE #CN_Acct_Code_Amt
		(id  int identity, 
		 CN_Acct_Code varchar(50),
		 CN_accountName  varchar(500),
		 CN_INRAMT DECIMAL(18,2))     

		INSERT INTO #CN_ACCT_CODE_AMT
		SELECT	CN_ACCOUNT , 
				CN_ACCOUNTNAME, 
				SUM(ISNULL(CN_INRAMT,0)) AS CN_INRAMT 
		FROM	#CNACCT_ACTCODE 
		WHERE	CNNO=@CNNO
		GROUP BY CN_ACCOUNTNAME,CN_ACCOUNT

		Declare @Crt_AcctName varchar(4000),@Acct_Code VARCHAR(15),@Act_Amount varchar(20)
		Declare @CNCnt int,@CNcntr int
		Set @CNCnt=(select count(id) from #CN_Acct_Code_Amt)
		Set @CNcntr=1
		WHILE @CNcntr<=@CNCnt
		BEGIN
			set @Acct_Code=(Select CN_Acct_Code From #CN_Acct_Code_Amt where id=@CNcntr)
			
			Set @Crt_AcctName=(Select '['+CN_accountName+']' From #CN_Acct_Code_Amt where CN_Acct_Code=@Acct_Code)
					
			Set @Act_Amount =(Select isnull(CN_INRAMT,0) From #CN_Acct_Code_Amt where CN_Acct_Code=@Acct_Code)

	--		select @Acct_Code as Acct_Code,@Crt_AcctName as Crt_AcctName,@Act_Amount as Act_Amount,@CNNO as CNNO
	--		print('Update #CNAcct_DetailFinal Set '+@Crt_AcctName+' = '''+ @Act_Amount + ''' WHERE CNNO = '+@CNNO)
			Exec('Update #CNAcct_DetailFinal Set '+@Crt_AcctName+' = '''+ @Act_Amount + ''' WHERE CNNO = '+@CNNO)
			
			set @CNcntr=@CNcntr+1
		END
		set @cntr=@cntr+1
	END

	--=========================================================

	EXEC('INSERT INTO #CNAcct_DetailFinal 
		  Select '''' as CNNo,''TOTAL'' AS CNdate ,'''' AS ClientName ,SUM(ISNULL(CNAmount,0)) AS CNAmount,'+@CalculateFieldName+' from #CNAcct_DetailFinal')

	EXEC('Select '''''''' + CNNo as CNNo,CNdate ,ClientName ,CNAmount,'+@StrFieldName+' 
		  FROM #CNAcct_DetailFinal order by PK_ID ')
END
ELSE
BEGIN
	Select ''''+ CNNo as CNNo,
			CNdate ,
			ClientName ,
			CNAmount 
	FROM	#CNAcct_DetailFinal order by PK_ID 

END
--========================================================
----Checck Duplicate record
----select CN_ACCOUNTNAME from #CNAcct_Actcode 
----group by CNNO
----having  count(CN_ACCOUNTNAME)>1  
----=======================================================
----*/




GO

