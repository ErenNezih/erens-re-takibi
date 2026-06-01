"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { parseDateInput } from "@/lib/utils";

export async function createPlanItem(formData: FormData) {
  await prisma.planItem.create({
    data: {
      title: formData.get("title") as string,
      type: formData.get("type") as string,
      date: parseDateInput(formData.get("date") as string),
      time: (formData.get("time") as string) || null,
      repeatType: (formData.get("repeatType") as string) || "once",
      description: (formData.get("description") as string) || null,
      completed: false,
    },
  });
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updatePlanItem(id: string, formData: FormData) {
  await prisma.planItem.update({
    where: { id },
    data: {
      title: formData.get("title") as string,
      type: formData.get("type") as string,
      date: parseDateInput(formData.get("date") as string),
      time: (formData.get("time") as string) || null,
      repeatType: (formData.get("repeatType") as string) || "once",
      description: (formData.get("description") as string) || null,
    },
  });
  revalidatePath("/calendar");
  return { success: true };
}

export async function togglePlanItem(id: string, completed: boolean) {
  await prisma.planItem.update({
    where: { id },
    data: { completed },
  });
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
}

export async function deletePlanItem(id: string) {
  await prisma.planItem.delete({ where: { id } });
  revalidatePath("/calendar");
  revalidatePath("/dashboard");
}

export async function getPlanItems(month?: string) {
  if (month) {
    const [year, m] = month.split("-").map(Number);
    const start = new Date(year, m - 1, 1);
    const end = new Date(year, m, 0, 23, 59, 59);
    return prisma.planItem.findMany({
      where: { date: { gte: start, lte: end } },
      orderBy: [{ date: "asc" }, { time: "asc" }],
    });
  }
  return prisma.planItem.findMany({
    orderBy: [{ date: "desc" }, { time: "asc" }],
    take: 100,
  });
}
