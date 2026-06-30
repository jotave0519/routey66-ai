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
    const { limit = 500, offset = 0 } = request.query as { limit?: number; offset?: number }
    const appointments = await this.appointmentRepo.list(Number(limit), Number(offset))
    reply.send({ data: appointments })
  }

  async getSlots(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { date } = request.query as { date?: string }
    if (!date) { reply.code(400).send({ error: 'date is required (YYYY-MM-DD)' }); return }

    const settings = await this.settingsRepo.get()
    const from = new Date(`${date}T00:00:00-03:00`)
    const to = new Date(`${date}T23:59:59-03:00`)
    const slots = await this.calendarService.getAvailableSlots(from, to, settings.slotDurationMinutes, settings)
    reply.send({ slots: slots.map((s) => ({ start: s.start.toISOString(), end: s.end.toISOString() })) })
  }

  async create(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { customerId, vehicleId, serviceId, appointmentDate, notes } = request.body as {
      customerId: string; vehicleId: string; serviceId: string; appointmentDate: string; notes?: string
    }
    if (!customerId || !vehicleId || !serviceId || !appointmentDate) {
      reply.code(400).send({ error: 'customerId, vehicleId, serviceId, appointmentDate are required' }); return
    }

    const settings = await this.settingsRepo.get()
    const start = new Date(appointmentDate)
    const end = new Date(start.getTime() + settings.slotDurationMinutes * 60_000)

    let googleEventId: string | null = null
    try {
      googleEventId = await this.calendarService.createEvent({
        title: 'Agendamento - Oficina',
        description: notes ?? '',
        start,
        end,
      })
    } catch { /* calendar sync error is non-blocking */ }

    const appointment = await this.appointmentRepo.create({
      customerId,
      vehicleId,
      serviceId,
      appointmentDate: start,
      googleEventId,
      status: 'SCHEDULED',
      notes: notes ?? null,
      calendarSyncError: null,
    })

    reply.code(201).send(appointment)
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
