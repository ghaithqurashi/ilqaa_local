import React, { useState } from "react";
import {
  Mic,
  Video,
  BarChart3,
  GraduationCap,
  Users,
  Building2,
  CheckCircle2,
  LogIn,
  Presentation,
  ArrowRight,
  ArrowLeft,
  Sparkles,
  Award,
  Globe,
  Briefcase,
  Layers,
  Crown,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  Zap,
  Target,
  FileCheck,
  School,
  Building,
  UserCheck
} from "lucide-react";
import { IlqaaLogo } from "./IlqaaLogo";
import { MinistryLogo } from "./MinistryLogo";

interface MarketSegment {
  id: string;
  nameAr: string;
  nameEn: string;
  taglineAr: string;
  badgeAr: string;
  productName: string;
  icon: any;
  color: string;
  bgGradient: string;
  borderClass: string;
  targetAudience: string;
  features: string[];
  isCurrentAcademy: boolean;
  ctaTextAr: string;
}

interface IlqaaMainHomeProps {
  onEnterAcademy: () => void;
  onOpenPitchDeck: () => void;
  isDarkMode?: boolean;
}

export const IlqaaMainHome: React.FC<IlqaaMainHomeProps> = ({
  onEnterAcademy,
  onOpenPitchDeck,
  isDarkMode = true,
}) => {
  const [selectedSegmentId, setSelectedSegmentId] = useState<string>("education");

  const marketSegments: MarketSegment[] = [
    {
      id: "education",
      nameAr: "القطاع التعليمي والمدارس",
      nameEn: "ILQAA Academy & Schools",
      taglineAr: "المنظومة التعليمية الوطنية المخصصة للمدارس والجامعات ووزارات التعليم",
      badgeAr: "المنتج المعتمد والنشط 🇶🇦",
      productName: "ILQAA Academy (منصة إلقاء التعليمية)",
      icon: GraduationCap,
      color: "#8A1538",
      bgGradient: "from-[#8A1538] via-[#A01B42] to-[#5C0E25]",
      borderClass: "border-[#8A1538] dark:border-[#D4AF37]",
      targetAudience: "الطلاب من الروضة للثاني عشر، المعلمون والمنسقون، إدارات رعاية الموهوبين والوزارة",
      features: [
        "مختبر التأسيس الصوتي والتشكيل الإعرابي لـ 13 صفاً دراسياً",
        "مسرح الخطابة ومنبر الإلقاء الحي بالكاميرا والذكاء الاصطناعي",
        "لوحة قياس الكفايات التربوية وتقارير التدخل وانتداب الموهوبين",
        "مجلس استشاري أكاديمي وشبكة معتمدة لتقييم وتوجيه فرسان الإلقاء",
        "معايير مطابقة 100% لمناهج وزارة التربية والتعليم والتعليم العالي"
      ],
      isCurrentAcademy: true,
      ctaTextAr: "الدخول إلى ILQAA Academy ➜"
    },
    {
      id: "corporate",
      nameAr: "قطاع الأعمال والشركات",
      nameEn: "ILQAA Enterprise & Leadership",
      taglineAr: "تدريب القادة والمديرين التنفيذيين وفرق المبيعات على الخطابة والإقناع الاحترافي",
      badgeAr: "حلول الشركات B2B",
      productName: "ILQAA Executive & Enterprise",
      icon: Building2,
      color: "#1E3A8A",
      bgGradient: "from-[#1E3A8A] via-[#2563EB] to-[#1E293B]",
      borderClass: "border-blue-500/40",
      targetAudience: "الرؤساء التنفيذيون، مسؤولو العلاقات العامة، فرق المبيعات، والمتحدثون في المؤتمرات",
      features: [
        "محاكاة عروض الاستثمار واجتماعات مجالس الإدارة (Pitch Simulator)",
        "تحليل كاريزما الإلقاء، الإقناع، وإزالة الكلمات الحشوية (Fillers)",
        "تدريب إعلامي على المقابلات التلفزيونية والبيانات الصحفية",
        "تقارير قياس الأثر والجاهزية المؤسسية للمتحدثين الرسميين"
      ],
      isCurrentAcademy: false,
      ctaTextAr: "قريباً • طلب عرض تجريبي للشركات"
    },
    {
      id: "government",
      nameAr: "القطاع الحكومي والدبلوماسي",
      nameEn: "ILQAA Diplomacy & Protocol",
      taglineAr: "تأهيل الدبلوماسيين والمتحدثين الرسميين في الهيئات الحكومية والوزارات",
      badgeAr: "البروتوكول الرسمي",
      productName: "ILQAA Diplomat",
      icon: ShieldCheck,
      color: "#047857",
      bgGradient: "from-[#047857] via-[#059669] to-[#064E3B]",
      borderClass: "border-emerald-500/40",
      targetAudience: "الدبلوماسيون، السفراء، المتحدثون باسم الهيئات والوزارات، والقيادات الوطنية",
      features: [
        "تدريب بروتوكولي وفق المعايير الدبلوماسية الرسمية",
        "التحكم في نبرة الصوت ولغة الجسد تحت الضغط والأسئلة الحرجة",
        "صياغة الكلمات الرسمية وتحليل ردود الفعل اللحظية",
        "أعلى معايير الأمن السيبراني والسرية الحكومية التامة"
      ],
      isCurrentAcademy: false,
      ctaTextAr: "قريباً • طلب انضمام للجهات الحكومية"
    },
    {
      id: "individuals",
      nameAr: "الأفراد والمحترفون",
      nameEn: "ILQAA Pro (Individuals)",
      taglineAr: "مدرب الخطابة الشخصي في جيبك لمقابلات العمل، البودكاست، وصناع المحتوى",
      badgeAr: "B2C للأفراد",
      productName: "ILQAA Pro Coach",
      icon: Users,
      color: "#7C3AED",
      bgGradient: "from-[#7C3AED] via-[#8B5CF6] to-[#4C1D95]",
      borderClass: "border-purple-500/40",
      targetAudience: "المهنيون، صناع المحتوى، مقدمو البودكاست، والباحثون عن التميز الوظيفي",
      features: [
        "تحضير مقابلات العمل والعروض التقديمية الفردية",
        "تحسين نبرة الصوت ومخارج الحروف والتخلص من التوتر والخجل",
        "تحديات يومية وتمارين صوتية لرفع الثقة بالنفس",
        "ملاحظات ذكاء اصطناعي فورية بدون الحاجة لمدرب بشري"
      ],
      isCurrentAcademy: false,
      ctaTextAr: "قريباً • التسجيل في قائمة الانتظار"
    }
  ];

  const activeSegment = marketSegments.find((s) => s.id === selectedSegmentId) || marketSegments[0];

  return (
    <div
      className={`min-h-screen ${
        isDarkMode ? "bg-[#070205] text-slate-100" : "bg-[#FDFBF7] text-slate-900"
      } flex flex-col font-sans selection:bg-[#8A1538] selection:text-white`}
      dir="rtl"
      id="ilqaa-global-home"
    >
      {/* 1. Global Navigation Bar matching ilqaa.ai */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-[#12050D]/95 backdrop-blur-md border-b border-slate-200 dark:border-[#3D1426] px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-4 sm:gap-6">
          <IlqaaLogo size="md" showText={true} />
          
          <div className="hidden md:flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
            <span className="text-slate-300 dark:text-slate-700">|</span>
            <span className="text-[#8A1538] dark:text-[#FDE68A] font-serif">منظومة الذكاء الاصطناعي للخطابة وفصاحة اللسان</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onOpenPitchDeck}
            className="px-3.5 py-2 rounded-xl bg-amber-50 dark:bg-[#251307] text-[#8A1538] dark:text-[#FDE68A] text-xs font-bold border border-amber-300 dark:border-amber-900/50 hover:bg-amber-100 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Presentation className="w-4 h-4 text-[#D4AF37]" />
            <span className="hidden sm:inline">ملف العرض الوزاري 🇶🇦</span>
            <span className="sm:hidden">العرض 🇶🇦</span>
          </button>

          <button
            onClick={onEnterAcademy}
            className="px-4 sm:px-6 py-2.5 rounded-xl bg-[#8A1538] hover:bg-[#5C0E25] text-white text-xs sm:text-sm font-black font-serif shadow-md shadow-[#8A1538]/30 transition-all flex items-center gap-2 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <GraduationCap className="w-4 h-4" />
            <span>دخول ILQAA Academy</span>
          </button>
        </div>
      </header>

      {/* 2. Hero Section: ilqaa.ai Overview */}
      <section className="relative pt-12 sm:pt-20 pb-12 px-4 sm:px-8 overflow-hidden">
        <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-[#8A1538]/15 dark:bg-[#8A1538]/25 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-[#D4AF37]/10 dark:bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-6xl mx-auto text-center space-y-6 relative z-10">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-100 dark:bg-[#1E0C17] border border-slate-200 dark:border-[#3D1426] text-xs font-black text-[#8A1538] dark:text-[#FDE68A] shadow-xs">
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            <span>المنصة الرائدة في العالم العربي لتمكين مهارات الإلقاء بالذكاء الاصطناعي</span>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black font-serif tracking-tight leading-[1.25] text-slate-900 dark:text-white max-w-4xl mx-auto">
            تحدّث بثقة، وألْقِ ببراعة، <br className="hidden sm:inline" />
            مع منصة <span className="text-[#8A1538] dark:text-[#F43F5E]">إلْقَـــاء</span> المتخصصة
          </h1>

          <p className="text-sm sm:text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
            نوظف أحدث تقنيات الرؤية الحاسوبية ومعالجة الصوت الفصيح لتطوير الخطابة، الحضور المنبري، ومخارج الحروف لمختلف القطاعات والشرائح المستهدفة.
          </p>
        </div>
      </section>

      {/* 3. Market Segments Tabs (الشرائح السوقية) */}
      <section className="py-8 px-4 sm:px-8 max-w-6xl mx-auto w-full">
        <div className="text-center space-y-2 mb-8">
          <span className="text-xs font-black uppercase tracking-wider text-[#8A1538] dark:text-[#FDE68A] bg-[#8A1538]/10 dark:bg-[#8A1538]/30 px-3 py-1 rounded-full border border-[#8A1538]/20 dark:border-[#D4AF37]/30">
            الشرائح السوقية ومنتجات منصة إلقاء
          </span>
          <h2 className="text-2xl sm:text-3xl font-black font-serif text-slate-900 dark:text-white">
            اختر القطاع للتعرف على المنتج المخصص
          </h2>
        </div>

        {/* 4 Segment Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {marketSegments.map((seg) => {
            const Icon = seg.icon;
            const isSelected = selectedSegmentId === seg.id;
            return (
              <button
                key={seg.id}
                onClick={() => setSelectedSegmentId(seg.id)}
                className={`p-5 rounded-3xl text-start transition-all duration-300 flex flex-col justify-between relative cursor-pointer ${
                  isSelected
                    ? "bg-white dark:bg-[#1C0A15] border-2 border-[#8A1538] dark:border-[#D4AF37] shadow-xl transform -translate-y-1"
                    : "bg-slate-50 dark:bg-[#12050D] border border-slate-200 dark:border-[#2F0C1B] hover:bg-white dark:hover:bg-[#180812] opacity-80 hover:opacity-100"
                }`}
              >
                {seg.isCurrentAcademy && (
                  <span className="absolute -top-3 left-4 px-2.5 py-0.5 rounded-full bg-[#8A1538] text-white text-[10px] font-black shadow-xs">
                    متاح الآن 🇶🇦
                  </span>
                )}

                <div className="space-y-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner"
                    style={{
                      backgroundColor: isSelected ? `${seg.color}20` : "rgba(100,100,100,0.1)",
                      color: seg.color
                    }}
                  >
                    <Icon className="w-6 h-6" />
                  </div>

                  <div>
                    <h3 className="font-serif font-bold text-base sm:text-lg text-slate-900 dark:text-white">
                      {seg.nameAr}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-sans mt-0.5">
                      {seg.productName}
                    </p>
                  </div>
                </div>

                <div className="pt-4 mt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#8A1538] dark:text-[#FDE68A]">
                    {isSelected ? "عرض التفاصيل ✓" : "استكشف ➜"}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">{seg.nameEn.split(" ")[0]}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* 4. Active Segment Detailed Feature Spotlight */}
        <div className="bg-white dark:bg-[#14070E] rounded-3xl border-2 border-slate-200 dark:border-[#3D1426] p-6 sm:p-10 shadow-2xl relative overflow-hidden">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Col / Details */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-3 py-1 rounded-full bg-[#8A1538]/10 dark:bg-[#8A1538]/30 text-[#8A1538] dark:text-[#FDE68A] text-xs font-black border border-[#8A1538]/20 dark:border-[#D4AF37]/30">
                  {activeSegment.badgeAr}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-sans">
                  الشريحة المستهدفة: {activeSegment.targetAudience}
                </span>
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl sm:text-3xl font-black font-serif text-slate-900 dark:text-white">
                  {activeSegment.productName}
                </h3>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 font-sans leading-relaxed">
                  {activeSegment.taglineAr}
                </p>
              </div>

              {/* Feature Checklist */}
              <div className="space-y-3 pt-2">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                  الميزات والاختصاصات الرئيسية:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {activeSegment.features.map((feat, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-slate-50 dark:bg-[#1E0C17] border border-slate-200/80 dark:border-[#2F0C1B] text-xs text-slate-800 dark:text-slate-200 flex items-start gap-2.5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-snug">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-4 flex flex-wrap items-center gap-4">
                {activeSegment.isCurrentAcademy ? (
                  <button
                    onClick={onEnterAcademy}
                    className="px-6 py-3.5 rounded-2xl bg-[#8A1538] hover:bg-[#5C0E25] text-white font-black font-serif text-sm shadow-xl shadow-[#8A1538]/30 transition-all flex items-center gap-3 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
                    id="enter-academy-spotlight-btn"
                  >
                    <GraduationCap className="w-5 h-5" />
                    <span>{activeSegment.ctaTextAr}</span>
                  </button>
                ) : (
                  <button
                    disabled
                    className="px-6 py-3 rounded-2xl bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-xs flex items-center gap-2 cursor-not-allowed"
                  >
                    <span>{activeSegment.ctaTextAr}</span>
                  </button>
                )}

                {activeSegment.isCurrentAcademy && (
                  <button
                    onClick={onOpenPitchDeck}
                    className="px-4 py-3 rounded-2xl bg-amber-50 dark:bg-[#251307] text-[#8A1538] dark:text-[#FDE68A] font-bold text-xs border border-amber-300 dark:border-amber-900/50 hover:bg-amber-100 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <Presentation className="w-4 h-4 text-[#D4AF37]" />
                    <span>استعراض ملف الشراكة لمدارس قطر 🇶🇦</span>
                  </button>
                )}
              </div>
            </div>

            {/* Right Col / Visual Card */}
            <div className="lg:col-span-5">
              <div
                className={`p-6 sm:p-8 rounded-3xl bg-gradient-to-br ${activeSegment.bgGradient} text-white shadow-2xl space-y-6 relative overflow-hidden`}
              >
                <div className="flex items-center justify-between border-b border-white/20 pb-4">
                  <div className="flex items-center gap-2">
                    <IlqaaLogo size="sm" showText={false} />
                    <span className="font-serif font-black text-sm text-white">ILQAA AI ENGINE</span>
                  </div>
                  {activeSegment.isCurrentAcademy && (
                    <span className="text-[11px] font-mono px-2.5 py-0.5 rounded-full bg-white/20 text-[#FDE68A]">
                      معتمد رسمياً
                    </span>
                  )}
                </div>

                <div className="space-y-3">
                  <div className="w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center text-[#FDE68A] shadow-inner">
                    {React.createElement(activeSegment.icon, { className: "w-7 h-7" })}
                  </div>

                  <h4 className="text-xl font-bold font-serif">{activeSegment.nameAr}</h4>
                  <p className="text-xs text-white/80 leading-relaxed font-sans">
                    محرك ذكاء اصطناعي مخصص لمعالجة مخارج الحروف، التشكيل، لغة الجسد، والتواصل البصري المنبري.
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-black/30 backdrop-blur-xs border border-white/20 text-xs space-y-2">
                  <div className="flex items-center justify-between text-amber-200">
                    <span>معدل دقة التقييم الصوتي</span>
                    <span className="font-mono font-bold">98.4%</span>
                  </div>
                  <div className="flex items-center justify-between text-amber-200">
                    <span>التوافق مع المناهج الوطنية</span>
                    <span className="font-mono font-bold">100%</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 5. Footer */}
      <footer className="mt-auto bg-slate-900 dark:bg-[#070205] text-white py-10 px-4 sm:px-8 border-t border-slate-800 dark:border-[#250816]">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <IlqaaLogo size="md" showText={true} />
          </div>

          <div className="text-center md:text-end text-xs text-slate-400 space-y-1">
            <p className="text-slate-200 font-serif font-bold">
              منصة إلقاء الذكية • ilqaa.ai © 2026
            </p>
            <p>
              الذكاء الاصطناعي لتمكين الخطابة والفصاحة في الوطن العربي
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
