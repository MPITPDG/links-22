# Finance Dashboard + Job Profit — LINKS-ERP port (2026-08-27)

Ported from Manilal ERP. Target database: **Linksdb20** on `180.179.207.163,15787`
(the 1433 port is not reachable from the dev machine; 15787 is the working port —
same SQL instance that hosts manilal).

Schema parity was verified against the live Linksdb20 before porting: every table and
column the procs touch exists, including `CREDITPERIOD_SEA/_AIR`, `TDS_AMT`,
`fk_Imp_Code`/`fk_BillTo` and the `G101596/G101640` columns. `Linksdb20`'s
`USP_ACCT_RPT_JOB_PROFIT` Table 1 block is byte-identical to Manilal's, so the parties
patch applies verbatim.

## Deploy order

1. **SQL** (SSMS or sqlcmd against Linksdb20):
   - `FINANCE_DASHBOARD_SETUP.sql`   — creates + seeds TBL_MST_FIN_SERVICE_CATEGORY,
     creates USP_ACC_RPT_FINANCE_DASHBOARD
   - `FINANCE_DASHBOARD_AUDIT.sql`   — USP_ACC_RPT_FINANCE_DASHBOARD_AUDIT
   - `PAYABLE_DASHBOARD_SETUP.sql`   — USP_ACC_RPT_PAYABLE_DASHBOARD
     (includes the amount+deduction fix; bill value = pur_amount + pur_deduction)
   - `JOB_PROFIT_TABLE1_PARTIES.sql` — NOT a runnable script: open
     USP_ACCT_RPT_JOB_PROFIT in SSMS, replace the /*TABLE 1*/ SELECT with Section B,
     run the ALTER. Section C has the verification queries.

2. **API** (`Links_V5NG_API/LINKS_V8NG_API`): rebuild + deploy. Added:
   - `Utils/DashboardCache.cs` (2-hour response cache, ported)
   - `ACC_RPT_FINANCE_DASHBOARD`, `ACC_RPT_PAYABLE_DASHBOARD`,
     `ACC_RPT_FINANCE_DASHBOARD_AUDIT` in AccountsController.cs
   - csproj: reference to System.Runtime.Caching
   (`ACC_CMP_FillClient` already existed in Links — reused as-is.)

3. **Angular** (`Links_V8NG_Clinet`): upload `publish/`. Added/changed:
   - `src/app/accounts/MisReport/FinanceDashboard/` (new module, lazy route
     `/accounts/MisReport/FinanceDashboard/dashboard`, menu entry 13.10)
   - `src/app/windowpoppage/Account/singlejobno-report.*` (rebuilt Job Profit page;
     Links-specific: ASPX invoice print under /Linkserp-ac/, CN via Angular popup)

## After deploy — sanity checks

- Dashboard FY-to-date, ALL branches: check the UNCLASS share on Margin by service —
  the category seed came from Manilal's chart of accounts; add Links-specific heads
  to TBL_MST_FIN_SERVICE_CATEGORY if UNCLASS is large.
- Job Profit popup on one billed job (unchanged figures) and one unbilled job
  (Exporter / Bill-to party now show instead of a blank).
- Payables tab carries the "Under test" banner: reconcile a few suppliers against the
  Bank Payment screen before anyone relies on the figures — same exercise as Manilal.
