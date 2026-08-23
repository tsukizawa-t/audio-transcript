import type { AudioFile } from '../../domain/entities/AudioFile';
import type { RawTranscription } from '../../domain/entities/TranscriptionResult';
import { createTranscriptSegment } from '../../domain/entities/TranscriptSegment';
import type { TranscriptionService } from '../../domain/ports/TranscriptionService';
import { TranscriptionFailedError } from '../../domain/errors';

interface WhisperChunk {
  text: string;
  timestamp: [number, number | null];
}

interface WhisperOutput {
  text: string;
  chunks?: WhisperChunk[];
}

interface ModelProgressEvent {
  status: string;
  file?: string;
  progress?: number;
}

type WorkerMessage =
  | { type: 'model-progress'; event: ModelProgressEvent }
  | { type: 'transcribing-started' }
  | { type: 'result'; output: WhisperOutput }
  | { type: 'error'; message: string };

// The worker (and the model it loads) is expensive to spin up, so it's
// created once and reused for every transcription in this browser tab.
let workerInstance: Worker | null = null;

function getWorker(): Worker {
  if (!workerInstance) {
    workerInstance = new Worker(
      new URL('./transcription.worker.ts', import.meta.url),
      { type: 'module' }
    );
  }
  return workerInstance;
}

/**
 * TranscriptionService implementation that runs OpenAI's Whisper model
 * entirely in the browser, inside a dedicated Web Worker, via
 * @huggingface/transformers (WASM/ONNX Runtime Web). No audio ever
 * leaves the user's device and there is no API cost. The model is
 * downloaded from the Hugging Face CDN once and cached by the browser
 * for subsequent uses.
 */
export class TransformersJsTranscriptionService implements TranscriptionService {
  constructor(
    private readonly onModelLoadProgress?: (percent: number) => void
  ) {}

  async transcribe(audio: AudioFile): Promise<RawTranscription> {
    const objectUrl = URL.createObjectURL(audio.data);
    const worker = getWorker();

    const seenFiles = new Set<string>();
    let loadedFiles = 0;
    let totalFiles = 0;

    try {
      const output = await new Promise<WhisperOutput>((resolve, reject) => {
        const handleMessage = (event: MessageEvent<WorkerMessage>) => {
          const data = event.data;

          if (data.type === 'model-progress') {
            const { status, file } = data.event;
            if (this.onModelLoadProgress && file) {
              if (status === 'initiate' && !seenFiles.has(file)) {
                seenFiles.add(file);
                totalFiles += 1;
              } else if (status === 'done') {
                loadedFiles += 1;
                const percent =
                  totalFiles > 0
                    ? Math.round((loadedFiles / totalFiles) * 100)
                    : 0;
                this.onModelLoadProgress(percent);
              }
            }
          } else if (data.type === 'result') {
            cleanup();
            resolve(data.output);
          } else if (data.type === 'error') {
            cleanup();
            reject(new Error(data.message));
          }
        };

        const handleError = (event: ErrorEvent) => {
          cleanup();
          reject(new Error(event.message || 'Worker error'));
        };

        const cleanup = () => {
          worker.removeEventListener('message', handleMessage);
          worker.removeEventListener('error', handleError);
        };

        worker.addEventListener('message', handleMessage);
        worker.addEventListener('error', handleError);
        worker.postMessage({ type: 'transcribe', audioUrl: objectUrl });
      });

      const chunks = output.chunks ?? [];
      const segments = chunks
        .filter((c) => c.text.trim().length > 0)
        .map((c) =>
          createTranscriptSegment(
            c.text,
            c.timestamp[0] ?? 0,
            c.timestamp[1] ?? c.timestamp[0] ?? 0
          )
        );

      const durationSec =
        segments.length > 0 ? segments[segments.length - 1]!.end : 0;

      return {
        language: 'en',
        durationSec,
        segments,
      };
    } catch (cause) {
      throw new TranscriptionFailedError(cause);
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }
}
