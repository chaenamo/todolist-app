import { request } from './client';
import type { User } from './types';

export function getMe(): Promise<User> {
  return request('GET', '/api/users/me');
}

export function updateName(name: string): Promise<User> {
  return request('PATCH', '/api/users/me', { name });
}

export function changePassword(body: {
  currentPassword: string;
  newPassword: string;
}): Promise<{ refreshToken: string }> {
  return request('PUT', '/api/users/me/password', body);
}
