/** Bump ZZ by 1 on each publish: 0.0.01 → 0.0.02 → … → 0.0.99 → 0.1.00. Keep in sync with package.json "version". */
export const APP_VERSION = "0.0.13";
/** Cache-bust token for hashed /assets JS. */
export const PUBLISH_STAMP = "k13a";
/** Stylesheet outside /assets — that prefix caches 404s for a year. Smoke asserts this path 200. */
export const SHEET_HREF = "/sheet-k07d.css";

// Weekly trivia ship 2026-09-22: cities_weekly + weekly_20260922 wired; Detroit RenCen HQ fix.

// 0.0.12: HQ tab labels (Atlas/Print/Ledger/Standings) high-contrast chips — were invisible on elevated panel.
// 0.0.13: Lantern glass art pass — soot rim, warm wick, short bloom; street + vault hero share layered glass (brass/soot).
// 0.0.13 facade: shop brass awning + CSS hanging lamp; HQ panel brass edge + wick (still k13a, no bump).
