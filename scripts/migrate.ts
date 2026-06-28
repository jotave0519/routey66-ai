import 'dotenv/config'
import { Client } from 'pg'
import * as fs from 'fs'
import * as path from 'path'

async function run() {
  const url = process.env.DIRECT_URL
  if (!url) throw new Error('DIRECT_URL não definida no .env')

  const client = new Client({
    connectionString: url,
    ssl: { rejectUnauthorized: false },
  })

  await client.connect()
  console.log('✅ Conectado ao banco Supabase\n')

  const files = [
    path.join(__dirname, '../database/migrations/001_initial_schema.sql'),
    path.join(__dirname, '../database/seed.sql'),
  ]

  for (const file of files) {
    const name = path.basename(file)
    console.log(`▶ Executando ${name}...`)
    const sql = fs.readFileSync(file, 'utf8')
    await client.query(sql)
    console.log(`✅ ${name} concluído\n`)
  }

  await client.end()
  console.log('🎉 Migration concluída com sucesso!')
}

run().catch((err) => {
  console.error('❌ Erro na migration:', err.message)
  process.exit(1)
})
