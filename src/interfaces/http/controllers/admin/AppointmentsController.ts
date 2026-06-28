import { FastifyRequest, FastifyReply } from 'fastify'
import { IAppointmentRepository } from '../../../../domain/repositories/IAppointmentRepository'
import { ICalendarService } from '../../../../domain/services/ICalendarService'
import { IBusinessSettingsRepository } from '../../../../domain/repositories/IBusinessSettingsRepository'

export class AppointmentsController {
  constructor(
    private readonly appointmentRepo: IAppointmentRepository,
    private readonly calendarService: ICalendarService,
    private readonly settingsRepo: IBusinessSettingsRepository,
  ) {}

  async list(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { limit = 50, offset = 0 } = request.query as { limit?: number; offset?: number }
    const appointments = await this.appointmentRepo.list(Number(limit), Number(offset))
    reply.send(appointments)
  }

  async cancel(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string }
    const appointment = await this.appointmentRepo.findById(id)
    if (!appointment) { reply.code(404).send({ error: 'Appointment not found' }); return }

    if (appointment.googleEventId) {
      try { await this.calendarService.deleteEvent(appointment.googleEventId) } catch { /* log */ }
    }

    await this.appointmentRepo.updateStatus(id, 'CANCELLED')
    reply.send({ status: 'CANCELLED' })
  }

  async reschedule(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string }
    const { appointment_date } = request.body as { appointment_date: string }
    const appointment = await this.appointmentRepo.findById(id)
    if (!appointment) { reply.code(404).send({ error: 'Appointment not found' }); return }

    const settings = await this.settingsRepo.get()
    const newStart = new Date(appointment_date)
    const newEnd = new Date(newStart.getTime() + settings.slotDurationMinutes * 60_000)

    if (appointment.googleEventId) {
      try { await this.calendarService.updateEvent(appointment.googleEventId, { start: newStart, end: newEnd }) }
      catch { /* log */ }
    }

    const updated = await this.appointmentRepo.update(id, { appointmentDate: newStart, status: 'RESCHEDULED' })
    reply.send(updated)
  }
}
