/* ============ RUSKIYARAB — interactions ============ */
gsap.registerPlugin(ScrollTrigger);

const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- smooth scroll ---------- */
let lenis = null;
if (!reduceMotion) {
  lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 1 });
  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}

/* anchor links through lenis */
document.querySelectorAll('a[href^="#"]').forEach((a) => {
  a.addEventListener("click", (e) => {
    const target = document.querySelector(a.getAttribute("href"));
    if (!target) return;
    e.preventDefault();
    document.querySelector(".mobile-menu")?.classList.remove("open");
    document.querySelector(".menu-btn")?.classList.remove("open");
    if (lenis) lenis.scrollTo(target, { offset: 0, duration: 1.4 });
    else target.scrollIntoView({ behavior: "smooth" });
  });
});

/* ---------- cursor ---------- */
const dot = document.querySelector(".cursor-dot");
const ring = document.querySelector(".cursor-ring");
if (matchMedia("(hover:hover)").matches) {
  let rx = 0, ry = 0;
  window.addEventListener("mousemove", (e) => {
    gsap.set(dot, { x: e.clientX - 4, y: e.clientY - 4 });
    rx = e.clientX; ry = e.clientY;
  });
  gsap.ticker.add(() => {
    const cx = gsap.getProperty(ring, "x"), cy = gsap.getProperty(ring, "y");
    gsap.set(ring, { x: cx + (rx - 18 - cx) * 0.16, y: cy + (ry - 18 - cy) * 0.16 });
  });
  document.querySelectorAll("a,button,[data-hover]").forEach((el) => {
    el.addEventListener("mouseenter", () => ring.classList.add("is-hover"));
    el.addEventListener("mouseleave", () => ring.classList.remove("is-hover"));
  });
}

/* ---------- magnetic ---------- */
document.querySelectorAll("[data-magnetic]").forEach((el) => {
  el.addEventListener("mousemove", (e) => {
    const r = el.getBoundingClientRect();
    gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.25, y: (e.clientY - r.top - r.height / 2) * 0.25, duration: 0.4 });
  });
  el.addEventListener("mouseleave", () => gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1,0.4)" }));
});

/* ---------- mobile menu ---------- */
const menuBtn = document.querySelector(".menu-btn");
menuBtn?.addEventListener("click", () => {
  menuBtn.classList.toggle("open");
  document.querySelector(".mobile-menu").classList.toggle("open");
});

/* ---------- preloader: pour in, then reveal ---------- */
const pre = gsap.timeline({ onComplete: heroIn });
pre
  .to(".preloader-liquid", { height: "78%", duration: reduceMotion ? 0 : 1.1, ease: "power2.inOut" })
  .to(".preloader", { yPercent: -100, duration: 0.7, ease: "power3.inOut", delay: 0.15 })
  .set(".preloader", { display: "none" });

function heroIn() {
  const tl = gsap.timeline();
  tl.from(".hero-title .word", { yPercent: 110, duration: 0.9, stagger: 0.07, ease: "power3.out" })
    .from(".hero-badge,.hero-sub,.hero-cta", { opacity: 0, y: 24, duration: 0.7, stagger: 0.1, ease: "power2.out" }, "-=0.5")
    .from(".badge-pill", { opacity: 0, scale: 0.6, duration: 0.6, stagger: 0.12, ease: "back.out(2)" }, "-=0.6");
}

/* floating stickers */
document.querySelectorAll("[data-float]").forEach((el, i) => {
  if (reduceMotion) return;
  gsap.to(el, { y: "random(-14,14)", rotation: "random(-5,5)", duration: "random(2.4,3.6)", repeat: -1, yoyo: true, ease: "sine.inOut", delay: i * 0.2 });
});

/* ---------- three.js hero: amber ember drift ---------- */
(function heroCanvas() {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas || typeof THREE === "undefined") return;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.z = 22;

  const COUNT = 700;
  const pos = new Float32Array(COUNT * 3);
  const col = new Float32Array(COUNT * 3);
  const seed = new Float32Array(COUNT);
  const palette = [new THREE.Color("#e5383b"), new THREE.Color("#f77f00"), new THREE.Color("#ffba49"), new THREE.Color("#f2e8dc")];
  for (let i = 0; i < COUNT; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 60;
    pos[i * 3 + 1] = (Math.random() - 0.5) * 36;
    pos[i * 3 + 2] = (Math.random() - 0.5) * 24;
    const c = palette[(Math.random() * palette.length) | 0];
    col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    seed[i] = Math.random() * Math.PI * 2;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({
    size: 0.16, vertexColors: true, transparent: true, opacity: 0.75,
    blending: THREE.AdditiveBlending, depthWrite: false,
  });
  const points = new THREE.Points(geo, mat);
  scene.add(points);

  let mx = 0, my = 0;
  window.addEventListener("mousemove", (e) => {
    mx = (e.clientX / innerWidth - 0.5) * 2;
    my = (e.clientY / innerHeight - 0.5) * 2;
  });

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  const clock = new THREE.Clock();
  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(canvas);

  (function tick() {
    requestAnimationFrame(tick);
    if (!visible || reduceMotion) return;
    const t = clock.getElapsedTime();
    const p = geo.attributes.position.array;
    for (let i = 0; i < COUNT; i++) {
      p[i * 3 + 1] += Math.sin(t * 0.6 + seed[i]) * 0.004 + 0.008; // slow ember rise
      p[i * 3] += Math.cos(t * 0.4 + seed[i]) * 0.003;
      if (p[i * 3 + 1] > 19) p[i * 3 + 1] = -19;
    }
    geo.attributes.position.needsUpdate = true;
    points.rotation.y += 0.0004;
    camera.position.x += (mx * 2.2 - camera.position.x) * 0.03;
    camera.position.y += (-my * 1.4 - camera.position.y) * 0.03;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  })();
})();

/* ---------- marquee ---------- */
if (!reduceMotion) {
  gsap.to(".marquee-track", { xPercent: -50, duration: 22, repeat: -1, ease: "none" });
}

/* ---------- reveal-ups ---------- */
document.querySelectorAll(".reveal-up").forEach((el) => {
  gsap.to(el, {
    opacity: 1, y: 0, duration: 0.9, ease: "power3.out",
    scrollTrigger: { trigger: el, start: "top 86%" },
  });
});

/* ---------- pour test game ---------- */
(function pourTest() {
  const btn = document.getElementById("pourBtn");
  if (!btn) return;
  const mlEl = document.getElementById("pourMl");
  const resultEl = document.getElementById("pourResult");
  const bestEl = document.getElementById("pourBest");
  const label = btn.querySelector(".pour-btn-label");

  const TARGET = 30, MAX = 60, RATE = 15; // ml per second — a real four-count pour
  // fill geometry: glass runs y 456 (empty) → level rises ~2.47px per ml; 30ml lands on the 382 target line
  const EMPTY_Y = 456, PX_PER_ML = (456 - 382) / 30;

  let ml = 0, pouring = false, raf = null, startT = 0, locked = false, best = null;

  function setLiquid() {
    gsap.set(".p-fill", { attr: { y: EMPTY_Y - ml * PX_PER_ML } });
    mlEl.textContent = Math.round(ml);
  }

  // ml is derived from elapsed hold time, not frame ticks — immune to rAF throttling
  function currentMl() {
    return Math.min(MAX, ((performance.now() - startT) / 1000) * RATE);
  }

  function startPour() {
    if (pouring || locked) return;
    pouring = true;
    btn.classList.add("pouring");
    label.textContent = "pouring…";
    gsap.to(".p-bottle", { rotation: -130, svgOrigin: "400 110", duration: 0.3, ease: "power2.out" });
    gsap.to(".p-stream", { attr: { height: 140 }, duration: 0.15, ease: "power2.in", delay: 0.2 });
    startT = performance.now();
    raf = requestAnimationFrame(tick);
  }

  function tick() {
    if (!pouring) return;
    ml = currentMl();
    setLiquid();
    if (ml >= MAX) return spill();
    raf = requestAnimationFrame(tick);
  }

  function stopPour() {
    if (!pouring) return;
    pouring = false;
    cancelAnimationFrame(raf);
    ml = currentMl();
    setLiquid();
    btn.classList.remove("pouring");
    gsap.to(".p-bottle", { rotation: 0, svgOrigin: "400 110", duration: 0.35, ease: "power2.out" });
    gsap.to(".p-stream", { attr: { height: 0 }, duration: 0.18, ease: "power2.out" });
    if (ml >= MAX) return spill();
    grade();
  }

  function grade() {
    locked = true;
    const diff = ml - TARGET;
    const off = Math.abs(diff);
    let verdict, quip, good = false;
    if (off <= 1.5) {
      good = true; verdict = "Dead on. 🎯";
      quip = "That's a bartender's pour. Come take a shift at Harat's.";
      gsap.fromTo(".pour-svg", { scale: 1 }, { scale: 1.05, duration: 0.25, yoyo: true, repeat: 1, ease: "power1.inOut" });
    } else if (off <= 4) {
      good = true; verdict = diff > 0 ? "Close — a touch heavy." : "Close — a touch shy.";
      quip = "You'd survive a Tuesday. Friday rush would eat you alive.";
    } else if (diff > 0) {
      verdict = "Heavy hand. 🫗";
      quip = "Generous — but the bar manager is crying. Try a faster count.";
      gsap.fromTo(".pour-scene", { x: -6 }, { x: 0, duration: 0.5, ease: "elastic.out(1,0.3)" });
    } else {
      verdict = "Shy pour.";
      quip = "The guest is squinting at that glass. Commit to the count.";
      gsap.fromTo(".pour-scene", { x: -6 }, { x: 0, duration: 0.5, ease: "elastic.out(1,0.3)" });
    }
    resultEl.innerHTML =
      `<span class="verdict ${good ? "good" : "bad"}">${Math.round(ml)}ml — ${verdict}</span><span class="quip">${quip}</span>`;
    if (best === null || off < Math.abs(best - TARGET)) {
      best = ml;
      bestEl.textContent = `best pour: ${Math.round(best)}ml`;
    }
    label.textContent = "pour again";
    setTimeout(() => { locked = false; resetGlass(); }, 900);
  }

  function spill() {
    pouring = false;
    cancelAnimationFrame(raf);
    btn.classList.remove("pouring");
    locked = true;
    gsap.to(".p-bottle", { rotation: 0, svgOrigin: "400 110", duration: 0.3 });
    gsap.to(".p-stream", { attr: { height: 0 }, duration: 0.2 });
    gsap.fromTo(".p-splash", { opacity: 1, y: 0 }, { opacity: 0, y: -26, duration: 0.7, ease: "power2.out" });
    gsap.fromTo(".pour-scene", { x: -8 }, { x: 0, duration: 0.6, ease: "elastic.out(1,0.3)" });
    resultEl.innerHTML =
      `<span class="verdict bad">${MAX}ml — Overflow. 🌊</span><span class="quip">That's a double and a mop. We don't talk about this one.</span>`;
    label.textContent = "pour again";
    setTimeout(() => { locked = false; resetGlass(); }, 900);
  }

  function resetGlass() {
    ml = 0;
    gsap.to(".p-fill", { attr: { y: EMPTY_Y }, duration: 0.5, ease: "power2.inOut", onUpdate: null });
    mlEl.textContent = "0";
  }

  // pointer + keyboard
  btn.addEventListener("pointerdown", (e) => { e.preventDefault(); startPour(); });
  window.addEventListener("pointerup", stopPour);
  window.addEventListener("pointercancel", stopPour);
  window.addEventListener("keydown", (e) => {
    if (e.code === "Space" && !e.repeat && isInView()) { e.preventDefault(); startPour(); }
  });
  window.addEventListener("keyup", (e) => { if (e.code === "Space") stopPour(); });
  function isInView() {
    const r = document.getElementById("pour").getBoundingClientRect();
    return r.top < innerHeight * 0.8 && r.bottom > innerHeight * 0.2;
  }
})();

/* ---------- card tilt ---------- */
if (matchMedia("(hover:hover)").matches && !reduceMotion) {
  document.querySelectorAll("[data-tilt]").forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      gsap.to(card, { rotationY: px * 10, rotationX: -py * 10, transformPerspective: 700, duration: 0.4 });
    });
    card.addEventListener("mouseleave", () => gsap.to(card, { rotationY: 0, rotationX: 0, duration: 0.6, ease: "power2.out" }));
  });
}

/* ---------- footer year ---------- */
document.getElementById("year").textContent = new Date().getFullYear();
