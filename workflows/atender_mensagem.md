# Workflow: Atender Mensagem do WhatsApp

## Objetivo
Receber mensagem via webhook da Evolution API, identificar o cliente, rodar o agente de IA com RAG e responder no WhatsApp.

## Ponto de entrada
`POST /webhook` → `WebhookController` → `HandleIncomingMessage` → `AgentService`

## Fluxo

### 1. Receber webhook
- Validar que `event === "messages.upsert"` e `fromMe === false`
- Extrair `phone`, `text`, `whatsappName`
- Retornar 200 imediatamente (processamento em background via `setImmediate`)

### 2. Identificar cliente
- Buscar em `customers` pelo telefone (`CustomerRepository.findByPhone`)
- Se não existir: criar com nome temporário; o agente pedirá o nome
- Se existir: atualizar `whatsappName` se mudou

### 3. Gerenciar conversa
- Buscar conversa ativa (`ConversationRepository.findActiveByCustomerId`)
- Se não houver: criar nova

### 4. Salvar mensagem do cliente
- `ConversationRepository.saveMessage` com `sender: 'customer'`

### 5. Executar agente (loop agêntico)
`AgentService.processMessage`:
1. `RAGService.buildContext` — carrega do banco: configurações, serviços, FAQ, veículos, agendamentos do cliente
2. `RAGService.buildSystemPrompt` — monta system prompt 100% dinâmico
3. Loop (até 5 iterações):
   - Chama Claude com ferramentas disponíveis
   - Executa as ferramentas retornadas
   - Injeta resultados e repete se necessário

### 6. Salvar resposta e enviar
- `ConversationRepository.saveMessage` com `sender: 'assistant'`
- `EvolutionAPIClient.sendText` para enviar no WhatsApp

### 7. Transferência humana
- Se `transferredToHuman === true`: atualizar status da conversa para `TRANSFERRED`

## Ferramentas do agente
| Ferramenta | Ação |
|---|---|
| `get_available_slots` | Consulta Google Calendar para horários livres |
| `find_or_create_vehicle` | Verifica/cria veículo pela placa |
| `create_appointment` | Cria agendamento no banco + Google Calendar |
| `reschedule_appointment` | Remarca agendamento |
| `cancel_appointment` | Cancela agendamento |
| `transfer_to_human` | Registra transferência e encerra loop |

## Casos excepcionais
| Situação | Ação |
|---|---|
| Erro no Google Calendar ao criar evento | Salva agendamento sem `google_event_id`; registra erro em `calendar_sync_error` |
| Mensagem não é texto | Ignorar (`status: "ignored"`) |
| Mensagem própria (`fromMe: true`) | Ignorar |
| Erro no agente | Logar; não responder para não deixar cliente sem retorno |
