import { FastifyRequest, FastifyReply } from 'fastify'
import { ICustomerRepository } from '../../../../domain/repositories/ICustomerRepository'
import { IVehicleRepository } from '../../../../domain/repositories/IVehicleRepository'
import { IAppointmentRepository } from '../../../../domain/repositories/IAppointmentRepository'
import { IConversationRepository } from '../../../../domain/repositories/IConversationRepository'

export class CustomersController {
  constructor(
    private readonly customerRepo: ICustomerRepository,
    private readonly vehicleRepo: IVehicleRepository,
    private readonly appointmentRepo: IAppointmentRepository,
    private readonly conversationRepo: IConversationRepository,
  ) {}

  async list(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { limit = 50, offset = 0 } = request.query as { limit?: number; offset?: number }
    const [customers, total] = await Promise.all([
      this.customerRepo.list(Number(limit), Number(offset)),
      this.customerRepo.count(),
    ])
    reply.send({ data: customers, total })
  }

  async getOne(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string }
    const [customer, vehicles, appointments] = await Promise.all([
      this.customerRepo.findById(id),
      this.vehicleRepo.findByCustomerId(id),
      this.appointmentRepo.findByCustomerId(id, 20),
    ])
    if (!customer) { reply.code(404).send({ error: 'Customer not found' }); return }
    reply.send({ customer, vehicles, appointments })
  }
}
