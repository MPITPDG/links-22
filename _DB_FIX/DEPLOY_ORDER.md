# Links redesign - deployment checklist

Everything below is deployed in ONE pass at the end of the redesign.
Run the steps top to bottom. Each SQL script is re-runnable, aborts on a
failed prerequisite, and has a matching `ROLLBACK_` script in this folder.

## 1. Database (LinksDB20)

| # | Script | Run as | Status |
|---|--------|--------|--------|
| 1 | `USER_PREF_LINKSDB20_20261015.sql` | normal login | done 2026-10-15 |
| 2 | `TICKETS_LINKSDB20_20261015.sql` | normal login | pending |
| 3 | `EXPT_JOB_STATE_LINKSDB20_20261015.sql` (its last step runs the engine once and prints alert counts) | normal login | pending |
| 4 | `EXPT_JOB_STATE_AGENT_JOBS_LINKSDB20_20261015.sql` (creates "LinksDB20 - Export job state + alerts" and "... watchdog") | sysadmin (e.g. jolly_a) | pending |
| 5 | `FINANCE_DASHBOARD_AUDIT.sql` (creates USP_ACC_RPT_FINANCE_DASHBOARD_AUDIT, the Finance dashboard's Audit tab; older script from the 2026-08 port, never applied) | normal login | pending |
| 6 | `USP35_IMP_IMPORT_RPT_SEARCH_LINKSDB20_20261015.sql` (re-enables Import search types 2-7; fixes Import home and Sea/Air search) | normal login | pending |
| 7 | `EXPORT_REDESIGN_PROCS_LINKSDB20_20261016.sql` (creates the five procedures behind Export/EXPT_SHIPMENT_PROGRESS_GETBLDATA, EXPT_SHIPMENTPROGRESS_BLDETAILS_UPDATE, EXP_RPT_MISSING_DOCS, ExportEditCo2Update and UpdateJob; its last step runs the two read-only ones once) | normal login | pending |

## 2. Links API (Links_v5_API, branch `feature/links-redesign-backend`)

1. Build and publish LINKS_V8NG_API to the Links-api IIS app.
2. If the server keeps its own Web.config, set `<httpRuntime ... maxRequestLength="25600" />` there (ticket attachments up to 25 MB).
3. Create `<Links-api physical path>\DATA\Tickets` and grant the app-pool identity Modify. Make sure publishing never deletes `DATA`.
4. Optional: add `<add key="JobStateRefreshKey" value="..."/>` only if job state will be refreshed over HTTP instead of the Agent job.

## 3. Front end (links-22)

1. Make sure `src/app/app.constants.ts` points at the production API before building (it is switched locally during development).
2. `npm ci && npx ng build --configuration production`, then publish `publish/` as usual.

## 4. Smoke test after deploy

- Theme page: pick a palette, sign out and in again; it should persist (UserPref).
- `SELECT TOP 5 * FROM dbo.TBL_EXPT_JOB_STATE_RUNLOG ORDER BY run_id DESC` about 10 minutes after step 1.4: every `error` is NULL.
- Header bell shows job-state alerts; Export > Today lists them.
- Raise a ticket with a screenshot as a normal user; open it as PDG; download the file.
