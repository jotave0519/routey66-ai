import { FastifyRequest, FastifyReply } from 'fastify'
import { IFaqRepository } from '../../../../domain/repositories/IFaqRepository'

export class FaqController {
  constructor(private readonly faqRepo: IFaqRepository) {}

  async list(_req: FastifyRequest, reply: FastifyReply): Promise<void> {
    reply.send(await this.faqRepo.list())
  }

  async create(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { question, answer, active = true } = request.body as {
      question: string; answer: string; active?: boolean
    }
    if (!question || !answer) {
      reply.code(400).send({ error: 'question and answer are required' })
      return
    }
    reply.code(201).send(await this.faqRepo.create({ question, answer, active }))
  }

  async update(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string }
    const body = request.body as Partial<{ question: string; answer: string; active: boolean }>
    reply.send(await this.faqRepo.update(id, body))
  }

  async remove(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string }
    await this.faqRepo.delete(id)
    reply.code(204).send()
  }
}
