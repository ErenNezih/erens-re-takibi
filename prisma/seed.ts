import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const existingSettings = await prisma.userSetting.findFirst();
  if (existingSettings) {
    console.log("Settings already exist, skipping seed.");
    return;
  }

  await prisma.userSetting.create({
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

  const existingPhase = await prisma.phase.findFirst();
  if (!existingPhase) {
    await prisma.phase.create({
      data: {
        name: "Definasyon",
        startDate: new Date("2026-06-01"),
        goal: "Vücut yağ oranını düşürmek, kilo ve ölçü takibi yapmak, antrenaman ve beslenme disiplinini kayıt altına almak.",
        calorieTarget: 1650,
        stepTarget: 12000,
        active: true,
      },
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
