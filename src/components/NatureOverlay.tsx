"use client";

import { useEffect, useRef, useState } from "react";
import useIsMobile from "@/hooks/useIsMobile";
import { createNatureWorld, type WorldHandle } from "./nature/world";

export default function NatureOverlay() {
  const isMobile = useIsMobile();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const [label, setLabel] = useState<string | null>(null);
  const [hintOpen, setHintOpen] = useState(true);

  useEffect(() => {
    if (isMobile) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let world: WorldHandle | null = null;

    // курсор-подсказка двигается напрямую через DOM — без ререндеров
    const move = (e: PointerEvent) => {
      const el = tipRef.current;
      if (el) el.style.transform = `translate3d(${e.clientX + 16}px, ${e.clientY - 34}px, 0)`;
    };
    window.addEventListener("pointermove", move, { passive: true });

    world = createNatureWorld(canvas, {
      onHover: (l) => setLabel(l),
      onInteract: () => setHintOpen(false),
    });

    const hintTimer = window.setTimeout(() => setHintOpen(false), 16000);

    return () => {
      world?.destroy();
      window.removeEventListener("pointermove", move);
      window.clearTimeout(hintTimer);
    };
  }, [isMobile]);

  if (isMobile) return null;

  return (
    <>
      <canvas ref={canvasRef} className="pointer-events-none fixed inset-0" style={{ zIndex: 2 }} />

      {/* Название объекта под курсором */}
      <div
        ref={tipRef}
        className="pointer-events-none fixed left-0 top-0 z-[60] will-change-transform"
        aria-hidden="true"
      >
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/90 backdrop-blur-md transition-all duration-200 ${
            label ? "scale-100 opacity-100" : "scale-90 opacity-0"
          }`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
          {label ?? ""}
        </span>
      </div>

      {/* Подсказка про интерактив */}
      <div
        className={`pointer-events-none fixed bottom-6 left-6 z-[55] transition-all duration-700 ${
          hintOpen ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"
        }`}
        aria-hidden="true"
      >
        <div className="flex items-center gap-3 rounded-full border border-white/12 bg-black/70 px-4 py-2.5 backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300/70" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-300" />
          </span>
          <span className="text-[11px] uppercase tracking-[0.24em] text-white/60">
            Мир живой — кликай по деревьям, зверям и воде
          </span>
        </div>
      </div>
    </>
  );
}
