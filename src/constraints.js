// All challenge rules live here. Add a rule by adding a line.
// - group: rules sharing a group are mutually exclusive in a roll (they contradict or overlap).
// - cat / sub: what the filter panel toggles on and off (sub may be null).
// - style: 'limit' (bans and caps) or 'require' (must include).
const elements = ['Pyro', 'Hydro', 'Electro', 'Cryo', 'Anemo', 'Geo', 'Dendro'];
const weapons = ['sword', 'claymore', 'polearm', 'bow', 'catalyst'];

const el = elements.flatMap((e) => {
  const k = e.toLowerCase();
  const base = { group: `el-${k}`, cat: 'element', sub: k };
  return [
    { ...base, id: `no-${k}`, text: `No ${e} characters`, style: 'limit' },
    { ...base, id: `max1-${k}`, text: `At most one ${e} character`, style: 'limit' },
    { ...base, id: `need-${k}`, text: `Must include ${/^[AE]/.test(e) ? 'an' : 'a'} ${e} character`, style: 'require' },
  ];
});

const wp = weapons.flatMap((w) => {
  const base = { group: `wp-${w}`, cat: 'weapon', sub: w };
  return [
    { ...base, id: `no-${w}`, text: `No ${w} users`, style: 'limit' },
    { ...base, id: `need-${w}`, text: `Must include a ${w} user`, style: 'require' },
  ];
});

// One group: a team can't sensibly have two rarity rules at once.
const rarity = [
  { id: 'no-5star', text: 'No 5-star characters', sub: '5star', style: 'limit' },
  { id: 'max1-5star', text: 'At most one 5-star character', sub: '5star', style: 'limit' },
  { id: 'max2-5star', text: 'At most two 5-star characters', sub: '5star', style: 'limit' },
  { id: 'no-4star', text: 'No 4-star characters', sub: '4star', style: 'limit' },
  { id: 'max1-4star', text: 'At most one 4-star character', sub: '4star', style: 'limit' },
  { id: 'min2-4star', text: 'At least two 4-star characters', sub: '4star', style: 'require' },
].map((r) => ({ ...r, group: 'rarity', cat: 'rarity' }));

const role = [
  { id: 'no-healer', text: 'No healers', group: 'role-heal', sub: 'heal', style: 'limit' },
  { id: 'need-healer', text: 'Must include a healer', group: 'role-heal', sub: 'heal', style: 'require' },
  { id: 'no-shielder', text: 'No shielders', group: 'role-shield', sub: 'shield', style: 'limit' },
  { id: 'need-shielder', text: 'Must include a shielder', group: 'role-shield', sub: 'shield', style: 'require' },
].map((r) => ({ ...r, cat: 'role' }));

const twist = [
  { id: 'c0-only', text: 'All characters at C0 (no constellations)', group: 'c0-only' },
  { id: 'no-repeat-element', text: 'No two characters share an element', group: 'no-repeat-element' },
].map((r) => ({ ...r, cat: 'twist', sub: null, style: 'limit' }));

export const CONSTRAINTS = [...el, ...rarity, ...wp, ...role, ...twist];

// What the filter panel shows. A category's subs narrow it down further.
const cap = (s) => s[0].toUpperCase() + s.slice(1);
export const CATEGORIES = [
  { id: 'element', label: 'Element', subs: elements.map((e) => ({ id: e.toLowerCase(), label: e })) },
  { id: 'rarity', label: 'Rarity', subs: [{ id: '5star', label: '5-star' }, { id: '4star', label: '4-star' }] },
  { id: 'weapon', label: 'Weapon', subs: weapons.map((w) => ({ id: w, label: cap(w) })) },
  { id: 'role', label: 'Role', subs: [{ id: 'heal', label: 'Healer' }, { id: 'shield', label: 'Shielder' }] },
  { id: 'twist', label: 'Twist', subs: [] },
];

export const STYLES = [
  { id: 'limit', label: 'Limits & bans' },
  { id: 'require', label: 'Requirements' },
];
