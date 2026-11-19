/**
 * Live coaching client for the speaking stage.
 *
 * Talks to the FastAPI backend's four WebSockets (same protocol as the original
 * Ilqaa coach page, backend/static/js/app.js):
 *
 *   /ws/audio       16 kHz mono float32 PCM in  → transcription, metrics, final summary out
 *   /ws/video       JPEG frames in               → MediaPipe body-language metrics + feedback out
 *   /ws/guidance    transcript in                → AI content feedback + speaking guidance out
 *   /ws/sentiments  transcript in                → tone / intent / intensity out
 *
 * `LiveCoachClient` only handles the sockets and message parsing (no browser media
 * APIs), so it can be tested in Node. `LiveMedia` captures the microphone and camera.
 * Nothing here invents a value: a metric stays `null` until the backend measures it.
 */

export type ChannelName = "audio" | "video" | "guidance" | "sentiment";
export type ChannelState = "idle" | "connecting" | "live" | "error" | "closed";

export interface ChannelStatus {
  state: ChannelState;
  message?: string;
}

export interface BodyFeedback {
  message: string;
  level: string;
  category: string;
  at: number;
}

export interface LiveSentiment {
  label: string;          // positive | neutral | negative
  score: number;          // -1..1
  intent: string;
  intensity: string;
  urgency: string;
  reason: string;
}

/** One reference word checked against the prepared script (from the backend's arabic_diff). */
export interface VowelWord {
  index: number;
  word: string;                       // as written in the script
  spokenWord: string;                 // as the vowelized ASR heard it
  status: "correct" | "mispronounced" | "omitted";
  errors: { type: string; label: string; detail: string }[];
}

/** A sentence the vowelized ASR (Tashkeel) wrote down during the speech. */
export interface VowelSegment {
  id: number;
  start: number;                      // seconds from the start of the session
  end: number;
  text: string;                       // with short vowels
  speechmaticsText: string;
  uncertain: boolean;                 // the two recognisers disagree – not judged
  mode: "script" | "off_script" | "free";
  reference?: string;                 // the matching passage of the script
  words: VowelWord[];
  insertedWords: { word: string; label: string; detail: string }[];
  /** Free speech: clear i'rab mistakes the LLM found in this sentence */
  review?: { word: string; correct: string; reason: string }[];
}

export interface VowelCheckStatus {
  state: "off" | "ready" | "warning" | "error";
  message?: string;
  script?: boolean;
  scriptHasVowels?: boolean;
}

export interface LiveMetrics {
  // speech (Speechmatics + backend metrics)
  transcript: string;
  wpm: number | null;
  totalWords: number;
  fillerCount: number;
  fillerBreakdown: Record<string, number>;
  vocabDiversity: number | null;      // 0..1
  rhetoricalPauses: number;           // gaps of 0.8–2.0 s between transcribed segments
  hesitationPauses: number;           // gaps over 2.0 s
  pausesMeasured: boolean;            // false until segment timings arrive
  // body language (MediaPipe)
  eyeContact: number | null;          // % of recent frames with the head facing the camera
  posture: number | null;             // 0..100 – shoulders level (rolling)
  handsVisible: number | null;        // % of frames in which MediaPipe detected a hand
  gesturesPerMinute: number | null;
  gestureCount: number | null;        // raw hand-movement count
  poseDetectionRate: number | null;   // % of frames with a detected body
  slouchPercent: number | null;       // % of session time slouching (ear–shoulder–hip angle)
  frozenPercent: number | null;       // % of session time with almost no head movement
  videoFps: number | null;            // frames analysed per second
  gazeZone: "left" | "center" | "right" | null;
  bodyFeedback: BodyFeedback | null;  // latest warning from the camera analysis
  bodyAlert: BodyFeedback | null;     // most important camera message of the latest frame (any level)
  // AI streams
  guidance: string | null;
  contentFeedback: string | null;
  sentiment: LiveSentiment | null;
  // microphone
  micLevel: number;                   // 0..100
  // live vowel check (vowelized ASR per sentence; only when the backend has ASR_BASE_URL)
  vowelCheck: VowelCheckStatus;
  vowelSegments: VowelSegment[];
  /** who writes the live transcript: Speechmatics (word by word) or the vowelized ASR (per sentence) */
  transcriber: "speechmatics" | "asr" | null;
}

export interface FinalSummaries {
  audio: Record<string, any> | null;  // /ws/audio session_complete summary
  video: Record<string, any> | null;  // /ws/video session_complete metrics
}

/** What happened on the audio path – used to explain an empty transcript. */
export interface AudioDiagnostics {
  audioStreamWasLive: boolean;        // /ws/audio reached "connected"
  audioStreamError: string | null;    // why it failed, if it did
  chunksCaptured: number;             // chunks the microphone produced
  chunksSent: number;                 // chunks actually sent to the backend
  peakMicLevel: number;               // 0..100
  messagesReceived: Record<ChannelName, number>;
  wsUrl: string;                      // where the streams connect
}

export function emptyMetrics(): LiveMetrics {
  return {
    transcript: "", wpm: null, totalWords: 0, fillerCount: 0, fillerBreakdown: {}, vocabDiversity: null,
    rhetoricalPauses: 0, hesitationPauses: 0, pausesMeasured: false,
    eyeContact: null, posture: null, handsVisible: null, gesturesPerMinute: null, gestureCount: null, poseDetectionRate: null,
    slouchPercent: null, frozenPercent: null, videoFps: null, gazeZone: null, bodyFeedback: null, bodyAlert: null, guidance: null, contentFeedback: null, sentiment: null, micLevel: 0,
    vowelCheck: { state: "off" }, vowelSegments: [], transcriber: null,
  };
}

export interface LiveCoachOptions {
  language: "ar" | "en";
  topic: string;                       // guidance-config topic / speaking sector
  /** ws(s)://host – defaults to the page's own host (the Vite dev server proxies /ws). */
  wsBase?: string;
  onChange: (metrics: LiveMetrics, channels: Record<ChannelName, ChannelStatus>) => void;
  /** For tests: a WebSocket implementation (defaults to the global one). */
  WebSocketImpl?: typeof WebSocket;
  /** How often the transcript is forwarded to the guidance/sentiment streams (ms). */
  transcriptForwardMs?: number;
  /** Log every stream event and message to the browser console ([live:audio] …). */
  debug?: boolean;
  /** Receives the backend's skeleton-overlay frames (base64 JPEG) while the overlay is on. */
  onOverlayFrame?: (jpegBase64: string) => void;
  /** Optional prepared speech (preferably with vowels): each spoken sentence is checked against it. */
  script?: string;
}

const RHETORICAL_MIN_S = 0.8;
const RHETORICAL_MAX_S = 2.0;
const GAZE_FEEDBACK_TTL_MS = 3000;

export function defaultWsBase(): string {
  if (typeof window === "undefined") return "ws://localhost:8000";
  const proto = window.location.protocol === "https:" ? "wss" : "ws";
  return `${proto}://${window.location.host}`;
}

export class LiveCoachClient {
  metrics: LiveMetrics = emptyMetrics();
  channels: Record<ChannelName, ChannelStatus> = {
    audio: { state: "idle" }, video: { state: "idle" }, guidance: { state: "idle" }, sentiment: { state: "idle" },
  };

  private opts: Required<Omit<LiveCoachOptions, "WebSocketImpl" | "wsBase" | "debug" | "onOverlayFrame" | "script">> & {
    wsBase: string; WS: typeof WebSocket; debug: boolean; onOverlayFrame?: (b64: string) => void; script: string;
  };
  private overlayWanted = false;
  private sockets: Partial<Record<ChannelName, WebSocket>> = {};
  private lastSegmentEnd: number | null = null;
  private frameInFlight = false;
  private frameSentAt = 0;
  private forwardTimer: ReturnType<typeof setTimeout> | null = null;
  private lastForwarded = "";
  private lastForwardAt = 0;
  private summaries: FinalSummaries = { audio: null, video: null };
  private waiters: Partial<Record<"audio" | "video", (v: Record<string, any> | null) => void>> = {};
  private stopped = false;
  private diag = {
    audioStreamWasLive: false, chunksCaptured: 0, chunksSent: 0, peakMicLevel: 0,
    messagesReceived: { audio: 0, video: 0, guidance: 0, sentiment: 0 } as Record<ChannelName, number>,
  };

  constructor(options: LiveCoachOptions) {
    const WS = options.WebSocketImpl ?? (globalThis as any).WebSocket;
    if (!WS) throw new Error("WebSocket is not available in this environment");
    this.opts = {
      language: options.language,
      topic: options.topic,
      onChange: options.onChange,
      transcriptForwardMs: options.transcriptForwardMs ?? 3000,
      wsBase: (options.wsBase ?? defaultWsBase()).replace(/\/$/, ""),
      WS,
      debug: !!options.debug,
      onOverlayFrame: options.onOverlayFrame,
      script: (options.script ?? "").trim(),
    };
  }

  /** Ask the backend to draw MediaPipe's body + hand landmarks onto the frames it sends back. */
  setOverlay(show: boolean): void {
    this.overlayWanted = show;
    const ws = this.sockets.video;
    if (ws && ws.readyState === ws.OPEN && this.channels.video.state === "live") {
      try { ws.send(JSON.stringify({ action: "toggle_overlay", show })); } catch { /* ignore */ }
    }
  }

  private log(channel: ChannelName, ...args: any[]) {
    if (this.opts.debug) console.debug(`%c[live:${channel}]`, "color:#8A1538;font-weight:bold", ...args);
  }

  // ---------------------------------------------------------------- lifecycle

  /** Open all four sockets. Resolves once the audio stream is live (or rejects if it can't start). */
  start(): Promise<void> {
    const q = `language=${this.opts.language}&topic=${encodeURIComponent(this.opts.topic)}`;
    const audioReady = new Promise<void>((resolve, reject) => {
      this.open("audio", `/ws/audio?${q}`, (data) => {
        if (data.status === "connected") resolve();
        if (data.status === "error") reject(new Error(data.error || "Audio stream failed to start"));
      }, () => reject(new Error("Could not connect to the live transcription service")));
    });
    this.open("video", "/ws/video");
    this.open("guidance", `/ws/guidance?${q}`);
    this.open("sentiment", `/ws/sentiments?${q}`);
    return audioReady;
  }

  /** Ask the backend for its final summaries, then close everything. */
  async stop(timeoutMs = 8000): Promise<FinalSummaries> {
    if (this.stopped) return this.summaries;
    // the backend finishes the last sentence's vowel check before it sends the summary
    if (this.metrics.vowelCheck.state === "ready" || this.metrics.vowelCheck.state === "warning") {
      timeoutMs = Math.max(timeoutMs, 25000);
    }
    this.stopped = true;
    this.flushTranscript(true);
    const wait = (ch: "audio" | "video") =>
      new Promise<Record<string, any> | null>((resolve) => {
        const ws = this.sockets[ch];
        if (!ws || ws.readyState !== ws.OPEN) return resolve(this.summaries[ch]);
        if (this.summaries[ch]) return resolve(this.summaries[ch]);
        const timer = setTimeout(() => resolve(this.summaries[ch]), timeoutMs);
        this.waiters[ch] = (v) => { clearTimeout(timer); resolve(v); };
        try { ws.send(JSON.stringify({ action: "stop" })); } catch { resolve(this.summaries[ch]); }
      });
    for (const ch of ["guidance", "sentiment"] as const) {
      const ws = this.sockets[ch];
      if (ws && ws.readyState === ws.OPEN) {
        try { ws.send(JSON.stringify({ action: "stop" })); } catch { /* ignore */ }
      }
    }
    const [audio, video] = await Promise.all([wait("audio"), wait("video")]);
    this.close();
    return { audio, video };
  }

  close(): void {
    if (this.forwardTimer) clearTimeout(this.forwardTimer);
    this.forwardTimer = null;
    for (const [name, ws] of Object.entries(this.sockets) as [ChannelName, WebSocket][]) {
      try { ws.close(1000, "session ended"); } catch { /* ignore */ }
      if (this.channels[name].state !== "error") this.channels[name] = { state: "closed" };
    }
    this.sockets = {};
    this.emit();
  }

  // ---------------------------------------------------------------- outgoing

  /** Send one chunk of 16 kHz mono float32 audio. */
  sendAudio(chunk: Float32Array): void {
    this.diag.chunksCaptured += 1;
    const ws = this.sockets.audio;
    if (this.stopped || !ws || ws.readyState !== ws.OPEN) {
      if (this.opts.debug && this.diag.chunksCaptured % 20 === 1) {
        this.log("audio", `mic chunk #${this.diag.chunksCaptured} NOT sent – audio socket is ${ws ? ["connecting", "open", "closing", "closed"][ws.readyState] : "missing"}`);
      }
      return;
    }
    const copy = chunk.byteOffset === 0 && chunk.byteLength === chunk.buffer.byteLength
      ? chunk.buffer : chunk.slice().buffer;
    ws.send(copy);
    this.diag.chunksSent += 1;
    if (this.opts.debug && this.diag.chunksSent % 20 === 1) {
      this.log("audio", `sent chunk #${this.diag.chunksSent} (${chunk.length} samples, mic level ${this.metrics.micLevel})`);
    }
  }

  diagnostics(): AudioDiagnostics {
    const a = this.channels.audio;
    return {
      ...this.diag,
      messagesReceived: { ...this.diag.messagesReceived },
      audioStreamError: a.state === "error" ? (a.message || "error") : null,
      wsUrl: this.opts.wsBase,
    };
  }

  /** True when the video stream is open and no frame is waiting for its analysis. */
  canSendFrame(now = Date.now()): boolean {
    const ws = this.sockets.video;
    if (this.stopped || !ws || ws.readyState !== ws.OPEN) return false;
    if (this.frameInFlight && now - this.frameSentAt < 2000) return false;   // give up waiting after 2 s
    return true;
  }

  sendFrame(jpeg: ArrayBuffer): void {
    const ws = this.sockets.video;
    if (!ws || ws.readyState !== ws.OPEN) return;
    this.frameInFlight = true;
    this.frameSentAt = Date.now();
    ws.send(jpeg);
  }

  setMicLevel(level: number): void {
    const v = Math.max(0, Math.min(100, Math.round(level)));
    if (v > this.diag.peakMicLevel) this.diag.peakMicLevel = v;
    if (v !== this.metrics.micLevel) {
      this.metrics = { ...this.metrics, micLevel: v };
      this.emit();
    }
  }

  // ---------------------------------------------------------------- sockets

  private open(name: ChannelName, path: string, onData?: (d: any) => void, onFail?: () => void) {
    this.channels[name] = { state: "connecting" };
    let ws: WebSocket;
    try {
      ws = new this.opts.WS(this.opts.wsBase + path);
    } catch (e) {
      this.channels[name] = { state: "error", message: String(e) };
      onFail?.();
      this.emit();
      return;
    }
    ws.binaryType = "arraybuffer";
    this.sockets[name] = ws;
    this.log(name, "connecting to", this.opts.wsBase + path);
    ws.onopen = () => this.log(name, "socket open");
    ws.onmessage = (ev: MessageEvent) => {
      if (typeof ev.data !== "string") return;
      let data: any;
      try { data = JSON.parse(ev.data); } catch { return; }
      this.diag.messagesReceived[name] += 1;
      if (this.opts.debug && !(name === "video" && data.status === "success" && this.diag.messagesReceived.video % 20 !== 1)) {
        this.log(name, data.status ?? data.type, data);
      }
      onData?.(data);
      this.handle(name, data);
    };
    ws.onerror = () => {
      this.log(name, "socket ERROR (state was " + this.channels[name].state + ")");
      if (this.channels[name].state === "connecting") {
        this.channels[name] = { state: "error", message: "connection failed" };
        onFail?.();
        this.emit();
      }
    };
    ws.onclose = (ev: CloseEvent) => {
      this.log(name, `socket closed (code ${ev?.code}${ev?.reason ? ", " + ev.reason : ""})`);
      const st = this.channels[name].state;
      if (st === "connecting") {
        this.channels[name] = { state: "error", message: "connection failed" };
        onFail?.();
      } else if (st === "live" && !this.stopped) {
        this.channels[name] = { state: "error", message: "connection lost" };
      } else if (st !== "error") {
        this.channels[name] = { state: "closed" };
      }
      if (name === "audio" || name === "video") this.waiters[name]?.(this.summaries[name]);
      this.emit();
    };
  }

  private handle(name: ChannelName, data: any) {
    if (data?.status === "connected") {
      this.channels[name] = { state: "live" };
      if (name === "audio") this.diag.audioStreamWasLive = true;
      if (name === "video" && this.overlayWanted) this.setOverlay(true);
    } else if (data?.status === "error") {
      const msg = data.error || data.message || "error";
      if (name === "video" && msg === "Failed to decode frame") {
        this.frameInFlight = false;           // one bad frame – keep going
        return;
      }
      this.channels[name] = { state: "error", message: msg };
    }
    switch (name) {
      case "audio": this.handleAudio(data); break;
      case "video": this.handleVideo(data); break;
      case "guidance": this.handleGuidance(data); break;
      case "sentiment": this.handleSentiment(data); break;
    }
    this.emit();
  }

  private handleAudio(d: any) {
    if (d.status === "transcription" && typeof d.transcription === "string") {
      const m = { ...this.metrics, transcript: d.transcription };
      const start = d.segment_start, end = d.segment_end;
      if (d.is_final !== false && typeof start === "number" && typeof end === "number" && end > 0) {
        if (this.lastSegmentEnd !== null) {
          const gap = start - this.lastSegmentEnd;
          if (gap >= RHETORICAL_MIN_S && gap <= RHETORICAL_MAX_S) m.rhetoricalPauses += 1;
          else if (gap > RHETORICAL_MAX_S) m.hesitationPauses += 1;
        }
        this.lastSegmentEnd = Math.max(end, this.lastSegmentEnd ?? end);
        m.pausesMeasured = true;
      }
      this.metrics = m;
      this.scheduleTranscriptForward();
    } else if (d.status === "metrics" && d.metrics) {
      const x = d.metrics;
      this.metrics = {
        ...this.metrics,
        wpm: typeof x.wpm === "number" ? x.wpm : this.metrics.wpm,
        totalWords: x.total_words ?? this.metrics.totalWords,
        fillerCount: x.total_fillers ?? this.metrics.fillerCount,
        fillerBreakdown: x.filler_breakdown ?? this.metrics.fillerBreakdown,
        vocabDiversity: typeof x.vocab_diversity === "number" && (x.total_words ?? 0) > 0 ? x.vocab_diversity : this.metrics.vocabDiversity,
      };
    } else if (d.status === "connected") {
      this.metrics = { ...this.metrics, transcriber: d.transcriber === "asr" ? "asr" : "speechmatics" };
      if (d.vowel_check) {
        this.metrics = { ...this.metrics, vowelCheck: { state: "ready", script: false } };
        if (this.opts.script) {
          try { this.sockets.audio?.send(JSON.stringify({ action: "script", text: this.opts.script })); } catch { /* ignore */ }
        }
      }
    } else if (d.status === "vowel_status") {
      this.metrics = {
        ...this.metrics,
        vowelCheck: {
          state: d.state ?? this.metrics.vowelCheck.state, message: d.message,
          script: d.script ?? this.metrics.vowelCheck.script, scriptHasVowels: d.scriptHasVowels ?? this.metrics.vowelCheck.scriptHasVowels,
        },
      };
    } else if (d.status === "vowelized_segment") {
      const seg: VowelSegment = {
        id: d.id, start: d.start, end: d.end, text: d.text ?? "", speechmaticsText: d.speechmaticsText ?? "",
        uncertain: !!d.uncertain, mode: d.mode ?? "free", reference: d.reference, words: d.words ?? [],
        insertedWords: d.insertedWords ?? [],
      };
      this.metrics = { ...this.metrics, vowelSegments: [...this.metrics.vowelSegments, seg].slice(-200) };
    } else if (d.status === "vowel_review" && Array.isArray(d.issues)) {
      const bySeg = new Map<number, VowelSegment["review"]>();
      for (const i of d.issues) {
        if (!bySeg.has(i.segmentId)) bySeg.set(i.segmentId, []);
        bySeg.get(i.segmentId)!.push({ word: i.word, correct: i.correct, reason: i.reason });
      }
      const ids = new Set<number>(d.segmentIds ?? []);
      this.metrics = {
        ...this.metrics,
        vowelSegments: this.metrics.vowelSegments.map((s) => ids.has(s.id) ? { ...s, review: bySeg.get(s.id) ?? [] } : s),
      };
    } else if (d.status === "session_complete") {
      this.summaries.audio = d.summary ?? null;
      this.waiters.audio?.(this.summaries.audio);
    } else if (d.status === "warning") {
      this.channels.audio = { ...this.channels.audio, message: d.warning };
    }
  }

  private handleVideo(d: any) {
    if (d.status === "success" && d.metrics) {
      this.frameInFlight = false;
      const x = d.metrics;
      const minutes = (x.total_time ?? 0) / 60;
      const now = Date.now();
      if (typeof d.overlay_frame === "string" && this.opts.onOverlayFrame) this.opts.onOverlayFrame(d.overlay_frame);
      // Most important message of this frame (the backend throttles repeats per type)
      const items: BodyFeedback[] = (d.feedback || [])
        .filter((f: any) => f && f.message)
        .map((f: any) => ({
          message: String(f.message).replace(/^[⚠✓]\s*/, ""),
          // "not in the frame" carries no ⚠ marker but is a warning for the speaker
          level: /لم يتم رصد الوضعية|not detected/i.test(f.message) ? "warning" : f.level,
          category: f.category, at: now,
        }));
      const rank: Record<string, number> = { critical: 4, warning: 3, good: 2, excellent: 1 };
      const top = items.reduce<BodyFeedback | null>((best, f) => (!best || (rank[f.level] ?? 0) > (rank[best.level] ?? 0) ? f : best), null);
      const lastWarning = [...items].reverse().find((f) => f.level === "warning" || f.level === "critical");
      const hasPose = !!d.has_pose;
      // Hand/gesture/slouch figures only mean something once a body has been seen at all
      const bodySeen = typeof x.pose_detection_rate === "number" && x.pose_detection_rate > 0;
      const num = (v: any) => (typeof v === "number" && Number.isFinite(v) ? v : null);
      this.metrics = {
        ...this.metrics,
        eyeContact: hasPose && num(x.eye_contact_percentage) !== null ? x.eye_contact_percentage : this.metrics.eyeContact,
        posture: hasPose && num(x.posture_quality) !== null ? x.posture_quality : this.metrics.posture,
        handsVisible: bodySeen && num(x.hand_detection_rate) !== null ? x.hand_detection_rate : this.metrics.handsVisible,
        gesturesPerMinute: bodySeen && minutes > 0.05 && num(x.hand_gesture_count) !== null
          ? x.hand_gesture_count / minutes : this.metrics.gesturesPerMinute,
        gestureCount: bodySeen ? num(x.hand_gesture_count) : this.metrics.gestureCount,
        poseDetectionRate: num(x.pose_detection_rate) ?? this.metrics.poseDetectionRate,
        slouchPercent: bodySeen ? num(x.slouch_percentage) : this.metrics.slouchPercent,
        frozenPercent: bodySeen ? num(x.frozen_percentage) : this.metrics.frozenPercent,
        videoFps: num(x.fps) ?? this.metrics.videoFps,
        bodyFeedback: lastWarning ?? this.metrics.bodyFeedback,
        bodyAlert: top ?? this.metrics.bodyAlert,
      };
      this.metrics.gazeZone = this.computeGaze(now);
    } else if (d.status === "session_complete") {
      this.summaries.video = d.metrics ?? null;
      this.waiters.video?.(this.summaries.video);
    }
  }

  /** Left/right only when the camera analysis just warned about looking away; centre when facing forward. */
  private computeGaze(now: number): LiveMetrics["gazeZone"] {
    const f = this.metrics.bodyFeedback;
    if (f && now - f.at < GAZE_FEEDBACK_TTL_MS) {
      if (/لليمين|right/i.test(f.message)) return "right";
      if (/لليسار|left/i.test(f.message)) return "left";
    }
    if (this.metrics.eyeContact === null) return null;
    return this.metrics.eyeContact >= 50 ? "center" : null;
  }

  private handleGuidance(d: any) {
    if (d.error || typeof d.content !== "string" || !d.content.trim()) return;
    if (d.type === "guidance") this.metrics = { ...this.metrics, guidance: d.content };
    if (d.type === "feedback") this.metrics = { ...this.metrics, contentFeedback: d.content };
  }

  private handleSentiment(d: any) {
    if (d.type !== "sentiment" || d.error || !d.content) return;
    const c = d.content;
    this.metrics = {
      ...this.metrics,
      sentiment: {
        label: c.sentiment ?? "neutral", score: Number(c.sentiment_score ?? 0),
        intent: c.intent ?? "", intensity: c.intensity ?? "", urgency: c.urgency ?? "", reason: c.reason ?? "",
      },
    };
  }

  // ---------------------------------------------------------------- transcript forwarding

  private scheduleTranscriptForward() {
    const wait = this.lastForwardAt + this.opts.transcriptForwardMs - Date.now();
    if (wait <= 0) {
      this.flushTranscript(false);
    } else if (!this.forwardTimer) {
      this.forwardTimer = setTimeout(() => { this.forwardTimer = null; this.flushTranscript(false); }, wait);
    }
  }

  /** Send the latest transcript to the guidance and sentiment streams (if it changed). */
  private flushTranscript(_final: boolean) {
    const text = this.metrics.transcript.trim();
    if (!text || text === this.lastForwarded) return;
    this.lastForwarded = text;
    this.lastForwardAt = Date.now();
    for (const ch of ["guidance", "sentiment"] as const) {
      const ws = this.sockets[ch];
      if (ws && ws.readyState === ws.OPEN) {
        try { ws.send(JSON.stringify({ action: "update_transcription", transcription: text })); } catch { /* ignore */ }
      }
    }
  }

  private emit() {
    this.opts.onChange(this.metrics, { ...this.channels });
  }
}

// ======================================================================================
// Browser media capture
// ======================================================================================

const TARGET_RATE = 16000;
const CHUNK_SAMPLES = 4096;     // ≈ 256 ms at 16 kHz, as the original coach page sent

/** AudioWorklet: downmix to mono, resample to 16 kHz (linear), post 4096-sample chunks + RMS. */
const WORKLET_SOURCE = `
class IlqaaPcm16k extends AudioWorkletProcessor {
  constructor() {
    super();
    this.ratio = sampleRate / ${TARGET_RATE};
    this.t = 0; this.prev = 0;
    this.buf = new Float32Array(${CHUNK_SAMPLES}); this.n = 0; this.sq = 0;
  }
  process(inputs) {
    const input = inputs[0];
    if (!input || !input[0]) return true;
    const len = input[0].length;
    const x = new Float32Array(len);
    for (let c = 0; c < input.length; c++) { const ch = input[c]; for (let i = 0; i < len; i++) x[i] += ch[i] / input.length; }
    let t = this.t;
    while (t < len - 1) {
      const i = Math.floor(t), f = t - i;
      const a = i < 0 ? this.prev : x[i], b = x[i + 1];
      const v = a + (b - a) * f;
      this.buf[this.n++] = v; this.sq += v * v;
      if (this.n === ${CHUNK_SAMPLES}) {
        const out = this.buf; this.buf = new Float32Array(${CHUNK_SAMPLES});
        this.port.postMessage({ pcm: out, rms: Math.sqrt(this.sq / ${CHUNK_SAMPLES}) }, [out.buffer]);
        this.n = 0; this.sq = 0;
      }
      t += this.ratio;
    }
    this.t = t - len; this.prev = x[len - 1];
    return true;
  }
}
registerProcessor("ilqaa-pcm16k", IlqaaPcm16k);
`;

export interface LiveMediaOptions {
  onAudio: (pcm: Float32Array, rms: number) => void;
  /** Called up to 10×/s with a JPEG of the current camera frame when `wantFrame()` is true. */
  onFrame: (jpeg: ArrayBuffer) => void;
  wantFrame: () => boolean;
  frameWidth?: number;        // default 640 (height follows the camera's aspect ratio)
  fps?: number;               // default 10
}

export class LiveMedia {
  stream: MediaStream | null = null;
  private ctx: AudioContext | null = null;
  private node: AudioWorkletNode | null = null;
  private frameTimer: ReturnType<typeof setInterval> | null = null;
  private video: HTMLVideoElement | null = null;
  private muted = false;
  private cameraOn = true;

  constructor(private opts: LiveMediaOptions) {}

  /** Ask for camera + microphone. Throws if the microphone is unavailable; the camera is optional. */
  async start(): Promise<{ camera: boolean }> {
    const audio: MediaTrackConstraints = { channelCount: 1, echoCancellation: true, noiseSuppression: false, autoGainControl: false };
    let camera = true;
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio, video: { width: { ideal: 1280 }, height: { ideal: 720 }, aspectRatio: { ideal: 16 / 9 } },
      });
    } catch {
      camera = false;                                     // retry with the microphone only
      this.stream = await navigator.mediaDevices.getUserMedia({ audio, video: false });
    }

    this.ctx = new AudioContext();
    const url = URL.createObjectURL(new Blob([WORKLET_SOURCE], { type: "application/javascript" }));
    try { await this.ctx.audioWorklet.addModule(url); } finally { URL.revokeObjectURL(url); }
    const source = this.ctx.createMediaStreamSource(this.stream);
    this.node = new AudioWorkletNode(this.ctx, "ilqaa-pcm16k");
    this.node.port.onmessage = (e: MessageEvent) => {
      const pcm = e.data.pcm as Float32Array;
      if (this.muted) pcm.fill(0);       // keep the stream (and its timing) going with silence
      this.opts.onAudio(pcm, this.muted ? 0 : (e.data.rms as number));
    };
    source.connect(this.node);
    // Route through a muted gain to the output so every browser keeps pulling the worklet (no echo: gain 0)
    const sink = this.ctx.createGain();
    sink.gain.value = 0;
    this.node.connect(sink).connect(this.ctx.destination);
    // Created after the permission prompt, the context can start "suspended" – resume it explicitly
    if (this.ctx.state !== "running") await this.ctx.resume().catch(() => { /* reported via diagnostics */ });

    if (camera) this.startFrames();
    return { camera };
  }

  /** Attach (or re-attach) the preview element – call whenever the <video> element mounts. */
  attachVideo(el: HTMLVideoElement | null) {
    this.video = el;
    if (el && this.stream && el.srcObject !== this.stream) {
      el.srcObject = this.stream;
      el.play().catch(() => { /* autoplay may need a gesture; muted previews usually play */ });
    }
  }

  /** Microphone / audio-pipeline state, for debugging. */
  audioInfo() {
    const track = this.stream?.getAudioTracks()[0];
    return {
      audioContextState: this.ctx?.state ?? "none",
      inputSampleRate: this.ctx?.sampleRate ?? null,
      microphone: track ? `${track.label || "unnamed"} (${track.readyState}${track.enabled ? "" : ", disabled"}${track.muted ? ", muted by system" : ""})` : "none",
      camera: this.stream?.getVideoTracks()[0]?.label || "none",
    };
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    this.stream?.getAudioTracks().forEach((t) => (t.enabled = !muted));
  }

  setCameraEnabled(on: boolean) {
    this.cameraOn = on;
    this.stream?.getVideoTracks().forEach((t) => (t.enabled = on));
  }

  stop() {
    if (this.frameTimer) clearInterval(this.frameTimer);
    this.frameTimer = null;
    try { this.node?.disconnect(); } catch { /* ignore */ }
    this.node = null;
    this.ctx?.close().catch(() => { /* ignore */ });
    this.ctx = null;
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
  }

  private startFrames() {
    const canvas = document.createElement("canvas");
    const g = canvas.getContext("2d");
    const width = this.opts.frameWidth ?? 640;
    const interval = 1000 / (this.opts.fps ?? 10);
    let encoding = false;
    this.frameTimer = setInterval(() => {
      const v = this.video;
      if (!g || encoding || !this.cameraOn || !v || v.readyState < 2 || !v.videoWidth || !this.opts.wantFrame()) return;
      canvas.width = width;
      canvas.height = Math.round((width * v.videoHeight) / v.videoWidth);
      g.drawImage(v, 0, 0, canvas.width, canvas.height);
      encoding = true;
      canvas.toBlob((blob) => {
        encoding = false;
        if (blob && this.opts.wantFrame()) blob.arrayBuffer().then((b) => this.opts.onFrame(b));
      }, "image/jpeg", 0.7);
    }, interval);
  }
}
