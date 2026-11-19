import React, { useState } from "react";
import { Sparkles, Trophy, Flame, Star, Gift, CheckCircle2 } from "lucide-react";
import { StudentProfile } from "../types";
import { motion } from "motion/react";
import { playRewardSound } from "../lib/audioAndEffects";

interface GamificationHeaderProps {
  student: StudentProfile;
  language: "ar" | "en";
  theme: any;
  onClaimDailyBonus: () => void;
}

export const GamificationHeader: React.FC<GamificationHeaderProps> = ({
  student,
  language,
  theme,
  onClaimDailyBonus
}) => {
  const isRtl = language === "ar";
  const [claimedToday, setClaimedToday] = useState<boolean>(() => {
    const today = new Date().toISOString().split("T")[0];
    return student.lastBonusClaimDate === today;
  });

  const levelTitlesAr = [
    "مبتدئ المعايير 🌟",
    "طالب متألق 🚀",
    "فارس الفصاحة ⚔️",
    "بطل القراءة 🏆",
    "خبير النحو والمعايير 🎓",
    "عالم اللغة القطري 👑"
  ];

  const levelTitlesEn = [
    "Curriculum Starter 🌟",
    "Rising Star 🚀",
    "Knight of Speech ⚔️",
    "Reading Champion 🏆",
    "Grammar Master 🎓",
    "National Scholar 👑"
  ];

  const currentLevelTitle = isRtl
    ? levelTitlesAr[Math.min(student.level - 1, levelTitlesAr.length - 1)]
    : levelTitlesEn[Math.min(student.level - 1, levelTitlesEn.length - 1)];

  // Calculate XP threshold for current level (Level N requires N * 250 XP)
  const xpCurrentLevelFloor = (student.level - 1) * 250;
  const xpNextLevelCap = student.level * 250;
  const xpInLevel = Math.max(0, student.xp - xpCurrentLevelFloor);
  const xpNeededInLevel = xpNextLevelCap - xpCurrentLevelFloor;
  const progressPct = Math.min(100, Math.round((xpInLevel / xpNeededInLevel) * 100));

  const handleClaim = () => {
    if (claimedToday) return;
    setClaimedToday(true);
    playRewardSound("fanfare");
    onClaimDailyBonus();
  };

  return (
    <div 
      className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-4"
      id="gamification-header-bar"
      dir={isRtl ? "rtl" : "ltr"}
    >
      {/* Student Rank & XP Progress Bar */}
      <div className="flex items-center gap-3.5 w-full md:w-auto">
        <div className="relative shrink-0">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-500 p-0.5 shadow-md flex items-center justify-center">
            <div className="w-full h-full bg-white rounded-[14px] flex items-center justify-center font-black text-amber-600 text-base">
              {student.level}
            </div>
          </div>
          <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full border border-white">
            LVL
          </span>
        </div>

        <div className="flex-1 min-w-[200px]">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
              <span>{currentLevelTitle}</span>
            </span>
            <span className="text-[10px] font-extrabold text-amber-700 font-mono">
              {student.xp} / {xpNextLevelCap} XP
            </span>
          </div>

          {/* XP Progress Bar */}
          <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-100">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.8 }}
              className="h-full bg-gradient-to-r from-amber-400 to-yellow-500 rounded-full shadow-xs"
            />
          </div>
        </div>
      </div>

      {/* Gamification Stats Badges: Streak, Coins, Unlocked Badges */}
      <div className="flex flex-wrap items-center justify-center md:justify-end gap-2.5 w-full md:w-auto">
        {/* Streak */}
        <div className="px-3.5 py-2 bg-orange-50 border border-orange-100 rounded-xl flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-500 animate-pulse fill-orange-400" />
          <div className="text-right">
            <p className="text-[10px] font-extrabold text-orange-600 leading-none">
              {isRtl ? "السلسلة" : "Streak"}
            </p>
            <p className="text-xs font-black text-orange-900 mt-0.5 font-mono">
              {student.streakDays} {isRtl ? "أيام" : "Days"}
            </p>
          </div>
        </div>

        {/* Stars / Coins */}
        <div className="px-3.5 py-2 bg-yellow-50 border border-yellow-100 rounded-xl flex items-center gap-2">
          <Star className="w-4 h-4 text-yellow-500 fill-yellow-400" />
          <div className="text-right">
            <p className="text-[10px] font-extrabold text-yellow-700 leading-none">
              {isRtl ? "النجوم" : "Stars"}
            </p>
            <p className="text-xs font-black text-yellow-950 mt-0.5 font-mono">
              {student.coins || 120} 🌟
            </p>
          </div>
        </div>

        {/* Badges Count */}
        <div className="px-3.5 py-2 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center gap-2">
          <Trophy className="w-4 h-4 text-indigo-600" />
          <div className="text-right">
            <p className="text-[10px] font-extrabold text-indigo-600 leading-none">
              {isRtl ? "الأوسمة" : "Badges"}
            </p>
            <p className="text-xs font-black text-indigo-950 mt-0.5 font-mono">
              {student.badges.filter(b => b.unlocked).length} / {student.badges.length}
            </p>
          </div>
        </div>

        {/* Daily Bonus Claim Button */}
        <button
          onClick={handleClaim}
          disabled={claimedToday}
          className={`px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer ${
            claimedToday
              ? "bg-slate-100 text-slate-400 cursor-default"
              : "bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shadow-sm animate-bounce"
          }`}
        >
          {claimedToday ? (
            <>
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>{isRtl ? "تم استلام مكافأة اليوم" : "Bonus Claimed"}</span>
            </>
          ) : (
            <>
              <Gift className="w-4 h-4 text-white" />
              <span>{isRtl ? "هدية اليوم (+50 XP)" : "Daily Gift (+50 XP)"}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
