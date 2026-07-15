import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
	testTimeout: 30000,
	preset: "ts-jest",
	testEnvironment: "node",
	coverageProvider: "v8",
	roots: ["<rootDir>/src"],
	testMatch: ["**/__tests__/unit/**/*.test.ts"],
};

export default config;
