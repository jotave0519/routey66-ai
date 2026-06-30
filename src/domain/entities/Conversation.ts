export type ConversationStatus = 'ACTIVE' | 'TRANSFERRED' | 'FINISHED'

export interface Conversation {
  id: string
  customerId: string
  status: ConversationStatus
  transferReason?: string | null
  startedAt: Date
  finishedAt?: Date | null
  timeoutAt: Date | null
  timeoutWarned: boolean
}
