import { FastifyRequest, FastifyReply } from 'fastify'
import { IStockRepository } from '../../../../domain/repositories/IStockRepository'

export class StockController {
  constructor(private readonly stockRepo: IStockRepository) {}

  async summary(_req: FastifyRequest, reply: FastifyReply): Promise<void> {
    const s = await this.stockRepo.getSummary()
    reply.send(s)
  }

  async list(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { limit = 200, offset = 0 } = request.query as { limit?: number; offset?: number }
    const [items, total] = await Promise.all([
      this.stockRepo.list(Number(limit), Number(offset)),
      this.stockRepo.count(),
    ])
    reply.send({ data: items, total })
  }

  async create(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const body = request.body as {
      name: string; category?: string; sku?: string; quantity?: number; minQuantity?: number
      unit?: string; costPrice?: number; salePrice?: number; supplier?: string; notes?: string
    }
    if (!body.name) { reply.code(400).send({ error: 'name is required' }); return }
    const item = await this.stockRepo.create({
      name: body.name, category: body.category ?? null, sku: body.sku ?? null,
      quantity: body.quantity ?? 0, minQuantity: body.minQuantity ?? 0,
      unit: body.unit ?? 'unidade', costPrice: body.costPrice ?? null,
      salePrice: body.salePrice ?? null, supplier: body.supplier ?? null, notes: body.notes ?? null,
    })
    reply.code(201).send(item)
  }

  async update(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string }
    const body = request.body as Partial<{
      name: string; category: string; sku: string; quantity: number; minQuantity: number
      unit: string; costPrice: number; salePrice: number; supplier: string; notes: string
    }>
    const existing = await this.stockRepo.findById(id)
    if (!existing) { reply.code(404).send({ error: 'Item not found' }); return }
    const item = await this.stockRepo.update(id, body)
    reply.send(item)
  }

  async remove(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string }
    const existing = await this.stockRepo.findById(id)
    if (!existing) { reply.code(404).send({ error: 'Item not found' }); return }
    await this.stockRepo.delete(id)
    reply.code(204).send()
  }

  async addMovement(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string }
    const { type, quantity, reason } = request.body as { type: 'IN' | 'OUT'; quantity: number; reason?: string }
    if (!type || !quantity) { reply.code(400).send({ error: 'type and quantity are required' }); return }
    await this.stockRepo.addMovement(id, type, Number(quantity), reason)
    reply.send({ ok: true })
  }

  async getMovements(request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { id } = request.params as { id: string }
    const movements = await this.stockRepo.getMovements(id)
    reply.send({ data: movements })
  }
}
