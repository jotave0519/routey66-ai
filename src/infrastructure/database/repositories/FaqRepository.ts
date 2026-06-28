import { SupabaseClient } from '@supabase/supabase-js'
import { Faq } from '../../../domain/entities/Faq'
import { IFaqRepository } from '../../../domain/repositories/IFaqRepository'
import { getSupabaseClient } from '../SupabaseClient'

function toFaq(row: Record<string, unknown>): Faq {
  return {
    id: row.id as string,
    question: row.question as string,
    answer: row.answer as string,
    active: row.active as boolean,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  }
}

export class FaqRepository implements IFaqRepository {
  private db: SupabaseClient

  constructor() {
    this.db = getSupabaseClient()
  }

  async findAllActive(): Promise<Faq[]> {
    const { data, error } = await this.db
      .from('faq')
      .select('*')
      .eq('active', true)
      .order('created_at')

    if (error) throw new Error(`FaqRepository.findAllActive: ${error.message}`)
    return (data ?? []).map(toFaq)
  }

  async findById(id: string): Promise<Faq | null> {
    const { data, error } = await this.db.from('faq').select('*').eq('id', id).maybeSingle()
    if (error) throw new Error(`FaqRepository.findById: ${error.message}`)
    return data ? toFaq(data) : null
  }

  async create(data: Omit<Faq, 'id' | 'createdAt' | 'updatedAt'>): Promise<Faq> {
    const { data: row, error } = await this.db
      .from('faq')
      .insert({ question: data.question, answer: data.answer, active: data.active })
      .select()
      .single()

    if (error) throw new Error(`FaqRepository.create: ${error.message}`)
    return toFaq(row)
  }

  async update(id: string, data: Partial<Pick<Faq, 'question' | 'answer' | 'active'>>): Promise<Faq> {
    const { data: row, error } = await this.db
      .from('faq')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`FaqRepository.update: ${error.message}`)
    return toFaq(row)
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db.from('faq').delete().eq('id', id)
    if (error) throw new Error(`FaqRepository.delete: ${error.message}`)
  }

  async list(): Promise<Faq[]> {
    const { data, error } = await this.db.from('faq').select('*').order('created_at')
    if (error) throw new Error(`FaqRepository.list: ${error.message}`)
    return (data ?? []).map(toFaq)
  }
}
