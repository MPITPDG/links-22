# Go-live review - what is left, in order, with every query

Prepared 2026-10-22, updated 2026-10-23, for one last read-through before the final deploy. `DEPLOY_ORDER.md`
stays the master list; this file walks through what is still open, and puts every check query in one place,
ready to paste into SSMS.

Commits to deploy from `main` (both repos checked 2026-10-23: local = GitHub, nothing unpushed):

| Repo | Commit | What |
|---|---|---|
| links-22 | `2f940d4` | Front end. New since the last publish: Export › Sheet view (`b0e66ef`, KPI fix `e73eb7a`), company 32 OLSPL logo (`f79c5ab`), file uploads fixed (`2f940d4`); plus the `_DB_FIX` scripts |
| Links_v5_API | `91ab5c0` | `ExportSheetController` (api/Export/Sheet/*) on top of everything published on 2026-10-21 |

**The order, in one line each** (details in the numbered sections below):

1. Decide the company scope of a sheet month (section 1).
2. Publish the Links API from `main` `91ab5c0` (section 2).
3. Run `EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql` on LinksDB20 (section 3). **Done 2026-10-23**, no errors.
4. Optional: run `TEST_EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql` at a quiet moment (section 4). **Done
   2026-10-23**: 123 checks passed, 0 failed, no rows left behind.
5. Build and publish the front end from `main` `2f940d4` (section 5).
6. Grant forms 448-450 in Form-wise Rights (section 6).
7. Assign the sheet roles in Sheet view › Column Access (section 7).
8. Cut-over: import the live workbook once (section 8).
9. Smoke test (section 9).

Nothing else is pending: the dashboard fixes (5c, 5d) and every other database step are already live, and the
company 32 logo and the upload fix need only the front-end publish in step 5.

## 0. Already live - nothing to do

All of `DEPLOY_ORDER.md` section 1 except row 8 is applied on LinksDB20:

| Row | What | Applied |
|---|---|---|
| 1-3b | UserPref, Tickets, Export job state (+ the 162 s → 2 s refresh fix) | 2026-10-15 / 2026-10-21 |
| 4 | Agent jobs "Export job state + alerts" and "watchdog", every 10 minutes | 2026-10-21 |
| 5, 5b | Finance dashboard Audit tab (445 s → 2.4 s) | 2026-10-21 |
| 5c, 5d | Payables dashboard 11.8 s → 4.7 s, Finance dashboard about 23 s → 14.5 s | 2026-10-22 |
| 6, 7 | Import search types 2-7, Export redesign procedures | 2026-10-21 |

The Links API was published from `main` on 2026-10-21 and every new read endpoint answered with data. It does
not have the Sheet view controller yet (step 2 below).

## 1. Decide before you start

1. **Company scope of a sheet month.** A month belongs to one company + branch (the login's CMPCODE / CITYCODE).
   The import assumes 30 / MUM. Bajaj jobs also exist under 31 and 32 in MUM: in October, Sri Lanka rows 22-24 are
   company 32 jobs (321102610000013-15), and a company 30 month cannot link them. Users logged in to 31 or 32 will
   not see the 30 month. Keep it per company, or ask for one shared month across 30/31/32 before cut-over (a change
   in the procedures and the page, not in your data).
2. **When.** The Sheet view script only creates new objects, so it can run any time. The self-test (step 4) and
   the import (step 8) are best at a quiet moment.

## 2. Links API - publish `91ab5c0`

1. Build and publish `LINKS_V8NG_API` from `main` to the Links-api IIS app, as on 2026-10-21. New files:
   `Controllers/ExportBLL/ExportSheetController.cs`, `Models/ExportSheet.cs` (both in the `.csproj`).
2. Nothing new in Web.config.
3. Until step 3 runs, every api/Export/Sheet/... call answers STATUS 101 (procedure not found) and the page says
   "Sheet view's server part is not deployed yet". Nothing else in Links is affected.

## 3. Database - `EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql` (DEPLOY_ORDER row 8)

Run as your normal login in SSMS, connected to LinksDB20. Optional check first, read-only, that nothing of it
exists yet (expect no rows from both):

```sql
SELECT name, type_desc
  FROM sys.objects
 WHERE name LIKE 'TBL[_]EXPT[_]SHEET[_]%' OR name LIKE 'USP[_]EXPT[_]SHEET[_]%'
 ORDER BY type_desc, name;

SELECT pk_FormId, fk_ModuleId, FormName FROM dbo.tbl_Mst_Form WHERE pk_FormId IN (448, 449, 450);
```

What the script does:

* **Step 1 checks everything and stops before creating anything** if one check fails: database name,
  CREATE TABLE / PROCEDURE / INSERT permissions, about 90 Links columns it reads, module 3, table and procedure
  names free (or its own from an earlier run), constraint names free, form ids 448-450 free (or its own).
* **Creates 11 tables** (`TBL_EXPT_SHEET_MONTH`, `_ROW`, `_GRIDROW`, `_TABMETA`, `_STATUS`, `_ROLE`, `_ROLE_COL`,
  `_ROLE_USER`, `_ALIAS`, `_LOG`, `_VIEW`), only when absent.
* **Seeds** the 10 Colour CODE statuses, the 8 roles (OPS, BOOKING, OPSLEAD, DOCS, BLDESK, YARD, ALL, ADMIN) and
  the 52 column owners - only where missing.
* **Creates 36 procedures** `USP_EXPT_SHEET_*` (31 called by the API, 5 internal).
* **Adds form rows** 448 EXPORT - SHEET VIEW, 449 EXPORT - SHEET VIEW CONVERT / LINK JOB, 450 EXPORT - SHEET VIEW
  SETTINGS in module 3. **No rights are granted and no roles are assigned.**
* **Alters nothing existing.** At run time (never by running the script) the procedures write to
  `EXPT_JOB_TRACKING` / `EXPT_JOB_TRACKING_LOG` when a linked row's tracking columns change; TRACKING_STATUS and
  SHIPMENT_CATEGORY are never touched.
* Re-runnable. The last step only reads.

Expected messages at the end:

```
Export > Sheet view: 11 tables and 36 procedures are in place on LinksDB20.
Seeds: 10 statuses, 8 roles, 52 column owners, 3 form rows (expected 10, 8, 52, 3 on a first run).
```

Extra read-only checks after it, if you want to see the seeds:

```sql
SELECT CODE, LABEL, BG, FG, SORT, ACTIVE FROM dbo.TBL_EXPT_SHEET_STATUS ORDER BY SORT;

SELECT r.CODE, r.LABEL, COUNT(c.COL_KEY) AS COLUMNS_OWNED
  FROM dbo.TBL_EXPT_SHEET_ROLE r
  LEFT JOIN dbo.TBL_EXPT_SHEET_ROLE_COL c ON c.ROLE_CODE = r.CODE
 GROUP BY r.CODE, r.LABEL, r.SORT
 ORDER BY r.SORT;

SELECT pk_FormId, fk_ModuleId, FormName, DisplayName, SEQ, RIGHTS, FrmSrc
  FROM dbo.tbl_Mst_Form WHERE pk_FormId IN (448, 449, 450) ORDER BY pk_FormId;
```

Rollback: `ROLLBACK_EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql`. It drops only this script's procedures, removes
forms 448-450 with any rights granted on them, and drops the tables **only while they hold no sheet data**
(`@DropEvenIfData = 1` overrides; take a backup first). Tracking rows written by linked sheet rows are not undone.

## 4. Self-test - `TEST_EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql` (optional, recommended)

* 66 steps, each check printed PASS / FAIL, inside **one transaction that is always rolled back**. It uses a throwaway
  month (ZZ / ZZZ / 1900-01), a test role and fake users, plus one real SA user picked read-only to prove SA
  counts as sheet ADMIN. It links a real export job inside the transaction to test the Links values and the
  tracking mirror, then checks that no trace is left.
* For a few seconds it holds row locks, including on that job's `EXPT_JOB_TRACKING` row: run it at a quiet moment.
* If you stop it part way: run `ROLLBACK TRANSACTION` in the same window, and never answer Yes when SSMS offers to
  commit on closing.
* Only IDENTITY counters move (the next real ids are a few numbers higher); the script prints them.

## 5. Front end - links-22 `2f940d4`

1. `src/app/app.constants.ts` must point at the production API before building.
2. `npm ci && npx ng build --configuration production`, then publish `publish/` as usual.
3. New in the menu: Consignment › Consignment › **Sheet view** (`/export/sheet`), after Search.
4. Company 32 (OCEAN LINKS SHIPPING) shows its OLSPL logo: the ribbon emblem in both navbars, the full logo on
   the module picker, Tax Invoice, Export Docket and Sales Quotations, and a new `HEADER_OCEAN_LINKS.JPG`
   letterhead on Proforma / Purchase / vouchers / JV / Credit Note. Same file name as before, so no database
   change; a browser that cached the old letterhead may need one hard refresh (Ctrl+F5). Companies 30 and 31
   are unchanged.
5. File uploads work again: the shared interceptor no longer forces JSON on file uploads (Upload IRN, HBL
   upload, bank statement, TDS 26AS, Client EDI file upload, company logo, user photo, client master).

## 6. Rights - forms 448-450

Grant per user (SA users need nothing). The new Links has no rights screen: rights are managed in a separate
application for now (the classic ASP.NET page "USERS RIGHT - FORM WISE ADVANCE" did it before), or by script.
The 8 users with sheet roles were granted 448 / 449 on 30110 by script (DEPLOY_ORDER steps 1.11 and 1.12).

| Form | Name | Gives |
|---|---|---|
| 448 | EXPORT - SHEET VIEW | View = open the page; Add = insert / duplicate rows; Modify = edit cells, colours, row moves |
| 449 | EXPORT - SHEET VIEW CONVERT / LINK JOB | View = Convert to job, Link to job, Unlink |
| 450 | EXPORT - SHEET VIEW SETTINGS | Modify = edit Colour CODE, Column Access, Aliases |

Check what was granted (read-only):

```sql
SELECT w.fk_FormId, w.fk_cmpId, w.fk_cmp_code, w.viewForm, w.AddForm, w.modifyForm, w.FromDt, w.ToDt
  FROM dbo.tbl_Mst_FormWiseRights w
 WHERE w.fk_FormId IN (448, 449, 450)
 ORDER BY w.fk_FormId, w.fk_cmpId;
```

## 7. Sheet roles - Sheet view › Column Access tab

Column ownership is a hard lock enforced by the database: a user can edit a column only if one of their sheet
roles owns it, or they hold ADMIN. Links SA users count as ADMIN automatically. **Until roles are assigned,
everyone except SA / ADMIN can edit only REMARK1** (the one column owned by ALL). Assign users to OPS, BOOKING,
OPSLEAD, DOCS, BLDESK, YARD as the old workbook's Column Access tab did (its e-mail list was deliberately not
copied into Links).

```sql
SELECT ru.ROLE_CODE, ru.USER_ID, ru.MAKER_ID, ru.MAKER_DT
  FROM dbo.TBL_EXPT_SHEET_ROLE_USER ru
 ORDER BY ru.ROLE_CODE, ru.USER_ID;
```

## 8. Cut-over - load the live workbook once

Full detail: `tools/sheet-import/README.md`. Short version:

1. Agree the moment; set the Google workbook to view-only.
2. File › Download › Microsoft Excel into a new folder **outside the repo**, e.g. `C:\cutover\2026-10\`.
3. Generate:
   ```
   cd C:\development-manilal\links-22
   python -I -X utf8 tools\sheet-import\sheet_import.py "C:\cutover\2026-10\<workbook>.xlsx" --month 2026-10 --title "Bajaj October Sheet 2026" --out-dir C:\cutover\2026-10\sql
   ```
4. Read the `_REPORT.txt`; run the read-only `CHECK_FFJOB_EXPORT_SHEET_202610.sql`.
5. Fix in Google, or accept, what the October dry run already flagged:
   * `#VALUE!` in FF JOB on Vipar row 22.
   * 3 Sri Lanka rows on company 32 jobs (see decision 1).
   * 6 rows whose WO is not the linked job's invoice no.: Vipar 33 / 34 (look swapped, 5477272 / 5477273),
     Bangladesh 20 (shares a job with row 37), Bangladesh 29 (WO 5586147, job invoice 5586032), Bangladesh 33 / 34
     (same invoice spelled `/L2` and `-L-2`).
   * One unknown row colour (#e06666, Bangladesh row 40): imported with no status, the fill kept per cell.
6. Run the IMPORT script in SSMS with `@Replace = 0`, `@MirrorTracking = 0` (1 also pushes the tracking columns
   into each linked job's tracking now, through the same code as the Link button). Every step-4 check must say `ok`.
7. Compare each tab with Google in the Sheet view.
8. Wrong and nobody has edited yet: run its ROLLBACK, fix, regenerate. Go live; delete the `.xlsx` and generated files.

Read-only checks after the import:

```sql
SELECT ID, CMPCODE, CITYCODE, SHEET_MONTH, TITLE, MODIFY_ID, MODIFY_DT
  FROM dbo.TBL_EXPT_SHEET_MONTH ORDER BY SHEET_MONTH DESC;

SELECT m.SHEET_MONTH, r.TAB_CODE, COUNT(*) AS ROWS_,
       SUM(CASE WHEN r.EXPTNO IS NOT NULL THEN 1 ELSE 0 END) AS LINKED,
       SUM(CASE WHEN r.STATUS_CODE IS NOT NULL THEN 1 ELSE 0 END) AS COLOURED
  FROM dbo.TBL_EXPT_SHEET_ROW r
  JOIN dbo.TBL_EXPT_SHEET_MONTH m ON m.ID = r.MONTH_ID
 WHERE r.ISDELETED = 0
 GROUP BY m.SHEET_MONTH, r.TAB_CODE
 ORDER BY m.SHEET_MONTH, r.TAB_CODE;

SELECT m.SHEET_MONTH, g.TAB_CODE, COUNT(*) AS GRID_ROWS
  FROM dbo.TBL_EXPT_SHEET_GRIDROW g
  JOIN dbo.TBL_EXPT_SHEET_MONTH m ON m.ID = g.MONTH_ID
 WHERE g.ISDELETED = 0
 GROUP BY m.SHEET_MONTH, g.TAB_CODE
 ORDER BY m.SHEET_MONTH, g.TAB_CODE;
```

October dry run expectations: Vipar 78, RK 2, Sri Lanka 35, Sri Lanka parts and frames 0, Bangladesh 74,
Triumph 20 (209 WO rows, 58 linked); Bookings 165, DGD 24, Vehicle wise weights 7, Price 28 grid rows. The real
cut-over numbers will differ by whatever was added since.

## 9. Smoke test in the browser

1. As an SA user: Export › Consignment › Sheet view opens on 2026-10 with every tab.
2. Type in a cell, wait for "Saved", reload: the value stays. Undo it.
3. As a user with one role (e.g. DOCS): columns of other roles show a padlock and refuse edits with the owner's name.
4. On a linked row: Links-owned columns show the job's values with a Links mark and are locked; empty ones say
   "not in Links yet" and stay editable.
5. Convert to job on a test-worthy unlinked row (you, as admin): Export Master opens pre-filled with the banner;
   mode of shipment and services are empty until you choose; Submit returns to the sheet with FF JOB filled.
   Use a real shipment that needs a job anyway - a job created here is a real Links job.
6. History panel shows each change with Restore; KPI tab works out the parts / frames rule.
7. Company 32: choose Ocean Links Shipping; the navbar shows the ribbon emblem, and a Tax Invoice and a Proforma
   show the OLSPL logo and letterhead (Ctrl+F5 once if the old letterhead still shows).
8. One real file upload (for example Upload IRN or a bank statement) reaches the API and comes back with rows.

Activity checks (read-only), any time after go-live:

```sql
SELECT TOP 50 ID, ROW_KIND, ROW_ID, COL_KEY, OLD_VALUE, NEW_VALUE, ACTION, USER_NAME, LOG_DT
  FROM dbo.TBL_EXPT_SHEET_LOG ORDER BY ID DESC;

SELECT TOP 20 ID, ROW_ID, COL_KEY, NEW_VALUE, ACTION, USER_NAME, LOG_DT
  FROM dbo.TBL_EXPT_SHEET_LOG WHERE ACTION IN ('convert', 'link', 'unlink') ORDER BY ID DESC;

SELECT TOP 50 EXPTNO, FIELD_NAME, OLD_VALUE, NEW_VALUE, CHANGED_BY, CHANGED_DT
  FROM dbo.EXPT_JOB_TRACKING_LOG WHERE CHANGED_IP = 'EXPORT SHEET VIEW' ORDER BY ID DESC;
```

And the existing job-state check from `DEPLOY_ORDER.md` section 4 (every `error` NULL):

```sql
SELECT TOP 5 * FROM dbo.TBL_EXPT_JOB_STATE_RUNLOG ORDER BY run_id DESC;
```

## 10. Rollback, piece by piece

| Piece | How |
|---|---|
| October import | Its generated `ROLLBACK_IMPORT_...sql` (refuses once anyone has edited the month) |
| Sheet view database | `ROLLBACK_EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql` (keeps tables that hold data unless forced) |
| API | Republish the previous build; the page then shows "not deployed yet" |
| Front end | Republish the previous `publish/`; the Sheet view menu entry, the company 32 logo and the upload fix go with it |
| Dashboards (already live) | `ROLLBACK_PAYABLE_DASHBOARD_PERF_...sql`, `ROLLBACK_FINANCE_DASHBOARD_PERF_...sql` |

## 11. Still open, not part of this deploy

* Rights are checked by the screen, not by the API (true of the whole Links API). The database enforces column
  ownership for the Sheet view.
* Export no. 321102610000001 exists twice in `expt_master` (a Links numbering problem); the job-state refresh skips
  the second one.
* The production DB password and the PDG password were pasted in chat on 2026-10-15: change both.
* `Web.config` with the connection string is committed in Links_v5_API.
* `FINANCE_DASHBOARD_SETUP.sql` is older than the live procedure: never re-run it.
