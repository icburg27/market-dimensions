---
title: "The Observatory"
layout: observatory
description: "The live instrument. Six vitals from the core-20 basket, read every week by a self-running machine, with the history of every reading and the tripwires that are armed."
---

## Read the source — the machine is the receipt

Everything on this page is fetched directly from the public repository at the moment you load it: [`data/latest.json`](https://raw.githubusercontent.com/icburg27/vitals-machine/main/data/latest.json) for the current vitals, [`data/metrics.csv`](https://raw.githubusercontent.com/icburg27/vitals-machine/main/data/metrics.csv) for the history, [`data/alerts.json`](https://raw.githubusercontent.com/icburg27/vitals-machine/main/data/alerts.json) for tripwire state. If the repository is unreachable, the page falls back to values baked in at the last site build and says so next to the timestamp.

The pipeline itself is four scheduled trains: a daily harvest (Tuesday–Saturday) that appends closes through a three-source fallback chain, a weekly metrics run (Saturday) that recomputes the geometry and arms the tripwires, a monthly full reading on the last Saturday that renders a card and a draft report and opens an issue awaiting a human verdict, and a manual backfill that lets the machine heal its own gaps. Read the code at [github.com/icburg27/vitals-machine](https://github.com/icburg27/vitals-machine).

The basket is the twenty stocks in `watchlist.yml`: three Tech, two Financial, five Consumer, three Energy, two Industrial, five Health. Eleven more names are tracked for the frontier detector, the regional-bank storyline, and the 356.69 pair, but the vitals are computed on the core twenty only, so readings stay comparable month to month.

*Research and education, not investment advice. The instrument can be wrong. The ledger is where we find out.*
