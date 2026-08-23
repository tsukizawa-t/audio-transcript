export interface TranscribeAudioInput {
  readonly filename: string;
  readonly mimeType: string;
  readonly data: Blob;
}

export interface KeyPhraseDto {
  readonly phrase: string;
  readonly meaningJa: string;
  readonly noteJa: string;
}

export interface ParagraphDto {
  readonly index: number;
  readonly originalText: string;
  readonly translatedText: string;
  readonly keyPhrases: KeyPhraseDto[];
  readonly startTime: number;
  readonly endTime: number;
}

export interface TranscribeAudioOutput {
  readonly language: string;
  readonly durationSec: number;
  readonly paragraphs: ParagraphDto[];
}

/** Progress events the use case reports so the UI can show what's happening. */
export type TranscribeAudioProgress =
  | { stage: 'loading-model'; percent: number }
  | { stage: 'transcribing' }
  | { stage: 'annotating'; current: number; total: number };

export type TranscribeAudioProgressCallback = (
  progress: TranscribeAudioProgress
) => void;
