import OpenAI from 'openai';
import type { AudioFile } from '../../domain/entities/AudioFile';
import type { RawTranscription } from '../../domain/entities/TranscriptionResult';
import { createTranscriptSegment } from '../../domain/entities/TranscriptSegment';
import type { TranscriptionService } from '../../domain/ports/TranscriptionService';
import { TranscriptionFailedError } from '../../domain/errors';

interface WhisperVerboseSegment {
  start: number;
  end: number;
  text: string;
}

interface WhisperVerboseJsonResponse {
  language?: string;
  duration?: number;
  segments?: WhisperVerboseSegment[];
  text?: string;
}

/**
 * OpenAI Whisper API (audio.transcriptions) を用いたTranscriptionServiceの実装。
 * domain/ports/TranscriptionService の契約を満たす。
 */
export class OpenAIWhisperTranscriptionService implements TranscriptionService {
  private readonly client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async transcribe(audio: AudioFile): Promise<RawTranscription> {
    try {
      const file = new File([new Uint8Array(audio.data)], audio.filename, {
        type: audio.mimeType || 'audio/mpeg',
      });

      const response = (await this.client.audio.transcriptions.create({
        file,
        model: 'whisper-1',
        response_format: 'verbose_json',
        // 原音声(英語)の文字起こしを行う。翻訳は別サービス(GPT)側で行う。
      })) as unknown as WhisperVerboseJsonResponse;

      const rawSegments = response.segments ?? [];
      const segments = rawSegments.map((s) =>
        createTranscriptSegment(s.text, s.start, s.end)
      );

      // verbose_jsonでsegmentsが取得できない場合のフォールバック
      if (segments.length === 0 && response.text) {
        segments.push(
          createTranscriptSegment(response.text, 0, response.duration ?? 0)
        );
      }

      return {
        language: response.language ?? 'unknown',
        durationSec: response.duration ?? 0,
        segments,
      };
    } catch (cause) {
      throw new TranscriptionFailedError(cause);
    }
  }
}
