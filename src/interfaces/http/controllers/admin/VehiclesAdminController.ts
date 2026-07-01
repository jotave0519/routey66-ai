import { FastifyRequest, FastifyReply } from 'fastify'
import { IVehicleRepository } from '../../../../domain/repositories/IVehicleRepository'

export class VehiclesAdminController {
  constructor(private readonly vehicleRepo: IVehicleRepository) {}

  async create(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { customerId, brand, model, plate, year } = request.body as {
      customerId?: string; brand?: string; model?: string; plate?: string; year?: number
    }
    if (!customerId || !brand || !model || !plate) {
      reply.code(400).send({ error: 'customerId, brand, model and plate are required' }); return
    }
    const normalizedPlate = plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase()
    const vehicle = await this.vehicleRepo.create({
      customerId, brand, model, plate: normalizedPlate, year: year ?? null,
    })
    reply.code(201).send({ vehicle })
  }

  async update(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string }
    const { brand, model, plate, year } = request.body as { brand?: string; model?: string; plate?: string; year?: number }
    const vehicle = await this.vehicleRepo.findById(id)
    if (!vehicle) { reply.code(404).send({ error: 'Vehicle not found' }); return }
    const updated = await this.vehicleRepo.update(id, {
      ...(brand !== undefined && { brand }),
      ...(model !== undefined && { model }),
      ...(plate !== undefined && { plate: plate.replace(/[^a-zA-Z0-9]/g, '').toUpperCase() }),
      ...(year !== undefined && { year }),
    })
    reply.send({ vehicle: updated })
  }

  async remove(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string }
    const vehicle = await this.vehicleRepo.findById(id)
    if (!vehicle) { reply.code(404).send({ error: 'Vehicle not found' }); return }
    await this.vehicleRepo.delete(id)
    reply.code(204).send()
  }

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
