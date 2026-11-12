/* KIMOR — about: the portrait follows the cursor, blinks, and its head opens to show what's inside. */
(function () {
  "use strict";
  var K = window.KIMOR, $ = K.$, $$ = K.$$;
  var face = $(".ab-face"); if (!face) return;
  var headBtn = $(".mind-head", face), head = $(".av-head", face), pupils = $$(".av-pupil", face), eyes = $(".av-eyes", face);
  var items = $$(".mind-item", face), tip = $(".mind-tip"), modal = $(".modal-mind"), body = modal && $(".mc-body", modal);

  /* ---- cursor tracking + blink */
  var mx = 0, my = 0, cx = 0, cy = 0;
  window.addEventListener("pointermove", function (e) {
    var r = headBtn.getBoundingClientRect();
    mx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / (innerWidth / 2)));
    my = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / (innerHeight / 2)));
    if (tip) { tip.style.setProperty("--tx", e.clientX + "px"); tip.style.setProperty("--ty", e.clientY + "px"); }
  });
  head.style.transformOrigin = "120px 220px";
  (function loop() {
    cx += (mx - cx) * .12; cy += (my - cy) * .12;
    if (!K.reduced) {
      head.style.transform = "translate(" + (cx * 6).toFixed(2) + "px," + (cy * 4).toFixed(2) + "px) rotate(" + (cx * 4).toFixed(2) + "deg)";
      pupils.forEach(function (p) { p.style.transform = "translate(" + (cx * 6).toFixed(2) + "px," + (cy * 6).toFixed(2) + "px)"; });
    }
    requestAnimationFrame(loop);
  })();
  eyes.style.transformOrigin = "120px 140px";
  eyes.style.transition = "transform .08s";
  setInterval(function () {
    if (K.reduced || face.classList.contains("open")) return;
    eyes.style.transform = "scaleY(.1)";
    setTimeout(function () { eyes.style.transform = ""; }, 120);
  }, 3800);

  /* ---- tooltip */
  function tipText() { return face.classList.contains("open") ? headBtn.dataset.tipOpen : headBtn.dataset.tip; }
  headBtn.addEventListener("mouseenter", function () { if (!tip) return; tip.textContent = tipText(); tip.classList.add("show"); });
  headBtn.addEventListener("mouseleave", function () { tip && tip.classList.remove("show"); });

  /* ---- open / close the head */
  function setOpen(open) {
    face.classList.toggle("open", open);
    headBtn.setAttribute("aria-expanded", open ? "true" : "false");
    headBtn.setAttribute("aria-label", open ? headBtn.dataset.tipOpen : headBtn.dataset.tip);
    items.forEach(function (it) { it.tabIndex = open ? 0 : -1; });
    if (tip) tip.textContent = tipText();
    K.sfx && K.sfx("click");
  }
  headBtn.addEventListener("click", function () { setOpen(!face.classList.contains("open")); });

  /* ---- story cards */
  items.forEach(function (it) {
    it.addEventListener("click", function (e) {
      e.stopPropagation();
      var tpl = $('template[data-mind="' + it.dataset.key + '"]', face);
      if (!tpl || !body) return;
      body.innerHTML = "";
      body.appendChild(tpl.content.cloneNode(true));
      modal.querySelector(".mind-card").scrollTop = 0;
      it.classList.add("is-seen");
      K.openModal("mind", it);
    });
  });

  // Esc: main.js closes an open card first; a second Esc puts the hair back on.
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (!$(".modal.is-open") && face.classList.contains("open")) setOpen(false);
  }, true);
})();
