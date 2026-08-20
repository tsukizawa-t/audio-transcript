import type { Paragraph } from '../entities/Paragraph';
import type { TranscriptSegment } from '../entities/TranscriptSegment';

/**
 * Domain service that groups the sequence of speech segments returned by
 * an ASR engine into paragraphs, based on the length of silence gaps
 * (pauses) between them.
 *
 * Rule:
 *  - If the gap between the end of the previous segment and the start of
 *    the next segment is greater than or equal to gapThresholdSec, treat
 *    it as a natural break and start a new paragraph.
 *  - Otherwise, merge the segment into the current paragraph.
 */
export class ParagraphSegmenter {
  constructor(private readonly gapThresholdSec: number) {
    if (gapThresholdSec <= 0) {
      throw new RangeError('gapThresholdSec must be a positive number');
    }
  }

  segment(segments: readonly TranscriptSegment[]): Paragraph[] {
    if (segments.length === 0) {
      return [];
    }

    const paragraphs: Paragraph[] = [];
    let bucket: TranscriptSegment[] = [segments[0] as TranscriptSegment];

    for (let i = 1; i < segments.length; i++) {
      const previous = segments[i - 1] as TranscriptSegment;
      const current = segments[i] as TranscriptSegment;
      const gap = current.start - previous.end;

      if (gap >= this.gapThresholdSec) {
        paragraphs.push(this.buildParagraph(paragraphs.length + 1, bucket));
        bucket = [current];
      } else {
        bucket.push(current);
      }
    }

    paragraphs.push(this.buildParagraph(paragraphs.length + 1, bucket));
    return paragraphs;
  }

  private buildParagraph(
    index: number,
    bucket: readonly TranscriptSegment[]
  ): Paragraph {
    const first = bucket[0] as TranscriptSegment;
    const last = bucket[bucket.length - 1] as TranscriptSegment;
    const originalText = bucket
      .map((s) => s.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    return {
      index,
      originalText,
      translatedText: null,
      keyPhrases: [],
      startTime: first.start,
      endTime: last.end,
    };
  }
}
