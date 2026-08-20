# audio-transcript

A serverless web app for IELTS Listening preparation. Upload an MP3 audio file and it will:

1. **Transcribe the audio in English** (using the Whisper API)
2. Detect **pauses (silence gaps)** in speech and **split the transcript into paragraphs**
3. **Automatically translate each paragraph into Japanese**, shown below the original text
4. **Highlight words and phrases worth memorizing for IELTS Listening 7.0** directly in
   the script, and explain each one in Japanese right underneath — so while you listen
   and follow along, you immediately see what matters and what it means
5. Let you **play the audio back with a waveform player** — click to seek, change speed,
   and use keyboard shortcuts

Files are uploaded directly from the browser to [Vercel Blob](https://vercel.com/docs/storage/vercel-blob)
storage, bypassing the request body limit that would otherwise apply to a
serverless function. The app runs as Next.js App Router Route Handlers
(i.e. serverless functions) on Vercel, so no separate backend server is
required.

## Features

- **Large-file friendly upload**
  - Files upload directly from the browser to Vercel Blob storage, never through
    the serverless function's request body, so files up to Whisper's own 25MB limit
    work fine (Vercel's ~4.5MB serverless request body limit no longer applies)
  - The temporary blob is deleted automatically right after transcription
- **Waveform player**
  - Renders the uploaded MP3 as a waveform (decoded client-side with the Web Audio API)
  - The waveform changes color as playback progresses (played vs. unplayed)
  - Click anywhere on the waveform to seek and start playback from that point
  - Adjustable playback speed (0.5x–2.0x)
  - Keyboard shortcuts: `Space` = play/pause, `←` = back 3s, `→` = forward 3s
- **Click-to-play transcript**
  - Click any paragraph to jump playback to the start of that paragraph
  - While playing, the paragraph currently being spoken is highlighted; the rest
    are dimmed, so it's easy to follow along
  - The waveform and the transcript share the same playback state, so seeking from
    either one stays in sync with the other
- **Transcript & IELTS study aids**
  - English transcript automatically segmented into paragraphs at natural pauses
  - Japanese translation of each paragraph shown directly below it
  - Key words/phrases relevant to IELTS Listening 7.0 (collocations, phrasal verbs,
    signposting language, academic vocabulary, idioms) are highlighted inline in the
    original text and listed underneath with a Japanese meaning and usage note
  - Both the translation and the key-phrase list come from a single OpenAI call per
    paragraph — no extra API round trips

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
  api/upload/route.ts       Issues short-lived tokens for direct browser-to-Blob uploads
  api/transcribe/route.ts   Thin HTTP controller — fetches the uploaded blob, calls the use case
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
| `BLOB_READ_WRITE_TOKEN` | ✅ (local dev only*) | Vercel Blob token for direct uploads. Auto-injected on Vercel once a Blob store is connected; for local dev, copy it from the dashboard's Storage tab |
| `PARAGRAPH_GAP_THRESHOLD_SEC` | - | Silence gap (seconds) treated as a paragraph break. Default `1.5` |
| `MAX_UPLOAD_SIZE_MB` | - | Max upload size in MB. Default `25` (the Whisper API's own limit) |

\* On Vercel, this is set automatically once you connect a Blob store to the
project (see the deploy steps below) — you don't need to add it manually.

### 3. Run locally

```bash
npm run dev
```

Open http://localhost:3000 and upload an MP3 file.

## Deploying to Vercel

1. Import this repository into Vercel
2. Set `OPENAI_API_KEY` under Project Settings → Environment Variables
3. Go to the project's **Storage** tab → **Create Database** → **Blob**, and connect
   it to this project. This automatically adds `BLOB_READ_WRITE_TOKEN` to your
   environment variables — no manual copy/paste needed.
4. Deploy

Both Route Handlers specify `export const runtime = 'nodejs'`, so they are deployed
as Node.js runtime serverless functions.

### Known limitations

- **File size**: capped at 25MB, matching the Whisper API's own limit
  (`MAX_UPLOAD_SIZE_MB` in `.env.example`). Because uploads go directly to Blob
  storage, Vercel's serverless request body limit (~4.5MB) no longer applies.
- **Execution time limit**: `maxDuration` on `/api/transcribe` is set to 60 seconds,
  but the actual cap depends on your plan. For long recordings, check your plan's
  limits or consider making transcription an async job (queue + webhook notification).
- **Blob storage cost**: uploaded files are stored temporarily and deleted right
  after transcription completes (or fails). If a request is interrupted before that
  cleanup runs, an orphaned blob may remain — Vercel Blob's dashboard lets you view
  and delete these manually if needed.

## Verifying the build (type-check & build)

```bash
npm run typecheck
npm run build
```

## License

MIT
