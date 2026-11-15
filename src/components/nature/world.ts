/**
 * Интерактивный природный мир для десктопа.
 * Рисуется на одном canvas, каждый объект можно навести и кликнуть.
 */

export interface WorldOptions {
  /** вызывается при первом успешном клике по объекту */
  onInteract?: () => void;
}

export interface WorldHandle {
  destroy: () => void;
}

interface Hit { x: number; y: number; r: number; label: string; act: () => void }

interface Particle {
  x: number; y: number; vx: number; vy: number;
  life: number; decay: number; size: number; hue: number;
  kind: "spark" | "leaf" | "drop" | "ring" | "puff" | "note";
  rot: number; rs: number; grav: number; max: number;
}

/* ───────── entity types ───────── */

interface Tree   { x: number; h: number; kind: 0 | 1 | 2; hue: number; phase: number; shake: number; w: number }
interface Leaf   { x: number; y: number; vx: number; vy: number; rot: number; rs: number; size: number; op: number; hue: number; sat: number; light: number }
interface Bird   { x: number; y: number; vx: number; phase: number; size: number; op: number; hue: number }
interface Deer   { x: number; vx: number; dir: 1 | -1; legPhase: number; size: number; op: number; alert: number; boost: number }
interface Cloud  { x: number; y: number; r: number; vx: number; puffs: { dx: number; dy: number; r: number }[]; op: number; hue: number }
interface Ridge  { pts: { x: number; y: number }[]; drift: number; speed: number; base: number; amp: number }
interface Flow   { x: number; lane: number; len: number; vx: number; op: number; hue: number }
interface Ripple { x: number; y: number; r: number; max: number; op: number }
interface Splash { x: number; y: number; vx: number; vy: number; life: number }
interface Blade  { x: number; h: number; lean: number; phase: number; op: number; hue: number }
interface Flower { x: number; h: number; phase: number; hue: number; r: number; op: number; pop: number }
interface Firefly{ x: number; y: number; ax: number; ay: number; phase: number; speed: number; r: number; hue: number; flash: number }
interface Flutter{ ax: number; ay: number; phase: number; vx: number; hue: number; size: number; scare: number }
interface Seed   { x: number; y: number; vy: number; phase: number; op: number }
interface Star   { x: number; y: number; r: number; phase: number; speed: number; hue: number }
interface SpaceDust { x: number; y: number; r: number; hue: number; op: number; phase: number; speed: number }
interface Nebula { x: number; y: number; rx: number; ry: number; hueA: number; hueB: number; phase: number; drift: number; op: number; angle: number }
interface Constellation { points: { x: number; y: number }[]; links: [number, number][]; hue: number; pulse: number }
interface Galaxy {
  x: number; y: number; r: number; tilt: number; hue: number; phase: number; speed: number; pulse: number;
  stars: { a: number; d: number; arm: number; size: number; op: number; hueShift: number }[];
}
interface Mist   { y: number; w: number; x: number; vx: number; op: number; hue: number }
interface Orb    { x: number; y: number; r: number; vx: number; vy: number; hue: number; op: number; phase: number }
interface Mush   { x: number; scale: number; hue: number; pop: number }
interface Rock   { x: number; y: number; w: number; h: number; hue: number; shake: number; inWater: boolean }
interface Reed   { x: number; h: number; phase: number }
interface Pad    { x: number; r: number; phase: number }

const TAU = Math.PI * 2;

export function createNatureWorld(canvas: HTMLCanvasElement, opts: WorldOptions = {}): WorldHandle {
  const ctx = canvas.getContext("2d");
  if (!ctx) return { destroy: () => {} };

  const rand = (a: number, b: number) => a + Math.random() * (b - a);
  const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

  let W = window.innerWidth;
  let H = window.innerHeight;

  const resize = () => {
    W = window.innerWidth; H = window.innerHeight;
    canvas.width = W; canvas.height = H;
  };
  resize();
  window.addEventListener("resize", resize);

  /* ═══════════ particles ═══════════ */

  const parts: Particle[] = [];
  const MAX_PARTS = 420;

  const addPart = (p: Partial<Particle> & { x: number; y: number; kind: Particle["kind"] }) => {
    if (parts.length > MAX_PARTS) return;
    parts.push({
      vx: 0, vy: 0, life: 1, decay: 0.02, size: 2, hue: 50,
      rot: 0, rs: 0, grav: 0, max: 40, ...p,
    } as Particle);
  };

  const sparks = (x: number, y: number, n: number, hue: number, power = 1) => {
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU), s = rand(0.6, 3.4) * power;
      addPart({ x, y, kind: "spark", vx: Math.cos(a) * s, vy: Math.sin(a) * s - 0.6,
        hue: hue + rand(-18, 18), size: rand(1.2, 2.8), decay: rand(0.015, 0.032), grav: 0.045 });
    }
  };
  const leafBurst = (x: number, y: number, n: number, hue: number) => {
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU), s = rand(0.5, 2.3);
      addPart({ x, y, kind: "leaf", vx: Math.cos(a) * s, vy: Math.sin(a) * s - 0.4,
        hue: hue + rand(-25, 25), size: rand(3, 6.5), decay: rand(0.006, 0.013),
        grav: 0.022, rot: rand(0, TAU), rs: rand(-0.09, 0.09) });
    }
  };
  const ring = (x: number, y: number, hue: number, max: number, decay = 0.022) =>
    addPart({ x, y, kind: "ring", hue, size: 3, max, decay });
  const puff = (x: number, y: number, hue: number, n = 7) => {
    for (let i = 0; i < n; i++) {
      const a = rand(0, TAU), s = rand(0.2, 1.1);
      addPart({ x, y, kind: "puff", vx: Math.cos(a) * s, vy: Math.sin(a) * s - 0.35,
        hue: hue + rand(-20, 20), size: rand(4, 11), decay: rand(0.012, 0.024) });
    }
  };
  const notes = (x: number, y: number, hue: number, n = 3) => {
    for (let i = 0; i < n; i++)
      addPart({ x: x + rand(-6, 6), y, kind: "note", vx: rand(-0.5, 0.5), vy: rand(-1.4, -0.7),
        hue, size: rand(5, 8), decay: 0.012, rot: rand(-0.4, 0.4) });
  };

  /* ═══════════ world geometry ═══════════ */

  const meadow = () => H * 0.885;
  const streamTop = () => H * 0.92;

  /* ═══════════ entities ═══════════ */

  // Деревья (интерактивные)
  const treeHues = [120, 140, 95, 160, 35, 20];
  const trees: Tree[] = Array.from({ length: 11 }, (_, i) => ({
    x: (i + 0.5) / 11 + rand(-0.035, 0.035),
    h: rand(75, 165),
    kind: pick([0, 1, 2]) as 0 | 1 | 2,
    hue: pick(treeHues),
    phase: rand(0, TAU),
    shake: 0,
    w: rand(0.85, 1.25),
  }));

  // Дальняя линия леса (фон)
  const farTrees = Array.from({ length: 46 }, () => ({ x: Math.random(), h: rand(16, 44), w: rand(8, 18) }));

  // Кусты
  const bushes = Array.from({ length: 9 }, () => ({ x: Math.random(), r: rand(14, 30), hue: rand(100, 155), phase: rand(0, TAU) }));

  // Грибы (интерактивные)
  const mushrooms: Mush[] = Array.from({ length: 7 }, () => ({
    x: Math.random(), scale: rand(0.7, 1.4), hue: pick([0, 10, 25, 320, 45]), pop: 0,
  }));

  // Камни (интерактивные)
  const rocks: Rock[] = Array.from({ length: 8 }, (_, i) => {
    const inWater = i > 4;
    return { x: Math.random(), y: inWater ? rand(0.935, 0.98) : 0, w: rand(10, 26), h: rand(7, 16),
      hue: rand(195, 260), shake: 0, inWater };
  });

  // Камыш и кувшинки
  const reeds: Reed[] = Array.from({ length: 22 }, () => ({ x: Math.random(), h: rand(18, 42), phase: rand(0, TAU) }));
  const pads: Pad[] = Array.from({ length: 5 }, () => ({ x: Math.random(), r: rand(10, 18), phase: rand(0, TAU) }));

  // Листья
  const leafHues = [18, 30, 42, 52, 8, 95, 130];
  const leaves: Leaf[] = Array.from({ length: 30 }, () => ({
    x: rand(0, W), y: rand(0, H), vx: rand(-0.18, 0.18), vy: rand(0.12, 0.4),
    rot: rand(0, TAU), rs: rand(-0.009, 0.009), size: rand(4, 10), op: rand(0.4, 0.75),
    hue: pick(leafHues), sat: rand(70, 95), light: rand(45, 62),
  }));

  // Птицы
  const birds: Bird[] = Array.from({ length: 7 }, (_, i) => ({
    x: -100 - i * rand(160, 400), y: rand(50, 240), vx: rand(0.35, 0.65),
    phase: rand(0, TAU), size: rand(9, 14), op: rand(0.4, 0.65), hue: rand(190, 230),
  }));

  // Орёл
  const eagle = { cx: W * 0.7, cy: 130, r: 110, ang: rand(0, TAU), speed: 0.0042, size: 1.5, drift: rand(0.04, 0.07), boost: 0 };

  // Олени
  const deer: Deer[] = [
    { x: W * 0.15, vx: 0.15, dir: 1,  legPhase: 0,   size: 1,   op: 0.55, alert: 0, boost: 0 },
    { x: W * 0.75, vx: 0.12, dir: -1, legPhase: 1.5, size: 0.7, op: 0.45, alert: 0, boost: 0 },
    { x: W * 0.45, vx: 0.1,  dir: 1,  legPhase: 3.1, size: 0.5, op: 0.38, alert: 0, boost: 0 },
  ];

  // Заяц / лиса / ёжик / волк
  const bunny = { x: W * 0.3, dir: 1 as 1 | -1, hop: 0, pause: 120, size: 0.9, big: 0 };
  const fox   = { x: -80, dir: 1 as 1 | -1, phase: 0, size: 0.95, dash: 0 };
  const hog   = { x: W * 0.6, dir: -1 as 1 | -1, phase: 0, curl: 0 };
  const wolf  = { x: W * 0.08, dir: 1 as 1 | -1, phase: 0, howl: 0, walk: 0, pause: 200 };

  // Сова и белка — живут на деревьях
  const owl = { tree: 2, fly: 0, from: 0, to: 0, blink: 0, hoot: 0, turn: 0 };
  const squirrel = { tree: 5, climb: 0.3, dir: 1 as 1 | -1, speed: 0.004, dash: 0 };

  // Лягушка на кувшинке + утка
  const frog = { pad: 0, jump: 0, from: 0, to: 0, croak: 0 };
  const duck = { x: W * 0.4, vx: 0.22, dir: 1 as 1 | -1, bob: 0, flap: 0 };

  // Пчела
  const bee = { x: W * 0.5, y: H * 0.8, tx: W * 0.5, ty: H * 0.8, phase: 0, buzz: 0 };

  // Бабочки / стрекоза / светлячки
  const flutters: Flutter[] = Array.from({ length: 5 }, (_, i) => ({
    ax: rand(100, W - 100), ay: rand(H * 0.25, H * 0.8), phase: i * 1.7,
    vx: rand(0.2, 0.5), hue: [15, 40, 200, 280, 330][i % 5], size: rand(0.9, 1.5), scare: 0,
  }));
  const dragonfly = { x: W * 0.5, y: H * 0.6, tx: W * 0.5, ty: H * 0.6, wing: 0, zip: 0 };
  const fireflies: Firefly[] = Array.from({ length: 18 }, () => ({
    x: rand(0, W), y: rand(0, H), ax: rand(0, W), ay: rand(H * 0.3, H * 0.95),
    phase: rand(0, TAU), speed: rand(0.2, 0.5), r: rand(1.4, 2.8),
    hue: Math.random() > 0.3 ? rand(45, 62) : rand(160, 185), flash: 0,
  }));

  // Сферы света, семена и многослойный космос
  const orbs: Orb[] = Array.from({ length: 7 }, () => ({
    x: rand(0, W), y: rand(H * 0.1, H * 0.9), r: rand(60, 170),
    vx: rand(-0.14, 0.14), vy: rand(-0.07, 0.07),
    hue: pick([160, 190, 275, 330, 45, 120, 210]), op: rand(0.05, 0.11), phase: rand(0, TAU),
  }));
  const seeds: Seed[] = Array.from({ length: 14 }, () => ({
    x: rand(0, W), y: rand(0, H), vy: rand(0.06, 0.2), phase: rand(0, TAU), op: rand(0.25, 0.5),
  }));
  const stars: Star[] = Array.from({ length: 94 }, () => ({
    x: rand(0, W), y: rand(0, H * 0.5), r: rand(0.7, 1.9), phase: rand(0, TAU),
    speed: rand(0.01, 0.035), hue: pick([195, 45, 280, 0, 160]),
  }));

  // Мелкая космическая пыль хранится в относительных координатах и не ломается при resize.
  const spaceDust: SpaceDust[] = Array.from({ length: 148 }, () => ({
    x: rand(0, 1),
    y: rand(0.015, 0.49),
    r: rand(0.25, 1.15),
    hue: pick([185, 205, 225, 265, 305, 42]),
    op: rand(0.08, 0.38),
    phase: rand(0, TAU),
    speed: rand(0.003, 0.018),
  }));

  // Туманности образуют глубину: холодный дальний слой и тёплые цветовые ядра.
  const nebulae: Nebula[] = [
    { x: 0.13, y: 0.14, rx: 0.28, ry: 0.16, hueA: 205, hueB: 275, phase: 0.4, drift: 0.0018, op: 0.105, angle: -0.25 },
    { x: 0.56, y: 0.09, rx: 0.34, ry: 0.14, hueA: 285, hueB: 328, phase: 2.3, drift: 0.0013, op: 0.085, angle: 0.18 },
    { x: 0.88, y: 0.3,  rx: 0.23, ry: 0.17, hueA: 165, hueB: 205, phase: 4.4, drift: 0.0016, op: 0.095, angle: -0.42 },
    { x: 0.4,  y: 0.34, rx: 0.2,  ry: 0.11, hueA: 25,  hueB: 325, phase: 1.2, drift: 0.0011, op: 0.05, angle: 0.34 },
  ];

  // Пыль Млечного Пути лежит вдоль диагонали и медленно дрейфует.
  const galaxyDust = Array.from({ length: 145 }, () => {
    const x = rand(-0.12, 1.12);
    const spread = (Math.random() + Math.random() - 1) * 0.105;
    return { x, y: 0.055 + x * 0.31 + spread, r: rand(0.3, 1.45), op: rand(0.1, 0.55), hue: pick([195, 220, 265, 315, 40]) };
  });

  const constellations: Constellation[] = [
    {
      points: [{ x: .08, y: .1 }, { x: .125, y: .135 }, { x: .17, y: .12 }, { x: .205, y: .17 }, { x: .245, y: .145 }, { x: .28, y: .19 }],
      links: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [1, 3]], hue: 195, pulse: 0,
    },
    {
      points: [{ x: .58, y: .18 }, { x: .62, y: .135 }, { x: .665, y: .16 }, { x: .69, y: .215 }, { x: .735, y: .235 }, { x: .71, y: .28 }],
      links: [[0, 1], [1, 2], [2, 3], [3, 4], [3, 5]], hue: 275, pulse: 0,
    },
    {
      points: [{ x: .34, y: .29 }, { x: .375, y: .25 }, { x: .415, y: .28 }, { x: .45, y: .245 }, { x: .49, y: .275 }],
      links: [[0, 1], [1, 2], [2, 3], [3, 4]], hue: 43, pulse: 0,
    },
  ];

  const makeGalaxy = (x: number, y: number, r: number, tilt: number, hue: number, phase: number): Galaxy => ({
    x, y, r, tilt, hue, phase, speed: rand(0.0007, 0.0016), pulse: 0,
    stars: Array.from({ length: 62 }, (_, i) => {
      const d = Math.pow(Math.random(), 0.72);
      return {
        a: rand(0, TAU), d,
        arm: i % 3,
        size: rand(0.28, 1.05) * (1.2 - d * 0.35),
        op: rand(0.18, 0.68) * (1.1 - d * 0.25),
        hueShift: rand(-28, 32),
      };
    }),
  });
  const galaxies: Galaxy[] = [
    makeGalaxy(0.355, 0.095, 30, -0.28, 205, 0.2),
    makeGalaxy(0.705, 0.265, 23, 0.38, 285, 2.1),
    makeGalaxy(0.945, 0.075, 17, -0.46, 32, 4.2),
  ];

  const starCluster = Array.from({ length: 44 }, () => {
    const a = rand(0, TAU), d = Math.pow(Math.random(), 1.7);
    return { a, d, r: rand(0.35, 1.2), hue: pick([190, 205, 225, 270, 42]), phase: rand(0, TAU) };
  });

  const blackHole = { x: 0.515, y: 0.13, phase: 0, pulse: 0 };

  const moon = {
    x: 0.84, y: 0.145, phase: 0, pulse: 0,
    craters: Array.from({ length: 24 }, () => ({ x: rand(-0.64, 0.57), y: rand(-0.62, 0.62), r: rand(0.025, 0.12), op: rand(0.07, 0.22) })),
    texture: Array.from({ length: 38 }, () => ({ x: rand(-0.86, 0.86), y: rand(-0.86, 0.86), r: rand(0.006, 0.025), op: rand(0.04, 0.14) })),
  };
  const ringPlanet = { x: 0.18, y: 0.275, phase: 0, pulse: 0, tilt: -0.24 };
  const asteroids = Array.from({ length: 24 }, () => ({
    a: rand(0, TAU), orbit: rand(2.7, 4.3), speed: rand(0.0008, 0.0022) * (Math.random() > 0.5 ? 1 : -1),
    size: rand(0.6, 2.2), yScale: rand(0.24, 0.42), hue: rand(195, 255), phase: rand(0, TAU),
  }));
  const deepComet = { x: W * 1.12, y: H * 0.08, vx: -0.55, vy: 0.075, phase: 0, pulse: 0 };
  const meteor = { active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, next: 300 };
  const clouds: Cloud[] = Array.from({ length: 5 }, (_, i) => {
    const r = rand(60, 140);
    return { x: rand(-200, W + 200), y: rand(40, H * 0.32), r,
      vx: rand(0.08, 0.22) * (i % 2 === 0 ? 1 : 1.4), op: rand(0.07, 0.13),
      hue: i % 2 === 0 ? rand(255, 290) : rand(195, 215),
      puffs: Array.from({ length: 4 }, () => ({ dx: rand(-r, r), dy: rand(-r * 0.28, r * 0.28), r: rand(r * 0.5, r) })) };
  });
  const mists: Mist[] = Array.from({ length: 4 }, (_, i) => ({
    y: rand(0.74, 0.92), w: rand(0.35, 0.65), x: rand(0, 1),
    vx: rand(0.0004, 0.0012) * (i % 2 ? 1 : -1), op: rand(0.07, 0.13),
    hue: i % 2 ? rand(170, 200) : rand(265, 295),
  }));

  // Горы
  const makeRidge = (baseRatio: number, amp: number, speed: number): Ridge => {
    const pts: { x: number; y: number }[] = [];
    const n = 9;
    for (let i = 0; i <= n; i++) pts.push({ x: (i / n) * 1.3 - 0.15, y: rand(-1, -0.25) * amp * rand(0.5, 1) });
    return { pts, drift: rand(0, 100), speed, base: baseRatio, amp };
  };
  const ridgeFar = makeRidge(0.78, 0.17, 0.006);
  const ridgeNear = makeRidge(0.9, 0.11, 0.011);
  let auroraPulse = 0;

  // Вода
  const flows: Flow[] = Array.from({ length: 34 }, () => ({
    x: rand(0, W), lane: rand(0.925, 0.99), len: rand(20, 70),
    vx: rand(0.6, 1.8), op: rand(0.25, 0.55), hue: rand(170, 205),
  }));
  const shadows = [
    { x: rand(0, W), lane: 0.955, vx: 0.5, len: 26, op: 0.3 },
    { x: rand(0, W), lane: 0.975, vx: -0.4, len: 18, op: 0.24 },
  ];
  const ripples: Ripple[] = [];
  const splashes: Splash[] = [];
  let nextRipple = 90;
  const fish = { state: "idle" as "idle" | "jump", t: 0, next: 200, x0: 0, x1: 0, h: 46, swimX: W * 0.5 };

  // Трава и цветы
  const blades: Blade[] = Array.from({ length: 110 }, (_, i) => {
    const near = i < 70;
    return { x: rand(0, 1), h: near ? rand(10, 26) : rand(7, 16), lean: rand(-0.3, 0.3),
      phase: rand(0, TAU), op: near ? rand(0.3, 0.55) : rand(0.18, 0.35), hue: rand(95, 155) };
  });
  const flowers: Flower[] = Array.from({ length: 26 }, () => ({
    x: rand(0, 1), h: rand(10, 22), phase: rand(0, TAU),
    hue: pick([330, 50, 275, 10, 190, 300]), r: rand(1.8, 3.2), op: rand(0.4, 0.75), pop: 0,
  }));

  /* ═══════════ interaction state ═══════════ */

  let hits: Hit[] = [];
  let interacted = false;

  const isUi = (t: EventTarget | null) =>
    t instanceof Element && !!t.closest("a,button,input,textarea,select,label,[role='button'],[contenteditable]");

  const findHit = (x: number, y: number) => {
    let best = -1, bestD = Infinity;
    for (let i = 0; i < hits.length; i++) {
      const h = hits[i];
      const d = Math.hypot(h.x - x, h.y - y);
      if (d < h.r && d < bestD) { bestD = d; best = i; }
    }
    return best;
  };

  const onDown = (e: PointerEvent) => {
    if (isUi(e.target)) return;
    const i = findHit(e.clientX, e.clientY);
    if (i >= 0) {
      hits[i].act();
      if (!interacted) { interacted = true; opts.onInteract?.(); }
      return;
    }
    // клик по воде
    if (e.clientY > streamTop()) {
      ripples.push({ x: e.clientX, y: Math.max(e.clientY, streamTop() + 4), r: 2, max: 46, op: 0.8 });
      for (let k = 0; k < 8; k++)
        splashes.push({ x: e.clientX, y: streamTop() + 4, vx: rand(-1.7, 1.7), vy: rand(-3, -1), life: 1 });
      if (!interacted) { interacted = true; opts.onInteract?.(); }
      return;
    }
    // клик по небу — искорки
    sparks(e.clientX, e.clientY, 8, rand(40, 300), 0.7);
  };

  window.addEventListener("pointerdown", onDown, true);

  const hit = (x: number, y: number, r: number, label: string, act: () => void) => hits.push({ x, y, r, label, act });

  /* ═══════════ drawing helpers ═══════════ */

  const drawEdge = (side: "l" | "r") => {
    const t = Date.now() * 0.0003;
    const dir = side === "l" ? 1 : -1;
    const base = side === "l" ? 0 : W;
    const spots = side === "l"
      ? [{ yR: 0.1, r: 210, a: 0.3, ph: 0, col: "70,200,120" },
         { yR: 0.4, r: 230, a: 0.26, ph: 1.5, col: "40,185,165" },
         { yR: 0.7, r: 200, a: 0.28, ph: 3, col: "95,210,105" }]
      : [{ yR: 0.15, r: 210, a: 0.26, ph: 0.7, col: "60,175,215" },
         { yR: 0.45, r: 230, a: 0.24, ph: 2.1, col: "150,110,230" },
         { yR: 0.75, r: 200, a: 0.27, ph: 3.8, col: "55,195,180" }];
    spots.forEach(s => {
      const cx = base + dir * 35 + Math.sin(t + s.ph) * 14;
      const cy = H * s.yR;
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, s.r);
      g.addColorStop(0, `rgba(${s.col},${s.a})`);
      g.addColorStop(0.5, `rgba(${s.col},${s.a * 0.35})`);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(side === "l" ? 0 : W - s.r * 2, cy - s.r, s.r * 2, s.r * 2);
    });
  };

  const drawRidge = (r: Ridge, far: boolean, t: number) => {
    const baseY = H * r.base;
    const pts = r.pts.map(p => ({
      x: p.x * W + Math.sin(t * r.speed * 8 + r.drift + p.x * 4) * 22,
      y: baseY + p.y * H + Math.sin(t * r.speed * 5 + p.x * 9 + r.drift) * 6,
    }));
    const path = () => {
      ctx.beginPath();
      ctx.moveTo(-W * 0.2, H + 4);
      ctx.lineTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        const mxp = (pts[i - 1].x + pts[i].x) / 2, myp = (pts[i - 1].y + pts[i].y) / 2;
        ctx.quadraticCurveTo(pts[i - 1].x, pts[i - 1].y, mxp, myp);
      }
      ctx.lineTo(W * 1.2, pts[pts.length - 1].y + 30);
      ctx.lineTo(W * 1.2, H + 4);
      ctx.closePath();
    };
    path();
    const g = ctx.createLinearGradient(0, baseY - H * r.amp, 0, H);
    if (far) {
      g.addColorStop(0, "rgba(130,120,220,0.3)");
      g.addColorStop(0.5, "rgba(80,130,200,0.16)");
      g.addColorStop(1, "rgba(50,90,150,0.05)");
    } else {
      g.addColorStop(0, "rgba(45,175,155,0.34)");
      g.addColorStop(0.5, "rgba(35,130,135,0.18)");
      g.addColorStop(1, "rgba(25,90,100,0.06)");
    }
    ctx.fillStyle = g; ctx.fill();

    ctx.save();
    ctx.globalAlpha = far ? 0.3 : 0.4;
    ctx.strokeStyle = far ? "rgba(175,165,255,0.75)" : "rgba(90,235,205,0.75)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      const mxp = (pts[i - 1].x + pts[i].x) / 2, myp = (pts[i - 1].y + pts[i].y) / 2;
      ctx.quadraticCurveTo(pts[i - 1].x, pts[i - 1].y, mxp, myp);
    }
    ctx.stroke();
    ctx.restore();

    if (far) {
      ctx.fillStyle = "rgba(235,240,255,0.26)";
      pts.forEach(p => {
        if (p.y < baseY - H * r.amp * 0.55) {
          ctx.beginPath();
          ctx.moveTo(p.x - 17, p.y + 19); ctx.lineTo(p.x, p.y); ctx.lineTo(p.x + 17, p.y + 19);
          ctx.closePath(); ctx.fill();
        }
      });
      // интерактив: клик по горам — вспышка сияния
      hit(W * 0.5, baseY - H * r.amp * 0.6, 70, "Горы", () => {
        auroraPulse = 1;
        ring(W * 0.5, baseY - H * r.amp * 0.6, 270, 160, 0.012);
      });
    }
  };

  /** дерево: 0 — ель, 1 — крона-шар, 2 — берёза */
  const drawTree = (tr: Tree, t: number) => {
    const x = tr.x * W;
    const baseY = meadow() + 8;
    tr.shake *= 0.92;
    const sway = Math.sin(t * 0.011 + tr.phase) * (1.6 + tr.h * 0.016) + Math.sin(t * 0.55) * tr.shake * 7;
    const h = tr.h, w = tr.w;
    const topY = baseY - h;

    ctx.save();
    ctx.globalAlpha = 0.72;

    // ствол
    const trunkW = (tr.kind === 0 ? 5 : tr.kind === 2 ? 4.5 : 6.5) * w;
    const tg = ctx.createLinearGradient(x - trunkW, 0, x + trunkW, 0);
    if (tr.kind === 2) { tg.addColorStop(0, "rgba(215,225,235,0.85)"); tg.addColorStop(1, "rgba(160,175,195,0.85)"); }
    else { tg.addColorStop(0, "rgba(110,80,60,0.95)"); tg.addColorStop(1, "rgba(70,48,36,0.95)"); }
    ctx.fillStyle = tg;
    ctx.beginPath();
    ctx.moveTo(x - trunkW, baseY);
    ctx.quadraticCurveTo(x - trunkW * 0.5 + sway * 0.35, baseY - h * 0.5, x - trunkW * 0.35 + sway * 0.7, topY + h * 0.3);
    ctx.lineTo(x + trunkW * 0.35 + sway * 0.7, topY + h * 0.3);
    ctx.quadraticCurveTo(x + trunkW * 0.5 + sway * 0.35, baseY - h * 0.5, x + trunkW, baseY);
    ctx.closePath(); ctx.fill();

    if (tr.kind === 2) { // штрихи берёзы
      ctx.strokeStyle = "rgba(40,45,55,0.6)"; ctx.lineWidth = 1.2;
      for (let i = 1; i < 5; i++) {
        const yy = baseY - (h * 0.28 * i) / 1.6;
        ctx.beginPath(); ctx.moveTo(x - trunkW * 0.7 + sway * 0.2 * i, yy); ctx.lineTo(x - trunkW * 0.1 + sway * 0.2 * i, yy); ctx.stroke();
      }
    }

    const cx = x + sway, cy = topY + h * 0.22;
    if (tr.kind === 0) {
      // ель — ярусы
      for (let i = 0; i < 4; i++) {
        const tier = i / 4;
        const tw = (26 + h * 0.2) * (1 - tier * 0.52) * w;
        const ty = topY + h * 0.08 + tier * h * 0.26;
        const g = ctx.createLinearGradient(cx - tw, ty, cx + tw, ty + 40);
        g.addColorStop(0, `hsla(${tr.hue},70%,46%,0.95)`);
        g.addColorStop(1, `hsla(${tr.hue + 18},65%,26%,0.95)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(cx * (1 - tier * 0.05) + sway * tier * 0.4, ty - h * 0.1);
        ctx.lineTo(cx - tw + sway * tier * 0.4, ty + h * 0.22);
        ctx.lineTo(cx + tw + sway * tier * 0.4, ty + h * 0.22);
        ctx.closePath(); ctx.fill();
      }
    } else {
      // лиственная крона
      const cr = (22 + h * 0.17) * w;
      const puffsN = 5;
      for (let i = 0; i < puffsN; i++) {
        const a = (i / puffsN) * TAU;
        const px = cx + Math.cos(a) * cr * 0.52;
        const py = cy + Math.sin(a) * cr * 0.34;
        const g = ctx.createRadialGradient(px - cr * 0.2, py - cr * 0.25, 2, px, py, cr * 0.8);
        g.addColorStop(0, `hsla(${tr.hue + 12},80%,55%,0.95)`);
        g.addColorStop(1, `hsla(${tr.hue - 8},70%,28%,0.9)`);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.ellipse(px, py, cr * 0.62, cr * 0.52, 0, 0, TAU); ctx.fill();
      }
      const g2 = ctx.createRadialGradient(cx - cr * 0.3, cy - cr * 0.3, 2, cx, cy, cr);
      g2.addColorStop(0, `hsla(${tr.hue + 20},85%,58%,0.9)`);
      g2.addColorStop(1, `hsla(${tr.hue},72%,30%,0.9)`);
      ctx.fillStyle = g2;
      ctx.beginPath(); ctx.ellipse(cx, cy, cr * 0.72, cr * 0.6, 0, 0, TAU); ctx.fill();
    }
    ctx.restore();

    const label = tr.kind === 0 ? "Ель" : tr.kind === 2 ? "Берёза" : "Дерево";
    hit(cx, cy, (tr.kind === 0 ? 30 : 32) + h * 0.14, label, () => {
      tr.shake = 1;
      leafBurst(cx, cy, 16, tr.hue + 10);
      sparks(cx, cy, 8, tr.hue + 40, 0.8);
      // иногда вспугиваем птиц
      if (Math.random() < 0.55) {
        for (let i = 0; i < 3; i++) {
          const b = birds[Math.floor(rand(0, birds.length))];
          b.x = cx + rand(-20, 20); b.y = cy + rand(-10, 10);
        }
      }
    });
  };

  /* ═══════════ main loop ═══════════ */

  let tick = 0;
  let raf = 0;

  const loop = () => {
    tick++;
    const t = tick;
    hits = [];
    const meadowY = meadow();
    const waterY = streamTop();

    ctx.clearRect(0, 0, W, H);

    /* ── глубокий космический фон ── */
    {
      const sky = ctx.createLinearGradient(0, 0, 0, H * 0.58);
      sky.addColorStop(0, "rgba(0,1,11,0.82)");
      sky.addColorStop(0.42, "rgba(3,4,23,0.68)");
      sky.addColorStop(0.78, "rgba(4,17,31,0.34)");
      sky.addColorStop(1, "rgba(4,16,24,0)");
      ctx.fillStyle = sky;
      ctx.fillRect(0, 0, W, H * 0.58);

      // Очень слабая синяя засветка горизонта связывает небо с горами.
      const horizon = ctx.createLinearGradient(0, H * 0.28, 0, H * 0.62);
      horizon.addColorStop(0, "rgba(35,70,125,0)");
      horizon.addColorStop(0.62, "rgba(25,65,95,0.06)");
      horizon.addColorStop(1, "rgba(20,65,75,0)");
      ctx.fillStyle = horizon;
      ctx.fillRect(0, H * 0.25, W, H * 0.4);
    }

    /* ── объёмные туманности ── */
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (const n of nebulae) {
      n.phase += n.drift;
      const nx = (n.x + Math.sin(n.phase) * 0.012) * W;
      const ny = (n.y + Math.cos(n.phase * 0.73) * 0.008) * H;
      const rx = n.rx * W;
      const ry = n.ry * H;

      ctx.save();
      ctx.translate(nx, ny);
      ctx.rotate(n.angle + Math.sin(n.phase * 0.55) * 0.025);
      ctx.scale(1, Math.max(0.12, ry / rx));

      // Несколько смещённых газовых ядер дают туманности неидеальную живую форму.
      for (let layer = 0; layer < 4; layer++) {
        const lr = rx * (1 - layer * 0.12);
        const lx = Math.sin(n.phase * (1.1 + layer * 0.08) + layer * 1.7) * rx * 0.13;
        const ly = Math.cos(n.phase * 0.8 + layer * 2.1) * rx * 0.07;
        const hue = layer % 2 === 0 ? n.hueA : n.hueB;
        const g = ctx.createRadialGradient(lx - lr * 0.16, ly, 0, lx, ly, lr);
        g.addColorStop(0, `hsla(${hue},88%,66%,${n.op * (0.72 - layer * 0.08)})`);
        g.addColorStop(0.34, `hsla(${(hue + 22) % 360},82%,53%,${n.op * 0.42})`);
        g.addColorStop(0.72, `hsla(${(hue - 18 + 360) % 360},75%,40%,${n.op * 0.13})`);
        g.addColorStop(1, `hsla(${hue},80%,35%,0)`);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(lx, ly, lr, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }
    ctx.restore();

    /* ── Млечный Путь: диагональная газовая лента и звёздная пыль ── */
    {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.translate(W * 0.5, H * 0.2);
      ctx.rotate(0.29);
      const band = ctx.createLinearGradient(0, -H * 0.16, 0, H * 0.16);
      band.addColorStop(0, "rgba(120,150,235,0)");
      band.addColorStop(0.28, "rgba(120,155,235,0.025)");
      band.addColorStop(0.48, "rgba(225,215,255,0.052)");
      band.addColorStop(0.52, "rgba(180,205,255,0.046)");
      band.addColorStop(0.74, "rgba(130,135,230,0.025)");
      band.addColorStop(1, "rgba(100,120,220,0)");
      ctx.fillStyle = band;
      ctx.fillRect(-W * 0.75, -H * 0.18, W * 1.5, H * 0.36);
      ctx.restore();

      ctx.save();
      ctx.globalCompositeOperation = "screen";
      for (const d of galaxyDust) {
        const drift = Math.sin(t * 0.0018 + d.x * 9) * 2;
        const x = d.x * W;
        const y = d.y * H + drift;
        if (y < 0 || y > H * 0.54) continue;
        ctx.globalAlpha = d.op * (0.72 + Math.sin(t * 0.012 + d.x * 31) * 0.28);
        ctx.fillStyle = `hsla(${d.hue},80%,82%,0.95)`;
        ctx.beginPath(); ctx.arc(x, y, d.r, 0, TAU); ctx.fill();
      }
      ctx.restore();

      // Неровные тёмные прожилки поглощающей пыли внутри Млечного Пути.
      ctx.save();
      ctx.translate(W * 0.5, H * 0.2);
      ctx.rotate(0.29);
      ctx.lineCap = "round";
      for (let lane = 0; lane < 3; lane++) {
        const off = (lane - 1) * 17;
        ctx.globalAlpha = 0.11 - lane * 0.016;
        ctx.strokeStyle = "rgba(0,1,12,0.95)";
        ctx.lineWidth = 7 + lane * 5;
        ctx.beginPath();
        ctx.moveTo(-W * 0.72, off - 7);
        ctx.bezierCurveTo(-W * 0.25, off + 18 + Math.sin(t * 0.001 + lane) * 4,
          W * 0.18, off - 17, W * 0.72, off + 8);
        ctx.stroke();
      }
      ctx.restore();
    }

    /* ── дальняя космическая пыль ── */
    for (const d of spaceDust) {
      d.phase += d.speed;
      const x = d.x * W + Math.sin(d.phase * 0.45) * 1.2;
      const y = d.y * H;
      ctx.globalAlpha = d.op * (0.45 + Math.abs(Math.sin(d.phase)) * 0.55);
      ctx.fillStyle = `hsla(${d.hue},75%,82%,0.9)`;
      ctx.beginPath(); ctx.arc(x, y, d.r, 0, TAU); ctx.fill();
    }
    ctx.globalAlpha = 1;

    /* ── сияние ── */
    auroraPulse *= 0.985;
    ctx.save();
    for (let band = 0; band < 3; band++) {
      ctx.globalAlpha = (0.078 - band * 0.016) + Math.sin(t * 0.004 + band) * 0.026 + auroraPulse * 0.18;
      ctx.beginPath();
      const yTop = H * (0.02 + band * 0.05);
      for (let x = 0; x <= W; x += 36) {
        const y = yTop + Math.sin(x * 0.004 + t * 0.006 + band) * 28 + Math.sin(x * 0.011 - t * 0.004) * 15;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      for (let x = W; x >= 0; x -= 36) ctx.lineTo(x, yTop + H * 0.14 + Math.sin(x * 0.003 + t * 0.005 + 2 + band) * 32);
      ctx.closePath();
      const cols = [
        ["rgba(70,255,170,0.95)", "rgba(60,200,255,0)"],
        ["rgba(150,120,255,0.9)", "rgba(80,220,255,0)"],
        ["rgba(255,120,200,0.8)", "rgba(120,160,255,0)"],
      ][band];
      const ag = ctx.createLinearGradient(0, yTop, 0, yTop + H * 0.2);
      ag.addColorStop(0, cols[0]); ag.addColorStop(1, cols[1]);
      ctx.fillStyle = ag; ctx.fill();
    }
    ctx.restore();

    /* ── сферы боке ── */
    for (const o of orbs) {
      o.x += o.vx; o.y += o.vy; o.phase += 0.006;
      if (o.x < -o.r) o.x = W + o.r;
      if (o.x > W + o.r) o.x = -o.r;
      if (o.y < -o.r) o.y = H + o.r;
      if (o.y > H + o.r) o.y = -o.r;
      ctx.save();
      ctx.globalAlpha = o.op * (0.75 + Math.sin(o.phase) * 0.25);
      const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
      g.addColorStop(0, `hsla(${o.hue},90%,65%,0.9)`);
      g.addColorStop(0.55, `hsla(${o.hue},90%,55%,0.22)`);
      g.addColorStop(1, `hsla(${o.hue},90%,50%,0)`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, TAU); ctx.fill();
      ctx.restore();
    }

    /* ── далёкие галактики: ядро, три спиральных рукава и звёздная россыпь ── */
    for (const gal of galaxies) {
      gal.phase += gal.speed * (1 + gal.pulse * 7);
      gal.pulse *= 0.975;
      const gx = gal.x * W, gy = gal.y * H;
      const gr = gal.r * (1 + gal.pulse * 0.16);

      ctx.save();
      ctx.translate(gx, gy);
      ctx.rotate(gal.tilt);
      ctx.scale(1, 0.48);
      ctx.globalCompositeOperation = "screen";

      // Едва заметные рукава дают структуру даже в очень тёмном небе.
      for (let arm = 0; arm < 3; arm++) {
        ctx.globalAlpha = 0.09 + gal.pulse * 0.12;
        ctx.strokeStyle = `hsla(${gal.hue + arm * 14},78%,68%,0.85)`;
        ctx.lineWidth = 2.8 - arm * 0.45;
        ctx.beginPath();
        for (let k = 0; k <= 34; k++) {
          const d = k / 34;
          const a = gal.phase + arm * TAU / 3 + d * 5.25;
          const rr = gr * 1.62 * d;
          const px = Math.cos(a) * rr, py = Math.sin(a) * rr;
          k === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py);
        }
        ctx.stroke();
      }

      for (const st of gal.stars) {
        const a = st.a + gal.phase + st.d * 5.1 + st.arm * TAU / 3;
        const d = st.d * gr * 1.65;
        const sx = Math.cos(a) * d, sy = Math.sin(a) * d;
        ctx.globalAlpha = st.op * (0.62 + Math.sin(t * 0.013 + st.a * 5) * 0.25 + gal.pulse * 0.45);
        ctx.fillStyle = `hsla(${gal.hue + st.hueShift},80%,82%,0.95)`;
        ctx.beginPath(); ctx.arc(sx, sy, st.size, 0, TAU); ctx.fill();
      }

      const core = ctx.createRadialGradient(0, 0, 0, 0, 0, gr * 0.54);
      core.addColorStop(0, `hsla(${gal.hue + 35},78%,94%,${0.72 + gal.pulse * 0.2})`);
      core.addColorStop(0.2, `hsla(${gal.hue + 12},88%,72%,0.48)`);
      core.addColorStop(0.58, `hsla(${gal.hue},80%,48%,0.16)`);
      core.addColorStop(1, `hsla(${gal.hue},70%,35%,0)`);
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = core;
      ctx.beginPath(); ctx.arc(0, 0, gr * 0.54, 0, TAU); ctx.fill();
      ctx.restore();

      hit(gx, gy, gr * 1.4, "Галактика", () => {
        gal.pulse = 1;
        sparks(gx, gy, 14, gal.hue, 0.65);
      });
    }

    /* ── компактное звёздное скопление ── */
    {
      const cx = W * 0.635, cy = H * 0.07;
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      for (const st of starCluster) {
        st.phase += 0.011;
        const rr = st.d * 36;
        const x = cx + Math.cos(st.a + t * 0.00018) * rr;
        const y = cy + Math.sin(st.a + t * 0.00018) * rr * 0.72;
        ctx.globalAlpha = 0.18 + Math.abs(Math.sin(st.phase)) * 0.46;
        ctx.fillStyle = `hsla(${st.hue},82%,86%,0.95)`;
        ctx.beginPath(); ctx.arc(x, y, st.r, 0, TAU); ctx.fill();
      }
      const clusterGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 42);
      clusterGlow.addColorStop(0, "rgba(205,220,255,0.09)");
      clusterGlow.addColorStop(1, "rgba(140,160,255,0)");
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = clusterGlow;
      ctx.beginPath(); ctx.arc(cx, cy, 42, 0, TAU); ctx.fill();
      ctx.restore();
      hit(cx, cy, 34, "Звёздное скопление", () => {
        for (const st of starCluster) st.phase += Math.PI * 0.6;
        sparks(cx, cy, 18, 215, 0.65);
      });
    }

    /* ── чёрная дыра: линзирование, фотонное кольцо и аккреционный диск ── */
    {
      blackHole.phase += 0.012 + blackHole.pulse * 0.04;
      blackHole.pulse *= 0.97;
      const x = blackHole.x * W, y = blackHole.y * H;
      const r = Math.max(8, Math.min(12.5, W * 0.008));

      // Вертикальные релятивистские джеты почти незаметны и видны только в темноте.
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = 0.08 + blackHole.pulse * 0.1;
      const jet = ctx.createLinearGradient(0, y - r * 8, 0, y + r * 8);
      jet.addColorStop(0, "rgba(90,160,255,0)");
      jet.addColorStop(0.42, "rgba(100,190,255,0.3)");
      jet.addColorStop(0.5, "rgba(240,245,255,0.8)");
      jet.addColorStop(0.58, "rgba(160,100,255,0.3)");
      jet.addColorStop(1, "rgba(150,100,255,0)");
      ctx.fillStyle = jet;
      ctx.fillRect(x - 1.3, y - r * 8, 2.6, r * 16);
      ctx.restore();

      // Диск рисуется эллипсом; горячая сторона ярче холодной.
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(-0.16);
      ctx.scale(1, 0.31);
      ctx.globalCompositeOperation = "screen";
      const disk = ctx.createRadialGradient(0, 0, r * 0.85, 0, 0, r * (4.2 + blackHole.pulse));
      disk.addColorStop(0, "rgba(255,250,225,0)");
      disk.addColorStop(0.16, `rgba(255,245,215,${0.68 + blackHole.pulse * 0.2})`);
      disk.addColorStop(0.3, "rgba(255,145,65,0.42)");
      disk.addColorStop(0.54, "rgba(190,75,225,0.2)");
      disk.addColorStop(0.78, "rgba(80,145,255,0.07)");
      disk.addColorStop(1, "rgba(80,125,255,0)");
      ctx.fillStyle = disk;
      ctx.beginPath(); ctx.arc(0, 0, r * (4.2 + blackHole.pulse), 0, TAU); ctx.fill();

      // Тонкие неоднородности вещества вращаются внутри диска.
      for (let k = 0; k < 7; k++) {
        const a = blackHole.phase * (1 + k * 0.06) + k * 0.9;
        const rr = r * (1.35 + k * 0.39);
        ctx.globalAlpha = 0.16 + (k % 2) * 0.07;
        ctx.strokeStyle = k < 3 ? "rgba(255,215,165,0.9)" : "rgba(125,155,255,0.7)";
        ctx.lineWidth = 0.65;
        ctx.beginPath(); ctx.arc(0, 0, rr, a, a + 1.65); ctx.stroke();
      }
      ctx.restore();

      // Абсолютно тёмная тень и тонкое фотонное кольцо.
      ctx.save();
      const shadow = ctx.createRadialGradient(x - r * 0.15, y - r * 0.15, 0, x, y, r * 1.3);
      shadow.addColorStop(0, "rgba(0,0,2,1)");
      shadow.addColorStop(0.72, "rgba(0,0,4,1)");
      shadow.addColorStop(0.82, "rgba(255,210,170,0.8)");
      shadow.addColorStop(0.9, "rgba(90,160,255,0.16)");
      shadow.addColorStop(1, "rgba(60,100,255,0)");
      ctx.fillStyle = shadow;
      ctx.beginPath(); ctx.arc(x, y, r * 1.3, 0, TAU); ctx.fill();
      ctx.globalAlpha = 0.25 + blackHole.pulse * 0.25;
      ctx.strokeStyle = "rgba(220,235,255,0.8)";
      ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.arc(x, y, r * 1.7, -1.15, 1.15); ctx.stroke();
      ctx.restore();

      hit(x, y, r * 3.6, "Чёрная дыра", () => {
        blackHole.pulse = 1;
        ring(x, y, 25, 90, 0.025);
        for (const gal of galaxies) gal.pulse = Math.max(gal.pulse, 0.35);
      });
    }

    /* ── звёзды разных спектральных классов ── */
    for (const s of stars) {
      s.phase += s.speed;
      ctx.save();
      const twinkle = 0.14 + Math.abs(Math.sin(s.phase)) * 0.56;
      ctx.globalAlpha = twinkle;
      const sg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 4);
      sg.addColorStop(0, `hsla(${s.hue},85%,80%,1)`);
      sg.addColorStop(1, `hsla(${s.hue},85%,70%,0)`);
      ctx.fillStyle = sg;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 4, 0, TAU); ctx.fill();
      ctx.fillStyle = `hsla(${s.hue},60%,95%,1)`;
      ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, TAU); ctx.fill();

      // Самые яркие звёзды получают оптические лучи, остальные остаются точками.
      if (s.r > 1.52) {
        const spike = s.r * (3.2 + Math.abs(Math.sin(s.phase * 0.7)) * 2.2);
        ctx.globalAlpha = twinkle * 0.38;
        const hg = ctx.createLinearGradient(s.x - spike, s.y, s.x + spike, s.y);
        hg.addColorStop(0, `hsla(${s.hue},85%,85%,0)`);
        hg.addColorStop(0.5, `hsla(${s.hue},85%,92%,0.9)`);
        hg.addColorStop(1, `hsla(${s.hue},85%,85%,0)`);
        ctx.strokeStyle = hg; ctx.lineWidth = 0.65;
        ctx.beginPath(); ctx.moveTo(s.x - spike, s.y); ctx.lineTo(s.x + spike, s.y); ctx.stroke();
        const vg = ctx.createLinearGradient(s.x, s.y - spike, s.x, s.y + spike);
        vg.addColorStop(0, `hsla(${s.hue},85%,85%,0)`);
        vg.addColorStop(0.5, `hsla(${s.hue},85%,92%,0.9)`);
        vg.addColorStop(1, `hsla(${s.hue},85%,85%,0)`);
        ctx.strokeStyle = vg;
        ctx.beginPath(); ctx.moveTo(s.x, s.y - spike); ctx.lineTo(s.x, s.y + spike); ctx.stroke();
      }
      ctx.restore();
      hit(s.x, s.y, 14, "Звезда", () => {
        meteor.active = true; meteor.x = s.x; meteor.y = s.y;
        const sp = rand(6, 9); meteor.vx = -sp * 0.8; meteor.vy = sp * 0.45; meteor.life = 1;
        sparks(s.x, s.y, 10, s.hue, 0.8);
      });
    }

    /* ── созвездия: тонкие линии проявляются как часть неба, без hover-обводки ── */
    for (const cst of constellations) {
      cst.pulse *= 0.97;
      const breathe = 0.58 + Math.sin(t * 0.007 + cst.hue) * 0.18 + cst.pulse * 0.65;
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = 0.11 + breathe * 0.12;
      ctx.strokeStyle = `hsla(${cst.hue},85%,78%,0.9)`;
      ctx.lineWidth = 0.75 + cst.pulse * 0.8;
      ctx.beginPath();
      for (const [a, b] of cst.links) {
        const p1 = cst.points[a], p2 = cst.points[b];
        ctx.moveTo(p1.x * W, p1.y * H);
        ctx.lineTo(p2.x * W, p2.y * H);
      }
      ctx.stroke();

      for (let i = 0; i < cst.points.length; i++) {
        const p = cst.points[i];
        const x = p.x * W, y = p.y * H;
        const rr = 1.2 + (i % 3) * 0.35 + cst.pulse * 0.9;
        ctx.globalAlpha = 0.38 + breathe * 0.36;
        const cg = ctx.createRadialGradient(x, y, 0, x, y, rr * 4);
        cg.addColorStop(0, `hsla(${cst.hue},90%,90%,1)`);
        cg.addColorStop(1, `hsla(${cst.hue},90%,70%,0)`);
        ctx.fillStyle = cg;
        ctx.beginPath(); ctx.arc(x, y, rr * 4, 0, TAU); ctx.fill();
        ctx.fillStyle = `hsla(${cst.hue},70%,94%,1)`;
        ctx.beginPath(); ctx.arc(x, y, rr, 0, TAU); ctx.fill();
      }
      ctx.restore();

      const cx = cst.points.reduce((sum, p) => sum + p.x, 0) / cst.points.length * W;
      const cy = cst.points.reduce((sum, p) => sum + p.y, 0) / cst.points.length * H;
      hit(cx, cy, 42, "Созвездие", () => {
        cst.pulse = 1;
        for (const p of cst.points) sparks(p.x * W, p.y * H, 3, cst.hue, 0.45);
      });
    }

    /* ── детальная луна: корона, рельеф, кратеры и мягкий терминатор ── */
    {
      moon.phase += 0.0022;
      moon.pulse *= 0.975;
      const x = moon.x * W + Math.sin(moon.phase) * 2.5;
      const y = moon.y * H + Math.cos(moon.phase * 0.7) * 1.5;
      const r = Math.max(30, Math.min(49, W * 0.031));

      ctx.save();
      ctx.globalCompositeOperation = "screen";
      const haloR = r * (2.7 + moon.pulse * 0.65);
      const halo = ctx.createRadialGradient(x, y, r * 0.55, x, y, haloR);
      halo.addColorStop(0, `rgba(210,225,255,${0.22 + moon.pulse * 0.2})`);
      halo.addColorStop(0.32, `rgba(145,185,255,${0.09 + moon.pulse * 0.13})`);
      halo.addColorStop(0.7, "rgba(125,120,255,0.025)");
      halo.addColorStop(1, "rgba(100,120,255,0)");
      ctx.fillStyle = halo;
      ctx.beginPath(); ctx.arc(x, y, haloR, 0, TAU); ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip();

      // Сфера освещается сверху справа.
      const surface = ctx.createRadialGradient(x + r * 0.34, y - r * 0.38, r * 0.05, x - r * 0.12, y + r * 0.08, r * 1.35);
      surface.addColorStop(0, "rgba(255,252,235,0.98)");
      surface.addColorStop(0.35, "rgba(220,230,245,0.98)");
      surface.addColorStop(0.72, "rgba(145,165,205,0.96)");
      surface.addColorStop(1, "rgba(55,65,105,0.95)");
      ctx.fillStyle = surface;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);

      // Моря и светлые высокогорья.
      ctx.globalAlpha = 0.18;
      ctx.fillStyle = "rgba(45,60,105,0.95)";
      ctx.beginPath(); ctx.ellipse(x - r * 0.22, y - r * 0.14, r * 0.42, r * 0.23, -0.35, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x + r * 0.26, y + r * 0.28, r * 0.31, r * 0.18, 0.5, 0, TAU); ctx.fill();
      ctx.fillStyle = "rgba(255,255,245,0.72)";
      ctx.beginPath(); ctx.ellipse(x + r * 0.2, y - r * 0.35, r * 0.25, r * 0.12, -0.2, 0, TAU); ctx.fill();

      // Кратеры с внутренней тенью и светлым валом.
      for (const cr of moon.craters) {
        const cx = x + cr.x * r, cy = y + cr.y * r, rr = cr.r * r;
        ctx.globalAlpha = cr.op;
        const crater = ctx.createRadialGradient(cx - rr * 0.3, cy - rr * 0.35, rr * 0.08, cx, cy, rr);
        crater.addColorStop(0, "rgba(255,255,250,0.8)");
        crater.addColorStop(0.46, "rgba(100,120,165,0.65)");
        crater.addColorStop(0.75, "rgba(45,55,90,0.75)");
        crater.addColorStop(1, "rgba(215,225,245,0.25)");
        ctx.fillStyle = crater;
        ctx.beginPath(); ctx.ellipse(cx, cy, rr, rr * 0.82, cr.x * 0.6, 0, TAU); ctx.fill();

        if (cr.r > 0.085) {
          ctx.globalAlpha = cr.op * 0.18;
          ctx.strokeStyle = "rgba(245,248,255,0.8)";
          ctx.lineWidth = 0.45;
          for (let ray = 0; ray < 6; ray++) {
            const a = ray * TAU / 6 + cr.x * 3;
            ctx.beginPath();
            ctx.moveTo(cx + Math.cos(a) * rr * 1.05, cy + Math.sin(a) * rr * 1.05);
            ctx.lineTo(cx + Math.cos(a) * rr * 2.6, cy + Math.sin(a) * rr * 2.6);
            ctx.stroke();
          }
        }
      }

      // Микрорельеф не даёт гладким участкам выглядеть цифровым градиентом.
      for (const tx of moon.texture) {
        if (tx.x * tx.x + tx.y * tx.y > 0.82) continue;
        ctx.globalAlpha = tx.op;
        ctx.fillStyle = tx.x > 0 ? "rgba(255,255,245,0.8)" : "rgba(35,45,80,0.9)";
        ctx.beginPath();
        ctx.arc(x + tx.x * r, y + tx.y * r, Math.max(0.35, tx.r * r), 0, TAU);
        ctx.fill();
      }

      // Полупрозрачный терминатор добавляет объём, не превращая луну в плоский диск.
      ctx.globalAlpha = 0.42;
      const terminator = ctx.createLinearGradient(x - r, y, x + r * 0.8, y);
      terminator.addColorStop(0, "rgba(6,8,28,0.82)");
      terminator.addColorStop(0.42, "rgba(20,25,65,0.28)");
      terminator.addColorStop(0.76, "rgba(20,25,65,0)");
      ctx.fillStyle = terminator;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
      ctx.restore();

      // Холодный кант по освещённой стороне.
      ctx.save();
      ctx.globalAlpha = 0.72 + moon.pulse * 0.25;
      ctx.strokeStyle = "rgba(220,238,255,0.9)";
      ctx.lineWidth = 1.15 + moon.pulse;
      ctx.beginPath(); ctx.arc(x, y, r + 0.4, -1.34, 1.4); ctx.stroke();
      ctx.restore();

      hit(x, y, r * 1.25, "Луна", () => {
        moon.pulse = 1;
        auroraPulse = Math.max(auroraPulse, 0.35);
        sparks(x + r * 0.7, y - r * 0.3, 18, 205, 0.8);
      });
    }

    /* ── кольцевая планета с атмосферными полосами и маленьким спутником ── */
    {
      ringPlanet.phase += 0.004 + ringPlanet.pulse * 0.012;
      ringPlanet.pulse *= 0.975;
      const x = ringPlanet.x * W + Math.cos(ringPlanet.phase * 0.55) * 2;
      const y = ringPlanet.y * H + Math.sin(ringPlanet.phase * 0.7) * 1.5;
      const r = Math.max(16, Math.min(25, W * 0.016));
      const ringW = r * 2.25;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ringPlanet.tilt);
      ctx.globalCompositeOperation = "screen";
      ctx.globalAlpha = 0.34 + ringPlanet.pulse * 0.24;
      for (let k = 0; k < 3; k++) {
        ctx.strokeStyle = k === 1 ? "rgba(210,185,255,0.8)" : "rgba(130,195,255,0.6)";
        ctx.lineWidth = 1.1;
        ctx.beginPath(); ctx.ellipse(0, 0, ringW + k * 3.2, r * 0.47 + k * 0.8, 0, Math.PI, TAU); ctx.stroke();
      }
      ctx.restore();

      ctx.save();
      ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip();
      const pg = ctx.createRadialGradient(x + r * 0.34, y - r * 0.4, 1, x, y, r * 1.25);
      pg.addColorStop(0, "rgba(245,220,255,0.96)");
      pg.addColorStop(0.3, "rgba(175,130,235,0.96)");
      pg.addColorStop(0.72, "rgba(65,105,185,0.95)");
      pg.addColorStop(1, "rgba(25,35,90,0.96)");
      ctx.fillStyle = pg;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
      ctx.globalAlpha = 0.2;
      for (let k = -3; k <= 3; k++) {
        ctx.strokeStyle = k % 2 ? "rgba(255,210,240,0.8)" : "rgba(90,210,245,0.7)";
        ctx.lineWidth = 1.3;
        ctx.beginPath();
        ctx.ellipse(x, y + k * r * 0.18 + Math.sin(ringPlanet.phase + k) * 0.6, r * 1.1, r * 0.13, 0, 0, TAU);
        ctx.stroke();
      }
      ctx.restore();

      // Передняя половина колец проходит поверх сферы.
      ctx.save();
      ctx.translate(x, y); ctx.rotate(ringPlanet.tilt);
      ctx.globalAlpha = 0.5 + ringPlanet.pulse * 0.3;
      ctx.strokeStyle = "rgba(205,220,255,0.85)";
      ctx.lineWidth = 1.25;
      ctx.beginPath(); ctx.ellipse(0, 0, ringW, r * 0.47, 0, 0, Math.PI); ctx.stroke();
      ctx.restore();

      const satelliteAngle = ringPlanet.phase * 1.5;
      const sx = x + Math.cos(satelliteAngle) * r * 3.0;
      const sy = y + Math.sin(satelliteAngle) * r * 0.85;
      ctx.fillStyle = "rgba(185,230,255,0.82)";
      ctx.beginPath(); ctx.arc(sx, sy, 1.6 + ringPlanet.pulse, 0, TAU); ctx.fill();

      // Разреженный пояс астероидов движется по орбитам с разной скоростью.
      for (const rock of asteroids) {
        rock.a += rock.speed * (1 + ringPlanet.pulse * 5);
        const ax = x + Math.cos(rock.a) * r * rock.orbit;
        const ay = y + Math.sin(rock.a) * r * rock.orbit * rock.yScale;
        const shade = 0.42 + Math.sin(rock.a) * 0.2;
        ctx.save();
        ctx.translate(ax, ay);
        ctx.rotate(rock.a + rock.phase + t * rock.speed * 3);
        ctx.globalAlpha = shade;
        ctx.fillStyle = `hsla(${rock.hue},28%,${38 + shade * 26}%,0.95)`;
        ctx.beginPath();
        ctx.moveTo(-rock.size, -rock.size * 0.35);
        ctx.lineTo(-rock.size * 0.2, -rock.size * 0.8);
        ctx.lineTo(rock.size, -rock.size * 0.12);
        ctx.lineTo(rock.size * 0.48, rock.size * 0.7);
        ctx.lineTo(-rock.size * 0.72, rock.size * 0.52);
        ctx.closePath(); ctx.fill();
        ctx.restore();
        hit(ax, ay, 9, "Астероид", () => {
          rock.a += 0.35;
          sparks(ax, ay, 6, rock.hue, 0.45);
        });
      }

      hit(x, y, ringW * 1.05, "Планета", () => {
        ringPlanet.pulse = 1;
        sparks(x, y, 16, 275, 0.8);
      });
    }

    /* ── далёкая комета: медленнее метеора, с широким газовым хвостом ── */
    {
      deepComet.phase += 0.01;
      deepComet.pulse *= 0.97;
      deepComet.x += deepComet.vx * (1 + deepComet.pulse * 2);
      deepComet.y += deepComet.vy;
      if (deepComet.x < -170 || deepComet.y > H * 0.48) {
        deepComet.x = W + rand(100, 360);
        deepComet.y = rand(H * 0.025, H * 0.16);
      }
      const x = deepComet.x, y = deepComet.y + Math.sin(deepComet.phase) * 2;
      const len = 105 + deepComet.pulse * 55;
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      const tail = ctx.createLinearGradient(x, y, x + len, y - len * 0.13);
      tail.addColorStop(0, `rgba(225,250,255,${0.56 + deepComet.pulse * 0.3})`);
      tail.addColorStop(0.28, "rgba(105,220,255,0.22)");
      tail.addColorStop(0.7, "rgba(150,125,255,0.07)");
      tail.addColorStop(1, "rgba(150,125,255,0)");
      ctx.strokeStyle = tail;
      ctx.lineWidth = 2.5 + deepComet.pulse * 1.5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.quadraticCurveTo(x + len * 0.5, y - len * 0.08 + Math.sin(t * 0.01) * 2, x + len, y - len * 0.13);
      ctx.stroke();
      const head = ctx.createRadialGradient(x, y, 0, x, y, 8 + deepComet.pulse * 5);
      head.addColorStop(0, "rgba(255,255,245,1)");
      head.addColorStop(0.35, "rgba(130,235,255,0.8)");
      head.addColorStop(1, "rgba(125,160,255,0)");
      ctx.fillStyle = head;
      ctx.beginPath(); ctx.arc(x, y, 8 + deepComet.pulse * 5, 0, TAU); ctx.fill();
      ctx.restore();
      hit(x, y, 22, "Комета", () => {
        deepComet.pulse = 1;
        sparks(x, y, 18, 190, 1);
      });
    }

    /* ── метеор ── */
    if (!meteor.active && tick > meteor.next) {
      meteor.active = true; meteor.x = rand(W * 0.2, W * 0.9); meteor.y = rand(20, H * 0.25);
      const sp = rand(6, 9); meteor.vx = -sp * 0.8; meteor.vy = sp * 0.45; meteor.life = 1;
    }
    if (meteor.active) {
      meteor.x += meteor.vx; meteor.y += meteor.vy; meteor.life -= 0.016;
      if (meteor.life <= 0) { meteor.active = false; meteor.next = tick + rand(280, 620); }
      else {
        ctx.save();
        ctx.globalAlpha = meteor.life;
        const mg = ctx.createLinearGradient(meteor.x, meteor.y, meteor.x - meteor.vx * 16, meteor.y - meteor.vy * 16);
        mg.addColorStop(0, "rgba(255,245,210,1)");
        mg.addColorStop(0.4, "rgba(130,220,255,0.6)");
        mg.addColorStop(1, "rgba(150,120,255,0)");
        ctx.strokeStyle = mg; ctx.lineWidth = 2.2; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(meteor.x, meteor.y);
        ctx.lineTo(meteor.x - meteor.vx * 16, meteor.y - meteor.vy * 16); ctx.stroke();
        ctx.restore();
      }
    }

    /* ── облака (клик = дождик) ── */
    for (const cl of clouds) {
      cl.x += cl.vx;
      if (cl.x - cl.r * 2 > W) { cl.x = -cl.r * 2.5; cl.y = rand(40, H * 0.3); }
      ctx.save();
      ctx.globalAlpha = cl.op;
      ctx.fillStyle = `hsla(${cl.hue},70%,70%,1)`;
      for (const p of cl.puffs) {
        ctx.beginPath();
        ctx.ellipse(cl.x + p.dx, cl.y + p.dy + Math.sin(t * 0.004 + p.dx) * 2, p.r, p.r * 0.45, 0, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
      hit(cl.x, cl.y, cl.r * 0.9, "Облако", () => {
        for (let i = 0; i < 16; i++)
          addPart({ x: cl.x + rand(-cl.r, cl.r), y: cl.y + rand(0, 14), kind: "drop",
            vx: rand(-0.3, 0.3), vy: rand(2.4, 4.4), hue: 195, size: rand(1.1, 2), decay: 0.004, grav: 0.07 });
      });
    }

    drawEdge("l"); drawEdge("r");
    drawRidge(ridgeFar, true, t);
    drawRidge(ridgeNear, false, t);

    /* ── дальняя линия леса ── */
    ctx.save();
    ctx.globalAlpha = 0.33;
    for (const ft of farTrees) {
      const x = ft.x * W, by = H * 0.9 + 6;
      const g = ctx.createLinearGradient(0, by - ft.h, 0, by);
      g.addColorStop(0, "rgba(60,160,150,0.9)");
      g.addColorStop(1, "rgba(25,70,80,0.9)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x, by - ft.h); ctx.lineTo(x - ft.w * 0.5, by); ctx.lineTo(x + ft.w * 0.5, by);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();

    /* ── туман ── */
    for (const m of mists) {
      m.x += m.vx;
      if (m.x > 1.3) m.x = -0.3;
      if (m.x < -0.3) m.x = 1.3;
      ctx.save();
      ctx.globalAlpha = m.op * (0.7 + Math.sin(t * 0.003 + m.w) * 0.3);
      const mg = ctx.createLinearGradient(m.x * W - m.w * W * 0.5, 0, m.x * W + m.w * W * 0.5, 0);
      mg.addColorStop(0, `hsla(${m.hue},80%,70%,0)`);
      mg.addColorStop(0.5, `hsla(${m.hue},80%,70%,1)`);
      mg.addColorStop(1, `hsla(${m.hue},80%,70%,0)`);
      ctx.fillStyle = mg;
      ctx.fillRect(m.x * W - m.w * W * 0.5, H * m.y, m.w * W, 18);
      ctx.restore();
    }

    /* ── кусты ── */
    for (const b of bushes) {
      const x = b.x * W, y = meadowY + 8;
      const s = Math.sin(t * 0.015 + b.phase) * 1.6;
      ctx.save();
      ctx.globalAlpha = 0.5;
      for (let i = 0; i < 3; i++) {
        const g = ctx.createRadialGradient(x + (i - 1) * b.r * 0.6, y - b.r * 0.5, 2, x + (i - 1) * b.r * 0.6, y - b.r * 0.4, b.r);
        g.addColorStop(0, `hsla(${b.hue + 15},80%,48%,0.95)`);
        g.addColorStop(1, `hsla(${b.hue},75%,24%,0.9)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(x + (i - 1) * b.r * 0.6 + s, y - b.r * 0.4, b.r * 0.62, b.r * 0.5, 0, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
      hit(x, y - b.r * 0.45, b.r * 0.9, "Куст", () => { leafBurst(x, y - b.r * 0.5, 10, b.hue); sparks(x, y - b.r * 0.5, 6, b.hue + 30, 0.6); });
    }

    /* ── деревья ── */
    for (const tr of trees) drawTree(tr, t);

    /* ── белка на дереве ── */
    {
      const sq = squirrel;
      const tr = trees[sq.tree % trees.length];
      sq.dash *= 0.94;
      sq.climb += sq.dir * (sq.speed + sq.dash * 0.05);
      if (sq.climb > 0.75) { sq.climb = 0.75; sq.dir = -1; }
      if (sq.climb < 0.05) {
        sq.climb = 0.05; sq.dir = 1;
        if (Math.random() < 0.25) sq.tree = Math.floor(rand(0, trees.length));
      }
      const sx = tr.x * W + Math.sin(t * 0.011 + tr.phase) * (1.6 + tr.h * 0.016) * sq.climb;
      const sy = meadow() + 8 - tr.h * sq.climb;
      const s = 9;
      ctx.save();
      ctx.translate(sx, sy); ctx.scale(sq.dir === 1 ? 1 : -1, 1);
      ctx.globalAlpha = 0.85;
      const bodyG = ctx.createLinearGradient(-s, -s, s, s);
      bodyG.addColorStop(0, "rgba(255,150,70,0.95)");
      bodyG.addColorStop(1, "rgba(190,90,40,0.95)");
      ctx.fillStyle = bodyG;
      // хвост
      ctx.beginPath();
      ctx.moveTo(-s * 0.3, s * 0.2);
      ctx.quadraticCurveTo(-s * 1.6, s * 0.1 + Math.sin(t * 0.12) * 2, -s * 1.1, -s * 1.1);
      ctx.quadraticCurveTo(-s * 0.7, -s * 0.3, -s * 0.2, -s * 0.2);
      ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.ellipse(0, 0, s * 0.5, s * 0.36, -0.3, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(s * 0.42, -s * 0.3, s * 0.27, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(s * 0.35, -s * 0.58, s * 0.1, s * 0.15, -0.2, 0, TAU); ctx.fill();
      ctx.fillStyle = "rgba(20,15,10,0.9)";
      ctx.beginPath(); ctx.arc(s * 0.52, -s * 0.33, s * 0.07, 0, TAU); ctx.fill();
      ctx.restore();
      hit(sx, sy, 20, "Белка", () => {
        sq.dash = 1; sq.dir = (sq.dir === 1 ? -1 : 1) as 1 | -1;
        sparks(sx, sy, 10, 30, 0.9);
        addPart({ x: sx, y: sy, kind: "spark", vx: rand(-1, 1), vy: 1.5, hue: 32, size: 3, decay: 0.012, grav: 0.12 });
      });
    }

    /* ── сова на дереве ── */
    {
      const o = owl;
      let ox: number, oy: number;
      const treeOf = (i: number) => {
        const tr = trees[i % trees.length];
        return { x: tr.x * W + Math.sin(t * 0.011 + tr.phase) * 2, y: meadow() + 8 - tr.h * 0.62 };
      };
      if (o.fly > 0) {
        o.fly -= 0.018;
        const a = treeOf(o.from), b = treeOf(o.to);
        const k = 1 - o.fly;
        ox = a.x + (b.x - a.x) * k;
        oy = a.y + (b.y - a.y) * k - Math.sin(k * Math.PI) * 60;
        if (o.fly <= 0) o.tree = o.to;
      } else {
        const p = treeOf(o.tree); ox = p.x; oy = p.y;
      }
      o.blink = o.blink > 0 ? o.blink - 0.05 : (Math.random() < 0.006 ? 1 : 0);
      o.hoot *= 0.95;
      o.turn *= 0.96;
      const s = 13;
      const flying = o.fly > 0;
      const wing = flying ? Math.sin(t * 0.45) * 12 : 0;
      ctx.save();
      ctx.translate(ox, oy);
      ctx.rotate(o.turn * 0.4);
      ctx.globalAlpha = 0.9;
      if (flying) {
        ctx.strokeStyle = "rgba(220,195,150,0.9)"; ctx.lineWidth = 2.4; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(-s * 1.4, wing * 0.5);
        ctx.quadraticCurveTo(-s * 0.6, -wing, 0, 0);
        ctx.quadraticCurveTo(s * 0.6, -wing, s * 1.4, wing * 0.5); ctx.stroke();
      }
      const bg = ctx.createLinearGradient(0, -s, 0, s);
      bg.addColorStop(0, "rgba(210,180,135,0.95)");
      bg.addColorStop(1, "rgba(140,110,80,0.95)");
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.ellipse(0, 0, s * 0.62, s * 0.82, 0, 0, TAU); ctx.fill();
      // ушки
      ctx.beginPath(); ctx.moveTo(-s * 0.5, -s * 0.6); ctx.lineTo(-s * 0.26, -s * 1.05); ctx.lineTo(-s * 0.08, -s * 0.62); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(s * 0.5, -s * 0.6); ctx.lineTo(s * 0.26, -s * 1.05); ctx.lineTo(s * 0.08, -s * 0.62); ctx.closePath(); ctx.fill();
      // глаза
      const eh = o.blink > 0.5 ? 0.04 : 0.2;
      for (const ex of [-0.26, 0.26]) {
        ctx.fillStyle = "rgba(255,225,120,0.95)";
        ctx.beginPath(); ctx.ellipse(s * ex, -s * 0.25, s * 0.22, s * eh * (1 + o.hoot * 0.4), 0, 0, TAU); ctx.fill();
        if (o.blink <= 0.5) {
          ctx.fillStyle = "rgba(25,20,15,0.95)";
          ctx.beginPath(); ctx.arc(s * ex, -s * 0.25, s * 0.09, 0, TAU); ctx.fill();
        }
      }
      ctx.fillStyle = "rgba(255,170,70,0.95)";
      ctx.beginPath(); ctx.moveTo(0, -s * 0.12); ctx.lineTo(-s * 0.1, -s * 0.02); ctx.lineTo(s * 0.1, -s * 0.02); ctx.closePath(); ctx.fill();
      ctx.restore();
      hit(ox, oy, 24, "Сова", () => {
        o.hoot = 1; o.turn = rand(-1, 1); o.blink = 1;
        ring(ox, oy, 45, 70, 0.03); ring(ox, oy, 45, 110, 0.02);
        notes(ox, oy - 16, 48, 3);
        if (o.fly <= 0 && Math.random() < 0.7) {
          o.from = o.tree; o.to = Math.floor(rand(0, trees.length)); o.fly = 1;
        }
      });
    }

    /* ── грибы ── */
    for (const m of mushrooms) {
      m.pop *= 0.93;
      const x = m.x * W, y = meadowY + 10;
      const s = 7 * m.scale * (1 + m.pop * 0.25);
      ctx.save();
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = "rgba(240,235,225,0.9)";
      ctx.beginPath(); ctx.ellipse(x, y - s * 0.4, s * 0.26, s * 0.5, 0, 0, TAU); ctx.fill();
      const cg = ctx.createLinearGradient(x - s, y - s, x + s, y);
      cg.addColorStop(0, `hsla(${m.hue},90%,62%,0.95)`);
      cg.addColorStop(1, `hsla(${m.hue},85%,38%,0.95)`);
      ctx.fillStyle = cg;
      ctx.beginPath(); ctx.ellipse(x, y - s * 0.85, s * 0.78, s * 0.52, 0, Math.PI, TAU); ctx.fill();
      ctx.fillStyle = "rgba(255,250,245,0.85)";
      ctx.beginPath(); ctx.arc(x - s * 0.25, y - s * 1.0, s * 0.11, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(x + s * 0.3, y - s * 0.92, s * 0.09, 0, TAU); ctx.fill();
      ctx.restore();
      hit(x, y - s * 0.7, 16, "Гриб", () => { m.pop = 1; puff(x, y - s * 1.1, m.hue, 10); sparks(x, y - s, 6, m.hue + 20, 0.5); });
    }

    /* ── камни ── */
    for (const r of rocks) {
      r.shake *= 0.9;
      const x = r.x * W + Math.sin(t * 0.4) * r.shake * 3;
      const y = (r.inWater ? H * r.y : meadowY + 10);
      ctx.save();
      ctx.globalAlpha = r.inWater ? 0.55 : 0.6;
      const g = ctx.createLinearGradient(x - r.w, y - r.h, x + r.w, y);
      g.addColorStop(0, `hsla(${r.hue},35%,62%,0.95)`);
      g.addColorStop(1, `hsla(${r.hue},40%,28%,0.95)`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(x - r.w, y);
      ctx.quadraticCurveTo(x - r.w * 0.75, y - r.h, x - r.w * 0.1, y - r.h);
      ctx.quadraticCurveTo(x + r.w * 0.7, y - r.h * 0.9, x + r.w, y);
      ctx.closePath(); ctx.fill();
      ctx.restore();
      hit(x, y - r.h * 0.5, r.w, "Камень", () => {
        r.shake = 1;
        puff(x, y - r.h * 0.4, 40, 6);
        if (r.inWater) { ripples.push({ x, y, r: 3, max: 34, op: 0.7 }); }
      });
    }

    /* ── птицы ── */
    for (const b of birds) {
      b.x += b.vx; b.phase += 0.05;
      b.y += Math.sin(b.phase * 0.2) * 0.2;
      if (b.x > W + 120) { b.x = -100; b.y = rand(40, 240); }
      const flap = Math.sin(b.phase) * 5;
      ctx.save(); ctx.translate(b.x, b.y); ctx.globalAlpha = b.op;
      ctx.strokeStyle = `hsla(${b.hue},70%,80%,0.95)`;
      ctx.lineWidth = 1.7; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(-b.size, 0);
      ctx.quadraticCurveTo(-b.size * 0.4, -flap, 0, 0);
      ctx.quadraticCurveTo(b.size * 0.4, -flap, b.size, 0);
      ctx.stroke(); ctx.restore();
      hit(b.x, b.y, 16, "Птица", () => { b.vx = Math.min(b.vx + 1.2, 3); sparks(b.x, b.y, 7, b.hue, 0.7); });
    }

    /* ── орёл ── */
    {
      eagle.boost *= 0.97;
      eagle.ang += eagle.speed * (1 + eagle.boost * 4);
      eagle.cx += eagle.drift;
      if (eagle.cx > W + 200) eagle.cx = -200;
      const ex = eagle.cx + Math.cos(eagle.ang) * eagle.r;
      const ey = eagle.cy + Math.sin(eagle.ang) * eagle.r * 0.35;
      const bank = Math.sin(eagle.ang);
      const ws = 17 * eagle.size;
      ctx.save();
      ctx.translate(ex, ey);
      ctx.scale(Math.cos(eagle.ang) >= 0 ? 1 : -1, 1);
      ctx.globalAlpha = 0.6 + eagle.boost * 0.3;
      ctx.strokeStyle = "rgba(255,195,110,0.95)";
      ctx.lineWidth = 2; ctx.lineCap = "round";
      const wob = Math.sin(t * 0.05 * (1 + eagle.boost * 4)) * 1.5;
      ctx.beginPath(); ctx.moveTo(-ws, wob * bank);
      ctx.quadraticCurveTo(-ws * 0.45, -8 - wob, 0, 0);
      ctx.quadraticCurveTo(ws * 0.45, -8 - wob, ws, wob * bank); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, 0, 4.5, 2.4, 0, 0, TAU);
      ctx.fillStyle = "rgba(255,215,150,0.9)"; ctx.fill();
      ctx.restore();
      hit(ex, ey, 26, "Орёл", () => { eagle.boost = 1; sparks(ex, ey, 12, 40, 1); ring(ex, ey, 40, 60, 0.03); });
    }

    /* ── олени ── */
    for (const d of deer) {
      d.boost *= 0.975; d.alert *= 0.985;
      d.x += d.vx * d.dir * (1 + d.boost * 4);
      d.legPhase += 0.03 * (1 + d.boost * 3);
      if (d.dir === 1 && d.x > W + 50) d.x = -50;
      if (d.dir === -1 && d.x < -50) d.x = W + 50;
      const s = d.size * 27;
      const gy = meadowY + Math.sin(t * 0.01 + d.x * 0.01) * 1.5;
      const leg = Math.sin(d.legPhase) * 3.5 * d.size;
      ctx.save();
      ctx.translate(d.x, gy); ctx.scale(d.dir, 1);
      ctx.globalAlpha = Math.min(1, d.op + d.alert * 0.4);
      const col = "rgba(255,190,120,0.95)";
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 1.6 * d.size; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(s*0.3,-s*0.14); ctx.lineTo(s*0.3+leg,0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(s*0.34,-s*0.16); ctx.lineTo(s*0.34-leg,0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-s*0.26,-s*0.14); ctx.lineTo(-s*0.26-leg,0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-s*0.22,-s*0.16); ctx.lineTo(-s*0.22+leg,0); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0,-s*0.3,s*0.4,s*0.16,0,0,TAU); ctx.fill();
      const lift = d.alert * s * 0.1;
      ctx.beginPath(); ctx.moveTo(s*0.35,-s*0.36); ctx.quadraticCurveTo(s*0.45,-s*0.65-lift,s*0.5,-s*0.74-lift); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(s*0.52,-s*0.78-lift,s*0.09,s*0.06,0.3,0,TAU); ctx.fill();
      ctx.strokeStyle = `rgba(150,255,220,${0.95})`;
      ctx.lineWidth = (1.2 + d.alert * 1.4) * d.size;
      ctx.beginPath(); ctx.moveTo(s*0.54,-s*0.86-lift); ctx.quadraticCurveTo(s*0.66,-s*1.1-lift,s*0.64,-s*1.22-lift); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(s*0.6,-s*1.06-lift); ctx.lineTo(s*0.7,-s*1.1-lift); ctx.stroke();
      ctx.restore();
      hit(d.x, gy - s * 0.55, s * 0.85, "Олень", () => {
        d.alert = 1; d.boost = 1;
        sparks(d.x + s * 0.55 * d.dir, gy - s * 1.1, 14, 160, 1);
        ring(d.x, gy - s * 0.5, 160, 80, 0.028);
      });
    }

    /* ── заяц ── */
    {
      const b = bunny;
      b.big *= 0.96;
      if (b.pause > 0) {
        b.pause--;
        if (b.pause === 0) b.dir = (Math.random() > 0.5 ? 1 : -1) as 1 | -1;
      } else {
        b.hop += 0.09 * (1 + b.big);
        b.x += b.dir * 1.7 * (1 + b.big * 1.5);
        if (b.hop > Math.PI) { b.hop = 0; if (Math.random() < 0.3) b.pause = Math.floor(rand(80, 220)); }
        if (b.x > W - 60) b.dir = -1;
        if (b.x < 60) b.dir = 1;
      }
      const jumpY = Math.abs(Math.sin(b.hop)) * (11 + b.big * 28);
      const s = 15 * b.size;
      const gy = meadowY + 4 - jumpY;
      const sit = b.pause > 0 ? 1 : 0;
      const earW = Math.sin(t * 0.06) * (sit ? 1.6 : 0.5);
      ctx.save();
      ctx.translate(b.x, gy); ctx.scale(b.dir, 1); ctx.globalAlpha = 0.5 + b.big * 0.4;
      const col = "rgba(225,235,255,0.95)";
      ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.lineCap = "round";
      ctx.beginPath(); ctx.ellipse(0, -s * 0.45, s * 0.55, s * (0.38 + sit * 0.12), -0.25, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.arc(s * 0.5, -s * 0.8, s * 0.26, 0, TAU); ctx.fill();
      ctx.fillStyle = "rgba(255,180,200,0.9)";
      ctx.beginPath(); ctx.ellipse(s * 0.5 + earW, -s * 1.3, s * 0.07, s * 0.34, -0.15, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(s * 0.62 + earW, -s * 1.28, s * 0.06, s * 0.3, 0.15, 0, TAU); ctx.fill();
      ctx.fillStyle = col; ctx.strokeStyle = col;
      ctx.beginPath(); ctx.moveTo(-s * 0.2, -s * 0.2); ctx.quadraticCurveTo(-s * 0.7, -s * 0.15, -s * 0.75, 0); ctx.stroke();
      ctx.beginPath(); ctx.arc(-s * 0.62, -s * 0.42, s * 0.14, 0, TAU); ctx.fill();
      ctx.restore();
      hit(b.x, gy - s * 0.6, s * 1.1, "Заяц", () => {
        b.big = 1; b.pause = 0; b.hop = 0.05;
        sparks(b.x, gy, 12, 320, 0.9);
      });
    }

    /* ── лиса ── */
    {
      const f = fox;
      f.dash *= 0.97;
      f.phase += 0.055 * (1 + f.dash * 3);
      f.x += f.dir * 1.15 * (1 + f.dash * 3.5);
      if (f.dir === 1 && f.x > W + 90) f.dir = -1;
      if (f.dir === -1 && f.x < -90) f.dir = 1;
      const s = 23 * f.size;
      const gy = meadowY + 10;
      const leg = Math.sin(f.phase) * 4.2 * f.size;
      const leg2 = Math.sin(f.phase + Math.PI) * 4.2 * f.size;
      const tailW = Math.sin(t * 0.045 * (1 + f.dash * 5)) * (3 + f.dash * 4);
      ctx.save();
      ctx.translate(f.x, gy); ctx.scale(f.dir, 1); ctx.globalAlpha = 0.6 + f.dash * 0.35;
      const col = "rgba(255,135,45,0.95)";
      ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 1.9 * f.size; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(s*0.32,-s*0.16); ctx.lineTo(s*0.32+leg,0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(s*0.38,-s*0.18); ctx.lineTo(s*0.38+leg2,0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-s*0.28,-s*0.16); ctx.lineTo(-s*0.28+leg2,0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-s*0.34,-s*0.18); ctx.lineTo(-s*0.34+leg,0); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0,-s*0.32,s*0.48,s*0.17,0,0,TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(s*0.42,-s*0.34); ctx.lineTo(s*0.68,-s*0.52); ctx.lineTo(s*0.6,-s*0.42); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(s*0.52,-s*0.52); ctx.lineTo(s*0.56,-s*0.68); ctx.lineTo(s*0.62,-s*0.54); ctx.closePath(); ctx.fill();
      ctx.beginPath();
      ctx.moveTo(-s*0.44,-s*0.34);
      ctx.quadraticCurveTo(-s*0.85,-s*0.5+tailW,-s*1.05,-s*0.32+tailW*2);
      ctx.quadraticCurveTo(-s*0.8,-s*0.22+tailW,-s*0.44,-s*0.18);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = "rgba(255,250,245,0.95)";
      ctx.beginPath(); ctx.ellipse(-s*1.0,-s*0.31+tailW*2,s*0.12,s*0.09,0,0,TAU); ctx.fill();
      ctx.restore();
      hit(f.x, gy - s * 0.35, s * 0.9, "Лиса", () => {
        f.dash = 1; sparks(f.x, gy - s * 0.3, 14, 25, 1); ring(f.x, gy - s * 0.3, 25, 70, 0.03);
      });
    }

    /* ── ёжик ── */
    {
      const h2 = hog;
      if (h2.curl > 0) h2.curl -= 0.008;
      else { h2.phase += 0.07; h2.x += h2.dir * 0.55; }
      if (h2.x > W - 50) h2.dir = -1;
      if (h2.x < 50) h2.dir = 1;
      const s = 13;
      const gy = meadowY + 12;
      const curled = Math.max(0, h2.curl);
      ctx.save();
      ctx.translate(h2.x, gy); ctx.scale(h2.dir, 1); ctx.globalAlpha = 0.62;
      // тело
      const bg = ctx.createLinearGradient(0, -s, 0, 0);
      bg.addColorStop(0, "rgba(170,150,190,0.95)");
      bg.addColorStop(1, "rgba(95,80,120,0.95)");
      ctx.fillStyle = bg;
      ctx.beginPath(); ctx.ellipse(0, -s * 0.42, s * (0.72 + curled * 0.12), s * (0.46 + curled * 0.16), 0, 0, TAU); ctx.fill();
      // иглы
      ctx.strokeStyle = "rgba(215,205,245,0.9)"; ctx.lineWidth = 1.2; ctx.lineCap = "round";
      for (let i = 0; i < 14; i++) {
        const a = Math.PI + (i / 13) * Math.PI;
        const len = s * (0.3 + curled * 0.22) * (1 + Math.sin(t * 0.08 + i) * 0.06);
        const px = Math.cos(a) * s * 0.7, py = -s * 0.42 + Math.sin(a) * s * 0.45;
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(a) * len, py + Math.sin(a) * len); ctx.stroke();
      }
      if (curled < 0.35) {
        ctx.fillStyle = "rgba(230,215,200,0.95)";
        ctx.beginPath(); ctx.ellipse(s * 0.66, -s * 0.3, s * 0.24, s * 0.17, -0.2, 0, TAU); ctx.fill();
        ctx.fillStyle = "rgba(30,25,35,0.95)";
        ctx.beginPath(); ctx.arc(s * 0.86, -s * 0.33, s * 0.07, 0, TAU); ctx.fill();
        ctx.beginPath(); ctx.arc(s * 0.6, -s * 0.42, s * 0.05, 0, TAU); ctx.fill();
      }
      ctx.restore();
      hit(h2.x, gy - s * 0.5, s * 1.1, "Ёжик", () => {
        h2.curl = 1; puff(h2.x, gy - s * 0.5, 275, 8); sparks(h2.x, gy - s * 0.6, 8, 280, 0.6);
      });
    }

    /* ── волк ── */
    {
      const wv = wolf;
      wv.howl *= 0.985;
      if (wv.pause > 0) wv.pause--;
      else {
        wv.phase += 0.045; wv.x += wv.dir * 0.42;
        if (Math.random() < 0.004) { wv.pause = Math.floor(rand(120, 320)); }
      }
      if (wv.x > W * 0.45) wv.dir = -1;
      if (wv.x < 40) wv.dir = 1;
      const s = 26;
      const gy = meadowY + 11;
      const leg = wv.pause > 0 ? 0 : Math.sin(wv.phase) * 4;
      const leg2 = wv.pause > 0 ? 0 : Math.sin(wv.phase + Math.PI) * 4;
      const headUp = wv.howl;
      ctx.save();
      ctx.translate(wv.x, gy); ctx.scale(wv.dir, 1);
      ctx.globalAlpha = 0.55 + wv.howl * 0.35;
      const col = "rgba(150,165,205,0.95)";
      ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 2.2; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(s*0.3,-s*0.2); ctx.lineTo(s*0.3+leg,0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(s*0.36,-s*0.22); ctx.lineTo(s*0.36+leg2,0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-s*0.3,-s*0.2); ctx.lineTo(-s*0.3+leg2,0); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-s*0.36,-s*0.22); ctx.lineTo(-s*0.36+leg,0); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0,-s*0.4,s*0.5,s*0.2,0,0,TAU); ctx.fill();
      // хвост
      ctx.beginPath();
      ctx.moveTo(-s*0.46,-s*0.44);
      ctx.quadraticCurveTo(-s*0.82,-s*0.5-Math.sin(t*0.05)*3,-s*0.9,-s*0.72);
      ctx.quadraticCurveTo(-s*0.7,-s*0.42,-s*0.44,-s*0.3);
      ctx.closePath(); ctx.fill();
      // шея + голова (задирается при вое)
      const hx = s * 0.52, hy = -s * (0.62 + headUp * 0.3);
      ctx.lineWidth = 6;
      ctx.beginPath(); ctx.moveTo(s*0.36,-s*0.45); ctx.lineTo(hx, hy); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(hx, hy, s*0.19, s*0.13, -0.5 - headUp * 0.5, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.moveTo(hx - s*0.12, hy - s*0.1); ctx.lineTo(hx - s*0.06, hy - s*0.28); ctx.lineTo(hx + s*0.04, hy - s*0.1); ctx.closePath(); ctx.fill();
      // светящийся глаз
      ctx.fillStyle = `rgba(140,255,230,${0.8 + wv.howl * 0.2})`;
      ctx.beginPath(); ctx.arc(hx + s*0.08, hy - s*0.02, 1.9 + wv.howl, 0, TAU); ctx.fill();
      ctx.restore();
      hit(wv.x + s * 0.3, gy - s * 0.6, s * 1.0, "Волк", () => {
        wv.howl = 1; wv.pause = 180;
        for (let i = 0; i < 3; i++) ring(wv.x + s * 0.55 * wv.dir, gy - s * 0.95, 200 + i * 20, 90 + i * 55, 0.016);
        notes(wv.x + s * 0.5 * wv.dir, gy - s * 1.1, 200, 4);
        auroraPulse = Math.max(auroraPulse, 0.5);
      });
    }

    /* ── ручей ── */
    {
      const wg = ctx.createLinearGradient(0, waterY, 0, H);
      wg.addColorStop(0, "rgba(70,215,230,0.22)");
      wg.addColorStop(0.5, "rgba(45,160,230,0.3)");
      wg.addColorStop(1, "rgba(60,110,220,0.4)");
      ctx.fillStyle = wg;
      ctx.beginPath();
      ctx.moveTo(0, waterY);
      for (let x = 0; x <= W; x += 24)
        ctx.lineTo(x, waterY + Math.sin(x * 0.012 + t * 0.02) * 2.6 + Math.sin(x * 0.03 - t * 0.013) * 1.8);
      ctx.lineTo(W, H); ctx.lineTo(0, H);
      ctx.closePath(); ctx.fill();

      ctx.save();
      ctx.globalAlpha = 0.65;
      ctx.strokeStyle = "rgba(170,255,250,0.9)";
      ctx.lineWidth = 1.6; ctx.lineCap = "round";
      ctx.beginPath();
      for (let x = 0; x <= W; x += 16) {
        const y = waterY + Math.sin(x * 0.012 + t * 0.02) * 2.6 + Math.sin(x * 0.03 - t * 0.013) * 1.8;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.restore();

      for (const fl of flows) {
        fl.x += fl.vx;
        if (fl.x - fl.len > W) { fl.x = -fl.len; fl.lane = rand(0.925, 0.99); }
        const fy = H * fl.lane + Math.sin(fl.x * 0.02 + t * 0.03) * 2;
        ctx.save();
        ctx.globalAlpha = fl.op * (0.6 + Math.sin(t * 0.04 + fl.lane * 40) * 0.4);
        ctx.strokeStyle = `hsla(${fl.hue},95%,75%,0.95)`;
        ctx.lineWidth = 1.5; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(fl.x, fy); ctx.lineTo(fl.x + fl.len, fy); ctx.stroke();
        ctx.restore();
      }

      for (const sh of shadows) {
        sh.x += sh.vx;
        if (sh.vx > 0 && sh.x > W + 40) sh.x = -40;
        if (sh.vx < 0 && sh.x < -40) sh.x = W + 40;
        ctx.save();
        ctx.globalAlpha = sh.op;
        ctx.fillStyle = "rgba(10,40,60,0.95)";
        ctx.beginPath(); ctx.ellipse(sh.x, H * sh.lane, sh.len, 3.6, 0, 0, TAU); ctx.fill();
        ctx.restore();
      }

      // кувшинки
      pads.forEach((p, i) => {
        const px = p.x * W, py = H * 0.945 + Math.sin(t * 0.02 + p.phase) * 1.6;
        ctx.save();
        ctx.globalAlpha = 0.6;
        const g = ctx.createRadialGradient(px, py, 1, px, py, p.r);
        g.addColorStop(0, "hsla(130,80%,52%,0.95)");
        g.addColorStop(1, "hsla(150,70%,28%,0.95)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(px, py, p.r, p.r * 0.5, 0, 0.35, TAU - 0.35);
        ctx.closePath(); ctx.fill();
        ctx.restore();
        hit(px, py, p.r, "Кувшинка", () => {
          ripples.push({ x: px, y: py + 4, r: 2, max: 30, op: 0.7 });
          sparks(px, py, 6, 130, 0.5);
          if (frog.jump <= 0 && frog.pad !== i) { frog.from = frog.pad; frog.to = i; frog.jump = 1; }
        });
      });

      // лягушка
      {
        const fr = frog;
        fr.croak *= 0.94;
        const padPos = (i: number) => {
          const p = pads[i % pads.length];
          return { x: p.x * W, y: H * 0.945 + Math.sin(t * 0.02 + p.phase) * 1.6 };
        };
        let fx: number, fy: number;
        if (fr.jump > 0) {
          fr.jump -= 0.03;
          const a = padPos(fr.from), b = padPos(fr.to), k = 1 - fr.jump;
          fx = a.x + (b.x - a.x) * k;
          fy = a.y + (b.y - a.y) * k - Math.sin(k * Math.PI) * 46;
          if (fr.jump <= 0) {
            fr.pad = fr.to;
            const land = padPos(fr.pad);
            ripples.push({ x: land.x, y: land.y + 4, r: 2, max: 28, op: 0.75 });
            for (let i = 0; i < 6; i++) splashes.push({ x: land.x, y: land.y + 4, vx: rand(-1.2, 1.2), vy: rand(-2.2, -0.8), life: 1 });
          }
        } else { const p = padPos(fr.pad); fx = p.x; fy = p.y - 4; }
        const s = 8 * (1 + fr.croak * 0.18);
        ctx.save();
        ctx.translate(fx, fy); ctx.globalAlpha = 0.85;
        const g = ctx.createLinearGradient(0, -s, 0, s);
        g.addColorStop(0, "hsla(100,85%,58%,0.95)");
        g.addColorStop(1, "hsla(130,75%,30%,0.95)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.ellipse(0, 0, s * 0.85, s * 0.58, 0, 0, TAU); ctx.fill();
        // лапки
        ctx.strokeStyle = "hsla(110,80%,45%,0.95)"; ctx.lineWidth = 1.6; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(-s * 0.5, s * 0.3); ctx.lineTo(-s * 0.95, s * 0.55); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(s * 0.5, s * 0.3); ctx.lineTo(s * 0.95, s * 0.55); ctx.stroke();
        // глаза
        for (const ex of [-0.4, 0.4]) {
          ctx.fillStyle = "rgba(240,255,220,0.95)";
          ctx.beginPath(); ctx.arc(s * ex, -s * 0.52, s * 0.26, 0, TAU); ctx.fill();
          ctx.fillStyle = "rgba(20,30,15,0.95)";
          ctx.beginPath(); ctx.arc(s * ex, -s * 0.52, s * 0.12, 0, TAU); ctx.fill();
        }
        // горловой мешок при кваканье
        if (fr.croak > 0.05) {
          ctx.globalAlpha = 0.5 * fr.croak;
          ctx.fillStyle = "hsla(90,90%,60%,0.9)";
          ctx.beginPath(); ctx.arc(0, s * 0.5, s * 0.5 * fr.croak, 0, TAU); ctx.fill();
        }
        ctx.restore();
        hit(fx, fy, 16, "Лягушка", () => {
          fr.croak = 1;
          notes(fx, fy - 12, 110, 3);
          ring(fx, fy, 110, 50, 0.035);
          if (fr.jump <= 0) {
            fr.from = fr.pad;
            fr.to = Math.floor(rand(0, pads.length));
            if (fr.to !== fr.pad) fr.jump = 1;
          }
        });
      }

      // утка
      {
        const dk = duck;
        dk.flap *= 0.93;
        dk.bob += 0.04;
        dk.x += dk.vx * dk.dir * (1 + dk.flap * 3);
        if (dk.x > W - 60) dk.dir = -1;
        if (dk.x < 60) dk.dir = 1;
        const dy = H * 0.935 + Math.sin(dk.bob) * 2.2;
        const s = 13;
        ctx.save();
        ctx.translate(dk.x, dy); ctx.scale(dk.dir, 1); ctx.globalAlpha = 0.85;
        const g = ctx.createLinearGradient(0, -s, 0, s * 0.4);
        g.addColorStop(0, "rgba(245,245,250,0.95)");
        g.addColorStop(1, "rgba(170,180,200,0.95)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.ellipse(0, 0, s * 0.8, s * 0.42, 0, 0, TAU); ctx.fill();
        // крыло
        ctx.save();
        ctx.rotate(-dk.flap * 0.8);
        ctx.fillStyle = "rgba(215,225,240,0.95)";
        ctx.beginPath(); ctx.ellipse(-s * 0.1, -s * 0.12, s * 0.4, s * 0.22, -0.2, 0, TAU); ctx.fill();
        ctx.restore();
        // шея и голова
        ctx.strokeStyle = "rgba(235,240,250,0.95)"; ctx.lineWidth = 4.4; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(s * 0.5, -s * 0.15); ctx.lineTo(s * 0.72, -s * 0.72); ctx.stroke();
        ctx.fillStyle = "rgba(90,210,170,0.95)";
        ctx.beginPath(); ctx.arc(s * 0.76, -s * 0.82, s * 0.24, 0, TAU); ctx.fill();
        ctx.fillStyle = "rgba(255,180,60,0.95)";
        ctx.beginPath(); ctx.moveTo(s * 0.95, -s * 0.85); ctx.lineTo(s * 1.3, -s * 0.76); ctx.lineTo(s * 0.95, -s * 0.68); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "rgba(20,25,30,0.95)";
        ctx.beginPath(); ctx.arc(s * 0.84, -s * 0.88, s * 0.06, 0, TAU); ctx.fill();
        ctx.restore();
        if (tick % 26 === 0) ripples.push({ x: dk.x, y: dy + 7, r: 2, max: 20, op: 0.35 });
        hit(dk.x, dy - s * 0.3, s * 1.1, "Утка", () => {
          dk.flap = 1;
          notes(dk.x, dy - 20, 45, 2);
          ripples.push({ x: dk.x, y: dy + 7, r: 2, max: 40, op: 0.8 });
          for (let i = 0; i < 8; i++) splashes.push({ x: dk.x, y: dy + 6, vx: rand(-1.6, 1.6), vy: rand(-2.6, -0.9), life: 1 });
        });
      }

      // круги на воде
      if (tick > nextRipple) {
        nextRipple = tick + rand(70, 180);
        ripples.push({ x: rand(W * 0.05, W * 0.95), y: rand(waterY + 6, H - 8), r: 2, max: rand(20, 38), op: 0.6 });
      }
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.r += 0.5; rp.op -= 0.009;
        if (rp.op <= 0 || rp.r > rp.max) { ripples.splice(i, 1); continue; }
        ctx.save();
        ctx.globalAlpha = rp.op;
        ctx.strokeStyle = "rgba(180,255,250,0.95)";
        ctx.lineWidth = 1.3;
        ctx.beginPath(); ctx.ellipse(rp.x, rp.y, rp.r, rp.r * 0.38, 0, 0, TAU); ctx.stroke();
        ctx.restore();
      }

      // рыба
      fish.swimX += 0.7;
      if (fish.swimX > W + 30) fish.swimX = -30;
      if (fish.state === "idle" && tick > fish.next) {
        fish.state = "jump"; fish.t = 0;
        fish.x0 = rand(W * 0.1, W * 0.8);
        fish.x1 = fish.x0 + rand(50, 115);
        fish.h = rand(38, 66);
        ripples.push({ x: fish.x0, y: H * 0.96, r: 3, max: 32, op: 0.7 });
        for (let i = 0; i < 9; i++) splashes.push({ x: fish.x0, y: H * 0.95, vx: rand(-1.6, 1.6), vy: rand(-2.8, -0.9), life: 1 });
      }
      if (fish.state === "jump") {
        fish.t += 0.024;
        if (fish.t >= 1) {
          fish.state = "idle"; fish.next = tick + rand(240, 560);
          ripples.push({ x: fish.x1, y: H * 0.96, r: 3, max: 36, op: 0.7 });
          for (let i = 0; i < 9; i++) splashes.push({ x: fish.x1, y: H * 0.95, vx: rand(-1.6, 1.6), vy: rand(-2.6, -0.9), life: 1 });
        } else {
          const ft = fish.t;
          const fx = fish.x0 + (fish.x1 - fish.x0) * ft;
          const fy = H * 0.955 - Math.sin(ft * Math.PI) * fish.h;
          const ang = Math.cos(ft * Math.PI) * 0.9;
          ctx.save();
          ctx.translate(fx, fy); ctx.rotate(-ang); ctx.globalAlpha = 0.9;
          const fg = ctx.createLinearGradient(-12, 0, 10, 0);
          fg.addColorStop(0, "rgba(130,230,255,0.95)");
          fg.addColorStop(0.5, "rgba(190,250,255,1)");
          fg.addColorStop(1, "rgba(255,170,215,0.95)");
          ctx.fillStyle = fg;
          ctx.beginPath(); ctx.ellipse(0, 0, 9, 3.2, 0, 0, TAU); ctx.fill();
          ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(-13.5, -3.8); ctx.lineTo(-13.5, 3.8); ctx.closePath(); ctx.fill();
          ctx.restore();
          hit(fx, fy, 22, "Рыба", () => { sparks(fx, fy, 12, 190, 1); fish.h = Math.min(fish.h + 25, 110); });
        }
      } else {
        // плавающая рыба под водой — кликабельна
        hit(fish.swimX, H * 0.965, 20, "Рыба", () => {
          fish.state = "jump"; fish.t = 0;
          fish.x0 = fish.swimX; fish.x1 = fish.swimX + rand(60, 120); fish.h = rand(50, 80);
          ripples.push({ x: fish.x0, y: H * 0.96, r: 3, max: 34, op: 0.8 });
          for (let i = 0; i < 10; i++) splashes.push({ x: fish.x0, y: H * 0.95, vx: rand(-1.8, 1.8), vy: rand(-3, -1), life: 1 });
        });
      }

      // брызги
      for (let i = splashes.length - 1; i >= 0; i--) {
        const sp = splashes[i];
        sp.x += sp.vx; sp.y += sp.vy; sp.vy += 0.09; sp.life -= 0.03;
        if (sp.life <= 0 || sp.y > H) { splashes.splice(i, 1); continue; }
        ctx.save();
        ctx.globalAlpha = sp.life * 0.85;
        ctx.fillStyle = "rgba(195,255,255,1)";
        ctx.beginPath(); ctx.arc(sp.x, sp.y, 1.5, 0, TAU); ctx.fill();
        ctx.restore();
      }

      // камыш
      ctx.save();
      ctx.lineCap = "round";
      for (const rd of reeds) {
        const x = rd.x * W, y = waterY + 4;
        const sway = Math.sin(t * 0.017 + rd.phase) * 4;
        ctx.globalAlpha = 0.45;
        ctx.strokeStyle = "hsla(80,60%,45%,0.9)"; ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.quadraticCurveTo(x + sway * 0.4, y - rd.h * 0.6, x + sway, y - rd.h);
        ctx.stroke();
        ctx.fillStyle = "hsla(28,70%,42%,0.95)";
        ctx.beginPath(); ctx.ellipse(x + sway, y - rd.h - 3, 1.9, 5.2, sway * 0.02, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }

    /* ── трава ── */
    ctx.save();
    ctx.lineWidth = 1.5; ctx.lineCap = "round";
    for (let i = 0; i < blades.length; i++) {
      const bl = blades[i];
      const near = i < 70;
      const bx = bl.x * W;
      const by = near ? waterY + Math.sin(bx * 0.012 + t * 0.02) * 2.6 + 2 : meadowY + 6;
      const sway = Math.sin(t * 0.02 + bl.phase + bx * 0.008) * (2.2 + bl.h * 0.08) + bl.lean * 3;
      ctx.globalAlpha = bl.op;
      ctx.strokeStyle = `hsla(${bl.hue},85%,${near ? 62 : 52}%,0.95)`;
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.quadraticCurveTo(bx + sway * 0.4, by - bl.h * 0.6, bx + sway, by - bl.h);
      ctx.stroke();
    }
    ctx.restore();

    /* ── цветы ── */
    for (const fw of flowers) {
      fw.pop *= 0.93;
      const fx = fw.x * W;
      const fyBase = meadowY + 6;
      const sway = Math.sin(t * 0.018 + fw.phase + fx * 0.007) * 3.2;
      const topX = fx + sway, topY = fyBase - fw.h;
      const sc = 1 + fw.pop * 0.5;
      ctx.save();
      ctx.globalAlpha = Math.min(1, fw.op + fw.pop * 0.3);
      ctx.strokeStyle = "hsla(120,70%,50%,0.85)";
      ctx.lineWidth = 1.2; ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(fx, fyBase);
      ctx.quadraticCurveTo(fx + sway * 0.4, fyBase - fw.h * 0.6, topX, topY);
      ctx.stroke();
      for (let p = 0; p < 5; p++) {
        const a = (p / 5) * TAU + fw.phase + fw.pop;
        ctx.fillStyle = `hsla(${fw.hue},90%,68%,0.95)`;
        ctx.beginPath();
        ctx.ellipse(topX + Math.cos(a) * fw.r * sc, topY + Math.sin(a) * fw.r * sc, fw.r * 0.85 * sc, fw.r * 0.6 * sc, a, 0, TAU);
        ctx.fill();
      }
      ctx.fillStyle = "hsla(50,95%,70%,1)";
      ctx.beginPath(); ctx.arc(topX, topY, fw.r * 0.55 * sc, 0, TAU); ctx.fill();
      ctx.restore();
      hit(topX, topY, 13, "Цветок", () => {
        fw.pop = 1;
        sparks(topX, topY, 10, fw.hue, 0.6);
        puff(topX, topY, fw.hue, 4);
        bee.tx = topX; bee.ty = topY - 10;
      });
    }

    /* ── пчела ── */
    {
      const b = bee;
      b.buzz *= 0.95;
      b.phase += 0.3;
      const dx = b.tx - b.x, dy = b.ty - b.y, dist = Math.hypot(dx, dy);
      if (dist < 10) {
        const f = flowers[Math.floor(rand(0, flowers.length))];
        b.tx = f.x * W; b.ty = meadowY + 6 - f.h - 8;
      } else {
        b.x += (dx / dist) * (1.3 + b.buzz * 3);
        b.y += (dy / dist) * (1.3 + b.buzz * 3) + Math.sin(b.phase * 0.5) * 0.5;
      }
      const s = 4.4;
      ctx.save();
      ctx.translate(b.x, b.y); ctx.globalAlpha = 0.9;
      ctx.fillStyle = "rgba(255,220,60,0.95)";
      ctx.beginPath(); ctx.ellipse(0, 0, s, s * 0.66, 0, 0, TAU); ctx.fill();
      ctx.fillStyle = "rgba(35,28,20,0.9)";
      ctx.fillRect(-s * 0.3, -s * 0.66, s * 0.26, s * 1.32);
      ctx.fillRect(s * 0.25, -s * 0.56, s * 0.24, s * 1.12);
      ctx.globalAlpha = 0.35 + Math.abs(Math.sin(b.phase)) * 0.25;
      ctx.fillStyle = "rgba(230,250,255,0.9)";
      ctx.beginPath(); ctx.ellipse(-s * 0.1, -s * 0.8, s * 0.7, s * 0.34, -0.3, 0, TAU); ctx.fill();
      ctx.restore();
      hit(b.x, b.y, 15, "Пчела", () => {
        b.buzz = 1; sparks(b.x, b.y, 8, 50, 0.6);
        for (let i = 0; i < 2; i++) ring(b.x, b.y, 50, 34 + i * 16, 0.05);
      });
    }

    /* ── бабочки ── */
    for (const bf of flutters) {
      bf.scare *= 0.95;
      bf.phase += 0.016 * (1 + bf.scare * 3);
      bf.ax += bf.vx * (1 + bf.scare * 5);
      if (bf.ax > W + 60) { bf.ax = -60; bf.ay = rand(H * 0.25, H * 0.8); }
      const bx = bf.ax + Math.sin(bf.phase * 2.2) * 40;
      const by = bf.ay + Math.cos(bf.phase * 1.7) * 30 + Math.sin(bf.phase * 5) * 6;
      const flap = Math.abs(Math.sin(bf.phase * (9 + bf.scare * 20)));
      const s = bf.size;
      ctx.save();
      ctx.translate(bx, by);
      ctx.rotate(Math.sin(bf.phase * 2.2 + 1.5) * 0.5);
      ctx.globalAlpha = 0.75;
      const wgr = ctx.createLinearGradient(-6 * s, 0, 6 * s, 0);
      wgr.addColorStop(0, `hsla(${bf.hue},95%,72%,1)`);
      wgr.addColorStop(1, `hsla(${(bf.hue + 55) % 360},95%,68%,1)`);
      ctx.fillStyle = wgr;
      ctx.beginPath(); ctx.ellipse((-3.8 * flap - 1) * s, 0, (4 * flap + 0.7) * s, 2.8 * s, -0.45, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse((3.8 * flap + 1) * s, 0, (4 * flap + 0.7) * s, 2.8 * s, 0.45, 0, TAU); ctx.fill();
      ctx.fillStyle = "rgba(40,30,55,0.9)";
      ctx.fillRect(-0.8 * s, -3.2 * s, 1.6 * s, 6.4 * s);
      ctx.restore();
      hit(bx, by, 18, "Бабочка", () => { bf.scare = 1; sparks(bx, by, 10, bf.hue, 0.7); });
    }

    /* ── стрекоза ── */
    {
      const d = dragonfly;
      d.zip *= 0.95;
      const dx = d.tx - d.x, dy = d.ty - d.y, dist = Math.hypot(dx, dy);
      if (dist < 12) { d.tx = rand(W * 0.15, W * 0.85); d.ty = rand(H * 0.35, H * 0.75); }
      else {
        d.x += (dx / dist) * (3.2 + d.zip * 8);
        d.y += (dy / dist) * (3.2 + d.zip * 8) + Math.sin(t * 0.08) * 0.6;
      }
      d.wing += 0.9;
      const wa = Math.abs(Math.sin(d.wing));
      ctx.save();
      ctx.translate(d.x, d.y);
      ctx.rotate(Math.atan2(dy, dx) * 0.15);
      ctx.globalAlpha = 0.7;
      const bg2 = ctx.createLinearGradient(-8, 0, 8, 0);
      bg2.addColorStop(0, "rgba(90,255,200,1)");
      bg2.addColorStop(1, "rgba(80,190,255,1)");
      ctx.strokeStyle = bg2; ctx.lineWidth = 1.8; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(8, 0); ctx.stroke();
      ctx.globalAlpha = 0.3 + wa * 0.35;
      ctx.fillStyle = "rgba(200,245,255,0.95)";
      ctx.beginPath(); ctx.ellipse(-1, -3, 6, 1.8 * wa + 0.5, -0.3, 0, TAU); ctx.fill();
      ctx.beginPath(); ctx.ellipse(-1, 3, 6, 1.8 * wa + 0.5, 0.3, 0, TAU); ctx.fill();
      ctx.restore();
      hit(d.x, d.y, 18, "Стрекоза", () => {
        d.zip = 1; d.tx = rand(W * 0.1, W * 0.9); d.ty = rand(H * 0.3, H * 0.8);
        sparks(d.x, d.y, 9, 170, 0.8);
      });
    }

    /* ── светлячки ── */
    for (const fl of fireflies) {
      fl.flash *= 0.94;
      fl.phase += 0.012 * fl.speed * 4 * (1 + fl.flash * 4);
      const fx = fl.ax + Math.sin(fl.phase) * 55 + Math.sin(fl.phase * 0.37) * 25;
      const fy = fl.ay + Math.cos(fl.phase * 0.8) * 35;
      const glow = 0.5 + Math.sin(fl.phase * 2.6) * 0.5 + fl.flash;
      ctx.save();
      ctx.globalAlpha = Math.min(1, 0.25 + glow * 0.55);
      const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, 14 + fl.flash * 22);
      g.addColorStop(0, `hsla(${fl.hue},100%,75%,0.95)`);
      g.addColorStop(0.4, `hsla(${fl.hue},100%,65%,0.3)`);
      g.addColorStop(1, `hsla(${fl.hue},100%,60%,0)`);
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(fx, fy, 14 + fl.flash * 22, 0, TAU); ctx.fill();
      ctx.globalAlpha = Math.min(1, 0.5 + glow * 0.5);
      ctx.fillStyle = `hsla(${fl.hue},100%,88%,1)`;
      ctx.beginPath(); ctx.arc(fx, fy, fl.r * 0.8 * (1 + fl.flash), 0, TAU); ctx.fill();
      ctx.restore();
      hit(fx, fy, 16, "Светлячок", () => {
        fl.flash = 1;
        sparks(fx, fy, 12, fl.hue, 0.7);
        ring(fx, fy, fl.hue, 44, 0.04);
      });
    }

    /* ── листья ── */
    for (const l of leaves) {
      l.x += l.vx; l.y += l.vy; l.rot += l.rs;
      if (l.y > H + 15) { l.y = -15; l.x = Math.random() * W; }
      ctx.save();
      ctx.translate(l.x, l.y); ctx.rotate(l.rot); ctx.globalAlpha = l.op;
      ctx.beginPath();
      ctx.moveTo(l.size, 0);
      ctx.quadraticCurveTo(0, -l.size * 0.55, -l.size, 0);
      ctx.quadraticCurveTo(0, l.size * 0.55, l.size, 0);
      ctx.fillStyle = `hsla(${l.hue},${l.sat}%,${l.light}%,0.95)`;
      ctx.fill();
      ctx.globalAlpha = l.op * 0.55;
      ctx.strokeStyle = `hsla(${l.hue},${l.sat}%,${l.light + 22}%,0.9)`;
      ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.moveTo(-l.size, 0); ctx.lineTo(l.size, 0); ctx.stroke();
      ctx.restore();
    }

    /* ── семена ── */
    for (const sd of seeds) {
      sd.phase += 0.01;
      sd.y -= sd.vy;
      sd.x += Math.sin(sd.phase * 3) * 0.3;
      if (sd.y < -12) { sd.y = H + 12; sd.x = Math.random() * W; }
      ctx.save();
      ctx.translate(sd.x, sd.y); ctx.rotate(sd.phase); ctx.globalAlpha = sd.op;
      ctx.strokeStyle = "rgba(225,245,255,0.95)"; ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo(-2.8, 0); ctx.lineTo(2.8, 0);
      ctx.moveTo(0, -2.8); ctx.lineTo(0, 2.8);
      ctx.moveTo(-1.9, -1.9); ctx.lineTo(1.9, 1.9);
      ctx.moveTo(-1.9, 1.9); ctx.lineTo(1.9, -1.9);
      ctx.stroke();
      ctx.restore();
    }

    /* ── частицы эффектов ── */
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.life -= p.decay;
      if (p.life <= 0) { parts.splice(i, 1); continue; }
      p.x += p.vx; p.y += p.vy; p.vy += p.grav; p.rot += p.rs;
      ctx.save();
      if (p.kind === "ring") {
        const r = p.size + (1 - p.life) * p.max;
        ctx.globalAlpha = p.life * 0.5;
        ctx.strokeStyle = `hsla(${p.hue},95%,75%,1)`;
        ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.stroke();
      } else if (p.kind === "leaf") {
        ctx.translate(p.x, p.y); ctx.rotate(p.rot);
        ctx.globalAlpha = p.life * 0.9;
        ctx.fillStyle = `hsla(${p.hue},85%,55%,1)`;
        ctx.beginPath();
        ctx.moveTo(p.size, 0);
        ctx.quadraticCurveTo(0, -p.size * 0.55, -p.size, 0);
        ctx.quadraticCurveTo(0, p.size * 0.55, p.size, 0);
        ctx.fill();
      } else if (p.kind === "puff") {
        const r = p.size * (1 + (1 - p.life) * 1.8);
        ctx.globalAlpha = p.life * 0.35;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
        g.addColorStop(0, `hsla(${p.hue},90%,75%,0.9)`);
        g.addColorStop(1, `hsla(${p.hue},90%,65%,0)`);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.fill();
      } else if (p.kind === "drop") {
        ctx.globalAlpha = Math.min(1, p.life) * 0.75;
        ctx.strokeStyle = "rgba(170,230,255,0.95)"; ctx.lineWidth = 1.3; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x - p.vx * 2, p.y - p.vy * 2.4); ctx.stroke();
        if (p.y > waterY) {
          ripples.push({ x: p.x, y: p.y, r: 1, max: 14, op: 0.45 });
          p.life = 0;
        }
      } else if (p.kind === "note") {
        ctx.globalAlpha = p.life * 0.7;
        ctx.strokeStyle = `hsla(${p.hue},90%,78%,1)`;
        ctx.lineWidth = 1.5; ctx.lineCap = "round";
        const r = p.size * 0.45;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, TAU); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(p.x + r, p.y); ctx.lineTo(p.x + r, p.y - p.size); ctx.stroke();
      } else {
        ctx.globalAlpha = p.life * 0.9;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 3.4);
        g.addColorStop(0, `hsla(${p.hue},100%,80%,0.95)`);
        g.addColorStop(1, `hsla(${p.hue},100%,70%,0)`);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 3.4, 0, TAU); ctx.fill();
        ctx.fillStyle = `hsla(${p.hue},100%,92%,1)`;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * 0.6, 0, TAU); ctx.fill();
      }
      ctx.restore();
    }

    raf = requestAnimationFrame(loop);
  };

  loop();

  return {
    destroy() {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointerdown", onDown, true);
    },
  };
}
