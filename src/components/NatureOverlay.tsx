"use client";

import { useEffect, useRef } from "react";
import useIsMobile from "@/hooks/useIsMobile";
import { createNatureWorld, type WorldHandle } from "./nature/world";

export default function NatureOverlay() {
  const isMobile = useIsMobile();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isMobile) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    let world: WorldHandle | null = null;

    world = createNatureWorld(canvas);

    return () => {
      world?.destroy();
    };
  }, [isMobile]);

  if (isMobile) return null;

  return <canvas ref={canvasRef} className="pointer-events-none fixed inset-0" style={{ zIndex: 2 }} />;
}
