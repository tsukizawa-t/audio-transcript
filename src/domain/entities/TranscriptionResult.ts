import type { Paragraph } from './Paragraph';

/**
 * The final transcription output produced for a single audio file.
 */
export interface TranscriptionResult {
  /** Detected language code of the audio (e.g. "en") */
  readonly language: string;
  /** Audio duration (seconds) */
  readonly durationSec: number;
  /** Paragraphs with original text and translation */
  readonly paragraphs: Paragraph[];
}

/**
 * Raw transcription result returned by the ASR service, before
 * translation and paragraph segmentation have been applied.
 */
export interface RawTranscription {
  readonly language: string;
  readonly durationSec: number;
  readonly segments: import('./TranscriptSegment').TranscriptSegment[];
}
