"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { parseDateInput, startOfDay } from "@/lib/date";
import {
  startWorkoutSession,
  completeWorkoutSession,
  getTodayTemplate,
  getActiveSession,
} from "@/lib/workout";

export async function createWorkoutTemplate(formData: FormData) {
  const template = await prisma.workoutTemplate.create({
    data: {
      name: formData.get("name") as string,
      weekday: parseInt(formData.get("weekday") as string, 10),
      active: formData.get("active") !== "off",
    },
  });
  revalidatePath("/plans");
  revalidatePath("/workout");
  return { success: true, id: template.id };
}

export async function addExerciseTemplate(formData: FormData) {
  const templateId = formData.get("workoutTemplateId") as string;
  const count = await prisma.workoutExerciseTemplate.count({
    where: { workoutTemplateId: templateId },
  });

  await prisma.workoutExerciseTemplate.create({
    data: {
      workoutTemplateId: templateId,
      name: formData.get("name") as string,
      sets: parseInt(formData.get("sets") as string, 10) || 3,
      targetReps: (formData.get("targetReps") as string) || null,
      note: (formData.get("note") as string) || null,
      order: count,
    },
  });

  revalidatePath("/plans");
  revalidatePath("/workout");
  return { success: true };
}

export async function deleteWorkoutTemplate(id: string) {
  await prisma.workoutTemplate.delete({ where: { id } });
  revalidatePath("/plans");
  revalidatePath("/workout");
  return { success: true };
}

export async function deleteExerciseTemplate(id: string) {
  await prisma.workoutExerciseTemplate.delete({ where: { id } });
  revalidatePath("/plans");
  revalidatePath("/workout");
  return { success: true };
}

export async function beginWorkout(dateStr?: string) {
  const date = dateStr ? parseDateInput(dateStr) : startOfDay(new Date());
  const template = await getTodayTemplate(date);
  const session = await startWorkoutSession(date, template?.id);
  revalidatePath("/workout");
  revalidatePath("/workout/start");
  return { sessionId: session.id };
}

export async function saveSetLog(
  sessionId: string,
  exerciseName: string,
  setNumber: number,
  weight: number | null,
  reps: number | null
) {
  const existing = await prisma.workoutSetLog.findFirst({
    where: { workoutSessionId: sessionId, exerciseName, setNumber },
  });

  if (existing) {
    await prisma.workoutSetLog.update({
      where: { id: existing.id },
      data: { weight, reps, completed: true },
    });
  } else {
    await prisma.workoutSetLog.create({
      data: {
        workoutSessionId: sessionId,
        exerciseName,
        setNumber,
        weight,
        reps,
        completed: true,
      },
    });
  }

  revalidatePath("/workout/start");
  return { success: true };
}

export async function finishWorkout(sessionId: string) {
  await completeWorkoutSession(sessionId);
  revalidatePath("/workout");
  revalidatePath("/workout/start");
  revalidatePath("/today");
  revalidatePath("/calendar");
  return { success: true };
}

export async function getWorkoutPageData(dateStr?: string) {
  const date = dateStr ? parseDateInput(dateStr) : startOfDay(new Date());
  const [template, activeSession, templates] = await Promise.all([
    getTodayTemplate(date),
    getActiveSession(date),
    prisma.workoutTemplate.findMany({
      include: { exercises: { orderBy: { order: "asc" } } },
      orderBy: { weekday: "asc" },
    }),
  ]);
  return { template, activeSession, templates, date: dateStr };
}
