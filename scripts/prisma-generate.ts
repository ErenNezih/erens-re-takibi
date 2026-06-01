import { execSync } from "child_process";
import { setupPrismaEnv } from "./setup-prisma-env";

setupPrismaEnv();
execSync("npx prisma generate", { stdio: "inherit", env: process.env });
