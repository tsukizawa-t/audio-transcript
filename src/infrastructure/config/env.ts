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
 * Loads application configuration from environment variables. Throws if
 * a required value is missing. Cached so it is evaluated only once per
 * serverless function cold start.
 */
export function loadConfig(): AppConfig {
  if (cachedConfig) return cachedConfig;

  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    throw new Error(
      'Environment variable OPENAI_API_KEY is not set. See .env.example for reference.'
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
