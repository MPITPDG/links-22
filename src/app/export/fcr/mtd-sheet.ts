/**
 * MTO / Multimodal B/L (MTD) print, produced by Links itself (replaces the frm_Exp_Print_Document_Sea_FCR_PRINT.aspx
 * report for HBLTYPE 'M'). Layout reproduced from that report's output for MTD COL110251264 (July 2025):
 * the same boxes, captions, terms and the positions of the ORIGINAL / NON-NEGOTIABLE and SHIPPED ON BOARD
 * stamps the users used to add by hand. The page is A4, 794 x 1123 CSS px, black on white, independent of the app
 * theme. MtdSheetComponent renders it for the live preview and (from the saved values) for the print window;
 * MTD_SHEET_CSS styles both, so the preview and the paper match.
 * Pure TypeScript here (no Angular) so the helpers are testable on their own.
 */
import { companyLogo, isOlspl } from '../../shared/company-branding';

/** the fields the MTD prints (names as in Export_FCR_PRINTPREVIEW) */
export interface MtdSheetData {
    FCRNO: any;        // MTD Number
    EXPNO: any;        // Shipment reference
    SHIPPER: any;      // Shipper / Consignor
    CONSIGNEE: any;    // Consignee (or order)
    NOTIFYPARTY: any;  // Notify Address
    CARRIER: any;      // Place of Receipt
    RECPTPLACE: any;   // Port of Loading
    POD: any;          // Port Of Discharge
    PODEL: any;        // Place of Delivery
    VESSEL: any;       // Vessel / Voyage No.
    MARKSANDNOS: any;  // Container No.(s) column
    NOOFPKGS: any;     // Marks & Numbers column
    ITCDESC: any;      // packages / description of goods column
    GRWT: any;         // Gross weight
    VOL: any;          // Measurement
    MISC: any;         // Freight amount
    PP: any;           // Freight Payable at
    CC: any;           // Number of original MTD
    PLACEDATE: any;    // Place and date of issue
    APPLYTO: any;      // Other Particulars / Agent Address
    Rider: any;        // printed on a second page, RIDER / ATTACHED SHEET
}

export const MTD_SHEET_FIELDS: (keyof MtdSheetData)[] = [
    'FCRNO', 'EXPNO', 'SHIPPER', 'CONSIGNEE', 'NOTIFYPARTY', 'CARRIER', 'RECPTPLACE', 'POD', 'PODEL', 'VESSEL',
    'MARKSANDNOS', 'NOOFPKGS', 'ITCDESC', 'GRWT', 'VOL', 'MISC', 'PP', 'CC', 'PLACEDATE', 'APPLYTO', 'Rider'
];

export type MtdStamp = '' | 'ORIGINAL' | 'NON-NEGOTIABLE';

/** a printable string: null / undefined / false -> '', CRLF -> LF */
export function sheetText(v: any): string {
    return (v === null || v === undefined || v === false ? '' : String(v)).replace(/\r\n?/g, '\n');
}

/** copy of the printed fields, normalised (the "saved" snapshot the print is taken from) */
export function pickSheetData(src: any): MtdSheetData {
    const out: any = {};
    for (const k of MTD_SHEET_FIELDS) {
        out[k] = sheetText(src ? src[k] : '');
    }
    return out as MtdSheetData;
}

/** true when every printed field matches (newline style ignored) */
export function sameSheetData(a: any, b: any): boolean {
    return MTD_SHEET_FIELDS.every(k => sheetText(a ? a[k] : '') === sheetText(b ? b[k] : ''));
}

/**
 * Date for "SHIPPED ON BOARD / DATE:": the dd/mm/yyyy date in Place and date of issue (e.g. "MUMBAI 16/07/2025"),
 * returned as dd/mm/yyyy. Also reads d/m/yyyy and - or . separators. The last date wins. '' when there is none.
 */
export function shippedOnBoardDate(placeDate: any): string {
    const re = /(^|\D)(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})(?!\d)/g;
    const src = sheetText(placeDate);
    let found = '';
    let m: RegExpExecArray | null;
    while ((m = re.exec(src)) !== null) {
        const d = +m[2];
        const mo = +m[3];
        if (d >= 1 && d <= 31 && mo >= 1 && mo <= 12) {
            found = (d < 10 ? '0' : '') + d + '/' + (mo < 10 ? '0' : '') + mo + '/' + m[4];
        }
    }
    return found;
}

/**
 * Letterhead printed in the right-hand column.
 * links: as printed on the old Links report for MTD COL110251264 (company 30) - used for every company except 32.
 * olspl: company 32, OCEAN LINKS SHIPPING PVT. LTD. - name, address and MTO registration as specified for the MTD
 *        redesign (Oct 2026); it has no FMC registration, and no e-mail / web line was given for it.
 */
export const MTD_LETTERHEADS = {
    links: {
        name: 'LINKS CARGO AGENCIES PVT. LTD.',
        address: [
            'UNION CO. OPERATIVE INSURANCE BLDG',
            '23, SIR P.M. ROAD FORT, MUMBAI,INDIA 400001',
            'Email :general@linksin.com',
            'Web : www.linksin.com'
        ],
        regd: ['Regd. No. MTO/DGS/46/AUG/2028', 'FMC Regd. No. 028251']
    },
    olspl: {
        name: 'OCEAN LINKS SHIPPING PVT. LTD.',
        address: [
            '601, Star Hub, Tower 1, Next to ITC Grand Maratha Hotel,',
            'International Airport Road, Andheri East, Mumbai 400059'
        ],
        regd: ['Regd. No. MTO/DGS/1141/JAN/2022']
    }
};

export type MtdLetterhead = typeof MTD_LETTERHEADS.links;

export function mtdLetterhead(cmpCode: any): MtdLetterhead {
    return isOlspl(cmpCode) ? MTD_LETTERHEADS.olspl : MTD_LETTERHEADS.links;
}

/** the company logo as an absolute URL, so it also loads in the print window */
export function mtdLogoUrl(cmpCode: any): string {
    const path = companyLogo(cmpCode);
    try {
        return new URL(path, document.baseURI).href;
    } catch (e) {
        return location.origin + '/' + path;
    }
}

/** terms printed under the letterhead - verbatim from the old report, spelling included */
export const MTD_TERMS = [
    'Taken in charge in apparently good condition herein at the place of receipt for transport and delivery as '
    + 'mentioned above,unless otherwise stated.The MTD in accordance with the provisions contained in the MTD undertakes '
    + 'to perform or to procure the performance of the multimodal transport from the place at which the good are taken '
    + 'in chanrge, to place designated for thee delivery and assumed responsibility for such transport.',
    'One of the MTD(s) must be surrendered,duly endorsed in exchange for the  goods in witnes where of the original MTD '
    + 'all of this tenor and date have been signed in the number indicated below ,one of which being accomplished the '
    + 'other(s)to be void.'
];

/**
 * Sheet styles, shared by the preview (component styles) and the print window (written into its <head>).
 * Every rule is under .mtd-sheet; sizes in px on the 794 x 1123 page. Body Verdana 9px / 12px lines; the
 * description column (297px) holds DESC_COLUMN_CHARS (46) characters and DESC_FIT_LINES (24) lines.
 */
export const MTD_SHEET_CSS = `
.mtd-sheet{color:#000;background:transparent;font-family:Verdana,Geneva,"DejaVu Sans",Tahoma,sans-serif;font-size:9px;line-height:12px;font-weight:400;font-style:normal;letter-spacing:normal;text-transform:none;text-align:left;word-spacing:normal}
.mtd-sheet *{box-sizing:border-box;margin:0;padding:0;font:inherit;color:inherit;letter-spacing:inherit;text-transform:inherit}
.mtd-sheet img{display:block;max-width:none;border:0}
.mtd-page{position:relative;width:794px;height:1123px;padding:26px;background:#fff;overflow:hidden}
.mtd-doc{position:relative;width:742px;border:1px solid #000}
.mtd-title{height:37px;padding:6px 8px 0;border-bottom:1px solid #000;font-size:14px;line-height:18px;font-weight:700}
.mtd-cap{display:block;font-size:8px;line-height:11px;font-weight:700;white-space:normal}
.mtd-c{text-align:center}
.mtd-val{white-space:pre-wrap;overflow-wrap:break-word;tab-size:4}
.mtd-box{position:relative;overflow:hidden;border-bottom:1px solid #000;padding:4px 8px 3px}
.mtd-box>.mtd-cap{margin:0 0 5px -4px}
.mtd-br{border-right:1px solid #000}
.mtd-top{display:flex;height:400px;border-bottom:1px solid #000}
.mtd-left{display:flex;flex-direction:column;width:353px;flex:none;border-right:1px solid #000}
.mtd-h0{height:29px;flex:none}
.mtd-h1{height:126px;flex:none}
.mtd-h1>.mtd-cap{margin-bottom:12px}
.mtd-h2{height:88px;flex:none}
.mtd-h3{height:100px;flex:none}
.mtd-pair{display:flex;flex:1;min-height:0}
.mtd-pair>.mtd-box{border-bottom:0}
.mtd-p1{width:155px;flex:none}
.mtd-p2{flex:1;min-width:0;padding-left:4px}
.mtd-right{display:flex;flex-direction:column;flex:1;min-width:0}
.mtd-refs{display:grid;grid-template-columns:133px 195px;margin:2px 0 0 6px;flex:none}
.mtd-refs .mtd-k{font-size:8px;line-height:23px;font-weight:700;white-space:nowrap}
.mtd-refs .mtd-v{height:23px;border:1px solid #000;padding:0 6px;font-size:8px;line-height:21px;font-weight:700;white-space:nowrap;overflow:hidden}
.mtd-refs .mtd-v2{border-top:0}
.mtd-lh{flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:4px 8px}
.mtd-logo{height:47px;width:auto;margin-bottom:6px}
.mtd-co{font-size:15px;line-height:19px;font-weight:700;margin-bottom:3px}
.mtd-ad{font-size:9.5px;line-height:15.5px}
.mtd-rg{font-size:7.5px;line-height:11.5px;font-weight:700}
.mtd-terms{flex:none;padding:0 64px 5px 29px;font-size:8px;line-height:11.7px}
.mtd-route{display:flex;height:40px;border-bottom:1px solid #000}
.mtd-route>.mtd-box{border-bottom:0}
.mtd-r1{width:155px;flex:none}
.mtd-r2{width:198px;flex:none;padding-left:4px}
.mtd-r3{width:164px;flex:none}
.mtd-r4{flex:1;min-width:0}
.mtd-cargo{position:relative;z-index:0;height:372px;border-bottom:1px solid #000}
.mtd-cols{display:grid;grid-template-columns:109px 125px 297px 78px minmax(0,1fr);padding-left:8px}
.mtd-ch{height:42px;padding-top:10px;font-size:8px;line-height:11.5px;font-weight:700}
.mtd-cb>div{min-width:0;min-height:288px;padding-right:6px;white-space:pre-wrap;overflow-wrap:break-word;tab-size:4}
.mtd-cb>.mtd-d{overflow-wrap:normal}
.mtd-wm{position:absolute;left:50%;top:50%;z-index:-1;width:320px;height:auto;transform:translate(-50%,-50%);opacity:.08}
.mtd-stamp{position:absolute;left:8px;bottom:13px;font-family:"Times New Roman",Times,serif;font-size:22px;line-height:22px;font-weight:700;white-space:nowrap}
.mtd-board{position:absolute;right:12px;bottom:18px;font-family:"Times New Roman",Times,serif;font-size:22px;line-height:26px;font-weight:700;white-space:nowrap}
.mtd-frt{display:flex;height:34px;border-bottom:1px solid #000}
.mtd-frt>.mtd-box{border-bottom:0;padding:2px 4px}
.mtd-frt>.mtd-box>.mtd-cap{margin:0 0 3px}
.mtd-f1{width:178px;flex:none;padding-left:8px!important}
.mtd-f2{width:188px;flex:none}
.mtd-f3{width:164px;flex:none}
.mtd-f4{flex:1;min-width:0}
.mtd-bot{display:flex;height:168px}
.mtd-bot>.mtd-box{border-bottom:0}
.mtd-b1{width:366px;flex:none}
.mtd-b1>.mtd-cap{font-size:7.5px}
.mtd-b1>.mtd-val{max-height:84px;overflow:hidden}
.mtd-b2{flex:1;min-width:0;padding:8px 4px}
.mtd-b2>.mtd-cap{margin:0}
.mtd-agent{display:inline-block;margin:13px 0 4px;font-size:7.5px;line-height:11px;font-weight:700;text-decoration:underline}
.mtd-foot{position:absolute;left:0;right:0;bottom:3px;text-align:center;font-size:8px;line-height:15px}
.mtd-agents{position:absolute;right:44px;bottom:16px;font-size:8px;line-height:12px}
.mtd-rider{height:auto;min-height:1123px}
.mtd-rider .mtd-doc{min-height:1060px}
.mtd-rhead{display:flex;align-items:center;justify-content:space-between;gap:12px;height:37px;padding:0 8px;border-bottom:1px solid #000}
.mtd-rhead .mtd-rt{font-size:14px;line-height:18px;font-weight:700}
.mtd-rhead .mtd-k{font-size:8px;font-weight:700}
.mtd-rhead .mtd-v{display:inline-block;margin-left:8px;border:1px solid #000;padding:0 6px;font-size:8px;line-height:21px;font-weight:700}
.mtd-rbody{padding:10px 8px 70px;min-height:1000px}
.mtd-rider>.mtd-stamp{left:36px;bottom:40px}
.mtd-sheet.is-draft .mtd-page::after{content:"DRAFT";position:absolute;left:50%;top:50%;z-index:5;transform:translate(-50%,-50%) rotate(-35deg);font-family:Verdana,Geneva,sans-serif;font-size:180px;line-height:1;font-weight:700;letter-spacing:16px;color:rgba(0,0,0,.08);white-space:nowrap;pointer-events:none}
.mtd-sheet.live [data-f]{cursor:pointer}
.mtd-sheet.live [data-f]:hover{background:rgba(0,0,0,.035)}
.mtd-sheet .hot{outline:2px solid var(--mp-primary,#0A0A0A);outline-offset:-2px;background:rgba(0,0,0,.045)}
.mtd-limit{position:absolute;left:0;right:0;top:330px;z-index:2;border-top:1px dashed #C62828}
.mtd-limit span{position:absolute;right:4px;top:1px;padding:0 4px;background:#C62828;color:#fff;font-size:8px;line-height:12px}
`;

/** print-window only: A4 with no browser margins, one sheet per page */
export const MTD_PRINT_CSS = `
@page{size:A4;margin:0}
html,body{margin:0;padding:0;background:#fff}
*{-webkit-print-color-adjust:exact;print-color-adjust:exact}
@media screen{body{background:#8f8f8f;padding:16px 0}.mtd-page{margin:0 auto 16px;box-shadow:0 2px 12px rgba(0,0,0,.35)}}
@media print{.mtd-page{width:210mm;height:297mm;margin:0;break-after:page;page-break-after:always}.mtd-page:last-child{break-after:auto;page-break-after:auto}.mtd-rider{height:auto;min-height:297mm}}
`;

function escapeHtml(s: string): string {
    return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' } as any)[c]);
}

/**
 * Prints a rendered sheet (the .mtd-sheet element) in a new window. Must be called synchronously from the click
 * handler so pop-up blockers allow window.open. Copies the sheet's DOM (no preview highlight), adds the DRAFT mark
 * when asked, writes it with MTD_SHEET_CSS + MTD_PRINT_CSS, waits for the images, then calls print(). The window
 * stays open afterwards (as the old report window did). Returns false when the window was blocked.
 */
export function openMtdPrintWindow(sheet: HTMLElement, opts: { draft: boolean; title: string }): boolean {
    const w = window.open('', '_blank', 'width=900,height=1000');
    if (!w) {
        return false;
    }
    const clone = sheet.cloneNode(true) as HTMLElement;
    clone.classList.remove('live');
    clone.classList.toggle('is-draft', !!opts.draft);
    clone.querySelectorAll('.hot').forEach(n => n.classList.remove('hot'));
    clone.querySelectorAll('.mtd-limit').forEach(n => n.remove());
    // absolute image URLs, so they resolve in the new window whatever its base URL
    clone.querySelectorAll('img').forEach(img => img.setAttribute('src', (img as HTMLImageElement).src));

    const doc = w.document;
    doc.open();
    doc.write('<!DOCTYPE html><html><head><meta charset="utf-8"><title>' + escapeHtml(opts.title || 'MTD')
        + '</title><style>' + MTD_SHEET_CSS + MTD_PRINT_CSS + '</style></head><body>' + clone.outerHTML + '</body></html>');
    doc.close();

    let printed = false;
    const go = () => {
        if (printed) {
            return;
        }
        printed = true;
        try {
            w.focus();
            w.print();
        } catch (e) { /* window closed by the user before it printed */ }
    };
    const pending = Array.from(doc.images).filter(img => !img.complete);
    if (!pending.length) {
        w.setTimeout(go, 60);
    } else {
        let left = pending.length;
        const done = () => { if (--left <= 0) { w.setTimeout(go, 30); } };
        pending.forEach(img => {
            img.addEventListener('load', done);
            img.addEventListener('error', done);
        });
        w.setTimeout(go, 4000);  // never wait for ever on a slow logo
    }
    return true;
}
