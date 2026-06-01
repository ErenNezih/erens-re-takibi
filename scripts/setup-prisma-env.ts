/**
 * Prisma schema requires DATABASE_URL and DIRECT_URL at generate time.
 * Neon/Vercel may only inject pooled/unpooled vars — map them here.
 */
import { config } from "dotenv";

config();

export function setupPrismaEnv(): void {
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL =
      process.env.POSTGRES_PRISMA_URL ||
      process.env.POSTGRES_URL ||
      "";
  }

  if (!process.env.DIRECT_URL) {
    process.env.DIRECT_URL =
      process.env.POSTGRES_URL_NON_POOLING ||
      process.env.DATABASE_URL_UNPOOLED ||
      process.env.DATABASE_URL ||
      "";
  }
}
