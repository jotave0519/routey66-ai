# Configuração do Supabase

## 1. Criar projeto

1. Acesse [supabase.com](https://supabase.com) e faça login.
2. Clique em **New project**.
3. Preencha:
   - **Name**: `routey66-ai`
   - **Database Password**: use uma senha forte (guarde-a)
   - **Region**: South America (São Paulo)
4. Aguarde a criação (≈ 2 min).

---

## 2. Executar migration

1. No painel do Supabase, vá em **SQL Editor**.
2. Clique em **+ New query**.
3. Cole o conteúdo de `database/migrations/001_initial_schema.sql`.
4. Clique em **Run** (▶).
5. Execute também `database/seed.sql` para popular dados iniciais.

---

## 3. Obter credenciais

1. Vá em **Settings → API**.
2. Copie:
   - **Project URL** → `SUPABASE_URL`
   - **service_role (secret)** → `SUPABASE_SERVICE_ROLE_KEY`

⚠️ Use sempre a `service_role` key no backend (nunca a `anon`).

---

## 4. Configurar no .env

```env
SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...
```

---

## 5. Verificar tabelas

No Supabase, vá em **Table Editor** e confirme que existem:
- `customers`
- `vehicles`
- `services` (com 6 registros iniciais)
- `appointments`
- `conversations`
- `messages`
- `faq` (com 6 registros iniciais)
- `business_settings` (com 1 registro)
