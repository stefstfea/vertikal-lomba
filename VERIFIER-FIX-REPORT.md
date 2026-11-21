# 7KAIH Verifier Scan-Scope Fix Report

## Changes made
- Updated `tools/module-manifest.json` with all 32 landscape module entries and explicit JavaScript scan roots: `src/boot/`, `src/prelude/`, `src/landscape/`, `src/main.js`, `js/vendor/`, and `assets/audio/`.
- Updated `tools/verify-build.js` to normalize project-relative paths, scan every `.js`/`.mjs`/`.cjs` file under the configured roots recursively, include explicitly listed scan files, and support both string and `{name,path}` module-manifest entries.
- Kept baseline extraction from inline JavaScript and local script references, multiset token comparison, function/class checks, and the `window.KAIH` / `K.hooks` architecture checks.
- No application JavaScript files were modified.

## Validation performed
- `node --check tools/verify-build.js`: PASS.
- Manifest JSON parse: PASS.
- Manifest module count: 32/32.
- Project JavaScript files included in scan: 48.
- HTML/script order, required DOM hooks, CSS references, module paths, vendor bundle, and global architecture checks: PASS.

## Baseline token result
Command executed from the extracted project root:

```bash
node tools/verify-build.js --baseline ../7KAIH-Cloud-Island-Cute-Balls-Merged-v12.html
```

Result: **99.804% (273,212 / 273,749), 537 token occurrences missing; 84 PASS | 1 FAIL | 0 WARN | 2 INFO.**

Therefore, the requested 100.000% baseline token coverage is **not confirmed**. The verifier already scanned 48 JavaScript files, so the remaining difference is not explained by omitted scan roots alone. The most frequent deficits in this extracted project snapshot include `STR:<large-literal>` and repeated identifier occurrences such as `cur`, `this`, `gfx`, `menuEl`, `gs`, `beepCtx`, and `dlg`.

## Important input-version limitation
The available full project archive (`7KAIH_v12_extracted.zip`) and the separately uploaded `loader.js` are not identical: the archive's loader is 3,538 bytes; the separately uploaded loader is 2,744 bytes. Substituting the separately uploaded loader reduced coverage to 95.667%, so it was not retained. The full latest project snapshot was not available as one coherent archive during this run. The uploaded verifier also did not contain functions named `readJsonAssignment` or `balancedJsonEnd`; this patch did not invent or replace those functions. Its existing JSON handling remains `JSON.parse`.

## Release status
**SCANNER SCOPE UPDATED — BASELINE TOKEN PARITY STILL OPEN.** Do not mark the build 100% verified until the verifier is run against the exact current project snapshot and the remaining token multiset differences are explained. No token threshold was lowered and no synthetic tokens were added.
