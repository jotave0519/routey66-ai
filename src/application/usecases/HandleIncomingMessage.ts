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
    const { phone, text } = input

    await this.messagingService.sendTyping(phone)

    // Busca ou cria cliente SEM usar nome do WhatsApp
    let customer = await this.customerRepo.findByPhone(phone)
    if (!customer) {
      customer = await this.customerRepo.create({ name: '', phone, whatsappName: null })
    }

    // Garante conversa ativa
    let conversation = await this.conversationRepo.findActiveByCustomerId(customer.id)
    if (!conversation) {
      conversation = await this.conversationRepo.create(customer.id)
    }

    // Salva mensagem do cliente
    await this.conversationRepo.saveMessage({
      conversationId: conversation.id,
      sender: 'customer',
      content: text,
    })

    // Fase de coleta de nome: se cliente não tem nome, trata antes do agente
    if (!customer.name || customer.name.trim() === '') {
      const priorMessages = await this.conversationRepo.getMessages(conversation.id, 20)
      const alreadyAskedName = priorMessages.some((m) => m.sender === 'assistant')

      if (!alreadyAskedName) {
        // Primeira mensagem — pede o nome
        const greeting =
          'Olá! Seja bem-vindo à Route\'y 66. 😊\n\nAntes de começarmos, como posso te chamar?'
        await this.conversationRepo.saveMessage({
          conversationId: conversation.id,
          sender: 'assistant',
          content: greeting,
        })
        await this.messagingService.sendText(phone, greeting)
        return
      }

      // Segunda mensagem — o texto é o nome do cliente
      const name = text.trim()
      customer = await this.customerRepo.update(customer.id, { name })
    }

    // Processa com o agente
    let result
    try {
      result = await this.agentService.processMessage(customer.id, conversation.id)
    } catch (err) {
      console.error('[HandleIncomingMessage] AgentService error:', err)
      const fallback = 'Desculpe, tive um problema para processar sua mensagem agora. Pode repetir, por favor?'
      await this.conversationRepo.saveMessage({
        conversationId: conversation.id,
        sender: 'assistant',
        content: fallback,
      })
      await this.messagingService.sendText(phone, fallback)
      return
    }

    if (result.reply) {
      await this.conversationRepo.saveMessage({
        conversationId: conversation.id,
        sender: 'assistant',
        content: result.reply,
      })
      await this.messagingService.sendText(phone, result.reply)
    }

    if (result.transferredToHuman) {
      await this.conversationRepo.updateStatus(conversation.id, 'TRANSFERRED', result.transferReason)
    }
  }
}
