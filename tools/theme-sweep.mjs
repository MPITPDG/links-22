#!/usr/bin/env node
// Theme sweep: rewrites hardcoded colours in legacy stylesheets to
// var(--mp-<token>, <original>) so a palette applied via <html data-theme>
// reaches legacy pages while Classic (no tokens defined) renders unchanged.
//
// Usage: node tools/theme-sweep.mjs [--dry] [--no-html]
// Scope: src/app/**/*.css|scss, src/scss/style.scss, `styles: [...]` template
// strings in src/app/**/*.ts, static style="..." attributes in src/app/**/*.html.
// Never touches: @media print blocks, url(), box-/text-shadow, multi-stop
// gradients, SCSS $variables / colour functions, already-tokenised files.
// Idempotent: values already containing var(...) are left alone.
//
// Links port (from MPERPNG-20, unchanged sweep logic). Two Links additions:
//  - --no-html skips the style="..." pass over templates. Phase 1 ran it with
//    --no-html because feature templates are off-limits until each module is
//    ported (Phase 2 brings MP's already-swept templates).
//  - Links-only EXCLUDE entries (end of the list): the shell (layouts, menu, breadcrumb, login and the
//    module/branch/company pickers) is being replaced wholesale by MP's
//    tokenised shell, so its legacy stylesheets are not swept.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DRY = process.argv.includes('--dry');
const NO_HTML = process.argv.includes('--no-html');

const EXCLUDE = [
  /src\/app\/windowpoppage\//,
  /src\/app\/profile\/theme\//,
  /src\/app\/shared\/theme\//,
  /src\/app\/tickets\//,
  /src\/app\/export\/today\//,
  /src\/app\/importfra\/csd-approvals\//,
  /src\/app\/dashboard\/dashboard\.component\.css$/,
  /src\/app\/accounts\/home\//,
  /FinanceDashboard\//,
  /src\/app\/import\/home\//,
  /src\/app\/importfra\/home\//,
  /src\/app\/accountsfra\/home\//,
  /BankReconcil\//,
  /notification-bell\//,
  /vessel-suggest\//,
  /csd-chip\./,
  /print/i, // print templates (printdocument, docket-print, Chequeprint, ...) stay ink-on-white
  // ---- Links only (see header) ----
  /src\/app\/layouts\//,
  /src\/app\/shared\/menu\//,
  /src\/app\/shared\/breadcrumb\.component/,
  /src\/app\/login\//,
  /src\/app\/module\//,
  /src\/app\/branch\//,
  /src\/app\/company\//,
  /src\/app\/shared\/ui\//,
];

// ---- colour families ------------------------------------------------------
const fam = {};
const add = (f, list) => list.forEach(h => (fam[h] = f));
add('black', ['000000', '0a0a0a', '111111', '111827', '1f2937', '212529', '222222', '333333', '343a40', '0e1013', '1a1a1a', '2a2a2a',
  /* extras: slate/gray-900/800 */ '0f172a', '1e293b']);
add('mid', ['555555', '666666', '777777', '6b6b6b', '6c757d', '6b7280', '64748b', '565656', '8c8c8c', '9a9a9a', '9e9e9e', 'adb5bd',
  /* extras */ '999999', '9ca3af', '374151', '4b5563', '475569', '444444']);
add('light', ['dadada', 'dee2e6', 'dddddd', 'd1d5db', 'ced4da', 'e5e7eb', 'ececec', 'ededed', 'e4e4e4', 'cccccc', 'bdbdbd', 'c8c8c8', 'd2d2d2',
  /* extras */ 'cbd5e1', 'e2e8f0', 'd9d9d9', 'e0e0e0']);
add('vlight', ['f3f3f3', 'f5f5f5', 'f6f6f6', 'f8f9fa', 'f9fafb', 'fafafa', 'fbfbfb', 'f0f0f0', 'eeeeee', 'e9ecef',
  /* extras */ 'f3f4f6', 'f1f5f9', 'f8fafc', 'f7f7f7', 'f1f1f1']);
add('white', ['ffffff']);
add('blue', ['007bff', '0d6efd', '20a8d8', '17a2b8', '4dbd74', /* extras: tailwind blue-600/700 */ '2563eb', '1d4ed8']);
add('red', ['dc3545', 'f86c6b', 'd9534f']);

function family(lit) {
  const s = lit.toLowerCase().replace(/\s+/g, '');
  if (s === 'white') return 'white';
  if (s === 'black') return 'black';
  if (s === 'rgb(0,0,0)' || s === 'rgba(0,0,0,1)') return 'black';
  if (s === 'rgb(255,255,255)' || s === 'rgba(255,255,255,1)') return 'white';
  if (s[0] !== '#') return null;
  let h = s.slice(1);
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  if (h.length !== 6) return null;
  return fam[h] || null;
}

const COLOR_SRC = String.raw`#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b|rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*[\d.]+\s*)?\)|\b(?:white|black)\b`;
const colorsIn = v => v.match(new RegExp(COLOR_SRC, 'g')) || [];

// Page-local custom properties (--ex-ink, --im-line, --jv-brand ...) are where
// most legacy restyles keep their greys, so their DEFINITIONS are tokenised by
// role inferred from the name. Usages like var(--ink, #0A0A0A) are left alone.
function customRole(prop) {
  const n = prop.toLowerCase();
  if (n.startsWith('--mp-') || /^--gray-\d+$/.test(n)) return null;
  if (/warn|ok|success|amber|mint|rose|excel|info|green|yellow|orange/.test(n)) return null; // semantic
  if (/danger|error|err\b/.test(n)) return 'danger-only';
  if (/(-fg|-on|brand-ink|inverse|contrast)$/.test(n)) return 'fg';
  if (/line|edge|border|rule|divider|hair/.test(n)) return 'border';
  if (/ink|muted|faint|text|soft$|^--soft/.test(n)) return 'color';
  if (/brand|primary|accent|violet|deep|head/.test(n)) return 'bg';
  if (/ground|^--(jp-)?bg$/.test(n)) return 'page-bg';
  if (/bg|surface|sheet|panel|card|fill|band|wash|alt|air|paper|mid/.test(n)) return 'bg';
  return null;
}

function roleOf(prop) {
  prop = prop.toLowerCase();
  if (prop.startsWith('--')) return customRole(prop);
  if (prop === 'accent-color' || prop === 'caret-color') return 'border';
  if (prop === 'background' || prop === 'background-color') return 'bg';
  if (prop === 'color') return 'color';
  if (/^(border|outline)(-(top|right|bottom|left|block|inline))?(-color)?$/.test(prop) || prop === 'fill' || prop === 'stroke' || prop === 'column-rule-color') return 'border';
  return null; // box-shadow, text-shadow etc. are left alone
}

function tokenFor(f, role, ctx) {
  switch (role) {
    case 'danger-only':
      return f === 'red' ? 'danger' : null;
    case 'fg':
      if (f === 'white') return 'primary-fg';
      if (f === 'black') return 'ink';
      return null;
    case 'page-bg':
      return tokenFor(f, 'bg', { ...ctx, page: true });
    case 'bg':
      if (f === 'black' || f === 'blue') return 'primary';
      if (f === 'red') return 'danger';
      if (f === 'mid') return 'strong';
      if (f === 'light') return 'band';
      if (f === 'vlight') return ctx.page ? 'bg' : 'band';
      if (f === 'white') return ctx.page ? null : 'surface';
      return null;
    case 'border':
      if (f === 'black' || f === 'blue') return 'primary';
      if (f === 'red') return 'danger';
      if (f === 'light' || f === 'vlight') return 'line';
      return null;
    case 'color':
      if (f === 'white') return ctx.darkBg ? 'primary-fg' : null;
      if (f === 'black') return 'ink';
      if (f === 'mid') return 'soft';
      if (f === 'blue') return ctx.darkBg ? null : 'primary';
      if (f === 'red') return 'danger';
      return null;
  }
  return null;
}

function valueSkippable(v) {
  if (/\bvar\(/.test(v)) return true;                       // already tokenised / custom-prop indirection
  if (/\$|#\{|@/.test(v)) return true;                       // scss variables / interpolation
  if (/\b(darken|lighten|mix|fade|fadein|fadeout|transparentize|opacify|tint|shade|adjust-hue|saturate|desaturate)\(/i.test(v)) return true;
  return false;
}

const INK_VAR = /var\(--(?:[a-z]+-)?(?:ink|brand|brand-hover|deep)(?:\s*,\s*#[0-9a-fA-F]{3,6})?\)/;
const SHEET_VAR = /var\(--(?:[a-z]+-)?(?:sheet|surface|paper|white|card)(?:\s*,\s*#[0-9a-fA-F]{3,6})?\)/;
const counts = {};
const fileReport = {};
const skipped = { gradients: 0, printDecls: 0 };

function rewriteValue(prop, value, ctx, rel) {
  const role = roleOf(prop);
  if (!role) return value;
  // Local ink token painted as a fill/outline (black buttons, active pills):
  // background: var(--ink) -> var(--mp-primary, var(--ink)); its text
  // (var(--sheet) / #fff) -> --mp-primary-fg.
  if (!prop.startsWith('--') && !/--mp-/.test(value)) {
    const bump = tok => { counts[tok] = (counts[tok] || 0) + 1; fileReport[rel] = (fileReport[rel] || 0) + 1; };
    if ((role === 'bg' || role === 'border') && INK_VAR.test(value)) {
      return value.replace(new RegExp(INK_VAR.source, 'g'), m => { bump('primary'); return `var(--mp-primary, ${m})`; });
    }
    if (role === 'color' && ctx.darkBg && SHEET_VAR.test(value)) {
      return value.replace(new RegExp(SHEET_VAR.source, 'g'), m => { bump('primary-fg'); return `var(--mp-primary-fg, ${m})`; });
    }
  }
  if (valueSkippable(value)) return value;
  const grad = /gradient\(/i.test(value);
  if (grad && colorsIn(value).length > 2) { skipped.gradients++; return value; }
  const parts = value.split(/(url\([^)]*\))/i); // never touch url(...)
  return parts.map(p => {
    if (/^url\(/i.test(p)) return p;
    return p.replace(new RegExp(COLOR_SRC, 'g'), lit => {
      const f = family(lit);
      if (!f) return lit;
      const tok = tokenFor(f, grad ? 'bg' : role, ctx);
      if (!tok) return lit;
      counts[tok] = (counts[tok] || 0) + 1;
      fileReport[rel] = (fileReport[rel] || 0) + 1;
      return `var(--mp-${tok}, ${lit})`;
    });
  }).join('');
}

// ---- tiny CSS/SCSS parser ------------------------------------------------
function parse(src, scss) {
  let i = 0;
  const n = src.length;
  function skipTrivia() {
    for (;;) {
      if (src.startsWith('/*', i)) { const e = src.indexOf('*/', i + 2); i = e < 0 ? n : e + 2; continue; }
      if (scss && src.startsWith('//', i)) { const e = src.indexOf('\n', i); i = e < 0 ? n : e + 1; continue; }
      if (i < n && /\s/.test(src[i])) { i++; continue; }
      break;
    }
  }
  function block(prelude) {
    const node = { prelude, decls: [], children: [] };
    for (;;) {
      skipTrivia();
      if (i >= n) return node;
      if (src[i] === '}') { i++; return node; }
      const s = i; let depth = 0;
      while (i < n) {
        const c = src[i];
        if (c === '"' || c === "'") { const q = c; i++; while (i < n && src[i] !== q) { if (src[i] === '\\') i++; i++; } i++; continue; }
        if (src.startsWith('/*', i)) { const e = src.indexOf('*/', i + 2); i = e < 0 ? n : e + 2; continue; }
        if (c === '#' && src[i + 1] === '{') { const e = src.indexOf('}', i); i = e < 0 ? n : e + 1; continue; }
        if (c === '(') depth++;
        else if (c === ')') depth--;
        else if (depth <= 0 && (c === ';' || c === '{' || c === '}')) break;
        i++;
      }
      const text = src.slice(s, i);
      if (src[i] === '{') {
        i++;
        node.children.push(block(text.trim()));
      } else {
        const colon = text.indexOf(':');
        if (colon > 0 && !/^\s*[@$]/.test(text)) {
          const prop = text.slice(0, colon).trim();
          if (/^(--)?[a-zA-Z][-a-zA-Z0-9]*$/.test(prop)) node.decls.push({ prop, vs: s + colon + 1, ve: s + text.length, value: text.slice(colon + 1) });
        }
        if (src[i] === ';') i++;
      }
    }
  }
  return block('');
}

function isPageSelector(sel) {
  return sel.split(',').map(x => x.trim()).some(x => /^(html|body|\.app-body|main\.main|main)$/.test(x));
}

function collectEdits(node, inPrint, rel, edits) {
  const print = inPrint || /@media[^{]*\bprint\b/i.test(node.prelude);
  if (print) {
    skipped.printDecls += node.decls.filter(d => colorsIn(d.value).length).length;
  } else if (/data-color-mode|data-theme/.test(node.prelude)) {
    // explicit colour-mode / theme overrides are hand-tuned: leave
  } else if (node.decls.length) {
    const darkBg = node.decls.filter(d => roleOf(d.prop) === 'bg')
      .some(d => INK_VAR.test(d.value) || colorsIn(d.value).some(c => ['black', 'blue', 'red', 'mid'].includes(family(c))));
    const ctx = { darkBg, page: isPageSelector(node.prelude) };
    for (const d of node.decls) {
      const nv = rewriteValue(d.prop, d.value, ctx, rel);
      if (nv !== d.value) edits.push([d.vs, d.ve, nv]);
    }
  }
  for (const c of node.children) {
    if (/^@(-webkit-)?(keyframes|font-face)/i.test(c.prelude)) continue;
    collectEdits(c, print, rel, edits);
  }
}

function sweepCss(src, scss, rel) {
  const edits = [];
  collectEdits(parse(src, scss), false, rel, edits);
  edits.sort((a, b) => b[0] - a[0]);
  let out = src;
  for (const [s, e, v] of edits) out = out.slice(0, s) + v + out.slice(e);
  return out;
}

// ---- file walking ----------------------------------------------------------
function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) { if (ent.name !== 'node_modules') walk(p, acc); } else acc.push(p);
  }
  return acc;
}
const relOf = p => path.relative(ROOT, p).split(path.sep).join('/');
const excluded = rel => EXCLUDE.some(r => r.test(rel));

const changed = [];
function writeIf(p, src, out) {
  if (out !== src) { changed.push(relOf(p)); if (!DRY) fs.writeFileSync(p, out); }
}

const appFiles = walk(path.join(ROOT, 'src/app'));
const STYLE = path.join(ROOT, 'src/scss/style.scss');
const MARK = '/* @theme-sweep:legacy';

for (const p of [...appFiles.filter(p => /\.s?css$/.test(p)), STYLE]) {
  const rel = relOf(p);
  if (excluded(rel)) continue;
  const src = fs.readFileSync(p, 'utf8');
  let out;
  if (p === STYLE) {
    const m = src.indexOf(MARK); // hand-written theme block below the marker is not swept
    out = m < 0 ? sweepCss(src, true, rel) : sweepCss(src.slice(0, m), true, rel) + src.slice(m);
  } else {
    out = sweepCss(src, /\.scss$/.test(p), rel);
  }
  writeIf(p, src, out);
}

// .ts: template strings inside styles: [ ... ]
for (const p of appFiles.filter(p => p.endsWith('.ts') && !p.endsWith('.spec.ts'))) {
  const rel = relOf(p);
  if (excluded(rel)) continue;
  const src = fs.readFileSync(p, 'utf8');
  if (!/styles\s*:\s*\[/.test(src)) continue;
  const out = src.replace(/(styles\s*:\s*\[)([\s\S]*?)(\]\s*[,}\n])/g, (m, a, body, z) =>
    a + body.replace(/`([^`]*)`/g, (mm, css) => (css.includes('${') ? mm : '`' + sweepCss(css, false, rel) + '`')) + z);
  writeIf(p, src, out);
}

// .html: static style="..." attributes (no interpolation)
for (const p of (NO_HTML ? [] : appFiles.filter(p => p.endsWith('.html')))) {
  const rel = relOf(p);
  if (excluded(rel)) continue;
  const src = fs.readFileSync(p, 'utf8');
  const out = src.replace(/(\sstyle=)(["'])([^"']*)\2/gi, (m, a, q, css) => {
    if (css.includes('{{')) return m;
    const swept = sweepCss('x{' + css + '}', false, rel);
    return a + q + swept.slice(2, -1) + q;
  });
  writeIf(p, src, out);
}

console.log(`${DRY ? '[dry] ' : ''}files changed: ${changed.length}`);
console.log('replacements per token:', JSON.stringify(Object.fromEntries(Object.entries(counts).sort((a, b) => b[1] - a[1]))));
console.log('skipped:', JSON.stringify(skipped));
for (const f of changed) console.log(`  ${String(fileReport[f] || 0).padStart(4)}  ${f}`);
