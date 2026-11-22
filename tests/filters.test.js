import test from 'node:test';
import assert from 'node:assert/strict';
import { CONSTRAINTS, CATEGORIES, STYLES } from '../src/constraints.js';
import { buildPool, groupCount } from '../src/filters.js';
import { rollAll, rerollOne } from '../src/roll.js';
import { encodeRoll, decodeFilters } from '../src/url.js';

const lcg = (seed) => () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const poolIds = (off) => new Set(buildPool(new Set(off)).map((c) => c.id));

test('every rule has a valid category, sub and style', () => {
  for (const c of CONSTRAINTS) {
    const cat = CATEGORIES.find((x) => x.id === c.cat);
    assert.ok(cat, c.id);
    assert.ok(c.sub === null || cat.subs.some((s) => s.id === c.sub), c.id);
    assert.ok(STYLES.some((s) => s.id === c.style), c.id);
  }
});

test('buildPool: no filters keeps everything', () => {
  assert.equal(buildPool(new Set()).length, CONSTRAINTS.length);
});

test('buildPool: category, sub and style switches', () => {
  assert.ok(CONSTRAINTS.filter((c) => c.cat === 'element').every((c) => !poolIds(['element']).has(c.id)));
  const noPyro = poolIds(['pyro']);
  assert.ok(!noPyro.has('no-pyro') && !noPyro.has('need-pyro'));
  assert.ok(noPyro.has('no-hydro') && noPyro.has('no-5star'));
  const noReq = buildPool(new Set(['require']));
  assert.ok(noReq.length > 0 && noReq.every((c) => c.style === 'limit'));
  assert.ok(!poolIds(['5star']).has('max1-5star') && poolIds(['5star']).has('max1-4star'));
});

test('rollAll and rerollOne only draw from the pool', () => {
  const off = new Set(['element', 'require']);
  const pool = buildPool(off);
  const ok = new Set(pool.map((c) => c.id));
  for (let s = 1; s <= 200; s++) {
    const r = rollAll([], [], 4, lcg(s), pool);
    assert.ok(r.every((id) => ok.has(id)));
    const next = rerollOne(r, 2, lcg(s + 999), pool);
    assert.ok(ok.has(next[2]));
  }
});

test('small pool yields fewer rules, empty pool yields none', () => {
  const only = buildPool(new Set(['element', 'rarity', 'weapon', 'role', 'twist']));
  assert.equal(only.length, 0);
  assert.deepEqual(rollAll([], [], 3, lcg(1), only), []);
  const rarityOnly = buildPool(new Set(['element', 'weapon', 'role', 'twist']));
  assert.equal(groupCount(rarityOnly), 1);
  assert.equal(rollAll([], [], 4, lcg(2), rarityOnly).length, 1);
});

test('locked rule outside the pool is kept', () => {
  const pool = buildPool(new Set(['element']));
  const r = rollAll(['need-pyro', 'x'], [true, false], 3, lcg(5), pool);
  assert.equal(r[0], 'need-pyro');
});

test('filter tokens round trip; junk is dropped', () => {
  assert.equal(encodeRoll([[], []], []), '');
  assert.equal(encodeRoll([[], []], ['pyro']), '?f=pyro');
  assert.equal(encodeRoll([['no-5star'], []], ['pyro', 'require']), '?r=no-5star&f=pyro,require');
  assert.equal(encodeRoll([['no-5star'], ['no-pyro']], ['require']), '?r=no-5star&s=no-pyro&f=require');
  assert.deepEqual(decodeFilters('?r=no-5star&f=pyro,require'), ['pyro', 'require']);
  assert.deepEqual(decodeFilters('?f=bogus,pyro,pyro'), ['pyro']);
  for (const s of ['', '?f=', '?f=<script>alert(1)</script>', '?x=1']) assert.deepEqual(decodeFilters(s), []);
});
