import { FastifyRequest, FastifyReply } from 'fastify'
import axios, { AxiosError } from 'axios'

// Evolution API v2 response shape from /instance/fetchInstances
interface EvolutionInstance {
  id: string
  name: string
  connectionStatus: string   // "open" | "close" | "connecting" | "qrcode"
  ownerJid: string | null    // "5511999998888@s.whatsapp.net"
  profileName: string | null
  profilePicUrl: string | null
}

export class WhatsAppAdminController {
  private cfg() {
    return {
      url: (process.env.EVOLUTION_API_URL ?? '').replace(/\/$/, ''),
      key: process.env.EVOLUTION_API_KEY ?? '',
      instance: process.env.EVOLUTION_INSTANCE ?? 'routey66',
    }
  }

  private h(key: string) {
    return { apikey: key }
  }

  async status(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { url, key, instance } = this.cfg()

    if (!url || !key) {
      reply.send({ connected: false, status: 'not_configured', instance })
      return
    }

    try {
      const res = await axios.get<EvolutionInstance[]>(`${url}/instance/fetchInstances`, {
        headers: this.h(key),
        timeout: 8000,
      })

      const list: EvolutionInstance[] = Array.isArray(res.data) ? res.data : []

      // Evolution API v2: match by "name" field (not instance.instanceName)
      const found = list.find((i) => i.name === instance)

      if (!found) {
        reply.send({ connected: false, status: 'not_found', instance })
        return
      }

      const state = found.connectionStatus ?? 'close'
      const connected = state === 'open'

      // ownerJid comes as "5511999998888@s.whatsapp.net" — strip suffix
      const phone = found.ownerJid ? found.ownerJid.replace(/@.*/, '') : null

      reply.send({
        connected,
        status: state,
        instance,
        phone,
        profileName: found.profileName ?? null,
        profilePicUrl: found.profilePicUrl ?? null,
      })
    } catch (e) {
      const msg = e instanceof AxiosError
        ? `${e.response?.status ?? ''} ${e.message}`
        : String(e)
      reply.send({ connected: false, status: 'error', instance, error: msg })
    }
  }

  async qrcode(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { url, key, instance } = this.cfg()

    if (!url || !key) {
      reply.code(503).send({ error: 'Evolution API not configured' })
      return
    }

    try {
      // First check if already connected — avoid generating a new QR unnecessarily
      const statusRes = await axios.get<EvolutionInstance[]>(`${url}/instance/fetchInstances`, {
        headers: this.h(key),
        timeout: 8000,
      })
      const list: EvolutionInstance[] = Array.isArray(statusRes.data) ? statusRes.data : []
      const found = list.find((i) => i.name === instance)

      if (found?.connectionStatus === 'open') {
        reply.send({ connected: true, qrcode: null })
        return
      }

      // Request QR code
      const qrRes = await axios.get(`${url}/instance/connect/${instance}`, {
        headers: this.h(key),
        timeout: 20000,
      })

      const data = qrRes.data as Record<string, unknown>

      // Evolution API v2 returns { base64: "data:image/png;base64,..." } or { qrcode: { base64: "..." } }
      const qrcode =
        (data['base64'] as string | undefined) ??
        ((data['qrcode'] as Record<string, unknown> | undefined)?.['base64'] as string | undefined) ??
        null

      reply.send({ connected: false, qrcode })
    } catch (e) {
      const msg = e instanceof AxiosError
        ? `Evolution API ${e.response?.status ?? ''}: ${e.message}`
        : String(e)
      reply.code(500).send({ error: msg })
    }
  }

  async logout(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { url, key, instance } = this.cfg()

    try {
      await axios.delete(`${url}/instance/logout/${instance}`, {
        headers: this.h(key),
        timeout: 8000,
      })
      reply.code(204).send()
    } catch (e) {
      const msg = e instanceof AxiosError ? e.message : String(e)
      reply.code(500).send({ error: msg })
    }
  }
}
