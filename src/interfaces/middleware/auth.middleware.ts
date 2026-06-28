import { FastifyRequest, FastifyReply } from 'fastify'

export async function adminAuthMiddleware(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const adminToken = process.env.ADMIN_API_TOKEN
  const provided = request.headers['x-admin-key']

  if (!adminToken || provided !== adminToken) {
    reply.code(401).send({ error: 'Unauthorized' })
  }
}
