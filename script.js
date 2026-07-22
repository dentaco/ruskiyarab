/* ============ RUSKIYARAB — night shift interactions ============ */
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
    gsap.set(dot, { x: e.clientX - 3, y: e.clientY - 3 });
    rx = e.clientX; ry = e.clientY;
  });
  gsap.ticker.add(() => {
    const cx = gsap.getProperty(ring, "x"), cy = gsap.getProperty(ring, "y");
    gsap.set(ring, { x: cx + (rx - 17 - cx) * 0.16, y: cy + (ry - 17 - cy) * 0.16 });
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
    gsap.to(el, { x: (e.clientX - r.left - r.width / 2) * 0.22, y: (e.clientY - r.top - r.height / 2) * 0.22, duration: 0.4 });
  });
  el.addEventListener("mouseleave", () => gsap.to(el, { x: 0, y: 0, duration: 0.5, ease: "elastic.out(1,0.4)" }));
});

/* ---------- mobile menu ---------- */
const menuBtn = document.querySelector(".menu-btn");
menuBtn?.addEventListener("click", () => {
  menuBtn.classList.toggle("open");
  document.querySelector(".mobile-menu").classList.toggle("open");
});

/* ---------- preloader: neon sign flickers on, then lights out ---------- */
const pre = gsap.timeline({ onComplete: heroIn });
if (reduceMotion) {
  pre.set(".preloader-sign", { opacity: 1 })
     .to(".preloader", { autoAlpha: 0, duration: 0.3, delay: 0.3 })
     .set(".preloader", { display: "none" });
} else {
  // flicker pattern of a tired neon tube
  pre.set(".preloader-sign", { opacity: 0 })
     .to(".preloader-sign", { opacity: 1, duration: 0.05, delay: 0.3 })
     .to(".preloader-sign", { opacity: 0.2, duration: 0.05 })
     .to(".preloader-sign", { opacity: 1, duration: 0.05 })
     .to(".preloader-sign", { opacity: 0.1, duration: 0.07, delay: 0.12 })
     .to(".preloader-sign", { opacity: 1, duration: 0.05 })
     .to(".preloader-sign", { opacity: 0.4, duration: 0.05, delay: 0.2 })
     .to(".preloader-sign", { opacity: 1, duration: 0.06 })
     .to(".preloader", { autoAlpha: 0, duration: 0.55, ease: "power2.inOut", delay: 0.5 })
     .set(".preloader", { display: "none" });
}

function heroIn() {
  const tl = gsap.timeline();
  tl.from(".ht-word", { yPercent: 105, duration: 0.9, stagger: 0.1, ease: "power4.out" })
    .from(".hero-topline", { opacity: 0, y: -14, duration: 0.6, ease: "power2.out" }, "-=0.5")
    .from(".hero-sub, .hero-cta", { opacity: 0, y: 22, duration: 0.6, stagger: 0.12, ease: "power2.out" }, "-=0.4");
  neonFlickerLoop();
}

/* the SHIFT sign misbehaves occasionally, like real neon */
function neonFlickerLoop() {
  if (reduceMotion) return;
  const el = document.getElementById("neonWord");
  if (!el) return;
  const flick = () => {
    const tl = gsap.timeline({ onComplete: () => gsap.delayedCall(gsap.utils.random(3, 7), flick) });
    tl.to(el, { opacity: 0.35, duration: 0.04 })
      .to(el, { opacity: 1, duration: 0.05 })
      .to(el, { opacity: 0.5, duration: 0.04, delay: 0.06 })
      .to(el, { opacity: 1, duration: 0.05 });
  };
  gsap.delayedCall(2.5, flick);
}

/* ---------- three.js hero: bar-light dust ---------- */
(function heroCanvas() {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas || typeof THREE === "undefined") return;
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
  camera.position.z = 22;

  const COUNT = 550;
  const pos = new Float32Array(COUNT * 3);
  const col = new Float32Array(COUNT * 3);
  const seed = new Float32Array(COUNT);
  const palette = [
    new THREE.Color("#ff3b3b"), new THREE.Color("#ff3b3b"),
    new THREE.Color("#ffb454"), new THREE.Color("#5a5870"), new THREE.Color("#eceae4"),
  ];
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
    size: 0.13, vertexColors: true, transparent: true, opacity: 0.65,
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
      p[i * 3 + 1] += Math.sin(t * 0.5 + seed[i]) * 0.003 + 0.006; // lazy smoke drift
      p[i * 3] += Math.cos(t * 0.35 + seed[i]) * 0.0025;
      if (p[i * 3 + 1] > 19) p[i * 3 + 1] = -19;
    }
    geo.attributes.position.needsUpdate = true;
    points.rotation.y += 0.00035;
    camera.position.x += (mx * 2.0 - camera.position.x) * 0.03;
    camera.position.y += (-my * 1.3 - camera.position.y) * 0.03;
    camera.lookAt(0, 0, 0);
    renderer.render(scene, camera);
  })();
})();

/* ---------- hero still: slow ken burns + tired-neon flicker ---------- */
if (!reduceMotion) {
  const heroImg = document.querySelector(".hero-media img");
  if (heroImg) {
    // endless lazy drift, like a locked-off camera that isn't quite locked off
    gsap.to(heroImg, { scale: 1.14, xPercent: -1.2, duration: 26, yoyo: true, repeat: -1, ease: "sine.inOut" });
    // the room dims when the neon misbehaves
    const dip = () => {
      const tl = gsap.timeline({ onComplete: () => gsap.delayedCall(gsap.utils.random(4, 9), dip) });
      tl.to(heroImg, { filter: "saturate(1.05) contrast(1.05) brightness(.72)", duration: 0.05 })
        .to(heroImg, { filter: "saturate(1.05) contrast(1.05) brightness(1)", duration: 0.07 })
        .to(heroImg, { filter: "saturate(1.05) contrast(1.05) brightness(.85)", duration: 0.04, delay: 0.05 })
        .to(heroImg, { filter: "saturate(1.05) contrast(1.05) brightness(1)", duration: 0.06 });
    };
    gsap.delayedCall(3.2, dip);
  }
}

/* ---------- atmo strip parallax ---------- */
document.querySelectorAll(".atmo-media img").forEach((img) => {
  gsap.fromTo(img, { yPercent: -10 }, {
    yPercent: 10, ease: "none",
    scrollTrigger: { trigger: img.closest(".atmo-strip"), start: "top bottom", end: "bottom top", scrub: true },
  });
});

/* ---------- overheard marquees: two lanes, opposite directions ---------- */
if (!reduceMotion) {
  gsap.to(".m-top .marquee-track", { xPercent: -50, duration: 26, repeat: -1, ease: "none" });
  gsap.fromTo(".m-bottom .marquee-track", { xPercent: -50 }, { xPercent: 0, duration: 30, repeat: -1, ease: "none" });
}

/* ---------- reveal-ups + section heads ---------- */
document.querySelectorAll(".reveal-up").forEach((el) => {
  gsap.to(el, {
    opacity: 1, y: 0, duration: 0.9, ease: "power3.out",
    scrollTrigger: { trigger: el, start: "top 86%" },
  });
});
document.querySelectorAll(".section-head h2").forEach((el) => {
  gsap.from(el, {
    opacity: 0, y: 50, duration: 1, ease: "power4.out",
    scrollTrigger: { trigger: el, start: "top 85%" },
  });
});

/* ---------- card tilt ---------- */
if (matchMedia("(hover:hover)").matches && !reduceMotion) {
  document.querySelectorAll("[data-tilt]").forEach((card) => {
    card.addEventListener("mousemove", (e) => {
      const r = card.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5;
      const py = (e.clientY - r.top) / r.height - 0.5;
      gsap.to(card, { rotationY: px * 8, rotationX: -py * 8, transformPerspective: 800, duration: 0.4 });
    });
    card.addEventListener("mouseleave", () => gsap.to(card, { rotationY: 0, rotationX: 0, duration: 0.6, ease: "power2.out" }));
  });
}

/* ---------- footer year ---------- */
document.getElementById("year").textContent = new Date().getFullYear();
