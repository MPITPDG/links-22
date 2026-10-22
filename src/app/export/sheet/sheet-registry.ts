// GENERATED from the October 2026 Bajaj workbook + docs/SHEET_VIEW_CONTRACT.md section 1 (scratchpad gen_registry.py).
// Edit the generator, not this file, when the workbook layout changes.

export type SheetKind = 'text' | 'num' | 'date' | 'ml' | 'choice';
export type SheetRole = 'OPS' | 'BOOKING' | 'OPSLEAD' | 'DOCS' | 'BLDESK' | 'YARD' | 'ALL' | 'ADMIN';
export interface SheetColDef { key: string; header: string; kind: SheetKind; links: boolean; tracking?: string; owner: SheetRole; choices?: string[]; }
export type SheetTabKind = 'legend' | 'access' | 'wo' | 'grid' | 'free' | 'kpi';
export interface SheetTabDef { code: string; title: string; kind: SheetTabKind; layout?: 'A' | 'B'; helper?: boolean; }
export interface SheetGridCol { key: string; header: string; width: number; kind: SheetKind; choices?: string[]; }
export interface SheetGridTabDef { cols: SheetGridCol[]; frozenRows: number; headerRow: boolean; merges?: string[]; }

/** The 52 WO-tab columns, layout A order. links = Links-owned (locked once the linked job has a value); tracking = EXPT_JOB_TRACKING column it mirrors to. */
export const SHEET_COLUMNS: SheetColDef[] = [
    {"key": "WO", "header": "WO", "kind": "text", "links": true, "owner": "OPS"},
    {"key": "PORT", "header": "Port", "kind": "choice", "links": true, "owner": "OPS", "choices": ["CHATTOGRAM", "COLOMBO", "YANGON", "LUANDA", "BEIRA PORT", "TAMATAVE", "CAI MEP", "SIHANOUKVILLE", "TOKYO", "SOUTHAMTON", "Laem Chabang", "Beira", "DJIBOUTI", "LOS ANGELES", "MANAUS", "DKI Jakarta", "CASABLANCA", "MELBOURNE"]},
    {"key": "COUNTRY", "header": "Country", "kind": "choice", "links": true, "owner": "OPS", "choices": ["Bangladesh", "Sri Lanka", "Myanmar", "Angola", "Mozambique", "Madagascar", "CAMBODIA", "Japan", "United Kingdom", "Zimbabwe", "Thailand", "Ethiopia", "USA", "Brazil", "Indonesia", "Zambia", "Morocco", "Djibouti", "Australia"]},
    {"key": "VEH", "header": "Veh", "kind": "ml", "links": false, "owner": "OPS", "tracking": "VEHICLE_MODEL"},
    {"key": "QTY", "header": "Qty", "kind": "num", "links": true, "owner": "OPS"},
    {"key": "CONT", "header": "Cont", "kind": "num", "links": true, "owner": "OPS"},
    {"key": "CNTR_TYPE", "header": "Type", "kind": "choice", "links": true, "owner": "OPS", "choices": ["40'HC", "20FT", "40' HC", "20'GP", "40HC"]},
    {"key": "STUFFING_DT", "header": "STUFFING DATE", "kind": "date", "links": false, "owner": "OPS", "tracking": "STUFFING_DT"},
    {"key": "VSL_NAME", "header": "VSL NAME", "kind": "choice", "links": true, "owner": "BOOKING", "choices": ["ONE THESEUS 0103E", "NORTHERN PRACTISE 51E", "EVER LYRIC 077E", "RUBY TOWER 006E", "YM UNANIMITY 087E", "APL HOLLAND 644W", "BANGKOK BRIDGE 0518E", "ADONIS KMB060S19", "CMA CGM NILE IDM0C0W19", "CMA CGM AQUILA EPC0A0W19", "EVER EXCEL V-195E", "EVER ETHIC 186E", "WAN HAI 517 E105", "EF EMMA KMB020S19", "CMA CGM LA SCALA MDX080W19", "XIN LOS ANGELES 182E", "DP WORLD JEDDAH 014E", "APL GWANGYANG 0P52BN1MA", "SEASPAN BRISBANE 025E", "NYK CONSTELLATION 0113E", "EVER EXCEL 195E", "APL BARCELONA EPC0E0W19", "GULF BARAKAH 643S", "CMA CGM MAUPASSANT IDM0G0W19", "SAN FRANCISCO BRIDGE 087E", "REN JIAN 26 642S", "ONE THESEUS V-0103E", "EVER LYRIC V-077E", "X-PRESS PYXIS V-26006E", "NORTHERN PRACTISE V-51E"]},
    {"key": "DO_ETD", "header": "DO ETD", "kind": "date", "links": false, "owner": "OPS", "tracking": "DO_ETD"},
    {"key": "SLINE", "header": "S/LINE", "kind": "choice", "links": true, "owner": "BOOKING", "choices": ["EVERGREEN", "ONE", "CMA", "MAERSK", "SINO", "COSCO", "ANL"]},
    {"key": "AGENT", "header": "Agent", "kind": "choice", "links": false, "owner": "OPS", "choices": ["LINKS", "VAARIDHI", "MGH", "BHATIA", "IXNT", "BLR", "CHR", "SARJAK", "UPS", "INEXT", "VARIDHI", "CEVA", "Kuehne Nagel"]},
    {"key": "DO_RECEIVE_DT", "header": "DO RECEIVE DATE", "kind": "date", "links": false, "owner": "OPS", "tracking": "DO_RECEIVE_DT"},
    {"key": "BOOKING_NO", "header": "BOOKING NO", "kind": "text", "links": true, "owner": "OPS"},
    {"key": "TRANSPORTER", "header": "TRANSPORTER", "kind": "choice", "links": false, "owner": "OPS", "tracking": "TRANSPORTER", "choices": ["JAYSHREE", "SATISH", "OMKAR", "RDR", "ASHWINI"]},
    {"key": "CARGO_TYPE", "header": "Type", "kind": "choice", "links": false, "owner": "OPS", "tracking": "CARGO_TYPE", "choices": ["CKD", "SKD", "SP", "PLP", "CBU"]},
    {"key": "PLANT", "header": "Plant", "kind": "choice", "links": false, "owner": "OPS", "tracking": "PLANT", "choices": ["WA10", "WA01", "CH01", "CK01"]},
    {"key": "PO_NO", "header": "PO NO", "kind": "text", "links": true, "owner": "OPS"},
    {"key": "LC_NO", "header": "LC NO", "kind": "text", "links": false, "owner": "OPS", "tracking": "LC_NO"},
    {"key": "LC_DATE", "header": "LC DATE", "kind": "date", "links": false, "owner": "OPS", "tracking": "LC_DATE"},
    {"key": "HAZ", "header": "HAZ", "kind": "choice", "links": false, "owner": "OPS", "tracking": "HAZ", "choices": ["YES", "NO", "HAZ"]},
    {"key": "CONSIGNEE", "header": "CONSIGNEE", "kind": "choice", "links": true, "owner": "OPS", "choices": ["VIPAR", "DPMC", "TRIUMPH", "UGC", "RUNNER", "HASSAN TRADING", "RK GLOBAL"]},
    {"key": "REMARK1", "header": "REMARK 1", "kind": "ml", "links": false, "owner": "ALL", "tracking": "REMARK1"},
    {"key": "DO_GIVEN_DT", "header": "D/O GIVEN DT", "kind": "date", "links": false, "owner": "OPS", "tracking": "DO_GIVEN_DT"},
    {"key": "CONTAINER_NO", "header": "CONTAINER NO", "kind": "ml", "links": true, "owner": "OPSLEAD"},
    {"key": "POL_GATE", "header": "POL GATE", "kind": "choice", "links": false, "owner": "OPS", "tracking": "POL_GATE", "choices": ["GTI", "NSFT", "NSICT", "NSIGT", "BMCT"]},
    {"key": "GATE_OPEN_DT", "header": "GATE OPEN", "kind": "date", "links": false, "owner": "OPS", "tracking": "GATE_OPEN_DT"},
    {"key": "GATE_CUTOFF_DT", "header": "GATE CUT OFF", "kind": "date", "links": false, "owner": "OPS", "tracking": "GATE_CUTOFF_DT"},
    {"key": "SI_CUTOFF_DT", "header": "SI CUT OFF", "kind": "date", "links": false, "owner": "OPS", "tracking": "SI_CUTOFF_DT"},
    {"key": "DO_ETD2", "header": "DO ETD", "kind": "date", "links": false, "owner": "OPS"},
    {"key": "CURRENT_ETD", "header": "CURRENT ETD", "kind": "date", "links": true, "owner": "OPS"},
    {"key": "ETA_DEST", "header": "ETA AT DESTINATION", "kind": "date", "links": true, "owner": "OPS"},
    {"key": "FINAL_VSL_SOB", "header": "FINAL VSL SOB", "kind": "date", "links": true, "owner": "OPS"},
    {"key": "VGM_SUBMITTED_DT", "header": "VGM SUBMITTED", "kind": "date", "links": false, "owner": "DOCS", "tracking": "VGM_SUBMITTED_DT"},
    {"key": "SI_SUBMITTED_DT", "header": "SI SUBMITTED", "kind": "date", "links": false, "owner": "DOCS", "tracking": "SI_SUBMITTED_DT"},
    {"key": "BL_NO", "header": "BL NO", "kind": "text", "links": true, "owner": "BLDESK"},
    {"key": "BL_DT", "header": "BL DT", "kind": "date", "links": true, "owner": "OPS"},
    {"key": "BL_HANDOVER_DT", "header": "BL HAND OVER TIME", "kind": "date", "links": false, "owner": "BLDESK", "tracking": "BL_HANDOVER_DT"},
    {"key": "FF_JOB", "header": "FF JOB", "kind": "text", "links": false, "owner": "BLDESK"},
    {"key": "SLINE_PAYMENT_STATUS", "header": "S/LINE PAYMENT STATUS", "kind": "text", "links": false, "owner": "OPS", "tracking": "SLINE_PAYMENT_STATUS"},
    {"key": "CLEARANCE_POINT", "header": "CLEARANCE POINT", "kind": "choice", "links": false, "owner": "OPSLEAD", "tracking": "CLEARANCE_POINT", "choices": ["INNSA1"]},
    {"key": "OPEN_ORDER", "header": "OPEN ORDER", "kind": "choice", "links": false, "owner": "OPSLEAD", "tracking": "OPEN_ORDER", "choices": ["YES", "NO"]},
    {"key": "BUFFER_YARD", "header": "BUFFER YARD", "kind": "text", "links": false, "owner": "OPSLEAD", "tracking": "BUFFER_YARD"},
    {"key": "EDOC_STATUS", "header": "E DOC STATUS", "kind": "text", "links": true, "owner": "DOCS"},
    {"key": "COURIER_DT", "header": "COURIER DT", "kind": "date", "links": true, "owner": "DOCS"},
    {"key": "PICKUP_DT", "header": "PICK UP DT", "kind": "date", "links": false, "owner": "YARD", "tracking": "PICKUP_DT"},
    {"key": "CNTR_DISPATCH_DT", "header": "CNTR DISPATCH", "kind": "date", "links": false, "owner": "OPS", "tracking": "CNTR_DISPATCH_DT"},
    {"key": "CNTR_REPORT_NS_DT", "header": "CNTR REPORT NHAVA SHEVA", "kind": "date", "links": false, "owner": "YARD", "tracking": "CNTR_REPORT_NS_DT"},
    {"key": "CNTR_GATEDIN_DT", "header": "CNTR GATED IN PORT", "kind": "date", "links": false, "owner": "YARD", "tracking": "CNTR_GATEDIN_DT"},
    {"key": "SB_NO", "header": "SB NO", "kind": "text", "links": true, "owner": "OPSLEAD"},
    {"key": "SB_DT", "header": "SB DATE", "kind": "date", "links": true, "owner": "OPSLEAD"},
    {"key": "FOR_HBL", "header": "FOR HBL", "kind": "text", "links": true, "owner": "OPS"},
];

export const LAYOUT_A: string[] = ["WO", "PORT", "COUNTRY", "VEH", "QTY", "CONT", "CNTR_TYPE", "STUFFING_DT", "VSL_NAME", "DO_ETD", "SLINE", "AGENT", "DO_RECEIVE_DT", "BOOKING_NO", "TRANSPORTER", "CARGO_TYPE", "PLANT", "PO_NO", "LC_NO", "LC_DATE", "HAZ", "CONSIGNEE", "REMARK1", "DO_GIVEN_DT", "CONTAINER_NO", "POL_GATE", "GATE_OPEN_DT", "GATE_CUTOFF_DT", "SI_CUTOFF_DT", "DO_ETD2", "CURRENT_ETD", "ETA_DEST", "FINAL_VSL_SOB", "VGM_SUBMITTED_DT", "SI_SUBMITTED_DT", "BL_NO", "BL_DT", "BL_HANDOVER_DT", "FF_JOB", "SLINE_PAYMENT_STATUS", "CLEARANCE_POINT", "OPEN_ORDER", "BUFFER_YARD", "EDOC_STATUS", "COURIER_DT", "PICKUP_DT", "CNTR_DISPATCH_DT", "CNTR_REPORT_NS_DT", "CNTR_GATEDIN_DT", "SB_NO", "SB_DT", "FOR_HBL"];
/** Sri Lanka parts and frames: no Cont, no second DO ETD. */
export const LAYOUT_B: string[] = ["WO", "PORT", "COUNTRY", "VEH", "QTY", "CNTR_TYPE", "STUFFING_DT", "VSL_NAME", "DO_ETD", "SLINE", "AGENT", "DO_RECEIVE_DT", "BOOKING_NO", "TRANSPORTER", "CARGO_TYPE", "PLANT", "PO_NO", "LC_NO", "LC_DATE", "HAZ", "CONSIGNEE", "REMARK1", "DO_GIVEN_DT", "CONTAINER_NO", "POL_GATE", "GATE_OPEN_DT", "GATE_CUTOFF_DT", "SI_CUTOFF_DT", "CURRENT_ETD", "ETA_DEST", "FINAL_VSL_SOB", "VGM_SUBMITTED_DT", "SI_SUBMITTED_DT", "BL_NO", "BL_DT", "BL_HANDOVER_DT", "FF_JOB", "SLINE_PAYMENT_STATUS", "CLEARANCE_POINT", "OPEN_ORDER", "BUFFER_YARD", "EDOC_STATUS", "COURIER_DT", "PICKUP_DT", "CNTR_DISPATCH_DT", "CNTR_REPORT_NS_DT", "CNTR_GATEDIN_DT", "SB_NO", "SB_DT", "FOR_HBL"];

/** Column widths in px per WO tab, from the October workbook. */
export const TAB_WIDTHS: { [tab: string]: { [key: string]: number } } = {
    VIPAR: {"WO": 72, "PORT": 93, "COUNTRY": 96, "VEH": 113, "QTY": 39, "CONT": 37, "CNTR_TYPE": 46, "STUFFING_DT": 67, "VSL_NAME": 176, "DO_ETD": 76, "SLINE": 54, "AGENT": 55, "DO_RECEIVE_DT": 85, "BOOKING_NO": 86, "TRANSPORTER": 74, "CARGO_TYPE": 40, "PLANT": 41, "PO_NO": 88, "LC_NO": 102, "LC_DATE": 68, "HAZ": 32, "CONSIGNEE": 55, "REMARK1": 109, "DO_GIVEN_DT": 67, "CONTAINER_NO": 230, "POL_GATE": 53, "GATE_OPEN_DT": 67, "GATE_CUTOFF_DT": 67, "SI_CUTOFF_DT": 64, "DO_ETD2": 64, "CURRENT_ETD": 64, "ETA_DEST": 96, "FINAL_VSL_SOB": 67, "VGM_SUBMITTED_DT": 72, "SI_SUBMITTED_DT": 64, "BL_NO": 135, "BL_DT": 76, "BL_HANDOVER_DT": 78, "FF_JOB": 120, "SLINE_PAYMENT_STATUS": 156, "CLEARANCE_POINT": 69, "OPEN_ORDER": 48, "BUFFER_YARD": 78, "EDOC_STATUS": 50, "COURIER_DT": 72, "PICKUP_DT": 71, "CNTR_DISPATCH_DT": 67, "CNTR_REPORT_NS_DT": 83, "CNTR_GATEDIN_DT": 74, "SB_NO": 62, "SB_DT": 67, "FOR_HBL": 53},
    RK: {"WO": 64, "PORT": 95, "COUNTRY": 57, "VEH": 64, "QTY": 50, "CONT": 34, "CNTR_TYPE": 53, "STUFFING_DT": 64, "VSL_NAME": 135, "DO_ETD": 64, "SLINE": 53, "AGENT": 60, "DO_RECEIVE_DT": 64, "BOOKING_NO": 64, "TRANSPORTER": 88, "CARGO_TYPE": 47, "PLANT": 46, "PO_NO": 64, "LC_NO": 64, "LC_DATE": 64, "HAZ": 41, "CONSIGNEE": 64, "REMARK1": 64, "DO_GIVEN_DT": 72, "CONTAINER_NO": 232, "POL_GATE": 50, "GATE_OPEN_DT": 64, "GATE_CUTOFF_DT": 72, "SI_CUTOFF_DT": 75, "DO_ETD2": 72, "CURRENT_ETD": 69, "ETA_DEST": 64, "FINAL_VSL_SOB": 71, "VGM_SUBMITTED_DT": 74, "SI_SUBMITTED_DT": 76, "BL_NO": 64, "BL_DT": 74, "BL_HANDOVER_DT": 64, "FF_JOB": 116, "SLINE_PAYMENT_STATUS": 219, "CLEARANCE_POINT": 64, "OPEN_ORDER": 64, "BUFFER_YARD": 64, "EDOC_STATUS": 64, "COURIER_DT": 64, "PICKUP_DT": 64, "CNTR_DISPATCH_DT": 64, "CNTR_REPORT_NS_DT": 64, "CNTR_GATEDIN_DT": 64, "SB_NO": 64, "SB_DT": 64, "FOR_HBL": 64},
    SRILANKA: {"WO": 72, "PORT": 64, "COUNTRY": 75, "VEH": 135, "QTY": 44, "CONT": 39, "CNTR_TYPE": 60, "STUFFING_DT": 64, "VSL_NAME": 146, "DO_ETD": 81, "SLINE": 86, "AGENT": 53, "DO_RECEIVE_DT": 72, "BOOKING_NO": 110, "TRANSPORTER": 78, "CARGO_TYPE": 44, "PLANT": 50, "PO_NO": 114, "LC_NO": 64, "LC_DATE": 64, "HAZ": 46, "CONSIGNEE": 68, "REMARK1": 149, "DO_GIVEN_DT": 64, "CONTAINER_NO": 223, "POL_GATE": 65, "GATE_OPEN_DT": 64, "GATE_CUTOFF_DT": 64, "SI_CUTOFF_DT": 64, "DO_ETD2": 64, "CURRENT_ETD": 64, "ETA_DEST": 64, "FINAL_VSL_SOB": 64, "VGM_SUBMITTED_DT": 64, "SI_SUBMITTED_DT": 64, "BL_NO": 144, "BL_DT": 64, "BL_HANDOVER_DT": 64, "FF_JOB": 138, "SLINE_PAYMENT_STATUS": 176, "CLEARANCE_POINT": 69, "OPEN_ORDER": 51, "BUFFER_YARD": 64, "EDOC_STATUS": 64, "COURIER_DT": 64, "PICKUP_DT": 64, "CNTR_DISPATCH_DT": 64, "CNTR_REPORT_NS_DT": 64, "CNTR_GATEDIN_DT": 64, "SB_NO": 71, "SB_DT": 79, "FOR_HBL": 64},
    SLPF: {"WO": 69, "PORT": 68, "COUNTRY": 71, "VEH": 174, "QTY": 36, "CNTR_TYPE": 43, "STUFFING_DT": 81, "VSL_NAME": 174, "DO_ETD": 76, "SLINE": 69, "AGENT": 60, "DO_RECEIVE_DT": 69, "BOOKING_NO": 110, "TRANSPORTER": 69, "CARGO_TYPE": 46, "PLANT": 48, "PO_NO": 103, "LC_NO": 111, "LC_DATE": 64, "HAZ": 44, "CONSIGNEE": 68, "REMARK1": 110, "DO_GIVEN_DT": 74, "CONTAINER_NO": 221, "POL_GATE": 54, "GATE_OPEN_DT": 83, "GATE_CUTOFF_DT": 64, "SI_CUTOFF_DT": 64, "CURRENT_ETD": 64, "ETA_DEST": 64, "FINAL_VSL_SOB": 64, "VGM_SUBMITTED_DT": 64, "SI_SUBMITTED_DT": 64, "BL_NO": 139, "BL_DT": 64, "BL_HANDOVER_DT": 79, "FF_JOB": 138, "SLINE_PAYMENT_STATUS": 174, "CLEARANCE_POINT": 68, "OPEN_ORDER": 55, "BUFFER_YARD": 64, "EDOC_STATUS": 64, "COURIER_DT": 64, "PICKUP_DT": 64, "CNTR_DISPATCH_DT": 64, "CNTR_REPORT_NS_DT": 64, "CNTR_GATEDIN_DT": 64, "SB_NO": 74, "SB_DT": 64, "FOR_HBL": 64},
    BANGLADESH: {"WO": 75, "PORT": 64, "COUNTRY": 64, "VEH": 145, "QTY": 41, "CONT": 64, "CNTR_TYPE": 55, "STUFFING_DT": 78, "VSL_NAME": 156, "DO_ETD": 95, "SLINE": 69, "AGENT": 64, "DO_RECEIVE_DT": 83, "BOOKING_NO": 109, "TRANSPORTER": 83, "CARGO_TYPE": 48, "PLANT": 53, "PO_NO": 69, "LC_NO": 106, "LC_DATE": 85, "HAZ": 41, "CONSIGNEE": 67, "REMARK1": 64, "DO_GIVEN_DT": 74, "CONTAINER_NO": 180, "POL_GATE": 64, "GATE_OPEN_DT": 81, "GATE_CUTOFF_DT": 88, "SI_CUTOFF_DT": 81, "DO_ETD2": 78, "CURRENT_ETD": 64, "ETA_DEST": 64, "FINAL_VSL_SOB": 64, "VGM_SUBMITTED_DT": 64, "SI_SUBMITTED_DT": 64, "BL_NO": 100, "BL_DT": 64, "BL_HANDOVER_DT": 64, "FF_JOB": 160, "SLINE_PAYMENT_STATUS": 179, "CLEARANCE_POINT": 74, "OPEN_ORDER": 62, "BUFFER_YARD": 64, "EDOC_STATUS": 64, "COURIER_DT": 64, "PICKUP_DT": 64, "CNTR_DISPATCH_DT": 64, "CNTR_REPORT_NS_DT": 64, "CNTR_GATEDIN_DT": 64, "SB_NO": 79, "SB_DT": 83, "FOR_HBL": 64},
    TRIUMPH: {"WO": 81, "PORT": 92, "COUNTRY": 64, "VEH": 144, "QTY": 39, "CONT": 48, "CNTR_TYPE": 50, "STUFFING_DT": 67, "VSL_NAME": 222, "DO_ETD": 95, "SLINE": 60, "AGENT": 58, "DO_RECEIVE_DT": 76, "BOOKING_NO": 117, "TRANSPORTER": 76, "CARGO_TYPE": 46, "PLANT": 50, "PO_NO": 75, "LC_NO": 60, "LC_DATE": 67, "HAZ": 53, "CONSIGNEE": 81, "REMARK1": 100, "DO_GIVEN_DT": 71, "CONTAINER_NO": 128, "POL_GATE": 53, "GATE_OPEN_DT": 74, "GATE_CUTOFF_DT": 78, "SI_CUTOFF_DT": 78, "DO_ETD2": 72, "CURRENT_ETD": 64, "ETA_DEST": 82, "FINAL_VSL_SOB": 76, "VGM_SUBMITTED_DT": 79, "SI_SUBMITTED_DT": 64, "BL_NO": 138, "BL_DT": 64, "BL_HANDOVER_DT": 64, "FF_JOB": 142, "SLINE_PAYMENT_STATUS": 159, "CLEARANCE_POINT": 74, "OPEN_ORDER": 55, "BUFFER_YARD": 64, "EDOC_STATUS": 64, "COURIER_DT": 64, "PICKUP_DT": 74, "CNTR_DISPATCH_DT": 75, "CNTR_REPORT_NS_DT": 83, "CNTR_GATEDIN_DT": 76, "SB_NO": 60, "SB_DT": 78, "FOR_HBL": 64},
};

/** The workbook tabs, in the workbook order (Sheet16 was empty and is left out; Nigeria returns when a month has it). */
export const DEFAULT_TABS: SheetTabDef[] = [
    {"code": "COLOUR", "title": "Colour CODE", "kind": "legend"},
    {"code": "ACCESS", "title": "Column Access", "kind": "access"},
    {"code": "VIPAR", "title": "Vipar", "kind": "wo", "layout": "A"},
    {"code": "RK", "title": "RK", "kind": "wo", "layout": "A"},
    {"code": "SRILANKA", "title": "Sri Lanka", "kind": "wo", "layout": "A", "helper": true},
    {"code": "SLPF", "title": "Sri Lanka parts and frames", "kind": "wo", "layout": "B"},
    {"code": "BANGLADESH", "title": "Bangladesh", "kind": "wo", "layout": "A"},
    {"code": "TRIUMPH", "title": "Triumph", "kind": "wo", "layout": "A"},
    {"code": "BOOKINGS", "title": "Bookings Details", "kind": "grid"},
    {"code": "DGD", "title": "DGD", "kind": "free"},
    {"code": "VEHWEIGHTS", "title": "Vehicle wise weights", "kind": "grid"},
    {"code": "PRICE", "title": "Price", "kind": "free"},
    {"code": "KPI", "title": "KPI Summary", "kind": "kpi"},
];

/** A WO tab that a month may add (same layout A). */
export const OPTIONAL_WO_TABS: SheetTabDef[] = [{ code: 'NIGERIA', title: 'Nigeria', kind: 'wo', layout: 'A' }];

/** Non-WO grid tabs. BOOKINGS / VEHWEIGHTS have a header row; DGD / PRICE are free-form (cells only, letters as columns). */
export const GRID_TABS: { [code: string]: SheetGridTabDef } = {
    BOOKINGS: { headerRow: true, frozenRows: 1, cols: [{"key": "A", "header": "REF NO", "width": 64, "kind": "text"}, {"key": "B", "header": "BKG NO", "width": 106, "kind": "text"}, {"key": "C", "header": "CNTR QTY", "width": 64, "kind": "text"}, {"key": "D", "header": "POD", "width": 138, "kind": "text"}, {"key": "E", "header": "PLACE /REQUIRE BKG ON VSL", "width": 152, "kind": "text"}, {"key": "F", "header": "RECEIVED BKG ON VSL", "width": 146, "kind": "text"}, {"key": "G", "header": "ETD", "width": 75, "kind": "date"}, {"key": "H", "header": "ETD", "width": 76, "kind": "date"}, {"key": "I", "header": "LINE", "width": 88, "kind": "choice", "choices": ["ONE", "EVERGREEN", "SINO", "SAMSARA", "MAERSK", "CMA", "COSCO", "ANL"]}, {"key": "J", "header": "VALIDITY", "width": 75, "kind": "date"}, {"key": "K", "header": "REMARK", "width": 107, "kind": "choice", "choices": ["HAZ", "USED", "ANNIE"]}, {"key": "L", "header": "USED BY WO", "width": 64, "kind": "text"}, {"key": "M", "header": "CANCELLED", "width": 64, "kind": "choice", "choices": ["CANCELLED"]}] },
    VEHWEIGHTS: { headerRow: true, frozenRows: 0, cols: [{"key": "A", "header": "wo", "width": 64, "kind": "text"}, {"key": "B", "header": "Country", "width": 64, "kind": "text"}, {"key": "C", "header": "POD", "width": 64, "kind": "text"}, {"key": "D", "header": "HSCODE on B/L", "width": 132, "kind": "text"}, {"key": "E", "header": "HSCODE on Shipping Bill", "width": 167, "kind": "text"}, {"key": "F", "header": "VEH", "width": 64, "kind": "text"}, {"key": "G", "header": "QTY", "width": 64, "kind": "num"}, {"key": "H", "header": "Volume", "width": 64, "kind": "num"}, {"key": "I", "header": "Cont", "width": 64, "kind": "text"}, {"key": "J", "header": "Container 1", "width": 64, "kind": "num"}, {"key": "K", "header": "Container 2", "width": 64, "kind": "num"}, {"key": "L", "header": "Container 3", "width": 64, "kind": "num"}, {"key": "M", "header": "Container 4", "width": 64, "kind": "num"}, {"key": "N", "header": "Container 5", "width": 64, "kind": "num"}, {"key": "O", "header": "TYPE", "width": 64, "kind": "text"}, {"key": "P", "header": "PLANT", "width": 64, "kind": "text"}] },
    DGD: { headerRow: false, frozenRows: 0, cols: [{"key": "A", "header": "", "width": 305, "kind": "ml"}, {"key": "B", "header": "", "width": 64, "kind": "ml"}, {"key": "C", "header": "", "width": 149, "kind": "ml"}, {"key": "D", "header": "", "width": 64, "kind": "ml"}, {"key": "E", "header": "", "width": 253, "kind": "ml"}, {"key": "F", "header": "", "width": 114, "kind": "ml"}, {"key": "G", "header": "", "width": 64, "kind": "ml"}, {"key": "H", "header": "", "width": 64, "kind": "ml"}, {"key": "I", "header": "", "width": 64, "kind": "ml"}, {"key": "J", "header": "", "width": 92, "kind": "ml"}] },
    PRICE: { headerRow: false, frozenRows: 2, merges: ['A1:G1', 'H1:N1'], cols: [{"key": "A", "header": "", "width": 64, "kind": "ml"}, {"key": "B", "header": "", "width": 64, "kind": "ml"}, {"key": "C", "header": "", "width": 361, "kind": "ml"}, {"key": "D", "header": "", "width": 194, "kind": "ml"}, {"key": "E", "header": "", "width": 214, "kind": "ml"}, {"key": "F", "header": "", "width": 172, "kind": "ml"}, {"key": "G", "header": "", "width": 151, "kind": "ml"}, {"key": "H", "header": "", "width": 93, "kind": "ml"}, {"key": "I", "header": "", "width": 64, "kind": "ml"}, {"key": "J", "header": "", "width": 64, "kind": "ml"}, {"key": "K", "header": "", "width": 110, "kind": "ml"}, {"key": "L", "header": "", "width": 93, "kind": "ml"}, {"key": "M", "header": "", "width": 64, "kind": "ml"}, {"key": "N", "header": "", "width": 64, "kind": "ml"}, {"key": "O", "header": "", "width": 64, "kind": "ml"}, {"key": "P", "header": "", "width": 64, "kind": "ml"}, {"key": "Q", "header": "", "width": 64, "kind": "ml"}, {"key": "R", "header": "", "width": 64, "kind": "ml"}, {"key": "S", "header": "", "width": 64, "kind": "ml"}] },
};

export const COL_BY_KEY: { [key: string]: SheetColDef } = {};
SHEET_COLUMNS.forEach(c => COL_BY_KEY[c.key] = c);

export function layoutKeys(layout: 'A' | 'B' | undefined): string[] { return layout === 'B' ? LAYOUT_B : LAYOUT_A; }
