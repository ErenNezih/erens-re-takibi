import { prisma } from "./db";
import { startOfDay, toDateInputValue, today } from "./date";
import { getEffectiveWeight } from "./tasks";
import { calcSessionVolume } from "./workout";

export const SEASON_TYPES = {
  DEFINITION: "DEFINITION",
  MAINTENANCE: "MAINTENANCE",
  BULK: "BULK",
  CLEAN_BULK: "CLEAN_BULK",
  MINI_CUT: "MINI_CUT",
  OTHER: "OTHER",
} as const;

export type SeasonType = (typeof SEASON_TYPES)[keyof typeof SEASON_TYPES];

export const SEASON_TYPE_LABELS: Record<SeasonType, string> = {
  DEFINITION: "Definasyon",
  MAINTENANCE: "Bakım",
  BULK: "Bulk",
  CLEAN_BULK: "Clean Bulk",
  MINI_CUT: "Mini Cut",
  OTHER: "Diğer",
};

export async function getActiveSeason() {
  return prisma.season.findFirst({
    where: { active: true },
    orderBy: { startDate: "desc" },
  });
}

export async function getSeasonHistory() {
  return prisma.season.findMany({
    where: { active: false },
    orderBy: { startDate: "desc" },
  });
}

export async function getSeasonWeightLogs(season: {
  startDate: Date;
  endDate: Date | null;
}) {
  const start = startOfDay(season.startDate);
  const end = season.endDate ? startOfDay(season.endDate) : today();

  const logs = await prisma.dayLog.findMany({
    where: { date: { gte: start, lte: end } },
    orderBy: { date: "asc" },
    select: { date: true, weight: true, morningWeight: true, eveningWeight: true },
  });

  return logs
    .map((l) => ({
      date: l.date,
      weight: getEffectiveWeight(l),
    }))
    .filter((l): l is { date: Date; weight: number } => l.weight !== null);
}

export async function getCurrentWeightForSeason(season: {
  startDate: Date;
  endDate: Date | null;
}) {
  const weights = await getSeasonWeightLogs(season);
  return weights.length > 0 ? weights[weights.length - 1].weight : null;
}

export function seasonDayCount(season: { startDate: Date; endDate?: Date | null }) {
  const start = startOfDay(season.startDate);
  const end = season.endDate ? startOfDay(season.endDate) : today();
  const diff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(1, diff + 1);
}

export async function getVolumeAnalytics(season: {
  startDate: Date;
  endDate: Date | null;
}) {
  const start = startOfDay(season.startDate);
  const end = season.endDate ? startOfDay(season.endDate) : today();

  const sessions = await prisma.workoutSession.findMany({
    where: {
      date: { gte: start, lte: end },
      completed: true,
    },
    orderBy: { date: "asc" },
    include: {
      setLogs: {
        where: { completed: true },
        select: { weight: true, reps: true, exerciseName: true },
      },
    },
  });

  const volumes = sessions.map((s) => ({
    date: s.date,
    dateKey: toDateInputValue(s.date),
    title: s.title,
    volume: s.totalVolume ?? calcSessionVolume(s.setLogs),
  }));

  const last = volumes[volumes.length - 1];
  const prev = volumes[volumes.length - 2];
  const best = volumes.reduce(
    (max, v) => (v.volume > max.volume ? v : max),
    volumes[0] ?? { volume: 0, date: new Date(), dateKey: "", title: "" }
  );

  const exerciseGrowth = computeTopExerciseGrowth(sessions);

  return {
    totalWorkouts: volumes.length,
    lastVolume: last?.volume ?? 0,
    prevVolume: prev?.volume ?? 0,
    volumeDelta: last && prev ? last.volume - prev.volume : 0,
    bestVolume: best?.volume ?? 0,
    bestVolumeDate: best?.dateKey ?? null,
    last10: volumes.slice(-10),
    topExercises: exerciseGrowth,
  };
}

function exerciseVolume(
  setLogs: { weight: number | null; reps: number | null }[]
): number {
  return calcSessionVolume(setLogs);
}

function computeTopExerciseGrowth(
  sessions: {
    setLogs: { weight: number | null; reps: number | null; exerciseName: string }[];
  }[]
) {
  const byExercise = new Map<string, number[]>();

  for (const session of sessions) {
    const byName = new Map<string, typeof session.setLogs>();
    for (const log of session.setLogs) {
      if (!byName.has(log.exerciseName)) byName.set(log.exerciseName, []);
      byName.get(log.exerciseName)!.push(log);
    }
    for (const [name, logs] of byName) {
      if (!byExercise.has(name)) byExercise.set(name, []);
      byExercise.get(name)!.push(exerciseVolume(logs));
    }
  }

  const growth = Array.from(byExercise.entries())
    .filter(([, vols]) => vols.length >= 2)
    .map(([name, vols]) => ({
      name,
      last: vols[vols.length - 1],
      prev: vols[vols.length - 2],
      delta: vols[vols.length - 1] - vols[vols.length - 2],
    }))
    .sort((a, b) => b.delta - a.delta)
    .slice(0, 3);

  return growth;
}

export async function ensureSeasonFromSettings() {
  const active = await getActiveSeason();
  if (active) return active;

  const settings = await prisma.userSetting.findFirst();
  if (!settings?.startWeight && !settings?.targetWeight) return null;

  return prisma.season.create({
    data: {
      name: "Definasyon Süreci",
      type: SEASON_TYPES.DEFINITION,
      startDate: settings.startDate,
      startWeight: settings.startWeight,
      targetWeight: settings.targetWeight,
      active: true,
    },
  });
}
