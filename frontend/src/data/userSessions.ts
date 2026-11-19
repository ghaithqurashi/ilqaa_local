import { UserSession, TalentNominationRecord } from "../types";

export const DEMO_USERS: UserSession[] = [
  // Student 1: Grade 6 Student (ناصر الهاجري)
  {
    id: "user-student-g6",
    nameAr: "ناصر بن مبارك الهاجري",
    nameEn: "Nasser Mubarak Al-Hajri",
    email: "nasser.hajri@student.edu.qa",
    role: "student",
    schoolNameAr: "مدرسة قطر الابتدائية للبنين",
    schoolNameEn: "Qatar Primary School for Boys",
    studentProfileId: "student-g6-1",
    grade: "Grade 6",
    section: "الصف السادس (شعبة ب)"
  },
  // Student 2: Grade 3 Student (مريم الكواري)
  {
    id: "user-student-g3",
    nameAr: "مريم بنت حمد الكواري",
    nameEn: "Maryam Hamad Al-Kuwari",
    email: "maryam.kuwari@student.edu.qa",
    role: "student",
    schoolNameAr: "مدرسة الشفاء بنت عوف الابتدائية للبنات",
    schoolNameEn: "Al-Shifaa Primary School for Girls",
    studentProfileId: "student-g3-1",
    grade: "Grade 3",
    section: "الصف الثالث (شعبة أ)"
  },
  // Student 3: Grade 8 Student (راشد المري)
  {
    id: "user-student-g8",
    nameAr: "راشد بن جابر المري",
    nameEn: "Rashid Jaber Al-Marri",
    email: "rashid.marri@student.edu.qa",
    role: "student",
    schoolNameAr: "مدرسة الدوحة الإعدادية للبنين",
    schoolNameEn: "Doha Preparatory School for Boys",
    studentProfileId: "student-g8-1",
    grade: "Grade 8",
    section: "الصف الثامن (شعبة ب)"
  },
  // Student 4: Grade 12 Student (سارة المهندي)
  {
    id: "user-student-g12",
    nameAr: "سارة بنت خالد المهندي",
    nameEn: "Sara Khalid Al-Mohannadi",
    email: "sara.mohannadi@student.edu.qa",
    role: "student",
    schoolNameAr: "مدرسة البيان الثانوية للبنات",
    schoolNameEn: "Al-Bayan Secondary School for Girls",
    studentProfileId: "student-g12-1",
    grade: "Grade 12",
    section: "الصف الثاني عشر (علمي 1)"
  },
  // Student 5: Grade 5 Student (أحمد المهندي)
  {
    id: "user-student-g5",
    nameAr: "أحمد بن حمد المهندي",
    nameEn: "Ahmed Hamad Al-Mohannadi",
    email: "ahmed.mohannadi@student.edu.qa",
    role: "student",
    schoolNameAr: "مدرسة الخور النموذجية للبنين",
    schoolNameEn: "Al-Khor Model School for Boys",
    studentProfileId: "student-g5-1",
    grade: "Grade 5",
    section: "الصف الخامس (شعبة أ)"
  },
  // Student 6: KG Student (أمل العبيدلي)
  {
    id: "user-student-kg",
    nameAr: "أمل بنت عمر العبيدلي",
    nameEn: "Amal Omar Al-Obaidli",
    email: "amal.obaidli@student.edu.qa",
    role: "student",
    schoolNameAr: "روضة قطر للتعليم المبكر",
    schoolNameEn: "Qatar Early Learning Kindergarten",
    studentProfileId: "student-kg-1",
    grade: "KG",
    section: "الروضة (شعبة 1)"
  },
  // Teacher / Coordinator User
  {
    id: "user-teacher-1",
    nameAr: "أ. محمد بن عبد الله الأنصاري",
    nameEn: "Mr. Mohammed Al-Ansari",
    email: "m.ansari@edu.gov.qa",
    role: "teacher",
    schoolNameAr: "مدرسة قطر الابتدائية والإعدادية",
    schoolNameEn: "Qatar School for Boys",
    assignedGrades: ["Grade 5", "Grade 6", "Grade 7", "Grade 8"],
    subjectAr: "اللغة العربية والتربية اللغوية",
    titleAr: "منسق مادة اللغة العربية والخطابة"
  },
  // Ministry Official / Admin User
  {
    id: "user-admin-moehe",
    nameAr: "د. خالد بن ناصر السليطي",
    nameEn: "Dr. Khalid Nasser Al-Sulaiti",
    email: "k.sulaiti@moe.edu.qa",
    role: "admin",
    schoolNameAr: "وزارة التربية والتعليم والتعليم العالي 🇶🇦",
    schoolNameEn: "Ministry of Education and Higher Education",
    titleAr: "مستشار التوجيه التربوي ورعاية الموهوبين الوطني",
    subjectAr: "قطاع الشؤون التعليمية ولجنة الخطابة الوطنية"
  }
];

// Sample Ministry Gifted / Talent Nomination Records (الموهوبين درجة أولى)
export const INITIAL_TALENT_RECORDS: TalentNominationRecord[] = [
  {
    id: "tal-001",
    studentId: "student-g6-1",
    nameAr: "ناصر بن مبارك الهاجري",
    nameEn: "Nasser Mubarak Al-Hajri",
    grade: "Grade 6",
    section: "السادس (ب)",
    schoolNameAr: "مدرسة قطر الابتدائية للبنين",
    oratoryScore: 96,
    bodyLanguageScore: 94,
    eyeContactScore: 98,
    wpm: 128,
    vocalPitchScore: 95,
    overallMastery: 96,
    tier: "Tier 1 - الموهبة الذهبية الأولى",
    nominationStatus: "معتمد للانتداب الوطني",
    speechTitle: "رسالة إلى الغد: فخر الأجداد وعزم الأحفاد",
    aiNotes: "نبرة صوتية جهورية وثبات منبري فائق مع حركة يدين انسيابية وتواصل بصري متوازن بنسبة 98% وفق معايير الخطابة القطرية.",
    dateNominated: "2026-08-15"
  },
  {
    id: "tal-002",
    studentId: "student-g12-1",
    nameAr: "سارة بنت خالد المهندي",
    nameEn: "Sara Khalid Al-Mohannadi",
    grade: "Grade 12",
    section: "الثاني عشر (علمي 1)",
    schoolNameAr: "مدرسة البيان الثانوية للبنات",
    oratoryScore: 98,
    bodyLanguageScore: 97,
    eyeContactScore: 99,
    wpm: 135,
    vocalPitchScore: 98,
    overallMastery: 98,
    tier: "Tier 1 - الموهبة الذهبية الأولى",
    nominationStatus: "معتمد للانتداب الوطني",
    speechTitle: "قطر في صدارة المعرفة ورؤية 2030",
    aiNotes: "فصاحة بيانية منقطعة النظير، تحكم استثنائي في علامات الترقيم والسكتات البلاغية وإتقان مخارج الحروف الصعبة.",
    dateNominated: "2026-08-18"
  },
  {
    id: "tal-003",
    studentId: "student-g8-1",
    nameAr: "راشد بن جابر المري",
    nameEn: "Rashid Jaber Al-Marri",
    grade: "Grade 8",
    section: "الثامن (ب)",
    schoolNameAr: "مدرسة الدوحة الإعدادية للبنين",
    oratoryScore: 92,
    bodyLanguageScore: 90,
    eyeContactScore: 94,
    wpm: 122,
    vocalPitchScore: 91,
    overallMastery: 92,
    tier: "Tier 1 - الموهبة الذهبية الأولى",
    nominationStatus: "بانتظار المقابلة الوزارية",
    speechTitle: "قيم الفروسية والأخلاق في الشعر النبطي والفصيح",
    aiNotes: "حضور قوي على المنبر وطبقة صوتية دافئة مع تقيد دقيق بالحركات الإعرابية التامة.",
    dateNominated: "2026-08-20"
  },
  {
    id: "tal-004",
    studentId: "student-g3-1",
    nameAr: "مريم بنت حمد الكواري",
    nameEn: "Maryam Hamad Al-Kuwari",
    grade: "Grade 3",
    section: "الثالث (أ)",
    schoolNameAr: "مدرسة الشفاء بنت عوف الابتدائية للبنات",
    oratoryScore: 89,
    bodyLanguageScore: 88,
    eyeContactScore: 91,
    wpm: 110,
    vocalPitchScore: 90,
    overallMastery: 90,
    tier: "Tier 2 - الموهبة الواعدة",
    nominationStatus: "مكتمل الترشيح",
    speechTitle: "حب الوطن والاعتزاز بالعلم القطري الأدعم",
    aiNotes: "نطق واضح جداً لحروف المد والتنوين مع إيماءات وجهية معبرة تناسب الفئة العمرية.",
    dateNominated: "2026-08-21"
  }
];
