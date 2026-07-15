/* ============================================================
   Times tables — interactive chart, study lists, 10-Q quiz.
   ============================================================ */
(function () {
  "use strict";
  var B = window.BVM;
  if (!B) return;
  var $ = function (id) { return document.getElementById(id); };
  var N = 12;

  /* ---------- chart ---------- */
  var grid = $("ttGrid");
  (function buildGrid() {
    var thead = document.createElement("thead");
    var hr = document.createElement("tr");
    hr.appendChild(document.createElement("th")); // corner
    for (var c = 1; c <= N; c++) {
      var th = document.createElement("th");
      th.textContent = c;
      th.setAttribute("data-c", c);
      hr.appendChild(th);
    }
    thead.appendChild(hr);
    grid.appendChild(thead);

    var tbody = document.createElement("tbody");
    for (var r = 1; r <= N; r++) {
      var tr = document.createElement("tr");
      var th2 = document.createElement("th");
      th2.textContent = r;
      th2.setAttribute("data-r", r);
      tr.appendChild(th2);
      for (var c2 = 1; c2 <= N; c2++) {
        var td = document.createElement("td");
        td.textContent = r * c2;
        td.setAttribute("data-r", r);
        td.setAttribute("data-c", c2);
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    grid.appendChild(tbody);
  })();

  function clearHl() {
    grid.querySelectorAll("td").forEach(function (td) { td.classList.remove("hl", "hl2"); });
  }
  grid.addEventListener("click", function (e) {
    var t = e.target;
    clearHl();
    if (t.tagName === "TD") {
      var r = +t.getAttribute("data-r"), c = +t.getAttribute("data-c");
      grid.querySelectorAll("td").forEach(function (td) {
        var tr = +td.getAttribute("data-r"), tc = +td.getAttribute("data-c");
        if ((tr === r && tc <= c) || (tc === c && tr <= r)) td.classList.add("hl2");
      });
      t.classList.remove("hl2");
      t.classList.add("hl");
      B.toast(r + " × " + c + " = " + (r * c));
    } else if (t.tagName === "TH" && (t.getAttribute("data-r") || t.getAttribute("data-c"))) {
      var rr = t.getAttribute("data-r"), cc = t.getAttribute("data-c");
      grid.querySelectorAll("td").forEach(function (td) {
        if (rr && td.getAttribute("data-r") === rr) td.classList.add("hl");
        if (cc && td.getAttribute("data-c") === cc) td.classList.add("hl");
      });
    }
  });

  /* ---------- study list ---------- */
  var currentTable = 7;
  function renderPick(containerId, onPick, withMixed) {
    var box = $(containerId);
    box.innerHTML = "";
    for (var i = 1; i <= N; i++) {
      (function (i) {
        var b = document.createElement("button");
        b.className = "chip";
        b.textContent = i;
        b.setAttribute("data-v", i);
        b.addEventListener("click", function () { onPick(i, b); });
        box.appendChild(b);
      })(i);
    }
    if (withMixed) {
      var m = document.createElement("button");
      m.className = "chip";
      m.textContent = "Mixed";
      m.setAttribute("data-v", "mixed");
      m.addEventListener("click", function () { onPick("mixed", m); });
      box.appendChild(m);
    }
  }
  function markActive(containerId, val) {
    $(containerId).querySelectorAll(".chip").forEach(function (c) {
      c.classList.toggle("active", c.getAttribute("data-v") === String(val));
    });
  }
  function renderList() {
    var box = $("ttList");
    box.innerHTML = "";
    for (var i = 1; i <= N; i++) {
      var d = document.createElement("div");
      d.textContent = currentTable + " × " + i + " = " + (currentTable * i);
      box.appendChild(d);
    }
  }
  renderPick("tablePick", function (v) { currentTable = v; markActive("tablePick", v); renderList(); }, false);
  markActive("tablePick", currentTable);
  renderList();

  /* ---------- quiz ---------- */
  var quizTable = "mixed", quiz = null;
  renderPick("quizPick", function (v) { quizTable = v; markActive("quizPick", v); }, true);
  markActive("quizPick", "mixed");

  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }

  function startQuiz() {
    var qs = [];
    for (var i = 0; i < 10; i++) {
      var a = quizTable === "mixed" ? ri(2, 12) : quizTable;
      qs.push({ a: a, b: ri(1, 12) });
    }
    quiz = { qs: qs, idx: 0, score: 0 };
    $("quizSetup").classList.add("hidden");
    $("quizDone").classList.add("hidden");
    $("quizPlay").classList.remove("hidden");
    $("quizFeedback").textContent = "";
    $("quizScore").textContent = "0";
    showQ();
    $("quizInput").focus();
  }
  function showQ() {
    var q = quiz.qs[quiz.idx];
    $("quizQ").textContent = q.a + " × " + q.b;
    $("quizProgress").textContent = "Question " + (quiz.idx + 1) + "/10";
    $("quizInput").value = "";
  }
  function answer() {
    if (!quiz) return;
    var q = quiz.qs[quiz.idx];
    var v = parseInt($("quizInput").value, 10);
    if (isNaN(v)) return;
    var f = $("quizFeedback");
    if (v === q.a * q.b) { quiz.score++; f.textContent = "✓ correct"; f.className = "feedback good"; }
    else { f.textContent = "✗ " + q.a + " × " + q.b + " = " + (q.a * q.b); f.className = "feedback bad"; }
    $("quizScore").textContent = quiz.score;
    quiz.idx++;
    if (quiz.idx >= 10) { endQuiz(); return; }
    showQ();
    $("quizInput").focus();
  }
  function endQuiz() {
    $("quizPlay").classList.add("hidden");
    $("quizDone").classList.remove("hidden");
    $("quizFinal").textContent = quiz.score + "/10";
    var v = quiz.score >= 10 ? "Flawless. You own " + (quizTable === "mixed" ? "these tables" : "the " + quizTable + "s") + ". 👑"
      : quiz.score >= 8 ? "Strong! One more run for a perfect score."
      : quiz.score >= 5 ? "Good base — study the list above and retry."
      : "Everyone starts somewhere. Read the table aloud, then try again!";
    $("quizVerdict").textContent = v;
    quiz = null;
  }

  $("quizStart").addEventListener("click", startQuiz);
  $("quizAgain").addEventListener("click", startQuiz);
  $("quizGo").addEventListener("click", answer);
  $("quizInput").addEventListener("keydown", function (e) { if (e.key === "Enter") { answer(); e.preventDefault(); } });
})();
