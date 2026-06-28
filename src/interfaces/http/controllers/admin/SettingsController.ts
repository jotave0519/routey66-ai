import { FastifyRequest, FastifyReply } from 'fastify'
import { IBusinessSettingsRepository } from '../../../../domain/repositories/IBusinessSettingsRepository'

export class SettingsController {
  constructor(private readonly settingsRepo: IBusinessSettingsRepository) {}

  async get(_req: FastifyRequest, reply: FastifyReply): Promise<void> {
    reply.send(await this.settingsRepo.get())
  }

  async update(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = request.body as Parameters<IBusinessSettingsRepository['update']>[0]
    reply.send(await this.settingsRepo.update(body))
  }
}
