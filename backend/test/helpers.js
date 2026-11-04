import { config } from '../src/config.js';
import { pool } from '../src/db.js';

export { pool };

// PR-27: 각 테스트 파일 시작 시 테이블을 비운다. 개발 DB를 지우지 않도록 테스트 설정에서만 허용
export async function resetDb() {
  if (!config.isTest) throw new Error('resetDb는 NODE_ENV=test에서만 실행한다');
  await pool.query('TRUNCATE refresh_tokens, todos, categories, users RESTART IDENTITY CASCADE');
}

// createUserAndToken()은 BE-05에서 추가한다
