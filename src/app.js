import { CONSTRAINTS, CATEGORIES, STYLES } from './constraints.js';
import { rollAll, rerollOne } from './roll.js';
import { encodeRoll, decodeRoll, decodeFilters } from './url.js';
import { buildPool, groupCount } from './filters.js';

const byId = new Map(CONSTRAINTS.map((c) => [c.id, c]));
const catLabel = new Map(CATEGORIES.map((c) => [c.id, c.label]));
const list = document.getElementById('list');
const countBtns = [...document.querySelectorAll('#count button')];
const copyBtn = document.getElementById('copy');
const rollBtn = document.getElementById('roll');
const soundBtn = document.getElementById('sound');
const filterBody = document.getElementById('filter-body');
const filterNote = document.getElementById('filter-note');
const msg = document.getElementById('msg');
const ROMAN = ['I', 'II', 'III', 'IV'];

// ---- state ----
let off = new Set(decodeFilters(location.search)); // switched-off filter tokens
let pool = buildPool(off);
let count = 3;
let ids = decodeRoll(location.search);
let locked = [];
if (ids.length) count = Math.min(4, Math.max(2, ids.length));
else ids = rollAll([], [], count, Math.random, pool);

// ---- sound: a soft paper flick and thud, synthesised (no audio files) ----
let audio = null;
let soundOn = true;
try { soundOn = localStorage.getItem('sound') !== 'off'; } catch {}

function ensureAudio() {
  if (!audio) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) audio = new AC();
  }
  if (audio && audio.state === 'suspended') audio.resume();
}
['pointerdown', 'keydown'].forEach((e) => document.addEventListener(e, ensureAudio, { passive: true }));

function flipSound(delayMs = 0) {
  if (!soundOn || !audio || audio.state !== 'running') return;
  const t = audio.currentTime + delayMs / 1000;
  const len = Math.floor(audio.sampleRate * 0.07);
  const buf = audio.createBuffer(1, len, audio.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len) ** 2;
  const src = audio.createBufferSource();
  src.buffer = buf;
  const band = audio.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = 2800 + Math.random() * 600;
  band.Q.value = 0.9;
  const g = audio.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.09, t + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
  src.connect(band).connect(g).connect(audio.destination);
  src.start(t);
  const o = audio.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(190, t + 0.045);
  o.frequency.exponentialRampToValueAtTime(110, t + 0.11);
  const og = audio.createGain();
  og.gain.setValueAtTime(0.0001, t + 0.045);
  og.gain.exponentialRampToValueAtTime(0.05, t + 0.052);
  og.gain.exponentialRampToValueAtTime(0.0001, t + 0.13);
  o.connect(og).connect(audio.destination);
  o.start(t + 0.045);
  o.stop(t + 0.14);
}

function refreshSoundBtn() {
  soundBtn.textContent = soundOn ? 'Sound on' : 'Sound off';
  soundBtn.setAttribute('aria-pressed', String(soundOn));
}
soundBtn.onclick = () => {
  soundOn = !soundOn;
  try { localStorage.setItem('sound', soundOn ? 'on' : 'off'); } catch {}
  refreshSoundBtn();
  if (soundOn) flipSound();
};

// ---- helpers ----
function setCount(n) {
  count = n;
  countBtns.forEach((b) => b.setAttribute('aria-checked', String(Number(b.dataset.n) === n)));
}

function sync() {
  history.replaceState(null, '', location.pathname + encodeRoll(ids, [...off]));
}

function icon(id) {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const u = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  u.setAttribute('href', `#${id}`);
  s.append(u);
  return s;
}

// ---- filter panel ----
const chips = [];
function chip(token, label, toneClass) {
  const b = document.createElement('button');
  b.type = 'button';
  b.className = `chip${toneClass ? ` ${toneClass}` : ''}`;
  b.textContent = label;
  b.dataset.token = token;
  b.onclick = () => {
    if (off.has(token)) off.delete(token);
    else off.add(token);
    applyFilters();
  };
  chips.push(b);
  return b;
}

function frow(label, chipEls, catId) {
  const r = document.createElement('div');
  r.className = 'frow';
  if (catId) r.dataset.cat = catId;
  const l = document.createElement('span');
  l.className = 'flabel';
  l.textContent = label;
  const w = document.createElement('div');
  w.className = 'chips';
  w.append(...chipEls);
  r.append(l, w);
  return r;
}

function buildFilters() {
  filterBody.append(frow('Rule types', CATEGORIES.map((c) => chip(c.id, c.label))));
  for (const c of CATEGORIES) {
    if (!c.subs.length) continue;
    filterBody.append(frow(c.label, c.subs.map((s) => chip(s.id, s.label, c.id === 'element' ? `tone-${s.id}` : '')), c.id));
  }
  filterBody.append(frow('Kind of rule', STYLES.map((s) => chip(s.id, s.label))));
  const reset = document.createElement('button');
  reset.type = 'button';
  reset.className = 'reset';
  reset.textContent = 'Reset filters';
  reset.onclick = () => { off = new Set(); applyFilters(); };
  filterBody.append(reset);
}

function refreshFilters() {
  chips.forEach((b) => b.setAttribute('aria-pressed', String(!off.has(b.dataset.token))));
  filterBody.querySelectorAll('.frow[data-cat]').forEach((r) => { r.hidden = off.has(r.dataset.cat); });
  filterNote.textContent = off.size ? `${pool.length} of ${CONSTRAINTS.length} rules` : 'all rules';
  const groups = groupCount(pool);
  rollBtn.disabled = groups === 0;
  msg.hidden = groups >= count;
  msg.textContent = groups === 0 ? 'No rules match these filters. Turn some back on.' : `Only ${groups} rule${groups === 1 ? '' : 's'} fit these filters.`;
}

// Replace unlocked rows that no longer fit; drop any that can't be replaced. Locked rows always stay.
function applyFilters() {
  pool = buildPool(off);
  const ok = new Set(pool.map((c) => c.id));
  let next = [...ids];
  next.forEach((id, i) => {
    if (!locked[i] && !ok.has(id)) next = rerollOne(next, i, Math.random, pool);
  });
  const keep = next.map((id, i) => locked[i] || ok.has(id));
  locked = next.map((_, i) => !!locked[i]).filter((_, i) => keep[i]);
  ids = next.filter((_, i) => keep[i]);
  const empty = ids.length === 0 && pool.length > 0; // nothing left on the table: deal a fresh hand
  if (empty) {
    ids = rollAll([], [], count, Math.random, pool);
    locked = [];
  }
  sync();
  render(empty ? 'all' : null);
  refreshFilters();
}

// ---- cards ----
// animate: 'all' | row index | null
function render(animate = null) {
  list.replaceChildren();
  ids.forEach((id, i) => {
    const c = byId.get(id);
    const li = document.createElement('li');
    li.classList.add(`tone-${c.cat === 'element' ? c.sub : c.cat}`);
    li.classList.toggle('locked', !!locked[i]);
    if (animate === 'all' || animate === i) {
      li.classList.add('reveal');
      li.style.setProperty('--i', animate === 'all' ? i : 0);
    }

    const meta = document.createElement('div');
    meta.className = 'meta';
    const numeral = document.createElement('b');
    numeral.textContent = ROMAN[i];
    const kindEl = document.createElement('span');
    kindEl.textContent = catLabel.get(c.cat);
    meta.append(numeral, kindEl);

    const text = document.createElement('div');
    text.className = 'text';
    text.textContent = c.text;

    const lock = document.createElement('button');
    lock.className = 'seal';
    lock.append(icon('star'));
    lock.setAttribute('aria-pressed', String(!!locked[i]));
    lock.setAttribute('aria-label', locked[i] ? 'Break seal (unlock rule)' : 'Seal rule (lock it)');
    lock.onclick = () => { locked[i] = !locked[i]; render(); };

    const re = document.createElement('button');
    re.className = 'reroll';
    re.append(icon('i-reroll'));
    re.setAttribute('aria-label', 'Redraw this rule');
    re.onclick = () => { ids = rerollOne(ids, i, Math.random, pool); locked[i] = false; sync(); render(i); };

    const ctrl = document.createElement('div');
    ctrl.className = 'ctrl';
    ctrl.append(lock, re);

    li.append(meta, text, ctrl);
    list.append(li);
  });
  // Flip sounds line up with the staggered CSS animation (100ms apart, landing ~120ms in).
  if (animate === 'all') ids.forEach((_, i) => flipSound(i * 100 + 120));
  else if (typeof animate === 'number') flipSound(120);
}

function rollNow() {
  ids = rollAll(ids, locked, count, Math.random, pool);
  locked = locked.slice(0, ids.length);
  sync();
  render('all');
  refreshFilters();
}

rollBtn.onclick = rollNow;
countBtns.forEach((b) => (b.onclick = () => { setCount(Number(b.dataset.n)); rollNow(); }));

copyBtn.onclick = async () => {
  try {
    await navigator.clipboard.writeText(location.href);
    copyBtn.textContent = 'Copied';
  } catch {
    copyBtn.textContent = 'Copy failed';
  }
  setTimeout(() => (copyBtn.textContent = 'Copy link'), 1500);
};

buildFilters();
refreshSoundBtn();
setCount(count);
sync();
render('all');
refreshFilters();
