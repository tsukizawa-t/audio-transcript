/// <reference lib="webworker" />

// This file runs in a dedicated Web Worker, never on the main thread or
// on the server.
//
// @huggingface/transformers is loaded from a CDN via a runtime dynamic
// import, rather than as a bundled npm dependency. This sidesteps a
// long-standing class of bundler issues (see the many open issues on
// huggingface/transformers.js) where Next.js's webpack config resolves
// the package's "exports" map to its Node.js build -- which statically
// imports the native onnxruntime-node/sharp addons -- even inside a
// worker or client-only bundle. Loading the browser build directly from
// a CDN, with `webpackIgnore` telling webpack not to touch this
// particular import, guarantees the correct build is used and keeps
// this app's own dependency tree free of native addons entirely.
const TRANSFORMERS_JS_CDN_URL =
  'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.2.0/+esm';

const MODEL_ID = 'Xenova/whisper-base.en';

let pipelinePromise: Promise<any> | null = null;

interface TranscribeRequest {
  type: 'transcribe';
  audioUrl: string;
}

function getPipeline() {
  if (!pipelinePromise) {
    pipelinePromise = (async () => {
      const { pipeline, env } = await import(
        /* webpackIgnore: true */ TRANSFORMERS_JS_CDN_URL
      );
      env.allowLocalModels = false;

      return pipeline('automatic-speech-recognition', MODEL_ID, {
        progress_callback: (event: {
          status: string;
          file?: string;
          progress?: number;
        }) => {
          self.postMessage({ type: 'model-progress', event });
        },
      });
    })();
  }
  return pipelinePromise;
}

self.onmessage = async (message: MessageEvent<TranscribeRequest>) => {
  const data = message.data;
  if (data.type !== 'transcribe') return;

  try {
    const transcriber = await getPipeline();
    self.postMessage({ type: 'transcribing-started' });

    const output = await transcriber(data.audioUrl, {
      chunk_length_s: 30,
      stride_length_s: 5,
      return_timestamps: true,
    });

    self.postMessage({ type: 'result', output });
  } catch (error) {
    self.postMessage({
      type: 'error',
      message: error instanceof Error ? error.message : String(error),
    });
  }
};
