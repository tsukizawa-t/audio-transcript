/**
 * Client for the free MyMemory translation API (mymemory.translated.net).
 * No API key or signup is required, and it supports CORS for direct
 * calls from the browser. The free anonymous tier allows roughly 5,000
 * characters per day per IP address, and each single request is capped
 * at around 500 bytes -- so longer paragraphs are split into
 * sentence-sized chunks and translated one at a time, then rejoined.
 */

const MAX_CHUNK_BYTES = 480; // stay safely under MyMemory's ~500-byte cap
const REQUEST_DELAY_MS = 250; // be a polite, non-bursty client

function byteLength(text: string): number {
  return new TextEncoder().encode(text).length;
}

function splitIntoChunks(text: string): string[] {
  if (byteLength(text) <= MAX_CHUNK_BYTES) return [text];

  // Prefer splitting on sentence boundaries so translations stay coherent.
  const sentences = text.match(/[^.!?]+[.!?]*\s*/g) ?? [text];
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    const candidate = current + sentence;
    if (byteLength(candidate) > MAX_CHUNK_BYTES && current) {
      chunks.push(current.trim());
      current = sentence;
    } else {
      current = candidate;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  // A single sentence longer than the limit still needs a hard split.
  return chunks.flatMap((chunk) =>
    byteLength(chunk) <= MAX_CHUNK_BYTES
      ? [chunk]
      : hardSplit(chunk, MAX_CHUNK_BYTES)
  );
}

function hardSplit(text: string, maxBytes: number): string[] {
  const words = text.split(' ');
  const chunks: string[] = [];
  let current = '';

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (byteLength(candidate) > maxBytes && current) {
      chunks.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

async function translateChunk(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  const params = new URLSearchParams({
    q: text,
    langpair: `${sourceLang}|${targetLang}`,
  });

  const response = await fetch(
    `https://api.mymemory.translated.net/get?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error(`MyMemory request failed with status ${response.status}`);
  }

  const data = (await response.json()) as {
    responseStatus?: number | string;
    responseData?: { translatedText?: string };
  };

  const status = Number(data.responseStatus);
  if (status && status !== 200) {
    throw new Error(`MyMemory translation failed (status ${status})`);
  }

  return data.responseData?.translatedText ?? '';
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string
): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return '';

  const chunks = splitIntoChunks(trimmed);
  const translated: string[] = [];

  for (let i = 0; i < chunks.length; i++) {
    translated.push(await translateChunk(chunks[i]!, sourceLang, targetLang));
    if (i < chunks.length - 1) await sleep(REQUEST_DELAY_MS);
  }

  return translated.join(' ');
}
