import { Service } from '../entities/Service'

export interface IServiceRepository {
  findAllActive(): Promise<Service[]>
  findById(id: string): Promise<Service | null>
  findByName(name: string): Promise<Service | null>
  create(data: Omit<Service, 'id' | 'createdAt' | 'updatedAt'>): Promise<Service>
  update(id: string, data: Partial<Pick<Service, 'name' | 'description' | 'active'>>): Promise<Service>
  list(): Promise<Service[]>
}
