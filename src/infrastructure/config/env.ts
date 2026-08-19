export interface AppConfig {
  readonly openaiApiKey: string;
  readonly paragraphGapThresholdSec: number;
  readonly maxUploadSizeBytes: number;
}

function readNumberEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

let cachedConfig: AppConfig | null = null;

/**
 * 環境変数からアプリ設定を読み込む。未設定の必須項目があれば例外を投げる。
 * サーバーレス関数のコールドスタート時に一度だけ評価されるようキャッシュする。
 */
export function loadConfig(): AppConfig {
  if (cachedConfig) return cachedConfig;

  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    throw new Error(
      '環境変数 OPENAI_API_KEY が設定されていません。.env.example を参考に設定してください。'
    );
  }

  cachedConfig = {
    openaiApiKey,
    paragraphGapThresholdSec: readNumberEnv(
      'PARAGRAPH_GAP_THRESHOLD_SEC',
      1.5
    ),
    maxUploadSizeBytes:
      readNumberEnv('MAX_UPLOAD_SIZE_MB', 25) * 1024 * 1024,
  };
  return cachedConfig;
}
