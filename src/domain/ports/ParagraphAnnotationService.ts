import type { KeyPhrase } from '../entities/KeyPhrase';

export interface ParagraphAnnotation {
  readonly translatedText: string;
  readonly keyPhrases: KeyPhrase[];
}

/**
 * Abstract boundary to a service that, given a paragraph of English text,
 * produces both a Japanese translation and a list of IELTS-relevant key
 * phrases (with Japanese meanings/notes). Combining these two concerns
 * into a single port lets an implementation answer both from one model
 * call with full paragraph context, rather than issuing two separate
 * calls.
 */
export interface ParagraphAnnotationService {
  annotate(text: string): Promise<ParagraphAnnotation>;
}
