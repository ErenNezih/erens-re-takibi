import { prisma } from "./db";
import { startOfDay } from "./date";
import { normalizeActiveWorkoutTemplates } from "./normalize-workout-templates";
import {
  cleanupInvalidFutureDayTasks,
  recalculateAllDayLogAggregateFlags,
} from "./tasks";
import { calcSessionVolume } from "./workout";

/** Strip Prisma metadata and remap a foreign key through an id map. */
export function remapForeignKey(
  oldId: string | null | undefined,
  idMap: Map<string, string>
): string | null {
  if (!oldId) return null;
  return idMap.get(oldId) ?? null;
}

type RecordWithId = Record<string, unknown> & { id?: string };

function stripMeta<T extends RecordWithId>(row: T) {
  const { id, createdAt, updatedAt, ...rest } = row;
  return rest;
}

export async function exportAllData() {
  const [
    settings,
    seasons,
    dayLogs,
    plans,
    dayTasks,
    workoutTemplates,
    workoutSessions,
    setLogs,
  ] = await Promise.all([
    prisma.userSetting.findMany(),
    prisma.season.findMany({ orderBy: { startDate: "asc" } }),
    prisma.dayLog.findMany({ orderBy: { date: "asc" } }),
    prisma.plan.findMany({ orderBy: { startDate: "asc" } }),
    prisma.dayTask.findMany({ orderBy: { date: "asc" } }),
    prisma.workoutTemplate.findMany({
      include: { exercises: true },
      orderBy: { weekday: "asc" },
    }),
    prisma.workoutSession.findMany({ orderBy: { date: "asc" } }),
    prisma.workoutSetLog.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  return {
    version: 2,
    exportedAt: new Date().toISOString(),
    settings,
    seasons,
    dayLogs,
    plans,
    dayTasks,
    workoutTemplates,
    workoutSessions,
    setLogs,
  };
}

export async function backfillSessionVolumes() {
  const sessions = await prisma.workoutSession.findMany({
    where: { OR: [{ totalVolume: null }, { totalVolume: 0 }] },
    include: {
      setLogs: { where: { completed: true }, select: { weight: true, reps: true } },
    },
  });

  for (const s of sessions) {
    const vol = calcSessionVolume(s.setLogs);
    if (vol > 0) {
      await prisma.workoutSession.update({
        where: { id: s.id },
        data: { totalVolume: vol },
      });
    }
  }
}

export async function runImportPostProcessing() {
  await normalizeActiveWorkoutTemplates(prisma);
  await cleanupInvalidFutureDayTasks();
  await recalculateAllDayLogAggregateFlags();
  await backfillSessionVolumes();
}

export async function importAllData(data: {
  settings?: unknown[];
  seasons?: unknown[];
  dayLogs?: unknown[];
  plans?: unknown[];
  dayTasks?: unknown[];
  workoutTemplates?: unknown[];
  workoutSessions?: unknown[];
  setLogs?: unknown[];
}) {
  await prisma.$transaction(async (tx) => {
    await tx.workoutSetLog.deleteMany();
    await tx.workoutSession.deleteMany();
    await tx.workoutExerciseTemplate.deleteMany();
    await tx.workoutTemplate.deleteMany();
    await tx.dayTask.deleteMany();
    await tx.plan.deleteMany();
    await tx.dayLog.deleteMany();
    await tx.season.deleteMany();
    await tx.userSetting.deleteMany();

    const planIdMap = new Map<string, string>();
    const templateIdMap = new Map<string, string>();
    const sessionIdMap = new Map<string, string>();

    if (data.settings?.length) {
      for (const s of data.settings as RecordWithId[]) {
        await tx.userSetting.create({ data: stripMeta(s) as never });
      }
    }

    if (data.seasons?.length) {
      for (const s of data.seasons as RecordWithId[]) {
        await tx.season.create({ data: stripMeta(s) as never });
      }
    }

    if (data.dayLogs?.length) {
      for (const l of data.dayLogs as RecordWithId[]) {
        const row = stripMeta(l);
        await tx.dayLog.create({
          data: {
            ...row,
            date: startOfDay(new Date(row.date as string | Date)),
          } as never,
        });
      }
    }

    if (data.plans?.length) {
      for (const p of data.plans as RecordWithId[]) {
        const oldId = p.id as string;
        const { dayTasks: _dt, ...rest } = stripMeta(p);
        const created = await tx.plan.create({ data: rest as never });
        if (oldId) planIdMap.set(oldId, created.id);
      }
    }

    if (data.workoutTemplates?.length) {
      for (const wt of data.workoutTemplates as RecordWithId[]) {
        const oldId = wt.id as string;
        const exercises = wt.exercises as RecordWithId[] | undefined;
        const { exercises: _ex, sessions: _s, ...rest } = stripMeta(wt);
        const created = await tx.workoutTemplate.create({ data: rest as never });
        if (oldId) templateIdMap.set(oldId, created.id);

        if (exercises?.length) {
          for (const ex of exercises) {
            const {
              id: _eid,
              workoutTemplateId: _wtid,
              workoutTemplate: _wt,
              ...exRest
            } = stripMeta(ex);
            await tx.workoutExerciseTemplate.create({
              data: { ...exRest, workoutTemplateId: created.id } as never,
            });
          }
        }
      }
    }

    if (data.workoutSessions?.length) {
      for (const s of data.workoutSessions as RecordWithId[]) {
        const oldId = s.id as string;
        const { setLogs: _sl, workoutTemplate: _wt, ...rest } = stripMeta(s);
        const oldTemplateId = s.workoutTemplateId as string | null | undefined;
        const newTemplateId =
          oldTemplateId && templateIdMap.has(oldTemplateId)
            ? templateIdMap.get(oldTemplateId)!
            : null;

        const created = await tx.workoutSession.create({
          data: {
            ...rest,
            date: startOfDay(new Date(rest.date as string | Date)),
            workoutTemplateId: newTemplateId,
          } as never,
        });
        if (oldId) sessionIdMap.set(oldId, created.id);
      }
    }

    if (data.setLogs?.length) {
      for (const l of data.setLogs as RecordWithId[]) {
        const { workoutSession: _ws, ...rest } = stripMeta(l);
        const oldSessionId = l.workoutSessionId as string;
        const newSessionId = sessionIdMap.get(oldSessionId);
        if (!newSessionId) continue;
        await tx.workoutSetLog.create({
          data: { ...rest, workoutSessionId: newSessionId } as never,
        });
      }
    }

    if (data.dayTasks?.length) {
      for (const t of data.dayTasks as RecordWithId[]) {
        const { plan: _p, ...rest } = stripMeta(t);
        const oldPlanId = t.planId as string;
        const newPlanId = planIdMap.get(oldPlanId);
        if (!newPlanId) continue;
        await tx.dayTask.create({
          data: {
            ...rest,
            date: startOfDay(new Date(rest.date as string | Date)),
            planId: newPlanId,
          } as never,
        });
      }
    }
  });

  await runImportPostProcessing();

  return { success: true };
}
