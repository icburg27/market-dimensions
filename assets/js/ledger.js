/* Ledger renderer — predictions.yml + grades.csv, rendered as found. Nothing is edited here. */
(function () {
  const esc = s => String(s ?? "").replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const gradeClass = g => { g = (g || "").toLowerCase(); return ["tracking","pass","fail","mixed","partial","pending","leaning","hit","miss","correct","wrong"].find(k => g.includes(k)) || "tracking"; };
  async function render() {
    const root = document.getElementById("ledger"); if (!root) return;
    let P, G;
    try { P = await MD.predictions(); G = await MD.grades(); } catch (e) { root.innerHTML = `<p class="muted">The ledger could not be loaded right now. Read it at the source: <a href="${MD.repo}/tree/main/ledger">${MD.repo}/tree/main/ledger</a></p>`; return; }
    const preds = P.data, grades = G.data;
    const byId = {};
    grades.forEach(g => { const base = g.id.replace(/-(status|dispute|note)$/i, ""); (byId[base] ||= []).push(g); });
    root.innerHTML = preds.map(p => {
      const gs = byId[p.id] || [];
      const latest = gs.length ? gs[gs.length - 1] : null;
      return `<div class="pred" id="${esc(p.id)}">
        <div><div class="id">${esc(p.id)}</div>${latest ? `<span class="grade ${gradeClass(latest.grade)}">${esc(latest.grade)}</span>` : `<span class="grade pending">unscored</span>`}</div>
        <div>
          <div class="claim">${esc(p.claim)}</div>
          <div class="meta">registered ${esc(p.registered)} · due ${esc(p.due)} · grader: ${esc(p.grader)}</div>
          ${gs.length ? `<details class="small" style="margin-top:8px"><summary>${gs.length} ledger ${gs.length === 1 ? "entry" : "entries"}</summary><div class="table-wrap"><table><thead><tr><th>date</th><th>entry</th><th>grade</th><th>evidence</th></tr></thead><tbody>${gs.map(g => `<tr><td class="num">${esc(g.date)}</td><td class="num">${esc(g.id)}</td><td>${esc(g.grade)}</td><td>${esc(g.evidence)}</td></tr>`).join("")}</tbody></table></div></details>` : ""}
        </div></div>`;
    }).join("");
    const meta = document.getElementById("ledger-meta");
    if (meta) meta.innerHTML = `${P.live ? "Live from the repo" : "Baked at build"} · ${preds.length} pre-registered predictions · ${grades.length} ledger entries · <a href="${MD.repo}/commits/main/ledger/grades.csv">commit history of every grade</a>`;
    const raw = document.getElementById("grades-raw"); if (raw) raw.textContent = grades.map(g => `${g.id},${g.date},${g.grade},"${g.evidence}"`).join("\n");
  }
  document.addEventListener("DOMContentLoaded", render);
})();
