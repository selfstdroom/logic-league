alter table public.achievements add column if not exists key text;
alter table public.achievements add column if not exists badge_icon text;

update public.achievements
set key = coalesce(key, id),
    badge_icon = coalesce(badge_icon, icon, '🏅')
where key is null or badge_icon is null;

alter table public.achievements alter column key set not null;
alter table public.achievements alter column badge_icon set not null;
create unique index if not exists achievements_key_unique_idx on public.achievements(key);

alter table public.user_achievements add column if not exists achievement_key text;
alter table public.user_achievements add column if not exists unlocked_at timestamp with time zone default now();

update public.user_achievements
set achievement_key = coalesce(achievement_key, achievement_id),
    unlocked_at = coalesce(unlocked_at, created_at, now())
where achievement_key is null or unlocked_at is null;

alter table public.user_achievements alter column achievement_key set not null;
alter table public.user_achievements alter column unlocked_at set not null;
create unique index if not exists user_achievements_user_key_unique_idx on public.user_achievements(user_id, achievement_key);

alter table public.user_achievements
  drop constraint if exists user_achievements_achievement_key_fkey;
alter table public.user_achievements
  add constraint user_achievements_achievement_key_fkey foreign key (achievement_key) references public.achievements(key) on delete cascade;

insert into public.achievements (id, key, title, description, icon, badge_icon) values
  ('FIRST_ANSWER', 'FIRST_ANSWER', '初参加', '初めて回答を投稿する', '🏅', '🏅'),
  ('FIRST_WEEKLY', 'FIRST_WEEKLY', '初Weekly参加', '初めてWeekly Leagueに参加する', '◇', '◇'),
  ('FIRST_WIN', 'FIRST_WIN', '初勝利', 'Weekly Leagueで初めて1位を獲得する', '🏆', '🏆'),
  ('TOP10', 'TOP10', '初Top10', 'Weekly Leagueで初めてTop10に入る', '◆', '◆'),
  ('TOP10_X5', 'TOP10_X5', 'Top10 ×5', 'Top10を5回達成する', '◈', '◈'),
  ('TOP10_X10', 'TOP10_X10', 'Top10 ×10', 'Top10を10回達成する', '✦', '✦'),
  ('ANSWER_10', 'ANSWER_10', '10回答達成', '回答を10件投稿する', '10', '10'),
  ('ANSWER_50', 'ANSWER_50', '50回答達成', '回答を50件投稿する', '50', '50'),
  ('ANSWER_100', 'ANSWER_100', '100回答達成', '回答を100件投稿する', '100', '100'),
  ('COMMENT_10', 'COMMENT_10', '10コメント達成', 'コメントを10件投稿する', '💬', '💬'),
  ('COMMENT_50', 'COMMENT_50', '50コメント達成', 'コメントを50件投稿する', '💭', '💭'),
  ('ANALYST_REACHED', 'ANALYST_REACHED', 'Analyst到達', 'RankがAnalystに到達する', 'A', 'A'),
  ('STRATEGIST_REACHED', 'STRATEGIST_REACHED', 'Strategist到達', 'RankがStrategistに到達する', 'S', 'S'),
  ('ARCHITECT_REACHED', 'ARCHITECT_REACHED', 'Architect到達', 'RankがArchitectに到達する', '⬡', '⬡'),
  ('MASTERMIND_REACHED', 'MASTERMIND_REACHED', 'Mastermind到達', 'RankがMastermindに到達する', '✦', '✦'),
  ('ORACLE_REACHED', 'ORACLE_REACHED', 'Oracle到達', 'RankがOracleに到達する', '✺', '✺'),
  ('HOF_FIRST', 'HOF_FIRST', 'Hall of Fame初掲載', 'Hall of Fameに初めて掲載される', '★', '★'),
  ('HOF_X3', 'HOF_X3', 'Hall of Fame ×3', 'Hall of Fameに3回掲載される', '★★★', '★★★'),
  ('HOF_X10', 'HOF_X10', 'Hall of Fame ×10', 'Hall of Fameに10回掲載される', '★10', '★10')
on conflict (key) do update set
  title = excluded.title,
  description = excluded.description,
  icon = excluded.icon,
  badge_icon = excluded.badge_icon;

create index if not exists topics_search_idx on public.topics using gin (to_tsvector('simple', coalesce(title, '') || ' ' || coalesce(content, '') || ' ' || coalesce(category, '')));
create index if not exists topic_answers_search_idx on public.topic_answers using gin (to_tsvector('simple', coalesce(content, '')));
create index if not exists profiles_search_idx on public.profiles using gin (to_tsvector('simple', coalesce(username, '') || ' ' || coalesce(display_name, '')));
