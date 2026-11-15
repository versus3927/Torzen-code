"use client";

import { useEffect, useRef } from "react";
import useIsMobile from "@/hooks/useIsMobile";

/* ───────────────────────────── types ───────────────────────────── */

interface Leaf    { x: number; y: number; vx: number; vy: number; rot: number; rs: number; size: number; op: number; hue: number; sat: number; light: number }
interface Bird    { x: number; y: number; vx: number; phase: number; size: number; op: number; hue: number }
interface Deer    { x: number; vx: number; dir: 1 | -1; legPhase: number; size: number; op: number }
interface Cloud   { x: number; y: number; r: number; vx: number; puffs: { dx: number; dy: number; r: number }[]; op: number; hue: number }
interface Ridge   { pts: { x: number; y: number }[]; drift: number; speed: number; base: number; amp: number }
interface Flow    { x: number; lane: number; len: number; vx: number; op: number; hue: number }
interface Ripple  { x: number; y: number; r: number; max: number; op: number }
interface Splash  { x: number; y: number; vx: number; vy: number; life: number }
interface Fish    { state: "idle" | "jump"; t: number; next: number; x0: number; x1: number; h: number; lane: number }
interface Shadow  { x: number; lane: number; vx: number; len: number; op: number }
interface Blade   { x: number; h: number; lean: number; phase: number; op: number; hue: number }
interface Flower  { x: number; h: number; phase: number; hue: number; r: number; op: number }
interface Firefly { x: number; y: number; ax: number; ay: number; phase: number; speed: number; r: number; hue: number }
interface Flutter { x: number; y: number; ax: number; ay: number; phase: number; vx: number; hue: number; size: number }
interface Bunny   { x: number; dir: 1 | -1; hop: number; pause: number; size: number }
interface Fox     { x: number; dir: 1 | -1; phase: number; size: number }
interface Seed    { x: number; y: number; vy: number; phase: number; op: number }
interface Star    { x: number; y: number; r: number; phase: number; speed: number; hue: number }
interface Meteor  { active: boolean; x: number; y: number; vx: number; vy: number; life: number; next: number }
interface Mist    { y: number; w: number; x: number; vx: number; op: number; hue: number }
interface Orb     { x: number; y: number; r: number; vx: number; vy: number; hue: number; op: number; phase: number }

/* ═════════════════════ component ═════════════════════ */

export default function NatureOverlay() {
  const isMobile = useIsMobile();
  const ref = useRef<HTMLCanvasElement>(null);
  const raf = useRef(0);

  useEffect(() => {
    // Полностью выключаем на мобильных
    if (isMobile) return;

    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    const resize = () => { c.width = innerWidth; c.height = innerHeight; };
    resize();
    addEventListener("resize", resize);

    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    /* ─────────────── init entities ─────────────── */

    // Листья — осенняя палитра: золото, янтарь, багрянец, изумруд
    const leafHues = [18, 30, 42, 52, 8, 95, 130];
    const leaves: Leaf[] = Array.from({ length: 30 }, () => ({
      x: rand(0, c.width), y: rand(0, c.height),
      vx: rand(-0.18, 0.18), vy: rand(0.12, 0.4),
      rot: rand(0, 6.28), rs: rand(-0.009, 0.009),
      size: rand(4, 10), op: rand(0.4, 0.75),
      hue: leafHues[Math.floor(Math.random() * leafHues.length)],
      sat: rand(70, 95), light: rand(45, 62),
    }));

    // Птицы (стая)
    const birds: Bird[] = Array.from({ length: 7 }, (_, i) => ({
      x: -100 - i * rand(160, 400), y: rand(50, 240),
      vx: rand(0.35, 0.65), phase: rand(0, 6.28),
      size: rand(9, 14), op: rand(0.4, 0.65), hue: rand(190, 230),
    }));

    // Орёл — кружит высоко
    const eagle = { cx: c.width * 0.7, cy: 130, r: 110, ang: rand(0, 6.28), speed: 0.0042, size: 1.5, drift: rand(0.04, 0.07) };

    // Олени
    const deer: Deer[] = [
      { x: c.width * 0.15, vx: 0.15, dir: 1,  legPhase: 0,   size: 1,   op: 0.55 },
      { x: c.width * 0.75, vx: 0.12, dir: -1, legPhase: 1.5, size: 0.7, op: 0.45 },
      { x: c.width * 0.45, vx: 0.1,  dir: 1,  legPhase: 3.1, size: 0.5, op: 0.38 },
    ];

    // Заяц
    const bunny: Bunny = { x: c.width * 0.3, dir: 1, hop: 0, pause: 120, size: 0.9 };

    // Лиса
    const fox: Fox = { x: -80, dir: 1, phase: 0, size: 0.95 };

    // Бабочки — яркие, разноцветные
    const flutters: Flutter[] = Array.from({ length: 5 }, (_, i) => ({
      x: rand(0, c.width), y: rand(0, c.height),
      ax: rand(100, c.width - 100), ay: rand(c.height * 0.25, c.height * 0.8),
      phase: i * 1.7, vx: rand(0.2, 0.5),
      hue: [15, 40, 200, 280, 330][i % 5], size: rand(0.9, 1.5),
    }));

    // Стрекоза
    const dragonfly = { x: c.width * 0.5, y: c.height * 0.6, tx: c.width * 0.5, ty: c.height * 0.6, wing: 0 };

    // Светлячки — тёплое золото и бирюза
    const fireflies: Firefly[] = Array.from({ length: 18 }, () => ({
      x: rand(0, c.width), y: rand(0, c.height),
      ax: rand(0, c.width), ay: rand(c.height * 0.3, c.height * 0.95),
      phase: rand(0, 6.28), speed: rand(0.2, 0.5), r: rand(1.4, 2.8),
      hue: Math.random() > 0.3 ? rand(45, 62) : rand(160, 185),
    }));

    // Плавающие цветные сферы света (боке)
    const orbs: Orb[] = Array.from({ length: 7 }, () => ({
      x: rand(0, c.width), y: rand(c.height * 0.1, c.height * 0.9),
      r: rand(60, 170), vx: rand(-0.14, 0.14), vy: rand(-0.07, 0.07),
      hue: [160, 190, 275, 330, 45, 120, 210][Math.floor(rand(0, 7))],
      op: rand(0.05, 0.11), phase: rand(0, 6.28),
    }));

    // Семена одуванчика
    const seeds: Seed[] = Array.from({ length: 14 }, () => ({
      x: rand(0, c.width), y: rand(0, c.height),
      vy: rand(0.06, 0.2), phase: rand(0, 6.28), op: rand(0.25, 0.5),
    }));

    // Мерцающие звёзды — с цветными оттенками
    const stars: Star[] = Array.from({ length: 34 }, () => ({
      x: rand(0, c.width), y: rand(0, c.height * 0.5),
      r: rand(0.7, 1.9), phase: rand(0, 6.28), speed: rand(0.01, 0.035),
      hue: [195, 45, 280, 0, 160][Math.floor(rand(0, 5))],
    }));

    // Падающая звезда
    const meteor: Meteor = { active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, next: 300 };

    // Облака — с тёплой/холодной подсветкой
    const clouds: Cloud[] = Array.from({ length: 5 }, (_, i) => {
      const r = rand(60, 140);
      return {
        x: rand(-200, c.width + 200), y: rand(40, c.height * 0.32),
        r, vx: rand(0.08, 0.22) * (i % 2 === 0 ? 1 : 1.4),
        op: rand(0.07, 0.13), hue: i % 2 === 0 ? rand(255, 290) : rand(195, 215),
        puffs: Array.from({ length: 4 }, () => ({ dx: rand(-r, r), dy: rand(-r * 0.28, r * 0.28), r: rand(r * 0.5, r) })),
      };
    });

    // Горные хребты
    const makeRidge = (baseRatio: number, amp: number, speed: number): Ridge => {
      const pts: { x: number; y: number }[] = [];
      const n = 9;
      for (let i = 0; i <= n; i++) {
        pts.push({ x: (i / n) * 1.3 - 0.15, y: rand(-1, -0.25) * amp * rand(0.5, 1) });
      }
      return { pts, drift: rand(0, 100), speed, base: baseRatio, amp };
    };
    const ridgeFar  = makeRidge(0.78, 0.17, 0.006);
    const ridgeNear = makeRidge(0.9, 0.11, 0.011);

    // Полосы тумана
    const mists: Mist[] = Array.from({ length: 4 }, (_, i) => ({
      y: rand(0.74, 0.92), w: rand(0.35, 0.65),
      x: rand(0, 1), vx: rand(0.0004, 0.0012) * (i % 2 ? 1 : -1),
      op: rand(0.07, 0.13), hue: i % 2 ? rand(170, 200) : rand(265, 295),
    }));

    // Ручеёк: бегущие штрихи потока
    const flows: Flow[] = Array.from({ length: 34 }, () => ({
      x: rand(0, c.width), lane: rand(0.925, 0.99),
      len: rand(20, 70), vx: rand(0.6, 1.8), op: rand(0.25, 0.55),
      hue: rand(170, 205),
    }));

    // Тени рыб под водой
    const shadows: Shadow[] = [
      { x: rand(0, c.width), lane: 0.955, vx: 0.5,  len: 26, op: 0.3 },
      { x: rand(0, c.width), lane: 0.975, vx: -0.4, len: 18, op: 0.24 },
    ];

    // Круги на воде + брызги
    const ripples: Ripple[] = [];
    const splashes: Splash[] = [];
    let nextRipple = 90;

    // Выпрыгивающая рыба
    const fish: Fish = { state: "idle", t: 0, next: 200, x0: 0, x1: 0, h: 46, lane: 0.95 };

    // Трава
    const blades: Blade[] = Array.from({ length: 110 }, (_, i) => {
      const nearStream = i < 70;
      return {
        x: rand(0, 1),
        h: nearStream ? rand(10, 26) : rand(7, 16),
        lean: rand(-0.3, 0.3), phase: rand(0, 6.28),
        op: nearStream ? rand(0.3, 0.55) : rand(0.18, 0.35),
        hue: rand(95, 155),
      };
    });

    // Полевые цветы
    const flowers: Flower[] = Array.from({ length: 26 }, () => ({
      x: rand(0, 1), h: rand(10, 22), phase: rand(0, 6.28),
      hue: [330, 50, 275, 10, 190, 300][Math.floor(rand(0, 6))],
      r: rand(1.8, 3.2), op: rand(0.4, 0.75),
    }));

    /* ─────────────── helpers ─────────────── */

    // Насыщенные боковые свечения — изумруд слева, бирюза/фиолет справа
    const drawEdge = (side: "l" | "r", W: number, H: number) => {
      const t = Date.now() * 0.0003;
      const dir = side === "l" ? 1 : -1;
      const base = side === "l" ? 0 : W;
      const spots = side === "l"
        ? [
            { yR: 0.1, r: 210, a: 0.3,  ph: 0,   col: "70,200,120" },
            { yR: 0.4, r: 230, a: 0.26, ph: 1.5, col: "40,185,165" },
            { yR: 0.7, r: 200, a: 0.28, ph: 3,   col: "95,210,105" },
          ]
        : [
            { yR: 0.15, r: 210, a: 0.26, ph: 0.7, col: "60,175,215" },
            { yR: 0.45, r: 230, a: 0.24, ph: 2.1, col: "150,110,230" },
            { yR: 0.75, r: 200, a: 0.27, ph: 3.8, col: "55,195,180" },
          ];
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

    // Хребты — цветные, с градиентом
    const drawRidge = (r: Ridge, W: number, H: number, far: boolean, t: number) => {
      const baseY = H * r.base;
      const pts = r.pts.map(p => ({
        x: p.x * W + Math.sin(t * r.speed * 8 + r.drift + p.x * 4) * 22,
        y: baseY + p.y * H + Math.sin(t * r.speed * 5 + p.x * 9 + r.drift) * 6,
      }));
      ctx.beginPath();
      ctx.moveTo(-W * 0.2, H + 4);
      ctx.lineTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        const mx = (pts[i - 1].x + pts[i].x) / 2;
        const my = (pts[i - 1].y + pts[i].y) / 2;
        ctx.quadraticCurveTo(pts[i - 1].x, pts[i - 1].y, mx, my);
      }
      ctx.lineTo(W * 1.2, pts[pts.length - 1].y + 30);
      ctx.lineTo(W * 1.2, H + 4);
      ctx.closePath();
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
      ctx.fillStyle = g;
      ctx.fill();

      // контурная подсветка гребня
      ctx.save();
      ctx.globalAlpha = far ? 0.3 : 0.4;
      ctx.strokeStyle = far ? "rgba(175,165,255,0.75)" : "rgba(90,235,205,0.75)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 1; i < pts.length; i++) {
        const mx = (pts[i - 1].x + pts[i].x) / 2;
        const my = (pts[i - 1].y + pts[i].y) / 2;
        ctx.quadraticCurveTo(pts[i - 1].x, pts[i - 1].y, mx, my);
      }
      ctx.stroke();
      ctx.restore();

      // снежные шапки
      if (far) {
        ctx.fillStyle = "rgba(235,240,255,0.26)";
        pts.forEach(p => {
          if (p.y < baseY - H * r.amp * 0.55) {
            ctx.beginPath();
            ctx.moveTo(p.x - 17, p.y + 19);
            ctx.lineTo(p.x, p.y);
            ctx.lineTo(p.x + 17, p.y + 19);
            ctx.closePath();
            ctx.fill();
          }
        });
      }
    };

    /* ─────────────── main loop ─────────────── */

    let tick = 0;

    const loop = () => {
      tick++;
      const t = tick;
      const W = c.width, H = c.height;
      const meadowY = H * 0.885;
      const streamTop = H * 0.92;

      ctx.clearRect(0, 0, W, H);

      /* ── северное сияние: зелёный → бирюза → фиолет ── */
      ctx.save();
      for (let band = 0; band < 3; band++) {
        ctx.globalAlpha = (0.14 - band * 0.03) + Math.sin(t * 0.004 + band) * 0.05;
        ctx.beginPath();
        const yTop = H * (0.02 + band * 0.05);
        for (let x = 0; x <= W; x += 36) {
          const y = yTop + Math.sin(x * 0.004 + t * 0.006 + band) * 28 + Math.sin(x * 0.011 - t * 0.004) * 15;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        for (let x = W; x >= 0; x -= 36) {
          const y = yTop + H * 0.14 + Math.sin(x * 0.003 + t * 0.005 + 2 + band) * 32;
          ctx.lineTo(x, y);
        }
        ctx.closePath();
        const ag = ctx.createLinearGradient(0, yTop, 0, yTop + H * 0.2);
        const cols = [
          ["rgba(70,255,170,0.95)", "rgba(60,200,255,0)"],
          ["rgba(150,120,255,0.9)", "rgba(80,220,255,0)"],
          ["rgba(255,120,200,0.8)", "rgba(120,160,255,0)"],
        ][band];
        ag.addColorStop(0, cols[0]);
        ag.addColorStop(1, cols[1]);
        ctx.fillStyle = ag;
        ctx.fill();
      }
      ctx.restore();

      /* ── цветные сферы боке ── */
      for (const o of orbs) {
        o.x += o.vx; o.y += o.vy; o.phase += 0.006;
        if (o.x < -o.r) o.x = W + o.r;
        if (o.x > W + o.r) o.x = -o.r;
        if (o.y < -o.r) o.y = H + o.r;
        if (o.y > H + o.r) o.y = -o.r;
        const pulse = 0.75 + Math.sin(o.phase) * 0.25;
        ctx.save();
        ctx.globalAlpha = o.op * pulse;
        const g = ctx.createRadialGradient(o.x, o.y, 0, o.x, o.y, o.r);
        g.addColorStop(0, `hsla(${o.hue},90%,65%,0.9)`);
        g.addColorStop(0.55, `hsla(${o.hue},90%,55%,0.22)`);
        g.addColorStop(1, `hsla(${o.hue},90%,50%,0)`);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(o.x, o.y, o.r, 0, 6.28); ctx.fill();
        ctx.restore();
      }

      /* ── звёзды ── */
      for (const s of stars) {
        s.phase += s.speed;
        const a = 0.25 + Math.abs(Math.sin(s.phase)) * 0.65;
        ctx.save();
        ctx.globalAlpha = a;
        const sg = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, s.r * 4);
        sg.addColorStop(0, `hsla(${s.hue},85%,80%,1)`);
        sg.addColorStop(1, `hsla(${s.hue},85%,70%,0)`);
        ctx.fillStyle = sg;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r * 4, 0, 6.28); ctx.fill();
        ctx.fillStyle = `hsla(${s.hue},60%,95%,1)`;
        ctx.beginPath(); ctx.arc(s.x, s.y, s.r, 0, 6.28); ctx.fill();
        ctx.restore();
      }

      /* ── падающая звезда ── */
      if (!meteor.active && tick > meteor.next) {
        meteor.active = true;
        meteor.x = rand(W * 0.2, W * 0.9);
        meteor.y = rand(20, H * 0.25);
        const sp = rand(6, 9);
        meteor.vx = -sp * 0.8; meteor.vy = sp * 0.45;
        meteor.life = 1;
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
          ctx.beginPath();
          ctx.moveTo(meteor.x, meteor.y);
          ctx.lineTo(meteor.x - meteor.vx * 16, meteor.y - meteor.vy * 16);
          ctx.stroke();
          ctx.restore();
        }
      }

      /* ── облака ── */
      for (const cl of clouds) {
        cl.x += cl.vx;
        if (cl.x - cl.r * 2 > W) { cl.x = -cl.r * 2.5; cl.y = rand(40, H * 0.3); }
        ctx.save();
        ctx.globalAlpha = cl.op;
        ctx.fillStyle = `hsla(${cl.hue},70%,70%,1)`;
        for (const p of cl.puffs) {
          ctx.beginPath();
          ctx.ellipse(cl.x + p.dx, cl.y + p.dy + Math.sin(t * 0.004 + p.dx) * 2, p.r, p.r * 0.45, 0, 0, 6.28);
          ctx.fill();
        }
        ctx.restore();
      }

      /* ── боковые свечения ── */
      drawEdge("l", W, H);
      drawEdge("r", W, H);

      /* ── горы ── */
      drawRidge(ridgeFar, W, H, true, t);
      drawRidge(ridgeNear, W, H, false, t);

      /* ── цветной туман ── */
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
      }

      /* ── орёл ── */
      {
        eagle.ang += eagle.speed;
        eagle.cx += eagle.drift;
        if (eagle.cx > W + 200) eagle.cx = -200;
        const ex = eagle.cx + Math.cos(eagle.ang) * eagle.r;
        const ey = eagle.cy + Math.sin(eagle.ang) * eagle.r * 0.35;
        const bank = Math.sin(eagle.ang);
        const ws = 17 * eagle.size;
        ctx.save();
        ctx.translate(ex, ey);
        ctx.scale(Math.cos(eagle.ang) >= 0 ? 1 : -1, 1);
        ctx.globalAlpha = 0.6;
        ctx.strokeStyle = "rgba(255,195,110,0.95)";
        ctx.lineWidth = 2; ctx.lineCap = "round";
        const wob = Math.sin(t * 0.05) * 1.5;
        ctx.beginPath();
        ctx.moveTo(-ws, wob * bank);
        ctx.quadraticCurveTo(-ws * 0.45, -8 - wob, 0, 0);
        ctx.quadraticCurveTo(ws * 0.45, -8 - wob, ws, wob * bank);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(0, 0, 4.5, 2.4, 0, 0, 6.28);
        ctx.fillStyle = "rgba(255,215,150,0.9)";
        ctx.fill();
        ctx.restore();
      }

      /* ── олени (тёплый янтарь + свечение рогов) ── */
      for (const d of deer) {
        d.x += d.vx * d.dir; d.legPhase += 0.03;
        if (d.dir === 1 && d.x > W + 50) d.x = -50;
        if (d.dir === -1 && d.x < -50) d.x = W + 50;
        const s = d.size * 27;
        const gy = meadowY + Math.sin(t * 0.01 + d.x * 0.01) * 1.5;
        const leg = Math.sin(d.legPhase) * 3.5 * d.size;
        ctx.save(); ctx.translate(d.x, gy); ctx.scale(d.dir, 1); ctx.globalAlpha = d.op;
        const col = "rgba(255,190,120,0.95)";
        ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 1.6 * d.size; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(s*0.3,-s*0.14); ctx.lineTo(s*0.3+leg,0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(s*0.34,-s*0.16); ctx.lineTo(s*0.34-leg,0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-s*0.26,-s*0.14); ctx.lineTo(-s*0.26-leg,0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-s*0.22,-s*0.16); ctx.lineTo(-s*0.22+leg,0); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(0,-s*0.3,s*0.4,s*0.16,0,0,6.28); ctx.fill();
        ctx.beginPath(); ctx.moveTo(s*0.35,-s*0.36); ctx.quadraticCurveTo(s*0.45,-s*0.65,s*0.5,-s*0.74); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(s*0.52,-s*0.78,s*0.09,s*0.06,0.3,0,6.28); ctx.fill();
        // светящиеся рога
        ctx.strokeStyle = "rgba(150,255,220,0.95)";
        ctx.lineWidth = 1.2 * d.size;
        ctx.beginPath(); ctx.moveTo(s*0.54,-s*0.86); ctx.quadraticCurveTo(s*0.66,-s*1.1,s*0.64,-s*1.22); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(s*0.6,-s*1.06); ctx.lineTo(s*0.7,-s*1.1); ctx.stroke();
        ctx.restore();
      }

      /* ── заяц ── */
      {
        const b = bunny;
        if (b.pause > 0) {
          b.pause--;
          if (b.pause === 0) b.dir = Math.random() > 0.5 ? 1 : -1;
        } else {
          b.hop += 0.09;
          b.x += b.dir * 1.7;
          if (b.hop > Math.PI) { b.hop = 0; if (Math.random() < 0.3) b.pause = Math.floor(rand(80, 220)); }
          if (b.x > W - 60) b.dir = -1;
          if (b.x < 60) b.dir = 1;
        }
        const jumpY = Math.abs(Math.sin(b.hop)) * 11;
        const s = 15 * b.size;
        const gy = meadowY + 4 - jumpY;
        const sit = b.pause > 0 ? 1 : 0;
        const earW = Math.sin(t * 0.06) * (sit ? 1.6 : 0.5);
        ctx.save(); ctx.translate(b.x, gy); ctx.scale(b.dir, 1); ctx.globalAlpha = 0.5;
        const col = "rgba(225,235,255,0.95)";
        ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.lineCap = "round";
        ctx.beginPath(); ctx.ellipse(0, -s * 0.45, s * 0.55, s * (0.38 + sit * 0.12), -0.25, 0, 6.28); ctx.fill();
        ctx.beginPath(); ctx.arc(s * 0.5, -s * 0.8, s * 0.26, 0, 6.28); ctx.fill();
        ctx.fillStyle = "rgba(255,180,200,0.9)";
        ctx.beginPath(); ctx.ellipse(s * 0.5 + earW, -s * 1.3, s * 0.07, s * 0.34, -0.15, 0, 6.28); ctx.fill();
        ctx.beginPath(); ctx.ellipse(s * 0.62 + earW, -s * 1.28, s * 0.06, s * 0.3, 0.15, 0, 6.28); ctx.fill();
        ctx.fillStyle = col; ctx.strokeStyle = col;
        ctx.beginPath(); ctx.moveTo(-s * 0.2, -s * 0.2); ctx.quadraticCurveTo(-s * 0.7, -s * 0.15, -s * 0.75, 0); ctx.stroke();
        ctx.beginPath(); ctx.arc(-s * 0.62, -s * 0.42, s * 0.14, 0, 6.28); ctx.fill();
        ctx.restore();
      }

      /* ── лиса (сочный оранжевый + белый кончик хвоста) ── */
      {
        const f = fox;
        f.phase += 0.055;
        f.x += f.dir * 1.15;
        if (f.dir === 1 && f.x > W + 90) f.dir = -1;
        if (f.dir === -1 && f.x < -90) f.dir = 1;
        const s = 23 * f.size;
        const gy = meadowY + 10;
        const leg = Math.sin(f.phase) * 4.2 * f.size;
        const leg2 = Math.sin(f.phase + 3.14) * 4.2 * f.size;
        const tailW = Math.sin(t * 0.045) * 3;
        ctx.save(); ctx.translate(f.x, gy); ctx.scale(f.dir, 1); ctx.globalAlpha = 0.6;
        const col = "rgba(255,135,45,0.95)";
        ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 1.9 * f.size; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(s * 0.32, -s * 0.16); ctx.lineTo(s * 0.32 + leg, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(s * 0.38, -s * 0.18); ctx.lineTo(s * 0.38 + leg2, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-s * 0.28, -s * 0.16); ctx.lineTo(-s * 0.28 + leg2, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-s * 0.34, -s * 0.18); ctx.lineTo(-s * 0.34 + leg, 0); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(0, -s * 0.32, s * 0.48, s * 0.17, 0, 0, 6.28); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(s * 0.42, -s * 0.34); ctx.lineTo(s * 0.68, -s * 0.52); ctx.lineTo(s * 0.6, -s * 0.42);
        ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(s * 0.52, -s * 0.52); ctx.lineTo(s * 0.56, -s * 0.68); ctx.lineTo(s * 0.62, -s * 0.54);
        ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-s * 0.44, -s * 0.34);
        ctx.quadraticCurveTo(-s * 0.85, -s * 0.5 + tailW, -s * 1.05, -s * 0.32 + tailW * 2);
        ctx.quadraticCurveTo(-s * 0.8, -s * 0.22 + tailW, -s * 0.44, -s * 0.18);
        ctx.closePath(); ctx.fill();
        ctx.fillStyle = "rgba(255,250,245,0.95)";
        ctx.beginPath();
        ctx.ellipse(-s * 1.0, -s * 0.31 + tailW * 2, s * 0.12, s * 0.09, 0, 0, 6.28);
        ctx.fill();
        ctx.restore();
      }

      /* ── ручеёк ── */
      {
        const wg = ctx.createLinearGradient(0, streamTop, 0, H);
        wg.addColorStop(0, "rgba(70,215,230,0.22)");
        wg.addColorStop(0.5, "rgba(45,160,230,0.3)");
        wg.addColorStop(1, "rgba(60,110,220,0.4)");
        ctx.fillStyle = wg;
        ctx.beginPath();
        ctx.moveTo(0, streamTop);
        for (let x = 0; x <= W; x += 24) {
          ctx.lineTo(x, streamTop + Math.sin(x * 0.012 + t * 0.02) * 2.6 + Math.sin(x * 0.03 - t * 0.013) * 1.8);
        }
        ctx.lineTo(W, H); ctx.lineTo(0, H);
        ctx.closePath(); ctx.fill();

        // яркая бликовая кромка
        ctx.save();
        ctx.globalAlpha = 0.65;
        ctx.strokeStyle = "rgba(170,255,250,0.9)";
        ctx.lineWidth = 1.6; ctx.lineCap = "round";
        ctx.beginPath();
        for (let x = 0; x <= W; x += 16) {
          const y = streamTop + Math.sin(x * 0.012 + t * 0.02) * 2.6 + Math.sin(x * 0.03 - t * 0.013) * 1.8;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();

        // бегущие штрихи течения
        for (const fl of flows) {
          fl.x += fl.vx;
          if (fl.x - fl.len > W) { fl.x = -fl.len; fl.lane = rand(0.925, 0.99); }
          const fy = H * fl.lane + Math.sin(fl.x * 0.02 + t * 0.03) * 2;
          ctx.save();
          ctx.globalAlpha = fl.op * (0.6 + Math.sin(t * 0.04 + fl.lane * 40) * 0.4);
          ctx.strokeStyle = `hsla(${fl.hue},95%,75%,0.95)`;
          ctx.lineWidth = 1.5; ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(fl.x, fy);
          ctx.lineTo(fl.x + fl.len, fy);
          ctx.stroke();
          ctx.restore();
        }

        // тени рыб
        for (const sh of shadows) {
          sh.x += sh.vx;
          if (sh.vx > 0 && sh.x > W + 40) sh.x = -40;
          if (sh.vx < 0 && sh.x < -40) sh.x = W + 40;
          ctx.save();
          ctx.globalAlpha = sh.op;
          ctx.fillStyle = "rgba(10,40,60,0.95)";
          ctx.beginPath();
          ctx.ellipse(sh.x, H * sh.lane, sh.len, 3.6, 0, 0, 6.28);
          ctx.fill();
          ctx.restore();
        }

        // круги на воде
        if (tick > nextRipple) {
          nextRipple = tick + rand(70, 180);
          ripples.push({ x: rand(W * 0.05, W * 0.95), y: rand(streamTop + 6, H - 8), r: 2, max: rand(20, 38), op: 0.6 });
        }
        for (let i = ripples.length - 1; i >= 0; i--) {
          const rp = ripples[i];
          rp.r += 0.5; rp.op -= 0.009;
          if (rp.op <= 0 || rp.r > rp.max) { ripples.splice(i, 1); continue; }
          ctx.save();
          ctx.globalAlpha = rp.op;
          ctx.strokeStyle = "rgba(180,255,250,0.95)";
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.ellipse(rp.x, rp.y, rp.r, rp.r * 0.38, 0, 0, 6.28);
          ctx.stroke();
          ctx.restore();
        }

        // рыба выпрыгивает
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
            ctx.beginPath(); ctx.ellipse(0, 0, 9, 3.2, 0, 0, 6.28); ctx.fill();
            ctx.beginPath();
            ctx.moveTo(-8, 0); ctx.lineTo(-13.5, -3.8); ctx.lineTo(-13.5, 3.8);
            ctx.closePath(); ctx.fill();
            ctx.restore();
          }
        }

        // брызги
        for (let i = splashes.length - 1; i >= 0; i--) {
          const sp = splashes[i];
          sp.x += sp.vx; sp.y += sp.vy; sp.vy += 0.09; sp.life -= 0.03;
          if (sp.life <= 0 || sp.y > H) { splashes.splice(i, 1); continue; }
          ctx.save();
          ctx.globalAlpha = sp.life * 0.85;
          ctx.fillStyle = "rgba(195,255,255,1)";
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, 1.5, 0, 6.28);
          ctx.fill();
          ctx.restore();
        }
      }

      /* ── трава ── */
      {
        ctx.save();
        ctx.lineWidth = 1.5; ctx.lineCap = "round";
        for (let i = 0; i < blades.length; i++) {
          const bl = blades[i];
          const nearStream = i < 70;
          const bx = bl.x * W;
          const by = nearStream ? streamTop + Math.sin(bx * 0.012 + t * 0.02) * 2.6 + 2 : meadowY + 6;
          const sway = Math.sin(t * 0.02 + bl.phase + bx * 0.008) * (2.2 + bl.h * 0.08) + bl.lean * 3;
          ctx.globalAlpha = bl.op;
          ctx.strokeStyle = `hsla(${bl.hue},85%,${nearStream ? 62 : 52}%,0.95)`;
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.quadraticCurveTo(bx + sway * 0.4, by - bl.h * 0.6, bx + sway, by - bl.h);
          ctx.stroke();
        }
        ctx.restore();
      }

      /* ── полевые цветы ── */
      for (const fw of flowers) {
        const fx = fw.x * W;
        const fyBase = meadowY + 6;
        const sway = Math.sin(t * 0.018 + fw.phase + fx * 0.007) * 3.2;
        const topX = fx + sway, topY = fyBase - fw.h;
        ctx.save();
        ctx.globalAlpha = fw.op;
        ctx.strokeStyle = "hsla(120,70%,50%,0.85)";
        ctx.lineWidth = 1.2; ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(fx, fyBase);
        ctx.quadraticCurveTo(fx + sway * 0.4, fyBase - fw.h * 0.6, topX, topY);
        ctx.stroke();
        // лепестки
        for (let p = 0; p < 5; p++) {
          const a = (p / 5) * 6.28 + fw.phase;
          ctx.fillStyle = `hsla(${fw.hue},90%,68%,0.95)`;
          ctx.beginPath();
          ctx.ellipse(topX + Math.cos(a) * fw.r, topY + Math.sin(a) * fw.r, fw.r * 0.85, fw.r * 0.6, a, 0, 6.28);
          ctx.fill();
        }
        ctx.fillStyle = "hsla(50,95%,70%,1)";
        ctx.beginPath(); ctx.arc(topX, topY, fw.r * 0.55, 0, 6.28); ctx.fill();
        ctx.restore();
      }

      /* ── бабочки ── */
      for (const bf of flutters) {
        bf.phase += 0.016;
        bf.ax += bf.vx;
        if (bf.ax > W + 60) { bf.ax = -60; bf.ay = rand(H * 0.25, H * 0.8); }
        const bx = bf.ax + Math.sin(bf.phase * 2.2) * 40;
        const by = bf.ay + Math.cos(bf.phase * 1.7) * 30 + Math.sin(bf.phase * 5) * 6;
        const flap = Math.abs(Math.sin(bf.phase * 9));
        const s = bf.size;
        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(Math.sin(bf.phase * 2.2 + 1.5) * 0.5);
        ctx.globalAlpha = 0.75;
        const wg2 = ctx.createLinearGradient(-6 * s, 0, 6 * s, 0);
        wg2.addColorStop(0, `hsla(${bf.hue},95%,72%,1)`);
        wg2.addColorStop(1, `hsla(${(bf.hue + 55) % 360},95%,68%,1)`);
        ctx.fillStyle = wg2;
        ctx.beginPath(); ctx.ellipse((-3.8 * flap - 1) * s, 0, (4 * flap + 0.7) * s, 2.8 * s, -0.45, 0, 6.28); ctx.fill();
        ctx.beginPath(); ctx.ellipse((3.8 * flap + 1) * s, 0, (4 * flap + 0.7) * s, 2.8 * s, 0.45, 0, 6.28); ctx.fill();
        ctx.fillStyle = "rgba(40,30,55,0.9)";
        ctx.fillRect(-0.8 * s, -3.2 * s, 1.6 * s, 6.4 * s);
        ctx.restore();
      }

      /* ── стрекоза ── */
      {
        const d = dragonfly;
        const dx = d.tx - d.x, dy = d.ty - d.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 12) {
          d.tx = rand(W * 0.15, W * 0.85);
          d.ty = rand(H * 0.35, H * 0.75);
        } else {
          d.x += (dx / dist) * 3.2;
          d.y += (dy / dist) * 3.2 + Math.sin(t * 0.08) * 0.6;
        }
        d.wing += 0.9;
        const wa = Math.abs(Math.sin(d.wing));
        ctx.save();
        ctx.translate(d.x, d.y);
        ctx.rotate(Math.atan2(dy, dx) * 0.15);
        ctx.globalAlpha = 0.7;
        const bg = ctx.createLinearGradient(-8, 0, 8, 0);
        bg.addColorStop(0, "rgba(90,255,200,1)");
        bg.addColorStop(1, "rgba(80,190,255,1)");
        ctx.strokeStyle = bg; ctx.lineWidth = 1.8; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(8, 0); ctx.stroke();
        ctx.globalAlpha = 0.3 + wa * 0.35;
        ctx.fillStyle = "rgba(200,245,255,0.95)";
        ctx.beginPath(); ctx.ellipse(-1, -3, 6, 1.8 * wa + 0.5, -0.3, 0, 6.28); ctx.fill();
        ctx.beginPath(); ctx.ellipse(-1, 3, 6, 1.8 * wa + 0.5, 0.3, 0, 6.28); ctx.fill();
        ctx.restore();
      }

      /* ── светлячки ── */
      for (const fl of fireflies) {
        fl.phase += 0.012 * fl.speed * 4;
        const fx = fl.ax + Math.sin(fl.phase) * 55 + Math.sin(fl.phase * 0.37) * 25;
        const fy = fl.ay + Math.cos(fl.phase * 0.8) * 35;
        const glow = 0.5 + Math.sin(fl.phase * 2.6) * 0.5;
        ctx.save();
        ctx.globalAlpha = 0.25 + glow * 0.55;
        const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, 14);
        g.addColorStop(0, `hsla(${fl.hue},100%,75%,0.95)`);
        g.addColorStop(0.4, `hsla(${fl.hue},100%,65%,0.3)`);
        g.addColorStop(1, `hsla(${fl.hue},100%,60%,0)`);
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(fx, fy, 14, 0, 6.28); ctx.fill();
        ctx.globalAlpha = 0.5 + glow * 0.5;
        ctx.fillStyle = `hsla(${fl.hue},100%,88%,1)`;
        ctx.beginPath(); ctx.arc(fx, fy, fl.r * 0.8, 0, 6.28); ctx.fill();
        ctx.restore();
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
        // прожилка
        ctx.globalAlpha = l.op * 0.55;
        ctx.strokeStyle = `hsla(${l.hue},${l.sat}%,${l.light + 22}%,0.9)`;
        ctx.lineWidth = 0.7;
        ctx.beginPath(); ctx.moveTo(-l.size, 0); ctx.lineTo(l.size, 0); ctx.stroke();
        ctx.restore();
      }

      /* ── семена одуванчика ── */
      for (const sd of seeds) {
        sd.phase += 0.01;
        sd.y -= sd.vy;
        sd.x += Math.sin(sd.phase * 3) * 0.3;
        if (sd.y < -12) { sd.y = H + 12; sd.x = Math.random() * W; }
        ctx.save();
        ctx.translate(sd.x, sd.y);
        ctx.rotate(sd.phase);
        ctx.globalAlpha = sd.op;
        ctx.strokeStyle = "rgba(225,245,255,0.95)";
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(-2.8, 0); ctx.lineTo(2.8, 0);
        ctx.moveTo(0, -2.8); ctx.lineTo(0, 2.8);
        ctx.moveTo(-1.9, -1.9); ctx.lineTo(1.9, 1.9);
        ctx.moveTo(-1.9, 1.9); ctx.lineTo(1.9, -1.9);
        ctx.stroke();
        ctx.restore();
      }

      raf.current = requestAnimationFrame(loop);
    };

    loop();
    return () => { cancelAnimationFrame(raf.current); removeEventListener("resize", resize); };
  }, [isMobile]);

  if (isMobile) return null;

  return <canvas ref={ref} className="fixed inset-0 pointer-events-none" style={{ zIndex: 2 }} />;
}
