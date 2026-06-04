create table if not exists public.achievements (
  id text primary key,
  title text not null,
  description text not null,
  icon text default '◆' not null,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  achievement_id text references public.achievements(id) on delete cascade not null,
  created_at timestamp with time zone default now() not null,
  unique(user_id, achievement_id)
);

create table if not exists public.season_snapshots (
  id uuid primary key default gen_random_uuid(),
  season_key text not null,
  season_name text not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  rating integer not null,
  rank text not null,
  position integer not null,
  weekly_wins integer default 0 not null,
  created_at timestamp with time zone default now() not null,
  unique(season_key, user_id)
);

create unique index if not exists hall_of_fame_topic_unique_idx on public.hall_of_fame(topic_id);
create unique index if not exists rating_histories_weekly_topic_user_idx on public.rating_histories(user_id, topic_id, reason) where reason = 'weekly_result';
create index if not exists rating_histories_user_created_idx on public.rating_histories(user_id, created_at desc);
create index if not exists user_achievements_user_created_idx on public.user_achievements(user_id, created_at desc);
create index if not exists season_snapshots_season_position_idx on public.season_snapshots(season_key, position);

insert into public.achievements (id, title, description, icon) values
  ('first_weekly_submission', '初参加', 'First Weekly submission', '◇'),
  ('first_weekly_win', '初勝利', 'First 1st place', '◆'),
  ('top10_five_times', 'Top10常連', 'Top10 five times', '◈'),
  ('reach_architect', 'Architect到達', 'Reach Architect rank', '⬡'),
  ('reach_mastermind', 'Mastermind到達', 'Reach Mastermind rank', '✦'),
  ('reach_oracle', 'Oracle到達', 'Reach Oracle rank', '✺'),
  ('answers_10', '10回答達成', '10 answers reached', '10'),
  ('answers_50', '50回答達成', '50 answers reached', '50'),
  ('answers_100', '100回答達成', '100 answers reached', '100')
on conflict (id) do update set
  title = excluded.title,
  description = excluded.description,
  icon = excluded.icon;

alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;
alter table public.season_snapshots enable row level security;

drop policy if exists "achievements_select_all" on public.achievements;
create policy "achievements_select_all" on public.achievements for select using (true);

drop policy if exists "user_achievements_select_all" on public.user_achievements;
create policy "user_achievements_select_all" on public.user_achievements for select using (true);

drop policy if exists "season_snapshots_select_all" on public.season_snapshots;
create policy "season_snapshots_select_all" on public.season_snapshots for select using (true);
