import React, { useState } from "react";
import {
  Award,
  Building2,
  CheckCircle2,
  FileText,
  Printer,
  Sparkles,
  Star,
  Search,
  Filter,
  Users,
  Video,
  Mic,
  TrendingUp,
  Download,
  Share2,
  Eye,
  ShieldCheck
} from "lucide-react";
import { UserSession, TalentNominationRecord } from "../types";
import { INITIAL_TALENT_RECORDS } from "../data/userSessions";
import { MinistryLogo } from "./MinistryLogo";

interface MinistryTalentHubProps {
  userSession: UserSession;
  isRtl?: boolean;
}

export const MinistryTalentHub: React.FC<MinistryTalentHubProps> = ({
  userSession,
  isRtl = true
}) => {
  const [talentRecords, setTalentRecords] = useState<TalentNominationRecord[]>(INITIAL_TALENT_RECORDS);
  const [selectedTier, setSelectedTier] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedRecordForCertificate, setSelectedRecordForCertificate] = useState<TalentNominationRecord | null>(null);

  const filteredRecords = talentRecords.filter((rec) => {
    const matchesTier = selectedTier === "all" || rec.tier.includes(selectedTier);
    const matchesSearch =
      rec.nameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.schoolNameAr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rec.grade.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesTier && matchesSearch;
  });

  return (
    <div className="space-y-8" id="ministry-talent-scouting-hub" dir={isRtl ? "rtl" : "ltr"}>
      
      {/* 1. Header Banner with Qatar Ministerial Identity */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#2B0813] via-[#8A1538] to-[#150208] text-white shadow-2xl border-2 border-[#D4AF37]/50 relative overflow-hidden">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-xs font-bold text-[#FDE68A]">
              <Star className="w-4 h-4 text-[#D4AF37] fill-[#D4AF37]" />
              <span>منظومة رصد وانتداب الموهوبين في الخطابة والإلقاء المسرحي (درجة أولى) 🇶🇦</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black font-serif text-white leading-tight">
              إدارة التوجيه التربوي ورعاية الموهوبين
            </h1>
            <p className="text-xs sm:text-sm text-amber-100/90 font-sans max-w-2xl leading-relaxed">
              كشف وطني معتمد للطلبة الموهوبين في مهارات الإلقاء المنبري والتواصل الجماهيري المرشحين لتمثيل دولة قطر في المحافل والمسابقات الوطنية والدولية.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.print()}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] hover:from-[#F59E0B] hover:to-[#D4AF37] text-slate-950 text-xs font-black shadow-lg flex items-center gap-2 cursor-pointer transition-all transform hover:scale-[1.02]"
            >
              <Printer className="w-4 h-4" />
              <span>طباعة كشف الانتداب المعتمد</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key National Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#14070E] p-5 rounded-3xl border border-amber-200/80 dark:border-amber-900/40 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-[#2A1708] text-amber-600 dark:text-[#FDE68A] flex items-center justify-center shrink-0">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold block">الموهوبون درجة أولى (Tier 1)</span>
            <p className="text-2xl font-serif font-black text-[#8A1538] dark:text-[#FDE68A]">
              {talentRecords.filter((r) => r.tier.includes("Tier 1")).length} مرشحين
            </p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#14070E] p-5 rounded-3xl border border-slate-200 dark:border-[#3D1426] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Video className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold block">متوسط الإلقاء المنبري</span>
            <p className="text-2xl font-serif font-black text-slate-900 dark:text-white">95.2%</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#14070E] p-5 rounded-3xl border border-slate-200 dark:border-[#3D1426] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <Eye className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold block">متوسط التواصل البصري</span>
            <p className="text-2xl font-serif font-black text-slate-900 dark:text-white">96.0%</p>
          </div>
        </div>

        <div className="bg-white dark:bg-[#14070E] p-5 rounded-3xl border border-slate-200 dark:border-[#3D1426] shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-bold block">حالة الانتداب الوطني</span>
            <p className="text-2xl font-serif font-black text-emerald-600 dark:text-emerald-400">معتمد رسمياً</p>
          </div>
        </div>
      </div>

      {/* 3. Table of Talent Candidates */}
      <div className="bg-white dark:bg-[#14070E] rounded-3xl border border-slate-200 dark:border-[#3D1426] shadow-xs overflow-hidden space-y-4 p-5 sm:p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-black font-serif text-slate-900 dark:text-white">
              قائمة الطلاب الموهوبين في مسرح الإلقاء والخطابة
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              بيانات موثقة من المرحلة 2 (مسرح الإلقاء والمنبر الحي) المعتمدة على الكاميرا والذكاء الاصطناعي
            </p>
          </div>

          {/* Filter */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              value={selectedTier}
              onChange={(e) => setSelectedTier(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-900 cursor-pointer"
            >
              <option value="all">كافة المستويات الموهوبة</option>
              <option value="Tier 1">الموهبة الذهبية الأولى (Tier 1)</option>
              <option value="Tier 2">الموهبة الواعدة (Tier 2)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full text-xs text-start min-w-[700px]">
            <thead className="bg-slate-50 dark:bg-[#200A15] text-slate-700 dark:text-slate-200 font-bold border-y border-slate-200 dark:border-[#3D1426]">
              <tr>
                <th className="p-4 text-start">اسم الطالب المرشح</th>
                <th className="p-4 text-start">المدرسة والصف</th>
                <th className="p-4 text-start">عنوان الخطبة المجازة</th>
                <th className="p-4 text-start">الإلقاء المنبري</th>
                <th className="p-4 text-start">لغة الجسد</th>
                <th className="p-4 text-start">التواصل البصري</th>
                <th className="p-4 text-start">التصنيف الوزاري</th>
                <th className="p-4 text-start">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-[#2F0C1B]">
              {filteredRecords.map((rec) => (
                <tr key={rec.id} className="hover:bg-amber-50/40 dark:hover:bg-[#1C0A15] transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-slate-900 dark:text-white font-serif text-sm">
                      {rec.nameAr}
                    </div>
                    <span className="text-[11px] text-slate-400 font-sans">{rec.nameEn}</span>
                  </td>
                  <td className="p-4">
                    <span className="font-bold text-slate-800 dark:text-slate-200">{rec.schoolNameAr}</span>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 font-sans">{rec.section}</div>
                  </td>
                  <td className="p-4 text-slate-700 dark:text-slate-300 font-medium max-w-xs">{rec.speechTitle}</td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-black text-xs">
                      {rec.oratoryScore}%
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300 font-black text-xs">
                      {rec.bodyLanguageScore}%
                    </span>
                  </td>
                  <td className="p-4">
                    <span className="px-2.5 py-1 rounded-full bg-amber-50 dark:bg-[#2A1708] text-amber-900 dark:text-amber-300 font-black text-xs">
                      {rec.eyeContactScore}%
                    </span>
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-3 py-1 rounded-full font-black text-[11px] border ${
                        rec.tier.includes("Tier 1")
                          ? "bg-amber-100/80 dark:bg-[#331B0A] text-amber-900 dark:text-[#FDE68A] border-amber-300 dark:border-amber-700"
                          : "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-900 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800"
                      }`}
                    >
                      {rec.tier}
                    </span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => setSelectedRecordForCertificate(rec)}
                      className="px-3 py-1.5 rounded-xl bg-[#8A1538] hover:bg-[#5C0E25] text-white text-[11px] font-bold flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>عرض الكشف المعتمد</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. Modal: Official Ministerial Delegation Certificate */}
      {selectedRecordForCertificate && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-10 shadow-2xl border-4 border-[#D4AF37]/50 space-y-6 relative overflow-hidden">
            {/* Ministry Watermark */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-5 pointer-events-none">
              <MinistryLogo size="xl" showText={false} />
            </div>

            {/* Top Certificate Header */}
            <div className="flex items-start justify-between border-b-2 border-[#8A1538]/20 pb-6 relative z-10">
              <MinistryLogo size="md" showText={true} textColor="maroon" />
              <div className="text-end">
                <span className="text-[11px] font-bold text-slate-400 block">الرقم المرجعي: QAT-TAL-2026-08</span>
                <span className="text-[11px] font-bold text-slate-400 block">التاريخ: {selectedRecordForCertificate.dateNominated}</span>
                <span className="px-3 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-black mt-1 inline-block">
                  معتمد للانتداب الوطني
                </span>
              </div>
            </div>

            {/* Certificate Body */}
            <div className="text-center space-y-4 relative z-10">
              <h3 className="text-xl font-black font-serif text-[#8A1538]">
                وثيقة ترشيح وانتداب طالب موهوب (المستوى الذهبي الأول)
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed font-sans max-w-lg mx-auto">
                بناءً على نتائج التقييم الآلي متعدد الوسائط على مسرح الإلقاء بمنظومة إلقاء الوطنية، تُعلن وزارة التربية والتعليم والتعليم العالي عن ترشيح الطالب:
              </p>

              <div className="py-3 px-6 rounded-2xl bg-amber-50/70 border border-amber-200 inline-block">
                <p className="text-xl font-black font-serif text-slate-900">
                  {selectedRecordForCertificate.nameAr}
                </p>
                <p className="text-xs text-[#8A1538] font-bold font-sans">
                  {selectedRecordForCertificate.schoolNameAr} • {selectedRecordForCertificate.section}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 max-w-md mx-auto pt-2">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">الإلقاء المنبري</span>
                  <span className="text-sm font-black text-slate-900">{selectedRecordForCertificate.oratoryScore}%</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">التواصل البصري</span>
                  <span className="text-sm font-black text-slate-900">{selectedRecordForCertificate.eyeContactScore}%</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[10px] text-slate-400 block">لغة الجسد</span>
                  <span className="text-sm font-black text-slate-900">{selectedRecordForCertificate.bodyLanguageScore}%</span>
                </div>
              </div>

              <p className="text-[11px] text-slate-500 font-sans italic max-w-md mx-auto pt-1">
                "{selectedRecordForCertificate.aiNotes}"
              </p>
            </div>

            {/* Signatures & Stamp */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-200 text-xs relative z-10">
              <div className="text-start">
                <p className="font-bold text-slate-900">لجنة التحكيم الوطنية للإلقاء</p>
                <p className="text-[10px] text-slate-400">قطاع الشؤون التعليمية</p>
              </div>

              <div className="w-20 h-20 rounded-full border-2 border-dashed border-[#8A1538]/40 flex items-center justify-center text-[10px] font-bold text-[#8A1538] rotate-12">
                ختم الاعتماد 🇶🇦
              </div>

              <div className="text-end">
                <p className="font-bold text-slate-900">إدارة رعاية الموهوبين</p>
                <p className="text-[10px] text-slate-400">وزارة التربية والتعليم والتعليم العالي</p>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={() => setSelectedRecordForCertificate(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                إغلاق
              </button>
              <button
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl bg-[#8A1538] hover:bg-[#5C0E25] text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Printer className="w-4 h-4" />
                <span>طباعة الوثيقة الرسمية</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
