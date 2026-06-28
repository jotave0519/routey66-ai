import { BusinessSettings } from '../entities/BusinessSettings'

export interface IBusinessSettingsRepository {
  get(): Promise<BusinessSettings>
  update(data: Partial<Omit<BusinessSettings, 'id' | 'updatedAt'>>): Promise<BusinessSettings>
}
