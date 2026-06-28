/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: 'tsconfig.json' }],
    '^.+\\.m?js$': ['babel-jest', {
      presets: [['@babel/preset-env', { targets: { node: 'current' } }]],
    }],
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(?:@otplib|@scure/base|@noble/hashes)/)',
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/index.ts',
    '!src/config/**',
  ],
};
