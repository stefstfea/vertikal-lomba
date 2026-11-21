#!/usr/bin/env python3
"""
7 KAIH - FASE 2: modularisasi JavaScript (hanya pustaka standar Python 3.8+).

Memecah semua <script> inline di index.html menjadi file terpisah TANPA mengubah
logika. Setiap blok dikenali lewat tanda pengenal isi (bukan nomor urut), jadi alat ini
bisa dijalankan pada index.html Fase 1 maupun file v12 asli. Jika ada <script> inline
yang tidak dikenal, alat BERHENTI dan tidak menulis apa pun.

Pemakaian (dari folder proyek, di sebelah index.html):
    python tools/phase2_modularize.py            # ekstraksi + verifikasi
    python tools/phase2_modularize.py --dry-run  # hanya laporan, tidak menulis
    python tools/phase2_modularize.py --src PATH --root PATH [--force]
"""
import argparse, hashlib, json, re, sys
from pathlib import Path

# ---------------------------------------------------------------- patch loader
# Satu-satunya perubahan logika pada loader Ladang Langit (blok #6): sumber modul tidak
# lagi string inline, tetapi di-prefetch dari src/modules/*.js lalu DIJALANKAN SEKALIGUS
# secara sinkron (textContent) persis seperti aslinya, supaya tidak ada frame render yang
# menyelip di antara dua modul.
LOADER_PRELUDE = """\
(function(){
  // [FASE 2] Modul Ladang Langit kini file terpisah (src/modules/*.js). Di-prefetch paralel
  // lalu dijalankan berurutan & sinkron saat handoff (logika asli di bawah tidak diubah).
  var __kaihBase = window.__LANDSCAPE_MODULE_BASE__ || 'src/modules/';
  var __kaihPreload = (function(){
    var names = window.__LANDSCAPE_SCRIPT_NAMES__ || [];
    var map = window.__LANDSCAPE_INLINE_SCRIPTS__ = window.__LANDSCAPE_INLINE_SCRIPTS__ || {};
    return Promise.all(names.map(function(n){
      return fetch(__kaihBase + n)
        .then(function(r){ if(!r.ok) throw new Error('HTTP ' + r.status); return r.text(); })
        .then(function(t){ map[n] = t; })
        .catch(function(e){ console.error('[7 KAIH] Gagal mengambil modul:', n, e); });
    }));
  })();
"""
LOADER_OPEN_OLD = "(function(){\n"
LOADER_SET_OLD  = "    setTimeout(function(){\n      try {\n"
LOADER_SET_NEW  = "    setTimeout(function(){ __kaihPreload.then(function(){\n      try {\n"
LOADER_END_OLD  = "      }\n    },180);\n"
LOADER_END_NEW  = "      }\n    }); },180);\n"

def patch_loader(orig):
    assert orig.startswith(LOADER_OPEN_OLD)
    for s in (LOADER_SET_OLD, LOADER_END_OLD):
        if orig.count(s) != 1:
            raise SystemExit("Loader (#6) berbeda dari yang diharapkan; bagian tidak ditemukan tepat 1x:\n" + s)
    out = LOADER_PRELUDE + orig[len(LOADER_OPEN_OLD):]
    return out.replace(LOADER_SET_OLD, LOADER_SET_NEW, 1).replace(LOADER_END_OLD, LOADER_END_NEW, 1)

def unpatch_loader(new):
    assert new.startswith(LOADER_PRELUDE)
    out = LOADER_OPEN_OLD + new[len(LOADER_PRELUDE):]
    return out.replace(LOADER_SET_NEW, LOADER_SET_OLD, 1).replace(LOADER_END_NEW, LOADER_END_OLD, 1)

# ----------------------------------------------------------- patch audio base64
AUDIO_RE = re.compile(r"const (MENU|WORLD)_AUDIO_SRC = \('(data:audio/mpeg;base64,[A-Za-z0-9+/=]+)'\);")
def audio_ref(kind): return "const %s_AUDIO_SRC = (window.__KAIH_AUDIO__.%s);" % (kind, kind.lower())
def audio_file(kind, uri):
    return ("/* 7 KAIH Fase 2 - data audio %s (base64, dipisah dari prelude/menu-audio.js) */\n"
            "window.__KAIH_AUDIO__=window.__KAIH_AUDIO__||{};window.__KAIH_AUDIO__.%s='%s';\n") % (kind.lower(), kind.lower(), uri)
AUDIO_FILE_RE = re.compile(r"window\.__KAIH_AUDIO__\.(menu|world)='(data:audio/mpeg;base64,[A-Za-z0-9+/=]+)';\n$")

SCRIPT_RE = re.compile(r"<script\b([^>]*)>(.*?)</script>", re.S | re.I)

def sha(b): return hashlib.sha256(b).hexdigest()
def enc(s):  return s.encode("utf-8")

def classify(attrs, body):
    if re.search(r"\bsrc\s*=", attrs): return "external"
    if re.search(r"""type\s*=\s*["']module["']""", attrs): return "module"
    if 'id="kx-settings"' in attrs: return "settings"
    if 'id="kx-skip-ctl"' in attrs: return "skip-ctl"
    if body.startswith("window.__LANDSCAPE_BODY__="): return "payload"
    if "window.__loadKaihLandscape" in body and "kaih-dashboard-ready" in body: return "loader"
    if body.lstrip().startswith("const $=i=>document.getElementById(i),R=Math.random"): return "fx-canvas"
    if "MENU_AUDIO_SRC" in body: return "menu-audio"
    if "bubbleAudioCtx" in body: return "bubble-ripple"
    if "openDash" in body and "kaih-dashboard-ready" in body: return "dashboard-host"
    if "Sound effect cutscene" in body: return "cutscene-sfx"
    if "Cutscene pembuka" in body: return "cutscene"
    return None

DEST = {"settings": "src/boot/settings.js", "skip-ctl": "src/boot/skip-ctl.js",
        "fx-canvas": "src/prelude/fx-canvas.js", "menu-audio": "src/prelude/menu-audio.js",
        "bubble-ripple": "src/prelude/bubble-ripple.js", "dashboard-host": "src/prelude/dashboard-host.js",
        "cutscene-sfx": "src/prelude/cutscene-sfx.js", "cutscene": "src/prelude/cutscene.js",
        "loader": "src/landscape/loader.js", "module": "js/vendor/pulau-awan-bundle.js"}

MAIN_JS = """\
// 7 KAIH - entry point (Fase 2). Satu-satunya <script type="module"> di index.html.
// Urutan: (1) pemeriksaan dependensi CDN (Three r128, Cannon 0.6.2: script klasik di <head>,
// sudah termuat sebelum modul berjalan), (2) bundel Pulau Awan (React/R3F/Three r160 + kode
// 7 KAIH, UTUH & tidak diubah). Skrip klasik lain dimuat lewat <script src> berurutan di
// index.html agar urutan eksekusi, scope global, dan timing DOMContentLoaded tetap sama.
import './core/deps-check.js';
import '../js/vendor/pulau-awan-bundle.js';
"""
DEPS_JS = """\
// Hanya memberi peringatan di console jika CDN gagal dimuat; tidak mengubah perilaku apa pun.
if (typeof window.THREE === 'undefined') console.error('[7 KAIH] THREE (r128) tidak termuat dari CDN - Ladang Langit tidak akan berjalan.');
if (typeof window.CANNON === 'undefined') console.error('[7 KAIH] CANNON (0.6.2) tidak termuat dari CDN - fisika tidak akan berjalan.');
export {};
"""

def build(src_html):
    """Kembalikan (files{path:bytes}, new_html, manifest)."""
    html = src_html.replace("\r\n", "\n")        # normalisasi baris baru = perilaku parser HTML
    matches = list(SCRIPT_RE.finditer(html))
    files, orig_blocks, plan = {}, [], []
    seen = set()
    for m in matches:
        attrs, body = m.group(1), m.group(2)
        kind = classify(attrs, body)
        if kind is None:
            raise SystemExit("ABORT: <script> inline tidak dikenal di posisi %d:\n%s\nTidak ada file yang ditulis."
                             % (m.start(), body[:200]))
        if kind == "external": continue
        if kind in seen: raise SystemExit("ABORT: blok '%s' muncul lebih dari sekali." % kind)
        seen.add(kind)
        orig_blocks.append({"kind": kind, "sha256": sha(enc(body)), "chars": len(body)})
        plan.append((m, kind, attrs, body))
    need = {"settings","skip-ctl","payload","loader","fx-canvas","menu-audio","bubble-ripple",
            "dashboard-host","cutscene-sfx","cutscene","module"}
    if need - seen: raise SystemExit("ABORT: blok tidak ditemukan: %s" % sorted(need - seen))

    manifest = {"landscape": {}}
    replacements = []
    for m, kind, attrs, body in plan:
        if kind == "payload":
            dec = json.JSONDecoder()
            vals, pos = {}, 0
            for key in ("BODY", "CSS", "SCRIPT_NAMES"):
                tag = "window.__LANDSCAPE_%s__=" % key
                st = body.index(tag) + len(tag)
                vals[key], _ = dec.raw_decode(body, st)
            tag = "window.__LANDSCAPE_INLINE_SCRIPTS__="
            st = body.index(tag) + len(tag)
            inline, end = dec.raw_decode(body, st)
            rebuilt = ("window.__LANDSCAPE_BODY__=%s;window.__LANDSCAPE_CSS__=%s;window.__LANDSCAPE_SCRIPT_NAMES__=%s;"
                       "window.__LANDSCAPE_SCRIPTS__=[];window.__LANDSCAPE_INLINE_SCRIPTS__=%s;") % tuple(
                       [json.dumps(vals[k], ensure_ascii=False, separators=(",", ":")) for k in ("BODY","CSS","SCRIPT_NAMES")]
                       + [json.dumps(inline, ensure_ascii=False, separators=(",", ":"))])
            if rebuilt != body:
                raise SystemExit("ABORT: format payload Ladang Langit tidak dapat direkonstruksi persis; tidak aman.")
            names = vals["SCRIPT_NAMES"]
            miss = [n for n in names if n not in inline]
            if miss: raise SystemExit("ABORT: modul aktif hilang dari payload: %s" % miss)
            old = [k for k in inline if k not in names]
            manifest["landscape"] = {"active_order": names, "inline_key_order": list(inline.keys()), "old": old}
            for n in names: files["src/modules/" + n] = enc(inline[n])
            for n in old:   files["src/modules/_old/" + n] = enc(inline[n])
            files["src/landscape/manifest.js"] = enc(
                "// Urutan eksekusi 32 modul aktif Ladang Langit (= __LANDSCAPE_SCRIPT_NAMES__ asli).\n"
                "window.__LANDSCAPE_SCRIPT_NAMES__=%s;window.__LANDSCAPE_SCRIPTS__=[];\n"
                % json.dumps(names, ensure_ascii=False, indent=2))
            files["src/landscape/body.js"] = enc("// Markup <body> Ladang Langit (string, disuntik loader saat handoff).\nwindow.__LANDSCAPE_BODY__=%s;\n"
                % json.dumps(vals["BODY"], ensure_ascii=False))
            files["src/landscape/css.js"] = enc("// CSS runtime Ladang Langit (string, disuntik loader saat handoff).\nwindow.__LANDSCAPE_CSS__=%s;\n"
                % json.dumps(vals["CSS"], ensure_ascii=False))
            tags = "".join('<script src="%s"></script>\n' % p for p in
                           ("src/landscape/manifest.js", "src/landscape/body.js", "src/landscape/css.js")).rstrip("\n")
            replacements.append((m, tags))
        elif kind == "loader":
            files[DEST[kind]] = enc(patch_loader(body))
            replacements.append((m, '<script src="%s"></script>' % DEST[kind]))
        elif kind == "menu-audio":
            found = {k: u for k, u in AUDIO_RE.findall(body)}
            if set(found) != {"MENU", "WORLD"} or len(AUDIO_RE.findall(body)) != 2:
                raise SystemExit("ABORT: literal audio base64 MENU/WORLD tidak ditemukan tepat 1x masing-masing.")
            new = AUDIO_RE.sub(lambda mm: audio_ref(mm.group(1)), body)
            files["assets/audio/menu-music.b64.js"] = enc(audio_file("MENU", found["MENU"]))
            files["assets/audio/world-music.b64.js"] = enc(audio_file("WORLD", found["WORLD"]))
            files[DEST[kind]] = enc(new)
            tags = ('<script src="assets/audio/menu-music.b64.js"></script>\n'
                    '<script src="assets/audio/world-music.b64.js"></script>\n'
                    '<script src="%s"></script>') % DEST[kind]
            replacements.append((m, tags))
        elif kind == "module":
            files[DEST[kind]] = enc(body)
            files["src/main.js"] = enc(MAIN_JS)
            files["src/core/deps-check.js"] = enc(DEPS_JS)
            replacements.append((m, '<script type="module" src="./src/main.js"></script>'))
        else:
            files[DEST[kind]] = enc(body)
            replacements.append((m, "<script%s src=\"%s\"></script>" % (attrs, DEST[kind])))

    new_html = html
    for m, tag in sorted(replacements, key=lambda x: -x[0].start()):
        new_html = new_html[:m.start()] + tag + new_html[m.end():]
    # modulepreload: bundel diambil paralel sejak awal (hanya petunjuk performa)
    hint = '<link rel="modulepreload" href="./js/vendor/pulau-awan-bundle.js">\n'
    cdn = re.search(r'<script[^>]*three\.min\.js[^>]*>', new_html)
    anchor = cdn.start() if cdn else new_html.index('<script type="module"')
    new_html = new_html[:anchor] + hint + new_html[anchor:]

    manifest["source_sha256"] = sha(enc(html))
    manifest["original_blocks"] = orig_blocks
    manifest["files"] = {p: sha(b) for p, b in sorted(files.items())}
    manifest["index_sha256"] = sha(enc(new_html))
    return files, new_html, manifest

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    here = Path(__file__).resolve().parent.parent
    ap.add_argument("--root", default=str(here)); ap.add_argument("--src", default=None)
    ap.add_argument("--dry-run", action="store_true"); ap.add_argument("--force", action="store_true")
    a = ap.parse_args()
    root = Path(a.root).resolve(); src = Path(a.src).resolve() if a.src else root / "index.html"
    if not src.exists(): raise SystemExit("File sumber tidak ditemukan: %s" % src)
    html = src.read_bytes().decode("utf-8")
    files, new_html, manifest = build(html)
    print("Sumber: %s (%.1f MB)" % (src, len(html) / 1048576))
    print("File dihasilkan: %d | index.html baru: %.1f KB" % (len(files), len(new_html) / 1024))
    if a.dry_run: print("[dry-run] tidak ada yang ditulis."); return
    clash = [p for p in files if (root / p).exists()]
    if clash and not a.force:
        raise SystemExit("File sudah ada (%d, mis. %s). Pakai --force untuk menimpa." % (len(clash), clash[0]))
    backup = root / "index.phase1.backup.html"
    if src == root / "index.html" and not backup.exists(): backup.write_bytes(src.read_bytes())
    for p, b in files.items():
        t = root / p; t.parent.mkdir(parents=True, exist_ok=True); t.write_bytes(b)
    (root / "tools").mkdir(exist_ok=True)
    (root / "tools" / "phase2-manifest.json").write_bytes(enc(json.dumps(manifest, indent=1, ensure_ascii=False)))
    out_index = root / "index.html" if src == root / "index.html" else root / "index.html"
    out_index.write_bytes(enc(new_html))
    print("Selesai. Backup: %s" % (backup if backup.exists() else "-"))
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    import verify_phase2
    sys.exit(verify_phase2.run(root))

if __name__ == "__main__":
    main()
