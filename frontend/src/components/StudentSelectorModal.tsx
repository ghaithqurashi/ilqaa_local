import React, { useState, useMemo } from "react";
import {
  GraduationCap,
  Search,
  CheckCircle2,
  Sparkles,
  School,
  Flame,
  Award,
  ChevronLeft,
  ChevronRight,
  Filter,
  UserCheck,
  X
} from "lucide-react";
import { StudentProfile } from "../types";

interface StudentSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: StudentProfile[];
  activeStudentId?: string;
  currentStudentId?: string;
  onSelectStudent: (studentId: string) => void;
  isDarkMode?: boolean;
  isRtl?: boolean;
}

const GRADE_TITLES_AR: Record<string, string> = {
  "KG": "مرحلة الروضة والتمهيدي",
  "Grade 1": "الصف الأول الابتدائي",
  "Grade 2": "الصف الثاني الابتدائي",
  "Grade 3": "الصف الثالث الابتدائي",
  "Grade 4": "الصف الرابع الابتدائي",
  "Grade 5": "الصف الخامس الابتدائي",
  "Grade 6": "الصف السادس الابتدائي",
  "Grade 7": "الصف السابع الإعدادي",
  "Grade 8": "الصف الثامن الإعدادي",
  "Grade 9": "الصف التاسع الإعدادي",
  "Grade 10": "الصف العاشر الثانوي",
  "Grade 11": "الصف الحادي عشر الثانوي",
  "Grade 12": "الصف الثاني عشر (الشهادة الثانوية)"
};

type StageFilter = "all" | "foundation" | "primary" | "preparatory" | "secondary";

export const StudentSelectorModal: React.FC<StudentSelectorModalProps> = ({
  isOpen,
  onClose,
  students,
  activeStudentId,
  currentStudentId,
  onSelectStudent,
  isDarkMode = true,
  isRtl = true
}) => {
  const [selectedStage, setSelectedStage] = useState<StageFilter>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>("all");

  const stageGrades: Record<StageFilter, string[]> = {
    all: [],
    foundation: ["KG", "Grade 1", "Grade 2"],
    primary: ["Grade 3", "Grade 4", "Grade 5", "Grade 6"],
    preparatory: ["Grade 7", "Grade 8", "Grade 9"],
    secondary: ["Grade 10", "Grade 11", "Grade 12"]
  };

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      // Stage filter
      if (selectedStage !== "all") {
        const allowedGrades = stageGrades[selectedStage];
        if (!allowedGrades.includes(student.grade)) {
          return false;
        }
      }

      // Grade specific filter
      if (selectedGradeFilter !== "all" && student.grade !== selectedGradeFilter) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNameAr = student.nameAr.toLowerCase().includes(q);
        const matchNameEn = student.nameEn.toLowerCase().includes(q);
        const matchSchoolAr = (student.schoolNameAr || "").toLowerCase().includes(q);
        const matchSection = (student.section || "").toLowerCase().includes(q);
        const matchGrade = student.grade.toLowerCase().includes(q);
        if (!matchNameAr && !matchNameEn && !matchSchoolAr && !matchSection && !matchGrade) {
          return false;
        }
      }

      return true;
    });
  }, [students, selectedStage, selectedGradeFilter, searchQuery]);

  if (!isOpen) return null;

  const stages = [
    { id: "all", labelAr: "جميع المراحل (13 صفاً)", count: students.length },
    { id: "foundation", labelAr: "التعليم المبكر والتأسيس (KG - 2)", count: students.filter(s => stageGrades.foundation.includes(s.grade)).length },
    { id: "primary", labelAr: "المرحلة الابتدائية (3 - 6)", count: students.filter(s => stageGrades.primary.includes(s.grade)).length },
    { id: "preparatory", labelAr: "المرحلة الإعدادية (7 - 9)", count: students.filter(s => stageGrades.preparatory.includes(s.grade)).length },
    { id: "secondary", labelAr: "المرحلة الثانوية (10 - 12)", count: students.filter(s => stageGrades.secondary.includes(s.grade)).length }
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fadeIn"
      dir={isRtl ? "rtl" : "ltr"}
      id="student-selector-modal"
    >
      <div
        className={`w-full max-w-4xl max-h-[90vh] rounded-3xl flex flex-col shadow-2xl border transition-all duration-300 ${
          isDarkMode
            ? "bg-[#14070E] border-[#3D1426] text-white"
            : "bg-[#FDFBF7] border-slate-200 text-slate-900"
        }`}
      >
        {/* Modal Top Header */}
        <div className="px-6 py-5 border-b border-slate-200/80 dark:border-[#2F0C1B] flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#8A1538] text-white flex items-center justify-center shadow-md shadow-[#8A1538]/30">
              <GraduationCap className="w-6 h-6 text-[#FDE68A]" />
            </div>
            <div>
              <h2 className="text-xl font-bold font-serif text-slate-900 dark:text-white flex items-center gap-2">
                <span>اختر حساب الطالب والصف الدراسي</span>
                <span className="text-xs font-sans px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-[#FDE68A] border border-amber-500/30">
                  {filteredStudents.length} طالب
                </span>
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 font-sans">
                اختر الطالب الذي ترغب بالدخول بحسابه لتعكس كامل مخرجاته وسجله التراكمي في البوابة
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-[#1E0C17] hover:bg-slate-200 dark:hover:bg-[#2F0C1B] text-slate-600 dark:text-slate-300 flex items-center justify-center cursor-pointer transition-colors"
            title="إغلاق"
            id="close-student-selector-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters & Search Toolbar */}
        <div className="p-4 sm:p-6 border-b border-slate-200/60 dark:border-[#2F0C1B] space-y-4 bg-slate-50/50 dark:bg-[#180912]/50">
          {/* Stage Buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            {stages.map((stage) => (
              <button
                key={stage.id}
                onClick={() => {
                  setSelectedStage(stage.id as StageFilter);
                  setSelectedGradeFilter("all");
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                  selectedStage === stage.id
                    ? "bg-[#8A1538] text-white shadow-sm"
                    : "bg-white dark:bg-[#1E0C17] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#3D1426] hover:border-[#8A1538]/50"
                }`}
              >
                <span>{stage.labelAr}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  selectedStage === stage.id ? "bg-white/20 text-white" : "bg-slate-100 dark:bg-[#2A0D1B] text-slate-500 dark:text-slate-400"
                }`}>
                  {stage.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Input and Grade Sub-filter */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute top-1/2 -translate-y-1/2 right-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="ابحث باسم الطالب، المدرسة، أو الشعبة..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-10 py-2.5 text-xs rounded-xl bg-white dark:bg-[#1E0C17] border border-slate-200 dark:border-[#3D1426] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-[#8A1538] focus:ring-1 focus:ring-[#8A1538]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute top-1/2 -translate-y-1/2 left-3 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Quick Grade Selector */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-4 h-4 text-slate-400 shrink-0" />
              <select
                value={selectedGradeFilter}
                onChange={(e) => setSelectedGradeFilter(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl bg-white dark:bg-[#1E0C17] border border-slate-200 dark:border-[#3D1426] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-[#8A1538] w-full sm:w-44 font-sans"
              >
                <option value="all">كافة الصفوف</option>
                <option value="KG">مرحلة الروضة (KG)</option>
                <option value="Grade 1">الصف الأول الابتدائي</option>
                <option value="Grade 2">الصف الثاني الابتدائي</option>
                <option value="Grade 3">الصف الثالث الابتدائي</option>
                <option value="Grade 4">الصف الرابع الابتدائي</option>
                <option value="Grade 5">الصف الخامس الابتدائي</option>
                <option value="Grade 6">الصف السادس الابتدائي</option>
                <option value="Grade 7">الصف السابع الإعدادي</option>
                <option value="Grade 8">الصف الثامن الإعدادي</option>
                <option value="Grade 9">الصف التاسع الإعدادي</option>
                <option value="Grade 10">الصف العاشر الثانوي</option>
                <option value="Grade 11">الصف الحادي عشر الثانوي</option>
                <option value="Grade 12">الصف الثاني عشر (الشهادة الثانوية)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Student Cards Grid (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 max-h-[55vh]">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-[#1E0C17] text-slate-400 mx-auto flex items-center justify-center">
                <Search className="w-6 h-6" />
              </div>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-400">
                لم يتم العثور على طالب مطابق لمعايير البحث
              </p>
              <button
                onClick={() => {
                  setSearchQuery("");
                  setSelectedStage("all");
                  setSelectedGradeFilter("all");
                }}
                className="text-xs text-[#8A1538] dark:text-[#FDE68A] underline font-bold"
              >
                إعادة ضبط عوامل التصفية
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredStudents.map((student) => {
                const gradeTitle = GRADE_TITLES_AR[student.grade] || student.grade;
                const isCurrent = student.id === (activeStudentId || currentStudentId);
                const completedCount = student.measurements.filter(m => m.score > 0).length;
                const avgScore = Math.round(
                  student.measurements.reduce((acc, m) => acc + m.score, 0) / (student.measurements.length || 1)
                );

                return (
                  <div
                    key={student.id}
                    onClick={() => {
                      onSelectStudent(student.id);
                      onClose();
                    }}
                    className={`p-4 rounded-2xl border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between group hover:scale-[1.01] ${
                      isCurrent
                        ? "border-[#8A1538] dark:border-[#D4AF37] bg-rose-50/70 dark:bg-[#260B18] shadow-md"
                        : "border-slate-200/80 dark:border-[#2F0C1B] bg-white dark:bg-[#1A0914] hover:border-slate-400 dark:hover:border-[#5C0E25]"
                    }`}
                    id={`student-select-card-${student.id}`}
                  >
                    <div className="space-y-2.5">
                      {/* Top Bar: Grade & Status */}
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-[#250C1B] text-[#8A1538] dark:text-[#FDE68A] border border-slate-200 dark:border-[#3D1426]">
                          {gradeTitle}
                        </span>

                        {isCurrent ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>الطالب الحالي</span>
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-600 dark:text-slate-400 flex items-center gap-1">
                            <Flame className="w-3 h-3 text-amber-500" />
                            <span>حماسة {student.streakDays || student.streak || 3} أيام</span>
                          </span>
                        )}
                      </div>

                      {/* Name & School */}
                      <div>
                        <h4 className="text-base font-bold font-serif text-slate-900 dark:text-white group-hover:text-[#8A1538] dark:group-hover:text-[#FDE68A] transition-colors">
                          {student.nameAr}
                        </h4>
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 mt-0.5 font-sans">
                          <School className="w-3.5 h-3.5 text-slate-400" />
                          <span>{student.section || "شعبة عامة"} • {student.schoolNameAr || "مدارس دولة قطر"}</span>
                        </div>
                      </div>

                      {/* Mastery & Stats */}
                      <div className="grid grid-cols-3 gap-2 pt-1">
                        <div className="p-1.5 rounded-xl bg-slate-50 dark:bg-[#12050D] text-center border border-slate-100 dark:border-[#220716]">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">المستوى</span>
                          <span className="text-xs font-black text-slate-800 dark:text-slate-200">
                            مستوى {student.level}
                          </span>
                        </div>

                        <div className="p-1.5 rounded-xl bg-slate-50 dark:bg-[#12050D] text-center border border-slate-100 dark:border-[#220716]">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">نقاط XP</span>
                          <span className="text-xs font-black text-amber-700 dark:text-[#FDE68A]">
                            {student.xp} XP
                          </span>
                        </div>

                        <div className="p-1.5 rounded-xl bg-slate-50 dark:bg-[#12050D] text-center border border-slate-100 dark:border-[#220716]">
                          <span className="text-[10px] text-slate-500 dark:text-slate-400 block">متوسط الإتقان</span>
                          <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">
                            {avgScore}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-3 border-t border-slate-100 dark:border-[#260B19] mt-3">
                      <button
                        type="button"
                        className={`w-full py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 ${
                          isCurrent
                            ? "bg-[#8A1538] text-white shadow-xs"
                            : "bg-slate-100 dark:bg-[#200A18] text-slate-800 dark:text-slate-200 group-hover:bg-[#8A1538] group-hover:text-white"
                        }`}
                      >
                        <UserCheck className="w-3.5 h-3.5" />
                        <span>{isCurrent ? "الحساب النشط حالياً" : "دخول البوابة بهذا الطالب"}</span>
                        {isRtl ? <ChevronLeft className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="px-6 py-4 border-t border-slate-200/80 dark:border-[#2F0C1B] flex items-center justify-between bg-slate-50/50 dark:bg-[#12050D]/50 rounded-b-3xl">
          <div className="text-xs text-slate-600 dark:text-slate-400 font-sans">
            ✨ يتم حفظ الطالب المختار ومزامنته عبر كافة لوحات التحكم والتدريب والتقارير
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 dark:bg-[#1E0C17] hover:bg-slate-300 dark:hover:bg-[#2F0C1B] text-slate-700 dark:text-slate-200 text-xs font-bold cursor-pointer"
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
};
