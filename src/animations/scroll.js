/* ══════════════════════════════════════════════════════════════════
   SCROLL CHOREOGRAPHY
   Reveals, the ticker, the sideways process section, and card tilt.
   Everything here is additive — if it never runs, the page is still a
   complete, readable document.
   ══════════════════════════════════════════════════════════════════ */

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { walkCycle } from './stickman.js';

gsap.registerPlugin(ScrollTrigger);

/* ── nav ────────────────────────────────────────────────────────── */
export function initNav() {
  const nav = document.getElementById('nav');
  if (!nav) return;

  ScrollTrigger.create({
    start: 'top -80',
    end: 99999,
    onToggle: (self) => nav.classList.toggle('is-stuck', self.isActive),
  });
}

/* ── heading line reveals ───────────────────────────────────────── */
/* Headings are authored with <br> where the designer wants a break, so
   splitting on <br> gives exactly the intended lines — no measuring, no
   reflow surprises, and the markup inside each line is preserved.      */
function splitIntoLines(el) {
  const chunks = el.innerHTML.split(/<br\s*\/?>/i);
  el.innerHTML = chunks
    .map((c) => `<span class="line"><span class="line-inner">${c.trim()}</span></span>`)
    .join('');
  return el.querySelectorAll('.line-inner');
}

export function initReveals() {
  document.querySelectorAll('[data-reveal-lines]').forEach((el) => {
    const lines = splitIntoLines(el);
    gsap.fromTo(lines,
      { yPercent: 115, opacity: 0 },
      {
        yPercent: 0,
        opacity: 1,
        duration: 0.9,
        stagger: 0.09,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 82%' },
      }
    );
  });

  document.querySelectorAll('[data-reveal]').forEach((el) => {
    gsap.fromTo(el,
      { y: 26, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 88%' },
      }
    );
  });
}

/* ── ticker ─────────────────────────────────────────────────────── */
export function initMarquee() {
  const track = document.querySelector('[data-marquee]');
  if (!track) return;

  /* duplicate the content so the -50% loop is seamless */
  track.innerHTML += track.innerHTML;

  const tween = gsap.to(track, {
    xPercent: -50,
    duration: 28,
    ease: 'none',
    repeat: -1,
  });

  /* nudge the speed with scroll direction — small, but it makes the
     strip feel connected to the page rather than bolted on */
  ScrollTrigger.create({
    onUpdate: (self) => {
      const dir = self.direction;
      gsap.to(tween, {
        timeScale: dir === 1 ? 1.9 : -1.9,
        duration: 0.45,
        overwrite: true,
        onComplete: () => gsap.to(tween, { timeScale: dir, duration: 1.1 }),
      });
    },
  });
}

/* ── stations: sticky section, sideways content, walking figure ─── */
export function initStations(walkerParts) {
  const section = document.querySelector('.stations');
  const steps = document.querySelector('.stations__steps');
  const walker = document.querySelector('[data-stickman="walk"]');
  if (!section || !steps) return;

  const cycle = walkerParts ? walkCycle(walkerParts, { speed: 0.36, stride: 34 }) : null;

  /* The section's height IS the scroll runway. Leaving it at a fixed vh
     means the sideways move gets slower the wider the screen gets — the
     steps stay the same width while the viewport grows, so there's less
     to travel and just as far to scroll. Sizing it from the measured
     travel keeps the pace constant everywhere. */
  /* 1:1 — a pixel of scrolling moves the strip a pixel sideways. Slower
     than that and 15 stations turn into an interminable section. */
  let travel = 0;
  const sizeRunway = () => {
    travel = Math.max(steps.scrollWidth - window.innerWidth + 80, 0);
    section.style.height = `${window.innerHeight + travel}px`;
  };

  sizeRunway();

  /* Sized on every refresh, and again directly on resize: the runway has
     to be correct *before* ScrollTrigger measures the section, and a
     stale one silently changes the scroll pace rather than erroring. */
  ScrollTrigger.addEventListener('refreshInit', sizeRunway);

  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      sizeRunway();
      ScrollTrigger.refresh();
    }, 150);
  });

  ScrollTrigger.create({
    trigger: section,
    start: 'top top',
    end: 'bottom bottom',
    scrub: 0.8,
    invalidateOnRefresh: true,
    onUpdate: (self) => {
      const p = self.progress;
      gsap.set(steps, { x: -travel * p });

      if (walker) {
        const lane = window.innerWidth - walker.offsetWidth - 80;
        gsap.set(walker, { x: 40 + lane * p });
      }
    },
    onEnter: () => cycle?.play(),
    onEnterBack: () => cycle?.play(),
    onLeave: () => cycle?.pause(),
    onLeaveBack: () => cycle?.pause(),
  });

  cycle?.pause();
}

/* ── experience tiles: slight parallax so the grid isn't a static block ── */
export function initWorkParallax() {
  document.querySelectorAll('.tile__art').forEach((art) => {
    gsap.fromTo(art,
      { yPercent: -6 },
      {
        yPercent: 6,
        ease: 'none',
        scrollTrigger: {
          trigger: art.closest('.tile'),
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
        },
      }
    );
  });
}

/* ── pointer tilt ───────────────────────────────────────────────── */
/* Writes CSS custom properties instead of transforms, so the element's
   own stylesheet stays in charge of how the tilt is composed.          */
export function initTilt() {
  const MAX = 7;
  document.querySelectorAll('[data-tilt]').forEach((el) => {
    let raf = 0;

    const move = (e) => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        el.style.setProperty('--ry', `${px * MAX * 2}deg`);
        el.style.setProperty('--rx', `${-py * MAX * 2}deg`);
      });
    };

    const reset = () => {
      el.style.setProperty('--rx', '0deg');
      el.style.setProperty('--ry', '0deg');
    };

    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', reset);
  });
}
