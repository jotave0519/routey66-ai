import { SupabaseClient } from '@supabase/supabase-js'
import { BusinessSettings, OpeningHours } from '../../../domain/entities/BusinessSettings'
import { IBusinessSettingsRepository } from '../../../domain/repositories/IBusinessSettingsRepository'
import { getSupabaseClient } from '../SupabaseClient'

function toSettings(row: Record<string, unknown>): BusinessSettings {
  return {
    id: row.id as string,
    companyName: row.company_name as string,
    address: row.address as string,
    phone: (row.phone as string) ?? null,
    openingHours: row.opening_hours as OpeningHours,
    welcomeMessage: row.welcome_message as string,
    slotDurationMinutes: row.slot_duration_minutes as number,
    updatedAt: new Date(row.updated_at as string),
  }
}

export class BusinessSettingsRepository implements IBusinessSettingsRepository {
  private db: SupabaseClient

  constructor() {
    this.db = getSupabaseClient()
  }

  async get(): Promise<BusinessSettings> {
    const { data, error } = await this.db
      .from('business_settings')
      .select('*')
      .limit(1)
      .single()

    if (error) throw new Error(`BusinessSettingsRepository.get: ${error.message}`)
    return toSettings(data)
  }

  async update(data: Partial<Omit<BusinessSettings, 'id' | 'updatedAt'>>): Promise<BusinessSettings> {
    const patch: Record<string, unknown> = {}
    if (data.companyName !== undefined) patch.company_name = data.companyName
    if (data.address !== undefined) patch.address = data.address
    if (data.phone !== undefined) patch.phone = data.phone
    if (data.openingHours !== undefined) patch.opening_hours = data.openingHours
    if (data.welcomeMessage !== undefined) patch.welcome_message = data.welcomeMessage
    if (data.slotDurationMinutes !== undefined) patch.slot_duration_minutes = data.slotDurationMinutes

    const { data: row, error } = await this.db
      .from('business_settings')
      .update(patch)
      .eq('singleton', true)
      .select()
      .single()

    if (error) throw new Error(`BusinessSettingsRepository.update: ${error.message}`)
    return toSettings(row)
  }
}
