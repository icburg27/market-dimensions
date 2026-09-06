/* The Dimension Gauge — effective dimension as a slow breath.
   Amplitude of the breath = breathing room (eff_dim mapped 2 → 10). Period is slow on purpose.
   History scrubber reads metrics.csv from the repo (live) or the baked copy. */
(function () {
  const GOLD = "#e4b84a", VIOLET = "#7c5cff", INK3 = "#8f86a8";
  class Gauge {
    constructor(root) {
      this.root = root; this.canvas = root.querySelector("canvas"); this.ctx = this.canvas.getContext("2d");
      this.num = root.querySelector("[data-gauge-num]"); this.read = root.querySelector("[data-gauge-read]");
      this.date = root.querySelector("[data-gauge-date]"); this.rng = root.querySelector("input[type=range]");
      this.dim = null; this.rows = []; this.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      new ResizeObserver(() => this.resize()).observe(this.canvas.parentElement);
      this.resize();
      document.addEventListener("md:vitals", e => this.setRows(e.detail.metrics, e.detail.latest));
      if (window.MD && MD._metrics) this.setRows(MD._metrics, MD._latest);
      else if (window.MD && MD.metrics && !document.getElementById("vitals-strip")) MD.metrics().then(m => this.setRows(m.data)).catch(() => {});
      if (this.rng) this.rng.addEventListener("input", () => this.show(+this.rng.value));
      requestAnimationFrame(t => this.tick(t));
      document.addEventListener("visibilitychange", () => { if (!document.hidden) this.wake(); });
    }
    setRows(rows, latest) {
      this.rows = (rows || []).filter(r => r.eff_dim != null);
      if (!this.rows.length && latest) this.rows = [{ date: latest.asof, eff_dim: latest.eff_dim }];
      if (this.rng) { this.rng.max = Math.max(0, this.rows.length - 1); this.rng.value = this.rows.length - 1; }
      this.show(this.rows.length - 1);
    }
    show(i) {
      const r = this.rows[i]; if (!r) return;
      this.dim = r.eff_dim; this.idx = i;
      if (this.num) this.num.textContent = r.eff_dim.toFixed(2);
      if (this.date) this.date.textContent = r.date + (i === this.rows.length - 1 ? " · latest reading" : "");
      if (this.read) this.read.textContent = MD.readDim(r.eff_dim);
      this.wake();
    }
    resize() {
      const w = this.canvas.parentElement.clientWidth || 600, h = 300, dpr = Math.min(2, devicePixelRatio || 1);
      this.W = w; this.H = h; this.canvas.width = w * dpr; this.canvas.height = h * dpr; this.canvas.style.height = h + "px";
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.wake();
    }
    tick(t) {
      const c = this.ctx, W = this.W, H = this.H; c.clearRect(0, 0, W, H);
      c.fillStyle = "#14101f"; c.fillRect(0, 0, W, H);
      const cx = W / 2, cy = H / 2 - 6;
      const room = this.dim == null ? 0 : Math.max(0, Math.min(1, (this.dim - 2) / 8)); // 2 = huddle, 10 = wide
      const period = 6000 + (1 - room) * 2000; // shallow breaths are also quicker
      const phase = this.reduced ? 0.5 : (Math.sin((t / period) * Math.PI * 2) + 1) / 2;
      const rMin = 34, rMax = Math.min(H * 0.42, W * 0.3);
      const amp = rMin + (rMax - rMin) * room;
      const r = rMin + (amp - rMin) * phase;
      // reference rings: where a 10-dim breath and a 2-dim breath would reach
      c.setLineDash([2, 6]); c.lineWidth = 1;
      c.strokeStyle = "rgba(167,139,250,0.35)"; c.beginPath(); c.arc(cx, cy, rMax, 0, Math.PI * 2); c.stroke();
      c.strokeStyle = "rgba(229,100,122,0.4)"; c.beginPath(); c.arc(cx, cy, rMin, 0, Math.PI * 2); c.stroke();
      c.setLineDash([]);
      c.fillStyle = INK3; c.font = "10px Inter, sans-serif"; c.textAlign = "center";
      c.fillText("dim 10 — wide", cx, cy - rMax - 6); c.fillText("dim 2 — huddle", cx, cy + rMin + 14);
      // the breath
      const g = c.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
      g.addColorStop(0, "rgba(228,184,74,0.55)"); g.addColorStop(0.7, "rgba(124,92,255,0.28)"); g.addColorStop(1, "rgba(124,92,255,0)");
      c.fillStyle = g; c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.fill();
      c.strokeStyle = GOLD; c.lineWidth = 1.5; c.beginPath(); c.arc(cx, cy, r, 0, Math.PI * 2); c.stroke();
      // trailing max marker for the T2 disease tripwire (75% of trailing max)
      if (this.rows.length > 3 && this.idx != null) {
        const upto = this.rows.slice(Math.max(0, this.idx - 39), this.idx + 1).map(x => x.eff_dim);
        const mx = Math.max(...upto), thr = 0.75 * mx, roomT = Math.max(0, Math.min(1, (thr - 2) / 8));
        const rt = rMin + (rMax - rMin) * roomT;
        c.setLineDash([4, 4]); c.strokeStyle = "rgba(224,161,46,0.55)"; c.beginPath(); c.arc(cx, cy, rt, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
        c.fillStyle = "rgba(224,161,46,0.9)"; c.textAlign = "center"; c.fillText(`T2 line · 75% of trailing max (${thr.toFixed(1)})`, cx, H - 8);
      }
      if (!this.reduced && !document.hidden) requestAnimationFrame(tt => this.tick(tt));
      else this._parked = true;
    }
    wake() { if (this._parked) { this._parked = false; requestAnimationFrame(t => this.tick(t)); } }
  }
  document.addEventListener("DOMContentLoaded", () => document.querySelectorAll("[data-gauge]").forEach(el => new Gauge(el)));
})();
