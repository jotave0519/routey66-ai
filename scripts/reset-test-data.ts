import 'dotenv/config'
import { Client } from 'pg'

async function run() {
  const url = process.env.DIRECT_URL
  if (!url) throw new Error('DIRECT_URL não definida no .env')

  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()
  console.log('✅ Conectado ao banco\n')

  // Deleta na ordem correta para respeitar foreign keys
  const tables = ['messages', 'conversations', 'appointments', 'vehicles', 'customers']

  for (const table of tables) {
    await client.query(`DELETE FROM ${table}`)
    console.log(`🗑  ${table} limpa`)
  }

  await client.end()
  console.log('\n✅ Dados de teste removidos. Serviços, FAQs e configurações preservados.')
}

run().catch((err) => {
  console.error('❌ Erro:', err.message)
  process.exit(1)
})
