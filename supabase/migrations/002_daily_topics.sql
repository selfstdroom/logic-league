drop policy if exists "topics_select_published_daily_anon" on public.topics;
create policy "topics_select_published_daily_anon" on public.topics
  for select to anon
  using (type = 'daily' and status = 'published');

drop policy if exists "topics_select_published_daily_authenticated" on public.topics;
create policy "topics_select_published_daily_authenticated" on public.topics
  for select to authenticated
  using (type = 'daily' and status = 'published');

drop policy if exists "topic_answers_select_daily_anon" on public.topic_answers;
create policy "topic_answers_select_daily_anon" on public.topic_answers
  for select to anon
  using (
    exists (
      select 1 from public.topics t
      where t.id = topic_id and t.type = 'daily' and t.status = 'published'
    )
  );

drop policy if exists "comments_select_daily_anon" on public.comments;
create policy "comments_select_daily_anon" on public.comments
  for select to anon
  using (
    exists (
      select 1
      from public.topic_answers ta
      join public.topics t on t.id = ta.topic_id
      where ta.id = topic_answer_id and t.type = 'daily' and t.status = 'published'
    )
  );

drop policy if exists "likes_select_daily_anon" on public.likes;
create policy "likes_select_daily_anon" on public.likes
  for select to anon
  using (
    exists (
      select 1
      from public.topic_answers ta
      join public.topics t on t.id = ta.topic_id
      where ta.id = topic_answer_id and t.type = 'daily' and t.status = 'published'
    )
  );


drop policy if exists "comments_insert_authenticated_daily" on public.comments;
create policy "comments_insert_authenticated_daily" on public.comments
  for insert to authenticated
  with check (
    auth.uid() = user_id and exists (
      select 1
      from public.topic_answers ta
      join public.topics t on t.id = ta.topic_id
      where ta.id = topic_answer_id and t.type = 'daily' and t.status = 'published'
    )
  );

drop policy if exists "likes_insert_authenticated_daily" on public.likes;
create policy "likes_insert_authenticated_daily" on public.likes
  for insert to authenticated
  with check (
    auth.uid() = user_id and exists (
      select 1
      from public.topic_answers ta
      join public.topics t on t.id = ta.topic_id
      where ta.id = topic_answer_id and t.type = 'daily' and t.status = 'published'
    )
  );

insert into public.topics (type, category, title, content, status, publish_at)
select 'daily', seed.category, seed.title, seed.content, 'published', now() - seed.offset_interval
from (
  values
    ('AI', 'Will AI create more jobs than it destroys?', 'AI is changing the labor market at software speed. Consider whether productivity gains, new industries, displacement costs, and retraining realities make net job creation more likely than net job loss.', interval '2 days'),
    ('Business', 'Should companies adopt a 4-day work week?', 'A 4-day work week promises better focus and well-being, but may create customer coverage, coordination, and wage trade-offs. Argue when it should or should not become standard.', interval '1 day'),
    ('Society', 'Should university education be free?', 'Free university education could expand opportunity and human capital, while raising questions about public budgets, fairness to non-students, and institutional incentives. Evaluate the strongest policy design.', interval '0 days')
) as seed(category, title, content, offset_interval)
where not exists (select 1 from public.topics);
