export interface Dictionary {
  portalTitle: string;
  portalSubtitle: string;
  dashboard: string;
  speechPractice: string;
  academicReports: string;
  settings: string;
  currentStudent: string;
  grade: string;
  startPractice: string;
  stopPractice: string;
  listening: string;
  targetScript: string;
  originalTargetText: string;
  transcribedText: string;
  accuracyRate: string;
  generateFeedback: string;
  generatingFeedback: string;
  latency: string;
  aiAnalysis: string;
  strengths: string;
  recommendations: string;
  overallAccuracy: string;
  averageScores: string;
  performanceOverTime: string;
  recentAttempts: string;
  noAttemptsYet: string;
  reportCardTitle: string;
  generateReport: string;
  reportsSubtitle: string;
  saveSettings: string;
  resetDefaults: string;
  defaultLanguage: string;
  studentGrade: string;
  customizeMeasurements: string;
  editArabicTargetText: string;
  editEnglishTargetText: string;
  correct: string;
  mispronounced: string;
  omitted: string;
  arabic: string;
  english: string;
  overallScore: string;
  reportSummary: string;
  developmentalActionPlan: string;
  loading: string;
  placeholderReadSomeText: string;
  speechNotSupported: string;
  microphoneAccessDenied: string;
  latencyTitle: string;
  pronunciationNotes: string;
  wordsMatching: string;
  scoreExplanation: string;
  feedbackButtonDesc: string;
  curriculumStandards: string;
  standardsMastery: string;
  studentLevel: string;
  xpPoints: string;
  dailyStreak: string;
  badgesAndAchievements: string;
  dailyQuest: string;
  practiceStandard: string;
  mastered: string;
  developing: string;
  needsPractice: string;
  notStarted: string;
  competencies: string;
  levelTitle: string;
  standardCode: string;
  oratoryStage: string;
  oratoryStageSubtitle: string;
  visualAnalysis: string;
  speechAnalysis: string;
  cameraFeed: string;
  eyeContact: string;
  postureDetection: string;
  handsDetection: string;
  speechSpeed: string;
  fillerWords: string;
  sentimentAndPsychology: string;
  lexicalDiversity: string;
  liveTranscript: string;
  aiSpeakingPrompts: string;
  contentAnalysis: string;
  stopSession: string;
  startSession: string;
  home: string;
  stage1Title: string;
  stage1Desc: string;
  stage2Title: string;
  stage2Desc: string;
  stage3Title: string;
  stage3Desc: string;
  enterStage1: string;
  enterStage2: string;
  enterStage3: string;
  quickWorkout: string;
  quickWorkoutDesc: string;
  expertsCouncil: string;
  advisoryCouncilTab: string;
  expertNetworkTab: string;
  expertEvaluation: string;
}

export const translations: Record<"ar" | "en", Dictionary> = {
  ar: {
    portalTitle: "منصة إلقاء - المسرع الوطني للخطابة وفصاحة اللسان",
    portalSubtitle: "نظام الذكاء الاصطناعي القطري لتقييم الإلقاء، مخارج الحروف، ولغة الجسد وفق المعايير الوطنية",
    home: "الرئيسية وبوابات الإلقاء",
    stage1Title: "المرحلة الأولى: مختبر التأسيس والفصاحة الصوتية",
    stage1Desc: "صقل مخارج الحروف، الضبط الإعرابي، والطلاقة اللغوية عبر 13 صفاً دراسياً من الروضة للثانوية.",
    stage2Title: "المرحلة الثانية: مسرح الإلقاء والمنبر الحي",
    stage2Desc: "استوديو تفاعلي بالذكاء الاصطناعي لتحليل لغة الجسد، التواصل البصري، والملقن الذكي اللحظي.",
    stage3Title: "المرحلة الثالثة: الذكاء الأكاديمي والتقارير الوطنية",
    stage3Desc: "لوحة مؤشرات إتقان كفايات المنهج القطري وكشوفات التقييم الرسمية المعتمدة لوزارة التربية.",
    enterStage1: "دخول مختبر التأسيس القرائي ➜",
    enterStage2: "اعتلاء مسرح الإلقاء والمنبر ➜",
    enterStage3: "استعراض لوحة الكفايات والتقارير ➜",
    quickWorkout: "التدريب الصوتي السريع لليوم",
    quickWorkoutDesc: "تحدٍ صوتي مدته دقيقة واحدة لتعزيز طلاقة اللسان وتثبيت مخارج الحروف.",
    dashboard: "لوحة المتابعة ومعايير المناهج",
    speechPractice: "مختبر التأسيس القرائي والصوتي",
    oratoryStage: "مسرح الإلقاء والخطابة والمنبر",
    oratoryStageSubtitle: "استوديو التحليل الحي للخطابة ولغة الجسد والتواصل البصري بالذكاء الاصطناعي",
    visualAnalysis: "التحليل البصري والحركي",
    speechAnalysis: "تحليل نبرة الصوت والكلام",
    cameraFeed: "الكاميرا الذكية",
    eyeContact: "التواصل البصري",
    postureDetection: "استقامة الجسد والوقفة",
    handsDetection: "حركات وإيماءات اليدين",
    speechSpeed: "معدل السرعة (كلمة/دقيقة)",
    fillerWords: "الكلمات الحشوية والتوقفات",
    sentimentAndPsychology: "نبرة التأثير والتحليل النفسي",
    lexicalDiversity: "الثراء والمعجم اللغوي",
    liveTranscript: "التفريغ النصي اللحظي",
    aiSpeakingPrompts: "توجيهات الملقن الذكي اللحظية",
    contentAnalysis: "تحليل المحتوى وقوة الحجة",
    stopSession: "إنهاء الجلسة وعرض التقييم",
    startSession: "اعتلاء المنبر وبدء الإلقاء",
    academicReports: "التقارير الأكاديمية الوزارية",
    settings: "إعدادات المنصة والمعايير",

    currentStudent: "الطالب الحالي",
    grade: "الصف الدراسي",
    startPractice: "بدء التسجيل الصوتي",
    stopPractice: "إيقاف التسجيل",
    listening: "جاري الاستماع... يرجى القراءة الآن",
    targetScript: "النص المطلوب قراءته",
    originalTargetText: "النص المستهدف:",
    transcribedText: "التحليل الصوتي اللحظي للكلام المنطوق:",
    accuracyRate: "نسبة التطابق اللفظي البصري",
    generateFeedback: "توليد تقييم صوتي مدعم بالذكاء الاصطناعي",
    generatingFeedback: "جاري تحليل نبرة الصوت ومخارج الحروف مع جميناي...",
    latency: "زمن الاستجابة اللحظي",
    aiAnalysis: "تقرير تحليل النطق المفصل (Gemini AI)",
    strengths: "نقاط القوة اللفظية واللغوية",
    recommendations: "توجيهات مخصصة لممارسة النطق",
    overallAccuracy: "دقة النطق الإجمالية",
    averageScores: "متوسط تقييم المهارات",
    performanceOverTime: "تطور الأداء الدراسي عبر الزمن",
    recentAttempts: "سجل محاولات القراءة الأخيرة",
    noAttemptsYet: "لا توجد محاولات مسجلة بعد. ابدأ ممارسة النطق الصوتي الآن!",
    reportCardTitle: "تقرير الأداء الأكاديمي واللغوي الشامل للطلاب",
    generateReport: "تحليل وتوليد التقرير بالذكاء الاصطناعي",
    reportsSubtitle: "المتوسطات الحسابية لتقييم المهارات وخطط التطوير الأكاديمية",
    saveSettings: "حفظ التغييرات",
    resetDefaults: "استعادة الإعدادات الافتراضية",
    defaultLanguage: "اللغة الافتراضية لتقييم الصوت",
    studentGrade: "المستوى الأكاديمي للطالب",
    customizeMeasurements: "تخصيص مؤشرات القياس (النقاط الإرشادية والمهارات)",
    editArabicTargetText: "تعديل نص ممارسة اللغة العربية",
    editEnglishTargetText: "تعديل نص ممارسة اللغة الإنجليزية",
    correct: "صحيح",
    mispronounced: "بحاجة لتحسين",
    omitted: "لم يُنطق",
    arabic: "اللغة العربية",
    english: "اللغة الإنجليزية",
    overallScore: "الدرجة الإجمالية",
    reportSummary: "الملخص التقييمي",
    developmentalActionPlan: "خطة العمل التطويرية المقترحة للمستقبل",
    loading: "جاري التحميل الأكاديمي...",
    placeholderReadSomeText: "الرجاء النقر على زر البدء وقراءة النص المكتوب بصوت مسموع وواضح.",
    speechNotSupported: "ميزة التعرف على الصوت غير مدعومة في هذا المتصفح. الرجاء استخدام Chrome أو Safari أو Edge لضمان عمل الميزة بشكل كامل.",
    microphoneAccessDenied: "يرجى السماح بالوصول إلى الميكروفون من إعدادات المتصفح لبدء ممارسة القراءة الصوتية.",
    latencyTitle: "سرعة المعالجة اللحظية",
    pronunciationNotes: "ملاحظات مخارج الحروف وتصحيحات التشكيل والحركات اللغوية",
    wordsMatching: "الكلمات المتطابقة",
    scoreExplanation: "يتم حساب التطابق بشكل لحظي محليًا (أقل من ٢٠٠ مللي ثانية)، ثم تدقيقه لغويًا عبر Gemini.",
    feedbackButtonDesc: "توليد مراجعة دقيقة لمخارج الحروف والحركات الإعرابية (الفتحة، الضمة، الكسرة)",
    curriculumStandards: "معايير المناهج التعليمية لدولة قطر",
    standardsMastery: "خريطة إتقان معايير المنهج الدراسي",
    studentLevel: "مستوى الإتقان",
    xpPoints: "نقاط التميز (XP)",
    dailyStreak: "سلسلة الحماس اليومي",
    badgesAndAchievements: "أوسمة الإنجاز والتميز المعياري",
    dailyQuest: "تحدي اليوم المعياري",
    practiceStandard: "تدرب على المعيار الآن",
    mastered: "متمكن (متقن)",
    developing: "في طور النمو",
    needsPractice: "يحتاج تدريب",
    notStarted: "لم يبدأ",
    competencies: "الكفايات التعليمية القطرية",
    levelTitle: "رتبة الطالب",
    standardCode: "رمز المعيار",
    expertsCouncil: "الخبراء والمستشارون",
    advisoryCouncilTab: "مجلس إلقاء الاستشاري",
    expertNetworkTab: "خبراء إلقاء",
    expertEvaluation: "التقييم مع خبير",
  },
  en: {
    portalTitle: "ILQAA Platform - National Public Speaking Accelerator",
    portalSubtitle: "Qatari AI System for Public Speaking, Articulation & Body Language Evaluation under National Standards",
    home: "Home & Stage Gates",
    stage1Title: "Stage 1: Foundation & Articulation Lab",
    stage1Desc: "Master phonetics, diacritics, and reading fluency across 13 grade levels from KG to Grade 12.",
    stage2Title: "Stage 2: Oratory & Public Speaking Stage",
    stage2Desc: "Interactive AI stage analyzing posture, eye contact, hand gestures, and live smart prompting.",
    stage3Title: "Stage 3: Academic Intelligence & National Analytics",
    stage3Desc: "MoEHE curriculum mastery dashboard, automated skill analytics, and official report cards.",
    enterStage1: "Enter Articulation Lab ➜",
    enterStage2: "Take the Oratory Stage ➜",
    enterStage3: "Explore Analytics & Reports ➜",
    quickWorkout: "Daily Speech Workout",
    quickWorkoutDesc: "A quick 1-minute vocal drill to reinforce articulation and speech rhythm.",
    dashboard: "Curriculum Standards & Insights",
    speechPractice: "Phonics & Pronunciation Lab",
    oratoryStage: "Oratory & Public Speaking Stage",
    oratoryStageSubtitle: "AI Live Oratory Studio for Body Language, Eye Contact & Rhetorical Delivery",
    visualAnalysis: "Visual & Motion Analysis",
    speechAnalysis: "Acoustic & Voice Analysis",
    cameraFeed: "Smart Camera Feed",
    eyeContact: "Eye Contact & Gaze",
    postureDetection: "Posture & Stance",
    handsDetection: "Hand Gestures & Movement",
    speechSpeed: "Pace (WPM)",
    fillerWords: "Filler Words & Pauses",
    sentimentAndPsychology: "Tone Impact & Psychology",
    lexicalDiversity: "Lexical & Vocabulary Richness",
    liveTranscript: "Live Transcript Stream",
    aiSpeakingPrompts: "Smart AI Teleprompter Prompts",
    contentAnalysis: "Content Analysis & Argumentation",
    stopSession: "Finish Speech & View Scorecard",
    startSession: "Take the Stage & Begin Speech",
    academicReports: "Ministry Academic Reports",
    settings: "Platform Standards Settings",

    currentStudent: "Current Student",
    grade: "Grade",
    startPractice: "Start Speaking",
    stopPractice: "Stop Recording",
    listening: "Listening... Please read now",
    targetScript: "Target Script",
    originalTargetText: "Expected Script:",
    transcribedText: "Real-time Spoken Transcript:",
    accuracyRate: "Word Match Accuracy Rate",
    generateFeedback: "Generate AI Speech Diagnosis",
    generatingFeedback: "Analyzing acoustics and vowel pronunciation with Gemini...",
    latency: "Processing Latency",
    aiAnalysis: "Speech Evaluation Report (Gemini AI)",
    strengths: "Speech & Linguistic Strengths",
    recommendations: "Pronunciation Practice Tips",
    overallAccuracy: "Overall Pronunciation Accuracy",
    averageScores: "Skill Category Averages",
    performanceOverTime: "Performance Progress Over Time",
    recentAttempts: "Recent Reading Practice History",
    noAttemptsYet: "No practice history recorded yet. Head over to the Voice Practice tab to start!",
    reportCardTitle: "Comprehensive Academic & Voice Report Card",
    generateReport: "Generate AI Progress Summary",
    reportsSubtitle: "Statistical averages and personalized educational action plans",
    saveSettings: "Save Settings",
    resetDefaults: "Reset to Defaults",
    defaultLanguage: "Default Speech Evaluation Language",
    studentGrade: "Student Grade Level",
    customizeMeasurements: "Customize Voice & Subject Metrics (Bullet Points)",
    editArabicTargetText: "Edit Arabic Practice Text",
    editEnglishTargetText: "Edit English Practice Text",
    correct: "Correct",
    mispronounced: "Needs Improvement",
    omitted: "Omitted",
    arabic: "Arabic",
    english: "English",
    overallScore: "Overall Score",
    reportSummary: "Executive Progress Summary",
    developmentalActionPlan: "Personalized Developmental Action Plan",
    loading: "Loading Report...",
    placeholderReadSomeText: "Please click Start Speaking and read the script aloud clearly.",
    speechNotSupported: "Speech Recognition is not supported in this browser. Please use Google Chrome, Apple Safari, or Microsoft Edge.",
    microphoneAccessDenied: "Please grant microphone access permission in your browser to practice reading aloud.",
    latencyTitle: "Real-time Feedback Speed",
    pronunciationNotes: "Pronunciation Correction & Diacritics/Vowel Notes",
    wordsMatching: "Words matching target",
    scoreExplanation: "Speech match is calculated locally under 200ms, and contextually analyzed by Gemini AI.",
    feedbackButtonDesc: "Get automated feedback on pronunciation, grammar, and voice accents.",
    curriculumStandards: "Qatar Educational Curriculum Standards",
    standardsMastery: "Curriculum Standards Mastery Map",
    studentLevel: "Mastery Level",
    xpPoints: "Mastery XP",
    dailyStreak: "Daily Streak",
    badgesAndAchievements: "Badges & Standard Achievements",
    dailyQuest: "Daily Standard Quest",
    practiceStandard: "Practice Standard Now",
    mastered: "Mastered",
    developing: "Developing",
    needsPractice: "Needs Focus",
    notStarted: "Not Started",
    competencies: "Qatar National Competencies",
    levelTitle: "Rank Title",
    standardCode: "Standard Code",
    expertsCouncil: "Experts & Advisory Council",
    advisoryCouncilTab: "ILQAA Advisory Council",
    expertNetworkTab: "ILQAA Expert Network",
    expertEvaluation: "Expert Evaluation",
  }
};
