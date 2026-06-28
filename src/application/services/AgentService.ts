import { IAIService, AITool } from '../../domain/services/IAIService'
import { ICalendarService } from '../../domain/services/ICalendarService'
import { ICustomerRepository } from '../../domain/repositories/ICustomerRepository'
import { IVehicleRepository } from '../../domain/repositories/IVehicleRepository'
import { IServiceRepository } from '../../domain/repositories/IServiceRepository'
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository'
import { IConversationRepository } from '../../domain/repositories/IConversationRepository'
import { IBusinessSettingsRepository } from '../../domain/repositories/IBusinessSettingsRepository'
import { RAGService } from './RAGService'

const MAX_TOOL_ITERATIONS = 5

const AGENT_TOOLS: AITool[] = [
  {
    name: 'get_available_slots',
    description: 'Consulta horários disponíveis no Google Calendar para agendamento.',
    input_schema: {
      type: 'object',
      properties: {
        days_ahead: {
          type: 'number',
          description: 'Quantos dias à frente buscar (padrão: 7)',
        },
      },
    },
  },
  {
    name: 'find_or_create_vehicle',
    description: 'Verifica se já existe um veículo com a placa informada para o cliente. Se não existir, cria um novo.',
    input_schema: {
      type: 'object',
      properties: {
        plate: { type: 'string', description: 'Placa do veículo (ex: ABC1234 ou ABC1D23)' },
        brand: { type: 'string', description: 'Marca do veículo' },
        model: { type: 'string', description: 'Modelo do veículo' },
        year: { type: 'number', description: 'Ano do veículo (opcional)' },
      },
      required: ['plate', 'brand', 'model'],
    },
  },
  {
    name: 'create_appointment',
    description: 'Cria um agendamento no sistema e no Google Calendar.',
    input_schema: {
      type: 'object',
      properties: {
        vehicle_id: { type: 'string', description: 'ID do veículo retornado por find_or_create_vehicle' },
        service_name: { type: 'string', description: 'Nome do serviço desejado' },
        slot_start: { type: 'string', description: 'Data/hora de início em ISO 8601 (ex: 2024-07-15T10:00:00)' },
      },
      required: ['vehicle_id', 'service_name', 'slot_start'],
    },
  },
  {
    name: 'reschedule_appointment',
    description: 'Remarca um agendamento existente para um novo horário.',
    input_schema: {
      type: 'object',
      properties: {
        appointment_id: { type: 'string', description: 'ID do agendamento a remarcar' },
        slot_start: { type: 'string', description: 'Nova data/hora de início em ISO 8601' },
      },
      required: ['appointment_id', 'slot_start'],
    },
  },
  {
    name: 'cancel_appointment',
    description: 'Cancela um agendamento e remove o evento do Google Calendar.',
    input_schema: {
      type: 'object',
      properties: {
        appointment_id: { type: 'string', description: 'ID do agendamento a cancelar' },
      },
      required: ['appointment_id'],
    },
  },
  {
    name: 'transfer_to_human',
    description: 'Registra a transferência para atendimento humano e encerra o loop do agente.',
    input_schema: {
      type: 'object',
      properties: {
        reason: { type: 'string', description: 'Motivo da transferência' },
      },
      required: ['reason'],
    },
  },
]

interface AgentDeps {
  aiService: IAIService
  calendarService: ICalendarService
  customerRepo: ICustomerRepository
  vehicleRepo: IVehicleRepository
  serviceRepo: IServiceRepository
  appointmentRepo: IAppointmentRepository
  conversationRepo: IConversationRepository
  settingsRepo: IBusinessSettingsRepository
  ragService: RAGService
}

export interface AgentResult {
  reply: string
  transferredToHuman: boolean
  transferReason?: string
}

export class AgentService {
  constructor(private readonly deps: AgentDeps) {}

  async processMessage(
    customerId: string,
    conversationId: string,
    isNewCustomer: boolean,
  ): Promise<AgentResult> {
    const { aiService, calendarService, customerRepo, vehicleRepo, serviceRepo,
            appointmentRepo, conversationRepo, settingsRepo, ragService } = this.deps

    const [ragCtx, messages, settings] = await Promise.all([
      ragService.buildContext(customerId),
      conversationRepo.getMessages(conversationId, 30),
      settingsRepo.get(),
    ])

    const systemPrompt = ragService.buildSystemPrompt(ragCtx, isNewCustomer)

    const history = messages
      .filter((m) => m.sender !== 'system')
      .map((m) => ({
        role: m.sender === 'customer' ? ('user' as const) : ('assistant' as const),
        content: m.content,
      }))

    let currentHistory = [...history]
    let finalReply = ''
    let transferredToHuman = false
    let transferReason: string | undefined

    for (let i = 0; i < MAX_TOOL_ITERATIONS; i++) {
      const response = await aiService.chat({ systemPrompt, history: currentHistory }, AGENT_TOOLS)

      if (response.text) finalReply = response.text

      if (response.stopReason === 'end_turn' || response.toolCalls.length === 0) break

      const toolResults: string[] = []

      for (const call of response.toolCalls) {
        const result = await this.executeTool(call.name, call.input, {
          customerId, conversationId, settings,
          calendarService, customerRepo, vehicleRepo,
          serviceRepo, appointmentRepo, conversationRepo,
        })

        if (call.name === 'transfer_to_human') {
          transferredToHuman = true
          transferReason = call.input.reason as string
          finalReply = result
          break
        }

        toolResults.push(`[${call.name}]: ${result}`)
      }

      if (transferredToHuman) break

      currentHistory = [
        ...currentHistory,
        { role: 'assistant' as const, content: response.text || toolResults.join('\n') },
        { role: 'user' as const, content: `Resultado das ferramentas:\n${toolResults.join('\n')}` },
      ]
    }

    return { reply: finalReply, transferredToHuman, transferReason }
  }

  private async executeTool(
    name: string,
    input: Record<string, unknown>,
    ctx: {
      customerId: string
      conversationId: string
      settings: import('../../domain/entities/BusinessSettings').BusinessSettings
      calendarService: ICalendarService
      customerRepo: ICustomerRepository
      vehicleRepo: IVehicleRepository
      serviceRepo: IServiceRepository
      appointmentRepo: IAppointmentRepository
      conversationRepo: IConversationRepository
    },
  ): Promise<string> {
    const { customerId, settings, calendarService, vehicleRepo, serviceRepo, appointmentRepo } = ctx

    switch (name) {
      case 'get_available_slots': {
        const daysAhead = (input.days_ahead as number) ?? 7
        const from = new Date()
        const to = new Date()
        to.setDate(to.getDate() + daysAhead)

        const slots = await calendarService.getAvailableSlots(from, to, settings.slotDurationMinutes, settings)

        if (slots.length === 0) return 'Nenhum horário disponível nos próximos dias.'

        const slotList = slots
          .slice(0, 8)
          .map((s, i) => `${i + 1}. ${s.label} [${s.start.toISOString()}]`)
          .join('\n')

        return `Horários disponíveis:\n${slotList}`
      }

      case 'find_or_create_vehicle': {
        const plate = (input.plate as string).toUpperCase().replace(/[^A-Z0-9]/g, '')
        const existing = await vehicleRepo.findByPlateAndCustomer(plate, customerId)

        if (existing) {
          return JSON.stringify({
            found: true,
            vehicle_id: existing.id,
            brand: existing.brand,
            model: existing.model,
            plate: existing.plate,
          })
        }

        const vehicle = await vehicleRepo.create({
          customerId,
          brand: input.brand as string,
          model: input.model as string,
          plate,
          year: (input.year as number) ?? null,
        })

        return JSON.stringify({
          found: false,
          vehicle_id: vehicle.id,
          brand: vehicle.brand,
          model: vehicle.model,
          plate: vehicle.plate,
        })
      }

      case 'create_appointment': {
        const service = await serviceRepo.findByName(input.service_name as string)
        if (!service) return `Serviço "${input.service_name}" não encontrado.`

        const slotStart = new Date(input.slot_start as string)
        const slotEnd = new Date(slotStart.getTime() + settings.slotDurationMinutes * 60_000)

        const vehicle = await vehicleRepo.findById(input.vehicle_id as string)
        if (!vehicle) return 'Veículo não encontrado.'

        const customer = await ctx.customerRepo.findById(customerId)

        let googleEventId: string | undefined
        let syncError: string | undefined

        try {
          googleEventId = await calendarService.createEvent({
            title: `${service.name} — ${customer?.name ?? 'Cliente'}`,
            description: [
              `Cliente: ${customer?.name} (ID: ${customerId})`,
              `Veículo: ${vehicle.brand} ${vehicle.model} | Placa: ${vehicle.plate}`,
              `Serviço: ${service.name}`,
            ].join('\n'),
            start: slotStart,
            end: slotEnd,
          })
        } catch (err) {
          syncError = err instanceof Error ? err.message : String(err)
          console.error('Google Calendar sync error:', syncError)
        }

        const appointment = await appointmentRepo.create({
          customerId,
          vehicleId: vehicle.id,
          serviceId: service.id,
          googleEventId: googleEventId ?? null,
          appointmentDate: slotStart,
          status: 'SCHEDULED',
          calendarSyncError: syncError ?? null,
        })

        return JSON.stringify({
          appointment_id: appointment.id,
          service: service.name,
          vehicle: `${vehicle.brand} ${vehicle.model} | ${vehicle.plate}`,
          date: slotStart.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
          calendar_synced: !syncError,
        })
      }

      case 'reschedule_appointment': {
        const appointment = await appointmentRepo.findById(input.appointment_id as string)
        if (!appointment) return 'Agendamento não encontrado.'

        const newStart = new Date(input.slot_start as string)
        const newEnd = new Date(newStart.getTime() + settings.slotDurationMinutes * 60_000)

        if (appointment.googleEventId) {
          try {
            await calendarService.updateEvent(appointment.googleEventId, { start: newStart, end: newEnd })
          } catch (err) {
            console.error('Calendar update error:', err)
          }
        }

        await appointmentRepo.update(appointment.id, {
          appointmentDate: newStart,
          status: 'RESCHEDULED',
        })

        return `Agendamento remarcado para ${newStart.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`
      }

      case 'cancel_appointment': {
        const appointment = await appointmentRepo.findById(input.appointment_id as string)
        if (!appointment) return 'Agendamento não encontrado.'

        if (appointment.googleEventId) {
          try {
            await calendarService.deleteEvent(appointment.googleEventId)
          } catch (err) {
            console.error('Calendar delete error:', err)
          }
        }

        await appointmentRepo.updateStatus(appointment.id, 'CANCELLED')
        return 'Agendamento cancelado com sucesso.'
      }

      case 'transfer_to_human': {
        const reason = (input.reason as string) ?? 'Solicitação do cliente'
        await ctx.conversationRepo.updateStatus(ctx.conversationId, 'TRANSFERRED', reason)
        return `Em breve um de nossos atendentes entrará em contato. Motivo: ${reason}`
      }

      default:
        return `Ferramenta desconhecida: ${name}`
    }
  }
}
