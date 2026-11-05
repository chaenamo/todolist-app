import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const BACKEND = 'http://localhost:3000';

export default defineConfig({
  plugins: [react()],
  // PR-35: 개발 중에는 프록시로 같은 출처처럼 호출해 CORS 없이 동작
  server: {
    proxy: { '/api': BACKEND, '/health': BACKEND },
  },
  test: {
    environment: 'jsdom',
    coverage: { include: ['src/lib/**', 'src/hooks/**', 'src/api/**', 'src/stores/**'] }, // PR-30
  },
});
