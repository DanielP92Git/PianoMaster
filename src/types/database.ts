// Database Types for Piano Practice App - Generated from Supabase

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never;
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      graphql: {
        Args: {
          operationName?: string;
          query?: string;
          variables?: Json;
          extensions?: Json;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
  public: {
    Tables: {
      avatars: {
        Row: {
          created_at: string;
          id: string;
          image_url: string | null;
          name: string | null;
        };
        Insert: {
          created_at?: string;
          id?: string;
          image_url?: string | null;
          name?: string | null;
        };
        Update: {
          created_at?: string;
          id?: string;
          image_url?: string | null;
          name?: string | null;
        };
        Relationships: [];
      };
      current_streak: {
        Row: {
          created_at: string;
          id: number;
          streak_count: number | null;
          student_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string;
          id?: number;
          streak_count?: number | null;
          student_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string;
          id?: number;
          streak_count?: number | null;
          student_id?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      games: {
        Row: {
          created_at: string;
          description: string | null;
          icon: string | null;
          id: string;
          name: string | null;
          type: string | null;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          icon?: string | null;
          id: string;
          name?: string | null;
          type?: string | null;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          icon?: string | null;
          id?: string;
          name?: string | null;
          type?: string | null;
        };
        Relationships: [];
      };
      games_categories: {
        Row: {
          created_at: string;
          description: string | null;
          difficulty: string | null;
          id: number;
          name: string | null;
          type: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          difficulty?: string | null;
          id?: number;
          name?: string | null;
          type?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          difficulty?: string | null;
          id?: number;
          name?: string | null;
          type?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      highest_streak: {
        Row: {
          achieved_at: string | null;
          created_at: string;
          id: number;
          streak_count: number;
          student_id: string;
          updated_at: string | null;
        };
        Insert: {
          achieved_at?: string | null;
          created_at?: string;
          id?: number;
          streak_count?: number;
          student_id: string;
          updated_at?: string | null;
        };
        Update: {
          achieved_at?: string | null;
          created_at?: string;
          id?: number;
          streak_count?: number;
          student_id?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      last_practiced_date: {
        Row: {
          created_at: string;
          id: number;
          practiced_at: string | null;
          student_id: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string;
          id?: number;
          practiced_at?: string | null;
          student_id: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string;
          id?: number;
          practiced_at?: string | null;
          student_id?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      practice_sessions: {
        Row: {
          analysis_score: number | null;
          created_at: string;
          duration: number | null;
          goals_completed: Json[] | null;
          goals_worked: Json[] | null;
          has_recording: boolean | null;
          id: number;
          notes_played: number | null;
          recording_description: string | null;
          recording_url: string;
          reviewed_at: string | null;
          status: Database["public"]["Enums"]["practice_session_status"] | null;
          student_id: string | null;
          submitted_at: string | null;
          teacher_feedback: string | null;
          unique_notes: number | null;
        };
        Insert: {
          analysis_score?: number | null;
          created_at?: string;
          duration?: number | null;
          goals_completed?: Json[] | null;
          goals_worked?: Json[] | null;
          has_recording?: boolean | null;
          id?: number;
          notes_played?: number | null;
          recording_description?: string | null;
          recording_url: string;
          reviewed_at?: string | null;
          status?:
            | Database["public"]["Enums"]["practice_session_status"]
            | null;
          student_id?: string | null;
          submitted_at?: string | null;
          teacher_feedback?: string | null;
          unique_notes?: number | null;
        };
        Update: {
          analysis_score?: number | null;
          created_at?: string;
          duration?: number | null;
          goals_completed?: Json[] | null;
          goals_worked?: Json[] | null;
          has_recording?: boolean | null;
          id?: number;
          notes_played?: number | null;
          recording_description?: string | null;
          recording_url?: string;
          reviewed_at?: string | null;
          status?:
            | Database["public"]["Enums"]["practice_session_status"]
            | null;
          student_id?: string | null;
          submitted_at?: string | null;
          teacher_feedback?: string | null;
          unique_notes?: number | null;
        };
        Relationships: [];
      };
      students: {
        Row: {
          avatar_id: string | null;
          created_at: string;
          email: string | null;
          first_name: string | null;
          last_name: string | null;
          id: string;
          level: string | null;
          studying_year: string | null;
          updated_at: string | null;
          username: string | null;
        };
        Insert: {
          avatar_id?: string | null;
          created_at?: string;
          email?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          id: string;
          level?: string | null;
          studying_year?: string | null;
          updated_at?: string | null;
          username?: string | null;
        };
        Update: {
          avatar_id?: string | null;
          created_at?: string;
          email?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          id?: string;
          level?: string | null;
          studying_year?: string | null;
          updated_at?: string | null;
          username?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "students_avatar_id_fkey";
            columns: ["avatar_id"];
            isOneToOne: false;
            referencedRelation: "avatars";
            referencedColumns: ["id"];
          },
        ];
      };
      students_score: {
        Row: {
          created_at: string;
          game_id: string | null;
          game_type: string | null;
          id: string;
          score: number | null;
          student_id: string | null;
        };
        Insert: {
          created_at?: string;
          game_id?: string | null;
          game_type?: string | null;
          id?: string;
          score?: number | null;
          student_id?: string | null;
        };
        Update: {
          created_at?: string;
          game_id?: string | null;
          game_type?: string | null;
          id?: string;
          score?: number | null;
          student_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "students_score_game_id_fkey";
            columns: ["game_id"];
            isOneToOne: false;
            referencedRelation: "games";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "students_score_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: false;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
      students_total_score: {
        Row: {
          created_at: string;
          email: string | null;
          student_id: string;
          total_score: number | null;
          user_email: string | null;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          student_id: string;
          total_score?: number | null;
          user_email?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          student_id?: string;
          total_score?: number | null;
          user_email?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "students_total_score_student_id_fkey";
            columns: ["student_id"];
            isOneToOne: true;
            referencedRelation: "students";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      practice_session_status:
        | "pending_review"
        | "reviewed"
        | "needs_work"
        | "excellent";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

// Extended types for easier use
export type Student = Tables<"students">;
export type Avatar = Tables<"avatars">;
export type Game = Tables<"games">;
export type GameCategory = Tables<"games_categories">;
export type PracticeSession = Tables<"practice_sessions">;
export type StudentScore = Tables<"students_score">;
export type StudentTotalScore = Tables<"students_total_score">;
export type CurrentStreak = Tables<"current_streak">;
export type HighestStreak = Tables<"highest_streak">;
export type LastPracticedDate = Tables<"last_practiced_date">;

// Insert types
export type StudentInsert = TablesInsert<"students">;
export type PracticeSessionInsert = TablesInsert<"practice_sessions">;
export type StudentScoreInsert = TablesInsert<"students_score">;

// Update types
export type StudentUpdate = TablesUpdate<"students">;
export type PracticeSessionUpdate = TablesUpdate<"practice_sessions">;

// Enums
export type PracticeSessionStatus = Enums<"practice_session_status">;
