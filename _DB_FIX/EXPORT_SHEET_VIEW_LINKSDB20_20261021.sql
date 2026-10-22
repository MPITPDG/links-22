/*===============================================================================================
  EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql         (LinksDB20)

  Why  : Export > Sheet view - the monthly Bajaj Google workbook ("Bajaj October Sheet 2026") as a page inside Links
         (docs/SHEET_VIEW_SPEC.md). This is its database layer, built to docs/SHEET_VIEW_CONTRACT.md sections 1-4 and to
         the parameter lists the Links API (ExportSheetController, api/Export/Sheet/...) calls positionally. None of these
         objects exist on LinksDB20 (checked 2026-10-21).

  Creates (all new; nothing existing is altered):
    tables  TBL_EXPT_SHEET_MONTH       one per company / branch / month: the month's tab list (TABS, JSON owned by the UI)
            TBL_EXPT_SHEET_ROW         WO tab rows: tab, order, status colour, EXPTNO link, version, the 52 registry columns
            TBL_EXPT_SHEET_GRIDROW     Bookings Details / Vehicle wise weights / DGD / Price rows (DATA JSON by column letter)
            TBL_EXPT_SHEET_TABMETA     per month + tab layout JSON (headers, widths, merges, frozen rows / columns)
            TBL_EXPT_SHEET_STATUS      Colour CODE legend - seeded with the workbook's 10 statuses
            TBL_EXPT_SHEET_ROLE        Column Access roles - seeded: OPS, BOOKING, OPSLEAD, DOCS, BLDESK, YARD, ALL, ADMIN
            TBL_EXPT_SHEET_ROLE_COL    columns each role owns - seeded from the contract's registry (only while empty)
            TBL_EXPT_SHEET_ROLE_USER   Links users holding each role - NOT seeded (nobody is granted anything; Links SA
                                       users count as ADMIN without a row here)
            TBL_EXPT_SHEET_ALIAS       sheet nickname -> Links code, for Convert to job
            TBL_EXPT_SHEET_LOG         cell / row / settings history
            TBL_EXPT_SHEET_VIEW        personal layouts and filter views
    procs   36 USP_EXPT_SHEET_* procedures: the 31 of the contract + API (MONTHS, MONTH_IU, LOAD, CHANGES, SAVE_CELLS,
            SAVE_FMT, ROWS_OP, LINK, UNLINK, CONVERT_DRAFT, CONVERT_DONE, HISTORY, RESTORE_VALUE, LEGEND, LEGEND_IU, ROLES,
            ROLES_IU, MY_ROLES, ALIAS, ALIAS_IU, ALIAS_SEED, VIEWS, VIEW_IU, VIEW_DEL, GRID_LOAD, GRID_SAVE, GRID_ROWS_OP,
            TABMETA_IU, KPI, GRID_CHANGES, GRID_SAVE_FMT) and 5 internal ones (LINKS_FILL, ROWS_OUT, TRACK_MIRROR, SAVE_APPLY, LINK_APPLY). Each says in
            its own header what it takes and returns.
    rows    tbl_Mst_Form 448 EXPORT - SHEET VIEW (view / add / modify), 449 EXPORT - SHEET VIEW CONVERT / LINK JOB,
            450 EXPORT - SHEET VIEW SETTINGS, module 3 Export - only when the id is free. No rights are granted to any user.

  Writes to existing tables at run time (never by running this script): EXPT_JOB_TRACKING / EXPT_JOB_TRACKING_LOG, when a
  linked sheet row's tracking columns change or a row is linked (TRACKING_STATUS and SHIPMENT_CATEGORY are never touched).

  Safety : step 1 checks everything first and stops before creating anything if one check fails: the database is
           LinksDB20, the login may CREATE TABLE / CREATE PROCEDURE and INSERT into tbl_Mst_Form, every table / column the
           procedures read exists, module 3 exists, every table name is free or already a table, every procedure name is
           free or a procedure created by this script before (its text names this file - a same-named object from anywhere
           else stops the script, so nothing foreign is ever replaced), the constraint names are free, and form ids
           448-450 are free or already this script's forms. Tables are created only when absent (their rows are never
           touched on a re-run); seed rows are added only where missing (live legend / role settings are kept); procedures
           are dropped (only ever this script's own) and recreated. Re-runnable. The last step only reads.
  Rollback: ROLLBACK_EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql
  Self-test: TEST_EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql (after this script; everything inside one transaction that is rolled back).
  Run as : any login that may create tables and procedures on LinksDB20 (normal login). SQL Server 2008 R2 (no JSON
           functions, TRY_CONVERT, IIF, CONCAT, FORMAT, STRING_SPLIT, SEQUENCE, DROP IF EXISTS, CREATE OR ALTER).
===============================================================================================*/
USE [LinksDB20]
GO
SET NOCOUNT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_PADDING ON;
GO

/* ---- 1. prerequisites ------------------------------------------------------------------ */
DECLARE @problems TABLE (n INT IDENTITY(1,1), problem VARCHAR(600));
DECLARE @marker   VARCHAR(100);
SET @marker = 'EXPORT_SHEET_VIEW_LINKSDB20_20261021';      -- every procedure below carries this text

-- 1a. we must really be on LinksDB20 (if USE failed above the session is still in another DB)
IF UPPER(DB_NAME()) <> 'LINKSDB20'
    INSERT INTO @problems (problem) VALUES ('Connected to ' + DB_NAME() + ', not LinksDB20.');

-- 1b. permissions
IF ISNULL(HAS_PERMS_BY_NAME(DB_NAME(), 'DATABASE', 'CREATE TABLE'), 0) = 0
    INSERT INTO @problems (problem) VALUES ('No CREATE TABLE permission on ' + DB_NAME() + '.');
IF ISNULL(HAS_PERMS_BY_NAME(DB_NAME(), 'DATABASE', 'CREATE PROCEDURE'), 0) = 0
    INSERT INTO @problems (problem) VALUES ('No CREATE PROCEDURE permission on ' + DB_NAME() + '.');
IF ISNULL(HAS_PERMS_BY_NAME('dbo', 'SCHEMA', 'ALTER'), 0) = 0
    INSERT INTO @problems (problem) VALUES ('No ALTER permission on schema dbo (needed to create tables / procedures in it).');
IF OBJECT_ID('dbo.tbl_Mst_Form', 'U') IS NOT NULL AND ISNULL(HAS_PERMS_BY_NAME('dbo.tbl_Mst_Form', 'OBJECT', 'INSERT'), 0) = 0
    INSERT INTO @problems (problem) VALUES ('No INSERT permission on dbo.tbl_Mst_Form (form rights rows 448-450).');

-- 1c. every table and column the procedures and seeds use
INSERT INTO @problems (problem)
SELECT 'Column dbo.' + x.t + '.' + x.c + ' not found.'
  FROM (VALUES
        ('EXPT_MASTER', 'EXPTNO'), ('EXPT_MASTER', 'ID'), ('EXPT_MASTER', 'CMPCODE'), ('EXPT_MASTER', 'CITYCODE'),
        ('EXPT_MASTER', 'EXPTCANCEL'), ('EXPT_MASTER', 'SYSEXPT_DOCRECD'), ('EXPT_MASTER', 'EXPT_INVNO'), ('EXPT_MASTER', 'EXPT_POD'),
        ('EXPT_MASTER', 'EXPT_DESTCOUNTRY'), ('EXPT_MASTER', 'EXPT_NOOFPKGS'), ('EXPT_MASTER', 'EXPT_VESSEL'), ('EXPT_MASTER', 'VSL_PORT'),
        ('EXPT_MASTER', 'EXPT_VSLAGENT'), ('EXPT_MASTER', 'EXPT_CONSIGNEE'), ('EXPT_MASTER', 'ETAPORT1'), ('EXPT_MASTER', 'ETAPORT2'),
        ('EXPT_MASTER', 'EXPT_BLNO'), ('EXPT_MASTER', 'EXPT_BLDT'), ('EXPT_MASTER', 'EXPT_SHIPBILLNO'), ('EXPT_MASTER', 'EXPT_SHIPBILLDT'),
        ('EXPT_MASTER', 'EXPT_SHIPBILLDT1'), ('EXPT_MASTER', 'EXPT_HBLNO'), ('EXPT_MASTER', 'DOCSENTDT'), ('EXPT_MASTER', 'EXPT_LDGPORT'),
        ('EXPT_CONTAINER1', 'EXPTNO'), ('EXPT_CONTAINER1', 'CONTAINERNO'), ('EXPT_CONTAINER', 'CONTAINERNO'), ('EXPT_CONTAINER', 'CONTAINERSIZE'),
        ('EXPT_CONTAINER', 'SHPGLINE'), ('EXPT_CONTAINER', 'BOOK_CARR_NBR'), ('EXPT_ORDERNO', 'EXPTNO'), ('EXPT_ORDERNO', 'ORDERNO'),
        ('TBL_EDOC_MST_UPLOAD', 'JOBNO'), ('TBL_EDOC_MST_UPLOAD', 'ISDELETED'), ('VSL_PORTDTLS', 'VSL_RTNO'), ('VSL_PORTDTLS', 'PORT'),
        ('VSL_PORTDTLS', 'ETD'), ('VSL_PORTDTLS', 'SAILING'), ('VSL_MASTER', 'VSL_RTNO'), ('VSL_MASTER', 'VSL_NAME'),
        ('VSL_MASTER', 'VSL_VOYNO'), ('CONSIGNEE_MASTER', 'CON_CODE'), ('CONSIGNEE_MASTER', 'CON_NAME'), ('AGENT_MASTER', 'AGT_CODE'),
        ('AGENT_MASTER', 'AGT_NAME'), ('LINER_MASTER', 'LINER_CODE'), ('LINER_MASTER', 'LINER_NAME'), ('CITY_MASTER', 'CITY_CODE'),
        ('CITY_MASTER', 'CITY_NAME'), ('CITY_MASTER', 'CITY_COUNTRY'), ('EXPT_JOB_TRACKING', 'EXPTNO'), ('EXPT_JOB_TRACKING', 'TRACKING_STATUS'),
        ('EXPT_JOB_TRACKING', 'SHIPMENT_CATEGORY'), ('EXPT_JOB_TRACKING', 'VEHICLE_MODEL'), ('EXPT_JOB_TRACKING', 'STUFFING_DT'), ('EXPT_JOB_TRACKING', 'DO_ETD'),
        ('EXPT_JOB_TRACKING', 'DO_RECEIVE_DT'), ('EXPT_JOB_TRACKING', 'TRANSPORTER'), ('EXPT_JOB_TRACKING', 'CARGO_TYPE'), ('EXPT_JOB_TRACKING', 'PLANT'),
        ('EXPT_JOB_TRACKING', 'LC_NO'), ('EXPT_JOB_TRACKING', 'LC_DATE'), ('EXPT_JOB_TRACKING', 'HAZ'), ('EXPT_JOB_TRACKING', 'REMARK1'),
        ('EXPT_JOB_TRACKING', 'DO_GIVEN_DT'), ('EXPT_JOB_TRACKING', 'POL_GATE'), ('EXPT_JOB_TRACKING', 'GATE_OPEN_DT'), ('EXPT_JOB_TRACKING', 'GATE_CUTOFF_DT'),
        ('EXPT_JOB_TRACKING', 'SI_CUTOFF_DT'), ('EXPT_JOB_TRACKING', 'VGM_SUBMITTED_DT'), ('EXPT_JOB_TRACKING', 'SI_SUBMITTED_DT'), ('EXPT_JOB_TRACKING', 'BL_HANDOVER_DT'),
        ('EXPT_JOB_TRACKING', 'SLINE_PAYMENT_STATUS'), ('EXPT_JOB_TRACKING', 'CLEARANCE_POINT'), ('EXPT_JOB_TRACKING', 'OPEN_ORDER'), ('EXPT_JOB_TRACKING', 'BUFFER_YARD'),
        ('EXPT_JOB_TRACKING', 'PICKUP_DT'), ('EXPT_JOB_TRACKING', 'CNTR_DISPATCH_DT'), ('EXPT_JOB_TRACKING', 'CNTR_REPORT_NS_DT'), ('EXPT_JOB_TRACKING', 'CNTR_GATEDIN_DT'),
        ('EXPT_JOB_TRACKING', 'MAKER_ID'), ('EXPT_JOB_TRACKING', 'MAKER_IP'), ('EXPT_JOB_TRACKING', 'MAKER_DT'), ('EXPT_JOB_TRACKING', 'MODIFY_ID'),
        ('EXPT_JOB_TRACKING', 'MODIFY_DT'), ('EXPT_JOB_TRACKING_LOG', 'EXPTNO'), ('EXPT_JOB_TRACKING_LOG', 'FIELD_NAME'), ('EXPT_JOB_TRACKING_LOG', 'OLD_VALUE'),
        ('EXPT_JOB_TRACKING_LOG', 'NEW_VALUE'), ('EXPT_JOB_TRACKING_LOG', 'CHANGED_BY'), ('EXPT_JOB_TRACKING_LOG', 'CHANGED_IP'), ('EXPT_JOB_TRACKING_LOG', 'CHANGED_DT'),
        ('CMP_DTLS', 'CMPID'), ('CMP_DTLS', 'CMP_USERCODE'), ('CMP_DTLS', 'CMP_USERNAME'), ('CMP_DTLS', 'FULLNAME'),
        ('CMP_DTLS', 'RoleType'), ('tbl_Mst_Form', 'pk_FormId'), ('tbl_Mst_Form', 'fk_ModuleId'), ('tbl_Mst_Form', 'FormName'),
        ('tbl_Mst_Form', 'DisplayName'), ('tbl_Mst_Form', 'isReport'), ('tbl_Mst_Form', 'isFranceAct'), ('tbl_Mst_Form', 'SEQ'),
        ('tbl_Mst_Form', 'RIGHTS'), ('tbl_Mst_Form', 'ng_filename'), ('tbl_Mst_Form', 'FrmSrc'), ('tbl_Mst_Module', 'pk_ModuleId')
       ) x (t, c)
 WHERE COL_LENGTH('dbo.' + x.t, x.c) IS NULL;

-- 1d. module 3 (Export) and the form ids: free, or this script's own forms
IF OBJECT_ID('dbo.tbl_Mst_Module', 'U') IS NOT NULL AND NOT EXISTS (SELECT 1 FROM dbo.tbl_Mst_Module WHERE pk_ModuleId = 3)
    INSERT INTO @problems (problem) VALUES ('Module 3 (Export) not found in dbo.tbl_Mst_Module.');
IF OBJECT_ID('dbo.tbl_Mst_Form', 'U') IS NOT NULL
    INSERT INTO @problems (problem)
    SELECT 'Form id ' + CONVERT(VARCHAR(10), f.pk_FormId) + ' is already used by "' + ISNULL(CONVERT(VARCHAR(200), f.FormName), '') + '" (module '
           + ISNULL(CONVERT(VARCHAR(10), f.fk_ModuleId), '?') + ') - not this script''s form. Pick free ids here, in the rollback and in sheet.service.ts.'
      FROM dbo.tbl_Mst_Form f
           JOIN (VALUES (448, 'sheet-view.component.html'), (449, 'sheet-view.convert'), (450, 'sheet-view.settings')) x (id, nm) ON x.id = f.pk_FormId
     WHERE ISNULL(f.FormName, '') <> x.nm OR ISNULL(f.fk_ModuleId, 0) <> 3;

-- 1e. table names: free or already a table - and then a table of this script's shape (a table from an older edition of
--     the script would make the procedures below fail to create after they were dropped)
INSERT INTO @problems (problem)
SELECT 'dbo.' + x.nm + ' exists but is not a table.'
  FROM (VALUES ('TBL_EXPT_SHEET_MONTH'), ('TBL_EXPT_SHEET_ROW'), ('TBL_EXPT_SHEET_GRIDROW'), ('TBL_EXPT_SHEET_TABMETA'), ('TBL_EXPT_SHEET_STATUS'), ('TBL_EXPT_SHEET_ROLE'), ('TBL_EXPT_SHEET_ROLE_COL'), ('TBL_EXPT_SHEET_ROLE_USER'), ('TBL_EXPT_SHEET_ALIAS'), ('TBL_EXPT_SHEET_LOG'), ('TBL_EXPT_SHEET_VIEW')) x (nm)
 WHERE OBJECT_ID('dbo.' + x.nm) IS NOT NULL AND OBJECT_ID('dbo.' + x.nm, 'U') IS NULL;
INSERT INTO @problems (problem)
SELECT 'dbo.' + x.t + ' exists without column ' + x.c + ' - an older shape; extend it first (nothing here alters existing tables).'
  FROM (VALUES
        ('TBL_EXPT_SHEET_MONTH', 'ID'), ('TBL_EXPT_SHEET_MONTH', 'CMPCODE'), ('TBL_EXPT_SHEET_MONTH', 'CITYCODE'), ('TBL_EXPT_SHEET_MONTH', 'SHEET_MONTH'),
        ('TBL_EXPT_SHEET_MONTH', 'TITLE'), ('TBL_EXPT_SHEET_MONTH', 'TABS'), ('TBL_EXPT_SHEET_MONTH', 'ROWVER'), ('TBL_EXPT_SHEET_MONTH', 'MAKER_ID'),
        ('TBL_EXPT_SHEET_MONTH', 'MAKER_DT'), ('TBL_EXPT_SHEET_MONTH', 'MODIFY_ID'), ('TBL_EXPT_SHEET_MONTH', 'MODIFY_DT'), ('TBL_EXPT_SHEET_ROW', 'ID'),
        ('TBL_EXPT_SHEET_ROW', 'MONTH_ID'), ('TBL_EXPT_SHEET_ROW', 'TAB_CODE'), ('TBL_EXPT_SHEET_ROW', 'SORT_ORDER'), ('TBL_EXPT_SHEET_ROW', 'STATUS_CODE'),
        ('TBL_EXPT_SHEET_ROW', 'EXPTNO'), ('TBL_EXPT_SHEET_ROW', 'WO'), ('TBL_EXPT_SHEET_ROW', 'PORT'), ('TBL_EXPT_SHEET_ROW', 'COUNTRY'),
        ('TBL_EXPT_SHEET_ROW', 'VEH'), ('TBL_EXPT_SHEET_ROW', 'QTY'), ('TBL_EXPT_SHEET_ROW', 'CONT'), ('TBL_EXPT_SHEET_ROW', 'CNTR_TYPE'),
        ('TBL_EXPT_SHEET_ROW', 'STUFFING_DT'), ('TBL_EXPT_SHEET_ROW', 'VSL_NAME'), ('TBL_EXPT_SHEET_ROW', 'DO_ETD'), ('TBL_EXPT_SHEET_ROW', 'SLINE'),
        ('TBL_EXPT_SHEET_ROW', 'AGENT'), ('TBL_EXPT_SHEET_ROW', 'DO_RECEIVE_DT'), ('TBL_EXPT_SHEET_ROW', 'BOOKING_NO'), ('TBL_EXPT_SHEET_ROW', 'TRANSPORTER'),
        ('TBL_EXPT_SHEET_ROW', 'CARGO_TYPE'), ('TBL_EXPT_SHEET_ROW', 'PLANT'), ('TBL_EXPT_SHEET_ROW', 'PO_NO'), ('TBL_EXPT_SHEET_ROW', 'LC_NO'),
        ('TBL_EXPT_SHEET_ROW', 'LC_DATE'), ('TBL_EXPT_SHEET_ROW', 'HAZ'), ('TBL_EXPT_SHEET_ROW', 'CONSIGNEE'), ('TBL_EXPT_SHEET_ROW', 'REMARK1'),
        ('TBL_EXPT_SHEET_ROW', 'DO_GIVEN_DT'), ('TBL_EXPT_SHEET_ROW', 'CONTAINER_NO'), ('TBL_EXPT_SHEET_ROW', 'POL_GATE'), ('TBL_EXPT_SHEET_ROW', 'GATE_OPEN_DT'),
        ('TBL_EXPT_SHEET_ROW', 'GATE_CUTOFF_DT'), ('TBL_EXPT_SHEET_ROW', 'SI_CUTOFF_DT'), ('TBL_EXPT_SHEET_ROW', 'DO_ETD2'), ('TBL_EXPT_SHEET_ROW', 'CURRENT_ETD'),
        ('TBL_EXPT_SHEET_ROW', 'ETA_DEST'), ('TBL_EXPT_SHEET_ROW', 'FINAL_VSL_SOB'), ('TBL_EXPT_SHEET_ROW', 'VGM_SUBMITTED_DT'), ('TBL_EXPT_SHEET_ROW', 'SI_SUBMITTED_DT'),
        ('TBL_EXPT_SHEET_ROW', 'BL_NO'), ('TBL_EXPT_SHEET_ROW', 'BL_DT'), ('TBL_EXPT_SHEET_ROW', 'BL_HANDOVER_DT'), ('TBL_EXPT_SHEET_ROW', 'FF_JOB'),
        ('TBL_EXPT_SHEET_ROW', 'SLINE_PAYMENT_STATUS'), ('TBL_EXPT_SHEET_ROW', 'CLEARANCE_POINT'), ('TBL_EXPT_SHEET_ROW', 'OPEN_ORDER'), ('TBL_EXPT_SHEET_ROW', 'BUFFER_YARD'),
        ('TBL_EXPT_SHEET_ROW', 'EDOC_STATUS'), ('TBL_EXPT_SHEET_ROW', 'COURIER_DT'), ('TBL_EXPT_SHEET_ROW', 'PICKUP_DT'), ('TBL_EXPT_SHEET_ROW', 'CNTR_DISPATCH_DT'),
        ('TBL_EXPT_SHEET_ROW', 'CNTR_REPORT_NS_DT'), ('TBL_EXPT_SHEET_ROW', 'CNTR_GATEDIN_DT'), ('TBL_EXPT_SHEET_ROW', 'SB_NO'), ('TBL_EXPT_SHEET_ROW', 'SB_DT'),
        ('TBL_EXPT_SHEET_ROW', 'FOR_HBL'), ('TBL_EXPT_SHEET_ROW', 'CELL_FMT'), ('TBL_EXPT_SHEET_ROW', 'ROWVER'), ('TBL_EXPT_SHEET_ROW', 'ISDELETED'),
        ('TBL_EXPT_SHEET_ROW', 'MAKER_ID'), ('TBL_EXPT_SHEET_ROW', 'MAKER_DT'), ('TBL_EXPT_SHEET_ROW', 'MODIFY_ID'), ('TBL_EXPT_SHEET_ROW', 'MODIFY_DT'),
        ('TBL_EXPT_SHEET_GRIDROW', 'ID'), ('TBL_EXPT_SHEET_GRIDROW', 'MONTH_ID'), ('TBL_EXPT_SHEET_GRIDROW', 'TAB_CODE'), ('TBL_EXPT_SHEET_GRIDROW', 'SORT_ORDER'),
        ('TBL_EXPT_SHEET_GRIDROW', 'DATA'), ('TBL_EXPT_SHEET_GRIDROW', 'CELL_FMT'), ('TBL_EXPT_SHEET_GRIDROW', 'ROWVER'), ('TBL_EXPT_SHEET_GRIDROW', 'ISDELETED'),
        ('TBL_EXPT_SHEET_GRIDROW', 'MAKER_ID'), ('TBL_EXPT_SHEET_GRIDROW', 'MAKER_DT'), ('TBL_EXPT_SHEET_GRIDROW', 'MODIFY_ID'), ('TBL_EXPT_SHEET_GRIDROW', 'MODIFY_DT'),
        ('TBL_EXPT_SHEET_TABMETA', 'MONTH_ID'), ('TBL_EXPT_SHEET_TABMETA', 'TAB_CODE'), ('TBL_EXPT_SHEET_TABMETA', 'META'), ('TBL_EXPT_SHEET_TABMETA', 'ROWVER'),
        ('TBL_EXPT_SHEET_TABMETA', 'MODIFY_ID'), ('TBL_EXPT_SHEET_TABMETA', 'MODIFY_DT'), ('TBL_EXPT_SHEET_STATUS', 'CODE'), ('TBL_EXPT_SHEET_STATUS', 'LABEL'),
        ('TBL_EXPT_SHEET_STATUS', 'MEANING'), ('TBL_EXPT_SHEET_STATUS', 'BG'), ('TBL_EXPT_SHEET_STATUS', 'FG'), ('TBL_EXPT_SHEET_STATUS', 'SORT'),
        ('TBL_EXPT_SHEET_STATUS', 'ACTIVE'), ('TBL_EXPT_SHEET_STATUS', 'MODIFY_ID'), ('TBL_EXPT_SHEET_STATUS', 'MODIFY_DT'), ('TBL_EXPT_SHEET_ROLE', 'CODE'),
        ('TBL_EXPT_SHEET_ROLE', 'LABEL'), ('TBL_EXPT_SHEET_ROLE', 'SORT'), ('TBL_EXPT_SHEET_ROLE_COL', 'ROLE_CODE'), ('TBL_EXPT_SHEET_ROLE_COL', 'COL_KEY'),
        ('TBL_EXPT_SHEET_ROLE_USER', 'ROLE_CODE'), ('TBL_EXPT_SHEET_ROLE_USER', 'USER_ID'), ('TBL_EXPT_SHEET_ROLE_USER', 'MAKER_ID'), ('TBL_EXPT_SHEET_ROLE_USER', 'MAKER_DT'),
        ('TBL_EXPT_SHEET_ALIAS', 'KIND'), ('TBL_EXPT_SHEET_ALIAS', 'SHEET_VALUE'), ('TBL_EXPT_SHEET_ALIAS', 'LINKS_CODE'), ('TBL_EXPT_SHEET_ALIAS', 'LINKS_TEXT'),
        ('TBL_EXPT_SHEET_ALIAS', 'SOURCE'), ('TBL_EXPT_SHEET_ALIAS', 'CONFIRMED'), ('TBL_EXPT_SHEET_ALIAS', 'MODIFY_ID'), ('TBL_EXPT_SHEET_ALIAS', 'MODIFY_DT'),
        ('TBL_EXPT_SHEET_LOG', 'ID'), ('TBL_EXPT_SHEET_LOG', 'ROW_KIND'), ('TBL_EXPT_SHEET_LOG', 'ROW_ID'), ('TBL_EXPT_SHEET_LOG', 'COL_KEY'),
        ('TBL_EXPT_SHEET_LOG', 'OLD_VALUE'), ('TBL_EXPT_SHEET_LOG', 'NEW_VALUE'), ('TBL_EXPT_SHEET_LOG', 'ACTION'), ('TBL_EXPT_SHEET_LOG', 'USER_ID'),
        ('TBL_EXPT_SHEET_LOG', 'USER_NAME'), ('TBL_EXPT_SHEET_LOG', 'LOG_DT'), ('TBL_EXPT_SHEET_VIEW', 'ID'), ('TBL_EXPT_SHEET_VIEW', 'USER_ID'),
        ('TBL_EXPT_SHEET_VIEW', 'MONTH_ID'), ('TBL_EXPT_SHEET_VIEW', 'TAB_CODE'), ('TBL_EXPT_SHEET_VIEW', 'NAME'), ('TBL_EXPT_SHEET_VIEW', 'KIND'),
        ('TBL_EXPT_SHEET_VIEW', 'DATA'), ('TBL_EXPT_SHEET_VIEW', 'MODIFY_DT')
       ) x (t, c)
 WHERE OBJECT_ID('dbo.' + x.t, 'U') IS NOT NULL AND COL_LENGTH('dbo.' + x.t, x.c) IS NULL;

-- 1f. procedure names: free, or a procedure this script created on an earlier run
INSERT INTO @problems (problem)
SELECT 'dbo.' + x.p + ' already exists (' + o.type_desc + ') and was not created by this script - it would be replaced. Compare it with this script first.'
  FROM (VALUES
        ('USP_EXPT_SHEET_LINKS_FILL'), ('USP_EXPT_SHEET_ROWS_OUT'), ('USP_EXPT_SHEET_TRACK_MIRROR'),
        ('USP_EXPT_SHEET_SAVE_APPLY'), ('USP_EXPT_SHEET_LINK_APPLY'), ('USP_EXPT_SHEET_MONTHS'),
        ('USP_EXPT_SHEET_MONTH_IU'), ('USP_EXPT_SHEET_LOAD'), ('USP_EXPT_SHEET_CHANGES'),
        ('USP_EXPT_SHEET_SAVE_CELLS'), ('USP_EXPT_SHEET_SAVE_FMT'), ('USP_EXPT_SHEET_ROWS_OP'),
        ('USP_EXPT_SHEET_GRID_ROWS_OP'), ('USP_EXPT_SHEET_LINK'), ('USP_EXPT_SHEET_CONVERT_DONE'),
        ('USP_EXPT_SHEET_UNLINK'), ('USP_EXPT_SHEET_CONVERT_DRAFT'), ('USP_EXPT_SHEET_HISTORY'),
        ('USP_EXPT_SHEET_RESTORE_VALUE'), ('USP_EXPT_SHEET_LEGEND'), ('USP_EXPT_SHEET_LEGEND_IU'),
        ('USP_EXPT_SHEET_ROLES'), ('USP_EXPT_SHEET_ROLES_IU'), ('USP_EXPT_SHEET_MY_ROLES'),
        ('USP_EXPT_SHEET_ALIAS'), ('USP_EXPT_SHEET_ALIAS_IU'), ('USP_EXPT_SHEET_ALIAS_SEED'),
        ('USP_EXPT_SHEET_VIEWS'), ('USP_EXPT_SHEET_VIEW_IU'), ('USP_EXPT_SHEET_VIEW_DEL'),
        ('USP_EXPT_SHEET_GRID_LOAD'), ('USP_EXPT_SHEET_GRID_SAVE'), ('USP_EXPT_SHEET_GRID_SAVE_FMT'),
        ('USP_EXPT_SHEET_GRID_CHANGES'), ('USP_EXPT_SHEET_TABMETA_IU'), ('USP_EXPT_SHEET_KPI')
       ) x (p)
  JOIN sys.objects o ON o.object_id = OBJECT_ID('dbo.' + x.p)
 WHERE o.type <> 'P' OR CHARINDEX(@marker, ISNULL(OBJECT_DEFINITION(o.object_id), '')) = 0;

-- 1g. constraint names used below must not belong to another object
INSERT INTO @problems (problem)
SELECT 'Name ' + o.name + ' is already used by ' + ISNULL(OBJECT_NAME(o.parent_object_id), o.type_desc) + '.'
  FROM sys.objects o
 WHERE o.name IN ('PK_TBL_EXPT_SHEET_MONTH',
                  'UQ_TBL_EXPT_SHEET_MONTH',
                  'CK_TBL_EXPT_SHEET_MONTH_YM',
                  'PK_TBL_EXPT_SHEET_ROW',
                  'FK_TBL_EXPT_SHEET_ROW_MONTH',
                  'PK_TBL_EXPT_SHEET_GRIDROW',
                  'FK_TBL_EXPT_SHEET_GRIDROW_MONTH',
                  'PK_TBL_EXPT_SHEET_TABMETA',
                  'FK_TBL_EXPT_SHEET_TABMETA_MONTH',
                  'PK_TBL_EXPT_SHEET_STATUS',
                  'PK_TBL_EXPT_SHEET_ROLE',
                  'PK_TBL_EXPT_SHEET_ROLE_COL',
                  'FK_TBL_EXPT_SHEET_ROLE_COL_ROLE',
                  'PK_TBL_EXPT_SHEET_ROLE_USER',
                  'FK_TBL_EXPT_SHEET_ROLE_USER_ROLE',
                  'PK_TBL_EXPT_SHEET_ALIAS',
                  'CK_TBL_EXPT_SHEET_ALIAS_SOURCE',
                  'PK_TBL_EXPT_SHEET_LOG',
                  'PK_TBL_EXPT_SHEET_VIEW',
                  'CK_TBL_EXPT_SHEET_VIEW_KIND')
   AND ISNULL(OBJECT_NAME(o.parent_object_id), '') NOT IN ('TBL_EXPT_SHEET_MONTH', 'TBL_EXPT_SHEET_ROW', 'TBL_EXPT_SHEET_GRIDROW', 'TBL_EXPT_SHEET_TABMETA', 'TBL_EXPT_SHEET_STATUS', 'TBL_EXPT_SHEET_ROLE', 'TBL_EXPT_SHEET_ROLE_COL', 'TBL_EXPT_SHEET_ROLE_USER', 'TBL_EXPT_SHEET_ALIAS', 'TBL_EXPT_SHEET_LOG', 'TBL_EXPT_SHEET_VIEW');

IF EXISTS (SELECT 1 FROM @problems)
BEGIN
    PRINT '*** Prerequisite check failed on ' + DB_NAME() + ' - NOTHING was created or dropped:';
    SELECT n AS [#], problem FROM @problems ORDER BY n;
    RAISERROR('Prerequisite check failed - see the list above.', 16, 1);
    SET NOEXEC ON;     -- skip the rest of the script, including the CREATEs below
END
ELSE
    PRINT 'Prerequisites OK on ' + DB_NAME() + '.';
GO

/* ==== 2. tables =========================================================================== */
IF OBJECT_ID('dbo.TBL_EXPT_SHEET_MONTH', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TBL_EXPT_SHEET_MONTH (
        ID           INT IDENTITY(1,1) NOT NULL,
        CMPCODE      VARCHAR(6)     NOT NULL,
        CITYCODE     VARCHAR(3)     NOT NULL,
        SHEET_MONTH  CHAR(7)        NOT NULL,          -- YYYY-MM
        TITLE        NVARCHAR(100)  NULL,
        TABS         NVARCHAR(MAX)  NULL,              -- JSON array of tabs, owned by the UI / API
        ROWVER       INT            NOT NULL DEFAULT 1,
        MAKER_ID     VARCHAR(50)    NULL,
        MAKER_DT     DATETIME       NOT NULL DEFAULT GETDATE(),
        MODIFY_ID    VARCHAR(50)    NULL,
        MODIFY_DT    DATETIME       NULL,
        CONSTRAINT PK_TBL_EXPT_SHEET_MONTH PRIMARY KEY CLUSTERED (ID),
        CONSTRAINT UQ_TBL_EXPT_SHEET_MONTH UNIQUE (CMPCODE, CITYCODE, SHEET_MONTH),
        CONSTRAINT CK_TBL_EXPT_SHEET_MONTH_YM CHECK (SHEET_MONTH LIKE '[12][0-9][0-9][0-9]-[01][0-9]')
    );
    PRINT 'TBL_EXPT_SHEET_MONTH created.';
END
GO

IF OBJECT_ID('dbo.TBL_EXPT_SHEET_ROW', 'U') IS NULL
BEGIN
    -- 52 registry columns as text (dates stored dd-mm-yyyy when real, else as typed). The declared row size is above
    -- 8,060 bytes: SQL Server warns and keeps long values off-row (row-overflow), which is expected here.
    CREATE TABLE dbo.TBL_EXPT_SHEET_ROW (
        ID           INT IDENTITY(1,1) NOT NULL,
        MONTH_ID     INT            NOT NULL,
        TAB_CODE     VARCHAR(20)    NOT NULL,
        SORT_ORDER   FLOAT          NOT NULL,
        STATUS_CODE  VARCHAR(20)    NULL,              -- TBL_EXPT_SHEET_STATUS.CODE (row colour)
        EXPTNO       VARCHAR(25)    NULL,              -- the linked Links job
        WO                   NVARCHAR(500)   NULL,
        PORT                 NVARCHAR(500)   NULL,
        COUNTRY              NVARCHAR(500)   NULL,
        VEH                  NVARCHAR(2000)  NULL,
        QTY                  NVARCHAR(500)   NULL,
        CONT                 NVARCHAR(500)   NULL,
        CNTR_TYPE            NVARCHAR(500)   NULL,
        STUFFING_DT          NVARCHAR(500)   NULL,
        VSL_NAME             NVARCHAR(500)   NULL,
        DO_ETD               NVARCHAR(500)   NULL,
        SLINE                NVARCHAR(500)   NULL,
        AGENT                NVARCHAR(500)   NULL,
        DO_RECEIVE_DT        NVARCHAR(500)   NULL,
        BOOKING_NO           NVARCHAR(500)   NULL,
        TRANSPORTER          NVARCHAR(500)   NULL,
        CARGO_TYPE           NVARCHAR(500)   NULL,
        PLANT                NVARCHAR(500)   NULL,
        PO_NO                NVARCHAR(500)   NULL,
        LC_NO                NVARCHAR(500)   NULL,
        LC_DATE              NVARCHAR(500)   NULL,
        HAZ                  NVARCHAR(500)   NULL,
        CONSIGNEE            NVARCHAR(500)   NULL,
        REMARK1              NVARCHAR(2000)  NULL,
        DO_GIVEN_DT          NVARCHAR(500)   NULL,
        CONTAINER_NO         NVARCHAR(2000)  NULL,
        POL_GATE             NVARCHAR(500)   NULL,
        GATE_OPEN_DT         NVARCHAR(500)   NULL,
        GATE_CUTOFF_DT       NVARCHAR(500)   NULL,
        SI_CUTOFF_DT         NVARCHAR(500)   NULL,
        DO_ETD2              NVARCHAR(500)   NULL,
        CURRENT_ETD          NVARCHAR(500)   NULL,
        ETA_DEST             NVARCHAR(500)   NULL,
        FINAL_VSL_SOB        NVARCHAR(500)   NULL,
        VGM_SUBMITTED_DT     NVARCHAR(500)   NULL,
        SI_SUBMITTED_DT      NVARCHAR(500)   NULL,
        BL_NO                NVARCHAR(500)   NULL,
        BL_DT                NVARCHAR(500)   NULL,
        BL_HANDOVER_DT       NVARCHAR(500)   NULL,
        FF_JOB               NVARCHAR(500)   NULL,
        SLINE_PAYMENT_STATUS NVARCHAR(500)   NULL,
        CLEARANCE_POINT      NVARCHAR(500)   NULL,
        OPEN_ORDER           NVARCHAR(500)   NULL,
        BUFFER_YARD          NVARCHAR(500)   NULL,
        EDOC_STATUS          NVARCHAR(500)   NULL,
        COURIER_DT           NVARCHAR(500)   NULL,
        PICKUP_DT            NVARCHAR(500)   NULL,
        CNTR_DISPATCH_DT     NVARCHAR(500)   NULL,
        CNTR_REPORT_NS_DT    NVARCHAR(500)   NULL,
        CNTR_GATEDIN_DT      NVARCHAR(500)   NULL,
        SB_NO                NVARCHAR(500)   NULL,
        SB_DT                NVARCHAR(500)   NULL,
        FOR_HBL              NVARCHAR(500)   NULL,
        CELL_FMT     NVARCHAR(MAX)  NULL,              -- canonical JSON written by USP_EXPT_SHEET_SAVE_FMT
        ROWVER       INT            NOT NULL DEFAULT 1,
        ISDELETED    BIT            NOT NULL DEFAULT 0,
        MAKER_ID     VARCHAR(50)    NULL,
        MAKER_DT     DATETIME       NOT NULL DEFAULT GETDATE(),
        MODIFY_ID    VARCHAR(50)    NULL,
        MODIFY_DT    DATETIME       NOT NULL DEFAULT GETDATE(),
        CONSTRAINT PK_TBL_EXPT_SHEET_ROW PRIMARY KEY CLUSTERED (ID),
        CONSTRAINT FK_TBL_EXPT_SHEET_ROW_MONTH FOREIGN KEY (MONTH_ID) REFERENCES dbo.TBL_EXPT_SHEET_MONTH (ID)
    );
    CREATE INDEX IX_TBL_EXPT_SHEET_ROW_TAB    ON dbo.TBL_EXPT_SHEET_ROW (MONTH_ID, TAB_CODE, ISDELETED, SORT_ORDER);
    CREATE INDEX IX_TBL_EXPT_SHEET_ROW_EXPTNO ON dbo.TBL_EXPT_SHEET_ROW (EXPTNO);
    CREATE INDEX IX_TBL_EXPT_SHEET_ROW_MODIFY ON dbo.TBL_EXPT_SHEET_ROW (MODIFY_DT) INCLUDE (MONTH_ID, TAB_CODE);
    PRINT 'TBL_EXPT_SHEET_ROW created.';
END
GO

IF OBJECT_ID('dbo.TBL_EXPT_SHEET_GRIDROW', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TBL_EXPT_SHEET_GRIDROW (
        ID           INT IDENTITY(1,1) NOT NULL,
        MONTH_ID     INT            NOT NULL,
        TAB_CODE     VARCHAR(20)    NOT NULL,          -- BOOKINGS, VEHWEIGHTS, DGD, PRICE
        SORT_ORDER   FLOAT          NOT NULL,
        DATA         NVARCHAR(MAX)  NULL,              -- JSON {"A":"..","B":".."} by column letter, merged by the API
        CELL_FMT     NVARCHAR(MAX)  NULL,
        ROWVER       INT            NOT NULL DEFAULT 1,
        ISDELETED    BIT            NOT NULL DEFAULT 0,
        MAKER_ID     VARCHAR(50)    NULL,
        MAKER_DT     DATETIME       NOT NULL DEFAULT GETDATE(),
        MODIFY_ID    VARCHAR(50)    NULL,
        MODIFY_DT    DATETIME       NOT NULL DEFAULT GETDATE(),
        CONSTRAINT PK_TBL_EXPT_SHEET_GRIDROW PRIMARY KEY CLUSTERED (ID),
        CONSTRAINT FK_TBL_EXPT_SHEET_GRIDROW_MONTH FOREIGN KEY (MONTH_ID) REFERENCES dbo.TBL_EXPT_SHEET_MONTH (ID)
    );
    CREATE INDEX IX_TBL_EXPT_SHEET_GRIDROW_TAB ON dbo.TBL_EXPT_SHEET_GRIDROW (MONTH_ID, TAB_CODE, ISDELETED, SORT_ORDER);
    PRINT 'TBL_EXPT_SHEET_GRIDROW created.';
END
GO

IF OBJECT_ID('dbo.TBL_EXPT_SHEET_TABMETA', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TBL_EXPT_SHEET_TABMETA (
        MONTH_ID     INT            NOT NULL,
        TAB_CODE     VARCHAR(20)    NOT NULL,
        META         NVARCHAR(MAX)  NULL,              -- JSON: headers, widths, merges, frozen rows / columns
        ROWVER       INT            NOT NULL DEFAULT 1,
        MODIFY_ID    VARCHAR(50)    NULL,
        MODIFY_DT    DATETIME       NOT NULL DEFAULT GETDATE(),
        CONSTRAINT PK_TBL_EXPT_SHEET_TABMETA PRIMARY KEY CLUSTERED (MONTH_ID, TAB_CODE),
        CONSTRAINT FK_TBL_EXPT_SHEET_TABMETA_MONTH FOREIGN KEY (MONTH_ID) REFERENCES dbo.TBL_EXPT_SHEET_MONTH (ID)
    );
    PRINT 'TBL_EXPT_SHEET_TABMETA created.';
END
GO

IF OBJECT_ID('dbo.TBL_EXPT_SHEET_STATUS', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TBL_EXPT_SHEET_STATUS (
        CODE         VARCHAR(20)    NOT NULL,
        LABEL        NVARCHAR(100)  NOT NULL,
        MEANING      NVARCHAR(200)  NULL,
        BG           CHAR(7)        NULL,              -- #rrggbb row fill; NULL = none (HAZ: red font only)
        FG           CHAR(7)        NULL,              -- #rrggbb font colour; NULL = default
        SORT         INT            NOT NULL DEFAULT 0,
        ACTIVE       BIT            NOT NULL DEFAULT 1,
        MODIFY_ID    VARCHAR(50)    NULL,
        MODIFY_DT    DATETIME       NULL,
        CONSTRAINT PK_TBL_EXPT_SHEET_STATUS PRIMARY KEY CLUSTERED (CODE)
    );
    PRINT 'TBL_EXPT_SHEET_STATUS created.';
END
GO

IF OBJECT_ID('dbo.TBL_EXPT_SHEET_ROLE', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TBL_EXPT_SHEET_ROLE (
        CODE         VARCHAR(20)    NOT NULL,
        LABEL        NVARCHAR(60)   NOT NULL,
        SORT         INT            NOT NULL DEFAULT 0,
        CONSTRAINT PK_TBL_EXPT_SHEET_ROLE PRIMARY KEY CLUSTERED (CODE)
    );
    PRINT 'TBL_EXPT_SHEET_ROLE created.';
END
GO

IF OBJECT_ID('dbo.TBL_EXPT_SHEET_ROLE_COL', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TBL_EXPT_SHEET_ROLE_COL (
        ROLE_CODE    VARCHAR(20)    NOT NULL,
        COL_KEY      VARCHAR(40)    NOT NULL,
        CONSTRAINT PK_TBL_EXPT_SHEET_ROLE_COL PRIMARY KEY CLUSTERED (ROLE_CODE, COL_KEY),
        CONSTRAINT FK_TBL_EXPT_SHEET_ROLE_COL_ROLE FOREIGN KEY (ROLE_CODE) REFERENCES dbo.TBL_EXPT_SHEET_ROLE (CODE)
    );
    PRINT 'TBL_EXPT_SHEET_ROLE_COL created.';
END
GO

IF OBJECT_ID('dbo.TBL_EXPT_SHEET_ROLE_USER', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TBL_EXPT_SHEET_ROLE_USER (
        ROLE_CODE    VARCHAR(20)    NOT NULL,
        USER_ID      VARCHAR(50)    NOT NULL,          -- Links CMPID (or user code, cmp_dtls.cmp_usercode)
        MAKER_ID     VARCHAR(50)    NULL,
        MAKER_DT     DATETIME       NOT NULL DEFAULT GETDATE(),
        CONSTRAINT PK_TBL_EXPT_SHEET_ROLE_USER PRIMARY KEY CLUSTERED (ROLE_CODE, USER_ID),
        CONSTRAINT FK_TBL_EXPT_SHEET_ROLE_USER_ROLE FOREIGN KEY (ROLE_CODE) REFERENCES dbo.TBL_EXPT_SHEET_ROLE (CODE)
    );
    PRINT 'TBL_EXPT_SHEET_ROLE_USER created.';
END
GO

IF OBJECT_ID('dbo.TBL_EXPT_SHEET_ALIAS', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TBL_EXPT_SHEET_ALIAS (
        KIND         VARCHAR(20)    NOT NULL,          -- CONSIGNEE, AGENT, SLINE, PORT, COUNTRY, POLGATE, CLEARANCE, VESSEL
        SHEET_VALUE  NVARCHAR(200)  NOT NULL,
        LINKS_CODE   VARCHAR(50)    NULL,
        LINKS_TEXT   NVARCHAR(200)  NULL,
        SOURCE       VARCHAR(10)    NOT NULL DEFAULT 'admin',
        CONFIRMED    BIT            NOT NULL DEFAULT 0,
        MODIFY_ID    VARCHAR(50)    NULL,
        MODIFY_DT    DATETIME       NULL,
        CONSTRAINT PK_TBL_EXPT_SHEET_ALIAS PRIMARY KEY CLUSTERED (KIND, SHEET_VALUE),
        CONSTRAINT CK_TBL_EXPT_SHEET_ALIAS_SOURCE CHECK (SOURCE IN ('auto', 'admin'))
    );
    PRINT 'TBL_EXPT_SHEET_ALIAS created.';
END
GO

IF OBJECT_ID('dbo.TBL_EXPT_SHEET_LOG', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TBL_EXPT_SHEET_LOG (
        ID           BIGINT IDENTITY(1,1) NOT NULL,
        ROW_KIND     CHAR(1)        NOT NULL,          -- W wo row, G grid row, M month / settings (ROW_ID 0)
        ROW_ID       INT            NOT NULL,
        COL_KEY      VARCHAR(40)    NULL,
        OLD_VALUE    NVARCHAR(2000) NULL,
        NEW_VALUE    NVARCHAR(2000) NULL,
        ACTION       VARCHAR(20)    NOT NULL,          -- edit, insert, delete, restore, move, link, unlink, convert, status, fmt
        USER_ID      VARCHAR(50)    NULL,
        USER_NAME    NVARCHAR(100)  NULL,
        LOG_DT       DATETIME       NOT NULL DEFAULT GETDATE(),
        CONSTRAINT PK_TBL_EXPT_SHEET_LOG PRIMARY KEY CLUSTERED (ID)
    );
    CREATE INDEX IX_TBL_EXPT_SHEET_LOG_ROW ON dbo.TBL_EXPT_SHEET_LOG (ROW_KIND, ROW_ID);
    PRINT 'TBL_EXPT_SHEET_LOG created.';
END
GO

IF OBJECT_ID('dbo.TBL_EXPT_SHEET_VIEW', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.TBL_EXPT_SHEET_VIEW (
        ID           INT IDENTITY(1,1) NOT NULL,
        USER_ID      VARCHAR(50)    NOT NULL,
        MONTH_ID     INT            NULL,
        TAB_CODE     VARCHAR(20)    NOT NULL,
        NAME         NVARCHAR(60)   NOT NULL,
        KIND         VARCHAR(10)    NOT NULL,          -- layout (widths / hidden / frozen) or filter
        DATA         NVARCHAR(MAX)  NULL,
        MODIFY_DT    DATETIME       NOT NULL DEFAULT GETDATE(),
        CONSTRAINT PK_TBL_EXPT_SHEET_VIEW PRIMARY KEY CLUSTERED (ID),
        CONSTRAINT CK_TBL_EXPT_SHEET_VIEW_KIND CHECK (KIND IN ('layout', 'filter'))
    );
    CREATE INDEX IX_TBL_EXPT_SHEET_VIEW_USER ON dbo.TBL_EXPT_SHEET_VIEW (USER_ID, TAB_CODE);
    PRINT 'TBL_EXPT_SHEET_VIEW created.';
END
GO

/* ==== 3. seeds (only what is missing; live settings are kept) =================================== */
-- 3a. Colour CODE (the workbook's Colour CODE tab; codes from the build brief)
INSERT INTO dbo.TBL_EXPT_SHEET_STATUS (CODE, LABEL, MEANING, BG, FG, SORT, ACTIVE, MODIFY_ID, MODIFY_DT)
SELECT S.CODE, S.LABEL, S.MEANING, S.BG, S.FG, S.SORT, 1, 'SEED', GETDATE()
  FROM (VALUES
        ('COMPLETE', N'Shipment Complete', N'Shipment complete', '#ffff00', NULL, 1),
        ('SI_DONE', N'SI Filling Complete', N'SI filling complete (workbook note: need to file SI)', '#00ff00', NULL, 2),
        ('BKG_RELEASE', N'Booking Release', N'Booking released (workbook note: booking sent to transporter)', '#46bdc6', NULL, 3),
        ('HAZ', N'HAZ Container (Yes)', N'Hazardous cargo: red font, no fill (HAZ = YES turns the row font red by itself)', NULL, '#ff0000', 4),
        ('PLAN_CHANGED', N'Bookings to Planned', N'Bookings to be planned (workbook note: planning date changed)', '#ff00ff', NULL, 5),
        ('BKG_AVAILABLE', N'Booking available to be released', N'Booking available to be released', '#ff9900', NULL, 6),
        ('TAKE_BKG', N'Take Booking', N'Take booking (booking desk task)', '#9fc5e8', NULL, 7),
        ('LC_AWAITED', N'LC Awaited / Cargo Not Ready', N'LC awaited / cargo not ready at plant', '#ff0000', NULL, 8),
        ('HOLD', N'HOLD', N'Shipment on hold (also a temporary hold)', '#fbbc04', NULL, 9),
        ('UNKNOWN', N'Unknown', N'Status not known yet', '#9900ff', NULL, 10)
       ) S (CODE, LABEL, MEANING, BG, FG, SORT)
 WHERE NOT EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_STATUS T WHERE T.CODE = S.CODE);
PRINT 'TBL_EXPT_SHEET_STATUS: ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' status(es) added.';

-- 3b. Column Access roles
INSERT INTO dbo.TBL_EXPT_SHEET_ROLE (CODE, LABEL, SORT)
SELECT R.CODE, R.LABEL, R.SORT
  FROM (VALUES ('OPS', N'Ops / Planning', 1), ('BOOKING', N'Booking desk', 2), ('OPSLEAD', N'Ops lead', 3), ('DOCS', N'Documentation', 4), ('BLDESK', N'BL desk', 5), ('YARD', N'Yard / CFS', 6), ('ALL', N'Everyone', 7), ('ADMIN', N'Admins', 8)) R (CODE, LABEL, SORT)
 WHERE NOT EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_ROLE T WHERE T.CODE = R.CODE);
PRINT 'TBL_EXPT_SHEET_ROLE: ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' role(s) added.';

-- 3c. column ownership = the registry's owner roles - only on the first run (while the table is empty), so ownership an
--     admin changed later is never put back
IF NOT EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_ROLE_COL)
BEGIN
    INSERT INTO dbo.TBL_EXPT_SHEET_ROLE_COL (ROLE_CODE, COL_KEY)
    SELECT C.ROLE_CODE, C.COL_KEY
      FROM (VALUES
        ('OPS', 'WO'), ('OPS', 'PORT'), ('OPS', 'COUNTRY'), ('OPS', 'VEH'), ('OPS', 'QTY'),
        ('OPS', 'CONT'), ('OPS', 'CNTR_TYPE'), ('OPS', 'STUFFING_DT'), ('BOOKING', 'VSL_NAME'), ('OPS', 'DO_ETD'),
        ('BOOKING', 'SLINE'), ('OPS', 'AGENT'), ('OPS', 'DO_RECEIVE_DT'), ('OPS', 'BOOKING_NO'), ('OPS', 'TRANSPORTER'),
        ('OPS', 'CARGO_TYPE'), ('OPS', 'PLANT'), ('OPS', 'PO_NO'), ('OPS', 'LC_NO'), ('OPS', 'LC_DATE'),
        ('OPS', 'HAZ'), ('OPS', 'CONSIGNEE'), ('ALL', 'REMARK1'), ('OPS', 'DO_GIVEN_DT'), ('OPSLEAD', 'CONTAINER_NO'),
        ('OPS', 'POL_GATE'), ('OPS', 'GATE_OPEN_DT'), ('OPS', 'GATE_CUTOFF_DT'), ('OPS', 'SI_CUTOFF_DT'), ('OPS', 'DO_ETD2'),
        ('OPS', 'CURRENT_ETD'), ('OPS', 'ETA_DEST'), ('OPS', 'FINAL_VSL_SOB'), ('DOCS', 'VGM_SUBMITTED_DT'), ('DOCS', 'SI_SUBMITTED_DT'),
        ('BLDESK', 'BL_NO'), ('OPS', 'BL_DT'), ('BLDESK', 'BL_HANDOVER_DT'), ('BLDESK', 'FF_JOB'), ('OPS', 'SLINE_PAYMENT_STATUS'),
        ('OPSLEAD', 'CLEARANCE_POINT'), ('OPSLEAD', 'OPEN_ORDER'), ('OPSLEAD', 'BUFFER_YARD'), ('DOCS', 'EDOC_STATUS'), ('DOCS', 'COURIER_DT'),
        ('YARD', 'PICKUP_DT'), ('OPS', 'CNTR_DISPATCH_DT'), ('YARD', 'CNTR_REPORT_NS_DT'), ('YARD', 'CNTR_GATEDIN_DT'), ('OPSLEAD', 'SB_NO'),
        ('OPSLEAD', 'SB_DT'), ('OPS', 'FOR_HBL')
           ) C (ROLE_CODE, COL_KEY);
    PRINT 'TBL_EXPT_SHEET_ROLE_COL: ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' column owner(s) seeded.';
END
ELSE
    PRINT 'TBL_EXPT_SHEET_ROLE_COL already has rows - left as it is.';

-- 3d. Links form rights rows of the page (module 3 Export). Only free ids are written (step 1 stopped the script if an id
--     belongs to another form). No rights are granted: grant them in the Form-wise Rights screen.
--     448 view / add rows / modify cells, 449 Convert / Link to job (admins), 450 settings (Colour CODE, Column Access, aliases)
INSERT INTO dbo.tbl_Mst_Form (pk_FormId, fk_ModuleId, FormName, DisplayName, isReport, isFranceAct, SEQ, RIGHTS, ng_filename, FrmSrc)
SELECT F.ID, 3, F.FNAME, F.DNAME, 0, '0', F.SEQ, F.RIGHTS, NULL, 'NG'
  FROM (VALUES
        (448, N'sheet-view.component.html', N'EXPORT - SHEET VIEW', N'020107', N'1110'),
        (449, N'sheet-view.convert', N'EXPORT - SHEET VIEW CONVERT / LINK JOB', N'020108', N'1000'),
        (450, N'sheet-view.settings', N'EXPORT - SHEET VIEW SETTINGS', N'020109', N'1110')
       ) F (ID, FNAME, DNAME, SEQ, RIGHTS)
 WHERE NOT EXISTS (SELECT 1 FROM dbo.tbl_Mst_Form X WHERE X.pk_FormId = F.ID);
PRINT 'tbl_Mst_Form: ' + CAST(@@ROWCOUNT AS VARCHAR(10)) + ' form row(s) added (448-450).';
GO

/* ==== 4. procedures ======================================================================== */
/* ---- dbo.USP_EXPT_SHEET_LINKS_FILL ------------------------------------------------------------- */
IF OBJECT_ID('dbo.USP_EXPT_SHEET_LINKS_FILL', 'P') IS NOT NULL
    DROP PROCEDURE dbo.USP_EXPT_SHEET_LINKS_FILL;      -- step 1 made sure it is this script's own
GO
CREATE PROCEDURE dbo.USP_EXPT_SHEET_LINKS_FILL
AS
BEGIN
    -- Deployed by links-22/_DB_FIX/EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql (Export > Sheet view). Do not edit here: change that script.
    -- Internal. Fills the Links-owned live values (L_<KEY>) of the rows of #SHEET_LK with FILLED = 0.
    -- The caller creates #SHEET_LK (EXPTNO + defaults). Same expressions as dbo.USP_EXPT_JOB_TRACKING_LIST (live text read
    -- 2026-10-21), set-based: every source table is read once, joined on the export numbers in #SHEET_LK, into #LF_* sets
    -- keyed on EXPTNO; nothing is looked up row by row in EXPT_MASTER, EXPT_CONTAINER1 or VSL_PORTDTLS. Deliberate differences:
    --   container count / list / sizes / booking nos over DISTINCT container numbers (EXPT_CONTAINER holds 9 container
    --   numbers twice and EXPT_CONTAINER1 7 job + container pairs twice on 2026-10-21; the list would count them twice);
    --   L_CONT is '' (not 0) for a job without containers, so an empty Links value never locks the column;
    --   the TOP 1 lookup (shipping line) is a MIN - the same value while the liner codes are unique, as today;
    --   AGENT is not Links-owned (the tracking list's AGENT is EXPT_VSLAGENT, the vessel agency, not the sheet's agent);
    --   dates come back as dd-mm-yyyy (Links keeps dd/mm/yyyy text), any other text as stored;
    --   an export number held twice in EXPT_MASTER uses the first-opened job (as TBL_EXPT_JOB_STATE does).
    SET NOCOUNT ON;
    IF OBJECT_ID('tempdb..#SHEET_LK') IS NULL RETURN;
    IF NOT EXISTS (SELECT 1 FROM #SHEET_LK WHERE FILLED = 0) RETURN;

    -- 1. the jobs, one row per export number
    SELECT X.EXPTNO, X.INVNO, X.POD, X.DESTCOUNTRY, X.PKGS, X.VESSEL, X.VSL_PORT, X.VSLAGENT, X.CONSIGNEE, X.ETA,
           X.BLNO, X.BLDT, X.SBNO, X.SBDT, X.HBLNO, X.COURIER, X.CANCELLED
    INTO   #LF_EM
    FROM  (SELECT LTRIM(RTRIM(EM.EXPTNO))                         AS EXPTNO,
                  LTRIM(RTRIM(ISNULL(EM.EXPT_INVNO, '')))         AS INVNO,
                  LTRIM(RTRIM(ISNULL(EM.EXPT_POD, '')))           AS POD,
                  LTRIM(RTRIM(ISNULL(EM.EXPT_DESTCOUNTRY, '')))   AS DESTCOUNTRY,
                  LTRIM(RTRIM(ISNULL(EM.EXPT_NOOFPKGS, '')))      AS PKGS,
                  LTRIM(RTRIM(ISNULL(EM.EXPT_VESSEL, '')))        AS VESSEL,
                  LTRIM(RTRIM(ISNULL(EM.VSL_PORT, '')))           AS VSL_PORT,
                  LTRIM(RTRIM(ISNULL(EM.EXPT_VSLAGENT, '')))      AS VSLAGENT,
                  LTRIM(RTRIM(ISNULL(EM.EXPT_CONSIGNEE, '')))     AS CONSIGNEE,
                  CASE WHEN LTRIM(RTRIM(ISNULL(EM.ETAPORT2, ''))) <> '' THEN LTRIM(RTRIM(EM.ETAPORT2))
                       ELSE LTRIM(RTRIM(ISNULL(EM.ETAPORT1, ''))) END AS ETA,
                  LTRIM(RTRIM(ISNULL(EM.EXPT_BLNO, '')))          AS BLNO,
                  LTRIM(RTRIM(ISNULL(EM.EXPT_BLDT, '')))          AS BLDT,
                  LTRIM(RTRIM(ISNULL(EM.EXPT_SHIPBILLNO, '')))    AS SBNO,
                  CASE WHEN LTRIM(RTRIM(ISNULL(EM.EXPT_SHIPBILLDT, ''))) <> '' THEN LTRIM(RTRIM(EM.EXPT_SHIPBILLDT))
                       ELSE LTRIM(RTRIM(ISNULL(EM.EXPT_SHIPBILLDT1, ''))) END AS SBDT,
                  LTRIM(RTRIM(ISNULL(EM.EXPT_HBLNO, '')))         AS HBLNO,
                  LTRIM(RTRIM(ISNULL(CONVERT(VARCHAR(10), EM.DOCSENTDT, 103), ''))) AS COURIER,
                  CASE WHEN ISNULL(EM.EXPTCANCEL, '') = 'Y' THEN 1 ELSE 0 END AS CANCELLED,
                  ROW_NUMBER() OVER (PARTITION BY EM.EXPTNO ORDER BY EM.SYSEXPT_DOCRECD, EM.ID) AS RN
           FROM   dbo.EXPT_MASTER EM
                  JOIN #SHEET_LK L ON L.EXPTNO = EM.EXPTNO AND L.FILLED = 0) X
    WHERE  X.RN = 1;
    CREATE UNIQUE CLUSTERED INDEX CX_LF_EM ON #LF_EM (EXPTNO);

    -- 2. containers: one row per job + container number, attributes from EXPT_CONTAINER (first value per number)
    SELECT DISTINCT E.EXPTNO, LTRIM(RTRIM(K.CONTAINERNO)) AS CONTAINERNO
    INTO   #LF_K
    FROM   dbo.EXPT_CONTAINER1 K JOIN #LF_EM E ON E.EXPTNO = K.EXPTNO
    WHERE  LTRIM(RTRIM(ISNULL(K.CONTAINERNO, ''))) <> '';
    CREATE CLUSTERED INDEX CX_LF_K ON #LF_K (EXPTNO, CONTAINERNO);

    SELECT C.CONTAINERNO, MIN(LTRIM(RTRIM(ISNULL(C.CONTAINERSIZE, '')))) AS CSIZE, MIN(LTRIM(RTRIM(ISNULL(C.SHPGLINE, '')))) AS SHPGLINE,
           MIN(NULLIF(LTRIM(RTRIM(ISNULL(C.BOOK_CARR_NBR, ''))), '')) AS BOOKNO
    INTO   #LF_C
    FROM   dbo.EXPT_CONTAINER C JOIN (SELECT DISTINCT CONTAINERNO FROM #LF_K) K ON K.CONTAINERNO = C.CONTAINERNO
    GROUP BY C.CONTAINERNO;

    SELECT K.EXPTNO, K.CONTAINERNO, ISNULL(C.CSIZE, '') AS CSIZE, ISNULL(C.SHPGLINE, '') AS SHPGLINE, ISNULL(C.BOOKNO, '') AS BOOKNO
    INTO   #LF_CN
    FROM   #LF_K K LEFT JOIN #LF_C C ON C.CONTAINERNO = K.CONTAINERNO;
    CREATE CLUSTERED INDEX CX_LF_CN ON #LF_CN (EXPTNO);

    SELECT L.LINER_CODE, MIN(LTRIM(RTRIM(L.LINER_NAME))) AS LINER_NAME
    INTO   #LF_LN
    FROM   dbo.LINER_MASTER L JOIN (SELECT DISTINCT SHPGLINE FROM #LF_CN WHERE SHPGLINE <> '') S ON S.SHPGLINE = L.LINER_CODE
    GROUP BY L.LINER_CODE;

    -- 3. order (PO) numbers, e-documents
    SELECT E.EXPTNO, LTRIM(RTRIM(O.ORDERNO)) AS ORDERNO
    INTO   #LF_PO
    FROM   dbo.EXPT_ORDERNO O JOIN #LF_EM E ON E.EXPTNO = O.EXPTNO
    WHERE  LTRIM(RTRIM(ISNULL(O.ORDERNO, ''))) <> '';
    CREATE CLUSTERED INDEX CX_LF_PO ON #LF_PO (EXPTNO);

    SELECT E.EXPTNO, COUNT(*) AS N
    INTO   #LF_ED
    FROM   dbo.TBL_EDOC_MST_UPLOAD U JOIN #LF_EM E ON E.EXPTNO = U.JOBNO
    WHERE  ISNULL(U.ISDELETED, '') <> '1'
    GROUP BY E.EXPTNO;

    -- 4. voyage (the 10-character ETD / SAILING text of the job's vessel + port, as the tracking list), vessel and
    --    consignee names
    SELECT P.VSL_RTNO, P.PORT,
           MAX(CASE WHEN LEN(LTRIM(RTRIM(ISNULL(P.ETD, '')))) = 10 THEN LTRIM(RTRIM(P.ETD)) END) AS ETD,
           MAX(CASE WHEN LEN(LTRIM(RTRIM(ISNULL(P.SAILING, '')))) = 10 THEN LTRIM(RTRIM(P.SAILING)) END) AS SAILING
    INTO   #LF_VP
    FROM   dbo.VSL_PORTDTLS P
           JOIN (SELECT DISTINCT VESSEL, VSL_PORT FROM #LF_EM WHERE VESSEL <> '') V ON V.VESSEL = P.VSL_RTNO AND V.VSL_PORT = P.PORT
    GROUP BY P.VSL_RTNO, P.PORT;

    SELECT VM.VSL_RTNO, MAX(LTRIM(RTRIM(VM.VSL_NAME))) AS VSL_NAME
    INTO   #LF_VM
    FROM   dbo.VSL_MASTER VM JOIN (SELECT DISTINCT VESSEL FROM #LF_EM WHERE VESSEL <> '') V ON V.VESSEL = VM.VSL_RTNO
    GROUP BY VM.VSL_RTNO;

    SELECT CM.CON_CODE, MAX(LTRIM(RTRIM(CM.CON_NAME))) AS CON_NAME
    INTO   #LF_CO
    FROM   dbo.CONSIGNEE_MASTER CM JOIN (SELECT DISTINCT CONSIGNEE FROM #LF_EM WHERE CONSIGNEE <> '') C ON C.CONSIGNEE = CM.CON_CODE
    GROUP BY CM.CON_CODE;

    -- 5. the values
    UPDATE L
    SET    FILLED        = 1,
           JOB_FOUND     = CASE WHEN E.EXPTNO IS NULL THEN 0 ELSE 1 END,
           JOB_CANCELLED = ISNULL(E.CANCELLED, 0),
           L_WO          = ISNULL(E.INVNO, ''),
           L_PORT        = ISNULL(E.POD, ''),
           L_COUNTRY     = ISNULL(E.DESTCOUNTRY, ''),
           L_QTY         = ISNULL(E.PKGS, ''),
           L_CONT        = CASE WHEN ISNULL(CNT.N, 0) > 0 THEN CONVERT(VARCHAR(10), CNT.N) ELSE '' END,
           L_CNTR_TYPE   = ISNULL(STUFF((SELECT DISTINCT N', ' + X.CSIZE FROM #LF_CN X WHERE X.EXPTNO = L.EXPTNO AND X.CSIZE <> ''
                                         FOR XML PATH(''), TYPE).value('.', 'NVARCHAR(MAX)'), 1, 2, N''), N''),
           L_VSL_NAME    = ISNULL(VM.VSL_NAME, ''),
           L_SLINE       = ISNULL((SELECT MIN(N.LINER_NAME) FROM #LF_CN X JOIN #LF_LN N ON N.LINER_CODE = X.SHPGLINE
                                   WHERE X.EXPTNO = L.EXPTNO), N''),
           L_BOOKING_NO  = ISNULL(STUFF((SELECT DISTINCT N', ' + X.BOOKNO FROM #LF_CN X WHERE X.EXPTNO = L.EXPTNO AND X.BOOKNO <> ''
                                         FOR XML PATH(''), TYPE).value('.', 'NVARCHAR(MAX)'), 1, 2, N''), N''),
           L_PO_NO       = ISNULL(STUFF((SELECT DISTINCT N', ' + P.ORDERNO FROM #LF_PO P WHERE P.EXPTNO = L.EXPTNO
                                         FOR XML PATH(''), TYPE).value('.', 'NVARCHAR(MAX)'), 1, 2, N''), N''),
           L_CONSIGNEE   = ISNULL(CO.CON_NAME, N''),
           L_CONTAINER_NO = ISNULL(STUFF((SELECT N', ' + X.CONTAINERNO FROM #LF_CN X WHERE X.EXPTNO = L.EXPTNO ORDER BY X.CONTAINERNO
                                          FOR XML PATH(''), TYPE).value('.', 'NVARCHAR(MAX)'), 1, 2, N''), N''),
           L_CURRENT_ETD = ISNULL(CASE WHEN VP.ETD LIKE '[0-3][0-9]/[01][0-9]/[12][0-9][0-9][0-9]' THEN REPLACE(VP.ETD, '/', '-') ELSE VP.ETD END, ''),
           L_ETA_DEST    = ISNULL(CASE WHEN E.ETA LIKE '[0-3][0-9]/[01][0-9]/[12][0-9][0-9][0-9]' THEN REPLACE(E.ETA, '/', '-') ELSE E.ETA END, ''),
           L_FINAL_VSL_SOB = ISNULL(CASE WHEN VP.SAILING LIKE '[0-3][0-9]/[01][0-9]/[12][0-9][0-9][0-9]' THEN REPLACE(VP.SAILING, '/', '-') ELSE VP.SAILING END, ''),
           L_BL_NO       = ISNULL(E.BLNO, ''),
           L_BL_DT       = ISNULL(CASE WHEN E.BLDT LIKE '[0-3][0-9]/[01][0-9]/[12][0-9][0-9][0-9]' THEN REPLACE(E.BLDT, '/', '-') ELSE E.BLDT END, ''),
           L_EDOC_STATUS = CASE WHEN E.EXPTNO IS NULL THEN ''
                                WHEN ISNULL(ED.N, 0) > 0 THEN 'UPLOADED (' + CONVERT(VARCHAR(10), ED.N) + ')' ELSE 'PENDING' END,
           L_COURIER_DT  = ISNULL(CASE WHEN E.COURIER LIKE '[0-3][0-9]/[01][0-9]/[12][0-9][0-9][0-9]' THEN REPLACE(E.COURIER, '/', '-') ELSE E.COURIER END, ''),
           L_SB_NO       = ISNULL(E.SBNO, ''),
           L_SB_DT       = ISNULL(CASE WHEN E.SBDT LIKE '[0-3][0-9]/[01][0-9]/[12][0-9][0-9][0-9]' THEN REPLACE(E.SBDT, '/', '-') ELSE E.SBDT END, ''),
           L_FOR_HBL     = ISNULL(E.HBLNO, '')
    FROM   #SHEET_LK L
           LEFT JOIN #LF_EM E ON E.EXPTNO = L.EXPTNO
           LEFT JOIN (SELECT EXPTNO, COUNT(*) AS N FROM #LF_CN GROUP BY EXPTNO) CNT ON CNT.EXPTNO = L.EXPTNO
           LEFT JOIN #LF_VP VP ON VP.VSL_RTNO = E.VESSEL AND VP.PORT = E.VSL_PORT
           LEFT JOIN #LF_VM VM ON VM.VSL_RTNO = E.VESSEL
           LEFT JOIN #LF_CO CO ON CO.CON_CODE = E.CONSIGNEE
           LEFT JOIN #LF_ED ED ON ED.EXPTNO = L.EXPTNO
    WHERE  L.FILLED = 0;
END
GO

/* ---- dbo.USP_EXPT_SHEET_ROWS_OUT --------------------------------------------------------------- */
IF OBJECT_ID('dbo.USP_EXPT_SHEET_ROWS_OUT', 'P') IS NOT NULL
    DROP PROCEDURE dbo.USP_EXPT_SHEET_ROWS_OUT;      -- step 1 made sure it is this script's own
GO
CREATE PROCEDURE dbo.USP_EXPT_SHEET_ROWS_OUT
    @WITH_LINKS BIT
AS
BEGIN
    -- Deployed by links-22/_DB_FIX/EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql (Export > Sheet view). Do not edit here: change that script.
    -- Internal. Emits the LOAD shape for the rows in #SHEET_IDS (both temp tables are created by the caller):
    --   result 1 = the rows (every registry column + ID, MONTH_ID, TAB_CODE, SORT_ORDER, STATUS_CODE, EXPTNO, CELL_FMT, ROWVER,
    --              ISDELETED, MAKER_*, MODIFY_*), ordered by SORT_ORDER, ID
    --   result 2 = (@WITH_LINKS = 1 only) the live Links values of the linked ones: ID, EXPTNO, JOB_FOUND, JOB_CANCELLED, L_<KEY>
    SET NOCOUNT ON;
    SELECT R.ID, R.MONTH_ID, R.TAB_CODE, R.SORT_ORDER, R.STATUS_CODE, R.EXPTNO,
           R.WO, R.PORT, R.COUNTRY, R.VEH, R.QTY, R.CONT, R.CNTR_TYPE, R.STUFFING_DT, R.VSL_NAME, R.DO_ETD, R.SLINE,
           R.AGENT, R.DO_RECEIVE_DT, R.BOOKING_NO, R.TRANSPORTER, R.CARGO_TYPE, R.PLANT, R.PO_NO, R.LC_NO, R.LC_DATE,
           R.HAZ, R.CONSIGNEE, R.REMARK1, R.DO_GIVEN_DT, R.CONTAINER_NO, R.POL_GATE, R.GATE_OPEN_DT, R.GATE_CUTOFF_DT,
           R.SI_CUTOFF_DT, R.DO_ETD2, R.CURRENT_ETD, R.ETA_DEST, R.FINAL_VSL_SOB, R.VGM_SUBMITTED_DT, R.SI_SUBMITTED_DT,
           R.BL_NO, R.BL_DT, R.BL_HANDOVER_DT, R.FF_JOB, R.SLINE_PAYMENT_STATUS, R.CLEARANCE_POINT, R.OPEN_ORDER,
           R.BUFFER_YARD, R.EDOC_STATUS, R.COURIER_DT, R.PICKUP_DT, R.CNTR_DISPATCH_DT, R.CNTR_REPORT_NS_DT,
           R.CNTR_GATEDIN_DT, R.SB_NO, R.SB_DT, R.FOR_HBL,
           R.CELL_FMT, R.ROWVER, R.ISDELETED, R.MAKER_ID, R.MAKER_DT, R.MODIFY_ID, R.MODIFY_DT
    FROM   dbo.TBL_EXPT_SHEET_ROW R JOIN #SHEET_IDS I ON I.ID = R.ID
    ORDER BY R.SORT_ORDER, R.ID;

    IF ISNULL(@WITH_LINKS, 1) = 1
    BEGIN
        INSERT INTO #SHEET_LK (EXPTNO)
        SELECT DISTINCT R.EXPTNO
        FROM   dbo.TBL_EXPT_SHEET_ROW R JOIN #SHEET_IDS I ON I.ID = R.ID
        WHERE  R.EXPTNO IS NOT NULL AND NOT EXISTS (SELECT 1 FROM #SHEET_LK L WHERE L.EXPTNO = R.EXPTNO);

        EXEC dbo.USP_EXPT_SHEET_LINKS_FILL;

        SELECT R.ID, R.EXPTNO, L.JOB_FOUND, L.JOB_CANCELLED,
               L.L_WO, L.L_PORT, L.L_COUNTRY, L.L_QTY, L.L_CONT, L.L_CNTR_TYPE, L.L_VSL_NAME, L.L_SLINE, L.L_BOOKING_NO, L.L_PO_NO, L.L_CONSIGNEE, L.L_CONTAINER_NO, L.L_CURRENT_ETD, L.L_ETA_DEST, L.L_FINAL_VSL_SOB, L.L_BL_NO, L.L_BL_DT, L.L_EDOC_STATUS, L.L_COURIER_DT, L.L_SB_NO, L.L_SB_DT, L.L_FOR_HBL
        FROM   dbo.TBL_EXPT_SHEET_ROW R JOIN #SHEET_IDS I ON I.ID = R.ID JOIN #SHEET_LK L ON L.EXPTNO = R.EXPTNO
        ORDER BY R.SORT_ORDER, R.ID;
    END
END
GO

/* ---- dbo.USP_EXPT_SHEET_TRACK_MIRROR ----------------------------------------------------------- */
IF OBJECT_ID('dbo.USP_EXPT_SHEET_TRACK_MIRROR', 'P') IS NOT NULL
    DROP PROCEDURE dbo.USP_EXPT_SHEET_TRACK_MIRROR;      -- step 1 made sure it is this script's own
GO
CREATE PROCEDURE dbo.USP_EXPT_SHEET_TRACK_MIRROR
    @USER_ID VARCHAR(50),
    @FIELDS  INT OUTPUT
AS
BEGIN
    -- Deployed by links-22/_DB_FIX/EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql (Export > Sheet view). Do not edit here: change that script.
    -- Internal. Writes the values in #SHEET_MIRROR (EXPTNO, F = EXPT_JOB_TRACKING column, TV = value as text, NULL clears)
    -- into dbo.EXPT_JOB_TRACKING, the way USP_EXPT_JOB_TRACKING_SAVE does: the tracking row is inserted when missing, dates
    -- go in through CONVERT(DATETIME, 'dd/mm/yyyy', 103), every changed field is logged in EXPT_JOB_TRACKING_LOG.
    -- TRACKING_STATUS and SHIPMENT_CATEGORY are never touched. Jobs that are not in EXPT_MASTER are skipped.
    -- @FIELDS = number of tracking fields that changed.
    SET NOCOUNT ON;
    SET @FIELDS = 0;
    IF OBJECT_ID('tempdb..#SHEET_MIRROR') IS NULL RETURN;

    DELETE M FROM #SHEET_MIRROR M WHERE NOT EXISTS (SELECT 1 FROM dbo.EXPT_MASTER E WHERE E.EXPTNO = M.EXPTNO);
    IF NOT EXISTS (SELECT 1 FROM #SHEET_MIRROR) RETURN;

    -- current values (a job without a tracking row has none)
    UPDATE M SET OLD_V = CASE M.F
                        WHEN 'VEHICLE_MODEL' THEN CONVERT(VARCHAR(500), T.VEHICLE_MODEL)
                        WHEN 'STUFFING_DT' THEN CONVERT(VARCHAR(10), T.STUFFING_DT, 103)
                        WHEN 'DO_ETD' THEN CONVERT(VARCHAR(10), T.DO_ETD, 103)
                        WHEN 'DO_RECEIVE_DT' THEN CONVERT(VARCHAR(10), T.DO_RECEIVE_DT, 103)
                        WHEN 'TRANSPORTER' THEN CONVERT(VARCHAR(500), T.TRANSPORTER)
                        WHEN 'CARGO_TYPE' THEN CONVERT(VARCHAR(500), T.CARGO_TYPE)
                        WHEN 'PLANT' THEN CONVERT(VARCHAR(500), T.PLANT)
                        WHEN 'LC_NO' THEN CONVERT(VARCHAR(500), T.LC_NO)
                        WHEN 'LC_DATE' THEN CONVERT(VARCHAR(10), T.LC_DATE, 103)
                        WHEN 'HAZ' THEN CONVERT(VARCHAR(500), T.HAZ)
                        WHEN 'REMARK1' THEN CONVERT(VARCHAR(500), T.REMARK1)
                        WHEN 'DO_GIVEN_DT' THEN CONVERT(VARCHAR(10), T.DO_GIVEN_DT, 103)
                        WHEN 'POL_GATE' THEN CONVERT(VARCHAR(500), T.POL_GATE)
                        WHEN 'GATE_OPEN_DT' THEN CONVERT(VARCHAR(10), T.GATE_OPEN_DT, 103)
                        WHEN 'GATE_CUTOFF_DT' THEN CONVERT(VARCHAR(10), T.GATE_CUTOFF_DT, 103)
                        WHEN 'SI_CUTOFF_DT' THEN CONVERT(VARCHAR(10), T.SI_CUTOFF_DT, 103)
                        WHEN 'VGM_SUBMITTED_DT' THEN CONVERT(VARCHAR(10), T.VGM_SUBMITTED_DT, 103)
                        WHEN 'SI_SUBMITTED_DT' THEN CONVERT(VARCHAR(10), T.SI_SUBMITTED_DT, 103)
                        WHEN 'BL_HANDOVER_DT' THEN CONVERT(VARCHAR(10), T.BL_HANDOVER_DT, 103)
                        WHEN 'SLINE_PAYMENT_STATUS' THEN CONVERT(VARCHAR(500), T.SLINE_PAYMENT_STATUS)
                        WHEN 'CLEARANCE_POINT' THEN CONVERT(VARCHAR(500), T.CLEARANCE_POINT)
                        WHEN 'OPEN_ORDER' THEN CONVERT(VARCHAR(500), T.OPEN_ORDER)
                        WHEN 'BUFFER_YARD' THEN CONVERT(VARCHAR(500), T.BUFFER_YARD)
                        WHEN 'PICKUP_DT' THEN CONVERT(VARCHAR(10), T.PICKUP_DT, 103)
                        WHEN 'CNTR_DISPATCH_DT' THEN CONVERT(VARCHAR(10), T.CNTR_DISPATCH_DT, 103)
                        WHEN 'CNTR_REPORT_NS_DT' THEN CONVERT(VARCHAR(10), T.CNTR_REPORT_NS_DT, 103)
                        WHEN 'CNTR_GATEDIN_DT' THEN CONVERT(VARCHAR(10), T.CNTR_GATEDIN_DT, 103)
                    END
    FROM   #SHEET_MIRROR M JOIN dbo.EXPT_JOB_TRACKING T ON T.EXPTNO = M.EXPTNO;

    -- only the fields whose value really changes
    DELETE FROM #SHEET_MIRROR
    WHERE  ISNULL(OLD_V, '') COLLATE Latin1_General_BIN2 = ISNULL(TV, '') COLLATE Latin1_General_BIN2
      AND  DATALENGTH(ISNULL(OLD_V, '')) = DATALENGTH(ISNULL(TV, ''));
    IF NOT EXISTS (SELECT 1 FROM #SHEET_MIRROR) RETURN;

    -- the tracking row, when the job has none yet
    INSERT INTO dbo.EXPT_JOB_TRACKING (EXPTNO, MAKER_ID, MAKER_IP)
    SELECT DISTINCT M.EXPTNO, @USER_ID, 'EXPORT SHEET VIEW'
    FROM   #SHEET_MIRROR M
    WHERE  NOT EXISTS (SELECT 1 FROM dbo.EXPT_JOB_TRACKING T WHERE T.EXPTNO = M.EXPTNO);

    UPDATE T
    SET    VEHICLE_MODEL = CASE WHEN P.H_VEHICLE_MODEL = 1 THEN CONVERT(VARCHAR(100), P.V_VEHICLE_MODEL) ELSE T.VEHICLE_MODEL END,
           STUFFING_DT = CASE WHEN P.H_STUFFING_DT = 1 THEN CONVERT(DATETIME, P.V_STUFFING_DT, 103) ELSE T.STUFFING_DT END,
           DO_ETD = CASE WHEN P.H_DO_ETD = 1 THEN CONVERT(DATETIME, P.V_DO_ETD, 103) ELSE T.DO_ETD END,
           DO_RECEIVE_DT = CASE WHEN P.H_DO_RECEIVE_DT = 1 THEN CONVERT(DATETIME, P.V_DO_RECEIVE_DT, 103) ELSE T.DO_RECEIVE_DT END,
           TRANSPORTER = CASE WHEN P.H_TRANSPORTER = 1 THEN CONVERT(VARCHAR(100), P.V_TRANSPORTER) ELSE T.TRANSPORTER END,
           CARGO_TYPE = CASE WHEN P.H_CARGO_TYPE = 1 THEN CONVERT(VARCHAR(10), P.V_CARGO_TYPE) ELSE T.CARGO_TYPE END,
           PLANT = CASE WHEN P.H_PLANT = 1 THEN CONVERT(VARCHAR(50), P.V_PLANT) ELSE T.PLANT END,
           LC_NO = CASE WHEN P.H_LC_NO = 1 THEN CONVERT(VARCHAR(50), P.V_LC_NO) ELSE T.LC_NO END,
           LC_DATE = CASE WHEN P.H_LC_DATE = 1 THEN CONVERT(DATETIME, P.V_LC_DATE, 103) ELSE T.LC_DATE END,
           HAZ = CASE WHEN P.H_HAZ = 1 THEN CONVERT(CHAR(1), P.V_HAZ) ELSE T.HAZ END,
           REMARK1 = CASE WHEN P.H_REMARK1 = 1 THEN CONVERT(VARCHAR(500), P.V_REMARK1) ELSE T.REMARK1 END,
           DO_GIVEN_DT = CASE WHEN P.H_DO_GIVEN_DT = 1 THEN CONVERT(DATETIME, P.V_DO_GIVEN_DT, 103) ELSE T.DO_GIVEN_DT END,
           POL_GATE = CASE WHEN P.H_POL_GATE = 1 THEN CONVERT(VARCHAR(50), P.V_POL_GATE) ELSE T.POL_GATE END,
           GATE_OPEN_DT = CASE WHEN P.H_GATE_OPEN_DT = 1 THEN CONVERT(DATETIME, P.V_GATE_OPEN_DT, 103) ELSE T.GATE_OPEN_DT END,
           GATE_CUTOFF_DT = CASE WHEN P.H_GATE_CUTOFF_DT = 1 THEN CONVERT(DATETIME, P.V_GATE_CUTOFF_DT, 103) ELSE T.GATE_CUTOFF_DT END,
           SI_CUTOFF_DT = CASE WHEN P.H_SI_CUTOFF_DT = 1 THEN CONVERT(DATETIME, P.V_SI_CUTOFF_DT, 103) ELSE T.SI_CUTOFF_DT END,
           VGM_SUBMITTED_DT = CASE WHEN P.H_VGM_SUBMITTED_DT = 1 THEN CONVERT(DATETIME, P.V_VGM_SUBMITTED_DT, 103) ELSE T.VGM_SUBMITTED_DT END,
           SI_SUBMITTED_DT = CASE WHEN P.H_SI_SUBMITTED_DT = 1 THEN CONVERT(DATETIME, P.V_SI_SUBMITTED_DT, 103) ELSE T.SI_SUBMITTED_DT END,
           BL_HANDOVER_DT = CASE WHEN P.H_BL_HANDOVER_DT = 1 THEN CONVERT(DATETIME, P.V_BL_HANDOVER_DT, 103) ELSE T.BL_HANDOVER_DT END,
           SLINE_PAYMENT_STATUS = CASE WHEN P.H_SLINE_PAYMENT_STATUS = 1 THEN CONVERT(VARCHAR(100), P.V_SLINE_PAYMENT_STATUS) ELSE T.SLINE_PAYMENT_STATUS END,
           CLEARANCE_POINT = CASE WHEN P.H_CLEARANCE_POINT = 1 THEN CONVERT(VARCHAR(50), P.V_CLEARANCE_POINT) ELSE T.CLEARANCE_POINT END,
           OPEN_ORDER = CASE WHEN P.H_OPEN_ORDER = 1 THEN CONVERT(VARCHAR(50), P.V_OPEN_ORDER) ELSE T.OPEN_ORDER END,
           BUFFER_YARD = CASE WHEN P.H_BUFFER_YARD = 1 THEN CONVERT(VARCHAR(50), P.V_BUFFER_YARD) ELSE T.BUFFER_YARD END,
           PICKUP_DT = CASE WHEN P.H_PICKUP_DT = 1 THEN CONVERT(DATETIME, P.V_PICKUP_DT, 103) ELSE T.PICKUP_DT END,
           CNTR_DISPATCH_DT = CASE WHEN P.H_CNTR_DISPATCH_DT = 1 THEN CONVERT(DATETIME, P.V_CNTR_DISPATCH_DT, 103) ELSE T.CNTR_DISPATCH_DT END,
           CNTR_REPORT_NS_DT = CASE WHEN P.H_CNTR_REPORT_NS_DT = 1 THEN CONVERT(DATETIME, P.V_CNTR_REPORT_NS_DT, 103) ELSE T.CNTR_REPORT_NS_DT END,
           CNTR_GATEDIN_DT = CASE WHEN P.H_CNTR_GATEDIN_DT = 1 THEN CONVERT(DATETIME, P.V_CNTR_GATEDIN_DT, 103) ELSE T.CNTR_GATEDIN_DT END,
           MODIFY_ID = @USER_ID,
           MODIFY_DT = GETDATE()
    FROM   dbo.EXPT_JOB_TRACKING T
           JOIN (SELECT EXPTNO,
                        MAX(CASE WHEN F = 'VEHICLE_MODEL' THEN 1 ELSE 0 END) AS H_VEHICLE_MODEL, MAX(CASE WHEN F = 'VEHICLE_MODEL' THEN TV END) AS V_VEHICLE_MODEL,
                        MAX(CASE WHEN F = 'STUFFING_DT' THEN 1 ELSE 0 END) AS H_STUFFING_DT, MAX(CASE WHEN F = 'STUFFING_DT' THEN TV END) AS V_STUFFING_DT,
                        MAX(CASE WHEN F = 'DO_ETD' THEN 1 ELSE 0 END) AS H_DO_ETD, MAX(CASE WHEN F = 'DO_ETD' THEN TV END) AS V_DO_ETD,
                        MAX(CASE WHEN F = 'DO_RECEIVE_DT' THEN 1 ELSE 0 END) AS H_DO_RECEIVE_DT, MAX(CASE WHEN F = 'DO_RECEIVE_DT' THEN TV END) AS V_DO_RECEIVE_DT,
                        MAX(CASE WHEN F = 'TRANSPORTER' THEN 1 ELSE 0 END) AS H_TRANSPORTER, MAX(CASE WHEN F = 'TRANSPORTER' THEN TV END) AS V_TRANSPORTER,
                        MAX(CASE WHEN F = 'CARGO_TYPE' THEN 1 ELSE 0 END) AS H_CARGO_TYPE, MAX(CASE WHEN F = 'CARGO_TYPE' THEN TV END) AS V_CARGO_TYPE,
                        MAX(CASE WHEN F = 'PLANT' THEN 1 ELSE 0 END) AS H_PLANT, MAX(CASE WHEN F = 'PLANT' THEN TV END) AS V_PLANT,
                        MAX(CASE WHEN F = 'LC_NO' THEN 1 ELSE 0 END) AS H_LC_NO, MAX(CASE WHEN F = 'LC_NO' THEN TV END) AS V_LC_NO,
                        MAX(CASE WHEN F = 'LC_DATE' THEN 1 ELSE 0 END) AS H_LC_DATE, MAX(CASE WHEN F = 'LC_DATE' THEN TV END) AS V_LC_DATE,
                        MAX(CASE WHEN F = 'HAZ' THEN 1 ELSE 0 END) AS H_HAZ, MAX(CASE WHEN F = 'HAZ' THEN TV END) AS V_HAZ,
                        MAX(CASE WHEN F = 'REMARK1' THEN 1 ELSE 0 END) AS H_REMARK1, MAX(CASE WHEN F = 'REMARK1' THEN TV END) AS V_REMARK1,
                        MAX(CASE WHEN F = 'DO_GIVEN_DT' THEN 1 ELSE 0 END) AS H_DO_GIVEN_DT, MAX(CASE WHEN F = 'DO_GIVEN_DT' THEN TV END) AS V_DO_GIVEN_DT,
                        MAX(CASE WHEN F = 'POL_GATE' THEN 1 ELSE 0 END) AS H_POL_GATE, MAX(CASE WHEN F = 'POL_GATE' THEN TV END) AS V_POL_GATE,
                        MAX(CASE WHEN F = 'GATE_OPEN_DT' THEN 1 ELSE 0 END) AS H_GATE_OPEN_DT, MAX(CASE WHEN F = 'GATE_OPEN_DT' THEN TV END) AS V_GATE_OPEN_DT,
                        MAX(CASE WHEN F = 'GATE_CUTOFF_DT' THEN 1 ELSE 0 END) AS H_GATE_CUTOFF_DT, MAX(CASE WHEN F = 'GATE_CUTOFF_DT' THEN TV END) AS V_GATE_CUTOFF_DT,
                        MAX(CASE WHEN F = 'SI_CUTOFF_DT' THEN 1 ELSE 0 END) AS H_SI_CUTOFF_DT, MAX(CASE WHEN F = 'SI_CUTOFF_DT' THEN TV END) AS V_SI_CUTOFF_DT,
                        MAX(CASE WHEN F = 'VGM_SUBMITTED_DT' THEN 1 ELSE 0 END) AS H_VGM_SUBMITTED_DT, MAX(CASE WHEN F = 'VGM_SUBMITTED_DT' THEN TV END) AS V_VGM_SUBMITTED_DT,
                        MAX(CASE WHEN F = 'SI_SUBMITTED_DT' THEN 1 ELSE 0 END) AS H_SI_SUBMITTED_DT, MAX(CASE WHEN F = 'SI_SUBMITTED_DT' THEN TV END) AS V_SI_SUBMITTED_DT,
                        MAX(CASE WHEN F = 'BL_HANDOVER_DT' THEN 1 ELSE 0 END) AS H_BL_HANDOVER_DT, MAX(CASE WHEN F = 'BL_HANDOVER_DT' THEN TV END) AS V_BL_HANDOVER_DT,
                        MAX(CASE WHEN F = 'SLINE_PAYMENT_STATUS' THEN 1 ELSE 0 END) AS H_SLINE_PAYMENT_STATUS, MAX(CASE WHEN F = 'SLINE_PAYMENT_STATUS' THEN TV END) AS V_SLINE_PAYMENT_STATUS,
                        MAX(CASE WHEN F = 'CLEARANCE_POINT' THEN 1 ELSE 0 END) AS H_CLEARANCE_POINT, MAX(CASE WHEN F = 'CLEARANCE_POINT' THEN TV END) AS V_CLEARANCE_POINT,
                        MAX(CASE WHEN F = 'OPEN_ORDER' THEN 1 ELSE 0 END) AS H_OPEN_ORDER, MAX(CASE WHEN F = 'OPEN_ORDER' THEN TV END) AS V_OPEN_ORDER,
                        MAX(CASE WHEN F = 'BUFFER_YARD' THEN 1 ELSE 0 END) AS H_BUFFER_YARD, MAX(CASE WHEN F = 'BUFFER_YARD' THEN TV END) AS V_BUFFER_YARD,
                        MAX(CASE WHEN F = 'PICKUP_DT' THEN 1 ELSE 0 END) AS H_PICKUP_DT, MAX(CASE WHEN F = 'PICKUP_DT' THEN TV END) AS V_PICKUP_DT,
                        MAX(CASE WHEN F = 'CNTR_DISPATCH_DT' THEN 1 ELSE 0 END) AS H_CNTR_DISPATCH_DT, MAX(CASE WHEN F = 'CNTR_DISPATCH_DT' THEN TV END) AS V_CNTR_DISPATCH_DT,
                        MAX(CASE WHEN F = 'CNTR_REPORT_NS_DT' THEN 1 ELSE 0 END) AS H_CNTR_REPORT_NS_DT, MAX(CASE WHEN F = 'CNTR_REPORT_NS_DT' THEN TV END) AS V_CNTR_REPORT_NS_DT,
                        MAX(CASE WHEN F = 'CNTR_GATEDIN_DT' THEN 1 ELSE 0 END) AS H_CNTR_GATEDIN_DT, MAX(CASE WHEN F = 'CNTR_GATEDIN_DT' THEN TV END) AS V_CNTR_GATEDIN_DT
                 FROM   #SHEET_MIRROR GROUP BY EXPTNO) P ON P.EXPTNO = T.EXPTNO;

    UPDATE M SET NEW_V = CASE M.F
                        WHEN 'VEHICLE_MODEL' THEN CONVERT(VARCHAR(500), T.VEHICLE_MODEL)
                        WHEN 'STUFFING_DT' THEN CONVERT(VARCHAR(10), T.STUFFING_DT, 103)
                        WHEN 'DO_ETD' THEN CONVERT(VARCHAR(10), T.DO_ETD, 103)
                        WHEN 'DO_RECEIVE_DT' THEN CONVERT(VARCHAR(10), T.DO_RECEIVE_DT, 103)
                        WHEN 'TRANSPORTER' THEN CONVERT(VARCHAR(500), T.TRANSPORTER)
                        WHEN 'CARGO_TYPE' THEN CONVERT(VARCHAR(500), T.CARGO_TYPE)
                        WHEN 'PLANT' THEN CONVERT(VARCHAR(500), T.PLANT)
                        WHEN 'LC_NO' THEN CONVERT(VARCHAR(500), T.LC_NO)
                        WHEN 'LC_DATE' THEN CONVERT(VARCHAR(10), T.LC_DATE, 103)
                        WHEN 'HAZ' THEN CONVERT(VARCHAR(500), T.HAZ)
                        WHEN 'REMARK1' THEN CONVERT(VARCHAR(500), T.REMARK1)
                        WHEN 'DO_GIVEN_DT' THEN CONVERT(VARCHAR(10), T.DO_GIVEN_DT, 103)
                        WHEN 'POL_GATE' THEN CONVERT(VARCHAR(500), T.POL_GATE)
                        WHEN 'GATE_OPEN_DT' THEN CONVERT(VARCHAR(10), T.GATE_OPEN_DT, 103)
                        WHEN 'GATE_CUTOFF_DT' THEN CONVERT(VARCHAR(10), T.GATE_CUTOFF_DT, 103)
                        WHEN 'SI_CUTOFF_DT' THEN CONVERT(VARCHAR(10), T.SI_CUTOFF_DT, 103)
                        WHEN 'VGM_SUBMITTED_DT' THEN CONVERT(VARCHAR(10), T.VGM_SUBMITTED_DT, 103)
                        WHEN 'SI_SUBMITTED_DT' THEN CONVERT(VARCHAR(10), T.SI_SUBMITTED_DT, 103)
                        WHEN 'BL_HANDOVER_DT' THEN CONVERT(VARCHAR(10), T.BL_HANDOVER_DT, 103)
                        WHEN 'SLINE_PAYMENT_STATUS' THEN CONVERT(VARCHAR(500), T.SLINE_PAYMENT_STATUS)
                        WHEN 'CLEARANCE_POINT' THEN CONVERT(VARCHAR(500), T.CLEARANCE_POINT)
                        WHEN 'OPEN_ORDER' THEN CONVERT(VARCHAR(500), T.OPEN_ORDER)
                        WHEN 'BUFFER_YARD' THEN CONVERT(VARCHAR(500), T.BUFFER_YARD)
                        WHEN 'PICKUP_DT' THEN CONVERT(VARCHAR(10), T.PICKUP_DT, 103)
                        WHEN 'CNTR_DISPATCH_DT' THEN CONVERT(VARCHAR(10), T.CNTR_DISPATCH_DT, 103)
                        WHEN 'CNTR_REPORT_NS_DT' THEN CONVERT(VARCHAR(10), T.CNTR_REPORT_NS_DT, 103)
                        WHEN 'CNTR_GATEDIN_DT' THEN CONVERT(VARCHAR(10), T.CNTR_GATEDIN_DT, 103)
                    END
    FROM   #SHEET_MIRROR M JOIN dbo.EXPT_JOB_TRACKING T ON T.EXPTNO = M.EXPTNO;

    INSERT INTO dbo.EXPT_JOB_TRACKING_LOG (EXPTNO, FIELD_NAME, OLD_VALUE, NEW_VALUE, CHANGED_BY, CHANGED_IP)
    SELECT M.EXPTNO, M.F, M.OLD_V, M.NEW_V, @USER_ID, 'EXPORT SHEET VIEW'
    FROM   #SHEET_MIRROR M
    WHERE  NOT (ISNULL(M.OLD_V, '') COLLATE Latin1_General_BIN2 = ISNULL(M.NEW_V, '') COLLATE Latin1_General_BIN2
                AND DATALENGTH(ISNULL(M.OLD_V, '')) = DATALENGTH(ISNULL(M.NEW_V, '')));
    SET @FIELDS = @@ROWCOUNT;
END
GO

/* ---- dbo.USP_EXPT_SHEET_SAVE_APPLY ------------------------------------------------------------- */
IF OBJECT_ID('dbo.USP_EXPT_SHEET_SAVE_APPLY', 'P') IS NOT NULL
    DROP PROCEDURE dbo.USP_EXPT_SHEET_SAVE_APPLY;      -- step 1 made sure it is this script's own
GO
CREATE PROCEDURE dbo.USP_EXPT_SHEET_SAVE_APPLY
    @MONTH_ID  INT,
    @TAB_CODE  VARCHAR(20),
    @EDITS     NVARCHAR(MAX),
    @ACTION    VARCHAR(20),
    @USER_ID   VARCHAR(50),
    @USER_NAME NVARCHAR(100)
AS
BEGIN
    -- Deployed by links-22/_DB_FIX/EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql (Export > Sheet view). Do not edit here: change that script.
    -- Internal. The body of SAVE_CELLS (@ACTION 'edit') and RESTORE_VALUE (@ACTION 'restore'). Per edit, in this order:
    --   'invalid'  row id / version not a positive number, or the key is not one of the 52 registry columns
    --   'too long' over 500 characters (2000 for VEH, REMARK1, CONTAINER_NO); nothing is ever cut
    --   'notfound' the row is not in this month + tab, or is deleted
    --   'conflict' v (the version the client had) is not the row's current ROWVER - the row changed meanwhile
    --   'owner'    hard lock: the caller holds neither ADMIN nor a role that owns the column (ALL-owned columns: anyone;
    --              a Links SA user counts as ADMIN)
    --   'locked'   FF_JOB of a linked row (change the link through LINK / UNLINK), or a Links-owned column of a linked row
    --              whose job has a non-empty Links value
    -- Date columns: a real date (dd-mm-yyyy, dd/mm/yyyy, dd.mm.yyyy or yyyy-mm-dd) is stored as dd-mm-yyyy, anything else
    -- exactly as typed. Unchanged values are skipped (no version bump, no log). Every changed cell is one TBL_EXPT_SHEET_LOG
    -- row. Changed T columns of linked rows go to EXPT_JOB_TRACKING (USP_EXPT_SHEET_TRACK_MIRROR): a cleared cell clears the
    -- field, a date column takes only real dates (a note or range leaves the tracking date as it is), HAZ takes YES / HAZ / Y -> Y
    -- and NO / N -> N; when two rows of one job change the same field in one batch, the later edit wins.
    -- Results: Table STATUS (100 all saved; else 102 conflict > 104 owner / locked > 103 notfound > 101 invalid / too long / error),
    -- STATUSTEXT, APPLIED, REJECTED, ROWS_SAVED, TRACKING_FIELDS; Table1 the refused edits (ID, KEY, REASON);
    -- Table2 + Table3 every row named in the batch that is in this month + tab, in the LOAD shape (rows, Links values) - so a
    -- conflict prompt can show the other user's values.
    SET NOCOUNT ON;
    SET ARITHABORT ON;
    SET DATEFORMAT dmy;      -- ISDATE() on dd-mm-yyyy
    DECLARE @STATUS VARCHAR(3), @STATUSTEXT NVARCHAR(1000), @NOW DATETIME, @X XML, @TC INT, @IS_ADMIN BIT,
            @APPLIED INT, @REJECTED INT, @ROWS INT, @FIELDS INT, @PARSED BIT;
    SELECT @STATUS = '100', @STATUSTEXT = N'', @NOW = GETDATE(), @APPLIED = 0, @REJECTED = 0, @ROWS = 0, @FIELDS = 0, @PARSED = 0;
    SELECT @TAB_CODE = UPPER(LTRIM(RTRIM(ISNULL(@TAB_CODE, '')))), @USER_ID = LTRIM(RTRIM(ISNULL(@USER_ID, ''))),
           @ACTION = CASE WHEN @ACTION = 'restore' THEN 'restore' ELSE 'edit' END;
    DECLARE @REG TABLE (K VARCHAR(40) NOT NULL PRIMARY KEY, KIND VARCHAR(10) NOT NULL, IS_L BIT NOT NULL, TCOL VARCHAR(40) NULL,
                        TKIND CHAR(1) NULL, TLEN INT NULL, MAXLEN INT NOT NULL, OWNER VARCHAR(20) NOT NULL, SEQ INT NOT NULL);
    INSERT INTO @REG (K, KIND, IS_L, TCOL, TKIND, TLEN, MAXLEN, OWNER, SEQ) VALUES
        ('WO', 'text', 1, NULL, NULL, NULL, 500, 'OPS', 1),
        ('PORT', 'choice', 1, NULL, NULL, NULL, 500, 'OPS', 2),
        ('COUNTRY', 'choice', 1, NULL, NULL, NULL, 500, 'OPS', 3),
        ('VEH', 'ml', 0, 'VEHICLE_MODEL', 't', 100, 2000, 'OPS', 4),
        ('QTY', 'num', 1, NULL, NULL, NULL, 500, 'OPS', 5),
        ('CONT', 'num', 1, NULL, NULL, NULL, 500, 'OPS', 6),
        ('CNTR_TYPE', 'choice', 1, NULL, NULL, NULL, 500, 'OPS', 7),
        ('STUFFING_DT', 'date', 0, 'STUFFING_DT', 'd', NULL, 500, 'OPS', 8),
        ('VSL_NAME', 'choice', 1, NULL, NULL, NULL, 500, 'BOOKING', 9),
        ('DO_ETD', 'date', 0, 'DO_ETD', 'd', NULL, 500, 'OPS', 10),
        ('SLINE', 'choice', 1, NULL, NULL, NULL, 500, 'BOOKING', 11),
        ('AGENT', 'choice', 0, NULL, NULL, NULL, 500, 'OPS', 12),
        ('DO_RECEIVE_DT', 'date', 0, 'DO_RECEIVE_DT', 'd', NULL, 500, 'OPS', 13),
        ('BOOKING_NO', 'text', 1, NULL, NULL, NULL, 500, 'OPS', 14),
        ('TRANSPORTER', 'choice', 0, 'TRANSPORTER', 't', 100, 500, 'OPS', 15),
        ('CARGO_TYPE', 'choice', 0, 'CARGO_TYPE', 't', 10, 500, 'OPS', 16),
        ('PLANT', 'choice', 0, 'PLANT', 't', 50, 500, 'OPS', 17),
        ('PO_NO', 'text', 1, NULL, NULL, NULL, 500, 'OPS', 18),
        ('LC_NO', 'text', 0, 'LC_NO', 't', 50, 500, 'OPS', 19),
        ('LC_DATE', 'date', 0, 'LC_DATE', 'd', NULL, 500, 'OPS', 20),
        ('HAZ', 'choice', 0, 'HAZ', 'h', 1, 500, 'OPS', 21),
        ('CONSIGNEE', 'choice', 1, NULL, NULL, NULL, 500, 'OPS', 22),
        ('REMARK1', 'ml', 0, 'REMARK1', 't', 500, 2000, 'ALL', 23),
        ('DO_GIVEN_DT', 'date', 0, 'DO_GIVEN_DT', 'd', NULL, 500, 'OPS', 24),
        ('CONTAINER_NO', 'ml', 1, NULL, NULL, NULL, 2000, 'OPSLEAD', 25),
        ('POL_GATE', 'choice', 0, 'POL_GATE', 't', 50, 500, 'OPS', 26),
        ('GATE_OPEN_DT', 'date', 0, 'GATE_OPEN_DT', 'd', NULL, 500, 'OPS', 27),
        ('GATE_CUTOFF_DT', 'date', 0, 'GATE_CUTOFF_DT', 'd', NULL, 500, 'OPS', 28),
        ('SI_CUTOFF_DT', 'date', 0, 'SI_CUTOFF_DT', 'd', NULL, 500, 'OPS', 29),
        ('DO_ETD2', 'date', 0, NULL, NULL, NULL, 500, 'OPS', 30),
        ('CURRENT_ETD', 'date', 1, NULL, NULL, NULL, 500, 'OPS', 31),
        ('ETA_DEST', 'date', 1, NULL, NULL, NULL, 500, 'OPS', 32),
        ('FINAL_VSL_SOB', 'date', 1, NULL, NULL, NULL, 500, 'OPS', 33),
        ('VGM_SUBMITTED_DT', 'date', 0, 'VGM_SUBMITTED_DT', 'd', NULL, 500, 'DOCS', 34),
        ('SI_SUBMITTED_DT', 'date', 0, 'SI_SUBMITTED_DT', 'd', NULL, 500, 'DOCS', 35),
        ('BL_NO', 'text', 1, NULL, NULL, NULL, 500, 'BLDESK', 36),
        ('BL_DT', 'date', 1, NULL, NULL, NULL, 500, 'OPS', 37),
        ('BL_HANDOVER_DT', 'date', 0, 'BL_HANDOVER_DT', 'd', NULL, 500, 'BLDESK', 38),
        ('FF_JOB', 'text', 0, NULL, NULL, NULL, 500, 'BLDESK', 39),
        ('SLINE_PAYMENT_STATUS', 'text', 0, 'SLINE_PAYMENT_STATUS', 't', 100, 500, 'OPS', 40),
        ('CLEARANCE_POINT', 'choice', 0, 'CLEARANCE_POINT', 't', 50, 500, 'OPSLEAD', 41),
        ('OPEN_ORDER', 'choice', 0, 'OPEN_ORDER', 't', 50, 500, 'OPSLEAD', 42),
        ('BUFFER_YARD', 'text', 0, 'BUFFER_YARD', 't', 50, 500, 'OPSLEAD', 43),
        ('EDOC_STATUS', 'text', 1, NULL, NULL, NULL, 500, 'DOCS', 44),
        ('COURIER_DT', 'date', 1, NULL, NULL, NULL, 500, 'DOCS', 45),
        ('PICKUP_DT', 'date', 0, 'PICKUP_DT', 'd', NULL, 500, 'YARD', 46),
        ('CNTR_DISPATCH_DT', 'date', 0, 'CNTR_DISPATCH_DT', 'd', NULL, 500, 'OPS', 47),
        ('CNTR_REPORT_NS_DT', 'date', 0, 'CNTR_REPORT_NS_DT', 'd', NULL, 500, 'YARD', 48),
        ('CNTR_GATEDIN_DT', 'date', 0, 'CNTR_GATEDIN_DT', 'd', NULL, 500, 'YARD', 49),
        ('SB_NO', 'text', 1, NULL, NULL, NULL, 500, 'OPSLEAD', 50),
        ('SB_DT', 'date', 1, NULL, NULL, NULL, 500, 'OPSLEAD', 51),
        ('FOR_HBL', 'text', 1, NULL, NULL, NULL, 500, 'OPS', 52);
    CREATE TABLE #SHEET_IDS (ID INT NOT NULL PRIMARY KEY);
    CREATE TABLE #SHEET_LK (EXPTNO VARCHAR(25) NOT NULL PRIMARY KEY, FILLED BIT NOT NULL DEFAULT 0, JOB_FOUND BIT NOT NULL DEFAULT 0,
                            JOB_CANCELLED BIT NOT NULL DEFAULT 0,
                            L_WO NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_PORT NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_COUNTRY NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_QTY NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_CONT NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_CNTR_TYPE NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_VSL_NAME NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_SLINE NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_BOOKING_NO NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_PO_NO NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_CONSIGNEE NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_CONTAINER_NO NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_CURRENT_ETD NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_ETA_DEST NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_FINAL_VSL_SOB NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_BL_NO NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_BL_DT NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_EDOC_STATUS NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_COURIER_DT NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_SB_NO NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_SB_DT NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_FOR_HBL NVARCHAR(4000) NOT NULL DEFAULT N'');
    CREATE TABLE #SHEET_MIRROR (EXPTNO VARCHAR(25) NOT NULL, F VARCHAR(40) NOT NULL, TV VARCHAR(500) NULL,
                                OLD_V VARCHAR(500) NULL, NEW_V VARCHAR(500) NULL, PRIMARY KEY (EXPTNO, F));
    CREATE TABLE #SA_E (SEQ INT IDENTITY(1,1) NOT NULL PRIMARY KEY, R_TXT VARCHAR(50) NULL, V_TXT VARCHAR(50) NULL, ROW_ID INT NULL,
                        VER INT NULL, K VARCHAR(100) NOT NULL, V NVARCHAR(MAX) NOT NULL, NV NVARCHAR(2000) NULL, OV NVARCHAR(2000) NULL,
                        REASON VARCHAR(20) NULL, CHANGED BIT NOT NULL DEFAULT 0, EXPTNO VARCHAR(25) NULL);

    IF @USER_ID = ''
        SELECT @STATUS = '101', @STATUSTEXT = N'USER_ID is required.';
    ELSE IF NOT EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_MONTH WHERE ID = @MONTH_ID)
        SELECT @STATUS = '103', @STATUSTEXT = N'Month not found.';
    ELSE IF @TAB_CODE = ''
        SELECT @STATUS = '101', @STATUSTEXT = N'TAB_CODE is required.';

    -- 1. the edits: rootless <e r="ID" v="ROWVER" k="KEY">value</e>..., parsed keeping white space
    --    (XACT_ABORT OFF here, so a malformed batch cannot doom a caller's transaction)
    IF @STATUS = '100'
    BEGIN
        SET XACT_ABORT OFF;
        BEGIN TRY
            SET @X = CONVERT(XML, @EDITS, 1);
            INSERT INTO #SA_E (R_TXT, V_TXT, K, V)
            SELECT LTRIM(RTRIM(T.c.value('@r', 'VARCHAR(50)'))), LTRIM(RTRIM(T.c.value('@v', 'VARCHAR(50)'))),
                   UPPER(LTRIM(RTRIM(ISNULL(T.c.value('@k', 'VARCHAR(100)'), '')))),
                   ISNULL(T.c.value('(./text())[1]', 'NVARCHAR(MAX)'), N'')
            FROM   @X.nodes('/e') T(c);
            SET @PARSED = 1;
        END TRY
        BEGIN CATCH
            SELECT @STATUS = '101', @STATUSTEXT = N'The edits are not valid XML: ' + ERROR_MESSAGE();
            IF XACT_STATE() = -1
            BEGIN
                ROLLBACK TRANSACTION;
                RAISERROR(N'The edits are not valid XML (the caller''s transaction was rolled back).', 16, 1);
            END
        END CATCH
        IF @@TRANCOUNT = 0 SET XACT_ABORT ON ELSE SET XACT_ABORT OFF;
        IF @STATUS = '100' AND NOT EXISTS (SELECT 1 FROM #SA_E)
            SELECT @STATUS = '101', @STATUSTEXT = N'No edits (expected <e r="ID" v="ROWVER" k="KEY">value</e>).';
    END

    IF @STATUS = '100'
    BEGIN
        -- 2. checks that need no lock
        UPDATE #SA_E SET REASON = 'invalid'
        WHERE  ISNULL(R_TXT, '') = '' OR R_TXT LIKE '%[^0-9]%' OR LEN(R_TXT) > 9
           OR  ISNULL(V_TXT, '') = '' OR V_TXT LIKE '%[^0-9]%' OR LEN(V_TXT) > 9;
        UPDATE #SA_E SET ROW_ID = CASE WHEN REASON IS NULL THEN CONVERT(INT, R_TXT) END,
                         VER    = CASE WHEN REASON IS NULL THEN CONVERT(INT, V_TXT) END;
        UPDATE E SET REASON = 'invalid' FROM #SA_E E
        WHERE  E.REASON IS NULL AND NOT EXISTS (SELECT 1 FROM @REG G WHERE G.K = E.K);
        UPDATE E SET REASON = 'too long' FROM #SA_E E JOIN @REG G ON G.K = E.K
        WHERE  E.REASON IS NULL AND LEN(E.V + N'x') - 1 > G.MAXLEN;
        -- the same cell twice in one batch: the last edit wins
        DELETE E FROM #SA_E E
        WHERE  E.REASON IS NULL
          AND  EXISTS (SELECT 1 FROM #SA_E E2 WHERE E2.REASON IS NULL AND E2.ROW_ID = E.ROW_ID AND E2.K = E.K AND E2.SEQ > E.SEQ);
        -- new value: dates normalised, everything else as typed ('' = empty)
        UPDATE E SET NV = CASE WHEN G.KIND = 'date' THEN CASE WHEN Z.S LIKE '[0-3][0-9][-/.][01][0-9][-/.][12][0-9][0-9][0-9]' AND SUBSTRING(Z.S, 3, 1) = SUBSTRING(Z.S, 6, 1)
                          AND ISDATE(LEFT(Z.S, 2) + '-' + SUBSTRING(Z.S, 4, 2) + '-' + RIGHT(Z.S, 4)) = 1
                         THEN LEFT(Z.S, 2) + N'-' + SUBSTRING(Z.S, 4, 2) + N'-' + RIGHT(Z.S, 4)
                     WHEN Z.S LIKE '[12][0-9][0-9][0-9]-[01][0-9]-[0-3][0-9]'
                          AND ISDATE(RIGHT(Z.S, 2) + '-' + SUBSTRING(Z.S, 6, 2) + '-' + LEFT(Z.S, 4)) = 1
                         THEN RIGHT(Z.S, 2) + N'-' + SUBSTRING(Z.S, 6, 2) + N'-' + LEFT(Z.S, 4)
                     ELSE E.V END ELSE E.V END
        FROM   #SA_E E JOIN @REG G ON G.K = E.K
               CROSS APPLY (SELECT LTRIM(RTRIM(E.V)) AS S) Z
        WHERE  E.REASON IS NULL;
        UPDATE #SA_E SET NV = NULL WHERE REASON IS NULL AND NV = N'';

    -- the caller's roles. TBL_EXPT_SHEET_ROLE_USER holds Links user ids; the CMPID (e.g. 37) and the user code
    -- (cmp_dtls.cmp_usercode, e.g. P100037) of the same user both count, whichever one the settings screen stored.
    -- A Links SA user (cmp_dtls.RoleType = 'SA', the login's ROLETYPE) counts as ADMIN, as SA skips form rights.
    DECLARE @ME TABLE (UID VARCHAR(50) NOT NULL PRIMARY KEY);
    DECLARE @MYROLES TABLE (ROLE_CODE VARCHAR(20) NOT NULL PRIMARY KEY, IMPLICIT BIT NOT NULL DEFAULT 0);
    IF @USER_ID <> '' INSERT INTO @ME (UID) VALUES (@USER_ID);
    INSERT INTO @ME (UID)
    SELECT X.UID
    FROM (SELECT LTRIM(RTRIM(C.cmp_usercode)) AS UID FROM dbo.cmp_dtls C WHERE CONVERT(VARCHAR(50), C.cmpid) = @USER_ID
          UNION
          SELECT CONVERT(VARCHAR(50), C.cmpid) FROM dbo.cmp_dtls C WHERE LTRIM(RTRIM(C.cmp_usercode)) = @USER_ID) X
    WHERE ISNULL(X.UID, '') <> '' AND NOT EXISTS (SELECT 1 FROM @ME M WHERE M.UID = X.UID);
    INSERT INTO @MYROLES (ROLE_CODE)
    SELECT DISTINCT RU.ROLE_CODE FROM dbo.TBL_EXPT_SHEET_ROLE_USER RU JOIN @ME M ON M.UID = RU.USER_ID;
    IF NOT EXISTS (SELECT 1 FROM @MYROLES WHERE ROLE_CODE = 'ADMIN')
       AND EXISTS (SELECT 1 FROM dbo.cmp_dtls C
                   WHERE (CONVERT(VARCHAR(50), C.cmpid) = @USER_ID OR LTRIM(RTRIM(C.cmp_usercode)) = @USER_ID)
                     AND LTRIM(RTRIM(ISNULL(C.RoleType, ''))) = 'SA')
        INSERT INTO @MYROLES (ROLE_CODE, IMPLICIT) VALUES ('ADMIN', 1);
    SET @IS_ADMIN = CASE WHEN EXISTS (SELECT 1 FROM @MYROLES WHERE ROLE_CODE = 'ADMIN') THEN 1 ELSE 0 END;

        SET @TC = @@TRANCOUNT;
        BEGIN TRY
        IF @TC = 0 BEGIN BEGIN TRANSACTION; END ELSE BEGIN SAVE TRANSACTION EXPT_SHEET_SAVE; END

            -- 3. the rows, locked until the end: month / tab / deleted / version; old value and link
            UPDATE E
            SET    REASON = CASE WHEN R.ID IS NULL OR R.MONTH_ID <> @MONTH_ID OR R.TAB_CODE <> @TAB_CODE OR R.ISDELETED = 1 THEN 'notfound'
                                 WHEN E.VER <> R.ROWVER THEN 'conflict' END,
                   EXPTNO = R.EXPTNO,
                   OV     = CASE E.K
                        WHEN 'WO' THEN R.WO
                        WHEN 'PORT' THEN R.PORT
                        WHEN 'COUNTRY' THEN R.COUNTRY
                        WHEN 'VEH' THEN R.VEH
                        WHEN 'QTY' THEN R.QTY
                        WHEN 'CONT' THEN R.CONT
                        WHEN 'CNTR_TYPE' THEN R.CNTR_TYPE
                        WHEN 'STUFFING_DT' THEN R.STUFFING_DT
                        WHEN 'VSL_NAME' THEN R.VSL_NAME
                        WHEN 'DO_ETD' THEN R.DO_ETD
                        WHEN 'SLINE' THEN R.SLINE
                        WHEN 'AGENT' THEN R.AGENT
                        WHEN 'DO_RECEIVE_DT' THEN R.DO_RECEIVE_DT
                        WHEN 'BOOKING_NO' THEN R.BOOKING_NO
                        WHEN 'TRANSPORTER' THEN R.TRANSPORTER
                        WHEN 'CARGO_TYPE' THEN R.CARGO_TYPE
                        WHEN 'PLANT' THEN R.PLANT
                        WHEN 'PO_NO' THEN R.PO_NO
                        WHEN 'LC_NO' THEN R.LC_NO
                        WHEN 'LC_DATE' THEN R.LC_DATE
                        WHEN 'HAZ' THEN R.HAZ
                        WHEN 'CONSIGNEE' THEN R.CONSIGNEE
                        WHEN 'REMARK1' THEN R.REMARK1
                        WHEN 'DO_GIVEN_DT' THEN R.DO_GIVEN_DT
                        WHEN 'CONTAINER_NO' THEN R.CONTAINER_NO
                        WHEN 'POL_GATE' THEN R.POL_GATE
                        WHEN 'GATE_OPEN_DT' THEN R.GATE_OPEN_DT
                        WHEN 'GATE_CUTOFF_DT' THEN R.GATE_CUTOFF_DT
                        WHEN 'SI_CUTOFF_DT' THEN R.SI_CUTOFF_DT
                        WHEN 'DO_ETD2' THEN R.DO_ETD2
                        WHEN 'CURRENT_ETD' THEN R.CURRENT_ETD
                        WHEN 'ETA_DEST' THEN R.ETA_DEST
                        WHEN 'FINAL_VSL_SOB' THEN R.FINAL_VSL_SOB
                        WHEN 'VGM_SUBMITTED_DT' THEN R.VGM_SUBMITTED_DT
                        WHEN 'SI_SUBMITTED_DT' THEN R.SI_SUBMITTED_DT
                        WHEN 'BL_NO' THEN R.BL_NO
                        WHEN 'BL_DT' THEN R.BL_DT
                        WHEN 'BL_HANDOVER_DT' THEN R.BL_HANDOVER_DT
                        WHEN 'FF_JOB' THEN R.FF_JOB
                        WHEN 'SLINE_PAYMENT_STATUS' THEN R.SLINE_PAYMENT_STATUS
                        WHEN 'CLEARANCE_POINT' THEN R.CLEARANCE_POINT
                        WHEN 'OPEN_ORDER' THEN R.OPEN_ORDER
                        WHEN 'BUFFER_YARD' THEN R.BUFFER_YARD
                        WHEN 'EDOC_STATUS' THEN R.EDOC_STATUS
                        WHEN 'COURIER_DT' THEN R.COURIER_DT
                        WHEN 'PICKUP_DT' THEN R.PICKUP_DT
                        WHEN 'CNTR_DISPATCH_DT' THEN R.CNTR_DISPATCH_DT
                        WHEN 'CNTR_REPORT_NS_DT' THEN R.CNTR_REPORT_NS_DT
                        WHEN 'CNTR_GATEDIN_DT' THEN R.CNTR_GATEDIN_DT
                        WHEN 'SB_NO' THEN R.SB_NO
                        WHEN 'SB_DT' THEN R.SB_DT
                        WHEN 'FOR_HBL' THEN R.FOR_HBL
                    END
            FROM   #SA_E E LEFT JOIN dbo.TBL_EXPT_SHEET_ROW R WITH (UPDLOCK, HOLDLOCK) ON R.ID = E.ROW_ID
            WHERE  E.REASON IS NULL;

            -- 4. hard lock on column ownership
            UPDATE E SET REASON = 'owner' FROM #SA_E E
            WHERE  E.REASON IS NULL AND @IS_ADMIN = 0
              AND  NOT EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_ROLE_COL RC
                               WHERE RC.COL_KEY = E.K AND (RC.ROLE_CODE = 'ALL' OR RC.ROLE_CODE IN (SELECT ROLE_CODE FROM @MYROLES)));

            -- 5. linked rows: FF_JOB follows the link; Links-owned columns lock once Links has a value
            UPDATE #SA_E SET REASON = 'locked' WHERE REASON IS NULL AND K = 'FF_JOB' AND EXPTNO IS NOT NULL;
            INSERT INTO #SHEET_LK (EXPTNO)
            SELECT DISTINCT E.EXPTNO FROM #SA_E E JOIN @REG G ON G.K = E.K AND G.IS_L = 1
            WHERE  E.REASON IS NULL AND E.EXPTNO IS NOT NULL;
            IF @@ROWCOUNT > 0 EXEC dbo.USP_EXPT_SHEET_LINKS_FILL;
            UPDATE E SET REASON = 'locked'
            FROM   #SA_E E JOIN #SHEET_LK L ON L.EXPTNO = E.EXPTNO
            WHERE  E.REASON IS NULL
              AND  LTRIM(RTRIM(ISNULL(CASE E.K
                        WHEN 'WO' THEN L.L_WO
                        WHEN 'PORT' THEN L.L_PORT
                        WHEN 'COUNTRY' THEN L.L_COUNTRY
                        WHEN 'QTY' THEN L.L_QTY
                        WHEN 'CONT' THEN L.L_CONT
                        WHEN 'CNTR_TYPE' THEN L.L_CNTR_TYPE
                        WHEN 'VSL_NAME' THEN L.L_VSL_NAME
                        WHEN 'SLINE' THEN L.L_SLINE
                        WHEN 'BOOKING_NO' THEN L.L_BOOKING_NO
                        WHEN 'PO_NO' THEN L.L_PO_NO
                        WHEN 'CONSIGNEE' THEN L.L_CONSIGNEE
                        WHEN 'CONTAINER_NO' THEN L.L_CONTAINER_NO
                        WHEN 'CURRENT_ETD' THEN L.L_CURRENT_ETD
                        WHEN 'ETA_DEST' THEN L.L_ETA_DEST
                        WHEN 'FINAL_VSL_SOB' THEN L.L_FINAL_VSL_SOB
                        WHEN 'BL_NO' THEN L.L_BL_NO
                        WHEN 'BL_DT' THEN L.L_BL_DT
                        WHEN 'EDOC_STATUS' THEN L.L_EDOC_STATUS
                        WHEN 'COURIER_DT' THEN L.L_COURIER_DT
                        WHEN 'SB_NO' THEN L.L_SB_NO
                        WHEN 'SB_DT' THEN L.L_SB_DT
                        WHEN 'FOR_HBL' THEN L.L_FOR_HBL
                    END, N''))) <> N'';

            -- 6. what really changes (case and trailing blanks count)
            UPDATE #SA_E
            SET    CHANGED = CASE WHEN ISNULL(OV, N'') COLLATE Latin1_General_BIN2 = ISNULL(NV, N'') COLLATE Latin1_General_BIN2
                                   AND DATALENGTH(ISNULL(OV, N'')) = DATALENGTH(ISNULL(NV, N'')) THEN 0 ELSE 1 END
            WHERE  REASON IS NULL;

            -- 7. apply: one UPDATE for every row of the batch. MODIFY_DT is taken now, after the locks and the Links
            --    lookup, so a CHANGES poll that ran meanwhile cannot end up with a later AS_OF than this save
            SET @NOW = GETDATE();
            UPDATE R
            SET    WO = CASE WHEN P.H_WO = 1 THEN P.V_WO ELSE R.WO END,
                   PORT = CASE WHEN P.H_PORT = 1 THEN P.V_PORT ELSE R.PORT END,
                   COUNTRY = CASE WHEN P.H_COUNTRY = 1 THEN P.V_COUNTRY ELSE R.COUNTRY END,
                   VEH = CASE WHEN P.H_VEH = 1 THEN P.V_VEH ELSE R.VEH END,
                   QTY = CASE WHEN P.H_QTY = 1 THEN P.V_QTY ELSE R.QTY END,
                   CONT = CASE WHEN P.H_CONT = 1 THEN P.V_CONT ELSE R.CONT END,
                   CNTR_TYPE = CASE WHEN P.H_CNTR_TYPE = 1 THEN P.V_CNTR_TYPE ELSE R.CNTR_TYPE END,
                   STUFFING_DT = CASE WHEN P.H_STUFFING_DT = 1 THEN P.V_STUFFING_DT ELSE R.STUFFING_DT END,
                   VSL_NAME = CASE WHEN P.H_VSL_NAME = 1 THEN P.V_VSL_NAME ELSE R.VSL_NAME END,
                   DO_ETD = CASE WHEN P.H_DO_ETD = 1 THEN P.V_DO_ETD ELSE R.DO_ETD END,
                   SLINE = CASE WHEN P.H_SLINE = 1 THEN P.V_SLINE ELSE R.SLINE END,
                   AGENT = CASE WHEN P.H_AGENT = 1 THEN P.V_AGENT ELSE R.AGENT END,
                   DO_RECEIVE_DT = CASE WHEN P.H_DO_RECEIVE_DT = 1 THEN P.V_DO_RECEIVE_DT ELSE R.DO_RECEIVE_DT END,
                   BOOKING_NO = CASE WHEN P.H_BOOKING_NO = 1 THEN P.V_BOOKING_NO ELSE R.BOOKING_NO END,
                   TRANSPORTER = CASE WHEN P.H_TRANSPORTER = 1 THEN P.V_TRANSPORTER ELSE R.TRANSPORTER END,
                   CARGO_TYPE = CASE WHEN P.H_CARGO_TYPE = 1 THEN P.V_CARGO_TYPE ELSE R.CARGO_TYPE END,
                   PLANT = CASE WHEN P.H_PLANT = 1 THEN P.V_PLANT ELSE R.PLANT END,
                   PO_NO = CASE WHEN P.H_PO_NO = 1 THEN P.V_PO_NO ELSE R.PO_NO END,
                   LC_NO = CASE WHEN P.H_LC_NO = 1 THEN P.V_LC_NO ELSE R.LC_NO END,
                   LC_DATE = CASE WHEN P.H_LC_DATE = 1 THEN P.V_LC_DATE ELSE R.LC_DATE END,
                   HAZ = CASE WHEN P.H_HAZ = 1 THEN P.V_HAZ ELSE R.HAZ END,
                   CONSIGNEE = CASE WHEN P.H_CONSIGNEE = 1 THEN P.V_CONSIGNEE ELSE R.CONSIGNEE END,
                   REMARK1 = CASE WHEN P.H_REMARK1 = 1 THEN P.V_REMARK1 ELSE R.REMARK1 END,
                   DO_GIVEN_DT = CASE WHEN P.H_DO_GIVEN_DT = 1 THEN P.V_DO_GIVEN_DT ELSE R.DO_GIVEN_DT END,
                   CONTAINER_NO = CASE WHEN P.H_CONTAINER_NO = 1 THEN P.V_CONTAINER_NO ELSE R.CONTAINER_NO END,
                   POL_GATE = CASE WHEN P.H_POL_GATE = 1 THEN P.V_POL_GATE ELSE R.POL_GATE END,
                   GATE_OPEN_DT = CASE WHEN P.H_GATE_OPEN_DT = 1 THEN P.V_GATE_OPEN_DT ELSE R.GATE_OPEN_DT END,
                   GATE_CUTOFF_DT = CASE WHEN P.H_GATE_CUTOFF_DT = 1 THEN P.V_GATE_CUTOFF_DT ELSE R.GATE_CUTOFF_DT END,
                   SI_CUTOFF_DT = CASE WHEN P.H_SI_CUTOFF_DT = 1 THEN P.V_SI_CUTOFF_DT ELSE R.SI_CUTOFF_DT END,
                   DO_ETD2 = CASE WHEN P.H_DO_ETD2 = 1 THEN P.V_DO_ETD2 ELSE R.DO_ETD2 END,
                   CURRENT_ETD = CASE WHEN P.H_CURRENT_ETD = 1 THEN P.V_CURRENT_ETD ELSE R.CURRENT_ETD END,
                   ETA_DEST = CASE WHEN P.H_ETA_DEST = 1 THEN P.V_ETA_DEST ELSE R.ETA_DEST END,
                   FINAL_VSL_SOB = CASE WHEN P.H_FINAL_VSL_SOB = 1 THEN P.V_FINAL_VSL_SOB ELSE R.FINAL_VSL_SOB END,
                   VGM_SUBMITTED_DT = CASE WHEN P.H_VGM_SUBMITTED_DT = 1 THEN P.V_VGM_SUBMITTED_DT ELSE R.VGM_SUBMITTED_DT END,
                   SI_SUBMITTED_DT = CASE WHEN P.H_SI_SUBMITTED_DT = 1 THEN P.V_SI_SUBMITTED_DT ELSE R.SI_SUBMITTED_DT END,
                   BL_NO = CASE WHEN P.H_BL_NO = 1 THEN P.V_BL_NO ELSE R.BL_NO END,
                   BL_DT = CASE WHEN P.H_BL_DT = 1 THEN P.V_BL_DT ELSE R.BL_DT END,
                   BL_HANDOVER_DT = CASE WHEN P.H_BL_HANDOVER_DT = 1 THEN P.V_BL_HANDOVER_DT ELSE R.BL_HANDOVER_DT END,
                   FF_JOB = CASE WHEN P.H_FF_JOB = 1 THEN P.V_FF_JOB ELSE R.FF_JOB END,
                   SLINE_PAYMENT_STATUS = CASE WHEN P.H_SLINE_PAYMENT_STATUS = 1 THEN P.V_SLINE_PAYMENT_STATUS ELSE R.SLINE_PAYMENT_STATUS END,
                   CLEARANCE_POINT = CASE WHEN P.H_CLEARANCE_POINT = 1 THEN P.V_CLEARANCE_POINT ELSE R.CLEARANCE_POINT END,
                   OPEN_ORDER = CASE WHEN P.H_OPEN_ORDER = 1 THEN P.V_OPEN_ORDER ELSE R.OPEN_ORDER END,
                   BUFFER_YARD = CASE WHEN P.H_BUFFER_YARD = 1 THEN P.V_BUFFER_YARD ELSE R.BUFFER_YARD END,
                   EDOC_STATUS = CASE WHEN P.H_EDOC_STATUS = 1 THEN P.V_EDOC_STATUS ELSE R.EDOC_STATUS END,
                   COURIER_DT = CASE WHEN P.H_COURIER_DT = 1 THEN P.V_COURIER_DT ELSE R.COURIER_DT END,
                   PICKUP_DT = CASE WHEN P.H_PICKUP_DT = 1 THEN P.V_PICKUP_DT ELSE R.PICKUP_DT END,
                   CNTR_DISPATCH_DT = CASE WHEN P.H_CNTR_DISPATCH_DT = 1 THEN P.V_CNTR_DISPATCH_DT ELSE R.CNTR_DISPATCH_DT END,
                   CNTR_REPORT_NS_DT = CASE WHEN P.H_CNTR_REPORT_NS_DT = 1 THEN P.V_CNTR_REPORT_NS_DT ELSE R.CNTR_REPORT_NS_DT END,
                   CNTR_GATEDIN_DT = CASE WHEN P.H_CNTR_GATEDIN_DT = 1 THEN P.V_CNTR_GATEDIN_DT ELSE R.CNTR_GATEDIN_DT END,
                   SB_NO = CASE WHEN P.H_SB_NO = 1 THEN P.V_SB_NO ELSE R.SB_NO END,
                   SB_DT = CASE WHEN P.H_SB_DT = 1 THEN P.V_SB_DT ELSE R.SB_DT END,
                   FOR_HBL = CASE WHEN P.H_FOR_HBL = 1 THEN P.V_FOR_HBL ELSE R.FOR_HBL END,
                   ROWVER    = R.ROWVER + 1,
                   MODIFY_ID = @USER_ID,
                   MODIFY_DT = @NOW
            FROM   dbo.TBL_EXPT_SHEET_ROW R
                   JOIN (SELECT ROW_ID,
                                MAX(CASE WHEN K = 'WO' THEN 1 ELSE 0 END) AS H_WO, MAX(CASE WHEN K = 'WO' THEN NV END) AS V_WO,
                                MAX(CASE WHEN K = 'PORT' THEN 1 ELSE 0 END) AS H_PORT, MAX(CASE WHEN K = 'PORT' THEN NV END) AS V_PORT,
                                MAX(CASE WHEN K = 'COUNTRY' THEN 1 ELSE 0 END) AS H_COUNTRY, MAX(CASE WHEN K = 'COUNTRY' THEN NV END) AS V_COUNTRY,
                                MAX(CASE WHEN K = 'VEH' THEN 1 ELSE 0 END) AS H_VEH, MAX(CASE WHEN K = 'VEH' THEN NV END) AS V_VEH,
                                MAX(CASE WHEN K = 'QTY' THEN 1 ELSE 0 END) AS H_QTY, MAX(CASE WHEN K = 'QTY' THEN NV END) AS V_QTY,
                                MAX(CASE WHEN K = 'CONT' THEN 1 ELSE 0 END) AS H_CONT, MAX(CASE WHEN K = 'CONT' THEN NV END) AS V_CONT,
                                MAX(CASE WHEN K = 'CNTR_TYPE' THEN 1 ELSE 0 END) AS H_CNTR_TYPE, MAX(CASE WHEN K = 'CNTR_TYPE' THEN NV END) AS V_CNTR_TYPE,
                                MAX(CASE WHEN K = 'STUFFING_DT' THEN 1 ELSE 0 END) AS H_STUFFING_DT, MAX(CASE WHEN K = 'STUFFING_DT' THEN NV END) AS V_STUFFING_DT,
                                MAX(CASE WHEN K = 'VSL_NAME' THEN 1 ELSE 0 END) AS H_VSL_NAME, MAX(CASE WHEN K = 'VSL_NAME' THEN NV END) AS V_VSL_NAME,
                                MAX(CASE WHEN K = 'DO_ETD' THEN 1 ELSE 0 END) AS H_DO_ETD, MAX(CASE WHEN K = 'DO_ETD' THEN NV END) AS V_DO_ETD,
                                MAX(CASE WHEN K = 'SLINE' THEN 1 ELSE 0 END) AS H_SLINE, MAX(CASE WHEN K = 'SLINE' THEN NV END) AS V_SLINE,
                                MAX(CASE WHEN K = 'AGENT' THEN 1 ELSE 0 END) AS H_AGENT, MAX(CASE WHEN K = 'AGENT' THEN NV END) AS V_AGENT,
                                MAX(CASE WHEN K = 'DO_RECEIVE_DT' THEN 1 ELSE 0 END) AS H_DO_RECEIVE_DT, MAX(CASE WHEN K = 'DO_RECEIVE_DT' THEN NV END) AS V_DO_RECEIVE_DT,
                                MAX(CASE WHEN K = 'BOOKING_NO' THEN 1 ELSE 0 END) AS H_BOOKING_NO, MAX(CASE WHEN K = 'BOOKING_NO' THEN NV END) AS V_BOOKING_NO,
                                MAX(CASE WHEN K = 'TRANSPORTER' THEN 1 ELSE 0 END) AS H_TRANSPORTER, MAX(CASE WHEN K = 'TRANSPORTER' THEN NV END) AS V_TRANSPORTER,
                                MAX(CASE WHEN K = 'CARGO_TYPE' THEN 1 ELSE 0 END) AS H_CARGO_TYPE, MAX(CASE WHEN K = 'CARGO_TYPE' THEN NV END) AS V_CARGO_TYPE,
                                MAX(CASE WHEN K = 'PLANT' THEN 1 ELSE 0 END) AS H_PLANT, MAX(CASE WHEN K = 'PLANT' THEN NV END) AS V_PLANT,
                                MAX(CASE WHEN K = 'PO_NO' THEN 1 ELSE 0 END) AS H_PO_NO, MAX(CASE WHEN K = 'PO_NO' THEN NV END) AS V_PO_NO,
                                MAX(CASE WHEN K = 'LC_NO' THEN 1 ELSE 0 END) AS H_LC_NO, MAX(CASE WHEN K = 'LC_NO' THEN NV END) AS V_LC_NO,
                                MAX(CASE WHEN K = 'LC_DATE' THEN 1 ELSE 0 END) AS H_LC_DATE, MAX(CASE WHEN K = 'LC_DATE' THEN NV END) AS V_LC_DATE,
                                MAX(CASE WHEN K = 'HAZ' THEN 1 ELSE 0 END) AS H_HAZ, MAX(CASE WHEN K = 'HAZ' THEN NV END) AS V_HAZ,
                                MAX(CASE WHEN K = 'CONSIGNEE' THEN 1 ELSE 0 END) AS H_CONSIGNEE, MAX(CASE WHEN K = 'CONSIGNEE' THEN NV END) AS V_CONSIGNEE,
                                MAX(CASE WHEN K = 'REMARK1' THEN 1 ELSE 0 END) AS H_REMARK1, MAX(CASE WHEN K = 'REMARK1' THEN NV END) AS V_REMARK1,
                                MAX(CASE WHEN K = 'DO_GIVEN_DT' THEN 1 ELSE 0 END) AS H_DO_GIVEN_DT, MAX(CASE WHEN K = 'DO_GIVEN_DT' THEN NV END) AS V_DO_GIVEN_DT,
                                MAX(CASE WHEN K = 'CONTAINER_NO' THEN 1 ELSE 0 END) AS H_CONTAINER_NO, MAX(CASE WHEN K = 'CONTAINER_NO' THEN NV END) AS V_CONTAINER_NO,
                                MAX(CASE WHEN K = 'POL_GATE' THEN 1 ELSE 0 END) AS H_POL_GATE, MAX(CASE WHEN K = 'POL_GATE' THEN NV END) AS V_POL_GATE,
                                MAX(CASE WHEN K = 'GATE_OPEN_DT' THEN 1 ELSE 0 END) AS H_GATE_OPEN_DT, MAX(CASE WHEN K = 'GATE_OPEN_DT' THEN NV END) AS V_GATE_OPEN_DT,
                                MAX(CASE WHEN K = 'GATE_CUTOFF_DT' THEN 1 ELSE 0 END) AS H_GATE_CUTOFF_DT, MAX(CASE WHEN K = 'GATE_CUTOFF_DT' THEN NV END) AS V_GATE_CUTOFF_DT,
                                MAX(CASE WHEN K = 'SI_CUTOFF_DT' THEN 1 ELSE 0 END) AS H_SI_CUTOFF_DT, MAX(CASE WHEN K = 'SI_CUTOFF_DT' THEN NV END) AS V_SI_CUTOFF_DT,
                                MAX(CASE WHEN K = 'DO_ETD2' THEN 1 ELSE 0 END) AS H_DO_ETD2, MAX(CASE WHEN K = 'DO_ETD2' THEN NV END) AS V_DO_ETD2,
                                MAX(CASE WHEN K = 'CURRENT_ETD' THEN 1 ELSE 0 END) AS H_CURRENT_ETD, MAX(CASE WHEN K = 'CURRENT_ETD' THEN NV END) AS V_CURRENT_ETD,
                                MAX(CASE WHEN K = 'ETA_DEST' THEN 1 ELSE 0 END) AS H_ETA_DEST, MAX(CASE WHEN K = 'ETA_DEST' THEN NV END) AS V_ETA_DEST,
                                MAX(CASE WHEN K = 'FINAL_VSL_SOB' THEN 1 ELSE 0 END) AS H_FINAL_VSL_SOB, MAX(CASE WHEN K = 'FINAL_VSL_SOB' THEN NV END) AS V_FINAL_VSL_SOB,
                                MAX(CASE WHEN K = 'VGM_SUBMITTED_DT' THEN 1 ELSE 0 END) AS H_VGM_SUBMITTED_DT, MAX(CASE WHEN K = 'VGM_SUBMITTED_DT' THEN NV END) AS V_VGM_SUBMITTED_DT,
                                MAX(CASE WHEN K = 'SI_SUBMITTED_DT' THEN 1 ELSE 0 END) AS H_SI_SUBMITTED_DT, MAX(CASE WHEN K = 'SI_SUBMITTED_DT' THEN NV END) AS V_SI_SUBMITTED_DT,
                                MAX(CASE WHEN K = 'BL_NO' THEN 1 ELSE 0 END) AS H_BL_NO, MAX(CASE WHEN K = 'BL_NO' THEN NV END) AS V_BL_NO,
                                MAX(CASE WHEN K = 'BL_DT' THEN 1 ELSE 0 END) AS H_BL_DT, MAX(CASE WHEN K = 'BL_DT' THEN NV END) AS V_BL_DT,
                                MAX(CASE WHEN K = 'BL_HANDOVER_DT' THEN 1 ELSE 0 END) AS H_BL_HANDOVER_DT, MAX(CASE WHEN K = 'BL_HANDOVER_DT' THEN NV END) AS V_BL_HANDOVER_DT,
                                MAX(CASE WHEN K = 'FF_JOB' THEN 1 ELSE 0 END) AS H_FF_JOB, MAX(CASE WHEN K = 'FF_JOB' THEN NV END) AS V_FF_JOB,
                                MAX(CASE WHEN K = 'SLINE_PAYMENT_STATUS' THEN 1 ELSE 0 END) AS H_SLINE_PAYMENT_STATUS, MAX(CASE WHEN K = 'SLINE_PAYMENT_STATUS' THEN NV END) AS V_SLINE_PAYMENT_STATUS,
                                MAX(CASE WHEN K = 'CLEARANCE_POINT' THEN 1 ELSE 0 END) AS H_CLEARANCE_POINT, MAX(CASE WHEN K = 'CLEARANCE_POINT' THEN NV END) AS V_CLEARANCE_POINT,
                                MAX(CASE WHEN K = 'OPEN_ORDER' THEN 1 ELSE 0 END) AS H_OPEN_ORDER, MAX(CASE WHEN K = 'OPEN_ORDER' THEN NV END) AS V_OPEN_ORDER,
                                MAX(CASE WHEN K = 'BUFFER_YARD' THEN 1 ELSE 0 END) AS H_BUFFER_YARD, MAX(CASE WHEN K = 'BUFFER_YARD' THEN NV END) AS V_BUFFER_YARD,
                                MAX(CASE WHEN K = 'EDOC_STATUS' THEN 1 ELSE 0 END) AS H_EDOC_STATUS, MAX(CASE WHEN K = 'EDOC_STATUS' THEN NV END) AS V_EDOC_STATUS,
                                MAX(CASE WHEN K = 'COURIER_DT' THEN 1 ELSE 0 END) AS H_COURIER_DT, MAX(CASE WHEN K = 'COURIER_DT' THEN NV END) AS V_COURIER_DT,
                                MAX(CASE WHEN K = 'PICKUP_DT' THEN 1 ELSE 0 END) AS H_PICKUP_DT, MAX(CASE WHEN K = 'PICKUP_DT' THEN NV END) AS V_PICKUP_DT,
                                MAX(CASE WHEN K = 'CNTR_DISPATCH_DT' THEN 1 ELSE 0 END) AS H_CNTR_DISPATCH_DT, MAX(CASE WHEN K = 'CNTR_DISPATCH_DT' THEN NV END) AS V_CNTR_DISPATCH_DT,
                                MAX(CASE WHEN K = 'CNTR_REPORT_NS_DT' THEN 1 ELSE 0 END) AS H_CNTR_REPORT_NS_DT, MAX(CASE WHEN K = 'CNTR_REPORT_NS_DT' THEN NV END) AS V_CNTR_REPORT_NS_DT,
                                MAX(CASE WHEN K = 'CNTR_GATEDIN_DT' THEN 1 ELSE 0 END) AS H_CNTR_GATEDIN_DT, MAX(CASE WHEN K = 'CNTR_GATEDIN_DT' THEN NV END) AS V_CNTR_GATEDIN_DT,
                                MAX(CASE WHEN K = 'SB_NO' THEN 1 ELSE 0 END) AS H_SB_NO, MAX(CASE WHEN K = 'SB_NO' THEN NV END) AS V_SB_NO,
                                MAX(CASE WHEN K = 'SB_DT' THEN 1 ELSE 0 END) AS H_SB_DT, MAX(CASE WHEN K = 'SB_DT' THEN NV END) AS V_SB_DT,
                                MAX(CASE WHEN K = 'FOR_HBL' THEN 1 ELSE 0 END) AS H_FOR_HBL, MAX(CASE WHEN K = 'FOR_HBL' THEN NV END) AS V_FOR_HBL
                         FROM   #SA_E WHERE REASON IS NULL AND CHANGED = 1 GROUP BY ROW_ID) P ON P.ROW_ID = R.ID;
            SET @ROWS = @@ROWCOUNT;

            INSERT INTO dbo.TBL_EXPT_SHEET_LOG (ROW_KIND, ROW_ID, COL_KEY, OLD_VALUE, NEW_VALUE, ACTION, USER_ID, USER_NAME, LOG_DT)
            SELECT 'W', ROW_ID, K, OV, NV, @ACTION, @USER_ID, @USER_NAME, @NOW
            FROM   #SA_E WHERE REASON IS NULL AND CHANGED = 1
            ORDER BY SEQ;
            SET @APPLIED = @@ROWCOUNT;

            -- 8. linked rows: changed T columns -> EXPT_JOB_TRACKING (the latest edit per job + field)
            INSERT INTO #SHEET_MIRROR (EXPTNO, F, TV)
            SELECT X.EXPTNO, X.F, X.TV
            FROM  (SELECT E.EXPTNO, G.TCOL AS F, Z1.TV, Z1.MAPOK,
                          ROW_NUMBER() OVER (PARTITION BY E.EXPTNO, G.TCOL ORDER BY E.SEQ DESC) AS RN
                   FROM   #SA_E E JOIN @REG G ON G.K = E.K AND G.TCOL IS NOT NULL
                CROSS APPLY (SELECT LTRIM(RTRIM(ISNULL(E.NV, N''))) AS S) Z0
                CROSS APPLY (SELECT
                    CASE WHEN Z0.S = N'' THEN NULL
                         WHEN G.TKIND = 't' THEN CONVERT(VARCHAR(500), LEFT(Z0.S, G.TLEN))
                         WHEN G.TKIND = 'h' AND UPPER(Z0.S) IN (N'YES', N'Y', N'HAZ') THEN 'Y'
                         WHEN G.TKIND = 'h' AND UPPER(Z0.S) IN (N'NO', N'N') THEN 'N'
                         WHEN G.TKIND = 'd' AND Z0.S LIKE '[0-3][0-9]-[01][0-9]-[12][0-9][0-9][0-9]' AND ISDATE(Z0.S) = 1
                             THEN REPLACE(CONVERT(VARCHAR(10), Z0.S), '-', '/')
                    END AS TV,
                    CASE WHEN Z0.S = N'' OR G.TKIND = 't' THEN 1
                         WHEN G.TKIND = 'h' AND UPPER(Z0.S) IN (N'YES', N'Y', N'HAZ', N'NO', N'N') THEN 1
                         WHEN G.TKIND = 'd' AND Z0.S LIKE '[0-3][0-9]-[01][0-9]-[12][0-9][0-9][0-9]' AND ISDATE(Z0.S) = 1 THEN 1
                         ELSE 0 END AS MAPOK) Z1
                   WHERE  E.REASON IS NULL AND E.CHANGED = 1 AND E.EXPTNO IS NOT NULL) X
            WHERE  X.RN = 1 AND X.MAPOK = 1;
            IF EXISTS (SELECT 1 FROM #SHEET_MIRROR)
                EXEC dbo.USP_EXPT_SHEET_TRACK_MIRROR @USER_ID, @FIELDS OUTPUT;

        IF @TC = 0 COMMIT TRANSACTION;
        END TRY
        BEGIN CATCH
            DECLARE @ERR NVARCHAR(2048);
            SET @ERR = ERROR_MESSAGE();
            IF XACT_STATE() = -1 OR (XACT_STATE() = 1 AND @TC = 0)
            BEGIN
                ROLLBACK TRANSACTION;
            END
            ELSE IF XACT_STATE() = 1
            BEGIN
                ROLLBACK TRANSACTION EXPT_SHEET_SAVE;
            END
            SELECT @APPLIED = 0, @ROWS = 0, @FIELDS = 0;
            SELECT @STATUS = '101', @STATUSTEXT = N'Not saved: ' + @ERR;
            IF @TC > 0 AND @@TRANCOUNT = 0
                RAISERROR(N'%s (the caller''s transaction could not be kept and was rolled back)', 16, 1, @ERR);
        END CATCH
    END

    IF @PARSED = 1
    BEGIN
        SELECT @REJECTED = COUNT(*) FROM #SA_E WHERE REASON IS NOT NULL;
        IF @STATUS = '100'
        BEGIN
            SET @STATUS = CASE WHEN EXISTS (SELECT 1 FROM #SA_E WHERE REASON = 'conflict') THEN '102'
                               WHEN EXISTS (SELECT 1 FROM #SA_E WHERE REASON IN ('owner', 'locked')) THEN '104'
                               WHEN EXISTS (SELECT 1 FROM #SA_E WHERE REASON = 'notfound') THEN '103'
                               WHEN @REJECTED > 0 THEN '101' ELSE '100' END;
            SET @STATUSTEXT = N'Saved ' + CONVERT(NVARCHAR(10), @APPLIED) + N' cell(s) on ' + CONVERT(NVARCHAR(10), @ROWS) + N' row(s)'
                + CASE WHEN @REJECTED > 0 THEN N'; ' + CONVERT(NVARCHAR(10), @REJECTED) + N' edit(s) refused ('
                       + ISNULL(STUFF((SELECT N', ' + CONVERT(NVARCHAR(10), COUNT(*)) + N' ' + REASON FROM #SA_E WHERE REASON IS NOT NULL
                                       GROUP BY REASON ORDER BY REASON FOR XML PATH(''), TYPE).value('.', 'NVARCHAR(MAX)'), 1, 2, N''), N'') + N')'
                       ELSE N'' END
                + CASE WHEN @FIELDS > 0 THEN N'; ' + CONVERT(NVARCHAR(10), @FIELDS) + N' tracking field(s) updated' ELSE N'' END + N'.';
        END
    END

    -- self-test hook: only TEST_EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql creates #EXPT_SHEET_SELFTEST
    IF OBJECT_ID('tempdb..#EXPT_SHEET_SELFTEST') IS NOT NULL
        INSERT INTO #EXPT_SHEET_SELFTEST (PROC_NAME, STATUS, STATUSTEXT, N1, N2, N3)
        VALUES ('SAVE_APPLY:' + @ACTION + '', @STATUS, @STATUSTEXT, @APPLIED, @REJECTED, @FIELDS);
    SELECT @STATUS AS STATUS, @STATUSTEXT AS STATUSTEXT, @APPLIED AS APPLIED, @REJECTED AS REJECTED, @ROWS AS ROWS_SAVED, @FIELDS AS TRACKING_FIELDS;
    SELECT ROW_ID AS ID, K AS [KEY], REASON FROM #SA_E WHERE REASON IS NOT NULL ORDER BY SEQ;
    INSERT INTO #SHEET_IDS (ID)
    SELECT DISTINCT R.ID FROM #SA_E E JOIN dbo.TBL_EXPT_SHEET_ROW R ON R.ID = E.ROW_ID
    WHERE  R.MONTH_ID = @MONTH_ID AND R.TAB_CODE = @TAB_CODE;
    EXEC dbo.USP_EXPT_SHEET_ROWS_OUT 1;
END
GO

/* ---- dbo.USP_EXPT_SHEET_LINK_APPLY ------------------------------------------------------------- */
IF OBJECT_ID('dbo.USP_EXPT_SHEET_LINK_APPLY', 'P') IS NOT NULL
    DROP PROCEDURE dbo.USP_EXPT_SHEET_LINK_APPLY;      -- step 1 made sure it is this script's own
GO
CREATE PROCEDURE dbo.USP_EXPT_SHEET_LINK_APPLY
    @ROW_IDS   VARCHAR(MAX),
    @EXPTNO    VARCHAR(25),
    @ACTION    VARCHAR(20),
    @USER_ID   VARCHAR(50),
    @USER_NAME NVARCHAR(100)
AS
BEGIN
    -- Deployed by links-22/_DB_FIX/EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql (Export > Sheet view). Do not edit here: change that script.
    -- Internal. The body of LINK (@ACTION 'link') and CONVERT_DONE (@ACTION 'convert').
    -- Every row must exist (not deleted), and the job must be in EXPT_MASTER under the CMPCODE / CITYCODE of each row's month
    -- (else 103). Sets EXPTNO and FF_JOB, bumps ROWVER, logs one FF_JOB row per sheet row, makes sure the job has an
    -- EXPT_JOB_TRACKING row and copies the rows' T columns into it: per field the first row (sheet order) with a value that can
    -- be mirrored; empty sheet cells never clear tracking values on a link.
    -- Results: Table STATUS, STATUSTEXT, EXPTNO, ROWS_LINKED, TRACKING_FIELDS; on success Table1 + Table2 = the rows (LOAD shape).
    SET NOCOUNT ON;
    IF @@TRANCOUNT = 0 SET XACT_ABORT ON ELSE SET XACT_ABORT OFF;
    SET DATEFORMAT dmy;
    DECLARE @STATUS VARCHAR(3), @STATUSTEXT NVARCHAR(1000), @NOW DATETIME, @TC INT, @N INT, @FIELDS INT, @MISS INT, @S VARCHAR(MAX), @I INT, @P INT, @LEN INT, @T VARCHAR(100), @POS INT, @BAD BIT;
    SELECT @STATUS = '100', @STATUSTEXT = N'', @NOW = GETDATE(), @N = 0, @FIELDS = 0;
    SELECT @EXPTNO = LTRIM(RTRIM(ISNULL(@EXPTNO, ''))), @USER_ID = LTRIM(RTRIM(ISNULL(@USER_ID, ''))),
           @ACTION = CASE WHEN @ACTION = 'convert' THEN 'convert' ELSE 'link' END;
    DECLARE @REG TABLE (K VARCHAR(40) NOT NULL PRIMARY KEY, KIND VARCHAR(10) NOT NULL, IS_L BIT NOT NULL, TCOL VARCHAR(40) NULL,
                        TKIND CHAR(1) NULL, TLEN INT NULL, MAXLEN INT NOT NULL, OWNER VARCHAR(20) NOT NULL, SEQ INT NOT NULL);
    INSERT INTO @REG (K, KIND, IS_L, TCOL, TKIND, TLEN, MAXLEN, OWNER, SEQ) VALUES
        ('WO', 'text', 1, NULL, NULL, NULL, 500, 'OPS', 1),
        ('PORT', 'choice', 1, NULL, NULL, NULL, 500, 'OPS', 2),
        ('COUNTRY', 'choice', 1, NULL, NULL, NULL, 500, 'OPS', 3),
        ('VEH', 'ml', 0, 'VEHICLE_MODEL', 't', 100, 2000, 'OPS', 4),
        ('QTY', 'num', 1, NULL, NULL, NULL, 500, 'OPS', 5),
        ('CONT', 'num', 1, NULL, NULL, NULL, 500, 'OPS', 6),
        ('CNTR_TYPE', 'choice', 1, NULL, NULL, NULL, 500, 'OPS', 7),
        ('STUFFING_DT', 'date', 0, 'STUFFING_DT', 'd', NULL, 500, 'OPS', 8),
        ('VSL_NAME', 'choice', 1, NULL, NULL, NULL, 500, 'BOOKING', 9),
        ('DO_ETD', 'date', 0, 'DO_ETD', 'd', NULL, 500, 'OPS', 10),
        ('SLINE', 'choice', 1, NULL, NULL, NULL, 500, 'BOOKING', 11),
        ('AGENT', 'choice', 0, NULL, NULL, NULL, 500, 'OPS', 12),
        ('DO_RECEIVE_DT', 'date', 0, 'DO_RECEIVE_DT', 'd', NULL, 500, 'OPS', 13),
        ('BOOKING_NO', 'text', 1, NULL, NULL, NULL, 500, 'OPS', 14),
        ('TRANSPORTER', 'choice', 0, 'TRANSPORTER', 't', 100, 500, 'OPS', 15),
        ('CARGO_TYPE', 'choice', 0, 'CARGO_TYPE', 't', 10, 500, 'OPS', 16),
        ('PLANT', 'choice', 0, 'PLANT', 't', 50, 500, 'OPS', 17),
        ('PO_NO', 'text', 1, NULL, NULL, NULL, 500, 'OPS', 18),
        ('LC_NO', 'text', 0, 'LC_NO', 't', 50, 500, 'OPS', 19),
        ('LC_DATE', 'date', 0, 'LC_DATE', 'd', NULL, 500, 'OPS', 20),
        ('HAZ', 'choice', 0, 'HAZ', 'h', 1, 500, 'OPS', 21),
        ('CONSIGNEE', 'choice', 1, NULL, NULL, NULL, 500, 'OPS', 22),
        ('REMARK1', 'ml', 0, 'REMARK1', 't', 500, 2000, 'ALL', 23),
        ('DO_GIVEN_DT', 'date', 0, 'DO_GIVEN_DT', 'd', NULL, 500, 'OPS', 24),
        ('CONTAINER_NO', 'ml', 1, NULL, NULL, NULL, 2000, 'OPSLEAD', 25),
        ('POL_GATE', 'choice', 0, 'POL_GATE', 't', 50, 500, 'OPS', 26),
        ('GATE_OPEN_DT', 'date', 0, 'GATE_OPEN_DT', 'd', NULL, 500, 'OPS', 27),
        ('GATE_CUTOFF_DT', 'date', 0, 'GATE_CUTOFF_DT', 'd', NULL, 500, 'OPS', 28),
        ('SI_CUTOFF_DT', 'date', 0, 'SI_CUTOFF_DT', 'd', NULL, 500, 'OPS', 29),
        ('DO_ETD2', 'date', 0, NULL, NULL, NULL, 500, 'OPS', 30),
        ('CURRENT_ETD', 'date', 1, NULL, NULL, NULL, 500, 'OPS', 31),
        ('ETA_DEST', 'date', 1, NULL, NULL, NULL, 500, 'OPS', 32),
        ('FINAL_VSL_SOB', 'date', 1, NULL, NULL, NULL, 500, 'OPS', 33),
        ('VGM_SUBMITTED_DT', 'date', 0, 'VGM_SUBMITTED_DT', 'd', NULL, 500, 'DOCS', 34),
        ('SI_SUBMITTED_DT', 'date', 0, 'SI_SUBMITTED_DT', 'd', NULL, 500, 'DOCS', 35),
        ('BL_NO', 'text', 1, NULL, NULL, NULL, 500, 'BLDESK', 36),
        ('BL_DT', 'date', 1, NULL, NULL, NULL, 500, 'OPS', 37),
        ('BL_HANDOVER_DT', 'date', 0, 'BL_HANDOVER_DT', 'd', NULL, 500, 'BLDESK', 38),
        ('FF_JOB', 'text', 0, NULL, NULL, NULL, 500, 'BLDESK', 39),
        ('SLINE_PAYMENT_STATUS', 'text', 0, 'SLINE_PAYMENT_STATUS', 't', 100, 500, 'OPS', 40),
        ('CLEARANCE_POINT', 'choice', 0, 'CLEARANCE_POINT', 't', 50, 500, 'OPSLEAD', 41),
        ('OPEN_ORDER', 'choice', 0, 'OPEN_ORDER', 't', 50, 500, 'OPSLEAD', 42),
        ('BUFFER_YARD', 'text', 0, 'BUFFER_YARD', 't', 50, 500, 'OPSLEAD', 43),
        ('EDOC_STATUS', 'text', 1, NULL, NULL, NULL, 500, 'DOCS', 44),
        ('COURIER_DT', 'date', 1, NULL, NULL, NULL, 500, 'DOCS', 45),
        ('PICKUP_DT', 'date', 0, 'PICKUP_DT', 'd', NULL, 500, 'YARD', 46),
        ('CNTR_DISPATCH_DT', 'date', 0, 'CNTR_DISPATCH_DT', 'd', NULL, 500, 'OPS', 47),
        ('CNTR_REPORT_NS_DT', 'date', 0, 'CNTR_REPORT_NS_DT', 'd', NULL, 500, 'YARD', 48),
        ('CNTR_GATEDIN_DT', 'date', 0, 'CNTR_GATEDIN_DT', 'd', NULL, 500, 'YARD', 49),
        ('SB_NO', 'text', 1, NULL, NULL, NULL, 500, 'OPSLEAD', 50),
        ('SB_DT', 'date', 1, NULL, NULL, NULL, 500, 'OPSLEAD', 51),
        ('FOR_HBL', 'text', 1, NULL, NULL, NULL, 500, 'OPS', 52);
    DECLARE @L TABLE (ID INT NOT NULL PRIMARY KEY, POS INT NOT NULL);
    DECLARE @OLD TABLE (ID INT NOT NULL PRIMARY KEY, FF NVARCHAR(500) NULL, EXPTNO VARCHAR(25) NULL);
    DECLARE @JOB TABLE (CMPCODE VARCHAR(6) NOT NULL, CITYCODE VARCHAR(3) NOT NULL);
    CREATE TABLE #SHEET_IDS (ID INT NOT NULL PRIMARY KEY);
    CREATE TABLE #SHEET_LK (EXPTNO VARCHAR(25) NOT NULL PRIMARY KEY, FILLED BIT NOT NULL DEFAULT 0, JOB_FOUND BIT NOT NULL DEFAULT 0,
                            JOB_CANCELLED BIT NOT NULL DEFAULT 0,
                            L_WO NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_PORT NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_COUNTRY NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_QTY NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_CONT NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_CNTR_TYPE NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_VSL_NAME NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_SLINE NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_BOOKING_NO NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_PO_NO NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_CONSIGNEE NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_CONTAINER_NO NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_CURRENT_ETD NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_ETA_DEST NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_FINAL_VSL_SOB NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_BL_NO NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_BL_DT NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_EDOC_STATUS NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_COURIER_DT NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_SB_NO NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_SB_DT NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_FOR_HBL NVARCHAR(4000) NOT NULL DEFAULT N'');
    CREATE TABLE #SHEET_MIRROR (EXPTNO VARCHAR(25) NOT NULL, F VARCHAR(40) NOT NULL, TV VARCHAR(500) NULL,
                                OLD_V VARCHAR(500) NULL, NEW_V VARCHAR(500) NULL, PRIMARY KEY (EXPTNO, F));

    SELECT @S = ISNULL(@ROW_IDS, '') + ',', @I = 1, @POS = 0, @BAD = 0;
    SET @LEN = DATALENGTH(@S);
    WHILE @I <= @LEN
    BEGIN
        SET @P = CHARINDEX(',', @S, @I);
        SET @T = LTRIM(RTRIM(SUBSTRING(@S, @I, @P - @I)));
        SET @I = @P + 1;
        IF @T <> ''
        BEGIN
            IF @T LIKE '%[^0-9]%' OR LEN(@T) > 9 OR @T = '0'
                SET @BAD = 1;
            ELSE IF NOT EXISTS (SELECT 1 FROM @L WHERE ID = CONVERT(INT, @T))
            BEGIN
                SET @POS = @POS + 1;
                INSERT INTO @L (ID, POS) VALUES (CONVERT(INT, @T), @POS);
            END
        END
    END

    IF @USER_ID = ''
        SELECT @STATUS = '101', @STATUSTEXT = N'USER_ID is required.';
    ELSE IF @BAD = 1 OR NOT EXISTS (SELECT 1 FROM @L)
        SELECT @STATUS = '101', @STATUSTEXT = N'ROW_IDS must be a comma list of row ids.';
    ELSE IF @EXPTNO = ''
        SELECT @STATUS = '101', @STATUSTEXT = N'EXPTNO is required.';

    IF @STATUS = '100'
    BEGIN
        SELECT @MISS = COUNT(*) FROM @L L LEFT JOIN dbo.TBL_EXPT_SHEET_ROW R ON R.ID = L.ID AND R.ISDELETED = 0 WHERE R.ID IS NULL;
        IF @MISS > 0 SELECT @STATUS = '103', @STATUSTEXT = CONVERT(NVARCHAR(10), @MISS) + N' row(s) not found (or deleted).';
    END
    IF @STATUS = '100'
    BEGIN
        INSERT INTO @JOB (CMPCODE, CITYCODE)
        SELECT DISTINCT LTRIM(RTRIM(ISNULL(E.CMPCODE, ''))), LTRIM(RTRIM(ISNULL(E.CITYCODE, ''))) FROM dbo.EXPT_MASTER E WHERE E.EXPTNO = @EXPTNO;
        IF EXISTS (SELECT 1 FROM @L L JOIN dbo.TBL_EXPT_SHEET_ROW R ON R.ID = L.ID JOIN dbo.TBL_EXPT_SHEET_MONTH M ON M.ID = R.MONTH_ID
                   WHERE NOT EXISTS (SELECT 1 FROM @JOB J WHERE J.CMPCODE = M.CMPCODE AND J.CITYCODE = M.CITYCODE))
            SELECT @STATUS = '103', @STATUSTEXT = N'Export job ' + @EXPTNO + N' was not found in this company / branch.';
    END

    IF @STATUS = '100'
    BEGIN
        SET @TC = @@TRANCOUNT;
        BEGIN TRY
        IF @TC = 0 BEGIN BEGIN TRANSACTION; END ELSE BEGIN SAVE TRANSACTION EXPT_SHEET_LINK; END
            SELECT @MISS = COUNT(*) FROM dbo.TBL_EXPT_SHEET_ROW WITH (UPDLOCK, HOLDLOCK) WHERE ID IN (SELECT ID FROM @L);   -- lock first
            SET @NOW = GETDATE();
            UPDATE R
            SET    EXPTNO = @EXPTNO, FF_JOB = @EXPTNO, ROWVER = R.ROWVER + 1, MODIFY_ID = @USER_ID, MODIFY_DT = @NOW
            OUTPUT DELETED.ID, DELETED.FF_JOB, DELETED.EXPTNO INTO @OLD (ID, FF, EXPTNO)
            FROM   dbo.TBL_EXPT_SHEET_ROW R WITH (UPDLOCK, HOLDLOCK) JOIN @L L ON L.ID = R.ID;
            SET @N = @@ROWCOUNT;

            INSERT INTO dbo.TBL_EXPT_SHEET_LOG (ROW_KIND, ROW_ID, COL_KEY, OLD_VALUE, NEW_VALUE, ACTION, USER_ID, USER_NAME, LOG_DT)
            SELECT 'W', O.ID, 'FF_JOB',
                   CASE WHEN O.EXPTNO IS NOT NULL AND ISNULL(O.FF, N'') <> O.EXPTNO THEN ISNULL(O.FF, N'') + N' (linked to ' + O.EXPTNO + N')' ELSE O.FF END,
                   @EXPTNO, @ACTION, @USER_ID, @USER_NAME, @NOW
            FROM   @OLD O;

            -- tracking: the job gets an EXPT_JOB_TRACKING row; per field the first row (sheet order) with a value
            IF NOT EXISTS (SELECT 1 FROM dbo.EXPT_JOB_TRACKING WHERE EXPTNO = @EXPTNO)
                INSERT INTO dbo.EXPT_JOB_TRACKING (EXPTNO, MAKER_ID, MAKER_IP) VALUES (@EXPTNO, @USER_ID, 'EXPORT SHEET VIEW');
            INSERT INTO #SHEET_MIRROR (EXPTNO, F, TV)
            SELECT @EXPTNO, X.F, X.TV
            FROM  (SELECT G.TCOL AS F, Z1.TV, ROW_NUMBER() OVER (PARTITION BY G.TCOL ORDER BY R.SORT_ORDER, R.ID) AS RN
                   FROM   dbo.TBL_EXPT_SHEET_ROW R JOIN @L L ON L.ID = R.ID
                          CROSS APPLY (VALUES ('VEH', R.VEH), ('STUFFING_DT', R.STUFFING_DT), ('DO_ETD', R.DO_ETD), ('DO_RECEIVE_DT', R.DO_RECEIVE_DT), ('TRANSPORTER', R.TRANSPORTER), ('CARGO_TYPE', R.CARGO_TYPE), ('PLANT', R.PLANT), ('LC_NO', R.LC_NO), ('LC_DATE', R.LC_DATE), ('HAZ', R.HAZ), ('REMARK1', R.REMARK1), ('DO_GIVEN_DT', R.DO_GIVEN_DT), ('POL_GATE', R.POL_GATE), ('GATE_OPEN_DT', R.GATE_OPEN_DT), ('GATE_CUTOFF_DT', R.GATE_CUTOFF_DT), ('SI_CUTOFF_DT', R.SI_CUTOFF_DT), ('VGM_SUBMITTED_DT', R.VGM_SUBMITTED_DT), ('SI_SUBMITTED_DT', R.SI_SUBMITTED_DT), ('BL_HANDOVER_DT', R.BL_HANDOVER_DT), ('SLINE_PAYMENT_STATUS', R.SLINE_PAYMENT_STATUS), ('CLEARANCE_POINT', R.CLEARANCE_POINT), ('OPEN_ORDER', R.OPEN_ORDER), ('BUFFER_YARD', R.BUFFER_YARD), ('PICKUP_DT', R.PICKUP_DT), ('CNTR_DISPATCH_DT', R.CNTR_DISPATCH_DT), ('CNTR_REPORT_NS_DT', R.CNTR_REPORT_NS_DT), ('CNTR_GATEDIN_DT', R.CNTR_GATEDIN_DT)) U (K, V)
                          JOIN @REG G ON G.K = U.K
                CROSS APPLY (SELECT LTRIM(RTRIM(ISNULL(U.V, N''))) AS S) Z0
                CROSS APPLY (SELECT
                    CASE WHEN Z0.S = N'' THEN NULL
                         WHEN G.TKIND = 't' THEN CONVERT(VARCHAR(500), LEFT(Z0.S, G.TLEN))
                         WHEN G.TKIND = 'h' AND UPPER(Z0.S) IN (N'YES', N'Y', N'HAZ') THEN 'Y'
                         WHEN G.TKIND = 'h' AND UPPER(Z0.S) IN (N'NO', N'N') THEN 'N'
                         WHEN G.TKIND = 'd' AND Z0.S LIKE '[0-3][0-9]-[01][0-9]-[12][0-9][0-9][0-9]' AND ISDATE(Z0.S) = 1
                             THEN REPLACE(CONVERT(VARCHAR(10), Z0.S), '-', '/')
                    END AS TV,
                    CASE WHEN Z0.S = N'' OR G.TKIND = 't' THEN 1
                         WHEN G.TKIND = 'h' AND UPPER(Z0.S) IN (N'YES', N'Y', N'HAZ', N'NO', N'N') THEN 1
                         WHEN G.TKIND = 'd' AND Z0.S LIKE '[0-3][0-9]-[01][0-9]-[12][0-9][0-9][0-9]' AND ISDATE(Z0.S) = 1 THEN 1
                         ELSE 0 END AS MAPOK) Z1
                   WHERE  Z1.MAPOK = 1 AND Z1.TV IS NOT NULL) X
            WHERE  X.RN = 1;
            EXEC dbo.USP_EXPT_SHEET_TRACK_MIRROR @USER_ID, @FIELDS OUTPUT;
        IF @TC = 0 COMMIT TRANSACTION;
            SET @STATUSTEXT = CONVERT(NVARCHAR(10), @N) + N' row(s) linked to ' + @EXPTNO
                              + CASE WHEN @FIELDS > 0 THEN N'; ' + CONVERT(NVARCHAR(10), @FIELDS) + N' tracking field(s) updated' ELSE N'' END + N'.';
        END TRY
        BEGIN CATCH
            DECLARE @ERR NVARCHAR(2048);
            SET @ERR = ERROR_MESSAGE();
            IF XACT_STATE() = -1 OR (XACT_STATE() = 1 AND @TC = 0)
            BEGIN
                ROLLBACK TRANSACTION;
            END
            ELSE IF XACT_STATE() = 1
            BEGIN
                ROLLBACK TRANSACTION EXPT_SHEET_LINK;
            END
            SELECT @N = 0, @FIELDS = 0;
            SELECT @STATUS = '101', @STATUSTEXT = N'Not linked: ' + @ERR;
            IF @TC > 0 AND @@TRANCOUNT = 0
                RAISERROR(N'%s (the caller''s transaction could not be kept and was rolled back)', 16, 1, @ERR);
        END CATCH
    END

    -- self-test hook: only TEST_EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql creates #EXPT_SHEET_SELFTEST
    IF OBJECT_ID('tempdb..#EXPT_SHEET_SELFTEST') IS NOT NULL
        INSERT INTO #EXPT_SHEET_SELFTEST (PROC_NAME, STATUS, STATUSTEXT, N1, N2, N3)
        VALUES ('LINK_APPLY:' + @ACTION + '', @STATUS, @STATUSTEXT, @N, @FIELDS, NULL);
    SELECT @STATUS AS STATUS, @STATUSTEXT AS STATUSTEXT, @EXPTNO AS EXPTNO, @N AS ROWS_LINKED, @FIELDS AS TRACKING_FIELDS;
    IF @STATUS = '100'
    BEGIN
        INSERT INTO #SHEET_IDS (ID) SELECT ID FROM @L;
        EXEC dbo.USP_EXPT_SHEET_ROWS_OUT 1;
    END
END
GO

/* ---- dbo.USP_EXPT_SHEET_MONTHS ----------------------------------------------------------------- */
IF OBJECT_ID('dbo.USP_EXPT_SHEET_MONTHS', 'P') IS NOT NULL
    DROP PROCEDURE dbo.USP_EXPT_SHEET_MONTHS;      -- step 1 made sure it is this script's own
GO
CREATE PROCEDURE dbo.USP_EXPT_SHEET_MONTHS
    @CMPCODE  VARCHAR(6),
    @CITYCODE VARCHAR(3)
AS
BEGIN
    -- Deployed by links-22/_DB_FIX/EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql (Export > Sheet view). Do not edit here: change that script.
    -- MONTHS(CMPCODE, CITYCODE). Table: ID, CMPCODE, CITYCODE, SHEET_MONTH, TITLE, ROWVER, TABS, MODIFY_ID, MODIFY_DT - newest month first.
    SET NOCOUNT ON;
    SELECT ID, CMPCODE, CITYCODE, SHEET_MONTH, TITLE, ROWVER, TABS, MODIFY_ID, MODIFY_DT
    FROM   dbo.TBL_EXPT_SHEET_MONTH
    WHERE  CMPCODE = LTRIM(RTRIM(ISNULL(@CMPCODE, ''))) AND CITYCODE = LTRIM(RTRIM(ISNULL(@CITYCODE, '')))
    ORDER BY SHEET_MONTH DESC, ID DESC;
END
GO

/* ---- dbo.USP_EXPT_SHEET_MONTH_IU --------------------------------------------------------------- */
IF OBJECT_ID('dbo.USP_EXPT_SHEET_MONTH_IU', 'P') IS NOT NULL
    DROP PROCEDURE dbo.USP_EXPT_SHEET_MONTH_IU;      -- step 1 made sure it is this script's own
GO
CREATE PROCEDURE dbo.USP_EXPT_SHEET_MONTH_IU
    @ID           INT,
    @CMPCODE      VARCHAR(6),
    @CITYCODE     VARCHAR(3),
    @SHEET_MONTH  VARCHAR(7),
    @TITLE        NVARCHAR(100),
    @TABS         NVARCHAR(MAX),
    @ROWVER       INT,
    @COPY_FROM_ID INT,
    @CARRY_ROWS   BIT,
    @USER_ID      VARCHAR(50),
    @USER_NAME    NVARCHAR(100)
AS
BEGIN
    -- Deployed by links-22/_DB_FIX/EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql (Export > Sheet view). Do not edit here: change that script.
    -- MONTH_IU(ID, CMPCODE, CITYCODE, SHEET_MONTH, TITLE, TABS, ROWVER, COPY_FROM_ID, CARRY_ROWS, USER_ID, USER_NAME).
    -- ID = 0: a new month (102 when CMPCODE + CITYCODE + SHEET_MONTH exists; Table then carries the existing month). With
    -- COPY_FROM_ID (a month of the same company / branch) it takes that month's TABS (unless TABS is sent), every TABMETA row and
    -- the PRICE / DGD / VEHWEIGHTS grid rows (BOOKINGS starts empty); CARRY_ROWS = 1 also copies the WO rows whose STATUS_CODE
    -- is not COMPLETE, links, formats and order kept (logged as 'insert' on the new rows).
    -- ID > 0: TITLE / TABS ('' = keep) with a version check on ROWVER (102 when it moved on). SHEET_MONTH is not changed.
    -- Table: STATUS, STATUSTEXT, ID, CMPCODE, CITYCODE, SHEET_MONTH, TITLE, ROWVER, TABS, CARRIED_ROWS, COPIED_GRID_ROWS,
    -- COPIED_TAB_META; Table1: the month row (MONTHS shape) when there is one.
    SET NOCOUNT ON;
    IF @@TRANCOUNT = 0 SET XACT_ABORT ON ELSE SET XACT_ABORT OFF;
    DECLARE @STATUS VARCHAR(3), @STATUSTEXT NVARCHAR(1000), @NOW DATETIME, @TC INT, @NEW_ID INT, @CARRIED INT, @GRIDS INT, @METAS INT,
            @SRC_MONTH CHAR(7), @SRC_TABS NVARCHAR(MAX), @CUR_VER INT, @OLD_TITLE NVARCHAR(100), @OLD_TABS NVARCHAR(MAX);
    DECLARE @MAPW TABLE (SRC_ID INT NOT NULL, NEW_ID INT NOT NULL PRIMARY KEY);
    DECLARE @MAPG TABLE (SRC_ID INT NOT NULL, NEW_ID INT NOT NULL PRIMARY KEY);
    SELECT @STATUS = '100', @STATUSTEXT = N'', @NOW = GETDATE(), @CARRIED = 0, @GRIDS = 0, @METAS = 0;
    SELECT @ID = ISNULL(@ID, 0), @COPY_FROM_ID = ISNULL(@COPY_FROM_ID, 0), @CARRY_ROWS = ISNULL(@CARRY_ROWS, 0),
           @CMPCODE = LTRIM(RTRIM(ISNULL(@CMPCODE, ''))), @CITYCODE = LTRIM(RTRIM(ISNULL(@CITYCODE, ''))),
           @SHEET_MONTH = LTRIM(RTRIM(ISNULL(@SHEET_MONTH, ''))), @TITLE = NULLIF(LTRIM(RTRIM(@TITLE)), N''),
           @TABS = NULLIF(LTRIM(RTRIM(@TABS)), N''), @USER_ID = LTRIM(RTRIM(ISNULL(@USER_ID, '')));

    IF @USER_ID = ''
        SELECT @STATUS = '101', @STATUSTEXT = N'USER_ID is required.';
    ELSE IF @ID = 0
    BEGIN
        IF @CMPCODE = '' OR @CITYCODE = ''
            SELECT @STATUS = '101', @STATUSTEXT = N'CMPCODE and CITYCODE are required.';
        ELSE IF NOT (@SHEET_MONTH LIKE '[12][0-9][0-9][0-9]-[01][0-9]' AND SUBSTRING(@SHEET_MONTH, 6, 2) BETWEEN '01' AND '12')
            SELECT @STATUS = '101', @STATUSTEXT = N'SHEET_MONTH must be YYYY-MM.';
        ELSE IF EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_MONTH WHERE CMPCODE = @CMPCODE AND CITYCODE = @CITYCODE AND SHEET_MONTH = @SHEET_MONTH)
            SELECT @STATUS = '102', @STATUSTEXT = N'The month ' + @SHEET_MONTH + N' already exists for this company / branch.',
                   @NEW_ID = (SELECT MIN(ID) FROM dbo.TBL_EXPT_SHEET_MONTH WHERE CMPCODE = @CMPCODE AND CITYCODE = @CITYCODE AND SHEET_MONTH = @SHEET_MONTH);
        ELSE IF @COPY_FROM_ID > 0
        BEGIN
            SELECT @SRC_MONTH = SHEET_MONTH, @SRC_TABS = TABS FROM dbo.TBL_EXPT_SHEET_MONTH
            WHERE  ID = @COPY_FROM_ID AND CMPCODE = @CMPCODE AND CITYCODE = @CITYCODE;
            IF @SRC_MONTH IS NULL
                SELECT @STATUS = '103', @STATUSTEXT = N'The month to copy from was not found in this company / branch.';
        END
    END
    ELSE
    BEGIN
        SELECT @CUR_VER = ROWVER, @OLD_TITLE = TITLE, @OLD_TABS = TABS FROM dbo.TBL_EXPT_SHEET_MONTH WHERE ID = @ID;
        IF @CUR_VER IS NULL
            SELECT @STATUS = '103', @STATUSTEXT = N'Month not found.';
        ELSE IF ISNULL(@ROWVER, -1) <> @CUR_VER
            SELECT @STATUS = '102', @STATUSTEXT = N'The month was changed by someone else meanwhile - reload it.', @NEW_ID = @ID;
    END

    IF @STATUS = '100'
    BEGIN
        SET @TC = @@TRANCOUNT;
        BEGIN TRY
        IF @TC = 0 BEGIN BEGIN TRANSACTION; END ELSE BEGIN SAVE TRANSACTION EXPT_SHEET_MONTH; END
            SET @NOW = GETDATE();
            -- checked again under lock: two users creating the same month, or saving the same version, at the same moment
            IF @ID = 0 AND EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_MONTH WITH (UPDLOCK, HOLDLOCK)
                                   WHERE CMPCODE = @CMPCODE AND CITYCODE = @CITYCODE AND SHEET_MONTH = @SHEET_MONTH)
                SELECT @STATUS = '102', @STATUSTEXT = N'The month ' + @SHEET_MONTH + N' already exists for this company / branch.',
                       @NEW_ID = (SELECT MIN(ID) FROM dbo.TBL_EXPT_SHEET_MONTH WHERE CMPCODE = @CMPCODE AND CITYCODE = @CITYCODE AND SHEET_MONTH = @SHEET_MONTH);
            IF @ID > 0
            BEGIN
                SELECT @CUR_VER = ROWVER, @OLD_TITLE = TITLE, @OLD_TABS = TABS FROM dbo.TBL_EXPT_SHEET_MONTH WITH (UPDLOCK, HOLDLOCK) WHERE ID = @ID;
                IF ISNULL(@ROWVER, -1) <> @CUR_VER
                    SELECT @STATUS = '102', @STATUSTEXT = N'The month was changed by someone else meanwhile - reload it.', @NEW_ID = @ID;
            END
            IF @STATUS = '100' AND @ID = 0
            BEGIN
                INSERT INTO dbo.TBL_EXPT_SHEET_MONTH (CMPCODE, CITYCODE, SHEET_MONTH, TITLE, TABS, ROWVER, MAKER_ID, MAKER_DT, MODIFY_ID, MODIFY_DT)
                VALUES (@CMPCODE, @CITYCODE, @SHEET_MONTH, @TITLE, ISNULL(@TABS, @SRC_TABS), 1, @USER_ID, @NOW, @USER_ID, @NOW);
                SET @NEW_ID = SCOPE_IDENTITY();
                INSERT INTO dbo.TBL_EXPT_SHEET_LOG (ROW_KIND, ROW_ID, COL_KEY, OLD_VALUE, NEW_VALUE, ACTION, USER_ID, USER_NAME, LOG_DT)
                VALUES ('M', @NEW_ID, NULL, NULL, @SHEET_MONTH + ISNULL(N' copied from ' + @SRC_MONTH, N''), 'insert', @USER_ID, @USER_NAME, @NOW);

                IF @COPY_FROM_ID > 0
                BEGIN
                    INSERT INTO dbo.TBL_EXPT_SHEET_TABMETA (MONTH_ID, TAB_CODE, META, ROWVER, MODIFY_ID, MODIFY_DT)
                    SELECT @NEW_ID, TAB_CODE, META, 1, @USER_ID, @NOW FROM dbo.TBL_EXPT_SHEET_TABMETA WHERE MONTH_ID = @COPY_FROM_ID;
                    SET @METAS = @@ROWCOUNT;

                    MERGE dbo.TBL_EXPT_SHEET_GRIDROW AS T
                    USING (SELECT G.ID, G.TAB_CODE, G.SORT_ORDER, G.DATA, G.CELL_FMT FROM dbo.TBL_EXPT_SHEET_GRIDROW G
                           WHERE G.MONTH_ID = @COPY_FROM_ID AND G.ISDELETED = 0 AND G.TAB_CODE IN ('PRICE', 'DGD', 'VEHWEIGHTS')) AS S
                    ON 1 = 0
                    WHEN NOT MATCHED THEN
                        INSERT (MONTH_ID, TAB_CODE, SORT_ORDER, DATA, CELL_FMT, ROWVER, ISDELETED, MAKER_ID, MAKER_DT, MODIFY_ID, MODIFY_DT)
                        VALUES (@NEW_ID, S.TAB_CODE, S.SORT_ORDER, S.DATA, S.CELL_FMT, 1, 0, @USER_ID, @NOW, @USER_ID, @NOW)
                    OUTPUT S.ID, INSERTED.ID INTO @MAPG (SRC_ID, NEW_ID);
                    SET @GRIDS = (SELECT COUNT(*) FROM @MAPG);
                    INSERT INTO dbo.TBL_EXPT_SHEET_LOG (ROW_KIND, ROW_ID, COL_KEY, OLD_VALUE, NEW_VALUE, ACTION, USER_ID, USER_NAME, LOG_DT)
                    SELECT 'G', NEW_ID, NULL, NULL, N'copied from row ' + CONVERT(NVARCHAR(10), SRC_ID) + N' of ' + @SRC_MONTH, 'insert', @USER_ID, @USER_NAME, @NOW
                    FROM   @MAPG;

                    IF @CARRY_ROWS = 1
                    BEGIN
                        MERGE dbo.TBL_EXPT_SHEET_ROW AS T
                        USING (SELECT R.* FROM dbo.TBL_EXPT_SHEET_ROW R
                               WHERE R.MONTH_ID = @COPY_FROM_ID AND R.ISDELETED = 0 AND ISNULL(R.STATUS_CODE, '') <> 'COMPLETE') AS S
                        ON 1 = 0
                        WHEN NOT MATCHED THEN
                            INSERT (MONTH_ID, TAB_CODE, SORT_ORDER, STATUS_CODE, EXPTNO,
                                    WO, PORT, COUNTRY, VEH, QTY, CONT, CNTR_TYPE, STUFFING_DT, VSL_NAME, DO_ETD, SLINE, AGENT, DO_RECEIVE_DT,
                                    BOOKING_NO, TRANSPORTER, CARGO_TYPE, PLANT, PO_NO, LC_NO, LC_DATE, HAZ, CONSIGNEE, REMARK1, DO_GIVEN_DT,
                                    CONTAINER_NO, POL_GATE, GATE_OPEN_DT, GATE_CUTOFF_DT, SI_CUTOFF_DT, DO_ETD2, CURRENT_ETD, ETA_DEST,
                                    FINAL_VSL_SOB, VGM_SUBMITTED_DT, SI_SUBMITTED_DT, BL_NO, BL_DT, BL_HANDOVER_DT, FF_JOB, SLINE_PAYMENT_STATUS,
                                    CLEARANCE_POINT, OPEN_ORDER, BUFFER_YARD, EDOC_STATUS, COURIER_DT, PICKUP_DT, CNTR_DISPATCH_DT,
                                    CNTR_REPORT_NS_DT, CNTR_GATEDIN_DT, SB_NO, SB_DT, FOR_HBL,
                                    CELL_FMT, ROWVER, ISDELETED, MAKER_ID, MAKER_DT, MODIFY_ID, MODIFY_DT)
                            VALUES (@NEW_ID, S.TAB_CODE, S.SORT_ORDER, S.STATUS_CODE, S.EXPTNO,
                                    S.WO, S.PORT, S.COUNTRY, S.VEH, S.QTY, S.CONT, S.CNTR_TYPE, S.STUFFING_DT, S.VSL_NAME, S.DO_ETD, S.SLINE,
                                    S.AGENT, S.DO_RECEIVE_DT, S.BOOKING_NO, S.TRANSPORTER, S.CARGO_TYPE, S.PLANT, S.PO_NO, S.LC_NO, S.LC_DATE,
                                    S.HAZ, S.CONSIGNEE, S.REMARK1, S.DO_GIVEN_DT, S.CONTAINER_NO, S.POL_GATE, S.GATE_OPEN_DT, S.GATE_CUTOFF_DT,
                                    S.SI_CUTOFF_DT, S.DO_ETD2, S.CURRENT_ETD, S.ETA_DEST, S.FINAL_VSL_SOB, S.VGM_SUBMITTED_DT, S.SI_SUBMITTED_DT,
                                    S.BL_NO, S.BL_DT, S.BL_HANDOVER_DT, S.FF_JOB, S.SLINE_PAYMENT_STATUS, S.CLEARANCE_POINT, S.OPEN_ORDER,
                                    S.BUFFER_YARD, S.EDOC_STATUS, S.COURIER_DT, S.PICKUP_DT, S.CNTR_DISPATCH_DT, S.CNTR_REPORT_NS_DT,
                                    S.CNTR_GATEDIN_DT, S.SB_NO, S.SB_DT, S.FOR_HBL,
                                    S.CELL_FMT, 1, 0, @USER_ID, @NOW, @USER_ID, @NOW)
                        OUTPUT S.ID, INSERTED.ID INTO @MAPW (SRC_ID, NEW_ID);
                        SET @CARRIED = (SELECT COUNT(*) FROM @MAPW);
                        INSERT INTO dbo.TBL_EXPT_SHEET_LOG (ROW_KIND, ROW_ID, COL_KEY, OLD_VALUE, NEW_VALUE, ACTION, USER_ID, USER_NAME, LOG_DT)
                        SELECT 'W', NEW_ID, NULL, NULL, N'carried from row ' + CONVERT(NVARCHAR(10), SRC_ID) + N' of ' + @SRC_MONTH, 'insert', @USER_ID, @USER_NAME, @NOW
                        FROM   @MAPW;
                    END
                END
                SET @STATUSTEXT = N'Month ' + @SHEET_MONTH + N' created'
                    + CASE WHEN @COPY_FROM_ID > 0 THEN N' from ' + @SRC_MONTH + N' (' + CONVERT(NVARCHAR(10), @METAS) + N' tab layout(s), '
                           + CONVERT(NVARCHAR(10), @GRIDS) + N' grid row(s), ' + CONVERT(NVARCHAR(10), @CARRIED) + N' WO row(s) carried)' ELSE N'' END + N'.';
            END
            ELSE IF @STATUS = '100'
            BEGIN
                UPDATE dbo.TBL_EXPT_SHEET_MONTH
                SET    TITLE = ISNULL(@TITLE, TITLE), TABS = ISNULL(@TABS, TABS), ROWVER = ROWVER + 1, MODIFY_ID = @USER_ID, MODIFY_DT = @NOW
                WHERE  ID = @ID;
                SET @NEW_ID = @ID;
                INSERT INTO dbo.TBL_EXPT_SHEET_LOG (ROW_KIND, ROW_ID, COL_KEY, OLD_VALUE, NEW_VALUE, ACTION, USER_ID, USER_NAME, LOG_DT)
                SELECT 'M', @ID, X.K, X.O, X.N, 'edit', @USER_ID, @USER_NAME, @NOW
                FROM  (SELECT 'TITLE' AS K, CONVERT(NVARCHAR(2000), @OLD_TITLE) AS O, CONVERT(NVARCHAR(2000), @TITLE) AS N
                       WHERE @TITLE IS NOT NULL AND ISNULL(@OLD_TITLE, N'') <> @TITLE
                       UNION ALL
                       SELECT 'TABS', LEFT(@OLD_TABS, 2000), LEFT(@TABS, 2000)
                       WHERE @TABS IS NOT NULL AND ISNULL(@OLD_TABS, N'') <> @TABS) X;
                SET @STATUSTEXT = N'Month saved.';
            END
        IF @TC = 0 COMMIT TRANSACTION;
        END TRY
        BEGIN CATCH
            DECLARE @ERR NVARCHAR(2048);
            SET @ERR = ERROR_MESSAGE();
            IF XACT_STATE() = -1 OR (XACT_STATE() = 1 AND @TC = 0)
            BEGIN
                ROLLBACK TRANSACTION;
            END
            ELSE IF XACT_STATE() = 1
            BEGIN
                ROLLBACK TRANSACTION EXPT_SHEET_MONTH;
            END
            SELECT @CARRIED = 0, @GRIDS = 0, @METAS = 0, @NEW_ID = CASE WHEN @ID > 0 THEN @ID END;
            SELECT @STATUS = '101', @STATUSTEXT = N'Month not saved: ' + @ERR;
            IF @TC > 0 AND @@TRANCOUNT = 0
                RAISERROR(N'%s (the caller''s transaction could not be kept and was rolled back)', 16, 1, @ERR);
        END CATCH
    END

    -- self-test hook: only TEST_EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql creates #EXPT_SHEET_SELFTEST
    IF OBJECT_ID('tempdb..#EXPT_SHEET_SELFTEST') IS NOT NULL
        INSERT INTO #EXPT_SHEET_SELFTEST (PROC_NAME, STATUS, STATUSTEXT, N1, N2, N3)
        VALUES ('MONTH_IU', @STATUS, @STATUSTEXT, @NEW_ID, @CARRIED, @GRIDS);
    SELECT @STATUS AS STATUS, @STATUSTEXT AS STATUSTEXT, M.ID, M.CMPCODE, M.CITYCODE, M.SHEET_MONTH, M.TITLE, M.ROWVER, M.TABS,
           @CARRIED AS CARRIED_ROWS, @GRIDS AS COPIED_GRID_ROWS, @METAS AS COPIED_TAB_META
    FROM   (SELECT 1 AS ONE) O LEFT JOIN dbo.TBL_EXPT_SHEET_MONTH M ON M.ID = @NEW_ID;
    IF @NEW_ID IS NOT NULL
        SELECT ID, CMPCODE, CITYCODE, SHEET_MONTH, TITLE, ROWVER, TABS, MODIFY_ID, MODIFY_DT FROM dbo.TBL_EXPT_SHEET_MONTH WHERE ID = @NEW_ID;
END
GO

/* ---- dbo.USP_EXPT_SHEET_LOAD ------------------------------------------------------------------- */
IF OBJECT_ID('dbo.USP_EXPT_SHEET_LOAD', 'P') IS NOT NULL
    DROP PROCEDURE dbo.USP_EXPT_SHEET_LOAD;      -- step 1 made sure it is this script's own
GO
CREATE PROCEDURE dbo.USP_EXPT_SHEET_LOAD
    @MONTH_ID INT,
    @TAB_CODE VARCHAR(20)
AS
BEGIN
    -- Deployed by links-22/_DB_FIX/EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql (Export > Sheet view). Do not edit here: change that script.
    -- LOAD(MONTH_ID, TAB_CODE). Table: the WO rows of the tab (not deleted) - every registry column + ID, MONTH_ID, TAB_CODE,
    -- SORT_ORDER, STATUS_CODE, EXPTNO, CELL_FMT, ROWVER, ISDELETED, MAKER_*, MODIFY_*; Table1: live Links values of the linked
    -- rows - ID, EXPTNO, JOB_FOUND, JOB_CANCELLED, L_<KEY> for the 22 Links-owned keys (dd-mm-yyyy dates; '' = no Links value);
    -- Table2: AS_OF (server time at the start, the SINCE of the next CHANGES). Unknown month: Table = STATUS 103 only.
    SET NOCOUNT ON;
    DECLARE @STATUS VARCHAR(3), @STATUSTEXT NVARCHAR(1000), @AS_OF DATETIME, @N INT, @NL INT;
    SELECT @STATUS = '100', @STATUSTEXT = N'', @AS_OF = GETDATE(), @N = 0, @NL = 0;
    IF NOT EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_MONTH WHERE ID = @MONTH_ID)
    BEGIN
        SELECT @STATUS = '103', @STATUSTEXT = N'Month not found.';
        -- self-test hook: only TEST_EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql creates #EXPT_SHEET_SELFTEST
        IF OBJECT_ID('tempdb..#EXPT_SHEET_SELFTEST') IS NOT NULL
            INSERT INTO #EXPT_SHEET_SELFTEST (PROC_NAME, STATUS, STATUSTEXT, N1, N2, N3)
            VALUES ('LOAD', @STATUS, @STATUSTEXT, NULL, NULL, NULL);
        SELECT @STATUS AS STATUS, @STATUSTEXT AS STATUSTEXT;
        RETURN;
    END
    CREATE TABLE #SHEET_IDS (ID INT NOT NULL PRIMARY KEY);
    CREATE TABLE #SHEET_LK (EXPTNO VARCHAR(25) NOT NULL PRIMARY KEY, FILLED BIT NOT NULL DEFAULT 0, JOB_FOUND BIT NOT NULL DEFAULT 0,
                            JOB_CANCELLED BIT NOT NULL DEFAULT 0,
                            L_WO NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_PORT NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_COUNTRY NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_QTY NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_CONT NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_CNTR_TYPE NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_VSL_NAME NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_SLINE NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_BOOKING_NO NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_PO_NO NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_CONSIGNEE NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_CONTAINER_NO NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_CURRENT_ETD NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_ETA_DEST NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_FINAL_VSL_SOB NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_BL_NO NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_BL_DT NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_EDOC_STATUS NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_COURIER_DT NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_SB_NO NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_SB_DT NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_FOR_HBL NVARCHAR(4000) NOT NULL DEFAULT N'');
    INSERT INTO #SHEET_IDS (ID)
    SELECT ID FROM dbo.TBL_EXPT_SHEET_ROW WHERE MONTH_ID = @MONTH_ID AND TAB_CODE = LTRIM(RTRIM(ISNULL(@TAB_CODE, ''))) AND ISDELETED = 0;
    SET @N = @@ROWCOUNT;
    EXEC dbo.USP_EXPT_SHEET_ROWS_OUT 1;
    SELECT @AS_OF AS AS_OF;
    SELECT @NL = COUNT(*) FROM #SHEET_LK WHERE JOB_FOUND = 1;
    -- self-test hook: only TEST_EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql creates #EXPT_SHEET_SELFTEST
    IF OBJECT_ID('tempdb..#EXPT_SHEET_SELFTEST') IS NOT NULL
        INSERT INTO #EXPT_SHEET_SELFTEST (PROC_NAME, STATUS, STATUSTEXT, N1, N2, N3)
        VALUES ('LOAD', @STATUS, @STATUSTEXT, @N, @NL, NULL);
END
GO

/* ---- dbo.USP_EXPT_SHEET_CHANGES ---------------------------------------------------------------- */
IF OBJECT_ID('dbo.USP_EXPT_SHEET_CHANGES', 'P') IS NOT NULL
    DROP PROCEDURE dbo.USP_EXPT_SHEET_CHANGES;      -- step 1 made sure it is this script's own
GO
CREATE PROCEDURE dbo.USP_EXPT_SHEET_CHANGES
    @MONTH_ID INT,
    @TAB_CODE VARCHAR(20),
    @SINCE    DATETIME
AS
BEGIN
    -- Deployed by links-22/_DB_FIX/EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql (Export > Sheet view). Do not edit here: change that script.
    -- CHANGES(MONTH_ID, TAB_CODE, SINCE). Same shape as LOAD for the rows changed after SINCE, deleted ones included
    -- (ISDELETED = 1) so the client can drop them. The window starts 2 seconds before SINCE, so a row written while the
    -- previous call was reading is never missed; a row can therefore come twice - the client replaces rows by ID. Moves, formats
    -- and row status do not bump ROWVER (only MODIFY_DT), so the client must not keep "the copy with the higher ROWVER".
    SET NOCOUNT ON;
    DECLARE @STATUS VARCHAR(3), @STATUSTEXT NVARCHAR(1000), @AS_OF DATETIME, @N INT;
    SELECT @STATUS = '100', @STATUSTEXT = N'', @AS_OF = GETDATE(), @N = 0;
    IF NOT EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_MONTH WHERE ID = @MONTH_ID)
    BEGIN
        SELECT @STATUS = '103', @STATUSTEXT = N'Month not found.';
        SELECT @STATUS AS STATUS, @STATUSTEXT AS STATUSTEXT;
        RETURN;
    END
    CREATE TABLE #SHEET_IDS (ID INT NOT NULL PRIMARY KEY);
    CREATE TABLE #SHEET_LK (EXPTNO VARCHAR(25) NOT NULL PRIMARY KEY, FILLED BIT NOT NULL DEFAULT 0, JOB_FOUND BIT NOT NULL DEFAULT 0,
                            JOB_CANCELLED BIT NOT NULL DEFAULT 0,
                            L_WO NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_PORT NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_COUNTRY NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_QTY NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_CONT NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_CNTR_TYPE NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_VSL_NAME NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_SLINE NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_BOOKING_NO NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_PO_NO NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_CONSIGNEE NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_CONTAINER_NO NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_CURRENT_ETD NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_ETA_DEST NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_FINAL_VSL_SOB NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_BL_NO NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_BL_DT NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_EDOC_STATUS NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_COURIER_DT NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_SB_NO NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_SB_DT NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_FOR_HBL NVARCHAR(4000) NOT NULL DEFAULT N'');
    INSERT INTO #SHEET_IDS (ID)
    SELECT ID FROM dbo.TBL_EXPT_SHEET_ROW
    WHERE  MONTH_ID = @MONTH_ID AND TAB_CODE = LTRIM(RTRIM(ISNULL(@TAB_CODE, '')))
      AND  MODIFY_DT > DATEADD(SECOND, -2, ISNULL(@SINCE, '19000101'));
    SET @N = @@ROWCOUNT;
    EXEC dbo.USP_EXPT_SHEET_ROWS_OUT 1;
    SELECT @AS_OF AS AS_OF;
    -- self-test hook: only TEST_EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql creates #EXPT_SHEET_SELFTEST
    IF OBJECT_ID('tempdb..#EXPT_SHEET_SELFTEST') IS NOT NULL
        INSERT INTO #EXPT_SHEET_SELFTEST (PROC_NAME, STATUS, STATUSTEXT, N1, N2, N3)
        VALUES ('CHANGES', @STATUS, @STATUSTEXT, @N, NULL, NULL);
END
GO

/* ---- dbo.USP_EXPT_SHEET_SAVE_CELLS ------------------------------------------------------------- */
IF OBJECT_ID('dbo.USP_EXPT_SHEET_SAVE_CELLS', 'P') IS NOT NULL
    DROP PROCEDURE dbo.USP_EXPT_SHEET_SAVE_CELLS;      -- step 1 made sure it is this script's own
GO
CREATE PROCEDURE dbo.USP_EXPT_SHEET_SAVE_CELLS
    @MONTH_ID  INT,
    @TAB_CODE  VARCHAR(20),
    @EDITS     NVARCHAR(MAX),
    @USER_ID   VARCHAR(50),
    @USER_NAME NVARCHAR(100)
AS
BEGIN
    -- Deployed by links-22/_DB_FIX/EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql (Export > Sheet view). Do not edit here: change that script.
    -- SAVE_CELLS(MONTH_ID, TAB_CODE, EDITS, USER_ID, USER_NAME). EDITS = rootless <e r="ID" v="ROWVER" k="KEY">value</e>...
    -- All checks and results: see USP_EXPT_SHEET_SAVE_APPLY.
    SET NOCOUNT ON;
    EXEC dbo.USP_EXPT_SHEET_SAVE_APPLY @MONTH_ID, @TAB_CODE, @EDITS, 'edit', @USER_ID, @USER_NAME;
END
GO

/* ---- dbo.USP_EXPT_SHEET_SAVE_FMT --------------------------------------------------------------- */
IF OBJECT_ID('dbo.USP_EXPT_SHEET_SAVE_FMT', 'P') IS NOT NULL
    DROP PROCEDURE dbo.USP_EXPT_SHEET_SAVE_FMT;      -- step 1 made sure it is this script's own
GO
CREATE PROCEDURE dbo.USP_EXPT_SHEET_SAVE_FMT
    @EDITS     NVARCHAR(MAX),
    @USER_ID   VARCHAR(50),
    @USER_NAME NVARCHAR(100)
AS
BEGIN
    -- Deployed by links-22/_DB_FIX/EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql (Export > Sheet view). Do not edit here: change that script.
    -- SAVE_FMT(EDITS, USER_ID, USER_NAME). EDITS = rootless <f r="ID" k="KEY" bg=".." fg=".." b="0/1"/> (cell format;
    -- an absent attribute keeps the stored one, bg="" / fg="" clear it) and <f r="ID" k="*ROW" s="STATUS_CODE" bg=".." fg=".." b="0/1"/>
    -- (the row: s = status from the Colour CODE legend, "" clears it; bg / fg / b = a row-level format, stored in CELL_FMT under
    -- the key *ROW). Formats are merged into the row's CELL_FMT, which this procedure keeps in one canonical JSON form
    -- ({"*ROW":{..},"KEY":{"bg":"#rrggbb","fg":"#rrggbb","b":1},...}, keys in binary order, so *ROW first) - CELL_FMT of WO rows
    -- must only be written here. No version check (formats never conflict with values) and ROWVER is not bumped; MODIFY_DT is,
    -- so CHANGES carries the row. Logged as 'fmt' (old -> new format of the cell, COL_KEY *ROW for the row format) and 'status'.
    -- Refused edits: 'invalid' (bad id / key / colour / status code, or a stored CELL_FMT that is not canonical), 'notfound'.
    -- Results: Table STATUS (100, else 103 > 101), STATUSTEXT, CELLS, STATUSES, REJECTED; Table1 refused (ID, KEY, REASON);
    -- Table2 + Table3 the rows touched (LOAD shape).
    SET NOCOUNT ON;
    SET ARITHABORT ON;
    DECLARE @STATUS VARCHAR(3), @STATUSTEXT NVARCHAR(1000), @NOW DATETIME, @X XML, @TC INT, @CELLS INT, @STATS INT, @REJECTED INT, @PARSED BIT;
    SELECT @STATUS = '100', @STATUSTEXT = N'', @NOW = GETDATE(), @CELLS = 0, @STATS = 0, @REJECTED = 0, @PARSED = 0;
    SET @USER_ID = LTRIM(RTRIM(ISNULL(@USER_ID, '')));
    DECLARE @REG TABLE (K VARCHAR(40) NOT NULL PRIMARY KEY, KIND VARCHAR(10) NOT NULL, IS_L BIT NOT NULL, TCOL VARCHAR(40) NULL,
                        TKIND CHAR(1) NULL, TLEN INT NULL, MAXLEN INT NOT NULL, OWNER VARCHAR(20) NOT NULL, SEQ INT NOT NULL);
    INSERT INTO @REG (K, KIND, IS_L, TCOL, TKIND, TLEN, MAXLEN, OWNER, SEQ) VALUES
        ('WO', 'text', 1, NULL, NULL, NULL, 500, 'OPS', 1),
        ('PORT', 'choice', 1, NULL, NULL, NULL, 500, 'OPS', 2),
        ('COUNTRY', 'choice', 1, NULL, NULL, NULL, 500, 'OPS', 3),
        ('VEH', 'ml', 0, 'VEHICLE_MODEL', 't', 100, 2000, 'OPS', 4),
        ('QTY', 'num', 1, NULL, NULL, NULL, 500, 'OPS', 5),
        ('CONT', 'num', 1, NULL, NULL, NULL, 500, 'OPS', 6),
        ('CNTR_TYPE', 'choice', 1, NULL, NULL, NULL, 500, 'OPS', 7),
        ('STUFFING_DT', 'date', 0, 'STUFFING_DT', 'd', NULL, 500, 'OPS', 8),
        ('VSL_NAME', 'choice', 1, NULL, NULL, NULL, 500, 'BOOKING', 9),
        ('DO_ETD', 'date', 0, 'DO_ETD', 'd', NULL, 500, 'OPS', 10),
        ('SLINE', 'choice', 1, NULL, NULL, NULL, 500, 'BOOKING', 11),
        ('AGENT', 'choice', 0, NULL, NULL, NULL, 500, 'OPS', 12),
        ('DO_RECEIVE_DT', 'date', 0, 'DO_RECEIVE_DT', 'd', NULL, 500, 'OPS', 13),
        ('BOOKING_NO', 'text', 1, NULL, NULL, NULL, 500, 'OPS', 14),
        ('TRANSPORTER', 'choice', 0, 'TRANSPORTER', 't', 100, 500, 'OPS', 15),
        ('CARGO_TYPE', 'choice', 0, 'CARGO_TYPE', 't', 10, 500, 'OPS', 16),
        ('PLANT', 'choice', 0, 'PLANT', 't', 50, 500, 'OPS', 17),
        ('PO_NO', 'text', 1, NULL, NULL, NULL, 500, 'OPS', 18),
        ('LC_NO', 'text', 0, 'LC_NO', 't', 50, 500, 'OPS', 19),
        ('LC_DATE', 'date', 0, 'LC_DATE', 'd', NULL, 500, 'OPS', 20),
        ('HAZ', 'choice', 0, 'HAZ', 'h', 1, 500, 'OPS', 21),
        ('CONSIGNEE', 'choice', 1, NULL, NULL, NULL, 500, 'OPS', 22),
        ('REMARK1', 'ml', 0, 'REMARK1', 't', 500, 2000, 'ALL', 23),
        ('DO_GIVEN_DT', 'date', 0, 'DO_GIVEN_DT', 'd', NULL, 500, 'OPS', 24),
        ('CONTAINER_NO', 'ml', 1, NULL, NULL, NULL, 2000, 'OPSLEAD', 25),
        ('POL_GATE', 'choice', 0, 'POL_GATE', 't', 50, 500, 'OPS', 26),
        ('GATE_OPEN_DT', 'date', 0, 'GATE_OPEN_DT', 'd', NULL, 500, 'OPS', 27),
        ('GATE_CUTOFF_DT', 'date', 0, 'GATE_CUTOFF_DT', 'd', NULL, 500, 'OPS', 28),
        ('SI_CUTOFF_DT', 'date', 0, 'SI_CUTOFF_DT', 'd', NULL, 500, 'OPS', 29),
        ('DO_ETD2', 'date', 0, NULL, NULL, NULL, 500, 'OPS', 30),
        ('CURRENT_ETD', 'date', 1, NULL, NULL, NULL, 500, 'OPS', 31),
        ('ETA_DEST', 'date', 1, NULL, NULL, NULL, 500, 'OPS', 32),
        ('FINAL_VSL_SOB', 'date', 1, NULL, NULL, NULL, 500, 'OPS', 33),
        ('VGM_SUBMITTED_DT', 'date', 0, 'VGM_SUBMITTED_DT', 'd', NULL, 500, 'DOCS', 34),
        ('SI_SUBMITTED_DT', 'date', 0, 'SI_SUBMITTED_DT', 'd', NULL, 500, 'DOCS', 35),
        ('BL_NO', 'text', 1, NULL, NULL, NULL, 500, 'BLDESK', 36),
        ('BL_DT', 'date', 1, NULL, NULL, NULL, 500, 'OPS', 37),
        ('BL_HANDOVER_DT', 'date', 0, 'BL_HANDOVER_DT', 'd', NULL, 500, 'BLDESK', 38),
        ('FF_JOB', 'text', 0, NULL, NULL, NULL, 500, 'BLDESK', 39),
        ('SLINE_PAYMENT_STATUS', 'text', 0, 'SLINE_PAYMENT_STATUS', 't', 100, 500, 'OPS', 40),
        ('CLEARANCE_POINT', 'choice', 0, 'CLEARANCE_POINT', 't', 50, 500, 'OPSLEAD', 41),
        ('OPEN_ORDER', 'choice', 0, 'OPEN_ORDER', 't', 50, 500, 'OPSLEAD', 42),
        ('BUFFER_YARD', 'text', 0, 'BUFFER_YARD', 't', 50, 500, 'OPSLEAD', 43),
        ('EDOC_STATUS', 'text', 1, NULL, NULL, NULL, 500, 'DOCS', 44),
        ('COURIER_DT', 'date', 1, NULL, NULL, NULL, 500, 'DOCS', 45),
        ('PICKUP_DT', 'date', 0, 'PICKUP_DT', 'd', NULL, 500, 'YARD', 46),
        ('CNTR_DISPATCH_DT', 'date', 0, 'CNTR_DISPATCH_DT', 'd', NULL, 500, 'OPS', 47),
        ('CNTR_REPORT_NS_DT', 'date', 0, 'CNTR_REPORT_NS_DT', 'd', NULL, 500, 'YARD', 48),
        ('CNTR_GATEDIN_DT', 'date', 0, 'CNTR_GATEDIN_DT', 'd', NULL, 500, 'YARD', 49),
        ('SB_NO', 'text', 1, NULL, NULL, NULL, 500, 'OPSLEAD', 50),
        ('SB_DT', 'date', 1, NULL, NULL, NULL, 500, 'OPSLEAD', 51),
        ('FOR_HBL', 'text', 1, NULL, NULL, NULL, 500, 'OPS', 52);
    CREATE TABLE #SHEET_IDS (ID INT NOT NULL PRIMARY KEY);
    CREATE TABLE #SHEET_LK (EXPTNO VARCHAR(25) NOT NULL PRIMARY KEY, FILLED BIT NOT NULL DEFAULT 0, JOB_FOUND BIT NOT NULL DEFAULT 0,
                            JOB_CANCELLED BIT NOT NULL DEFAULT 0,
                            L_WO NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_PORT NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_COUNTRY NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_QTY NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_CONT NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_CNTR_TYPE NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_VSL_NAME NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_SLINE NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_BOOKING_NO NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_PO_NO NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_CONSIGNEE NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_CONTAINER_NO NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_CURRENT_ETD NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_ETA_DEST NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_FINAL_VSL_SOB NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_BL_NO NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_BL_DT NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_EDOC_STATUS NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_COURIER_DT NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_SB_NO NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_SB_DT NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_FOR_HBL NVARCHAR(4000) NOT NULL DEFAULT N'');
    CREATE TABLE #SF_E (SEQ INT IDENTITY(1,1) NOT NULL PRIMARY KEY, R_TXT VARCHAR(50) NULL, ROW_ID INT NULL, K VARCHAR(100) NOT NULL,
                        BG VARCHAR(20) NULL, FG VARCHAR(20) NULL, B VARCHAR(5) NULL, S VARCHAR(50) NULL, REASON VARCHAR(20) NULL);
    CREATE TABLE #SF_R (ROW_ID INT NOT NULL PRIMARY KEY, OLD_FMT NVARCHAR(MAX) NULL, NEW_FMT NVARCHAR(MAX) NULL, OLD_STATUS VARCHAR(20) NULL,
                        NEW_STATUS VARCHAR(20) NULL, SET_STATUS BIT NOT NULL DEFAULT 0, FMT_OK BIT NOT NULL DEFAULT 1, TOUCHED BIT NOT NULL DEFAULT 0,
                        XML_TXT NVARCHAR(MAX) NULL);
    CREATE TABLE #SF_C (ROW_ID INT NOT NULL, K VARCHAR(40) NOT NULL, BG VARCHAR(7) NULL, FG VARCHAR(7) NULL, B BIT NOT NULL DEFAULT 0,
                        OLD_FRAG NVARCHAR(200) NULL, CUR_FRAG NVARCHAR(200) NULL, TOUCHED BIT NOT NULL DEFAULT 0, PRIMARY KEY (ROW_ID, K));
    CREATE TABLE #SF_A (ROW_ID INT NOT NULL, K VARCHAR(40) NOT NULL, BG_SEQ INT NULL, FG_SEQ INT NULL, B_SEQ INT NULL, PRIMARY KEY (ROW_ID, K));

    IF @USER_ID = ''
        SELECT @STATUS = '101', @STATUSTEXT = N'USER_ID is required.';
    ELSE
    BEGIN
        SET XACT_ABORT OFF;
        BEGIN TRY
            SET @X = CONVERT(XML, @EDITS, 1);
            INSERT INTO #SF_E (R_TXT, K, BG, FG, B, S)
            SELECT LTRIM(RTRIM(T.c.value('@r', 'VARCHAR(50)'))), UPPER(LTRIM(RTRIM(ISNULL(T.c.value('@k', 'VARCHAR(100)'), '')))),
                   LTRIM(RTRIM(T.c.value('@bg', 'VARCHAR(20)'))), LTRIM(RTRIM(T.c.value('@fg', 'VARCHAR(20)'))),
                   LTRIM(RTRIM(T.c.value('@b', 'VARCHAR(5)'))), UPPER(LTRIM(RTRIM(T.c.value('@s', 'VARCHAR(50)'))))
            FROM   @X.nodes('/f') T(c);
            SET @PARSED = 1;
        END TRY
        BEGIN CATCH
            SELECT @STATUS = '101', @STATUSTEXT = N'The edits are not valid XML: ' + ERROR_MESSAGE();
            IF XACT_STATE() = -1
            BEGIN
                ROLLBACK TRANSACTION;
                RAISERROR(N'The edits are not valid XML (the caller''s transaction was rolled back).', 16, 1);
            END
        END CATCH
        IF @@TRANCOUNT = 0 SET XACT_ABORT ON ELSE SET XACT_ABORT OFF;
        IF @STATUS = '100' AND NOT EXISTS (SELECT 1 FROM #SF_E)
            SELECT @STATUS = '101', @STATUSTEXT = N'No edits (expected <f r="ID" k="KEY" bg=".." fg=".." b="0/1"/> or <f r="ID" k="*ROW" s="CODE"/>).';
    END

    IF @STATUS = '100'
    BEGIN
        UPDATE #SF_E SET REASON = 'invalid' WHERE ISNULL(R_TXT, '') = '' OR R_TXT LIKE '%[^0-9]%' OR LEN(R_TXT) > 9;
        UPDATE #SF_E SET ROW_ID = CASE WHEN REASON IS NULL THEN CONVERT(INT, R_TXT) END;
        UPDATE E SET REASON = 'invalid' FROM #SF_E E
        WHERE  E.REASON IS NULL
          AND (   (E.K = '*ROW' AND (   (E.S IS NULL AND E.BG IS NULL AND E.FG IS NULL AND E.B IS NULL)
                                     OR (E.S IS NOT NULL AND E.S <> '' AND NOT EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_STATUS ST WHERE ST.CODE = E.S))))
               OR (E.K <> '*ROW' AND (NOT EXISTS (SELECT 1 FROM @REG G WHERE G.K = E.K) OR E.S IS NOT NULL OR (E.BG IS NULL AND E.FG IS NULL AND E.B IS NULL)))
               OR (E.BG <> '' AND NOT (LEN(E.BG) = 7 AND E.BG LIKE '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]')) OR (E.FG <> '' AND NOT (LEN(E.FG) = 7 AND E.FG LIKE '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]')) OR (E.B IS NOT NULL AND E.B NOT IN ('0', '1')));
        UPDATE E SET REASON = 'notfound' FROM #SF_E E
        WHERE  E.REASON IS NULL AND NOT EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_ROW R WHERE R.ID = E.ROW_ID AND R.ISDELETED = 0);

        SET @TC = @@TRANCOUNT;
        BEGIN TRY
        IF @TC = 0 BEGIN BEGIN TRANSACTION; END ELSE BEGIN SAVE TRANSACTION EXPT_SHEET_FMT; END
            INSERT INTO #SF_R (ROW_ID, OLD_FMT, OLD_STATUS)
            SELECT R.ID, R.CELL_FMT, R.STATUS_CODE
            FROM   dbo.TBL_EXPT_SHEET_ROW R WITH (UPDLOCK, HOLDLOCK)
            WHERE  R.ID IN (SELECT ROW_ID FROM #SF_E WHERE REASON IS NULL);

            -- the stored formats must be in the canonical form this procedure writes: only those characters, and once
            -- rewritten as <c k=".." bg=".." fg=".." b="1"/> elements no brace or colon may be left and the quotes must pair
            UPDATE #SF_R SET XML_TXT = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(OLD_FMT,
                       N'},"', N'/><c k="'), N'":{', N'" '), N'"bg":"', N'bg="'), N'"fg":"', N'fg="'),
                       N'"b":1', N'b="1"'), N'"b":0', N'b="0"'), N',', N' '), N'{"', N'<c k="'), N'}}', N'/>')
            WHERE  OLD_FMT LIKE N'{"%}}' AND PATINDEX(N'%[^A-Za-z0-9_#":,{}*]%', OLD_FMT COLLATE Latin1_General_BIN2) = 0;
            UPDATE #SF_R SET FMT_OK = 0
            WHERE  ISNULL(LTRIM(RTRIM(OLD_FMT)), N'') NOT IN (N'', N'{}')
              AND  (XML_TXT IS NULL OR NOT (    XML_TXT LIKE N'<c k="%/>'
                        AND CHARINDEX(N'{', XML_TXT) = 0 AND CHARINDEX(N'}', XML_TXT) = 0 AND CHARINDEX(N':', XML_TXT) = 0
                        AND (LEN(XML_TXT) - LEN(REPLACE(XML_TXT, N'"', N''))) % 2 = 0));
            -- an edit that changes a format cannot be applied to a stored format that cannot be read (a status-only *ROW edit can)
            UPDATE E SET REASON = 'invalid' FROM #SF_E E JOIN #SF_R F ON F.ROW_ID = E.ROW_ID
            WHERE  E.REASON IS NULL AND F.FMT_OK = 0 AND (E.BG IS NOT NULL OR E.FG IS NOT NULL OR E.B IS NOT NULL);

            INSERT INTO #SF_C (ROW_ID, K, BG, FG, B)
            SELECT P.ROW_ID, N.c.value('@k', 'VARCHAR(40)'), NULLIF(N.c.value('@bg', 'VARCHAR(7)'), ''), NULLIF(N.c.value('@fg', 'VARCHAR(7)'), ''),
                   CASE WHEN N.c.value('@b', 'VARCHAR(1)') = '1' THEN 1 ELSE 0 END
            FROM  (SELECT ROW_ID, CASE WHEN FMT_OK = 1 AND XML_TXT IS NOT NULL THEN CONVERT(XML, XML_TXT) END AS X
                   FROM   #SF_R WHERE FMT_OK = 1 AND XML_TXT IS NOT NULL) P
                   CROSS APPLY P.X.nodes('/c') N(c);
            UPDATE C SET OLD_FRAG = CASE WHEN C.BG IS NULL AND C.FG IS NULL AND C.B = 0 THEN NULL
                     ELSE N'{' + STUFF(ISNULL(N',"bg":"' + C.BG + N'"', N'') + ISNULL(N',"fg":"' + C.FG + N'"', N'')
                                       + CASE WHEN C.B = 1 THEN N',"b":1' ELSE N'' END, 1, 1, N'') + N'}' END FROM #SF_C C;

            -- per cell, each property from the last edit that sent it
            INSERT INTO #SF_A (ROW_ID, K, BG_SEQ, FG_SEQ, B_SEQ)
            SELECT ROW_ID, K, MAX(CASE WHEN BG IS NOT NULL THEN SEQ END), MAX(CASE WHEN FG IS NOT NULL THEN SEQ END), MAX(CASE WHEN B IS NOT NULL THEN SEQ END)
            FROM   #SF_E WHERE REASON IS NULL AND (BG IS NOT NULL OR FG IS NOT NULL OR B IS NOT NULL) GROUP BY ROW_ID, K;

            UPDATE C
            SET    BG = CASE WHEN A.BG_SEQ IS NULL THEN C.BG ELSE NULLIF(LOWER(EB.BG), '') END,
                   FG = CASE WHEN A.FG_SEQ IS NULL THEN C.FG ELSE NULLIF(LOWER(EF.FG), '') END,
                   B  = CASE WHEN A.B_SEQ IS NULL THEN C.B WHEN EX.B = '1' THEN 1 ELSE 0 END,
                   TOUCHED = 1
            FROM   #SF_C C JOIN #SF_A A ON A.ROW_ID = C.ROW_ID AND A.K = C.K
                   LEFT JOIN #SF_E EB ON EB.SEQ = A.BG_SEQ LEFT JOIN #SF_E EF ON EF.SEQ = A.FG_SEQ LEFT JOIN #SF_E EX ON EX.SEQ = A.B_SEQ;
            INSERT INTO #SF_C (ROW_ID, K, BG, FG, B, TOUCHED)
            SELECT A.ROW_ID, A.K, NULLIF(LOWER(EB.BG), ''), NULLIF(LOWER(EF.FG), ''), CASE WHEN EX.B = '1' THEN 1 ELSE 0 END, 1
            FROM   #SF_A A LEFT JOIN #SF_E EB ON EB.SEQ = A.BG_SEQ LEFT JOIN #SF_E EF ON EF.SEQ = A.FG_SEQ LEFT JOIN #SF_E EX ON EX.SEQ = A.B_SEQ
            WHERE  NOT EXISTS (SELECT 1 FROM #SF_C C WHERE C.ROW_ID = A.ROW_ID AND C.K = A.K);
            UPDATE C SET CUR_FRAG = CASE WHEN C.BG IS NULL AND C.FG IS NULL AND C.B = 0 THEN NULL
                     ELSE N'{' + STUFF(ISNULL(N',"bg":"' + C.BG + N'"', N'') + ISNULL(N',"fg":"' + C.FG + N'"', N'')
                                       + CASE WHEN C.B = 1 THEN N',"b":1' ELSE N'' END, 1, 1, N'') + N'}' END FROM #SF_C C;
            UPDATE #SF_C SET TOUCHED = 0
            WHERE  TOUCHED = 1 AND ISNULL(OLD_FRAG, N'') COLLATE Latin1_General_BIN2 = ISNULL(CUR_FRAG, N'') COLLATE Latin1_General_BIN2;
            SELECT @CELLS = COUNT(*) FROM #SF_C WHERE TOUCHED = 1;

            -- the canonical JSON, keys in binary order (independent of collation)
            UPDATE F SET TOUCHED = 1,
                   NEW_FMT = N'{' + STUFF((SELECT N',"' + C.K + N'":' + C.CUR_FRAG FROM #SF_C C
                                            WHERE C.ROW_ID = F.ROW_ID AND C.CUR_FRAG IS NOT NULL ORDER BY C.K COLLATE Latin1_General_BIN2
                                            FOR XML PATH(''), TYPE).value('.', 'NVARCHAR(MAX)'), 1, 1, N'') + N'}'
            FROM   #SF_R F WHERE EXISTS (SELECT 1 FROM #SF_C C WHERE C.ROW_ID = F.ROW_ID AND C.TOUCHED = 1);

            -- row status: the last *ROW edit of the row that sent s
            UPDATE F SET SET_STATUS = 1, NEW_STATUS = NULLIF(E.S, '')
            FROM   #SF_R F JOIN #SF_E E ON E.ROW_ID = F.ROW_ID AND E.REASON IS NULL AND E.K = '*ROW' AND E.S IS NOT NULL
            WHERE  E.SEQ = (SELECT MAX(E2.SEQ) FROM #SF_E E2 WHERE E2.ROW_ID = F.ROW_ID AND E2.REASON IS NULL AND E2.K = '*ROW' AND E2.S IS NOT NULL);
            UPDATE #SF_R SET SET_STATUS = 0 WHERE SET_STATUS = 1 AND ISNULL(OLD_STATUS, '') = ISNULL(NEW_STATUS, '');
            SELECT @STATS = COUNT(*) FROM #SF_R WHERE SET_STATUS = 1;

            SET @NOW = GETDATE();
            UPDATE R
            SET    CELL_FMT    = CASE WHEN F.TOUCHED = 1 THEN F.NEW_FMT ELSE R.CELL_FMT END,
                   STATUS_CODE = CASE WHEN F.SET_STATUS = 1 THEN F.NEW_STATUS ELSE R.STATUS_CODE END,
                   MODIFY_ID   = @USER_ID,
                   MODIFY_DT   = @NOW
            FROM   dbo.TBL_EXPT_SHEET_ROW R JOIN #SF_R F ON F.ROW_ID = R.ID
            WHERE  F.TOUCHED = 1 OR F.SET_STATUS = 1;

            INSERT INTO dbo.TBL_EXPT_SHEET_LOG (ROW_KIND, ROW_ID, COL_KEY, OLD_VALUE, NEW_VALUE, ACTION, USER_ID, USER_NAME, LOG_DT)
            SELECT 'W', ROW_ID, K, OLD_FRAG, CUR_FRAG, 'fmt', @USER_ID, @USER_NAME, @NOW FROM #SF_C WHERE TOUCHED = 1
            UNION ALL
            SELECT 'W', ROW_ID, '*ROW', OLD_STATUS, NEW_STATUS, 'status', @USER_ID, @USER_NAME, @NOW FROM #SF_R WHERE SET_STATUS = 1;
        IF @TC = 0 COMMIT TRANSACTION;
        END TRY
        BEGIN CATCH
            DECLARE @ERR NVARCHAR(2048);
            SET @ERR = ERROR_MESSAGE();
            IF XACT_STATE() = -1 OR (XACT_STATE() = 1 AND @TC = 0)
            BEGIN
                ROLLBACK TRANSACTION;
            END
            ELSE IF XACT_STATE() = 1
            BEGIN
                ROLLBACK TRANSACTION EXPT_SHEET_FMT;
            END
            SELECT @CELLS = 0, @STATS = 0;
            SELECT @STATUS = '101', @STATUSTEXT = N'Formats not saved: ' + @ERR;
            IF @TC > 0 AND @@TRANCOUNT = 0
                RAISERROR(N'%s (the caller''s transaction could not be kept and was rolled back)', 16, 1, @ERR);
        END CATCH
    END

    IF @PARSED = 1
    BEGIN
        SELECT @REJECTED = COUNT(*) FROM #SF_E WHERE REASON IS NOT NULL;
        IF @STATUS = '100'
            SELECT @STATUS = CASE WHEN EXISTS (SELECT 1 FROM #SF_E WHERE REASON = 'notfound') THEN '103' WHEN @REJECTED > 0 THEN '101' ELSE '100' END,
                   @STATUSTEXT = CONVERT(NVARCHAR(10), @CELLS) + N' cell format(s)' + N' and ' + CONVERT(NVARCHAR(10), @STATS) + N' row status(es) saved'
                                 + CASE WHEN @REJECTED > 0 THEN N'; ' + CONVERT(NVARCHAR(10), @REJECTED) + N' edit(s) refused' ELSE N'' END + N'.';
    END
    -- self-test hook: only TEST_EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql creates #EXPT_SHEET_SELFTEST
    IF OBJECT_ID('tempdb..#EXPT_SHEET_SELFTEST') IS NOT NULL
        INSERT INTO #EXPT_SHEET_SELFTEST (PROC_NAME, STATUS, STATUSTEXT, N1, N2, N3)
        VALUES ('SAVE_FMT', @STATUS, @STATUSTEXT, @CELLS, @STATS, @REJECTED);
    SELECT @STATUS AS STATUS, @STATUSTEXT AS STATUSTEXT, @CELLS AS CELLS, @STATS AS STATUSES, @REJECTED AS REJECTED;
    SELECT ROW_ID AS ID, K AS [KEY], REASON FROM #SF_E WHERE REASON IS NOT NULL ORDER BY SEQ;
    INSERT INTO #SHEET_IDS (ID) SELECT DISTINCT E.ROW_ID FROM #SF_E E JOIN dbo.TBL_EXPT_SHEET_ROW R ON R.ID = E.ROW_ID;
    EXEC dbo.USP_EXPT_SHEET_ROWS_OUT 1;
END
GO

/* ---- dbo.USP_EXPT_SHEET_ROWS_OP ---------------------------------------------------------------- */
IF OBJECT_ID('dbo.USP_EXPT_SHEET_ROWS_OP', 'P') IS NOT NULL
    DROP PROCEDURE dbo.USP_EXPT_SHEET_ROWS_OP;      -- step 1 made sure it is this script's own
GO
CREATE PROCEDURE dbo.USP_EXPT_SHEET_ROWS_OP
    @MONTH_ID  INT,
    @TAB_CODE  VARCHAR(20),
    @OP        VARCHAR(20),
    @IDS       VARCHAR(MAX),
    @AFTER_ID  INT,
    @COUNT     INT,
    @USER_ID   VARCHAR(50),
    @USER_NAME NVARCHAR(100)
AS
BEGIN
    -- Deployed by links-22/_DB_FIX/EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql (Export > Sheet view). Do not edit here: change that script.
    -- ROWS_OP(MONTH_ID, TAB_CODE, OP, IDS, AFTER_ID, COUNT, USER_ID, USER_NAME) for WO rows.
    --   insert    COUNT (1..1000) empty rows after AFTER_ID (0 = top); IDS ignored
    --   duplicate copies of IDS (values, status, formats and the link) each right after its source
    --   delete    soft delete (ISDELETED = 1, ROWVER + 1);  restore = undo it
    --   move      IDS, in the order given, right after AFTER_ID (0 = top); SORT_ORDER only (ROWVER unchanged)
    -- SORT_ORDER is a FLOAT placed between neighbours; when the gap gets too small the tab is renumbered (1024, 2048, ...) and every
    -- row of the tab is returned. Each row is logged ('insert' / 'delete' / 'restore' / 'move').
    -- Results: Table STATUS, STATUSTEXT, OP, ROWS_CHANGED; on success Table1 + Table2 = the affected rows (LOAD shape).
    SET NOCOUNT ON;
    IF @@TRANCOUNT = 0 SET XACT_ABORT ON ELSE SET XACT_ABORT OFF;
    DECLARE @STATUS VARCHAR(3), @STATUSTEXT NVARCHAR(1000), @NOW DATETIME, @TC INT, @N INT, @PREV FLOAT, @NEXT FLOAT, @RENUM BIT,
            @CHANGED INT, @MISS INT, @S VARCHAR(MAX), @I INT, @P INT, @LEN INT, @T VARCHAR(100), @POS INT, @BAD BIT;
    SELECT @STATUS = '100', @STATUSTEXT = N'', @NOW = GETDATE(), @RENUM = 0, @CHANGED = 0, @N = 0;
    SELECT @OP = LOWER(LTRIM(RTRIM(ISNULL(@OP, '')))), @TAB_CODE = UPPER(LTRIM(RTRIM(ISNULL(@TAB_CODE, '')))), @AFTER_ID = ISNULL(@AFTER_ID, 0),
           @COUNT = ISNULL(@COUNT, 0), @USER_ID = LTRIM(RTRIM(ISNULL(@USER_ID, '')));
    DECLARE @L TABLE (ID INT NOT NULL PRIMARY KEY, POS INT NOT NULL);
    DECLARE @AFF TABLE (ID INT NOT NULL PRIMARY KEY);
    DECLARE @CHG TABLE (ID INT NOT NULL PRIMARY KEY, OLD_ORDER FLOAT NULL, NEW_ORDER FLOAT NULL);
    DECLARE @SRC TABLE (ID INT NOT NULL PRIMARY KEY, NEW_ORDER FLOAT NOT NULL, GAP FLOAT NOT NULL);
    DECLARE @DUP TABLE (SRC_ID INT NOT NULL, NEW_ID INT NOT NULL PRIMARY KEY);
    CREATE TABLE #SHEET_IDS (ID INT NOT NULL PRIMARY KEY);
    CREATE TABLE #SHEET_LK (EXPTNO VARCHAR(25) NOT NULL PRIMARY KEY, FILLED BIT NOT NULL DEFAULT 0, JOB_FOUND BIT NOT NULL DEFAULT 0,
                            JOB_CANCELLED BIT NOT NULL DEFAULT 0,
                            L_WO NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_PORT NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_COUNTRY NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_QTY NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_CONT NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_CNTR_TYPE NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_VSL_NAME NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_SLINE NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_BOOKING_NO NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_PO_NO NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_CONSIGNEE NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_CONTAINER_NO NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_CURRENT_ETD NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_ETA_DEST NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_FINAL_VSL_SOB NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_BL_NO NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_BL_DT NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_EDOC_STATUS NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_COURIER_DT NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_SB_NO NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_SB_DT NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_FOR_HBL NVARCHAR(4000) NOT NULL DEFAULT N'');

    SELECT @S = ISNULL(@IDS, '') + ',', @I = 1, @POS = 0, @BAD = 0;
    SET @LEN = DATALENGTH(@S);
    WHILE @I <= @LEN
    BEGIN
        SET @P = CHARINDEX(',', @S, @I);
        SET @T = LTRIM(RTRIM(SUBSTRING(@S, @I, @P - @I)));
        SET @I = @P + 1;
        IF @T <> ''
        BEGIN
            IF @T LIKE '%[^0-9]%' OR LEN(@T) > 9 OR @T = '0'
                SET @BAD = 1;
            ELSE IF NOT EXISTS (SELECT 1 FROM @L WHERE ID = CONVERT(INT, @T))
            BEGIN
                SET @POS = @POS + 1;
                INSERT INTO @L (ID, POS) VALUES (CONVERT(INT, @T), @POS);
            END
        END
    END
    IF @OP = 'insert' DELETE FROM @L;      -- insert ignores IDS

    IF @USER_ID = ''
        SELECT @STATUS = '101', @STATUSTEXT = N'USER_ID is required.';
    ELSE IF @OP NOT IN ('insert', 'duplicate', 'delete', 'restore', 'move')
        SELECT @STATUS = '101', @STATUSTEXT = N'OP must be insert, duplicate, delete, restore or move.';
    ELSE IF NOT EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_MONTH WHERE ID = @MONTH_ID)
        SELECT @STATUS = '103', @STATUSTEXT = N'Month not found.';
    ELSE IF @TAB_CODE = ''
        SELECT @STATUS = '101', @STATUSTEXT = N'TAB_CODE is required.';
    ELSE IF @BAD = 1 AND @OP <> 'insert'
        SELECT @STATUS = '101', @STATUSTEXT = N'IDS must be a comma list of row ids.';
    ELSE IF @OP <> 'insert' AND NOT EXISTS (SELECT 1 FROM @L)
        SELECT @STATUS = '101', @STATUSTEXT = N'IDS is required for ' + @OP + N'.';
    ELSE IF @OP = 'insert' AND (@COUNT < 1 OR @COUNT > 1000)
        SELECT @STATUS = '101', @STATUSTEXT = N'COUNT must be 1 to 1000.';
    ELSE IF @AFTER_ID > 0 AND @OP IN ('insert', 'move')
            AND NOT EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @AFTER_ID AND MONTH_ID = @MONTH_ID AND TAB_CODE = @TAB_CODE)
        SELECT @STATUS = '103', @STATUSTEXT = N'AFTER_ID is not a row of this tab.';
    ELSE IF @OP = 'move' AND EXISTS (SELECT 1 FROM @L WHERE ID = @AFTER_ID)
        SELECT @STATUS = '101', @STATUSTEXT = N'AFTER_ID cannot be one of the rows being moved.';

    IF @STATUS = '100' AND @OP <> 'insert'
    BEGIN
        SELECT @MISS = COUNT(*) FROM @L L
        WHERE  NOT EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_ROW R WHERE R.ID = L.ID AND R.MONTH_ID = @MONTH_ID AND R.TAB_CODE = @TAB_CODE
                           AND (@OP = 'restore' OR R.ISDELETED = 0 OR @OP = 'delete'));
        IF @MISS > 0
            SELECT @STATUS = '103', @STATUSTEXT = CONVERT(NVARCHAR(10), @MISS) + N' row(s) not found in this tab' + CASE WHEN @OP IN ('duplicate', 'move') THEN N' (or deleted)' ELSE N'' END + N'.';
    END

    IF @STATUS = '100'
    BEGIN
        SET @TC = @@TRANCOUNT;
        BEGIN TRY
        IF @TC = 0 BEGIN BEGIN TRANSACTION; END ELSE BEGIN SAVE TRANSACTION EXPT_SHEET_ROWS; END
            -- row operations on one tab take turns: the tab's rows are locked first, then MODIFY_DT is taken
            SELECT @MISS = COUNT(*) FROM dbo.TBL_EXPT_SHEET_ROW WITH (UPDLOCK, HOLDLOCK) WHERE MONTH_ID = @MONTH_ID AND TAB_CODE = @TAB_CODE;
            SET @NOW = GETDATE();
            IF @OP IN ('insert', 'move')
            BEGIN
                SET @N = CASE WHEN @OP = 'insert' THEN @COUNT ELSE (SELECT COUNT(*) FROM @L) END;
                SELECT @PREV = NULL, @NEXT = NULL;
                IF @AFTER_ID > 0
                BEGIN
                    SELECT @PREV = SORT_ORDER FROM dbo.TBL_EXPT_SHEET_ROW WITH (UPDLOCK, HOLDLOCK) WHERE ID = @AFTER_ID;
                    SELECT @NEXT = MIN(R.SORT_ORDER) FROM dbo.TBL_EXPT_SHEET_ROW R WITH (UPDLOCK, HOLDLOCK)
                    WHERE  R.MONTH_ID = @MONTH_ID AND R.TAB_CODE = @TAB_CODE AND R.SORT_ORDER > @PREV
                      AND  NOT EXISTS (SELECT 1 FROM @L L WHERE L.ID = R.ID);
                    IF @NEXT IS NULL SET @NEXT = @PREV + @N + 1;
                END
                ELSE
                BEGIN
                    SELECT @NEXT = MIN(R.SORT_ORDER) FROM dbo.TBL_EXPT_SHEET_ROW R WITH (UPDLOCK, HOLDLOCK)
                    WHERE  R.MONTH_ID = @MONTH_ID AND R.TAB_CODE = @TAB_CODE AND NOT EXISTS (SELECT 1 FROM @L L WHERE L.ID = R.ID);
                    IF @NEXT IS NULL SELECT @PREV = 0, @NEXT = @N + 1;
                    ELSE SET @PREV = @NEXT - @N - 1;
                END
                IF (@NEXT - @PREV) / (@N + 1) < 0.000001
                BEGIN
                UPDATE R SET SORT_ORDER = X.RN * 1024.0, MODIFY_ID = @USER_ID, MODIFY_DT = @NOW
                FROM   dbo.TBL_EXPT_SHEET_ROW R
                       JOIN (SELECT ID, ROW_NUMBER() OVER (ORDER BY SORT_ORDER, ID) AS RN FROM dbo.TBL_EXPT_SHEET_ROW
                             WHERE MONTH_ID = @MONTH_ID AND TAB_CODE = @TAB_CODE) X ON X.ID = R.ID;
                SET @RENUM = 1;
                SELECT @PREV = NULL, @NEXT = NULL;
                IF @AFTER_ID > 0
                BEGIN
                    SELECT @PREV = SORT_ORDER FROM dbo.TBL_EXPT_SHEET_ROW WITH (UPDLOCK, HOLDLOCK) WHERE ID = @AFTER_ID;
                    SELECT @NEXT = MIN(R.SORT_ORDER) FROM dbo.TBL_EXPT_SHEET_ROW R WITH (UPDLOCK, HOLDLOCK)
                    WHERE  R.MONTH_ID = @MONTH_ID AND R.TAB_CODE = @TAB_CODE AND R.SORT_ORDER > @PREV
                      AND  NOT EXISTS (SELECT 1 FROM @L L WHERE L.ID = R.ID);
                    IF @NEXT IS NULL SET @NEXT = @PREV + @N + 1;
                END
                ELSE
                BEGIN
                    SELECT @NEXT = MIN(R.SORT_ORDER) FROM dbo.TBL_EXPT_SHEET_ROW R WITH (UPDLOCK, HOLDLOCK)
                    WHERE  R.MONTH_ID = @MONTH_ID AND R.TAB_CODE = @TAB_CODE AND NOT EXISTS (SELECT 1 FROM @L L WHERE L.ID = R.ID);
                    IF @NEXT IS NULL SELECT @PREV = 0, @NEXT = @N + 1;
                    ELSE SET @PREV = @NEXT - @N - 1;
                END
                END
            END

            IF @OP = 'insert'
            BEGIN
                INSERT INTO dbo.TBL_EXPT_SHEET_ROW (MONTH_ID, TAB_CODE, SORT_ORDER, ROWVER, ISDELETED, MAKER_ID, MAKER_DT, MODIFY_ID, MODIFY_DT)
                OUTPUT INSERTED.ID INTO @AFF (ID)
                SELECT @MONTH_ID, @TAB_CODE, @PREV + (@NEXT - @PREV) * CONVERT(FLOAT, N.N) / (@COUNT + 1), 1, 0, @USER_ID, @NOW, @USER_ID, @NOW
                FROM  (SELECT TOP (@COUNT) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS N FROM sys.all_columns a CROSS JOIN sys.all_columns b) N;
                SET @CHANGED = (SELECT COUNT(*) FROM @AFF);
                INSERT INTO dbo.TBL_EXPT_SHEET_LOG (ROW_KIND, ROW_ID, COL_KEY, OLD_VALUE, NEW_VALUE, ACTION, USER_ID, USER_NAME, LOG_DT)
                SELECT 'W', ID, NULL, NULL, NULL, 'insert', @USER_ID, @USER_NAME, @NOW FROM @AFF;
            END
            ELSE IF @OP = 'move'
            BEGIN
                UPDATE R SET SORT_ORDER = @PREV + (@NEXT - @PREV) * CONVERT(FLOAT, X.RN) / (@N + 1), MODIFY_ID = @USER_ID, MODIFY_DT = @NOW
                OUTPUT INSERTED.ID, DELETED.SORT_ORDER, INSERTED.SORT_ORDER INTO @CHG (ID, OLD_ORDER, NEW_ORDER)
                FROM   dbo.TBL_EXPT_SHEET_ROW R JOIN (SELECT ID, ROW_NUMBER() OVER (ORDER BY POS) AS RN FROM @L) X ON X.ID = R.ID;
                SET @CHANGED = @@ROWCOUNT;
                INSERT INTO @AFF (ID) SELECT ID FROM @CHG;
                INSERT INTO dbo.TBL_EXPT_SHEET_LOG (ROW_KIND, ROW_ID, COL_KEY, OLD_VALUE, NEW_VALUE, ACTION, USER_ID, USER_NAME, LOG_DT)
                SELECT 'W', ID, 'SORT_ORDER', CONVERT(NVARCHAR(40), OLD_ORDER), CONVERT(NVARCHAR(40), NEW_ORDER)
                       + ISNULL(N' (after row ' + CONVERT(NVARCHAR(10), NULLIF(@AFTER_ID, 0)) + N')', N' (top)'), 'move', @USER_ID, @USER_NAME, @NOW
                FROM   @CHG;
            END
            ELSE IF @OP = 'duplicate'
            BEGIN
                -- each copy goes right after its source row
                DELETE FROM @SRC;
                INSERT INTO @SRC (ID, NEW_ORDER, GAP)
                SELECT S.ID, (S.SORT_ORDER + ISNULL(NX.NEXT_ORDER, S.SORT_ORDER + 2)) / 2, ISNULL(NX.NEXT_ORDER, S.SORT_ORDER + 2) - S.SORT_ORDER
                FROM   dbo.TBL_EXPT_SHEET_ROW S JOIN @L L ON L.ID = S.ID
                       OUTER APPLY (SELECT MIN(R.SORT_ORDER) AS NEXT_ORDER FROM dbo.TBL_EXPT_SHEET_ROW R WITH (UPDLOCK, HOLDLOCK)
                                    WHERE R.MONTH_ID = @MONTH_ID AND R.TAB_CODE = @TAB_CODE AND R.SORT_ORDER > S.SORT_ORDER) NX;
                IF EXISTS (SELECT 1 FROM @SRC WHERE GAP / 2 < 0.000001)
                BEGIN
                UPDATE R SET SORT_ORDER = X.RN * 1024.0, MODIFY_ID = @USER_ID, MODIFY_DT = @NOW
                FROM   dbo.TBL_EXPT_SHEET_ROW R
                       JOIN (SELECT ID, ROW_NUMBER() OVER (ORDER BY SORT_ORDER, ID) AS RN FROM dbo.TBL_EXPT_SHEET_ROW
                             WHERE MONTH_ID = @MONTH_ID AND TAB_CODE = @TAB_CODE) X ON X.ID = R.ID;
                SET @RENUM = 1;
                DELETE FROM @SRC;
                INSERT INTO @SRC (ID, NEW_ORDER, GAP)
                SELECT S.ID, (S.SORT_ORDER + ISNULL(NX.NEXT_ORDER, S.SORT_ORDER + 2)) / 2, ISNULL(NX.NEXT_ORDER, S.SORT_ORDER + 2) - S.SORT_ORDER
                FROM   dbo.TBL_EXPT_SHEET_ROW S JOIN @L L ON L.ID = S.ID
                       OUTER APPLY (SELECT MIN(R.SORT_ORDER) AS NEXT_ORDER FROM dbo.TBL_EXPT_SHEET_ROW R WITH (UPDLOCK, HOLDLOCK)
                                    WHERE R.MONTH_ID = @MONTH_ID AND R.TAB_CODE = @TAB_CODE AND R.SORT_ORDER > S.SORT_ORDER) NX;
                END
                MERGE dbo.TBL_EXPT_SHEET_ROW AS T
                USING (SELECT S.*, X.NEW_ORDER FROM dbo.TBL_EXPT_SHEET_ROW S JOIN @SRC X ON X.ID = S.ID) AS S
                ON 1 = 0
                WHEN NOT MATCHED THEN
                    INSERT (MONTH_ID, TAB_CODE, SORT_ORDER, STATUS_CODE, EXPTNO, WO, PORT, COUNTRY, VEH, QTY, CONT, CNTR_TYPE, STUFFING_DT, VSL_NAME, DO_ETD, SLINE, AGENT, DO_RECEIVE_DT,
                            BOOKING_NO, TRANSPORTER, CARGO_TYPE, PLANT, PO_NO, LC_NO, LC_DATE, HAZ, CONSIGNEE, REMARK1, DO_GIVEN_DT,
                            CONTAINER_NO, POL_GATE, GATE_OPEN_DT, GATE_CUTOFF_DT, SI_CUTOFF_DT, DO_ETD2, CURRENT_ETD, ETA_DEST,
                            FINAL_VSL_SOB, VGM_SUBMITTED_DT, SI_SUBMITTED_DT, BL_NO, BL_DT, BL_HANDOVER_DT, FF_JOB, SLINE_PAYMENT_STATUS,
                            CLEARANCE_POINT, OPEN_ORDER, BUFFER_YARD, EDOC_STATUS, COURIER_DT, PICKUP_DT, CNTR_DISPATCH_DT,
                            CNTR_REPORT_NS_DT, CNTR_GATEDIN_DT, SB_NO, SB_DT, FOR_HBL, CELL_FMT, ROWVER, ISDELETED, MAKER_ID, MAKER_DT, MODIFY_ID, MODIFY_DT)
                    VALUES (S.MONTH_ID, S.TAB_CODE, S.NEW_ORDER, S.STATUS_CODE, S.EXPTNO, S.WO, S.PORT, S.COUNTRY, S.VEH, S.QTY, S.CONT, S.CNTR_TYPE, S.STUFFING_DT, S.VSL_NAME, S.DO_ETD, S.SLINE,
                            S.AGENT, S.DO_RECEIVE_DT, S.BOOKING_NO, S.TRANSPORTER, S.CARGO_TYPE, S.PLANT, S.PO_NO, S.LC_NO, S.LC_DATE,
                            S.HAZ, S.CONSIGNEE, S.REMARK1, S.DO_GIVEN_DT, S.CONTAINER_NO, S.POL_GATE, S.GATE_OPEN_DT, S.GATE_CUTOFF_DT,
                            S.SI_CUTOFF_DT, S.DO_ETD2, S.CURRENT_ETD, S.ETA_DEST, S.FINAL_VSL_SOB, S.VGM_SUBMITTED_DT, S.SI_SUBMITTED_DT,
                            S.BL_NO, S.BL_DT, S.BL_HANDOVER_DT, S.FF_JOB, S.SLINE_PAYMENT_STATUS, S.CLEARANCE_POINT, S.OPEN_ORDER,
                            S.BUFFER_YARD, S.EDOC_STATUS, S.COURIER_DT, S.PICKUP_DT, S.CNTR_DISPATCH_DT, S.CNTR_REPORT_NS_DT,
                            S.CNTR_GATEDIN_DT, S.SB_NO, S.SB_DT, S.FOR_HBL, S.CELL_FMT, 1, 0, @USER_ID, @NOW, @USER_ID, @NOW)
                OUTPUT S.ID, INSERTED.ID INTO @DUP (SRC_ID, NEW_ID);
                INSERT INTO @AFF (ID) SELECT NEW_ID FROM @DUP;
                SET @CHANGED = (SELECT COUNT(*) FROM @DUP);
                INSERT INTO dbo.TBL_EXPT_SHEET_LOG (ROW_KIND, ROW_ID, COL_KEY, OLD_VALUE, NEW_VALUE, ACTION, USER_ID, USER_NAME, LOG_DT)
                SELECT 'W', NEW_ID, NULL, NULL, N'duplicate of row ' + CONVERT(NVARCHAR(10), SRC_ID), 'insert', @USER_ID, @USER_NAME, @NOW FROM @DUP;
            END
            ELSE
            BEGIN
                -- delete (soft) / restore
                UPDATE R SET ISDELETED = CASE WHEN @OP = 'delete' THEN 1 ELSE 0 END, ROWVER = R.ROWVER + 1, MODIFY_ID = @USER_ID, MODIFY_DT = @NOW
                OUTPUT INSERTED.ID INTO @CHG (ID)
                FROM   dbo.TBL_EXPT_SHEET_ROW R JOIN @L L ON L.ID = R.ID
                WHERE  R.ISDELETED = CASE WHEN @OP = 'delete' THEN 0 ELSE 1 END;
                SET @CHANGED = @@ROWCOUNT;
                INSERT INTO @AFF (ID) SELECT ID FROM @L;
                INSERT INTO dbo.TBL_EXPT_SHEET_LOG (ROW_KIND, ROW_ID, COL_KEY, OLD_VALUE, NEW_VALUE, ACTION, USER_ID, USER_NAME, LOG_DT)
                SELECT 'W', ID, NULL, NULL, NULL, @OP, @USER_ID, @USER_NAME, @NOW FROM @CHG;
            END

            -- renumbered: every row of the tab has a new SORT_ORDER, so all of them are returned
            IF @RENUM = 1
                INSERT INTO @AFF (ID)
                SELECT R.ID FROM dbo.TBL_EXPT_SHEET_ROW R
                WHERE  R.MONTH_ID = @MONTH_ID AND R.TAB_CODE = @TAB_CODE AND NOT EXISTS (SELECT 1 FROM @AFF A WHERE A.ID = R.ID);
        IF @TC = 0 COMMIT TRANSACTION;
            SET @STATUSTEXT = CONVERT(NVARCHAR(10), @CHANGED) + N' row(s) ' + CASE @OP WHEN 'insert' THEN N'inserted' WHEN 'duplicate' THEN N'duplicated'
                              WHEN 'delete' THEN N'deleted' WHEN 'restore' THEN N'restored' ELSE N'moved' END
                              + CASE WHEN @RENUM = 1 THEN N' (the tab was renumbered)' ELSE N'' END + N'.';
        END TRY
        BEGIN CATCH
            DECLARE @ERR NVARCHAR(2048);
            SET @ERR = ERROR_MESSAGE();
            IF XACT_STATE() = -1 OR (XACT_STATE() = 1 AND @TC = 0)
            BEGIN
                ROLLBACK TRANSACTION;
            END
            ELSE IF XACT_STATE() = 1
            BEGIN
                ROLLBACK TRANSACTION EXPT_SHEET_ROWS;
            END
            SELECT @CHANGED = 0;
            SELECT @STATUS = '101', @STATUSTEXT = N'Rows not changed: ' + @ERR;
            IF @TC > 0 AND @@TRANCOUNT = 0
                RAISERROR(N'%s (the caller''s transaction could not be kept and was rolled back)', 16, 1, @ERR);
        END CATCH
    END

    -- self-test hook: only TEST_EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql creates #EXPT_SHEET_SELFTEST
    IF OBJECT_ID('tempdb..#EXPT_SHEET_SELFTEST') IS NOT NULL
        INSERT INTO #EXPT_SHEET_SELFTEST (PROC_NAME, STATUS, STATUSTEXT, N1, N2, N3)
        VALUES ('ROWS_OP:' + @OP + '', @STATUS, @STATUSTEXT, @CHANGED, (SELECT COUNT(*) FROM @AFF), CONVERT(INT, @RENUM));
    SELECT @STATUS AS STATUS, @STATUSTEXT AS STATUSTEXT, @OP AS OP, @CHANGED AS ROWS_CHANGED;
    IF @STATUS = '100'
    BEGIN
        INSERT INTO #SHEET_IDS (ID) SELECT ID FROM @AFF;
        EXEC dbo.USP_EXPT_SHEET_ROWS_OUT 1;
    END
END
GO

/* ---- dbo.USP_EXPT_SHEET_GRID_ROWS_OP ----------------------------------------------------------- */
IF OBJECT_ID('dbo.USP_EXPT_SHEET_GRID_ROWS_OP', 'P') IS NOT NULL
    DROP PROCEDURE dbo.USP_EXPT_SHEET_GRID_ROWS_OP;      -- step 1 made sure it is this script's own
GO
CREATE PROCEDURE dbo.USP_EXPT_SHEET_GRID_ROWS_OP
    @MONTH_ID  INT,
    @TAB_CODE  VARCHAR(20),
    @OP        VARCHAR(20),
    @IDS       VARCHAR(MAX),
    @AFTER_ID  INT,
    @COUNT     INT,
    @USER_ID   VARCHAR(50),
    @USER_NAME NVARCHAR(100)
AS
BEGIN
    -- Deployed by links-22/_DB_FIX/EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql (Export > Sheet view). Do not edit here: change that script.
    -- GRID_ROWS_OP(MONTH_ID, TAB_CODE, OP, IDS, AFTER_ID, COUNT, USER_ID, USER_NAME): ROWS_OP for the grid tabs (BOOKINGS, VEHWEIGHTS,
    -- DGD, PRICE - TBL_EXPT_SHEET_GRIDROW, logged with ROW_KIND 'G'). Results: Table STATUS, STATUSTEXT, OP, ROWS_CHANGED; on
    -- success Table1 = the affected rows (GRID_LOAD shape).
    SET NOCOUNT ON;
    IF @@TRANCOUNT = 0 SET XACT_ABORT ON ELSE SET XACT_ABORT OFF;
    DECLARE @STATUS VARCHAR(3), @STATUSTEXT NVARCHAR(1000), @NOW DATETIME, @TC INT, @N INT, @PREV FLOAT, @NEXT FLOAT, @RENUM BIT,
            @CHANGED INT, @MISS INT, @S VARCHAR(MAX), @I INT, @P INT, @LEN INT, @T VARCHAR(100), @POS INT, @BAD BIT;
    SELECT @STATUS = '100', @STATUSTEXT = N'', @NOW = GETDATE(), @RENUM = 0, @CHANGED = 0, @N = 0;
    SELECT @OP = LOWER(LTRIM(RTRIM(ISNULL(@OP, '')))), @TAB_CODE = UPPER(LTRIM(RTRIM(ISNULL(@TAB_CODE, '')))), @AFTER_ID = ISNULL(@AFTER_ID, 0),
           @COUNT = ISNULL(@COUNT, 0), @USER_ID = LTRIM(RTRIM(ISNULL(@USER_ID, '')));
    DECLARE @L TABLE (ID INT NOT NULL PRIMARY KEY, POS INT NOT NULL);
    DECLARE @AFF TABLE (ID INT NOT NULL PRIMARY KEY);
    DECLARE @CHG TABLE (ID INT NOT NULL PRIMARY KEY, OLD_ORDER FLOAT NULL, NEW_ORDER FLOAT NULL);
    DECLARE @SRC TABLE (ID INT NOT NULL PRIMARY KEY, NEW_ORDER FLOAT NOT NULL, GAP FLOAT NOT NULL);
    DECLARE @DUP TABLE (SRC_ID INT NOT NULL, NEW_ID INT NOT NULL PRIMARY KEY);


    SELECT @S = ISNULL(@IDS, '') + ',', @I = 1, @POS = 0, @BAD = 0;
    SET @LEN = DATALENGTH(@S);
    WHILE @I <= @LEN
    BEGIN
        SET @P = CHARINDEX(',', @S, @I);
        SET @T = LTRIM(RTRIM(SUBSTRING(@S, @I, @P - @I)));
        SET @I = @P + 1;
        IF @T <> ''
        BEGIN
            IF @T LIKE '%[^0-9]%' OR LEN(@T) > 9 OR @T = '0'
                SET @BAD = 1;
            ELSE IF NOT EXISTS (SELECT 1 FROM @L WHERE ID = CONVERT(INT, @T))
            BEGIN
                SET @POS = @POS + 1;
                INSERT INTO @L (ID, POS) VALUES (CONVERT(INT, @T), @POS);
            END
        END
    END
    IF @OP = 'insert' DELETE FROM @L;      -- insert ignores IDS

    IF @USER_ID = ''
        SELECT @STATUS = '101', @STATUSTEXT = N'USER_ID is required.';
    ELSE IF @OP NOT IN ('insert', 'duplicate', 'delete', 'restore', 'move')
        SELECT @STATUS = '101', @STATUSTEXT = N'OP must be insert, duplicate, delete, restore or move.';
    ELSE IF NOT EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_MONTH WHERE ID = @MONTH_ID)
        SELECT @STATUS = '103', @STATUSTEXT = N'Month not found.';
    ELSE IF @TAB_CODE = ''
        SELECT @STATUS = '101', @STATUSTEXT = N'TAB_CODE is required.';
    ELSE IF @BAD = 1 AND @OP <> 'insert'
        SELECT @STATUS = '101', @STATUSTEXT = N'IDS must be a comma list of row ids.';
    ELSE IF @OP <> 'insert' AND NOT EXISTS (SELECT 1 FROM @L)
        SELECT @STATUS = '101', @STATUSTEXT = N'IDS is required for ' + @OP + N'.';
    ELSE IF @OP = 'insert' AND (@COUNT < 1 OR @COUNT > 1000)
        SELECT @STATUS = '101', @STATUSTEXT = N'COUNT must be 1 to 1000.';
    ELSE IF @AFTER_ID > 0 AND @OP IN ('insert', 'move')
            AND NOT EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_GRIDROW WHERE ID = @AFTER_ID AND MONTH_ID = @MONTH_ID AND TAB_CODE = @TAB_CODE)
        SELECT @STATUS = '103', @STATUSTEXT = N'AFTER_ID is not a row of this tab.';
    ELSE IF @OP = 'move' AND EXISTS (SELECT 1 FROM @L WHERE ID = @AFTER_ID)
        SELECT @STATUS = '101', @STATUSTEXT = N'AFTER_ID cannot be one of the rows being moved.';

    IF @STATUS = '100' AND @OP <> 'insert'
    BEGIN
        SELECT @MISS = COUNT(*) FROM @L L
        WHERE  NOT EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_GRIDROW R WHERE R.ID = L.ID AND R.MONTH_ID = @MONTH_ID AND R.TAB_CODE = @TAB_CODE
                           AND (@OP = 'restore' OR R.ISDELETED = 0 OR @OP = 'delete'));
        IF @MISS > 0
            SELECT @STATUS = '103', @STATUSTEXT = CONVERT(NVARCHAR(10), @MISS) + N' row(s) not found in this tab' + CASE WHEN @OP IN ('duplicate', 'move') THEN N' (or deleted)' ELSE N'' END + N'.';
    END

    IF @STATUS = '100'
    BEGIN
        SET @TC = @@TRANCOUNT;
        BEGIN TRY
        IF @TC = 0 BEGIN BEGIN TRANSACTION; END ELSE BEGIN SAVE TRANSACTION EXPT_SHEET_ROWS; END
            -- row operations on one tab take turns: the tab's rows are locked first, then MODIFY_DT is taken
            SELECT @MISS = COUNT(*) FROM dbo.TBL_EXPT_SHEET_GRIDROW WITH (UPDLOCK, HOLDLOCK) WHERE MONTH_ID = @MONTH_ID AND TAB_CODE = @TAB_CODE;
            SET @NOW = GETDATE();
            IF @OP IN ('insert', 'move')
            BEGIN
                SET @N = CASE WHEN @OP = 'insert' THEN @COUNT ELSE (SELECT COUNT(*) FROM @L) END;
                SELECT @PREV = NULL, @NEXT = NULL;
                IF @AFTER_ID > 0
                BEGIN
                    SELECT @PREV = SORT_ORDER FROM dbo.TBL_EXPT_SHEET_GRIDROW WITH (UPDLOCK, HOLDLOCK) WHERE ID = @AFTER_ID;
                    SELECT @NEXT = MIN(R.SORT_ORDER) FROM dbo.TBL_EXPT_SHEET_GRIDROW R WITH (UPDLOCK, HOLDLOCK)
                    WHERE  R.MONTH_ID = @MONTH_ID AND R.TAB_CODE = @TAB_CODE AND R.SORT_ORDER > @PREV
                      AND  NOT EXISTS (SELECT 1 FROM @L L WHERE L.ID = R.ID);
                    IF @NEXT IS NULL SET @NEXT = @PREV + @N + 1;
                END
                ELSE
                BEGIN
                    SELECT @NEXT = MIN(R.SORT_ORDER) FROM dbo.TBL_EXPT_SHEET_GRIDROW R WITH (UPDLOCK, HOLDLOCK)
                    WHERE  R.MONTH_ID = @MONTH_ID AND R.TAB_CODE = @TAB_CODE AND NOT EXISTS (SELECT 1 FROM @L L WHERE L.ID = R.ID);
                    IF @NEXT IS NULL SELECT @PREV = 0, @NEXT = @N + 1;
                    ELSE SET @PREV = @NEXT - @N - 1;
                END
                IF (@NEXT - @PREV) / (@N + 1) < 0.000001
                BEGIN
                UPDATE R SET SORT_ORDER = X.RN * 1024.0, MODIFY_ID = @USER_ID, MODIFY_DT = @NOW
                FROM   dbo.TBL_EXPT_SHEET_GRIDROW R
                       JOIN (SELECT ID, ROW_NUMBER() OVER (ORDER BY SORT_ORDER, ID) AS RN FROM dbo.TBL_EXPT_SHEET_GRIDROW
                             WHERE MONTH_ID = @MONTH_ID AND TAB_CODE = @TAB_CODE) X ON X.ID = R.ID;
                SET @RENUM = 1;
                SELECT @PREV = NULL, @NEXT = NULL;
                IF @AFTER_ID > 0
                BEGIN
                    SELECT @PREV = SORT_ORDER FROM dbo.TBL_EXPT_SHEET_GRIDROW WITH (UPDLOCK, HOLDLOCK) WHERE ID = @AFTER_ID;
                    SELECT @NEXT = MIN(R.SORT_ORDER) FROM dbo.TBL_EXPT_SHEET_GRIDROW R WITH (UPDLOCK, HOLDLOCK)
                    WHERE  R.MONTH_ID = @MONTH_ID AND R.TAB_CODE = @TAB_CODE AND R.SORT_ORDER > @PREV
                      AND  NOT EXISTS (SELECT 1 FROM @L L WHERE L.ID = R.ID);
                    IF @NEXT IS NULL SET @NEXT = @PREV + @N + 1;
                END
                ELSE
                BEGIN
                    SELECT @NEXT = MIN(R.SORT_ORDER) FROM dbo.TBL_EXPT_SHEET_GRIDROW R WITH (UPDLOCK, HOLDLOCK)
                    WHERE  R.MONTH_ID = @MONTH_ID AND R.TAB_CODE = @TAB_CODE AND NOT EXISTS (SELECT 1 FROM @L L WHERE L.ID = R.ID);
                    IF @NEXT IS NULL SELECT @PREV = 0, @NEXT = @N + 1;
                    ELSE SET @PREV = @NEXT - @N - 1;
                END
                END
            END

            IF @OP = 'insert'
            BEGIN
                INSERT INTO dbo.TBL_EXPT_SHEET_GRIDROW (MONTH_ID, TAB_CODE, SORT_ORDER, ROWVER, ISDELETED, MAKER_ID, MAKER_DT, MODIFY_ID, MODIFY_DT)
                OUTPUT INSERTED.ID INTO @AFF (ID)
                SELECT @MONTH_ID, @TAB_CODE, @PREV + (@NEXT - @PREV) * CONVERT(FLOAT, N.N) / (@COUNT + 1), 1, 0, @USER_ID, @NOW, @USER_ID, @NOW
                FROM  (SELECT TOP (@COUNT) ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) AS N FROM sys.all_columns a CROSS JOIN sys.all_columns b) N;
                SET @CHANGED = (SELECT COUNT(*) FROM @AFF);
                INSERT INTO dbo.TBL_EXPT_SHEET_LOG (ROW_KIND, ROW_ID, COL_KEY, OLD_VALUE, NEW_VALUE, ACTION, USER_ID, USER_NAME, LOG_DT)
                SELECT 'G', ID, NULL, NULL, NULL, 'insert', @USER_ID, @USER_NAME, @NOW FROM @AFF;
            END
            ELSE IF @OP = 'move'
            BEGIN
                UPDATE R SET SORT_ORDER = @PREV + (@NEXT - @PREV) * CONVERT(FLOAT, X.RN) / (@N + 1), MODIFY_ID = @USER_ID, MODIFY_DT = @NOW
                OUTPUT INSERTED.ID, DELETED.SORT_ORDER, INSERTED.SORT_ORDER INTO @CHG (ID, OLD_ORDER, NEW_ORDER)
                FROM   dbo.TBL_EXPT_SHEET_GRIDROW R JOIN (SELECT ID, ROW_NUMBER() OVER (ORDER BY POS) AS RN FROM @L) X ON X.ID = R.ID;
                SET @CHANGED = @@ROWCOUNT;
                INSERT INTO @AFF (ID) SELECT ID FROM @CHG;
                INSERT INTO dbo.TBL_EXPT_SHEET_LOG (ROW_KIND, ROW_ID, COL_KEY, OLD_VALUE, NEW_VALUE, ACTION, USER_ID, USER_NAME, LOG_DT)
                SELECT 'G', ID, 'SORT_ORDER', CONVERT(NVARCHAR(40), OLD_ORDER), CONVERT(NVARCHAR(40), NEW_ORDER)
                       + ISNULL(N' (after row ' + CONVERT(NVARCHAR(10), NULLIF(@AFTER_ID, 0)) + N')', N' (top)'), 'move', @USER_ID, @USER_NAME, @NOW
                FROM   @CHG;
            END
            ELSE IF @OP = 'duplicate'
            BEGIN
                -- each copy goes right after its source row
                DELETE FROM @SRC;
                INSERT INTO @SRC (ID, NEW_ORDER, GAP)
                SELECT S.ID, (S.SORT_ORDER + ISNULL(NX.NEXT_ORDER, S.SORT_ORDER + 2)) / 2, ISNULL(NX.NEXT_ORDER, S.SORT_ORDER + 2) - S.SORT_ORDER
                FROM   dbo.TBL_EXPT_SHEET_GRIDROW S JOIN @L L ON L.ID = S.ID
                       OUTER APPLY (SELECT MIN(R.SORT_ORDER) AS NEXT_ORDER FROM dbo.TBL_EXPT_SHEET_GRIDROW R WITH (UPDLOCK, HOLDLOCK)
                                    WHERE R.MONTH_ID = @MONTH_ID AND R.TAB_CODE = @TAB_CODE AND R.SORT_ORDER > S.SORT_ORDER) NX;
                IF EXISTS (SELECT 1 FROM @SRC WHERE GAP / 2 < 0.000001)
                BEGIN
                UPDATE R SET SORT_ORDER = X.RN * 1024.0, MODIFY_ID = @USER_ID, MODIFY_DT = @NOW
                FROM   dbo.TBL_EXPT_SHEET_GRIDROW R
                       JOIN (SELECT ID, ROW_NUMBER() OVER (ORDER BY SORT_ORDER, ID) AS RN FROM dbo.TBL_EXPT_SHEET_GRIDROW
                             WHERE MONTH_ID = @MONTH_ID AND TAB_CODE = @TAB_CODE) X ON X.ID = R.ID;
                SET @RENUM = 1;
                DELETE FROM @SRC;
                INSERT INTO @SRC (ID, NEW_ORDER, GAP)
                SELECT S.ID, (S.SORT_ORDER + ISNULL(NX.NEXT_ORDER, S.SORT_ORDER + 2)) / 2, ISNULL(NX.NEXT_ORDER, S.SORT_ORDER + 2) - S.SORT_ORDER
                FROM   dbo.TBL_EXPT_SHEET_GRIDROW S JOIN @L L ON L.ID = S.ID
                       OUTER APPLY (SELECT MIN(R.SORT_ORDER) AS NEXT_ORDER FROM dbo.TBL_EXPT_SHEET_GRIDROW R WITH (UPDLOCK, HOLDLOCK)
                                    WHERE R.MONTH_ID = @MONTH_ID AND R.TAB_CODE = @TAB_CODE AND R.SORT_ORDER > S.SORT_ORDER) NX;
                END
                MERGE dbo.TBL_EXPT_SHEET_GRIDROW AS T
                USING (SELECT S.*, X.NEW_ORDER FROM dbo.TBL_EXPT_SHEET_GRIDROW S JOIN @SRC X ON X.ID = S.ID) AS S
                ON 1 = 0
                WHEN NOT MATCHED THEN
                    INSERT (MONTH_ID, TAB_CODE, SORT_ORDER, DATA, CELL_FMT, ROWVER, ISDELETED, MAKER_ID, MAKER_DT, MODIFY_ID, MODIFY_DT)
                    VALUES (S.MONTH_ID, S.TAB_CODE, S.NEW_ORDER, S.DATA, S.CELL_FMT, 1, 0, @USER_ID, @NOW, @USER_ID, @NOW)
                OUTPUT S.ID, INSERTED.ID INTO @DUP (SRC_ID, NEW_ID);
                INSERT INTO @AFF (ID) SELECT NEW_ID FROM @DUP;
                SET @CHANGED = (SELECT COUNT(*) FROM @DUP);
                INSERT INTO dbo.TBL_EXPT_SHEET_LOG (ROW_KIND, ROW_ID, COL_KEY, OLD_VALUE, NEW_VALUE, ACTION, USER_ID, USER_NAME, LOG_DT)
                SELECT 'G', NEW_ID, NULL, NULL, N'duplicate of row ' + CONVERT(NVARCHAR(10), SRC_ID), 'insert', @USER_ID, @USER_NAME, @NOW FROM @DUP;
            END
            ELSE
            BEGIN
                -- delete (soft) / restore
                UPDATE R SET ISDELETED = CASE WHEN @OP = 'delete' THEN 1 ELSE 0 END, ROWVER = R.ROWVER + 1, MODIFY_ID = @USER_ID, MODIFY_DT = @NOW
                OUTPUT INSERTED.ID INTO @CHG (ID)
                FROM   dbo.TBL_EXPT_SHEET_GRIDROW R JOIN @L L ON L.ID = R.ID
                WHERE  R.ISDELETED = CASE WHEN @OP = 'delete' THEN 0 ELSE 1 END;
                SET @CHANGED = @@ROWCOUNT;
                INSERT INTO @AFF (ID) SELECT ID FROM @L;
                INSERT INTO dbo.TBL_EXPT_SHEET_LOG (ROW_KIND, ROW_ID, COL_KEY, OLD_VALUE, NEW_VALUE, ACTION, USER_ID, USER_NAME, LOG_DT)
                SELECT 'G', ID, NULL, NULL, NULL, @OP, @USER_ID, @USER_NAME, @NOW FROM @CHG;
            END

            -- renumbered: every row of the tab has a new SORT_ORDER, so all of them are returned
            IF @RENUM = 1
                INSERT INTO @AFF (ID)
                SELECT R.ID FROM dbo.TBL_EXPT_SHEET_GRIDROW R
                WHERE  R.MONTH_ID = @MONTH_ID AND R.TAB_CODE = @TAB_CODE AND NOT EXISTS (SELECT 1 FROM @AFF A WHERE A.ID = R.ID);
        IF @TC = 0 COMMIT TRANSACTION;
            SET @STATUSTEXT = CONVERT(NVARCHAR(10), @CHANGED) + N' row(s) ' + CASE @OP WHEN 'insert' THEN N'inserted' WHEN 'duplicate' THEN N'duplicated'
                              WHEN 'delete' THEN N'deleted' WHEN 'restore' THEN N'restored' ELSE N'moved' END
                              + CASE WHEN @RENUM = 1 THEN N' (the tab was renumbered)' ELSE N'' END + N'.';
        END TRY
        BEGIN CATCH
            DECLARE @ERR NVARCHAR(2048);
            SET @ERR = ERROR_MESSAGE();
            IF XACT_STATE() = -1 OR (XACT_STATE() = 1 AND @TC = 0)
            BEGIN
                ROLLBACK TRANSACTION;
            END
            ELSE IF XACT_STATE() = 1
            BEGIN
                ROLLBACK TRANSACTION EXPT_SHEET_ROWS;
            END
            SELECT @CHANGED = 0;
            SELECT @STATUS = '101', @STATUSTEXT = N'Rows not changed: ' + @ERR;
            IF @TC > 0 AND @@TRANCOUNT = 0
                RAISERROR(N'%s (the caller''s transaction could not be kept and was rolled back)', 16, 1, @ERR);
        END CATCH
    END

    -- self-test hook: only TEST_EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql creates #EXPT_SHEET_SELFTEST
    IF OBJECT_ID('tempdb..#EXPT_SHEET_SELFTEST') IS NOT NULL
        INSERT INTO #EXPT_SHEET_SELFTEST (PROC_NAME, STATUS, STATUSTEXT, N1, N2, N3)
        VALUES ('GRID_ROWS_OP:' + @OP + '', @STATUS, @STATUSTEXT, @CHANGED, (SELECT COUNT(*) FROM @AFF), CONVERT(INT, @RENUM));
    SELECT @STATUS AS STATUS, @STATUSTEXT AS STATUSTEXT, @OP AS OP, @CHANGED AS ROWS_CHANGED;
    IF @STATUS = '100'
    BEGIN
        SELECT G.ID, G.MONTH_ID, G.TAB_CODE, G.SORT_ORDER, G.DATA, G.CELL_FMT, G.ROWVER, G.ISDELETED, G.MAKER_ID, G.MAKER_DT, G.MODIFY_ID, G.MODIFY_DT
        FROM   dbo.TBL_EXPT_SHEET_GRIDROW G JOIN @AFF A ON A.ID = G.ID
        ORDER BY G.SORT_ORDER, G.ID;
    END
END
GO

/* ---- dbo.USP_EXPT_SHEET_LINK ------------------------------------------------------------------- */
IF OBJECT_ID('dbo.USP_EXPT_SHEET_LINK', 'P') IS NOT NULL
    DROP PROCEDURE dbo.USP_EXPT_SHEET_LINK;      -- step 1 made sure it is this script's own
GO
CREATE PROCEDURE dbo.USP_EXPT_SHEET_LINK
    @ROW_IDS   VARCHAR(MAX),
    @EXPTNO    VARCHAR(25),
    @USER_ID   VARCHAR(50),
    @USER_NAME NVARCHAR(100)
AS
BEGIN
    -- Deployed by links-22/_DB_FIX/EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql (Export > Sheet view). Do not edit here: change that script.
    -- LINK(ROW_IDS, EXPTNO, USER_ID, USER_NAME). See USP_EXPT_SHEET_LINK_APPLY (103 when the job is not in the month's branch).
    SET NOCOUNT ON;
    EXEC dbo.USP_EXPT_SHEET_LINK_APPLY @ROW_IDS, @EXPTNO, 'link', @USER_ID, @USER_NAME;
END
GO

/* ---- dbo.USP_EXPT_SHEET_CONVERT_DONE ----------------------------------------------------------- */
IF OBJECT_ID('dbo.USP_EXPT_SHEET_CONVERT_DONE', 'P') IS NOT NULL
    DROP PROCEDURE dbo.USP_EXPT_SHEET_CONVERT_DONE;      -- step 1 made sure it is this script's own
GO
CREATE PROCEDURE dbo.USP_EXPT_SHEET_CONVERT_DONE
    @ROW_IDS   VARCHAR(MAX),
    @EXPTNO    VARCHAR(25),
    @USER_ID   VARCHAR(50),
    @USER_NAME NVARCHAR(100)
AS
BEGIN
    -- Deployed by links-22/_DB_FIX/EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql (Export > Sheet view). Do not edit here: change that script.
    -- CONVERT_DONE(ROW_IDS, EXPTNO, USER_ID, USER_NAME) = LINK, logged as 'convert' (the job was just created from the rows).
    SET NOCOUNT ON;
    EXEC dbo.USP_EXPT_SHEET_LINK_APPLY @ROW_IDS, @EXPTNO, 'convert', @USER_ID, @USER_NAME;
END
GO

/* ---- dbo.USP_EXPT_SHEET_UNLINK ----------------------------------------------------------------- */
IF OBJECT_ID('dbo.USP_EXPT_SHEET_UNLINK', 'P') IS NOT NULL
    DROP PROCEDURE dbo.USP_EXPT_SHEET_UNLINK;      -- step 1 made sure it is this script's own
GO
CREATE PROCEDURE dbo.USP_EXPT_SHEET_UNLINK
    @ROW_IDS   VARCHAR(MAX),
    @USER_ID   VARCHAR(50),
    @USER_NAME NVARCHAR(100)
AS
BEGIN
    -- Deployed by links-22/_DB_FIX/EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql (Export > Sheet view). Do not edit here: change that script.
    -- UNLINK(ROW_IDS, USER_ID, USER_NAME). Clears EXPTNO (the FF_JOB text stays), ROWVER + 1, one 'unlink' log row per linked row.
    -- EXPT_JOB_TRACKING is left as it is. Results: Table STATUS, STATUSTEXT, ROWS_UNLINKED; on success Table1 + Table2 = the rows.
    SET NOCOUNT ON;
    IF @@TRANCOUNT = 0 SET XACT_ABORT ON ELSE SET XACT_ABORT OFF;
    DECLARE @STATUS VARCHAR(3), @STATUSTEXT NVARCHAR(1000), @NOW DATETIME, @TC INT, @N INT, @MISS INT, @S VARCHAR(MAX), @I INT, @P INT, @LEN INT, @T VARCHAR(100), @POS INT, @BAD BIT;
    SELECT @STATUS = '100', @STATUSTEXT = N'', @NOW = GETDATE(), @N = 0, @USER_ID = LTRIM(RTRIM(ISNULL(@USER_ID, '')));
    DECLARE @L TABLE (ID INT NOT NULL PRIMARY KEY, POS INT NOT NULL);
    DECLARE @OLD TABLE (ID INT NOT NULL PRIMARY KEY, EXPTNO VARCHAR(25) NULL);
    CREATE TABLE #SHEET_IDS (ID INT NOT NULL PRIMARY KEY);
    CREATE TABLE #SHEET_LK (EXPTNO VARCHAR(25) NOT NULL PRIMARY KEY, FILLED BIT NOT NULL DEFAULT 0, JOB_FOUND BIT NOT NULL DEFAULT 0,
                            JOB_CANCELLED BIT NOT NULL DEFAULT 0,
                            L_WO NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_PORT NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_COUNTRY NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_QTY NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_CONT NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_CNTR_TYPE NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_VSL_NAME NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_SLINE NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_BOOKING_NO NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_PO_NO NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_CONSIGNEE NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_CONTAINER_NO NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_CURRENT_ETD NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_ETA_DEST NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_FINAL_VSL_SOB NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_BL_NO NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_BL_DT NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_EDOC_STATUS NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_COURIER_DT NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_SB_NO NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_SB_DT NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_FOR_HBL NVARCHAR(4000) NOT NULL DEFAULT N'');
    SELECT @S = ISNULL(@ROW_IDS, '') + ',', @I = 1, @POS = 0, @BAD = 0;
    SET @LEN = DATALENGTH(@S);
    WHILE @I <= @LEN
    BEGIN
        SET @P = CHARINDEX(',', @S, @I);
        SET @T = LTRIM(RTRIM(SUBSTRING(@S, @I, @P - @I)));
        SET @I = @P + 1;
        IF @T <> ''
        BEGIN
            IF @T LIKE '%[^0-9]%' OR LEN(@T) > 9 OR @T = '0'
                SET @BAD = 1;
            ELSE IF NOT EXISTS (SELECT 1 FROM @L WHERE ID = CONVERT(INT, @T))
            BEGIN
                SET @POS = @POS + 1;
                INSERT INTO @L (ID, POS) VALUES (CONVERT(INT, @T), @POS);
            END
        END
    END
    IF @USER_ID = ''
        SELECT @STATUS = '101', @STATUSTEXT = N'USER_ID is required.';
    ELSE IF @BAD = 1 OR NOT EXISTS (SELECT 1 FROM @L)
        SELECT @STATUS = '101', @STATUSTEXT = N'ROW_IDS must be a comma list of row ids.';
    ELSE
    BEGIN
        SELECT @MISS = COUNT(*) FROM @L L LEFT JOIN dbo.TBL_EXPT_SHEET_ROW R ON R.ID = L.ID WHERE R.ID IS NULL;
        IF @MISS > 0 SELECT @STATUS = '103', @STATUSTEXT = CONVERT(NVARCHAR(10), @MISS) + N' row(s) not found.';
    END

    IF @STATUS = '100'
    BEGIN
        SET @TC = @@TRANCOUNT;
        BEGIN TRY
        IF @TC = 0 BEGIN BEGIN TRANSACTION; END ELSE BEGIN SAVE TRANSACTION EXPT_SHEET_UNLINK; END
            SELECT @MISS = COUNT(*) FROM dbo.TBL_EXPT_SHEET_ROW WITH (UPDLOCK, HOLDLOCK) WHERE ID IN (SELECT ID FROM @L);   -- lock first
            SET @NOW = GETDATE();
            UPDATE R SET EXPTNO = NULL, ROWVER = R.ROWVER + 1, MODIFY_ID = @USER_ID, MODIFY_DT = @NOW
            OUTPUT DELETED.ID, DELETED.EXPTNO INTO @OLD (ID, EXPTNO)
            FROM   dbo.TBL_EXPT_SHEET_ROW R JOIN @L L ON L.ID = R.ID
            WHERE  R.EXPTNO IS NOT NULL;
            SET @N = @@ROWCOUNT;
            INSERT INTO dbo.TBL_EXPT_SHEET_LOG (ROW_KIND, ROW_ID, COL_KEY, OLD_VALUE, NEW_VALUE, ACTION, USER_ID, USER_NAME, LOG_DT)
            SELECT 'W', ID, 'EXPTNO', EXPTNO, NULL, 'unlink', @USER_ID, @USER_NAME, @NOW FROM @OLD;
        IF @TC = 0 COMMIT TRANSACTION;
            SET @STATUSTEXT = CONVERT(NVARCHAR(10), @N) + N' row(s) unlinked.';
        END TRY
        BEGIN CATCH
            DECLARE @ERR NVARCHAR(2048);
            SET @ERR = ERROR_MESSAGE();
            IF XACT_STATE() = -1 OR (XACT_STATE() = 1 AND @TC = 0)
            BEGIN
                ROLLBACK TRANSACTION;
            END
            ELSE IF XACT_STATE() = 1
            BEGIN
                ROLLBACK TRANSACTION EXPT_SHEET_UNLINK;
            END
            SELECT @N = 0;
            SELECT @STATUS = '101', @STATUSTEXT = N'Not unlinked: ' + @ERR;
            IF @TC > 0 AND @@TRANCOUNT = 0
                RAISERROR(N'%s (the caller''s transaction could not be kept and was rolled back)', 16, 1, @ERR);
        END CATCH
    END
    -- self-test hook: only TEST_EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql creates #EXPT_SHEET_SELFTEST
    IF OBJECT_ID('tempdb..#EXPT_SHEET_SELFTEST') IS NOT NULL
        INSERT INTO #EXPT_SHEET_SELFTEST (PROC_NAME, STATUS, STATUSTEXT, N1, N2, N3)
        VALUES ('UNLINK', @STATUS, @STATUSTEXT, @N, NULL, NULL);
    SELECT @STATUS AS STATUS, @STATUSTEXT AS STATUSTEXT, @N AS ROWS_UNLINKED;
    IF @STATUS = '100'
    BEGIN
        INSERT INTO #SHEET_IDS (ID) SELECT ID FROM @L;
        EXEC dbo.USP_EXPT_SHEET_ROWS_OUT 1;
    END
END
GO

/* ---- dbo.USP_EXPT_SHEET_CONVERT_DRAFT ---------------------------------------------------------- */
IF OBJECT_ID('dbo.USP_EXPT_SHEET_CONVERT_DRAFT', 'P') IS NOT NULL
    DROP PROCEDURE dbo.USP_EXPT_SHEET_CONVERT_DRAFT;      -- step 1 made sure it is this script's own
GO
CREATE PROCEDURE dbo.USP_EXPT_SHEET_CONVERT_DRAFT
    @ROW_IDS VARCHAR(MAX)
AS
BEGIN
    -- Deployed by links-22/_DB_FIX/EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql (Export > Sheet view). Do not edit here: change that script.
    -- CONVERT_DRAFT(ROW_IDS). Read only. Table: the rows (LOAD row shape, no Links values);
    -- Table1: the sheet texts of the rows resolved for KIND CONSIGNEE, AGENT, SLINE, PORT, COUNTRY, POLGATE, CLEARANCE, VESSEL -
    -- KIND, SHEET_VALUE, LINKS_CODE, LINKS_TEXT, MATCHED_BY ('alias' / 'name' / ''), CONFIRMED, SOURCE. An alias wins; PORT and
    -- CLEARANCE also match a city code or city name of CITY_MASTER when exactly one city matches; anything else stays blank.
    -- Table2: candidate voyages for the rows' VSL NAME - VSL_RTNO, PORT, VSL_NAME, VSL_VOYNO, ETD (dd-mm-yyyy), SHEET_VALUE,
    -- ETD_MATCH (1 = ETD equals the row's DO ETD / second DO ETD / CURRENT ETD). A voyage qualifies when its Links vessel name is
    -- part of the sheet text (or is the VESSEL alias) and its ETD is within 180 days of today or matches; best first.
    SET NOCOUNT ON;
    SET DATEFORMAT dmy;
    DECLARE @STATUS VARCHAR(3), @STATUSTEXT NVARCHAR(1000), @TODAY DATETIME, @S VARCHAR(MAX), @I INT, @P INT, @LEN INT, @T VARCHAR(100), @POS INT, @BAD BIT;
    SELECT @STATUS = '100', @STATUSTEXT = N'', @TODAY = DATEADD(DAY, DATEDIFF(DAY, 0, GETDATE()), 0);
    DECLARE @L TABLE (ID INT NOT NULL PRIMARY KEY, POS INT NOT NULL);
    CREATE TABLE #SHEET_IDS (ID INT NOT NULL PRIMARY KEY);
    CREATE TABLE #SHEET_LK (EXPTNO VARCHAR(25) NOT NULL PRIMARY KEY, FILLED BIT NOT NULL DEFAULT 0, JOB_FOUND BIT NOT NULL DEFAULT 0,
                            JOB_CANCELLED BIT NOT NULL DEFAULT 0,
                            L_WO NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_PORT NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_COUNTRY NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_QTY NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_CONT NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_CNTR_TYPE NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_VSL_NAME NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_SLINE NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_BOOKING_NO NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_PO_NO NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_CONSIGNEE NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_CONTAINER_NO NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_CURRENT_ETD NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_ETA_DEST NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_FINAL_VSL_SOB NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_BL_NO NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_BL_DT NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_EDOC_STATUS NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_COURIER_DT NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_SB_NO NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_SB_DT NVARCHAR(4000) NOT NULL DEFAULT N'',
                            L_FOR_HBL NVARCHAR(4000) NOT NULL DEFAULT N'');
    CREATE TABLE #CD_V (KIND VARCHAR(20) NOT NULL, SHEET_VALUE NVARCHAR(200) NOT NULL, PRIMARY KEY (KIND, SHEET_VALUE));
    CREATE TABLE #CD_CITY (SHEET_VALUE NVARCHAR(200) NOT NULL PRIMARY KEY, CITY_CODE VARCHAR(10) NULL, CITY_TEXT NVARCHAR(200) NULL);
    CREATE TABLE #CD_N (SHEET_VALUE NVARCHAR(200) NOT NULL, NAME_TXT NVARCHAR(200) NULL, CODE_TXT VARCHAR(50) NULL);
    CREATE TABLE #CD_VM (SHEET_VALUE NVARCHAR(200) NOT NULL, VSL_RTNO VARCHAR(20) NOT NULL, VSL_NAME NVARCHAR(100) NULL, VSL_VOYNO NVARCHAR(20) NULL,
                         PRIMARY KEY (SHEET_VALUE, VSL_RTNO));
    CREATE TABLE #CD_W (SHEET_VALUE NVARCHAR(200) NOT NULL, D NVARCHAR(20) NOT NULL);

    SELECT @S = ISNULL(@ROW_IDS, '') + ',', @I = 1, @POS = 0, @BAD = 0;
    SET @LEN = DATALENGTH(@S);
    WHILE @I <= @LEN
    BEGIN
        SET @P = CHARINDEX(',', @S, @I);
        SET @T = LTRIM(RTRIM(SUBSTRING(@S, @I, @P - @I)));
        SET @I = @P + 1;
        IF @T <> ''
        BEGIN
            IF @T LIKE '%[^0-9]%' OR LEN(@T) > 9 OR @T = '0'
                SET @BAD = 1;
            ELSE IF NOT EXISTS (SELECT 1 FROM @L WHERE ID = CONVERT(INT, @T))
            BEGIN
                SET @POS = @POS + 1;
                INSERT INTO @L (ID, POS) VALUES (CONVERT(INT, @T), @POS);
            END
        END
    END
    IF @BAD = 1 OR NOT EXISTS (SELECT 1 FROM @L)
    BEGIN
        SELECT @STATUS = '101', @STATUSTEXT = N'ROW_IDS must be a comma list of row ids.';
        SELECT @STATUS AS STATUS, @STATUSTEXT AS STATUSTEXT;
        RETURN;
    END

    INSERT INTO #SHEET_IDS (ID) SELECT R.ID FROM dbo.TBL_EXPT_SHEET_ROW R JOIN @L L ON L.ID = R.ID WHERE R.ISDELETED = 0;
    EXEC dbo.USP_EXPT_SHEET_ROWS_OUT 0;

    -- Table1: aliases
    INSERT INTO #CD_V (KIND, SHEET_VALUE)
    SELECT DISTINCT U.KIND, LEFT(LTRIM(RTRIM(U.V)), 200)
    FROM   dbo.TBL_EXPT_SHEET_ROW R JOIN #SHEET_IDS I ON I.ID = R.ID
           CROSS APPLY (VALUES ('CONSIGNEE', R.CONSIGNEE), ('AGENT', R.AGENT), ('SLINE', R.SLINE), ('PORT', R.PORT), ('COUNTRY', R.COUNTRY),
                               ('POLGATE', R.POL_GATE), ('CLEARANCE', R.CLEARANCE_POINT), ('VESSEL', R.VSL_NAME)) U (KIND, V)
    WHERE  LTRIM(RTRIM(ISNULL(U.V, N''))) <> N'';

    INSERT INTO #CD_CITY (SHEET_VALUE, CITY_CODE, CITY_TEXT)
    SELECT V.SHEET_VALUE, MIN(LTRIM(RTRIM(C.CITY_CODE))), MIN(LTRIM(RTRIM(C.CITY_NAME)) + N', ' + LTRIM(RTRIM(ISNULL(C.CITY_COUNTRY, ''))))
    FROM  (SELECT DISTINCT SHEET_VALUE FROM #CD_V WHERE KIND IN ('PORT', 'CLEARANCE')) V
           JOIN dbo.CITY_MASTER C ON LTRIM(RTRIM(C.CITY_CODE)) = V.SHEET_VALUE OR LTRIM(RTRIM(C.CITY_NAME)) = V.SHEET_VALUE
    GROUP BY V.SHEET_VALUE
    HAVING COUNT(DISTINCT C.CITY_CODE) = 1;

    SELECT V.KIND, V.SHEET_VALUE,
           CASE WHEN A.KIND IS NOT NULL THEN A.LINKS_CODE WHEN V.KIND IN ('PORT', 'CLEARANCE') THEN CC.CITY_CODE END AS LINKS_CODE,
           CASE WHEN A.KIND IS NOT NULL THEN A.LINKS_TEXT WHEN V.KIND IN ('PORT', 'CLEARANCE') THEN CC.CITY_TEXT END AS LINKS_TEXT,
           CASE WHEN A.KIND IS NOT NULL THEN 'alias' WHEN V.KIND IN ('PORT', 'CLEARANCE') AND CC.CITY_CODE IS NOT NULL THEN 'name' ELSE '' END AS MATCHED_BY,
           ISNULL(A.CONFIRMED, 0) AS CONFIRMED, A.SOURCE
    FROM   #CD_V V
           LEFT JOIN dbo.TBL_EXPT_SHEET_ALIAS A ON A.KIND = V.KIND AND A.SHEET_VALUE = V.SHEET_VALUE
           LEFT JOIN #CD_CITY CC ON CC.SHEET_VALUE = V.SHEET_VALUE
    ORDER BY V.KIND, V.SHEET_VALUE;

    -- Table2: candidate voyages (each source table read once)
    INSERT INTO #CD_N (SHEET_VALUE, NAME_TXT, CODE_TXT)
    SELECT V.SHEET_VALUE, A.LINKS_TEXT, A.LINKS_CODE
    FROM   #CD_V V LEFT JOIN dbo.TBL_EXPT_SHEET_ALIAS A ON A.KIND = 'VESSEL' AND A.SHEET_VALUE = V.SHEET_VALUE
    WHERE  V.KIND = 'VESSEL';

    INSERT INTO #CD_VM (SHEET_VALUE, VSL_RTNO, VSL_NAME, VSL_VOYNO)
    SELECT N.SHEET_VALUE, VM.VSL_RTNO, MAX(LTRIM(RTRIM(VM.VSL_NAME))), MAX(LTRIM(RTRIM(ISNULL(VM.VSL_VOYNO, ''))))
    FROM   #CD_N N
           JOIN dbo.VSL_MASTER VM
             ON (LEN(LTRIM(RTRIM(ISNULL(VM.VSL_NAME, '')))) >= 4 AND CHARINDEX(LTRIM(RTRIM(VM.VSL_NAME)), REPLACE(REPLACE(N.SHEET_VALUE, N'  ', N' '), N'  ', N' ')) > 0)
             OR (N.NAME_TXT IS NOT NULL AND LTRIM(RTRIM(VM.VSL_NAME)) = N.NAME_TXT)
             OR (N.CODE_TXT IS NOT NULL AND VM.VSL_RTNO = N.CODE_TXT)
    GROUP BY N.SHEET_VALUE, VM.VSL_RTNO;

    INSERT INTO #CD_W (SHEET_VALUE, D)
    SELECT DISTINCT LEFT(LTRIM(RTRIM(R.VSL_NAME)), 200), LEFT(LTRIM(RTRIM(U.D)), 20)
    FROM   dbo.TBL_EXPT_SHEET_ROW R JOIN #SHEET_IDS I ON I.ID = R.ID
           CROSS APPLY (VALUES (R.DO_ETD), (R.DO_ETD2), (R.CURRENT_ETD)) U (D)
    WHERE  LTRIM(RTRIM(ISNULL(R.VSL_NAME, N''))) <> N'' AND LTRIM(RTRIM(ISNULL(U.D, N''))) <> N'';

    SELECT TOP 200 X.VSL_RTNO, X.PORT, X.VSL_NAME, X.VSL_VOYNO, X.ETD, X.SHEET_VALUE, X.ETD_MATCH
    FROM  (SELECT C.VSL_RTNO, LTRIM(RTRIM(P.PORT)) AS PORT, C.VSL_NAME, C.VSL_VOYNO, REPLACE(E0.ETDT, '/', '-') AS ETD, C.SHEET_VALUE, E1.ETD_D,
                  CASE WHEN EXISTS (SELECT 1 FROM #CD_W W WHERE W.SHEET_VALUE = C.SHEET_VALUE AND W.D = REPLACE(E0.ETDT, '/', '-')) THEN 1 ELSE 0 END AS ETD_MATCH
           FROM   #CD_VM C JOIN dbo.VSL_PORTDTLS P ON P.VSL_RTNO = C.VSL_RTNO
                  CROSS APPLY (SELECT LTRIM(RTRIM(ISNULL(P.ETD, ''))) AS ETDT) E0
                  CROSS APPLY (SELECT CASE WHEN E0.ETDT LIKE '[0-3][0-9]/[01][0-9]/[12][0-9][0-9][0-9]' AND ISDATE(E0.ETDT) = 1
                                           THEN CONVERT(DATETIME, E0.ETDT, 103) END AS ETD_D) E1) X
    WHERE  X.ETD_MATCH = 1 OR X.ETD_D BETWEEN DATEADD(DAY, -180, @TODAY) AND DATEADD(DAY, 180, @TODAY)
    ORDER BY X.SHEET_VALUE, X.ETD_MATCH DESC, X.ETD_D DESC, X.VSL_RTNO, X.PORT;
    -- self-test hook: only TEST_EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql creates #EXPT_SHEET_SELFTEST
    IF OBJECT_ID('tempdb..#EXPT_SHEET_SELFTEST') IS NOT NULL
        INSERT INTO #EXPT_SHEET_SELFTEST (PROC_NAME, STATUS, STATUSTEXT, N1, N2, N3)
        VALUES ('CONVERT_DRAFT', @STATUS, @STATUSTEXT, (SELECT COUNT(*) FROM #CD_V), (SELECT COUNT(*) FROM #CD_VM), NULL);
END
GO

/* ---- dbo.USP_EXPT_SHEET_HISTORY ---------------------------------------------------------------- */
IF OBJECT_ID('dbo.USP_EXPT_SHEET_HISTORY', 'P') IS NOT NULL
    DROP PROCEDURE dbo.USP_EXPT_SHEET_HISTORY;      -- step 1 made sure it is this script's own
GO
CREATE PROCEDURE dbo.USP_EXPT_SHEET_HISTORY
    @ROW_KIND CHAR(1),
    @ROW_ID   INT
AS
BEGIN
    -- Deployed by links-22/_DB_FIX/EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql (Export > Sheet view). Do not edit here: change that script.
    -- HISTORY(ROW_KIND, ROW_ID). Table: the log rows of one row ('W' WO row, 'G' grid row, 'M' month - ROW_ID 0 = the
    -- settings: legend, roles, aliases, alias seed), newest first: ID, ROW_KIND, ROW_ID, COL_KEY, OLD_VALUE, NEW_VALUE, ACTION, USER_ID,
    -- USER_NAME, LOG_DT, CAN_RESTORE (1 = RESTORE_VALUE can put OLD_VALUE back: a WO cell 'edit' / 'restore').
    SET NOCOUNT ON;
    DECLARE @REG TABLE (K VARCHAR(40) NOT NULL PRIMARY KEY, KIND VARCHAR(10) NOT NULL, IS_L BIT NOT NULL, TCOL VARCHAR(40) NULL,
                        TKIND CHAR(1) NULL, TLEN INT NULL, MAXLEN INT NOT NULL, OWNER VARCHAR(20) NOT NULL, SEQ INT NOT NULL);
    INSERT INTO @REG (K, KIND, IS_L, TCOL, TKIND, TLEN, MAXLEN, OWNER, SEQ) VALUES
        ('WO', 'text', 1, NULL, NULL, NULL, 500, 'OPS', 1),
        ('PORT', 'choice', 1, NULL, NULL, NULL, 500, 'OPS', 2),
        ('COUNTRY', 'choice', 1, NULL, NULL, NULL, 500, 'OPS', 3),
        ('VEH', 'ml', 0, 'VEHICLE_MODEL', 't', 100, 2000, 'OPS', 4),
        ('QTY', 'num', 1, NULL, NULL, NULL, 500, 'OPS', 5),
        ('CONT', 'num', 1, NULL, NULL, NULL, 500, 'OPS', 6),
        ('CNTR_TYPE', 'choice', 1, NULL, NULL, NULL, 500, 'OPS', 7),
        ('STUFFING_DT', 'date', 0, 'STUFFING_DT', 'd', NULL, 500, 'OPS', 8),
        ('VSL_NAME', 'choice', 1, NULL, NULL, NULL, 500, 'BOOKING', 9),
        ('DO_ETD', 'date', 0, 'DO_ETD', 'd', NULL, 500, 'OPS', 10),
        ('SLINE', 'choice', 1, NULL, NULL, NULL, 500, 'BOOKING', 11),
        ('AGENT', 'choice', 0, NULL, NULL, NULL, 500, 'OPS', 12),
        ('DO_RECEIVE_DT', 'date', 0, 'DO_RECEIVE_DT', 'd', NULL, 500, 'OPS', 13),
        ('BOOKING_NO', 'text', 1, NULL, NULL, NULL, 500, 'OPS', 14),
        ('TRANSPORTER', 'choice', 0, 'TRANSPORTER', 't', 100, 500, 'OPS', 15),
        ('CARGO_TYPE', 'choice', 0, 'CARGO_TYPE', 't', 10, 500, 'OPS', 16),
        ('PLANT', 'choice', 0, 'PLANT', 't', 50, 500, 'OPS', 17),
        ('PO_NO', 'text', 1, NULL, NULL, NULL, 500, 'OPS', 18),
        ('LC_NO', 'text', 0, 'LC_NO', 't', 50, 500, 'OPS', 19),
        ('LC_DATE', 'date', 0, 'LC_DATE', 'd', NULL, 500, 'OPS', 20),
        ('HAZ', 'choice', 0, 'HAZ', 'h', 1, 500, 'OPS', 21),
        ('CONSIGNEE', 'choice', 1, NULL, NULL, NULL, 500, 'OPS', 22),
        ('REMARK1', 'ml', 0, 'REMARK1', 't', 500, 2000, 'ALL', 23),
        ('DO_GIVEN_DT', 'date', 0, 'DO_GIVEN_DT', 'd', NULL, 500, 'OPS', 24),
        ('CONTAINER_NO', 'ml', 1, NULL, NULL, NULL, 2000, 'OPSLEAD', 25),
        ('POL_GATE', 'choice', 0, 'POL_GATE', 't', 50, 500, 'OPS', 26),
        ('GATE_OPEN_DT', 'date', 0, 'GATE_OPEN_DT', 'd', NULL, 500, 'OPS', 27),
        ('GATE_CUTOFF_DT', 'date', 0, 'GATE_CUTOFF_DT', 'd', NULL, 500, 'OPS', 28),
        ('SI_CUTOFF_DT', 'date', 0, 'SI_CUTOFF_DT', 'd', NULL, 500, 'OPS', 29),
        ('DO_ETD2', 'date', 0, NULL, NULL, NULL, 500, 'OPS', 30),
        ('CURRENT_ETD', 'date', 1, NULL, NULL, NULL, 500, 'OPS', 31),
        ('ETA_DEST', 'date', 1, NULL, NULL, NULL, 500, 'OPS', 32),
        ('FINAL_VSL_SOB', 'date', 1, NULL, NULL, NULL, 500, 'OPS', 33),
        ('VGM_SUBMITTED_DT', 'date', 0, 'VGM_SUBMITTED_DT', 'd', NULL, 500, 'DOCS', 34),
        ('SI_SUBMITTED_DT', 'date', 0, 'SI_SUBMITTED_DT', 'd', NULL, 500, 'DOCS', 35),
        ('BL_NO', 'text', 1, NULL, NULL, NULL, 500, 'BLDESK', 36),
        ('BL_DT', 'date', 1, NULL, NULL, NULL, 500, 'OPS', 37),
        ('BL_HANDOVER_DT', 'date', 0, 'BL_HANDOVER_DT', 'd', NULL, 500, 'BLDESK', 38),
        ('FF_JOB', 'text', 0, NULL, NULL, NULL, 500, 'BLDESK', 39),
        ('SLINE_PAYMENT_STATUS', 'text', 0, 'SLINE_PAYMENT_STATUS', 't', 100, 500, 'OPS', 40),
        ('CLEARANCE_POINT', 'choice', 0, 'CLEARANCE_POINT', 't', 50, 500, 'OPSLEAD', 41),
        ('OPEN_ORDER', 'choice', 0, 'OPEN_ORDER', 't', 50, 500, 'OPSLEAD', 42),
        ('BUFFER_YARD', 'text', 0, 'BUFFER_YARD', 't', 50, 500, 'OPSLEAD', 43),
        ('EDOC_STATUS', 'text', 1, NULL, NULL, NULL, 500, 'DOCS', 44),
        ('COURIER_DT', 'date', 1, NULL, NULL, NULL, 500, 'DOCS', 45),
        ('PICKUP_DT', 'date', 0, 'PICKUP_DT', 'd', NULL, 500, 'YARD', 46),
        ('CNTR_DISPATCH_DT', 'date', 0, 'CNTR_DISPATCH_DT', 'd', NULL, 500, 'OPS', 47),
        ('CNTR_REPORT_NS_DT', 'date', 0, 'CNTR_REPORT_NS_DT', 'd', NULL, 500, 'YARD', 48),
        ('CNTR_GATEDIN_DT', 'date', 0, 'CNTR_GATEDIN_DT', 'd', NULL, 500, 'YARD', 49),
        ('SB_NO', 'text', 1, NULL, NULL, NULL, 500, 'OPSLEAD', 50),
        ('SB_DT', 'date', 1, NULL, NULL, NULL, 500, 'OPSLEAD', 51),
        ('FOR_HBL', 'text', 1, NULL, NULL, NULL, 500, 'OPS', 52);
    DECLARE @STATUS VARCHAR(3), @STATUSTEXT NVARCHAR(1000), @N INT;
    SELECT @STATUS = '100', @STATUSTEXT = N'';
    SELECT L.ID, L.ROW_KIND, L.ROW_ID, L.COL_KEY, L.OLD_VALUE, L.NEW_VALUE, L.ACTION, L.USER_ID, L.USER_NAME, L.LOG_DT,
           CASE WHEN L.ROW_KIND = 'W' AND L.ACTION IN ('edit', 'restore') AND EXISTS (SELECT 1 FROM @REG G WHERE G.K = L.COL_KEY)
                THEN 1 ELSE 0 END AS CAN_RESTORE
    FROM   dbo.TBL_EXPT_SHEET_LOG L
    WHERE  L.ROW_KIND = UPPER(ISNULL(@ROW_KIND, '')) AND L.ROW_ID = ISNULL(@ROW_ID, 0)
    ORDER BY L.ID DESC;
    SET @N = @@ROWCOUNT;
    -- self-test hook: only TEST_EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql creates #EXPT_SHEET_SELFTEST
    IF OBJECT_ID('tempdb..#EXPT_SHEET_SELFTEST') IS NOT NULL
        INSERT INTO #EXPT_SHEET_SELFTEST (PROC_NAME, STATUS, STATUSTEXT, N1, N2, N3)
        VALUES ('HISTORY', @STATUS, @STATUSTEXT, @N, NULL, NULL);
END
GO

/* ---- dbo.USP_EXPT_SHEET_RESTORE_VALUE ---------------------------------------------------------- */
IF OBJECT_ID('dbo.USP_EXPT_SHEET_RESTORE_VALUE', 'P') IS NOT NULL
    DROP PROCEDURE dbo.USP_EXPT_SHEET_RESTORE_VALUE;      -- step 1 made sure it is this script's own
GO
CREATE PROCEDURE dbo.USP_EXPT_SHEET_RESTORE_VALUE
    @LOG_ID    BIGINT,
    @USER_ID   VARCHAR(50),
    @USER_NAME NVARCHAR(100)
AS
BEGIN
    -- Deployed by links-22/_DB_FIX/EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql (Export > Sheet view). Do not edit here: change that script.
    -- RESTORE_VALUE(LOG_ID, USER_ID, USER_NAME). Puts OLD_VALUE of a WO cell 'edit' / 'restore' log row back, through
    -- SAVE_APPLY with the row's current version (so ownership, Links locks and tracking work as for any edit), logged as
    -- 'restore'. 103 = log row / sheet row not found, 104 = that kind of history entry cannot be restored. On a refusal only Table
    -- (STATUS, STATUSTEXT); otherwise the SAVE_CELLS results.
    SET NOCOUNT ON;
    DECLARE @STATUS VARCHAR(3), @STATUSTEXT NVARCHAR(1000), @ROW_ID INT, @KIND CHAR(1), @ACT VARCHAR(20), @K VARCHAR(40), @OLD NVARCHAR(2000),
            @MONTH_ID INT, @TAB VARCHAR(20), @VER INT, @EDITS NVARCHAR(MAX), @FOUND BIT;
    SELECT @STATUS = '100', @STATUSTEXT = N'', @FOUND = 0;
    DECLARE @REG TABLE (K VARCHAR(40) NOT NULL PRIMARY KEY, KIND VARCHAR(10) NOT NULL, IS_L BIT NOT NULL, TCOL VARCHAR(40) NULL,
                        TKIND CHAR(1) NULL, TLEN INT NULL, MAXLEN INT NOT NULL, OWNER VARCHAR(20) NOT NULL, SEQ INT NOT NULL);
    INSERT INTO @REG (K, KIND, IS_L, TCOL, TKIND, TLEN, MAXLEN, OWNER, SEQ) VALUES
        ('WO', 'text', 1, NULL, NULL, NULL, 500, 'OPS', 1),
        ('PORT', 'choice', 1, NULL, NULL, NULL, 500, 'OPS', 2),
        ('COUNTRY', 'choice', 1, NULL, NULL, NULL, 500, 'OPS', 3),
        ('VEH', 'ml', 0, 'VEHICLE_MODEL', 't', 100, 2000, 'OPS', 4),
        ('QTY', 'num', 1, NULL, NULL, NULL, 500, 'OPS', 5),
        ('CONT', 'num', 1, NULL, NULL, NULL, 500, 'OPS', 6),
        ('CNTR_TYPE', 'choice', 1, NULL, NULL, NULL, 500, 'OPS', 7),
        ('STUFFING_DT', 'date', 0, 'STUFFING_DT', 'd', NULL, 500, 'OPS', 8),
        ('VSL_NAME', 'choice', 1, NULL, NULL, NULL, 500, 'BOOKING', 9),
        ('DO_ETD', 'date', 0, 'DO_ETD', 'd', NULL, 500, 'OPS', 10),
        ('SLINE', 'choice', 1, NULL, NULL, NULL, 500, 'BOOKING', 11),
        ('AGENT', 'choice', 0, NULL, NULL, NULL, 500, 'OPS', 12),
        ('DO_RECEIVE_DT', 'date', 0, 'DO_RECEIVE_DT', 'd', NULL, 500, 'OPS', 13),
        ('BOOKING_NO', 'text', 1, NULL, NULL, NULL, 500, 'OPS', 14),
        ('TRANSPORTER', 'choice', 0, 'TRANSPORTER', 't', 100, 500, 'OPS', 15),
        ('CARGO_TYPE', 'choice', 0, 'CARGO_TYPE', 't', 10, 500, 'OPS', 16),
        ('PLANT', 'choice', 0, 'PLANT', 't', 50, 500, 'OPS', 17),
        ('PO_NO', 'text', 1, NULL, NULL, NULL, 500, 'OPS', 18),
        ('LC_NO', 'text', 0, 'LC_NO', 't', 50, 500, 'OPS', 19),
        ('LC_DATE', 'date', 0, 'LC_DATE', 'd', NULL, 500, 'OPS', 20),
        ('HAZ', 'choice', 0, 'HAZ', 'h', 1, 500, 'OPS', 21),
        ('CONSIGNEE', 'choice', 1, NULL, NULL, NULL, 500, 'OPS', 22),
        ('REMARK1', 'ml', 0, 'REMARK1', 't', 500, 2000, 'ALL', 23),
        ('DO_GIVEN_DT', 'date', 0, 'DO_GIVEN_DT', 'd', NULL, 500, 'OPS', 24),
        ('CONTAINER_NO', 'ml', 1, NULL, NULL, NULL, 2000, 'OPSLEAD', 25),
        ('POL_GATE', 'choice', 0, 'POL_GATE', 't', 50, 500, 'OPS', 26),
        ('GATE_OPEN_DT', 'date', 0, 'GATE_OPEN_DT', 'd', NULL, 500, 'OPS', 27),
        ('GATE_CUTOFF_DT', 'date', 0, 'GATE_CUTOFF_DT', 'd', NULL, 500, 'OPS', 28),
        ('SI_CUTOFF_DT', 'date', 0, 'SI_CUTOFF_DT', 'd', NULL, 500, 'OPS', 29),
        ('DO_ETD2', 'date', 0, NULL, NULL, NULL, 500, 'OPS', 30),
        ('CURRENT_ETD', 'date', 1, NULL, NULL, NULL, 500, 'OPS', 31),
        ('ETA_DEST', 'date', 1, NULL, NULL, NULL, 500, 'OPS', 32),
        ('FINAL_VSL_SOB', 'date', 1, NULL, NULL, NULL, 500, 'OPS', 33),
        ('VGM_SUBMITTED_DT', 'date', 0, 'VGM_SUBMITTED_DT', 'd', NULL, 500, 'DOCS', 34),
        ('SI_SUBMITTED_DT', 'date', 0, 'SI_SUBMITTED_DT', 'd', NULL, 500, 'DOCS', 35),
        ('BL_NO', 'text', 1, NULL, NULL, NULL, 500, 'BLDESK', 36),
        ('BL_DT', 'date', 1, NULL, NULL, NULL, 500, 'OPS', 37),
        ('BL_HANDOVER_DT', 'date', 0, 'BL_HANDOVER_DT', 'd', NULL, 500, 'BLDESK', 38),
        ('FF_JOB', 'text', 0, NULL, NULL, NULL, 500, 'BLDESK', 39),
        ('SLINE_PAYMENT_STATUS', 'text', 0, 'SLINE_PAYMENT_STATUS', 't', 100, 500, 'OPS', 40),
        ('CLEARANCE_POINT', 'choice', 0, 'CLEARANCE_POINT', 't', 50, 500, 'OPSLEAD', 41),
        ('OPEN_ORDER', 'choice', 0, 'OPEN_ORDER', 't', 50, 500, 'OPSLEAD', 42),
        ('BUFFER_YARD', 'text', 0, 'BUFFER_YARD', 't', 50, 500, 'OPSLEAD', 43),
        ('EDOC_STATUS', 'text', 1, NULL, NULL, NULL, 500, 'DOCS', 44),
        ('COURIER_DT', 'date', 1, NULL, NULL, NULL, 500, 'DOCS', 45),
        ('PICKUP_DT', 'date', 0, 'PICKUP_DT', 'd', NULL, 500, 'YARD', 46),
        ('CNTR_DISPATCH_DT', 'date', 0, 'CNTR_DISPATCH_DT', 'd', NULL, 500, 'OPS', 47),
        ('CNTR_REPORT_NS_DT', 'date', 0, 'CNTR_REPORT_NS_DT', 'd', NULL, 500, 'YARD', 48),
        ('CNTR_GATEDIN_DT', 'date', 0, 'CNTR_GATEDIN_DT', 'd', NULL, 500, 'YARD', 49),
        ('SB_NO', 'text', 1, NULL, NULL, NULL, 500, 'OPSLEAD', 50),
        ('SB_DT', 'date', 1, NULL, NULL, NULL, 500, 'OPSLEAD', 51),
        ('FOR_HBL', 'text', 1, NULL, NULL, NULL, 500, 'OPS', 52);
    SELECT @ROW_ID = ROW_ID, @KIND = ROW_KIND, @ACT = ACTION, @K = COL_KEY, @OLD = OLD_VALUE, @FOUND = 1
    FROM   dbo.TBL_EXPT_SHEET_LOG WHERE ID = @LOG_ID;
    IF @FOUND = 0
        SELECT @STATUS = '103', @STATUSTEXT = N'History entry not found.';
    ELSE IF @KIND <> 'W' OR @ACT NOT IN ('edit', 'restore') OR NOT EXISTS (SELECT 1 FROM @REG WHERE K = @K)
        SELECT @STATUS = '104', @STATUSTEXT = N'Only a cell value of a WO row can be restored from history.';
    ELSE
    BEGIN
        SELECT @MONTH_ID = MONTH_ID, @TAB = TAB_CODE, @VER = ROWVER FROM dbo.TBL_EXPT_SHEET_ROW WHERE ID = @ROW_ID AND ISDELETED = 0;
        IF @VER IS NULL SELECT @STATUS = '103', @STATUSTEXT = N'The row is gone (deleted).';
    END
    IF @STATUS <> '100'
    BEGIN
        -- self-test hook: only TEST_EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql creates #EXPT_SHEET_SELFTEST
        IF OBJECT_ID('tempdb..#EXPT_SHEET_SELFTEST') IS NOT NULL
            INSERT INTO #EXPT_SHEET_SELFTEST (PROC_NAME, STATUS, STATUSTEXT, N1, N2, N3)
            VALUES ('RESTORE_VALUE', @STATUS, @STATUSTEXT, NULL, NULL, NULL);
        SELECT @STATUS AS STATUS, @STATUSTEXT AS STATUSTEXT;
        RETURN;
    END
    SET @EDITS = CONVERT(NVARCHAR(MAX), (SELECT @ROW_ID AS [@r], @VER AS [@v], @K AS [@k], ISNULL(@OLD, N'') AS [text()] FOR XML PATH('e')));
    EXEC dbo.USP_EXPT_SHEET_SAVE_APPLY @MONTH_ID, @TAB, @EDITS, 'restore', @USER_ID, @USER_NAME;
END
GO

/* ---- dbo.USP_EXPT_SHEET_LEGEND ----------------------------------------------------------------- */
IF OBJECT_ID('dbo.USP_EXPT_SHEET_LEGEND', 'P') IS NOT NULL
    DROP PROCEDURE dbo.USP_EXPT_SHEET_LEGEND;      -- step 1 made sure it is this script's own
GO
CREATE PROCEDURE dbo.USP_EXPT_SHEET_LEGEND
AS
BEGIN
    -- Deployed by links-22/_DB_FIX/EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql (Export > Sheet view). Do not edit here: change that script.
    -- LEGEND(). Table: the Colour CODE rows - CODE, LABEL, MEANING, BG, FG, SORT, ACTIVE (BG NULL = no fill, FG NULL = default text).
    SET NOCOUNT ON;
    SELECT CODE, LABEL, MEANING, BG, FG, SORT, ACTIVE, MODIFY_ID, MODIFY_DT FROM dbo.TBL_EXPT_SHEET_STATUS ORDER BY SORT, CODE;
END
GO

/* ---- dbo.USP_EXPT_SHEET_LEGEND_IU -------------------------------------------------------------- */
IF OBJECT_ID('dbo.USP_EXPT_SHEET_LEGEND_IU', 'P') IS NOT NULL
    DROP PROCEDURE dbo.USP_EXPT_SHEET_LEGEND_IU;      -- step 1 made sure it is this script's own
GO
CREATE PROCEDURE dbo.USP_EXPT_SHEET_LEGEND_IU
    @CODE      VARCHAR(20),
    @LABEL     NVARCHAR(100),
    @MEANING   NVARCHAR(200),
    @BG        VARCHAR(7),
    @FG        VARCHAR(7),
    @SORT      INT,
    @ACTIVE    BIT,
    @USER_ID   VARCHAR(50),
    @USER_NAME NVARCHAR(100)
AS
BEGIN
    -- Deployed by links-22/_DB_FIX/EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql (Export > Sheet view). Do not edit here: change that script.
    -- LEGEND_IU(CODE, LABEL, MEANING, BG, FG, SORT, ACTIVE, USER_ID, USER_NAME). Adds or changes one Colour CODE status
    -- (CODE A-Z 0-9 _, max 20; colours #rrggbb, '' / NULL = none). Logged as ROW_KIND 'M', ROW_ID 0, COL_KEY LEGEND.<CODE>.
    -- Table: STATUS, STATUSTEXT + the row.
    SET NOCOUNT ON;
    IF @@TRANCOUNT = 0 SET XACT_ABORT ON ELSE SET XACT_ABORT OFF;
    DECLARE @STATUS VARCHAR(3), @STATUSTEXT NVARCHAR(1000), @NOW DATETIME, @TC INT, @OLD NVARCHAR(2000), @NEW NVARCHAR(2000);
    SELECT @STATUS = '100', @STATUSTEXT = N'', @NOW = GETDATE();
    SELECT @CODE = UPPER(LTRIM(RTRIM(ISNULL(@CODE, '')))), @LABEL = LTRIM(RTRIM(ISNULL(@LABEL, N''))), @MEANING = NULLIF(LTRIM(RTRIM(@MEANING)), N''),
           @BG = NULLIF(LOWER(LTRIM(RTRIM(@BG))), ''), @FG = NULLIF(LOWER(LTRIM(RTRIM(@FG))), ''), @SORT = ISNULL(@SORT, 0),
           @ACTIVE = ISNULL(@ACTIVE, 1), @USER_ID = LTRIM(RTRIM(ISNULL(@USER_ID, '')));
    IF @USER_ID = ''
        SELECT @STATUS = '101', @STATUSTEXT = N'USER_ID is required.';
    ELSE IF @CODE = '' OR PATINDEX('%[^A-Z0-9_]%', @CODE COLLATE Latin1_General_BIN2) > 0
        SELECT @STATUS = '101', @STATUSTEXT = N'CODE must be letters, digits or _ (max 20).';
    ELSE IF @LABEL = N''
        SELECT @STATUS = '101', @STATUSTEXT = N'LABEL is required.';
    ELSE IF (@BG IS NOT NULL AND NOT (LEN(@BG) = 7 AND @BG LIKE '#[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]'))
         OR (@FG IS NOT NULL AND NOT (LEN(@FG) = 7 AND @FG LIKE '#[0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f][0-9a-f]'))
        SELECT @STATUS = '101', @STATUSTEXT = N'BG / FG must be colours like #ffff00.';

    IF @STATUS = '100'
    BEGIN
        SET @TC = @@TRANCOUNT;
        BEGIN TRY
        IF @TC = 0 BEGIN BEGIN TRANSACTION; END ELSE BEGIN SAVE TRANSACTION EXPT_SHEET_LEGEND; END
            SELECT @OLD = LABEL + N' | ' + ISNULL(MEANING, N'') + N' | ' + ISNULL(BG, '') + N' | ' + ISNULL(FG, '') + N' | ' + CONVERT(NVARCHAR(10), SORT)
                          + N' | ' + CASE WHEN ACTIVE = 1 THEN N'active' ELSE N'inactive' END
            FROM   dbo.TBL_EXPT_SHEET_STATUS WITH (UPDLOCK, HOLDLOCK) WHERE CODE = @CODE;
            IF @OLD IS NULL
                INSERT INTO dbo.TBL_EXPT_SHEET_STATUS (CODE, LABEL, MEANING, BG, FG, SORT, ACTIVE, MODIFY_ID, MODIFY_DT)
                VALUES (@CODE, @LABEL, @MEANING, @BG, @FG, @SORT, @ACTIVE, @USER_ID, @NOW);
            ELSE
                UPDATE dbo.TBL_EXPT_SHEET_STATUS
                SET    LABEL = @LABEL, MEANING = @MEANING, BG = @BG, FG = @FG, SORT = @SORT, ACTIVE = @ACTIVE, MODIFY_ID = @USER_ID, MODIFY_DT = @NOW
                WHERE  CODE = @CODE;
            SET @NEW = @LABEL + N' | ' + ISNULL(@MEANING, N'') + N' | ' + ISNULL(@BG, '') + N' | ' + ISNULL(@FG, '') + N' | ' + CONVERT(NVARCHAR(10), @SORT)
                       + N' | ' + CASE WHEN @ACTIVE = 1 THEN N'active' ELSE N'inactive' END;
            IF ISNULL(@OLD, N'') <> @NEW
                INSERT INTO dbo.TBL_EXPT_SHEET_LOG (ROW_KIND, ROW_ID, COL_KEY, OLD_VALUE, NEW_VALUE, ACTION, USER_ID, USER_NAME, LOG_DT)
                VALUES ('M', 0, 'LEGEND.' + @CODE, @OLD, @NEW, CASE WHEN @OLD IS NULL THEN 'insert' ELSE 'edit' END, @USER_ID, @USER_NAME, @NOW);
        IF @TC = 0 COMMIT TRANSACTION;
            SET @STATUSTEXT = N'Status ' + @CODE + N' saved.';
        END TRY
        BEGIN CATCH
            DECLARE @ERR NVARCHAR(2048);
            SET @ERR = ERROR_MESSAGE();
            IF XACT_STATE() = -1 OR (XACT_STATE() = 1 AND @TC = 0)
            BEGIN
                ROLLBACK TRANSACTION;
            END
            ELSE IF XACT_STATE() = 1
            BEGIN
                ROLLBACK TRANSACTION EXPT_SHEET_LEGEND;
            END
            SELECT @STATUS = '101', @STATUSTEXT = N'Not saved: ' + @ERR;
            IF @TC > 0 AND @@TRANCOUNT = 0
                RAISERROR(N'%s (the caller''s transaction could not be kept and was rolled back)', 16, 1, @ERR);
        END CATCH
    END
    -- self-test hook: only TEST_EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql creates #EXPT_SHEET_SELFTEST
    IF OBJECT_ID('tempdb..#EXPT_SHEET_SELFTEST') IS NOT NULL
        INSERT INTO #EXPT_SHEET_SELFTEST (PROC_NAME, STATUS, STATUSTEXT, N1, N2, N3)
        VALUES ('LEGEND_IU', @STATUS, @STATUSTEXT, NULL, NULL, NULL);
    SELECT @STATUS AS STATUS, @STATUSTEXT AS STATUSTEXT, S.CODE, S.LABEL, S.MEANING, S.BG, S.FG, S.SORT, S.ACTIVE
    FROM   (SELECT 1 AS ONE) O LEFT JOIN dbo.TBL_EXPT_SHEET_STATUS S ON S.CODE = @CODE;
END
GO

/* ---- dbo.USP_EXPT_SHEET_ROLES ------------------------------------------------------------------ */
IF OBJECT_ID('dbo.USP_EXPT_SHEET_ROLES', 'P') IS NOT NULL
    DROP PROCEDURE dbo.USP_EXPT_SHEET_ROLES;      -- step 1 made sure it is this script's own
GO
CREATE PROCEDURE dbo.USP_EXPT_SHEET_ROLES
AS
BEGIN
    -- Deployed by links-22/_DB_FIX/EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql (Export > Sheet view). Do not edit here: change that script.
    -- ROLES(). Table: CODE, LABEL, SORT, COLS, USERS; Table1: ROLE_CODE, COL_KEY; Table2: ROLE_CODE, USER_ID, USER_NAME,
    -- LOGIN, USER_CODE, CMPID (user found by CMPID or by user code; USER_NAME NULL = no such Links user).
    SET NOCOUNT ON;
    SELECT R.CODE, R.LABEL, R.SORT,
           (SELECT COUNT(*) FROM dbo.TBL_EXPT_SHEET_ROLE_COL C WHERE C.ROLE_CODE = R.CODE) AS COLS,
           (SELECT COUNT(*) FROM dbo.TBL_EXPT_SHEET_ROLE_USER U WHERE U.ROLE_CODE = R.CODE) AS USERS
    FROM   dbo.TBL_EXPT_SHEET_ROLE R
    ORDER BY R.SORT, R.CODE;
    SELECT ROLE_CODE, COL_KEY FROM dbo.TBL_EXPT_SHEET_ROLE_COL ORDER BY ROLE_CODE, COL_KEY;
    SELECT U.ROLE_CODE, U.USER_ID,
           LTRIM(RTRIM(COALESCE(NULLIF(LTRIM(RTRIM(C1.fullname)), ''), C1.cmp_username, NULLIF(LTRIM(RTRIM(C2.fullname)), ''), C2.cmp_username))) AS USER_NAME,
           LTRIM(RTRIM(COALESCE(C1.cmp_username, C2.cmp_username))) AS LOGIN,
           LTRIM(RTRIM(COALESCE(C1.cmp_usercode, C2.cmp_usercode))) AS USER_CODE,
           COALESCE(C1.cmpid, C2.cmpid) AS CMPID
    FROM   dbo.TBL_EXPT_SHEET_ROLE_USER U
           LEFT JOIN dbo.cmp_dtls C1 ON CONVERT(VARCHAR(50), C1.cmpid) = U.USER_ID
           LEFT JOIN dbo.cmp_dtls C2 ON LTRIM(RTRIM(C2.cmp_usercode)) = U.USER_ID AND C1.cmpid IS NULL
    ORDER BY U.ROLE_CODE, U.USER_ID;
END
GO

/* ---- dbo.USP_EXPT_SHEET_ROLES_IU --------------------------------------------------------------- */
IF OBJECT_ID('dbo.USP_EXPT_SHEET_ROLES_IU', 'P') IS NOT NULL
    DROP PROCEDURE dbo.USP_EXPT_SHEET_ROLES_IU;      -- step 1 made sure it is this script's own
GO
CREATE PROCEDURE dbo.USP_EXPT_SHEET_ROLES_IU
    @ROLE_CODE VARCHAR(20),
    @COL_KEYS  VARCHAR(MAX),
    @USER_IDS  VARCHAR(MAX),
    @USER_ID   VARCHAR(50),
    @USER_NAME NVARCHAR(100)
AS
BEGIN
    -- Deployed by links-22/_DB_FIX/EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql (Export > Sheet view). Do not edit here: change that script.
    -- ROLES_IU(ROLE_CODE, COL_KEYS, USER_IDS, USER_ID, USER_NAME). Replaces the role's columns with COL_KEYS and its users
    -- with USER_IDS (comma lists; '' clears, NULL keeps). Keys must be registry keys (ADMIN owns no columns - it edits all); users
    -- must be Links users (CMPID or user code, as stored). Logged as ROW_KIND 'M', ROW_ID 0, COL_KEY ROLE.<CODE>.
    -- Table: STATUS, STATUSTEXT, ROLE_CODE, COLS, USERS; Table1: the role's columns; Table2: the role's users.
    SET NOCOUNT ON;
    IF @@TRANCOUNT = 0 SET XACT_ABORT ON ELSE SET XACT_ABORT OFF;
    DECLARE @STATUS VARCHAR(3), @STATUSTEXT NVARCHAR(1000), @NOW DATETIME, @TC INT, @BADLIST NVARCHAR(1000),
            @OLDC NVARCHAR(2000), @OLDU NVARCHAR(2000), @NEWC NVARCHAR(2000), @NEWU NVARCHAR(2000), @S VARCHAR(MAX), @I INT, @P INT, @LEN INT, @T VARCHAR(100), @POS INT, @BAD BIT;
    SELECT @STATUS = '100', @STATUSTEXT = N'', @NOW = GETDATE();
    SELECT @ROLE_CODE = UPPER(LTRIM(RTRIM(ISNULL(@ROLE_CODE, '')))), @USER_ID = LTRIM(RTRIM(ISNULL(@USER_ID, '')));
    DECLARE @REG TABLE (K VARCHAR(40) NOT NULL PRIMARY KEY, KIND VARCHAR(10) NOT NULL, IS_L BIT NOT NULL, TCOL VARCHAR(40) NULL,
                        TKIND CHAR(1) NULL, TLEN INT NULL, MAXLEN INT NOT NULL, OWNER VARCHAR(20) NOT NULL, SEQ INT NOT NULL);
    INSERT INTO @REG (K, KIND, IS_L, TCOL, TKIND, TLEN, MAXLEN, OWNER, SEQ) VALUES
        ('WO', 'text', 1, NULL, NULL, NULL, 500, 'OPS', 1),
        ('PORT', 'choice', 1, NULL, NULL, NULL, 500, 'OPS', 2),
        ('COUNTRY', 'choice', 1, NULL, NULL, NULL, 500, 'OPS', 3),
        ('VEH', 'ml', 0, 'VEHICLE_MODEL', 't', 100, 2000, 'OPS', 4),
        ('QTY', 'num', 1, NULL, NULL, NULL, 500, 'OPS', 5),
        ('CONT', 'num', 1, NULL, NULL, NULL, 500, 'OPS', 6),
        ('CNTR_TYPE', 'choice', 1, NULL, NULL, NULL, 500, 'OPS', 7),
        ('STUFFING_DT', 'date', 0, 'STUFFING_DT', 'd', NULL, 500, 'OPS', 8),
        ('VSL_NAME', 'choice', 1, NULL, NULL, NULL, 500, 'BOOKING', 9),
        ('DO_ETD', 'date', 0, 'DO_ETD', 'd', NULL, 500, 'OPS', 10),
        ('SLINE', 'choice', 1, NULL, NULL, NULL, 500, 'BOOKING', 11),
        ('AGENT', 'choice', 0, NULL, NULL, NULL, 500, 'OPS', 12),
        ('DO_RECEIVE_DT', 'date', 0, 'DO_RECEIVE_DT', 'd', NULL, 500, 'OPS', 13),
        ('BOOKING_NO', 'text', 1, NULL, NULL, NULL, 500, 'OPS', 14),
        ('TRANSPORTER', 'choice', 0, 'TRANSPORTER', 't', 100, 500, 'OPS', 15),
        ('CARGO_TYPE', 'choice', 0, 'CARGO_TYPE', 't', 10, 500, 'OPS', 16),
        ('PLANT', 'choice', 0, 'PLANT', 't', 50, 500, 'OPS', 17),
        ('PO_NO', 'text', 1, NULL, NULL, NULL, 500, 'OPS', 18),
        ('LC_NO', 'text', 0, 'LC_NO', 't', 50, 500, 'OPS', 19),
        ('LC_DATE', 'date', 0, 'LC_DATE', 'd', NULL, 500, 'OPS', 20),
        ('HAZ', 'choice', 0, 'HAZ', 'h', 1, 500, 'OPS', 21),
        ('CONSIGNEE', 'choice', 1, NULL, NULL, NULL, 500, 'OPS', 22),
        ('REMARK1', 'ml', 0, 'REMARK1', 't', 500, 2000, 'ALL', 23),
        ('DO_GIVEN_DT', 'date', 0, 'DO_GIVEN_DT', 'd', NULL, 500, 'OPS', 24),
        ('CONTAINER_NO', 'ml', 1, NULL, NULL, NULL, 2000, 'OPSLEAD', 25),
        ('POL_GATE', 'choice', 0, 'POL_GATE', 't', 50, 500, 'OPS', 26),
        ('GATE_OPEN_DT', 'date', 0, 'GATE_OPEN_DT', 'd', NULL, 500, 'OPS', 27),
        ('GATE_CUTOFF_DT', 'date', 0, 'GATE_CUTOFF_DT', 'd', NULL, 500, 'OPS', 28),
        ('SI_CUTOFF_DT', 'date', 0, 'SI_CUTOFF_DT', 'd', NULL, 500, 'OPS', 29),
        ('DO_ETD2', 'date', 0, NULL, NULL, NULL, 500, 'OPS', 30),
        ('CURRENT_ETD', 'date', 1, NULL, NULL, NULL, 500, 'OPS', 31),
        ('ETA_DEST', 'date', 1, NULL, NULL, NULL, 500, 'OPS', 32),
        ('FINAL_VSL_SOB', 'date', 1, NULL, NULL, NULL, 500, 'OPS', 33),
        ('VGM_SUBMITTED_DT', 'date', 0, 'VGM_SUBMITTED_DT', 'd', NULL, 500, 'DOCS', 34),
        ('SI_SUBMITTED_DT', 'date', 0, 'SI_SUBMITTED_DT', 'd', NULL, 500, 'DOCS', 35),
        ('BL_NO', 'text', 1, NULL, NULL, NULL, 500, 'BLDESK', 36),
        ('BL_DT', 'date', 1, NULL, NULL, NULL, 500, 'OPS', 37),
        ('BL_HANDOVER_DT', 'date', 0, 'BL_HANDOVER_DT', 'd', NULL, 500, 'BLDESK', 38),
        ('FF_JOB', 'text', 0, NULL, NULL, NULL, 500, 'BLDESK', 39),
        ('SLINE_PAYMENT_STATUS', 'text', 0, 'SLINE_PAYMENT_STATUS', 't', 100, 500, 'OPS', 40),
        ('CLEARANCE_POINT', 'choice', 0, 'CLEARANCE_POINT', 't', 50, 500, 'OPSLEAD', 41),
        ('OPEN_ORDER', 'choice', 0, 'OPEN_ORDER', 't', 50, 500, 'OPSLEAD', 42),
        ('BUFFER_YARD', 'text', 0, 'BUFFER_YARD', 't', 50, 500, 'OPSLEAD', 43),
        ('EDOC_STATUS', 'text', 1, NULL, NULL, NULL, 500, 'DOCS', 44),
        ('COURIER_DT', 'date', 1, NULL, NULL, NULL, 500, 'DOCS', 45),
        ('PICKUP_DT', 'date', 0, 'PICKUP_DT', 'd', NULL, 500, 'YARD', 46),
        ('CNTR_DISPATCH_DT', 'date', 0, 'CNTR_DISPATCH_DT', 'd', NULL, 500, 'OPS', 47),
        ('CNTR_REPORT_NS_DT', 'date', 0, 'CNTR_REPORT_NS_DT', 'd', NULL, 500, 'YARD', 48),
        ('CNTR_GATEDIN_DT', 'date', 0, 'CNTR_GATEDIN_DT', 'd', NULL, 500, 'YARD', 49),
        ('SB_NO', 'text', 1, NULL, NULL, NULL, 500, 'OPSLEAD', 50),
        ('SB_DT', 'date', 1, NULL, NULL, NULL, 500, 'OPSLEAD', 51),
        ('FOR_HBL', 'text', 1, NULL, NULL, NULL, 500, 'OPS', 52);
    DECLARE @K TABLE (V VARCHAR(100) NOT NULL PRIMARY KEY);
    DECLARE @U TABLE (V VARCHAR(100) NOT NULL PRIMARY KEY);
    IF @COL_KEYS IS NOT NULL
    BEGIN
        SELECT @S = ISNULL(@COL_KEYS, '') + ',', @I = 1;
        SET @LEN = DATALENGTH(@S);
        WHILE @I <= @LEN
        BEGIN
            SET @P = CHARINDEX(',', @S, @I);
            SET @T = UPPER(LTRIM(RTRIM(SUBSTRING(@S, @I, @P - @I))));
            SET @I = @P + 1;
            IF @T <> '' AND NOT EXISTS (SELECT 1 FROM @K WHERE V = @T) INSERT INTO @K (V) VALUES (@T);
        END
    END
    IF @USER_IDS IS NOT NULL
    BEGIN
        SELECT @S = ISNULL(@USER_IDS, '') + ',', @I = 1;
        SET @LEN = DATALENGTH(@S);
        WHILE @I <= @LEN
        BEGIN
            SET @P = CHARINDEX(',', @S, @I);
            SET @T = LTRIM(RTRIM(SUBSTRING(@S, @I, @P - @I)));
            SET @I = @P + 1;
            IF @T <> '' AND NOT EXISTS (SELECT 1 FROM @U WHERE V = @T) INSERT INTO @U (V) VALUES (@T);
        END
    END

    IF @USER_ID = ''
        SELECT @STATUS = '101', @STATUSTEXT = N'USER_ID is required.';
    ELSE IF NOT EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_ROLE WHERE CODE = @ROLE_CODE)
        SELECT @STATUS = '103', @STATUSTEXT = N'Role ' + @ROLE_CODE + N' not found.';
    ELSE IF @ROLE_CODE = 'ADMIN' AND EXISTS (SELECT 1 FROM @K)
        SELECT @STATUS = '101', @STATUSTEXT = N'ADMIN owns no columns: it edits every column.';
    ELSE
    BEGIN
        SET @BADLIST = STUFF((SELECT N', ' + V FROM @K WHERE V NOT IN (SELECT K FROM @REG) ORDER BY V FOR XML PATH(''), TYPE).value('.', 'NVARCHAR(MAX)'), 1, 2, N'');
        IF @BADLIST IS NOT NULL
            SELECT @STATUS = '101', @STATUSTEXT = N'Unknown column key(s): ' + LEFT(@BADLIST, 800);
        ELSE
        BEGIN
            SET @BADLIST = STUFF((SELECT N', ' + U.V FROM @U U
                                  WHERE NOT EXISTS (SELECT 1 FROM dbo.cmp_dtls C WHERE CONVERT(VARCHAR(50), C.cmpid) = U.V OR LTRIM(RTRIM(C.cmp_usercode)) = U.V)
                                  ORDER BY U.V FOR XML PATH(''), TYPE).value('.', 'NVARCHAR(MAX)'), 1, 2, N'');
            IF @BADLIST IS NOT NULL
                SELECT @STATUS = '101', @STATUSTEXT = N'Unknown Links user id(s): ' + LEFT(@BADLIST, 800);
        END
    END

    IF @STATUS = '100'
    BEGIN
        SET @TC = @@TRANCOUNT;
        BEGIN TRY
        IF @TC = 0 BEGIN BEGIN TRANSACTION; END ELSE BEGIN SAVE TRANSACTION EXPT_SHEET_ROLES; END
            SET @OLDC = LEFT(ISNULL(STUFF((SELECT N',' + COL_KEY FROM dbo.TBL_EXPT_SHEET_ROLE_COL WITH (UPDLOCK, HOLDLOCK) WHERE ROLE_CODE = @ROLE_CODE ORDER BY COL_KEY
                                           FOR XML PATH(''), TYPE).value('.', 'NVARCHAR(MAX)'), 1, 1, N''), N''), 2000);
            SET @OLDU = LEFT(ISNULL(STUFF((SELECT N',' + USER_ID FROM dbo.TBL_EXPT_SHEET_ROLE_USER WITH (UPDLOCK, HOLDLOCK) WHERE ROLE_CODE = @ROLE_CODE ORDER BY USER_ID
                                           FOR XML PATH(''), TYPE).value('.', 'NVARCHAR(MAX)'), 1, 1, N''), N''), 2000);
            IF @COL_KEYS IS NOT NULL
            BEGIN
                DELETE FROM dbo.TBL_EXPT_SHEET_ROLE_COL WHERE ROLE_CODE = @ROLE_CODE;
                INSERT INTO dbo.TBL_EXPT_SHEET_ROLE_COL (ROLE_CODE, COL_KEY) SELECT @ROLE_CODE, V FROM @K;
            END
            IF @USER_IDS IS NOT NULL
            BEGIN
                DELETE FROM dbo.TBL_EXPT_SHEET_ROLE_USER WHERE ROLE_CODE = @ROLE_CODE;
                INSERT INTO dbo.TBL_EXPT_SHEET_ROLE_USER (ROLE_CODE, USER_ID, MAKER_ID, MAKER_DT) SELECT @ROLE_CODE, V, @USER_ID, @NOW FROM @U;
            END
            SET @NEWC = LEFT(ISNULL(STUFF((SELECT N',' + COL_KEY FROM dbo.TBL_EXPT_SHEET_ROLE_COL WHERE ROLE_CODE = @ROLE_CODE ORDER BY COL_KEY
                                           FOR XML PATH(''), TYPE).value('.', 'NVARCHAR(MAX)'), 1, 1, N''), N''), 2000);
            SET @NEWU = LEFT(ISNULL(STUFF((SELECT N',' + USER_ID FROM dbo.TBL_EXPT_SHEET_ROLE_USER WHERE ROLE_CODE = @ROLE_CODE ORDER BY USER_ID
                                           FOR XML PATH(''), TYPE).value('.', 'NVARCHAR(MAX)'), 1, 1, N''), N''), 2000);
            INSERT INTO dbo.TBL_EXPT_SHEET_LOG (ROW_KIND, ROW_ID, COL_KEY, OLD_VALUE, NEW_VALUE, ACTION, USER_ID, USER_NAME, LOG_DT)
            SELECT 'M', 0, X.K, X.O, X.N, 'edit', @USER_ID, @USER_NAME, @NOW
            FROM  (SELECT LEFT('ROLE.' + @ROLE_CODE + '.COLS', 40) AS K, @OLDC AS O, @NEWC AS N WHERE @OLDC <> @NEWC
                   UNION ALL
                   SELECT LEFT('ROLE.' + @ROLE_CODE + '.USERS', 40), @OLDU, @NEWU WHERE @OLDU <> @NEWU) X;
        IF @TC = 0 COMMIT TRANSACTION;
            SET @STATUSTEXT = N'Role ' + @ROLE_CODE + N' saved.';
        END TRY
        BEGIN CATCH
            DECLARE @ERR NVARCHAR(2048);
            SET @ERR = ERROR_MESSAGE();
            IF XACT_STATE() = -1 OR (XACT_STATE() = 1 AND @TC = 0)
            BEGIN
                ROLLBACK TRANSACTION;
            END
            ELSE IF XACT_STATE() = 1
            BEGIN
                ROLLBACK TRANSACTION EXPT_SHEET_ROLES;
            END
            SELECT @STATUS = '101', @STATUSTEXT = N'Not saved: ' + @ERR;
            IF @TC > 0 AND @@TRANCOUNT = 0
                RAISERROR(N'%s (the caller''s transaction could not be kept and was rolled back)', 16, 1, @ERR);
        END CATCH
    END
    -- self-test hook: only TEST_EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql creates #EXPT_SHEET_SELFTEST
    IF OBJECT_ID('tempdb..#EXPT_SHEET_SELFTEST') IS NOT NULL
        INSERT INTO #EXPT_SHEET_SELFTEST (PROC_NAME, STATUS, STATUSTEXT, N1, N2, N3)
        VALUES ('ROLES_IU', @STATUS, @STATUSTEXT, NULL, NULL, NULL);
    SELECT @STATUS AS STATUS, @STATUSTEXT AS STATUSTEXT, @ROLE_CODE AS ROLE_CODE,
           (SELECT COUNT(*) FROM dbo.TBL_EXPT_SHEET_ROLE_COL WHERE ROLE_CODE = @ROLE_CODE) AS COLS,
           (SELECT COUNT(*) FROM dbo.TBL_EXPT_SHEET_ROLE_USER WHERE ROLE_CODE = @ROLE_CODE) AS USERS;
    IF @STATUS = '100'
    BEGIN
        SELECT ROLE_CODE, COL_KEY FROM dbo.TBL_EXPT_SHEET_ROLE_COL WHERE ROLE_CODE = @ROLE_CODE ORDER BY COL_KEY;
        SELECT ROLE_CODE, USER_ID FROM dbo.TBL_EXPT_SHEET_ROLE_USER WHERE ROLE_CODE = @ROLE_CODE ORDER BY USER_ID;
    END
END
GO

/* ---- dbo.USP_EXPT_SHEET_MY_ROLES --------------------------------------------------------------- */
IF OBJECT_ID('dbo.USP_EXPT_SHEET_MY_ROLES', 'P') IS NOT NULL
    DROP PROCEDURE dbo.USP_EXPT_SHEET_MY_ROLES;      -- step 1 made sure it is this script's own
GO
CREATE PROCEDURE dbo.USP_EXPT_SHEET_MY_ROLES
    @USER_ID VARCHAR(50)
AS
BEGIN
    -- Deployed by links-22/_DB_FIX/EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql (Export > Sheet view). Do not edit here: change that script.
    -- MY_ROLES(USER_ID). Table: ROLE_CODE, LABEL, IMPLICIT - the roles the user holds, plus ALL (IMPLICIT = 1: every user with
    -- the edit right) and, for a Links SA user (cmp_dtls.RoleType = 'SA') not given ADMIN explicitly, ADMIN with IMPLICIT = 1;
    -- Table1: COL_KEY - the columns the user may edit (all 52 for ADMIN). The user is matched by CMPID or by user code
    -- (cmp_dtls.cmp_usercode).
    SET NOCOUNT ON;
    DECLARE @IS_ADMIN BIT, @STATUS VARCHAR(3), @STATUSTEXT NVARCHAR(1000), @EDITABLE INT;
    SELECT @STATUS = '100', @STATUSTEXT = N'';
    SET @USER_ID = LTRIM(RTRIM(ISNULL(@USER_ID, '')));
    DECLARE @REG TABLE (K VARCHAR(40) NOT NULL PRIMARY KEY, KIND VARCHAR(10) NOT NULL, IS_L BIT NOT NULL, TCOL VARCHAR(40) NULL,
                        TKIND CHAR(1) NULL, TLEN INT NULL, MAXLEN INT NOT NULL, OWNER VARCHAR(20) NOT NULL, SEQ INT NOT NULL);
    INSERT INTO @REG (K, KIND, IS_L, TCOL, TKIND, TLEN, MAXLEN, OWNER, SEQ) VALUES
        ('WO', 'text', 1, NULL, NULL, NULL, 500, 'OPS', 1),
        ('PORT', 'choice', 1, NULL, NULL, NULL, 500, 'OPS', 2),
        ('COUNTRY', 'choice', 1, NULL, NULL, NULL, 500, 'OPS', 3),
        ('VEH', 'ml', 0, 'VEHICLE_MODEL', 't', 100, 2000, 'OPS', 4),
        ('QTY', 'num', 1, NULL, NULL, NULL, 500, 'OPS', 5),
        ('CONT', 'num', 1, NULL, NULL, NULL, 500, 'OPS', 6),
        ('CNTR_TYPE', 'choice', 1, NULL, NULL, NULL, 500, 'OPS', 7),
        ('STUFFING_DT', 'date', 0, 'STUFFING_DT', 'd', NULL, 500, 'OPS', 8),
        ('VSL_NAME', 'choice', 1, NULL, NULL, NULL, 500, 'BOOKING', 9),
        ('DO_ETD', 'date', 0, 'DO_ETD', 'd', NULL, 500, 'OPS', 10),
        ('SLINE', 'choice', 1, NULL, NULL, NULL, 500, 'BOOKING', 11),
        ('AGENT', 'choice', 0, NULL, NULL, NULL, 500, 'OPS', 12),
        ('DO_RECEIVE_DT', 'date', 0, 'DO_RECEIVE_DT', 'd', NULL, 500, 'OPS', 13),
        ('BOOKING_NO', 'text', 1, NULL, NULL, NULL, 500, 'OPS', 14),
        ('TRANSPORTER', 'choice', 0, 'TRANSPORTER', 't', 100, 500, 'OPS', 15),
        ('CARGO_TYPE', 'choice', 0, 'CARGO_TYPE', 't', 10, 500, 'OPS', 16),
        ('PLANT', 'choice', 0, 'PLANT', 't', 50, 500, 'OPS', 17),
        ('PO_NO', 'text', 1, NULL, NULL, NULL, 500, 'OPS', 18),
        ('LC_NO', 'text', 0, 'LC_NO', 't', 50, 500, 'OPS', 19),
        ('LC_DATE', 'date', 0, 'LC_DATE', 'd', NULL, 500, 'OPS', 20),
        ('HAZ', 'choice', 0, 'HAZ', 'h', 1, 500, 'OPS', 21),
        ('CONSIGNEE', 'choice', 1, NULL, NULL, NULL, 500, 'OPS', 22),
        ('REMARK1', 'ml', 0, 'REMARK1', 't', 500, 2000, 'ALL', 23),
        ('DO_GIVEN_DT', 'date', 0, 'DO_GIVEN_DT', 'd', NULL, 500, 'OPS', 24),
        ('CONTAINER_NO', 'ml', 1, NULL, NULL, NULL, 2000, 'OPSLEAD', 25),
        ('POL_GATE', 'choice', 0, 'POL_GATE', 't', 50, 500, 'OPS', 26),
        ('GATE_OPEN_DT', 'date', 0, 'GATE_OPEN_DT', 'd', NULL, 500, 'OPS', 27),
        ('GATE_CUTOFF_DT', 'date', 0, 'GATE_CUTOFF_DT', 'd', NULL, 500, 'OPS', 28),
        ('SI_CUTOFF_DT', 'date', 0, 'SI_CUTOFF_DT', 'd', NULL, 500, 'OPS', 29),
        ('DO_ETD2', 'date', 0, NULL, NULL, NULL, 500, 'OPS', 30),
        ('CURRENT_ETD', 'date', 1, NULL, NULL, NULL, 500, 'OPS', 31),
        ('ETA_DEST', 'date', 1, NULL, NULL, NULL, 500, 'OPS', 32),
        ('FINAL_VSL_SOB', 'date', 1, NULL, NULL, NULL, 500, 'OPS', 33),
        ('VGM_SUBMITTED_DT', 'date', 0, 'VGM_SUBMITTED_DT', 'd', NULL, 500, 'DOCS', 34),
        ('SI_SUBMITTED_DT', 'date', 0, 'SI_SUBMITTED_DT', 'd', NULL, 500, 'DOCS', 35),
        ('BL_NO', 'text', 1, NULL, NULL, NULL, 500, 'BLDESK', 36),
        ('BL_DT', 'date', 1, NULL, NULL, NULL, 500, 'OPS', 37),
        ('BL_HANDOVER_DT', 'date', 0, 'BL_HANDOVER_DT', 'd', NULL, 500, 'BLDESK', 38),
        ('FF_JOB', 'text', 0, NULL, NULL, NULL, 500, 'BLDESK', 39),
        ('SLINE_PAYMENT_STATUS', 'text', 0, 'SLINE_PAYMENT_STATUS', 't', 100, 500, 'OPS', 40),
        ('CLEARANCE_POINT', 'choice', 0, 'CLEARANCE_POINT', 't', 50, 500, 'OPSLEAD', 41),
        ('OPEN_ORDER', 'choice', 0, 'OPEN_ORDER', 't', 50, 500, 'OPSLEAD', 42),
        ('BUFFER_YARD', 'text', 0, 'BUFFER_YARD', 't', 50, 500, 'OPSLEAD', 43),
        ('EDOC_STATUS', 'text', 1, NULL, NULL, NULL, 500, 'DOCS', 44),
        ('COURIER_DT', 'date', 1, NULL, NULL, NULL, 500, 'DOCS', 45),
        ('PICKUP_DT', 'date', 0, 'PICKUP_DT', 'd', NULL, 500, 'YARD', 46),
        ('CNTR_DISPATCH_DT', 'date', 0, 'CNTR_DISPATCH_DT', 'd', NULL, 500, 'OPS', 47),
        ('CNTR_REPORT_NS_DT', 'date', 0, 'CNTR_REPORT_NS_DT', 'd', NULL, 500, 'YARD', 48),
        ('CNTR_GATEDIN_DT', 'date', 0, 'CNTR_GATEDIN_DT', 'd', NULL, 500, 'YARD', 49),
        ('SB_NO', 'text', 1, NULL, NULL, NULL, 500, 'OPSLEAD', 50),
        ('SB_DT', 'date', 1, NULL, NULL, NULL, 500, 'OPSLEAD', 51),
        ('FOR_HBL', 'text', 1, NULL, NULL, NULL, 500, 'OPS', 52);
    -- the caller's roles. TBL_EXPT_SHEET_ROLE_USER holds Links user ids; the CMPID (e.g. 37) and the user code
    -- (cmp_dtls.cmp_usercode, e.g. P100037) of the same user both count, whichever one the settings screen stored.
    -- A Links SA user (cmp_dtls.RoleType = 'SA', the login's ROLETYPE) counts as ADMIN, as SA skips form rights.
    DECLARE @ME TABLE (UID VARCHAR(50) NOT NULL PRIMARY KEY);
    DECLARE @MYROLES TABLE (ROLE_CODE VARCHAR(20) NOT NULL PRIMARY KEY, IMPLICIT BIT NOT NULL DEFAULT 0);
    IF @USER_ID <> '' INSERT INTO @ME (UID) VALUES (@USER_ID);
    INSERT INTO @ME (UID)
    SELECT X.UID
    FROM (SELECT LTRIM(RTRIM(C.cmp_usercode)) AS UID FROM dbo.cmp_dtls C WHERE CONVERT(VARCHAR(50), C.cmpid) = @USER_ID
          UNION
          SELECT CONVERT(VARCHAR(50), C.cmpid) FROM dbo.cmp_dtls C WHERE LTRIM(RTRIM(C.cmp_usercode)) = @USER_ID) X
    WHERE ISNULL(X.UID, '') <> '' AND NOT EXISTS (SELECT 1 FROM @ME M WHERE M.UID = X.UID);
    INSERT INTO @MYROLES (ROLE_CODE)
    SELECT DISTINCT RU.ROLE_CODE FROM dbo.TBL_EXPT_SHEET_ROLE_USER RU JOIN @ME M ON M.UID = RU.USER_ID;
    IF NOT EXISTS (SELECT 1 FROM @MYROLES WHERE ROLE_CODE = 'ADMIN')
       AND EXISTS (SELECT 1 FROM dbo.cmp_dtls C
                   WHERE (CONVERT(VARCHAR(50), C.cmpid) = @USER_ID OR LTRIM(RTRIM(C.cmp_usercode)) = @USER_ID)
                     AND LTRIM(RTRIM(ISNULL(C.RoleType, ''))) = 'SA')
        INSERT INTO @MYROLES (ROLE_CODE, IMPLICIT) VALUES ('ADMIN', 1);
    SET @IS_ADMIN = CASE WHEN EXISTS (SELECT 1 FROM @MYROLES WHERE ROLE_CODE = 'ADMIN') THEN 1 ELSE 0 END;
    SELECT X.ROLE_CODE, R.LABEL, X.IMPLICIT
    FROM  (SELECT ROLE_CODE, IMPLICIT FROM @MYROLES
           UNION ALL
           SELECT 'ALL', 1 WHERE NOT EXISTS (SELECT 1 FROM @MYROLES WHERE ROLE_CODE = 'ALL')) X
           LEFT JOIN dbo.TBL_EXPT_SHEET_ROLE R ON R.CODE = X.ROLE_CODE
    ORDER BY ISNULL(R.SORT, 999), X.ROLE_CODE;
    SELECT G.K AS COL_KEY
    FROM   @REG G
    WHERE  @IS_ADMIN = 1
       OR  EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_ROLE_COL RC
                   WHERE RC.COL_KEY = G.K AND (RC.ROLE_CODE = 'ALL' OR RC.ROLE_CODE IN (SELECT ROLE_CODE FROM @MYROLES)))
    ORDER BY G.SEQ;
    SET @EDITABLE = @@ROWCOUNT;
    -- self-test hook: only TEST_EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql creates #EXPT_SHEET_SELFTEST
    IF OBJECT_ID('tempdb..#EXPT_SHEET_SELFTEST') IS NOT NULL
        INSERT INTO #EXPT_SHEET_SELFTEST (PROC_NAME, STATUS, STATUSTEXT, N1, N2, N3)
        VALUES ('MY_ROLES', @STATUS, @STATUSTEXT, @EDITABLE, CONVERT(INT, @IS_ADMIN), NULL);
END
GO

/* ---- dbo.USP_EXPT_SHEET_ALIAS ------------------------------------------------------------------ */
IF OBJECT_ID('dbo.USP_EXPT_SHEET_ALIAS', 'P') IS NOT NULL
    DROP PROCEDURE dbo.USP_EXPT_SHEET_ALIAS;      -- step 1 made sure it is this script's own
GO
CREATE PROCEDURE dbo.USP_EXPT_SHEET_ALIAS
AS
BEGIN
    -- Deployed by links-22/_DB_FIX/EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql (Export > Sheet view). Do not edit here: change that script.
    -- ALIAS(). Table: KIND, SHEET_VALUE, LINKS_CODE, LINKS_TEXT, SOURCE ('auto' / 'admin'), CONFIRMED, MODIFY_ID, MODIFY_DT.
    SET NOCOUNT ON;
    SELECT KIND, SHEET_VALUE, LINKS_CODE, LINKS_TEXT, SOURCE, CONFIRMED, MODIFY_ID, MODIFY_DT
    FROM   dbo.TBL_EXPT_SHEET_ALIAS ORDER BY KIND, SHEET_VALUE;
END
GO

/* ---- dbo.USP_EXPT_SHEET_ALIAS_IU --------------------------------------------------------------- */
IF OBJECT_ID('dbo.USP_EXPT_SHEET_ALIAS_IU', 'P') IS NOT NULL
    DROP PROCEDURE dbo.USP_EXPT_SHEET_ALIAS_IU;      -- step 1 made sure it is this script's own
GO
CREATE PROCEDURE dbo.USP_EXPT_SHEET_ALIAS_IU
    @KIND        VARCHAR(20),
    @SHEET_VALUE NVARCHAR(200),
    @LINKS_CODE  VARCHAR(50),
    @LINKS_TEXT  NVARCHAR(200),
    @CONFIRMED   BIT,
    @USER_ID     VARCHAR(50),
    @USER_NAME   NVARCHAR(100)
AS
BEGIN
    -- Deployed by links-22/_DB_FIX/EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql (Export > Sheet view). Do not edit here: change that script.
    -- ALIAS_IU(KIND, SHEET_VALUE, LINKS_CODE, LINKS_TEXT, CONFIRMED, USER_ID, USER_NAME). Adds or changes an alias as SOURCE
    -- 'admin' (never overwritten by ALIAS_SEED); LINKS_CODE and LINKS_TEXT both empty removes it. Logged as 'M' / 0 / ALIAS.<KIND>.
    -- Table: STATUS, STATUSTEXT + the row (empty after a removal).
    SET NOCOUNT ON;
    IF @@TRANCOUNT = 0 SET XACT_ABORT ON ELSE SET XACT_ABORT OFF;
    DECLARE @STATUS VARCHAR(3), @STATUSTEXT NVARCHAR(1000), @NOW DATETIME, @TC INT, @OLD NVARCHAR(2000), @NEW NVARCHAR(2000), @HAD BIT;
    SELECT @STATUS = '100', @STATUSTEXT = N'', @NOW = GETDATE(), @HAD = 0;
    SELECT @KIND = UPPER(LTRIM(RTRIM(ISNULL(@KIND, '')))), @SHEET_VALUE = LTRIM(RTRIM(ISNULL(@SHEET_VALUE, N''))),
           @LINKS_CODE = LTRIM(RTRIM(ISNULL(@LINKS_CODE, ''))), @LINKS_TEXT = LTRIM(RTRIM(ISNULL(@LINKS_TEXT, N''))),
           @CONFIRMED = ISNULL(@CONFIRMED, 1), @USER_ID = LTRIM(RTRIM(ISNULL(@USER_ID, '')));
    IF @USER_ID = ''
        SELECT @STATUS = '101', @STATUSTEXT = N'USER_ID is required.';
    ELSE IF @KIND NOT IN ('CONSIGNEE', 'AGENT', 'SLINE', 'PORT', 'COUNTRY', 'POLGATE', 'CLEARANCE', 'VESSEL')
        SELECT @STATUS = '101', @STATUSTEXT = N'KIND must be CONSIGNEE, AGENT, SLINE, PORT, COUNTRY, POLGATE, CLEARANCE or VESSEL.';
    ELSE IF @SHEET_VALUE = N''
        SELECT @STATUS = '101', @STATUSTEXT = N'SHEET_VALUE is required.';

    IF @STATUS = '100'
    BEGIN
        SET @TC = @@TRANCOUNT;
        BEGIN TRY
        IF @TC = 0 BEGIN BEGIN TRANSACTION; END ELSE BEGIN SAVE TRANSACTION EXPT_SHEET_ALIAS; END
            SELECT @HAD = 1, @OLD = ISNULL(LINKS_CODE, '') + N' | ' + ISNULL(LINKS_TEXT, N'') + N' | ' + SOURCE + CASE WHEN CONFIRMED = 1 THEN N' | confirmed' ELSE N'' END
            FROM   dbo.TBL_EXPT_SHEET_ALIAS WITH (UPDLOCK, HOLDLOCK) WHERE KIND = @KIND AND SHEET_VALUE = @SHEET_VALUE;
            IF @LINKS_CODE = '' AND @LINKS_TEXT = N''
            BEGIN
                DELETE FROM dbo.TBL_EXPT_SHEET_ALIAS WHERE KIND = @KIND AND SHEET_VALUE = @SHEET_VALUE;
                SET @STATUSTEXT = CASE WHEN @HAD = 1 THEN N'Alias removed.' ELSE N'No such alias - nothing removed.' END;
            END
            ELSE
            BEGIN
                IF @HAD = 1
                    UPDATE dbo.TBL_EXPT_SHEET_ALIAS
                    SET    LINKS_CODE = NULLIF(@LINKS_CODE, ''), LINKS_TEXT = NULLIF(@LINKS_TEXT, N''), SOURCE = 'admin', CONFIRMED = @CONFIRMED,
                           MODIFY_ID = @USER_ID, MODIFY_DT = @NOW
                    WHERE  KIND = @KIND AND SHEET_VALUE = @SHEET_VALUE;
                ELSE
                    INSERT INTO dbo.TBL_EXPT_SHEET_ALIAS (KIND, SHEET_VALUE, LINKS_CODE, LINKS_TEXT, SOURCE, CONFIRMED, MODIFY_ID, MODIFY_DT)
                    VALUES (@KIND, @SHEET_VALUE, NULLIF(@LINKS_CODE, ''), NULLIF(@LINKS_TEXT, N''), 'admin', @CONFIRMED, @USER_ID, @NOW);
                SET @STATUSTEXT = N'Alias saved.';
            END
            SET @NEW = CASE WHEN @LINKS_CODE = '' AND @LINKS_TEXT = N'' THEN NULL
                            ELSE @LINKS_CODE + N' | ' + @LINKS_TEXT + N' | admin' + CASE WHEN @CONFIRMED = 1 THEN N' | confirmed' ELSE N'' END END;
            IF ISNULL(@OLD, N'') <> ISNULL(@NEW, N'')
                INSERT INTO dbo.TBL_EXPT_SHEET_LOG (ROW_KIND, ROW_ID, COL_KEY, OLD_VALUE, NEW_VALUE, ACTION, USER_ID, USER_NAME, LOG_DT)
                VALUES ('M', 0, 'ALIAS.' + @KIND, LEFT(@SHEET_VALUE + N' = ' + ISNULL(@OLD, N''), 2000), LEFT(@SHEET_VALUE + N' = ' + ISNULL(@NEW, N''), 2000),
                        CASE WHEN @NEW IS NULL THEN 'delete' WHEN @HAD = 0 THEN 'insert' ELSE 'edit' END, @USER_ID, @USER_NAME, @NOW);
        IF @TC = 0 COMMIT TRANSACTION;
        END TRY
        BEGIN CATCH
            DECLARE @ERR NVARCHAR(2048);
            SET @ERR = ERROR_MESSAGE();
            IF XACT_STATE() = -1 OR (XACT_STATE() = 1 AND @TC = 0)
            BEGIN
                ROLLBACK TRANSACTION;
            END
            ELSE IF XACT_STATE() = 1
            BEGIN
                ROLLBACK TRANSACTION EXPT_SHEET_ALIAS;
            END
            SELECT @STATUS = '101', @STATUSTEXT = N'Not saved: ' + @ERR;
            IF @TC > 0 AND @@TRANCOUNT = 0
                RAISERROR(N'%s (the caller''s transaction could not be kept and was rolled back)', 16, 1, @ERR);
        END CATCH
    END
    -- self-test hook: only TEST_EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql creates #EXPT_SHEET_SELFTEST
    IF OBJECT_ID('tempdb..#EXPT_SHEET_SELFTEST') IS NOT NULL
        INSERT INTO #EXPT_SHEET_SELFTEST (PROC_NAME, STATUS, STATUSTEXT, N1, N2, N3)
        VALUES ('ALIAS_IU', @STATUS, @STATUSTEXT, NULL, NULL, NULL);
    SELECT @STATUS AS STATUS, @STATUSTEXT AS STATUSTEXT, A.KIND, A.SHEET_VALUE, A.LINKS_CODE, A.LINKS_TEXT, A.SOURCE, A.CONFIRMED, A.MODIFY_ID, A.MODIFY_DT
    FROM   (SELECT 1 AS ONE) O LEFT JOIN dbo.TBL_EXPT_SHEET_ALIAS A ON A.KIND = @KIND AND A.SHEET_VALUE = @SHEET_VALUE;
END
GO

/* ---- dbo.USP_EXPT_SHEET_ALIAS_SEED ------------------------------------------------------------- */
IF OBJECT_ID('dbo.USP_EXPT_SHEET_ALIAS_SEED', 'P') IS NOT NULL
    DROP PROCEDURE dbo.USP_EXPT_SHEET_ALIAS_SEED;      -- step 1 made sure it is this script's own
GO
CREATE PROCEDURE dbo.USP_EXPT_SHEET_ALIAS_SEED
    @CMPCODE   VARCHAR(6),
    @CITYCODE  VARCHAR(3),
    @USER_ID   VARCHAR(50),
    @USER_NAME NVARCHAR(100)
AS
BEGIN
    -- Deployed by links-22/_DB_FIX/EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql (Export > Sheet view). Do not edit here: change that script.
    -- ALIAS_SEED(CMPCODE, CITYCODE, USER_ID, USER_NAME). Fills 'auto' aliases from the linked, not deleted WO rows of the
    -- branch's months: sheet text -> the linked job's code, the most frequent one per text:
    --   CONSIGNEE -> EXPT_CONSIGNEE (CONSIGNEE_MASTER)   SLINE -> EXPT_VSLAGENT, the vessel agent (AGENT_MASTER)
    --   PORT -> EXPT_POD   COUNTRY -> EXPT_DESTCOUNTRY   CLEARANCE -> EXPT_LDGPORT (CITY_MASTER)   VESSEL -> EXPT_VESSEL (VSL_MASTER)
    -- AGENT and POLGATE are not seeded: Links keeps no field they map to reliably (EXPT_MASTER.AGENT holds the consignee party,
    -- FK_TERMINALID is 0 on the Bajaj jobs). New texts are added unconfirmed; existing 'auto' rows that are not confirmed get the
    -- new code; 'admin' rows and confirmed rows are never touched.
    -- Table: STATUS, STATUSTEXT, INSERTED, UPDATED, PAIRS.
    SET NOCOUNT ON;
    IF @@TRANCOUNT = 0 SET XACT_ABORT ON ELSE SET XACT_ABORT OFF;
    DECLARE @STATUS VARCHAR(3), @STATUSTEXT NVARCHAR(1000), @NOW DATETIME, @TC INT, @INS INT, @UPD INT, @PAIRS INT;
    SELECT @STATUS = '100', @STATUSTEXT = N'', @NOW = GETDATE(), @INS = 0, @UPD = 0, @PAIRS = 0;
    SELECT @CMPCODE = LTRIM(RTRIM(ISNULL(@CMPCODE, ''))), @CITYCODE = LTRIM(RTRIM(ISNULL(@CITYCODE, ''))), @USER_ID = LTRIM(RTRIM(ISNULL(@USER_ID, '')));
    CREATE TABLE #AS_R (EXPTNO VARCHAR(25) NOT NULL, CONSIGNEE NVARCHAR(500) NULL, SLINE NVARCHAR(500) NULL, PORT NVARCHAR(500) NULL,
                        COUNTRY NVARCHAR(500) NULL, VSL_NAME NVARCHAR(500) NULL, CLEARANCE NVARCHAR(500) NULL);
    CREATE TABLE #AS_B (KIND VARCHAR(20) NOT NULL, SHEET_VALUE NVARCHAR(200) NOT NULL, LINKS_CODE VARCHAR(50) NOT NULL, LINKS_TEXT NVARCHAR(200) NULL,
                        PRIMARY KEY (KIND, SHEET_VALUE));
    DECLARE @OUTA TABLE (ACT NVARCHAR(10) NOT NULL);

    IF @USER_ID = ''
        SELECT @STATUS = '101', @STATUSTEXT = N'USER_ID is required.';
    ELSE IF @CMPCODE = '' OR @CITYCODE = ''
        SELECT @STATUS = '101', @STATUSTEXT = N'CMPCODE and CITYCODE are required.';

    IF @STATUS = '100'
    BEGIN
        INSERT INTO #AS_R (EXPTNO, CONSIGNEE, SLINE, PORT, COUNTRY, VSL_NAME, CLEARANCE)
        SELECT R.EXPTNO, LTRIM(RTRIM(R.CONSIGNEE)), LTRIM(RTRIM(R.SLINE)), LTRIM(RTRIM(R.PORT)), LTRIM(RTRIM(R.COUNTRY)),
               LTRIM(RTRIM(R.VSL_NAME)), LTRIM(RTRIM(R.CLEARANCE_POINT))
        FROM   dbo.TBL_EXPT_SHEET_ROW R JOIN dbo.TBL_EXPT_SHEET_MONTH M ON M.ID = R.MONTH_ID
        WHERE  M.CMPCODE = @CMPCODE AND M.CITYCODE = @CITYCODE AND R.ISDELETED = 0 AND R.EXPTNO IS NOT NULL;

        -- the jobs, one row each (read once), and the pairs
        SELECT X.EXPTNO, X.CON, X.VSLAGENT, X.POD, X.DEST, X.VESSEL, X.LDG
        INTO   #AS_J
        FROM  (SELECT LTRIM(RTRIM(E.EXPTNO)) AS EXPTNO, LTRIM(RTRIM(ISNULL(E.EXPT_CONSIGNEE, ''))) AS CON, LTRIM(RTRIM(ISNULL(E.EXPT_VSLAGENT, ''))) AS VSLAGENT,
                      LTRIM(RTRIM(ISNULL(E.EXPT_POD, ''))) AS POD, LTRIM(RTRIM(ISNULL(E.EXPT_DESTCOUNTRY, ''))) AS DEST,
                      LTRIM(RTRIM(ISNULL(E.EXPT_VESSEL, ''))) AS VESSEL, LTRIM(RTRIM(ISNULL(E.EXPT_LDGPORT, ''))) AS LDG,
                      ROW_NUMBER() OVER (PARTITION BY E.EXPTNO ORDER BY E.SYSEXPT_DOCRECD, E.ID) AS RN
               FROM   dbo.EXPT_MASTER E JOIN (SELECT DISTINCT EXPTNO FROM #AS_R) R ON R.EXPTNO = E.EXPTNO) X
        WHERE  X.RN = 1;

        INSERT INTO #AS_B (KIND, SHEET_VALUE, LINKS_CODE)
        SELECT Y.KIND, Y.SV, Y.CODE
        FROM  (SELECT P.KIND, LEFT(P.SV, 200) AS SV, LEFT(P.CODE, 50) AS CODE,
                      ROW_NUMBER() OVER (PARTITION BY P.KIND, LEFT(P.SV, 200) ORDER BY COUNT(*) DESC, LEFT(P.CODE, 50)) AS RN
               FROM   #AS_R R JOIN #AS_J J ON J.EXPTNO = R.EXPTNO
                      CROSS APPLY (VALUES ('CONSIGNEE', R.CONSIGNEE, J.CON), ('SLINE', R.SLINE, J.VSLAGENT), ('PORT', R.PORT, J.POD),
                                          ('COUNTRY', R.COUNTRY, J.DEST), ('VESSEL', R.VSL_NAME, J.VESSEL), ('CLEARANCE', R.CLEARANCE, J.LDG)) P (KIND, SV, CODE)
               WHERE  ISNULL(P.SV, N'') <> N'' AND ISNULL(P.CODE, '') <> ''
               GROUP BY P.KIND, LEFT(P.SV, 200), LEFT(P.CODE, 50)) Y
        WHERE  Y.RN = 1;
        SET @PAIRS = @@ROWCOUNT;

        UPDATE B SET LINKS_TEXT = LEFT(CASE B.KIND
                   WHEN 'CONSIGNEE' THEN (SELECT MAX(LTRIM(RTRIM(C.CON_NAME))) FROM dbo.CONSIGNEE_MASTER C WHERE C.CON_CODE = B.LINKS_CODE)
                   WHEN 'SLINE'     THEN (SELECT MAX(LTRIM(RTRIM(A.AGT_NAME))) FROM dbo.AGENT_MASTER A WHERE A.AGT_CODE = B.LINKS_CODE)
                   WHEN 'VESSEL'    THEN (SELECT MAX(LTRIM(RTRIM(V.VSL_NAME))) FROM dbo.VSL_MASTER V WHERE V.VSL_RTNO = B.LINKS_CODE)
                   WHEN 'COUNTRY'   THEN (SELECT MAX(LTRIM(RTRIM(T.CITY_NAME)) + N', ' + LTRIM(RTRIM(ISNULL(T.CITY_COUNTRY, '')))) FROM dbo.CITY_MASTER T WHERE T.CITY_CODE = B.LINKS_CODE)
                   ELSE (SELECT MAX(LTRIM(RTRIM(T.CITY_NAME))) FROM dbo.CITY_MASTER T WHERE T.CITY_CODE = B.LINKS_CODE) END, 200)
        FROM   #AS_B B;

        SET @TC = @@TRANCOUNT;
        BEGIN TRY
        IF @TC = 0 BEGIN BEGIN TRANSACTION; END ELSE BEGIN SAVE TRANSACTION EXPT_SHEET_SEED; END
            UPDATE A
            SET    LINKS_CODE = B.LINKS_CODE, LINKS_TEXT = LEFT(B.LINKS_TEXT, 200), MODIFY_ID = @USER_ID, MODIFY_DT = @NOW
            FROM   dbo.TBL_EXPT_SHEET_ALIAS A WITH (UPDLOCK, HOLDLOCK) JOIN #AS_B B ON B.KIND = A.KIND AND B.SHEET_VALUE = A.SHEET_VALUE
            WHERE  A.SOURCE = 'auto' AND A.CONFIRMED = 0 AND ISNULL(A.LINKS_CODE, '') <> B.LINKS_CODE;
            SET @UPD = @@ROWCOUNT;
            INSERT INTO dbo.TBL_EXPT_SHEET_ALIAS (KIND, SHEET_VALUE, LINKS_CODE, LINKS_TEXT, SOURCE, CONFIRMED, MODIFY_ID, MODIFY_DT)
            SELECT B.KIND, B.SHEET_VALUE, B.LINKS_CODE, LEFT(B.LINKS_TEXT, 200), 'auto', 0, @USER_ID, @NOW
            FROM   #AS_B B
            WHERE  NOT EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_ALIAS A WHERE A.KIND = B.KIND AND A.SHEET_VALUE = B.SHEET_VALUE);
            SET @INS = @@ROWCOUNT;
            IF @INS + @UPD > 0
                INSERT INTO dbo.TBL_EXPT_SHEET_LOG (ROW_KIND, ROW_ID, COL_KEY, OLD_VALUE, NEW_VALUE, ACTION, USER_ID, USER_NAME, LOG_DT)
                VALUES ('M', 0, 'ALIAS.SEED', NULL, CONVERT(NVARCHAR(10), @INS) + N' added, ' + CONVERT(NVARCHAR(10), @UPD) + N' updated ('
                        + @CMPCODE + N' / ' + @CITYCODE + N')', 'edit', @USER_ID, @USER_NAME, @NOW);
        IF @TC = 0 COMMIT TRANSACTION;
            SET @STATUSTEXT = CONVERT(NVARCHAR(10), @INS) + N' alias(es) added, ' + CONVERT(NVARCHAR(10), @UPD) + N' updated from '
                              + CONVERT(NVARCHAR(10), @PAIRS) + N' sheet value(s) of linked rows.';
        END TRY
        BEGIN CATCH
            DECLARE @ERR NVARCHAR(2048);
            SET @ERR = ERROR_MESSAGE();
            IF XACT_STATE() = -1 OR (XACT_STATE() = 1 AND @TC = 0)
            BEGIN
                ROLLBACK TRANSACTION;
            END
            ELSE IF XACT_STATE() = 1
            BEGIN
                ROLLBACK TRANSACTION EXPT_SHEET_SEED;
            END
            SELECT @INS = 0, @UPD = 0;
            SELECT @STATUS = '101', @STATUSTEXT = N'Not seeded: ' + @ERR;
            IF @TC > 0 AND @@TRANCOUNT = 0
                RAISERROR(N'%s (the caller''s transaction could not be kept and was rolled back)', 16, 1, @ERR);
        END CATCH
    END
    -- self-test hook: only TEST_EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql creates #EXPT_SHEET_SELFTEST
    IF OBJECT_ID('tempdb..#EXPT_SHEET_SELFTEST') IS NOT NULL
        INSERT INTO #EXPT_SHEET_SELFTEST (PROC_NAME, STATUS, STATUSTEXT, N1, N2, N3)
        VALUES ('ALIAS_SEED', @STATUS, @STATUSTEXT, @INS, @UPD, @PAIRS);
    SELECT @STATUS AS STATUS, @STATUSTEXT AS STATUSTEXT, @INS AS INSERTED, @UPD AS UPDATED, @PAIRS AS PAIRS;
END
GO

/* ---- dbo.USP_EXPT_SHEET_VIEWS ------------------------------------------------------------------ */
IF OBJECT_ID('dbo.USP_EXPT_SHEET_VIEWS', 'P') IS NOT NULL
    DROP PROCEDURE dbo.USP_EXPT_SHEET_VIEWS;      -- step 1 made sure it is this script's own
GO
CREATE PROCEDURE dbo.USP_EXPT_SHEET_VIEWS
    @USER_ID  VARCHAR(50),
    @TAB_CODE VARCHAR(20)
AS
BEGIN
    -- Deployed by links-22/_DB_FIX/EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql (Export > Sheet view). Do not edit here: change that script.
    -- VIEWS(USER_ID, TAB_CODE). Table: the user's layouts and filter views for the tab ('' = all tabs):
    -- ID, USER_ID, MONTH_ID, TAB_CODE, NAME, KIND, DATA, MODIFY_DT.
    SET NOCOUNT ON;
    SELECT ID, USER_ID, MONTH_ID, TAB_CODE, NAME, KIND, DATA, MODIFY_DT
    FROM   dbo.TBL_EXPT_SHEET_VIEW
    WHERE  USER_ID = LTRIM(RTRIM(ISNULL(@USER_ID, ''))) AND (ISNULL(@TAB_CODE, '') = '' OR TAB_CODE = LTRIM(RTRIM(@TAB_CODE)))
    ORDER BY TAB_CODE, KIND, NAME;
END
GO

/* ---- dbo.USP_EXPT_SHEET_VIEW_IU ---------------------------------------------------------------- */
IF OBJECT_ID('dbo.USP_EXPT_SHEET_VIEW_IU', 'P') IS NOT NULL
    DROP PROCEDURE dbo.USP_EXPT_SHEET_VIEW_IU;      -- step 1 made sure it is this script's own
GO
CREATE PROCEDURE dbo.USP_EXPT_SHEET_VIEW_IU
    @ID        INT,
    @MONTH_ID  INT,
    @TAB_CODE  VARCHAR(20),
    @NAME      NVARCHAR(60),
    @KIND      VARCHAR(10),
    @DATA      NVARCHAR(MAX),
    @USER_ID   VARCHAR(50),
    @USER_NAME NVARCHAR(100)
AS
BEGIN
    -- Deployed by links-22/_DB_FIX/EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql (Export > Sheet view). Do not edit here: change that script.
    -- VIEW_IU(ID, MONTH_ID, TAB_CODE, NAME, KIND, DATA, USER_ID, USER_NAME). ID = 0 adds a view, or replaces the caller's view
    -- with the same tab, month, kind and name; ID > 0 changes one of the caller's own views (104 for another user's, 103 unknown).
    -- KIND 'layout' (widths / hidden / frozen) or 'filter'. Table: STATUS, STATUSTEXT + the view.
    SET NOCOUNT ON;
    DECLARE @STATUS VARCHAR(3), @STATUSTEXT NVARCHAR(1000), @OWNER VARCHAR(50), @SAVED_ID INT;
    SELECT @STATUS = '100', @STATUSTEXT = N'';
    SELECT @ID = ISNULL(@ID, 0), @MONTH_ID = NULLIF(@MONTH_ID, 0), @TAB_CODE = UPPER(LTRIM(RTRIM(ISNULL(@TAB_CODE, '')))), @NAME = LTRIM(RTRIM(ISNULL(@NAME, N''))),
           @KIND = LOWER(LTRIM(RTRIM(ISNULL(@KIND, '')))), @USER_ID = LTRIM(RTRIM(ISNULL(@USER_ID, '')));
    IF @USER_ID = ''
        SELECT @STATUS = '101', @STATUSTEXT = N'USER_ID is required.';
    ELSE IF @TAB_CODE = '' OR @NAME = N''
        SELECT @STATUS = '101', @STATUSTEXT = N'TAB_CODE and NAME are required.';
    ELSE IF @KIND NOT IN ('layout', 'filter')
        SELECT @STATUS = '101', @STATUSTEXT = N'KIND must be layout or filter.';
    ELSE IF @ID > 0
    BEGIN
        SELECT @OWNER = USER_ID FROM dbo.TBL_EXPT_SHEET_VIEW WHERE ID = @ID;
        IF @OWNER IS NULL SELECT @STATUS = '103', @STATUSTEXT = N'View not found.';
        ELSE IF @OWNER <> @USER_ID SELECT @STATUS = '104', @STATUSTEXT = N'This view belongs to another user.';
    END

    IF @STATUS = '100'
    BEGIN
        IF @ID = 0
            SELECT @ID = MIN(ID) FROM dbo.TBL_EXPT_SHEET_VIEW
            WHERE  USER_ID = @USER_ID AND TAB_CODE = @TAB_CODE AND ISNULL(MONTH_ID, 0) = ISNULL(@MONTH_ID, 0) AND KIND = @KIND AND NAME = @NAME;
        IF ISNULL(@ID, 0) > 0
        BEGIN
            UPDATE dbo.TBL_EXPT_SHEET_VIEW
            SET    MONTH_ID = @MONTH_ID, TAB_CODE = @TAB_CODE, NAME = @NAME, KIND = @KIND, DATA = @DATA, MODIFY_DT = GETDATE()
            WHERE  ID = @ID AND USER_ID = @USER_ID;
            SET @SAVED_ID = @ID;
        END
        ELSE
        BEGIN
            INSERT INTO dbo.TBL_EXPT_SHEET_VIEW (USER_ID, MONTH_ID, TAB_CODE, NAME, KIND, DATA, MODIFY_DT)
            VALUES (@USER_ID, @MONTH_ID, @TAB_CODE, @NAME, @KIND, @DATA, GETDATE());
            SET @SAVED_ID = SCOPE_IDENTITY();
        END
        SET @STATUSTEXT = N'View saved.';
    END
    -- self-test hook: only TEST_EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql creates #EXPT_SHEET_SELFTEST
    IF OBJECT_ID('tempdb..#EXPT_SHEET_SELFTEST') IS NOT NULL
        INSERT INTO #EXPT_SHEET_SELFTEST (PROC_NAME, STATUS, STATUSTEXT, N1, N2, N3)
        VALUES ('VIEW_IU', @STATUS, @STATUSTEXT, @SAVED_ID, NULL, NULL);
    SELECT @STATUS AS STATUS, @STATUSTEXT AS STATUSTEXT, V.ID, V.USER_ID, V.MONTH_ID, V.TAB_CODE, V.NAME, V.KIND, V.DATA, V.MODIFY_DT
    FROM   (SELECT 1 AS ONE) O LEFT JOIN dbo.TBL_EXPT_SHEET_VIEW V ON V.ID = @SAVED_ID;
END
GO

/* ---- dbo.USP_EXPT_SHEET_VIEW_DEL --------------------------------------------------------------- */
IF OBJECT_ID('dbo.USP_EXPT_SHEET_VIEW_DEL', 'P') IS NOT NULL
    DROP PROCEDURE dbo.USP_EXPT_SHEET_VIEW_DEL;      -- step 1 made sure it is this script's own
GO
CREATE PROCEDURE dbo.USP_EXPT_SHEET_VIEW_DEL
    @ID        INT,
    @USER_ID   VARCHAR(50),
    @USER_NAME NVARCHAR(100)
AS
BEGIN
    -- Deployed by links-22/_DB_FIX/EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql (Export > Sheet view). Do not edit here: change that script.
    -- VIEW_DEL(ID, USER_ID, USER_NAME). Deletes one of the caller's own views (104 another user's, 103 unknown). Table: STATUS, STATUSTEXT.
    SET NOCOUNT ON;
    DECLARE @STATUS VARCHAR(3), @STATUSTEXT NVARCHAR(1000), @OWNER VARCHAR(50);
    SELECT @STATUS = '100', @STATUSTEXT = N'View deleted.', @USER_ID = LTRIM(RTRIM(ISNULL(@USER_ID, '')));
    SELECT @OWNER = USER_ID FROM dbo.TBL_EXPT_SHEET_VIEW WHERE ID = @ID;
    IF @USER_ID = ''
        SELECT @STATUS = '101', @STATUSTEXT = N'USER_ID is required.';
    ELSE IF @OWNER IS NULL
        SELECT @STATUS = '103', @STATUSTEXT = N'View not found.';
    ELSE IF @OWNER <> @USER_ID
        SELECT @STATUS = '104', @STATUSTEXT = N'This view belongs to another user.';
    ELSE
        DELETE FROM dbo.TBL_EXPT_SHEET_VIEW WHERE ID = @ID AND USER_ID = @USER_ID;
    -- self-test hook: only TEST_EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql creates #EXPT_SHEET_SELFTEST
    IF OBJECT_ID('tempdb..#EXPT_SHEET_SELFTEST') IS NOT NULL
        INSERT INTO #EXPT_SHEET_SELFTEST (PROC_NAME, STATUS, STATUSTEXT, N1, N2, N3)
        VALUES ('VIEW_DEL', @STATUS, @STATUSTEXT, NULL, NULL, NULL);
    SELECT @STATUS AS STATUS, @STATUSTEXT AS STATUSTEXT;
END
GO

/* ---- dbo.USP_EXPT_SHEET_GRID_LOAD -------------------------------------------------------------- */
IF OBJECT_ID('dbo.USP_EXPT_SHEET_GRID_LOAD', 'P') IS NOT NULL
    DROP PROCEDURE dbo.USP_EXPT_SHEET_GRID_LOAD;      -- step 1 made sure it is this script's own
GO
CREATE PROCEDURE dbo.USP_EXPT_SHEET_GRID_LOAD
    @MONTH_ID INT,
    @TAB_CODE VARCHAR(20)
AS
BEGIN
    -- Deployed by links-22/_DB_FIX/EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql (Export > Sheet view). Do not edit here: change that script.
    -- GRID_LOAD(MONTH_ID, TAB_CODE) for BOOKINGS / VEHWEIGHTS / DGD / PRICE. Table: the rows (not deleted) - ID, MONTH_ID,
    -- TAB_CODE, SORT_ORDER, DATA (JSON {"A":"..",...}, merged by the API), CELL_FMT, ROWVER, ISDELETED, MAKER_*, MODIFY_*;
    -- Table1: the tab's TABMETA (MONTH_ID, TAB_CODE, META, ROWVER, MODIFY_ID, MODIFY_DT; no row = none yet); Table2: AS_OF.
    -- Unknown month: Table = STATUS 103 only.
    SET NOCOUNT ON;
    DECLARE @STATUS VARCHAR(3), @STATUSTEXT NVARCHAR(1000), @AS_OF DATETIME;
    SELECT @STATUS = '100', @STATUSTEXT = N'', @AS_OF = GETDATE(), @TAB_CODE = UPPER(LTRIM(RTRIM(ISNULL(@TAB_CODE, ''))));
    IF NOT EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_MONTH WHERE ID = @MONTH_ID)
    BEGIN
        SELECT @STATUS = '103', @STATUSTEXT = N'Month not found.';
        SELECT @STATUS AS STATUS, @STATUSTEXT AS STATUSTEXT;
        RETURN;
    END
    SELECT ID, MONTH_ID, TAB_CODE, SORT_ORDER, DATA, CELL_FMT, ROWVER, ISDELETED, MAKER_ID, MAKER_DT, MODIFY_ID, MODIFY_DT
    FROM   dbo.TBL_EXPT_SHEET_GRIDROW
    WHERE  MONTH_ID = @MONTH_ID AND TAB_CODE = @TAB_CODE AND ISDELETED = 0
    ORDER BY SORT_ORDER, ID;
    SELECT MONTH_ID, TAB_CODE, META, ROWVER, MODIFY_ID, MODIFY_DT FROM dbo.TBL_EXPT_SHEET_TABMETA WHERE MONTH_ID = @MONTH_ID AND TAB_CODE = @TAB_CODE;
    SELECT @AS_OF AS AS_OF;
END
GO

/* ---- dbo.USP_EXPT_SHEET_GRID_SAVE -------------------------------------------------------------- */
IF OBJECT_ID('dbo.USP_EXPT_SHEET_GRID_SAVE', 'P') IS NOT NULL
    DROP PROCEDURE dbo.USP_EXPT_SHEET_GRID_SAVE;      -- step 1 made sure it is this script's own
GO
CREATE PROCEDURE dbo.USP_EXPT_SHEET_GRID_SAVE
    @MONTH_ID  INT,
    @TAB_CODE  VARCHAR(20),
    @ROW_ID    INT,
    @ROWVER    INT,
    @DATA      NVARCHAR(MAX),
    @USER_ID   VARCHAR(50),
    @USER_NAME NVARCHAR(100)
AS
BEGIN
    -- Deployed by links-22/_DB_FIX/EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql (Export > Sheet view). Do not edit here: change that script.
    -- GRID_SAVE(MONTH_ID, TAB_CODE, ROW_ID, ROWVER, DATA, USER_ID, USER_NAME): one grid row per call, DATA = the whole merged
    -- JSON. Version check on ROWVER (102), row must be in the month + tab and not deleted (103). Unchanged DATA = no version bump.
    -- Logged as ROW_KIND 'G', COL_KEY DATA, old -> new JSON (first 2000 characters).
    -- Table: STATUS, STATUSTEXT; Table1: the row (GRID_LOAD shape) - after the save, or as it is now on a conflict.
    SET NOCOUNT ON;
    IF @@TRANCOUNT = 0 SET XACT_ABORT ON ELSE SET XACT_ABORT OFF;
    DECLARE @STATUS VARCHAR(3), @STATUSTEXT NVARCHAR(1000), @NOW DATETIME, @TC INT, @CUR_VER INT, @OLD NVARCHAR(MAX), @FOUND BIT;
    SELECT @STATUS = '100', @STATUSTEXT = N'', @NOW = GETDATE(), @FOUND = 0;
    SELECT @TAB_CODE = UPPER(LTRIM(RTRIM(ISNULL(@TAB_CODE, '')))), @USER_ID = LTRIM(RTRIM(ISNULL(@USER_ID, ''))), @DATA = NULLIF(LTRIM(RTRIM(@DATA)), N'');
    IF @USER_ID = ''
        SELECT @STATUS = '101', @STATUSTEXT = N'USER_ID is required.';
    ELSE
    BEGIN
        SET @TC = @@TRANCOUNT;
        BEGIN TRY
        IF @TC = 0 BEGIN BEGIN TRANSACTION; END ELSE BEGIN SAVE TRANSACTION EXPT_SHEET_GRID; END
            SELECT @CUR_VER = ROWVER, @OLD = DATA, @FOUND = 1
            FROM   dbo.TBL_EXPT_SHEET_GRIDROW WITH (UPDLOCK, HOLDLOCK)
            WHERE  ID = @ROW_ID AND MONTH_ID = @MONTH_ID AND TAB_CODE = @TAB_CODE AND ISDELETED = 0;
            IF @FOUND = 0
                SELECT @STATUS = '103', @STATUSTEXT = N'Row not found in this tab (or deleted).';
            ELSE IF ISNULL(@ROWVER, -1) <> @CUR_VER
                SELECT @STATUS = '102', @STATUSTEXT = N'The row was changed by someone else meanwhile.';
            ELSE IF ISNULL(@OLD, N'') COLLATE Latin1_General_BIN2 = ISNULL(@DATA, N'') COLLATE Latin1_General_BIN2
                SET @STATUSTEXT = N'No change.';
            ELSE
            BEGIN
                UPDATE dbo.TBL_EXPT_SHEET_GRIDROW SET DATA = @DATA, ROWVER = ROWVER + 1, MODIFY_ID = @USER_ID, MODIFY_DT = @NOW WHERE ID = @ROW_ID;
                INSERT INTO dbo.TBL_EXPT_SHEET_LOG (ROW_KIND, ROW_ID, COL_KEY, OLD_VALUE, NEW_VALUE, ACTION, USER_ID, USER_NAME, LOG_DT)
                VALUES ('G', @ROW_ID, 'DATA', LEFT(@OLD, 2000), LEFT(@DATA, 2000), 'edit', @USER_ID, @USER_NAME, @NOW);
                SET @STATUSTEXT = N'Row saved.';
            END
        IF @TC = 0 COMMIT TRANSACTION;
        END TRY
        BEGIN CATCH
            DECLARE @ERR NVARCHAR(2048);
            SET @ERR = ERROR_MESSAGE();
            IF XACT_STATE() = -1 OR (XACT_STATE() = 1 AND @TC = 0)
            BEGIN
                ROLLBACK TRANSACTION;
            END
            ELSE IF XACT_STATE() = 1
            BEGIN
                ROLLBACK TRANSACTION EXPT_SHEET_GRID;
            END
            SELECT @STATUS = '101', @STATUSTEXT = N'Not saved: ' + @ERR;
            IF @TC > 0 AND @@TRANCOUNT = 0
                RAISERROR(N'%s (the caller''s transaction could not be kept and was rolled back)', 16, 1, @ERR);
        END CATCH
    END
    -- self-test hook: only TEST_EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql creates #EXPT_SHEET_SELFTEST
    IF OBJECT_ID('tempdb..#EXPT_SHEET_SELFTEST') IS NOT NULL
        INSERT INTO #EXPT_SHEET_SELFTEST (PROC_NAME, STATUS, STATUSTEXT, N1, N2, N3)
        VALUES ('GRID_SAVE', @STATUS, @STATUSTEXT, NULL, NULL, NULL);
    SELECT @STATUS AS STATUS, @STATUSTEXT AS STATUSTEXT;
    SELECT ID, MONTH_ID, TAB_CODE, SORT_ORDER, DATA, CELL_FMT, ROWVER, ISDELETED, MAKER_ID, MAKER_DT, MODIFY_ID, MODIFY_DT
    FROM   dbo.TBL_EXPT_SHEET_GRIDROW WHERE ID = @ROW_ID AND MONTH_ID = @MONTH_ID AND TAB_CODE = @TAB_CODE;
END
GO

/* ---- dbo.USP_EXPT_SHEET_GRID_SAVE_FMT ---------------------------------------------------------- */
IF OBJECT_ID('dbo.USP_EXPT_SHEET_GRID_SAVE_FMT', 'P') IS NOT NULL
    DROP PROCEDURE dbo.USP_EXPT_SHEET_GRID_SAVE_FMT;      -- step 1 made sure it is this script's own
GO
CREATE PROCEDURE dbo.USP_EXPT_SHEET_GRID_SAVE_FMT
    @EDITS     NVARCHAR(MAX),
    @USER_ID   VARCHAR(50),
    @USER_NAME NVARCHAR(100)
AS
BEGIN
    -- Deployed by links-22/_DB_FIX/EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql (Export > Sheet view). Do not edit here: change that script.
    -- GRID_SAVE_FMT(EDITS, USER_ID, USER_NAME): SAVE_FMT for the grid tabs (TBL_EXPT_SHEET_GRIDROW). EDITS = rootless
    -- <f r="ID" k="A" bg=".." fg=".." b="0/1"/>, k = a column letter A..ZZZ; an absent attribute keeps the stored one, bg="" /
    -- fg="" clear it. No row status and no *ROW on grid rows. Same canonical CELL_FMT form and rules as SAVE_FMT; ROWVER is not
    -- bumped (GRID_SAVE's version check is for DATA), MODIFY_DT is, so GRID_CHANGES carries the row. Logged as ROW_KIND 'G',
    -- ACTION 'fmt'. Refused edits: 'invalid', 'notfound'.
    -- Results: Table STATUS (100, else 103 > 101), STATUSTEXT, CELLS, REJECTED; Table1 refused (ID, KEY, REASON); Table2 the rows
    -- touched (GRID_LOAD shape).
    SET NOCOUNT ON;
    SET ARITHABORT ON;
    DECLARE @STATUS VARCHAR(3), @STATUSTEXT NVARCHAR(1000), @NOW DATETIME, @X XML, @TC INT, @CELLS INT, @STATS INT, @REJECTED INT, @PARSED BIT;
    SELECT @STATUS = '100', @STATUSTEXT = N'', @NOW = GETDATE(), @CELLS = 0, @STATS = 0, @REJECTED = 0, @PARSED = 0;
    SET @USER_ID = LTRIM(RTRIM(ISNULL(@USER_ID, '')));

    CREATE TABLE #SF_E (SEQ INT IDENTITY(1,1) NOT NULL PRIMARY KEY, R_TXT VARCHAR(50) NULL, ROW_ID INT NULL, K VARCHAR(100) NOT NULL,
                        BG VARCHAR(20) NULL, FG VARCHAR(20) NULL, B VARCHAR(5) NULL, S VARCHAR(50) NULL, REASON VARCHAR(20) NULL);
    CREATE TABLE #SF_R (ROW_ID INT NOT NULL PRIMARY KEY, OLD_FMT NVARCHAR(MAX) NULL, NEW_FMT NVARCHAR(MAX) NULL, OLD_STATUS VARCHAR(20) NULL,
                        NEW_STATUS VARCHAR(20) NULL, SET_STATUS BIT NOT NULL DEFAULT 0, FMT_OK BIT NOT NULL DEFAULT 1, TOUCHED BIT NOT NULL DEFAULT 0,
                        XML_TXT NVARCHAR(MAX) NULL);
    CREATE TABLE #SF_C (ROW_ID INT NOT NULL, K VARCHAR(40) NOT NULL, BG VARCHAR(7) NULL, FG VARCHAR(7) NULL, B BIT NOT NULL DEFAULT 0,
                        OLD_FRAG NVARCHAR(200) NULL, CUR_FRAG NVARCHAR(200) NULL, TOUCHED BIT NOT NULL DEFAULT 0, PRIMARY KEY (ROW_ID, K));
    CREATE TABLE #SF_A (ROW_ID INT NOT NULL, K VARCHAR(40) NOT NULL, BG_SEQ INT NULL, FG_SEQ INT NULL, B_SEQ INT NULL, PRIMARY KEY (ROW_ID, K));

    IF @USER_ID = ''
        SELECT @STATUS = '101', @STATUSTEXT = N'USER_ID is required.';
    ELSE
    BEGIN
        SET XACT_ABORT OFF;
        BEGIN TRY
            SET @X = CONVERT(XML, @EDITS, 1);
            INSERT INTO #SF_E (R_TXT, K, BG, FG, B, S)
            SELECT LTRIM(RTRIM(T.c.value('@r', 'VARCHAR(50)'))), UPPER(LTRIM(RTRIM(ISNULL(T.c.value('@k', 'VARCHAR(100)'), '')))),
                   LTRIM(RTRIM(T.c.value('@bg', 'VARCHAR(20)'))), LTRIM(RTRIM(T.c.value('@fg', 'VARCHAR(20)'))),
                   LTRIM(RTRIM(T.c.value('@b', 'VARCHAR(5)'))), UPPER(LTRIM(RTRIM(T.c.value('@s', 'VARCHAR(50)'))))
            FROM   @X.nodes('/f') T(c);
            SET @PARSED = 1;
        END TRY
        BEGIN CATCH
            SELECT @STATUS = '101', @STATUSTEXT = N'The edits are not valid XML: ' + ERROR_MESSAGE();
            IF XACT_STATE() = -1
            BEGIN
                ROLLBACK TRANSACTION;
                RAISERROR(N'The edits are not valid XML (the caller''s transaction was rolled back).', 16, 1);
            END
        END CATCH
        IF @@TRANCOUNT = 0 SET XACT_ABORT ON ELSE SET XACT_ABORT OFF;
        IF @STATUS = '100' AND NOT EXISTS (SELECT 1 FROM #SF_E)
            SELECT @STATUS = '101', @STATUSTEXT = N'No edits (expected <f r="ID" k="A" bg=".." fg=".." b="0/1"/>).';
    END

    IF @STATUS = '100'
    BEGIN
        UPDATE #SF_E SET REASON = 'invalid' WHERE ISNULL(R_TXT, '') = '' OR R_TXT LIKE '%[^0-9]%' OR LEN(R_TXT) > 9;
        UPDATE #SF_E SET ROW_ID = CASE WHEN REASON IS NULL THEN CONVERT(INT, R_TXT) END;
        UPDATE E SET REASON = 'invalid' FROM #SF_E E
        WHERE  E.REASON IS NULL
          AND (   NOT (E.K LIKE '[A-Z]' OR E.K LIKE '[A-Z][A-Z]' OR E.K LIKE '[A-Z][A-Z][A-Z]')
               OR E.S IS NOT NULL OR (E.BG IS NULL AND E.FG IS NULL AND E.B IS NULL)
               OR (E.BG <> '' AND NOT (LEN(E.BG) = 7 AND E.BG LIKE '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]')) OR (E.FG <> '' AND NOT (LEN(E.FG) = 7 AND E.FG LIKE '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]')) OR (E.B IS NOT NULL AND E.B NOT IN ('0', '1')));
        UPDATE E SET REASON = 'notfound' FROM #SF_E E
        WHERE  E.REASON IS NULL AND NOT EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_GRIDROW R WHERE R.ID = E.ROW_ID AND R.ISDELETED = 0);

        SET @TC = @@TRANCOUNT;
        BEGIN TRY
        IF @TC = 0 BEGIN BEGIN TRANSACTION; END ELSE BEGIN SAVE TRANSACTION EXPT_SHEET_GFMT; END
            INSERT INTO #SF_R (ROW_ID, OLD_FMT, OLD_STATUS)
            SELECT R.ID, R.CELL_FMT, NULL
            FROM   dbo.TBL_EXPT_SHEET_GRIDROW R WITH (UPDLOCK, HOLDLOCK)
            WHERE  R.ID IN (SELECT ROW_ID FROM #SF_E WHERE REASON IS NULL);

            -- the stored formats must be in the canonical form this procedure writes: only those characters, and once
            -- rewritten as <c k=".." bg=".." fg=".." b="1"/> elements no brace or colon may be left and the quotes must pair
            UPDATE #SF_R SET XML_TXT = REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(REPLACE(OLD_FMT,
                       N'},"', N'/><c k="'), N'":{', N'" '), N'"bg":"', N'bg="'), N'"fg":"', N'fg="'),
                       N'"b":1', N'b="1"'), N'"b":0', N'b="0"'), N',', N' '), N'{"', N'<c k="'), N'}}', N'/>')
            WHERE  OLD_FMT LIKE N'{"%}}' AND PATINDEX(N'%[^A-Za-z0-9_#":,{}*]%', OLD_FMT COLLATE Latin1_General_BIN2) = 0;
            UPDATE #SF_R SET FMT_OK = 0
            WHERE  ISNULL(LTRIM(RTRIM(OLD_FMT)), N'') NOT IN (N'', N'{}')
              AND  (XML_TXT IS NULL OR NOT (    XML_TXT LIKE N'<c k="%/>'
                        AND CHARINDEX(N'{', XML_TXT) = 0 AND CHARINDEX(N'}', XML_TXT) = 0 AND CHARINDEX(N':', XML_TXT) = 0
                        AND (LEN(XML_TXT) - LEN(REPLACE(XML_TXT, N'"', N''))) % 2 = 0));
            -- an edit that changes a format cannot be applied to a stored format that cannot be read
            UPDATE E SET REASON = 'invalid' FROM #SF_E E JOIN #SF_R F ON F.ROW_ID = E.ROW_ID
            WHERE  E.REASON IS NULL AND F.FMT_OK = 0 AND (E.BG IS NOT NULL OR E.FG IS NOT NULL OR E.B IS NOT NULL);

            INSERT INTO #SF_C (ROW_ID, K, BG, FG, B)
            SELECT P.ROW_ID, N.c.value('@k', 'VARCHAR(40)'), NULLIF(N.c.value('@bg', 'VARCHAR(7)'), ''), NULLIF(N.c.value('@fg', 'VARCHAR(7)'), ''),
                   CASE WHEN N.c.value('@b', 'VARCHAR(1)') = '1' THEN 1 ELSE 0 END
            FROM  (SELECT ROW_ID, CASE WHEN FMT_OK = 1 AND XML_TXT IS NOT NULL THEN CONVERT(XML, XML_TXT) END AS X
                   FROM   #SF_R WHERE FMT_OK = 1 AND XML_TXT IS NOT NULL) P
                   CROSS APPLY P.X.nodes('/c') N(c);
            UPDATE C SET OLD_FRAG = CASE WHEN C.BG IS NULL AND C.FG IS NULL AND C.B = 0 THEN NULL
                     ELSE N'{' + STUFF(ISNULL(N',"bg":"' + C.BG + N'"', N'') + ISNULL(N',"fg":"' + C.FG + N'"', N'')
                                       + CASE WHEN C.B = 1 THEN N',"b":1' ELSE N'' END, 1, 1, N'') + N'}' END FROM #SF_C C;

            -- per cell, each property from the last edit that sent it
            INSERT INTO #SF_A (ROW_ID, K, BG_SEQ, FG_SEQ, B_SEQ)
            SELECT ROW_ID, K, MAX(CASE WHEN BG IS NOT NULL THEN SEQ END), MAX(CASE WHEN FG IS NOT NULL THEN SEQ END), MAX(CASE WHEN B IS NOT NULL THEN SEQ END)
            FROM   #SF_E WHERE REASON IS NULL AND (BG IS NOT NULL OR FG IS NOT NULL OR B IS NOT NULL) GROUP BY ROW_ID, K;

            UPDATE C
            SET    BG = CASE WHEN A.BG_SEQ IS NULL THEN C.BG ELSE NULLIF(LOWER(EB.BG), '') END,
                   FG = CASE WHEN A.FG_SEQ IS NULL THEN C.FG ELSE NULLIF(LOWER(EF.FG), '') END,
                   B  = CASE WHEN A.B_SEQ IS NULL THEN C.B WHEN EX.B = '1' THEN 1 ELSE 0 END,
                   TOUCHED = 1
            FROM   #SF_C C JOIN #SF_A A ON A.ROW_ID = C.ROW_ID AND A.K = C.K
                   LEFT JOIN #SF_E EB ON EB.SEQ = A.BG_SEQ LEFT JOIN #SF_E EF ON EF.SEQ = A.FG_SEQ LEFT JOIN #SF_E EX ON EX.SEQ = A.B_SEQ;
            INSERT INTO #SF_C (ROW_ID, K, BG, FG, B, TOUCHED)
            SELECT A.ROW_ID, A.K, NULLIF(LOWER(EB.BG), ''), NULLIF(LOWER(EF.FG), ''), CASE WHEN EX.B = '1' THEN 1 ELSE 0 END, 1
            FROM   #SF_A A LEFT JOIN #SF_E EB ON EB.SEQ = A.BG_SEQ LEFT JOIN #SF_E EF ON EF.SEQ = A.FG_SEQ LEFT JOIN #SF_E EX ON EX.SEQ = A.B_SEQ
            WHERE  NOT EXISTS (SELECT 1 FROM #SF_C C WHERE C.ROW_ID = A.ROW_ID AND C.K = A.K);
            UPDATE C SET CUR_FRAG = CASE WHEN C.BG IS NULL AND C.FG IS NULL AND C.B = 0 THEN NULL
                     ELSE N'{' + STUFF(ISNULL(N',"bg":"' + C.BG + N'"', N'') + ISNULL(N',"fg":"' + C.FG + N'"', N'')
                                       + CASE WHEN C.B = 1 THEN N',"b":1' ELSE N'' END, 1, 1, N'') + N'}' END FROM #SF_C C;
            UPDATE #SF_C SET TOUCHED = 0
            WHERE  TOUCHED = 1 AND ISNULL(OLD_FRAG, N'') COLLATE Latin1_General_BIN2 = ISNULL(CUR_FRAG, N'') COLLATE Latin1_General_BIN2;
            SELECT @CELLS = COUNT(*) FROM #SF_C WHERE TOUCHED = 1;

            -- the canonical JSON, keys in binary order (independent of collation)
            UPDATE F SET TOUCHED = 1,
                   NEW_FMT = N'{' + STUFF((SELECT N',"' + C.K + N'":' + C.CUR_FRAG FROM #SF_C C
                                            WHERE C.ROW_ID = F.ROW_ID AND C.CUR_FRAG IS NOT NULL ORDER BY C.K COLLATE Latin1_General_BIN2
                                            FOR XML PATH(''), TYPE).value('.', 'NVARCHAR(MAX)'), 1, 1, N'') + N'}'
            FROM   #SF_R F WHERE EXISTS (SELECT 1 FROM #SF_C C WHERE C.ROW_ID = F.ROW_ID AND C.TOUCHED = 1);

            SET @NOW = GETDATE();
            UPDATE R
            SET    CELL_FMT    = CASE WHEN F.TOUCHED = 1 THEN F.NEW_FMT ELSE R.CELL_FMT END,
                   MODIFY_ID   = @USER_ID,
                   MODIFY_DT   = @NOW
            FROM   dbo.TBL_EXPT_SHEET_GRIDROW R JOIN #SF_R F ON F.ROW_ID = R.ID
            WHERE  F.TOUCHED = 1 OR F.SET_STATUS = 1;

            INSERT INTO dbo.TBL_EXPT_SHEET_LOG (ROW_KIND, ROW_ID, COL_KEY, OLD_VALUE, NEW_VALUE, ACTION, USER_ID, USER_NAME, LOG_DT)
            SELECT 'G', ROW_ID, K, OLD_FRAG, CUR_FRAG, 'fmt', @USER_ID, @USER_NAME, @NOW FROM #SF_C WHERE TOUCHED = 1;
        IF @TC = 0 COMMIT TRANSACTION;
        END TRY
        BEGIN CATCH
            DECLARE @ERR NVARCHAR(2048);
            SET @ERR = ERROR_MESSAGE();
            IF XACT_STATE() = -1 OR (XACT_STATE() = 1 AND @TC = 0)
            BEGIN
                ROLLBACK TRANSACTION;
            END
            ELSE IF XACT_STATE() = 1
            BEGIN
                ROLLBACK TRANSACTION EXPT_SHEET_GFMT;
            END
            SELECT @CELLS = 0, @STATS = 0;
            SELECT @STATUS = '101', @STATUSTEXT = N'Formats not saved: ' + @ERR;
            IF @TC > 0 AND @@TRANCOUNT = 0
                RAISERROR(N'%s (the caller''s transaction could not be kept and was rolled back)', 16, 1, @ERR);
        END CATCH
    END

    IF @PARSED = 1
    BEGIN
        SELECT @REJECTED = COUNT(*) FROM #SF_E WHERE REASON IS NOT NULL;
        IF @STATUS = '100'
            SELECT @STATUS = CASE WHEN EXISTS (SELECT 1 FROM #SF_E WHERE REASON = 'notfound') THEN '103' WHEN @REJECTED > 0 THEN '101' ELSE '100' END,
                   @STATUSTEXT = CONVERT(NVARCHAR(10), @CELLS) + N' cell format(s) saved'
                                 + CASE WHEN @REJECTED > 0 THEN N'; ' + CONVERT(NVARCHAR(10), @REJECTED) + N' edit(s) refused' ELSE N'' END + N'.';
    END
    -- self-test hook: only TEST_EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql creates #EXPT_SHEET_SELFTEST
    IF OBJECT_ID('tempdb..#EXPT_SHEET_SELFTEST') IS NOT NULL
        INSERT INTO #EXPT_SHEET_SELFTEST (PROC_NAME, STATUS, STATUSTEXT, N1, N2, N3)
        VALUES ('GRID_SAVE_FMT', @STATUS, @STATUSTEXT, @CELLS, @STATS, @REJECTED);
    SELECT @STATUS AS STATUS, @STATUSTEXT AS STATUSTEXT, @CELLS AS CELLS, @REJECTED AS REJECTED;
    SELECT ROW_ID AS ID, K AS [KEY], REASON FROM #SF_E WHERE REASON IS NOT NULL ORDER BY SEQ;
    SELECT G.ID, G.MONTH_ID, G.TAB_CODE, G.SORT_ORDER, G.DATA, G.CELL_FMT, G.ROWVER, G.ISDELETED, G.MAKER_ID, G.MAKER_DT, G.MODIFY_ID, G.MODIFY_DT
    FROM   dbo.TBL_EXPT_SHEET_GRIDROW G
    WHERE  G.ID IN (SELECT ROW_ID FROM #SF_E WHERE ROW_ID IS NOT NULL)
    ORDER BY G.SORT_ORDER, G.ID;
END
GO

/* ---- dbo.USP_EXPT_SHEET_GRID_CHANGES ----------------------------------------------------------- */
IF OBJECT_ID('dbo.USP_EXPT_SHEET_GRID_CHANGES', 'P') IS NOT NULL
    DROP PROCEDURE dbo.USP_EXPT_SHEET_GRID_CHANGES;      -- step 1 made sure it is this script's own
GO
CREATE PROCEDURE dbo.USP_EXPT_SHEET_GRID_CHANGES
    @MONTH_ID INT,
    @TAB_CODE VARCHAR(20),
    @SINCE    DATETIME
AS
BEGIN
    -- Deployed by links-22/_DB_FIX/EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql (Export > Sheet view). Do not edit here: change that script.
    -- GRID_CHANGES(MONTH_ID, TAB_CODE, SINCE): live updates of a grid tab. Table: the grid rows changed after SINCE (GRID_LOAD shape,
    -- deleted rows included, ISDELETED = 1, so the client can drop them); Table1: the tab's TABMETA when it changed after SINCE
    -- (else no row); Table2: AS_OF (server time at the start, the SINCE of the next call). The window starts 2 seconds before
    -- SINCE, as in CHANGES, so a row can come twice: the client replaces rows by ID. Unknown month: Table = STATUS 103 only.
    SET NOCOUNT ON;
    DECLARE @STATUS VARCHAR(3), @STATUSTEXT NVARCHAR(1000), @AS_OF DATETIME, @FROM DATETIME, @N INT, @NM INT;
    SELECT @STATUS = '100', @STATUSTEXT = N'', @AS_OF = GETDATE(), @TAB_CODE = UPPER(LTRIM(RTRIM(ISNULL(@TAB_CODE, '')))),
           @FROM = DATEADD(SECOND, -2, ISNULL(@SINCE, '19000101'));
    IF NOT EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_MONTH WHERE ID = @MONTH_ID)
    BEGIN
        SELECT @STATUS = '103', @STATUSTEXT = N'Month not found.';
        SELECT @STATUS AS STATUS, @STATUSTEXT AS STATUSTEXT;
        RETURN;
    END
    SELECT ID, MONTH_ID, TAB_CODE, SORT_ORDER, DATA, CELL_FMT, ROWVER, ISDELETED, MAKER_ID, MAKER_DT, MODIFY_ID, MODIFY_DT
    FROM   dbo.TBL_EXPT_SHEET_GRIDROW
    WHERE  MONTH_ID = @MONTH_ID AND TAB_CODE = @TAB_CODE AND MODIFY_DT > @FROM
    ORDER BY SORT_ORDER, ID;
    SET @N = @@ROWCOUNT;
    SELECT MONTH_ID, TAB_CODE, META, ROWVER, MODIFY_ID, MODIFY_DT
    FROM   dbo.TBL_EXPT_SHEET_TABMETA
    WHERE  MONTH_ID = @MONTH_ID AND TAB_CODE = @TAB_CODE AND MODIFY_DT > @FROM;
    SET @NM = @@ROWCOUNT;
    SELECT @AS_OF AS AS_OF;
    -- self-test hook: only TEST_EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql creates #EXPT_SHEET_SELFTEST
    IF OBJECT_ID('tempdb..#EXPT_SHEET_SELFTEST') IS NOT NULL
        INSERT INTO #EXPT_SHEET_SELFTEST (PROC_NAME, STATUS, STATUSTEXT, N1, N2, N3)
        VALUES ('GRID_CHANGES', @STATUS, @STATUSTEXT, @N, @NM, NULL);
END
GO

/* ---- dbo.USP_EXPT_SHEET_TABMETA_IU ------------------------------------------------------------- */
IF OBJECT_ID('dbo.USP_EXPT_SHEET_TABMETA_IU', 'P') IS NOT NULL
    DROP PROCEDURE dbo.USP_EXPT_SHEET_TABMETA_IU;      -- step 1 made sure it is this script's own
GO
CREATE PROCEDURE dbo.USP_EXPT_SHEET_TABMETA_IU
    @MONTH_ID  INT,
    @TAB_CODE  VARCHAR(20),
    @META      NVARCHAR(MAX),
    @ROWVER    INT,
    @USER_ID   VARCHAR(50),
    @USER_NAME NVARCHAR(100)
AS
BEGIN
    -- Deployed by links-22/_DB_FIX/EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql (Export > Sheet view). Do not edit here: change that script.
    -- TABMETA_IU(MONTH_ID, TAB_CODE, META, ROWVER, USER_ID, USER_NAME): a tab's layout JSON (headers, widths, merges, frozen
    -- rows / columns). Not there yet: inserted (ROWVER 1, any ROWVER accepted). There: version check (102) and ROWVER + 1.
    -- Logged as 'M' / MONTH_ID / META.<TAB_CODE>. Table: STATUS, STATUSTEXT, MONTH_ID, TAB_CODE, ROWVER; Table1: the TABMETA row.
    SET NOCOUNT ON;
    IF @@TRANCOUNT = 0 SET XACT_ABORT ON ELSE SET XACT_ABORT OFF;
    DECLARE @STATUS VARCHAR(3), @STATUSTEXT NVARCHAR(1000), @NOW DATETIME, @TC INT, @CUR_VER INT, @OLD NVARCHAR(MAX), @FOUND BIT;
    SELECT @STATUS = '100', @STATUSTEXT = N'', @NOW = GETDATE(), @FOUND = 0;
    SELECT @TAB_CODE = UPPER(LTRIM(RTRIM(ISNULL(@TAB_CODE, '')))), @USER_ID = LTRIM(RTRIM(ISNULL(@USER_ID, '')));
    IF @USER_ID = ''
        SELECT @STATUS = '101', @STATUSTEXT = N'USER_ID is required.';
    ELSE IF @TAB_CODE = ''
        SELECT @STATUS = '101', @STATUSTEXT = N'TAB_CODE is required.';
    ELSE IF NOT EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_MONTH WHERE ID = @MONTH_ID)
        SELECT @STATUS = '103', @STATUSTEXT = N'Month not found.';
    ELSE
    BEGIN
        SET @TC = @@TRANCOUNT;
        BEGIN TRY
        IF @TC = 0 BEGIN BEGIN TRANSACTION; END ELSE BEGIN SAVE TRANSACTION EXPT_SHEET_META; END
            SELECT @CUR_VER = ROWVER, @OLD = META, @FOUND = 1
            FROM   dbo.TBL_EXPT_SHEET_TABMETA WITH (UPDLOCK, HOLDLOCK) WHERE MONTH_ID = @MONTH_ID AND TAB_CODE = @TAB_CODE;
            IF @FOUND = 0
            BEGIN
                INSERT INTO dbo.TBL_EXPT_SHEET_TABMETA (MONTH_ID, TAB_CODE, META, ROWVER, MODIFY_ID, MODIFY_DT)
                VALUES (@MONTH_ID, @TAB_CODE, @META, 1, @USER_ID, @NOW);
                INSERT INTO dbo.TBL_EXPT_SHEET_LOG (ROW_KIND, ROW_ID, COL_KEY, OLD_VALUE, NEW_VALUE, ACTION, USER_ID, USER_NAME, LOG_DT)
                VALUES ('M', @MONTH_ID, LEFT('META.' + @TAB_CODE, 40), NULL, LEFT(@META, 2000), 'insert', @USER_ID, @USER_NAME, @NOW);
                SET @STATUSTEXT = N'Tab layout saved.';
            END
            ELSE IF ISNULL(@ROWVER, -1) <> @CUR_VER
                SELECT @STATUS = '102', @STATUSTEXT = N'The tab layout was changed by someone else meanwhile.';
            ELSE
            BEGIN
                UPDATE dbo.TBL_EXPT_SHEET_TABMETA SET META = @META, ROWVER = ROWVER + 1, MODIFY_ID = @USER_ID, MODIFY_DT = @NOW
                WHERE  MONTH_ID = @MONTH_ID AND TAB_CODE = @TAB_CODE;
                INSERT INTO dbo.TBL_EXPT_SHEET_LOG (ROW_KIND, ROW_ID, COL_KEY, OLD_VALUE, NEW_VALUE, ACTION, USER_ID, USER_NAME, LOG_DT)
                VALUES ('M', @MONTH_ID, LEFT('META.' + @TAB_CODE, 40), LEFT(@OLD, 2000), LEFT(@META, 2000), 'edit', @USER_ID, @USER_NAME, @NOW);
                SET @STATUSTEXT = N'Tab layout saved.';
            END
        IF @TC = 0 COMMIT TRANSACTION;
        END TRY
        BEGIN CATCH
            DECLARE @ERR NVARCHAR(2048);
            SET @ERR = ERROR_MESSAGE();
            IF XACT_STATE() = -1 OR (XACT_STATE() = 1 AND @TC = 0)
            BEGIN
                ROLLBACK TRANSACTION;
            END
            ELSE IF XACT_STATE() = 1
            BEGIN
                ROLLBACK TRANSACTION EXPT_SHEET_META;
            END
            SELECT @STATUS = '101', @STATUSTEXT = N'Not saved: ' + @ERR;
            IF @TC > 0 AND @@TRANCOUNT = 0
                RAISERROR(N'%s (the caller''s transaction could not be kept and was rolled back)', 16, 1, @ERR);
        END CATCH
    END
    -- self-test hook: only TEST_EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql creates #EXPT_SHEET_SELFTEST
    IF OBJECT_ID('tempdb..#EXPT_SHEET_SELFTEST') IS NOT NULL
        INSERT INTO #EXPT_SHEET_SELFTEST (PROC_NAME, STATUS, STATUSTEXT, N1, N2, N3)
        VALUES ('TABMETA_IU', @STATUS, @STATUSTEXT, NULL, NULL, NULL);
    SELECT @STATUS AS STATUS, @STATUSTEXT AS STATUSTEXT, @MONTH_ID AS MONTH_ID, @TAB_CODE AS TAB_CODE,
           (SELECT ROWVER FROM dbo.TBL_EXPT_SHEET_TABMETA WHERE MONTH_ID = @MONTH_ID AND TAB_CODE = @TAB_CODE) AS ROWVER;
    SELECT MONTH_ID, TAB_CODE, META, ROWVER, MODIFY_ID, MODIFY_DT FROM dbo.TBL_EXPT_SHEET_TABMETA WHERE MONTH_ID = @MONTH_ID AND TAB_CODE = @TAB_CODE;
END
GO

/* ---- dbo.USP_EXPT_SHEET_KPI -------------------------------------------------------------------- */
IF OBJECT_ID('dbo.USP_EXPT_SHEET_KPI', 'P') IS NOT NULL
    DROP PROCEDURE dbo.USP_EXPT_SHEET_KPI;      -- step 1 made sure it is this script's own
GO
CREATE PROCEDURE dbo.USP_EXPT_SHEET_KPI
    @MONTH_ID INT
AS
BEGIN
    -- Deployed by links-22/_DB_FIX/EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql (Export > Sheet view). Do not edit here: change that script.
    -- KPI(MONTH_ID). The workbook's KPI Summary: "parts and frames must not be loaded on the same vessel", over the rows of
    -- the Sri Lanka parts and frames tab (TAB_CODE SLPF, as the workbook reads only that tab; other tabs carry SPARE PARTS rows).
    -- PARTS = rows whose VEH contains PART, FRAMES = rows whose VEH contains FRAME. Vessel = the Links vessel name when the row is
    -- linked and Links has one, else the sheet's VSL NAME (line breaks folded). KPI_STATUS 'VIOLATION' (both > 0), 'OK', 'NONE'.
    -- Table: VESSEL, PARTS, FRAMES, KPI_STATUS (vessels with a name, by name);
    -- Table1 (one row): VESSELS, PARTS, FRAMES, VIOLATIONS, VIOLATION_VESSELS, ROWS, LATEST_STUFFING_DT (dd-mm-yyyy, the latest real
    -- STUFFING DATE), TODAY_ROWS, TODAY_WOS, TODAY_CONTAINERS, TODAY_PARTS_WOS, TODAY_FRAMES_WOS, TODAY_PARTS_ONLY_VESSELS,
    -- TODAY_FRAMES_ONLY_VESSELS, TODAY_VIOLATIONS, TODAY_VGM, TODAY_SI, TODAY_BL, TODAY_SB;
    -- Table2: Table's columns for the rows of the latest stuffing date. TODAY_CONTAINERS = per row Cont when it is a number, else
    -- the container numbers listed in CONTAINER NO, else 1. Unknown month: Table = STATUS 103 only.
    SET NOCOUNT ON;
    SET DATEFORMAT dmy;
    DECLARE @STATUS VARCHAR(3), @STATUSTEXT NVARCHAR(1000), @LATEST DATETIME, @VIOL INT, @VESSELS INT, @ROWS INT;
    SELECT @STATUS = '100', @STATUSTEXT = N'';
    IF NOT EXISTS (SELECT 1 FROM dbo.TBL_EXPT_SHEET_MONTH WHERE ID = @MONTH_ID)
    BEGIN
        SELECT @STATUS = '103', @STATUSTEXT = N'Month not found.';
        -- self-test hook: only TEST_EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql creates #EXPT_SHEET_SELFTEST
        IF OBJECT_ID('tempdb..#EXPT_SHEET_SELFTEST') IS NOT NULL
            INSERT INTO #EXPT_SHEET_SELFTEST (PROC_NAME, STATUS, STATUSTEXT, N1, N2, N3)
            VALUES ('KPI', @STATUS, @STATUSTEXT, NULL, NULL, NULL);
        SELECT @STATUS AS STATUS, @STATUSTEXT AS STATUSTEXT;
        RETURN;
    END
    CREATE TABLE #KP (ID INT NOT NULL PRIMARY KEY, EXPTNO VARCHAR(25) NULL, WO NVARCHAR(500) NULL, VESSEL NVARCHAR(500) NULL, IS_PART INT NOT NULL,
                      IS_FRAME INT NOT NULL, STUFF_D DATETIME NULL, CONTAINERS INT NOT NULL, VGM INT NOT NULL, SI INT NOT NULL, BL INT NOT NULL, SB INT NOT NULL,
                      BL_SHEET INT NOT NULL, SB_SHEET INT NOT NULL);
    CREATE TABLE #KP_J (EXPTNO VARCHAR(25) NOT NULL PRIMARY KEY, VSL_NAME NVARCHAR(100) NULL, BLNO NVARCHAR(60) NULL, SBNO NVARCHAR(30) NULL);

    INSERT INTO #KP (ID, EXPTNO, WO, VESSEL, IS_PART, IS_FRAME, STUFF_D, CONTAINERS, VGM, SI, BL, SB, BL_SHEET, SB_SHEET)
    SELECT R.ID, R.EXPTNO, LTRIM(RTRIM(ISNULL(R.WO, N''))),
           LTRIM(RTRIM(REPLACE(REPLACE(ISNULL(R.VSL_NAME, N''), CHAR(13), N' '), CHAR(10), N' '))),
           CASE WHEN R.VEH LIKE N'%PART%' THEN 1 ELSE 0 END, CASE WHEN R.VEH LIKE N'%FRAME%' THEN 1 ELSE 0 END,
           CASE WHEN Z.SD LIKE '[0-3][0-9]-[01][0-9]-[12][0-9][0-9][0-9]' AND ISDATE(Z.SD) = 1 THEN CONVERT(DATETIME, Z.SD, 105) END,
           CASE WHEN Z.CT <> N'' AND Z.CT NOT LIKE N'%[^0-9]%' AND LEN(Z.CT) <= 4 THEN CONVERT(INT, Z.CT)
                WHEN Z.CN <> N'' THEN LEN(Z.CN) - LEN(REPLACE(REPLACE(Z.CN, CHAR(10), N''), N',', N'')) + 1
                ELSE 1 END,
           CASE WHEN LTRIM(RTRIM(ISNULL(R.VGM_SUBMITTED_DT, N''))) <> N'' THEN 1 ELSE 0 END,
           CASE WHEN LTRIM(RTRIM(ISNULL(R.SI_SUBMITTED_DT, N''))) <> N'' THEN 1 ELSE 0 END, 0, 0,
           CASE WHEN LTRIM(RTRIM(ISNULL(R.BL_NO, N''))) <> N'' THEN 1 ELSE 0 END,
           CASE WHEN LTRIM(RTRIM(ISNULL(R.SB_NO, N''))) <> N'' THEN 1 ELSE 0 END
    FROM   dbo.TBL_EXPT_SHEET_ROW R
           CROSS APPLY (SELECT LTRIM(RTRIM(ISNULL(R.STUFFING_DT, N''))) AS SD, LTRIM(RTRIM(ISNULL(R.CONT, N''))) AS CT,
                               LTRIM(RTRIM(REPLACE(ISNULL(R.CONTAINER_NO, N''), CHAR(13), N''))) AS CN) Z
    WHERE  R.MONTH_ID = @MONTH_ID AND R.TAB_CODE = 'SLPF' AND R.ISDELETED = 0;
    SET @ROWS = @@ROWCOUNT;

    -- linked rows: the Links vessel, BL and SB (each table read once)
    INSERT INTO #KP_J (EXPTNO, VSL_NAME, BLNO, SBNO)
    SELECT X.EXPTNO, VM.VSL_NAME, X.BLNO, X.SBNO
    FROM  (SELECT LTRIM(RTRIM(E.EXPTNO)) AS EXPTNO, LTRIM(RTRIM(ISNULL(E.EXPT_VESSEL, ''))) AS VESSEL, LTRIM(RTRIM(ISNULL(E.EXPT_BLNO, ''))) AS BLNO,
                  LTRIM(RTRIM(ISNULL(E.EXPT_SHIPBILLNO, ''))) AS SBNO, ROW_NUMBER() OVER (PARTITION BY E.EXPTNO ORDER BY E.SYSEXPT_DOCRECD, E.ID) AS RN
           FROM   dbo.EXPT_MASTER E JOIN (SELECT DISTINCT EXPTNO FROM #KP WHERE EXPTNO IS NOT NULL) K ON K.EXPTNO = E.EXPTNO) X
           LEFT JOIN (SELECT V.VSL_RTNO, MAX(LTRIM(RTRIM(V.VSL_NAME))) AS VSL_NAME FROM dbo.VSL_MASTER V GROUP BY V.VSL_RTNO) VM ON VM.VSL_RTNO = X.VESSEL
    WHERE  X.RN = 1;
    UPDATE K SET VESSEL = CASE WHEN ISNULL(J.VSL_NAME, N'') <> N'' THEN J.VSL_NAME ELSE K.VESSEL END,
                 BL = CASE WHEN ISNULL(J.BLNO, N'') <> N'' OR K.BL_SHEET = 1 THEN 1 ELSE 0 END,
                 SB = CASE WHEN ISNULL(J.SBNO, N'') <> N'' OR K.SB_SHEET = 1 THEN 1 ELSE 0 END
    FROM   #KP K LEFT JOIN #KP_J J ON J.EXPTNO = K.EXPTNO;

    SELECT @LATEST = MAX(STUFF_D) FROM #KP;

    -- Table: per vessel
    SELECT VESSEL, SUM(IS_PART) AS PARTS, SUM(IS_FRAME) AS FRAMES,
           CASE WHEN SUM(IS_PART) > 0 AND SUM(IS_FRAME) > 0 THEN 'VIOLATION' WHEN SUM(IS_PART) = 0 AND SUM(IS_FRAME) = 0 THEN 'NONE' ELSE 'OK' END AS KPI_STATUS
    FROM   #KP WHERE VESSEL <> N'' GROUP BY VESSEL ORDER BY VESSEL;

    -- Table1: totals + the latest stuffing date ("today's KPI")
    SELECT @VESSELS = COUNT(*), @VIOL = SUM(CASE WHEN P > 0 AND F > 0 THEN 1 ELSE 0 END)
    FROM  (SELECT VESSEL, SUM(IS_PART) AS P, SUM(IS_FRAME) AS F FROM #KP WHERE VESSEL <> N'' GROUP BY VESSEL) V;
    SELECT ISNULL(@VESSELS, 0) AS VESSELS,
           (SELECT ISNULL(SUM(IS_PART), 0) FROM #KP WHERE VESSEL <> N'') AS PARTS,
           (SELECT ISNULL(SUM(IS_FRAME), 0) FROM #KP WHERE VESSEL <> N'') AS FRAMES,
           ISNULL(@VIOL, 0) AS VIOLATIONS,
           ISNULL(STUFF((SELECT N', ' + VESSEL FROM #KP WHERE VESSEL <> N'' GROUP BY VESSEL HAVING SUM(IS_PART) > 0 AND SUM(IS_FRAME) > 0 ORDER BY VESSEL
                         FOR XML PATH(''), TYPE).value('.', 'NVARCHAR(MAX)'), 1, 2, N''), N'') AS VIOLATION_VESSELS,
           ISNULL(@ROWS, 0) AS ROWS,
           ISNULL(CONVERT(VARCHAR(10), @LATEST, 105), '') AS LATEST_STUFFING_DT,
           T.TODAY_ROWS, T.TODAY_WOS, T.TODAY_CONTAINERS, T.TODAY_PARTS_WOS, T.TODAY_FRAMES_WOS,
           (SELECT COUNT(*) FROM (SELECT VESSEL FROM #KP WHERE STUFF_D = @LATEST AND VESSEL <> N'' GROUP BY VESSEL HAVING SUM(IS_PART) > 0 AND SUM(IS_FRAME) = 0) A) AS TODAY_PARTS_ONLY_VESSELS,
           (SELECT COUNT(*) FROM (SELECT VESSEL FROM #KP WHERE STUFF_D = @LATEST AND VESSEL <> N'' GROUP BY VESSEL HAVING SUM(IS_FRAME) > 0 AND SUM(IS_PART) = 0) A) AS TODAY_FRAMES_ONLY_VESSELS,
           (SELECT COUNT(*) FROM (SELECT VESSEL FROM #KP WHERE STUFF_D = @LATEST AND VESSEL <> N'' GROUP BY VESSEL HAVING SUM(IS_PART) > 0 AND SUM(IS_FRAME) > 0) A) AS TODAY_VIOLATIONS,
           T.TODAY_VGM, T.TODAY_SI, T.TODAY_BL, T.TODAY_SB
    FROM  (SELECT COUNT(*) AS TODAY_ROWS, COUNT(DISTINCT NULLIF(WO, N'')) AS TODAY_WOS, ISNULL(SUM(CONTAINERS), 0) AS TODAY_CONTAINERS,
                  ISNULL(SUM(IS_PART), 0) AS TODAY_PARTS_WOS, ISNULL(SUM(IS_FRAME), 0) AS TODAY_FRAMES_WOS, ISNULL(SUM(VGM), 0) AS TODAY_VGM,
                  ISNULL(SUM(SI), 0) AS TODAY_SI, ISNULL(SUM(BL), 0) AS TODAY_BL, ISNULL(SUM(SB), 0) AS TODAY_SB
           FROM   #KP WHERE STUFF_D = @LATEST) T;

    -- Table2: per vessel on the latest stuffing date
    SELECT VESSEL, SUM(IS_PART) AS PARTS, SUM(IS_FRAME) AS FRAMES,
           CASE WHEN SUM(IS_PART) > 0 AND SUM(IS_FRAME) > 0 THEN 'VIOLATION' WHEN SUM(IS_PART) = 0 AND SUM(IS_FRAME) = 0 THEN 'NONE' ELSE 'OK' END AS KPI_STATUS,
           ISNULL(CONVERT(VARCHAR(10), @LATEST, 105), '') AS STUFFING_DT
    FROM   #KP WHERE STUFF_D = @LATEST AND VESSEL <> N'' GROUP BY VESSEL ORDER BY VESSEL;
    -- self-test hook: only TEST_EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql creates #EXPT_SHEET_SELFTEST
    IF OBJECT_ID('tempdb..#EXPT_SHEET_SELFTEST') IS NOT NULL
        INSERT INTO #EXPT_SHEET_SELFTEST (PROC_NAME, STATUS, STATUSTEXT, N1, N2, N3)
        VALUES ('KPI', @STATUS, @STATUSTEXT, ISNULL(@VIOL, 0), ISNULL(@VESSELS, 0), @ROWS);
END
GO

SET NOEXEC OFF;
GO

/* ---- 5. verify (read-only) --------------------------------------------------------------- */
SELECT x.nm AS [table], CASE WHEN OBJECT_ID('dbo.' + x.nm, 'U') IS NOT NULL THEN 'ok' ELSE '*** MISSING' END AS [state],
       (SELECT SUM(p.rows) FROM sys.partitions p WHERE p.object_id = OBJECT_ID('dbo.' + x.nm) AND p.index_id IN (0, 1)) AS [rows]
  FROM (VALUES ('TBL_EXPT_SHEET_MONTH'), ('TBL_EXPT_SHEET_ROW'), ('TBL_EXPT_SHEET_GRIDROW'), ('TBL_EXPT_SHEET_TABMETA'), ('TBL_EXPT_SHEET_STATUS'), ('TBL_EXPT_SHEET_ROLE'), ('TBL_EXPT_SHEET_ROLE_COL'), ('TBL_EXPT_SHEET_ROLE_USER'), ('TBL_EXPT_SHEET_ALIAS'), ('TBL_EXPT_SHEET_LOG'), ('TBL_EXPT_SHEET_VIEW')) x (nm);

SELECT p.name AS [procedure], CONVERT(VARCHAR(19), p.modify_date, 120) AS created,
       CASE WHEN CHARINDEX('EXPORT_SHEET_VIEW_LINKSDB20_20261021', OBJECT_DEFINITION(p.object_id)) > 0 THEN 'this script' ELSE '*** NOT this script' END AS [source]
  FROM sys.procedures p
 WHERE p.name LIKE 'USP[_]EXPT[_]SHEET[_]%'
 ORDER BY p.name;

SELECT pk_FormId, fk_ModuleId, FormName, DisplayName, SEQ, RIGHTS, FrmSrc FROM dbo.tbl_Mst_Form WHERE pk_FormId IN (448, 449, 450) ORDER BY pk_FormId;

IF (SELECT COUNT(*) FROM sys.procedures WHERE name IN ('USP_EXPT_SHEET_LINKS_FILL', 'USP_EXPT_SHEET_ROWS_OUT', 'USP_EXPT_SHEET_TRACK_MIRROR', 'USP_EXPT_SHEET_SAVE_APPLY', 'USP_EXPT_SHEET_LINK_APPLY', 'USP_EXPT_SHEET_MONTHS', 'USP_EXPT_SHEET_MONTH_IU', 'USP_EXPT_SHEET_LOAD', 'USP_EXPT_SHEET_CHANGES', 'USP_EXPT_SHEET_SAVE_CELLS', 'USP_EXPT_SHEET_SAVE_FMT', 'USP_EXPT_SHEET_ROWS_OP', 'USP_EXPT_SHEET_GRID_ROWS_OP', 'USP_EXPT_SHEET_LINK', 'USP_EXPT_SHEET_CONVERT_DONE', 'USP_EXPT_SHEET_UNLINK', 'USP_EXPT_SHEET_CONVERT_DRAFT', 'USP_EXPT_SHEET_HISTORY', 'USP_EXPT_SHEET_RESTORE_VALUE', 'USP_EXPT_SHEET_LEGEND', 'USP_EXPT_SHEET_LEGEND_IU', 'USP_EXPT_SHEET_ROLES', 'USP_EXPT_SHEET_ROLES_IU', 'USP_EXPT_SHEET_MY_ROLES', 'USP_EXPT_SHEET_ALIAS', 'USP_EXPT_SHEET_ALIAS_IU', 'USP_EXPT_SHEET_ALIAS_SEED', 'USP_EXPT_SHEET_VIEWS', 'USP_EXPT_SHEET_VIEW_IU', 'USP_EXPT_SHEET_VIEW_DEL', 'USP_EXPT_SHEET_GRID_LOAD', 'USP_EXPT_SHEET_GRID_SAVE', 'USP_EXPT_SHEET_GRID_SAVE_FMT', 'USP_EXPT_SHEET_GRID_CHANGES', 'USP_EXPT_SHEET_TABMETA_IU', 'USP_EXPT_SHEET_KPI')
       AND CHARINDEX('EXPORT_SHEET_VIEW_LINKSDB20_20261021', OBJECT_DEFINITION(object_id)) > 0) = 36
   AND (SELECT COUNT(*) FROM sys.tables WHERE name IN ('TBL_EXPT_SHEET_MONTH', 'TBL_EXPT_SHEET_ROW', 'TBL_EXPT_SHEET_GRIDROW', 'TBL_EXPT_SHEET_TABMETA', 'TBL_EXPT_SHEET_STATUS', 'TBL_EXPT_SHEET_ROLE', 'TBL_EXPT_SHEET_ROLE_COL', 'TBL_EXPT_SHEET_ROLE_USER', 'TBL_EXPT_SHEET_ALIAS', 'TBL_EXPT_SHEET_LOG', 'TBL_EXPT_SHEET_VIEW')) = 11
BEGIN
    DECLARE @nst INT, @nro INT, @nrc INT, @nfo INT;
    SELECT @nst = (SELECT COUNT(*) FROM dbo.TBL_EXPT_SHEET_STATUS), @nro = (SELECT COUNT(*) FROM dbo.TBL_EXPT_SHEET_ROLE),
           @nrc = (SELECT COUNT(*) FROM dbo.TBL_EXPT_SHEET_ROLE_COL), @nfo = (SELECT COUNT(*) FROM dbo.tbl_Mst_Form WHERE pk_FormId IN (448, 449, 450));
    PRINT 'Export > Sheet view: 11 tables and 36 procedures are in place on ' + DB_NAME() + '.';
    PRINT 'Seeds: ' + CAST(@nst AS VARCHAR(10)) + ' statuses, ' + CAST(@nro AS VARCHAR(10)) + ' roles, ' + CAST(@nrc AS VARCHAR(10))
          + ' column owners, ' + CAST(@nfo AS VARCHAR(10)) + ' form rows (expected 10, 8, 52, 3 on a first run).';
    PRINT 'Next: TEST_EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql (self-test, leaves no rows), then grant forms 448-450 and assign the sheet roles in Sheet view settings.';
END
ELSE
    PRINT '*** One or more Sheet view objects are missing or not this script''s own on ' + DB_NAME() + ' - see the lists above.';
GO
