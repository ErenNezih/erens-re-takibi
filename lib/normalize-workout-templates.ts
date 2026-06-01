import type { PrismaClient } from "@prisma/client";
import {
  TRAINING_2026_PROGRAM,
  TEMPLATE_DEFS,
  type TemplateDef,
} from "./seed-workout-program";

function exercisesMatch(
  existing: { name: string; sets: number; targetReps: string | null; note: string | null; order: number }[],
  expected: TemplateDef["exercises"]
): boolean {
  if (existing.length !== expected.length) return false;
  const sorted = [...existing].sort((a, b) => a.order - b.order);
  return sorted.every((ex, i) => {
    const exp = expected[i];
    return (
      ex.name === exp.name &&
      ex.sets === exp.sets &&
      (ex.targetReps ?? "") === exp.targetReps &&
      (ex.note ?? "") === exp.note
    );
  });
}

export async function syncTemplateExercises(
  prisma: PrismaClient,
  templateId: string,
  exercises: TemplateDef["exercises"]
) {
  await prisma.workoutExerciseTemplate.deleteMany({
    where: { workoutTemplateId: templateId },
  });
  await prisma.workoutExerciseTemplate.createMany({
    data: exercises.map((ex, order) => ({
      workoutTemplateId: templateId,
      name: ex.name,
      sets: ex.sets,
      targetReps: ex.targetReps,
      note: ex.note,
      order,
    })),
  });
}

export async function ensureTraining2026Template(
  prisma: PrismaClient,
  def: TemplateDef
): Promise<string> {
  let template = await prisma.workoutTemplate.findFirst({
    where: {
      weekday: def.weekday,
      programName: TRAINING_2026_PROGRAM,
      name: def.name,
    },
    include: { exercises: { orderBy: { order: "asc" } } },
  });

  if (!template) {
    template = await prisma.workoutTemplate.findFirst({
      where: { weekday: def.weekday, name: def.name },
      include: { exercises: { orderBy: { order: "asc" } } },
    });
  }

  if (!template) {
    const created = await prisma.workoutTemplate.create({
      data: {
        name: def.name,
        weekday: def.weekday,
        workoutGroup: def.workoutGroup,
        programName: TRAINING_2026_PROGRAM,
        active: true,
        exercises: {
          create: def.exercises.map((ex, order) => ({
            name: ex.name,
            sets: ex.sets,
            targetReps: ex.targetReps,
            note: ex.note,
            order,
          })),
        },
      },
    });
    return created.id;
  }

  await prisma.workoutTemplate.update({
    where: { id: template.id },
    data: {
      name: def.name,
      workoutGroup: def.workoutGroup,
      programName: TRAINING_2026_PROGRAM,
      active: true,
    },
  });

  if (!exercisesMatch(template.exercises, def.exercises)) {
    await syncTemplateExercises(prisma, template.id, def.exercises);
  }

  return template.id;
}

export async function deactivateOtherTemplatesOnWeekday(
  prisma: PrismaClient,
  weekday: number,
  keepId: string
) {
  await prisma.workoutTemplate.updateMany({
    where: { weekday, id: { not: keepId }, active: true },
    data: { active: false },
  });
}

export async function normalizeActiveWorkoutTemplates(prisma: PrismaClient) {
  for (const def of TEMPLATE_DEFS) {
    const keepId = await ensureTraining2026Template(prisma, def);
    await deactivateOtherTemplatesOnWeekday(prisma, def.weekday, keepId);
  }

  await prisma.workoutTemplate.updateMany({
    where: { weekday: 7, active: true },
    data: { active: false },
  });

  for (const def of TEMPLATE_DEFS) {
    const keepId = await prisma.workoutTemplate.findFirst({
      where: {
        weekday: def.weekday,
        programName: TRAINING_2026_PROGRAM,
        name: def.name,
      },
      select: { id: true },
    });
    if (keepId) {
      await prisma.workoutTemplate.update({
        where: { id: keepId.id },
        data: { active: true },
      });
    }
  }
}
