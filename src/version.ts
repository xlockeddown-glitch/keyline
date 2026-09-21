/** Bump ZZ by 1 on each publish: 0.0.01 → 0.0.02 → … → 0.0.99 → 0.1.00. Keep in sync with package.json "version". */
export const APP_VERSION = "0.0.07";
/** Cache-bust token for hashed /assets JS. */
export const PUBLISH_STAMP = "k07d";
/** Stylesheet outside /assets — that prefix caches 404s for a year. */
export const SHEET_HREF = "/sheet-k07d.css";
