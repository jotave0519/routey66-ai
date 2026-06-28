# Workflow: Configurar Ambiente

## Pré-requisitos
- Node.js 20+
- Docker e Docker Compose
- Conta Supabase, Anthropic, Google Cloud, Evolution API

## Passos para desenvolvimento local

### 1. Instalar dependências
```bash
# Backend
npm install

# Admin Panel
cd admin && npm install && cd ..
```

### 2. Configurar variáveis de ambiente
```bash
cp .env.example .env
# Preencher: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY,
#            EVOLUTION_API_KEY, GOOGLE_*, ADMIN_API_KEY
```

### 3. Executar migration do banco
- Copiar conteúdo de `database/migrations/001_initial_schema.sql`
- Executar no SQL Editor do Supabase
- Executar também `database/seed.sql`

### 4. Subir Evolution API
```bash
docker-compose up -d evolution
```

### 5. Criar instância e conectar WhatsApp
- Ver `docs/EVOLUTION_API_SETUP.md`

### 6. Subir backend em modo desenvolvimento
```bash
npm run dev
```
Servidor disponível em `http://localhost:3000`

### 7. Expor webhook com ngrok (para receber mensagens)
```bash
ngrok http 3000
# Configurar a URL ngrok como webhook na Evolution API
```

### 8. Subir painel administrativo
```bash
cd admin
NEXT_PUBLIC_API_URL=http://localhost:3000 ADMIN_API_KEY=sua_key npm run dev
```
Painel disponível em `http://localhost:3001`

## Passos para produção
Ver `docs/DEPLOY.md`

## Referenciar docs
- `docs/SUPABASE_SETUP.md` — banco de dados
- `docs/EVOLUTION_API_SETUP.md` — WhatsApp
- `docs/GOOGLE_CALENDAR_SETUP.md` — Google Calendar
- `docs/ARCHITECTURE.md` — decisões de design
