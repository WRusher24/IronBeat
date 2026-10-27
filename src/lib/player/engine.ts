import type { Track } from "../types";

/* Minimal typings for the YouTube IFrame Player API. */
interface YTPlayer {
  loadVideoById(id: string): void;
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getCurrentTime(): number;
  getDuration(): number;
  destroy(): void;
}
interface YTNamespace {
  Player: new (
    el: HTMLElement,
    opts: {
      width: string;
      height: string;
      playerVars: Record<string, string | number>;
      events: {
        onReady: () => void;
        onStateChange: (e: { data: number }) => void;
        onError: (e: { data: number }) => void;
      };
    },
  ) => YTPlayer;
}
declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export type EngineStatus = "idle" | "loading" | "playing" | "paused";

export interface EngineListener {
  onStatus(status: EngineStatus): void;
  onTime(currentTime: number, duration: number): void;
  onEnded(): void;
  onError(message: string): void;
}

// 0.1s of silent 8-bit PCM; played inside a user gesture to unlock programmatic playback on iOS.
const SILENT_WAV =
  "data:audio/wav;base64,UklGRkQDAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YSADAACAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgA==";

export function streamUrl(track: Track): string {
  return `/api/stream/${track.source}/${encodeURIComponent(track.sourceId)}`;
}

let ytApiPromise: Promise<YTNamespace> | null = null;
function loadYouTubeApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  ytApiPromise ??= new Promise<YTNamespace>((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      if (window.YT) resolve(window.YT);
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => {
      ytApiPromise = null;
      reject(new Error("Could not load the YouTube player."));
    };
    document.head.appendChild(script);
  });
  return ytApiPromise;
}

/**
 * Unified playback engine: one persistent HTML5 <audio> element for direct streams and a
 * lazily created YouTube IFrame player for YouTube tracks. Emits a single event stream so
 * the store never needs to know which backend is active.
 */
export class AudioEngine {
  private audio: HTMLAudioElement;
  private yt: YTPlayer | null = null;
  private ytReady: Promise<YTPlayer> | null = null;
  private ytHost: HTMLElement | null = null;
  private ytTimer: ReturnType<typeof setInterval> | null = null;
  private backend: "audio" | "youtube" = "audio";
  private loadToken = 0;
  private unlocked = false;

  constructor(private listener: EngineListener) {
    this.audio = new Audio();
    this.audio.preload = "auto";
    this.audio.setAttribute("playsinline", "");
    this.bindAudioEvents();
  }

  attachYouTubeHost(el: HTMLElement) {
    this.ytHost = el;
  }

  /** Call synchronously from a tap handler before any `await`, so later autoplay is allowed. */
  unlock() {
    if (this.unlocked) return;
    this.unlocked = true;
    const previousSrc = this.audio.src;
    if (!previousSrc) {
      this.audio.src = SILENT_WAV;
      this.audio.play().catch(() => {
        this.unlocked = false;
      });
    }
  }

  get element(): HTMLAudioElement {
    return this.audio;
  }

  async load(track: Track) {
    const token = ++this.loadToken;
    this.listener.onStatus("loading");
    this.listener.onTime(0, track.duration ?? 0);

    if (track.source === "youtube") {
      this.audio.pause();
      this.audio.removeAttribute("src");
      this.backend = "youtube";
      try {
        const player = await this.ensureYouTube();
        if (token !== this.loadToken) return;
        player.loadVideoById(track.sourceId);
      } catch (err) {
        if (token === this.loadToken) this.listener.onError(err instanceof Error ? err.message : "YouTube failed to load.");
      }
      return;
    }

    this.stopYouTube();
    this.backend = "audio";
    this.audio.src = streamUrl(track);
    try {
      await this.audio.play();
    } catch (err) {
      if (token !== this.loadToken) return;
      // AbortError means a newer load replaced this one; NotAllowedError means the browser wants a tap.
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        this.listener.onStatus("paused");
      } else if (!(err instanceof DOMException && err.name === "AbortError")) {
        this.listener.onError("This track could not be played.");
      }
    }
  }

  play() {
    if (this.backend === "youtube") this.yt?.playVideo();
    else this.audio.play().catch(() => this.listener.onStatus("paused"));
  }

  pause() {
    if (this.backend === "youtube") this.yt?.pauseVideo();
    else this.audio.pause();
  }

  seek(seconds: number) {
    if (this.backend === "youtube") this.yt?.seekTo(seconds, true);
    else if (Number.isFinite(seconds)) this.audio.currentTime = seconds;
  }

  getTime(): { currentTime: number; duration: number } {
    if (this.backend === "youtube" && this.yt) {
      return { currentTime: this.yt.getCurrentTime?.() ?? 0, duration: this.yt.getDuration?.() ?? 0 };
    }
    const d = this.audio.duration;
    return { currentTime: this.audio.currentTime, duration: Number.isFinite(d) ? d : 0 };
  }

  get isYouTube() {
    return this.backend === "youtube";
  }

  private bindAudioEvents() {
    const a = this.audio;
    const active = () => this.backend === "audio";
    a.addEventListener("playing", () => active() && this.listener.onStatus("playing"));
    a.addEventListener("pause", () => active() && !a.ended && a.src && this.listener.onStatus("paused"));
    a.addEventListener("waiting", () => active() && this.listener.onStatus("loading"));
    a.addEventListener("ended", () => active() && !a.src.startsWith("data:") && this.listener.onEnded());
    a.addEventListener("error", () => {
      if (!active() || !a.src || a.src.startsWith("data:")) return;
      this.listener.onError("This track could not be played.");
    });
    const emitTime = () => {
      if (!active()) return;
      const d = a.duration;
      this.listener.onTime(a.currentTime, Number.isFinite(d) ? d : 0);
    };
    a.addEventListener("timeupdate", emitTime);
    a.addEventListener("loadedmetadata", emitTime);
    a.addEventListener("durationchange", emitTime);
  }

  private ensureYouTube(): Promise<YTPlayer> {
    if (this.ytReady) return this.ytReady;
    this.ytReady = loadYouTubeApi().then(
      (YT) =>
        new Promise<YTPlayer>((resolve, reject) => {
          if (!this.ytHost) return reject(new Error("YouTube player container is missing."));
          const target = document.createElement("div");
          this.ytHost.appendChild(target);
          const player = new YT.Player(target, {
            width: "100%",
            height: "100%",
            playerVars: {
              playsinline: 1,
              controls: 0,
              rel: 0,
              disablekb: 1,
              modestbranding: 1,
              autoplay: 1,
              origin: window.location.origin,
            },
            events: {
              onReady: () => {
                this.yt = player;
                resolve(player);
              },
              onStateChange: (e) => this.onYouTubeState(e.data),
              onError: () => this.backend === "youtube" && this.listener.onError("This video can't be played here."),
            },
          });
        }),
    );
    this.ytReady.catch(() => {
      this.ytReady = null;
    });
    return this.ytReady;
  }

  private onYouTubeState(state: number) {
    if (this.backend !== "youtube") return;
    if (state === 1) {
      this.listener.onStatus("playing");
      this.startYtTimer();
    } else if (state === 2) {
      this.listener.onStatus("paused");
      this.stopYtTimer();
    } else if (state === 3) {
      this.listener.onStatus("loading");
    } else if (state === 0) {
      this.stopYtTimer();
      this.listener.onEnded();
    }
  }

  private startYtTimer() {
    this.stopYtTimer();
    const tick = () => {
      if (!this.yt) return;
      this.listener.onTime(this.yt.getCurrentTime(), this.yt.getDuration());
    };
    tick();
    this.ytTimer = setInterval(tick, 500);
  }

  private stopYtTimer() {
    if (this.ytTimer) clearInterval(this.ytTimer);
    this.ytTimer = null;
  }

  private stopYouTube() {
    this.stopYtTimer();
    try {
      this.yt?.stopVideo();
    } catch {
      /* player may not be ready */
    }
  }
}
