# Facilita Adv - Sistema de Gestao Juridica

## Overview

Facilita Adv is a comprehensive legal management system designed for Brazilian lawyers. The platform provides tools for managing legal cases, clients, financial tracking, document signing, and integrations with Google services (Gmail, Calendar). The application features a modern React frontend with a minimal Node.js/Express backend that serves the frontend, using Supabase for all data persistence and authentication.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with SWC for fast compilation
- **Styling**: Tailwind CSS with shadcn/ui component library
- **State Management**: TanStack React Query for server state
- **Routing**: React Router DOM for client-side navigation
- **Form Handling**: React Hook Form with Zod validation
- **Location**: All frontend code resides in `/client/src/`

### Backend Architecture
- **Runtime**: Node.js with Express (minimal - serves frontend only)
- **Purpose**: Serves Vite dev server and static files in production
- **Location**: Server code in `/server/`
- **No local database**: All data operations go directly to Supabase

### Data Storage
- **Database**: Supabase (PostgreSQL hosted externally)
- **Authentication**: Supabase Auth with email/password
- **File Storage**: Supabase Storage for documents
- **Edge Functions**: Supabase Edge Functions for AI and integrations
- **No Replit database**: System does not use DATABASE_URL or local PostgreSQL

### Authentication & Authorization
- Supabase Auth with email/password authentication
- JWT tokens managed by Supabase client library
- Role-based access control (master, admin, user roles)
- User permissions system with READ, WRITE, ADMIN levels
- Google OAuth integration for Gmail and Calendar access

### Key Design Patterns
- **Monorepo Structure**: Client, server, and shared code in single repository
- **Direct Supabase Access**: Frontend communicates directly with Supabase
- **Custom Hooks Pattern**: Business logic encapsulated in React hooks (`/client/src/hooks/`)
- **Service Layer**: External service integrations abstracted into services (`/client/src/services/`)

## External Dependencies

### Database & Storage (Supabase Only)
- **Supabase Database**: PostgreSQL database for all data
- **Supabase Auth**: User authentication and session management
- **Supabase Storage**: File uploads and document storage
- **Supabase Edge Functions**: Server-side logic for AI and integrations

### Google System-Wide Integration (Drive, Gmail, Calendar)

**IMPORTANTE**: As integrações Google são de nível de SISTEMA, não por usuário. Uma vez conectado por um administrador, TODOS os usuários do sistema têm acesso a Drive, Gmail e Calendar.

**Arquitetura**:
- **Auth Service**: `server/services/googleSystemAuthService.ts` - Gerencia OAuth2, tokens e refresh automático
- **Drive Service**: `server/services/googleDriveService.ts` - Upload/download de arquivos
- **Gmail Service**: `server/services/googleGmailService.ts` - Envio de emails
- **Calendar Service**: `server/services/googleCalendarService.ts` - Eventos do calendário
- **Credentials Storage**: Tabela `google_system_credentials` no Supabase (tokens criptografados)
- **Required Scopes**: userinfo.email, userinfo.profile, drive.file, gmail.send, gmail.readonly, calendar, calendar.events

**API Endpoints - Sistema** (`/api/google/system/*`):
- `GET /api/google/system/status` - Verifica status da conexão
- `GET /api/google/system/auth-url` - Gera URL de autenticação OAuth
- `GET /api/google/system/callback` - Callback do OAuth (recebe tokens)
- `POST /api/google/system/disconnect` - Desconecta a integração

**API Endpoints - Gmail** (`/api/gmail/*`):
- `GET /api/gmail/status` - Status e email conectado
- `POST /api/gmail/send` - Enviar email (to, subject, body, isHtml, cc, bcc)
- `GET /api/gmail/messages` - Listar mensagens
- `GET /api/gmail/messages/:messageId` - Obter mensagem específica

**API Endpoints - Calendar** (`/api/calendar/*`):
- `GET /api/calendar/status` - Status do calendário
- `GET /api/calendar/events` - Listar eventos (query params: timeMin, timeMax, facilitaOnly)
- `POST /api/calendar/events` - Criar evento
- `PATCH /api/calendar/events/:eventId` - Atualizar evento
- `DELETE /api/calendar/events/:eventId` - Deletar evento
- `GET /api/calendar/events/:eventId` - Obter evento específico

**API Endpoints - Drive** (`/api/drive/*`):
- `GET /api/drive/status` - Check if Drive is connected
- `GET /api/drive/root-folder` - Get/create root folder
- `GET /api/drive/process-folder/:numeroProcesso` - Get/create process folder
- `POST /api/drive/upload` - Upload file with multipart form data
- `POST /api/drive/upload-from-url` - Upload file from URL
- `GET /api/drive/folder/:folderId/files` - List folder contents
- `GET /api/drive/process-folders` - List all process folders
- `DELETE /api/drive/files/:fileId` - Delete file from Drive

**Migration Script** (run in Supabase SQL Editor):
- `supabase/migrations/20251223_google_system_credentials.sql` - Tabela para tokens do sistema
- `supabase/migrations/20251220_add_google_drive_fields.sql` - Add Drive fields to documentos_processo

**Configuração Inicial**:
1. Execute a migration `20251223_google_system_credentials.sql` no Supabase
2. Acesse `/google-integration` como administrador
3. Clique em "Conectar conta Google"
4. Autorize os escopos solicitados
5. Todos os usuários agora têm acesso às integrações

### Document Signing (ZapSign)
- **ZapSign Integration**: Digital signature service for legal documents
- **Server Service**: `server/services/zapsignService.ts` - API communication
- **Frontend Hook**: `client/src/hooks/useZapSign.ts` - React integration
- **UI Component**: `client/src/components/ZapSignDocuments.tsx` - Document management
- **API Token**: Stored in Replit Secrets as `ZAPSIGN_API_TOKEN`
- **Security**: All API calls proxied through backend to protect token
- **Database Table**: `zapsign_documents` - requires Supabase migration

**ZapSign Webhook** (for automatic status updates):
- **Endpoint**: `POST /api/zapsign/webhook`
- **Purpose**: Receives events when documents are signed
- **Event Type**: `doc_signed` - triggered when a signer signs the document
- **Security**: Optional `ZAPSIGN_WEBHOOK_SECRET` env var for validation

**Webhook Configuration in ZapSign**:
1. Access ZapSign dashboard > Webhooks configuration
2. Add new webhook with URL: `https://[YOUR_PUBLISHED_DOMAIN]/api/zapsign/webhook`
3. Select event: `documento-assinado` (doc_signed)
4. (Optional) Configure shared secret and add to Replit Secrets as `ZAPSIGN_WEBHOOK_SECRET`

**Production Webhook URL**: After publishing, use the production domain URL

**Migration Scripts** (run in Supabase SQL Editor):
- `supabase/migrations/20251220_create_zapsign_documents.sql` - Full script with RLS
- `supabase/migrations/20251220_create_zapsign_documents_simple.sql` - Simplified version
- `supabase/migrations/20251220_add_zapsign_webhook_fields.sql` - Webhook fields (signed_file_url, last_signer_*, signed_at)
- `supabase/migrations/README_ZAPSIGN.md` - Instructions

### Email Notifications (Resend via Replit Connectors)
- **Service**: `server/services/resendService.ts` - Email sending with templates
- **Frontend Service**: `client/src/services/emailService.ts` - API client
- **Connection**: Resend API via Replit Connectors (automatic key management)
- **From Email**: Configured in Resend connector settings

**Automatic Email Notifications**:
- **Document signature request**: Sent when ZapSign document is created (to signers)
- **Document signed**: Sent when webhook receives signature event (to document owner)

**Email API Endpoints** (`server/index.ts`):
- `POST /api/email/send` - Generic email sending
- `POST /api/email/document-signature` - Signature request notification
- `POST /api/email/document-signed` - Signed document notification
- `POST /api/email/deadline-reminder` - Process deadline reminder
- `POST /api/email/payment-reminder` - Payment due reminder
- `POST /api/email/user-invitation` - User invitation email
- `POST /api/email/task-reminder` - Task reminder notification

**Batch Notification Endpoints** (require authentication):
- `POST /api/notifications/send-deadline-reminders` - Send reminders for upcoming deadlines
- `POST /api/notifications/send-payment-reminders` - Send payment reminders to clients
- `POST /api/notifications/send-task-reminders` - Send task reminders
- `POST /api/notifications/send-all-reminders` - Send all reminder types at once

**Batch Notification Parameters**:
```json
{
  "daysAhead": 3,        // Days to look ahead (default: 3)
  "notifyEmail": "advogado@email.com"  // Required for deadline/task reminders
}
```

**Email Templates**: Professional HTML templates with FacilitaAdv branding
- Gradient header with logo
- Responsive design
- Urgency indicators for deadlines
- Action buttons for signatures

### Communication
- **WhatsApp Integration**: Via external API for sending billing messages
- **Twilio**: WhatsApp message sending (Supabase edge function)

### DataJud Integration (CNJ Court Data)
- **Edge Function**: `supabase/functions/datajud-lookup/index.ts`
- **Frontend Service**: `client/src/services/datajudService.ts`
- **Purpose**: Automatic fetch of court process information from CNJ database
- **API Key**: Stored in Supabase Edge Function env as `DATAJUD_API_KEY`
- **Features**:
  - Extracts tribunal code from process number format
  - Fetches class, movements, dates from DataJud API
  - Stores data in `processos` table (datajud_* fields)
  - Shows in "Info. do Processo" tab on ProcessView
- **Database Fields Added**:
  - `datajud_tribunal`: Court name (TJSP, TRF1, etc.)
  - `datajud_classe`: Process class
  - `datajud_movimentos`: Movements JSON
  - `datajud_ultima_atualizacao_cnj`: Last CNJ update
  - `datajud_ultima_movimentacao`: Last movement date
  - `datajud_atualizado_em`: When system updated data

### Google Calendar Integration (Secure)
- **Edge Function**: `supabase/functions/google-calendar/index.ts`
- **Frontend Service**: `client/src/services/googleCalendarSecureService.ts`
- **Security**: All OAuth token operations server-side only
- **Features**: Create, list, delete events with "[FACILITA ADV]" prefix

### Third-Party Libraries
- **jsPDF/html2canvas**: PDF generation for financial reports
- **XLSX**: Excel file import/export for client data
- **SweetAlert2**: Enhanced alert dialogs
- **Recharts**: Data visualization for financial charts

### Environment Variables Required
- `VITE_SUPABASE_URL`: Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Supabase anonymous key
- `VITE_GOOGLE_CLIENT_ID`: Google OAuth client ID (in Secrets)
- `VITE_GOOGLE_CLIENT_SECRET`: Google OAuth client secret (in Secrets)
- `VITE_WHATSAPP_API_URL`: WhatsApp service endpoint (optional)

### Credentials Location (Replit Secrets Tab)
- **Google Credentials**: Access via Replit Secrets tab
  - `VITE_GOOGLE_CLIENT_ID`
  - `VITE_GOOGLE_CLIENT_SECRET`
- **Gmail**: Connected via Replit Connectors (automatic token refresh)
- **Google Calendar**: Connected via Replit Connectors (automatic token refresh)
- **Google Drive**: Connected via Replit Connectors (automatic token refresh)

## GitHub Repository

**URL**: https://github.com/artbras/facilita.adv.br.git

### Workflow de Desenvolvimento

| Acao | Onde fazer |
|------|------------|
| Editar codigo | Neste workspace (`/home/runner/workspace`) |
| Testar aplicacao | Neste workspace (workflow ja configurado) |
| Salvar no GitHub | Comandos git no Shell |

### Como salvar alteracoes no GitHub

Apos fazer alteracoes no codigo, execute no **Shell**:

```bash
# Adicionar todas as alteracoes
git add -A

# Criar commit com descricao
git commit -m "Descricao das alteracoes"

# Enviar para o GitHub
git push origin main
```

### Observacoes Importantes

- O Replit cria checkpoints automaticos (backup interno)
- Para backup no GitHub, faca `git push` manualmente
- Nao e necessario criar pastas temporarias para enviar codigo
- O fluxo git padrao funciona normalmente

---

## Recent Changes

### December 2024 - Full Supabase Migration

**Completed:**
- Removed local database dependency (DATABASE_URL no longer required)
- Removed Passport.js authentication (now uses Supabase Auth directly)
- Removed server-side routes for CRUD operations (frontend accesses Supabase directly)
- Simplified Express server to only serve frontend
- Authentication now uses `supabase.auth.signInWithPassword()` and `supabase.auth.signUp()`
- Session management via `supabase.auth.getSession()` and `supabase.auth.onAuthStateChange()`
- Transferred code to new GitHub repository
- Removed Windows Zone.Identifier metadata files

**Removed Files:**
- `server/db.ts` - Local database connection
- `server/storage.ts` - Local storage interface
- `server/auth.ts` - Passport.js authentication
- `server/routes.ts` - API routes for CRUD

**Architecture:**
- Frontend communicates directly with Supabase for all data operations
- Express server only serves Vite in development and static files in production
- No local database required - Replit database service not needed
