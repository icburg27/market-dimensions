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

def main():
    os.makedirs(OUT, exist_ok=True)
    # ---- live (vitals-machine) ----
    panel = pd.read_csv(io.StringIO(fetch("data/panel.csv")), index_col=0, parse_dates=True)
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
