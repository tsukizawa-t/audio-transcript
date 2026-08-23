import { TransformersJsTranscriptionService } from '../browser/TransformersJsTranscriptionService';
import { FreeParagraphAnnotationService } from '../browser/FreeParagraphAnnotationService';
import { ParagraphSegmenter } from '../../domain/services/ParagraphSegmenter';
import { TranscribeAudioUseCase } from '../../application/usecases/TranscribeAudioUseCase';

const PARAGRAPH_GAP_THRESHOLD_SEC = 1.5;
const MAX_UPLOAD_SIZE_BYTES = 25 * 1024 * 1024;

/**
 * Client-side composition root. Everything this wires together runs in
 * the browser -- there is no server component and no API key required.
 * The presentation layer (UploadForm) obtains the use case only through
 * this function and never imports concrete infrastructure classes
 * directly.
 */
export function createTranscribeAudioUseCase(
  onModelLoadProgress?: (percent: number) => void
): TranscribeAudioUseCase {
  const transcriptionService = new TransformersJsTranscriptionService(
    onModelLoadProgress
  );
  const annotationService = new FreeParagraphAnnotationService();
  const paragraphSegmenter = new ParagraphSegmenter(
    PARAGRAPH_GAP_THRESHOLD_SEC
  );

  return new TranscribeAudioUseCase(
    transcriptionService,
    annotationService,
    paragraphSegmenter,
    MAX_UPLOAD_SIZE_BYTES
  );
}
