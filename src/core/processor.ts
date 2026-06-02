import type { AttendeeRow } from "./types";

// Match Python v1's `_DT_FMTS` set — six formats. The narrower 3-format
// version we shipped initially missed AM/PM-without-seconds and 24h-without-
// seconds, which Zoom occasionally emits. A missed parse causes the row to
// fall into a generic "chain 0" bucket during dedup, which can affect counts.
const RX_MDY_HMS_AP = /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\s+(AM|PM)$/i;
const RX_MDY_HMS    = /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})$/;
const RX_YMD_HMS    = /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/;
const RX_MDY_HM_AP  = /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})\s+(AM|PM)$/i;
const RX_MDY_HM     = /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})$/;
const RX_HM         = /^(\d{1,2}):(\d{2})$/;

function applyMeridiem(hour: number, ap: string): number {
  const upper = ap.toUpperCase();
  if (upper === "PM" && hour < 12) return hour + 12;
  if (upper === "AM" && hour === 12) return 0;
  return hour;
}

export function parseDateTime(s: string): Date | null {
  if (!s) return null;
  const trimmed = s.trim();

  let m = trimmed.match(RX_MDY_HMS_AP);
  if (m) {
    const hour = applyMeridiem(Number(m[4]), m[7]);
    return new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]),
                    hour, Number(m[5]), Number(m[6]));
  }
  m = trimmed.match(RX_MDY_HMS);
  if (m) {
    return new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]),
                    Number(m[4]), Number(m[5]), Number(m[6]));
  }
  m = trimmed.match(RX_YMD_HMS);
  if (m) {
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]),
                    Number(m[4]), Number(m[5]), Number(m[6]));
  }
  m = trimmed.match(RX_MDY_HM_AP);
  if (m) {
    const hour = applyMeridiem(Number(m[4]), m[6]);
    return new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]),
                    hour, Number(m[5]), 0);
  }
  m = trimmed.match(RX_MDY_HM);
  if (m) {
    return new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]),
                    Number(m[4]), Number(m[5]), 0);
  }
  m = trimmed.match(RX_HM);
  if (m) {
    // Time-only — no date context; use 1970-01-01 as anchor. Used only for
    // relative ordering within a name-group, where the absolute date doesn't
    // matter as long as all rows are parsed the same way.
    return new Date(1970, 0, 1, Number(m[1]), Number(m[2]), 0);
  }
  return null;
}

function dedupKey(row: AttendeeRow): string {
  const email = row.email.trim().toLowerCase();
  const name = row.name.trim().toLowerCase();
  return email ? email : `__name__${name}`;
}

/**
 * Greedy interval-scheduling for name-only collisions. RESERVED for a future
 * `applyUniqueUsersOverride` path where Zoom's own unique-users CSV provides
 * a ground-truth count for each ambiguous name. Without that signal we don't
 * call this — `deduplicate` collapses concurrent same-name rows into one,
 * matching v1 Python's default behavior.
 */
export function assignConcurrentSubKeys(
  rows: AttendeeRow[],
  initialKeys: string[],
): string[] {
  const result = [...initialKeys];
  const groups = new Map<string, number[]>();
  for (let i = 0; i < initialKeys.length; i++) {
    const k = initialKeys[i];
    if (k.startsWith("__name__")) {
      const list = groups.get(k) ?? [];
      list.push(i);
      groups.set(k, list);
    }
  }
  for (const [key, indices] of groups) {
    if (indices.length <= 1) continue;
    const sorted = [...indices].sort((a, b) => {
      const ja = parseDateTime(rows[a].joinTime);
      const jb = parseDateTime(rows[b].joinTime);
      if (!ja && !jb) return 0;
      if (!ja) return 1;
      if (!jb) return -1;
      return ja.getTime() - jb.getTime();
    });
    const chains: { lastLeave: Date | null; idx: number[] }[] = [];
    for (const idx of sorted) {
      const join = parseDateTime(rows[idx].joinTime);
      const leave = parseDateTime(rows[idx].leaveTime);
      if (!join) {
        if (chains.length === 0) chains.push({ lastLeave: leave, idx: [idx] });
        else {
          chains[0].idx.push(idx);
          if (leave && (!chains[0].lastLeave || leave > chains[0].lastLeave)) {
            chains[0].lastLeave = leave;
          }
        }
        continue;
      }
      let bestIdx = -1;
      for (let c = 0; c < chains.length; c++) {
        const lastLeave = chains[c].lastLeave;
        if (lastLeave === null || lastLeave <= join) {
          if (bestIdx < 0) bestIdx = c;
          else {
            const bestLast = chains[bestIdx].lastLeave;
            if (lastLeave && (!bestLast || lastLeave > bestLast)) bestIdx = c;
          }
        }
      }
      if (bestIdx >= 0) {
        chains[bestIdx].idx.push(idx);
        if (leave && (!chains[bestIdx].lastLeave || leave > chains[bestIdx].lastLeave!)) {
          chains[bestIdx].lastLeave = leave;
        }
      } else {
        chains.push({ lastLeave: leave, idx: [idx] });
      }
    }
    if (chains.length > 1) {
      for (let c = 0; c < chains.length; c++) {
        const newKey = `${key}__${c}`;
        for (const idx of chains[c].idx) result[idx] = newKey;
      }
    }
  }
  return result;
}

function mode(values: string[]): string {
  const counts = new Map<string, number>();
  for (const v of values) if (v) counts.set(v, (counts.get(v) ?? 0) + 1);
  let best = "";
  let bestN = 0;
  for (const [v, n] of counts) {
    if (n > bestN) { best = v; bestN = n; }
  }
  return best;
}

function firstNonEmpty(values: string[]): string {
  for (const v of values) if (v && v.trim()) return v;
  return "";
}

function compareDates(a: string, b: string, prefer: "min" | "max"): string {
  const da = parseDateTime(a);
  const db = parseDateTime(b);
  if (!da) return b;
  if (!db) return a;
  if (prefer === "min") return da <= db ? a : b;
  return da >= db ? a : b;
}

export function deduplicate(rows: AttendeeRow[]): AttendeeRow[] {
  if (rows.length === 0) return [];
  // Email-or-name grouping ONLY. Matches v1 Python's `deduplicate`: all rows
  // with the same name (no email) collapse into one row, even when concurrent.
  // Concurrent same-name splitting via `assignConcurrentSubKeys` is reserved
  // for the (not-yet-ported) `apply_unique_users_override` path, where Zoom's
  // own unique-users count tells us the true person count for that name.
  // Without that ground-truth signal, the interval-scheduling heuristic
  // would over-split (an attendee who briefly disconnects and rejoins from
  // a different device shows up as concurrent and would be counted twice).
  const keys = rows.map(dedupKey);

  const groups = new Map<string, AttendeeRow[]>();
  for (let i = 0; i < rows.length; i++) {
    const k = keys[i];
    const list = groups.get(k) ?? [];
    list.push(rows[i]);
    groups.set(k, list);
  }

  const merged: AttendeeRow[] = [];
  for (const group of groups.values()) {
    const sumDuration = group.reduce((s, r) => s + (Number.isFinite(r.durationMinutes) ? r.durationMinutes : 0), 0);
    const joinTime = group.reduce((acc, r) => acc ? compareDates(acc, r.joinTime, "min") : r.joinTime, "");
    const leaveTime = group.reduce((acc, r) => acc ? compareDates(acc, r.leaveTime, "max") : r.leaveTime, "");
    merged.push({
      name: firstNonEmpty(group.map((r) => r.name)),
      email: firstNonEmpty(group.map((r) => r.email)),
      joinTime,
      leaveTime,
      durationMinutes: sumDuration,
      isGuest: firstNonEmpty(group.map((r) => r.isGuest)),
      country: mode(group.map((r) => r.country)),
    });
  }
  merged.sort((a, b) => b.durationMinutes - a.durationMinutes);
  return merged;
}

export function combineAttendees(sources: AttendeeRow[][]): AttendeeRow[] {
  const all = sources.flat();
  if (all.length === 0) return [];

  const withEmail: AttendeeRow[] = [];
  const withoutEmail: AttendeeRow[] = [];
  for (const r of all) {
    if (r.email.trim()) withEmail.push(r);
    else withoutEmail.push(r);
  }

  const byEmail = new Map<string, AttendeeRow[]>();
  for (const r of withEmail) {
    const k = r.email.trim().toLowerCase();
    const list = byEmail.get(k) ?? [];
    list.push(r);
    byEmail.set(k, list);
  }
  const mergedWithEmail: AttendeeRow[] = [];
  for (const group of byEmail.values()) {
    const sumDuration = group.reduce((s, r) => s + r.durationMinutes, 0);
    const joinTime = group.reduce((acc, r) => acc ? compareDates(acc, r.joinTime, "min") : r.joinTime, "");
    const leaveTime = group.reduce((acc, r) => acc ? compareDates(acc, r.leaveTime, "max") : r.leaveTime, "");
    mergedWithEmail.push({
      name: firstNonEmpty(group.map((r) => r.name)),
      email: firstNonEmpty(group.map((r) => r.email)),
      joinTime,
      leaveTime,
      durationMinutes: sumDuration,
      isGuest: firstNonEmpty(group.map((r) => r.isGuest)),
      country: mode(group.map((r) => r.country)),
    });
  }

  const merged = [...mergedWithEmail, ...withoutEmail];
  merged.sort((a, b) => b.durationMinutes - a.durationMinutes);
  return merged;
}
