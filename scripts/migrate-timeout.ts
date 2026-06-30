import 'dotenv/config'
import { Client } from 'pg'
import * as fs from 'fs'
import * as path from 'path'

async function run() {
  const url = process.env.DIRECT_URL
  if (!url) throw new Error('DIRECT_URL não definida no .env')

  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } })
  await client.connect()
  console.log('✅ Conectado ao banco\n')

  const sql = fs.readFileSync(
    path.join(__dirname, '../database/migrations/002_conversation_timeout.sql'),
    'utf8',
  )
  await client.query(sql)
  console.log('✅ Migration 002_conversation_timeout aplicada')

  await client.end()
}

run().catch((err) => {
  console.error('❌ Erro:', err.message)
  process.exit(1)
})
