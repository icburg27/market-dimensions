/* Where it's feeding — the frontier detector drawn as bodies pulled toward the growth tip.
   Data: /data/feeding.json, baked weekly from the vitals-machine panel (real closes; rule stated on the page).
   Radius from the pocket = 1 − frontier score (closer = moving with the growth tip). Dot size = 4-week move.
   Colour = state: feeding (gold), dieback (rose), more-food-than-we-thought (violet), quiet (grey). */
(function () {
  const GOLD = "#e4b84a", ROSE = "#e5647a", VIOLET = "#a78bfa", GREY = "#8f86a8", INK = "#f2eefa", INK3 = "#8f86a8";
  const ANGLE = { TSM: -80, VRT: -35, AVGO: 10, ETN: 55, ANET: 105, SMCI: 150, VST: 195, CEG: 240, NVDA: -20, AMD: 160 };
  const stateOf = (d, r) => d.feeding_now.includes(r.ticker) ? "feeding" : d.dieback.includes(r.ticker) ? "dieback" : d.surprise.includes(r.ticker) ? "surprise" : "quiet";
  const COL = { feeding: GOLD, dieback: ROSE, surprise: VIOLET, quiet: GREY };
  const WORDS = { feeding: "feeding", dieback: "dieback", surprise: "more food than we thought", quiet: "quiet" };

  class Feeding {
    constructor(root) {
      this.root = root; this.canvas = root.querySelector("canvas"); this.ctx = this.canvas.getContext("2d");
      this.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches; this.t0 = performance.now();
      fetch(root.dataset.src).then(r => r.json()).then(d => { this.d = d; this.fill(); this.resize(); this.loop(); })
        .catch(() => { this.failed = true; this.resize(); this.draw(0); });
      new ResizeObserver(() => { this.resize(); this.draw(0); }).observe(this.canvas.parentElement);
    }
    resize() {
      const w = this.canvas.parentElement.clientWidth || 700, h = Math.max(360, Math.min(520, Math.round(w * 0.62))), dpr = Math.min(2, devicePixelRatio || 1);
      this.W = w; this.H = h; this.canvas.width = w * dpr; this.canvas.height = h * dpr; this.canvas.style.height = h + "px"; this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    loop() { const step = t => { this.draw(t); if (!this.reduced && !document.hidden) requestAnimationFrame(step); else this._parked = true; }; requestAnimationFrame(step);
      document.addEventListener("visibilitychange", () => { if (!document.hidden && this._parked) { this._parked = false; requestAnimationFrame(step); } }); }
    draw(t) {
      const c = this.ctx, W = this.W, H = this.H; if (!W) return;
      c.clearRect(0, 0, W, H); c.fillStyle = "#14101f"; c.fillRect(0, 0, W, H);
      if (!this.d) { c.fillStyle = INK3; c.font = "14px Inter, sans-serif"; c.fillText(this.failed ? "The feeding data could not be loaded." : "Finding the food…", 20, 30); return; }
      const d = this.d, cx = W / 2, cy = H / 2 + 6, R = Math.min(W, H) * 0.42; // R = distance for score 0.4
      const rad = s => R * Math.max(0.3, Math.min(1, 0.3 + 0.7 * (0.92 - s) / 0.45));
      const breath = this.reduced ? 0.5 : (Math.sin(t / 2600) + 1) / 2;
      // scent rings
      c.setLineDash([2, 6]); c.strokeStyle = "rgba(167,139,250,0.22)"; c.lineWidth = 1;
      [0.9, 0.75, 0.6].forEach(s => { c.beginPath(); c.arc(cx, cy, rad(s), 0, Math.PI * 2); c.stroke(); c.fillStyle = INK3; c.font = "10px Inter, sans-serif"; c.textAlign = "right"; c.fillText("score " + s, cx - rad(s) * 0.71 - 4, cy - rad(s) * 0.71 - 4); });
      c.setLineDash([]);
      // the pocket — the growth tip
      const pr = 26 + 6 * breath, g = c.createRadialGradient(cx, cy, 2, cx, cy, pr * 2.2);
      g.addColorStop(0, "rgba(228,184,74,0.75)"); g.addColorStop(0.45, "rgba(228,184,74,0.25)"); g.addColorStop(1, "rgba(228,184,74,0)");
      c.fillStyle = g; c.beginPath(); c.arc(cx, cy, pr * 2.2, 0, Math.PI * 2); c.fill();
      c.fillStyle = "#14101f"; c.font = "600 10px Inter, sans-serif"; c.textAlign = "center";
      c.fillStyle = INK; c.fillText("THE POCKET", cx, cy - pr - 10); c.fillStyle = INK3; c.fillText(d.pocket.join(" · "), cx, cy + pr + 16);
      // bodies
      c.font = "600 10.5px Inter, sans-serif";
      d.ranking.filter(r => !d.pocket.includes(r.ticker)).forEach((r, i) => {
        const st = stateOf(d, r), col = COL[st]; const a = ((ANGLE[r.ticker] ?? i * 47) * Math.PI) / 180;
        const rr = rad(r.score) + (st === "quiet" ? 0 : Math.sin(t / 1800 + i) * 2); const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
        const size = 5 + Math.min(14, Math.abs(r.r_4w) * 0.45);
        // pseudopod: a strand toward the pocket, stronger when the score is rising
        if (r.d_score > 0) { c.strokeStyle = "rgba(228,184,74,0.35)"; c.lineWidth = 1 + Math.min(3, r.d_score * 30); c.beginPath(); c.moveTo(x, y); c.lineTo(cx + Math.cos(a) * pr * 1.4, cy + Math.sin(a) * pr * 1.4); c.stroke(); }
        const gl = c.createRadialGradient(x, y, 1, x, y, size * 2.2); gl.addColorStop(0, col + "99"); gl.addColorStop(1, col + "00");
        c.fillStyle = gl; c.beginPath(); c.arc(x, y, size * 2.2, 0, Math.PI * 2); c.fill();
        c.fillStyle = "#14101f"; c.beginPath(); c.arc(x, y, size + 2, 0, Math.PI * 2); c.fill();
        c.fillStyle = col; c.beginPath(); c.arc(x, y, size, 0, Math.PI * 2); c.fill();
        if (st === "dieback") { c.strokeStyle = ROSE; c.lineWidth = 1; c.setLineDash([2, 3]); c.beginPath(); c.arc(x, y, size + 5, 0, Math.PI * 2); c.stroke(); c.setLineDash([]); }
        c.fillStyle = INK; c.textAlign = "center"; c.fillText(r.ticker, x, y - size - 8);
        c.fillStyle = INK3; c.font = "10px JetBrains Mono, monospace"; c.fillText(`${r.score.toFixed(2)} · ${r.r_4w >= 0 ? "+" : ""}${r.r_4w.toFixed(1)}%`, x, y + size + 13); c.font = "600 10.5px Inter, sans-serif";
      });
      c.textAlign = "left"; c.fillStyle = INK3; c.font = "11px Inter, sans-serif"; c.fillText(`data through ${d.asof} · distance = 1 − frontier score · size = 4-week move`, 18, H - 12);
    }
    fill() {
      const d = this.d, q = s => this.root.querySelector(s);
      const li = (arr, st) => arr.length ? arr.map(tk => { const r = d.ranking.find(x => x.ticker === tk); return `<li><b>${tk}</b> — score ${r.score.toFixed(2)} (${r.d_score >= 0 ? "+" : ""}${r.d_score.toFixed(2)} w/w), ${r.r_4w >= 0 ? "+" : ""}${r.r_4w.toFixed(1)}% in four weeks${r.r_entry != null ? `, ${r.r_entry >= 0 ? "+" : ""}${r.r_entry.toFixed(1)}% since entry` : ""}</li>`; }).join("") : `<li class="muted">none this week</li>`;
      const F = q("[data-feeding-now]"), D = q("[data-dieback]"), S = q("[data-surprise]"), T = q("[data-table]"), A = q("[data-asof]");
      if (F) F.innerHTML = li(d.feeding_now); if (D) D.innerHTML = li(d.dieback); if (S) S.innerHTML = li(d.surprise);
      if (A) A.textContent = `Data through ${d.asof} — the same reading as the vitals. Body (core-20) four-week move ${d.body.r_4w >= 0 ? "+" : ""}${d.body.r_4w}%.`;
      if (T) T.innerHTML = d.ranking.map(r => { const st = stateOf(d, r); return `<tr><td><b>${r.ticker}</b></td><td class="num">${r.score.toFixed(3)}</td><td class="num">${r.d_score >= 0 ? "+" : ""}${r.d_score.toFixed(3)}</td><td class="num">${r.r_1w >= 0 ? "+" : ""}${r.r_1w}%</td><td class="num">${r.r_4w >= 0 ? "+" : ""}${r.r_4w}%</td><td class="num">${r.r_entry == null ? "—" : (r.r_entry >= 0 ? "+" : "") + r.r_entry + "%"}</td><td>${r.arm}</td><td><span class="grade" style="background:${COL[st]}22;color:${COL[st]}">${WORDS[st]}</span></td></tr>`; }).join("");
    }
  }
  document.addEventListener("DOMContentLoaded", () => document.querySelectorAll("[data-feeding]").forEach(el => new Feeding(el)));
})();
