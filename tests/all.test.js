import test from 'node:test';
import assert from 'node:assert/strict';
import { CONSTRAINTS } from '../src/constraints.js';
import { rollAll, rerollOne } from '../src/roll.js';
import { encodeRoll, decodeRoll } from '../src/url.js';

const groupOf = (id) => CONSTRAINTS.find((c) => c.id === id).group;
const groups = (ids) => ids.map(groupOf);
const distinct = (ids) => new Set(groups(ids)).size === ids.length;
const lcg = (seed) => () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const totalGroups = new Set(CONSTRAINTS.map((c) => c.group)).size;

test('constraint data is well formed', () => {
  const ids = CONSTRAINTS.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const c of CONSTRAINTS) {
    assert.match(c.id, /^[a-z0-9-]+$/);
    assert.ok(c.text && c.group);
  }
  assert.ok(totalGroups >= 6 && CONSTRAINTS.length >= 20);
});

test('rollAll gives count distinct-group ids', () => {
  for (let s = 1; s <= 200; s++) for (const n of [2, 3, 4]) {
    const r = rollAll([], [], n, lcg(s));
    assert.equal(r.length, n);
    assert.ok(distinct(r));
  }
});

test('locked entries survive rollAll; all locked is unchanged', () => {
  const r = rollAll(['no-5star', 'need-healer', 'c0-only'], [true, false, true], 3, lcg(7));
  assert.equal(r[0], 'no-5star');
  assert.equal(r[2], 'c0-only');
  const same = ['no-5star', 'c0-only'];
  assert.deepEqual(rollAll(same, [true, true], 2, lcg(1)), same);
});

test('count above group total is capped without duplicates', () => {
  const r = rollAll([], [], 999, lcg(3));
  assert.equal(r.length, totalGroups);
  assert.ok(distinct(r));
});

test('rerollOne changes only its index and respects groups', () => {
  for (let s = 1; s <= 200; s++) {
    const cur = rollAll([], [], 3, lcg(s));
    const next = rerollOne(cur, 1, lcg(s + 1000));
    assert.equal(next[0], cur[0]);
    assert.equal(next[2], cur[2]);
    assert.notEqual(next[1], cur[1]);
    assert.ok(distinct(next));
  }
});

test('url round trip and hostile input', () => {
  const ids = ['no-5star', 'need-healer', 'c0-only'];
  assert.deepEqual(decodeRoll(encodeRoll([ids, []])), ids);
  assert.equal(encodeRoll([[], []]), '');
  assert.equal(encodeRoll([['no-5star'], ['no-pyro']]), '?r=no-5star&s=no-pyro');
  assert.deepEqual(decodeRoll('?r=no-5star&s=no-pyro,need-pyro', 's'), ['no-pyro']);
  assert.deepEqual(decodeRoll('?r=no-5star', 's'), []);
  assert.deepEqual(decodeRoll('?s=<img src=x onerror=alert(1)>', 's'), []);
  assert.deepEqual(decodeRoll('?r=bogus,no-5star,no-5star'), ['no-5star']);
  assert.deepEqual(decodeRoll('?r=no-pyro,need-pyro'), ['no-pyro']);
  for (const s of ['', '?r=', '?r=%%%', '?x=1', '?r=<img src=x onerror=alert(1)>']) {
    assert.deepEqual(decodeRoll(s), []);
  }
});
