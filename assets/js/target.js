/* ============================================================
   Daily Target — the flagship daily puzzle.
   Deterministic from the local date: everyone gets the same
   board, and the site "updates itself" at midnight with zero
   servers and zero maintenance.
   ============================================================ */
(function () {
  "use strict";
  var B = window.BVM;
  if (!B) return;

  var DAY = B.dateKey();
  var PNUM = B.puzzleNumber();
  var TIERS = 5;

  var TIER_CFG = [
    { ops: 2, minT: 11,  label: "Warm-up" },
    { ops: 3, minT: 25,  label: "Easy"    },
    { ops: 3, minT: 60,  label: "Medium"  },
    { ops: 4, minT: 100, label: "Hard"    },
    { ops: 5, minT: 150, label: "Expert"  }
  ];

  /* ---------- puzzle generation (seeded, solvable by construction) ---------- */
  function ri(rand, a, b) { return a + Math.floor(rand() * (b - a + 1)); }
  function pick(rand, arr) { return arr[Math.floor(rand() * arr.length)]; }

  function genNums(rand, t) {
    var out = [], i, v;
    if (t === 0) {
      while (out.length < 6) {
        v = ri(rand, 1, 9);
        var dup = 0;
        for (i = 0; i < out.length; i++) if (out[i] === v) dup++;
        if (dup < 2) out.push(v);
      }
    } else if (t === 1) {
      for (i = 0; i < 4; i++) out.push(ri(rand, 2, 9));
      for (i = 0; i < 2; i++) out.push(ri(rand, 10, 20));
    } else if (t === 2) {
      for (i = 0; i < 4; i++) out.push(ri(rand, 3, 12));
      for (i = 0; i < 2; i++) out.push(ri(rand, 15, 45));
    } else if (t === 3) {
      for (i = 0; i < 3; i++) out.push(ri(rand, 2, 9));
      for (i = 0; i < 2; i++) out.push(ri(rand, 11, 30));
      out.push(pick(rand, [25, 50, 75, 100]));
    } else {
      for (i = 0; i < 3; i++) out.push(ri(rand, 2, 9));
      out.push(ri(rand, 12, 45));
      var L = [25, 50, 75, 100];
      var a = pick(rand, L), b = pick(rand, L);
      if (b === a) b = L[(L.indexOf(a) + 1) % L.length];
      out.push(a); out.push(b);
    }
    return out;
  }

  var OP_W = [
    [["+", 5], ["−", 3], ["×", 2]],
    [["+", 4], ["−", 3], ["×", 3], ["÷", 1]],
    [["+", 3], ["−", 3], ["×", 3], ["÷", 2]],
    [["+", 3], ["−", 3], ["×", 4], ["÷", 2]],
    [["+", 2], ["−", 3], ["×", 4], ["÷", 3]]
  ];
  function wop(rand, t) {
    var w = OP_W[t], total = 0, i;
    for (i = 0; i < w.length; i++) total += w[i][1];
    var r = rand() * total;
    for (i = 0; i < w.length; i++) { r -= w[i][1]; if (r < 0) return w[i][0]; }
    return "+";
  }

  function tryStep(rand, vals, t) {
    for (var k = 0; k < 40; k++) {
      var i = Math.floor(rand() * vals.length);
      var j = Math.floor(rand() * vals.length);
      if (i === j) continue;
      var a = vals[i], b = vals[j], op = wop(rand, t);
      var A = a, Bv = b, res = null;
      if (op === "+") { res = a + b; if (res > 999) res = null; }
      else if (op === "×") { if (a > 1 && b > 1 && a * b <= 999) res = a * b; }
      else if (op === "−") { A = Math.max(a, b); Bv = Math.min(a, b); res = A - Bv; if (res < 1) res = null; }
      else { A = Math.max(a, b); Bv = Math.min(a, b); if (Bv > 1 && A % Bv === 0) res = A / Bv; }
      if (res === null) continue;
      return { i: i, j: j, a: A, b: Bv, op: op, res: res };
    }
    return null;
  }

  function buildPuzzle(tier, dk) {
    var rand = B.rng("bvm-target-" + (dk || DAY) + "-t" + (tier + 1));
    var cfg = TIER_CFG[tier];
    for (var attempt = 0; attempt < 400; attempt++) {
      var minT = attempt < 300 ? cfg.minT : 11;
      var nums = genNums(rand, tier);
      var vals = nums.slice(), steps = [], ok = true;
      for (var s = 0; s < cfg.ops; s++) {
        var st = tryStep(rand, vals, tier);
        if (!st) { ok = false; break; }
        var nv = [];
        for (var x = 0; x < vals.length; x++) if (x !== st.i && x !== st.j) nv.push(vals[x]);
        nv.push(st.res);
        vals = nv;
        steps.push(st);
      }
      if (!ok) continue;
      var target = steps[steps.length - 1].res;
      if (target < minT || target > 999) continue;
      if (nums.indexOf(target) !== -1) continue;
      return { nums: nums, target: target, solution: steps };
    }
    /* practically unreachable fallback: guaranteed-valid additive puzzle */
    var n2 = genNums(rand, tier);
    return {
      nums: n2,
      target: n2[0] + n2[1] + n2[2],
      solution: [
        { a: n2[0], b: n2[1], op: "+", res: n2[0] + n2[1] },
        { a: n2[0] + n2[1], b: n2[2], op: "+", res: n2[0] + n2[1] + n2[2] }
      ]
    };
  }

  /* ---------- day state ---------- */
  var DKEY = "bvm_target_day_v1";
  function freshDay() {
    var t = [];
    for (var i = 0; i < TIERS; i++) t.push({ solved: false, hint: false });
    return { date: DAY, tiers: t };
  }
  function loadDay() {
    var d = B.load(DKEY, null);
    return (d && d.date === DAY && d.tiers && d.tiers.length === TIERS) ? d : freshDay();
  }

  var day = loadDay();
  var puzzles = [];
  for (var pi = 0; pi < TIERS; pi++) puzzles.push(buildPuzzle(pi));

  var cur = firstUnsolved();
  var tiles = [], history = [], idSeq = 0, movesThisTier = 0;
  var sel = { id: null, op: null };

  function firstUnsolved() {
    for (var i = 0; i < TIERS; i++) if (!day.tiers[i].solved) return i;
    return 0;
  }
  function persist() { B.save(DKEY, day); }
  function solvedCount() {
    var c = 0;
    for (var i = 0; i < TIERS; i++) if (day.tiers[i].solved) c++;
    return c;
  }

  /* ---------- DOM ---------- */
  var $ = function (id) { return document.getElementById(id); };
  var elTiles = $("tiles"), elChips = $("tierChips"), elTarget = $("targetNum"),
      elTierLabel = $("tierLabel"), elHint = $("hintLine"), elBanner = $("solvedBanner"),
      elStatus = $("dayStatus"), elMeta = $("puzzleMeta");

  function setTier(i) {
    cur = i;
    sel = { id: null, op: null };
    history = [];
    movesThisTier = 0;
    tiles = puzzles[i].nums.map(function (v) { return { id: ++idSeq, val: v }; });
    render();
  }

  function applyOp(a, b, op) {
    if (op === "+") { var s = a + b; return s <= 9999 ? s : null; }
    if (op === "×") { var m = a * b; return m <= 999999 ? m : null; }
    if (op === "−") return a - b >= 1 ? a - b : null;
    if (op === "÷") return (b !== 0 && a % b === 0) ? a / b : null;
    return null;
  }
  function invalidMsg(op) {
    if (op === "÷") return "Division must be exact — no fractions here!";
    if (op === "−") return "Results must stay at 1 or above.";
    return "That move isn't allowed.";
  }

  function onTile(id) {
    if (day.tiers[cur].solved) return;
    var tile = null;
    for (var i = 0; i < tiles.length; i++) if (tiles[i].id === id) tile = tiles[i];
    if (!tile) return;

    if (sel.id === null) { sel.id = id; render(); return; }
    if (sel.id === id) { if (!sel.op) sel.id = null; render(); return; }
    if (!sel.op) { sel.id = id; render(); return; }

    var first = null;
    for (var j = 0; j < tiles.length; j++) if (tiles[j].id === sel.id) first = tiles[j];
    if (!first) { sel = { id: id, op: null }; render(); return; }

    var res = applyOp(first.val, tile.val, sel.op);
    if (res === null) {
      B.toast(invalidMsg(sel.op));
      var g = document.querySelector(".game");
      if (g) { g.classList.remove("shake"); void g.offsetWidth; g.classList.add("shake"); }
      sel.op = null;
      render();
      return;
    }

    history.push(tiles.map(function (t) { return { id: t.id, val: t.val }; }));
    tiles = tiles.filter(function (t) { return t.id !== first.id && t.id !== tile.id; });
    var nt = { id: ++idSeq, val: res, fresh: true };
    tiles.push(nt);
    movesThisTier++;
    sel = { id: nt.id, op: null };
    B.markPlayed(DAY);

    if (res === puzzles[cur].target) { onSolve(); return; }
    render();
  }

  function onOp(op) {
    if (day.tiers[cur].solved) return;
    if (sel.id === null) { B.toast("Pick a number first."); return; }
    sel.op = (sel.op === op) ? null : op;
    render();
  }

  function onUndo() {
    if (!history.length) return;
    tiles = history.pop();
    movesThisTier = Math.max(0, movesThisTier - 1);
    sel = { id: null, op: null };
    render();
  }
  function onReset() { if (!day.tiers[cur].solved) setTier(cur); }

  function onHint() {
    var t = day.tiers[cur];
    if (t.solved) return;
    var st = puzzles[cur].solution[0];
    elHint.textContent = "💡 Try starting with: " + st.a + " " + st.op + " " + st.b + " = " + st.res;
    elHint.classList.remove("hidden");
    if (!t.hint) { t.hint = true; persist(); render(); }
  }

  function onSolve() {
    var t = day.tiers[cur];
    t.solved = true;
    persist();
    B.addTierSolve();
    if (solvedCount() === 1 || B.getStats().lastSolvedDay !== DAY) B.markSolvedDay(DAY);
    if (solvedCount() === TIERS) {
      var clean = true;
      for (var i = 0; i < TIERS; i++) if (day.tiers[i].hint) clean = false;
      if (clean) B.addPerfectDay();
    }
    render();
    B.confetti(elTarget);
    setTimeout(function () {
      if (solvedCount() === TIERS) { openDone(); return; }
      var nxt = -1;
      for (var i = 0; i < TIERS; i++) if (!day.tiers[i].solved) { nxt = i; break; }
      if (nxt !== -1) { setTier(nxt); B.toast("Tier " + (nxt + 1) + " — " + TIER_CFG[nxt].label + " ⚔️"); }
    }, 1200);
  }

  /* ---------- share ---------- */
  function shareText() {
    var marks = "";
    for (var i = 0; i < TIERS; i++) {
      var t = day.tiers[i];
      marks += t.solved ? (t.hint ? "🌗" : "⭐") : "⬜";
    }
    var s = B.getStats();
    var streakLine = s.streak > 0 ? "🔥 " + s.streak + "-day streak\n" : "";
    return "Brain vs Math #" + PNUM + "\n🎯 " + marks + " " + solvedCount() + "/5\n" + streakLine + (B.SITE_URL || "") + "/";
  }
  function openDone() {
    var clean = true;
    for (var i = 0; i < TIERS; i++) if (day.tiers[i].hint) clean = false;
    $("doneHeading").textContent = clean ? "Perfect day! 🏆" : "Board cleared! 🎉";
    $("doneSub").textContent = clean
      ? "All five tiers, zero hints. Genuinely impressive."
      : "All five tiers solved. Come back tomorrow to defend the streak.";
    $("sharePreview").textContent = shareText();
    B.openModal("doneModal");
  }

  /* ---------- render ---------- */
  function render() {
    var p = puzzles[cur], t = day.tiers[cur];

    elMeta.textContent = "Puzzle #" + PNUM + " · " + B.prettyDate();
    elTarget.textContent = p.target;
    elTierLabel.textContent = "Tier " + (cur + 1) + " · " + TIER_CFG[cur].label + " · par " + p.solution.length + " ops";

    /* chips */
    elChips.innerHTML = "";
    for (var i = 0; i < TIERS; i++) {
      (function (i) {
        var c = document.createElement("button");
        c.className = "chip" + (i === cur ? " active" : "") + (day.tiers[i].solved ? " done" : "");
        c.setAttribute("role", "tab");
        c.setAttribute("aria-selected", i === cur ? "true" : "false");
        c.textContent = (day.tiers[i].solved ? (day.tiers[i].hint ? "🌗 " : "⭐ ") : "") + (i + 1);
        c.addEventListener("click", function () { setTier(i); });
        elChips.appendChild(c);
      })(i);
    }

    /* tiles */
    elTiles.innerHTML = "";
    var showVals = t.solved ? p.nums.map(function (v) { return { id: "s" + v + Math.random(), val: v, dead: true }; }) : tiles;
    showVals.forEach(function (tile) {
      var b = document.createElement("button");
      b.className = "tile" + (sel.id === tile.id ? " selected" : "") + (tile.fresh ? " pop" : "");
      b.textContent = tile.val;
      if (tile.dead || t.solved) { b.disabled = true; b.style.opacity = ".45"; }
      else b.addEventListener("click", function () { onTile(tile.id); });
      elTiles.appendChild(b);
      if (tile.fresh) tile.fresh = false;
    });

    /* op buttons */
    document.querySelectorAll("#ops .op").forEach(function (b) {
      b.classList.toggle("selected", sel.op === b.getAttribute("data-op"));
      b.disabled = t.solved;
    });

    $("undoBtn").disabled = !history.length || t.solved;
    $("resetBtn").disabled = t.solved;
    $("hintBtn").disabled = t.solved;

    /* banner + hint */
    if (t.solved) {
      elBanner.textContent = "✓ Solved" + (movesThisTier ? " in " + movesThisTier + " move" + (movesThisTier === 1 ? "" : "s") : "") + (t.hint ? " (with a hint)" : "") + "!";
      elBanner.classList.remove("hidden");
      elHint.classList.add("hidden");
    } else {
      elBanner.classList.add("hidden");
      if (!t.hint) elHint.classList.add("hidden");
    }

    /* day status */
    var sc = solvedCount();
    var s = B.getStats();
    elStatus.textContent = sc === TIERS
      ? "All five tiers cleared! 🔥 Streak: " + s.streak + " day" + (s.streak === 1 ? "" : "s")
      : sc + "/5 tiers solved" + (s.streak > 0 ? " · 🔥 " + s.streak + "-day streak" : "") + " — " + TIER_CFG[cur].label + " up next.";

    renderStats();
  }

  function renderStats() {
    var s = B.getStats();
    var grid = $("statsGrid");
    if (!grid) return;
    var winPct = s.daysPlayed ? Math.round((s.daysSolved / s.daysPlayed) * 100) : 0;
    var cells = [
      [s.daysPlayed, "Played"], [winPct + "%", "Solved"], [s.tiersSolved, "Stars"],
      [s.streak, "Streak"], [s.maxStreak, "Max streak"], [s.perfectDays, "Perfect days"]
    ];
    grid.innerHTML = "";
    cells.forEach(function (c) {
      var d = document.createElement("div");
      var b = document.createElement("b"); b.textContent = c[0];
      var sp = document.createElement("span"); sp.textContent = c[1];
      d.appendChild(b); d.appendChild(sp);
      grid.appendChild(d);
    });
  }

  /* ---------- countdown ---------- */
  function fmt(ms) {
    var s = Math.max(0, Math.floor(ms / 1000));
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
    var p = function (n) { return (n < 10 ? "0" : "") + n; };
    return p(h) + ":" + p(m) + ":" + p(ss);
  }
  function tick() {
    var ms = B.msToNextMidnight();
    var c1 = $("countdown"), c2 = $("countdown2");
    if (c1) c1.textContent = fmt(ms);
    if (c2) c2.textContent = fmt(ms);
    if (ms < 1000) setTimeout(function () { location.reload(); }, 1500);
  }
  setInterval(tick, 1000);
  tick();

  /* ---------- wire up ---------- */
  document.querySelectorAll("#ops .op").forEach(function (b) {
    b.addEventListener("click", function () { onOp(b.getAttribute("data-op")); });
  });
  $("undoBtn").addEventListener("click", onUndo);
  $("resetBtn").addEventListener("click", onReset);
  $("hintBtn").addEventListener("click", onHint);
  $("shareBtn").addEventListener("click", function () { B.share(shareText()); });
  $("shareBtn2").addEventListener("click", function () { B.share(shareText()); });

  /* first visit → help */
  if (!B.load("bvm_seen_help", false)) {
    B.save("bvm_seen_help", true);
    setTimeout(function () { B.openModal("helpModal"); }, 400);
  }

  setTier(cur);

  /* QA handle: lets automated checks validate generation for any date */
  window.__BVM_T = { build: buildPuzzle, puzzles: puzzles, day: DAY };
})();
