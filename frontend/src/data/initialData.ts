import { StudentProfile, Badge, Measurement } from "../types";

export const DEFAULT_BADGES: Badge[] = [
  {
    id: "b-articulation",
    titleAr: "وسام مخارج الحروف",
    titleEn: "Sound Articulation Badge",
    descriptionAr: "نطق سليم ودقيق للكلمات المعيارية في المنهج القطري",
    descriptionEn: "Accurate articulation of Qatari standard target phrases",
    icon: "Award",
    unlocked: true,
    unlockedAt: "2026-08-01",
    category: "accuracy"
  },
  {
    id: "b-streak",
    titleAr: "وسام المواظبة والشغف",
    titleEn: "Daily Consistency Streak",
    descriptionAr: "ممارسة المنهج لـ 3 أيام متتالية",
    descriptionEn: "Practiced the curriculum for 3 consecutive days",
    icon: "Flame",
    unlocked: true,
    unlockedAt: "2026-08-01",
    category: "streak"
  },
  {
    id: "b-accuracy",
    titleAr: "وسام الدقة العالية",
    titleEn: "High Precision Reader",
    descriptionAr: "تحقيق نسبة دقة 90% أو أعلى في ممارسة المعايير",
    descriptionEn: "Achieved 90%+ accuracy in voice standard practice",
    icon: "Target",
    unlocked: true,
    unlockedAt: "2026-08-02",
    category: "accuracy"
  },
  {
    id: "b-mastery",
    titleAr: "وسام بطل المعايير الوطنية",
    titleEn: "National Standards Knight",
    descriptionAr: "إتقان كافة المعايير الوطنية المنهجية بالكامل",
    descriptionEn: "Fully mastered national curriculum standards",
    icon: "Award",
    unlocked: false,
    category: "mastery"
  }
];

// Helper to generate a grade's full set of 8 to 10 indicators
const createGradeMeasurements = (grade: string): Measurement[] => {
  switch (grade) {
    case "KG":
      return [
        { id: "kg-m1", code: "المعيار 1.1", indicatorCode: "مؤشر 1.1.1", indicatorAr: "ينطق الأصوات الأبجدية بالحركات القصيرة نطقاً صحيحاً", indicatorEn: "Pronounces short vowel sounds accurately", nameAr: "الربط بين رسم الحرف وصوته", nameEn: "Letter-Sound Association", category: "pronunciation", competencyAr: "التواصل", competencyEn: "Communication", score: 88, targetPhrase: "أ ب ت ث", attemptsCount: 3, lastPracticed: "2026-08-01" },
        { id: "kg-m2", code: "المعيار 2.1", indicatorCode: "مؤشر 2.1.1", indicatorAr: "يُميز التغير الصوتي للكلمة عند إضافة حركات التشكيل", indicatorEn: "Distinguishes phonetic changes with diacritics", nameAr: "سماع ونطق الحروف مع الحركات", nameEn: "Short & Long Vowels", category: "pronunciation", competencyAr: "التواصل", competencyEn: "Communication", score: 75, targetPhrase: "بَاب بَ بُ بِ", attemptsCount: 2, lastPracticed: "2026-08-02" },
        { id: "kg-m3", code: "المعيار 3.1", indicatorCode: "مؤشر 3.1.1", indicatorAr: "يُفرق بين النظائر الصوتية المتشابهة في المخرج", indicatorEn: "Distinguishes homophones & similar phonemes", nameAr: "تمييز النظائر الصوتية المتشابهة في المخرج", nameEn: "Similar Sounding Letters", category: "pronunciation", competencyAr: "التواصل", competencyEn: "Communication", score: 80, targetPhrase: "سَرِير صَرِير", attemptsCount: 1, lastPracticed: "2026-08-02" },
        { id: "kg-m4", code: "المعيار 4.1", indicatorCode: "مؤشر 4.1.1", indicatorAr: "يُحلل الكلمات البسيطة إلى مقاطع صوتية متميزة", indicatorEn: "Analyses simple words into syllabic chunks", nameAr: "استخدام مفهوم التقطيع الصوتي للكلمات", nameEn: "Syllabic Word Segmentation", category: "pronunciation", competencyAr: "التفكير الناقد", competencyEn: "Critical Thinking", score: 62, targetPhrase: "لَعِبَ لَ عِ بَ", attemptsCount: 2 },
        { id: "kg-m5", code: "المعيار 5.1", indicatorCode: "مؤشر 5.1.1", indicatorAr: "يركب المقاطع الصوتية لتركيب كلمة ثلاثية", indicatorEn: "Blends syllabic chunks to read 3-letter words", nameAr: "مزج المقاطع المختلفة لقراءة الكلمات", nameEn: "Blending Syllables for Reading", category: "pronunciation", competencyAr: "التواصل", competencyEn: "Communication", score: 70, targetPhrase: "كَتَبَ كَ تَ بَ", attemptsCount: 1 },
        { id: "kg-m6", code: "المعيار 6.1", indicatorCode: "مؤشر 6.1.1", indicatorAr: "ينطق الكلمات الشائعة والبصرية في الروضة بنطق مباشر", indicatorEn: "Pronounces high-frequency sight words directly", nameAr: "نطق الكلمات البصرية والشائعة", nameEn: "Sight Words Articulation", category: "vocabulary", competencyAr: "التواصل", competencyEn: "Communication", score: 82, targetPhrase: "أَنَا أُمِّي أَبِي", attemptsCount: 3 },
        { id: "kg-m7", code: "المعيار 7.1", indicatorCode: "مؤشر 7.1.1", indicatorAr: "يُميز القافية الصوتية والنغم في أواخر الأناشيد", indicatorEn: "Identifies rhyme & meter in early songs", nameAr: "الوعي الفونيقي والسجع الصوتي", nameEn: "Phonemic Awareness & Rhyme", category: "literature", competencyAr: "التفكير الإبداعي", competencyEn: "Creative Thinking", score: 78, targetPhrase: "قَطَرِي أَنَا قَطَرِي", attemptsCount: 2 },
        { id: "kg-m8", code: "المعيار 8.1", indicatorCode: "مؤشر 8.1.1", indicatorAr: "ينطق صوت الحرف الأول في ألقاب الأشياء المحيطة", indicatorEn: "Articulates initial consonant sounds of everyday objects", nameAr: "تحديد الصوت الأول في الكلمة", nameEn: "Initial Phoneme Detection", category: "pronunciation", competencyAr: "التقصي والبحث", competencyEn: "Research & Inquiry", score: 85, targetPhrase: "قَلَم كِتَاب مَدْرَسَة", attemptsCount: 2 }
      ];

    case "Grade 1":
      return [
        { id: "g1-m1", code: "المعيار 1.1", indicatorCode: "مؤشر 1.1.2", indicatorAr: "يُميز صوتياً بين التاء المربوطة والمفتوحة والهاء عند الوقف والوصل", indicatorEn: "Distinguishes Ta Marbuta, Open Ta, and Ha", nameAr: "نطق التاء المربوطة والمفتوحة والهاء", nameEn: "Ta Marbuta & Open Ta Phonetics", category: "pronunciation", competencyAr: "التواصل", competencyEn: "Communication", score: 90, targetPhrase: "مَدْرَسَةٌ مَفْتُوحَةٌ مِيَاهٌ", attemptsCount: 3, lastPracticed: "2026-08-01" },
        { id: "g1-m2", code: "المعيار 2.1", indicatorCode: "مؤشر 2.1.2", indicatorAr: "ينطق اللام الشمسية واللام القمرية مع مراعاة التضعيف", indicatorEn: "Articulates Sun and Moon Letters smoothly", nameAr: "نطق اللام الشمسية والقمرية", nameEn: "Sun & Moon Letters Articulation", category: "pronunciation", competencyAr: "التواصل", competencyEn: "Communication", score: 85, targetPhrase: "الشَّمْسُ وَالْقَمَرُ", attemptsCount: 2, lastPracticed: "2026-08-02" },
        { id: "g1-m3", code: "المعيار 3.1", indicatorCode: "مؤشر 3.1.2", indicatorAr: "ينطق التنوين بأنواعه الثلاثة في أواخر الألفاظ", indicatorEn: "Pronounces Tanween forms correctly", nameAr: "نطق التنوين بأشكاله الثلاثة", nameEn: "Tanween Phonetic Articulation", category: "pronunciation", competencyAr: "التواصل", competencyEn: "Communication", score: 72, targetPhrase: "كِتَابٌ كِتَابًا كِتَابٍ", attemptsCount: 1 },
        { id: "g1-m4", code: "المعيار 4.1", indicatorCode: "مؤشر 4.1.2", indicatorAr: "يقرأ جملة قصيرة مكونة من 3 كلمات بطلاقة صوتیة", indicatorEn: "Reads short 3-word sentence fluently", nameAr: "الربط بين الأصوات لتشكيل جملة", nameEn: "Sentence Phonetic Fluency", category: "pronunciation", competencyAr: "التفكير الناقد", competencyEn: "Critical Thinking", score: 88, targetPhrase: "قَرَأَ الطَّالِبُ الدَّرْسَ", attemptsCount: 3 },
        { id: "g1-m5", code: "المعيار 5.1", indicatorCode: "مؤشر 5.1.2", indicatorAr: "ينطق الكلمات المشتملة على مد بالألف والواو والياء", indicatorEn: "Articulates 3 long vowel extensions", nameAr: "تمييز حروف المد الثلاثة", nameEn: "Long Vowel Extension Mastery", category: "pronunciation", competencyAr: "التواصل", competencyEn: "Communication", score: 80, targetPhrase: "سَارَ نُورٌ جَمِيلٌ", attemptsCount: 2 },
        { id: "g1-m6", code: "المعيار 6.1", indicatorCode: "مؤشر 6.1.2", indicatorAr: "ينطق الحرف المشدد بالفتح والضم والكسر بنطق مشدد سليم", indicatorEn: "Articulates geminated consonants (Shaddah)", nameAr: "نطق الحرف المشدد بالتشكيل", nameEn: "Shaddah Consonant Doubling", category: "pronunciation", competencyAr: "التواصل", competencyEn: "Communication", score: 78, targetPhrase: "سَلَّمَ وَعَلَّمَ", attemptsCount: 2 },
        { id: "g1-m7", code: "المعيار 7.1", indicatorCode: "مؤشر 7.1.2", indicatorAr: "يُعبر شفهياً بجمل اسمية بسيطة تصف الصور التعليمية", indicatorEn: "Describes educational visual cues with simple sentences", nameAr: "التعبير الشفهي الواصف", nameEn: "Oral Image Description", category: "literature", competencyAr: "التفكير الإبداعي", competencyEn: "Creative Thinking", score: 84, targetPhrase: "العَلَمُ يَرْتَفِعُ عَالِيًا", attemptsCount: 2 },
        { id: "g1-m8", code: "المعيار 8.1", indicatorCode: "مؤشر 8.1.2", indicatorAr: "ينطق أسماء الإشارة القريبة (هذا، هذه) بنطق فصيح", indicatorEn: "Pronounces basic demonstrative words smoothly", nameAr: "استخدام ونطق أسماء الإشارة", nameEn: "Demonstrative Pronoun Articulation", category: "grammar", competencyAr: "التواصل", competencyEn: "Communication", score: 86, targetPhrase: "هَذَا صَفِّي وَهَذِهِ مَدْرَسَتِي", attemptsCount: 3 }
      ];

    case "Grade 2":
      return [
        { id: "g2-m1", code: "المعيار 1.1", indicatorCode: "مؤشر 1.1.3", indicatorAr: "ينطق التراكيب اللغوية البسيطة بسلامة وحصانة صوتیة", indicatorEn: "Articulates basic linguistic structures smoothly", nameAr: "مراجعة قواعد القراءة للصف الأول", nameEn: "Grade 1 Pronunciation Review", category: "pronunciation", competencyAr: "التواصل", competencyEn: "Communication", score: 82, targetPhrase: "أَنَا نَحْنُ أَنْتَ أَنْتِ", attemptsCount: 2, lastPracticed: "2026-08-01" },
        { id: "g2-m2", code: "المعيار 2.1", indicatorCode: "مؤشر 2.1.3", indicatorAr: "يفرق صوتياً بين الحركة القصيرة وحرف المد المناظر", indicatorEn: "Distinguishes short vowels from corresponding long vowels", nameAr: "الفرق بين الحركات الطويلة والقصيرة", nameEn: "Long vs. Short Vowels", category: "pronunciation", competencyAr: "التواصل", competencyEn: "Communication", score: 79, targetPhrase: "سَمَحَ سَامَحَ", attemptsCount: 1 },
        { id: "g2-m3", code: "المعيار 3.1", indicatorCode: "مؤشر 3.1.3", indicatorAr: "ينطق الكلمات المشتملة على حروف متقاربة المخرج (ح/هـ، ع/أ)", indicatorEn: "Pronounces close phoneme pairs accurately", nameAr: "تمييز النظائر الصوتية المتشابهة في المخرج", nameEn: "Homophone Letter Distinctions", category: "pronunciation", competencyAr: "التواصل", competencyEn: "Communication", score: 92, targetPhrase: "حَمْزَة هَمْزَة", attemptsCount: 2, lastPracticed: "2026-08-01" },
        { id: "g2-m4", code: "المعيار 4.1", indicatorCode: "مؤشر 4.1.3", indicatorAr: "يُجزئ الكلمات الرباعية إلى مقاطع صوتية مستقلة", indicatorEn: "Segments quad-letter words into distinct syllables", nameAr: "تقسيم الكلمات إلى مقاطع صوتية", nameEn: "Advanced Word Segmentation", category: "pronunciation", competencyAr: "التفكير الناقد", competencyEn: "Critical Thinking", score: 74, targetPhrase: "مَدْرَسَة مَدْ رَ سَ ه", attemptsCount: 1 },
        { id: "g2-m5", code: "المعيار 5.1", indicatorCode: "مؤشر 5.1.3", indicatorAr: "ينطق الحروف المفخمة (خ، ص، ض، غ، ط، ق، ظ) دون ترقيق", indicatorEn: "Articulates velarized letters with proper resonance", nameAr: "تفخيم الحركات في جوار الأصوات المفخمة", nameEn: "Velarized Letter Vowelization", category: "pronunciation", competencyAr: "التواصل", competencyEn: "Communication", score: 83, targetPhrase: "صَائِم قَائِم", attemptsCount: 2 },
        { id: "g2-m6", code: "المعيار 6.1", indicatorCode: "مؤشر 6.1.3", indicatorAr: "يقرأ جملة من 4 إلى 5 كلمات مضبوطة بالحركات مع الوصل", indicatorEn: "Reads connected 5-word sentence with diacritics", nameAr: "طلاقة القراءة الجهرية المنسابة", nameEn: "Fluid Diacritized Reading", category: "pronunciation", competencyAr: "التواصل", competencyEn: "Communication", score: 86, targetPhrase: "يَذْهَبُ الطَّالِبُ إِلَى المَدْرَسَةِ صَبَاحًا", attemptsCount: 3 },
        { id: "g2-m7", code: "المعيار 7.1", indicatorCode: "مؤشر 7.1.3", indicatorAr: "ينطق ضمائر المتكلم والمخاطب والغائب بوضوح إعرابي", indicatorEn: "Pronounces personal pronouns with correct vowels", nameAr: "نطق استخدام الضمائر", nameEn: "Pronoun Oral Conjugation", category: "grammar", competencyAr: "التواصل", competencyEn: "Communication", score: 88, targetPhrase: "هُوَ يَكْتُبُ وَهِيَ تَقْرَأُ", attemptsCount: 2 },
        { id: "g2-m8", code: "المعيار 8.1", indicatorCode: "مؤشر 8.1.3", indicatorAr: "يُراعي الوقوف على الساكن في نهاية الجملة الإخبارية", indicatorEn: "Applies sentence-final pause rules accurately", nameAr: "مراعاة السكون عند الوقف", nameEn: "Pause & Sukoon Prosody", category: "literature", competencyAr: "التفكير الناقد", competencyEn: "Critical Thinking", score: 90, targetPhrase: "الْعِلْمُ نُورٌ", attemptsCount: 3 }
      ];

    case "Grade 3":
      return [
        { id: "g3-m1", code: "المعيار 1.1", indicatorCode: "مؤشر 1.1.4", indicatorAr: "ينطق الحرف المشدد بضغط صوتي وتضعيف صحيح", indicatorEn: "Articulates doubled letters with shaddah pressure", nameAr: "قراءة التضعيف والشدة بدقة", nameEn: "Shaddah Doubling Articulation", category: "pronunciation", competencyAr: "التواصل", competencyEn: "Communication", score: 88, targetPhrase: "عَلَّمَ الْمُعَلِّمُ الطُّلاَّبَ", attemptsCount: 3, lastPracticed: "2026-08-01" },
        { id: "g3-m2", code: "المعيار 2.1", indicatorCode: "مؤشر 2.1.4", indicatorAr: "يُميز صوتياً بين همزة القطع الملفوظة وهمزة الوصل الساقطة وصلًا", indicatorEn: "Distinguishes Hamzat Qat' vs Hamzat Wasl in speech", nameAr: "نطق همزتي الوصل والقطع", nameEn: "Hamzat Wasl and Qat' Articulation", category: "pronunciation", competencyAr: "التفكير الناقد", competencyEn: "Critical Thinking", score: 84, targetPhrase: "أَحْسَنَ وَاسْتَغْفَرَ", attemptsCount: 2, lastPracticed: "2026-08-02" },
        { id: "g3-m3", code: "المعيار 3.1", indicatorCode: "مؤشر 3.1.4", indicatorAr: "يغير نبرة الصوت وفق علامات الترقيم (الاستفهام والتنقيط)", indicatorEn: "Modulates pitch according to punctuation marks", nameAr: "مراعاة علامات الترقيم أثناء القراءة", nameEn: "Punctuation Pitch Prosody", category: "pronunciation", competencyAr: "التواصل", competencyEn: "Communication", score: 76, targetPhrase: "هَلْ قَرَأْتَ الْكِتَابَ؟ نَعَمْ!", attemptsCount: 1 },
        { id: "g3-m4", code: "المعيار 4.1", indicatorCode: "مؤشر 4.1.4", indicatorAr: "ينطق أواخر الكلمات مضبوطةً بالشكل الصحيح", indicatorEn: "Pronounces sentence endings with strict case endings", nameAr: "نطق المفردات الجديدة بالضبط الصحيح", nameEn: "Diacritized Vocabulary Precision", category: "pronunciation", competencyAr: "التقصي والبحث", competencyEn: "Research & Inquiry", score: 82, targetPhrase: "يَسْعَى الْمُجْتَهِدُ لِلنَّجَاحِ", attemptsCount: 2 },
        { id: "g3-m5", code: "المعيار 5.1", indicatorCode: "مؤشر 5.1.4", indicatorAr: "يقرأ قراءة جهرية معبرة تمثل المعنى والعاطفة", indicatorEn: "Reads expressive stories out loud fluently", nameAr: "القراءة المعبرة للقصص القصيرة", nameEn: "Expressive Oral Narrative Reading", category: "literature", competencyAr: "التفكير الإبداعي", competencyEn: "Creative Thinking", score: 89, targetPhrase: "كَانَ يَا مَا كَانَ فِي قَدِيمِ الزَّمَانِ", attemptsCount: 3 },
        { id: "g3-m6", code: "المعيار 6.1", indicatorCode: "مؤشر 6.1.4", indicatorAr: "ينطق الجمل الفردية والمثنى والجمع مبيناً حركة الإعراب", indicatorEn: "Pronounces singular, dual & plural case endings", nameAr: "نطق المثنى والجمع في السياق", nameEn: "Dual & Plural Oral Inflection", category: "grammar", competencyAr: "التواصل", competencyEn: "Communication", score: 85, targetPhrase: "جَاءَ الطَّالِبَانِ وَالْمُعَلِّمُونَ", attemptsCount: 2 },
        { id: "g3-m7", code: "المعيار 7.1", indicatorCode: "مؤشر 7.1.4", indicatorAr: "يستخرج العبرة والأفكار الرئيسة ويُعبر عنها بنطق فصيح", indicatorEn: "Communicates story main ideas eloquently", nameAr: "التعبير عن الفكرة الرئيسة شفهياً", nameEn: "Oral Main Idea Expression", category: "literature", competencyAr: "التفكير الناقد", competencyEn: "Critical Thinking", score: 87, targetPhrase: "الْأَمَانَةُ خُلُقٌ كَرِيمٌ يُحِبُّهُ اللَّه", attemptsCount: 2 },
        { id: "g3-m8", code: "المعيار 8.1", indicatorCode: "مؤشر 8.1.4", indicatorAr: "ينطق حروف العطف (الواو، الفاء، ثم) بربط صوتي سلس", indicatorEn: "Articulates conjunctions smoothly between phrases", nameAr: "نطق واستخدام حروف العطف", nameEn: "Conjunction Articulation Flow", category: "grammar", competencyAr: "التواصل", competencyEn: "Communication", score: 90, targetPhrase: "دَخَلَ مُحَمَّدٌ فَأَحْمَدُ ثُمَّ خَالِدٌ", attemptsCount: 3 }
      ];

    case "Grade 4":
      return [
        { id: "g4-m1", code: "المعيار 1.1", indicatorCode: "مؤشر 1.1.5", indicatorAr: "ينطق الألف اللينة الممدودة والمقصورة بمد صوتي سليم", indicatorEn: "Articulates Soft Alif (Extended & Maqsura)", nameAr: "نطق الألف اللينة في نهاية الكلم", nameEn: "Soft Alif Final Articulation", category: "pronunciation", competencyAr: "التواصل", competencyEn: "Communication", score: 86, targetPhrase: "دَعَا الْفَتَى رَبَّهُ فَنَجَا", attemptsCount: 3, lastPracticed: "2026-08-01" },
        { id: "g4-m2", code: "المعيار 2.1", indicatorCode: "مؤشر 2.1.5", indicatorAr: "ينطق الكلمات المشتملة على همزة متوسطة وفق أقوى الحركات", indicatorEn: "Pronounces medial Hamza according to movement hierarchy", nameAr: "تهجئة ونطق الهمزة المتوسطة", nameEn: "Medial Hamza Phonetic Accuracy", category: "pronunciation", competencyAr: "التفكير الناقد", competencyEn: "Critical Thinking", score: 91, targetPhrase: "سَأَلَ الْمُؤْمِنُ رَبَّهُ بِيَقِينٍ", attemptsCount: 2, lastPracticed: "2026-08-02" },
        { id: "g4-m3", code: "المعيار 3.1", indicatorCode: "مؤشر 3.1.5", indicatorAr: "يراعي مواضع الوقف والابتداء أثناء القراءة الجهرية", indicatorEn: "Respects pause & start places during oral reading", nameAr: "مراعاة الفواصل والنقاط في القراءة", nameEn: "Oral Pause & Flow Mastery", category: "pronunciation", competencyAr: "التواصل", competencyEn: "Communication", score: 79, targetPhrase: "الْعِلْمُ نُورٌ، وَالْجَهْلُ ظَلاَمٌ.", attemptsCount: 1 },
        { id: "g4-m4", code: "المعيار 4.1", indicatorCode: "مؤشر 4.1.5", indicatorAr: "ينطق المفردات الجديدة بسلاسة مع استحضار الدلالة", indicatorEn: "Articulates newly acquired vocabulary in context", nameAr: "استنتاج المعاني من السياق", nameEn: "Contextual Vocabulary Articulation", category: "vocabulary", competencyAr: "التقصي والبحث", competencyEn: "Research & Inquiry", score: 83, targetPhrase: "يَتَأَمَّلُ الْبَاحِثُ فِي الْكَوْنِ", attemptsCount: 2 },
        { id: "g4-m5", code: "المعيار 5.1", indicatorCode: "مؤشر 5.1.5", indicatorAr: "ينطق الجمل الاسمية والفعلية بضبط إعرابي صحيح", indicatorEn: "Pronounces nominal and verbal sentences accurately", nameAr: "نطق التراكيب اللغوية المعقدة", nameEn: "Syntactical Sentence Precision", category: "grammar", competencyAr: "التفكير الناقد", competencyEn: "Critical Thinking", score: 87, targetPhrase: "يَكْتُبُ الطَّالِبُ الدَّرْسَ بِاهْتِمَامٍ", attemptsCount: 2 },
        { id: "g4-m6", code: "المعيار 6.1", indicatorCode: "مؤشر 6.1.5", indicatorAr: "ينطق المفعول المطلق والمفعول لأجله منصوبين بالفتحة", indicatorEn: "Articulates Cognate & Purpose Objects", nameAr: "نطق المنصوبات في الجملة الفعلية", nameEn: "Accusative Verbal Complements", category: "grammar", competencyAr: "التواصل", competencyEn: "Communication", score: 82, targetPhrase: "دَرَسَ الطَّالِبُ حِرْصًا عَلَى النَّجَاحِ", attemptsCount: 2 },
        { id: "g4-m7", code: "المعيار 7.1", indicatorCode: "مؤشر 7.1.5", indicatorAr: "يلقي الأبيات الشعرية بإيقاع صوتي متزن ومناسب للمعنى", indicatorEn: "Recites poetic verses with balanced rhythm", nameAr: "الإلقاء الشعري للأطفال", nameEn: "Junior Poetics Recitation", category: "literature", competencyAr: "التفكير الإبداعي", competencyEn: "Creative Thinking", score: 88, targetPhrase: "أُمِّي حَيَاتِي ونُورُ عُيُونِي", attemptsCount: 3 },
        { id: "g4-m8", code: "المعيار 8.1", indicatorCode: "مؤشر 8.1.5", indicatorAr: "ينطق أفعال الأمر والماضي والمضارع مع ضبط أواخرها", indicatorEn: "Pronounces past, present & imperative verb endings", nameAr: "نطق الأفعال الثلاثية وأزمنتها", nameEn: "Verb Tense Conjugation Accuracy", category: "grammar", competencyAr: "التواصل", competencyEn: "Communication", score: 90, targetPhrase: "كَتَبَ يَكْتُبُ اكْتُبْ", attemptsCount: 3 }
      ];

    case "Grade 5":
      return [
        { id: "g5-m1", code: "المعيار 1.1", indicatorCode: "مؤشر 1.1.6", indicatorAr: "يكتشف الخطأ الصوتي في الإعراب ويصححه ذاتياً أثناء القراءة", indicatorEn: "Detects and self-corrects vocal diacritic errors", nameAr: "تعرف الأخطاء الإملائية والصوتية بنفسه", nameEn: "Identifying Visual & Speech Errors", category: "pronunciation", competencyAr: "التفكير الناقد", competencyEn: "Critical Thinking", score: 90, targetPhrase: "الْمُسْتَقْبَل الْمُصْطَقْبَل", attemptsCount: 4, lastPracticed: "2026-08-01" },
        { id: "g5-m2", code: "المعيار 1.2", indicatorCode: "مؤشر 1.2.6", indicatorAr: "ينطق مصطلحات التقصي العلمي والبحث بنطق فصيح", indicatorEn: "Pronounces inquiry and scientific vocabulary fluently", nameAr: "تهجئة المفردات العلمية والبحثية", nameEn: "Scientific Vocabulary Pronunciation", category: "vocabulary", competencyAr: "التقصي والبحث", competencyEn: "Research & Inquiry", score: 94, targetPhrase: "الِاسْتِقْصَاء وَالِاكْتِشَاف", attemptsCount: 3, lastPracticed: "2026-08-02" },
        { id: "g5-m3", code: "المعيار 1.3", indicatorCode: "مؤشر 1.3.6", indicatorAr: "ينطق تنوين النصب مع مراعاة الألف الزائدة تنويناً", indicatorEn: "Articulates Accusative Tanween with extra Alif", nameAr: "تهجئة الكلمات المنونة بشكل صحيح", nameEn: "Tanween Phonetic Spelling", category: "pronunciation", competencyAr: "التواصل", competencyEn: "Communication", score: 81, targetPhrase: "سَمَاءً وَجُزْءًا", attemptsCount: 2 },
        { id: "g5-m4", code: "المعيار 1.4", indicatorCode: "مؤشر 1.4.6", indicatorAr: "ينطق الهمزة المتطرفة بدقة في مختلف حالات الإعراب", indicatorEn: "Articulates extreme final Hamza in all cases", nameAr: "تهجئة الهمزة المتطرفة على الألف والياء", nameEn: "Spelling of Extreme Hamza", category: "pronunciation", competencyAr: "التواصل", competencyEn: "Communication", score: 85, targetPhrase: "يَقْرَأُ الْفَتَى فِي الْقَارِئِ", attemptsCount: 2 },
        { id: "g5-m5", code: "المعيار 1.5", indicatorCode: "مؤشر 1.5.6", indicatorAr: "ينطق الكلمات المشتملة على حروف تُكتب ولا تُنطق", indicatorEn: "Pronounces words with silent written characters", nameAr: "نطق الكلمات المشتملة على حروف زائدة", nameEn: "Acoustics of Silent Letters", category: "pronunciation", competencyAr: "التفكير الإبداعي", competencyEn: "Creative Thinking", score: 79, targetPhrase: "مَسْؤُولٌ يَسْأَلُ قَالُوا", attemptsCount: 1 },
        { id: "g5-m6", code: "المعيار 1.6", indicatorCode: "مؤشر 1.6.6", indicatorAr: "ينطق اسم كان ومبتدئها مرفوعاً وخبرها منصوباً بدقة", indicatorEn: "Vocalizes Kana and its predicates correctly", nameAr: "ضبط الأفعال الناسخة كان وأخواتها", nameEn: "Kana Verb Predicate Cases", category: "grammar", competencyAr: "التواصل", competencyEn: "Communication", score: 88, targetPhrase: "كَانَ الجَوُّ جَمِيلًا وَصارَ العِلْمُ نُورًا", attemptsCount: 3 },
        { id: "g5-m7", code: "المعيار 1.7", indicatorCode: "مؤشر 1.7.6", indicatorAr: "يلقي التقرير الشفهي أمام زملائه بوضوح وثقة صوتیة", indicatorEn: "Delivers oral presentation report with high clarity", nameAr: "الإلقاء التقديمي للتقارير", nameEn: "Oral Presentation Delivery", category: "literature", competencyAr: "التفكير الإبداعي", competencyEn: "Creative Thinking", score: 92, targetPhrase: "نُقَدِّمُ لَكُمْ اليَوْمَ بَحْثَنَا عَنْ البِيئَةِ", attemptsCount: 3 },
        { id: "g5-m8", code: "المعيار 1.8", indicatorCode: "مؤشر 1.8.6", indicatorAr: "ينطق مصطلحات الهوية الوطنية القطرية والتراث بفخر وفصاحة", indicatorEn: "Articulates national heritage vocabulary fluently", nameAr: "نطق مفردات التراث والرموز الوطنية", nameEn: "National Heritage Vocabulary", category: "vocabulary", competencyAr: "التقصي والبحث", competencyEn: "Research & Inquiry", score: 95, targetPhrase: "سِدْرَةُ المُنْتَهَى وَمَتْحَفُ قَطَر الوَطَنِي", attemptsCount: 4 }
      ];

    case "Grade 6":
      return [
        { id: "g6-m1", code: "المعيار 1.1", indicatorCode: "مؤشر 1.1.7", indicatorAr: "ينطق الفاعل مرفوعاً بالضمة والمفعول به منصوباً بالفتحة بدقة", indicatorEn: "Pronounces Subject & Object case endings perfectly", nameAr: "الضبط الإعرابي الصحيح للفاعل والمفعول", nameEn: "Nominative & Accusative Vocal Case", category: "grammar", competencyAr: "التفكير الناقد", competencyEn: "Critical Thinking", score: 89, targetPhrase: "شَرَحَ الْمُعَلِّمُ الدَّرْسَ بَلاَغَةً", attemptsCount: 3, lastPracticed: "2026-08-01" },
        { id: "g6-m2", code: "المعيار 2.1", indicatorCode: "مؤشر 2.1.7", indicatorAr: "ينطق أسماء الإشارة والموصولات دون اختلاس للحركات", indicatorEn: "Articulates relative and demonstrative pronouns", nameAr: "نطق الأسماء الموصولة وأسماء الإشارة", nameEn: "Demonstrative & Relative Pronunciation", category: "pronunciation", competencyAr: "التواصل", competencyEn: "Communication", score: 92, targetPhrase: "هَذَا الَّذِي نَجَحَ فِي الاِمْتِحَانِ", attemptsCount: 2, lastPracticed: "2026-08-02" },
        { id: "g6-m3", code: "المعيار 3.1", indicatorCode: "مؤشر 3.1.7", indicatorAr: "ينطق الأفعال الخمسة بثبوت النون وحذفها بدقة", indicatorEn: "Pronounces Five Verbs with Nun retention/omission", nameAr: "نطق الأفعال الخمسة مع النون", nameEn: "Five Verbs Phonetic Conjugation", category: "grammar", competencyAr: "التواصل", competencyEn: "Communication", score: 80, targetPhrase: "يَكْتُبُونَ وَلَنْ يَكْتُبُوا", attemptsCount: 1 },
        { id: "g6-m4", code: "المعيار 4.1", indicatorCode: "مؤشر 4.1.7", indicatorAr: "يلقي النص الشعري بنبرة تعكس العاطفة والسرعة المناسبة", indicatorEn: "Recites poetry with appropriate pace & emotion", nameAr: "الإلقاء المعبر للنصوص الأدبية", nameEn: "Poetic Emotional Recitation", category: "literature", competencyAr: "التفكير الإبداعي", competencyEn: "Creative Thinking", score: 87, targetPhrase: "قَطَرُ الأَبِيَّةُ مَوْطِنُ الأَمْجَادِ", attemptsCount: 2 },
        { id: "g6-m5", code: "المعيار 5.1", indicatorCode: "مؤشر 5.1.7", indicatorAr: "ينطق مفردات الهوية الوطنية القطرية بفصاحة عالية", indicatorEn: "Pronounces Qatari national identity terms eloquently", nameAr: "نطق المصطلحات البيئية والوطنية", nameEn: "National Heritage Vocabulary Flow", category: "vocabulary", competencyAr: "التقصي والبحث", competencyEn: "Research & Inquiry", score: 84, targetPhrase: "الرُّؤْيَةُ الْوَطَنِيَّةُ لِدَوْلَةِ قَطَر", attemptsCount: 2 },
        { id: "g6-m6", code: "المعيار 6.1", indicatorCode: "مؤشر 6.1.7", indicatorAr: "ينطق التوابع كالنعوت والمعطوفات متطابقة في التشكيل", indicatorEn: "Articulates adjectives matching their noun cases", nameAr: "نطق الصفة والموصوف بدقة إعرابية", nameEn: "Adjective Noun Phonetic Concord", category: "grammar", competencyAr: "التواصل", competencyEn: "Communication", score: 86, targetPhrase: "قَرَأْتُ كِتَابًا مُفِيدًا جَمِيلًا", attemptsCount: 2 },
        { id: "g6-m7", code: "المعيار 7.1", indicatorCode: "مؤشر 7.1.7", indicatorAr: "ينطق الأعداد المركبة والمعدود بنطق نحوي سليم", indicatorEn: "Pronounces compound numbers and counted nouns", nameAr: "نطق الأعداد والمعدود", nameEn: "Compound Numbers Articulation", category: "grammar", competencyAr: "التفكير الناقد", competencyEn: "Critical Thinking", score: 83, targetPhrase: "خَمْسَةَ عَشَرَ طَالِبًا فِي الصَّفِّ", attemptsCount: 2 },
        { id: "g6-m8", code: "المعيار 8.1", indicatorCode: "مؤشر 8.1.7", indicatorAr: "يميز بين أسلوب النهي وأسلوب النفي في النبر الصوتي", indicatorEn: "Distinguishes negative vs prohibitive speech tones", nameAr: "النبر الصوتي في أساليب النفي والنهي", nameEn: "Negation vs Prohibition Prosody", category: "literature", competencyAr: "التواصل", competencyEn: "Communication", score: 90, targetPhrase: "لاَ تَتَكاسَلْ، فَإِنَّ الْمُجْتَهِدَ لاَ يَخْسَرُ", attemptsCount: 3 }
      ];

    case "Grade 7":
      return [
        { id: "g7-m1", code: "المعيار 1.1", indicatorCode: "مؤشر 1.1.8", indicatorAr: "ينطق مشتقات اسم الفاعل وصيغ المبالغة بالوزن الصحيح", indicatorEn: "Articulates Active Participle & Hyperbole Forms", nameAr: "نطق صيغ المبالغة واسم الفاعل", nameEn: "Morphological Pattern Recitation", category: "grammar", competencyAr: "التفكير الناقد", competencyEn: "Critical Thinking", score: 87, targetPhrase: "إِنَّ اللَّهَ غَفُورٌ رَحِيمٌ وَصَابِرٌ", attemptsCount: 2, lastPracticed: "2026-08-01" },
        { id: "g7-m2", code: "المعيار 2.1", indicatorCode: "مؤشر 2.1.8", indicatorAr: "يضبط أواخر الأسماء والأخبار في الجمل النسخية صوتاً", indicatorEn: "Vocalizes Kana & Inna sentence cases correctly", nameAr: "ضبط كان وأخواتها وإن وأخواتها", nameEn: "Kana & Inna Vocal Case Control", category: "grammar", competencyAr: "التواصل", competencyEn: "Communication", score: 91, targetPhrase: "كَانَ النَّصْرُ قَرِيبًا وَإِنَّ الْعِلْمَ نُورٌ", attemptsCount: 2, lastPracticed: "2026-08-02" },
        { id: "g7-m3", code: "المعيار 3.1", indicatorCode: "مؤشر 3.1.8", indicatorAr: "ينطق الكلمات المتصلة بالضمائر بنطق متماسك ودقيق", indicatorEn: "Pronounces attached pronoun suffix words seamlessly", nameAr: "تمييز الضمائر المتصلة والمنفصلة", nameEn: "Pronoun Suffix Word Dynamics", category: "pronunciation", competencyAr: "التواصل", competencyEn: "Communication", score: 78, targetPhrase: "كِتَابُهُ وَكِتَابُهَا وَكِتَابُهُمْ", attemptsCount: 1 },
        { id: "g7-m4", code: "المعيار 4.1", indicatorCode: "مؤشر 4.1.8", indicatorAr: "يراعي سرعة القراءة والتنفس الصحيح أثناء المقالات الطويلة", indicatorEn: "Manages breath control & reading velocity in prose", nameAr: "قراءة النصوص السردية والتحليلية", nameEn: "Prose Narrative Breathing Pace", category: "literature", competencyAr: "التفكير الإبداعي", competencyEn: "Creative Thinking", score: 85, targetPhrase: "تَمْتَدُّ الشَّواطِئُ الْقَطَرِيَّةُ بِجَمَالٍ سَاحِرٍ", attemptsCount: 2 },
        { id: "g7-m5", code: "المعيار 5.1", indicatorCode: "مؤشر 5.1.8", indicatorAr: "ينطق همزة الاستفهام المتبوعة بهمسة قطع بوضوح", indicatorEn: "Articulates interrogative Hamza followed by Qat'", nameAr: "نطق الكلمات ذات الهمزات المزدوجة", nameEn: "Double Hamza Interrogative Flow", category: "pronunciation", competencyAr: "التقصي والبحث", competencyEn: "Research & Inquiry", score: 82, targetPhrase: "أَأَنْتَ فَعَلْتَ هَذَا؟", attemptsCount: 1 },
        { id: "g7-m6", code: "المعيار 6.1", indicatorCode: "مؤشر 6.1.8", indicatorAr: "ينطق أسلوب التفضيل بصيغتي أفعل وفضلى بنطق بلاغي", indicatorEn: "Articulates superlative noun patterns smoothly", nameAr: "نطق اسم التفضيل وأوزانه", nameEn: "Superlative Noun Articulation", category: "grammar", competencyAr: "التفكير الناقد", competencyEn: "Critical Thinking", score: 89, targetPhrase: "الْعِلْمُ أَعْظَمُ شَأْنًا وَالْحِكْمَةُ فُضْلَى", attemptsCount: 3 },
        { id: "g7-m7", code: "المعيار 7.1", indicatorCode: "مؤشر 7.1.8", indicatorAr: "ينطق الاستثناء بـ (إلا، غير، سوى) بضبط المستثنى بالفتحة", indicatorEn: "Articulates Exception structures & case endings", nameAr: "نطق أسلوب الاستثناء بالتشكيل", nameEn: "Exception Structure Recitation", category: "grammar", competencyAr: "التواصل", competencyEn: "Communication", score: 84, targetPhrase: "حَضَرَ الطُّلاَّبُ إِلاَّ خَالِدًا", attemptsCount: 2 },
        { id: "g7-m8", code: "المعيار 8.1", indicatorCode: "مؤشر 8.1.8", indicatorAr: "يلقي المرافعة أو الخطبة المصغرة بنبر فصيح ومؤثر", indicatorEn: "Delivers miniature public address with rhetorical flair", nameAr: "الخطابة والإلقاء المنبري", nameEn: "Miniature Public Oration", category: "literature", competencyAr: "التفكير الإبداعي", competencyEn: "Creative Thinking", score: 92, targetPhrase: "أَيُّهَا الْحُضُورُ الْكِرَامُ، إِنَّ الْمُسْتَقْبَلَ لِلْعِلْمِ", attemptsCount: 3 }
      ];

    case "Grade 8":
      return [
        { id: "g8-m1", code: "المعيار 1.1", indicatorCode: "مؤشر 1.1.9", indicatorAr: "يطبق قواعد الضبط بالشكل في النصوص الطويلة بثبات", indicatorEn: "Applies full diacritic syntax in extended reading", nameAr: "مراجعة وتعزيز قواعد التهجئة السابقة", nameEn: "Syntax and Accent Review", category: "pronunciation", competencyAr: "التواصل", competencyEn: "Communication", score: 88, targetPhrase: "إِنَّ الْعِلْمَ نَافِعٌ", attemptsCount: 3, lastPracticed: "2026-07-28" },
        { id: "g8-m2", code: "المعيار 2.1", indicatorCode: "مؤشر 2.1.9", indicatorAr: "ينطق الهمزة المتوسطة المفتوحة بعد ياء ساكنة أو واو مد", indicatorEn: "Pronounces special medial Hamza forms after Ya/Waw", nameAr: "كتابة الهمزة المتوسطة في الحالات الخاصة", nameEn: "Middle Hamza Special Cases", category: "pronunciation", competencyAr: "التفكير الناقد", competencyEn: "Critical Thinking", score: 94, targetPhrase: "قِرَاءَةٌ مَمْلُوءَةٌ بِيئَةٌ", attemptsCount: 2, lastPracticed: "2026-07-30" },
        { id: "g8-m3", code: "المعيار 3.1", indicatorCode: "مؤشر 3.1.9", indicatorAr: "يراعي إسقاط نطق الألف عند الوقوع بين علمين (ابن/ابنة)", indicatorEn: "Omits 'Ibn' Alif in oral reading between proper names", nameAr: "حذف الألف في كلمتي ابن وابنة", nameEn: "Aphaeresis of Ibn and Ibna", category: "pronunciation", competencyAr: "التقصي والبحث", competencyEn: "Research & Inquiry", score: 79, targetPhrase: "يَا بْنَ الأَكْرَمِينَ", attemptsCount: 1 },
        { id: "g8-m4", code: "المعيار 4.1", indicatorCode: "مؤشر 4.1.9", indicatorAr: "ينطق الأسماء الممنوعة من الصرف بالفتحة عوضاً عن الكسرة", indicatorEn: "Articulates Diptote words with Fatha instead of Kasra", nameAr: "الضبط الصحيح للممنوع من الصرف", nameEn: "Diptote Vocal Conjugation", category: "grammar", competencyAr: "التفكير الناقد", competencyEn: "Critical Thinking", score: 83, targetPhrase: "صَلَّيْتُ فِي مَسَاجِدَ كَثِيرَةٍ", attemptsCount: 2 },
        { id: "g8-m5", code: "المعيار 5.1", indicatorCode: "مؤشر 5.1.9", indicatorAr: "يمارس نبرة الخطابة والطباق والمقابلة في الإلقاء", indicatorEn: "Demonstrates rhetorical antithesis in voice pitch", nameAr: "نطق النصوص البلاغية والخطابية", nameEn: "Rhetorical Voice & Antithesis", category: "literature", competencyAr: "التفكير الإبداعي", competencyEn: "Creative Thinking", score: 86, targetPhrase: "يَخْرُجُونَ مِنَ الظُّلُمَاتِ إِلَى النُّورِ", attemptsCount: 2 },
        { id: "g8-m6", code: "المعيار 6.1", indicatorCode: "مؤشر 6.1.9", indicatorAr: "ينطق الشرط وجوابه مجزومين بالسكون دون اختلاس", indicatorEn: "Articulates conditional verbs with explicit Jazam sukoon", nameAr: "نطق أدوات الشرط الجازمة", nameEn: "Conditional Jazam Articulation", category: "grammar", competencyAr: "التواصل", competencyEn: "Communication", score: 87, targetPhrase: "مَنْ يَعْمَلْ صَالِحًا يَنْجَحْ", attemptsCount: 2 },
        { id: "g8-m7", code: "المعيار 7.1", indicatorCode: "مؤشر 7.1.9", indicatorAr: "ينطق المصادر الصريحة والمؤولة بنطق صرفي دقيق", indicatorEn: "Articulates overt & interpreted verbal nouns accurately", nameAr: "نطق المصادر الصريحة والمؤولة", nameEn: "Verbal Noun Morphology Flow", category: "grammar", competencyAr: "التفكير الناقد", competencyEn: "Critical Thinking", score: 90, targetPhrase: "يَسُرُّنِي أَنْ تَنْجَحَ حَقًّا", attemptsCount: 3 },
        { id: "g8-m8", code: "المعيار 8.1", indicatorCode: "مؤشر 8.1.9", indicatorAr: "ينطق المصطلحات البيئية والجغرافية الوطنية بطلاقة فصيحة", indicatorEn: "Articulates national geography & environment terminology", nameAr: "نطق مفردات البيئة والجغرافيا الوطنية", nameEn: "National Eco-Geography Vocabulary", category: "vocabulary", competencyAr: "التقصي والبحث", competencyEn: "Research & Inquiry", score: 92, targetPhrase: "الْمَحْمِيَّاتُ الطَّبِيعِيَّةُ فِي دَوْلَةِ قَطَر", attemptsCount: 3 }
      ];

    case "Grade 9":
      return [
        { id: "g9-m1", code: "المعيار 1.1", indicatorCode: "مؤشر 1.1.10", indicatorAr: "ينطق جمع المذكر السالم والمثنى بعلامات الإعراب الفرعية", indicatorEn: "Pronounces dual & sound masculine plural secondary cases", nameAr: "الضبط الإعرابي للملحقات والجموع", nameEn: "Secondary Vocal Inflection Cases", category: "grammar", competencyAr: "التفكير الناقد", competencyEn: "Critical Thinking", score: 91, targetPhrase: "فَازَ الْمُعَلِّمُونَ وَكَرَّمْنَا الطَّالِبَيْنِ", attemptsCount: 3, lastPracticed: "2026-08-01" },
        { id: "g9-m2", code: "المعيار 2.1", indicatorCode: "مؤشر 2.1.10", indicatorAr: "ينطق مصطلحات العصر والتكنولوجيا بفصاحة لغوية قطريّة", indicatorEn: "Articulates modern tech terminology in formal Arabic", nameAr: "نطق المصطلحات العلمية والتكنولوجية", nameEn: "Modern Scientific Vocabulary", category: "vocabulary", competencyAr: "التقصي والبحث", competencyEn: "Research & Inquiry", score: 93, targetPhrase: "الذَّكَاءُ الاِصْطِنَاعِيُّ يُحَسِّنُ الْحَيَاةَ", attemptsCount: 2, lastPracticed: "2026-08-02" },
        { id: "g9-m3", code: "المعيار 3.1", indicatorCode: "مؤشر 3.1.10", indicatorAr: "ينطق الصور البلاغية بتنغيم صوتي يبرز المعنى والجمال", indicatorEn: "Modulates pitch to highlight metaphorical imagery", nameAr: "التمييز بين التشبيه والمجاز", nameEn: "Metaphorical Vocal Articulation", category: "literature", competencyAr: "التفكير الإبداعي", competencyEn: "Creative Thinking", score: 84, targetPhrase: "الْعِلْمُ كَالنُّورِ يَهْدِي الْعُقُولَ", attemptsCount: 1 },
        { id: "g9-m4", code: "المعيار 4.1", indicatorCode: "مؤشر 4.1.10", indicatorAr: "ينطق المضاف والمضاف إليه بحركة الجر الصحيحة بالكسرة", indicatorEn: "Pronounces Genitive Possessive constructions accurately", nameAr: "قراءة التراكيب الإضافية والمعطوفة", nameEn: "Genitive Possessive Articulation", category: "grammar", competencyAr: "التواصل", competencyEn: "Communication", score: 88, targetPhrase: "نُورُ الْعِلْمِ وَضِيَاءُ الْمَعْرِفَةِ", attemptsCount: 2 },
        { id: "g9-m5", code: "المعيار 5.1", indicatorCode: "مؤشر 5.1.10", indicatorAr: "يلقي القصائد الوطنية القطرية بإيقاع عروضي سليم", indicatorEn: "Recites national poems with prosodic metric cadence", nameAr: "الإلقاء الشعري الفصيح", nameEn: "National Poetic Recitation Cadence", category: "literature", competencyAr: "التواصل", competencyEn: "Communication", score: 86, targetPhrase: "تَبَارَكَ مَنْ صَاغَ هَذَا الْوَطَنْ", attemptsCount: 2 },
        { id: "g9-m6", code: "المعيار 6.1", indicatorCode: "مؤشر 6.1.10", indicatorAr: "ينطق أسلوب التوكيد اللفظي والمعنوي بضبط التوابع", indicatorEn: "Pronounces verbal & semantic emphasis with exact syntax", nameAr: "نطق أسلوب التوكيد اللفظي والمعنوي", nameEn: "Verbal & Semantic Emphasis Prosody", category: "grammar", competencyAr: "التفكير الناقد", competencyEn: "Critical Thinking", score: 89, targetPhrase: "حَضَرَ الأُمَرَاءُ كُلُّهُمْ عَيْنُهُمْ", attemptsCount: 3 },
        { id: "g9-m7", code: "المعيار 7.1", indicatorCode: "مؤشر 7.1.10", indicatorAr: "ينطق أفعال المقاربة والرجاء والشروع (كاد وأخواتها) بدقة", indicatorEn: "Articulates verbs of proximity & hope with full cases", nameAr: "نطق أفعال المقاربة والرجاء والشروع", nameEn: "Verbs of Proximity & Hope Accuracy", category: "grammar", competencyAr: "التواصل", competencyEn: "Communication", score: 87, targetPhrase: "كادَ المَطَرُ يَهْطِلُ بغَزارَةٍ", attemptsCount: 2 },
        { id: "g9-m8", code: "المعيار 8.1", indicatorCode: "مؤشر 8.1.10", indicatorAr: "يُلقي كلمة المناظرة الطلابية بحجج منطقية ونطق واثق", indicatorEn: "Delivers student debate argument smoothly", nameAr: "نطق وتوصيل الحجج في المناظرات", nameEn: "Debate Argument Oral Delivery", category: "literature", competencyAr: "التفكير الإبداعي", competencyEn: "Creative Thinking", score: 94, targetPhrase: "نُؤَكِّدُ بِالدَّلِيلِ القاطِعِ صِحَّةَ موْقِفِنا", attemptsCount: 4 }
      ];

    case "Grade 10":
      return [
        { id: "g10-m1", code: "المعيار 1.1", indicatorCode: "مؤشر 1.1.11", indicatorAr: "ينطق النصوص الفلسفية والأكاديمية بضبط تام دون لحن", indicatorEn: "Articulates academic rhetoric with strict grammar", nameAr: "مراجعة وتعزيز قواعد التهجئة المتقدمة", nameEn: "Advanced Rhetoric Pronunciation", category: "pronunciation", competencyAr: "التفكير الناقد", competencyEn: "Critical Thinking", score: 92, targetPhrase: "الْكِتَابَةُ الصَّحِيحَةُ تَعْكِسُ الْفَهْمَ", attemptsCount: 4, lastPracticed: "2026-08-01" },
        { id: "g10-m2", code: "المعيار 2.1", indicatorCode: "مؤشر 2.1.11", indicatorAr: "ينطق المفردات المعربة والمقترضة بحصانة لغوية عالية", indicatorEn: "Pronounces borrowed terminology with linguistic accuracy", nameAr: "التهجئة الصحيحة للكلمات المقترضة والمتخصصة", nameEn: "Borrowed Terminology Articulation", category: "vocabulary", competencyAr: "التقصي والبحث", competencyEn: "Research & Inquiry", score: 95, targetPhrase: "التِّكْنُولُوجْيَا وَالدِّيمُقْرَاطِيَّة", attemptsCount: 3, lastPracticed: "2026-08-02" },
        { id: "g10-m3", code: "المعيار 1.2", indicatorCode: "مؤشر 1.2.11", indicatorAr: "يبرز التناسق الدلالي في الجمل المعقدة والسياقات الأدبية", indicatorEn: "Highlights semantic harmony in complex sentences", nameAr: "استكشاف معاني المفردات في السياق", nameEn: "Contextual Semantic Flow", category: "vocabulary", competencyAr: "التفكير الإبداعي", competencyEn: "Creative Thinking", score: 88, targetPhrase: "مَدَارِجُ الْعِلْمِ وَالْمَعْرِفَةِ", attemptsCount: 2, lastPracticed: "2026-07-31" },
        { id: "g10-m4", code: "المعيار 2.2", indicatorCode: "مؤشر 2.2.11", indicatorAr: "ينطق الكلمات الغريبة أو المعقدة بنطق سليم استناداً للسياق", indicatorEn: "Infers and articulates unfamiliar complex words", nameAr: "استشراف معاني الكلمات غير المعروفة", nameEn: "Reading Comprehension Prosody", category: "literature", competencyAr: "التقصي والبحث", competencyEn: "Research & Inquiry", score: 81, targetPhrase: "عَادَ الْمُسَافِرُ بَعْدَ غِيَابٍ", attemptsCount: 1 },
        { id: "g10-m5", code: "المعيار 3.2", indicatorCode: "مؤشر 3.2.11", indicatorAr: "ينطق المحسنات البديعية بتموج صوتي دقيق يوضح الفرق", indicatorEn: "Uses vocal contrast to highlight antonyms & synonyms", nameAr: "فهم علاقات الترادف والتضاد في التراكيب", nameEn: "Synonyms and Antonyms Contrast", category: "grammar", competencyAr: "التواصل", competencyEn: "Communication", score: 85, targetPhrase: "الْجَوْدَةُ وَالْإِتْقَانُ ضِدَّ الْإِهْمَالِ", attemptsCount: 2 },
        { id: "g10-m6", code: "المعيار 4.2", indicatorCode: "مؤشر 4.2.11", indicatorAr: "ينطق المفعول فيه (ظرف الزمان والمكان) منصوباً بالفتحة", indicatorEn: "Articulates Adverbial Spatiotemporal modifiers smoothly", nameAr: "ضبط ظروف الزمان والمكان صوتاً", nameEn: "Spatiotemporal Adverbial Syntax", category: "grammar", competencyAr: "التواصل", competencyEn: "Communication", score: 89, targetPhrase: "سَافَرْتُ لَيْلًا وَوَقَفْتُ أَمَامَ المِحْرَابِ", attemptsCount: 3 },
        { id: "g10-m7", code: "المعيار 5.2", indicatorCode: "مؤشر 5.2.11", indicatorAr: "يميز بين النسبة والاستغاثة والنداء في التعبير الشفهي", indicatorEn: "Distinguishes vocative & lamentation vocal tones", nameAr: "نطق أسلوب النداء والاستغاثة", nameEn: "Vocative & Lamentation Prosody", category: "literature", competencyAr: "التفكير الإبداعي", competencyEn: "Creative Thinking", score: 91, targetPhrase: "يَا قَطَرُ الحَبِيبَةُ، وَاوَطَنَاه!", attemptsCount: 3 },
        { id: "g10-m8", code: "المعيار 6.2", indicatorCode: "مؤشر 6.2.11", indicatorAr: "ينطق جمل البدل والتوكيد في النصوص السياسية والدبلوماسية", indicatorEn: "Articulates diplomacy & political text speech flow", nameAr: "النطق الدبلوماسي للنصوص السياسية", nameEn: "Diplomatic Rhetorical Speech Precision", category: "literature", competencyAr: "التفكير الناقد", competencyEn: "Critical Thinking", score: 93, targetPhrase: "تَسْعَى دَوْلَةُ قَطَر لِتَحْقِيقِ السَّلاَمِ العَالَمِيِّ", attemptsCount: 4 }
      ];

    case "Grade 11":
      return [
        { id: "g11-m1", code: "المعيار 1.1", indicatorCode: "مؤشر 1.1.12", indicatorAr: "ينطق الشعر العربي الجاهلي والأموي بمخارج حروفها الأصلية", indicatorEn: "Articulates Classical Arabic poetry with native phonetics", nameAr: "نطق النصوص الأدبية الكلاسيكية", nameEn: "Classical Literature Articulation", category: "literature", competencyAr: "التفكير الناقد", competencyEn: "Critical Thinking", score: 94, targetPhrase: "خَفِيفُ النَّقْعِ فِي أَرْضِ الْخُطُوبِ", attemptsCount: 4, lastPracticed: "2026-08-01" },
        { id: "g11-m2", code: "المعيار 2.1", indicatorCode: "مؤشر 2.1.12", indicatorAr: "يضبط التوابع (البدل، العطف، التوكيد) بالصوت الإعرابي السليم", indicatorEn: "Vocalizes appositives and emphatics accurately", nameAr: "الإعراب الصوتي للإحالة والبدل", nameEn: "Appositive & Emphasis Vocal Control", category: "grammar", competencyAr: "التواصل", competencyEn: "Communication", score: 96, targetPhrase: "قَرَأْتُ الْكِتَابَ كُلَّهُ عَيْنَهُ", attemptsCount: 3, lastPracticed: "2026-08-02" },
        { id: "g11-m3", code: "المعيار 3.1", indicatorCode: "مؤشر 3.1.12", indicatorAr: "ينطق المفردات النقدية المعاصرة بثبات وفصاحة لغوية عالية", indicatorEn: "Articulates literary criticism terms eloquently", nameAr: "الاحترافية في نطق المصطلحات النقدية", nameEn: "Literary Criticism Vocabulary", category: "vocabulary", competencyAr: "التقصي والبحث", competencyEn: "Research & Inquiry", score: 83, targetPhrase: "التَّنَاصُّ وَالْبُنْوِيَّةُ فِي النَّقْدِ", attemptsCount: 2 },
        { id: "g11-m4", code: "المعيار 4.1", indicatorCode: "مؤشر 4.1.12", indicatorAr: "يتحكم في النبر الصوتي لإظهار أساليب النفي والتوكيد والتعجب", indicatorEn: "Controls prosody to express negation & exclamation", nameAr: "مراعاة النبر والتنغيم (Prosody)", nameEn: "Stylistic Vocal Prosody", category: "pronunciation", competencyAr: "التفكير الإبداعي", competencyEn: "Creative Thinking", score: 87, targetPhrase: "مَا أَجْمَلَ الْحَقَّ! وَلاَ رَيْبَ فِيهِ", attemptsCount: 2 },
        { id: "g11-m5", code: "المعيار 5.1", indicatorCode: "مؤشر 5.1.12", indicatorAr: "يلقي الحجج والبراهين في المناظرات بنطق واضح ومقنع", indicatorEn: "Delivers debate arguments with persuasive diction", nameAr: "الإلقاء التفاعلي والمناظرات", nameEn: "Debate Rhetorical Delivery", category: "literature", competencyAr: "التواصل", competencyEn: "Communication", score: 90, targetPhrase: "نَسْتَنِدُ إِلَى الْبُرْهَانِ الْقَاطِعِ", attemptsCount: 3 },
        { id: "g11-m6", code: "المعيار 6.1", indicatorCode: "مؤشر 6.1.12", indicatorAr: "ينطق المجهول ونائب الفاعل بضبط الضمة على أول الفعل والكسرة", indicatorEn: "Pronounces Passive verbs & Deputy Subjects flawlessly", nameAr: "نطق الفعل المبني للمجهول ونائب الفاعل", nameEn: "Passive Voice Deputy Subject Syntax", category: "grammar", competencyAr: "التفكير الناقد", competencyEn: "Critical Thinking", score: 92, targetPhrase: "كُتِبَ العَهْدُ وَنُشِرَ البَيَانُ", attemptsCount: 3 },
        { id: "g11-m7", code: "المعيار 7.1", indicatorCode: "مؤشر 7.1.12", indicatorAr: "ينطق المقامات والمخطوطات التراثية بإعراب شامل دقيق", indicatorEn: "Recites classical heritage prose with exact diacritics", nameAr: "نطق المقامات العربية والتراث المعرفي", nameEn: "Classical Heritage Manuscripts Articulation", category: "literature", competencyAr: "التقصي والبحث", competencyEn: "Research & Inquiry", score: 95, targetPhrase: "حَدَّثَنَا عِيسَى بْنُ هِشَامٍ قَالَ", attemptsCount: 4 },
        { id: "g11-m8", code: "المعيار 8.1", indicatorCode: "مؤشر 8.1.12", indicatorAr: "ينطق الجمل التفسيرية والاعتراضية بنبر منخفض مميز", indicatorEn: "Modulates pitch for parenthetical & explanatory clauses", nameAr: "النطق الصوتي للجمل الاعتراضية والتفسيرية", nameEn: "Parenthetical Clause Vocal Modulation", category: "pronunciation", competencyAr: "التواصل", competencyEn: "Communication", score: 89, targetPhrase: "حَضَرَ الأُسْتَاذُ - رَحِمَهُ اللَّهُ - وَأَلْقَى المَحَاضَرَةَ", attemptsCount: 3 }
      ];

    case "Grade 12":
    default:
      return [
        { id: "g12-m1", code: "المعيار 1.1", indicatorCode: "مؤشر 1.1.13", indicatorAr: "يقرأ النصوص القياسية المعقدة بنسبة دقة 98%+ بدون لحن نحوي", indicatorEn: "Reads high-level national standards text with 98%+ accuracy", nameAr: "إتقان القراءة المعيارية الشاملة", nameEn: "Senior High Comprehensive Masterpiece", category: "pronunciation", competencyAr: "التفكير الناقد", competencyEn: "Critical Thinking", score: 96, targetPhrase: "الْحَضَارَةُ الإِنْسَانِيَّةُ تَقُومُ عَلَى الْعِلْمِ وَالأَخْلاَقِ", attemptsCount: 5, lastPracticed: "2026-08-01" },
        { id: "g12-m2", code: "المعيار 2.1", indicatorCode: "مؤشر 2.1.13", indicatorAr: "يخرج كل حرف من مخرجه الدقيق (الحلق، اللسان، الشفتان) بثبات", indicatorEn: "Articulates all throat & labial phonemes flawlessly", nameAr: "مخارج الحروف الشفهية والحلقية بثبات تام", nameEn: "Phonetic Articulation Masterclass", category: "pronunciation", competencyAr: "التواصل", competencyEn: "Communication", score: 98, targetPhrase: "يَسْتَخْرِجُونَ الْخَيْرَاتِ مِنْ أَعْمَاقِ الأَرْضِ", attemptsCount: 4, lastPracticed: "2026-08-02" },
        { id: "g12-m3", code: "المعيار 3.1", indicatorCode: "مؤشر 3.1.13", indicatorAr: "يضبط أواخر الكلم وفق القواعد النحوية والبلاغية كاملة التشكيل", indicatorEn: "Vocalizes complex classical prose with 100% case accuracy", nameAr: "الضبط الشامل للنصوص التراثية والحديثة", nameEn: "Full Diacritics Syntax Master", category: "grammar", competencyAr: "التقصي والبحث", competencyEn: "Research & Inquiry", score: 88, targetPhrase: "تَتَسَابَقُ الأُمَمُ فِى مَيَادِينِ الإِبْدَاعِ وَالرِّيَادَةِ", attemptsCount: 2 },
        { id: "g12-m4", code: "المعيار 4.1", indicatorCode: "مؤشر 4.1.13", indicatorAr: "يقدم العروض التقديمية بنطق خطابي واثق ومقنع لمؤسسات الدولة", indicatorEn: "Delivers high-stakes academic presentations persuasively", nameAr: "الإلقاء الأكاديمي للمناظرات والبحوث", nameEn: "Academic Oration & High-Stakes Speech", category: "literature", competencyAr: "التفكير الإبداعي", competencyEn: "Creative Thinking", score: 92, targetPhrase: "تَقْدِيمُ الرُّؤَى السَّدِيدَةِ لِبِنَاءِ الْمُسْتَقْبَلِ", attemptsCount: 3 },
        { id: "g12-m5", code: "المعيار 5.1", indicatorCode: "مؤشر 5.1.13", indicatorAr: "يستوفي كافة الكفايات والمؤشرات الوطنية لوزارة التربية بنجاح", indicatorEn: "Fulfills all MoEHE Qatar national exit competencies", nameAr: "التمكن التام من معايير وزارة التربية والتعليم", nameEn: "MoEHE Qatar National Graduation Mastery", category: "pronunciation", competencyAr: "التواصل", competencyEn: "Communication", score: 95, targetPhrase: "قَطَرُ نَبْضُ الْعُلاَ وَمَعْلَمُ الْإِلْهَامِ", attemptsCount: 4 },
        { id: "g12-m6", code: "المعيار 6.1", indicatorCode: "مؤشر 6.1.13", indicatorAr: "ينطق أساليب البلاغة الثلاثة (البيان، البديع، المعاني) بتنغيم متسق", indicatorEn: "Articulates all three rhetorical arts fluently", nameAr: "نطق أساليب البلاغة الثلاثة (البيان والبديع والمعاني)", nameEn: "Mastery of Rhetorical Trio Prosody", category: "literature", competencyAr: "التفكير الإبداعي", competencyEn: "Creative Thinking", score: 94, targetPhrase: "بَلاَغَةُ القَوْلِ تَكْمُنُ فِي إِيجَازِ المَعْنَى وَدِقَّةِ المَبْنَى", attemptsCount: 4 },
        { id: "g12-m7", code: "المعيار 7.1", indicatorCode: "مؤشر 7.1.13", indicatorAr: "ينطق مصطلحات البحث العلمي والجامعي بلغة عربية فصيحة عالية", indicatorEn: "Pronounces university research terms with high academic rigor", nameAr: "نطق مصطلحات البحث الأكاديمي والجامعي", nameEn: "University Capstone Academic Vocabulary", category: "vocabulary", competencyAr: "التقصي والبحث", competencyEn: "Research & Inquiry", score: 91, targetPhrase: "الْمَنَاهِجُ الْعِلْمِيَّةُ وَالْمَرَاجِعُ الأَكَادِيمِيَّةُ", attemptsCount: 3 },
        { id: "g12-m8", code: "المعيار 8.1", indicatorCode: "مؤشر 8.1.13", indicatorAr: "يُقيّم صحة النطق والإعراب لذاته ولغيره بمستويات القياس الوطنية", indicatorEn: "Evaluates self and peer speech against national standard rubrics", nameAr: "التقويم الذاتي لمهارات النطق والطلاقة", nameEn: "National Standard Speech Self-Evaluation", category: "pronunciation", competencyAr: "التفكير الناقد", competencyEn: "Critical Thinking", score: 97, targetPhrase: "الْقِيَاسُ التَّشْخِيصِيُّ الْمُسْتَمِرُّ سَبِيلُ التَّمَيُّزِ", attemptsCount: 5 }
      ];
  }
};

// FULL STUDENT DATASET: 3 distinct student profiles per grade across ALL 13 Grades (KG to Grade 12)!
export const ALL_INITIAL_STUDENTS: StudentProfile[] = [
  // --- KG ---
  {
    id: "student-kg-1",
    nameAr: "أمل بنت عمر العبيدلي",
    nameEn: "Amal Omar Al-Obaidli",
    grade: "KG",
    section: "الروضة (شعبة 1)",
    schoolNameAr: "روضة قطر للتعليم المبكر",
    schoolNameEn: "Qatar Early Learning Kindergarten",
    xp: 380,
    level: 2,
    streakDays: 3,
    badges: DEFAULT_BADGES,
    measurements: createGradeMeasurements("KG"),
    history: []
  },
  {
    id: "student-kg-2",
    nameAr: "حمد بن راشد النعيمي",
    nameEn: "Hamad Rashid Al-Naimi",
    grade: "KG",
    section: "الروضة (شعبة 2)",
    schoolNameAr: "روضة ومدرسة قطر الابتدائية",
    schoolNameEn: "Qatar Kindergarten & Primary",
    xp: 220,
    level: 1,
    streakDays: 2,
    badges: DEFAULT_BADGES.slice(0, 2),
    measurements: createGradeMeasurements("KG").map(m => ({ ...m, score: Math.max(0, m.score - 15) })),
    history: []
  },
  {
    id: "student-kg-3",
    nameAr: "سارة بنت خليفة آل ثاني",
    nameEn: "Sarah Khalifa Al-Thani",
    grade: "KG",
    section: "الروضة (شعبة 3)",
    schoolNameAr: "روضة البيان للتعليم المبكر",
    schoolNameEn: "Al-Bayan Early Learning Kindergarten",
    xp: 450,
    level: 2,
    streakDays: 5,
    badges: DEFAULT_BADGES,
    measurements: createGradeMeasurements("KG").map(m => ({ ...m, score: Math.min(100, m.score + 10) })),
    history: []
  },

  // --- Grade 1 ---
  {
    id: "student-g1-1",
    nameAr: "فاطمة بنت جاسم الكواري",
    nameEn: "Fatima Jassim Al-Kuwari",
    grade: "Grade 1",
    section: "الصف الأول (شعبة أ)",
    schoolNameAr: "مدرسة الشفاء الابتدائية للبنات",
    schoolNameEn: "Al-Shifaa Primary School for Girls",
    xp: 410,
    level: 2,
    streakDays: 4,
    badges: DEFAULT_BADGES,
    measurements: createGradeMeasurements("Grade 1"),
    history: []
  },
  {
    id: "student-g1-2",
    nameAr: "محمد بن عبد الله السليطي",
    nameEn: "Mohammed Abdullah Al-Sulaiti",
    grade: "Grade 1",
    section: "الصف الأول (شعبة ب)",
    schoolNameAr: "مدرسة عمر بن الخطاب الابتدائية",
    schoolNameEn: "Omar Bin Al-Khattab Primary School",
    xp: 590,
    level: 3,
    streakDays: 6,
    badges: DEFAULT_BADGES,
    measurements: createGradeMeasurements("Grade 1").map(m => ({ ...m, score: Math.min(100, m.score + 8) })),
    history: []
  },
  {
    id: "student-g1-3",
    nameAr: "ريم بنت خالد الكحلوت",
    nameEn: "Reem Khalid Al-Kahlout",
    grade: "Grade 1",
    section: "الصف الأول (شعبة ج)",
    schoolNameAr: "مدرسة الشفاء الابتدائية للبنات",
    schoolNameEn: "Al-Shifaa Primary School for Girls",
    xp: 310,
    level: 2,
    streakDays: 2,
    badges: DEFAULT_BADGES.slice(0, 2),
    measurements: createGradeMeasurements("Grade 1").map(m => ({ ...m, score: Math.max(0, m.score - 12) })),
    history: []
  },

  // --- Grade 2 ---
  {
    id: "student-g2-1",
    nameAr: "سالم بن راشد الحربي",
    nameEn: "Salem Rashid Al-Harbi",
    grade: "Grade 2",
    section: "الصف الثاني (شعبة ب)",
    schoolNameAr: "مدرسة عمر بن الخطاب النموذجية",
    schoolNameEn: "Omar Bin Al-Khattab Model School",
    xp: 420,
    level: 2,
    streakDays: 4,
    badges: DEFAULT_BADGES,
    measurements: createGradeMeasurements("Grade 2"),
    history: []
  },
  {
    id: "student-g2-2",
    nameAr: "دانة بنت سلطان المنصوري",
    nameEn: "Dana Sultan Al-Mansouri",
    grade: "Grade 2",
    section: "الصف الثاني (شعبة أ)",
    schoolNameAr: "مدرسة البيان الابتدائية للبنات",
    schoolNameEn: "Al-Bayan Primary School for Girls",
    xp: 620,
    level: 3,
    streakDays: 7,
    badges: DEFAULT_BADGES,
    measurements: createGradeMeasurements("Grade 2").map(m => ({ ...m, score: Math.min(100, m.score + 12) })),
    history: []
  },
  {
    id: "student-g2-3",
    nameAr: "علي بن جابر الكعبي",
    nameEn: "Ali Jaber Al-Kaabi",
    grade: "Grade 2",
    section: "الصف الثاني (شعبة ج)",
    schoolNameAr: "مدرسة عمر بن الخطاب الابتدائية",
    schoolNameEn: "Omar Bin Al-Khattab Primary School",
    xp: 340,
    level: 2,
    streakDays: 3,
    badges: DEFAULT_BADGES.slice(0, 2),
    measurements: createGradeMeasurements("Grade 2").map(m => ({ ...m, score: Math.max(0, m.score - 10) })),
    history: []
  },

  // --- Grade 3 ---
  {
    id: "student-g3-1",
    nameAr: "مريم بنت حمد الكواري",
    nameEn: "Maryam Hamad Al-Kuwari",
    grade: "Grade 3",
    section: "الصف الثالث (شعبة أ)",
    schoolNameAr: "مدرسة الشفاء بنت عوف الابتدائية للبنات",
    schoolNameEn: "Al-Shifaa Primary School for Girls",
    xp: 690,
    level: 4,
    streakDays: 6,
    badges: DEFAULT_BADGES.map(b => ({ ...b, unlocked: true })),
    measurements: createGradeMeasurements("Grade 3"),
    history: []
  },
  {
    id: "student-g3-2",
    nameAr: "ناصر بن جابر المري",
    nameEn: "Nasser Jaber Al-Marri",
    grade: "Grade 3",
    section: "الصف الثالث (شعبة ب)",
    schoolNameAr: "مدرسة قطر الابتدائية للبنين",
    schoolNameEn: "Qatar Primary School for Boys",
    xp: 540,
    level: 3,
    streakDays: 5,
    badges: DEFAULT_BADGES,
    measurements: createGradeMeasurements("Grade 3").map(m => ({ ...m, score: Math.min(100, m.score + 9) })),
    history: []
  },
  {
    id: "student-g3-3",
    nameAr: "عبد الله بن غانم العلي",
    nameEn: "Abdullah Ghanim Al-Ali",
    grade: "Grade 3",
    section: "الصف الثالث (شعبة ج)",
    schoolNameAr: "مدرسة اليرموك الابتدائية للبنين",
    schoolNameEn: "Al-Yarmouk Primary School for Boys",
    xp: 480,
    level: 3,
    streakDays: 4,
    badges: DEFAULT_BADGES,
    measurements: createGradeMeasurements("Grade 3").map(m => ({ ...m, score: Math.max(0, m.score - 8) })),
    history: []
  },

  // --- Grade 4 ---
  {
    id: "student-g4-1",
    nameAr: "طارق بن سعد السيد",
    nameEn: "Tariq Saad Al-Sayed",
    grade: "Grade 4",
    section: "الصف الرابع (شعبة ج)",
    schoolNameAr: "مدرسة اليرموك الابتدائية للبنين",
    schoolNameEn: "Al-Yarmouk Primary School for Boys",
    xp: 710,
    level: 4,
    streakDays: 7,
    badges: DEFAULT_BADGES,
    measurements: createGradeMeasurements("Grade 4"),
    history: []
  },
  {
    id: "student-g4-2",
    nameAr: "مريم بنت سعيد الهاجري",
    nameEn: "Maryam Saeed Al-Hajri",
    grade: "Grade 4",
    section: "الصف الرابع (شعبة أ)",
    schoolNameAr: "مدرسة البيان الابتدائية للبنات",
    schoolNameEn: "Al-Bayan Primary School for Girls",
    xp: 530,
    level: 3,
    streakDays: 4,
    badges: DEFAULT_BADGES,
    measurements: createGradeMeasurements("Grade 4").map(m => ({ ...m, score: Math.min(100, m.score + 11) })),
    history: []
  },
  {
    id: "student-g4-3",
    nameAr: "نورة بنت عبد الله الكواري",
    nameEn: "Noura Abdullah Al-Kuwari",
    grade: "Grade 4",
    section: "الصف الرابع (شعبة ب)",
    schoolNameAr: "مدرسة الشفاء الابتدائية للبنات",
    schoolNameEn: "Al-Shifaa Primary School for Girls",
    xp: 480,
    level: 3,
    streakDays: 3,
    badges: DEFAULT_BADGES,
    measurements: createGradeMeasurements("Grade 4").map(m => ({ ...m, score: Math.max(0, m.score - 8) })),
    history: []
  },

  // --- Grade 5 ---
  {
    id: "student-g5-1",
    nameAr: "أحمد بن حمد المهندي",
    nameEn: "Ahmed Hamad Al-Mohannadi",
    grade: "Grade 5",
    section: "الصف الخامس (شعبة أ)",
    schoolNameAr: "مدرسة الخور النموذجية للبنين",
    schoolNameEn: "Al-Khor Model School for Boys",
    xp: 750,
    level: 4,
    streakDays: 6,
    badges: DEFAULT_BADGES.map(b => b.id === "b-mastery" ? { ...b, unlocked: true, unlockedAt: "2026-08-02" } : b),
    measurements: createGradeMeasurements("Grade 5"),
    history: []
  },
  {
    id: "student-g5-2",
    nameAr: "عائشة بنت محمد الحمادي",
    nameEn: "Aisha Mohammed Al-Hammadi",
    grade: "Grade 5",
    section: "الصف الخامس (شعبة ب)",
    schoolNameAr: "مدرسة البيان الابتدائية للبنات",
    schoolNameEn: "Al-Bayan Primary School for Girls",
    xp: 790,
    level: 4,
    streakDays: 8,
    badges: DEFAULT_BADGES.map(b => ({ ...b, unlocked: true })),
    measurements: createGradeMeasurements("Grade 5").map(m => ({ ...m, score: Math.min(100, m.score + 8) })),
    history: []
  },
  {
    id: "student-g5-3",
    nameAr: "سلطان بن فهد الكواري",
    nameEn: "Sultan Fahad Al-Kuwari",
    grade: "Grade 5",
    section: "الصف الخامس (شعبة ج)",
    schoolNameAr: "مدرسة الخور الابتدائية للبنين",
    schoolNameEn: "Al-Khor Primary School for Boys",
    xp: 510,
    level: 3,
    streakDays: 3,
    badges: DEFAULT_BADGES,
    measurements: createGradeMeasurements("Grade 5").map(m => ({ ...m, score: Math.max(0, m.score - 10) })),
    history: []
  },

  // --- Grade 6 ---
  {
    id: "student-g6-1",
    nameAr: "ناصر بن مبارك الهاجري",
    nameEn: "Nasser Mubarak Al-Hajri",
    grade: "Grade 6",
    section: "الصف السادس (شعبة ب)",
    schoolNameAr: "مدرسة قطر الابتدائية للبنين",
    schoolNameEn: "Qatar Primary School for Boys",
    xp: 890,
    level: 5,
    streakDays: 8,
    badges: DEFAULT_BADGES.map(b => ({ ...b, unlocked: true })),
    measurements: createGradeMeasurements("Grade 6"),
    history: []
  },
  {
    id: "student-g6-2",
    nameAr: "ريم بنت فيصل النعيمي",
    nameEn: "Reem Faisal Al-Naimi",
    grade: "Grade 6",
    section: "الصف السادس (شعبة أ)",
    schoolNameAr: "مدرسة الشفاء الابتدائية للبنات",
    schoolNameEn: "Al-Shifaa Primary School for Girls",
    xp: 740,
    level: 4,
    streakDays: 6,
    badges: DEFAULT_BADGES,
    measurements: createGradeMeasurements("Grade 6").map(m => ({ ...m, score: Math.min(100, m.score + 10) })),
    history: []
  },
  {
    id: "student-g6-3",
    nameAr: "لطيفة بنت حمد السليطي",
    nameEn: "Latifa Hamad Al-Sulaiti",
    grade: "Grade 6",
    section: "الصف السادس (شعبة ج)",
    schoolNameAr: "مدرسة البيان الابتدائية للبنات",
    schoolNameEn: "Al-Bayan Primary School for Girls",
    xp: 430,
    level: 2,
    streakDays: 2,
    badges: DEFAULT_BADGES.slice(0, 2),
    measurements: createGradeMeasurements("Grade 6").map(m => ({ ...m, score: Math.max(0, m.score - 14) })),
    history: []
  },

  // --- Grade 7 ---
  {
    id: "student-g7-1",
    nameAr: "خالد بن جاسم آل ثاني",
    nameEn: "Khalid Jassim Al-Thani",
    grade: "Grade 7",
    section: "الصف السابع (شعبة أ)",
    schoolNameAr: "مدرسة حمزة بن عبد المطلب الإعدادية",
    schoolNameEn: "Hamza Bin Abdulmutallab Prep School",
    xp: 620,
    level: 3,
    streakDays: 5,
    badges: DEFAULT_BADGES,
    measurements: createGradeMeasurements("Grade 7"),
    history: []
  },
  {
    id: "student-g7-2",
    nameAr: "جواهر بنت مبارك الكواري",
    nameEn: "Jawaher Mubarak Al-Kuwari",
    grade: "Grade 7",
    section: "الصف السابع (شعبة ب)",
    schoolNameAr: "مدرسة رابعة العدوية الإعدادية للبنات",
    schoolNameEn: "Rabia Al-Adawiya Prep School for Girls",
    xp: 810,
    level: 4,
    streakDays: 9,
    badges: DEFAULT_BADGES.map(b => ({ ...b, unlocked: true })),
    measurements: createGradeMeasurements("Grade 7").map(m => ({ ...m, score: Math.min(100, m.score + 11) })),
    history: []
  },
  {
    id: "student-g7-3",
    nameAr: "فهد بن سالم المري",
    nameEn: "Fahad Salem Al-Marri",
    grade: "Grade 7",
    section: "الصف السابع (شعبة ج)",
    schoolNameAr: "مدرسة الدوحة الإعدادية للبنين",
    schoolNameEn: "Doha Prep School for Boys",
    xp: 630,
    level: 3,
    streakDays: 5,
    badges: DEFAULT_BADGES,
    measurements: createGradeMeasurements("Grade 7").map(m => ({ ...m, score: Math.max(0, m.score - 7) })),
    history: []
  },

  // --- Grade 8 ---
  {
    id: "student-g8-1",
    nameAr: "راشد بن جابر المري",
    nameEn: "Rashid Jaber Al-Marri",
    grade: "Grade 8",
    section: "الصف الثامن (شعبة ب)",
    schoolNameAr: "مدرسة الدوحة الإعدادية للبنين",
    schoolNameEn: "Doha Preparatory School for Boys",
    xp: 880,
    level: 5,
    streakDays: 7,
    badges: DEFAULT_BADGES.map(b => ({ ...b, unlocked: true })),
    measurements: createGradeMeasurements("Grade 8"),
    history: []
  },
  {
    id: "student-g8-2",
    nameAr: "فاطمة بنت عمر العبيدلي",
    nameEn: "Fatima Omar Al-Obaidli",
    grade: "Grade 8",
    section: "الصف الثامن (شعبة أ)",
    schoolNameAr: "مدرسة رابعة العدوية الإعدادية للبنات",
    schoolNameEn: "Rabia Al-Adawiya Prep School for Girls",
    xp: 720,
    level: 4,
    streakDays: 6,
    badges: DEFAULT_BADGES,
    measurements: createGradeMeasurements("Grade 8").map(m => ({ ...m, score: Math.min(100, m.score + 9) })),
    history: []
  },
  {
    id: "student-g8-3",
    nameAr: "سعد بن محمد الكواري",
    nameEn: "Saad Mohammed Al-Kuwari",
    grade: "Grade 8",
    section: "الصف الثامن (شعبة ج)",
    schoolNameAr: "مدرسة الدوحة الإعدادية للبنين",
    schoolNameEn: "Doha Preparatory School for Boys",
    xp: 840,
    level: 4,
    streakDays: 8,
    badges: DEFAULT_BADGES.map(b => ({ ...b, unlocked: true })),
    measurements: createGradeMeasurements("Grade 8").map(m => ({ ...m, score: Math.min(100, m.score + 12) })),
    history: []
  },

  // --- Grade 9 ---
  {
    id: "student-g9-1",
    nameAr: "عبد الله بن يوسف المالكي",
    nameEn: "Abdullah Youssef Al-Malki",
    grade: "Grade 9",
    section: "الصف التاسع (شعبة ج)",
    schoolNameAr: "مدرسة الإمام الشافعي الإعدادية",
    schoolNameEn: "Imam Al-Shafi'i Prep School",
    xp: 780,
    level: 4,
    streakDays: 6,
    badges: DEFAULT_BADGES,
    measurements: createGradeMeasurements("Grade 9"),
    history: []
  },
  {
    id: "student-g9-2",
    nameAr: "موزة بنت ناصر المسند",
    nameEn: "Moza Nasser Al-Misnad",
    grade: "Grade 9",
    section: "الصف التاسع (شعبة أ)",
    schoolNameAr: "مدرسة الخور الإعدادية للبنات",
    schoolNameEn: "Al-Khor Prep School for Girls",
    xp: 890,
    level: 4,
    streakDays: 9,
    badges: DEFAULT_BADGES.map(b => ({ ...b, unlocked: true })),
    measurements: createGradeMeasurements("Grade 9").map(m => ({ ...m, score: Math.min(100, m.score + 8) })),
    history: []
  },
  {
    id: "student-g9-3",
    nameAr: "يوسف بن مبارك الهاجري",
    nameEn: "Youssef Mubarak Al-Hajri",
    grade: "Grade 9",
    section: "الصف التاسع (شعبة ب)",
    schoolNameAr: "مدرسة الإمام الشافعي الإعدادية",
    schoolNameEn: "Imam Al-Shafi'i Prep School",
    xp: 940,
    level: 5,
    streakDays: 10,
    badges: DEFAULT_BADGES.map(b => ({ ...b, unlocked: true })),
    measurements: createGradeMeasurements("Grade 9").map(m => ({ ...m, score: Math.min(100, m.score + 10) })),
    history: []
  },

  // --- Grade 10 ---
  {
    id: "student-g10-1",
    nameAr: "العنود بنت سلطان آل ثاني",
    nameEn: "Alanoud Sultan Al-Thani",
    grade: "Grade 10",
    section: "الصف العاشر (مسار علمي 1)",
    schoolNameAr: "مدرسة آمنة بنت وهب الثانوية للبنات",
    schoolNameEn: "Amna Bint Wahab Secondary School for Girls",
    xp: 960,
    level: 5,
    streakDays: 11,
    badges: DEFAULT_BADGES.map(b => ({ ...b, unlocked: true })),
    measurements: createGradeMeasurements("Grade 10"),
    history: []
  },
  {
    id: "student-g10-2",
    nameAr: "خالد بن علي العلي",
    nameEn: "Khalid Ali Al-Ali",
    grade: "Grade 10",
    section: "الصف العاشر (مسار علمي 2)",
    schoolNameAr: "مدرسة طارق بن زياد الثانوية للبنين",
    schoolNameEn: "Tariq Bin Ziyad Secondary School for Boys",
    xp: 780,
    level: 4,
    streakDays: 6,
    badges: DEFAULT_BADGES.map(b => ({ ...b, unlocked: true })),
    measurements: createGradeMeasurements("Grade 10").map(m => ({ ...m, score: Math.min(100, m.score + 6) })),
    history: []
  },
  {
    id: "student-g10-3",
    nameAr: "غانم بن عبد العزيز الكواري",
    nameEn: "Ghanim Abdulaziz Al-Kuwari",
    grade: "Grade 10",
    section: "الصف العاشر (مسار أدبي 1)",
    schoolNameAr: "مدرسة عمر بن عبد العزيز الثانوية",
    schoolNameEn: "Omar Bin Abdulaziz Secondary School",
    xp: 610,
    level: 3,
    streakDays: 4,
    badges: DEFAULT_BADGES,
    measurements: createGradeMeasurements("Grade 10").map(m => ({ ...m, score: Math.max(0, m.score - 10) })),
    history: []
  },

  // --- Grade 11 ---
  {
    id: "student-g11-1",
    nameAr: "شيخة بنت خليفة المسند",
    nameEn: "Sheikha Khalifa Al-Misnad",
    grade: "Grade 11",
    section: "الصف الحادي عشر (مسار أدبي 2)",
    schoolNameAr: "مدرسة الخور الثانوية للبنات",
    schoolNameEn: "Al-Khor Secondary School for Girls",
    xp: 890,
    level: 5,
    streakDays: 8,
    badges: DEFAULT_BADGES.map(b => ({ ...b, unlocked: true })),
    measurements: createGradeMeasurements("Grade 11"),
    history: []
  },
  {
    id: "student-g11-2",
    nameAr: "راشد بن منصور الكعبي",
    nameEn: "Rashid Mansoor Al-Kaabi",
    grade: "Grade 11",
    section: "الصف الحادي عشر (مسار علمي 1)",
    schoolNameAr: "مدرسة حسان بن ثابت الثانوية للبنين",
    schoolNameEn: "Hassan Bin Thabit Secondary School",
    xp: 990,
    level: 5,
    streakDays: 12,
    badges: DEFAULT_BADGES.map(b => ({ ...b, unlocked: true })),
    measurements: createGradeMeasurements("Grade 11").map(m => ({ ...m, score: Math.min(100, m.score + 5) })),
    history: []
  },
  {
    id: "student-g11-3",
    nameAr: "منيرة بنت عبد الرحمن السيد",
    nameEn: "Mounira Abdulrahman Al-Sayed",
    grade: "Grade 11",
    section: "الصف الحادي عشر (مسار أدبي 1)",
    schoolNameAr: "مدرسة البيان الثانوية للبنات",
    schoolNameEn: "Al-Bayan Secondary School for Girls",
    xp: 730,
    level: 4,
    streakDays: 5,
    badges: DEFAULT_BADGES,
    measurements: createGradeMeasurements("Grade 11").map(m => ({ ...m, score: Math.max(0, m.score - 9) })),
    history: []
  },

  // --- Grade 12 ---
  {
    id: "student-g12-1",
    nameAr: "سارة بنت خالد المهندي",
    nameEn: "Sara Khalid Al-Mohannadi",
    grade: "Grade 12",
    section: "الصف الثاني عشر (علمي 1)",
    schoolNameAr: "مدرسة البيان الثانوية للبنات",
    schoolNameEn: "Al-Bayan Secondary School for Girls",
    xp: 1120,
    level: 6,
    streakDays: 15,
    badges: DEFAULT_BADGES.map(b => ({ ...b, unlocked: true })),
    measurements: createGradeMeasurements("Grade 12"),
    history: []
  },
  {
    id: "student-g12-2",
    nameAr: "جاسم بن عبد الله الكعبي",
    nameEn: "Jassim Abdullah Al-Kaabi",
    grade: "Grade 12",
    section: "الصف الثاني عشر (علمي 2)",
    schoolNameAr: "مدرسة طارق بن زياد الثانوية للبنين",
    schoolNameEn: "Tariq Bin Ziyad Secondary School for Boys",
    xp: 980,
    level: 5,
    streakDays: 9,
    badges: DEFAULT_BADGES.map(b => ({ ...b, unlocked: true })),
    measurements: createGradeMeasurements("Grade 12").map(m => ({ ...m, score: Math.min(100, m.score + 3) })),
    history: []
  },
  {
    id: "student-g12-3",
    nameAr: "خليفة بن راشد الغانم",
    nameEn: "Khalifa Rashid Al-Ghanim",
    grade: "Grade 12",
    section: "الصف الثاني عشر (أدبي 1)",
    schoolNameAr: "مدرسة عمر بن عبد العزيز الثانوية",
    schoolNameEn: "Omar Bin Abdulaziz Secondary School",
    xp: 880,
    level: 4,
    streakDays: 6,
    badges: DEFAULT_BADGES.map(b => ({ ...b, unlocked: true })),
    measurements: createGradeMeasurements("Grade 12").map(m => ({ ...m, score: Math.max(0, m.score - 7) })),
    history: []
  }
];
