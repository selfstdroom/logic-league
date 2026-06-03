# Logic League

知識ではなく、思考で競え。

Logic League は、課題解決型の問いに回答し、AI 採点・ユーザー投票・ランキング・レート・ランクを通じて「思考力の実績」を蓄積する知的競技 Web アプリです。このリポジトリでは Phase 1 として、メールアドレスとパスワードによる Supabase Auth 認証、プロフィール作成、初回認定試験、OpenAI API による AI 採点、推定思考偏差値・思考アーキタイプ表示、プロフィール更新を実装しています。

## 使用技術

- Node.js 22 LTS
- npm
- Next.js 15 / App Router
- TypeScript（strict mode）
- Tailwind CSS
- ESLint
- Supabase Auth（Email/Password） / PostgreSQL / RLS
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

## Supabase SQL の実行方法

1. Supabase プロジェクトを作成します。
2. Supabase Dashboard で Authentication > Providers から Email provider を有効化し、Email/Password 認証を利用できる状態にします。
3. Supabase SQL Editor を開きます。
4. `supabase/migrations/001_initial_schema.sql` の内容を貼り付けて実行します。

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
4. Deploy を実行します。

## Phase 1 実装範囲

- メールアドレスとパスワードによるログイン
- 新規登録時の `profiles` 自動作成
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

## Phase 2: Daily Topics

Phase 2 では Daily Topics の閲覧・回答・コメント・Like、および管理者による Daily Topic 管理を追加しています。Weekly League、ランキング更新、Hall of Fame、Daily Topics の OpenAI 採点はまだ実装していません。Daily Topics は discussion-only で、`profiles.rating` / `profiles.rank` / `rating_histories` / `hall_of_fame` を更新しません。

### Daily Topics setup

1. Phase 1 の `supabase/migrations/001_initial_schema.sql` を実行済みであることを確認します。
2. Supabase SQL Editor で `supabase/migrations/002_daily_topics.sql` を実行します。
   - 公開済み Daily Topic を匿名ユーザーも閲覧できる RLS policy を追加します。
   - ログイン済みユーザーが Daily Topic のコメントと Like を利用できる RLS policy を追加します。
   - `topics` テーブルが空の場合のみ、開発用サンプル Daily Topic を 3 件投入します。

### ADMIN_EMAIL configuration

Daily Topic 管理画面は `ADMIN_EMAIL` 環境変数で制御します。ログイン中ユーザーの `user.email` と完全一致した場合のみ管理者として扱います。`admin_users` テーブルは使用しません。

```env
ADMIN_EMAIL=your@email.com
```

管理画面では Supabase service role key をサーバーサイドでのみ利用します。`SUPABASE_SERVICE_ROLE_KEY` や `OPENAI_API_KEY` を client code に露出しないでください。

### Admin topic management

- `/admin/topics` にアクセスします。
- 管理者のみ Daily Topic の作成・編集・削除ができます。
- 管理対象は `type = 'daily'` の topics のみです。
- 入力フィールドは `category` / `title` / `content` / `publish_at` です。
- 非管理者は `/home` にリダイレクトされます。

### User-facing Daily Topics

- `/topics`: 公開済み Daily Topic を新しい順に一覧表示します。
- `/topics/[id]`: Topic 詳細、回答フォーム、既存回答、コメント、Like 数を表示します。
- 未ログインユーザーは Topic と回答を閲覧できますが、回答・コメント・Like はできません。
- ログイン済みユーザーはコメントと Like / Unlike ができます。
- 認定試験に合格したユーザーのみ Daily Topic へ回答できます。
- `/home`: 最新 3 件の Daily Topic と `/topics` へのリンクを表示します。
- `/profile/[username]`: Daily Topic 回答数を表示します。

### Testing instructions

```bash
npm run lint
npm run build
```

Manual checks:

1. 未ログイン状態で `/topics` と `/topics/[id]` を開き、閲覧はできるが投稿 UI が制限されることを確認します。
2. 未合格ユーザーでログインし、コメントと Like はできるが回答はできないことを確認します。
3. 合格ユーザーでログインし、回答・コメント・Like / Unlike ができることを確認します。
4. `ADMIN_EMAIL` に一致するユーザーで `/admin/topics` にアクセスし、Daily Topic の作成・編集・削除を確認します。
5. 非管理者で `/admin/topics` にアクセスし、`/home` にリダイレクトされることを確認します。
6. Daily Topics 投稿後も rating / rank / Hall of Fame / Weekly League 関連データが更新されないことを確認します。
7. Phase 1 の `/exam` とログイン・新規登録フローが引き続き動作することを確認します。
