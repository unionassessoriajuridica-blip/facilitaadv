# Facilita ADV - Documentação Completa do Sistema

## 1. Visão Geral

O **Facilita ADV** é um sistema de gestão jurídica (ERP Jurídico) de alta performance, projetado para advogados e escritórios que buscam automatizar fluxos de trabalho complexos. A plataforma integra gestão de processos, controle financeiro colaborativo, assistente de IA para análise jurídica, assinatura digital e integrações nativas com Google Workspace, WhatsApp e DataJud (CNJ).

---

## 2. Arquitetura Técnica

O sistema adota uma arquitetura moderna de **Frontend-as-a-Service**, onde a maior parte da lógica de persistência e autenticação é delegada ao **Supabase**.

### 2.1 Stack Frontend
| Tecnologia | Função | Detalhe |
|------------|--------|---------|
| React 18 | Framework de UI | Base declarativa e modular |
| TypeScript | Tipagem | Garantia de contrato de dados em todo o app |
| Vite + SWC | Build | Compilação ultrarrápida para desenvolvimento |
| Tailwind CSS | Estilização | Design system utilitário e responsivo |
| shadcn/ui | Componentes | Biblioteca de componentes premium baseada em Radix UI |
| TanStack Query | Estado Síncrono | Cache inteligente e sincronização de dados com o servidor |
| React Hook Form | Formulários | Gestão eficiente de estados de input com validação Zod |

### 2.2 Stack Backend & Infraestrutura
| Tecnologia | Função | Detalhe |
|------------|--------|---------|
| Node.js + Express | Servidor Local | SPA Proxy e suporte a scripts de desenvolvimento |
| Supabase Auth | Autenticação | Gestão de tokens JWT, sessões e OAuth (Google) |
| PostgreSQL | Banco de Dados | Banco relacional robusto com JSONB para dados flexíveis |
| Edge Functions | Serverless | Processamento de IA, integrações de e-mail e webhooks (Deno) |
| Supabase Storage | Arquivos | Armazenamento de documentos e anexos de processos |
| RLS (Row Level Security) | Segurança | Controle de acesso a nível de registro diretamente no banco |

### 2.3 Integrações Externas
- **Supabase**: Backend completo (DB, Auth, Edge Functions, Storage).
- **Google Cloud Console**: OAuth 2.0 para Gmail e Google Calendar.
- **DataJud (CNJ)**: Consumo de dados públicos de processos diretamente dos tribunais.
- **DocuSeal & ZapSign**: APIs para assinatura eletrônica de documentos jurídicos.
- **Twilio**: API para comunicação automatizada via WhatsApp.

---

## 3. Estrutura de Diretórios e Módulos

```
facilita-adv/
├── client/                     # Aplicação Frontend (Vite)
│   └── src/
│       ├── components/         # Componentes React Reutilizáveis
│       │   ├── ui/             # Primitivos base (Button, Input, etc.)
│       │   ├── prazos/         # Dashboard de métricas e filtros avançados
│       │   └── ...             # Componentes específicos por módulo
│       ├── hooks/              # Custom Hooks (useAuth, usePrazosStats, etc.)
│       ├── integrations/       # Configuração do Cliente Supabase
│       ├── pages/              # Páginas da aplicação (Roteamento)
│       ├── services/           # Serviços de integração (DataJud, WhatsApp)
│       └── utils/              # Funções utilitárias (Formatação, Access Control)
├── server/                     # Backend Minimalista (Express/Vite)
├── shared/                     # Código compartilhado entre Client e Server
│   └── schema.ts               # Schema Drizzle para referência de tipos
├── supabase/                   # Configurações e Migrações do Banco de Dados
│   ├── functions/              # Edge Functions (Node/Deno)
│   └── migrations/             # Histórico de alterações do PostgreSQL
└── scripts/                    # Scripts de automação (Powershell)
```

---

## 4. Detalhamento de Módulos

### 4.1 Autenticação e Funções (User Roles)
O sistema utiliza um modelo de permissões baseado em funções (**RBAC**):
- **Master**: Acesso total, incluindo gestão de usuários e configurações globais.
- **Admin**: Gestão operacional, visualização global de finanças e processos.
- **User**: Advogado padrão, focado em seus próprios processos (pode ter visão global liberada via RLS).

### 4.2 Dashboard de Prazos (NOVO)
Módulo avançado para controle de fluxo de trabalho judicial:
- **Busca Avançada**: Filtros cruzados por Nome do Cliente, Processo, Advogado Responsável e Período.
- **Métricas MTD (Month-to-Date)**: Visualização em tempo real de prazos vencidos, concluídos e pendentes.
- **Gráficos**: Distribuição de prazos por mês e taxa de cumprimento (SLA jurídico).

### 4.3 Gestão Financeira Global
Diferente da versão anterior, o financeiro agora permite uma **visão colaborativa**:
- **Acesso Global**: Gestores podem ver parcelas de todos os advogados do escritório.
- **Alertas Automáticos**: Sistema detecta clientes com 3+ parcelas pendentes e gera notificações automáticas.
- **Autocomplete**: Busca dinâmica de clientes integrada em todos os filtros financeiros.
- **Integração com Processos**: Cada registro financeiro é vinculado via `processo_id` para rastreabilidade total.

### 4.4 IA Facilita (Assistente Jurídico)
Motor de IA baseado em modelos LLM de última geração (Gemini):
- **Modo Chat**: Diálogo para dúvidas rápidas e redação de documentos.
- **Modo Agente**: Capacidade de executar tarefas sequenciais e investigação detalhada.
- **Modo Pesquisa (RAG)**: Busca informações em documentos anexados (PDFs de processos).
- **Web Search**: Consulta de jurisprudência e leis atualizadas diretamente da internet.

### 4.5 Integração DataJud (CNJ)
- **Sincronização**: Busca automática de movimentações processuais.
- **Log de Sincronia**: Tabela dedicada (`datajud_sync_log`) para auditoria de sucessos e falhas na busca de dados.

---

## 5. Modelo de Dados (Schema PostgreSQL)

O sistema utiliza PostgreSQL com tabelas interconectadas. Abaixo o schema completo atualizado:

### Tabelas Principais

#### 1. **clientes**
Armazena o cadastro básico de clientes e dados de contato.

```sql
CREATE TABLE public.clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  nome text NOT NULL,
  email text,
  telefone text,
  cpf_cnpj text,
  endereco text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
```

#### 2. **processos**
Tabela central vinculada a um cliente e a um advogado. Inclui integração completa com DataJud.

```sql
CREATE TABLE public.processos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  cliente_id uuid NOT NULL REFERENCES public.clientes(id),
  numero_processo text NOT NULL,
  tipo_processo text NOT NULL,
  cliente_preso boolean DEFAULT false,
  descricao text,
  prazo date,
  status text DEFAULT 'ATIVO'::text,
  
  -- Campos DataJud
  datajud_tribunal text,
  datajud_classe text,
  datajud_classe_codigo integer,
  datajud_sistema text,
  datajud_formato text,
  datajud_grau text,
  datajud_data_ajuizamento text,
  datajud_movimentos jsonb,
  datajud_ultima_atualizacao_cnj timestamp with time zone,
  datajud_ultima_movimentacao timestamp with time zone,
  datajud_atualizado_em timestamp with time zone,
  datajud_sigilo boolean DEFAULT false,
  
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
```

#### 3. **financeiro**
Registros financeiros de 'Entrada', 'Honorários' e 'TMP'. Possui `processo_id` obrigatório.

```sql
CREATE TABLE public.financeiro (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  processo_id uuid REFERENCES public.processos(id),
  cliente_nome text NOT NULL,
  valor numeric NOT NULL,
  tipo text NOT NULL,
  status text DEFAULT 'PENDENTE'::text,
  vencimento date,
  data_pagamento date,
  
  -- Controle de cobranças
  ultimo_envio_cobranca timestamp with time zone,
  tentativas_cobranca integer DEFAULT 0,
  
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
```

#### 4. **prazos**
Gestão completa de prazos processuais com cálculo automático de dias úteis/corridos.

```sql
CREATE TABLE public.prazos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  processo_id uuid NOT NULL REFERENCES public.processos(id),
  movimento_codigo integer NOT NULL,
  movimento_descricao text NOT NULL,
  movimento_data timestamp with time zone NOT NULL,
  
  tipo_prazo text NOT NULL CHECK (tipo_prazo IN (
    'INTIMACAO', 'RESPOSTA', 'RECURSO', 'CIENCIA', 
    'MANIFESTACAO', 'CONTRARRAZOES', 'IMPUGNACAO', 
    'VERIFICACAO', 'DESPACHO'
  )),
  
  dias_prazo integer NOT NULL CHECK (dias_prazo > 0 AND dias_prazo <= 365),
  data_inicio date NOT NULL,
  data_final date NOT NULL,
  dias_corridos boolean NOT NULL DEFAULT false,
  
  status text NOT NULL DEFAULT 'ATIVO' CHECK (status IN (
    'ATIVO', 'CUMPRIDO', 'VENCIDO', 'CANCELADO'
  )),
  
  cumprido_em timestamp with time zone,
  observacoes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
```

#### 5. **notificacoes**
Alertas de sistema, financeiros e processuais enviados aos usuários.

```sql
CREATE TABLE public.notificacoes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tipo text NOT NULL,  -- Ex: 'PARCELAS_EM_ABERTO', 'PRAZO_VENCIDO'
  titulo text NOT NULL,
  mensagem text NOT NULL,
  cliente_nome text,
  lida boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
```

### Tabelas de Documentos

#### 6. **documentos_processo**
Referência aos arquivos físicos no Supabase Storage (sistema legado).

```sql
CREATE TABLE public.documentos_processo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  processo_id uuid,
  cliente_nome text NOT NULL,
  nome_arquivo text NOT NULL,
  tipo_arquivo text NOT NULL,
  tamanho_arquivo bigint NOT NULL,
  url_arquivo text NOT NULL,
  descricao text,
  
  -- Campos Google Drive (legado)
  google_drive_file_id text,
  google_drive_folder_id text,
  google_drive_link text,
  
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
```

#### 7. **processo_documentos_drive**
Documentos armazenados exclusivamente no Google Drive.

```sql
CREATE TABLE public.processo_documentos_drive (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  processo_id uuid REFERENCES public.processos(id),
  user_id uuid REFERENCES auth.users(id),
  nome_arquivo text NOT NULL,
  tipo_arquivo text,
  tamanho_arquivo bigint,
  google_drive_file_id text NOT NULL,
  google_drive_folder_id text,
  google_drive_link text,
  descricao text,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc', now())
);
```

#### 8. **documentos_digitais**
Gestão de documentos via DocuSeal.

```sql
CREATE TABLE public.documentos_digitais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  nome text NOT NULL,
  tipo text,
  status text NOT NULL DEFAULT 'TEMPLATE_CRIADO',
  docuseal_template_id text,
  docuseal_submission_id text,
  signatarios jsonb,
  webhook_data jsonb,
  metadata jsonb DEFAULT '{}',
  tamanho bigint,
  data_conclusao timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
```

#### 9. **zapsign_documents**
Gestão de processos de assinatura digital via ZapSign.

```sql
CREATE TABLE public.zapsign_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id integer,
  processo_id uuid,
  cliente_id uuid,
  nome text NOT NULL,
  zapsign_token text,
  zapsign_open_id integer,
  status text DEFAULT 'pending',
  original_file_url text,
  signed_file_url text,
  signatarios jsonb,
  external_id text,
  date_limit_to_sign timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

### Tabelas de Integrações

#### 10. **google_integration**
Tokens OAuth2 para integração Google Workspace por usuário.

```sql
CREATE TABLE public.google_integration (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id),
  access_token text,
  refresh_token text,
  token_expiry timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
```

#### 11. **google_system_credentials**
Credenciais OAuth2 do sistema (nível organização).

```sql
CREATE TABLE public.google_system_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_type varchar NOT NULL UNIQUE,
  access_token text,
  refresh_token text,
  token_expiry timestamp with time zone,
  scopes text[],
  email varchar,
  connected_at timestamp with time zone DEFAULT now(),
  connected_by uuid REFERENCES auth.users(id),
  updated_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true,
  metadata jsonb DEFAULT '{}'
);
```

#### 12. **datajud_sync_log**
Auditoria de sincronizações com DataJud/CNJ.

```sql
CREATE TABLE public.datajud_sync_log (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  ultimo_sync timestamp with time zone NOT NULL,
  processos_consultados integer DEFAULT 0,
  prazos_novos integer DEFAULT 0,
  prazos_atualizados integer DEFAULT 0,
  status text DEFAULT 'success',
  error_message text,
  created_at timestamp with time zone DEFAULT now()
);
```

### Tabelas de Tarefas e Observações

#### 13. **tasks**
Tarefas vinculadas a processos com sincronização Google Calendar.

```sql
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  process_id uuid NOT NULL REFERENCES public.processos(id),
  title text NOT NULL,
  description text,
  due_date date NOT NULL,
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'pending',
  notify_client boolean NOT NULL DEFAULT false,
  notification_sent boolean NOT NULL DEFAULT false,
  synced_with_google boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
```

#### 14. **observacoes_processo**
Anotações internas sobre processos.

```sql
CREATE TABLE public.observacoes_processo (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  processo_id uuid,
  cliente_nome text NOT NULL,
  titulo text NOT NULL,
  conteudo text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
```

#### 15. **chat_conversations**
Histórico de conversas com IA Facilita.

```sql
CREATE TABLE public.chat_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  messages jsonb NOT NULL DEFAULT '[]',
  mode text NOT NULL DEFAULT 'chat',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
```

### Tabelas de Autenticação e Permissões

#### 16. **profiles**
Perfis de usuário vinculados ao Supabase Auth.

```sql
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text NOT NULL UNIQUE
);
```

#### 17. **user_roles**
Funções de usuário (master, admin, user).

```sql
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  role text NOT NULL DEFAULT 'default',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
```

#### 18. **user_permissions**
Permissões granulares (READ, WRITE, ADMIN).

```sql
CREATE TABLE public.user_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  permission permission_type NOT NULL,  -- ENUM
  granted_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
```

#### 19. **user_invitations**
Gerenciamento de convites para novos usuários.

```sql
CREATE TABLE public.user_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  nome text NOT NULL,
  permissions permission_type[] NOT NULL DEFAULT '{}',
  invited_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'PENDING',
  token text NOT NULL DEFAULT gen_random_uuid()::text UNIQUE,
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamp with time zone,
  user_id uuid REFERENCES auth.users(id),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
```

### Tabelas Auxiliares

#### 20. **responsavel_financeiro**
Dados do responsável financeiro vinculado a processos.

```sql
CREATE TABLE public.responsavel_financeiro (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  processo_id uuid REFERENCES public.processos(id),
  nome text NOT NULL,
  rg text NOT NULL,
  cpf text NOT NULL,
  data_nascimento date NOT NULL,
  telefone text NOT NULL,
  email text NOT NULL,
  endereco_completo text NOT NULL,
  cep text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
```

#### 21. **documentos_assinatura**
Legado - documentos de assinatura.

```sql
CREATE TABLE public.documentos_assinatura (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id),
  nome text NOT NULL,
  tipo text NOT NULL,
  status text DEFAULT 'PENDENTE',
  data_envio timestamp with time zone DEFAULT now(),
  data_assinatura timestamp with time zone,
  signatarios uuid[] DEFAULT '{}',
  arquivo_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);
```

### Resumo de Relacionamentos

```
clientes (1) ←→ (N) processos
processos (1) ←→ (N) financeiro
processos (1) ←→ (N) prazos
processos (1) ←→ (N) tasks
processos (1) ←→ (N) documentos_processo
processos (1) ←→ (N) processo_documentos_drive
processos (1) ←→ (1) responsavel_financeiro
auth.users (1) ←→ (N) todas as tabelas (user_id)
```

---

## 6. Fluxos de Operação (Business Logic)

### 6.1 Cadastro de Processo e Vínculo Financeiro
1. **Entrada de Dados**: O usuário preenche o formulário multi-etapas no frontend.
2. **Criação do Cliente**: Se o cliente for novo, o sistema o cadastra primeiro.
3. **Persistência do Processo**: O processo é criado com o `cliente_id`.
4. **Geração de Parcelas**: O backend gera automaticamente os lançamentos na tabela `financeiro` já com o `processo_id` e `user_id` preenchidos.
5. **Auditoria de Integridade**: O sistema valida se todos os novos documentos enviados estão vinculados ao processo correto para evitar arquivos órfãos.

### 6.2 Sistema de Alertas Inteligentes
1. **Job Diário**: Uma verificação no navegador (com trava de 24h) analisa parcelas pendentes.
2. **Filtro de Duplicidade**: O sistema consulta se já existe um alerta para aquele cliente nos últimos 7 dias.
3. **Notificação**: Se necessário, cria um registro na tabela `notificacoes`, disparando o badge no ícone do sino (Bell Icon).

---

## 7. Automação e DevOps

### 7.1 Script de Atualização (`update.ps1`)
Script PowerShell para simplificar o workflow de desenvolvimento:
- Faz `git pull` automático para evitar conflitos.
- Realiza `git add .` e `git commit` com mensagens personalizadas.
- Executa `git push` para o repositório sincronizado.

### 7.2 Migrations
Todas as alterações de banco de dados são versionadas na pasta `./supabase/migrations`. O sistema segue o padrão demigrations SQL puros para garantir portabilidade e facilidade de rollbacks.

---

## 8. Segurança e Conformidade

- **RLS no Banco**: Nenhum usuário pode ler ou escrever dados de outro usuário a menos que explicitamente permitido por uma política de segurança global (ex: Admin vendo Financeiro Global).
- **Tokens de IA**: Chaves de API de serviços de IA nunca ficam expostas no código cliente, sendo consumidas exclusivamente via Edge Functions autenticadas.
- **Auditoria de Arquivos**: Implementada lógica em Dezembro/2024 para garantir que todo arquivo no Storage tenha um documento correspondente no Banco de Dados com metadados de quem enviou.

---
*Última Atualização: 27 de Dezembro de 2024*
*Versão do Sistema: 2.6 (Schema Unificado + Auditoria & Prazos Edition)*
