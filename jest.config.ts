import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'jsdom',
  preset: 'ts-jest',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
        esModuleInterop: true,
      },
    }],
  },
  testMatch: [
    '**/__tests__/**/*.test.(ts|tsx)',
    '**/*.test.(ts|tsx)',
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
};

export default config;
