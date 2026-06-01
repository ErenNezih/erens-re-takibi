"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { parseDateInput } from "@/lib/date";
import {
  getOrCreateDayLog,
  syncDayTasks,
  updateAggregateFlags,
  getApplicablePlans,
  PLAN_TYPES,
} from "@/lib/tasks";

export async function saveDayLog(formData: FormData) {
  const date = parseDateInput(formData.get("date") as string);

  const data = {
    morningWeight: parseFloatOrNull(formData.get("morningWeight")),
    eveningWeight: parseFloatOrNull(formData.get("eveningWeight")),
    dietDone: formData.get("dietDone") === "on" || formData.get("dietDone") === "true",
    workoutDone: formData.get("workoutDone") === "on" || formData.get("workoutDone") === "true",
    supplementsDone: formData.get("supplementsDone") === "on" || formData.get("supplementsDone") === "true",
    cycleDone: formData.get("cycleDone") === "on" || formData.get("cycleDone") === "true",
    bloodworkPlanned: formData.get("bloodworkPlanned") === "on" || formData.get("bloodworkPlanned") === "true",
    bloodworkDone: formData.get("bloodworkDone") === "on" || formData.get("bloodworkDone") === "true",
    dietText: (formData.get("dietText") as string) || null,
    bloodworkNote: (formData.get("bloodworkNote") as string) || null,
    note: (formData.get("note") as string) || null,
  };

  await prisma.dayLog.upsert({
    where: { date },
    create: { date, ...data },
    update: data,
  });

  revalidatePath("/calendar");
  revalidatePath("/today");
  revalidatePath(`/day/${formData.get("date")}`);
  return { success: true };
}

export async function toggleDayTask(taskId: string, completed: boolean) {
  const task = await prisma.dayTask.update({
    where: { id: taskId },
    data: { completed },
  });
  await updateAggregateFlags(task.date);
  revalidatePath("/calendar");
  revalidatePath("/today");
  revalidatePath(`/day/${task.date.toISOString().split("T")[0]}`);
  return { success: true };
}

export async function getDayData(dateStr: string) {
  const date = parseDateInput(dateStr);
  await syncDayTasks(date);
  const log = await getOrCreateDayLog(date);
  const dietPlan = (await getApplicablePlans(date, PLAN_TYPES.DIET))[0];
  const tasks = await prisma.dayTask.findMany({
    where: { date },
    include: { plan: true },
    orderBy: { title: "asc" },
  });

  return { log, tasks, dietPlan, date: dateStr };
}

function parseFloatOrNull(v: FormDataEntryValue | null): number | null {
  if (!v || v === "") return null;
  const n = parseFloat(v as string);
  return isNaN(n) ? null : n;
}
