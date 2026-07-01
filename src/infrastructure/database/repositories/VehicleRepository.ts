import { SupabaseClient } from '@supabase/supabase-js'
import { Vehicle } from '../../../domain/entities/Vehicle'
import { IVehicleRepository, VehicleWithOwner } from '../../../domain/repositories/IVehicleRepository'
import { getSupabaseClient } from '../SupabaseClient'

function toVehicle(row: Record<string, unknown>): Vehicle {
  return {
    id: row.id as string,
    customerId: row.customer_id as string,
    brand: row.brand as string,
    model: row.model as string,
    plate: row.plate as string,
    year: (row.year as number) ?? null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  }
}

export class VehicleRepository implements IVehicleRepository {
  private db: SupabaseClient

  constructor() {
    this.db = getSupabaseClient()
  }

  async findByCustomerId(customerId: string): Promise<Vehicle[]> {
    const { data, error } = await this.db
      .from('vehicles')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(`VehicleRepository.findByCustomerId: ${error.message}`)
    return (data ?? []).map(toVehicle)
  }

  async findByPlateAndCustomer(plate: string, customerId: string): Promise<Vehicle | null> {
    const normalized = plate.toUpperCase().replace(/[^A-Z0-9]/g, '')
    const { data, error } = await this.db
      .from('vehicles')
      .select('*')
      .eq('customer_id', customerId)
      .ilike('plate', normalized)
      .maybeSingle()

    if (error) throw new Error(`VehicleRepository.findByPlateAndCustomer: ${error.message}`)
    return data ? toVehicle(data) : null
  }

  async findById(id: string): Promise<Vehicle | null> {
    const { data, error } = await this.db
      .from('vehicles')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) throw new Error(`VehicleRepository.findById: ${error.message}`)
    return data ? toVehicle(data) : null
  }

  async create(data: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): Promise<Vehicle> {
    const { data: row, error } = await this.db
      .from('vehicles')
      .insert({
        customer_id: data.customerId,
        brand: data.brand,
        model: data.model,
        plate: data.plate.toUpperCase().replace(/[^A-Z0-9]/g, ''),
        year: data.year ?? null,
      })
      .select()
      .single()

    if (error) throw new Error(`VehicleRepository.create: ${error.message}`)
    return toVehicle(row)
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db.from('vehicles').delete().eq('id', id)
    if (error) throw new Error(`VehicleRepository.delete: ${error.message}`)
  }

  async update(
    id: string,
    data: Partial<Pick<Vehicle, 'brand' | 'model' | 'plate' | 'year'>>
  ): Promise<Vehicle> {
    const { data: row, error } = await this.db
      .from('vehicles')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`VehicleRepository.update: ${error.message}`)
    return toVehicle(row)
  }

  async listAll(limit = 50, offset = 0): Promise<VehicleWithOwner[]> {
    const { data, error } = await this.db
      .from('vehicles')
      .select('*, customers!inner(name, phone)')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw new Error(`VehicleRepository.listAll: ${error.message}`)
    return (data ?? []).map((row) => {
      const r = row as Record<string, unknown>
      const c = r.customers as Record<string, unknown>
      return { ...toVehicle(r), customerName: c?.name as string, customerPhone: c?.phone as string }
    })
  }

  async countAll(): Promise<number> {
    const { count, error } = await this.db
      .from('vehicles')
      .select('*', { count: 'exact', head: true })
    if (error) throw new Error(`VehicleRepository.countAll: ${error.message}`)
    return count ?? 0
  }
}
