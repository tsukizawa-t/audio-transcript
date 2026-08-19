/**
 * テキスト翻訳サービスへの抽象境界。
 */
export interface TranslationService {
  /**
   * テキストを指定言語へ翻訳する。
   * @param text 翻訳対象テキスト
   * @param targetLanguage ISO 639-1言語コード（例: "ja"）
   */
  translate(text: string, targetLanguage: string): Promise<string>;
}
