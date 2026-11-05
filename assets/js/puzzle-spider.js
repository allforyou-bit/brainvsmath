/* The spider and the fly (H. E. Dudeney): a room L long, W = 12 wide, H = 12 high. The spider is on one end
   wall, on the centre line, a = 1 below the ceiling; the fly is on the other end wall, on the centre line,
   b = 1 above the floor. Unfold the walls flat and the path is a straight line. Four unfoldings:
     1 end wall, ceiling, end wall                    a + L + (H - b)
     2 end wall, side wall, end wall                  sqrt((L + W)^2 + (H - a - b)^2)
     3 end wall, ceiling, side wall, end wall         sqrt((L + W/2 + a)^2 + (W/2 + H - b)^2)
     4 end wall, ceiling, side wall, floor, end wall  sqrt((L + a + b)^2 + (W + H)^2)
   For L = 30: 42, 43.17, 40.72 and 40. Net coordinates: x along the room, y across; faces as rectangles. */
(function () {
  "use strict";
  var P = window.BVMpz;
  var svg = document.getElementById("spNet");
  var rBox = document.getElementById("spRoutes");
  var calc = document.getElementById("spCalc");
  var lenIn = document.getElementById("spLen");
  var lenOut = document.getElementById("spLenOut");
  var tbody = document.getElementById("spRows");
  if (!svg) return;

  var W = 12, H = 12, A = 1, B = 1, L = parseInt(lenIn.value, 10) || 30, route = 4;
  lenOut.textContent = String(L);

  function nets(L) {
    var S = [-A, W / 2];
    return {
      1: { name: "Over the ceiling", faces: [
            ["end wall", -H, 0, 0, W, 1], ["ceiling", 0, 0, L, W, 1], ["end wall", L, 0, L + H, W, 1]],
           s: S, f: [L + H - B, W / 2] },
      2: { name: "Along a side wall", faces: [
            ["end wall", -W, 0, 0, H, 1], ["side wall", 0, 0, L, H, 1], ["end wall", L, 0, L + W, H, 1]],
           s: [-W / 2, A], f: [L + W / 2, H - B] },
      3: { name: "Ceiling, then a side wall", faces: [
            ["end wall", -H, 0, 0, W, 1], ["ceiling", 0, 0, L, W, 1], ["side wall", 0, W, L, W + H, 1],
            ["end wall", L, W, L + W, W + H, 1]],
           s: S, f: [L + W / 2, W + H - B] },
      4: { name: "Ceiling, side wall and floor", faces: [
            ["end wall", -H, 0, 0, W, 1], ["ceiling", 0, 0, L, W, 1], ["side wall", 0, W, L, W + H, 1],
            ["floor", 0, W + H, L, 2 * W + H, 1], ["end wall", L, W + H, L + H, 2 * W + H, 1]],
           s: S, f: [L + B, W + H + W / 2] }
    };
  }
  function legs(net) { return [Math.abs(net.f[0] - net.s[0]), Math.abs(net.f[1] - net.s[1])]; }
  function len(net) { var d = legs(net); return Math.sqrt(d[0] * d[0] + d[1] * d[1]); }
  function fmt(x) { return Math.abs(x - Math.round(x)) < 1e-9 ? String(Math.round(x)) : x.toFixed(2); }

  function draw() {
    var all = nets(L), net = all[route];
    var minX = 0, minY = 0, maxX = 0, maxY = 0;
    net.faces.forEach(function (f) { minX = Math.min(minX, f[1]); minY = Math.min(minY, f[2]); maxX = Math.max(maxX, f[3]); maxY = Math.max(maxY, f[4]); });
    var k = 440 / (maxX - minX), pad = 10;
    function X(x) { return pad + (x - minX) * k; }
    function Y(y) { return pad + (y - minY) * k; }
    svg.setAttribute("viewBox", "0 0 " + (440 + 2 * pad) + " " + ((maxY - minY) * k + 2 * pad).toFixed(1));
    svg.innerHTML = "";
    net.faces.forEach(function (f) {
      P.el("rect", { x: X(f[1]), y: Y(f[2]), width: (f[3] - f[1]) * k, height: (f[4] - f[2]) * k, "class": "pz-face pz-face-used" }, svg);
      P.el("text", { x: X((f[1] + f[3]) / 2), y: Y((f[2] + f[4]) / 2) + 4, "text-anchor": "middle", "class": "pz-face-label", text: f[0] }, svg);
    });
    P.el("line", { x1: X(net.s[0]), y1: Y(net.s[1]), x2: X(net.f[0]), y2: Y(net.f[1]), "class": "pz-path" }, svg);
    P.el("circle", { cx: X(net.s[0]), cy: Y(net.s[1]), r: 7, "class": "pz-dot-s" }, svg);
    P.el("circle", { cx: X(net.f[0]), cy: Y(net.f[1]), r: 7, "class": "pz-dot-f" }, svg);
    P.el("text", { x: X(net.s[0]) + 10, y: Y(net.s[1]) - 8, "class": "pz-dot-label", text: "S" }, svg);
    P.el("text", { x: X(net.f[0]) - 20, y: Y(net.f[1]) - 8, "class": "pz-dot-label", text: "F" }, svg);
    var d = legs(net), l = len(net);
    var faces = net.faces.length;
    svg.setAttribute("aria-label", net.name + ": the walls unfolded flat, " + faces + " faces, with the straight path from the spider S to the fly F.");
    calc.textContent = route === 1
      ? "Up " + A + ", across the ceiling " + L + ", down " + (H - B) + ": " + fmt(l) + "."
      : "The path is the long side of a right triangle with legs " + fmt(d[0]) + " and " + fmt(d[1]) + ": √(" + fmt(d[0]) + "² + " +
        fmt(d[1]) + "²) = " + (fmt(l).indexOf(".") < 0 ? fmt(l) : "√" + fmt(d[0] * d[0] + d[1] * d[1]) + " ≈ " + fmt(l)) + ". It crosses " + faces + " faces.";
    drawTable(all);
  }

  function drawTable(all) {
    tbody.innerHTML = "";
    var best = 1;
    [1, 2, 3, 4].forEach(function (i) { if (len(all[i]) < len(all[best]) - 1e-9) best = i; });
    [1, 2, 3, 4].forEach(function (i) {
      var tr = P.el("tr", i === route ? { "class": "pz-on" } : {}, tbody);
      P.el("td", { text: all[i].name }, tr);
      P.el("td", { text: fmt(len(all[i])) + (i === best ? " (shortest of the four)" : "") }, tr);
    });
  }

  // the room as a box (oblique view): x along the room, y across (drawn going back), z up
  function drawRoom() {
    var box = document.getElementById("spRoom");
    if (!box) return;
    var s = 12, dx = 0.55, dy = 0.32;
    function pt(x, y, z) { return [20 + s * x + s * dx * y, 30 + s * (H - z) + s * dy * (W - y)]; }
    var wpx = pt(L, W, 0)[0] + 20, hpx = pt(0, 0, 0)[1] + 20;
    box.setAttribute("viewBox", "0 0 " + wpx.toFixed(0) + " " + hpx.toFixed(0));
    box.innerHTML = "";
    function seg(a, b, cls) { var p = pt.apply(null, a), q = pt.apply(null, b); P.el("line", { x1: p[0], y1: p[1], x2: q[0], y2: q[1], "class": cls }, box); }
    // back edges (hidden) first, then the visible ones
    seg([0, W, 0], [L, W, 0], "pz-edge-back"); seg([0, W, 0], [0, W, H], "pz-edge-back"); seg([0, W, 0], [0, 0, 0], "pz-edge-back");
    [[[0, 0, 0], [L, 0, 0]], [[0, 0, H], [L, 0, H]], [[0, W, H], [L, W, H]], [[L, W, 0], [L, W, H]],
     [[0, 0, 0], [0, 0, H]], [[L, 0, 0], [L, 0, H]], [[0, 0, H], [0, W, H]], [[L, 0, H], [L, W, H]], [[L, 0, 0], [L, W, 0]]]
      .forEach(function (e) { seg(e[0], e[1], "pz-edge"); });
    var sp = pt(0, W / 2, H - A), fl = pt(L, W / 2, B);
    P.el("circle", { cx: sp[0], cy: sp[1], r: 6, "class": "pz-dot-s" }, box);
    P.el("circle", { cx: fl[0], cy: fl[1], r: 6, "class": "pz-dot-f" }, box);
    P.el("text", { x: sp[0] - 16, y: sp[1] + 5, "class": "pz-dot-label", text: "S" }, box);
    P.el("text", { x: fl[0] + 9, y: fl[1] + 5, "class": "pz-dot-label", text: "F" }, box);
    box.setAttribute("aria-label", "The room, " + L + " long, " + W + " wide and " + H + " high. The spider S is on one end wall, " + A +
      " below the ceiling; the fly F is on the far end wall, " + B + " above the floor.");
  }

  P.chips(rBox, [1, 2, 3, 4].map(function (i) { return { label: i + " · " + nets(L)[i].name, value: i }; }), route, function (v) { route = v; draw(); });
  lenIn.addEventListener("input", function () {
    L = parseInt(lenIn.value, 10);
    lenOut.textContent = String(L);
    draw();
    drawRoom();
  });
  draw();
  drawRoom();
})();
