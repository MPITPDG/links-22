# Links redesign - deployment checklist

Everything below is deployed in ONE pass at the end of the redesign.
Run the steps top to bottom. Each SQL script is re-runnable, aborts on a
failed prerequisite, and has a matching `ROLLBACK_` script in this folder.

## 1. Database (LinksDB20)

| # | Script | Run as | Status |
|---|--------|--------|--------|
| 1 | `USER_PREF_LINKSDB20_20261015.sql` | normal login | done 2026-10-15 |
| 2 | `TICKETS_LINKSDB20_20261015.sql` | normal login | done 2026-10-21 (3 tables, 5 functions, 13 procedures) |
| 3 | `EXPT_JOB_STATE_LINKSDB20_20261015.sql` (its last step runs the engine once and prints alert counts) | normal login | done 2026-10-21 (2,867 jobs, 189 open alerts: 24 CRIT, 130 WARN, 35 INFO) |
| 3b | `EXPT_JOB_STATE_REFRESH_PERF_LINKSDB20_20261021.sql` (USP_EXPT_JOB_STATE_REFRESH: the jobs in scope go into a temp table once instead of a CTE evaluated 18 times, 162 s → about 2 s per tick; a duplicated export number no longer fails the run). Only needed where step 3 ran before 2026-10-21; step 3 now creates this version itself | normal login | done 2026-10-21 (tick run 4: 2.1 s, 2,871 jobs) |
| 4 | `EXPT_JOB_STATE_AGENT_JOBS_LINKSDB20_20261015.sql` (creates "LinksDB20 - Export job state + alerts" and "... watchdog") | sysadmin (e.g. jolly_a) | done 2026-10-21, every 10 minutes as written (after 3b) |
| 5 | `FINANCE_DASHBOARD_AUDIT.sql` (creates USP_ACC_RPT_FINANCE_DASHBOARD_AUDIT, the Finance dashboard's Audit tab; older script from the 2026-08 port, never applied) | normal login | done 2026-10-21 |
| 5b | `FINANCE_DASHBOARD_AUDIT_PERF_LINKSDB20_20261021.sql` (USP_ACC_RPT_FINANCE_DASHBOARD_AUDIT: checks 3 and 4 read indexed temp sets built once, 445 s → about 2 s per Audit call, same rows). Only needed where step 5 ran before 2026-10-21; step 5 now creates this version itself | normal login | done 2026-10-21 (Audit call 2.2 s in the script, 2.4 s from the dashboard) |
| 5c | `PAYABLE_DASHBOARD_PERF_LINKSDB20_20261021.sql` (USP_ACC_RPT_PAYABLE_DASHBOARD: supplier / account masters read once into keyed #SUPM / #GACC instead of a trimmed-code scan per purchase bill, 11.8 s → about 4.5 s, same rows). PAYABLE_DASHBOARD_SETUP.sql carries the same body | normal login | done 2026-10-22 (4.7 s in the script) |
| 5d | `FINANCE_DASHBOARD_PERF_LINKSDB20_20261021.sql` (USP_ACC_RPT_FINANCE_DASHBOARD: un-indexed accounting lookups read keyed #temp sets built once, 22-28 s → about 12-15 s, same rows apart from 0.01 float cells that also vary between runs of the old version). FINANCE_DASHBOARD_SETUP.sql is OLDER than the live procedure: do not re-run it | normal login | done 2026-10-22 (14.5 s in the script) |
| 6 | `USP35_IMP_IMPORT_RPT_SEARCH_LINKSDB20_20261015.sql` (re-enables Import search types 2-7; fixes Import home and Sea/Air search) | normal login | done 2026-10-21 (not re-runnable once applied: step 1 finds no disabled block and stops) |
| 7 | `EXPORT_REDESIGN_PROCS_LINKSDB20_20261016.sql` (creates the five procedures behind Export/EXPT_SHIPMENT_PROGRESS_GETBLDATA, EXPT_SHIPMENTPROGRESS_BLDETAILS_UPDATE, EXP_RPT_MISSING_DOCS, ExportEditCo2Update and UpdateJob; its last step runs the two read-only ones once) | normal login | done 2026-10-21 |
| 8 | `EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql` (Export › Sheet view, the Bajaj workbook inside Links: 11 `TBL_EXPT_SHEET_*` tables, 36 `USP_EXPT_SHEET_*` procedures behind api/Export/Sheet/..., seeds for the 10 Colour CODE statuses, 8 roles and 52 column owners, form rows 448-450 in module 3 - no rights granted). Then run `TEST_EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql`: one transaction, always rolled back, prints PASS / FAIL per check. Then grant forms 448-450 in Form-wise Rights and assign the sheet roles in Sheet view settings | normal login | done 2026-10-23 (11 tables, 36 procedures, seeds 10 / 8 / 52, forms 448-450; self-test 123 passed, 0 failed, no trace left). Rights and sheet roles not granted yet |
| 8b | `CLEANUP_SHEET_MONTH_202610_TEST_LINKSDB20_20261023.sql` (removes the October 2026 sheet month that was entered by hand on the page to try it, so the one-time workbook import can create that month; every row is first copied into `BAK_EXPT_SHEET_202610_TEST_*` tables, which its `ROLLBACK_` restores with the same ids) | normal login | done 2026-10-23 (month 3, 1,079 rows, 3,470 history entries removed and backed up; Sheet view now holds no month). Drop the six backup tables once the import is in and checked |
| 9 | `EXPORT_JOB_HISTORY_LINKSDB20_20261024.sql` (Export job view › History, phase 1, read-only: creates `USP_EXPT_JOB_HISTORY` behind api/Export/JobHistory - a job's audit rows from TBL_USERTRACK_EXPTMASTER, EXPT_JOB_TRACKING_LOG and TBL_EXPT_SHEET_LOG, Links SA users only - and index `IX_TBL_USERTRACK_EXPTMASTER_CODE` on TBL_USERTRACK_EXPTMASTER (CODE, DATETIME) when absent). Building the index blocks inserts into that audit table for a few seconds (job saves wait): run it at a quiet moment. No row is written | normal login | done 2026-10-26 (index built in 1.1 s; a job's history in 6-80 ms; non-admins get 104) |
| 10 | `COMPANY32_FULLNAME_ADDRESS_LINKSDB20_20261028.sql` (company 32 / MUM row of `cmp_address` only: `cmp_fullname` NULL → 'OCEAN LINKS SHIPPING PVT. LTD.', so the Tax Invoice header and the Proforma "For ..." line print the whole name; `cmp_add1` '601/602, Star Hub, Tower 1,' → '601, Star Hub, Tower 1,'. Companies 30 and 31 keep 601/602) | normal login | done 2026-10-28 (1 row; re-run says nothing to do) |
| 11 | `GRANT_SHEET_VIEW_YOGESH_LINKSDB20_20261028.sql` (P YOGESH, cmpid 82: forms 448 View/Add/Modify and 449 View on 30110, 28-Oct-2026 to 31-Dec-2027) | normal login | done 2026-10-28 (2 rows) |
| 12 | `GRANT_SHEET_VIEW_ROLE_USERS_LINKSDB20_20261028.sql` (the same two rights for the other 7 sheet-role users: 19 LUISED, 22 YUGA, 45 LRAJESH, 71 YJaywant, 79 PEKTA, 80 PSAGAR, 81 JYASH) | normal login | done 2026-10-28 (14 rows; all 8 users current today) |

Already applied on live by the finance port (PR nalini-mp/links-22#1, per its notes), so do not re-run. They are listed here for the record, each with its `ROLLBACK_` twin:
`REGISTER_EXPORT_PROC_FIXES_20261017.sql`, `PURCHASE_REGISTER_SUPINVNO_FIX_20261018.sql`, `TRIALBALANCE_DATEWISE_BLANK_PURCHASE_AMOUNT_FIX_20261018.sql`, `TRIALBALANCE_FAMILY_BLANK_PURCHASE_AMOUNT_FIX_20261018.sql`. `REVIEW_INVOICES_BROKEN_DATE_20261017.sql` is a review query, not a fix.

## 2. Links API (Links_v5_API, `main`)

1. Build and publish LINKS_V8NG_API to the Links-api IIS app.
2. If the server keeps its own Web.config, set `<httpRuntime ... maxRequestLength="25600" />` there (ticket attachments up to 25 MB).
3. Create `<Links-api physical path>\DATA\Tickets` and grant the app-pool identity Modify. Make sure publishing never deletes `DATA`.
4. Optional: add `<add key="JobStateRefreshKey" value="..."/>` only if job state will be refreshed over HTTP instead of the Agent job.
5. The finance port (PR #1) needs API endpoints that the live API lacks. All are in Links_v5_API `main` (e55d1b6 adds the first two; the third was already there), so this publish brings them:
   - `fn_Acc_Rpt_Invoice_Register_XL_Search_JobNos`: Invoice Register Excel export.
   - `ACC_creditNote_AUTHORISATION_CHECK`: credit note authorisation check.
   - `fn_Acc_Rpt_CN_Register_AcctDetail_XL`: Credit Note register Excel export.
6. New endpoint `POST api/Export/JobHistory` { ExptNo, UserId } (ExportJobHistoryController, Export job view › History card, read-only). It needs step 1.9; until both are deployed the card says "History is not deployed yet".
## 3. Front end (links-22)

1. Make sure `src/app/app.constants.ts` points at the production API before building (it is switched locally during development).
2. `npm ci && npx ng build --configuration production`, then publish `publish/` as usual.

## 4. Smoke test after deploy

- Theme page: pick a palette, sign out and in again; it should persist (UserPref).
- `SELECT TOP 5 * FROM dbo.TBL_EXPT_JOB_STATE_RUNLOG ORDER BY run_id DESC` about 10 minutes after step 1.4: every `error` is NULL.
- Header bell shows job-state alerts; Export > Today lists them.
- Raise a ticket with a screenshot as a normal user; open it as PDG; download the file.
