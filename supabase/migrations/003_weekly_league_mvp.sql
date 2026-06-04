alter table public.topic_answers
  add column if not exists ranking_position integer;

create index if not exists topic_answers_topic_ranking_idx on public.topic_answers(topic_id, ranking_position);
create index if not exists weekly_votes_topic_user_idx on public.weekly_votes(topic_id, user_id);

create or replace function public.prevent_duplicate_weekly_answer()
returns trigger language plpgsql as $$
begin
  if exists (select 1 from public.topics where id = new.topic_id and type = 'weekly') then
    if exists (
      select 1 from public.topic_answers
      where topic_id = new.topic_id
        and user_id = new.user_id
        and id <> coalesce(new.id, gen_random_uuid())
    ) then
      raise exception 'Only one submission is allowed per weekly topic.';
    end if;
    new.answer_type = 'Answer';
    new.is_anonymous = true;
  end if;
  return new;
end;
$$;

drop trigger if exists topic_answers_weekly_single_submission on public.topic_answers;
create trigger topic_answers_weekly_single_submission
  before insert or update on public.topic_answers
  for each row execute function public.prevent_duplicate_weekly_answer();

create or replace function public.validate_weekly_vote()
returns trigger language plpgsql as $$
declare
  weekly_topic record;
  answer_owner uuid;
  existing_vote_count integer;
begin
  select * into weekly_topic from public.topics where id = new.topic_id and type = 'weekly';
  if weekly_topic.id is null then
    raise exception 'Weekly topic not found.';
  end if;
  if weekly_topic.deadline_at is null or weekly_topic.deadline_at > now() then
    raise exception 'Voting has not started.';
  end if;
  if weekly_topic.vote_deadline_at is null or weekly_topic.vote_deadline_at <= now() then
    raise exception 'Voting is closed.';
  end if;
  select user_id into answer_owner from public.topic_answers where id = new.topic_answer_id and topic_id = new.topic_id;
  if answer_owner is null then
    raise exception 'Answer not found for weekly topic.';
  end if;
  if answer_owner = new.user_id then
    raise exception 'Self-voting is not allowed.';
  end if;
  select count(*) into existing_vote_count from public.weekly_votes where topic_id = new.topic_id and user_id = new.user_id;
  if existing_vote_count >= 3 then
    raise exception 'Maximum 3 votes are allowed per weekly topic.';
  end if;
  return new;
end;
$$;

drop trigger if exists weekly_votes_validate_mvp on public.weekly_votes;
create trigger weekly_votes_validate_mvp
  before insert on public.weekly_votes
  for each row execute function public.validate_weekly_vote();

insert into public.topics (type, category, title, content, status, publish_at, deadline_at, reveal_at, vote_deadline_at)
select
  'weekly',
  'Society',
  '投票を義務化するべきか',
  '民主主義において、投票を義務化するべきでしょうか。投票率の向上、政治参加の公平性、自由との関係、無関心層の投票による副作用などを踏まえて考察してください。',
  'published',
  now(),
  now() + interval '7 days',
  now() + interval '7 days',
  now() + interval '10 days'
where not exists (
  select 1 from public.topics where type = 'weekly'
);

drop policy if exists "topics_select_published_weekly_anon" on public.topics;
create policy "topics_select_published_weekly_anon" on public.topics
  for select to anon
  using (type = 'weekly' and status = 'published');

drop policy if exists "topic_answers_select_visible_weekly_anon" on public.topic_answers;
create policy "topic_answers_select_visible_weekly_anon" on public.topic_answers
  for select to anon
  using (
    exists (
      select 1 from public.topics t
      where t.id = topic_id
        and t.type = 'weekly'
        and t.status = 'published'
        and t.deadline_at is not null
        and t.deadline_at <= now()
    )
  );

drop policy if exists "topic_answers_select_visible_weekly_authenticated" on public.topic_answers;
create policy "topic_answers_select_visible_weekly_authenticated" on public.topic_answers
  for select to authenticated
  using (
    exists (
      select 1 from public.topics t
      where t.id = topic_id
        and t.type = 'weekly'
        and t.status = 'published'
        and (user_id = auth.uid() or (t.deadline_at is not null and t.deadline_at <= now()))
    )
  );
