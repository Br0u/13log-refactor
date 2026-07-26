import { resolveTestDatabaseEnv } from "../../scripts/lib/test-database-guard.mjs";

const testDatabaseUrl = resolveTestDatabaseEnv(process.env);

process.env.DATABASE_URL = testDatabaseUrl;
process.env.DIRECT_URL = testDatabaseUrl;
