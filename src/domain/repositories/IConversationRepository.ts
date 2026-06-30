import { Conversation, ConversationStatus } from '../entities/Conversation'
import { Message } from '../entities/Message'

export interface ExpiredTimeout {
  conversationId: string
  customerId: string
  timeoutWarned: boolean
}

export interface ConversationWithCustomer extends Conversation {
  customerName: string
  customerPhone: string
  lastMessage: string | null
  lastMessageAt: Date | null
}

export interface IConversationRepository {
  findActiveByCustomerId(customerId: string): Promise<Conversation | null>
  findById(id: string): Promise<Conversation | null>
  create(customerId: string): Promise<Conversation>
  updateStatus(id: string, status: ConversationStatus, transferReason?: string): Promise<void>
  finish(id: string): Promise<void>
  getMessages(conversationId: string, limit?: number): Promise<Message[]>
  saveMessage(data: Omit<Message, 'id' | 'createdAt'>): Promise<Message>
  list(limit?: number, offset?: number): Promise<Conversation[]>
  listWithCustomer(limit?: number, offset?: number): Promise<ConversationWithCustomer[]>
  setTimeoutAt(id: string, at: Date | null, warned?: boolean): Promise<void>
  findExpiredTimeouts(): Promise<ExpiredTimeout[]>
}
