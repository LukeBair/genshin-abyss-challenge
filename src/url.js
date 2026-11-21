import { CONSTRAINTS } from './constraints.js';
import { VALID_TOKENS } from './filters.js';

const groupById = new Map(CONSTRAINTS.map((c) => [c.id, c.group]));

// ?r=<rule ids>&f=<switched-off filter tokens>; either part is omitted when empty.
export function encodeRoll(ids, off = []) {
  const parts = [];
  if (ids.length) parts.push(`r=${ids.join(',')}`);
  if (off.length) parts.push(`f=${off.join(',')}`);
  return parts.length ? `?${parts.join('&')}` : '';
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

// Returns only known filter tokens, deduplicated.
export function decodeFilters(search) {
  const raw = new URLSearchParams(search).get('f');
  if (!raw) return [];
  return [...new Set(raw.split(',').filter((t) => VALID_TOKENS.has(t)))];
}
