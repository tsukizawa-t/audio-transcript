import OpenAI from 'openai';
import type { TranslationService } from '../../domain/ports/TranslationService';
import { TranslationFailedError } from '../../domain/errors';

const LANGUAGE_NAMES: Record<string, string> = {
  ja: '日本語',
  en: '英語',
};

/**
 * OpenAI Chat Completions APIを用いたTranslationServiceの実装。
 * domain/ports/TranslationService の契約を満たす。
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
              `あなたはプロの翻訳者です。与えられたテキストを自然な${targetLanguageName}に翻訳してください。` +
              '訳文のみを出力し、説明や前置き、引用符は一切付けないでください。',
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
