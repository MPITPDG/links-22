# Export › Sheet view — build contract (DB ⇄ API ⇄ UI)

Companion to `SHEET_VIEW_SPEC.md`. Every name here is binding for the three layers. SQL Server 2008 R2 (no JSON
functions, no TRY_CONVERT, no IIF / CONCAT / FORMAT, no SEQUENCE, no inline DECLARE init). Links API is .NET 4.5 /
C# 5 (no `$""`, no `?.`, no `nameof`), positional `DAL.ExecuteDataset`. Angular 22 NgModule app, page kit.

## 1. Column registry (WO tabs)

`key` is the DB column of `TBL_EXPT_SHEET_ROW`, the API field and the UI column key. `L` = Links-owned (section 4).
`T` = mirrored to `EXPT_JOB_TRACKING` when linked. Kinds: `text`, `num`, `date` (date-or-note), `ml` (multi-line
text), `choice` (suggested values + free entry). Widths per tab come from the workbook (layouts below).

| # | key | header | kind | L | T | default owner role |
|---|---|---|---|---|---|---|
| 1 | WO | WO | text | L | | OPS |
| 2 | PORT | Port | choice | L | | OPS |
| 3 | COUNTRY | Country | choice | L | | OPS |
| 4 | VEH | Veh | ml | | T VEHICLE_MODEL | OPS |
| 5 | QTY | Qty | num | L | | OPS |
| 6 | CONT | Cont | num | L | | OPS |
| 7 | CNTR_TYPE | Type | choice (40'HC, 20FT, 40' HC, 20'GP) | L | | OPS |
| 8 | STUFFING_DT | STUFFING DATE | date | | T STUFFING_DT | OPS |
| 9 | VSL_NAME | VSL NAME | choice | L | | BOOKING |
| 10 | DO_ETD | DO ETD | date | | T DO_ETD | OPS |
| 11 | SLINE | S/LINE | choice | L | | BOOKING |
| 12 | AGENT | Agent | choice | | | OPS |
| 13 | DO_RECEIVE_DT | DO RECEIVE DATE | date | | T DO_RECEIVE_DT | OPS |
| 14 | BOOKING_NO | BOOKING NO | text | L | | OPS |
| 15 | TRANSPORTER | TRANSPORTER | choice | | T TRANSPORTER | OPS |
| 16 | CARGO_TYPE | Type | choice (CKD, SKD, SP, PLP) | | T CARGO_TYPE | OPS |
| 17 | PLANT | Plant | choice (WA10, WA01, CH01, CK01) | | T PLANT | OPS |
| 18 | PO_NO | PO NO | text | L | | OPS |
| 19 | LC_NO | LC NO | text | | T LC_NO | OPS |
| 20 | LC_DATE | LC DATE | date | | T LC_DATE | OPS |
| 21 | HAZ | HAZ | choice (YES, NO) | | T HAZ (Y/N) | OPS |
| 22 | CONSIGNEE | CONSIGNEE | choice | L | | OPS |
| 23 | REMARK1 | REMARK 1 | ml | | T REMARK1 | ALL |
| 24 | DO_GIVEN_DT | D/O GIVEN DT | date | | T DO_GIVEN_DT | OPS |
| 25 | CONTAINER_NO | CONTAINER NO | ml | L | | OPSLEAD |
| 26 | POL_GATE | POL GATE | choice (GTI, NSFT, NSICT, NSIGT) | | T POL_GATE | OPS |
| 27 | GATE_OPEN_DT | GATE OPEN | date | | T GATE_OPEN_DT | OPS |
| 28 | GATE_CUTOFF_DT | GATE CUT OFF | date | | T GATE_CUTOFF_DT | OPS |
| 29 | SI_CUTOFF_DT | SI CUT OFF | date | | T SI_CUTOFF_DT | OPS |
| 30 | DO_ETD2 | DO ETD | date | | | OPS |
| 31 | CURRENT_ETD | CURRENT ETD | date | L | | OPS |
| 32 | ETA_DEST | ETA AT DESTINATION | date | L | | OPS |
| 33 | FINAL_VSL_SOB | FINAL VSL SOB | date | L | | OPS |
| 34 | VGM_SUBMITTED_DT | VGM SUBMITTED | date | | T VGM_SUBMITTED_DT | DOCS |
| 35 | SI_SUBMITTED_DT | SI SUBMITTED | date | | T SI_SUBMITTED_DT | DOCS |
| 36 | BL_NO | BL NO | text | L | | BLDESK |
| 37 | BL_DT | BL DT | date | L | | OPS |
| 38 | BL_HANDOVER_DT | BL HAND OVER TIME | date | | T BL_HANDOVER_DT | BLDESK |
| 39 | FF_JOB | FF JOB | text (the link) | | | BLDESK |
| 40 | SLINE_PAYMENT_STATUS | S/LINE PAYMENT STATUS | text | | T SLINE_PAYMENT_STATUS | OPS |
| 41 | CLEARANCE_POINT | CLEARANCE POINT | choice (INNSA1) | | T CLEARANCE_POINT | OPSLEAD |
| 42 | OPEN_ORDER | OPEN ORDER | choice (YES, NO) | | T OPEN_ORDER | OPSLEAD |
| 43 | BUFFER_YARD | BUFFER YARD | text | | T BUFFER_YARD | OPSLEAD |
| 44 | EDOC_STATUS | E DOC STATUS | text | L | | DOCS |
| 45 | COURIER_DT | COURIER DT | date | L | | DOCS |
| 46 | PICKUP_DT | PICK UP DT | date | | T PICKUP_DT | YARD |
| 47 | CNTR_DISPATCH_DT | CNTR DISPATCH | date | | T CNTR_DISPATCH_DT | OPS |
| 48 | CNTR_REPORT_NS_DT | CNTR REPORT NHAVA SHEVA | date | | T CNTR_REPORT_NS_DT | YARD |
| 49 | CNTR_GATEDIN_DT | CNTR GATED IN PORT | date | | T CNTR_GATEDIN_DT | YARD |
| 50 | SB_NO | SB NO | text | L | | OPSLEAD |
| 51 | SB_DT | SB DATE | date | L | | OPSLEAD |
| 52 | FOR_HBL | FOR HBL | text | L | | OPS |

Layouts: **A** = 1-52 in that order (Vipar, RK, Sri Lanka, Bangladesh, Triumph, Nigeria). **B** (Sri Lanka parts and
frames) = A without 6 CONT and without 30 DO_ETD2, and with CURRENT_ETD directly after SI_CUTOFF_DT. Roles: OPS
(Ops / Planning), BOOKING (Booking desk), OPSLEAD (Ops lead), DOCS (Documentation), BLDESK (BL desk), YARD
(Yard / CFS), ALL (everyone with edit right). ADMIN edits everything. Ownership is a **hard lock** (server enforced).

Date cells: stored as text. A real date is normalised to `dd-mm-yyyy`; ranges (`26-08/27-08`) and notes are stored
exactly as typed. "Is a date" in SQL = `LIKE '[0-3][0-9]-[01][0-9]-[12][0-9][0-9][0-9]'` and `ISDATE` under
`SET DATEFORMAT dmy`.

## 2. Tables (LinksDB20, all new)

```
TBL_EXPT_SHEET_MONTH   ID INT IDENTITY PK, CMPCODE VARCHAR(6), CITYCODE VARCHAR(3), SHEET_MONTH CHAR(7) 'YYYY-MM',
                       TITLE NVARCHAR(100), TABS NVARCHAR(MAX) (JSON array, owned by the UI/API:
                       [{"code":"VIPAR","title":"Vipar","kind":"wo","layout":"A","widths":{..},"frozenCols":1}, ...]),
                       ROWVER INT, MAKER_ID, MAKER_DT, MODIFY_ID, MODIFY_DT     UNIQUE (CMPCODE, CITYCODE, SHEET_MONTH)
TBL_EXPT_SHEET_ROW     ID INT IDENTITY PK, MONTH_ID INT FK, TAB_CODE VARCHAR(20), SORT_ORDER FLOAT,
                       STATUS_CODE VARCHAR(20) NULL (Colour CODE key), EXPTNO VARCHAR(25) NULL (link),
                       <52 registry columns> NVARCHAR(500) NULL (ml columns NVARCHAR(2000)),
                       CELL_FMT NVARCHAR(MAX) NULL (JSON {"KEY":{"bg":"#ff00ff","fg":"#305496","b":1}}),
                       ROWVER INT NOT NULL DEFAULT 1, ISDELETED BIT DEFAULT 0, MAKER_ID, MAKER_DT, MODIFY_ID, MODIFY_DT
                       IX (MONTH_ID, TAB_CODE, ISDELETED, SORT_ORDER); IX (EXPTNO); IX (MODIFY_DT)
TBL_EXPT_SHEET_GRIDROW ID INT IDENTITY PK, MONTH_ID INT, TAB_CODE VARCHAR(20) (BOOKINGS, VEHWEIGHTS, DGD, PRICE),
                       SORT_ORDER FLOAT, DATA NVARCHAR(MAX) (JSON {"A":"..","B":".."} by column letter),
                       CELL_FMT NVARCHAR(MAX), ROWVER INT, ISDELETED BIT, MAKER_*, MODIFY_*
TBL_EXPT_SHEET_TABMETA MONTH_ID, TAB_CODE, META NVARCHAR(MAX) (JSON: headers, widths, merges, frozen rows/cols), ROWVER  PK(MONTH_ID, TAB_CODE)
TBL_EXPT_SHEET_STATUS  CODE VARCHAR(20) PK, LABEL NVARCHAR(100), MEANING NVARCHAR(200), BG CHAR(7), FG CHAR(7) NULL,
                       SORT INT, ACTIVE BIT     (seed: the 10 Colour CODE rows)
TBL_EXPT_SHEET_ROLE    CODE VARCHAR(20) PK, LABEL NVARCHAR(60), SORT INT   (seed: OPS, BOOKING, OPSLEAD, DOCS, BLDESK, YARD, ALL, ADMIN)
TBL_EXPT_SHEET_ROLE_COL ROLE_CODE, COL_KEY VARCHAR(40)   PK(ROLE_CODE, COL_KEY)   (seed: the registry's owner roles)
TBL_EXPT_SHEET_ROLE_USER ROLE_CODE, USER_ID VARCHAR(50) (Links CMPID)   PK(ROLE_CODE, USER_ID)
TBL_EXPT_SHEET_ALIAS   KIND VARCHAR(20) (CONSIGNEE, AGENT, SLINE, PORT, COUNTRY, POLGATE, CLEARANCE, VESSEL),
                       SHEET_VALUE NVARCHAR(200), LINKS_CODE VARCHAR(50), LINKS_TEXT NVARCHAR(200), SOURCE VARCHAR(10)
                       ('auto' | 'admin'), CONFIRMED BIT, MODIFY_ID, MODIFY_DT     PK(KIND, SHEET_VALUE)
TBL_EXPT_SHEET_LOG     ID BIGINT IDENTITY PK, ROW_KIND CHAR(1) ('W' wo row, 'G' grid row, 'M' month/meta),
                       ROW_ID INT, COL_KEY VARCHAR(40), OLD_VALUE NVARCHAR(2000), NEW_VALUE NVARCHAR(2000),
                       ACTION VARCHAR(20) (edit, insert, delete, restore, move, link, unlink, convert, status, fmt),
                       USER_ID VARCHAR(50), USER_NAME NVARCHAR(100), LOG_DT DATETIME DEFAULT GETDATE()   IX(ROW_KIND, ROW_ID)
TBL_EXPT_SHEET_VIEW    ID INT IDENTITY, USER_ID, MONTH_ID NULL, TAB_CODE, NAME NVARCHAR(60), KIND VARCHAR(10)
                       ('layout' = widths / hidden / frozen, 'filter' = filter view), DATA NVARCHAR(MAX) JSON, MODIFY_DT
```

## 3. Procedures (`USP_EXPT_SHEET_*`)

Every write proc takes `@USER_ID VARCHAR(50), @USER_NAME NVARCHAR(100)` last and returns `Table: STATUS ('100' ok,
'101' error + STATUSTEXT, '102' conflict, '103' not found, '104' not allowed)`.

| Proc | Params | Result |
|---|---|---|
| `MONTHS` | CMPCODE, CITYCODE | Table: ID, SHEET_MONTH, TITLE, ROWVER, TABS (newest first) |
| `MONTH_IU` | ID (0 new), CMPCODE, CITYCODE, SHEET_MONTH, TITLE, TABS, ROWVER, COPY_FROM_ID (0 none), CARRY_ROWS BIT | A new month copied from another copies its TABS list, every TABMETA, and the PRICE / DGD / VEHWEIGHTS grid rows (BOOKINGS starts empty). CARRY_ROWS = 1 also copies the WO rows whose STATUS_CODE is not 'COMPLETE' (links kept). Table: STATUS + the month row |
| `LOAD` | MONTH_ID, TAB_CODE | Table: WO rows (all registry columns + ID, SORT_ORDER, STATUS_CODE, EXPTNO, CELL_FMT, ROWVER, MODIFY_ID, MODIFY_DT). Table1: live Links values for linked rows: ID + `L_<KEY>` for every L column (same expressions as `USP_EXPT_JOB_TRACKING_LIST`). Table2: server time `AS_OF` |
| `CHANGES` | MONTH_ID, TAB_CODE, SINCE DATETIME | same shape as LOAD (rows with MODIFY_DT > SINCE, incl. ISDELETED=1 so the UI can drop them) |
| `SAVE_CELLS` | MONTH_ID, TAB_CODE, EDITS XML `<e r="ID" v="ROWVER" k="KEY">value</e>...` | per edit: checks row version (conflict → collect), role ownership (not owner and not ADMIN → 104 for that cell), L-columns of linked rows with a Links value (→ 104). Applies the rest, bumps ROWVER, logs each cell, mirrors T columns of linked rows into EXPT_JOB_TRACKING (insert if missing; preserves TRACKING_STATUS / SHIPMENT_CATEGORY; dates only when they are real dates). Table: STATUS. Table1: rejected edits (ID, KEY, REASON 'conflict' / 'locked' / 'owner'). Table2: the saved rows (LOAD shape) |
| `SAVE_FMT` | EDITS XML `<f r="ID" k="KEY|*ROW" bg=".." fg=".." b="0/1" s="STATUS_CODE"/>` | cell formats and row status (`k="*ROW" s=..`) |
| `ROWS_OP` | MONTH_ID, TAB_CODE, OP ('insert', 'duplicate', 'delete', 'restore', 'move'), IDS VARCHAR(MAX) comma list, AFTER_ID INT, COUNT INT | Table: STATUS, Table1: affected rows (LOAD shape). insert = COUNT empty rows after AFTER_ID (0 = top); delete = soft delete; move = place IDS after AFTER_ID |
| `LINK` | ROW_IDS (comma), EXPTNO | EXPTNO must exist in EXPT_MASTER (same CMPCODE / CITYCODE as the month) → sets EXPTNO and FF_JOB, mirrors T columns. 103 if the job is not found |
| `UNLINK` | ROW_IDS | clears EXPTNO (FF_JOB text kept) |
| `CONVERT_DRAFT` | ROW_IDS | Table: the rows; Table1: alias lookups resolved for CONSIGNEE, AGENT, SLINE, PORT, COUNTRY, POLGATE, CLEARANCE, VESSEL (KIND, SHEET_VALUE, LINKS_CODE, LINKS_TEXT) ; Table2: candidate vessels (VSL_RTNO, PORT, VSL_NAME, ETD) for VSL_NAME |
| `CONVERT_DONE` | ROW_IDS, EXPTNO | = LINK, ACTION 'convert' in the log |
| `HISTORY` | ROW_KIND, ROW_ID | Table: log rows newest first |
| `RESTORE_VALUE` | LOG_ID | puts OLD_VALUE back (through the same checks as SAVE_CELLS) |
| `LEGEND` / `LEGEND_IU` | – / CODE, LABEL, MEANING, BG, FG, SORT, ACTIVE | Colour CODE |
| `ROLES` / `ROLES_IU` | – / ROLE_CODE, COL_KEYS (comma), USER_IDS (comma) | Table: roles; Table1: role columns; Table2: role users (+ user name from the Links user table) |
| `MY_ROLES` | USER_ID | Table: ROLE_CODE list for the user (ADMIN if the user holds it) |
| `ALIAS` / `ALIAS_IU` / `ALIAS_SEED` | – / KIND, SHEET_VALUE, LINKS_CODE, LINKS_TEXT, CONFIRMED / CMPCODE, CITYCODE | SEED fills 'auto' aliases from linked rows (sheet text ↔ the linked job's consignee code, port, country, vessel, line, vessel agent); never overwrites 'admin' rows |
| `VIEWS` / `VIEW_IU` / `VIEW_DEL` | USER_ID, TAB_CODE / ... | personal layouts and filter views |
| `GRID_LOAD` / `GRID_SAVE` / `GRID_ROWS_OP` | MONTH_ID, TAB_CODE ... | the same contract as LOAD / SAVE_CELLS / ROWS_OP for TBL_EXPT_SHEET_GRIDROW (DATA JSON merged in the API) plus TABMETA |
| `KPI` | MONTH_ID | Parts & frames: Table vessel, PARTS count (VEH LIKE '%PART%'), FRAMES count (VEH LIKE '%FRAME%'), status; Table1 totals; Table2 same for the latest stuffing date |

## 4. Links-owned live values (LOAD Table1)

For linked rows, same expressions as `USP_EXPT_JOB_TRACKING_LIST`: L_WO = EXPT_INVNO, L_PORT = EXPT_POD,
L_COUNTRY = EXPT_DESTCOUNTRY, L_QTY = EXPT_NOOFPKGS, L_CONT = container count, L_CNTR_TYPE = distinct sizes,
L_VSL_NAME = VSL_MASTER.VSL_NAME, L_SLINE = LINER_NAME (AGENT is not Links-owned: EXPT_VSLAGENT is the vessel agency, not the sheet's agent),
L_BOOKING_NO = booking carrier nos, L_PO_NO = order nos, L_CONSIGNEE = CON_NAME, L_CONTAINER_NO = container list,
L_CURRENT_ETD = VSL_PORTDTLS.ETD, L_ETA_DEST = ETAPORT2 / ETAPORT1, L_FINAL_VSL_SOB = VSL_PORTDTLS.SAILING,
L_BL_NO / L_BL_DT, L_EDOC_STATUS, L_COURIER_DT (DOCSENTDT), L_SB_NO / L_SB_DT, L_FOR_HBL = EXPT_HBLNO.
Dates as `dd-mm-yyyy`. UI rule: non-empty L value → shown, locked, tagged "Links"; empty → the sheet value, editable,
tagged "not in Links yet".

## 5. API (`Links_v5_API`, `Controllers/ExportBLL/ExportSheetController.cs`, `[RoutePrefix("api/Export/Sheet")]`)

All POST, JSON body; every body carries `CmpCode, CityCode, UserId, UserName` from the login. Responses are the procs'
DataSets (`Table`, `Table1`, …). Errors → `{ Table: [{ STATUS: "101", STATUSTEXT }] }` like the other controllers.

`Months`, `MonthSave`, `Load`, `Changes`, `SaveCells` (body `{ MonthId, TabCode, Edits: [{ RowId, RowVer, Key, Value }] }`
→ API builds the XML, escaping), `SaveFormat`, `Rows`, `Link`, `Unlink`, `ConvertDraft`, `ConvertDone`, `History`,
`RestoreValue`, `Legend`, `LegendSave`, `Roles`, `RoleSave`, `MyRoles`, `Alias`, `AliasSave`, `AliasSeed`, `Views`,
`ViewSave`, `ViewDelete`, `GridLoad`, `GridSave` (API merges `{col: value}` into DATA JSON with Newtonsoft and calls
GRID_SAVE with the whole JSON + ROWVER), `GridRows`, `TabMetaSave`, `Kpi`.

## 6. UI (`links-22/src/app/export/sheet/`)

- `sheet-grid/` — **generic spreadsheet component** `<app-sheet-grid>` (no Links knowledge):
  inputs `columns: SheetColumn[]` (`{ key, header, width, kind, choices?, frozen?, hidden?, align? }`),
  `rows: SheetRow[]` (`{ id, ver, values: {key: string}, fmt?: {key: CellFmt}, rowFmt?: { bg?, fg? }, locked?: {key: string /*reason*/}, tags?: {key: 'links'|'pending'|'flag'} }`),
  `frozenCols`, `readOnly`, `canEditCell(row, key) => true | string`;
  outputs `edits: { rowId, key, oldValue, newValue }[]` (one emission per user action: typing, paste, fill, clear, undo),
  `rowOp: { op, rowIds, afterId, count }`, `fmtChange`, `contextAction: { action, rowIds, key }`, `layoutChange`.
  Behaviour: section 3 of the spec (selection, keys, clipboard TSV with quoted multi-line cells, fill, undo / redo,
  virtual rows via CDK, frozen header + columns, resize / hide / freeze, sort, per-column filter, find, date-or-note
  parsing and `dd-mm-yyyy` normalisation, row / cell colours, lock icon + tooltip, Excel export of the visible rows).
- `sheet-view.component` — page: month picker + new month, tab bar in workbook order, the grid per tab, side panels
  (history, KPI, helper list), settings (Colour CODE, Column Access, Aliases), live polling (`Changes` every 10 s while
  visible), conflict prompts, Convert / Link / Unlink actions.
- `sheet.service.ts` — the API calls above.
- Convert: `ConsignmentPrefillService` (root) + `applyPrefill` hooks in `consg-workspace` / `consg-start` /
  `consg_main` (pattern from MPERPNG-20); on Submit success → `ConvertDone`.
- Route `/export/sheet` (lazy `SheetViewModule`, sidebar Consignment › Consignment › Sheet view, after Search), rights: new Links form ids for view / edit and
  for convert.
