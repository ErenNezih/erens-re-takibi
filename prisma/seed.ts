import { PrismaClient } from "@prisma/client";

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

  const templateCount = await prisma.workoutTemplate.count();
  if (templateCount === 0) {
    const push = await prisma.workoutTemplate.create({
      data: {
        name: "Push",
        weekday: 1,
        active: true,
        exercises: {
          create: [
            { name: "Chest Press", sets: 4, targetReps: "8-12", order: 0 },
            { name: "Lat Pulldown", sets: 4, targetReps: "10-12", order: 1 },
            { name: "Lateral Raise", sets: 3, targetReps: "12-15", order: 2 },
          ],
        },
      },
    });

    await prisma.workoutTemplate.createMany({
      data: [
        { name: "Pull", weekday: 2, active: true },
        { name: "Legs", weekday: 3, active: true },
        { name: "Upper", weekday: 5, active: true },
        { name: "Lower", weekday: 6, active: true },
      ],
    });

    console.log("Created workout template:", push.name);
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
