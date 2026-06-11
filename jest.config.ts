import type { Config } from 'jest';

const config: Config = {
  projects: [
    {
      displayName: 'node',
      testEnvironment: 'node',
      testMatch: [
        '<rootDir>/__tests__/api/**/*.test.ts',
        '<rootDir>/__tests__/actions/**/*.test.ts',
        '<rootDir>/__tests__/models/**/*.test.ts',
      ],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: {
            jsx: 'react-jsx',
            module: 'commonjs',
            moduleResolution: 'node',
          },
        }],
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
      },
    },
    {
      displayName: 'jsdom',
      testEnvironment: 'jest-environment-jsdom',
      testMatch: [
        '<rootDir>/__tests__/components/**/*.test.tsx',
        '<rootDir>/__tests__/providers/**/*.test.tsx',
      ],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: {
            jsx: 'react-jsx',
            module: 'commonjs',
            moduleResolution: 'node',
          },
        }],
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        '\\.(css|less|scss|sass)$': '<rootDir>/__tests__/__mocks__/styleMock.ts',
        '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__tests__/__mocks__/fileMock.ts',
      },
      setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
    },
  ],
};

export default config;