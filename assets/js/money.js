/* ============================================================
   Counting money & making change (USD) — coin/bill piles drawn
   as SVG, two practice modes, and printable worksheets with
   answer keys. Everything is held in integer cents; no float
   arithmetic ever touches an amount.
   ============================================================ */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };

  /* denomination table — cls drives the drawn size (real US diameters) */
  var DEN = {
    1:    { cls: "penny",   label: "1¢",  one: "penny",     many: "pennies" },
    5:    { cls: "nickel",  label: "5¢",  one: "nickel",    many: "nickels" },
    10:   { cls: "dime",    label: "10¢", one: "dime",      many: "dimes" },
    25:   { cls: "quarter", label: "25¢", one: "quarter",   many: "quarters" },
    100:  { bill: true, label: "$1",  one: "$1 bill",  many: "$1 bills" },
    500:  { bill: true, label: "$5",  one: "$5 bill",  many: "$5 bills" },
    1000: { bill: true, label: "$10", one: "$10 bill", many: "$10 bills" },
    2000: { bill: true, label: "$20", one: "$20 bill", many: "$20 bills" }
  };
  var GREEDY = [2000, 1000, 500, 100, 25, 10, 5, 1];

  /* how many of each denomination a pile may hold, per level */
  var COUNT_LEVELS = [
    { key: "Pennies & nickels", note: "Count on by ones and fives",
      mix: [{ v: 5, max: 4 }, { v: 1, max: 9 }] },
    { key: "Add dimes", note: "Tens, fives and ones together",
      mix: [{ v: 10, max: 5 }, { v: 5, max: 3 }, { v: 1, max: 4 }] },
    { key: "Add quarters", note: "All four coins mixed together, around a dollar",
      mix: [{ v: 25, max: 3 }, { v: 10, max: 3 }, { v: 5, max: 2 }, { v: 1, max: 4 }] },
    { key: "Coins & $1 bills", note: "Coins plus one or two dollar bills, up to about $3",
      mix: [{ v: 100, max: 2 }, { v: 25, max: 3 }, { v: 10, max: 3 }, { v: 5, max: 2 }, { v: 1, max: 4 }] },
    { key: "Bills & coins", note: "Bills and coins together, up to about $18",
      mix: [{ v: 1000, max: 1 }, { v: 500, max: 1 }, { v: 100, max: 2 }, { v: 25, max: 3 },
            { v: 10, max: 2 }, { v: 5, max: 1 }, { v: 1, max: 4 }] }
  ];

  /* paid = the note handed over; step = price granularity */
  var CHANGE_LEVELS = [
    { key: "From $1", note: "Prices in whole nickels, change under a dollar", paid: [100], min: 5, step: 5 },
    { key: "From $5", note: "Any price under five dollars", paid: [500], min: 25, step: 1 },
    { key: "From $10", note: "Any price under ten dollars", paid: [1000], min: 100, step: 1 },
    { key: "From $20", note: "Any price under twenty dollars", paid: [2000], min: 100, step: 1 },
    { key: "Any bill", note: "The note handed over changes each time", paid: [100, 500, 1000, 2000], min: 5, step: 1 }
  ];

  var cLevel = 2, kLevel = 1;
  var cCur = null, kCur = null, cDone = false, kDone = false;
  var cQuiz = { right: 0, asked: 0, streak: 0, best: 0 };
  var kQuiz = { right: 0, asked: 0, streak: 0, best: 0 };
  try { cQuiz.best = parseInt(localStorage.getItem("bvm_mc_best"), 10) || 0; } catch (e) { cQuiz.best = 0; }
  try { kQuiz.best = parseInt(localStorage.getItem("bvm_mk_best"), 10) || 0; } catch (e) { kQuiz.best = 0; }

  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pad2(n) { return (n < 10 ? "0" : "") + n; }

  /* ---------- formatting ---------- */
  /* under a dollar reads as 45¢, a dollar and over as $1.45 — the way
     price tags and textbooks split it */
  function fmt(c) {
    if (c < 100) return c + "¢";
    return "$" + Math.floor(c / 100) + "." + pad2(c % 100);
  }
  function fmtD(c) { return "$" + Math.floor(c / 100) + "." + pad2(c % 100); }

  /* "$5" means five dollars; a bare "5" means five cents. Also takes
     5c, 5¢, .45, 0.45, $1.45, 145 */
  function parseMoney(str) {
    var t = String(str).trim().toLowerCase().replace(/[\s,]/g, "");
    if (!t) return null;
    var cent = false, dollar = false;
    if (/[c¢]$/.test(t)) { cent = true; t = t.replace(/[c¢]$/, ""); }
    if (/^\$/.test(t)) { dollar = true; t = t.slice(1); }
    if (!t || !/^\d*\.?\d*$/.test(t)) return null;
    if (t.indexOf(".") >= 0) {
      if (cent) return null;
      var m = t.match(/^(\d*)\.(\d{0,2})$/);
      if (!m || (m[1] === "" && m[2] === "")) return null;
      var d = m[1] === "" ? 0 : parseInt(m[1], 10);
      return d * 100 + parseInt((m[2] + "00").slice(0, 2), 10);
    }
    var n = parseInt(t, 10);
    if (isNaN(n)) return null;
    return dollar && !cent ? n * 100 : n;
  }

  /* ---------- denominations ---------- */
  function greedy(cents) {
    var out = [];
    GREEDY.forEach(function (v) {
      var n = Math.floor(cents / v);
      if (n > 0) { out.push({ v: v, n: n }); cents -= n * v; }
    });
    return out;
  }

  function describe(cents) {
    if (cents === 0) return "nothing — the money was exact";
    return greedy(cents).map(function (p) {
      return p.n + " " + (p.n === 1 ? DEN[p.v].one : DEN[p.v].many);
    }).join(", ");
  }

  /* ---------- the drawings ---------- */
  function coinSVG(v) {
    var d = DEN[v];
    if (d.bill) {
      return '<svg class="bvm-bill" viewBox="0 0 160 70" role="img" aria-label="' + d.one + '">' +
        '<rect class="paper" x="2" y="2" width="156" height="66" rx="5"/>' +
        '<rect class="inner" x="9" y="9" width="142" height="52" rx="3"/>' +
        '<text class="val" x="80" y="35" dy=".35em">' + d.label + '</text></svg>';
    }
    return '<svg class="bvm-coin ' + d.cls + '" viewBox="0 0 100 100" role="img" aria-label="' + d.one + '">' +
      '<circle class="rim" cx="50" cy="50" r="47"/>' +
      '<circle class="face" cx="50" cy="50" r="40"/>' +
      '<text class="val" x="50" y="50" dy=".35em">' + d.label + '</text></svg>';
  }

  /* a pile is [{v,n}] sorted big-first — the order you are meant to count in */
  function pileSVG(pile) {
    var s = '<div class="money-pile">';
    pile.forEach(function (p) {
      for (var i = 0; i < p.n; i++) s += coinSVG(p.v);
    });
    return s + "</div>";
  }

  function pileTotal(pile) {
    return pile.reduce(function (t, p) { return t + p.v * p.n; }, 0);
  }
  function pileCount(pile) {
    return pile.reduce(function (t, p) { return t + p.n; }, 0);
  }

  /* ---------- problem generators ---------- */
  function makePile(lv) {
    var mix = COUNT_LEVELS[lv].mix, pile, guard = 0;
    do {
      pile = [];
      mix.forEach(function (m) {
        var n = ri(0, m.max);
        if (n > 0) pile.push({ v: m.v, n: n });
      });
      guard++;
    } while (guard < 200 && (pileCount(pile) < 2 || pileCount(pile) > 11 || pileTotal(pile) === 0));
    if (!pile.length) pile = [{ v: mix[mix.length - 1].v, n: 3 }];
    pile.sort(function (a, b) { return b.v - a.v; });
    return pile;
  }

  function makeChange(lv) {
    var L = CHANGE_LEVELS[lv];
    var paid = L.paid[Math.floor(Math.random() * L.paid.length)];
    var hi = paid - L.step;
    var price = ri(L.min, hi);
    if (L.step > 1) price = Math.max(L.step, Math.round(price / L.step) * L.step);
    if (price >= paid) price = paid - L.step;
    return { price: price, paid: paid, change: paid - price };
  }

  /* ---------- practice: count the money ---------- */
  function cNew() {
    var p, guard = 0;
    do { p = makePile(cLevel); guard++; }
    while (guard < 50 && cCur && pileTotal(p) === pileTotal(cCur));
    cCur = p;
    cDone = false;
    $("mcPile").innerHTML = pileSVG(cCur);
    $("mcInput").value = "";
    cFeed("", "");
    $("mcInput").focus();
  }

  function cFeed(text, kind) {
    var el = $("mcFeedback");
    el.textContent = text;
    el.className = "money-feedback" + (kind ? " " + kind : "");
  }

  function cScore() {
    $("mcScore").textContent = cQuiz.right + " / " + cQuiz.asked;
    $("mcStreak").textContent = String(cQuiz.streak);
    $("mcBest").textContent = String(cQuiz.best);
  }

  function cCheck() {
    if (!cCur || cDone) return;
    var got = parseMoney($("mcInput").value);
    if (got === null) { cFeed("Write the amount like 0.45 or 45¢.", "bad"); return; }
    var want = pileTotal(cCur);
    cQuiz.asked++;
    if (got === want) {
      cQuiz.right++;
      cQuiz.streak++;
      if (cQuiz.streak > cQuiz.best) {
        cQuiz.best = cQuiz.streak;
        try { localStorage.setItem("bvm_mc_best", String(cQuiz.best)); } catch (e) { /* private mode */ }
      }
      cFeed("Correct — " + fmt(want) + ".", "ok");
      cDone = true; cScore();
      setTimeout(cNew, 900);
      return;
    }
    cQuiz.streak = 0;
    cFeed("Not quite — that is " + fmt(want) + " (" + describe(want) + ").", "bad");
    cDone = true; cScore();
  }

  function cReveal() {
    if (!cCur || cDone) return;
    cQuiz.asked++; cQuiz.streak = 0; cDone = true;
    var want = pileTotal(cCur);
    cFeed(fmt(want) + " — " + describe(want) + ".", "");
    cScore();
  }

  /* ---------- practice: make change ---------- */
  function kNew() {
    var p, guard = 0;
    do { p = makeChange(kLevel); guard++; }
    while (guard < 50 && kCur && p.change === kCur.change);
    kCur = p;
    kDone = false;
    $("mkPrice").textContent = fmtD(kCur.price);
    $("mkPaid").textContent = fmtD(kCur.paid);
    $("mkPaidPile").innerHTML = pileSVG(greedy(kCur.paid));
    $("mkInput").value = "";
    kFeed("", "");
    $("mkInput").focus();
  }

  function kFeed(text, kind) {
    var el = $("mkFeedback");
    el.textContent = text;
    el.className = "money-feedback" + (kind ? " " + kind : "");
  }

  function kScore() {
    $("mkScore").textContent = kQuiz.right + " / " + kQuiz.asked;
    $("mkStreak").textContent = String(kQuiz.streak);
    $("mkBest").textContent = String(kQuiz.best);
  }

  function kCheck() {
    if (!kCur || kDone) return;
    var got = parseMoney($("mkInput").value);
    if (got === null) { kFeed("Write the change like 1.53 or 53¢.", "bad"); return; }
    kQuiz.asked++;
    if (got === kCur.change) {
      kQuiz.right++;
      kQuiz.streak++;
      if (kQuiz.streak > kQuiz.best) {
        kQuiz.best = kQuiz.streak;
        try { localStorage.setItem("bvm_mk_best", String(kQuiz.best)); } catch (e) { /* private mode */ }
      }
      kFeed("Correct — " + fmt(kCur.change) + ", handed back as " + describe(kCur.change) + ".", "ok");
      kDone = true; kScore();
      setTimeout(kNew, 1100);
      return;
    }
    kQuiz.streak = 0;
    kFeed("Not quite — " + fmtD(kCur.paid) + " − " + fmtD(kCur.price) + " = " + fmt(kCur.change) +
      " (" + describe(kCur.change) + ").", "bad");
    kDone = true; kScore();
  }

  function kReveal() {
    if (!kCur || kDone) return;
    kQuiz.asked++; kQuiz.streak = 0; kDone = true;
    kFeed(fmt(kCur.change) + " — " + describe(kCur.change) + ".", "");
    kScore();
  }

  /* ---------- level chips ---------- */
  function renderChips(boxId, noteId, levels, get, set) {
    var box = $(boxId);
    box.innerHTML = "";
    levels.forEach(function (L, i) {
      var b = document.createElement("button");
      b.className = "chip" + (i === get() ? " active" : "");
      b.textContent = L.key;
      b.title = L.note;
      b.addEventListener("click", function () {
        set(i);
        renderChips(boxId, noteId, levels, get, set);
        $(noteId).textContent = levels[get()].note + ".";
      });
      box.appendChild(b);
    });
  }

  /* ---------- printable sheets ---------- */
  function sheetHead(sheet, title, instruction) {
    var head = document.createElement("div");
    head.className = "ws-head";
    var t = document.createElement("div");
    t.className = "t";
    t.textContent = title;
    head.appendChild(t);
    var bl = document.createElement("div");
    bl.className = "blanks";
    bl.textContent = "Name: ____________________   Date: ____________   Score: ____ / 12";
    head.appendChild(bl);
    sheet.appendChild(head);

    var cap = document.createElement("div");
    cap.className = "ws-instruction";
    cap.textContent = instruction;
    sheet.appendChild(cap);
  }

  function sheetFoot(sheet, rows) {
    var ans = document.createElement("div");
    ans.className = "ws-answers";
    var h = document.createElement("h3");
    h.textContent = "Answer key";
    ans.appendChild(h);
    var ag = document.createElement("div");
    ag.className = "money-anskey";
    rows.forEach(function (r) {
      var d = document.createElement("div");
      d.innerHTML = "<strong>" + r.n + ") " + r.a + "</strong> &nbsp;<span>" + r.sub + "</span>";
      ag.appendChild(d);
    });
    ans.appendChild(ag);
    sheet.appendChild(ans);

    var note = document.createElement("div");
    note.className = "ws-footer-note";
    note.textContent = "Free money worksheets · brainvsmath.com/money-worksheets/";
    sheet.appendChild(note);
  }

  function printCount() {
    var sheet = $("moSheet");
    sheet.innerHTML = "";
    sheetHead(sheet, "Counting Money — " + COUNT_LEVELS[cLevel].key,
      "Count the coins and bills in each box and write the total on the line.");

    var grid = document.createElement("div");
    grid.className = "money-sheet-grid";
    var rows = [];
    for (var i = 0; i < 12; i++) {
      var pile = makePile(cLevel);
      var total = pileTotal(pile);
      rows.push({ n: i + 1, a: fmt(total), sub: describe(total) });
      var item = document.createElement("div");
      item.className = "item";
      item.innerHTML = '<div class="q">' + (i + 1) + ")</div>" + pileSVG(pile) +
        '<div class="lbl">Total: ____________</div>';
      grid.appendChild(item);
    }
    sheet.appendChild(grid);
    sheetFoot(sheet, rows);
    sheet.classList.remove("hidden");
    setTimeout(function () { window.print(); }, 150);
  }

  function printChange() {
    var sheet = $("moSheet");
    sheet.innerHTML = "";
    sheetHead(sheet, "Making Change — " + CHANGE_LEVELS[kLevel].key,
      "Work out the change owed for each purchase and write it on the line.");

    var grid = document.createElement("div");
    grid.className = "money-change-grid";
    var rows = [];
    for (var i = 0; i < 12; i++) {
      var p = makeChange(kLevel);
      rows.push({ n: i + 1, a: fmt(p.change), sub: describe(p.change) });
      var item = document.createElement("div");
      item.className = "item";
      item.innerHTML = '<div class="q">' + (i + 1) + ")</div>" +
        '<div class="row"><span>Price</span><b>' + fmtD(p.price) + "</b></div>" +
        '<div class="row"><span>Paid with</span><b>' + fmtD(p.paid) + "</b></div>" +
        '<div class="row"><span>Change</span><b class="blank">____________</b></div>';
      grid.appendChild(item);
    }
    sheet.appendChild(grid);
    sheetFoot(sheet, rows);
    sheet.classList.remove("hidden");
    setTimeout(function () { window.print(); }, 150);
  }

  /* ---------- wire up ---------- */
  renderChips("mcLevels", "mcLevelNote", COUNT_LEVELS,
    function () { return cLevel; },
    function (i) { cLevel = i; cNew(); });
  renderChips("mkLevels", "mkLevelNote", CHANGE_LEVELS,
    function () { return kLevel; },
    function (i) { kLevel = i; kNew(); });

  $("mcCheck").addEventListener("click", cCheck);
  $("mcShow").addEventListener("click", cReveal);
  $("mcNew").addEventListener("click", cNew);
  $("mcInput").addEventListener("keydown", function (e) {
    if (e.key !== "Enter") return;
    if (cDone) cNew(); else cCheck();
  });

  $("mkCheck").addEventListener("click", kCheck);
  $("mkShow").addEventListener("click", kReveal);
  $("mkNew").addEventListener("click", kNew);
  $("mkInput").addEventListener("keydown", function (e) {
    if (e.key !== "Enter") return;
    if (kDone) kNew(); else kCheck();
  });

  $("moPrintCount").addEventListener("click", printCount);
  $("moPrintChange").addEventListener("click", printChange);

  $("mcLevelNote").textContent = COUNT_LEVELS[cLevel].note + ".";
  $("mkLevelNote").textContent = CHANGE_LEVELS[kLevel].note + ".";
  cScore(); kScore();
  cNew(); kNew();

  /* QA handle */
  window.__BVM_MONEY = {
    fmt: fmt, fmtD: fmtD, parse: parseMoney, greedy: greedy, describe: describe,
    makePile: makePile, makeChange: makeChange, total: pileTotal, count: pileCount,
    COUNT_LEVELS: COUNT_LEVELS, CHANGE_LEVELS: CHANGE_LEVELS
  };
})();
