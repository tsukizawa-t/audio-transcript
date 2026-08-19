import type { Paragraph } from '../entities/Paragraph';
import type { TranscriptSegment } from '../entities/TranscriptSegment';

/**
 * ASRが返す発話セグメント列を、無音区間（ポーズ）の長さに基づいて
 * 段落（Paragraph）へグルーピングするドメインサービス。
 *
 * ルール:
 *  - 直前セグメントの終了時刻から次セグメントの開始時刻までの間隔が
 *    gapThresholdSec 以上あれば、話の区切りとみなし新しい段落を開始する。
 *  - それ未満の間隔は同一段落として連結する。
 */
export class ParagraphSegmenter {
  constructor(private readonly gapThresholdSec: number) {
    if (gapThresholdSec <= 0) {
      throw new RangeError('gapThresholdSecは正の数である必要があります');
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
      startTime: first.start,
      endTime: last.end,
    };
  }
}
