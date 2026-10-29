/* Brainiac Marketing Agency — shared site behaviour */
(function () {
  "use strict";

  /* ------------------------------------------------------------------
     CONFIG
     formEndpoint: paste the URL of a form service here to receive
     contact-form submissions directly (for example a Formspree form URL
     such as "https://formspree.io/f/xxxxxxx"). While it is empty, the
     form prepares the message and lets the visitor send it by email or
     WhatsApp, so no enquiry is ever silently lost.
     ------------------------------------------------------------------ */
  var CONFIG = {
    formEndpoint: "",
    email: "support@brainiacmarketingagency.com",
    whatsapp: [
      { label: "WhatsApp 1", display: "+1 859-210-9302", number: "18592109302" },
      { label: "WhatsApp 2", display: "+1 943-202-0628", number: "19432020628" }
    ]
  };

  function $(sel, root) { return (root || document).querySelector(sel); }
  function $all(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

  /* ---------- Toast ---------- */
  var toastTimer;
  function toast(msg) {
    var t = $(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 2400);
  }

  /* ---------- Copy to clipboard ---------- */
  function selectText(el) {
    try { var r = document.createRange(); r.selectNodeContents(el); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); } catch (e) {}
  }
  function copy(text, fallbackEl) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () { toast("Copied"); }, function () {
          if (fallbackEl) selectText(fallbackEl);
          toast("Press Ctrl+C or Cmd+C to copy");
        });
        return;
      }
    } catch (e) {}
    if (fallbackEl) selectText(fallbackEl);
    toast("Press Ctrl+C or Cmd+C to copy");
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-copy]");
    if (!b) return;
    var target = b.getAttribute("data-copy-target") ? document.getElementById(b.getAttribute("data-copy-target")) : null;
    copy(b.getAttribute("data-copy"), target);
  });

  /* ---------- Mobile menu ---------- */
  var toggle = $(".menu-toggle"), menu = $("#mobile-menu");
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      toggle.setAttribute("aria-label", open ? "Open menu" : "Close menu");
      menu.hidden = open;
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && toggle.getAttribute("aria-expanded") === "true") { toggle.click(); toggle.focus(); }
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 1140 && !menu.hidden) { menu.hidden = true; toggle.setAttribute("aria-expanded", "false"); }
    });
  }

  /* ---------- Floating WhatsApp ---------- */
  var waBtn = $(".wa-btn"), waPanel = $("#wa-panel");
  if (waBtn && waPanel) {
    waBtn.addEventListener("click", function () {
      var open = waBtn.getAttribute("aria-expanded") === "true";
      waBtn.setAttribute("aria-expanded", String(!open));
      waPanel.hidden = open;
    });
    document.addEventListener("click", function (e) {
      if (!waPanel.hidden && !e.target.closest(".wa-float")) { waPanel.hidden = true; waBtn.setAttribute("aria-expanded", "false"); }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !waPanel.hidden) { waPanel.hidden = true; waBtn.setAttribute("aria-expanded", "false"); waBtn.focus(); }
    });
  }

  var reduce = false;
  try { reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}

  /* ---------- Scroll progress + header state ---------- */
  var header = $(".site-header");
  var bar = document.createElement("div"); bar.className = "progress"; bar.setAttribute("aria-hidden", "true"); bar.innerHTML = "<i></i>";
  document.body.appendChild(bar);
  var ticking = false;
  function onScroll() {
    ticking = false;
    var h = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.setProperty("--p", h > 0 ? Math.min(1, window.scrollY / h) : 0);
    if (header) header.classList.toggle("is-scrolled", window.scrollY > 24);
  }
  window.addEventListener("scroll", function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
  onScroll();

  /* ---------- Reveal on scroll ---------- */
  var AUTO = ".page-hero .hero-copy, .section-head, .service-card, .value, .work, .case-study, .term, .faq, .table-wrap, .mv article, .values-grid > div, .expertise, .channel, .form-card, .service-detail, .tcard, .split-copy, .audit, .intro, .cta-inner > div, .prose, .carousel, .t-section .placeholder-note";
  if (!reduce && "IntersectionObserver" in window) {
    $all(AUTO).forEach(function (el) { if (!el.closest(".hero--v2")) el.setAttribute("data-reveal", ""); });
    // stagger siblings inside groups
    $all("[data-reveal-group], .services-grid, .works, .terms-grid, .channels, .values, .values-grid").forEach(function (g) {
      $all(":scope > [data-reveal]", g).forEach(function (el, i) { el.style.setProperty("--rd", (Math.min(i, 6) * 0.07) + "s"); });
    });
    var items = $all("[data-reveal]");
    var vh = window.innerHeight;
    items.forEach(function (el) { if (el.getBoundingClientRect().top < vh * 0.95) el.classList.add("is-in"); });
    document.documentElement.classList.add("reveal-on");
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    items.forEach(function (el) { if (!el.classList.contains("is-in")) io.observe(el); });
    // safety net: never leave content hidden
    setTimeout(function () { items.forEach(function (el) { el.classList.add("is-in"); }); }, 4000);
  }

  /* ---------- Pointer tilt (hero art, work cards) ---------- */
  var fine = false;
  try { fine = window.matchMedia("(pointer: fine)").matches; } catch (e) {}
  if (fine && !reduce) {
    var art = $(".hero-art");
    if (art) {
      var heroEl = art.closest(".hero");
      heroEl.addEventListener("mousemove", function (e) {
        var r = heroEl.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        art.style.setProperty("--ry", (x * 6).toFixed(2) + "deg");
        art.style.setProperty("--rx", (-y * 5).toFixed(2) + "deg");
      });
      heroEl.addEventListener("mouseleave", function () { art.style.setProperty("--ry", "0deg"); art.style.setProperty("--rx", "0deg"); });
    }
    $all(".work").forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
        card.style.setProperty("--ty", (x * 4).toFixed(2) + "deg");
        card.style.setProperty("--tx", (-y * 4).toFixed(2) + "deg");
      });
      card.addEventListener("mouseleave", function () { card.style.setProperty("--ty", "0deg"); card.style.setProperty("--tx", "0deg"); });
    });
  }

  /* ---------- Carousels (packages, testimonials) ---------- */
  $all(".carousel").forEach(function (car) {
    var track = $(".carousel-track", car);
    var slides = $all(".carousel-slide", car);
    var dotsWrap = $(".carousel-dots", car);
    var prev = $('.carousel-btn[data-dir="-1"]', car), next = $('.carousel-btn[data-dir="1"]', car);
    if (!track || !slides.length) return;
    var positions = 1;

    function step() {
      if (slides.length < 2) return track.clientWidth;
      return slides[1].offsetLeft - slides[0].offsetLeft;
    }
    function visible() { var g = parseFloat(getComputedStyle(track).columnGap) || 0; return Math.max(1, Math.floor((track.clientWidth + g + 2) / step())); }
    function current() { return Math.round(track.scrollLeft / step()); }
    function goTo(i) {
      i = Math.max(0, Math.min(positions - 1, i));
      track.scrollTo({ left: i * step(), behavior: reduce ? "auto" : "smooth" });
    }
    function buildDots() {
      positions = Math.max(1, slides.length - visible() + 1);
      dotsWrap.innerHTML = "";
      for (var i = 0; i < positions; i++) {
        var d = document.createElement("button");
        d.type = "button"; d.className = "carousel-dot";
        d.setAttribute("aria-label", "Go to slide " + (i + 1));
        (function (n) { d.addEventListener("click", function () { goTo(n); }); })(i);
        dotsWrap.appendChild(d);
      }
      car.classList.toggle("carousel--static", positions < 2);
      update();
    }
    function update() {
      var c = Math.min(current(), positions - 1);
      $all(".carousel-dot", dotsWrap).forEach(function (d, i) { d.setAttribute("aria-current", i === c ? "true" : "false"); });
      if (prev) prev.disabled = track.scrollLeft <= 4;
      if (next) next.disabled = track.scrollLeft >= track.scrollWidth - track.clientWidth - 4;
    }
    if (prev) prev.addEventListener("click", function () { goTo(current() - 1); });
    if (next) next.addEventListener("click", function () { goTo(current() + 1); });
    track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { e.preventDefault(); goTo(current() + 1); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); goTo(current() - 1); }
      else if (e.key === "Home") { e.preventDefault(); goTo(0); }
      else if (e.key === "End") { e.preventDefault(); goTo(positions - 1); }
    });
    var st;
    track.addEventListener("scroll", function () { clearTimeout(st); st = setTimeout(update, 60); }, { passive: true });
    var rt;
    window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(buildDots, 150); });
    buildDots();
  });

  /* ---------- Store leak check ---------- */
  var leak = $("#leak-check");
  if (leak) {
    var qsEls = $all(".lc-q", leak), msg = $(".lc-msg", leak), cta = $(".lc-cta", leak), meter = $all(".lc-meter i", leak);
    var answers = {};
    var labels = { shipping: "shipping and delivery info", mobile: "mobile navigation", cart: "abandoned-cart emails", trust: "trust signals near Add to cart", seo: "collection page SEO" };
    function render() {
      var keys = qsEls.map(function (q) { return q.getAttribute("data-q"); });
      var done = keys.filter(function (k) { return answers[k]; }).length;
      var leaks = keys.filter(function (k) { return answers[k] === "no"; });
      keys.forEach(function (k, i) { meter[i].className = answers[k] === "no" ? "on-no" : answers[k] === "yes" ? "on-yes" : ""; });
      cta.classList.toggle("is-hot", leaks.length > 0);
      if (!done) { msg.textContent = "Answer the questions to see how many sales leaks your store may have."; cta.firstChild.textContent = "Get my free store review "; return; }
      if (done < keys.length) {
        msg.innerHTML = leaks.length ? "So far: <b>" + leaks.length + " possible leak" + (leaks.length > 1 ? "s" : "") + "</b>. Keep going." : (keys.length - done) + " to go.";
        return;
      }
      if (!leaks.length) {
        msg.innerHTML = "<b>Nice, your basics look solid.</b> The next gains are usually hidden in the details. Want us to find them?";
        cta.firstChild.textContent = "Find my hidden opportunities ";
      } else {
        msg.innerHTML = "<b>Your store may be losing sales in " + leaks.length + " place" + (leaks.length > 1 ? "s" : "") + ".</b> Each one is fixable, and we can show you how.";
        cta.firstChild.textContent = "Show me how to fix " + (leaks.length > 1 ? "them" : "it") + " ";
      }
      try { sessionStorage.setItem("brainiacLeaks", leaks.map(function (k) { return labels[k]; }).join(", ")); } catch (e) {}
    }
    leak.addEventListener("click", function (e) {
      var b = e.target.closest(".lc-btns button"); if (!b) return;
      var q = b.closest(".lc-q"), k = q.getAttribute("data-q"), a = b.getAttribute("data-a");
      answers[k] = a;
      $all("button", q).forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      q.classList.toggle("is-yes", a === "yes"); q.classList.toggle("is-no", a === "no");
      render();
    });
  }

  /* ---------- Portfolio filters ---------- */
  $all(".filters").forEach(function (group) {
    var grid = document.getElementById(group.getAttribute("data-target"));
    if (!grid) return;
    var empty = grid.nextElementSibling && grid.nextElementSibling.classList.contains("filter-empty") ? grid.nextElementSibling : null;
    group.addEventListener("click", function (e) {
      var btn = e.target.closest(".filter"); if (!btn) return;
      var f = btn.getAttribute("data-filter");
      $all(".filter", group).forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
      var shown = 0;
      var items = $all(".work", grid).concat(group.hasAttribute("data-cases") ? $all(".case-study") : []);
      items.forEach(function (el) {
        var match = f === "all" || (" " + el.getAttribute("data-cats") + " ").indexOf(" " + f + " ") > -1;
        el.hidden = !match;
        if (match && el.classList.contains("work")) shown++;
      });
      if (empty) empty.hidden = shown > 0;
    });
  });

  /* ---------- Footer year ---------- */
  $all("[data-year]").forEach(function (el) { el.textContent = String(new Date().getFullYear()); });

  /* ---------- Contact form ---------- */
  var form = $("#contact-form");
  if (!form) return;

  var serviceSelect = $("#f-service");
  function preselect() {
    var h = (location.hash || "").replace("#", "");
    if (!h || !serviceSelect) return;
    var opt = $all("option", serviceSelect).filter(function (o) { return o.getAttribute("data-slug") === h; })[0];
    if (opt) {
      serviceSelect.value = opt.value;
      var card = $("#enquiry");
      if (card) card.scrollIntoView({ block: "start" });
    }
  }
  preselect();
  window.addEventListener("hashchange", preselect);
  try {
    var lk = sessionStorage.getItem("brainiacLeaks");
    var det = $("#f-details");
    if (lk && det && !det.value) det.value = "I took the store check on your website. Areas to look at: " + lk + ".\n\nMy store: ";
  } catch (e) {}

  var rules = {
    "f-name": function (v) { return v.trim().length >= 2 ? "" : "Enter your full name."; },
    "f-email": function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Enter a valid email address, for example name@store.com."; },
    "f-url": function (v) {
      v = v.trim(); if (!v) return "";
      return /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/\S*)?$/i.test(v) ? "" : "Enter a web address such as yourstore.com, or leave it blank.";
    },
    "f-service": function (v) { return v ? "" : "Choose the service you need."; },
    "f-details": function (v) { return v.trim().length >= 20 ? "" : "Tell us a little more about your project (at least 20 characters)."; }
  };

  function setError(id, msg) {
    var input = document.getElementById(id); if (!input) return;
    var field = input.closest(".field"); var err = field.querySelector(".error");
    field.classList.toggle("invalid", !!msg);
    input.setAttribute("aria-invalid", msg ? "true" : "false");
    if (err) { err.textContent = msg; err.hidden = !msg; }
  }
  function validate(id) { var el = document.getElementById(id); var msg = rules[id](el.value); setError(id, msg); return !msg; }
  Object.keys(rules).forEach(function (id) {
    var el = document.getElementById(id); if (!el) return;
    el.addEventListener("blur", function () { if (el.value) validate(id); });
    el.addEventListener("input", function () { if (el.closest(".field").classList.contains("invalid")) validate(id); });
  });

  function values() {
    return {
      name: $("#f-name").value.trim(),
      email: $("#f-email").value.trim(),
      url: $("#f-url").value.trim(),
      service: $("#f-service").value,
      budget: $("#f-budget").value,
      details: $("#f-details").value.trim()
    };
  }
  function compose(v) {
    return [
      "New project enquiry - Brainiac Marketing Agency",
      "",
      "Name: " + v.name,
      "Email: " + v.email,
      "Store or website: " + (v.url || "Not provided"),
      "Service needed: " + v.service,
      "Estimated budget: " + (v.budget || "Not provided"),
      "",
      "Project details:",
      v.details
    ].join("\n");
  }

  var result = $("#form-result");
  function show(html, cls) {
    result.className = "result " + cls;
    result.innerHTML = html;
    result.hidden = false;
    result.setAttribute("tabindex", "-1");
    result.focus();
  }
  function esc(s) { return s.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  function showReady(v) {
    var text = compose(v);
    var subject = "Project enquiry: " + v.service + " (" + v.name + ")";
    var mail = "mailto:" + CONFIG.email + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(text);
    var wa = "https://wa.me/" + CONFIG.whatsapp[0].number + "?text=" + encodeURIComponent(text);
    show(
      '<h3>Your message is ready to send</h3>' +
      '<p>Choose how to send it. WhatsApp opens a chat with your message filled in. You can also copy it and email it to <b>' + CONFIG.email + '</b>.</p>' +
      '<pre id="composed">' + esc(text) + '</pre>' +
      '<div class="btn-row">' +
        '<a class="btn btn--primary" href="' + wa + '" target="_blank" rel="noopener">Send on WhatsApp</a>' +
        '<a class="btn btn--outline" href="' + mail + '">Open in email app</a>' +
        '<button type="button" class="btn btn--outline" data-copy="' + esc(text) + '" data-copy-target="composed">Copy message</button>' +
      '</div>' +
      '<p><button type="button" class="link-arrow" id="edit-again" style="background:none;border:0;padding:0;color:var(--electric);cursor:pointer;font:inherit;font-weight:700">Edit your message</button></p>',
      "result--ready"
    );
    form.hidden = true;
    $("#edit-again").addEventListener("click", function () { result.hidden = true; form.hidden = false; $("#f-details").focus(); });
  }

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if ($("#f-company").value) return; // spam trap
    var ok = Object.keys(rules).map(validate).every(Boolean);
    if (!ok) {
      var first = $(".field.invalid input, .field.invalid select, .field.invalid textarea", form);
      if (first) first.focus();
      return;
    }
    var v = values();
    if (!CONFIG.formEndpoint) { showReady(v); return; }

    var btn = $("button[type=submit]", form);
    var label = btn.textContent;
    btn.disabled = true; btn.textContent = "Sending…";
    fetch(CONFIG.formEndpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        name: v.name, email: v.email, website: v.url, service: v.service,
        budget: v.budget, message: v.details, _subject: "Project enquiry: " + v.service
      })
    }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      form.reset(); form.hidden = true;
      show('<h3>Thank you, ' + esc(v.name.split(" ")[0]) + '. Your enquiry was sent.</h3><p>We reply to every enquiry by email at <b>' + esc(v.email) + '</b>. If it is urgent, message us on WhatsApp at ' + CONFIG.whatsapp[0].display + '.</p>', "result--ok");
    }).catch(function () {
      showReady(v);
      var h = $("h3", result); if (h) h.textContent = "We couldn't send the form, but your message is saved below";
    }).then(function () { btn.disabled = false; btn.textContent = label; });
  });
})();
