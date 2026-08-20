/**
 * Abstract boundary to a text translation service.
 */
export interface TranslationService {
  /**
   * Translate text into the target language.
   * @param text Text to translate
   * @param targetLanguage ISO 639-1 language code (e.g. "ja")
   */
  translate(text: string, targetLanguage: string): Promise<string>;
}
