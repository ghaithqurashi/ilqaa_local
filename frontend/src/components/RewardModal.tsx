import React, { useEffect } from "react";
import { Sparkles, Trophy, Star, Award, CheckCircle2, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { RewardCelebration } from "../types";
import { playRewardSound } from "../lib/audioAndEffects";

interface RewardModalProps {
  reward: RewardCelebration | null;
  onClose: () => void;
  language: "ar" | "en";
}

export const RewardModal: React.FC<RewardModalProps> = ({ reward, onClose, language }) => {
  const isRtl = language === "ar";

  useEffect(() => {
    if (reward) {
      if (reward.leveledUp) {
        playRewardSound("levelup");
      } else {
        playRewardSound("correct");
      }
    }
  }, [reward]);

  if (!reward) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 20 }}
          className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full border border-amber-200 shadow-2xl text-center space-y-5 relative overflow-hidden"
          dir={isRtl ? "rtl" : "ltr"}
        >
          {/* Top glowing background decoration */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-amber-100 to-transparent opacity-60 -z-10" />

          {/* Trophy or Badge Icon */}
          <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400 to-yellow-300 p-0.5 shadow-lg flex items-center justify-center animate-bounce">
            <div className="w-full h-full bg-white rounded-full flex items-center justify-center">
              {reward.leveledUp ? (
                <Trophy className="w-10 h-10 text-amber-500" />
              ) : reward.badgeUnlocked ? (
                <Award className="w-10 h-10 text-amber-500" />
              ) : (
                <Star className="w-10 h-10 text-yellow-500 fill-yellow-400" />
              )}
            </div>
          </div>

          <div>
            <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-black uppercase tracking-wider">
              {reward.leveledUp
                ? (isRtl ? "🎉 ترقية مستمِرَة!" : "🎉 LEVEL UP!")
                : (isRtl ? "⭐ إنجاز رائع!" : "⭐ GREAT JOB!")}
            </span>
            <h3 className="text-xl md:text-2xl font-black font-serif text-slate-800 mt-2">
              {reward.titleAr}
            </h3>
            <p className="text-xs text-slate-500 font-bold mt-1">
              {reward.leveledUp
                ? (isRtl ? `مبروك! لقد وصلت إلى المستوى ${reward.newLevel}` : `Congratulations! Reached Level ${reward.newLevel}`)
                : (isRtl ? "واصل التعلم والممارسة لتصبح بطلاً في المعايير القومية!" : "Keep practicing to master national curriculum standards!")}
            </p>
          </div>

          {/* Reward Badges pill */}
          <div className="flex justify-center items-center gap-4 bg-amber-50 p-4 rounded-2xl border border-amber-100">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span className="text-sm font-black text-amber-900">+{reward.xpEarned} XP</span>
            </div>

            <div className="w-px h-6 bg-amber-200" />

            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-400" />
              <span className="text-sm font-black text-amber-900">+{reward.coinsEarned} {isRtl ? "نجوم" : "Stars"}</span>
            </div>
          </div>

          {/* Badge Unlocked Notification if any */}
          {reward.badgeUnlocked && (
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center gap-2 text-right">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <div className="text-xs">
                <p className="font-extrabold text-emerald-900">{isRtl ? reward.badgeUnlocked.titleAr : reward.badgeUnlocked.titleEn}</p>
                <p className="text-emerald-700">{isRtl ? reward.badgeUnlocked.descriptionAr : reward.badgeUnlocked.descriptionEn}</p>
              </div>
            </div>
          )}

          {/* Action button */}
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white font-black rounded-xl text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{isRtl ? "متابعة التعلم والتحدي 🚀" : "Continue Learning 🚀"}</span>
            <ArrowRight className={`w-4 h-4 ${isRtl ? "rotate-180" : ""}`} />
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
