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
| 4 | `EXPT_JOB_STATE_AGENT_JOBS_LINKSDB20_20261015.sql` (creates "LinksDB20 - Export job state + alerts" and "... watchdog") | sysadmin (e.g. jolly_a) | **held**: one refresh takes about 162 s on LinksDB20 (runs 1 and 2 on 2026-10-21), so every 10 minutes keeps the shared server busy about 27% of the time. Pick the interval first (`@freq_subday_interval`) |
| 5 | `FINANCE_DASHBOARD_AUDIT.sql` (creates USP_ACC_RPT_FINANCE_DASHBOARD_AUDIT, the Finance dashboard's Audit tab; older script from the 2026-08 port, never applied) | normal login | done 2026-10-21 |
| 6 | `USP35_IMP_IMPORT_RPT_SEARCH_LINKSDB20_20261015.sql` (re-enables Import search types 2-7; fixes Import home and Sea/Air search) | normal login | done 2026-10-21 (not re-runnable once applied: step 1 finds no disabled block and stops) |
| 7 | `EXPORT_REDESIGN_PROCS_LINKSDB20_20261016.sql` (creates the five procedures behind Export/EXPT_SHIPMENT_PROGRESS_GETBLDATA, EXPT_SHIPMENTPROGRESS_BLDETAILS_UPDATE, EXP_RPT_MISSING_DOCS, ExportEditCo2Update and UpdateJob; its last step runs the two read-only ones once) | normal login | done 2026-10-21 |

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

## 3. Front end (links-22)

1. Make sure `src/app/app.constants.ts` points at the production API before building (it is switched locally during development).
2. `npm ci && npx ng build --configuration production`, then publish `publish/` as usual.

## 4. Smoke test after deploy

- Theme page: pick a palette, sign out and in again; it should persist (UserPref).
- `SELECT TOP 5 * FROM dbo.TBL_EXPT_JOB_STATE_RUNLOG ORDER BY run_id DESC` about 10 minutes after step 1.4: every `error` is NULL.
- Header bell shows job-state alerts; Export > Today lists them.
- Raise a ticket with a screenshot as a normal user; open it as PDG; download the file.
