/* ══════════════════════════════════════════════════════════════════
   PAALO — entry point
   Ships as a plain static bundle. Nothing here is required for the
   page to be readable; it's all enhancement layered on top of the HTML.
   ══════════════════════════════════════════════════════════════════ */

import './style.css';
import { gsap } from 'gsap';

import {
  mount, setPose, walkCycle, idle, hopLoop, throwConfetti,
  mountSwing, swingLoop,
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
      /* runs in along the hero rule, then stops and points at the line.
         Red rather than ink: the hero is held to the brand palette. */
      case 'hero': {
        const parts = mount(host, { tone: 'red', weight: 7 });
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

      /* rides the swing in the empty half of the Experiences page heading */
      case 'swing': {
        const rig = mountSwing(host, { tone: 'red', weight: 7 });
        rig.svg.style.width = '100%';
        rig.svg.style.height = 'auto';
        if (!reduceMotion) swingLoop(rig, { speed: 1.7, sweep: 19 });
        found.swing = rig;
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
/* Only the homepage has a hero. Bailing out early keeps the other pages
   from asking GSAP to animate selectors that aren't on them, which it
   answers with a console warning per target. */
function playIntro(figures) {
  if (!document.querySelector('.hero')) return;

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

  /* The mark is one piece of artwork now, so it can't be staggered letter by
     letter — it rises as a whole out of the clip instead. */
  tl.from('.hero__eyebrow', { y: 14, opacity: 0, duration: 0.6 })
    .from('.hero__logo', {
      yPercent: 112,
      duration: 1.15,
      ease: 'power4.out',
    }, '-=0.25')
    /* The tagline is part of the lockup now, so it follows the mark up
       closely rather than arriving with the copy underneath it. */
    .from('.hero__tagline', { y: 22, opacity: 0, duration: 0.7 }, '-=0.55')
    .from('.hero__meta', { y: 30, opacity: 0, duration: 0.8 }, '-=0.45');

  const hero = figures.hero;
  if (!hero) return;

  /* He has to stop somewhere the wordmark isn't, or he's a dark shape
     standing on dark artwork. The mark's rendered width is driven by CSS,
     not by the intro transform, so this stays correct mid-animation. */
  const mark = document.querySelector('.hero__logo');

  const restingX = () => {
    const markEnd = mark ? mark.getBoundingClientRect().width : 0;
    const stageWidth = hero.svg.parentElement.clientWidth;
    const figureWidth = hero.svg.getBoundingClientRect().width || 70;
    return Math.min(markEnd + 48, Math.max(stageWidth - figureWidth - 16, 0));
  };

  /* Wait for the artwork itself: until it decodes there is no width to
     measure against, and he lands on top of the mark. */
  const markReady = mark && !mark.complete
    ? new Promise((res) => {
        mark.addEventListener('load', res, { once: true });
        mark.addEventListener('error', res, { once: true });
      })
    : Promise.resolve();

  Promise.all([document.fonts.ready, markReady]).then(() => {
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

/* ── photography ────────────────────────────────────────────────── */
/* The experience photos are dropped into public/experiences/ by hand.
   Until a given file exists, its <img> is removed so the designed
   placeholder behind it shows through — a missing photo should look like
   artwork, never like a broken image icon. Covers both the tiles in the
   Experiences grid and the pop-up station cards, which are filled in from
   the same folder and at the same unhurried pace. */
function initPhotoFallback() {
  document.querySelectorAll('.tile__art img, .stn__shot img, .xcard__shot img').forEach((img) => {
    const drop = () => img.remove();
    if (img.complete && img.naturalWidth === 0) drop();
    else img.addEventListener('error', drop, { once: true });
  });
}

/* ── boot ───────────────────────────────────────────────────────── */
function boot() {
  initPhotoFallback();

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
}

/* The hero's WebGL balloon and the screen-printed backdrop were both
   removed: the hero is type, the mark and the figure, in brand colour and
   nothing else. src/three/heroScene.js is left in the tree in case it is
   ever wanted back, but nothing imports it, so it no longer ships. */

boot();
