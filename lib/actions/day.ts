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
import { getTodayTemplate } from "@/lib/workout";

export async function saveDayLog(formData: FormData) {
  const date = parseDateInput(formData.get("date") as string);

  const data = {
    weight: parseFloatOrNull(formData.get("weight")),
    dietDone: formData.get("dietDone") === "on" || formData.get("dietDone") === "true",
    supplementsDone:
      formData.get("supplementsDone") === "on" ||
      formData.get("supplementsDone") === "true",
    cycleDone:
      formData.get("cycleDone") === "on" || formData.get("cycleDone") === "true",
    bloodworkPlanned:
      formData.get("bloodworkPlanned") === "on" ||
      formData.get("bloodworkPlanned") === "true",
    bloodworkDone:
      formData.get("bloodworkDone") === "on" ||
      formData.get("bloodworkDone") === "true",
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
  revalidatePath("/season");
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
  revalidatePath(`/day/${toDateKey(task.date)}`);
  return { success: true };
}

export async function getDayData(dateStr: string) {
  const date = parseDateInput(dateStr);
  await syncDayTasks(date);

  const [log, dietPlans, tasks, workoutTemplate, completedSession] =
    await Promise.all([
      getOrCreateDayLog(date),
      getApplicablePlans(date, PLAN_TYPES.DIET),
      prisma.dayTask.findMany({
        where: { date },
        include: {
          plan: { select: { id: true, name: true, abbreviation: true, content: true } },
        },
        orderBy: { title: "asc" },
      }),
      getTodayTemplate(date),
      prisma.workoutSession.findFirst({
        where: { date, completed: true },
        select: { id: true, title: true },
      }),
    ]);

  const dietPlan = dietPlans[0];

  return {
    log,
    tasks,
    dietPlan,
    workoutTemplate,
    workoutCompleted: !!completedSession,
    completedSessionTitle: completedSession?.title ?? null,
    date: dateStr,
  };
}

function parseFloatOrNull(v: FormDataEntryValue | null): number | null {
  if (!v || v === "") return null;
  const n = parseFloat(v as string);
  return isNaN(n) ? null : n;
}

function toDateKey(date: Date): string {
  return date.toISOString().split("T")[0];
}
