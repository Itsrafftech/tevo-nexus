import { existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { config } from "dotenv";

const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const envPaths = [
  resolve(packageRoot, ".env"),
  resolve(packageRoot, "..", "..", ".env"),
];

for (const path of envPaths) {
  if (existsSync(path)) {
    config({ path, override: false, quiet: true });
  }
}

export function requireDatabaseUrl() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error(
      "DATABASE_URL belum dikonfigurasi. Salin .env.example ke .env atau packages/database/.env.",
    );
  }

  return connectionString;
}
