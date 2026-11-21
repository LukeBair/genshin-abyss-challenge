import { CONSTRAINTS } from './constraints.js';

const groupById = new Map(CONSTRAINTS.map((c) => [c.id, c.group]));

function pick(heldGroups, excludeId, rng, pool) {
  const candidates = pool.filter((c) => !heldGroups.has(c.group) && c.id !== excludeId);
  return candidates.length ? candidates[Math.floor(rng() * candidates.length)].id : null;
}

// Rolls up to `count` ids drawn from `pool`. Locked slots keep their id (even if the pool has since changed).
// Returns fewer than `count` when the pool runs out of distinct groups.
export function rollAll(current, locked, count, rng = Math.random, pool = CONSTRAINTS) {
  const result = [];
  const held = new Set();
  for (let i = 0; i < count; i++) {
    if (locked[i] && groupById.has(current[i]) && !held.has(groupById.get(current[i]))) {
      result[i] = current[i];
      held.add(groupById.get(current[i]));
    }
  }
  for (let i = 0; i < count; i++) {
    if (result[i]) continue;
    const id = pick(held, null, rng, pool);
    if (id) {
      result[i] = id;
      held.add(groupById.get(id));
    }
  }
  return result.filter(Boolean);
}

// Replaces one row with a different id from `pool` whose group isn't used by the other rows.
export function rerollOne(current, index, rng = Math.random, pool = CONSTRAINTS) {
  const held = new Set(current.filter((_, i) => i !== index).map((id) => groupById.get(id)));
  const id = pick(held, current[index], rng, pool);
  if (!id) return current;
  const next = [...current];
  next[index] = id;
  return next;
}
