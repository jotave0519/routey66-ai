import Anthropic from '@anthropic-ai/sdk'
import { IAIService, AIContext, AIResponse, AITool } from '../../domain/services/IAIService'

export class ClaudeAIService implements IAIService {
  private client: Anthropic
  private model: string

  constructor() {
    const apiKey = process.env.ANTHROPIC_API_KEY
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY must be set')
    this.client = new Anthropic({ apiKey })
    this.model = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6'
  }

  async chat(context: AIContext, tools: AITool[]): Promise<AIResponse> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
      system: context.systemPrompt,
      messages: context.history.map((m) => ({
        role: m.role,
        content: m.content,
      })),
      tools: tools.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.input_schema,
      })),
    })

    const text = response.content
      .filter((b) => b.type === 'text')
      .map((b) => (b as Anthropic.TextBlock).text)
      .join('')

    const toolCalls = response.content
      .filter((b) => b.type === 'tool_use')
      .map((b) => {
        const tu = b as Anthropic.ToolUseBlock
        return { name: tu.name, input: tu.input as Record<string, unknown> }
      })

    return {
      text,
      toolCalls,
      stopReason: response.stop_reason as AIResponse['stopReason'],
    }
  }
}
