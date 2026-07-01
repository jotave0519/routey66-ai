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

  async create(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { name, phone } = request.body as { name?: string; phone?: string }
    if (!name || !phone) { reply.code(400).send({ error: 'name and phone are required' }); return }
    const existing = await this.customerRepo.findByPhone(phone)
    if (existing) { reply.code(409).send({ error: 'Já existe um cliente com esse telefone' }); return }
    const customer = await this.customerRepo.create({ name, phone, whatsappName: null })
    reply.code(201).send({ customer })
  }

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
