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

/* ---------- negroni scrollytelling ---------- */
(function negroni() {
  const steps = gsap.utils.toArray(".n-step");
  const stream = ".pour-stream";

  // helpers: show a pour stream in a colour, raise a liquid layer
  function pour(tl, color, at) {
    tl.set(stream, { attr: { fill: color } }, at)
      .to(stream, { attr: { height: 350 }, duration: 0.18, ease: "power2.in" }, at)
      .to(stream, { attr: { y: 350, height: 0 }, duration: 0.22, ease: "power2.out" }, at + 0.55)
      .set(stream, { attr: { y: -10 } });
  }
  function step(tl, i, at) {
    if (i > 0) tl.to(steps[i - 1], { opacity: 0, y: -18, duration: 0.25 }, at);
    tl.fromTo(steps[i], { opacity: 0, y: 18 }, { opacity: 1, y: 0, duration: 0.3 }, at + 0.2);
  }

  const tl = gsap.timeline({
    scrollTrigger: {
      trigger: ".negroni",
      start: "top top",
      end: "+=4200",
      scrub: reduceMotion ? false : 0.6,
      pin: ".negroni-pin",
    },
    defaults: { ease: "none" },
  });

  // 01 — glass
  tl.from(".g-glass", { opacity: 0, y: 40, duration: 0.5 }, 0);
  step(tl, 0, 0);

  // 02 — ice drops
  step(tl, 1, 1);
  tl.to(".ice", { y: 0, duration: 0.55, ease: "bounce.out" }, 1.15);

  // 03 — gin
  step(tl, 2, 2);
  pour(tl, "#e8e4da", 2.15);
  tl.to(".liq-gin", { attr: { y: 352 }, duration: 0.7, ease: "power1.inOut" }, 2.2);

  // 04 — campari
  step(tl, 3, 3);
  pour(tl, "#e5383b", 3.15);
  tl.to(".liq-campari", { attr: { y: 250 }, duration: 0.7, ease: "power1.inOut" }, 3.2);

  // 05 — vermouth
  step(tl, 4, 4);
  pour(tl, "#d1495b", 4.15);
  tl.to(".liq-vermouth", { attr: { y: 150 }, duration: 0.7, ease: "power1.inOut" }, 4.2);
  tl.to(".ratio-badge", { opacity: 1, y: 0, duration: 0.3, stagger: 0.1 }, 4.6);

  // 06 — stir + peel
  step(tl, 5, 5);
  tl.to(".spoon", { opacity: 1, duration: 0.2 }, 5.1)
    .to(".spoon", { rotation: 10, svgOrigin: "238 340", duration: 0.18, repeat: 5, yoyo: true }, 5.2)
    .to(".swirl", { opacity: 1, duration: 0.3 }, 5.25)
    .to(".liq-final", { opacity: 1, duration: 0.6 }, 5.3)
    .to(".liq-gin,.liq-campari,.liq-vermouth", { opacity: 0, duration: 0.5 }, 5.35)
    .to(".spoon", { opacity: 0, y: -30, duration: 0.25 }, 5.95)
    .to(".swirl", { opacity: 0, duration: 0.3 }, 6.0)
    .fromTo(".peel", { opacity: 0, y: -60, rotation: -30, svgOrigin: "200 90" },
                     { opacity: 1, y: 0, rotation: 0, duration: 0.4, ease: "power2.out" }, 6.1)
    .to(".spritz circle", { opacity: 0.9, scale: 1.6, svgOrigin: "200 100", duration: 0.25, stagger: 0.05 }, 6.5)
    .to(".spritz circle", { opacity: 0, duration: 0.3 }, 6.9)
    .to(".negroni-svg", { scale: 1.04, duration: 0.4, ease: "power1.inOut" }, 6.9);
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
