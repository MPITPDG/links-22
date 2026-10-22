/**
 * Export › Sheet view › Convert to job: turns the selected sheet rows (one WO, possibly several rows) plus the
 * server's ConvertDraft answer (aliases resolved to Links codes, candidate vessels) into the pre-fill payload the
 * normal Export Master form takes (ConsignmentPrefillService, docs/SHEET_VIEW_SPEC.md section 8).
 * Nothing is chosen for the admin that the decisions say they choose: stuffing mode and services stay empty.
 */

export const BAJAJ_EXPORTER = 'E100001';   // BAJAJ AUTO LIMITED (1,361 jobs this FY on LinksDB20)

export interface ConvertAlias { KIND: string; SHEET_VALUE: string; LINKS_CODE: string; LINKS_TEXT: string; }
export interface ConvertVessel { VSL_RTNO: string; PORT: string; VSL_NAME: string; ETD: string; }

export interface SheetPrefill {
    source: { kind: 'sheet'; rowIds: number[]; monthId: number; tabCode: string; returnUrl: string };
    start: { exporterCode: string; billToCode?: string; consigneeCode?: string; buyerSameAsConsignee: boolean; agentCode?: string;
             subAgentCode?: string; vesselValue?: string; stuffingMode?: 1 | 2 | 3 | null };
    main: { services?: { exwork?: boolean; customclr?: boolean; freightfrd?: boolean }; noOfPackages?: number; typeOfPackages?: string;
            noOfPieces?: number; typeOfPieces?: string; loadingPortCode?: string; terminalId?: string; podCode?: string; destCityCode?: string;
            docRecdDate?: string; invoiceNo?: string; invoiceDate?: string; natureOfPayment?: string; goodsRemark?: string; marks?: string;
            vesselAgentCode?: string; orders?: { orderNo: string; pieces: number; packages?: number }[]; packageRange?: { from: number; to: number } };
    notes: string[];
}

const s = (v: any) => String(v ?? '').trim();
const n = (v: any) => { const x = parseFloat(s(v).replace(/,/g, '')); return isFinite(x) ? x : 0; };

/** dd-mm-yyyy (the sheet's normalised date) -> Date, or null for ranges / notes. */
export function sheetDate(v: string): Date | null {
    const m = /^([0-3]\d)-([01]\d)-(\d{4})$/.exec(s(v));
    if (!m) { return null; }
    const d = new Date(+m[3], +m[2] - 1, +m[1]);
    return d.getDate() === +m[1] && d.getMonth() === +m[2] - 1 ? d : null;
}
const dmySlash = (d: Date) => ('0' + d.getDate()).slice(-2) + '/' + ('0' + (d.getMonth() + 1)).slice(-2) + '/' + d.getFullYear();

/** Rows to convert together: every row of the selection's WO in the same tab (Links refuses a second job for one invoice no.). */
export function rowsForWo(allRows: any[], picked: any[]): any[] {
    const wos = new Set(picked.map(r => s(r.WO).toUpperCase()).filter(Boolean));
    if (!wos.size) { return picked; }
    return allRows.filter(r => wos.has(s(r.WO).toUpperCase()) && !s(r.EXPTNO));
}

export function buildPrefill(rows: any[], aliases: ConvertAlias[], vessels: ConvertVessel[], ctx: { monthId: number; tabCode: string; returnUrl: string }): SheetPrefill {
    const notes: string[] = [];
    const first = rows[0] || {};
    const alias = (kind: string, value: any) => {
        const v = s(value).toUpperCase();
        if (!v) { return undefined; }
        const a = aliases.find(x => s(x.KIND).toUpperCase() === kind && s(x.SHEET_VALUE).toUpperCase() === v && s(x.LINKS_CODE));
        if (!a) { notes.push(label(kind) + ' "' + s(value) + '" has no alias yet - pick it on the form (and add it in Sheet view settings).'); }
        return a ? s(a.LINKS_CODE) : undefined;
    };

    // vessel: same name; the voyage whose ETD matches the row's DO ETD (then the second DO ETD, then current ETD)
    let vesselValue: string | undefined;
    const vName = s(first.VSL_NAME).toUpperCase().replace(/\s+/g, ' ');
    if (vName) {
        const same = vessels.filter(v => s(v.VSL_NAME).toUpperCase().replace(/\s+/g, ' ') && vName.indexOf(s(v.VSL_NAME).toUpperCase().replace(/\s+/g, ' ')) >= 0);
        const want = [first.DO_ETD, first.DO_ETD2, first.CURRENT_ETD].map(x => s(x)).filter(Boolean);
        const hit = same.find(v => want.indexOf(s(v.ETD).replace(/\//g, '-')) >= 0) || (same.length === 1 ? same[0] : undefined);
        if (hit) { vesselValue = s(hit.VSL_RTNO) + '|' + s(hit.PORT); }
        else { notes.push('Vessel "' + s(first.VSL_NAME) + '"' + (same.length ? ' has ' + same.length + ' voyages - pick the right one.' : ' was not found in the vessel list - pick it.')); }
    }

    const qty = rows.reduce((t, r) => t + n(r.QTY), 0);
    const recd = sheetDate(first.DO_RECEIVE_DT);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const docDate = recd && recd <= today ? recd : today;
    if (!recd) { notes.push('No DO RECEIVE DATE on the row - doc recd. date set to today.'); }

    const orders = rows.filter(r => s(r.PO_NO)).map(r => ({ orderNo: s(r.PO_NO), pieces: n(r.QTY) }));
    const vehs = Array.from(new Set(rows.map(r => s(r.VEH).replace(/\s+/g, ' ')).filter(Boolean)));
    const cargo = Array.from(new Set(rows.map(r => s(r.CARGO_TYPE)).filter(Boolean)));
    if (s(first.WO).length > 20) { notes.push('WO is longer than the 20 characters an invoice no. allows - shorten it on the form.'); }
    notes.push('Choose the mode of shipment and the services: they are never pre-selected.');
    notes.push('Not in the sheet: invoice amount, currency, gross / net weight, volume.');

    return {
        source: { kind: 'sheet', rowIds: rows.map(r => +r.ID), monthId: ctx.monthId, tabCode: ctx.tabCode, returnUrl: ctx.returnUrl },
        start: {
            exporterCode: BAJAJ_EXPORTER, billToCode: BAJAJ_EXPORTER,
            consigneeCode: alias('CONSIGNEE', first.CONSIGNEE), buyerSameAsConsignee: true,
            agentCode: alias('AGENT', first.AGENT), vesselValue, stuffingMode: null
        },
        main: {
            noOfPackages: qty || undefined, typeOfPackages: 'PKG', noOfPieces: qty || undefined, typeOfPieces: 'UNIT',
            loadingPortCode: alias('CLEARANCE', first.CLEARANCE_POINT), terminalId: alias('POLGATE', first.POL_GATE),
            podCode: alias('PORT', first.PORT), destCityCode: alias('COUNTRY', first.COUNTRY),
            docRecdDate: dmySlash(docDate), invoiceNo: s(first.WO).slice(0, 20), invoiceDate: dmySlash(docDate),
            natureOfPayment: rows.some(r => s(r.LC_NO) && s(r.LC_NO).toUpperCase() !== 'INSPECTION') ? '(LC)Letter of credit' : undefined,
            goodsRemark: [vehs.join(', '), cargo.join(' / ')].filter(Boolean).join(' - ') || undefined,
            vesselAgentCode: alias('SLINE', first.SLINE),
            orders: orders.length ? orders : undefined,
            packageRange: qty ? { from: 1, to: qty } : undefined
        },
        notes
    };
}

function label(kind: string): string {
    const m: { [k: string]: string } = { CONSIGNEE: 'Consignee', AGENT: 'Agent', SLINE: 'Shipping line', PORT: 'Port', COUNTRY: 'Country', POLGATE: 'POL gate', CLEARANCE: 'Clearance point', VESSEL: 'Vessel' };
    return m[kind] || kind;
}
