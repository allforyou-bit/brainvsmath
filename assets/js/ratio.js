/* ============================================================
   Ratio & proportion — simplify any ratio, solve a proportion
   for its missing term, share an amount in a ratio, and print
   worksheets with answer keys.

   Ratios are held as integer term arrays. Decimal input is
   scaled up by a power of ten before anything is divided, so
   0.25 : 0.75 reduces to 1 : 3 exactly rather than by luck.
   ============================================================ */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };

  var SEG_COLORS = ["var(--cyan)", "var(--pink)", "var(--gold)", "var(--green)", "var(--red)"];

  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = a % b; a = b; b = t; } return a; }
  function gcdAll(arr) { return arr.reduce(function (g, n) { return gcd(g, n); }, 0); }

  /* trim a float to at most `p` decimals without trailing zeros */
  function trim(n, p) {
    if (!isFinite(n)) return "—";
    var s = n.toFixed(p == null ? 4 : p);
    if (s.indexOf(".") >= 0) s = s.replace(/0+$/, "").replace(/\.$/, "");
    return s;
  }
  function decimals(str) {
    var i = str.indexOf(".");
    return i < 0 ? 0 : str.length - i - 1;
  }

  /* ---------- parsing ----------
     "8:12", "8 / 12", "8 to 12", "3:4:5", "0.25 : 0.75" all work */
  function parseRatio(str, maxTerms) {
    var raw = String(str).toLowerCase().replace(/\s+to\s+/g, ":").replace(/[\/,]/g, ":");
    var parts = raw.split(":").map(function (s) { return s.trim(); }).filter(function (s) { return s !== ""; });
    if (parts.length < 2) return null;
    if (maxTerms && parts.length > maxTerms) return null;
    var d = 0, vals = [];
    for (var i = 0; i < parts.length; i++) {
      if (!/^\d*\.?\d+$/.test(parts[i])) return null;
      var v = parseFloat(parts[i]);
      if (!isFinite(v) || v <= 0) return null;
      d = Math.max(d, decimals(parts[i]));
      vals.push(parts[i]);
    }
    var scale = Math.pow(10, d);
    var ints = vals.map(function (s) { return Math.round(parseFloat(s) * scale); });
    if (ints.some(function (n) { return n <= 0 || n > 1e12; })) return null;
    return ints;
  }

  /* ---------- reducing ---------- */
  function simplify(ints) {
    var g = gcdAll(ints) || 1;
    return { terms: ints.map(function (n) { return n / g; }), gcd: g };
  }
  function show(terms) { return terms.join(" : "); }

  /* ---------- tool 1: simplify a ratio ---------- */
  function doSimplify() {
    var out = $("rtSimpOut");
    var ints = parseRatio($("rtSimpInput").value, 6);
    if (!ints) {
      out.innerHTML = '<p class="rt-error">Write the ratio with a colon between the terms — ' +
        '<code>8 : 12</code> or <code>3 : 4 : 5</code>. Every term has to be a positive number.</p>';
      return;
    }
    var s = simplify(ints);
    var total = s.terms.reduce(function (a, b) { return a + b; }, 0);
    var first = s.terms[0];
    var unit = s.terms.map(function (n) { return trim(n / first, 3); }).join(" : ");
    var pct = s.terms.map(function (n) { return trim(n / total * 100, 1) + "%"; }).join(" : ");

    var html = '<div class="rt-answer">' + show(s.terms) + "</div>";
    html += '<p class="rt-why">';
    if (s.gcd > 1) {
      html += "The greatest common factor of " + ints.join(", ") + " is <strong>" + s.gcd +
        "</strong>, so every term divides by " + s.gcd + ".";
    } else if (ints.join(":") !== s.terms.join(":")) {
      html += "Scaled up to whole numbers first, then reduced — the terms share no factor after that.";
    } else {
      html += "The terms share no common factor, so this ratio is already in its simplest form.";
    }
    html += "</p>";

    html += '<div class="rt-bar" role="img" aria-label="The ratio ' + show(s.terms) + ' drawn to scale">';
    s.terms.forEach(function (n, i) {
      html += '<span class="rt-seg" style="flex:' + n + ';background:' + SEG_COLORS[i % SEG_COLORS.length] + '">' + n + "</span>";
    });
    html += "</div>";

    html += '<div class="pc-facts">';
    html += '<div class="pc-fact"><span class="k">Total parts</span><span class="v">' + total + "</span></div>";
    if (s.terms.length === 2) {
      html += '<div class="pc-fact"><span class="k">As a fraction</span><span class="v">' + s.terms[0] + "/" + s.terms[1] + "</span></div>";
      html += '<div class="pc-fact"><span class="k">As a decimal</span><span class="v">' + trim(s.terms[0] / s.terms[1], 4) + "</span></div>";
    }
    html += '<div class="pc-fact"><span class="k">Starting at 1</span><span class="v">' + unit + "</span></div>";
    html += '<div class="pc-fact"><span class="k">Share of the whole</span><span class="v">' + pct + "</span></div>";
    html += "</div>";

    html += '<table class="rt-table"><caption>Equivalent ratios</caption><tbody>';
    for (var m = 1; m <= 8; m++) {
      html += "<tr><th>×" + m + "</th><td>" +
        s.terms.map(function (n) { return n * m; }).join(" : ") + "</td></tr>";
    }
    html += "</tbody></table>";

    out.innerHTML = html;
  }

  /* ---------- tool 2: solve a proportion ----------
     a : b = c : d, exactly one box left empty */
  var PROP_IDS = ["rtPa", "rtPb", "rtPc", "rtPd"];
  var PROP_NAMES = ["A", "B", "C", "D"];

  function readProp() {
    var vals = [], blanks = [];
    for (var i = 0; i < 4; i++) {
      var t = $(PROP_IDS[i]).value.trim();
      if (t === "") { vals.push(null); blanks.push(i); continue; }
      if (!/^\d*\.?\d+$/.test(t)) return { error: "Box " + PROP_NAMES[i] + " is not a number." };
      var v = parseFloat(t);
      if (!isFinite(v) || v <= 0) return { error: "Every number has to be greater than zero." };
      vals.push(v);
    }
    if (blanks.length === 0) return { error: "Leave one box empty — that is the one being solved for." };
    if (blanks.length > 1) return { error: "Fill in three of the four boxes and leave exactly one empty." };
    return { vals: vals, missing: blanks[0] };
  }

  function doProportion() {
    var out = $("rtPropOut");
    var r = readProp();
    if (r.error) { out.innerHTML = '<p class="rt-error">' + r.error + "</p>"; return; }

    var v = r.vals, k = r.missing, ans, work;
    /* a/b = c/d  ⇒  a·d = b·c */
    if (k === 3) { ans = v[1] * v[2] / v[0]; work = "d = (b × c) ÷ a = (" + trim(v[1]) + " × " + trim(v[2]) + ") ÷ " + trim(v[0]); }
    else if (k === 2) { ans = v[0] * v[3] / v[1]; work = "c = (a × d) ÷ b = (" + trim(v[0]) + " × " + trim(v[3]) + ") ÷ " + trim(v[1]); }
    else if (k === 1) { ans = v[0] * v[3] / v[2]; work = "b = (a × d) ÷ c = (" + trim(v[0]) + " × " + trim(v[3]) + ") ÷ " + trim(v[2]); }
    else { ans = v[1] * v[2] / v[3]; work = "a = (b × c) ÷ d = (" + trim(v[1]) + " × " + trim(v[2]) + ") ÷ " + trim(v[3]); }

    if (!isFinite(ans)) { out.innerHTML = '<p class="rt-error">That proportion cannot be solved — check for a zero.</p>'; return; }

    var full = v.slice();
    full[k] = ans;
    var shown = full.map(function (n) { return trim(n, 4); });

    var html = '<div class="rt-answer">' + PROP_NAMES[k].toLowerCase() + " = " + trim(ans, 4) + "</div>";
    html += '<p class="rt-why">' + shown[0] + " : " + shown[1] + " = " + shown[2] + " : " + shown[3] + "</p>";
    html += '<ol class="steps-list rt-steps">';
    html += "<li>Write it as two fractions: <strong>a/b = c/d</strong>.</li>";
    html += "<li>Cross multiply: <strong>a × d = b × c</strong>.</li>";
    html += "<li>Rearrange for the empty box: <strong>" + work + "</strong>.</li>";
    html += "<li>That gives <strong>" + PROP_NAMES[k].toLowerCase() + " = " + trim(ans, 4) + "</strong>.</li>";
    html += "</ol>";
    html += '<p class="formula">Check: ' + trim(full[0], 4) + " × " + trim(full[3], 4) + " = " +
      trim(full[0] * full[3], 4) + " and " + trim(full[1], 4) + " × " + trim(full[2], 4) + " = " +
      trim(full[1] * full[2], 4) + " — the cross products match.</p>";

    out.innerHTML = html;
  }

  /* ---------- tool 3: share an amount in a ratio ---------- */
  function doShare() {
    var out = $("rtShareOut");
    var amtRaw = $("rtShareAmount").value.trim();
    if (!/^\d*\.?\d+$/.test(amtRaw)) {
      out.innerHTML = '<p class="rt-error">Write the amount to share as a plain number, like <code>240</code>.</p>';
      return;
    }
    var amount = parseFloat(amtRaw);
    var ints = parseRatio($("rtShareRatio").value, 6);
    if (!isFinite(amount) || amount <= 0 || !ints) {
      out.innerHTML = '<p class="rt-error">Check both boxes — an amount above zero, and a ratio like <code>3 : 5</code>.</p>';
      return;
    }
    var s = simplify(ints);
    var total = s.terms.reduce(function (a, b) { return a + b; }, 0);
    var one = amount / total;
    var vals = s.terms.map(function (n) { return n * one; });
    var exact = vals.every(function (x) { return Math.abs(x * 100 - Math.round(x * 100)) < 1e-9; });

    var html = '<div class="rt-answer">' + vals.map(function (x) { return trim(x, 2); }).join("  ·  ") + "</div>";
    html += '<p class="rt-why">' + trim(amount, 2) + " split in the ratio " + show(s.terms) +
      " — that is <strong>" + total + " equal parts</strong>, each one worth " + trim(one, 4) + ".</p>";

    html += '<div class="rt-bar" role="img" aria-label="The shares drawn to scale">';
    s.terms.forEach(function (n, i) {
      html += '<span class="rt-seg" style="flex:' + n + ';background:' + SEG_COLORS[i % SEG_COLORS.length] + '">' +
        trim(vals[i], 2) + "</span>";
    });
    html += "</div>";

    html += '<table class="rt-table"><tbody>';
    s.terms.forEach(function (n, i) {
      html += "<tr><th>Share " + (i + 1) + "</th><td>" + n + " of " + total + " parts &nbsp;→&nbsp; <strong>" +
        trim(vals[i], 2) + "</strong> &nbsp;<span class=\"muted\">(" + trim(n / total * 100, 1) + "%)</span></td></tr>";
    });
    html += "</tbody></table>";
    if (!exact) {
      html += '<p class="rt-why">' + trim(amount, 2) + " does not divide into " + total +
        " parts evenly, so the shares above are rounded to two decimals. The exact value of one part is " +
        amount + "/" + total + ".</p>";
    }
    out.innerHTML = html;
  }

  /* ---------- worksheet generators ---------- */
  var COPRIME = [[1, 2], [1, 3], [1, 4], [1, 5], [1, 6], [2, 3], [2, 5], [2, 7], [2, 9],
                 [3, 4], [3, 5], [3, 7], [3, 8], [4, 5], [4, 7], [4, 9], [5, 6], [5, 7],
                 [5, 8], [5, 9], [6, 7], [7, 8], [7, 9], [8, 9], [9, 10]];

  function pickPair() {
    var p = COPRIME[Math.floor(Math.random() * COPRIME.length)];
    return Math.random() < .5 ? [p[0], p[1]] : [p[1], p[0]];
  }

  function genSimplify() {
    var p = pickPair(), k = ri(2, 9);
    return { q: (p[0] * k) + " : " + (p[1] * k), a: p[0] + " : " + p[1], sub: "÷ " + k };
  }

  function genProportion() {
    var p = pickPair(), m = ri(2, 9), t = ri(0, 3);
    var terms = [p[0], p[1], p[0] * m, p[1] * m];
    var ans = terms[t];
    var shown = terms.map(function (n, i) { return i === t ? "____" : String(n); });
    return {
      q: shown[0] + " : " + shown[1] + "  =  " + shown[2] + " : " + shown[3],
      a: String(ans),
      sub: "cross multiply"
    };
  }

  var SHARE_UNITS = [
    { pre: "$", label: "" }, { pre: "", label: " sweets" }, { pre: "", label: " marbles" },
    { pre: "", label: " minutes" }, { pre: "$", label: "" }, { pre: "", label: " cards" }
  ];

  function genShare() {
    var p = pickPair();
    if (p[0] === 1 && p[1] === 1) p = [2, 3];
    var total = p[0] + p[1], unit = ri(3, 20) * (Math.random() < .5 ? 1 : 5);
    var amount = total * unit;
    var u = SHARE_UNITS[Math.floor(Math.random() * SHARE_UNITS.length)];
    return {
      q: "Share " + u.pre + amount + u.label + " in the ratio " + p[0] + " : " + p[1] + ".",
      a: u.pre + (p[0] * unit) + " and " + u.pre + (p[1] * unit),
      sub: total + " parts of " + u.pre + unit
    };
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
    ag.className = "rt-anskey";
    rows.forEach(function (r, i) {
      var d = document.createElement("div");
      d.innerHTML = "<strong>" + (i + 1) + ") " + r.a + "</strong> &nbsp;<span>" + r.sub + "</span>";
      ag.appendChild(d);
    });
    ans.appendChild(ag);
    sheet.appendChild(ans);

    var note = document.createElement("div");
    note.className = "ws-footer-note";
    note.textContent = "Free ratio worksheets · brainvsmath.com/ratio-calculator/";
    sheet.appendChild(note);
  }

  function buildSheet(title, instruction, gen, gridClass) {
    var sheet = $("rtSheet");
    sheet.innerHTML = "";
    sheetHead(sheet, title, instruction);

    var grid = document.createElement("div");
    grid.className = gridClass;
    var rows = [];
    for (var i = 0; i < 12; i++) {
      var p = gen();
      rows.push(p);
      var item = document.createElement("div");
      item.className = "item";
      item.innerHTML = '<div class="q">' + (i + 1) + ")</div>" +
        '<div class="body">' + p.q + "</div>" +
        '<div class="lbl">____________________</div>';
      grid.appendChild(item);
    }
    sheet.appendChild(grid);
    sheetFoot(sheet, rows);
    sheet.classList.remove("hidden");
    setTimeout(function () { window.print(); }, 150);
  }

  /* ---------- wire up ---------- */
  $("rtSimpGo").addEventListener("click", doSimplify);
  $("rtSimpInput").addEventListener("keydown", function (e) { if (e.key === "Enter") doSimplify(); });
  $("rtSimpDice").addEventListener("click", function () {
    var p = pickPair(), k = ri(2, 12);
    $("rtSimpInput").value = (p[0] * k) + " : " + (p[1] * k);
    doSimplify();
  });

  $("rtPropGo").addEventListener("click", doProportion);
  PROP_IDS.forEach(function (id) {
    $(id).addEventListener("keydown", function (e) { if (e.key === "Enter") doProportion(); });
  });
  $("rtPropDice").addEventListener("click", function () {
    var p = pickPair(), m = ri(2, 9), t = ri(0, 3);
    var terms = [p[0], p[1], p[0] * m, p[1] * m];
    PROP_IDS.forEach(function (id, i) { $(id).value = i === t ? "" : String(terms[i]); });
    doProportion();
  });

  $("rtShareGo").addEventListener("click", doShare);
  ["rtShareAmount", "rtShareRatio"].forEach(function (id) {
    $(id).addEventListener("keydown", function (e) { if (e.key === "Enter") doShare(); });
  });
  $("rtShareDice").addEventListener("click", function () {
    var p = pickPair(), unit = ri(3, 20) * 5;
    $("rtShareAmount").value = String((p[0] + p[1]) * unit);
    $("rtShareRatio").value = p[0] + " : " + p[1];
    doShare();
  });

  $("rtPrintSimplify").addEventListener("click", function () {
    buildSheet("Simplifying Ratios", "Write each ratio in its simplest form.", genSimplify, "rt-sheet-grid");
  });
  $("rtPrintProportion").addEventListener("click", function () {
    buildSheet("Solving Proportions", "Find the missing term in each proportion.", genProportion, "rt-sheet-grid wide");
  });
  $("rtPrintShare").addEventListener("click", function () {
    buildSheet("Sharing in a Given Ratio", "Share each amount in the ratio given.", genShare, "rt-share-grid");
  });

  /* first paint */
  doSimplify();
  doProportion();
  doShare();

  /* QA handle */
  window.__BVM_RATIO = {
    parse: parseRatio, simplify: simplify, gcd: gcd, trim: trim,
    genSimplify: genSimplify, genProportion: genProportion, genShare: genShare
  };
})();
