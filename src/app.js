import { CONSTRAINTS } from './constraints.js';
import { rollAll, rerollOne } from './roll.js';
import { encodeRoll, decodeRoll } from './url.js';

const byId = new Map(CONSTRAINTS.map((c) => [c.id, c]));
const list = document.getElementById('list');
const countBtns = [...document.querySelectorAll('#count button')];
const copyBtn = document.getElementById('copy');
const ROMAN = ['I', 'II', 'III', 'IV'];

const kindOf = (g) =>
  g.startsWith('el-') ? 'Element' : g.startsWith('wp-') ? 'Weapon' : g.startsWith('role-') ? 'Role' : g === 'rarity' ? 'Rarity' : 'Twist';

let count = 3;
let ids = decodeRoll(location.search);
let locked = [];
if (ids.length) count = Math.min(4, Math.max(2, ids.length));
else ids = rollAll([], [], count);

function setCount(n) {
  count = n;
  countBtns.forEach((b) => b.setAttribute('aria-checked', String(Number(b.dataset.n) === n)));
}

function sync() {
  history.replaceState(null, '', location.pathname + encodeRoll(ids));
}

function icon(id) {
  const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  const u = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  u.setAttribute('href', `#${id}`);
  s.append(u);
  return s;
}

// animate: 'all' | row index | null
function render(animate = null) {
  list.replaceChildren();
  ids.forEach((id, i) => {
    const c = byId.get(id);
    const li = document.createElement('li');
    li.classList.add(`tone-${c.group.startsWith('el-') ? c.group.slice(3) : kindOf(c.group).toLowerCase()}`);
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
    kindEl.textContent = kindOf(c.group);
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
    re.setAttribute('aria-label', 'Reroll this rule');
    re.onclick = () => { ids = rerollOne(ids, i); locked[i] = false; sync(); render(i); };

    const ctrl = document.createElement('div');
    ctrl.className = 'ctrl';
    ctrl.append(lock, re);

    li.append(meta, text, ctrl);
    list.append(li);
  });
}

function rollNow() {
  ids = rollAll(ids, locked, count);
  locked = locked.slice(0, ids.length);
  sync();
  render('all');
}

document.getElementById('roll').onclick = rollNow;
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

setCount(count);
sync();
render('all');
