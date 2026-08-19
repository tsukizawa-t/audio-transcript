import type { AudioFile } from '../entities/AudioFile';
import {
  hasSupportedExtension,
  hasSupportedMimeType,
} from '../entities/AudioFile';
import {
  EmptyFileError,
  FileTooLargeError,
  UnsupportedFileTypeError,
} from '../errors';

/**
 * アップロードされた音声ファイルがドメインルールを満たすか検証する。
 * 外部I/Oを持たない純粋なドメインロジック。
 */
export function validateAudioFile(
  audio: AudioFile,
  maxSizeBytes: number
): void {
  if (audio.sizeBytes <= 0) {
    throw new EmptyFileError();
  }

  const extensionOk = hasSupportedExtension(audio.filename);
  const mimeOk = hasSupportedMimeType(audio.mimeType);
  if (!extensionOk && !mimeOk) {
    throw new UnsupportedFileTypeError(audio.filename);
  }

  if (audio.sizeBytes > maxSizeBytes) {
    throw new FileTooLargeError(audio.sizeBytes, maxSizeBytes);
  }
}
