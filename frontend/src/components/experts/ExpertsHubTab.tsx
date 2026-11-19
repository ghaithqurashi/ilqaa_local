import React, { useState, useMemo } from "react";
import { 
  Users, 
  ShieldCheck, 
  Search, 
  Filter, 
  GraduationCap, 
  Building2, 
  Globe2, 
  BookOpen, 
  Sparkles, 
  Award, 
  CheckCircle2, 
  ChevronRight, 
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Info,
  Layers,
  Mic,
  Scale,
  Video,
  Flame,
  Clock,
  Briefcase
} from "lucide-react";
import { 
  ALL_EXPERTS, 
  AcademicExpert, 
  ADVISORY_COUNCIL_CATEGORIES, 
  EXPERT_NETWORK_FILTERS 
} from "../../data/expertsData";
import { ExpertProfileModal } from "./ExpertProfileModal";

interface ExpertsHubTabProps {
  isRtl?: boolean;
  defaultSubTab?: "council" | "network";
  onReturnHome?: () => void;
  theme?: any;
}

export const ExpertsHubTab: React.FC<ExpertsHubTabProps> = ({
  isRtl = true,
  defaultSubTab = "council",
  onReturnHome,
  theme
}) => {
  const [activeSubTab, setActiveSubTab] = useState<"council" | "network">(defaultSubTab);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNetworkFilter, setSelectedNetworkFilter] = useState<string>("all");
  const [selectedCouncilCategory, setSelectedCouncilCategory] = useState<string>("all");
  const [selectedExpert, setSelectedExpert] = useState<AcademicExpert | null>(null);

  // Filter Advisory Council members
  const councilMembers = useMemo(() => {
    return ALL_EXPERTS.filter((exp) => {
      if (!exp.councilMember) return false;
      if (selectedCouncilCategory !== "all") {
        const catObj = ADVISORY_COUNCIL_CATEGORIES.find(c => c.id === selectedCouncilCategory);
        if (catObj && exp.councilCategory !== catObj.nameAr) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = exp.fullNameArabic.toLowerCase().includes(query) || exp.fullNameEnglish.toLowerCase().includes(query);
        const matchesOrg = exp.organization.toLowerCase().includes(query);
        const matchesSpecialty = exp.specialties.some(s => s.toLowerCase().includes(query));
        const matchesCategory = exp.councilCategory?.toLowerCase().includes(query);
        return matchesName || matchesOrg || matchesSpecialty || matchesCategory;
      }
      return true;
    });
  }, [selectedCouncilCategory, searchQuery]);

  // Filter Expert Network members
  const networkMembers = useMemo(() => {
    return ALL_EXPERTS.filter((exp) => {
      if (!exp.expertNetworkMember) return false;
      if (selectedNetworkFilter !== "all") {
        const filterObj = EXPERT_NETWORK_FILTERS.find(f => f.id === selectedNetworkFilter);
        if (filterObj && !exp.specialties.includes(filterObj.nameAr)) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = exp.fullNameArabic.toLowerCase().includes(query) || exp.fullNameEnglish.toLowerCase().includes(query);
        const matchesOrg = exp.organization.toLowerCase().includes(query);
        const matchesSpecialty = exp.specialties.some(s => s.toLowerCase().includes(query));
        const matchesCompetency = exp.competencies.some(c => c.toLowerCase().includes(query));
        return matchesName || matchesOrg || matchesSpecialty || matchesCompetency;
      }
      return true;
    });
  }, [selectedNetworkFilter, searchQuery]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12" id="experts-hub-main-container" dir={isRtl ? "rtl" : "ltr"}>
      
      {/* Return to Stages Hub Button */}
      {onReturnHome && (
        <div className="flex items-center justify-between bg-white dark:bg-[#1C0A15] p-3 rounded-2xl border border-slate-200 dark:border-[#3D1426] shadow-sm">
          <button
            onClick={onReturnHome}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-black flex items-center gap-2 cursor-pointer transition-all"
            id="experts-return-hub-btn"
          >
            {isRtl ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            <span>{isRtl ? "العودة إلى بوابة المراحل الرئيسية" : "Back to Stages Gateway"}</span>
          </button>
          <span className="text-xs font-bold text-[#8A1538] dark:text-amber-300 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 rounded-full border border-amber-200 dark:border-amber-900/40 hidden sm:inline">
            {isRtl ? "الركيزة الأكاديمية والاستشارية لمنصة إلقاء" : "ILQAA Academic & Advisory Pillar"}
          </span>
        </div>
      )}

      {/* Hero Header Banner */}
      <div className="relative rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-[#2B0813] via-[#8A1538] to-[#14070E] text-white shadow-xl border border-amber-500/20 overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-radial from-[#D4AF37]/15 to-transparent rounded-full -mr-20 -mt-20 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-bold text-amber-200">
              <ShieldCheck className="w-4 h-4 text-[#D4AF37]" />
              <span>{isRtl ? "الأطر الأكاديمية والخبرة البشرية 🇶🇦" : "Academic Frameworks & Human Expertise"}</span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black font-serif text-white tracking-tight">
              {isRtl ? "الخبراء والمستشارون" : "Experts & Advisory Council"}
            </h1>

            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-sans">
              {isRtl
                ? "نخبة من كبار الأكاديميين والمستشارين المتخصصين في اللسانيات، البلاغة المنبرية، مناهج اللغة العربية، والمناظرات؛ لضمان أعلى معايير الجودة العلمية وتمكين الطالب من التميز."
                : "Distinguished scholars and specialized advisors in linguistics, public speaking, Arabic curricula, and debate, guiding academic rigor and student eloquence."}
            </p>
          </div>

          {/* Quick Pillar Stats (Tabular Numerals) */}
          <div className="flex items-center gap-3 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            <div className="p-3.5 rounded-2xl bg-black/30 backdrop-blur-md border border-white/15 text-center min-w-[100px] flex-1 md:flex-none">
              <span className="text-[10px] text-amber-200 font-bold block">{isRtl ? "أعضاء المجلس" : "Council Members"}</span>
              <span className="text-xl font-mono font-black text-white tabular-nums">10</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-black/30 backdrop-blur-md border border-white/15 text-center min-w-[100px] flex-1 md:flex-none">
              <span className="text-[10px] text-amber-200 font-bold block">{isRtl ? "تخصصات دقيقة" : "Specialties"}</span>
              <span className="text-xl font-mono font-black text-white tabular-nums">8+</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-black/30 backdrop-blur-md border border-white/15 text-center min-w-[100px] flex-1 md:flex-none">
              <span className="text-[10px] text-amber-200 font-bold block">{isRtl ? "معايير الوزارة" : "MoEHE Standards"}</span>
              <span className="text-xl font-mono font-black text-amber-300 tabular-nums">100%</span>
            </div>
          </div>
        </div>

        {/* 2 Main Tabs Navigation */}
        <div className="mt-8 pt-4 border-t border-white/15 flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab("council")}
            className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === "council"
                ? "bg-[#D4AF37] text-slate-950 shadow-md font-black"
                : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
            }`}
            id="tab-advisory-council"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>{isRtl ? "مجلس إلقاء الاستشاري" : "ILQAA Advisory Council"}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${activeSubTab === "council" ? "bg-slate-950/20 text-slate-950" : "bg-white/20 text-white"}`}>
              {ALL_EXPERTS.filter(e => e.councilMember).length}
            </span>
          </button>

          <button
            onClick={() => setActiveSubTab("network")}
            className={`px-4 sm:px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 ${
              activeSubTab === "network"
                ? "bg-[#D4AF37] text-slate-950 shadow-md font-black"
                : "bg-white/10 hover:bg-white/20 text-white border border-white/10"
            }`}
            id="tab-expert-network"
          >
            <Users className="w-4 h-4" />
            <span>{isRtl ? "خبراء إلقاء" : "ILQAA Expert Network"}</span>
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${activeSubTab === "network" ? "bg-slate-950/20 text-slate-950" : "bg-white/20 text-white"}`}>
              {ALL_EXPERTS.filter(e => e.expertNetworkMember).length}
            </span>
          </button>
        </div>
      </div>

      {/* Global Search Bar */}
      <div className="bg-white dark:bg-[#1C0A15] p-3 sm:p-4 rounded-2xl border border-slate-200 dark:border-[#3D1426] shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:max-w-md">
          <Search className={`w-4 h-4 text-slate-400 absolute top-1/2 -translate-y-1/2 ${isRtl ? "right-3" : "left-3"}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeSubTab === "council"
                ? (isRtl ? "ابحث بالاسم أو الجامعة أو التخصص الاستشاري..." : "Search council members, university, discipline...")
                : (isRtl ? "ابحث عن خبير بالاسم، الكفاية، أو التخصص..." : "Search experts by name, competency, specialty...")
            }
            className={`w-full py-2 bg-slate-50 dark:bg-[#14070E] border border-slate-200 dark:border-[#3D1426] rounded-xl text-xs text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#8A1538] dark:focus:ring-amber-400 ${
              isRtl ? "pr-9 pl-3" : "pl-9 pr-3"
            }`}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end text-xs text-slate-500 dark:text-slate-400 font-sans">
          <span>
            {isRtl ? "النتائج المعروضة:" : "Showing:"}
          </span>
          <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
            {activeSubTab === "council" ? councilMembers.length : networkMembers.length}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: ADVISORY COUNCIL PAGE */}
      {/* ========================================================================= */}
      {activeSubTab === "council" && (
        <div className="space-y-6" id="advisory-council-content-view">
          
          {/* Institutional Statement (Mandatory Requirement) */}
          <div className="bg-gradient-to-r from-amber-500/10 via-[#8A1538]/5 to-amber-500/10 dark:from-[#250D1A] dark:via-[#1A0914] dark:to-[#250D1A] rounded-2xl p-4 sm:p-5 border border-amber-400/40 dark:border-amber-900/50 flex items-start sm:items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#8A1538] text-white flex items-center justify-center shrink-0 shadow-sm">
              <ShieldCheck className="w-5 h-5 text-[#FDE68A]" />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-[#8A1538] dark:text-amber-300">
                {isRtl ? "الميثاق الأكاديمي لمجلس إلقاء" : "ILQAA Academic Governance Charter"}
              </span>
              <p className="text-xs sm:text-sm font-serif font-bold text-slate-900 dark:text-slate-100 leading-relaxed">
                {isRtl
                  ? "يساهم مجلس إلقاء الاستشاري في مراجعة وتطوير الأطر الأكاديمية ومعايير القياس والتقييم، بما يضمن توافق المنصة مع أفضل الممارسات التربوية واللغوية."
                  : "The ILQAA Advisory Council contributes to the continuous review and development of academic frameworks, assessment standards, and communication competencies."}
              </p>
            </div>
          </div>

          {/* Academic Categories Filter Bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-sans">
                <Layers className="w-3.5 h-3.5 text-[#8A1538] dark:text-amber-300" />
                <span>{isRtl ? "تصنيفات الاستشارة الأكاديمية:" : "Academic Advisory Categories:"}</span>
              </span>
              {selectedCouncilCategory !== "all" && (
                <button
                  onClick={() => setSelectedCouncilCategory("all")}
                  className="text-[11px] text-[#8A1538] dark:text-amber-300 font-bold hover:underline cursor-pointer"
                >
                  {isRtl ? "إعادة الضبط" : "Reset Filter"}
                </button>
              )}
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              {ADVISORY_COUNCIL_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCouncilCategory(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    selectedCouncilCategory === cat.id
                      ? "bg-[#8A1538] text-white shadow-xs font-bold"
                      : "bg-white dark:bg-[#1C0A15] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2A0E1F] border border-slate-200 dark:border-[#3D1426]"
                  }`}
                >
                  {isRtl ? cat.nameAr : cat.nameEn}
                </button>
              ))}
            </div>
          </div>

          {/* Advisory Council Members Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {councilMembers.map((member) => (
              <div
                key={member.id}
                className="group bg-white dark:bg-[#1C0A15] rounded-3xl p-5 border border-slate-200 dark:border-[#3D1426] hover:border-[#8A1538] dark:hover:border-amber-400/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  
                  {/* Photo & Identity Lockup */}
                  <div className="flex items-start gap-4">
                    <div className="relative shrink-0">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-amber-300/80 dark:border-amber-800 shadow-md bg-slate-900">
                        <img
                          src={member.photo}
                          alt={isRtl ? member.fullNameArabic : member.fullNameEnglish}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <span className="absolute -bottom-1 -right-1 text-xs">
                        {member.countryFlag}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[10px] font-bold text-[#8A1538] dark:text-amber-300 bg-[#8A1538]/10 dark:bg-[#8A1538]/30 px-2 py-0.5 rounded-md">
                          {isRtl ? member.councilCategory : member.councilCategoryEn}
                        </span>
                      </div>
                      <h3 className="text-base font-black font-serif text-slate-900 dark:text-white leading-tight">
                        {isRtl ? member.fullNameArabic : member.fullNameEnglish}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-snug">
                        {isRtl ? member.titleArabic : member.titleEnglish}
                      </p>
                    </div>
                  </div>

                  {/* Institution & Country */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#150710] border border-slate-100 dark:border-[#2D0F1E] space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold truncate">
                      <Building2 className="w-3.5 h-3.5 text-[#8A1538] dark:text-amber-300 shrink-0" />
                      <span className="truncate">{isRtl ? member.organization : member.organizationEn}</span>
                    </div>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span>{member.country}</span>
                      <span>·</span>
                      <span>{member.experienceYears} {isRtl ? "سنة خبرة أكاديمية" : "Years Experience"}</span>
                    </div>
                  </div>

                  {/* Short Bio */}
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed font-sans">
                    {isRtl ? member.bioArabic : member.bioEnglish}
                  </p>

                  {/* Clean unboxed competencies metadata (Zero-Pill Discipline) */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-1.5 font-sans">
                    <span className="font-bold text-slate-700 dark:text-slate-300">{isRtl ? "محاور الإشراف:" : "Focus:"}</span>
                    {member.competencies.map((comp, idx) => (
                      <React.Fragment key={idx}>
                        <span>{comp}</span>
                        {idx < member.competencies.length - 1 && <span className="opacity-40">·</span>}
                      </React.Fragment>
                    ))}
                  </div>

                </div>

                {/* Card Action */}
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] font-mono text-slate-400">
                    {isRtl ? "عضو معتمد" : "Accredited Fellow"}
                  </span>
                  <button
                    onClick={() => setSelectedExpert(member)}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-[#200A15] hover:bg-[#8A1538] hover:text-white dark:hover:bg-[#8A1538] text-slate-800 dark:text-slate-200 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{isRtl ? "عرض الملف الأكاديمي" : "View Profile"}</span>
                    {isRtl ? <ChevronRight className="w-3.5 h-3.5 rotate-180" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {councilMembers.length === 0 && (
            <div className="bg-white dark:bg-[#1C0A15] rounded-3xl p-12 text-center border border-slate-200 dark:border-[#3D1426] space-y-3">
              <Info className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="font-bold text-base text-slate-800 dark:text-white">
                {isRtl ? "لم يتم العثور على أعضاء يطابقون البحث" : "No council members matched your search"}
              </h3>
              <p className="text-xs text-slate-400">
                {isRtl ? "جرّب تغيير كلمات البحث أو إعادة ضبط تصنيف الاستشارة." : "Try adjusting your search query or reset the category filter."}
              </p>
              <button
                onClick={() => { setSearchQuery(""); setSelectedCouncilCategory("all"); }}
                className="px-4 py-2 rounded-xl bg-[#8A1538] text-white text-xs font-bold cursor-pointer"
              >
                {isRtl ? "عرض كافة أعضاء المجلس" : "View All Council Members"}
              </button>
            </div>
          )}

        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: EXPERT NETWORK PAGE */}
      {/* ========================================================================= */}
      {activeSubTab === "network" && (
        <div className="space-y-6" id="expert-network-content-view">
          
          {/* Header & Subtitle (Mandatory Texts) */}
          <div className="bg-white dark:bg-[#1C0A15] rounded-3xl p-6 sm:p-7 border border-slate-200 dark:border-[#3D1426] shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-black font-serif text-slate-900 dark:text-white">
                  {isRtl ? "خبراء إلقاء" : "ILQAA Expert Network"}
                </h2>
                <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
                  {isRtl ? "شبكة التقييم والتدريب المتخصص" : "Assessment & Mentorship Network"}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 font-sans leading-relaxed">
                {isRtl
                  ? "خبراء متخصصون يدعمون رحلة الطالب من التمكن اللغوي إلى التميز في التواصل والإلقاء."
                  : "Specialized human mentors supporting the student's journey from linguistic mastery to elite oratory and communication distinction."}
              </p>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#14070E] p-3 rounded-2xl border border-slate-200 dark:border-[#3D1426] max-w-xs shrink-0">
              <span className="font-bold text-slate-700 dark:text-slate-200 block mb-0.5">
                {isRtl ? "ملاحظة الاستكشاف المرجعي:" : "Reference Discovery Note:"}
              </span>
              <span>
                {isRtl
                  ? "هذه الواجهة مخصصة للاستكشاف والتعرف على كفاءات الخبراء حالياً، وستُتاح خدمات الجدولة والتقييم الفردي قريباً."
                  : "Currently configured for reference and competency discovery; direct evaluations will launch soon."}
              </span>
            </div>
          </div>

          {/* Network Filters Bar (Mandatory Filters) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-500 dark:text-slate-400 flex items-center gap-1.5 font-sans">
                <Filter className="w-3.5 h-3.5 text-[#8A1538] dark:text-amber-300" />
                <span>{isRtl ? "فلترة حسب تخصص الخبير:" : "Filter By Expertise:"}</span>
              </span>
              {selectedNetworkFilter !== "all" && (
                <button
                  onClick={() => setSelectedNetworkFilter("all")}
                  className="text-[11px] text-[#8A1538] dark:text-amber-300 font-bold hover:underline cursor-pointer"
                >
                  {isRtl ? "عرض الجميع" : "Show All"}
                </button>
              )}
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              {EXPERT_NETWORK_FILTERS.map((filt) => (
                <button
                  key={filt.id}
                  onClick={() => setSelectedNetworkFilter(filt.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap shrink-0 ${
                    selectedNetworkFilter === filt.id
                      ? "bg-[#8A1538] text-white shadow-xs font-bold"
                      : "bg-white dark:bg-[#1C0A15] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#2A0E1F] border border-slate-200 dark:border-[#3D1426]"
                  }`}
                >
                  {isRtl ? filt.nameAr : filt.nameEn}
                </button>
              ))}
            </div>
          </div>

          {/* Expert Network Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {networkMembers.map((expert) => (
              <div
                key={expert.id}
                className="group bg-white dark:bg-[#1C0A15] rounded-3xl p-5 border border-slate-200 dark:border-[#3D1426] hover:border-[#8A1538] dark:hover:border-amber-400/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div className="space-y-4">
                  
                  {/* Photo, Name & Title */}
                  <div className="flex items-start gap-4">
                    <div className="relative shrink-0">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-800 shadow-md bg-slate-900">
                        <img
                          src={expert.photo}
                          alt={isRtl ? expert.fullNameArabic : expert.fullNameEnglish}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                      <span className="absolute -bottom-1 -right-1 text-xs">
                        {expert.countryFlag}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-900/40">
                          {expert.specialties[0]}
                        </span>
                      </div>
                      <h3 className="text-base font-black font-serif text-slate-900 dark:text-white leading-tight">
                        {isRtl ? expert.fullNameArabic : expert.fullNameEnglish}
                      </h3>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-snug">
                        {isRtl ? expert.titleArabic : expert.titleEnglish}
                      </p>
                    </div>
                  </div>

                  {/* Country & Supported Educational Levels */}
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#150710] border border-slate-100 dark:border-[#2D0F1E] space-y-1 text-xs">
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-bold truncate">
                      <Building2 className="w-3.5 h-3.5 text-[#8A1538] dark:text-amber-300 shrink-0" />
                      <span className="truncate">{isRtl ? expert.organization : expert.organizationEn}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      <GraduationCap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{expert.educationLevels.join(" • ")}</span>
                    </div>
                  </div>

                  {/* Short Bio */}
                  <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed font-sans">
                    {isRtl ? expert.bioArabic : expert.bioEnglish}
                  </p>

                  {/* Clean unboxed tags/competencies (Zero-Pill Discipline) */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-1.5 font-sans">
                    <span className="font-bold text-slate-700 dark:text-slate-300">{isRtl ? "كفايات التقييم:" : "Competencies:"}</span>
                    {expert.competencies.map((comp, idx) => (
                      <React.Fragment key={idx}>
                        <span>{comp}</span>
                        {idx < expert.competencies.length - 1 && <span className="opacity-40">·</span>}
                      </React.Fragment>
                    ))}
                  </div>

                </div>

                {/* Card Action: View Profile (No Pricing, No Booking buttons per prompt) */}
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isRtl ? "خبير إلقاء معتمد" : "Certified Oratory Expert"}</span>
                  </span>

                  <button
                    onClick={() => setSelectedExpert(expert)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#8A1538] to-[#5C0E25] hover:from-[#A01B42] text-white text-xs font-bold shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{isRtl ? "عرض الملف التعريفي" : "View Profile"}</span>
                    {isRtl ? <ChevronRight className="w-3.5 h-3.5 rotate-180" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {networkMembers.length === 0 && (
            <div className="bg-white dark:bg-[#1C0A15] rounded-3xl p-12 text-center border border-slate-200 dark:border-[#3D1426] space-y-3">
              <Info className="w-10 h-10 text-slate-400 mx-auto" />
              <h3 className="font-bold text-base text-slate-800 dark:text-white">
                {isRtl ? "لم يتم العثور على خبراء يطابقون الفلتر" : "No experts matched this filter"}
              </h3>
              <p className="text-xs text-slate-400">
                {isRtl ? "جرّب اختيار تصنيف آخر أو مسح عبارة البحث." : "Try selecting a different specialty or clearing your search."}
              </p>
              <button
                onClick={() => { setSearchQuery(""); setSelectedNetworkFilter("all"); }}
                className="px-4 py-2 rounded-xl bg-[#8A1538] text-white text-xs font-bold cursor-pointer"
              >
                {isRtl ? "عرض كافة خبراء الشبكة" : "View All Experts"}
              </button>
            </div>
          )}

        </div>
      )}

      {/* Expert Profile Modal */}
      <ExpertProfileModal
        expert={selectedExpert}
        isOpen={Boolean(selectedExpert)}
        onClose={() => setSelectedExpert(null)}
        isRtl={isRtl}
      />

    </div>
  );
};
