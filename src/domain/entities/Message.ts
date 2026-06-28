export type MessageSender = 'customer' | 'assistant' | 'system'

export interface Message {
  id: string
  conversationId: string
  sender: MessageSender
  content: string
  createdAt: Date
}
