import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export async function getSettings() {
  let settings = await prisma.userSetting.findFirst();
  if (!settings) {
    settings = await prisma.userSetting.create({
      data: { startDate: new Date("2026-06-01"), theme: "dark" },
    });
  }
  return settings;
}
