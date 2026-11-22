import { CONSTRAINTS } from './constraints.js';
import { VALID_TOKENS } from './filters.js';

const groupById = new Map(CONSTRAINTS.map((c) => [c.id, c.group]));
const HALF_KEYS = ['r', 's']; // first half, second half

// ?r=<first half ids>&s=<second half ids>&f=<switched-off filter tokens>; empty parts are omitted.
export function encodeRoll(halves, off = []) {
  const parts = [];
  halves.forEach((ids, i) => {
    if (ids.length) parts.push(`${HALF_KEYS[i]}=${ids.join(',')}`);
  });
  if (off.length) parts.push(`f=${off.join(',')}`);
  return parts.length ? `?${parts.join('&')}` : '';
}

// Returns only known ids for one half, no duplicates, no two from the same group.
export function decodeRoll(search, key = 'r') {
  const raw = new URLSearchParams(search).get(key);
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

// Returns only known filter tokens, deduplicated.
export function decodeFilters(search) {
  const raw = new URLSearchParams(search).get('f');
  if (!raw) return [];
  return [...new Set(raw.split(',').filter((t) => VALID_TOKENS.has(t)))];
}
