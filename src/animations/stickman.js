/* ══════════════════════════════════════════════════════════════════
   STICK-MAN
   Built in code rather than imported as artwork, so every joint is a
   real transform target and the poses can be driven by scroll.

   Rig, drawn in a 100 x 160 box:

        (50,22)  ○   head
                 |
        (50,50)  •   shoulder ──┐ armL / armR      each limb hangs
                 |              │                  straight DOWN by
        (50,74)  •   elbow  ────┘ foreL / foreR    default; every pose
                 |                                 is just rotation.
        (50,94)  •   hip    ────┐ thighL / thighR
                 |              │
       (50,124)  •   knee   ────┘ shinL / shinR
                 |
       (50,154)  •   foot

   SVG rotation is clockwise-positive, and y points down, so a limb
   rotated -90 points right, +90 points left.
   ══════════════════════════════════════════════════════════════════ */

import { gsap } from 'gsap';

const NS = 'http://www.w3.org/2000/svg';

/* joint coordinates — single source of truth for geometry and origins */
const J = {
  head:     { cx: 50, cy: 22, r: 14 },
  neck:     [50, 36],
  shoulder: [50, 50],
  elbow:    [50, 74],
  hand:     [50, 96],
  hip:      [50, 94],
  knee:     [50, 124],
  foot:     [50, 154],
};

function node(tag, attrs = {}) {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
}

function segment(from, to) {
  return node('line', { x1: from[0], y1: from[1], x2: to[0], y2: to[1] });
}

/**
 * Build a stick figure.
 * @param {object} opts
 * @param {'ink'|'light'|'red'} [opts.tone]  stroke colour variant
 * @param {number} [opts.weight]             stroke width
 * @returns {{ svg: SVGSVGElement, parts: Record<string, SVGElement> }}
 */
export function createStickman({ tone = 'ink', weight = 7 } = {}) {
  const svg = node('svg', {
    class: `stickman${tone !== 'ink' ? ` stickman--${tone}` : ''}`,
    viewBox: '0 0 100 168',
    'stroke-width': weight,
  });

  const root = node('g', { class: 'sm-root' });

  const head = node('circle', J.head);
  const torso = segment(J.neck, J.hip);

  /* an arm is a group (upper) containing a group (fore) so rotations nest */
  const buildArm = () => {
    const upper = node('g');
    upper.appendChild(segment(J.shoulder, J.elbow));
    const fore = node('g');
    fore.appendChild(segment(J.elbow, J.hand));
    upper.appendChild(fore);
    return { upper, fore };
  };

  const buildLeg = () => {
    const upper = node('g');
    upper.appendChild(segment(J.hip, J.knee));
    const lower = node('g');
    lower.appendChild(segment(J.knee, J.foot));
    upper.appendChild(lower);
    return { upper, lower };
  };

  const armL = buildArm();
  const armR = buildArm();
  const legL = buildLeg();
  const legR = buildLeg();

  /* far-side limbs first so the near side reads on top */
  root.append(
    armL.upper, legL.upper,
    torso, head,
    legR.upper, armR.upper
  );
  svg.appendChild(root);

  const parts = {
    svg,
    root,
    head,
    torso,
    armL: armL.upper, foreL: armL.fore,
    armR: armR.upper, foreR: armR.fore,
    thighL: legL.upper, shinL: legL.lower,
    thighR: legR.upper, shinR: legR.lower,
  };

  /* pin each joint's rotation origin to its actual coordinate */
  gsap.set([parts.armL, parts.armR], { svgOrigin: J.shoulder.join(' ') });
  gsap.set([parts.foreL, parts.foreR], { svgOrigin: J.elbow.join(' ') });
  gsap.set([parts.thighL, parts.thighR], { svgOrigin: J.hip.join(' ') });
  gsap.set([parts.shinL, parts.shinR], { svgOrigin: J.knee.join(' ') });
  gsap.set(parts.root, { svgOrigin: '50 94' });

  return { svg, parts };
}

/* ── poses ──────────────────────────────────────────────────────────
   Each pose is just a set of joint rotations. Applied instantly with
   set(), or tweened into with `duration`.                             */

export const POSES = {
  stand:  { armL: 10,  foreL: 4,   armR: -10, foreR: -4,  thighL: 5,   shinL: -3,  thighR: -5,  shinR: 3 },
  think:  { armL: 22,  foreL: 10,  armR: -34, foreR: -108, thighL: 4,  shinL: -2,  thighR: -4,  shinR: 2, head: -6 },
  point:  { armL: 14,  foreL: 6,   armR: -96, foreR: -14, thighL: 6,   shinL: -4,  thighR: -8,  shinR: 4 },
  /* mirrored, for when whatever he's indicating is on his left */
  pointBack: { armL: 98, foreL: 12, armR: -14, foreR: -6, thighL: 8,   shinL: -4,  thighR: -6,  shinR: 4, head: 6 },
  cheer:  { armL: 152, foreL: 18,  armR: -152, foreR: -18, thighL: 12, shinL: -14, thighR: -12, shinR: 14 },
  lift:   { armL: 70,  foreL: 42,  armR: -70, foreR: -42, thighL: 8,   shinL: -6,  thighR: -8,  shinR: 6 },
  /* sitting on a ledge, facing right: thighs forward, shins hanging */
  sit:    { armL: 26,  foreL: 14,  armR: -30, foreR: -104, thighL: -74, shinL: 78, thighR: -82, shinR: 84, head: -4 },
  /* on a swing seat: both arms straight up gripping the ropes, legs out front */
  swing:  { armL: 150, foreL: 6,   armR: -150, foreR: -6,   thighL: -44, shinL: 34, thighR: -64, shinR: 50, head: 0 },
};

export function setPose(parts, pose, duration = 0) {
  const p = typeof pose === 'string' ? POSES[pose] : pose;
  if (!p) return;

  const apply = (key, rotation) => {
    const target = parts[key];
    if (!target) return;
    const vars = { rotation };
    if (duration) gsap.to(target, { ...vars, duration, ease: 'back.out(1.4)' });
    else gsap.set(target, vars);
  };

  for (const [key, rotation] of Object.entries(p)) {
    if (key === 'head') continue;             // head tilt handled below
    apply(key, rotation);
  }
  if (p.head !== undefined) {
    const vars = { rotation: p.head, svgOrigin: '50 36' };
    if (duration) gsap.to(parts.head, { ...vars, duration, ease: 'back.out(1.4)' });
    else gsap.set(parts.head, vars);
  }
}

/* ── motion ─────────────────────────────────────────────────────── */

/**
 * A looping walk/run cycle. Opposite limbs run out of phase; the body
 * bobs at double the stride frequency, which is what sells it.
 */
export function walkCycle(parts, { speed = 0.42, stride = 30, paused = false } = {}) {
  const tl = gsap.timeline({
    repeat: -1,
    yoyo: true,
    paused,
    defaults: { duration: speed, ease: 'sine.inOut' },
  });

  const knee = stride * 0.9;

  tl.fromTo(parts.thighL, { rotation: stride },      { rotation: -stride }, 0)
    .fromTo(parts.thighR, { rotation: -stride },     { rotation: stride },  0)
    .fromTo(parts.shinL,  { rotation: -6 },          { rotation: knee },    0)
    .fromTo(parts.shinR,  { rotation: knee },        { rotation: -6 },      0)
    .fromTo(parts.armL,   { rotation: -stride * 0.85 }, { rotation: stride * 0.8 }, 0)
    .fromTo(parts.armR,   { rotation: stride * 0.8 },   { rotation: -stride * 0.85 }, 0)
    .fromTo(parts.foreL,  { rotation: -18 },         { rotation: -42 },     0)
    .fromTo(parts.foreR,  { rotation: -42 },         { rotation: -18 },     0);

  /* separate tween so the bob runs at twice the leg frequency */
  const bob = gsap.to(parts.root, {
    y: -4,
    duration: speed / 2,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut',
    paused,
  });

  return {
    timeline: tl,
    play()  { tl.play();  bob.play();  },
    pause() { tl.pause(); bob.pause(); },
    kill()  { tl.kill();  bob.kill();  },
  };
}

/** Gentle idle — barely-there breathing so a static pose still feels alive. */
export function idle(parts) {
  return gsap.to(parts.root, {
    y: -2.5,
    duration: 1.6,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut',
  });
}

/** Small looping hop, used by the celebrating figure in the CTA. */
export function hopLoop(parts) {
  const tl = gsap.timeline({ repeat: -1, defaults: { ease: 'sine.inOut' } });
  tl.to(parts.root, { y: -18, duration: 0.34, ease: 'power2.out' })
    .to(parts.root, { y: 0, duration: 0.42, ease: 'bounce.out' })
    .to({}, { duration: 0.45 });

  gsap.to([parts.armL, parts.armR], {
    rotation: (i) => (i === 0 ? 168 : -168),
    duration: 0.4,
    repeat: -1,
    yoyo: true,
    ease: 'sine.inOut',
  });

  return tl;
}

/**
 * Throw confetti out of the figure's hands. Bits are injected into the
 * same SVG so they scale with it and need no extra DOM plumbing.
 */
export function throwConfetti(parts, { count = 22 } = {}) {
  const colours = ['#ffab67', '#fff4e6', '#b23a22', '#231a13'];
  const svg = parts.svg;

  for (let i = 0; i < count; i++) {
    const bit = node('rect', {
      class: 'confetti-bit',
      x: 46 + (Math.random() * 8 - 4),
      y: 30,
      width: 5,
      height: 8,
      fill: colours[i % colours.length],
      stroke: 'none',
    });
    svg.appendChild(bit);

    const dir = i % 2 === 0 ? 1 : -1;

    gsap.fromTo(bit,
      { opacity: 1, x: 0, y: 0, rotation: 0 },
      {
        x: dir * gsap.utils.random(30, 95),
        y: gsap.utils.random(-70, -20),
        rotation: gsap.utils.random(-260, 260),
        duration: gsap.utils.random(0.9, 1.5),
        ease: 'power2.out',
        delay: i * 0.04,
        repeat: -1,
        repeatDelay: gsap.utils.random(0.6, 2.2),
        onRepeat() { gsap.set(bit, { opacity: 1 }); },
      }
    );

    /* fall + fade on a second, slower tween so bits arc rather than fly flat */
    gsap.to(bit, {
      y: '+=120',
      opacity: 0,
      duration: gsap.utils.random(1, 1.6),
      ease: 'power1.in',
      delay: i * 0.04 + 0.5,
      repeat: -1,
      repeatDelay: gsap.utils.random(0.6, 2.2),
    });
  }
}

/* ── swing ──────────────────────────────────────────────────────────
   A rider on a rope swing. The ropes, the seat and the figure all live
   inside one group that rotates about the anchor, so the whole thing
   travels as a single pendulum rather than as parts flying in formation.
   The figure keeps his own rig, so his legs can kick independently of
   the arc.                                                             */
const SWING = {
  pivot: [120, 12],
  seatY: 148,
  seatHalf: 42,
};

export function createSwing({ tone = 'ink', weight = 7 } = {}) {
  const svg = node('svg', {
    class: `stickman${tone !== 'ink' ? ` stickman--${tone}` : ''}`,
    viewBox: '0 0 240 262',
    'stroke-width': weight,
  });

  const [px, py] = SWING.pivot;
  const { seatY, seatHalf } = SWING;

  /* the beam stays put — only what hangs off it swings */
  svg.appendChild(node('line', { x1: px - 82, y1: py, x2: px + 82, y2: py }));

  const arm = node('g', { class: 'swing-arm' });
  arm.appendChild(node('line', { x1: px, y1: py, x2: px - seatHalf, y2: seatY }));
  arm.appendChild(node('line', { x1: px, y1: py, x2: px + seatHalf, y2: seatY }));

  const rider = createStickman({ tone, weight });
  /* drop the figure in so his hip lands exactly on the seat */
  const holder = node('g', {
    transform: `translate(${px - J.hip[0]}, ${seatY - J.hip[1]})`,
  });
  holder.appendChild(rider.parts.root);
  arm.appendChild(holder);

  /* seat drawn last so it reads in front of his thighs */
  arm.appendChild(node('line', {
    x1: px - seatHalf - 8, y1: seatY, x2: px + seatHalf + 8, y2: seatY,
  }));

  svg.appendChild(arm);

  gsap.set(arm, { svgOrigin: `${px} ${py}` });
  setPose(rider.parts, 'swing');

  return { svg, arm, parts: rider.parts };
}

/** The pendulum itself, with the legs kicking out on the forward half. */
export function swingLoop({ arm, parts }, { speed = 1.5, sweep = 20 } = {}) {
  const tl = gsap.timeline({
    repeat: -1,
    yoyo: true,
    defaults: { duration: speed, ease: 'sine.inOut' },
  });

  tl.fromTo(arm, { rotation: -sweep }, { rotation: sweep }, 0)
    /* legs straighten as he travels forward and tuck on the way back —
       this is what stops it reading as a rigid cut-out on a string */
    .fromTo(parts.thighL, { rotation: -26 }, { rotation: -62 }, 0)
    .fromTo(parts.thighR, { rotation: -46 }, { rotation: -82 }, 0)
    .fromTo(parts.shinL,  { rotation: 54 },  { rotation: 12 },  0)
    .fromTo(parts.shinR,  { rotation: 68 },  { rotation: 24 },  0)
    /* a small lean, opposite the arc, so his weight reads as his own */
    .fromTo(parts.root,   { rotation: 7 },   { rotation: -7 },  0);

  return tl;
}

/** Convenience: build a swing, drop it in a host element. */
export function mountSwing(host, options = {}) {
  const rig = createSwing(options);
  host.appendChild(rig.svg);
  return rig;
}

/** Convenience: build a figure, drop it in a host element, return parts. */
export function mount(host, options = {}) {
  const { svg, parts } = createStickman(options);
  host.appendChild(svg);
  return parts;
}
