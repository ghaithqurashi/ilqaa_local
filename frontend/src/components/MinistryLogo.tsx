import React, { useState } from "react";

interface MinistryLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  textColor?: "maroon" | "white" | "slate" | "gold" | "adaptive";
  className?: string;
  variant?: "horizontal" | "stacked" | "emblemOnly";
  customImageUrl?: string;
}

/**
 * Qatar Ministry of Education and Higher Education Official Identity Component.
 * Supports:
 * 1. Static Image File from `/public/ministry-logo.png` or `/public/logo.png` automatically if present
 * 2. User-provided `customImageUrl`
 * 3. High-precision vector fallback
 */
export const MinistryLogo: React.FC<MinistryLogoProps> = ({
  size = "md",
  showText = true,
  textColor = "maroon",
  className = "",
  variant = "horizontal",
  customImageUrl = "/ministry-logo.png"
}) => {
  const [imageError, setImageError] = useState<boolean>(false);

  const sizeMap = {
    xs: {
      emblem: "w-8 h-8 sm:w-9 sm:h-9",
      imgH: "h-7 sm:h-8",
      arabic: "text-[11px] sm:text-[12px] leading-tight font-black",
      english: "text-[7.5px] sm:text-[8.5px]",
      sub: "text-[6.5px] sm:text-[7.5px]",
      gap: "gap-1.5 sm:gap-2"
    },
    sm: {
      emblem: "w-10 h-10 sm:w-12 sm:h-12",
      imgH: "h-9 sm:h-10",
      arabic: "text-[12px] sm:text-[14px] leading-tight font-black",
      english: "text-[8.5px] sm:text-[10px]",
      sub: "text-[7.5px] sm:text-[8.5px]",
      gap: "gap-2 sm:gap-2.5"
    },
    md: {
      emblem: "w-14 h-14 sm:w-16 sm:h-16",
      imgH: "h-11 sm:h-13",
      arabic: "text-[14px] sm:text-[17px] leading-tight font-black",
      english: "text-[9.5px] sm:text-[11.5px] font-semibold",
      sub: "text-[8px] sm:text-[10px]",
      gap: "gap-2.5 sm:gap-3.5"
    },
    lg: {
      emblem: "w-16 h-16 sm:w-20 sm:h-20",
      imgH: "h-14 sm:h-16",
      arabic: "text-[18px] sm:text-[22px] leading-tight font-black",
      english: "text-[11px] sm:text-[13.5px] font-semibold",
      sub: "text-[9.5px] sm:text-[11.5px]",
      gap: "gap-3 sm:gap-4"
    },
    xl: {
      emblem: "w-20 h-20 sm:w-28 sm:h-28",
      imgH: "h-18 sm:h-24",
      arabic: "text-[22px] sm:text-[28px] leading-tight font-black",
      english: "text-[13px] sm:text-[16px] font-bold",
      sub: "text-[11px] sm:text-[13.5px]",
      gap: "gap-4 sm:gap-5"
    }
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  // 1. If an image is provided and hasn't failed to load, render the actual uploaded image directly!
  if (customImageUrl && !imageError) {
    return (
      <div
        className={`inline-flex items-center ${
          variant === "stacked" ? "flex-col text-center" : "flex-row"
        } ${currentSize.gap} ${className}`}
        id="official-qatar-ministry-logo-image"
      >
        <img
          src={customImageUrl}
          alt="وزارة التربية والتعليم والتعليم العالي - دولة قطر"
          className={`${currentSize.imgH} object-contain`}
          onError={() => {
            // Fallback gracefully to vector if image file isn't uploaded yet
            setImageError(true);
          }}
        />
        {showText && (
          <div
            className={`flex flex-col ${
              variant === "stacked" ? "items-center text-center mt-2" : "items-start text-start"
            }`}
          >
            <span className={`font-serif tracking-tight select-none ${currentSize.arabic} text-[#8A1538] dark:text-white`}>
              وزارة التربية والتعليم والتعليم العالي
            </span>
            <span className={`font-sans tracking-tight leading-tight mt-0.5 select-none ${currentSize.english} text-slate-700 dark:text-slate-200`} dir="ltr">
              Ministry of Education and Higher Education
            </span>
          </div>
        )}
      </div>
    );
  }

  // Primary color for vectors (Vector Fallback)
  const fill =
    textColor === "white"
      ? "#FFFFFF"
      : textColor === "gold"
      ? "#FDE68A"
      : textColor === "slate"
      ? "#1E293B"
      : "#8A1538";

  const englishColorClass =
    textColor === "white"
      ? "text-white/90"
      : textColor === "gold"
      ? "text-[#FDE68A]/90"
      : textColor === "slate"
      ? "text-slate-600 dark:text-slate-300"
      : textColor === "adaptive"
      ? "text-slate-700 dark:text-slate-200"
      : "text-slate-800 dark:text-slate-200";

  const subColorClass =
    textColor === "white"
      ? "text-white/75"
      : textColor === "gold"
      ? "text-[#D4AF37]"
      : textColor === "slate"
      ? "text-slate-500 dark:text-slate-400"
      : textColor === "adaptive"
      ? "text-[#8A1538] dark:text-[#FDE68A]"
      : "text-[#8A1538] dark:text-[#FDE68A]";

  return (
    <div
      className={`inline-flex items-center ${
        variant === "stacked" ? "flex-col text-center" : "flex-row"
      } ${currentSize.gap} ${className}`}
      id="official-qatar-ministry-logo"
      dir="rtl"
    >
      <div className={`relative ${currentSize.emblem} shrink-0`} id="moehe-crest-emblem">
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-xs select-none"
        >
          {/* 1. Dhow boat on the left */}
          <g id="crest-dhow">
            <path
              d="M34 16 C31 30 24 50 22 58 C32 57 43 51 47 49 C44 36 39 23 34 16 Z"
              fill={fill}
            />
            <path
              d="M20 42 C21 48 21 54 20 58 C17 57 15 56 16 53 C18 49 19 45 20 42 Z"
              fill={fill}
            />
            <path
              d="M14 58 C22 58 42 53 50 54 C48 61 36 63 21 63 C14 63 12 60 14 58 Z"
              fill={fill}
            />
          </g>

          {/* 2. Palm Trees on the right */}
          <g id="crest-palms">
            <path
              d="M56 65 C65 63 78 63 86 65 C78 67 65 67 56 65 Z"
              fill={fill}
            />
            <path
              d="M66 65 C67 53 67 39 68 28 C69 28 70 53 71 65 Z"
              fill={fill}
            />
            <path d="M68 28 C66 18 73 14 77 18 C74 22 71 25 68 28 Z" fill={fill} />
            <path d="M68 28 C74 19 81 24 79 30 C75 26 71 27 68 28 Z" fill={fill} />
            <path d="M68 28 C78 29 81 36 78 40 C75 35 71 32 68 28 Z" fill={fill} />
            <path d="M68 28 C62 20 55 24 54 30 C59 26 64 27 68 28 Z" fill={fill} />
            <path d="M68 28 C58 29 55 36 58 40 C61 35 65 32 68 28 Z" fill={fill} />

            <path
              d="M77 65 C78 57 79 46 80 36 C81 36 82 57 83 65 Z"
              fill={fill}
            />
            <path d="M80 36 C79 28 84 25 87 28 C85 31 82 33 80 36 Z" fill={fill} />
            <path d="M80 36 C86 29 91 33 90 37 C87 34 83 35 80 36 Z" fill={fill} />
            <path d="M80 36 C88 37 90 42 87 45 C85 41 82 39 80 36 Z" fill={fill} />
            <path d="M80 36 C75 30 70 33 69 38 C73 35 77 36 80 36 Z" fill={fill} />
          </g>

          {/* 3. Sea waves below the boat & palms */}
          <g id="crest-waves" stroke={fill} strokeWidth="1.2" strokeLinecap="round">
            <path d="M30 66 C35 64 40 68 45 66 C50 64 55 68 60 66 C65 64 70 68 75 66" />
            <path d="M26 70 C31 68 36 72 41 70 C46 68 51 72 56 70 C61 68 66 72 71 70" />
            <path d="M32 74 C37 72 42 76 47 74 C52 72 57 76 62 74 C67 72 72 76 77 74" />
          </g>

          {/* 4. Two Crossed Swords */}
          <g id="crest-swords">
            <path
              d="M32 68 C42 60 56 50 72 40 C83 33 91 23 96 12 C93 20 83 31 70 41 C54 52 40 62 32 68 Z"
              fill={fill}
            />
            <rect
              x="26"
              y="69"
              width="10"
              height="2.2"
              rx="1.1"
              transform="rotate(-40 26 69)"
              fill={fill}
            />
            <path
              d="M26 74 L20 80 L18 78 L24 72 Z"
              fill={fill}
            />
            <circle cx="17" cy="81" r="3.2" stroke={fill} strokeWidth="1.2" fill="none" />
            <path d="M15 84 C13 87 13 90 14 93 C15 93 16 91 17 87 Z" fill={fill} />

            <path
              d="M68 68 C58 60 44 50 28 40 C17 33 9 23 4 12 C7 20 17 31 30 41 C46 52 60 62 68 68 Z"
              fill={fill}
            />
            <rect
              x="66"
              y="68"
              width="10"
              height="2.2"
              rx="1.1"
              transform="rotate(40 66 68)"
              fill={fill}
            />
            <path
              d="M74 74 L80 80 L82 78 L76 72 Z"
              fill={fill}
            />
            <circle cx="83" cy="81" r="3.2" stroke={fill} strokeWidth="1.2" fill="none" />
            <path d="M85 84 C87 87 87 90 86 93 C85 93 84 91 83 87 Z" fill={fill} />
          </g>
        </svg>
      </div>

      {showText && (
        <div
          className={`flex flex-col ${
            variant === "stacked" ? "items-center text-center mt-2" : "items-start text-start"
          }`}
        >
          <span
            className={`font-serif tracking-tight select-none ${currentSize.arabic}`}
            style={{ color: fill }}
          >
            وزارة التربية والتعليم والتعليم العالي
          </span>

          <span
            className={`font-sans tracking-tight leading-tight mt-0.5 select-none ${currentSize.english} ${englishColorClass}`}
            dir="ltr"
          >
            Ministry of Education and Higher Education
          </span>

          <div
            className={`flex items-center gap-1.5 font-sans font-bold mt-0.5 select-none ${currentSize.sub} ${subColorClass}`}
          >
            <span dir="ltr">State of Qatar</span>
            <span className="text-[#8A1538] dark:text-[#FDE68A] text-[9px]">◆</span>
            <span>دولة قـطـر</span>
          </div>
        </div>
      )}
    </div>
  );
};
