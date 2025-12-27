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

O sistema utiliza PostgreSQL com tabelas interconectadas. Abaixo as tabelas críticas para o funcionamento:

1. **clientes**: Armazena o cadastro básico e dados de contato.
2. **processos**: Tabela central vinculada a um cliente e a um advogado.
3. **financeiro**: Registros de 'Entrada', 'Honorários' e 'TMP'. Possui `processo_id` (Obrigatório após auditoria v2.0).
4. **documentos_processo**: Referência aos arquivos físicos no Supabase Storage.
5. **notificacoes**: Alertas de sistema e financeiros enviados aos usuários.
6. **zapsign_documents**: Gestão de processos de assinatura digital via ZapSign.

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
*Versão do Sistema: 2.5 (Auditoria & Prazos Edition)*
