import type { Profile, ExamAnswer } from "./logic-league";

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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
