export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          messages: Json
          mode: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          messages?: Json
          mode?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          messages?: Json
          mode?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      clientes: {
        Row: {
          cpf_cnpj: string | null
          created_at: string
          email: string | null
          endereco: string | null
          id: string
          nome: string
          telefone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          nome: string
          telefone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          endereco?: string | null
          id?: string
          nome?: string
          telefone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      documentos_assinatura: {
        Row: {
          arquivo_url: string | null
          created_at: string
          data_assinatura: string | null
          data_envio: string | null
          id: string
          nome: string
          signatarios: string[] | null
          status: string | null
          tipo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          arquivo_url?: string | null
          created_at?: string
          data_assinatura?: string | null
          data_envio?: string | null
          id?: string
          nome: string
          signatarios?: string[] | null
          status?: string | null
          tipo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          arquivo_url?: string | null
          created_at?: string
          data_assinatura?: string | null
          data_envio?: string | null
          id?: string
          nome?: string
          signatarios?: string[] | null
          status?: string | null
          tipo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      documentos_digitais: {
        Row: {
          created_at: string
          docuseal_submission_id: string | null
          docuseal_template_id: string
          id: string
          nome: string
          signatarios: Json | null
          status: string
          tipo: string | null
          updated_at: string
          user_id: string
          webhook_data: Json | null
        }
        Insert: {
          created_at?: string
          docuseal_submission_id?: string | null
          docuseal_template_id: string
          id?: string
          nome: string
          signatarios?: Json | null
          status?: string
          tipo?: string | null
          updated_at?: string
          user_id: string
          webhook_data?: Json | null
        }
        Update: {
          created_at?: string
          docuseal_submission_id?: string | null
          docuseal_template_id?: string
          id?: string
          nome?: string
          signatarios?: Json | null
          status?: string
          tipo?: string | null
          updated_at?: string
          user_id?: string
          webhook_data?: Json | null
        }
        Relationships: []
      }
      documentos_processo: {
        Row: {
          cliente_nome: string
          created_at: string
          descricao: string | null
          id: string
          nome_arquivo: string
          processo_id: string | null
          tamanho_arquivo: number
          tipo_arquivo: string
          updated_at: string
          url_arquivo: string
          user_id: string
        }
        Insert: {
          cliente_nome: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome_arquivo: string
          processo_id?: string | null
          tamanho_arquivo: number
          tipo_arquivo: string
          updated_at?: string
          url_arquivo: string
          user_id: string
        }
        Update: {
          cliente_nome?: string
          created_at?: string
          descricao?: string | null
          id?: string
          nome_arquivo?: string
          processo_id?: string | null
          tamanho_arquivo?: number
          tipo_arquivo?: string
          updated_at?: string
          url_arquivo?: string
          user_id?: string
        }
        Relationships: []
      }
      financeiro: {
        Row: {
          cliente_nome: string
          created_at: string
          data_pagamento: string | null
          id: string
          processo_id: string | null
          status: string | null
          tipo: string
          updated_at: string
          user_id: string
          valor: number
          vencimento: string | null
        }
        Insert: {
          cliente_nome: string
          created_at?: string
          data_pagamento?: string | null
          id?: string
          processo_id?: string | null
          status?: string | null
          tipo: string
          updated_at?: string
          user_id: string
          valor: number
          vencimento?: string | null
        }
        Update: {
          cliente_nome?: string
          created_at?: string
          data_pagamento?: string | null
          id?: string
          processo_id?: string | null
          status?: string | null
          tipo?: string
          updated_at?: string
          user_id?: string
          valor?: number
          vencimento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "financeiro_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos"
            referencedColumns: ["id"]
          },
        ]
      }
      notificacoes: {
        Row: {
          cliente_nome: string | null
          created_at: string
          id: string
          lida: boolean
          mensagem: string
          tipo: string
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cliente_nome?: string | null
          created_at?: string
          id?: string
          lida?: boolean
          mensagem: string
          tipo: string
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cliente_nome?: string | null
          created_at?: string
          id?: string
          lida?: boolean
          mensagem?: string
          tipo?: string
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      observacoes_processo: {
        Row: {
          cliente_nome: string
          conteudo: string
          created_at: string
          id: string
          processo_id: string | null
          titulo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cliente_nome: string
          conteudo: string
          created_at?: string
          id?: string
          processo_id?: string | null
          titulo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cliente_nome?: string
          conteudo?: string
          created_at?: string
          id?: string
          processo_id?: string | null
          titulo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      processos: {
        Row: {
          cliente_id: string
          cliente_preso: boolean | null
          created_at: string
          descricao: string | null
          id: string
          numero_processo: string
          prazo: string | null
          status: string | null
          tipo_processo: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cliente_id: string
          cliente_preso?: boolean | null
          created_at?: string
          descricao?: string | null
          id?: string
          numero_processo: string
          prazo?: string | null
          status?: string | null
          tipo_processo: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cliente_id?: string
          cliente_preso?: boolean | null
          created_at?: string
          descricao?: string | null
          id?: string
          numero_processo?: string
          prazo?: string | null
          status?: string | null
          tipo_processo?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_processos_clientes"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      responsavel_financeiro: {
        Row: {
          cep: string
          cpf: string
          created_at: string
          data_nascimento: string
          email: string
          endereco_completo: string
          id: string
          nome: string
          processo_id: string | null
          rg: string
          telefone: string
          updated_at: string
          user_id: string
        }
        Insert: {
          cep: string
          cpf: string
          created_at?: string
          data_nascimento: string
          email: string
          endereco_completo: string
          id?: string
          nome: string
          processo_id?: string | null
          rg: string
          telefone: string
          updated_at?: string
          user_id: string
        }
        Update: {
          cep?: string
          cpf?: string
          created_at?: string
          data_nascimento?: string
          email?: string
          endereco_completo?: string
          id?: string
          nome?: string
          processo_id?: string | null
          rg?: string
          telefone?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "responsavel_financeiro_processo_id_fkey"
            columns: ["processo_id"]
            isOneToOne: false
            referencedRelation: "processos"
            referencedColumns: ["id"]
          },
        ]
      }
      user_invitations: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          nome: string
          permissions: Database["public"]["Enums"]["user_permission"][]
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          nome: string
          permissions?: Database["public"]["Enums"]["user_permission"][]
          status?: string
          token?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          nome?: string
          permissions?: Database["public"]["Enums"]["user_permission"][]
          status?: string
          token?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_permissions: {
        Row: {
          created_at: string
          granted_by: string
          id: string
          permission: Database["public"]["Enums"]["user_permission"]
          user_id: string
        }
        Insert: {
          created_at?: string
          granted_by: string
          id?: string
          permission: Database["public"]["Enums"]["user_permission"]
          user_id: string
        }
        Update: {
          created_at?: string
          granted_by?: string
          id?: string
          permission?: Database["public"]["Enums"]["user_permission"]
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
      [_ in never]: never
    }
    Functions: {
      check_parcelas_em_aberto: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_user_permissions: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["user_permission"][]
      }
      has_permission: {
        Args: {
          _user_id: string
          _permission: Database["public"]["Enums"]["user_permission"]
        }
        Returns: boolean
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      is_master_user: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      set_master_user: {
        Args: { user_email: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "master" | "admin" | "user"
      user_permission:
        | "financeiro"
        | "ia_facilita"
        | "facilisign"
        | "novo_processo"
        | "google_integration"
        | "agenda"
        | "modificar_clientes"
        | "excluir_processo"
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
      app_role: ["master", "admin", "user"],
      user_permission: [
        "financeiro",
        "ia_facilita",
        "facilisign",
        "novo_processo",
        "google_integration",
        "agenda",
        "modificar_clientes",
        "excluir_processo",
      ],
    },
  },
} as const
