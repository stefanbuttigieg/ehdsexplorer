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
      achievement_definitions: {
        Row: {
          category: string
          created_at: string | null
          description: string
          icon: string
          id: string
          is_active: boolean | null
          name: string
          points: number
          requirement_type: string
          requirement_value: number
          tier: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description: string
          icon?: string
          id: string
          is_active?: boolean | null
          name: string
          points?: number
          requirement_type: string
          requirement_value: number
          tier?: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string
          icon?: string
          id?: string
          is_active?: boolean | null
          name?: string
          points?: number
          requirement_type?: string
          requirement_value?: number
          tier?: string
        }
        Relationships: []
      }
      ai_assistant_conversations: {
        Row: {
          created_at: string
          explain_level_used: string | null
          id: string
          is_favorite: boolean | null
          role_used: string | null
          share_id: string | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          explain_level_used?: string | null
          id?: string
          is_favorite?: boolean | null
          role_used?: string | null
          share_id?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          explain_level_used?: string | null
          id?: string
          is_favorite?: boolean | null
          role_used?: string | null
          share_id?: string | null
          tags?: string[] | null
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
      ai_daily_usage: {
        Row: {
          created_at: string
          daily_limit: number
          id: string
          request_count: number
          updated_at: string
          usage_date: string
        }
        Insert: {
          created_at?: string
          daily_limit?: number
          id?: string
          request_count?: number
          updated_at?: string
          usage_date?: string
        }
        Update: {
          created_at?: string
          daily_limit?: number
          id?: string
          request_count?: number
          updated_at?: string
          usage_date?: string
        }
        Relationships: []
      }
      annex_translations: {
        Row: {
          annex_id: string
          content: string
          created_at: string | null
          id: string
          is_published: boolean | null
          language_code: string
          reviewed_at: string | null
          reviewed_by: string | null
          title: string
          translated_by: string | null
          updated_at: string | null
        }
        Insert: {
          annex_id: string
          content: string
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          language_code: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          title: string
          translated_by?: string | null
          updated_at?: string | null
        }
        Update: {
          annex_id?: string
          content?: string
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          language_code?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          title?: string
          translated_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "annex_translations_annex_id_fkey"
            columns: ["annex_id"]
            isOneToOne: false
            referencedRelation: "annexes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "annex_translations_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
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
      api_keys: {
        Row: {
          country_codes: string[]
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean
          key_hash: string
          key_prefix: string
          last_used_at: string | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          country_codes?: string[]
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash: string
          key_prefix: string
          last_used_at?: string | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          country_codes?: string[]
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean
          key_hash?: string
          key_prefix?: string
          last_used_at?: string | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      api_logs: {
        Row: {
          api_key_id: string | null
          country_code: string | null
          created_at: string
          endpoint: string
          id: string
          ip_address: string | null
          method: string
          obligation_id: string | null
          request_body: Json | null
          response_message: string | null
          status_code: number
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          api_key_id?: string | null
          country_code?: string | null
          created_at?: string
          endpoint: string
          id?: string
          ip_address?: string | null
          method: string
          obligation_id?: string | null
          request_body?: Json | null
          response_message?: string | null
          status_code: number
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          api_key_id?: string | null
          country_code?: string | null
          created_at?: string
          endpoint?: string
          id?: string
          ip_address?: string | null
          method?: string
          obligation_id?: string | null
          request_body?: Json | null
          response_message?: string | null
          status_code?: number
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_logs_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
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
      article_translations: {
        Row: {
          article_id: number
          content: string
          created_at: string | null
          id: string
          is_published: boolean | null
          language_code: string
          reviewed_at: string | null
          reviewed_by: string | null
          title: string
          translated_by: string | null
          updated_at: string | null
        }
        Insert: {
          article_id: number
          content: string
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          language_code: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          title: string
          translated_by?: string | null
          updated_at?: string | null
        }
        Update: {
          article_id?: number
          content?: string
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          language_code?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          title?: string
          translated_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "article_translations_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "article_translations_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      articles: {
        Row: {
          article_number: number
          chapter_id: number | null
          content: string
          created_at: string
          id: number
          is_key_provision: boolean | null
          section_id: number | null
          stakeholder_tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          article_number: number
          chapter_id?: number | null
          content: string
          created_at?: string
          id?: number
          is_key_provision?: boolean | null
          section_id?: number | null
          stakeholder_tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          article_number?: number
          chapter_id?: number | null
          content?: string
          created_at?: string
          id?: number
          is_key_provision?: boolean | null
          section_id?: number | null
          stakeholder_tags?: string[] | null
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
      chapter_translations: {
        Row: {
          chapter_id: number
          created_at: string | null
          description: string | null
          id: string
          is_published: boolean | null
          language_code: string
          reviewed_at: string | null
          reviewed_by: string | null
          title: string
          translated_by: string | null
          updated_at: string | null
        }
        Insert: {
          chapter_id: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          language_code: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          title: string
          translated_by?: string | null
          updated_at?: string | null
        }
        Update: {
          chapter_id?: number
          created_at?: string | null
          description?: string | null
          id?: string
          is_published?: boolean | null
          language_code?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          title?: string
          translated_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chapter_translations_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "chapters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chapter_translations_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
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
      citizen_rights: {
        Row: {
          article_numbers: number[]
          category: string
          created_at: string
          description: string
          icon: string
          id: string
          is_active: boolean
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          article_numbers?: number[]
          category: string
          created_at?: string
          description: string
          icon?: string
          id: string
          is_active?: boolean
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          article_numbers?: number[]
          category?: string
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      country_legislation: {
        Row: {
          adoption_date: string | null
          country_code: string
          country_name: string
          created_at: string | null
          draft_date: string | null
          effective_date: string | null
          ehds_articles_referenced: number[] | null
          enforcement_details: Json | null
          enforcement_measures: string[] | null
          id: string
          implementing_act_ids: string[] | null
          language: string | null
          legislation_type: string | null
          official_title: string | null
          publication_date: string | null
          status: string | null
          status_notes: string | null
          summary: string | null
          tabled_date: string | null
          title: string
          updated_at: string | null
          url: string | null
        }
        Insert: {
          adoption_date?: string | null
          country_code: string
          country_name: string
          created_at?: string | null
          draft_date?: string | null
          effective_date?: string | null
          ehds_articles_referenced?: number[] | null
          enforcement_details?: Json | null
          enforcement_measures?: string[] | null
          id?: string
          implementing_act_ids?: string[] | null
          language?: string | null
          legislation_type?: string | null
          official_title?: string | null
          publication_date?: string | null
          status?: string | null
          status_notes?: string | null
          summary?: string | null
          tabled_date?: string | null
          title: string
          updated_at?: string | null
          url?: string | null
        }
        Update: {
          adoption_date?: string | null
          country_code?: string
          country_name?: string
          created_at?: string | null
          draft_date?: string | null
          effective_date?: string | null
          ehds_articles_referenced?: number[] | null
          enforcement_details?: Json | null
          enforcement_measures?: string[] | null
          id?: string
          implementing_act_ids?: string[] | null
          language?: string | null
          legislation_type?: string | null
          official_title?: string | null
          publication_date?: string | null
          status?: string | null
          status_notes?: string | null
          summary?: string | null
          tabled_date?: string | null
          title?: string
          updated_at?: string | null
          url?: string | null
        }
        Relationships: []
      }
      country_obligation_status: {
        Row: {
          country_code: string
          created_at: string
          evidence_url: string | null
          id: string
          last_verified_at: string | null
          obligation_id: string
          status: Database["public"]["Enums"]["obligation_status"]
          status_notes: string | null
          updated_at: string
        }
        Insert: {
          country_code: string
          created_at?: string
          evidence_url?: string | null
          id?: string
          last_verified_at?: string | null
          obligation_id: string
          status?: Database["public"]["Enums"]["obligation_status"]
          status_notes?: string | null
          updated_at?: string
        }
        Update: {
          country_code?: string
          created_at?: string
          evidence_url?: string | null
          id?: string
          last_verified_at?: string | null
          obligation_id?: string
          status?: Database["public"]["Enums"]["obligation_status"]
          status_notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "country_obligation_status_obligation_id_fkey"
            columns: ["obligation_id"]
            isOneToOne: false
            referencedRelation: "ehds_obligations"
            referencedColumns: ["id"]
          },
        ]
      }
      cross_regulation_references: {
        Row: {
          article_id: number
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          provision_reference: string
          provision_title: string | null
          regulation_name: string
          regulation_short_name: string
          relationship_type: string
          updated_at: string
          url: string | null
        }
        Insert: {
          article_id: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          provision_reference: string
          provision_title?: string | null
          regulation_name: string
          regulation_short_name: string
          relationship_type?: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          article_id?: number
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          provision_reference?: string
          provision_title?: string | null
          regulation_name?: string
          regulation_short_name?: string
          relationship_type?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: []
      }
      definition_sources: {
        Row: {
          created_at: string
          definition_id: number
          id: string
          source: string
          source_article: number | null
          source_text: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          definition_id: number
          id?: string
          source: string
          source_article?: number | null
          source_text: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          definition_id?: number
          id?: string
          source?: string
          source_article?: number | null
          source_text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "definition_sources_definition_id_fkey"
            columns: ["definition_id"]
            isOneToOne: false
            referencedRelation: "definitions"
            referencedColumns: ["id"]
          },
        ]
      }
      definition_translations: {
        Row: {
          created_at: string | null
          definition: string
          definition_id: number
          id: string
          is_published: boolean | null
          language_code: string
          reviewed_at: string | null
          reviewed_by: string | null
          term: string
          translated_by: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          definition: string
          definition_id: number
          id?: string
          is_published?: boolean | null
          language_code: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          term: string
          translated_by?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          definition?: string
          definition_id?: number
          id?: string
          is_published?: boolean | null
          language_code?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          term?: string
          translated_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "definition_translations_definition_id_fkey"
            columns: ["definition_id"]
            isOneToOne: false
            referencedRelation: "definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "definition_translations_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      definitions: {
        Row: {
          created_at: string
          definition: string
          id: number
          source: string | null
          source_article: number | null
          term: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          definition: string
          id?: number
          source?: string | null
          source_article?: number | null
          term: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          definition?: string
          id?: number
          source?: string | null
          source_article?: number | null
          term?: string
          updated_at?: string
        }
        Relationships: []
      }
      ehds_obligations: {
        Row: {
          article_references: string[]
          category: Database["public"]["Enums"]["obligation_category"]
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          article_references?: string[]
          category: Database["public"]["Enums"]["obligation_category"]
          created_at?: string
          description?: string | null
          id: string
          is_active?: boolean
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          article_references?: string[]
          category?: Database["public"]["Enums"]["obligation_category"]
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      ehdsi_kpi_data: {
        Row: {
          approved_at: string
          approved_by: string | null
          country_code: string
          country_name: string
          created_at: string
          id: string
          kpi_category: string
          kpi_id: string
          kpi_name: string
          raw_data: Json | null
          reference_date: string | null
          source_url: string | null
          unit: string | null
          updated_at: string
          value: number | null
        }
        Insert: {
          approved_at?: string
          approved_by?: string | null
          country_code: string
          country_name: string
          created_at?: string
          id?: string
          kpi_category?: string
          kpi_id: string
          kpi_name: string
          raw_data?: Json | null
          reference_date?: string | null
          source_url?: string | null
          unit?: string | null
          updated_at?: string
          value?: number | null
        }
        Update: {
          approved_at?: string
          approved_by?: string | null
          country_code?: string
          country_name?: string
          created_at?: string
          id?: string
          kpi_category?: string
          kpi_id?: string
          kpi_name?: string
          raw_data?: Json | null
          reference_date?: string | null
          source_url?: string | null
          unit?: string | null
          updated_at?: string
          value?: number | null
        }
        Relationships: []
      }
      ehdsi_kpi_staging: {
        Row: {
          country_code: string
          country_name: string
          created_at: string
          fetched_at: string
          id: string
          kpi_category: string
          kpi_id: string
          kpi_name: string
          raw_data: Json | null
          reference_date: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source_url: string | null
          status: string
          unit: string | null
          updated_at: string
          value: number | null
        }
        Insert: {
          country_code: string
          country_name: string
          created_at?: string
          fetched_at?: string
          id?: string
          kpi_category?: string
          kpi_id: string
          kpi_name: string
          raw_data?: Json | null
          reference_date?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_url?: string | null
          status?: string
          unit?: string | null
          updated_at?: string
          value?: number | null
        }
        Update: {
          country_code?: string
          country_name?: string
          created_at?: string
          fetched_at?: string
          id?: string
          kpi_category?: string
          kpi_id?: string
          kpi_name?: string
          raw_data?: Json | null
          reference_date?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_url?: string | null
          status?: string
          unit?: string | null
          updated_at?: string
          value?: number | null
        }
        Relationships: []
      }
      ehdsi_sync_history: {
        Row: {
          completed_at: string | null
          error_message: string | null
          id: string
          records_fetched: number | null
          records_new: number | null
          started_at: string
          status: string
          triggered_by: string | null
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          records_fetched?: number | null
          records_new?: number | null
          started_at?: string
          status?: string
          triggered_by?: string | null
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          records_fetched?: number | null
          records_new?: number | null
          started_at?: string
          status?: string
          triggered_by?: string | null
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
      feature_flags: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_enabled: boolean
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id: string
          is_enabled?: boolean
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_enabled?: boolean
          name?: string
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
      health_authorities: {
        Row: {
          address: string | null
          authority_type: Database["public"]["Enums"]["authority_type"]
          country_code: string
          country_name: string
          created_at: string
          description: string | null
          ehds_role: string | null
          email: string | null
          id: string
          key_contacts: Json | null
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          name: string
          news_updates: Json | null
          phone: string | null
          related_legislation: string[] | null
          status: Database["public"]["Enums"]["authority_status"]
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          authority_type: Database["public"]["Enums"]["authority_type"]
          country_code: string
          country_name: string
          created_at?: string
          description?: string | null
          ehds_role?: string | null
          email?: string | null
          id?: string
          key_contacts?: Json | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          news_updates?: Json | null
          phone?: string | null
          related_legislation?: string[] | null
          status?: Database["public"]["Enums"]["authority_status"]
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          authority_type?: Database["public"]["Enums"]["authority_type"]
          country_code?: string
          country_name?: string
          created_at?: string
          description?: string | null
          ehds_role?: string | null
          email?: string | null
          id?: string
          key_contacts?: Json | null
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          news_updates?: Json | null
          phone?: string | null
          related_legislation?: string[] | null
          status?: Database["public"]["Enums"]["authority_status"]
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      healthcare_patient_rights: {
        Row: {
          article_number: number
          created_at: string
          description: string
          id: string
          is_active: boolean
          practical_implication: string
          right_name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          article_number: number
          created_at?: string
          description: string
          id?: string
          is_active?: boolean
          practical_implication: string
          right_name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          article_number?: number
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean
          practical_implication?: string
          right_name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      healthcare_workflow_steps: {
        Row: {
          action: string
          article_numbers: number[]
          created_at: string
          ehds_reference: string
          id: string
          step_number: number
          updated_at: string
          workflow_id: string
        }
        Insert: {
          action: string
          article_numbers?: number[]
          created_at?: string
          ehds_reference: string
          id?: string
          step_number: number
          updated_at?: string
          workflow_id: string
        }
        Update: {
          action?: string
          article_numbers?: number[]
          created_at?: string
          ehds_reference?: string
          id?: string
          step_number?: number
          updated_at?: string
          workflow_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "healthcare_workflow_steps_workflow_id_fkey"
            columns: ["workflow_id"]
            isOneToOne: false
            referencedRelation: "healthcare_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      healthcare_workflows: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          is_active: boolean
          key_takeaway: string
          scenario: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          icon?: string
          id: string
          is_active?: boolean
          key_takeaway: string
          scenario: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          key_takeaway?: string
          scenario?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      healthtech_compliance_categories: {
        Row: {
          created_at: string
          description: string
          icon: string
          id: string
          is_active: boolean
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          icon?: string
          id: string
          is_active?: boolean
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      healthtech_compliance_items: {
        Row: {
          article_references: number[]
          category_id: string
          created_at: string
          description: string
          evidence_hint: string
          id: string
          is_active: boolean
          priority: string
          requirement: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          article_references?: number[]
          category_id: string
          created_at?: string
          description: string
          evidence_hint: string
          id: string
          is_active?: boolean
          priority?: string
          requirement: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          article_references?: number[]
          category_id?: string
          created_at?: string
          description?: string
          evidence_hint?: string
          id?: string
          is_active?: boolean
          priority?: string
          requirement?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "healthtech_compliance_items_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "healthtech_compliance_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      help_center_faq: {
        Row: {
          answer: string
          category: string
          created_at: string
          id: string
          is_published: boolean
          question: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          answer: string
          category?: string
          created_at?: string
          id?: string
          is_published?: boolean
          question: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          answer?: string
          category?: string
          created_at?: string
          id?: string
          is_published?: boolean
          question?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      implementation_tracker_config: {
        Row: {
          created_at: string
          dha_active_value: number
          dha_inactive_value: number
          dha_pending_value: number
          dha_planned_value: number
          dha_weight: number
          general_weight: number
          hdab_active_value: number
          hdab_inactive_value: number
          hdab_pending_value: number
          hdab_planned_value: number
          hdab_weight: number
          id: string
          legislation_adopted_statuses: string[]
          legislation_weight: number
          primary_use_weight: number
          secondary_use_weight: number
          status_completed_value: number
          status_in_progress_value: number
          status_not_started_value: number
          status_partial_value: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          created_at?: string
          dha_active_value?: number
          dha_inactive_value?: number
          dha_pending_value?: number
          dha_planned_value?: number
          dha_weight?: number
          general_weight?: number
          hdab_active_value?: number
          hdab_inactive_value?: number
          hdab_pending_value?: number
          hdab_planned_value?: number
          hdab_weight?: number
          id?: string
          legislation_adopted_statuses?: string[]
          legislation_weight?: number
          primary_use_weight?: number
          secondary_use_weight?: number
          status_completed_value?: number
          status_in_progress_value?: number
          status_not_started_value?: number
          status_partial_value?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          created_at?: string
          dha_active_value?: number
          dha_inactive_value?: number
          dha_pending_value?: number
          dha_planned_value?: number
          dha_weight?: number
          general_weight?: number
          hdab_active_value?: number
          hdab_inactive_value?: number
          hdab_pending_value?: number
          hdab_planned_value?: number
          hdab_weight?: number
          id?: string
          legislation_adopted_statuses?: string[]
          legislation_weight?: number
          primary_use_weight?: number
          secondary_use_weight?: number
          status_completed_value?: number
          status_in_progress_value?: number
          status_not_started_value?: number
          status_partial_value?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      implementing_act_article_translations: {
        Row: {
          article_id: string
          content: string
          created_at: string | null
          id: string
          is_published: boolean | null
          language_code: string
          reviewed_at: string | null
          reviewed_by: string | null
          title: string
          translated_by: string | null
          updated_at: string | null
        }
        Insert: {
          article_id: string
          content: string
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          language_code: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          title: string
          translated_by?: string | null
          updated_at?: string | null
        }
        Update: {
          article_id?: string
          content?: string
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          language_code?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          title?: string
          translated_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "implementing_act_article_translations_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "implementing_act_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "implementing_act_article_translations_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
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
      implementing_act_recital_translations: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_published: boolean | null
          language_code: string
          recital_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          translated_by: string | null
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          language_code: string
          recital_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          translated_by?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          language_code?: string
          recital_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          translated_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "implementing_act_recital_translations_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "implementing_act_recital_translations_recital_id_fkey"
            columns: ["recital_id"]
            isOneToOne: false
            referencedRelation: "implementing_act_recitals"
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
      implementing_act_translations: {
        Row: {
          created_at: string | null
          description: string
          id: string
          implementing_act_id: string
          is_published: boolean | null
          language_code: string
          reviewed_at: string | null
          reviewed_by: string | null
          title: string
          translated_by: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          implementing_act_id: string
          is_published?: boolean | null
          language_code: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          title: string
          translated_by?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          implementing_act_id?: string
          is_published?: boolean | null
          language_code?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          title?: string
          translated_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "implementing_act_translations_implementing_act_id_fkey"
            columns: ["implementing_act_id"]
            isOneToOne: false
            referencedRelation: "implementing_acts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "implementing_act_translations_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
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
          themes: string[] | null
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
          themes?: string[] | null
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
          themes?: string[] | null
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
          project_type: string
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
          project_type?: string
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
          project_type?: string
          related_articles?: number[] | null
          related_implementing_acts?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      languages: {
        Row: {
          code: string
          created_at: string | null
          is_active: boolean | null
          name: string
          native_name: string
          sort_order: number | null
          updated_at: string | null
        }
        Insert: {
          code: string
          created_at?: string | null
          is_active?: boolean | null
          name: string
          native_name: string
          sort_order?: number | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string | null
          is_active?: boolean | null
          name?: string
          native_name?: string
          sort_order?: number | null
          updated_at?: string | null
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
      news_summary_translations: {
        Row: {
          created_at: string | null
          id: string
          is_published: boolean | null
          language_code: string
          news_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          summary: string
          title: string
          translated_by: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          language_code: string
          news_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          summary: string
          title: string
          translated_by?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          language_code?: string
          news_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          summary?: string
          title?: string
          translated_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "news_summary_translations_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "news_summary_translations_news_id_fkey"
            columns: ["news_id"]
            isOneToOne: false
            referencedRelation: "news_summaries"
            referencedColumns: ["id"]
          },
        ]
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
      onboarding_steps: {
        Row: {
          created_at: string
          description: string
          icon: string | null
          id: string
          is_active: boolean | null
          step_order: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          step_order: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          step_order?: number
          title?: string
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
      plain_language_feedback: {
        Row: {
          comment: string | null
          created_at: string
          feedback_type: string
          id: string
          session_id: string | null
          translation_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          feedback_type: string
          id?: string
          session_id?: string | null
          translation_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          feedback_type?: string
          id?: string
          session_id?: string | null
          translation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plain_language_feedback_translation_id_fkey"
            columns: ["translation_id"]
            isOneToOne: false
            referencedRelation: "plain_language_translations"
            referencedColumns: ["id"]
          },
        ]
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
          preferred_ai_role: string | null
          preferred_explain_level: string | null
          stakeholder_filter: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          preferred_ai_role?: string | null
          preferred_explain_level?: string | null
          stakeholder_filter?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          preferred_ai_role?: string | null
          preferred_explain_level?: string | null
          stakeholder_filter?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      published_works: {
        Row: {
          affiliated_organization: string
          created_at: string
          flag_reason: string | null
          flagged_at: string | null
          flagged_by: string | null
          id: string
          is_auto_discovered: boolean | null
          is_flagged: boolean | null
          link: string
          name: string
          related_articles: number[] | null
          related_implementing_acts: string[] | null
          source_url: string | null
          updated_at: string
        }
        Insert: {
          affiliated_organization: string
          created_at?: string
          flag_reason?: string | null
          flagged_at?: string | null
          flagged_by?: string | null
          id?: string
          is_auto_discovered?: boolean | null
          is_flagged?: boolean | null
          link: string
          name: string
          related_articles?: number[] | null
          related_implementing_acts?: string[] | null
          source_url?: string | null
          updated_at?: string
        }
        Update: {
          affiliated_organization?: string
          created_at?: string
          flag_reason?: string | null
          flagged_at?: string | null
          flagged_by?: string | null
          id?: string
          is_auto_discovered?: boolean | null
          is_flagged?: boolean | null
          link?: string
          name?: string
          related_articles?: number[] | null
          related_implementing_acts?: string[] | null
          source_url?: string | null
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
      recital_translations: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_published: boolean | null
          language_code: string
          recital_id: number
          reviewed_at: string | null
          reviewed_by: string | null
          translated_by: string | null
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          language_code: string
          recital_id: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          translated_by?: string | null
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          language_code?: string
          recital_id?: number
          reviewed_at?: string | null
          reviewed_by?: string | null
          translated_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recital_translations_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "recital_translations_recital_id_fkey"
            columns: ["recital_id"]
            isOneToOne: false
            referencedRelation: "recitals"
            referencedColumns: ["id"]
          },
        ]
      }
      recitals: {
        Row: {
          content: string
          created_at: string
          id: number
          recital_number: number
          related_articles: number[] | null
          stakeholder_tags: string[] | null
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: number
          recital_number: number
          related_articles?: number[] | null
          stakeholder_tags?: string[] | null
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: number
          recital_number?: number
          related_articles?: number[] | null
          stakeholder_tags?: string[] | null
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
      section_translations: {
        Row: {
          created_at: string | null
          id: string
          is_published: boolean | null
          language_code: string
          reviewed_at: string | null
          reviewed_by: string | null
          section_id: number
          title: string
          translated_by: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          language_code: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          section_id: number
          title: string
          translated_by?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          language_code?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          section_id?: number
          title?: string
          translated_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "section_translations_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "section_translations_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "sections"
            referencedColumns: ["id"]
          },
        ]
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
      shared_annotations: {
        Row: {
          annotation_id: string
          id: string
          shared_at: string
          shared_by: string
          team_id: string
        }
        Insert: {
          annotation_id: string
          id?: string
          shared_at?: string
          shared_by: string
          team_id: string
        }
        Update: {
          annotation_id?: string
          id?: string
          shared_at?: string
          shared_by?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_annotations_annotation_id_fkey"
            columns: ["annotation_id"]
            isOneToOne: false
            referencedRelation: "annotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_annotations_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_bookmarks: {
        Row: {
          content_id: string
          content_type: string
          id: string
          shared_at: string
          shared_by: string
          team_id: string
          title: string
        }
        Insert: {
          content_id: string
          content_type: string
          id?: string
          shared_at?: string
          shared_by: string
          team_id: string
          title: string
        }
        Update: {
          content_id?: string
          content_type?: string
          id?: string
          shared_at?: string
          shared_by?: string
          team_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_bookmarks_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      shared_notes: {
        Row: {
          id: string
          note_id: string
          shared_at: string
          shared_by: string
          team_id: string
        }
        Insert: {
          id?: string
          note_id: string
          shared_at?: string
          shared_by: string
          team_id: string
        }
        Update: {
          id?: string
          note_id?: string
          shared_at?: string
          shared_by?: string
          team_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shared_notes_note_id_fkey"
            columns: ["note_id"]
            isOneToOne: false
            referencedRelation: "user_notes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shared_notes_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
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
      team_activity: {
        Row: {
          action: string
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          metadata: Json | null
          team_id: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          metadata?: Json | null
          team_id: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          metadata?: Json | null
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_activity_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      team_memberships: {
        Row: {
          id: string
          joined_at: string
          role: Database["public"]["Enums"]["team_role"]
          team_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["team_role"]
          team_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["team_role"]
          team_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_memberships_team_id_fkey"
            columns: ["team_id"]
            isOneToOne: false
            referencedRelation: "teams"
            referencedColumns: ["id"]
          },
        ]
      }
      teams: {
        Row: {
          avatar_url: string | null
          created_at: string
          created_by: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      topic_article_index: {
        Row: {
          article_numbers: number[]
          category: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          recital_numbers: number[]
          sort_order: number
          stakeholder_type: string
          topic: string
          updated_at: string
        }
        Insert: {
          article_numbers?: number[]
          category: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          recital_numbers?: number[]
          sort_order?: number
          stakeholder_type: string
          topic: string
          updated_at?: string
        }
        Update: {
          article_numbers?: number[]
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          recital_numbers?: number[]
          sort_order?: number
          stakeholder_type?: string
          topic?: string
          updated_at?: string
        }
        Relationships: []
      }
      ui_translations: {
        Row: {
          context: string | null
          created_at: string | null
          id: string
          is_ai_generated: boolean | null
          key: string
          language_code: string
          updated_at: string | null
          value: string
        }
        Insert: {
          context?: string | null
          created_at?: string | null
          id?: string
          is_ai_generated?: boolean | null
          key: string
          language_code: string
          updated_at?: string | null
          value: string
        }
        Update: {
          context?: string | null
          created_at?: string | null
          id?: string
          is_ai_generated?: boolean | null
          key?: string
          language_code?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "ui_translations_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          id: string
          progress: number | null
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          id?: string
          progress?: number | null
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          id?: string
          progress?: number | null
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_country_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          country_code: string
          id: string
          user_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          country_code: string
          id?: string
          user_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          country_code?: string
          id?: string
          user_id?: string
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
      user_language_preferences: {
        Row: {
          created_at: string | null
          id: string
          language_code: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          language_code: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          language_code?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_language_preferences_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
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
      has_team_role: {
        Args: {
          _roles: Database["public"]["Enums"]["team_role"][]
          _team_id: string
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_or_editor: { Args: { _user_id: string }; Returns: boolean }
      is_assigned_to_country: {
        Args: { _country_code: string; _user_id: string }
        Returns: boolean
      }
      is_note_owner: {
        Args: { _note_id: string; _user_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: { _user_id: string }; Returns: boolean }
      is_team_member: {
        Args: { _team_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "editor" | "super_admin"
      authority_status: "active" | "pending" | "planned" | "inactive"
      authority_type: "digital_health_authority" | "health_data_access_body"
      obligation_category: "primary_use" | "secondary_use" | "general"
      obligation_status: "not_started" | "in_progress" | "partial" | "completed"
      team_role: "owner" | "admin" | "member" | "viewer"
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
      authority_status: ["active", "pending", "planned", "inactive"],
      authority_type: ["digital_health_authority", "health_data_access_body"],
      obligation_category: ["primary_use", "secondary_use", "general"],
      obligation_status: ["not_started", "in_progress", "partial", "completed"],
      team_role: ["owner", "admin", "member", "viewer"],
    },
  },
} as const
