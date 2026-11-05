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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      accounts: {
        Row: {
          created_at: string
          id: string
          name: string
          opening_balance: number
          owner_id: string
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          opening_balance?: number
          owner_id?: string
          type?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          opening_balance?: number
          owner_id?: string
          type?: string
        }
        Relationships: []
      }
      activity_logs: {
        Row: {
          action: string
          created_at: string
          entity: string
          entity_id: string | null
          id: string
          owner_id: string
          summary: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity: string
          entity_id?: string | null
          id?: string
          owner_id: string
          summary?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity?: string
          entity_id?: string | null
          id?: string
          owner_id?: string
          summary?: string | null
        }
        Relationships: []
      }
      customer_payments: {
        Row: {
          account_id: string | null
          amount: number
          created_at: string
          customer_id: string
          id: string
          note: string | null
          owner_id: string
          payment_date: string
        }
        Insert: {
          account_id?: string | null
          amount?: number
          created_at?: string
          customer_id: string
          id?: string
          note?: string | null
          owner_id?: string
          payment_date?: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          created_at?: string
          customer_id?: string
          id?: string
          note?: string | null
          owner_id?: string
          payment_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_payments_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_payments_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          created_at: string
          credit_limit: number
          email: string | null
          id: string
          name: string
          owner_id: string
          phone: string | null
          points: number
          tier: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          credit_limit?: number
          email?: string | null
          id?: string
          name: string
          owner_id?: string
          phone?: string | null
          points?: number
          tier?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          credit_limit?: number
          email?: string | null
          id?: string
          name?: string
          owner_id?: string
          phone?: string | null
          points?: number
          tier?: string
        }
        Relationships: []
      }
      expenses: {
        Row: {
          account_id: string | null
          amount: number
          category: string
          created_at: string
          description: string | null
          expense_date: string
          id: string
          owner_id: string
          staff_id: string | null
        }
        Insert: {
          account_id?: string | null
          amount?: number
          category?: string
          created_at?: string
          description?: string | null
          expense_date?: string
          id?: string
          owner_id?: string
          staff_id?: string | null
        }
        Update: {
          account_id?: string | null
          amount?: number
          category?: string
          created_at?: string
          description?: string | null
          expense_date?: string
          id?: string
          owner_id?: string
          staff_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expenses_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expenses_staff_id_fkey"
            columns: ["staff_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      income: {
        Row: {
          account_id: string | null
          amount: number
          created_at: string
          description: string | null
          id: string
          income_date: string
          owner_id: string
          source: string
        }
        Insert: {
          account_id?: string | null
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          income_date?: string
          owner_id?: string
          source?: string
        }
        Update: {
          account_id?: string | null
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          income_date?: string
          owner_id?: string
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "income_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          active: boolean
          barcode: string | null
          brand: string | null
          category: string
          cost: number
          created_at: string
          discount_percent: number
          id: string
          image_url: string | null
          low_stock_at: number
          name: string
          owner_id: string
          price: number
          sku: string | null
          stock_qty: number
          tax_percent: number | null
          track_stock: boolean
        }
        Insert: {
          active?: boolean
          barcode?: string | null
          brand?: string | null
          category?: string
          cost?: number
          created_at?: string
          discount_percent?: number
          id?: string
          image_url?: string | null
          low_stock_at?: number
          name: string
          owner_id?: string
          price?: number
          sku?: string | null
          stock_qty?: number
          tax_percent?: number | null
          track_stock?: boolean
        }
        Update: {
          active?: boolean
          barcode?: string | null
          brand?: string | null
          category?: string
          cost?: number
          created_at?: string
          discount_percent?: number
          id?: string
          image_url?: string | null
          low_stock_at?: number
          name?: string
          owner_id?: string
          price?: number
          sku?: string | null
          stock_qty?: number
          tax_percent?: number | null
          track_stock?: boolean
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          created_at: string
          id: string
          name: string
          owner_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          owner_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          owner_id?: string
        }
        Relationships: []
      }
      restaurants: {
        Row: {
          address: string | null
          country: string | null
          created_at: string
          currency: string
          currency_symbol: string
          email: string | null
          fy_start_month: number
          id: string
          logo_url: string | null
          manager_pin: string | null
          max_discount_percent: number
          name: string
          owner_id: string
          owner_name: string | null
          phone: string | null
          point_value: number
          points_per_unit: number
          tax_enabled: boolean
          tax_fixed: number
          tax_inclusive: boolean
          tax_label: string
          tax_mode: string
          tax_percent: number
          time_zone: string
        }
        Insert: {
          address?: string | null
          country?: string | null
          created_at?: string
          currency?: string
          currency_symbol?: string
          email?: string | null
          fy_start_month?: number
          id?: string
          logo_url?: string | null
          manager_pin?: string | null
          max_discount_percent?: number
          name: string
          owner_id?: string
          owner_name?: string | null
          phone?: string | null
          point_value?: number
          points_per_unit?: number
          tax_enabled?: boolean
          tax_fixed?: number
          tax_inclusive?: boolean
          tax_label?: string
          tax_mode?: string
          tax_percent?: number
          time_zone?: string
        }
        Update: {
          address?: string | null
          country?: string | null
          created_at?: string
          currency?: string
          currency_symbol?: string
          email?: string | null
          fy_start_month?: number
          id?: string
          logo_url?: string | null
          manager_pin?: string | null
          max_discount_percent?: number
          name?: string
          owner_id?: string
          owner_name?: string | null
          phone?: string | null
          point_value?: number
          points_per_unit?: number
          tax_enabled?: boolean
          tax_fixed?: number
          tax_inclusive?: boolean
          tax_label?: string
          tax_mode?: string
          tax_percent?: number
          time_zone?: string
        }
        Relationships: []
      }
      sale_items: {
        Row: {
          cost: number
          id: string
          menu_item_id: string | null
          name: string
          owner_id: string
          price: number
          qty: number
          sale_id: string
        }
        Insert: {
          cost?: number
          id?: string
          menu_item_id?: string | null
          name: string
          owner_id?: string
          price?: number
          qty?: number
          sale_id: string
        }
        Update: {
          cost?: number
          id?: string
          menu_item_id?: string | null
          name?: string
          owner_id?: string
          price?: number
          qty?: number
          sale_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_returns: {
        Row: {
          account_id: string | null
          cost: number
          created_at: string
          id: string
          menu_item_id: string | null
          name: string
          owner_id: string
          qty: number
          reason: string | null
          refund: number
          restock: boolean
          return_date: string
          sale_id: string
        }
        Insert: {
          account_id?: string | null
          cost?: number
          created_at?: string
          id?: string
          menu_item_id?: string | null
          name: string
          owner_id?: string
          qty: number
          reason?: string | null
          refund?: number
          restock?: boolean
          return_date?: string
          sale_id: string
        }
        Update: {
          account_id?: string | null
          cost?: number
          created_at?: string
          id?: string
          menu_item_id?: string | null
          name?: string
          owner_id?: string
          qty?: number
          reason?: string | null
          refund?: number
          restock?: boolean
          return_date?: string
          sale_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sale_returns_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_returns_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_returns_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          account_id: string | null
          cost_total: number
          created_at: string
          customer: string | null
          customer_id: string | null
          discount: number
          id: string
          note: string | null
          owner_id: string
          paid_amount: number | null
          points_redeemed: number
          sale_date: string
          salesperson_id: string | null
          shift_id: string | null
          tax: number
          total: number
        }
        Insert: {
          account_id?: string | null
          cost_total?: number
          created_at?: string
          customer?: string | null
          customer_id?: string | null
          discount?: number
          id?: string
          note?: string | null
          owner_id?: string
          paid_amount?: number | null
          points_redeemed?: number
          sale_date?: string
          salesperson_id?: string | null
          shift_id?: string | null
          tax?: number
          total?: number
        }
        Update: {
          account_id?: string | null
          cost_total?: number
          created_at?: string
          customer?: string | null
          customer_id?: string | null
          discount?: number
          id?: string
          note?: string | null
          owner_id?: string
          paid_amount?: number | null
          points_redeemed?: number
          sale_date?: string
          salesperson_id?: string | null
          shift_id?: string | null
          tax?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_salesperson_id_fkey"
            columns: ["salesperson_id"]
            isOneToOne: false
            referencedRelation: "staff"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          closed_at: string | null
          closing_cash: number | null
          expected_cash: number | null
          id: string
          note: string | null
          opened_at: string
          opened_by: string
          opening_cash: number
          owner_id: string
        }
        Insert: {
          closed_at?: string | null
          closing_cash?: number | null
          expected_cash?: number | null
          id?: string
          note?: string | null
          opened_at?: string
          opened_by?: string
          opening_cash?: number
          owner_id?: string
        }
        Update: {
          closed_at?: string | null
          closing_cash?: number | null
          expected_cash?: number | null
          id?: string
          note?: string | null
          opened_at?: string
          opened_by?: string
          opening_cash?: number
          owner_id?: string
        }
        Relationships: []
      }
      staff: {
        Row: {
          active: boolean
          commission_percent: number
          created_at: string
          hire_date: string
          id: string
          name: string
          owner_id: string
          phone: string | null
          role: string
          salary: number
        }
        Insert: {
          active?: boolean
          commission_percent?: number
          created_at?: string
          hire_date?: string
          id?: string
          name: string
          owner_id?: string
          phone?: string | null
          role?: string
          salary?: number
        }
        Update: {
          active?: boolean
          commission_percent?: number
          created_at?: string
          hire_date?: string
          id?: string
          name?: string
          owner_id?: string
          phone?: string | null
          role?: string
          salary?: number
        }
        Relationships: []
      }
      stock_moves: {
        Row: {
          created_at: string
          id: string
          kind: string
          menu_item_id: string
          move_date: string
          note: string | null
          owner_id: string
          qty: number
          sale_id: string | null
          supplier: string | null
          unit_cost: number
        }
        Insert: {
          created_at?: string
          id?: string
          kind?: string
          menu_item_id: string
          move_date?: string
          note?: string | null
          owner_id?: string
          qty: number
          sale_id?: string | null
          supplier?: string | null
          unit_cost?: number
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          menu_item_id?: string
          move_date?: string
          note?: string | null
          owner_id?: string
          qty?: number
          sale_id?: string | null
          supplier?: string | null
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_moves_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_moves_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      store_members: {
        Row: {
          created_at: string
          id: string
          member_id: string
          role: string
          store_owner_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          member_id: string
          role?: string
          store_owner_id: string
        }
        Update: {
          created_at?: string
          id?: string
          member_id?: string
          role?: string
          store_owner_id?: string
        }
        Relationships: []
      }
      transfers: {
        Row: {
          amount: number
          created_at: string
          from_account_id: string
          id: string
          note: string | null
          owner_id: string
          to_account_id: string
          transfer_date: string
        }
        Insert: {
          amount: number
          created_at?: string
          from_account_id: string
          id?: string
          note?: string | null
          owner_id?: string
          to_account_id: string
          transfer_date?: string
        }
        Update: {
          amount?: number
          created_at?: string
          from_account_id?: string
          id?: string
          note?: string | null
          owner_id?: string
          to_account_id?: string
          transfer_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "transfers_from_account_id_fkey"
            columns: ["from_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transfers_to_account_id_fkey"
            columns: ["to_account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_store_member_by_email: { Args: { p_email: string }; Returns: string }
      current_store_owner: { Args: never; Returns: string }
      current_store_role: { Args: never; Returns: string }
      list_store_members: {
        Args: never
        Returns: {
          created_at: string
          email: string
          id: string
          member_id: string
        }[]
      }
      list_team: {
        Args: never
        Returns: {
          created_at: string
          email: string
          id: string
          member_id: string
          role: string
        }[]
      }
      remove_store_member: { Args: { p_id: string }; Returns: undefined }
      seed_sample_data: { Args: never; Returns: undefined }
      seed_sample_data_for: { Args: { uid: string }; Returns: undefined }
      set_member_role: {
        Args: { p_id: string; p_role: string }
        Returns: undefined
      }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
