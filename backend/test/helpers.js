import { config } from '../src/config.js';
import { pool } from '../src/db.js';
import { signup } from '../src/services/authService.js';

export { pool };

// PR-27: 각 테스트 파일 시작 시 테이블을 비운다. 개발 DB를 지우지 않도록 테스트 설정에서만 허용
export async function resetDb() {
  if (!config.isTest) throw new Error('resetDb는 NODE_ENV=test에서만 실행한다');
  await pool.query('TRUNCATE refresh_tokens, todos, categories, users RESTART IDENTITY CASCADE');
}

let userSeq = 0;

// 가입(+'기본' 카테고리)까지 마친 사용자와 토큰 쌍
export async function createUserAndToken({ email, password = 'password1234', name = '테스터' } = {}) {
  userSeq += 1;
  return signup({ email: email ?? `user${userSeq}@test.example`, password, name });
}

export function bearer(accessToken) {
  return { Authorization: `Bearer ${accessToken}` };
}
