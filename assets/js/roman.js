/* ============================================================
   Roman numerals — two-way converter with the build shown,
   a practice quiz and a printable reference + worksheet.
   Standard form only: 1–3999, subtractive pairs, no zero.
   ============================================================ */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };

  var MAXV = 3999;

  var TABLE = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"],
    [100, "C"], [90, "XC"], [50, "L"], [40, "XL"],
    [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]
  ];

  var VAL = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };

  /* canonical (standard) Roman form — the only form this site teaches */
  var CANON = /^M{0,3}(CM|CD|D?C{0,3})(XC|XL|L?X{0,3})(IX|IV|V?I{0,3})$/;

  /* ---------- conversion ---------- */

  /* [[value, symbol], ...] in the order they are written */
  function toParts(n) {
    var out = [];
    TABLE.forEach(function (row) {
      while (n >= row[0]) { out.push(row); n -= row[0]; }
    });
    return out;
  }

  function toRoman(n) {
    return toParts(n).map(function (p) { return p[1]; }).join("");
  }

  /* loose reading: handles non-standard spellings such as IIII or IC */
  function fromRoman(s) {
    var total = 0;
    for (var i = 0; i < s.length; i++) {
      var v = VAL[s.charAt(i)];
      if (!v) return null;
      var next = VAL[s.charAt(i + 1)] || 0;
      total += v < next ? -v : v;
    }
    return total;
  }

  function isStandard(s) { return s !== "" && CANON.test(s); }

  /* split a standard numeral into the pieces it is built from */
  function tokens(s) {
    var out = [], i = 0;
    while (i < s.length) {
      var two = s.substr(i, 2);
      var hit = null;
      TABLE.forEach(function (row) { if (row[1] === two) hit = row; });
      if (hit) { out.push(hit); i += 2; continue; }
      var one = s.charAt(i);
      TABLE.forEach(function (row) { if (row[1] === one) hit = row; });
      out.push(hit || [VAL[one] || 0, one]);
      i += 1;
    }
    return out;
  }

  function normalise(raw) {
    return String(raw).toUpperCase().replace(/[^A-Z0-9]/g, "");
  }

  function fmt(n) { return n.toLocaleString("en-US"); }

  /* ---------- rendering ---------- */

  function setSteps(lines) {
    var ol = $("rnSteps");
    ol.innerHTML = "";
    lines.forEach(function (t) {
      var li = document.createElement("li");
      li.innerHTML = t;
      ol.appendChild(li);
    });
  }

  function fact(label, value) {
    var d = document.createElement("div");
    d.className = "pc-fact";
    var k = document.createElement("span"); k.className = "k"; k.textContent = label;
    var v = document.createElement("span"); v.className = "v"; v.textContent = value;
    d.appendChild(k); d.appendChild(v);
    return d;
  }

  function showMessage(text) {
    $("rnVerdict").className = "pc-verdict";
    $("rnVerdict").textContent = text;
    $("rnResult").classList.remove("hidden");
    $("rnDetail").classList.add("hidden");
    $("rnNote").classList.add("hidden");
  }

  function renderParts(parts, total) {
    var box = $("rnParts");
    box.innerHTML = "";
    var running = 0;
    parts.forEach(function (p) {
      running += p[0];
      var d = document.createElement("div");
      d.className = "rn-part";
      var s = document.createElement("span"); s.className = "sym"; s.textContent = p[1];
      var v = document.createElement("span"); v.className = "val"; v.textContent = fmt(p[0]);
      d.appendChild(s); d.appendChild(v);
      d.title = p[1] + " = " + fmt(p[0]) + " (running total " + fmt(running) + ")";
      box.appendChild(d);
    });
    var eq = document.createElement("div");
    eq.className = "rn-part sum";
    var es = document.createElement("span"); es.className = "sym"; es.textContent = "=";
    var ev = document.createElement("span"); ev.className = "val"; ev.textContent = fmt(total);
    eq.appendChild(es); eq.appendChild(ev);
    box.appendChild(eq);
  }

  function note(html) {
    var el = $("rnNote");
    if (!html) { el.classList.add("hidden"); return; }
    el.innerHTML = html;
    el.classList.remove("hidden");
  }

  /* ---------- the converter ---------- */

  function convert(raw) {
    var clean = normalise(raw);
    if (clean === "") { showMessage("Type a number (1–3999) or a Roman numeral."); return; }

    var digits = /^[0-9]+$/.test(clean);
    var letters = /^[IVXLCDM]+$/.test(clean);

    if (!digits && !letters) {
      showMessage("Use digits (like 2026) or the seven Roman letters I V X L C D M.");
      return;
    }

    $("rnResult").classList.remove("hidden");
    $("rnDetail").classList.remove("hidden");
    $("rnVerdict").className = "pc-verdict yes";

    if (digits) {
      var n = Number(clean);
      if (n < 1 || n > MAXV) {
        showMessage(n === 0
          ? "Roman numerals have no symbol for zero."
          : "Standard Roman numerals cover 1 to 3,999.");
        setSteps(n === 0
          ? ["Roman arithmetic was built for counting and tallying, where a symbol for nothing was never needed. Zero reached Europe with the Hindu-Arabic digits centuries later.",
             "This is one reason Roman numerals are unusable for written calculation: without a zero there is no place value, so columns cannot line up."]
          : ["Only three M's may be written in a row, which caps the standard system at MMMCMXCIX = 3,999.",
             "Larger values used a <strong>vinculum</strong> — a bar over a numeral multiplying it by 1,000, so V̄ meant 5,000. The bar is not part of the standard set taught in school, so this converter stops at 3,999."]);
        $("rnResult").classList.remove("hidden");
        $("rnDetail").classList.remove("hidden");
        $("rnParts").innerHTML = "";
        $("rnFacts").innerHTML = "";
        return;
      }

      var roman = toRoman(n);
      var parts = toParts(n);
      $("rnVerdict").textContent = fmt(n) + " = " + roman;
      renderParts(parts, n);

      var subs = parts.filter(function (p) { return p[1].length === 2; });
      var box = $("rnFacts");
      box.innerHTML = "";
      box.appendChild(fact("Roman", roman));
      box.appendChild(fact("Letters", String(roman.length)));
      box.appendChild(fact("Pieces", String(parts.length)));
      box.appendChild(fact("Subtractive pairs", String(subs.length)));

      var lines = [];
      lines.push("Work from the largest value down. Take out as many <strong>M</strong> (1,000) as fit, then D, C, L, X, V and I in turn — " +
        parts.map(function (p) { return p[1] + " = " + fmt(p[0]); }).join(", ") + ".");
      if (subs.length) {
        lines.push("The pieces " + subs.map(function (p) { return "<strong>" + p[1] + "</strong>"; }).join(" and ") +
          " are <strong>subtractive</strong>: a smaller letter in front of a bigger one means subtract, so " +
          subs.map(function (p) { return p[1] + " = " + fmt(p[0]); }).join(" and ") +
          ". They exist so no letter has to be written four times.");
      } else {
        lines.push("No subtractive pair is needed here — every piece is written in plain descending order, largest first.");
      }
      lines.push("Reading it back adds the pieces up: " +
        parts.map(function (p) { return fmt(p[0]); }).join(" + ") + " = <strong>" + fmt(n) + "</strong>.");
      setSteps(lines);
      note("");
      return;
    }

    /* letters → number */
    var value = fromRoman(clean);
    if (value === null || value < 1) {
      showMessage("That is not a readable Roman numeral.");
      return;
    }
    if (value > MAXV) {
      showMessage(clean + " reads as " + fmt(value) + " — above the 3,999 standard limit.");
      return;
    }

    var std = isStandard(clean);
    var canon = toRoman(value);
    var tk = tokens(std ? clean : canon);

    $("rnVerdict").textContent = clean + " = " + fmt(value);
    renderParts(tk, value);

    var fbox = $("rnFacts");
    fbox.innerHTML = "";
    fbox.appendChild(fact("Number", fmt(value)));
    fbox.appendChild(fact("Standard form", canon));
    fbox.appendChild(fact("Letters", String(clean.length)));
    fbox.appendChild(fact("Written correctly", std ? "Yes" : "No"));

    var out = [];
    out.push("Read the numeral left to right and add each piece: " +
      tk.map(function (p) { return p[1] + " (" + fmt(p[0]) + ")"; }).join(" + ") + ".");
    var sb = tk.filter(function (p) { return p[1].length === 2; });
    if (sb.length) {
      out.push("Where a smaller letter sits in front of a larger one you <strong>subtract</strong> instead: " +
        sb.map(function (p) { return p[1] + " = " + fmt(p[0]); }).join(", ") + ".");
    }
    out.push("Total: " + tk.map(function (p) { return fmt(p[0]); }).join(" + ") + " = <strong>" + fmt(value) + "</strong>.");
    setSteps(out);

    note(std ? "" : "<strong>" + clean + "</strong> is readable but not standard form. " +
      "The usual spelling of " + fmt(value) + " is <strong>" + canon + "</strong> — only I, X, C and M may repeat, " +
      "at most three times, and only I, X and C may be subtracted, from the next two larger symbols.");
  }

  /* ---------- reference chart ---------- */

  var CHART = [
    [1, "I"], [2, "II"], [3, "III"], [4, "IV"], [5, "V"], [6, "VI"], [7, "VII"], [8, "VIII"], [9, "IX"], [10, "X"],
    [11, "XI"], [12, "XII"], [13, "XIII"], [14, "XIV"], [15, "XV"], [16, "XVI"], [17, "XVII"], [18, "XVIII"], [19, "XIX"], [20, "XX"],
    [30, "XXX"], [40, "XL"], [50, "L"], [60, "LX"], [70, "LXX"], [80, "LXXX"], [90, "XC"], [100, "C"],
    [200, "CC"], [300, "CCC"], [400, "CD"], [500, "D"], [600, "DC"], [700, "DCC"], [800, "DCCC"], [900, "CM"],
    [1000, "M"], [2000, "MM"], [3000, "MMM"], [2026, "MMXXVI"]
  ];

  function renderChart() {
    var grid = $("rnChart");
    grid.innerHTML = "";
    CHART.forEach(function (row) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "rn-cell";
      var n = document.createElement("span"); n.className = "n"; n.textContent = fmt(row[0]);
      var r = document.createElement("span"); r.className = "r"; r.textContent = row[1];
      b.appendChild(n); b.appendChild(r);
      b.title = "Convert " + row[0];
      b.addEventListener("click", function () {
        $("rnInput").value = row[0];
        convert(row[0]);
        $("rnResult").scrollIntoView({ block: "center" });
      });
      grid.appendChild(b);
    });
  }

  /* ---------- practice quiz ---------- */

  var quiz = { dir: "mixed", max: 100, n: 1, ask: "toRoman", score: 0, asked: 0, streak: 0, best: 0 };

  try { quiz.best = parseInt(localStorage.getItem("bvm_roman_best"), 10) || 0; } catch (e) { quiz.best = 0; }

  function newQuestion() {
    quiz.n = 1 + Math.floor(Math.random() * quiz.max);
    quiz.ask = quiz.dir === "mixed" ? (Math.random() < 0.5 ? "toRoman" : "toNumber") : quiz.dir;

    var prompt = $("rnQPrompt"), hint = $("rnQHint");
    if (quiz.ask === "toRoman") {
      prompt.textContent = fmt(quiz.n);
      hint.textContent = "Write this number in Roman numerals.";
      $("rnQInput").setAttribute("inputmode", "text");
      $("rnQInput").setAttribute("aria-label", "Roman numeral for " + quiz.n);
    } else {
      prompt.textContent = toRoman(quiz.n);
      hint.textContent = "Write this numeral as a number.";
      $("rnQInput").setAttribute("inputmode", "numeric");
      $("rnQInput").setAttribute("aria-label", "Number for " + toRoman(quiz.n));
    }
    $("rnQInput").value = "";
    $("rnQFeedback").textContent = "";
    $("rnQFeedback").className = "rn-feedback";
    $("rnQInput").focus();
  }

  function renderScore() {
    $("rnScore").textContent = quiz.score + " / " + quiz.asked;
    $("rnStreak").textContent = String(quiz.streak);
    $("rnBest").textContent = String(quiz.best);
  }

  function checkAnswer() {
    var given = normalise($("rnQInput").value);
    if (given === "") return;
    var expected = quiz.ask === "toRoman" ? toRoman(quiz.n) : String(quiz.n);
    var right = given === expected;

    quiz.asked++;
    if (right) {
      quiz.score++;
      quiz.streak++;
      if (quiz.streak > quiz.best) {
        quiz.best = quiz.streak;
        try { localStorage.setItem("bvm_roman_best", String(quiz.best)); } catch (e) { /* private mode */ }
      }
      $("rnQFeedback").textContent = "Correct — " + fmt(quiz.n) + " = " + toRoman(quiz.n);
      $("rnQFeedback").className = "rn-feedback ok";
      setTimeout(newQuestion, 850);
    } else {
      quiz.streak = 0;
      $("rnQFeedback").textContent = "Not quite — " + fmt(quiz.n) + " = " + toRoman(quiz.n);
      $("rnQFeedback").className = "rn-feedback bad";
    }
    renderScore();
  }

  function renderQuizControls() {
    document.querySelectorAll("[data-dir]").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-dir") === quiz.dir);
    });
    document.querySelectorAll("[data-max]").forEach(function (b) {
      b.classList.toggle("active", Number(b.getAttribute("data-max")) === quiz.max);
    });
  }

  /* ---------- printable sheet ---------- */

  function printSheet() {
    var sheet = $("rnSheet");
    sheet.innerHTML = "";

    var head = document.createElement("div");
    head.className = "ws-head";
    var t = document.createElement("div"); t.className = "t";
    t.textContent = "Roman Numerals — Chart & Practice";
    head.appendChild(t);
    var bl = document.createElement("div"); bl.className = "blanks";
    bl.textContent = "Name: ____________________   Date: ____________   Score: ____ / 12";
    head.appendChild(bl);
    sheet.appendChild(head);

    var cap = document.createElement("div");
    cap.style.cssText = "font-size:.85rem;color:#555;margin:0 0 .7rem";
    cap.textContent = "The seven letters: I = 1, V = 5, X = 10, L = 50, C = 100, D = 500, M = 1000.";
    sheet.appendChild(cap);

    var ref = document.createElement("div");
    ref.style.cssText = "display:grid;grid-template-columns:repeat(5,1fr);gap:.25rem .6rem;font-size:.8rem;margin-bottom:1.1rem;";
    CHART.forEach(function (row) {
      var d = document.createElement("div");
      d.style.cssText = "border-bottom:1px dotted #bbb;padding:.16rem 0;display:flex;justify-content:space-between;gap:.4rem;";
      var a = document.createElement("span"); a.textContent = fmt(row[0]);
      var b = document.createElement("span"); b.style.fontWeight = "700"; b.textContent = row[1];
      d.appendChild(a); d.appendChild(b);
      ref.appendChild(d);
    });
    sheet.appendChild(ref);

    var lead = document.createElement("div");
    lead.style.cssText = "font-size:.85rem;color:#555;margin:0 0 .5rem;border-top:2px dashed #999;padding-top:.7rem";
    lead.textContent = "Fill in the blank — numbers to numerals, numerals to numbers.";
    sheet.appendChild(lead);

    var grid = document.createElement("div");
    grid.className = "ws-problems";
    grid.style.gridTemplateColumns = "repeat(3, 1fr)";
    var answers = [];
    var used = {};
    for (var i = 0; i < 12; i++) {
      var n;
      do { n = 1 + Math.floor(Math.random() * 500); } while (used[n]);
      used[n] = 1;
      var askRoman = i % 2 === 0;
      var d = document.createElement("div");
      d.className = "prob";
      var lab = document.createElement("span"); lab.className = "n"; lab.textContent = (i + 1) + ")";
      d.appendChild(lab);
      d.appendChild(document.createTextNode(
        askRoman ? fmt(n) + " = ______" : toRoman(n) + " = ______"));
      grid.appendChild(d);
      answers.push((i + 1) + ") " + (askRoman ? toRoman(n) : fmt(n)));
    }
    sheet.appendChild(grid);

    var ans = document.createElement("div");
    ans.className = "ws-answers";
    var h = document.createElement("h3"); h.textContent = "Answer key"; ans.appendChild(h);
    var ag = document.createElement("div"); ag.className = "ans-grid";
    answers.forEach(function (a) { var d = document.createElement("div"); d.textContent = a; ag.appendChild(d); });
    ans.appendChild(ag);
    sheet.appendChild(ans);

    var foot = document.createElement("div");
    foot.className = "ws-footer-note";
    foot.textContent = "Free Roman numerals converter · brainvsmath.com/roman-numerals/";
    sheet.appendChild(foot);

    sheet.classList.remove("hidden");
    setTimeout(function () { window.print(); }, 120);
  }

  /* ---------- wiring ---------- */

  $("rnConvert").addEventListener("click", function () { convert($("rnInput").value); });
  $("rnInput").addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); convert($("rnInput").value); }
  });
  $("rnRandom").addEventListener("click", function () {
    var n = 1 + Math.floor(Math.random() * MAXV);
    var asRoman = Math.random() < 0.5;
    $("rnInput").value = asRoman ? toRoman(n) : n;
    convert($("rnInput").value);
  });
  $("rnPrint").addEventListener("click", printSheet);

  document.querySelectorAll("[data-example]").forEach(function (b) {
    b.addEventListener("click", function () {
      var v = b.getAttribute("data-example");
      $("rnInput").value = v;
      convert(v);
    });
  });

  document.querySelectorAll("[data-dir]").forEach(function (b) {
    b.addEventListener("click", function () {
      quiz.dir = b.getAttribute("data-dir");
      renderQuizControls();
      newQuestion();
    });
  });
  document.querySelectorAll("[data-max]").forEach(function (b) {
    b.addEventListener("click", function () {
      quiz.max = Number(b.getAttribute("data-max"));
      renderQuizControls();
      newQuestion();
    });
  });

  $("rnQCheck").addEventListener("click", checkAnswer);
  $("rnQSkip").addEventListener("click", function () {
    quiz.streak = 0;
    renderScore();
    newQuestion();
  });
  $("rnQInput").addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); checkAnswer(); }
  });

  renderChart();
  renderQuizControls();
  renderScore();
  newQuestion();
  convert(2026);

  /* QA handle */
  window.__BVM_RN = {
    toRoman: toRoman, fromRoman: fromRoman, isStandard: isStandard,
    toParts: toParts, tokens: tokens, convert: convert
  };
})();
