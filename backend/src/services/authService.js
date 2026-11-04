import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { pool, withTransaction } from '../db.js';
import { AppError, ERROR_CODES } from '../errors.js';
import { insertUser, findUserWithHashByEmail } from '../repositories/userRepository.js';
import { insertCategory } from '../repositories/categoryRepository.js';
import {
  insertRefreshToken,
  findValidByHash,
  deleteByHash,
  deleteExpiredByUser,
} from '../repositories/refreshTokenRepository.js';

const DEFAULT_CATEGORY_NAME = '기본'; // BR-05
const DAY_MS = 24 * 60 * 60 * 1000;

// PR-37: claims는 sub·iat·exp만, HS384
export function issueAccessToken(userId) {
  return jwt.sign({ sub: String(userId) }, config.jwtAccessSecret, {
    algorithm: 'HS384',
    expiresIn: config.accessTokenTtl,
  });
}

export function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

// PR-37: JWT가 아닌 불투명 무작위 문자열, DB에는 해시만
function newRefreshToken() {
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(Date.now() + config.refreshTokenTtlDays * DAY_MS);
  return { token, hash: hashToken(token), expiresAt };
}

// AD-06, PR-11: 사용자 + '기본' 카테고리 + refresh token을 한 트랜잭션으로. 해시 계산은 트랜잭션 밖
export async function signup({ email, password, name }) {
  const passwordHash = await bcrypt.hash(password, config.bcryptCost);
  const refresh = newRefreshToken();
  const user = await withTransaction(async (client) => {
    const created = await insertUser(client, { email, passwordHash, name });
    await insertCategory(client, created.id, { name: DEFAULT_CATEGORY_NAME, isDefault: true });
    await insertRefreshToken(client, created.id, refresh.hash, refresh.expiresAt);
    return created;
  });
  // G-01: 가입 후 자동 로그인
  return { accessToken: issueAccessToken(user.id), refreshToken: refresh.token, user };
}

export async function login({ email, password }) {
  const found = await findUserWithHashByEmail(pool, email);
  const isValid = found !== null && (await bcrypt.compare(password, found.passwordHash));
  // G-04: 미가입·불일치를 구분하지 않는다
  if (!isValid) {
    throw new AppError(401, ERROR_CODES.UNAUTHORIZED, '이메일 또는 비밀번호가 올바르지 않습니다');
  }
  const user = { id: found.id, email: found.email, name: found.name, createdAt: found.createdAt };
  await deleteExpiredByUser(pool, user.id);
  const refresh = newRefreshToken();
  await insertRefreshToken(pool, user.id, refresh.hash, refresh.expiresAt);
  return { accessToken: issueAccessToken(user.id), refreshToken: refresh.token, user };
}

// 회전 없음: 새 access token만 발급
export async function refreshAccessToken(refreshToken) {
  const found = await findValidByHash(pool, hashToken(refreshToken));
  if (!found) throw new AppError(401, ERROR_CODES.UNAUTHORIZED, '다시 로그인해 주세요');
  return { accessToken: issueAccessToken(found.userId) };
}

// A-14: 없는 토큰이어도 성공(멱등)
export async function logout(refreshToken) {
  await deleteByHash(pool, hashToken(refreshToken));
}
