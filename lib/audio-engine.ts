import type { Track } from "@/lib/types";

/* Minimal typings for the parts of the YouTube IFrame Player API we use. */
interface YTPlayer {
  loadVideoById(videoId: string): void;
  cueVideoById(videoId: string): void;
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  setVolume(volume: number): void;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  destroy(): void;
}

interface YTNamespace {
  Player: new (
    element: HTMLElement,
    options: {
      width: number | string;
      height: number | string;
      playerVars?: Record<string, number | string>;
      events: {
        onReady: () => void;
        onStateChange: (event: { data: number }) => void;
        onError: (event: { data: number }) => void;
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

export interface EngineListeners {
  onPlayState(playing: boolean): void;
  onProgress(current: number, duration: number): void;
  onBuffering(buffering: boolean): void;
  onEnded(): void;
  onError(message: string, fatal: boolean): void;
}

const YT_ENDED = 0;
const YT_PLAYING = 1;
const YT_PAUSED = 2;
const YT_BUFFERING = 3;

/** One second of 8-bit mono silence as a WAV blob URL – used to unlock iOS audio and keep the media session alive. */
function createSilenceUrl(): string {
  const sampleRate = 8000;
  const samples = sampleRate;
  const buffer = new ArrayBuffer(44 + samples);
  const view = new DataView(buffer);
  const writeString = (offset: number, text: string) => {
    for (let i = 0; i < text.length; i++) view.setUint8(offset + i, text.charCodeAt(i));
  };
  writeString(0, "RIFF");
  view.setUint32(4, 36 + samples, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate, true);
  view.setUint16(32, 1, true);
  view.setUint16(34, 8, true);
  writeString(36, "data");
  view.setUint32(40, samples, true);
  new Uint8Array(buffer, 44).fill(128);
  return URL.createObjectURL(new Blob([buffer], { type: "audio/wav" }));
}

let ytApiPromise: Promise<YTNamespace> | null = null;

function loadYouTubeApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise<YTNamespace>((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      if (window.YT?.Player) resolve(window.YT);
      else reject(new Error("YouTube player failed to initialise"));
    };
    const script = document.createElement("script");
    script.src = "https://www.youtube.com/iframe_api";
    script.async = true;
    script.onerror = () => {
      ytApiPromise = null;
      reject(new Error("Could not load the YouTube player"));
    };
    document.head.appendChild(script);
  });
  return ytApiPromise;
}

/**
 * Unified playback engine. A single persistent HTMLAudioElement handles direct streams
 * (Internet Archive, Openverse, Jamendo); the YouTube IFrame API handles YouTube tracks.
 */
export class AudioEngine {
  private audio: HTMLAudioElement;
  private keepAlive: HTMLAudioElement;
  private silenceUrl: string;
  private yt: YTPlayer | null = null;
  private ytReady: Promise<YTPlayer> | null = null;
  private ytHost: HTMLDivElement | null = null;
  private ytTimer: number | null = null;
  private activeBackend: "html5" | "youtube" | null = null;
  private loadToken = 0;
  private hiddenAt = 0;
  /** True from the moment playback is requested until the user (or end of queue) stops it. */
  private intendedPlaying = false;
  private volume = 1;

  constructor(private listeners: EngineListeners) {
    this.silenceUrl = createSilenceUrl();
    // Both elements are attached to the DOM and flagged inline/playback so iOS treats them as a
    // persistent media session that keeps running when the app is backgrounded or the screen locks.
    this.audio = this.createMediaElement();
    this.audio.preload = "auto";
    this.keepAlive = this.createMediaElement();
    this.keepAlive.src = this.silenceUrl;
    this.keepAlive.loop = true;
    this.setAudioSessionPlayback();
    this.bindAudioEvents();
  }

  setListeners(listeners: EngineListeners) {
    this.listeners = listeners;
  }

  private createMediaElement(): HTMLAudioElement {
    const el = document.createElement("audio");
    el.setAttribute("playsinline", "");
    el.setAttribute("webkit-playsinline", "");
    el.setAttribute("x-webkit-airplay", "allow");
    (el as HTMLAudioElement & { playsInline: boolean }).playsInline = true;
    el.autoplay = false;
    Object.assign(el.style, {
      position: "fixed",
      width: "0",
      height: "0",
      opacity: "0",
      pointerEvents: "none",
    });
    el.setAttribute("aria-hidden", "true");
    document.body.appendChild(el);
    return el;
  }

  /** Safari 16.4+/iOS 17: declare "playback" so audio keeps going on lock and ignores the mute switch. */
  private setAudioSessionPlayback(): void {
    const session = (navigator as Navigator & { audioSession?: { type: string } }).audioSession;
    if (session) {
      try {
        session.type = "playback";
      } catch {
        /* unsupported value on this browser */
      }
    }
  }

  private bindAudioEvents() {
    const a = this.audio;
    a.addEventListener("play", () => this.activeBackend === "html5" && this.listeners.onPlayState(true));
    a.addEventListener("pause", () => {
      if (this.activeBackend !== "html5") return;
      // iOS sometimes pauses the element right as the page is hidden (minimise / lock). If the user
      // did not ask for the pause, resume immediately. Pauses at any other time (e.g. AirPods
      // removed, phone call, lock-screen pause button) are respected.
      const justHidden = document.hidden && Date.now() - this.hiddenAt < 1500;
      if (this.intendedPlaying && justHidden && !a.ended) {
        void a.play().catch(() => this.listeners.onPlayState(false));
        return;
      }
      this.listeners.onPlayState(false);
    });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.hiddenAt = Date.now();
    });
    a.addEventListener("waiting", () => this.activeBackend === "html5" && this.listeners.onBuffering(true));
    a.addEventListener("playing", () => this.activeBackend === "html5" && this.listeners.onBuffering(false));
    a.addEventListener("canplay", () => this.activeBackend === "html5" && this.listeners.onBuffering(false));
    a.addEventListener("timeupdate", () => {
      if (this.activeBackend === "html5") this.listeners.onProgress(a.currentTime, a.duration || 0);
    });
    a.addEventListener("durationchange", () => {
      if (this.activeBackend === "html5") this.listeners.onProgress(a.currentTime, a.duration || 0);
    });
    a.addEventListener("ended", () => this.activeBackend === "html5" && this.listeners.onEnded());
    a.addEventListener("error", () => {
      if (this.activeBackend !== "html5" || !a.src || a.src === this.silenceUrl) return;
      this.listeners.onError("This track could not be played.", false);
    });
  }

  /**
   * Must be called synchronously inside a user gesture (tap/click). iOS only allows later,
   * asynchronous playback on elements that were started by a gesture first.
   */
  prime(): void {
    this.setAudioSessionPlayback();
    if (!this.audio.getAttribute("src") || this.audio.src === this.silenceUrl) {
      this.audio.src = this.silenceUrl;
      void this.audio.play().catch(() => undefined);
    }
    void this.keepAlive.play().then(() => this.keepAlive.pause()).catch(() => undefined);
  }

  async load(track: Track, autoplay = true): Promise<void> {
    const token = ++this.loadToken;
    this.intendedPlaying = autoplay;
    this.listeners.onProgress(0, track.durationSec ?? 0);
    this.listeners.onBuffering(true);

    if (track.source === "youtube") {
      this.audio.pause();
      this.audio.removeAttribute("src");
      this.activeBackend = "youtube";
      try {
        const player = await this.ensureYouTube();
        if (token !== this.loadToken) return;
        this.startYtTimer();
        if (autoplay) player.loadVideoById(track.sourceId);
        else player.cueVideoById(track.sourceId);
        player.setVolume(this.volume * 100);
      } catch (err) {
        if (token === this.loadToken) {
          this.listeners.onError(err instanceof Error ? err.message : "YouTube playback failed", false);
        }
      }
      return;
    }

    this.stopYouTube();
    this.activeBackend = "html5";
    if (!track.audioUrl) {
      this.listeners.onError("This track has no playable audio.", false);
      return;
    }
    this.audio.src = track.audioUrl;
    this.audio.volume = this.volume;
    if (!autoplay) return;
    try {
      await this.audio.play();
    } catch (err) {
      if (token !== this.loadToken) return;
      if (err instanceof DOMException && err.name === "NotAllowedError") {
        this.listeners.onBuffering(false);
        this.listeners.onPlayState(false);
        this.listeners.onError("Tap play to start the music.", false);
      } else if (!(err instanceof DOMException && err.name === "AbortError")) {
        this.listeners.onError("This track could not be played.", false);
      }
    }
  }

  play(): void {
    this.intendedPlaying = true;
    if (this.activeBackend === "youtube") this.yt?.playVideo();
    else if (this.activeBackend === "html5") void this.audio.play().catch(() => undefined);
  }

  pause(): void {
    this.intendedPlaying = false;
    if (this.activeBackend === "youtube") this.yt?.pauseVideo();
    else this.audio.pause();
  }

  seek(seconds: number): void {
    if (this.activeBackend === "youtube") {
      this.yt?.seekTo(seconds, true);
      this.listeners.onProgress(seconds, this.yt?.getDuration() ?? 0);
    } else if (Number.isFinite(seconds)) {
      this.audio.currentTime = seconds;
    }
  }

  setVolume(value: number): void {
    this.volume = Math.min(1, Math.max(0, value));
    this.audio.volume = this.volume;
    this.yt?.setVolume(this.volume * 100);
  }

  /** Tears down playback and removes the media elements (only used when the provider unmounts). */
  destroy(): void {
    this.stop();
    this.audio.remove();
    this.keepAlive.remove();
    this.ytHost?.remove();
  }

  stop(): void {
    this.intendedPlaying = false;
    this.loadToken++;
    this.audio.pause();
    this.audio.removeAttribute("src");
    this.stopYouTube();
    this.activeBackend = null;
    this.listeners.onPlayState(false);
  }

  /** Positions the (otherwise off-screen) YouTube player over a visible slot, or hides it with null. */
  showVideoAt(rect: DOMRect | null): void {
    const host = this.ytHost;
    if (!host) return;
    if (!rect) {
      Object.assign(host.style, { left: "-10000px", top: "0px", width: "240px", height: "135px", opacity: "0" });
      return;
    }
    Object.assign(host.style, {
      left: `${rect.left}px`,
      top: `${rect.top}px`,
      width: `${rect.width}px`,
      height: `${rect.height}px`,
      opacity: "1",
    });
  }

  private ensureYouTube(): Promise<YTPlayer> {
    if (this.ytReady) return this.ytReady;
    this.ytReady = loadYouTubeApi().then(
      (YT) =>
        new Promise<YTPlayer>((resolve) => {
          const host = document.createElement("div");
          host.setAttribute("aria-hidden", "true");
          Object.assign(host.style, {
            position: "fixed",
            left: "-10000px",
            top: "0px",
            width: "240px",
            height: "135px",
            zIndex: "70",
            borderRadius: "16px",
            overflow: "hidden",
            opacity: "0",
          });
          const mount = document.createElement("div");
          host.appendChild(mount);
          document.body.appendChild(host);
          this.ytHost = host;
          const player = new YT.Player(mount, {
            width: "100%",
            height: "100%",
            playerVars: { playsinline: 1, controls: 0, disablekb: 1, rel: 0, modestbranding: 1, fs: 0 },
            events: {
              onReady: () => {
                this.yt = player;
                resolve(player);
              },
              onStateChange: (event) => this.handleYtState(event.data),
              onError: () => this.listeners.onError("This YouTube video can't be played here.", false),
            },
          });
          const iframe = host.querySelector("iframe");
          if (iframe) {
            iframe.style.width = "100%";
            iframe.style.height = "100%";
          }
        }),
    );
    this.ytReady.catch(() => {
      this.ytReady = null;
    });
    return this.ytReady;
  }

  private handleYtState(state: number) {
    if (this.activeBackend !== "youtube") return;
    if (state === YT_PLAYING) {
      this.listeners.onBuffering(false);
      this.listeners.onPlayState(true);
      void this.keepAlive.play().catch(() => undefined);
    } else if (state === YT_PAUSED) {
      this.listeners.onPlayState(false);
      this.keepAlive.pause();
    } else if (state === YT_BUFFERING) {
      this.listeners.onBuffering(true);
    } else if (state === YT_ENDED) {
      this.keepAlive.pause();
      this.listeners.onEnded();
    }
  }

  private startYtTimer() {
    if (this.ytTimer !== null) return;
    this.ytTimer = window.setInterval(() => {
      if (this.activeBackend !== "youtube" || !this.yt) return;
      this.listeners.onProgress(this.yt.getCurrentTime() || 0, this.yt.getDuration() || 0);
    }, 500);
  }

  private stopYouTube() {
    if (this.ytTimer !== null) {
      window.clearInterval(this.ytTimer);
      this.ytTimer = null;
    }
    this.keepAlive.pause();
    try {
      this.yt?.stopVideo();
    } catch {
      /* player not ready yet */
    }
  }
}
