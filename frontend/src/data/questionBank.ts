import { PracticeQuestion, Measurement } from "../types";

// Dynamic helper to generate question banks aligned with Qatar Ministry of Education & Higher Education (MoEHE) standards
export function getQuestionsForMeasurement(
  measurement: Measurement,
  grade: string,
  language: "ar" | "en"
): PracticeQuestion[] {
  const mId = measurement.id || "m1";
  const code = measurement.code || "المعيار 1.1";
  const phrase = measurement.targetPhrase || "العلم نور";
  const nameAr = measurement.nameAr;
  const nameEn = measurement.nameEn;

  // 1. Multiple Choice Questions (اختر الإجابة الصحيحة)
  const mcQuestions: PracticeQuestion[] = [
    {
      id: `${mId}-mc1`,
      type: "multiple_choice",
      standardCode: code,
      indicatorCode: measurement.indicatorCode,
      promptAr: `في المعيار القومي (${nameAr})، ما هي الحركة الإعرابية أو الشكل النحوي الصحيح المطلوبة لـ "${phrase.split(' ')[0] || phrase}"؟`,
      promptEn: `In standard (${nameEn}), select the correct diacritic/vowel form for "${phrase.split(' ')[0] || phrase}":`,
      options: [
        {
          textAr: `${phrase.split(' ')[0] || phrase} (الضبط بالنطق السليم)`,
          textEn: `${phrase.split(' ')[0] || phrase} (Correct Diacritics)`,
          isCorrect: true
        },
        {
          textAr: `${phrase.split(' ')[0] || phrase}اً (التنوين الخاطئ)`,
          textEn: `${phrase.split(' ')[0] || phrase} (Incorrect Tanween)`,
          isCorrect: false
        },
        {
          textAr: `${phrase.split(' ')[0] || phrase}ٍ (الكسر غير المطابق)`,
          textEn: `${phrase.split(' ')[0] || phrase} (Mismatched Kasrah)`,
          isCorrect: false
        },
        {
          textAr: `${phrase.split(' ')[0] || phrase}ـْ (السكون الخاطئ)`,
          textEn: `${phrase.split(' ')[0] || phrase} (Incorrect Sukoon)`,
          isCorrect: false
        }
      ],
      explanationAr: `الإجابة الصحيحة تطبق ضبط الحركة الرسمية المطلوبة في مؤشر الأداء الوطني للصف (${grade}).`,
      explanationEn: `Correct choice adheres strictly to national MoEHE standard diacritized indicators for (${grade}).`,
      xpReward: 25,
      coinsReward: 5
    },
    {
      id: `${mId}-mc2`,
      type: "multiple_choice",
      standardCode: code,
      indicatorCode: measurement.indicatorCode,
      promptAr: `حدد الكفاية اللغوية أو المهارة الأساسية المستهدفة في (${measurement.indicatorAr || nameAr})؟`,
      promptEn: `Identify the core competency targeting (${measurement.indicatorEn || nameEn}):`,
      options: [
        {
          textAr: measurement.competencyAr || "التواصل والنطق السليم",
          textEn: measurement.competencyEn || "Communication & Speech",
          isCorrect: true
        },
        {
          textAr: "الكتابة اليدوية فقط",
          textEn: "Handwriting only",
          isCorrect: false
        },
        {
          textAr: "الرسم التوضيحي",
          textEn: "Visual Illustration",
          isCorrect: false
        },
        {
          textAr: "الترجمة الفورية",
          textEn: "Simultaneous Translation",
          isCorrect: false
        }
      ],
      explanationAr: `المؤشر الوطني ينتمي لكفاية ${measurement.competencyAr || 'التواصل'} حسب وثيقة مناهج قطر.`,
      explanationEn: `This MoEHE indicator maps to the ${measurement.competencyEn || 'Communication'} competency domain.`,
      xpReward: 25,
      coinsReward: 5
    }
  ];

  // 2. Word Assembly Questions (ترتيب الجملة أو التركيب اللغوي)
  const targetWords = phrase.split(/\s+/).filter(Boolean);
  // Ensure we have at least 3 words for assembly
  const wordsForAssembly = targetWords.length >= 3 
    ? targetWords 
    : [...targetWords, "في", "المنهج", "القطري"].slice(0, 4);
    
  // Shuffle words deterministic copy
  const shuffled = [...wordsForAssembly].sort(() => 0.5 - Math.random());
  if (shuffled.join(" ") === wordsForAssembly.join(" ")) {
    shuffled.reverse();
  }

  const assemblyQuestion: PracticeQuestion = {
    id: `${mId}-assembly`,
    type: "word_assembly",
    standardCode: code,
    indicatorCode: measurement.indicatorCode,
    promptAr: `رتب البطاقات التالية بالترتيب الصحيح لتكوين تركيب المعيار: "${wordsForAssembly.join(" ")}"`,
    promptEn: `Arrange the word cards in correct order to match the standard phrase: "${wordsForAssembly.join(" ")}"`,
    targetSentenceAr: wordsForAssembly.join(" "),
    targetSentenceEn: wordsForAssembly.join(" "),
    shuffledWordsAr: shuffled,
    shuffledWordsEn: shuffled,
    explanationAr: `الترتيب النحوي الصحيح هو: "${wordsForAssembly.join(" ")}" بناءً على مؤشر المعيار.`,
    explanationEn: `The correct syntactical order is: "${wordsForAssembly.join(" ")}".`,
    xpReward: 35,
    coinsReward: 8
  };

  // 3. Fill in the Blank Questions (إكمل الفراغ)
  const missingIdx = Math.floor(wordsForAssembly.length / 2);
  const missingWord = wordsForAssembly[missingIdx] || wordsForAssembly[0];
  const sentenceWithBlank = wordsForAssembly.map((w, idx) => idx === missingIdx ? "______" : w).join(" ");
  
  const distractor1 = missingWord + "ٌ";
  const distractor2 = "الـ" + missingWord;
  const distractor3 = missingWord.replace(/أ|إ|آ/g, "ا");

  const fillBlankQuestion: PracticeQuestion = {
    id: `${mId}-blank`,
    type: "fill_blank",
    standardCode: code,
    indicatorCode: measurement.indicatorCode,
    promptAr: `اختر الكلمة المناسبة لإكمال الجملة المعيارية: "${sentenceWithBlank}"`,
    promptEn: `Select the missing word to complete the standard sentence: "${sentenceWithBlank}"`,
    sentenceWithBlankAr: sentenceWithBlank,
    sentenceWithBlankEn: sentenceWithBlank,
    missingWordAr: missingWord,
    missingWordEn: missingWord,
    blankOptionsAr: [missingWord, distractor1, distractor2, distractor3].sort(() => 0.5 - Math.random()),
    blankOptionsEn: [missingWord, distractor1, distractor2, distractor3].sort(() => 0.5 - Math.random()),
    explanationAr: `الكلمة الصحيحة بالنطق والإعراب هي "${missingWord}".`,
    explanationEn: `The correct word for the blank is "${missingWord}".`,
    xpReward: 30,
    coinsReward: 6
  };

  return [...mcQuestions, assemblyQuestion, fillBlankQuestion];
}
