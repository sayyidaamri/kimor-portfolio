/* KIMOR — home / selected work: infinite 3D card path synced with the project list. */
(function () {
  "use strict";
  var K = window.KIMOR, $ = K.$, $$ = K.$$;
  var cards = $$(".card"), items = $$(".w-item"), dets = $$(".w-det"), sws = $$(".sw"), mis = $$(".mi");
  var N = cards.length, cur = 0, target = 0, lastActive = -1, flying = false;
  var numEl = $(".n-cur"), work = $(".work");
  var W = innerWidth, H = innerHeight, mobile = W < 768;

  // Path keyframes: [d, x (×vw), y (×vh), rotateX, rotateY, skewY, rotateZ, scale]
  // Upwards the cards turn edge-on (rotateY) into thin strips; downwards they fall flat (rotateX).
  var PATH_D = [
    [-9, .815, -.13, 10, -83, 9, 0, .8],
    [-6, .800, -.085, 12, -82, 9, 0, .84],
    [-5, .793, -.07, 12, -81, 9, 0, .86],
    [-4, .785, -.055, 13, -80, 9, 0, .88],
    [-3, .773, -.04, 14, -79, 9, 0, .9],
    [-2, .755, -.02, 15, -77, 9, 0, .93],
    [-1, .600, .095, 26, -30, 8.5, 0, 1.04],
    [0, .490, .505, 0, 0, .8, -1, 1],
    [1, .300, .975, -64, 0, 8.5, 0, 1.0],
    [2, .275, 1.035, -70, 0, 9.5, 0, 1.03],
    [3, .255, 1.09, -73, 0, 10.5, 0, 1.06],
    [4, .24, 1.14, -75, 0, 11, 0, 1.08],
    [6, .22, 1.25, -76, 0, 12, 0, 1.1],
    [9, .19, 1.4, -77, 0, 12, 0, 1.1]
  ];
  var PATH_M = [
    [-9, 1.06, -.12, 10, -82, 8, 0, .9],
    [-6, 1.0, -.06, 12, -81, 9, 0, .95],
    [-4, .96, -.03, 13, -80, 9, 0, 1],
    [-3, .94, -.02, 14, -79, 9, 0, 1.02],
    [-2, .91, -.005, 15, -77, 9, 0, 1.05],
    [-1, .80, .03, 24, -32, 8, 0, .9],
    [0, .50, .518, 0, 0, .8, -1, 1],
    [1, .08, .985, -64, 0, 9, 0, 1.0],
    [2, .10, 1.01, -70, 0, 10, 0, 1.03],
    [3, .07, 1.05, -73, 0, 11, 0, 1.06],
    [4, .05, 1.09, -75, 0, 11, 0, 1.08],
    [6, .02, 1.18, -76, 0, 12, 0, 1.1],
    [9, -.02, 1.3, -77, 0, 12, 0, 1.1]
  ];
  function samp(path, d) {
    if (d <= path[0][0]) return path[0];
    var last = path[path.length - 1]; if (d >= last[0]) return last;
    for (var i = 0; i < path.length - 1; i++) {
      var a = path[i], b = path[i + 1];
      if (d >= a[0] && d <= b[0]) {
        var t = (d - a[0]) / (b[0] - a[0]);
        t = t * t * (3 - 2 * t) * .35 + t * .65; // slightly eased between keys
        var o = []; for (var k = 0; k < a.length; k++) o[k] = a[k] + (b[k] - a[k]) * t; return o;
      }
    }
    return last;
  }
  var wrap = function (d) { d = ((d % N) + N) % N; return d > N / 2 ? d - N : d; };
  var mod = function (i) { return ((i % N) + N) % N; };

  function layout() {
    var path = mobile ? PATH_M : PATH_D;
    var cw = cards[0].offsetWidth, ch = cards[0].offsetHeight;
    for (var i = 0; i < N; i++) {
      var d = wrap(i - cur), p = samp(path, d), c = cards[i];
      var x = p[1] * W - cw / 2, y = p[2] * H - ch / 2;
      // gesture: the card in focus drifts with the cursor and, while hovered, tilts towards it and lifts a touch
      var w = Math.max(0, 1 - Math.abs(d)), rx = p[3], ry = p[4], rz = p[6], sc = p[7];
      if (w > 0) {
        x += w * (gx * 14 + g.h * g.lx * 6); y += w * (gy * 8 + g.h * g.ly * 4);
        rx += w * g.h * -g.ly * 5; ry += w * g.h * g.lx * 6; rz += w * g.h * (.7 - g.lx * .5);
        sc *= 1 + w * g.h * .025;
      }
      c.style.transform = "translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px,0) perspective(1100px) rotateX(" + rx.toFixed(2) + "deg) rotateY(" + ry.toFixed(2) + "deg) skewY(" + p[5].toFixed(2) + "deg) rotateZ(" + rz.toFixed(2) + "deg) scale(" + sc.toFixed(4) + ")";
      c.style.zIndex = String(100 - Math.round(Math.abs(d) * 10));
      c.style.visibility = Math.abs(d) > 9 ? "hidden" : "visible";
    }
    var step = 173;
    for (var j = 0; j < N; j++) {
      var dd = wrap(j - cur), a = Math.abs(dd), it = items[j];
      it.style.transform = "translate3d(0," + (dd * step).toFixed(1) + "px,0)";
      it.style.opacity = a > 4 ? 0 : (1 - Math.min(a, 1) * .72 - Math.max(0, a - 3) * .28).toFixed(3);
      it.style.filter = a < .05 ? "none" : "blur(" + Math.min(a * .9, 1.2).toFixed(2) + "px)";
    }
    var act = mod(Math.round(cur));
    if (act !== lastActive) setActive(act);
  }

  function setActive(i) {
    [dets, sws, mis, items, cards].forEach(function (list) { list.forEach(function (el, k) { el.classList.toggle("is-active", k === i); }); });
    cards.forEach(function (c, k) { c.tabIndex = k === i ? 0 : -1; });
    // one soft tick per card that passes the centre (not during the fly-in)
    if (lastActive !== -1 && !flying && !document.documentElement.classList.contains("has-intro")) K.sfx && K.sfx("tick");
    var txt = (i + 1 < 10 ? "0" : "") + (i + 1);
    if (lastActive === -1 || K.reduced) numEl.textContent = txt;
    else {
      numEl.classList.add("swap");
      clearTimeout(numEl._t);
      numEl._t = setTimeout(function () { numEl.textContent = txt; numEl.classList.remove("swap"); }, 170);
    }
    lastActive = i;
  }

  // ---------- cursor gesture state (desktop pointers only)
  // gx/gy: eased cursor offset from the screen centre (-1..1); g.h: eased hover of the active card;
  // g.lx/g.ly: cursor position inside the active card (-1..1)
  var gx = 0, gy = 0, g = { h: 0, lx: 0, ly: 0 }, ptr = { x: 0, y: 0, tl: 0, tx: 0, ty: 0, on: false }, hovered = -1;
  var finePointer = window.matchMedia && matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (finePointer && !K.reduced) {
    window.addEventListener("pointermove", function (e) {
      if (e.pointerType !== "mouse") return;
      ptr.on = true; ptr.tx = e.clientX / W * 2 - 1; ptr.ty = e.clientY / H * 2 - 1; ptr.x = e.clientX; ptr.y = e.clientY;
    }, { passive: true });
    document.addEventListener("pointerleave", function () { ptr.on = false; ptr.tx = 0; ptr.ty = 0; hovered = -1; });
  }
  function gesture() {
    if (!finePointer || K.reduced || mobile) return false;
    var act = mod(Math.round(cur)), settled = Math.abs(target - cur) < .35 && !flying;
    var on = hovered === act && settled ? 1 : 0;
    // cursor position relative to the active card's resting centre
    var path = PATH_D, p0 = samp(path, 0), cw = cards[0].offsetWidth, ch = cards[0].offsetHeight;
    var lx = Math.max(-1, Math.min(1, (ptr.x - p0[1] * W) / (cw / 2))), ly = Math.max(-1, Math.min(1, (ptr.y - p0[2] * H) / (ch / 2)));
    var tx = ptr.on ? ptr.tx : 0, ty = ptr.on ? ptr.ty : 0;
    var moved = Math.abs(tx - gx) + Math.abs(ty - gy) + Math.abs(on - g.h) + (on ? Math.abs(lx - g.lx) + Math.abs(ly - g.ly) : 0) > .002;
    if (!moved) return false;
    gx += (tx - gx) * .06; gy += (ty - gy) * .06;
    g.h += (on - g.h) * .1;
    if (on) { g.lx += (lx - g.lx) * .12; g.ly += (ly - g.ly) * .12; }
    return true;
  }

  var ease = .085;
  function loop() {
    var diff = target - cur, g2 = gesture();
    if (Math.abs(diff) > .0005) { cur += diff * (flying ? .045 : ease); layout(); }
    else if (cur !== target) { cur = target; layout(); }
    else if (g2) layout();
    requestAnimationFrame(loop);
  }

  // ---------- input
  var snapT;
  function snapSoon(ms) { clearTimeout(snapT); snapT = setTimeout(function () { target = Math.round(target); }, ms || 140); }
  window.addEventListener("wheel", function (e) {
    if (K.modalOpen() || K.navigating) return;
    e.preventDefault();
    var dy = e.deltaMode === 1 ? e.deltaY * 30 : e.deltaY;
    dy = Math.max(-260, Math.min(260, dy));
    target += dy / 180;
    snapSoon(160);
  }, { passive: false });

  var ty = null, t0 = 0, tStart = 0, moved = false;
  work.addEventListener("touchstart", function (e) { ty = e.touches[0].clientY; tStart = target; t0 = Date.now(); moved = false; }, { passive: true });
  work.addEventListener("touchmove", function (e) {
    if (ty === null) return;
    var dy = ty - e.touches[0].clientY;
    if (Math.abs(dy) > 6) moved = true;
    target = tStart + dy / 150;
  }, { passive: true });
  work.addEventListener("touchend", function () {
    if (ty === null) return;
    var dt = Date.now() - t0, delta = target - tStart;
    if (dt < 260 && Math.abs(delta) > .08 && Math.abs(delta) < .6) target = tStart + (delta > 0 ? 1 : -1);
    target = Math.round(target); ty = null;
  });

  window.addEventListener("keydown", function (e) {
    if (K.modalOpen() || K.navigating) return;
    if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === "ArrowRight") { e.preventDefault(); target = Math.round(target) + 1; }
    if (e.key === "ArrowUp" || e.key === "PageUp" || e.key === "ArrowLeft") { e.preventDefault(); target = Math.round(target) - 1; }
    if (e.key === "Enter" && !e.target.closest("a,button")) { var c = cards[mod(Math.round(cur))]; K.go(c.href, c.dataset.title); }
  });

  function goTo(i) { target = Math.round(target) + wrap(i - mod(Math.round(target))); }
  items.forEach(function (it, i) { it.querySelector("button").addEventListener("click", function () { if (mod(Math.round(target)) === i) { var c = cards[i]; K.go(c.href, c.dataset.title); } else goTo(i); }); });
  cards.forEach(function (c, i) {
    // hover sound whenever the cursor enters a card (any card on the path, like the reference)
    c.addEventListener("pointerenter", function (e) {
      if (e.pointerType !== "mouse") return;
      hovered = i;
      if (!K.navigating && !K.modalOpen() && !document.documentElement.classList.contains("has-intro")) K.sfx && K.sfx("hover", .4);
    });
    c.addEventListener("pointerleave", function () { if (hovered === i) hovered = -1; });
    c.addEventListener("click", function (e) {
      if (moved) { e.preventDefault(); e.stopPropagation(); return; }
      if (mod(Math.round(cur)) !== i) { e.preventDefault(); e.stopPropagation(); goTo(i); }
    }, true);
  });

  window.addEventListener("resize", function () { W = innerWidth; H = innerHeight; mobile = W < 768; layout(); });

  // ---------- intro (first visit of the session only)
  var intro = $(".intro");
  var seen = K.store.get("sessionStorage", "introSeen");
  if (!seen && !K.reduced && !K.hadTransition) {
    document.documentElement.classList.add("has-intro");
    K.store.set("sessionStorage", "introSeen", "1");
    runIntro();
  } else {
    if (K.hadTransition && !K.reduced) { cur = -5; target = 0; flying = true; setTimeout(function () { flying = false; }, 1600); }
  }
  layout();
  requestAnimationFrame(loop);

  function runIntro() {
    var white = $(".intro-white", intro), pusher = $(".intro-pusher", intro);
    cur = -9; target = -9; layout();
    var start = null, D0 = 350, DUR = 3300;
    intro.classList.add("walking");
    function ease(t) { return t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
    function frame(ts) {
      if (!start) start = ts;
      var t = Math.max(0, Math.min(1, (ts - start - D0) / DUR));
      var e = ease(t) * .82 + t * .18;
      var w = e * innerWidth;
      white.style.width = w + "px";
      pusher.style.transform = "translate(" + (w - pusher.offsetWidth * .92) + "px,-50%)";
      if (t < 1) requestAnimationFrame(frame);
      else {
        // pusher runs off, then the name holds before the curtain lifts
        pusher.style.transition = "transform .7s cubic-bezier(.5,0,.75,0)";
        pusher.style.transform = "translate(" + (innerWidth + 40) + "px,-50%)";
        setTimeout(function () {
          intro.classList.remove("walking");
          intro.classList.add("lift");
          flying = true; target = 0;
          setTimeout(function () { flying = false; }, 1800);
          setTimeout(function () { document.documentElement.classList.remove("has-intro"); intro.remove(); }, 1100);
        }, 900);
      }
    }
    requestAnimationFrame(frame);
  }
})();
