import { Message } from '../entities/Message'

export interface AIContext {
  systemPrompt: string
  history: Array<{ role: 'user' | 'assistant'; content: string }>
}

export interface AIToolCall {
  name: string
  input: Record<string, unknown>
}

export interface AIResponse {
  text: string
  toolCalls: AIToolCall[]
  stopReason: 'end_turn' | 'tool_use' | 'max_tokens'
}

export interface IAIService {
  chat(context: AIContext, tools: AITool[]): Promise<AIResponse>
}

export interface AITool {
  name: string
  description: string
  input_schema: {
    type: 'object'
    properties: Record<string, unknown>
    required?: string[]
  }
}
