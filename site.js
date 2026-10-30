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
    /* Booking: paste your Calendly event link here, for example
       "https://calendly.com/brainiac/consultation". When set, the booking page
       shows the live calendar instead of the time-request form. */
    calendlyUrl: "",
    /* Consultation fee shown on the booking page, for example "$50". Leave
       empty until the amount is approved. */
    consultFee: "",
    formEndpoint: "https://api.web3forms.com/submit",
    /* Only for Web3Forms: the access key it emails you (safe to be public). */
    formAccessKey: "376bb497-7b4d-4ca7-83f1-51d685116e69",
    email: "support@brainiacmarketingagency.com",
    whatsapp: [
      { label: "WhatsApp 1", display: "+1 859-210-9302", number: "18592109302" },
      { label: "WhatsApp 2", display: "+1 943-202-0628", number: "19432020628" }
    ]
  };
  window.BMA_CONFIG = CONFIG;

  /* Fallback shown only if automatic sending fails */
  window.BMA_sendOptions = function (subject, text, preId) {
    var wa = "https://wa.me/" + CONFIG.whatsapp[0].number + "?text=" + encodeURIComponent(text);
    return '<div class="send-opts"><a class="btn btn--primary" href="' + wa + '" target="_blank" rel="noopener">Send on WhatsApp instead</a>' +
      '<span class="send-label">Or email it to <b>' + CONFIG.email + '</b>.</span></div>';
  };

  /* Send a form to the inbox (FormSubmit). Resolves {ok:true} only on real success. */
  window.BMA_post = function (opts) {
    var data = {};
    try { data = JSON.parse(opts.body); } catch (e) {}
    if (/formsubmit\.co/.test(CONFIG.formEndpoint)) { data._template = "table"; data._captcha = "false"; }
    if (CONFIG.formAccessKey) data.access_key = CONFIG.formAccessKey;
    if (/web3forms\.com/.test(CONFIG.formEndpoint)) {
      if (data._subject) data.subject = data._subject;
      data.from_name = "Brainiac Marketing Agency website";
      delete data._subject; delete data._replyto;
    }
    if (data.email) data._replyto = data.email;
    return fetch(CONFIG.formEndpoint, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(data) })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) {
          if (!r.ok || !(String(j.success) === "true" || j.ok === true)) throw new Error((j && j.message) || ("HTTP " + r.status));
          return { ok: true };
        });
      });
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
      if (!done) { msg.textContent = "Answer the questions to see how many sales leaks your store may have."; cta.firstChild.textContent = "Get help fixing my store "; return; }
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
    "f-country": function (v) { return v ? "" : "Choose your country."; },
    "f-url": function (v) {
      v = v.trim(); if (!v) return "";
      return /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/\S*)?$/i.test(v) ? "" : "Enter a web address such as yourstore.com, or leave it blank.";
    },
    "f-service": function (v) { return v ? "" : "Choose the service you need."; },
    "f-details": function (v) { return v.trim().length >= 20 ? "" : "Tell us a little more about your project (at least 20 characters)."; },
    "f-consent": function () { var c = document.getElementById("f-consent"); return !c || c.checked ? "" : "Please tick the box so we can reply to your enquiry."; }
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
      country: $("#f-country").value,
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
      "Country: " + v.country,
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
    show(
      '<h3>Your message is ready to send</h3>' +
      '<p>Please try again in a moment, or send it to us another way.</p>' +
      '<pre id="composed">' + esc(text) + '</pre>' +
      window.BMA_sendOptions(subject, text, "composed") +
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
    window.BMA_post({
      method: "POST",
      headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({
        name: v.name, email: v.email, country: v.country, website: v.url, service: v.service,
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

/* =====================================================================
   Motion layer v5: word reveals, spotlight, magnetic buttons,
   timeline draw, price count-up, page transitions
   ===================================================================== */
(function () {
  "use strict";
  var reduce = false, fine = false;
  try { reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
  try { fine = window.matchMedia("(pointer: fine)").matches; } catch (e) {}
  if (reduce) return;
  var $all = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var root = document.documentElement;
  root.classList.add("motion");

  /* Split a heading into words (keeps inner elements like <em> intact) */
  function splitWords(el) {
    if (el.getAttribute("data-split")) return;
    el.setAttribute("data-split", "1");
    el.setAttribute("aria-label", el.textContent.replace(/\s+/g, " ").trim());
    var i = 0;
    function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (n) {
        if (n.nodeType === 3) {
          var parts = n.textContent.split(/(\s+)/);
          var frag = document.createDocumentFragment();
          parts.forEach(function (p) {
            if (!p) return;
            if (/^\s+$/.test(p)) { frag.appendChild(document.createTextNode(p)); return; }
            var w = document.createElement("span"); w.className = "w"; w.setAttribute("aria-hidden", "true");
            var inner = document.createElement("span"); inner.className = "wi"; inner.textContent = p;
            inner.style.setProperty("--wd", (i++ * 0.055).toFixed(3) + "s");
            w.appendChild(inner); frag.appendChild(w);
          });
          n.parentNode.replaceChild(frag, n);
        } else if (n.nodeType === 1 && n.tagName !== "BR") { walk(n); }
      });
    }
    walk(el);
  }

  /* Hero headline: words rise on load */
  var heroH = document.querySelector(".hero h1");
  if (heroH) { splitWords(heroH); requestAnimationFrame(function () { requestAnimationFrame(function () { heroH.classList.add("words-in"); }); }); }

  /* Section headings: words rise when scrolled into view */
  var heads = $all(".section-head h2, .split-copy h2, .intro h2, .cta-inner h2");
  heads.forEach(splitWords);
  if ("IntersectionObserver" in window) {
    var ho = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("words-in"); ho.unobserve(e.target); } });
    }, { threshold: 0.3 });
    heads.forEach(function (h) {
      if (h.getBoundingClientRect().top < window.innerHeight * 0.95) h.classList.add("words-in"); else ho.observe(h);
    });
    setTimeout(function () { heads.forEach(function (h) { h.classList.add("words-in"); }); }, 4200);

    /* Process timeline draws in */
    $all(".process").forEach(function (p) {
      var po = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { p.classList.add("drawn"); po.disconnect(); } }); }, { threshold: 0.35 });
      po.observe(p);
      setTimeout(function () { p.classList.add("drawn"); }, 4200);
    });

    /* Prices count up when a package carousel comes into view */
    $all(".carousel--plans").forEach(function (car) {
      var done = false;
      function run() {
        if (done) return; done = true;
        $all(".price b", car).forEach(function (b) {
          var txt = b.textContent, target = parseInt(txt.replace(/[^0-9]/g, ""), 10);
          if (!target) return;
          var start = null, dur = 1100;
          b.style.minWidth = b.offsetWidth + "px";
          function tick(t) {
            if (!start) start = t;
            var k = Math.min(1, (t - start) / dur), e = 1 - Math.pow(1 - k, 3);
            b.textContent = "$" + Math.round(target * e).toLocaleString("en-US");
            if (k < 1) requestAnimationFrame(tick); else b.textContent = txt;
          }
          requestAnimationFrame(tick);
        });
      }
      var co = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { run(); co.disconnect(); } }); }, { threshold: 0.3 });
      co.observe(car);
    });
  }

  if (fine) {
    /* Cursor spotlight on cards and dark bands */
    var spots = $all(".service-card, .plan, .tcard2, .term, .channel, .band--navy, .cta-band");
    spots.forEach(function (el) {
      el.classList.add("spot");
      el.addEventListener("pointermove", function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty("--mx", (e.clientX - r.left) + "px");
        el.style.setProperty("--my", (e.clientY - r.top) + "px");
      });
    });

    /* Magnetic buttons */
    $all(".btn--primary, .carousel-btn, .wa-btn").forEach(function (b) {
      b.addEventListener("pointermove", function (e) {
        var r = b.getBoundingClientRect();
        var x = (e.clientX - r.left - r.width / 2) * 0.18, y = (e.clientY - r.top - r.height / 2) * 0.28;
        b.style.setProperty("--bx", x.toFixed(1) + "px"); b.style.setProperty("--by", y.toFixed(1) + "px");
      });
      b.addEventListener("pointerleave", function () { b.style.setProperty("--bx", "0px"); b.style.setProperty("--by", "0px"); });
    });
  }

  /* Hero parallax on scroll */
  var art = document.querySelector(".hero-art");
  if (art) {
    var tk = false;
    window.addEventListener("scroll", function () {
      if (tk) return; tk = true;
      requestAnimationFrame(function () { tk = false; var y = Math.min(window.scrollY, 900); art.style.setProperty("--py", (y * -0.08).toFixed(1) + "px"); });
    }, { passive: true });
  }

  /* Smooth fade between pages */
  document.addEventListener("click", function (e) {
    var a = e.target.closest("a[href]");
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    var href = a.getAttribute("href");
    if (!href || a.target === "_blank" || href.charAt(0) === "#" || /^(mailto:|tel:|https?:)/i.test(href)) return;
    var path = href.split("#")[0];
    if (!path || path === location.pathname.split("/").pop()) return;
    e.preventDefault();
    root.classList.add("leaving");
    setTimeout(function () { location.href = href; }, 260);
  });
  window.addEventListener("pageshow", function () { root.classList.remove("leaving"); });
})();

/* Swipe hints under horizontal rows on phones */
(function () {
  var arrow = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>';
  Array.prototype.slice.call(document.querySelectorAll(".services-grid, .xp, .works")).forEach(function (row) {
    var hint = document.createElement("p");
    hint.className = "swipe-hint"; hint.setAttribute("aria-hidden", "true");
    hint.innerHTML = "Swipe to see more " + arrow;
    row.parentNode.insertBefore(hint, row.nextSibling);
  });
})();

/* Cookie consent + analytics events */
(function () {
  function g() { if (typeof window.gtag === "function") window.gtag.apply(null, arguments); }
  var box = document.getElementById("cookie");
  var stored = null;
  try { stored = localStorage.getItem("bma-consent"); } catch (e) {}
  function show() { if (box) box.hidden = false; }
  function hide() { if (box) box.hidden = true; }
  if (box && !stored) setTimeout(show, 1200);
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-consent]");
    if (b) {
      var yes = b.getAttribute("data-consent") === "yes";
      try { localStorage.setItem("bma-consent", yes ? "yes" : "no"); } catch (err) {}
      g("consent", "update", { analytics_storage: yes ? "granted" : "denied" });
      hide();
      return;
    }
    if (e.target.closest("[data-cookie-settings]")) { show(); return; }

    /* Track contact intent */
    var a = e.target.closest("a[href]");
    if (!a) return;
    var href = a.getAttribute("href") || "";
    if (href.indexOf("wa.me/") > -1) g("event", "whatsapp_click", { link_url: href, page_path: location.pathname });
    else if (href.indexOf("mailto:") === 0) g("event", "email_click", { page_path: location.pathname });
    else if (/contact\.html/.test(href) && a.classList.contains("btn")) g("event", "cta_click", { link_text: (a.textContent || "").trim().slice(0, 60), page_path: location.pathname });
  });
  var form = document.getElementById("contact-form");
  if (form) form.addEventListener("submit", function () {
    setTimeout(function () {
      if (!document.querySelector(".field.invalid")) {
        var sel = document.getElementById("f-service");
        g("event", "generate_lead", { service: sel ? sel.value : "", page_path: location.pathname });
      }
    }, 0);
  });
  var leak = document.querySelector(".lc-cta");
  if (leak) leak.addEventListener("click", function () { g("event", "store_check_cta", {}); });
})();

/* Proposal request form (short lead form) */
(function () {
  "use strict";
  var form = document.getElementById("review-form");
  if (!form) return;
  var CONFIG = window.BMA_CONFIG || { formEndpoint: "", email: "support@brainiacmarketingagency.com", whatsapp: [{ number: "18592109302", display: "+1 859-210-9302" }] };
  var result = document.getElementById("review-result");
  function el(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  var rules = {
    "r-url": function (v) { v = v.trim(); return /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/\S*)?$/i.test(v) ? "" : "Enter your store's web address, for example yourstore.com."; },
    "r-name": function (v) { return v.trim().length >= 2 ? "" : "Enter your name."; },
    "r-email": function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Enter a valid email address, for example you@yourstore.com."; },
    "r-challenge": function (v) { return v ? "" : "Choose your main challenge."; },
    "r-consent": function () { return el("r-consent").checked ? "" : "Please tick the box so we can contact you about your request."; }
  };
  function setErr(id, msg) {
    var input = el(id), field = input.closest(".field"), err = field.querySelector(".error");
    field.classList.toggle("invalid", !!msg); input.setAttribute("aria-invalid", msg ? "true" : "false");
    if (err) { err.textContent = msg; err.hidden = !msg; }
  }
  function check(id) { var msg = rules[id](el(id).value || ""); setErr(id, msg); return !msg; }
  Object.keys(rules).forEach(function (id) {
    var i = el(id); if (!i) return;
    i.addEventListener(i.type === "checkbox" ? "change" : "blur", function () { if (i.type === "checkbox" || i.value) check(id); });
    i.addEventListener("input", function () { if (i.closest(".field").classList.contains("invalid")) check(id); });
  });
  function vals() {
    return { url: el("r-url").value.trim(), name: el("r-name").value.trim(), email: el("r-email").value.trim(),
             challenge: el("r-challenge").value, details: el("r-details").value.trim() };
  }
  function text(v) {
    return ["Proposal request - Brainiac Marketing Agency", "", "Store: " + v.url, "Name: " + v.name, "Email: " + v.email,
            "Main challenge: " + v.challenge, "Details: " + (v.details || "None")].join("\n");
  }
  function show(html, cls) { result.className = "result " + cls; result.innerHTML = html; result.hidden = false; result.setAttribute("tabindex", "-1"); result.focus(); }
  function ready(v, failed) {
    var t = text(v);
    var wa = "https://wa.me/" + CONFIG.whatsapp[0].number + "?text=" + encodeURIComponent(t);
    show((failed ? "<h3>We couldn't send your request, but it's saved below</h3>" : "<h3>Your request is ready to send</h3>") +
      "<p>Please try again in a moment, or send it to us another way.</p><pre id=\"review-text\">" + esc(t) + "</pre>" +
      window.BMA_sendOptions("Proposal request: " + v.url, t, "review-text"), "result--ready");
    form.hidden = true;
  }
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (el("r-company") && el("r-company").value) return;
    var ok = Object.keys(rules).map(check).every(Boolean);
    if (!ok) { var f = form.querySelector(".field.invalid input, .field.invalid select"); if (f) f.focus(); return; }
    var v = vals();
    if (typeof window.gtag === "function") window.gtag("event", "generate_lead", { form: "proposal_request", challenge: v.challenge });
    if (!CONFIG.formEndpoint) { ready(v, false); return; }
    var btn = form.querySelector("button[type=submit]"), label = btn.textContent;
    btn.disabled = true; btn.textContent = "Sending…";
    window.BMA_post({ method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ form: "Proposal request", store: v.url, name: v.name, email: v.email, challenge: v.challenge, message: v.details, consent: "yes", _subject: "Proposal request: " + v.url }) })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        form.hidden = true;
        show("<h3>Thanks, " + esc(v.name.split(" ")[0]) + ". Your request is in.</h3><p>We'll review <b>" + esc(v.url) + "</b> and email your proposal to <b>" + esc(v.email) + "</b> within 3 business days. If you have a question in the meantime, message us on WhatsApp at " + esc(CONFIG.whatsapp[0].display) + ".</p>", "result--ok");
      })
      .catch(function () { ready(v, true); })
      .then(function () { btn.disabled = false; btn.textContent = label; });
  });
})();

/* Booking page: Calendly embed when configured, honest time request otherwise */
(function () {
  "use strict";
  var page = document.getElementById("book-request");
  if (!page) return;
  var CONFIG = window.BMA_CONFIG || {};
  function el(id) { return document.getElementById(id); }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }

  // Which topic brought them here (?topic=growth-package etc.)
  var topic = "";
  try { topic = new URLSearchParams(location.search).get("topic") || ""; } catch (e) {}
  var reasonSel = el("b-reason"), reasonText = "";
  if (topic && reasonSel) {
    Array.prototype.forEach.call(reasonSel.options, function (o) { if (o.getAttribute("data-slug") === topic) { reasonSel.value = o.value; reasonText = o.value; } });
  }

  if (CONFIG.consultFee) el("book-fee").textContent = CONFIG.consultFee + " for a 30-minute consultation, paid when you book.";

  // Live scheduler
  if (CONFIG.calendlyUrl) {
    var url = CONFIG.calendlyUrl + (CONFIG.calendlyUrl.indexOf("?") > -1 ? "&" : "?") +
      "embed_domain=" + encodeURIComponent(location.hostname || "brainiacmarketingagency.com") +
      "&embed_type=Inline&hide_gdpr_banner=1" + (reasonText ? "&a2=" + encodeURIComponent(reasonText) : "");
    var f = document.createElement("iframe");
    f.src = url; f.title = "Choose a consultation time"; f.loading = "lazy";
    f.setAttribute("allow", "payment");
    el("book-embed").appendChild(f);
    el("book-direct").href = CONFIG.calendlyUrl;
    el("book-scheduler").hidden = false;
    page.hidden = true;
    window.addEventListener("message", function (e) {
      if (e.origin !== "https://calendly.com" || !e.data || e.data.event !== "calendly.event_scheduled") return;
      if (typeof window.gtag === "function") window.gtag("event", "consultation_booked", { topic: reasonText || topic });
    });
    return;
  }

  // Time request (not a booking)
  var form = el("book-form"), result = el("book-result");
  var rules = {
    "b-name": function (v) { return v.trim().length >= 2 ? "" : "Enter your full name."; },
    "b-email": function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Enter a valid email address, for example you@yourstore.com."; },
    "b-country": function (v) { return v ? "" : "Choose your country."; },
    "b-url": function (v) { return /^(https?:\/\/)?([a-z0-9-]+\.)+[a-z]{2,}(\/\S*)?$/i.test(v.trim()) ? "" : "Enter your business or store web address, for example yourstore.com."; },
    "b-reason": function (v) { return v ? "" : "Choose the main reason for booking."; },
    "b-times": function (v) { return v.trim().length >= 3 ? "" : "Pick a preferred date and time."; },
    "b-consent": function () { return el("b-consent").checked ? "" : "Please tick the box so we can contact you to arrange the call."; }
  };
  function setErr(id, msg) {
    var i = el(id), fld = i.closest(".field"), er = fld.querySelector(".error");
    fld.classList.toggle("invalid", !!msg); i.setAttribute("aria-invalid", msg ? "true" : "false");
    if (er) { er.textContent = msg; er.hidden = !msg; }
  }
  function check(id) { var m = rules[id](el(id).value || ""); setErr(id, m); return !m; }
  Object.keys(rules).forEach(function (id) {
    var i = el(id);
    i.addEventListener(i.type === "checkbox" ? "change" : "blur", function () { if (i.type === "checkbox" || i.value) check(id); });
    i.addEventListener("input", function () { if (i.closest(".field").classList.contains("invalid")) check(id); });
  });
  function show(html, cls) { result.className = "result " + cls; result.innerHTML = html; result.hidden = false; result.setAttribute("tabindex", "-1"); result.focus(); }
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    if (el("b-company").value) return;
    var ok = Object.keys(rules).map(check).every(Boolean);
    if (!ok) { var first = form.querySelector(".field.invalid input:not([type=hidden]), .field.invalid select"); if (first && !first.closest('.slot-field')) first.focus(); return; }
    var v = { name: el("b-name").value.trim(), email: el("b-email").value.trim(), country: el("b-country").value, url: el("b-url").value.trim(), reason: el("b-reason").value, times: el("b-times").value.trim() };
    if (typeof window.gtag === "function") window.gtag("event", "consultation_request", { reason: v.reason });
    var text = ["Consultation time request - Brainiac Marketing Agency", "", "Name: " + v.name, "Email: " + v.email, "Country: " + v.country, "Store: " + v.url,
                "Reason: " + v.reason, "Preferred date and time: " + v.times, "", "Duration: 30 minutes, Google Meet"].join("\n");
    function liveWork() {
      var stores = [["The Pet &amp; Home Store", "https://thepetandhomestore.com/"], ["Paws and Whiskers", "https://pawsandwhiskerspet.com/"], ["Robin's Nest Home", "https://robinsnesthome.com/"]];
      return "<div class=\"live-work\"><b>While you wait, see our work live</b><ul>" + stores.map(function (x) {
        return "<li><a href=\"" + x[1] + "\" target=\"_blank\" rel=\"noopener\">" + x[0] + " <span aria-hidden=\"true\">&#8599;</span></a></li>";
      }).join("") + "</ul></div>";
    }
    var startISO = el("b-times").getAttribute("data-start");
    function stamp(d) { return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); }
    var cal = null;
    if (startISO) {
      var st = new Date(startISO), en = new Date(st.getTime() + 30 * 60000);
      var title = "Brainiac Marketing consultation (pending confirmation)";
      var details = "Your requested 30-minute consultation with Brainiac Marketing Agency about " + v.url + ".\n\n" +
        "We'll email " + v.email + " to confirm this time, the fee and your Google Meet link. The booking is final once we confirm.\n\n" +
        "See our work live:\n- The Pet & Home Store: https://thepetandhomestore.com/\n- Paws and Whiskers: https://pawsandwhiskerspet.com/\n- Robin's Nest Home: https://robinsnesthome.com/\n\n" +
        "Questions? Email " + CONFIG.email + " or WhatsApp +1 859-210-9302.";
      var g = "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + encodeURIComponent(title) + "&dates=" + stamp(st) + "/" + stamp(en) + "&details=" + encodeURIComponent(details) + "&location=" + encodeURIComponent("Google Meet (link sent by email)");
      var o = "https://outlook.live.com/calendar/0/deeplink/compose?path=%2Fcalendar%2Faction%2Fcompose&rru=addevent&subject=" + encodeURIComponent(title) + "&startdt=" + encodeURIComponent(st.toISOString()) + "&enddt=" + encodeURIComponent(en.toISOString()) + "&body=" + encodeURIComponent(details) + "&location=" + encodeURIComponent("Google Meet (link sent by email)");
      var ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Brainiac Marketing Agency//Consultation//EN", "BEGIN:VEVENT",
        "UID:" + stamp(st) + "-" + Math.random().toString(36).slice(2) + "@brainiacmarketingagency.com", "DTSTAMP:" + stamp(new Date()),
        "DTSTART:" + stamp(st), "DTEND:" + stamp(en), "SUMMARY:" + title, "DESCRIPTION:" + details.replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;"),
        "LOCATION:Google Meet (link sent by email)",
        "BEGIN:VALARM", "TRIGGER:-P1D", "ACTION:DISPLAY", "DESCRIPTION:Consultation with Brainiac tomorrow", "END:VALARM",
        "BEGIN:VALARM", "TRIGGER:-PT1H", "ACTION:DISPLAY", "DESCRIPTION:Consultation with Brainiac in 1 hour", "END:VALARM",
        "END:VEVENT", "END:VCALENDAR"].join("\r\n");
      cal = { google: g, outlook: o, ics: "data:text/calendar;charset=utf-8," + encodeURIComponent(ics) };
    }
    function calBlock() {
      if (!cal) return "";
      return "<div class=\"add-cal\"><b>Get a reminder</b><p>Save the requested time to your calendar so you get a reminder. We'll update you by email once it's confirmed.</p><div class=\"add-cal-btns\">" +
        "<a class=\"btn btn--primary\" href=\"" + cal.google + "\" target=\"_blank\" rel=\"noopener\" data-cal=\"google\">Google Calendar</a>" +
        "<a class=\"btn btn--ghost-dark\" href=\"" + cal.ics + "\" download=\"brainiac-consultation.ics\" data-cal=\"ics\">Apple / Outlook (.ics)</a>" +
        "<a class=\"btn btn--ghost-dark\" href=\"" + cal.outlook + "\" target=\"_blank\" rel=\"noopener\" data-cal=\"outlook\">Outlook.com</a></div></div>";
    }
    function handoff(failed) {
      show((failed ? "<h3>We couldn't send your request, but it's saved below</h3>" : "<h3>Your request is ready to send</h3>") +
        "<p>Please try again in a moment, or send it to us another way. This is a request, not a confirmed booking.</p>" +
        "<pre id=\"book-text\">" + esc(text) + "</pre>" + window.BMA_sendOptions("Consultation request: " + v.name + " (" + v.country + ")", text, "book-text"), "result--ready");
      form.hidden = true;
    }
    if (!CONFIG.formEndpoint) { handoff(false); return; }
    var btn = form.querySelector("button[type=submit]"), label = btn.textContent;
    btn.disabled = true; btn.textContent = "Sending…";
    window.BMA_post({ method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" },
      body: JSON.stringify({ form: "Consultation request", name: v.name, email: v.email, country: v.country, store: v.url, reason: v.reason, preferred_times: v.times, add_to_your_calendar: cal ? cal.google.replace("(pending%20confirmation)", "-%20" + encodeURIComponent(v.name)) : "", consent: "yes", _subject: "Consultation request: " + v.name + " (" + v.country + ")" }) })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        form.hidden = true;
        show("<h3>Request received, " + esc(v.name.split(" ")[0]) + "</h3><p>This is not a confirmed booking yet. We'll email <b>" + esc(v.email) + "</b> to confirm a time and the fee before anything is final.</p>" + calBlock() + liveWork(), "result--ok");
        if (typeof window.gtag === "function") document.querySelectorAll("[data-cal]").forEach(function (a) { a.addEventListener("click", function () { window.gtag("event", "add_to_calendar", { calendar: a.getAttribute("data-cal") }); }); });
      })
      .catch(function () { handoff(true); })
      .then(function () { btn.disabled = false; btn.textContent = label; });
  });
})();

/* Booking page: date and time picker for the time request */
(function () {
  "use strict";
  var grid = document.getElementById("b-cal-grid");
  if (!grid) return;
  var monthEl = document.getElementById("b-cal-month"), slotsEl = document.getElementById("b-slots");
  var hidden = document.getElementById("b-times"), picked = document.getElementById("b-picked"), tzEl = document.getElementById("b-tz");
  var CONFIG = window.BMA_CONFIG || {};
  var DAYS = CONFIG.bookingDays || [1, 2, 3, 4, 5];          // Mon-Fri
  var START = CONFIG.bookingStartHour || 9, END = CONFIG.bookingEndHour || 18, STEP = 30, AHEAD = 45;
  var tz = "your local time";
  try { tz = Intl.DateTimeFormat().resolvedOptions().timeZone || tz; } catch (e) {}
  tzEl.textContent = "(" + tz.replace(/_/g, " ") + ")";

  var today = new Date(); today.setHours(0, 0, 0, 0);
  var first = new Date(today); first.setDate(first.getDate() + 1);
  var last = new Date(today); last.setDate(last.getDate() + AHEAD);
  var view = new Date(first.getFullYear(), first.getMonth(), 1);
  var selDate = null, selTime = null;
  // If almost no bookable days are left this month, open on next month
  (function () {
    var n = 0, d = new Date(first);
    while (d.getMonth() === first.getMonth()) { if (allowedEarly(d)) n++; d.setDate(d.getDate() + 1); }
    if (n < 3) view = new Date(first.getFullYear(), first.getMonth() + 1, 1);
    function allowedEarly(x) { return x >= first && x <= last && DAYS.indexOf(x.getDay()) > -1; }
  })();

  function sameDay(a, b) { return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
  function allowed(d) { return d >= first && d <= last && DAYS.indexOf(d.getDay()) > -1; }
  function fmtDate(d) { return d.toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long", year: "numeric" }); }
  function fmtTime(h, m) { var d = new Date(2000, 0, 1, h, m); return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }); }

  function update() {
    if (selDate && selTime) {
      var txt = fmtDate(selDate) + ", " + fmtTime(selTime[0], selTime[1]) + " (" + tz.replace(/_/g, " ") + ")";
      hidden.value = txt; picked.textContent = "Selected: " + txt;
      hidden.setAttribute("data-start", new Date(selDate.getFullYear(), selDate.getMonth(), selDate.getDate(), selTime[0], selTime[1]).toISOString());
    } else { hidden.value = ""; picked.textContent = ""; hidden.removeAttribute("data-start"); }
    hidden.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function renderSlots() {
    slotsEl.innerHTML = "";
    if (!selDate) { slotsEl.innerHTML = '<p class="slots-empty">Pick a date first.</p>'; return; }
    for (var m = START * 60; m < END * 60; m += STEP) {
      var h = Math.floor(m / 60), mi = m % 60;
      var b = document.createElement("button");
      b.type = "button"; b.className = "slot"; b.textContent = fmtTime(h, mi);
      var on = selTime && selTime[0] === h && selTime[1] === mi;
      b.setAttribute("aria-pressed", on ? "true" : "false");
      (function (hh, mm) { b.addEventListener("click", function () { selTime = [hh, mm]; renderSlots(); update(); }); })(h, mi);
      slotsEl.appendChild(b);
    }
  }

  function renderCal() {
    monthEl.textContent = view.toLocaleDateString(undefined, { month: "long", year: "numeric" });
    grid.innerHTML = "";
    var lead = (new Date(view.getFullYear(), view.getMonth(), 1).getDay() + 6) % 7;
    for (var i = 0; i < lead; i++) { var sp = document.createElement("span"); sp.className = "cal-pad"; grid.appendChild(sp); }
    var dim = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
    for (var dnum = 1; dnum <= dim; dnum++) {
      var d = new Date(view.getFullYear(), view.getMonth(), dnum);
      var b = document.createElement("button");
      b.type = "button"; b.className = "cal-day"; b.textContent = dnum;
      b.setAttribute("aria-label", fmtDate(d));
      if (!allowed(d)) { b.disabled = true; }
      if (sameDay(d, selDate)) b.setAttribute("aria-pressed", "true"); else b.setAttribute("aria-pressed", "false");
      if (sameDay(d, today)) b.classList.add("is-today");
      (function (dd) { b.addEventListener("click", function () { selDate = dd; selTime = null; renderCal(); renderSlots(); update(); var s = slotsEl.querySelector(".slot"); if (s) s.focus({ preventScroll: true }); }); })(d);
      grid.appendChild(b);
    }
    var prev = document.querySelector('.cal-nav[data-cal="-1"]'), next = document.querySelector('.cal-nav[data-cal="1"]');
    prev.disabled = view <= new Date(first.getFullYear(), first.getMonth(), 1);
    next.disabled = view >= new Date(last.getFullYear(), last.getMonth(), 1);
  }
  Array.prototype.forEach.call(document.querySelectorAll(".cal-nav"), function (n) {
    n.addEventListener("click", function () { view = new Date(view.getFullYear(), view.getMonth() + parseInt(n.getAttribute("data-cal"), 10), 1); renderCal(); });
  });
  // If submitted without a slot, move focus to the calendar
  var form = document.getElementById("book-form");
  if (form) form.addEventListener("submit", function () {
    setTimeout(function () { if (!hidden.value) { var d = grid.querySelector(".cal-day:not([disabled])"); if (d) d.focus(); } }, 0);
  });
  renderCal(); renderSlots();
})();


/* Country dropdowns: full list in the visitor's language, best guess preselected */
(function () {
  var sels = document.querySelectorAll("select[data-countries]");
  if (!sels.length) return;
  var codes = "AF AL DZ AD AO AG AR AM AU AT AZ BS BH BD BB BY BE BZ BJ BT BO BA BW BR BN BG BF BI CV KH CM CA CF TD CL CN CO KM CG CD CR CI HR CU CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FJ FI FR GA GM GE DE GH GR GD GT GN GW GY HT HN HK HU IS IN ID IR IQ IE IL IT JM JP JO KZ KE KI KW KG LA LV LB LS LR LY LI LT LU MO MG MW MY MV ML MT MH MR MU MX FM MD MC MN ME MA MZ MM NA NR NP NL NZ NI NE NG KP MK NO OM PK PW PS PA PG PY PE PH PL PT PR QA RO RU RW KN LC VC WS SM ST SA SN RS SC SL SG SK SI SB SO ZA KR SS ES LK SD SR SE CH SY TW TJ TZ TH TL TG TO TT TN TR TM TV UG UA AE GB US UY UZ VU VA VE VN YE ZM ZW".split(" ");
  var names;
  try { var dn = new Intl.DisplayNames([navigator.language || "en"], { type: "region" }); names = codes.map(function (c) { return [c, dn.of(c)]; }); }
  catch (e) { names = codes.map(function (c) { return [c, c]; }); }
  names.sort(function (a, b) { return a[1].localeCompare(b[1]); });
  var guess = "";
  try { var m = (navigator.language || "").match(/-([A-Z]{2})$/i); if (m) guess = m[1].toUpperCase(); } catch (e) {}
  Array.prototype.forEach.call(sels, function (sel) {
    names.forEach(function (n) { var o = document.createElement("option"); o.value = n[1]; o.textContent = n[1]; if (n[0] === guess) o.selected = true; sel.appendChild(o); });
  });
})();
