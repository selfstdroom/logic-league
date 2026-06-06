alter table public.profiles
  add column if not exists display_deviation_type text default 'certification' not null check (display_deviation_type in ('certification', 'latest_weekly', 'highest_weekly', 'season_average')),
  add column if not exists display_title text;

create table if not exists public.thinking_deviation_histories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  source_type text not null check (source_type in ('certification', 'weekly', 'season')),
  topic_id uuid references public.topics(id) on delete set null,
  exam_answer_id uuid references public.exam_answers(id) on delete set null,
  topic_answer_id uuid references public.topic_answers(id) on delete set null,
  deviation numeric not null,
  score numeric,
  label text,
  created_at timestamp with time zone default now() not null
);

alter table public.thinking_deviation_histories enable row level security;

create policy "thinking_deviation_histories_select_own" on public.thinking_deviation_histories
  for select to authenticated using (auth.uid() = user_id);

create index if not exists thinking_deviation_histories_user_source_created_idx on public.thinking_deviation_histories(user_id, source_type, created_at desc);
create index if not exists thinking_deviation_histories_topic_idx on public.thinking_deviation_histories(topic_id);

create unique index if not exists thinking_deviation_histories_certification_answer_unique
  on public.thinking_deviation_histories(source_type, exam_answer_id)
  where source_type = 'certification' and exam_answer_id is not null;

create unique index if not exists thinking_deviation_histories_weekly_answer_unique
  on public.thinking_deviation_histories(source_type, topic_answer_id)
  where source_type = 'weekly' and topic_answer_id is not null;

create unique index if not exists thinking_deviation_histories_season_topic_unique
  on public.thinking_deviation_histories(user_id, source_type, topic_id)
  where source_type = 'season' and topic_id is not null;
