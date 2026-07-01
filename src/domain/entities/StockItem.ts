export interface StockItem {
  id: string
  name: string
  category: string | null
  sku: string | null
  quantity: number
  minQuantity: number
  unit: string
  costPrice: number | null
  salePrice: number | null
  supplier: string | null
  notes: string | null
  createdAt: Date
  updatedAt: Date
}

export interface StockMovement {
  id: string
  stockItemId: string
  type: 'IN' | 'OUT'
  quantity: number
  reason: string | null
  createdAt: Date
}
