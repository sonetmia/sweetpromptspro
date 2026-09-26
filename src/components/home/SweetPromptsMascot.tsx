import React from 'react';

export const SweetPromptsMascot: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Subtle warm ambient backdrop glow */}
      <div 
        className="absolute inset-0 rounded-full blur-3xl opacity-20 pointer-events-none"
        style={{
          background: 'radial-gradient(circle, rgba(232, 106, 36, 0.4) 0%, rgba(217, 203, 184, 0.1) 45%, transparent 70%)',
          transform: 'translate(10%, 10%) scale(1.1)'
        }}
      />

      <svg
        viewBox="0 0 620 600"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto max-w-[540px] drop-shadow-2xl overflow-visible transition-transform duration-700 hover:scale-[1.01]"
      >
        <defs>
          {/* Subtle Gradients for Paper & Character Facets */}
          <linearGradient id="orangeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FA7D36" />
            <stop offset="60%" stopColor="#E86A24" />
            <stop offset="100%" stopColor="#BF5013" />
          </linearGradient>

          <linearGradient id="creamGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FAF7F2" />
            <stop offset="50%" stopColor="#F5F1EA" />
            <stop offset="100%" stopColor="#D9CBB8" />
          </linearGradient>

          <linearGradient id="charcoalGradientDark" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#25211E" />
            <stop offset="100%" stopColor="#141211" />
          </linearGradient>

          <linearGradient id="charcoalGradientLight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38322D" />
            <stop offset="100%" stopColor="#221E1B" />
          </linearGradient>

          <linearGradient id="paperSheetGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="40%" stopColor="#F7F3EB" />
            <stop offset="100%" stopColor="#EBE4D5" />
          </linearGradient>

          <linearGradient id="accentGlow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#E86A24" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#E86A24" stopOpacity="0" />
          </linearGradient>

          <filter id="softDropShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="16" stdDeviation="20" floodColor="#000000" floodOpacity="0.5" />
          </filter>

          <filter id="cardShadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="4" dy="12" stdDeviation="14" floodColor="#000000" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* 1. EDITORIAL DRAFTING BACKGROUND MARKS & COMPOSITION AXIS */}
        <g opacity="0.35">
          {/* Subtle circular layout compass */}
          <circle cx="360" cy="320" r="220" stroke="#3A342E" strokeWidth="1" strokeDasharray="4 6" />
          <circle cx="360" cy="320" r="140" stroke="#3A342E" strokeWidth="0.75" />
          
          {/* Editorial corner crosshairs */}
          <path d="M 120 120 L 140 120 M 120 120 L 120 140" stroke="#D9CBB8" strokeWidth="1" opacity="0.5" />
          <path d="M 540 120 L 520 120 M 540 120 L 540 140" stroke="#D9CBB8" strokeWidth="1" opacity="0.5" />
          <path d="M 120 520 L 140 520 M 120 520 L 120 500" stroke="#D9CBB8" strokeWidth="1" opacity="0.5" />
          <path d="M 540 520 L 520 520 M 540 520 L 540 500" stroke="#D9CBB8" strokeWidth="1" opacity="0.5" />

          {/* Registration marks */}
          <line x1="360" y1="60" x2="360" y2="90" stroke="#E86A24" strokeWidth="1" opacity="0.6" />
          <line x1="345" y1="75" x2="375" y2="75" stroke="#E86A24" strokeWidth="1" opacity="0.6" />

          {/* Golden ratio guideline angle */}
          <line x1="160" y1="480" x2="480" y2="160" stroke="#3A342E" strokeWidth="0.75" strokeDasharray="3 5" />
        </g>

        {/* 2. GROUND SHADOW */}
        <ellipse cx="360" cy="510" rx="190" ry="34" fill="#050505" opacity="0.8" />
        <ellipse cx="360" cy="508" rx="140" ry="20" fill="#120F0D" opacity="0.6" />

        {/* 3. MASCOT: THE CREATIVE EDITORIAL FOX COMPANION */}
        <g filter="url(#softDropShadow)">
          {/* A. Tail: Sweeping Faceted Arc */}
          <g id="fox-tail">
            {/* Base of tail */}
            <path
              d="M 280 440 C 230 460 170 450 145 390 C 130 350 140 300 180 270 C 210 248 245 255 260 275 C 240 295 210 320 200 360 C 190 400 230 435 280 440 Z"
              fill="url(#charcoalGradientDark)"
              stroke="#38322D"
              strokeWidth="1.2"
            />
            {/* Tail mid facet with warm orange tone */}
            <path
              d="M 180 270 C 210 248 245 255 260 275 L 215 330 L 160 335 C 148 310 160 285 180 270 Z"
              fill="url(#orangeGradient)"
              stroke="#FA7D36"
              strokeWidth="1"
            />
            {/* Tail cream tip (origami fold) */}
            <polygon
              points="180,270 140,240 135,285 160,335"
              fill="url(#creamGradient)"
              stroke="#D9CBB8"
              strokeWidth="1.2"
            />
            <polygon
              points="140,240 180,270 205,255"
              fill="#FAF7F2"
              stroke="#D9CBB8"
              strokeWidth="0.8"
            />
          </g>

          {/* B. Fox Body & Hind Quarters (Layered Charcoal & Amber Shapes) */}
          <g id="fox-body">
            {/* Main torso base */}
            <path
              d="M 270 480 L 330 340 L 410 370 L 430 480 C 400 505 300 505 270 480 Z"
              fill="url(#charcoalGradientDark)"
              stroke="#2E2824"
              strokeWidth="1.2"
            />
            {/* Back flank facet */}
            <polygon
              points="270,480 330,340 300,430"
              fill="#181513"
              stroke="#332C27"
              strokeWidth="1"
            />
            {/* Front chest orange accent plate */}
            <polygon
              points="330,340 400,320 410,370 350,440"
              fill="url(#orangeGradient)"
              stroke="#FA7D36"
              strokeWidth="1"
            />
            {/* Chest cream ascot / ruff */}
            <polygon
              points="340,310 400,320 375,370 345,355"
              fill="url(#creamGradient)"
              stroke="#FAF7F2"
              strokeWidth="1"
            />
            <polygon
              points="375,370 400,320 410,370"
              fill="#D9CBB8"
              stroke="#C4B49F"
              strokeWidth="0.8"
            />
          </g>

          {/* C. Fox Head & Ears (Geometric Origami Refinement) */}
          <g id="fox-head">
            {/* Left Ear - Outer Charcoal / Dark */}
            <polygon
              points="305,255 315,145 355,225"
              fill="url(#charcoalGradientDark)"
              stroke="#38322D"
              strokeWidth="1.2"
            />
            {/* Left Ear - Inner Orange Glow */}
            <polygon
              points="320,240 323,165 350,225"
              fill="url(#orangeGradient)"
              stroke="#FA7D36"
              strokeWidth="0.8"
            />

            {/* Right Ear - Outer Tall Alert */}
            <polygon
              points="385,220 425,120 440,230"
              fill="url(#charcoalGradientLight)"
              stroke="#4A423C"
              strokeWidth="1.2"
            />
            {/* Right Ear - Inner Cream Fold */}
            <polygon
              points="395,215 422,145 430,225"
              fill="url(#creamGradient)"
              stroke="#D9CBB8"
              strokeWidth="0.8"
            />

            {/* Crown & Forehead */}
            <polygon
              points="335,230 385,220 420,250 365,280"
              fill="url(#orangeGradient)"
              stroke="#FA7D36"
              strokeWidth="1.2"
            />
            {/* Forehead Facet Light */}
            <polygon
              points="335,230 365,280 320,290"
              fill="#BF5013"
              stroke="#E86A24"
              strokeWidth="0.8"
            />

            {/* Cheek & Muzzle Structure */}
            {/* Left Muzzle / Cream Cheek */}
            <polygon
              points="320,290 365,280 350,335 295,310"
              fill="url(#creamGradient)"
              stroke="#FAF7F2"
              strokeWidth="1.2"
            />
            {/* Right Muzzle Cheek */}
            <polygon
              points="365,280 420,250 435,315 385,340"
              fill="#D9CBB8"
              stroke="#EBE4D5"
              strokeWidth="1"
            />

            {/* Snout Tip / Nose Bridge */}
            <polygon
              points="365,280 385,340 350,335"
              fill="#F5F1EA"
              stroke="#FAF7F2"
              strokeWidth="1"
            />
            {/* Nose Button */}
            <polygon
              points="362,330 373,330 367,338"
              fill="#141211"
              stroke="#38322D"
              strokeWidth="0.8"
            />

            {/* Stylized Intelligent Editorial Eye (Left) */}
            <path
              d="M 342 272 Q 352 268 358 274"
              stroke="#141211"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
            {/* Tiny accent spark at eye */}
            <circle cx="355" cy="271" r="1" fill="#FA7D36" />

            {/* Stylized Eye (Right) */}
            <path
              d="M 388 266 Q 398 262 404 268"
              stroke="#141211"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>
        </g>

        {/* 4. THE EDITORIAL CONCEPT FOLIO (Held Proudly by Mascot) */}
        <g id="concept-folio" filter="url(#cardShadow)">
          {/* Under-sheet shadow / back folio cover */}
          <polygon
            points="340,360 520,320 545,460 365,505"
            fill="#1A1816"
            stroke="#38322D"
            strokeWidth="1.2"
          />

          {/* Secondary Paper Sheet (Warm Cream) */}
          <polygon
            points="335,355 510,315 532,450 358,495"
            fill="#D9CBB8"
            stroke="#C9B9A3"
            strokeWidth="1"
          />

          {/* Main Top Editorial Sheet (Crisp White/Parchment) */}
          <polygon
            points="330,350 500,310 522,442 352,485"
            fill="url(#paperSheetGrad)"
            stroke="#FAF7F2"
            strokeWidth="1.4"
          />

          {/* Sheet Corner Fold (Top Right) */}
          <polygon
            points="480,314 500,310 495,330"
            fill="#D9CBB8"
            stroke="#B8A790"
            strokeWidth="0.8"
          />

          {/* Clean Editorial Layout Mock Lines on Sheet */}
          {/* Header Accent Bar */}
          <path d="M 360 350 L 420 336" stroke="#E86A24" strokeWidth="3" strokeLinecap="round" />
          
          {/* Wireframe Text Lines */}
          <path d="M 360 368 L 475 342" stroke="#25211E" strokeWidth="1.8" strokeLinecap="round" />
          <path d="M 360 380 L 460 357" stroke="#8C8278" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M 360 392 L 485 364" stroke="#8C8278" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M 360 404 L 440 386" stroke="#8C8278" strokeWidth="1.2" strokeLinecap="round" />

          {/* Minimal Stock Concept Thumbnail Frame */}
          <polygon
            points="360,420 435,404 445,455 370,472"
            fill="#EBE4D5"
            stroke="#D0C4AF"
            strokeWidth="1"
          />
          {/* Subtle sun & hill inside wireframe thumbnail */}
          <circle cx="390" cy="432" r="4" fill="#E86A24" opacity="0.9" />
          <path d="M 370 460 L 395 440 L 415 452 L 435 435 L 440 450" stroke="#8C8278" strokeWidth="1" fill="none" />

          {/* Stamp / Tag: "STOCK READY" */}
          <g transform="translate(435, 410) rotate(-13)">
            <rect x="0" y="0" width="62" height="18" rx="3" fill="#E86A24" />
            <text x="31" y="12" fill="#FFFFFF" fontSize="7.5" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="700" textAnchor="middle" letterSpacing="0.8">
              STOCK READY
            </text>
          </g>

          {/* Fox Paw Holding the Board (Left) */}
          <ellipse cx="340" cy="370" rx="14" ry="9" fill="url(#creamGradient)" stroke="#FAF7F2" strokeWidth="1" transform="rotate(-15 340 370)" />
          {/* Paw (Right / Bottom) */}
          <ellipse cx="440" cy="460" rx="15" ry="9" fill="url(#creamGradient)" stroke="#FAF7F2" strokeWidth="1" transform="rotate(-20 440 460)" />
        </g>

        {/* 5. FLOATING CREATIVE DRAFT ACCENTS */}
        {/* Floating Paper Note (Top Left) */}
        <g transform="translate(180, 160) rotate(-12)" opacity="0.95" filter="url(#cardShadow)">
          <polygon
            points="0,0 64,-10 74,40 10,50"
            fill="url(#paperSheetGrad)"
            stroke="#FAF7F2"
            strokeWidth="1"
          />
          <path d="M 12 12 L 45 7" stroke="#E86A24" strokeWidth="2" strokeLinecap="round" />
          <path d="M 12 24 L 58 17" stroke="#A8A29A" strokeWidth="1" strokeLinecap="round" />
          <path d="M 12 34 L 40 30" stroke="#A8A29A" strokeWidth="1" strokeLinecap="round" />
        </g>

        {/* Small Creative Ember Spark (Warm Orange) */}
        <g transform="translate(480, 190)">
          <path
            d="M 0 -10 Q 0 0 10 0 Q 0 0 0 10 Q 0 0 -10 0 Q 0 0 0 -10 Z"
            fill="#E86A24"
          />
          <circle cx="0" cy="0" r="2" fill="#FAF7F2" />
        </g>

        {/* Floating Minimal Tag (Bottom Right) */}
        <g transform="translate(480, 485) rotate(6)" opacity="0.9">
          <rect x="0" y="0" width="80" height="22" rx="4" fill="#1A1816" stroke="#38322D" strokeWidth="1" />
          <circle cx="12" cy="11" r="3" fill="#E86A24" />
          <text x="24" y="14" fill="#D9CBB8" fontSize="8.5" fontFamily="Plus Jakarta Sans, sans-serif" fontWeight="600" letterSpacing="0.5">
            PROMPT • V3
          </text>
        </g>
      </svg>
    </div>
  );
};
