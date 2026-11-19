import React, { useState, useEffect } from "react";
import {
  Mic,
  Video,
  BarChart3,
  Flame,
  Award,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Volume2,
  CheckCircle2,
  GraduationCap,
  Play,
  Presentation,
  ShieldCheck,
  FileText,
  Clock,
  Target,
  Layers,
  ChevronRight,
  Users,
  Compass,
  Trophy,
  Zap,
  Activity
} from "lucide-react";
import { StudentProfile, AppSettings } from "../types";
import { Dictionary } from "../translations";
import { IlqaaLogo } from "./IlqaaLogo";
import { GRADE_THEMES } from "../App";
import { speakMasterArabicModel, stopSpeechSynthesis, playSuccessSound } from "../lib/audioAndEffects";
import { DiagnosticPlacementModal } from "./DiagnosticPlacementModal";

interface HomeLaunchpadProps {
  student: StudentProfile;
  students: StudentProfile[];
  settings: AppSettings;
  dict: Dictionary;
  theme: any;
  onSelectStudent: (studentId: string) => void;
  onNavigate: (tab: "practice" | "oratory" | "dashboard" | "reports" | "settings" | "profile" | "experts") => void;
  onOpenPitchDeck: () => void;
}

const FEATURED_DAILY_DRILLS: Record<string, { phrase: string; meaning: string; phoneticFocus: string }> = {
  "KG": {
    phrase: "بَابٌ - بَيْتٌ - بُرْتُقَالٌ",
    meaning: "تدريب على حرف الباء بالحركات الثلاث",
    phoneticFocus: "مخرج الشفتين بانطباق كامل"
  },
  "Grade 1": {
    phrase: "كَتَبَ التِّلْمِيذُ دَرْسَهُ بِإِتْقَانٍ",
    meaning: "جملة فعلية مشكولة لتعزيز فصاحة القراءة",
    phoneticFocus: "التاء المربوطة والتنوين بالكسر"
  },
  "Grade 3": {
    phrase: "الْقِرَاءَةُ تُغَذِّي الْعَقْلَ وَتُنِيرُ الْفِكْرَ",
    meaning: "نص قيمي يعزز حب المطالعة والفصاحة",
    phoneticFocus: "الهمزة المتوسطة واللام القمرية"
  },
  "Grade 5": {
    phrase: "قَطَرُ تَمْضِي نَحْوَ الْمَجْدِ بِعَزْمِ أَبْنَائِهَا الْمُخْلِصِينَ",
    meaning: "عبارة وطنية تجسد رؤية قطر الوطنية 2030",
    phoneticFocus: "الضاد والظاء وتسكين أواخر الكلم عند الوقف"
  },
  "Grade 8": {
    phrase: "إِنَّ الْفَصَاحَةَ سِلَاحُ الْخَطِيبِ، وَالْبَيَانُ رَائِدُ التَّأْثِيرِ",
    meaning: "حكمة بلاغية عن قوة الكلمة وأثر المنبر",
    phoneticFocus: "النبر، التنغيم الصوتي، وتلوين الطبقات"
  },
  "Grade 12": {
    phrase: "قِفْ لِلْمُعَلِّمِ وَفِّهِ التَّبْجِيلاَ، كَادَ الْمُعَلِّمُ أَنْ يَكُونَ رَسُولاَ",
    meaning: "بيت شعري لأمير الشعراء أحمد شوقي",
    phoneticFocus: "الوزن العروضي والإلقاء الشعري الفصيح"
  }
};

export const HomeLaunchpad: React.FC<HomeLaunchpadProps> = ({
  student,
  students,
  settings,
  dict,
  theme,
  onSelectStudent,
  onNavigate,
  onOpenPitchDeck
}) => {
  const isRtl = settings.language === "ar";
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isDiagnosticOpen, setIsDiagnosticOpen] = useState(false);
  const [readinessScore, setReadinessScore] = useState<number>(() => {
    const validScores = student.measurements.filter(m => m.score > 0).map(m => m.score);
    return validScores.length > 0
      ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
      : 88;
  });

  const dailyDrill = FEATURED_DAILY_DRILLS[student.grade] || FEATURED_DAILY_DRILLS["Grade 5"];

  // Average score calculation
  const validScores = student.measurements.filter(m => m.score > 0).map(m => m.score);
  const avgScore = validScores.length > 0
    ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
    : 85;

  const isOratoryUnlocked = readinessScore >= 75 || student.streak >= 2;

  const handlePlayDrillAudio = () => {
    if (isPlayingAudio) {
      stopSpeechSynthesis();
      setIsPlayingAudio(false);
      return;
    }
    setIsPlayingAudio(true);
    speakMasterArabicModel(dailyDrill.phrase, {
      rate: 0.82,
      onStart: () => setIsPlayingAudio(true),
      onEnd: () => {
        setIsPlayingAudio(false);
        playSuccessSound();
      },
      onError: () => setIsPlayingAudio(false)
    });
  };

  useEffect(() => {
    return () => {
      stopSpeechSynthesis();
    };
  }, []);

  const handleDiagnosticComplete = (score: number) => {
    setReadinessScore(score);
  };

  return (
    <div className="space-y-8" id="home-launchpad-container" dir={isRtl ? "rtl" : "ltr"}>
      
      {/* Diagnostic Placement Modal */}
      <DiagnosticPlacementModal
        isOpen={isDiagnosticOpen}
        onClose={() => setIsDiagnosticOpen(false)}
        student={student}
        isRtl={isRtl}
        onCompleteDiagnostic={handleDiagnosticComplete}
      />

      {/* 1. Master Welcome Hero Card */}
      <div 
        className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#3B0715] via-[#8A1538] to-[#1F030C] text-white shadow-2xl relative overflow-hidden border border-[#D4AF37]/30"
        id="home-hero-card"
      >
        {/* Background Ambient Glows */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#B82A52]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/30 border border-[#D4AF37]/40 text-xs font-bold text-[#FDE68A]">
              <IlqaaLogo size="sm" showText={false} />
              <span>{isRtl ? "المسرع الوطني للخطابة وفصاحة اللسان 🇶🇦" : "National Speech & Oratory Accelerator 🇶🇦"}</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black font-serif tracking-tight text-white leading-snug">
              {isRtl ? `مرحباً بك يا بطل الفصاحة: ${student.nameAr}` : `Welcome, Oratory Champion: ${student.nameEn}`}
            </h1>

            <p className="text-sm sm:text-base text-amber-50/90 leading-relaxed font-sans">
              {isRtl
                ? "بوابتك الرسمية للتمكن اللغوي والخطابي: تدرّب على مخارج الحروف في مختبر التأسيس، اعتَلِ مسرح الخطابة الحي بالكاميرا، وتابع إنجازاتك في سجلك الوزاري المعتمد."
                : "Your official gateway to linguistic and rhetorical mastery: Practice phonetics in the Foundation Lab, take the live camera oratory stage, and view your ministerial achievement portfolio."}
            </p>

            {/* Micro badges status row */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 border border-white/10 text-xs text-amber-200 font-bold font-sans">
                <GraduationCap className="w-4 h-4 text-[#D4AF37]" />
                <span>{isRtl ? `${student.grade} • ${theme.nameAr}` : `${student.grade} • ${theme.nameEn}`}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 border border-white/10 text-xs text-emerald-300 font-bold font-sans">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>{isRtl ? `معدل الإتقان المعياري: ${avgScore}%` : `Mastery: ${avgScore}%`}</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-white/10 border border-white/10 text-xs text-amber-300 font-bold font-sans">
                <Flame className="w-4 h-4 text-amber-400" />
                <span>{isRtl ? `الحماس اليومي: ${student.streakDays ?? student.streak ?? 5} أيام` : `Streak: ${student.streakDays ?? student.streak ?? 5} days`}</span>
              </div>
            </div>
          </div>

          {/* Direct CTA Buttons */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-stretch gap-3 shrink-0 w-full lg:w-auto">
            <button
              onClick={() => onNavigate("oratory")}
              className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-[#D4AF37] via-[#F59E0B] to-[#B45309] hover:from-[#F59E0B] hover:to-[#D4AF37] text-slate-950 font-black text-sm shadow-xl shadow-amber-950/40 transition-all flex items-center justify-center gap-2.5 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
              id="hero-start-stage-btn"
            >
              <Play className="w-4 h-4 fill-slate-950 text-slate-950" />
              <span>{isRtl ? "اعتلاء مسرح الإلقاء الحي (المرحلة 2) 🎭" : "Enter Live Oratory Stage 🎭"}</span>
            </button>

            <button
              onClick={() => setIsDiagnosticOpen(true)}
              className="px-5 py-3 rounded-2xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-black transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
              id="hero-diagnostic-btn"
            >
              <Sparkles className="w-4 h-4 text-[#FDE68A]" />
              <span>{isRtl ? "اختبار الجاهزية والتشخيص القرائي 🏆" : "Diagnostic Readiness Test 🏆"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 1.5. Oracy Readiness Framework Card */}
      <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-r from-amber-500/10 via-[#8A1538]/10 to-amber-500/10 dark:from-[#200A15] dark:to-[#2B0813] border border-amber-300/40 dark:border-amber-900/50 flex flex-col md:flex-row items-center justify-between gap-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#B45309] text-slate-950 flex items-center justify-center font-black shadow-md shrink-0">
            <Trophy className="w-7 h-7 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-[#8A1538] dark:text-amber-300 uppercase tracking-wide">
                {isRtl ? "مؤشر الجاهزية المنبرية للطالب 🇶🇦" : "Student Oracy Readiness Status 🇶🇦"}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${isOratoryUnlocked ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300" : "bg-amber-100 text-amber-900"}`}>
                {isOratoryUnlocked ? (isRtl ? "مؤهل لاعتلاء المنبر 🟢" : "Podium Qualified 🟢") : (isRtl ? "مرحلة التأسيس 🟡" : "Foundation Stage 🟡")}
              </span>
            </div>
            <h3 className="text-base font-black font-serif text-slate-900 dark:text-white mt-1">
              {isRtl ? `درجة الجاهزية الحالية: ${readinessScore}% — مسار فصاحة اللسان` : `Current Readiness: ${readinessScore}% — Speech Fluency Track`}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {isRtl
                ? "يتم احتساب الجاهزية بناءً على سلامة مخارج الحروف، طلاقة القراءة، وتلوين النبر الصوتي."
                : "Readiness is computed based on phonetics accuracy, reading fluency, and vocal inflection."}
            </p>
          </div>
        </div>

        <button
          onClick={() => setIsDiagnosticOpen(true)}
          className="px-5 py-2.5 rounded-xl bg-[#8A1538] hover:bg-[#68102B] text-white text-xs font-black shadow-md flex items-center gap-2 cursor-pointer transition-all shrink-0"
        >
          <Activity className="w-4 h-4 text-amber-300" />
          <span>{isRtl ? "إعادة الفحص التشخيصي" : "Retake Diagnostic"}</span>
        </button>
      </div>

      {/* 2. The 3 Core Stage Gateways (Dedicated Student Worlds) */}
      <div className="space-y-4" id="three-core-stages-section">
        <div>
          <h2 className="text-xl sm:text-2xl font-black font-serif text-slate-900 dark:text-white flex items-center gap-2">
            <span>{isRtl ? "المراحل التدريبية المخصصة للطالب" : "Your 3 Core Developmental Stages"}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-sans">
            {isRtl
              ? "اختر إحدى المراحل الثلاث للانطلاق في رحلتك التعليمية:"
              : "Select a stage below to launch into your personalized learning journey:"}
          </p>
        </div>

        {/* 3 Large Contextual Gate Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          
          {/* GATE 1: Foundation & Articulation Lab */}
          <div 
            onClick={() => onNavigate("practice")}
            className="group relative bg-white dark:bg-[#1C0A15] rounded-3xl p-5 sm:p-6 border-2 border-slate-200 dark:border-[#3D1426] hover:border-[#8A1538] dark:hover:border-amber-400 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer overflow-hidden"
            id="stage-card-1-foundation"
          >
            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-[#8A1538]/10 dark:bg-[#8A1538]/30 border border-[#8A1538]/20 text-[#8A1538] dark:text-amber-300 flex items-center justify-center shadow-inner group-hover:bg-[#8A1538] group-hover:text-white transition-colors">
                  <Mic className="w-6 h-6" />
                </div>
                <span className="text-xs font-black px-3 py-1 rounded-full bg-[#8A1538]/10 dark:bg-[#8A1538]/30 text-[#8A1538] dark:text-amber-300 border border-[#8A1538]/20">
                  {isRtl ? "المرحلة الأولى" : "Stage 1"}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold font-serif text-slate-900 dark:text-white group-hover:text-[#8A1538] dark:group-hover:text-amber-300 transition-colors">
                  {isRtl ? "مختبر التأسيس ومخارج الحروف" : "Foundation & Phonics Lab"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed font-sans">
                  {isRtl
                    ? "التدرب الفردي على مخارج الحروف، ضبط الحركات الإعرابية، الاستماع للنموذج الفصيح، ومقارنة تسجيل صوتك."
                    : "Master Arabic phonetics, diacritics, listen to master speaker models, and compare your voice recordings."}
                </p>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 font-sans">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{isRtl ? "استماع للنموذج الفصيح ومقارنة التسجيل" : "Master Audio & Voice Comparison"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{isRtl ? "تصحيح فوري للكلمات والحركات" : "Instant Word & Harakat Correction"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>{isRtl ? "ألعاب تركيب الجمل وبنك الأسئلة" : "Word Assembly & Interactive Quiz"}</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-black text-[#8A1538] dark:text-amber-300 group-hover:translate-x-1 transition-transform">
              <span>{isRtl ? "دخول مختبر التأسيس الآن ➜" : "Enter Foundation Lab ➜"}</span>
              {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </div>
          </div>

          {/* GATE 2: The Oratory Stage (Featured Live Multimodal) */}
          <div 
            onClick={() => onNavigate("oratory")}
            className="group relative bg-gradient-to-br from-[#1F040C] via-[#330715] to-[#120207] text-white rounded-3xl p-5 sm:p-6 border-2 border-[#D4AF37]/60 shadow-lg hover:shadow-2xl hover:border-[#D4AF37] transition-all duration-300 flex flex-col justify-between cursor-pointer overflow-hidden ring-2 ring-[#D4AF37]/20"
            id="stage-card-2-oratory"
          >
            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#D4AF37] flex items-center justify-center shadow-inner group-hover:bg-[#D4AF37] group-hover:text-slate-950 transition-colors">
                  <Video className="w-6 h-6" />
                </div>
                <span className="text-xs font-black px-3 py-1 rounded-full bg-[#D4AF37]/20 text-[#FDE68A] border border-[#D4AF37]/40">
                  {isRtl ? "المرحلة الثانية • مباشر 🇶🇦" : "Stage 2 • Live Arena 🇶🇦"}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold font-serif text-white group-hover:text-[#FDE68A] transition-colors">
                  {isRtl ? "مسرح الخطابة والمنبر الحي" : "The Live Oratory Stage"}
                </h3>
                <p className="text-xs text-amber-100/80 mt-1.5 leading-relaxed font-sans">
                  {isRtl
                    ? "استوديو تفاعلي متعدد الوسائط بالكاميرا والذكاء الاصطناعي لتحليل لغة الجسد، التواصل البصري، والملقن الذكي المباشر."
                    : "Multimodal AI studio analyzing posture, eye contact, hand gestures, and real-time smart prompter coaching."}
                </p>
              </div>

              <div className="space-y-2 pt-3 border-t border-white/10 text-xs text-amber-100 font-sans">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <span>{isRtl ? "تتبع الاتصال البصري واستقامة الجسد" : "Eye Contact & Posture Tracking"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <span>{isRtl ? "قياس سرعة الإلقاء (WPM) ونبرة الصوت" : "Speech Pacing (WPM) & Vocal Range"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <span>{isRtl ? "بطاقة تحكيم خطابي معتمدة رسمياً" : "Official Ministerial Scorecard"}</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-4 border-t border-white/10 flex items-center justify-between text-xs font-black text-[#FDE68A] group-hover:translate-x-1 transition-transform">
              <span>{isRtl ? "اعتلاء مسرح الإلقاء والمنبر ➜" : "Take the Oratory Stage ➜"}</span>
              {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </div>
          </div>

          {/* GATE 3: Student Portfolio & Badges */}
          <div 
            onClick={() => onNavigate("profile")}
            className="group relative bg-white dark:bg-[#1C0A15] rounded-3xl p-5 sm:p-6 border-2 border-slate-200 dark:border-[#3D1426] hover:border-[#D4AF37] shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between cursor-pointer overflow-hidden"
            id="stage-card-3-portfolio"
          >
            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 flex items-center justify-center shadow-inner group-hover:bg-[#D4AF37] group-hover:text-slate-950 transition-colors">
                  <Award className="w-6 h-6" />
                </div>
                <span className="text-xs font-black px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  {isRtl ? "سجل إنجازي" : "My Portfolio"}
                </span>
              </div>

              <div>
                <h3 className="text-lg font-bold font-serif text-slate-900 dark:text-white group-hover:text-[#8A1538] dark:group-hover:text-amber-300 transition-colors">
                  {isRtl ? "سجل إنجازي وشهادات التميز" : "My Portfolio & Certificates"}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 leading-relaxed font-sans">
                  {isRtl
                    ? "استعراض تسجيلاتك السابقة، الأوسمة والنجوم التي حققتها، وطباعة شهادة فصاحة اللسان الرسمية."
                    : "Review your speech recordings, badges, stars, and print your official certificate of oratory excellence."}
                </p>
              </div>

              <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 font-sans">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <span>{isRtl ? "أرشيف التسجيلات الصوتية والمرئية" : "Audio & Video Performance Archive"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <span>{isRtl ? "أوسمة التميز الوزارية ورصيد XP" : "Ministerial Badges & XP Balance"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <span>{isRtl ? "شهادة فصاحة اللسان المعتمدة للطباعة" : "Printable Official Certificate"}</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-black text-[#8A1538] dark:text-amber-300 group-hover:translate-x-1 transition-transform">
              <span>{isRtl ? "عرض ملف إنجازي وشهاداتي ➜" : "View My Portfolio ➜"}</span>
              {isRtl ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
            </div>
          </div>
        </div>

        {/* Stage 4 Gateway Banner: Human Expert Evaluation & Advisory Council */}
        <div 
          onClick={() => onNavigate("experts")}
          className="group p-5 rounded-3xl bg-gradient-to-r from-amber-500/10 via-[#8A1538]/10 to-amber-500/15 dark:from-[#250D1D] dark:via-[#1A0914] dark:to-[#2B0E1F] border-2 border-amber-300/70 dark:border-amber-900/60 hover:border-[#8A1538] dark:hover:border-amber-400 shadow-sm hover:shadow-lg transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer"
          id="stage-4-experts-gateway-card"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#8A1538] text-white flex items-center justify-center shadow-md shrink-0 group-hover:scale-105 transition-transform">
              <GraduationCap className="w-6 h-6 text-[#FDE68A]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black font-serif text-slate-900 dark:text-white">
                  {isRtl ? "المرحلة الرابعة: التقييم البشري المتخصص ومجلس إلقاء الاستشاري" : "Stage 4: Specialized Human Expert Evaluation"}
                </span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#D4AF37] text-slate-950 font-sans shadow-xs">
                  {isRtl ? "الخبراء والمستشارون" : "Council & Network"}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 font-sans">
                {isRtl
                  ? "أتممت مرحلة التدريب والتحليل بالذكاء الاصطناعي؟ يمكنك الآن استكشاف نخبة الخبراء والمستشارين الأكاديميين للاطلاع على التقييم البشري المعتمد."
                  : "Completed your AI speech coaching? Explore our esteemed advisory council and certified expert network for specialized guidance."}
              </p>
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onNavigate("experts");
            }}
            className="px-4 py-2.5 rounded-xl bg-[#8A1538] hover:bg-[#5C0E25] text-white font-black text-xs transition-all flex items-center gap-2 shadow-xs cursor-pointer shrink-0"
          >
            <span>{isRtl ? "استكشف الخبراء والمستشارين ➜" : "Explore Experts ➜"}</span>
          </button>
        </div>
      </div>

      {/* 3. Featured Daily Drill with Real Audio Synthesis */}
      <div className="rounded-3xl bg-white dark:bg-[#1C0A15] border border-slate-200 dark:border-[#3D1426] p-6 sm:p-7 shadow-sm space-y-4" id="daily-drill-section">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black font-serif text-slate-900 dark:text-white">
                {isRtl ? `تحدي الفصاحة اليومي (${student.grade})` : `Daily Speech Challenge (${student.grade})`}
              </h3>
              <p className="text-xs text-slate-400 font-sans">
                {dailyDrill.meaning} • {dailyDrill.phoneticFocus}
              </p>
            </div>
          </div>

          <button
            onClick={handlePlayDrillAudio}
            disabled={isPlayingAudio}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
              isPlayingAudio
                ? "bg-amber-500 text-white animate-pulse"
                : "bg-amber-50 hover:bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200 border border-amber-200"
            }`}
          >
            <Volume2 className={`w-4 h-4 ${isPlayingAudio ? "animate-bounce" : ""}`} />
            <span>{isPlayingAudio ? (isRtl ? "جارٍ الاستماع..." : "Playing...") : (isRtl ? "🔊 استمع للنموذج الفصيح" : "🔊 Listen Model")}</span>
          </button>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#15050D] border border-slate-200 dark:border-[#3D1426] text-center">
          <p className="text-xl sm:text-2xl font-black font-serif text-[#8A1538] dark:text-[#FDE68A] leading-relaxed">
            {dailyDrill.phrase}
          </p>
        </div>
      </div>
    </div>
  );
};
