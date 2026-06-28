# Configuração do Google Calendar

## 1. Criar projeto no Google Cloud

1. Acesse [console.cloud.google.com](https://console.cloud.google.com).
2. Clique em **Select a project → New Project**.
3. Nome: `routey66-ai`
4. Clique em **Create**.

---

## 2. Ativar a API do Google Calendar

1. No menu lateral: **APIs & Services → Library**.
2. Busque por **Google Calendar API**.
3. Clique em **Enable**.

---

## 3. Criar credenciais OAuth 2.0

1. Vá em **APIs & Services → Credentials**.
2. Clique em **+ Create Credentials → OAuth client ID**.
3. Tipo: **Web application**.
4. Nome: `routey66-calendar`
5. Em **Authorized redirect URIs**, adicione:
   - `https://developers.google.com/oauthplayground`
6. Clique em **Create**.
7. Copie o **Client ID** e **Client Secret**.

---

## 4. Obter o Refresh Token

1. Acesse [OAuth 2.0 Playground](https://developers.google.com/oauthplayground).
2. Clique no ícone de configuração (⚙️) no canto superior direito.
3. Marque **Use your own OAuth credentials**.
4. Preencha com seu Client ID e Client Secret.
5. No passo 1, selecione: `https://www.googleapis.com/auth/calendar`.
6. Clique em **Authorize APIs** e faça login com a conta Google da oficina.
7. No passo 2, clique em **Exchange authorization code for tokens**.
8. Copie o **Refresh token**.

---

## 5. Obter o Calendar ID

1. Acesse [calendar.google.com](https://calendar.google.com).
2. Na barra lateral, clique nos 3 pontos do calendário desejado → **Settings and sharing**.
3. Copie o **Calendar ID** (ex: `abc123@group.calendar.google.com`).

---

## 6. Configurar .env

```env
GOOGLE_CLIENT_ID=seu_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu_client_secret
GOOGLE_REFRESH_TOKEN=1//0e...
GOOGLE_CALENDAR_ID=seu_calendario@group.calendar.google.com
```

---

## 7. Testar integração

```bash
curl -X GET http://localhost:3000/admin/appointments \
  -H "x-admin-key: sua_admin_key"
```

Ao criar um agendamento, verifique se o evento aparece no Google Calendar.
