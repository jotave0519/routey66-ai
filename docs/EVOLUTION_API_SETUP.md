# Configuração da Evolution API

## 1. Subir com Docker Compose

```bash
docker-compose up -d evolution
```

Aguarde o container iniciar. A API estará disponível em `http://localhost:8080`.

---

## 2. Criar instância

```bash
curl -X POST http://localhost:8080/instance/create \
  -H "apikey: SUA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "instanceName": "routey66",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS"
  }'
```

---

## 3. Conectar WhatsApp

```bash
curl http://localhost:8080/instance/connect/routey66 \
  -H "apikey: SUA_API_KEY"
```

Escaneie o QR Code retornado com o WhatsApp do número da oficina.

**Verificar status da conexão:**
```bash
curl http://localhost:8080/instance/connectionState/routey66 \
  -H "apikey: SUA_API_KEY"
```

---

## 4. Configurar webhook

```bash
curl -X POST http://localhost:8080/webhook/set/routey66 \
  -H "apikey: SUA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://SEU_DOMINIO/webhook",
    "webhook_by_events": false,
    "webhook_base64": false,
    "events": ["MESSAGES_UPSERT"]
  }'
```

Para desenvolvimento local, use ngrok:
```bash
ngrok http 3000
# Copie a URL https:// gerada e use no lugar de SEU_DOMINIO
```

---

## 5. Configurar .env

```env
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=sua_api_key_aqui
EVOLUTION_INSTANCE_NAME=routey66
```

---

## 6. Testar

Envie uma mensagem de WhatsApp para o número conectado.
Verifique os logs do backend:
```bash
docker-compose logs -f api
```
