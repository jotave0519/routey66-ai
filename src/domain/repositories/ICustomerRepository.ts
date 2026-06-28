import { Customer } from '../entities/Customer'

export interface ICustomerRepository {
  findByPhone(phone: string): Promise<Customer | null>
  findById(id: string): Promise<Customer | null>
  create(data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer>
  update(id: string, data: Partial<Pick<Customer, 'name' | 'whatsappName'>>): Promise<Customer>
  list(limit?: number, offset?: number): Promise<Customer[]>
  count(): Promise<number>
}
