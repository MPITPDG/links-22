/*===============================================================================================
  ROLLBACK_EXPT_JOB_STATE_REFRESH_PERF_LINKSDB20_20261021.sql         (LinksDB20)

  Puts dbo.USP_EXPT_JOB_STATE_REFRESH back to the version from EXPT_JOB_STATE_LINKSDB20_20261015.sql
  as it was before EXPT_JOB_STATE_REFRESH_PERF_LINKSDB20_20261021.sql (the jobs in scope as a CTE; about 162 s per run). That version
  also fails the whole run while an export number is in expt_master twice.
  Text captured from git (links-22 commit 9b6bc22), identical to the live OBJECT_DEFINITION checked
  on 2026-10-21.

  Safety : step 1 stops before altering anything unless the procedure exists, is the one from
           EXPT_JOB_STATE_LINKSDB20_20261015.sql and you may ALTER it. No table, row or other object
           is touched. Re-runnable. The next scheduled tick uses the restored version.
           If the Agent job runs every 10 minutes, consider disabling it after the rollback: each run
           takes about 162 s again.
  Run as : any login that may ALTER the procedure (normal login). SQL Server 2008 R2.
===============================================================================================*/
USE [LinksDB20]
GO
/* ---- 1. checks (read-only) ----------------------------------------------------------------- */
SET NOEXEC OFF;
DECLARE @problems TABLE (n INT IDENTITY(1,1), problem NVARCHAR(400));
DECLARE @d NVARCHAR(MAX);
SET @d = OBJECT_DEFINITION(OBJECT_ID('dbo.USP_EXPT_JOB_STATE_REFRESH', 'P'));

IF DB_NAME() <> 'LinksDB20'
    INSERT INTO @problems (problem) VALUES ('Connected to ' + DB_NAME() + ', not LinksDB20.');
IF @d IS NULL
    INSERT INTO @problems (problem) VALUES ('dbo.USP_EXPT_JOB_STATE_REFRESH not found - run EXPT_JOB_STATE_LINKSDB20_20261015.sql first.');
ELSE IF CHARINDEX('LINKS: the vessel name and the placeholder classification are resolved here, once', @d) = 0
    INSERT INTO @problems (problem) VALUES ('dbo.USP_EXPT_JOB_STATE_REFRESH is not the procedure from EXPT_JOB_STATE_LINKSDB20_20261015.sql - left alone.');
IF @d IS NOT NULL AND ISNULL(HAS_PERMS_BY_NAME('dbo.USP_EXPT_JOB_STATE_REFRESH', 'OBJECT', 'ALTER'), 0) = 0
    INSERT INTO @problems (problem) VALUES ('No ALTER permission on dbo.USP_EXPT_JOB_STATE_REFRESH.');

IF EXISTS (SELECT 1 FROM @problems)
BEGIN
    PRINT '*** Check failed on ' + DB_NAME() + ' - NOTHING was altered:';
    SELECT n AS [#], problem FROM @problems ORDER BY n;
    RAISERROR('Check failed - see the list above.', 16, 1);
    SET NOEXEC ON;     -- skip the rest of the script, including the ALTER below
END
ELSE IF CHARINDEX('SELECT * INTO #JS FROM JS', @d) = 0
    PRINT 'Prerequisites OK on ' + DB_NAME() + '. The procedure is already the previous version; altering it again changes nothing.';
ELSE
    PRINT 'Prerequisites OK on ' + DB_NAME() + '.';
GO
/* ---- 2. alter -------------------------------------------------------------------------------- */
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO
ALTER PROCEDURE dbo.USP_EXPT_JOB_STATE_REFRESH
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

SET NOEXEC OFF;
GO
/* ---- 3. verify (read-only) ------------------------------------------------------------------ */
IF CHARINDEX('SELECT * INTO #JS FROM JS', OBJECT_DEFINITION(OBJECT_ID('dbo.USP_EXPT_JOB_STATE_REFRESH', 'P'))) = 0
BEGIN
    PRINT 'OK: USP_EXPT_JOB_STATE_REFRESH on ' + DB_NAME() + ' is the previous (CTE) version.';
END
ELSE
    PRINT '*** USP_EXPT_JOB_STATE_REFRESH is not the previous version - see the messages above.';
GO
