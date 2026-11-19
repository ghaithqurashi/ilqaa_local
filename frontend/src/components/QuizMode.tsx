import React, { useState, useEffect } from "react";
import { 
  CheckCircle2, 
  X, 
  Sparkles, 
  HelpCircle, 
  RotateCcw, 
  ListFilter, 
  Layers, 
  FileCheck, 
  Gamepad2, 
  ArrowRight,
  Volume2,
  Trophy,
  Award,
  Check
} from "lucide-react";
import { PracticeQuestion, Measurement, StudentProfile } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { playRewardSound } from "../lib/audioAndEffects";

interface QuizModeProps {
  questions: PracticeQuestion[];
  measurement: Measurement;
  student: StudentProfile;
  language: "ar" | "en";
  theme: any;
  onEarnReward: (xp: number, coins: number, titleAr: string, titleEn: string) => void;
  onUpdateScore?: (measurementId: string, score: number) => void;
}

export const QuizMode: React.FC<QuizModeProps> = ({
  questions,
  measurement,
  student,
  language,
  theme,
  onEarnReward,
  onUpdateScore
}) => {
  const isRtl = language === "ar";
  const [activeTab, setActiveTab] = useState<"multiple_choice" | "word_assembly" | "fill_blank" | "arcade">("multiple_choice");
  const [currentIdx, setCurrentIdx] = useState(0);

  // States for Multiple Choice & Fill in Blank
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [selectedWordOption, setSelectedWordOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Drag and drop / Word assembly state
  const [assembledWords, setAssembledWords] = useState<string[]>([]);
  const [availableWords, setAvailableWords] = useState<string[]>([]);
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  // Arcade mode score
  const [arcadeScore, setArcadeScore] = useState(0);
  const [arcadeFinished, setArcadeFinished] = useState(false);

  // Filter questions for the active mode
  const filteredQuestions = activeTab === "arcade" 
    ? questions 
    : questions.filter(q => q.type === activeTab);

  const currentQ = filteredQuestions[currentIdx] || questions[0];

  // Initialize word assembly when question changes
  useEffect(() => {
    setSelectedOption(null);
    setSelectedWordOption(null);
    setIsSubmitted(false);

    if (currentQ && currentQ.type === "word_assembly" && currentQ.shuffledWordsAr) {
      setAvailableWords([...currentQ.shuffledWordsAr]);
      setAssembledWords([]);
    }
  }, [currentIdx, activeTab, currentQ?.id]);

  const cleanStr = (s: string) => s.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()؟?،"']/g, "").trim();
  const cleanArabic = (s: string) => {
    return s
      .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
      .replace(/[أإآءئؤ]/g, "ا")
      .replace(/ة/g, "ه")
      .replace(/[ىي]/g, "ي");
  };

  // Sound playback helper
  const playAudio = (text: string) => {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = isRtl ? "ar-SA" : "en-US";
    utterance.rate = 0.85;
    window.speechSynthesis.speak(utterance);
  };

  // Multiple Choice Selection
  const handleSelectMC = (optIdx: number) => {
    if (isSubmitted) return;
    setSelectedOption(optIdx);
    setIsSubmitted(true);

    const option = currentQ.options ? currentQ.options[optIdx] : null;
    if (option && option.isCorrect) {
      playRewardSound("correct");
      if (activeTab === "arcade") setArcadeScore(prev => prev + 1);
      onEarnReward(
        currentQ.xpReward || 25,
        currentQ.coinsReward || 5,
        isRtl ? "إجابة دقيقة في المعيار! 🎯" : "Correct Standard Answer! 🎯",
        isRtl ? "أحسنت في اختيار الإجابة الصحيحة" : "Great job selecting the right answer"
      );
      if (onUpdateScore) {
        onUpdateScore(measurement.id, Math.max(measurement.score, 90));
      }
    } else {
      playRewardSound("wrong");
    }
  };

  // Word Assembly (Drag-and-Drop / Click-to-Move)
  const handleAddWord = (word: string, idx: number) => {
    if (isSubmitted) return;
    setAssembledWords(prev => [...prev, word]);
    setAvailableWords(prev => prev.filter((_, i) => i !== idx));
  };

  const handleRemoveWord = (word: string, idx: number) => {
    if (isSubmitted) return;
    setAssembledWords(prev => prev.filter((_, i) => i !== idx));
    setAvailableWords(prev => [...prev, word]);
  };

  // Drag and drop HTML5 event handlers
  const handleDragStart = (e: React.DragEvent, index: number, word: string) => {
    setDraggedItemIndex(index);
    e.dataTransfer.setData("text/plain", word);
  };

  const handleDropOnDropzone = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedItemIndex !== null && availableWords[draggedItemIndex] !== undefined) {
      const word = availableWords[draggedItemIndex];
      handleAddWord(word, draggedItemIndex);
      setDraggedItemIndex(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleVerifyAssembly = () => {
    if (isSubmitted) return;
    setIsSubmitted(true);
    const userSentence = assembledWords.join(" ");
    const target = currentQ.targetSentenceAr || measurement.targetPhrase || "";

    if (cleanArabic(cleanStr(userSentence)) === cleanArabic(cleanStr(target))) {
      playRewardSound("levelup");
      playAudio(target);
      if (activeTab === "arcade") setArcadeScore(prev => prev + 1);
      onEarnReward(
        currentQ.xpReward || 35,
        currentQ.coinsReward || 8,
        isRtl ? "تركيب رائع للجملة! 🧩" : "Sentence Assembled! 🧩",
        isRtl ? "تمت محاذاة الكلمات طبقاً لمؤشر المعيار القومي" : "Words correctly ordered"
      );
      if (onUpdateScore) {
        onUpdateScore(measurement.id, Math.max(measurement.score, 95));
      }
    } else {
      playRewardSound("wrong");
    }
  };

  // Fill in the blank selection
  const handleSelectBlank = (optionWord: string) => {
    if (isSubmitted) return;
    setSelectedWordOption(optionWord);
    setIsSubmitted(true);

    const isCorrect = cleanArabic(cleanStr(optionWord)) === cleanArabic(cleanStr(currentQ.missingWordAr || ""));
    if (isCorrect) {
      playRewardSound("correct");
      if (activeTab === "arcade") setArcadeScore(prev => prev + 1);
      onEarnReward(
        currentQ.xpReward || 30,
        currentQ.coinsReward || 6,
        isRtl ? "إكمال النحو بنجاح! ✍️" : "Blank Filled Correctly! ✍️",
        isRtl ? "إيقاع ضبط نحوي ممتاز" : "Excellent diacritic precision"
      );
      if (onUpdateScore) {
        onUpdateScore(measurement.id, Math.max(measurement.score, 88));
      }
    } else {
      playRewardSound("wrong");
    }
  };

  const handleNextQuestion = () => {
    if (currentIdx < filteredQuestions.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      if (activeTab === "arcade") {
        setArcadeFinished(true);
      } else {
        setCurrentIdx(0);
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6" id="quiz-mode-container" dir={isRtl ? "rtl" : "ltr"}>
      
      {/* Quiz Header & Mode Navigation Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${theme.badge}`}>
            {measurement.code} - {isRtl ? "وحدة الاختبارات التفاعلية" : "Interactive Quiz Module"}
          </span>
          <h3 className="text-lg font-black font-serif text-slate-800 mt-1">
            {isRtl ? `تطبيقات المعيار: ${measurement.nameAr}` : `Assessment for: ${measurement.nameEn}`}
          </h3>
        </div>

        {/* Practice Mode Switcher */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => {
              setActiveTab("multiple_choice");
              setCurrentIdx(0);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "multiple_choice"
                ? "bg-white text-slate-800 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <ListFilter className="w-3.5 h-3.5 text-indigo-600" />
            <span>{isRtl ? "اختيار من متعدد" : "Multiple Choice"}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("word_assembly");
              setCurrentIdx(0);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "word_assembly"
                ? "bg-white text-slate-800 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isRtl ? "سحب وترتيب الكلمات" : "Drag & Drop Assembly"}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("fill_blank");
              setCurrentIdx(0);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "fill_blank"
                ? "bg-white text-slate-800 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <FileCheck className="w-3.5 h-3.5 text-amber-600" />
            <span>{isRtl ? "إكمال الفراغ" : "Fill in Blank"}</span>
          </button>

          <button
            onClick={() => {
              setActiveTab("arcade");
              setCurrentIdx(0);
              setArcadeScore(0);
              setArcadeFinished(false);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === "arcade"
                ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-xs"
                : "text-purple-700 hover:bg-purple-50"
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>{isRtl ? "تحدي Arcade" : "Arcade"}</span>
          </button>
        </div>
      </div>

      {/* QUESTION DISPLAY AREA */}
      {!currentQ ? (
        <div className="p-8 text-center text-slate-400 text-xs font-bold">
          {isRtl ? "لا توجد أسئلة متاحة حالياً لطلبك" : "No questions available."}
        </div>
      ) : activeTab === "arcade" && arcadeFinished ? (
        /* Arcade Finished Result Screen */
        <div className="p-8 bg-gradient-to-tr from-purple-50 to-indigo-50 border border-purple-100 rounded-2xl text-center space-y-4 animate-fadeIn">
          <Trophy className="w-16 h-16 text-amber-500 mx-auto animate-bounce" />
          <h4 className="text-xl font-black font-serif text-slate-800">
            {isRtl ? "🎉 اكتمل تحدي الإتقان الشامل (Arcade)!" : "🎉 Arcade Quest Completed!"}
          </h4>
          <p className="text-sm text-slate-600 font-bold">
            {isRtl ? `درجتك الإجمالية: ${arcadeScore} من ${questions.length} إجابات صحيحة` : `Score: ${arcadeScore} out of ${questions.length}`}
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <button
              onClick={() => {
                setArcadeFinished(false);
                setCurrentIdx(0);
                setArcadeScore(0);
              }}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>{isRtl ? "إعادة التحدي" : "Retry Arcade"}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Question Prompt Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-extrabold text-slate-400">
                {isRtl ? `سؤال رقم ${currentIdx + 1} من ${filteredQuestions.length}` : `Question ${currentIdx + 1} of ${filteredQuestions.length}`}
              </span>
              <h4 className="text-base md:text-lg font-black font-serif text-slate-800 leading-relaxed">
                {isRtl ? currentQ.promptAr : currentQ.promptEn}
              </h4>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => playAudio(currentQ.promptAr)}
                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-all cursor-pointer"
                title={isRtl ? "استماع للسؤال" : "Listen Prompt"}
              >
                <Volume2 className="w-4 h-4" />
              </button>
              <span className="px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-black">
                +{currentQ.xpReward || 25} XP
              </span>
            </div>
          </div>

          {/* 1. TYPE: MULTIPLE CHOICE */}
          {(currentQ.type === "multiple_choice" || (activeTab === "arcade" && currentQ.type === "multiple_choice")) && currentQ.options && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {currentQ.options.map((opt, idx) => {
                const isSelected = selectedOption === idx;
                let style = "bg-white border-slate-200 hover:border-indigo-400 text-slate-700 hover:bg-slate-50";

                if (isSubmitted) {
                  if (opt.isCorrect) {
                    style = "bg-emerald-50 border-emerald-500 text-emerald-950 font-black shadow-xs";
                  } else if (isSelected) {
                    style = "bg-rose-50 border-rose-400 text-rose-950 font-bold";
                  } else {
                    style = "bg-slate-50 border-slate-100 text-slate-400 opacity-60";
                  }
                }

                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectMC(idx)}
                    disabled={isSubmitted}
                    className={`p-4 rounded-xl border text-right transition-all flex items-center justify-between cursor-pointer ${style}`}
                  >
                    <span className="text-sm font-bold">
                      {isRtl ? opt.textAr : opt.textEn}
                    </span>
                    {isSubmitted && opt.isCorrect && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    )}
                    {isSubmitted && isSelected && !opt.isCorrect && (
                      <X className="w-5 h-5 text-rose-600 shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* 2. TYPE: WORD ASSEMBLY (DRAG AND DROP) */}
          {(currentQ.type === "word_assembly" || (activeTab === "arcade" && currentQ.type === "word_assembly")) && (
            <div className="space-y-5">
              
              {/* Drop Target Sentence Container */}
              <div
                onDrop={handleDropOnDropzone}
                onDragOver={handleDragOver}
                className="min-h-[90px] p-4 bg-slate-50/80 rounded-2xl border-2 border-dashed border-indigo-200 flex flex-wrap gap-2.5 items-center justify-center transition-all"
              >
                {assembledWords.length === 0 ? (
                  <span className="text-xs text-slate-400 font-bold">
                    {isRtl ? "اسحب الكلمات إلى هنا أو انقر عليها بالترتيب الصحيح 🧩" : "Drag words here or tap them in order 🧩"}
                  </span>
                ) : (
                  assembledWords.map((word, idx) => (
                    <motion.button
                      key={idx}
                      layout
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      onClick={() => handleRemoveWord(word, idx)}
                      className="px-4 py-2 bg-indigo-600 text-white font-black text-sm rounded-xl shadow-xs hover:bg-indigo-700 cursor-pointer flex items-center gap-1.5"
                    >
                      <span>{word}</span>
                      <X className="w-3.5 h-3.5 opacity-70" />
                    </motion.button>
                  ))
                )}
              </div>

              {/* Bank of Available Words to Drag / Tap */}
              <div className="flex flex-wrap gap-2.5 justify-center p-3 bg-white rounded-xl border border-slate-100">
                {availableWords.map((word, idx) => (
                  <button
                    key={idx}
                    draggable
                    onDragStart={(e) => handleDragStart(e, idx, word)}
                    onClick={() => handleAddWord(word, idx)}
                    disabled={isSubmitted}
                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 active:bg-indigo-100 border border-slate-200 font-bold text-slate-800 text-sm rounded-xl transition-all cursor-grab active:cursor-grabbing shadow-2xs hover:scale-105"
                  >
                    {word}
                  </button>
                ))}
              </div>

              {!isSubmitted && assembledWords.length > 0 && (
                <div className="flex justify-center pt-2">
                  <button
                    onClick={handleVerifyAssembly}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isRtl ? "التحقق من الترتيب النحوي 🚀" : "Verify Sentence Order 🚀"}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* 3. TYPE: FILL IN THE BLANK */}
          {(currentQ.type === "fill_blank" || (activeTab === "arcade" && currentQ.type === "fill_blank")) && (
            <div className="space-y-4">
              <div className="p-6 bg-amber-50/60 rounded-2xl border border-amber-100 text-center text-lg font-serif font-black text-slate-800">
                {isRtl ? currentQ.sentenceWithBlankAr : currentQ.sentenceWithBlankEn}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {(isRtl ? currentQ.blankOptionsAr : currentQ.blankOptionsEn)?.map((opt, idx) => {
                  const isSelected = selectedWordOption === opt;
                  const isCorrectWord = cleanArabic(cleanStr(opt)) === cleanArabic(cleanStr(currentQ.missingWordAr || ""));
                  
                  let style = "bg-white border-slate-200 hover:border-amber-400 text-slate-800";
                  if (isSubmitted) {
                    if (isCorrectWord) {
                      style = "bg-emerald-50 border-emerald-500 text-emerald-950 font-black";
                    } else if (isSelected) {
                      style = "bg-rose-50 border-rose-400 text-rose-950 font-bold";
                    } else {
                      style = "bg-slate-50 border-slate-100 text-slate-400 opacity-60";
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleSelectBlank(opt)}
                      disabled={isSubmitted}
                      className={`p-3.5 rounded-xl border text-center font-serif text-base font-bold transition-all cursor-pointer ${style}`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Answer Feedback & Navigation Controls */}
          {isSubmitted && (
            <div className="p-4 rounded-xl bg-indigo-50/90 border border-indigo-100 space-y-3 animate-fadeIn">
              <div className="flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                <p className="text-xs font-bold text-indigo-900 leading-relaxed">
                  <strong>{isRtl ? "الشرح الإرشادي للمعيار:" : "Standard Feedback:"}</strong> {isRtl ? currentQ.explanationAr : currentQ.explanationEn}
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleNextQuestion}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2"
                >
                  <span>{isRtl ? "السؤال التالي ➔" : "Next Question ➔"}</span>
                </button>
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
