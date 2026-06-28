import 'dotenv/config'
import { buildContainer } from './container'
import { buildServer } from './interfaces/http/server'

async function main() {
  const container = buildContainer()
  const server = await buildServer(container)

  const port = Number(process.env.PORT ?? 3000)
  const host = '0.0.0.0'

  await server.listen({ port, host })
  console.log(`🚀 Routey66 AI running at http://${host}:${port}`)
}

main().catch((err) => {
  console.error('Fatal error during startup:', err)
  process.exit(1)
})
