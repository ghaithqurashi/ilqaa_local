import React, { useState } from "react";
import { 
  TrendingUp, 
  Award, 
  BookOpen, 
  Sparkles, 
  Activity, 
  GraduationCap,
  Flame,
  Target,
  Trophy,
  Zap,
  Play,
  CheckCircle2,
  Lock,
  ChevronRight,
  Plus,
  Users,
  Layers,
  Compass,
  BrainCircuit,
  BarChart3,
  Filter,
  Volume2,
  X,
  Send,
  HelpCircle,
  AlertCircle,
  FileText
} from "lucide-react";
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Cell 
} from "recharts";
import { StudentProfile, AppSettings, Measurement, AIReportCard } from "../types";
import { Dictionary } from "../translations";
import { motion, AnimatePresence } from "motion/react";

interface DashboardTabProps {
  student: StudentProfile;
  settings: AppSettings;
  dict: Dictionary;
  onSelectStudent: (id: string) => void;
  students: StudentProfile[];
  theme: any;
  onNavigateToPractice?: (measurementId?: string) => void;
  onAddStudent?: (newStudent: StudentProfile) => void;
  onAddMeasurement?: (studentId: string, measurement: Measurement) => void;
  onReturnHome?: () => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  student,
  settings,
  dict,
  onSelectStudent,
  students,
  theme,
  onNavigateToPractice,
  onAddStudent,
  onAddMeasurement,
  onReturnHome
}) => {
  const isRtl = settings.language === "ar";

  // Selected Grade Filter State (defaults to current active student's grade)
  const [selectedGradeFilter, setSelectedGradeFilter] = useState<string>(student.grade);
  const [indicatorCategoryFilter, setIndicatorCategoryFilter] = useState<string>("all");

  // Modals state
  const [showAddStudentModal, setShowAddStudentModal] = useState(false);
  const [showAddIndicatorModal, setShowAddIndicatorModal] = useState(false);

  // AI Diagnostic State
  const [isGeneratingDiagnostic, setIsGeneratingDiagnostic] = useState(false);
  const [aiDiagnosticReport, setAiDiagnosticReport] = useState<AIReportCard | null>(null);

  // New Student Form State
  const [newStudentNameAr, setNewStudentNameAr] = useState("");
  const [newStudentNameEn, setNewStudentNameEn] = useState("");
  const [newStudentGrade, setNewStudentGrade] = useState(student.grade);

  // New Indicator Form State
  const [newIndCode, setNewIndCode] = useState("المعيار 1.9");
  const [newIndNumber, setNewIndNumber] = useState("مؤشر 1.9.1");
  const [newIndNameAr, setNewIndNameAr] = useState("");
  const [newIndNameEn, setNewIndNameEn] = useState("");
  const [newIndDescAr, setNewIndDescAr] = useState("");
  const [newIndCategory, setNewIndCategory] = useState<"pronunciation" | "grammar" | "vocabulary" | "literature">("pronunciation");
  const [newIndPhrase, setNewIndPhrase] = useState("");
  const [newIndCompetency, setNewIndCompetency] = useState("التواصل");

  // Filter students by selected grade
  const gradeStudents = students.filter(s => s.grade === selectedGradeFilter);

  // Grade themes list keys
  const allGrades = ["KG", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];

  // Calculate overall average score for active student
  const totalScore = student.measurements.reduce((sum, m) => sum + m.score, 0);
  const averageScore = Math.round(totalScore / Math.max(1, student.measurements.length));

  // Class grade stats
  const classAvgScore = gradeStudents.length > 0 
    ? Math.round(gradeStudents.reduce((acc, st) => {
        const avg = st.measurements.reduce((s, m) => s + m.score, 0) / Math.max(1, st.measurements.length);
        return acc + avg;
      }, 0) / gradeStudents.length)
    : 0;

  // Gamification metrics calculations
  const currentXp = student.xp || 380;
  const currentLevel = student.level || Math.floor(currentXp / 250) + 1;

  // Filter student indicators by category
  const filteredMeasurements = student.measurements.filter(m => {
    if (indicatorCategoryFilter === "all") return true;
    return m.category === indicatorCategoryFilter;
  });

  // Recharts Bar Data for Student Measurements
  const barChartData = student.measurements.map(m => ({
    name: m.code ? `${m.code}` : (isRtl ? m.nameAr : m.nameEn),
    fullName: isRtl ? m.nameAr : m.nameEn,
    score: m.score,
    category: m.category
  }));

  const getMasteryBadge = (score: number) => {
    if (score >= 85) {
      return {
        label: isRtl ? "متمكن (85%+)" : "Mastered (85%+)",
        bg: "bg-emerald-100 text-emerald-800 border-emerald-300",
        icon: CheckCircle2
      };
    }
    if (score >= 65) {
      return {
        label: isRtl ? "في طور النمو (65-84%)" : "Developing (65-84%)",
        bg: "bg-amber-100 text-amber-800 border-amber-300",
        icon: Sparkles
      };
    }
    return {
      label: isRtl ? "يحتاج ممارسة (<65%)" : "Needs Focus (<65%)",
      bg: "bg-rose-100 text-rose-800 border-rose-300",
      icon: Target
    };
  };

  // AI Diagnostic Generator
  const handleGenerateDiagnostic = async () => {
    setIsGeneratingDiagnostic(true);
    setAiDiagnosticReport(null);

    const subjectsPayload = student.measurements.map(m => ({
      name: `${m.code || ''}: ${isRtl ? m.nameAr : m.nameEn} (${m.indicatorAr || ''})`,
      score: m.score
    }));

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: "academic_report",
          language: settings.language,
          grade: student.grade,
          studentName: isRtl ? student.nameAr : student.nameEn,
          subjects: subjectsPayload
        })
      });

      if (!response.ok) throw new Error("Failed to generate AI progress diagnostic.");
      const data = await response.json();
      setAiDiagnosticReport(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGeneratingDiagnostic(false);
    }
  };

  // Create new student submit handler
  const handleCreateStudentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentNameAr.trim() || !onAddStudent) return;

    // Default measurements set for the new student
    const templateMeasurements: Measurement[] = student.measurements.map((m, idx) => ({
      ...m,
      id: `new-${Date.now()}-${idx}`,
      score: 70,
      attemptsCount: 0
    }));

    const newStudentObj: StudentProfile = {
      id: `student-custom-${Date.now()}`,
      nameAr: newStudentNameAr.trim(),
      nameEn: newStudentNameEn.trim() || newStudentNameAr.trim(),
      grade: newStudentGrade,
      xp: 250,
      level: 1,
      streakDays: 1,
      badges: student.badges || [],
      measurements: templateMeasurements,
      history: []
    };

    onAddStudent(newStudentObj);
    onSelectStudent(newStudentObj.id);
    setSelectedGradeFilter(newStudentGrade);
    setShowAddStudentModal(false);
    setNewStudentNameAr("");
    setNewStudentNameEn("");
  };

  // Create new indicator submit handler
  const handleCreateIndicatorSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIndNameAr.trim() || !onAddMeasurement) return;

    const newMeas: Measurement = {
      id: `m-custom-${Date.now()}`,
      code: newIndCode,
      indicatorCode: newIndNumber,
      nameAr: newIndNameAr.trim(),
      nameEn: newIndNameEn.trim() || newIndNameAr.trim(),
      indicatorAr: newIndDescAr.trim() || newIndNameAr.trim(),
      indicatorEn: newIndNameEn.trim() || newIndNameAr.trim(),
      category: newIndCategory,
      competencyAr: newIndCompetency,
      competencyEn: newIndCompetency,
      targetPhrase: newIndPhrase.trim() || (isRtl ? "العلم نور يضيء العقول" : "Learning illuminates minds"),
      score: 0,
      attemptsCount: 0
    };

    onAddMeasurement(student.id, newMeas);
    setShowAddIndicatorModal(false);
    setNewIndNameAr("");
    setNewIndNameEn("");
    setNewIndDescAr("");
    setNewIndPhrase("");
  };

  return (
    <div className="space-y-6" id="dashboard-tab-container">
      
      {/* Return to Stages Hub Button */}
      {onReturnHome && (
        <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
          <button
            onClick={onReturnHome}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-black flex items-center gap-2 cursor-pointer transition-all"
            id="dashboard-return-hub-btn"
          >
            <span>{isRtl ? "⬅ العودة إلى بوابة المراحل الرئيسية" : "⬅ Back to Stages Gateway"}</span>
          </button>
          <span className="text-xs font-bold text-[#8A1538] px-3 py-1 bg-amber-50 rounded-full border border-amber-200">
            {isRtl ? "المرحلة 3: لوحة مؤشرات الكفايات الوطنية والتقارير 🇶🇦" : "Stage 3: Competencies & Reports Hub 🇶🇦"}
          </span>
        </div>
      )}

      {/* 1. Grade Selector & Class Overview Navigation Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4" id="grade-filter-bar" dir={isRtl ? "rtl" : "ltr"}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-2.5 rounded-xl ${theme.bgLight} ${theme.textPrimary}`}>
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-serif font-black text-slate-800 flex items-center gap-2">
                <span>{isRtl ? "منظومة قياس وتتبع تقدم الطلاب بالنظام القطري" : "Qatari Curriculum AI Student Progress Engine"}</span>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 text-[10px] font-black">
                  13 {isRtl ? "صفاً دراسياً" : "Grades"}
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-semibold mt-0.5">
                {isRtl ? "اختر الصف الدراسي للاطلاع على قائمة الطلاب والمعايير والمؤشرات الوطنية الكاملة" : "Select grade level to measure student performance and master national indicators"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setShowAddStudentModal(true)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 transition-all cursor-pointer ${theme.bgPrimary} ${theme.bgPrimaryHover}`}
            >
              <Plus className="w-4 h-4" />
              <span>{isRtl ? "إضافة طالب جديد للصف" : "Add Student to Grade"}</span>
            </button>

            <button
              onClick={() => setShowAddIndicatorModal(true)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-slate-600" />
              <span>{isRtl ? "إضافة مؤشر / مهارة جديدة" : "Add New Indicator"}</span>
            </button>
          </div>
        </div>

        {/* Grade Pills Carousel */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {allGrades.map((gKey) => {
            const countInGrade = students.filter(s => s.grade === gKey).length;
            const isSelected = selectedGradeFilter === gKey;
            return (
              <button
                key={gKey}
                onClick={() => {
                  setSelectedGradeFilter(gKey);
                  const firstInGrade = students.find(s => s.grade === gKey);
                  if (firstInGrade) onSelectStudent(firstInGrade.id);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isSelected 
                    ? `${theme.bgPrimary} text-white shadow-xs` 
                    : "bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-100"
                }`}
              >
                <span>{gKey === "KG" ? (isRtl ? "الروضة KG" : "KG") : (isRtl ? `الصف ${gKey.replace('Grade ', '')}` : gKey)}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isSelected ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
                  {countInGrade}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Active Student & Grade Roster Banner */}
      <div className={`bg-white rounded-2xl border ${theme.border} p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-500`} id="student-selector-banner" dir={isRtl ? "rtl" : "ltr"}>
        <div className="flex items-center gap-4">
          <div className={`w-14 h-14 rounded-full ${theme.bgPrimary} text-white flex items-center justify-center font-bold text-xl shadow-md transition-all duration-500`}>
            {student.nameAr[0]}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-serif font-black text-slate-800">
                {isRtl ? student.nameAr : student.nameEn}
              </h2>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${theme.badge} flex items-center gap-1 transition-all duration-500`}>
                <GraduationCap className="w-3.5 h-3.5" />
                {isRtl ? theme.nameAr : theme.nameEn}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                <Zap className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
                {isRtl ? `المستوى ${currentLevel}` : `Level ${currentLevel}`}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-100 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-indigo-500" />
                {isRtl ? `مواظبة ${student.streakDays} أيام` : `${student.streakDays} Days Streak`}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-1">
              {isRtl ? `معدل إتقان المعايير الوطنية: ${averageScore}% • عدد المؤشرات المسجلة: ${student.measurements.length}` : `National Standards Mastery: ${averageScore}% • Indicators Tracked: ${student.measurements.length}`}
            </p>
          </div>
        </div>

        {/* Student Dropdown for current selected grade */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <label className="text-xs text-slate-400 font-bold uppercase">
            {isRtl ? "الطالب النشط بالصف:" : "Active Student in Grade:"}
          </label>
          <select
            value={student.id}
            onChange={(e) => onSelectStudent(e.target.value)}
            className={`px-3 py-2 bg-slate-50 border ${theme.border} rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer`}
          >
            {gradeStudents.map((s) => (
              <option key={s.id} value={s.id}>
                {isRtl ? s.nameAr : s.nameEn} (XP: {s.xp})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 3. Class Roster & Progress Summary Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4" dir={isRtl ? "rtl" : "ltr"}>
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">{isRtl ? "معدل الصف العام" : "Class Mastery Avg"}</p>
            <p className="text-2xl font-serif font-black text-slate-800 mt-1">{classAvgScore}%</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <BarChart3 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">{isRtl ? "طلاب الصف" : "Students in Grade"}</p>
            <p className="text-2xl font-serif font-black text-slate-800 mt-1">{gradeStudents.length} {isRtl ? "طلاب" : "Students"}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">{isRtl ? "المؤشرات والمهارات" : "Grade Indicators"}</p>
            <p className="text-2xl font-serif font-black text-slate-800 mt-1">{student.measurements.length} {isRtl ? "مؤشراً" : "Indicators"}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Compass className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase">{isRtl ? "المعايير المكتملة" : "Mastered Standards"}</p>
            <p className="text-2xl font-serif font-black text-slate-800 mt-1">
              {student.measurements.filter(m => m.score >= 85).length} / {student.measurements.length}
            </p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Trophy className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* 4. Class Roster Breakdown Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4" dir={isRtl ? "rtl" : "ltr"}>
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-serif font-black text-slate-800 flex items-center gap-2">
            <Users className={`w-5 h-5 ${theme.textPrimary}`} />
            <span>{isRtl ? `سجل أداء طلاب ${selectedGradeFilter}` : `Student Performance Table for ${selectedGradeFilter}`}</span>
          </h3>
          <span className="text-xs text-slate-400 font-bold">
            {isRtl ? "انقر على أي طالب للانتقال لمشاهدة قياساته" : "Click student to switch active profile"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-right">
            <thead>
              <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                <th className="p-3 text-right">{isRtl ? "اسم الطالب" : "Student Name"}</th>
                <th className="p-3 text-center">{isRtl ? "المستوى" : "Level"}</th>
                <th className="p-3 text-center">{isRtl ? "نقاط XP" : "XP Points"}</th>
                <th className="p-3 text-center">{isRtl ? "المواظبة" : "Streak"}</th>
                <th className="p-3 text-center">{isRtl ? "معدل الإتقان" : "Mastery Avg"}</th>
                <th className="p-3 text-center">{isRtl ? "المعايير المكتملة" : "Mastered Indicators"}</th>
                <th className="p-3 text-center">{isRtl ? "الإجراء" : "Action"}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {gradeStudents.map((st) => {
                const stAvg = Math.round(st.measurements.reduce((sum, m) => sum + m.score, 0) / Math.max(1, st.measurements.length));
                const masteredCount = st.measurements.filter(m => m.score >= 85).length;
                const isActive = st.id === student.id;
                return (
                  <tr key={st.id} className={`hover:bg-slate-50 transition-colors ${isActive ? "bg-indigo-50/50 font-bold" : ""}`}>
                    <td className="p-3 flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
                        {st.nameAr[0]}
                      </div>
                      <div>
                        <p className="text-slate-800 font-bold">{isRtl ? st.nameAr : st.nameEn}</p>
                        {isActive && <span className="text-[10px] text-indigo-600 font-black">{isRtl ? "(محدد حالياً)" : "(Active)"}</span>}
                      </div>
                    </td>
                    <td className="p-3 text-center font-bold text-slate-700">{st.level}</td>
                    <td className="p-3 text-center font-bold text-amber-600">{st.xp}</td>
                    <td className="p-3 text-center font-bold text-indigo-600">🔥 {st.streakDays}d</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-1 rounded-md text-xs font-bold ${stAvg >= 85 ? "bg-emerald-100 text-emerald-800" : stAvg >= 65 ? "bg-amber-100 text-amber-800" : "bg-rose-100 text-rose-800"}`}>
                        {stAvg}%
                      </span>
                    </td>
                    <td className="p-3 text-center font-bold text-slate-700">{masteredCount} / {st.measurements.length}</td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => onSelectStudent(st.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer ${isActive ? "bg-indigo-600 text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-700"}`}
                      >
                        {isRtl ? "عرض القياسات" : "View Indicators"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 5. Indicators & Skills Performance Chart */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4" dir={isRtl ? "rtl" : "ltr"}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-serif font-black text-slate-800 flex items-center gap-2">
              <BarChart3 className={`w-5 h-5 ${theme.textPrimary}`} />
              <span>{isRtl ? `رسم بياني لنقاء الأداء في المؤشرات (طالب: ${student.nameAr})` : `Indicator Accuracy Chart (${student.nameEn})`}</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {isRtl ? "يقيس هذا الرسم نسب الإتقان المئوية لجميع المؤشرات المسجلة في هذا الصف" : "Measures accuracy percentage across all registered indicators"}
            </p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748B' }} interval={0} angle={-15} textAnchor="end" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#64748B' }} />
              <Tooltip 
                formatter={(val: any) => [`${val}%`, isRtl ? "نسبة الإتقان" : "Accuracy"]} 
                labelFormatter={(name: string, payload: any[]) => {
                  if (payload && payload[0]) {
                    return `${name}: ${payload[0].payload.fullName}`;
                  }
                  return name;
                }}
              />
              <Bar dataKey="score" radius={[6, 6, 0, 0]}>
                {barChartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.score >= 85 ? "#10B981" : entry.score >= 65 ? "#F59E0B" : "#F43F5E"} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 6. AI Progress Diagnostics & Remediation Generator */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 rounded-2xl p-6 text-white shadow-lg space-y-4" dir={isRtl ? "rtl" : "ltr"}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20">
              <BrainCircuit className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <h3 className="text-lg font-serif font-black flex items-center gap-2">
                <span>{isRtl ? "مستشار الذكاء الاصطناعي لقياس وتتبع التقدم (AI Diagnostic Agent)" : "AI Educational Progress Diagnostic Agent"}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400 text-slate-900 font-bold">
                  Gemini AI
                </span>
              </h3>
              <p className="text-xs text-indigo-200 mt-1 max-w-2xl leading-relaxed">
                {isRtl ? `توليد تقرير تشخيصي شامل لمهارات ${student.nameAr} في ${student.grade}، وتحديد الفجوات النطقية والنحوية بدقة وتوصية بخطة علاجية مخصصة.` : `Generate a comprehensive diagnostic report for ${student.nameEn} in ${student.grade}, identifying phonetic gaps and custom intervention.`}
              </p>
            </div>
          </div>

          <button
            onClick={handleGenerateDiagnostic}
            disabled={isGeneratingDiagnostic}
            className={`px-5 py-3 rounded-xl text-xs font-black bg-amber-400 hover:bg-amber-300 text-slate-900 shadow-md transition-all cursor-pointer shrink-0 flex items-center gap-2 ${
              isGeneratingDiagnostic ? "opacity-75 cursor-wait" : ""
            }`}
          >
            <Sparkles className={`w-4 h-4 ${isGeneratingDiagnostic ? "animate-spin" : ""}`} />
            <span>{isGeneratingDiagnostic ? (isRtl ? "جاري تحليل بيانات التقدم..." : "Analyzing Progress...") : (isRtl ? "🔮 توليد تقرير التشخيص بالذكاء الاصطناعي" : "🔮 Generate AI Diagnostic Report")}</span>
          </button>
        </div>

        {/* Diagnostic Results Display */}
        {aiDiagnosticReport && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-5 text-xs space-y-4"
          >
            <div>
              <h4 className="font-bold text-amber-300 text-sm mb-1">{isRtl ? "الملخص التشخيصي الشامل:" : "Diagnostic Executive Summary:"}</h4>
              <p className="text-indigo-100 leading-relaxed whitespace-pre-line">{aiDiagnosticReport.summary}</p>
            </div>

            {aiDiagnosticReport.strengths && aiDiagnosticReport.strengths.length > 0 && (
              <div>
                <h4 className="font-bold text-emerald-300 text-xs mb-1">{isRtl ? "أبرز كفايات ونقاط القوة:" : "Key Competency Strengths:"}</h4>
                <ul className="list-disc list-inside space-y-1 text-indigo-100">
                  {aiDiagnosticReport.strengths.map((st, i) => (
                    <li key={i}>{st}</li>
                  ))}
                </ul>
              </div>
            )}

            {aiDiagnosticReport.actionPlan && aiDiagnosticReport.actionPlan.length > 0 && (
              <div>
                <h4 className="font-bold text-amber-300 text-xs mb-1.5">{isRtl ? "خطة التدخل والعلاج الموصى بها:" : "Recommended Learning Intervention Plan:"}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {aiDiagnosticReport.actionPlan.map((act, i) => (
                    <div key={i} className="bg-black/20 p-3 rounded-xl border border-white/10">
                      <p className="font-bold text-amber-200">{act.subject}</p>
                      <p className="text-indigo-100 mt-1">{act.advice}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* 7. Full Indicators & Skills Master List (جميع المؤشرات والمهارات الوطنية بالصف) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5" id="all-indicators-list" dir={isRtl ? "rtl" : "ltr"}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-serif font-black text-slate-800 flex items-center gap-2">
              <Compass className={`w-5 h-5 ${theme.textPrimary}`} />
              <span>{isRtl ? `جدول المعايير والمؤشرات الوطنية الكاملة (${selectedGradeFilter})` : `Complete MoEHE Indicators & Skills List (${selectedGradeFilter})`}</span>
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {isRtl ? `يعرض هذا الجدول كافة المؤشرات القابلة للقياس المعتمدة بالمنهج القطري لـ ${selectedGradeFilter} (${filteredMeasurements.length} مؤشر)` : `Displays all measurable indicators approved for ${selectedGradeFilter} (${filteredMeasurements.length} indicators)`}
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setIndicatorCategoryFilter("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                indicatorCategoryFilter === "all" ? "bg-slate-800 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {isRtl ? "كافة المهارات" : "All Domains"}
            </button>
            <button
              onClick={() => setIndicatorCategoryFilter("pronunciation")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                indicatorCategoryFilter === "pronunciation" ? "bg-emerald-600 text-white" : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
              }`}
            >
              {isRtl ? "النطق والمخارج" : "Pronunciation"}
            </button>
            <button
              onClick={() => setIndicatorCategoryFilter("grammar")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                indicatorCategoryFilter === "grammar" ? "bg-indigo-600 text-white" : "bg-indigo-50 text-indigo-700 hover:bg-indigo-100"
              }`}
            >
              {isRtl ? "النحو والإعراب" : "Grammar"}
            </button>
            <button
              onClick={() => setIndicatorCategoryFilter("vocabulary")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                indicatorCategoryFilter === "vocabulary" ? "bg-purple-600 text-white" : "bg-purple-50 text-purple-700 hover:bg-purple-100"
              }`}
            >
              {isRtl ? "المفردات والبحث" : "Vocabulary"}
            </button>
            <button
              onClick={() => setIndicatorCategoryFilter("literature")}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                indicatorCategoryFilter === "literature" ? "bg-amber-600 text-white" : "bg-amber-50 text-amber-700 hover:bg-amber-100"
              }`}
            >
              {isRtl ? "الأدب والبلاغة" : "Literature"}
            </button>
          </div>
        </div>

        {/* Indicators Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredMeasurements.map((m) => {
            const badge = getMasteryBadge(m.score);
            const BadgeIcon = badge.icon;
            return (
              <div 
                key={m.id}
                className="bg-slate-50/70 border border-slate-200 hover:border-indigo-200 rounded-2xl p-5 shadow-2xs space-y-3 transition-all group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2.5 py-1 rounded-md text-[11px] font-black uppercase ${theme.badge}`}>
                      {m.code || "المعيار الرئيسي"}
                    </span>
                    <span className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 rounded-md text-[11px] font-black">
                      {m.indicatorCode || "مؤشر أداء"}
                    </span>
                    {m.competencyAr && (
                      <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded-md text-[10px] font-bold border border-purple-100">
                        {isRtl ? m.competencyAr : m.competencyEn}
                      </span>
                    )}
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 ${badge.bg}`}>
                    <BadgeIcon className="w-3 h-3" />
                    {badge.label}
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-serif font-black text-slate-800">
                    {isRtl ? m.nameAr : m.nameEn}
                  </h4>
                  {m.indicatorAr && (
                    <p className="text-xs text-slate-600 font-medium mt-1 leading-relaxed bg-white p-3 rounded-xl border border-slate-100">
                      <strong>{isRtl ? "المؤشر القابل للقياس:" : "Measurable Indicator:"}</strong> {isRtl ? m.indicatorAr : m.indicatorEn}
                    </p>
                  )}
                </div>

                {/* Target Practice Phrase */}
                {m.targetPhrase && (
                  <div className="bg-indigo-50/60 p-2.5 rounded-xl border border-indigo-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <Volume2 className="w-4 h-4 text-indigo-600 shrink-0" />
                      <span className="text-xs font-serif font-bold text-indigo-950 dir-rtl">
                        "{m.targetPhrase}"
                      </span>
                    </div>
                    <span className="text-[10px] text-indigo-500 font-bold shrink-0">{isRtl ? "العبارة المعتمدة" : "Target Phrase"}</span>
                  </div>
                )}

                {/* Progress Bar & Action */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-slate-500">{isRtl ? "نسبة إتقان المهارة:" : "Skill Mastery:"}</span>
                      <span className="text-slate-800">{m.score}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${m.score >= 85 ? "bg-emerald-500" : m.score >= 65 ? "bg-amber-500" : "bg-rose-500"}`}
                        style={{ width: `${m.score}%` }}
                      />
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (onNavigateToPractice) {
                        onNavigateToPractice(m.id);
                      }
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1 transition-all cursor-pointer shrink-0 ${theme.bgPrimary} ${theme.bgPrimaryHover}`}
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>{isRtl ? "ممارسة بالنطق" : "Practice"}</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: Add New Student */}
      <AnimatePresence>
        {showAddStudentModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4"
              dir={isRtl ? "rtl" : "ltr"}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-serif font-black text-slate-800 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  <span>{isRtl ? "إضافة طالب جديد للمنظومة" : "Add New Student to Platform"}</span>
                </h3>
                <button 
                  onClick={() => setShowAddStudentModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateStudentSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {isRtl ? "اسم الطالب باللغة العربية *" : "Student Arabic Name *"}
                  </label>
                  <input 
                    type="text"
                    required
                    value={newStudentNameAr}
                    onChange={(e) => setNewStudentNameAr(e.target.value)}
                    placeholder={isRtl ? "مثال: عبد العزيز الكواري" : "e.g., Abdulaziz Al-Kuwari"}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {isRtl ? "اسم الطالب باللغة الإنجليزية" : "Student English Name"}
                  </label>
                  <input 
                    type="text"
                    value={newStudentNameEn}
                    onChange={(e) => setNewStudentNameEn(e.target.value)}
                    placeholder="e.g., Abdulaziz Al-Kuwari"
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    {isRtl ? "الصف الدراسي *" : "Grade Level *"}
                  </label>
                  <select 
                    value={newStudentGrade}
                    onChange={(e) => setNewStudentGrade(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                  >
                    {allGrades.map(g => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button 
                    type="button"
                    onClick={() => setShowAddStudentModal(false)}
                    className="px-4 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-200 cursor-pointer"
                  >
                    {isRtl ? "إلغاء" : "Cancel"}
                  </button>
                  <button 
                    type="submit"
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs cursor-pointer"
                  >
                    {isRtl ? "حفظ الطالب" : "Save Student"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Add Custom Indicator */}
      <AnimatePresence>
        {showAddIndicatorModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
              dir={isRtl ? "rtl" : "ltr"}
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="text-base font-serif font-black text-slate-800 flex items-center gap-2">
                  <Compass className="w-5 h-5 text-indigo-600" />
                  <span>{isRtl ? "إضافة مؤشر / مهارة إضافية للمنهج" : "Add Custom Curriculum Indicator"}</span>
                </h3>
                <button 
                  onClick={() => setShowAddIndicatorModal(false)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateIndicatorSubmit} className="space-y-4 text-xs font-bold text-slate-700">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1">{isRtl ? "رمز المعيار (مثال: المعيار 1.9)" : "Standard Code"}</label>
                    <input 
                      type="text" 
                      required 
                      value={newIndCode} 
                      onChange={e => setNewIndCode(e.target.value)} 
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" 
                    />
                  </div>
                  <div>
                    <label className="block mb-1">{isRtl ? "رمز المؤشر (مثال: مؤشر 1.9.1)" : "Indicator Code"}</label>
                    <input 
                      type="text" 
                      required 
                      value={newIndNumber} 
                      onChange={e => setNewIndNumber(e.target.value)} 
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-1">{isRtl ? "عنوان المهارة بالعربية *" : "Skill Name (Arabic) *"}</label>
                  <input 
                    type="text" 
                    required 
                    value={newIndNameAr} 
                    onChange={e => setNewIndNameAr(e.target.value)} 
                    placeholder="مثال: نطق أسلوب الشرط وجوابه" 
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" 
                  />
                </div>

                <div>
                  <label className="block mb-1">{isRtl ? "الوصف التفصيلي للمؤشر القابل للقياس" : "Detailed Measurable Indicator"}</label>
                  <textarea 
                    value={newIndDescAr} 
                    onChange={e => setNewIndDescAr(e.target.value)} 
                    placeholder="ينطق أفعال الشرط والجواب بضبط السكون بدقة" 
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl h-16" 
                  />
                </div>

                <div>
                  <label className="block mb-1">{isRtl ? "العبارة المعتمدة للممارسة الصوتية *" : "Target Practice Phrase *"}</label>
                  <input 
                    type="text" 
                    required 
                    value={newIndPhrase} 
                    onChange={e => setNewIndPhrase(e.target.value)} 
                    placeholder="مثال: مَنْ يَعْمَلْ صَالِحًا يَنْجَحْ" 
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" 
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block mb-1">{isRtl ? "المجال / الفئة" : "Domain Category"}</label>
                    <select 
                      value={newIndCategory} 
                      onChange={e => setNewIndCategory(e.target.value as any)} 
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
                    >
                      <option value="pronunciation">{isRtl ? "النطق والمخارج" : "Pronunciation"}</option>
                      <option value="grammar">{isRtl ? "النحو والإعراب" : "Grammar"}</option>
                      <option value="vocabulary">{isRtl ? "المفردات والبحث" : "Vocabulary"}</option>
                      <option value="literature">{isRtl ? "الأدب والبلاغة" : "Literature"}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1">{isRtl ? "الكفاية الوطنية" : "Competency Tag"}</label>
                    <input 
                      type="text" 
                      value={newIndCompetency} 
                      onChange={e => setNewIndCompetency(e.target.value)} 
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl" 
                    />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button 
                    type="button" 
                    onClick={() => setShowAddIndicatorModal(false)}
                    className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 cursor-pointer"
                  >
                    {isRtl ? "إلغاء" : "Cancel"}
                  </button>
                  <button 
                    type="submit" 
                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs cursor-pointer"
                  >
                    {isRtl ? "حفظ المؤشر" : "Save Indicator"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
