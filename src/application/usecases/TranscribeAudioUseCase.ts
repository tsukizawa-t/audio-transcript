import type { AudioFile } from '../../domain/entities/AudioFile';
import { validateAudioFile } from '../../domain/services/AudioFileValidator';
import { ParagraphSegmenter } from '../../domain/services/ParagraphSegmenter';
import type { TranscriptionService } from '../../domain/ports/TranscriptionService';
import type { TranslationService } from '../../domain/ports/TranslationService';
import { TranslationFailedError } from '../../domain/errors';
import type {
  TranscribeAudioInput,
  TranscribeAudioOutput,
  ParagraphDto,
} from '../dto/TranscribeAudioDto';

const TARGET_LANGUAGE = 'ja';

/**
 * 「MP3をアップロード → 英語で文字起こし → 無音間隔で段落分け →
 *  各段落を日本語に翻訳」までを統括するアプリケーションのユースケース。
 *
 * 外部サービスの実体（Whisper, GPT等）には依存せず、ポート（インターフェース）
 * のみに依存する（依存性逆転）。実体はinfrastructure層からDIされる。
 */
export class TranscribeAudioUseCase {
  constructor(
    private readonly transcriptionService: TranscriptionService,
    private readonly translationService: TranslationService,
    private readonly paragraphSegmenter: ParagraphSegmenter,
    private readonly maxUploadSizeBytes: number
  ) {}

  async execute(input: TranscribeAudioInput): Promise<TranscribeAudioOutput> {
    const audio: AudioFile = {
      filename: input.filename,
      mimeType: input.mimeType,
      sizeBytes: input.data.byteLength,
      data: input.data,
    };

    validateAudioFile(audio, this.maxUploadSizeBytes);

    const raw = await this.transcriptionService.transcribe(audio);
    const paragraphs = this.paragraphSegmenter.segment(raw.segments);

    const translated = await Promise.all(
      paragraphs.map(async (paragraph) => {
        try {
          const translatedText = await this.translationService.translate(
            paragraph.originalText,
            TARGET_LANGUAGE
          );
          return { ...paragraph, translatedText };
        } catch (cause) {
          throw new TranslationFailedError(cause);
        }
      })
    );

    const paragraphDtos: ParagraphDto[] = translated.map((p) => ({
      index: p.index,
      originalText: p.originalText,
      translatedText: p.translatedText ?? '',
      startTime: p.startTime,
      endTime: p.endTime,
    }));

    return {
      language: raw.language,
      durationSec: raw.durationSec,
      paragraphs: paragraphDtos,
    };
  }
}
