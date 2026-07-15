/* ============================================================
   Brain vs Math — core.js
   Shared engine: seeded RNG (daily puzzles), storage, theme,
   share, stats, modals, config-gated ads/analytics.
   ============================================================ */
(function () {
  "use strict";

  var CFG = window.BVM_CONFIG || {};
  var SITE_URL = (CFG.siteUrl || "").replace(/\/+$/, "");

  /* ---------- seeded RNG (deterministic daily puzzles) ---------- */
  function xmur3(str) {
    var h = 1779033703 ^ str.length;
    for (var i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
      h = (h << 13) | (h >>> 19);
    }
    return function () {
      h = Math.imul(h ^ (h >>> 16), 2246822507);
      h = Math.imul(h ^ (h >>> 13), 3266489909);
      return (h ^= h >>> 16) >>> 0;
    };
  }
  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function rng(seedStr) { return mulberry32(xmur3(String(seedStr))()); }

  /* ---------- dates (local-midnight rollover, like Wordle) ---------- */
  var EPOCH_UTC = Date.UTC(2026, 6, 15); // 2026-07-15 = Puzzle #1
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function dateKey(d) {
    d = d || new Date();
    return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
  }
  function prettyDate(d) {
    d = d || new Date();
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }
  function puzzleNumber(d) {
    d = d || new Date();
    var localUTC = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
    return Math.max(1, Math.round((localUTC - EPOCH_UTC) / 864e5) + 1);
  }
  function msToNextMidnight() {
    var n = new Date();
    return new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1) - n;
  }

  /* ---------- storage ---------- */
  function load(key, fallback) {
    try { var v = localStorage.getItem(key); return v === null ? fallback : JSON.parse(v); }
    catch (e) { return fallback; }
  }
  function save(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { /* private mode */ }
  }

  /* ---------- theme ---------- */
  var THEME_KEY = "bvm_theme";
  function applyTheme(t) {
    if (t) document.documentElement.setAttribute("data-theme", t);
    else document.documentElement.removeAttribute("data-theme");
  }
  function toggleTheme() {
    var cur = load(THEME_KEY, null);
    if (!cur) cur = matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
    var next = cur === "dark" ? "light" : "dark";
    save(THEME_KEY, next); applyTheme(next);
  }

  /* ---------- toast ---------- */
  var toastTimer = null;
  function toast(msg) {
    var el = document.querySelector(".toast");
    if (!el) { el = document.createElement("div"); el.className = "toast"; document.body.appendChild(el); }
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove("show"); }, 2400);
  }

  /* ---------- share ---------- */
  function share(text) {
    if (navigator.share) {
      navigator.share({ text: text }).catch(function (e) {
        if (e && e.name !== "AbortError") copyFallback(text);
      });
      return;
    }
    copyFallback(text);
  }
  function copyFallback(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        function () { toast("Result copied — paste it anywhere!"); },
        function () { window.prompt("Copy your result:", text); }
      );
    } else {
      window.prompt("Copy your result:", text);
    }
  }

  /* ---------- daily-game stats ---------- */
  var STATS_KEY = "bvm_stats_v1";
  function getStats() {
    return load(STATS_KEY, {
      daysPlayed: 0, daysSolved: 0, perfectDays: 0, tiersSolved: 0,
      streak: 0, maxStreak: 0, lastSolvedDay: null, lastPlayedDay: null
    });
  }
  function markPlayed(dayKeyStr) {
    var s = getStats();
    if (s.lastPlayedDay !== dayKeyStr) { s.lastPlayedDay = dayKeyStr; s.daysPlayed++; save(STATS_KEY, s); }
    return s;
  }
  function markSolvedDay(dayKeyStr) {
    var s = getStats();
    if (s.lastSolvedDay === dayKeyStr) return s;
    var y = new Date(); y.setDate(y.getDate() - 1);
    s.streak = (s.lastSolvedDay === dateKey(y)) ? s.streak + 1 : 1;
    s.maxStreak = Math.max(s.maxStreak, s.streak);
    s.lastSolvedDay = dayKeyStr;
    s.daysSolved++;
    save(STATS_KEY, s);
    return s;
  }
  function addTierSolve() { var s = getStats(); s.tiersSolved++; save(STATS_KEY, s); return s; }
  function addPerfectDay() { var s = getStats(); s.perfectDays++; save(STATS_KEY, s); return s; }

  /* ---------- modals ---------- */
  function openModal(id) {
    var m = document.getElementById(id);
    if (m) { m.classList.add("open"); document.body.classList.add("no-scroll"); }
  }
  function closeModal(id) {
    var m = document.getElementById(id);
    if (m) { m.classList.remove("open"); document.body.classList.remove("no-scroll"); }
  }
  function closeAllModals() {
    var any = false;
    document.querySelectorAll(".modal.open").forEach(function (m) { m.classList.remove("open"); any = true; });
    if (any) document.body.classList.remove("no-scroll");
  }

  /* ---------- tiny confetti ---------- */
  function confetti(anchorEl) {
    if (!anchorEl) return;
    var bits = ["🎉", "⭐", "✨", "🧠", "💥"];
    var rect = anchorEl.getBoundingClientRect();
    for (var i = 0; i < 10; i++) {
      var b = document.createElement("span");
      b.className = "confetti-bit";
      b.textContent = bits[i % bits.length];
      b.style.left = (rect.left + rect.width * Math.random()) + "px";
      b.style.top = (rect.top + rect.height / 2 + window.scrollY) + "px";
      b.style.animationDelay = (Math.random() * .25) + "s";
      document.body.appendChild(b);
      setTimeout(function (el) { return function () { el.remove(); }; }(b), 1400);
    }
  }

  /* ---------- monetization & analytics (config-gated, off by default) ---------- */
  function initAdsense() {
    if (!CFG.adsenseClient) return;
    var s = document.createElement("script");
    s.async = true;
    s.crossOrigin = "anonymous";
    s.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=" + encodeURIComponent(CFG.adsenseClient);
    document.head.appendChild(s);
  }
  function initAnalytics() {
    if (!CFG.cfAnalyticsToken) return;
    var s = document.createElement("script");
    s.defer = true;
    s.src = "https://static.cloudflareinsights.com/beacon.min.js";
    s.setAttribute("data-cf-beacon", JSON.stringify({ token: CFG.cfAnalyticsToken }));
    document.head.appendChild(s);
  }

  /* ---------- boot ---------- */
  function init() {
    applyTheme(load(THEME_KEY, null));
    var tt = document.getElementById("themeToggle");
    if (tt) tt.addEventListener("click", toggleTheme);

    document.querySelectorAll("[data-open-modal]").forEach(function (b) {
      b.addEventListener("click", function () { openModal(b.getAttribute("data-open-modal")); });
    });
    document.querySelectorAll("[data-close-modal]").forEach(function (b) {
      b.addEventListener("click", function () { closeModal(b.getAttribute("data-close-modal")); });
    });
    document.querySelectorAll(".modal").forEach(function (m) {
      m.addEventListener("click", function (e) { if (e.target === m) closeAllModals(); });
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeAllModals(); });

    var y = document.getElementById("year");
    if (y) y.textContent = String(new Date().getFullYear());

    initAdsense();
    initAnalytics();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();

  /* ---------- public API ---------- */
  window.BVM = {
    rng: rng,
    dateKey: dateKey,
    prettyDate: prettyDate,
    puzzleNumber: puzzleNumber,
    msToNextMidnight: msToNextMidnight,
    load: load, save: save,
    toast: toast, share: share,
    getStats: getStats, markPlayed: markPlayed, markSolvedDay: markSolvedDay,
    addTierSolve: addTierSolve, addPerfectDay: addPerfectDay,
    openModal: openModal, closeModal: closeModal,
    confetti: confetti,
    SITE_URL: SITE_URL
  };
})();
