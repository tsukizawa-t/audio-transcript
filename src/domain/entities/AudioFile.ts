/**
 * A value object representing an uploaded audio file. Deliberately
 * independent of infrastructure types such as the Web API's File or
 * Node.js's Buffer.
 */
export interface AudioFile {
  readonly filename: string;
  readonly mimeType: string;
  readonly sizeBytes: number;
  readonly data: Buffer;
}

export const SUPPORTED_MIME_TYPES = [
  'audio/mpeg',
  'audio/mp3',
  'audio/x-mpeg-3',
] as const;

export const SUPPORTED_EXTENSIONS = ['.mp3'] as const;

export function hasSupportedExtension(filename: string): boolean {
  const lower = filename.toLowerCase();
  return SUPPORTED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

export function hasSupportedMimeType(mimeType: string): boolean {
  return (SUPPORTED_MIME_TYPES as readonly string[]).includes(
    mimeType.toLowerCase()
  );
}
