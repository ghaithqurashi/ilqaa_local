import React, { useState, useEffect, useRef } from "react";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Eye, 
  UserCheck, 
  Hand, 
  Gauge, 
  Activity, 
  Sparkles, 
  Flame, 
  Play, 
  Square, 
  RotateCcw, 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  Lightbulb, 
  BookOpen, 
  Sliders, 
  Volume2, 
  RefreshCw, 
  ChevronRight,
  Shield,
  Layers,
  Presentation,
  Radio,
  FileSpreadsheet,
  Share2,
  Check,
  Zap,
  HelpCircle,
  Clock,
  Settings as SettingsIcon,
  Maximize2,
  Trash2,
  Compass,
  BarChart3,
  Target,
  Crosshair,
  Users,
  Briefcase,
  GraduationCap,
  Scale,
  ChevronDown,
  ChevronUp,
  Pause,
  Printer,
  Download
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { StudentProfile } from "../types";
import { Dictionary } from "../translations";
import { playSuccessSound, playCelebrationFanfare, playClickSound, speakMasterArabicModel, stopSpeechSynthesis } from "../lib/audioAndEffects";
import { IlqaaLogo } from "./IlqaaLogo";
import { useLiveCoach, LiveSessionResult } from "../lib/useLiveCoach";
import { ChannelName, ChannelStatus } from "../lib/liveCoach";
import { VowelScriptSetup, VowelSummaryCard, VowelTranscriptPanel } from "./VowelCheck";
import { TranscriptReport } from "./TranscriptReport";
import { ExpertHandoffCard } from "./experts/ExpertHandoffCard";

interface OratoryStageTabProps {
  student: StudentProfile;
  dict: Dictionary;
  language: "ar" | "en";
  theme: any;
  onEarnReward?: (xp: number, coins: number) => void;
  onReturnHome?: () => void;
  onNavigateToExperts?: () => void;
}

// 5 Specialized Market Verticals
export type SectorVertical = "entrepreneur_pitch" | "executive_boardroom" | "tedx_keynote" | "legal_debate" | "academic_student";

export interface SectorConfig {
  id: SectorVertical;
  titleAr: string;
  titleEn: string;
  badgeAr: string;
  badgeEn: string;
  descriptionAr: string;
  descriptionEn: string;
  targetWpm: number;
  wpmRange: [number, number];
  primaryMetricAr: string;
  primaryMetricEn: string;
  icon: any;
  themeColor: string;
  accentGradient: string;
}

export const SECTOR_CONFIGS: Record<SectorVertical, SectorConfig> = {
  entrepreneur_pitch: {
    id: "entrepreneur_pitch",
    titleAr: "رواد الأعمال وعروض المستثمرين (Pitch Deck)",
    titleEn: "Founders & Investor Pitch (Pitch Deck)",
    badgeAr: "عرض استثماري Shark Tank",
    badgeEn: "VC & Angel Pitch",
    descriptionAr: "تدريب مكثف على جذب انتباه المستثمرين في أول 60 ثانية، الإيجاز الحاسم، إبراز مؤشرات النمو (Traction)، والثقة الفولاذية عند الإجابة على الاعتراضات.",
    descriptionEn: "High-stakes 60-second hooks, concise traction delivery, valuation justification, and bulletproof investor Q&A defense.",
    targetWpm: 140,
    wpmRange: [130, 155],
    primaryMetricAr: "مؤشر الحسم واليقين اللغوي (Conviction Score)",
    primaryMetricEn: "Executive Conviction & Decisiveness",
    icon: Briefcase,
    themeColor: "#F59E0B",
    accentGradient: "from-amber-600 via-amber-500 to-amber-700"
  },
  executive_boardroom: {
    id: "executive_boardroom",
    titleAr: "القيادات التنفيذية ومجالس الإدارة (C-Suite & Boardroom)",
    titleEn: "C-Suite & Boardroom Leadership",
    badgeAr: "هيبة القرار والوقفة القيادية",
    badgeEn: "Executive Gravitas & Presence",
    descriptionAr: "الوقار المنبري والهدوء التحليلي، تجنب الرتابة الصوتية، استخدام الوقفات البلاغية المؤثرة، وإقناع أعضاء مجلس الإدارة دون إسهاب زائد.",
    descriptionEn: "Boardroom authority, non-monotone vocal cadence, strategic pauses, and high-impact executive presence.",
    targetWpm: 125,
    wpmRange: [115, 135],
    primaryMetricAr: "مؤشر الرزانة القيادية وثبات النبرة (Gravitas & Prosody)",
    primaryMetricEn: "Vocal Gravitas & Strategic Silence",
    icon: Users,
    themeColor: "#0284C7",
    accentGradient: "from-sky-700 via-blue-600 to-indigo-800"
  },
  tedx_keynote: {
    id: "tedx_keynote",
    titleAr: "المؤتمرات الكبرى ومنصة TEDx (Keynote & Stage)",
    titleEn: "Keynote & TEDx Stage Speaking",
    badgeAr: "القصص الملهمة والمسرح المفتوح",
    badgeEn: "Storytelling & Arena Sweeping",
    descriptionAr: "السرد القصصي المشوق (Storytelling Arc)، مسح زوايا المسرح 360° (يسار، وسط، يمين)، وتوظيف فضاء الإيماءات المفتوحة للتأثير العاطفي.",
    descriptionEn: "Emotional storytelling arcs, 3-zone audience eye contact distribution, and expressive stage presence.",
    targetWpm: 115,
    wpmRange: [100, 125],
    primaryMetricAr: "مؤشر مسح الجمهور والتأثير العاطفي (Audience Sweeping & Pathos)",
    primaryMetricEn: "Audience Sweep & Emotional Resonance",
    icon: Sparkles,
    themeColor: "#EC4899",
    accentGradient: "from-pink-600 via-rose-600 to-purple-800"
  },
  legal_debate: {
    id: "legal_debate",
    titleAr: "المناظرات الفكرية والمرافعات (Debate & Advocacy)",
    titleEn: "Debate & Legal Advocacy",
    badgeAr: "ثالوث الإقناع الأرسطي",
    badgeEn: "Aristotelian Rhetoric & Logic",
    descriptionAr: "بناء الحجة المنطقية (Logos)، المصداقية القانونية (Ethos)، والرد الفوري المفحم على حجج الخصم مع ضبط الانفعالات واستقامة الجسد.",
    descriptionEn: "Logical argumentation (Logos), ethos credibility, rapid rebuttal delivery, and disciplined rebuttal posture.",
    targetWpm: 145,
    wpmRange: [135, 160],
    primaryMetricAr: "التوازن الأرسطي (Logos 45% - Ethos 35% - Pathos 20%)",
    primaryMetricEn: "Aristotelian Rhetoric Triad Ratio",
    icon: Scale,
    themeColor: "#8B5CF6",
    accentGradient: "from-purple-700 via-purple-600 to-indigo-900"
  },
  academic_student: {
    id: "academic_student",
    titleAr: "الفرسان الأكاديميون والخطابة المدرسية (Academic & MoEHE)",
    titleEn: "Academic & School Oratory (MoEHE Standards)",
    badgeAr: "معايير وزارة التعليم القطرية 🇶🇦",
    badgeEn: "Qatar MoEHE Curriculum Standards",
    descriptionAr: "الفصاحة اللغوية، سلامة الإعراب وضبط أواخر الكلم، مخارج الحروف العربية الفصيحة، الإلقاء الشعري، وتقديم الإذاعة المدرسية بثقة.",
    descriptionEn: "Flawless Arabic grammar & I'rab, phonetic articulation of standard phonemes, poetic meters, and school emcee presence.",
    targetWpm: 110,
    wpmRange: [95, 125],
    primaryMetricAr: "فصاحة مخارج الحروف وضبط الإعراب (Grammar & Phonetics)",
    primaryMetricEn: "Phonetic Articulation & Syntactic Precision",
    icon: GraduationCap,
    themeColor: "#8A1538",
    accentGradient: "from-[#8A1538] via-[#B82A52] to-[#5C0E25]"
  }
};

export type SpeechType = "lecture" | "poetry" | "broadcast" | "debate" | "impromptu";

interface PresetSpeech {
  id: string;
  sector: SectorVertical;
  type: SpeechType;
  titleAr: string;
  titleEn: string;
  topicAr: string;
  topicEn: string;
  targetScriptAr: string;
  targetScriptEn: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  durationExpected: string;
  targetWpm: number;
}

const PRESET_SPEECHES: PresetSpeech[] = [
  {
    id: "pitch-startup-ai",
    sector: "entrepreneur_pitch",
    type: "lecture",
    titleAr: "عرض استثماري: منصة الذكاء الاصطناعي الوطنية (Pitch Deck)",
    titleEn: "Pitch: National AI HealthTech Venture",
    topicAr: "إقناع المستثمرين بحجم السوق (TAM)، ميزة الخندق التقني، ومعدل نمو الإيرادات المتوقع لعام 2030.",
    topicEn: "Persuading VCs with TAM, technical moat, and exponential revenue growth projections.",
    targetScriptAr: "السادة المستثمرون، يواجه قطاعنا هدراً تشغيلياً يتجاوز 4 مليارات دولار سنوياً في المنطقة. منصتنا الذكية تختصر زمن المعالجة بنسبة 70%، وحققنا خلال الربع الأخير نمواً شهرياً مركباً بلغ 24%. نحن اليوم نفتح جولة تمويلية بقيمة مليونَي دولار لقيادة التوسع الإقليمي ومضاعفة قاعدة المشتركين.",
    targetScriptEn: "Esteemed investors, our sector suffers over $4B in annual inefficiencies. Our AI platform slashes processing time by 70%, with a 24% month-over-month growth. We are raising $2M to scale regionally and capture market leadership.",
    difficulty: "advanced",
    durationExpected: "2 دقيقة",
    targetWpm: 140
  },
  {
    id: "exec-boardroom-transformation",
    sector: "executive_boardroom",
    type: "lecture",
    titleAr: "تقرير تنفيذي: التحول الرقمي وإعادة هيكلة العمليات",
    titleEn: "Executive Briefing: Digital Transformation & Ops",
    topicAr: "إحاطة مجلس الإدارة بالقرارات الاستراتيجية وتقليل المخاطر وحوكمة البيانات.",
    topicEn: "Briefing the Board of Directors on strategic decisions, risk mitigation, and data governance.",
    targetScriptAr: "أعضاء مجلس الإدارة الموقرين، نجحت استراتيجيتنا للتحول الرقمي في خفض التكاليف التشغيلية بنسبة 18% مع تعزيز حوكمة البيانات وأمن المعلومات. قرارنا اليوم يستند إلى مؤشرات أداء موثوقة تضمن استدامة النمو وحماية مصالح المساهمين على المدى البعيد.",
    targetScriptEn: "Distinguished board members, our digital transformation has reduced operational overhead by 18% while fortifying governance. Today's strategic decision rests on solid KPIs safeguarding long-term shareholder value.",
    difficulty: "intermediate",
    durationExpected: "2-3 دقائق",
    targetWpm: 125
  },
  {
    id: "tedx-knowledge-economy",
    sector: "tedx_keynote",
    type: "lecture",
    titleAr: "خطاب ملهم: صناعة الأثر وإشعال شغف الابتكار",
    titleEn: "TEDx Keynote: Crafting Impact & Sparking Innovation",
    topicAr: "تحفيز الجمهور بقصة إنسانية، توزيع النظر بين الزوايا الثلاث، وتوظيف الصمت البلاغي.",
    topicEn: "Inspiring audience with a personal arc, 3-zone stage sweeping, and rhetorical pauses.",
    targetScriptAr: "تخيلوا لو أن فكرة واحدة تنبثق في ذهن شاب هنا في الدوحة، تستطيع أن تغير حياة الملايين حول العالم! الأمر لا يتطلب موارد خارقة، بل يتطلب شجاعة البدء، وإيماناً لا يتزعزع بأن المستقبل ليس ما ننتظره.. بل ما نصنعه بأيدينا اليوم.",
    targetScriptEn: "Imagine a single spark ignited right here that transforms millions of lives! It doesn't require endless resources, but the courage to start and the conviction that tomorrow is sculpted by what we dare to build today.",
    difficulty: "intermediate",
    durationExpected: "2 دقيقة",
    targetWpm: 115
  },
  {
    id: "debate-ai-ethics",
    sector: "legal_debate",
    type: "debate",
    titleAr: "مناظرة: الذكاء الاصطناعي في التعليم (بناء الحجة ودحض الاعتراض)",
    titleEn: "Debate: AI in Education (Logos, Ethos, Rebuttal)",
    topicAr: "تقديم الحجج المنطقية الصارمة، استخدام لغة الجسد لتأكيد الأدلة، ودحض مزاعم الفريق المنافس.",
    topicEn: "Logical syllogism, persuasive gestures, and sharp rebuttal delivery.",
    targetScriptAr: "سيدتي رئيسة الجلسة، الحضور الكريم.. نقف اليوم لنؤكد أن توظيف الذكاء الاصطناعي في الفصول المدرسية ليس رفاهية بل ضرورة وطنية لتمكين كل طالب من مسار تعليمي مخصص يراعي قدراته الفردية، وتفنيداً لحجة الفريق المنافس نؤكد أن المعلم هو القائد الملهم الذي لا يمكن استبداله، والتقنية هي وسيلته للوصول إلى التميز.",
    targetScriptEn: "Madam Chair, esteemed audience, we stand today to affirm that AI in education is a necessity that personalizes learning, while maintaining educators as the irreplaceable inspirational core.",
    difficulty: "advanced",
    durationExpected: "3 دقائق",
    targetWpm: 145
  },
  {
    id: "poetry-mutanabbi-master",
    sector: "academic_student",
    type: "poetry",
    titleAr: "إلقاء شعري: على قدر أهل العزم (أبو الطيب المتنبي)",
    titleEn: "Poetry Recitation: Al-Mutanabbi Masterpiece",
    topicAr: "الإلقاء الحماسي الفصيح مع مراعاة مخارج الحروف والنبر والتنغيم الصوتي وفق منهاج قطر 2018.",
    topicEn: "Eloquent energetic poetic recitation with proper intonation and vocal projection.",
    targetScriptAr: "عَلى قَدْرِ أَهْلِ العَزْمِ تَأْتِي العَزائِمُ ... وَتَأْتِي عَلَى قَدْرِ الكِرَامِ المَكَارِمُ\nوَتَعْظُمُ فِي عَيْنِ الصَّغِيرِ صِغَارُهَا ... وَتَصْغُرُ فِي عَيْنِ العَظِيمِ العَظَائِمُ\nيُكَلِّفُ سَيْفُ الدَّوْلَةِ الجَيْشَ هَمَّهُ ... وَقَدْ عَجَزَتْ عَنْهُ الجُيُوشُ الخَضَارِمُ",
    targetScriptEn: "According to the people of resolve, comes the resolution; and according to the generous comes nobility.",
    difficulty: "advanced",
    durationExpected: "1-2 دقيقة",
    targetWpm: 95
  },
  {
    id: "broadcast-morning-assembly",
    sector: "academic_student",
    type: "broadcast",
    titleAr: "عرافة حفل والبرنامج الإذاعي الصباحي المدرسي",
    titleEn: "School Morning Broadcast & Emcee",
    topicAr: "الوقفة الواثقة، طلاقة الترحيب، والتواصل البصري مع طابور الصباح.",
    topicEn: "Confident posture, vibrant welcoming tone, and eye contact with morning assembly.",
    targetScriptAr: "بسم الله الرحمن الرحيم، والصلاة والسلام على أشرف الأنبياء والمرسلين. السيد الفاضل مدير المدرسة، أساتذتي الأجلاء، زملائي الطلاب.. يسعدنا ويشرفنا أن نلتقي بكم في هذا الصباح المشرق المفعم بالعلم والأمل، لنقدم لكم برنامجنا الإذاعي لهذا اليوم، متمنين لكم يوماً حافلاً بالنجاح والتفوق.",
    targetScriptEn: "In the name of Allah, Most Gracious, Most Merciful. Respected Principal, esteemed teachers, fellow students, welcome to today's school broadcast.",
    difficulty: "beginner",
    durationExpected: "2 دقيقة",
    targetWpm: 110
  }
];

const ALERT_STYLE: Record<string, string> = {
  critical: "bg-red-600/90 animate-pulse", warning: "bg-amber-500/90", good: "bg-blue-600/85", excellent: "bg-emerald-600/90",
};
const ALERT_ICON: Record<string, string> = { critical: "❗", warning: "⚠️", good: "👍", excellent: "✓" };

const CHANNEL_LABELS: Record<ChannelName, { ar: string; en: string }> = {
  audio: { ar: "النسخ الفوري", en: "Live transcription" },
  video: { ar: "تحليل الكاميرا", en: "Camera analysis" },
  guidance: { ar: "المدرب الذكي", en: "AI coach" },
  sentiment: { ar: "تحليل النبرة", en: "Tone analysis" },
};

/** One chip per backend stream: connecting / live / error. */
function LiveStatusBar({ channels, isRtl }: { channels: Record<ChannelName, ChannelStatus>; isRtl: boolean }) {
  const style: Record<string, string> = {
    live: "bg-emerald-500/15 border-emerald-500/40 text-emerald-300",
    connecting: "bg-slate-800 border-slate-700 text-slate-300",
    error: "bg-red-950/50 border-red-700/60 text-red-300",
    closed: "bg-slate-900 border-slate-800 text-slate-500",
    idle: "bg-slate-900 border-slate-800 text-slate-500",
  };
  const stateText: Record<string, { ar: string; en: string }> = {
    live: { ar: "متصل", en: "live" }, connecting: { ar: "جارٍ الاتصال", en: "connecting" },
    error: { ar: "غير متاح", en: "unavailable" }, closed: { ar: "مغلق", en: "closed" }, idle: { ar: "—", en: "—" },
  };
  return (
    <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold" id="live-stream-status">
      {(Object.keys(CHANNEL_LABELS) as ChannelName[]).map((ch) => {
        const st = channels[ch];
        return (
          <span key={ch} title={st.message || ""} className={`px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${style[st.state]}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${st.state === "live" ? "bg-emerald-400 animate-pulse" : st.state === "error" ? "bg-red-400" : "bg-slate-500"}`} />
            {isRtl ? CHANNEL_LABELS[ch].ar : CHANNEL_LABELS[ch].en}: {isRtl ? stateText[st.state].ar : stateText[st.state].en}
          </span>
        );
      })}
    </div>
  );
}

export function OratoryStageTab({ student, dict, language, theme, onEarnReward, onReturnHome, onNavigateToExperts }: OratoryStageTabProps) {
  const isRtl = language === "ar";

  // Wizard state: setup vs active live stage vs debrief
  const [stagePhase, setStagePhase] = useState<"setup" | "active" | "debrief">("setup");
  const [selectedSector, setSelectedSector] = useState<SectorVertical>("entrepreneur_pitch");
  const [selectedSpeech, setSelectedSpeech] = useState<PresetSpeech>(PRESET_SPEECHES[0]);
  // text the live vowel check compares each spoken sentence with ("" = free speech); also the teleprompter text
  const [vowelScript, setVowelScript] = useState<string>("");

  // Stage Layout Modes: "cinema" (Wide Theater 16:9 View) vs "studio" (Split Control Tower)
  const [stageViewMode, setStageViewMode] = useState<"cinema" | "studio">("cinema");
  const [showGuidelines, setShowGuidelines] = useState<boolean>(true);
  const [prompterFontSize, setPrompterFontSize] = useState<"sm" | "md" | "lg">("md");

  // Live session state
  const [isSessionActive, setIsSessionActive] = useState<boolean>(false);
  const [secondsElapsed, setSecondsElapsed] = useState<number>(0);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  // Live measurements from the backend (microphone → Speechmatics, camera → MediaPipe, AI streams).
  // Every value stays null ("—") until it has actually been measured.
  const live = useLiveCoach();
  const m = live.metrics;
  const eyeContactScore = m.eyeContact === null ? null : Math.round(m.eyeContact);
  const postureScore = m.posture === null ? null : Math.round(m.posture);
  const handsScore = m.handsVisible === null ? null : Math.round(m.handsVisible);
  const gesturesPerMinute = m.gesturesPerMinute === null ? null : Math.round(m.gesturesPerMinute);
  const gazeZone = m.gazeZone;
  const micLevel = m.micLevel;
  const wpm = m.wpm;
  const fillerCount = m.fillerCount;
  const fillerWordsList = Object.entries(m.fillerBreakdown).map(([w, n]) => (Number(n) > 1 ? `${w} ×${n}` : w));
  const vocabDiversity = m.vocabDiversity === null ? null : Math.round(m.vocabDiversity * 100);
  const rhetoricalPausesCount = m.pausesMeasured ? m.rhetoricalPauses : null;
  const hesitationPausesCount = m.pausesMeasured ? m.hesitationPauses : null;
  const liveTranscript = m.transcript;
  const toneLabel = m.sentiment
    ? ([m.sentiment.intent, m.sentiment.intensity].filter((x) => x && x !== "غير محدد").join(" · ") || m.sentiment.label)
    : null;
  const pct = (v: number | null | undefined) => (v === null || v === undefined ? "—" : `${v}%`);

  // AI prompter: live guidance stream, camera feedback, plus the manual refresh button
  const [manualGuidance, setManualGuidance] = useState<{ text: string; tip?: string } | null>(null);
  const [isAiPromptLoading, setIsAiPromptLoading] = useState<boolean>(false);
  const aiGuidance = manualGuidance?.text ?? m.guidance
    ?? (isRtl ? "يظهر أول توجيه من المدرب الذكي بعد نحو 20 ثانية من الحديث (يحتاج إلى النص المفرّغ)." : "The first AI tip appears about 20 s after you start speaking (it needs the live transcript).");
  const bodyLanguageTip = m.bodyFeedback?.message ?? manualGuidance?.tip
    ?? (isRtl ? "ستظهر هنا ملاحظات لغة الجسد من تحليل الكاميرا." : "Body-language notes from the camera analysis appear here.");

  // Post Session Debrief Data
  const [debriefData, setDebriefData] = useState<any>(null);
  const [isGeneratingDebrief, setIsGeneratingDebrief] = useState<boolean>(false);
  const [debriefError, setDebriefError] = useState<string | null>(null);
  const [sessionResult, setSessionResult] = useState<LiveSessionResult | null>(null);

  const timerIntervalRef = useRef<any>(null);

  // Debug mode: add ?debug=1 to the address (or localStorage ilqaa_debug=1) to show stream counters
  // on the stage and log every live-stream message to the browser console.
  const debugMode = (() => {
    try {
      return new URLSearchParams(window.location.search).has("debug") || localStorage.getItem("ilqaa_debug") === "1";
    } catch { return false; }
  })();
  const [debugInfo, setDebugInfo] = useState<Record<string, any> | null>(null);
  // MediaPipe skeleton overlay (drawn by the backend) and the camera alert banner
  const [overlayOn, setOverlayOn] = useState<boolean>(false);
  const [alertVisible, setAlertVisible] = useState<boolean>(false);
  const transcriptBoxRef = useRef<HTMLDivElement | null>(null);

  // Master Speaker Audio Model state
  const [isPlayingMasterAudio, setIsPlayingMasterAudio] = useState<boolean>(false);

  // Update selected speech when sector changes
  const handleSelectSector = (secId: SectorVertical) => {
    setSelectedSector(secId);
    const matching = PRESET_SPEECHES.find(s => s.sector === secId);
    if (matching) {
      setSelectedSpeech(matching);
    }
  };

  const handlePlayMasterAudio = (textToPlay: string) => {
    if (isPlayingMasterAudio) {
      stopSpeechSynthesis();
      setIsPlayingMasterAudio(false);
      return;
    }

    setIsPlayingMasterAudio(true);
    speakMasterArabicModel(textToPlay, {
      rate: 0.85,
      onEnd: () => setIsPlayingMasterAudio(false),
      onError: () => setIsPlayingMasterAudio(false),
    });
  };

  useEffect(() => {
    return () => {
      stopSpeechSynthesis();
    };
  }, []);

  // Debug panel: refresh the counters once a second during a session
  useEffect(() => {
    if (!debugMode || !isSessionActive) return;
    const t = setInterval(() => setDebugInfo(live.getDiagnostics()), 1000);
    return () => clearInterval(t);
  }, [debugMode, isSessionActive, live.getDiagnostics]);

  useEffect(() => { live.setOverlay(overlayOn); }, [overlayOn, live.setOverlay]);

  // Show each camera alert for 3.5 s (a persistent one, like "not in the frame", stays up)
  useEffect(() => {
    if (!m.bodyAlert) return;
    setAlertVisible(true);
    const t = setTimeout(() => setAlertVisible(false), 3500);
    return () => clearTimeout(t);
  }, [m.bodyAlert?.at, m.bodyAlert?.message]);

  // Keep the newest words of the live transcript in view
  useEffect(() => {
    const el = transcriptBoxRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [liveTranscript]);

  // A newer live guidance replaces a manually requested one
  useEffect(() => {
    if (m.guidance) setManualGuidance(null);
  }, [m.guidance]);

  // Mute / camera buttons act on the real media tracks
  useEffect(() => { live.setMuted(isMuted); }, [isMuted, live.setMuted]);
  useEffect(() => { live.setCameraEnabled(isCameraActive); }, [isCameraActive, live.setCameraEnabled]);

  // Session Control: Start
  const handleStartSession = async () => {
    playClickSound();
    setSessionError(null);
    setDebriefData(null);
    setDebriefError(null);
    setSessionResult(null);
    setManualGuidance(null);
    setIsMuted(false);
    setIsCameraActive(true);
    setStagePhase("active");
    setIsSessionActive(true);
    setSecondsElapsed(0);
    clearInterval(timerIntervalRef.current);
    timerIntervalRef.current = setInterval(() => setSecondsElapsed((prev) => prev + 1), 1000);
    try {
      await live.start({ language, topic: selectedSector, debug: debugMode, script: vowelScript });
    } catch (e: any) {
      setSessionError((isRtl ? "تعذّر تشغيل الميكروفون: " : "Could not start the microphone: ") + (e?.message || String(e)));
    }
  };

  // Pinpoint which link failed when no transcript arrived
  const explainNoTranscript = (result: LiveSessionResult): string => {
    const d = result.diagnostics;
    const head = isRtl ? "لم يُلتقط أي كلام، لذلك لا يمكن تقييم الجلسة. " : "No speech was captured, so the session can't be evaluated. ";
    if (!d) return head;
    if (!d.audioStreamWasLive) {
      return head + (isRtl
        ? `تعذّر الاتصال بخدمة النسخ الفوري في الخادم (${d.audioStreamError || "لا اتصال"}). تأكد أن الخادم يعمل على المنفذ 8000 (أو اضبط BACKEND_URL في frontend/.env) وأن SPEECHMATICS_API_KEY مضبوط.`
        : `The live transcription service couldn't be reached (${d.audioStreamError || "no connection"}). Make sure the backend runs on port 8000 (or set BACKEND_URL in frontend/.env) and SPEECHMATICS_API_KEY is set.`);
    }
    if (d.chunksCaptured === 0) {
      return head + (isRtl
        ? "لم يصل أي صوت من الميكروفون إلى الصفحة. تحقق من إذن الميكروفون في المتصفح ثم أعد تحميل الصفحة."
        : "No audio came from the microphone. Check the browser's microphone permission, then reload the page.");
    }
    if (d.peakMicLevel < 3) {
      return head + (isRtl
        ? "كان الميكروفون صامتاً طوال الجلسة. تحقق من اختيار الميكروفون الصحيح ومن أنه غير مكتوم."
        : "The microphone was silent throughout. Check that the right microphone is selected and not muted.");
    }
    return head + (isRtl
      ? `وصل الصوت إلى الخادم (${d.chunksSent} مقطعاً) لكن لم تُعرف أي كلمات. راجع سجل الخادم بحثاً عن أخطاء Speechmatics (المفتاح أو الحصة أو اللغة).`
      : `Audio reached the backend (${d.chunksSent} chunks) but no words were recognised. Check the backend log for Speechmatics errors (key, quota or language).`);
  };

  // Layer shared by both stage layouts: the skeleton overlay and the camera alert banner
  const videoExtras = (
    <>
      {overlayOn && isCameraActive && (
        <canvas ref={live.attachOverlayCanvas} className="absolute inset-0 w-full h-full rounded-3xl pointer-events-none" id="pose-overlay-canvas" />
      )}
      {alertVisible && m.bodyAlert && isSessionActive && (
        <div className="absolute top-16 inset-x-0 flex justify-center pointer-events-none z-20 px-4" id="body-alert-banner">
          <div className={`px-4 py-2 rounded-xl backdrop-blur-md text-sm font-bold text-white shadow-lg flex items-center gap-2 ${ALERT_STYLE[m.bodyAlert.level] ?? "bg-slate-700/90"}`}>
            <span>{ALERT_ICON[m.bodyAlert.level] ?? "•"}</span>
            <span dir="auto">{m.bodyAlert.message}</span>
          </div>
        </div>
      )}
    </>
  );

  // Only measured values are sent; anything missing is reported to the AI as "not measured".
  const buildDebriefRequest = (result: LiveSessionResult) => {
    const a: any = result.audio || {};
    const v: any = result.video || {};
    const mm = result.metrics;
    const num = (x: any) => (typeof x === "number" && Number.isFinite(x) ? x : undefined);
    const hasVideo = (num(v.total_frames) ?? 0) > 0 && (num(v.pose_detection_rate) ?? 0) > 0;
    const tone = mm.sentiment
      ? [mm.sentiment.label, mm.sentiment.intent, mm.sentiment.intensity].filter(Boolean).join(", ")
      : undefined;
    return {
      task: "oratory_debrief",
      sector: selectedSector,
      speechType: selectedSpeech.type,
      speechTitle: isRtl ? selectedSpeech.titleAr : selectedSpeech.titleEn,
      transcript: mm.transcript,
      durationSeconds: secondsElapsed,
      wpm: num(a.overall_wpm) ?? num(mm.wpm),
      fillerCount: num(a.total_fillers) ?? mm.fillerCount,
      vocabDiversity: num(a.vocab_diversity) ?? (mm.vocabDiversity ?? undefined),
      rhetoricalPauses: mm.pausesMeasured ? mm.rhetoricalPauses : undefined,
      hesitationPauses: mm.pausesMeasured ? mm.hesitationPauses : undefined,
      eyeContactPercent: hasVideo ? num(v.eye_contact_percentage) : undefined,
      postureQuality: hasVideo ? num(v.posture_quality) : undefined,
      handsVisiblePercent: hasVideo && num(v.hand_detection_rate) !== undefined ? Math.round(v.hand_detection_rate) : undefined,
      slouchPercent: hasVideo && num(v.slouch_percentage) !== undefined ? Math.round(v.slouch_percentage) : undefined,
      stillPercent: hasVideo && num(v.frozen_percentage) !== undefined ? Math.round(v.frozen_percentage) : undefined,
      gesturesPerMinute: hasVideo && mm.gesturesPerMinute !== null ? Math.round(mm.gesturesPerMinute * 10) / 10 : undefined,
      liveSentiment: tone,
      vowelAnalysis: a.vowel_analysis,
      grade: student.grade,
      language: language,
    };
  };

  const requestDebrief = async (result: LiveSessionResult) => {
    setIsGeneratingDebrief(true);
    setDebriefError(null);
    try {
      if (!result.metrics.transcript.trim()) {
        throw new Error(explainNoTranscript(result));
      }
      const body = buildDebriefRequest(result);
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.details || data?.error || `HTTP ${res.status}`);
      setDebriefData({
        ...data,
        rhetoricalPauses: body.rhetoricalPauses ?? data.rhetoricalPauses,
        measured: body,
      });
      playCelebrationFanfare();
      if (onEarnReward) onEarnReward(200, 15);
    } catch (e: any) {
      console.warn("Debrief failed:", e);
      setDebriefError(e?.message || String(e));
    } finally {
      setIsGeneratingDebrief(false);
    }
  };

  // Session Control: Stop & Debrief
  const handleStopSession = async () => {
    playClickSound();
    setIsSessionActive(false);
    clearInterval(timerIntervalRef.current);
    setStagePhase("debrief");
    setIsGeneratingDebrief(true);
    const result = await live.stop();
    setSessionResult(result);
    await requestDebrief(result);
  };

  // Manual "Refresh" of the AI prompter (uses the real transcript only)
  const handleRequestAiCoaching = async () => {
    if (!liveTranscript.trim()) return;
    setIsAiPromptLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: "oratory_live_prompt",
          sector: selectedSector,
          speechType: selectedSpeech.titleAr,
          topic: selectedSpeech.topicAr,
          currentTranscript: liveTranscript,
          language: language
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (!data.offline_fallback && data.speakingGuidance) {
          setManualGuidance({ text: data.speakingGuidance, tip: data.bodyLanguageTip });
        }
      }
    } catch (err) {
      console.warn("AI coaching fetch failed:", err);
    } finally {
      setIsAiPromptLoading(false);
    }
  };

  // Cleanup on unmount (the live hook closes media and sockets itself)
  useEffect(() => {
    return () => clearInterval(timerIntervalRef.current);
  }, []);

  // Format seconds to mm:ss
  const formatTimer = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // Active sector config
  const activeSectorConfig = SECTOR_CONFIGS[selectedSector];

  // Speed Status Helper
  const getSpeedStatus = (currentWpm: number | null) => {
    if (currentWpm === null) {
      return { text: isRtl ? "بانتظار الكلام" : "Waiting for speech", note: isRtl ? "تُحسب السرعة من النص المفرّغ مباشرة" : "Pace is measured from the live transcript", color: "text-slate-400" };
    }
    const [minRange, maxRange] = activeSectorConfig.wpmRange;
    if (currentWpm < minRange - 10) {
      return { text: isRtl ? "إيقاع بطيء" : "Pacing Slow", note: isRtl ? "ارفع السرعة لتفادي فتور انتباه الجمهور" : "Increase pace to maintain audience drive", color: "text-amber-400" };
    } else if (currentWpm > maxRange + 10) {
      return { text: isRtl ? "إيقاع متسارع" : "Pacing Rushed", note: isRtl ? "تمهل وافسح مجالاً للوقفات البلاغية" : "Slow down and insert strategic pauses", color: "text-rose-400" };
    }
    return { text: isRtl ? "سرعة نموذجية متقنة" : "Optimal Cadence", note: isRtl ? `مطابق لسرعة ${activeSectorConfig.badgeAr}` : "Perfect cadence for this speaking vertical", color: "text-emerald-400" };
  };

  const speedStatus = getSpeedStatus(wpm);

  // -------------------------------------------------------------
  // VIEW 1: PRE-STAGE SETUP WIZARD & SECTOR SELECTION
  // -------------------------------------------------------------
  if (stagePhase === "setup") {
    return (
      <div className="space-y-6 max-w-7xl mx-auto" id="oratory-setup-wizard">
        
        {/* Navigation & Gateway Bar */}
        {onReturnHome && (
          <div className="flex items-center justify-between bg-white dark:bg-[#1A0A13] p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
            <button
              onClick={onReturnHome}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-black flex items-center gap-2 cursor-pointer transition-all"
              id="oratory-return-hub-btn"
            >
              <span>{isRtl ? "⬅ العودة إلى بوابة المراحل الرئيسية" : "⬅ Back to Stages Gateway"}</span>
            </button>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#8A1538] dark:text-amber-300 px-3 py-1 bg-amber-50 dark:bg-[#2B0813] rounded-full border border-amber-200 dark:border-amber-900/40">
                {isRtl ? "المرحلة 2: مسرح الخطابة والمنبر الذكي 🇶🇦" : "Stage 2: Live Oratory Studio 🇶🇦"}
              </span>
            </div>
          </div>
        )}

        {/* Hero Banner: Luxury Qatari Maroon & Gold with Global Oratory Focus */}
        <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#3D0818] via-[#8A1538] to-[#1F040C] text-white shadow-xl relative overflow-hidden border border-[#D4AF37]/30">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-[#B82A52]/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/30 border border-[#D4AF37]/40 text-xs font-bold text-[#FDE68A]">
                <IlqaaLogo size="sm" showText={false} />
                <span>{isRtl ? "مختبر إلقاء العالمي للخطابة والوقفة المنبرية 🇶🇦" : "ILQAA Global AI Oratory & Stage Arena"}</span>
              </div>
              
              <h1 className="text-2xl sm:text-4xl font-black font-serif tracking-tight text-white leading-snug">
                {isRtl ? "مسرح الإلقاء التنفيذي والمواجهة المنبرية" : "Executive Public Speaking & Oratory Arena"}
              </h1>
              
              <p className="text-sm text-amber-50/90 leading-relaxed">
                {isRtl
                  ? "منصة متطورة تدرب رواد الأعمال والقيادات والطلاب على امتلاك أعلى مهارات الفصاحة والهيبة المنبرية، عبر التحليل الحظي لـ (التواصل البصري الثلاثي، فضاء الإيماءات، التنوع النغمي الصوتي، والوقفات البلاغية) بأحدث ما توصلت إليه أبحاث MIT وهارفارد والذكاء الاصطناعي العالمي."
                  : "A multimodal AI stage training founders, C-suite executives, and scholars in charismatic delivery, 3-zone audience sweeping, vocal prosody, and pregnant pauses based on MIT and Harvard research."}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
              <button
                onClick={handleStartSession}
                className="px-8 py-4 rounded-2xl bg-gradient-to-r from-[#D4AF37] via-[#F59E0B] to-[#B45309] hover:from-[#F59E0B] hover:to-[#D4AF37] text-slate-950 font-black text-sm shadow-xl shadow-amber-900/30 transition-all flex items-center justify-center gap-3 cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
                id="start-stage-session-btn"
              >
                <Play className="w-5 h-5 fill-slate-950 text-slate-950" />
                <span>{isRtl ? "اعتلاء المسرح والبدء الآن 🎙️" : "Enter Stage Studio 🎙️"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* 5 Market Verticals Tabs (رواد الأعمال - القيادات - المؤتمرات - المناظرات - الطلاب) */}
        <div className="bg-white dark:bg-[#1A0A13] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#8A1538] dark:text-amber-400" />
                <span>{isRtl ? "اختر قطاع التدريب التخصصي (النسخ القطاعية المستقلة):" : "Select Specialized Industry Vertical:"}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {isRtl ? "كل قطاع يمتلك معايير تقييم وسرعة كلام ومؤشرات حسم مصممة خصيصاً لجمهوره المستهدف." : "Each vertical tunes pacing, gestures, and persuasion benchmarks to its target audience."}
              </p>
            </div>
            <span className="text-[11px] font-bold text-[#D4AF37] bg-amber-50 dark:bg-[#2B0813] px-3 py-1 rounded-full border border-amber-200 dark:border-amber-900/40">
              {isRtl ? "5 قطاعات سوقية متخصصة" : "5 Dedicated Market Verticals"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {(Object.values(SECTOR_CONFIGS) as SectorConfig[]).map((sec) => {
              const isSelected = selectedSector === sec.id;
              const IconComp = sec.icon;
              return (
                <button
                  key={sec.id}
                  onClick={() => {
                    playClickSound();
                    handleSelectSector(sec.id);
                  }}
                  className={`p-4 rounded-2xl border-2 text-start transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    isSelected
                      ? "border-[#8A1538] dark:border-[#D4AF37] bg-[#8A1538]/5 dark:bg-[#8A1538]/20 shadow-md ring-2 ring-[#D4AF37]/40"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#12040B] hover:border-slate-300 dark:hover:border-slate-700"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isSelected ? "bg-[#8A1538] text-white" : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"}`}>
                        <IconComp className="w-4 h-4" />
                      </div>
                      {isSelected && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      )}
                    </div>
                    <h3 className="font-bold text-xs text-slate-900 dark:text-white leading-tight">
                      {isRtl ? sec.titleAr : sec.titleEn}
                    </h3>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 block">
                      {isRtl ? `السرعة: ${sec.targetWpm} ك/د` : `${sec.targetWpm} WPM`}
                    </span>
                    <span className="text-[9px] text-[#8A1538] dark:text-amber-300 font-bold block truncate">
                      {isRtl ? sec.badgeAr : sec.badgeEn}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Sector Highlight Banner */}
          <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-[#200713] border border-amber-200/80 dark:border-amber-900/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-[#8A1538] dark:text-amber-400">
                {isRtl ? "المؤشر القيادي الأبرز لهذا القطاع:" : "Primary Evaluative Benchmark:"}
              </span>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                {isRtl ? activeSectorConfig.primaryMetricAr : activeSectorConfig.primaryMetricEn}
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                {isRtl ? activeSectorConfig.descriptionAr : activeSectorConfig.descriptionEn}
              </p>
            </div>
            <div className="shrink-0 px-3 py-1.5 rounded-xl bg-white dark:bg-black/40 border border-amber-300/60 dark:border-amber-900/60 text-xs font-mono font-bold text-[#8A1538] dark:text-amber-300">
              {isRtl ? `النطاق المستهدف: ${activeSectorConfig.wpmRange[0]} - ${activeSectorConfig.wpmRange[1]} ك/د` : `${activeSectorConfig.wpmRange[0]}-${activeSectorConfig.wpmRange[1]} WPM`}
            </div>
          </div>
        </div>

        {/* Speeches & Scripts List */}
        <div className="bg-white dark:bg-[#1A0A13] rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-[#8A1538] dark:text-amber-400" />
              <span>{isRtl ? "اختر النص والخطاب المعتمد للتدريب:" : "Select Practice Script:"}</span>
            </h3>
            <span className="text-xs font-bold text-slate-400">
              {PRESET_SPEECHES.filter(s => s.sector === selectedSector).length} {isRtl ? "نماذج متوفرة لهذا القطاع" : "Scripts Available"}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {PRESET_SPEECHES.filter(s => s.sector === selectedSector).map((sp) => {
              const isSelected = selectedSpeech.id === sp.id;
              return (
                <div
                  key={sp.id}
                  onClick={() => {
                    playClickSound();
                    setSelectedSpeech(sp);
                  }}
                  className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                    isSelected
                      ? "border-[#8A1538] dark:border-[#D4AF37] bg-[#8A1538]/5 dark:bg-[#8A1538]/20 shadow-md ring-2 ring-[#D4AF37]/50"
                      : "border-slate-200 dark:border-slate-800 bg-white dark:bg-[#12040B] hover:border-[#8A1538]/30"
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black px-2.5 py-1 rounded-full uppercase bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                        {sp.difficulty === "advanced" ? (isRtl ? "مستوى متقدم" : "Advanced") : (isRtl ? "مستوى متوسط" : "Intermediate")}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {sp.durationExpected}
                      </span>
                    </div>

                    <h4 className="font-bold text-sm text-slate-900 dark:text-white font-serif">
                      {isRtl ? sp.titleAr : sp.titleEn}
                    </h4>

                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {isRtl ? sp.topicAr : sp.topicEn}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                    <span className="text-[11px] font-medium text-slate-400">
                      {isRtl ? `السرعة: ${sp.targetWpm} ك/د` : `${sp.targetWpm} WPM`}
                    </span>
                    {isSelected && (
                      <span className="flex items-center gap-1 text-[#8A1538] dark:text-[#D4AF37] font-bold text-xs">
                        <Check className="w-4 h-4 text-[#D4AF37]" />
                        {isRtl ? "محدد" : "Selected"}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Master Orator Listening Station & Script Preview */}
        <div className="bg-gradient-to-r from-amber-50 via-rose-50/40 to-amber-50 dark:from-[#200A15] dark:to-[#2B0813] rounded-3xl p-6 border-2 border-amber-200 dark:border-amber-900/40 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#8A1538] to-[#5C0E25] text-amber-300 flex items-center justify-center shadow-md shrink-0">
                <Volume2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-serif font-black text-base text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{isRtl ? "محطة الاستماع للنموذج الخطابي الفصيح (الخطيب الأستاذ)" : "Master Orator Vocal Reference"}</span>
                  <span className="px-2 py-0.5 rounded-full bg-[#D4AF37] text-slate-950 text-[10px] font-black">
                    {isRtl ? "فصاحة معيارية" : "Standard Model"}
                  </span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                  {isRtl
                    ? "استمع لنبرة الصوت، ومواضع الوقف، وضبط مخارج الحروف قبل اعتلاء المنبر الحي."
                    : "Listen to proper vocal intonation, rhetorical pauses, and phonetic clarity before entering the live stage."}
                </p>
              </div>
            </div>

            <button
              onClick={() => handlePlayMasterAudio(selectedSpeech.targetScriptAr)}
              className={`px-5 py-3 rounded-2xl font-black text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shrink-0 ${
                isPlayingMasterAudio
                  ? "bg-red-600 hover:bg-red-700 text-white animate-pulse"
                  : "bg-gradient-to-r from-[#8A1538] to-[#2B0813] hover:from-[#A01B42] text-white ring-2 ring-[#D4AF37]/50"
              }`}
            >
              {isPlayingMasterAudio ? (
                <>
                  <Square className="w-4 h-4 fill-white" />
                  <span>{isRtl ? "إيقاف الاستماع" : "Stop Audio"}</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-white" />
                  <span>{isRtl ? "استمع للنموذج الخطابي 🔊" : "Play Master Speech 🔊"}</span>
                </>
              )}
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-white dark:bg-[#15060D] border border-amber-200/80 dark:border-amber-900/30">
            <p className="text-xs text-slate-500 dark:text-slate-400 font-bold mb-1.5 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-[#8A1538] dark:text-amber-400" />
              <span>{isRtl ? "النص الخطابي المعتمد للتدريب:" : "Selected Script for Delivery:"}</span>
            </p>
            <p className="font-serif text-sm sm:text-base text-slate-900 dark:text-amber-50 leading-loose">
              {selectedSpeech.targetScriptAr}
            </p>
          </div>
        </div>

        <VowelScriptSetup
          isRtl={isRtl}
          language={language}
          selectedScript={selectedSpeech.targetScriptAr}
          onChange={(text) => setVowelScript(text)}
        />

      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 2: ACTIVE LIVE ORATORY ARENA (Flawless 16:9 Aspect Ratio)
  // -------------------------------------------------------------
  if (stagePhase === "active") {
    return (
      <div className="bg-[#0A0E1A] text-slate-100 rounded-3xl p-4 sm:p-6 shadow-2xl border border-slate-800 space-y-4 font-sans max-w-7xl mx-auto" id="ilqaa-live-oratory-studio">
        
        {/* Top Studio Control & Identity Bar */}
        <header className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
          
          {/* Action Buttons: Stop, Mic, Cam */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleStopSession}
              className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-all flex items-center gap-2 shadow-lg shadow-red-600/30 cursor-pointer animate-pulse"
              id="stop-stage-session-btn"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
              <span>{dict.stopSession}</span>
            </button>

            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2 rounded-xl border text-xs transition-all cursor-pointer ${
                isMuted ? "bg-red-900/30 border-red-700 text-red-400" : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
              }`}
              title={isMuted ? "إلغاء كتم الصوت" : "كتم الصوت"}
            >
              {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setIsCameraActive(!isCameraActive)}
              className={`p-2 rounded-xl border text-xs transition-all cursor-pointer ${
                !isCameraActive ? "bg-red-900/30 border-red-700 text-red-400" : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
              }`}
              title={isCameraActive ? "إيقاف الكاميرا" : "تشغيل الكاميرا"}
            >
              {!isCameraActive ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
            </button>

            <button
              onClick={() => setOverlayOn(!overlayOn)}
              disabled={!isCameraActive}
              className={`p-2 rounded-xl border text-xs transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-40 ${
                overlayOn ? "bg-cyan-900/40 border-cyan-600 text-cyan-300" : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
              }`}
              title={isRtl ? "إظهار/إخفاء هيكل الحركة (نقاط الرأس والجسم واليدين من MediaPipe)" : "Show/hide the pose skeleton (head, body and hand landmarks from MediaPipe)"}
              id="pose-overlay-toggle"
            >
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline font-bold">{isRtl ? "هيكل الحركة" : "Pose"}</span>
            </button>
          </div>

          {/* Center Brand & Sector Badge */}
          <div className="flex items-center gap-2.5">
            <IlqaaLogo size="sm" showText={false} />
            <span className="font-serif font-black text-lg text-white tracking-wider">
              {isRtl ? "إلْقَـــاء" : "ILQAA.AI"}
            </span>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
              {isRtl ? activeSectorConfig.badgeAr : activeSectorConfig.badgeEn}
            </span>
          </div>

          {/* Layout Switcher & Timer */}
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                onClick={() => setStageViewMode("cinema")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  stageViewMode === "cinema" ? "bg-[#8A1538] text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                {isRtl ? "شاشة المسرح 16:9" : "Cinema 16:9"}
              </button>
              <button
                onClick={() => setStageViewMode("studio")}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  stageViewMode === "studio" ? "bg-[#8A1538] text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                {isRtl ? "برج التحليل" : "Studio Split"}
              </button>
            </div>

            <button
              onClick={() => setShowGuidelines(!showGuidelines)}
              className={`p-2 rounded-xl border text-xs transition-all cursor-pointer ${
                showGuidelines ? "bg-cyan-950/40 border-cyan-700 text-cyan-300" : "bg-slate-800 border-slate-700 text-slate-400"
              }`}
              title="تفعيل شبكة الخطابة وصندوق الإيماءات الذهبي"
            >
              <Crosshair className="w-4 h-4" />
            </button>

            <div className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-cyan-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>{formatTimer(secondsElapsed)}</span>
            </div>
          </div>
        </header>

        <LiveStatusBar channels={live.channels} isRtl={isRtl} />
        {(sessionError || live.error || live.cameraAvailable === false) && (
          <div className="rounded-xl border border-amber-700/60 bg-amber-950/40 px-4 py-2 text-xs text-amber-200 space-y-1 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="space-y-1">
              {sessionError && <p>{sessionError}</p>}
              {live.error && <p>{isRtl ? "النسخ الفوري غير متاح: " : "Live transcription unavailable: "}{live.error}</p>}
              {live.cameraAvailable === false && (
                <p>{isRtl ? "لا توجد كاميرا متاحة – لن يُقاس التواصل البصري ولغة الجسد." : "No camera available – eye contact and body language won't be measured."}</p>
              )}
            </div>
          </div>
        )}

        {/* Live transcript (Speechmatics, via /ws/audio) */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/80 p-4 space-y-2" id="live-transcript-panel">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="flex items-center gap-2 text-slate-200">
              <Mic className="w-4 h-4 text-rose-400" />
              {isRtl ? "النص المفرّغ مباشرة" : "Live transcript"}
            </span>
            <span className="text-slate-500 font-mono">{m.totalWords} {isRtl ? "كلمة" : "words"}</span>
          </div>
          <div
            ref={transcriptBoxRef}
            dir="auto"
            className="max-h-28 overflow-y-auto text-sm leading-relaxed text-slate-100 whitespace-pre-wrap"
          >
            {liveTranscript || (
              <span className="text-slate-500 text-xs">
                {live.channels.audio.state === "live"
                  ? (m.transcriber === "asr"
                      ? (isRtl ? "ابدأ بالحديث… تظهر كل جملة هنا بعد أن تتوقف عندها لحظة." : "Start speaking… each sentence appears here after you pause.")
                      : (isRtl ? "ابدأ بالحديث… سيظهر كلامك هنا خلال ثانية أو ثانيتين." : "Start speaking… your words appear here within a second or two."))
                  : live.channels.audio.state === "error"
                    ? (isRtl ? "النسخ الفوري غير متاح – راجع التنبيه أعلاه." : "Live transcription is unavailable – see the notice above.")
                    : (isRtl ? "جارٍ الاتصال بخدمة النسخ الفوري…" : "Connecting to live transcription…")}
              </span>
            )}
          </div>
        </div>

        {/* Live vowel check (vowelized ASR per sentence, via /ws/audio) */}
        <VowelTranscriptPanel status={m.vowelCheck} segments={m.vowelSegments} isRtl={isRtl} />

        {debugMode && (
          <div className="rounded-xl border border-cyan-800 bg-cyan-950/40 p-3 text-[11px] font-mono text-cyan-200 space-y-1" dir="ltr" id="live-debug-panel">
            <div className="font-bold text-cyan-300">DEBUG – live streams (details in the browser console: [live:…])</div>
            {debugInfo ? (
              <>
                <div>streams → {debugInfo.wsUrl}/ws/… · audio stream connected: {String(debugInfo.audioStreamWasLive)}{debugInfo.audioStreamError ? ` · error: ${debugInfo.audioStreamError}` : ""}</div>
                <div>microphone: {debugInfo.microphone} · AudioContext {debugInfo.audioContextState} @ {debugInfo.inputSampleRate} Hz</div>
                <div>mic chunks captured {debugInfo.chunksCaptured} · sent {debugInfo.chunksSent} · peak level {debugInfo.peakMicLevel} · now {micLevel}</div>
                <div>messages received → audio {debugInfo.messagesReceived?.audio} · video {debugInfo.messagesReceived?.video} · guidance {debugInfo.messagesReceived?.guidance} · sentiment {debugInfo.messagesReceived?.sentiment}</div>
                <div>camera: {debugInfo.camera} · transcript chars {liveTranscript.length}</div>
              </>
            ) : (
              <div>{isSessionActive ? "collecting…" : "start a session to see the counters"}</div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------------- */}
        {/* MODE A: CINEMA WIDESCREEN THEATER (Full 16:9 Master View with HUD) */}
        {/* ------------------------------------------------------------------- */}
        {stageViewMode === "cinema" ? (
          <div className="space-y-4">
            
            {/* The Master 16:9 Stage Viewport */}
            <div className="w-full aspect-video max-h-[66vh] bg-black rounded-3xl overflow-hidden relative border-2 border-slate-800 shadow-2xl flex items-center justify-center group">
              
              {/* Real Camera Stream OR Fallback Video */}
              {isCameraActive ? (
                <video
                  ref={live.attachVideo}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover rounded-3xl"
                />
              ) : (
                <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
                  <VideoOff className="w-16 h-16 text-slate-600" />
                  <p className="text-sm text-slate-400 font-bold">
                    {isRtl ? "تم إيقاف تغذية الكاميرا" : "Camera Feed Paused"}
                  </p>
                </div>
              )}

              {videoExtras}

              {/* Stage Ambient Lighting / Spotlight FX */}
              <div className="absolute inset-0 pointer-events-none bg-radial from-transparent via-transparent to-black/60" />

              {/* Framing Guidelines & Golden Executive Gesture Box */}
              {showGuidelines && (
                <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-6">
                  {/* Eye-level line */}
                  <div className="w-full border-t border-cyan-400/20 border-dashed relative">
                    <span className="absolute -top-3 left-4 text-[9px] font-mono text-cyan-300/60 bg-black/60 px-1.5 py-0.5 rounded">
                      {isRtl ? "مستوى خط النظر البصري (Eye Level)" : "Eye Level"}
                    </span>
                  </div>

                  {/* Executive Gesture Box (الصندوق القياسي للإيماءات) */}
                  <div className="self-center w-72 sm:w-96 h-36 border-2 border-amber-400/30 rounded-2xl relative bg-amber-500/5 flex items-end justify-center pb-1">
                    <span className="text-[9px] font-mono text-amber-300/80 bg-black/60 px-2 py-0.5 rounded border border-amber-500/30">
                      {isRtl ? "فضاء الإيماءات القيادية (Chest to Belt)" : "Executive Gesture Box"}
                    </span>
                  </div>

                  {/* Audience 3-Zone Sweeping Arc */}
                  <div className="w-full flex items-center justify-between text-[10px] font-mono text-slate-400 px-4">
                    <span className={`px-2 py-0.5 rounded ${gazeZone === "left" ? "bg-cyan-500 text-slate-950 font-bold" : "bg-black/40"}`}>
                      {isRtl ? "الجمهور (يسار)" : "Audience (Left)"}
                    </span>
                    <span className={`px-2 py-0.5 rounded ${gazeZone === "center" ? "bg-emerald-500 text-slate-950 font-bold" : "bg-black/40"}`}>
                      {isRtl ? "الجمهور (الوسط)" : "Audience (Center)"}
                    </span>
                    <span className={`px-2 py-0.5 rounded ${gazeZone === "right" ? "bg-cyan-500 text-slate-950 font-bold" : "bg-black/40"}`}>
                      {isRtl ? "الجمهور (يمين)" : "Audience (Right)"}
                    </span>
                  </div>
                </div>
              )}

              {/* Floating Top Telemetry HUD Pills */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-auto">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs font-mono font-bold text-white shadow-lg">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <Eye className="w-3.5 h-3.5 text-cyan-300" />
                    <span>{pct(eyeContactScore)}</span>
                    <span className="text-[10px] text-slate-400 hidden sm:inline">{isRtl ? "اتصال بصري" : "Eye Contact"}</span>
                  </div>

                  <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs font-mono font-bold text-white shadow-lg">
                    <UserCheck className="w-3.5 h-3.5 text-purple-300" />
                    <span>{pct(postureScore)}</span>
                    <span className="text-[10px] text-slate-400 hidden sm:inline">{isRtl ? "استقامة الوقفة" : "Posture"}</span>
                  </div>

                  <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs font-mono font-bold text-white shadow-lg">
                    <Hand className="w-3.5 h-3.5 text-amber-300" />
                    <span>{gesturesPerMinute ?? "—"}</span>
                    <span className="text-[10px] text-slate-400 hidden sm:inline">{isRtl ? "إيماءة/دقيقة" : "gestures/min"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs font-mono font-bold text-white shadow-lg">
                    {isMuted ? <MicOff className="w-3.5 h-3.5 text-red-400" /> : <Mic className="w-3.5 h-3.5 text-rose-400" />}
                    <span>{isMuted ? "—" : `${micLevel}%`}</span>
                    <span className="text-[10px] text-slate-400 hidden sm:inline">{isRtl ? "مستوى الصوت" : "Mic level"}</span>
                  </div>

                  <div className="flex items-center gap-1.5 bg-black/70 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10 text-xs font-mono font-bold text-amber-300 shadow-lg">
                    <Gauge className="w-3.5 h-3.5 text-amber-400" />
                    <span>{wpm === null ? "—" : wpm.toFixed(0)} {isRtl ? "ك/د" : "WPM"}</span>
                  </div>
                </div>
              </div>

              {/* Bottom Stage Overlay: Target Script Teleprompter Strip */}
              <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3 pointer-events-auto">
                <div className="bg-black/80 backdrop-blur-md p-3 rounded-2xl border border-white/15 text-xs text-white max-w-2xl shadow-xl flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[#D4AF37] shrink-0 animate-ping" />
                  <p className="font-serif leading-relaxed line-clamp-2 text-slate-200">
                    {vowelScript || selectedSpeech.targetScriptAr}
                  </p>
                </div>

                <div className="bg-black/80 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/15 flex items-center gap-2 text-xs font-bold text-slate-300 shrink-0">
                  <Sparkles className="w-4 h-4 text-fuchsia-400" />
                  <span>{isRtl ? "النبرة:" : "Tone:"}</span>
                  <span className="text-emerald-400 text-sm">{toneLabel ?? "—"}</span>
                </div>
              </div>

            </div>

            {/* Cinema Bottom Metrics Dock (4 Cards with Proportional Sizing) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              
              {/* Metric 1: Prosody & Rhetorical Pauses */}
              <div className="bg-[#111827] rounded-2xl p-4 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-cyan-400" />
                    <span>{isRtl ? "الوقفات والتنغيم الصوتي" : "Pauses & Prosody"}</span>
                  </span>
                  <span className="text-cyan-400 font-mono">{rhetoricalPausesCount ?? "—"} {isRtl ? "وقفات ذكية" : "Pauses"}</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  {isRtl ? "وقفات بلاغية (0.8 - 2.0 ثانية) تعزز هيبة الخطيب وتسمح للجمهور باستيعاب الفكرة." : "Strategic 0.8-2s pauses allowing audience assimilation."}
                </p>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800">
                  <span>{isRtl ? "صمت التردد: " : "Hesitation: "}{hesitationPausesCount ?? "—"}</span>
                  <span className="text-slate-500">{isRtl ? "تقدير من توقيت النص المفرّغ" : "From transcript timing"}</span>
                </div>
              </div>

              {/* Metric 2: Filler & Hedge Words */}
              <div className="bg-[#111827] rounded-2xl p-4 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <Radio className="w-4 h-4 text-amber-400" />
                    <span>{isRtl ? "الكلمات الحشوية والتردد" : "Filler Words Tracker"}</span>
                  </span>
                  <span className="text-amber-400 font-mono text-sm px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                    {fillerCount}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 truncate">
                  {fillerWordsList.length > 0 ? fillerWordsList.join("، ") : (isRtl ? "لم يتم رصد حشو كلامي حتى الآن" : "No fillers detected yet")}
                </p>
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800">
                  <span>{isRtl ? "تنوع المفردات:" : "Vocabulary diversity:"} {pct(vocabDiversity)}</span>
                  <span className="text-slate-400">{m.totalWords} {isRtl ? "كلمة" : "words"}</span>
                </div>
              </div>

              {/* Metric 3: Live AI Orator Guidance */}
              <div className="bg-[#111827] rounded-2xl p-4 border border-slate-800 space-y-2 md:col-span-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-fuchsia-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-fuchsia-400" />
                    <span>{isRtl ? "توجيه المدرب الذكي اللحظي (AI Teleprompter Coach):" : "Live AI Stage Director:"}</span>
                  </span>
                  <button
                    onClick={handleRequestAiCoaching}
                    disabled={isAiPromptLoading || !liveTranscript.trim()}
                    title={!liveTranscript.trim() ? (isRtl ? "ابدأ بالحديث أولاً" : "Start speaking first") : ""}
                    className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <RefreshCw className={`w-3 h-3 ${isAiPromptLoading ? "animate-spin text-fuchsia-400" : ""}`} />
                    <span>{isRtl ? "تحديث" : "Refresh"}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed font-sans bg-purple-950/30 p-2.5 rounded-xl border border-purple-800/40">
                  {aiGuidance}
                </p>
                {m.contentFeedback && (
                  <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-900/60 p-2 rounded-lg border border-slate-800" dir="auto">
                    <span className="font-bold text-amber-300">{isRtl ? "تحليل المحتوى: " : "Content analysis: "}</span>{m.contentFeedback}
                  </p>
                )}
                <p className="text-[11px] text-cyan-300 font-bold flex items-center gap-1.5">
                  <Eye className="w-3 h-3" />
                  <span>{bodyLanguageTip}</span>
                </p>
              </div>

            </div>

          </div>
        ) : (
          /* ------------------------------------------------------------------- */
          /* MODE B: STUDIO SPLIT (8:4 Proportional Grid - Stage & Command Tower) */
          /* ------------------------------------------------------------------- */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* Left/Right Main Column: 16:9 Stage Screen (8 Columns) */}
            <div className="lg:col-span-8 space-y-4">
              <div className="w-full aspect-video bg-black rounded-3xl overflow-hidden relative border-2 border-slate-800 shadow-2xl flex items-center justify-center">
                {isCameraActive ? (
                  <video
                    ref={live.attachVideo}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover rounded-3xl"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 text-center space-y-2">
                    <VideoOff className="w-12 h-12 text-slate-600" />
                    <p className="text-xs text-slate-400">{isRtl ? "الكاميرا متوقفة" : "Camera Paused"}</p>
                  </div>
                )}

                {videoExtras}

                {/* Top Video HUD Badges */}
                <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-auto">
                  <div className="flex items-center gap-2">
                    <div className="bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-xs font-mono font-bold text-white flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      <Eye className="w-3.5 h-3.5 text-cyan-300" />
                      <span>{pct(eyeContactScore)}</span>
                    </div>
                    <div className="bg-black/70 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/10 text-xs font-mono font-bold text-white flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-purple-300" />
                      <span>{pct(postureScore)}</span>
                    </div>
                  </div>

                  <div className="bg-black/70 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 text-xs font-mono text-cyan-400 font-bold">
                    {formatTimer(secondsElapsed)}
                  </div>
                </div>

                {/* Bottom Video HUD Badges */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between pointer-events-none">
                  <div className="bg-black/70 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 text-xs font-bold text-white">
                    {selectedSpeech.titleAr}
                  </div>
                  <div className="bg-black/70 backdrop-blur-md px-3 py-1 rounded-lg border border-white/10 text-xs font-mono text-amber-300 font-bold">
                    {wpm === null ? "—" : wpm.toFixed(0)} {isRtl ? "ك/د" : "WPM"}
                  </div>
                </div>
              </div>

              {/* Script & Live Speech Prompt Drawer */}
              <div className="bg-[#111827] rounded-2xl p-4 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between pb-1 border-b border-slate-800 text-xs font-bold">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-[#D4AF37]" />
                    <span>{isRtl ? "النص المرجعي المستهدف:" : "Target Script:"}</span>
                  </span>
                  <span className="text-[10px] text-slate-500 font-normal">{m.totalWords} {isRtl ? "كلمة مفرّغة" : "words transcribed"}</span>
                </div>
                <p className="font-serif text-xs text-slate-300 leading-relaxed max-h-24 overflow-y-auto">
                  {selectedSpeech.targetScriptAr}
                </p>
              </div>
            </div>

            {/* Right Column: Telemetry Tower (4 Columns) */}
            <div className="lg:col-span-4 space-y-4">
              
              {/* Pacing & Speed Gauge */}
              <div className="bg-[#111827] rounded-2xl p-4 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <Gauge className="w-4 h-4 text-amber-400" />
                    <span>{dict.speechSpeed}</span>
                  </span>
                  <span className="font-mono text-amber-400 font-bold">{wpm === null ? "—" : wpm.toFixed(1)} WPM</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border-2 border-amber-400 flex items-center justify-center font-bold text-xs text-amber-400 font-mono shrink-0">
                    {wpm === null ? "—" : Math.round(wpm)}
                  </div>
                  <div>
                    <p className={`text-xs font-bold ${speedStatus.color}`}>
                      {speedStatus.text}
                    </p>
                    <p className="text-[10px] text-slate-400 leading-tight">
                      {speedStatus.note}
                    </p>
                  </div>
                </div>
              </div>

              {/* Visual Telemetry Bars */}
              <div className="bg-[#111827] rounded-2xl p-4 border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <span>{dict.visualAnalysis}</span>
                </h4>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">{dict.eyeContact}</span>
                    <span className="text-emerald-400 font-mono font-bold">{pct(eyeContactScore)}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${eyeContactScore ?? 0}%` }} />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-400">{dict.postureDetection}</span>
                    <span className="text-purple-400 font-mono font-bold">{pct(postureScore)}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: `${postureScore ?? 0}%` }} />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-400" title={isRtl ? "نسبة الإطارات التي رُصدت فيها اليدان" : "Share of frames in which a hand was detected"}>{dict.handsDetection}</span>
                    <span className="text-amber-400 font-mono font-bold">{pct(handsScore)}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${handsScore ?? 0}%` }} />
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-400" title={isRtl ? "نسبة الإطارات التي رُصد فيها الجسم – إن كانت منخفضة فاقترب أو ابتعد ليظهر رأسك وكتفاك" : "Share of frames with your body detected – if low, adjust so your head and shoulders are in frame"}>
                      {isRtl ? "رصد الجسم في الإطار" : "Body detected"}
                    </span>
                    <span className="text-cyan-400 font-mono font-bold">{pct(m.poseDetectionRate === null ? null : Math.round(m.poseDetectionRate))}</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                    <div className="h-full bg-cyan-500 rounded-full" style={{ width: `${m.poseDetectionRate ?? 0}%` }} />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] font-mono text-slate-400 pt-2 border-t border-slate-800">
                    <span title={isRtl ? "زاوية الأذن–الكتف–الورك" : "Ear–shoulder–hip angle"}>{isRtl ? "انحناء:" : "Slouch:"} {pct(m.slouchPercent === null ? null : Math.round(m.slouchPercent))}</span>
                    <span title={isRtl ? "حركة الرأس شبه معدومة" : "Almost no head movement"}>{isRtl ? "ثبات زائد:" : "Too still:"} {pct(m.frozenPercent === null ? null : Math.round(m.frozenPercent))}</span>
                    <span>{isRtl ? "إيماءات:" : "Gestures:"} {gesturesPerMinute ?? "—"}{isRtl ? "/د" : "/min"}</span>
                    <span>{m.videoFps === null ? "—" : m.videoFps.toFixed(1)} fps</span>
                  </div>
                </div>
              </div>

              {/* AI Guidance Box */}
              <div className="bg-[#111827] rounded-2xl p-4 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-fuchsia-400 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>{dict.aiSpeakingPrompts}</span>
                  </span>
                </div>
                <p className="text-xs text-slate-200 leading-relaxed bg-purple-950/30 p-2.5 rounded-xl border border-purple-800/40">
                  {aiGuidance}
                </p>
                {m.contentFeedback && (
                  <p className="text-[11px] text-slate-300 leading-relaxed bg-slate-900/60 p-2 rounded-lg border border-slate-800" dir="auto">
                    <span className="font-bold text-amber-300">{isRtl ? "تحليل المحتوى: " : "Content analysis: "}</span>{m.contentFeedback}
                  </p>
                )}
                <p className="text-[10px] text-cyan-300 font-bold flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  <span>{bodyLanguageTip}</span>
                </p>
              </div>

            </div>

          </div>
        )}

      </div>
    );
  }

  // -------------------------------------------------------------
  // VIEW 3: POST-SESSION DEBRIEF REPORT CARD (Scorecard & Verdict)
  // -------------------------------------------------------------
  return (
    <div className="space-y-6 max-w-7xl mx-auto" id="oratory-debrief-view">
      
      {/* Return to Stages Hub Button */}
      {onReturnHome && (
        <div className="flex items-center justify-between bg-white dark:bg-[#1C0A15] p-3.5 rounded-2xl border border-slate-200 dark:border-[#3D1426] shadow-sm">
          <button
            onClick={onReturnHome}
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-black flex items-center gap-2 cursor-pointer transition-all"
            id="oratory-debrief-return-hub-btn"
          >
            <span>{isRtl ? "⬅ العودة إلى بوابة المراحل الرئيسية" : "⬅ Back to Stages Gateway"}</span>
          </button>
          <span className="text-xs font-bold text-[#8A1538] dark:text-amber-300 px-3 py-1 bg-amber-50 dark:bg-amber-950/40 rounded-full border border-amber-200 dark:border-amber-900/40">
            {isRtl ? `المرحلة 2: نتائج التحكيم (${activeSectorConfig.badgeAr})` : `Stage 2: Scorecard (${activeSectorConfig.badgeEn})`}
          </span>
        </div>
      )}

      {/* Celebration Banner */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-br from-[#0F172A] via-[#1E1B4B] to-[#311042] text-white shadow-xl border border-purple-900/30 relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-xs font-bold text-emerald-300">
              <Award className="w-4 h-4" />
              <span>{isRtl ? "اكتملت الجلسة المنبرية بنجاح 🏆" : "Oratory Session Completed"}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black font-serif text-white">
              {isRtl ? "بطاقة تقييم الأداء المنبري والخطابة التنفيذية" : "Executive Oratory & Speech Scorecard"}
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              {isRtl
                ? `تقييم شامل لأداء ${student.nameAr} في ${selectedSpeech.titleAr} وفق معايير قطاع (${activeSectorConfig.badgeAr}).`
                : `Comprehensive evaluation for ${student.nameEn} according to ${activeSectorConfig.badgeEn} benchmarks.`}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs transition-all flex items-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>{isRtl ? "طباعة التقرير" : "Print PDF"}</span>
            </button>
            <button
              onClick={() => setStagePhase("setup")}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-[#D4AF37] to-[#B45309] text-slate-950 font-black text-xs transition-all flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{isRtl ? "جلسة تدريبية جديدة" : "New Practice Session"}</span>
            </button>
          </div>
        </div>
      </div>

      {isGeneratingDebrief ? (
        <div className="bg-white dark:bg-[#1C0A15] rounded-3xl p-12 border border-slate-100 dark:border-[#3D1426] shadow-sm text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-300 flex items-center justify-center mx-auto animate-spin">
            <Sparkles className="w-8 h-8" />
          </div>
          <h3 className="font-bold text-base text-slate-800 dark:text-white">
            {isRtl ? "جاري جمع القياسات النهائية وتقييم الخطاب بالذكاء الاصطناعي..." : "Collecting the final measurements and evaluating the speech with AI..."}
          </h3>
          <p className="text-xs text-slate-400">
            {isRtl ? "يُرسل النص المفرّغ مع قياسات الكاميرا والصوت إلى المقيّم..." : "Sending the transcript with the camera and audio measurements to the evaluator..."}
          </p>
        </div>
      ) : debriefError ? (
        <div className="bg-white dark:bg-[#1C0A15] rounded-3xl p-10 border border-red-200 dark:border-red-900/50 shadow-sm text-center space-y-4" id="oratory-debrief-error">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <h3 className="font-bold text-base text-slate-800 dark:text-white">
            {isRtl ? "تعذّر إعداد تقييم الجلسة" : "The session evaluation couldn't be produced"}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xl mx-auto">{debriefError}</p>
          <div className="flex items-center justify-center gap-2">
            {sessionResult && sessionResult.metrics.transcript.trim() && (
              <button
                onClick={() => requestDebrief(sessionResult)}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-2 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>{isRtl ? "إعادة المحاولة" : "Try again"}</span>
              </button>
            )}
            <button
              onClick={() => setStagePhase("setup")}
              className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-bold text-xs cursor-pointer"
            >
              {isRtl ? "جلسة جديدة" : "New session"}
            </button>
          </div>
        </div>
      ) : debriefData && (
        <div className="space-y-6">
          {debriefData.offline_fallback && (
            <div className="rounded-2xl border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 p-4 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2" id="oratory-offline-notice">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                {isRtl
                  ? "التقييم بالذكاء الاصطناعي غير مفعّل على الخادم، لذا فالدرجات والتعليقات أدناه نص تجريبي وليست تقييماً لهذا الخطاب. أما «قياسات هذه الجلسة» فهي حقيقية."
                  : "AI evaluation isn't configured on the server, so the scores and comments below are sample text – not an assessment of this speech. The figures under “Measured in this session” are real."}
              </span>
            </div>
          )}

          {debriefData.measured && (
            <div className="bg-white dark:bg-[#1C0A15] rounded-2xl p-5 border border-slate-100 dark:border-[#3D1426] shadow-sm space-y-3" id="oratory-measured-metrics">
              <h3 className="text-sm font-black text-slate-800 dark:text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-cyan-600" />
                <span>{isRtl ? "قياسات هذه الجلسة" : "Measured in this session"}</span>
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                {[
                  { label: isRtl ? "المدة" : "Duration", value: formatTimer(debriefData.measured.durationSeconds ?? 0) },
                  { label: isRtl ? "السرعة (ك/د)" : "Pace (WPM)", value: debriefData.measured.wpm !== undefined ? Math.round(debriefData.measured.wpm) : "—" },
                  { label: isRtl ? "كلمات حشو" : "Filler words", value: debriefData.measured.fillerCount ?? "—" },
                  { label: isRtl ? "وقفات بلاغية / تردد" : "Pauses / hesitations", value: debriefData.measured.rhetoricalPauses !== undefined ? `${debriefData.measured.rhetoricalPauses} / ${debriefData.measured.hesitationPauses}` : "—" },
                  { label: isRtl ? "تنوع المفردات" : "Vocabulary diversity", value: debriefData.measured.vocabDiversity !== undefined ? `${Math.round(debriefData.measured.vocabDiversity * 100)}%` : "—" },
                  { label: isRtl ? "التواصل البصري" : "Eye contact", value: pct(debriefData.measured.eyeContactPercent !== undefined ? Math.round(debriefData.measured.eyeContactPercent) : undefined) },
                  { label: isRtl ? "استقامة الوقفة" : "Posture", value: pct(debriefData.measured.postureQuality !== undefined ? Math.round(debriefData.measured.postureQuality) : undefined) },
                  { label: isRtl ? "رصد اليدين" : "Hands detected", value: pct(debriefData.measured.handsVisiblePercent) },
                  { label: isRtl ? "وقت الانحناء" : "Time slouching", value: pct(debriefData.measured.slouchPercent) },
                  { label: isRtl ? "ثبات زائد" : "Too still", value: pct(debriefData.measured.stillPercent) },
                  { label: isRtl ? "إيماءات/دقيقة" : "Gestures/min", value: debriefData.measured.gesturesPerMinute ?? "—" },
                  { label: isRtl ? "النبرة" : "Tone", value: debriefData.measured.liveSentiment ?? "—" },
                ].map((item) => (
                  <div key={item.label} className="rounded-xl bg-slate-50 dark:bg-slate-900/60 p-2.5 border border-slate-100 dark:border-slate-800">
                    <p className="text-[10px] font-bold text-slate-400">{item.label}</p>
                    <p className="text-sm font-black font-mono text-slate-800 dark:text-slate-100 truncate" title={String(item.value)}>{item.value}</p>
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-slate-400">
                {isRtl
                  ? "من النسخ الفوري (Speechmatics) وتحليل الكاميرا (MediaPipe). «—» يعني أنه لم يُقس في هذه الجلسة."
                  : "From live transcription (Speechmatics) and camera analysis (MediaPipe). “—” means it wasn't measured in this session."}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Main Scores & Summary Column */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* 4 Score Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white dark:bg-[#1C0A15] rounded-2xl p-4 border border-slate-100 dark:border-[#3D1426] shadow-sm text-center space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">{isRtl ? "الدرجة الإجمالية" : "Overall Score"}</span>
                <p className="text-2xl font-black text-purple-600 dark:text-purple-400 font-mono">{debriefData.overallScore}%</p>
              </div>

              <div className="bg-white dark:bg-[#1C0A15] rounded-2xl p-4 border border-slate-100 dark:border-[#3D1426] shadow-sm text-center space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">{isRtl ? "مؤشر الحسم واليقين" : "Conviction"}</span>
                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono">{pct(debriefData.convictionScore)}</p>
              </div>

              <div className="bg-white dark:bg-[#1C0A15] rounded-2xl p-4 border border-slate-100 dark:border-[#3D1426] shadow-sm text-center space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">{isRtl ? "التنغيم والنبر الصوتي" : "Vocal Variety"}</span>
                <p className="text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">{debriefData.vocalVarietyScore}%</p>
              </div>

              <div className="bg-white dark:bg-[#1C0A15] rounded-2xl p-4 border border-slate-100 dark:border-[#3D1426] shadow-sm text-center space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">{isRtl ? "بناء الحجة والمنطق" : "Rhetoric"}</span>
                <p className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono">{debriefData.structureAndLogicScore}%</p>
              </div>
            </div>

            {/* Aristotelian Persuasion Triad Breakdown */}
            <div className="bg-white dark:bg-[#1C0A15] rounded-3xl p-6 border border-slate-100 dark:border-[#3D1426] shadow-sm space-y-3">
              <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                  <Scale className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span>{isRtl ? "توازن ثالوث الإقناع الأرسطي (Aristotelian Triad):" : "Aristotelian Rhetorical Triad:"}</span>
                </h3>
                <span className="text-xs font-mono font-bold text-slate-400">Logos • Ethos • Pathos</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div className="p-3 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 space-y-1">
                  <span className="text-[10px] font-black text-blue-700 dark:text-blue-400 uppercase">{isRtl ? "اللوغوس (المنطق والأرقام)" : "Logos (Logic & Data)"}</span>
                  <p className="text-lg font-mono font-black text-blue-600 dark:text-blue-400">{pct(debriefData.triad?.logos)}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{isRtl ? "تماسك البراهين وخلوها من المغالطات" : "Logical soundness and factual evidence"}</p>
                </div>

                <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 space-y-1">
                  <span className="text-[10px] font-black text-emerald-700 dark:text-emerald-400 uppercase">{isRtl ? "الإيثوس (المصداقية والهيبة)" : "Ethos (Credibility & Poise)"}</span>
                  <p className="text-lg font-mono font-black text-emerald-600 dark:text-emerald-400">{pct(debriefData.triad?.ethos)}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{isRtl ? "حضور الواثق ونقاء النطق والوقار" : "Authoritative presence and moral weight"}</p>
                </div>

                <div className="p-3 rounded-2xl bg-pink-50/60 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-900/40 space-y-1">
                  <span className="text-[10px] font-black text-pink-700 dark:text-pink-400 uppercase">{isRtl ? "الباثوس (التأثير العاطفي)" : "Pathos (Emotional Connection)"}</span>
                  <p className="text-lg font-mono font-black text-pink-600 dark:text-pink-400">{pct(debriefData.triad?.pathos)}</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">{isRtl ? "إثارة حماس الجمهور والاتصال الإنساني" : "Audience resonance and inspiring drive"}</p>
                </div>
              </div>
            </div>

            {/* AI Summary Judgement */}
            <div className="bg-white dark:bg-[#1C0A15] rounded-3xl p-6 border border-slate-100 dark:border-[#3D1426] shadow-sm space-y-3">
              <h3 className="font-bold text-sm text-slate-800 dark:text-white flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span>{isRtl ? "التقييم الشامل للمدرب الذكي:" : "AI Oratory Master Assessment:"}</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-serif bg-purple-50/50 dark:bg-purple-950/30 p-4 rounded-2xl border border-purple-100 dark:border-purple-900/40">
                {debriefData.summaryJudgement}
              </p>
            </div>

            {/* Strengths & Action Plan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-white dark:bg-[#1C0A15] rounded-3xl p-5 border border-slate-100 dark:border-[#3D1426] shadow-sm space-y-3">
                <h4 className="font-bold text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>{isRtl ? "أبرز نقاط التميز والبراعة:" : "Key Strengths:"}</span>
                </h4>
                <ul className="space-y-2">
                  {debriefData.strengths?.map((st: string, idx: number) => (
                    <li key={idx} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2 bg-emerald-50/50 dark:bg-emerald-950/30 p-2.5 rounded-xl">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                      <span>{st}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white dark:bg-[#1C0A15] rounded-3xl p-5 border border-slate-100 dark:border-[#3D1426] shadow-sm space-y-3">
                <h4 className="font-bold text-xs text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <span>{isRtl ? "توصيات للتطوير في الخطاب القادم:" : "Actionable Improvement Tips:"}</span>
                </h4>
                <ul className="space-y-2">
                  {debriefData.areasForImprovement?.map((ar: string, idx: number) => (
                    <li key={idx} className="text-xs text-slate-600 dark:text-slate-300 flex items-start gap-2 bg-amber-50/50 dark:bg-amber-950/30 p-2.5 rounded-xl">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                      <span>{ar}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

          </div>

          {/* Side Summary Badges & Telemetry Summary */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-gradient-to-br from-purple-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 shadow-md border border-purple-800/40 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/20 text-yellow-300 flex items-center justify-center mx-auto shadow-inner">
                <Award className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-bold text-purple-300 uppercase tracking-wider">
                  {isRtl ? "الوسام المنبري الممنوح" : "Honorary Badge Earned"}
                </span>
                <h4 className="font-black text-base text-white font-serif">
                  {debriefData.awardedBadge}
                </h4>
              </div>

              <div className="pt-3 border-t border-white/10 flex items-center justify-around text-xs">
                <div>
                  <span className="text-[10px] text-purple-300 block">{isRtl ? "نقاط الخبرة" : "XP Earned"}</span>
                  <span className="font-black text-amber-400 font-mono text-sm">+200 XP</span>
                </div>
                <div>
                  <span className="text-[10px] text-purple-300 block">{isRtl ? "نجوم التميز" : "Stars"}</span>
                  <span className="font-black text-yellow-300 font-mono text-sm">+15 ⭐</span>
                </div>
              </div>
            </div>

            <VowelSummaryCard analysis={sessionResult?.audio?.vowel_analysis} isRtl={isRtl} />

            {/* Quick Summary Telemetry Card */}
            <div className="bg-white dark:bg-[#1C0A15] rounded-3xl p-5 border border-slate-100 dark:border-[#3D1426] shadow-sm space-y-3">
              <h4 className="text-xs font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <Activity className="w-4 h-4 text-cyan-500" />
                <span>{isRtl ? "ملخص المقاييس الحيوية للجلسة:" : "Biometric Session Summary:"}</span>
              </h4>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60">
                  <span className="text-slate-500">{isRtl ? "الوقفات البلاغية (0.8 - 2.0 ثانية):" : "Rhetorical Pauses:"}</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{debriefData.rhetoricalPauses ?? "—"}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60">
                  <span className="text-slate-500">{isRtl ? "مؤشر الإيجاز ومباشرة الفكرة:" : "Brevity Index:"}</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{pct(debriefData.brevityScore)}</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-900/60">
                  <span className="text-slate-500">{isRtl ? "تغطية زوايا الجمهور (360°):" : "Audience Sweep:"}</span>
                  <span className="font-mono font-bold text-purple-600 dark:text-purple-400">{isRtl ? "توزيع ثلاثي متزن" : "Balanced 3-Zone"}</span>
                </div>
              </div>

              <button
                onClick={() => setStagePhase("setup")}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#8A1538] to-[#5C0E25] hover:from-[#A01B42] text-white font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md mt-2"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{isRtl ? "تكرار المحاولة في قطاع آخر" : "Practice Another Sector"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Full transcript with the mistakes highlighted */}
        {sessionResult && (
          <TranscriptReport
            isRtl={isRtl}
            transcript={sessionResult.metrics.transcript}
            segments={sessionResult.metrics.vowelSegments}
            fillers={[
              ...Object.keys((sessionResult.audio?.filler_breakdown as Record<string, number>) ?? sessionResult.metrics.fillerBreakdown ?? {}),
              ...(language === "ar" ? ["يعني", "اه", "امم", "اممم", "ممم", "إيه"] : ["um", "uh", "erm"]),
            ]}
          />
        )}

        {/* Stage 4 Handoff: Specialized Human Expert Evaluation */}
        <div className="pt-2">
          <ExpertHandoffCard
            onExploreExperts={() => {
              if (onNavigateToExperts) {
                onNavigateToExperts();
              }
            }}
            isRtl={isRtl}
            scorecard={{
              eyeContact: debriefData.measured?.eyeContactPercent,
              posture: debriefData.measured?.postureQuality,
              vocalVariety: debriefData.vocalVarietyScore,
              structureAndLogic: debriefData.structureAndLogicScore,
              conviction: debriefData.convictionScore,
              overallScore: debriefData.overallScore
            }}
            studentGrade={student.grade}
          />
        </div>

      </div>
    )}
    </div>
  );
}
