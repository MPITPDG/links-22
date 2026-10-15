/*===============================================================================================
  EXPT_JOB_STATE_AGENT_JOBS_LINKSDB20_20261015.sql         (LinksDB20, SQL Server Agent)

  Why  : schedules the LinksDB20 export job-state engine (EXPT_JOB_STATE_LINKSDB20_20261015.sql must
         have run first). Same design as MP's 04_schedule.sql, under DIFFERENT job names:
           "LinksDB20 - Export job state + alerts"   every 10 minutes, starting 00:05 (so it runs at
                                                     :05/:15/... - between the MP runs at :00/:10/...),
                                                     one T-SQL step EXEC dbo.USP_EXPT_JOB_STATE_TICK
           "LinksDB20 - Export job state watchdog"   every minute; stops the main job once its current
                                                     run is older than 5 minutes (Agent has no step
                                                     timeout) and logs 'timeout' to the run log.
                                                     Stopping rolls back the open transaction, so the
                                                     previous run's data stays.

  DANGER this script is built around: MP Cargo's own engine runs on the SAME server as two LIVE Agent
  jobs that MP's 04_schedule.sql deletes and recreates BY NAME. This script never creates, deletes or
  changes a job under those names. Guard (step 1 and again in step 2): it aborts if either LinksDB20
  name were ever edited to equal an MP name, and it refuses to delete an existing job with a
  LinksDB20 name unless every step of that job runs in LinksDB20 (i.e. it is ours).

  Job owner: not passed, so SQL Agent makes the login running this script the owner (MP's final fix,
  commits c339733 / 85f8cf9 / 18964b1: 'sa' is disabled on this server). Run as a sysadmin login
  (e.g. the one that owns the existing "LinksDB20 - Shipment summary daily refresh" job).

  Safety : step 1 stops before touching msdb if any check fails. Re-runnable (our two jobs are
           dropped by id and recreated).
  Rollback: ROLLBACK_EXPT_JOB_STATE_LINKSDB20_20261015.sql removes both jobs (same guard) first.
  Alternative without Agent: POST api/Export/JobState/Refresh on the Links API (header
  X-JobState-Key = appSetting JobStateRefreshKey) from a Windows scheduled task every 10 minutes.
  SQL Server 2008 R2.
===============================================================================================*/
USE [LinksDB20]
GO
SET NOCOUNT ON;

/* ---- 1. prerequisites ------------------------------------------------------------------ */
DECLARE @problems TABLE (n INT IDENTITY(1,1), problem VARCHAR(600));
DECLARE @JOBNAME SYSNAME, @WDNAME SYSNAME;
SELECT  @JOBNAME = N'LinksDB20 - Export job state + alerts',
        @WDNAME  = N'LinksDB20 - Export job state watchdog';

IF UPPER(DB_NAME()) <> 'LINKSDB20'
    INSERT INTO @problems (problem) VALUES ('Connected to ' + DB_NAME() + ', not LinksDB20.');

IF ISNULL(IS_SRVROLEMEMBER('sysadmin'), 0) = 0
    INSERT INTO @problems (problem) VALUES ('The login ' + SUSER_SNAME() + ' is not sysadmin - it would own the jobs and must be able to create them.');

IF OBJECT_ID('dbo.USP_EXPT_JOB_STATE_TICK', 'P') IS NULL OR OBJECT_ID('dbo.TBL_EXPT_JOB_STATE_RUNLOG', 'U') IS NULL
    INSERT INTO @problems (problem) VALUES ('USP_EXPT_JOB_STATE_TICK / TBL_EXPT_JOB_STATE_RUNLOG missing - run EXPT_JOB_STATE_LINKSDB20_20261015.sql first.');

-- name-collision guard: the MP Cargo jobs on this server must never be touched by this script
IF @JOBNAME IN (N'ERP - Export job state + alerts', N'ERP - Export job state watchdog')
   OR @WDNAME IN (N'ERP - Export job state + alerts', N'ERP - Export job state watchdog')
   OR @JOBNAME = @WDNAME
    INSERT INTO @problems (problem) VALUES ('Job names collide with the MP Cargo jobs (or with each other) - refusing.');

-- an existing job under a LinksDB20 name must be ours: every step runs in LinksDB20
INSERT INTO @problems (problem)
SELECT 'SQL Agent job "' + J.name + '" already exists and step ' + CAST(S.step_id AS VARCHAR(10))
       + ' runs in database "' + ISNULL(S.database_name, '(none)') + '" - it is not this engine''s job; not touched.'
FROM   msdb.dbo.sysjobs J JOIN msdb.dbo.sysjobsteps S ON S.job_id = J.job_id
WHERE  J.name IN (@JOBNAME, @WDNAME)
  AND  UPPER(ISNULL(S.database_name, '')) <> 'LINKSDB20';

IF EXISTS (SELECT 1 FROM @problems)
BEGIN
    PRINT '*** Prerequisite check failed - NO Agent job was created, changed or deleted:';
    SELECT n AS [#], problem FROM @problems ORDER BY n;
    RAISERROR('Prerequisite check failed - see the list above.', 16, 1);
    SET NOEXEC ON;
END
ELSE
    PRINT 'Prerequisites OK (' + SUSER_SNAME() + ' on ' + DB_NAME() + ').';
GO

/* ---- 2. (re)create the two LinksDB20 jobs ----------------------------------------------- */
DECLARE @DB SYSNAME, @JOBNAME SYSNAME, @WDNAME SYSNAME, @JOBID UNIQUEIDENTIFIER, @WDCMD NVARCHAR(MAX);
SELECT  @DB      = DB_NAME(),
        @JOBNAME = N'LinksDB20 - Export job state + alerts',
        @WDNAME  = N'LinksDB20 - Export job state watchdog';

-- same guard again, in this batch (a batch cannot see step 1's variables)
IF UPPER(@DB) <> 'LINKSDB20'
   OR @JOBNAME IN (N'ERP - Export job state + alerts', N'ERP - Export job state watchdog')
   OR @WDNAME IN (N'ERP - Export job state + alerts', N'ERP - Export job state watchdog')
   OR EXISTS (SELECT 1 FROM msdb.dbo.sysjobs J JOIN msdb.dbo.sysjobsteps S ON S.job_id = J.job_id
              WHERE J.name IN (@JOBNAME, @WDNAME) AND UPPER(ISNULL(S.database_name, '')) <> 'LINKSDB20')
BEGIN
    RAISERROR('Job-name guard tripped - nothing done.', 16, 1);
    RETURN;
END

-- drop our two jobs by id (idempotent re-run); a job under our name with no steps is a leftover of
-- an interrupted run of this script and is dropped too
SELECT @JOBID = job_id FROM msdb.dbo.sysjobs WHERE name = @WDNAME;
IF @JOBID IS NOT NULL
    EXEC msdb.dbo.sp_delete_job @job_id = @JOBID, @delete_unused_schedule = 1;
SET @JOBID = NULL;
SELECT @JOBID = job_id FROM msdb.dbo.sysjobs WHERE name = @JOBNAME;
IF @JOBID IS NOT NULL
    EXEC msdb.dbo.sp_delete_job @job_id = @JOBID, @delete_unused_schedule = 1;

-- main job: every 10 minutes from 00:05, refresh + rules through the logging wrapper
EXEC msdb.dbo.sp_add_job
     @job_name = @JOBNAME, @enabled = 1,
     @description = N'LinksDB20 job state: USP_EXPT_JOB_STATE_TICK rebuilds TBL_EXPT_JOB_STATE, reconciles TBL_EXPT_ALERT, logs to TBL_EXPT_JOB_STATE_RUNLOG.';

EXEC msdb.dbo.sp_add_jobstep
     @job_name = @JOBNAME, @step_name = N'Tick: refresh state and run rules',
     @subsystem = N'TSQL', @database_name = @DB,
     @command = N'EXEC dbo.USP_EXPT_JOB_STATE_TICK;',
     @retry_attempts = 0, @on_success_action = 1, @on_fail_action = 2;

EXEC msdb.dbo.sp_add_jobschedule
     @job_name = @JOBNAME, @name = N'LinksDB20 job state - every 10 minutes from 00:05', @enabled = 1,
     @freq_type = 4, @freq_interval = 1,                 -- daily
     @freq_subday_type = 4, @freq_subday_interval = 10,  -- every 10 minutes
     @active_start_time = 500, @active_end_time = 235959;   -- 00:05:00 - offset from the MP runs

EXEC msdb.dbo.sp_add_jobserver @job_name = @JOBNAME, @server_name = N'(local)';

-- watchdog: 5-minute step timeout for the main job (refers to the LinksDB20 job name only)
SET @WDCMD = N'
DECLARE @START DATETIME;
SELECT  TOP 1 @START = A.start_execution_date
FROM    msdb.dbo.sysjobactivity A JOIN msdb.dbo.sysjobs J ON J.job_id = A.job_id
WHERE   J.name = N''' + REPLACE(@JOBNAME, N'''', N'''''') + N'''
  AND   A.session_id = (SELECT MAX(session_id) FROM msdb.dbo.syssessions)
  AND   A.start_execution_date IS NOT NULL AND A.stop_execution_date IS NULL
ORDER BY A.start_execution_date DESC;
IF @START IS NOT NULL AND @START < DATEADD(MINUTE, -5, GETDATE())
BEGIN
    EXEC msdb.dbo.sp_stop_job @job_name = N''' + REPLACE(@JOBNAME, N'''', N'''''') + N''';
    INSERT INTO dbo.TBL_EXPT_JOB_STATE_RUNLOG (run_at, ms, error)
    VALUES (@START, DATEDIFF(MILLISECOND, @START, GETDATE()), ''timeout: stopped by watchdog after 5 minutes'');
END';

EXEC msdb.dbo.sp_add_job
     @job_name = @WDNAME, @enabled = 1,
     @description = N'LinksDB20 job state: stops "LinksDB20 - Export job state + alerts" when a run exceeds 5 minutes (Agent has no step timeout).';

EXEC msdb.dbo.sp_add_jobstep
     @job_name = @WDNAME, @step_name = N'Stop runs older than 5 minutes',
     @subsystem = N'TSQL', @database_name = @DB, @command = @WDCMD,
     @retry_attempts = 0, @on_success_action = 1, @on_fail_action = 2;

EXEC msdb.dbo.sp_add_jobschedule
     @job_name = @WDNAME, @name = N'LinksDB20 job state watchdog - every minute', @enabled = 1,
     @freq_type = 4, @freq_interval = 1,
     @freq_subday_type = 4, @freq_subday_interval = 1,
     @active_start_time = 000000, @active_end_time = 235959;

EXEC msdb.dbo.sp_add_jobserver @job_name = @WDNAME, @server_name = N'(local)';

PRINT 'Agent jobs "' + @JOBNAME + '" and "' + @WDNAME + '" created, owned by ' + SUSER_SNAME() + '.';
GO

SET NOEXEC OFF;
GO

/* ---- 3. verify (read-only) --------------------------------------------------------------- */
SELECT  J.name, J.enabled, SUSER_SNAME(J.owner_sid) AS owner, S.step_name, S.database_name, S.command
FROM    msdb.dbo.sysjobs J LEFT JOIN msdb.dbo.sysjobsteps S ON S.job_id = J.job_id
WHERE   J.name IN (N'LinksDB20 - Export job state + alerts', N'LinksDB20 - Export job state watchdog')
ORDER BY J.name, S.step_id;
-- After ~10 minutes: SELECT TOP 5 * FROM dbo.TBL_EXPT_JOB_STATE_RUNLOG ORDER BY run_id DESC;  (error NULL = success)
GO
