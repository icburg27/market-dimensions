"""Precompute Breathing Manifold frames + baked fallback data for marketdimensions.

Real data only. Deterministic. Re-runnable.
  live frames : vitals-machine data/panel.csv (core-20), 60d rolling corr, weekly
  GFC replay  : skfolio 20-asset panel (1990-2022), 2006-01 -> 2010-12, weekly
  COVID replay: same panel, 2019-06 -> 2021-06 (precomputed; v2 UI)
Outputs static/data/{frames-live,replay-gfc,replay-covid,baked}.json
"""
import os, sys, json, io, urllib.request, datetime as dt
import numpy as np, pandas as pd
from scipy.cluster.hierarchy import linkage, fcluster
from sklearn.metrics import silhouette_score

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "static", "data")
RAW = "https://raw.githubusercontent.com/icburg27/vitals-machine/main/"
LOCAL_VM = os.environ.get("VITALS_MACHINE_DIR")  # optional local checkout
WIN, STEP = 60, 5

SECTORS_CORE = {"Tech":["AAPL","AMD","NVDA"],"Financial":["BAC","JPM"],
 "Consumer":["BBY","HD","WMT","KO","PEP"],"Energy":["CVX","XOM","COP"],
 "Industrial":["GE","MMM"],"Health":["JNJ","LLY","UNH","BMY","ABT"]}
SECTORS_HIST = {"Tech":["AAPL","AMD","MSFT"],"Financial":["BAC","JPM"],
 "Consumer":["BBY","HD","WMT","KO","PEP","PG"],"Energy":["CVX","XOM","RRC"],
 "Industrial":["GE"],"Health":["JNJ","LLY","UNH","MRK","PFE"]}

def fetch(path):
    if LOCAL_VM:
        with open(os.path.join(LOCAL_VM, path)) as f: return f.read()
    with urllib.request.urlopen(RAW + path, timeout=60) as r:
        return r.read().decode()

def eff_dim(C):
    lam = np.clip(np.linalg.eigvalsh((C + C.T) / 2), 0, None)
    return float(lam.sum() ** 2 / max((lam ** 2).sum(), 1e-12))

def separation(C):
    D = np.sqrt(np.maximum(2 * (1 - C), 0)); np.fill_diagonal(D, 0)
    Z = linkage(D[np.triu_indices_from(D, 1)], method="average")
    best = (-2, None)
    for k in range(2, 7):
        lab = fcluster(Z, k, criterion="maxclust")
        if len(set(lab)) < 2: continue
        s = silhouette_score(D, lab, metric="precomputed")
        if s > best[0]: best = (s, lab)
    lab = best[1]; iu = np.triu_indices_from(D, 1); w, b = [], []
    for i, j in zip(*iu): (w if lab[i] == lab[j] else b).append(D[i, j])
    return float(np.mean(b) / np.mean(w)) if w and b else float("nan"), [int(x) for x in lab]

def cmds(D, k=2):
    n = len(D); J = np.eye(n) - np.ones((n, n)) / n
    B = -0.5 * J @ (D ** 2) @ J
    w, v = np.linalg.eigh(B); idx = np.argsort(w)[::-1][:k]
    return v[:, idx] * np.sqrt(np.maximum(w[idx], 0))

def procrustes_align(X, ref):
    """Rotate/reflect X (no scaling) onto ref. Keeps absolute distances honest."""
    if ref is None: return X
    U, _, Vt = np.linalg.svd(ref.T @ X)
    R = (U @ Vt).T
    return X @ R

def frames_for(panel, sectors, start, end, step=STEP):
    tickers = [t for s in sectors.values() for t in s if t in panel.columns]
    # same cleaning rule as vitals-machine metrics.py: keep rows with <=6 missing, ffill up to 3
    px = panel[tickers].loc[:end]
    px = px.loc[px.isna().sum(axis=1) <= 6].ffill(limit=3)
    rets = np.log(px / px.shift(1)).dropna(how="all")
    rets = rets.iloc[1:] if rets.index[0] == px.index[0] else rets
    frames, ref = [], None
    ends = [e for e in range(WIN, len(rets) + 1, step) if rets.index[e - 1] >= pd.Timestamp(start)]
    for e in ends:
        R = rets.iloc[e - WIN:e]; C = np.nan_to_num(R.corr().values, nan=0.0); np.fill_diagonal(C, 1.0)
        D = np.sqrt(np.maximum(2 * (1 - C), 0))
        X = cmds(D); X = procrustes_align(X, ref); ref = X
        sep, lab = separation(C)
        iu = np.triu_indices(len(tickers), 1)
        frames.append(dict(
            date=str(rets.index[e - 1].date()),
            dim=round(eff_dim(C), 2),
            rho=round(float(C[iu].mean()), 3),
            sep=round(sep, 3),
            xy=[[round(float(a), 3), round(float(b), 3)] for a, b in X],  # 3 dp: sub-pixel at any on-screen scale
            corr=[int(round(c * 100)) for c in C[iu]],   # upper-tri rho x100
            cl=lab))
    sec_of = {t: s for s, ts in sectors.items() for t in ts}
    return dict(tickers=tickers, sectors=[sec_of[t] for t in tickers],
                window_days=WIN, step_days=step, distance="sqrt(2(1-rho))",
                embedding="classical MDS, Procrustes-aligned (rotation only)",
                frames=frames)

ENTRY = "2026-08-25"
ARMS = {"feeding": ["TSM", "VRT", "AVGO", "ANET", "ETN"], "pocket": ["NVDA", "AMD"], "pruned": ["VST", "CEG"], "plumbing": ["JPM"],
        "controls": ["SMCI", "WMT", "AAPL"]}
POCKET = ["NVDA", "AMD"]

def frontier_scores(r60, core, watch):
    """score = trailing-60d corr to the pocket mean minus mean corr to the core body (vitals-machine definition)."""
    pm = r60[POCKET].mean(axis=1); out = {}
    for t in watch + POCKET:
        if t not in r60: continue
        cp = r60[t].corr(r60[[p for p in POCKET if p != t][0]]) if t in POCKET else r60[t].corr(pm)
        cb = np.mean([r60[t].corr(r60[b]) for b in core if b != t and b in r60])
        out[t] = float(cp - cb)
    return out

def feeding_report(panel):
    core = [t for s in SECTORS_CORE.values() for t in s]
    watch = ["TSM", "VRT", "AVGO", "ETN", "SMCI", "ANET", "VST", "CEG"]
    px = panel.ffill(limit=3); lr = np.log(px / px.shift(1))
    now = frontier_scores(lr.iloc[-60:], core, watch); prev = frontier_scores(lr.iloc[-65:-5], core, watch)
    last = px.iloc[-1]; d20 = px.iloc[-21] if len(px) > 21 else px.iloc[0]; d5 = px.iloc[-6] if len(px) > 6 else px.iloc[0]
    entry = px.loc[ENTRY] if pd.Timestamp(ENTRY) in px.index else None
    rows = []
    for t, sc in sorted(now.items(), key=lambda x: -x[1]):
        rows.append(dict(ticker=t, score=round(sc, 3), d_score=round(sc - prev.get(t, sc), 3),
                         r_1w=round(float(last[t] / d5[t] - 1) * 100, 2), r_4w=round(float(last[t] / d20[t] - 1) * 100, 2),
                         r_entry=(round(float(last[t] / entry[t] - 1) * 100, 2) if entry is not None and pd.notna(entry.get(t)) else None),
                         arm=next((k for k, v in ARMS.items() if t in v), "pocket" if t in POCKET else "watch")))
    arms = {}
    for k, names in ARMS.items():
        have = [t for t in names if t in px.columns and entry is not None and pd.notna(entry.get(t)) and pd.notna(last.get(t))]
        if have: arms[k] = dict(names=have, r_entry=round(float(((last[have] / entry[have]) - 1).mean() * 100), 2),
                                r_4w=round(float(((last[have] / d20[have]) - 1).mean() * 100), 2))
    body = dict(r_4w=round(float(((last[core] / d20[core]) - 1).mean() * 100), 2),
                r_entry=(round(float(((last[core] / entry[core]) - 1).mean() * 100), 2) if entry is not None else None))
    # plain-language buckets, by rule (stated in the Field Guide): feeding = score up & 4w return > body; dieback = 4w return < body-2 & score falling;
    # more-food-than-we-thought = pruned arm beating the feeding arm since entry
    feeding_now = [r["ticker"] for r in rows if r["d_score"] > 0 and r["r_4w"] > body["r_4w"]]
    dieback = [r["ticker"] for r in rows if r["r_4w"] < body["r_4w"] - 2 and r["d_score"] < 0]
    surprise = [r["ticker"] for r in rows if r["arm"] == "pruned" and r["r_entry"] is not None and arms.get("feeding") and r["r_entry"] > arms["feeding"]["r_entry"]]
    return dict(asof=str(px.index[-1].date()), entry=ENTRY, pocket=POCKET, ranking=rows, arms=arms, body=body,
                feeding_now=feeding_now, dieback=dieback, surprise=surprise,
                rule="feeding = score rising and 4-week return above the body; dieback = 4-week return more than 2 pts below the body with score falling; surprise = a pruned name beating the feeding arm since entry")

def main():
    os.makedirs(OUT, exist_ok=True)
    # ---- live (vitals-machine) ----
    panel = pd.read_csv(io.StringIO(fetch("data/panel.csv")), index_col=0, parse_dates=True)
    # One clock: the site reads the panel only as far as the machine's last computed
    # vitals reading, so feeding, frames and the vitals strip all share an as-of date.
    vitals_asof = json.loads(fetch("data/latest.json"))["asof"]
    panel = panel.loc[:vitals_asof]
    print("clock: vitals asof", vitals_asof, "| panel truncated to", str(panel.index[-1].date()))
    live = frames_for(panel, SECTORS_CORE, start="2000-01-01", end="2100-01-01", step=STEP)
    live["source"] = RAW + "data/panel.csv"
    json.dump(live, open(os.path.join(OUT, "frames-live.json"), "w"), separators=(",", ":"))
    print("live frames:", len(live["frames"]), live["frames"][0]["date"], "->", live["frames"][-1]["date"],
          "dim", live["frames"][-1]["dim"])
    # ---- replays (skfolio 20-asset research panel) ----
    from skfolio.datasets import load_sp500_dataset
    hist = load_sp500_dataset()
    for name, s, e in [("gfc", "2006-01-01", "2010-12-31"), ("covid", "2019-06-01", "2021-06-30")]:
        rp = frames_for(hist, SECTORS_HIST, start=s, end=e, step=5)
        rp["source"] = "skfolio load_sp500_dataset (20 assets, 1990-2022); research-era panel"
        rp["events"] = {"gfc": [["2007-08-09", "Quant quake / BNP freezes funds"],
                                ["2008-03-16", "Bear Stearns"], ["2008-09-15", "Lehman"],
                                ["2009-03-09", "Bottom"]],
                        "covid": [["2020-02-19", "Peak"], ["2020-03-23", "Bottom"],
                                  ["2020-11-09", "Vaccine rotation"]]}[name]
        json.dump(rp, open(os.path.join(OUT, f"replay-{name}.json"), "w"), separators=(",", ":"))
        dims = [f["dim"] for f in rp["frames"]]
        print(name, len(rp["frames"]), "frames; dim max", max(dims), "min", min(dims))
    # ---- feeding ground: where the organism is feeding this week ----
    feeding = feeding_report(panel)
    json.dump(feeding, open(os.path.join(OUT, "feeding.json"), "w"), indent=1)
    print("feeding asof", feeding["asof"], "top", feeding["ranking"][0]["ticker"])
    # ---- baked fallback ----
    baked = dict(
        built=dt.datetime.utcnow().strftime("%Y-%m-%dT%H:%MZ"),
        latest=json.loads(fetch("data/latest.json")),
        alerts=json.loads(fetch("data/alerts.json")),
        metrics_csv=fetch("data/metrics.csv"),
        predictions_yml=fetch("ledger/predictions.yml"),
        grades_csv=fetch("ledger/grades.csv"),
        watchlist_yml=fetch("watchlist.yml"))
    json.dump(baked, open(os.path.join(OUT, "baked.json"), "w"), indent=1)
    print("baked asof", baked["latest"]["asof"])

if __name__ == "__main__":
    sys.exit(main())
