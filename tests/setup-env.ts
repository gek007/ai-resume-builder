import { loadEnvConfig } from "@next/env";

// The production Neon branch's compute endpoint. Tests must never touch it.
const PRODUCTION_ENDPOINT_ID = "ep-sweet-fog-ba5nxuf6";

export function assertNotProduction(url: string | undefined): void {
  if (url && new URL(url).host.includes(PRODUCTION_ENDPOINT_ID)) {
    throw new Error("Refusing to run against the production branch");
  }
}

// Loads .env.test.local (NODE_ENV is "test" under Vitest).
loadEnvConfig(process.cwd(), false, { info: () => {}, error: console.error });

assertNotProduction(process.env.DATABASE_URL);
assertNotProduction(process.env.DATABASE_URL_UNPOOLED);
