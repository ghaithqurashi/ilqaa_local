import React, { useState } from "react";
import {
  Award,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Download,
  Eye,
  FileText,
  Flame,
  GraduationCap,
  Mic,
  Printer,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Trophy,
  User,
  Video,
  Volume2
} from "lucide-react";
import { StudentProfile, AppSettings, ReadingAttempt, AIReportCard } from "../types";
import { Dictionary } from "../translations";
import { MinistryLogo } from "./MinistryLogo";
import { IlqaaLogo } from "./IlqaaLogo";

interface StudentProfileViewProps {
  student: StudentProfile;
  settings: AppSettings;
  dict: Dictionary;
  theme: any;
  onNavigate: (tab: "practice" | "oratory" | "dashboard" | "reports" | "settings" | "home") => void;
}

export const StudentProfileView: React.FC<StudentProfileViewProps> = ({
  student,
  settings,
  dict,
  theme,
  onNavigate
}) => {
  const isRtl = settings.language === "ar";
  const [activeSubTab, setActiveSubTab] = useState<"history" | "oratory" | "report" | "badges">("history");
  const [isGeneratingAiReport, setIsGeneratingAiReport] = useState(false);
  const [aiReport, setAiReport] = useState<AIReportCard | null>(null);

  // Overall accuracy
  const validScores = student.measurements.filter(m => m.score > 0).map(m => m.score);
  const avgScore = validScores.length > 0
    ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
    : 85;

  // Mock attempts if none recorded yet for demonstration
  const displayAttempts: ReadingAttempt[] = student.attempts && student.attempts.length > 0
    ? student.attempts
    : [
        {
          id: "att-1",
          measurementId: "m1",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          accuracy: 94,
          detectedText: "قَطَرُ تَمْضِي نَحْوَ الْمَجْدِ بِعَزْمِ أَبْنَائِهَا",
          targetText: "قَطَرُ تَمْضِي نَحْوَ الْمَجْدِ بِعَزْمِ أَبْنَائِهَا الْمُخْلِصِينَ",
          durationSeconds: 12,
          aiFeedback: "نطق فصيح ومتميز لمخارج الحروف، مع ثبات في نبرة الصوت وضبط الحركات الإعرابية.",
          aiScore: 94
        },
        {
          id: "att-2",
          measurementId: "m2",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          accuracy: 88,
          detectedText: "إِنَّ الْفَصَاحَةَ سِلَاحُ الْخَطِيبِ",
          targetText: "إِنَّ الْفَصَاحَةَ سِلَاحُ الْخَطِيبِ وَالْبَيَانُ رَائِدُ التَّأْثِيرِ",
          durationSeconds: 9,
          aiFeedback: "أداء جيد، يُوصى بالتركيز على الوقف التام عند علامات الترقيم.",
          aiScore: 88
        }
      ];

  const handleGenerateAiReport = async () => {
    setIsGeneratingAiReport(true);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: "academic_report",
          language: settings.language,
          grade: student.grade,
          subjects: student.measurements.map(m => ({
            name: isRtl ? m.nameAr : m.nameEn,
            score: m.score
          }))
        })
      });
      if (response.ok) {
        const data = await response.json();
        setAiReport(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingAiReport(false);
    }
  };

  return (
    <div className="space-y-8" id="student-profile-view" dir={isRtl ? "rtl" : "ltr"}>
      
      {/* Return Navigation Bar */}
      <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
        <button
          onClick={() => onNavigate("home")}
          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black flex items-center gap-2 cursor-pointer transition-all"
        >
          <span>{isRtl ? "⬅ العودة إلى بوابة المراحل الرئيسية" : "⬅ Back to Stages Gateway"}</span>
        </button>
        <span className="text-xs font-bold text-[#8A1538] px-3 py-1 bg-amber-50 rounded-full border border-amber-200">
          {isRtl ? "الملف الشخصي وسجل الإنجاز الوزاري للطالب" : "Student Profile & Achievement History"}
        </span>
      </div>

      {/* 1. Student Identity Master Banner */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#2D0612] via-[#8A1538] to-[#140207] text-white shadow-2xl border border-[#D4AF37]/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-[#D4AF37] to-[#B45309] p-1 shadow-xl">
              <div className="w-full h-full rounded-[22px] bg-[#3B0715] flex items-center justify-center text-3xl font-black font-serif text-[#FDE68A]">
                {student.avatar || student.nameAr.charAt(0)}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-2 px-3 py-0.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[11px] font-bold text-[#FDE68A]">
                <GraduationCap className="w-3.5 h-3.5" />
                <span>{isRtl ? `${student.grade} • ${theme.nameAr}` : `${student.grade} • ${theme.nameEn}`}</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black font-serif text-white">
                {isRtl ? student.nameAr : student.nameEn}
              </h1>
              <p className="text-xs text-amber-100/80 font-sans">
                {student.schoolNameAr || "مدارس دولة قطر"} • {student.section || "شعبة عامة"} • {isRtl ? "المسار التعليمي الوطني المعتمد" : "National Educational Track"}
              </p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-3 gap-3 w-full md:w-auto">
            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10 text-center">
              <span className="text-[10px] text-amber-200 block font-bold">{isRtl ? "معدل الإتقان" : "Mastery"}</span>
              <span className="text-xl font-black text-white font-mono">{avgScore}%</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10 text-center">
              <span className="text-[10px] text-amber-200 block font-bold">{isRtl ? "الحماس" : "Streak"}</span>
              <span className="text-xl font-black text-amber-300 font-mono">{student.streak} {isRtl ? "أيام" : "d"}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/10 border border-white/10 text-center">
              <span className="text-[10px] text-amber-200 block font-bold">{isRtl ? "النجوم" : "Stars"}</span>
              <span className="text-xl font-black text-[#FDE68A] font-mono">{student.coins || 120} ⭐</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Sub-Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab("history")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === "history"
              ? "bg-[#8A1538] text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
          }`}
        >
          <Mic className="w-3.5 h-3.5" />
          <span>{isRtl ? "سجل تدريبات التأسيس الصوتي" : "Phonics Practice History"}</span>
        </button>

        <button
          onClick={() => setActiveSubTab("oratory")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === "oratory"
              ? "bg-[#8A1538] text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
          }`}
        >
          <Video className="w-3.5 h-3.5" />
          <span>{isRtl ? "جلسات مسرح الإلقاء ولغة الجسد" : "Stage & Oratory Sessions"}</span>
        </button>

        <button
          onClick={() => setActiveSubTab("report")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === "report"
              ? "bg-[#8A1538] text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>{isRtl ? "التقرير الأكاديمي الشامل" : "Academic Report Card"}</span>
        </button>

        <button
          onClick={() => setActiveSubTab("badges")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeSubTab === "badges"
              ? "bg-[#8A1538] text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-50 border border-slate-200"
          }`}
        >
          <Trophy className="w-3.5 h-3.5" />
          <span>{isRtl ? "الأوسمة والشارات المكتسبة" : "Earned Badges"}</span>
        </button>
      </div>

      {/* 3. Tab Content */}

      {/* TAB: Phonics Practice History */}
      {activeSubTab === "history" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold font-serif text-slate-900">
                {isRtl ? "سجل المحاولات الصوتية المكتملة" : "Completed Voice Practice Sessions"}
              </h2>
              <p className="text-xs text-slate-500 font-sans">
                {isRtl ? "قائمة تفصيلية بجميع التدريبات المسجلة بدقة الكلمات وتشخيص الذكاء الاصطناعي" : "Detailed list of voice recordings with accuracy breakdown"}
              </p>
            </div>
            <button
              onClick={() => onNavigate("practice")}
              className="px-4 py-2 rounded-xl bg-[#8A1538] hover:bg-[#5C0E25] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>{isRtl ? "بدء جلسة جديدة" : "New Practice"}</span>
            </button>
          </div>

          <div className="space-y-3">
            {displayAttempts.map((att, idx) => (
              <div
                key={att.id || idx}
                className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800 font-black text-xs">
                      {att.accuracyScore ?? (att as any).accuracy ?? 92}%
                    </span>
                    <span className="text-xs font-bold text-slate-800 font-serif">
                      {att.targetText}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-slate-400 font-sans">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {(att as any).durationSeconds ?? 12}s
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(att.timestamp).toLocaleDateString(isRtl ? "ar-QA" : "en-US")}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-600 font-sans leading-relaxed flex items-start gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#8A1538] shrink-0 mt-0.5" />
                  <span>{att.aiFeedback}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB: Oratory Stage Sessions */}
      {activeSubTab === "oratory" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold font-serif text-slate-900">
                {isRtl ? "سجل أداء مسرح الإلقاء ولغة الجسد" : "Live Oratory & Stage History"}
              </h2>
              <p className="text-xs text-slate-500 font-sans">
                {isRtl ? "تحليل الكاميرا والذكاء الاصطناعي للتواصل البصري، لغة الجسد، وسرعة الإلقاء" : "AI vision metrics for eye contact, gestures, and pacing"}
              </p>
            </div>
            <button
              onClick={() => onNavigate("oratory")}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] text-slate-950 text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Video className="w-3.5 h-3.5" />
              <span>{isRtl ? "دخول المسرح الحي" : "Enter Live Stage"}</span>
            </button>
          </div>

          <div className="p-5 rounded-2xl border border-amber-200 bg-amber-50/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="px-3 py-1 rounded-full bg-[#8A1538] text-white text-[11px] font-bold">
                {isRtl ? "خطبة محفلية: اليوم الوطني لدولة قطر" : "National Day Speech"}
              </span>
              <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-3 py-0.5 rounded-full">
                {isRtl ? "النتيجة: 96% (موهوب أول)" : "Score: 96% (Tier 1)"}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-white border border-slate-200 text-center">
                <span className="text-[10px] text-slate-400 block">{isRtl ? "التواصل البصري" : "Eye Contact"}</span>
                <span className="text-base font-black text-slate-900">97%</span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200 text-center">
                <span className="text-[10px] text-slate-400 block">{isRtl ? "لغة الجسد" : "Body Language"}</span>
                <span className="text-base font-black text-slate-900">94%</span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200 text-center">
                <span className="text-[10px] text-slate-400 block">{isRtl ? "سرعة الإلقاء" : "Pacing"}</span>
                <span className="text-base font-black text-slate-900">118 WPM</span>
              </div>
            </div>

            <p className="text-xs text-slate-700 font-sans italic bg-white p-3 rounded-xl border border-amber-100">
              "{isRtl ? "أداء استثنائي يظهر ثقة عالية أمام الجمهور، نبرات صوتية ملهمة، وتواصل بصري متزن مع الكاميرا." : "Exceptional confidence, resonant vocal projection, and steady eye contact."}"
            </p>
          </div>
        </div>
      )}

      {/* TAB: Comprehensive Academic Report Card */}
      {activeSubTab === "report" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <MinistryLogo size="sm" showText={false} />
              <div>
                <h2 className="text-base font-bold font-serif text-slate-900">
                  {isRtl ? "بطاقة تقرير الأداء اللغوي والخطابي الرسمية" : "Official Language & Oratory Report Card"}
                </h2>
                <span className="text-xs text-slate-400 font-sans">
                  {isRtl ? "معتمدة وفق معايير وزارة التربية والتعليم والتعليم العالي" : "Certified under MoEHE Standards"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleGenerateAiReport}
                disabled={isGeneratingAiReport}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isGeneratingAiReport ? "animate-spin text-[#8A1538]" : ""}`} />
                <span>{isGeneratingAiReport ? (isRtl ? "جاري التحليل..." : "Analyzing...") : (isRtl ? "توليد ملخص الذكاء الاصطناعي" : "Generate AI Summary")}</span>
              </button>

              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-[#8A1538] hover:bg-[#5C0E25] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>{isRtl ? "طباعة التقرير" : "Print Report"}</span>
              </button>
            </div>
          </div>

          {/* Measurements Breakdown Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead className="bg-slate-50 text-slate-700 font-bold border-y border-slate-100">
                <tr>
                  <th className="p-3 text-start">المعيار والكفاية الوطنية</th>
                  <th className="p-3 text-start">نوع المهارة</th>
                  <th className="p-3 text-start">المستوى والدرجة</th>
                  <th className="p-3 text-start">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {student.measurements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/50">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{isRtl ? m.nameAr : m.nameEn}</div>
                      <span className="text-[11px] text-slate-400">{isRtl ? m.descriptionAr : m.descriptionEn}</span>
                    </td>
                    <td className="p-3 text-slate-600 font-sans">{m.skillCategory || "فصاحة ونطق"}</td>
                    <td className="p-3">
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-black text-xs">
                        {m.score}%
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {isRtl ? "متقن" : "Mastered"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* AI Report Card Summary */}
          {aiReport && (
            <div className="p-5 rounded-2xl bg-purple-50 border border-purple-200 space-y-3 animate-fadeIn">
              <h4 className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-purple-700" />
                <span>{isRtl ? "التقرير التحليلي للمدرب الذكي:" : "AI Coach Analytical Assessment:"}</span>
              </h4>
              <p className="text-xs text-purple-950 leading-relaxed font-sans">
                {aiReport.overallSummary}
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB: Badges & Rewards */}
      {activeSubTab === "badges" && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-bold font-serif text-slate-900">
              {isRtl ? "أوسمة التميز اللغوي والشارات التحفيزية" : "Badges & Achievement Milestones"}
            </h2>
            <p className="text-xs text-slate-500 font-sans">
              {isRtl ? "تكريم لإنجاز الطالب ومثابرته في مسار الفصاحة والخطابة" : "Recognition of learner diligence and rhetorical milestones"}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/50 flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-900 flex items-center justify-center text-xl">
                🏆
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 font-serif">وسام فصيح المنبر</h4>
                <p className="text-[11px] text-slate-500">اجتياز 5 خطب على المسرح الحي بدرجة امتياز</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/50 flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-900 flex items-center justify-center text-xl">
                🎙️
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 font-serif">وسام مخارج الحروف</h4>
                <p className="text-[11px] text-slate-500">إتقان جميع أحكام النطق ومخارج اللسان</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl border border-purple-200 bg-purple-50/50 flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-900 flex items-center justify-center text-xl">
                ⭐
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900 font-serif">وسام الشجاعة الخطابية</h4>
                <p className="text-[11px] text-slate-500">التحدث لمدة دقيقتين متواصلتين بدون تردد</p>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
