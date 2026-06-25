import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";

import { defineConfig, env } from "prisma/config";

for (const path of [resolve(".env"), resolve("..", "..", ".env")]) {
  if (existsSync(path)) {
    config({ path, override: false, quiet: true });
  }
}

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
