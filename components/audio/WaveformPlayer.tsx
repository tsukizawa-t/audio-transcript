'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { decodeWaveformPeaks } from './decodeWaveformPeaks';
import type { AudioPlayerApi } from './useAudioPlayer';

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

/**
 * Renders the waveform canvas and playback controls. All actual audio
 * state lives in the shared `player` (see useAudioPlayer), so this
 * component stays in sync with whatever else is driving playback (e.g.
 * clicking a paragraph in the transcript).
 */
export function WaveformPlayer({
  file,
  player,
}: {
  file: File;
  player: AudioPlayerApi;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [peaks, setPeaks] = useState<number[] | null>(null);
  const [canvasWidth, setCanvasWidth] = useState(760);

  const {
    duration,
    currentTime,
    isPlaying,
    playbackRate,
    togglePlay,
    seekBy,
    seekToFraction,
    changeSpeed,
  } = player;

  // Generate waveform data
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

  // Keep the canvas width in sync with its container
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

    // Playhead line
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

  const handleCanvasClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const rect = event.currentTarget.getBoundingClientRect();
      const fraction = (event.clientX - rect.left) / rect.width;
      seekToFraction(fraction);
    },
    [seekToFraction]
  );

  return (
    <div className="waveform-player" ref={containerRef}>
      <div className="waveform-time">
        {formatTime(currentTime)} / {formatTime(duration)}
      </div>

      <canvas
        ref={canvasRef}
        className="waveform-canvas"
        style={{ width: '100%', height: 110 }}
        onClick={handleCanvasClick}
      />
      {!peaks && <div className="waveform-loading">Analyzing waveform…</div>}

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
          ◀ 3s
        </button>
        <span className="seek-hint">
          Space: play/pause &nbsp; ←: back 3s &nbsp; →: forward 3s
        </span>
        <button type="button" onClick={() => seekBy(SEEK_STEP_SEC)}>
          3s ▶
        </button>
      </div>
    </div>
  );
}
