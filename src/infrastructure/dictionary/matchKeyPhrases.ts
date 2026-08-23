import type { KeyPhrase } from '../../domain/entities/KeyPhrase';
import { IELTS_KEY_PHRASES } from './ieltsKeyPhrases';

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Scans a paragraph of text for any phrases in the IELTS key-phrase
 * dictionary and returns the ones that actually appear, matched
 * case-insensitively on word boundaries. Longer phrases are checked
 * first so that, e.g., "in the meantime" isn't shadowed by a shorter
 * unrelated entry.
 */
export function matchKeyPhrases(text: string): KeyPhrase[] {
  const sorted = [...IELTS_KEY_PHRASES].sort(
    (a, b) => b.phrase.length - a.phrase.length
  );

  const matches: KeyPhrase[] = [];
  const consumedRanges: Array<[number, number]> = [];

  for (const entry of sorted) {
    const pattern = new RegExp(`\\b${escapeRegExp(entry.phrase)}\\b`, 'i');
    const match = pattern.exec(text);
    if (!match) continue;

    const start = match.index;
    const end = start + match[0].length;
    const overlapsExisting = consumedRanges.some(
      ([s, e]) => start < e && end > s
    );
    if (overlapsExisting) continue;

    consumedRanges.push([start, end]);
    matches.push(entry);
  }

  // Restore a stable, left-to-right reading order for display.
  return matches.sort((a, b) => {
    const aIndex = text.toLowerCase().indexOf(a.phrase.toLowerCase());
    const bIndex = text.toLowerCase().indexOf(b.phrase.toLowerCase());
    return aIndex - bIndex;
  });
}
