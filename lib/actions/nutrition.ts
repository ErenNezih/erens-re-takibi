"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { parseDateInput } from "@/lib/utils";

export async function createMeal(formData: FormData) {
  await prisma.mealLog.create({
    data: {
      date: parseDateInput(formData.get("date") as string),
      mealName: formData.get("mealName") as string,
      time: (formData.get("time") as string) || null,
      foodName: formData.get("foodName") as string,
      amount: (formData.get("amount") as string) || null,
      calories: parseIntOrNull(formData.get("calories")),
      protein: parseIntOrNull(formData.get("protein")),
      carbs: parseIntOrNull(formData.get("carbs")),
      fat: parseIntOrNull(formData.get("fat")),
      notes: (formData.get("notes") as string) || null,
    },
  });
  revalidatePath("/nutrition");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteMeal(id: string) {
  await prisma.mealLog.delete({ where: { id } });
  revalidatePath("/nutrition");
  revalidatePath("/dashboard");
}

export async function getMeals(dateStr?: string) {
  if (dateStr) {
    const date = parseDateInput(dateStr);
    return prisma.mealLog.findMany({
      where: { date },
      orderBy: { time: "asc" },
    });
  }
  return prisma.mealLog.findMany({ orderBy: { date: "desc" }, take: 100 });
}

export async function getRecentFoods() {
  const meals = await prisma.mealLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { foodName: true, calories: true, protein: true, carbs: true, fat: true, amount: true },
  });
  const seen = new Set<string>();
  return meals.filter((m) => {
    if (seen.has(m.foodName)) return false;
    seen.add(m.foodName);
    return true;
  });
}

function parseIntOrNull(value: FormDataEntryValue | null): number | null {
  if (!value || value === "") return null;
  const n = parseInt(value as string, 10);
  return isNaN(n) ? null : n;
}
