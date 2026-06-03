create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  username text unique not null,
  display_name text,
  avatar_url text,
  bio text,
  predicted_deviation integer,
  qualified boolean default false not null,
  rating integer default 0 not null,
  rank text default 'Visitor' not null,
  archetype text,
  x_url text,
  youtube_url text,
  github_url text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table if not exists public.exam_answers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  answer text not null,
  structure_score integer,
  hypothesis_score integer,
  originality_score integer,
  feasibility_score integer,
  risk_score integer,
  total_score integer,
  predicted_deviation integer,
  qualified boolean,
  archetype text,
  rank text,
  rating integer,
  headline text,
  summary text,
  strength text,
  weakness text,
  upper_gap text,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('daily', 'weekly')),
  category text not null check (category in ('AI', 'Business', 'Economics', 'Society', 'Psychology', 'Science')),
  title text not null,
  content text not null,
  status text default 'published' not null,
  publish_at timestamp with time zone,
  deadline_at timestamp with time zone,
  reveal_at timestamp with time zone,
  vote_deadline_at timestamp with time zone,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.topic_answers (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid references public.topics(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  answer_type text check (answer_type in ('Answer', 'Counter', 'Support', 'Question')),
  content text not null,
  ai_structure_score integer,
  ai_logic_score integer,
  ai_originality_score integer,
  ai_feasibility_score integer,
  ai_risk_score integer,
  ai_total_score integer,
  vote_count integer default 0 not null,
  final_score numeric,
  is_anonymous boolean default true not null,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  topic_answer_id uuid references public.topic_answers(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.likes (
  id uuid primary key default gen_random_uuid(),
  topic_answer_id uuid references public.topic_answers(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default now() not null,
  unique(topic_answer_id, user_id)
);

create table if not exists public.weekly_votes (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid references public.topics(id) on delete cascade not null,
  topic_answer_id uuid references public.topic_answers(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default now() not null,
  unique(topic_answer_id, user_id)
);

create table if not exists public.rating_histories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  topic_id uuid references public.topics(id) on delete set null,
  old_rating integer,
  new_rating integer,
  delta integer,
  reason text,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.hall_of_fame (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid references public.topics(id) on delete set null,
  winner_user_id uuid references public.profiles(id) on delete set null,
  winner_answer_id uuid references public.topic_answers(id) on delete set null,
  final_score numeric,
  ai_total_score integer,
  vote_count integer,
  created_at timestamp with time zone default now() not null
);

create table if not exists public.topic_proposals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text,
  content text,
  category text,
  reason text,
  status text default 'pending',
  created_at timestamp with time zone default now() not null
);

create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.handle_updated_at();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  requested_username text := lower(regexp_replace(coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1), 'player'), '[^a-zA-Z0-9_]', '_', 'g'));
begin
  insert into public.profiles (id, email, username, display_name)
  values (
    new.id,
    new.email,
    left(requested_username, 20),
    coalesce(nullif(new.raw_user_meta_data->>'display_name', ''), split_part(new.email, '@', 1), 'Logic Player')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

alter table public.profiles enable row level security;
alter table public.exam_answers enable row level security;
alter table public.topics enable row level security;
alter table public.topic_answers enable row level security;
alter table public.comments enable row level security;
alter table public.likes enable row level security;
alter table public.weekly_votes enable row level security;
alter table public.rating_histories enable row level security;
alter table public.hall_of_fame enable row level security;
alter table public.topic_proposals enable row level security;

create policy "profiles_select_authenticated" on public.profiles for select to authenticated using (true);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

create policy "exam_answers_select_own" on public.exam_answers for select to authenticated using (auth.uid() = user_id);
create policy "exam_answers_insert_own" on public.exam_answers for insert to authenticated with check (auth.uid() = user_id);

create policy "topics_select_authenticated" on public.topics for select to authenticated using (true);

create policy "topic_answers_select_daily_or_visible_weekly" on public.topic_answers for select to authenticated using (
  exists (
    select 1 from public.topics t
    where t.id = topic_id and (
      t.type = 'daily' or user_id = auth.uid() or (t.type = 'weekly' and t.reveal_at is not null and t.reveal_at <= now())
    )
  )
);
create policy "topic_answers_insert_qualified" on public.topic_answers for insert to authenticated with check (
  auth.uid() = user_id and exists (select 1 from public.profiles p where p.id = auth.uid() and p.qualified = true)
);
create policy "topic_answers_update_own" on public.topic_answers for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "comments_select_authenticated" on public.comments for select to authenticated using (true);
create policy "comments_insert_qualified" on public.comments for insert to authenticated with check (auth.uid() = user_id and exists (select 1 from public.profiles p where p.id = auth.uid() and p.qualified = true));
create policy "comments_delete_own" on public.comments for delete to authenticated using (auth.uid() = user_id);

create policy "likes_select_authenticated" on public.likes for select to authenticated using (true);
create policy "likes_insert_qualified" on public.likes for insert to authenticated with check (auth.uid() = user_id and exists (select 1 from public.profiles p where p.id = auth.uid() and p.qualified = true));
create policy "likes_delete_own" on public.likes for delete to authenticated using (auth.uid() = user_id);

create policy "weekly_votes_select_authenticated" on public.weekly_votes for select to authenticated using (true);
create policy "weekly_votes_insert_qualified" on public.weekly_votes for insert to authenticated with check (auth.uid() = user_id and exists (select 1 from public.profiles p where p.id = auth.uid() and p.qualified = true));
create policy "weekly_votes_delete_own" on public.weekly_votes for delete to authenticated using (auth.uid() = user_id);

create policy "rating_histories_select_own" on public.rating_histories for select to authenticated using (auth.uid() = user_id);
create policy "hall_of_fame_select_authenticated" on public.hall_of_fame for select to authenticated using (true);
create policy "topic_proposals_select_own" on public.topic_proposals for select to authenticated using (auth.uid() = user_id);
create policy "topic_proposals_insert_qualified" on public.topic_proposals for insert to authenticated with check (auth.uid() = user_id and exists (select 1 from public.profiles p where p.id = auth.uid() and p.qualified = true));

create index if not exists exam_answers_user_id_created_at_idx on public.exam_answers(user_id, created_at desc);
create index if not exists topic_answers_topic_id_idx on public.topic_answers(topic_id);
create index if not exists comments_topic_answer_id_idx on public.comments(topic_answer_id);
create index if not exists likes_topic_answer_id_idx on public.likes(topic_answer_id);
