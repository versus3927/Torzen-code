"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const TG = "https://t.me/versusire";

const links = [
  { href: "#services", label: "Услуги"  },
  { href: "#process",  label: "Подход"  },
  { href: "#portfolio",label: "Кейсы"   },
  { href: "#contact",  label: "Связь"   },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <motion.header
      initial={{ y: -50, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.85, ease: "easeOut" }}
      className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 md:px-6">

        {/* Logo */}
        <a href="#" className="relative z-50 flex items-center gap-3 no-underline">
          <motion.span whileHover={{ scale: 1.08 }}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/14 bg-black/60 text-sm font-semibold text-white backdrop-blur">
            T
          </motion.span>
          <div className="leading-none">
            <div className="text-sm font-bold uppercase tracking-[0.28em] text-white">Torzen Code</div>
            <div className="mt-0.5 text-[10px] uppercase tracking-[0.34em] text-white/35">cinematic fullstack studio</div>
          </div>
        </a>

        {/* Desktop nav pill */}
        <div className={`hidden md:flex items-center gap-1 rounded-full border px-3 py-2 transition-all duration-500 ${
          scrolled
            ? "border-white/10 bg-black/80 shadow-[0_8px_32px_rgba(0,0,0,0.5)] backdrop-blur-xl"
            : "border-white/8  bg-black/30 backdrop-blur-md"
        }`}>
          {links.map(link => (
            <a key={link.href} href={link.href}
              className="rounded-full px-4 py-2 text-sm text-white/50 no-underline transition hover:bg-white/7 hover:text-white">
              {link.label}
            </a>
          ))}
          <motion.a href={TG} target="_blank" rel="noopener noreferrer"
            whileHover={{ scale: 1.04, y: -1 }} whileTap={{ scale: 0.96 }}
            className="ml-2 rounded-full border border-white/30 bg-white px-5 py-2 text-sm font-semibold text-black no-underline transition hover:bg-white/90">
            Написать ↗
          </motion.a>
        </div>
      </div>
    </motion.header>
  );
}
