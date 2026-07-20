/* ============================================================
   Fraction calculator — add / subtract / multiply / divide two
   fractions (optionally mixed numbers), with worked steps.
   ============================================================ */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };
  var op = "+";

  function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { var t = b; b = a % b; a = t; } return a || 1; }

  function intv(id) {
    var v = $(id).value.trim();
    if (v === "") return null;
    var n = parseInt(v, 10);
    return isFinite(n) ? n : NaN;
  }

  /* read one fraction as improper {num, den}; returns null if empty, NaN-flag on bad input */
  function readFrac(wId, nId, dId) {
    var w = intv(wId), n = intv(nId), d = intv(dId);
    if (w === null && n === null && d === null) return null;
    if (w === NaN || n === NaN || d === NaN) return { bad: true };
    w = w || 0;
    if (n === null) n = 0;
    if (d === null) d = 1;
    if (d === 0) return { bad: true, zero: true };
    /* mixed → improper, carrying the sign of the whole part */
    var sign = w < 0 ? -1 : 1;
    var num = Math.abs(w) * Math.abs(d) + Math.abs(n);
    num = sign * num * (n < 0 ? -1 : 1);
    /* if whole is 0 keep numerator's own sign */
    if (w === 0) num = n;
    return { num: num, den: d };
  }

  function simplify(num, den) {
    if (den < 0) { num = -num; den = -den; }
    var g = gcd(num, den);
    return { num: num / g, den: den / g, g: g };
  }

  function fmtImproper(f) { return f.num + "/" + f.den; }

  function fmtMixed(num, den) {
    if (den === 0) return "undefined";
    if (num % den === 0) return String(num / den);
    var whole = (num < 0 ? Math.ceil : Math.floor)(num / den);
    var rem = Math.abs(num - whole * den);
    if (whole === 0) return num + "/" + den;
    return whole + " " + rem + "/" + den;
  }

  function compute() {
    var a = readFrac("w1", "n1", "d1");
    var b = readFrac("w2", "n2", "d2");
    var res = $("fracResult");
    var steps = $("fracSteps");
    steps.innerHTML = "";

    if (!a || !b) { res.textContent = "—"; return; }
    if (a.bad || b.bad) {
      res.textContent = a.zero || b.zero ? "÷0" : "?";
      var li0 = document.createElement("li");
      li0.textContent = (a.zero || b.zero) ? "A denominator can't be zero." : "Enter whole numbers in each box.";
      steps.appendChild(li0);
      return;
    }

    var s = [];
    s.push("Start: " + fmtImproper(a) + " " + op + " " + fmtImproper(b));

    var num, den, headline;
    if (op === "×") {
      num = a.num * b.num; den = a.den * b.den;
      s.push("Multiply across: (" + a.num + "×" + b.num + ") / (" + a.den + "×" + b.den + ") = " + num + "/" + den);
    } else if (op === "÷") {
      num = a.num * b.den; den = a.den * b.num;
      s.push("Keep, change, flip: " + fmtImproper(a) + " × " + b.den + "/" + b.num);
      s.push("Multiply across: " + num + "/" + den);
    } else {
      var cd = a.den * b.den;
      var an = a.num * b.den, bn = b.num * a.den;
      s.push("Common denominator " + cd + ": " + an + "/" + cd + (op === "+" ? " + " : " − ") + bn + "/" + cd);
      num = op === "+" ? an + bn : an - bn;
      den = cd;
      s.push("Combine numerators: " + num + "/" + den);
    }

    if (den === 0) { res.textContent = "undefined"; return; }

    var sim = simplify(num, den);
    if (sim.g > 1 && sim.den !== den) s.push("Simplify by dividing top and bottom by " + sim.g + ": " + fmtImproper(sim));
    else s.push("Already in lowest terms.");

    /* normalize sign for display */
    var dispNum = sim.num, dispDen = sim.den;
    if (dispDen < 0) { dispNum = -dispNum; dispDen = -dispDen; }

    var mixed = fmtMixed(dispNum, dispDen);
    var decimal = (dispNum / dispDen);
    var decStr = Number.isInteger(decimal) ? String(decimal) : decimal.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");

    res.innerHTML = "";
    var big = document.createElement("span");
    big.className = "res-frac";
    big.textContent = (dispDen === 1) ? String(dispNum) : dispNum + "/" + dispDen;
    res.appendChild(big);
    var meta = document.createElement("span");
    meta.className = "res-meta";
    meta.textContent = (mixed !== (dispDen === 1 ? String(dispNum) : dispNum + "/" + dispDen) ? "= " + mixed + "  " : "") + "≈ " + decStr;
    res.appendChild(meta);

    s.forEach(function (line) {
      var li = document.createElement("li");
      li.textContent = line;
      steps.appendChild(li);
    });
  }

  document.querySelectorAll("#fracRow .op-btn").forEach(function (b) {
    b.addEventListener("click", function () {
      document.querySelectorAll("#fracRow .op-btn").forEach(function (x) { x.classList.remove("active"); });
      b.classList.add("active");
      op = b.getAttribute("data-op");
      compute();
    });
  });
  ["w1", "n1", "d1", "w2", "n2", "d2"].forEach(function (id) { $(id).addEventListener("input", compute); });

  compute();
})();
