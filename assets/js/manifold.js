/* The Breathing Manifold — core-20 correlation cloud, animated frame to frame.
   Every frame is a committed embedding computed from real closes (tools/build_frames.py):
   distance = sqrt(2(1-ρ)) on a 60-trading-day window, classical MDS, Procrustes-aligned.
   Nothing here is synthetic. Coordinates are in distance units and drawn at a FIXED scale,
   so when the cloud shrinks on screen, it shrank in the data. */
(function () {
  const SECTOR = { Tech: "#c98500", Financial: "#d55181", Consumer: "#3987e5", Energy: "#d95926", Industrial: "#9085e9", Health: "#199e70" };
  const GOLD = "#e4b84a", INK = "#f2eefa", INK3 = "#8f86a8", LINE = "#2e2742", VIOLET = "#7c5cff";
  const TRACE_H = 78;

  class Manifold {
    constructor(root) {
      this.root = root;
      this.canvas = root.querySelector("canvas");
      this.ctx = this.canvas.getContext("2d");
      this.sources = { live: root.dataset.srcLive, gfc: root.dataset.srcGfc, covid: root.dataset.srcCovid };
      this.mode = root.dataset.mode || "live";
      this.data = null; this.pos = 0; this.playing = false; this.speed = 1; this.last = 0;
      this.reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
      this.bindControls();
      // lazy: fetch the replay only when the instrument is near the viewport
      if ("IntersectionObserver" in window) {
        const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); this.load(this.mode); } }, { rootMargin: "400px" });
        io.observe(root);
      } else this.load(this.mode);
      new ResizeObserver(() => { this.resize(); this.draw(); }).observe(this.canvas.parentElement);
      this.canvas.addEventListener("pointerdown", e => this.onPointer(e, true));
      this.canvas.addEventListener("pointermove", e => this.onPointer(e, false));
    }
    q(sel) { return this.root.querySelector(sel); }
    bindControls() {
      this.root.querySelectorAll("[data-mode]").forEach(b => b.addEventListener("click", () => {
        this.root.querySelectorAll("[data-mode]").forEach(x => { x.classList.toggle("on", x === b); x.setAttribute("aria-pressed", x === b ? "true" : "false"); });
        this.load(b.dataset.mode);
      }));
      const play = this.q("[data-play]"); if (play) play.addEventListener("click", () => this.toggle());
      const sp = this.q("[data-speed]"); if (sp) sp.addEventListener("click", () => { this.speed = this.speed >= 4 ? 0.5 : this.speed * 2; sp.textContent = this.speed + "×"; });
      const rng = this.q("input[type=range]"); if (rng) rng.addEventListener("input", () => { this.pos = +rng.value; this.playing = false; this.syncPlay(); this.draw(); });
      const restart = this.q("[data-restart]"); if (restart) restart.addEventListener("click", () => { this.pos = 0; this.playing = true; this.syncPlay(); });
    }
    async load(mode) {
      this.mode = mode; this.playing = false; this.syncPlay();
      const src = this.sources[mode]; if (!src) return;
      try {
        this.data = await fetch(src).then(r => r.json());
      } catch (e) { this.data = null; this.failed = true; this.draw(); return; }
      this.pos = mode === "live" ? this.data.frames.length - 1 : 0;
      const rng = this.q("input[type=range]"); if (rng) { rng.max = this.data.frames.length - 1; rng.value = this.pos; }
      this.speed = mode === "live" ? 0.5 : 1; const sp = this.q("[data-speed]"); if (sp) sp.textContent = this.speed + "×";
      const cap = this.q("[data-caption]");
      if (cap) cap.textContent = mode === "live"
        ? "Live: the core-20 basket, weekly frames from the vitals-machine panel. Drawn at the same scale as the replays — compare the room."
        : mode === "gfc"
          ? "Replay, 2006 → 2010: twenty stocks from the research panel. Watch the room close in August 2007 — thirteen months before Lehman."
          : "Replay, mid-2019 → mid-2021: the same twenty. No warning, a 23-day collapse, then a fast, near-symmetric re-inflation.";
      this.resize(); this.draw();
      if (mode !== "live" && !this.reduced) { this.playing = true; this.syncPlay(); }
    }
    toggle() { this.playing = !this.playing; if (this.playing && this.pos >= this.data.frames.length - 1) this.pos = 0; this.syncPlay(); }
    syncPlay() {
      const b = this.q("[data-play]"); if (b) b.textContent = this.playing ? "❚❚ Pause" : "▶ Play";
      if (this.playing) { this.last = performance.now(); requestAnimationFrame(t => this.tick(t)); }
    }
    tick(t) {
      if (!this.playing || !this.data) return;
      const dt = Math.max(0, Math.min(0.1, (t - this.last) / 1000)); this.last = t;
      const fps = this.mode === "live" ? 0.9 : 2.2; // frames per second at 1×
      this.pos += dt * fps * this.speed;
      if (this.pos >= this.data.frames.length - 1) { this.pos = this.data.frames.length - 1; this.playing = false; this.syncPlay(); }
      const rng = this.q("input[type=range]"); if (rng) rng.value = this.pos;
      this.draw();
      if (this.playing) requestAnimationFrame(tt => this.tick(tt));
    }
    resize() {
      const w = this.canvas.parentElement.clientWidth || 800;
      const h = Math.max(420, Math.min(640, Math.round(w * 0.6)));
      const dpr = Math.min(2, devicePixelRatio || 1);
      this.W = w; this.H = h;
      this.canvas.width = w * dpr; this.canvas.height = h * dpr;
      this.canvas.style.height = h + "px";
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    frameAt(p) {
      const F = this.data.frames; p = Math.max(0, Math.min(F.length - 1, p || 0)); const i = Math.floor(p), j = Math.min(F.length - 1, i + 1), t = p - i;
      const a = F[i], b = F[j], e = t * t * (3 - 2 * t); // smoothstep
      const lerp = (x, y) => x + (y - x) * e;
      return {
        date: t < 0.5 ? a.date : b.date, dim: lerp(a.dim, b.dim), rho: lerp(a.rho, b.rho), sep: lerp(a.sep, b.sep),
        xy: a.xy.map((q, k) => [lerp(q[0], b.xy[k][0]), lerp(q[1], b.xy[k][1])]),
        corr: a.corr.map((c, k) => lerp(c, b.corr[k]) / 100), raw: a,
      };
    }
    onPointer(e, down) {
      if (!this.data) return;
      const r = this.canvas.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
      const inTrace = y > this.H - TRACE_H;
      if (inTrace && (down || e.buttons === 1)) {
        const p = Math.max(0, Math.min(1, (x - 40) / (this.W - 60)));
        this.pos = p * (this.data.frames.length - 1); this.playing = false; this.syncPlay();
        const rng = this.q("input[type=range]"); if (rng) rng.value = this.pos;
        this.draw();
      }
    }
    draw() {
      const c = this.ctx, W = this.W, H = this.H; if (!W) return;
      c.clearRect(0, 0, W, H);
      c.fillStyle = "#14101f"; c.fillRect(0, 0, W, H);
      if (!this.data) { c.fillStyle = INK3; c.font = "14px Inter, sans-serif"; c.fillText(this.failed ? "The manifold data could not be loaded." : "Loading the constellation…", 20, 30); return; }
      const f = this.frameAt(this.pos), T = this.data.tickers, S = this.data.sectors;
      const plotH = H - TRACE_H, top = 64, cx = W / 2, cy = top + (plotH - top) / 2;
      const scale = Math.min(W / 2.2, (plotH - top) / 2.3); // px per distance unit — FIXED across frames and modes
      const phone = W < 480;
      // breathing-room ring: radius is a monotone map of effective dimension (0.105 units per dimension)
      const ring = scale * 0.105 * f.dim;
      const g = c.createRadialGradient(cx, cy, ring * 0.2, cx, cy, ring);
      g.addColorStop(0, "rgba(124,92,255,0.10)"); g.addColorStop(1, "rgba(124,92,255,0)");
      c.fillStyle = g; c.beginPath(); c.arc(cx, cy, ring, 0, Math.PI * 2); c.fill();
      c.strokeStyle = "rgba(167,139,250,0.35)"; c.setLineDash([3, 5]); c.lineWidth = 1;
      c.beginPath(); c.arc(cx, cy, ring, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
      if (!phone) { const lbl = "breathing room ∝ effective dimension"; c.fillStyle = INK3; c.font = "11px Inter, sans-serif"; c.textAlign = "left";
        c.fillText(lbl, Math.min(cx + ring * 0.71 + 6, W - 18 - c.measureText(lbl).width), cy - ring * 0.71 - 4); }
      // edges: correlation above 0.35 draws a strand; strength → opacity and width
      const P = f.xy.map(([x, y]) => [cx + x * scale, cy + y * scale]);
      let k = 0;
      for (let i = 0; i < T.length; i++) for (let j = i + 1; j < T.length; j++, k++) {
        const r = f.corr[k]; if (r < 0.35) continue;
        const a = (r - 0.35) / 0.65;
        c.strokeStyle = `rgba(228,184,74,${(0.06 + a * 0.55).toFixed(3)})`; c.lineWidth = 0.6 + a * 1.6;
        c.beginPath(); c.moveTo(P[i][0], P[i][1]); c.lineTo(P[j][0], P[j][1]); c.stroke();
      }
      // stars
      c.font = phone ? "600 9px Inter, sans-serif" : "600 10.5px Inter, sans-serif"; c.textAlign = "center";
      const placed = [];
      P.forEach(([x, y], i) => {
        const col = SECTOR[S[i]] || GOLD;
        const glow = c.createRadialGradient(x, y, 1, x, y, 14);
        glow.addColorStop(0, col + "aa"); glow.addColorStop(1, col + "00");
        c.fillStyle = glow; c.beginPath(); c.arc(x, y, 14, 0, Math.PI * 2); c.fill();
        c.fillStyle = "#14101f"; c.beginPath(); c.arc(x, y, 6.2, 0, Math.PI * 2); c.fill(); // 2px surface ring
        c.fillStyle = col; c.beginPath(); c.arc(x, y, 4.4, 0, Math.PI * 2); c.fill();
        const tw = c.measureText(T[i]).width, box = [x - tw / 2, y - 18, x + tw / 2, y - 7];
        if (!phone || !placed.some(b => b[0] < box[2] && b[2] > box[0] && b[1] < box[3] && b[3] > box[1])) { c.fillStyle = INK; c.fillText(T[i], x, y - 9); placed.push(box); }
      });
      // readout
      c.textAlign = "left"; c.fillStyle = INK; c.font = "500 26px Fraunces, Georgia, serif";
      c.fillText(f.dim.toFixed(2), 18, 38);
      c.fillStyle = INK3; c.font = "11px Inter, sans-serif"; c.fillText("EFFECTIVE DIMENSION", 18, 52);
      c.fillStyle = INK; c.font = "500 15px JetBrains Mono, monospace"; c.textAlign = "right";
      c.fillText(f.date, W - 18, 32);
      c.fillStyle = INK3; c.font = "11px Inter, sans-serif";
      c.fillText(`mean ρ ${f.rho.toFixed(3)}   ·   separation ${f.sep.toFixed(2)}`, W - 18, 50);
      // live event label (replays)
      const ev = (this.data.events || []).filter(([d]) => d <= f.date).pop();
      if (ev && this.mode !== "live") {
        const days = (new Date(f.date) - new Date(ev[0])) / 864e5;
        if (days < 120) { c.fillStyle = GOLD; c.font = "500 13px Fraunces, Georgia, serif"; c.textAlign = "right"; c.fillText(ev[1] + " · " + ev[0], W - 18, 70); }
      }
      this.drawTrace(f);
      const ro = this.q("[data-readout]");
      if (ro) ro.innerHTML = `<span>${f.date}</span><span>dim <b>${f.dim.toFixed(2)}</b></span><span>ρ <b>${f.rho.toFixed(3)}</b></span><span>sep <b>${f.sep.toFixed(2)}</b></span><span class="muted">${window.MD && MD.readDim ? MD.readDim(f.dim) : ""}</span>`;
    }
    drawTrace(f) {
      const c = this.ctx, W = this.W, H = this.H, F = this.data.frames;
      const x0 = 40, x1 = W - 20, y0 = H - TRACE_H + 14, y1 = H - 16;
      c.fillStyle = "#0f0c19"; c.fillRect(0, H - TRACE_H, W, TRACE_H);
      c.strokeStyle = LINE; c.lineWidth = 1; c.beginPath(); c.moveTo(0, H - TRACE_H + 0.5); c.lineTo(W, H - TRACE_H + 0.5); c.stroke();
      const dmax = 11, dmin = 1;
      const X = i => x0 + (x1 - x0) * (i / (F.length - 1));
      const Y = d => y1 - (y1 - y0) * ((d - dmin) / (dmax - dmin));
      c.fillStyle = INK3; c.font = "10px Inter, sans-serif"; c.textAlign = "right";
      [2, 6, 10].forEach(d => { c.fillText(d, x0 - 6, Y(d) + 3); c.strokeStyle = "rgba(46,39,66,0.8)"; c.beginPath(); c.moveTo(x0, Y(d) + 0.5); c.lineTo(x1, Y(d) + 0.5); c.stroke(); });
      // events
      c.textAlign = "center"; let lastRight = -1e9, row = 0;
      (this.data.events || []).forEach(([d, label]) => {
        let i = F.findIndex(fr => fr.date >= d); if (i < 0) return;
        c.strokeStyle = "rgba(228,184,74,0.35)"; c.beginPath(); c.moveTo(X(i) + 0.5, y0 - 8); c.lineTo(X(i) + 0.5, y1); c.stroke();
        const t = label.split(" /")[0].split(" ·")[0], tw = c.measureText(t).width;
        row = (X(i) - tw / 2 < lastRight + 6) ? 1 - row : 0; lastRight = X(i) + tw / 2;
        c.fillStyle = GOLD; c.fillText(t, X(i), y0 - 10 - row * 11);
      });
      // dimension line
      c.strokeStyle = VIOLET; c.lineWidth = 2; c.lineJoin = "round"; c.beginPath();
      F.forEach((fr, i) => { const x = X(i), y = Y(fr.dim); i ? c.lineTo(x, y) : c.moveTo(x, y); });
      c.stroke();
      // cursor
      const xc = x0 + (x1 - x0) * (this.pos / (F.length - 1));
      c.strokeStyle = GOLD; c.lineWidth = 1; c.beginPath(); c.moveTo(xc + 0.5, y0 - 6); c.lineTo(xc + 0.5, y1); c.stroke();
      c.fillStyle = "#14101f"; c.beginPath(); c.arc(xc, Y(f.dim), 6, 0, Math.PI * 2); c.fill();
      c.fillStyle = GOLD; c.beginPath(); c.arc(xc, Y(f.dim), 4, 0, Math.PI * 2); c.fill();
      c.fillStyle = INK3; c.font = "10px Inter, sans-serif"; c.textAlign = "left"; c.fillText(F[0].date, x0, H - 4);
      c.textAlign = "right"; c.fillText(F[F.length - 1].date, x1, H - 4);
      c.textAlign = "center"; c.fillText("effective dimension — drag to scrub", (x0 + x1) / 2, H - 4);
    }
  }
  document.addEventListener("DOMContentLoaded", () => document.querySelectorAll("[data-manifold]").forEach(el => new Manifold(el)));
})();
