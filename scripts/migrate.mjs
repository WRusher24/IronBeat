import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { migrate } from "drizzle-orm/neon-http/migrator";
import { existsSync, readFileSync } from "node:fs";

// Load .env.local / .env when running locally (Vercel injects variables itself).
for (const file of [".env.local", ".env"]) {
  if (!existsSync(file)) continue;
  for (const line of readFileSync(file, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*"?([^"\n]*)"?\s*$/);
    if (match && !(match[1] in process.env)) process.env[match[1]] = match[2];
  }
}

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set – cannot run migrations.");
  process.exit(1);
}

await migrate(drizzle(neon(url)), { migrationsFolder: "./drizzle" });
console.log("Database migrations applied.");
