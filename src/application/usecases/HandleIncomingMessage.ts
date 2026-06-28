import { ICustomerRepository } from '../../domain/repositories/ICustomerRepository'
import { IConversationRepository } from '../../domain/repositories/IConversationRepository'
import { IMessagingService } from '../../domain/services/IMessagingService'
import { AgentService } from '../services/AgentService'

export interface IncomingMessageInput {
  phone: string
  text: string
  whatsappName?: string
}

export class HandleIncomingMessage {
  constructor(
    private readonly customerRepo: ICustomerRepository,
    private readonly conversationRepo: IConversationRepository,
    private readonly messagingService: IMessagingService,
    private readonly agentService: AgentService,
  ) {}

  async execute(input: IncomingMessageInput): Promise<void> {
    const { phone, text, whatsappName } = input

    await this.messagingService.sendTyping(phone)

    let customer = await this.customerRepo.findByPhone(phone)
    let isNewCustomer = false

    if (!customer) {
      isNewCustomer = true
      customer = await this.customerRepo.create({
        name: whatsappName ?? 'Novo cliente',
        phone,
        whatsappName: whatsappName ?? null,
      })
    } else if (whatsappName && customer.whatsappName !== whatsappName) {
      await this.customerRepo.update(customer.id, { whatsappName })
    }

    let conversation = await this.conversationRepo.findActiveByCustomerId(customer.id)

    if (!conversation) {
      conversation = await this.conversationRepo.create(customer.id)
    }

    await this.conversationRepo.saveMessage({
      conversationId: conversation.id,
      sender: 'customer',
      content: text,
    })

    const result = await this.agentService.processMessage(
      customer.id,
      conversation.id,
      isNewCustomer,
    )

    if (result.reply) {
      await this.conversationRepo.saveMessage({
        conversationId: conversation.id,
        sender: 'assistant',
        content: result.reply,
      })

      await this.messagingService.sendText(phone, result.reply)
    }

    if (result.transferredToHuman) {
      await this.conversationRepo.updateStatus(
        conversation.id,
        'TRANSFERRED',
        result.transferReason,
      )
    }
  }
}
