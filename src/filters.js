import { CONSTRAINTS, CATEGORIES, STYLES } from './constraints.js';

// A filter is a set of switched-OFF tokens: category ids, sub ids (pyro, sword, 5star...) and style ids.
// Empty set = every rule eligible, which keeps shared links short.
export const VALID_TOKENS = new Set([
  ...CATEGORIES.map((c) => c.id),
  ...CATEGORIES.flatMap((c) => c.subs.map((s) => s.id)),
  ...STYLES.map((s) => s.id),
]);

export function isEligible(rule, off) {
  return !off.has(rule.cat) && !(rule.sub && off.has(rule.sub)) && !off.has(rule.style);
}

export function buildPool(off) {
  return CONSTRAINTS.filter((c) => isEligible(c, off));
}

export function groupCount(pool) {
  return new Set(pool.map((c) => c.group)).size;
}
