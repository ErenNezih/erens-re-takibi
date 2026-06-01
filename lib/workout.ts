import { prisma } from "./db";
import { getWeekdayNumber, startOfDay } from "./date";
import { inferGroupFromName, type WorkoutGroup } from "./workout-groups";
import { TRAINING_2026_PROGRAM } from "./seed-workout-program";
import { deactivateOtherTemplatesOnWeekday } from "./normalize-workout-templates";

export function calcSessionVolume(
  setLogs: { weight: number | null; reps: number | null }[]
): number {
  return setLogs.reduce((sum, s) => sum + (s.weight ?? 0) * (s.reps ?? 0), 0);
}

export type CompletedSessionRow = {
  id: string;
  date: Date;
  title: string;
  workoutGroup: string | null;
  totalVolume: number;
  completed: boolean;
};

export function resolveSessionGroup(
  session: { workoutGroup: string | null; title: string }
): WorkoutGroup {
  return (session.workoutGroup as WorkoutGroup) ?? inferGroupFromName(session.title);
}

export function getSessionVolume(session: {
  totalVolume: number | null;
  setLogs?: { weight: number | null; reps: number | null; completed?: boolean }[];
}): number {
  if (session.totalVolume != null && session.totalVolume > 0) {
    return session.totalVolume;
  }
  const logs = session.setLogs?.filter((s) => s.completed !== false) ?? [];
  return calcSessionVolume(logs);
}

export function getSameTypeVolumeDelta(
  sessions: CompletedSessionRow[],
  current: CompletedSessionRow
): { prevVolume: number | null; delta: number | null } {
  const group = resolveSessionGroup(current);
  const prev = sessions
    .filter(
      (s) =>
        s.id !== current.id &&
        s.completed &&
        s.date.getTime() < current.date.getTime() &&
        resolveSessionGroup(s) === group
    )
    .sort((a, b) => b.date.getTime() - a.date.getTime())[0];

  if (!prev) return { prevVolume: null, delta: null };
  const prevVolume = prev.totalVolume;
  return { prevVolume, delta: current.totalVolume - prevVolume };
}

export async function getTodayTemplate(date: Date = new Date()) {
  const weekday = getWeekdayNumber(startOfDay(date));

  const preferred = await prisma.workoutTemplate.findFirst({
    where: { weekday, active: true, programName: TRAINING_2026_PROGRAM },
    include: { exercises: { orderBy: { order: "asc" } } },
    orderBy: { updatedAt: "desc" },
  });
  if (preferred) return preferred;

  return prisma.workoutTemplate.findFirst({
    where: { weekday, active: true },
    include: { exercises: { orderBy: { order: "asc" } } },
    orderBy: { updatedAt: "desc" },
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

export async function getActiveProgramTemplates() {
  return prisma.workoutTemplate.findMany({
    where: { active: true, programName: TRAINING_2026_PROGRAM },
    include: { exercises: { orderBy: { order: "asc" } } },
    orderBy: { weekday: "asc" },
  });
}

export async function getInactiveTemplates() {
  return prisma.workoutTemplate.findMany({
    where: { active: false },
    include: { exercises: { orderBy: { order: "asc" } } },
    orderBy: [{ weekday: "asc" }, { name: "asc" }],
  });
}

export async function getCompletedSessionHistory(limit = 20) {
  const sessions = await prisma.workoutSession.findMany({
    where: { completed: true },
    include: {
      setLogs: { where: { completed: true }, select: { weight: true, reps: true } },
    },
    orderBy: { date: "desc" },
    take: limit,
  });

  const rows: CompletedSessionRow[] = sessions.map((s) => ({
    id: s.id,
    date: s.date,
    title: s.title,
    workoutGroup: s.workoutGroup,
    totalVolume: getSessionVolume(s),
    completed: s.completed,
  }));

  const allForDelta = await prisma.workoutSession.findMany({
    where: { completed: true },
    select: {
      id: true,
      date: true,
      title: true,
      workoutGroup: true,
      totalVolume: true,
      completed: true,
    },
    orderBy: { date: "asc" },
  });

  const allRows: CompletedSessionRow[] = allForDelta.map((s) => ({
    id: s.id,
    date: s.date,
    title: s.title,
    workoutGroup: s.workoutGroup,
    totalVolume: s.totalVolume ?? 0,
    completed: s.completed,
  }));

  return rows.map((row) => {
    const { prevVolume, delta } = getSameTypeVolumeDelta(allRows, row);
    return { ...row, prevVolume, volumeDelta: delta };
  });
}

export async function getWorkoutSessionDetail(sessionId: string) {
  const session = await prisma.workoutSession.findUnique({
    where: { id: sessionId },
    include: {
      setLogs: {
        where: { completed: true },
        orderBy: [{ exerciseName: "asc" }, { setNumber: "asc" }],
      },
    },
  });
  if (!session) return null;

  const totalVolume = getSessionVolume(session);

  const allCompleted = await prisma.workoutSession.findMany({
    where: { completed: true },
    select: {
      id: true,
      date: true,
      title: true,
      workoutGroup: true,
      totalVolume: true,
      completed: true,
    },
    orderBy: { date: "asc" },
  });

  const row: CompletedSessionRow = {
    id: session.id,
    date: session.date,
    title: session.title,
    workoutGroup: session.workoutGroup,
    totalVolume,
    completed: session.completed,
  };

  const allRows: CompletedSessionRow[] = allCompleted.map((s) => ({
    id: s.id,
    date: s.date,
    title: s.title,
    workoutGroup: s.workoutGroup,
    totalVolume: s.totalVolume ?? 0,
    completed: s.completed,
  }));

  const { prevVolume, delta } = getSameTypeVolumeDelta(allRows, row);

  const exerciseMap = new Map<
    string,
    { setNumber: number; weight: number | null; reps: number | null; volume: number }[]
  >();

  for (const log of session.setLogs) {
    if (!exerciseMap.has(log.exerciseName)) {
      exerciseMap.set(log.exerciseName, []);
    }
    const vol = (log.weight ?? 0) * (log.reps ?? 0);
    exerciseMap.get(log.exerciseName)!.push({
      setNumber: log.setNumber,
      weight: log.weight,
      reps: log.reps,
      volume: vol,
    });
  }

  const exercises = Array.from(exerciseMap.entries()).map(([name, sets]) => ({
    name,
    sets,
    totalVolume: sets.reduce((sum, s) => sum + s.volume, 0),
  }));

  return {
    session,
    totalVolume,
    prevVolume,
    volumeDelta: delta,
    exercises,
  };
}

export async function deactivateOthersOnWeekday(weekday: number, keepId: string) {
  await deactivateOtherTemplatesOnWeekday(prisma, weekday, keepId);
}
