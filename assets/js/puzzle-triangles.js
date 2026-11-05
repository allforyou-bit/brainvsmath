/* How many triangles: a triangle with each side cut into n equal parts. Pick a group (pointing up or
   pointing down, and a size), then step through every triangle in it.
   Pointing up, size s: (n - s + 1)(n - s + 2) / 2. Pointing down, size s (2s <= n): (n - 2s + 1)(n - 2s + 2) / 2.
   Total: floor(n(n + 2)(2n + 1) / 8). */
(function () {
  "use strict";
  var P = window.BVMpz;
  var svg = document.getElementById("trGrid");
  var nBox = document.getElementById("trN");
  var gBox = document.getElementById("trGroups");
  var status = document.getElementById("trStatus");
  var tbody = document.getElementById("trRows");
  var tfoot = document.getElementById("trFoot");
  var btnPrev = document.getElementById("trPrev");
  var btnNext = document.getElementById("trNext");
  var btnPlay = document.getElementById("trPlay");
  if (!svg) return;

  var n = 4, group = { dir: "up", s: 1 }, pos = 0, timer = null;
  var W = 440, PAD = 14;

  function upCount(nn, s) { return (nn - s + 1) * (nn - s + 2) / 2; }
  function downCount(nn, s) { return 2 * s <= nn ? (nn - 2 * s + 1) * (nn - 2 * s + 2) / 2 : 0; }
  function total(nn) { return Math.floor(nn * (nn + 2) * (2 * nn + 1) / 8); }

  // every triangle of a group as three lattice points [row, col]; row r has columns 0..r
  function list(nn, g) {
    var out = [], r, c, s = g.s;
    if (g.dir === "up") {
      for (r = 0; r + s <= nn; r++) for (c = 0; c <= r; c++) out.push([[r, c], [r + s, c], [r + s, c + s]]);
    } else {
      for (r = s; r + s <= nn; r++) for (c = 0; c + s <= r; c++) out.push([[r, c], [r, c + s], [r + s, c + s]]);
    }
    return out;
  }

  function geom() {
    var u = (W - 2 * PAD) / n, h = u * Math.sqrt(3) / 2;
    return { u: u, h: h, x: function (r, c) { return W / 2 + (c - r / 2) * u; }, y: function (r) { return PAD + r * h; },
      height: 2 * PAD + n * h };
  }
  function pts(G, tri) {
    return tri.map(function (p) { return G.x(p[0], p[1]).toFixed(1) + "," + G.y(p[0]).toFixed(1); }).join(" ");
  }

  function draw() {
    var G = geom();
    svg.setAttribute("viewBox", "0 0 " + W + " " + G.height.toFixed(1));
    svg.innerHTML = "";
    // the drawn lines: three families of n + 1 lines inside the big triangle
    for (var i = 0; i <= n; i++) {
      P.el("line", { x1: G.x(i, 0), y1: G.y(i), x2: G.x(i, i), y2: G.y(i), "class": "pz-grid-line" }, svg);
      P.el("line", { x1: G.x(i, 0), y1: G.y(i), x2: G.x(n, n - i), y2: G.y(n), "class": "pz-grid-line" }, svg);
      P.el("line", { x1: G.x(i, i), y1: G.y(i), x2: G.x(n, i), y2: G.y(n), "class": "pz-grid-line" }, svg);
    }
    var all = list(n, group);
    var cls = group.dir === "up" ? "pz-tri-up" : "pz-tri-down";
    P.el("polygon", { points: pts(G, all[pos]), "class": cls }, svg);
    var word = group.dir === "up" ? "pointing up" : "pointing down";
    var label = "Size " + group.s + ", " + word + ": triangle " + (pos + 1) + " of " + all.length;
    svg.setAttribute("aria-label", "Triangle cut into " + n + " parts on each side. " + label + ".");
    status.textContent = label;
  }

  function groups() {
    var g = [], s;
    for (s = 1; s <= n; s++) g.push({ dir: "up", s: s, count: upCount(n, s) });
    for (s = 1; 2 * s <= n; s++) g.push({ dir: "down", s: s, count: downCount(n, s) });
    return g;
  }
  function key(g) { return g.dir + g.s; }

  function drawTable() {
    tbody.innerHTML = "";
    var run = 0;
    groups().forEach(function (g) {
      run += g.count;
      var tr = P.el("tr", key(g) === key(group) ? { "class": "pz-on" } : {}, tbody);
      P.el("td", { text: (g.dir === "up" ? "▲ pointing up" : "▽ pointing down") + ", size " + g.s }, tr);
      P.el("td", { text: String(g.count) }, tr);
      P.el("td", { text: String(run) }, tr);
    });
    tfoot.innerHTML = "";
    var f = P.el("tr", {}, tfoot);
    P.el("td", { text: "All triangles" }, f);
    P.el("td", { colspan: "2", text: n + "(" + n + " + 2)(2·" + n + " + 1) ÷ 8, rounded down = " + total(n) }, f);
  }

  function setGroups() {
    var items = groups().map(function (g) {
      return { label: (g.dir === "up" ? "▲ " : "▽ ") + "size " + g.s + " (" + g.count + ")", value: key(g) };
    });
    P.chips(gBox, items, key(group), function (v) {
      stop();
      group = { dir: v.indexOf("up") === 0 ? "up" : "down", s: parseInt(v.replace(/\D/g, ""), 10) };
      pos = 0; draw(); drawTable();
    });
  }

  function step(d) { var m = list(n, group).length; pos = (pos + d + m) % m; draw(); }
  function stop() {
    if (timer) { clearInterval(timer); timer = null; }
    btnPlay.textContent = "Play";
    status.setAttribute("aria-live", "polite");
  }
  function play() {
    if (timer) { stop(); return; }
    btnPlay.textContent = "Pause";
    status.setAttribute("aria-live", "off");
    timer = setInterval(function () { step(1); }, 600);
  }

  btnPrev.addEventListener("click", function () { stop(); step(-1); });
  btnNext.addEventListener("click", function () { stop(); step(1); });
  btnPlay.addEventListener("click", play);
  if (P.reduced) btnPlay.hidden = true;

  var ns = [];
  for (var j = 1; j <= 7; j++) ns.push({ label: j + (j === 1 ? " part" : " parts"), value: j });
  P.chips(nBox, ns, n, function (v) {
    stop(); n = v;
    if (group.dir === "up" ? group.s > n : 2 * group.s > n) group = { dir: "up", s: 1 };
    pos = 0; setGroups(); draw(); drawTable();
  });

  setGroups();
  draw();
  drawTable();
})();
