"use server";

import { prisma } from "@/lib/db";

export async function exportAllData() {
  const [
    settings,
    dailyLogs,
    measurements,
    meals,
    workouts,
    planItems,
    substances,
    phases,
    photos,
    notes,
  ] = await Promise.all([
    prisma.userSetting.findMany(),
    prisma.dailyLog.findMany({ orderBy: { date: "asc" } }),
    prisma.bodyMeasurement.findMany({ orderBy: { date: "asc" } }),
    prisma.mealLog.findMany({ orderBy: { date: "asc" } }),
    prisma.workoutSession.findMany({
      include: { exercises: true },
      orderBy: { date: "asc" },
    }),
    prisma.planItem.findMany({ orderBy: { date: "asc" } }),
    prisma.substanceLog.findMany({ orderBy: { startDate: "asc" } }),
    prisma.phase.findMany({ orderBy: { startDate: "asc" } }),
    prisma.progressPhoto.findMany({ orderBy: { date: "asc" } }),
    prisma.note.findMany({ orderBy: { date: "asc" } }),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    settings,
    dailyLogs,
    measurements,
    meals,
    workouts,
    planItems,
    substances,
    phases,
    photos,
    notes,
  };
}
