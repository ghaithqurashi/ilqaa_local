import React, { useState } from "react";
import { 
  Sparkles, 
  Award, 
  TrendingUp, 
  BookOpen, 
  AlertCircle, 
  CheckCircle2, 
  FileText,
  Heart
} from "lucide-react";
import { StudentProfile, AppSettings, AIReportCard } from "../types";
import { Dictionary } from "../translations";
import { motion } from "motion/react";

interface AcademicReportsTabProps {
  student: StudentProfile;
  settings: AppSettings;
  dict: Dictionary;
  theme: any;
}

export const AcademicReportsTab: React.FC<AcademicReportsTabProps> = ({
  student,
  settings,
  dict,
  theme
}) => {
  const isRtl = settings.language === "ar";
  
  // AI Progress Report Card States
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<AIReportCard | null>(null);
  const [error, setError] = useState("");

  // Calculate Average subject score
  const overallAverage = Math.round(
    student.measurements.reduce((sum, m) => sum + m.score, 0) / Math.max(1, student.measurements.length)
  );

  // Generate Report Card summary using Gemini
  const handleGenerateReportCard = async () => {
    setIsGenerating(true);
    setError("");
    setReport(null);

    const subjectsPayload = student.measurements.map(m => ({
      name: isRtl ? m.nameAr : m.nameEn,
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
          subjects: subjectsPayload
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to generate academic report.");
      }

      const reportData = await response.json();
      setReport(reportData);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred. Make sure Gemini API key is configured.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in" id="academic-reports-tab">
      
      {/* Skill Averages Grid */}
      <div className={`bg-white rounded-2xl border ${theme.border} p-6 shadow-sm`} id="averages-analysis-card">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5 mb-5">
          <div>
            <h3 className="text-lg font-serif font-black text-slate-800 flex items-center gap-1.5">
              <BookOpen className={`w-5 h-5 ${theme.textPrimary}`} />
              {isRtl ? "المتوسطات الحسابية لمهارات الطالب" : "Student Skill Averages"}
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-1">
              {dict.reportsSubtitle}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase">
              {isRtl ? "المعدل العام للقياس:" : "Overall Metric Avg:"}
            </span>
            <span className={`text-2xl font-serif font-black ${theme.textPrimary} ${theme.bgLight} border ${theme.border} px-4 py-1.5 rounded-xl transition-all duration-500`}>
              {overallAverage}%
            </span>
          </div>
        </div>

        {/* Detailed Progress Bars for each Custom Metric */}
        <div className="space-y-5" id="subject-progress-bars">
          {student.measurements.map((m) => (
            <div key={m.id} className="space-y-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-bold text-slate-700">
                  {isRtl ? m.nameAr : m.nameEn}
                </span>
                <span className={`font-black ${theme.textPrimary}`}>
                  {m.score}%
                </span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden flex">
                <div 
                  className={`h-full rounded-full transition-all duration-500`}
                  style={{ 
                    width: `${m.score}%`,
                    backgroundColor: theme.logoBg
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Progress Report Section */}
      <div className={`bg-white rounded-2xl border ${theme.border} p-6 shadow-sm flex flex-col gap-5`} id="ai-report-card-panel">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
          <div className="space-y-1">
            <h3 className="text-base font-serif font-black text-slate-800 flex items-center gap-2">
              <Sparkles className={`w-5 h-5 ${theme.textPrimary}`} />
              {dict.reportCardTitle}
            </h3>
            <p className="text-xs text-slate-400 font-medium">
              {isRtl 
                ? "انقر لتوليد شهادة تقييم دراسية مفصلة تشرح نقاط قوة الطالب وتقدم خطة تطوير بيداغوجية مدعومة بذكاء Gemini."
                : "Click to generate a comprehensive pedagogical report card showing strengths and developmental plans."}
            </p>
          </div>

          <button
            onClick={handleGenerateReportCard}
            disabled={isGenerating}
            className={`w-full md:w-auto px-6 py-3.5 rounded-xl font-bold text-sm ${theme.bgPrimary} ${theme.bgPrimaryHover} text-white transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-75 cursor-pointer`}
          >
            <Sparkles className="w-4 h-4" />
            {isGenerating ? dict.generatingFeedback : dict.generateReport}
          </button>
        </div>

        {/* Loading Spinner */}
        {isGenerating && (
          <div className="py-16 flex flex-col items-center justify-center space-y-4">
            <div className={`w-12 h-12 border-4 ${theme.textPrimary} border-t-transparent rounded-full animate-spin`} />
            <p className="text-xs text-slate-400 font-bold animate-pulse">
              {dict.generatingFeedback}
            </p>
          </div>
        )}

        {/* Error Handling */}
        {error && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-100 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Render Generated AI Progress Report Card */}
        {report && !isGenerating && (
          <div className="space-y-6 pt-2 animate-fade-in" dir={isRtl ? "rtl" : "ltr"}>
            
            {/* Executive summary card */}
            <div className={`${theme.bgLight} p-5 rounded-2xl border ${theme.border} transition-all duration-500`}>
              <h4 className={`text-xs font-black ${theme.textPrimary} uppercase tracking-wider mb-2 flex items-center gap-1.5`}>
                <FileText className="w-4 h-4" />
                {dict.reportSummary}
              </h4>
              <p className="text-sm text-slate-700 leading-relaxed font-bold">
                {report.summary}
              </p>
            </div>

            {/* Strengths Section */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Award className={`w-4 h-4 ${theme.textPrimary}`} />
                {dict.strengths}
              </h4>
              <div className="flex flex-wrap gap-2">
                {report.strengths.map((str, idx) => (
                  <span 
                    key={idx} 
                    className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-100 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    {str}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Plan */}
            <div className="space-y-3">
              <h4 className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp className={`w-4 h-4 ${theme.textPrimary}`} />
                {dict.developmentalActionPlan}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {report.actionPlan.map((action, idx) => (
                  <div key={idx} className="p-4 bg-white border border-slate-100 rounded-2xl space-y-1.5 hover:shadow-xs transition-shadow">
                    <span className={`text-[10px] font-black ${theme.textLight} ${theme.bgLight} border ${theme.border} px-2.5 py-0.5 rounded-md inline-block`}>
                      {action.subject}
                    </span>
                    <p className="text-xs text-slate-500 leading-relaxed font-bold">
                      {action.advice}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Closing Motivational Message */}
            <div className={`${theme.bgLight} p-5 rounded-2xl border ${theme.border} flex items-start gap-3 transition-all duration-500`}>
              <Heart className="w-5 h-5 text-rose-500 fill-rose-100 shrink-0 mt-0.5 animate-pulse" />
              <div>
                <h5 className={`text-xs font-black ${theme.textPrimary} mb-1 uppercase tracking-wider`}>
                  {isRtl ? "رسالة معلم الأجيال:" : "Counselor's Closing Message:"}
                </h5>
                <p className="text-xs text-slate-700 font-bold leading-relaxed italic">
                  "{report.closingMessage}"
                </p>
              </div>
            </div>

          </div>
        )}
      </div>

    </div>
  );
};
