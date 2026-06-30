import { SupabaseClient } from '@supabase/supabase-js'
import { Conversation, ConversationStatus } from '../../../domain/entities/Conversation'
import { Message } from '../../../domain/entities/Message'
import { IConversationRepository, ExpiredTimeout, ConversationWithCustomer } from '../../../domain/repositories/IConversationRepository'
import { getSupabaseClient } from '../SupabaseClient'

function toConversation(row: Record<string, unknown>): Conversation {
  return {
    id: row.id as string,
    customerId: row.customer_id as string,
    status: row.status as ConversationStatus,
    transferReason: (row.transfer_reason as string) ?? null,
    startedAt: new Date(row.started_at as string),
    finishedAt: row.finished_at ? new Date(row.finished_at as string) : null,
    timeoutAt: row.timeout_at ? new Date(row.timeout_at as string) : null,
    timeoutWarned: (row.timeout_warned as boolean) ?? false,
  }
}

function toMessage(row: Record<string, unknown>): Message {
  return {
    id: row.id as string,
    conversationId: row.conversation_id as string,
    sender: row.sender as 'customer' | 'assistant' | 'system',
    content: row.content as string,
    createdAt: new Date(row.created_at as string),
  }
}

export class ConversationRepository implements IConversationRepository {
  private db: SupabaseClient

  constructor() {
    this.db = getSupabaseClient()
  }

  async findActiveByCustomerId(customerId: string): Promise<Conversation | null> {
    const { data, error } = await this.db
      .from('conversations')
      .select('*')
      .eq('customer_id', customerId)
      .eq('status', 'ACTIVE')
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw new Error(`ConversationRepository.findActiveByCustomerId: ${error.message}`)
    return data ? toConversation(data) : null
  }

  async findById(id: string): Promise<Conversation | null> {
    const { data, error } = await this.db
      .from('conversations')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error) throw new Error(`ConversationRepository.findById: ${error.message}`)
    return data ? toConversation(data) : null
  }

  async create(customerId: string): Promise<Conversation> {
    const { data, error } = await this.db
      .from('conversations')
      .insert({ customer_id: customerId, status: 'ACTIVE' })
      .select()
      .single()

    if (error) throw new Error(`ConversationRepository.create: ${error.message}`)
    return toConversation(data)
  }

  async updateStatus(id: string, status: ConversationStatus, transferReason?: string): Promise<void> {
    const { error } = await this.db
      .from('conversations')
      .update({
        status,
        ...(transferReason && { transfer_reason: transferReason }),
      })
      .eq('id', id)

    if (error) throw new Error(`ConversationRepository.updateStatus: ${error.message}`)
  }

  async finish(id: string): Promise<void> {
    const { error } = await this.db
      .from('conversations')
      .update({ status: 'FINISHED', finished_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw new Error(`ConversationRepository.finish: ${error.message}`)
  }

  async getMessages(conversationId: string, limit = 30): Promise<Message[]> {
    // Fetch the most recent `limit` messages (descending), then reverse to
    // chronological order — using ascending+limit would instead return the
    // OLDEST messages once the conversation exceeds the limit.
    const { data, error } = await this.db
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw new Error(`ConversationRepository.getMessages: ${error.message}`)
    return (data ?? []).map(toMessage).reverse()
  }

  async saveMessage(data: Omit<Message, 'id' | 'createdAt'>): Promise<Message> {
    const { data: row, error } = await this.db
      .from('messages')
      .insert({
        conversation_id: data.conversationId,
        sender: data.sender,
        content: data.content,
      })
      .select()
      .single()

    if (error) throw new Error(`ConversationRepository.saveMessage: ${error.message}`)
    return toMessage(row)
  }

  async list(limit = 50, offset = 0): Promise<Conversation[]> {
    const { data, error } = await this.db
      .from('conversations')
      .select('*')
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw new Error(`ConversationRepository.list: ${error.message}`)
    return (data ?? []).map(toConversation)
  }

  async listWithCustomer(limit = 50, offset = 0): Promise<ConversationWithCustomer[]> {
    const { data, error } = await this.db
      .from('conversations')
      .select('*, customers!inner(name, phone)')
      .order('started_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw new Error(`ConversationRepository.listWithCustomer: ${error.message}`)
    const convs = data ?? []
    if (convs.length === 0) return []

    const ids = convs.map((r) => r.id as string)
    const { data: msgs } = await this.db
      .from('messages')
      .select('conversation_id, content, created_at')
      .in('conversation_id', ids)
      .order('created_at', { ascending: false })

    const latestMsg = new Map<string, { content: string; at: Date }>()
    for (const m of (msgs ?? [])) {
      if (!latestMsg.has(m.conversation_id as string)) {
        latestMsg.set(m.conversation_id as string, {
          content: m.content as string,
          at: new Date(m.created_at as string),
        })
      }
    }

    return convs.map((row) => {
      const r = row as Record<string, unknown>
      const c = r.customers as Record<string, unknown>
      const last = latestMsg.get(r.id as string)
      return {
        ...toConversation(r),
        customerName: (c?.name as string) ?? '',
        customerPhone: (c?.phone as string) ?? '',
        lastMessage: last?.content ?? null,
        lastMessageAt: last?.at ?? null,
      }
    })
  }

  async setTimeoutAt(id: string, at: Date | null, warned = false): Promise<void> {
    const { error } = await this.db
      .from('conversations')
      .update({ timeout_at: at?.toISOString() ?? null, timeout_warned: warned })
      .eq('id', id)

    if (error) throw new Error(`ConversationRepository.setTimeoutAt: ${error.message}`)
  }

  async findExpiredTimeouts(): Promise<ExpiredTimeout[]> {
    const { data, error } = await this.db
      .from('conversations')
      .select('id, customer_id, timeout_warned')
      .eq('status', 'ACTIVE')
      .not('timeout_at', 'is', null)
      .lte('timeout_at', new Date().toISOString())

    if (error) throw new Error(`ConversationRepository.findExpiredTimeouts: ${error.message}`)
    return (data ?? []).map((r) => ({
      conversationId: r.id as string,
      customerId: r.customer_id as string,
      timeoutWarned: r.timeout_warned as boolean,
    }))
  }
}
