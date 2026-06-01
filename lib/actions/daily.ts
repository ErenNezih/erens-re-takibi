"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { parseDateInput } from "@/lib/utils";

export async function upsertDailyLog(formData: FormData) {
  const date = parseDateInput(formData.get("date") as string);

  const data = {
    morningWeight: parseFloatOrNull(formData.get("morningWeight")),
    eveningWeight: parseFloatOrNull(formData.get("eveningWeight")),
    caloriesIn: parseIntOrNull(formData.get("caloriesIn")),
    protein: parseIntOrNull(formData.get("protein")),
    carbs: parseIntOrNull(formData.get("carbs")),
    fat: parseIntOrNull(formData.get("fat")),
    activeCalories: parseIntOrNull(formData.get("activeCalories")),
    steps: parseIntOrNull(formData.get("steps")),
    waterLiters: parseFloatOrNull(formData.get("waterLiters")),
    sleepHours: parseFloatOrNull(formData.get("sleepHours")),
    energyLevel: parseIntOrNull(formData.get("energyLevel")),
    hungerLevel: parseIntOrNull(formData.get("hungerLevel")),
    workoutDone: formData.get("workoutDone") === "on" || formData.get("workoutDone") === "true",
    cardioDone: formData.get("cardioDone") === "on" || formData.get("cardioDone") === "true",
    notes: (formData.get("notes") as string) || null,
  };

  await prisma.dailyLog.upsert({
    where: { date },
    create: { date, ...data },
    update: data,
  });

  revalidatePath("/daily");
  revalidatePath("/dashboard");
  revalidatePath("/weight");
  return { success: true };
}

export async function deleteDailyLog(id: string) {
  await prisma.dailyLog.delete({ where: { id } });
  revalidatePath("/daily");
  revalidatePath("/dashboard");
}

export async function copyPreviousDay(targetDate: string) {
  const target = parseDateInput(targetDate);
  const previous = new Date(target);
  previous.setDate(previous.getDate() - 1);

  const prevLog = await prisma.dailyLog.findFirst({
    where: { date: previous },
  });

  if (!prevLog) return { error: "Önceki gün kaydı bulunamadı" };

  const { id, date, createdAt, updatedAt, ...data } = prevLog;
  await prisma.dailyLog.upsert({
    where: { date: target },
    create: { date: target, ...data, morningWeight: null, eveningWeight: null },
    update: { ...data, morningWeight: null, eveningWeight: null },
  });

  revalidatePath("/daily");
  return { success: true };
}

function parseFloatOrNull(value: FormDataEntryValue | null): number | null {
  if (!value || value === "") return null;
  const n = parseFloat(value as string);
  return isNaN(n) ? null : n;
}

function parseIntOrNull(value: FormDataEntryValue | null): number | null {
  if (!value || value === "") return null;
  const n = parseInt(value as string, 10);
  return isNaN(n) ? null : n;
}

export async function getDailyLog(dateStr: string) {
  const date = parseDateInput(dateStr);
  return prisma.dailyLog.findFirst({ where: { date } });
}

export async function getDailyLogs(limit = 30) {
  return prisma.dailyLog.findMany({
    orderBy: { date: "desc" },
    take: limit,
  });
}
