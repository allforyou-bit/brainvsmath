/* ============================================================
   Prime number checker — primality test + prime factorization
   + divisors, neighbouring primes and a printable prime chart.
   Trial division on a 6k±1 wheel, capped at 10^12.
   ============================================================ */
(function () {
  "use strict";
  var $ = function (id) { return document.getElementById(id); };

  var MAX = 1e12;
  var SUP = ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"];

  /* ---------- number theory ---------- */

  /* smallest divisor of n above 1; returns n itself when n is prime */
  function smallestFactor(n) {
    if (n % 2 === 0) return 2;
    if (n % 3 === 0) return 3;
    for (var i = 5; i * i <= n; i += 6) {
      if (n % i === 0) return i;
      if (n % (i + 2) === 0) return i + 2;
    }
    return n;
  }

  function isPrime(n) {
    if (!isFinite(n) || n < 2 || Math.floor(n) !== n) return false;
    if (n < 4) return true;            // 2, 3
    return smallestFactor(n) === n;
  }

  /* [[prime, exponent], ...] for n >= 2 */
  function factorize(n) {
    var out = [];
    while (n > 1) {
      var f = smallestFactor(n);
      var e = 0;
      while (n % f === 0) { n = n / f; e++; }
      out.push([f, e]);
    }
    return out;
  }

  function divisorCount(factors) {
    var c = 1;
    factors.forEach(function (p) { c *= p[1] + 1; });
    return c;
  }

  function divisors(factors) {
    var list = [1];
    factors.forEach(function (p) {
      var add = [];
      for (var e = 1, pow = 1; e <= p[1]; e++) {
        pow *= p[0];
        for (var i = 0; i < list.length; i++) add.push(list[i] * pow);
      }
      list = list.concat(add);
    });
    return list.sort(function (a, b) { return a - b; });
  }

  function nextPrime(n) {
    if (n < 2) return 2;
    var c = n + 1;
    if (c % 2 === 0) { if (c === 2) return 2; c++; }
    while (c <= MAX && !isPrime(c)) c += 2;
    return c <= MAX ? c : null;
  }

  function prevPrime(n) {
    if (n <= 2) return null;
    if (n === 3) return 2;
    var c = n - 1;
    if (c % 2 === 0) c--;
    while (c >= 3 && !isPrime(c)) c -= 2;
    return c >= 3 ? c : 2;
  }

  function sieve(limit) {
    var mark = new Uint8Array(limit + 1), out = [];
    for (var i = 2; i <= limit; i++) {
      if (mark[i]) continue;
      out.push(i);
      for (var j = i * i; j <= limit; j += i) mark[j] = 1;
    }
    return out;
  }

  /* ---------- formatting ---------- */

  function sup(n) {
    return String(n).split("").map(function (d) { return SUP[+d]; }).join("");
  }

  function factorString(factors) {
    return factors.map(function (p) {
      return p[1] === 1 ? String(p[0]) : p[0] + sup(p[1]);
    }).join(" × ");
  }

  function fmt(n) { return n.toLocaleString("en-US"); }

  /* ---------- rendering ---------- */

  function setSteps(lines) {
    var ol = $("pcSteps");
    ol.innerHTML = "";
    lines.forEach(function (t) {
      var li = document.createElement("li");
      li.innerHTML = t;
      ol.appendChild(li);
    });
  }

  function fact(label, value) {
    var d = document.createElement("div");
    d.className = "pc-fact";
    var k = document.createElement("span"); k.className = "k"; k.textContent = label;
    var v = document.createElement("span"); v.className = "v"; v.textContent = value;
    d.appendChild(k); d.appendChild(v);
    return d;
  }

  function showMessage(text) {
    $("pcVerdict").className = "pc-verdict";
    $("pcVerdict").textContent = text;
    $("pcResult").classList.remove("hidden");
    $("pcDetail").classList.add("hidden");
  }

  function check(raw) {
    var clean = String(raw).replace(/[,\s_]/g, "");
    if (clean === "") { showMessage("Type a whole number to test."); return; }
    var n = Number(clean);

    if (!isFinite(n) || Math.floor(n) !== n) { showMessage("Please enter a whole number."); return; }
    if (n < 0) { showMessage("Primes are defined for whole numbers above 1 — try a positive number."); return; }
    if (n > MAX) { showMessage("Try a number up to 1,000,000,000,000 — larger values are too slow to factor in a browser."); return; }

    if (n === 0 || n === 1) {
      showMessage(n + " is neither prime nor composite.");
      $("pcDetail").classList.remove("hidden");
      $("pcFactorLine").textContent = "—";
      $("pcFacts").innerHTML = "";
      $("pcDivisorsWrap").classList.add("hidden");
      setSteps(n === 1
        ? ["A prime has <strong>exactly two</strong> distinct divisors: 1 and itself. The number 1 has only one divisor, so it is excluded by definition.",
           "This is not a technicality for its own sake — it keeps prime factorization unique. If 1 counted, 6 could be written 2 × 3, 1 × 2 × 3, 1 × 1 × 2 × 3 and so on."]
        : ["Zero is divisible by every whole number, so it has infinitely many divisors — far from the exactly two a prime needs."]);
      return;
    }

    var t0 = performance.now();
    var prime = isPrime(n);
    var factors = factorize(n);
    var elapsed = performance.now() - t0;

    $("pcVerdict").className = "pc-verdict " + (prime ? "yes" : "no");
    $("pcVerdict").textContent = fmt(n) + (prime ? " is prime" : " is not prime");
    $("pcResult").classList.remove("hidden");
    $("pcDetail").classList.remove("hidden");

    $("pcFactorLine").textContent = fmt(n) + " = " + (prime ? fmt(n) : factorString(factors));

    var dCount = divisorCount(factors);
    var root = Math.sqrt(n);
    var box = $("pcFacts");
    box.innerHTML = "";
    box.appendChild(fact("Divisors", fmt(dCount)));
    box.appendChild(fact("Distinct primes", fmt(factors.length)));
    var pp = prevPrime(n), np = nextPrime(n);
    box.appendChild(fact("Previous prime", pp === null ? "—" : fmt(pp)));
    box.appendChild(fact("Next prime", np === null ? "—" : fmt(np)));

    /* divisor list (capped so huge composites stay readable) */
    var wrap = $("pcDivisorsWrap");
    if (dCount <= 4096) {
      var all = divisors(factors);
      var shown = all.slice(0, 60);
      var list = $("pcDivisors");
      list.innerHTML = "";
      shown.forEach(function (d) {
        var s = document.createElement("span");
        s.className = "pc-div" + (d !== 1 && d !== n && isPrime(d) ? " p" : "");
        s.textContent = fmt(d);
        list.appendChild(s);
      });
      $("pcDivisorsNote").textContent = all.length > shown.length
        ? "First 60 of " + fmt(all.length) + " divisors. Prime divisors are highlighted."
        : "Prime divisors are highlighted.";
      wrap.classList.remove("hidden");
    } else {
      wrap.classList.add("hidden");
    }

    /* explanation */
    var lines = [];
    if (prime) {
      lines.push("A number is prime when nothing between 2 and its square root divides it evenly. Here √" +
        fmt(n) + " ≈ " + (root < 1000 ? root.toFixed(2) : fmt(Math.round(root))) + ".");
      lines.push("Every candidate up to that square root was tested and none divided " + fmt(n) +
        " without a remainder, so its only divisors are 1 and " + fmt(n) + ".");
      if (n === 2) lines.push("2 is the only even prime — every other even number has 2 as a divisor.");
      lines.push("Testing stops at the square root because any divisor larger than √n would have to pair with one smaller than √n, and none exists.");
    } else {
      var sf = factors[0][0];
      lines.push("The smallest divisor above 1 is <strong>" + fmt(sf) + "</strong>: " +
        fmt(n) + " ÷ " + fmt(sf) + " = " + fmt(n / sf) + ", with no remainder.");
      lines.push("One divisor other than 1 and itself is enough — " + fmt(n) + " is composite.");
      lines.push("Breaking each part down until only primes remain gives the prime factorization <strong>" +
        factorString(factors) + "</strong>, which is unique for every whole number above 1.");
      lines.push("From the exponents, the divisor count is " +
        factors.map(function (p) { return "(" + p[1] + "+1)"; }).join(" × ") + " = " + fmt(dCount) + ".");
    }
    lines.push("<span class=\"muted\">Checked in " + (elapsed < 1 ? "under 1" : Math.round(elapsed)) + " ms.</span>");
    setSteps(lines);
  }

  /* ---------- prime chart 1–100 ---------- */

  function renderChart() {
    var primes = {};
    sieve(100).forEach(function (p) { primes[p] = 1; });
    var grid = $("pcChart");
    grid.innerHTML = "";
    for (var i = 1; i <= 100; i++) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "pc-cell" + (primes[i] ? " prime" : "");
      b.textContent = i;
      b.title = primes[i] ? i + " is prime" : "Check " + i;
      (function (v) {
        b.addEventListener("click", function () {
          $("pcInput").value = v;
          check(v);
          $("pcResult").scrollIntoView({ block: "center" });
        });
      })(i);
      grid.appendChild(b);
    }
  }

  /* printable reference sheet: primes up to 200 */
  function printChart() {
    var limit = 200;
    var primes = sieve(limit);
    var set = {};
    primes.forEach(function (p) { set[p] = 1; });

    var sheet = $("pcSheet");
    sheet.innerHTML = "";

    var head = document.createElement("div");
    head.className = "ws-head";
    var t = document.createElement("div"); t.className = "t";
    t.textContent = "Prime Numbers to 200";
    head.appendChild(t);
    var bl = document.createElement("div"); bl.className = "blanks";
    bl.textContent = "Name: ____________________   Date: ____________";
    head.appendChild(bl);
    sheet.appendChild(head);

    var cap = document.createElement("div");
    cap.style.cssText = "font-size:.85rem;color:#555;margin:0 0 .8rem";
    cap.textContent = "Circled numbers are prime — divisible only by 1 and themselves. There are " +
      primes.length + " primes below " + limit + ".";
    sheet.appendChild(cap);

    var grid = document.createElement("div");
    grid.style.cssText = "display:grid;grid-template-columns:repeat(10,1fr);gap:.28rem;font-variant-numeric:tabular-nums;";
    for (var i = 1; i <= limit; i++) {
      var c = document.createElement("div");
      c.textContent = i;
      c.style.cssText = "text-align:center;padding:.28rem 0;font-size:.82rem;border-radius:50%;" +
        (set[i] ? "border:1.6px solid #111;font-weight:700;" : "border:1.6px solid transparent;color:#777;");
      grid.appendChild(c);
    }
    sheet.appendChild(grid);

    var listWrap = document.createElement("div");
    listWrap.style.cssText = "margin-top:1.2rem;border-top:2px dashed #999;padding-top:.8rem;font-size:.85rem;line-height:1.7;";
    listWrap.innerHTML = "<strong>The " + primes.length + " primes below " + limit + ":</strong><br>" + primes.join(", ");
    sheet.appendChild(listWrap);

    var note = document.createElement("div");
    note.className = "ws-footer-note";
    note.textContent = "Free prime number checker · brainvsmath.com/prime-number-checker/";
    sheet.appendChild(note);

    sheet.classList.remove("hidden");
    setTimeout(function () { window.print(); }, 120);
  }

  /* ---------- wiring ---------- */

  $("pcCheck").addEventListener("click", function () { check($("pcInput").value); });
  $("pcInput").addEventListener("keydown", function (e) {
    if (e.key === "Enter") { e.preventDefault(); check($("pcInput").value); }
  });
  $("pcRandom").addEventListener("click", function () {
    var n = 2 + Math.floor(Math.random() * 9998);
    $("pcInput").value = n;
    check(n);
  });
  $("pcPrint").addEventListener("click", printChart);

  document.querySelectorAll("[data-example]").forEach(function (b) {
    b.addEventListener("click", function () {
      var v = b.getAttribute("data-example");
      $("pcInput").value = v;
      check(v);
    });
  });

  renderChart();
  check(97);

  /* QA handle */
  window.__BVM_PC = {
    isPrime: isPrime, factorize: factorize, smallestFactor: smallestFactor,
    divisors: divisors, divisorCount: divisorCount, nextPrime: nextPrime,
    prevPrime: prevPrime, sieve: sieve, factorString: factorString, check: check
  };
})();
