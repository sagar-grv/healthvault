import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'jsdom',
  preset: 'ts-jest',
  modulePathIgnorePatterns: ['<rootDir>/pipeline/', '<rootDir>/.hive/'],
  watchPathIgnorePatterns: ['<rootDir>/pipeline/', '<rootDir>/.hive/'],
  haste: {
    enableSymlinks: false,
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Mock next-intl ESM in Jest (CommonJS environment)
    '^next-intl$': '<rootDir>/src/__mocks__/next-intl.ts',
    '^next-intl/server$': '<rootDir>/src/__mocks__/next-intl-server.ts',
  },
  transform: {
    '^.+\\.(ts|tsx)$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          esModuleInterop: true,
          rootDir: '.',
        },
      },
    ],
  },
  testMatch: ['**/__tests__/**/*.test.(ts|tsx)', '**/*.test.(ts|tsx)'],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
};

export default config;
