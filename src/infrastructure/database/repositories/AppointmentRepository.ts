import { SupabaseClient } from '@supabase/supabase-js'
import {
  Appointment,
  AppointmentStatus,
  AppointmentWithDetails,
} from '../../../domain/entities/Appointment'
import { IAppointmentRepository } from '../../../domain/repositories/IAppointmentRepository'
import { getSupabaseClient } from '../SupabaseClient'

const WITH_DETAILS = `
  *,
  customers!inner(name, phone),
  vehicles!inner(brand, model, plate),
  services!inner(name)
`

function toAppointment(row: Record<string, unknown>): Appointment {
  return {
    id: row.id as string,
    customerId: row.customer_id as string,
    vehicleId: row.vehicle_id as string,
    serviceId: row.service_id as string,
    googleEventId: (row.google_event_id as string) ?? null,
    appointmentDate: new Date(row.appointment_date as string),
    status: row.status as AppointmentStatus,
    notes: (row.notes as string) ?? null,
    calendarSyncError: (row.calendar_sync_error as string) ?? null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  }
}

function toAppointmentWithDetails(row: Record<string, unknown>): AppointmentWithDetails {
  const customers = row.customers as Record<string, unknown>
  const vehicles = row.vehicles as Record<string, unknown>
  const services = row.services as Record<string, unknown>
  return {
    ...toAppointment(row),
    customerName: customers?.name as string,
    customerPhone: customers?.phone as string,
    vehicleBrand: vehicles?.brand as string,
    vehicleModel: vehicles?.model as string,
    vehiclePlate: vehicles?.plate as string,
    serviceName: services?.name as string,
  }
}

export class AppointmentRepository implements IAppointmentRepository {
  private db: SupabaseClient

  constructor() {
    this.db = getSupabaseClient()
  }

  async findById(id: string): Promise<Appointment | null> {
    const { data, error } = await this.db
      .from('appointments')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) throw new Error(`AppointmentRepository.findById: ${error.message}`)
    return data ? toAppointment(data) : null
  }

  async findFutureByCustomerId(customerId: string): Promise<AppointmentWithDetails[]> {
    const { data, error } = await this.db
      .from('appointments')
      .select(WITH_DETAILS)
      .eq('customer_id', customerId)
      .in('status', ['SCHEDULED', 'RESCHEDULED'])
      .gte('appointment_date', new Date().toISOString())
      .order('appointment_date', { ascending: true })

    if (error) throw new Error(`AppointmentRepository.findFutureByCustomerId: ${error.message}`)
    return (data ?? []).map((r) => toAppointmentWithDetails(r as Record<string, unknown>))
  }

  async findByCustomerId(customerId: string, limit = 10): Promise<AppointmentWithDetails[]> {
    const { data, error } = await this.db
      .from('appointments')
      .select(WITH_DETAILS)
      .eq('customer_id', customerId)
      .order('appointment_date', { ascending: false })
      .limit(limit)

    if (error) throw new Error(`AppointmentRepository.findByCustomerId: ${error.message}`)
    return (data ?? []).map((r) => toAppointmentWithDetails(r as Record<string, unknown>))
  }

  async create(data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>): Promise<Appointment> {
    const { data: row, error } = await this.db
      .from('appointments')
      .insert({
        customer_id: data.customerId,
        vehicle_id: data.vehicleId,
        service_id: data.serviceId,
        google_event_id: data.googleEventId ?? null,
        appointment_date: data.appointmentDate.toISOString(),
        status: data.status,
        notes: data.notes ?? null,
        calendar_sync_error: data.calendarSyncError ?? null,
      })
      .select()
      .single()

    if (error) throw new Error(`AppointmentRepository.create: ${error.message}`)
    return toAppointment(row)
  }

  async update(
    id: string,
    data: Partial<
      Pick<Appointment, 'appointmentDate' | 'status' | 'googleEventId' | 'notes' | 'calendarSyncError'>
    >
  ): Promise<Appointment> {
    const patch: Record<string, unknown> = {}
    if (data.appointmentDate !== undefined) patch.appointment_date = data.appointmentDate.toISOString()
    if (data.status !== undefined) patch.status = data.status
    if (data.googleEventId !== undefined) patch.google_event_id = data.googleEventId
    if (data.notes !== undefined) patch.notes = data.notes
    if (data.calendarSyncError !== undefined) patch.calendar_sync_error = data.calendarSyncError

    const { data: row, error } = await this.db
      .from('appointments')
      .update(patch)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`AppointmentRepository.update: ${error.message}`)
    return toAppointment(row)
  }

  async updateStatus(id: string, status: AppointmentStatus): Promise<void> {
    const { error } = await this.db.from('appointments').update({ status }).eq('id', id)
    if (error) throw new Error(`AppointmentRepository.updateStatus: ${error.message}`)
  }

  async list(limit = 50, offset = 0): Promise<AppointmentWithDetails[]> {
    const { data, error } = await this.db
      .from('appointments')
      .select(WITH_DETAILS)
      .order('appointment_date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw new Error(`AppointmentRepository.list: ${error.message}`)
    return (data ?? []).map((r) => toAppointmentWithDetails(r as Record<string, unknown>))
  }
}
