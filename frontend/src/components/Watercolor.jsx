import React from "react";

/**
 * Watercolor SVG placeholders — soft, hand-painted feel using layered
 * gaussian-blurred organic blobs. Meant to stand in for the user's own
 * watercolor assets until uploaded. All strictly on-brand: forest, sage,
 * teal, dusty blue, cream. No saturated hues.
 */

const Filters = () => (
  <defs>
    <filter id="wc-blur" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="7" />
    </filter>
    <filter id="wc-soft" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="3.5" />
    </filter>
    <filter id="wc-grain">
      <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>
      <feColorMatrix values="0 0 0 0 0.11 0 0 0 0 0.22 0 0 0 0 0.16 0 0 0 0.20 0"/>
      <feComposite in2="SourceGraphic" operator="in"/>
    </filter>
  </defs>
);

/** Estuary + hills + sky — hero landscape. Fills its container. */
export function WatercolorEstuary({ className = "" }) {
  return (
    <svg viewBox="0 0 1600 900" className={className} preserveAspectRatio="xMidYMid slice" aria-hidden>
      <Filters />
      <rect width="1600" height="900" fill="#F9F6F0"/>
      {/* sky wash */}
      <g filter="url(#wc-blur)" opacity="0.9">
        <ellipse cx="800" cy="140" rx="1100" ry="220" fill="#E8EEE7"/>
        <ellipse cx="1200" cy="80" rx="600" ry="120" fill="#D8E2D8"/>
      </g>
      {/* far hills */}
      <g filter="url(#wc-soft)">
        <path d="M0,520 Q300,380 620,430 T1200,410 T1600,470 L1600,900 L0,900 Z" fill="#4A7C78" opacity="0.55"/>
        <path d="M0,600 Q260,470 560,520 T1080,510 T1600,560 L1600,900 L0,900 Z" fill="#1C3829" opacity="0.85"/>
      </g>
      {/* water */}
      <g filter="url(#wc-blur)" opacity="0.85">
        <path d="M0,720 Q400,660 800,700 T1600,700 L1600,900 L0,900 Z" fill="#789B9F"/>
        <path d="M0,780 Q500,740 900,770 T1600,760 L1600,900 L0,900 Z" fill="#B7CCD1" opacity="0.8"/>
      </g>
      {/* birds */}
      <g fill="#1C3829" opacity="0.7">
        <path d="M420 160 q10 -12 22 0 q12 -12 22 0" stroke="#1C3829" strokeWidth="2.4" fill="none" strokeLinecap="round"/>
        <path d="M520 130 q9 -11 18 0 q9 -11 18 0" stroke="#1C3829" strokeWidth="2" fill="none" strokeLinecap="round"/>
        <path d="M370 220 q7 -8 14 0 q7 -8 14 0" stroke="#1C3829" strokeWidth="1.8" fill="none" strokeLinecap="round"/>
      </g>
      {/* eucalyptus sprig, right */}
      <g transform="translate(1200,540)" opacity="0.85">
        <path d="M0 0 C 40 -60 120 -120 220 -140" stroke="#1C3829" strokeWidth="2" fill="none"/>
        {[[10,-20],[40,-50],[80,-80],[130,-110],[180,-130]].map(([x,y],i)=>(
          <ellipse key={i} cx={x} cy={y} rx="18" ry="10" fill="#4A7C78" opacity="0.9" transform={`rotate(-30 ${x} ${y})`}/>
        ))}
      </g>
      <rect width="1600" height="900" fill="transparent" filter="url(#wc-grain)" opacity="0.4"/>
    </svg>
  );
}

export function WatercolorRipple({ className = "" }) {
  return (
    <svg viewBox="0 0 400 400" className={className} aria-hidden>
      <Filters />
      <g filter="url(#wc-blur)">
        <circle cx="200" cy="200" r="150" fill="#B7CCD1" opacity="0.55"/>
        <circle cx="200" cy="200" r="110" fill="#789B9F" opacity="0.55"/>
        <circle cx="200" cy="200" r="70" fill="#4A7C78" opacity="0.6"/>
      </g>
      <g fill="none" stroke="#1C3829" strokeWidth="1.3" opacity="0.5">
        <circle cx="200" cy="200" r="140"/>
        <circle cx="200" cy="200" r="100"/>
        <circle cx="200" cy="200" r="60"/>
      </g>
    </svg>
  );
}

export function WatercolorBird({ className = "" }) {
  return (
    <svg viewBox="0 0 400 400" className={className} aria-hidden>
      <Filters />
      <g filter="url(#wc-soft)">
        <ellipse cx="200" cy="220" rx="90" ry="55" fill="#4A7C78" opacity="0.85"/>
        <ellipse cx="270" cy="200" rx="40" ry="28" fill="#1C3829" opacity="0.9"/>
        <path d="M120 210 Q140 160 220 180" stroke="#789B9F" strokeWidth="16" fill="none" strokeLinecap="round" opacity="0.7"/>
        <circle cx="285" cy="192" r="3" fill="#F9F6F0"/>
        <path d="M300 202 L320 208 L302 214 Z" fill="#B4552D" opacity="0.7"/>
      </g>
      {/* branch */}
      <path d="M40 300 Q160 280 260 300" stroke="#1C3829" strokeWidth="2" fill="none"/>
      {[[80,296],[130,290],[180,292],[220,296]].map(([x,y],i)=>(
        <ellipse key={i} cx={x} cy={y-8} rx="14" ry="7" fill="#4A7C78" opacity="0.8" transform={`rotate(-20 ${x} ${y})`}/>
      ))}
    </svg>
  );
}

export function WatercolorEucalyptus({ className = "" }) {
  return (
    <svg viewBox="0 0 400 500" className={className} aria-hidden>
      <Filters />
      <path d="M200 480 C 190 380 210 300 200 200 C 195 140 205 80 200 40" stroke="#1C3829" strokeWidth="2" fill="none"/>
      {[...Array(9)].map((_, i) => {
        const y = 60 + i * 45;
        const side = i % 2 === 0 ? -1 : 1;
        return (
          <g key={i} filter="url(#wc-soft)">
            <ellipse cx={200 + side * 40} cy={y} rx="34" ry="16" fill="#4A7C78" opacity="0.85" transform={`rotate(${side * 25} ${200 + side*40} ${y})`}/>
            <ellipse cx={200 - side * 20} cy={y + 20} rx="22" ry="11" fill="#789B9F" opacity="0.75" transform={`rotate(${side * -15} ${200 - side*20} ${y+20})`}/>
          </g>
        );
      })}
    </svg>
  );
}

export function WatercolorSapling({ className = "" }) {
  return (
    <svg viewBox="0 0 300 300" className={className} aria-hidden>
      <Filters />
      <path d="M150 290 L150 180" stroke="#1C3829" strokeWidth="2" fill="none"/>
      <g filter="url(#wc-soft)">
        <ellipse cx="120" cy="180" rx="30" ry="16" fill="#4A7C78" opacity="0.85" transform="rotate(-30 120 180)"/>
        <ellipse cx="180" cy="170" rx="30" ry="16" fill="#789B9F" opacity="0.85" transform="rotate(30 180 170)"/>
        <ellipse cx="150" cy="140" rx="28" ry="14" fill="#1C3829" opacity="0.7"/>
      </g>
      <g filter="url(#wc-blur)" opacity="0.6">
        <ellipse cx="150" cy="270" rx="80" ry="10" fill="#B7CCD1"/>
      </g>
    </svg>
  );
}

export function WatercolorBridge({ className = "" }) {
  return (
    <svg viewBox="0 0 400 300" className={className} aria-hidden>
      <Filters />
      <g filter="url(#wc-soft)">
        <path d="M20 200 Q200 100 380 200" stroke="#4A7C78" strokeWidth="14" fill="none" opacity="0.8"/>
        <path d="M20 200 Q200 110 380 200" stroke="#1C3829" strokeWidth="4" fill="none" opacity="0.6"/>
      </g>
      <g filter="url(#wc-blur)" opacity="0.6">
        <path d="M0 230 Q200 210 400 230 L400 300 L0 300 Z" fill="#789B9F"/>
      </g>
    </svg>
  );
}

/** Slim decorative flock line for headers */
export function BirdFlock({ className = "" }) {
  return (
    <svg viewBox="0 0 400 60" className={className} aria-hidden>
      <g fill="none" stroke="#1C3829" strokeWidth="1.6" strokeLinecap="round" opacity="0.55">
        <path d="M20 30 q10 -8 20 0 q10 -8 20 0"/>
        <path d="M110 22 q9 -8 18 0 q9 -8 18 0"/>
        <path d="M200 30 q11 -9 22 0 q11 -9 22 0"/>
        <path d="M300 20 q8 -7 16 0 q8 -7 16 0"/>
        <path d="M360 32 q7 -6 14 0 q7 -6 14 0"/>
      </g>
    </svg>
  );
}
