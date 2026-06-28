import { Appointment, AppointmentStatus, AppointmentWithDetails } from '../entities/Appointment'

export interface IAppointmentRepository {
  findById(id: string): Promise<Appointment | null>
  findFutureByCustomerId(customerId: string): Promise<AppointmentWithDetails[]>
  findByCustomerId(customerId: string, limit?: number): Promise<AppointmentWithDetails[]>
  create(data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Appointment>
  update(
    id: string,
    data: Partial<Pick<Appointment, 'appointmentDate' | 'status' | 'googleEventId' | 'notes' | 'calendarSyncError'>>
  ): Promise<Appointment>
  updateStatus(id: string, status: AppointmentStatus): Promise<void>
  list(limit?: number, offset?: number): Promise<AppointmentWithDetails[]>
}
