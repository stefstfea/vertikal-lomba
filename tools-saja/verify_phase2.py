#!/usr/bin/env python3
"""
Verifikasi Fase 2: membuktikan bahwa setiap blok <script> inline asli dapat DIREKONSTRUKSI
byte-per-byte (hash SHA-256) dari file-file hasil ekstraksi, dan index.html bebas script inline.
    python tools/verify_phase2.py
"""
import hashlib, json, re, shutil, subprocess, sys, tempfile
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from phase2_modularize import (AUDIO_RE, AUDIO_FILE_RE, DEST, SCRIPT_RE, audio_ref, unpatch_loader)

def sha(b): return hashlib.sha256(b).hexdigest()

def _json_after(text, tag):
    st = text.index(tag) + len(tag)
    v, _ = json.JSONDecoder().raw_decode(text, st)
    return v

def run(root):
    root = Path(root); ok = True
    def bad(msg):
        nonlocal ok; ok = False; print("  [GAGAL]", msg)
    mpath = root / "tools" / "phase2-manifest.json"
    if not mpath.exists(): print("phase2-manifest.json tidak ada"); return 1
    man = json.loads(mpath.read_bytes().decode("utf-8"))
    print("== Verifikasi Fase 2 ==")

    # 1. hash semua file hasil ekstraksi
    n = 0
    for p, h in man["files"].items():
        f = root / p
        if not f.exists(): bad("hilang: " + p); continue
        if sha(f.read_bytes()) != h: bad("hash berubah: " + p)
        n += 1
    print("1) hash file hasil ekstraksi: %d file diperiksa" % n)

    # 2. rekonstruksi blok asli
    orig = {b["kind"]: b["sha256"] for b in man["original_blocks"]}
    rd = lambda p: (root / p).read_bytes().decode("utf-8")
    rec = {}
    for kind in ("settings","skip-ctl","fx-canvas","bubble-ripple","dashboard-host","cutscene-sfx","cutscene","module"):
        rec[kind] = rd(DEST[kind])
    rec["loader"] = unpatch_loader(rd(DEST["loader"]))
    ma = rd(DEST["menu-audio"]); uris = {}
    for k in ("menu", "world"):
        m = AUDIO_FILE_RE.search(rd("assets/audio/%s-music.b64.js" % k))
        if not m: bad("format data audio %s tidak valid" % k); continue
        uris[k.upper()] = m.group(2)
    for k, u in uris.items():
        ref = audio_ref(k)
        if ma.count(ref) != 1: bad("referensi audio %s tidak tepat 1x" % k)
        ma = ma.replace(ref, "const %s_AUDIO_SRC = ('%s');" % (k, u), 1)
    rec["menu-audio"] = ma
    L = man["landscape"]
    body = _json_after(rd("src/landscape/body.js"), "window.__LANDSCAPE_BODY__=")
    css = _json_after(rd("src/landscape/css.js"), "window.__LANDSCAPE_CSS__=")
    names = _json_after(rd("src/landscape/manifest.js"), "window.__LANDSCAPE_SCRIPT_NAMES__=")
    if names != L["active_order"]: bad("urutan manifest.js berbeda dari urutan asli")
    inline = {k: rd(("src/modules/_old/" if k in L["old"] else "src/modules/") + k) for k in L["inline_key_order"]}
    dumps = lambda v: json.dumps(v, ensure_ascii=False, separators=(",", ":"))
    rec["payload"] = ("window.__LANDSCAPE_BODY__=%s;window.__LANDSCAPE_CSS__=%s;window.__LANDSCAPE_SCRIPT_NAMES__=%s;"
                      "window.__LANDSCAPE_SCRIPTS__=[];window.__LANDSCAPE_INLINE_SCRIPTS__=%s;") % (
                      dumps(body), dumps(css), dumps(names), dumps(inline))
    for kind, h in orig.items():
        same = sha(rec[kind].encode("utf-8")) == h
        print("2) %-15s %s" % (kind, "identik dengan blok asli" if same else "BERBEDA"))
        if not same: ok = False

    # 3. index.html
    html = rd("index.html")
    scripts = SCRIPT_RE.findall(html)
    inline_left = [a for a, b in scripts if "src=" not in a]
    print("3) <script> inline tersisa di index.html: %d (harus 0)" % len(inline_left))
    if inline_left: ok = False
    mods = [a for a, b in scripts if "module" in a]
    print("   <script type=module>: %d (harus 1, ./src/main.js)" % len(mods))
    if len(mods) != 1 or "./src/main.js" not in mods[0]: ok = False
    srcs = re.findall(r'<script[^>]*\bsrc="([^"]+)"', html)
    for s in srcs:
        if s.startswith("http"): continue
        if not (root / s).exists(): bad("src tidak ada: " + s)
    cdn = [s for s in srcs if s.startswith("http")]
    print("   CDN (urutan): " + " -> ".join(c.rsplit("/", 1)[-1] for c in cdn))
    if sha(html.encode("utf-8")) != man["index_sha256"]: print("   (catatan: index.html sudah diedit setelah ekstraksi)")

    # 4. sintaks (opsional, jika Node tersedia)
    node = shutil.which("node")
    if node:
        bad_syn = []
        files = [p for p in man["files"] if p.endswith(".js") and "b64" not in p]
        for p in files + ["src/main.js"]:
            src = root / p
            tmp = Path(tempfile.mkdtemp()) / (src.stem + (".mjs" if p in ("src/main.js", "src/core/deps-check.js", DEST["module"]) else ".js"))
            tmp.write_bytes(src.read_bytes())
            r = subprocess.run([node, "--check", str(tmp)], capture_output=True, text=True)
            if r.returncode: bad_syn.append((p, r.stderr.strip().splitlines()[0:3]))
        print("4) cek sintaks Node: %d file, %d error" % (len(files) + 1, len(bad_syn)))
        for p, e in bad_syn: bad("sintaks %s: %s" % (p, e))
    else:
        print("4) Node tidak ada - cek sintaks dilewati")
    print("HASIL:", "LULUS - semua identik" if ok else "ADA MASALAH")
    return 0 if ok else 1

if __name__ == "__main__":
    sys.exit(run(sys.argv[1] if len(sys.argv) > 1 else Path(__file__).resolve().parent.parent))
