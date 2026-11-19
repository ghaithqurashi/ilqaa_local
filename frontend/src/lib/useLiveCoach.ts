import { useCallback, useEffect, useRef, useState } from "react";
import {
  AudioDiagnostics,
  ChannelName,
  ChannelStatus,
  emptyMetrics,
  FinalSummaries,
  LiveCoachClient,
  LiveMedia,
  LiveMetrics,
} from "./liveCoach";

const IDLE_CHANNELS: Record<ChannelName, ChannelStatus> = {
  audio: { state: "idle" }, video: { state: "idle" }, guidance: { state: "idle" }, sentiment: { state: "idle" },
};

export interface LiveSessionResult extends FinalSummaries {
  metrics: LiveMetrics;
  diagnostics: AudioDiagnostics | null;
}

/**
 * React wrapper around LiveCoachClient + LiveMedia.
 *
 *   const live = useLiveCoach();
 *   await live.start({ language: "ar", topic: "tedx_keynote" });
 *   <video ref={live.attachVideo} muted playsInline />
 *   const result = await live.stop();   // final backend summaries + last live metrics
 */
export function useLiveCoach() {
  const [metrics, setMetrics] = useState<LiveMetrics>(emptyMetrics);
  const [channels, setChannels] = useState<Record<ChannelName, ChannelStatus>>(IDLE_CHANNELS);
  const [cameraAvailable, setCameraAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);

  const clientRef = useRef<LiveCoachClient | null>(null);
  const mediaRef = useRef<LiveMedia | null>(null);
  const videoElRef = useRef<HTMLVideoElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayWanted = useRef(false);

  // Paint the backend's skeleton-overlay frames onto the overlay canvas (no React re-render)
  const drawOverlay = useCallback((b64: string) => {
    const canvas = overlayCanvasRef.current;
    if (!canvas || !overlayWanted.current) return;
    const img = new Image();
    img.onload = () => {
      const c = overlayCanvasRef.current;
      if (!c || !overlayWanted.current) return;
      const w = c.clientWidth || img.width, h = c.clientHeight || img.height;
      if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
      const g = c.getContext("2d");
      if (!g) return;
      // cover-fit, like the <video> element's object-cover
      const scale = Math.max(w / img.width, h / img.height);
      const dw = img.width * scale, dh = img.height * scale;
      g.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
    };
    img.src = "data:image/jpeg;base64," + b64;
  }, []);
  const pending = useRef<{ m: LiveMetrics; c: Record<ChannelName, ChannelStatus> } | null>(null);
  const raf = useRef<number | null>(null);

  // Batch updates to one React render per animation frame (video results arrive ~10×/s)
  const publish = useCallback((m: LiveMetrics, c: Record<ChannelName, ChannelStatus>) => {
    pending.current = { m, c };
    if (raf.current !== null) return;
    raf.current = requestAnimationFrame(() => {
      raf.current = null;
      const p = pending.current;
      if (p) { setMetrics(p.m); setChannels(p.c); }
    });
  }, []);

  const teardown = useCallback(() => {
    mediaRef.current?.stop();
    mediaRef.current = null;
    clientRef.current?.close();
    clientRef.current = null;
  }, []);

  /** Start microphone, camera and the four backend streams. Throws only if the microphone can't be used. */
  const start = useCallback(async (opts: { language: "ar" | "en"; topic: string; debug?: boolean; script?: string }) => {
    teardown();
    setError(null);
    setMetrics(emptyMetrics());
    setChannels(IDLE_CHANNELS);

    const client = new LiveCoachClient({ ...opts, onChange: publish, onOverlayFrame: drawOverlay });
    client.setOverlay(overlayWanted.current);
    let firstChunk = true;
    clientRef.current = client;
    const media = new LiveMedia({
      onAudio: (pcm, rms) => {
        if (firstChunk && opts.debug) {
          firstChunk = false;
          console.debug("%c[live:media]", "color:#8A1538;font-weight:bold", "first microphone chunk", pcm.length, "samples, rms", rms.toFixed(4));
        }
        client.sendAudio(pcm);
        client.setMicLevel(Math.min(100, rms * 600));
      },
      onFrame: (jpeg) => client.sendFrame(jpeg),
      wantFrame: () => client.canSendFrame(),
    });
    mediaRef.current = media;

    const streams = client.start().catch((e: Error) => {
      // Body-language analysis can still run without transcription – report, don't abort.
      setError(e.message || String(e));
    });
    try {
      const { camera } = await media.start();
      setCameraAvailable(camera);
      if (opts.debug) console.debug("%c[live:media]", "color:#8A1538;font-weight:bold", "media started", media.audioInfo());
      media.attachVideo(videoElRef.current);
    } catch (e: any) {
      teardown();
      throw new Error(e?.message || "Microphone access was denied");
    }
    await streams;
  }, [publish, teardown, drawOverlay]);

  /** Stop capturing, collect the backend's final summaries, close everything. */
  const stop = useCallback(async (): Promise<LiveSessionResult> => {
    const client = clientRef.current;
    mediaRef.current?.stop();
    mediaRef.current = null;
    if (!client) return { audio: null, video: null, metrics: emptyMetrics(), diagnostics: null };
    const diagnostics = client.diagnostics();          // before stop() closes the sockets
    const summaries = await client.stop();
    clientRef.current = null;
    return { ...summaries, metrics: client.metrics, diagnostics };
  }, []);

  /** Callback ref for every <video> preview (re-attaches the stream when the element remounts). */
  const attachVideo = useCallback((el: HTMLVideoElement | null) => {
    videoElRef.current = el;
    mediaRef.current?.attachVideo(el);
  }, []);

  /** Show/hide the MediaPipe skeleton overlay (body + hand landmarks drawn by the backend). */
  const setOverlay = useCallback((on: boolean) => {
    overlayWanted.current = on;
    clientRef.current?.setOverlay(on);
    if (!on) {
      const c = overlayCanvasRef.current;
      c?.getContext("2d")?.clearRect(0, 0, c.width, c.height);
    }
  }, []);

  /** Callback ref for the overlay <canvas> placed over the video. */
  const attachOverlayCanvas = useCallback((el: HTMLCanvasElement | null) => { overlayCanvasRef.current = el; }, []);

  /** Live counters for the debug panel (null when no session is running). */
  const getDiagnostics = useCallback(() => {
    const d = clientRef.current?.diagnostics();
    return d ? { ...d, ...(mediaRef.current?.audioInfo() ?? {}) } : null;
  }, []);

  const setMuted = useCallback((muted: boolean) => mediaRef.current?.setMuted(muted), []);
  const setCameraEnabled = useCallback((on: boolean) => mediaRef.current?.setCameraEnabled(on), []);

  useEffect(() => () => {
    if (raf.current !== null) cancelAnimationFrame(raf.current);
    teardown();
  }, [teardown]);

  return {
    metrics, channels, cameraAvailable, error, start, stop, attachVideo, setMuted, setCameraEnabled, getDiagnostics,
    setOverlay, attachOverlayCanvas,
  };
}
