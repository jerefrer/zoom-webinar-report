/**
 * Zoom's "Actual Start Time" field comes in TWO common shapes depending on
 * locale settings on the host's account:
 *
 *   • US / English Zoom export → "MM/DD/YYYY HH:mm:ss …"  (slash, MDY)
 *   • European / Asian locales → "DD.MM.YYYY HH:mm:ss …" (dot, DMY)
 *
 * We normalise both to the European DD/MM/YYYY for display so the in-app
 * date chip, the day grouping, and the XLSX all match.
 *
 * Ported from v1 Python `_extract_full_date` (src/reporter.py) — keeping the
 * logic in one place so the wizard's inspect step and the aggregator never
 * disagree on whether a date was successfully parsed.
 */

function pad(s: string): string {
  return s.length === 1 ? `0${s}` : s;
}

export function extractFullDate(rawActualStartTime: string): string | null {
  const raw = (rawActualStartTime ?? "").trim();
  if (!raw) return null;

  // DD.MM.YYYY (European / Asian Zoom locales — e.g. Chinese export)
  let m = raw.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})/);
  if (m) return `${pad(m[1])}/${pad(m[2])}/${m[3]}`;

  // MM/DD/YYYY (US / English Zoom export)
  m = raw.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) return `${pad(m[2])}/${pad(m[1])}/${m[3]}`;

  return null;
}

/** Same extraction but returns the compact DDMM key used in XLSX filenames. */
export function extractDdmm(rawActualStartTime: string): string {
  const raw = (rawActualStartTime ?? "").trim();
  if (!raw) return "";
  let m = raw.match(/^(\d{1,2})\.(\d{1,2})\.\d{4}/);
  if (m) return `${pad(m[1])}${pad(m[2])}`;
  m = raw.match(/^(\d{1,2})\/(\d{1,2})\/\d{4}/);
  if (m) return `${pad(m[2])}${pad(m[1])}`;
  return "";
}
