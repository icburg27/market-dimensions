"""Pull published Readings (letters/final/*.md in vitals-machine) into content/readings/ as Hugo pages.
Public repo, no token. Idempotent. The site never edits a letter; it renders it as published."""
import os, json, re, urllib.request
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = "https://raw.githubusercontent.com/icburg27/vitals-machine/main/"
OUT = os.path.join(ROOT, "content", "readings")

def fetch(path):
    with urllib.request.urlopen(RAW + path, timeout=60) as r: return r.read().decode()

def main():
    try: idx = json.loads(fetch("letters/final/index.json"))
    except Exception as e: print("no published readings yet:", e); return 0
    os.makedirs(OUT, exist_ok=True); n = 0
    for m in idx:
        md = fetch(m["final"]); body = md.split("\n", 1)[1] if md.startswith("# ") else md
        body = body.replace("[Unsubscribe]({{ unsubscribe_url }})", "")
        desc = re.search(r"Effective dimension \*\*([\d.]+)\*\*.*?— ([^.]+)\.", body)
        description = f"Effective dimension {desc.group(1)} — {desc.group(2)}." if desc else "The week's reading."
        fm = ["---", f'title: "{m["title"].replace(chr(34), chr(39))}"', f'date: {m["date"]}',
              f'description: "{description}"', f'kind: {m["kind"]}', f'issue: {m.get("issue", 0)}',
              f'verdict_by: "{m.get("verdict_by", "")}"', 'author: "The machine drafts; the CEO verdicts"', "---", ""]
        open(os.path.join(OUT, f'{m["date"]}.md'), "w").write("\n".join(fm) + body); n += 1
    print(f"synced {n} readings"); return 0

if __name__ == "__main__": raise SystemExit(main())
