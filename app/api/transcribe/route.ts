import { NextRequest, NextResponse } from 'next/server';
import { del } from '@vercel/blob';
import { createTranscribeAudioUseCase } from '@/src/infrastructure/config/container';
import { DomainError } from '@/src/domain/errors';

// Explicitly use the Node.js runtime (Buffer and the openai SDK are not
// available on the Edge runtime).
export const runtime = 'nodejs';
// Calling the Whisper API and translating multiple paragraphs can take a
// while, so allow extra time.
export const maxDuration = 60;

interface TranscribeRequestBody {
  blobUrl: string;
  filename: string;
  mimeType: string;
}

function isTranscribeRequestBody(
  value: unknown
): value is TranscribeRequestBody {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Record<string, unknown>).blobUrl === 'string' &&
    typeof (value as Record<string, unknown>).filename === 'string'
  );
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  let blobUrl: string | null = null;

  try {
    const body: unknown = await request.json();

    if (!isTranscribeRequestBody(body)) {
      return NextResponse.json(
        { error: 'Request body must include blobUrl and filename' },
        { status: 400 }
      );
    }

    blobUrl = body.blobUrl;

    // The file was uploaded directly from the browser to Blob storage
    // (see app/api/upload/route.ts), bypassing this function's request
    // body limit entirely. Fetch it here, server-side, before handing
    // it to the transcription use case.
    const audioResponse = await fetch(blobUrl);
    if (!audioResponse.ok) {
      return NextResponse.json(
        { error: 'Could not fetch the uploaded audio file' },
        { status: 502 }
      );
    }

    const arrayBuffer = await audioResponse.arrayBuffer();
    const data = Buffer.from(arrayBuffer);

    const useCase = createTranscribeAudioUseCase();
    const result = await useCase.execute({
      filename: body.filename,
      mimeType: body.mimeType || 'audio/mpeg',
      data,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return handleError(error);
  } finally {
    // Clean up the temporary blob regardless of success or failure; it
    // is only needed for the duration of this request.
    if (blobUrl) {
      void del(blobUrl).catch(() => {
        // Deletion failures are non-fatal; ignore.
      });
    }
  }
}

function handleError(error: unknown): NextResponse {
  if (error instanceof DomainError) {
    // Domain rule violations (unsupported file type, size limit, etc.)
    // are client-caused errors.
    return NextResponse.json({ error: error.message }, { status: 422 });
  }

  console.error('[POST /api/transcribe] unexpected error:', error);
  return NextResponse.json(
    { error: 'An internal server error occurred' },
    { status: 500 }
  );
}
