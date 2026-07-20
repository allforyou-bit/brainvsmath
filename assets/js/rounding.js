/* ============================================================
   Rounding practice — generator + step-by-step explainer
   + printable set of 12. Round to the nearest 10 / 100 / 1000.
   ============================================================ */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };

  var LEVELS = [
    { key: "Nearest 10", place: 10, lo: 15, hi: 989, note: "2–3 digit numbers, round to the nearest ten" },
    { key: "Nearest 100", place: 100, lo: 140, hi: 9899, note: "3–4 digit numbers, round to the nearest hundred" },
    { key: "Nearest 1000", place: 1000, lo: 1400, hi: 98999, note: "4–5 digit numbers, round to the nearest thousand" }
  ];
  var level = 0;
  var current = null; // { n, place }

  var PLACE_NAME = { 10: "tens", 100: "hundreds", 1000: "thousands" };
  var RIGHT_NAME = { 10: "ones", 100: "tens", 1000: "hundreds" };

  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }

  function makeProblem(lv) {
    var L = LEVELS[lv];
    var n;
    do { n = ri(L.lo, L.hi); } while (n % L.place === 0); // skip trivial already-round numbers
    return { n: n, place: L.place };
  }

  /* core: round n to the nearest `place` (round-half-up), with the digits used to decide */
  function solve(n, place) {
    var roundDigit = Math.floor(n / place) % 10;        // digit in the rounding place
    var rightDigit = Math.floor(n / (place / 10)) % 10; // digit immediately to its right
    var result = Math.round(n / place) * place;         // round-half-up (matches rightDigit >= 5)
    return {
      result: result,
      roundDigit: roundDigit,
      rightDigit: rightDigit,
      up: rightDigit >= 5
    };
  }

  function renderProblem() {
    current = makeProblem(level);
    $("rdProblem").textContent = "Round " + current.n.toLocaleString() +
      " to the nearest " + LEVELS[level].place.toLocaleString();
    $("rdSolutionCard").classList.add("hidden");
    $("rdSheet").classList.add("hidden");
  }

  function reveal() {
    if (!current) return;
    var s = solve(current.n, current.place);
    var pn = PLACE_NAME[current.place];
    var rn = RIGHT_NAME[current.place];

    $("rdAnswer").innerHTML = "";
    var lab = document.createElement("span");
    lab.className = "ld-eqlabel";
    lab.textContent = current.n.toLocaleString() + " →";
    var big = document.createElement("span");
    big.className = "ld-quotient";
    big.textContent = s.result.toLocaleString();
    $("rdAnswer").appendChild(lab);
    $("rdAnswer").appendChild(big);

    var ol = $("rdSteps");
    ol.innerHTML = "";
    var lines = [
      "Find the " + pn + " digit of " + current.n.toLocaleString() + ": it is " + s.roundDigit + ".",
      "Look at the digit just to its right (the " + rn + " place): " + s.rightDigit + ".",
      s.up
        ? s.rightDigit + " is 5 or more, so round up — add one to the " + pn + " digit."
        : s.rightDigit + " is less than 5, so round down — keep the " + pn + " digit.",
      "Set every digit to the right of the " + pn + " place to zero → " + s.result.toLocaleString() + "."
    ];
    lines.forEach(function (t) {
      var li = document.createElement("li");
      li.textContent = t;
      ol.appendChild(li);
    });

    $("rdSolutionCard").classList.remove("hidden");
  }

  function printSet() {
    var sheet = $("rdSheet");
    sheet.innerHTML = "";
    var head = document.createElement("div");
    head.className = "ws-head";
    var t = document.createElement("div"); t.className = "t";
    t.textContent = "Rounding Practice — " + LEVELS[level].key;
    head.appendChild(t);
    var bl = document.createElement("div"); bl.className = "blanks";
    bl.textContent = "Name: ____________________   Date: ____________   Score: ____ / 12";
    head.appendChild(bl);
    sheet.appendChild(head);

    var grid = document.createElement("div");
    grid.className = "ws-problems";
    grid.style.gridTemplateColumns = "repeat(3, 1fr)";
    var answers = [];
    for (var i = 0; i < 12; i++) {
      var p = makeProblem(level);
      var s = solve(p.n, p.place);
      answers.push((i + 1) + ") " + s.result.toLocaleString());
      var d = document.createElement("div");
      d.className = "prob";
      var n = document.createElement("span"); n.className = "n"; n.textContent = (i + 1) + ")";
      d.appendChild(n);
      d.appendChild(document.createTextNode(p.n.toLocaleString() + " = ______"));
      grid.appendChild(d);
    }
    sheet.appendChild(grid);

    var cap = document.createElement("div");
    cap.className = "muted";
    cap.style.cssText = "font-size:.8rem;color:#555;margin:.4rem 0 0";
    cap.textContent = "Round each number to the nearest " + LEVELS[level].place.toLocaleString() + ".";
    sheet.insertBefore(cap, grid);

    var ans = document.createElement("div");
    ans.className = "ws-answers";
    var h = document.createElement("h3"); h.textContent = "Answer key"; ans.appendChild(h);
    var ag = document.createElement("div"); ag.className = "ans-grid";
    answers.forEach(function (a) { var d = document.createElement("div"); d.textContent = a; ag.appendChild(d); });
    ans.appendChild(ag);
    sheet.appendChild(ans);

    var note = document.createElement("div");
    note.className = "ws-footer-note";
    note.textContent = "Free rounding practice · brainvsmath.com/rounding/";
    sheet.appendChild(note);

    sheet.classList.remove("hidden");
    setTimeout(function () { window.print(); }, 120);
  }

  function renderLevels() {
    var box = $("rdLevels");
    box.innerHTML = "";
    LEVELS.forEach(function (L, i) {
      var b = document.createElement("button");
      b.className = "chip" + (i === level ? " active" : "");
      b.textContent = L.key;
      b.title = L.note;
      b.addEventListener("click", function () { level = i; renderLevels(); renderProblem(); });
      box.appendChild(b);
    });
  }

  $("rdNew").addEventListener("click", renderProblem);
  $("rdReveal").addEventListener("click", reveal);
  $("rdPrint").addEventListener("click", printSet);

  renderLevels();
  renderProblem();

  /* QA handle */
  window.__BVM_RD = { solve: solve, make: makeProblem };
})();
