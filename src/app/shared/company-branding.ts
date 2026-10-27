/**
 * Company logos. Company 32 (OCEAN LINKS SHIPPING PVT. LTD.) prints and shows its own OLS logo
 * ("OLS / Ocean Links Shipping", no "Pvt. Ltd." - management's choice for the logo, 2026-10-27);
 * every other company keeps the LINKS mark. The 700 px letterheads of the Accounts prints come from
 * CMP_ADDRESS.CMP_IMAGE instead (company 32: HEADER_OCEAN_LINKS.JPG, which carries the OLS logo and
 * the full registered name).
 */
export const OLSPL_CMPCODE = '32';
export const LINKS_LOGO = 'assets/img/Untitled-1.png';
export const OLS_LOGO = 'assets/img/OLS_LOGO.png';
/** the ribbon emblem alone (no lettering), for the dark navbar where the company name sits beside it */
export const OLSPL_MARK = 'assets/img/OLSPL_MARK.png';

export function isOlspl(cmpCode: any): boolean {
    return String(cmpCode ?? '').trim() === OLSPL_CMPCODE;
}

export function companyLogo(cmpCode: any): string {
    return isOlspl(cmpCode) ? OLS_LOGO : LINKS_LOGO;
}

/** navbar logo: company 32 shows only its emblem (transparent, no tile); the others keep the LINKS mark */
export function navbarLogo(cmpCode: any): string {
    return isOlspl(cmpCode) ? OLSPL_MARK : LINKS_LOGO;
}
