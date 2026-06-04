alter table public.profiles
  add column if not exists show_thought_log_public boolean default true not null,
  add column if not exists show_exam_result_public boolean default true not null,
  add column if not exists show_competitive_history_public boolean default true not null,
  add column if not exists show_achievements_public boolean default true not null;
