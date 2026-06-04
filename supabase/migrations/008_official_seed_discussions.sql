create extension if not exists "pgcrypto";

alter table public.topics
  add column if not exists is_sample boolean default false not null;

alter table public.topic_answers
  add column if not exists is_sample boolean default false not null;

alter table public.comments
  add column if not exists is_sample boolean default false not null;

create index if not exists topics_is_sample_status_idx on public.topics(is_sample, status, publish_at desc);
create index if not exists topic_answers_is_sample_created_idx on public.topic_answers(is_sample, created_at desc);
create index if not exists comments_is_sample_created_idx on public.comments(is_sample, created_at desc);

insert into auth.users (
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values (
  '11111111-1111-4111-8111-111111111111',
  'authenticated',
  'authenticated',
  'logic-league-official@example.invalid',
  crypt(gen_random_uuid()::text, gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"],"official_sample":true}'::jsonb,
  '{"username":"logic_league_official","display_name":"Logic League 運営","official_sample":true}'::jsonb,
  now(),
  now()
)
on conflict (id) do update set
  raw_user_meta_data = excluded.raw_user_meta_data,
  updated_at = now();

insert into public.profiles (
  id,
  email,
  username,
  display_name,
  bio,
  qualified,
  rating,
  rank,
  archetype,
  created_at,
  updated_at
)
values (
  '11111111-1111-4111-8111-111111111111',
  'logic-league-official@example.invalid',
  'logic_league_official',
  'Logic League 運営',
  'これはLogic League運営による公式サンプル用プロフィールです。実在ユーザーの投稿ではありません。',
  true,
  0,
  'Official',
  'Synthesizer',
  now(),
  now()
)
on conflict (id) do update set
  username = excluded.username,
  display_name = excluded.display_name,
  bio = excluded.bio,
  qualified = excluded.qualified,
  rank = excluded.rank,
  updated_at = now();

insert into public.topics (id, type, category, title, content, status, publish_at, deadline_at, reveal_at, vote_deadline_at, is_sample, created_at)
values
  ('20000000-0000-4000-8000-000000000001','daily','AI','AIに政治判断を任せるべきか','これはLogic League運営によるサンプル議論です。

AIを政治判断に使う場合、データ分析の精度や一貫性が高まる可能性があります。一方で、価値判断、説明責任、少数者保護、データ偏りの問題もあります。どこまでをAIに任せ、どこからを人間が決めるべきかを考えてください。

初めての方は、この議論を参考に回答してみてください。','published',now() - interval '6 days',null,null,null,true,now() - interval '6 days'),
  ('20000000-0000-4000-8000-000000000002','daily','Society','大学教育は無償化すべきか','これはLogic League運営によるサンプル議論です。

大学教育の無償化は、教育機会の平等や人材育成につながる可能性があります。一方で、財源、大学の質、進学しない人との公平性、学歴偏重の強化という論点もあります。制度として成立させる条件まで考えてください。

初めての方は、この議論を参考に回答してみてください。','published',now() - interval '5 days',null,null,null,true,now() - interval '5 days'),
  ('20000000-0000-4000-8000-000000000003','daily','Business','週4日勤務は本当に合理的か','これはLogic League運営によるサンプル議論です。

週4日勤務は、集中力や幸福度を高める可能性があります。一方で、顧客対応、チーム連携、給与水準、生産性維持に課題があります。どの条件なら合理的で、どの条件なら失敗しやすいのかを考えてください。

初めての方は、この議論を参考に回答してみてください。','published',now() - interval '4 days',null,null,null,true,now() - interval '4 days'),
  ('20000000-0000-4000-8000-000000000004','daily','Society','SNSは実名制にするべきか','これはLogic League運営によるサンプル議論です。

SNSの実名制は、誹謗中傷やなりすましを減らす可能性があります。一方で、内部告発、政治的発言、弱い立場の人の安全、表現の自由を損なう恐れもあります。匿名性と責任のバランスを考えてください。

初めての方は、この議論を参考に回答してみてください。','published',now() - interval '3 days',null,null,null,true,now() - interval '3 days'),
  ('20000000-0000-4000-8000-000000000005','daily','Psychology','努力は才能を超えるのか','これはLogic League運営によるサンプル議論です。

努力は成果を大きく左右しますが、初期能力、環境、運、継続できる条件も無視できません。「努力すれば必ず報われる」と言い切ることの効用と危険性を分けて考えてください。

初めての方は、この議論を参考に回答してみてください。','published',now() - interval '2 days',null,null,null,true,now() - interval '2 days'),
  ('20000000-0000-4000-8000-000000000006','weekly','Society','日本は移民をもっと受け入れるべきか','これはLogic League運営によるサンプル競技議論です。

労働力不足、社会保障、地域維持の観点では移民受け入れ拡大に合理性があります。一方で、言語教育、住宅、労働環境、地域コミュニティの摩擦、制度設計の遅れもあります。受け入れの是非だけでなく、どの条件なら持続可能かを論じてください。

初めての方は、この議論を参考に回答してみてください。','published',now() - interval '1 day',now() + interval '6 days',now() - interval '12 hours',now() + interval '10 days',true,now() - interval '1 day'),
  ('20000000-0000-4000-8000-000000000007','weekly','Economics','地方都市の人口減少を止めるには何を優先すべきか','これはLogic League運営によるサンプル競技議論です。

地方都市の人口減少には、雇用、交通、教育、医療、住宅、子育て環境など複数の要因があります。限られた予算で何を優先すべきか、短期効果と長期効果を分けて提案してください。

初めての方は、この議論を参考に回答してみてください。','published',now() - interval '18 hours',now() + interval '7 days',now() - interval '6 hours',now() + interval '11 days',true,now() - interval '18 hours')
on conflict (id) do update set
  title = excluded.title,
  content = excluded.content,
  status = excluded.status,
  publish_at = excluded.publish_at,
  deadline_at = excluded.deadline_at,
  reveal_at = excluded.reveal_at,
  vote_deadline_at = excluded.vote_deadline_at,
  is_sample = excluded.is_sample;

insert into public.topic_answers (id, topic_id, user_id, answer_type, content, ai_structure_score, ai_logic_score, ai_originality_score, ai_feasibility_score, ai_risk_score, ai_total_score, vote_count, final_score, is_anonymous, is_sample, created_at)
values
  ('30000000-0000-4000-8000-000000000001','20000000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111','Answer','公式サンプル回答（構造化型）

結論として、AIに政治判断そのものを任せるべきではありません。ただし、政策案の影響予測、予算配分のシミュレーション、過去データの整理には積極的に使うべきです。

理由は三つあります。第一に、政治判断には効率だけでなく公平性や尊厳などの価値判断が含まれます。第二に、AIの判断根拠が誤っていた場合、誰が責任を負うのかが曖昧になります。第三に、学習データの偏りが特定の集団に不利益を与える可能性があります。

したがって、AIは「決定者」ではなく「論点を可視化する補助者」と位置づけるのが妥当です。',82,84,76,78,80,80,0,null,false,true,now() - interval '5 days 22 hours'),
  ('30000000-0000-4000-8000-000000000002','20000000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111','Answer','公式サンプル回答（反論型）

「AIに任せるのは危険」という主張は正しい面がありますが、人間の政治判断も常に透明で公平だったわけではありません。むしろ密室の意思決定や感情的な世論迎合を減らすために、AIの分析を公開する価値はあります。

重要なのは、AIを排除することではなく、AIの推論過程、使用データ、限界を公開し、人間の代表者が最終責任を持つ制度にすることです。完全委任ではなく、検証可能な共同判断なら導入余地があります。',78,82,79,72,77,78,0,null,false,true,now() - interval '5 days 20 hours'),
  ('30000000-0000-4000-8000-000000000003','20000000-0000-4000-8000-000000000002','11111111-1111-4111-8111-111111111111','Answer','公式サンプル回答（現実重視型）

全面無償化より、低所得層と社会的必要性の高い分野に重点配分する方が現実的です。財源には限りがあり、全員を無条件に無償化すると、教育の質改善や奨学金返済支援に回す予算が薄まる可能性があります。

一方で、家計理由で進学を断念する人を減らすことは社会全体の利益になります。所得連動型支援、地方・医療・教育など人材不足分野への重点支援、卒業後の所得に応じた負担調整を組み合わせるべきです。',81,79,72,85,76,79,0,null,false,true,now() - interval '4 days 22 hours'),
  ('30000000-0000-4000-8000-000000000004','20000000-0000-4000-8000-000000000002','11111111-1111-4111-8111-111111111111','Answer','公式サンプル回答（倫理重視型）

大学教育を受ける機会が親の所得で大きく左右される社会は、公平とは言いにくいです。能力と意欲がある人が経済的理由で進路を閉ざされるなら、社会は潜在能力を失っています。

ただし、無償化は「大学に行く人だけを優遇する制度」になってはいけません。職業教育、専門学校、リスキリングにも同等の支援を広げ、学歴ではなく学び直しの機会を保障する設計が必要です。',76,80,77,73,82,78,0,null,false,true,now() - interval '4 days 20 hours'),
  ('30000000-0000-4000-8000-000000000005','20000000-0000-4000-8000-000000000003','11111111-1111-4111-8111-111111111111','Answer','公式サンプル回答（構造化型）

週4日勤務の合理性は、業種、仕事の分解可能性、成果測定の精度で決まります。

成立しやすいのは、成果物が明確で、会議削減や自動化によって時間を圧縮できる職場です。失敗しやすいのは、営業時間そのものが価値になる接客業や、引き継ぎコストが高い現場です。

つまり週4日勤務は福利厚生ではなく、業務設計の改革です。導入するなら、まず会議、承認、報告の無駄を削り、成果指標を明確にする必要があります。',83,81,74,86,75,80,0,null,false,true,now() - interval '3 days 22 hours'),
  ('30000000-0000-4000-8000-000000000006','20000000-0000-4000-8000-000000000003','11111111-1111-4111-8111-111111111111','Counter','公式サンプル回答（反論型）

週4日勤務は理想的に見えますが、「同じ成果を短い時間で出せる」という前提が強すぎます。現実には、仕事量が変わらないまま稼働日だけ減れば、1日の負荷が上がり、かえって疲弊する可能性があります。

また、余裕のある大企業では成立しても、人員不足の中小企業では代替要員を確保できません。合理性を語るなら、労働時間だけでなく採用力と価格転嫁の問題も同時に見るべきです。',74,80,71,78,83,77,0,null,false,true,now() - interval '3 days 20 hours'),
  ('30000000-0000-4000-8000-000000000007','20000000-0000-4000-8000-000000000004','11111111-1111-4111-8111-111111111111','Answer','公式サンプル回答（倫理重視型）

SNSを全面的に実名制にするべきではありません。匿名性は、弱い立場の人が被害を告発したり、職場や家庭で言えない意見を表明したりするための安全装置でもあります。

ただし、匿名であれば何を言ってもよいわけではありません。投稿者の本人確認をプラットフォーム内部で行い、公開名は匿名を選べるようにしつつ、重大な権利侵害には法的手続きで追跡できる仕組みが現実的です。',79,82,78,75,84,80,0,null,false,true,now() - interval '2 days 22 hours'),
  ('30000000-0000-4000-8000-000000000008','20000000-0000-4000-8000-000000000004','11111111-1111-4111-8111-111111111111','Question','公式サンプル回答（質問型）

実名制を主張する場合、どの問題を最優先で解決したいのかを分ける必要があります。誹謗中傷なのか、詐欺なのか、政治的な世論操作なのかで有効な制度は変わります。

たとえば誹謗中傷対策なら、実名公開よりも通報対応、凍結基準、裁判手続きの迅速化の方が効果的かもしれません。実名制は本当に最小限の制約なのか、代替案と比較して考えるべきです。',77,81,80,74,79,78,0,null,false,true,now() - interval '2 days 20 hours'),
  ('30000000-0000-4000-8000-000000000009','20000000-0000-4000-8000-000000000005','11111111-1111-4111-8111-111111111111','Answer','公式サンプル回答（現実重視型）

努力が才能を超える場面はありますが、常に超えるとは言えません。成果は、才能、努力、環境、タイミングの掛け算で決まるからです。

ただし、努力は自分で変えられる余地が比較的大きい要素です。だから教育や組織では、才能の有無を早く決めつけるより、努力が継続できる環境、良いフィードバック、適切な目標設定を整える方が有益です。',78,80,73,82,74,77,0,null,false,true,now() - interval '1 day 22 hours'),
  ('30000000-0000-4000-8000-000000000010','20000000-0000-4000-8000-000000000005','11111111-1111-4111-8111-111111111111','Counter','公式サンプル回答（反論型）

「努力は才能を超える」と言い切る言葉には注意が必要です。超えられなかった人に対して、努力不足だったという責任を押しつける危険があるからです。

一方で、才能だけを強調すると挑戦する前に諦める人を増やします。より正確には、「努力は才能を伸ばすが、環境と戦略がなければ成果につながりにくい」と表現する方がよいでしょう。',76,83,79,76,82,79,0,null,false,true,now() - interval '1 day 20 hours'),
  ('30000000-0000-4000-8000-000000000011','20000000-0000-4000-8000-000000000006','11111111-1111-4111-8111-111111111111','Answer','公式サンプル回答（構造化型）

移民受け入れは「増やすか減らすか」ではなく、受け入れ能力を作れるかの問題です。

受け入れ拡大の根拠は、労働力不足、介護・建設・農業などの現場維持、地域経済の継続です。一方で、低賃金労働に固定する制度では、本人にも地域にも負担が残ります。

優先すべきは、日本語教育、労働監督、家族帯同、地域の相談窓口です。制度コストを払う覚悟があるなら、段階的な受け入れ拡大は合理的です。',84,82,76,80,81,81,0,null,false,true,now() - interval '16 hours'),
  ('30000000-0000-4000-8000-000000000012','20000000-0000-4000-8000-000000000006','11111111-1111-4111-8111-111111111111','Counter','公式サンプル回答（現実重視型）

拡大には慎重であるべきです。人手不足を移民で補う発想だけでは、賃上げ、省人化、労働環境改善が遅れる可能性があります。

また、教育、医療、住宅、行政通訳の体制が追いつかなければ、摩擦は移民本人と地域住民の双方に押しつけられます。まずは不当な低賃金をなくし、受け入れる人数よりも定着支援の質を指標にするべきです。',78,83,75,79,84,80,0,null,false,true,now() - interval '15 hours'),
  ('30000000-0000-4000-8000-000000000013','20000000-0000-4000-8000-000000000007','11111111-1111-4111-8111-111111111111','Answer','公式サンプル回答（構造化型）

最優先は「若者が残れる仕事」を作ることです。人口減少対策は子育て支援だけでは不十分で、卒業後に戻れる職場がなければ流出は止まりません。

具体策は、地域企業のデジタル化支援、リモート勤務拠点、医療・介護・観光・一次産業の高付加価値化です。交通や住宅支援も重要ですが、安定した所得の見通しがなければ定住にはつながりにくいです。',82,80,78,81,76,79,0,null,false,true,now() - interval '10 hours'),
  ('30000000-0000-4000-8000-000000000014','20000000-0000-4000-8000-000000000007','11111111-1111-4111-8111-111111111111','Answer','公式サンプル回答（倫理重視型）

人口を増やすことだけを目的にすると、住民の生活の質が置き去りになります。まず優先すべきは、今住んでいる人が尊厳を持って暮らせる医療、交通、教育へのアクセスです。

そのうえで、移住者を呼ぶ施策は地域側の都合だけでなく、移住者が孤立しないコミュニティ設計とセットであるべきです。人口維持は目的ではなく、暮らしを守った結果として考えるべきです。',79,81,80,75,83,80,0,null,false,true,now() - interval '9 hours')
on conflict (id) do update set
  content = excluded.content,
  answer_type = excluded.answer_type,
  ai_structure_score = excluded.ai_structure_score,
  ai_logic_score = excluded.ai_logic_score,
  ai_originality_score = excluded.ai_originality_score,
  ai_feasibility_score = excluded.ai_feasibility_score,
  ai_risk_score = excluded.ai_risk_score,
  ai_total_score = excluded.ai_total_score,
  is_sample = excluded.is_sample;

insert into public.comments (id, topic_answer_id, user_id, reply_type, content, is_sample, created_at)
values
  ('40000000-0000-4000-8000-000000000001','30000000-0000-4000-8000-000000000001','11111111-1111-4111-8111-111111111111','question','公式サンプル返信（質問）

「最終責任を人間が持つ」とした場合、AIの提案を覆す基準も事前に公開すべきでしょうか？',true,now() - interval '5 days 18 hours'),
  ('40000000-0000-4000-8000-000000000002','30000000-0000-4000-8000-000000000003','11111111-1111-4111-8111-111111111111','counter','公式サンプル返信（反論）

重点支援は現実的ですが、対象外になった中間層の負担感が強まる点も制度設計に入れる必要があります。',true,now() - interval '4 days 18 hours'),
  ('40000000-0000-4000-8000-000000000003','30000000-0000-4000-8000-000000000005','11111111-1111-4111-8111-111111111111','support','公式サンプル返信（補足）

成果指標を先に設計する、という順序は重要です。単なる休日増ではなく業務改革として扱うべきですね。',true,now() - interval '3 days 18 hours'),
  ('40000000-0000-4000-8000-000000000004','30000000-0000-4000-8000-000000000007','11111111-1111-4111-8111-111111111111','counter','公式サンプル返信（反論）

内部本人確認でも、情報漏えい時のリスクは残ります。安全性の監査もセットで必要になりそうです。',true,now() - interval '2 days 18 hours'),
  ('40000000-0000-4000-8000-000000000005','30000000-0000-4000-8000-000000000009','11111111-1111-4111-8111-111111111111','question','公式サンプル返信（質問）

努力を継続できる環境を整える責任は、本人・家庭・学校・社会のどこに一番あると考えますか？',true,now() - interval '1 day 18 hours'),
  ('40000000-0000-4000-8000-000000000006','30000000-0000-4000-8000-000000000011','11111111-1111-4111-8111-111111111111','support','公式サンプル返信（補足）

人数目標だけでなく、言語教育や相談窓口の整備率を公開指標にする案は参加者が発展させやすそうです。',true,now() - interval '14 hours'),
  ('40000000-0000-4000-8000-000000000007','30000000-0000-4000-8000-000000000013','11111111-1111-4111-8111-111111111111','question','公式サンプル返信（質問）

仕事を最優先にする場合、自治体が直接できることと民間に任せることをどう分けるべきでしょうか？',true,now() - interval '8 hours')
on conflict (id) do update set
  content = excluded.content,
  reply_type = excluded.reply_type,
  is_sample = excluded.is_sample;
