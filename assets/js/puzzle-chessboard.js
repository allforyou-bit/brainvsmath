/* How many squares on a chessboard: pick a board size n and a square size k, step through every
   position of a k by k square, and read the running total. Count for size k: (n - k + 1)^2.
   Total: 1^2 + 2^2 + ... + n^2 = n(n + 1)(2n + 1) / 6. */
(function () {
  "use strict";
  var P = window.BVMpz;
  var svg = document.getElementById("cbBoard");
  var sizeBox = document.getElementById("cbSizes");
  var nBox = document.getElementById("cbN");
  var status = document.getElementById("cbStatus");
  var tbody = document.getElementById("cbRows");
  var tfoot = document.getElementById("cbFoot");
  var btnPrev = document.getElementById("cbPrev");
  var btnNext = document.getElementById("cbNext");
  var btnPlay = document.getElementById("cbPlay");
  if (!svg) return;

  var n = 8, k = 2, pos = 0, timer = null;
  var CELL = 50, PAD = 4;

  function count(nn, kk) { return (nn - kk + 1) * (nn - kk + 1); }
  function total(nn) { return nn * (nn + 1) * (2 * nn + 1) / 6; }

  function drawBoard() {
    var side = n * CELL;
    svg.setAttribute("viewBox", "0 0 " + (side + 2 * PAD) + " " + (side + 2 * PAD));
    svg.innerHTML = "";
    var g = P.el("g", { transform: "translate(" + PAD + "," + PAD + ")" }, svg);
    for (var r = 0; r < n; r++) {
      for (var c = 0; c < n; c++) {
        P.el("rect", { x: c * CELL, y: r * CELL, width: CELL, height: CELL,
          "class": (r + c) % 2 ? "pz-cell-b" : "pz-cell-a" }, g);
      }
    }
    P.el("rect", { x: 0, y: 0, width: side, height: side, "class": "pz-grid-line" }, g);
    var per = n - k + 1;
    var row = Math.floor(pos / per), col = pos % per;
    // faint outline of where the square has already been in this row
    for (var cc = 0; cc < col; cc++) {
      P.el("rect", { x: cc * CELL + 3, y: row * CELL + 3, width: k * CELL - 6, height: k * CELL - 6, "class": "pz-hl-ghost" }, g);
    }
    P.el("rect", { x: col * CELL + 2, y: row * CELL + 2, width: k * CELL - 4, height: k * CELL - 4, "class": "pz-hl-under" }, g);
    P.el("rect", { x: col * CELL + 2, y: row * CELL + 2, width: k * CELL - 4, height: k * CELL - 4, "class": "pz-hl" }, g);
    svg.setAttribute("aria-label", n + " by " + n + " board. A " + k + " by " + k + " square in row " + (row + 1) +
      ", column " + (col + 1) + ": position " + (pos + 1) + " of " + count(n, k) + ".");
    status.textContent = k + " by " + k + " square: position " + (pos + 1) + " of " + count(n, k) +
      " (" + per + " across × " + per + " down)";
  }

  function drawTable() {
    tbody.innerHTML = "";
    var run = 0;
    for (var kk = 1; kk <= n; kk++) {
      var cnt = count(n, kk);
      run += cnt;
      var tr = P.el("tr", kk === k ? { "class": "pz-on" } : {}, tbody);
      P.el("td", { text: kk + " × " + kk }, tr);
      P.el("td", { text: (n - kk + 1) + "² = " + cnt }, tr);
      P.el("td", { text: String(run) }, tr);
    }
    tfoot.innerHTML = "";
    var f = P.el("tr", {}, tfoot);
    P.el("td", { text: "All sizes" }, f);
    P.el("td", { colspan: "2", text: n + "(" + n + " + 1)(2·" + n + " + 1) ÷ 6 = " + total(n) }, f);
  }

  function setSizes() {
    var items = [];
    for (var i = 1; i <= n; i++) items.push({ label: i + "×" + i, value: i });
    P.chips(sizeBox, items, k, function (v) { stop(); k = v; pos = 0; drawBoard(); drawTable(); });
  }

  function step(d) {
    var m = count(n, k);
    pos = (pos + d + m) % m;
    drawBoard();
  }
  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    btnPlay.textContent = "Play";
    status.setAttribute("aria-live", "polite");
  }
  function play() {
    if (timer) { stop(); return; }
    btnPlay.textContent = "Pause";
    status.setAttribute("aria-live", "off");
    timer = setInterval(function () { step(1); }, 450);
  }

  btnPrev.addEventListener("click", function () { stop(); step(-1); });
  btnNext.addEventListener("click", function () { stop(); step(1); });
  btnPlay.addEventListener("click", play);
  if (P.reduced) btnPlay.hidden = true;

  var ns = [];
  for (var j = 3; j <= 10; j++) ns.push({ label: j + "×" + j, value: j });
  P.chips(nBox, ns, n, function (v) { stop(); n = v; if (k > n) k = n; pos = 0; setSizes(); drawBoard(); drawTable(); });

  setSizes();
  drawBoard();
  drawTable();
})();
