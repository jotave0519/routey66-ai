import { Faq } from '../entities/Faq'

export interface IFaqRepository {
  findAllActive(): Promise<Faq[]>
  findById(id: string): Promise<Faq | null>
  create(data: Omit<Faq, 'id' | 'createdAt' | 'updatedAt'>): Promise<Faq>
  update(id: string, data: Partial<Pick<Faq, 'question' | 'answer' | 'active'>>): Promise<Faq>
  delete(id: string): Promise<void>
  list(): Promise<Faq[]>
}
