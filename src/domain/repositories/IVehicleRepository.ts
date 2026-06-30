import { Vehicle } from '../entities/Vehicle'

export interface VehicleWithOwner extends Vehicle {
  customerName: string
  customerPhone: string
}

export interface IVehicleRepository {
  findByCustomerId(customerId: string): Promise<Vehicle[]>
  findByPlateAndCustomer(plate: string, customerId: string): Promise<Vehicle | null>
  findById(id: string): Promise<Vehicle | null>
  create(data: Omit<Vehicle, 'id' | 'createdAt' | 'updatedAt'>): Promise<Vehicle>
  update(id: string, data: Partial<Pick<Vehicle, 'brand' | 'model' | 'plate' | 'year'>>): Promise<Vehicle>
  listAll(limit?: number, offset?: number): Promise<VehicleWithOwner[]>
  countAll(): Promise<number>
}
