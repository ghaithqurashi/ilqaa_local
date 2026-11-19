import React, { useState } from "react";
import {
  Mic,
  Video,
  BarChart3,
  Award,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  GraduationCap,
  Users,
  Building2,
  CheckCircle2,
  LogIn,
  Presentation,
  Play,
  FileText,
  Star,
  Globe,
  Moon,
  Sun,
  Shield,
  BookOpen
} from "lucide-react";
import { UserSession } from "../types";
import { DEMO_USERS } from "../data/userSessions";
import { MinistryLogo } from "./MinistryLogo";
import { IlqaaLogo } from "./IlqaaLogo";

interface LandingPageProps {
  onLogin: (user: UserSession) => void;
  onOpenPitchDeck: () => void;
  onBackToMainHome?: () => void;
  onOpenStudentSelector?: () => void;
  isRtl?: boolean;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onLogin,
  onOpenPitchDeck,
  onBackToMainHome,
  onOpenStudentSelector,
  isRtl = true,
  isDarkMode = true,
  onToggleDarkMode
}) => {
  const [selectedRole, setSelectedRole] = useState<"student" | "teacher" | "admin">("student");
  const [showLoginModal, setShowLoginModal] = useState<boolean>(false);
  const [selectedDemoUserId, setSelectedDemoUserId] = useState<string>("user-student-g6");

  const students = DEMO_USERS.filter((u) => u.role === "student");
  const teachers = DEMO_USERS.filter((u) => u.role === "teacher");
  const admins = DEMO_USERS.filter((u) => u.role === "admin");

  const handleQuickLogin = (user: UserSession) => {
    onLogin(user);
  };

  const handleModalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = DEMO_USERS.find((u) => u.id === selectedDemoUserId) || DEMO_USERS[0];
    onLogin(user);
  };

  return (
    <div
      className={`min-h-screen ${
        isDarkMode ? "dark bg-[#0A0306] text-slate-100" : "bg-[#FDFBF7] text-slate-900"
      } flex flex-col font-sans selection:bg-[#8A1538] selection:text-white transition-colors duration-300`}
      dir={isRtl ? "rtl" : "ltr"}
      id="ilqaa-official-landing-page"
    >
      {/* 1. Top Government Banner: State of Qatar Official Identity */}
      <div
        className="w-full bg-[#8A1538] text-white px-4 sm:px-8 py-1.5 flex items-center justify-between text-[11px] font-sans border-b border-[#5C0E25]"
        id="top-national-bar"
      >
        <div className="flex items-center gap-3">
          <span className="font-bold flex items-center gap-1.5">
            <span>🇶🇦</span>
            <span>البوابة الوطنية للتعليم • دولة قطر</span>
          </span>
          <span className="hidden sm:inline text-white/40">|</span>
          <span className="hidden sm:inline text-white/85">رؤية قطر الوطنية 2030 • ركيزة التنمية البشرية</span>
        </div>

        <div className="flex items-center gap-4 text-[10px]">
          <span className="text-amber-200/90 font-medium">العام الأكاديمي 2025 / 2026</span>
          <span className="text-white/40">•</span>
          <span className="text-white/80">منصة معتمدة رسمياً</span>
        </div>
      </div>

      {/* 2. Official National Top Header */}
      <header
        className="sticky top-0 z-40 bg-white/95 dark:bg-[#12050D]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-[#3D1426] px-4 sm:px-8 py-3 flex items-center justify-between shadow-xs transition-colors duration-300"
        id="landing-header"
      >
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Official Qatar Ministry of Education Logo (Matching user's exact uploaded crest) */}
          <MinistryLogo
            size="md"
            showText={true}
            textColor={isDarkMode ? "gold" : "maroon"}
          />

          <div className="hidden lg:block h-9 w-[1px] bg-slate-200 dark:bg-slate-800" />

          {/* Ilqaa Brand */}
          <div className="hidden lg:block">
            <IlqaaLogo size="sm" showText={true} />
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Back to ilqaa.ai Global Home */}
          {onBackToMainHome && (
            <button
              onClick={onBackToMainHome}
              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#1E0C17] hover:bg-slate-200 dark:hover:bg-[#2B1020] text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-[#3D1426] text-xs font-bold font-sans transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="العودة لبوابة إلقاء الرئيسية (ilqaa.ai)"
              id="landing-back-to-ilqaa-btn"
            >
              <Globe className="w-3.5 h-3.5 text-[#8A1538] dark:text-[#FDE68A]" />
              <span className="hidden md:inline">بوابة ilqaa.ai</span>
            </button>
          )}

          {/* Night Vision / Dark Mode Toggle Button */}
          {onToggleDarkMode && (
            <button
              onClick={onToggleDarkMode}
              className="px-3 py-2 rounded-xl bg-slate-100 dark:bg-[#1E0C17] hover:bg-slate-200 dark:hover:bg-[#2B1020] text-slate-800 dark:text-[#FDE68A] border border-slate-300 dark:border-[#3D1426] text-xs font-bold font-sans transition-all flex items-center gap-1.5 cursor-pointer shadow-xs"
              title={isDarkMode ? "التبديل إلى الوضع النهاري" : "تفعيل وضع الرؤية الليلية"}
              id="landing-dark-mode-toggle-btn"
            >
              {isDarkMode ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span className="hidden sm:inline">الوضع النهاري ☀️</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-[#8A1538]" />
                  <span className="hidden sm:inline">رؤية ليلية 🌙</span>
                </>
              )}
            </button>
          )}

          {/* Ministry Pitch Deck Modal Trigger */}
          <button
            onClick={onOpenPitchDeck}
            className="px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-[#251307] hover:bg-amber-100 dark:hover:bg-[#331C0B] text-[#8A1538] dark:text-[#FDE68A] text-xs font-bold font-sans border border-amber-300 dark:border-amber-900/50 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
            id="landing-pitch-deck-btn"
          >
            <Presentation className="w-4 h-4 text-[#D4AF37]" />
            <span className="hidden sm:inline">ملف العرض للوزارة 🇶🇦</span>
            <span className="sm:hidden">العرض 🇶🇦</span>
          </button>

          {/* Login Button */}
          <button
            onClick={() => setShowLoginModal(true)}
            className="px-4 sm:px-5 py-2 rounded-xl bg-[#8A1538] hover:bg-[#5C0E25] text-white text-xs sm:text-sm font-black font-serif shadow-md shadow-[#8A1538]/25 transition-all flex items-center gap-2 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
            id="landing-login-trigger-btn"
          >
            <LogIn className="w-4 h-4" />
            <span>تسجيل الدخول</span>
          </button>
        </div>
      </header>

      {/* 3. Hero Section: National Mission & Gateways */}
      <section
        className={`relative overflow-hidden pt-10 sm:pt-14 pb-14 sm:pb-20 px-4 sm:px-8 transition-colors duration-300 ${
          isDarkMode
            ? "bg-gradient-to-b from-[#14050D] via-[#0E0309] to-[#0A0306]"
            : "bg-gradient-to-b from-[#FAF4EC] via-[#FDFBF7] to-[#FAF8F5]"
        }`}
      >
        {/* Decorative Background Ambient Glows */}
        <div className="absolute top-10 right-1/4 w-96 h-96 bg-[#8A1538]/10 dark:bg-[#8A1538]/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#D4AF37]/10 dark:bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto space-y-8 relative z-10">
          {/* Ministerial Patronage Badge */}
          <div className="flex justify-center">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white dark:bg-[#1E0C17] border border-[#8A1538]/30 dark:border-[#D4AF37]/40 shadow-sm text-xs font-bold text-[#8A1538] dark:text-[#FDE68A]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>مبادرة المسرع الوطني للخطابة وفصاحة اللسان • مدارس دولة قطر 🇶🇦</span>
            </div>
          </div>

          {/* Main Headline with high contrast */}
          <div className="text-center space-y-4 max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-serif tracking-tight leading-[1.25] text-slate-900 dark:text-white">
              منظومة <span className="text-[#8A1538] dark:text-[#F43F5E] font-black">إلْقَـــاء</span> للتمكين الخطابي
              <br />
              <span className="text-2xl sm:text-4xl text-[#B45309] dark:text-[#FDE68A] font-serif font-black">
                بمعايير وزارة التربية والتعليم والتعليم العالي
              </span>
            </h1>
            <p className="text-sm sm:text-base md:text-lg text-slate-700 dark:text-slate-200 font-sans max-w-3xl mx-auto leading-relaxed">
              منصة ذكية متكاملة تجمع بين مختبر التأسيس الصوتي ومخارج الحروف، ومسرح الخطابة الحي بالكاميرا والذكاء الاصطناعي، ولوحة الكفايات الوطنية لرصد وانتداب المواهب القطرية الواعدة.
            </p>
          </div>

          {/* 3 User Role Gate Cards (Immediate 1-Click Access) */}
          <div className="pt-6">
            <div className="text-center mb-6">
              <span className="text-xs font-black uppercase tracking-widest text-[#8A1538] dark:text-[#FDE68A] bg-[#8A1538]/10 dark:bg-[#8A1538]/30 px-4 py-1.5 rounded-full border border-[#8A1538]/20 dark:border-[#D4AF37]/30">
                اختر بوابتك وسجل الدخول فوراً
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 max-w-5xl mx-auto">
              
              {/* CARD 1: STUDENT PORTAL */}
              <div 
                onClick={() => {
                  if (onOpenStudentSelector) {
                    onOpenStudentSelector();
                  } else {
                    handleQuickLogin(students[0] || DEMO_USERS[0]);
                  }
                }}
                className="bg-white dark:bg-[#14070E] rounded-3xl p-6 sm:p-7 border-2 border-amber-200 dark:border-[#3D1426] hover:border-[#8A1538] dark:hover:border-[#D4AF37] shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group cursor-pointer"
                id="portal-card-student"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-[#251307] text-[#8A1538] dark:text-[#FDE68A] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-black px-3 py-1 rounded-full bg-amber-50 dark:bg-[#251307] text-amber-900 dark:text-[#FDE68A] border border-amber-300 dark:border-amber-800/60">
                      بوابة الطالب
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold font-serif text-slate-900 dark:text-white group-hover:text-[#8A1538] dark:group-hover:text-[#FDE68A] transition-colors">
                      دخول الطالب والمتعلم
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed font-sans">
                      تدرّب على مخارج الحروف، اعتَلِ مسرح الإلقاء الحي بالكاميرا، وتابع رصيد أوسمتك وسجلك التراكمي لجميع الصفوف.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1C0A15] border border-slate-200 dark:border-[#2F0C1B] text-xs text-slate-700 dark:text-slate-200 space-y-1.5 font-sans">
                    <div className="font-bold text-[#8A1538] dark:text-[#FDE68A] flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>قائمة الطلاب متوفرة (13 صفاً)</span>
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 dark:bg-[#381607] text-amber-800 dark:text-amber-300 font-black">
                        KG - 12
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400">
                      اختر طالبك لتخصيص المؤشرات والمعايير الصفية فوراً
                    </div>
                  </div>
                </div>

                <div className="pt-5 space-y-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onOpenStudentSelector) {
                        onOpenStudentSelector();
                      } else {
                        handleQuickLogin(students[0] || DEMO_USERS[0]);
                      }
                    }}
                    className="w-full py-3 rounded-2xl bg-[#8A1538] hover:bg-[#5C0E25] text-white text-xs font-black shadow-md shadow-[#8A1538]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>اختر الطالب وابدأ الدخول</span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickLogin(students[0] || DEMO_USERS[0]);
                    }}
                    className="w-full py-2 rounded-xl bg-slate-100 dark:bg-[#1E0C17] hover:bg-slate-200 dark:hover:bg-[#2B1020] text-slate-700 dark:text-slate-300 text-[11px] font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>دخول سريع: ناصر بن مبارك (الصف السادس)</span>
                  </button>
                </div>
              </div>

              {/* CARD 2: TEACHER & COORDINATOR PORTAL */}
              <div 
                onClick={() => handleQuickLogin(teachers[0] || DEMO_USERS.find(u => u.role === "teacher") || DEMO_USERS[4])}
                className="bg-white dark:bg-[#14070E] rounded-3xl p-6 sm:p-7 border-2 border-indigo-200/80 dark:border-[#3D1426] hover:border-indigo-600 dark:hover:border-indigo-400 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group cursor-pointer"
                id="portal-card-teacher"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-[#160D1F] text-indigo-700 dark:text-indigo-300 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                      <Users className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-black px-3 py-1 rounded-full bg-indigo-50 dark:bg-[#160D1F] text-indigo-900 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-900/50">
                      بوابة المعلم والمنسق
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold font-serif text-slate-900 dark:text-white group-hover:text-indigo-900 dark:group-hover:text-indigo-300 transition-colors">
                      دخول المعلم ومنسق المادة
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed font-sans">
                      لوحة تحليل الكفايات، تقرير أفضل الطلاب في كل معيار صفي، وقوائم التدخل والدعم الأكاديمي.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#1C0A15] border border-slate-200 dark:border-[#2F0C1B] text-xs text-slate-700 dark:text-slate-200 space-y-1 font-sans">
                    <div className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>الحساب: أ. محمد الأنصاري</span>
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400">
                      منسق مادة اللغة العربية والخطابة • الصفوف (5 - 8)
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickLogin(teachers[0] || DEMO_USERS.find(u => u.role === "teacher") || DEMO_USERS[4]);
                    }}
                    className="w-full py-3 rounded-2xl bg-indigo-900 hover:bg-indigo-950 dark:bg-indigo-700 dark:hover:bg-indigo-600 text-white text-xs font-black shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>دخول لوحة المعلم والمنسق ➜</span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* CARD 3: MINISTRY & ADMIN PORTAL */}
              <div 
                onClick={() => handleQuickLogin(admins[0] || DEMO_USERS.find(u => u.role === "admin") || DEMO_USERS[5])}
                className="bg-gradient-to-br from-[#2B0813] via-[#8A1538] to-[#120207] text-white rounded-3xl p-6 sm:p-7 border-2 border-[#D4AF37] shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group cursor-pointer"
                id="portal-card-admin"
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/20 text-[#FDE68A] flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                      <Building2 className="w-6 h-6" />
                    </div>
                    <span className="text-[11px] font-black px-3 py-1 rounded-full bg-[#D4AF37]/20 text-[#FDE68A] border border-[#D4AF37]/50">
                      مسؤولو الوزارة
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-bold font-serif text-white group-hover:text-[#FDE68A] transition-colors">
                      منظومة رعاية الموهوبين 🇶🇦
                    </h3>
                    <p className="text-xs text-amber-100/90 mt-1.5 leading-relaxed font-sans">
                      فلترة وانتداب المواهب الذهبية (درجة أولى) في الخطابة المباشرة وإصدار كشوفات الترشيح الرسمية.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-black/40 border border-white/20 text-xs text-amber-100 space-y-1 font-sans">
                    <div className="font-bold text-[#FDE68A] flex items-center gap-1.5">
                      <Star className="w-3.5 h-3.5 text-[#D4AF37] fill-[#D4AF37]" />
                      <span>الحساب: د. خالد السليطي</span>
                    </div>
                    <div className="text-[11px] text-amber-200/80">
                      إدارة التوجيه التربوي ورعاية الموهوبين
                    </div>
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleQuickLogin(admins[0] || DEMO_USERS.find(u => u.role === "admin") || DEMO_USERS[5]);
                    }}
                    className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] hover:from-[#F59E0B] hover:to-[#D4AF37] text-slate-950 text-xs font-black shadow-lg shadow-amber-950/40 transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>دخول منظومة الوزارة والموهوبين</span>
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 4. The 3 Core Pedagogical Pillars Overview */}
      <section className="py-14 sm:py-20 px-4 sm:px-8 bg-white dark:bg-[#0E040A] border-y border-slate-200 dark:border-[#2B0C1A] transition-colors duration-300">
        <div className="max-w-6xl mx-auto space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8A1538] dark:text-[#FDE68A]">
              المسار التنموي المتدرج
            </span>
            <h2 className="text-2xl sm:text-4xl font-black font-serif text-slate-900 dark:text-white">
              المراحل الثلاث الأساسية لمنظومة إلقاء
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-sans">
              تصميم تعليمي متسلسل مبني على كفايات المنهج التعليمي الوطني لدولة قطر
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Stage 1 */}
            <div className="p-6 rounded-3xl bg-[#FAF8F5] dark:bg-[#14070E] border border-amber-200 dark:border-[#3D1426] space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#8A1538]/10 dark:bg-[#8A1538]/30 text-[#8A1538] dark:text-[#FDE68A] flex items-center justify-center">
                <Mic className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <span className="text-xs font-black text-[#8A1538] dark:text-[#FDE68A]">المرحلة الأولى</span>
                <h3 className="text-lg font-bold font-serif text-slate-900 dark:text-white">مختبر التأسيس والفصاحة الصوتية</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-sans leading-relaxed">
                  تقييم لحظي لمخارج الحروف، علامات التشكيل الإعرابي، وبنك الأسئلة التفاعلي لـ 13 صفاً دراسياً من الروضة حتى الثاني عشر.
                </p>
              </div>
              <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2 pt-2 border-t border-slate-200 dark:border-[#2F0C1B] font-sans">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>التعرف الصوتي على الكلمات المشكولة</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>تفكيك وتركيب الجمل والألعاب اللغوية</span>
                </li>
              </ul>
            </div>

            {/* Stage 2 */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-[#2B0813] to-[#5C0E25] text-white space-y-4 border border-[#D4AF37]/50 shadow-lg">
              <div className="w-12 h-12 rounded-2xl bg-[#D4AF37]/20 text-[#FDE68A] flex items-center justify-center">
                <Video className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <span className="text-xs font-black text-[#FDE68A]">المرحلة الثانية • استوديو حي 🇶🇦</span>
                <h3 className="text-lg font-bold font-serif text-white">مسرح الإلقاء والمنبر الحي</h3>
                <p className="text-xs text-amber-100/90 font-sans leading-relaxed">
                  كاميرا ذكية ترصد التواصل البصري ولغة الجسد، وملقن ذكي متزامن مع الصوت وسرعة الإلقاء (WPM) لتدريب الخطباء الواعدين.
                </p>
              </div>
              <ul className="text-xs text-amber-100 space-y-2 pt-2 border-t border-white/20 font-sans">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <span>تحليل حركة اليدين واستقامة الجسد</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#D4AF37] shrink-0" />
                  <span>بطاقة تحكيم معتمدة وفق المعايير الوزارية</span>
                </li>
              </ul>
            </div>

            {/* Stage 3 */}
            <div className="p-6 rounded-3xl bg-[#FAF8F5] dark:bg-[#14070E] border border-slate-200 dark:border-[#3D1426] space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div className="space-y-1.5">
                <span className="text-xs font-black text-slate-700 dark:text-[#FDE68A]">المرحلة الثالثة</span>
                <h3 className="text-lg font-bold font-serif text-slate-900 dark:text-white">الذكاء الأكاديمي والتقارير</h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 font-sans leading-relaxed">
                  مصفوفة قياس الكفايات التربوية، تقارير جاهزة للطباعة، ورصد فوري للطلاب المتفوقين والمحتاجين لدعم علاجي مستمر.
                </p>
              </div>
              <ul className="text-xs text-slate-700 dark:text-slate-300 space-y-2 pt-2 border-t border-slate-200 dark:border-[#2F0C1B] font-sans">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>تقرير أفضل طالب في كل معيار وشعبة</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>انتداب الموهوبين درجة أولى للوزارة</span>
                </li>
              </ul>
            </div>
          </div>

        </div>
      </section>

      {/* 5. Footer with Qatar Heritage & Ministry Stamp */}
      <footer className="mt-auto bg-slate-900 dark:bg-[#070205] text-white py-10 px-4 sm:px-8 border-t border-slate-800 dark:border-[#250816]" id="landing-footer">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <MinistryLogo size="md" showText={true} textColor="gold" />
          </div>

          <div className="text-center md:text-end text-xs text-slate-400 dark:text-slate-400 font-sans space-y-1">
            <p className="text-slate-200 dark:text-[#FDE68A] font-serif font-bold">
              منصة إلقاء الوطنية © 2026 • بالشراكة مع وزارة التربية والتعليم والتعليم العالي
            </p>
            <p>
              دولة قطر 🇶🇦 • تعزيز الهوية الوطنية وفصاحة اللسان العربي
            </p>
            <p className="text-[10px] text-slate-500 dark:text-slate-500" dir="ltr">
              @Qatar_edu • www.edu.gov.qa
            </p>
          </div>
        </div>
      </footer>

      {/* 6. Role-Based Login Modal */}
      {showLoginModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
          id="login-modal-overlay"
        >
          <div
            className="bg-white dark:bg-[#14070E] rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 dark:border-[#3D1426] space-y-6 relative text-slate-900 dark:text-white"
            id="login-modal-container"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#2F0C1B] pb-4">
              <div className="flex items-center gap-3">
                <MinistryLogo size="sm" showText={false} textColor={isDarkMode ? "gold" : "maroon"} />
                <div>
                  <h3 className="font-bold font-serif text-lg text-slate-900 dark:text-white">تسجيل الدخول الموحد</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">نظام المصادقة لمدارس دولة قطر</p>
                </div>
              </div>
              <button
                onClick={() => setShowLoginModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center text-sm font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Role Tabs */}
            <div className="flex rounded-2xl bg-slate-100 dark:bg-[#1E0C17] p-1 gap-1 border border-slate-200 dark:border-[#3D1426]">
              <button
                type="button"
                onClick={() => {
                  setSelectedRole("student");
                  setSelectedDemoUserId("user-student-g6");
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedRole === "student"
                    ? "bg-[#8A1538] text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                طالب / متعلم
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedRole("teacher");
                  setSelectedDemoUserId("user-teacher-1");
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedRole === "teacher"
                    ? "bg-slate-900 dark:bg-slate-800 text-white shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                معلم / منسق
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedRole("admin");
                  setSelectedDemoUserId("user-admin-moehe");
                }}
                className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedRole === "admin"
                    ? "bg-[#D4AF37] text-slate-950 shadow-xs"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
                }`}
              >
                مسؤول الوزارة
              </button>
            </div>

            {/* Select User Account */}
            <form onSubmit={handleModalSubmit} className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    {selectedRole === "student"
                      ? "اختر حساب الطالب (معرفة الصف والشعبة تلقائياً):"
                      : selectedRole === "teacher"
                      ? "اختر حساب المعلم والمنسق:"
                      : "اختر حساب إدارة الوزارة والموهوبين:"}
                  </label>
                  {selectedRole === "student" && onOpenStudentSelector && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowLoginModal(false);
                        onOpenStudentSelector();
                      }}
                      className="text-[11px] text-[#8A1538] dark:text-[#FDE68A] hover:underline font-bold"
                    >
                      عرض كافة الصفوف (13 صفاً) ➔
                    </button>
                  )}
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {(selectedRole === "student" ? students : selectedRole === "teacher" ? teachers : admins).map((u) => (
                    <label
                      key={u.id}
                      className={`flex items-center justify-between p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
                        selectedDemoUserId === u.id
                          ? "border-[#8A1538] dark:border-[#D4AF37] bg-rose-50/50 dark:bg-[#2A0D1B]"
                          : "border-slate-200 dark:border-[#2F0C1B] hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-[#1A0914]"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="selectedUser"
                          value={u.id}
                          checked={selectedDemoUserId === u.id}
                          onChange={() => setSelectedDemoUserId(u.id)}
                          className="accent-[#8A1538]"
                        />
                        <div className="text-start">
                          <p className="text-xs font-bold text-slate-900 dark:text-white">{u.nameAr}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {u.section ? `${u.section} • ${u.schoolNameAr}` : u.titleAr || u.schoolNameAr}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {u.role}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-[#2F0C1B]">
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-[#8A1538] hover:bg-[#5C0E25] text-white text-xs font-black shadow-md cursor-pointer flex items-center gap-2"
                >
                  <LogIn className="w-4 h-4" />
                  <span>تأكيد تسجيل الدخول</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
