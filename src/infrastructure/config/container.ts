import { loadConfig } from './env';
import { OpenAIWhisperTranscriptionService } from '../openai/OpenAIWhisperTranscriptionService';
import { OpenAITranslationService } from '../openai/OpenAITranslationService';
import { ParagraphSegmenter } from '../../domain/services/ParagraphSegmenter';
import { TranscribeAudioUseCase } from '../../application/usecases/TranscribeAudioUseCase';

/**
 * Dependency injection composition root. The presentation layer (Route
 * Handler) obtains the use case only through this function and never
 * imports concrete infrastructure classes directly.
 */
export function createTranscribeAudioUseCase(): TranscribeAudioUseCase {
  const config = loadConfig();

  const transcriptionService = new OpenAIWhisperTranscriptionService(
    config.openaiApiKey
  );
  const translationService = new OpenAITranslationService(
    config.openaiApiKey
  );
  const paragraphSegmenter = new ParagraphSegmenter(
    config.paragraphGapThresholdSec
  );

  return new TranscribeAudioUseCase(
    transcriptionService,
    translationService,
    paragraphSegmenter,
    config.maxUploadSizeBytes
  );
}
