import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { assertNotProduction } from "./setup-env";

test("connects to the test branch", async () => {
  const r = await db.execute(sql`select 1 as ok`);
  expect(r.rows[0]).toEqual({ ok: 1 });
});

test("guard rejects the production endpoint", () => {
  expect(() =>
    assertNotProduction(
      "postgres://u:p@ep-sweet-fog-ba5nxuf6-pooler.c-8.eu-central-1.aws.neon.tech/neondb",
    ),
  ).toThrow(/production/);
  expect(() =>
    assertNotProduction("postgres://u:p@ep-other-123.c-8.eu-central-1.aws.neon.tech/neondb"),
  ).not.toThrow();
});
