#!/usr/bin/env node
'use strict';

/**
 * 7KAIH modular build integrity verifier
 * Node.js >= 18; zero third-party dependencies.
 *
 * Usage:
 *   node tools/verify-build.js --root . --baseline ../original-v12.html
 *   node tools/verify-build.js --root . --manifest tools/module-manifest.json
 *
 * Important:
 * - A complete module path list is required to prove all 32 modules exist.
 * - Baseline token/function comparison is static evidence, not a semantic proof.
 * - Keep the original v12 file untouched and outside the served project root.
 */

const fs = require('node:fs');
const path = require('node:path');

const DEFAULTS = {
  expectedModuleCount: 32,
  modules: [],
  vendorBundles: ['js/vendor/pulau-awan-bundle.js'],
  requiredAssets: [],
  requiredStylesheets: [
    'css/runtime.css',
    'css/genshin-font.css',
    'css/cloud-transition.css',
    'css/world-interactions.css'
  ],
  modulePreloads: ['js/vendor/pulau-awan-bundle.js'],
  expectedScriptOrder: [
    'src/boot/settings.js',
    'src/landscape/manifest.js',
    'src/landscape/body.js',
    'src/landscape/css.js',
    'src/boot/skip-ctl.js',
    'src/main.js',
    'src/landscape/loader.js',
    'src/prelude/fx-canvas.js',
    'assets/audio/menu-music.b64.js',
    'assets/audio/world-music.b64.js',
    'src/prelude/menu-audio.js',
    'src/prelude/bubble-ripple.js',
    'src/prelude/dashboard-host.js',
    'src/prelude/cutscene-sfx.js',
    'src/prelude/cutscene.js'
  ],
  requiredDomHooks: [
    { id: 'kx-settings', src: 'src/boot/settings.js' },
    { id: 'kx-skip-ctl', src: 'src/boot/skip-ctl.js' }
  ],
  architectureMarkers: [
    { label: 'window.KAIH global contract', pattern: 'window\\s*\\.\\s*KAIH' },
    { label: 'K.hooks shader-update contract', pattern: '\\bK\\s*\\.\\s*hooks\\b' }
  ],
  shaderOwnership: [],
  // Token BASELINE yang sengaja tidak dipertanggungjawabkan karena merupakan sisa loader lama
  // (pra-ES-Module) yang memang dibuang saat ekstraksi. Sempit & eksplisit: hanya identifier
  // persis dan string yang memuat substring tertentu. Simbol sintaks (P:), keyword, dan
  // identifier aplikasi TIDAK boleh masuk daftar ini. Semua yang diabaikan dilaporkan sebagai INFO.
  tokenIgnore: {
    identifiers: ['__LANDSCAPE_SCRIPTS__', '__LANDSCAPE_INLINE_SCRIPTS__', 'scriptError'],
    stringIncludes: [
      // Daftar nama modul arsip (…_old.js, …_vN_old.js) di peta __LANDSCAPE_INLINE_SCRIPTS__ lama.
      '_old.js',
      // Handler inline lama (blok loader #4 di baseline), terbukti hilang di laporan Diagnose block:
      '[7 KAIH] Modul inline tidak ditemukan:',
      '[7 KAIH] Gagal menjalankan modul inline:',
      '//# sourceURL=7KAIH-inline/'
    ]
  },
  // Toleransi TERBATAS (batas atas) untuk token yang secara struktural tidak punya padanan di versi modular.
  // Hanya kekurangan nyata yang dimaafkan, maksimum sebesar angka di bawah; kelebihan tidak dimaafkan.
  //  - STR:<large-literal> x41 : teks sumber modul yang di v12 ditanam sebagai string besar di
  //    __LANDSCAPE_INLINE_SCRIPTS__ (57 entri: 32 modul aktif + 25 arsip *_old.js). Di build modular
  //    isinya adalah file .js sungguhan (dipindai sebagai token biasa), bukan string.
  //  - ID:source x3 : variabel `source` pada loader inline lama (loadLandscape) yang diganti ES Module.
  missingAllowance: {
    'STR:<large-literal>': 41,
    'ID:source': 3
  },
  tokenCoverageThreshold: 1.0,
  indexFile: 'index.html'
};

function parseArgs(argv) {
  const args = {
    root: process.cwd(),
    baseline: null,
    manifest: null,
    json: false,
    diagnose: false
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--root') args.root = argv[++i];
    else if (arg === '--baseline') args.baseline = argv[++i];
    else if (arg === '--manifest') args.manifest = argv[++i];
    else if (arg === '--json') args.json = true;
    else if (arg === '--diagnose') args.diagnose = true;
    else if (arg === '--help' || arg === '-h') args.help = true;
    else throw new Error(`Argument tidak dikenal: ${arg}`);
  }
  args.root = path.resolve(args.root);
  args.manifest = path.resolve(args.manifest || path.join(args.root, 'tools/module-manifest.json'));
  if (args.baseline) args.baseline = path.resolve(args.baseline);
  return args;
}

function printHelp() {
  console.log(`\n7KAIH Build Verifier (Node.js >= 18)\n\n` +
    `Usage:\n  node tools/verify-build.js --root . --baseline ../original-v12.html\n\n` +
    `Options:\n  --root <dir>       Root folder project modular\n` +
    `  --baseline <file> Single-file HTML v12 asli (wajib untuk comparison)\n` +
    `  --manifest <file> Manifest modul/aset (default: tools/module-manifest.json)\n` +
    `  --json            Output laporan JSON\n` +
    `  --diagnose        Rinci: file yang dipindai + cakupan token per blok script baseline\n`);
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function walkFiles(dir, root, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', '.next', 'dist', 'build', 'coverage'].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkFiles(full, root, out);
    else if (entry.isFile()) out.push(path.relative(root, full).split(path.sep).join('/'));
  }
  return out;
}

function attr(tag, name) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = tag.match(new RegExp(`\\b${escaped}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i'));
  return match ? (match[1] ?? match[2] ?? match[3] ?? '') : null;
}

function isExternalRef(value) {
  return !value || /^(?:[a-z]+:|\/\/|#|data:|blob:|javascript:|mailto:|tel:)/i.test(value.trim());
}

function cleanLocalRef(value) {
  let ref = value.trim().replace(/[?#].*$/, '').replace(/\\/g, '/');
  try { ref = decodeURIComponent(ref); } catch { /* keep literal path */ }
  return path.posix.normalize(ref.replace(/^\.\//, ''));
}

function localPathExists(root, baseFile, ref) {
  if (isExternalRef(ref)) return { external: true };
  const cleaned = cleanLocalRef(ref);
  const resolved = ref.trim().startsWith('/')
    ? path.resolve(root, `.${cleaned.startsWith('/') ? cleaned : `/${cleaned}`}`)
    : path.resolve(path.dirname(path.join(root, baseFile)), cleaned);
  const relative = path.relative(root, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    return { external: false, exists: false, escaped: true, path: resolved };
  }
  return { external: false, exists: fs.existsSync(resolved), path: resolved };
}

function extractHtmlTags(html, tagName) {
  return [...html.matchAll(new RegExp(`<${tagName}\\b[^>]*>`, 'gi'))].map(m => m[0]);
}

function verifyHtml(root, manifest, report) {
  const indexPath = path.join(root, manifest.indexFile || 'index.html');
  if (!fs.existsSync(indexPath)) {
    report.fail('HTML', `File ${manifest.indexFile || 'index.html'} tidak ditemukan.`);
    return { html: '', scriptSources: [], stylesheetRefs: [] };
  }

  const html = fs.readFileSync(indexPath, 'utf8');
  const scriptTags = extractHtmlTags(html, 'script');
  const linkTags = extractHtmlTags(html, 'link');
  const scriptSources = scriptTags.map(t => attr(t, 'src')).filter(Boolean).map(cleanLocalRef);
  const stylesheetRefs = [];
  const localRefs = [];

  if (/<style\b/i.test(html)) report.fail('HTML', 'Masih ada elemen <style>; CSS harus berada di /css.');
  else report.pass('HTML', 'Tidak ada blok <style> inline.');
  if (/\sstyle\s*=/i.test(html)) report.fail('HTML', 'Masih ada atribut style="..." inline.');
  else report.pass('HTML', 'Tidak ada atribut style inline.');

  for (const tag of linkTags) {
    const rel = (attr(tag, 'rel') || '').toLowerCase();
    const href = attr(tag, 'href');
    if (!href) continue;
    if (rel.split(/\s+/).includes('stylesheet')) stylesheetRefs.push(cleanLocalRef(href));
    if (rel.split(/\s+/).some(x => ['stylesheet', 'modulepreload', 'preload', 'icon'].includes(x))) {
      localRefs.push({ from: manifest.indexFile || 'index.html', ref: href, kind: `link[rel=${rel}]` });
    }
  }

  for (const [tagName, attrName] of [['script', 'src'], ['img', 'src'], ['audio', 'src'], ['video', 'src'], ['video', 'poster'], ['source', 'src'], ['track', 'src']]) {
    for (const tag of extractHtmlTags(html, tagName)) {
      const ref = attr(tag, attrName);
      if (ref) localRefs.push({ from: manifest.indexFile || 'index.html', ref, kind: `${tagName}[${attrName}]` });
    }
  }

  for (const required of manifest.requiredStylesheets || []) {
    if (stylesheetRefs.includes(cleanLocalRef(required))) report.pass('CSS', `Tag stylesheet ditemukan: ${required}`);
    else report.fail('CSS', `Tag stylesheet tidak ditemukan di index.html: ${required}`);
  }

  const preloadRefs = linkTags
    .filter(t => (attr(t, 'rel') || '').toLowerCase().split(/\s+/).includes('modulepreload'))
    .map(t => cleanLocalRef(attr(t, 'href') || ''));
  for (const required of manifest.modulePreloads || []) {
    if (preloadRefs.includes(cleanLocalRef(required))) report.pass('HTML', `Module preload ditemukan: ${required}`);
    else report.fail('HTML', `Module preload tidak ditemukan: ${required}`);
  }

  for (const hook of manifest.requiredDomHooks || []) {
    const hasHook = scriptTags.some(tag => attr(tag, 'id') === hook.id && cleanLocalRef(attr(tag, 'src') || '') === cleanLocalRef(hook.src));
    if (hasHook) report.pass('HTML hooks', `Hook #${hook.id} -> ${hook.src}`);
    else report.fail('HTML hooks', `Hook #${hook.id} dengan src ${hook.src} tidak ditemukan.`);
  }

  const expectedOrder = (manifest.expectedScriptOrder || []).map(cleanLocalRef);
  let cursor = -1;
  for (const expected of expectedOrder) {
    const idx = scriptSources.indexOf(expected);
    if (idx < 0) {
      report.fail('Script order', `Script tidak ditemukan: ${expected}`);
      continue;
    }
    if (idx <= cursor) report.fail('Script order', `Urutan script berubah pada: ${expected}`);
    else report.pass('Script order', `Urutan valid: ${expected}`);
    cursor = idx;
  }

  for (const item of localRefs) {
    const check = localPathExists(root, item.from, item.ref);
    if (check.external) continue;
    if (check.escaped) report.fail('Path', `${item.kind} keluar dari root project: ${item.ref}`);
    else if (check.exists) report.pass('Path', `${item.kind}: ${item.ref}`);
    else report.fail('Path', `File tidak ditemukan (${item.kind}): ${item.ref}`);
  }

  return { html, scriptSources, stylesheetRefs };
}

function verifyCss(root, report) {
  const cssDir = path.join(root, 'css');
  if (!fs.existsSync(cssDir)) {
    report.fail('CSS', 'Folder /css tidak ditemukan.');
    return;
  }
  const cssFiles = walkFiles(cssDir, root).filter(f => f.toLowerCase().endsWith('.css'));
  if (cssFiles.length === 0) report.fail('CSS', 'Tidak ada file .css di /css.');
  else report.pass('CSS', `${cssFiles.length} file CSS ditemukan di /css.`);

  for (const cssFile of cssFiles) {
    const content = fs.readFileSync(path.join(root, cssFile), 'utf8');
    const refs = [];
    for (const m of content.matchAll(/url\(\s*(['"]?)(.*?)\1\s*\)/gi)) {
      const ref = m[2].trim();
      if (ref) refs.push(ref);
    }
    for (const m of content.matchAll(/@import\s+(?:url\()?\s*(['"])(.*?)\1/gi)) refs.push(m[2]);
    for (const ref of refs) {
      const check = localPathExists(root, cssFile, ref);
      if (check.external) continue;
      if (check.escaped) report.fail('CSS asset', `${cssFile} merujuk keluar dari root: ${ref}`);
      else if (check.exists) report.pass('CSS asset', `${cssFile} -> ${ref}`);
      else report.fail('CSS asset', `Referensi tidak ditemukan: ${cssFile} -> ${ref}`);
    }
  }
}

function verifyJavaScriptAssetReferences(root, manifest, report) {
  const jsFiles = getProjectJsFiles(root, manifest);
  const seen = new Set();
  const assetPattern = /["'`]((?:\.\/)?assets\/[A-Za-z0-9_@./ -]+\.(?:png|jpe?g|webp|avif|gif|svg|mp3|wav|ogg|m4a|mp4|webm|glb|gltf|bin|json|woff2?|ttf|otf|ico|ktx2|hdr|exr)(?:\?[^"'`]*)?)["'`]/gi;
  for (const file of jsFiles) {
    const content = fs.readFileSync(path.join(root, file), 'utf8');
    for (const match of content.matchAll(assetPattern)) {
      const ref = match[1];
      const key = cleanLocalRef(ref);
      if (seen.has(key)) continue;
      seen.add(key);
      // Browser asset URLs are normally resolved from the document root, not from the JS module's directory.
      const check = localPathExists(root, 'index.html', ref);
      if (check.escaped) report.fail('JS asset', `${file} merujuk keluar dari root: ${ref}`);
      else if (check.exists) report.pass('JS asset', `${file} -> ${ref}`);
      else report.fail('JS asset', `Referensi aset tidak ditemukan: ${file} -> ${ref}`);
    }
  }
  report.note('JS asset scan', `${seen.size} referensi file aset eksplisit ditemukan dalam source JavaScript.`);
}

function verifyManifestFiles(root, manifest, report) {
  const modules = manifest.modules || [];
  const expectedCount = Number(manifest.expectedModuleCount ?? 32);
  if (modules.length !== expectedCount) {
    report.fail('Module manifest', `Manifest berisi ${modules.length}/${expectedCount} path modul. Isi semua path asli; jangan gunakan nama placeholder.`);
  } else {
    report.pass('Module manifest', `Manifest memuat tepat ${expectedCount} path modul.`);
  }

  const seen = new Set();
  for (const entry of modules) {
    const file = typeof entry === 'string' ? entry : entry && typeof entry.path === 'string' ? entry.path : '';
    if (!file) { report.fail('Module manifest', `Entri modul tidak memiliki path valid: ${JSON.stringify(entry)}`); continue; }
    const normalized = normalizeProjectPath(file);
    if (seen.has(normalized)) report.fail('Module manifest', `Path modul duplikat: ${normalized}`);
    seen.add(normalized);
    const full = path.resolve(root, normalized);
    const relative = path.relative(root, full);
    if (relative.startsWith('..') || path.isAbsolute(relative)) report.fail('Modules', `Path modul keluar dari project: ${file}`);
    else if (fs.existsSync(full) && fs.statSync(full).isFile()) report.pass('Modules', normalized);
    else report.fail('Modules', `Modul hilang: ${normalized}`);
  }

  for (const file of manifest.vendorBundles || []) {
    const full = path.resolve(root, file);
    if (fs.existsSync(full) && fs.statSync(full).isFile()) report.pass('Vendor', file);
    else report.fail('Vendor', `Vendor bundle hilang: ${file}`);
  }

  for (const file of manifest.requiredAssets || []) {
    const full = path.resolve(root, file);
    if (fs.existsSync(full) && fs.statSync(full).isFile()) report.pass('Assets manifest', file);
    else report.fail('Assets manifest', `Aset wajib hilang: ${file}`);
  }

  const assetsDir = path.join(root, 'assets');
  if (!fs.existsSync(assetsDir)) report.fail('Assets', 'Folder /assets tidak ditemukan.');
  else {
    const files = walkFiles(assetsDir, root);
    report.pass('Assets', `${files.length} file ditemukan di /assets.`);
  }
}

function tokenizeJavaScript(source) {
  const tokens = [];
  let i = 0;
  const isIdStart = c => /[A-Za-z_$]/.test(c || '');
  const isId = c => /[A-Za-z0-9_$]/.test(c || '');
  const multiOps = ['===', '!==', '>>>', '**=', '=>', '==', '!=', '<=', '>=', '++', '--', '&&', '||', '??', '?.', '+=', '-=', '*=', '/=', '%=', '**', '<<', '>>', '...', '&=', '|=', '^='];

  while (i < source.length) {
    const c = source[i];
    if (/\s/.test(c)) { i += 1; continue; }
    if (c === '/' && source[i + 1] === '/') {
      i += 2; while (i < source.length && source[i] !== '\n') i += 1; continue;
    }
    if (c === '/' && source[i + 1] === '*') {
      i += 2;
      while (i < source.length && !(source[i] === '*' && source[i + 1] === '/')) i += 1;
      i = Math.min(source.length, i + 2); continue;
    }
    if (c === '"' || c === "'" || c === '`') {
      const quote = c; const start = i; i += 1;
      let value = '';
      while (i < source.length) {
        if (source[i] === '\\') { value += source.slice(i, Math.min(i + 2, source.length)); i += 2; continue; }
        if (source[i] === quote) { i += 1; break; }
        value += source[i]; i += 1;
      }
      if (value.length <= 256 && !/^data:/i.test(value) && !/[A-Za-z0-9+/]{500,}/.test(value)) tokens.push(`STR:${value}`);
      else tokens.push('STR:<large-literal>');
      if (i <= start) i = start + 1;
      continue;
    }
    if (isIdStart(c)) {
      const start = i++; while (i < source.length && isId(source[i])) i += 1;
      tokens.push(`ID:${source.slice(start, i)}`); continue;
    }
    if (/[0-9]/.test(c)) {
      const start = i++;
      while (i < source.length && /[A-Za-z0-9_.]/.test(source[i])) i += 1;
      tokens.push(`NUM:${source.slice(start, i)}`); continue;
    }
    const op = multiOps.find(candidate => source.startsWith(candidate, i));
    if (op) { tokens.push(`OP:${op}`); i += op.length; continue; }
    tokens.push(`P:${c}`); i += 1;
  }
  return tokens;
}

function javascriptFromBaselineHtml(html, htmlPath) {
  const blocks = [];
  const externalFiles = [];
  const missingLocalScripts = [];
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    const attrs = match[1];
    const typeMatch = attrs.match(/\btype\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const type = (typeMatch?.[1] ?? typeMatch?.[2] ?? typeMatch?.[3] ?? '').toLowerCase();
    if (type && !/(?:java|ecma)script|module/i.test(type)) continue;
    const srcMatch = attrs.match(/\bsrc\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    if (srcMatch) {
      const src = srcMatch[1] ?? srcMatch[2] ?? srcMatch[3] ?? '';
      if (isExternalRef(src)) continue;
      const local = path.resolve(path.dirname(htmlPath), ...cleanLocalRef(src).split('/'));
      if (fs.existsSync(local) && fs.statSync(local).isFile()) {
        externalFiles.push(local);
        blocks.push(fs.readFileSync(local, 'utf8'));
      } else missingLocalScripts.push(src);
    } else if (match[2].trim()) blocks.push(match[2]);
  }
  return { source: blocks.join('\n'), blocks, externalFiles, missingLocalScripts };
}

function namedFunctions(source) {
  const names = new Set();
  const patterns = [
    /\bfunction\s*\*?\s*([A-Za-z_$][\w$]*)\s*\(/g,
    /\bclass\s+([A-Za-z_$][\w$]*)\b/g,
    /\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?(?:function\b|(?:\([^)]*\)|[A-Za-z_$][\w$]*)\s*=>)/g
  ];
  for (const pattern of patterns) for (const match of source.matchAll(pattern)) names.add(match[1]);
  return names;
}

function normalizeProjectPath(value) {
  let normalized = String(value || '').trim().replace(/\\/g, '/');
  normalized = normalized.replace(/^\.\//, '').replace(/^\/+/, '');
  return path.posix.normalize(normalized);
}

// Folder yang SELALU dipindai oleh token/function collector, apa pun isi manifest.
// (tokenScanRoots / tokenScanFiles di manifest hanya menambah, tidak bisa mengurangi.)
const REQUIRED_TOKEN_SCAN_ROOTS = ['src', 'js/vendor', 'assets/audio'];

function getProjectJsFiles(root, manifest = {}) {
  const collected = new Set();
  const isJs = file => /\.(?:js|mjs|cjs)$/i.test(file);

  const addFile = value => {
    const relative = normalizeProjectPath(value);
    if (!relative || !isJs(relative)) return;
    const full = path.resolve(root, relative);
    const fromRoot = path.relative(root, full);
    if (fromRoot.startsWith('..') || path.isAbsolute(fromRoot)) throw new Error(`Token scan path keluar dari root: ${value}`);
    if (fs.existsSync(full) && fs.statSync(full).isFile()) collected.add(relative);
  };

  const addRoot = value => {
    const relative = normalizeProjectPath(value);
    const full = path.resolve(root, relative);
    const fromRoot = path.relative(root, full);
    if (fromRoot.startsWith('..') || path.isAbsolute(fromRoot)) throw new Error(`Token scan root keluar dari project: ${value}`);
    if (!fs.existsSync(full)) return;
    if (fs.statSync(full).isDirectory()) {
      for (const file of walkFiles(full, root)) addFile(file);   // rekursif, termasuk semua sub-folder
    } else addFile(relative);
  };

  // 1) Root wajib: src/ (rekursif), js/vendor/ (pulau-awan-bundle.js), assets/audio/ (*.b64.js)
  for (const required of REQUIRED_TOKEN_SCAN_ROOTS) addRoot(required);
  // 2) Tambahan dari manifest (opsional)
  if (Array.isArray(manifest.tokenScanRoots)) for (const configured of manifest.tokenScanRoots) addRoot(configured);
  for (const file of manifest.tokenScanFiles || []) addFile(file);
  // 3) Vendor bundle & modul yang dideklarasikan manifest juga wajib ikut
  for (const file of manifest.vendorBundles || []) addFile(file);
  for (const entry of manifest.modules || []) addFile(typeof entry === 'string' ? entry : (entry && entry.path) || '');

  return [...collected].sort();
}

// Tokenisasi PER UNIT (satu blok <script> baseline / satu file proyek), lalu digabung.
// Tokenizer tidak punya state regex-literal, sehingga satu kutip yang "desync" di akhir sebuah
// unit (mis. bundel vendor) akan menelan token unit BERIKUTNYA jika semua teks digabung dulu
// dengan join('\n'). Dengan tokenisasi per unit, kerusakan itu tidak bisa menyeberang file.
function tokenizeUnits(sources) {
  const tokens = [];
  for (const source of sources) {
    const unitTokens = tokenizeJavaScript(source);
    for (let i = 0; i < unitTokens.length; i += 1) tokens.push(unitTokens[i]);
  }
  return tokens;
}

function applyTokenIgnore(tokens, ignore) {
  const identifiers = new Set((ignore && ignore.identifiers) || []);
  const stringIncludes = (ignore && ignore.stringIncludes) || [];
  const ignored = new Map();
  const kept = [];
  for (const token of tokens) {
    let rule = null;
    if (token.startsWith('ID:') && identifiers.has(token.slice(3))) rule = token;
    else if (token.startsWith('STR:')) rule = stringIncludes.find(sub => sub && token.includes(sub)) ? token : null;
    if (rule) ignored.set(rule, (ignored.get(rule) || 0) + 1);
    else kept.push(token);
  }
  return { kept, ignored };
}

function compareBaseline(root, baselinePath, manifest, report, diagnose = false) {
  if (!baselinePath || !fs.existsSync(baselinePath)) {
    report.warn('Baseline', 'File single-file v12 tidak ditemukan. Perbandingan fungsi/token belum dapat dilakukan. Gunakan --baseline <path-v12-asli>.');
    return;
  }

  const baselineHtml = fs.readFileSync(baselinePath, 'utf8');
  const baselineResult = javascriptFromBaselineHtml(baselineHtml, baselinePath);
  const baselineJs = baselineResult.source;
  if (baselineResult.missingLocalScripts.length) {
    report.warn('Baseline', `Script lokal yang dirujuk baseline tetapi tidak ditemukan di folder baseline: ${baselineResult.missingLocalScripts.join(', ')}`);
  }
  if (!baselineJs.trim()) {
    report.fail('Baseline', 'Tidak ditemukan JavaScript inline maupun file script lokal yang dapat dibaca dari baseline. Sediakan HTML v12 asli beserta file script lokalnya, atau gunakan single-file yang benar-benar memuat kode.');
    return;
  }
  report.pass('Baseline', `JavaScript baseline terbaca dari HTML dan ${baselineResult.externalFiles.length} file script lokal.`);
  const projectFiles = getProjectJsFiles(root, manifest);
  if (projectFiles.length === 0) {
    report.fail('Baseline', 'Tidak ada file JavaScript modular untuk dibandingkan.');
    return;
  }
  const projectSources = projectFiles.map(file => fs.readFileSync(path.join(root, file), 'utf8'));
  const projectJs = projectSources.join('\n'); // hanya untuk namedFunctions (regex), bukan untuk token
  const rawBaselineTokens = tokenizeUnits(baselineResult.blocks);
  const { kept: baselineTokens, ignored: ignoredTokens } = applyTokenIgnore(rawBaselineTokens, manifest.tokenIgnore);
  const ignoredTotal = [...ignoredTokens.values()].reduce((a, b) => a + b, 0);
  const projectTokens = tokenizeUnits(projectSources);
  const projectCounts = new Map();
  for (const token of projectTokens) projectCounts.set(token, (projectCounts.get(token) || 0) + 1);
  const missing = new Map();
  let matched = 0;
  for (const token of baselineTokens) {
    const count = projectCounts.get(token) || 0;
    if (count > 0) { matched += 1; projectCounts.set(token, count - 1); }
    else missing.set(token, (missing.get(token) || 0) + 1);
  }
  if (ignoredTotal > 0) {
    report.note('Baseline token ignore', `${ignoredTotal} dari ${rawBaselineTokens.length} token baseline diabaikan (loader lama): ${[...ignoredTokens.entries()].sort((a, b) => b[1] - a[1]).map(([t, n]) => `${t.length > 70 ? `${t.slice(0, 70)}…` : t} ×${n}`).join(', ')}`);
  }
  let allowedTotal = 0;
  const allowedDetail = [];
  for (const [token, cap] of Object.entries(manifest.missingAllowance || {})) {
    const have = missing.get(token) || 0;
    const used = Math.min(have, Number(cap) || 0);
    if (used > 0) {
      allowedTotal += used;
      allowedDetail.push(`${JSON.stringify(token)} ${used}/${cap}${have > used ? ` (kekurangan sebenarnya ${have}, melebihi batas ${have - used})` : ''}`);
      if (have > used) missing.set(token, have - used); else missing.delete(token);
    }
  }
  if (allowedTotal > 0) report.note('Baseline missing allowance', `${allowedTotal} token dimaafkan (batas atas, hanya kekurangan nyata): ${allowedDetail.join(', ')}`);
  const effectiveTotal = baselineTokens.length - allowedTotal;
  const coverage = effectiveTotal ? matched / effectiveTotal : 0;
  const threshold = Number(manifest.tokenCoverageThreshold ?? 1.0);
  const summary = `Token coverage ${((coverage) * 100).toFixed(3)}% (${matched}/${effectiveTotal}); threshold ${(threshold * 100).toFixed(3)}%.`;
  if (coverage + Number.EPSILON >= threshold) report.pass('Baseline tokens', summary);
  else report.fail('Baseline tokens', `${summary} ${missing.size <= 80 ? `Semua token hilang (${missing.size} jenis): ` : 'Token hilang terbanyak: '}${[...missing.entries()].sort((a,b)=>b[1]-a[1]).slice(0, missing.size <= 80 ? 80 : 12).map(([t,n])=>`${JSON.stringify(t)} ×${n}`).join(', ')}`);

  const oldFunctions = namedFunctions(baselineJs);
  const newFunctions = namedFunctions(projectJs);
  const missingFunctions = [...oldFunctions].filter(name => !newFunctions.has(name)).sort();
  if (missingFunctions.length === 0) report.pass('Baseline functions', `${oldFunctions.size} nama fungsi/kelas terdeteksi; tidak ada nama yang hilang.`);
  else report.fail('Baseline functions', `${missingFunctions.length}/${oldFunctions.size} nama fungsi/kelas tidak ditemukan: ${missingFunctions.slice(0, 40).join(', ')}${missingFunctions.length > 40 ? ', ...' : ''}`);
  if (diagnose) diagnoseBaselineCoverage(root, baselinePath, manifest, report);
  report.note('Baseline scope', `Membandingkan JS inline + ${baselineResult.externalFiles.length} file script lokal dari v12 dengan ${projectFiles.length} file .js/.mjs/.cjs modular. Script CDN tidak diunduh.`);
}

function diagnoseBaselineCoverage(root, baselinePath, manifest, report) {
  // Read-only diagnostics: never changes PASS/FAIL, only adds INFO lines.
  const html = fs.readFileSync(baselinePath, 'utf8');
  const projectFiles = getProjectJsFiles(root, manifest);
  const pool = new Map();
  let poolTotal = 0;
  const perFile = [];
  for (const file of projectFiles) {
    const tokens = tokenizeJavaScript(fs.readFileSync(path.join(root, file), 'utf8'));
    perFile.push(`${file} (${tokens.length})`);
    poolTotal += tokens.length;
    for (const token of tokens) pool.set(token, (pool.get(token) || 0) + 1);
  }
  report.note('Diagnose files', `${projectFiles.length} file dipindai, ${poolTotal} token: ${perFile.join(', ')}`);
  const scanRoots = Array.isArray(manifest.tokenScanRoots) ? JSON.stringify(manifest.tokenScanRoots) : '(tidak diset: semua .js di root kecuali tools/ dan baseline/)';
  report.note('Diagnose scope', `tokenScanRoots = ${scanRoots}; tokenScanFiles = ${JSON.stringify(manifest.tokenScanFiles || [])}`);

  let index = 0;
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)) {
    const attrs = match[1];
    const type = ((attrs.match(/\btype\s*=\s*["']?([^"'\s>]+)/i) || [])[1] || '').toLowerCase();
    if (type && !/(?:java|ecma)script|module/i.test(type)) continue;
    if (/\bsrc\s*=/i.test(attrs) || !match[2].trim()) continue;
    const tokens = tokenizeJavaScript(match[2]);
    // Coverage of this block against the whole project pool, counted in isolation.
    const local = new Map(pool);
    let hit = 0;
    const lost = new Map();
    for (const token of tokens) {
      const n = local.get(token) || 0;
      if (n > 0) { hit += 1; local.set(token, n - 1); } else lost.set(token, (lost.get(token) || 0) + 1);
    }
    const idMatch = attrs.match(/\bid\s*=\s*["']?([^"'\s>]+)/i);
    const label = `#${index} ${idMatch ? `id=${idMatch[1]} ` : ''}${type ? `type=${type} ` : ''}offset=${match.index} chars=${match[2].length}`;
    const top = [...lost.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([t, c]) => `${t}×${c}`).join(', ');
    report.note('Diagnose block', `${label}: ${hit}/${tokens.length} (${tokens.length ? (hit / tokens.length * 100).toFixed(2) : '100.00'}%)${top ? ` kurang: ${top}` : ''}; head="${match[2].trim().slice(0, 50).replace(/\s+/g, ' ')}"`);
    index += 1;
  }
}

function verifyArchitecture(root, manifest, report) {
  const jsFiles = getProjectJsFiles(root, manifest);
  const allJs = jsFiles.map(file => fs.readFileSync(path.join(root, file), 'utf8')).join('\n');
  for (const marker of manifest.architectureMarkers || []) {
    let regex;
    try { regex = new RegExp(marker.pattern); }
    catch { report.fail('Architecture', `Regex marker tidak valid: ${marker.label}`); continue; }
    if (regex.test(allJs)) report.pass('Architecture', marker.label);
    else report.fail('Architecture', `Marker tidak ditemukan: ${marker.label}`);
  }
  for (const owner of manifest.shaderOwnership || []) {
    const full = path.resolve(root, owner.file);
    if (!fs.existsSync(full)) { report.fail('Shader ownership', `File pemilik shader tidak ditemukan: ${owner.file}`); continue; }
    const content = fs.readFileSync(full, 'utf8');
    for (const marker of owner.requiredMarkers || []) {
      if (content.includes(marker)) report.pass('Shader ownership', `${owner.file}: ${marker}`);
      else report.fail('Shader ownership', `${owner.file} tidak memuat marker: ${marker}`);
    }
  }
}

function createReport() {
  const checks = [];
  return {
    checks,
    pass(area, message) { checks.push({ status: 'PASS', area, message }); },
    fail(area, message) { checks.push({ status: 'FAIL', area, message }); },
    warn(area, message) { checks.push({ status: 'WARN', area, message }); },
    note(area, message) { checks.push({ status: 'INFO', area, message }); }
  };
}

function main() {
  let args;
  try { args = parseArgs(process.argv.slice(2)); }
  catch (error) { console.error(error.message); process.exitCode = 2; return; }
  if (args.help) { printHelp(); return; }

  const report = createReport();
  if (!fs.existsSync(args.root)) {
    console.error(`Root project tidak ditemukan: ${args.root}`); process.exitCode = 2; return;
  }
  let manifest = DEFAULTS;
  if (fs.existsSync(args.manifest)) {
    try { manifest = { ...DEFAULTS, ...readJson(args.manifest) }; }
    catch (error) { console.error(`Manifest JSON tidak valid: ${error.message}`); process.exitCode = 2; return; }
  } else report.warn('Manifest', `Manifest tidak ditemukan; memakai konfigurasi default. Lokasi yang dicari: ${args.manifest}`);

  verifyHtml(args.root, manifest, report);
  verifyCss(args.root, report);
  verifyManifestFiles(args.root, manifest, report);
  verifyJavaScriptAssetReferences(args.root, manifest, report);
  verifyArchitecture(args.root, manifest, report);
  compareBaseline(args.root, args.baseline, manifest, report, args.diagnose);

  const totals = {
    pass: report.checks.filter(x => x.status === 'PASS').length,
    fail: report.checks.filter(x => x.status === 'FAIL').length,
    warn: report.checks.filter(x => x.status === 'WARN').length,
    info: report.checks.filter(x => x.status === 'INFO').length
  };
  const result = { projectRoot: args.root, baseline: args.baseline, totals, checks: report.checks };
  if (args.json) console.log(JSON.stringify(result, null, 2));
  else {
    console.log('\n=== 7KAIH BUILD INTEGRITY REPORT ===');
    for (const item of report.checks) console.log(`[${item.status}] ${item.area}: ${item.message}`);
    console.log(`\nTOTAL: ${totals.pass} PASS | ${totals.fail} FAIL | ${totals.warn} WARN | ${totals.info} INFO`);
    console.log(totals.fail ? 'RESULT: NOT VERIFIED — perbaiki seluruh FAIL.' : totals.warn ? 'RESULT: STRUCTURAL CHECK COMPLETE WITH WARNINGS — baseline/konfigurasi belum lengkap.' : 'RESULT: STATIC CHECKS PASSED — lanjutkan uji browser 1:1.');
  }
  if (totals.fail > 0) process.exitCode = 1;
}

main();
