import { FastifyRequest, FastifyReply } from 'fastify'
import axios from 'axios'

export class WhatsAppAdminController {
  async status(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const evolutionUrl = process.env.EVOLUTION_API_URL
    const apiKey = process.env.EVOLUTION_API_KEY
    const instance = process.env.EVOLUTION_INSTANCE ?? 'routey66'

    if (!evolutionUrl || !apiKey) {
      reply.send({ status: 'disconnected', instance, error: 'Evolution API not configured' })
      return
    }

    try {
      const res = await axios.get(`${evolutionUrl}/instance/fetchInstances`, {
        headers: { apikey: apiKey },
        timeout: 5000,
      })
      const instances = Array.isArray(res.data) ? res.data : []
      const found = instances.find(
        (i: Record<string, unknown>) =>
          (i.instance as Record<string, unknown>)?.instanceName === instance,
      )
      const state = (found?.instance as Record<string, unknown>)?.state ?? 'disconnected'
      reply.send({ status: state, instance })
    } catch {
      reply.send({ status: 'disconnected', instance })
    }
  }
}
