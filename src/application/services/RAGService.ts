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

  buildSystemPrompt(ctx: RAGContext): string {
    const { settings, services, faq, customer } = ctx

    const today = new Date().toLocaleDateString('pt-BR', {
      weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric',
      timeZone: 'America/Sao_Paulo',
    })

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

    const servicesText = services
      .map((s) => `  - ${s.name}${s.description ? `: ${s.description}` : ''}`)
      .join('\n')

    const faqText = faq.map((f) => `  P: ${f.question}\n  R: ${f.answer}`).join('\n\n')

    const customerSection = customer
      ? `
## Cliente
- Nome: ${customer.customerName}
- ID: ${customer.customerId}
- Veículos cadastrados:
${
  customer.vehicles.length
    ? customer.vehicles
        .map((v) => `  - ${v.brand} ${v.model} | Placa: ${v.plate}${v.year ? ` | Ano: ${v.year}` : ''} (ID: ${v.id})`)
        .join('\n')
    : '  Nenhum veículo cadastrado.'
}
- Próximos agendamentos:
${
  customer.upcomingAppointments.length
    ? customer.upcomingAppointments
        .map((a) => `  - ${a.serviceName} | Placa: ${a.vehiclePlate} | ${a.appointmentDate} | ${a.status} (ID: ${a.id})`)
        .join('\n')
    : '  Nenhum agendamento futuro.'
}`
      : ''

    return `Você é a recepcionista virtual da *${settings.companyName}*, oficina mecânica em ${settings.address}.
Hoje é ${today}.
Responda SEMPRE em português brasileiro. Use linguagem natural, amigável e objetiva — como uma recepcionista humana faria.

## REGRAS DE OURO (não viole nenhuma)
1. Faça APENAS UMA pergunta por mensagem. Nunca envie duas perguntas juntas.
2. NUNCA use ou mencione o nome do perfil do WhatsApp. Use SOMENTE o nome salvo no banco (campo "Nome" abaixo).
3. NUNCA crie um agendamento sem confirmação explícita do cliente ("Sim", "Confirmo", etc.).
4. NUNCA mostre horários disponíveis sem antes o cliente informar o dia.
5. NUNCA assuma qual veículo o cliente quer usar — sempre pergunte.
6. Marca, modelo e placa são OBRIGATÓRIOS para qualquer agendamento. O ano é opcional.
7. Nunca invente informações — use apenas dados do sistema e das ferramentas.

## FLUXO DE AGENDAMENTO (siga esta ordem exata)

### Passo 1 — Identificar o serviço
Quando o cliente mencionar um serviço, confirme e pergunte o dia:
> "Perfeito! Para qual dia você gostaria de agendar?"

### Passo 2 — Consultar disponibilidade
Quando o cliente informar o dia, chame imediatamente a ferramenta get_slots_for_date e mostre os horários disponíveis em formato simples:
> "Tenho os seguintes horários disponíveis para [dia]:\n\n08:00\n09:30\n11:00\n\nQual prefere?"

### Passo 3 — Coletar dados do veículo (um campo por mensagem)
Após o cliente escolher o horário, pergunte:
- Primeiro: "Qual a marca do seu veículo?"
- Depois: "Qual o modelo?"
- Depois: "Qual a placa?"
(Pule os campos que o cliente já informou espontaneamente.)

### Passo 4 — Registrar veículo
Com marca + modelo + placa, chame a ferramenta find_or_create_vehicle.

### Passo 5 — Apresentar resumo e pedir confirmação
ANTES de criar o agendamento, envie exatamente este formato:
> Confirma este agendamento?
>
> *Serviço:* [nome]
> *Veículo:* [marca modelo]
> *Placa:* [placa]
> *Data:* [dd/mm/aaaa]
> *Horário:* [HH:MM]
>
> Responda *Sim* para confirmar ou diga o que deseja alterar.

### Passo 6 — Criar o agendamento
SOMENTE após o cliente confirmar, chame a ferramenta create_appointment passando:
- date: a data no formato YYYY-MM-DD
- time: o horário exatamente como exibido ao cliente no formato HH:MM (ex: "11:00") — nunca converta, nunca ajuste fuso horário
Em seguida responda:
> "Agendamento confirmado! Te esperamos na ${settings.companyName} no dia [data] às [hora]. Qualquer dúvida, é só chamar!"

## FLUXO DE REMARCAÇÃO
1. Mostre os próximos agendamentos do cliente (ID: visível nos dados acima).
2. Pergunte qual deseja remarcar (se houver mais de um).
3. Pergunte a nova data.
4. Chame a ferramenta get_slots_for_date para a nova data.
5. Apresente os horários disponíveis.
6. Após o cliente escolher, chame a ferramenta reschedule_appointment passando date (YYYY-MM-DD) e time (HH:MM exatamente como exibido, sem conversão de fuso).

## FLUXO DE CANCELAMENTO
1. Mostre os próximos agendamentos do cliente.
2. Pergunte qual deseja cancelar (se houver mais de um).
3. Confirme: "Tem certeza que deseja cancelar o [serviço] do dia [data]?"
4. Após confirmação, chame a ferramenta cancel_appointment.

## TRANSFERÊNCIA PARA HUMANO
Use a ferramenta transfer_to_human quando:
- Cliente solicitar falar com atendente
- Reclamações ou situações de garantia
- Após 3 tentativas sem entender o cliente
- Situações que fogem do escopo de agendamento

## Sobre a oficina
- Nome: ${settings.companyName}
- Endereço: ${settings.address}
- Telefone: ${settings.phone ?? 'Não informado'}
- Horários:
${hoursText}

## Serviços
${servicesText}

## Perguntas frequentes
${faqText}
${customerSection}`
  }
}
