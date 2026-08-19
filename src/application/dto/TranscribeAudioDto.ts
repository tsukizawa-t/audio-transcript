export interface TranscribeAudioInput {
  readonly filename: string;
  readonly mimeType: string;
  readonly data: Buffer;
}

export interface ParagraphDto {
  readonly index: number;
  readonly originalText: string;
  readonly translatedText: string;
  readonly startTime: number;
  readonly endTime: number;
}

export interface TranscribeAudioOutput {
  readonly language: string;
  readonly durationSec: number;
  readonly paragraphs: ParagraphDto[];
}
