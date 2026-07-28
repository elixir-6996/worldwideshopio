/**
 * Applies every .sql file in lib/db/migrations in filename order.
 *
 * Applied filenames are recorded in `_migrations` so re-running the script is a
 * no-op. Each file runs inside its own transaction.
 *
 * Usage:
 *   node --env-file-if-exists=/vercel/share/.env.project scripts/db-migrate.mjs
 */
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import pg from 'pg'

const MIGRATIONS_DIR = path.join(process.cwd(), 'lib', 'db', 'migrations')

async function main() {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    console.error('DATABASE_URL is not set.')
    process.exit(1)
  }

  const client = new pg.Client({ connectionString })
  await client.connect()

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS "_migrations" (
        "name" text PRIMARY KEY NOT NULL,
        "applied_at" timestamp with time zone NOT NULL DEFAULT now()
      )
    `)

    const { rows } = await client.query('SELECT "name" FROM "_migrations"')
    const applied = new Set(rows.map((row) => row.name))

    const files = (await readdir(MIGRATIONS_DIR)).filter((file) => file.endsWith('.sql')).sort()

    let count = 0
    for (const file of files) {
      if (applied.has(file)) {
        console.log(`- skip ${file} (already applied)`)
        continue
      }
      const sql = await readFile(path.join(MIGRATIONS_DIR, file), 'utf8')
      await client.query('BEGIN')
      try {
        await client.query(sql)
        await client.query('INSERT INTO "_migrations" ("name") VALUES ($1)', [file])
        await client.query('COMMIT')
        console.log(`+ applied ${file}`)
        count += 1
      } catch (error) {
        await client.query('ROLLBACK')
        throw new Error(`Migration ${file} failed: ${error.message}`, { cause: error })
      }
    }

    console.log(count === 0 ? 'Database already up to date.' : `Applied ${count} migration(s).`)
  } finally {
    await client.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
