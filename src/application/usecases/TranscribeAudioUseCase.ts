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
 * The application use case that orchestrates the full flow:
 * "Upload MP3 -> transcribe in English -> segment into paragraphs by
 *  silence gaps -> translate each paragraph into Japanese".
 *
 * This class depends only on ports (interfaces), never on concrete
 * external services such as Whisper or GPT (dependency inversion).
 * Concrete implementations are injected from the infrastructure layer.
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
