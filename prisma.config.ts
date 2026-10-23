import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Load the same local environment file used by Next.js
config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
