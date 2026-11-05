import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    coverage: { include: ['src/lib/**', 'src/hooks/**', 'src/api/**', 'src/stores/**'] }, // PR-30
  },
});
