import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MP3文字起こし＆日本語翻訳',
  description:
    'MP3音声ファイルをアップロードして、英語の文字起こし（段落分け）と日本語訳を生成します。',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
