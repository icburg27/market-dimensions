/* The flood — a century of the organism spreading across industries.
   Data: /data/history.json — Fama-French 12-industry share of total US market cap, year-end 1926-2017 (measured),
   plus a labelled 2026 S&P 500 GICS endpoint (different universe; drawn as a marker, never joined to the series).
   Drawn as a streamgraph that fills in left to right; scrub to any year. Nothing synthetic. */
(function () {
  const ORDER = ["Other", "Utils", "Telcm", "Enrgy", "Chems", "Manuf", "Durbl", "NoDur", "Shops", "Hlth", "Money", "BusEq"];
  const COLORS = { NoDur: "#3987e5", Durbl: "#5aa0ea", Manuf: "#9085e9", Enrgy: "#d95926", Chems: "#b06a3c", BusEq: "#e4b84a", Telcm: "#3ec28f",
                   Utils: "#199e70", Shops: "#6fb1f2", Hlth: "#d55181", Money: "#7c5cff", Other: "#4a4361" };
  const ERAS = [[1926, "Goods, materials, energy"], [1946, "Manufacturing at scale"], [1966, "Utilities & the conglomerate"], [1982, "Finance grows an artery"], [1995, "Computers become tissue"], [2009, "Health and platforms"], [2017, "Feeding on itself →"]];
  class Flood {
    constructor(root) {
      this.root = root; this.canvas = root.querySelector("canvas"); this.ctx = this.canvas.getContext("2d"); this.rng = root.querySelector("input[type=range]");
      this.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches; this.pos = 0; this.playing = false;
      fetch(root.dataset.src).then(r => r.json()).then(d => { this.d = d; this.n = d.years.length; if (this.rng) { this.rng.max = this.n - 1; this.rng.value = 0; } this.resize(); this.start(); })
        .catch(() => { this.failed = true; this.resize(); this.draw(); });
      new ResizeObserver(() => { this.resize(); this.draw(); }).observe(this.canvas.parentElement);
      if (this.rng) this.rng.addEventListener("input", () => { this.pos = +this.rng.value; this.playing = false; this.sync(); this.draw(); });
      const p = root.querySelector("[data-play]"); if (p) p.addEventListener("click", () => { this.playing = !this.playing; if (this.playing && this.pos >= this.n - 1) this.pos = 0; this.sync(); if (this.playing) this.tick(); });
      this.canvas.addEventListener("pointermove", e => { if (!this.d) return; const r = this.canvas.getBoundingClientRect(); this.hover = [(e.clientX - r.left), (e.clientY - r.top)]; if (!this.playing) this.draw(); });
      this.canvas.addEventListener("pointerleave", () => { this.hover = null; if (!this.playing) this.draw(); });
    }
    start() { if (this.reduced) { this.pos = this.n - 1; this.draw(); return; } const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); this.playing = true; this.sync(); this.tick(); } }, { rootMargin: "200px" }); io.observe(this.root); setTimeout(() => { if (!this.playing && this.pos === 0) { this.playing = true; this.sync(); this.tick(); } }, 5000); }
    sync() { const p = this.root.querySelector("[data-play]"); if (p) p.textContent = this.playing ? "❚❚ Pause" : "▶ Replay the century"; }
    tick() { if (!this.playing) return; this.pos = Math.min(this.n - 1, this.pos + 0.22); if (this.rng) this.rng.value = this.pos; this.draw(); if (this.pos >= this.n - 1) { this.playing = false; this.sync(); return; } requestAnimationFrame(() => this.tick()); }
    resize() { const w = this.canvas.parentElement.clientWidth || 800, h = Math.max(380, Math.min(560, Math.round(w * 0.55))), dpr = Math.min(2, devicePixelRatio || 1); this.W = w; this.H = h; this.canvas.width = w * dpr; this.canvas.height = h * dpr; this.canvas.style.height = h + "px"; this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    draw() {
      const c = this.ctx, W = this.W, H = this.H; if (!W) return; c.clearRect(0, 0, W, H); c.fillStyle = "#14101f"; c.fillRect(0, 0, W, H);
      if (!this.d) { c.fillStyle = "#8f86a8"; c.font = "14px Inter, sans-serif"; c.fillText(this.failed ? "The history data could not be loaded." : "Loading a century…", 20, 30); return; }
      const d = this.d, idx = d.industries, L = 56, R = W - 96, T = 46, B = H - 46, upto = Math.max(1, Math.floor(this.pos) + 1);
      const X = i => L + (R - L) * (i / (this.n - 1)), Y = v => B - (B - T) * v;
      // stacked areas in ORDER (bottom→top), only through the flood front
      let base = new Array(upto).fill(0);
      const tops = {};
      ORDER.forEach(k => { const j = idx.indexOf(k); if (j < 0) return; const top = base.map((b, i) => b + d.shares[i][j]);
        c.beginPath(); c.moveTo(X(0), Y(base[0])); for (let i = 0; i < upto; i++) c.lineTo(X(i), Y(top[i])); for (let i = upto - 1; i >= 0; i--) c.lineTo(X(i), Y(base[i])); c.closePath();
        c.fillStyle = COLORS[k]; c.globalAlpha = 0.88; c.fill(); c.globalAlpha = 1; tops[k] = [base.slice(), top]; base = top; });
      // flood front
      const fx = X(upto - 1); c.strokeStyle = "rgba(242,238,250,0.5)"; c.lineWidth = 1; c.beginPath(); c.moveTo(fx + 0.5, T); c.lineTo(fx + 0.5, B); c.stroke();
      c.fillStyle = "#f2eefa"; c.font = "500 22px Fraunces, Georgia, serif"; c.textAlign = "left"; c.fillText(d.years[upto - 1], Math.min(fx + 8, W - 60), T + 20);
      // labels at the front for the biggest bands
      c.font = "600 10.5px Inter, sans-serif";
      ORDER.forEach(k => { const j = idx.indexOf(k); const v = d.shares[upto - 1][j]; if (v < 0.06) return; const [b, t] = tops[k]; const y = Y((b[upto - 1] + t[upto - 1]) / 2);
        c.fillStyle = "#14101f"; c.fillText(k === "BusEq" ? "Business equipment" : k === "NoDur" ? "Consumer goods" : k === "Money" ? "Finance" : k === "Hlth" ? "Health" : k === "Manuf" ? "Manufacturing" : k === "Enrgy" ? "Energy" : k, Math.max(L + 6, fx - 130), y + 4);
        c.fillStyle = "#f2eefa"; c.fillText((k === "BusEq" ? "Business equipment" : k === "NoDur" ? "Consumer goods" : k === "Money" ? "Finance" : k === "Hlth" ? "Health" : k === "Manuf" ? "Manufacturing" : k === "Enrgy" ? "Energy" : k) + " " + Math.round(v * 100) + "%", Math.max(L + 5, fx - 131), y + 3); });
      // axis + eras
      c.fillStyle = "#8f86a8"; c.font = "10px Inter, sans-serif"; c.textAlign = "center";
      for (let y = 1930; y <= 2010; y += 20) { const i = d.years.indexOf(y); if (i >= 0) c.fillText(y, X(i), B + 14); }
      if (W >= 700) { let lastRight = -1e9, row = 0; ERAS.forEach(([y, label]) => { const i = d.years.indexOf(Math.min(y, d.years[d.years.length - 1])); if (i < 0 || i > upto - 1) return; c.strokeStyle = "rgba(228,184,74,0.25)"; c.beginPath(); c.moveTo(X(i) + 0.5, T - 6); c.lineTo(X(i) + 0.5, T + 4); c.stroke(); const tw = c.measureText(label).width; row = (X(i) + 4 < lastRight + 8) ? 1 - row : 0; lastRight = X(i) + 4 + tw; c.fillStyle = "#e4b84a"; c.textAlign = "left"; c.fillText(label, X(i) + 4, T - 8 - row * 12); }); }
      // 2026 endpoint marker (different universe) — only once the flood has reached the end
      if (upto >= this.n) { const tw = d.today.weights, tech = (tw["Technology"] + tw["Communication Services"] * 0.5) / 100, x = R + 60;
        c.fillStyle = "#e4b84a"; c.beginPath(); c.arc(x, Y(tech), 6, 0, Math.PI * 2); c.fill(); c.fillStyle = "#f2eefa"; c.font = "600 10.5px Inter, sans-serif"; c.textAlign = "center"; c.fillText("2026", x, Y(tech) - 12);
        c.fillStyle = "#8f86a8"; c.font = "10px Inter, sans-serif"; c.fillText("tech ≈ " + Math.round(tech * 100) + "%*", x, Y(tech) + 18); c.fillText("S&P 500 GICS", x, B + 14); }
      // hover readout
      if (this.hover && !this.playing) { const i = Math.round(((this.hover[0] - L) / (R - L)) * (this.n - 1)); if (i >= 0 && i < upto) { const row = d.shares[i]; const items = idx.map((k, j) => [k, row[j]]).sort((a, b) => b[1] - a[1]).slice(0, 5);
        c.fillStyle = "rgba(13,10,21,0.92)"; c.fillRect(L + 8, T + 30, 190, 16 * items.length + 30); c.fillStyle = "#f2eefa"; c.font = "600 11px Inter, sans-serif"; c.textAlign = "left"; c.fillText(d.years[i], L + 16, T + 48);
        c.font = "10.5px JetBrains Mono, monospace"; items.forEach(([k, v], n) => { c.fillStyle = COLORS[k]; c.fillRect(L + 16, T + 56 + n * 16, 8, 8); c.fillStyle = "#c9c1dc"; c.fillText(`${(v * 100).toFixed(1).padStart(5)}%  ${d.names[k].split(" (")[0]}`, L + 30, T + 64 + n * 16); }); } }
      const ro = this.root.querySelector("[data-year]"); if (ro) ro.textContent = d.years[upto - 1];
    }
  }
  document.addEventListener("DOMContentLoaded", () => document.querySelectorAll("[data-flood]").forEach(el => new Flood(el)));
})();
