import { afterEach, expect, test, vi } from 'vitest';
import { createLogger, logger } from './logger';

afterEach(() => {
  vi.restoreAllMocks();
});

test('켜져 있으면 [scope] 접두어로 해당 레벨 콘솔에 쓴다', () => {
  const info = vi.spyOn(console, 'info').mockImplementation(() => {});
  const error = vi.spyOn(console, 'error').mockImplementation(() => {});
  const log = createLogger(true);
  log.info('api', 'GET /x', 200);
  log.error('query', 'boom');
  expect(info).toHaveBeenCalledWith('[api]', 'GET /x', 200);
  expect(error).toHaveBeenCalledWith('[query]', 'boom');
});

test('꺼져 있으면(운영·테스트) 아무것도 쓰지 않는다', () => {
  const spies = (['debug', 'info', 'warn', 'error'] as const).map((l) =>
    vi.spyOn(console, l).mockImplementation(() => {}),
  );
  const log = createLogger(false);
  log.debug('a');
  log.info('a');
  log.warn('a');
  log.error('a');
  logger.info('a'); // 테스트 모드의 기본 logger도 꺼져 있다
  for (const spy of spies) expect(spy).not.toHaveBeenCalled();
});
