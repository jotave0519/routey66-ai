import { IBusinessSettingsRepository } from '../../domain/repositories/IBusinessSettingsRepository'
import { IFaqRepository } from '../../domain/repositories/IFaqRepository'
import { IServiceRepository } from '../../domain/repositories/IServiceRepository'
import { ICustomerRepository } from '../../domain/repositories/ICustomerRepository'
import { IVehicleRepository } from '../../domain/repositories/IVehicleRepository'
import { IAppointmentRepository } from '../../domain/repositories/IAppointmentRepository'
import { BusinessSettings } from '../../domain/entities/BusinessSettings'
import { Service } from '../../domain/entities/Service'
import { Faq } from '../../domain/entities/Faq'

export interface CustomerContext {
  customerId: string
  customerName: string
  vehicles: Array<{ id: string; brand: string; model: string; plate: string; year?: number | null }>
  upcomingAppointments: Array<{
    id: string
    serviceName: string
    vehiclePlate: string
    appointmentDate: string
    status: string
  }>
}

export interface RAGContext {
  settings: BusinessSettings
  services: Service[]
  faq: Faq[]
  customer: CustomerContext | null
}

export class RAGService {
  constructor(
    private readonly settingsRepo: IBusinessSettingsRepository,
    private readonly faqRepo: IFaqRepository,
    private readonly serviceRepo: IServiceRepository,
    private readonly customerRepo: ICustomerRepository,
    private readonly vehicleRepo: IVehicleRepository,
    private readonly appointmentRepo: IAppointmentRepository,
  ) {}

  async buildContext(customerId?: string): Promise<RAGContext> {
    const [settings, services, faq] = await Promise.all([
      this.settingsRepo.get(),
      this.serviceRepo.findAllActive(),
      this.faqRepo.findAllActive(),
    ])

    let customer: CustomerContext | null = null

    if (customerId) {
      const [customerData, vehicles, appointments] = await Promise.all([
        this.customerRepo.findById(customerId),
        this.vehicleRepo.findByCustomerId(customerId),
        this.appointmentRepo.findFutureByCustomerId(customerId),
      ])

      if (customerData) {
        customer = {
          customerId,
          customerName: customerData.name,
          vehicles: vehicles.map((v) => ({
            id: v.id,
            brand: v.brand,
            model: v.model,
            plate: v.plate,
            year: v.year,
          })),
          upcomingAppointments: appointments.map((a) => ({
            id: a.id,
            serviceName: a.serviceName,
            vehiclePlate: a.vehiclePlate,
            appointmentDate: a.appointmentDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
            status: a.status,
          })),
        }
      }
    }

    return { settings, services, faq, customer }
  }

  buildSystemPrompt(ctx: RAGContext, isNewCustomer: boolean): string {
    const { settings, services, faq, customer } = ctx

    const hoursText = Object.entries(settings.openingHours)
      .filter(([, v]) => v !== null)
      .map(([day, hours]) => {
        if (!hours) return null
        const dayNames: Record<string, string> = {
          monday: 'Segunda', tuesday: 'Terça', wednesday: 'Quarta',
          thursday: 'Quinta', friday: 'Sexta', saturday: 'Sábado', sunday: 'Domingo',
        }
        return `  ${dayNames[day] ?? day}: ${hours.open}–${hours.close}`
      })
      .filter(Boolean)
      .join('\n')

    const servicesText = services.map((s) => `  - ${s.name}${s.description ? `: ${s.description}` : ''}`).join('\n')

    const faqText = faq.map((f) => `  P: ${f.question}\n  R: ${f.answer}`).join('\n\n')

    const customerSection = customer
      ? `
## Cliente atual
- Nome: ${customer.customerName}
- ID: ${customer.customerId}
- Veículos cadastrados:
${customer.vehicles.length ? customer.vehicles.map((v) => `  - ${v.brand} ${v.model} | Placa: ${v.plate}${v.year ? ` | Ano: ${v.year}` : ''} (ID: ${v.id})`).join('\n') : '  Nenhum veículo cadastrado.'}
- Agendamentos futuros:
${customer.upcomingAppointments.length ? customer.upcomingAppointments.map((a) => `  - ${a.serviceName} | ${a.vehiclePlate} | ${a.appointmentDate} | ${a.status} (ID: ${a.id})`).join('\n') : '  Nenhum agendamento futuro.'}
`
      : isNewCustomer
        ? `
## Cliente atual
Este é o primeiro contato deste número. Você ainda NÃO sabe o nome do cliente.
IMPORTANTE: Pergunte o nome antes de qualquer outra ação.
`
        : ''

    return `Você é o assistente virtual da *${settings.companyName}*, uma oficina mecânica localizada em ${settings.address}.
Responda SEMPRE em português brasileiro, de forma cordial, clara e objetiva.
Use *negrito* com asteriscos para destacar informações importantes.

## Sobre a oficina
- Nome: ${settings.companyName}
- Endereço: ${settings.address}
- Telefone: ${settings.phone ?? 'Não informado'}
- Horários de funcionamento:
${hoursText}

## Serviços oferecidos
${servicesText}

## Perguntas frequentes
${faqText}
${customerSection}
## Regras de comportamento
1. Nunca invente informações — use apenas os dados acima e as ferramentas disponíveis.
2. Para agendar, remarcar ou cancelar, use SEMPRE as ferramentas correspondentes.
3. Ao agendar: pergunte qual veículo será atendido e solicite placa, marca, modelo (e ano, opcional).
4. Nunca assuma que o cliente quer usar o mesmo veículo de atendimentos anteriores.
5. Ao identificar a placa, verifique via ferramenta se já existe cadastro para este cliente.
6. Após confirmar o agendamento, apresente um resumo completo para o cliente.
7. Transfira para atendimento humano quando: cliente solicitar, reclamações, garantias, ou após 3 tentativas sem entender.
8. Mantenha o histórico de contexto da conversa para evitar perguntas repetidas.
9. Seja proativo: se o cliente mencionar um serviço, conduza direto ao agendamento sem exigir que ele diga "quero agendar".`
  }
}
