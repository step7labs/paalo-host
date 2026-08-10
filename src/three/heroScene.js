/* ══════════════════════════════════════════════════════════════════
   HERO — WebGL backdrop
   A faceted blob that breathes, a hoop around it, and a scatter of
   3D confetti. Deliberately NOT photoreal: flat-shaded palette colours
   on a transparent canvas so the cream paper behind stays the ground.
   ══════════════════════════════════════════════════════════════════ */

import {
  Scene, PerspectiveCamera, WebGLRenderer,
  IcosahedronGeometry, TorusGeometry, TetrahedronGeometry, BoxGeometry,
  MeshStandardMaterial, MeshBasicMaterial, Mesh, Group,
  AmbientLight, DirectionalLight, Color, MathUtils,
} from 'three';

/* mirrors the brand tokens in style.css */
const PALETTE = {
  red:     0xde4b2e,
  amber:   0xffab67,
  redDeep: 0xb23a22,
  ink:     0x231a13,
  cream:   0xfff4e6,
};

/* cheap smooth pseudo-noise — enough to make the surface feel organic
   without shipping a noise library for one effect */
function wobble(x, y, z, t) {
  return (
    Math.sin(x * 1.6 + t) *
    Math.cos(y * 1.7 - t * 0.8) *
    Math.sin(z * 1.5 + t * 0.6)
  );
}

export function initHeroScene(canvas) {
  if (!canvas) return null;

  let renderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch {
    return null;                       // no WebGL — hero just shows the paper
  }

  const scene = new Scene();
  const camera = new PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 11);

  renderer.setClearColor(0x000000, 0);

  /* ── the blob ─────────────────────────────────────────────────── */
  /* Kept deliberately modest: the wordmark is the hero, this is the
     company it keeps. Anything larger and the type stops leading. */
  const RADIUS = 1.75;

  const blobGeo = new IcosahedronGeometry(RADIUS, 3);
  const blobPos = blobGeo.attributes.position;
  const rest = Float32Array.from(blobPos.array);   // undeformed reference

  const blob = new Mesh(
    blobGeo,
    new MeshStandardMaterial({
      color: new Color(PALETTE.red),
      flatShading: true,
      roughness: 0.62,
      metalness: 0.05,
    })
  );

  /* ── the hoops ────────────────────────────────────────────────── */
  const hoop = new Mesh(
    new TorusGeometry(RADIUS * 1.55, 0.04, 8, 90),
    new MeshBasicMaterial({ color: new Color(PALETTE.ink) })
  );
  hoop.rotation.x = 1.15;
  hoop.rotation.y = 0.35;

  const hoop2 = new Mesh(
    new TorusGeometry(RADIUS * 1.85, 0.03, 8, 90),
    new MeshBasicMaterial({ color: new Color(PALETTE.amber) })
  );
  hoop2.rotation.x = -0.85;
  hoop2.rotation.z = 0.5;

  /* ── 3D confetti ──────────────────────────────────────────────── */
  const confetti = new Group();
  const bitGeos = [
    new TetrahedronGeometry(0.26),
    new BoxGeometry(0.34, 0.34, 0.07),
    new BoxGeometry(0.16, 0.5, 0.07),
  ];
  const bitCols = [PALETTE.amber, PALETTE.redDeep, PALETTE.ink, PALETTE.red, PALETTE.cream];

  const bits = [];
  for (let i = 0; i < 30; i++) {
    const mesh = new Mesh(
      bitGeos[i % bitGeos.length],
      new MeshStandardMaterial({
        color: new Color(bitCols[i % bitCols.length]),
        flatShading: true,
        roughness: 0.5,
      })
    );
    mesh.position.set(
      MathUtils.randFloatSpread(13),
      MathUtils.randFloatSpread(9),
      MathUtils.randFloat(-4, 3.5)
    );
    mesh.rotation.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
    bits.push({
      mesh,
      spin: MathUtils.randFloatSpread(0.9),
      drift: MathUtils.randFloat(0.12, 0.4),
      phase: Math.random() * Math.PI * 2,
    });
    confetti.add(mesh);
  }

  /* the arrangement sits up and to the right, leaving the lower-left
     clear for the wordmark */
  const stage = new Group();
  stage.add(blob, hoop, hoop2);
  stage.position.set(3.6, 1.35, 0);

  scene.add(stage, confetti);
  scene.add(new AmbientLight(0xffffff, 1.9));

  const key = new DirectionalLight(0xffffff, 2.4);
  key.position.set(4, 6, 8);
  scene.add(key);

  const rim = new DirectionalLight(PALETTE.amber, 1.5);
  rim.position.set(-6, -3, 4);
  scene.add(rim);

  /* ── responsive sizing ────────────────────────────────────────── */
  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;                 // not laid out yet; the observer will call back

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h, false);
    camera.aspect = w / h;

    /* pull the arrangement in and recentre it on narrow screens so it
       doesn't collide with the type */
    const narrow = w < 900;
    stage.position.x = narrow ? 0.4 : 3.6;
    stage.position.y = narrow ? 2.4 : 1.35;
    stage.scale.setScalar(narrow ? 0.7 : 1);

    camera.updateProjectionMatrix();
  }

  /* Observing the canvas rather than the window means the buffer tracks
     the element's real box — including the first layout after webfonts
     land, which a one-shot call at init reliably measures too early. */
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  /* ── input ────────────────────────────────────────────────────── */
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  window.addEventListener('pointermove', (e) => {
    pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
    pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
  }, { passive: true });

  let scrollN = 0;
  const onScroll = () => {
    scrollN = window.scrollY / Math.max(window.innerHeight, 1);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── loop ─────────────────────────────────────────────────────── */
  let raf = 0;
  let running = true;
  const start = performance.now();

  function frame(now) {
    raf = requestAnimationFrame(frame);

    /* stop drawing once the hero has scrolled away — this is the whole
       reason the rest of the page stays smooth */
    if (scrollN > 1.35) return;

    const t = (now - start) / 1000;

    /* deform the blob against its rest positions */
    for (let i = 0; i < blobPos.count; i++) {
      const ix = i * 3;
      const x = rest[ix], y = rest[ix + 1], z = rest[ix + 2];
      const len = Math.hypot(x, y, z) || 1;
      const amp = RADIUS * (1 + wobble(x, y, z, t * 0.65) * 0.13);
      blobPos.array[ix]     = (x / len) * amp;
      blobPos.array[ix + 1] = (y / len) * amp;
      blobPos.array[ix + 2] = (z / len) * amp;
    }
    blobPos.needsUpdate = true;
    blobGeo.computeVertexNormals();

    blob.rotation.y = t * 0.18;
    blob.rotation.x = Math.sin(t * 0.3) * 0.14;

    hoop.rotation.z  = t * 0.22;
    hoop2.rotation.y = -t * 0.17;

    for (const b of bits) {
      b.mesh.rotation.x += b.spin * 0.012;
      b.mesh.rotation.y += b.spin * 0.009;
      b.mesh.position.y += Math.sin(t * b.drift + b.phase) * 0.004;
    }

    /* eased parallax — the lag is what stops it feeling mechanical */
    pointer.x += (pointer.tx - pointer.x) * 0.045;
    pointer.y += (pointer.ty - pointer.y) * 0.045;

    stage.rotation.y = pointer.x * 0.35;
    stage.rotation.x = pointer.y * 0.22;
    confetti.rotation.y = pointer.x * 0.12;
    confetti.position.y = scrollN * 2.2;

    camera.position.x = pointer.x * 0.55;
    camera.position.y = -pointer.y * 0.4 + scrollN * 1.4;
    camera.lookAt(0, scrollN * 0.6, 0);

    renderer.render(scene, camera);
  }
  raf = requestAnimationFrame(frame);

  /* pause entirely when the tab is hidden */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && running) {
      cancelAnimationFrame(raf);
      running = false;
    } else if (!document.hidden && !running) {
      running = true;
      raf = requestAnimationFrame(frame);
    }
  });

  return {
    destroy() {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('scroll', onScroll);
      renderer.dispose();
      blobGeo.dispose();
      bitGeos.forEach((g) => g.dispose());
    },
  };
}
