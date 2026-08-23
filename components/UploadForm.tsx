'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { TranscribeAudioOutput } from '@/src/application/dto/TranscribeAudioDto';
import { createTranscribeAudioUseCase } from '@/src/infrastructure/config/clientContainer';
import { TranscriptView } from './TranscriptView';
import { WaveformPlayer } from './audio/WaveformPlayer';
import { useAudioPlayer } from './audio/useAudioPlayer';

// A generous cap on file size for in-browser processing; the actual
// Whisper model itself has no hard limit, but very long files take a
// long time to transcribe on typical hardware.
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024;

type Status =
  | 'idle'
  | 'loading-model'
  | 'transcribing'
  | 'annotating'
  | 'error';

export function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>('idle');
  const [modelLoadPercent, setModelLoadPercent] = useState(0);
  const [annotateProgress, setAnnotateProgress] = useState({
    current: 0,
    total: 0,
  });
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

      setStatus('loading-model');
      setModelLoadPercent(0);
      setAnnotateProgress({ current: 0, total: 0 });
      setErrorMessage(null);
      setResult(null);

      try {
        // Everything below runs entirely in this browser tab: speech
        // recognition, translation, and IELTS phrase matching. Nothing
        // is uploaded anywhere.
        const useCase = createTranscribeAudioUseCase((percent) => {
          setModelLoadPercent(percent);
        });

        const output = await useCase.execute(
          { filename: file.name, mimeType: file.type || 'audio/mpeg', data: file },
          (progress) => {
            if (progress.stage === 'transcribing') {
              setStatus('transcribing');
            } else if (progress.stage === 'annotating') {
              setStatus('annotating');
              setAnnotateProgress({
                current: progress.current,
                total: progress.total,
              });
            }
          }
        );

        setResult(output);
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

  const isBusy =
    status === 'loading-model' ||
    status === 'transcribing' ||
    status === 'annotating';

  const busyLabel =
    status === 'loading-model'
      ? modelLoadPercent > 0
        ? `Loading speech model… ${modelLoadPercent}%`
        : 'Loading speech model…'
      : status === 'transcribing'
        ? 'Transcribing…'
        : status === 'annotating'
          ? `Translating paragraph ${annotateProgress.current}/${annotateProgress.total}…`
          : 'Start Transcription';

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
          {busyLabel}
        </button>

        {isBusy && (
          <div className="status-row">
            <span className="spinner" aria-hidden />
            <span>
              {status === 'loading-model'
                ? 'First use downloads a speech-recognition model to your browser (cached afterwards, no cost)'
                : status === 'transcribing'
                  ? 'Running speech recognition locally in your browser — this can take a while for longer files'
                  : 'Translating each paragraph and checking it against the IELTS phrase list'}
            </span>
          </div>
        )}

        {errorMessage && <div className="error-box">{errorMessage}</div>}
      </form>

      {result && <TranscriptView result={result} player={player} />}
    </>
  );
}
