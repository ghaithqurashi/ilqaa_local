import React, { useState } from "react";
import { RotateCcw, AlertTriangle, Trash2, CheckCircle2, X, RefreshCw } from "lucide-react";

interface ResetAllModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmResetCurrentStudent: () => void;
  onConfirmResetEntirePlatform: () => void;
  currentStudentName: string;
  isRtl: boolean;
}

export function ResetAllModal({
  isOpen,
  onClose,
  onConfirmResetCurrentStudent,
  onConfirmResetEntirePlatform,
  currentStudentName,
  isRtl
}: ResetAllModalProps) {
  const [resetOption, setResetOption] = useState<"current_student" | "all_platform">("current_student");
  const [isSuccessFeedback, setIsSuccessFeedback] = useState(false);

  if (!isOpen) return null;

  const handleExecute = () => {
    if (resetOption === "current_student") {
      onConfirmResetCurrentStudent();
    } else {
      onConfirmResetEntirePlatform();
    }
    setIsSuccessFeedback(true);
    setTimeout(() => {
      setIsSuccessFeedback(false);
      onClose();
    }, 900);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn" id="reset-all-modal-backdrop">
      <div className="bg-white dark:bg-[#15060D] text-slate-900 dark:text-white w-full max-w-lg rounded-3xl p-6 shadow-2xl border-2 border-red-500/30 relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 end-5 p-2 rounded-full text-slate-400 hover:text-slate-600 dark:hover:text-white bg-slate-100 dark:bg-slate-800 transition-all cursor-pointer"
          title="إغلاق"
        >
          <X className="w-5 h-5" />
        </button>

        {isSuccessFeedback ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-300 flex items-center justify-center animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="font-serif font-black text-xl text-emerald-700 dark:text-emerald-400">
              {isRtl ? "تمت إعادة التهيئة وتصفير السجلات بنجاح! 🔄" : "Reset Completed Successfully! 🔄"}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isRtl ? "تم تفريغ كافة الإجابات والنصوص السابقة والبدء من الصفر." : "All previous answers, transcripts and cache cleared."}
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Modal Header */}
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 border border-red-200 dark:border-red-800">
                <RotateCcw className="w-6 h-6 animate-spin-slow" />
              </div>
              <div>
                <h3 className="font-serif font-black text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{isRtl ? "تصفير وإعادة تهيئة البيانات (Reset)" : "Reset & Clear Testing Data"}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                  {isRtl
                    ? "اختر نوع التصفير المطلوب لمحو أي إجابات أو محاولات أو نصوص سابقة والبدء بتجربة جديدة نقية."
                    : "Select the reset scope to wipe previous answers, recordings, or transcripts for fresh testing."}
                </p>
              </div>
            </div>

            {/* Scope Options */}
            <div className="space-y-3">
              <label 
                onClick={() => setResetOption("current_student")}
                className={`p-4 rounded-2xl border-2 flex items-start gap-3.5 cursor-pointer transition-all ${
                  resetOption === "current_student"
                    ? "border-red-500 bg-red-50/50 dark:bg-red-950/30 ring-2 ring-red-400/30"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="reset_scope"
                  checked={resetOption === "current_student"}
                  onChange={() => setResetOption("current_student")}
                  className="mt-1 accent-red-600"
                />
                <div className="space-y-0.5">
                  <span className="font-bold text-sm text-slate-900 dark:text-white block">
                    {isRtl ? `تصفير بيانات الطالب الحالي فقط (${currentStudentName})` : `Reset current student only (${currentStudentName})`}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block leading-relaxed">
                    {isRtl 
                      ? "محو سجل المحاولات الصوتية، تصفير إجابات الأسئلة والمعايير، وتفريغ منصة الإلقاء لهذا الطالب."
                      : "Clears practice history, resets active question answers, and cleans the live stage transcript."}
                  </span>
                </div>
              </label>

              <label 
                onClick={() => setResetOption("all_platform")}
                className={`p-4 rounded-2xl border-2 flex items-start gap-3.5 cursor-pointer transition-all ${
                  resetOption === "all_platform"
                    ? "border-red-600 bg-red-100/50 dark:bg-red-950/50 ring-2 ring-red-500/40"
                    : "border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-900/40 hover:border-slate-300"
                }`}
              >
                <input
                  type="radio"
                  name="reset_scope"
                  checked={resetOption === "all_platform"}
                  onChange={() => setResetOption("all_platform")}
                  className="mt-1 accent-red-600"
                />
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-red-600 dark:text-red-400">
                      {isRtl ? "تصفير شامل وكامل للمنصة ولكافة الطلاب (Factory Reset)" : "Full Factory Reset (All Students & Cache)"}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black">
                      {isRtl ? "شامل" : "All"}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block leading-relaxed">
                    {isRtl 
                      ? "إعادة تعيين كافة المراحل والطلاب والصفوف إلى الحالة الأولية النقية، ومسح الذاكرة المؤقتة بالكامل."
                      : "Restores all grades, students, and indicators to default clean state, wiping cached attempts."}
                  </span>
                </div>
              </label>
            </div>

            {/* Warning Note */}
            <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/50 flex items-center gap-2.5 text-xs text-amber-800 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                {isRtl 
                  ? "سيتم فوراً مسح النصوص المسجلة وتفريغ منصة الإلقاء لتتمكن من خوض تجربة جديدة نقية."
                  : "Recorded audio, cached evaluations, and previous transcripts will be cleared immediately."}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold transition-all cursor-pointer"
              >
                {isRtl ? "إلغاء" : "Cancel"}
              </button>

              <button
                type="button"
                onClick={handleExecute}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white text-xs font-black transition-all flex items-center gap-2 shadow-lg shadow-red-600/30 cursor-pointer"
                id="confirm-reset-all-btn"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isRtl ? "تنفيذ التصفير الآن 🔄" : "Execute Reset Now 🔄"}</span>
              </button>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
