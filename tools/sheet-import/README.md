# Sheet view import (one-time cut-over)

`sheet_import.py` turns the Bajaj monthly Google workbook (downloaded as `.xlsx`) into one SQL script that loads
it into the Export › Sheet view tables on LinksDB20. It never connects to a database: you review the script and
run it yourself.

The generated files hold customer shipment data. Write them to a folder **outside** the repository (the tool
refuses an output folder inside a git work tree), never commit them, and delete them after the cut-over. This
folder's `.gitignore` only lets the tool and this README into git.

## Requirements

* Python 3.8 or later with openpyxl 3.x (`pip install openpyxl`).
* `src/app/export/sheet/sheet-registry.ts`, read at run time: SHEET_COLUMNS, LAYOUT_A / LAYOUT_B,
  DEFAULT_TABS, OPTIONAL_WO_TABS, GRID_TABS and TAB_WIDTHS.
* On LinksDB20, before the import runs: `_DB_FIX/EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql`, which creates the
  tables, the 10 Colour CODE statuses and the procedures.

Run it isolated (`-I`), because the workbook is untrusted input:

```
python -I -X utf8 tools/sheet-import/sheet_import.py <workbook.xlsx> --month 2026-10 --title "Bajaj October Sheet 2026" --out-dir <folder outside the repo>
python -I -X utf8 tools/sheet-import/sheet_import.py --selftest
```

| Option | Default | Meaning |
|---|---|---|
| `--month` | required | Sheet month `YYYY-MM` (`TBL_EXPT_SHEET_MONTH.SHEET_MONTH`) |
| `--title` | required | Month title, at most 100 characters |
| `--out-dir` | required | Where the files are written |
| `--cmpcode` / `--citycode` | `30` / `MUM` | The company and branch the Sheet view is used under. This is exactly what `SheetService.identity()` sends: the login's `CMPCODE` (30 = LINKS CARGO AGENCIES PVT. LTD., the company holding Bajaj's Mumbai export jobs) and `CITYCODE` |
| `--skip-tab NAME` | | Leave out one more workbook tab (repeatable) |
| `--registry PATH` | the repo's `sheet-registry.ts` | Another copy of the registry |
| `--date YYYYMMDD` | today | The date used in the file names |

Exit code 0 means the files were written. Exit code 2 means the workbook was refused: no script is written and the
report lists why.

## Output (in `--out-dir`)

| File | What it is |
|---|---|
| `IMPORT_EXPORT_SHEET_<YYYYMM>_LINKSDB20_<date>.sql` | The import, in the house style of the `_DB_FIX` scripts |
| `ROLLBACK_IMPORT_EXPORT_SHEET_<YYYYMM>_LINKSDB20_<date>.sql` | Removes exactly that import |
| `CHECK_FFJOB_EXPORT_SHEET_<YYYYMM>.sql` | Read-only check. It shows which FF JOB values match a Links job (match, other company or branch, cancelled, not found, not a job number). It also lists matches whose sheet WO is not the job's invoice number |
| `IMPORT_EXPORT_SHEET_<YYYYMM>_REPORT.txt` | What was read, mapped and skipped, and why. The same text is printed on screen |

## What it reads, and how

### Tabs

Tabs are matched by title to `DEFAULT_TABS` and `OPTIONAL_WO_TABS`. Case and spaces do not matter, so "Colour CODE " still matches.

* **Column Access** is never read. Not a single cell is opened, because the tab holds staff e-mail addresses.
* **Colour CODE** is only compared with the seeded legend. A changed colour is reported, and that colour is also accepted for the status.
* **KPI Summary** is skipped. The Sheet view computes it (USP_EXPT_SHEET_KPI).
* An empty tab that the registry does not know is skipped (October's "Sheet16").
* A non-empty tab that the registry does not know is **refused**. Add the tab to the registry, or pass `--skip-tab`.

The month's `TABS` value is `DEFAULT_TABS` in order, with these changes:

* A WO tab that is missing from the workbook is left out.
* NIGERIA is added only when the workbook has that tab, right after the WO tab that comes before it in the workbook.
* WO tabs also get `widths` (px per column key, from the workbook) and `frozenCols`.

The JSON is written in Json.NET `Formatting.None` form, like this:

```
[{"code":"VIPAR","title":"Vipar","kind":"wo","layout":"A","widths":{"WO":72,...},"frozenCols":1},...]
```

### WO tabs → `TBL_EXPT_SHEET_ROW`

**Columns.** Columns are mapped by their row-1 header text to the registry columns of the tab's layout (A, or B
for Sri Lanka parts and frames). Line breaks, spaces and case in the header are ignored. When a header repeats,
the copies are taken in order: the 1st "Type" is `CNTR_TYPE` and the 2nd is `CARGO_TYPE`, the 1st "DO ETD" is
`DO_ETD` and the 2nd is `DO_ETD2`.

* The tab is refused when a column holds values but has no header, has an unknown header, or has the header of a column that its layout lacks (for example a filled "Cont" column in layout B).
* Formula helper columns are skipped. The Sri Lanka `UNIQUE(FILTER(...))` list is shown live by the Sheet view.

**Rows.** Every row from 2 to the last filled row becomes one row, in workbook order. `SORT_ORDER` is 1024,
2048 and so on. Rows that are entirely empty are skipped and counted. Rows hidden by a Google filter are
imported, and the report counts them.

**Values.** Text is stored as typed. Two adjustments are made, exactly as the API's `XmlSafe` does for SaveCells:
CR / CRLF becomes LF, and characters XML cannot carry are dropped (these are counted).

* **Numbers** are written as Sheets shows them in General format (`6`, `301102610004227`, `1.5`). Any other number format is not applied, and the report counts the cells.
* **Real date cells** become `dd-mm-yyyy`. A date-time that has a time of day keeps it as text (`dd-mm-yyyy hh:mm`).
* **Text in date columns** follows the rule in `USP_EXPT_SHEET_SAVE_APPLY`. A real date in the form `dd-mm-yyyy`, `dd/mm/yyyy`, `dd.mm.yyyy` or `yyyy-mm-dd` is normalised to `dd-mm-yyyy`. Anything else (`26-08/27-08`, `Will be updated`, typos) is kept exactly as typed.
* **Whitespace-only cells** are left empty. **Error values** such as `#VALUE!` are kept as their text. Both are counted.
* **Merged cells.** The value stays in the top-left cell only, and the report names every merge. The other cells of the merge take the top-left cell's look.

**Lengths.** Every value is checked against its column: 2000 characters for VEH, REMARK1 and CONTAINER_NO, 500
for the rest. A value that is too long refuses the whole workbook. Nothing is ever cut.

**Status.** `STATUS_CODE` comes from the row's fill, which is the colour held by more than half of the row's
cells. White and no-fill both count as "none". Theme colours are resolved from the workbook theme. The fill must
match a Colour CODE BG exactly; there is no nearest-colour guess. A row colour that is not in the legend is
reported, the status is left empty, and the fill is kept per cell in `CELL_FMT`.

**HAZ.** HAZ follows the legend (red font, no fill):

* A row whose font is mostly red (#ff0000) and that has no fill gets the status `HAZ`.
* On rows where the HAZ column is YES / Y / HAZ, red fonts are not stored, because the Sheet view turns those rows red itself.
* October has no red-font rows.

**`CELL_FMT`.** This holds the cell looks that differ from the row's look:

* `bg` for any cell whose fill differs from the row's status colour. A white or unfilled cell in a coloured row gets `#ffffff`.
* `fg` for a font colour other than black, and `b` for bold. Both are kept only on cells that hold a value.

It is written in the one canonical form that `USP_EXPT_SHEET_SAVE_FMT` accepts:

```
{"KEY":{"bg":"#rrggbb","fg":"#rrggbb","b":1}}
```

Keys are in SQL Server `ORDER BY` order (`PO_NO` before `POL_GATE`) and colours are lower case. A row with no
such cells gets NULL.

**FF JOB.** A job-like value (1-25 letters, digits or `/._-`, trimmed) is kept as the match key. When the script
runs, the key is joined to `EXPT_MASTER.EXPTNO` of the same CMPCODE / CITYCODE where `EXPTCANCEL <> 'Y'`. A match
sets `EXPTNO`. The `FF_JOB` text always stays as it was typed.

### Grid and free-form tabs → `TBL_EXPT_SHEET_GRIDROW` + `TBL_EXPT_SHEET_TABMETA`

Tabs: BOOKINGS (Bookings Details) and VEHWEIGHTS (Vehicle wise weights) have a header row. DGD and PRICE are
free-form.

**Rows.** There is one grid row per sheet row:

* Tabs with a header row start at sheet row 2. Free-form tabs start at row 1.
* Rows run to the last filled row. Empty spacer rows in between are kept, with `DATA` NULL, so the tab keeps its layout.

**`DATA`.** This is the row's `{ "A": "...", "B": "..." }` by column letter. It holds only filled cells, as strings, in column
order. It is written exactly as the API's GridSave produces it: `JObject` + `JValue(string)`,
`ToString(Formatting.None)`, then `GuardJson`. Dates use the WO rules (the date columns come from `GRID_TABS`
kinds). A cell over 4000 characters, or a row over 200,000, refuses the workbook (these are the API's limits).

**`CELL_FMT`.** This uses the same canonical form, keyed by column letter. Fills (white counts as none) apply on
any cell. Font colours other than black, and bold, apply on filled cells only.

**`META`.** This is the tab's layout:

```
{"headerRow":true,"frozenRows":1,"frozenCols":0,"headers":{"A":"REF NO",...},"widths":{"A":64,...},"hidden":["H"],"merges":["A152:D152"]}
```

* `headers` (only for tabs with a header row) holds the workbook's header text. Where the workbook header is empty, the GRID_TABS header is used instead. Differences are reported.
* `widths` is in px (`round(width * 7 + 5)`, 64 by default).
* **`merges` row numbers count grid rows in SORT_ORDER.** Row 1 is the first GRIDROW. On tabs with a header row, the header is not counted, so sheet row 153 is grid row 152. On free-form tabs the numbers equal the sheet's.
* These are not carried: alignment / wrap, row heights, borders, and number formats. The report counts them.

## What the generated script does

| Step | What it does |
|---|---|
| 0 | Switches. `@Replace` (default 0) and `@MirrorTracking` (default 0) are kept in `#IMP_OPT` |
| 1a | Read-only. Checks the database is LinksDB20, step 0 ran, and every column the script touches exists with the type and size the values were checked against (`sys.columns`) |
| 1b | Read-only. Checks the 10 statuses are seeded (and shows any legend colour changed since), the company / branch is in CMP_ADDRESS, the month is free, and INSERT / DELETE / EXECUTE permissions. It also previews the FF JOB matches and the WO / invoice discrepancies. Any problem lists every reason, raises an error and sets `SET NOEXEC ON`, so nothing after it runs |
| 2 | Staging into `#temp` tables only. Every value is an `N''` literal with `NCHAR(n)` for line breaks and non-ASCII characters, so the file is plain ASCII and line-ending changes cannot alter data |
| 3 | Checks the staging against the expected counts per tab, then writes everything in **one transaction** (see the list below). Any error rolls all of it back |
| 4 | Read-only verify. Shows the month row, and per tab the expected and imported counts with linked rows, statuses and CELL_FMT. Then it shows grid rows and tab layouts, history entries against the expected numbers, and the FF JOB values that stayed text, with the reason |

The writes in step 3 are:

* The month row.
* The WO rows, in workbook order, with `EXPTNO` from the FF JOB join.
* Grid rows and tab layouts.
* One `TBL_EXPT_SHEET_LOG` 'insert' entry per month, WO row, grid row and tab layout.
* A last count check before the commit.

Everything is written as `MAKER_ID` / `MODIFY_ID` / `USER_ID` / `USER_NAME` = `SHEET IMPORT`. That value cannot be a
Links user id, because the API only allows `[A-Za-z0-9_.@-]`.

* `@Replace = 1` replaces the month only when it is an earlier run of this import that nobody has touched. That means every row, grid row, tab layout and the month itself are still `SHEET IMPORT`'s, there are no history entries by other users, and no personal views exist on the month. This rule is checked in 1b and again under lock in step 3.
* `@MirrorTracking = 1` does not set `EXPTNO` directly. Instead it calls `dbo.USP_EXPT_SHEET_LINK` once per matched job, with all of that job's rows, so the rows' tracking columns go into `EXPT_JOB_TRACKING` / `EXPT_JOB_TRACKING_LOG` through the same code as the Link button. Each call returns its own result sets. After each call the script checks that the rows are linked, and rolls everything back if not.

## Cut-over, step by step

1. Make sure `_DB_FIX/EXPORT_SHEET_VIEW_LINKSDB20_20261021.sql` has been applied to LinksDB20. Its `TEST_` script is optional.
2. Agree the cut-over moment with the team. Set the Google workbook to view-only for everyone but its owner. The import is a snapshot, and later edits in Google are not carried.
3. In Google Sheets, choose File › Download › Microsoft Excel (.xlsx). Save the file into a new, empty folder outside the repository, for example `C:\cutover\2026-10\`.
4. Generate the scripts:
   ```
   cd C:\development-manilal\links-22
   python -I -X utf8 tools\sheet-import\sheet_import.py "C:\cutover\2026-10\Bajaj October Sheet 2026.xlsx" --month 2026-10 --title "Bajaj October Sheet 2026" --out-dir C:\cutover\2026-10\sql
   ```
   Exit code 2 means the workbook was refused. Fix what the REFUSED list says, in the workbook or in the registry, then download and generate again.
5. Read `IMPORT_EXPORT_SHEET_202610_REPORT.txt`. Check the rows per tab, the statuses, unknown row colours, the NOTE lines (merges, helper columns, widths, headers) and the FF JOB values that are not job numbers.
6. Run `CHECK_FFJOB_EXPORT_SHEET_202610.sql` on LinksDB20. It is read-only. Correct any FF JOB typos or swaps in Google, then go back to step 3, or accept them. Unmatched values simply stay as text.
7. Open `IMPORT_EXPORT_SHEET_202610_LINKSDB20_<date>.sql` in SSMS, connected to LinksDB20. Keep `@Replace = 0`. Keep `@MirrorTracking = 0` unless the tracking mirror is wanted now. Execute the whole file. Expect these messages:
   * "Prerequisites OK on LinksDB20."
   * The FF JOB preview.
   * "Imported month 2026-10 as ID n: ...".
   * Every step-4 CHECK_RESULT `ok`.
8. Compare side by side with Google. Open Export › Consignment › Sheet view, pick 2026-10, and compare each tab's rows, colours and FF JOB links.
9. If something is wrong and nobody has edited the month yet, run `ROLLBACK_IMPORT_EXPORT_SHEET_202610_LINKSDB20_<date>.sql`, fix the cause, and go back to step 3. Alternatively, regenerate and run the import with `@Replace = 1`.
10. Go live: announce the switch, and keep the Google workbook as a read-only archive. Delete the downloaded `.xlsx` and the generated files, or move them somewhere protected.

Later months are created in the Sheet view with New month, copying from the previous month. No import is needed for
them. If another workbook ever has to be loaded, run the tool the same way with its `--month` / `--title`.

## Rollback

The `ROLLBACK_` script removes that month's WO rows, grid rows, tab layouts and history entries, and the month
itself, in one transaction.

It refuses, and changes nothing, in these cases:

* The month was not created by the import.
* Anyone has touched the month since: a row, grid row, tab layout or the month itself with a MAKER_ID / MODIFY_ID other than `SHEET IMPORT`.
* A history entry exists by another user (an edit, format change, move, link, delete or restore).
* A personal view points at the month.

`EXPT_JOB_TRACKING` changes made with `@MirrorTracking = 1` are listed, not undone.

## Self-test

`--selftest` checks these value rules:

* SQL key order, against the order LinksDB20 returns.
* The date rule, and number text.
* Json.NET escaping and GuardJson.
* XmlSafe.
* The canonical form of `CELL_FMT`.
* SQL literal encoding.
* The TS literal parser.
* Theme colours and tint.

For the October 2026 workbook these results were also checked:

* Every generated JSON text (TABS, META, DATA, CELL_FMT) round-trips byte for byte through Json.NET 6.0.4, the API's version.
* Every `CELL_FMT` passes `USP_EXPT_SHEET_SAVE_FMT`'s own canonical check, run read-only on the server, and rebuilds identically.
* The date rule gives the same result in SQL as in the tool.
* All three scripts pass a parse-only check against LinksDB20.
