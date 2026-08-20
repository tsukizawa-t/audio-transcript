import type { TranscribeAudioOutput } from '@/src/application/dto/TranscribeAudioDto';

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
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
          <p className="paragraph-original">{p.originalText}</p>
          <div className="paragraph-divider" />
          <p className="paragraph-translated">{p.translatedText}</p>
        </article>
      ))}
    </section>
  );
}
