import React, { useState } from "react";
import { 
  Users, 
  ArrowLeft, 
  ArrowRight, 
  Sparkles, 
  Award, 
  CheckCircle2, 
  ChevronRight,
  ShieldCheck,
  UserCheck
} from "lucide-react";
import { AcademicExpert, getRecommendedExperts } from "../../data/expertsData";
import { ExpertProfileModal } from "./ExpertProfileModal";

interface ExpertHandoffCardProps {
  onExploreExperts: (category?: string) => void;
  isRtl?: boolean;
  scorecard?: {
    eyeContact?: number;
    posture?: number;
    vocalVariety?: number;
    structureAndLogic?: number;
    conviction?: number;
    overallScore?: number;
  };
  studentGrade?: string;
  className?: string;
}

export const ExpertHandoffCard: React.FC<ExpertHandoffCardProps> = ({
  onExploreExperts,
  isRtl = true,
  scorecard,
  studentGrade,
  className = ""
}) => {
  const [selectedExpert, setSelectedExpert] = useState<AcademicExpert | null>(null);

  // Isolated Mock Recommendation Logic
  const recommendedExperts = getRecommendedExperts({
    oratoryScorecard: scorecard,
    studentGrade
  });

  return (
    <>
      <div 
        className={`bg-gradient-to-br from-white via-amber-50/40 to-rose-50/30 dark:from-[#1C0A15] dark:via-[#200A15] dark:to-[#160610] rounded-3xl p-6 sm:p-7 border-2 border-amber-300/80 dark:border-amber-900/60 shadow-lg space-y-5 transition-all ${className}`}
        id="student-expert-handoff-card"
        dir={isRtl ? "rtl" : "ltr"}
      >
        {/* Top Header & Context */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-amber-200/60 dark:border-amber-900/40">
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#8A1538] text-white flex items-center justify-center shadow-md shrink-0">
              <Users className="w-6 h-6 text-[#FDE68A]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black font-serif text-slate-900 dark:text-white">
                  {isRtl ? "التقييم مع خبير" : "Expert Evaluation"}
                </h3>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#8A1538] dark:text-amber-300 border border-[#D4AF37]/40">
                  {isRtl ? "المرحلة الرابعة • استشاري" : "Stage 4 • Advisory"}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 font-sans leading-relaxed">
                {isRtl
                  ? "أتممت مرحلة التدريب والتحليل بالذكاء الاصطناعي. يمكنك الآن الانتقال إلى مستوى التقييم البشري المتخصص."
                  : "You have completed this stage of AI training. You are now ready for expert evaluation."}
              </p>
            </div>
          </div>

          {/* Primary Action Button to explore experts */}
          <button
            onClick={() => onExploreExperts()}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#8A1538] via-[#A01B42] to-[#5C0E25] hover:from-[#5C0E25] text-white font-black text-xs transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer shrink-0"
            id="explore-experts-btn"
          >
            <span>{isRtl ? "استكشف الخبراء" : "Explore Experts"}</span>
            {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </button>
        </div>

        {/* Recommended Experts Section based on isolated recommendation logic */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-black text-slate-700 dark:text-slate-200 flex items-center gap-1.5 font-sans">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              <span>{isRtl ? "خبراء مقترحون لك بناءً على نتائج تحليلك الأخير:" : "Recommended Experts For You:"}</span>
            </span>
            <span className="text-[11px] text-[#8A1538] dark:text-amber-300 font-bold hidden sm:inline">
              {isRtl ? "توافق مع نقاط التطوير اللغوية والمنبرية" : "Matched with developmental needs"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {recommendedExperts.map((exp) => (
              <div 
                key={exp.id}
                onClick={() => setSelectedExpert(exp)}
                className="group p-3.5 rounded-2xl bg-white dark:bg-[#14070E] border border-amber-200/70 dark:border-[#3D1426] hover:border-[#8A1538] dark:hover:border-amber-400 shadow-xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl overflow-hidden border border-amber-200 shrink-0 bg-slate-900">
                    <img 
                      src={exp.photo} 
                      alt={isRtl ? exp.fullNameArabic : exp.fullNameEnglish}
                      className="w-full h-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white truncate group-hover:text-[#8A1538] dark:group-hover:text-amber-300 transition-colors">
                      {isRtl ? exp.fullNameArabic : exp.fullNameEnglish}
                    </h4>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                      {isRtl ? exp.titleArabic : exp.titleEnglish}
                    </p>
                    <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block truncate mt-0.5">
                      {exp.specialties[0]}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] font-bold text-[#8A1538] dark:text-amber-300">
                  <span>{isRtl ? "عرض الملف التعريفي" : "View Profile"}</span>
                  {isRtl ? <ChevronRight className="w-3.5 h-3.5 rotate-180" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Expert Profile Modal */}
      <ExpertProfileModal
        expert={selectedExpert}
        isOpen={Boolean(selectedExpert)}
        onClose={() => setSelectedExpert(null)}
        isRtl={isRtl}
      />
    </>
  );
};
