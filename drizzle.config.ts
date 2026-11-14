import { loadEnvConfig } from "@next/env";
import { defineConfig } from "drizzle-kit";

// Same env files as `next dev`: .env.development.local (the Neon dev branch)
// wins over the pulled .env.local. Variables already set in the shell win
// over both, which is how a one-off production migration is pointed elsewhere.
loadEnvConfig(process.cwd(), true);

const url = process.env.DATABASE_URL_UNPOOLED;
if (!url) throw new Error("DATABASE_URL_UNPOOLED is not set");

export default defineConfig({
  dialect: "postgresql",
  schema: "./lib/db/schema/index.ts",
  out: "./drizzle",
  dbCredentials: { url },
});
