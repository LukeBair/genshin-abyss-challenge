# Abyss Challenge Roller

Live: https://lukebair.github.io/genshin-abyss-challenge/

Rolls random team-building rules for a self-imposed Genshin Impact Spiral Abyss run. It doesn't build the team; you do, under the rules.

- Two rows of rules, one per Abyss half, each with its own seals and redraw.
- Draw 2-4 rules per half, seal the ones you like, redraw single cards.
- Filters choose which kinds of rules can appear: rule types, individual elements/weapons/rarities/roles, and limits vs requirements. They're saved in the share link.
- A soft card-flip sound (synthesised, toggle at the bottom).
- Rolls never contradict themselves (e.g. "No Pyro" + "Must include Pyro").
- The roll is in the URL, so "Copy link" shares the exact challenge.
- Static site, no build step, no dependencies.

## Run locally

```bash
python3 -m http.server 8000   # then open http://localhost:8000
npm test                      # Node 18+
```

## Add a rule

Edit `src/constraints.js`. Rules in the same `group` are mutually exclusive in a roll; `cat`, `sub` and `style` decide which filter chips switch a rule on or off. Ids must match `[a-z0-9-]+` (they appear in URLs).
