"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { parseDateInput } from "@/lib/utils";

export async function createWorkoutSession(formData: FormData) {
  const session = await prisma.workoutSession.create({
    data: {
      date: parseDateInput(formData.get("date") as string),
      title: formData.get("title") as string,
      bodyPart: formData.get("bodyPart") as string,
      completed: formData.get("completed") === "on" || formData.get("completed") === "true",
      notes: (formData.get("notes") as string) || null,
    },
  });
  revalidatePath("/workouts");
  revalidatePath("/dashboard");
  return { success: true, id: session.id };
}

export async function updateWorkoutSession(id: string, formData: FormData) {
  await prisma.workoutSession.update({
    where: { id },
    data: {
      date: parseDateInput(formData.get("date") as string),
      title: formData.get("title") as string,
      bodyPart: formData.get("bodyPart") as string,
      completed: formData.get("completed") === "on" || formData.get("completed") === "true",
      notes: (formData.get("notes") as string) || null,
    },
  });
  revalidatePath("/workouts");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteWorkoutSession(id: string) {
  await prisma.workoutSession.delete({ where: { id } });
  revalidatePath("/workouts");
  revalidatePath("/dashboard");
}

export async function toggleWorkoutComplete(id: string, completed: boolean) {
  await prisma.workoutSession.update({
    where: { id },
    data: { completed },
  });
  revalidatePath("/workouts");
  revalidatePath("/dashboard");
}

export async function createExercise(formData: FormData) {
  await prisma.workoutExercise.create({
    data: {
      workoutSessionId: formData.get("workoutSessionId") as string,
      exerciseName: formData.get("exerciseName") as string,
      sets: parseIntOrNull(formData.get("sets")),
      reps: parseIntOrNull(formData.get("reps")),
      weight: parseFloatOrNull(formData.get("weight")),
      rpe: parseIntOrNull(formData.get("rpe")),
      toFailure: formData.get("toFailure") === "on" || formData.get("toFailure") === "true",
      notes: (formData.get("notes") as string) || null,
    },
  });
  revalidatePath("/workouts");
  return { success: true };
}

export async function deleteExercise(id: string) {
  await prisma.workoutExercise.delete({ where: { id } });
  revalidatePath("/workouts");
}

export async function getWorkoutSessions() {
  return prisma.workoutSession.findMany({
    include: { exercises: true },
    orderBy: { date: "desc" },
  });
}

export async function getExerciseHistory(exerciseName: string) {
  return prisma.workoutExercise.findMany({
    where: { exerciseName },
    include: { workoutSession: true },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
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
