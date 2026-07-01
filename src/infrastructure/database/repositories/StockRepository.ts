import { SupabaseClient } from '@supabase/supabase-js'
import { StockItem, StockMovement } from '../../../domain/entities/StockItem'
import { IStockRepository } from '../../../domain/repositories/IStockRepository'
import { getSupabaseClient } from '../SupabaseClient'

function toItem(row: Record<string, unknown>): StockItem {
  return {
    id: row.id as string,
    name: row.name as string,
    category: (row.category as string) ?? null,
    sku: (row.sku as string) ?? null,
    quantity: Number(row.quantity),
    minQuantity: Number(row.min_quantity),
    unit: (row.unit as string) ?? 'unidade',
    costPrice: row.cost_price != null ? Number(row.cost_price) : null,
    salePrice: row.sale_price != null ? Number(row.sale_price) : null,
    supplier: (row.supplier as string) ?? null,
    notes: (row.notes as string) ?? null,
    createdAt: new Date(row.created_at as string),
    updatedAt: new Date(row.updated_at as string),
  }
}

function toMovement(row: Record<string, unknown>): StockMovement {
  return {
    id: row.id as string,
    stockItemId: row.stock_item_id as string,
    type: row.type as 'IN' | 'OUT',
    quantity: Number(row.quantity),
    reason: (row.reason as string) ?? null,
    createdAt: new Date(row.created_at as string),
  }
}

export class StockRepository implements IStockRepository {
  private db: SupabaseClient
  constructor() { this.db = getSupabaseClient() }

  async list(limit = 200, offset = 0): Promise<StockItem[]> {
    const { data, error } = await this.db
      .from('stock_items').select('*')
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1)
    if (error) throw new Error(`StockRepository.list: ${error.message}`)
    return (data ?? []).map((r) => toItem(r as Record<string, unknown>))
  }

  async count(): Promise<number> {
    const { count, error } = await this.db.from('stock_items').select('*', { count: 'exact', head: true })
    if (error) throw new Error(`StockRepository.count: ${error.message}`)
    return count ?? 0
  }

  async findById(id: string): Promise<StockItem | null> {
    const { data, error } = await this.db.from('stock_items').select('*').eq('id', id).maybeSingle()
    if (error) throw new Error(`StockRepository.findById: ${error.message}`)
    return data ? toItem(data as Record<string, unknown>) : null
  }

  async create(data: Omit<StockItem, 'id' | 'createdAt' | 'updatedAt'>): Promise<StockItem> {
    const { data: row, error } = await this.db.from('stock_items').insert({
      name: data.name,
      category: data.category ?? null,
      sku: data.sku ?? null,
      quantity: data.quantity,
      min_quantity: data.minQuantity,
      unit: data.unit,
      cost_price: data.costPrice ?? null,
      sale_price: data.salePrice ?? null,
      supplier: data.supplier ?? null,
      notes: data.notes ?? null,
    }).select().single()
    if (error) throw new Error(`StockRepository.create: ${error.message}`)
    return toItem(row as Record<string, unknown>)
  }

  async update(id: string, data: Partial<Omit<StockItem, 'id' | 'createdAt' | 'updatedAt'>>): Promise<StockItem> {
    const patch: Record<string, unknown> = {}
    if (data.name !== undefined) patch.name = data.name
    if (data.category !== undefined) patch.category = data.category
    if (data.sku !== undefined) patch.sku = data.sku
    if (data.quantity !== undefined) patch.quantity = data.quantity
    if (data.minQuantity !== undefined) patch.min_quantity = data.minQuantity
    if (data.unit !== undefined) patch.unit = data.unit
    if (data.costPrice !== undefined) patch.cost_price = data.costPrice
    if (data.salePrice !== undefined) patch.sale_price = data.salePrice
    if (data.supplier !== undefined) patch.supplier = data.supplier
    if (data.notes !== undefined) patch.notes = data.notes

    const { data: row, error } = await this.db.from('stock_items').update(patch).eq('id', id).select().single()
    if (error) throw new Error(`StockRepository.update: ${error.message}`)
    return toItem(row as Record<string, unknown>)
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.db.from('stock_items').delete().eq('id', id)
    if (error) throw new Error(`StockRepository.delete: ${error.message}`)
  }

  async addMovement(stockItemId: string, type: 'IN' | 'OUT', quantity: number, reason?: string): Promise<void> {
    const { error: mErr } = await this.db.from('stock_movements').insert({
      stock_item_id: stockItemId, type, quantity, reason: reason ?? null,
    })
    if (mErr) throw new Error(`StockRepository.addMovement insert: ${mErr.message}`)

    const delta = type === 'IN' ? quantity : -quantity
    const { data: item, error: fErr } = await this.db.from('stock_items').select('quantity').eq('id', stockItemId).single()
    if (fErr) throw new Error(`StockRepository.addMovement fetch: ${fErr.message}`)
    const newQty = Number((item as Record<string, unknown>).quantity) + delta
    const { error: uErr } = await this.db.from('stock_items').update({ quantity: Math.max(0, newQty) }).eq('id', stockItemId)
    if (uErr) throw new Error(`StockRepository.addMovement update: ${uErr.message}`)
  }

  async getMovements(stockItemId: string, limit = 50): Promise<StockMovement[]> {
    const { data, error } = await this.db.from('stock_movements').select('*')
      .eq('stock_item_id', stockItemId)
      .order('created_at', { ascending: false })
      .limit(limit)
    if (error) throw new Error(`StockRepository.getMovements: ${error.message}`)
    return (data ?? []).map((r) => toMovement(r as Record<string, unknown>))
  }
}
