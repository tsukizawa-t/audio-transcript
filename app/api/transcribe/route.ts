import { NextRequest, NextResponse } from 'next/server';
import { createTranscribeAudioUseCase } from '@/src/infrastructure/config/container';
import { DomainError } from '@/src/domain/errors';

// Explicitly use the Node.js runtime (Buffer and the openai SDK are not
// available on the Edge runtime).
export const runtime = 'nodejs';
// Calling the Whisper API and translating multiple paragraphs can take a
// while, so allow extra time.
export const maxDuration = 60;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const file = formData.get('audio');

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'The "audio" field must contain a file' },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const data = Buffer.from(arrayBuffer);

    const useCase = createTranscribeAudioUseCase();
    const result = await useCase.execute({
      filename: file.name,
      mimeType: file.type,
      data,
    });

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return handleError(error);
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
