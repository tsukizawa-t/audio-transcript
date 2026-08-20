'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

const SEEK_STEP_SEC = 3;
const SPEED_MIN = 0.5;
const SPEED_MAX = 2.0;

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
}

export interface AudioPlayerApi {
  audioRef: React.RefObject<HTMLAudioElement>;
  duration: number;
  currentTime: number;
  isPlaying: boolean;
  playbackRate: number;
  togglePlay: () => void;
  seekBy: (deltaSec: number) => void;
  /** Jump to an absolute time (seconds) and, by default, start playing. */
  seekToTime: (seconds: number, autoplay?: boolean) => void;
  /** Jump to a fraction (0-1) of the total duration and start playing. */
  seekToFraction: (fraction: number) => void;
  changeSpeed: (value: number) => void;
  handleLoadedMetadata: (event: React.SyntheticEvent<HTMLAudioElement>) => void;
  handleTimeUpdate: (event: React.SyntheticEvent<HTMLAudioElement>) => void;
  handleEnded: () => void;
}

/**
 * Owns all <audio> playback state and controls in one place, so the
 * waveform view and the transcript view can both drive -- and stay in
 * sync with -- the same underlying audio element, instead of each
 * keeping independent state.
 */
export function useAudioPlayer(): AudioPlayerApi {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  // While playing, poll currentTime every animation frame so the
  // waveform coloring and the active-paragraph highlight stay smooth.
  useEffect(() => {
    if (!isPlaying) {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      return;
    }
    const tick = () => {
      const audio = audioRef.current;
      if (audio) setCurrentTime(audio.currentTime);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isPlaying]);

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      void audio.play();
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, []);

  const seekBy = useCallback((deltaSec: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const next = Math.min(
      Math.max(0, audio.currentTime + deltaSec),
      audio.duration || 0
    );
    audio.currentTime = next;
    setCurrentTime(next);
  }, []);

  const seekToTime = useCallback((seconds: number, autoplay = true) => {
    const audio = audioRef.current;
    if (!audio) return;
    const clamped = Math.min(Math.max(0, seconds), audio.duration || seconds);
    audio.currentTime = clamped;
    setCurrentTime(clamped);
    if (autoplay) {
      void audio.play();
      setIsPlaying(true);
    }
  }, []);

  const seekToFraction = useCallback(
    (fraction: number) => {
      const audio = audioRef.current;
      if (!audio || !duration) return;
      seekToTime(Math.min(Math.max(0, fraction), 1) * duration, true);
    },
    [duration, seekToTime]
  );

  const changeSpeed = useCallback((value: number) => {
    const audio = audioRef.current;
    const clamped = Math.min(SPEED_MAX, Math.max(SPEED_MIN, value));
    if (audio) audio.playbackRate = clamped;
    setPlaybackRate(clamped);
  }, []);

  const handleLoadedMetadata = useCallback(
    (event: React.SyntheticEvent<HTMLAudioElement>) => {
      setDuration(event.currentTarget.duration);
    },
    []
  );

  const handleTimeUpdate = useCallback(
    (event: React.SyntheticEvent<HTMLAudioElement>) => {
      setCurrentTime(event.currentTarget.currentTime);
    },
    []
  );

  const handleEnded = useCallback(() => setIsPlaying(false), []);

  // Keyboard shortcuts: Space = play/pause, ArrowLeft = back 3s, ArrowRight = forward 3s
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;

      if (event.code === 'Space') {
        event.preventDefault();
        togglePlay();
      } else if (event.code === 'ArrowLeft') {
        event.preventDefault();
        seekBy(-SEEK_STEP_SEC);
      } else if (event.code === 'ArrowRight') {
        event.preventDefault();
        seekBy(SEEK_STEP_SEC);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, seekBy]);

  return {
    audioRef,
    duration,
    currentTime,
    isPlaying,
    playbackRate,
    togglePlay,
    seekBy,
    seekToTime,
    seekToFraction,
    changeSpeed,
    handleLoadedMetadata,
    handleTimeUpdate,
    handleEnded,
  };
}
