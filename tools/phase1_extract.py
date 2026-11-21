#!/usr/bin/env python3
"""FASE 1 — Ekstraksi CSS dari single-file HTML (acuan: 7KAIH-Cloud-Island-Cute-Balls-Merged-v12.html).
Pakai:  python3 tools/phase1_extract.py --original <v12.html> --out <folder>
Hasil:  index.html (CSS jadi <link>), css/*.css, assets/fonts/genshin.woff. JS belum disentuh (Fase 2) kecuali SATU hunk loader
        (penukar stylesheet runtime-style -> landscape-style), karena <style id=runtime-style> tidak ada lagi."""
import argparse,base64,json,os,re,sys
ap=argparse.ArgumentParser();ap.add_argument('--original',required=True);ap.add_argument('--out',required=True);a=ap.parse_args()
t=open(a.original,encoding='utf-8').read();out=a.out
def w(rel,s,mode='w'):
    p=os.path.join(out,rel);os.makedirs(os.path.dirname(p),exist_ok=True)
    if mode=='wb':open(p,'wb').write(s)
    else:open(p,'w',encoding='utf-8',newline='').write(s)
def once(s,old,new):
    assert s.count(old)==1,(s.count(old),old[:60]);return s.replace(old,new)
# ---- 1. <style id="runtime-style"> (CSS halaman utama; Tailwind + CSS app) ----
m=re.search(r'<style id="runtime-style">(.*?)</style>',t,re.S);main=m.group(1)
w('css/main.css',main)
# ---- 2. CSS Ladang Langit: string __LANDSCAPE_CSS__ di dalam payload ----
dec=json.JSONDecoder();pm=re.search(r'window\.__LANDSCAPE_CSS__=',t);land,end=dec.raw_decode(t[pm.end():])
w('css/landscape.css',land)
land_json=t[pm.end():pm.end()+end]            # teks JSON asli (untuk verifikasi balik)
# ---- 3. <style id="kx-genshin"> -> fonts.css + genshin-ui.css (+ font ke assets) ----
m=re.search(r'<style id="kx-genshin">(.*?)</style>',t,re.S);g=m.group(1)
fm=re.search(r'@font-face\{font-family:"Genshin";src:url\(data:font/woff;base64,([A-Za-z0-9+/=]+)\) format\("woff"\);[^}]*\}',g)
w('assets/fonts/genshin.woff',base64.b64decode(fm.group(1)),'wb')
ff=g[:fm.end()].replace('url(data:font/woff;base64,'+fm.group(1)+')','url(../assets/fonts/genshin.woff)')
w('css/fonts.css',ff);w('css/genshin-ui.css',g[fm.end():])
# ---- 4. <style data-inlined-from=...> (di dalam <body>) ----
inl=list(re.finditer(r'<style data-inlined-from="([^"]+)">(.*?)</style>',t,re.S))
for x in inl:w(x.group(1),x.group(2))
# ---- 5. index.html: <style> -> <link> pada posisi yang SAMA (urutan cascade tetap) ----
h=t
h=once(h,m_main:=re.search(r'<style id="runtime-style">.*?</style>',h,re.S).group(0),
 '<link rel="stylesheet" id="main-style" data-kx-main href="css/main.css">\n'
 '<link rel="preload" as="style" href="css/landscape.css">\n'
 '<link rel="stylesheet" id="landscape-style" href="css/landscape.css" media="not all">')   # dimuat sekarang, diaktifkan loader saat Ladang Langit
h=once(h,re.search(r'<style id="kx-genshin">.*?</style>',h,re.S).group(0),'<link rel="stylesheet" href="css/fonts.css">\n<link rel="stylesheet" href="css/genshin-ui.css">')
for x in inl:h=once(h,x.group(0),'<link rel="stylesheet" href="%s">'%x.group(1))
# payload: kosongkan string CSS (kini css/landscape.css)
h=once(h,'window.__LANDSCAPE_CSS__='+land_json,'window.__LANDSCAPE_CSS__=""')
# loader: tukar stylesheet (satu-satunya perubahan JS di Fase 1)
old_loader=re.search(r"var style=document\.getElementById\('runtime-style'\);\s*if\(!style\)\{[^\n]*\}\s*style\.textContent=window\.__LANDSCAPE_CSS__;",h).group(0)
new_loader=("/* FASE 1: CSS kini file. Matikan stylesheet halaman utama, aktifkan css/landscape.css (posisi cascade sama dgn <style id=runtime-style> lama) */\n"
 "        document.querySelectorAll('link[data-kx-main]').forEach(function(l){ l.disabled=true; });\n"
 "        var lsStyle=document.getElementById('landscape-style'); if(lsStyle){ lsStyle.media='all'; }")
h=once(h,old_loader,new_loader)
assert '<style' not in re.sub(r'<script.*?</script>','',h,flags=re.S),'masih ada <style> di luar skrip'
w('index.html',h)
print('OK. file:',sorted(os.listdir(os.path.join(out,'css'))))
