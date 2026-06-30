import 'dotenv/config'

import { CustomerRepository } from './infrastructure/database/repositories/CustomerRepository'
import { VehicleRepository } from './infrastructure/database/repositories/VehicleRepository'
import { ServiceRepository } from './infrastructure/database/repositories/ServiceRepository'
import { AppointmentRepository } from './infrastructure/database/repositories/AppointmentRepository'
import { ConversationRepository } from './infrastructure/database/repositories/ConversationRepository'
import { FaqRepository } from './infrastructure/database/repositories/FaqRepository'
import { BusinessSettingsRepository } from './infrastructure/database/repositories/BusinessSettingsRepository'

import { EvolutionAPIClient } from './infrastructure/messaging/EvolutionAPIClient'
import { GoogleCalendarService } from './infrastructure/calendar/GoogleCalendarService'
import { ClaudeAIService } from './infrastructure/ai/ClaudeAIService'

import { RAGService } from './application/services/RAGService'
import { AgentService } from './application/services/AgentService'
import { TimeoutWorker } from './application/services/TimeoutWorker'
import { HandleIncomingMessage } from './application/usecases/HandleIncomingMessage'

import { WebhookController } from './interfaces/http/controllers/WebhookController'
import { ServicesController } from './interfaces/http/controllers/admin/ServicesController'
import { FaqController } from './interfaces/http/controllers/admin/FaqController'
import { CustomersController } from './interfaces/http/controllers/admin/CustomersController'
import { AppointmentsController } from './interfaces/http/controllers/admin/AppointmentsController'
import { SettingsController } from './interfaces/http/controllers/admin/SettingsController'

export function buildContainer() {
  const calendarProvider = process.env.CALENDAR_PROVIDER ?? 'google'
  if (calendarProvider !== 'google') {
    throw new Error(`Calendar provider "${calendarProvider}" is not supported. Only "google" is available.`)
  }

  // Repositories
  const customerRepo = new CustomerRepository()
  const vehicleRepo = new VehicleRepository()
  const serviceRepo = new ServiceRepository()
  const appointmentRepo = new AppointmentRepository()
  const conversationRepo = new ConversationRepository()
  const faqRepo = new FaqRepository()
  const settingsRepo = new BusinessSettingsRepository()

  // External services
  const messagingService = new EvolutionAPIClient()
  const calendarService = new GoogleCalendarService()
  const aiService = new ClaudeAIService()

  // Application services
  const ragService = new RAGService(
    settingsRepo,
    faqRepo,
    serviceRepo,
    customerRepo,
    vehicleRepo,
    appointmentRepo,
  )

  const agentService = new AgentService({
    aiService,
    calendarService,
    customerRepo,
    vehicleRepo,
    serviceRepo,
    appointmentRepo,
    conversationRepo,
    settingsRepo,
    ragService,
  })

  // Use cases
  const handleIncomingMessage = new HandleIncomingMessage(
    customerRepo,
    conversationRepo,
    messagingService,
    agentService,
  )

  // Background workers
  const timeoutWorker = new TimeoutWorker(conversationRepo, customerRepo, messagingService)

  // Controllers
  const webhookController = new WebhookController(handleIncomingMessage)
  const servicesController = new ServicesController(serviceRepo)
  const faqController = new FaqController(faqRepo)
  const customersController = new CustomersController(
    customerRepo,
    vehicleRepo,
    appointmentRepo,
    conversationRepo,
  )
  const appointmentsController = new AppointmentsController(
    appointmentRepo,
    calendarService,
    settingsRepo,
  )
  const settingsController = new SettingsController(settingsRepo)

  return {
    webhookController,
    servicesController,
    faqController,
    customersController,
    appointmentsController,
    settingsController,
    timeoutWorker,
  }
}
