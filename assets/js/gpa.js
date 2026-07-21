/* ============================================================
   GPA calculator — weighted 4.0 scale, live, no storage.
   ============================================================ */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };

  var GRADES = [
    ["A / A+", 4.0], ["A−", 3.7], ["B+", 3.3], ["B", 3.0], ["B−", 2.7],
    ["C+", 2.3], ["C", 2.0], ["C−", 1.7], ["D+", 1.3], ["D", 1.0], ["D−", 0.7], ["F", 0.0]
  ];

  var rowsEl = $("gpaRows");
  var seq = 0;

  function makeRow(defGrade, defCredits) {
    seq++;
    var row = document.createElement("div");
    row.className = "gpa-row";

    var name = document.createElement("input");
    name.type = "text";
    name.className = "gpa-name";
    name.placeholder = "Course " + seq + " (optional)";
    name.setAttribute("aria-label", "Course name");

    var grade = document.createElement("select");
    grade.className = "gpa-grade";
    grade.setAttribute("aria-label", "Grade");
    GRADES.forEach(function (g, i) {
      var o = document.createElement("option");
      o.value = String(g[1]);
      o.textContent = g[0];
      if (i === (defGrade == null ? 3 : defGrade)) o.selected = true;
      grade.appendChild(o);
    });

    var credits = document.createElement("input");
    credits.type = "number";
    credits.className = "gpa-credits";
    credits.min = "0"; credits.step = "0.5";
    credits.value = defCredits == null ? "3" : defCredits;
    credits.setAttribute("aria-label", "Credit hours");

    var del = document.createElement("button");
    del.className = "gpa-del icon-btn";
    del.type = "button";
    del.setAttribute("aria-label", "Remove course");
    del.textContent = "✕";
    del.addEventListener("click", function () {
      if (rowsEl.children.length > 1) { row.remove(); compute(); }
      else { name.value = ""; credits.value = "3"; grade.selectedIndex = 3; compute(); }
    });

    grade.addEventListener("change", compute);
    credits.addEventListener("input", compute);

    row.appendChild(name);
    row.appendChild(grade);
    row.appendChild(credits);
    row.appendChild(del);
    rowsEl.appendChild(row);
  }

  function compute() {
    var rows = rowsEl.querySelectorAll(".gpa-row");
    var totalQP = 0, totalCr = 0, counted = 0;
    rows.forEach(function (r) {
      var gp = parseFloat(r.querySelector(".gpa-grade").value);
      var cr = parseFloat(r.querySelector(".gpa-credits").value);
      if (isFinite(cr) && cr > 0) {
        totalQP += gp * cr;
        totalCr += cr;
        counted++;
      }
    });
    if (totalCr <= 0) {
      $("gpaValue").textContent = "—";
      $("gpaFormula").textContent = "quality points ÷ total credits";
      return;
    }
    var gpa = totalQP / totalCr;
    $("gpaValue").textContent = gpa.toFixed(2);
    $("gpaFormula").innerHTML = "quality points " + round2(totalQP) +
      " ÷ " + round2(totalCr) + " credits<br><span style=\"opacity:.8\">across " +
      counted + " course" + (counted === 1 ? "" : "s") + "</span>";
  }

  function round2(x) { return (Math.round(x * 100) / 100).toString(); }

  function reset() {
    rowsEl.innerHTML = "";
    seq = 0;
    makeRow(0, "3");  // A, 3
    makeRow(3, "3");  // B, 3
    makeRow(6, "4");  // C+, 4
    compute();
  }

  $("gpaAdd").addEventListener("click", function () { makeRow(null, "3"); compute(); });
  $("gpaReset").addEventListener("click", reset);

  reset();

  /* QA handle */
  window.__BVM_GPA = { compute: compute };
})();
