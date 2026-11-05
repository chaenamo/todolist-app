import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { logger } from './lib/logger';

// 같은 데이터를 화면 이동마다 다시 받지 않도록 짧게 캐시한다. 쓰기 후에는 쿼리 무효화로 재조회한다(AQ-03)
const STALE_TIME_MS = 30_000;

// 개발 모드 로그: 쿼리 실패, 쓰기 성공·실패(변수는 비밀번호가 있을 수 있어 남기지 않는다)
export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: STALE_TIME_MS } },
  queryCache: new QueryCache({
    onError: (err, query) => logger.error('query', JSON.stringify(query.queryKey), err),
  }),
  mutationCache: new MutationCache({
    onSuccess: (_data, _vars, _ctx, mutation) =>
      logger.info('mutation', `성공 #${mutation.mutationId}`, mutation.options.mutationKey ?? ''),
    onError: (err, _vars, _ctx, mutation) =>
      logger.error(
        'mutation',
        `실패 #${mutation.mutationId}`,
        mutation.options.mutationKey ?? '',
        err,
      ),
  }),
});
