import 'dotenv/config'
import { Client } from 'pg'

async function run() {
  const client = new Client({
    connectionString: process.env.DIRECT_URL,
    ssl: { rejectUnauthorized: false },
  })
  await client.connect()

  const { rows: tables } = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' ORDER BY table_name
  `)
  console.log('\n📋 Tabelas criadas:')
  tables.forEach((t) => console.log(`  ✅ ${t.table_name}`))

  const { rows: services } = await client.query('SELECT name FROM services ORDER BY name')
  console.log('\n🔧 Serviços cadastrados:')
  services.forEach((s) => console.log(`  • ${s.name}`))

  const { rows: faq } = await client.query('SELECT question FROM faq ORDER BY created_at')
  console.log('\n❓ FAQ cadastradas:')
  faq.forEach((f) => console.log(`  • ${f.question}`))

  const { rows: settings } = await client.query('SELECT company_name, address FROM business_settings')
  console.log('\n🏪 Configurações da oficina:')
  settings.forEach((s) => console.log(`  • ${s.company_name} — ${s.address}`))

  await client.end()
}

run().catch(console.error)
