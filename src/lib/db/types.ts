// Gerado a partir do schema. Não editar à mão.
// Regenerar: npm run db:types
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      application_emails: {
        Row: {
          application_id: string
          body: string
          created_at: string
          gmail_message_id: string | null
          id: string
          sent_at: string | null
          subject: string
          user_id: string
        }
        Insert: {
          application_id: string
          body: string
          created_at?: string
          gmail_message_id?: string | null
          id?: string
          sent_at?: string | null
          subject: string
          user_id: string
        }
        Update: {
          application_id?: string
          body?: string
          created_at?: string
          gmail_message_id?: string | null
          id?: string
          sent_at?: string | null
          subject?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "application_emails_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      applications: {
        Row: {
          applied_at: string | null
          company: string
          contact_email: string | null
          created_at: string
          follow_up_at: string | null
          id: string
          job_meta: Json
          job_text: string | null
          match_note: string | null
          position: number
          responded_at: string | null
          role: string | null
          source: string | null
          status: Database["public"]["Enums"]["application_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          applied_at?: string | null
          company: string
          contact_email?: string | null
          created_at?: string
          follow_up_at?: string | null
          id?: string
          job_meta?: Json
          job_text?: string | null
          match_note?: string | null
          position?: number
          responded_at?: string | null
          role?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          applied_at?: string | null
          company?: string
          contact_email?: string | null
          created_at?: string
          follow_up_at?: string | null
          id?: string
          job_meta?: Json
          job_text?: string | null
          match_note?: string | null
          position?: number
          responded_at?: string | null
          role?: string | null
          source?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      certifications: {
        Row: {
          id: string
          issuer: string | null
          name: string
          position: number
          user_id: string
        }
        Insert: {
          id?: string
          issuer?: string | null
          name: string
          position?: number
          user_id: string
        }
        Update: {
          id?: string
          issuer?: string | null
          name?: string
          position?: number
          user_id?: string
        }
        Relationships: []
      }
      cv_files: {
        Row: {
          created_at: string
          filename: string
          id: string
          is_current: boolean
          size_bytes: number
          storage_path: string
          user_id: string
        }
        Insert: {
          created_at?: string
          filename: string
          id?: string
          is_current?: boolean
          size_bytes: number
          storage_path: string
          user_id: string
        }
        Update: {
          created_at?: string
          filename?: string
          id?: string
          is_current?: boolean
          size_bytes?: number
          storage_path?: string
          user_id?: string
        }
        Relationships: []
      }
      education: {
        Row: {
          course: string
          id: string
          period: string | null
          position: number
          school: string | null
          user_id: string
        }
        Insert: {
          course: string
          id?: string
          period?: string | null
          position?: number
          school?: string | null
          user_id: string
        }
        Update: {
          course?: string
          id?: string
          period?: string | null
          position?: number
          school?: string | null
          user_id?: string
        }
        Relationships: []
      }
      experiences: {
        Row: {
          company: string | null
          id: string
          note: string | null
          period: string | null
          position: number
          role: string
          user_id: string
        }
        Insert: {
          company?: string | null
          id?: string
          note?: string | null
          period?: string | null
          position?: number
          role: string
          user_id: string
        }
        Update: {
          company?: string | null
          id?: string
          note?: string | null
          period?: string | null
          position?: number
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      google_accounts: {
        Row: {
          connected_at: string
          email: string
          refresh_token: string
          scopes: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          connected_at?: string
          email: string
          refresh_token: string
          scopes?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          connected_at?: string
          email?: string
          refresh_token?: string
          scopes?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_skills: {
        Row: {
          id: string
          position: number
          skill: string
          user_id: string
        }
        Insert: {
          id?: string
          position?: number
          skill: string
          user_id: string
        }
        Update: {
          id?: string
          position?: number
          skill?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          contract: string | null
          created_at: string
          full_name: string | null
          github: string | null
          headline: string | null
          linkedin: string | null
          salary_range: string | null
          seniority: string | null
          summary: string | null
          updated_at: string
          user_id: string
          website: string | null
          work_model: string | null
        }
        Insert: {
          contract?: string | null
          created_at?: string
          full_name?: string | null
          github?: string | null
          headline?: string | null
          linkedin?: string | null
          salary_range?: string | null
          seniority?: string | null
          summary?: string | null
          updated_at?: string
          user_id: string
          website?: string | null
          work_model?: string | null
        }
        Update: {
          contract?: string | null
          created_at?: string
          full_name?: string | null
          github?: string | null
          headline?: string | null
          linkedin?: string | null
          salary_range?: string | null
          seniority?: string | null
          summary?: string | null
          updated_at?: string
          user_id?: string
          website?: string | null
          work_model?: string | null
        }
        Relationships: []
      }
      skill_matches: {
        Row: {
          application_id: string
          id: string
          position: number
          skill: string
          user_id: string
          verdict: Database["public"]["Enums"]["skill_verdict"]
        }
        Insert: {
          application_id: string
          id?: string
          position?: number
          skill: string
          user_id: string
          verdict: Database["public"]["Enums"]["skill_verdict"]
        }
        Update: {
          application_id?: string
          id?: string
          position?: number
          skill?: string
          user_id?: string
          verdict?: Database["public"]["Enums"]["skill_verdict"]
        }
        Relationships: [
          {
            foreignKeyName: "skill_matches_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
        ]
      }
      sprints: {
        Row: {
          ends_on: string | null
          id: string
          name: string
          starts_on: string | null
          user_id: string
        }
        Insert: {
          ends_on?: string | null
          id?: string
          name: string
          starts_on?: string | null
          user_id: string
        }
        Update: {
          ends_on?: string | null
          id?: string
          name?: string
          starts_on?: string | null
          user_id?: string
        }
        Relationships: []
      }
      subtasks: {
        Row: {
          done: boolean
          id: string
          position: number
          task_id: string
          text: string
          user_id: string
        }
        Insert: {
          done?: boolean
          id?: string
          position?: number
          task_id: string
          text: string
          user_id: string
        }
        Update: {
          done?: boolean
          id?: string
          position?: number
          task_id?: string
          text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subtasks_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_activity: {
        Row: {
          actor: Database["public"]["Enums"]["activity_actor"]
          created_at: string
          id: string
          task_id: string
          text: string
          user_id: string
        }
        Insert: {
          actor?: Database["public"]["Enums"]["activity_actor"]
          created_at?: string
          id?: string
          task_id: string
          text: string
          user_id: string
        }
        Update: {
          actor?: Database["public"]["Enums"]["activity_actor"]
          created_at?: string
          id?: string
          task_id?: string
          text?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_activity_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_counters: {
        Row: {
          last_seq: number
          user_id: string
        }
        Insert: {
          last_seq?: number
          user_id: string
        }
        Update: {
          last_seq?: number
          user_id?: string
        }
        Relationships: []
      }
      task_tags: {
        Row: {
          id: string
          tag: string
          task_id: string
          user_id: string
        }
        Insert: {
          id?: string
          tag: string
          task_id: string
          user_id: string
        }
        Update: {
          id?: string
          tag?: string
          task_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_tags_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          application_id: string | null
          color: Database["public"]["Enums"]["task_color"]
          created_at: string
          description: string | null
          due_at: string | null
          estimate: string | null
          id: string
          key: string
          label: string | null
          position: number
          priority: Database["public"]["Enums"]["task_priority"]
          sprint_id: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          application_id?: string | null
          color?: Database["public"]["Enums"]["task_color"]
          created_at?: string
          description?: string | null
          due_at?: string | null
          estimate?: string | null
          id?: string
          key?: string
          label?: string | null
          position?: number
          priority?: Database["public"]["Enums"]["task_priority"]
          sprint_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          application_id?: string | null
          color?: Database["public"]["Enums"]["task_color"]
          created_at?: string
          description?: string | null
          due_at?: string | null
          estimate?: string | null
          id?: string
          key?: string
          label?: string | null
          position?: number
          priority?: Database["public"]["Enums"]["task_priority"]
          sprint_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "applications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      application_metrics: {
        Row: {
          avg_response_days: number | null
          in_process_count: number | null
          responded_count: number | null
          response_rate_pct: number | null
          sent_count: number | null
          user_id: string | null
          week_count: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      replace_profile: { Args: { p_profile: Json }; Returns: undefined }
    }
    Enums: {
      activity_actor: "user" | "ai"
      application_status:
        | "rascunho"
        | "enviada"
        | "em_processo"
        | "entrevista"
        | "oferta"
        | "sem_retorno"
      skill_verdict: "match" | "partial" | "miss"
      task_color: "pine" | "amber" | "blue" | "plum" | "clay" | "slate"
      task_priority: "alta" | "media" | "baixa" | "feito"
      task_status: "backlog" | "todo" | "doing" | "done"
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

export const Constants = {
  public: {
    Enums: {
      activity_actor: ["user", "ai"],
      application_status: [
        "rascunho",
        "enviada",
        "em_processo",
        "entrevista",
        "oferta",
        "sem_retorno",
      ],
      skill_verdict: ["match", "partial", "miss"],
      task_color: ["pine", "amber", "blue", "plum", "clay", "slate"],
      task_priority: ["alta", "media", "baixa", "feito"],
      task_status: ["backlog", "todo", "doing", "done"],
    },
  },
} as const
