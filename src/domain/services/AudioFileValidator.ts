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
 * Validates that an uploaded audio file satisfies the domain rules.
 * Pure domain logic with no external I/O.
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
