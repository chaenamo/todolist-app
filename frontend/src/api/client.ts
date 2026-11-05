// HTTP 호출 한 곳. React를 import하지 않는다(PR-13)
import { getMessages } from '../i18n';
import { queryClient } from '../queryClient';
import { useAuthStore } from '../stores/authStore';
import { useLocaleStore } from '../stores/localeStore';
import type { ApiErrorBody } from './types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
const AUTH_PATH_PREFIX = '/api/auth/';

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

// PR-20: { error: { code, message, fields } } + HTTP 상태
export class ApiError extends Error {
  status: number;
  code: string;
  fields?: Record<string, string>;

  constructor(status: number, code: string, message: string, fields?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

function isErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== 'object' || value === null || !('error' in value)) return false;
  const error = (value as { error: unknown }).error;
  return typeof error === 'object' && error !== null && 'code' in error && 'message' in error;
}

async function toApiError(res: Response): Promise<ApiError> {
  const body: unknown = await res.json().catch(() => null);
  if (isErrorBody(body)) {
    return new ApiError(res.status, body.error.code, body.error.message, body.error.fields);
  }
  return new ApiError(res.status, 'INTERNAL', getMessages().error.internal);
}

async function send(method: Method, path: string, body: unknown): Promise<Response> {
  // 서버가 이 헤더로 에러 메시지 언어를 고른다(CORS 안전 헤더)
  const headers: Record<string, string> = { 'Accept-Language': useLocaleStore.getState().locale };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const { accessToken } = useAuthStore.getState();
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;
  try {
    return await fetch(BASE_URL + path, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    throw new ApiError(0, 'NETWORK_ERROR', getMessages().error.network);
  }
}

async function parse<T>(res: Response): Promise<T> {
  if (!res.ok) throw await toApiError(res);
  return (res.status === 204 ? undefined : await res.json()) as T;
}

// PR-16 ③: 토큰 둘 다 폐기 + 이전 사용자 캐시 삭제. /login 이동은 토큰이 없어진 것을 본 App 가드가 한다
export function discardSession(): void {
  useAuthStore.getState().clear();
  queryClient.clear();
}

let refreshing: Promise<string> | null = null;

// PR-16 ①: 동시에 여러 요청이 401이어도 refresh 요청은 하나만 보낸다(single-flight)
export function refreshAccessToken(): Promise<string> {
  refreshing ??= (async () => {
    const { refreshToken } = useAuthStore.getState();
    if (!refreshToken) {
      discardSession();
      throw new ApiError(401, 'UNAUTHORIZED', getMessages().error.relogin);
    }
    const res = await send('POST', `${AUTH_PATH_PREFIX}refresh`, { refreshToken });
    if (res.status === 401) discardSession();
    const { accessToken } = await parse<{ accessToken: string }>(res);
    useAuthStore.getState().setAccessToken(accessToken);
    return accessToken;
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}

export async function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
  const res = await send(method, path, body);
  // AQ-01: 인증 엔드포인트의 401(로그인 실패 등)은 그대로 오류로 돌려준다
  if (res.status !== 401 || path.startsWith(AUTH_PATH_PREFIX)) return parse<T>(res);

  await refreshAccessToken();
  // PR-16 ②: 원 요청은 1회만 재시도. 다시 401이면 refresh 없이 로그아웃
  const retried = await send(method, path, body);
  if (retried.status === 401) discardSession();
  return parse<T>(retried);
}
