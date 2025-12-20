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

### Google Services Integration (via Replit Connectors)
- **Google OAuth 2.0**: Authentication for Google services
- **Gmail Integration**: Email sending and management (`client/src/services/googleGmailService.ts`)
- **Google Calendar Integration**: Calendar event management (`client/src/services/googleCalendarService.ts`)
- **Credentials**: Managed via `VITE_GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_SECRET` secrets
- **Required Scopes**: userinfo.email, userinfo.profile, gmail.send, calendar, drive

**Configuration**:
- Google credentials are stored as Replit secrets
- Services use Replit Connectors for secure token management
- No need to implement OAuth flow manually - handled by Replit integration

### Google Drive Integration (Document Sync)
- **Server Service**: `server/services/googleDriveService.ts` - Backend API communication
- **Frontend Hook**: `client/src/hooks/useGoogleDrive.ts` - React integration
- **UI Component**: `client/src/components/ProcessoArquivos.tsx` - File upload with Drive sync
- **Connection**: Via Replit Connectors (automatic OAuth and token refresh)
- **Root Folder**: "FACILITA ADV" created automatically in user's Drive
- **Process Folders**: Created automatically using process number as folder name

**Features**:
- Automatic sync of uploaded files to Google Drive
- Creates folder structure: FACILITA ADV > [numero_processo]
- Manual sync button for existing files not yet in Drive
- Direct link to view files in Google Drive
- Connection status indicator in UI

**API Endpoints** (`server/index.ts`):
- `GET /api/drive/status` - Check if Drive is connected
- `GET /api/drive/root-folder` - Get/create root folder
- `GET /api/drive/process-folder/:numeroProcesso` - Get/create process folder
- `POST /api/drive/upload` - Upload file with multipart form data
- `POST /api/drive/upload-from-url` - Upload file from URL
- `GET /api/drive/folder/:folderId/files` - List folder contents
- `GET /api/drive/process-folders` - List all process folders
- `DELETE /api/drive/files/:fileId` - Delete file from Drive

**Migration Script** (run in Supabase SQL Editor):
- `supabase/migrations/20251220_add_google_drive_fields.sql` - Add Drive fields to documentos_processo

### Document Signing (ZapSign)
- **ZapSign Integration**: Digital signature service for legal documents
- **Server Service**: `server/services/zapsignService.ts` - API communication
- **Frontend Hook**: `client/src/hooks/useZapSign.ts` - React integration
- **UI Component**: `client/src/components/ZapSignDocuments.tsx` - Document management
- **API Token**: Stored in Replit Secrets as `ZAPSIGN_API_TOKEN`
- **Security**: All API calls proxied through backend to protect token
- **Database Table**: `zapsign_documents` - requires Supabase migration

**Migration Scripts** (run in Supabase SQL Editor):
- `supabase/migrations/20251220_create_zapsign_documents.sql` - Full script with RLS
- `supabase/migrations/20251220_create_zapsign_documents_simple.sql` - Simplified version
- `supabase/migrations/README_ZAPSIGN.md` - Instructions

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

**URL**: https://github.com/artbras/facilita.adv-original.git

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
