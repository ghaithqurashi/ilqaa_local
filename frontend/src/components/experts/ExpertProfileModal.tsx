import React from "react";
import { 
  X, 
  MapPin, 
  Building2, 
  Globe2, 
  GraduationCap, 
  Award, 
  CheckCircle2, 
  Sparkles, 
  BookOpen, 
  Clock, 
  ShieldCheck, 
  ExternalLink,
  Calendar,
  Lock
} from "lucide-react";
import { AcademicExpert } from "../../data/expertsData";

interface ExpertProfileModalProps {
  expert: AcademicExpert | null;
  isOpen: boolean;
  onClose: () => void;
  isRtl: boolean;
  onSelectCategory?: (category: string) => void;
}

export const ExpertProfileModal: React.FC<ExpertProfileModalProps> = ({
  expert,
  isOpen,
  onClose,
  isRtl
}) => {
  if (!isOpen || !expert) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div 
        className="relative z-10 w-full max-w-3xl bg-white dark:bg-[#14070E] rounded-3xl shadow-2xl border border-slate-200 dark:border-[#3D1426] overflow-hidden my-6 max-h-[92vh] flex flex-col"
        dir={isRtl ? "rtl" : "ltr"}
      >
        {/* Top Header Banner with Qatari Maroon & Gold Accent */}
        <div className="relative bg-gradient-to-r from-[#2B0813] via-[#8A1538] to-[#14070E] text-white p-6 sm:p-8 shrink-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-radial from-[#D4AF37]/15 to-transparent rounded-full -mr-20 -mt-20 pointer-events-none" />

          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 left-4 sm:top-5 sm:left-5 p-2 rounded-2xl bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-all cursor-pointer z-10"
            aria-label="Close profile"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6 relative z-0">
            {/* Large Professional Photo */}
            <div className="relative shrink-0">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border-2 border-[#D4AF37]/60 shadow-xl bg-slate-900">
                <img
                  src={expert.photo}
                  alt={isRtl ? expert.fullNameArabic : expert.fullNameEnglish}
                  className="w-full h-full object-cover object-top"
                  referrerPolicy="no-referrer"
                />
              </div>
              {expert.councilMember && (
                <div 
                  className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full bg-[#D4AF37] text-slate-950 text-[10px] font-black border border-amber-300 shadow-md flex items-center gap-1"
                  title="عضو مجلس إلقاء الاستشاري"
                >
                  <ShieldCheck className="w-3 h-3" />
                  <span>{isRtl ? "مجلس استشاري" : "Council"}</span>
                </div>
              )}
            </div>

            {/* Header Text */}
            <div className="text-center sm:text-start min-w-0 space-y-1.5 flex-1">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                <span className="text-[11px] font-bold text-amber-300 bg-white/10 px-2.5 py-0.5 rounded-lg border border-white/10">
                  {expert.countryFlag} {expert.country}
                </span>
                {expert.councilCategory && (
                  <span className="text-[11px] font-bold text-amber-200 bg-[#D4AF37]/20 px-2.5 py-0.5 rounded-lg border border-[#D4AF37]/30">
                    {isRtl ? expert.councilCategory : expert.councilCategoryEn}
                  </span>
                )}
              </div>

              <h2 className="text-xl sm:text-2xl font-black font-serif text-white tracking-tight">
                {isRtl ? expert.fullNameArabic : expert.fullNameEnglish}
              </h2>
              <p className="text-xs sm:text-sm text-amber-100 font-medium leading-snug">
                {isRtl ? expert.titleArabic : expert.titleEnglish}
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1 text-xs text-slate-200">
                <span className="flex items-center gap-1.5 opacity-90">
                  <Building2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>{isRtl ? expert.organization : expert.organizationEn}</span>
                </span>
                <span className="opacity-40">·</span>
                <span className="flex items-center gap-1.5 opacity-90">
                  <Globe2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>{expert.languages.join(" • ")}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable Body Content */}
        <div className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1">
          
          {/* Biography */}
          <div className="space-y-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 font-sans flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#8A1538] dark:text-amber-400" />
              <span>{isRtl ? "نبذة أكاديمية ومهنية" : "Academic & Professional Biography"}</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-sans bg-slate-50 dark:bg-[#1A0914] p-4 rounded-2xl border border-slate-100 dark:border-[#3D1426]">
              {isRtl ? expert.bioArabic : expert.bioEnglish}
            </p>
          </div>

          {/* Section: يمكن لهذا الخبير المساعدة في (Mandatory Competencies Section) */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 font-sans flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D4AF37]" />
              <span>{isRtl ? "يمكن لهذا الخبير المساعدة في:" : "This Expert Can Help With:"}</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {expert.competencies.map((comp, idx) => (
                <div 
                  key={idx}
                  className="p-3 rounded-2xl bg-amber-500/5 dark:bg-[#200A15] border border-amber-500/20 text-slate-800 dark:text-amber-200 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span className="text-xs font-bold leading-tight">{comp}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Specialties & Supported Educational Levels */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Main Specialties */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1A0914] border border-slate-100 dark:border-[#3D1426] space-y-2">
              <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-[#8A1538] dark:text-amber-300" />
                <span>{isRtl ? "التخصصات الدقيقة" : "Core Specializations"}</span>
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {expert.specialties.map((sp, idx) => (
                  <span 
                    key={idx}
                    className="text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-[#250D1D] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-[#3D1426]"
                  >
                    {sp}
                  </span>
                ))}
              </div>
            </div>

            {/* Educational Levels Supported */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#1A0914] border border-slate-100 dark:border-[#3D1426] space-y-2">
              <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <GraduationCap className="w-3.5 h-3.5 text-[#8A1538] dark:text-amber-300" />
                <span>{isRtl ? "المراحل التعليمية المستهدفة" : "Educational Levels Supported"}</span>
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {expert.educationLevels.map((lvl, idx) => (
                  <span 
                    key={idx}
                    className="text-[11px] font-medium text-[#8A1538] dark:text-amber-300 bg-amber-50 dark:bg-[#2A0E1F] px-2.5 py-1 rounded-lg border border-amber-200 dark:border-amber-900/40"
                  >
                    {lvl}
                  </span>
                ))}
              </div>
            </div>

          </div>

          {/* Evaluation Focus Areas */}
          {expert.evaluationFocusAreas && expert.evaluationFocusAreas.length > 0 && (
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>{isRtl ? "محاور التقييم والملاحظات التي يركز عليها الخبير:" : "Key Evaluation Focus Areas:"}</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {expert.evaluationFocusAreas.map((area, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-[#1A0914] text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-[#2D0F1E]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#8A1538] dark:bg-amber-400 shrink-0" />
                    <span>{area}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Academic Degrees & Certifications */}
          {expert.academicDegrees && expert.academicDegrees.length > 0 && (
            <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-slate-500" />
                <span>{isRtl ? "المؤهلات الأكاديمية والدرجات العلمية:" : "Academic Degrees:"}</span>
              </h4>
              <div className="space-y-2">
                {expert.academicDegrees.map((deg, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-[#180813] border border-slate-100 dark:border-[#2D0F1E] text-xs">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white">{deg.degree}</p>
                      <p className="text-[11px] text-slate-500">{deg.institution}</p>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">{deg.year}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Bottom Bar with Mandatory Disabled / Future-State CTA */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-[#160710] border-t border-slate-200 dark:border-[#3D1426] flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Lock className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              {isRtl 
                ? "جلسات التقييم المباشر مع الخبراء ستُتاح رسمياً في المرحلة القادمة."
                : "1-on-1 human expert evaluations will be activated in upcoming platform releases."}
            </span>
          </div>

          {/* Disabled CTA per instructions */}
          <button
            disabled
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold text-xs cursor-not-allowed flex items-center justify-center gap-2 border border-slate-300 dark:border-slate-700"
            title="التقييم مع الخبير – قريباً"
          >
            <span>{isRtl ? "التقييم مع الخبير – قريباً" : "Expert Evaluation – Coming Soon"}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
