# Guia de Deploy em VPS

## Pré-requisitos

- VPS com Ubuntu 22.04 LTS (mínimo 2 vCPU, 4 GB RAM)
- Domínio apontando para o IP da VPS
- Docker e Docker Compose instalados

---

## 1. Preparar o servidor

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Instalar Docker Compose
sudo apt install docker-compose-plugin -y

# Instalar Certbot (SSL)
sudo apt install certbot -y
```

---

## 2. Fazer upload do projeto

```bash
# Na sua máquina local
scp -r . usuario@IP_DA_VPS:/home/usuario/routey66
```

Ou clone do repositório:
```bash
git clone seu_repositorio /home/usuario/routey66
cd /home/usuario/routey66
```

---

## 3. Configurar .env de produção

```bash
cp .env.example .env
nano .env
```

Preencha todos os valores. Em produção, use chaves fortes e únicas.

---

## 4. Configurar SSL

```bash
# Parar nginx temporariamente se estiver rodando
sudo certbot certonly --standalone -d api.seudominio.com -d admin.seudominio.com
```

---

## 5. Ajustar nginx.conf

Edite `docker/nginx.conf` substituindo `seudominio.com` pelo seu domínio real.

---

## 6. Build e subir os containers

```bash
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

Verificar logs:
```bash
docker compose -f docker-compose.prod.yml logs -f api
```

---

## 7. Configurar webhook da Evolution API

```bash
curl -X POST http://localhost:8080/webhook/set/routey66 \
  -H "apikey: SUA_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://api.seudominio.com/webhook",
    "events": ["MESSAGES_UPSERT"]
  }'
```

---

## 8. Verificar saúde do sistema

```bash
# Health check da API
curl https://api.seudominio.com/health

# Status da Evolution API
curl http://localhost:8080/instance/connectionState/routey66 \
  -H "apikey: SUA_API_KEY"
```

---

## Renovação automática de SSL

```bash
# Adicionar ao crontab
echo "0 0 1 * * certbot renew --quiet && docker compose -f /home/usuario/routey66/docker-compose.prod.yml restart nginx" | crontab -
```

---

## Backups

O banco de dados está no Supabase (gerenciado). Para backup adicional:
- Vá em **Supabase → Settings → Database → Backups**
- Ative backups automáticos diários.
