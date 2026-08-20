import { UploadForm } from '@/components/UploadForm';

export default function HomePage() {
  return (
    <main className="page">
      <header className="hero">
        <h1>MP3 Transcript & Japanese Translation for IELTS Listening</h1>
        <p>
          Upload an English audio file (.mp3) to get a transcript
          automatically segmented into paragraphs at natural pauses, a
          Japanese translation of each paragraph, and key words/phrases
          worth memorizing for IELTS Listening 7.0 — highlighted right in
          the script and explained in Japanese underneath.
        </p>
      </header>
      <UploadForm />
    </main>
  );
}
