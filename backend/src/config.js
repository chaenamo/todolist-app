// PR-34: 환경변수는 이 파일에서만 읽는다
const env = process.env;

function fail(message) {
  console.error(`[config] ${message}`);
  process.exit(1);
}

const isTest = env.NODE_ENV === 'test';
const isDev = env.NODE_ENV === 'development';
// PR-27: 테스트는 개발 DB 대신 TEST_DATABASE_URL을 쓴다
const databaseUrl = isTest ? env.TEST_DATABASE_URL : env.DATABASE_URL;

if (!databaseUrl) fail(isTest ? 'TEST_DATABASE_URL이 필요합니다' : 'DATABASE_URL이 필요합니다');
if (!env.JWT_ACCESS_SECRET) fail('JWT_ACCESS_SECRET이 필요합니다');
// PR-37: HS384 키는 48바이트 이상
if (Buffer.byteLength(env.JWT_ACCESS_SECRET) < 48)
  fail('JWT_ACCESS_SECRET은 48바이트 이상이어야 합니다');
// PR-35: 허용 출처는 환경변수로만 정한다. 쉼표로 여러 개, '*' 금지
const corsOrigins = (env.CORS_ORIGIN ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);
if (corsOrigins.length === 0) fail('CORS_ORIGIN이 필요합니다');
if (corsOrigins.includes('*')) fail("CORS_ORIGIN에 '*'는 쓸 수 없습니다");

export const config = {
  isTest,
  isDev,
  port: Number(env.PORT ?? 3000),
  databaseUrl,
  dbPoolMax: Number(env.DB_POOL_MAX ?? 20),
  jwtAccessSecret: env.JWT_ACCESS_SECRET,
  accessTokenTtl: env.ACCESS_TOKEN_TTL ?? '15m',
  refreshTokenTtlDays: Number(env.REFRESH_TOKEN_TTL_DAYS ?? 14),
  bcryptCost: Number(env.BCRYPT_COST ?? 10),
  corsOrigins,
};
