import { SupabaseClient } from '@supabase/supabase-js'
import { Customer } from '../../../domain/entities/Customer'
import { ICustomerRepository } from '../../../domain/repositories/ICustomerRepository'
import { getSupabaseClient } from '../SupabaseClient'

function toCustomer(row: Record<string, unknown>): Customer {
  return {
    id: row.id as string,
    name: row.name as string,
    phone: row.phone as string,
    whatsappName: (row.whatsapp_name as string) ?? null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  }
}

export class CustomerRepository implements ICustomerRepository {
  private db: SupabaseClient

  constructor() {
    this.db = getSupabaseClient()
  }

  async findByPhone(phone: string): Promise<Customer | null> {
    const { data, error } = await this.db
      .from('customers')
      .select('*')
      .eq('phone', phone)
      .maybeSingle()

    if (error) throw new Error(`CustomerRepository.findByPhone: ${error.message}`)
    return data ? toCustomer(data) : null
  }

  async findById(id: string): Promise<Customer | null> {
    const { data, error } = await this.db
      .from('customers')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) throw new Error(`CustomerRepository.findById: ${error.message}`)
    return data ? toCustomer(data) : null
  }

  async create(data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
    const { data: row, error } = await this.db
      .from('customers')
      .insert({
        name: data.name,
        phone: data.phone,
        whatsapp_name: data.whatsappName ?? null,
      })
      .select()
      .single()

    if (error) throw new Error(`CustomerRepository.create: ${error.message}`)
    return toCustomer(row)
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db.from('customers').delete().eq('id', id)
    if (error) throw new Error(`CustomerRepository.delete: ${error.message}`)
  }

  async update(id: string, data: Partial<Pick<Customer, 'name' | 'phone' | 'whatsappName'>>): Promise<Customer> {
    const { data: row, error } = await this.db
      .from('customers')
      .update({
        ...(data.name !== undefined && { name: data.name }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.whatsappName !== undefined && { whatsapp_name: data.whatsappName }),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`CustomerRepository.update: ${error.message}`)
    return toCustomer(row)
  }

  async list(limit = 50, offset = 0): Promise<Customer[]> {
    const { data, error } = await this.db
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw new Error(`CustomerRepository.list: ${error.message}`)
    return (data ?? []).map(toCustomer)
  }

  async count(): Promise<number> {
    const { count, error } = await this.db
      .from('customers')
      .select('*', { count: 'exact', head: true })

    if (error) throw new Error(`CustomerRepository.count: ${error.message}`)
    return count ?? 0
  }
}
