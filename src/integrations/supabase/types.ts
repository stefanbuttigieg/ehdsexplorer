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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ai_assistant_conversations: {
        Row: {
          created_at: string
          id: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_assistant_feedback: {
        Row: {
          created_at: string
          feedback_type: string
          id: string
          message_content: string
          user_id: string
          user_query: string
        }
        Insert: {
          created_at?: string
          feedback_type: string
          id?: string
          message_content: string
          user_id: string
          user_query: string
        }
        Update: {
          created_at?: string
          feedback_type?: string
          id?: string
          message_content?: string
          user_id?: string
          user_query?: string
        }
        Relationships: []
      }
      ai_assistant_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          role: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          role: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_assistant_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_assistant_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      annexes: {
        Row: {
          content: string
          created_at: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      annotation_tag_links: {
        Row: {
          annotation_id: string
          tag_id: string
        }
        Insert: {
          annotation_id: string
          tag_id: string
        }
        Update: {
          annotation_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "annotation_tag_links_annotation_id_fkey"
            columns: ["annotation_id"]
            isOneToOne: false
            referencedRelation: "annotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "annotation_tag_links_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "annotation_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      annotation_tags: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      annotations: {
        Row: {
          comment: string | null
          content_id: string
          content_type: string
          created_at: string
          end_offset: number
          highlight_color: string | null
          id: string
          selected_text: string
          start_offset: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          content_id: string
          content_type: string
          created_at?: string
          end_offset: number
          highlight_color?: string | null
          id?: string
          selected_text: string
          start_offset: number
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          content_id?: string
          content_type?: string
          created_at?: string
          end_offset?: number
          highlight_color?: string | null
          id?: string
          selected_text?: string
          start_offset?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      api_rate_limits: {
        Row: {
          created_at: string
          id: string
          ip_address: string
          request_count: number
          window_start: string
        }
        Insert: {
          created_at?: string
          id?: string
          ip_address: string
          request_count?: number
          window_start?: string
        }
        Update: {
          created_at?: string
          id?: string
          ip_address?: string
          request_count?: number
          window_start?: string
        }
        Relationships: []
      }
      articles: {
        Row: {
          article_number: number
          chapter_id: number | null
          content: string
          created_at: string
          id: number
          section_id: number | null
          title: string
          updated_at: string
        }
        Insert: {
          article_number: number
          chapter_id?: number | null
          content: string
          created_at?: string
          id?: number
          section_id?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          article_number?: number
          chapter_id?: number | null
          content?: string
          created_at?: string
          id?: number
          section_id?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "articles_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
      }
      chapters: {
        Row: {
          chapter_number: number
          created_at: string
          description: string | null
          id: number
          title: string
          updated_at: string
        }
        Insert: {
          chapter_number: number
          created_at?: string
          description?: string | null
          id?: number
          title: string
          updated_at?: string
        }
        Update: {
          chapter_number?: number
          created_at?: string
          description?: string | null
          id?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      definitions: {
        Row: {
          created_at: string
          definition: string
          id: number
          source_article: number | null
          term: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          definition: string
          id?: number
          source_article?: number | null
          term: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          definition?: string
          id?: number
          source_article?: number | null
          term?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_templates: {
        Row: {
          available_variables: string[]
          body_html: string
          created_at: string
          description: string | null
          id: string
          name: string
          subject: string
          updated_at: string
        }
        Insert: {
          available_variables?: string[]
          body_html: string
          created_at?: string
          description?: string | null
          id: string
          name: string
          subject: string
          updated_at?: string
        }
        Update: {
          available_variables?: string[]
          body_html?: string
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      footnotes: {
        Row: {
          article_id: number | null
          content: string
          created_at: string
          id: string
          marker: string
          recital_id: number | null
          updated_at: string
        }
        Insert: {
          article_id?: number | null
          content: string
          created_at?: string
          id?: string
          marker: string
          recital_id?: number | null
          updated_at?: string
        }
        Update: {
          article_id?: number | null
          content?: string
          created_at?: string
          id?: string
          marker?: string
          recital_id?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "footnotes_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "footnotes_recital_id_fkey"
            columns: ["recital_id"]
            isOneToOne: false
            referencedRelation: "recitals"
            referencedColumns: ["id"]
          },
        ]
      }
      implementing_act_articles: {
        Row: {
          article_number: number
          content: string
          created_at: string
          id: string
          implementing_act_id: string
          section_id: string | null
          title: string
          updated_at: string
        }
        Insert: {
          article_number: number
          content: string
          created_at?: string
          id?: string
          implementing_act_id: string
          section_id?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          article_number?: number
          content?: string
          created_at?: string
          id?: string
          implementing_act_id?: string
          section_id?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "implementing_act_articles_implementing_act_id_fkey"
            columns: ["implementing_act_id"]
            isOneToOne: false
            referencedRelation: "implementing_acts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "implementing_act_articles_section_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "implementing_act_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      implementing_act_recitals: {
        Row: {
          content: string
          created_at: string
          id: string
          implementing_act_id: string
          recital_number: number
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          implementing_act_id: string
          recital_number: number
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          implementing_act_id?: string
          recital_number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "implementing_act_recitals_implementing_act_id_fkey"
            columns: ["implementing_act_id"]
            isOneToOne: false
            referencedRelation: "implementing_acts"
            referencedColumns: ["id"]
          },
        ]
      }
      implementing_act_sections: {
        Row: {
          created_at: string
          id: string
          implementing_act_id: string
          section_number: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          implementing_act_id: string
          section_number: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          implementing_act_id?: string
          section_number?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "implementing_act_sections_implementing_act_id_fkey"
            columns: ["implementing_act_id"]
            isOneToOne: false
            referencedRelation: "implementing_acts"
            referencedColumns: ["id"]
          },
        ]
      }
      implementing_act_subscriptions: {
        Row: {
          created_at: string
          email: string
          id: string
          implementing_act_id: string | null
          subscribe_all: boolean
          unsubscribe_token: string
          verification_token: string | null
          verified: boolean
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          implementing_act_id?: string | null
          subscribe_all?: boolean
          unsubscribe_token?: string
          verification_token?: string | null
          verified?: boolean
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          implementing_act_id?: string | null
          subscribe_all?: boolean
          unsubscribe_token?: string
          verification_token?: string | null
          verified?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "implementing_act_subscriptions_implementing_act_id_fkey"
            columns: ["implementing_act_id"]
            isOneToOne: false
            referencedRelation: "implementing_acts"
            referencedColumns: ["id"]
          },
        ]
      }
      implementing_acts: {
        Row: {
          article_reference: string
          created_at: string
          deliverable_link: string | null
          description: string
          feedback_deadline: string | null
          id: string
          official_link: string | null
          previous_status: string | null
          related_articles: number[] | null
          status: string
          theme: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          article_reference: string
          created_at?: string
          deliverable_link?: string | null
          description: string
          feedback_deadline?: string | null
          id: string
          official_link?: string | null
          previous_status?: string | null
          related_articles?: number[] | null
          status: string
          theme: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          article_reference?: string
          created_at?: string
          deliverable_link?: string | null
          description?: string
          feedback_deadline?: string | null
          id?: string
          official_link?: string | null
          previous_status?: string | null
          related_articles?: number[] | null
          status?: string
          theme?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      joint_action_deliverables: {
        Row: {
          created_at: string
          deliverable_link: string
          deliverable_name: string
          id: string
          joint_action_name: string
          related_articles: number[] | null
          related_implementing_acts: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          deliverable_link: string
          deliverable_name: string
          id?: string
          joint_action_name: string
          related_articles?: number[] | null
          related_implementing_acts?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          deliverable_link?: string
          deliverable_name?: string
          id?: string
          joint_action_name?: string
          related_articles?: number[] | null
          related_implementing_acts?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      news_summaries: {
        Row: {
          created_at: string
          generated_by: string | null
          id: string
          is_published: boolean
          sources: string[] | null
          summary: string
          title: string
          updated_at: string
          week_end: string
          week_start: string
        }
        Insert: {
          created_at?: string
          generated_by?: string | null
          id?: string
          is_published?: boolean
          sources?: string[] | null
          summary: string
          title: string
          updated_at?: string
          week_end: string
          week_start: string
        }
        Update: {
          created_at?: string
          generated_by?: string | null
          id?: string
          is_published?: boolean
          sources?: string[] | null
          summary?: string
          title?: string
          updated_at?: string
          week_end?: string
          week_start?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          is_active: boolean
          message: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          message: string
          title: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          message?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      page_content: {
        Row: {
          content: Json
          created_at: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          id: string
          title: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      plain_language_translations: {
        Row: {
          content_id: number
          content_type: string
          created_at: string
          generated_by: string
          id: string
          is_published: boolean
          plain_language_text: string
          reviewed_at: string | null
          reviewed_by: string | null
          updated_at: string
        }
        Insert: {
          content_id: number
          content_type: string
          created_at?: string
          generated_by?: string
          id?: string
          is_published?: boolean
          plain_language_text: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          updated_at?: string
        }
        Update: {
          content_id?: number
          content_type?: string
          created_at?: string
          generated_by?: string
          id?: string
          is_published?: boolean
          plain_language_text?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      published_works: {
        Row: {
          affiliated_organization: string
          created_at: string
          id: string
          link: string
          name: string
          related_articles: number[] | null
          related_implementing_acts: string[] | null
          updated_at: string
        }
        Insert: {
          affiliated_organization: string
          created_at?: string
          id?: string
          link: string
          name: string
          related_articles?: number[] | null
          related_implementing_acts?: string[] | null
          updated_at?: string
        }
        Update: {
          affiliated_organization?: string
          created_at?: string
          id?: string
          link?: string
          name?: string
          related_articles?: number[] | null
          related_implementing_acts?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      qa_test_results: {
        Row: {
          checks: Json
          created_at: string
          failed: number
          id: string
          passed: number
          pending: number
          run_at: string
          run_by: string | null
          total_checks: number
        }
        Insert: {
          checks?: Json
          created_at?: string
          failed: number
          id?: string
          passed: number
          pending: number
          run_at?: string
          run_by?: string | null
          total_checks: number
        }
        Update: {
          checks?: Json
          created_at?: string
          failed?: number
          id?: string
          passed?: number
          pending?: number
          run_at?: string
          run_by?: string | null
          total_checks?: number
        }
        Relationships: []
      }
      recitals: {
        Row: {
          content: string
          created_at: string
          id: number
          recital_number: number
          related_articles: number[] | null
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: number
          recital_number: number
          related_articles?: number[] | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: number
          recital_number?: number
          related_articles?: number[] | null
          updated_at?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          can_create: boolean
          can_delete: boolean
          can_edit: boolean
          can_publish: boolean
          content_type: string
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
        }
        Insert: {
          can_create?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_publish?: boolean
          content_type: string
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Update: {
          can_create?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_publish?: boolean
          content_type?: string
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
        }
        Relationships: []
      }
      sections: {
        Row: {
          chapter_id: number
          created_at: string
          id: number
          section_number: number
          title: string
          updated_at: string
        }
        Insert: {
          chapter_id: number
          created_at?: string
          id?: number
          section_number: number
          title: string
          updated_at?: string
        }
        Update: {
          chapter_id?: number
          created_at?: string
          id?: number
          section_number?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sections_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          id: string
          maintenance_message: string | null
          maintenance_mode: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          maintenance_message?: string | null
          maintenance_mode?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          maintenance_message?: string | null
          maintenance_mode?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      user_invitations: {
        Row: {
          created_at: string
          email: string
          error_message: string | null
          id: string
          invited_by: string | null
          role: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          error_message?: string | null
          id?: string
          invited_by?: string | null
          role: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          error_message?: string | null
          id?: string
          invited_by?: string | null
          role?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          is_pinned: boolean
          related_content: Json | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          related_content?: Json | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          related_content?: Json | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      site_settings_public: {
        Row: {
          id: string | null
          maintenance_message: string | null
          maintenance_mode: boolean | null
          updated_at: string | null
        }
        Insert: {
          id?: string | null
          maintenance_message?: string | null
          maintenance_mode?: boolean | null
          updated_at?: string | null
        }
        Update: {
          id?: string | null
          maintenance_message?: string | null
          maintenance_mode?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_permission: {
        Args: { _action: string; _content_type: string; _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_editor: { Args: { _user_id: string }; Returns: boolean }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "editor" | "super_admin"
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
      app_role: ["admin", "editor", "super_admin"],
    },
  },
} as const
