alter table public.comments
  add column if not exists parent_reply_id uuid references public.comments(id) on delete cascade,
  add column if not exists reply_type text;

update public.comments
set reply_type = 'support'
where reply_type is null;

alter table public.comments
  alter column reply_type set default 'support',
  alter column reply_type set not null;

alter table public.comments
  drop constraint if exists comments_reply_type_check;

alter table public.comments
  add constraint comments_reply_type_check check (reply_type in ('counter', 'rebuttal', 'support', 'question'));

create index if not exists comments_parent_reply_id_idx on public.comments(parent_reply_id);
create index if not exists comments_user_id_created_at_idx on public.comments(user_id, created_at desc);

do $$
begin
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'topics' and policyname = 'topics_select_public') then
    create policy "topics_select_public" on public.topics for select to anon using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'topic_answers' and policyname = 'topic_answers_select_public_daily_or_visible_weekly') then
    create policy "topic_answers_select_public_daily_or_visible_weekly" on public.topic_answers for select to anon using (
      exists (
        select 1 from public.topics t
        where t.id = topic_id and (
          t.type = 'daily' or (t.type = 'weekly' and t.reveal_at is not null and t.reveal_at <= now())
        )
      )
    );
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'comments' and policyname = 'comments_select_public') then
    create policy "comments_select_public" on public.comments for select to anon using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'likes' and policyname = 'likes_select_public') then
    create policy "likes_select_public" on public.likes for select to anon using (true);
  end if;
end $$;
