const requiredEnvKeys = [
  "DATABASE_URL",
];

export function getEnv() {
  const env = {
    DATABASE_URL: process.env.DATABASE_URL || "",
    ADMIN_USERNAME: process.env.ADMIN_USERNAME || "",
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || "",
  };

  for (const key of requiredEnvKeys) {
    if (!env[key]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }

  return env;
}
