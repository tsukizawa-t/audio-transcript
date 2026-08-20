/**
 * A word or phrase from a paragraph that is worth memorizing for IELTS
 * Listening study, together with its Japanese meaning and a short usage
 * note (e.g. why it matters, its nuance, or its register).
 */
export interface KeyPhrase {
  /** The exact phrase as it appears in the original (English) text */
  readonly phrase: string;
  /** Japanese meaning of the phrase */
  readonly meaningJa: string;
  /** Short Japanese note on usage, nuance, or IELTS relevance */
  readonly noteJa: string;
}
