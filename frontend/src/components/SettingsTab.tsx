import React, { useState, useEffect } from "react";
import { 
  Settings as SettingsIcon, 
  Save, 
  RotateCcw, 
  Sparkles, 
  Plus, 
  Trash2, 
  Languages, 
  Info,
  CheckCircle2,
  Moon,
  Sun
} from "lucide-react";
import { AppSettings, StudentProfile, Measurement } from "../types";
import { Dictionary } from "../translations";

interface SettingsTabProps {
  settings: AppSettings;
  dict: Dictionary;
  onSaveSettings: (settings: AppSettings) => void;
  onResetDefaults: () => void;
  theme: any;
  activeStudent: StudentProfile;
  onUpdateStudentMeasurements: (studentId: string, updatedMeasurements: Measurement[]) => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  settings,
  dict,
  onSaveSettings,
  onResetDefaults,
  theme,
  activeStudent,
  onUpdateStudentMeasurements,
  isDarkMode = true,
  onToggleDarkMode
}) => {
  const isRtl = settings.language === "ar";

  // Local state for app settings
  const [localLanguage, setLocalLanguage] = useState<"ar" | "en">(settings.language);
  const [localDarkMode, setLocalDarkMode] = useState<boolean>(settings.darkMode ?? isDarkMode);
  const [localGrade, setLocalGrade] = useState<string>(activeStudent.grade);

  // Local state for active student measurements (with targetPhrase editable)
  const [localMeasurements, setLocalMeasurements] = useState<Measurement[]>([]);

  // Keep local measurements synchronized with the active student profile on load
  useEffect(() => {
    if (activeStudent) {
      setLocalGrade(activeStudent.grade);
      setLocalMeasurements(activeStudent.measurements || []);
    }
  }, [activeStudent]);

  // Handle measurement row input changes
  const handleMeasurementChange = (idx: number, field: keyof Measurement, value: any) => {
    const updated = [...localMeasurements];
    updated[idx] = {
      ...updated[idx],
      [field]: value
    };
    setLocalMeasurements(updated);
  };

  // Handle saving configurations
  const handleSaveAll = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Update student's specific measurement list and target phrases in the database
    onUpdateStudentMeasurements(activeStudent.id, localMeasurements);

    // 2. Prepare new global app settings payload
    const updatedSettings: AppSettings = {
      ...settings,
      language: localLanguage,
      darkMode: localDarkMode,
      grade: localGrade,
      measurementsList: localMeasurements.map(m => ({
        id: m.id,
        nameAr: m.nameAr,
        nameEn: m.nameEn,
        category: m.category,
        targetPhrase: m.targetPhrase // Save active phrase back to global config
      }))
    };

    if (localDarkMode !== isDarkMode && onToggleDarkMode) {
      onToggleDarkMode();
    }

    onSaveSettings(updatedSettings);
  };

  return (
    <div className="space-y-6 animate-fade-in" id="settings-tab">
      <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm" id="settings-card-panel">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-6">
          <SettingsIcon className={`w-5 h-5 ${theme.textPrimary}`} />
          <h3 className="text-base font-serif font-black text-slate-800">
            {dict.settings} — {isRtl ? `إعدادات المنصة وملف ${activeStudent.nameAr}` : `Platform Settings & ${activeStudent.nameEn}`}
          </h3>
        </div>

        <form onSubmit={handleSaveAll} className="space-y-6">
          {/* Main Selectors row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Theme / Night Vision Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Moon className="w-3.5 h-3.5 text-amber-500" />
                {isRtl ? "نمط الرؤية (الإضاءة)" : "Visual Theme Mode"}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLocalDarkMode(true);
                    if (!isDarkMode && onToggleDarkMode) onToggleDarkMode();
                  }}
                  className={`py-2.5 px-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    localDarkMode
                      ? "bg-[#1E0C17] border-[#8A1538] text-[#FDE68A] ring-2 ring-[#D4AF37]/40 shadow-sm"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Moon className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isRtl ? "رؤية ليلية 🌙" : "Night Dark"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLocalDarkMode(false);
                    if (isDarkMode && onToggleDarkMode) onToggleDarkMode();
                  }}
                  className={`py-2.5 px-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                    !localDarkMode
                      ? "bg-amber-50 border-amber-300 text-amber-900 ring-2 ring-amber-400/40 shadow-sm"
                      : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Sun className="w-3.5 h-3.5 text-amber-500" />
                  <span>{isRtl ? "نهاري ناصع ☀️" : "Light Day"}</span>
                </button>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                {isRtl ? "تمت موائمة الرؤية الليلية مع الحركات التشكيلية والخط العنابي والذهبي." : "Optimized for Arabic diacritics and Qatari royal maroon & gold."}
              </p>
            </div>

            {/* Language Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Languages className="w-3.5 h-3.5 text-slate-400" />
                {dict.language}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLocalLanguage("ar")}
                  className={`py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    localLanguage === "ar"
                      ? `${theme.bgLight} ${theme.border} border-2 text-slate-800`
                      : "bg-white border-slate-100 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  العربية (Arabic)
                </button>
                <button
                  type="button"
                  onClick={() => setLocalLanguage("en")}
                  className={`py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    localLanguage === "en"
                      ? `${theme.bgLight} ${theme.border} border-2 text-slate-800`
                      : "bg-white border-slate-100 text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  English
                </button>
              </div>
            </div>

            {/* Current Student Grade Indicator */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                {isRtl ? "المستوى الصفي للطالب النشط" : "Active Student Grade"}
              </label>
              <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-600 flex items-center justify-between">
                <span>{isRtl ? theme.nameAr : theme.nameEn}</span>
                <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-md ${theme.badge}`}>
                  {localGrade}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                {isRtl 
                  ? "لتجربة مستويات صفية مختلفة، يرجى التبديل بين الطلاب في لوحة المعلومات أو تسجيل الدخول."
                  : "To experience different grades, switch students on the Dashboard or login gateway."}
              </p>
            </div>
          </div>

          {/* National Measurements and editable target words */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <h4 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                  <Sparkles className={`w-4 h-4 ${theme.textPrimary}`} />
                  {isRtl ? "تخصيص مؤشرات القياس والكلمات المستهدفة" : "Customize Standard Measurements & Target Phrases"}
                </h4>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {isRtl 
                    ? "حدد العبارة أو الكلمة المستهدفة التي يجب على الطالب نطقها لقياس كل مهارة."
                    : "Specify the exact phrase or word the student must pronounce to measure each metric."}
                </p>
              </div>
            </div>

            <div className="space-y-4" id="custom-measurements-editor">
              {localMeasurements.map((m, idx) => (
                <div 
                  key={m.id} 
                  className={`p-4 bg-slate-50/50 rounded-2xl border border-slate-100 space-y-3 hover:border-slate-200 transition-all`}
                >
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded-md ${theme.badge}`}>
                      {isRtl ? `المؤشر الأول - مهارة ${idx + 1}` : `Standard Metric ${idx + 1}`}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono font-bold">{m.id}</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Measurement Name Arabic */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">
                        {isRtl ? "اسم مهارة القياس (العربية)" : "Metric Name (Arabic)"}
                      </label>
                      <input
                        type="text"
                        value={m.nameAr}
                        onChange={(e) => handleMeasurementChange(idx, "nameAr", e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-slate-300"
                        required
                      />
                    </div>

                    {/* Measurement Name English */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">
                        {isRtl ? "اسم مهارة القياس (الإنجليزية)" : "Metric Name (English)"}
                      </label>
                      <input
                        type="text"
                        value={m.nameEn}
                        onChange={(e) => handleMeasurementChange(idx, "nameEn", e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-slate-300"
                        required
                      />
                    </div>
                  </div>

                  {/* Target Phrase to match pronunciation */}
                  <div className="space-y-1 pt-1">
                    <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                      <Info className={`w-3.5 h-3.5 ${theme.textPrimary}`} />
                      {isRtl ? "العبارة المستهدفة بالنطق (الكلمة أو الجملة لتجربة الطالب)" : "Pronunciation Target Phrase (the sentence/words the student must say)"}
                    </label>
                    <input
                      type="text"
                      value={m.targetPhrase || ""}
                      onChange={(e) => handleMeasurementChange(idx, "targetPhrase", e.target.value)}
                      placeholder={isRtl ? "مثال: أ ب ت ث أو قَرَأَ الْكِتَابَ" : "e.g. A B C D or read the book"}
                      className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-mono font-bold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-slate-300"
                      dir={isRtl ? "rtl" : "ltr"}
                      required
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Form buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              className={`w-full sm:w-auto px-6 py-3.5 rounded-full font-bold text-sm text-white ${theme.bgPrimary} ${theme.bgPrimaryHover} shadow-md flex items-center justify-center gap-2 cursor-pointer`}
            >
              <Save className="w-4 h-4" />
              {isRtl ? "حفظ التغييرات" : "Save Configurations"}
            </button>

            <button
              type="button"
              onClick={onResetDefaults}
              className="w-full sm:w-auto px-5 py-3.5 rounded-full font-bold text-slate-500 hover:bg-slate-50 border border-slate-200 text-sm flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              {dict.resetDefaults}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
