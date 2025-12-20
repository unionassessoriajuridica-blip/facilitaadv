# Facilita ADV - Documentacao Completa do Sistema

## 1. Visao Geral

O **Facilita ADV** e um sistema de gestao juridica completo desenvolvido para advogados brasileiros. A plataforma oferece ferramentas para gerenciamento de processos judiciais, clientes, financeiro, documentos, assinatura digital e integracoes com servicos Google (Gmail, Calendar) e WhatsApp.

---

## 2. Arquitetura Tecnica

### 2.1 Stack Frontend
| Tecnologia | Funcao |
|------------|--------|
| React 18 | Framework de UI |
| TypeScript | Tipagem estatica |
| Vite + SWC | Build e compilacao rapida |
| Tailwind CSS | Estilizacao |
| shadcn/ui | Biblioteca de componentes |
| TanStack React Query | Gerenciamento de estado do servidor |
| React Router DOM | Roteamento |
| React Hook Form + Zod | Formularios e validacao |

### 2.2 Stack Backend
| Tecnologia | Funcao |
|------------|--------|
| Node.js + Express | Servidor HTTP (apenas serve o frontend) |
| Supabase | Autenticacao, banco de dados e Edge Functions |
| PostgreSQL | Banco de dados relacional (hospedado no Supabase) |

### 2.3 Integracoes Externas
- **Supabase**: Autenticacao, banco de dados, storage de arquivos e Edge Functions
- **Google OAuth 2.0**: Autenticacao para Gmail e Calendar
- **DocuSeal**: Assinatura eletronica de documentos
- **Twilio**: Envio de mensagens WhatsApp

---

## 3. Estrutura de Diretorios

```
/
├── client/                 # Frontend React
│   └── src/
│       ├── components/     # Componentes reutilizaveis
│       │   └── ui/         # Componentes shadcn/ui
│       ├── hooks/          # Custom hooks
│       ├── integrations/   # Integracao Supabase
│       ├── pages/          # Paginas da aplicacao
│       ├── services/       # Servicos externos
│       └── utils/          # Utilitarios
├── server/                 # Backend Express (minimal)
│   ├── index.ts            # Servidor principal
│   └── vite.ts             # Configuracao Vite
└── shared/                 # Codigo compartilhado
    └── schema.ts           # Schema do banco de dados (referencia)
```

---

## 4. Modulos e Funcionalidades

### 4.1 Autenticacao e Controle de Acesso

**Arquivo principal**: `client/src/pages/Auth.tsx`, `client/src/hooks/useAuth.ts`

| Funcionalidade | Descricao |
|----------------|-----------|
| Login/Cadastro | Autenticacao via email e senha usando Supabase Auth |
| Sessao persistente | Sessao mantida automaticamente pelo Supabase |
| Roles de usuario | Niveis: master, admin, user |
| Permissoes | READ, WRITE, ADMIN para recursos especificos |
| Convites | Sistema de convite para novos usuarios |

### 4.2 Dashboard Principal

**Arquivo**: `client/src/pages/Dashboard.tsx`

| Funcionalidade | Descricao |
|----------------|-----------|
| Visao geral de processos | Lista de processos ativos com status |
| Visao de clientes | Lista de clientes cadastrados |
| Filtros e busca | Pesquisa por nome, numero do processo, etc. |
| Navegacao rapida | Acesso direto a funcoes principais |

### 4.3 Gestao de Processos

**Arquivos**: `client/src/pages/NewProcess.tsx`, `client/src/pages/ProcessView.tsx`

| Funcionalidade | Descricao |
|----------------|-----------|
| Cadastro de processo | Formulario em etapas (cliente, processo, financeiro, documentos) |
| Edicao de processo | Alteracao de dados existentes |
| Vinculacao de cliente | Associa processo a um cliente |
| Status do processo | ATIVO, ARQUIVADO, etc. |
| Prazo | Data limite para acompanhamento |
| Cliente preso | Flag especial para clientes presos |
| Documentos anexos | Upload de arquivos relacionados |
| Observacoes | Notas e anotacoes sobre o processo |

### 4.4 Gestao de Clientes

**Dados armazenados**:
- Nome completo
- RG e CPF
- Data de nascimento
- Telefone e email
- Endereco completo (rua, bairro, cidade, CEP)

**Funcionalidades**:
- Importacao de clientes via Excel (XLSX)
- Vinculacao automatica a processos
- Historico de processos por cliente

### 4.5 Gestao Financeira

**Arquivos**: `client/src/pages/Financial.tsx`, `client/src/pages/ProcessFinancial.tsx`

| Funcionalidade | Descricao |
|----------------|-----------|
| Lancamentos financeiros | Honorarios, parcelas, entradas |
| Status de pagamento | PENDENTE, PAGO, VENCIDO |
| Filtros avancados | Por cliente, mes, status, tipo |
| Resumo financeiro | Total a receber, recebido, vencido |
| Relatorios PDF | Geracao de relatorios em PDF |
| Responsavel financeiro | Dados de quem paga (pode ser diferente do cliente) |

**Tipos de lancamento**:
- HONORARIOS
- ENTRADA
- PARCELA

### 4.6 FaciliSign - Assinatura Digital

**Arquivo**: `client/src/pages/FaciliSign.tsx`

| Funcionalidade | Descricao |
|----------------|-----------|
| Upload de documentos | PDF para assinatura |
| Criacao de templates | Modelos com campos de assinatura |
| Campos de assinatura | Assinatura, rubrica, data, texto |
| Envio para signatarios | Convite por email para assinar |
| Acompanhamento de status | PENDENTE, ASSINADO, REJEITADO |
| Integracao DocuSeal | API externa para assinatura eletronica |

**Modelos disponiveis**:
- SIMPLES: Assinatura + Data
- COMPLETO: Rubrica + Assinatura + Data (contratante e contratado)

### 4.7 IA Facilita - Assistente Juridico

**Arquivo**: `client/src/pages/IAFacilita.tsx`

| Modo | Descricao |
|------|-----------|
| Chat | Conversa normal com a IA |
| Agente | Analise autonoma estruturada |
| Pesquisa | Busca informacoes atualizadas na web |
| Investigar | Investigacao detalhada com multiplas fontes |

**Recursos**:
- Upload de arquivos para analise
- Historico de conversas salvo
- Integracao com Supabase Edge Functions

### 4.8 Integracao Google

**Arquivos**: `client/src/pages/GoogleIntegration.tsx`, `client/src/pages/CalendarManagement.tsx`

| Servico | Funcionalidade |
|---------|----------------|
| Gmail | Envio de emails diretamente do sistema |
| Calendar | Criacao e visualizacao de eventos |

**Tipos de eventos no calendario**:
- Audiencias
- Reunioes
- Prazos
- Outros

### 4.9 WhatsApp Manager

**Arquivo**: `client/src/pages/WhatsAppManagement.tsx`

| Funcionalidade | Descricao |
|----------------|-----------|
| Conexao WhatsApp | Gerenciamento da sessao |
| Envio de cobrancas | Mensagens automatizadas de cobranca |
| Estatisticas | Mensagens enviadas, pendentes, status |
| Bulk messaging | Envio em massa para clientes inadimplentes |

### 4.10 Gestao de Usuarios

**Arquivo**: `client/src/pages/UserManagement.tsx`

| Funcionalidade | Descricao |
|----------------|-----------|
| Convites | Enviar convite por email para novos usuarios |
| Permissoes | Definir nivel de acesso (READ, WRITE, ADMIN) |
| Roles | Atribuir funcoes (master, admin, user) |
| Listagem | Visualizar todos os usuarios do escritorio |

---

## 5. Supabase Edge Functions

O sistema utiliza Edge Functions do Supabase para processamento server-side. Abaixo esta a lista completa de funcoes utilizadas:

### 5.1 Funcoes de Inteligencia Artificial

| Funcao | Arquivo que chama | Descricao |
|--------|-------------------|-----------|
| `ai-chat` | `client/src/pages/IAFacilita.tsx` | Processamento de conversas com IA no modo Chat |
| `agent-mode` | `client/src/pages/IAFacilita.tsx` | Modo agente para analise autonoma e investigacao detalhada |
| `web-search` | `client/src/pages/IAFacilita.tsx` | Busca de informacoes atualizadas na web para pesquisa |

### 5.2 Funcoes de Assinatura Digital (DocuSeal)

| Funcao | Arquivo que chama | Descricao |
|--------|-------------------|-----------|
| `docuseal-upload` | `client/src/hooks/useDocuSeal.ts`, `client/src/hooks/useTemplateId.ts` | Upload de documentos PDF e criacao de templates |
| `docuseal-send-signature` | `client/src/hooks/useDocuSeal.ts` | Envio de documentos para signatarios assinarem |
| `docuseal-get-view-url` | `client/src/hooks/useDocuSeal.ts` | Obtencao de URL para visualizacao do documento |
| `docuseal-get-download-url` | `client/src/hooks/useDocuSeal.ts` | Obtencao de URL para download do documento assinado |

### 5.3 Funcoes de Comunicacao

| Funcao | Arquivo que chama | Descricao |
|--------|-------------------|-----------|
| `send-email` | `client/src/hooks/useEmailService.ts` | Envio de emails via servidor |
| `send-invitation-email` | `client/src/pages/UserManagement.tsx` | Envio de emails de convite para novos usuarios |
| `twilio-send-message` | `client/src/services/whatsappService.ts` | Envio de mensagens WhatsApp via Twilio |

### 5.4 Detalhamento das Edge Functions

#### ai-chat
```
Endpoint: /functions/v1/ai-chat
Metodo: POST
Parametros:
  - message: string (mensagem do usuario)
  - files: array (arquivos anexados, opcional)
Retorno:
  - content: string (resposta da IA)
```

#### agent-mode
```
Endpoint: /functions/v1/agent-mode
Metodo: POST
Parametros:
  - message: string (mensagem do usuario)
  - mode: string ("agent" | "investigate")
  - files: array (arquivos anexados, opcional)
Retorno:
  - content: string (resposta da IA)
  - toolCalls: array (ferramentas utilizadas)
  - sources: array (fontes consultadas)
```

#### web-search
```
Endpoint: /functions/v1/web-search
Metodo: POST
Parametros:
  - query: string (termo de busca)
  - message: string (contexto da pergunta)
Retorno:
  - content: string (resposta com dados da web)
  - sources: array (URLs consultadas)
```

#### docuseal-upload
```
Endpoint: /functions/v1/docuseal-upload
Metodo: POST
Parametros:
  - formData: FormData (arquivo PDF + metadados)
Retorno:
  - templateId: string (ID do template criado)
  - status: string
```

#### docuseal-send-signature
```
Endpoint: /functions/v1/docuseal-send-signature
Metodo: POST
Parametros:
  - templateId: string (ID do template)
  - signatarios: array [{nome, email, role}]
  - documentoId: string (ID do documento no banco)
Retorno:
  - submissionId: string (ID da submissao)
  - status: string
```

#### docuseal-get-view-url
```
Endpoint: /functions/v1/docuseal-get-view-url
Metodo: POST
Parametros:
  - templateId: string
Retorno:
  - url: string (URL para visualizacao)
```

#### docuseal-get-download-url
```
Endpoint: /functions/v1/docuseal-get-download-url
Metodo: POST
Parametros:
  - templateId: string
  - submissionId: string
Retorno:
  - url: string (URL para download)
```

#### send-email
```
Endpoint: /functions/v1/send-email
Metodo: POST
Parametros:
  - to: string (email destinatario)
  - subject: string (assunto)
  - html: string (corpo do email em HTML)
Retorno:
  - success: boolean
  - messageId: string
```

#### send-invitation-email
```
Endpoint: /functions/v1/send-invitation-email
Metodo: POST
Parametros:
  - email: string (email do convidado)
  - nome: string (nome do convidado)
  - inviteUrl: string (URL do convite)
  - invitedBy: string (nome de quem convidou)
Retorno:
  - success: boolean
```

#### twilio-send-message
```
Endpoint: /functions/v1/twilio-send-message
Metodo: POST
Parametros:
  - phone: string (numero do telefone)
  - message: string (texto da mensagem)
Retorno:
  - success: boolean
  - sid: string (ID da mensagem no Twilio)
```

---

## 6. Modelo de Dados (Schema)

### 6.1 Tabelas Principais

#### users
Usuarios do sistema (autenticados via Supabase Auth)

#### clientes
| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | UUID | Identificador unico |
| user_id | UUID | Dono do cliente (advogado) |
| nome | text | Nome completo |
| email | text | Email de contato |
| telefone | text | Telefone |
| cpf_cnpj | text | CPF ou CNPJ |
| endereco | text | Endereco completo |

#### processos
| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | UUID | Identificador unico |
| user_id | UUID | Advogado responsavel |
| cliente_id | UUID | Cliente vinculado |
| numero_processo | text | Numero do processo judicial |
| tipo_processo | text | Tipo (criminal, civel, etc.) |
| cliente_preso | boolean | Se o cliente esta preso |
| prazo | date | Data limite |
| status | text | ATIVO, ARQUIVADO |

#### financeiro
| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | UUID | Identificador unico |
| user_id | UUID | Advogado |
| processo_id | UUID | Processo relacionado |
| cliente_nome | text | Nome do cliente |
| valor | numeric | Valor em reais |
| tipo | text | HONORARIOS, ENTRADA, PARCELA |
| status | text | PENDENTE, PAGO, VENCIDO |
| vencimento | date | Data de vencimento |
| data_pagamento | date | Data em que foi pago |

#### documentos_digitais
Documentos para assinatura eletronica com integracao DocuSeal

| Campo | Tipo | Descricao |
|-------|------|-----------|
| id | UUID | Identificador unico |
| user_id | UUID | Dono do documento |
| nome | text | Nome do documento |
| tipo | text | Tipo do documento |
| status | text | TEMPLATE_CRIADO, ENVIADO, ASSINADO |
| docuseal_template_id | text | ID do template no DocuSeal |
| docuseal_submission_id | text | ID da submissao no DocuSeal |
| signatarios | jsonb | Lista de signatarios |
| webhook_data | jsonb | Dados recebidos via webhook |

#### documentos_processo
Arquivos anexados a processos

#### notificacoes
Sistema de notificacoes internas

#### observacoes_processo
Notas e anotacoes sobre processos

#### responsavel_financeiro
Dados de quem e responsavel pelo pagamento

#### user_invitations
Convites pendentes para novos usuarios

#### user_permissions
Permissoes especificas por usuario

#### user_roles
Funcoes atribuidas aos usuarios

---

## 7. Rotas da Aplicacao

### 7.1 Paginas Publicas
| Rota | Pagina | Descricao |
|------|--------|-----------|
| `/` | Index | Pagina inicial/landing |
| `/auth` | Auth | Login e cadastro |
| `/termos-servico` | TermosServico | Termos de servico |
| `/politica-privacidade` | PoliticaPrivacidade | Politica de privacidade |
| `/contato` | Contato | Pagina de contato |
| `/sobre` | Sobre | Sobre o sistema |
| `/servicos` | Servicos | Servicos oferecidos |

### 7.2 Paginas Protegidas (requer login)
| Rota | Pagina | Descricao |
|------|--------|-----------|
| `/dashboard` | Dashboard | Painel principal |
| `/novo-processo` | NewProcess | Cadastro/edicao de processo |
| `/processo/:id` | ProcessView | Visualizacao de processo |
| `/financeiro` | Financial | Gestao financeira |
| `/financeiro/cliente/:clienteNome` | ProcessFinancial | Financeiro por cliente |
| `/ia-facilita` | IAFacilita | Assistente IA |
| `/facilisign` | FaciliSign | Assinatura digital |
| `/google-integration` | GoogleIntegration | Configuracao Google |
| `/calendar` | CalendarManagement | Agenda/calendario |
| `/whatsapp` | WhatsAppManagement | Gestao WhatsApp |
| `/user-management` | UserManagement | Gestao de usuarios |
| `/accept-invitation` | AcceptInvitation | Aceitar convite |

---

## 8. Variaveis de Ambiente Necessarias

| Variavel | Descricao | Obrigatoria |
|----------|-----------|-------------|
| `VITE_SUPABASE_URL` | URL do projeto Supabase | Sim |
| `VITE_SUPABASE_ANON_KEY` | Chave anonima do Supabase | Sim |
| `VITE_GOOGLE_CLIENT_ID` | Client ID do Google OAuth | Sim |
| `VITE_GOOGLE_CLIENT_SECRET` | Client Secret do Google OAuth | Sim |
| `VITE_WHATSAPP_API_URL` | URL da API do WhatsApp | Opcional |

**Nota**: O sistema nao utiliza banco de dados local. Todas as operacoes de dados sao feitas diretamente no Supabase.

---

## 9. Fluxos Principais

### 9.1 Fluxo de Cadastro de Processo

```
1. Usuario acessa /novo-processo
2. Preenche dados do cliente (etapa 1)
3. Preenche dados do processo (etapa 2)
4. Define valores financeiros e parcelas (etapa 3)
5. Anexa documentos (etapa 4)
6. Adiciona observacoes (etapa 5)
7. Sistema salva todas as informacoes no Supabase
8. Usuario e redirecionado para visualizacao do processo
```

### 9.2 Fluxo de Cobranca via WhatsApp

```
1. Sistema identifica parcelas vencidas
2. Usuario acessa WhatsApp Manager
3. Seleciona clientes para envio
4. Sistema chama Edge Function 'twilio-send-message'
5. Mensagem e enviada via Twilio
6. Registra tentativa de cobranca no banco
```

### 9.3 Fluxo de Assinatura Digital

```
1. Usuario faz upload do documento PDF
2. Sistema chama Edge Function 'docuseal-upload'
3. Template e criado no DocuSeal
4. Usuario adiciona signatarios
5. Sistema chama 'docuseal-send-signature'
6. Signatario recebe email e assina
7. Webhook atualiza status no banco
8. Usuario pode baixar documento via 'docuseal-get-download-url'
```

### 9.4 Fluxo de Consulta com IA

```
1. Usuario acessa /ia-facilita
2. Seleciona modo (Chat, Agente, Pesquisa, Investigar)
3. Digita pergunta e/ou anexa arquivos
4. Sistema chama Edge Function correspondente:
   - Chat: 'ai-chat'
   - Agente/Investigar: 'agent-mode'
   - Pesquisa: 'web-search'
5. Resposta e exibida com fontes (quando aplicavel)
```

---

## 10. Seguranca

### 10.1 Autenticacao
- Autenticacao via Supabase Auth com email/senha
- Tokens JWT com refresh automatico
- Sessoes persistentes com seguranca

### 10.2 Autorizacao
- Row Level Security (RLS) no Supabase
- Verificacao de permissoes por recurso
- Roles hierarquicas (master > admin > user)

### 10.3 Protecao de Dados
- Criptografia SSL/TLS em transito
- Dados sensiveis armazenados de forma segura no Supabase
- Isolamento de dados por usuario (user_id)

### 10.4 Edge Functions
- Autenticacao via Bearer Token
- Validacao de sessao do usuario
- Logs de auditoria no Supabase

---

## 11. Hooks Personalizados

O sistema utiliza diversos hooks React personalizados para encapsular logica de negocio:

| Hook | Arquivo | Funcao |
|------|---------|--------|
| `useAuth` | `client/src/hooks/useAuth.ts` | Gerenciamento de autenticacao e sessao |
| `usePermissions` | `client/src/hooks/usePermissions.ts` | Verificacao de permissoes do usuario |
| `useDocuSeal` | `client/src/hooks/useDocuSeal.ts` | Integracao com DocuSeal para assinaturas |
| `useEmailService` | `client/src/hooks/useEmailService.ts` | Envio de emails |
| `useGoogleAuth` | `client/src/hooks/useGoogleAuth.ts` | Autenticacao Google OAuth |
| `useGoogleCalendar` | `client/src/hooks/useGoogleCalendar.ts` | Integracao Google Calendar |
| `useGmail` | `client/src/hooks/useGmail.ts` | Envio de emails via Gmail |
| `useWhatsAppStats` | `client/src/hooks/useWhatsAppStats.ts` | Estatisticas do WhatsApp |
| `useBulkCobrancaMessages` | `client/src/hooks/useBulkCobrancaMessages.ts` | Envio de cobrancas em massa |
| `useClienteExcel` | `client/src/hooks/useClienteExcel.ts` | Importacao de clientes via Excel |
| `useFileUpload` | `client/src/hooks/useFileUpload.ts` | Upload de arquivos |
| `useTemplateId` | `client/src/hooks/useTemplateId.ts` | Gerenciamento de templates DocuSeal |
| `useUserRole` | `client/src/hooks/useUserRole.ts` | Verificacao de role do usuario |

---

## 12. Consideracoes Finais

O Facilita ADV e uma solucao completa para escritorios de advocacia que precisam:

1. **Organizar processos** - Centralizacao de todas as informacoes processuais
2. **Controlar financas** - Gestao de honorarios, parcelas e inadimplencia
3. **Automatizar comunicacao** - Integracoes com WhatsApp e Gmail
4. **Assinar documentos** - Assinatura eletronica valida juridicamente
5. **Agendar compromissos** - Integracao com Google Calendar
6. **Delegar tarefas** - Sistema multi-usuario com permissoes
7. **Consultar IA** - Assistente juridico com multiplos modos de operacao

O sistema foi desenvolvido com tecnologias modernas e esta preparado para escalar conforme a necessidade do escritorio.

---

*Documento gerado em: Dezembro 2024*
*Versao: 2.0*
*Ultima atualizacao: Inclusao das Edge Functions e Hooks personalizados*
