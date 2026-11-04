import jwt from 'jsonwebtoken';
import { config } from '../config.js';
import { AppError, ERROR_CODES } from '../errors.js';

function unauthorized() {
  return new AppError(401, ERROR_CODES.UNAUTHORIZED, '로그인이 필요합니다');
}

// PR-37: 알고리즘을 HS384로 고정해 검증한다(HS256·none 등 알고리즘 혼동 차단)
export function requireAuth(req, res, next) {
  const [scheme, token] = (req.headers.authorization ?? '').split(' ');
  if (scheme !== 'Bearer' || !token) throw unauthorized();
  let payload;
  try {
    payload = jwt.verify(token, config.jwtAccessSecret, { algorithms: ['HS384'] });
  } catch {
    throw unauthorized();
  }
  req.userId = Number(payload.sub);
  if (!Number.isSafeInteger(req.userId) || req.userId <= 0) throw unauthorized();
  next();
}
