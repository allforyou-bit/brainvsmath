/* ============================================================
   Math Sprint — 60-second adaptive mental math.
   Replayable (not date-seeded): every run is fresh.
   ============================================================ */
(function () {
  "use strict";
  var B = window.BVM;
  if (!B) return;

  var DUR_MS = 60000;
  var BEST_KEY = "bvm_sprint_best_v1";

  var best = B.load(BEST_KEY, { score: 0, solved: 0, runs: 0 });
  var st = null;         // run state
  var input = "";
  var timerId = null;

  var $ = function (id) { return document.getElementById(id); };

  function ri(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pick(arr) { return arr[ri(0, arr.length - 1)]; }

  /* ---------- question generator (levels 1-8) ---------- */
  function genQ(level) {
    var a, b, op;
    switch (Math.min(level, 8)) {
      case 1: a = ri(2, 9); b = ri(2, 9); op = "+"; break;
      case 2:
        if (Math.random() < .5) { a = ri(2, 9); b = ri(2, 9); op = "+"; }
        else { a = ri(5, 18); b = ri(2, a - 1); op = "−"; }
        break;
      case 3: a = ri(2, 9); b = ri(2, 9); op = "×"; break;
      case 4:
        if (Math.random() < .5) { a = ri(11, 89); b = ri(11, 89); op = "+"; }
        else { a = ri(25, 99); b = ri(11, 24); op = "−"; }
        break;
      case 5:
        if (Math.random() < .5) { a = ri(3, 12); b = ri(3, 9); op = "×"; }
        else { b = ri(2, 9); a = b * ri(2, 12); op = "÷"; }
        break;
      case 6:
        if (Math.random() < .5) { a = ri(110, 899); b = ri(11, 99); op = pick(["+", "−"]); if (op === "−" && b > a) { var t6 = a; a = b; b = t6; } }
        else { a = ri(12, 19); b = ri(3, 9); op = "×"; }
        break;
      case 7:
        if (Math.random() < .5) { b = ri(3, 12); a = b * ri(5, 19); op = "÷"; }
        else { a = ri(13, 25); b = ri(4, 9); op = "×"; }
        break;
      default:
        var r = Math.random();
        if (r < .34) { a = ri(15, 39); b = ri(6, 12); op = "×"; }
        else if (r < .67) { b = ri(4, 15); a = b * ri(8, 25); op = "÷"; }
        else { a = ri(250, 989); b = ri(56, 199); op = pick(["+", "−"]); if (op === "−" && b > a) { var t8 = a; a = b; b = t8; } }
    }
    var ans = op === "+" ? a + b : op === "−" ? a - b : op === "×" ? a * b : a / b;
    return { text: a + " " + op + " " + b, ans: ans };
  }

  function levelFor(correct) { return Math.min(8, 1 + Math.floor(correct / 4)); }

  /* ---------- run flow ---------- */
  function startRun() {
    st = { endsAt: Date.now() + DUR_MS, score: 0, correct: 0, wrong: 0, streak: 0, level: 1, q: null };
    input = "";
    $("startView").classList.add("hidden");
    $("playView").classList.remove("hidden");
    setFeedback("", "");
    nextQ();
    timerId = setInterval(tick, 100);
    tick();
  }

  function endRun() {
    clearInterval(timerId);
    timerId = null;
    best.runs++;
    var isBest = st.score > best.score;
    if (isBest) { best.score = st.score; best.solved = Math.max(best.solved, st.correct); }
    else best.solved = Math.max(best.solved, st.correct);
    B.save(BEST_KEY, best);

    var att = st.correct + st.wrong;
    $("finalScore").textContent = st.score;
    $("finalSolved").textContent = st.correct;
    $("finalAcc").textContent = (att ? Math.round(st.correct / att * 100) : 0) + "%";
    $("finalLevel").textContent = st.level;
    $("endHeading").textContent = isBest ? "New best! 🏆" : "Time! ⏰";
    $("bestNote").textContent = isBest ? "Previous best beaten. The bar is higher now." : "Best: " + best.score + " pts — keep pushing.";
    B.openModal("endModal");
    refreshStart();
  }

  function nextQ() {
    st.level = levelFor(st.correct);
    st.q = genQ(st.level);
    input = "";
    $("question").textContent = st.q.text;
    $("levelNow").textContent = st.level;
    renderInput();
  }

  function submit() {
    if (!st || !input.length) return;
    var val = parseInt(input, 10);
    if (val === st.q.ans) {
      st.correct++;
      st.streak++;
      var pts = st.level + (st.streak >= 5 ? 2 : 0);
      st.score += pts;
      setFeedback("+" + pts + (st.streak >= 5 ? " 🔥" : " ✓"), "good");
    } else {
      st.wrong++;
      st.streak = 0;
      setFeedback("✗ it was " + st.q.ans, "bad");
    }
    $("scoreNow").textContent = st.score;
    nextQ();
  }

  function skip() {
    if (!st) return;
    st.streak = 0;
    setFeedback("skipped (answer: " + st.q.ans + ")", "bad");
    nextQ();
  }

  function setFeedback(msg, cls) {
    var f = $("feedback");
    f.textContent = msg;
    f.className = "feedback" + (cls ? " " + cls : "");
  }

  function tick() {
    if (!st) return;
    var left = st.endsAt - Date.now();
    if (left <= 0) {
      $("timerFill").style.width = "0%";
      $("timeLeft").textContent = "0.0s";
      endRun();
      return;
    }
    $("timerFill").style.width = (left / DUR_MS * 100) + "%";
    $("timeLeft").textContent = (left / 1000).toFixed(1) + "s";
  }

  /* ---------- input ---------- */
  function renderInput() {
    var d = $("answerDisplay");
    if (input.length) { d.textContent = input; }
    else { d.innerHTML = '<span class="placeholder">?</span>'; }
  }
  function key(k) {
    if (!st) return;
    if (k === "back") input = input.slice(0, -1);
    else if (k === "ok") { submit(); return; }
    else if (input.length < 6) input += k;
    renderInput();
  }

  document.querySelectorAll("#keypad .key").forEach(function (b) {
    b.addEventListener("click", function () { key(b.getAttribute("data-k")); });
  });
  document.addEventListener("keydown", function (e) {
    if (!st || $("playView").classList.contains("hidden")) return;
    if (e.key >= "0" && e.key <= "9") { key(e.key); e.preventDefault(); }
    else if (e.key === "Backspace") { key("back"); e.preventDefault(); }
    else if (e.key === "Enter") { key("ok"); e.preventDefault(); }
  });

  /* ---------- share ---------- */
  function shareText() {
    return "Math Sprint ⚡ " + st.score + " pts\n✅ " + st.correct + " solved · top level " + st.level +
      "\nCan you beat me?\n" + (B.SITE_URL || "") + "/sprint/";
  }

  /* ---------- wire ---------- */
  function refreshStart() {
    $("bestScore").textContent = best.score;
    $("bestSolved").textContent = best.solved;
    $("runsPlayed").textContent = best.runs;
  }
  $("startBtn").addEventListener("click", startRun);
  $("againBtn").addEventListener("click", function () { B.closeModal("endModal"); startRun(); });
  $("shareRun").addEventListener("click", function () { B.share(shareText()); });
  $("skipBtn").addEventListener("click", skip);

  refreshStart();
})();
