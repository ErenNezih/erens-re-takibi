import { setupPrismaEnv } from "./setup-prisma-env";
import { execSync } from "child_process";

setupPrismaEnv();

execSync("npx prisma generate", { stdio: "inherit" });

const allowPush = process.env.ALLOW_DB_PUSH_ON_BUILD === "true";

if (allowPush) {
  if (!process.env.DATABASE_URL) {
    console.error("ERROR: DATABASE_URL is not set.");
    process.exit(1);
  }
  if (!process.env.DIRECT_URL) {
    console.error("ERROR: DIRECT_URL is not set.");
    process.exit(1);
  }
  console.log("ALLOW_DB_PUSH_ON_BUILD=true — running db push and seed...");
  execSync("npx prisma db push --skip-generate", { stdio: "inherit" });
  execSync("npx tsx prisma/seed.ts", { stdio: "inherit" });
} else {
  console.log(
    "Skipping db push/seed (set ALLOW_DB_PUSH_ON_BUILD=true to enable on build)."
  );
}
