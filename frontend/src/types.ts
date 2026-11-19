export type UserRole = "student" | "teacher" | "admin" | "ministry_admin";

export interface UserSession {
  id: string;
  nameAr: string;
  nameEn: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  schoolNameAr: string;
  schoolNameEn: string;
  studentProfileId?: string;
  grade?: string;
  section?: string; // e.g. "الشعبة (ب)"
  assignedGrades?: string[];
  subjectAr?: string;
  titleAr?: string;
}

export interface TalentNominationRecord {
  id: string;
  studentId: string;
  nameAr: string;
  nameEn: string;
  grade: string;
  section: string;
  schoolNameAr: string;
  oratoryScore: number;
  bodyLanguageScore: number;
  eyeContactScore: number;
  wpm: number;
  vocalPitchScore: number;
  overallMastery: number;
  tier: "Tier 1 - الموهبة الذهبية الأولى" | "Tier 2 - الموهبة الواعدة";
  nominationStatus: "مكتمل الترشيح" | "بانتظار المقابلة الوزارية" | "معتمد للانتداب الوطني";
  speechTitle: string;
  aiNotes: string;
  dateNominated: string;
}

export interface Measurement {
  id: string;
  code?: string; // e.g. "المعيار 1.1"
  nameAr: string;
  nameEn: string;
  category: "literature" | "grammar" | "vocabulary" | "pronunciation";
  competencyAr?: string; // e.g. "التواصل", "التفكير الناقد", "التقصي والبحث"
  competencyEn?: string;
  indicatorCode?: string; // e.g. "مؤشر 1.1.2"
  indicatorAr?: string; // e.g. "ينطق الحركات الطويلة والقصيرة بنبرة تمييزية صحيحة"
  indicatorEn?: string;
  samplePhrases?: string[]; // alternative practice sentences generated for this indicator
  score: number; // 0 to 100
  targetPhrase?: string; // custom word or phrase to match this measurement
  attemptsCount?: number;
  lastPracticed?: string;
}

export interface Badge {
  id: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  category: "accuracy" | "streak" | "mastery" | "explorer";
}

export interface StudentProfile {
  id: string;
  nameAr: string;
  nameEn: string;
  grade: string;
  section?: string;
  schoolNameAr?: string;
  schoolNameEn?: string;
  avatarUrl?: string;
  avatar?: string;
  xp: number;
  level: number;
  streakDays: number;
  streak?: number;
  coins?: number; // Learning Stars / Coins
  lastBonusClaimDate?: string;
  badges: Badge[];
  measurements: Measurement[];
  history: ReadingAttempt[];
  attempts?: ReadingAttempt[];
}

export type PracticeMode = "speech" | "multiple_choice" | "word_assembly" | "fill_blank" | "arcade";

export interface QuestionOption {
  textAr: string;
  textEn: string;
  isCorrect: boolean;
}

export interface PracticeQuestion {
  id: string;
  type: "multiple_choice" | "word_assembly" | "fill_blank";
  promptAr: string;
  promptEn: string;
  indicatorCode?: string;
  standardCode?: string;
  // For multiple_choice
  options?: QuestionOption[];
  // For word_assembly
  targetSentenceAr?: string;
  targetSentenceEn?: string;
  shuffledWordsAr?: string[];
  shuffledWordsEn?: string[];
  // For fill_blank
  sentenceWithBlankAr?: string;
  sentenceWithBlankEn?: string;
  missingWordAr?: string;
  missingWordEn?: string;
  blankOptionsAr?: string[];
  blankOptionsEn?: string[];
  // Explanation
  explanationAr: string;
  explanationEn: string;
  xpReward: number;
  coinsReward: number;
}

export interface RewardCelebration {
  titleAr: string;
  titleEn: string;
  xpEarned: number;
  coinsEarned: number;
  badgeUnlocked?: Badge;
  leveledUp?: boolean;
  newLevel?: number;
}

export interface ReadingAttempt {
  id: string;
  timestamp: string;
  subject: string;
  textSpoken: string;
  targetText: string;
  accuracyScore: number; // local match
  aiScore?: number; // gemini score
  language: "ar" | "en";
  aiFeedback?: string;
  corrections?: WordCorrection[];
  recommendations?: string[];
  measurementId?: string; // links to the specific tested measurement
  audioBlobUrl?: string; // audio recording for this attempt
  audioBase64?: string; // base64 audio data for multimodal AI evaluation
  evaluationMethod?: "multimodal_audio" | "linguistic_transcript" | "hybrid" | "vowelized_asr";
  grammaticalSummary?: string;
  asrTranscript?: string; // what the vowelized ASR heard (with short vowels), when that engine was used
}

export interface WordCorrection {
  word: string;
  spokenWord?: string;
  status: "correct" | "mispronounced" | "omitted";
  note: string;
  errorReason?: string;
  i_rab?: string; // detailed Arabic grammatical role (الموقع الإعرابي والعلامة)
  phoneticRule?: string; // e.g. مخارج الحروف، تفخيم، ترقيق، همزة وصل
}

export interface AppSettings {
  grade: string;
  language: "ar" | "en";
  darkMode?: boolean;
  measurementsList: { id: string; nameAr: string; nameEn: string; category: string }[];
  arabicTargetText: string;
  englishTargetText: string;
}

export interface AIReportCard {
  summary: string;
  strengths: string[];
  actionPlan: {
    subject: string;
    advice: string;
  }[];
  closingMessage: string;
}

export type { AcademicExpert } from "./data/expertsData";
