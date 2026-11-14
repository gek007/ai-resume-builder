import { Pool } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import * as schema from "./schema";

// The Neon Pool talks to Postgres over WebSockets (global in Node 22+), so
// transactions work, unlike the one-shot HTTP driver.
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const db = drizzle({ client: pool, schema });
