// All challenge rules live here. Add a rule by adding a line.
// Rules sharing a `group` are mutually exclusive in a roll (they contradict or overlap).
const elements = ['Pyro', 'Hydro', 'Electro', 'Cryo', 'Anemo', 'Geo', 'Dendro'];
const weapons = ['sword', 'claymore', 'polearm', 'bow', 'catalyst'];

const el = elements.flatMap((e) => {
  const k = e.toLowerCase();
  return [
    { id: `no-${k}`, text: `No ${e} characters`, group: `el-${k}` },
    { id: `max1-${k}`, text: `At most one ${e} character`, group: `el-${k}` },
    { id: `need-${k}`, text: `Must include ${/^[AE]/.test(e) ? 'an' : 'a'} ${e} character`, group: `el-${k}` },
  ];
});

const wp = weapons.flatMap((w) => [
  { id: `no-${w}`, text: `No ${w} users`, group: `wp-${w}` },
  { id: `need-${w}`, text: `Must include a ${w} user`, group: `wp-${w}` },
]);

export const CONSTRAINTS = [
  ...el,
  { id: 'no-5star', text: 'No 5-star characters', group: 'rarity' },
  { id: 'max1-5star', text: 'At most one 5-star character', group: 'rarity' },
  ...wp,
  { id: 'no-healer', text: 'No healers', group: 'role-heal' },
  { id: 'need-healer', text: 'Must include a healer', group: 'role-heal' },
  { id: 'no-shielder', text: 'No shielders', group: 'role-shield' },
  { id: 'need-shielder', text: 'Must include a shielder', group: 'role-shield' },
  { id: 'c0-only', text: 'All characters at C0 (no constellations)', group: 'c0-only' },
  { id: 'no-repeat-element', text: 'No two characters share an element', group: 'no-repeat-element' },
];
