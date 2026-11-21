#!/usr/bin/env python3
"""Server lokal sederhana (wajib sejak Fase 2: <script type="module"> tidak jalan lewat file://).
    python tools/serve.py        ->  http://localhost:8000/
"""
import http.server, os, socketserver, webbrowser
from pathlib import Path
os.chdir(Path(__file__).resolve().parent.parent)
class H(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map, ".js": "text/javascript", ".mjs": "text/javascript"}
socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("", 8000), H) as s:
    print("Buka http://localhost:8000/  (Ctrl+C untuk berhenti)")
    webbrowser.open("http://localhost:8000/")
    try: s.serve_forever()
    except KeyboardInterrupt: pass
