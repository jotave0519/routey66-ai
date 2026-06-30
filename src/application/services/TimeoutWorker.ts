import { IConversationRepository } from '../../domain/repositories/IConversationRepository'
import { ICustomerRepository } from '../../domain/repositories/ICustomerRepository'
import { IMessagingService } from '../../domain/services/IMessagingService'

const WARN_AFTER_MS = 5 * 60_000   // 5 minutes of silence → warning
const CLOSE_AFTER_MS = 5 * 60_000  // 5 more minutes → close
const POLL_INTERVAL_MS = 30_000    // check every 30 seconds

const WARNING_MESSAGES = [
  'Você ainda está por aí? 😊 Fico aguardando caso queira continuar.',
  'Ainda posso ajudar? Estou aqui quando quiser continuar. 😊',
  'Sem pressa! Estarei disponível se quiser retomar o atendimento. 😊',
]

export class TimeoutWorker {
  private interval: ReturnType<typeof setInterval> | null = null

  constructor(
    private readonly conversationRepo: IConversationRepository,
    private readonly customerRepo: ICustomerRepository,
    private readonly messagingService: IMessagingService,
  ) {}

  start(): void {
    if (this.interval) return
    this.interval = setInterval(
      () => this.tick().catch((err) => console.error('[TimeoutWorker] tick error:', err)),
      POLL_INTERVAL_MS,
    )
    console.log('[TimeoutWorker] started — polling every 30s')
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }

  private async tick(): Promise<void> {
    const expired = await this.conversationRepo.findExpiredTimeouts()
    for (const conv of expired) {
      await this.handleExpired(conv).catch((err) =>
        console.error(`[TimeoutWorker] error handling conversation ${conv.conversationId}:`, err),
      )
    }
  }

  private async handleExpired(conv: {
    conversationId: string
    customerId: string
    timeoutWarned: boolean
  }): Promise<void> {
    const customer = await this.customerRepo.findById(conv.customerId)
    if (!customer) return

    if (!conv.timeoutWarned) {
      // First expiry: send warning and give 5 more minutes
      const msg = WARNING_MESSAGES[Math.floor(Math.random() * WARNING_MESSAGES.length)]
      await this.conversationRepo.saveMessage({
        conversationId: conv.conversationId,
        sender: 'assistant',
        content: msg,
      })
      await this.messagingService.sendText(customer.phone, msg)
      await this.conversationRepo.setTimeoutAt(
        conv.conversationId,
        new Date(Date.now() + CLOSE_AFTER_MS),
        true,
      )
      console.log(`[TimeoutWorker] warning sent to ${customer.phone} (conv ${conv.conversationId})`)
    } else {
      // Second expiry: close the conversation
      const farewell =
        'Como não recebi resposta, encerrei este atendimento. Quando precisar, é só me chamar novamente! 😊'
      await this.conversationRepo.saveMessage({
        conversationId: conv.conversationId,
        sender: 'assistant',
        content: farewell,
      })
      await this.messagingService.sendText(customer.phone, farewell)
      await this.conversationRepo.setTimeoutAt(conv.conversationId, null, false)
      await this.conversationRepo.finish(conv.conversationId)
      console.log(`[TimeoutWorker] conversation ${conv.conversationId} auto-closed (${customer.phone})`)
    }
  }
}
