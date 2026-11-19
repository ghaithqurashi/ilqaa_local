import React, { useState, useEffect } from "react";
import { 
  BarChart3, 
  Mic, 
  FileText, 
  Settings as SettingsIcon, 
  Sparkles, 
  Languages, 
  User,
  GraduationCap,
  Video,
  Presentation,
  Flame,
  Award,
  Home as HomeIcon,
  Compass,
  Moon,
  Sun,
  Menu,
  X,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  Layers,
  Eye,
  RotateCcw,
  Trash2
} from "lucide-react";
import { ResetAllModal } from "./components/ResetAllModal";
import { HomeLaunchpad } from "./components/HomeLaunchpad";
import { DashboardTab } from "./components/DashboardTab";
import { VoicePracticeTab } from "./components/VoicePracticeTab";
import { OratoryStageTab } from "./components/OratoryStageTab";
import { MinistryPresentationModal } from "./components/MinistryPresentationModal";
import { IlqaaLogo } from "./components/IlqaaLogo";
import { MinistryLogo } from "./components/MinistryLogo";
import { LandingPage } from "./components/LandingPage";
import { IlqaaMainHome } from "./components/IlqaaMainHome";
import { TeacherDashboard } from "./components/TeacherDashboard";
import { MinistryTalentHub } from "./components/MinistryTalentHub";
import { StudentProfileView } from "./components/StudentProfileView";
import { AcademicReportsTab } from "./components/AcademicReportsTab";
import { SettingsTab } from "./components/SettingsTab";
import { StudentSelectorModal } from "./components/StudentSelectorModal";
import { ExpertsHubTab } from "./components/experts/ExpertsHubTab";
import { StudentProfile, AppSettings, ReadingAttempt, Measurement, Badge, UserSession } from "./types";
import { translations } from "./translations";
import { ALL_INITIAL_STUDENTS, DEFAULT_BADGES } from "./data/initialData";
import { DEMO_USERS } from "./data/userSessions";

// Definition of Grade Themes & Styling configurations with Qatari National Maroon & Gold Palette
export const GRADE_THEMES: Record<string, any> = {
  "KG": {
    nameAr: "الروضة",
    nameEn: "Kindergarten",
    bg: "bg-[#FDFBF7]",
    cardBg: "bg-white",
    border: "border-amber-200",
    textPrimary: "text-[#8A1538]",
    bgPrimary: "bg-[#8A1538]",
    bgPrimaryHover: "hover:bg-[#5C0E25]",
    borderPrimary: "border-[#8A1538]/30",
    textSecondary: "text-[#8A1538]/80",
    bgLight: "bg-[#8A1538]/5",
    textLight: "text-[#8A1538]",
    badge: "bg-[#8A1538]/10 text-[#8A1538]",
    accent: "bg-[#D4AF37] hover:bg-[#B89628]",
    headerGradient: "from-[#8A1538] via-[#A01B42] to-[#5C0E25]",
    sidebarActive: "bg-[#8A1538] text-white",
    glow: "shadow-[#8A1538]/10",
    fontClass: "font-sans",
    logoBg: "bg-[#8A1538]"
  },
  "Grade 1": {
    nameAr: "الصف الأول",
    nameEn: "Grade 1",
    bg: "bg-[#FDFBF7]",
    cardBg: "bg-white",
    border: "border-amber-200",
    textPrimary: "text-[#8A1538]",
    bgPrimary: "bg-[#8A1538]",
    bgPrimaryHover: "hover:bg-[#5C0E25]",
    borderPrimary: "border-[#8A1538]/30",
    textSecondary: "text-[#8A1538]/80",
    bgLight: "bg-[#8A1538]/5",
    textLight: "text-[#8A1538]",
    badge: "bg-[#8A1538]/10 text-[#8A1538]",
    accent: "bg-[#D4AF37] hover:bg-[#B89628]",
    headerGradient: "from-[#8A1538] via-[#A01B42] to-[#5C0E25]",
    sidebarActive: "bg-[#8A1538] text-white",
    glow: "shadow-[#8A1538]/10",
    fontClass: "font-sans",
    logoBg: "bg-[#8A1538]"
  },
  "Grade 2": {
    nameAr: "الصف الثاني",
    nameEn: "Grade 2",
    bg: "bg-[#FDFBF7]",
    cardBg: "bg-white",
    border: "border-amber-200",
    textPrimary: "text-[#8A1538]",
    bgPrimary: "bg-[#8A1538]",
    bgPrimaryHover: "hover:bg-[#5C0E25]",
    borderPrimary: "border-[#8A1538]/30",
    textSecondary: "text-[#8A1538]/80",
    bgLight: "bg-[#8A1538]/5",
    textLight: "text-[#8A1538]",
    badge: "bg-[#8A1538]/10 text-[#8A1538]",
    accent: "bg-[#D4AF37] hover:bg-[#B89628]",
    headerGradient: "from-[#8A1538] via-[#A01B42] to-[#5C0E25]",
    sidebarActive: "bg-[#8A1538] text-white",
    glow: "shadow-[#8A1538]/10",
    fontClass: "font-sans",
    logoBg: "bg-[#8A1538]"
  },
  "Grade 3": {
    nameAr: "الصف الثالث",
    nameEn: "Grade 3",
    bg: "bg-[#FDFBF7]",
    cardBg: "bg-white",
    border: "border-amber-200",
    textPrimary: "text-[#8A1538]",
    bgPrimary: "bg-[#8A1538]",
    bgPrimaryHover: "hover:bg-[#5C0E25]",
    borderPrimary: "border-[#8A1538]/30",
    textSecondary: "text-[#8A1538]/80",
    bgLight: "bg-[#8A1538]/5",
    textLight: "text-[#8A1538]",
    badge: "bg-[#8A1538]/10 text-[#8A1538]",
    accent: "bg-[#D4AF37] hover:bg-[#B89628]",
    headerGradient: "from-[#8A1538] via-[#A01B42] to-[#5C0E25]",
    sidebarActive: "bg-[#8A1538] text-white",
    glow: "shadow-[#8A1538]/10",
    fontClass: "font-sans",
    logoBg: "bg-[#8A1538]"
  },
  "Grade 4": {
    nameAr: "الصف الرابع",
    nameEn: "Grade 4",
    bg: "bg-[#FDFBF7]",
    cardBg: "bg-white",
    border: "border-amber-200",
    textPrimary: "text-[#8A1538]",
    bgPrimary: "bg-[#8A1538]",
    bgPrimaryHover: "hover:bg-[#5C0E25]",
    borderPrimary: "border-[#8A1538]/30",
    textSecondary: "text-[#8A1538]/80",
    bgLight: "bg-[#8A1538]/5",
    textLight: "text-[#8A1538]",
    badge: "bg-[#8A1538]/10 text-[#8A1538]",
    accent: "bg-[#D4AF37] hover:bg-[#B89628]",
    headerGradient: "from-[#8A1538] via-[#A01B42] to-[#5C0E25]",
    sidebarActive: "bg-[#8A1538] text-white",
    glow: "shadow-[#8A1538]/10",
    fontClass: "font-sans",
    logoBg: "bg-[#8A1538]"
  },
  "Grade 5": {
    nameAr: "الصف الخامس",
    nameEn: "Grade 5",
    bg: "bg-[#FDFBF7]",
    cardBg: "bg-white",
    border: "border-[#8A1538]/20",
    textPrimary: "text-[#8A1538]",
    bgPrimary: "bg-[#8A1538]",
    bgPrimaryHover: "hover:bg-[#5C0E25]",
    borderPrimary: "border-[#8A1538]/30",
    textSecondary: "text-[#8A1538]/80",
    bgLight: "bg-[#8A1538]/5",
    textLight: "text-[#8A1538]",
    badge: "bg-[#8A1538]/10 text-[#8A1538] font-bold",
    accent: "bg-[#D4AF37] hover:bg-[#B89628]",
    headerGradient: "from-[#8A1538] via-[#A01B42] to-[#5C0E25]",
    sidebarActive: "bg-[#8A1538] text-white",
    glow: "shadow-[#8A1538]/10",
    fontClass: "font-sans",
    logoBg: "bg-[#8A1538]"
  },
  "Grade 6": {
    nameAr: "الصف السادس",
    nameEn: "Grade 6",
    bg: "bg-[#FDFBF7]",
    cardBg: "bg-white",
    border: "border-amber-200",
    textPrimary: "text-[#8A1538]",
    bgPrimary: "bg-[#8A1538]",
    bgPrimaryHover: "hover:bg-[#5C0E25]",
    borderPrimary: "border-[#8A1538]/30",
    textSecondary: "text-[#8A1538]/80",
    bgLight: "bg-[#8A1538]/5",
    textLight: "text-[#8A1538]",
    badge: "bg-[#8A1538]/10 text-[#8A1538]",
    accent: "bg-[#D4AF37] hover:bg-[#B89628]",
    headerGradient: "from-[#8A1538] via-[#A01B42] to-[#5C0E25]",
    sidebarActive: "bg-[#8A1538] text-white",
    glow: "shadow-[#8A1538]/10",
    fontClass: "font-sans",
    logoBg: "bg-[#8A1538]"
  },
  "Grade 7": {
    nameAr: "الصف السابع",
    nameEn: "Grade 7",
    bg: "bg-[#FDFBF7]",
    cardBg: "bg-white",
    border: "border-amber-200",
    textPrimary: "text-[#8A1538]",
    bgPrimary: "bg-[#8A1538]",
    bgPrimaryHover: "hover:bg-[#5C0E25]",
    borderPrimary: "border-[#8A1538]/30",
    textSecondary: "text-[#8A1538]/80",
    bgLight: "bg-[#8A1538]/5",
    textLight: "text-[#8A1538]",
    badge: "bg-[#8A1538]/10 text-[#8A1538]",
    accent: "bg-[#D4AF37] hover:bg-[#B89628]",
    headerGradient: "from-[#8A1538] via-[#A01B42] to-[#5C0E25]",
    sidebarActive: "bg-[#8A1538] text-white",
    glow: "shadow-[#8A1538]/10",
    fontClass: "font-sans",
    logoBg: "bg-[#8A1538]"
  },
  "Grade 8": {
    nameAr: "الصف الثامن",
    nameEn: "Grade 8",
    bg: "bg-[#FDFBF7]",
    cardBg: "bg-white",
    border: "border-amber-200",
    textPrimary: "text-[#8A1538]",
    bgPrimary: "bg-[#8A1538]",
    bgPrimaryHover: "hover:bg-[#5C0E25]",
    borderPrimary: "border-[#8A1538]/30",
    textSecondary: "text-[#8A1538]/80",
    bgLight: "bg-[#8A1538]/5",
    textLight: "text-[#8A1538]",
    badge: "bg-[#8A1538]/10 text-[#8A1538]",
    accent: "bg-[#D4AF37] hover:bg-[#B89628]",
    headerGradient: "from-[#8A1538] via-[#A01B42] to-[#5C0E25]",
    sidebarActive: "bg-[#8A1538] text-white",
    glow: "shadow-[#8A1538]/10",
    fontClass: "font-sans",
    logoBg: "bg-[#8A1538]"
  },
  "Grade 9": {
    nameAr: "الصف التاسع",
    nameEn: "Grade 9",
    bg: "bg-[#FDFBF7]",
    cardBg: "bg-white",
    border: "border-amber-200",
    textPrimary: "text-[#8A1538]",
    bgPrimary: "bg-[#8A1538]",
    bgPrimaryHover: "hover:bg-[#5C0E25]",
    borderPrimary: "border-[#8A1538]/30",
    textSecondary: "text-[#8A1538]/80",
    bgLight: "bg-[#8A1538]/5",
    textLight: "text-[#8A1538]",
    badge: "bg-[#8A1538]/10 text-[#8A1538]",
    accent: "bg-[#D4AF37] hover:bg-[#B89628]",
    headerGradient: "from-[#8A1538] via-[#A01B42] to-[#5C0E25]",
    sidebarActive: "bg-[#8A1538] text-white",
    glow: "shadow-[#8A1538]/10",
    fontClass: "font-serif",
    logoBg: "bg-[#8A1538]"
  },
  "Grade 10": {
    nameAr: "الصف العاشر",
    nameEn: "Grade 10",
    bg: "bg-[#FDFBF7]",
    cardBg: "bg-white",
    border: "border-stone-200",
    textPrimary: "text-[#8A1538]",
    bgPrimary: "bg-[#8A1538]",
    bgPrimaryHover: "hover:bg-[#5C0E25]",
    borderPrimary: "border-[#8A1538]/30",
    textSecondary: "text-[#8A1538]/80",
    bgLight: "bg-[#8A1538]/5",
    textLight: "text-[#8A1538]",
    badge: "bg-[#8A1538]/10 text-[#8A1538]",
    accent: "bg-[#D4AF37] hover:bg-[#B89628]",
    headerGradient: "from-[#8A1538] via-[#A01B42] to-[#5C0E25]",
    sidebarActive: "bg-[#8A1538] text-white",
    glow: "shadow-[#8A1538]/10",
    fontClass: "font-serif",
    logoBg: "bg-[#8A1538]"
  },
  "Grade 11": {
    nameAr: "الصف الحادي عشر",
    nameEn: "Grade 11",
    bg: "bg-[#FDFBF7]",
    cardBg: "bg-white",
    border: "border-slate-300",
    textPrimary: "text-[#8A1538]",
    bgPrimary: "bg-[#8A1538]",
    bgPrimaryHover: "hover:bg-[#5C0E25]",
    borderPrimary: "border-[#8A1538]/30",
    textSecondary: "text-[#8A1538]/80",
    bgLight: "bg-[#8A1538]/5",
    textLight: "text-[#8A1538]",
    badge: "bg-[#8A1538]/10 text-[#8A1538]",
    accent: "bg-[#D4AF37] hover:bg-[#B89628]",
    headerGradient: "from-[#8A1538] via-[#A01B42] to-[#5C0E25]",
    sidebarActive: "bg-[#8A1538] text-white",
    glow: "shadow-[#8A1538]/10",
    fontClass: "font-serif",
    logoBg: "bg-[#8A1538]"
  },
  "Grade 12": {
    nameAr: "الصف الثاني عشر (الشهادة الثانوية)",
    nameEn: "Grade 12 (High School)",
    bg: "bg-[#FDFBF7]",
    cardBg: "bg-white",
    border: "border-amber-300",
    textPrimary: "text-[#8A1538]",
    bgPrimary: "bg-[#8A1538]",
    bgPrimaryHover: "hover:bg-[#5C0E25]",
    borderPrimary: "border-[#8A1538]/30",
    textSecondary: "text-[#8A1538]/80",
    bgLight: "bg-[#8A1538]/5",
    textLight: "text-[#8A1538]",
    badge: "bg-[#8A1538]/10 text-[#8A1538] font-bold",
    accent: "bg-[#D4AF37] hover:bg-[#B89628]",
    headerGradient: "from-[#8A1538] via-[#A01B42] to-[#5C0E25]",
    sidebarActive: "bg-[#8A1538] text-white",
    glow: "shadow-[#8A1538]/10",
    fontClass: "font-serif",
    logoBg: "bg-[#8A1538]"
  }
};




// Comprehensive Student dataset corresponding to ALL Qatari School Grades (KG to Grade 12) with full MoEHE Indicators
const INITIAL_STUDENTS: StudentProfile[] = ALL_INITIAL_STUDENTS;

const DEFAULT_SETTINGS: AppSettings = {
  grade: "Grade 5",
  language: "ar",
  arabicTargetText: "الْعِلْمُ نُورٌ وَالْجَهْلُ ظَلَامٌ، وَيَسْعَى الطَّالِبُ الْمُجْتَهِدُ لِتَحْصِيلِ الْمَعْرِفَةِ لِيَبْنِيَ مُسْتَقْبَلَ أُمَّتِهِ.",
  englishTargetText: "Learning is a lifelong journey that broadens our horizons and empowers us to build a better future.",
  measurementsList: [
    { id: "g5-m1", nameAr: "تعرف الأخطاء الإملائية في الكلمات المكتوبة بنفسه", nameEn: "Identifying Spelling Errors", category: "pronunciation" },
    { id: "g5-m2", nameAr: "تهجئة الكلمات الجديدة باستخدام الاستراتيجيات", nameEn: "Spelling New Words", category: "pronunciation" },
    { id: "g5-m3", nameAr: "تهجئة الكلمات المنونة بشكل صحيح", nameEn: "Tanween Spelling & Pronunciation", category: "pronunciation" }
  ]
};

export type ActiveTab = "home" | "dashboard" | "practice" | "oratory" | "reports" | "settings" | "teacher_dashboard" | "talent_hub" | "profile" | "experts";

export default function App() {
  // 1. User Authentication Session State
  const [userSession, setUserSession] = useState<UserSession | null>(() => {
    const saved = localStorage.getItem("ilqaa_user_session");
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>(() => {
    const saved = localStorage.getItem("ilqaa_user_session");
    if (saved) {
      try {
        const session = JSON.parse(saved) as UserSession;
        if (session.role === "teacher") return "teacher_dashboard";
        if (session.role === "ministry_admin" || session.role === "admin") return "talent_hub";
      } catch (e) {}
    }
    return "home";
  });

  const [selectedMeasurementId, setSelectedMeasurementId] = useState<string | null>(null);
  const [isPresentationOpen, setIsPresentationOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  // Portal Mode: "main_ilqaa" (ilqaa.ai with market segments) vs "academy" (ILQAA Academy & Qatar MoEHE Portal)
  const [portalMode, setPortalMode] = useState<"main_ilqaa" | "academy">(() => {
    const saved = localStorage.getItem("ilqaa_portal_mode");
    return saved === "academy" ? "academy" : "main_ilqaa";
  });

  const handleSelectAcademy = () => {
    setPortalMode("academy");
    localStorage.setItem("ilqaa_portal_mode", "academy");
  };

  const handleBackToMainIlqaa = () => {
    setPortalMode("main_ilqaa");
    localStorage.setItem("ilqaa_portal_mode", "main_ilqaa");
  };

  const handleNavigateToPractice = (measurementId?: string) => {
    if (measurementId) {
      setSelectedMeasurementId(measurementId);
    }
    setActiveTab("practice");
    setIsMobileMenuOpen(false);
  };

  const [students, setStudents] = useState<StudentProfile[]>(() => {
    const saved = localStorage.getItem("portal_students");
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as StudentProfile[];
        const requiredGrades = ["KG", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9", "Grade 10", "Grade 11", "Grade 12"];
        const hasAllGrades = requiredGrades.every((gKey) => parsed.some((s) => s.grade === gKey));
        const isRichDataset = parsed.length >= 13 && parsed.some(s => s.measurements.length >= 6);
        if (hasAllGrades && isRichDataset) {
          return parsed;
        }
      } catch (e) {
        console.error("Failed to parse saved students:", e);
      }
    }
    return ALL_INITIAL_STUDENTS;
  });

  const handleAddStudent = (newStudent: StudentProfile) => {
    setStudents(prev => [...prev, newStudent]);
  };

  const handleAddMeasurement = (studentId: string, newMeasurement: Measurement) => {
    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        return {
          ...s,
          measurements: [newMeasurement, ...s.measurements]
        };
      }
      return s;
    }));
  };

  const [activeStudentId, setActiveStudentId] = useState<string>(() => {
    const savedStudentId = localStorage.getItem("ilqaa_active_student_id");
    if (savedStudentId && ALL_INITIAL_STUDENTS.some(s => s.id === savedStudentId)) return savedStudentId;
    if (userSession && userSession.studentProfileId) {
      return userSession.studentProfileId;
    }
    return "student-g6-1";
  });

  const [isStudentSelectorOpen, setIsStudentSelectorOpen] = useState<boolean>(false);

  const handleSelectStudentProfile = (studentId: string) => {
    const selected = students.find(s => s.id === studentId);
    if (!selected) return;

    setActiveStudentId(studentId);
    localStorage.setItem("ilqaa_active_student_id", studentId);

    // Synchronize settings grade with selected student's grade
    setSettings(prev => ({
      ...prev,
      grade: selected.grade
    }));

    // Create / update the active student user session
    const updatedSession: UserSession = {
      id: `user-${selected.id}`,
      email: `${selected.id}@education.qa`,
      nameAr: selected.nameAr,
      nameEn: selected.nameEn,
      role: "student",
      grade: selected.grade,
      schoolNameAr: selected.schoolNameAr || "مدرسة قطر الابتدائية للبنين",
      schoolNameEn: selected.schoolNameEn || "Qatar School",
      section: selected.section || "شعبة 1",
      studentProfileId: selected.id
    };

    setUserSession(updatedSession);
    localStorage.setItem("ilqaa_user_session", JSON.stringify(updatedSession));
    setPortalMode("academy");
    setIsStudentSelectorOpen(false);
    showToast(isRtl ? `تم الدخول كطالب: ${selected.nameAr} (${GRADE_THEMES[selected.grade]?.nameAr || selected.grade})` : `Selected student: ${selected.nameEn}`);
  };

  const [settings, setSettings] = useState<AppSettings>(() => {
    const saved = localStorage.getItem("portal_settings");
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  // Dark Mode / Night Vision state (Default enabled per user request)
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem("ilqaa_dark_mode");
    if (saved !== null) {
      return saved === "true";
    }
    return true; // Night vision mode active by default
  });

  useEffect(() => {
    localStorage.setItem("ilqaa_dark_mode", String(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
    showToast(
      isDarkMode 
        ? (settings.language === "ar" ? "تم التحويل إلى الوضع النهاري ☀️" : "Switched to Light Day Mode ☀️")
        : (settings.language === "ar" ? "تم تفعيل وضع الرؤية الليلية الملكي 🌙" : "Night Vision Mode Activated 🌙")
    );
  };

  // Synchronize with local storage
  useEffect(() => {
    localStorage.setItem("portal_students", JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem("portal_settings", JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (userSession) {
      localStorage.setItem("ilqaa_user_session", JSON.stringify(userSession));
    } else {
      localStorage.removeItem("ilqaa_user_session");
    }
  }, [userSession]);

  const activeStudent = students.find((s) => s.id === activeStudentId) || students.find((s) => s.grade === userSession?.grade) || students[0] || ALL_INITIAL_STUDENTS[0];
  const dict = translations[settings.language] || translations.ar;
  const isRtl = settings.language === "ar";

  // Resolve theme from active student grade dynamically
  const theme = GRADE_THEMES[activeStudent?.grade || "Grade 5"] || GRADE_THEMES["Grade 5"];

  const handleLogin = (session: UserSession) => {
    setUserSession(session);
    if (session.role === "student") {
      // Find matching student profile by ID or grade
      const match = students.find(s => s.id === session.studentProfileId || s.grade === session.grade);
      if (match) {
        setActiveStudentId(match.id);
      }
      setActiveTab("home");
    } else if (session.role === "teacher") {
      setActiveTab("teacher_dashboard");
    } else if (session.role === "ministry_admin" || session.role === "admin") {
      setActiveTab("talent_hub");
    } else {
      setActiveTab("home");
    }
    showToast(isRtl ? `مرحباً بك ${session.nameAr}` : `Welcome, ${session.nameEn}`);
  };

  const handleLogout = () => {
    setUserSession(null);
    localStorage.removeItem("ilqaa_user_session");
    setIsMobileMenuOpen(false);
    showToast(isRtl ? "تم تسجيل الخروج بنجاح" : "Logged out successfully");
  };

  // Handle adding speech practice attempt and updating that specific measurement score
  const handleAddAttempt = (attempt: ReadingAttempt) => {
    const updatedStudents = students.map((s) => {
      if (s.id !== activeStudent.id) return s;

      const filteredHistory = s.history.filter((h) => h.id !== attempt.id);
      const newHistory = [attempt, ...filteredHistory];

      // Update specific measurement score if linked
      const updatedMeasurements = s.measurements.map((m) => {
        if (attempt.measurementId && m.id === attempt.measurementId) {
          return { ...m, score: attempt.aiScore || attempt.accuracyScore };
        }
        return m;
      });

      return {
        ...s,
        history: newHistory,
        measurements: updatedMeasurements
      };
    });

    setStudents(updatedStudents);
  };

  // Handle rewards & gamification updates
  const handleEarnReward = (xp: number, coins: number) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== activeStudent.id) return s;
        const newXp = s.xp + xp;
        const newCoins = (s.coins || 100) + coins;
        const newLevel = Math.floor(newXp / 250) + 1;
        return {
          ...s,
          xp: newXp,
          coins: newCoins,
          level: Math.max(s.level, newLevel)
        };
      })
    );
  };

  const handleClaimDailyBonus = () => {
    const today = new Date().toISOString().split("T")[0];
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== activeStudent.id) return s;
        const newXp = s.xp + 50;
        const newCoins = (s.coins || 100) + 15;
        const newLevel = Math.floor(newXp / 250) + 1;
        return {
          ...s,
          xp: newXp,
          coins: newCoins,
          level: Math.max(s.level, newLevel),
          lastBonusClaimDate: today
        };
      })
    );
  };

  const handleUpdateMeasurementScore = (measurementId: string, score: number) => {
    setStudents((prev) =>
      prev.map((s) => {
        if (s.id !== activeStudent.id) return s;
        return {
          ...s,
          measurements: s.measurements.map((m) =>
            m.id === measurementId ? { ...m, score: Math.max(m.score, score) } : m
          )
        };
      })
    );
  };

  const handleAdvanceGrade = () => {
    const gradeOrder = ["KG", "Grade 2", "Grade 5", "Grade 8", "Grade 10"];
    const currentIndex = gradeOrder.indexOf(activeStudent.grade);
    if (currentIndex !== -1 && currentIndex < gradeOrder.length - 1) {
      const nextGrade = gradeOrder[currentIndex + 1];
      const nextStudent = students.find((s) => s.grade === nextGrade);
      if (nextStudent) {
        setActiveStudentId(nextStudent.id);
      }
    }
  };

  // Settings Save Handler - updates target phrases dynamically without erasing rich curriculum indicators
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleSaveSettings = (newSettings: AppSettings) => {
    setSettings(newSettings);

    // Update students without destroying their rich curriculum metadata
    setStudents(prevStudents => prevStudents.map(s => {
      if (s.id === activeStudent.id) {
        return {
          ...s,
          grade: newSettings.grade || s.grade
        };
      }
      return s;
    }));

    showToast(newSettings.language === "ar" ? "تم حفظ الإعدادات بنجاح! ✨" : "Settings saved successfully! ✨");
  };

  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);

  // Reset current student data cleanly
  const handleResetCurrentStudent = () => {
    const initialMatch = ALL_INITIAL_STUDENTS.find(s => s.id === activeStudent.id) || ALL_INITIAL_STUDENTS[0];
    setStudents(prev => prev.map(s => {
      if (s.id === activeStudent.id) {
        return {
          ...s,
          xp: 50,
          coins: 10,
          level: 1,
          streakDays: 1,
          totalExercisesCompleted: 0,
          recentAttempts: [],
          measurements: initialMatch.measurements.map(m => ({ ...m, score: 0 }))
        };
      }
      return s;
    }));
    
    // Clear student attempts cache
    try {
      localStorage.removeItem(`student_attempts_${activeStudent.id}`);
      localStorage.removeItem("ilqaa_stage_transcript");
    } catch (e) {}

    showToast(isRtl ? `تم تصفير كافة إجابات وسجلات الطالب (${activeStudent.nameAr}) بنجاح! 🔄` : `Reset completed for student ${activeStudent.nameEn}! 🔄`);
  };

  // Factory reset entire platform
  const handleResetEntirePlatform = () => {
    setSettings(DEFAULT_SETTINGS);
    setStudents(ALL_INITIAL_STUDENTS.map(s => ({
      ...s,
      xp: 50,
      coins: 10,
      level: 1,
      streakDays: 1,
      totalExercisesCompleted: 0,
      recentAttempts: [],
      measurements: s.measurements.map(m => ({ ...m, score: 0 }))
    })));
    setActiveStudentId("student-g6-1");
    try {
      localStorage.removeItem("portal_settings");
      localStorage.removeItem("portal_students");
      localStorage.removeItem("ilqaa_active_student_id");
      localStorage.removeItem("ilqaa_recent_practice_attempts");
      localStorage.removeItem("ilqaa_stage_transcript");
    } catch (e) {}
    showToast(isRtl ? "تم التصفير الشامل لكافة الطلاب والمعايير والذاكرة بنجاح! 🔄" : "Factory reset completed! All students and stage data cleared 🔄");
  };

  // Revert portal values to defaults safely
  const handleResetDefaults = () => {
    handleResetEntirePlatform();
  };

  // Custom function to update specific student measurements targetPhrase from Settings tab
  const handleUpdateStudentMeasurements = (studentId: string, updatedMeasurements: Measurement[]) => {
    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        return {
          ...s,
          measurements: updatedMeasurements
        };
      }
      return s;
    }));
    showToast(settings.language === "ar" ? "تم تحديث معايير الطالب بنجاح! ✅" : "Student indicators updated successfully! ✅");
  };

  // If user is not logged in, render either ilqaa.ai main home or the dedicated ILQAA Academy portal
  if (!userSession) {
    if (portalMode === "main_ilqaa") {
      return (
        <div className={`min-h-screen ${isDarkMode ? "dark bg-[#070205]" : "bg-[#FDFBF7]"}`} id="app-ilqaa-global-root">
          <IlqaaMainHome
            onEnterAcademy={handleSelectAcademy}
            onOpenPitchDeck={() => setIsPresentationOpen(true)}
            isDarkMode={isDarkMode}
          />
          <MinistryPresentationModal
            isOpen={isPresentationOpen}
            onClose={() => setIsPresentationOpen(false)}
            onNavigateToTab={(tabKey) => {
              setIsPresentationOpen(false);
              handleSelectAcademy();
            }}
            isRtl={isRtl}
          />
        </div>
      );
    }

    return (
      <div className={`min-h-screen ${isDarkMode ? "dark bg-[#0A0306]" : "bg-[#FDFBF7]"}`} id="app-landing-root">
        <LandingPage
          onLogin={handleLogin}
          isRtl={isRtl}
          isDarkMode={isDarkMode}
          onToggleDarkMode={toggleDarkMode}
          onOpenPitchDeck={() => setIsPresentationOpen(true)}
          onBackToMainHome={handleBackToMainIlqaa}
          onOpenStudentSelector={() => setIsStudentSelectorOpen(true)}
        />
        <MinistryPresentationModal
          isOpen={isPresentationOpen}
          onClose={() => setIsPresentationOpen(false)}
          onNavigateToTab={(tabKey) => {
            setIsPresentationOpen(false);
          }}
          isRtl={isRtl}
        />
        <StudentSelectorModal
          isOpen={isStudentSelectorOpen}
          onClose={() => setIsStudentSelectorOpen(false)}
          students={students}
          activeStudentId={activeStudentId}
          onSelectStudent={handleSelectStudentProfile}
          isRtl={isRtl}
        />
      </div>
    );
  }

  return (
    <div 
      className={`min-h-screen ${isDarkMode ? "dark bg-[#0A0306] text-slate-100" : `${theme.bg} text-slate-800`} flex flex-col font-sans transition-colors duration-300`} 
      dir={isRtl ? "rtl" : "ltr"}
      id="app-root-container"
    >
      {/* Top Navigation Header styled with Qatari National Identity */}
      <header className={`sticky top-0 z-40 bg-gradient-to-r ${theme.headerGradient} text-white shadow-md px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between transition-all duration-500`} id="app-header">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setIsMobileMenuOpen(prev => !prev)}
            className="lg:hidden p-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white transition-all cursor-pointer"
            aria-label="Toggle menu"
            id="mobile-nav-toggle-btn"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <MinistryLogo size="sm" showText={false} textColor="white" />
          <div className="h-6 w-px bg-white/20 hidden sm:block" />
          <IlqaaLogo size="sm" showText={false} className="shrink-0 hidden xs:block" />
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base md:text-lg font-serif font-black text-white tracking-tight leading-tight flex items-center gap-1.5 sm:gap-2 truncate">
              <span 
                className="cursor-pointer truncate" 
                onClick={() => { 
                  if (userSession.role === "teacher") setActiveTab("teacher_dashboard");
                  else if (userSession.role === "ministry_admin" || userSession.role === "admin") setActiveTab("talent_hub");
                  else setActiveTab("home");
                  setIsMobileMenuOpen(false); 
                }}
              >
                {isRtl ? "مَنَصَّةُ إلْقَـــاء" : "ILQAA Platform"}
              </span>
              <span className="text-[9px] sm:text-xs px-1.5 sm:px-2 py-0.5 rounded-full bg-white/20 text-[#FDE68A] font-sans font-bold border border-white/20 whitespace-nowrap shrink-0">
                {isRtl ? "المسرع الوطني 🇶🇦" : "National AI 🇶🇦"}
              </span>
            </h1>
            <p className="text-[10px] text-white/80 font-medium font-sans hidden md:block truncate">
              {userSession.schoolNameAr} • {userSession.section || userSession.grade}
            </p>
          </div>
        </div>

        {/* Right side navigation actions & Active User Identity */}
        <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
          
          {/* User Session Badge */}
          <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-black/25 border border-white/20 text-xs text-white">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <div className="flex flex-col text-start">
              <span className="font-bold text-[11px] text-white leading-tight">
                {isRtl ? userSession.nameAr : userSession.nameEn}
              </span>
              <span className="text-[9px] text-[#FDE68A] font-sans">
                {userSession.role === "student" && (isRtl ? "طالب" : "Student")}
                {userSession.role === "teacher" && (isRtl ? "معلم / منسق" : "Teacher")}
                {userSession.role === "ministry_admin" && (isRtl ? "مسؤول الوزارة" : "MoEHE")}
              </span>
            </div>
          </div>

          {/* Switch Student Button for Quick Grade Switching */}
          <button
            onClick={() => setIsStudentSelectorOpen(true)}
            className="px-2 sm:px-2.5 py-1.5 rounded-xl bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-amber-200 border border-[#D4AF37]/40 text-xs font-bold font-sans transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="تبديل الطالب واختيار مرحلة دراسية أخرى"
            id="top-switch-student-btn"
          >
            <GraduationCap className="w-3.5 h-3.5 text-[#FDE68A]" />
            <span className="hidden md:inline">{isRtl ? "تبديل الطالب" : "Switch Student"}</span>
          </button>

          {/* Dedicated Global Reset / Clear Button */}
          <button
            onClick={() => setIsResetModalOpen(true)}
            className="px-2 sm:px-2.5 py-1.5 rounded-xl bg-red-500/25 hover:bg-red-500/40 text-red-200 border border-red-400/40 text-xs font-bold font-sans transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
            title="تصفير ومحو كافة الإجابات والنصوص السابقة للبدء من الصفر"
            id="top-reset-all-data-btn"
          >
            <RotateCcw className="w-3.5 h-3.5 text-red-300" />
            <span className="hidden sm:inline">{isRtl ? "تصفير (Reset) 🔄" : "Reset 🔄"}</span>
          </button>

          {/* Quick Profile View Button for Students */}
          {userSession.role === "student" && (
            <button
              onClick={() => { setActiveTab("profile"); setIsMobileMenuOpen(false); }}
              className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-bold font-sans transition-all flex items-center gap-1.5 border cursor-pointer ${
                activeTab === "profile"
                  ? "bg-[#D4AF37] text-slate-950 border-[#D4AF37] shadow-sm font-black"
                  : "bg-white/20 hover:bg-white/30 text-white border-white/20"
              }`}
              id="top-my-profile-btn"
            >
              <User className="w-3.5 h-3.5" />
              <span className="hidden md:inline">{isRtl ? "ملفي وإنجازي" : "Profile"}</span>
            </button>
          )}

          {/* Night Vision / Dark Mode Toggle Button */}
          <button
            onClick={toggleDarkMode}
            className="p-1.5 sm:px-2.5 py-1.5 rounded-xl bg-black/25 hover:bg-black/40 text-[#FDE68A] border border-white/20 text-xs font-bold font-sans transition-all flex items-center gap-1 shadow-sm cursor-pointer"
            title={isDarkMode ? "التبديل إلى الوضع النهاري" : "تفعيل وضع الرؤية الليلية"}
            id="top-dark-mode-toggle-btn"
          >
            {isDarkMode ? (
              <>
                <Sun className="w-4 h-4 text-amber-300" />
                <span className="hidden sm:inline text-[11px]">{isRtl ? "نهاري ☀️" : "Light"}</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-amber-300" />
                <span className="hidden sm:inline text-[11px]">{isRtl ? "ليلي 🌙" : "Night"}</span>
              </>
            )}
          </button>

          {/* Ministry Pitch Deck */}
          <button
            onClick={() => setIsPresentationOpen(true)}
            className="hidden lg:flex px-3 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-bold font-sans transition-all items-center gap-1.5 shadow-sm border border-white/20 cursor-pointer"
            id="open-ministry-pitch-deck-btn"
          >
            <Presentation className="w-3.5 h-3.5 text-[#FDE68A]" />
            <span>{isRtl ? "عرض الوزارة 🇶🇦" : "Pitch Deck 🇶🇦"}</span>
          </button>

          {/* Logout / Switch Account */}
          <button
            onClick={handleLogout}
            className="px-2 sm:px-2.5 py-1.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-400/30 text-red-200 text-xs font-bold font-sans transition-all flex items-center gap-1 cursor-pointer"
            title="تسجيل الخروج والعودة للرئيسية"
            id="top-logout-btn"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">{isRtl ? "خروج" : "Logout"}</span>
          </button>
        </div>
      </header>

      {/* Mobile Drawer Navigation Backdrop & Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col">
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity cursor-pointer"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div 
            className="relative z-10 w-4/5 max-w-xs sm:max-w-sm h-full bg-white dark:bg-[#14070E] p-4 flex flex-col justify-between shadow-2xl border-x border-amber-500/20 overflow-y-auto"
            dir={isRtl ? "rtl" : "ltr"}
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-[#3D1426]">
                <div className="flex items-center gap-2">
                  <IlqaaLogo size="sm" showText={true} />
                </div>
                <button
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:text-slate-900 cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User role summary in mobile drawer */}
              <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-[#200A15] border border-slate-200 dark:border-[#3D1426]">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-[#8A1538] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    {userSession.nameAr.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {isRtl ? userSession.nameAr : userSession.nameEn}
                    </p>
                    <p className="text-[10px] text-[#8A1538] dark:text-amber-300 font-bold">
                      {userSession.role === "student" && (isRtl ? "طالب" : "Student")}
                      {userSession.role === "teacher" && (isRtl ? "معلم / منسق لغة عربية" : "Arabic Teacher")}
                      {userSession.role === "ministry_admin" && (isRtl ? "مسؤول وزارة التربية والتعليم" : "Ministry Official")}
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigation links in mobile drawer */}
              <div className="mt-3 space-y-1.5">
                
                {/* 1. STUDENT PORTAL (Strictly Isolated: 4 Tabs Only) */}
                {userSession.role === "student" && (
                  <>
                    <button
                      onClick={() => { setActiveTab("home"); setIsMobileMenuOpen(false); }}
                      className={`w-full p-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all text-start cursor-pointer ${
                        activeTab === "home"
                          ? "bg-[#8A1538] text-white shadow-md"
                          : "bg-slate-50 dark:bg-[#1A0914] text-slate-700 dark:text-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <HomeIcon className="w-4 h-4 text-amber-300" />
                      <span>{isRtl ? "بوابة المراحل والتحدي اليومي" : "3-Stages Gateway"}</span>
                    </button>

                    <div className="pt-2 pb-1 px-1">
                      <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500">
                        {isRtl ? "المسارات التعليمية للطالب" : "Student Pathways"}
                      </span>
                    </div>

                    <button
                      onClick={() => { setActiveTab("practice"); setIsMobileMenuOpen(false); }}
                      className={`w-full p-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all text-start cursor-pointer ${
                        activeTab === "practice"
                          ? "bg-[#8A1538] text-white shadow-md"
                          : "bg-slate-50 dark:bg-[#1A0914] text-slate-700 dark:text-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <Mic className="w-4 h-4 text-emerald-500" />
                      <span>{isRtl ? "1. مختبر التأسيس القرائي" : "1. Foundation Lab"}</span>
                    </button>

                    <button
                      onClick={() => { setActiveTab("oratory"); setIsMobileMenuOpen(false); }}
                      className={`w-full p-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all text-start cursor-pointer ${
                        activeTab === "oratory"
                          ? "bg-gradient-to-r from-[#2B0813] to-[#8A1538] text-white shadow-md"
                          : "bg-rose-50 dark:bg-[#200A15] text-[#8A1538] dark:text-rose-200 border border-rose-200 dark:border-rose-900/40"
                      }`}
                    >
                      <Video className="w-4 h-4 text-rose-500" />
                      <span className="flex-1">{isRtl ? "2. مسرح الخطابة والمنبر الحي" : "2. Live Stage"}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#D4AF37] text-slate-950 font-black">LIVE</span>
                    </button>

                    <button
                      onClick={() => { setActiveTab("profile"); setIsMobileMenuOpen(false); }}
                      className={`w-full p-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all text-start cursor-pointer ${
                        activeTab === "profile"
                          ? "bg-[#8A1538] text-white shadow-md"
                          : "bg-slate-50 dark:bg-[#1A0914] text-slate-700 dark:text-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <User className="w-4 h-4 text-amber-500" />
                      <span>{isRtl ? "3. سجل إنجازي وشهاداتي" : "3. My Portfolio & Certificates"}</span>
                    </button>

                    <button
                      onClick={() => { setActiveTab("experts"); setIsMobileMenuOpen(false); }}
                      className={`w-full p-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all text-start cursor-pointer ${
                        activeTab === "experts"
                          ? "bg-gradient-to-r from-[#2B0813] to-[#8A1538] text-white shadow-md ring-1 ring-[#D4AF37]"
                          : "bg-amber-500/10 dark:bg-[#200A15] text-[#8A1538] dark:text-amber-300 border border-amber-300/40"
                      }`}
                    >
                      <GraduationCap className="w-4 h-4 text-[#D4AF37]" />
                      <span className="flex-1">{isRtl ? "4. الخبراء والمستشارون" : "4. Experts & Advisory Council"}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#D4AF37] text-slate-950 font-black">NEW</span>
                    </button>
                  </>
                )}

                {/* 2. TEACHER PORTAL */}
                {userSession.role === "teacher" && (
                  <>
                    <button
                      onClick={() => { setActiveTab("teacher_dashboard"); setIsMobileMenuOpen(false); }}
                      className={`w-full p-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all text-start cursor-pointer ${
                        activeTab === "teacher_dashboard"
                          ? "bg-[#8A1538] text-white shadow-md"
                          : "bg-slate-50 dark:bg-[#1A0914] text-slate-700 dark:text-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <BarChart3 className="w-4 h-4 text-amber-300" />
                      <span>{isRtl ? "لوحة تحكم المعلم والمنسق" : "Teacher Analytics"}</span>
                    </button>

                    <button
                      onClick={() => { setActiveTab("talent_hub"); setIsMobileMenuOpen(false); }}
                      className={`w-full p-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all text-start cursor-pointer ${
                        activeTab === "talent_hub"
                          ? "bg-gradient-to-r from-[#2B0813] to-[#8A1538] text-white shadow-md"
                          : "bg-amber-50 dark:bg-[#251307] text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40"
                      }`}
                    >
                      <Award className="w-4 h-4 text-[#D4AF37]" />
                      <span>{isRtl ? "رصد وانتداب الموهوبين 🇶🇦" : "Talent Scouting Hub 🇶🇦"}</span>
                    </button>

                    <button
                      onClick={() => { setActiveTab("dashboard"); setIsMobileMenuOpen(false); }}
                      className={`w-full p-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all text-start cursor-pointer ${
                        activeTab === "dashboard"
                          ? "bg-[#8A1538] text-white shadow-md"
                          : "bg-slate-50 dark:bg-[#1A0914] text-slate-700 dark:text-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <Layers className="w-4 h-4 text-blue-500" />
                      <span>{isRtl ? "لوحة معايير المناهج والكفايات" : "Curriculum Standards"}</span>
                    </button>

                    <button
                      onClick={() => { setActiveTab("reports"); setIsMobileMenuOpen(false); }}
                      className={`w-full p-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all text-start cursor-pointer ${
                        activeTab === "reports"
                          ? "bg-[#8A1538] text-white shadow-md"
                          : "bg-slate-50 dark:bg-[#1A0914] text-slate-700 dark:text-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span>{dict.academicReports}</span>
                    </button>

                    <div className="pt-2 pb-1 px-1">
                      <span className="text-[10px] font-black uppercase text-slate-400">
                        {isRtl ? "استعراض بيئة الطلاب" : "Student View"}
                      </span>
                    </div>

                    <button
                      onClick={() => { setActiveTab("practice"); setIsMobileMenuOpen(false); }}
                      className="w-full p-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 bg-slate-50 dark:bg-[#1A0914] text-slate-700 dark:text-slate-200 hover:bg-slate-100"
                    >
                      <Mic className="w-4 h-4 text-emerald-500" />
                      <span>{isRtl ? "مختبر التأسيس القرائي" : "Foundation Lab"}</span>
                    </button>

                    <button
                      onClick={() => { setActiveTab("oratory"); setIsMobileMenuOpen(false); }}
                      className="w-full p-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 bg-slate-50 dark:bg-[#1A0914] text-slate-700 dark:text-slate-200 hover:bg-slate-100"
                    >
                      <Video className="w-4 h-4 text-rose-500" />
                      <span>{isRtl ? "مسرح الخطابة الحي" : "Live Stage"}</span>
                    </button>
                  </>
                )}

                {/* 3. MINISTRY PORTAL */}
                {userSession.role === "ministry_admin" && (
                  <>
                    <button
                      onClick={() => { setActiveTab("talent_hub"); setIsMobileMenuOpen(false); }}
                      className={`w-full p-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all text-start cursor-pointer ${
                        activeTab === "talent_hub"
                          ? "bg-gradient-to-r from-[#2B0813] to-[#8A1538] text-white shadow-md"
                          : "bg-amber-50 dark:bg-[#251307] text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40"
                      }`}
                    >
                      <Award className="w-4 h-4 text-[#D4AF37]" />
                      <span>{isRtl ? "كشوفات وانتداب الموهوبين 🇶🇦" : "National Talent Hub 🇶🇦"}</span>
                    </button>

                    <button
                      onClick={() => { setActiveTab("teacher_dashboard"); setIsMobileMenuOpen(false); }}
                      className={`w-full p-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all text-start cursor-pointer ${
                        activeTab === "teacher_dashboard"
                          ? "bg-[#8A1538] text-white shadow-md"
                          : "bg-slate-50 dark:bg-[#1A0914] text-slate-700 dark:text-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <BarChart3 className="w-4 h-4 text-amber-300" />
                      <span>{isRtl ? "مؤشرات المدارس والمناطق" : "MoEHE Schools & Regions"}</span>
                    </button>

                    <button
                      onClick={() => { setActiveTab("dashboard"); setIsMobileMenuOpen(false); }}
                      className={`w-full p-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all text-start cursor-pointer ${
                        activeTab === "dashboard"
                          ? "bg-[#8A1538] text-white shadow-md"
                          : "bg-slate-50 dark:bg-[#1A0914] text-slate-700 dark:text-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <Layers className="w-4 h-4 text-blue-500" />
                      <span>{isRtl ? "مصفوفة المعايير والكفايات الوطنية" : "Curriculum Standards Matrix"}</span>
                    </button>

                    <button
                      onClick={() => { setActiveTab("reports"); setIsMobileMenuOpen(false); }}
                      className={`w-full p-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all text-start cursor-pointer ${
                        activeTab === "reports"
                          ? "bg-[#8A1538] text-white shadow-md"
                          : "bg-slate-50 dark:bg-[#1A0914] text-slate-700 dark:text-slate-200 hover:bg-slate-100"
                      }`}
                    >
                      <FileText className="w-4 h-4 text-slate-400" />
                      <span>{isRtl ? "التقارير الوزارية الاستراتيجية" : "Strategic Reports"}</span>
                    </button>
                  </>
                )}

                <button
                  onClick={() => { setActiveTab("experts"); setIsMobileMenuOpen(false); }}
                  className={`w-full p-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all text-start cursor-pointer ${
                    activeTab === "experts"
                      ? "bg-[#8A1538] text-white shadow-md ring-1 ring-[#D4AF37]"
                      : "bg-amber-50 dark:bg-[#1E0B16] text-[#8A1538] dark:text-amber-200 border border-amber-300/30"
                  }`}
                >
                  <GraduationCap className="w-4 h-4 text-[#D4AF37]" />
                  <span>{isRtl ? "الخبراء والمستشارون (مجلس إلقاء)" : "Experts & Advisory Council"}</span>
                </button>

                <button
                  onClick={() => { setIsPresentationOpen(true); setIsMobileMenuOpen(false); }}
                  className="w-full p-2.5 rounded-xl text-xs font-bold flex items-center gap-2.5 transition-all text-start bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-300/30 cursor-pointer"
                >
                  <Presentation className="w-4 h-4 text-amber-500" />
                  <span>{isRtl ? "عرض الوزارة التقديمي 🇶🇦" : "MoEHE Pitch Deck"}</span>
                </button>
              </div>
            </div>

            {/* Logout button in drawer */}
            <div className="pt-4 border-t border-slate-100 dark:border-[#3D1426]">
              <button
                onClick={handleLogout}
                className="w-full p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 text-xs font-bold flex items-center justify-center gap-2 border border-red-200 dark:border-red-900/40 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>{isRtl ? "تبديل البوابة / تسجيل الخروج" : "Switch Portal / Logout"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Page Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6" id="app-content-body">
        
        {/* Navigation Sidebar (Desktop Only) */}
        <aside className="hidden lg:flex lg:col-span-3 flex-col gap-2" id="app-navigation-sidebar">
          
          {/* ========================================================================= */}
          {/* 1. STUDENT PORTAL (Strictly Isolated: 4 Focused Tabs Only) */}
          {/* ========================================================================= */}
          {userSession.role === "student" && (
            <>
              {/* Home / Gateway */}
              <button
                onClick={() => setActiveTab("home")}
                className={`w-full p-3.5 rounded-2xl text-sm font-bold flex items-center gap-3 transition-all cursor-pointer shadow-sm ${
                  activeTab === "home"
                    ? "bg-[#8A1538] text-white shadow-lg shadow-[#8A1538]/30 ring-2 ring-[#D4AF37]/50"
                    : "bg-white dark:bg-[#1C0A15] hover:bg-slate-50 dark:hover:bg-[#2A0E1F] text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-[#3D1426]"
                }`}
                id="sidebar-home-tab-btn"
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${activeTab === "home" ? "bg-white/20 text-[#FDE68A]" : "bg-[#8A1538]/10 dark:bg-[#8A1538]/30 text-[#8A1538] dark:text-amber-300"}`}>
                  <HomeIcon className="w-4 h-4" />
                </div>
                <div className="flex flex-col text-start">
                  <span className="font-serif font-black text-sm">{isRtl ? "الرئيسية والمراحل الثلاث" : "3-Stages Gateway"}</span>
                  <span className={`text-[10px] font-sans ${activeTab === "home" ? "text-amber-200" : "text-slate-400 dark:text-slate-400"}`}>
                    {isRtl ? "التحدي اليومي • مسارات التدريب" : "Daily Challenge • Pathways"}
                  </span>
                </div>
              </button>

              <div className="pt-2 pb-1 px-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-sans">
                  {isRtl ? "المسارات التعليمية للطالب" : "Student Pathways"}
                </span>
              </div>

              {/* Stage 1: Phonics Lab */}
              <button
                onClick={() => setActiveTab("practice")}
                className={`w-full p-3 rounded-2xl text-xs font-bold flex items-center justify-between gap-3 transition-all cursor-pointer ${
                  activeTab === "practice"
                    ? "bg-[#8A1538] text-white shadow-md ring-1 ring-[#D4AF37]/40"
                    : "bg-white dark:bg-[#1C0A15] hover:bg-slate-50 dark:hover:bg-[#2A0E1F] text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-[#3D1426]"
                }`}
                id="sidebar-practice-tab-btn"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${activeTab === "practice" ? "bg-white/20 text-white" : "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"}`}>
                    <Mic className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col text-start">
                    <span className="font-bold">{isRtl ? "1. مختبر التأسيس القرائي" : "1. Foundation Lab"}</span>
                    <span className={`text-[9px] ${activeTab === "practice" ? "text-amber-100" : "text-slate-400 dark:text-slate-400"}`}>
                      {isRtl ? "مخارج الحروف وضبط الحركات" : "Phonetics & Diacritics"}
                    </span>
                  </div>
                </div>
              </button>

              {/* Stage 2: Oratory Stage */}
              <button
                onClick={() => setActiveTab("oratory")}
                className={`w-full p-3.5 rounded-2xl text-xs font-bold flex items-center justify-between gap-3 transition-all cursor-pointer shadow-sm ${
                  activeTab === "oratory"
                    ? "bg-gradient-to-r from-[#2B0813] via-[#8A1538] to-[#120207] text-white shadow-lg shadow-[#8A1538]/40 ring-2 ring-[#D4AF37]"
                    : "text-slate-900 dark:text-white bg-gradient-to-r from-amber-50/50 via-rose-50/30 to-amber-50/50 dark:from-[#200A15] dark:to-[#2A0E1F] border border-amber-200 dark:border-amber-900/40 hover:border-[#8A1538] hover:shadow-md"
                }`}
                id="sidebar-oratory-stage-btn"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${activeTab === "oratory" ? "bg-[#D4AF37] text-slate-950 shadow-sm" : "bg-[#8A1538] text-white shadow-sm"}`}>
                    <Video className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col text-start">
                    <span className="font-serif font-black text-sm">{isRtl ? "2. مسرح الخطابة والمنبر" : "2. Live Oratory Stage"}</span>
                    <span className={`text-[10px] font-sans ${activeTab === "oratory" ? "text-amber-200" : "text-slate-500 dark:text-slate-400"}`}>
                      {isRtl ? "كاميرا + ملقن + لغة الجسد" : "Camera + AI Prompter"}
                    </span>
                  </div>
                </div>
                <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-[#D4AF37] text-slate-950 shadow-xs animate-pulse">
                  {isRtl ? "مباشر" : "LIVE"}
                </span>
              </button>

              {/* Stage 3: Student Portfolio */}
              <button
                onClick={() => setActiveTab("profile")}
                className={`w-full p-3 rounded-2xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                  activeTab === "profile"
                    ? "bg-[#8A1538] text-white shadow-md ring-1 ring-[#D4AF37]/40"
                    : "bg-white dark:bg-[#1C0A15] hover:bg-slate-50 dark:hover:bg-[#2A0E1F] text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-[#3D1426]"
                }`}
                id="sidebar-profile-tab-btn"
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${activeTab === "profile" ? "bg-white/20 text-white" : "bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400"}`}>
                  <User className="w-3.5 h-3.5" />
                </div>
                <div className="flex flex-col text-start">
                  <span className="font-bold">{isRtl ? "3. سجل إنجازي وشهاداتي" : "3. My Portfolio & Badges"}</span>
                  <span className={`text-[9px] ${activeTab === "profile" ? "text-amber-100" : "text-slate-400 dark:text-slate-400"}`}>
                    {isRtl ? "الأوسمة والشهادات المعتمدة" : "Awards & Certificates"}
                  </span>
                </div>
              </button>

              {/* Stage 4: Experts & Advisory Council */}
              <button
                onClick={() => setActiveTab("experts")}
                className={`w-full p-3 rounded-2xl text-xs font-bold flex items-center justify-between gap-3 transition-all cursor-pointer ${
                  activeTab === "experts"
                    ? "bg-gradient-to-r from-[#2B0813] via-[#8A1538] to-[#120207] text-white shadow-md ring-1 ring-[#D4AF37]"
                    : "bg-white dark:bg-[#1C0A15] hover:bg-slate-50 dark:hover:bg-[#2A0E1F] text-slate-700 dark:text-slate-200 border border-amber-300/60 dark:border-amber-900/40"
                }`}
                id="sidebar-student-experts-btn"
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${activeTab === "experts" ? "bg-[#D4AF37] text-slate-950 font-black" : "bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400"}`}>
                    <GraduationCap className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex flex-col text-start">
                    <span className="font-bold">{isRtl ? "4. الخبراء والمستشارون" : "4. Experts & Council"}</span>
                    <span className={`text-[9px] ${activeTab === "experts" ? "text-amber-100" : "text-slate-400 dark:text-slate-400"}`}>
                      {isRtl ? "المجلس الاستشاري وشبكة الخبراء" : "Advisory Council & Network"}
                    </span>
                  </div>
                </div>
                <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-md bg-[#D4AF37]/20 text-[#8A1538] dark:text-amber-200 border border-[#D4AF37]/40">
                  {isRtl ? "جديد" : "NEW"}
                </span>
              </button>
            </>
          )}

          {/* ========================================================================= */}
          {/* 2. TEACHER PORTAL */}
          {/* ========================================================================= */}
          {userSession.role === "teacher" && (
            <>
              <button
                onClick={() => setActiveTab("teacher_dashboard")}
                className={`w-full p-3.5 rounded-2xl text-sm font-bold flex items-center gap-3 transition-all cursor-pointer shadow-sm ${
                  activeTab === "teacher_dashboard"
                    ? "bg-[#8A1538] text-white shadow-lg shadow-[#8A1538]/30 ring-2 ring-[#D4AF37]/50"
                    : "bg-white dark:bg-[#1C0A15] hover:bg-slate-50 dark:hover:bg-[#2A0E1F] text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-[#3D1426]"
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${activeTab === "teacher_dashboard" ? "bg-white/20 text-[#FDE68A]" : "bg-[#8A1538]/10 dark:bg-[#8A1538]/30 text-[#8A1538] dark:text-amber-300"}`}>
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div className="flex flex-col text-start">
                  <span className="font-serif font-black text-sm">{isRtl ? "لوحة تحكم المعلم والمنسق" : "Teacher Analytics"}</span>
                  <span className={`text-[10px] font-sans ${activeTab === "teacher_dashboard" ? "text-amber-200" : "text-slate-400 dark:text-slate-400"}`}>
                    {isRtl ? "أوائل المعايير والطلاب المتعثرين" : "Leaderboards & Support"}
                  </span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab("talent_hub")}
                className={`w-full p-3.5 rounded-2xl text-sm font-bold flex items-center gap-3 transition-all cursor-pointer shadow-sm ${
                  activeTab === "talent_hub"
                    ? "bg-gradient-to-r from-[#2B0813] via-[#8A1538] to-[#120207] text-white shadow-lg shadow-[#8A1538]/40 ring-2 ring-[#D4AF37]"
                    : "bg-gradient-to-r from-amber-50/70 to-rose-50/50 dark:from-[#200A15] dark:to-[#2B0813] text-slate-900 dark:text-white border border-amber-200 dark:border-amber-900/40 hover:border-[#8A1538]"
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${activeTab === "talent_hub" ? "bg-[#D4AF37] text-slate-950" : "bg-[#8A1538] text-white"}`}>
                  <Award className="w-4 h-4" />
                </div>
                <div className="flex flex-col text-start">
                  <span className="font-serif font-black text-sm">{isRtl ? "رصد وانتداب الموهوبين 🇶🇦" : "Talent Scouting Hub 🇶🇦"}</span>
                  <span className={`text-[10px] font-sans ${activeTab === "talent_hub" ? "text-amber-200" : "text-slate-500 dark:text-slate-400"}`}>
                    {isRtl ? "المسرح المنبري وكشوفات الوزارة" : "Oratory & Ministerial Delegation"}
                  </span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab("dashboard")}
                className={`w-full p-3 rounded-2xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                  activeTab === "dashboard"
                    ? "bg-[#8A1538] text-white shadow-md"
                    : "bg-white dark:bg-[#1C0A15] hover:bg-slate-50 dark:hover:bg-[#2A0E1F] text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-[#3D1426]"
                }`}
              >
                <Layers className="w-4 h-4 text-blue-500" />
                <span>{isRtl ? "لوحة معايير المناهج والكفايات" : "Curriculum Standards"}</span>
              </button>

              <button
                onClick={() => setActiveTab("reports")}
                className={`w-full p-3 rounded-2xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                  activeTab === "reports"
                    ? "bg-[#8A1538] text-white shadow-md"
                    : "bg-white dark:bg-[#1C0A15] hover:bg-slate-50 dark:hover:bg-[#2A0E1F] text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-[#3D1426]"
                }`}
              >
                <FileText className="w-4 h-4 text-slate-500" />
                <span>{dict.academicReports}</span>
              </button>

              <button
                onClick={() => setActiveTab("experts")}
                className={`w-full p-2.5 rounded-2xl text-xs font-bold flex items-center justify-between gap-2.5 transition-all cursor-pointer ${
                  activeTab === "experts"
                    ? "bg-[#8A1538] text-white shadow-md ring-1 ring-[#D4AF37]/40"
                    : "bg-white dark:bg-[#1C0A15] hover:bg-slate-50 dark:hover:bg-[#2A0E1F] text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-[#3D1426]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-[#D4AF37]" />
                  <span>{isRtl ? "الخبراء والمستشارون" : "Experts & Advisory Council"}</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/15 text-[#8A1538] dark:text-amber-200 font-bold">
                  {isRtl ? "أكاديمي" : "Council"}
                </span>
              </button>

              {/* Student Experience Simulator / Preview Tab for Teacher */}
              <div className="pt-2 border-t border-slate-200/60 dark:border-[#3D1426]/60 mt-1">
                <button
                  onClick={() => setActiveTab("home")}
                  className={`w-full p-2.5 rounded-2xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer border ${
                    activeTab === "home" || activeTab === "oratory" || activeTab === "practice"
                      ? "bg-amber-500/15 text-amber-900 dark:text-amber-300 border-amber-400/50 shadow-sm"
                      : "bg-slate-50 dark:bg-[#150710] hover:bg-amber-50/50 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-[#2D0F1E]"
                  }`}
                  title="معاينة الواجهة التفاعلية كما يراها الطالب في الصف"
                >
                  <Eye className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                  <div className="flex flex-col text-start">
                    <span>{isRtl ? "معاينة مسرح وتدريب الطالب" : "Preview Student Stage"}</span>
                    <span className="text-[9px] text-slate-400 font-normal">
                      {isRtl ? `تجربة ${activeStudent.grade}` : `Simulate ${activeStudent.grade}`}
                    </span>
                  </div>
                </button>
              </div>
            </>
          )}

          {/* ========================================================================= */}
          {/* 3. MINISTRY ADMIN PORTAL */}
          {/* ========================================================================= */}
          {userSession.role === "ministry_admin" && (
            <>
              <button
                onClick={() => setActiveTab("talent_hub")}
                className={`w-full p-3.5 rounded-2xl text-sm font-bold flex items-center gap-3 transition-all cursor-pointer shadow-sm ${
                  activeTab === "talent_hub"
                    ? "bg-gradient-to-r from-[#2B0813] via-[#8A1538] to-[#120207] text-white shadow-lg shadow-[#8A1538]/40 ring-2 ring-[#D4AF37]"
                    : "bg-gradient-to-r from-amber-50/70 to-rose-50/50 dark:from-[#200A15] dark:to-[#2B0813] text-slate-900 dark:text-white border border-amber-200 dark:border-amber-900/40 hover:border-[#8A1538]"
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${activeTab === "talent_hub" ? "bg-[#D4AF37] text-slate-950" : "bg-[#8A1538] text-white"}`}>
                  <Award className="w-4 h-4" />
                </div>
                <div className="flex flex-col text-start">
                  <span className="font-serif font-black text-sm">{isRtl ? "كشوفات وانتداب الموهوبين 🇶🇦" : "National Talent Hub 🇶🇦"}</span>
                  <span className={`text-[10px] font-sans ${activeTab === "talent_hub" ? "text-amber-200" : "text-slate-500 dark:text-slate-400"}`}>
                    {isRtl ? "ترشيح فرسان المنبر للمحافل الرسمية" : "Official Forum Delegation"}
                  </span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab("teacher_dashboard")}
                className={`w-full p-3 rounded-2xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                  activeTab === "teacher_dashboard"
                    ? "bg-[#8A1538] text-white shadow-md"
                    : "bg-white dark:bg-[#1C0A15] hover:bg-slate-50 dark:hover:bg-[#2A0E1F] text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-[#3D1426]"
                }`}
              >
                <BarChart3 className="w-4 h-4 text-amber-400" />
                <span>{isRtl ? "مؤشرات المدارس والمناطق التعليمية" : "MoEHE Schools & Regions"}</span>
              </button>

              <button
                onClick={() => setActiveTab("dashboard")}
                className={`w-full p-3 rounded-2xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                  activeTab === "dashboard"
                    ? "bg-[#8A1538] text-white shadow-md"
                    : "bg-white dark:bg-[#1C0A15] hover:bg-slate-50 dark:hover:bg-[#2A0E1F] text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-[#3D1426]"
                }`}
              >
                <Layers className="w-4 h-4 text-blue-500" />
                <span>{isRtl ? "مصفوفة المعايير والكفايات الوطنية" : "Curriculum Matrix"}</span>
              </button>

              <button
                onClick={() => setActiveTab("reports")}
                className={`w-full p-3 rounded-2xl text-xs font-bold flex items-center gap-2.5 transition-all cursor-pointer ${
                  activeTab === "reports"
                    ? "bg-[#8A1538] text-white shadow-md"
                    : "bg-white dark:bg-[#1C0A15] hover:bg-slate-50 dark:hover:bg-[#2A0E1F] text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-[#3D1426]"
                }`}
              >
                <FileText className="w-4 h-4 text-slate-500" />
                <span>{isRtl ? "التقارير الوزارية الاستراتيجية" : "Strategic Reports"}</span>
              </button>

              <button
                onClick={() => setActiveTab("experts")}
                className={`w-full p-2.5 rounded-2xl text-xs font-bold flex items-center justify-between gap-2.5 transition-all cursor-pointer ${
                  activeTab === "experts"
                    ? "bg-[#8A1538] text-white shadow-md ring-1 ring-[#D4AF37]/40"
                    : "bg-white dark:bg-[#1C0A15] hover:bg-slate-50 dark:hover:bg-[#2A0E1F] text-slate-700 dark:text-slate-200 border border-slate-100 dark:border-[#3D1426]"
                }`}
              >
                <div className="flex items-center gap-2">
                  <GraduationCap className="w-4 h-4 text-[#D4AF37]" />
                  <span>{isRtl ? "المجلس الاستشاري وشبكة الخبراء" : "Advisory Council & Experts"}</span>
                </div>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/15 text-[#8A1538] dark:text-amber-200 font-bold">
                  {isRtl ? "أكاديمي" : "Council"}
                </span>
              </button>
            </>
          )}

          {/* Current User Profile Indicator on Sidebar */}
          <div className="bg-white dark:bg-[#1C0A15] rounded-2xl border border-slate-100 dark:border-[#3D1426] p-4 mt-2 shadow-sm" id="active-student-badge">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2.5">
              {isRtl ? "الحساب النشط" : "Active Profile"}
            </p>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full ${theme.bgPrimary} text-white flex items-center justify-center font-serif font-black text-base shadow-sm transition-all duration-500`}>
                {userSession.nameAr.charAt(0)}
              </div>
              <div className="overflow-hidden">
                <p className="text-xs font-black text-slate-800 dark:text-white truncate">
                  {isRtl ? userSession.nameAr : userSession.nameEn}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-400 font-bold flex items-center gap-1 mt-0.5">
                  <GraduationCap className="w-3.5 h-3.5 text-[#8A1538] dark:text-amber-300" />
                  <span>{userSession.section || userSession.grade || (isRtl ? "المسار الأكاديمي" : "Academic Track")}</span>
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Dynamic Display Panels */}
        <main className="lg:col-span-9 w-full min-w-0 pb-20 lg:pb-0" id="app-main-tabs-stage">
          {/* Teacher / Admin Mode Preview Banner when visiting Student Screens */}
          {userSession.role !== "student" && (activeTab === "home" || activeTab === "oratory" || activeTab === "practice" || activeTab === "profile") && (
            <div className="mb-4 p-3 rounded-2xl bg-amber-500/15 border border-amber-400/50 flex flex-wrap items-center justify-between gap-3 text-amber-950 dark:text-amber-200">
              <div className="flex items-center gap-2.5 text-xs font-bold">
                <Eye className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  {isRtl
                    ? `أنت في وضع (معاينة تجربة الطالب) للصف المحدد: ${activeStudent.grade} (${activeStudent.nameAr})`
                    : `Student Preview Mode: ${activeStudent.grade} (${activeStudent.nameEn})`}
                </span>
              </div>
              <button
                onClick={() => setActiveTab(userSession.role === "teacher" ? "teacher_dashboard" : "talent_hub")}
                className="px-3 py-1 rounded-xl bg-[#8A1538] hover:bg-[#5C0E25] text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
              >
                {isRtl ? "العودة للوحة تحكم المعلم ➜" : "Back to Teacher Dashboard ➜"}
              </button>
            </div>
          )}

          {activeTab === "home" && (
            <HomeLaunchpad
              student={activeStudent}
              students={students}
              settings={settings}
              dict={dict}
              theme={theme}
              onSelectStudent={handleSelectStudentProfile}
              onNavigate={setActiveTab}
              onOpenPitchDeck={() => setIsPresentationOpen(true)}
            />
          )}

          {activeTab === "oratory" && (
            <OratoryStageTab
              student={activeStudent}
              dict={dict}
              language={settings.language}
              theme={theme}
              onEarnReward={handleEarnReward}
              onReturnHome={() => setActiveTab("home")}
              onNavigateToExperts={() => setActiveTab("experts")}
            />
          )}

          {activeTab === "dashboard" && (
            <DashboardTab
              student={activeStudent}
              settings={settings}
              dict={dict}
              onSelectStudent={handleSelectStudentProfile}
              students={students}
              theme={theme}
              onNavigateToPractice={handleNavigateToPractice}
              onAddStudent={handleAddStudent}
              onAddMeasurement={handleAddMeasurement}
              onReturnHome={() => setActiveTab("home")}
            />
          )}

          {activeTab === "practice" && (
            <VoicePracticeTab
              student={activeStudent}
              dict={dict}
              language={settings.language}
              onAddAttempt={handleAddAttempt}
              theme={theme}
              onAdvanceGrade={handleAdvanceGrade}
              selectedMeasurementId={selectedMeasurementId}
              onEarnReward={handleEarnReward}
              onClaimDailyBonus={handleClaimDailyBonus}
              onUpdateScore={handleUpdateMeasurementScore}
              onReturnHome={() => setActiveTab("home")}
            />
          )}

          {activeTab === "profile" && (
            <StudentProfileView
              student={activeStudent}
              settings={settings}
              dict={dict}
              theme={theme}
              onNavigate={setActiveTab}
            />
          )}

          {activeTab === "teacher_dashboard" && (
            <TeacherDashboard
              userSession={userSession}
              students={students}
              onNavigateToStudent={(studentId, tab) => {
                const target = students.find(s => s.id === studentId);
                if (target) {
                  setActiveStudentId(target.id);
                  localStorage.setItem("ilqaa_active_student_id", target.id);
                }
                setActiveTab(tab);
              }}
              onNominateTalent={() => setActiveTab("talent_hub")}
              isRtl={isRtl}
            />
          )}

          {activeTab === "talent_hub" && (
            <MinistryTalentHub
              userSession={userSession}
              isRtl={isRtl}
            />
          )}

          {activeTab === "reports" && (
            <AcademicReportsTab
              student={activeStudent}
              settings={settings}
              dict={dict}
              theme={theme}
            />
          )}

          {activeTab === "settings" && (
            <SettingsTab
              settings={settings}
              dict={dict}
              onSaveSettings={handleSaveSettings}
              onResetDefaults={handleResetDefaults}
              theme={theme}
              activeStudent={activeStudent}
              onUpdateStudentMeasurements={handleUpdateStudentMeasurements}
              isDarkMode={isDarkMode}
              onToggleDarkMode={toggleDarkMode}
            />
          )}

          {activeTab === "experts" && (
            <ExpertsHubTab
              isRtl={isRtl}
              theme={theme}
              onReturnHome={() => setActiveTab("home")}
            />
          )}
        </main>
      </div>

      {/* Mobile Sticky Bottom Navigation Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#14070E]/95 backdrop-blur-md border-t border-slate-200 dark:border-[#3D1426] px-1 py-1.5 flex items-center justify-around shadow-lg" id="mobile-bottom-nav">
        <button
          onClick={() => setActiveTab("home")}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
            activeTab === "home"
              ? "text-[#8A1538] dark:text-amber-300 font-bold"
              : "text-slate-500 dark:text-slate-400"
          }`}
        >
          <HomeIcon className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-sans whitespace-nowrap">{isRtl ? "الرئيسية" : "Home"}</span>
        </button>

        <button
          onClick={() => setActiveTab("practice")}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
            activeTab === "practice"
              ? "text-[#8A1538] dark:text-amber-300 font-bold"
              : "text-slate-500 dark:text-slate-400"
          }`}
        >
          <Mic className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-sans whitespace-nowrap">{isRtl ? "1. التأسيس" : "Phonics"}</span>
        </button>

        <button
          onClick={() => setActiveTab("oratory")}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all relative cursor-pointer ${
            activeTab === "oratory"
              ? "bg-[#8A1538] text-white shadow-md rounded-2xl -mt-4 px-3 py-2 border-2 border-amber-300"
              : "text-[#8A1538] dark:text-rose-300 font-bold"
          }`}
        >
          <Video className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-sans whitespace-nowrap">{isRtl ? "2. المسرح" : "Stage"}</span>
          <span className="absolute -top-1 right-0 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
        </button>

        <button
          onClick={() => setActiveTab("dashboard")}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
            activeTab === "dashboard"
              ? "text-[#8A1538] dark:text-amber-300 font-bold"
              : "text-slate-500 dark:text-slate-400"
          }`}
        >
          <BarChart3 className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-sans whitespace-nowrap">{isRtl ? "3. الكفايات" : "Analytics"}</span>
        </button>

        {userSession.role === "teacher" ? (
          <button
            onClick={() => setActiveTab("teacher_dashboard")}
            className={`flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all cursor-pointer ${
              activeTab === "teacher_dashboard"
                ? "text-[#8A1538] dark:text-amber-300 font-bold"
                : "text-slate-500 dark:text-slate-400"
            }`}
          >
            <Award className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-sans whitespace-nowrap">{isRtl ? "المعلم" : "Teacher"}</span>
          </button>
        ) : (
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex flex-col items-center justify-center py-1 px-2 rounded-xl text-slate-500 dark:text-slate-400 transition-all cursor-pointer"
          >
            <Menu className="w-5 h-5 mb-0.5" />
            <span className="text-[10px] font-sans whitespace-nowrap">{isRtl ? "المزيد" : "More"}</span>
          </button>
        )}
      </nav>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-16 lg:bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-2.5 animate-bounce text-xs font-bold font-sans">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Ministry Presentation Pitch Deck Modal */}
      <MinistryPresentationModal
        isOpen={isPresentationOpen}
        onClose={() => setIsPresentationOpen(false)}
        onNavigateToTab={(tabKey) => {
          setIsPresentationOpen(false);
          setActiveTab(tabKey);
        }}
        isRtl={isRtl}
      />

      {/* Universal Student Selector Modal */}
      <StudentSelectorModal
        isOpen={isStudentSelectorOpen}
        onClose={() => setIsStudentSelectorOpen(false)}
        students={students}
        activeStudentId={activeStudentId}
        onSelectStudent={handleSelectStudentProfile}
        isRtl={isRtl}
      />

      {/* Global Reset & Clear Data Modal */}
      <ResetAllModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirmResetCurrentStudent={handleResetCurrentStudent}
        onConfirmResetEntirePlatform={handleResetEntirePlatform}
        currentStudentName={isRtl ? activeStudent.nameAr : activeStudent.nameEn}
        isRtl={isRtl}
      />

      {/* Aesthetic footer */}
      <footer className="bg-white dark:bg-[#12050C] border-t border-slate-100 dark:border-[#3D1426] py-4 px-6 text-center text-slate-400 dark:text-slate-500 text-[11px] font-medium hidden lg:block" id="app-footer">
        {isRtl 
          ? "© ٢٠٢٦ منصة إلقاء الوطنية - وزارة التربية والتعليم والتعليم العالي - دولة قطر 🇶🇦"
          : "© 2026 ILQAA National Platform - Ministry of Education and Higher Education - State of Qatar 🇶🇦"}
      </footer>
    </div>
  );
}
