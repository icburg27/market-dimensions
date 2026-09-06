/* History charts from metrics.csv (Chart.js, loaded from cdnjs). One axis per chart — never dual. */
(function () {
  const INK3 = "#8f86a8", LINE = "rgba(46,39,66,0.9)";
  const SERIES = [
    { key: "eff_dim", title: "Effective dimension", color: "#e4b84a", d: 2, note: "breathing room — higher is more differentiated" },
    { key: "mean_corr", title: "Mean pairwise correlation", color: "#a78bfa", d: 3, note: "tissue tightness — rises as the body clenches" },
    { key: "separation", title: "Cluster separation", color: "#3ec28f", d: 3, note: "between-cluster ÷ within-cluster distance — read WITH dimension" },
    { key: "mst_len", title: "Minimum spanning tree length", color: "#3987e5", d: 2, note: "total length of the shortest tree through all twenty — shrinks in a huddle" },
  ];
  function build(rows) {
    if (!window.Chart) return;
    Chart.defaults.color = INK3; Chart.defaults.font.family = "Inter, system-ui, sans-serif"; Chart.defaults.font.size = 11;
    SERIES.forEach(s => {
      const el = document.getElementById("chart-" + s.key); if (!el) return;
      const data = rows.filter(r => r[s.key] != null);
      new Chart(el, {
        type: "line",
        data: { labels: data.map(r => r.date), datasets: [{ label: s.title, data: data.map(r => r[s.key]), borderColor: s.color, borderWidth: 2, pointRadius: 0, pointHitRadius: 12, pointHoverRadius: 4, pointHoverBackgroundColor: s.color, tension: 0.25, fill: false }] },
        options: {
          responsive: true, maintainAspectRatio: false, animation: false,
          interaction: { mode: "index", intersect: false },
          plugins: { legend: { display: false }, tooltip: { backgroundColor: "#1c1729", borderColor: "#2e2742", borderWidth: 1, titleColor: "#f2eefa", bodyColor: "#c9c1dc", displayColors: false, callbacks: { label: c => s.title + ": " + (+c.parsed.y).toFixed(s.d) } } },
          scales: {
            x: { grid: { display: false }, ticks: { maxTicksLimit: 6, callback: (v, i) => data[i] ? data[i].date.slice(0, 7) : "" } },
            y: { grid: { color: LINE }, border: { display: false }, ticks: { maxTicksLimit: 5 } },
          },
        },
      });
      const n = el.closest(".card") && el.closest(".card").querySelector("[data-note]"); if (n) n.textContent = s.note;
    });
    const tb = document.getElementById("metrics-table");
    if (tb) tb.innerHTML = rows.slice().reverse().map(r => `<tr><td class="num">${r.date}</td><td class="num">${fmt(r.eff_dim, 2)}</td><td class="num">${fmt(r.mean_corr, 3)}</td><td class="num">${fmt(r.separation, 3)}</td><td class="num">${fmt(r.mst_len, 2)}</td><td class="num">${fmt(r.vorticity, 3)}</td></tr>`).join("");
  }
  const fmt = (v, d) => v == null ? "—" : (+v).toFixed(d);
  document.addEventListener("md:vitals", e => build(e.detail.metrics));
  document.addEventListener("DOMContentLoaded", () => { if (window.MD && MD._metrics) build(MD._metrics); });
})();
