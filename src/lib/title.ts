// CJK Unified Ideographs + Extension A (covers virtually all common Han characters).
const CJK_RE = /[㐀-鿿]/;
const SEPARATOR_RE = /\s+[–—\-|·.]\s+/g;

/**
 * Strip a trailing Chinese (CJK) translation block from a Zoom topic title.
 *
 * Looks for the last title separator (` – `, ` - `, ` | `, ` . ` …) and removes
 * everything after it when the trailing segment is predominantly CJK. Safe on
 * titles with no Chinese (returns the input unchanged) and on titles that are
 * entirely Chinese (returns the input rather than an empty string).
 */
export function stripChineseSuffix(title: string): string {
  let result = title.trim();
  // Bounded loop: at most a few trailing segments would ever need peeling.
  for (let i = 0; i < 4; i++) {
    const matches = [...result.matchAll(SEPARATOR_RE)];
    if (matches.length === 0) break;
    const last = matches[matches.length - 1];
    const idx = last.index ?? -1;
    if (idx < 0) break;

    const tail = result.slice(idx + last[0].length).trim();
    if (tail.length === 0) {
      // Trailing separator (e.g., after a previous strip) — drop it and retry.
      result = result.slice(0, idx).trimEnd();
      continue;
    }

    const chars = [...tail];
    const nonWs = chars.filter((c) => c.trim() !== "").length;
    const cjk = chars.filter((c) => CJK_RE.test(c)).length;

    // Only strip when the surviving HEAD still has substantial non-CJK content —
    // otherwise the whole title is Chinese and there's nothing meaningful to preserve.
    const head = result.slice(0, idx);
    const headChars = [...head];
    const headNonWs = headChars.filter((c) => c.trim() !== "").length;
    const headNonCjk = headChars.filter((c) => c.trim() !== "" && !CJK_RE.test(c)).length;
    const headHasEnglish = headNonWs > 0 && headNonCjk / headNonWs > 0.5;

    if (nonWs > 0 && cjk / nonWs > 0.3 && headHasEnglish) {
      result = result.slice(0, idx).trimEnd();
    } else {
      break;
    }
  }
  return result || title;
}
