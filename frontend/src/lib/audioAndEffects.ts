// Web Audio API Sound Synthesizer & Master Arabic Speech Engine (zero external dependencies)

export function playRewardSound(type: "correct" | "wrong" | "levelup" | "fanfare") {
  if (typeof window === "undefined") return;
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return;

  try {
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    if (type === "correct") {
      // Upward chime
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = "sine";
      osc2.type = "triangle";

      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.1); // E5
      osc1.frequency.exponentialRampToValueAtTime(783.99, now + 0.2); // G5

      osc2.frequency.setValueAtTime(261.63, now); // C4
      osc2.frequency.exponentialRampToValueAtTime(329.63, now + 0.1); // E4
      osc2.frequency.exponentialRampToValueAtTime(392.00, now + 0.2); // G4

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 0.4);
      osc2.stop(now + 0.4);
    } else if (type === "wrong") {
      // Gentle soft error buzz
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.setValueAtTime(180, now + 0.15);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.3);
    } else if (type === "levelup" || type === "fanfare") {
      // Joyful victory triad
      const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = "sine";
        osc.frequency.setValueAtTime(f, now + idx * 0.08);

        gain.gain.setValueAtTime(0.3, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.3);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.3);
      });
    }
  } catch (e) {
    console.warn("Audio Context playback error:", e);
  }
}

export function playSuccessSound() {
  playRewardSound("correct");
}

export function playCelebrationFanfare() {
  playRewardSound("fanfare");
}

export function playClickSound() {
  if (typeof window === "undefined") return;
  const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtx) return;
  try {
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(800, now + 0.05);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.05);
  } catch (e) {}
}

let currentTtsAudio: HTMLAudioElement | null = null;
let currentSourceNode: AudioBufferSourceNode | null = null;

/**
 * Find highest-quality masculine Arabic voice
 */
export function getArabicMaleVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices || voices.length === 0) return null;

  const maleKeywords = [
    "maged", "majed", "tariq", "tarik", "hamed", "shakir", "naayf", "naif",
    "salman", "hassan", "omar", "khalid", "male", "bassel", "mehdi", "wavenet-b",
    "wavenet-c", "standard-b", "standard-c", "standard-d", "arz"
  ];
  const femaleKeywords = [
    "laila", "salma", "zeina", "hoda", "mariam", "female", "wavenet-a", "standard-a"
  ];

  // 1. Try finding explicit Arabic Male voice
  const explicitMale = voices.find(
    (v) =>
      (v.lang.toLowerCase().startsWith("ar") || v.name.toLowerCase().includes("arabic")) &&
      maleKeywords.some((kw) => v.name.toLowerCase().includes(kw))
  );
  if (explicitMale) return explicitMale;

  // 2. Try finding any Arabic voice that is NOT explicitly female
  const nonFemale = voices.find(
    (v) =>
      (v.lang.toLowerCase().startsWith("ar") || v.name.toLowerCase().includes("arabic")) &&
      !femaleKeywords.some((kw) => v.name.toLowerCase().includes(kw))
  );
  if (nonFemale) return nonFemale;

  // 3. Any Arabic voice available
  return voices.find((v) => v.lang.toLowerCase().startsWith("ar")) || null;
}

/**
 * Fallback to browser Web Speech API with deep masculine pitch
 */
function fallbackWebSpeech(
  text: string,
  targetLang: string,
  options?: {
    rate?: number;
    pitch?: number;
    onStart?: () => void;
    onEnd?: () => void;
    onBoundary?: (charIndex: number, length?: number) => void;
    onError?: (err: any) => void;
  }
): boolean {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) {
    if (options?.onError) options.onError("Web Speech not supported");
    if (options?.onEnd) options.onEnd();
    return false;
  }

  try {
    window.speechSynthesis.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = targetLang === "en" ? "en-US" : "ar-SA";
    utter.rate = options?.rate || 0.90;
    utter.pitch = options?.pitch || 0.95; // Natural clear tone

    const maleVoice = getArabicMaleVoice();
    if (maleVoice) {
      utter.voice = maleVoice;
    }

    let hasEnded = false;
    const finish = () => {
      if (!hasEnded) {
        hasEnded = true;
        if (options?.onEnd) options.onEnd();
      }
    };

    utter.onstart = () => {
      if (options?.onStart) options.onStart();
    };

    utter.onend = () => {
      finish();
    };

    if (options?.onBoundary) {
      utter.onboundary = (e) => {
        options.onBoundary!(e.charIndex, (e as any).charLength || 5);
      };
    }

    utter.onerror = (err) => {
      console.warn("SpeechSynthesis error:", err);
      finish();
      if (options?.onError) options.onError(err);
    };

    // Safety timeout in case speech synthesis stalls
    const estimatedDurationMs = Math.max(3000, text.length * 280);
    setTimeout(() => {
      if (!hasEnded) {
        finish();
      }
    }, estimatedDurationMs);

    window.speechSynthesis.speak(utter);
    return true;
  } catch (e) {
    console.error("Fallback Web Speech failed:", e);
    if (options?.onError) options.onError(e);
    if (options?.onEnd) options.onEnd();
    return false;
  }
}

/**
 * Intelligent Master Arabic Speech Synthesis with Masculine Orator Voice
 * Uses High-Definition Audio Stream with deep baritone pitch modulation
 */
export function speakMasterArabicModel(
  text: string,
  options?: {
    rate?: number;
    pitch?: number;
    lang?: string;
    gender?: "male" | "female";
    onStart?: () => void;
    onEnd?: () => void;
    onBoundary?: (charIndex: number, length?: number) => void;
    onError?: (err: any) => void;
  }
): boolean {
  if (typeof window === "undefined") {
    if (options?.onError) options.onError("Window not defined");
    if (options?.onEnd) options.onEnd();
    return false;
  }

  // 1. Stop any currently playing audio or speech
  stopSpeechSynthesis();

  if (!text || !text.trim()) {
    if (options?.onEnd) options.onEnd();
    return false;
  }

  const targetLang = options?.lang || "ar";
  const trimmedText = text.trim();

  // 2. Primary Engine: High-fidelity Server Audio with Masculine Baritone Pitch Shift
  try {
    const audioUrl = `/api/tts?text=${encodeURIComponent(trimmedText)}&lang=${targetLang}&t=${Date.now()}`;
    const audio = new Audio(audioUrl);
    currentTtsAudio = audio;

    // Natural, crisp studio playback of masculine orator voice
    audio.playbackRate = options?.rate || 1.0;
    try {
      (audio as any).preservesPitch = true;
    } catch (e) {}

    let hasEnded = false;
    let hasStarted = false;
    let fallbackTimer: any = null;

    const finish = () => {
      if (fallbackTimer) clearTimeout(fallbackTimer);
      if (!hasEnded) {
        hasEnded = true;
        currentTtsAudio = null;
        if (options?.onEnd) options.onEnd();
      }
    };

    audio.onplay = () => {
      hasStarted = true;
      if (fallbackTimer) clearTimeout(fallbackTimer);
      if (options?.onStart) options.onStart();
    };

    audio.onended = () => {
      finish();
    };

    audio.onerror = (e) => {
      console.warn("Server TTS audio error, falling back to Web Speech:", e);
      if (fallbackTimer) clearTimeout(fallbackTimer);
      currentTtsAudio = null;
      fallbackWebSpeech(trimmedText, targetLang, options);
    };

    // If server audio does not start within 2 seconds, trigger immediate Web Speech fallback
    fallbackTimer = setTimeout(() => {
      if (!hasStarted && !hasEnded) {
        console.warn("Server TTS timed out, switching to browser Web Speech API");
        if (currentTtsAudio) {
          try { currentTtsAudio.pause(); } catch (e) {}
          currentTtsAudio = null;
        }
        fallbackWebSpeech(trimmedText, targetLang, options);
      }
    }, 2200);

    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch((err) => {
        console.warn("Audio autoplay blocked or failed, falling back to Web Speech:", err);
        if (fallbackTimer) clearTimeout(fallbackTimer);
        currentTtsAudio = null;
        fallbackWebSpeech(trimmedText, targetLang, options);
      });
    }

    return true;
  } catch (err) {
    console.warn("Audio init failed, resorting to Web Speech fallback:", err);
    return fallbackWebSpeech(trimmedText, targetLang, options);
  }
}

export function stopSpeechSynthesis() {
  if (typeof window !== "undefined") {
    if (currentSourceNode) {
      try {
        currentSourceNode.stop();
        currentSourceNode.disconnect();
      } catch (e) {}
      currentSourceNode = null;
    }

    if (currentTtsAudio) {
      try {
        currentTtsAudio.pause();
        currentTtsAudio.currentTime = 0;
        currentTtsAudio.src = "";
      } catch (e) {}
      currentTtsAudio = null;
    }

    if ("speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
  }
}
