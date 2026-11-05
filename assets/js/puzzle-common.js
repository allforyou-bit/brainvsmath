/* Brain vs Math — shared behaviour of the /puzzles/ pages.
   - ?embed=1: the page shows only the puzzle and a link back (for other sites that embed it).
   - [data-yt]: a local poster; the YouTube player (youtube-nocookie.com) loads only when pressed.
   - #embedCode: the copy-and-paste iframe snippet for this puzzle. */
(function () {
  "use strict";
  var params = new URLSearchParams(location.search);
  var embedded = params.get("embed") === "1";
  if (embedded) {
    document.documentElement.classList.add("pz-embedded");
  }

  window.BVMpz = {
    embedded: embedded,
    reduced: window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    el: function (tag, attrs, parent) {
      var ns = "http://www.w3.org/2000/svg";
      var n = /^(svg|g|rect|line|polygon|polyline|circle|text|path)$/.test(tag)
        ? document.createElementNS(ns, tag) : document.createElement(tag);
      for (var k in attrs) {
        if (k === "text") n.textContent = attrs[k];
        else n.setAttribute(k, attrs[k]);
      }
      if (parent) parent.appendChild(n);
      return n;
    },
    chips: function (box, items, current, onPick) {
      box.innerHTML = "";
      items.forEach(function (it) {
        var b = document.createElement("button");
        b.type = "button";
        b.className = "chip";
        b.textContent = it.label;
        b.setAttribute("aria-pressed", String(it.value === current));
        b.addEventListener("click", function () {
          Array.prototype.forEach.call(box.children, function (c) { c.setAttribute("aria-pressed", "false"); });
          b.setAttribute("aria-pressed", "true");
          onPick(it.value);
        });
        box.appendChild(b);
      });
    }
  };

  function ready(fn) {
    if (document.readyState !== "loading") fn();
    else document.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    // links in the embed bar open the full page in a new tab
    if (embedded) {
      Array.prototype.forEach.call(document.querySelectorAll(".pz-embed-bar a"), function (a) {
        a.target = "_blank";
        a.rel = "noopener";
      });
    }

    // video posters
    Array.prototype.forEach.call(document.querySelectorAll("[data-yt]"), function (box) {
      var btn = box.querySelector(".pz-play");
      if (!btn) return;
      btn.addEventListener("click", function () {
        var f = document.createElement("iframe");
        f.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(box.getAttribute("data-yt")) +
          "?autoplay=1&playsinline=1&rel=0";
        f.title = box.getAttribute("data-title") || "Video";
        f.allow = "autoplay; encrypted-media; picture-in-picture";
        f.allowFullscreen = true;
        box.innerHTML = "";
        box.appendChild(f);
      });
    });

    // embed snippet
    var ta = document.getElementById("embedCode");
    if (ta) {
      var canon = document.querySelector('link[rel="canonical"]');
      var url = (canon ? canon.href : location.href.split("?")[0]) + "?embed=1";
      var name = ta.getAttribute("data-name") || document.title;
      var h = ta.getAttribute("data-height") || "720";
      ta.value = '<iframe src="' + url + '" title="' + name + '" width="100%" height="' + h +
        '" style="border:0;max-width:640px" loading="lazy"></iframe>\n' +
        '<p><a href="' + url.replace("?embed=1", "") + '">' + name + '</a> from Brain vs Math</p>';
      var copy = document.getElementById("embedCopy");
      if (copy) {
        copy.addEventListener("click", function () {
          var done = function () { copy.textContent = "Copied"; setTimeout(function () { copy.textContent = "Copy the code"; }, 2000); };
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(ta.value).then(done, function () { ta.select(); });
          } else {
            ta.select();
            try { document.execCommand("copy"); done(); } catch (e) { /* the text stays selected */ }
          }
        });
      }
    }
  });
})();
