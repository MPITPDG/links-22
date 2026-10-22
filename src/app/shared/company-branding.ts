/**
 * Company logos. Company 32 (OCEAN LINKS SHIPPING PVT. LTD.) prints and shows its own OLSPL logo;
 * every other company keeps the LINKS mark. The 700 px letterheads of the Accounts prints come from
 * CMP_ADDRESS.CMP_IMAGE instead (company 32: HEADER_OCEAN_LINKS.JPG, which carries the OLSPL logo).
 */
export const OLSPL_CMPCODE = '32';
export const LINKS_LOGO = 'assets/img/Untitled-1.png';
export const OLSPL_LOGO = 'assets/img/OLSPL_LOGO.png';
/** the OLSPL ribbon emblem alone (no lettering), for the dark navbar where the company name sits beside it */
export const OLSPL_MARK = 'assets/img/OLSPL_MARK.png';

export function isOlspl(cmpCode: any): boolean {
    return String(cmpCode ?? '').trim() === OLSPL_CMPCODE;
}

export function companyLogo(cmpCode: any): string {
    return isOlspl(cmpCode) ? OLSPL_LOGO : LINKS_LOGO;
}

/** navbar logo: company 32 shows only its emblem (transparent, no tile); the others keep the LINKS mark */
export function navbarLogo(cmpCode: any): string {
    return isOlspl(cmpCode) ? OLSPL_MARK : LINKS_LOGO;
}
