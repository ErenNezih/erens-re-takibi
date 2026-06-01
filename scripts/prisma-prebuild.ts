import { execSync } from "child_process";
import { setupPrismaEnv } from "./setup-prisma-env";

setupPrismaEnv();

if (!process.env.DATABASE_URL) {
  console.error("ERROR: DATABASE_URL is not set.");
  process.exit(1);
}

if (!process.env.DIRECT_URL) {
  console.error(
    "ERROR: DIRECT_URL is not set. Add DIRECT_URL or DATABASE_URL_UNPOOLED in Vercel env."
  );
  process.exit(1);
}

execSync("npx prisma generate", { stdio: "inherit" });
execSync("npx prisma db push --skip-generate --accept-data-loss", { stdio: "inherit" });
