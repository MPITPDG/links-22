# Export › Sheet view — build spec

Replaces the monthly Bajaj Google workbook ("Bajaj October Sheet 2026") with a page inside Links that looks and
works like it, is stored in LinksDB20, and turns a row into a normal Links export job on an admin's click.

Source of truth for this spec: the October 2026 workbook (`Bajaj October Sheet 2026 (1).xlsx`, 14 tabs), the live
July / August workbooks (read with the read-only service account on 2026-10-21), and the ticket_page dashboard.

## 1. Decisions (agreed 2026-10-21)

| Topic | Decision |
|---|---|
| Where | New sidebar entry **Consignment › Sheet view** (next to Export Master and Search), page kit like the other Export screens |
| One row | A **WO line**. It can exist before any Links job. `FF JOB` links it to a job (typed, or filled by Convert to job) |
| Links-owned columns once linked | **Links wins, read-only** as soon as Links has a value; until then the sheet's own value stays visible and editable, marked "not in Links yet" |
| Access | Links form rights like other screens: Sheet view (view / edit) per user; Convert / Link to job is a separate admin right |
| Convert defaults | Exporter BAJAJ AUTO LIMITED (`E100001`); stuffing mode and services are **chosen by the admin on every convert** (nothing pre-selected) |
| Structure | **Same tabs as the workbook + a month picker** (one "workbook" per month, no new file each month) |
| Date cells | **Date, range or note**: `14-10-2026`, `26-08/27-08`, `Will be updated` are all accepted; real dates are recognised for sorting, colours and KPIs, the rest is kept exactly as typed and marked |
| Column ownership | **Hard lock**: only the owning role (and admins) can edit a column |
| Create the job | **Convert to job** (admins): opens the normal Export Master consignment form **pre-filled** from the row; on save the export number goes back into `FF JOB` and the row is linked |
| Existing data | One-time import of the live workbook's rows and reference tabs at cut-over |
| Backend | Everything through LinksDB20 procedures and Links API actions; linked rows also keep `EXPT_JOB_TRACKING` (the 12 Oct tracking table and its APIs) current |

## 2. Tabs (in the workbook's order)

| Tab | Kind | What it does in Links |
|---|---|---|
| Colour CODE | Legend | The 10 row statuses and their colours (Shipment complete = yellow, SI filling complete = green, Booking release = cyan, HAZ = red font, Bookings to planned = pink, Booking available to release = orange, Take booking = blue, LC awaited / cargo not ready = red, Hold = amber, Unknown = violet). Admin-editable; drives the row colours on every WO tab |
| Column Access | Settings | Roles (Ops / Planning, Booking desk, Ops lead, Documentation, BL desk, Yard / CFS, Everyone, Admins), the columns each role owns, and which Links users hold each role. Enforced as a hard lock |
| Vipar, RK, Bangladesh, Triumph | WO grid, layout **A** (52 columns) | Editable grid, see section 3 |
| Sri Lanka | WO grid, layout **A** + helper list | Same grid; the right-hand helper (`UNIQUE(FILTER(type, veh, plant))`) becomes a live side list of the distinct container type / vehicle / plant combinations |
| Sri Lanka parts and frames | WO grid, layout **B** (49 columns: no Cont, one DO ETD) | Same grid; feeds the KPI tab |
| (Nigeria, others) | WO grid | Tabs are per month: a month can add or drop a country tab (October has no Nigeria) |
| Bookings Details | Grid | REF NO, BKG NO, CNTR QTY (e.g. `05X40HC`), POD, PLACE / REQUIRE BKG ON VSL, RECEIVED BKG ON VSL, ETD, ETD, LINE, VALIDITY, REMARK, USED BY WO, CANCELLED |
| DGD | Free-form sheet | Dangerous-goods reference (line, item, UN no, proper shipping name, class, packing group, packages, weights, EmS, details) |
| Vehicle wise weights | Grid | WO, Country, POD, HS code on B/L, HS code on shipping bill, VEH, QTY, Volume, Cont, Container 1-5 weight, TYPE, PLANT |
| Price | Free-form sheet | The month's buy-rate card (lines across, destinations down, merged title, frozen top 2 rows) |
| KPI Summary | Computed | "Parts and frames must not be loaded on the same vessel": violation banner, per-vessel PARTS / FRAMES counts with ✅ OK / ❌ VIOLATION, totals, and the same for the latest stuffing date ("today's KPI") |

## 3. WO grid

### Columns, layout A (October widths kept per tab)

`WO · Port · Country · Veh · Qty · Cont · Type · STUFFING DATE · VSL NAME · DO ETD · S/LINE · Agent · DO RECEIVE DATE ·
BOOKING NO · TRANSPORTER · Type · Plant · PO NO · LC NO · LC DATE · HAZ · CONSIGNEE · REMARK 1 · D/O GIVEN DT ·
CONTAINER NO · POL GATE · GATE OPEN · GATE CUT OFF · SI CUT OFF · DO ETD · CURRENT ETD · ETA AT DESTINATION ·
FINAL VSL SOB · VGM SUBMITTED · SI SUBMITTED · BL NO · BL DT · BL HAND OVER TIME · FF JOB · S/LINE PAYMENT STATUS ·
CLEARANCE POINT · OPEN ORDER · BUFFER YARD · E DOC STATUS · COURIER DT · PICK UP DT · CNTR DISPATCH ·
CNTR REPORT NHAVA SHEVA · CNTR GATED IN PORT · SB NO · SB DATE · FOR HBL`

Layout B (Sri Lanka parts and frames) is the same without `Cont` and without the second `DO ETD`.

Cell kinds: text, number (Qty, Cont), date-or-note (all date columns), multi-line text (Veh, REMARK 1, CONTAINER NO),
choice with free entry (values seen in the sheet are offered, anything else may be typed): Type (40'HC, 20FT, 40' HC),
cargo Type (CKD, SKD, SP, PLP), Plant (WA10, WA01, CH01, CK01), Agent (LINKS, MGH, BLR), S/LINE, POL GATE (GTI, NSFT,
NSICT, NSIGT), TRANSPORTER, HAZ (YES / NO), CLEARANCE POINT (INNSA1), OPEN ORDER (YES / NO).

Links-owned (read-only once `FF JOB` is linked, shown from Links): WO (shipper invoice no), Port, Country, Qty, Cont,
Type, VSL NAME, S/LINE, Agent, BOOKING NO, PO NO, CONSIGNEE, CONTAINER NO, CURRENT ETD, ETA AT DESTINATION, FINAL VSL
SOB, BL NO, BL DT, E DOC STATUS, COURIER DT, SB NO, SB DATE, FOR HBL. Every other column stays editable in the sheet.

### Behaviour (Google Sheets parity)

- Frozen header row and WO column; virtual scrolling (1,000+ rows × 52 columns stay smooth)
- Select a cell, a range (drag / Shift+click / Shift+arrows), whole rows and columns; Ctrl+A
- Keys: arrows, Tab / Shift+Tab, Enter / Shift+Enter, Home / End, Ctrl+arrows, PageUp / PageDown, type-to-edit, F2,
  Esc, Delete / Backspace clears, Alt+Enter new line in a cell
- Copy / cut / paste ranges with Excel and Google Sheets (tab-separated, quoted multi-line cells), paste over a range,
  paste that runs past the last row adds rows
- Fill down (Ctrl+D) and the drag fill handle; undo / redo (Ctrl+Z / Ctrl+Y) across edits, pastes and fills
- Insert row above / below, duplicate row, delete row (with confirmation), move rows
- Row colour = status from the Colour CODE legend (row menu); HAZ = YES turns the row font red automatically
- Column resize, hide / show, freeze more columns; remembered per user
- Sort (A→Z, Z→A, dates as dates), the transporter-first order the workbook's Apps Script applied, per-column filter
  (values list + condition), saved filter views (personal, like Data › Filter views), Ctrl+F find
- Hard-locked columns show a lock and refuse edits for users outside the owning role
- Live updates: other people's changes appear within seconds; editing a row someone else just changed shows a conflict
  prompt instead of overwriting silently
- Cell history: every change is logged (who, when, old → new); a row's history can be opened and an old value restored
- Export the tab to Excel (with colours) at any time
- Row actions (admins): **Convert to job**, **Link to job** (pick an existing export number), **Unlink**

## 4. Convert to job

Admins pick a row → **Convert to job** → the normal Export Master consignment form opens with every field it can
take filled from the row, using the form's own options (codes looked up from the sheet's text, e.g. port / country /
consignee / vessel / container type / shipping line). The admin reviews, completes anything missing, and saves through
the normal flow. The new export number is written into the row's `FF JOB`; the row becomes linked (Links-owned columns
switch to Links values) and its tracking values are copied into `EXPT_JOB_TRACKING`.

_Field-by-field mapping: section 8 (filled in from the consignment form recon)._

## 5. Data (LinksDB20, new objects only; nothing existing is altered)

| Object | Purpose |
|---|---|
| `TBL_EXPT_SHEET_MONTH` | One per company / branch / month: the month's tab list and order |
| `TBL_EXPT_SHEET_ROW` | WO tab rows: tab, month, sort order, status colour, `EXPTNO` link, version, every column as text |
| `TBL_EXPT_SHEET_BOOKING` | Bookings Details rows |
| `TBL_EXPT_SHEET_FREEFORM` | DGD, Price, Vehicle wise weights: cells, merges and formats per month (JSON) |
| `TBL_EXPT_SHEET_STATUS` | Colour CODE legend |
| `TBL_EXPT_SHEET_ROLE`, `TBL_EXPT_SHEET_ROLE_COL`, `TBL_EXPT_SHEET_ROLE_USER` | Column Access: roles, owned columns, users |
| `TBL_EXPT_SHEET_LOG` | Cell history (row, column, old, new, user, time) |
| `TBL_EXPT_SHEET_VIEW` | Per-user filter views, column widths / hidden / frozen |
| `USP_EXPT_SHEET_*` | Load a tab (rows joined to live Links values for linked rows), save a batch of cell edits with a version check, add / duplicate / delete / move rows, link / unlink / convert, changes-since, history, legend, roles, views, bookings, free-form tabs, KPI |

All deployed as `_DB_FIX` scripts with `ROLLBACK_` twins (SQL Server 2008 R2), listed in `DEPLOY_ORDER.md`.

## 6. API (Links_v5_API, `ExportSheetController`, `api/Export/Sheet/*`)

`Months`, `Load`, `Changes`, `SaveCells`, `Rows` (add / duplicate / delete / move), `Link`, `Unlink`, `ConvertDraft`
(row → consignment form values), `ConvertDone` (write the new export number back), `History`, `Legend`, `Roles`,
`Views`, `Bookings`, `FreeForm`, `Kpi`, `Export` (Excel). Lookups reuse the existing Export / Common actions.

## 7. Delivery

1. DB scripts + API actions (tested read-only against copies first, applied on approval)
2. Grid engine (selection, keys, clipboard, fill, undo, virtual scroll) + WO tabs
3. Colour CODE, Column Access lock, history, live updates, filter views, Excel export
4. Bookings Details, DGD, Vehicle wise weights, Price, KPI Summary
5. Convert to job / Link to job
6. Import of the live workbook (October onwards), side-by-side check against the Google Sheet, then cut-over

## 8. Convert-to-job field mapping

The normal form today: start step (exporter, agent, consignee, stuffing mode, vessel) → Continue → master (service
scope, packages / pieces, ports, weights, invoice, documents, order / package / ITC grids) → Submit, which calls
`Export/Exp_Mst_Export_IU` (`USP_EXP_MST_EXPORT_IU`) and returns the new export number. There is no prefill hook yet;
MPERPNG-20's `applyPrefill` pattern (start + master, driving the real change handlers, only values found in the loaded
lists) is ported for this.

| Sheet | Form | How |
|---|---|---|
| (tab) | Exporter + Bill to | `E100001` BAJAJ AUTO LIMITED (1,361 jobs this FY) |
| CONSIGNEE (VIPAR, DPMC, RUNNER…) | Consignee (+ buyer same as consignee) | alias list → `consignee_master` code |
| Agent (LINKS, MGH, BLR, CEVA…) | Agent | alias list → `supplier_master` code |
| VSL NAME + DO ETD | Vessel (`VSL_RTNO|PORT`) | match vessel name, pick the voyage whose ETD matches |
| S/LINE (ONE, CMA, MAERSK…) | Vessel agent | alias list → the master's vessel-agent list |
| Port | Port of discharge | alias list / city name match → `CITY_CODE` |
| Country | Dest. city / country | city list `CITY_COUNTRY` |
| CLEARANCE POINT (INNSA1) | Loading port | alias list → `CITY_CODE` (Nhava Sheva) |
| POL GATE (GTI, NSFT, NSICT, NSIGT) | Terminal | alias list → terminal of the loading port |
| WO | Exporter invoice no. | as is (max 20) |
| DO RECEIVE DATE | Doc recd. date (and invoice date if none) | parsed date, else today |
| Qty | No. of packages / pieces + one package range 1..Qty | as is |
| PO NO | First order line | order no. + qty |
| LC NO | Nature of payment = (LC) Letter of credit | when present |
| Veh, cargo Type, Plant, Transporter, HAZ, LC, dates, POL gate… | — (not on the form) | stay in the sheet row and go to `EXPT_JOB_TRACKING` on link |
| CONTAINER NO, Type, Cont, BOOKING NO, SB, BL, FOR HBL | — (entered later on the container / shipping-bill / BL screens) | stay visible in the sheet until Links has a value |

Not in the sheet and still required by the form (the admin fills them on review): invoice amount and currency,
gross / net weight, volume.

**Alias list** (Sheet view › settings): every nickname used in the sheet mapped to its Links code. Seeded
automatically from the rows that already carry an `FF JOB` (the job's real consignee, port, vessel, line, terminal);
admins confirm or correct; unknown values are left blank on the form for the admin to pick.

**Same WO on several rows** (split containers / bookings): converted together into one job, because Links refuses a
second job with the same invoice no. for the exporter and branch. All those rows link to the one export number.
