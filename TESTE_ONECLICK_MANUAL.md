# 🧪 Guia de Teste Manual - ZapSign OneClick

## 📋 Pré-requisitos

1. ✅ Servidor rodando: `npm run dev`
2. ✅ Conta ZapSign configurada com API Token
3. ✅ Variável `ZAPSIGN_API_TOKEN` configurada no `.env`
4. ✅ Usuário autenticado no sistema

---

## 🔑 Obter Token de Autenticação

### Opção 1: Via Browser DevTools
1. Abra o sistema em `http://localhost:5000`
2. Faça login normalmente
3. Abra DevTools (F12) → Network
4. Fique em qualquer página autenticada
5. Procure por request com header `Authorization`
6. Copie o valor: `Bearer eyJhbGc...`

### Opção 2: Via Supabase

```javascript
// Execute no Console do browser (dentro do sistema logado)
const session = await supabase.auth.getSession();
console.log('Token:', session.data.session?.access_token);
```

---

## 🧪 Cenários de Teste

### ✅ TESTE 1: Email Automático (ZapSign envia)

**Objetivo:** Verificar se ZapSign envia email automaticamente

**Request:**
```bash
curl -X POST http://localhost:5000/api/zapsign/documents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "useOneClick": true,
    "name": "Teste Email Auto",
    "url_pdf": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    "signers": [{
      "name": "Seu Nome",
      "email": "seu.email@gmail.com",
      "send_automatic_email": true,
      "qualification": "parte"
    }]
  }'
```

**Verificações:**
- ✅ Status 200 OK
- ✅ Response tem `token`, `open_id`, `signers[].sign_url`
- ✅ Console mostra: `[ZapSign] Skipping custom emails - ZapSign will send...`
- ✅ **EMAIL CHEGA** na caixa de entrada (ZapSign envia)
- ✅ Link formato: `https://app.zapsign.com.br/verificar/oneclick/{token}`

---

### ✅ TESTE 2: Email Manual (Sistema envia)

**Objetivo:** Verificar se nosso sistema envia email customizado

**Request:**
```bash
curl -X POST http://localhost:5000/api/zapsign/documents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "useOneClick": true,
    "name": "Teste Email Manual",
    "url_pdf": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    "notifyEmail": true,
    "clientName": "Cliente Teste",
    "signers": [{
      "name": "Seu Nome",
      "email": "seu.email@gmail.com",
      "send_automatic_email": false
    }]
  }'
```

**Verificações:**
- ✅ Status 200 OK
- ✅ Console mostra: `[ZapSign] Custom email notification sent to...`
- ✅ **EMAIL CHEGA** com layout do sistema (Resend)

---

### ✅ TESTE 3: Ordem de Assinatura

**Objetivo:** Verificar assinatura sequencial

**Request:**
```bash
curl -X POST http://localhost:5000/api/zapsign/documents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "useOneClick": true,
    "name": "Teste Ordem Sequencial",
    "url_pdf": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    "signature_order_active": true,
    "signers": [
      {
        "name": "Primeiro",
        "email": "primeiro@test.com",
        "order_group": 1,
        "send_automatic_email": true
      },
      {
        "name": "Segundo",
        "email": "segundo@test.com",
        "order_group": 2,
        "send_automatic_email": true
      }
    ]
  }'
```

**Verificações:**
- ✅ **"Primeiro"** recebe email imediatamente
- ✅ **"Segundo"** só recebe email após "Primeiro" assinar
- ✅ Painel ZapSign mostra ordem sequencial

---

### ✅ TESTE 4: WhatsApp Automático ⚠️ CUSTA R$ 0,50

**Objetivo:** Verificar envio via WhatsApp

> **ATENÇÃO:** Cada envio custa R$ 0,50. Verifique saldo em [ZapSign](https://app.zapsign.com.br/conta/configuracoes?tab=plans)

**Request:**
```bash
curl -X POST http://localhost:5000/api/zapsign/documents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "useOneClick": true,
    "name": "Teste WhatsApp",
    "url_pdf": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    "signers": [{
      "name": "Seu Nome",
      "phone_country": "+55",
      "phone_number": "11987654321",
      "send_automatic_whatsapp": true
    }]
  }'
```

**Verificações:**
- ✅ Mensagem WhatsApp chega no número informado
- ✅ Saldo ZapSign descontado em R$ 0,50

---

### ✅ TESTE 5: Backward Compatibility (API Padrão)

**Objetivo:** Garantir que API antiga ainda funciona

**Request:**
```bash
curl -X POST http://localhost:5000/api/zapsign/documents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN" \
  -d '{
    "useOneClick": false,
    "name": "Teste API Padrão",
    "url_pdf": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    "signers": [{
      "name": "Teste",
      "email": "teste@test.com",
      "auth_mode": "assinaturaTela",
      "require_cpf": true
    }]
  }'
```

**Verificações:**
- ✅ Status 200 OK
- ✅ Funciona igual à API antiga (sem OneClick)

---

## 🔍 Verificar Documento Criado

### Obter detalhes do documento

```bash
curl http://localhost:5000/api/zapsign/documents/{TOKEN_DO_DOCUMENTO} \
  -H "Authorization: Bearer SEU_TOKEN"
```

**Response esperado:**
```json
{
  "token": "7e23ab03...",
  "open_id": 4863,
  "status": "pending",
  "name": "Teste...",
  "original_file": "https://storage.zapsign.com.br/...",
  "signed_file": null,
  "signers": [
    {
      "token": "921c115d...",
      "sign_url": "https://app.zapsign.com.br/verificar/oneclick/921c115d...",
      "name": "...",
      "email": "...",
      "phone_number": "...",
      "status": "new"
    }
  ]
}
```

---

## 📊 Checklist de Verificação

### Backend OneClick
- [ ] Endpoint aceita `useOneClick: true`
- [ ] Endpoint aceita `useOneClick: false` (backward compat)
- [ ] Response tem formato correto (token, open_id, signers)
- [ ] Links têm formato OneClick: `/verificar/oneclick/{token}`

### Emails
- [ ] `send_automatic_email: true` → ZapSign envia ✅
- [ ] `send_automatic_email: false` → Sistema envia ✅
- [ ] Console log correto para cada cenário

### Parâmetros Opcionais
- [ ] `qualification` é enviado corretamente
- [ ] `order_group` funciona (assinatura sequencial)
- [ ] `signature_order_active` ativa ordem
- [ ] `brand_name: "FACILITA ADV"` aparece no email
- [ ] `external_id` é salvo no BD

### Banco de Dados
- [ ] Documento salvo em `documentos_digitais` (FaciliSign)
- [ ] Documento salvo em `zapsign_documents` (se vinculado a processo)
- [ ] Campos `zapsign_token`, `zapsign_open_id`, `status` preenchidos
- [ ] Array `signatarios` salvo corretamente

---

## ✅ Critérios de  Sucesso

1. ✅ **Todos os 5 testes passam**
2. ✅ **Emails chegam** (auto ou manual)
3. ✅ **Links OneClick funcionam** (abrem página certa)
4. ✅ **Console logs corretos**
5. ✅ **BD salva dados**
6. ✅ **API padrão continua funcionando**

---

## 🐛 Troubleshooting

### Erro 401 Unauthorized
- Verifique token de autenticação
- Token expira após tempo (renovar fazendo login)

### Erro 500 "ZAPSIGN_API_TOKEN not configured"
- Adicione `ZAPSIGN_API_TOKEN=seu_token` no `.env`
- Reinicie servidor

### Email não chega (auto)
- Verifique email correto
- Verifique spam
- Verifique conta ZapSign ativa

### Email não chega (manual)
- Verifique configuração Resend
- Verifique `RESEND_API_KEY` no `.env`

### Link OneClick não abre
- Verifique formato: deve ter `/oneclick/` no path
- Link pode expirar após 60 min (regenerar com GET /documents/{token})

---

## 📝 Próximos Passos

Após todos os testes passarem:

1. ✅ Backend OneClick validado
2. ⬜ Implementar frontend FaciliSign (campos restantes)
3. ⬜ Implementar frontend Aba Processo
4. ⬜ Testes E2E completos
5. ⬜ Documentação final

---

**Data:** 28/12/2024  
**Status:** Backend OneClick pronto para testes ✅
