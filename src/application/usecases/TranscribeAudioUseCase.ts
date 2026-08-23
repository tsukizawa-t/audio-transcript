import type { AudioFile } from '../../domain/entities/AudioFile';
import type { Paragraph } from '../../domain/entities/Paragraph';
import { validateAudioFile } from '../../domain/services/AudioFileValidator';
import { ParagraphSegmenter } from '../../domain/services/ParagraphSegmenter';
import type { TranscriptionService } from '../../domain/ports/TranscriptionService';
import type { ParagraphAnnotationService } from '../../domain/ports/ParagraphAnnotationService';
import { ParagraphAnnotationFailedError } from '../../domain/errors';
import type {
  TranscribeAudioInput,
  TranscribeAudioOutput,
  TranscribeAudioProgressCallback,
  ParagraphDto,
} from '../dto/TranscribeAudioDto';

/**
 * The application use case that orchestrates the full flow:
 * "Load MP3 -> transcribe in English -> segment into paragraphs by
 *  silence gaps -> translate each paragraph into Japanese and extract
 *  IELTS-relevant key phrases".
 *
 * This class depends only on ports (interfaces), never on concrete
 * implementations. It is deliberately environment-agnostic: the same
 * orchestration logic works whether the injected services run in a
 * browser (as they currently do) or on a server.
 */
export class TranscribeAudioUseCase {
  constructor(
    private readonly transcriptionService: TranscriptionService,
    private readonly annotationService: ParagraphAnnotationService,
    private readonly paragraphSegmenter: ParagraphSegmenter,
    private readonly maxUploadSizeBytes: number
  ) {}

  async execute(
    input: TranscribeAudioInput,
    onProgress?: TranscribeAudioProgressCallback
  ): Promise<TranscribeAudioOutput> {
    const audio: AudioFile = {
      filename: input.filename,
      mimeType: input.mimeType,
      sizeBytes: input.data.size,
      data: input.data,
    };

    validateAudioFile(audio, this.maxUploadSizeBytes);

    onProgress?.({ stage: 'transcribing' });
    const raw = await this.transcriptionService.transcribe(audio);
    const paragraphs = this.paragraphSegmenter.segment(raw.segments);

    // Annotate sequentially rather than in parallel: the free
    // translation service is rate-limited per day/IP, and issuing a
    // burst of concurrent requests is both unnecessary (there's no
    // per-request cost to amortize) and more likely to be throttled.
    const annotated: Paragraph[] = [];

    for (let i = 0; i < paragraphs.length; i++) {
      const paragraph = paragraphs[i]!;
      onProgress?.({
        stage: 'annotating',
        current: i + 1,
        total: paragraphs.length,
      });
      try {
        const annotation = await this.annotationService.annotate(
          paragraph.originalText
        );
        annotated.push({
          ...paragraph,
          translatedText: annotation.translatedText,
          keyPhrases: annotation.keyPhrases,
        });
      } catch (cause) {
        throw new ParagraphAnnotationFailedError(cause);
      }
    }

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
