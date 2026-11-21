# Abyss Challenge Roller

Rolls random team-building rules for a self-imposed Genshin Impact Spiral Abyss run. It doesn't build the team; you do, under the rules.

- Roll 2-4 rules, lock the ones you like, reroll single rows.
- Rolls never contradict themselves (e.g. "No Pyro" + "Must include Pyro").
- The roll is in the URL, so "Copy link" shares the exact challenge.
- Static site, no build step, no dependencies.

## Run locally

```bash
python3 -m http.server 8000   # then open http://localhost:8000
npm test                      # Node 18+
```

## Add a rule

Edit `src/constraints.js`. Rules in the same `group` are mutually exclusive in a roll. Ids must match `[a-z0-9-]+` (they appear in URLs).
