import { FastifyRequest, FastifyReply } from 'fastify'
import { IConversationRepository } from '../../../../domain/repositories/IConversationRepository'

export class ConversationsAdminController {
  constructor(private readonly conversationRepo: IConversationRepository) {}

  async list(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { limit = 50, offset = 0 } = request.query as { limit?: number; offset?: number }
    const conversations = await this.conversationRepo.listWithCustomer(Number(limit), Number(offset))
    reply.send({ data: conversations })
  }

  async getMessages(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string }
    const messages = await this.conversationRepo.getMessages(id, 100)
    reply.send({ data: messages })
  }
}
