/*=====================================================================================
  LINKS  -  RUN dbo.USP_RPT_BRANCH_JOB_ANALYSIS_PBI AUTOMATICALLY, EVERY NIGHT
  Target database: Linksdb20   (host 180.179.207.163,15787)
  ------------------------------------------------------------------------------------
  WHY A SQL AGENT JOB

  SQL Server Agent is installed and RUNNING on this instance (checked 19-Sep-2026:
  "SQL Server Agent (MSSQLSERVER)", Running, Automatic) and already runs two jobs -
  the LinksDB20 backup plan at 00:33 and syspolicy_purge_history at 02:00. So the
  refresh belongs in Agent too: no Windows task, no script file on someone's PC, no
  dependency on anybody being logged in, and the run history is kept by SQL Server.

  WHAT GETS CREATED

    1. dbo.TBL_SHIPMENT_SUMMARY_RUNLOG  - one row per run: when, how long, ok or failed,
       the error if it failed, and the row counts afterwards. Agent keeps its own history
       but it is purged and awkward to query; this table is the operations record.
    2. dbo.USP_SHIPMENT_SUMMARY_DAILY   - a thin wrapper. It calls the real proc with no
       parameters (= daily open-period refresh), times it, and writes the log row. It
       swallows nothing: on error it logs, then re-raises so the Agent job goes red.
    3. Agent job "LinksDB20 - Shipment summary daily refresh", daily at 01:15,
       one step, two retries ten minutes apart.

  WHY 01:15
  After the backup (00:33) and before the policy purge (02:00), and well before office
  hours - the proc DELETEs and re-INSERTs the open period, so it should not overlap with
  people using the Power BI tables.

  WHY NO PARAMETERS IN THE STEP
  The proc defaults are exactly the daily behaviour:
      @DELETEFLAG = '1'  -> daily open-period refresh
      @FROMDT     = audit lock + 1 day  (today: lock is 20250331, so from 20250401)
      @TODT       = today
  It will never rewrite an audited period, because daily mode floors @FROMDT at the
  lock. Freezing a period after audit sign-off stays a MANUAL step - see section 5.

  BEFORE YOU RUN THIS
  Nobody has timed the proc on this data yet. Run section 0 once, by hand, and note how
  long it takes. If it runs for more than about twenty minutes, tell me and we will make
  the daily window narrower instead of "everything since the audit lock".
=====================================================================================*/

USE [Linksdb20]
GO

/*=====================================================================================
  0. TIME IT FIRST (run this by hand, once, and keep the output)
=====================================================================================*/
/*
DECLARE @t DATETIME = GETDATE()
EXEC dbo.USP_RPT_BRANCH_JOB_ANALYSIS_PBI          -- daily mode, defaults
SELECT SECONDS_TAKEN = DATEDIFF(SECOND, @t, GETDATE())
*/


/*=====================================================================================
  1. RUN LOG
=====================================================================================*/
IF OBJECT_ID('dbo.TBL_SHIPMENT_SUMMARY_RUNLOG') IS NULL
BEGIN
    CREATE TABLE dbo.TBL_SHIPMENT_SUMMARY_RUNLOG
    (
        RUN_ID        INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        STARTED_AT    DATETIME      NOT NULL,
        ENDED_AT      DATETIME      NULL,
        SECONDS       INT           NULL,
        STATUS        VARCHAR(10)   NOT NULL,      -- RUNNING | OK | FAILED
        ERR_MSG       NVARCHAR(2000) NULL,
        AUDITED_UPTO  VARCHAR(8)    NULL,
        JOB_ROWS      INT           NULL,          -- rows in TBL_SHIPMENT_SUMMARY_JOB after the run
        ORIGIN_ROWS   INT           NULL,          -- rows in TBL_SHIPMENT_SUMMARY_ORIGIN_YYMM
        EXCEPTIONS    INT           NULL,          -- documents the proc could not process
        RUN_BY        VARCHAR(128)  NULL
    )
    PRINT 'created dbo.TBL_SHIPMENT_SUMMARY_RUNLOG'
END
GO

/*=====================================================================================
  2. WRAPPER PROC - what the Agent job actually calls
=====================================================================================*/
IF OBJECT_ID('dbo.USP_SHIPMENT_SUMMARY_DAILY') IS NOT NULL
    DROP PROCEDURE dbo.USP_SHIPMENT_SUMMARY_DAILY
GO

CREATE PROCEDURE dbo.USP_SHIPMENT_SUMMARY_DAILY
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @RUN_ID INT, @T0 DATETIME = GETDATE()

    INSERT INTO dbo.TBL_SHIPMENT_SUMMARY_RUNLOG (STARTED_AT, STATUS, RUN_BY)
    VALUES (@T0, 'RUNNING', SUSER_SNAME())
    SET @RUN_ID = SCOPE_IDENTITY()

    BEGIN TRY
        /*  No parameters on purpose: the proc's own defaults ARE the daily refresh, and
            daily mode can never reach below the audit lock.                            */
        EXEC dbo.USP_RPT_BRANCH_JOB_ANALYSIS_PBI

        UPDATE dbo.TBL_SHIPMENT_SUMMARY_RUNLOG
           SET ENDED_AT     = GETDATE(),
               SECONDS      = DATEDIFF(SECOND, @T0, GETDATE()),
               STATUS       = 'OK',
               AUDITED_UPTO = (SELECT AUDITED_UPTO FROM dbo.TBL_SHIPMENT_SUMMARY_AUDITLOCK WHERE LOCK_ID = 1),
               JOB_ROWS     = (SELECT COUNT(*) FROM dbo.TBL_SHIPMENT_SUMMARY_JOB),
               ORIGIN_ROWS  = (SELECT COUNT(*) FROM dbo.TBL_SHIPMENT_SUMMARY_ORIGIN_YYMM),
               EXCEPTIONS   = (SELECT COUNT(*) FROM dbo.TBL_SHIPMENT_SUMMARY_EXCEPTIONS)
         WHERE RUN_ID = @RUN_ID
    END TRY
    BEGIN CATCH
        DECLARE @MSG NVARCHAR(2000) = ERROR_MESSAGE() + ' (line ' + CONVERT(VARCHAR(10), ERROR_LINE()) + ')'

        UPDATE dbo.TBL_SHIPMENT_SUMMARY_RUNLOG
           SET ENDED_AT = GETDATE(),
               SECONDS  = DATEDIFF(SECOND, @T0, GETDATE()),
               STATUS   = 'FAILED',
               ERR_MSG  = @MSG
         WHERE RUN_ID = @RUN_ID

        /*  Re-raise so the Agent job fails and the failure is visible, not silent.
            SQL Server 2008 R2: RAISERROR, not THROW.                                   */
        RAISERROR(@MSG, 16, 1)
    END CATCH
END
GO

GRANT EXECUTE ON dbo.USP_SHIPMENT_SUMMARY_DAILY TO PUBLIC
GO


/*=====================================================================================
  3. THE AGENT JOB
  Re-running this whole script is safe: the job is dropped and recreated.
  Change @owner below if 'sa' is disabled on this instance.
=====================================================================================*/
USE [msdb]
GO

DECLARE @job_name SYSNAME = N'LinksDB20 - Shipment summary daily refresh',
        @owner    SYSNAME = N'sa',
        @job_id   UNIQUEIDENTIFIER

IF NOT EXISTS (SELECT 1 FROM sys.server_principals WHERE name = @owner)
    SET @owner = SUSER_SNAME()          -- fall back to whoever deploys this

IF EXISTS (SELECT 1 FROM msdb.dbo.sysjobs WHERE name = @job_name)
BEGIN
    EXEC msdb.dbo.sp_delete_job @job_name = @job_name, @delete_unused_schedule = 1
    PRINT 'existing job removed'
END

EXEC msdb.dbo.sp_add_job
     @job_name              = @job_name,
     @enabled               = 1,
     @owner_login_name      = @owner,
     @description           = N'Rebuilds TBL_SHIPMENT_SUMMARY_JOB and TBL_SHIPMENT_SUMMARY_ORIGIN_YYMM for the open period (everything after the audit lock). Calls dbo.USP_SHIPMENT_SUMMARY_DAILY in Linksdb20, which logs every run to TBL_SHIPMENT_SUMMARY_RUNLOG. Freezing an audited period is a separate manual step.',
     @notify_level_eventlog = 2,        -- write to the Windows event log when it fails
     @job_id                = @job_id OUTPUT

EXEC msdb.dbo.sp_add_jobstep
     @job_id           = @job_id,
     @step_name        = N'Refresh open period',
     @subsystem        = N'TSQL',
     @database_name    = N'Linksdb20',
     @command          = N'EXEC dbo.USP_SHIPMENT_SUMMARY_DAILY;',
     @retry_attempts   = 2,             -- a blocked run gets two more chances
     @retry_interval   = 10,            -- minutes
     @on_success_action = 1,            -- quit reporting success
     @on_fail_action    = 2             -- quit reporting failure

EXEC msdb.dbo.sp_update_job @job_id = @job_id, @start_step_id = 1

/*  01:15 daily - after the 00:33 backup, before the 02:00 policy purge, and long before
    anyone opens Power BI.                                                              */
EXEC msdb.dbo.sp_add_jobschedule
     @job_id            = @job_id,
     @name              = N'Daily 01:15',
     @freq_type         = 4,            -- daily
     @freq_interval     = 1,            -- every day
     @freq_subday_type  = 1,            -- at the time below
     @active_start_time = 011500        -- 01:15:00
GO

/*  Run it on this server (without this the job exists but never fires). */
EXEC msdb.dbo.sp_add_jobserver
     @job_name    = N'LinksDB20 - Shipment summary daily refresh',
     @server_name = N'(LOCAL)'
GO

PRINT 'Agent job created. It will first run tonight at 01:15.'
GO


/*=====================================================================================
  4. CHECK IT WORKS - run these after deploying
=====================================================================================*/
/*
-- a) start it now rather than waiting for tonight
EXEC msdb.dbo.sp_start_job @job_name = N'LinksDB20 - Shipment summary daily refresh'

-- b) is it still running, and did it succeed? (run_status 1 = succeeded, 0 = failed)
SELECT TOP 10 h.run_date, h.run_time, h.run_duration, h.run_status, h.message
  FROM msdb.dbo.sysjobhistory h
 INNER JOIN msdb.dbo.sysjobs j ON j.job_id = h.job_id
 WHERE j.name = N'LinksDB20 - Shipment summary daily refresh'
 ORDER BY h.instance_id DESC

-- c) our own log: the one to look at each morning
SELECT TOP 10 * FROM Linksdb20.dbo.TBL_SHIPMENT_SUMMARY_RUNLOG ORDER BY RUN_ID DESC

-- d) documents the proc could not process (should normally be empty)
SELECT * FROM Linksdb20.dbo.TBL_SHIPMENT_SUMMARY_EXCEPTIONS

-- e) confirm the schedule
SELECT j.name, s.name, s.active_start_time, j.enabled
  FROM msdb.dbo.sysjobs j
 INNER JOIN msdb.dbo.sysjobschedules js ON js.job_id = j.job_id
 INNER JOIN msdb.dbo.sysschedules s ON s.schedule_id = js.schedule_id
 WHERE j.name = N'LinksDB20 - Shipment summary daily refresh'
*/


/*=====================================================================================
  5. AFTER AN AUDIT - FREEZING A PERIOD (stays manual, on purpose)

  The daily job never touches an audited period: it starts the day after the audit lock,
  which is 20250331 today. When the auditors sign off the next period, freeze it ONCE by
  hand and the daily job will automatically start from the day after:

      EXEC Linksdb20.dbo.USP_RPT_BRANCH_JOB_ANALYSIS_PBI
           @TODT = '20260331', @DELETEFLAG = '0'

  Freeze mode refuses a future date, refuses an empty window and requires @TODT, so a
  mistyped date changes nothing. Check the lock afterwards:

      SELECT * FROM Linksdb20.dbo.TBL_SHIPMENT_SUMMARY_AUDITLOCK

  This is deliberately NOT scheduled: freezing is an accounting decision, not a nightly
  routine.
=====================================================================================*/


/*=====================================================================================
  6. IF YOU EVER NEED TO STOP OR MOVE IT

      -- pause without deleting
      EXEC msdb.dbo.sp_update_job @job_name = N'LinksDB20 - Shipment summary daily refresh', @enabled = 0

      -- change the time (e.g. 02:30)
      EXEC msdb.dbo.sp_update_schedule @name = N'Daily 01:15', @active_start_time = 023000

      -- remove entirely
      EXEC msdb.dbo.sp_delete_job @job_name = N'LinksDB20 - Shipment summary daily refresh'
=====================================================================================*/
