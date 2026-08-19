/**
 * 複数のTranscriptSegmentを、無音区間（間隔）に基づきまとめた段落。
 * 表示・翻訳の単位となるドメインエンティティ。
 */
export interface Paragraph {
  /** 1始まりの段落番号（表示順） */
  readonly index: number;
  /** 段落の原文（英語） */
  readonly originalText: string;
  /** 段落の日本語訳。翻訳前は null */
  readonly translatedText: string | null;
  /** 段落開始時刻（秒） */
  readonly startTime: number;
  /** 段落終了時刻（秒） */
  readonly endTime: number;
}

export function withTranslation(
  paragraph: Paragraph,
  translatedText: string
): Paragraph {
  return { ...paragraph, translatedText };
}
