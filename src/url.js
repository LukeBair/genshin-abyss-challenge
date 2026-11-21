import { CONSTRAINTS } from './constraints.js';

const groupById = new Map(CONSTRAINTS.map((c) => [c.id, c.group]));

export function encodeRoll(ids) {
  return ids.length ? `?r=${ids.join(',')}` : '';
}

// Returns only known ids, no duplicates, no two from the same group.
export function decodeRoll(search) {
  const raw = new URLSearchParams(search).get('r');
  if (!raw) return [];
  const seen = new Set();
  const out = [];
  for (const id of raw.split(',')) {
    const g = groupById.get(id);
    if (g === undefined || seen.has(g)) continue;
    seen.add(g);
    out.push(id);
  }
  return out;
}
