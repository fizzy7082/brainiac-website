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
