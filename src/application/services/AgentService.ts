import { IAIService, AITool } from '../../domain/services/IAIService'
import { ICalendarService } from '../../domain/services/ICalendarService'
import { ICustomerRepository } from '../../domain/repositories/ICustomerRepository'
import { IVehicleRepository } from '../../domain/repositories/IVehicleRepository'
import { IServiceRepository } from '../../domain/repositories/IServiceRepository'
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository'
import { IConversationRepository } from '../../domain/repositories/IConversationRepository'
import { IBusinessSettingsRepository } from '../../domain/repositories/IBusinessSettingsRepository'
import { RAGService } from './RAGService'

const MAX_TOOL_ITERATIONS = 8

const AGENT_TOOLS: AITool[] = [
  {
    name: 'get_slots_for_date',
    description:
      'Consulta os horários disponíveis no Google Calendar para uma data específica. Use SOMENTE depois que o cliente informar o dia desejado.',
    input_schema: {
      type: 'object',
      properties: {
        date: {
          type: 'string',
          description: 'Data no formato YYYY-MM-DD (ex: 2026-07-15). Interprete a linguagem natural do cliente para obter a data correta.',
        },
      },
      required: ['date'],
    },
  },
  {
    name: 'find_or_create_vehicle',
    description:
      'Verifica se já existe um veículo com a placa informada para este cliente. Se existir, retorna os dados. Se não existir, cria um novo. Marca, modelo e placa são OBRIGATÓRIOS.',
    input_schema: {
      type: 'object',
      properties: {
        plate: { type: 'string', description: 'Placa do veículo (ex: ABC1234 ou ABC1D23)' },
        brand: { type: 'string', description: 'Marca do veículo (ex: Fiat, Volkswagen)' },
        model: { type: 'string', description: 'Modelo do veículo (ex: Uno, Gol)' },
        year: { type: 'number', description: 'Ano do veículo (opcional)' },
      },
      required: ['plate', 'brand', 'model'],
    },
  },
  {
    name: 'create_appointment',
    description:
      'Cria o agendamento no sistema e no Google Calendar. Use SOMENTE após o cliente confirmar explicitamente (responder "Sim" ou equivalente) o resumo do agendamento.',
    input_schema: {
      type: 'object',
      properties: {
        vehicle_id: { type: 'string', description: 'ID do veículo retornado por find_or_create_vehicle' },
        service_name: { type: 'string', description: 'Nome do serviço desejado' },
        slot_start: { type: 'string', description: 'Data/hora de início em ISO 8601 (ex: 2026-07-15T10:00:00.000Z)' },
      },
      required: ['vehicle_id', 'service_name', 'slot_start'],
    },
  },
  {
    name: 'reschedule_appointment',
    description: 'Remarca um agendamento existente para uma nova data/horário.',
    input_schema: {
      type: 'object',
      properties: {
        appointment_id: { type: 'string', description: 'ID do agendamento a remarcar' },
        slot_start: { type: 'string', description: 'Nova data/hora em ISO 8601' },
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
    description: 'Transfere o atendimento para um humano e encerra o loop do agente.',
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

  async processMessage(customerId: string, conversationId: string): Promise<AgentResult> {
    const { aiService, calendarService, customerRepo, vehicleRepo, serviceRepo,
            appointmentRepo, conversationRepo, settingsRepo, ragService } = this.deps

    const [ragCtx, messages, settings] = await Promise.all([
      ragService.buildContext(customerId),
      conversationRepo.getMessages(conversationId, 40),
      settingsRepo.get(),
    ])

    const systemPrompt = ragService.buildSystemPrompt(ragCtx)

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
      case 'get_slots_for_date': {
        const dateStr = input.date as string

        const startOfDay = new Date(`${dateStr}T00:00:00-03:00`)
        const endOfDay = new Date(`${dateStr}T23:59:59-03:00`)

        // Para hoje, começa do momento atual
        const now = new Date()
        const from = startOfDay < now ? now : startOfDay

        if (from >= endOfDay) {
          return 'Não há mais horários disponíveis para hoje. Por favor, informe outra data.'
        }

        const slots = await calendarService.getAvailableSlots(from, endOfDay, settings.slotDurationMinutes, settings)

        if (slots.length === 0) {
          const [year, month, day] = dateStr.split('-')
          return `Não há horários disponíveis em ${day}/${month}/${year}. Gostaria de verificar outro dia?`
        }

        const dateLabel = startOfDay.toLocaleDateString('pt-BR', {
          weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
          timeZone: 'America/Sao_Paulo',
        })

        const slotLines = slots.map((s) => {
          const time = s.start.toLocaleTimeString('pt-BR', {
            hour: '2-digit', minute: '2-digit',
            timeZone: 'America/Sao_Paulo',
          })
          return `${time} [${s.start.toISOString()}]`
        }).join('\n')

        return `Horários disponíveis para ${dateLabel}:\n${slotLines}\n\nInstrução: mostre ao cliente apenas os horários (HH:MM), sem os colchetes. Use os valores entre colchetes internamente para criar o agendamento.`
      }

      case 'find_or_create_vehicle': {
        const plate = (input.plate as string).toUpperCase().replace(/[^A-Z0-9]/g, '')
        const existing = await vehicleRepo.findByPlateAndCustomer(plate, customerId)

        if (existing) {
          return JSON.stringify({
            action: 'found',
            vehicle_id: existing.id,
            brand: existing.brand,
            model: existing.model,
            plate: existing.plate,
            year: existing.year ?? null,
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
          action: 'created',
          vehicle_id: vehicle.id,
          brand: vehicle.brand,
          model: vehicle.model,
          plate: vehicle.plate,
          year: vehicle.year ?? null,
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

        // Google Calendar é obrigatório — sem evento confirmado, não cria o agendamento
        let googleEventId: string
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
          const msg = err instanceof Error ? err.message : String(err)
          console.error('[create_appointment] Google Calendar error:', msg)
          return `Não foi possível confirmar o agendamento pois ocorreu um erro ao reservar o horário na agenda. Por favor, tente novamente em alguns instantes ou entre em contato com a oficina.`
        }

        const appointment = await appointmentRepo.create({
          customerId,
          vehicleId: vehicle.id,
          serviceId: service.id,
          googleEventId,
          appointmentDate: slotStart,
          status: 'SCHEDULED',
          calendarSyncError: null,
        })

        const dateFormatted = slotStart.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' })
        const timeFormatted = slotStart.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })

        return JSON.stringify({
          appointment_id: appointment.id,
          service: service.name,
          vehicle: `${vehicle.brand} ${vehicle.model}`,
          plate: vehicle.plate,
          date: dateFormatted,
          time: timeFormatted,
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
            const msg = err instanceof Error ? err.message : String(err)
            console.error('[reschedule_appointment] Calendar update error:', msg)
            return `Não foi possível remarcar pois ocorreu um erro ao atualizar a agenda. Por favor, tente novamente ou entre em contato com a oficina.`
          }
        }

        await appointmentRepo.update(appointment.id, { appointmentDate: newStart, status: 'RESCHEDULED' })

        const dateFormatted = newStart.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit', year: 'numeric' })
        const timeFormatted = newStart.toLocaleTimeString('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' })

        return `Agendamento remarcado com sucesso para ${dateFormatted} às ${timeFormatted}.`
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
        return `Certo! Em breve um de nossos atendentes entrará em contato. 😊`
      }

      default:
        return `Ferramenta desconhecida: ${name}`
    }
  }
}
