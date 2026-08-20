import { UploadForm } from '@/components/UploadForm';

export default function HomePage() {
  return (
    <main className="page">
      <header className="hero">
        <h1>MP3 Transcript & Japanese Translation</h1>
        <p>
          Upload an English audio file (.mp3) to get a transcript
          automatically segmented into paragraphs at natural pauses, along
          with a Japanese translation of each paragraph.
        </p>
      </header>
      <UploadForm />
    </main>
  );
}
