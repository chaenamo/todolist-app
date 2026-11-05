import bcrypt from 'bcrypt';
import { config } from '../config.js';
import { pool, withTransaction } from '../db.js';
import { notFoundError } from '../errors.js';
import { validationError } from '../validators/common.js';
import {
  findUserById,
  updateUserName,
  findPasswordHashById,
  updatePasswordHash,
} from '../repositories/userRepository.js';
import { deleteAllByUser, insertRefreshToken } from '../repositories/refreshTokenRepository.js';
import { newRefreshToken } from './authService.js';

export async function getMe(userId) {
  const user = await findUserById(pool, userId);
  if (!user) throw notFoundError();
  return user;
}

export async function updateMe(userId, { name }) {
  const user = await updateUserName(pool, userId, name);
  if (!user) throw notFoundError();
  return user;
}

// BR-04, PQ-02: 불일치는 400(401이면 클라이언트가 로그아웃시킨다). G-06: 모든 세션 폐기 후 현재 세션용 새 발급
export async function changePassword(userId, { currentPassword, newPassword }) {
  const currentHash = await findPasswordHashById(pool, userId);
  if (!currentHash) throw notFoundError();
  if (!(await bcrypt.compare(currentPassword, currentHash))) {
    throw validationError({ currentPassword: '현재 비밀번호가 올바르지 않습니다' });
  }
  const passwordHash = await bcrypt.hash(newPassword, config.bcryptCost);
  const refresh = newRefreshToken();
  // PR-11: 해시 갱신·전체 폐기·새 발급을 한 트랜잭션으로
  await withTransaction(async (client) => {
    await updatePasswordHash(client, userId, passwordHash);
    await deleteAllByUser(client, userId);
    await insertRefreshToken(client, userId, refresh.hash, refresh.expiresAt);
  });
  return { refreshToken: refresh.token };
}
