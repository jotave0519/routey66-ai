import { StockItem, StockMovement } from '../entities/StockItem'

export interface IStockRepository {
  list(limit?: number, offset?: number): Promise<StockItem[]>
  count(): Promise<number>
  getSummary(): Promise<{ total: number; lowStock: number; totalValue: number }>
  findById(id: string): Promise<StockItem | null>
  create(data: Omit<StockItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<StockItem>
  update(id: string, data: Partial<Omit<StockItem, 'id' | 'createdAt' | 'updatedAt'>>): Promise<StockItem>
  delete(id: string): Promise<void>
  addMovement(stockItemId: string, type: 'IN' | 'OUT', quantity: number, reason?: string): Promise<void>
  getMovements(stockItemId: string, limit?: number): Promise<StockMovement[]>
}
