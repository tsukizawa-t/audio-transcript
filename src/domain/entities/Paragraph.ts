/**
 * A paragraph made up of one or more TranscriptSegments, grouped by
 * silence gaps in the audio. This is the unit used for display and
 * translation.
 */
export interface Paragraph {
  /** 1-based paragraph number (display order) */
  readonly index: number;
  /** Original text of the paragraph (source language, English) */
  readonly originalText: string;
  /** Japanese translation. null before translation has been performed */
  readonly translatedText: string | null;
  /** Paragraph start time (seconds) */
  readonly startTime: number;
  /** Paragraph end time (seconds) */
  readonly endTime: number;
}

export function withTranslation(
  paragraph: Paragraph,
  translatedText: string
): Paragraph {
  return { ...paragraph, translatedText };
}
