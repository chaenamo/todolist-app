import pg from 'pg';
import { config } from './config.js';

// PR-42: date는 'YYYY-MM-DD' 문자열 그대로 (Date 변환 시 타임존으로 하루 밀림)
pg.types.setTypeParser(1082, (value) => value);
// PQ-03: bigint(id, COUNT)를 number로 (2^53 미만 가정)
pg.types.setTypeParser(20, Number);

// PR-41: 풀은 한 번만 만든다
export const pool = new pg.Pool({ connectionString: config.databaseUrl, max: config.dbPoolMax });

// PR-11: 여러 쿼리를 한 단위로 실행. fn은 트랜잭션 client를 받는다
export async function withTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

// AQ-07: 헬스체크만 routes에서 직접 호출하는 예외
export async function checkConnection() {
  await pool.query('SELECT 1');
}
