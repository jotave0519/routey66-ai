import axios, { AxiosInstance } from 'axios'
import { IMessagingService } from '../../domain/services/IMessagingService'

export interface EvolutionWebhookPayload {
  event: string
  instance: string
  data: {
    key: {
      remoteJid: string
      fromMe: boolean
      id: string
    }
    pushName?: string
    message?: {
      conversation?: string
      extendedTextMessage?: { text: string }
      imageMessage?: { caption?: string }
    }
    messageType?: string
    messageTimestamp?: number
  }
}

export function extractPhone(remoteJid: string): string {
  return remoteJid.replace(/@s\.whatsapp\.net$/, '').replace(/@c\.us$/, '')
}

export function extractMessageText(payload: EvolutionWebhookPayload): string | null {
  const msg = payload.data?.message
  if (!msg) return null
  return (
    msg.conversation ??
    msg.extendedTextMessage?.text ??
    msg.imageMessage?.caption ??
    null
  )
}

export class EvolutionAPIClient implements IMessagingService {
  private http: AxiosInstance
  private instance: string

  constructor() {
    const baseURL = process.env.EVOLUTION_API_URL
    const apiKey = process.env.EVOLUTION_API_KEY
    this.instance = process.env.EVOLUTION_INSTANCE ?? 'routey66'

    if (!baseURL || !apiKey) {
      throw new Error('EVOLUTION_API_URL and EVOLUTION_API_KEY must be set')
    }

    this.http = axios.create({
      baseURL,
      headers: {
        apikey: apiKey,
        'Content-Type': 'application/json',
      },
      timeout: 10_000,
    })
  }

  async sendText(phone: string, text: string): Promise<void> {
    try {
      await this.http.post(`/message/sendText/${this.instance}`, {
        number: phone,
        text,
        delay: 1000,
      })
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      throw new Error(`EvolutionAPIClient.sendText failed: ${msg}`)
    }
  }

  async sendTyping(phone: string): Promise<void> {
    try {
      await this.http.post(`/chat/presence/${this.instance}`, {
        number: phone,
        options: { presence: 'composing', delay: 3000 },
      })
    } catch {
      // typing indicator is best-effort — never throw
    }
  }
}
