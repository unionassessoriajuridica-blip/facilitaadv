# Facilita ADV - Sistema de Gestao Juridica

Sistema completo de gestao para escritorios de advocacia brasileiros, com gerenciamento de processos, clientes, financeiro, assinatura digital e integracoes com Google e WhatsApp.

---

## Resumo do Sistema

O **Facilita ADV** oferece as seguintes funcionalidades:

| Modulo | Funcionalidades |
|--------|-----------------|
| **Processos** | Cadastro, edicao, acompanhamento de prazos, status e documentos |
| **Clientes** | Cadastro completo, importacao via Excel, historico |
| **Financeiro** | Honorarios, parcelas, controle de pagamentos, relatorios PDF |
| **FaciliSign** | Assinatura digital de documentos via DocuSeal |
| **IA Facilita** | Assistente juridico com IA (chat, pesquisa, investigacao) |
| **Google** | Integracao com Gmail e Google Calendar |
| **WhatsApp** | Envio automatizado de cobrancas via Twilio |
| **Usuarios** | Sistema de convites, permissoes e roles |

---

## Arquitetura

```
Frontend: React 18 + TypeScript + Vite + Tailwind CSS
Backend:  Node.js + Express (serve apenas o frontend)
Banco:    Supabase (PostgreSQL hospedado)
Auth:     Supabase Auth
Storage:  Supabase Storage
Functions: Supabase Edge Functions
```

---

## Requisitos Minimos do Servidor

### Para Desenvolvimento Local

| Requisito | Versao Minima |
|-----------|---------------|
| Node.js | 18.x ou superior |
| npm | 9.x ou superior |
| RAM | 2 GB |
| Disco | 500 MB livres |

### Para Producao (Replit/Cloud)

| Requisito | Especificacao |
|-----------|---------------|
| Plano Replit | Hacker ou superior (recomendado) |
| RAM | 1 GB minimo |
| CPU | 1 vCPU |
| Porta | 5000 (frontend) |

### Servicos Externos Necessarios

| Servico | Obrigatorio | Funcao |
|---------|-------------|--------|
| Supabase | Sim | Banco de dados, autenticacao, storage e edge functions |
| Google Cloud | Sim | OAuth para Gmail e Calendar |
| DocuSeal | Opcional | Assinatura digital de documentos |
| Twilio | Opcional | Envio de mensagens WhatsApp |

---

## Manual de Instalacao

### Passo 1: Clonar o Repositorio

```bash
git clone https://github.com/seu-usuario/facilita-adv.git
cd facilita-adv
```

### Passo 2: Instalar Dependencias

```bash
npm install
```

### Passo 3: Configurar o Supabase

1. Acesse [https://supabase.com](https://supabase.com) e crie uma conta
2. Crie um novo projeto
3. Anote as credenciais:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **Anon Key**: Chave publica anonima

4. No Supabase, va em **SQL Editor** e execute os scripts de criacao das tabelas:

```sql
-- Tabela de clientes
CREATE TABLE clientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  cpf_cnpj TEXT,
  endereco TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de processos
CREATE TABLE processos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  cliente_id UUID NOT NULL REFERENCES clientes(id),
  numero_processo TEXT NOT NULL,
  tipo_processo TEXT NOT NULL,
  cliente_preso BOOLEAN DEFAULT FALSE,
  descricao TEXT,
  prazo DATE,
  status TEXT DEFAULT 'ATIVO',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela financeiro
CREATE TABLE financeiro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  processo_id UUID REFERENCES processos(id),
  cliente_nome TEXT NOT NULL,
  valor NUMERIC NOT NULL,
  tipo TEXT NOT NULL,
  status TEXT DEFAULT 'PENDENTE',
  vencimento DATE,
  data_pagamento DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar Row Level Security
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE processos ENABLE ROW LEVEL SECURITY;
ALTER TABLE financeiro ENABLE ROW LEVEL SECURITY;

-- Politicas de seguranca (usuarios so veem seus dados)
CREATE POLICY "Users can view own clientes" ON clientes
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own processos" ON processos
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own financeiro" ON financeiro
  FOR ALL USING (auth.uid() = user_id);
```

### Passo 4: Configurar Google OAuth

1. Acesse [Google Cloud Console](https://console.cloud.google.com)
2. Crie um novo projeto
3. Va em **APIs & Services > Credentials**
4. Clique em **Create Credentials > OAuth Client ID**
5. Selecione **Web Application**
6. Adicione as URLs autorizadas:
   - **Authorized JavaScript origins**: `http://localhost:5000`
   - **Authorized redirect URIs**: `http://localhost:5000/google-integration/callback`
7. Anote o **Client ID** e **Client Secret**

8. Ative as APIs necessarias:
   - Gmail API
   - Google Calendar API

### Passo 5: Configurar Variaveis de Ambiente

Crie um arquivo `.env` na raiz do projeto (ou configure no Replit):

```env
# Supabase (obrigatorio)
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima

# Google OAuth (obrigatorio)
VITE_GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com
VITE_GOOGLE_CLIENT_SECRET=seu-client-secret

# WhatsApp (opcional)
VITE_WHATSAPP_API_URL=https://sua-api-whatsapp.com
```

### Passo 6: Configurar Edge Functions no Supabase

No painel do Supabase, va em **Edge Functions** e crie as seguintes funcoes:

| Funcao | Descricao |
|--------|-----------|
| `ai-chat` | Chat com IA |
| `agent-mode` | Modo agente/investigacao |
| `web-search` | Pesquisa na web |
| `docuseal-upload` | Upload de documentos |
| `docuseal-send-signature` | Envio para assinatura |
| `docuseal-get-view-url` | URL de visualizacao |
| `docuseal-get-download-url` | URL de download |
| `send-email` | Envio de emails |
| `send-invitation-email` | Email de convite |
| `twilio-send-message` | Mensagem WhatsApp |

### Passo 7: Executar em Desenvolvimento

```bash
npm run dev
```

O sistema estara disponivel em: `http://localhost:5000`

### Passo 8: Build para Producao

```bash
npm run build
```

### Passo 9: Executar em Producao

```bash
npm start
```

---

## Estrutura de Diretorios

```
facilita-adv/
├── client/                 # Frontend React
│   └── src/
│       ├── components/     # Componentes React
│       ├── hooks/          # Custom hooks
│       ├── integrations/   # Cliente Supabase
│       ├── pages/          # Paginas da aplicacao
│       ├── services/       # Servicos externos
│       └── utils/          # Utilitarios
├── server/                 # Backend Express
│   ├── index.ts            # Servidor principal
│   └── vite.ts             # Configuracao Vite
├── shared/                 # Codigo compartilhado
│   └── schema.ts           # Schema de referencia
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

---

## Scripts Disponiveis

| Comando | Descricao |
|---------|-----------|
| `npm run dev` | Inicia servidor de desenvolvimento |
| `npm run build` | Compila para producao |
| `npm start` | Inicia servidor de producao |

---

## Primeiro Acesso

1. Acesse `http://localhost:5000/auth`
2. Clique em **Cadastro**
3. Preencha nome, email e senha
4. Confirme o email (se configurado no Supabase)
5. Faca login e acesse o Dashboard

---

## Suporte

Para mais detalhes tecnicos, consulte:
- `DOCUMENTACAO_FACILITA_ADV.md` - Documentacao tecnica completa
- `replit.md` - Informacoes da arquitetura

---

## Licenca

Projeto proprietario - Todos os direitos reservados.

---

*Versao: 2.0*
*Ultima atualizacao: Dezembro 2024*
