import { loadConfig } from './env';
import { OpenAIWhisperTranscriptionService } from '../openai/OpenAIWhisperTranscriptionService';
import { OpenAITranslationService } from '../openai/OpenAITranslationService';
import { ParagraphSegmenter } from '../../domain/services/ParagraphSegmenter';
import { TranscribeAudioUseCase } from '../../application/usecases/TranscribeAudioUseCase';

/**
 * 依存性注入のコンポジションルート。
 * presentation層（Route Handler）はこの関数経由でのみユースケースを取得し、
 * infrastructure層の具象クラスを直接importしない。
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
