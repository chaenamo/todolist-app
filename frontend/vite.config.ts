import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['src/test-setup.ts'],
    coverage: {
      include: [
        'src/lib/**',
        'src/hooks/**',
        'src/api/**',
        'src/stores/**',
        'src/i18n/**',
        'src/components/calendar/adapter.ts',
      ],
    }, // PR-30
  },
});
