export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          applicant_id: string
          cover_letter: string | null
          created_at: string
          id: string
          job_id: string
          resume_url: string | null
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
        }
        Insert: {
          applicant_id: string
          cover_letter?: string | null
          created_at?: string
          id?: string
          job_id: string
          resume_url?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Update: {
          applicant_id?: string
          cover_letter?: string | null
          created_at?: string
          id?: string
          job_id?: string
          resume_url?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          about: string | null
          created_at: string
          id: string
          logo_url: string | null
          name: string
          owner_id: string
          slug: string
          updated_at: string
          website: string | null
        }
        Insert: {
          about?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          owner_id: string
          slug: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          about?: string | null
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          owner_id?: string
          slug?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      job_alerts: {
        Row: {
          created_at: string
          frequency: string
          id: string
          job_type: Database["public"]["Enums"]["job_type"] | null
          last_sent_at: string | null
          level: Database["public"]["Enums"]["job_level"] | null
          query: string
          remote: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          frequency?: string
          id?: string
          job_type?: Database["public"]["Enums"]["job_type"] | null
          last_sent_at?: string | null
          level?: Database["public"]["Enums"]["job_level"] | null
          query?: string
          remote?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          frequency?: string
          id?: string
          job_type?: Database["public"]["Enums"]["job_type"] | null
          last_sent_at?: string | null
          level?: Database["public"]["Enums"]["job_level"] | null
          query?: string
          remote?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      jobs: {
        Row: {
          apply_url: string | null
          company_id: string | null
          created_at: string
          description: string
          embedding: string | null
          id: string
          job_type: Database["public"]["Enums"]["job_type"]
          level: Database["public"]["Enums"]["job_level"]
          location: string | null
          posted_by: string
          published: boolean
          remote: boolean
          salary_currency: string | null
          salary_max: number | null
          salary_min: number | null
          status: Database["public"]["Enums"]["job_status"]
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          apply_url?: string | null
          company_id?: string | null
          created_at?: string
          description: string
          embedding?: string | null
          id?: string
          job_type?: Database["public"]["Enums"]["job_type"]
          level?: Database["public"]["Enums"]["job_level"]
          location?: string | null
          posted_by: string
          published?: boolean
          remote?: boolean
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          status?: Database["public"]["Enums"]["job_status"]
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          apply_url?: string | null
          company_id?: string | null
          created_at?: string
          description?: string
          embedding?: string | null
          id?: string
          job_type?: Database["public"]["Enums"]["job_type"]
          level?: Database["public"]["Enums"]["job_level"]
          location?: string | null
          posted_by?: string
          published?: boolean
          remote?: boolean
          salary_currency?: string | null
          salary_max?: number | null
          salary_min?: number | null
          status?: Database["public"]["Enums"]["job_status"]
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          full_name: string | null
          headline: string | null
          id: string
          resume_url: string | null
          skills: string[] | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          headline?: string | null
          id: string
          resume_url?: string | null
          skills?: string[] | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          full_name?: string | null
          headline?: string | null
          id?: string
          resume_url?: string | null
          skills?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      resumes: {
        Row: {
          created_at: string
          embedding: string | null
          file_name: string
          file_path: string
          id: string
          is_active: boolean
          mime_type: string
          parsed: Json
          raw_text: string | null
          size_bytes: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          embedding?: string | null
          file_name: string
          file_path: string
          id?: string
          is_active?: boolean
          mime_type: string
          parsed?: Json
          raw_text?: string | null
          size_bytes: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          embedding?: string | null
          file_name?: string
          file_path?: string
          id?: string
          is_active?: boolean
          mime_type?: string
          parsed?: Json
          raw_text?: string | null
          size_bytes?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_jobs: {
        Row: {
          created_at: string
          job_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          job_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          job_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_jobs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      match_jobs: {
        Args: { match_count?: number; query_embedding: string }
        Returns: {
          company_id: string
          created_at: string
          description: string
          id: string
          job_type: Database["public"]["Enums"]["job_type"]
          level: Database["public"]["Enums"]["job_level"]
          location: string
          remote: boolean
          salary_max: number
          salary_min: number
          similarity: number
          tags: string[]
          title: string
        }[]
      }
      match_jobs_for_resume: {
        Args: { _limit?: number; _resume_id: string }
        Returns: {
          company_id: string
          created_at: string
          description: string
          id: string
          job_type: Database["public"]["Enums"]["job_type"]
          level: Database["public"]["Enums"]["job_level"]
          location: string
          remote: boolean
          salary_max: number
          salary_min: number
          similarity: number
          tags: string[]
          title: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "employer" | "seeker"
      application_status:
        | "submitted"
        | "reviewing"
        | "interview"
        | "offer"
        | "rejected"
      job_level: "intern" | "junior" | "mid" | "senior" | "lead"
      job_status: "pending" | "live" | "rejected"
      job_type: "full_time" | "part_time" | "contract" | "internship"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "employer", "seeker"],
      application_status: [
        "submitted",
        "reviewing",
        "interview",
        "offer",
        "rejected",
      ],
      job_level: ["intern", "junior", "mid", "senior", "lead"],
      job_status: ["pending", "live", "rejected"],
      job_type: ["full_time", "part_time", "contract", "internship"],
    },
  },
} as const
