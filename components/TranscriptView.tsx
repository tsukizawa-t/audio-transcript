import type {
  KeyPhraseDto,
  TranscribeAudioOutput,
} from '@/src/application/dto/TranscribeAudioDto';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Splits the original paragraph text into plain and highlighted chunks,
 * so IELTS key phrases can be spotted at a glance while listening along
 * with the script. Longer phrases are matched first so a short phrase
 * doesn't "steal" part of a longer one it's contained in.
 */
function renderHighlightedText(text: string, keyPhrases: KeyPhraseDto[]) {
  if (keyPhrases.length === 0) return text;

  const uniquePhrases = Array.from(
    new Set(keyPhrases.map((k) => k.phrase).filter(Boolean))
  ).sort((a, b) => b.length - a.length);

  if (uniquePhrases.length === 0) return text;

  const pattern = new RegExp(
    `(${uniquePhrases.map(escapeRegExp).join('|')})`,
    'gi'
  );
  const lowerPhraseSet = new Set(uniquePhrases.map((p) => p.toLowerCase()));

  return text.split(pattern).map((chunk, i) =>
    lowerPhraseSet.has(chunk.toLowerCase()) ? (
      <mark className="key-phrase-highlight" key={i}>
        {chunk}
      </mark>
    ) : (
      <span key={i}>{chunk}</span>
    )
  );
}

export function TranscriptView({ result }: { result: TranscribeAudioOutput }) {
  return (
    <section className="result">
      <div className="result-meta">
        Detected language: {result.language} / Duration:{' '}
        {formatTime(result.durationSec)} / Paragraphs:{' '}
        {result.paragraphs.length}
      </div>

      {result.paragraphs.map((p) => (
        <article key={p.index} className="paragraph">
          <div className="paragraph-index">
            #{p.index} ({formatTime(p.startTime)} – {formatTime(p.endTime)})
          </div>

          <p className="paragraph-original">
            {renderHighlightedText(p.originalText, p.keyPhrases)}
          </p>

          <div className="paragraph-divider" />

          <p className="paragraph-translated">{p.translatedText}</p>

          {p.keyPhrases.length > 0 && (
            <div className="key-phrases">
              <div className="key-phrases-title">
                IELTS Key Phrases
              </div>
              <ul className="key-phrases-list">
                {p.keyPhrases.map((kp, i) => (
                  <li className="key-phrase-item" key={i}>
                    <span className="key-phrase-term">{kp.phrase}</span>
                    <span className="key-phrase-meaning">{kp.meaningJa}</span>
                    <span className="key-phrase-note">{kp.noteJa}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </article>
      ))}
    </section>
  );
}
