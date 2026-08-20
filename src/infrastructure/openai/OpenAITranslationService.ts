import OpenAI from 'openai';
import type { TranslationService } from '../../domain/ports/TranslationService';
import { TranslationFailedError } from '../../domain/errors';

const LANGUAGE_NAMES: Record<string, string> = {
  ja: 'Japanese',
  en: 'English',
};

/**
 * TranslationService implementation backed by the OpenAI Chat
 * Completions API. Satisfies the contract defined in
 * domain/ports/TranslationService.
 */
export class OpenAITranslationService implements TranslationService {
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(apiKey: string, model = 'gpt-4o-mini') {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async translate(text: string, targetLanguage: string): Promise<string> {
    if (!text.trim()) return '';

    const targetLanguageName =
      LANGUAGE_NAMES[targetLanguage] ?? targetLanguage;

    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        temperature: 0.2,
        messages: [
          {
            role: 'system',
            content:
              `You are a professional translator. Translate the given text into natural ${targetLanguageName}. ` +
              'Output only the translation, with no preamble, explanation, or quotation marks.',
          },
          { role: 'user', content: text },
        ],
      });

      const translated = completion.choices[0]?.message?.content?.trim();
      return translated ?? '';
    } catch (cause) {
      throw new TranslationFailedError(cause);
    }
  }
}
