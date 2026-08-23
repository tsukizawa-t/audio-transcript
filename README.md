# audio-transcript

A **100% free**, serverless web app for IELTS Listening preparation. Upload an MP3
audio file and it will:

1. **Transcribe the audio in English**, entirely inside your browser (OpenAI's
   Whisper model, running locally via WebAssembly -- no audio is ever uploaded
   anywhere)
2. Detect **pauses (silence gaps)** in speech and **split the transcript into
   paragraphs**
3. **Automatically translate each paragraph into Japanese** (via the free
   MyMemory translation API), shown below the original text
4. **Highlight words and phrases worth memorizing for IELTS Listening 7.0**
   directly in the script, matched against a curated dictionary, and explain
   each one in Japanese right underneath
5. Let you **play the audio back with a waveform player** -- click to seek,
   change speed, and use keyboard shortcuts

## Why this is free

Nothing in this app calls a paid API:

| Capability | How it's done for free |
| --- | --- |
| Speech recognition | Whisper (`Xenova/whisper-base.en`) running in-browser via [Transformers.js](https://huggingface.co/docs/transformers.js), loaded from a CDN and executed in a Web Worker with WebAssembly. Downloaded once, cached by the browser afterwards. |
| Translation | The [MyMemory](https://mymemory.translated.net/) API -- no signup, no API key, CORS-enabled for direct browser calls. Free tier: ~5,000 characters/day per IP. |
| IELTS key phrases | Matched against a static, curated dictionary of IELTS-relevant vocabulary bundled with the app (`src/infrastructure/dictionary/ieltsKeyPhrases.ts`) -- no AI call needed. |
| Hosting | Vercel's free Hobby plan. There's no server-side processing left at all: no API routes, no file uploads, no environment variables to configure. |

**Trade-off**: this trades some quality for zero cost compared to a paid setup
(OpenAI's hosted Whisper API + GPT-4o-mini). Expect:
- Slightly lower transcription accuracy than OpenAI's hosted Whisper API,
  especially on noisy audio or non-standard accents
- Translation that's serviceable but less fluent/natural than GPT-based translation
- IELTS key phrases limited to what's in the static dictionary, rather than
  phrases dynamically picked for each specific passage

## Features

- **Zero setup**: no API keys, no environment variables, no paid accounts.
  Clone it and it works.
- **Runs on-device**: after the first model download, transcription works even
  without a good connection (the audio file itself never leaves your browser).
- **Waveform player**
  - Renders the uploaded MP3 as a waveform (decoded client-side with the Web
    Audio API)
  - The waveform changes color as playback progresses (played vs. unplayed)
  - Click anywhere on the waveform to seek and start playback from that point
  - Adjustable playback speed (0.5x-2.0x)
  - Keyboard shortcuts: `Space` = play/pause, `←` = back 3s, `→` = forward 3s
- **Click-to-play transcript**
  - Click any paragraph to jump playback to the start of that paragraph
  - While playing, the paragraph currently being spoken is highlighted; the
    rest are dimmed, so it's easy to follow along
  - The waveform and the transcript share the same playback state, so seeking
    from either one stays in sync with the other
- **Transcript & IELTS study aids**
  - English transcript automatically segmented into paragraphs at natural
    pauses
  - Japanese translation of each paragraph shown directly below it
  - Key words/phrases relevant to IELTS Listening 7.0 (collocations, phrasal
    verbs, signposting language, academic vocabulary) are highlighted inline
    in the original text and listed underneath with a Japanese meaning and
    usage note

## Architecture

The codebase follows Clean Architecture, keeping dependencies pointing in a
single direction: **outer layers depend on inner layers, never the other way
around.** Every layer now runs entirely in the browser -- there is no server
component processing audio, translation, or phrase extraction.

```
src/
  domain/            <- Innermost layer. Depends on nothing else.
    entities/        Entities & value objects (Paragraph, AudioFile, KeyPhrase, etc.)
    ports/            Abstract boundaries to external services (interfaces)
    services/         Pure domain logic (paragraph segmentation, file validation)
    errors.ts         Domain-specific exceptions

  application/        Depends only on the domain layer
    usecases/          TranscribeAudioUseCase (orchestrates the whole flow;
                        environment-agnostic -- it has no idea its
                        dependencies happen to run in a browser)
    dto/               Input/output data structures for the use case

  infrastructure/     Implements the ports defined by application/domain
    browser/           TransformersJsTranscriptionService (Whisper via a Web
                        Worker), FreeParagraphAnnotationService (MyMemory +
                        dictionary matching), the worker script itself
    dictionary/        The static IELTS key-phrase dictionary and matcher
    config/            clientContainer.ts -- the DI composition root

app/                  Presentation layer (Next.js App Router)
  page.tsx / layout.tsx     Pages (no API routes -- nothing to call server-side)

components/          UI components (client-side)
  audio/              Waveform player, shared playback hook (useAudioPlayer)
```

**Dependency inversion**: the `application` layer never imports a concrete
class such as `TransformersJsTranscriptionService` -- it only depends on the
interfaces in `domain/ports`. Swapping an implementation (e.g. moving back to
a paid OpenAI-backed service for better quality) only requires adding a new
class under `infrastructure/` and updating the composition root
(`src/infrastructure/config/clientContainer.ts`); the `domain` and
`application` layers never need to change.

## Why Whisper is loaded from a CDN, not bundled

`src/infrastructure/browser/transcription.worker.ts` loads
`@huggingface/transformers` via a runtime `import()` from a CDN URL (with a
`webpackIgnore` comment) instead of installing it as an npm dependency. This
sidesteps a well-known class of Next.js/webpack bugs where the package's
Node.js-vs-browser conditional `exports` resolve to the Node.js build (which
statically imports the native `onnxruntime-node`/`sharp` addons) even inside a
client-only bundle or Web Worker. Loading the browser build directly from a
CDN guarantees the correct build is used and keeps this project's own
`node_modules` free of native addons.

## Paragraph segmentation logic

`src/domain/services/ParagraphSegmenter.ts` walks through the timestamped
speech chunks returned by Whisper. Whenever **the gap between the end of one
chunk and the start of the next is greater than or equal to
`PARAGRAPH_GAP_THRESHOLD_SEC`** (1.5 seconds by default, set in
`clientContainer.ts`), it treats that as a paragraph break. This naturally
splits the transcript wherever the speaker pauses or the topic shifts.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Run locally

```bash
npm run dev
```

Open http://localhost:3000 and upload an MP3 file. That's it -- no environment
variables to configure.

The first transcription in a fresh browser will download the Whisper model
(tens of MB, from Hugging Face's CDN via jsDelivr); it's cached afterwards.

## Deploying to Vercel

1. Import this repository into Vercel
2. Deploy

There is nothing else to configure: no environment variables, no storage to
connect, no API keys.

### Known limitations

- **Performance depends on the visitor's device**: transcription runs on
  their CPU (or GPU, if the browser supports WebGPU) inside a Web Worker.
  Older or lower-powered devices will be slower.
- **Translation rate limit**: MyMemory's free anonymous tier is roughly 5,000
  characters/day per IP address. Heavy daily use could hit that limit; if so,
  consider adding an email address to the request (see
  `src/infrastructure/browser/MyMemoryTranslationClient.ts`) for a higher
  50,000 character/day pool.
- **IELTS phrase coverage**: only phrases already present in the static
  dictionary (`src/infrastructure/dictionary/ieltsKeyPhrases.ts`) can be
  detected. Feel free to extend that list.
- **File size**: capped at 25MB by default (`clientContainer.ts`) as a
  reasonable limit for in-browser processing time, not because of any
  platform restriction.

## Verifying the build (type-check & build)

```bash
npm run typecheck
npm run build
```

## License

MIT
