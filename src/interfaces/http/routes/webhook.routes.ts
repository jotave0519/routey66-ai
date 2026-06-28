import { FastifyInstance } from 'fastify'
import { WebhookController } from '../controllers/WebhookController'

export function webhookRoutes(fastify: FastifyInstance, controller: WebhookController): void {
  fastify.post('/webhook/evolution', async (req, reply) => controller.handle(req, reply))
}
