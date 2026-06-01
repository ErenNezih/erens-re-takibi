import { prisma } from "./db";

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
  if (data.settings?.length) {
    await prisma.userSetting.deleteMany();
    for (const s of data.settings as Record<string, unknown>[]) {
      const { id, createdAt, updatedAt, ...rest } = s;
      await prisma.userSetting.create({ data: rest as never });
    }
  }

  if (data.seasons?.length) {
    await prisma.season.deleteMany();
    for (const s of data.seasons as Record<string, unknown>[]) {
      const { id, createdAt, updatedAt, ...rest } = s;
      await prisma.season.create({ data: rest as never });
    }
  }

  if (data.plans?.length) {
    await prisma.plan.deleteMany();
    for (const p of data.plans as Record<string, unknown>[]) {
      const { id, createdAt, updatedAt, dayTasks, ...rest } = p;
      await prisma.plan.create({ data: rest as never });
    }
  }

  if (data.dayLogs?.length) {
    await prisma.dayLog.deleteMany();
    for (const l of data.dayLogs as Record<string, unknown>[]) {
      const { id, createdAt, updatedAt, ...rest } = l;
      await prisma.dayLog.create({ data: rest as never });
    }
  }

  if (data.dayTasks?.length) {
    await prisma.dayTask.deleteMany();
    for (const t of data.dayTasks as Record<string, unknown>[]) {
      const { id, createdAt, updatedAt, plan, ...rest } = t;
      await prisma.dayTask.create({ data: rest as never });
    }
  }

  if (data.workoutTemplates?.length) {
    await prisma.workoutExerciseTemplate.deleteMany();
    await prisma.workoutTemplate.deleteMany();
    for (const wt of data.workoutTemplates as Record<string, unknown>[]) {
      const { id, createdAt, updatedAt, exercises, sessions, ...rest } = wt;
      const created = await prisma.workoutTemplate.create({ data: rest as never });
      const exs = exercises as Record<string, unknown>[] | undefined;
      if (exs?.length) {
        for (const ex of exs) {
          const {
            id: eid,
            createdAt: ca,
            updatedAt: ua,
            workoutTemplateId,
            workoutTemplate,
            ...exRest
          } = ex;
          await prisma.workoutExerciseTemplate.create({
            data: { ...exRest, workoutTemplateId: created.id } as never,
          });
        }
      }
    }
  }

  if (data.workoutSessions?.length) {
    await prisma.workoutSetLog.deleteMany();
    await prisma.workoutSession.deleteMany();
    for (const s of data.workoutSessions as Record<string, unknown>[]) {
      const { id, createdAt, updatedAt, setLogs, workoutTemplate, ...rest } = s;
      await prisma.workoutSession.create({ data: rest as never });
    }
  }

  if (data.setLogs?.length) {
    for (const l of data.setLogs as Record<string, unknown>[]) {
      const { id, createdAt, updatedAt, workoutSession, ...rest } = l;
      await prisma.workoutSetLog.create({ data: rest as never });
    }
  }

  return { success: true };
}
