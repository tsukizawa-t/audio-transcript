import { UploadForm } from '@/components/UploadForm';

export default function HomePage() {
  return (
    <main className="page">
      <header className="hero">
        <h1>MP3文字起こし＆日本語翻訳</h1>
        <p>
          英語の音声ファイル（.mp3）をアップロードすると、話の区切りごとに
          段落分けされた文字起こしと、その日本語訳を生成します。
        </p>
      </header>
      <UploadForm />
    </main>
  );
}
