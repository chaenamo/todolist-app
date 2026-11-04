// PR-44: db/migrations/NNN_*.sql 중 미적용 파일을 번호순으로, 파일별 트랜잭션으로 적용한다.
// 사용: node --env-file=.env scripts/migrate.js [--test] [--dir <폴더>]
//   --test  DATABASE_URL 대신 TEST_DATABASE_URL에 적용
//   --dir   마이그레이션 폴더 (기본 db/migrations)
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import pg from 'pg';

const args = process.argv.slice(2);
const connectionString = args.includes('--test')
  ? process.env.TEST_DATABASE_URL
  : process.env.DATABASE_URL;
const dirIndex = args.indexOf('--dir');
const dir = dirIndex >= 0 ? args[dirIndex + 1] : join(import.meta.dirname, '..', 'db', 'migrations');

if (!connectionString) {
  console.error('[migrate] 대상 DB 접속 문자열이 없습니다');
  process.exit(1);
}

const client = new pg.Client({ connectionString });
await client.connect();
try {
  await client.query(
    'CREATE TABLE IF NOT EXISTS schema_migrations (filename text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())',
  );
  const { rows } = await client.query('SELECT filename FROM schema_migrations');
  const applied = new Set(rows.map((row) => row.filename));
  const pending = readdirSync(dir)
    .filter((name) => name.endsWith('.sql') && !applied.has(name))
    .sort();

  for (const filename of pending) {
    await client.query('BEGIN');
    try {
      await client.query(readFileSync(join(dir, filename), 'utf8'));
      await client.query('INSERT INTO schema_migrations (filename) VALUES ($1)', [filename]);
      await client.query('COMMIT');
      console.log(`[migrate] applied ${filename}`);
    } catch (err) {
      await client.query('ROLLBACK');
      console.error(`[migrate] failed ${filename}: ${err.message}`);
      process.exitCode = 1;
      break;
    }
  }
  if (pending.length === 0) console.log('[migrate] nothing to apply');
} finally {
  await client.end();
}
