import type { Profile, ExamAnswer } from "./logic-league";

export type TopicCategory = "AI" | "Business" | "Economics" | "Society" | "Psychology" | "Science";
export type TopicType = "daily" | "weekly";
export type TopicStatus = "published" | "draft";
export type TopicAnswerType = "Answer" | "Counter" | "Support" | "Question";

export type Topic = {
  id: string;
  type: TopicType;
  category: TopicCategory;
  title: string;
  content: string;
  status: TopicStatus | string;
  publish_at: string | null;
  deadline_at: string | null;
  reveal_at: string | null;
  vote_deadline_at: string | null;
  created_at: string;
};

export type TopicAnswer = {
  id: string;
  topic_id: string;
  user_id: string;
  answer_type: TopicAnswerType | null;
  content: string;
  ai_structure_score: number | null;
  ai_logic_score: number | null;
  ai_originality_score: number | null;
  ai_feasibility_score: number | null;
  ai_risk_score: number | null;
  ai_total_score: number | null;
  vote_count: number;
  final_score: number | null;
  ranking_position: number | null;
  is_anonymous: boolean;
  created_at: string;
};

export type Comment = {
  id: string;
  topic_answer_id: string;
  user_id: string;
  content: string;
  created_at: string;
};

export type Like = {
  id: string;
  topic_answer_id: string;
  user_id: string;
  created_at: string;
};

export type WeeklyVote = {
  id: string;
  topic_id: string;
  topic_answer_id: string;
  user_id: string;
  created_at: string;
};

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Partial<Profile> & { id: string; username: string };
        Update: Partial<Profile>;
        Relationships: [];
      };
      exam_answers: {
        Row: ExamAnswer;
        Insert: Partial<ExamAnswer> & { user_id: string; answer: string };
        Update: Partial<ExamAnswer>;
        Relationships: [];
      };
      topics: {
        Row: Topic;
        Insert: Partial<Topic> & { type: TopicType; category: TopicCategory; title: string; content: string };
        Update: Partial<Topic>;
        Relationships: [];
      };
      topic_answers: {
        Row: TopicAnswer;
        Insert: Partial<TopicAnswer> & { topic_id: string; user_id: string; answer_type: TopicAnswerType; content: string };
        Update: Partial<TopicAnswer>;
        Relationships: [];
      };
      comments: {
        Row: Comment;
        Insert: Partial<Comment> & { topic_answer_id: string; user_id: string; content: string };
        Update: Partial<Comment>;
        Relationships: [];
      };
      likes: {
        Row: Like;
        Insert: Partial<Like> & { topic_answer_id: string; user_id: string };
        Update: Partial<Like>;
        Relationships: [];
      };
      weekly_votes: {
        Row: WeeklyVote;
        Insert: Partial<WeeklyVote> & { topic_id: string; topic_answer_id: string; user_id: string };
        Update: Partial<WeeklyVote>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
