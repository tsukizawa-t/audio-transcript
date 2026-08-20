'use client';

import { useCallback, useRef, useState } from 'react';
import type { TranscribeAudioOutput } from '@/src/application/dto/TranscribeAudioDto';
import { TranscriptView } from './TranscriptView';
import { WaveformPlayer } from './audio/WaveformPlayer';

type Status = 'idle' | 'uploading' | 'error';

export function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<TranscribeAudioOutput | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
      setErrorMessage(null);
      setResult(null);

      try {
        const formData = new FormData();
        formData.append('audio', file);

        const response = await fetch('/api/transcribe', {
          method: 'POST',
          body: formData,
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

  const isUploading = status === 'uploading';

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

        {file && <WaveformPlayer file={file} key={file.name + file.size} />}

        <button
          type="submit"
          className="submit-button"
          disabled={!file || isUploading}
        >
          {isUploading ? 'Transcribing…' : 'Start Transcription'}
        </button>

        {isUploading && (
          <div className="status-row">
            <span className="spinner" aria-hidden />
            <span>
              This can take anywhere from a few seconds to a few minutes, depending on the audio length
            </span>
          </div>
        )}

        {errorMessage && <div className="error-box">{errorMessage}</div>}
      </form>

      {result && <TranscriptView result={result} />}
    </>
  );
}
