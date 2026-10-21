/*  Rollback for EXPT_JOB_STATE_LINKSDB20_20261015.sql and
    EXPT_JOB_STATE_AGENT_JOBS_LINKSDB20_20261015.sql (LinksDB20 only).
    None of these objects existed on LinksDB20 before, so rollback is a removal, in this order:

     1. the two LinksDB20 Agent jobs ("LinksDB20 - Export job state + alerts" / "... watchdog"),
        only when every step of the job runs in LinksDB20 (the MP Cargo jobs on this server have
        other names and are never looked at). Deleting a job needs sysadmin (or job ownership):
        if a job is present and cannot be deleted the script stops here and drops nothing, so no
        job is left calling a missing procedure every 10 minutes.
     2. USP_EXPT_JOB_STATE_TICK, USP_EXPT_ALERT_RUN, USP_EXPT_JOB_STATE_REFRESH,
        USP_EXPT_CONSIGNMENT_RECENT.
     3. TBL_EXPT_JOB_STATE (derived) and TBL_EXPT_JOB_STATE_RUNLOG (log) - always.
        TBL_EXPT_ALERT holds who acknowledged which alert, and TBL_EXPT_ALERT_RULE the rule
        settings; both are dropped only when no alert was ever acknowledged. Otherwise they are
        kept and the script says how many acknowledgements there are; set
        @DropEvenIfAcknowledged = 1 below to discard them as well.

    After it: api/Export/JobState/... and Export/GetRecentConsignments return an error row
    (STATUS 101); the Angular alert service fails soft (empty bell). Nothing else is affected.
    Re-runnable.  SQL Server 2008 R2.                                                         */
USE [LinksDB20]
GO
SET NOCOUNT ON;

DECLARE @DropEvenIfAcknowledged BIT = 0;      -- 0 = keep TBL_EXPT_ALERT / _RULE if alerts were acknowledged
DECLARE @acks INT, @JOBID UNIQUEIDENTIFIER, @NAME SYSNAME, @i INT;

-- never drop these names anywhere else (the manilal database has live copies of all of them)
IF UPPER(DB_NAME()) <> 'LINKSDB20'
BEGIN
    PRINT '*** Connected to ' + DB_NAME() + ', not LinksDB20. Nothing done.';
    RETURN;
END

/* ---- 1. Agent jobs (LinksDB20 names only) ---------------------------------------------- */
-- A login that cannot read msdb would see "no job" - so any msdb error stops the rollback here.
BEGIN TRY
    SET @i = 1;
    WHILE @i <= 2
    BEGIN
        SELECT @NAME = CASE @i WHEN 1 THEN N'LinksDB20 - Export job state watchdog'
                               ELSE N'LinksDB20 - Export job state + alerts' END,
               @JOBID = NULL;
        SELECT @JOBID = job_id FROM msdb.dbo.sysjobs WHERE name = @NAME;

        IF @JOBID IS NULL
            PRINT 'Agent job "' + @NAME + '" not present - nothing to do.';
        ELSE IF EXISTS (SELECT 1 FROM msdb.dbo.sysjobsteps
                        WHERE job_id = @JOBID AND UPPER(ISNULL(database_name, '')) <> 'LINKSDB20')
            PRINT '*** Agent job "' + @NAME + '" has a step outside LinksDB20 - not this engine''s job, left alone.';
        ELSE IF ISNULL(IS_SRVROLEMEMBER('sysadmin'), 0) = 0
                AND NOT EXISTS (SELECT 1 FROM msdb.dbo.sysjobs WHERE job_id = @JOBID AND owner_sid = SUSER_SID())
            RAISERROR('Agent job "%s" exists but this login may not delete it. Re-run this rollback as sysadmin.', 16, 1, @NAME);
        ELSE
        BEGIN
            EXEC msdb.dbo.sp_delete_job @job_id = @JOBID, @delete_unused_schedule = 1;
            PRINT 'Agent job "' + @NAME + '" deleted.';
        END
        SET @i = @i + 1;
    END
END TRY
BEGIN CATCH
    PRINT '*** ' + ERROR_MESSAGE();
    RAISERROR('Rollback stopped at the Agent jobs - no procedure or table was dropped. Re-run as sysadmin.', 16, 1);
    RETURN;
END CATCH

/* ---- 2. procedures ------------------------------------------------------------------------ */
IF OBJECT_ID('dbo.USP_EXPT_JOB_STATE_TICK', 'P') IS NOT NULL
BEGIN DROP PROCEDURE dbo.USP_EXPT_JOB_STATE_TICK;     PRINT 'USP_EXPT_JOB_STATE_TICK dropped.'; END
IF OBJECT_ID('dbo.USP_EXPT_ALERT_RUN', 'P') IS NOT NULL
BEGIN DROP PROCEDURE dbo.USP_EXPT_ALERT_RUN;          PRINT 'USP_EXPT_ALERT_RUN dropped.'; END
IF OBJECT_ID('dbo.USP_EXPT_JOB_STATE_REFRESH', 'P') IS NOT NULL
BEGIN DROP PROCEDURE dbo.USP_EXPT_JOB_STATE_REFRESH;  PRINT 'USP_EXPT_JOB_STATE_REFRESH dropped.'; END
IF OBJECT_ID('dbo.USP_EXPT_CONSIGNMENT_RECENT', 'P') IS NOT NULL
BEGIN DROP PROCEDURE dbo.USP_EXPT_CONSIGNMENT_RECENT; PRINT 'USP_EXPT_CONSIGNMENT_RECENT dropped.'; END

/* ---- 3. tables ---------------------------------------------------------------------------- */
IF OBJECT_ID('dbo.TBL_EXPT_JOB_STATE', 'U') IS NOT NULL
BEGIN DROP TABLE dbo.TBL_EXPT_JOB_STATE;        PRINT 'TBL_EXPT_JOB_STATE dropped (derived data).'; END
IF OBJECT_ID('dbo.TBL_EXPT_JOB_STATE_RUNLOG', 'U') IS NOT NULL
BEGIN DROP TABLE dbo.TBL_EXPT_JOB_STATE_RUNLOG; PRINT 'TBL_EXPT_JOB_STATE_RUNLOG dropped (run log).'; END

SET @acks = 0;
IF OBJECT_ID('dbo.TBL_EXPT_ALERT', 'U') IS NOT NULL
    SELECT @acks = COUNT(*) FROM dbo.TBL_EXPT_ALERT WHERE acknowledged_at IS NOT NULL;

IF @acks = 0 OR @DropEvenIfAcknowledged = 1
BEGIN
    IF OBJECT_ID('dbo.TBL_EXPT_ALERT', 'U') IS NOT NULL
    BEGIN
        DROP TABLE dbo.TBL_EXPT_ALERT;
        PRINT 'TBL_EXPT_ALERT dropped (' + CAST(@acks AS VARCHAR(10)) + ' acknowledgement(s) discarded).';
    END
    IF OBJECT_ID('dbo.TBL_EXPT_ALERT_RULE', 'U') IS NOT NULL
    BEGIN
        DROP TABLE dbo.TBL_EXPT_ALERT_RULE;
        PRINT 'TBL_EXPT_ALERT_RULE dropped (rule settings).';
    END
END
ELSE
    PRINT 'TBL_EXPT_ALERT and TBL_EXPT_ALERT_RULE kept: ' + CAST(@acks AS VARCHAR(10))
          + ' alert(s) were acknowledged by users. Set @DropEvenIfAcknowledged = 1 and re-run to drop them.';
GO
