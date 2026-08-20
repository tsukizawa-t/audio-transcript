# audio-transcript

A serverless web app for English learning. Upload an MP3 audio file and it will:

1. **Transcribe the audio in English** (using the Whisper API)
2. Detect **pauses (silence gaps)** in speech and **split the transcript into paragraphs**
3. **Automatically translate each paragraph into Japanese**, shown below the original text
4. Let you **play the audio back with a waveform player** — click to seek, change speed,
   and use keyboard shortcuts

It runs as a Next.js App Router Route Handler (i.e. a serverless function) on Vercel,
so no separate backend server is required.

## Features

- **Waveform player**
  - Renders the uploaded MP3 as a waveform (decoded client-side with the Web Audio API)
  - The waveform changes color as playback progresses (played vs. unplayed)
  - Click anywhere on the waveform to seek and start playback from that point
  - Adjustable playback speed (0.5x–2.0x)
  - Keyboard shortcuts: `Space` = play/pause, `←` = back 3s, `→` = forward 3s
- **Transcript**
  - English transcript automatically segmented into paragraphs at natural pauses
  - Japanese translation of each paragraph shown directly below it

## Architecture

The codebase follows Clean Architecture, keeping dependencies pointing in a single
direction: **outer layers depend on inner layers, never the other way around.**

```
src/
  domain/            <- Innermost layer. Depends on nothing else.
    entities/        Entities & value objects (Paragraph, AudioFile, etc.)
    ports/            Abstract boundaries to external services (interfaces)
    services/         Pure domain logic (paragraph segmentation, file validation)
    errors.ts         Domain-specific exceptions

  application/        Depends only on the domain layer
    usecases/          TranscribeAudioUseCase (orchestrates the use case)
    dto/               Input/output data structures for the use case

  infrastructure/     Implements the ports defined by application/domain
    openai/            Concrete Whisper/GPT integrations (swappable)
    config/            Environment variable loading, DI container (composition root)

app/                  Presentation layer (Next.js App Router)
  api/transcribe/route.ts   Thin HTTP controller — parses the request, calls the use case
  page.tsx / layout.tsx     Pages

components/          UI components (client-side)
  audio/              Waveform player and its Web Audio API helper
```

**Dependency inversion**: the `application` layer never imports a concrete class such as
`OpenAIWhisperTranscriptionService` — it only depends on the interfaces in `domain/ports`.
Swapping an implementation (e.g. moving from Whisper to Google Speech-to-Text) only
requires adding a new class under `infrastructure/` and updating the composition root
(`src/infrastructure/config/container.ts`); the `domain` and `application` layers never
need to change.

## Paragraph segmentation logic

`src/domain/services/ParagraphSegmenter.ts` walks through the timestamped speech
segments returned by Whisper. Whenever **the gap between the end of one segment and
the start of the next is greater than or equal to `PARAGRAPH_GAP_THRESHOLD_SEC`**
(1.5 seconds by default), it treats that as a paragraph break. This naturally splits
the transcript wherever the speaker pauses or the topic shifts.

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and set your OpenAI API key.

| Variable | Required | Description |
| --- | --- | --- |
| `OPENAI_API_KEY` | ✅ | Generate one at https://platform.openai.com/api-keys |
| `PARAGRAPH_GAP_THRESHOLD_SEC` | - | Silence gap (seconds) treated as a paragraph break. Default `1.5` |
| `MAX_UPLOAD_SIZE_MB` | - | Max upload size in MB. Default `25` (the Whisper API's own limit) |

### 3. Run locally

```bash
npm run dev
```

Open http://localhost:3000 and upload an MP3 file.

## Deploying to Vercel

1. Import this repository into Vercel
2. Set `OPENAI_API_KEY` under Project Settings → Environment Variables
3. Deploy

The Route Handler specifies `export const runtime = 'nodejs'`, so it is deployed as a
Node.js runtime serverless function.

### Known limitations

- **Vercel request body size limit**: serverless functions on the Hobby/Pro plans have
  a request body size limit (roughly 4.5MB on the free tier). If you need to handle
  larger MP3 files, consider uploading to [Vercel Blob](https://vercel.com/docs/storage/vercel-blob)
  first and having the server fetch it from there instead.
- **Execution time limit**: `maxDuration` is set to 60 seconds, but the actual cap
  depends on your plan. For long recordings, check your plan's limits or consider
  making transcription an async job (queue + webhook notification).
- The Whisper API itself has a 25MB file size limit.

## Verifying the build (type-check & build)

```bash
npm run typecheck
npm run build
```

## License

MIT
