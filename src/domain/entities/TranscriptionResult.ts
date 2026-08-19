import type { Paragraph } from './Paragraph';

/**
 * 1つの音声ファイルに対する最終的な文字起こし成果物。
 */
export interface TranscriptionResult {
  /** 検出された音声の言語コード（例: "en"） */
  readonly language: string;
  /** 音声の長さ（秒） */
  readonly durationSec: number;
  /** 段落分けされたテキスト（原文＋日本語訳） */
  readonly paragraphs: Paragraph[];
}

/**
 * ASRサービスから取得する、翻訳・段落分け前の生の文字起こし結果。
 */
export interface RawTranscription {
  readonly language: string;
  readonly durationSec: number;
  readonly segments: import('./TranscriptSegment').TranscriptSegment[];
}
