# Plano de Implementação - ZapSign Webhooks (6 Eventos)

## 🎯 Objetivo

Implementar 6 eventos essenciais do webhook ZapSign com atualização em tempo real na listagem do FaciliSign.

---

## 📋 Eventos a Implementar

| Evento | Prioridade | Status Atual | Ação |
|--------|-----------|--------------|------|
| `doc_signed` | ✅ Crítico | Implementado | Manter/Melhorar |
| `doc_expired` | 🔴 Alta | Não existe | **Criar** |
| `doc_expiration_alert` | 🟡 Média | Não existe | **Criar** |
| `email_bounce` | 🔴 Alta | Não existe | **Criar** |
| `signature_notification_sent` | 🟢 Baixa | Não existe | **Criar** |
| `doc_viewed` | 🟡 Média | Não existe | **Criar** |

---

## 🗄️ Fase 1: Banco de Dados

### **1.1 Nova Tabela: `webhook_events`**

```sql
-- Auditoria de todos os webhooks recebidos
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  document_token TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  success BOOLEAN DEFAULT true,
  error_message TEXT
);

CREATE INDEX idx_webhook_events_token ON webhook_events(document_token);
CREATE INDEX idx_webhook_events_type ON webhook_events(event_type);
CREATE INDEX idx_webhook_events_date ON webhook_events(processed_at DESC);
```

**Propósito:** Rastrear histórico completo de webhooks para debug e analytics.

---

### **1.2 Novos Campos: `zapsign_documents`**

```sql
-- Rastreamento de eventos
ALTER TABLE zapsign_documents 
  ADD COLUMN IF NOT EXISTS last_event_type TEXT,
  ADD COLUMN IF NOT EXISTS last_event_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS expired_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS viewed_by TEXT,
  ADD COLUMN IF NOT EXISTS email_bounce_count INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS notification_sent_at TIMESTAMPTZ;

-- Index para queries rápidas
CREATE INDEX IF NOT EXISTS idx_zapsign_docs_last_event 
  ON zapsign_documents(last_event_type, last_event_at DESC);
```

**Propósito:** Permitir queries rápidas e exibir status detalhado na UI.

---

## 🔧 Fase 2: Backend - Webhook Handlers

### **2.1 Criar `server/services/zapsignWebhookHandlers.ts`**

```typescript
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ============================================
// 1. DOC_SIGNED (JÁ EXISTE - MIGRAR E MELHORAR)
// ============================================
export async function handleDocSigned(payload: any) {
  const { token, status, signed_file, signer_who_signed } = payload;
  
  try {
    // Atualizar documento
    const { error } = await supabase
      .from('zapsign_documents')
      .update({
        status,
        signed_file_url: signed_file,
        last_signer_name: signer_who_signed?.name,
        last_signer_email: signer_who_signed?.email,
        signed_at: signer_who_signed?.signed_at,
        last_event_type: 'doc_signed',
        last_event_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('zapsign_token', token);

    if (error) throw error;

    // Log sucesso
    await logWebhookEvent('doc_signed', token, payload, true);
    
    console.log(`[Webhook] ✅ doc_signed → ${token}`);
  } catch (error: any) {
    console.error(`[Webhook] ❌ doc_signed → ${token}:`, error.message);
    await logWebhookEvent('doc_signed', token, payload, false, error.message);
  }
}

// ============================================
// 2. DOC_EXPIRED
// ============================================
export async function handleDocExpired(payload: any) {
  const { token } = payload;
  
  try {
    const { error } = await supabase
      .from('zapsign_documents')
      .update({
        status: 'expired',
        expired_at: new Date().toISOString(),
        last_event_type: 'doc_expired',
        last_event_at: new Date().toISOString(),
      })
      .eq('zapsign_token', token);

    if (error) throw error;

    // TODO: Enviar email de notificação de expiração
    // await sendExpirationNotification(token);

    await logWebhookEvent('doc_expired', token, payload, true);
    console.log(`[Webhook] ✅ doc_expired → ${token}`);
  } catch (error: any) {
    console.error(`[Webhook] ❌ doc_expired → ${token}:`, error.message);
    await logWebhookEvent('doc_expired', token, payload, false, error.message);
  }
}

// ============================================
// 3. DOC_EXPIRATION_ALERT
// ============================================
export async function handleExpirationAlert(payload: any) {
  const { token, days_until_expiration } = payload;
  
  try {
    // Apenas logar - não atualizar status do documento
    await logWebhookEvent('doc_expiration_alert', token, payload, true);
    
    // TODO: Enviar email de lembrete
    // await sendExpirationReminder(token, days_until_expiration);
    
    console.log(`[Webhook] ⏰ doc_expiration_alert → ${token} (${days_until_expiration} dias)`);
  } catch (error: any) {
    console.error(`[Webhook] ❌ doc_expiration_alert → ${token}:`, error.message);
    await logWebhookEvent('doc_expiration_alert', token, payload, false, error.message);
  }
}

// ============================================
// 4. EMAIL_BOUNCE
// ============================================
export async function handleEmailBounce(payload: any) {
  const { token, signer } = payload;
  
  try {
    // Incrementar contador de bounce
    const { error } = await supabase.rpc('increment_email_bounce', { 
      doc_token: token 
    });

    if (error) {
      // Fallback: update manual
      await supabase
        .from('zapsign_documents')
        .update({
          email_bounce_count: supabase.sql`email_bounce_count + 1`,
          last_event_type: 'email_bounce',
          last_event_at: new Date().toISOString(),
        })
        .eq('zapsign_token', token);
    }

    // TODO: Alerta crítico - email não chegou
    // await sendEmailBounceAlert(token, signer?.email);

    await logWebhookEvent('email_bounce', token, payload, true);
    console.log(`[Webhook] ⚠️ email_bounce → ${token} (${signer?.email})`);
  } catch (error: any) {
    console.error(`[Webhook] ❌ email_bounce → ${token}:`, error.message);
    await logWebhookEvent('email_bounce', token, payload, false, error.message);
  }
}

// ============================================
// 5. SIGNATURE_NOTIFICATION_SENT
// ============================================
export async function handleSignatureNotificationSent(payload: any) {
  const { token, signer, sent_via } = payload; // sent_via: 'email' | 'whatsapp'
  
  try {
    const { error } = await supabase
      .from('zapsign_documents')
      .update({
        notification_sent_at: new Date().toISOString(),
        last_event_type: 'signature_notification_sent',
        last_event_at: new Date().toISOString(),
      })
      .eq('zapsign_token', token);

    if (error) throw error;

    await logWebhookEvent('signature_notification_sent', token, payload, true);
    console.log(`[Webhook] 📧 signature_notification_sent → ${token} via ${sent_via || 'email'}`);
  } catch (error: any) {
    console.error(`[Webhook] ❌ signature_notification_sent → ${token}:`, error.message);
    await logWebhookEvent('signature_notification_sent', token, payload, false, error.message);
  }
}

// ============================================
// 6. DOC_VIEWED
// ============================================
export async function handleDocViewed(payload: any) {
  const { token, signer } = payload;
  
  try {
    const { error } = await supabase
      .from('zapsign_documents')
      .update({
        viewed_at: new Date().toISOString(),
        viewed_by: signer?.name || signer?.email,
        last_event_type: 'doc_viewed',
        last_event_at: new Date().toISOString(),
      })
      .eq('zapsign_token', token);

    if (error) throw error;

    await logWebhookEvent('doc_viewed', token, payload, true);
    console.log(`[Webhook] 👁️ doc_viewed → ${token} por ${signer?.name}`);
  } catch (error: any) {
    console.error(`[Webhook] ❌ doc_viewed → ${token}:`, error.message);
    await logWebhookEvent('doc_viewed', token, payload, false, error.message);
  }
}

// ============================================
// HELPER: LOG DE EVENTOS
// ============================================
async function logWebhookEvent(
  eventType: string,
  token: string,
  payload: any,
  success: boolean,
  errorMessage?: string
) {
  try {
    await supabase.from('webhook_events').insert({
      event_type: eventType,
      document_token: token,
      payload,
      success,
      error_message: errorMessage,
    });
  } catch (error) {
    console.error('[Webhook] Falha ao logar evento:', error);
  }
}
```

---

### **2.2 Refatorar `server/routes/zapsign.ts`**

```typescript
import * as webhookHandlers from '../services/zapsignWebhookHandlers';

// Webhook endpoint ATUALIZADO
router.post("/webhook", async (req: Request, res: Response) => {
  try {
    const payload = req.body;

    // 1. Validação de segurança
    if (ZAPSIGN_WEBHOOK_SECRET) {
      const receivedSecret = req.headers["x-zapsign-secret"] || req.query.secret;
      if (receivedSecret !== ZAPSIGN_WEBHOOK_SECRET) {
        console.warn("[Webhook] ❌ Invalid secret");
        return res.status(401).json({ error: "Unauthorized" });
      }
    }

    // 2. Validação de payload
    if (!payload?.event_type || !payload?.token) {
      console.warn("[Webhook] ❌ Invalid payload");
      return res.status(400).json({ error: "Invalid payload" });
    }

    console.log(`[Webhook] 📥 ${payload.event_type} → ${payload.token}`);

    // 3. Router para handler específico
    const handlers: Record<string, (p: any) => Promise<void>> = {
      'doc_signed': webhookHandlers.handleDocSigned,
      'doc_expired': webhookHandlers.handleDocExpired,
      'doc_expiration_alert': webhookHandlers.handleExpirationAlert,
      'email_bounce': webhookHandlers.handleEmailBounce,
      'signature_notification_sent': webhookHandlers.handleSignatureNotificationSent,
      'doc_viewed': webhookHandlers.handleDocViewed,
    };

    const handler = handlers[payload.event_type];
    
    if (handler) {
      // Processar de forma assíncrona (não bloquear resposta)
      handler(payload).catch(err => {
        console.error(`[Webhook] Handler failed for ${payload.event_type}:`, err);
      });
    } else {
      console.log(`[Webhook] ⏭️  ${payload.event_type} - evento não tratado`);
    }

    // 4. Responder imediatamente (ZapSign requer resposta rápida)
    res.status(200).json({ received: true, event_type: payload.event_type });
    
  } catch (error: any) {
    console.error("[Webhook] ❌ Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
```

---

## 🎨 Fase 3: Frontend - UI FaciliSign

### **3.1 Componente: Badge de Status**

**Arquivo:** `client/src/components/ui/event-badge.tsx` (NOVO)

```tsx
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Eye, AlertTriangle, Send, XCircle } from "lucide-react";

interface EventBadgeProps {
  eventType: string;
  timestamp?: string;
}

export function EventBadge({ eventType, timestamp }: EventBadgeProps) {
  const configs = {
    doc_signed: {
      icon: CheckCircle,
      label: "Assinado",
      variant: "success" as const,
      color: "text-green-600",
    },
    doc_expired: {
      icon: XCircle,
      label: "Expirado",
      variant: "destructive" as const,
      color: "text-red-600",
    },
    doc_viewed: {
      icon: Eye,
      label: "Visualizado",
      variant: "secondary" as const,
      color: "text-blue-600",
    },
    email_bounce: {
      icon: AlertTriangle,
      label: "Email Bounce",
      variant: "warning" as const,
      color: "text-yellow-600",
    },
    signature_notification_sent: {
      icon: Send,
      label: "Notificação Enviada",
      variant: "outline" as const,
      color: "text-gray-600",
    },
    doc_expiration_alert: {
      icon: Clock,
      label: "Alerta Expiração",
      variant: "outline" as const,
      color: "text-orange-600",
    },
  };

  const config = configs[eventType as keyof typeof configs] || {
    icon: Clock,
    label: eventType,
    variant: "outline" as const,
    color: "text-gray-600",
  };

  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className="gap-1">
      <Icon className={`h-3 w-3 ${config.color}`} />
      {config.label}
      {timestamp && (
        <span className="text-xs opacity-70 ml-1">
          {new Date(timestamp).toLocaleDateString('pt-BR')}
        </span>
      )}
    </Badge>
  );
}
```

---

### **3.2 Atualizar `FaciliSign.tsx` - Exibir Eventos**

```tsx
// Adicionar coluna na tabela de documentos
<TableHead>Último Evento</TableHead>

// No corpo da tabela
<TableCell>
  {doc.last_event_type ? (
    <EventBadge 
      eventType={doc.last_event_type} 
      timestamp={doc.last_event_at}
    />
  ) : (
    <span className="text-sm text-muted-foreground">-</span>
  )}
</TableCell>

// Tooltip com detalhes
{doc.viewed_at && (
  <p className="text-xs text-muted-foreground mt-1">
    Visualizado em {new Date(doc.viewed_at).toLocaleString('pt-BR')}
  </p>
)}

{doc.email_bounce_count > 0 && (
  <p className="text-xs text-red-600 mt-1">
    ⚠️ {doc.email_bounce_count} bounce(s)
  </p>
)}
```

---

### **3.3 Auto-Refresh com Polling**

```tsx
// Adicionar useEffect para polling
useEffect(() => {
  // Refresh inicial
  loadDocuments();

  // Polling a cada 30 segundos
  const interval = setInterval(() => {
    if (documents.length > 0) {
      loadDocuments(); // Recarregar lista silenciosamente
    }
  }, 30000); // 30s

  return () => clearInterval(interval);
}, []);
```

**Alternativa melhor: Supabase Realtime**

```tsx
useEffect(() => {
  const channel = supabase
    .channel('zapsign_documents_changes')
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'zapsign_documents',
      },
      (payload) => {
        console.log('🔄 Documento atualizado:', payload.new);
        // Atualizar documento específico na lista
        setDocuments(prev => 
          prev.map(doc => 
            doc.id === payload.new.id ? payload.new : doc
          )
        );
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);
```

---

## 📝 Fase 4: SQL Helper Functions

```sql
-- Função para incrementar bounce count
CREATE OR REPLACE FUNCTION increment_email_bounce(doc_token TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE zapsign_documents
  SET 
    email_bounce_count = COALESCE(email_bounce_count, 0) + 1,
    last_event_type = 'email_bounce',
    last_event_at = NOW()
  WHERE zapsign_token = doc_token;
END;
$$ LANGUAGE plpgsql;
```

---

## ✅ Checklist de Implementação

### **Sprint 1: Backend (1-2 dias)**
- [ ] Executar SQL migrations (tabela + campos)
- [ ] Criar `zapsignWebhookHandlers.ts`
- [ ] Implementar 6 handlers
- [ ] Refatorar endpoint webhook
- [ ] Testar com webhooks de teste

### **Sprint 2: Frontend (1 dia)**
- [ ] Criar componente `EventBadge`
- [ ] Adicionar coluna "Último Evento" em FaciliSign
- [ ] Implementar tooltips com detalhes
- [ ] Adicionar auto-refresh (polling ou realtime)
- [ ] Testar atualização em tempo real

### **Sprint 3: Polish (meio dia)**
- [ ] Validar todos os 6 eventos
- [ ] Ajustar cores/icones dos badges
- [ ] Adicionar animações de atualização
- [ ] Documentar webhook URL

---

## 🔗 Configuração no ZapSign

**Webhook URL:**
```
https://seu-dominio.com/api/zapsign/webhook
```

**Secret Header:**
```
X-ZapSign-Secret: seu_secret_aqui
```

**Eventos selecionados:**
- ✅ doc_signed
- ✅ doc_expired
- ✅ doc_expiration_alert
- ✅ email_bounce
- ✅ signature_notification_sent
- ✅ doc_viewed

---

## 🎯 Resultado Final

**UI FaciliSign terá:**
- ✅ Coluna "Último Evento" com badge visual
- ✅ Cores diferentes por tipo de evento
- ✅ Timestamp em cada badge
- ✅ Tooltips com detalhes
- ✅ Contador de email bounces
- ✅ Atualização automática a cada 30s (ou realtime)

**Backend terá:**
- ✅ 6 handlers modulares
- ✅ Logging completo em `webhook_events`
- ✅ Campos rastreados em `zapsign_documents`
- ✅ Resposta rápida (<200ms) para ZapSign

**Total estimado:** 2-3 dias de implementação
