/* KIMOR — shared behaviour: page transitions, header, clock, audio, email copy, modals, lightbox, mobile menu. */
(function () {
  "use strict";
  var doc = document, body = doc.body, html = doc.documentElement;
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var store = {
    get: function (s, k) { try { return window[s].getItem(k); } catch (e) { return null; } },
    set: function (s, k, v) { try { window[s].setItem(k, v); } catch (e) {} },
    del: function (s, k) { try { window[s].removeItem(k); } catch (e) {} }
  };
  var $ = function (s, c) { return (c || doc).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || doc).querySelectorAll(s)); };
  var K = window.KIMOR = { reduced: reduced, store: store, $: $, $$: $$ };

  /* ------------------------------------------------ page transition */
  var pt = $(".pt"), ptTitle = $(".pt-title");
  K.navigating = false;
  K.go = function (href, title) {
    if (K.navigating) return;
    K.navigating = true;
    closeAllModals(); setMenu(false);
    var t = (title || "").trim() || "KIMOR";
    store.set("sessionStorage", "pt", t);
    if (reduced) { location.href = href; return; }
    ptTitle.textContent = t;
    pt.classList.remove("reveal", "instant");
    void pt.offsetWidth;
    pt.classList.add("cover");
    sfx("click");
    setTimeout(function () { location.href = href; }, 1150);
  };
  function reveal() {
    var t = store.get("sessionStorage", "pt");
    if (!t) {
      // fire after every page script has run (scripts sit at the end of <body>)
      var fire = function () { K.revealed = true; doc.dispatchEvent(new Event("kimor:ready")); };
      if (doc.readyState === "loading") doc.addEventListener("DOMContentLoaded", fire); else setTimeout(fire, 0);
      return false;
    }
    store.del("sessionStorage", "pt");
    ptTitle.textContent = t;
    pt.classList.add("instant");
    setTimeout(function () {
      pt.classList.remove("instant", "cover");
      pt.classList.add("reveal");
      K.revealed = true;
      doc.dispatchEvent(new Event("kimor:ready"));
    }, reduced ? 0 : 450);
    return true;
  }
  /* reveal-on-load (blur -> sharp) for every .rv element */
  doc.addEventListener("kimor:ready", function () {
    setTimeout(function () {
      $$(".rv:not(.in)").forEach(function (el, i) { setTimeout(function () { el.classList.add("in"); }, 120 + i * 70); });
    }, 0);
  });
  K.hadTransition = reveal();
  window.addEventListener("pageshow", function (e) {
    if (e.persisted) { K.navigating = false; pt.className = "pt"; }
  });

  doc.addEventListener("click", function (e) {
    var a = e.target.closest("a[href]");
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    if (a.hasAttribute("data-modal")) { e.preventDefault(); openModal(a.getAttribute("data-modal"), a); return; }
    var href = a.getAttribute("href");
    if (a.target === "_blank" || /^(mailto:|tel:|#|https?:)/.test(href)) return;
    e.preventDefault();
    K.go(a.href, a.getAttribute("data-title") || a.textContent);
  });


  /* ------------------------------------------------ clock */
  var clk = $(".clk");
  function tick() {
    if (!clk) return;
    try {
      clk.textContent = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Europe/Lisbon" }).format(new Date());
    } catch (e) { var d = new Date(); clk.textContent = ("0" + d.getHours()).slice(-2) + ":" + ("0" + d.getMinutes()).slice(-2); }
  }
  tick(); setInterval(tick, 10000);

  /* ------------------------------------------------ logo alternates between wordmark and portrait */
  var logo = $(".logo");
  if (logo && !reduced) setInterval(function () { if (!logo.matches(":hover")) logo.classList.toggle("alt"); }, 4200);

  /* ------------------------------------------------ audio */
  var audioBtn = $(".hd-audio"), bg = $(".bg-audio"), fadeT;
  var sfxEls = { hover: $(".sfx-hover"), click: $(".sfx-click") };
  K.audioOn = store.get("localStorage", "audio") === "on";
  function fadeTo(target, done) {
    clearInterval(fadeT);
    fadeT = setInterval(function () {
      var v = bg.volume + (target > bg.volume ? .04 : -.04);
      if ((target > bg.volume && v >= target) || (target <= bg.volume && v <= target)) { v = target; clearInterval(fadeT); if (done) done(); }
      bg.volume = Math.max(0, Math.min(1, v));
    }, 40);
  }
  function setAudio(on, user) {
    K.audioOn = on;
    audioBtn && audioBtn.setAttribute("aria-pressed", on ? "true" : "false");
    if (user) store.set("localStorage", "audio", on ? "on" : "off");
    if (!bg) return;
    if (on) {
      bg.volume = 0;
      var p = bg.play();
      if (p && p.then) p.then(function () { fadeTo(.45); }).catch(function () {
        // autoplay blocked: wait for the first gesture
        var resume = function () { doc.removeEventListener("pointerdown", resume); if (K.audioOn) bg.play().then(function () { fadeTo(.45); }).catch(function () {}); };
        doc.addEventListener("pointerdown", resume);
      });
    } else fadeTo(0, function () { bg.pause(); });
  }
  // "tick" (one per card change on Work) is synthesised: a short soft blip, no extra file to load
  var actx = null, lastTick = 0;
  function tick(vol) {
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    var now = performance.now(); if (now - lastTick < 45) return; lastTick = now;
    try {
      actx = actx || new AC();
      if (actx.state === "suspended") actx.resume();
      var t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain();
      o.type = "triangle";
      o.frequency.setValueAtTime(1500 + Math.random() * 120, t);
      o.frequency.exponentialRampToValueAtTime(620, t + .05);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol, t + .004);
      g.gain.exponentialRampToValueAtTime(.0001, t + .07);
      o.connect(g); g.connect(actx.destination);
      o.start(t); o.stop(t + .08);
    } catch (e) {}
  }
  var lastSfx = {};
  function sfx(name, vol) {
    if (!K.audioOn) return;
    if (name === "tick") return tick(vol == null ? .23 : vol);
    var el = sfxEls[name]; if (!el) return;
    var now = performance.now(); if (now - (lastSfx[name] || 0) < 60) return; lastSfx[name] = now;
    try { el.currentTime = 0; el.volume = vol != null ? vol : name === "hover" ? .25 : .4; el.play().catch(function () {}); } catch (e) {}
  }
  K.sfx = sfx;
  if (audioBtn) audioBtn.addEventListener("click", function () { setAudio(!K.audioOn, true); });
  if (K.audioOn) setAudio(true, false);
  doc.addEventListener("mouseover", function (e) {
    // (like the reference: menu links and the Work list stay silent on hover)
    var t = e.target.closest(".thumb, .pg-item, .reel-btn, .close, .p-next");
    if (t && !t.contains(e.relatedTarget)) sfx("hover");
  });

  /* ------------------------------------------------ email: click to copy */
  $$(".mail-link").forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      var txt = a.getAttribute("data-copy"), box = a.closest(".hd-mail");
      var ok = function () { box.classList.add("is-copied"); clearTimeout(box._t); box._t = setTimeout(function () { box.classList.remove("is-copied"); }, 1800); };
      if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(txt).then(ok, fallback); else fallback();
      function fallback() {
        var ta = doc.createElement("textarea"); ta.value = txt; ta.style.position = "fixed"; ta.style.opacity = "0";
        body.appendChild(ta); ta.select(); try { doc.execCommand("copy"); } catch (err) {} body.removeChild(ta); ok();
      }
    });
  });

  /* ------------------------------------------------ mobile menu */
  var burger = $(".burger"), mmenu = $(".mmenu");
  function setMenu(open) {
    if (!burger) return;
    html.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    mmenu.setAttribute("aria-hidden", open ? "false" : "true");
    body.classList.toggle("is-locked", open);
  }
  K.setMenu = setMenu;
  if (burger) burger.addEventListener("click", function () { setMenu(!html.classList.contains("menu-open")); });

  /* ------------------------------------------------ modals */
  var activeNav = null;
  function markNav(name) {
    // while CONTACT is open the arrow jumps to CONTACT, like a route
    $$(".nav").concat($$(".mm-nav")).forEach(function (nav) {
      $$(".nav-link", nav).forEach(function (l) {
        if (name) {
          if (l.classList.contains("is-active")) l.dataset.wasActive = "1";
          l.classList.toggle("is-active", l.getAttribute("data-modal") === name);
        } else {
          l.classList.toggle("is-active", l.dataset.wasActive === "1");
          delete l.dataset.wasActive;
        }
      });
    });
  }
  function openModal(name, trigger) {
    var m = $('.modal[data-name="' + name + '"]');
    if (!m) return;
    setMenu(false);
    closeAllModals(true);
    m.classList.add("is-open");
    m.setAttribute("aria-hidden", "false");
    m._trigger = trigger;
    if (name === "contact") { markNav("contact"); activeNav = true; }
    if (name === "reel") playReel(m);
    sfx("click");
    var c = $(".close", m); if (c) setTimeout(function () { c.focus({ preventScroll: true }); }, 60);
    doc.dispatchEvent(new CustomEvent("kimor:modal", { detail: { name: name, open: true } }));
  }
  function closeModal(m) {
    if (!m.classList.contains("is-open")) return;
    m.classList.remove("is-open");
    m.setAttribute("aria-hidden", "true");
    if (m.dataset.name === "contact" && activeNav) { markNav(null); activeNav = null; }
    if (m.dataset.name === "reel") { var v = $("video", m); v.pause(); }
    if (m.dataset.name === "lightbox") $$("video", m).forEach(function (v) { v.pause(); });
    if (m._trigger && m._trigger.focus) m._trigger.focus({ preventScroll: true });
    doc.dispatchEvent(new CustomEvent("kimor:modal", { detail: { name: m.dataset.name, open: false } }));
  }
  function closeAllModals() { $$(".modal.is-open").forEach(closeModal); }
  K.openModal = openModal; K.closeModal = closeModal;
  K.modalOpen = function () { return !!$(".modal.is-open") || html.classList.contains("menu-open"); };

  $$("[data-modal]").forEach(function (b) {
    if (b.tagName === "A") return; // anchors handled in the delegated click handler
    b.addEventListener("click", function (e) { e.preventDefault(); openModal(b.getAttribute("data-modal"), b); });
  });
  $$(".modal [data-close]").forEach(function (b) { b.addEventListener("click", function () { closeModal(b.closest(".modal")); }); });
  doc.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { closeAllModals(); setMenu(false); }
    var lb = $(".modal-lightbox.is-open");
    if (lb && (e.key === "ArrowRight" || e.key === "ArrowLeft")) { e.preventDefault(); K.lightbox.step(e.key === "ArrowRight" ? 1 : -1); }
  });

  function playReel(m) {
    var box = $(".reel-box", m), v = $("video", m);
    v.muted = !K.audioOn ? false : false;
    if (K.audioOn && bg) fadeTo(0, function () { bg.pause(); });
    var onReady = function () { box.classList.add("ready"); };
    v.addEventListener("canplay", onReady, { once: true });
    v.preload = "auto";
    var p = v.play(); if (p && p.catch) p.catch(function () { v.muted = true; v.play().catch(function () {}); });
    m.addEventListener("click", function resumeBg(e) {
      if (!e.target.closest("[data-close]")) return;
      m.removeEventListener("click", resumeBg);
      if (K.audioOn) setAudio(true, false);
    });
  }

  /* ------------------------------------------------ lightbox (used by project + playground) */
  var lb = $(".modal-lightbox"), stage = lb && $(".lb-stage", lb);
  K.lightbox = {
    items: [], i: 0,
    open: function (items, i, trigger) { this.items = items; this.i = i; this.render(); openModal("lightbox", trigger); },
    step: function (d) { if (!this.items.length) return; this.i = (this.i + d + this.items.length) % this.items.length; this.render(true); sfx("hover"); },
    render: function (anim) {
      var node = this.items[this.i]();
      stage.innerHTML = "";
      stage.appendChild(node);
      $$("video", stage).forEach(function (v) { v.muted = true; v.play().catch(function () {}); });
      if (anim && !reduced && stage.animate) stage.animate([{ opacity: .3, filter: "blur(8px)" }, { opacity: 1, filter: "blur(0)" }], { duration: 450, easing: "ease-out" });
    }
  };
  if (lb) {
    $(".lb-prev", lb).addEventListener("click", function () { K.lightbox.step(-1); });
    $(".lb-next", lb).addEventListener("click", function () { K.lightbox.step(1); });
    stage.addEventListener("click", function () { K.lightbox.step(1); });
    var tx = null;
    lb.addEventListener("touchstart", function (e) { tx = e.touches[0].clientX; }, { passive: true });
    lb.addEventListener("touchend", function (e) { if (tx === null) return; var dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 40) K.lightbox.step(dx < 0 ? 1 : -1); tx = null; });
  }
})();
