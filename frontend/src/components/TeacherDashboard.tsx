import React, { useState } from "react";
import {
  Users,
  Award,
  AlertTriangle,
  CheckCircle2,
  Filter,
  BarChart3,
  FileText,
  Printer,
  Sparkles,
  TrendingUp,
  GraduationCap,
  Search,
  BookOpen,
  Eye,
  Volume2,
  Mic,
  Star,
  ChevronDown,
  Video,
  ExternalLink
} from "lucide-react";
import { UserSession, StudentProfile } from "../types";
import { DEMO_USERS } from "../data/userSessions";
import { ALL_INITIAL_STUDENTS } from "../data/initialData";
import { GRADE_THEMES } from "../App";

export interface TeacherDashboardProps {
  userSession?: UserSession;
  students?: StudentProfile[];
  onNavigateToStudent?: (studentId: string, tab: any) => void;
  onSelectStudentForReview?: (studentId: string) => void;
  onNominateTalent?: () => void;
  isRtl?: boolean;
}

export const TeacherDashboard: React.FC<TeacherDashboardProps> = ({
  userSession,
  students,
  onNavigateToStudent,
  onSelectStudentForReview,
  onNominateTalent,
  isRtl = true
}) => {
  const currentSession: UserSession = userSession || DEMO_USERS.find(u => u.role === "teacher") || {
    id: "user-teacher-1",
    nameAr: "أ. محمد بن عبد الله الأنصاري",
    nameEn: "Mr. Mohammed Al-Ansari",
    email: "m.ansari@edu.gov.qa",
    role: "teacher",
    schoolNameAr: "مدرسة قطر الابتدائية والإعدادية للبنين",
    schoolNameEn: "Qatar School for Boys",
    assignedGrades: ["Grade 5", "Grade 6", "Grade 7", "Grade 8"],
    subjectAr: "اللغة العربية والتربية اللغوية",
    titleAr: "منسق مادة اللغة العربية والخطابة"
  };

  const allStudents: StudentProfile[] = (students && students.length > 0) ? students : ALL_INITIAL_STUDENTS;

  const [selectedGrade, setSelectedGrade] = useState<string>("Grade 6");
  const [selectedSection, setSelectedSection] = useState<string>("all"); // "all" | "a" | "b"
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Grade Theme
  const theme = GRADE_THEMES[selectedGrade] || GRADE_THEMES["Grade 6"];

  // Filter students for this grade
  const gradeStudents = allStudents.filter((s) => s.grade === selectedGrade);

  // Sample enriched standard metrics for teacher analysis
  const standardsSummary = [
    {
      code: "المعيار 1.1",
      nameAr: "الضبط الإعرابي للفاعل والمفعول به وحروف الجر",
      competencyAr: "التفكير الناقد والتراكيب النحوية",
      avgScore: 88,
      topStudent: { id: "student-g6-1", nameAr: "ناصر بن مبارك الهاجري", section: "السادس (ب)", score: 98 },
      topAllGrades: { nameAr: "ناصر بن مبارك الهاجري (السادس ب)", score: 98 },
      needsFocusStudents: [
        { id: "student-g6-2", nameAr: "حمد بن راشد النعيمي", section: "السادس (أ)", score: 62, errorNote: "تسكين أواخر الفاعل وخلط حركة المفعول به عند الوصل" }
      ]
    },
    {
      code: "المعيار 2.1",
      nameAr: "مخارج الحروف ونطق الأسماء الموصولة وأسماء الإشارة",
      competencyAr: "التواصل والفصاحة الصوتية",
      avgScore: 91,
      topStudent: { id: "student-g6-3", nameAr: "سالم بن علي الكعبي", section: "السادس (أ)", score: 96 },
      topAllGrades: { nameAr: "سارة خالد المهندي (الثاني عشر 1)", score: 99 },
      needsFocusStudents: [
        { id: "student-g6-2", nameAr: "جاسم بن خالد المناعي", section: "السادس (ب)", score: 68, errorNote: "اختلاس حركة الياء في الأسماء الموصولة" }
      ]
    },
    {
      code: "المعيار 3.1",
      nameAr: "النبر والتنغيم الصوتي ومراعاة مواضع الوقف والسكت",
      competencyAr: "التعبير والبيان الأدبي",
      avgScore: 84,
      topStudent: { id: "student-g6-1", nameAr: "ناصر بن مبارك الهاجري", section: "السادس (ب)", score: 95 },
      topAllGrades: { nameAr: "ناصر بن مبارك الهاجري (السادس ب)", score: 95 },
      needsFocusStudents: [
        { id: "student-g6-2", nameAr: "عبدالله بن أحمد الكواري", section: "السادس (ب)", score: 65, errorNote: "سرعة مفرطة في القراءة (WPM > 170) وعدم التوقف عند الفواصل" },
        { id: "student-g6-3", nameAr: "علي بن يوسف السليطي", section: "السادس (أ)", score: 70, errorNote: "نبرة صوتية رتيبة في مواضع الاستفهام والتعجب" }
      ]
    },
    {
      code: "المعيار 4.1",
      nameAr: "الإلقاء المنبري والتواصل البصري ولغة الجسد",
      competencyAr: "الخطابة والذكاء التواصلي متعدد الوسائط",
      avgScore: 89,
      topStudent: { id: "student-g6-1", nameAr: "ناصر بن مبارك الهاجري", section: "السادس (ب)", score: 96 },
      topAllGrades: { nameAr: "سارة خالد المهندي (الثاني عشر)", score: 98 },
      needsFocusStudents: [
        { id: "student-g6-3", nameAr: "فهد بن مسفر الهاجري", section: "السادس (أ)", score: 71, errorNote: "تجنب الاتصال البصري مع الكاميرا وانحناء الكتفين أثناء الإلقاء" }
      ]
    }
  ];

  return (
    <div className="space-y-6 sm:space-y-8 w-full max-w-full" id="teacher-coordinator-dashboard" dir={isRtl ? "rtl" : "ltr"}>
      
      {/* 1. Header Banner with Ministry Identity */}
      <div className="rounded-2xl sm:rounded-3xl p-5 sm:p-8 bg-gradient-to-br from-slate-900 via-[#1E0C17] to-slate-950 text-white shadow-xl border border-slate-700/60 dark:border-[#3D1426] relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#8A1538]/30 border border-[#D4AF37]/40 text-xs font-bold text-[#FDE68A]">
              <Users className="w-3.5 h-3.5" />
              <span>لوحة المعلم ومنسق المادة الأكاديمية 🇶🇦</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black font-serif text-white">
              {currentSession.nameAr}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-sans">
              {currentSession.titleAr || "منسق مادة اللغة العربية والخطابة"} • {currentSession.schoolNameAr}
            </p>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 w-full lg:w-auto">
            <div className="flex items-center gap-2 bg-white/10 dark:bg-black/40 px-3 py-2 rounded-xl sm:rounded-2xl border border-white/15 text-xs text-white flex-1 sm:flex-initial">
              <span className="text-[#FDE68A] font-bold">الصف:</span>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
              >
                {Object.keys(GRADE_THEMES).map((g) => (
                  <option key={g} value={g} className="text-slate-900 bg-white">
                    {GRADE_THEMES[g]?.nameAr || g}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2 bg-white/10 dark:bg-black/40 px-3 py-2 rounded-xl sm:rounded-2xl border border-white/15 text-xs text-white flex-1 sm:flex-initial">
              <span className="text-[#FDE68A] font-bold">الشعبة:</span>
              <select
                value={selectedSection}
                onChange={(e) => setSelectedSection(e.target.value)}
                className="bg-transparent text-white font-bold text-xs focus:outline-none cursor-pointer"
              >
                <option value="all" className="text-slate-900 bg-white">كافة شعب الصف</option>
                <option value="a" className="text-slate-900 bg-white">شعبة (أ)</option>
                <option value="b" className="text-slate-900 bg-white">شعبة (ب)</option>
              </select>
            </div>

            {onNominateTalent && (
              <button
                onClick={onNominateTalent}
                className="px-3.5 py-2 rounded-xl sm:rounded-2xl bg-[#8A1538] hover:bg-[#5C0E25] text-white text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md border border-[#D4AF37]/50"
              >
                <Award className="w-4 h-4 text-[#FDE68A]" />
                <span>انتداب الموهوبين 🇶🇦</span>
              </button>
            )}

            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 rounded-xl sm:rounded-2xl bg-[#D4AF37] hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-md"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">طباعة تقرير الكفايات</span>
              <span className="sm:hidden">طباعة</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top-Level Summary Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white dark:bg-[#14070E] p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-[#3D1426] shadow-xs flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold block">متوسط الإتقان الصفي</span>
            <p className="text-lg sm:text-2xl font-serif font-black text-slate-900 dark:text-white">89.4%</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#14070E] p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-[#3D1426] shadow-xs flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-50 dark:bg-[#2A1708] text-amber-600 dark:text-[#FDE68A] flex items-center justify-center shrink-0">
            <Award className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold block">المواهب الذهبية (1)</span>
            <p className="text-lg sm:text-2xl font-serif font-black text-slate-900 dark:text-white">4 طلاب</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#14070E] p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-[#3D1426] shadow-xs flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold block">بحاجة لدعم علاجي</span>
            <p className="text-lg sm:text-2xl font-serif font-black text-slate-900 dark:text-white">3 طلاب</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#14070E] p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-[#3D1426] shadow-xs flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 font-bold block">إجمالي جلسات التقييم</span>
            <p className="text-lg sm:text-2xl font-serif font-black text-slate-900 dark:text-white">142 جلسة</p>
          </div>
        </div>
      </div>

      {/* 3. Section: Top Performing Students per Standard (أفضل الطلاب في كل معيار) */}
      <div className="space-y-4" id="standards-leaderboard-section">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg sm:text-xl font-black font-serif text-slate-900 dark:text-white flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
              <span>أفضل الطلاب في كل معيار ({theme.nameAr || selectedGrade})</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              ترتيب الطلاب المتصدرين لكل معيار ومؤشر كفاية صفي، والمقارنة مع المتصدر على مستوى كافة السوادس
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {standardsSummary.map((std, idx) => (
            <div
              key={idx}
              className="bg-white dark:bg-[#14070E] rounded-2xl sm:rounded-3xl p-5 sm:p-6 border-2 border-slate-200 dark:border-[#3D1426] hover:border-indigo-400 dark:hover:border-[#D4AF37] shadow-xs space-y-4 transition-all"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="text-[11px] font-black text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-0.5 rounded-full">
                    {std.code}
                  </span>
                  <h3 className="font-bold font-serif text-sm sm:text-base text-slate-900 dark:text-white mt-1.5">
                    {std.nameAr}
                  </h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-sans block mt-0.5">{std.competencyAr}</span>
                </div>
                <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-xl shrink-0">
                  متوسط الصف: {std.avgScore}%
                </span>
              </div>

              {/* Best Student in this class & in all classes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-[#251307] border border-amber-200/80 dark:border-amber-900/60 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-[#FDE68A]">
                    <Award className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>الأفضل في {selectedSection === "b" ? "الشعبة (ب)" : "الشعبة المختارة"}</span>
                  </div>
                  <p className="text-xs font-black text-slate-900 dark:text-white font-serif">{std.topStudent.nameAr}</p>
                  <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300 block">
                    النتيجة: {std.topStudent.score}% • {std.topStudent.section}
                  </span>
                  {onNavigateToStudent && (
                    <button
                      onClick={() => onNavigateToStudent(std.topStudent.id, "oratory")}
                      className="text-[10px] font-bold text-[#8A1538] dark:text-[#FDE68A] hover:underline flex items-center gap-1 pt-1 cursor-pointer"
                    >
                      <Video className="w-3 h-3" />
                      <span>مشاهدة أداء المسرح الحي</span>
                    </button>
                  )}
                </div>

                <div className="p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-[#160D1F] border border-indigo-200/80 dark:border-indigo-900/60 space-y-1">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-300">
                    <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                    <span>المتصدر على مستوى السوادس</span>
                  </div>
                  <p className="text-xs font-black text-slate-900 dark:text-white font-serif">{std.topAllGrades.nameAr}</p>
                  <span className="text-[11px] font-bold text-indigo-800 dark:text-indigo-300 block">
                    النتيجة المعيارية: {std.topAllGrades.score}%
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400">مرشح للائحة الشرف الوزارية</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Section: Students Needing Targeted Support & Focus (الطلاب الذين يحتاجون تركيز ودعم) */}
      <div className="space-y-4" id="students-needing-focus-section">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-lg sm:text-xl font-black font-serif text-slate-900 dark:text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-600" />
              <span>قائمة الطلاب الذين يحتاجون تركيز ودعم في كل معيار</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              تشخيص آلي بالأخطاء اللغوية والصوتية المتكررة مع توصيات خطط التدخل العلاجي الفوري
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#14070E] rounded-2xl sm:rounded-3xl border border-rose-200/80 dark:border-[#3D1426] overflow-hidden shadow-xs">
          <div className="overflow-x-auto w-full">
            <table className="w-full text-xs text-start min-w-[650px]">
              <thead className="bg-rose-50/70 dark:bg-[#250B17] text-slate-700 dark:text-slate-200 font-bold border-b border-rose-100 dark:border-[#3D1426]">
                <tr>
                  <th className="p-3.5 sm:p-4 text-start">اسم الطالب</th>
                  <th className="p-3.5 sm:p-4 text-start">الشعبة</th>
                  <th className="p-3.5 sm:p-4 text-start">المعيار المستهدف</th>
                  <th className="p-3.5 sm:p-4 text-start">نسبة الإتقان</th>
                  <th className="p-3.5 sm:p-4 text-start">التشخيص الصوتي واللغوي</th>
                  <th className="p-3.5 sm:p-4 text-start">خطة الدعم المقترحة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#2F0C1B]">
                {standardsSummary.flatMap((std) =>
                  std.needsFocusStudents.map((st, i) => (
                    <tr key={`${std.code}-${i}`} className="hover:bg-slate-50 dark:hover:bg-[#1C0A15] transition-colors">
                      <td className="p-3.5 sm:p-4 font-bold text-slate-900 dark:text-white font-serif text-sm">
                        {st.nameAr}
                      </td>
                      <td className="p-3.5 sm:p-4 text-slate-600 dark:text-slate-300">{st.section}</td>
                      <td className="p-3.5 sm:p-4">
                        <span className="font-bold text-[#8A1538] dark:text-[#FDE68A]">{std.code}</span>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{std.nameAr}</div>
                      </td>
                      <td className="p-3.5 sm:p-4">
                        <span className="px-2.5 py-1 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 font-black text-xs">
                          {st.score}%
                        </span>
                      </td>
                      <td className="p-3.5 sm:p-4 text-slate-700 dark:text-slate-200 max-w-xs">{st.errorNote}</td>
                      <td className="p-3.5 sm:p-4">
                        {onNavigateToStudent ? (
                          <button
                            onClick={() => onNavigateToStudent(st.id, "practice")}
                            className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 px-2.5 py-1.5 rounded-xl block text-center cursor-pointer border border-indigo-200 dark:border-indigo-800/60"
                          >
                            تفعيل تدريبات المرحلة 1 (مختبر التأسيس) 🎯
                          </button>
                        ) : (
                          <span className="text-[11px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-xl block text-center">
                            تفعيل تدريبات المرحلة 1 (مختبر التأسيس)
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
};
