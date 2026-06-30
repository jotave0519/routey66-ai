import { FastifyRequest, FastifyReply } from 'fastify'
import { IVehicleRepository } from '../../../../domain/repositories/IVehicleRepository'

export class VehiclesAdminController {
  constructor(private readonly vehicleRepo: IVehicleRepository) {}

  async list(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { limit = 50, offset = 0 } = request.query as { limit?: number; offset?: number }
    const [vehicles, total] = await Promise.all([
      this.vehicleRepo.listAll(Number(limit), Number(offset)),
      this.vehicleRepo.countAll(),
    ])
    reply.send({ data: vehicles, total })
  }

  async getOne(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string }
    const vehicle = await this.vehicleRepo.findById(id)
    if (!vehicle) { reply.code(404).send({ error: 'Vehicle not found' }); return }
    reply.send({ vehicle })
  }
}
