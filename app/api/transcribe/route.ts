import { NextRequest, NextResponse } from 'next/server';
import { createTranscribeAudioUseCase } from '@/src/infrastructure/config/container';
import { DomainError } from '@/src/domain/errors';

// Node.jsランタイムを明示（Bufferやopenai SDKの利用のためEdgeでは不可）
export const runtime = 'nodejs';
// Whisper API呼び出し＋複数段落の翻訳は時間がかかるため長めに確保
export const maxDuration = 60;

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const formData = await request.formData();
    const file = formData.get('audio');

    if (!(file instanceof File)) {
      return NextResponse.json(
        { error: 'audioフィールドにファイルが含まれていません' },
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
    // ドメインルール違反（不正なファイル種別・サイズ超過等）はクライアント起因
    return NextResponse.json({ error: error.message }, { status: 422 });
  }

  console.error('[POST /api/transcribe] unexpected error:', error);
  return NextResponse.json(
    { error: 'サーバー内部でエラーが発生しました' },
    { status: 500 }
  );
}
