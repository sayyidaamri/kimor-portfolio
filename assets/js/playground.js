/* KIMOR — playground: column parallax, lazy video, reveal, lightbox. */
(function () {
  "use strict";
  var K = window.KIMOR, $$ = K.$$;
  var cols = $$(".pg-col"), items = $$(".pg-item");
  var speeds = [0, -.07, .05, -.03];
  function para() {
    if (innerWidth < 768 || K.reduced) { cols.forEach(function (c) { c.style.transform = ""; }); return; }
    var y = scrollY;
    cols.forEach(function (c, i) { c.style.transform = "translate3d(0," + (y * speeds[i]).toFixed(1) + "px,0)"; });
  }
  var raf = 0;
  window.addEventListener("scroll", function () { if (raf) return; raf = requestAnimationFrame(function () { raf = 0; para(); }); }, { passive: true });
  window.addEventListener("resize", para);
  para();

  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) { v.preload = "auto"; v.play().catch(function () {}); } else v.pause();
      });
    }, { rootMargin: "200px" });
    $$(".pg-vid").forEach(function (v) { io.observe(v); });

    if (!K.reduced) {
      items.forEach(function (it) { it.style.opacity = 0; it.style.transform = "translateY(40px)"; it.style.transition = "opacity .9s, transform 1.1s cubic-bezier(.16,1,.3,1)"; });
      var io2 = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.style.opacity = 1; e.target.style.transform = "none"; io2.unobserve(e.target); } });
      }, { rootMargin: "0px 0px -5% 0px" });
      items.forEach(function (it) { io2.observe(it); });
    }
  }

  var order = items.slice().sort(function (a, b) { return a.dataset.k - b.dataset.k; });
  var makers = order.map(function (it) {
    return function () {
      var kind = it.className.match(/is-(shot|img|video|poster|empty)/)[1];
      if (kind === "img") { var im = document.createElement("img"); im.src = it.querySelector("img").src; im.alt = ""; return im; }
      if (kind === "video") { var src = it.querySelector("video"); var v = document.createElement("video"); v.src = src.currentSrc || src.src; v.loop = true; v.muted = true; v.playsInline = true; v.autoplay = true; return v; }
      if (kind === "poster") { var p = it.querySelector(".pg-poster").cloneNode(true); p.style.position = "relative"; p.style.width = "min(100%, calc((100vh - 40px) * .8))"; return p; }
      if (kind === "shot") return it.querySelector(".scr").cloneNode(true);
      var e = it.querySelector(".pg-empty").cloneNode(true); e.style.position = "relative"; e.style.aspectRatio = "16/10"; return e;
    };
  });
  order.forEach(function (it, k) { it.addEventListener("click", function () { K.lightbox.open(makers, k, it); }); });
})();
