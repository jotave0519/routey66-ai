export interface Vehicle {
  id: string
  customerId: string
  brand: string
  model: string
  plate: string
  year?: number | null
  createdAt: Date
  updatedAt: Date
}
