import React from 'react';

export function BrandLogo({ className = "w-10 h-10", showText = false, textClassName = "text-sm font-bold text-slate-800" }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`relative flex items-center justify-center rounded-2xl p-1 bg-amber-400 border border-amber-300 shadow-sm ${className}`}>
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xs" fill="none" xmlns="http://www.w3.org/2000/svg">
          {/* Circular outer badge */}
          <circle cx="50" cy="50" r="46" fill="#FFD836" stroke="#7A1416" strokeWidth="4" />
          <circle cx="50" cy="50" r="41" fill="#FFF3BE" stroke="#7A1416" strokeWidth="1.5" strokeDasharray="2 2" />
          
          {/* Main paw pad */}
          <path 
            d="M50 78C38 78 31 66 35 56C38 48 46 51 50 48C54 51 62 48 65 56C69 66 62 78 50 78Z" 
            fill="#7A1416" 
          />
          
          {/* 4 Paw toes */}
          <ellipse cx="33" cy="40" rx="7" ry="11" transform="rotate(-18 33 40)" fill="#7A1416" />
          <ellipse cx="44" cy="31" rx="6.5" ry="11" transform="rotate(-4 44 31)" fill="#7A1416" />
          <ellipse cx="56" cy="31" rx="6.5" ry="11" transform="rotate(4 56 31)" fill="#7A1416" />
          <ellipse cx="67" cy="40" rx="7" ry="11" transform="rotate(18 67 40)" fill="#7A1416" />
        </svg>
      </div>
      {showText && (
        <div className="flex flex-col leading-tight min-w-0">
          <span className="font-extrabold text-xs sm:text-sm md:text-base tracking-tight text-slate-900 flex items-center gap-1.5 truncate">
            SERVICIO VETERINARIO CALIFORNIA
            <span className="inline-block w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-emerald-500 animate-pulse shrink-0"></span>
          </span>
          <span className="text-[9px] sm:text-[11px] md:text-xs font-semibold text-rose-900 tracking-wide uppercase truncate">
            Tijuana, B.C. &bull; Pasaporte de Viaje &bull; Clínica
          </span>
        </div>
      )}
    </div>
  );
}
