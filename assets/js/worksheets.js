/* ============================================================
   Worksheet generator — seeded, shareable, print-ready.
   Same code (seed) + same options = identical worksheet.
   ============================================================ */
(function () {
  "use strict";
  var B = window.BVM;
  if (!B) return;

  var $ = function (id) { return document.getElementById(id); };
  var OP_NAME = { add: "Addition", sub: "Subtraction", mul: "Multiplication", div: "Division", mix: "Mixed Practice" };
  var OP_SIGN = { add: "+", sub: "−", mul: "×", div: "÷" };

  function randomSeed() {
    var s = "";
    var chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    for (var i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
    return s;
  }

  function ri(rand, a, b) { return a + Math.floor(rand() * (b - a + 1)); }

  function genProblem(rand, op, diff) {
    var o = op === "mix" ? ["add", "sub", "mul", "div"][Math.floor(rand() * 4)] : op;
    var a, b;
    if (o === "add") {
      if (diff === "easy") { a = ri(rand, 2, 9); b = ri(rand, 2, 9); }
      else if (diff === "medium") { a = ri(rand, 10, 99); b = ri(rand, 10, 99); }
      else { a = ri(rand, 100, 999); b = ri(rand, 100, 999); }
      return { a: a, b: b, op: o, ans: a + b };
    }
    if (o === "sub") {
      if (diff === "easy") { a = ri(rand, 3, 18); b = ri(rand, 2, a - 1); }
      else if (diff === "medium") { a = ri(rand, 25, 99); b = ri(rand, 10, a - 1); }
      else { a = ri(rand, 250, 999); b = ri(rand, 100, a - 1); }
      return { a: a, b: b, op: o, ans: a - b };
    }
    if (o === "mul") {
      if (diff === "easy") { a = ri(rand, 2, 9); b = ri(rand, 2, 9); }
      else if (diff === "medium") { a = ri(rand, 2, 12); b = ri(rand, 2, 12); }
      else { a = ri(rand, 12, 99); b = ri(rand, 3, 9); }
      return { a: a, b: b, op: o, ans: a * b };
    }
    /* division: construct exact */
    var q;
    if (diff === "easy") { b = ri(rand, 2, 9); q = ri(rand, 2, 9); }
    else if (diff === "medium") { b = ri(rand, 2, 12); q = ri(rand, 2, 12); }
    else { b = ri(rand, 3, 9); q = ri(rand, 11, 99); }
    a = b * q;
    return { a: a, b: b, op: o, ans: q };
  }

  function opts() {
    return {
      op: $("wsOp").value,
      diff: $("wsDiff").value,
      count: parseInt($("wsCount").value, 10),
      seed: ($("wsSeed").value || "").trim().toUpperCase() || randomSeed(),
      header: $("wsHeader").checked,
      answers: $("wsAnswers").checked
    };
  }

  function build() {
    var o = opts();
    $("wsSeed").value = o.seed;

    var rand = B.rng("bvm-ws-" + o.seed + "-" + o.op + "-" + o.diff + "-" + o.count);
    var probs = [];
    for (var i = 0; i < o.count; i++) probs.push(genProblem(rand, o.op, o.diff));

    var sheet = $("wsSheet");
    sheet.innerHTML = "";

    var head = document.createElement("div");
    head.className = "ws-head";
    var title = document.createElement("div");
    title.className = "t";
    title.textContent = OP_NAME[o.op] + " Worksheet — " + (o.diff.charAt(0).toUpperCase() + o.diff.slice(1)) + " · #" + o.seed;
    head.appendChild(title);
    if (o.header) {
      var blanks = document.createElement("div");
      blanks.className = "blanks";
      blanks.textContent = "Name: ____________________   Date: ____________   Score: ____ / " + o.count;
      head.appendChild(blanks);
    }
    sheet.appendChild(head);

    var grid = document.createElement("div");
    grid.className = "ws-problems";
    var cols = o.count <= 20 ? 2 : 3;
    grid.style.gridTemplateColumns = "repeat(" + cols + ", 1fr)";
    probs.forEach(function (p, idx) {
      var d = document.createElement("div");
      d.className = "prob";
      var n = document.createElement("span");
      n.className = "n";
      n.textContent = (idx + 1) + ")";
      d.appendChild(n);
      d.appendChild(document.createTextNode(p.a + " " + OP_SIGN[p.op] + " " + p.b + " = ______"));
      grid.appendChild(d);
    });
    sheet.appendChild(grid);

    if (o.answers) {
      var ansWrap = document.createElement("div");
      ansWrap.className = "ws-answers";
      var h = document.createElement("h3");
      h.textContent = "Answer key · #" + o.seed;
      ansWrap.appendChild(h);
      var ag = document.createElement("div");
      ag.className = "ans-grid";
      probs.forEach(function (p, idx) {
        var d = document.createElement("div");
        d.textContent = (idx + 1) + ") " + p.ans;
        ag.appendChild(d);
      });
      ansWrap.appendChild(ag);
      sheet.appendChild(ansWrap);
    }

    var note = document.createElement("div");
    note.className = "ws-footer-note";
    note.textContent = "Free math worksheets · " + (B.SITE_URL || "Brain vs Math") + "/worksheets/ · code #" + o.seed;
    sheet.appendChild(note);

    var url = new URL(location.href);
    url.searchParams.set("seed", o.seed);
    url.searchParams.set("op", o.op);
    url.searchParams.set("diff", o.diff);
    url.searchParams.set("count", String(o.count));
    history.replaceState(null, "", url.toString());
  }

  /* restore from URL */
  (function fromUrl() {
    var p = new URLSearchParams(location.search);
    if (p.get("op") && OP_NAME[p.get("op")]) $("wsOp").value = p.get("op");
    if (["easy", "medium", "hard"].indexOf(p.get("diff")) !== -1) $("wsDiff").value = p.get("diff");
    if (["20", "36", "48"].indexOf(p.get("count")) !== -1) $("wsCount").value = p.get("count");
    if (p.get("seed")) $("wsSeed").value = p.get("seed").toUpperCase().slice(0, 10);
  })();

  $("wsGen").addEventListener("click", function () { $("wsSeed").value = ""; build(); });
  $("wsPrint").addEventListener("click", function () { window.print(); });
  $("wsLink").addEventListener("click", function () {
    var link = location.href;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(link).then(function () { B.toast("Worksheet link copied!"); });
    } else window.prompt("Copy link:", link);
  });
  ["wsOp", "wsDiff", "wsCount", "wsHeader", "wsAnswers"].forEach(function (id) {
    $(id).addEventListener("change", build);
  });
  $("wsSeed").addEventListener("change", build);

  build();
})();
