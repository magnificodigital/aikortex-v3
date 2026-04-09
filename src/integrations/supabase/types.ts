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
      agency_wallets: {
        Row: {
          balance: number
          created_at: string | null
          id: string
          low_balance_alert: number
          total_consumed: number
          total_purchased: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string | null
          id?: string
          low_balance_alert?: number
          total_consumed?: number
          total_purchased?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string | null
          id?: string
          low_balance_alert?: number
          total_consumed?: number
          total_purchased?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      credit_packages: {
        Row: {
          created_at: string | null
          credits: number
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          name: string
          price_brl: number
          sort_order: number | null
        }
        Insert: {
          created_at?: string | null
          credits: number
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          name: string
          price_brl: number
          sort_order?: number | null
        }
        Update: {
          created_at?: string | null
          credits?: number
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          name?: string
          price_brl?: number
          sort_order?: number | null
        }
        Relationships: []
      }
      credit_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string | null
          description: string | null
          id: string
          model: string | null
          payment_id: string | null
          provider: string | null
          session_id: string | null
          tokens_input: number | null
          tokens_output: number | null
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string | null
          description?: string | null
          id?: string
          model?: string | null
          payment_id?: string | null
          provider?: string | null
          session_id?: string | null
          tokens_input?: number | null
          tokens_output?: number | null
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string | null
          description?: string | null
          id?: string
          model?: string | null
          payment_id?: string | null
          provider?: string | null
          session_id?: string | null
          tokens_input?: number | null
          tokens_output?: number | null
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          description: string | null
          due_date: string | null
          id: string
          paid_at: string | null
          payment_id: string | null
          payment_provider: string | null
          status: string | null
          subscription_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          paid_at?: string | null
          payment_id?: string | null
          payment_provider?: string | null
          status?: string | null
          subscription_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          paid_at?: string | null
          payment_id?: string | null
          payment_provider?: string | null
          status?: string | null
          subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_messages: {
        Row: {
          content: string
          created_at: string
          display_name: string
          id: string
          meeting_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          display_name: string
          id?: string
          meeting_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          display_name?: string
          id?: string
          meeting_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_messages_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_participants: {
        Row: {
          created_at: string
          display_name: string
          id: string
          joined_at: string | null
          left_at: string | null
          meeting_id: string
          role: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_name: string
          id?: string
          joined_at?: string | null
          left_at?: string | null
          meeting_id: string
          role?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_name?: string
          id?: string
          joined_at?: string | null
          left_at?: string | null
          meeting_id?: string
          role?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_participants_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meeting_waiting_room: {
        Row: {
          created_at: string
          display_name: string
          guest_id: string
          id: string
          meeting_id: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name: string
          guest_id: string
          id?: string
          meeting_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string
          guest_id?: string
          id?: string
          meeting_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "meeting_waiting_room_meeting_id_fkey"
            columns: ["meeting_id"]
            isOneToOne: false
            referencedRelation: "meetings"
            referencedColumns: ["id"]
          },
        ]
      }
      meetings: {
        Row: {
          created_at: string
          ended_at: string | null
          host_user_id: string
          id: string
          room_id: string
          settings: Json
          started_at: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          ended_at?: string | null
          host_user_id: string
          id?: string
          room_id?: string
          settings?: Json
          started_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          ended_at?: string | null
          host_user_id?: string
          id?: string
          room_id?: string
          settings?: Json
          started_at?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      partner_tiers: {
        Row: {
          certifications_earned: number | null
          clients_served: number | null
          created_at: string | null
          id: string
          notes: string | null
          revenue: number | null
          solutions_published: number | null
          tier: string
          tier_upgraded_at: string | null
          tier_upgraded_by: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          certifications_earned?: number | null
          clients_served?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          revenue?: number | null
          solutions_published?: number | null
          tier?: string
          tier_upgraded_at?: string | null
          tier_upgraded_by?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          certifications_earned?: number | null
          clients_served?: number | null
          created_at?: string | null
          id?: string
          notes?: string | null
          revenue?: number | null
          solutions_published?: number | null
          tier?: string
          tier_upgraded_at?: string | null
          tier_upgraded_by?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          created_at: string | null
          currency: string
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          is_featured: boolean | null
          limits: Json | null
          name: string
          price_monthly: number
          price_yearly: number
          slug: string
          trial_days: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          limits?: Json | null
          name: string
          price_monthly?: number
          price_yearly?: number
          slug: string
          trial_days?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_featured?: boolean | null
          limits?: Json | null
          name?: string
          price_monthly?: number
          price_yearly?: number
          slug?: string
          trial_days?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          is_active: boolean
          role: string
          tenant_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          role?: string
          tenant_type?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_active?: boolean
          role?: string
          tenant_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          billing_cycle: string
          canceled_at: string | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          payment_provider: string | null
          payment_subscription_id: string | null
          plan_id: string
          status: string
          trial_ends_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          billing_cycle?: string
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          payment_provider?: string | null
          payment_subscription_id?: string | null
          plan_id: string
          status?: string
          trial_ends_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          billing_cycle?: string
          canceled_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          payment_provider?: string | null
          payment_subscription_id?: string | null
          plan_id?: string
          status?: string
          trial_ends_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      tier_module_access: {
        Row: {
          has_access: boolean
          id: string
          module_key: string
          sub_features: Json
          tier: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          has_access?: boolean
          id?: string
          module_key: string
          sub_features?: Json
          tier: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          has_access?: boolean
          id?: string
          module_key?: string
          sub_features?: Json
          tier?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      user_agents: {
        Row: {
          agent_type: string
          anthropic_agent_id: string | null
          anthropic_agent_version: number | null
          avatar_url: string | null
          config: Json
          created_at: string
          description: string | null
          id: string
          model: string | null
          name: string
          provider: string
          status: string
          updated_at: string
          use_managed_sessions: boolean
          user_id: string
        }
        Insert: {
          agent_type?: string
          anthropic_agent_id?: string | null
          anthropic_agent_version?: number | null
          avatar_url?: string | null
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          model?: string | null
          name: string
          provider?: string
          status?: string
          updated_at?: string
          use_managed_sessions?: boolean
          user_id: string
        }
        Update: {
          agent_type?: string
          anthropic_agent_id?: string | null
          anthropic_agent_version?: number | null
          avatar_url?: string | null
          config?: Json
          created_at?: string
          description?: string | null
          id?: string
          model?: string | null
          name?: string
          provider?: string
          status?: string
          updated_at?: string
          use_managed_sessions?: boolean
          user_id?: string
        }
        Relationships: []
      }
      user_api_keys: {
        Row: {
          api_key: string
          created_at: string
          id: string
          provider: string
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key: string
          created_at?: string
          id?: string
          provider: string
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key?: string
          created_at?: string
          id?: string
          provider?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_apps: {
        Row: {
          channel: string
          config: Json
          created_at: string
          description: string | null
          files: Json
          id: string
          name: string
          status: string
          tables_schema: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          channel?: string
          config?: Json
          created_at?: string
          description?: string | null
          files?: Json
          id?: string
          name?: string
          status?: string
          tables_schema?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          channel?: string
          config?: Json
          created_at?: string
          description?: string | null
          files?: Json
          id?: string
          name?: string
          status?: string
          tables_schema?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_messages: {
        Row: {
          app_id: string | null
          contact_name: string | null
          content: string
          created_at: string
          direction: string
          from_number: string
          id: string
          message_type: string
          phone_number_id: string | null
          raw_payload: Json | null
          status: string
          timestamp: string | null
          to_number: string | null
          user_id: string | null
          wamid: string | null
        }
        Insert: {
          app_id?: string | null
          contact_name?: string | null
          content?: string
          created_at?: string
          direction?: string
          from_number: string
          id?: string
          message_type?: string
          phone_number_id?: string | null
          raw_payload?: Json | null
          status?: string
          timestamp?: string | null
          to_number?: string | null
          user_id?: string | null
          wamid?: string | null
        }
        Update: {
          app_id?: string | null
          contact_name?: string | null
          content?: string
          created_at?: string
          direction?: string
          from_number?: string
          id?: string
          message_type?: string
          phone_number_id?: string | null
          raw_payload?: Json | null
          status?: string
          timestamp?: string | null
          to_number?: string | null
          user_id?: string | null
          wamid?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "user_apps"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_members: {
        Row: {
          created_at: string | null
          department: string | null
          id: string
          job_title: string | null
          member_user_id: string
          role: string
          status: string
          updated_at: string | null
          workspace_owner_id: string
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          id?: string
          job_title?: string | null
          member_user_id: string
          role?: string
          status?: string
          updated_at?: string | null
          workspace_owner_id: string
        }
        Update: {
          created_at?: string | null
          department?: string | null
          id?: string
          job_title?: string | null
          member_user_id?: string
          role?: string
          status?: string
          updated_at?: string | null
          workspace_owner_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_to_wallet_consumed: {
        Args: { consumed: number; user_uuid: string }
        Returns: undefined
      }
      is_platform_user: { Args: { check_user_id: string }; Returns: boolean }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
