import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';

// .env를 읽지 않도록 필요한 환경변수만 넘겨 server.js를 실행한다
function startServer(extraEnv) {
  return spawnSync(process.execPath, ['src/server.js'], {
    env: {
      PATH: process.env.PATH,
      SystemRoot: process.env.SystemRoot,
      DATABASE_URL: 'postgres://x@localhost:1/x',
      ...extraEnv,
    },
    timeout: 10000,
    encoding: 'utf8',
  });
}

test('PR-34: JWT_ACCESS_SECRET 없이 실행하면 0이 아닌 코드로 종료', () => {
  const result = startServer({});
  assert.notEqual(result.status, 0);
  assert.equal(result.signal, null); // 타임아웃으로 죽은 게 아니다
});

test('PR-37: JWT_ACCESS_SECRET이 48바이트 미만이면 0이 아닌 코드로 종료', () => {
  const result = startServer({ JWT_ACCESS_SECRET: 'a'.repeat(47) });
  assert.notEqual(result.status, 0);
  assert.equal(result.signal, null);
});
