# Logic League

知識ではなく、思考で競え。

Logic League は、課題解決型の問いに回答し、AI 採点・ユーザー投票・ランキング・レート・ランクを通じて「思考力の実績」を蓄積する知的競技 Web アプリです。このリポジトリでは Phase 1 として、Google ログイン、プロフィール作成、初回認定試験、OpenAI API による AI 採点、推定思考偏差値・思考アーキタイプ表示、プロフィール更新を実装しています。

## 使用技術

- Node.js 22 LTS
- npm
- Next.js 15 / App Router
- TypeScript（strict mode）
- Tailwind CSS
- ESLint
- Supabase Auth / PostgreSQL / RLS
- OpenAI API
- Vercel

## セットアップ手順

```bash
npm install
cp .env.local.example .env.local
```

`.env.local` に Supabase と OpenAI の値を設定してください。実際のキーはリポジトリにコミットしないでください。

## 必要な環境変数

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
OPENAI_API_KEY=
```

任意で Google OAuth のリダイレクト生成に使うサイト URL を設定できます。

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## Supabase SQL の実行方法

1. Supabase プロジェクトを作成します。
2. Supabase Dashboard で Authentication > Providers から Google provider を有効化します。
3. Supabase SQL Editor を開きます。
4. `supabase/migrations/001_initial_schema.sql` の内容を貼り付けて実行します。
5. Authentication > URL Configuration に以下を追加します。
   - ローカル: `http://localhost:3000/auth/callback`
   - Vercel: `https://<your-domain>/auth/callback`

SQL には Phase 1 で使う `profiles` / `exam_answers` に加え、Phase 2 以降を見据えた topics、answers、comments、likes、weekly_votes、rating_histories、hall_of_fame、topic_proposals と RLS policy が含まれています。

## ローカル起動方法

```bash
npm run dev
```

ブラウザで `http://localhost:3000` を開きます。

## Vercel デプロイ手順

1. Vercel でこの GitHub リポジトリを Import します。
2. Framework Preset は Next.js を選択します。
3. Environment Variables に `.env.local.example` と同じキーを登録します。
4. Supabase Auth の Redirect URL に Vercel の `/auth/callback` URL を追加します。
5. Deploy を実行します。

## Phase 1 実装範囲

- Google ログイン
- Supabase Auth callback 後の `profiles` 自動作成
- 認定試験ページ
- 500 文字未満の送信ブロック
- `POST /api/exam/submit` によるサーバーサイド OpenAI 採点
- JSON parse 失敗時を含む AI 採点エラーハンドリング
- 推定思考偏差値計算
- 参加資格判定
- 思考アーキタイプ表示
- `exam_answers` 保存
- `profiles` 更新

## 注意

認定試験結果は AI による推定であり、正式な IQ 検査・心理検査・学術的知能検査ではありません。
