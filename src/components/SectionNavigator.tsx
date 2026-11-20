"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from "react";
import useIsMobile from "@/hooks/useIsMobile";
import { usePageTransition } from "@/components/PageTransition";

const SECTIONS = ["hero","about","services","stats","process","portfolio","faq","cta","contact"];

export default function SectionNavigator() {
  const isMobile = useIsMobile();
  const { navigate } = usePageTransition();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [visible, setVisible] = useState(false);

  const sync = useCallback(() => {
    setVisible(window.scrollY > window.innerHeight * 0.3);
    const mid = window.scrollY + window.innerHeight * 0.4;
    let best = 0;
    let bestDist = Infinity;
    SECTIONS.forEach((id, i) => {
      const el = document.getElementById(id);
      if (!el) return;
      const d = Math.abs(el.getBoundingClientRect().top - Math.min(window.innerHeight * 0.3, 220));
      if (el.getBoundingClientRect().bottom > 80 && d < bestDist) {
        bestDist = d;
        best = i;
      }
      if (el.offsetTop <= mid) best = i;
    });
    setCurrentIndex(best);
  }, []);

  useEffect(() => {
    if (isMobile) return;
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    return () => window.removeEventListener("scroll", sync);
  }, [isMobile, sync]);

  const goTo = (dir: 1 | -1) => {
    const clamped = Math.max(0, Math.min(SECTIONS.length - 1, currentIndex + dir));
    navigate(SECTIONS[clamped] ?? "hero");
  };

  const jumpTo = (i: number) => navigate(SECTIONS[i] ?? "hero");

  if (isMobile) return null;

  const isFirst = currentIndex === 0;
  const isLast  = currentIndex === SECTIONS.length - 1;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 24 }}
          transition={{ duration: 0.4 }}
          className="fixed right-5 top-1/2 z-40 flex -translate-y-1/2 flex-col items-center gap-3"
        >
          {/* Имя текущей секции */}
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-1 text-center"
          >
            <span className="text-[9px] uppercase tracking-[0.25em] text-white/25 leading-none">
              {SECTIONS[currentIndex]}
            </span>
          </motion.div>

          {/* Точки */}
          <div className="flex flex-col items-center gap-[5px] py-1">
            {SECTIONS.map((id, i) => (
              <button key={id} onClick={() => jumpTo(i)} aria-label={id}>
                <motion.span
                  animate={{
                    width:           i === currentIndex ? 5  : 4,
                    height:          i === currentIndex ? 16 : 4,
                    backgroundColor: i === currentIndex ? "rgba(255,255,255,0.8)" : "rgba(255,255,255,0.18)",
                    borderRadius:    999,
                  }}
                  transition={{ type: "spring", stiffness: 380, damping: 28 }}
                  className="block"
                />
              </button>
            ))}
          </div>


        </motion.div>
      )}
    </AnimatePresence>
  );
}
