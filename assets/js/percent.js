/* ============================================================
   Percentage calculator — three live tools with shown work.
   ============================================================ */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };

  function num(id) {
    var v = $(id).value.trim();
    if (v === "") return null;
    var n = parseFloat(v);
    return isFinite(n) ? n : null;
  }
  function fmt(n) {
    if (!isFinite(n)) return "—";
    var r = Math.round(n * 10000) / 10000;
    return String(r);
  }

  function calc1() {
    var x = num("p1x"), y = num("p1y");
    if (x === null || y === null) { $("p1r").textContent = "—"; $("p1f").textContent = "Y × X ÷ 100"; return; }
    var r = y * x / 100;
    $("p1r").textContent = fmt(r);
    $("p1f").textContent = fmt(y) + " × " + fmt(x) + " ÷ 100 = " + fmt(r);
  }
  function calc2() {
    var x = num("p2x"), y = num("p2y");
    if (x === null || y === null) { $("p2r").textContent = "—"; $("p2f").textContent = "X ÷ Y × 100"; return; }
    if (y === 0) { $("p2r").textContent = "undefined"; $("p2f").textContent = "Cannot divide by zero — the whole (Y) must not be 0."; return; }
    var r = x / y * 100;
    $("p2r").textContent = fmt(r) + "%";
    $("p2f").textContent = fmt(x) + " ÷ " + fmt(y) + " × 100 = " + fmt(r) + "%";
  }
  function calc3() {
    var x = num("p3x"), y = num("p3y");
    if (x === null || y === null) { $("p3r").textContent = "—"; $("p3f").textContent = "(Y − X) ÷ X × 100"; return; }
    if (x === 0) { $("p3r").textContent = "undefined"; $("p3f").textContent = "Percent change from 0 is undefined — the old value (X) must not be 0."; return; }
    var r = (y - x) / x * 100;
    var sign = r > 0 ? "+" : "";
    $("p3r").textContent = sign + fmt(r) + "%" + (r > 0 ? " increase" : r < 0 ? " decrease" : " (no change)");
    $("p3f").textContent = "(" + fmt(y) + " − " + fmt(x) + ") ÷ " + fmt(x) + " × 100 = " + sign + fmt(r) + "%";
  }

  [["p1x", calc1], ["p1y", calc1], ["p2x", calc2], ["p2y", calc2], ["p3x", calc3], ["p3y", calc3]]
    .forEach(function (pair) { $(pair[0]).addEventListener("input", pair[1]); });
})();
