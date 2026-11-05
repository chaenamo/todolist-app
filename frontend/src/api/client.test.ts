import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { queryClient } from '../queryClient';
import en from '../i18n/en';
import ja from '../i18n/ja';
import { useAuthStore } from '../stores/authStore';
import { useLocaleStore } from '../stores/localeStore';
import { ApiError, request } from './client';

const fetchMock = vi.fn<typeof fetch>();

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function errorBody(code: string, message: string, fields?: Record<string, string>) {
  return { error: { code, message, ...(fields ? { fields } : {}) } };
}

function authOf(callIndex: number): string | null {
  return new Headers(fetchMock.mock.calls[callIndex][1]?.headers).get('Authorization');
}

function urlOf(callIndex: number): string {
  return String(fetchMock.mock.calls[callIndex][0]);
}

function refreshCalls(): number {
  return fetchMock.mock.calls.filter(([url]) => String(url) === '/api/auth/refresh').length;
}

async function catchError(promise: Promise<unknown>): Promise<ApiError> {
  try {
    await promise;
  } catch (e) {
    expect(e).toBeInstanceOf(ApiError);
    return e as ApiError;
  }
  throw new Error('에러가 발생해야 한다');
}

let clearSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  useAuthStore.getState().clear();
  localStorage.clear();
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
  clearSpy = vi.spyOn(queryClient, 'clear');
});

afterEach(() => {
  vi.unstubAllGlobals();
  clearSpy.mockRestore();
});

test('[PR-16] accessToken이 있으면 Authorization Bearer 헤더를 붙인다', async () => {
  useAuthStore.setState({ accessToken: 'at-1', refreshToken: 'rt-1' });
  fetchMock.mockResolvedValueOnce(json(200, { ok: true }));

  await expect(request('GET', '/api/todos')).resolves.toEqual({ ok: true });

  expect(urlOf(0)).toBe('/api/todos');
  expect(authOf(0)).toBe('Bearer at-1');
});

test('[PR-16] accessToken이 없으면 Authorization 헤더를 붙이지 않는다', async () => {
  fetchMock.mockResolvedValueOnce(json(200, {}));
  await request('GET', '/api/todos');
  expect(authOf(0)).toBeNull();
});

test('[PR-20][CMP-03] 에러 응답은 code/message/fields/status를 가진 ApiError로 throw한다', async () => {
  fetchMock.mockResolvedValueOnce(
    json(400, errorBody('VALIDATION_ERROR', '입력값이 올바르지 않습니다', { title: '필수입니다' })),
  );

  const err = await catchError(request('POST', '/api/todos', { title: '' }));

  expect(err.status).toBe(400);
  expect(err.code).toBe('VALIDATION_ERROR');
  expect(err.message).toBe('입력값이 올바르지 않습니다');
  expect(err.fields).toEqual({ title: '필수입니다' });
});

test('[PR-20] 에러 본문이 JSON이 아니면 code INTERNAL ApiError를 throw한다', async () => {
  fetchMock.mockResolvedValueOnce(new Response('<html>oops</html>', { status: 502 }));

  const err = await catchError(request('GET', '/api/todos'));

  expect(err.status).toBe(502);
  expect(err.code).toBe('INTERNAL');
});

test('[PR-20] fetch가 reject되면 status 0, NETWORK_ERROR ApiError를 throw한다', async () => {
  fetchMock.mockRejectedValueOnce(new TypeError('Failed to fetch'));

  const err = await catchError(request('GET', '/api/todos'));

  expect(err.status).toBe(0);
  expect(err.code).toBe('NETWORK_ERROR');
});

test('[PR-16] 401 후 refresh 성공 시 새 토큰으로 원 요청을 정확히 1회 재시도하고 결과를 반환한다', async () => {
  useAuthStore.setState({ accessToken: 'old', refreshToken: 'rt-1' });
  fetchMock
    .mockResolvedValueOnce(json(401, errorBody('UNAUTHORIZED', '만료')))
    .mockResolvedValueOnce(json(200, { accessToken: 'new' }))
    .mockResolvedValueOnce(json(200, { items: [1] }));

  await expect(request('GET', '/api/todos')).resolves.toEqual({ items: [1] });

  expect(fetchMock).toHaveBeenCalledTimes(3);
  expect(urlOf(0)).toBe('/api/todos');
  expect(authOf(0)).toBe('Bearer old');
  expect(urlOf(1)).toBe('/api/auth/refresh');
  expect(fetchMock.mock.calls[1][1]?.method).toBe('POST');
  expect(JSON.parse(String(fetchMock.mock.calls[1][1]?.body))).toEqual({ refreshToken: 'rt-1' });
  expect(urlOf(2)).toBe('/api/todos');
  expect(authOf(2)).toBe('Bearer new');
  expect(useAuthStore.getState().accessToken).toBe('new');
});

test('[PR-16] 동시에 401을 받은 보호 요청 3개는 refresh를 1번만 호출하고 모두 새 토큰으로 재시도한다 (single-flight)', async () => {
  useAuthStore.setState({ accessToken: 'old', refreshToken: 'rt-1' });
  fetchMock.mockImplementation(async (input, init) => {
    const url = String(input);
    if (url === '/api/auth/refresh') return json(200, { accessToken: 'new' });
    const auth = new Headers(init?.headers).get('Authorization');
    return auth === 'Bearer new'
      ? json(200, { path: url })
      : json(401, errorBody('UNAUTHORIZED', '만료'));
  });

  const results = await Promise.all([
    request('GET', '/api/a'),
    request('GET', '/api/b'),
    request('GET', '/api/c'),
  ]);

  expect(results).toEqual([{ path: '/api/a' }, { path: '/api/b' }, { path: '/api/c' }]);
  expect(refreshCalls()).toBe(1);
  expect(fetchMock).toHaveBeenCalledTimes(7);
  const retried = fetchMock.mock.calls
    .map((_, i) => i)
    .filter((i) => urlOf(i) !== '/api/auth/refresh' && authOf(i) === 'Bearer new');
  expect(retried).toHaveLength(3);
});

test('[SC-00-E2] 401 후 refresh도 401이면 토큰을 모두 폐기하고 queryClient를 비운다', async () => {
  useAuthStore.setState({ accessToken: 'old', refreshToken: 'rt-1' });
  fetchMock
    .mockResolvedValueOnce(json(401, errorBody('UNAUTHORIZED', '만료')))
    .mockResolvedValueOnce(json(401, errorBody('UNAUTHORIZED', 'refresh 만료')));

  const err = await catchError(request('GET', '/api/todos'));

  expect(err.status).toBe(401);
  expect(useAuthStore.getState().accessToken).toBeNull();
  expect(useAuthStore.getState().refreshToken).toBeNull();
  expect(clearSpy).toHaveBeenCalled();
  expect(fetchMock).toHaveBeenCalledTimes(2);
});

test('[PR-16] 재시도 요청도 401이면 refresh를 다시 호출하지 않고 로그아웃 처리 후 ApiError를 throw한다', async () => {
  useAuthStore.setState({ accessToken: 'old', refreshToken: 'rt-1' });
  fetchMock
    .mockResolvedValueOnce(json(401, errorBody('UNAUTHORIZED', '만료')))
    .mockResolvedValueOnce(json(200, { accessToken: 'new' }))
    .mockResolvedValueOnce(json(401, errorBody('UNAUTHORIZED', '여전히 거부')));

  const err = await catchError(request('GET', '/api/todos'));

  expect(err.status).toBe(401);
  expect(fetchMock).toHaveBeenCalledTimes(3);
  expect(refreshCalls()).toBe(1);
  expect(useAuthStore.getState().accessToken).toBeNull();
  expect(useAuthStore.getState().refreshToken).toBeNull();
  expect(clearSpy).toHaveBeenCalled();
});

test('[AQ-01] /api/auth/ 요청의 401은 refresh·토큰 폐기 없이 ApiError만 throw한다', async () => {
  useAuthStore.setState({ accessToken: 'at-1', refreshToken: 'rt-1' });
  fetchMock.mockResolvedValueOnce(json(401, errorBody('INVALID_CREDENTIALS', '비밀번호 불일치')));

  const err = await catchError(
    request('POST', '/api/auth/login', { email: 'a@b.c', password: 'x' }),
  );

  expect(err.status).toBe(401);
  expect(err.code).toBe('INVALID_CREDENTIALS');
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(useAuthStore.getState().accessToken).toBe('at-1');
  expect(useAuthStore.getState().refreshToken).toBe('rt-1');
  expect(clearSpy).not.toHaveBeenCalled();
});

test('[PR-16] 204 응답은 undefined를 반환한다', async () => {
  fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
  await expect(request('DELETE', '/api/todos/1')).resolves.toBeUndefined();
});

test('[PR-16] body가 있으면 JSON 직렬화와 Content-Type 헤더를 설정한다', async () => {
  fetchMock.mockResolvedValueOnce(json(201, { id: 1 }));

  await request('POST', '/api/todos', { title: '할일' });

  const init = fetchMock.mock.calls[0][1];
  expect(init?.method).toBe('POST');
  expect(init?.body).toBe(JSON.stringify({ title: '할일' }));
  expect(new Headers(init?.headers).get('Content-Type')).toBe('application/json');
});

test('[SC-00-E2] 401인데 refreshToken이 없으면 refresh 요청 없이 세션을 폐기한다', async () => {
  useAuthStore.setState({ accessToken: 'old', refreshToken: null });
  fetchMock.mockResolvedValueOnce(json(401, errorBody('UNAUTHORIZED', '만료')));

  const err = await catchError(request('GET', '/api/todos'));

  expect(err.status).toBe(401);
  expect(fetchMock).toHaveBeenCalledTimes(1);
  expect(useAuthStore.getState().accessToken).toBeNull();
  expect(clearSpy).toHaveBeenCalled();
});

test('[FE-14] 모든 요청에 현재 언어의 Accept-Language 헤더가 실린다', async () => {
  fetchMock.mockImplementation(() => Promise.resolve(json(200, {})));
  await request('GET', '/api/todos');
  useLocaleStore.getState().setLocale('ja');
  await request('GET', '/api/todos');

  const lang = (i: number) =>
    new Headers(fetchMock.mock.calls[i][1]?.headers).get('Accept-Language');
  expect(lang(0)).toBe('ko');
  expect(lang(1)).toBe('ja');
});

test('[FE-14] 네트워크 오류·본문 없는 오류의 문구는 현재 언어 사전에서 온다', async () => {
  useLocaleStore.getState().setLocale('en');
  fetchMock.mockRejectedValueOnce(new TypeError('failed'));
  expect((await catchError(request('GET', '/api/todos'))).message).toBe(en.error.network);

  fetchMock.mockResolvedValueOnce(new Response('oops', { status: 500 }));
  expect((await catchError(request('GET', '/api/todos'))).message).toBe(en.error.internal);
});

test('[FE-14] refresh token이 없을 때의 재로그인 문구도 현재 언어 사전에서 온다', async () => {
  useLocaleStore.getState().setLocale('ja');
  fetchMock.mockResolvedValueOnce(json(401, errorBody('UNAUTHORIZED', 'x')));
  expect((await catchError(request('GET', '/api/todos'))).message).toBe(ja.error.relogin);
});
