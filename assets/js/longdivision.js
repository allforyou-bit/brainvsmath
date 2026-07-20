/* ============================================================
   Long division practice — generator + step-by-step solver
   + printable set of 12. Divide / multiply / subtract / bring down.
   ============================================================ */
(function () {
  "use strict";
  var B = window.BVM;
  var $ = function (id) { return document.getElementById(id); };

  var LEVELS = [
    { key: "Easy", dLo: 2, dHi: 9, qLo: 11, qHi: 99, rem: false, note: "2–3 digits ÷ 1 digit, no remainder" },
    { key: "Medium", dLo: 3, dHi: 9, qLo: 40, qHi: 400, rem: true, note: "3–4 digits ÷ 1 digit, remainders" },
    { key: "Hard", dLo: 12, dHi: 39, qLo: 20, qHi: 300, rem: true, note: "4 digits ÷ 2 digits, remainders" }
  ];
  var level = 0;
  var current = null; // {dividend, divisor}

  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }

  function makeProblem(lv) {
    var L = LEVELS[lv];
    var divisor = ri(L.dLo, L.dHi);
    var quotient = ri(L.qLo, L.qHi);
    var remainder = L.rem ? ri(0, divisor - 1) : 0;
    var dividend = divisor * quotient + remainder;
    return { dividend: dividend, divisor: divisor };
  }

  /* core algorithm — returns quotient, remainder, and per-digit steps */
  function solve(dividend, divisor) {
    var digits = String(dividend).split("");
    var steps = [];
    var rem = 0, qStr = "", started = false;
    for (var i = 0; i < digits.length; i++) {
      var cur = rem * 10 + parseInt(digits[i], 10);
      var q = Math.floor(cur / divisor);
      var product = q * divisor;
      rem = cur - product;
      if (q > 0) started = true;
      if (started) qStr += q;
      steps.push({
        pos: i,
        digit: digits[i],
        cur: cur,
        q: q,
        product: product,
        rem: rem,
        skip: !started && q === 0
      });
    }
    return { quotient: parseInt(qStr || "0", 10), remainder: rem, steps: steps };
  }

  function renderProblem() {
    current = makeProblem(level);
    $("ldProblem").textContent = current.dividend + " ÷ " + current.divisor;
    $("ldSolutionCard").classList.add("hidden");
    $("ldSheet").classList.add("hidden");
  }

  function reveal() {
    if (!current) return;
    var s = solve(current.dividend, current.divisor);
    $("ldAnswer").innerHTML = "";
    var big = document.createElement("span");
    big.className = "ld-quotient";
    big.textContent = s.quotient + (s.remainder ? " R " + s.remainder : "");
    $("ldAnswer").appendChild(big);
    var lab = document.createElement("span");
    lab.className = "ld-eqlabel";
    lab.textContent = current.dividend + " ÷ " + current.divisor + " =";
    $("ldAnswer").insertBefore(lab, big);

    var ol = $("ldSteps");
    ol.innerHTML = "";
    s.steps.forEach(function (st) {
      if (st.skip) return;
      var li = document.createElement("li");
      var bring = st.pos === 0 ? "Take the first digit" + (st.cur >= current.divisor || String(current.dividend).length === 1 ? "" : "s") + ": " + st.cur
        : "Bring down " + st.digit + " → " + st.cur;
      li.textContent = bring + ". " + st.cur + " ÷ " + current.divisor + " = " + st.q +
        " (" + st.q + "×" + current.divisor + " = " + st.product + "), " + st.cur + " − " + st.product + " = " + st.rem + ".";
      ol.appendChild(li);
    });

    $("ldCheck").textContent = "Check: " + s.quotient + " × " + current.divisor +
      (s.remainder ? " + " + s.remainder : "") + " = " + current.dividend + " ✓";
    $("ldSolutionCard").classList.remove("hidden");
  }

  function printSet() {
    var sheet = $("ldSheet");
    sheet.innerHTML = "";
    var head = document.createElement("div");
    head.className = "ws-head";
    var t = document.createElement("div"); t.className = "t";
    t.textContent = "Long Division Practice — " + LEVELS[level].key;
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
      var s = solve(p.dividend, p.divisor);
      answers.push((i + 1) + ") " + s.quotient + (s.remainder ? " R " + s.remainder : ""));
      var d = document.createElement("div");
      d.className = "prob";
      var n = document.createElement("span"); n.className = "n"; n.textContent = (i + 1) + ")";
      d.appendChild(n);
      d.appendChild(document.createTextNode(p.dividend + " ÷ " + p.divisor + " ="));
      grid.appendChild(d);
    }
    sheet.appendChild(grid);

    var ans = document.createElement("div");
    ans.className = "ws-answers";
    var h = document.createElement("h3"); h.textContent = "Answer key"; ans.appendChild(h);
    var ag = document.createElement("div"); ag.className = "ans-grid";
    answers.forEach(function (a) { var d = document.createElement("div"); d.textContent = a; ag.appendChild(d); });
    ans.appendChild(ag);
    sheet.appendChild(ans);

    var note = document.createElement("div");
    note.className = "ws-footer-note";
    note.textContent = "Free long division practice · brainvsmath.com/long-division/";
    sheet.appendChild(note);

    sheet.classList.remove("hidden");
    setTimeout(function () { window.print(); }, 120);
  }

  function renderLevels() {
    var box = $("ldLevels");
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

  $("ldNew").addEventListener("click", renderProblem);
  $("ldReveal").addEventListener("click", reveal);
  $("ldPrint").addEventListener("click", printSet);

  renderLevels();
  renderProblem();

  /* QA handle */
  window.__BVM_LD = { solve: solve, make: makeProblem };
})();
