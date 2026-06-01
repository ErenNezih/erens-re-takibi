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
      data: {
        startDate: new Date("2026-06-01"),
        calorieTargetMin: 1500,
        calorieTargetMax: 1800,
        proteinTarget: 150,
        carbTarget: 150,
        fatTarget: 50,
        waterTargetMin: 2.5,
        waterTargetMax: 3.5,
        stepTargetMin: 10000,
        stepTargetMax: 15000,
        theme: "dark",
      },
    });
  }
  return settings;
}
