import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    exclude: [
      'node_modules/**',
      'dist/**',
      'src/__tests__/preservation.property.test.ts',
      'src/lib/__tests__/gitWorkflowManagement.property.test.ts',
      'src/lib/__tests__/bug-condition-exploration.property.test.ts',
      'src/lib/__tests__/qualityDashboardFunctionality.property.test.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/**',
        'dist/**',
        'src/test/**',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
      ],
    },
  },
})
