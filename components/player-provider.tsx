"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AudioEngine } from "@/lib/audio-engine";
import type { Track } from "@/lib/types";
import { useToast } from "@/components/toast";

export type RepeatMode = "off" | "all" | "one";

interface PlayerContextValue {
  current: Track | null;
  queue: Track[];
  index: number;
  playing: boolean;
  buffering: boolean;
  position: number;
  duration: number;
  shuffleOn: boolean;
  repeat: RepeatMode;
  expanded: boolean;
  launching: string | null;
  /** When on, YouTube tracks are skipped because iOS cannot keep them playing with the screen locked. */
  backgroundSafe: boolean;
  setBackgroundSafe(value: boolean): void;
  setExpanded(value: boolean): void;
  playTracks(tracks: Track[], startIndex?: number): void;
  /** Primes audio inside the tap, runs the loader, then plays the returned list from the top. */
  launch(label: string, loader: () => Promise<Track[]>): Promise<Track[]>;
  prime(): void;
  /** Stops playback and clears the queue (used on sign-out). */
  stop(): void;
  toggle(): void;
  next(): void;
  previous(): void;
  seek(seconds: number): void;
  toggleShuffle(): void;
  cycleRepeat(): void;
  jumpTo(index: number): void;
  showVideoAt(rect: DOMRect | null): void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function usePlayer(): PlayerContextValue {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used inside <PlayerProvider>");
  return ctx;
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const { notify } = useToast();
  const engineRef = useRef<AudioEngine | null>(null);

  const [queue, setQueue] = useState<Track[]>([]);
  const [index, setIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [shuffleOn, setShuffleOn] = useState(false);
  const [repeat, setRepeat] = useState<RepeatMode>("off");
  const [expanded, setExpanded] = useState(false);
  const [launching, setLaunching] = useState<string | null>(null);
  const [backgroundSafe, setBackgroundSafeState] = useState(false);
  const backgroundSafeRef = useRef(false);

  // Default to background-safe on iPhone/iPad, where embedded YouTube audio stops when the screen locks.
  useEffect(() => {
    let value = /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    try {
      const stored = localStorage.getItem("ib-background-safe");
      if (stored !== null) value = stored === "1";
    } catch {
      /* storage unavailable */
    }
    backgroundSafeRef.current = value;
    setBackgroundSafeState(value);
  }, []);

  const setBackgroundSafe = useCallback((value: boolean) => {
    backgroundSafeRef.current = value;
    setBackgroundSafeState(value);
    try {
      localStorage.setItem("ib-background-safe", value ? "1" : "0");
    } catch {
      /* storage unavailable */
    }
  }, []);

  // Latest values for engine callbacks, which outlive individual renders.
  const live = useRef({ queue, index, shuffleOn, repeat });
  live.current = { queue, index, shuffleOn, repeat };
  const errorStreak = useRef(0);
  const positionRef = useRef(0);

  const current = index >= 0 ? (queue[index] ?? null) : null;

  const startIndex = useCallback((nextIndex: number, tracks?: Track[]) => {
    const list = tracks ?? live.current.queue;
    const track = list[nextIndex];
    if (!track) return;
    live.current = { ...live.current, queue: list, index: nextIndex };
    setQueue(list);
    setIndex(nextIndex);
    setPosition(0);
    setDuration(track.durationSec ?? 0);
    void engineRef.current?.load(track, true);
  }, []);

  const advance = useCallback(
    (reason: "ended" | "skip" | "error") => {
      const { queue: q, index: i, shuffleOn: shuf, repeat: rep } = live.current;
      if (q.length === 0) return;
      if (reason === "ended" && rep === "one") {
        engineRef.current?.seek(0);
        engineRef.current?.play();
        return;
      }
      let target: number;
      if (shuf && q.length > 1) {
        do {
          target = Math.floor(Math.random() * q.length);
        } while (target === i);
      } else {
        target = i + 1;
        if (target >= q.length) {
          if (rep === "all" || reason === "skip") target = 0;
          else {
            setPlaying(false);
            return;
          }
        }
      }
      startIndex(target);
    },
    [startIndex],
  );

  const advanceRef = useRef(advance);
  advanceRef.current = advance;

  // Create the engine once on the client.
  useEffect(() => {
    const engine = new AudioEngine({
      onPlayState: (value) => {
        setPlaying(value);
        if (value) errorStreak.current = 0;
      },
      onProgress: (cur, dur) => {
        positionRef.current = cur;
        setPosition(cur);
        if (dur > 0 && Number.isFinite(dur)) setDuration(dur);
      },
      onBuffering: setBuffering,
      onEnded: () => advanceRef.current("ended"),
      onError: (message) => {
        errorStreak.current += 1;
        if (errorStreak.current > Math.min(5, live.current.queue.length)) {
          errorStreak.current = 0;
          setPlaying(false);
          setBuffering(false);
          notify(message);
          return;
        }
        notify(`${message} Skipping…`);
        advanceRef.current("error");
      },
    });
    engineRef.current = engine;
    return () => {
      engine.destroy();
      engineRef.current = null;
    };
  }, [notify]);

  const playTracks = useCallback(
    (input: Track[], start = 0) => {
      let tracks = input;
      let first = Math.min(Math.max(start, 0), input.length - 1);
      if (backgroundSafeRef.current) {
        const wanted = input[first];
        tracks = input.filter((t) => t.source !== "youtube");
        first = Math.max(0, tracks.findIndex((t) => t.id === wanted?.id));
        if (tracks.length === 0 && input.length > 0) {
          notify("Background-safe mode is on: YouTube tracks are skipped. Turn it off in Settings to play them.");
        }
      }
      if (tracks.length === 0) return;
      errorStreak.current = 0;
      startIndex(first, tracks);
    },
    [startIndex, notify],
  );

  const prime = useCallback(() => engineRef.current?.prime(), []);

  const launch = useCallback(
    async (label: string, loader: () => Promise<Track[]>) => {
      engineRef.current?.prime();
      setLaunching(label);
      try {
        const loaded = await loader();
        const tracks = backgroundSafeRef.current ? loaded.filter((t) => t.source !== "youtube") : loaded;
        if (tracks.length === 0) {
          notify("No playable tracks found. Try another search.");
        } else {
          playTracks(tracks, 0);
        }
        return tracks;
      } catch (err) {
        notify(err instanceof Error ? err.message : "Could not load music.");
        return [];
      } finally {
        setLaunching(null);
      }
    },
    [notify, playTracks],
  );

  const stop = useCallback(() => {
    engineRef.current?.stop();
    live.current = { ...live.current, queue: [], index: -1 };
    setQueue([]);
    setIndex(-1);
    setPlaying(false);
    setBuffering(false);
    setPosition(0);
    setDuration(0);
    setExpanded(false);
  }, []);

  const toggle = useCallback(() => {
    const engine = engineRef.current;
    if (!engine || live.current.index < 0) return;
    if (playing) engine.pause();
    else engine.play();
  }, [playing]);

  const next = useCallback(() => advance("skip"), [advance]);

  const previous = useCallback(() => {
    const { queue: q, index: i } = live.current;
    if (q.length === 0) return;
    if (positionRef.current > 3 || i <= 0) {
      engineRef.current?.seek(0);
      return;
    }
    startIndex(i - 1);
  }, [startIndex]);

  const seek = useCallback((seconds: number) => {
    engineRef.current?.seek(seconds);
    positionRef.current = seconds;
    setPosition(seconds);
  }, []);

  const toggleShuffle = useCallback(() => setShuffleOn((v) => !v), []);
  const cycleRepeat = useCallback(
    () => setRepeat((r) => (r === "off" ? "all" : r === "all" ? "one" : "off")),
    [],
  );
  const jumpTo = useCallback((i: number) => startIndex(i), [startIndex]);
  const showVideoAt = useCallback((rect: DOMRect | null) => engineRef.current?.showVideoAt(rect), []);

  // Lock-screen / AirPods / Control Center integration.
  useEffect(() => {
    if (!("mediaSession" in navigator) || !current) return;
    const src = current.thumbnail ?? "/icons/icon-512.png";
    const type = current.thumbnail ? undefined : "image/png";
    const artwork = ["96x96", "128x128", "192x192", "256x256", "384x384", "512x512"].map((sizes) => ({
      src,
      sizes,
      ...(type ? { type } : {}),
    }));
    navigator.mediaSession.metadata = new MediaMetadata({
      title: current.title,
      artist: current.artist || "IronBeat",
      album: "IronBeat",
      artwork,
    });
  }, [current]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    navigator.mediaSession.playbackState = current ? (playing ? "playing" : "paused") : "none";
  }, [playing, current]);

  useEffect(() => {
    if (!("mediaSession" in navigator) || !current || !(duration > 0)) return;
    try {
      navigator.mediaSession.setPositionState({
        duration,
        position: Math.min(position, duration),
        playbackRate: 1,
      });
    } catch {
      /* some browsers reject inconsistent values while a track is loading */
    }
  }, [position, duration, current]);

  useEffect(() => {
    if (!("mediaSession" in navigator)) return;
    const session = navigator.mediaSession;
    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ["play", () => engineRef.current?.play()],
      ["pause", () => engineRef.current?.pause()],
      ["previoustrack", () => previous()],
      ["nexttrack", () => advanceRef.current("skip")],
      ["stop", () => stop()],
      ["seekto", (d) => d.seekTime !== undefined && seek(d.seekTime)],
      ["seekbackward", (d) => seek(Math.max(0, positionRef.current - (d.seekOffset ?? 10)))],
      ["seekforward", (d) => seek(positionRef.current + (d.seekOffset ?? 10))],
    ];
    for (const [action, handler] of handlers) {
      try {
        session.setActionHandler(action, handler);
      } catch {
        /* action unsupported on this browser */
      }
    }
    return () => {
      for (const [action] of handlers) {
        try {
          session.setActionHandler(action, null);
        } catch {
          /* ignore */
        }
      }
    };
  }, [previous, seek, stop]);

  const value = useMemo<PlayerContextValue>(
    () => ({
      current,
      queue,
      index,
      playing,
      buffering,
      position,
      duration,
      shuffleOn,
      repeat,
      expanded,
      launching,
      backgroundSafe,
      setBackgroundSafe,
      setExpanded,
      playTracks,
      launch,
      prime,
      stop,
      toggle,
      next,
      previous,
      seek,
      toggleShuffle,
      cycleRepeat,
      jumpTo,
      showVideoAt,
    }),
    [
      current, queue, index, playing, buffering, position, duration, shuffleOn, repeat, expanded,
      launching, backgroundSafe, setBackgroundSafe, playTracks, launch, prime, stop, toggle, next, previous, seek, toggleShuffle, cycleRepeat,
      jumpTo, showVideoAt,
    ],
  );

  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

