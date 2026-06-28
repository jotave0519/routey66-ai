import { Vehicle } from '../entities/Vehicle'

export interface IVehicleRepository {
  findByCustomerId(customerId: string): Promise<Vehicle[]>
  findByPlateAndCustomer(plate: string, customerId: string): Promise<Vehicle | null>
  findById(id: string): Promise<Vehicle | null>
  create(data: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): Promise<Vehicle>
  update(id: string, data: Partial<Pick<Vehicle, 'brand' | 'model' | 'plate' | 'year'>>): Promise<Vehicle>
}
