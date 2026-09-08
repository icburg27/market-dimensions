"""One-time: industry share of total US market cap, 1926-2017, from the Fama-French 12-industry files
(number of firms x average firm size per industry, monthly; mirror of Ken French's data library).
Emits static/data/history.json. Static source; rerun only if the source changes."""
import os, json, io, urllib.request, pandas as pd
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = "https://raw.githubusercontent.com/dxcv/FF_IndustryFactorExposure/master/12_Industry_Portfolios_{}.csv"
NAMES = {"NoDur": "Consumer goods (food, tobacco, textiles)", "Durbl": "Durables (cars, appliances)", "Manuf": "Manufacturing",
         "Enrgy": "Energy", "Chems": "Chemicals", "BusEq": "Business equipment (computers, software, chips)",
         "Telcm": "Telephone & television", "Utils": "Utilities", "Shops": "Shops (wholesale, retail)",
         "Hlth": "Healthcare & drugs", "Money": "Finance", "Other": "Other (mines, construction, transport, hotels, services)"}
def get(k):
    with urllib.request.urlopen(BASE.format(k), timeout=60) as r: df = pd.read_csv(io.StringIO(r.read().decode()))
    df.columns = [c.strip() for c in df.columns]; return df.set_index("DATE")
a, c = get("AvgMktCap"), get("ComponentsCount")
cap = (a * c).dropna(); share = cap.div(cap.sum(axis=1), axis=0)
share.index = pd.to_datetime(share.index.astype(str), format="%Y%m")
yr = share.resample("YE").last().round(4)
out = dict(source="Fama-French 12 Industry Portfolios (CRSP universe): number of firms x average firm size, month-end; mirror github.com/dxcv/FF_IndustryFactorExposure",
           coverage=f"{yr.index[0].year}-{yr.index[-1].year}", unit="share of total US listed market capitalization",
           industries=list(yr.columns), names=NAMES, years=[d.year for d in yr.index], shares=yr.values.tolist(),
           today=dict(asof="2026-09-04", source="S&P 500 GICS sector weights (chartrow.com), a different universe and classification - shown as a labeled endpoint, not part of the series",
                      weights={"Technology": 38.2, "Financials": 12.3, "Communication Services": 9.5, "Healthcare": 9.2, "Consumer Discretionary": 9.1,
                               "Industrials": 8.3, "Consumer Staples": 4.4, "Energy": 3.5, "Utilities": 2.1, "Materials": 1.7, "Real Estate": 1.7}))
os.makedirs(os.path.join(ROOT, "static", "data"), exist_ok=True)
json.dump(out, open(os.path.join(ROOT, "static", "data", "history.json"), "w"), separators=(",", ":"))
print("history", out["coverage"], len(out["years"]), "years")
