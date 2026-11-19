export interface AcademicExpert {
  id: string;
  fullNameArabic: string;
  fullNameEnglish: string;
  photo: string;
  titleArabic: string;
  titleEnglish: string;
  country: string;
  countryFlag: string;
  organization: string;
  organizationEn: string;
  languages: string[];
  specialties: string[];
  specialtiesEn: string[];
  educationLevels: string[];
  bioArabic: string;
  bioEnglish: string;
  competencies: string[]; // e.g. "سلامة التعبير", "الطلاقة", "بناء الأفكار", "الإلقاء", "الحضور", "الإقناع", "المناظرات", "العروض الأكاديمية"
  councilMember: boolean;
  expertNetworkMember: boolean;
  councilCategory?: string; // e.g. "اللغة العربية واللسانيات", "المناهج التعليمية للغة العربية", etc.
  councilCategoryEn?: string;
  featured: boolean;
  status: "active" | "emeritus" | "fellow";
  
  // Future fields for full marketplace (dormant in current UI as instructed)
  availability?: {
    days: string[];
    hoursPerWeek: number;
    acceptingNewStudents: boolean;
  };
  sessionPrice?: number;
  currency?: string;
  rating?: number;
  reviewsCount?: number;
  bookingUrl?: string;
  expertAssessmentReports?: string[];
  studentAssignments?: string[];
  experienceYears?: number;
  academicDegrees?: {
    degree: string;
    institution: string;
    year: string;
  }[];
  certifications?: string[];
  evaluationFocusAreas?: string[];
}

export const ADVISORY_COUNCIL_CATEGORIES = [
  { id: "all", nameAr: "كافة المجالات الأكاديمية", nameEn: "All Academic Disciplines" },
  { id: "linguistics", nameAr: "اللغة العربية واللسانيات", nameEn: "Arabic Language & Linguistics" },
  { id: "curriculum", nameAr: "المناهج التعليمية للغة العربية", nameEn: "Arabic Curriculum" },
  { id: "pedagogy", nameAr: "علوم التربية والطرائق التعليمية", nameEn: "Education & Pedagogy" },
  { id: "oratory", nameAr: "الخطابة والبلاغة التواصلية", nameEn: "Public Speaking & Oratory" },
  { id: "oral_comm", nameAr: "التواصل الشفهي والحوار", nameEn: "Oral Communication" },
  { id: "debate", nameAr: "المناظرة وبناء الحجة", nameEn: "Debate & Argumentation" },
  { id: "psychology", nameAr: "علم النفس التربوي والتواصلي", nameEn: "Educational Psychology" },
  { id: "assessment", nameAr: "التقويم والقياس التربوي واللغوي", nameEn: "Assessment & Measurement" },
  { id: "early_childhood", nameAr: "النمو اللغوي للطفولة المبكرة", nameEn: "Early Childhood Language Development" },
  { id: "higher_ed", nameAr: "التواصل في التعليم العالي", nameEn: "Higher Education Communication" },
] as const;

export const EXPERT_NETWORK_FILTERS = [
  { id: "all", nameAr: "جميع الخبراء", nameEn: "All Experts" },
  { id: "arabic_language", nameAr: "اللغة العربية وسلامة التعبير", nameEn: "Arabic Language" },
  { id: "public_speaking", nameAr: "الخطابة والإلقاء المنبري", nameEn: "Public Speaking" },
  { id: "voice_delivery", nameAr: "الصوت والنبر والتلوين النغمي", nameEn: "Voice & Delivery" },
  { id: "debate_persuasion", nameAr: "المناظرة والإقناع", nameEn: "Debate & Persuasion" },
  { id: "presentation_skills", nameAr: "مهارات العرض والتقديم", nameEn: "Presentation Skills" },
  { id: "educational_comm", nameAr: "التواصل التربوي والمدرسي", nameEn: "Educational Communication" },
  { id: "storytelling", nameAr: "السرد القصصي والبيان", nameEn: "Storytelling" },
  { id: "academic_presentation", nameAr: "العروض الأكاديمية والبحثية", nameEn: "Academic Presentation" },
] as const;

export const ALL_EXPERTS: AcademicExpert[] = [
  // 1. Advisory Council Chair & Arabic Linguistics
  {
    id: "exp-council-01",
    fullNameArabic: "أ.د. عبد الله بن محمد الأنصاري",
    fullNameEnglish: "Prof. Dr. Abdullah Al-Ansari",
    photo: "/src/assets/images/expert_prof_linguistics_1792351712738.jpg",
    titleArabic: "أستاذ اللسانيات التطبيقية وفقه اللغة المقارن",
    titleEnglish: "Professor of Applied Linguistics & Philology",
    country: "قطر",
    countryFlag: "🇶🇦",
    organization: "جامعة قطر - كلية الآداب والعلوم",
    organizationEn: "Qatar University - College of Arts and Sciences",
    languages: ["العربية (اللغة الأم)", "الإنجليزية"],
    specialties: ["اللغة العربية وسلامة التعبير", "العروض الأكاديمية والبحثية"],
    specialtiesEn: ["Arabic Language & Grammar", "Academic Presentation"],
    educationLevels: ["المرحلة الثانوية", "التعليم الجامعي", "الدراسات العليا"],
    bioArabic: "خبير معتمد في بناء معايير الكفاءة اللغوية والتواصلية في العالم العربي، ترأس لجان تدقيق المناهج ومراجعة الإطار الوطني لمعايير اللغة العربية في وزارة التربية والتعليم والتعليم العالي بدولة قطر.",
    bioEnglish: "Distinguished scholar in Arabic linguistics with 25+ years leading academic frameworks and Arabic competency standards for regional education ministries.",
    competencies: [
      "سلامة التعبير",
      "الطلاقة",
      "بناء الأفكار",
      "العروض الأكاديمية"
    ],
    councilMember: true,
    expertNetworkMember: true,
    councilCategory: "اللغة العربية واللسانيات",
    councilCategoryEn: "Arabic Language & Linguistics",
    featured: true,
    status: "active",
    experienceYears: 28,
    academicDegrees: [
      { degree: "دكتوراه الدولة في اللسانيات التطبيقية", institution: "جامعة السوربون - باريس", year: "1998" },
      { degree: "ماجستير في فقه اللغة ونحوها", institution: "جامعة القاهرة", year: "1993" }
    ],
    certifications: [
      "وسام التميز الأكاديمي للغة العربية - الدوحة",
      "محكم رئيسي في جائزة كتارا للرواية واللغة العربية"
    ],
    evaluationFocusAreas: [
      "سلامة الضبط النحوي والإعراب",
      "فصاحة المفردات والنسق البلاغي",
      "المنهجية العلمية في بناء الفكرة",
      "رصانة التعبير ومخارج الحروف"
    ]
  },

  // 2. Public Speaking & Oratory Scholar
  {
    id: "exp-council-02",
    fullNameArabic: "د. راشد بن ناصر الكواري",
    fullNameEnglish: "Dr. Rashid Al-Kuwari",
    photo: "/src/assets/images/expert_scholar_oratory_1792351713324.jpg",
    titleArabic: "خبير الخطابة والبلاغة التواصلية والمنبرية",
    titleEnglish: "Senior Oratory & Public Discourse Specialist",
    country: "قطر",
    countryFlag: "🇶🇦",
    organization: "مركز قطر للقيادات ومعهد الدوحة للدراسات",
    organizationEn: "Qatar Leadership Centre & Doha Institute",
    languages: ["العربية", "الإنجليزية"],
    specialties: ["الخطابة والإلقاء المنبري", "مهارات العرض والتقديم", "الصوت والنبر والتلوين النغمي"],
    specialtiesEn: ["Public Speaking", "Presentation Skills", "Voice & Prosody"],
    educationLevels: ["المرحلة الإعدادية", "المرحلة الثانوية", "القيادات الشبابية"],
    bioArabic: "مستشار تدريب منبري وخطابي للوفود الرسمية والمؤتمرات الدولية، عمل على تطوير نموذج منصة إلقاء لقياس لغة الجسد، الاتزان المنبري، والوقفات البلاغية المؤثرة.",
    bioEnglish: "Keynote orator and ministerial presentation coach specializing in nonverbal stage presence, strategic rhetorical pauses, and audience persuasion.",
    competencies: [
      "الإلقاء",
      "الحضور",
      "الطلاقة",
      "الإقناع"
    ],
    councilMember: true,
    expertNetworkMember: true,
    councilCategory: "الخطابة والبلاغة التواصلية",
    councilCategoryEn: "Public Speaking & Oratory",
    featured: true,
    status: "active",
    experienceYears: 20,
    academicDegrees: [
      { degree: "دكتوراه في الدراسات الاتصالية والإعلامية", institution: "جامعة ليدز - بريطانيا", year: "2006" },
      { degree: "ماجستير البلاغة العربية ونقد الخطاب", institution: "جامعة اليرموك", year: "2001" }
    ],
    certifications: [
      "مدرب دولي معتمد في فن الخطابة والإلقاء المؤثر",
      "محكم رئيسي في بطولات الخطابة المدرسية الوطنية"
    ],
    evaluationFocusAreas: [
      "مسح زوايا الجمهور والاتصال البصري (360°)",
      "ثبات الوقفة المنبرية وحركات اليدين التعبيرية",
      "التحكم في سرعة الإلقاء وتجنب الرتابة (Monotone)",
      "توظيف الوقفات الاستراتيجية لتثبيت الرسائل"
    ]
  },

  // 3. Education, Pedagogy & Assessment
  {
    id: "exp-council-03",
    fullNameArabic: "أ.د. أمل بنت أحمد الخاطر",
    fullNameEnglish: "Prof. Dr. Amal Al-Khater",
    photo: "/src/assets/images/expert_prof_pedagogy_1792351714191.jpg",
    titleArabic: "أستاذة القياس والتقويم وتطوير مناهج اللغة العربية",
    titleEnglish: "Professor of Assessment, Pedagogy & Curricula",
    country: "قطر",
    countryFlag: "🇶🇦",
    organization: "كلية التربية - جامعة قطر",
    organizationEn: "College of Education - Qatar University",
    languages: ["العربية", "الإنجليزية", "الفرنسية"],
    specialties: ["المناهج التعليمية للغة العربية", "التواصل التربوي والمدرسي"],
    specialtiesEn: ["Curriculum Standards", "Educational Communication"],
    educationLevels: ["الروضة", "المرحلة الابتدائية", "المرحلة الإعدادية"],
    bioArabic: "قادت مشاريع وطنية في تصميم مصفوفات الكفايات التعبيرية والشفهية للمراحل التعليمية من الروضة حتى الثاني عشر، وخبيرة في ربط التقييم الرقمي الذكي بالتحصيل الأكاديمي الحقيقي.",
    bioEnglish: "Pioneering researcher in psychometric assessment and oral rubrics for K-12 Arabic language curricula across the GCC.",
    competencies: [
      "سلامة التعبير",
      "بناء الأفكار",
      "العروض الأكاديمية"
    ],
    councilMember: true,
    expertNetworkMember: false,
    councilCategory: "التقويم والقياس التربوي واللغوي",
    councilCategoryEn: "Assessment & Measurement",
    featured: true,
    status: "active",
    experienceYears: 24,
    academicDegrees: [
      { degree: "دكتوراه في المناهج وطرائق تدريس اللغة العربية", institution: "جامعة مانشستر", year: "2002" }
    ],
    certifications: [
      "مستشارة تطوير معايير PIRLS و TIMSS الدولية",
      "عضو الجمعية الدولية للتقويم التربوي (IAEA)"
    ],
    evaluationFocusAreas: [
      "ملاءمة المحتوى للمرحلة النمائية والعمرية",
      "التدرج المنطقي للأفكار في الخطاب الشفهي",
      "معايير قياس الطلاقة ومؤشرات الإتقان"
    ]
  },

  // 4. Debate & Persuasion Master
  {
    id: "exp-council-04",
    fullNameArabic: "د. فهد بن سلطان المري",
    fullNameEnglish: "Dr. Fahad Al-Marri",
    photo: "/src/assets/images/expert_coach_debate_1792351714250.jpg",
    titleArabic: "خبير المناظرات الفكرية وبناء الحجة والبرهان",
    titleEnglish: "Director of Debate, Argumentation & Logic",
    country: "قطر",
    countryFlag: "🇶🇦",
    organization: "مركز مناظرات قطر - مؤسسة قطر",
    organizationEn: "QatarDebate - Qatar Foundation",
    languages: ["العربية", "الإنجليزية"],
    specialties: ["المناظرة والإقناع", "العروض الأكاديمية والبحثية"],
    specialtiesEn: ["Debate & Persuasion", "Academic Presentation"],
    educationLevels: ["المرحلة الثانوية", "التعليم الجامعي"],
    bioArabic: "مدرب معتمد لمنتخبات قطر الوطنية الفائزة ببطولات المناظرات الدولية، مؤلف دليل المنطق والبلاغة للمتحدثين الشباب، ومصمم نموذج ثالوث الإقناع الأرسطي في إلقاء.",
    bioEnglish: "International head coach of Qatar National Debate Team, authority on Aristotelian rhetorical proofs (Logos, Ethos, Pathos) and persuasive refutation.",
    competencies: [
      "بناء الأفكار",
      "الإقناع",
      "المناظرات",
      "الطلاقة"
    ],
    councilMember: true,
    expertNetworkMember: true,
    councilCategory: "المناظرة وبناء الحجة",
    councilCategoryEn: "Debate & Argumentation",
    featured: true,
    status: "active",
    experienceYears: 17,
    academicDegrees: [
      { degree: "دكتوراه في فلسفة المنطق وحجاج الخطاب", institution: "جامعة أكسفورد", year: "2009" }
    ],
    certifications: [
      "كبير حكام البطولة الدولية لمناظرات الجامعات باللغة العربية",
      "مدرب معتمد في التفكير النقدي وتفنيد الحجج"
    ],
    evaluationFocusAreas: [
      "بناء الأطروحة (Thesis Construction)",
      "توظيف الأدلة وتجنب المغالطات المنطقية",
      "قوة التفنيد والدفاع عن الحجة",
      "توازن الإقناع المنطقي مع التأثير العاطفي"
    ]
  },

  // 5. Early Childhood & Phonetics Specialist (Advisory Council)
  {
    id: "exp-council-05",
    fullNameArabic: "د. هدى بنت عبد العزيز النعيمي",
    fullNameEnglish: "Dr. Huda Al-Nuaimi",
    photo: "/src/assets/images/expert_prof_pedagogy_1792351714191.jpg",
    titleArabic: "استشارية النمو اللغوي وعلاج اضطرابات النطق المبكرة",
    titleEnglish: "Consultant in Early Language Acquisition & Phonology",
    country: "قطر",
    countryFlag: "🇶🇦",
    organization: "مؤسسة حمد الطبية ومعهد التطور الطفولي",
    organizationEn: "Hamad Medical Corporation - Child Development",
    languages: ["العربية", "الإنجليزية"],
    specialties: ["اللغة العربية وسلامة التعبير", "التواصل التربوي والمدرسي"],
    specialtiesEn: ["Phonetics", "Early Education"],
    educationLevels: ["الروضة", "المرحلة الابتدائية"],
    bioArabic: "متخصصة في دراسة اكتساب الأصوات اللغوية عند أطفال مرحلة الطفولة المبكرة والصفوف التأسيسية، وضعت الإطار الصوتي لمختبر التأسيس القرائي في إلقاء.",
    bioEnglish: "Pediatric phonologist shaping foundational articulation models, phoneme distinction, and developmental vocal training in early school years.",
    competencies: [
      "سلامة التعبير",
      "الطلاقة",
      "الإلقاء"
    ],
    councilMember: true,
    expertNetworkMember: false,
    councilCategory: "النمو اللغوي للطفولة المبكرة",
    councilCategoryEn: "Early Childhood Language Development",
    featured: false,
    status: "active",
    experienceYears: 19,
    evaluationFocusAreas: [
      "مخارج الحروف الحلقية واللسانية",
      "التفريق الصوتي بين الحركات الطويلة والقصيرة",
      "تعزيز الثقة في التعبير المبكر"
    ]
  },

  // 6. Voice, Prosody & Delivery Coach (Expert Network Focus)
  {
    id: "exp-net-06",
    fullNameArabic: "أ. ماجد بن سعود السليطي",
    fullNameEnglish: "Majed Al-Sulaiti",
    photo: "/src/assets/images/expert_scholar_oratory_1792351713324.jpg",
    titleArabic: "مدرب الصوتيات الاحترافية والنبر الإذاعي والمسرحي",
    titleEnglish: "Vocal Delivery, Prosody & Broadcast Coach",
    country: "قطر",
    countryFlag: "🇶🇦",
    organization: "أكاديمية الجزيرة للإعلام",
    organizationEn: "Al Jazeera Media Institute",
    languages: ["العربية", "الإنجليزية"],
    specialties: ["الصوت والنبر والتلوين النغمي", "الخطابة والإلقاء المنبري", "السرد القصصي والبيان"],
    specialtiesEn: ["Voice & Delivery", "Public Speaking", "Storytelling"],
    educationLevels: ["المرحلة الإعدادية", "المرحلة الثانوية", "المرحلة الجامعية"],
    bioArabic: "مدرب أصوات إعلامية ومدرب سابق لفرسان المنبر والإذاعة المدرسية، متخصص في ضبط طبقات الصوت، التنفس الحجابي، وتلوين النغمات لتفادي الرتابة وإيصال المشاعر الحية.",
    bioEnglish: "Renowned broadcast vocal coach specializing in diaphragmatic breathing, pitch variety, pacing modulation, and expressive resonance.",
    competencies: [
      "الإلقاء",
      "الطلاقة",
      "الحضور",
      "سلامة التعبير"
    ],
    councilMember: false,
    expertNetworkMember: true,
    featured: true,
    status: "active",
    experienceYears: 16,
    evaluationFocusAreas: [
      "التلوين النغمي (Vocal Prosody) وتفادي النبر الرتيب",
      "التحكم في التنفس وعمق الصوت المنبري",
      "تطابق النبرة مع المعنى النفسي للجملة",
      "التخلص من كلمات الحشو والتردد الصوتي"
    ]
  },

  // 7. Storytelling & Expressive Presentation
  {
    id: "exp-net-07",
    fullNameArabic: "أ. نورة بنت سالم الهاجري",
    fullNameEnglish: "Noura Al-Hajri",
    photo: "/src/assets/images/expert_prof_pedagogy_1792351714191.jpg",
    titleArabic: "أخصائية السرد القصصي والبلاغة الأدبية والتأثير",
    titleEnglish: "Specialist in Narrative Storytelling & Expressive Arts",
    country: "قطر",
    countryFlag: "🇶🇦",
    organization: "متحف الفن الإسلامي ومكتبة قطر الوطنية",
    organizationEn: "Qatar National Library - Children & Youth",
    languages: ["العربية", "الإنجليزية"],
    specialties: ["السرد القصصي والبيان", "مهارات العرض والتقديم"],
    specialtiesEn: ["Storytelling", "Presentation Skills"],
    educationLevels: ["المرحلة الابتدائية", "المرحلة الإعدادية"],
    bioArabic: "رائدة في تعليم مهارات الحكواتي التفاعلي والإلقاء المسرحي للأطفال واليافعين، تُدرب الطلاب على تجسيد الشخصيات وبناء الحبكة التعبيرية المشوقة.",
    bioEnglish: "Creative storytelling educator cultivating captivating narrative arcs, emotive vocal shifts, and expressive hand gestures.",
    competencies: [
      "الطلاقة",
      "الإلقاء",
      "بناء الأفكار",
      "الحضور"
    ],
    councilMember: false,
    expertNetworkMember: true,
    featured: false,
    status: "active",
    experienceYears: 13,
    evaluationFocusAreas: [
      "بناء مدخل الحكاية المشوق (Hook)",
      "الانتقال السلس بين مشاهد السرد",
      "توظيف إيماءات الوجه لتعزيز الخيال"
    ]
  },

  // 8. Higher Education & Research Communication (Advisory Council)
  {
    id: "exp-council-08",
    fullNameArabic: "د. طارق بن خالد المهندي",
    fullNameEnglish: "Dr. Tareq Al-Mohannadi",
    photo: "/src/assets/images/expert_coach_debate_1792351714250.jpg",
    titleArabic: "أستاذ الاتصال الأكاديمي والخطاب العلمي الجامعي",
    titleEnglish: "Associate Professor of Academic & Scientific Discourse",
    country: "قطر",
    countryFlag: "🇶🇦",
    organization: "جامعة حمد بن خليفة",
    organizationEn: "Hamad Bin Khalifa University",
    languages: ["العربية", "الإنجليزية"],
    specialties: ["العروض الأكاديمية والبحثية", "مهارات العرض والتقديم"],
    specialtiesEn: ["Academic Presentation", "Presentation Skills"],
    educationLevels: ["المرحلة الثانوية", "التعليم الجامعي", "الدراسات العليا"],
    bioArabic: "خبير تدريب الباحثين على عرض أطروحاتهم العلمية في المؤتمرات الدولية ومسابقات (3MT - أطروحة في 3 دقائق)، وتحويل المفاهيم المعقدة إلى خطابات واضحة وجذابة.",
    bioEnglish: "Expert mentor for scholarly presentation, three-minute thesis delivery, and distilling technical findings into engaging academic talks.",
    competencies: [
      "العروض الأكاديمية",
      "بناء الأفكار",
      "الإقناع",
      "الطلاقة"
    ],
    councilMember: true,
    expertNetworkMember: true,
    councilCategory: "التواصل في التعليم العالي",
    councilCategoryEn: "Higher Education Communication",
    featured: false,
    status: "active",
    experienceYears: 18,
    evaluationFocusAreas: [
      "هيكلة العرض الأكاديمي ووضوح النتائج",
      "التوازن بين الشريحة البصرية والحديث الشفهي",
      "إدارة وقت العرض بدقة بالغة"
    ]
  },

  // 9. Educational Psychology & Communication Confidence
  {
    id: "exp-council-09",
    fullNameArabic: "د. شيخة بنت جاسم آل ثاني",
    fullNameEnglish: "Dr. Shaikha Al Thani",
    photo: "/src/assets/images/expert_prof_pedagogy_1792351714191.jpg",
    titleArabic: "استشارية علم النفس التربوي وتعزيز الثقة والتغلب على رهاب المسرح",
    titleEnglish: "Educational Psychologist & Stage Fright Specialist",
    country: "قطر",
    countryFlag: "🇶🇦",
    organization: "إدارة الصحة المدرسية والتربية الخاصة - وزارة التربية والتعليم",
    organizationEn: "MoEHE Student Counseling & Support",
    languages: ["العربية", "الإنجليزية"],
    specialties: ["التواصل التربوي والمدرسي", "الخطابة والإلقاء المنبري"],
    specialtiesEn: ["Educational Psychology", "Stage Presence"],
    educationLevels: ["كافة المراحل التعليمية (KG - الصف 12)"],
    bioArabic: "متخصصة في فك عقدة الخوف من الحديث أمام الجمهور (Glossophobia)، وتطوير استراتيجيات الهدوء العصبي والتنظيم الانفعالي للطلبة قبل الصعود إلى المنبر.",
    bioEnglish: "Clinical and school psychologist empowering youth to overcome stage fright, master internal calm, and project authentic self-assurance.",
    competencies: [
      "الحضور",
      "الطلاقة",
      "الإلقاء"
    ],
    councilMember: true,
    expertNetworkMember: true,
    councilCategory: "علم النفس التربوي والتواصلي",
    councilCategoryEn: "Educational Psychology",
    featured: false,
    status: "active",
    experienceYears: 15,
    evaluationFocusAreas: [
      "ثبات لغة الجسد وخفض التوتر المرئي",
      "تنظيم التنفس قبل وأثناء الحديث",
      "بناء الثقة الذاتية في نبرة الصوت"
    ]
  },

  // 10. Arabic Curriculum & Standardized Text (Advisory Council)
  {
    id: "exp-council-10",
    fullNameArabic: "أ.د. يوسف بن إبراهيم الباكر",
    fullNameEnglish: "Prof. Dr. Yousef Al-Baker",
    photo: "/src/assets/images/expert_prof_linguistics_1792351712738.jpg",
    titleArabic: "كبير خبراء مناهج اللغة العربية والتقويم التربوي الوطني",
    titleEnglish: "Senior Expert of Arabic Curricula & National Assessment",
    country: "قطر",
    countryFlag: "🇶🇦",
    organization: "قطاع شؤون التعليم - وزارة التربية والتعليم والتعليم العالي",
    organizationEn: "Ministry of Education & Higher Education - Qatar",
    languages: ["العربية"],
    specialties: ["المناهج التعليمية للغة العربية", "اللغة العربية وسلامة التعبير"],
    specialtiesEn: ["Arabic Curriculum", "Arabic Language"],
    educationLevels: ["المرحلة الابتدائية", "المرحلة الإعدادية", "المرحلة الثانوية"],
    bioArabic: "مؤلف ومراجع رئيسي لكتب اللغة العربية المعتمدة في المدارس الحكومية القطرية، أشرف على مواءمة نصوص منصة إلقاء مع المعايير التأسيسية الوطنية.",
    bioEnglish: "Lead curriculum architect for national Arabic textbooks, aligning ILQAA pedagogical rubrics with Qatar Ministry learning standards.",
    competencies: [
      "سلامة التعبير",
      "بناء الأفكار",
      "الطلاقة"
    ],
    councilMember: true,
    expertNetworkMember: false,
    councilCategory: "المناهج التعليمية للغة العربية",
    councilCategoryEn: "Arabic Curriculum",
    featured: false,
    status: "active",
    experienceYears: 30,
    evaluationFocusAreas: [
      "مطابقة المخرجات مع مؤشرات معايير وزارة التعليم",
      "سلامة الضبط النحوي للمنصوبات والمجرورات",
      "إتقان قراءة الشعر العربي الفصيح"
    ]
  }
];

/**
 * Intelligent Mock Recommendation Logic
 * Analyzes the student's performance profile (e.g. weaknesses in specific competencies)
 * and matches them with the top 2-3 expert advisors in the ILQAA network.
 */
export function getRecommendedExperts(options: {
  weaknessArea?: string; // e.g. "vocal", "presence", "grammar", "logic"
  oratoryScorecard?: {
    eyeContact?: number;
    posture?: number;
    vocalVariety?: number;
    structureAndLogic?: number;
    conviction?: number;
    overallScore?: number;
  };
  studentGrade?: string;
}): AcademicExpert[] {
  const { weaknessArea, oratoryScorecard, studentGrade } = options;

  // 1. If explicit weakness area provided:
  if (weaknessArea) {
    if (weaknessArea === "grammar" || weaknessArea === "expression" || weaknessArea === "arabic") {
      return ALL_EXPERTS.filter(e => e.specialties.includes("اللغة العربية وسلامة التعبير")).slice(0, 3);
    }
    if (weaknessArea === "presence" || weaknessArea === "stage" || weaknessArea === "posture") {
      return ALL_EXPERTS.filter(e => e.specialties.includes("الخطابة والإلقاء المنبري") || e.specialties.includes("مهارات العرض والتقديم")).slice(0, 3);
    }
    if (weaknessArea === "logic" || weaknessArea === "debate" || weaknessArea === "argument") {
      return ALL_EXPERTS.filter(e => e.specialties.includes("المناظرة والإقناع") || e.specialties.includes("العروض الأكاديمية والبحثية")).slice(0, 3);
    }
    if (weaknessArea === "vocal" || weaknessArea === "voice" || weaknessArea === "prosody") {
      return ALL_EXPERTS.filter(e => e.specialties.includes("الصوت والنبر والتلوين النغمي") || e.competencies.includes("الإلقاء")).slice(0, 3);
    }
  }

  // 2. If oratory scorecard exists, find the lowest metric:
  if (oratoryScorecard) {
    const scores = [
      { key: "vocal", score: oratoryScorecard.vocalVariety ?? 100 },
      { key: "presence", score: Math.min(oratoryScorecard.posture ?? 100, oratoryScorecard.eyeContact ?? 100) },
      { key: "logic", score: oratoryScorecard.structureAndLogic ?? 100 },
      { key: "conviction", score: oratoryScorecard.conviction ?? 100 }
    ].sort((a, b) => a.score - b.score);

    const lowest = scores[0];
    if (lowest.key === "vocal") {
      return ALL_EXPERTS.filter(e => e.specialties.includes("الصوت والنبر والتلوين النغمي") || e.competencies.includes("الإلقاء")).slice(0, 3);
    }
    if (lowest.key === "presence") {
      return ALL_EXPERTS.filter(e => e.specialties.includes("الخطابة والإلقاء المنبري")).slice(0, 3);
    }
    if (lowest.key === "logic") {
      return ALL_EXPERTS.filter(e => e.specialties.includes("المناظرة والإقناع")).slice(0, 3);
    }
  }

  // 3. Default fallback: Top featured active experts
  return ALL_EXPERTS.filter(e => e.expertNetworkMember && e.featured).slice(0, 3);
}
