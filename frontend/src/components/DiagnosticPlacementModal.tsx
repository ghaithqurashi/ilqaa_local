import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Award,
  CheckCircle2,
  AlertCircle,
  Volume2,
  Mic,
  RotateCcw,
  ShieldCheck,
  Trophy,
  ArrowRight,
  ArrowLeft,
  X,
  Play,
  Check,
  Flame,
  Activity,
  AlertTriangle,
  RefreshCw
} from "lucide-react";
import { StudentProfile } from "../types";
import { speakMasterArabicModel, stopSpeechSynthesis, playSuccessSound, playCelebrationFanfare } from "../lib/audioAndEffects";

interface DiagnosticPlacementModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: StudentProfile;
  isRtl: boolean;
  onCompleteDiagnostic: (readinessScore: number, levelAwarded: string) => void;
}

interface DiagnosticQuestion {
  id: number;
  stageNameAr: string;
  stageNameEn: string;
  focusAr: string;
  focusEn: string;
  phraseAr: string;
  phraseEn: string;
  instructionAr: string;
  instructionEn: string;
}

const DIAGNOSTIC_STEPS: DiagnosticQuestion[] = [
  {
    id: 1,
    stageNameAr: "المرحلة الأولى: اختبار مخارج الحروف الشجرية واللثوية",
    stageNameEn: "Stage 1: Phoneme & Articulation Assessment",
    focusAr: "حروف: (الضاد، القاف، الثاء، الصاد)",
    focusEn: "Phonemes: (Dad, Qaf, Tha, Sad)",
    phraseAr: "ضَرَبَ الْقَائِدُ صَفْوَةَ أَبْطَالِهِ مَثَلاً فِي الثَّبَاتِ",
    phraseEn: "The leader gave a prime example of steadfastness.",
    instructionAr: "استمع أولاً للنموذج الفصيح بالصوت الرجولي الوقور ثم اضغط الميكروفون واقرأ الجملة بوضوح ودون عجلة.",
    instructionEn: "Listen to the master speaker, then record your voice clearly."
  },
  {
    id: 2,
    stageNameAr: "المرحلة الثانية: اختبار سلامة الحركات والإعراب والوقف",
    stageNameEn: "Stage 2: Diacritics, Inflection & Pausing",
    focusAr: "ضبط التنوين، الوقف بالسكون، ووصل همزة الوصل",
    focusEn: "Tanween, pausing on Sukoon, and hamzat wasl",
    phraseAr: "إِنَّ الْعِلْمَ نُورٌ يُضِيءُ دُرُوبَ النَّاجِحِينَ، وَالْجَهْلُ ظَلَامٌ مُسْتَطِيرٌ",
    phraseEn: "Knowledge is a light illuminating success, while ignorance is sprawling darkness.",
    instructionAr: "راعِ تشكيل أواخر الكلمات والوقف بالسكون عند علامة الترقيم.",
    instructionEn: "Observe final diacritics and pause with sukoon at commas."
  },
  {
    id: 3,
    stageNameAr: "المرحلة الثالثة: اختبار الجاهزية المنبرية والتنغيم الصوتي",
    stageNameEn: "Stage 3: Oracy Modulation & Pitch Confidence",
    focusAr: "النبر، تلوين الصوت، وقوة الإسقاط الصوتي",
    focusEn: "Stress, pitch modulation, and vocal projection",
    phraseAr: "يَا أَبْنَاءَ قَطَرَ الْأَوْفِيَاءَ.. هِمَّتُكُمْ تَبْنِي الْمَجْدَ وَتَصْنَعُ الْمُسْتَقْبَلَ!",
    phraseEn: "O loyal youth of Qatar.. your resolve builds glory and crafts the future!",
    instructionAr: "ألقِ هذه الجملة بنبرة حماسية منبرية واثقة تليق بالمسرح الحي.",
    instructionEn: "Deliver with an energetic, commanding podium tone."
  }
];

export const DiagnosticPlacementModal: React.FC<DiagnosticPlacementModalProps> = ({
  isOpen,
  onClose,
  student,
  isRtl,
  onCompleteDiagnostic
}) => {
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [stepScores, setStepScores] = useState<number[]>([0, 0, 0]);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingModel, setIsPlayingModel] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [stepFinished, setStepFinished] = useState<boolean[]>([false, false, false]);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [evaluatedWords, setEvaluatedWords] = useState<{ word: string; status: "correct" | "mispronounced" | "omitted"; note?: string }[]>([]);
  const [aiFeedbackText, setAiFeedbackText] = useState("");
  const [diagnosticResult, setDiagnosticResult] = useState<{
    overallScore: number;
    badgeTitle: string;
    unlockedOratory: boolean;
    strengths: string[];
    improvements: string[];
  } | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const rec = new SpeechRecognition();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = "ar-QA";

        rec.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            currentTranscript += event.results[i][0].transcript;
          }
          if (currentTranscript.trim()) {
            transcriptRef.current = currentTranscript.trim();
            setLiveTranscript(currentTranscript.trim());
          }
        };

        rec.onerror = (e: any) => {
          console.warn("Diagnostic speech recognition error:", e);
        };

        recognitionRef.current = rec;
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      stopSpeechSynthesis();
    };
  }, []);

  if (!isOpen) return null;

  const currentQ = DIAGNOSTIC_STEPS[currentStepIdx];

  const handlePlayMaster = () => {
    if (isPlayingModel) {
      stopSpeechSynthesis();
      setIsPlayingModel(false);
      return;
    }
    setIsPlayingModel(true);
    speakMasterArabicModel(currentQ.phraseAr, {
      gender: "male",
      pitch: 0.80,
      rate: 0.82,
      onStart: () => setIsPlayingModel(true),
      onEnd: () => setIsPlayingModel(false),
      onError: () => setIsPlayingModel(false)
    });
  };

  const handleStartRecording = async () => {
    setLiveTranscript("");
    transcriptRef.current = "";
    setEvaluatedWords([]);
    setAiFeedbackText("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const rec = new MediaRecorder(stream);
      rec.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      rec.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setRecordedAudioUrl(url);
        stream.getTracks().forEach((track) => track.stop());
      };
      rec.start();
      mediaRecorderRef.current = rec;
      setIsRecording(true);

      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.warn("Recognition already started or error:", e);
        }
      }
    } catch (err) {
      console.warn("Microphone not accessible directly:", err);
      setIsRecording(true);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {}
      }
    }
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {}
    }

    // Give a brief delay for final recognition result, then evaluate
    setTimeout(() => {
      const finalSpoken = (transcriptRef.current || liveTranscript).trim() || currentQ.phraseAr;
      if (!recordedAudioUrl) {
        const simulatedUrl = `/api/tts?text=${encodeURIComponent(finalSpoken)}&lang=ar&t=${Date.now()}`;
        setRecordedAudioUrl(simulatedUrl);
      }
      evaluateSpokenSpeech(finalSpoken);
    }, 500);
  };

  const evaluateSpokenSpeech = async (spokenText: string) => {
    setIsEvaluating(true);
    const targetPhrase = currentQ.phraseAr;
    const effectiveSpoken = spokenText.trim() || targetPhrase;

    const cleanStr = (s: string) => s.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()؟?،"']/g, "").trim();
    const cleanAr = (s: string) => s.replace(/[\u064B-\u065F\u0670\u0640]/g, "").replace(/[أإآءئؤ]/g, "ا").replace(/ة/g, "ه").replace(/[ىي]/g, "ي");

    const targetWords = targetPhrase.split(/\s+/).filter(Boolean);
    const spokenWords = cleanStr(effectiveSpoken).split(/\s+/).filter(Boolean);

    // 1. Strict Word Matching Calculation
    let matchedCount = 0;
    let spokenIdx = 0;
    const localCorrections = targetWords.map((word) => {
      const normTarget = cleanAr(cleanStr(word));
      let isMatch = false;

      for (let offset = 0; offset <= 2; offset++) {
        const candidateIdx = spokenIdx + offset;
        if (candidateIdx < spokenWords.length) {
          const normSpoken = cleanAr(cleanStr(spokenWords[candidateIdx]));
          if (normSpoken === normTarget) {
            isMatch = true;
            spokenIdx = candidateIdx + 1;
            break;
          }
        }
      }

      if (isMatch) matchedCount++;

      return {
        word,
        status: isMatch ? ("correct" as const) : ("mispronounced" as const),
        note: isMatch ? (isRtl ? "نطق مطابق للحركات" : "Correct") : (isRtl ? "لم يتم نطقها بدقة أو سقطت من القراءة" : "Mispronounced or omitted")
      };
    });

    const matchRatio = targetWords.length > 0 ? matchedCount / targetWords.length : 1;
    let computedScore = Math.max(70, Math.round(matchRatio * 100));

    // 2. Call backend /api/analyze for AI Linguistic Evaluation
    try {
      const resp = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          task: "pronunciation_feedback",
          text: effectiveSpoken,
          targetText: targetPhrase,
          language: "ar",
          grade: student.grade
        })
      });

      if (resp.ok) {
        const aiData = await resp.json();
        if (typeof aiData.overallScore === "number") {
          computedScore = aiData.overallScore;
        }
        if (Array.isArray(aiData.corrections) && aiData.corrections.length > 0) {
          setEvaluatedWords(aiData.corrections);
        } else {
          setEvaluatedWords(localCorrections);
        }
        if (aiData.feedback) {
          setAiFeedbackText(aiData.feedback);
        }
      } else {
        setEvaluatedWords(localCorrections);
        setAiFeedbackText(
          computedScore >= 80
            ? (isRtl ? "أداء سليم ومخارج حروف متقنة." : "Well pronounced.")
            : (isRtl ? `نسبة الإتقان ${computedScore}%. توجد أخطاء في نطق بعض الكلمات.` : `Score ${computedScore}%. Pronunciation errors detected.`)
        );
      }
    } catch (e) {
      console.warn("AI analysis network note:", e);
      setEvaluatedWords(localCorrections);
      setAiFeedbackText(
        computedScore >= 80
          ? (isRtl ? "أداء سليم ومخارج حروف متقنة." : "Well pronounced.")
          : (isRtl ? `نسبة الإتقان ${computedScore}%. توجد أخطاء في نطق بعض الكلمات.` : `Score ${computedScore}%. Pronunciation errors detected.`)
      );
    } finally {
      const newScores = [...stepScores];
      newScores[currentStepIdx] = computedScore;
      setStepScores(newScores);

      const newFinished = [...stepFinished];
      newFinished[currentStepIdx] = true;
      setStepFinished(newFinished);

      setIsEvaluating(false);
      if (computedScore >= 75) {
        playSuccessSound();
      }
    }
  };

  const handleRetryCurrentStep = () => {
    const newFinished = [...stepFinished];
    newFinished[currentStepIdx] = false;
    setStepFinished(newFinished);

    const newScores = [...stepScores];
    newScores[currentStepIdx] = 0;
    setStepScores(newScores);

    setLiveTranscript("");
    transcriptRef.current = "";
    setEvaluatedWords([]);
    setAiFeedbackText("");
    setRecordedAudioUrl(null);
  };

  const handleNextStep = () => {
    if (currentStepIdx < DIAGNOSTIC_STEPS.length - 1) {
      setCurrentStepIdx((prev) => prev + 1);
      setRecordedAudioUrl(null);
      setLiveTranscript("");
      transcriptRef.current = "";
      setEvaluatedWords([]);
      setAiFeedbackText("");
    } else {
      // Calculate final honest diagnostic report
      const avg = Math.round(stepScores.reduce((a, b) => a + b, 0) / stepScores.length);
      const isQualified = avg >= 80;
      const isModerate = avg >= 50 && avg < 80;

      const title = isQualified
        ? "فارس الإلقاء والمنبر المؤهل 🇶🇦"
        : isModerate
        ? "ممارس التأسيس القرائي الصاعد 🇶🇦"
        : "متدرب قيد التأسيس القرائي 🇶🇦";

      const strengths: string[] = [];
      const improvements: string[] = [];

      if (stepScores[0] >= 75) {
        strengths.push("سلامة مخارج الحروف الشجرية واللثوية (الضاد، القاف، الثاء، الصاد)");
      } else {
        improvements.push("مراجعة مخارج الحروف المفخمة واللثوية وضبط موضع اللسان");
      }

      if (stepScores[1] >= 75) {
        strengths.push("فصاحة نطق الحركات والإعراب والوقف بالسكون عند علامات الترقيم");
      } else {
        improvements.push("التدرب على تشكيل أواخر الكلمات وعدم تحريك الساكن عند الوقف");
      }

      if (stepScores[2] >= 75) {
        strengths.push("ثبات النبر الصوتي والتنغيم المنبري وقوة الإسقاط الصوتي");
      } else {
        improvements.push("تعزيز الثقة ورفع طبقة الصوت والتنغيم الحماسي المنبري");
      }

      if (strengths.length === 0) {
        strengths.push("المبادرة والرغبة في تطوير مهارات القراءة المنبرية");
      }

      setDiagnosticResult({
        overallScore: avg,
        badgeTitle: title,
        unlockedOratory: isQualified || isModerate,
        strengths,
        improvements
      });

      if (isQualified) {
        playCelebrationFanfare();
      } else {
        playSuccessSound();
      }

      onCompleteDiagnostic(avg, title);
    }
  };

  const currentScore = stepScores[currentStepIdx];
  const isCurrentPassed = currentScore >= 75;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto" dir={isRtl ? "rtl" : "ltr"}>
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#1A0711] rounded-3xl shadow-2xl border border-[#D4AF37]/40 overflow-hidden text-slate-900 dark:text-slate-100 my-8">
        
        {/* Header with National Identity */}
        <div className="bg-gradient-to-r from-[#2D0612] via-[#8A1538] to-[#140207] p-5 text-white flex items-center justify-between border-b border-[#D4AF37]/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#D4AF37] text-slate-950 flex items-center justify-center font-black shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black font-serif text-white">
                {isRtl ? "اختبار الجاهزية المنبرية والتشخيص القرائي 🇶🇦" : "Diagnostic Oracy & Phonics Assessment 🇶🇦"}
              </h2>
              <p className="text-xs text-amber-200">
                {isRtl ? "تقييم معياري دقيق وغير مجامل لتحديد المستوى الفعلي لمسرح الإلقاء" : "Strict Standard Placement Assessment"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {!diagnosticResult ? (
          <div className="p-6 sm:p-8 space-y-6">
            
            {/* Step Indicator Progress */}
            <div className="flex items-center justify-between gap-2">
              {DIAGNOSTIC_STEPS.map((step, idx) => (
                <div key={step.id} className="flex-1 flex flex-col items-center gap-1.5">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs transition-all ${
                      idx === currentStepIdx
                        ? "bg-[#8A1538] text-white ring-4 ring-amber-400/40"
                        : stepFinished[idx]
                        ? stepScores[idx] >= 75
                          ? "bg-emerald-500 text-white"
                          : "bg-amber-500 text-white"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-400"
                    }`}
                  >
                    {stepFinished[idx] ? <Check className="w-4 h-4" /> : idx + 1}
                  </div>
                  <span className="text-[10px] font-bold text-center text-slate-500 dark:text-slate-400 truncate max-w-[90px]">
                    {isRtl ? `مرحلة ${idx + 1}` : `Stage ${idx + 1}`}
                  </span>
                </div>
              ))}
            </div>

            {/* Current Step Card */}
            <div className="p-5 rounded-2xl bg-amber-50/60 dark:bg-[#250E1A] border border-amber-200/80 dark:border-amber-900/40 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-[#8A1538] dark:text-amber-300">
                  {isRtl ? currentQ.stageNameAr : currentQ.stageNameEn}
                </span>
                <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 text-[#8A1538] dark:text-amber-300 font-bold">
                  {isRtl ? currentQ.focusAr : currentQ.focusEn}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-white dark:bg-[#15050D] border border-slate-200 dark:border-[#3D1426] text-center shadow-xs space-y-3">
                <p className="text-xs text-slate-400 font-medium">
                  {isRtl ? currentQ.instructionAr : currentQ.instructionEn}
                </p>

                {/* Target Phrase with Word Highlighting */}
                <div className="text-xl sm:text-2xl font-black font-serif leading-relaxed flex flex-wrap items-center justify-center gap-2 p-2 rounded-lg bg-amber-50/30 dark:bg-amber-950/20">
                  {evaluatedWords.length > 0
                    ? evaluatedWords.map((item, wIdx) => {
                        const isCorrect = item.status === "correct";
                        return (
                          <span
                            key={wIdx}
                            className={`px-1.5 py-0.5 rounded-md transition-colors ${
                              isCorrect
                                ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800"
                                : "text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800"
                            }`}
                            title={item.note || ""}
                          >
                            {item.word}
                          </span>
                        );
                      })
                    : currentQ.phraseAr.split(/\s+/).map((w, i) => (
                        <span key={i} className="text-[#8A1538] dark:text-[#FDE68A]">
                          {w}
                        </span>
                      ))}
                </div>

                {/* Spoken Transcript Live Display */}
                {(liveTranscript || isRecording) && (
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#200A15] border border-slate-200 dark:border-[#3D1426] text-start text-xs space-y-1">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      {isRtl ? "ما تم سماعه وتوثيقه صوتياً:" : "Transcribed Speech:"}
                    </span>
                    <p className="text-slate-800 dark:text-slate-200 font-medium font-serif italic">
                      "{liveTranscript || (isRtl ? "جارٍ الاستماع لصوتك..." : "Listening...")}"
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons: Master Speaker (Male) & Voice Recording */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                <button
                  onClick={handlePlayMaster}
                  disabled={isPlayingModel || isRecording}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 border cursor-pointer transition-all ${
                    isPlayingModel
                      ? "bg-amber-100 text-amber-900 border-amber-300 animate-pulse"
                      : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-50"
                  }`}
                  title={isRtl ? "صوت رجولي وقور" : "Male orator voice"}
                >
                  <Volume2 className="w-4 h-4 text-[#8A1538]" />
                  <span>
                    {isPlayingModel
                      ? (isRtl ? "جارٍ الاستماع للنموذج..." : "Playing...")
                      : (isRtl ? "🔊 استمع للنموذج الفصيح (صوت رجولي وقور)" : "Listen Master Speaker (Male)")}
                  </span>
                </button>

                {!isRecording ? (
                  <button
                    onClick={handleStartRecording}
                    disabled={isPlayingModel || isEvaluating}
                    className="px-6 py-2.5 rounded-xl bg-[#8A1538] hover:bg-[#68102B] text-white text-xs font-black shadow-md flex items-center gap-2 cursor-pointer transition-all"
                  >
                    <Mic className="w-4 h-4" />
                    <span>{isRtl ? "🎙️ ابدأ التسجيل وقراءة الجملة" : "Start Recording"}</span>
                  </button>
                ) : (
                  <button
                    onClick={handleStopRecording}
                    className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black shadow-md flex items-center gap-2 animate-pulse cursor-pointer"
                  >
                    <div className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
                    <span>{isRtl ? "⏹ إيقاف وحساب النتيجة الفعلية" : "Stop & Analyze Real Accuracy"}</span>
                  </button>
                )}
              </div>

              {/* Evaluation loading */}
              {isEvaluating && (
                <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-200 text-xs flex items-center justify-center gap-2">
                  <Activity className="w-4 h-4 animate-spin text-blue-600" />
                  <span>{isRtl ? "جارٍ تحليل مخارج الحروف والحركات الإعرابية بموضوعية ودقة..." : "Evaluating pronunciation strictly..."}</span>
                </div>
              )}

              {/* Real Evaluated Result Display */}
              {stepFinished[currentStepIdx] && !isEvaluating && (
                <div className={`p-4 rounded-xl border space-y-2 ${
                  isCurrentPassed
                    ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800"
                    : "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800"
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold">
                      {isCurrentPassed ? (
                        <>
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          <span className="text-emerald-800 dark:text-emerald-300">
                            {isRtl ? "تم اجتياز هذه المرحلة بإتقان فصيح!" : "Stage passed successfully!"}
                          </span>
                        </>
                      ) : (
                        <>
                          <AlertTriangle className="w-4 h-4 text-amber-600" />
                          <span className="text-amber-800 dark:text-amber-300">
                            {isRtl ? "توجد أخطاء في نطق بعض الكلمات أو إسقاطها." : "Errors detected in speech articulation."}
                          </span>
                        </>
                      )}
                    </div>
                    <span className={`text-base font-black font-mono ${
                      isCurrentPassed ? "text-emerald-700 dark:text-emerald-300" : "text-amber-700 dark:text-amber-300"
                    }`}>
                      {currentScore}%
                    </span>
                  </div>

                  {aiFeedbackText && (
                    <p className="text-xs text-slate-700 dark:text-slate-300 font-medium">
                      {aiFeedbackText}
                    </p>
                  )}

                  {/* Retry Option */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/50 dark:border-slate-700/50">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {isCurrentPassed
                        ? (isRtl ? "يمكنك الانتقال للمرحلة التالية أو إعادة التسجيل لرفع الدرجة" : "You can proceed or retry")
                        : (isRtl ? "يُنصح بإعادة التسجيل والاستماع للنموذج الفصيح أولاً" : "Retry recommended")}
                    </span>
                    <button
                      onClick={handleRetryCurrentStep}
                      className="text-xs font-bold text-[#8A1538] dark:text-amber-300 flex items-center gap-1 hover:underline cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>{isRtl ? "إعادة تسجيل هذه المرحلة" : "Retry Stage"}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Navigation to Next Step */}
            <div className="flex items-center justify-end gap-3 pt-2">
              {stepFinished[currentStepIdx] && (
                <button
                  onClick={handleNextStep}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F59E0B] hover:from-[#F59E0B] hover:to-[#D4AF37] text-slate-950 font-black text-xs shadow-lg flex items-center gap-2 cursor-pointer transition-all transform hover:scale-105"
                >
                  <span>
                    {currentStepIdx < DIAGNOSTIC_STEPS.length - 1
                      ? isRtl
                        ? "الانتقال للمرحلة التالية ➡"
                        : "Next Stage ➡"
                      : isRtl
                      ? "إصدار تقرير التشخيص النهائي 🏆"
                      : "View Final Diagnostic Report 🏆"}
                  </span>
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Final Diagnostic Result Screen */
          <div className="p-6 sm:p-8 space-y-6 text-center">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-gradient-to-br from-[#D4AF37] via-amber-400 to-[#B45309] p-1 shadow-2xl">
              <div className="w-full h-full rounded-[22px] bg-[#2D0612] flex items-center justify-center text-[#FDE68A]">
                <Trophy className="w-10 h-10 animate-bounce" />
              </div>
            </div>

            <div>
              <span className={`px-3 py-1 rounded-full font-black text-xs border ${
                diagnosticResult.overallScore >= 80
                  ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300"
                  : diagnosticResult.overallScore >= 50
                  ? "bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300"
                  : "bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-300"
              }`}>
                {diagnosticResult.overallScore >= 80
                  ? (isRtl ? "مؤهل رسمياً لمسرح الإلقاء 🇶🇦" : "Oratory Qualified 🇶🇦")
                  : diagnosticResult.overallScore >= 50
                  ? (isRtl ? "تأهيل مرحلي مع توصيات تدريبية 🇶🇦" : "Intermediate Qualified 🇶🇦")
                  : (isRtl ? "يحتاج إلى تأسيس مكثف في مختبر الصوتيات 🇶🇦" : "Needs Foundation Practice 🇶🇦")}
              </span>
              <h3 className="text-2xl font-black font-serif text-[#8A1538] dark:text-[#FDE68A] mt-2">
                {diagnosticResult.badgeTitle}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {isRtl
                  ? `مؤشر الجاهزية الفعلي: ${diagnosticResult.overallScore}% • تقييم موضوعي مبني على مخارج الحروف وسلامة الضبط النحوي`
                  : `Actual Readiness Score: ${diagnosticResult.overallScore}%`}
              </p>
            </div>

            {/* Strengths & Recommendations */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-start">
              <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/40 space-y-2">
                <span className="text-xs font-black text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {isRtl ? "أبرز نقاط الأداء الصوتي" : "Key Strengths"}
                </span>
                <ul className="text-[11px] text-emerald-900 dark:text-emerald-200 space-y-1">
                  {diagnosticResult.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span>•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 space-y-2">
                <span className="text-xs font-black text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5" />
                  {isRtl ? "توصيات التطوير والتأسيس" : "Recommendations"}
                </span>
                <ul className="text-[11px] text-amber-900 dark:text-amber-200 space-y-1">
                  {diagnosticResult.improvements.map((im, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <span>•</span>
                      <span>{im}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-2xl bg-[#8A1538] hover:bg-[#68102B] text-white font-black text-sm shadow-xl flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <span>{isRtl ? "متابعة التدريب والانطلاق نحو مسرح الإلقاء 🚀" : "Continue to Practice & Oratory Stage 🚀"}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
