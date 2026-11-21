#!/usr/bin/env python3
"""VERIFIKASI FASE 1: susun ulang single-file dari folder modular (inline balik semua CSS + font + payload) lalu bandingkan BYTE-per-BYTE
dengan single-file acuan. Satu-satunya perbedaan yang diizinkan = hunk loader (penukar stylesheet), yang dikembalikan ke teks asli
dari file acuan sebelum dibandingkan.   Pakai: python3 tools/verify_phase1.py --original <v12.html> --root <folder-modular>"""
import argparse,base64,hashlib,json,os,re,sys
ap=argparse.ArgumentParser();ap.add_argument('--original',required=True);ap.add_argument('--root',required=True);a=ap.parse_args()
orig=open(a.original,encoding='utf-8').read();idx=open(os.path.join(a.root,'index.html'),encoding='utf-8').read()
rd=lambda p:open(os.path.join(a.root,p),encoding='utf-8',newline='').read()
sha=lambda s:hashlib.sha256(s.encode('utf-8')).hexdigest()[:16]
ok=True
def chk(name,cond,info=''):
    global ok;ok&=bool(cond);print(('PASS ' if cond else 'FAIL ')+name+(' — '+info if info else ''))
# --- struktur ---
nostyle='<style' not in re.sub(r'<script.*?</script>','',idx,flags=re.S)
chk('tidak ada <style> tersisa di luar skrip',nostyle)
links=re.findall(r'<link rel="stylesheet"[^>]*href="(css/[^"]+)"',idx)
chk('semua <link> CSS menunjuk file yang ada',all(os.path.exists(os.path.join(a.root,l)) for l in links),', '.join(links))
# --- susun ulang ---
r=idx
font=base64.b64encode(open(os.path.join(a.root,'assets/fonts/genshin.woff'),'rb').read()).decode()
def sub(s,pat,repl,flags=re.S):
    m=re.search(pat,s,flags);assert m,pat[:50];return s[:m.start()]+repl+s[m.end():]
r=sub(r,r'<link rel="stylesheet" id="main-style".*?<link rel="stylesheet" id="landscape-style"[^>]*>','<style id="runtime-style">'+rd('css/main.css')+'</style>')
r=sub(r,r'<link rel="stylesheet" href="css/fonts.css">\n<link rel="stylesheet" href="css/genshin-ui.css">','<style id="kx-genshin">'+rd('css/fonts.css').replace('url(../assets/fonts/genshin.woff)','url(data:font/woff;base64,'+font+')')+rd('css/genshin-ui.css')+'</style>')
for p in re.findall(r'<link rel="stylesheet" href="(css/(?:cloud-transition|world-interactions)\.css)">',r):
    r=r.replace('<link rel="stylesheet" href="%s">'%p,'<style data-inlined-from="%s">%s</style>'%(p,rd(p)))
land=rd('css/landscape.css')
assert r.count('window.__LANDSCAPE_CSS__=""')==1
r=r.replace('window.__LANDSCAPE_CSS__=""','window.__LANDSCAPE_CSS__='+json.dumps(land,ensure_ascii=False,separators=(',',':')))
new_loader=re.search(r"/\* FASE 1: CSS kini file\..*?lsStyle\.media='all'; \}",r,re.S).group(0)
old_loader=re.search(r"var style=document\.getElementById\('runtime-style'\);\s*if\(!style\)\{[^\n]*\}\s*style\.textContent=window\.__LANDSCAPE_CSS__;",orig).group(0)
r=r.replace(new_loader,old_loader)
# --- bandingkan ---
same=(r==orig)
chk('hasil inline-balik IDENTIK byte-per-byte dengan single-file acuan',same,'sha256 %s vs %s, %d vs %d karakter'%(sha(r),sha(orig),len(r),len(orig)))
if not same:
    i=next(k for k,(x,y) in enumerate(zip(r,orig)) if x!=y) if len(r)>=1 else 0
    print('   selisih pertama di posisi',i,'\n   baru :',repr(r[i-60:i+80]),'\n   asli :',repr(orig[i-60:i+80]))
# --- hash per blok CSS asli vs file ---
print('\nBlok CSS asli -> file (sha256 isi):')
for sid,f in (('runtime-style','css/main.css'),):
    m=re.search(r'<style id="%s">(.*?)</style>'%sid,orig,re.S);chk(f,sha(m.group(1))==sha(rd(f)),sha(rd(f)))
for m in re.finditer(r'<style data-inlined-from="([^"]+)">(.*?)</style>',orig,re.S):chk(m.group(1),sha(m.group(2))==sha(rd(m.group(1))),sha(rd(m.group(1))))
g=re.search(r'<style id="kx-genshin">(.*?)</style>',orig,re.S).group(1)
chk('css/fonts.css + css/genshin-ui.css = #kx-genshin',sha(g)==sha(rd('css/fonts.css').replace('url(../assets/fonts/genshin.woff)','url(data:font/woff;base64,'+font+')')+rd('css/genshin-ui.css')))
dec=json.JSONDecoder();pm=re.search(r'window\.__LANDSCAPE_CSS__=',orig);lo,_=dec.raw_decode(orig[pm.end():]);chk('css/landscape.css = __LANDSCAPE_CSS__',sha(lo)==sha(land),sha(land))
print('\nHASIL FASE 1:','SEMUA LULUS' if ok else 'ADA YANG GAGAL');sys.exit(0 if ok else 1)
