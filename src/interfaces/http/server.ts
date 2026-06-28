import Fastify, { FastifyError } from 'fastify'
import cors from '@fastify/cors'
import sensible from '@fastify/sensible'
import { webhookRoutes } from './routes/webhook.routes'
import { adminRoutes } from './routes/admin/index'
import { WebhookController } from './controllers/WebhookController'
import { ServicesController } from './controllers/admin/ServicesController'
import { FaqController } from './controllers/admin/FaqController'
import { CustomersController } from './controllers/admin/CustomersController'
import { AppointmentsController } from './controllers/admin/AppointmentsController'
import { SettingsController } from './controllers/admin/SettingsController'

interface ServerDeps {
  webhookController: WebhookController
  servicesController: ServicesController
  faqController: FaqController
  customersController: CustomersController
  appointmentsController: AppointmentsController
  settingsController: SettingsController
}

export async function buildServer(deps: ServerDeps) {
  const fastify = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
    },
  })

  await fastify.register(cors, { origin: true })
  await fastify.register(sensible)

  fastify.get('/', async () => ({ status: 'ok' }))
  fastify.get('/health', async () => ({ status: 'ok', ts: new Date().toISOString() }))

  webhookRoutes(fastify, deps.webhookController)

  await fastify.register(async (scope) => {
    adminRoutes(scope, {
      services: deps.servicesController,
      faq: deps.faqController,
      customers: deps.customersController,
      appointments: deps.appointmentsController,
      settings: deps.settingsController,
    })
  })

  fastify.setErrorHandler((error: FastifyError, _request, reply) => {
    fastify.log.error(error)
    reply.code(error.statusCode ?? 500).send({
      error: error.message ?? 'Internal Server Error',
    })
  })

  return fastify
}
