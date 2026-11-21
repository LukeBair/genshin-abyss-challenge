import { CONSTRAINTS } from './constraints.js';

const groupById = new Map(CONSTRAINTS.map((c) => [c.id, c.group]));
const groupCount = new Set(CONSTRAINTS.map((c) => c.group)).size;

function pick(heldGroups, excludeId, rng) {
  const pool = CONSTRAINTS.filter((c) => !heldGroups.has(c.group) && c.id !== excludeId);
  return pool.length ? pool[Math.floor(rng() * pool.length)].id : null;
}

// Rolls up to `count` ids (capped at the number of groups). Locked slots keep their id.
export function rollAll(current, locked, count, rng = Math.random) {
  const target = Math.min(count, groupCount);
  const result = [];
  const held = new Set();
  for (let i = 0; i < target; i++) {
    if (locked[i] && groupById.has(current[i]) && !held.has(groupById.get(current[i]))) {
      result[i] = current[i];
      held.add(groupById.get(current[i]));
    }
  }
  for (let i = 0; i < target; i++) {
    if (result[i]) continue;
    const id = pick(held, null, rng);
    if (id) {
      result[i] = id;
      held.add(groupById.get(id));
    }
  }
  return result.filter(Boolean);
}

// Replaces one row with a different id whose group isn't used by the other rows.
export function rerollOne(current, index, rng = Math.random) {
  const held = new Set(current.filter((_, i) => i !== index).map((id) => groupById.get(id)));
  const id = pick(held, current[index], rng);
  if (!id) return current;
  const next = [...current];
  next[index] = id;
  return next;
}
