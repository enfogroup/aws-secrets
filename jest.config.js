const { pathsToModuleNameMapper } = require('ts-jest');
const { compilerOptions } = require('./tsconfig');

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, { prefix: compilerOptions.baseUrl }),
  modulePaths: [
    '<rootDir>'
  ],
  testPathIgnorePatterns: [
    '/node_modules/'
  ],
  testRegex: '(/tests/.*|(\\.|/)(test|spec))\\.[jt]sx?$',
  moduleFileExtensions: ['ts', 'js'],
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 100,
      functions: 100,
      lines: 100,
      statements: 100
    }
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/models/**/*.ts',
    '!src/**/index.ts'
  ],
  coverageReporters: [
    'lcov',
    'text'
  ],
  verbose: true
};
