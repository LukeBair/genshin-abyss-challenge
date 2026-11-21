import { CONSTRAINTS } from './constraints.js';
import { rollAll, rerollOne } from './roll.js';
import { encodeRoll, decodeRoll } from './url.js';

const textById = new Map(CONSTRAINTS.map((c) => [c.id, c.text]));
const list = document.getElementById('list');
const countSel = document.getElementById('count');
const copyBtn = document.getElementById('copy');

let ids = decodeRoll(location.search);
let locked = [];
if (ids.length) countSel.value = String(Math.min(4, Math.max(2, ids.length)));
else ids = rollAll([], [], Number(countSel.value));

function sync() {
  history.replaceState(null, '', location.pathname + encodeRoll(ids));
}

function render() {
  list.replaceChildren();
  ids.forEach((id, i) => {
    const li = document.createElement('li');
    li.classList.toggle('locked', !!locked[i]);

    const span = document.createElement('span');
    span.className = 'text';
    span.textContent = textById.get(id);

    const lock = document.createElement('button');
    lock.textContent = locked[i] ? '🔒' : '🔓';
    lock.setAttribute('aria-pressed', String(!!locked[i]));
    lock.setAttribute('aria-label', locked[i] ? 'Unlock rule' : 'Lock rule');
    lock.onclick = () => { locked[i] = !locked[i]; render(); };

    const re = document.createElement('button');
    re.textContent = '🎲';
    re.setAttribute('aria-label', 'Reroll this rule');
    re.onclick = () => { ids = rerollOne(ids, i); locked[i] = false; sync(); render(); };

    li.append(span, lock, re);
    list.append(li);
  });
}

document.getElementById('roll').onclick = () => {
  ids = rollAll(ids, locked, Number(countSel.value));
  locked = locked.slice(0, ids.length);
  sync(); render();
};
countSel.onchange = () => document.getElementById('roll').click();

copyBtn.onclick = async () => {
  try {
    await navigator.clipboard.writeText(location.href);
    copyBtn.textContent = 'Copied!';
  } catch {
    copyBtn.textContent = 'Copy failed';
  }
  setTimeout(() => (copyBtn.textContent = 'Copy link'), 1500);
};

sync();
render();
