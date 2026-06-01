"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { parseDateInput, toDateInputValue } from "@/lib/date";
import {
  getOrCreateDayLog,
  syncDayTasks,
  updateAggregateFlags,
  getApplicablePlans,
  getActiveTasksForDate,
  getDayPlanContext,
  computeDayCompletion,
  PLAN_TYPES,
} from "@/lib/tasks";
import { getTodayTemplate } from "@/lib/workout";

export async function saveDayLog(formData: FormData) {
  const date = parseDateInput(formData.get("date") as string);

  const data = {
    weight: parseFloatOrNull(formData.get("weight")),
    dietDone: formData.get("dietDone") === "on" || formData.get("dietDone") === "true",
    bloodworkPlanned:
      formData.get("bloodworkPlanned") === "on" ||
      formData.get("bloodworkPlanned") === "true",
    bloodworkDone:
      formData.get("bloodworkDone") === "on" ||
      formData.get("bloodworkDone") === "true",
    dietText: (formData.get("dietText") as string) || null,
    bloodworkNote: (formData.get("bloodworkNote") as string) || null,
    note: (formData.get("note") as string) || null,
    calories: parseIntOrNull(formData.get("calories")),
    protein: parseIntOrNull(formData.get("protein")),
    carbs: parseIntOrNull(formData.get("carbs")),
    fat: parseIntOrNull(formData.get("fat")),
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
  const tasks = await syncDayTasks(date);

  const [log, dietPlans, allPlans, workoutTemplate, completedSession] =
    await Promise.all([
      getOrCreateDayLog(date),
      getApplicablePlans(date, PLAN_TYPES.DIET),
      prisma.plan.findMany({
        select: {
          id: true,
          name: true,
          type: true,
          startDate: true,
          endDate: true,
          weekdays: true,
          active: true,
          repeatType: true,
        },
      }),
      getTodayTemplate(date),
      prisma.workoutSession.findFirst({
        where: { date, completed: true },
        select: { id: true, title: true },
      }),
    ]);

  const plansById = new Map(allPlans.map((p) => [p.id, p]));
  const activeTasks = getActiveTasksForDate(date, tasks, plansById);
  const activePlans = allPlans.filter((p) => p.active);
  const context = getDayPlanContext(date, activePlans, !!workoutTemplate);
  const status = computeDayCompletion(
    log,
    activeTasks,
    context,
    !!completedSession,
    date
  );

  const dietPlan = dietPlans[0];

  return {
    log,
    tasks: activeTasks,
    dietPlan,
    workoutTemplate,
    workoutCompleted: !!completedSession,
    completedSessionTitle: completedSession?.title ?? null,
    status,
    date: dateStr,
  };
}

function parseFloatOrNull(v: FormDataEntryValue | null): number | null {
  if (!v || v === "") return null;
  const n = parseFloat(v as string);
  return isNaN(n) ? null : n;
}

function parseIntOrNull(v: FormDataEntryValue | null): number | null {
  if (!v || v === "") return null;
  const n = parseInt(v as string, 10);
  return isNaN(n) ? null : n;
}

function toDateKey(date: Date): string {
  return toDateInputValue(date);
}
