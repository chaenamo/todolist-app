import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pool } from './helpers.js';

// 테스트 DB 안의 임시 스키마를 search_path로 지정해 빈 DB처럼 쓴다
const schema = `mig_test_${process.pid}`;
const url = new URL(process.env.TEST_DATABASE_URL);
url.searchParams.set('options', `-c search_path=${schema}`);

function runMigrate(extraArgs = []) {
  return spawnSync(process.execPath, ['scripts/migrate.js', ...extraArgs], {
    env: { PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, DATABASE_URL: url.href },
    encoding: 'utf8',
    timeout: 30000,
  });
}

async function recorded() {
  const { rows } = await pool.query(`SELECT filename FROM ${schema}.schema_migrations ORDER BY filename`);
  return rows.map((row) => row.filename);
}

before(async () => {
  await pool.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
  await pool.query(`CREATE SCHEMA ${schema}`);
});

after(async () => {
  await pool.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`);
  await pool.end();
});

test('PR-44: 빈 DB에 1회 실행하면 4개 파일이 적용되고 schema_migrations에 4행', async () => {
  const result = runMigrate();
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(await recorded(), [
    '001_create_users.sql',
    '002_create_categories.sql',
    '003_create_todos.sql',
    '004_create_refresh_tokens.sql',
  ]);
  const { rows } = await pool.query(`SELECT to_regclass('${schema}.refresh_tokens') AS t`);
  assert.notEqual(rows[0].t, null);
});

test('PR-44: 두 번째 실행은 아무 파일도 적용하지 않고 성공한다', async () => {
  const result = runMigrate();
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /nothing to apply/);
  assert.equal((await recorded()).length, 4);
});

test('PR-44: 깨진 SQL 파일은 롤백·미기록되고 종료 코드가 0이 아니다', async () => {
  await pool.query(`DROP SCHEMA ${schema} CASCADE; CREATE SCHEMA ${schema}`);
  const dir = mkdtempSync(join(tmpdir(), 'mig-'));
  try {
    writeFileSync(join(dir, '001_ok.sql'), 'CREATE TABLE probe_ok (x int);');
    writeFileSync(join(dir, '002_broken.sql'), 'CREATE TABLE probe_bad (x int);\nSELEC 1;');
    writeFileSync(join(dir, '003_after.sql'), 'CREATE TABLE probe_after (x int);');

    const result = runMigrate(['--dir', dir]);
    assert.notEqual(result.status, 0);
    assert.deepEqual(await recorded(), ['001_ok.sql']);
    const { rows } = await pool.query(
      `SELECT to_regclass('${schema}.probe_bad') AS bad, to_regclass('${schema}.probe_after') AS later`,
    );
    assert.equal(rows[0].bad, null); // 같은 파일의 앞 문장도 롤백
    assert.equal(rows[0].later, null); // 실패 후 다음 파일은 실행하지 않는다
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
