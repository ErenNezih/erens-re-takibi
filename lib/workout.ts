import { prisma } from "./db";
import { getWeekdayNumber, startOfDay } from "./date";
import { inferGroupFromName } from "./workout-groups";

export function calcSessionVolume(
  setLogs: { weight: number | null; reps: number | null }[]
): number {
  return setLogs.reduce((sum, s) => sum + (s.weight ?? 0) * (s.reps ?? 0), 0);
}

export async function getTodayTemplate(date: Date = new Date()) {
  const weekday = getWeekdayNumber(startOfDay(date));
  return prisma.workoutTemplate.findFirst({
    where: { weekday, active: true },
    include: { exercises: { orderBy: { order: "asc" } } },
  });
}

export async function getActiveSession(date: Date = new Date()) {
  const d = startOfDay(date);
  return prisma.workoutSession.findFirst({
    where: { date: d, completed: false },
    include: {
      setLogs: { orderBy: [{ exerciseName: "asc" }, { setNumber: "asc" }] },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function startWorkoutSession(date: Date, templateId?: string) {
  const d = startOfDay(date);
  const existing = await getActiveSession(d);
  if (existing) return existing;

  let title = "Antrenman";
  let workoutGroup: string | null = null;

  if (templateId) {
    const tpl = await prisma.workoutTemplate.findUnique({
      where: { id: templateId },
      include: { exercises: { orderBy: { order: "asc" } } },
    });
    if (tpl) {
      title = tpl.name;
      workoutGroup = tpl.workoutGroup ?? inferGroupFromName(tpl.name);
    }
  } else {
    const tpl = await getTodayTemplate(d);
    if (tpl) {
      templateId = tpl.id;
      title = tpl.name;
      workoutGroup = tpl.workoutGroup ?? inferGroupFromName(tpl.name);
    }
  }

  return prisma.workoutSession.create({
    data: {
      date: d,
      workoutTemplateId: templateId ?? null,
      title,
      workoutGroup,
      startedAt: new Date(),
      completed: false,
    },
  });
}

export async function completeWorkoutSession(sessionId: string) {
  const setLogs = await prisma.workoutSetLog.findMany({
    where: { workoutSessionId: sessionId, completed: true },
    select: { weight: true, reps: true },
  });
  const totalVolume = calcSessionVolume(setLogs);

  const session = await prisma.workoutSession.update({
    where: { id: sessionId },
    data: { completed: true, finishedAt: new Date(), totalVolume },
  });

  await prisma.dayLog.upsert({
    where: { date: session.date },
    create: { date: session.date, workoutDone: true },
    update: { workoutDone: true },
  });

  return session;
}

export async function logSet(
  sessionId: string,
  exerciseName: string,
  setNumber: number,
  weight: number | null,
  reps: number | null
) {
  return prisma.workoutSetLog
    .upsert({
      where: {
        id: (
          await prisma.workoutSetLog.findFirst({
            where: { workoutSessionId: sessionId, exerciseName, setNumber },
          })
        )?.id ?? "new",
      },
      create: {
        workoutSessionId: sessionId,
        exerciseName,
        setNumber,
        weight,
        reps,
        completed: true,
      },
      update: { weight, reps, completed: true },
    })
    .catch(async () => {
      return prisma.workoutSetLog.create({
        data: {
          workoutSessionId: sessionId,
          exerciseName,
          setNumber,
          weight,
          reps,
          completed: true,
        },
      });
    });
}

export async function getExerciseHistory(exerciseName: string, limit = 20) {
  const logs = await prisma.workoutSetLog.findMany({
    where: { exerciseName, completed: true },
    include: { workoutSession: true },
    orderBy: { createdAt: "desc" },
    take: limit * 4,
  });

  const bySession = new Map<
    string,
    { date: Date; sets: typeof logs; best: (typeof logs)[0] | null }
  >();

  for (const log of logs) {
    const sid = log.workoutSessionId;
    if (!bySession.has(sid)) {
      bySession.set(sid, { date: log.workoutSession.date, sets: [], best: null });
    }
    const entry = bySession.get(sid)!;
    entry.sets.push(log);
    if (
      !entry.best ||
      (log.weight ?? 0) > (entry.best.weight ?? 0) ||
      ((log.weight ?? 0) === (entry.best.weight ?? 0) &&
        (log.reps ?? 0) > (entry.best.reps ?? 0))
    ) {
      entry.best = log;
    }
  }

  return Array.from(bySession.values())
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, limit)
    .map((e) => ({
      date: e.date,
      bestSet: e.best,
      sets: e.sets.sort((a, b) => a.setNumber - b.setNumber),
    }));
}

export async function getAllTemplates() {
  return prisma.workoutTemplate.findMany({
    include: { exercises: { orderBy: { order: "asc" } } },
    orderBy: { weekday: "asc" },
  });
}
