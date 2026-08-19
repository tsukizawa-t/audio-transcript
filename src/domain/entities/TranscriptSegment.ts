/**
 * 音声認識エンジンが返す最小単位の発話区間。
 * Whisper等のASRサービスの出力形式に依存しない、ドメイン内の値オブジェクト。
 */
export interface TranscriptSegment {
  /** セグメント内のテキスト（原文・英語想定） */
  readonly text: string;
  /** 音声内の開始時刻（秒） */
  readonly start: number;
  /** 音声内の終了時刻（秒） */
  readonly end: number;
}

export function createTranscriptSegment(
  text: string,
  start: number,
  end: number
): TranscriptSegment {
  const trimmed = text.trim();
  if (start < 0 || end < start) {
    throw new RangeError(
      `不正なセグメント時間です: start=${start}, end=${end}`
    );
  }
  return { text: trimmed, start, end };
}
