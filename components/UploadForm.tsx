'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { upload } from '@vercel/blob/client';
import type { TranscribeAudioOutput } from '@/src/application/dto/TranscribeAudioDto';
import { TranscriptView } from './TranscriptView';
import { WaveformPlayer } from './audio/WaveformPlayer';
import { useAudioPlayer } from './audio/useAudioPlayer';

// Whisper's own upper limit for a single audio file.
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

type Status = 'idle' | 'uploading' | 'transcribing' | 'error';

export function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<TranscribeAudioOutput | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Shared playback state/controls: both the waveform and the transcript
  // read from and drive this same <audio> element.
  const player = useAudioPlayer();

  const objectUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : null),
    [file]
  );
  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  const pickFile = useCallback((picked: File | null) => {
    setResult(null);
    setErrorMessage(null);
    if (!picked) {
      setFile(null);
      return;
    }
    if (!picked.name.toLowerCase().endsWith('.mp3')) {
      setErrorMessage('Please select a .mp3 file');
      setFile(null);
      return;
    }
    if (picked.size > MAX_FILE_SIZE_BYTES) {
      setErrorMessage(
        `File is too large: ${(picked.size / 1024 / 1024).toFixed(
          1
        )}MB (limit ${(MAX_FILE_SIZE_BYTES / 1024 / 1024).toFixed(0)}MB)`
      );
      setFile(null);
      return;
    }
    setFile(picked);
  }, []);

  const handleDrop = useCallback(
    (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setIsDragging(false);
      const dropped = event.dataTransfer.files?.[0] ?? null;
      pickFile(dropped);
    },
    [pickFile]
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      if (!file) return;

      setStatus('uploading');
      setUploadProgress(0);
      setErrorMessage(null);
      setResult(null);

      try {
        // Upload straight from the browser to Blob storage. The file
        // never passes through our own serverless function, so it is
        // not subject to Vercel's ~4.5MB request body limit.
        const blob = await upload(file.name, file, {
          access: 'public',
          handleUploadUrl: '/api/upload',
          contentType: file.type || 'audio/mpeg',
          onUploadProgress: (event) => {
            setUploadProgress(event.percentage);
          },
        });

        setStatus('transcribing');

        const response = await fetch('/api/transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            blobUrl: blob.url,
            filename: file.name,
            mimeType: file.type || 'audio/mpeg',
          }),
        });

        const body = await response.json();

        if (!response.ok) {
          throw new Error(body?.error ?? 'An unknown error occurred');
        }

        setResult(body as TranscribeAudioOutput);
        setStatus('idle');
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : 'An unknown error occurred'
        );
        setStatus('error');
      }
    },
    [file]
  );

  const isBusy = status === 'uploading' || status === 'transcribing';

  return (
    <>
      <form onSubmit={handleSubmit}>
        <div
          className={`dropzone${isDragging ? ' dragging' : ''}`}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            id="audio-input"
            type="file"
            accept=".mp3,audio/mpeg"
            onChange={(e) => pickFile(e.target.files?.[0] ?? null)}
          />
          <label htmlFor="audio-input">Click to select an MP3 file</label>
          <div>or drag and drop it here</div>
          {file && <div className="file-name">Selected: {file.name}</div>}
        </div>

        {file && objectUrl && (
          <>
            {/* One shared <audio> element, controlled by the `player`
                hook. Hidden because both WaveformPlayer and
                TranscriptView provide their own play/seek UI. */}
            <audio
              ref={player.audioRef}
              src={objectUrl}
              preload="metadata"
              onLoadedMetadata={player.handleLoadedMetadata}
              onTimeUpdate={player.handleTimeUpdate}
              onEnded={player.handleEnded}
              style={{ display: 'none' }}
            />
            <WaveformPlayer
              file={file}
              player={player}
              key={file.name + file.size}
            />
          </>
        )}

        <button
          type="submit"
          className="submit-button"
          disabled={!file || isBusy}
        >
          {status === 'uploading'
            ? `Uploading… ${uploadProgress.toFixed(0)}%`
            : status === 'transcribing'
              ? 'Transcribing…'
              : 'Start Transcription'}
        </button>

        {isBusy && (
          <div className="status-row">
            <span className="spinner" aria-hidden />
            <span>
              {status === 'uploading'
                ? 'Uploading your file directly to storage'
                : 'This can take anywhere from a few seconds to a few minutes, depending on the audio length'}
            </span>
          </div>
        )}

        {errorMessage && <div className="error-box">{errorMessage}</div>}
      </form>

      {result && <TranscriptView result={result} player={player} />}
    </>
  );
}
