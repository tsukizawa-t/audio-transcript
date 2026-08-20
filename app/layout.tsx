import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'MP3 Transcript & Japanese Translation',
  description:
    'Upload an MP3 audio file to get an English transcript (segmented into paragraphs) with a Japanese translation.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
