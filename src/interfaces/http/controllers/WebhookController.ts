import { FastifyRequest, FastifyReply } from 'fastify'
import {
  EvolutionWebhookPayload,
  extractPhone,
  extractMessageText,
} from '../../../infrastructure/messaging/EvolutionAPIClient'
import { HandleIncomingMessage } from '../../../application/usecases/HandleIncomingMessage'

export class WebhookController {
  // Serializes processing per phone number so concurrent webhook deliveries
  // for the same conversation never interleave (Claude's API requires the
  // history to end with a "user" message; interleaving breaks that).
  private readonly phoneQueues = new Map<string, Promise<void>>()

  constructor(private readonly handleIncomingMessage: HandleIncomingMessage) {}

  async handle(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const webhookSecret = process.env.EVOLUTION_WEBHOOK_SECRET
    if (webhookSecret) {
      const provided = request.headers['x-webhook-secret'] ?? request.headers['apikey']
      if (provided !== webhookSecret) {
        reply.code(401).send({ error: 'Invalid webhook secret' })
        return
      }
    }

    const payload = request.body as EvolutionWebhookPayload

    if (payload.event !== 'messages.upsert') {
      reply.code(200).send({ status: 'ignored', reason: 'not a message event' })
      return
    }

    if (payload.data?.key?.fromMe) {
      reply.code(200).send({ status: 'ignored', reason: 'outgoing message' })
      return
    }

    const text = extractMessageText(payload)
    if (!text) {
      reply.code(200).send({ status: 'ignored', reason: 'no text content' })
      return
    }

    const phone = extractPhone(payload.data.key.remoteJid)

    reply.code(200).send({ status: 'processing' })

    const previous = this.phoneQueues.get(phone) ?? Promise.resolve()

    const next = previous.catch(() => {}).then(() =>
      this.handleIncomingMessage.execute({
        phone,
        text,
        whatsappName: payload.data.pushName,
      }),
    ).catch((err) => {
      console.error('[WebhookController] Error processing message:', err)
    })

    this.phoneQueues.set(phone, next)
    next.finally(() => {
      if (this.phoneQueues.get(phone) === next) this.phoneQueues.delete(phone)
    })
  }
}
