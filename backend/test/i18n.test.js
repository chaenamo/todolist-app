import { test, beforeEach, after } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import request from 'supertest';
import { app } from '../src/app.js';
import { pickLocale, translate, hasTranslation } from '../src/i18n.js';
import { pool, resetDb, createUserAndToken, bearer } from './helpers.js';

beforeEach(resetDb);
after(async () => {
  await resetDb();
  await pool.end();
});

test('pickLocale: q 값 순으로 지원 언어를 고르고, 없으면 ko', () => {
  assert.equal(pickLocale(undefined), 'ko');
  assert.equal(pickLocale(''), 'ko');
  assert.equal(pickLocale('fr'), 'ko');
  assert.equal(pickLocale('ja'), 'ja');
  assert.equal(pickLocale('en-US'), 'en');
  assert.equal(pickLocale('fr, ja;q=0.5, en;q=0.9'), 'en');
  assert.equal(pickLocale('ja,en;q=0.9'), 'ja');
  assert.equal(pickLocale('en;q=0, ja;q=0.1'), 'ja');
  assert.equal(pickLocale('JA-jp'), 'ja');
});

test('translate: ko·표에 없는 문구는 그대로, 숫자 문구는 패턴으로', () => {
  assert.equal(translate('찾을 수 없습니다', 'ko'), '찾을 수 없습니다');
  assert.equal(translate('찾을 수 없습니다', 'en'), 'Not found');
  assert.equal(translate('없는 문구', 'ja'), '없는 문구');
  assert.equal(translate('30자 이하로 입력하세요', 'en'), 'Enter 30 characters or fewer');
  assert.equal(translate('비밀번호는 8~72자여야 합니다', 'ja'), 'パスワードは8〜72文字にしてください');
  assert.equal(translate('조회 기간은 최대 42일입니다', 'en'), 'The range can be at most 42 days');
});

// src의 에러 문구(한국어 문자열 리터럴)가 모두 번역을 가진다. 설정 오류(config.js)와 카테고리 이름 '기본'은 응답 문구가 아니다
test('src의 한국어 에러 문구는 모두 번역 표에 있다', () => {
  const files = readdirSync('src', { recursive: true })
    .filter((f) => f.endsWith('.js') && !f.endsWith('config.js'))
    .map((f) => join('src', f));
  const missing = [];
  for (const file of files) {
    for (const line of readFileSync(file, 'utf8').split('\n')) {
      if (line.trim().startsWith('//')) continue;
      for (const [, , text] of line.matchAll(/(['"`])((?:(?!\1).)*[가-힣](?:(?!\1).)*)\1/g)) {
        if (file.endsWith('i18n.js') || text === '기본') continue;
        const sample = text.replace(/\$\{[^}]+\}/g, '8'); // 템플릿 자리는 숫자로
        if (!hasTranslation(sample)) missing.push(`${file}: ${text}`);
      }
    }
  }
  assert.deepEqual(missing, []);
});

test('Accept-Language에 따라 401·404·400 fields·409 문구가 바뀐다', async () => {
  const me = await createUserAndToken({ email: 'i18n@test.example' });

  let res = await request(app).get('/api/categories').set('Accept-Language', 'ja');
  assert.equal(res.status, 401);
  assert.equal(res.body.error.message, 'ログインが必要です');

  res = await request(app).get('/api/todos/999999').set(bearer(me.accessToken)).set('Accept-Language', 'en');
  assert.equal(res.status, 404);
  assert.deepEqual(res.body.error, { code: 'NOT_FOUND', message: 'Not found' });

  res = await request(app)
    .post('/api/todos')
    .set(bearer(me.accessToken))
    .set('Accept-Language', 'en-US,en;q=0.9')
    .send({ title: '', startDate: '2026-11-10', endDate: '2026-11-01' });
  assert.equal(res.status, 400);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
  assert.equal(res.body.error.message, 'Please check your input');
  assert.equal(res.body.error.fields.title, 'This field is required');

  res = await request(app)
    .post('/api/auth/signup')
    .set('Accept-Language', 'ja')
    .send({ email: 'i18n@test.example', password: 'password1234', name: '重複' });
  assert.equal(res.status, 409);
  assert.equal(res.body.error.fields.email, 'このメールアドレスは既に使用されています');
});

test('헤더가 없거나 미지원 언어면 한국어 그대로', async () => {
  for (const lang of [undefined, 'fr-FR']) {
    const req = request(app).get('/api/categories');
    if (lang) req.set('Accept-Language', lang);
    const res = await req;
    assert.equal(res.body.error.message, '로그인이 필요합니다');
  }
});
