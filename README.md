# Market Dimensions — site

Public website around the Formation Vitals Observatory. Hugo static site, GitHub Pages,
live data read client-side from the public `icburg27/vitals-machine` repo.

**A live reading of the market's body.** Operated under the AI Formation Governance
Standard; an instrument of The AI Governance Company.

## Layout
- `content/` — pages. `field-guide/` is the theory curriculum; `blog/` essays; `readings/` the monthly letter archive.
- `layouts/` — templates. `partials/manifold.html` and `partials/gauge.html` are the two v1 visualizations.
- `assets/js/md.js` — data layer (live fetch → baked fallback). `manifold.js`, `gauge.js`, `charts.js`, `ledger.js` render.
- `tools/build_frames.py` — precomputes Breathing Manifold frames (live + 2008 + COVID replays) and `baked.json`. Real data only, deterministic.
- `static/data/` — committed output of the tool. Refreshed by the Saturday 14:30 UTC workflow after the machine's weekly-metrics train.
- `.github/workflows/deploy.yml` — build + deploy to Pages; scheduled refresh.
- `docs/definition-of-ready.md` — the v1 DoR and packet plan.

## Local
```
pip install -r tools/requirements.txt
VITALS_MACHINE_DIR=../vitals-machine python tools/build_frames.py   # or omit to pull from GitHub raw
hugo server
```

## Doctrine
- Never modify `ledger/grades.csv` in the machine repo. The site renders it as found.
- Every page carrying vitals or portfolio numbers carries the disclaimer. The paper portfolio is always labeled as a paper experiment.
- Nothing synthetic in any visualization. Every frame is replayable against committed data.
- Metric definitions change only at quarterly review.

## Deploy checklist (one time)
1. Create repo `market-dimensions` (public), push this tree.
2. Settings → Pages → Source: GitHub Actions.
3. Settings → Variables → `SITE_URL` = your final URL (with trailing slash). Update `baseURL` in `hugo.toml` to match.
4. Custom domain: add `static/CNAME` with the domain; set DNS per GitHub Pages docs.
5. Newsletter: create the Buttondown newsletter and set `subscribe_url` in `hugo.toml`.
