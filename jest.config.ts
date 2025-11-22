import type { Config } from 'jest'
import nextJest from 'next/jest'

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig: Config = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testEnvironment: "jsdom",
  // Allow transforming specific ESM packages in node_modules (e.g., lodash-es)
  transformIgnorePatterns: [
    "/node_modules/(?!lodash-es/|nanoid/)",
  ],
  moduleNameMapper: {
    // Use CJS build in tests to avoid ESM parsing issues
    "^lodash-es$": "lodash",
  },
};

export default createJestConfig(customJestConfig);
