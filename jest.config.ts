import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
	preset: "ts-jest",
	testEnvironment: "node",
	roots: ["<rootDir>/src"],
	testMatch: ["**/__tests__/**/*.test.ts"],
};

export default config;
