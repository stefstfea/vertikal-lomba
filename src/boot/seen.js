/* KaihSeen — penanda "cutscene sudah diputar" per sesi (sessionStorage; cadangan memori bila storage diblokir).
 * Kunci: prelude (ketukan+logo) · intro (PLAY: prolog+kamera) · tutorial (Guide di Pulau Awan) · exit (badai ke Ladang) · ladang (kedatangan di Ladang)
 * Sesi berlanjut saat "Kembali ke Pulau Awan" (reload dengan flag kaih-guide-goto=awan). Muat ulang biasa (F5) = sesi baru -> semua direset. */
(function () {
  var KEY = 'kaih-seen-v1', mem = {}, ss = null, ret = false;
  try { ss = window.sessionStorage; ret = ss.getItem('kaih-guide-goto') === 'awan'; } catch (e) { ss = null; }
  function load() { if (!ss) return mem; try { var o = JSON.parse(ss.getItem(KEY) || '{}'); return o && typeof o === 'object' ? o : {}; } catch (e) { return mem; } }
  function save(o) { mem = o; if (ss) try { ss.setItem(KEY, JSON.stringify(o)); } catch (e) {} }
  if (!ret) save({});
  window.KaihSeen = {
    returning: ret,
    has: function (k) { return !!load()[k]; },
    mark: function (k) { var o = load(); o[k] = 1; save(o); },
    reset: function () { save({}); }
  };
})();
