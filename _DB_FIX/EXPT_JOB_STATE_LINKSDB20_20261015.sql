/*===============================================================================================
  EXPT_JOB_STATE_LINKSDB20_20261015.sql         (LinksDB20)

  Why  : ports MP Cargo's export "job state + alerts" engine (ManilalV5_WebApi
         Database\StoredProcedures\Export\JobState\01..04, live definitions in the manilal DB
         checked with OBJECT_DEFINITION on 2026-10-15 - identical to the repo files) and
         USP_EXPT_CONSIGNMENT_RECENT to LinksDB20, adapted to the data Links actually keeps.
         The Links API (JobStateController: api/Export/JobState/Refresh|Alerts|Acknowledge, and
         ExportController.GetRecentConsignments) reads these objects. None exist on LinksDB20 yet.

  Creates:
    dbo.TBL_EXPT_JOB_STATE         one row per in-scope export job (derived; rebuilt every run)
    dbo.TBL_EXPT_ALERT_RULE        rule catalogue, seeded below with the LinksDB20 settings
    dbo.TBL_EXPT_ALERT             one row per (rule, job) occurrence; acknowledgements live here
    dbo.TBL_EXPT_JOB_STATE_RUNLOG  one row per USP_EXPT_JOB_STATE_TICK run
    dbo.USP_EXPT_JOB_STATE_REFRESH rebuilds TBL_EXPT_JOB_STATE
    dbo.USP_EXPT_ALERT_RUN         evaluates the enabled rules, reconciles TBL_EXPT_ALERT
    dbo.USP_EXPT_JOB_STATE_TICK    REFRESH + ALERT_RUN + run log (what the Agent job calls)
    dbo.USP_EXPT_CONSIGNMENT_RECENT newest N consignments of a branch (Consignment Search landing list)
  The SQL Agent jobs are in EXPT_JOB_STATE_AGENT_JOBS_LINKSDB20_20261015.sql (needs sysadmin).

  What differs from MP (decided from read-only dry runs over LinksDB20 on 2026-10-15; every change
  is marked "LINKS:" in the code):
   1. Clearance-only jobs. Links parks customs-clearance-only jobs on placeholder voyages
      ("CLEARANCE ONLY" 202511506 = 555 of 2,656 jobs in the last 180 days; older: ONLY CLEARANCE,
      ONLY FOR CLEARANCE, ONLY CLERANCE, CATTLENACE, CATTLEA ACE). They never sail with Links, carry
      no container and their voyage ETD is a dummy (31/12/2026). New column clearance_only = vessel
      name LIKE '%CLEARANCE%' / '%CLERANCE%' / 'CATTLE%'. For those jobs: no ETD / sailing, own stage
      path OPENED -> DOCS_IN -> CARGO_IN -> SB_FILED -> INVOICED (10 as soon as invoiced; 389 of 395
      clearance invoices come after the SB), never BOOKED from the placeholder vessel.
      Without this: 401 invoiced clearance jobs would sit at SB_FILED, NO_MOVEMENT_7D would raise
      158 of its 241 hits on them, and SB_BEFORE_ETD would go CRIT on 62 clearance jobs on 29-31 Dec.
   2. Sailing fallback. MP treats "ETD passed" as sailed only once the SB is keyed. MAA and DEL do not
      key shipping bills in the ERP (0/109 and 61/180), so their jobs never "sailed" and piled up in
      NO_MOVEMENT_7D (MAA 39, DEL 10). Here the fallback also applies where the branch does not key
      SBs (sb_tracked = 0).
   3. work_done_dt (new column) = later of sailed_dt and opened_dt (clearance-only: later of sb_dt and
      opened_dt). 35% of Links jobs are opened in the ERP after the vessel sailed, so ages are counted
      from the later date. Used by BL_MISSING_AFTER_SAIL and the new NOT_INVOICED_AFTER_SAIL.
   4. Rules whose inputs are empty on LinksDB20 are seeded DISABLED: CARGO_OVERDUE and EDI_DUE
      (Tbl_Expt_Booking_Order and the HappyChic EDI dates are empty), DOCS_STALE (expt_doccalled is
      empty - documents go straight to expt_docrecd), NOT_INVOICED_AFTER_DELIVERY (expt_deliverymain is
      empty and the expt_master delivery fields are blank), CSD_APPROVAL_PENDING / CSD_QUERY (no CSD
      approval module: TBL_EXPT_CSD_APPROVAL does not exist; csd_* columns are kept, always NULL),
      VESSEL_UNASSIGNED (mapped to the "TO BE NOMINATED" voyage: 1 job in two years, none in 180 days;
      the Links UI has no vessel-assign popup either).
   5. New rule NOT_INVOICED_AFTER_SAIL (enabled): sailed (clearance-only: SB filed) 7..60 days ago and
      still not invoiced, CRIT from 21 days. Replaces the delivery-based rule Links cannot feed.
   6. BL tracking per branch ignores clearance-only jobs (they never get a Links BL).
   7. USP_EXPT_CONSIGNMENT_RECENT mirrors the LINKS USP_EXP_MST_EXPORT_SEARCH_LIST (EXPORTNO branch and
      final projection, incl. GRPID), not MP's: no DEL -> DEL,CAL expansion, FN_SAFE_FLOAT weights.
   8. MP's optional IX_expt_master_sysexpt_docrecd / IX_EXPT_MASTER_CMP_CITY_ID indexes are NOT
      created: expt_master has 32.7k rows on LinksDB20 (MP: 305k); a scan is cheap.

  Safety : step 1 checks every table/column/function the procedures read, the permissions, and that
           no name is taken by something else; it stops before creating anything if one fails.
           Tables are created only when absent (rows are never touched on a re-run; missing columns
           are added). Rule rows keep their live settings on a re-run (only texts are refreshed).
           Procedures are dropped and recreated. Nothing here writes to any existing business table.
           Step 8 runs one tick (fills the derived tables) - set @RunFirstTick = 0 to skip it.
           Re-runnable.
  Rollback: ROLLBACK_EXPT_JOB_STATE_LINKSDB20_20261015.sql
  SQL Server 2008 R2 (no CREATE OR ALTER, DROP IF EXISTS, IIF, CONCAT, FORMAT, STRING_SPLIT).
===============================================================================================*/
USE [LinksDB20]
GO
SET NOCOUNT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

/* ---- 1. prerequisites ------------------------------------------------------------------ */
DECLARE @problems TABLE (n INT IDENTITY(1,1), problem VARCHAR(400));

-- 1a. we must really be on LinksDB20 (if USE failed above the session is still in another DB)
IF UPPER(DB_NAME()) <> 'LINKSDB20'
    INSERT INTO @problems (problem) VALUES ('Connected to ' + DB_NAME() + ', not LinksDB20.');

-- 1b. every table/column the procedures read
DECLARE @need TABLE (obj SYSNAME, col SYSNAME);
INSERT INTO @need (obj, col) VALUES
 ('expt_master','exptno'),('expt_master','jobno'),('expt_master','expt_mode'),('expt_master','citycode'),
 ('expt_master','cmpcode'),('expt_master','expt_exporter'),('expt_master','expt_consignee'),('expt_master','username'),
 ('expt_master','sysexpt_docrecd'),('expt_master','expt_shipbillno'),('expt_master','expt_shipbilldt'),
 ('expt_master','sysexpt_shipbilldt'),('expt_master','expt_vessel'),('expt_master','vsl_port'),('expt_master','flightdt'),
 ('expt_master','actualflightdt'),('expt_master','syscarteddt'),('expt_master','JULES_P2_Sailed'),('expt_master','expt_blno'),
 ('expt_master','expt_hblno'),('expt_master','housebillno'),('expt_master','aerobillno'),('expt_master','expt_bldt'),
 ('expt_master','expt_hbldt'),('expt_master','housebilldt'),('expt_master','aerobilldt'),('expt_master','exptcancel'),
 ('expt_master','id'),('expt_master','HC_C2_SENTDT'),('expt_master','CO2_EMITION_LVL'),('expt_master','expt_noofpkgs'),
 ('expt_master','EXPT_GRWT'),('expt_master','EXPT_VOLUME'),('expt_master','EXPT_CHBLWT'),('expt_master','mawbdest'),
 ('expt_master','flightno'),('expt_master','actualflightno'),('expt_master','etaport1'),('expt_master','etaport2'),
 ('expt_master','EXPT_INVNO'),('expt_master','EXPT_FRT'),('expt_master','IsDiffAir'),
 ('acc_invjobno','inv_jobno'),('acc_invjobno','inv_no'),
 ('acc_invoice','inv_no'),('acc_invoice','MakerDT'),('acc_invoice','AuthorisationDate'),
 ('expt_doccalled','exptno'),('expt_doccalled','doccode'),('expt_doccalled','calleddt'),
 ('expt_docrecd','exptno'),('expt_docrecd','doccode'),('expt_docrecd','recddt'),
 ('expt_doclist','doccode'),('expt_doclist','document'),
 ('EXPT_ORDERNO','exptno'),('EXPT_ORDERNO','orderno'),('EXPT_ORDERNO','styleno'),('EXPT_ORDERNO','HC_WHS_DT'),
 ('EXPT_ORDERNO','HC_POST_DT'),('EXPT_ORDERNO','HC_TRAN1_DT_ACTUAL'),('EXPT_ORDERNO','HC_REMTR_DT'),
 ('EXPT_ORDERNO','HC_DOC_DT'),('EXPT_ORDERNO','HC_BKD_DT'),
 ('Tbl_Expt_Booking_Order','Id'),('Tbl_Expt_Booking_Order','Bookingdt'),('Tbl_Expt_Booking_Order','New_ship_dt'),
 ('Tbl_Expt_Booking_Order','CargoExpectDt'),('Tbl_Expt_Booking_Order','HC_BKD_PLDT'),('Tbl_Expt_Booking_Order','CragoRecvdDt'),
 ('Tbl_Expt_Booking_Order','Orderno'),('Tbl_Expt_Booking_Order','Styleno'),('Tbl_Expt_Booking_Order','ISAuthorised'),
 ('Tbl_Expt_Booking_Order','exptno'),
 ('expt_cargorecpt','exptno'),('expt_cargorecpt','recddate'),('expt_cargorecpt','sysrecddate'),
 ('expt_carting','exptno'),('expt_carting','syscartedon'),
 ('vsl_portdtls','vsl_rtno'),('vsl_portdtls','port'),('vsl_portdtls','etd'),('vsl_portdtls','sailing'),
 ('vsl_master','vsl_rtno'),('vsl_master','vsl_name'),
 ('expt_hbl','jobno'),('expt_hbl','hblno'),('expt_hbl','hbldt'),
 ('expt_mbl','jobno'),('expt_mbl','mblno'),('expt_mbl','mbldt'),
 ('expt_hbl1','jobno'),('expt_hbl1','hblno'),
 ('expt_deliverymain','keyfield'),('expt_deliverymain','codeno'),('expt_deliverymain','actualdt'),
 ('exp_master','exp_code'),('exp_master','exp_name'),
 ('consignee_master','con_code'),('consignee_master','con_name'),('consignee_master','cneefrance'),
 ('expt_container1','exptno'),('expt_container1','containerno'),
 ('expt_container','containerno'),('expt_container','HC_C2_SENTDT'),
 ('city_master','CITY_CODE'),('city_master','CITY_NAME'),
 ('TBL_EDI_CONSIGNEE_LIST','FK_GRPID'),('TBL_EDI_CONSIGNEE_LIST','CON_CODE');

INSERT INTO @problems (problem)
SELECT 'Missing column dbo.' + obj + '.' + col + '.' FROM @need WHERE COL_LENGTH('dbo.' + obj, col) IS NULL;

-- 1c. functions USP_EXPT_CONSIGNMENT_RECENT calls (same as the Links search proc)
IF OBJECT_ID('dbo.FN_EXP_MST_EXPORT_SEARCH_LIST_ORDERNO') IS NULL
    INSERT INTO @problems (problem) VALUES ('Function dbo.FN_EXP_MST_EXPORT_SEARCH_LIST_ORDERNO not found.');
IF OBJECT_ID('dbo.FN_SAFE_FLOAT') IS NULL
    INSERT INTO @problems (problem) VALUES ('Function dbo.FN_SAFE_FLOAT not found.');

-- 1d. permissions to create the objects
IF ISNULL(HAS_PERMS_BY_NAME(DB_NAME(), 'DATABASE', 'CREATE TABLE'), 0) = 0
    INSERT INTO @problems (problem) VALUES ('No CREATE TABLE permission on ' + DB_NAME() + '.');
IF ISNULL(HAS_PERMS_BY_NAME(DB_NAME(), 'DATABASE', 'CREATE PROCEDURE'), 0) = 0
    INSERT INTO @problems (problem) VALUES ('No CREATE PROCEDURE permission on ' + DB_NAME() + '.');

-- 1e. our names must be free, or already be the right kind of object
INSERT INTO @problems (problem)
SELECT 'dbo.' + x.nm + ' exists but is not a ' + CASE x.typ WHEN 'U' THEN 'table' ELSE 'stored procedure' END + '.'
FROM (          SELECT 'TBL_EXPT_JOB_STATE' nm, 'U' typ
      UNION ALL SELECT 'TBL_EXPT_ALERT_RULE', 'U'
      UNION ALL SELECT 'TBL_EXPT_ALERT', 'U'
      UNION ALL SELECT 'TBL_EXPT_JOB_STATE_RUNLOG', 'U'
      UNION ALL SELECT 'USP_EXPT_JOB_STATE_REFRESH', 'P'
      UNION ALL SELECT 'USP_EXPT_ALERT_RUN', 'P'
      UNION ALL SELECT 'USP_EXPT_JOB_STATE_TICK', 'P'
      UNION ALL SELECT 'USP_EXPT_CONSIGNMENT_RECENT', 'P') x
WHERE OBJECT_ID('dbo.' + x.nm) IS NOT NULL AND OBJECT_ID('dbo.' + x.nm, x.typ) IS NULL;

-- 1f. constraint / index names used below must not belong to another object
INSERT INTO @problems (problem)
SELECT 'Name ' + o.name + ' is already used by ' + OBJECT_NAME(o.parent_object_id) + '.'
FROM sys.objects o
WHERE o.name IN ('PK_TBL_EXPT_JOB_STATE', 'PK_TBL_EXPT_ALERT_RULE', 'CK_TBL_EXPT_ALERT_RULE_SEV',
                 'PK_TBL_EXPT_ALERT', 'PK_TBL_EXPT_JOB_STATE_RUNLOG', 'DF_TBL_EXPT_JOB_STATE_FRANCE',
                 'DF_TBL_EXPT_JOB_STATE_CLEARANCE', 'DF_TBL_EXPT_JOB_STATE_VSL_UNASSIGNED')
  AND OBJECT_NAME(o.parent_object_id) NOT IN ('TBL_EXPT_JOB_STATE', 'TBL_EXPT_ALERT_RULE', 'TBL_EXPT_ALERT', 'TBL_EXPT_JOB_STATE_RUNLOG');

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

/* ==== 2. tables (MP 01_TBL_EXPT_JOB_STATE.sql, LinksDB20 shape) ========================== */
/*
 TBL_EXPT_JOB_STATE   one row per in-scope export job, rebuilt by USP_EXPT_JOB_STATE_REFRESH.
                      Derived data only: safe to truncate at any time.
 TBL_EXPT_ALERT_RULE  the rule catalogue, seeded below. The predicates are implemented in
                      USP_EXPT_ALERT_RUN per rule_code; sql_predicate documents them. enabled,
                      severity, grace_days, max_days, crit_days and notify_* are live settings.
 TBL_EXPT_ALERT       one row per (rule, job) occurrence. At most one OPEN row per
                      (rule_code, exptno): open rows carry open_key = 0, a resolved row gets
                      open_key = alert_id; UX_TBL_EXPT_ALERT_OPEN is unique on
                      (rule_code, exptno, open_key). A plain column rather than a filtered index so
                      legacy connections with non-default SET options can still write to the table.
 TBL_EXPT_JOB_STATE_RUNLOG  one row per USP_EXPT_JOB_STATE_TICK run.
*/
IF OBJECT_ID('dbo.TBL_EXPT_JOB_STATE', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TBL_EXPT_JOB_STATE (
        exptno                VARCHAR(20)    NOT NULL,
        citycode              VARCHAR(10)    NOT NULL DEFAULT '',
        cmpid                 VARCHAR(10)    NOT NULL DEFAULT '',   -- expt_master.cmpcode
        mode                  VARCHAR(10)    NOT NULL DEFAULT '',
        exporter_code         NVARCHAR(20)   NOT NULL DEFAULT '',
        exporter_name         NVARCHAR(140)  NOT NULL DEFAULT '',
        consignee_code        NVARCHAR(20)   NOT NULL DEFAULT '',
        consignee_name        NVARCHAR(255)  NOT NULL DEFAULT '',
        owner                 VARCHAR(30)    NOT NULL DEFAULT '',   -- expt_master.username (= CMP_DTLS.cmpid)
        opened_dt             DATETIME       NULL,                  -- expt_master.sysexpt_docrecd
        stage                 VARCHAR(15)    NOT NULL,
        stage_rank            TINYINT        NOT NULL,              -- 1 OPENED .. 10 INVOICED
        docs_called_cnt       INT            NOT NULL DEFAULT 0,
        docs_recd_cnt         INT            NOT NULL DEFAULT 0,
        docs_pending_cnt      INT            NOT NULL DEFAULT 0,
        docs_pending_list     VARCHAR(1000)  NOT NULL DEFAULT '',
        docs_called_dt        DATETIME       NULL,
        cargo_expected_dt     DATETIME       NULL,
        booked_dt             DATETIME       NULL,
        cargo_in_dt           DATETIME       NULL,
        sb_no                 VARCHAR(30)    NULL,
        sb_dt                 DATETIME       NULL,
        vessel_name           VARCHAR(120)   NOT NULL DEFAULT '',
        etd                   DATETIME       NULL,
        sailed_dt             DATETIME       NULL,
        bl_no                 VARCHAR(40)    NULL,
        bl_dt                 DATETIME       NULL,
        delivered_dt          DATETIME       NULL,
        invoiced_dt           DATETIME       NULL,
        invoiced_flag         BIT            NOT NULL DEFAULT 0,
        billing_tracked       BIT            NOT NULL DEFAULT 0,    -- branch bills through acc_invoice
        bl_tracked            BIT            NOT NULL DEFAULT 0,    -- branch+mode records BLs in the ERP
        sb_tracked            BIT            NOT NULL DEFAULT 0,    -- branch+mode keys shipping bills in the ERP
        placeholder_vessel    BIT            NOT NULL DEFAULT 0,    -- clearance-only / TO BE NOMINATED / DOCS CANCELLED voyage
        vessel_unassigned     BIT            NOT NULL DEFAULT 0,    -- LINKS: sea job on vessel "TO BE NOMINATED"
        is_hc                 BIT            NOT NULL DEFAULT 0,    -- HappyChic C1 booking behind the job
        edi_pending_flag      BIT            NOT NULL DEFAULT 0,
        edi_bkd_missing_since DATETIME       NULL,
        last_activity_dt      DATETIME       NULL,
        days_since_activity   INT            NULL,
        refreshed_at          DATETIME       NOT NULL DEFAULT GETDATE(),
        france_consigned      BIT            NOT NULL CONSTRAINT DF_TBL_EXPT_JOB_STATE_FRANCE DEFAULT 0,
        csd_status            VARCHAR(10)    NULL,                  -- LINKS: always NULL (no CSD module)
        csd_status_by         NVARCHAR(100)  NULL,
        csd_status_at         DATETIME       NULL,
        csd_remark            NVARCHAR(1000) NULL,
        clearance_only        BIT            NOT NULL CONSTRAINT DF_TBL_EXPT_JOB_STATE_CLEARANCE DEFAULT 0,  -- LINKS
        work_done_dt          DATETIME       NULL,                  -- LINKS: later of sailed (clearance: SB) and opened
        CONSTRAINT PK_TBL_EXPT_JOB_STATE PRIMARY KEY CLUSTERED (exptno)
    );
    CREATE INDEX IX_TBL_EXPT_JOB_STATE_OWNER ON dbo.TBL_EXPT_JOB_STATE (owner, citycode);
    PRINT 'TBL_EXPT_JOB_STATE created.';
END
GO

-- re-run on an older shape: add any column that is missing (all nullable or defaulted)
IF COL_LENGTH('dbo.TBL_EXPT_JOB_STATE', 'vessel_unassigned') IS NULL
    ALTER TABLE dbo.TBL_EXPT_JOB_STATE ADD vessel_unassigned BIT NOT NULL
        CONSTRAINT DF_TBL_EXPT_JOB_STATE_VSL_UNASSIGNED DEFAULT 0;
GO
IF COL_LENGTH('dbo.TBL_EXPT_JOB_STATE', 'france_consigned') IS NULL
    ALTER TABLE dbo.TBL_EXPT_JOB_STATE ADD france_consigned BIT NOT NULL
        CONSTRAINT DF_TBL_EXPT_JOB_STATE_FRANCE DEFAULT 0;
GO
IF COL_LENGTH('dbo.TBL_EXPT_JOB_STATE', 'csd_status') IS NULL
    ALTER TABLE dbo.TBL_EXPT_JOB_STATE ADD csd_status VARCHAR(10) NULL;
GO
IF COL_LENGTH('dbo.TBL_EXPT_JOB_STATE', 'csd_status_by') IS NULL
    ALTER TABLE dbo.TBL_EXPT_JOB_STATE ADD csd_status_by NVARCHAR(100) NULL;
GO
IF COL_LENGTH('dbo.TBL_EXPT_JOB_STATE', 'csd_status_at') IS NULL
    ALTER TABLE dbo.TBL_EXPT_JOB_STATE ADD csd_status_at DATETIME NULL;
GO
IF COL_LENGTH('dbo.TBL_EXPT_JOB_STATE', 'csd_remark') IS NULL
    ALTER TABLE dbo.TBL_EXPT_JOB_STATE ADD csd_remark NVARCHAR(1000) NULL;
GO
IF COL_LENGTH('dbo.TBL_EXPT_JOB_STATE', 'clearance_only') IS NULL
    ALTER TABLE dbo.TBL_EXPT_JOB_STATE ADD clearance_only BIT NOT NULL
        CONSTRAINT DF_TBL_EXPT_JOB_STATE_CLEARANCE DEFAULT 0;
GO
IF COL_LENGTH('dbo.TBL_EXPT_JOB_STATE', 'work_done_dt') IS NULL
    ALTER TABLE dbo.TBL_EXPT_JOB_STATE ADD work_done_dt DATETIME NULL;
GO

IF OBJECT_ID('dbo.TBL_EXPT_ALERT_RULE', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TBL_EXPT_ALERT_RULE (
        rule_code        VARCHAR(40)    NOT NULL,
        description      VARCHAR(300)   NOT NULL,
        severity         VARCHAR(4)     NOT NULL,
        sql_predicate    VARCHAR(1000)  NOT NULL,
        enabled          BIT            NOT NULL DEFAULT 1,
        notify_owner     BIT            NOT NULL DEFAULT 1,
        notify_manager   BIT            NOT NULL DEFAULT 0,
        grace_days       INT            NOT NULL DEFAULT 0,
        max_days         INT            NULL,      -- upper age limit where the rule uses one (NULL = none)
        crit_days        INT            NULL,      -- escalate to CRIT from this age (NULL = never)
        CONSTRAINT PK_TBL_EXPT_ALERT_RULE PRIMARY KEY CLUSTERED (rule_code),
        CONSTRAINT CK_TBL_EXPT_ALERT_RULE_SEV CHECK (severity IN ('INFO', 'WARN', 'CRIT'))
    );
    PRINT 'TBL_EXPT_ALERT_RULE created.';
END
GO
IF COL_LENGTH('dbo.TBL_EXPT_ALERT_RULE', 'max_days') IS NULL
    ALTER TABLE dbo.TBL_EXPT_ALERT_RULE ADD max_days INT NULL;
GO
IF COL_LENGTH('dbo.TBL_EXPT_ALERT_RULE', 'crit_days') IS NULL
    ALTER TABLE dbo.TBL_EXPT_ALERT_RULE ADD crit_days INT NULL;
GO

/* ---- 3. rule catalogue (LinksDB20 settings) -----------------------------------------------
   New rows get the settings below. Existing rows keep their live settings (enabled, severity,
   grace_days, notify_*); only description / sql_predicate are refreshed, and max_days /
   crit_days are filled in where still NULL. Dry-run counts (2026-10-15) are in the header of
   the report and in step 8's output. */
DECLARE @R TABLE (rule_code VARCHAR(40), description VARCHAR(300), severity VARCHAR(4), sql_predicate VARCHAR(1000),
                  enabled BIT, notify_manager BIT, grace_days INT, max_days INT, crit_days INT);
INSERT INTO @R
          SELECT 'CARGO_OVERDUE', 'Announced cargo-ready date has passed and the cargo is not in yet', 'WARN',
       'cargo_expected_dt < today - grace_days AND stage_rank < 5 (CARGO_IN). LinksDB20: seeded disabled - cargo_expected_dt comes from Tbl_Expt_Booking_Order, which is empty.',
       0, 0, 0, NULL, NULL
UNION ALL SELECT 'DOCS_STALE', 'Documents called but still not received', 'WARN',
       'docs_pending_cnt > 0 AND stage_rank < 10 AND docs_called_dt <= today - grace_days. LinksDB20: seeded disabled - expt_doccalled is empty (documents go straight to expt_docrecd).',
       0, 0, 5, NULL, NULL
UNION ALL SELECT 'SB_BEFORE_ETD', 'Sea job sails within grace_days and no shipping bill is filed', 'CRIT',
       'mode = sea AND sb_no IS NULL AND sb_tracked = 1 AND placeholder_vessel = 0 AND etd BETWEEN today AND today + grace_days. Clearance-only / placeholder voyages carry no ETD.',
       1, 1, 2, NULL, NULL
UNION ALL SELECT 'EDI_DUE', 'HappyChic booking sent in C1 but the BKD EDI date is still empty', 'WARN',
       'is_hc = 1 AND edi_bkd_missing_since <= now - grace_days. LinksDB20: seeded disabled - no HappyChic bookings / EDI dates.',
       0, 0, 1, NULL, NULL
UNION ALL SELECT 'NO_MOVEMENT_7D', 'No activity on the job for grace_days (up to max_days) and it has not sailed; clearance-only jobs until their shipping bill is filed', 'INFO',
       'days_since_activity BETWEEN grace_days AND max_days AND ((clearance_only = 0 AND stage_rank < 7 (SAILED) AND placeholder_vessel = 0) OR (clearance_only = 1 AND stage_rank < 6 (SB_FILED)))',
       1, 0, 7, 60, NULL
UNION ALL SELECT 'BL_MISSING_AFTER_SAIL', 'Sailed/flown grace_days ago (or opened after sailing grace_days ago) and no BL/AWB recorded', 'WARN',
       'clearance_only = 0 AND sailed_dt <= now AND work_done_dt BETWEEN today - max_days AND today - grace_days AND bl_no IS NULL AND bl_tracked = 1 (work_done_dt = later of sailed_dt and opened_dt)',
       1, 0, 3, 60, NULL
UNION ALL SELECT 'NOT_INVOICED_AFTER_DELIVERY', 'Delivered grace_days ago and not invoiced', 'CRIT',
       'delivered_dt <= today - grace_days AND invoiced_flag = 0 AND billing_tracked = 1. LinksDB20: seeded disabled - no delivery data (expt_deliverymain empty); NOT_INVOICED_AFTER_SAIL covers this.',
       0, 1, 7, NULL, NULL
UNION ALL SELECT 'VESSEL_UNASSIGNED', 'Sea job still on the TO BE NOMINATED placeholder vessel grace_days to max_days after opening', 'WARN',
       'mode = sea AND vessel_unassigned = 1 AND opened_dt BETWEEN today - max_days AND today - grace_days AND stage_rank < 7 (SAILED). LinksDB20: seeded disabled - 1 job on TO BE NOMINATED in two years, none in 180 days.',
       0, 0, 5, 60, NULL
UNION ALL SELECT 'CSD_APPROVAL_PENDING', 'France-consigned job not yet sailed, awaiting CSD (France import) approval grace_days to max_days; CRIT from crit_days', 'WARN',
       'france_consigned = 1 AND ISNULL(csd_status, Pending) = Pending AND stage_rank < 7 AND opened_dt BETWEEN today - max_days AND today - grace_days. LinksDB20: seeded disabled - no CSD approval module (TBL_EXPT_CSD_APPROVAL); do not enable.',
       0, 0, 2, 60, 5
UNION ALL SELECT 'CSD_QUERY', 'CSD (France import) queried or rejected the job', 'CRIT',
       'france_consigned = 1 AND csd_status IN (Queried, Rejected) AND stage_rank < 9. LinksDB20: seeded disabled - no CSD approval module; csd_status is always NULL.',
       0, 1, 0, NULL, NULL
UNION ALL SELECT 'NOT_INVOICED_AFTER_SAIL', 'Sailed (clearance-only: shipping bill filed) grace_days ago and still not invoiced; CRIT from crit_days', 'WARN',
       'invoiced_flag = 0 AND billing_tracked = 1 AND work_done_dt BETWEEN today - max_days AND today - grace_days, CRIT from crit_days (work_done_dt = later of sailed_dt - clearance-only: sb_dt - and opened_dt)',
       1, 1, 7, 60, 21;

UPDATE T SET T.description = R.description, T.sql_predicate = R.sql_predicate
FROM   dbo.TBL_EXPT_ALERT_RULE T JOIN @R R ON R.rule_code = T.rule_code;

UPDATE T SET T.max_days = R.max_days
FROM   dbo.TBL_EXPT_ALERT_RULE T JOIN @R R ON R.rule_code = T.rule_code
WHERE  T.max_days IS NULL AND R.max_days IS NOT NULL;

UPDATE T SET T.crit_days = R.crit_days
FROM   dbo.TBL_EXPT_ALERT_RULE T JOIN @R R ON R.rule_code = T.rule_code
WHERE  T.crit_days IS NULL AND R.crit_days IS NOT NULL;

INSERT INTO dbo.TBL_EXPT_ALERT_RULE (rule_code, description, severity, sql_predicate, enabled, notify_owner,
                                     notify_manager, grace_days, max_days, crit_days)
SELECT R.rule_code, R.description, R.severity, R.sql_predicate, R.enabled, 1, R.notify_manager, R.grace_days,
       R.max_days, R.crit_days
FROM   @R R
WHERE  NOT EXISTS (SELECT 1 FROM dbo.TBL_EXPT_ALERT_RULE T WHERE T.rule_code = R.rule_code);
PRINT 'TBL_EXPT_ALERT_RULE seeded (' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' new rule(s)).';
GO

IF OBJECT_ID('dbo.TBL_EXPT_ALERT', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TBL_EXPT_ALERT (
        alert_id         INT IDENTITY(1,1) NOT NULL,
        rule_code        VARCHAR(40)    NOT NULL,
        exptno           VARCHAR(20)    NOT NULL,
        severity         VARCHAR(4)     NOT NULL,
        message          VARCHAR(500)   NOT NULL,
        owner            VARCHAR(30)    NOT NULL DEFAULT '',
        citycode         VARCHAR(10)    NOT NULL DEFAULT '',
        first_seen       DATETIME       NOT NULL DEFAULT GETDATE(),
        last_seen        DATETIME       NOT NULL DEFAULT GETDATE(),
        resolved_at      DATETIME       NULL,
        open_key         INT            NOT NULL DEFAULT 0,   -- 0 while open, alert_id once resolved
        acknowledged_by  VARCHAR(30)    NULL,
        acknowledged_at  DATETIME       NULL,
        CONSTRAINT PK_TBL_EXPT_ALERT PRIMARY KEY CLUSTERED (alert_id)
    );
    CREATE UNIQUE INDEX UX_TBL_EXPT_ALERT_OPEN ON dbo.TBL_EXPT_ALERT (rule_code, exptno, open_key);
    CREATE INDEX IX_TBL_EXPT_ALERT_OWNER ON dbo.TBL_EXPT_ALERT (owner, open_key) INCLUDE (severity, citycode);
    PRINT 'TBL_EXPT_ALERT created.';
END
GO

IF OBJECT_ID('dbo.TBL_EXPT_JOB_STATE_RUNLOG', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TBL_EXPT_JOB_STATE_RUNLOG (
        run_id           INT IDENTITY(1,1) NOT NULL,
        run_at           DATETIME       NOT NULL DEFAULT GETDATE(),
        ms               INT            NULL,
        jobs             INT            NULL,
        alerts_new       INT            NULL,
        alerts_resolved  INT            NULL,
        error            VARCHAR(2000)  NULL,      -- NULL = success
        CONSTRAINT PK_TBL_EXPT_JOB_STATE_RUNLOG PRIMARY KEY CLUSTERED (run_id)
    );
    PRINT 'TBL_EXPT_JOB_STATE_RUNLOG created.';
END
GO

/* ==== 4. USP_EXPT_JOB_STATE_REFRESH (MP 02, adapted) ===================================== */
/*
 Rebuilds TBL_EXPT_JOB_STATE (delete + insert in one transaction) for every non-cancelled export
 job opened in the last @SCOPEDAYS days (180) or not invoiced yet (floor: 730 days, older
 un-invoiced jobs are treated as abandoned).

 Facts and where they come from (same as MP unless marked LINKS)
   opened          expt_master.sysexpt_docrecd
   owner           expt_master.username (numeric login id = CMP_DTLS.cmpid)
   docs            expt_doccalled (called) vs expt_docrecd (received), names from expt_doclist
                   (LINKS: expt_doccalled is empty, so docs_pending_cnt is 0 and a job with
                   documents received is DOCS_IN)
   booking / CRD   Tbl_Expt_Booking_Order (LINKS: empty - booked_dt / cargo_expected_dt NULL)
   HappyChic EDI   EXPT_ORDERNO HC_* dates (LINKS: all NULL)
   cargo in        expt_cargorecpt.recddate, expt_carting.syscartedon, expt_master.syscarteddt
   shipping bill   expt_master.expt_shipbillno / sysexpt_shipbilldt
   vessel          expt_master.expt_vessel -> vsl_master.vsl_name.
                   LINKS placeholder voyages:
                     clearance_only    name LIKE '%CLEARANCE%' / '%CLERANCE%' / 'CATTLE%'
                     vessel_unassigned name = 'TO BE NOMINATED'
                     placeholder_vessel either of those, 'DOCS CANCELLED', or rtno LIKE '%XXXX%'
                   (rtno LIKE '%XXXXX%' - DOCS CANCELLED - is excluded from scope, as in MP).
   ETD / sailed    sea: vsl_portdtls (vsl_rtno + port) etd / sailing (dd/mm/yyyy text), else
                   JULES_P2_Sailed, EXPT_ORDERNO.HC_TRAN1_DT_ACTUAL, else ETD once passed and the
                   SB is filed - LINKS: or the branch does not key SBs (sb_tracked = 0: MAA, DEL).
                   LINKS: placeholder voyages have no ETD / sailing (their ETD is a dummy date).
                   air: expt_master.flightdt / actualflightdt
   BL / AWB        expt_hbl, expt_mbl, expt_hbl1 (jobno = exptno), else expt_master
                   expt_blno / expt_hblno / housebillno / aerobillno
   delivered       expt_deliverymain (LINKS: empty)
   invoiced        acc_invjobno.inv_jobno = exptno (+ acc_invoice.MakerDT)
   CSD approval    LINKS: no CSD module. france_consigned = consignee_master.cneefrance = 'Y'
                   (a fact, ~2 jobs); csd_* always NULL.
   work_done_dt    LINKS: later of sailed_dt and opened_dt; clearance-only: later of sb_dt and
                   opened_dt (NULL until sailed / SB filed).

 Stage = highest reached:
   10 INVOICED (invoiced and sailed or delivered) 9 DELIVERED 8 BL_RECEIVED 7 SAILED 6 SB_FILED
    5 CARGO_IN 4 BOOKED (LINKS: a placeholder vessel is not a booking) 3 DOCS_IN 2 DOCS_PENDING
    1 OPENED
   LINKS clearance-only path: 10 INVOICED as soon as invoiced, else 6 SB_FILED / 5 CARGO_IN /
   3 DOCS_IN / 2 DOCS_PENDING / 1 OPENED.

 Measured as the equivalent SELECT on LinksDB20 2026-10-15: 2,662 jobs in scope, under a minute
 cold through a remote read-only session.
*/
IF OBJECT_ID('dbo.USP_EXPT_JOB_STATE_REFRESH', 'P') IS NOT NULL
    DROP PROCEDURE dbo.USP_EXPT_JOB_STATE_REFRESH;
GO

CREATE PROCEDURE dbo.USP_EXPT_JOB_STATE_REFRESH
    @SCOPEDAYS INT = 180,
    @JOBS      INT = NULL OUTPUT    -- rows written (read by USP_EXPT_JOB_STATE_TICK)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    SET DATEFORMAT dmy;   -- ISDATE() on dd/mm/yyyy text
    SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;

    DECLARE @NOW DATETIME, @TODAY DATETIME, @FROM180 DATETIME, @FROM2Y DATETIME,
            @DORMANT INT, @T0 DATETIME, @ROWS INT;
    SELECT  @NOW = GETDATE(), @T0 = GETDATE(), @DORMANT = 60,
            @TODAY = DATEADD(DAY, DATEDIFF(DAY, 0, GETDATE()), 0);
    SELECT  @FROM180 = DATEADD(DAY, -ISNULL(@SCOPEDAYS, 180), @TODAY),
            @FROM2Y  = DATEADD(DAY, -730, @TODAY);

    IF OBJECT_ID('tempdb..#J') IS NOT NULL DROP TABLE #J;
    IF OBJECT_ID('tempdb..#S') IS NOT NULL DROP TABLE #S;

    -- one pass over expt_master
    -- LINKS: the vessel name and the placeholder classification are resolved here, once
        SELECT  E.exptno, LTRIM(RTRIM(ISNULL(E.jobno,''))) AS jobno, M.mode,
                LTRIM(RTRIM(ISNULL(E.citycode,''))) AS citycode, LTRIM(RTRIM(ISNULL(E.cmpcode,''))) AS cmpid,
                LTRIM(RTRIM(ISNULL(E.expt_exporter,''))) AS exporter_code, LTRIM(RTRIM(ISNULL(E.expt_consignee,''))) AS consignee_code,
                LTRIM(RTRIM(ISNULL(E.username,''))) AS owner, E.sysexpt_docrecd AS opened_dt,
                NULLIF(LTRIM(RTRIM(E.expt_shipbillno)),'') AS sb_no, E.expt_shipbilldt, E.sysexpt_shipbilldt,
                M.vsl_rtno, LTRIM(RTRIM(ISNULL(E.vsl_port,''))) AS vsl_port,
                E.flightdt, E.actualflightdt, E.syscarteddt, E.JULES_P2_Sailed,
                COALESCE(NULLIF(LTRIM(RTRIM(E.expt_blno)),''), NULLIF(LTRIM(RTRIM(E.expt_hblno)),''),
                         NULLIF(LTRIM(RTRIM(E.housebillno)),''), NULLIF(LTRIM(RTRIM(E.aerobillno)),'')) AS bl_no,
                COALESCE(NULLIF(LTRIM(RTRIM(E.expt_bldt)),''), NULLIF(LTRIM(RTRIM(E.expt_hbldt)),''),
                         NULLIF(LTRIM(RTRIM(E.housebilldt)),''), NULLIF(LTRIM(RTRIM(E.aerobilldt)),'')) AS bl_dt_txt,
                NULLIF(LTRIM(RTRIM(E.expt_hblno)),'') AS hblno, NULLIF(LTRIM(RTRIM(E.housebillno)),'') AS hawbno,
                ISNULL(V.vsl_name,'') AS vsl_name, K.clearance_only, K.vessel_unassigned,
                CASE WHEN M.mode = 'sea' AND (K.clearance_only = 1 OR K.vessel_unassigned = 1
                          OR V.vsl_name = 'DOCS CANCELLED' OR M.vsl_rtno LIKE '%XXXX%') THEN 1 ELSE 0 END AS placeholder_vessel
        INTO    #J
        FROM    expt_master E
                CROSS APPLY (SELECT LOWER(LTRIM(RTRIM(ISNULL(E.expt_mode,'')))) AS mode,
                                    LTRIM(RTRIM(ISNULL(E.expt_vessel,''))) AS vsl_rtno) M
                OUTER APPLY (SELECT TOP 1 LTRIM(RTRIM(ISNULL(VM.vsl_name,''))) AS vsl_name
                             FROM vsl_master VM WHERE VM.vsl_rtno = M.vsl_rtno AND M.vsl_rtno <> '') V
                -- LINKS: clearance-only placeholder voyages (CLEARANCE ONLY, ONLY CLEARANCE, ONLY FOR CLEARANCE,
                -- ONLY CLERANCE, CATTLENACE, CATTLEA ACE) and the unassigned-vessel placeholder TO BE NOMINATED
                CROSS APPLY (SELECT CASE WHEN M.mode = 'sea' AND (V.vsl_name LIKE '%CLEARANCE%' OR V.vsl_name LIKE '%CLERANCE%'
                                              OR V.vsl_name LIKE 'CATTLE%') THEN 1 ELSE 0 END AS clearance_only,
                                    CASE WHEN M.mode = 'sea' AND V.vsl_name = 'TO BE NOMINATED' THEN 1 ELSE 0 END AS vessel_unassigned) K
        WHERE   E.sysexpt_docrecd >= @FROM2Y
          AND   ISNULL(E.exptcancel,'') <> 'Y'
          -- "DOCS CANCELLED" placeholder voyage (rtno like MUM2099XXXXX): the job is dead, keep it out
          AND   ISNULL(E.expt_vessel,'') NOT LIKE '%XXXXX%';

    CREATE CLUSTERED INDEX CX_J ON #J (exptno);

    WITH
    INV AS (
        SELECT  IJ.inv_jobno AS exptno, MIN(ISNULL(AI.MakerDT, AI.AuthorisationDate)) AS invoiced_dt
        FROM    acc_invjobno IJ JOIN #J J ON J.exptno = IJ.inv_jobno
                LEFT JOIN acc_invoice AI ON AI.inv_no = IJ.inv_no
        GROUP BY IJ.inv_jobno
    ),
    JS AS (
        SELECT J.*, INV.invoiced_dt, CASE WHEN INV.exptno IS NULL THEN 0 ELSE 1 END AS invoiced_flag
        FROM   #J J LEFT JOIN INV ON INV.exptno = J.exptno
        WHERE  J.opened_dt >= @FROM180 OR INV.exptno IS NULL
    ),
    DC AS (
        SELECT  C.exptno, COUNT(DISTINCT C.doccode) AS called_cnt,
                COUNT(DISTINCT CASE WHEN R.exptno IS NULL THEN C.doccode END) AS pending_cnt,
                MIN(CASE WHEN C.calleddt >= '20000101' THEN C.calleddt END) AS called_dt
        FROM    expt_doccalled C JOIN JS ON JS.exptno = C.exptno
                LEFT JOIN expt_docrecd R ON R.exptno = C.exptno AND R.doccode = C.doccode
        GROUP BY C.exptno
    ),
    DR AS (
        SELECT  R.exptno, COUNT(DISTINCT R.doccode) AS recd_cnt, MAX(R.recddt) AS last_recd_dt
        FROM    expt_docrecd R JOIN JS ON JS.exptno = R.exptno
        GROUP BY R.exptno
    ),
    EO AS (
        SELECT  O.exptno,
                MAX(COALESCE(O.HC_WHS_DT, O.HC_POST_DT, O.HC_TRAN1_DT_ACTUAL, O.HC_REMTR_DT, O.HC_DOC_DT, O.HC_BKD_DT)) AS last_edi_dt,
                MAX(O.HC_TRAN1_DT_ACTUAL) AS hc_sailed_dt
        FROM    EXPT_ORDERNO O JOIN JS ON JS.exptno = O.exptno
        GROUP BY O.exptno
    ),
    BKL AS (
        SELECT  JS.exptno, BK.Id, BK.Bookingdt, ISNULL(BK.New_ship_dt, BK.CargoExpectDt) AS crd, BK.HC_BKD_PLDT,
                BK.CragoRecvdDt, CASE WHEN O.HC_BKD_DT IS NULL THEN 1 ELSE 0 END AS bkd_missing
        FROM    JS JOIN EXPT_ORDERNO O ON O.exptno = JS.exptno
                JOIN Tbl_Expt_Booking_Order BK ON BK.Orderno = O.orderno AND BK.Styleno = O.styleno
        WHERE   ISNULL(BK.ISAuthorised,'') <> ''
        UNION
        SELECT  JS.exptno, BK.Id, BK.Bookingdt, ISNULL(BK.New_ship_dt, BK.CargoExpectDt), BK.HC_BKD_PLDT,
                BK.CragoRecvdDt, 0
        FROM    JS JOIN Tbl_Expt_Booking_Order BK ON BK.exptno = JS.exptno
        WHERE   ISNULL(BK.ISAuthorised,'') <> ''
    ),
    BK AS (
        SELECT  exptno, MIN(Bookingdt) AS booked_dt, MIN(crd) AS cargo_expected_dt,
                MAX(CASE WHEN HC_BKD_PLDT IS NOT NULL THEN 1 ELSE 0 END) AS is_hc,
                MIN(CASE WHEN HC_BKD_PLDT IS NOT NULL AND bkd_missing = 1 THEN HC_BKD_PLDT END) AS edi_bkd_missing_since,
                MIN(CragoRecvdDt) AS bk_cargo_recd_dt
        FROM    BKL GROUP BY exptno
    ),
    CR AS (
        SELECT  X.exptno, MIN(X.dt) AS cargo_in_dt, MAX(X.sysdt) AS last_dt FROM (
            SELECT C.exptno, C.recddate AS dt, C.sysrecddate AS sysdt FROM expt_cargorecpt C JOIN JS ON JS.exptno = C.exptno
            UNION ALL
            SELECT K.exptno, K.syscartedon, K.syscartedon FROM expt_carting K JOIN JS ON JS.exptno = K.exptno
        ) X GROUP BY X.exptno
    ),
    VP AS (
        SELECT  JS.exptno,
                MIN(CASE WHEN LTRIM(P.etd) LIKE '[0-3][0-9]/[01][0-9]/[12][0-9][0-9][0-9]%' AND ISDATE(LEFT(LTRIM(P.etd),10)) = 1
                         THEN CONVERT(datetime, LEFT(LTRIM(P.etd),10), 103) END) AS etd,
                MIN(CASE WHEN LTRIM(P.sailing) LIKE '[0-3][0-9]/[01][0-9]/[12][0-9][0-9][0-9]%' AND ISDATE(LEFT(LTRIM(P.sailing),10)) = 1
                         THEN CONVERT(datetime, LEFT(LTRIM(P.sailing),10), 103) END) AS sailed_dt
        FROM    JS JOIN vsl_portdtls P ON P.vsl_rtno = JS.vsl_rtno AND P.port = JS.vsl_port
        WHERE   JS.vsl_rtno <> ''
          AND   JS.placeholder_vessel = 0     -- LINKS: a placeholder voyage's ETD is a dummy (CLEARANCE ONLY = 31/12/2026)
        GROUP BY JS.exptno
    ),
    BLX AS (
        SELECT X.exptno, MIN(X.blno) AS blno, MIN(X.bldt) AS bldt FROM (
            SELECT JS.exptno, NULLIF(LTRIM(RTRIM(H.hblno)),'') AS blno, H.hbldt AS bldt FROM JS JOIN expt_hbl H ON H.jobno = JS.exptno
            UNION ALL
            SELECT JS.exptno, NULLIF(LTRIM(RTRIM(M.mblno)),''), M.mbldt FROM JS JOIN expt_mbl M ON M.jobno = JS.exptno
            UNION ALL
            SELECT JS.exptno, NULLIF(LTRIM(RTRIM(H1.hblno)),''), NULL FROM JS JOIN expt_hbl1 H1 ON H1.jobno = JS.exptno
        ) X WHERE X.blno IS NOT NULL GROUP BY X.exptno
    ),
    BLCITY AS (   -- branch+mode pairs that actually record BLs in the ERP (>= 50% of shipped jobs)
        SELECT JS.citycode, JS.mode FROM JS LEFT JOIN BLX ON BLX.exptno = JS.exptno
        WHERE  JS.sb_no IS NOT NULL
          AND  JS.clearance_only = 0          -- LINKS: clearance-only jobs never get a Links BL
        GROUP BY JS.citycode, JS.mode
        HAVING SUM(CASE WHEN COALESCE(BLX.blno, JS.bl_no) IS NOT NULL THEN 1 ELSE 0 END) * 2 >= COUNT(*)
    ),
    SBCITY AS (   -- branch+mode pairs that key shipping bills into the ERP (>= 50% of jobs)
        SELECT citycode, mode FROM JS GROUP BY citycode, mode
        HAVING SUM(CASE WHEN sb_no IS NOT NULL THEN 1 ELSE 0 END) * 2 >= COUNT(*)
    ),
    INVCITY AS (   -- branches whose billing is in acc_invoice
        SELECT DISTINCT citycode FROM JS WHERE invoiced_flag = 1
    ),
    DLR AS (
        SELECT JS.exptno, D.actualdt FROM JS JOIN expt_deliverymain D ON D.keyfield = 'jobno'  AND D.codeno = JS.jobno WHERE JS.jobno <> ''
        UNION ALL
        SELECT JS.exptno, D.actualdt FROM JS JOIN expt_deliverymain D ON D.keyfield = 'fcrno'  AND D.codeno = JS.hblno
        UNION ALL
        SELECT JS.exptno, D.actualdt FROM JS JOIN expt_deliverymain D ON D.keyfield = 'hawbno' AND D.codeno = JS.hawbno
    ),
    DL AS (
        SELECT  exptno, MIN(CASE WHEN LTRIM(actualdt) LIKE '[0-3][0-9]/[01][0-9]/[12][0-9][0-9][0-9]%' AND ISDATE(LEFT(LTRIM(actualdt),10)) = 1
                                 THEN CONVERT(datetime, LEFT(LTRIM(actualdt),10), 103) END) AS delivered_dt
        FROM    DLR GROUP BY exptno
    ),
    S0 AS (
        SELECT  JS.exptno, JS.citycode, JS.cmpid, JS.mode, JS.exporter_code,
                LTRIM(RTRIM(ISNULL(XM.exp_name,''))) AS exporter_name, JS.consignee_code,
                LTRIM(RTRIM(ISNULL(CM.con_name,''))) AS consignee_name, JS.owner, JS.opened_dt,
                ISNULL(DC.called_cnt,0) AS docs_called_cnt, ISNULL(DR.recd_cnt,0) AS docs_recd_cnt,
                ISNULL(DC.pending_cnt,0) AS docs_pending_cnt,
                ISNULL(DC.called_dt, JS.opened_dt) AS docs_called_dt,
                BK.cargo_expected_dt, BK.booked_dt,
                COALESCE(CR.cargo_in_dt, JS.syscarteddt, BK.bk_cargo_recd_dt) AS cargo_in_dt,
                JS.sb_no,
                COALESCE(JS.sysexpt_shipbilldt,
                         CASE WHEN LTRIM(JS.expt_shipbilldt) LIKE '[0-3][0-9]/[01][0-9]/[12][0-9][0-9][0-9]%' AND ISDATE(LEFT(LTRIM(JS.expt_shipbilldt),10)) = 1
                              THEN CONVERT(datetime, LEFT(LTRIM(JS.expt_shipbilldt),10), 103) END) AS sb_dt,
                CASE WHEN JS.mode = 'sea' AND JS.vsl_rtno <> '' THEN JS.vsl_name + ' (' + JS.vsl_rtno + ')' ELSE '' END AS vessel_name,
                CASE WHEN JS.mode = 'sea' THEN VP.etd
                     WHEN LTRIM(JS.flightdt) LIKE '[0-3][0-9]/[01][0-9]/[12][0-9][0-9][0-9]%' AND ISDATE(LEFT(LTRIM(JS.flightdt),10)) = 1
                     THEN CONVERT(datetime, LEFT(LTRIM(JS.flightdt),10), 103) END AS etd,
                CASE WHEN JS.mode = 'sea' AND JS.placeholder_vessel = 1 THEN NULL   -- LINKS: placeholder voyages never sail
                     WHEN JS.mode = 'sea' THEN COALESCE(VP.sailed_dt, JS.JULES_P2_Sailed, EO.hc_sailed_dt,
                                                      -- LINKS: "OR SC.citycode IS NULL" - branches that do not key SBs (MAA, DEL)
                                                      CASE WHEN (JS.sb_no IS NOT NULL OR SC.citycode IS NULL)
                                                                AND VP.etd < @TODAY AND VP.etd >= DATEADD(DAY, -@DORMANT * 6, @TODAY) THEN VP.etd END)
                     WHEN LTRIM(JS.actualflightdt) LIKE '[0-3][0-9]/[01][0-9]/[12][0-9][0-9][0-9]%' AND ISDATE(LEFT(LTRIM(JS.actualflightdt),10)) = 1
                     THEN CONVERT(datetime, LEFT(LTRIM(JS.actualflightdt),10), 103) END AS sailed_dt,
                COALESCE(BLX.blno, JS.bl_no) AS bl_no,
                CASE WHEN BLX.bldt LIKE '[0-3][0-9]/[01][0-9]/[12][0-9][0-9][0-9]%' AND ISDATE(LEFT(BLX.bldt,10)) = 1 THEN CONVERT(datetime, LEFT(BLX.bldt,10), 103)
                     WHEN LTRIM(JS.bl_dt_txt) LIKE '[0-3][0-9]/[01][0-9]/[12][0-9][0-9][0-9]%' AND ISDATE(LEFT(LTRIM(JS.bl_dt_txt),10)) = 1
                     THEN CONVERT(datetime, LEFT(LTRIM(JS.bl_dt_txt),10), 103) END AS bl_dt,
                DL.delivered_dt, JS.invoiced_dt, JS.invoiced_flag,
                CASE WHEN IC.citycode IS NULL THEN 0 ELSE 1 END AS billing_tracked,
                CASE WHEN BC.citycode IS NULL THEN 0 ELSE 1 END AS bl_tracked,
                CASE WHEN SC.citycode IS NULL THEN 0 ELSE 1 END AS sb_tracked,
                JS.placeholder_vessel, JS.vessel_unassigned, JS.clearance_only,
                ISNULL(BK.is_hc,0) AS is_hc, BK.edi_bkd_missing_since,
                CASE WHEN BK.edi_bkd_missing_since IS NOT NULL THEN 1 ELSE 0 END AS edi_pending_flag,
                DR.last_recd_dt, CR.last_dt AS cargo_last_dt, EO.last_edi_dt,
                CASE WHEN CM.cneefrance = 'Y' THEN 1 ELSE 0 END AS france_consigned,
                -- LINKS: no CSD approval module (TBL_EXPT_CSD_APPROVAL) - the columns stay, always NULL
                CAST(NULL AS VARCHAR(10)) AS csd_status, CAST(NULL AS NVARCHAR(100)) AS csd_status_by,
                CAST(NULL AS DATETIME) AS csd_status_at, CAST(NULL AS NVARCHAR(1000)) AS csd_remark
        FROM    JS
                LEFT JOIN exp_master XM       ON XM.exp_code = JS.exporter_code
                LEFT JOIN consignee_master CM ON CM.con_code = JS.consignee_code
                LEFT JOIN DC ON DC.exptno = JS.exptno
                LEFT JOIN DR ON DR.exptno = JS.exptno
                LEFT JOIN EO ON EO.exptno = JS.exptno
                LEFT JOIN BK ON BK.exptno = JS.exptno
                LEFT JOIN CR ON CR.exptno = JS.exptno
                LEFT JOIN VP ON VP.exptno = JS.exptno
                LEFT JOIN DL ON DL.exptno = JS.exptno
                LEFT JOIN BLX ON BLX.exptno = JS.exptno
                LEFT JOIN INVCITY IC ON IC.citycode = JS.citycode
                LEFT JOIN BLCITY BC ON BC.citycode = JS.citycode AND BC.mode = JS.mode
                LEFT JOIN SBCITY SC ON SC.citycode = JS.citycode AND SC.mode = JS.mode
    ),
    S1 AS (
        SELECT  S0.*,
                CASE WHEN clearance_only = 1 THEN          -- LINKS: clearance-only path (never books / sails with Links)
                          CASE WHEN invoiced_flag = 1                          THEN 10
                               WHEN sb_no IS NOT NULL                          THEN 6
                               WHEN cargo_in_dt IS NOT NULL                    THEN 5
                               WHEN docs_recd_cnt > 0 AND docs_pending_cnt = 0 THEN 3
                               WHEN docs_pending_cnt > 0                       THEN 2
                               ELSE 1 END
                     WHEN invoiced_flag = 1 AND (delivered_dt IS NOT NULL OR sailed_dt <= @NOW) THEN 10
                     WHEN delivered_dt IS NOT NULL                            THEN 9
                     WHEN bl_no IS NOT NULL AND sailed_dt <= @NOW             THEN 8
                     WHEN sailed_dt <= @NOW                                   THEN 7
                     WHEN sb_no IS NOT NULL                                   THEN 6
                     WHEN cargo_in_dt IS NOT NULL                             THEN 5
                     WHEN booked_dt IS NOT NULL
                          OR (vessel_name <> '' AND placeholder_vessel = 0)   THEN 4   -- LINKS: a placeholder is not a booking
                     WHEN docs_recd_cnt > 0 AND docs_pending_cnt = 0          THEN 3
                     WHEN docs_pending_cnt > 0                                THEN 2
                     ELSE 1 END AS stage_rank,
                (SELECT MAX(A.d) FROM (SELECT opened_dt AS d UNION ALL SELECT last_recd_dt UNION ALL SELECT cargo_last_dt
                                       UNION ALL SELECT last_edi_dt UNION ALL SELECT sb_dt UNION ALL SELECT sailed_dt
                                       UNION ALL SELECT delivered_dt UNION ALL SELECT invoiced_dt UNION ALL SELECT booked_dt) A
                 WHERE A.d <= @NOW) AS last_activity_dt,
                -- LINKS: the date the operational work finished, counted from the job's opening when later
                CASE WHEN clearance_only = 1 THEN
                          CASE WHEN sb_dt IS NULL THEN NULL WHEN sb_dt > opened_dt THEN sb_dt ELSE opened_dt END
                     WHEN sailed_dt <= @NOW THEN
                          CASE WHEN sailed_dt > opened_dt THEN sailed_dt ELSE opened_dt END END AS work_done_dt
        FROM    S0
    ),
    S AS (
        SELECT S1.*, DATEDIFF(DAY, last_activity_dt, @NOW) AS days_since_activity
        FROM S1
    )
    SELECT  * INTO #S FROM S;

    BEGIN TRAN;
        DELETE FROM dbo.TBL_EXPT_JOB_STATE;

        INSERT INTO dbo.TBL_EXPT_JOB_STATE (
            exptno, citycode, cmpid, mode, exporter_code, exporter_name, consignee_code, consignee_name,
            owner, opened_dt, stage, stage_rank, docs_called_cnt, docs_recd_cnt, docs_pending_cnt,
            docs_pending_list, docs_called_dt, cargo_expected_dt, booked_dt, cargo_in_dt, sb_no, sb_dt,
            vessel_name, etd, sailed_dt, bl_no, bl_dt, delivered_dt, invoiced_dt, invoiced_flag,
            billing_tracked, bl_tracked, sb_tracked, placeholder_vessel, vessel_unassigned, is_hc, edi_pending_flag, edi_bkd_missing_since,
            last_activity_dt, days_since_activity, refreshed_at,
            france_consigned, csd_status, csd_status_by, csd_status_at, csd_remark,
            clearance_only, work_done_dt)
        SELECT  LEFT(exptno, 20), LEFT(citycode, 10), LEFT(cmpid, 10), LEFT(mode, 10),
                LEFT(exporter_code, 20), LEFT(exporter_name, 140), LEFT(consignee_code, 20), LEFT(consignee_name, 255),
                LEFT(owner, 30), opened_dt,
                CASE stage_rank WHEN 10 THEN 'INVOICED' WHEN 9 THEN 'DELIVERED' WHEN 8 THEN 'BL_RECEIVED'
                                WHEN 7 THEN 'SAILED' WHEN 6 THEN 'SB_FILED' WHEN 5 THEN 'CARGO_IN'
                                WHEN 4 THEN 'BOOKED' WHEN 3 THEN 'DOCS_IN' WHEN 2 THEN 'DOCS_PENDING'
                                ELSE 'OPENED' END,
                stage_rank, docs_called_cnt, docs_recd_cnt, docs_pending_cnt, '', docs_called_dt,
                cargo_expected_dt, booked_dt, cargo_in_dt, LEFT(sb_no, 30), sb_dt, LEFT(vessel_name, 120),
                etd, sailed_dt, LEFT(bl_no, 40), bl_dt, delivered_dt, invoiced_dt, invoiced_flag,
                billing_tracked, bl_tracked, sb_tracked, placeholder_vessel, vessel_unassigned, is_hc, edi_pending_flag, edi_bkd_missing_since,
                last_activity_dt, days_since_activity, @NOW,
                france_consigned, csd_status, LEFT(csd_status_by, 100), csd_status_at, LEFT(csd_remark, 1000),
                clearance_only, work_done_dt
        FROM    #S;
        SET @ROWS = @@ROWCOUNT;

        -- names of the documents still pending
        UPDATE  T
        SET     T.docs_pending_list = LEFT(ISNULL(STUFF((
                    SELECT ', ' + LTRIM(RTRIM(ISNULL(L.document, C.doccode)))
                    FROM   expt_doccalled C LEFT JOIN expt_doclist L ON L.doccode = C.doccode
                    WHERE  C.exptno = T.exptno
                      AND  NOT EXISTS (SELECT 1 FROM expt_docrecd R WHERE R.exptno = C.exptno AND R.doccode = C.doccode)
                    GROUP BY C.doccode, L.document
                    FOR XML PATH('')), 1, 2, ''), ''), 1000)
        FROM    dbo.TBL_EXPT_JOB_STATE T
        WHERE   T.docs_pending_cnt > 0;
    COMMIT;

    SET @JOBS = @ROWS;
    SELECT  @ROWS AS JOBS, DATEDIFF(MILLISECOND, @T0, GETDATE()) AS ELAPSED_MS;
END
GO

/* ==== 5. USP_EXPT_ALERT_RUN (MP 03, adapted) ============================================= */
/*
 Evaluates every enabled rule in TBL_EXPT_ALERT_RULE over TBL_EXPT_JOB_STATE (run
 USP_EXPT_JOB_STATE_REFRESH first) and reconciles TBL_EXPT_ALERT:
   - condition true, no open alert        -> INSERT (first_seen = last_seen = now)
   - condition true, open alert exists    -> last_seen = now, message/severity refreshed
   - open alert, condition no longer true -> resolved_at = now, open_key = alert_id
     (also when the rule is disabled or the job has left the state table)
 Acknowledgement does not close an alert; it only records who saw it.

 Rule predicates are fixed per rule_code below; grace_days, max_days, crit_days, severity and
 enabled are read from the rule table at run time.
 LINKS changes: NO_MOVEMENT_7D covers clearance-only jobs until their SB is filed and reads
 max_days (default 60); BL_MISSING_AFTER_SAIL counts from work_done_dt and reads max_days;
 SB_BEFORE_ETD skips placeholder voyages; new NOT_INVOICED_AFTER_SAIL; crit_days escalation
 also applies to NOT_INVOICED_AFTER_SAIL; VESSEL_UNASSIGNED names the placeholder voyage.

 Result: one row INSERTED, REFRESHED, RESOLVED, OPEN_TOTAL, OPEN_CRIT, OPEN_WARN, OPEN_INFO,
 ELAPSED_MS.
*/
IF OBJECT_ID('dbo.USP_EXPT_ALERT_RUN', 'P') IS NOT NULL
    DROP PROCEDURE dbo.USP_EXPT_ALERT_RUN;
GO

CREATE PROCEDURE dbo.USP_EXPT_ALERT_RUN
    @INSERTED INT = NULL OUTPUT,    -- read by USP_EXPT_JOB_STATE_TICK
    @RESOLVED INT = NULL OUTPUT
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    DECLARE @NOW DATETIME, @TODAY DATETIME, @DORMANT INT,
            @INS INT, @UPD INT, @RES INT;
    SELECT  @NOW = GETDATE(), @TODAY = DATEADD(DAY, DATEDIFF(DAY, 0, GETDATE()), 0), @DORMANT = 60;

    IF OBJECT_ID('tempdb..#HIT') IS NOT NULL DROP TABLE #HIT;
    CREATE TABLE #HIT (rule_code VARCHAR(40) NOT NULL, exptno VARCHAR(20) NOT NULL, severity VARCHAR(4) NOT NULL,
                       message VARCHAR(500) NOT NULL, owner VARCHAR(30) NOT NULL, citycode VARCHAR(10) NOT NULL,
                       PRIMARY KEY (rule_code, exptno));

    -- enabled rules with their live settings
    -- crit_days: escalate to CRIT once the age reaches it (NULL = no escalation)
    DECLARE @RULE TABLE (rule_code VARCHAR(40) PRIMARY KEY, severity VARCHAR(4), grace INT, max_days INT, crit_days INT);
    INSERT INTO @RULE SELECT rule_code, severity, grace_days, max_days, crit_days FROM dbo.TBL_EXPT_ALERT_RULE WHERE enabled = 1;

    INSERT INTO #HIT (rule_code, exptno, severity, message, owner, citycode)
    SELECT  R.rule_code, S.exptno,
            CASE WHEN R.crit_days IS NOT NULL
                      AND (   (R.rule_code = 'CSD_APPROVAL_PENDING'    AND S.opened_dt    <= DATEADD(DAY, -R.crit_days, @TODAY))
                           OR (R.rule_code = 'NOT_INVOICED_AFTER_SAIL' AND S.work_done_dt <= DATEADD(DAY, -R.crit_days, @TODAY)))   -- LINKS
                 THEN 'CRIT' ELSE R.severity END,
            ISNULL(LEFT(CASE R.rule_code
                WHEN 'CARGO_OVERDUE' THEN
                    'Cargo expected ' + CONVERT(VARCHAR(10), S.cargo_expected_dt, 103) + ', not received ('
                    + CONVERT(VARCHAR(10), DATEDIFF(DAY, S.cargo_expected_dt, @TODAY)) + ' days late). Stage ' + S.stage
                WHEN 'DOCS_STALE' THEN
                    CONVERT(VARCHAR(10), S.docs_pending_cnt) + ' document(s) pending since '
                    + CONVERT(VARCHAR(10), S.docs_called_dt, 103) + ': ' + S.docs_pending_list
                WHEN 'SB_BEFORE_ETD' THEN
                    'ETD ' + CONVERT(VARCHAR(10), S.etd, 103) + ' on ' + S.vessel_name + ' and no shipping bill filed'
                WHEN 'EDI_DUE' THEN
                    'HappyChic C1 sent ' + CONVERT(VARCHAR(16), S.edi_bkd_missing_since, 103)
                    + ', BKD EDI date still empty'
                WHEN 'NO_MOVEMENT_7D' THEN
                    CASE WHEN S.clearance_only = 1 THEN 'Clearance only, no shipping bill yet. ' ELSE '' END   -- LINKS
                    + 'No activity for ' + CONVERT(VARCHAR(10), S.days_since_activity) + ' days (last '
                    + CONVERT(VARCHAR(10), S.last_activity_dt, 103) + '). Stage ' + S.stage
                WHEN 'BL_MISSING_AFTER_SAIL' THEN
                    CASE WHEN S.mode = 'air' THEN 'Flown ' ELSE 'Sailed ' END + CONVERT(VARCHAR(10), S.sailed_dt, 103)
                    + ', no ' + CASE WHEN S.mode = 'air' THEN 'AWB' ELSE 'BL' END + ' recorded'
                WHEN 'NOT_INVOICED_AFTER_DELIVERY' THEN
                    'Delivered ' + CONVERT(VARCHAR(10), S.delivered_dt, 103) + ' ('
                    + CONVERT(VARCHAR(10), DATEDIFF(DAY, S.delivered_dt, @TODAY)) + ' days ago), not invoiced'
                WHEN 'NOT_INVOICED_AFTER_SAIL' THEN   -- LINKS
                    CASE WHEN S.clearance_only = 1 THEN 'Clearance only: shipping bill filed ' + CONVERT(VARCHAR(10), S.sb_dt, 103)
                         WHEN S.mode = 'air'       THEN 'Flown ' + CONVERT(VARCHAR(10), S.sailed_dt, 103)
                         ELSE 'Sailed ' + CONVERT(VARCHAR(10), S.sailed_dt, 103) END
                    + CASE WHEN S.work_done_dt = S.opened_dt
                                AND S.opened_dt > ISNULL(CASE WHEN S.clearance_only = 1 THEN S.sb_dt ELSE S.sailed_dt END, S.opened_dt)
                           THEN ', job opened ' + CONVERT(VARCHAR(10), S.opened_dt, 103) ELSE '' END
                    + ', not invoiced (' + CONVERT(VARCHAR(10), DATEDIFF(DAY, S.work_done_dt, @TODAY)) + ' days)'
                WHEN 'VESSEL_UNASSIGNED' THEN
                    'Opened ' + CONVERT(VARCHAR(10), S.opened_dt, 103) + ' (' + CONVERT(VARCHAR(10), DATEDIFF(DAY, S.opened_dt, @TODAY))
                    + ' days ago), still on placeholder vessel ' + S.vessel_name + '. Stage ' + S.stage
                WHEN 'CSD_APPROVAL_PENDING' THEN
                    'Awaiting CSD approval for ' + CONVERT(VARCHAR(10), DATEDIFF(DAY, S.opened_dt, @TODAY))
                    + ' days (docs received ' + CONVERT(VARCHAR(10), S.opened_dt, 103) + '). Stage ' + S.stage
                WHEN 'CSD_QUERY' THEN
                    'CSD ' + CASE WHEN S.csd_status = 'Rejected' THEN 'rejected' ELSE 'queried' END
                    + ' by ' + CONVERT(VARCHAR(100), ISNULL(S.csd_status_by, '?'))
                    + ISNULL(' on ' + CONVERT(VARCHAR(10), S.csd_status_at, 103), '')
                    + ': ' + CONVERT(VARCHAR(300), ISNULL(S.csd_remark, ''))
            END + ' - ' + S.consignee_name, 500), R.rule_code),
            S.owner, S.citycode
    FROM    dbo.TBL_EXPT_JOB_STATE S
            JOIN @RULE R ON
               (R.rule_code = 'CARGO_OVERDUE'
                    AND S.cargo_expected_dt < DATEADD(DAY, -R.grace, @TODAY) AND S.stage_rank < 5)
            OR (R.rule_code = 'DOCS_STALE'
                    AND S.docs_pending_cnt > 0 AND S.stage_rank < 10 AND S.docs_called_dt <= DATEADD(DAY, -R.grace, @TODAY))
            OR (R.rule_code = 'SB_BEFORE_ETD'
                    AND S.mode = 'sea' AND S.sb_no IS NULL AND S.sb_tracked = 1
                    AND S.placeholder_vessel = 0                                              -- LINKS
                    AND S.etd >= @TODAY AND S.etd < DATEADD(DAY, R.grace + 1, @TODAY))
            OR (R.rule_code = 'EDI_DUE'
                    AND S.is_hc = 1 AND S.edi_bkd_missing_since <= DATEADD(DAY, -R.grace, @NOW))
            OR (R.rule_code = 'NO_MOVEMENT_7D'
                    AND S.days_since_activity >= R.grace AND S.days_since_activity <= ISNULL(R.max_days, @DORMANT)
                    AND (   (S.clearance_only = 0 AND S.stage_rank < 7 AND S.placeholder_vessel = 0)
                         OR (S.clearance_only = 1 AND S.stage_rank < 6)))                     -- LINKS: clearance-only until SB_FILED
            OR (R.rule_code = 'BL_MISSING_AFTER_SAIL'                                         -- LINKS: counted from work_done_dt
                    AND S.clearance_only = 0 AND S.sailed_dt <= @NOW
                    AND S.work_done_dt <= DATEADD(DAY, -R.grace, @TODAY)
                    AND S.work_done_dt >= DATEADD(DAY, -ISNULL(R.max_days, @DORMANT), @TODAY)
                    AND S.bl_no IS NULL AND S.bl_tracked = 1)
            OR (R.rule_code = 'NOT_INVOICED_AFTER_DELIVERY'
                    AND S.delivered_dt <= DATEADD(DAY, -R.grace, @TODAY)
                    AND S.invoiced_flag = 0 AND S.billing_tracked = 1)
            OR (R.rule_code = 'NOT_INVOICED_AFTER_SAIL'                                       -- LINKS
                    AND S.invoiced_flag = 0 AND S.billing_tracked = 1
                    AND S.work_done_dt <= DATEADD(DAY, -R.grace, @TODAY)
                    AND (R.max_days IS NULL OR S.work_done_dt >= DATEADD(DAY, -R.max_days, @TODAY)))   -- seed: 60
            -- NO_MOVEMENT_7D keeps excluding placeholder vessels, so a TO BE NOMINATED job is flagged once, here
            OR (R.rule_code = 'VESSEL_UNASSIGNED'
                    AND S.mode = 'sea' AND S.vessel_unassigned = 1 AND S.stage_rank < 7
                    AND S.opened_dt <= DATEADD(DAY, -R.grace, @TODAY)
                    AND (R.max_days IS NULL OR S.opened_dt >= DATEADD(DAY, -R.max_days, @TODAY)))   -- seed: 60
            -- CSD approval: LINKS has no CSD module; both rules are seeded disabled (csd_status is always NULL)
            OR (R.rule_code = 'CSD_APPROVAL_PENDING'
                    AND S.france_consigned = 1 AND ISNULL(S.csd_status, 'Pending') = 'Pending' AND S.stage_rank < 7
                    AND S.opened_dt <= DATEADD(DAY, -R.grace, @TODAY)
                    AND (R.max_days IS NULL OR S.opened_dt >= DATEADD(DAY, -R.max_days, @TODAY)))
            OR (R.rule_code = 'CSD_QUERY'
                    AND S.france_consigned = 1 AND S.csd_status IN ('Queried', 'Rejected') AND S.stage_rank < 9);

    BEGIN TRAN;
        -- still firing: refresh
        UPDATE  A
        SET     A.last_seen = @NOW, A.message = H.message, A.severity = H.severity,
                A.owner = H.owner, A.citycode = H.citycode
        FROM    dbo.TBL_EXPT_ALERT A
                JOIN #HIT H ON H.rule_code = A.rule_code AND H.exptno = A.exptno
        WHERE   A.open_key = 0;
        SET @UPD = @@ROWCOUNT;

        -- new
        INSERT INTO dbo.TBL_EXPT_ALERT (rule_code, exptno, severity, message, owner, citycode, first_seen, last_seen, open_key)
        SELECT  H.rule_code, H.exptno, H.severity, H.message, H.owner, H.citycode, @NOW, @NOW, 0
        FROM    #HIT H
        WHERE   NOT EXISTS (SELECT 1 FROM dbo.TBL_EXPT_ALERT A
                            WHERE A.rule_code = H.rule_code AND A.exptno = H.exptno AND A.open_key = 0);
        SET @INS = @@ROWCOUNT;

        -- cleared (condition false, rule disabled, or job out of scope)
        UPDATE  A
        SET     A.resolved_at = @NOW, A.open_key = A.alert_id
        FROM    dbo.TBL_EXPT_ALERT A
        WHERE   A.open_key = 0
          AND   NOT EXISTS (SELECT 1 FROM #HIT H WHERE H.rule_code = A.rule_code AND H.exptno = A.exptno);
        SET @RES = @@ROWCOUNT;
    COMMIT;

    SELECT  @INSERTED = @INS, @RESOLVED = @RES;
    SELECT  @INS AS INSERTED, @UPD AS REFRESHED, @RES AS RESOLVED,
            COUNT(*) AS OPEN_TOTAL,
            SUM(CASE WHEN severity = 'CRIT' THEN 1 ELSE 0 END) AS OPEN_CRIT,
            SUM(CASE WHEN severity = 'WARN' THEN 1 ELSE 0 END) AS OPEN_WARN,
            SUM(CASE WHEN severity = 'INFO' THEN 1 ELSE 0 END) AS OPEN_INFO,
            DATEDIFF(MILLISECOND, @NOW, GETDATE()) AS ELAPSED_MS
    FROM    dbo.TBL_EXPT_ALERT
    WHERE   open_key = 0;
END
GO

/* ==== 6. USP_EXPT_JOB_STATE_TICK (MP 04, verbatim) ======================================== */
/*
 Runs USP_EXPT_JOB_STATE_REFRESH then USP_EXPT_ALERT_RUN and writes one row to
 TBL_EXPT_JOB_STATE_RUNLOG (run_at, ms, jobs, alerts_new, alerts_resolved, error). On failure it
 logs the error and re-raises, so the Agent job shows as failed.
*/
IF OBJECT_ID('dbo.USP_EXPT_JOB_STATE_TICK', 'P') IS NOT NULL
    DROP PROCEDURE dbo.USP_EXPT_JOB_STATE_TICK;
GO

CREATE PROCEDURE dbo.USP_EXPT_JOB_STATE_TICK
AS
BEGIN
    SET NOCOUNT ON;
    DECLARE @T0 DATETIME, @JOBS INT, @INS INT, @RES INT, @ERR VARCHAR(2000);
    SET @T0 = GETDATE();

    BEGIN TRY
        EXEC dbo.USP_EXPT_JOB_STATE_REFRESH @JOBS = @JOBS OUTPUT;
        EXEC dbo.USP_EXPT_ALERT_RUN @INSERTED = @INS OUTPUT, @RESOLVED = @RES OUTPUT;

        INSERT INTO dbo.TBL_EXPT_JOB_STATE_RUNLOG (run_at, ms, jobs, alerts_new, alerts_resolved, error)
        VALUES (@T0, DATEDIFF(MILLISECOND, @T0, GETDATE()), @JOBS, @INS, @RES, NULL);
    END TRY
    BEGIN CATCH
        IF XACT_STATE() <> 0 ROLLBACK;
        SET @ERR = LEFT(ISNULL(ERROR_PROCEDURE(), '') + ' line ' + CONVERT(VARCHAR(10), ERROR_LINE())
                        + ': ' + ERROR_MESSAGE(), 2000);
        INSERT INTO dbo.TBL_EXPT_JOB_STATE_RUNLOG (run_at, ms, jobs, alerts_new, alerts_resolved, error)
        VALUES (@T0, DATEDIFF(MILLISECOND, @T0, GETDATE()), @JOBS, @INS, @RES, @ERR);
        RAISERROR('USP_EXPT_JOB_STATE_TICK failed: %s', 16, 1, @ERR);
    END CATCH
END
GO

/* ==== 7. USP_EXPT_CONSIGNMENT_RECENT (MP, rebased on the LINKS search proc) =============== */
/*
 "Show me the consignments we opened most recently" for one branch - the landing list the
 Consignment Search screen shows before the operator has typed anything.

 A SIBLING of USP_EXP_MST_EXPORT_SEARCH_LIST: it lifts the LinksDB20 copy of that proc's EXPORTNO
 branch (same #TMP_SEARCH_TABLE columns, same joins, same post-processing, same final projection
 incl. GRPID) and changes ONE thing, the row selection:
   search proc :  ... AND EXPTNO LIKE '%' + @SEARCH_VALUE + '%'   (no ORDER BY in the final SELECT)
   this proc   :  TOP (@top) ... ORDER BY EM.id DESC, carried as SORT_ID to the final ORDER BY
 EXPT_MASTER.id (INT IDENTITY) is the only dependable recency key: the date columns are
 operator-typed text and EXPTNO's leading digits are a company/branch prefix.

 LINKS differences from the MP copy: scope is CITYCODE = @citycode exactly (the Links search proc
 has no DEL -> DEL,CAL expansion); weights through dbo.FN_SAFE_FLOAT as decimal(18,3); GRPID column
 as in the Links search proc; no INCOTERM / CONTFRT columns. The temp-table text columns are
 sized to their source columns so a long value can never fail the insert. CO2_EMITION_LVL '0.000'
 is returned as '0' (text) - the Links search proc returns 0 (int), which would fail on a
 non-zero value; none exists today.

 Called by ExportController.GetRecentConsignments (CommonSearch: Type1 = CITYCODE, Type2 = CMPCODE,
 Type3 = top). Table = rows (STATUS '100' envelope), Table1 = SEARCH_HEAD caption.
*/
IF OBJECT_ID('dbo.USP_EXPT_CONSIGNMENT_RECENT', 'P') IS NOT NULL
    DROP PROCEDURE dbo.USP_EXPT_CONSIGNMENT_RECENT;
GO

CREATE PROCEDURE [dbo].[USP_EXPT_CONSIGNMENT_RECENT]
    @citycode NVARCHAR(3),
    @cmpid    NVARCHAR(2),
    @top      INT = 50
AS
BEGIN
	SET NOCOUNT ON;

	IF @top IS NULL OR @top < 1 SET @top = 50;
	IF @top > 500              SET @top = 500;

	IF OBJECT_ID('tempdb..#TMP_SEARCH_TABLE') IS NOT NULL
	DROP TABLE #TMP_SEARCH_TABLE

	CREATE TABLE #TMP_SEARCH_TABLE(
		JOBEXIST VARCHAR(15),
		EDISENT VARCHAR(30),
		CONTAINEREXIST VARCHAR(3),
		ACTUALFLIGHTDT  VARCHAR(15),
		EXPT_MODE  VARCHAR(5),
		CO2_EMITION_LVL  VARCHAR(30),
		EXPTNO VARCHAR(25),
		SHIPPER VARCHAR(150),
		CONSIGNEE VARCHAR(255),
		PKGS VARCHAR(20),
		VSL_NAME VARCHAR(150),
		ORDER_NO VARCHAR(MAX),
		HOUSEBILLNO VARCHAR(50),
		AEROBILLNO VARCHAR(50),
		GRWT VARCHAR(30),
		VOLUME VARCHAR(30),
		VOLWT decimal(18,3),
		CHBLWT decimal(18,3),
		HAWBDT VARCHAR(50),
		MAWBDEST VARCHAR(50),
		FLIGHTDTLS VARCHAR(1000),
		ACTFLIGHTDTLS VARCHAR(1000),
		P_PKGS VARCHAR(30),
		P_GRWT VARCHAR(30),
		P_CHBLWT VARCHAR(30),
		ETAPORT1 VARCHAR(10),
		ETAPORT2 VARCHAR(10),
		EXPTCANCEL VARCHAR(50),
		INVNO VARCHAR(50),
		FREIGHT VARCHAR(30),
		ISDIFFAIR VARCHAR(4),
		SORT_ID INT
	)

	DECLARE @SEARCH_HEAD VARCHAR(500)
	SET @SEARCH_HEAD = 'RECENTLY OPENED CONSIGNMENTS'

	-- The newest @top jobs for this branch. Body lifted from the EXPORTNO branch of the LinksDB20
	-- USP_EXP_MST_EXPORT_SEARCH_LIST; only the predicate and the ORDER BY differ.
	INSERT INTO #TMP_SEARCH_TABLE
	SELECT	TOP (@top)
			ISNULL(JOBNO, 'NO') JOBEXIST,
			ISNULL(CONVERT(VARCHAR,HC_C2_SENTDT),'NO') 'EDISENT',
			NULL 'CONTAINEREXIST',
			ISNULL(ACTUALFLIGHTDT,'') as ACTUALFLIGHTDT,
			UPPER(EXPT_MODE) 'EXPT_MODE',
			CO2_EMITION_LVL=ISNULL(CONVERT(VARCHAR,CO2_EMITION_LVL),''),
			EXPTNO,
			RTRIM(ISNULL(EXP_NAME,'')) SHIPPER,
			RTRIM(ISNULL(CON_NAME,'')) CONSIGNEE,
			RTRIM(ISNULL(EM.expt_noofpkgs,'')) EXPT_NOOFPKGS,
			(CASE WHEN EXPT_MODE = 'SEA' THEN (SELECT TOP 1 RTRIM(ISNULL(VSL_NAME,'')) FROM VSL_MASTER WHERE VSL_RTNO = EM.EXPT_VESSEL)
				 ELSE ''
			END) VSL_NAME
			,[DBO].[FN_EXP_MST_EXPORT_SEARCH_LIST_ORDERNO](EM.EXPTNO,'-') ORDER_NO
			,ISNULL(EM.HOUSEBILLNO,''),
			ISNULL(EM.AEROBILLNO,''),
			EXPT_GRWT,
			EXPT_VOLUME,
			convert(decimal(18,3),(dbo.FN_SAFE_FLOAT(EXPT_VOLUME)/0.006)) VOLWT,
			convert(decimal(18,3),(dbo.FN_SAFE_FLOAT(EXPT_CHBLWT))),
			HOUSEBILLDT,
			mawbdest=(SELECT CITY_NAME FROM city_master WHERE CITY_CODE=mawbdest),
			RTRIM(flightno)+' - '+ RTRIM(flightdt)  ,
			RTRIM(actualflightno)+ ' - '+RTRIM(actualflightdt),
			P_PKGS='0',P_GRWT='0',P_CHBLWT='0',
			etaport1,etaport2
			,CASE WHEN EXPT_MODE='sea' THEN ISNULL(expt_vessel,'') ELSE ISNULL(EXPTCANCEL,'') END,
			EM.EXPT_INVNO,EM.EXPT_FRT
			,isnull(em.IsDiffAir,'0')
			,EM.id
	FROM	EXPT_MASTER EM
			LEFT OUTER JOIN EXP_MASTER EXP_M ON EXP_M.EXP_CODE = EM.EXPT_EXPORTER
			LEFT OUTER JOIN CONSIGNEE_MASTER CON_M ON CON_M.CON_CODE = EM.EXPT_CONSIGNEE
	WHERE   CMPCODE=@cmpid AND CITYCODE=@citycode
	ORDER BY EM.id DESC

	-- Post-processing. Verbatim from the LinksDB20 search proc.
	UPDATE #TMP_SEARCH_TABLE
	SET CONTAINEREXIST = (CASE WHEN EXISTS (SELECT TOP 1 CONTAINERNO FROM EXPT_CONTAINER1 WHERE EXPTNO=#TMP_SEARCH_TABLE.EXPTNO) THEN 'YES' ELSE 'NO' END)

	UPDATE A
	SET A.EDISENT = B.HC_C2_SENTDT FROM #TMP_SEARCH_TABLE A INNER JOIN
	(SELECT ISNULL(CONVERT(VARCHAR,EXPT_CONTAINER.HC_C2_SENTDT),'NO')HC_C2_SENTDT,EXPT_CONTAINER1.EXPTNO
	FROM EXPT_CONTAINER
	INNER JOIN EXPT_CONTAINER1 ON EXPT_CONTAINER.CONTAINERNO = EXPT_CONTAINER1.CONTAINERNO
	INNER JOIN #TMP_SEARCH_TABLE ON #TMP_SEARCH_TABLE.EXPTNO=EXPT_CONTAINER1.EXPTNO
	WHERE CONTAINEREXIST='YES') B
	ON A.EXPTNO=B.EXPTNO

	UPDATE #TMP_SEARCH_TABLE SET P_PKGS=  (SELECT SUM(dbo.FN_SAFE_FLOAT(PKGS)) from #TMP_SEARCH_TABLE)
	UPDATE #TMP_SEARCH_TABLE SET ETAPORT1= case when #TMP_SEARCH_TABLE.etaport2 ='' then isnull(#TMP_SEARCH_TABLE.etaport1,'') else isnull(#TMP_SEARCH_TABLE.etaport2,'') end

	UPDATE #TMP_SEARCH_TABLE SET EXPTCANCEL= CASE WHEN EXPT_MODE ='AIR' THEN EXPTCANCEL end where EXPT_MODE ='AIR'

	UPDATE A SET A.EXPTCANCEL=b.EXPTCANCEL FROM #TMP_SEARCH_TABLE A INNER JOIN
	(SELECT 'Y'EXPTCANCEL,exptno FROM #TMP_SEARCH_TABLE WHERE  EXPTCANCEL LIKE '%XXXXX%'
	 and expt_mode='SEA'
	)B ON A.exptno=b.exptno
	where a.expt_mode='SEA'

	-- Table : same columns, same order, as the LinksDB20 search proc's first result set.
	SELECT '100' [STATUS],JOBEXIST,
			EDISENT,
			CONTAINEREXIST,
			ACTUALFLIGHTDT,
			EXPT_MODE,
			CASE WHEN CO2_EMITION_LVL='0.000' THEN '0' ELSE CO2_EMITION_LVL END AS CO2_EMITION_LVL,
			EXPTNO,
			SHIPPER,
			CONSIGNEE,
			PKGS,
			VSL_NAME,
			ORDER_NO,
			GRPID = (SELECT  TOP 1 GRPID = (SELECT TOP 1 FK_GRPID FROM TBL_EDI_CONSIGNEE_LIST WHERE CON_CODE LIKE '%'+EX.EXPT_CONSIGNEE+'%')
					FROM EXPT_MASTER EX WHERE EXPTNO = TT.EXPTNO),
			HAWBNO=ISNULL(HOUSEBILLNO,''),
			MAWBNO=ISNULL(AEROBILLNO,''),
			GRWT = ISNULL(GRWT,'0'),
			VOLUME = ISNULL(VOLUME,'0') ,
			VOLWT = ISNULL(VOLWT,'0'),
			CHBLWT = ISNULL(CHBLWT,'0'),
			HAWBDT = ISNULL(HAWBDT,''),
			MAWBDEST ,
			FLIGHTDTLS  ,
			ACTFLIGHTDTLS  ,
			P_PKGS  ,
			P_GRWT  ,
			P_CHBLWT  ,
			ETAPORT1   ,
			EXPTCANCEL,
			INVNO,
			FREIGHT,
			CASE  ISDIFFAIR   WHEN  '1' THEN '1'WHEN '2' THEN '2' ELSE '0' END ISDIFFAIR
	FROM #TMP_SEARCH_TABLE TT
	ORDER BY TT.SORT_ID DESC

	-- Table1 : the caption the Angular client reads as Table1[0].SEARCH_HEAD.
	SELECT @SEARCH_HEAD SEARCH_HEAD

	DROP TABLE #TMP_SEARCH_TABLE
END
GO

SET NOEXEC OFF;
GO

/* ---- 8. verify + first run --------------------------------------------------------------- */
DECLARE @RunFirstTick BIT = 1;      -- 1 = fill the job state and alerts once now (what the Agent job does every 10 min)

IF OBJECT_ID('dbo.TBL_EXPT_JOB_STATE', 'U') IS NOT NULL AND OBJECT_ID('dbo.TBL_EXPT_ALERT_RULE', 'U') IS NOT NULL
   AND OBJECT_ID('dbo.TBL_EXPT_ALERT', 'U') IS NOT NULL AND OBJECT_ID('dbo.TBL_EXPT_JOB_STATE_RUNLOG', 'U') IS NOT NULL
   AND OBJECT_ID('dbo.USP_EXPT_JOB_STATE_REFRESH', 'P') IS NOT NULL AND OBJECT_ID('dbo.USP_EXPT_ALERT_RUN', 'P') IS NOT NULL
   AND OBJECT_ID('dbo.USP_EXPT_JOB_STATE_TICK', 'P') IS NOT NULL AND OBJECT_ID('dbo.USP_EXPT_CONSIGNMENT_RECENT', 'P') IS NOT NULL
BEGIN
    PRINT 'Job state engine is in place on ' + DB_NAME() + '.';
    SELECT rule_code, enabled, severity, grace_days, max_days, crit_days, notify_manager
    FROM dbo.TBL_EXPT_ALERT_RULE ORDER BY enabled DESC, rule_code;

    IF @RunFirstTick = 1
    BEGIN
        EXEC dbo.USP_EXPT_JOB_STATE_TICK;
        SELECT TOP 1 run_id, run_at, ms, jobs, alerts_new, alerts_resolved, error
        FROM dbo.TBL_EXPT_JOB_STATE_RUNLOG ORDER BY run_id DESC;
        SELECT rule_code, citycode, severity, COUNT(*) AS open_alerts
        FROM dbo.TBL_EXPT_ALERT WHERE open_key = 0
        GROUP BY rule_code, citycode, severity ORDER BY rule_code, citycode, severity;
        SELECT citycode, clearance_only, stage, COUNT(*) AS jobs
        FROM dbo.TBL_EXPT_JOB_STATE GROUP BY citycode, clearance_only, stage_rank, stage
        ORDER BY citycode, clearance_only, stage_rank;
    END
    PRINT 'Next: EXPT_JOB_STATE_AGENT_JOBS_LINKSDB20_20261015.sql (as sysadmin) schedules the tick every 10 minutes.';
END
ELSE
    PRINT '*** One or more job-state objects are missing on ' + DB_NAME() + ' - see the messages above.';
GO
