"use client";

import useIsMobile from "@/hooks/useIsMobile";

export default function MobileNature() {
  const isMobile = useIsMobile();
  if (!isMobile) return null;

  return (
    <div className="mobile-nature" aria-hidden="true">
      {/* Чистое тёмное небо: статичный CSS-градиент без canvas и blur */}
      <div className="mn-sky" />

      {/* Облегчённый спутник: один SVG, анимируется только transform */}
      <svg className="mn-satellite" viewBox="0 0 112 52" fill="none">
        <path d="M42 26H15M70 26H97" stroke="rgba(205,220,232,.72)" strokeWidth="1.4" />
        <rect x="2" y="16" width="39" height="20" rx="1.5" fill="#123c70" stroke="rgba(95,180,225,.7)" />
        <rect x="71" y="16" width="39" height="20" rx="1.5" fill="#123c70" stroke="rgba(95,180,225,.7)" />
        <path d="M10 16V36M18 16V36M26 16V36M34 16V36M79 16V36M87 16V36M95 16V36M103 16V36M2 26H41M71 26H110" stroke="rgba(115,185,225,.42)" strokeWidth=".7" />
        <rect x="42" y="17" width="28" height="18" rx="3" fill="#7b8b9b" stroke="rgba(235,242,245,.72)" />
        <rect x="45" y="20" width="9" height="12" rx="1" fill="#c59035" />
        <circle cx="63" cy="25" r="2" fill="#73e4e1" />
        <path d="M56 17V10M48 7C51 14 61 14 64 7M56 7V3" stroke="rgba(225,235,240,.8)" strokeWidth="1.2" strokeLinecap="round" />
      </svg>

      {/* Одна небольшая ракета с CSS-выхлопом */}
      <svg className="mn-rocket" viewBox="0 0 82 34" fill="none">
        <path d="M22 12L8 17L22 22" fill="url(#mn-flame)" />
        <path d="M20 10H55C64 10 72 13 77 17C72 21 64 24 55 24H20V10Z" fill="url(#mn-body)" />
        <path d="M28 10L18 3H39L43 10M28 24L18 31H39L43 24" fill="#b83f38" />
        <rect x="50" y="10" width="7" height="14" fill="#b83f38" opacity=".9" />
        <circle cx="64" cy="17" r="3.2" fill="#67c8e8" stroke="rgba(230,250,255,.8)" />
        <defs>
          <linearGradient id="mn-flame" x1="8" y1="17" x2="24" y2="17" gradientUnits="userSpaceOnUse">
            <stop stopColor="#448bd9" stopOpacity="0" /><stop offset=".55" stopColor="#6cd7ef" /><stop offset="1" stopColor="#ffd89a" />
          </linearGradient>
          <linearGradient id="mn-body" x1="40" y1="10" x2="40" y2="24" gradientUnits="userSpaceOnUse">
            <stop stopColor="#f1f4f5" /><stop offset=".5" stopColor="#abb8c3" /><stop offset="1" stopColor="#536273" />
          </linearGradient>
        </defs>
      </svg>



      {/* ── Летящие птицы ── */}
      <svg className="mn-bird mn-bird-1" viewBox="0 0 36 14" fill="none">
        <path d="M0 7 Q5 2 10 7 Q15 12 18 7 Q21 2 26 7 Q31 12 36 7" stroke="rgba(255,255,255,0.4)" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
      </svg>
      <svg className="mn-bird mn-bird-2" viewBox="0 0 28 10" fill="none">
        <path d="M0 5 Q4 1 8 5 Q11 9 14 5 Q17 1 20 5 Q23 9 28 5" stroke="rgba(255,255,255,0.3)" strokeWidth="1" strokeLinecap="round" fill="none"/>
      </svg>
      <svg className="mn-bird mn-bird-3" viewBox="0 0 22 8" fill="none">
        <path d="M0 4 Q3 1 6 4 Q8 7 11 4 Q13 1 16 4 Q18 7 22 4" stroke="rgba(255,255,255,0.25)" strokeWidth="0.9" strokeLinecap="round" fill="none"/>
      </svg>

      {/* ── Падающие листья ── */}
      <svg className="mn-leaf mn-leaf-1" viewBox="0 0 14 10" fill="none">
        <path d="M7 1 Q12 0 13 5 Q14 10 7 9 Q0 10 1 5 Q2 0 7 1Z" fill="#2a6a1a" opacity="0.55"/>
        <path d="M7 1 L7 9" stroke="#3a8a24" strokeWidth="0.6" opacity="0.6"/>
      </svg>
      <svg className="mn-leaf mn-leaf-2" viewBox="0 0 12 9" fill="none">
        <path d="M6 0 Q11 0 12 5 Q11 9 6 9 Q1 9 0 5 Q1 0 6 0Z" fill="#1e5212" opacity="0.5"/>
        <path d="M6 0 L6 9" stroke="#2d7a1c" strokeWidth="0.6" opacity="0.5"/>
      </svg>
      <svg className="mn-leaf mn-leaf-3" viewBox="0 0 11 8" fill="none">
        <path d="M5.5 0 Q10 0 10 4 Q10 8 5.5 8 Q1 8 1 4 Q1 0 5.5 0Z" fill="#234f10" opacity="0.45"/>
      </svg>
      <svg className="mn-leaf mn-leaf-4" viewBox="0 0 13 10" fill="none">
        <path d="M6.5 0 Q12 0 13 5 Q12 10 6.5 10 Q1 10 0 5 Q1 0 6.5 0Z" fill="#2a6a1a" opacity="0.5"/>
        <path d="M6.5 0 L6.5 10" stroke="#3a8a24" strokeWidth="0.6" opacity="0.5"/>
      </svg>
      <svg className="mn-leaf mn-leaf-5" viewBox="0 0 10 8" fill="none">
        <path d="M5 0 Q9 0 9 4 Q9 8 5 8 Q1 8 1 4 Q1 0 5 0Z" fill="#1e5212" opacity="0.4"/>
      </svg>

      {/* ── Звёзды / светлячки ── */}
      {[
        {cx:"12%",cy:"8%",r:1.5,d:3.2},{cx:"84%",cy:"12%",r:1.2,d:4.1},
        {cx:"28%",cy:"5%",r:1,d:5.5},{cx:"68%",cy:"9%",r:1.3,d:2.8},
        {cx:"52%",cy:"4%",r:0.9,d:6.2},{cx:"40%",cy:"11%",r:1.1,d:3.9},
        {cx:"76%",cy:"6%",r:0.8,d:4.8},{cx:"20%",cy:"15%",r:1.4,d:3.5},
        {cx:"91%",cy:"5%",r:1,d:5.1},{cx:"6%",cy:"18%",r:0.9,d:4.4},
      ].map((s, i) => (
        <div key={i} className="mn-star" style={{
          left: s.cx, top: s.cy,
          width: s.r * 2 + "px", height: s.r * 2 + "px",
          animationDelay: `${i * 0.7}s`,
          animationDuration: `${s.d}s`,
        }} />
      ))}


    </div>
  );
}
