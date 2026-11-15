"use client";

import { useEffect, useRef } from "react";
import useIsMobile from "@/hooks/useIsMobile";

export default function ParticleBackground() {
  const isMobile = useIsMobile();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Полностью выключаем canvas на мобильных
    if (isMobile) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Меньше частиц, нет линий между ними
    const COUNT = 70;
    const HUES = [160, 190, 275, 45, 330, 120];
    const particles = Array.from({ length: COUNT }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.08,
      vy: Math.random() * 0.12 + 0.02,
      size: Math.random() * 1.8 + 0.5,
      opacity: Math.random() * 0.4 + 0.18,
      hue: HUES[Math.floor(Math.random() * HUES.length)],
      phase: Math.random() * 6.28,
    }));

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.y > canvas.height + 5) { p.y = -5; p.x = Math.random() * canvas.width; }
        if (p.x < -5) p.x = canvas.width + 5;
        if (p.x > canvas.width + 5) p.x = -5;

        p.phase += 0.02;
        const tw = 0.6 + Math.sin(p.phase) * 0.4;

        // цветное гало
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 6);
        g.addColorStop(0, `hsla(${p.hue},95%,72%,${p.opacity * tw * 0.8})`);
        g.addColorStop(1, `hsla(${p.hue},95%,65%,0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 6, 0, 6.28);
        ctx.fill();

        // ядро
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, 6.28);
        ctx.fillStyle = `hsla(${p.hue},90%,88%,${p.opacity * tw})`;
        ctx.fill();
      }

      raf = requestAnimationFrame(animate);
    };

    animate();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, [isMobile]);

  if (isMobile) return null;

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" style={{ zIndex: 0 }} />;
}
