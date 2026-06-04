create table if not exists public.user_settings (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  privacy_profile_public boolean default true not null,
  privacy_thought_log_public boolean default true not null,
  privacy_exam_results_public boolean default true not null,
  privacy_stats_public boolean default true not null,
  privacy_achievements_public boolean default true not null,
  notify_comments boolean default true not null,
  notify_likes boolean default true not null,
  notify_weekly_results boolean default true not null,
  notify_rank_up boolean default true not null,
  notify_achievement_unlocked boolean default true not null,
  notify_hall_of_fame boolean default true not null,
  theme text default 'dark' not null check (theme in ('dark', 'light', 'system')),
  display_density text default 'standard' not null check (display_density in ('standard', 'compact')),
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

alter table public.user_settings enable row level security;

drop policy if exists "user_settings_select_own" on public.user_settings;
create policy "user_settings_select_own" on public.user_settings for select to authenticated using (auth.uid() = user_id);

drop policy if exists "user_settings_insert_own" on public.user_settings;
create policy "user_settings_insert_own" on public.user_settings for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists "user_settings_update_own" on public.user_settings;
create policy "user_settings_update_own" on public.user_settings for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop trigger if exists user_settings_updated_at on public.user_settings;
create trigger user_settings_updated_at before update on public.user_settings for each row execute function public.handle_updated_at();
