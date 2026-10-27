"use client";

import { useSyncExternalStore } from "react";
import { fetchJson } from "../client-api";
import type { SearchResponse, Track } from "../types";
import { AudioEngine, type EngineStatus } from "./engine";

export type RepeatMode = "off" | "all" | "one";

export interface PlayerContext {
  label: string;
  query?: string;
}

export interface PlayerState {
  queue: Track[];
  index: number;
  current: Track | null;
  status: EngineStatus | "error";
  repeat: RepeatMode;
  context: PlayerContext | null;
  launching: boolean;
  error: string | null;
  expanded: boolean;
}

export interface TimeState {
  currentTime: number;
  duration: number;
}

const MAX_CONSECUTIVE_ERRORS = 5;

const initialState: PlayerState = {
  queue: [],
  index: -1,
  current: null,
  status: "idle",
  repeat: "off",
  context: null,
  launching: false,
  error: null,
  expanded: false,
};

class PlayerStore {
  private state: PlayerState = initialState;
  private time: TimeState = { currentTime: 0, duration: 0 };
  private listeners = new Set<() => void>();
  private timeListeners = new Set<() => void>();
  private engine: AudioEngine | null = null;
  private consecutiveErrors = 0;
  private launchToken = 0;
  private mediaSessionBound = false;

  /* ---- subscription plumbing ---- */
  subscribe = (fn: () => void) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };
  subscribeTime = (fn: () => void) => {
    this.timeListeners.add(fn);
    return () => this.timeListeners.delete(fn);
  };
  getState = () => this.state;
  getTime = () => this.time;

  private set(patch: Partial<PlayerState>) {
    this.state = { ...this.state, ...patch };
    this.listeners.forEach((l) => l());
    this.syncMediaSession();
  }

  private setTime(currentTime: number, duration: number) {
    this.time = { currentTime, duration };
    this.timeListeners.forEach((l) => l());
    this.syncPosition();
  }

  /* ---- engine ---- */
  private getEngine(): AudioEngine {
    if (!this.engine) {
      this.engine = new AudioEngine({
        onStatus: (status) => {
          if (status === "playing") this.consecutiveErrors = 0;
          if (this.state.current) this.set({ status, error: null });
        },
        onTime: (t, d) => this.setTime(t, d),
        onEnded: () => this.advance(true),
        onError: (message) => this.handleError(message),
      });
      this.bindMediaSession();
    }
    return this.engine;
  }

  attachYouTubeHost(el: HTMLElement) {
    this.getEngine().attachYouTubeHost(el);
  }

  private handleError(message: string) {
    this.consecutiveErrors += 1;
    if (this.consecutiveErrors >= MAX_CONSECUTIVE_ERRORS || this.state.queue.length <= 1) {
      this.set({ status: "error", error: message });
      return;
    }
    // Skip unplayable tracks automatically so the workout never stalls.
    this.advance(false);
  }

  private loadCurrent() {
    const track = this.state.current;
    if (!track) return;
    this.setTime(0, track.duration ?? 0);
    void this.getEngine().load(track);
  }

  private goTo(index: number) {
    const track = this.state.queue[index];
    if (!track) return;
    this.set({ index, current: track, status: "loading", error: null });
    this.loadCurrent();
  }

  private advance(fromEnded: boolean) {
    const { index, queue, repeat } = this.state;
    if (fromEnded && repeat === "one") {
      this.getEngine().seek(0);
      this.getEngine().play();
      return;
    }
    if (index + 1 < queue.length) return this.goTo(index + 1);
    if (repeat === "all" && queue.length > 0) return this.goTo(0);
    this.set({ status: "paused" });
  }

  /* ---- public actions ---- */
  unlock() {
    this.getEngine().unlock();
  }

  playQueue(tracks: Track[], startIndex = 0, context: PlayerContext | null = null) {
    if (tracks.length === 0) return;
    this.getEngine().unlock();
    this.consecutiveErrors = 0;
    const index = Math.min(Math.max(startIndex, 0), tracks.length - 1);
    this.set({ queue: tracks, context, launching: false });
    this.goTo(index);
  }

  /** Searches and starts playing the first result with the rest queued for autoplay. */
  async playQuery(query: string, opts: { record: boolean; label?: string }): Promise<Track[]> {
    this.getEngine().unlock();
    const token = ++this.launchToken;
    this.set({ launching: true, error: null });
    try {
      const params = new URLSearchParams({ q: query });
      if (opts.record) params.set("record", "1");
      const result = await fetchJson<SearchResponse>(`/api/search?${params}`);
      if (token !== this.launchToken) return result.tracks;
      if (result.tracks.length === 0) {
        this.set({ launching: false });
        return [];
      }
      this.playQueue(result.tracks, 0, { label: opts.label ?? query, query });
      return result.tracks;
    } catch (err) {
      if (token === this.launchToken) this.set({ launching: false });
      throw err;
    }
  }

  toggle() {
    const { status, current } = this.state;
    if (!current) return;
    this.getEngine().unlock();
    if (status === "playing" || status === "loading") this.getEngine().pause();
    else if (status === "error") {
      this.consecutiveErrors = 0;
      this.set({ error: null, status: "loading" });
      this.loadCurrent();
    } else this.getEngine().play();
  }

  next() {
    this.consecutiveErrors = 0;
    const { index, queue, repeat } = this.state;
    if (index + 1 < queue.length) this.goTo(index + 1);
    else if (repeat === "all" || queue.length > 1) this.goTo(0);
  }

  prev() {
    const { index, queue } = this.state;
    if (this.getEngine().getTime().currentTime > 3 || index <= 0) {
      this.getEngine().seek(0);
      return;
    }
    if (queue[index - 1]) this.goTo(index - 1);
  }

  seek(seconds: number) {
    this.getEngine().seek(seconds);
    this.setTime(seconds, this.time.duration);
  }

  skipBy(delta: number) {
    const { currentTime, duration } = this.getEngine().getTime();
    this.seek(Math.max(0, Math.min(duration || Infinity, currentTime + delta)));
  }

  enqueue(track: Track, playNext = false) {
    const { queue, index, current } = this.state;
    if (!current) return this.playQueue([track], 0, { label: "Queue" });
    const copy = [...queue];
    copy.splice(playNext ? index + 1 : copy.length, 0, track);
    this.set({ queue: copy });
  }

  playFromQueue(index: number) {
    this.consecutiveErrors = 0;
    this.goTo(index);
  }

  removeFromQueue(index: number) {
    const { queue, index: cur } = this.state;
    if (index === cur || index < 0 || index >= queue.length) return;
    const copy = queue.filter((_, i) => i !== index);
    this.set({ queue: copy, index: index < cur ? cur - 1 : cur });
  }

  cycleRepeat() {
    const order: RepeatMode[] = ["off", "all", "one"];
    this.set({ repeat: order[(order.indexOf(this.state.repeat) + 1) % order.length] });
  }

  setExpanded(expanded: boolean) {
    this.set({ expanded });
  }

  /* ---- Media Session (lock screen / AirPods / car controls) ---- */
  private bindMediaSession() {
    if (this.mediaSessionBound || typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    this.mediaSessionBound = true;
    const ms = navigator.mediaSession;
    const set = (action: MediaSessionAction, handler: MediaSessionActionHandler | null) => {
      try {
        ms.setActionHandler(action, handler);
      } catch {
        /* action unsupported on this platform */
      }
    };
    set("play", () => this.toggleTo(true));
    set("pause", () => this.toggleTo(false));
    set("previoustrack", () => this.prev());
    set("nexttrack", () => this.next());
    set("seekbackward", (d) => this.skipBy(-(d.seekOffset ?? 10)));
    set("seekforward", (d) => this.skipBy(d.seekOffset ?? 10));
    set("seekto", (d) => d.seekTime != null && this.seek(d.seekTime));
    set("stop", () => this.toggleTo(false));
  }

  private toggleTo(playing: boolean) {
    const isPlaying = this.state.status === "playing" || this.state.status === "loading";
    if (playing !== isPlaying) this.toggle();
  }

  private syncMediaSession() {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const { current, status } = this.state;
    const ms = navigator.mediaSession;
    if (!current) {
      ms.metadata = null;
      ms.playbackState = "none";
      return;
    }
    if (ms.metadata?.title !== current.title || ms.metadata?.artist !== current.artist) {
      const artwork = current.artwork
        ? ["96x96", "192x192", "512x512"].map((sizes) => ({ src: current.artwork as string, sizes }))
        : [{ src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }];
      ms.metadata = new MediaMetadata({
        title: current.title,
        artist: current.artist,
        album: this.state.context?.label ?? "IronBeat",
        artwork,
      });
    }
    ms.playbackState = status === "playing" ? "playing" : "paused";
  }

  private lastPositionSync = 0;
  private syncPosition() {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const now = Date.now();
    if (now - this.lastPositionSync < 1000) return;
    this.lastPositionSync = now;
    const { currentTime, duration } = this.time;
    if (!duration || !Number.isFinite(duration)) return;
    try {
      navigator.mediaSession.setPositionState({
        duration,
        position: Math.min(currentTime, duration),
        playbackRate: 1,
      });
    } catch {
      /* ignore invalid position state */
    }
  }
}

let store: PlayerStore | null = null;
export function getPlayer(): PlayerStore {
  store ??= new PlayerStore();
  return store;
}

export function usePlayer(): PlayerState {
  const s = getPlayer();
  return useSyncExternalStore(s.subscribe, s.getState, () => initialState);
}

const serverTime: TimeState = { currentTime: 0, duration: 0 };
export function usePlayerTime(): TimeState {
  const s = getPlayer();
  return useSyncExternalStore(s.subscribeTime, s.getTime, () => serverTime);
}
