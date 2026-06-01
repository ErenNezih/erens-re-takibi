"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { parseDateInput } from "@/lib/date";
import { cleanupInvalidFutureDayTasks } from "@/lib/tasks";

function parseIntOrNull(v: FormDataEntryValue | null): number | null {
  if (!v || v === "") return null;
  const n = parseInt(v as string, 10);
  return isNaN(n) ? null : n;
}

export async function createPlan(formData: FormData) {
  const weekdays = formData.getAll("weekdays").map(String).join(",") || "1,2,3,4,5,6,7";

  await prisma.plan.create({
    data: {
      type: formData.get("type") as string,
      name: formData.get("name") as string,
      abbreviation: (formData.get("abbreviation") as string) || null,
      startDate: parseDateInput(formData.get("startDate") as string),
      endDate: formData.get("endDate")
        ? parseDateInput(formData.get("endDate") as string)
        : null,
      weekdays,
      content: (formData.get("content") as string) || null,
      targetCalories: parseIntOrNull(formData.get("targetCalories")),
      targetProtein: parseIntOrNull(formData.get("targetProtein")),
      targetCarbs: parseIntOrNull(formData.get("targetCarbs")),
      targetFat: parseIntOrNull(formData.get("targetFat")),
      active: formData.get("active") !== "off",
      doctorSupervised:
        formData.get("doctorSupervised") === "on" ||
        formData.get("doctorSupervised") === "true",
      repeatType: (formData.get("repeatType") as string) || null,
    },
  });

  revalidatePath("/plans");
  revalidatePath("/calendar");
  revalidatePath("/today");
  await cleanupInvalidFutureDayTasks();
  return { success: true };
}

export async function updatePlan(id: string, formData: FormData) {
  const weekdays = formData.getAll("weekdays").map(String).join(",") || "1,2,3,4,5,6,7";

  await prisma.plan.update({
    where: { id },
    data: {
      type: formData.get("type") as string,
      name: formData.get("name") as string,
      abbreviation: (formData.get("abbreviation") as string) || null,
      startDate: parseDateInput(formData.get("startDate") as string),
      endDate: formData.get("endDate")
        ? parseDateInput(formData.get("endDate") as string)
        : null,
      weekdays,
      content: (formData.get("content") as string) || null,
      targetCalories: parseIntOrNull(formData.get("targetCalories")),
      targetProtein: parseIntOrNull(formData.get("targetProtein")),
      targetCarbs: parseIntOrNull(formData.get("targetCarbs")),
      targetFat: parseIntOrNull(formData.get("targetFat")),
      active: formData.get("active") !== "off",
      doctorSupervised:
        formData.get("doctorSupervised") === "on" ||
        formData.get("doctorSupervised") === "true",
      repeatType: (formData.get("repeatType") as string) || null,
    },
  });

  revalidatePath("/plans");
  revalidatePath("/calendar");
  await cleanupInvalidFutureDayTasks();
  return { success: true };
}

export async function deletePlan(id: string) {
  await prisma.plan.delete({ where: { id } });
  revalidatePath("/plans");
  revalidatePath("/calendar");
  await cleanupInvalidFutureDayTasks();
  return { success: true };
}

export async function getPlans(type?: string) {
  return prisma.plan.findMany({
    where: type ? { type } : undefined,
    orderBy: { name: "asc" },
  });
}

export async function togglePlanActive(id: string, active: boolean) {
  await prisma.plan.update({ where: { id }, data: { active } });
  revalidatePath("/plans");
  revalidatePath("/calendar");
  await cleanupInvalidFutureDayTasks();
  return { success: true };
}
