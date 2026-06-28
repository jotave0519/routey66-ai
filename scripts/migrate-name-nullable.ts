import 'dotenv/config'
import { Client } from 'pg'

async function run() {
  const client = new Client({ connectionString: process.env.DIRECT_URL, ssl: { rejectUnauthorized: false } })
  try {
    await client.connect()
    await client.query('ALTER TABLE customers ALTER COLUMN name DROP NOT NULL')
    console.log('Migration OK: customers.name is now nullable')
  } catch(e: unknown) {
    console.log('Migration result:', e instanceof Error ? e.message : String(e))
  } finally {
    await client.end()
  }
}

run()
