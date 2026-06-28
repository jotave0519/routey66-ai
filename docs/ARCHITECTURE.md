# Arquitetura — Routey66 AI

## Visão geral

O sistema segue **Clean Architecture** com 4 camadas isoladas:

```
src/
├── domain/          # Entidades, interfaces de repositórios e serviços
├── infrastructure/  # Implementações concretas (Supabase, Evolution API, Claude, Google Calendar)
├── application/     # Casos de uso e serviços de aplicação (AgentService, RAGService)
└── interfaces/      # HTTP: rotas, controllers, middleware
```

Painel administrativo em `admin/` é uma aplicação Next.js separada que consome a API do backend.

---

## Fluxo de uma mensagem recebida

```
WhatsApp ──► Evolution API ──► POST /webhook
                                     │
                              WebhookController
                                     │
                         HandleIncomingMessage (use case)
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
             CustomerRepo    ConversationRepo   AgentService
                    │                │                │
                 Supabase        Supabase     RAGService + Claude
                                              (agentic loop)
                                                       │
                                              EvolutionAPIClient
                                                       │
                                               WhatsApp (resposta)
```

---

## AgentService — Loop agêntico

O `AgentService` implementa um loop de até 5 iterações onde:

1. **Monta contexto**: system prompt dinâmico gerado pelo `RAGService` com dados do banco.
2. **Chama Claude**: via `ClaudeAIService` com ferramentas disponíveis.
3. **Executa ferramentas**: `find_or_create_vehicle`, `get_available_slots`, `create_appointment`, `reschedule_appointment`, `cancel_appointment`, `transfer_to_human`.
4. **Repete**: injeta resultados das ferramentas e chama Claude novamente.
5. **Retorna**: a resposta final de texto para o cliente.

---

## RAGService — Contexto dinâmico

Antes de cada chamada ao Claude, o `RAGService` carrega do banco:

- **Configurações da oficina**: nome, endereço, horários, mensagem de boas-vindas
- **Serviços ativos**: lista dinâmica da tabela `services`
- **FAQ**: perguntas e respostas ativas da tabela `faq`
- **Contexto do cliente**: dados pessoais, veículos cadastrados, agendamentos futuros

Tudo isso é injetado no system prompt — **nenhuma informação da oficina fica hardcoded**.

---

## Google Calendar — Abstração

A interface `ICalendarService` desacopla o sistema do Google Calendar. Para trocar de provedor:

1. Criar nova implementação que implemente `ICalendarService`
2. Substituir `GoogleCalendarService` no `container.ts`

Zero mudanças nas camadas de domínio ou aplicação.

---

## Decisões de design

| Decisão | Motivo |
|---|---|
| Fastify (não Express) | Mais rápido, TypeScript-first, validação nativa |
| Supabase (não PostgreSQL puro) | Gerenciado, Row Level Security, Realtime, sem ops |
| Claude com tool use | Mais confiável que parsing de intenções com prompts livres |
| `setImmediate` no webhook | Responde 200 para Evolution API imediatamente, processa em background |
| Singleton em `business_settings` | Simplifica queries; único registro com `singleton=true` |
| Placa normalizada (sem pontuação) | Evita duplicatas por formato diferente (ABC-1234 = ABC1234) |
