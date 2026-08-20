import type { AudioFile } from '../../domain/entities/AudioFile';
import { validateAudioFile } from '../../domain/services/AudioFileValidator';
import { ParagraphSegmenter } from '../../domain/services/ParagraphSegmenter';
import type { TranscriptionService } from '../../domain/ports/TranscriptionService';
import type { ParagraphAnnotationService } from '../../domain/ports/ParagraphAnnotationService';
import { ParagraphAnnotationFailedError } from '../../domain/errors';
import type {
  TranscribeAudioInput,
  TranscribeAudioOutput,
  ParagraphDto,
} from '../dto/TranscribeAudioDto';

/**
 * The application use case that orchestrates the full flow:
 * "Upload MP3 -> transcribe in English -> segment into paragraphs by
 *  silence gaps -> translate each paragraph into Japanese and extract
 *  IELTS-relevant key phrases".
 *
 * This class depends only on ports (interfaces), never on concrete
 * external services such as Whisper or GPT (dependency inversion).
 * Concrete implementations are injected from the infrastructure layer.
 */
export class TranscribeAudioUseCase {
  constructor(
    private readonly transcriptionService: TranscriptionService,
    private readonly annotationService: ParagraphAnnotationService,
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

    const annotated = await Promise.all(
      paragraphs.map(async (paragraph) => {
        try {
          const annotation = await this.annotationService.annotate(
            paragraph.originalText
          );
          return {
            ...paragraph,
            translatedText: annotation.translatedText,
            keyPhrases: annotation.keyPhrases,
          };
        } catch (cause) {
          throw new ParagraphAnnotationFailedError(cause);
        }
      })
    );

    const paragraphDtos: ParagraphDto[] = annotated.map((p) => ({
      index: p.index,
      originalText: p.originalText,
      translatedText: p.translatedText ?? '',
      keyPhrases: p.keyPhrases,
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
