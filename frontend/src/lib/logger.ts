// 개발 모드 콘솔 로그. 운영 빌드에서는 enabled가 상수 false라 호출이 아무 일도 하지 않는다(테스트 출력도 끔)
// 토큰·비밀번호·요청 본문은 로그에 넣지 않는다
type Level = 'debug' | 'info' | 'warn' | 'error';

export function createLogger(enabled: boolean) {
  const write =
    (level: Level) =>
    (scope: string, ...args: unknown[]): void => {
      if (enabled) console[level](`[${scope}]`, ...args);
    };
  return { debug: write('debug'), info: write('info'), warn: write('warn'), error: write('error') };
}

export const logger = createLogger(import.meta.env.DEV && import.meta.env.MODE !== 'test');
