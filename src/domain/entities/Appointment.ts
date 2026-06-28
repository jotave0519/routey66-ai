export type AppointmentStatus = 'SCHEDULED' | 'RESCHEDULED' | 'CANCELLED' | 'COMPLETED'

export interface Appointment {
  id: string
  customerId: string
  vehicleId: string
  serviceId: string
  googleEventId?: string | null
  appointmentDate: Date
  status: AppointmentStatus
  notes?: string | null
  calendarSyncError?: string | null
  createdAt: Date
  updatedAt: Date
}

export interface AppointmentWithDetails extends Appointment {
  customerName: string
  vehicleBrand: string
  vehicleModel: string
  vehiclePlate: string
  serviceName: string
}
