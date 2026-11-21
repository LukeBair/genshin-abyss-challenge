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
    if (c.group.startsWith('el-')) li.classList.add(`tone-${c.group.slice(3)}`);
    li.classList.toggle('locked', !!locked[i]);
    if (animate === 'all' || animate === i) {
      li.classList.add('reveal');
      li.style.setProperty('--i', animate === 'all' ? i : 0);
    }

    const num = document.createElement('div');
    num.className = 'num';
    num.textContent = ROMAN[i];

    const kind = document.createElement('div');
    kind.className = 'kind';
    kind.textContent = kindOf(c.group);

    const text = document.createElement('div');
    text.className = 'text';
    text.textContent = c.text;

    const lock = document.createElement('button');
    lock.className = 'icon';
    lock.append(icon(locked[i] ? 'i-lock-closed' : 'i-lock'));
    lock.setAttribute('aria-pressed', String(!!locked[i]));
    lock.setAttribute('aria-label', locked[i] ? 'Unlock rule' : 'Lock rule');
    lock.onclick = () => { locked[i] = !locked[i]; render(); };

    const re = document.createElement('button');
    re.className = 'icon';
    re.append(icon('i-reroll'));
    re.setAttribute('aria-label', 'Reroll this rule');
    re.onclick = () => { ids = rerollOne(ids, i); locked[i] = false; sync(); render(i); };

    const ctrl = document.createElement('div');
    ctrl.className = 'ctrl';
    ctrl.append(lock, re);

    li.append(num, kind, text, ctrl);
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

// Starfield
const sky = document.getElementById('sky');
for (let i = 0; i < 70; i++) {
  const s = document.createElement('i');
  s.style.left = `${Math.random() * 100}%`;
  s.style.top = `${Math.random() * 100}%`;
  s.style.setProperty('--d', `${3 + Math.random() * 4}s`);
  s.style.setProperty('--delay', `${Math.random() * 4}s`);
  if (Math.random() < 0.2) { s.style.width = s.style.height = '3px'; }
  sky.append(s);
}

setCount(count);
sync();
render('all');
