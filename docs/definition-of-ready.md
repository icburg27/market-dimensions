# Market Dimensions — Definition of Ready (v1 / M2 "public foundation")

Drafted 2026-09-05 by the build seat (Caleb). CEO confirms or amends each line before staging goes to DNS.

## Decided (2026-09-05)
- **Audience:** the market-curious reader who will subscribe to a monthly letter; secondarily TAGC prospects who need to see a governed autonomous system running. TAGC's positioning is served by the About page and the foundation-stone line, not by the masthead.
- **Property / instrument / letter:** Market Dimensions / Formation Vitals Observatory / The Reading. Standalone brand, TAGC-attested.
- **Repo visibility:** vitals-machine stays public. The site reads live from raw endpoints; baked fallback at build.
- **Newsletter promise:** WEEKLY short letter every Saturday (after the 13:00 UTC metrics train) + full monthly reading last Saturday + tripwire notes. Free tier only at launch. First weekly letter: Sat Sep 12, 2026.
- **Compliance voice:** every page carrying vitals or portfolio numbers carries the disclaimer partial; the paper portfolio is labeled a paper experiment everywhere it appears. Non-negotiable; already implemented in `layouts/partials/disclaimer.html` and page copy.
- **Stack:** Hugo (extended 0.147) on GitHub Pages; Chart.js from cdnjs for history charts; custom canvas for the two v1 visualizations; Buttondown for the letter.
- **v1 page list (frozen):** Home, Observatory, Readings (archive, empty until Sep 26), Ledger, Field Guide (7 pages), Blog (1 post), About, Subscribe.

## Pending CEO decision (before DNS)
- **Domain.** marketdimensions.com is a domain-investor hold (expires 2026-10-23); market-dimensions.com expires 2026-09-15 — backorder both. Clean now: marketdimensions.io, marketdimensions.net. `hugo.toml` baseURL currently assumes marketdimensions.io.
- **AssetMark "MarketDimensions" portfolios.** Unregistered but active brand in adjacent financial services. Recommendation: proceed, but never position as advisory or product-like; do not attempt a trademark on the bare phrase. Alternative if she wants zero shadow: lead with Formation Vitals (fully clear), demote Market Dimensions to descriptor.
- **Handles.** YouTube, GitHub, Buttondown `marketdimensions` available; LinkedIn company slug taken (payroll firm); X/TikTok/Instagram unverified from this seat.
- **TAGC link target.** About page links `aigovernanceco.com` — confirm this is the live TAGC domain.
- **Byline.** Blog post and About page name Christa Burger, Matt Goodrich, Chris Honaker. Confirm names/roles as they should appear publicly.

## Review pass (2026-09-05, after v1.1)
- **Fact-check vs data (agent):** 60+ claims verified; ~15 narrative numbers corrected to match the committed replay frames (2007 collapse is two legs: >10 → ~4 in spring, ~6 → 3.6 in August; Lehman leg reaches 2.0 in December not September; COVID: 7 → 1.6 in 19 trading days, slow re-inflation; "widest in the study" softened; JPM +0.5 / core −0.5; VST/CEG −14–21% at entry). Research-era claims not reproducible from repo data (VIX 87/69, 14 crashes, 88–98% vortex, "most directed on record") were softened or attributed to "the research era". T2 needs 40 readings — inert until ~late Oct 2026; now stated on-site.
- **Compliance read (agent):** imperatives about acting removed ("never make limb decisions" → "the geometry cannot see during weather"; "selling the clench" and "real protection is sizing and liquidity" rewritten); "We would take that trade" → "outcome"; every portfolio number now sits beside a paper label; TAGC framing changed to "Self-governed in public — not third-party certified" and About explicitly says TAGC cannot certify its own instrument.
- **Hostile-quant critique (agent):** 15 objections → new Field Guide page 08 "What could be wrong with this" conceding quant quake ≠ prescience, T2 written post hoc, N=20/T=60 noise, survivorship, basket mismatch, projection distortion, one-regime experiment, detector = correlation of prices, pair = numerology, vorticity null, threshold soup. Ends with three owed deliverables (bootstrap bands, T2 false-alarm table, vorticity null) to be registered as process claims in the ledger.
- **Technical QA (agent + verified):** 0 broken links, 0 page errors, no horizontal overflow at 390/768/1280; axe fixes applied (prose-link underline, heading order, disclaimer inside footer landmark, chart canvas labels, aria-pressed); phone canvas fixes (header band, label clamps, staggered event labels, ticker-label collision avoidance); gauge no longer spins rAF under reduced motion or hidden tab; 2008 replay lazy-loads when scrolled near; 404 page; OG social image; tap targets ≥40px. Home weight ~290 KB raw / ~110 KB gzipped incl. replay data.

## Work packets
| Packet | Scope | Status |
|---|---|---|
| P-site-1 | Skeleton + Home + live vitals strip | built |
| P-site-2 | Observatory: live data, history charts, tripwires, live manifold | built |
| P-site-3 | Ledger renderer (predictions.yml + grades.csv as found) | built |
| P-site-4 | Field Guide (min 2 pages) | built, 8 pages incl. "What could be wrong with this" |
| P-site-5 | First blog post | built ("The Pruned Are Winning") |
| P-site-6 | Newsletter plumbing | form wired to Buttondown URL; account + first-letter template pending |
| P-viz-1 | Breathing Manifold with 2008 replay | built (COVID replay data precomputed, surfaced only on the disease-signature Field Guide page) |
| P-viz-2 | Dimension Gauge with history scrubber | built |
| P-ops-1 | Deploy workflow + Saturday 14:30 UTC frame refresh | written, unrun |

## Acceptance ≠ production
1. CEO reviews the staging build (GitHub Pages default URL) on desktop and phone.
2. CEO confirms the pending decisions above.
3. DNS cutover. Announce via The Reading #0 (a short "the door is open" note) and Kai/Hermes for distribution.

## Cadence guard
Launch minimal; grow by packet; stay inside the 8 founder-hrs/week envelope. v2 backlog lives in README (vorticity flow field, pair orbit, frontier gravity, cluster-birth constellations, COVID-vs-GFC side-by-side).
