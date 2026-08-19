'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { decodeWaveformPeaks } from './decodeWaveformPeaks';

const BAR_COUNT = 400;
const SEEK_STEP_SEC = 3;
const SPEED_MIN = 0.5;
const SPEED_MAX = 2.0;
const SPEED_STEP = 0.05;

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) seconds = 0;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toFixed(2).padStart(5, '0')}`;
}

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || target.isContentEditable;
}

export function WaveformPlayer({ file }: { file: File }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const [peaks, setPeaks] = useState<number[] | null>(null);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [canvasWidth, setCanvasWidth] = useState(760);

  const objectUrl = useMemo(() => URL.createObjectURL(file), [file]);

  useEffect(() => {
    return () => URL.revokeObjectURL(objectUrl);
  }, [objectUrl]);

  // 波形データの生成
  useEffect(() => {
    let cancelled = false;
    setPeaks(null);
    decodeWaveformPeaks(file, BAR_COUNT).then((result) => {
      if (!cancelled) setPeaks(result);
    });
    return () => {
      cancelled = true;
    };
  }, [file]);

  // キャンバス幅をコンテナに追従させる
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width) setCanvasWidth(Math.floor(width));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !peaks) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const height = canvas.clientHeight;
    canvas.width = canvasWidth * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, canvasWidth, height);

    const barWidth = canvasWidth / peaks.length;
    const centerY = height / 2;
    const progress = duration > 0 ? currentTime / duration : 0;
    const playedBars = Math.floor(progress * peaks.length);

    for (let i = 0; i < peaks.length; i++) {
      const amplitude = Math.max(peaks[i] ?? 0, 0.03);
      const barHeight = amplitude * (height * 0.9);
      const x = i * barWidth;

      ctx.fillStyle = i < playedBars ? '#5bc9a3' : '#4fb3e8';
      ctx.fillRect(
        x,
        centerY - barHeight / 2,
        Math.max(1, barWidth - 1),
        barHeight
      );
    }

    // 再生位置ライン
    const playheadX = progress * canvasWidth;
    ctx.strokeStyle = '#e7ecf5';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, height);
    ctx.stroke();
  }, [peaks, canvasWidth, currentTime, duration]);

  useEffect(() => {
    draw();
  }, [draw]);

  // 再生中は毎フレーム現在時刻を更新して波形の色分けを進める
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

  const seekToFraction = useCallback(
    (fraction: number) => {
      const audio = audioRef.current;
      if (!audio || !duration) return;
      const next = Math.min(Math.max(0, fraction), 1) * duration;
      audio.currentTime = next;
      setCurrentTime(next);
      void audio.play();
      setIsPlaying(true);
    },
    [duration]
  );

  const handleCanvasClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const fraction = (event.clientX - rect.left) / rect.width;
      seekToFraction(fraction);
    },
    [seekToFraction]
  );

  const changeSpeed = useCallback((value: number) => {
    const audio = audioRef.current;
    const clamped = Math.min(SPEED_MAX, Math.max(SPEED_MIN, value));
    if (audio) audio.playbackRate = clamped;
    setPlaybackRate(clamped);
  }, []);

  // キーボードショートカット: Space=再生/停止, ←=3秒戻る, →=3秒進む
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

  return (
    <div className="waveform-player" ref={containerRef}>
      <audio
        ref={audioRef}
        src={objectUrl}
        preload="metadata"
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => {
          if (!isPlaying) setCurrentTime(e.currentTarget.currentTime);
        }}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="waveform-time">
        {formatTime(currentTime)} / {formatTime(duration)}
      </div>

      <canvas
        ref={canvasRef}
        className="waveform-canvas"
        style={{ width: '100%', height: 110 }}
        onClick={handleCanvasClick}
      />
      {!peaks && <div className="waveform-loading">波形を解析中…</div>}

      <button
        type="button"
        className="play-toggle-button"
        onClick={togglePlay}
      >
        {isPlaying ? 'Pause' : 'Play'}
      </button>

      <div className="speed-row">
        <span>Speed: {playbackRate.toFixed(2)}</span>
        <input
          type="range"
          min={SPEED_MIN}
          max={SPEED_MAX}
          step={SPEED_STEP}
          value={playbackRate}
          onChange={(e) => changeSpeed(Number(e.target.value))}
        />
        <button
          type="button"
          className="speed-reset-button"
          onClick={() => changeSpeed(1)}
        >
          1x Speed
        </button>
      </div>

      <div className="seek-row">
        <button type="button" onClick={() => seekBy(-SEEK_STEP_SEC)}>
          ◀ 3秒
        </button>
        <span className="seek-hint">
          Space: 再生/停止　←: 3秒戻る　→: 3秒進む
        </span>
        <button type="button" onClick={() => seekBy(SEEK_STEP_SEC)}>
          3秒 ▶
        </button>
      </div>
    </div>
  );
}
