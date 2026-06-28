export interface Service {
  id: string
  name: string
  description?: string | null
  active: boolean
  createdAt: Date
  updatedAt: Date
}
