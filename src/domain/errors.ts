export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class UnsupportedFileTypeError extends DomainError {
  constructor(filename: string) {
    super(`Unsupported file type: ${filename} (only .mp3 is supported)`);
  }
}

export class FileTooLargeError extends DomainError {
  constructor(sizeBytes: number, maxBytes: number) {
    super(
      `File size exceeds the limit: ${(sizeBytes / 1024 / 1024).toFixed(
        1
      )}MB (limit ${(maxBytes / 1024 / 1024).toFixed(1)}MB)`
    );
  }
}

export class EmptyFileError extends DomainError {
  constructor() {
    super('Cannot upload an empty file');
  }
}

export class TranscriptionFailedError extends DomainError {
  constructor(cause: unknown) {
    super(
      `Transcription failed: ${
        cause instanceof Error ? cause.message : String(cause)
      }`
    );
  }
}

export class ParagraphAnnotationFailedError extends DomainError {
  constructor(cause: unknown) {
    super(
      `Failed to translate/annotate paragraph: ${
        cause instanceof Error ? cause.message : String(cause)
      }`
    );
  }
}
