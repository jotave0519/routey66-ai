import { FastifyInstance } from 'fastify'
import { adminAuthMiddleware } from '../../../middleware/auth.middleware'
import { ServicesController } from '../../controllers/admin/ServicesController'
import { FaqController } from '../../controllers/admin/FaqController'
import { CustomersController } from '../../controllers/admin/CustomersController'
import { AppointmentsController } from '../../controllers/admin/AppointmentsController'
import { SettingsController } from '../../controllers/admin/SettingsController'
import { VehiclesAdminController } from '../../controllers/admin/VehiclesAdminController'
import { ConversationsAdminController } from '../../controllers/admin/ConversationsAdminController'
import { DashboardController } from '../../controllers/admin/DashboardController'
import { WhatsAppAdminController } from '../../controllers/admin/WhatsAppAdminController'
import { StockController } from '../../controllers/admin/StockController'

interface AdminControllers {
  services: ServicesController
  faq: FaqController
  customers: CustomersController
  appointments: AppointmentsController
  settings: SettingsController
  vehicles: VehiclesAdminController
  conversations: ConversationsAdminController
  dashboard: DashboardController
  whatsapp: WhatsAppAdminController
  stock: StockController
}

export function adminRoutes(fastify: FastifyInstance, controllers: AdminControllers): void {
  fastify.addHook('preHandler', adminAuthMiddleware)

  // Dashboard
  fastify.get('/admin/dashboard', (req, reply) => controllers.dashboard.stats(req, reply))

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
  fastify.post('/admin/customers', (req, reply) => controllers.customers.create(req, reply))
  fastify.get('/admin/customers/:id', (req, reply) => controllers.customers.getOne(req, reply))
  fastify.patch('/admin/customers/:id', (req, reply) => controllers.customers.update(req, reply))
  fastify.delete('/admin/customers/:id', (req, reply) => controllers.customers.remove(req, reply))

  // Vehicles
  fastify.get('/admin/vehicles', (req, reply) => controllers.vehicles.list(req, reply))
  fastify.post('/admin/vehicles', (req, reply) => controllers.vehicles.create(req, reply))
  fastify.get('/admin/vehicles/:id', (req, reply) => controllers.vehicles.getOne(req, reply))
  fastify.patch('/admin/vehicles/:id', (req, reply) => controllers.vehicles.update(req, reply))
  fastify.delete('/admin/vehicles/:id', (req, reply) => controllers.vehicles.remove(req, reply))

  // Stock
  fastify.get('/admin/stock/summary', (req, reply) => controllers.stock.summary(req, reply))
  fastify.get('/admin/stock', (req, reply) => controllers.stock.list(req, reply))
  fastify.post('/admin/stock', (req, reply) => controllers.stock.create(req, reply))
  fastify.patch('/admin/stock/:id', (req, reply) => controllers.stock.update(req, reply))
  fastify.delete('/admin/stock/:id', (req, reply) => controllers.stock.remove(req, reply))
  fastify.post('/admin/stock/:id/movement', (req, reply) => controllers.stock.addMovement(req, reply))
  fastify.get('/admin/stock/:id/movements', (req, reply) => controllers.stock.getMovements(req, reply))

  // Appointments
  fastify.get('/admin/appointments', (req, reply) => controllers.appointments.list(req, reply))
  fastify.get('/admin/appointments/slots', (req, reply) => controllers.appointments.getSlots(req, reply))
  fastify.post('/admin/appointments', (req, reply) => controllers.appointments.create(req, reply))
  fastify.patch('/admin/appointments/:id/cancel', (req, reply) => controllers.appointments.cancel(req, reply))
  fastify.patch('/admin/appointments/:id/reschedule', (req, reply) => controllers.appointments.reschedule(req, reply))

  // Conversations
  fastify.get('/admin/conversations', (req, reply) => controllers.conversations.list(req, reply))
  fastify.get('/admin/conversations/:id/messages', (req, reply) => controllers.conversations.getMessages(req, reply))

  // Settings
  fastify.get('/admin/settings', (req, reply) => controllers.settings.get(req, reply))
  fastify.patch('/admin/settings', (req, reply) => controllers.settings.update(req, reply))

  // WhatsApp
  fastify.get('/admin/whatsapp/status', (req, reply) => controllers.whatsapp.status(req, reply))
  fastify.get('/admin/whatsapp/qrcode', (req, reply) => controllers.whatsapp.qrcode(req, reply))
  fastify.delete('/admin/whatsapp/logout', (req, reply) => controllers.whatsapp.logout(req, reply))
}
