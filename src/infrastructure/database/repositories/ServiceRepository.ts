import { SupabaseClient } from '@supabase/supabase-js'
import { Service } from '../../../domain/entities/Service'
import { IServiceRepository } from '../../../domain/repositories/IServiceRepository'
import { getSupabaseClient } from '../SupabaseClient'

function toService(row: Record<string, unknown>): Service {
  return {
    id: row.id as string,
    name: row.name as string,
    description: (row.description as string) ?? null,
    active: row.active as boolean,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  }
}

export class ServiceRepository implements IServiceRepository {
  private db: SupabaseClient

  constructor() {
    this.db = getSupabaseClient()
  }

  async findAllActive(): Promise<Service[]> {
    const { data, error } = await this.db
      .from('services')
      .select('*')
      .eq('active', true)
      .order('name')

    if (error) throw new Error(`ServiceRepository.findAllActive: ${error.message}`)
    return (data ?? []).map(toService)
  }

  async findById(id: string): Promise<Service | null> {
    const { data, error } = await this.db
      .from('services')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) throw new Error(`ServiceRepository.findById: ${error.message}`)
    return data ? toService(data) : null
  }

  async findByName(name: string): Promise<Service | null> {
    const { data, error } = await this.db
      .from('services')
      .select('*')
      .ilike('name', name)
      .eq('active', true)
      .maybeSingle()

    if (error) throw new Error(`ServiceRepository.findByName: ${error.message}`)
    return data ? toService(data) : null
  }

  async create(data: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>): Promise<Service> {
    const { data: row, error } = await this.db
      .from('services')
      .insert({ name: data.name, description: data.description, active: data.active })
      .select()
      .single()

    if (error) throw new Error(`ServiceRepository.create: ${error.message}`)
    return toService(row)
  }

  async update(
    id: string,
    data: Partial<Pick<Service, 'name' | 'description' | 'active'>>
  ): Promise<Service> {
    const { data: row, error } = await this.db
      .from('services')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`ServiceRepository.update: ${error.message}`)
    return toService(row)
  }

  async list(): Promise<Service[]> {
    const { data, error } = await this.db.from('services').select('*').order('name')
    if (error) throw new Error(`ServiceRepository.list: ${error.message}`)
    return (data ?? []).map(toService)
  }
}
