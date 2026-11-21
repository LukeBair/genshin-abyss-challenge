# Abyss Constraint Generator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A static web page that rolls 2-4 conflict-free, party-wide team-building rules for a self-imposed Spiral Abyss challenge, with per-row lock/reroll and a shareable URL.

**Architecture:** Pure ES modules, no build step. `constraints.js` is data, `roll.js` and `url.js` are pure logic tested with Node's built-in runner, `app.js` is the only file touching the DOM. Roll state lives in the URL query string.

**Tech Stack:** HTML/CSS/vanilla JS (ES modules), `node --test` (Node 18+, zero dependencies), GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-11-21-abyss-constraint-generator-design.md`

## Global Constraints

- No build step, no runtime or dev dependencies, no backend, no accounts.
- Constraints only: the site never builds or suggests a team. No roster tracking, no character database.
- No version-based rules (e.g. "only pre-2.0 characters") in v1.
- A roll never contains two constraints from the same `group` (no "no Pyro" + "must include Pyro").
- Roll is encoded in the URL as constraint ids; no server state.
- Rules live only in `src/constraints.js`; adding a rule must not require touching logic.
- Mobile-friendly; light/dark via `prefers-color-scheme`.
- Must work when served from a sub-path (GitHub Pages `/repo-name/`): use relative URLs only.

## Review Focus

- Requested count exceeds number of distinct groups: roll returns as many as exist, never loops forever or duplicates.
- Every row locked, then "Roll all": nothing changes, no error.
- URL contains unknown ids, duplicate ids, two ids from one group, or is empty/garbled: unknown and conflicting ids dropped, page still renders (falls back to a fresh roll if nothing valid remains).
- URL contains HTML (`?r=<img onerror=...>`): rendered text comes only from the `CONSTRAINTS` lookup via `textContent`, never from the raw URL.
- Reroll one row never produces an id already shown in another row or one sharing a group with another row.

---

### Task 1: Repo and constraint data

**Files:**
- Create: `package.json` (`{"type":"module","scripts":{"test":"node --test"}}`), `.gitignore`, `src/constraints.js`, `tests/constraints.test.js`

**Interfaces:**
- Produces: `export const CONSTRAINTS: Array<{id: string, text: string, group: string}>`

- [ ] **Step 1:** `git init -b main` in the project root; add `.gitignore` (`.DS_Store`, `node_modules/`).
- [ ] **Step 2: Write failing tests** in `tests/constraints.test.js`: `ids are unique`, `every entry has non-empty id/text/group`, `ids match /^[a-z0-9-]+$/` (they go in the URL), `at least 6 distinct groups`, `at least 20 constraints`.
- [ ] **Step 3: Run** `npm test`. Expected: FAIL (module not found).
- [ ] **Step 4: Implement `CONSTRAINTS`** in `src/constraints.js` using the spec's pool: element rules (one group per element, e.g. group `el-pyro` holding "No Pyro", "Max one Pyro", "Must include Pyro", and likewise for other elements), rarity (group `rarity`: "No 5-stars", "Max one 5-star"), weapon (group per weapon type), role (groups `role-heal`, `role-shield`), gimmicks (`c0-only`, `no-repeat-element`). Same-group entries must be mutually contradictory or redundant.
- [ ] **Step 5: Run** `npm test`. Expected: PASS.
- [ ] **Step 6: Commit** `feat: constraint data and integrity tests`.

### Task 2: Roll logic

**Files:**
- Create: `src/roll.js`, `tests/roll.test.js`

**Interfaces:**
- Consumes: `CONSTRAINTS`.
- Produces:
  - `rollAll(current: string[], locked: boolean[], count: number, rng?: () => number): string[]`: returns `min(count, distinctGroups)` ids; entries where `locked[i]` is true keep their id at index `i`; all others are replaced by fresh picks whose groups differ from every other entry. `rng` defaults to `Math.random`, returns [0,1).
  - `rerollOne(current: string[], index: number, rng?): string[]`: replaces only `current[index]`, same group rule against the other entries; if no candidate exists, returns `current` unchanged.

- [ ] **Step 1: Write failing tests** with a seeded `rng` (small LCG helper in the test file): `rollAll returns count ids with all-distinct groups` (run 200 seeds, count 2/3/4); `locked entries are preserved at their index`; `all locked returns input unchanged`; `count larger than group count is capped, no duplicates`; `rerollOne changes only the given index and respects groups` (200 seeds); `rerollOne with no candidates returns current unchanged` (use a stubbed pool or count equal to group total).
- [ ] **Step 2: Run** `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement** both functions: filter `CONSTRAINTS` to candidates whose group is not among already-held groups, pick with `rng`, repeat until the target length or candidates run out.
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `feat: conflict-free roll and reroll`.

### Task 3: URL encoding

**Files:**
- Create: `src/url.js`, `tests/url.test.js`

**Interfaces:**
- Consumes: `CONSTRAINTS`.
- Produces: `encodeRoll(ids: string[]): string` returns a query string like `?r=a,b,c` (empty array returns `""`); `decodeRoll(search: string): string[]` returns valid ids in order, dropping unknown ids, duplicates, and any id whose group is already taken by an earlier id.

- [ ] **Step 1: Write failing tests**: round-trip of a valid roll; unknown ids dropped; duplicate ids dropped; same-group second id dropped; `""`, `"?r="`, `"?r=%%%"` and `"?x=1"` all return `[]`; `"?r=<img src=x onerror=alert(1)>"` returns `[]`.
- [ ] **Step 2: Run** `npm test`. Expected: FAIL.
- [ ] **Step 3: Implement** with `URLSearchParams`.
- [ ] **Step 4: Run** `npm test`. Expected: PASS.
- [ ] **Step 5: Commit** `feat: shareable URL encoding`.

### Task 4: UI

**Files:**
- Create: `index.html`, `style.css`, `src/app.js`

**Interfaces:**
- Consumes: `rollAll`, `rerollOne`, `encodeRoll`, `decodeRoll`, `CONSTRAINTS`.

- [ ] **Step 1: Build `index.html`** with `<script type="module" src="src/app.js">`, a count selector (2/3/4, default 3), a list container, "Roll all" and "Copy link" buttons. All asset paths relative.
- [ ] **Step 2: Implement `src/app.js`**: on load, `decodeRoll(location.search)`; if empty, roll fresh. Render each row as text from a `CONSTRAINTS` id lookup using `textContent`, with a lock toggle and a reroll button. "Roll all" calls `rollAll` with the lock array; after every change call `history.replaceState` with `encodeRoll`. "Copy link" uses `navigator.clipboard.writeText(location.href)` and shows brief "Copied" feedback. Lock state is in-memory only.
- [ ] **Step 3: Style `style.css`**: color tokens on `:root`, dark overrides under `@media (prefers-color-scheme: dark)`, explicit body background, single column, 16px gutters, buttons at least 44px tall, no horizontal scroll at 375px.
- [ ] **Step 4: Verify manually** with `python3 -m http.server` and the browser pane: roll, lock a row and roll all (locked row stays), reroll a row, reload (same roll), open `/?r=<img src=x onerror=alert(1)>` (no alert, fresh roll), resize to 375px wide, toggle dark mode. Expected: all behave as described, no console errors.
- [ ] **Step 5: Commit** `feat: web UI`.

### Task 5: README and GitHub Pages

**Files:**
- Create: `README.md` (what it is, how to add a rule in `constraints.js`, `npm test`, live URL once known)

- [ ] **Step 1:** Write the README.
- [ ] **Step 2: Ask the user to confirm** before creating a public GitHub repo or pushing (outward-facing). On yes: `gh repo create genshin-abyss-challenge --public --source=. --push`, then enable Pages from `main` / root (`gh api -X POST repos/{owner}/genshin-abyss-challenge/pages -f "source[branch]=main" -f "source[path]=/"`).
- [ ] **Step 3: Verify** the live URL loads and a shared `?r=` link reproduces the roll. Expected: matches local behavior.
- [ ] **Step 4: Commit** `docs: README` and push.

AWS (S3 + CloudFront + the user's domain) is a separate follow-up, not part of this plan.
