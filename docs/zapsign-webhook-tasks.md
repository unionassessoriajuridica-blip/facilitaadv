# Task: Implementação de Webhooks ZapSign

## 📊 Banco de Dados
- [ ] Criar tabela `webhook_events` para auditoria
- [ ] Adicionar campos em `zapsign_documents`:
  - [ ] `last_event_type`
  - [ ] `last_event_at`
  - [ ] `expired_at`
  - [ ] `viewed_at`
  - [ ] `email_bounce_count`
  - [ ] `notification_sent_at`

## 🔧 Backend - Webhook Handlers
- [ ] Criar arquivo `zapsignWebhookHandlers.ts`
- [ ] Implementar handlers:
  - [x] `handleDocSigned` (já existe - migrar)
  - [ ] `handleDocExpired`
  - [ ] `handleExpirationAlert`
  - [ ] `handleEmailBounce`
  - [ ] `handleSignatureNotificationSent`
  - [ ] `handleDocViewed`
- [ ] Refatorar endpoint `/api/zapsign/webhook`
- [ ] Adicionar logging de eventos

## 🎨 Frontend - UI FaciliSign
- [ ] Criar componentes de badge de status
  - [ ] Badge "Assinado" (verde)
  - [ ] Badge "Expirado" (vermelho)
  - [ ] Badge "Visualizado" (azul)
  - [ ] Badge "Email Bounce" (amarelo alerta)
- [ ] Adicionar coluna "Último Evento" na tabela
- [ ] Adicionar tooltip com detalhes do evento
- [ ] Implementar auto-refresh (polling 30s)

## 🔔 Notificações
- [ ] Template email: Documento expirado
- [ ] Template email: Alerta de expiração
- [ ] Template email: Email bounce crítico

## ✅ Testes
- [ ] Testar webhook `doc_signed`
- [ ] Testar webhook `doc_expired`
- [ ] Testar webhook `doc_expiration_alert`
- [ ] Testar webhook `email_bounce`
- [ ] Testar webhook `signature_notification_sent`
- [ ] Testar webhook `doc_viewed`
- [ ] Validar atualização UI em tempo real
