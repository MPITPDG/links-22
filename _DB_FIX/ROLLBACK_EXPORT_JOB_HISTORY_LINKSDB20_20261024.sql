/*===============================================================================================
  ROLLBACK_EXPORT_JOB_HISTORY_LINKSDB20_20261024.sql         (LinksDB20)

  Rollback for EXPORT_JOB_HISTORY_LINKSDB20_20261024.sql (Export job view > History, phase 1). Neither of its objects
  existed on LinksDB20 before that script (checked 2026-10-24), so the rollback is a removal:

   1. dbo.USP_EXPT_JOB_HISTORY - only when its text names that script (so that script created it); a same-named
      procedure from anywhere else is left alone and reported.
   2. IX_TBL_USERTRACK_EXPTMASTER_CODE on dbo.TBL_USERTRACK_EXPTMASTER - only when its keys are exactly (CODE, DATETIME),
      the index that script creates. Set @DropIndex = 0 below to keep it (it only speeds up lookups by job number and
      costs inserts very little). Dropping it takes a short schema lock on the audit table.

  No row of any table is touched: the audit tables keep everything that was logged.
  After it: api/Export/JobHistory answers STATUS 101 (procedure not found) and the History card says the history is
  not available; nothing else is affected.

  Safety : stops by itself on any database other than LinksDB20. Re-runnable.  SQL Server 2008 R2.
===============================================================================================*/
USE [LinksDB20]
GO
SET NOCOUNT ON;

IF UPPER(DB_NAME()) <> 'LINKSDB20'
BEGIN
    PRINT '*** Connected to ' + DB_NAME() + ', not LinksDB20. Nothing done.';
    RETURN;
END

DECLARE @DropIndex BIT;
SET @DropIndex = 1;               -- 0 = keep IX_TBL_USERTRACK_EXPTMASTER_CODE

DECLARE @marker VARCHAR(100), @keys VARCHAR(400);
SET @marker = 'EXPORT_JOB_HISTORY_LINKSDB20_20261024';

/* ---- 1. the procedure (only this script's own) ------------------------------------------- */
IF OBJECT_ID('dbo.USP_EXPT_JOB_HISTORY', 'P') IS NULL
    PRINT 'USP_EXPT_JOB_HISTORY not present - nothing to do.';
ELSE IF CHARINDEX(@marker, ISNULL(OBJECT_DEFINITION(OBJECT_ID('dbo.USP_EXPT_JOB_HISTORY')), '')) = 0
    PRINT '*** USP_EXPT_JOB_HISTORY kept: it was not created by EXPORT_JOB_HISTORY_LINKSDB20_20261024.sql.';
ELSE
BEGIN
    DROP PROCEDURE dbo.USP_EXPT_JOB_HISTORY;
    PRINT 'USP_EXPT_JOB_HISTORY dropped.';
END

/* ---- 2. the index (only with that script's keys) ------------------------------------------ */
SELECT @keys = STUFF((SELECT ',' + c.name
                        FROM sys.indexes i
                             JOIN sys.index_columns ic ON ic.object_id = i.object_id AND ic.index_id = i.index_id
                             JOIN sys.columns c ON c.object_id = ic.object_id AND c.column_id = ic.column_id
                       WHERE i.object_id = OBJECT_ID('dbo.TBL_USERTRACK_EXPTMASTER') AND i.name = 'IX_TBL_USERTRACK_EXPTMASTER_CODE'
                       ORDER BY ic.is_included_column, ic.key_ordinal, c.name
                         FOR XML PATH('')), 1, 1, '');

IF @keys IS NULL
    PRINT 'IX_TBL_USERTRACK_EXPTMASTER_CODE not present - nothing to do.';
ELSE IF @keys <> 'CODE,DATETIME'
    PRINT '*** IX_TBL_USERTRACK_EXPTMASTER_CODE kept: its columns (' + @keys + ') are not the ones that script creates.';
ELSE IF @DropIndex = 0
    PRINT 'IX_TBL_USERTRACK_EXPTMASTER_CODE kept (@DropIndex = 0).';
ELSE
BEGIN
    DROP INDEX IX_TBL_USERTRACK_EXPTMASTER_CODE ON dbo.TBL_USERTRACK_EXPTMASTER;
    PRINT 'IX_TBL_USERTRACK_EXPTMASTER_CODE dropped.';
END
GO

/* ---- 3. verify (read-only) --------------------------------------------------------------- */
SELECT CASE WHEN OBJECT_ID('dbo.USP_EXPT_JOB_HISTORY', 'P') IS NULL THEN 'gone' ELSE 'still present' END AS [USP_EXPT_JOB_HISTORY],
       CASE WHEN EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.TBL_USERTRACK_EXPTMASTER')
                                                     AND name = 'IX_TBL_USERTRACK_EXPTMASTER_CODE')
            THEN 'still present' ELSE 'gone' END AS [IX_TBL_USERTRACK_EXPTMASTER_CODE];
GO
