import { FastifyRequest, FastifyReply } from 'fastify'
import { ICustomerRepository } from '../../../../domain/repositories/ICustomerRepository'
import { IAppointmentRepository } from '../../../../domain/repositories/IAppointmentRepository'
import { IConversationRepository } from '../../../../domain/repositories/IConversationRepository'

export class DashboardController {
  constructor(
    private readonly customerRepo: ICustomerRepository,
    private readonly appointmentRepo: IAppointmentRepository,
    private readonly conversationRepo: IConversationRepository,
  ) {}

  async stats(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const [customers, appointments, conversations] = await Promise.all([
      this.customerRepo.count(),
      this.appointmentRepo.list(300, 0),
      this.conversationRepo.list(300, 0),
    ])

    const now = new Date()
    const brtNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
    const todayStr = `${brtNow.getFullYear()}-${String(brtNow.getMonth() + 1).padStart(2, '0')}-${String(brtNow.getDate()).padStart(2, '0')}`

    const todayAppts = appointments.filter((a) => {
      const d = new Date(a.appointmentDate.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
      const dStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      return dStr === todayStr && a.status !== 'CANCELLED'
    })

    const upcoming = appointments
      .filter((a) => ['SCHEDULED', 'RESCHEDULED'].includes(a.status) && a.appointmentDate > now)
      .sort((a, b) => a.appointmentDate.getTime() - b.appointmentDate.getTime())
      .slice(0, 8)

    const activeConvs = conversations.filter((c) => c.status === 'ACTIVE').length

    reply.send({
      stats: {
        customers,
        appointmentsToday: todayAppts.length,
        conversationsActive: activeConvs,
      },
      todayAppointments: todayAppts
        .sort((a, b) => a.appointmentDate.getTime() - b.appointmentDate.getTime())
        .slice(0, 10),
      upcomingAppointments: upcoming,
    })
  }
}
