module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '@helpers/(.*)$': '<rootDir>/src/helpers/$1',
    '@aws/(.*)$': '<rootDir>/src/aws/$1',
    '@test/(.*)$': '<rootDir>/test/$1'
  },
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
    '!src/models/**/*.ts'
  ],
  coverageReporters: [
    'lcov',
    'text'
  ],
  verbose: true
};
