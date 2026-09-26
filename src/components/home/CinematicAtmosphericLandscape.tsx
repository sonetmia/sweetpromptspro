import React from 'react';

export const CinematicAtmosphericLandscape: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Ambient cinematic glow behind the artwork */}
      <div 
        className="absolute inset-0 rounded-2xl blur-3xl opacity-30 pointer-events-none"
        style={{
          background: 'radial-gradient(circle at 60% 50%, rgba(199, 74, 67, 0.25) 0%, rgba(33, 67, 75, 0.3) 40%, rgba(16, 35, 45, 0.1) 70%, transparent 100%)',
          transform: 'scale(1.08)'
        }}
      />

      <svg
        viewBox="0 0 680 540"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto max-w-[620px] rounded-lg overflow-hidden border border-[#272D30]/60 shadow-2xl transition-transform duration-700 hover:scale-[1.008]"
      >
        <defs>
          {/* Deep Blue Sky Gradient */}
          <linearGradient id="skyAtmosphere" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#080C10" />
            <stop offset="35%" stopColor="#10232D" />
            <stop offset="65%" stopColor="#183642" />
            <stop offset="85%" stopColor="#21434B" />
            <stop offset="100%" stopColor="#3A4D53" />
          </linearGradient>

          {/* Horizon Coral & Soft Cream Light Band */}
          <linearGradient id="horizonGlow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10232D" stopOpacity="0.8" />
            <stop offset="25%" stopColor="#C74A43" stopOpacity="0.85" />
            <stop offset="50%" stopColor="#E57A68" stopOpacity="0.9" />
            <stop offset="65%" stopColor="#F3EDE2" stopOpacity="0.95" />
            <stop offset="85%" stopColor="#D9672E" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#10232D" stopOpacity="0.8" />
          </linearGradient>

          {/* Dark Reflective Water / Foreground */}
          <linearGradient id="reflectiveWater" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#1B262C" />
            <stop offset="25%" stopColor="#111A1F" />
            <stop offset="60%" stopColor="#0B1013" />
            <stop offset="100%" stopColor="#07090B" />
          </linearGradient>

          {/* Soft Cream Horizon Flare */}
          <radialGradient id="creamSunGlow" cx="62%" cy="62%" r="45%">
            <stop offset="0%" stopColor="#F3EDE2" stopOpacity="0.95" />
            <stop offset="20%" stopColor="#F5E4CE" stopOpacity="0.75" />
            <stop offset="50%" stopColor="#C74A43" stopOpacity="0.45" />
            <stop offset="80%" stopColor="#21434B" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#10232D" stopOpacity="0" />
          </radialGradient>

          {/* Horizon Distant Mist Gradient */}
          <linearGradient id="mistGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E8E4DC" stopOpacity="0" />
            <stop offset="50%" stopColor="#E8E4DC" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#E8E4DC" stopOpacity="0" />
          </linearGradient>

          {/* Grain texture filter */}
          <filter id="cinematicFilmGrain" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" result="noise" />
            <feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.04 0" />
            <feBlend in="SourceGraphic" in2="noise" mode="overlay" />
          </filter>
        </defs>

        {/* 1. SKY / UPPER ATMOSPHERE */}
        <rect width="680" height="540" fill="url(#skyAtmosphere)" />

        {/* 2. DISTANT GEOLOGICAL STRATA / SILHOUETTE RIDGES */}
        {/* Ridge Layer 1 (Deep Blue Teal) */}
        <path
          d="M 0 310 Q 140 290 280 305 T 520 295 Q 600 285 680 292 L 680 345 L 0 345 Z"
          fill="#162E38"
          opacity="0.6"
        />

        {/* Ridge Layer 2 (Muted Teal Indigo) */}
        <path
          d="M 0 325 Q 180 310 360 322 T 680 312 L 680 360 L 0 360 Z"
          fill="#0F2027"
          opacity="0.85"
        />

        {/* 3. ATMOSPHERIC HORIZON BAND & CORAL/CREAM GLOW */}
        {/* Soft Radial Cream Light Center */}
        <ellipse cx="440" cy="336" rx="180" ry="60" fill="url(#creamSunGlow)" opacity="0.8" />

        {/* Horizon Strip of Light */}
        <rect x="0" y="332" width="680" height="8" fill="url(#horizonGlow)" />
        <rect x="180" y="334" width="340" height="3" fill="#F3EDE2" opacity="0.9" filter="blur(1px)" />

        {/* Atmospheric Mist Layer */}
        <rect x="0" y="318" width="680" height="35" fill="url(#mistGradient)" />

        {/* 4. LOWER WATER / DARK REFLECTIVE FOREGROUND */}
        <rect x="0" y="338" width="680" height="202" fill="url(#reflectiveWater)" />

        {/* Water Horizon Edge Line */}
        <line x1="0" y1="338" x2="680" y2="338" stroke="#383E41" strokeWidth="0.75" opacity="0.7" />

        {/* Subtle Water Reflections */}
        <ellipse cx="440" cy="355" rx="130" ry="8" fill="#C74A43" opacity="0.25" filter="blur(3px)" />
        <ellipse cx="440" cy="370" rx="90" ry="6" fill="#F3EDE2" opacity="0.3" filter="blur(2px)" />
        <ellipse cx="440" cy="395" rx="55" ry="4" fill="#D9672E" opacity="0.2" filter="blur(2px)" />

        {/* Subtle Horizon Water Shimmer Lines */}
        <line x1="320" y1="344" x2="560" y2="344" stroke="#F3EDE2" strokeWidth="0.8" opacity="0.5" strokeDasharray="12 8 4 6" />
        <line x1="360" y1="352" x2="520" y2="352" stroke="#E57A68" strokeWidth="0.8" opacity="0.4" strokeDasharray="18 10 6 8" />
        <line x1="390" y1="364" x2="490" y2="364" stroke="#C74A43" strokeWidth="0.6" opacity="0.3" strokeDasharray="14 12" />

        {/* 5. SOLITARY DISTINCTIVE SUBJECT: MINIMALIST SCULPTURAL COMPASS MONOLITH & TREE */}
        {/* Solitary Minimal Horizon Element (Refined, Poetic, Uncluttered) */}
        <g id="solitary-subject">
          {/* Subtle reflection of subject in dark water */}
          <path
            d="M 260 338 L 260 395 L 264 395 L 264 338 Z"
            fill="#C74A43"
            opacity="0.2"
            filter="blur(1.5px)"
          />
          <ellipse cx="262" cy="348" rx="8" ry="4" fill="#F3EDE2" opacity="0.3" filter="blur(1px)" />

          {/* Silhouette Monolith / Solitary Form on the Left-Center Horizon */}
          {/* Minimalist fine vertical monolith */}
          <line x1="262" y1="210" x2="262" y2="338" stroke="#080C0E" strokeWidth="3" strokeLinecap="round" />
          <line x1="262" y1="210" x2="262" y2="338" stroke="#1A2D35" strokeWidth="1.5" strokeLinecap="round" />

          {/* Minimalist Fine Horizon Needle Ring / Dial (Art Direction Motif) */}
          <circle cx="262" cy="255" r="32" stroke="#F3EDE2" strokeWidth="0.8" opacity="0.6" strokeDasharray="2 4" />
          <circle cx="262" cy="255" r="18" stroke="#C74A43" strokeWidth="1" opacity="0.85" />
          
          {/* Coral Zenith Point */}
          <circle cx="262" cy="210" r="3.5" fill="#C74A43" />
          <circle cx="262" cy="210" r="1.5" fill="#F3EDE2" />

          {/* Subtle delicate branches / horizon organic form */}
          <path
            d="M 262 290 Q 248 275 235 280 M 262 278 Q 280 266 292 272 M 262 305 Q 242 298 228 308"
            stroke="#080C0E"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
          />
        </g>

        {/* 6. EDITORIAL REGISTRATION / CROPPING TICKS & METADATA */}
        <g opacity="0.45">
          {/* Fine corner marks */}
          <path d="M 24 24 L 36 24 M 24 24 L 24 36" stroke="#E8E4DC" strokeWidth="0.75" />
          <path d="M 656 24 L 644 24 M 656 24 L 656 36" stroke="#E8E4DC" strokeWidth="0.75" />
          <path d="M 24 516 L 36 516 M 24 516 L 24 504" stroke="#E8E4DC" strokeWidth="0.75" />
          <path d="M 656 516 L 644 516 M 656 516 L 656 504" stroke="#E8E4DC" strokeWidth="0.75" />

          {/* Minimal Typography Caption */}
          <text x="36" y="504" fill="#8C8A86" fontSize="8" fontFamily="Plus Jakarta Sans, sans-serif" letterSpacing="1.5">
            FIG. 01 — ATMOSPHERIC HORIZON
          </text>
          <text x="644" y="504" fill="#8C8A86" fontSize="8" fontFamily="Plus Jakarta Sans, sans-serif" letterSpacing="1.5" textAnchor="end">
            SWEETPROMPTS PRO
          </text>
        </g>

        {/* 7. REFINED FILM GRAIN OVERLAY */}
        <rect width="680" height="540" fill="transparent" filter="url(#cinematicFilmGrain)" />
      </svg>
    </div>
  );
};
