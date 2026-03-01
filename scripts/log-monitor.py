#!/usr/bin/env python3
"""
FiberPlan Chrome Extension - Real-Time Log Monitor & Analyzer

Usage:
    python scripts/log-monitor.py

Opens HTTP server on port 7777. Chrome Extension sends logs here.
Displays real-time color-coded logs in terminal.
Auto-detects errors and suggests fixes.

Features:
- Real-time log display with color coding
- Error pattern detection and auto-diagnosis
- DOM mutation tracking (BB rows, map, buttons)
- Session statistics
- Log file export
"""

import http.server
import json
import os
import sys
import time
from datetime import datetime
from collections import defaultdict
from pathlib import Path

# Fix Windows console encoding for box-drawing characters
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")
    sys.stderr.reconfigure(encoding="utf-8")

# ─── CONFIG ─────────────────────────────────────────────────────────
PORT = 7777
LOG_DIR = Path(__file__).parent.parent / "logs"
LOG_DIR.mkdir(exist_ok=True)
LOG_FILE = LOG_DIR / f"fiberplan-{datetime.now().strftime('%Y%m%d-%H%M%S')}.jsonl"

# ─── ANSI COLORS ────────────────────────────────────────────────────
class C:
    RESET   = "\033[0m"
    BOLD    = "\033[1m"
    DIM     = "\033[2m"
    RED     = "\033[91m"
    GREEN   = "\033[92m"
    YELLOW  = "\033[93m"
    BLUE    = "\033[94m"
    MAGENTA = "\033[95m"
    CYAN    = "\033[96m"
    WHITE   = "\033[97m"
    GRAY    = "\033[90m"
    BG_RED  = "\033[41m"
    BG_YEL  = "\033[43m"
    BG_GRN  = "\033[42m"
    BG_BLU  = "\033[44m"

LEVEL_STYLE = {
    "LOG":       f"{C.GREEN}LOG{C.RESET}",
    "WARN":      f"{C.YELLOW}{C.BOLD}WRN{C.RESET}",
    "ERROR":     f"{C.RED}{C.BOLD}ERR{C.RESET}",
    "EXCEPTION": f"{C.BG_RED}{C.WHITE}{C.BOLD} EXC {C.RESET}",
    "DOM":       f"{C.CYAN}DOM{C.RESET}",
    "NET":       f"{C.BLUE}NET{C.RESET}",
}

SOURCE_STYLE = {
    "console":   C.WHITE,
    "window.onerror": C.RED,
    "unhandledrejection": C.RED,
    "table":     C.CYAN,
    "map":       C.BLUE,
    "button":    C.MAGENTA,
    "inject":    C.GREEN,
    "debug":     C.GRAY,
    "snapshot":  C.YELLOW,
    "manual":    C.WHITE,
}

# ─── STATS ──────────────────────────────────────────────────────────
stats = defaultdict(int)
errors = []
dom_events = []
session_start = time.time()

# ─── ERROR PATTERN DATABASE ────────────────────────────────────────
ERROR_PATTERNS = [
    {
        "pattern": "NviScraper is not defined",
        "diagnosis": "scraper.js yuklenmedi veya manifest.json'da siralama hatasi",
        "fix": "manifest.json'da content_scripts.js sirasini kontrol et: scraper.js, main.js'den ONCE olmali"
    },
    {
        "pattern": "PonEngine is not defined",
        "diagnosis": "pon-engine.js yuklenmedi",
        "fix": "manifest.json'da lib/pon-engine.js content_scripts listesinin en basinda olmali"
    },
    {
        "pattern": "Topology is not defined",
        "diagnosis": "topology.js yuklenmedi veya pon-engine.js'den sonra yuklenmiyor",
        "fix": "manifest.json siralama: pon-engine.js > topology.js > storage.js > map-utils.js"
    },
    {
        "pattern": "Storage is not defined",
        "diagnosis": "storage.js yuklenmedi",
        "fix": "manifest.json'da lib/storage.js kontrol et"
    },
    {
        "pattern": "Panels is not defined",
        "diagnosis": "panels.js yuklenmedi",
        "fix": "manifest.json'da content/panels.js, content/main.js'den ONCE olmali"
    },
    {
        "pattern": "Overlay is not defined",
        "diagnosis": "overlay.js yuklenmedi",
        "fix": "manifest.json'da content/overlay.js kontrol et"
    },
    {
        "pattern": "MapUtils is not defined",
        "diagnosis": "map-utils.js yuklenmedi",
        "fix": "manifest.json'da lib/map-utils.js kontrol et"
    },
    {
        "pattern": "Cannot read properties of null",
        "diagnosis": "DOM elementi bulunamadi - NVI sayfa yapisi degismis olabilir",
        "fix": "snapshot() calistir, DOM yapisi kontrol et. Selector'lar guncellenmeli olabilir"
    },
    {
        "pattern": "document.getElementById",
        "diagnosis": "fp-toolbar, fp-side-panel veya fp-bottom-panel DOM'a eklenemedi",
        "fix": "Panels.init() NVI sayfasinda body'ye element ekleyemiyor olabilir. CSP kontrol et"
    },
    {
        "pattern": "Content Security Policy",
        "diagnosis": "NVI sayfasi CSP ile stil/script enjeksiyonu engelliyor",
        "fix": "manifest.json'da web_accessible_resources guncelle"
    },
    {
        "pattern": "bagimsizbolumkimlikno",
        "diagnosis": "BB row selector calisiyor ama veri cekilemiyor",
        "fix": "NVI tablo DOM yapisini kontrol et: label ID'leri degismis olabilir"
    },
    {
        "pattern": "Timeout",
        "diagnosis": "Beklenen element DOM'da belirmedi",
        "fix": "NVI sayfasi yavas yukleniyor veya selector yanlis"
    },
    {
        "pattern": "IndexedDB",
        "diagnosis": "IndexedDB erisim hatasi",
        "fix": "Extension permission'lari kontrol et. Incognito modda calismaz"
    },
    {
        "pattern": "net::ERR",
        "diagnosis": "Ag hatasi - muhtemelen Esri tile veya local server erisimi",
        "fix": "Internet baglantisi kontrol et. Local server icin host_permissions guncelle"
    },
    {
        "pattern": "0 BB rows",
        "diagnosis": "Tabloda hic BB satiri bulunamadi",
        "fix": "NVI'de adres sorgulayip sonuc tablosu gelmesini bekle"
    },
]


def diagnose_error(message, data=None):
    """Match error against known patterns and return diagnosis."""
    results = []
    full_text = message
    if data:
        if isinstance(data, dict) and "stack" in data:
            full_text += " " + str(data.get("stack", ""))

    for pattern in ERROR_PATTERNS:
        if pattern["pattern"].lower() in full_text.lower():
            results.append(pattern)

    return results


def format_elapsed(ms):
    """Format elapsed time."""
    if ms < 1000:
        return f"{ms}ms"
    elif ms < 60000:
        return f"{ms/1000:.1f}s"
    else:
        return f"{ms/60000:.1f}m"


def print_log(item):
    """Print a single log entry with formatting."""
    level = item.get("level", "LOG")
    source = item.get("source", "?")
    message = item.get("message", "")
    data = item.get("data")
    elapsed = item.get("elapsed", 0)
    seq = item.get("seq", 0)

    # Level badge
    level_str = LEVEL_STYLE.get(level, level)

    # Source color
    src_color = SOURCE_STYLE.get(source, C.GRAY)

    # Time
    time_str = f"{C.GRAY}{format_elapsed(elapsed):>8}{C.RESET}"

    # Sequence
    seq_str = f"{C.DIM}#{seq:<4}{C.RESET}"

    # Main line
    print(f"  {seq_str} {time_str} {level_str} {src_color}[{source}]{C.RESET} {message}")

    # Data (if present and interesting)
    if data and isinstance(data, dict):
        # Compact important fields
        important = {}
        for key in ["filename", "lineno", "stack", "bbRows", "verifyButtons",
                     "fpButtons", "hasMap", "tables", "rows", "buildings",
                     "buildingNames", "adaGroups", "sampleRow"]:
            if key in data:
                important[key] = data[key]

        if important:
            for k, v in important.items():
                if k == "stack" and v:
                    # Print stack trace lines
                    for line in str(v).split("\n")[:5]:
                        line = line.strip()
                        if line:
                            print(f"          {C.DIM}{line}{C.RESET}")
                elif k == "sampleRow" and isinstance(v, dict):
                    labels = v.get("labels", [])
                    if labels:
                        label_str = ", ".join(f'{l["id"]}="{l["text"][:20]}"' for l in labels[:6])
                        print(f"          {C.CYAN}labels: {label_str}{C.RESET}")
                    html = v.get("html", "")
                    if html:
                        print(f"          {C.DIM}html: {html[:120]}...{C.RESET}")
                elif k == "buildingNames" and isinstance(v, list):
                    for bn in v:
                        print(f"          {C.GREEN}  > {bn}{C.RESET}")
                else:
                    val_str = str(v)[:100]
                    print(f"          {C.DIM}{k}: {val_str}{C.RESET}")

    # Error diagnosis
    if level in ("ERROR", "EXCEPTION", "WARN"):
        diagnoses = diagnose_error(message, data)
        for d in diagnoses:
            print(f"          {C.BG_YEL}{C.BOLD} TANI {C.RESET} {C.YELLOW}{d['diagnosis']}{C.RESET}")
            print(f"          {C.BG_GRN}{C.BOLD} FIX  {C.RESET} {C.GREEN}{d['fix']}{C.RESET}")
            print()

    stats[level] += 1
    if level in ("ERROR", "EXCEPTION"):
        errors.append(item)


def print_separator():
    print(f"  {C.DIM}{'─' * 80}{C.RESET}")


def print_stats():
    """Print session statistics."""
    elapsed = time.time() - session_start
    print()
    print_separator()
    print(f"  {C.BOLD}SESSION STATS{C.RESET}  ({elapsed:.0f}s)")
    print(f"  {C.GREEN}LOG: {stats['LOG']}{C.RESET}  "
          f"{C.YELLOW}WARN: {stats['WARN']}{C.RESET}  "
          f"{C.RED}ERROR: {stats['ERROR']}{C.RESET}  "
          f"{C.BG_RED}{C.WHITE} EXC: {stats['EXCEPTION']} {C.RESET}  "
          f"{C.CYAN}DOM: {stats['DOM']}{C.RESET}")

    if errors:
        print(f"\n  {C.RED}{C.BOLD}UNRESOLVED ERRORS ({len(errors)}):{C.RESET}")
        for e in errors[-5:]:
            print(f"    {C.RED}> {e['message'][:80]}{C.RESET}")

    print_separator()
    print()


# ─── HTTP SERVER ────────────────────────────────────────────────────

class LogHandler(http.server.BaseHTTPRequestHandler):
    """Handle POST /log from Chrome Extension."""

    def do_POST(self):
        if self.path != "/log":
            self.send_response(404)
            self.end_headers()
            return

        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length)

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(b'{"ok":true}')

        try:
            payload = json.loads(body)
            batch = payload.get("batch", [])

            for item in batch:
                print_log(item)
                # Write to log file
                with open(LOG_FILE, "a", encoding="utf-8") as f:
                    f.write(json.dumps(item, ensure_ascii=False) + "\n")

        except json.JSONDecodeError as e:
            print(f"  {C.RED}JSON parse error: {e}{C.RESET}")

    def do_OPTIONS(self):
        """Handle CORS preflight."""
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        """GET /stats - return session stats."""
        if self.path == "/stats":
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            data = {
                "elapsed": time.time() - session_start,
                "stats": dict(stats),
                "errors": len(errors),
                "lastErrors": [{"message": e["message"], "source": e["source"]} for e in errors[-10:]]
            }
            self.wfile.write(json.dumps(data).encode())
        elif self.path == "/snapshot":
            self.send_response(200)
            self.send_header("Content-Type", "text/plain")
            self.send_header("Access-Control-Allow-Origin", "*")
            self.end_headers()
            self.wfile.write(b"Snapshot request sent. Check extension console.")
        else:
            self.send_response(200)
            self.send_header("Content-Type", "text/html")
            self.end_headers()
            self.wfile.write(b"""
            <h2>FiberPlan Log Monitor</h2>
            <p>Server running. Logs displayed in terminal.</p>
            <ul>
                <li><a href="/stats">GET /stats</a> - Session statistics</li>
                <li>POST /log - Receive logs from extension</li>
            </ul>
            """)

    def log_message(self, format, *args):
        """Suppress default HTTP access logs."""
        pass


# ─── MAIN ───────────────────────────────────────────────────────────

def main():
    print()
    print(f"  {C.BG_BLU}{C.WHITE}{C.BOLD}  FIBERPLAN LOG MONITOR  {C.RESET}")
    print()
    print(f"  {C.CYAN}Server:{C.RESET}  http://127.0.0.1:{PORT}")
    print(f"  {C.CYAN}Log file:{C.RESET} {LOG_FILE}")
    print(f"  {C.CYAN}Started:{C.RESET}  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()
    print(f"  {C.DIM}Chrome Extension loglarini bekliyorum...{C.RESET}")
    print(f"  {C.DIM}NVI portalini acin: https://adres.nvi.gov.tr/VatandasIslemleri/AdresSorgu{C.RESET}")
    print(f"  {C.DIM}Ctrl+C ile cik | Terminal acik kalsin{C.RESET}")
    print()
    print_separator()
    print()

    server = http.server.HTTPServer(("127.0.0.1", PORT), LogHandler)

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print()
        print_stats()
        print(f"  {C.YELLOW}Log file: {LOG_FILE}{C.RESET}")
        print(f"  {C.DIM}Kapatiliyor...{C.RESET}")
        server.server_close()


if __name__ == "__main__":
    main()
