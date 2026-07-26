function parsePostgresUrl(value, variableName) {
  let url;

  try {
    url = new URL(value);
  } catch {
    throw new Error(`${variableName} must be a valid PostgreSQL URL`);
  }

  if (url.protocol !== "postgresql:" && url.protocol !== "postgres:") {
    throw new Error(`${variableName} must be a valid PostgreSQL URL`);
  }

  return url;
}

function databaseIdentity(url, variableName) {
  let pathname;

  try {
    pathname = decodeURIComponent(url.pathname);
  } catch {
    throw new Error(`${variableName} must be a valid PostgreSQL URL`);
  }

  if (!url.hostname || pathname === "" || pathname === "/") {
    throw new Error(`${variableName} must be a valid PostgreSQL URL`);
  }

  const lowercaseHostname = url.hostname.toLowerCase();

  return {
    hostname: lowercaseHostname.endsWith(".")
      ? lowercaseHostname.slice(0, -1)
      : lowercaseHostname,
    port: url.port || "5432",
    pathname,
  };
}

export function resolveTestDatabaseEnv(env) {
  const databaseUrl = env.DATABASE_URL?.trim();
  const testDatabaseUrl = env.TEST_DATABASE_URL?.trim();

  if (!databaseUrl) {
    throw new Error("DATABASE_URL baseline is required");
  }

  if (!testDatabaseUrl) {
    throw new Error("TEST_DATABASE_URL is required");
  }

  if (env.TEST_DATABASE_GUARD !== "13log-test-only") {
    throw new Error("TEST_DATABASE_GUARD must equal 13log-test-only");
  }

  const normalUrl = parsePostgresUrl(databaseUrl, "DATABASE_URL");
  const testUrl = parsePostgresUrl(testDatabaseUrl, "TEST_DATABASE_URL");
  const normalIdentity = databaseIdentity(normalUrl, "DATABASE_URL");
  const testIdentity = databaseIdentity(testUrl, "TEST_DATABASE_URL");

  if (
    normalIdentity.hostname === testIdentity.hostname &&
    normalIdentity.port === testIdentity.port &&
    normalIdentity.pathname === testIdentity.pathname
  ) {
    throw new Error("TEST_DATABASE_URL must not match DATABASE_URL");
  }

  return testDatabaseUrl;
}
