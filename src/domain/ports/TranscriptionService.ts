import type { AudioFile } from '../entities/AudioFile';
import type { RawTranscription } from '../entities/TranscriptionResult';

/**
 * 音声認識（ASR）サービスへの抽象境界。
 * Whisper等、具体的な実装はinfrastructure層に置き、この契約に従わせる。
 */
export interface TranscriptionService {
  transcribe(audio: AudioFile): Promise<RawTranscription>;
}
