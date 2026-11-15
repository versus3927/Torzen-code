"use client";

import { useEffect, useRef } from "react";
import useIsMobile from "@/hooks/useIsMobile";

/* ───────────────────────────── types ───────────────────────────── */

interface Leaf    { x: number; y: number; vx: number; vy: number; rot: number; rs: number; size: number; op: number; hue: number }
interface Bird    { x: number; y: number; vx: number; phase: number; size: number; op: number }
interface Deer    { x: number; vx: number; dir: 1 | -1; legPhase: number; size: number; op: number }
interface Cloud   { x: number; y: number; r: number; vx: number; puffs: { dx: number; dy: number; r: number }[]; op: number }
interface Ridge   { pts: { x: number; y: number }[]; drift: number; speed: number; base: number; amp: number }
interface Flow    { x: number; lane: number; len: number; vx: number; op: number }
interface Ripple  { x: number; y: number; r: number; max: number; op: number }
interface Splash  { x: number; y: number; vx: number; vy: number; life: number }
interface Fish    { state: "idle" | "jump"; t: number; next: number; x0: number; x1: number; h: number; lane: number }
interface Shadow  { x: number; lane: number; vx: number; len: number; op: number }
interface Blade   { x: number; h: number; lean: number; phase: number; op: number }
interface Firefly { x: number; y: number; ax: number; ay: number; phase: number; speed: number; r: number }
interface Flutter { x: number; y: number; ax: number; ay: number; phase: number; vx: number; hue: number }
interface Bunny   { x: number; dir: 1 | -1; hop: number; pause: number; size: number }
interface Fox     { x: number; dir: 1 | -1; phase: number; size: number }
interface Seed    { x: number; y: number; vy: number; phase: number; op: number }
interface Star    { x: number; y: number; r: number; phase: number; speed: number }
interface Meteor  { active: boolean; x: number; y: number; vx: number; vy: number; life: number; next: number }
interface Mist    { y: number; w: number; x: number; vx: number; op: number }

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

    // Листья
    const leaves: Leaf[] = Array.from({ length: 22 }, () => ({
      x: rand(0, c.width), y: rand(0, c.height),
      vx: rand(-0.15, 0.15), vy: rand(0.1, 0.35),
      rot: rand(0, 6.28), rs: rand(-0.0075, 0.0075),
      size: rand(3, 8), op: rand(0.08, 0.2), hue: rand(90, 130),
    }));

    // Птицы (стая)
    const birds: Bird[] = Array.from({ length: 6 }, (_, i) => ({
      x: -100 - i * rand(180, 420), y: rand(50, 230),
      vx: rand(0.3, 0.6), phase: rand(0, 6.28),
      size: rand(8, 13), op: rand(0.12, 0.24),
    }));

    // Орёл — кружит высоко
    const eagle = { cx: c.width * 0.7, cy: 130, r: 110, ang: rand(0, 6.28), speed: 0.0042, size: 1.4, drift: rand(0.04, 0.07) };

    // Олени
    const deer: Deer[] = [
      { x: c.width * 0.15, vx: 0.15, dir: 1,  legPhase: 0,   size: 1,   op: 0.16 },
      { x: c.width * 0.75, vx: 0.12, dir: -1, legPhase: 1.5, size: 0.7, op: 0.12 },
      { x: c.width * 0.45, vx: 0.1,  dir: 1,  legPhase: 3.1, size: 0.5, op: 0.1  },
    ];

    // Заяц
    const bunny: Bunny = { x: c.width * 0.3, dir: 1, hop: 0, pause: 120, size: 0.85 };

    // Лиса
    const fox: Fox = { x: -80, dir: 1, phase: 0, size: 0.9 };

    // Бабочки
    const flutters: Flutter[] = Array.from({ length: 3 }, (_, i) => ({
      x: rand(0, c.width), y: rand(0, c.height),
      ax: rand(100, c.width - 100), ay: rand(c.height * 0.3, c.height * 0.8),
      phase: i * 2.1, vx: rand(0.2, 0.45), hue: rand(40, 70),
    }));

    // Стрекоза
    const dragonfly = { x: c.width * 0.5, y: c.height * 0.6, tx: c.width * 0.5, ty: c.height * 0.6, wing: 0 };

    // Светлячки
    const fireflies: Firefly[] = Array.from({ length: 10 }, () => ({
      x: rand(0, c.width), y: rand(0, c.height),
      ax: rand(0, c.width), ay: rand(c.height * 0.35, c.height * 0.95),
      phase: rand(0, 6.28), speed: rand(0.2, 0.5), r: rand(1.2, 2.2),
    }));

    // Семена одуванчика
    const seeds: Seed[] = Array.from({ length: 12 }, () => ({
      x: rand(0, c.width), y: rand(0, c.height),
      vy: rand(0.06, 0.18), phase: rand(0, 6.28), op: rand(0.06, 0.16),
    }));

    // Мерцающие звёзды
    const stars: Star[] = Array.from({ length: 16 }, () => ({
      x: rand(0, c.width), y: rand(0, c.height * 0.45),
      r: rand(0.5, 1.4), phase: rand(0, 6.28), speed: rand(0.008, 0.03),
    }));

    // Падающая звезда
    const meteor: Meteor = { active: false, x: 0, y: 0, vx: 0, vy: 0, life: 0, next: 400 };

    // Облака
    const clouds: Cloud[] = Array.from({ length: 4 }, (_, i) => {
      const r = rand(60, 130);
      return {
        x: rand(-200, c.width + 200), y: rand(40, c.height * 0.3),
        r, vx: rand(0.08, 0.2) * (i % 2 === 0 ? 1 : 1.4),
        op: rand(0.025, 0.05),
        puffs: Array.from({ length: 4 }, () => ({ dx: rand(-r, r), dy: rand(-r * 0.28, r * 0.28), r: rand(r * 0.5, r) })),
      };
    });

    // Горные хребты (предрассчитанные пики, дрейфуют)
    const makeRidge = (baseRatio: number, amp: number, speed: number): Ridge => {
      const pts: { x: number; y: number }[] = [];
      const n = 9;
      for (let i = 0; i <= n; i++) {
        pts.push({ x: (i / n) * 1.3 - 0.15, y: rand(-1, -0.25) * amp * rand(0.5, 1) });
      }
      return { pts, drift: rand(0, 100), speed, base: baseRatio, amp };
    };
    const ridgeFar  = makeRidge(0.78, 0.16, 0.006);
    const ridgeNear = makeRidge(0.9, 0.1, 0.011);

    // Полосы тумана
    const mists: Mist[] = Array.from({ length: 3 }, (_, i) => ({
      y: rand(0.78, 0.92), w: rand(0.35, 0.6),
      x: rand(0, 1), vx: rand(0.0004, 0.0011) * (i % 2 ? 1 : -1), op: rand(0.025, 0.05),
    }));

    // Ручеёк: бегущие штрихи потока
    const flows: Flow[] = Array.from({ length: 26 }, () => ({
      x: rand(0, c.width), lane: rand(0.93, 0.985),
      len: rand(18, 60), vx: rand(0.6, 1.6), op: rand(0.05, 0.14),
    }));

    // Тени рыб под водой
    const shadows: Shadow[] = [
      { x: rand(0, c.width), lane: 0.955, vx: 0.5,  len: 26, op: 0.09 },
      { x: rand(0, c.width), lane: 0.975, vx: -0.4, len: 18, op: 0.07 },
    ];

    // Круги на воде + брызги
    const ripples: Ripple[] = [];
    const splashes: Splash[] = [];
    let nextRipple = 100;

    // Выпрыгивающая рыба
    const fish: Fish = { state: "idle", t: 0, next: 260, x0: 0, x1: 0, h: 46, lane: 0.95 };

    // Трава вдоль ручья и луга
    const blades: Blade[] = Array.from({ length: 90 }, (_, i) => {
      const nearStream = i < 60;
      return {
        x: rand(0, 1),
        h: nearStream ? rand(8, 22) : rand(6, 14),
        lean: rand(-0.3, 0.3), phase: rand(0, 6.28),
        op: nearStream ? rand(0.1, 0.2) : rand(0.05, 0.1),
      };
    });

    /* ─────────────── helpers ─────────────── */

    const drawEdge = (side: "l" | "r", W: number, H: number) => {
      const t = Date.now() * 0.0003;
      const dir = side === "l" ? 1 : -1;
      const base = side === "l" ? 0 : W;
      const spots = [
        { yR: 0.1, r: 180, g: 48, a: 0.14, ph: 0 },
        { yR: 0.4, r: 200, g: 55, a: 0.12, ph: 1.5 },
        { yR: 0.7, r: 170, g: 45, a: 0.13, ph: 3 },
      ];
      spots.forEach(s => {
        const cx = base + dir * 35 + Math.sin(t + s.ph) * 12;
        const cy = H * s.yR;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, s.r);
        g.addColorStop(0, `rgba(22,${s.g},8,${s.a})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(side === "l" ? 0 : W - s.r * 2, cy - s.r, s.r * 2, s.r * 2);
      });
    };

    // плавный хребет через quadratic-кривые
    const drawRidge = (r: Ridge, W: number, H: number, colFar: boolean, t: number) => {
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
      if (colFar) {
        g.addColorStop(0, "rgba(150,190,160,0.055)");
        g.addColorStop(1, "rgba(150,190,160,0.008)");
      } else {
        g.addColorStop(0, "rgba(120,165,135,0.085)");
        g.addColorStop(1, "rgba(120,165,135,0.015)");
      }
      ctx.fillStyle = g;
      ctx.fill();
      // снежные шапки на дальнем хребте
      if (colFar) {
        ctx.fillStyle = "rgba(255,255,255,0.03)";
        pts.forEach(p => {
          if (p.y < baseY - H * r.amp * 0.55) {
            ctx.beginPath();
            ctx.moveTo(p.x - 16, p.y + 18);
            ctx.lineTo(p.x, p.y);
            ctx.lineTo(p.x + 16, p.y + 18);
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
      const meadowY = H * 0.885;   // линия луга (животные)
      const streamTop = H * 0.92;  // верх ручья

      ctx.clearRect(0, 0, W, H);

      /* лёгкая полярная дымка */
      ctx.save();
      ctx.globalAlpha = 0.03 + Math.sin(t * 0.004) * 0.012;
      ctx.beginPath();
      for (let x = 0; x <= W; x += 40) {
        const y = H * 0.06 + Math.sin(x * 0.004 + t * 0.006) * 26 + Math.sin(x * 0.011 - t * 0.004) * 14;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      for (let x = W; x >= 0; x -= 40) {
        const y = H * 0.16 + Math.sin(x * 0.003 + t * 0.005 + 2) * 30;
        ctx.lineTo(x, y);
      }
      ctx.closePath();
      const ag = ctx.createLinearGradient(0, 0, 0, H * 0.22);
      ag.addColorStop(0, "rgba(120,220,170,0.5)");
      ag.addColorStop(1, "rgba(120,200,220,0)");
      ctx.fillStyle = ag;
      ctx.fill();
      ctx.restore();

      /* звёзды */
      for (const s of stars) {
        s.phase += s.speed;
        const a = 0.04 + Math.abs(Math.sin(s.phase)) * 0.16;
        ctx.globalAlpha = a;
        ctx.fillStyle = "rgba(255,255,255,0.9)";
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, 6.28);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      /* падающая звезда */
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
        if (meteor.life <= 0) { meteor.active = false; meteor.next = tick + rand(360, 780); }
        else {
          ctx.save();
          ctx.globalAlpha = meteor.life * 0.5;
          const mg = ctx.createLinearGradient(meteor.x, meteor.y, meteor.x - meteor.vx * 14, meteor.y - meteor.vy * 14);
          mg.addColorStop(0, "rgba(255,255,255,0.9)");
          mg.addColorStop(1, "rgba(255,255,255,0)");
          ctx.strokeStyle = mg; ctx.lineWidth = 1.4; ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(meteor.x, meteor.y);
          ctx.lineTo(meteor.x - meteor.vx * 14, meteor.y - meteor.vy * 14);
          ctx.stroke();
          ctx.restore();
        }
      }

      /* облака */
      for (const cl of clouds) {
        cl.x += cl.vx;
        if (cl.x - cl.r * 2 > W) { cl.x = -cl.r * 2.5; cl.y = rand(40, H * 0.3); }
        ctx.save();
        ctx.globalAlpha = cl.op;
        ctx.fillStyle = "rgba(210,225,215,1)";
        for (const p of cl.puffs) {
          ctx.beginPath();
          ctx.ellipse(cl.x + p.dx, cl.y + p.dy + Math.sin(t * 0.004 + p.dx) * 2, p.r, p.r * 0.45, 0, 0, 6.28);
          ctx.fill();
        }
        ctx.restore();
      }

      /* боковые зелёные свечения (как было) */
      drawEdge("l", W, H);
      drawEdge("r", W, H);

      /* горы */
      drawRidge(ridgeFar, W, H, true, t);
      drawRidge(ridgeNear, W, H, false, t);

      /* туман у подножия */
      for (const m of mists) {
        m.x += m.vx;
        if (m.x > 1.3) m.x = -0.3;
        if (m.x < -0.3) m.x = 1.3;
        ctx.save();
        ctx.globalAlpha = m.op * (0.75 + Math.sin(t * 0.003 + m.w) * 0.25);
        const mg = ctx.createLinearGradient(m.x * W - m.w * W * 0.5, 0, m.x * W + m.w * W * 0.5, 0);
        mg.addColorStop(0, "rgba(190,215,200,0)");
        mg.addColorStop(0.5, "rgba(190,215,200,1)");
        mg.addColorStop(1, "rgba(190,215,200,0)");
        ctx.fillStyle = mg;
        ctx.fillRect(m.x * W - m.w * W * 0.5, H * m.y, m.w * W, 14);
        ctx.restore();
      }

      /* птицы */
      for (const b of birds) {
        b.x += b.vx; b.phase += 0.05;
        b.y += Math.sin(b.phase * 0.2) * 0.2;
        if (b.x > W + 120) { b.x = -100; b.y = rand(40, 240); }
        const flap = Math.sin(b.phase) * 5;
        ctx.save(); ctx.translate(b.x, b.y); ctx.globalAlpha = b.op;
        ctx.strokeStyle = "rgba(255,255,255,0.5)"; ctx.lineWidth = 1; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(-b.size, 0);
        ctx.quadraticCurveTo(-b.size * 0.4, -flap, 0, 0);
        ctx.quadraticCurveTo(b.size * 0.4, -flap, b.size, 0);
        ctx.stroke(); ctx.restore();
      }

      /* орёл — кружит */
      {
        eagle.ang += eagle.speed;
        eagle.cx += eagle.drift;
        if (eagle.cx > W + 200) eagle.cx = -200;
        const ex = eagle.cx + Math.cos(eagle.ang) * eagle.r;
        const ey = eagle.cy + Math.sin(eagle.ang) * eagle.r * 0.35;
        const bank = Math.sin(eagle.ang);
        const ws = 16 * eagle.size;
        ctx.save();
        ctx.translate(ex, ey);
        ctx.scale(Math.cos(eagle.ang) >= 0 ? 1 : -1, 1);
        ctx.globalAlpha = 0.22;
        ctx.strokeStyle = "rgba(255,255,255,0.55)";
        ctx.lineWidth = 1.3; ctx.lineCap = "round";
        const wob = Math.sin(t * 0.05) * 1.5;
        ctx.beginPath();
        ctx.moveTo(-ws, wob * bank);
        ctx.quadraticCurveTo(-ws * 0.45, -7 - wob, 0, 0);
        ctx.quadraticCurveTo(ws * 0.45, -7 - wob, ws, wob * bank);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(0, 0, 4, 2, 0, 0, 6.28);
        ctx.fillStyle = "rgba(255,255,255,0.5)";
        ctx.fill();
        ctx.restore();
      }

      /* олени */
      for (const d of deer) {
        d.x += d.vx * d.dir; d.legPhase += 0.03;
        if (d.dir === 1 && d.x > W + 50) d.x = -50;
        if (d.dir === -1 && d.x < -50) d.x = W + 50;
        const s = d.size * 26;
        const gy = meadowY + Math.sin(t * 0.01 + d.x * 0.01) * 1.5;
        const leg = Math.sin(d.legPhase) * 3.5 * d.size;
        ctx.save(); ctx.translate(d.x, gy); ctx.scale(d.dir, 1); ctx.globalAlpha = d.op;
        const col = "rgba(255,255,255,0.55)";
        ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 1.2 * d.size; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(s*0.3,-s*0.14); ctx.lineTo(s*0.3+leg,0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(s*0.34,-s*0.16); ctx.lineTo(s*0.34-leg,0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-s*0.26,-s*0.14); ctx.lineTo(-s*0.26-leg,0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-s*0.22,-s*0.16); ctx.lineTo(-s*0.22+leg,0); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(0,-s*0.3,s*0.4,s*0.16,0,0,6.28); ctx.fill();
        ctx.beginPath(); ctx.moveTo(s*0.35,-s*0.36); ctx.quadraticCurveTo(s*0.45,-s*0.65,s*0.5,-s*0.74); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(s*0.52,-s*0.78,s*0.09,s*0.06,0.3,0,6.28); ctx.fill();
        ctx.lineWidth = 0.8 * d.size;
        ctx.beginPath(); ctx.moveTo(s*0.54,-s*0.86); ctx.quadraticCurveTo(s*0.66,-s*1.1,s*0.64,-s*1.22); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(s*0.6,-s*1.06); ctx.lineTo(s*0.7,-s*1.1); ctx.stroke();
        ctx.restore();
      }

      /* заяц — скачет с паузами */
      {
        const b = bunny;
        if (b.pause > 0) {
          b.pause--;
          if (b.pause === 0) b.dir = Math.random() > 0.5 ? 1 : -1;
        } else {
          b.hop += 0.09;
          b.x += b.dir * 1.7;
          if (b.hop > Math.PI) { b.hop = 0; if (Math.random() < 0.3) b.pause = Math.floor(rand(80, 220)); }
          if (b.x > W - 60) { b.dir = -1; }
          if (b.x < 60) { b.dir = 1; }
        }
        const jumpY = Math.abs(Math.sin(b.hop)) * 10;
        const s = 14 * b.size;
        const gy = meadowY + 4 - jumpY;
        const sit = b.pause > 0 ? 1 : 0;
        const earW = Math.sin(t * 0.06) * (sit ? 1.6 : 0.5);
        ctx.save(); ctx.translate(b.x, gy); ctx.scale(b.dir, 1); ctx.globalAlpha = 0.17;
        const col = "rgba(255,255,255,0.6)";
        ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 1.1; ctx.lineCap = "round";
        ctx.beginPath(); ctx.ellipse(0, -s * 0.45, s * 0.55, s * (0.38 + sit * 0.12), -0.25, 0, 6.28); ctx.fill();
        ctx.beginPath(); ctx.arc(s * 0.5, -s * 0.8, s * 0.26, 0, 6.28); ctx.fill();
        ctx.beginPath(); ctx.ellipse(s * 0.5 + earW, -s * 1.3, s * 0.07, s * 0.34, -0.15, 0, 6.28); ctx.fill();
        ctx.beginPath(); ctx.ellipse(s * 0.62 + earW, -s * 1.28, s * 0.06, s * 0.3, 0.15, 0, 6.28); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-s * 0.2, -s * 0.2); ctx.quadraticCurveTo(-s * 0.7, -s * 0.15, -s * 0.75, 0); ctx.stroke();
        ctx.beginPath(); ctx.arc(-s * 0.62, -s * 0.42, s * 0.13, 0, 6.28); ctx.fill();
        ctx.restore();
      }

      /* лиса — трусцой, хвост волной */
      {
        const f = fox;
        f.phase += 0.055;
        f.x += f.dir * 1.15;
        if (f.dir === 1 && f.x > W + 90) { f.dir = -1; }
        if (f.dir === -1 && f.x < -90) { f.dir = 1; }
        const s = 22 * f.size;
        const gy = meadowY + 10;
        const leg = Math.sin(f.phase) * 4.2 * f.size;
        const leg2 = Math.sin(f.phase + 3.14) * 4.2 * f.size;
        const tailW = Math.sin(t * 0.045) * 3;
        ctx.save(); ctx.translate(f.x, gy); ctx.scale(f.dir, 1); ctx.globalAlpha = 0.15;
        const col = "rgba(255,225,200,0.6)";
        ctx.fillStyle = col; ctx.strokeStyle = col; ctx.lineWidth = 1.4 * f.size; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(s * 0.32, -s * 0.16); ctx.lineTo(s * 0.32 + leg, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(s * 0.38, -s * 0.18); ctx.lineTo(s * 0.38 + leg2, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-s * 0.28, -s * 0.16); ctx.lineTo(-s * 0.28 + leg2, 0); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(-s * 0.34, -s * 0.18); ctx.lineTo(-s * 0.34 + leg, 0); ctx.stroke();
        ctx.beginPath(); ctx.ellipse(0, -s * 0.32, s * 0.48, s * 0.17, 0, 0, 6.28); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(s * 0.42, -s * 0.34);
        ctx.lineTo(s * 0.68, -s * 0.52);
        ctx.lineTo(s * 0.6, -s * 0.42);
        ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(s * 0.52, -s * 0.52); ctx.lineTo(s * 0.56, -s * 0.68); ctx.lineTo(s * 0.62, -s * 0.54);
        ctx.closePath(); ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-s * 0.44, -s * 0.34);
        ctx.quadraticCurveTo(-s * 0.85, -s * 0.5 + tailW, -s * 1.05, -s * 0.32 + tailW * 2);
        ctx.quadraticCurveTo(-s * 0.8, -s * 0.22 + tailW, -s * 0.44, -s * 0.18);
        ctx.closePath(); ctx.fill();
        ctx.restore();
      }

      /* ── ручеёк ── */
      {
        // тело воды
        const wg = ctx.createLinearGradient(0, streamTop, 0, H);
        wg.addColorStop(0, "rgba(140,190,200,0.05)");
        wg.addColorStop(1, "rgba(140,190,200,0.11)");
        ctx.fillStyle = wg;
        ctx.beginPath();
        ctx.moveTo(0, streamTop);
        for (let x = 0; x <= W; x += 24) {
          ctx.lineTo(x, streamTop + Math.sin(x * 0.012 + t * 0.02) * 2.4 + Math.sin(x * 0.03 - t * 0.013) * 1.6);
        }
        ctx.lineTo(W, H); ctx.lineTo(0, H);
        ctx.closePath(); ctx.fill();

        // бликовая линия поверхности
        ctx.save();
        ctx.globalAlpha = 0.16;
        ctx.strokeStyle = "rgba(220,245,250,0.7)";
        ctx.lineWidth = 1; ctx.lineCap = "round";
        ctx.beginPath();
        for (let x = 0; x <= W; x += 16) {
          const y = streamTop + Math.sin(x * 0.012 + t * 0.02) * 2.4 + Math.sin(x * 0.03 - t * 0.013) * 1.6;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.restore();

        // бегущие штрихи течения
        for (const fl of flows) {
          fl.x += fl.vx;
          if (fl.x - fl.len > W) { fl.x = -fl.len; fl.lane = rand(0.93, 0.985); }
          const fy = H * fl.lane + Math.sin(fl.x * 0.02 + t * 0.03) * 2;
          ctx.save();
          ctx.globalAlpha = fl.op * (0.6 + Math.sin(t * 0.04 + fl.lane * 40) * 0.4);
          ctx.strokeStyle = "rgba(210,240,245,0.8)";
          ctx.lineWidth = 1; ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(fl.x, fy);
          ctx.lineTo(fl.x + fl.len, fy);
          ctx.stroke();
          ctx.restore();
        }

        // тени рыб под водой
        for (const sh of shadows) {
          sh.x += sh.vx;
          if (sh.vx > 0 && sh.x > W + 40) sh.x = -40;
          if (sh.vx < 0 && sh.x < -40) sh.x = W + 40;
          ctx.save();
          ctx.globalAlpha = sh.op;
          ctx.fillStyle = "rgba(10,20,15,0.9)";
          ctx.beginPath();
          ctx.ellipse(sh.x, H * sh.lane, sh.len, 3.4, 0, 0, 6.28);
          ctx.fill();
          ctx.restore();
        }

        // самопроизвольные круги на воде
        if (tick > nextRipple) {
          nextRipple = tick + rand(90, 220);
          ripples.push({ x: rand(W * 0.05, W * 0.95), y: rand(streamTop + 6, H - 8), r: 2, max: rand(18, 34), op: 0.2 });
        }
        for (let i = ripples.length - 1; i >= 0; i--) {
          const rp = ripples[i];
          rp.r += 0.5; rp.op -= 0.0035;
          if (rp.op <= 0 || rp.r > rp.max) { ripples.splice(i, 1); continue; }
          ctx.save();
          ctx.globalAlpha = rp.op;
          ctx.strokeStyle = "rgba(220,245,250,0.8)";
          ctx.lineWidth = 0.8;
          ctx.beginPath();
          ctx.ellipse(rp.x, rp.y, rp.r, rp.r * 0.38, 0, 0, 6.28);
          ctx.stroke();
          ctx.restore();
        }

        // рыба выпрыгивает
        if (fish.state === "idle" && tick > fish.next) {
          fish.state = "jump"; fish.t = 0;
          fish.x0 = rand(W * 0.1, W * 0.8);
          fish.x1 = fish.x0 + rand(50, 110);
          fish.h = rand(34, 60);
          ripples.push({ x: fish.x0, y: H * 0.96, r: 3, max: 30, op: 0.28 });
          for (let i = 0; i < 6; i++) splashes.push({ x: fish.x0, y: H * 0.95, vx: rand(-1.4, 1.4), vy: rand(-2.6, -0.8), life: 1 });
        }
        if (fish.state === "jump") {
          fish.t += 0.024;
          if (fish.t >= 1) {
            fish.state = "idle"; fish.next = tick + rand(300, 700);
            ripples.push({ x: fish.x1, y: H * 0.96, r: 3, max: 34, op: 0.28 });
            for (let i = 0; i < 6; i++) splashes.push({ x: fish.x1, y: H * 0.95, vx: rand(-1.4, 1.4), vy: rand(-2.4, -0.8), life: 1 });
          } else {
            const ft = fish.t;
            const fx = fish.x0 + (fish.x1 - fish.x0) * ft;
            const fy = H * 0.955 - Math.sin(ft * Math.PI) * fish.h;
            const ang = Math.cos(ft * Math.PI) * 0.9;
            ctx.save();
            ctx.translate(fx, fy); ctx.rotate(-ang); ctx.globalAlpha = 0.3;
            ctx.fillStyle = "rgba(215,240,240,0.8)";
            ctx.beginPath();
            ctx.ellipse(0, 0, 8, 2.8, 0, 0, 6.28);
            ctx.fill();
            ctx.beginPath();
            ctx.moveTo(-7, 0); ctx.lineTo(-12, -3.4); ctx.lineTo(-12, 3.4);
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
          ctx.globalAlpha = sp.life * 0.35;
          ctx.fillStyle = "rgba(225,248,252,0.9)";
          ctx.beginPath();
          ctx.arc(sp.x, sp.y, 1.1, 0, 6.28);
          ctx.fill();
          ctx.restore();
        }
      }

      /* трава — качается на ветру */
      {
        ctx.save();
        ctx.lineWidth = 1; ctx.lineCap = "round";
        for (let i = 0; i < blades.length; i++) {
          const bl = blades[i];
          const nearStream = i < 60;
          const bx = bl.x * W;
          const by = nearStream ? streamTop + Math.sin(bx * 0.012 + t * 0.02) * 2.4 + 2 : meadowY + 6;
          const sway = Math.sin(t * 0.02 + bl.phase + bx * 0.008) * (2.2 + bl.h * 0.08) + bl.lean * 3;
          ctx.globalAlpha = bl.op;
          ctx.strokeStyle = nearStream ? "rgba(150,210,160,0.9)" : "rgba(150,205,160,0.7)";
          ctx.beginPath();
          ctx.moveTo(bx, by);
          ctx.quadraticCurveTo(bx + sway * 0.4, by - bl.h * 0.6, bx + sway, by - bl.h);
          ctx.stroke();
        }
        ctx.restore();
      }

      /* бабочки */
      for (const bf of flutters) {
        bf.phase += 0.016;
        bf.ax += bf.vx;
        if (bf.ax > W + 60) { bf.ax = -60; bf.ay = rand(H * 0.3, H * 0.8); }
        const bx = bf.ax + Math.sin(bf.phase * 2.2) * 40;
        const by = bf.ay + Math.cos(bf.phase * 1.7) * 30 + Math.sin(bf.phase * 5) * 6;
        const flap = Math.abs(Math.sin(bf.phase * 9));
        ctx.save();
        ctx.translate(bx, by);
        ctx.rotate(Math.sin(bf.phase * 2.2 + 1.5) * 0.5);
        ctx.globalAlpha = 0.2;
        ctx.fillStyle = `hsla(${bf.hue},60%,70%,0.9)`;
        ctx.beginPath(); ctx.ellipse(-3.4 * flap - 1, 0, 3.6 * flap + 0.6, 2.4, -0.45, 0, 6.28); ctx.fill();
        ctx.beginPath(); ctx.ellipse(3.4 * flap + 1, 0, 3.6 * flap + 0.6, 2.4, 0.45, 0, 6.28); ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.8)";
        ctx.fillRect(-0.7, -2.8, 1.4, 5.6);
        ctx.restore();
      }

      /* стрекоза — зависает и перелетает */
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
        ctx.globalAlpha = 0.22;
        ctx.strokeStyle = "rgba(200,235,255,0.9)";
        ctx.lineWidth = 1; ctx.lineCap = "round";
        ctx.beginPath(); ctx.moveTo(-7, 0); ctx.lineTo(7, 0); ctx.stroke();
        ctx.globalAlpha = 0.1 + wa * 0.1;
        ctx.fillStyle = "rgba(210,240,255,0.9)";
        ctx.beginPath(); ctx.ellipse(-1, -2.6, 5, 1.5 * wa + 0.4, -0.3, 0, 6.28); ctx.fill();
        ctx.beginPath(); ctx.ellipse(-1, 2.6, 5, 1.5 * wa + 0.4, 0.3, 0, 6.28); ctx.fill();
        ctx.restore();
      }

      /* светлячки */
      for (const fl of fireflies) {
        fl.phase += 0.012 * fl.speed * 4;
        const fx = fl.ax + Math.sin(fl.phase) * 55 + Math.sin(fl.phase * 0.37) * 25;
        const fy = fl.ay + Math.cos(fl.phase * 0.8) * 35;
        const glow = 0.5 + Math.sin(fl.phase * 2.6) * 0.5;
        ctx.save();
        ctx.globalAlpha = 0.05 + glow * 0.16;
        const g = ctx.createRadialGradient(fx, fy, 0, fx, fy, 9);
        g.addColorStop(0, "rgba(225,255,180,0.9)");
        g.addColorStop(1, "rgba(225,255,180,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.arc(fx, fy, 9, 0, 6.28); ctx.fill();
        ctx.globalAlpha = 0.25 + glow * 0.5;
        ctx.fillStyle = "rgba(235,255,190,1)";
        ctx.beginPath(); ctx.arc(fx, fy, fl.r * 0.7, 0, 6.28); ctx.fill();
        ctx.restore();
      }

      /* листья */
      for (const l of leaves) {
        l.x += l.vx; l.y += l.vy; l.rot += l.rs;
        if (l.y > H + 15) { l.y = -15; l.x = Math.random() * W; }
        ctx.save();
        ctx.translate(l.x, l.y); ctx.rotate(l.rot); ctx.globalAlpha = l.op;
        ctx.beginPath();
        ctx.moveTo(l.size, 0);
        ctx.quadraticCurveTo(0, -l.size * 0.5, -l.size, 0);
        ctx.quadraticCurveTo(0, l.size * 0.5, l.size, 0);
        ctx.fillStyle = `hsla(${l.hue},50%,30%,0.7)`;
        ctx.fill();
        ctx.restore();
      }

      /* семена одуванчика */
      for (const sd of seeds) {
        sd.phase += 0.01;
        sd.y -= sd.vy;
        sd.x += Math.sin(sd.phase * 3) * 0.3;
        if (sd.y < -12) { sd.y = H + 12; sd.x = Math.random() * W; }
        ctx.save();
        ctx.translate(sd.x, sd.y);
        ctx.rotate(sd.phase);
        ctx.globalAlpha = sd.op;
        ctx.strokeStyle = "rgba(255,255,255,0.85)";
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(-2.4, 0); ctx.lineTo(2.4, 0);
        ctx.moveTo(0, -2.4); ctx.lineTo(0, 2.4);
        ctx.moveTo(-1.6, -1.6); ctx.lineTo(1.6, 1.6);
        ctx.moveTo(-1.6, 1.6); ctx.lineTo(1.6, -1.6);
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
