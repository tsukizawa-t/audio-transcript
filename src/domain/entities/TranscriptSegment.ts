/**
 * The smallest unit of a spoken segment returned by the speech recognition
 * engine. This is a domain value object that does not depend on any
 * specific ASR provider's output format.
 */
export interface TranscriptSegment {
  /** Text spoken in this segment (source language, expected to be English) */
  readonly text: string;
  /** Start time within the audio (seconds) */
  readonly start: number;
  /** End time within the audio (seconds) */
  readonly end: number;
}

export function createTranscriptSegment(
  text: string,
  start: number,
  end: number
): TranscriptSegment {
  const trimmed = text.trim();
  if (start < 0 || end < start) {
    throw new RangeError(`Invalid segment timing: start=${start}, end=${end}`);
  }
  return { text: trimmed, start, end };
}
