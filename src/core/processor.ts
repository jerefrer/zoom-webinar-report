import type { AttendeeRow } from "./types";

const DT_FORMATS = [
  /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})\s+(AM|PM)$/i,
  /^(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2}):(\d{2})$/,
  /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/,
];

export function parseDateTime(s: string): Date | null {
  if (!s) return null;
  const trimmed = s.trim();
  let m = trimmed.match(DT_FORMATS[0]);
  if (m) {
    let hour = Number(m[4]);
    const ap = m[7].toUpperCase();
    if (ap === "PM" && hour < 12) hour += 12;
    if (ap === "AM" && hour === 12) hour = 0;
    return new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]),
                    hour, Number(m[5]), Number(m[6]));
  }
  m = trimmed.match(DT_FORMATS[1]);
  if (m) {
    return new Date(Number(m[3]), Number(m[1]) - 1, Number(m[2]),
                    Number(m[4]), Number(m[5]), Number(m[6]));
  }
  m = trimmed.match(DT_FORMATS[2]);
  if (m) {
    return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]),
                    Number(m[4]), Number(m[5]), Number(m[6]));
  }
  return null;
}

function dedupKey(row: AttendeeRow): string {
  const email = row.email.trim().toLowerCase();
  const name = row.name.trim().toLowerCase();
  return email ? email : `__name__${name}`;
}

function assignConcurrentSubKeys(
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
  const initialKeys = rows.map(dedupKey);
  const finalKeys = assignConcurrentSubKeys(rows, initialKeys);

  const groups = new Map<string, AttendeeRow[]>();
  for (let i = 0; i < rows.length; i++) {
    const k = finalKeys[i];
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
