# Scripts de Migracao ZapSign

## Como executar os scripts no Supabase

### Opcao 1: Via Supabase Dashboard (Recomendado)

1. Acesse o Supabase Dashboard: https://supabase.com/dashboard
2. Selecione seu projeto
3. Va para **SQL Editor** no menu lateral
4. Cole o conteudo do arquivo `20251220_create_zapsign_documents.sql`
5. Clique em **Run** para executar

### Opcao 2: Via Supabase CLI

Se voce tem o Supabase CLI instalado:

```bash
supabase db push
```

## Verificando a instalacao

Apos executar o script, verifique se a tabela foi criada:

```sql
SELECT * FROM zapsign_documents LIMIT 1;
```

## Estrutura da tabela

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | UUID | Chave primaria |
| user_id | INTEGER | Referencia ao usuario |
| processo_id | UUID | Referencia ao processo |
| cliente_id | UUID | Referencia ao cliente |
| nome | TEXT | Nome do documento |
| zapsign_token | TEXT | Token do documento no ZapSign |
| zapsign_open_id | INTEGER | ID publico no ZapSign |
| status | TEXT | pending, signed, refused, canceled |
| original_file_url | TEXT | URL do arquivo original |
| signed_file_url | TEXT | URL do arquivo assinado |
| signatarios | JSONB | Dados dos signatarios |
| external_id | TEXT | ID externo (processo_id) |
| date_limit_to_sign | TIMESTAMP | Prazo para assinatura |
| created_at | TIMESTAMP | Data de criacao |
| updated_at | TIMESTAMP | Data de atualizacao |

## Politicas de Seguranca (RLS)

O script configura Row Level Security para:
- Usuarios so podem ver/editar seus proprios documentos
- Backend com service_role tem acesso total

## Troubleshooting

Se o RLS estiver bloqueando operacoes, voce pode temporariamente desabilitar:

```sql
ALTER TABLE zapsign_documents DISABLE ROW LEVEL SECURITY;
```

Ou criar uma politica mais permissiva para testes:

```sql
CREATE POLICY "Allow all for authenticated" ON zapsign_documents
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);
```
