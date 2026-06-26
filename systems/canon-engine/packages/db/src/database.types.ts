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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      canon_clusters: {
        Row: {
          account_id: string | null
          archived_at: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          name: string
          slug: string
          tags: string[]
          updated_at: string
          visibility: string
        }
        Insert: {
          account_id?: string | null
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name: string
          slug: string
          tags?: string[]
          updated_at?: string
          visibility?: string
        }
        Update: {
          account_id?: string | null
          archived_at?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          name?: string
          slug?: string
          tags?: string[]
          updated_at?: string
          visibility?: string
        }
        Relationships: []
      }
      canon_docs: {
        Row: {
          content_md: string
          created_at: string | null
          id: string
          metadata: Json | null
          path: string
          search_tsv: unknown
          source: string
          superseded_by_id: string | null
          supersedes_id: string | null
          tenant_id: string
          title: string | null
          updated_at: string | null
          updated_by: string
        }
        Insert: {
          content_md: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          path: string
          search_tsv?: unknown
          source?: string
          superseded_by_id?: string | null
          supersedes_id?: string | null
          tenant_id?: string
          title?: string | null
          updated_at?: string | null
          updated_by?: string
        }
        Update: {
          content_md?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          path?: string
          search_tsv?: unknown
          source?: string
          superseded_by_id?: string | null
          supersedes_id?: string | null
          tenant_id?: string
          title?: string | null
          updated_at?: string | null
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "canon_docs_superseded_by_id_fkey"
            columns: ["superseded_by_id"]
            isOneToOne: false
            referencedRelation: "canon_docs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canon_docs_superseded_by_id_fkey"
            columns: ["superseded_by_id"]
            isOneToOne: false
            referencedRelation: "v_active_canon_docs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canon_docs_supersedes_id_fkey"
            columns: ["supersedes_id"]
            isOneToOne: false
            referencedRelation: "canon_docs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canon_docs_supersedes_id_fkey"
            columns: ["supersedes_id"]
            isOneToOne: false
            referencedRelation: "v_active_canon_docs"
            referencedColumns: ["id"]
          },
        ]
      }
      canon_document_state: {
        Row: {
          folder_id: string
          id: string
          processed_file_ids: string[] | null
          updated_at: string
        }
        Insert: {
          folder_id: string
          id?: string
          processed_file_ids?: string[] | null
          updated_at?: string
        }
        Update: {
          folder_id?: string
          id?: string
          processed_file_ids?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      canon_email_state: {
        Row: {
          account_email: string
          id: string
          last_history_id: string | null
          updated_at: string
        }
        Insert: {
          account_email: string
          id?: string
          last_history_id?: string | null
          updated_at?: string
        }
        Update: {
          account_email?: string
          id?: string
          last_history_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      canon_events: {
        Row: {
          account_name: string | null
          correlation_id: string | null
          created_at: string
          event_type: string
          id: string
          payload: Json | null
          source_ref: string | null
          source_type: string | null
        }
        Insert: {
          account_name?: string | null
          correlation_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          payload?: Json | null
          source_ref?: string | null
          source_type?: string | null
        }
        Update: {
          account_name?: string | null
          correlation_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json | null
          source_ref?: string | null
          source_type?: string | null
        }
        Relationships: []
      }
      canon_query_cache: {
        Row: {
          account_filter: string | null
          agent_role: string
          cache_hit: boolean | null
          created_at: string | null
          id: string
          queried_at: string
          query_hash: string
          query_text: string
          response_text: string
          session_id: string
          sources_searched: string[]
          stale: boolean | null
          ttl_hours: number
        }
        Insert: {
          account_filter?: string | null
          agent_role?: string
          cache_hit?: boolean | null
          created_at?: string | null
          id?: string
          queried_at?: string
          query_hash: string
          query_text: string
          response_text: string
          session_id?: string
          sources_searched?: string[]
          stale?: boolean | null
          ttl_hours?: number
        }
        Update: {
          account_filter?: string | null
          agent_role?: string
          cache_hit?: boolean | null
          created_at?: string | null
          id?: string
          queried_at?: string
          query_hash?: string
          query_text?: string
          response_text?: string
          session_id?: string
          sources_searched?: string[]
          stale?: boolean | null
          ttl_hours?: number
        }
        Relationships: []
      }
      canon_transcript_state: {
        Row: {
          account_email: string
          id: string
          last_polled_at: string | null
          processed_transcripts: string[] | null
          updated_at: string
        }
        Insert: {
          account_email: string
          id?: string
          last_polled_at?: string | null
          processed_transcripts?: string[] | null
          updated_at?: string
        }
        Update: {
          account_email?: string
          id?: string
          last_polled_at?: string | null
          processed_transcripts?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      capture_items: {
        Row: {
          account_id: string | null
          body: string | null
          created_at: string
          created_by: string | null
          engagement_id: string | null
          id: string
          item_type: Database["public"]["Enums"]["capture_item_type"]
          loop_id: string | null
          metadata: Json | null
          owner_actor_id: string | null
          promoted_to: string | null
          resolved_note: string | null
          session_id: string | null
          source: Database["public"]["Enums"]["capture_item_source"]
          status: Database["public"]["Enums"]["capture_item_status"]
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          account_id?: string | null
          body?: string | null
          created_at?: string
          created_by?: string | null
          engagement_id?: string | null
          id?: string
          item_type: Database["public"]["Enums"]["capture_item_type"]
          loop_id?: string | null
          metadata?: Json | null
          owner_actor_id?: string | null
          promoted_to?: string | null
          resolved_note?: string | null
          session_id?: string | null
          source?: Database["public"]["Enums"]["capture_item_source"]
          status?: Database["public"]["Enums"]["capture_item_status"]
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          account_id?: string | null
          body?: string | null
          created_at?: string
          created_by?: string | null
          engagement_id?: string | null
          id?: string
          item_type?: Database["public"]["Enums"]["capture_item_type"]
          loop_id?: string | null
          metadata?: Json | null
          owner_actor_id?: string | null
          promoted_to?: string | null
          resolved_note?: string | null
          session_id?: string | null
          source?: Database["public"]["Enums"]["capture_item_source"]
          status?: Database["public"]["Enums"]["capture_item_status"]
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      chunks: {
        Row: {
          account_name: string | null
          chunk_index: number
          chunk_text: string
          chunk_tsv: unknown
          created_at: string | null
          direction: string | null
          document_path: string | null
          document_type: string | null
          embedding: string | null
          from_address: string | null
          id: string
          meeting_date: string | null
          meeting_type: string | null
          org: string | null
          participants: string | null
          source_id: string | null
          source_path: string | null
          source_type: string
          speaker: string | null
          subject: string | null
          tags: string | null
          title: string | null
          topics: string | null
        }
        Insert: {
          account_name?: string | null
          chunk_index: number
          chunk_text: string
          chunk_tsv?: unknown
          created_at?: string | null
          direction?: string | null
          document_path?: string | null
          document_type?: string | null
          embedding?: string | null
          from_address?: string | null
          id?: string
          meeting_date?: string | null
          meeting_type?: string | null
          org?: string | null
          participants?: string | null
          source_id?: string | null
          source_path?: string | null
          source_type: string
          speaker?: string | null
          subject?: string | null
          tags?: string | null
          title?: string | null
          topics?: string | null
        }
        Update: {
          account_name?: string | null
          chunk_index?: number
          chunk_text?: string
          chunk_tsv?: unknown
          created_at?: string | null
          direction?: string | null
          document_path?: string | null
          document_type?: string | null
          embedding?: string | null
          from_address?: string | null
          id?: string
          meeting_date?: string | null
          meeting_type?: string | null
          org?: string | null
          participants?: string | null
          source_id?: string | null
          source_path?: string | null
          source_type?: string
          speaker?: string | null
          subject?: string | null
          tags?: string | null
          title?: string | null
          topics?: string | null
        }
        Relationships: []
      }
      cluster_chat_turns: {
        Row: {
          citations: Json | null
          cluster_id: string
          content: string
          created_at: string
          id: string
          model: string | null
          role: string
          session_id: string
          token_usage: Json | null
        }
        Insert: {
          citations?: Json | null
          cluster_id: string
          content: string
          created_at?: string
          id?: string
          model?: string | null
          role: string
          session_id: string
          token_usage?: Json | null
        }
        Update: {
          citations?: Json | null
          cluster_id?: string
          content?: string
          created_at?: string
          id?: string
          model?: string | null
          role?: string
          session_id?: string
          token_usage?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "cluster_chat_turns_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "canon_clusters"
            referencedColumns: ["id"]
          },
        ]
      }
      cluster_items: {
        Row: {
          added_at: string
          cluster_id: string
          error_message: string | null
          external_uri: string | null
          id: string
          note: string | null
          pinned_excerpt: string | null
          source_id: string | null
          source_type: string
          status: string
          title: string | null
          upload_kind: string | null
        }
        Insert: {
          added_at?: string
          cluster_id: string
          error_message?: string | null
          external_uri?: string | null
          id?: string
          note?: string | null
          pinned_excerpt?: string | null
          source_id?: string | null
          source_type: string
          status?: string
          title?: string | null
          upload_kind?: string | null
        }
        Update: {
          added_at?: string
          cluster_id?: string
          error_message?: string | null
          external_uri?: string | null
          id?: string
          note?: string | null
          pinned_excerpt?: string | null
          source_id?: string | null
          source_type?: string
          status?: string
          title?: string | null
          upload_kind?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cluster_items_cluster_id_fkey"
            columns: ["cluster_id"]
            isOneToOne: false
            referencedRelation: "canon_clusters"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          account_name: string | null
          created_at: string | null
          date: string | null
          document_title: string
          drive_file_id: string | null
          drive_url: string | null
          file_type: string | null
          id: string
          key_points: string | null
          org: string | null
          raw_text: string | null
          source_context: string | null
          summary: string | null
          topics: string | null
        }
        Insert: {
          account_name?: string | null
          created_at?: string | null
          date?: string | null
          document_title: string
          drive_file_id?: string | null
          drive_url?: string | null
          file_type?: string | null
          id?: string
          key_points?: string | null
          org?: string | null
          raw_text?: string | null
          source_context?: string | null
          summary?: string | null
          topics?: string | null
        }
        Update: {
          account_name?: string | null
          created_at?: string | null
          date?: string | null
          document_title?: string
          drive_file_id?: string | null
          drive_url?: string | null
          file_type?: string | null
          id?: string
          key_points?: string | null
          org?: string | null
          raw_text?: string | null
          source_context?: string | null
          summary?: string | null
          topics?: string | null
        }
        Relationships: []
      }
      domain_lookup: {
        Row: {
          account_name: string | null
          created_at: string
          domain: string
          id: string
          ignore: boolean | null
        }
        Insert: {
          account_name?: string | null
          created_at?: string
          domain: string
          id?: string
          ignore?: boolean | null
        }
        Update: {
          account_name?: string | null
          created_at?: string
          domain?: string
          id?: string
          ignore?: boolean | null
        }
        Relationships: []
      }
      email_messages: {
        Row: {
          attachment_names: string | null
          body_text: string | null
          cc_addresses: string | null
          created_at: string
          date: string | null
          direction: string | null
          from_address: string | null
          has_attachments: boolean | null
          id: string
          message_id: string
          snippet: string | null
          thread_id: string | null
          to_addresses: string | null
        }
        Insert: {
          attachment_names?: string | null
          body_text?: string | null
          cc_addresses?: string | null
          created_at?: string
          date?: string | null
          direction?: string | null
          from_address?: string | null
          has_attachments?: boolean | null
          id?: string
          message_id: string
          snippet?: string | null
          thread_id?: string | null
          to_addresses?: string | null
        }
        Update: {
          attachment_names?: string | null
          body_text?: string | null
          cc_addresses?: string | null
          created_at?: string
          date?: string | null
          direction?: string | null
          from_address?: string | null
          has_attachments?: boolean | null
          id?: string
          message_id?: string
          snippet?: string | null
          thread_id?: string | null
          to_addresses?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "email_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      email_threads: {
        Row: {
          account_name: string | null
          action_items: string | null
          classification_rationale: string | null
          created_at: string
          delegated_to: string | null
          direction: string | null
          id: string
          importance: number | null
          key_decisions: string | null
          labels: string | null
          message_count: number | null
          participants: string | null
          quadrant: string | null
          signal_status: string | null
          signal_status_changed_at: string | null
          snoozed_until: string | null
          subject: string | null
          thread_id: string
          thread_last_activity: string | null
          thread_start_date: string | null
          thread_summary: string | null
          topics: string | null
          updated_at: string
          urgency: number | null
        }
        Insert: {
          account_name?: string | null
          action_items?: string | null
          classification_rationale?: string | null
          created_at?: string
          delegated_to?: string | null
          direction?: string | null
          id?: string
          importance?: number | null
          key_decisions?: string | null
          labels?: string | null
          message_count?: number | null
          participants?: string | null
          quadrant?: string | null
          signal_status?: string | null
          signal_status_changed_at?: string | null
          snoozed_until?: string | null
          subject?: string | null
          thread_id: string
          thread_last_activity?: string | null
          thread_start_date?: string | null
          thread_summary?: string | null
          topics?: string | null
          updated_at?: string
          urgency?: number | null
        }
        Update: {
          account_name?: string | null
          action_items?: string | null
          classification_rationale?: string | null
          created_at?: string
          delegated_to?: string | null
          direction?: string | null
          id?: string
          importance?: number | null
          key_decisions?: string | null
          labels?: string | null
          message_count?: number | null
          participants?: string | null
          quadrant?: string | null
          signal_status?: string | null
          signal_status_changed_at?: string | null
          snoozed_until?: string | null
          subject?: string | null
          thread_id?: string
          thread_last_activity?: string | null
          thread_start_date?: string | null
          thread_summary?: string | null
          topics?: string | null
          updated_at?: string
          urgency?: number | null
        }
        Relationships: []
      }
      enrichment_configs: {
        Row: {
          config_name: string
          id: string
          max_input_tokens: number | null
          model: string | null
          notes: string | null
          org: string | null
          pipeline_type: string | null
          status: string | null
          system_prompt: string | null
          user_prompt_template: string | null
        }
        Insert: {
          config_name: string
          id?: string
          max_input_tokens?: number | null
          model?: string | null
          notes?: string | null
          org?: string | null
          pipeline_type?: string | null
          status?: string | null
          system_prompt?: string | null
          user_prompt_template?: string | null
        }
        Update: {
          config_name?: string
          id?: string
          max_input_tokens?: number | null
          model?: string | null
          notes?: string | null
          org?: string | null
          pipeline_type?: string | null
          status?: string | null
          system_prompt?: string | null
          user_prompt_template?: string | null
        }
        Relationships: []
      }
      ingestion_manifest: {
        Row: {
          account_name: string | null
          chunk_count: number | null
          chunked_at: string | null
          created_at: string | null
          embedded_at: string | null
          enriched_at: string | null
          enrichment_confidence: number | null
          error_message: string | null
          failed_at: string | null
          id: string
          org: string | null
          received_at: string | null
          source_id: string
          source_size_bytes: number | null
          source_type: string
          status: string
          title: string | null
          updated_at: string | null
        }
        Insert: {
          account_name?: string | null
          chunk_count?: number | null
          chunked_at?: string | null
          created_at?: string | null
          embedded_at?: string | null
          enriched_at?: string | null
          enrichment_confidence?: number | null
          error_message?: string | null
          failed_at?: string | null
          id?: string
          org?: string | null
          received_at?: string | null
          source_id: string
          source_size_bytes?: number | null
          source_type: string
          status?: string
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          account_name?: string | null
          chunk_count?: number | null
          chunked_at?: string | null
          created_at?: string | null
          embedded_at?: string | null
          enriched_at?: string | null
          enrichment_confidence?: number | null
          error_message?: string | null
          failed_at?: string | null
          id?: string
          org?: string | null
          received_at?: string | null
          source_id?: string
          source_size_bytes?: number | null
          source_type?: string
          status?: string
          title?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      paperclip_routing: {
        Row: {
          account_name: string
          agent_label: string | null
          created_at: string
          enabled: boolean
          notes: string | null
          routine_public_id: string
          routine_secret_ref: string
          signing_mode: string
          updated_at: string
        }
        Insert: {
          account_name: string
          agent_label?: string | null
          created_at?: string
          enabled?: boolean
          notes?: string | null
          routine_public_id: string
          routine_secret_ref: string
          signing_mode?: string
          updated_at?: string
        }
        Update: {
          account_name?: string
          agent_label?: string | null
          created_at?: string
          enabled?: boolean
          notes?: string | null
          routine_public_id?: string
          routine_secret_ref?: string
          signing_mode?: string
          updated_at?: string
        }
        Relationships: []
      }
      pipeline_runs: {
        Row: {
          assertions_auto_applied: number | null
          assertions_clarification: number | null
          assertions_in_review: number | null
          assertions_total: number | null
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          signal_id: string | null
          signal_text: string | null
          signal_type: string | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          assertions_auto_applied?: number | null
          assertions_clarification?: number | null
          assertions_in_review?: number | null
          assertions_total?: number | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          signal_id?: string | null
          signal_text?: string | null
          signal_type?: string | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          assertions_auto_applied?: number | null
          assertions_clarification?: number | null
          assertions_in_review?: number | null
          assertions_total?: number | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          signal_id?: string | null
          signal_text?: string | null
          signal_type?: string | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      sync_log: {
        Row: {
          direction: string | null
          error_message: string | null
          id: string
          record_id: string | null
          status: string | null
          synced_at: string | null
          table_name: string
        }
        Insert: {
          direction?: string | null
          error_message?: string | null
          id?: string
          record_id?: string | null
          status?: string | null
          synced_at?: string | null
          table_name: string
        }
        Update: {
          direction?: string | null
          error_message?: string | null
          id?: string
          record_id?: string | null
          status?: string | null
          synced_at?: string | null
          table_name?: string
        }
        Relationships: []
      }
      transcripts: {
        Row: {
          account_name: string | null
          action_items: string | null
          created_at: string
          google_doc_url: string | null
          google_drive_file_id: string | null
          id: string
          key_decisions: string | null
          meeting_date: string | null
          meeting_type: string | null
          participants: string | null
          raw_transcript_text: string | null
          summary: string | null
          topics: string | null
          transcript_title: string | null
          updated_at: string
        }
        Insert: {
          account_name?: string | null
          action_items?: string | null
          created_at?: string
          google_doc_url?: string | null
          google_drive_file_id?: string | null
          id?: string
          key_decisions?: string | null
          meeting_date?: string | null
          meeting_type?: string | null
          participants?: string | null
          raw_transcript_text?: string | null
          summary?: string | null
          topics?: string | null
          transcript_title?: string | null
          updated_at?: string
        }
        Update: {
          account_name?: string | null
          action_items?: string | null
          created_at?: string
          google_doc_url?: string | null
          google_drive_file_id?: string | null
          id?: string
          key_decisions?: string | null
          meeting_date?: string | null
          meeting_type?: string | null
          participants?: string | null
          raw_transcript_text?: string | null
          summary?: string | null
          topics?: string | null
          transcript_title?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      voyage_usage_log: {
        Row: {
          account_id: string | null
          consumer: string | null
          cost_usd: number
          created_at: string
          endpoint: string
          id: string
          model: string
          request_count: number
          result_count: number
        }
        Insert: {
          account_id?: string | null
          consumer?: string | null
          cost_usd?: number
          created_at?: string
          endpoint: string
          id?: string
          model: string
          request_count?: number
          result_count: number
        }
        Update: {
          account_id?: string | null
          consumer?: string | null
          cost_usd?: number
          created_at?: string
          endpoint?: string
          id?: string
          model?: string
          request_count?: number
          result_count?: number
        }
        Relationships: []
      }
      wake_log: {
        Row: {
          account_name: string
          canon_event_id: string
          completed_at: string | null
          created_at: string
          error: string | null
          id: string
          request_payload: Json
          response_body: string | null
          response_status: number | null
          routine_public_id: string
        }
        Insert: {
          account_name: string
          canon_event_id: string
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          request_payload: Json
          response_body?: string | null
          response_status?: number | null
          routine_public_id: string
        }
        Update: {
          account_name?: string
          canon_event_id?: string
          completed_at?: string | null
          created_at?: string
          error?: string | null
          id?: string
          request_payload?: Json
          response_body?: string | null
          response_status?: number | null
          routine_public_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wake_log_canon_event_id_fkey"
            columns: ["canon_event_id"]
            isOneToOne: false
            referencedRelation: "canon_events"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_active_canon_docs: {
        Row: {
          content_md: string | null
          created_at: string | null
          id: string | null
          metadata: Json | null
          path: string | null
          source: string | null
          superseded_by_id: string | null
          supersedes_id: string | null
          tenant_id: string | null
          title: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          content_md?: string | null
          created_at?: string | null
          id?: string | null
          metadata?: Json | null
          path?: string | null
          source?: string | null
          superseded_by_id?: string | null
          supersedes_id?: string | null
          tenant_id?: string | null
          title?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          content_md?: string | null
          created_at?: string | null
          id?: string | null
          metadata?: Json | null
          path?: string | null
          source?: string | null
          superseded_by_id?: string | null
          supersedes_id?: string | null
          tenant_id?: string | null
          title?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "canon_docs_superseded_by_id_fkey"
            columns: ["superseded_by_id"]
            isOneToOne: false
            referencedRelation: "canon_docs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canon_docs_superseded_by_id_fkey"
            columns: ["superseded_by_id"]
            isOneToOne: false
            referencedRelation: "v_active_canon_docs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canon_docs_supersedes_id_fkey"
            columns: ["supersedes_id"]
            isOneToOne: false
            referencedRelation: "canon_docs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "canon_docs_supersedes_id_fkey"
            columns: ["supersedes_id"]
            isOneToOne: false
            referencedRelation: "v_active_canon_docs"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      account_completeness: {
        Args: never
        Returns: {
          account_name: string
          canon_count: number
          document_count: number
          email_count: number
          last_document: string
          last_email: string
          last_transcript: string
          total_embedded: number
          total_failed: number
          transcript_count: number
        }[]
      }
      exec_sql: { Args: { query: string }; Returns: Json }
      fn_canon_chunks_hybrid_search: {
        Args: {
          p_limit?: number
          p_query_embedding: string
          p_query_text: string
          p_rrf_k?: number
          p_source_types?: string[]
        }
        Returns: {
          chunk_id: string
          chunk_index: number
          chunk_text: string
          document_type: string
          from_address: string
          meeting_date: string
          participants: string
          rrf_score: number
          similarity: number
          source_id: string
          source_type: string
          speaker: string
          subject: string
          title: string
        }[]
      }
      fn_cluster_hybrid_search: {
        Args: {
          p_active_item_ids?: string[]
          p_cluster_id: string
          p_limit?: number
          p_query_embedding: string
          p_query_text: string
          p_rrf_k?: number
        }
        Returns: {
          chunk_id: string
          chunk_index: number
          chunk_text: string
          cluster_item_id: string
          document_type: string
          from_address: string
          meeting_date: string
          participants: string
          rrf_score: number
          similarity: number
          source_id: string
          source_type: string
          speaker: string
          subject: string
          title: string
        }[]
      }
      get_paperclip_wake_secret: { Args: { p_name: string }; Returns: string }
      pipeline_health_summary: {
        Args: { p_account?: string; p_days?: number }
        Returns: {
          chunked: number
          embedded: number
          enriched: number
          failed: number
          newest_completed: string
          oldest_pending: string
          received: number
          source_type: string
          total_count: number
        }[]
      }
      recent_ingestions: {
        Args: { p_account?: string; p_limit?: number; p_source_type?: string }
        Returns: {
          account_name: string
          chunk_count: number
          chunked_at: string
          embedded_at: string
          enriched_at: string
          enrichment_confidence: number
          error_message: string
          failed_at: string
          id: string
          received_at: string
          source_id: string
          source_type: string
          status: string
          title: string
        }[]
      }
      run_sql: { Args: { query: string }; Returns: Json }
      save_canon_doc: {
        Args: {
          p_content_md: string
          p_path: string
          p_source?: string
          p_tenant_id: string
          p_updated_by?: string
        }
        Returns: string
      }
      search_canon_docs: {
        Args: { p_limit?: number; p_query: string; p_tenant_id?: string }
        Returns: {
          excerpt: string
          id: string
          path: string
          rank: number
          title: string
        }[]
      }
      search_chunks: {
        Args: {
          filter_account?: string
          filter_org?: string
          filter_source_type?: string
          match_count?: number
          query_embedding: string
        }
        Returns: {
          account_name: string
          chunk_index: number
          chunk_text: string
          direction: string
          from_address: string
          id: string
          meeting_date: string
          meeting_type: string
          org: string
          participants: string
          similarity: number
          source_id: string
          source_path: string
          source_type: string
          speaker: string
          subject: string
          title: string
          topics: string
        }[]
      }
      search_chunks_hybrid: {
        Args: {
          filter_account?: string
          filter_date_from?: string
          filter_date_to?: string
          filter_source_type?: string
          match_count?: number
          query_embedding: string
          query_text: string
        }
        Returns: {
          account_name: string
          chunk_index: number
          chunk_text: string
          direction: string
          from_address: string
          fts_rank: number
          id: string
          meeting_date: string
          meeting_type: string
          org: string
          participants: string
          rrf_score: number
          similarity: number
          source_id: string
          source_path: string
          source_type: string
          speaker: string
          subject: string
          title: string
          topics: string
        }[]
      }
    }
    Enums: {
      capture_item_source: "agent_session" | "manual" | "transcript" | "email"
      capture_item_status:
        | "open"
        | "deferred"
        | "resolved"
        | "promoted"
        | "dismissed"
      capture_item_type:
        | "decision"
        | "question"
        | "option"
        | "issue"
        | "idea"
        | "action_item"
      task_status: "queued" | "running" | "completed" | "failed" | "cancelled"
      task_trigger:
        | "transcript"
        | "email"
        | "agent_route"
        | "schedule"
        | "manual"
        | "webhook"
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
      capture_item_source: ["agent_session", "manual", "transcript", "email"],
      capture_item_status: [
        "open",
        "deferred",
        "resolved",
        "promoted",
        "dismissed",
      ],
      capture_item_type: [
        "decision",
        "question",
        "option",
        "issue",
        "idea",
        "action_item",
      ],
      task_status: ["queued", "running", "completed", "failed", "cancelled"],
      task_trigger: [
        "transcript",
        "email",
        "agent_route",
        "schedule",
        "manual",
        "webhook",
      ],
    },
  },
} as const
