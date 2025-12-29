import { pgTable, text, serial, integer, boolean, timestamp, numeric, uuid, jsonb, date, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const appRoleEnum = pgEnum('app_role', ['master', 'admin', 'user']);
export const permissionTypeEnum = pgEnum('permission_type', ['READ', 'WRITE', 'ADMIN']);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  nome: text("nome"),
  role: text("role").default("user"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const clientes = pgTable("clientes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: integer("user_id").notNull().references(() => users.id),
  nome: text("nome").notNull(),
  email: text("email"),
  telefone: text("telefone"),
  cpfCnpj: text("cpf_cnpj"),
  endereco: text("endereco"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const processos = pgTable("processos", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: integer("user_id").notNull().references(() => users.id),
  clienteId: uuid("cliente_id").notNull().references(() => clientes.id),
  numeroProcesso: text("numero_processo").notNull(),
  tipoProcesso: text("tipo_processo").notNull(),
  clientePreso: boolean("cliente_preso").default(false),
  descricao: text("descricao"),
  prazo: date("prazo"),
  status: text("status").default("ATIVO"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const financeiro = pgTable("financeiro", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: integer("user_id").notNull().references(() => users.id),
  processoId: uuid("processo_id").references(() => processos.id),
  clienteNome: text("cliente_nome").notNull(),
  valor: numeric("valor").notNull(),
  tipo: text("tipo").notNull(),
  status: text("status").default("PENDENTE"),
  vencimento: date("vencimento"),
  dataPagamento: date("data_pagamento"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const chatConversations = pgTable("chat_conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  messages: jsonb("messages").default([]),
  mode: text("mode").default("chat"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const documentosAssinatura = pgTable("documentos_assinatura", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: integer("user_id").notNull().references(() => users.id),
  nome: text("nome").notNull(),
  tipo: text("tipo").notNull(),
  status: text("status").default("PENDENTE"),
  dataEnvio: timestamp("data_envio").defaultNow(),
  dataAssinatura: timestamp("data_assinatura"),
  signatarios: text("signatarios").array(),
  arquivoUrl: text("arquivo_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const documentosDigitais = pgTable("documentos_digitais", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: integer("user_id").notNull().references(() => users.id),
  nome: text("nome").notNull(),
  tipo: text("tipo"),
  status: text("status").default("TEMPLATE_CRIADO"),
  docusealTemplateId: text("docuseal_template_id"),
  docusealSubmissionId: text("docuseal_submission_id"),
  signatarios: jsonb("signatarios"),
  webhookData: jsonb("webhook_data"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const documentosProcesso = pgTable("documentos_processo", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: integer("user_id").notNull().references(() => users.id),
  processoId: uuid("processo_id").references(() => processos.id),
  clienteNome: text("cliente_nome").notNull(),
  nomeArquivo: text("nome_arquivo").notNull(),
  tipoArquivo: text("tipo_arquivo").notNull(),
  tamanhoArquivo: integer("tamanho_arquivo").notNull(),
  urlArquivo: text("url_arquivo").notNull(),
  descricao: text("descricao"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const notificacoes = pgTable("notificacoes", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: integer("user_id").notNull().references(() => users.id),
  tipo: text("tipo").notNull(),
  titulo: text("titulo").notNull(),
  mensagem: text("mensagem").notNull(),
  clienteNome: text("cliente_nome"),
  lida: boolean("lida").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const observacoesProcesso = pgTable("observacoes_processo", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: integer("user_id").notNull().references(() => users.id),
  processoId: uuid("processo_id").references(() => processos.id),
  clienteNome: text("cliente_nome").notNull(),
  titulo: text("titulo").notNull(),
  conteudo: text("conteudo").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const responsavelFinanceiro = pgTable("responsavel_financeiro", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: integer("user_id").notNull().references(() => users.id),
  nome: text("nome").notNull(),
  rg: text("rg").notNull(),
  cpf: text("cpf").notNull(),
  dataNascimento: date("data_nascimento").notNull(),
  telefone: text("telefone").notNull(),
  email: text("email").notNull(),
  enderecoCompleto: text("endereco_completo").notNull(),
  cep: text("cep").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userInvitations = pgTable("user_invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull(),
  nome: text("nome").notNull(),
  invitedBy: integer("invited_by").notNull().references(() => users.id),
  status: text("status").default("PENDING"),
  token: text("token").unique(),
  permissions: text("permissions").array(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const userPermissions = pgTable("user_permissions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: integer("user_id").notNull().references(() => users.id),
  permission: text("permission").notNull(),
  grantedBy: integer("granted_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

export const userRoles = pgTable("user_roles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: integer("user_id").notNull().references(() => users.id),
  role: text("role").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const zapsignDocuments = pgTable("zapsign_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: integer("user_id").notNull().references(() => users.id),
  processoId: uuid("processo_id").references(() => processos.id),
  clienteId: uuid("cliente_id").references(() => clientes.id),
  nome: text("nome").notNull(),
  zapsignToken: text("zapsign_token"),
  zapsignOpenId: integer("zapsign_open_id"),
  status: text("status").default("pending"),
  originalFileUrl: text("original_file_url"),
  signedFileUrl: text("signed_file_url"),
  signatarios: jsonb("signatarios"),
  externalId: text("external_id"),
  dateLimitToSign: timestamp("date_limit_to_sign"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  processId: uuid("process_id").notNull().references(() => processos.id),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date").notNull(),
  status: text("status").default("pending"),
  priority: text("priority").default("medium"),
  notifyClient: boolean("notify_client").default(false),
  notificationSent: boolean("notification_sent").default(false),
  syncedWithGoogle: boolean("synced_with_google").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true, updatedAt: true });
export const insertClienteSchema = createInsertSchema(clientes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertProcessoSchema = createInsertSchema(processos).omit({ id: true, createdAt: true, updatedAt: true });
export const insertFinanceiroSchema = createInsertSchema(financeiro).omit({ id: true, createdAt: true, updatedAt: true });
export const insertChatConversationSchema = createInsertSchema(chatConversations).omit({ id: true, createdAt: true, updatedAt: true });
export const insertNotificacaoSchema = createInsertSchema(notificacoes).omit({ id: true, createdAt: true, updatedAt: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, createdAt: true });

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertCliente = z.infer<typeof insertClienteSchema>;
export type Cliente = typeof clientes.$inferSelect;
export type InsertProcesso = z.infer<typeof insertProcessoSchema>;
export type Processo = typeof processos.$inferSelect;
export type InsertFinanceiro = z.infer<typeof insertFinanceiroSchema>;
export type Financeiro = typeof financeiro.$inferSelect;
export type InsertChatConversation = z.infer<typeof insertChatConversationSchema>;
export type ChatConversation = typeof chatConversations.$inferSelect;
export type InsertNotificacao = z.infer<typeof insertNotificacaoSchema>;
export type Notificacao = typeof notificacoes.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export const insertZapsignDocumentSchema = createInsertSchema(zapsignDocuments).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertZapsignDocument = z.infer<typeof insertZapsignDocumentSchema>;
export type ZapsignDocument = typeof zapsignDocuments.$inferSelect;

export interface ZapsignSigner {
  name: string;
  email?: string;
  phone_country?: string;
  phone_number?: string;
  cpf?: string;
  auth_mode?: string;
  send_automatic_email?: boolean;
  send_automatic_whatsapp?: boolean;
  require_cpf?: boolean;
}

export interface ZapsignCreateDocRequest {
  name: string;
  url_pdf?: string;
  base64_pdf?: string;
  signers: ZapsignSigner[];
  lang?: string;
  external_id?: string;
  date_limit_to_sign?: string;
  disable_signer_emails?: boolean;
  folder_path?: string;
}

export interface ZapsignSignerResponse {
  token: string;
  sign_url: string;
  status: string;
  name: string;
  email: string;
  phone_country: string;
  phone_number: string;
  times_viewed: number;
  last_view_at: string | null;
  signed_at: string | null;
}

export interface ZapsignDocResponse {
  open_id: number;
  token: string;
  status: string;
  name: string;
  original_file: string;
  signed_file: string | null;
  created_at: string;
  last_update_at: string;
  signers: ZapsignSignerResponse[];
}

// ====================================================================
// ZapSign OneClick API Types
// ====================================================================

export interface ZapsignOneClickSigner {
  name: string;
  email?: string;
  phone_country?: string; // "+55"
  phone_number?: string;
  send_automatic_email?: boolean;
  send_automatic_whatsapp?: boolean;
  send_automatic_whatsapp_signed_file?: boolean;
  qualification?: string; // "testemunha", "advogado", "parte"
  order_group?: number;
  custom_message?: string;
  external_id?: string;
  redirect_link?: string;
}

export interface ZapsignOneClickRequest {
  name: string;
  base64_pdf?: string;
  url_pdf?: string;
  base64_docx?: string;
  url_docx?: string;
  signers: ZapsignOneClickSigner[];
  // OneClick specific
  one_click_active: boolean; // ALWAYS true for OneClick
  require_signature?: boolean; // Require drawing signature
  // Document options
  lang?: 'pt-br' | 'es' | 'en';
  brand_name?: string;
  brand_logo?: string;
  brand_primary_color?: string;
  external_id?: string;
  folder_path?: string;
  date_limit_to_sign?: string;
  signature_order_active?: boolean;
  observers?: string[];
  reminder_every_n_days?: number;
  disable_signer_emails?: boolean;
  allow_refuse_signature?: boolean;
  disable_signers_get_original_file?: boolean;
}

