import { FastifyRequest, FastifyReply } from 'fastify'
import { IServiceRepository } from '../../../../domain/repositories/IServiceRepository'

export class ServicesController {
  constructor(private readonly serviceRepo: IServiceRepository) {}

  async list(_req: FastifyRequest, reply: FastifyReply): Promise<void> {
    const services = await this.serviceRepo.list()
    reply.send(services)
  }

  async create(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { name, description, active = true } = request.body as {
      name: string; description?: string; active?: boolean
    }
    if (!name) { reply.code(400).send({ error: 'name is required' }); return }
    const service = await this.serviceRepo.create({ name, description: description ?? null, active })
    reply.code(201).send(service)
  }

  async update(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string }
    const body = request.body as Partial<{ name: string; description: string; active: boolean }>
    const service = await this.serviceRepo.update(id, body)
    reply.send(service)
  }
}
