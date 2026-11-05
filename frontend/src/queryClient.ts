import { QueryClient } from '@tanstack/react-query';

// 같은 데이터를 화면 이동마다 다시 받지 않도록 짧게 캐시한다. 쓰기 후에는 쿼리 무효화로 재조회한다(AQ-03)
const STALE_TIME_MS = 30_000;

export const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: STALE_TIME_MS } },
});
