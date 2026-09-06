---
title: "The breathing manifold"
weight: 2
manifold: gfc
description: "How the constellation is drawn, what the strands mean, and why it is drawn at a fixed scale so that shrinkage on screen is shrinkage in the data."
---

The animation above is the signature artifact of this site, so it is worth being exact about what it is and is not.

**What each frame is.** A 60-trading-day window of daily log returns for twenty stocks. From those, a 20×20 correlation matrix; from that, a distance matrix with *d* = √(2(1 − ρ)). Classical multidimensional scaling projects those distances to two dimensions — the flattest honest picture of a shape that really lives in many more. Each frame is Procrustes-aligned to the previous one by rotation and reflection only, never scaled, so the constellation doesn't spin arbitrarily between weeks and so distances mean the same thing in every frame.

**What the strands are.** A gold strand is drawn between two stars whose correlation exceeds 0.35; the strand gets brighter and thicker as ρ rises toward 1. In sunlight there are few strands and they run within sectors — the energy trio, the two banks. In a clench the strands form a web, then a knot.

**What the ring is.** The dashed violet ring is a monotone map of effective dimension: its radius shrinks as dimension falls. It is a visual aid, not a second measurement — it exists so your eye can read the room even when the stars are scattered.

**Why the scale is fixed.** Most animations rescale each frame to fill the box, which would hide the whole point. Here one unit of correlation distance is always the same number of pixels, across every frame and across the live view and the replays. When the cloud gets small on screen, it got small in the data.

**Where the data comes from.** The 2008 and 2020 replays use a twenty-asset research panel spanning 1990–2022 (the same one the original study used, so the numbers on this site match the numbers in the essays). The live view uses the Observatory's core-20 basket from the machine's own panel, recomputed every Saturday by a build step in this site's repository. Every frame is committed JSON; nothing is generated in the browser except the interpolation between frames.

**What the 2008 replay shows.** Play it from the start. Through 2006 and into early 2007 the cloud is wide and lumpy — sectors keep their neighborhoods, and by February it is above ten dimensions. Watch for the spring break to about 4, the half-recovery, and then July and August 2007, when the ring tightens again and the strands multiply: dimension drops from about 6 to about 3.5 in five weeks and does not come back, while the index goes on to make new highs in October. That is the disease signature, and it is the next page. Lehman, in September 2008, starts the last leg down to 2.0 by December: twenty stocks, one object. Then watch how slowly the room returns. Two years later the cloud is still cramped.

Flip to the live view and notice how different the shape is. As of the first autonomous reading the dimension is 8.8, the mean correlation is 0.07, and you can pick out the small tribes — the AI pocket, the energy trio, Apple sitting among the defensives. That is a wider cloud than anything in the 2008 or 2020 replays — a loose comparison, since the baskets differ — and what looks like a directed migration is running through it. Which is why the next dial matters.
