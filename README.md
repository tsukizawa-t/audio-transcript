# audio-transcript

MP3音声ファイルをアップロードすると、

1. **英語の文字起こし**（Whisper APIを使用）
2. 発話の**間（無音区間）を検出して段落分け**
3. 各段落を**日本語に自動翻訳**して原文の下に表示

するサーバーレスWebアプリです。Vercel上でNext.js App Routerの
Route Handler（＝サーバーレス関数）として動作し、バックエンド用サーバーを
別途用意する必要はありません。

## アーキテクチャ

クリーンアーキテクチャに基づき、依存の方向が **外側 → 内側** に一方向になるよう
レイヤーを分離しています。

```
src/
  domain/            ← 最内層。他のどの層にも依存しない
    entities/        エンティティ・値オブジェクト（Paragraph, AudioFile 等）
    ports/            外部サービスへの抽象境界（インターフェース）
    services/         純粋なドメインロジック（段落分け、ファイル検証）
    errors.ts         ドメイン固有の例外

  application/        ドメイン層のみに依存する
    usecases/          TranscribeAudioUseCase（ユースケースの手続きを記述）
    dto/               ユースケースの入出力データ構造

  infrastructure/     application/domain層のポートを実装する
    openai/            Whisper・GPTを叩く具体的な実装（差し替え可能）
    config/            環境変数の読み込み、DIコンテナ（コンポジションルート）

app/                  プレゼンテーション層（Next.js App Router）
  api/transcribe/route.ts   HTTPリクエストを受け、ユースケースを呼ぶだけの薄いController
  page.tsx / layout.tsx     画面

components/          UIコンポーネント（クライアントサイド）
```

**依存性逆転**: `application`層は`OpenAIWhisperTranscriptionService`のような
具象クラスを知らず、`domain/ports`のインターフェースにのみ依存します。実装の
差し替え（例: WhisperからGoogle Speech-to-Textへの変更）は`infrastructure`層の
追加とコンポジションルート（`src/infrastructure/config/container.ts`）の変更のみで完結し、
`domain`・`application`層は一切変更不要です。

## 段落分けのロジック

`src/domain/services/ParagraphSegmenter.ts` が、Whisperから得られる発話セグメント
（開始・終了時刻付き）を走査し、**前のセグメントの終了時刻から次のセグメントの
開始時刻までの間隔が `PARAGRAPH_GAP_THRESHOLD_SEC`（既定1.5秒）以上**であれば、
そこを段落の区切りとみなします。話者が一息ついた箇所・話題が変わる間などが
自然に段落として区切られます。

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

```bash
cp .env.example .env.local
```

`.env.local` を開き、OpenAIのAPIキーを設定してください。

| 変数名 | 必須 | 説明 |
| --- | --- | --- |
| `OPENAI_API_KEY` | ✅ | https://platform.openai.com/api-keys で発行 |
| `PARAGRAPH_GAP_THRESHOLD_SEC` | - | 段落区切りとみなす無音間隔（秒）。既定 `1.5` |
| `MAX_UPLOAD_SIZE_MB` | - | アップロード上限MB。既定 `25`（Whisper APIの上限） |

### 3. ローカル起動

```bash
npm run dev
```

http://localhost:3000 を開いてMP3ファイルをアップロードしてください。

## Vercelへのデプロイ

1. このリポジトリをVercelにインポート
2. Project Settings → Environment Variables に `OPENAI_API_KEY` を設定
3. デプロイ

Route Handler は `export const runtime = 'nodejs'` を指定しているため、
Node.jsランタイムのサーバーレス関数としてデプロイされます。

### 既知の制約

- **Vercelのリクエストボディ上限**: Hobby/Proプランのサーバーレス関数は
  リクエストボディに上限（無料枠は4.5MB程度）があります。大きめのMP3を
  扱いたい場合は [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) 等に
  一度アップロードしてからサーバー側で取得する方式への変更を検討してください。
- **実行時間の上限**: `maxDuration` を60秒に設定していますが、プランによって
  上限が異なります。長時間の音声を扱う場合はプランの確認、または
  非同期ジョブ化（キュー＋Webhook通知）を検討してください。
- Whisper API自体のファイルサイズ上限は25MBです。

## 動作確認（型チェック・ビルド）

```bash
npm run typecheck
npm run build
```

## ライセンス

MIT
