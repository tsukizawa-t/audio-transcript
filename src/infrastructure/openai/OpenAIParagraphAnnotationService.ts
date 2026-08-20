import OpenAI from 'openai';
import type { KeyPhrase } from '../../domain/entities/KeyPhrase';
import type {
  ParagraphAnnotation,
  ParagraphAnnotationService,
} from '../../domain/ports/ParagraphAnnotationService';
import { ParagraphAnnotationFailedError } from '../../domain/errors';

const SYSTEM_PROMPT = `You are an expert IELTS Listening tutor helping a Japanese-speaking \
learner who is preparing for IELTS Listening band 7.0.

You will be given one paragraph of an English audio transcript. Do two things:

1. Translate the paragraph into natural, fluent Japanese.
2. Identify words or phrases in the paragraph that are genuinely valuable for an \
IELTS Listening 7.0 candidate to know: collocations, phrasal verbs, academic or \
formal vocabulary, idiomatic expressions, and signposting/linking language \
(e.g. "on the other hand", "as a result") that IELTS listening passages commonly \
use to paraphrase or signal structure. Only include items that are actually useful \
to memorize — do not force a fixed number, and return an empty list if nothing in \
the paragraph is notable. Each phrase must be copied EXACTLY as it appears in the \
original text (same casing, same wording) so it can be located and highlighted in \
the source. For each phrase, give a concise Japanese meaning and a short Japanese \
note (usage, nuance, or why it matters for IELTS listening), each around 15-40 \
Japanese characters.

Respond with ONLY a single JSON object, no markdown fences, no commentary, matching \
exactly this shape:
{
  "translatedText": "...",
  "keyPhrases": [
    { "phrase": "...", "meaningJa": "...", "noteJa": "..." }
  ]
}`;

interface RawAnnotationResponse {
  translatedText?: string;
  keyPhrases?: Array<{
    phrase?: string;
    meaningJa?: string;
    noteJa?: string;
  }>;
}

/**
 * ParagraphAnnotationService implementation backed by the OpenAI Chat
 * Completions API, using JSON mode to get both a translation and a list
 * of IELTS-relevant key phrases from a single model call.
 */
export class OpenAIParagraphAnnotationService
  implements ParagraphAnnotationService
{
  private readonly client: OpenAI;
  private readonly model: string;

  constructor(apiKey: string, model = 'gpt-4o-mini') {
    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  async annotate(text: string): Promise<ParagraphAnnotation> {
    if (!text.trim()) {
      return { translatedText: '', keyPhrases: [] };
    }

    try {
      const completion = await this.client.chat.completions.create({
        model: this.model,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: text },
        ],
      });

      const content = completion.choices[0]?.message?.content ?? '{}';
      const parsed = JSON.parse(content) as RawAnnotationResponse;

      const keyPhrases: KeyPhrase[] = (parsed.keyPhrases ?? [])
        .filter(
          (item): item is Required<typeof item> =>
            typeof item.phrase === 'string' &&
            item.phrase.trim().length > 0 &&
            typeof item.meaningJa === 'string' &&
            typeof item.noteJa === 'string'
        )
        .map((item) => ({
          phrase: item.phrase.trim(),
          meaningJa: item.meaningJa.trim(),
          noteJa: item.noteJa.trim(),
        }));

      return {
        translatedText: (parsed.translatedText ?? '').trim(),
        keyPhrases,
      };
    } catch (cause) {
      throw new ParagraphAnnotationFailedError(cause);
    }
  }
}
