import type { KeyPhrase } from './KeyPhrase';

/**
 * A paragraph made up of one or more TranscriptSegments, grouped by
 * silence gaps in the audio. This is the unit used for display,
 * translation, and IELTS key-phrase study.
 */
export interface Paragraph {
  /** 1-based paragraph number (display order) */
  readonly index: number;
  /** Original text of the paragraph (source language, English) */
  readonly originalText: string;
  /** Japanese translation. null before annotation has been performed */
  readonly translatedText: string | null;
  /** IELTS-relevant words/phrases found in this paragraph, with Japanese
   *  meanings and notes. Empty until annotation has been performed. */
  readonly keyPhrases: KeyPhrase[];
  /** Paragraph start time (seconds) */
  readonly startTime: number;
  /** Paragraph end time (seconds) */
  readonly endTime: number;
}

export function withAnnotation(
  paragraph: Paragraph,
  translatedText: string,
  keyPhrases: KeyPhrase[]
): Paragraph {
  return { ...paragraph, translatedText, keyPhrases };
}
