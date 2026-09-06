---
title: "Predictions & grades"
layout: ledger
description: "Every claim the observatory has made, registered before the fact, with the grade the machine or the CEO assigned afterward. Rendered from the repository, exactly as committed."
---

## How grading works

The machine registers a claim in `ledger/predictions.yml` with a due date and a named grader. When the due date arrives — or at any monthly reading before that, as a status entry — a line is appended to `ledger/grades.csv` with the evidence. Machine-gradable claims are scored from prices; judgment calls carry the CEO's initials. A status entry is not a grade; it is a public look at how the claim is tracking. A grade is final. If we later think a grade was wrong, we append a dispute line and leave the grade where it stands.

## The paper experiment

On 2026-08-25, $1,000 of pretend money was split across fifteen names in nine lifecycle arms — feeding ground (TSM, VRT, AVGO, ANET, ETN), the AI pocket (NVDA, AMD), plumbing (JPM), pruned names we expected to keep lagging (VST, CEG), and controls (the remaining arms are single-name controls; the full list is in `ledger/predictions.yml`). Seven claims (EXP-1 through EXP-7) were registered on 2026-08-29 and come due 2027-02-27, after six monthly readings. Two more (PAIR-1, PAIR-2) concern the AVGO/JPM pair that entered at exactly $356.69 each. And three (PROC-1 through PROC-3) are promises about our own work — the analyses the Field Guide's ["What could be wrong with this"](/field-guide/what-could-be-wrong/) says we owe — registered with due dates so that not delivering them is graded too.

<div class="tension"><div class="eyebrow">Early tension, on the record</div>At eight trading days the pruned names (VST, CEG) are up more than the feeding ground, against the direction of EXP-5; the pocket is keeping pace with its supply chain, leaning against EXP-3; and the pair sits at 0.998, a hair under parity, against PAIR-1's direction. None of this is a grade — eight days is weather, not climate — but you should know it now, not in February.</div>

**This is a paper experiment.** No real money is at stake, nothing here is a recommendation, and the point of the exercise is to find out whether the geometry means what we think it means.
