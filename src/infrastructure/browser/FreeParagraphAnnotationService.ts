import type {
  ParagraphAnnotation,
  ParagraphAnnotationService,
} from '../../domain/ports/ParagraphAnnotationService';
import { ParagraphAnnotationFailedError } from '../../domain/errors';
import { translateText } from './MyMemoryTranslationClient';
import { matchKeyPhrases } from '../dictionary/matchKeyPhrases';

/**
 * ParagraphAnnotationService implementation with zero running cost:
 * translation comes from the free MyMemory API, and IELTS key phrases
 * come from matching against a static curated dictionary rather than
 * an AI model. No API key, no per-request charge.
 */
export class FreeParagraphAnnotationService implements ParagraphAnnotationService {
  async annotate(text: string): Promise<ParagraphAnnotation> {
    if (!text.trim()) {
      return { translatedText: '', keyPhrases: [] };
    }

    try {
      const [translatedText, keyPhrases] = await Promise.all([
        translateText(text, 'en', 'ja'),
        Promise.resolve(matchKeyPhrases(text)),
      ]);

      return { translatedText, keyPhrases };
    } catch (cause) {
      throw new ParagraphAnnotationFailedError(cause);
    }
  }
}
