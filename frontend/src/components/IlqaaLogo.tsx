import React from "react";

interface IlqaaLogoProps {
  size?: "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  textColor?: "maroon" | "gold" | "white" | "adaptive";
  className?: string;
}

export function IlqaaLogo({ size = "md", showText = true, textColor = "adaptive", className = "" }: IlqaaLogoProps) {
  const sizeMap = {
    sm: { icon: "w-8 h-8", text: "text-base sm:text-lg", sub: "text-[9px] sm:text-[10px]" },
    md: { icon: "w-9 h-9 sm:w-10 sm:h-10", text: "text-xl sm:text-2xl", sub: "text-[10px] sm:text-[11px]" },
    lg: { icon: "w-12 h-12 sm:w-14 sm:h-14", text: "text-2xl sm:text-3xl", sub: "text-xs sm:text-sm" },
    xl: { icon: "w-16 h-16 sm:w-20 sm:h-20", text: "text-3xl sm:text-4xl", sub: "text-sm sm:text-base" }
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  const titleColorClass =
    textColor === "white"
      ? "text-white"
      : textColor === "gold"
      ? "text-[#FDE68A]"
      : textColor === "maroon"
      ? "text-[#8A1538]"
      : "text-[#8A1538] dark:text-[#FDE68A]";

  const subColorClass =
    textColor === "white"
      ? "text-white/80"
      : textColor === "gold"
      ? "text-[#D4AF37]"
      : textColor === "maroon"
      ? "text-[#8A1538]/70"
      : "text-[#8A1538]/80 dark:text-amber-200/80";

  return (
    <div className={`inline-flex items-center gap-2 sm:gap-2.5 ${className}`} id="ilqaa-brand-logo">
      {/* SVG Icon with Qatar Maroon & Gold Gradient */}
      <div className={`relative ${currentSize.icon} shrink-0`}>
        <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
          <defs>
            <linearGradient id="qatarMaroonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#8A1538" />
              <stop offset="50%" stopColor="#B82A52" />
              <stop offset="100%" stopColor="#5C0E25" />
            </linearGradient>
            <linearGradient id="qatarGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#D97706" />
            </linearGradient>
            <linearGradient id="ilqaaGlow" x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#8A1538" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.9" />
            </linearGradient>
          </defs>
          
          {/* Background Badge circle with subtle border */}
          <circle cx="50" cy="50" r="46" fill="url(#qatarMaroonGrad)" stroke="#F59E0B" strokeWidth="2.5" />
          
          {/* Outer Stylized Dynamic Swoosh / Wave */}
          <path
            d="M22 75C26 84 45 88 65 83C82 77 88 56 82 38C78 26 68 18 55 16C37 14 22 26 20 44C18 58 24 68 30 72"
            stroke="#F59E0B"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Microphone Head in White/Gold */}
          <rect x="42" y="26" width="16" height="26" rx="8" fill="#FFFFFF" />
          <rect x="45" y="30" width="10" height="18" rx="5" fill="#8A1538" />
          
          {/* Mic Stand Cradle */}
          <path
            d="M34 42C34 52 43 58 50 58C57 58 66 52 66 42"
            stroke="#F59E0B"
            strokeWidth="3.5"
            strokeLinecap="round"
          />

          {/* Mic Base Stem */}
          <path d="M50 58V70" stroke="#F59E0B" strokeWidth="3.5" strokeLinecap="round" />
          <path d="M38 70H62" stroke="#F59E0B" strokeWidth="3.5" strokeLinecap="round" />

          {/* Acoustic Waves */}
          <path d="M74 36C78 40 78 46 74 50" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M26 36C22 40 22 46 26 50" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1 sm:gap-1.5">
            <span className={`font-serif font-black tracking-tight leading-none ${titleColorClass} ${currentSize.text}`}>
              إلْقَـــاء
            </span>
            <span className="text-[10px] sm:text-xs">🇶🇦</span>
          </div>
          <span className={`font-sans font-extrabold tracking-wider ${subColorClass} uppercase leading-none mt-0.5 ${currentSize.sub}`}>
            ILQAA QATAR • الذكاء الاصطناعي
          </span>
        </div>
      )}
    </div>
  );
}

