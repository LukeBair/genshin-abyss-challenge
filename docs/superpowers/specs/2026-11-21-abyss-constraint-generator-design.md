# Genshin Abyss Constraint Generator: Design

## Intent
A web page that rolls random team-building *rules* for a self-imposed Spiral Abyss challenge. It never builds the team; the player does, under the rules. Prior art (Pustur's randomizer, genshin-teamspin) rolls teams; none roll constraints.

## Goals
- One click rolls 2-4 constraints for the whole party.
- Per-row lock and reroll; "Roll all" respects locks.
- Shareable link: the roll is encoded in the URL.
- Zero maintenance when new characters release.
- Free hosting on GitHub Pages now; AWS (S3 + CloudFront, user's existing domain) investigated afterward.

## Non-goals
- Building or suggesting teams.
- Roster tracking or "characters I own" (user decision: too tedious, irrelevant since the site doesn't pick the team).
- Character database, accounts, backend, saved history.
- Version-based rules ("only pre-2.0 characters"); they'd need a character list. Possible later.

## Anti-goals
- Impossible or self-contradictory rolls (e.g. "no Pyro" + "must include Pyro").
- Anything needing upkeep each patch.

## Constraint pool (v1, builder may extend)
Element (max N of an element, none of an element, must include an element), rarity (no 5-stars, max one 5-star), weapon type (no bows, must include a catalyst), role (no healer, no shielder), plus a few gimmicks (C0 only, no repeated element). Each rule: id, text, a conflict group / mutual-exclusion tag.

## Approaches considered
- **A. Plain HTML/CSS/JS, no build (chosen).** One page + `constraints.js`. Deploys to Pages by pushing files. Trade-off: rewrite if it ever needs accounts or history.
- B. Vite + Svelte/React with a GitHub Action build. Nicer state/animation; unneeded build pipeline for one button.
- C. AWS hosting is a hosting choice, not an app choice; works with A. Start on Pages, move later.

## Decided by user
Constraints only; roster-blind; approach A; GitHub Pages first, AWS afterward with their domain.

## Builder's calls (user can override)
- Standalone repo at `~/Code/genshin-abyss-challenge`, separate from CS460.
- Rule data in one `constraints.js` so rules are added without touching logic.
- Roll encoded in URL as rule ids (query string or hash), so no server state.
- Contradiction avoidance via conflict-group tags checked at roll time.
- Mobile-friendly, light/dark via `prefers-color-scheme`.
