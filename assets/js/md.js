/* Market Dimensions — data layer.
   Live-first: reads the vitals-machine repo directly (raw.githubusercontent.com, CORS open).
   Graceful degradation: falls back to /data/baked.json, written at build time by tools/build_frames.py.
   Nothing here invents a number. */
(function () {
  const RAW = (window.MD && window.MD.raw) || "https://raw.githubusercontent.com/icburg27/vitals-machine/main/";
  const bust = () => "?t=" + Math.floor(Date.now() / 60000); // one-minute cache key
  let bakedP = null;
  const baked = () => (bakedP ||= fetch(((window.MD && MD.base) || "/") + "data/baked.json").then(r => r.json()).catch(() => null));

  async function liveText(path) {
    const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), 6000);
    const r = await fetch(RAW + path + bust(), { cache: "no-store", signal: ctl.signal }).finally(() => clearTimeout(timer));
    if (!r.ok) throw new Error(path + " " + r.status);
    return r.text();
  }
  let liveDown = false; // after one live failure, stop waiting on the network this page-load
  async function get(path, bakedKey, parse) {
    try {
      if (liveDown) throw new Error("live down");
      const t = await liveText(path);
      return { data: parse(t), live: true };
    } catch (e) {
      liveDown = true;
      const b = await baked();
      if (b && b[bakedKey] != null) {
        const v = b[bakedKey];
        return { data: typeof v === "string" ? parse(v) : v, live: false, built: b.built };
      }
      throw e;
    }
  }

  function parseCSV(text) {
    const lines = text.trim().split(/\r?\n/);
    const head = lines.shift().split(",");
    return lines.filter(Boolean).map(l => {
      // minimal quoted-field support (grades.csv evidence column)
      const cells = []; let cur = "", q = false;
      for (const ch of l) {
        if (ch === '"') q = !q;
        else if (ch === "," && !q) { cells.push(cur); cur = ""; }
        else cur += ch;
      }
      cells.push(cur);
      const o = {};
      head.forEach((h, i) => { o[h] = cells[i] === undefined ? "" : cells[i]; });
      return o;
    });
  }
  // predictions.yml is a flat list of maps with scalar values — parse just that shape.
  function parsePredYAML(text) {
    const out = []; let cur = null;
    for (const raw of text.split(/\r?\n/)) {
      const line = raw.replace(/\s+#.*$/, "");
      if (!line.trim() || line.trim().startsWith("#")) continue;
      const m = line.match(/^\s*(-\s+)?([A-Za-z_]+):\s*(.*)$/);
      if (!m) continue;
      if (m[1]) { cur = {}; out.push(cur); }
      if (!cur) continue;
      let v = m[3].trim();
      if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) v = v.slice(1, -1);
      cur[m[2]] = v;
    }
    return out;
  }

  const num = (v) => (v === "" || v == null ? null : +v);

  const MD = window.MD = Object.assign(window.MD || {}, {
    latest: () => get("data/latest.json", "latest", JSON.parse),
    alerts: () => get("data/alerts.json", "alerts", JSON.parse),
    metrics: () => get("data/metrics.csv", "metrics_csv", t => parseCSV(t).map(r => ({
      date: r.date, eff_dim: num(r.eff_dim), mean_corr: num(r.mean_corr), mst_len: num(r.mst_len),
      separation: num(r.separation), vorticity: num(r.vorticity) }))),
    predictions: () => get("ledger/predictions.yml", "predictions_yml", parsePredYAML),
    grades: () => get("ledger/grades.csv", "grades_csv", parseCSV),
    fmt: (v, d = 2) => (v == null || isNaN(v) ? "—" : (+v).toFixed(d)),
    parseCSV, parsePredYAML,
  });

  // ---- interpretation (plain language, thresholds from the Field Guide) ----
  MD.readDim = function (d) {
    if (d == null) return "";
    if (d >= 9) return "wide dimensions — differentiated, plenty of room";
    if (d >= 7) return "healthy — sectors keep their own neighborhoods";
    if (d >= 5) return "narrowing — watch the trend, not the level";
    if (d >= 3.5) return "compressed — the 2007 territory";
    return "huddle — the market is moving as one object";
  };
  MD.readVort = function (v) {
    if (v == null) return "not yet computed";
    if (v > 0.92) return "migration complete — dissolving into rotation (T1)";
    if (v > 0.86) return "directed river weakening";
    return "directed migration underway";
  };
  MD.readSep = function (s, dimFalling) {
    if (s == null) return "";
    if (s > 1.4 && dimFalling) return "fusion pattern (T3)";
    if (s > 1.4) return "clusters pulling apart";
    if (s > 1.3) return "structured pluralism, firming";
    return "structured pluralism";
  };
  MD.readVix = function (v) {
    if (v == null) return "";
    if (v > 25) return "storm — no limb decisions";
    if (v > 18) return "weather";
    return "sunlight";
  };
  MD.readPair = function (r) {
    if (r == null) return "";
    const pct = ((r - 1) * 100).toFixed(2);
    return (r >= 1 ? "+" : "") + pct + "% vs parity · paper claim";
  };

  // ---- vitals strip ----
  MD.renderStrip = async function (rootId = "vitals-strip") {
    const root = document.getElementById(rootId); if (!root) return;
    let L, M, A;
    const [rL, rM, rA] = await Promise.allSettled([MD.latest(), MD.metrics(), MD.alerts()]);
    if (rL.status !== "fulfilled") { setAsOf("The instrument is unreachable right now.", true); return; }
    L = rL.value; M = rM.status === "fulfilled" ? rM.value : { data: [] }; A = rA.status === "fulfilled" ? rA.value : { data: { alerts: [], notes: [] } };
    const l = L.data, hist = M.data, prev = hist.length > 1 ? hist[hist.length - 2] : null;
    const set = (k, val, d, dtext) => {
      const v = root.querySelector(`[data-v="${k}"]`), dd = root.querySelector(`[data-d="${k}"]`);
      if (v) v.textContent = MD.fmt(val, d);
      if (dd && dtext != null) dd.innerHTML = dtext;
    };
    const delta = (k, d = 2) => {
      if (!prev || prev[k] == null || l[k] == null) return "";
      const x = l[k] - prev[k]; if (Math.abs(x) < 0.0005) return "";
      return ` <span class="${x > 0 ? "up" : "down"}">${x > 0 ? "▲" : "▼"} ${Math.abs(x).toFixed(d)}</span>`;
    };
    const dimFalling = prev ? l.eff_dim < prev.eff_dim : false;
    set("eff_dim", l.eff_dim, 2, MD.readDim(l.eff_dim) + delta("eff_dim"));
    set("mean_corr", l.mean_corr, 3, "mean pairwise ρ" + delta("mean_corr", 3));
    set("vorticity", l.vorticity, 3, MD.readVort(l.vorticity));
    set("separation", l.separation, 3, MD.readSep(l.separation, dimFalling) + delta("separation", 3));
    set("vix", l.vix, 2, MD.readVix(l.vix));
    set("pair_ratio", l.pair_ratio, 4, MD.readPair(l.pair_ratio));
    const alerts = (A.data && A.data.alerts) || [];
    const al = document.getElementById("vitals-alerts");
    if (al) al.innerHTML = alerts.length
      ? `<span style="color:var(--warn)">⚠ ${alerts.length} tripwire${alerts.length > 1 ? "s" : ""} fired</span> — <a href="${(window.MD && MD.base) || "/"}observatory/#tripwires">details</a>`
      : "tripwires: none armed-and-fired · T1 vorticity · T2 disease · T3 fusion";
    setAsOf(`${L.live ? "Live from the repo" : "Baked at build" + (L.built ? " " + L.built : "")} · data through <b>${l.asof}</b> · weekly reading · 60-day window, core-20 basket`, !L.live);
    function setAsOf(html, stale) {
      const a = document.getElementById("vitals-asof"), dot = document.getElementById("live-dot");
      if (a) a.innerHTML = html; if (dot) dot.classList.toggle("stale", !!stale);
    }
    MD._latest = l; MD._metrics = hist; MD._alerts = A.data;
    document.dispatchEvent(new CustomEvent("md:vitals", { detail: { latest: l, metrics: hist, alerts: A.data, live: L.live } }));
  };

  document.addEventListener("DOMContentLoaded", () => { if (document.getElementById("vitals-strip")) MD.renderStrip(); });
})();
