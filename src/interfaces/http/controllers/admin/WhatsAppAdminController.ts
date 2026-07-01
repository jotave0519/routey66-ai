import { FastifyRequest, FastifyReply } from 'fastify'
import axios, { AxiosError } from 'axios'

export class WhatsAppAdminController {
  private cfg() {
    return {
      url: (process.env.EVOLUTION_API_URL ?? '').replace(/\/$/, ''),
      key: process.env.EVOLUTION_API_KEY ?? '',
      instance: process.env.EVOLUTION_INSTANCE ?? 'routey66',
    }
  }

  private headers(key: string) {
    return { apikey: key }
  }

  async status(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { url, key, instance } = this.cfg()

    if (!url || !key) {
      reply.send({ connected: false, status: 'not_configured', instance })
      return
    }

    try {
      const res = await axios.get(`${url}/instance/fetchInstances`, {
        headers: this.headers(key),
        timeout: 8000,
      })

      const list: Record<string, unknown>[] = Array.isArray(res.data) ? res.data : []
      const found = list.find(
        (i) => (i.instance as Record<string, unknown>)?.instanceName === instance,
      )

      if (!found) {
        reply.send({ connected: false, status: 'not_found', instance })
        return
      }

      const inst = found.instance as Record<string, unknown>
      const state = (inst.status as string) ?? 'close'
      const connected = state === 'open'

      // Phone comes as "5511999998888@s.whatsapp.net" — strip the suffix
      const rawOwner = (found.owner as string) ?? null
      const phone = rawOwner ? rawOwner.replace(/@.*/, '') : null

      reply.send({
        connected,
        status: state,
        instance,
        phone,
        profileName: (found.profileName as string) ?? null,
        profilePicUrl: (found.profilePicUrl as string) ?? null,
      })
    } catch (e) {
      const msg = e instanceof AxiosError ? `${e.response?.status ?? ''} ${e.message}` : String(e)
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
      const res = await axios.get(`${url}/instance/connect/${instance}`, {
        headers: this.headers(key),
        timeout: 20000,
      })

      const data = res.data as Record<string, unknown>

      // Already connected
      if ((data?.instance as Record<string, unknown>)?.status === 'open') {
        reply.send({ connected: true, qrcode: null })
        return
      }

      // QR code returned as base64 image string
      const qrcode = (data['base64'] as string) ?? ((data['qrcode'] as Record<string, unknown>)?.['base64'] as string) ?? null

      if (!qrcode) {
        reply.send({ connected: false, qrcode: null, raw: data })
        return
      }

      reply.send({ connected: false, qrcode })
    } catch (e) {
      const msg = e instanceof AxiosError
        ? `Evolution API error ${e.response?.status ?? ''}: ${e.message}`
        : String(e)
      reply.code(500).send({ error: msg })
    }
  }

  async logout(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
    const { url, key, instance } = this.cfg()

    try {
      await axios.delete(`${url}/instance/logout/${instance}`, {
        headers: this.headers(key),
        timeout: 8000,
      })
      reply.code(204).send()
    } catch (e) {
      const msg = e instanceof AxiosError ? e.message : String(e)
      reply.code(500).send({ error: msg })
    }
  }
}
