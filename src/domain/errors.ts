export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class UnsupportedFileTypeError extends DomainError {
  constructor(filename: string) {
    super(`対応していないファイル形式です: ${filename}（.mp3のみ対応）`);
  }
}

export class FileTooLargeError extends DomainError {
  constructor(sizeBytes: number, maxBytes: number) {
    super(
      `ファイルサイズが上限を超えています: ${(sizeBytes / 1024 / 1024).toFixed(
        1
      )}MB（上限 ${(maxBytes / 1024 / 1024).toFixed(1)}MB）`
    );
  }
}

export class EmptyFileError extends DomainError {
  constructor() {
    super('空のファイルはアップロードできません');
  }
}

export class TranscriptionFailedError extends DomainError {
  constructor(cause: unknown) {
    super(
      `文字起こしに失敗しました: ${
        cause instanceof Error ? cause.message : String(cause)
      }`
    );
  }
}

export class TranslationFailedError extends DomainError {
  constructor(cause: unknown) {
    super(
      `翻訳に失敗しました: ${
        cause instanceof Error ? cause.message : String(cause)
      }`
    );
  }
}
