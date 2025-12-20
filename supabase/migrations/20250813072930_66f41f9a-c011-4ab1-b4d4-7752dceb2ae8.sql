-- ==================== TIPOS ENUM ====================
CREATE TYPE app_role AS ENUM ('master', 'admin', 'user');
CREATE TYPE permission_type AS ENUM ('READ', 'WRITE', 'ADMIN');

-- ==================== TABELAS PRINCIPAIS ====================
-- 1. Clientes
CREATE TABLE clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  nome text NOT NULL,
  email text,
  telefone text,
  cpf_cnpj text,
  endereco text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 2. Processos (CORREÇÃO: cliente_id como UUID)
CREATE TABLE processos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  cliente_id uuid NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  numero_processo text NOT NULL,
  tipo_processo text NOT NULL,
  cliente_preso boolean DEFAULT false,
  descricao text,
  prazo date,
  status text DEFAULT 'ATIVO',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 3. Financeiro
CREATE TABLE financeiro (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  processo_id uuid REFERENCES processos(id),
  cliente_nome text NOT NULL,
  valor numeric NOT NULL,
  tipo text NOT NULL,
  status text DEFAULT 'PENDENTE',
  vencimento date,
  data_pagamento date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 4. Chat
CREATE TABLE chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  title text NOT NULL,
  messages jsonb DEFAULT '[]'::jsonb,
  mode text DEFAULT 'chat',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 5. Documentos Assinatura
CREATE TABLE documentos_assinatura (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  nome text NOT NULL,
  tipo text NOT NULL,
  status text DEFAULT 'PENDENTE',
  data_envio timestamp with time zone DEFAULT now(),
  data_assinatura timestamp with time zone,
  signatarios uuid[] DEFAULT '{}'::uuid[],
  arquivo_url text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 6. Documentos Digitais
CREATE TABLE documentos_digitais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  nome text NOT NULL,
  tipo text,
  status text DEFAULT 'TEMPLATE_CRIADO',
  docuseal_template_id text NOT NULL,
  docuseal_submission_id text,
  signatarios jsonb,
  webhook_data jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 7. Documentos Processo
CREATE TABLE documentos_processo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  processo_id uuid REFERENCES processos(id),
  cliente_nome text NOT NULL,
  nome_arquivo text NOT NULL,
  tipo_arquivo text NOT NULL,
  tamanho_arquivo bigint NOT NULL,
  url_arquivo text NOT NULL,
  descricao text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 8. Notificações
CREATE TABLE notificacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  tipo text NOT NULL,
  titulo text NOT NULL,
  mensagem text NOT NULL,
  cliente_nome text,
  lida boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 9. Observações Processo
CREATE TABLE observacoes_processo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  processo_id uuid REFERENCES processos(id),
  cliente_nome text NOT NULL,
  titulo text NOT NULL,
  conteudo text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 10. Profiles
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text NOT NULL UNIQUE
);

-- 11. Responsável Financeiro
CREATE TABLE responsavel_financeiro (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  nome text NOT NULL,
  rg text NOT NULL,
  cpf text NOT NULL,
  data_nascimento date NOT NULL,
  telefone text NOT NULL,
  email text NOT NULL,
  endereco_completo text NOT NULL,
  cep text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 12. User Invitations
CREATE TABLE user_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  nome text NOT NULL,
  invited_by uuid NOT NULL REFERENCES auth.users(id),
  status text DEFAULT 'PENDING',
  token text UNIQUE DEFAULT gen_random_uuid()::text,
  expires_at timestamp with time zone DEFAULT (now() + '7 days'::interval),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 13. User Permissions
CREATE TABLE user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  permission permission_type NOT NULL,
  granted_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now()
);

-- 14. User Roles (CORREÇÃO: usando app_role)
CREATE TABLE user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at timestamp with time zone DEFAULT now()
);

-- ==================== ROW LEVEL SECURITY ====================
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User roles policy" ON user_roles
FOR ALL USING (auth.uid() = user_id);