import { FastifyInstance } from 'fastify'
import { adminAuthMiddleware } from '../../../middleware/auth.middleware'
import { ServicesController } from '../../controllers/admin/ServicesController'
import { FaqController } from '../../controllers/admin/FaqController'
import { CustomersController } from '../../controllers/admin/CustomersController'
import { AppointmentsController } from '../../controllers/admin/AppointmentsController'
import { SettingsController } from '../../controllers/admin/SettingsController'

interface AdminControllers {
  services: ServicesController
  faq: FaqController
  customers: CustomersController
  appointments: AppointmentsController
  settings: SettingsController
}

export function adminRoutes(fastify: FastifyInstance, controllers: AdminControllers): void {
  fastify.addHook('preHandler', adminAuthMiddleware)

  // Services
  fastify.get('/admin/services', (req, reply) => controllers.services.list(req, reply))
  fastify.post('/admin/services', (req, reply) => controllers.services.create(req, reply))
  fastify.patch('/admin/services/:id', (req, reply) => controllers.services.update(req, reply))

  // FAQ
  fastify.get('/admin/faq', (req, reply) => controllers.faq.list(req, reply))
  fastify.post('/admin/faq', (req, reply) => controllers.faq.create(req, reply))
  fastify.patch('/admin/faq/:id', (req, reply) => controllers.faq.update(req, reply))
  fastify.delete('/admin/faq/:id', (req, reply) => controllers.faq.remove(req, reply))

  // Customers
  fastify.get('/admin/customers', (req, reply) => controllers.customers.list(req, reply))
  fastify.get('/admin/customers/:id', (req, reply) => controllers.customers.getOne(req, reply))

  // Appointments
  fastify.get('/admin/appointments', (req, reply) => controllers.appointments.list(req, reply))
  fastify.patch('/admin/appointments/:id/cancel', (req, reply) => controllers.appointments.cancel(req, reply))
  fastify.patch('/admin/appointments/:id/reschedule', (req, reply) => controllers.appointments.reschedule(req, reply))

  // Settings
  fastify.get('/admin/settings', (req, reply) => controllers.settings.get(req, reply))
  fastify.patch('/admin/settings', (req, reply) => controllers.settings.update(req, reply))
}
