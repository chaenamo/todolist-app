import { request } from './client';
import type { AuthResponse } from './types';

export function signup(body: {
  email: string;
  password: string;
  name: string;
}): Promise<AuthResponse> {
  return request('POST', '/api/auth/signup', body);
}

export function login(body: { email: string; password: string }): Promise<AuthResponse> {
  return request('POST', '/api/auth/login', body);
}

export function logout(refreshToken: string): Promise<void> {
  return request('POST', '/api/auth/logout', { refreshToken });
}
