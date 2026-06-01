import { PrismaClient } from "@prisma/client";
import { seedTraining2026Program } from "../lib/seed-workout-program";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding FitCycle database...");

  const existing = await prisma.userSetting.findFirst();
  if (!existing) {
    await prisma.userSetting.create({
      data: {
        startDate: new Date("2026-06-01"),
        theme: "dark",
      },
    });
  }

  const activeSeason = await prisma.season.findFirst({ where: { active: true } });
  if (!activeSeason) {
    const settings = await prisma.userSetting.findFirst();
    if (settings?.startWeight || settings?.targetWeight) {
      await prisma.season.create({
        data: {
          name: "Definasyon Süreci",
          type: "DEFINITION",
          startDate: settings.startDate,
          startWeight: settings.startWeight,
          targetWeight: settings.targetWeight,
          active: true,
        },
      });
    }
  }

  await prisma.$executeRaw`
    UPDATE "DayLog"
    SET weight = COALESCE(weight, "morningWeight", "eveningWeight")
    WHERE weight IS NULL AND ("morningWeight" IS NOT NULL OR "eveningWeight" IS NOT NULL)
  `.catch(() => {
    console.log("Weight backfill skipped (column may not exist yet)");
  });

  await prisma.$executeRaw`
    UPDATE "WorkoutSession" SET "totalVolume" = 0 WHERE "totalVolume" IS NULL
  `.catch(() => {});

  await seedTraining2026Program(prisma);

  const planCount = await prisma.plan.count();
  if (planCount === 0) {
    await prisma.plan.createMany({
      data: [
        {
          type: "DIET",
          name: "Definasyon diyeti",
          startDate: new Date("2026-06-01"),
          weekdays: "1,2,3,4,5,6,7",
          content:
            "350 g yağsız et\n100 g yulaf\n2 ölçek whey\n100 g yoğurt\nyeşillik",
          active: true,
        },
        {
          type: "SUPPLEMENT",
          name: "Whey",
          startDate: new Date("2026-06-01"),
          weekdays: "1,2,3,4,5,6,7",
          active: true,
        },
        {
          type: "SUPPLEMENT",
          name: "Omega-3",
          startDate: new Date("2026-06-01"),
          weekdays: "1,2,3,4,5,6,7",
          active: true,
        },
        {
          type: "SUPPLEMENT",
          name: "Magnezyum",
          startDate: new Date("2026-06-01"),
          weekdays: "1,2,3,4,5,6,7",
          active: true,
        },
      ],
    });
  }

  console.log("Seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
