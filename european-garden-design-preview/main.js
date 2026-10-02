(() => {
  "use strict";

  // PREVIEW MODE: the consultation form shows a confirmation but sends nothing.
  // When switching on Netlify Forms (see the comment above the <form> in index.html), set this to false.
  const PREVIEW_MODE = true;

  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];

  const year = $("#year");
  if (year) year.textContent = new Date().getFullYear();

  /* Mobile nav */
  const toggle = $(".nav-toggle");
  const list = $("#nav-list");
  const setNav = (open) => { toggle.setAttribute("aria-expanded", String(open)); list.classList.toggle("open", open); };
  toggle.addEventListener("click", () => setNav(toggle.getAttribute("aria-expanded") !== "true"));
  list.addEventListener("click", (e) => { if (e.target.closest("a")) setNav(false); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") setNav(false); });

  /* Scroll fade-ins */
  const reveals = $$(".reveal");
  if ("IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); } });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("in"));
  }

  /* Sticky mobile call bar: appears once the hero is scrolled past */
  const callbar = $(".callbar");
  const hero = $(".hero");
  if (callbar && hero && "IntersectionObserver" in window) {
    new IntersectionObserver(([en]) => callbar.classList.toggle("show", !en.isIntersecting), { threshold: 0.15 }).observe(hero);
  } else if (callbar) {
    callbar.classList.add("show");
  }

  /* Before/after sliders */
  $$(".ba-frame").forEach((frame) => {
    const range = $(".ba-range", frame);
    const set = (v) => frame.style.setProperty("--pos", v + "%");
    range.addEventListener("input", () => set(range.value));
  });

  /* Pond stages */
  const pond = $(".pond");
  if (pond) {
    const imgs = $$(".pond-stage img", pond);
    const btns = $$(".pond-steps button", pond);
    btns.forEach((b) => b.addEventListener("click", () => {
      const i = Number(b.dataset.stage);
      imgs.forEach((img, j) => img.classList.toggle("is-on", i === j));
      btns.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
    }));
  }

  /* Testimonials: read more */
  $$(".t-more").forEach((btn) => {
    btn.addEventListener("click", () => {
      const full = document.getElementById(btn.getAttribute("aria-controls"));
      const open = btn.getAttribute("aria-expanded") !== "true";
      const pull = $(".t-pull", btn.parentElement);
      full.hidden = !open;
      if (pull) pull.hidden = open;
      btn.setAttribute("aria-expanded", String(open));
      btn.textContent = open ? "Show less" : "Read more";
    });
  });

  /* Gallery filter */
  const INITIAL = 16;
  const items = $$(".g-item");
  const tabs = $$(".g-tabs button");
  const more = $(".g-more");
  let expanded = false;
  let filter = "all";
  const seen = new Set();
  const applyFilter = () => {
    let shown = 0;
    seen.clear();
    items.forEach((li) => {
      const href = $("a", li).getAttribute("href");
      let match = filter === "all" ? !seen.has(href) : li.dataset.cat === filter;
      if (filter === "all") seen.add(href);
      if (match && filter === "all" && !expanded && shown >= INITIAL) match = false;
      if (match) shown++;
      li.classList.toggle("is-hidden", !match);
    });
    more.hidden = !(filter === "all" && !expanded);
  };
  tabs.forEach((t) => t.addEventListener("click", () => {
    filter = t.dataset.filter;
    tabs.forEach((x) => x.setAttribute("aria-pressed", String(x === t)));
    applyFilter();
  }));
  more.addEventListener("click", () => { expanded = true; applyFilter(); });
  applyFilter();

  /* Lightbox */
  const lb = $("#lightbox");
  const lbImg = $("img", lb);
  const lbCap = $("figcaption", lb);
  let group = [];
  let idx = 0;
  const show = (i) => {
    idx = (i + group.length) % group.length;
    const a = group[idx];
    lbImg.src = a.getAttribute("href");
    lbImg.alt = a.dataset.caption || "";
    lbCap.textContent = a.dataset.caption || "";
    const multi = group.length > 1;
    $(".lb-prev", lb).hidden = !multi;
    $(".lb-next", lb).hidden = !multi;
  };
  const open = (a, set) => {
    group = set; show(set.indexOf(a));
    if (typeof lb.showModal === "function") lb.showModal(); else window.open(a.href, "_blank");
  };
  document.addEventListener("click", (e) => {
    const a = e.target.closest(".g-item a, .concept-link");
    if (!a) return;
    e.preventDefault();
    const set = a.classList.contains("concept-link") ? [a] : items.filter((li) => !li.classList.contains("is-hidden")).map((li) => $("a", li));
    open(a, set);
  });
  $(".lb-close", lb).addEventListener("click", () => lb.close());
  $(".lb-prev", lb).addEventListener("click", () => show(idx - 1));
  $(".lb-next", lb).addEventListener("click", () => show(idx + 1));
  lb.addEventListener("click", (e) => { if (e.target === lb) lb.close(); });
  lb.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") show(idx - 1);
    if (e.key === "ArrowRight") show(idx + 1);
  });
  let tx = null;
  lb.addEventListener("touchstart", (e) => { tx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener("touchend", (e) => {
    if (tx === null) return;
    const dx = e.changedTouches[0].clientX - tx;
    if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
    tx = null;
  });

  /* Consultation form (preview: nothing is sent) */
  const form = $("#consult-form");
  const done = $("#form-done");
  const err = $(".form-error", form);
  form.addEventListener("submit", (e) => {
    const required = $$("[required]", form);
    let firstBad = null;
    required.forEach((f) => {
      const bad = !f.value.trim() || (f.type === "email" && !f.checkValidity());
      f.setAttribute("aria-invalid", String(bad));
      if (bad && !firstBad) firstBad = f;
    });
    if (firstBad) {
      e.preventDefault();
      err.textContent = "Please add your name, phone and a valid email so Ronald can reach you.";
      err.hidden = false;
      firstBad.focus();
      return;
    }
    err.hidden = true;
    if (!PREVIEW_MODE) return; // Let Netlify Forms handle the POST.
    e.preventDefault();
    const name = $("#f-name").value.trim().split(/\s+/)[0];
    $(".done-name", done).textContent = name ? ", " + name : "";
    form.hidden = true;
    done.hidden = false;
    done.focus();
  });
  $("#form-reset").addEventListener("click", () => {
    form.reset();
    $$("[aria-invalid]", form).forEach((f) => f.removeAttribute("aria-invalid"));
    done.hidden = true;
    form.hidden = false;
    $("#f-name").focus();
  });
})();
