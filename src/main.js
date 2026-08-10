/* ══════════════════════════════════════════════════════════════════
   PAALO — entry point
   Ships as a plain static bundle. Nothing here is required for the
   page to be readable; it's all enhancement layered on top of the HTML.
   ══════════════════════════════════════════════════════════════════ */

import './style.css';
import { gsap } from 'gsap';

import {
  mount, setPose, walkCycle, idle, hopLoop, throwConfetti,
} from './animations/stickman.js';
import {
  initNav, initReveals, initMarquee, initStations, initWorkParallax, initTilt,
} from './animations/scroll.js';

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* Figures are 100 x 168 in user units; sizing by height keeps the
   proportions right wherever they're dropped in. */
function sizeByHeight(svg, height) {
  svg.style.height = height;
  svg.style.width = 'auto';
}

/* ── figures ────────────────────────────────────────────────────── */
function buildFigures() {
  const found = {};

  document.querySelectorAll('[data-stickman]').forEach((host) => {
    const kind = host.dataset.stickman;

    switch (kind) {
      /* runs in along the hero rule, then stops and points at the line */
      case 'hero': {
        const parts = mount(host, { tone: 'ink', weight: 7 });
        Object.assign(parts.svg.style, {
          position: 'absolute',
          left: '0',
          bottom: '0',
        });
        sizeByHeight(parts.svg, '100%');
        setPose(parts, 'stand');
        found.hero = parts;
        break;
      }

      /* sits on the section rule, thinking */
      case 'sit': {
        const parts = mount(host, { tone: 'ink', weight: 7 });
        sizeByHeight(parts.svg, '100%');
        setPose(parts, 'sit');
        if (!reduceMotion) idle(parts);
        found.sit = parts;
        break;
      }

      /* walks the length of the stations strip, driven by scroll */
      case 'walk': {
        const parts = mount(host, { tone: 'light', weight: 7 });
        sizeByHeight(parts.svg, '100%');
        setPose(parts, 'stand');
        found.walk = parts;
        break;
      }

      /* celebrates in the closing block */
      case 'cheer': {
        const parts = mount(host, { tone: 'light', weight: 7 });
        sizeByHeight(parts.svg, '100%');
        setPose(parts, 'cheer');
        found.cheer = parts;
        break;
      }

      /* the small card figures, one per way-in and per collaboration route */
      default: {
        if (!kind.startsWith('ico-')) break;
        const parts = mount(host, { tone: 'ink', weight: 8 });
        sizeByHeight(parts.svg, '100%');

        const pose = {
          'ico-public': 'stand',     // walks — set below
          'ico-private': 'cheer',
          'ico-corporate': 'point',
          /* deliberately far apart so the three read as three different
             people at a glance, not the same figure three times */
          'ico-skill': 'cheer',
          'ico-space': 'point',
          'ico-idea': 'think',
        }[kind] || 'stand';

        setPose(parts, pose);

        if (!reduceMotion) {
          if (kind === 'ico-public') walkCycle(parts, { speed: 0.55, stride: 24 });
          else idle(parts);
        }
        found[kind] = parts;
      }
    }
  });

  return found;
}

/* ── hero opening ───────────────────────────────────────────────── */
function playIntro(figures) {
  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  tl.from('.hero__eyebrow', { y: 14, opacity: 0, duration: 0.6 })
    .from('[data-hero-letter]', {
      yPercent: 118,
      opacity: 0,
      rotation: -7,
      duration: 1,
      stagger: 0.065,
      ease: 'back.out(1.5)',
    }, '-=0.25')
    .from('.hero__meta', { y: 30, opacity: 0, duration: 0.8 }, '-=0.5');

  const hero = figures.hero;
  if (!hero) return;

  /* He has to stop somewhere the wordmark isn't, or he's just a black
     shape standing on a black 'p'. Summing the letter widths gives the
     end of the word without being thrown off by the transforms the
     intro is still running on those same letters. */
  const restingX = () => {
    const letters = [...document.querySelectorAll('[data-hero-letter]')];
    const wordEnd = letters.reduce((sum, el) => sum + el.offsetWidth, 0);
    const stageWidth = hero.svg.parentElement.clientWidth;
    const figureWidth = hero.svg.getBoundingClientRect().width || 70;
    return Math.min(wordEnd + 48, Math.max(stageWidth - figureWidth - 16, 0));
  };

  /* Anton is a display face with very different metrics to the fallback,
     so measuring before it loads puts him in the wrong place. */
  document.fonts.ready.then(() => {
    let parked = false;
    const cycle = walkCycle(hero, { speed: 0.34, stride: 32 });

    gsap.fromTo(hero.svg,
      { x: -200 },
      {
        x: restingX(),
        duration: 2.4,
        ease: 'none',
        delay: 0.4,
        onComplete() {
          cycle.kill();
          setPose(hero, 'pointBack', 0.45);
          idle(hero);
          parked = true;
        },
      }
    );

    /* once he's parked, keep him beside the word if the viewport changes */
    window.addEventListener('resize', () => {
      if (parked) gsap.set(hero.svg, { x: restingX() });
    });
  });
}

/* ── boot ───────────────────────────────────────────────────────── */
function boot() {
  const figures = buildFigures();

  if (reduceMotion) {
    /* static, legible, still has the character in it — just not moving */
    if (figures.hero) gsap.set(figures.hero.svg, { x: 40 });
    if (figures.hero) setPose(figures.hero, 'point');
    return;
  }

  initNav();
  initReveals();
  initMarquee();
  initTilt();
  initWorkParallax();
  initStations(figures.walk);

  if (figures.cheer) {
    hopLoop(figures.cheer);
    throwConfetti(figures.cheer, { count: 20 });
  }

  playIntro(figures);
  loadHeroScene();
}

/* WebGL is the most expendable thing on the page and by far the largest
   download, so it's split into its own chunk, fetched after everything
   else is running, and skipped outright where it would cost more than
   it gives. The hero still has the print, the type and the figure. */
function loadHeroScene() {
  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const tooSmall = window.innerWidth < 720;
  const lowMemory = (navigator.deviceMemory ?? 8) < 4;
  const saveData = navigator.connection?.saveData === true;
  if (tooSmall || lowMemory || saveData) return;

  import('./three/heroScene.js')
    .then(({ initHeroScene }) => initHeroScene(canvas))
    .catch(() => { /* no 3D is a fine outcome; the hero stands without it */ });
}

boot();
