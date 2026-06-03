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
    ('AI', 'AIは人間の仕事を増やすのか、奪うのか', '生成AIの発展によって、事務職・企画職・エンジニア・クリエイターなど多くの仕事が変化しています。AIは人間の仕事を奪う存在なのか、それとも新しい仕事を生み出す存在なのか。短期的な失業、長期的な産業変化、教育や再訓練の現実性を踏まえて考えてください。', interval '2 days'),
    ('Business', '週4日勤務は企業にとって本当に合理的か', '週4日勤務は、従業員の集中力や幸福度を高める可能性があります。一方で、顧客対応・チーム連携・給与水準・生産性維持の問題もあります。どのような企業なら週4日勤務が成立し、どのような企業では失敗しやすいのかを考えてください。', interval '1 day'),
    ('Society', '大学教育は無償化すべきか', '大学教育の無償化は、教育機会の平等や人材育成につながる可能性があります。一方で、財源負担、大学の質、進学しない人との公平性、学歴偏重の強化といった問題もあります。大学教育を無償化するべきか、するとしたらどのような制度設計が必要かを考えてください。', interval '0 days')
) as seed(category, title, content, offset_interval)
where not exists (select 1 from public.topics);

update public.topics as topic
set
  title = seed.title,
  content = seed.content
from (
  values
    ('AI', 'Will AI create more jobs than it destroys?', 'AIは人間の仕事を増やすのか、奪うのか', '生成AIの発展によって、事務職・企画職・エンジニア・クリエイターなど多くの仕事が変化しています。AIは人間の仕事を奪う存在なのか、それとも新しい仕事を生み出す存在なのか。短期的な失業、長期的な産業変化、教育や再訓練の現実性を踏まえて考えてください。'),
    ('Business', 'Should companies adopt a 4-day work week?', '週4日勤務は企業にとって本当に合理的か', '週4日勤務は、従業員の集中力や幸福度を高める可能性があります。一方で、顧客対応・チーム連携・給与水準・生産性維持の問題もあります。どのような企業なら週4日勤務が成立し、どのような企業では失敗しやすいのかを考えてください。'),
    ('Society', 'Should university education be free?', '大学教育は無償化すべきか', '大学教育の無償化は、教育機会の平等や人材育成につながる可能性があります。一方で、財源負担、大学の質、進学しない人との公平性、学歴偏重の強化といった問題もあります。大学教育を無償化するべきか、するとしたらどのような制度設計が必要かを考えてください。')
) as seed(category, old_title, title, content)
where topic.type = 'daily'
  and topic.category = seed.category
  and topic.title = seed.old_title;
