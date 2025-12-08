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
      catalog_products: {
        Row: {
          button_text: string | null
          created_at: string | null
          description: string | null
          display_order: number | null
          id: string
          images: string[] | null
          is_visible: boolean | null
          link_type: string | null
          link_url: string | null
          name: string
          price: number | null
          show_images_above: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          button_text?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          images?: string[] | null
          is_visible?: boolean | null
          link_type?: string | null
          link_url?: string | null
          name: string
          price?: number | null
          show_images_above?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          button_text?: string | null
          created_at?: string | null
          description?: string | null
          display_order?: number | null
          id?: string
          images?: string[] | null
          is_visible?: boolean | null
          link_type?: string | null
          link_url?: string | null
          name?: string
          price?: number | null
          show_images_above?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "catalog_products_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_forms: {
        Row: {
          created_at: string
          fields: Json
          id: string
          is_active: boolean
          require_form_fill: boolean
          send_email_notifications: boolean
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          fields?: Json
          id?: string
          is_active?: boolean
          require_form_fill?: boolean
          send_email_notifications?: boolean
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          fields?: Json
          id?: string
          is_active?: boolean
          require_form_fill?: boolean
          send_email_notifications?: boolean
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contact_submissions: {
        Row: {
          email: string | null
          form_id: string
          id: string
          message: string | null
          name: string | null
          phone: string | null
          submitted_at: string
          user_id: string
        }
        Insert: {
          email?: string | null
          form_id: string
          id?: string
          message?: string | null
          name?: string | null
          phone?: string | null
          submitted_at?: string
          user_id: string
        }
        Update: {
          email?: string | null
          form_id?: string
          id?: string
          message?: string | null
          name?: string | null
          phone?: string | null
          submitted_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_submissions_form_id_fkey"
            columns: ["form_id"]
            isOneToOne: false
            referencedRelation: "contact_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_links: {
        Row: {
          created_at: string
          display_order: number
          icon: string | null
          id: string
          is_pulsing: boolean | null
          link_type: string | null
          show_icon_only: boolean | null
          title: string
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          icon?: string | null
          id?: string
          is_pulsing?: boolean | null
          link_type?: string | null
          show_icon_only?: boolean | null
          title: string
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          icon?: string | null
          id?: string
          is_pulsing?: boolean | null
          link_type?: string | null
          show_icon_only?: boolean | null
          title?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      customization_settings: {
        Row: {
          background_color: string | null
          background_image_url: string | null
          background_type: string | null
          created_at: string | null
          id: string
          item_color: string | null
          item_corner_radius: number | null
          item_opacity: number | null
          text_color: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          background_color?: string | null
          background_image_url?: string | null
          background_type?: string | null
          created_at?: string | null
          id?: string
          item_color?: string | null
          item_corner_radius?: number | null
          item_opacity?: number | null
          text_color?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          background_color?: string | null
          background_image_url?: string | null
          background_type?: string | null
          created_at?: string | null
          id?: string
          item_color?: string | null
          item_corner_radius?: number | null
          item_opacity?: number | null
          text_color?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      pix_keys: {
        Row: {
          created_at: string | null
          display_order: number | null
          id: string
          key_type: string
          key_value: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          key_type: string
          key_value: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          display_order?: number | null
          id?: string
          key_type?: string
          key_value?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pix_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          access_key: string | null
          bio: string | null
          company: string | null
          created_at: string
          custom_slug: string | null
          email: string | null
          facebook_url: string | null
          full_name: string
          google_reviews_url: string | null
          id: string
          instagram_handle: string | null
          linkedin_url: string | null
          location: string | null
          phone: string | null
          pix_beneficiary_city: string | null
          pix_beneficiary_name: string | null
          pix_key: string | null
          pix_key_type: string | null
          position: string | null
          profile_image_url: string | null
          show_search_on_catalog: boolean | null
          spotify_url: string | null
          tiktok_handle: string | null
          twitter_handle: string | null
          updated_at: string
          website: string | null
          whatsapp_number: string | null
          youtube_url: string | null
        }
        Insert: {
          access_key?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string
          custom_slug?: string | null
          email?: string | null
          facebook_url?: string | null
          full_name: string
          google_reviews_url?: string | null
          id: string
          instagram_handle?: string | null
          linkedin_url?: string | null
          location?: string | null
          phone?: string | null
          pix_beneficiary_city?: string | null
          pix_beneficiary_name?: string | null
          pix_key?: string | null
          pix_key_type?: string | null
          position?: string | null
          profile_image_url?: string | null
          show_search_on_catalog?: boolean | null
          spotify_url?: string | null
          tiktok_handle?: string | null
          twitter_handle?: string | null
          updated_at?: string
          website?: string | null
          whatsapp_number?: string | null
          youtube_url?: string | null
        }
        Update: {
          access_key?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string
          custom_slug?: string | null
          email?: string | null
          facebook_url?: string | null
          full_name?: string
          google_reviews_url?: string | null
          id?: string
          instagram_handle?: string | null
          linkedin_url?: string | null
          location?: string | null
          phone?: string | null
          pix_beneficiary_city?: string | null
          pix_beneficiary_name?: string | null
          pix_key?: string | null
          pix_key_type?: string | null
          position?: string | null
          profile_image_url?: string | null
          show_search_on_catalog?: boolean | null
          spotify_url?: string | null
          tiktok_handle?: string | null
          twitter_handle?: string | null
          updated_at?: string
          website?: string | null
          whatsapp_number?: string | null
          youtube_url?: string | null
        }
        Relationships: []
      }
      social_links: {
        Row: {
          created_at: string
          display_order: number
          id: string
          platform: string
          show_icon_only: boolean | null
          url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          platform: string
          show_icon_only?: boolean | null
          url: string
          user_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          platform?: string
          show_icon_only?: boolean | null
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_access_key: { Args: never; Returns: string }
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
