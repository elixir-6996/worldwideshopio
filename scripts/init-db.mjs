/**
 * Applies scripts/init-db.sql to the database in DATABASE_URL.
 *
 * Usage:
 *   node --env-file-if-exists=.env.development.local scripts/init-db.mjs
 */
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const here = dirname(fileURLToPath(import.meta.url))

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('DATABASE_URL is not set.')
  process.exit(1)
}

const sql = await readFile(join(here, 'init-db.sql'), 'utf8')
const pool = new pg.Pool({
  connectionString,
  ssl: connectionString.includes('sslmode=disable') ? false : { rejectUnauthorized: false },
})

try {
  await pool.query(sql)
  const { rows } = await pool.query(
    "select table_name from information_schema.tables where table_schema = 'public' order by 1",
  )
  console.log(`Schema ready. ${rows.length} tables:`)
  for (const row of rows) console.log(`  - ${row.table_name}`)
} catch (error) {
  console.error('Schema setup failed:', error.message)
  process.exitCode = 1
} finally {
  await pool.end()
}
