// FATHI AFIQ — PORTFOLIO
// Shared by every page. Each feature only runs if its elements exist.

// PERFORMANCE: adaptive "lite" mode (no drifting glows, grain or glass blur).
(() => {
  const root = document.documentElement;
  const get = (store, key) => { try { return window[store].getItem(key); } catch { return null; } };
  const set = (store, key, val) => { try { window[store].setItem(key, val); } catch {} };

  const chosen = get("localStorage", "fa-lite");
  const force = new URLSearchParams(location.search).get("lite");
  const c = navigator.connection;
  const weak = (navigator.deviceMemory && navigator.deviceMemory <= 4) ||
               (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) ||
               (c && c.saveData) || get("sessionStorage", "fa-lite-auto") === "1";

  let lite = weak;
  if (force === "1") lite = true;
  if (force === "0") lite = false;
  if (chosen === "1") lite = true;
  if (chosen === "0") lite = false;
  if (lite) root.classList.add("lite");

  if (!lite && chosen === null && force === null && get("sessionStorage", "fa-lite-ok") !== "1") {
    addEventListener("load", () => setTimeout(() => {
      if (document.hidden) return;
      const times = [];
      let last = performance.now();
      const step = now => {
        times.push(now - last);
        last = now;
        if (times.length < 90) { requestAnimationFrame(step); return; }
        const t = times.slice(5).sort((x, y) => x - y);
        if (t[Math.floor(t.length / 2)] > 28) {
          root.classList.add("lite");
          set("sessionStorage", "fa-lite-auto", "1");
        } else {
          set("sessionStorage", "fa-lite-ok", "1");
        }
      };
      requestAnimationFrame(step);
    }, 2500));
  }
})();

// Background orbs (the soft colour behind the glass). Purely decorative.
(() => {
  const a = document.createElement("div");
  a.className = "atmos";
  a.setAttribute("aria-hidden", "true");
  a.innerHTML = '<i class="o1"></i><i class="o2"></i><i class="o3"></i><i class="o4"></i><i class="o5"></i>';
  document.body.prepend(a);
})();

// ---------------------------------------------------------------
// PEN-TOOL FA LOADING SCREEN: plays once per visit (snappy ~850ms).
// Draws the FA monogram with vector anchor squares & crop marks, then splits open.
// Skipped for repeat pages in the same visit and for visitors who prefer reduced motion.
// ---------------------------------------------------------------
(() => {
  const root = document.documentElement;
  let skip = matchMedia("(prefers-reduced-motion: reduce)").matches;
  try {
    skip = skip || sessionStorage.getItem("fa-loader") === "1";
    sessionStorage.setItem("fa-loader", "1");
  } catch { skip = true; }
  if (skip) { root.classList.add("ready"); return; }

  const anchors = [[22,130,.12],[22,30,.24],[68,30,.36],[22,80,.3],[60,80,.44],[88,130,.4],[122,30,.54],[156,130,.68],[98,100,.62],[146,100,.72]]
    .map(([x, y, d]) => `<rect class="anchor" x="${x - 3.5}" y="${y - 3.5}" width="7" height="7" style="--d:${d}s"/>`).join("");

  const loader = document.createElement("div");
  loader.className = "loader";
  loader.setAttribute("aria-hidden", "true");
  loader.innerHTML = `
    <div class="lp top"></div><div class="lp bot"></div>
    <div class="guide h"></div><div class="guide v"></div>
    <svg class="pen" viewBox="0 0 180 160" aria-hidden="true">
      <defs><linearGradient id="penGrad" gradientUnits="userSpaceOnUse" x1="20" y1="30" x2="160" y2="130"><stop offset="0" stop-color="#c3adff"/><stop offset="1" stop-color="#9b7bff"/></linearGradient></defs>
      <path class="crop" d="M2 14V2H14M166 2H178V14M178 146V158H166M14 158H2V146"/>
      <path class="glyph" pathLength="1" style="--d:.12s;--t:.28s" d="M22 130V30H68"/>
      <path class="glyph" pathLength="1" style="--d:.32s;--t:.18s" d="M22 80H60"/>
      <path class="glyph" pathLength="1" style="--d:.42s;--t:.32s" d="M88 130L122 30L156 130"/>
      <path class="glyph" pathLength="1" style="--d:.64s;--t:.16s" d="M98 100H146"/>
      <path class="handle" style="--d:.6s" d="M100 30H144"/>
      <circle class="knob" style="--d:.6s" cx="100" cy="30" r="3"/><circle class="knob" style="--d:.6s" cx="144" cy="30" r="3"/>
      ${anchors}
    </svg>
    <div class="meta"><div class="pct">0</div><span class="lbl">Loading portfolio</span><div class="bar"><i></i></div></div>`;
  document.body.prepend(loader);
  root.classList.add("ready", "is-loading");

  const pct = loader.querySelector(".pct");
  const barFill = loader.querySelector(".bar i");
  const MIN = 850, MAX = 3200;
  let loaded = document.readyState === "complete";
  addEventListener("load", () => { loaded = true; });
  const t0 = performance.now();

  const finish = () => {
    pct.textContent = "100";
    if (barFill) barFill.style.transform = "scaleX(1)";
    setTimeout(() => {
      loader.classList.add("out");
      root.classList.remove("is-loading");
      setTimeout(() => loader.remove(), 950);
    }, 110);
  };

  const tick = now => {
    const t = now - t0;
    let p = Math.min(1, t / MIN);
    if (!loaded && t < MAX) p = Math.min(p, 0.92);
    const e = 1 - Math.pow(1 - p, 2);
    if (barFill) barFill.style.transform = `scaleX(${e})`;
    pct.textContent = Math.round(e * 100);
    if ((p >= 1 && loaded) || t >= MAX) return finish();
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})();

document.addEventListener("DOMContentLoaded", () => {
  const prefersReduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = () => matchMedia("(hover: hover) and (pointer: fine)").matches;

  // PROFILE PHOTO: tries profile.webp, .jpg, .jpeg, .png
  const photo = document.querySelector(".avatar img");
  if (photo && !photo.getAttribute("src")) {
    const base = "assets/images/profile/profile";
    const types = ["webp", "jpg", "jpeg", "png"];
    let t = 0;
    photo.addEventListener("error", () => {
      t++;
      if (t < types.length) photo.src = `${base}.${types[t]}`;
      else photo.remove();
    });
    photo.src = `${base}.${types[0]}`;
  }

  // ROLE TICKER: repeat list once for seamless loop
  document.querySelectorAll(".ticker-track").forEach(t => { t.innerHTML += t.innerHTML; });

  // SIDEBAR TOOLTIPS: initial hover delay, then instant 0ms switch across adjacent nav icons
  const navRail = document.querySelector(".nav");
  if (navRail) {
    let warmTimer = null;
    navRail.addEventListener("pointerenter", () => {
      if (!finePointer()) return;
      clearTimeout(warmTimer);
      warmTimer = setTimeout(() => navRail.classList.add("tip-warm"), 240);
    });
    navRail.addEventListener("pointerleave", () => {
      clearTimeout(warmTimer);
      navRail.classList.remove("tip-warm");
    });
  }

  // ---------------------------------------------------------------
  // HOME CARD STACK: 1:1 drag + velocity momentum fling + multi-touch guard + keyboard safety
  // ---------------------------------------------------------------
  const slidesBox = document.querySelector(".slides");
  const dotsBox = document.querySelector(".dots");
  let stackTimer;

  const buildStack = () => {
    clearInterval(stackTimer);
    if (!slidesBox || !dotsBox) return;
    const cards = [...slidesBox.querySelectorAll(".slide")];
    if (!cards.length) return;

    cards.forEach(card => {
      if (card.querySelector(".face")) return;
      const face = document.createElement("div");
      face.className = "face";
      face.append(...card.childNodes);
      card.append(face);
    });

    const n = cards.length;
    let current = 0;
    let hovering = false;
    let focused = false;
    let drag = null;
    let blockClick = false;

    const render = () => {
      cards.forEach((c, i) => {
        const pos = (i - current + n) % n;
        c.dataset.pos = pos;
        const isTop = pos === 0;
        const link = c.querySelector(".slide-link");
        if (link) {
          link.tabIndex = isTop ? 0 : -1;
          link.setAttribute("aria-hidden", String(!isTop));
        }
        c.setAttribute("aria-hidden", String(!isTop));
      });
      [...dotsBox.children].forEach((d, k) => {
        d.classList.toggle("on", k === current);
        d.setAttribute("aria-current", k === current ? "true" : "false");
      });
    };

    const fling = (card, dx, dy, speed = 0.6) => {
      if (!card) return;
      const len = Math.hypot(dx, dy) || 1;
      const dur = Math.max(240, Math.min(420, Math.round(420 - speed * 140)));
      card.style.zIndex = "9";
      card.style.transition = `transform ${dur}ms cubic-bezier(0.23, 1, 0.32, 1), opacity ${Math.round(dur * 0.85)}ms ease`;
      card.style.transform = `translate(${(dx / len) * 580}px, ${(dy / len) * 580}px) rotate(${Math.max(-22, Math.min(22, dx * 0.05))}deg)`;
      card.style.opacity = "0";
      current = (current + 1) % n;
      render();
      setTimeout(() => {
        card.style.transition = "none";
        card.style.transform = "";
        card.style.opacity = "";
        card.style.zIndex = "";
        void card.offsetWidth;
        card.style.transition = "";
      }, dur + 30);
    };

    dotsBox.replaceChildren();
    cards.forEach((_, k) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute("aria-label", `Show project ${k + 1}`);
      dot.addEventListener("click", () => { current = k; render(); });
      dotsBox.append(dot);
    });

    slidesBox.onpointerdown = e => {
      if (drag) return; // multi-touch protection
      const card = e.target.closest('.slide[data-pos="0"]');
      if (!card || (e.pointerType === "mouse" && e.button !== 0)) return;
      const now = performance.now();
      drag = {
        card,
        id: e.pointerId,
        x: e.clientX,
        y: e.clientY,
        dx: 0,
        dy: 0,
        t0: now,
        hist: [{ x: e.clientX, y: e.clientY, t: now }],
        moved: false
      };
    };

    slidesBox.onpointermove = e => {
      if (drag && e.pointerId === drag.id) {
        drag.dx = e.clientX - drag.x;
        drag.dy = e.clientY - drag.y;
        const now = performance.now();
        drag.hist.push({ x: e.clientX, y: e.clientY, t: now });
        if (drag.hist.length > 5) drag.hist.shift();

        if (!drag.moved && Math.hypot(drag.dx, drag.dy) > 6) {
          drag.moved = true;
          drag.card.classList.add("dragging");
          drag.card.setPointerCapture(e.pointerId);
        }
        if (drag.moved) {
          drag.card.style.transition = "none";
          drag.card.style.transform = `translate(${drag.dx}px, ${drag.dy}px) rotate(${drag.dx * 0.045}deg)`;
        }
        return;
      }

      if (e.pointerType !== "mouse" || prefersReduced() || document.documentElement.classList.contains("lite") || !finePointer()) return;
      const face = slidesBox.querySelector('.slide[data-pos="0"] .face');
      if (!face || !e.target.closest('.slide[data-pos="0"]')) return;
      const r = face.getBoundingClientRect();
      const ry = (((e.clientX - r.left) / r.width - 0.5) * 8).toFixed(2);
      const rx = ((0.5 - (e.clientY - r.top) / r.height) * 8).toFixed(2);
      face.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.03)`;
    };

    const endDrag = e => {
      if (!drag || e.pointerId !== drag.id) return;
      const { card, dx, dy, moved, hist } = drag;
      drag = null;
      card.classList.remove("dragging");
      if (!moved) return;

      blockClick = true;
      setTimeout(() => { blockClick = false; }, 60);

      // Velocity-based momentum dismissal (Apple / Emil Kowalski)
      const first = hist[0];
      const last = hist[hist.length - 1];
      const dt = Math.max(1, last.t - first.t);
      const vx = (last.x - first.x) / dt;
      const vy = (last.y - first.y) / dt;
      const velocity = Math.hypot(vx, vy); // px per ms
      const dist = Math.hypot(dx, dy);

      if (dist > 85 || velocity > 0.22) {
        fling(card, Math.abs(vx) > 0.05 ? vx : dx, Math.abs(vy) > 0.05 ? vy : dy, velocity);
      } else {
        card.style.transition = "transform 360ms cubic-bezier(0.23, 1, 0.32, 1)";
        card.style.transform = "";
        setTimeout(() => { card.style.transition = ""; }, 380);
      }
    };

    slidesBox.onpointerup = endDrag;
    slidesBox.onpointercancel = endDrag;
    slidesBox.addEventListener("click", e => { if (blockClick) { e.preventDefault(); e.stopPropagation(); } }, true);

    slidesBox.onpointerleave = () => {
      hovering = false;
      const face = slidesBox.querySelector('.slide[data-pos="0"] .face');
      if (face) face.style.transform = "";
    };
    slidesBox.onpointerenter = () => { hovering = true; };
    slidesBox.addEventListener("focusin", () => { focused = true; });
    slidesBox.addEventListener("focusout", () => { focused = false; });

    render();
    if (!prefersReduced() && !document.documentElement.classList.contains("lite")) {
      stackTimer = setInterval(() => {
        if (hovering || focused || drag || document.hidden) return;
        fling(cards.find(c => c.dataset.pos === "0"), -0.35, 1, 0.45);
      }, 6500);
    }
  };

  buildStack();

  if (slidesBox) {
    fetch("portfolio.html")
      .then(r => (r.ok ? r.text() : Promise.reject()))
      .then(html => {
        const doc = new DOMParser().parseFromString(html, "text/html");
        const all = [...doc.querySelectorAll(".work")];
        const marked = all.filter(c => c.hasAttribute("data-featured"));
        const list = (marked.length ? marked : all)
          .filter(c => c.dataset.img)
          .slice(0, 6)
          .map(c => ({ card: c, n: all.indexOf(c) }));
        if (!list.length) return;

        slidesBox.replaceChildren(...list.map(({ card, n }, idx) => {
          const fig = document.createElement("figure");
          fig.className = "slide";
          fig.setAttribute("style", card.getAttribute("style") || "");

          const face = document.createElement("div");
          face.className = "face";

          const img = new Image();
          img.src = card.dataset.img;
          img.alt = "";
          img.draggable = false;
          img.decoding = "async";
          if (idx === 0) img.fetchPriority = "high";
          if (card.dataset.pos) img.style.objectPosition = card.dataset.pos;
          img.addEventListener("error", () => img.remove());

          const cap = document.createElement("figcaption");
          cap.textContent = card.dataset.title || "";

          const link = document.createElement("a");
          link.className = "slide-link";
          link.href = `portfolio.html?open=${n}`;
          link.draggable = false;
          link.setAttribute("aria-label", `View project: ${card.dataset.title || ""}`);

          face.append(img, cap, link);
          if (card.dataset.video) {
            const badge = document.createElement("span");
            badge.className = "play";
            badge.setAttribute("aria-hidden", "true");
            badge.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l11 7-11 7z"/></svg>';
            face.append(badge);
          }
          fig.append(face);
          return fig;
        }));
        buildStack();
      })
      .catch(() => {});
  }

  // ---------------------------------------------------------------
  // PORTFOLIO PAGE: Thumbnails, Curated Default Sort, Empty State, 1:1 Swipe Lightbox
  // ---------------------------------------------------------------
  const works = [...document.querySelectorAll(".work")];
  const dlg = document.getElementById("viewer");

  if (works.length && dlg) {
    const filters = [...document.querySelectorAll(".filters button")];
    const count = document.querySelector(".count");
    const labelOf = cat => (filters.find(f => f.dataset.filter === cat) || {}).textContent || "";

    count.textContent = `${works.length} project${works.length === 1 ? "" : "s"}`;

    works.forEach((w, i) => { w.dataset.n = i; });
    const grid = works[0].parentElement;
    const comparers = {
      mine: (a, b) => a.dataset.n - b.dataset.n,
      az: (a, b) => (a.dataset.title || "").localeCompare(b.dataset.title || "", undefined, { sensitivity: "base", numeric: true }),
      za: (a, b) => (b.dataset.title || "").localeCompare(a.dataset.title || "", undefined, { sensitivity: "base", numeric: true })
    };

    const toolrow = document.createElement("div");
    toolrow.className = "toolrow";
    count.before(toolrow);
    toolrow.append(count);
    const sortbar = document.createElement("div");
    sortbar.className = "sortbar";
    sortbar.innerHTML = '<label for="sort">Sort by</label><div class="selectwrap"><select id="sort"><option value="mine">Curated</option><option value="az">A to Z</option><option value="za">Z to A</option></select><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg></div>';
    toolrow.append(sortbar);
    const sorter = sortbar.querySelector("select");

    const emptyBox = document.createElement("div");
    emptyBox.className = "grid-empty";
    emptyBox.hidden = true;
    emptyBox.innerHTML =
      '<h3></h3>' +
      '<p>New projects for this category are currently being prepared and will be uploaded soon.</p>' +
      '<button type="button" class="btn btn-primary" data-reset-filter>View all projects</button>';
    grid.append(emptyBox);
    const emptyHeading = emptyBox.querySelector("h3");
    emptyBox.querySelector("[data-reset-filter]").addEventListener("click", () => {
      filters.find(b => b.dataset.filter === "all")?.click();
    });

    const applySort = () => {
      [...works].sort(comparers[sorter.value]).forEach(w => grid.insertBefore(w, emptyBox));
    };
    sorter.addEventListener("change", applySort);
    applySort();

    works.forEach((w, idx) => {
      const strong = w.querySelector("strong");
      const small = w.querySelector("small");
      if (strong) strong.textContent = w.dataset.title || "";
      if (small) small.textContent = labelOf(w.dataset.cat);
      if (w.dataset.video) {
        const badge = document.createElement("span");
        badge.className = "play";
        badge.setAttribute("aria-hidden", "true");
        badge.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5l11 7-11 7z"/></svg>';
        w.querySelector(".thumb").append(badge);
      }
      if (!w.dataset.img) return;
      const img = new Image();
      img.src = w.dataset.img;
      img.alt = "";
      img.loading = idx < 4 ? "eager" : "lazy";
      img.decoding = "async";
      if (w.dataset.pos) img.style.objectPosition = w.dataset.pos;
      img.addEventListener("error", () => img.remove());
      w.querySelector(".thumb").append(img);
    });

    filters.forEach(btn => btn.addEventListener("click", () => {
      let n = 0;
      filters.forEach(b => b.setAttribute("aria-pressed", String(b === btn)));
      works.forEach(w => {
        const show = btn.dataset.filter === "all" || w.dataset.cat === btn.dataset.filter;
        w.hidden = !show;
        if (show) n++;
      });
      count.textContent = `${n} project${n === 1 ? "" : "s"}`;
      if (n === 0) {
        emptyHeading.textContent = `${btn.textContent.trim()} — coming soon`;
        emptyBox.hidden = false;
      } else {
        emptyBox.hidden = true;
      }
    }));

    const wanted = new URLSearchParams(location.search).get("category");
    const start = filters.find(b => b.dataset.filter === wanted);
    if (start) start.click();

    // ---- VIEWER: View Transitions morph + 1:1 rubber-band swipe + scroll lock ----
    const stage = dlg.querySelector(".v-stage");
    const slot = dlg.querySelector(".v-slide");
    const thumbsBox = dlg.querySelector(".v-thumbs");
    const prevBtn = dlg.querySelector(".v-prev");
    const nextBtn = dlg.querySelector(".v-next");
    const counter = dlg.querySelector(".v-count");
    const metaEl = dlg.querySelector(".v-meta");
    const canMorph = () => "startViewTransition" in document && !prefersReduced();

    let slides = [];
    let current = 0;
    let source = null;

    const show = (n, animate) => {
      current = (n + slides.length) % slides.length;
      const s = slides[current];
      let el;

      if (s.video) {
        const isFile = /\.(mp4|webm|mov)(\?|$)/i.test(s.video);
        el = document.createElement(isFile ? "video" : "iframe");
        el.src = s.video;
        if (isFile) {
          el.controls = true;
          el.playsInline = true;
          el.preload = "metadata";
          if (s.thumb) el.poster = s.thumb;
        } else {
          el.title = source.dataset.title;
          el.allow = "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen";
          el.allowFullscreen = true;
          el.referrerPolicy = "strict-origin-when-cross-origin";
        }
        const [rw, rh] = (source.dataset.ratio || "16/9").split("/").map(Number);
        el.classList.add("is-video");
        el.style.setProperty("--rw", rw || 16);
        el.style.setProperty("--rh", rh || 9);
      } else if (s.src) {
        el = new Image();
        el.src = s.src;
        el.alt = `${source.dataset.title || "Project"} — slide ${current + 1} of ${slides.length}`;
        el.decoding = "async";
        el.draggable = false;
        el.addEventListener("error", () => {
          const note = document.createElement("p");
          note.className = "v-missing";
          note.textContent = "This image could not be loaded.";
          el.replaceWith(note);
        });
      } else {
        el = document.createElement("div");
        el.className = "v-ph";
        el.setAttribute("style", source.getAttribute("style") || "");
      }

      if (animate && !prefersReduced()) el.classList.add("fade-in");
      slot.replaceChildren(el);
      counter.textContent = `${current + 1} / ${slides.length}`;
      thumbsBox.querySelectorAll("button").forEach((b, k) => b.setAttribute("aria-current", String(k === current)));
    };

    const buildSlides = w => {
      const list = [];
      if (w.dataset.video) list.push({ video: w.dataset.video, thumb: w.dataset.img });
      else if (w.dataset.img) list.push({ src: w.dataset.img, thumb: w.dataset.img });
      (w.dataset.more || "").split(",").map(s => s.trim()).filter(Boolean).forEach(src => list.push({ src, thumb: src }));
      return list.length ? list : [{}];
    };

    const openViewer = (w, instant) => {
      source = w;
      slides = buildSlides(w);
      const many = slides.length > 1;

      thumbsBox.replaceChildren(...(many ? slides.map((s, k) => {
        const b = document.createElement("button");
        b.type = "button";
        b.setAttribute("aria-label", `Show item ${k + 1}`);
        if (s.thumb) {
          const t = new Image();
          t.src = s.thumb;
          t.alt = "";
          t.loading = "lazy";
          t.addEventListener("error", () => t.remove());
          b.append(t);
        }
        b.addEventListener("click", () => show(k, true));
        return b;
      }) : []));

      prevBtn.hidden = nextBtn.hidden = counter.hidden = thumbsBox.hidden = !many;
      dlg.querySelector("h2").textContent = w.dataset.title || "";
      metaEl.textContent = w.dataset.meta || "";
      metaEl.hidden = !w.dataset.meta;
      dlg.querySelector(".v-desc").textContent = w.dataset.desc || "";
      show(0, false);
      document.documentElement.classList.add("modal-open");

      if (!canMorph() || instant) {
        dlg.classList.add("pop");
        dlg.showModal();
        return;
      }

      const thumb = w.querySelector(".thumb");
      thumb.style.viewTransitionName = "project";
      document.startViewTransition(() => {
        thumb.style.viewTransitionName = "";
        dlg.showModal();
        if (slot.firstElementChild) slot.firstElementChild.style.viewTransitionName = "project";
      }).finished.finally(() => {
        if (slot.firstElementChild) slot.firstElementChild.style.viewTransitionName = "";
      });
    };

    const closeViewer = () => {
      if (!dlg.open) return;
      if (!canMorph() || !source) { dlg.close(); return; }

      const thumb = source.querySelector(".thumb");
      const el = slot.firstElementChild;
      if (el) el.style.viewTransitionName = "project";
      document.startViewTransition(() => {
        if (el) el.style.viewTransitionName = "";
        dlg.close();
        thumb.style.viewTransitionName = "project";
      }).finished.finally(() => { thumb.style.viewTransitionName = ""; });
    };

    works.forEach(w => w.addEventListener("click", () => openViewer(w)));

    // Direct-transform card tilt (mouse + fine pointer only; no CSS variable inheritance)
    works.forEach(w => {
      w.addEventListener("pointermove", e => {
        if (e.pointerType !== "mouse" || prefersReduced() || document.documentElement.classList.contains("lite") || !finePointer()) return;
        const r = w.getBoundingClientRect();
        const ry = (((e.clientX - r.left) / r.width - 0.5) * 7).toFixed(2);
        const rx = ((0.5 - (e.clientY - r.top) / r.height) * 7).toFixed(2);
        w.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.028)`;
      });
      w.addEventListener("pointerleave", () => { w.style.transform = ""; });
    });

    prevBtn.addEventListener("click", () => show(current - 1, true));
    nextBtn.addEventListener("click", () => show(current + 1, true));
    dlg.querySelector(".v-close").addEventListener("click", closeViewer);
    dlg.addEventListener("click", e => { if (e.target === dlg) closeViewer(); });
    dlg.addEventListener("cancel", e => { e.preventDefault(); closeViewer(); });
    dlg.addEventListener("animationend", e => { if (e.target === dlg) dlg.classList.remove("pop"); });
    dlg.addEventListener("close", () => {
      document.documentElement.classList.remove("modal-open");
      slot.replaceChildren();
    });

    dlg.addEventListener("keydown", e => {
      if (slides.length < 2) return;
      if (e.key === "ArrowRight") show(current + 1, true);
      if (e.key === "ArrowLeft") show(current - 1, true);
    });

    // Safe ?open=N deep link (guards empty string)
    const openParam = new URLSearchParams(location.search).get("open");
    if (openParam !== null && openParam.trim() !== "") {
      const idx = Number(openParam);
      if (Number.isInteger(idx) && works[idx]) {
        works[idx].scrollIntoView({ block: "center" });
        setTimeout(() => openViewer(works[idx], true), 200);
      }
    }

    // Prevent wheel scroll chaining behind open viewer
    stage.addEventListener("wheel", e => e.preventDefault(), { passive: false });

    // 1:1 interactive swipe with velocity commit + Apple rubber-band damping
    let swipe = null;
    const rubberband = (d, dim, c = 0.45) => (d * dim * c) / (dim + c * Math.abs(d));

    stage.addEventListener("pointerdown", e => {
      if (swipe || e.target.closest("button, video, iframe")) return;
      swipe = { id: e.pointerId, x0: e.clientX, t0: performance.now(), dx: 0, moved: false };
    });

    stage.addEventListener("pointermove", e => {
      if (!swipe || e.pointerId !== swipe.id) return;
      const el = slot.firstElementChild;
      if (!el) return;
      swipe.dx = e.clientX - swipe.x0;
      if (!swipe.moved && Math.abs(swipe.dx) > 8) {
        swipe.moved = true;
        stage.setPointerCapture(e.pointerId);
      }
      if (swipe.moved) {
        const offset = slides.length > 1 ? swipe.dx : rubberband(swipe.dx, stage.clientWidth || 400);
        el.style.transition = "none";
        el.style.transform = `translateX(${offset}px)`;
      }
    });

    const endSwipe = e => {
      if (!swipe || e.pointerId !== swipe.id) return;
      const { dx, t0, moved } = swipe;
      swipe = null;
      const el = slot.firstElementChild;
      if (!moved || !el) return;
      const velocity = Math.abs(dx) / Math.max(1, performance.now() - t0);
      if (slides.length > 1 && (Math.abs(dx) > 55 || velocity > 0.22)) {
        show(current + (dx < 0 ? 1 : -1), true);
      } else {
        el.style.transition = "transform 280ms cubic-bezier(0.23, 1, 0.32, 1)";
        el.style.transform = "";
        setTimeout(() => { if (el) el.style.transition = ""; }, 300);
      }
    };
    stage.addEventListener("pointerup", endSwipe);
    stage.addEventListener("pointercancel", endSwipe);
  }

  // PORTFOLIO PAGE: case study cards
  const CASE_STUDIES = [
    { href: "case-carton-dieline.html", meta: "Kooka Paper | Workflow automation", title: "Automating Carton Dieline Creation", text: "An Illustrator tool that generates complete carton dielines from a few measurements.", tag: "10+ min to under 1 min" },
    { href: "case-hasmadi-ecommerce.html", meta: "Hasmadi Textile | 2022 to 2023", title: "E-commerce Website Development", text: "Built and managed the company's WordPress online store, from hosting setup to payment integration.", tag: "WordPress" },
    { href: "case-portfolio-website.html", meta: "Personal branding | 2026", title: "Personal Portfolio Website", text: "Designed and built this portfolio around a recruiter-focused, structured browsing experience.", tag: "HTML, CSS, JavaScript" }
  ];

  const filtersBar = document.querySelector(".filters");
  if (filtersBar && document.querySelector(".lead")) {
    const wrap = document.createElement("div");
    wrap.innerHTML =
      '<h2 class="sub-title" id="case-studies">Case studies</h2><div class="case-grid">' +
      CASE_STUDIES.map(c =>
        `<a class="box hov draw case-card" href="${c.href}"><small>${c.meta}</small><h3>${c.title}</h3><p>${c.text}</p><span class="tag">${c.tag}</span><span class="go">Read case study <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></span></a>`
      ).join("") +
      '</div><h2 class="sub-title">All work</h2>';
    filtersBar.before(...wrap.childNodes);
    if (location.hash === "#case-studies") document.getElementById("case-studies").scrollIntoView();
  }

  // ---------------------------------------------------------------
  // TOP BAR + INSTANT KEYBOARD SEARCH PALETTE + INTERRUPTIBLE TOAST
  // ---------------------------------------------------------------
  const CAT_LABEL = { "branding-packaging": "Branding & packaging", "commercial": "Commercial", "marketing-social": "Marketing & social", "multimedia": "Multimedia & motion", "exhibition-print": "Exhibition & print", "personal-artwork": "Personal artwork" };
  const EMAIL = "fathiafiqdesign@gmail.com";
  const SVG_SEARCH = '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>';

  const toast = msg => {
    document.querySelector(".toast")?.remove();
    const t = document.createElement("div");
    t.className = "toast";
    t.setAttribute("role", "status");
    t.setAttribute("aria-live", "polite");
    t.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
    t.append(msg);
    document.body.append(t);
    setTimeout(() => t.classList.add("out"), 2400);
    setTimeout(() => t.remove(), 2700);
  };

  const sideEl = document.querySelector(".sidebar");
  if (sideEl) {
    const isMac = /Mac|iPhone|iPad/i.test(navigator.userAgentData?.platform || navigator.userAgent);
    const bar = document.createElement("header");
    bar.className = "topbar";
    bar.innerHTML =
      `<button class="search-pill" type="button" aria-label="Search the site">${SVG_SEARCH}<span>Search projects, pages…</span><kbd>${isMac ? "⌘ K" : "Ctrl K"}</kbd></button>` +
      '<div class="tb-right"><span class="status"><i></i>Open to opportunities</span><a class="btn btn-primary tb-btn" href="contact.html">Let\'s talk</a></div>';
    sideEl.after(bar);

    // Subtle mobile footer socials strip (restores socials on mobile without cluttering desktop)
    const mainEl = document.querySelector(".main");
    if (mainEl && !document.body.classList.contains("page-contact")) {
      const ms = document.createElement("footer");
      ms.className = "mobile-socials";
      ms.innerHTML =
        '<span>© 2026 Fathi Afiq</span>' +
        '<div class="ms-links">' +
        '<a href="https://www.behance.net/fathiafiq" target="_blank" rel="noopener">Behance</a>' +
        '<a href="https://www.linkedin.com/in/fathi-afiq-fv97/" target="_blank" rel="noopener">LinkedIn</a>' +
        '<a href="https://www.instagram.com/fathii_afiiq/" target="_blank" rel="noopener">Instagram</a>' +
        '</div>';
      mainEl.append(ms);
    }

    const palette = document.createElement("dialog");
    palette.className = "palette";
    palette.setAttribute("aria-label", "Search");
    palette.innerHTML =
      `<div class="pal-top">${SVG_SEARCH}<input type="text" placeholder="Search projects, pages, case studies…" aria-label="Search" role="combobox" aria-autocomplete="list" aria-expanded="true" aria-controls="pal-list" autocomplete="off" spellcheck="false"><kbd>Esc</kbd></div>` +
      '<div class="pal-list" id="pal-list" role="listbox" aria-label="Search results"></div>' +
      '<div class="pal-foot"><span><kbd>↑</kbd><kbd>↓</kbd>move</span><span><kbd>Enter</kbd>open</span><span><kbd>Esc</kbd>close</span></div>';
    document.body.append(palette);

    const input = palette.querySelector("input");
    const list = palette.querySelector(".pal-list");

    const PAGES = [
      { label: "Home", href: "index.html", kw: "home start" },
      { label: "About", href: "about.html", kw: "about me profile who" },
      { label: "Resume", href: "resume.html", kw: "resume cv experience education skills languages certificates" },
      { label: "Portfolio", href: "portfolio.html", kw: "portfolio work projects artwork gallery" },
      { label: "Contact", href: "contact.html", kw: "contact email hire talk" }
    ];
    const ACTIONS = [
      { label: "Copy email address", kw: "email copy mail contact", run: () => { navigator.clipboard?.writeText(EMAIL).then(() => toast("Email address copied"), () => toast(EMAIL)); } },
      { label: "Open Behance", kw: "behance social", href: "https://www.behance.net/fathiafiq", external: true },
      { label: "Open LinkedIn", kw: "linkedin social", href: "https://www.linkedin.com/in/fathi-afiq-fv97/", external: true },
      { label: "Open Instagram", kw: "instagram social", href: "https://www.instagram.com/fathii_afiiq/", external: true }
    ];

    const effectsAction = () => {
      const isLite = document.documentElement.classList.contains("lite");
      return {
        label: isLite ? "Use full effects" : "Use lighter effects",
        kw: "effects lite full performance slow smooth animation blur",
        run: () => {
          document.documentElement.classList.toggle("lite", !isLite);
          try { localStorage.setItem("fa-lite", isLite ? "0" : "1"); } catch {}
          toast(isLite ? "Full effects on" : "Lighter effects on");
        }
      };
    };

    let projectsPromise;
    const loadProjects = () => projectsPromise || (projectsPromise = (async () => {
      let cards = [...document.querySelectorAll(".work")];
      if (!cards.length) {
        try {
          const r = await fetch("portfolio.html");
          cards = [...new DOMParser().parseFromString(await r.text(), "text/html").querySelectorAll(".work")];
        } catch { return []; }
      }
      return cards.map((c, i) => ({ title: c.dataset.title || "", cat: CAT_LABEL[c.dataset.cat] || "", n: Number(c.dataset.n ?? i) }));
    })());

    let items = [];
    let active = 0;

    const mark = () => {
      const rows = [...list.querySelectorAll(".pal-item")];
      if (!rows.length) {
        input.removeAttribute("aria-activedescendant");
        return;
      }
      rows.forEach((el, k) => {
        el.setAttribute("aria-selected", String(k === active));
        if (k === active) { el.scrollIntoView({ block: "nearest" }); input.setAttribute("aria-activedescendant", el.id); }
      });
    };

    const choose = item => {
      palette.close();
      if (item.run) return item.run();
      if (item.external) { window.open(item.href, "_blank", "noopener"); return; }
      const card = item.n !== undefined && (document.querySelector(`.work[data-n="${item.n}"]`) || document.querySelectorAll(".work")[item.n]);
      if (card) { card.click(); return; }
      location.href = item.href;
    };

    const render = async q => {
      const projects = await loadProjects();
      const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
      const hit = text => terms.every(t => text.toLowerCase().includes(t));
      const groups = [
        ["Pages", PAGES.filter(p => hit(p.label + " " + p.kw)).map(p => ({ label: p.label, meta: "Page", href: p.href }))],
        ["Case studies", CASE_STUDIES.filter(c => hit(c.title + " " + c.meta + " " + c.tag)).map(c => ({ label: c.title, meta: c.meta, href: c.href }))],
        ["Projects", (terms.length ? projects.filter(p => hit(p.title + " " + p.cat)) : projects.slice(0, 5)).slice(0, 8).map(p => ({ label: p.title, meta: p.cat, href: `portfolio.html?open=${p.n}`, n: p.n }))],
        ["Quick actions", [...ACTIONS, effectsAction()].filter(a => hit(a.label + " " + a.kw))]
      ].filter(([, arr]) => arr.length);

      items = [];
      list.replaceChildren();
      if (!groups.length) {
        input.removeAttribute("aria-activedescendant");
        const empty = document.createElement("p");
        empty.className = "pal-empty";
        empty.textContent = `No results for "${q}"`;
        list.append(empty);
        return;
      }
      groups.forEach(([title, arr], gIdx) => {
        const grp = document.createElement("div");
        grp.setAttribute("role", "group");
        const hId = `pal-g-${gIdx}`;
        grp.setAttribute("aria-labelledby", hId);

        const h = document.createElement("div");
        h.className = "pal-h";
        h.id = hId;
        h.textContent = title;
        grp.append(h);

        arr.forEach(item => {
          const row = document.createElement("div");
          row.className = "pal-item";
          row.id = "pal-" + items.length;
          row.setAttribute("role", "option");
          const t = document.createElement("span"); t.className = "t"; t.textContent = item.label;
          const m = document.createElement("span"); m.className = "m"; m.textContent = item.meta || "";
          row.append(t, m);
          const idx = items.length;
          row.addEventListener("click", () => choose(item));
          row.addEventListener("pointermove", () => { if (active !== idx) { active = idx; mark(); } });
          grp.append(row);
          items.push(item);
        });
        list.append(grp);
      });
      active = 0;
      mark();
    };

    const openSearch = (fromKeyboard = false) => {
      if (palette.open) return;
      palette.classList.toggle("instant", fromKeyboard);
      document.documentElement.classList.add("modal-open");
      palette.showModal();
      input.value = "";
      render("");
      input.focus();
    };

    bar.querySelector(".search-pill").addEventListener("click", () => openSearch(false));
    input.addEventListener("input", () => render(input.value));
    input.addEventListener("keydown", e => {
      if (!items.length) return;
      if (e.key === "ArrowDown") { e.preventDefault(); active = Math.min(active + 1, items.length - 1); mark(); }
      if (e.key === "ArrowUp") { e.preventDefault(); active = Math.max(active - 1, 0); mark(); }
      if (e.key === "Enter" && items[active]) { e.preventDefault(); choose(items[active]); }
    });
    palette.addEventListener("click", e => { if (e.target === palette) palette.close(); });
    palette.addEventListener("close", () => {
      if (!document.querySelector("dialog[open]")) document.documentElement.classList.remove("modal-open");
    });

    document.addEventListener("keydown", e => {
      const ae = document.activeElement;
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(ae?.tagName || "") || ae?.isContentEditable;
      const openK = e.key.toLowerCase() === "k" && (e.ctrlKey || e.metaKey) && !e.altKey;
      const openSlash = e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey && !typing && !document.querySelector("dialog[open]");
      if (openK || openSlash) {
        e.preventDefault();
        openSearch(true);
      }
    });
  }

  // SCROLL TIMELINES: leaf .tl-fill transform: scaleY() (zero subtree style recalc)
  const timelines = [...document.querySelectorAll(".tl")];
  if (timelines.length) {
    const still = prefersReduced();
    const reached = new Map(timelines.map(tl => [tl, 0]));
    let queued = false;

    const fills = new Map();
    timelines.forEach(tl => {
      tl.querySelectorAll(".tl-group").forEach(g => {
        const line = document.createElement("span");
        line.className = "tl-fill";
        line.setAttribute("aria-hidden", "true");
        g.prepend(line);
        fills.set(g, line);
      });
    });

    const update = () => {
      queued = false;
      const atBottom = innerHeight + scrollY >= document.documentElement.scrollHeight - 4;

      timelines.forEach(tl => {
        const r = tl.getBoundingClientRect();
        let p = (innerHeight * 0.78 - r.top) / r.height;
        if (still || atBottom) p = 1;
        p = Math.max(reached.get(tl), Math.min(1, Math.max(0, p)));
        reached.set(tl, p);

        const reach = p * tl.offsetHeight;
        tl.querySelectorAll(".tl-group").forEach(g => {
          const f = Math.min(1, Math.max(0, (reach - g.offsetTop) / g.offsetHeight));
          const line = fills.get(g);
          if (line) line.style.transform = `scaleY(${f})`;
          if (still || g.offsetTop + 10 <= reach) g.classList.add("on");
        });
      });
    };

    const request = () => {
      if (!queued) { queued = true; requestAnimationFrame(update); }
    };

    timelines.forEach(tl => tl.classList.add("live"));
    addEventListener("scroll", request, { passive: true });
    addEventListener("resize", request);
    update();
  }

  // RESUME SKILL CARDS: snappy stagger (35ms) — never leaves boxes half-blank
  const intros = [...document.querySelectorAll("[data-intro]")];
  if (intros.length && !prefersReduced() && "IntersectionObserver" in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.remove("intro-ready");
        e.target.classList.add("intro-play");
        io.unobserve(e.target);
      });
    }, { threshold: 0.12 });

    intros.forEach(card => {
      card.querySelectorAll(".tool, .bul li, .lvl").forEach((item, i) => item.style.setProperty("--i", i));
      card.classList.add("intro-ready");
      io.observe(card);
    });
  }

  // CONTACT PAGE: blur-masked Copy email morph + unified toast
  const copyBtn = document.querySelector("[data-copy]");
  if (copyBtn) {
    const note = document.querySelector(".copy-note");
    const defaultLabel = copyBtn.textContent;
    copyBtn.innerHTML = `<span class="btn-label">${defaultLabel}</span>`;
    const labelEl = copyBtn.querySelector(".btn-label");
    let resetTimer = null;

    const morphLabel = (next, copied) => {
      copyBtn.classList.add("is-morphing");
      setTimeout(() => {
        labelEl.textContent = next;
        copyBtn.classList.toggle("is-copied", copied);
        copyBtn.classList.remove("is-morphing");
      }, 95);
    };

    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(copyBtn.dataset.copy);
        morphLabel("Copied ✓", true);
        if (note) note.textContent = "Email address copied.";
        toast("Email address copied");
        clearTimeout(resetTimer);
        resetTimer = setTimeout(() => morphLabel(defaultLabel, false), 2200);
      } catch {
        if (note) note.textContent = "Couldn't copy it automatically. Please select the address and copy it.";
      }
    });
  }
});
