/* KIMOR — project page: thumbnail minimap, lightbox, pull-to-next-project. */
(function () {
  "use strict";
  var K = window.KIMOR, $ = K.$, $$ = K.$$;
  var shots = $$(".shot"), thumbs = $$(".thumb"), frame = $(".p-thumbs .frame"), gal = $(".p-gallery");
  var next = $(".p-next"), bar = $(".nx-bar"), title = $(".p-title");

  // reveal info rows
  $$(".p-info .d-row").forEach(function (r) { r.classList.add("rv"); });
  title.classList.add("rv");

  // minimap frame follows the viewport over the gallery
  function sync() {
    if (!frame || !thumbs.length || innerWidth < 768) return;
    var g = gal.getBoundingClientRect(), gTop = g.top + scrollY, gH = gal.offsetHeight;
    var t0 = thumbs[0].offsetTop, tLast = thumbs[thumbs.length - 1];
    var tH = tLast.offsetTop + tLast.offsetHeight - t0;
    var f0 = (scrollY - gTop) / gH, f1 = (scrollY + innerHeight - gTop) / gH;
    f0 = Math.max(0, Math.min(1, f0)); f1 = Math.max(0, Math.min(1, f1));
    frame.style.top = (t0 + f0 * tH - 6) + "px";
    frame.style.height = Math.max(20, (f1 - f0) * tH + 12) + "px";
  }
  thumbs.forEach(function (t, k) {
    t.addEventListener("click", function () {
      var y = shots[k].getBoundingClientRect().top + scrollY - (innerHeight - shots[k].offsetHeight) / 2;
      window.scrollTo({ top: y, behavior: K.reduced ? "auto" : "smooth" });
    });
  });

  // lightbox
  var makers = shots.map(function (s) { return function () { var n = s.querySelector(".scr").cloneNode(true); return n; }; });
  shots.forEach(function (s, k) { s.querySelector(".shot-btn").addEventListener("click", function () { K.lightbox.open(makers, k, this); }); });

  // pull past the end to open the next project
  var pull = 0, pullT, endSince = 0;
  function atEnd() { return scrollY + innerHeight >= document.documentElement.scrollHeight - 4; }
  window.addEventListener("wheel", function (e) {
    if (K.modalOpen() || K.navigating) return;
    if (!atEnd()) { endSince = 0; return; }
    if (!endSince) { endSince = Date.now(); return; }
    if (Date.now() - endSince > 250 && e.deltaY > 0) {
      pull = Math.min(1, pull + e.deltaY / 1400);
      bar.style.setProperty("--p", pull.toFixed(3));
      clearTimeout(pullT);
      pullT = setTimeout(function () { pull = 0; bar.style.setProperty("--p", 0); }, 900);
      if (pull >= 1) K.go(next.href, next.dataset.title);
    }
  }, { passive: true });

  // gentle parallax on screens
  function para() {
    if (K.reduced) return;
    var vh = innerHeight;
    shots.forEach(function (s) {
      var r = s.getBoundingClientRect(); if (r.bottom < 0 || r.top > vh) return;
      var p = (r.top + r.height / 2 - vh / 2) / vh;
      s.firstElementChild.firstElementChild.style.transform = "translateY(" + (p * -18).toFixed(1) + "px)";
    });
  }
  // desktop: the fixed title blurs away once the page has scrolled past ~300px, back again near the top
  // (mobile: the title sits in the flow and simply scrolls away, like the reference)
  function titleFade() { title.classList.toggle("gone", innerWidth >= 768 && scrollY > 300); }

  var raf = 0;
  window.addEventListener("scroll", function () { if (raf) return; raf = requestAnimationFrame(function () { raf = 0; sync(); para(); titleFade(); }); }, { passive: true });
  window.addEventListener("resize", sync);
  sync(); para(); titleFade();
})();
