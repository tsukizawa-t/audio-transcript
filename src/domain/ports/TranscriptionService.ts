import type { AudioFile } from '../entities/AudioFile';
import type { RawTranscription } from '../entities/TranscriptionResult';

/**
 * Abstract boundary to a speech recognition (ASR) service.
 * Concrete implementations (e.g. Whisper) live in the infrastructure
 * layer and must conform to this contract.
 */
export interface TranscriptionService {
  transcribe(audio: AudioFile): Promise<RawTranscription>;
}
