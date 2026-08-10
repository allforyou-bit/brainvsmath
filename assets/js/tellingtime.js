/* ============================================================
   Telling time — analog clock reader (SVG) + printable
   worksheets. Two sheet types: read the clock, and draw the
   hands. O'clock through to-the-minute, answer keys included.
   ============================================================ */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };

  var LEVELS = [
    { key: "O'clock", step: 60, note: "Whole hours — the minute hand always points at 12" },
    { key: "Half hour", step: 30, note: "O'clock and half past" },
    { key: "Quarter hour", step: 15, note: "O'clock, quarter past, half past, quarter to" },
    { key: "5 minutes", step: 5, note: "Every five minutes — one whole number on the dial" },
    { key: "To the minute", step: 1, note: "Any minute, including the small tick marks" }
  ];
  var level = 2;
  var current = null;
  var revealed = false;
  var quiz = { right: 0, asked: 0, streak: 0, best: 0 };
  try { quiz.best = parseInt(localStorage.getItem("bvm_tt_best"), 10) || 0; } catch (e) { quiz.best = 0; }

  var HOUR = ["", "one", "two", "three", "four", "five", "six",
    "seven", "eight", "nine", "ten", "eleven", "twelve"];
  var MIN = ["", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten",
    "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen",
    "nineteen", "twenty", "twenty-one", "twenty-two", "twenty-three", "twenty-four", "twenty-five",
    "twenty-six", "twenty-seven", "twenty-eight", "twenty-nine"];

  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function r2(v) { return Math.round(v * 100) / 100; }
  function pad2(n) { return (n < 10 ? "0" : "") + n; }

  /* ---------- the time itself ---------- */
  function makeTime(lv) {
    var step = LEVELS[lv].step;
    var slots = Math.floor(60 / step);
    return { h: ri(1, 12), m: (Math.floor(Math.random() * slots) * step) % 60 };
  }

  function fmt(h, m) { return h + ":" + pad2(m); }

  /* spoken form: "quarter to four", "twenty-three minutes past nine" */
  function words(h, m) {
    var next = h === 12 ? 1 : h + 1;
    if (m === 0) return HOUR[h] + " o'clock";
    if (m === 15) return "quarter past " + HOUR[h];
    if (m === 30) return "half past " + HOUR[h];
    if (m === 45) return "quarter to " + HOUR[next];
    if (m < 30) return MIN[m] + (m % 5 ? " minutes" : "") + " past " + HOUR[h];
    var to = 60 - m;
    return MIN[to] + (to % 5 ? " minutes" : "") + " to " + HOUR[next];
  }

  /* accepts 3:45 · 3.45 · 3 45 · 345 · 0345 · 15:45 · "3" · trailing am/pm */
  function parseAnswer(str) {
    var t = String(str).trim().toLowerCase().replace(/\s*[ap]\.?m\.?$/, "").trim();
    var h, m, mt;
    if ((mt = t.match(/^(\d{1,2})\s*[:.\s]\s*(\d{1,2})$/))) { h = +mt[1]; m = +mt[2]; }
    else if ((mt = t.match(/^(\d{3,4})$/))) { h = +mt[1].slice(0, -2); m = +mt[1].slice(-2); }
    else if ((mt = t.match(/^(\d{1,2})$/))) { h = +mt[1]; m = 0; }
    else return null;
    if (m > 59) return null;
    if (h === 0 || h === 24) h = 12;
    else if (h > 12) h -= 12;
    if (h < 1 || h > 12) return null;
    return { h: h, m: m };
  }

  /* ---------- clock face ---------- */
  function pt(deg, r) {
    var a = (deg - 90) * Math.PI / 180;
    return { x: r2(100 + r * Math.cos(a)), y: r2(100 + r * Math.sin(a)) };
  }

  /* opts.hands === false renders a blank dial (draw-the-hands sheets) */
  function clockSVG(t, opts) {
    opts = opts || {};
    var hands = opts.hands !== false;
    var s = '<svg class="bvm-clock" viewBox="0 0 200 200" role="img" aria-label="' +
      (hands ? "Analog clock showing " + fmt(t.h, t.m) : "Blank clock face") + '">';
    s += '<circle class="dial" cx="100" cy="100" r="94"/>';
    for (var i = 0; i < 60; i++) {
      var maj = i % 5 === 0;
      var o = pt(i * 6, 88), n = pt(i * 6, maj ? 76 : 83);
      s += '<line class="tick' + (maj ? " maj" : "") + '" x1="' + o.x + '" y1="' + o.y +
        '" x2="' + n.x + '" y2="' + n.y + '"/>';
    }
    for (var k = 1; k <= 12; k++) {
      var p = pt(k * 30, 62);
      s += '<text class="num" x="' + p.x + '" y="' + p.y + '" dy=".35em">' + k + '</text>';
    }
    if (hands) {
      var hh = pt((t.h % 12) * 30 + t.m * 0.5, 44);
      var mm = pt(t.m * 6, 68);
      s += '<line class="hand h" x1="100" y1="100" x2="' + hh.x + '" y2="' + hh.y + '"/>';
      s += '<line class="hand m" x1="100" y1="100" x2="' + mm.x + '" y2="' + mm.y + '"/>';
      s += '<circle class="pin" cx="100" cy="100" r="4.5"/>';
    }
    return s + "</svg>";
  }

  /* ---------- practice ---------- */
  function newQuestion() {
    var t;
    do { t = makeTime(level); } while (current && t.h === current.h && t.m === current.m);
    current = t;
    revealed = false;
    $("ttClock").innerHTML = clockSVG(current);
    $("ttInput").value = "";
    $("ttFeedback").textContent = "";
    $("ttFeedback").className = "tt-feedback";
    $("ttInput").focus();
  }

  function setFeedback(text, kind) {
    var el = $("ttFeedback");
    el.textContent = text;
    el.className = "tt-feedback" + (kind ? " " + kind : "");
  }

  function renderScore() {
    $("ttScore").textContent = quiz.right + " / " + quiz.asked;
    $("ttStreak").textContent = String(quiz.streak);
    $("ttBest").textContent = String(quiz.best);
  }

  function check() {
    if (!current || revealed) return;
    var got = parseAnswer($("ttInput").value);
    if (!got) { setFeedback("Write the time like 3:45.", "bad"); return; }
    quiz.asked++;
    if (got.h === current.h && got.m === current.m) {
      quiz.right++;
      quiz.streak++;
      if (quiz.streak > quiz.best) {
        quiz.best = quiz.streak;
        try { localStorage.setItem("bvm_tt_best", String(quiz.best)); } catch (e) { /* private mode */ }
      }
      setFeedback("Correct — " + words(current.h, current.m) + ".", "ok");
      revealed = true;
      renderScore();
      setTimeout(newQuestion, 900);
      return;
    }
    quiz.streak = 0;
    setFeedback("Not quite — it is " + fmt(current.h, current.m) + ", " + words(current.h, current.m) + ".", "bad");
    revealed = true;
    renderScore();
  }

  function reveal() {
    if (!current || revealed) return;
    quiz.asked++;
    quiz.streak = 0;
    revealed = true;
    setFeedback(fmt(current.h, current.m) + " — " + words(current.h, current.m) + ".", "");
    renderScore();
  }

  function renderLevels() {
    var box = $("ttLevels");
    box.innerHTML = "";
    LEVELS.forEach(function (L, i) {
      var b = document.createElement("button");
      b.className = "chip" + (i === level ? " active" : "");
      b.textContent = L.key;
      b.title = L.note;
      b.addEventListener("click", function () {
        level = i;
        renderLevels();
        $("ttLevelNote").textContent = LEVELS[level].note + ".";
        newQuestion();
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

  function sheetFoot(sheet, answers, keyClocks) {
    var ans = document.createElement("div");
    ans.className = "ws-answers";
    var h = document.createElement("h3");
    h.textContent = "Answer key";
    ans.appendChild(h);
    if (keyClocks) {
      var kg = document.createElement("div");
      kg.className = "tt-keygrid";
      answers.forEach(function (a) {
        var d = document.createElement("div");
        d.className = "item";
        d.innerHTML = clockSVG(a.t);
        var l = document.createElement("div");
        l.className = "lbl";
        l.textContent = a.n + ") " + fmt(a.t.h, a.t.m);
        d.appendChild(l);
        kg.appendChild(d);
      });
      ans.appendChild(kg);
    } else {
      var ag = document.createElement("div");
      ag.className = "ans-grid";
      answers.forEach(function (a) {
        var d = document.createElement("div");
        d.textContent = a.n + ") " + fmt(a.t.h, a.t.m);
        ag.appendChild(d);
      });
      ans.appendChild(ag);
    }
    sheet.appendChild(ans);

    var note = document.createElement("div");
    note.className = "ws-footer-note";
    note.textContent = "Free telling time worksheets · brainvsmath.com/telling-time/";
    sheet.appendChild(note);
  }

  /* kind: "read" = clock drawn, write the time · "draw" = time given, draw the hands */
  function printSet(kind) {
    var sheet = $("ttSheet");
    sheet.innerHTML = "";
    var read = kind === "read";

    sheetHead(
      sheet,
      "Telling Time — " + LEVELS[level].key + (read ? "" : " (draw the hands)"),
      read
        ? "Write the time shown on each clock in the box below it."
        : "Draw the hour hand and the minute hand on each clock to show the time given."
    );

    var grid = document.createElement("div");
    grid.className = "tt-sheet-grid";
    var answers = [];
    for (var i = 0; i < 12; i++) {
      var t = makeTime(level);
      answers.push({ n: i + 1, t: t });
      var item = document.createElement("div");
      item.className = "item";
      item.innerHTML = clockSVG(t, { hands: read });
      var lbl = document.createElement("div");
      lbl.className = "lbl";
      lbl.textContent = read ? (i + 1) + ")  ______ : ______" : (i + 1) + ")  " + fmt(t.h, t.m);
      item.appendChild(lbl);
      grid.appendChild(item);
    }
    sheet.appendChild(grid);

    sheetFoot(sheet, answers, !read);
    sheet.classList.remove("hidden");
    setTimeout(function () { window.print(); }, 150);
  }

  /* ---------- wire up ---------- */
  $("ttCheck").addEventListener("click", check);
  $("ttShow").addEventListener("click", reveal);
  $("ttNew").addEventListener("click", newQuestion);
  $("ttInput").addEventListener("keydown", function (e) {
    if (e.key !== "Enter") return;
    if (revealed) newQuestion(); else check();
  });
  $("ttPrintRead").addEventListener("click", function () { printSet("read"); });
  $("ttPrintDraw").addEventListener("click", function () { printSet("draw"); });

  renderLevels();
  $("ttLevelNote").textContent = LEVELS[level].note + ".";
  renderScore();
  newQuestion();

  /* QA handle */
  window.__BVM_TT = {
    make: makeTime, fmt: fmt, words: words, parse: parseAnswer, svg: clockSVG, LEVELS: LEVELS
  };
})();
