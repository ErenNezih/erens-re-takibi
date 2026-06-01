import { prisma } from "./db";
import { startOfDay, toDateInputValue, today, getWeekdayNumber } from "./date";
import {
  computeDayCompletion,
  getDayPlanContext,
  getEffectiveWeight,
  getActiveTasksForDate,
  PLAN_TYPES,
} from "./tasks";
import { calcSessionVolume, getSameTypeVolumeDelta, type CompletedSessionRow } from "./workout";
import { inferGroupFromName, WORKOUT_GROUPS, type WorkoutGroup } from "./workout-groups";
import type { Season } from "@prisma/client";

export interface ComplianceReport {
  totalDays: number;
  processedDays: number;
  skippedDays: number;
  dietCompletedDays: number;
  dietCompliancePct: number;
  workoutCompletedDays: number;
  workoutCompliancePct: number;
  supplementCompletedDays: number;
  supplementCompliancePct: number;
  cycleCompletedDays: number;
  cycleCompliancePct: number;
  overallCompliancePct: number;
}

export interface WeightReport {
  firstWeight: number | null;
  lastWeight: number | null;
  minWeight: number | null;
  maxWeight: number | null;
  totalChange: number | null;
  avgWeeklyChange: number | null;
  remainingToTarget: number | null;
  chartData: { dateKey: string; weight: number }[];
}

export interface WorkoutReport {
  totalWorkouts: number;
  totalSets: number;
  totalVolume: number;
  avgWorkoutVolume: number;
  bestWorkoutVolume: number;
  bestWorkoutDate: string | null;
  lastVolume: number;
  prevVolume: number;
  volumeDelta: number;
  pushVolume: number;
  pullVolume: number;
  legsVolume: number;
  otherVolume: number;
}

export interface GroupSummary {
  group: WorkoutGroup;
  workoutCount: number;
  totalSets: number;
  totalVolume: number;
  avgVolume: number;
  lastVolume: number;
  bestVolume: number;
  prevVolume: number;
  volumeDelta: number;
}

export type ProgressStatus = "Arttı" | "Sabit" | "Düştü";

export interface ExerciseProgressRow {
  name: string;
  firstPerf: string;
  lastPerf: string;
  change: string;
  status: ProgressStatus;
  sortKey: number;
}

export interface DailyLogRow {
  dateKey: string;
  weight: number | null;
  dietStatus: string;
  workoutStatus: string;
  supplementStatus: string;
  cycleStatus: string;
  overallStatus: string;
}

export interface MacroReport {
  avgCalories: number | null;
  avgProtein: number | null;
  targetCalories: number | null;
  targetProtein: number | null;
  daysLogged: number;
  macroCompliancePct: number;
}

export interface SeasonReport {
  season: Season;
  evalEnd: Date;
  compliance: ComplianceReport;
  weight: WeightReport;
  workout: WorkoutReport;
  macro: MacroReport;
  groupSummaries: GroupSummary[];
  topExercises: ExerciseProgressRow[];
  dailyLogs: DailyLogRow[];
}

function eachDayInRange(start: Date, end: Date): Date[] {
  const days: Date[] = [];
  const cur = startOfDay(start);
  const last = startOfDay(end);
  while (cur <= last) {
    days.push(new Date(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return days;
}

function getEvalEnd(season: { endDate: Date | null }): Date {
  const now = today();
  if (season.endDate) {
    const end = startOfDay(season.endDate);
    return end < now ? end : now;
  }
  return now;
}

function formatPerf(weight: number | null, reps: number | null): string {
  if (weight == null && reps == null) return "—";
  return `${weight ?? 0} kg x ${reps ?? 0}`;
}

function bestSet(logs: { weight: number | null; reps: number | null }[]) {
  return logs.reduce<(typeof logs)[0] | null>((best, log) => {
    if (!best) return log;
    const bw = best.weight ?? 0;
    const lw = log.weight ?? 0;
    if (lw > bw) return log;
    if (lw === bw && (log.reps ?? 0) > (best.reps ?? 0)) return log;
    return best;
  }, null);
}

function compareExerciseProgress(
  firstBest: { weight: number | null; reps: number | null },
  lastBest: { weight: number | null; reps: number | null },
  firstVol: number,
  lastVol: number
): { status: ProgressStatus; change: string; sortKey: number } {
  const fw = firstBest.weight ?? 0;
  const lw = lastBest.weight ?? 0;
  const fr = firstBest.reps ?? 0;
  const lr = lastBest.reps ?? 0;

  if (lw > fw) {
    return {
      status: "Arttı",
      change: `+${(lw - fw).toFixed(1)} kg`,
      sortKey: 3 + (lw - fw),
    };
  }
  if (lw === fw && lr > fr) {
    return {
      status: "Arttı",
      change: `+${lr - fr} tekrar`,
      sortKey: 2 + (lr - fr) / 100,
    };
  }
  if (lastVol > firstVol) {
    return {
      status: "Arttı",
      change: `+${Math.round(lastVol - firstVol)} vol`,
      sortKey: 1 + (lastVol - firstVol) / 1000,
    };
  }
  if (lw < fw || (lw === fw && lr < fr) || lastVol < firstVol) {
    return { status: "Düştü", change: "—", sortKey: 0 };
  }
  return { status: "Sabit", change: "—", sortKey: 0.5 };
}

function computeComplianceForDays(
  days: Date[],
  logsByDate: Map<string, NonNullable<Awaited<ReturnType<typeof prisma.dayLog.findFirst>>>>,
  tasksByDate: Map<string, { planId: string; type: string; completed: boolean }[]>,
  sessionsByDate: Map<string, boolean>,
  activePlans: Parameters<typeof getDayPlanContext>[1],
  plansById: Map<string, Parameters<typeof getDayPlanContext>[1][0] & { id: string }>,
  workoutWeekdays: Set<number>
): ComplianceReport {
  let dietNum = 0,
    dietDen = 0,
    workoutNum = 0,
    workoutDen = 0,
    suppNum = 0,
    suppDen = 0,
    cycleNum = 0,
    cycleDen = 0;
  let totalSlots = 0,
    completedSlots = 0;
  let processedDays = 0,
    skippedDays = 0;

  for (const d of days) {
    const key = toDateInputValue(d);
    const wd = getWeekdayNumber(d);
    const log = logsByDate.get(key) ?? null;
    const rawTasks = tasksByDate.get(key) ?? [];
    const tasks = getActiveTasksForDate(d, rawTasks, plansById);
    const sessionDone = sessionsByDate.get(key) ?? false;
    const context = getDayPlanContext(d, activePlans, workoutWeekdays.has(wd));
    const status = computeDayCompletion(log, tasks, context, sessionDone, d);

    const hasWeight = getEffectiveWeight(log) !== null;

    const daySlots: boolean[] = [];
    const dayCompleted: boolean[] = [];

    if (context.hasDietPlan) {
      daySlots.push(true);
      dayCompleted.push(status.dietDone);
      dietDen++;
      if (status.dietDone) dietNum++;
    }
    if (context.hasWorkoutPlan) {
      daySlots.push(true);
      dayCompleted.push(status.workoutDone);
      workoutDen++;
      if (status.workoutDone) workoutNum++;
    }
    if (context.suppCount > 0) {
      daySlots.push(true);
      dayCompleted.push(status.supplementsDone);
      suppDen++;
      if (status.supplementsDone) suppNum++;
    }
    if (context.cycleCount > 0) {
      daySlots.push(true);
      dayCompleted.push(status.cycleDone);
      cycleDen++;
      if (status.cycleDone) cycleNum++;
    }
    if (context.bloodCount > 0) {
      daySlots.push(true);
      dayCompleted.push(status.bloodworkDone);
    }

    totalSlots += daySlots.length;
    completedSlots += dayCompleted.filter(Boolean).length;

    const anyCompleted = dayCompleted.some(Boolean) || hasWeight;
    const hasAnyPlan = daySlots.length > 0;

    if (anyCompleted) processedDays++;
    else if (hasAnyPlan) skippedDays++;
  }

  const pct = (n: number, d: number) => (d === 0 ? 0 : Math.round((n / d) * 100));

  return {
    totalDays: days.length,
    processedDays,
    skippedDays,
    dietCompletedDays: dietNum,
    dietCompliancePct: pct(dietNum, dietDen),
    workoutCompletedDays: workoutNum,
    workoutCompliancePct: pct(workoutNum, workoutDen),
    supplementCompletedDays: suppNum,
    supplementCompliancePct: pct(suppNum, suppDen),
    cycleCompletedDays: cycleNum,
    cycleCompliancePct: pct(cycleNum, cycleDen),
    overallCompliancePct: pct(completedSlots, totalSlots),
  };
}

function computeMacroReport(
  logs: { calories: number | null; protein: number | null }[],
  dietPlans: { targetCalories: number | null; targetProtein: number | null }[]
): MacroReport {
  const withCalories = logs.filter((l) => l.calories != null);
  const withProtein = logs.filter((l) => l.protein != null);
  const avgCalories =
    withCalories.length > 0
      ? Math.round(
          withCalories.reduce((s, l) => s + (l.calories ?? 0), 0) / withCalories.length
        )
      : null;
  const avgProtein =
    withProtein.length > 0
      ? Math.round(
          withProtein.reduce((s, l) => s + (l.protein ?? 0), 0) / withProtein.length
        )
      : null;

  const dietPlan = dietPlans.find((p) => p.targetCalories != null || p.targetProtein != null);
  const targetCalories = dietPlan?.targetCalories ?? null;
  const targetProtein = dietPlan?.targetProtein ?? null;

  let macroHits = 0;
  let macroDen = 0;
  if (targetCalories != null) {
    for (const l of withCalories) {
      macroDen++;
      const diff = Math.abs((l.calories ?? 0) - targetCalories) / targetCalories;
      if (diff <= 0.1) macroHits++;
    }
  }

  return {
    avgCalories,
    avgProtein,
    targetCalories,
    targetProtein,
    daysLogged: withCalories.length,
    macroCompliancePct: macroDen === 0 ? 0 : Math.round((macroHits / macroDen) * 100),
  };
}

async function fetchSeasonCoreData(season: Season) {
  const start = startOfDay(season.startDate);
  const evalEnd = getEvalEnd(season);
  const days = eachDayInRange(start, evalEnd);

  const [logs, tasks, sessions, activePlans, allPlansForFilter, templates, dietPlans] =
    await Promise.all([
      prisma.dayLog.findMany({
        where: { date: { gte: start, lte: evalEnd } },
      }),
      prisma.dayTask.findMany({
        where: { date: { gte: start, lte: evalEnd } },
      }),
      prisma.workoutSession.findMany({
        where: { date: { gte: start, lte: evalEnd }, completed: true },
        include: {
          setLogs: { where: { completed: true } },
        },
        orderBy: { date: "asc" },
      }),
      prisma.plan.findMany({ where: { active: true } }),
      prisma.plan.findMany({
        select: {
          id: true,
          startDate: true,
          endDate: true,
          weekdays: true,
          active: true,
          repeatType: true,
          type: true,
        },
      }),
      prisma.workoutTemplate.findMany({ where: { active: true } }),
      prisma.plan.findMany({
        where: { type: PLAN_TYPES.DIET, active: true },
        select: { targetCalories: true, targetProtein: true },
      }),
    ]);

  const plansById = new Map(allPlansForFilter.map((p) => [p.id, p]));
  const logsByDate = new Map(logs.map((l) => [toDateInputValue(l.date), l]));
  const tasksByDate = new Map<
    string,
    { planId: string; type: string; completed: boolean }[]
  >();
  for (const t of tasks) {
    const key = toDateInputValue(t.date);
    if (!tasksByDate.has(key)) tasksByDate.set(key, []);
    tasksByDate.get(key)!.push(t);
  }
  const sessionsByDate = new Map(
    sessions.map((s) => [toDateInputValue(s.date), true])
  );
  const workoutWeekdays = new Set(templates.map((t) => t.weekday));

  const compliance = computeComplianceForDays(
    days,
    logsByDate,
    tasksByDate,
    sessionsByDate,
    activePlans,
    plansById,
    workoutWeekdays
  );

  const weights = logs
    .map((l) => ({ date: l.date, weight: getEffectiveWeight(l) }))
    .filter((w): w is { date: Date; weight: number } => w.weight !== null)
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  const firstWeight = weights[0]?.weight ?? season.startWeight ?? null;
  const lastWeight = weights[weights.length - 1]?.weight ?? season.endWeight ?? null;

  const macro = computeMacroReport(logs, dietPlans);

  return {
    start,
    evalEnd,
    days,
    logs,
    sessions,
    activePlans,
    plansById,
    logsByDate,
    tasksByDate,
    sessionsByDate,
    workoutWeekdays,
    compliance,
    firstWeight,
    lastWeight,
    weights,
    macro,
  };
}

export async function getSeasonReport(seasonId: string): Promise<SeasonReport | null> {
  const season = await prisma.season.findUnique({ where: { id: seasonId } });
  if (!season) return null;

  const core = await fetchSeasonCoreData(season);
  const {
    evalEnd,
    days,
    logs,
    sessions,
    activePlans,
    plansById,
    logsByDate,
    tasksByDate,
    sessionsByDate,
    workoutWeekdays,
    compliance,
    firstWeight,
    lastWeight,
    weights,
    macro,
  } = core;
  const weightValues = weights.map((w) => w.weight);
  const minWeight = weightValues.length ? Math.min(...weightValues) : null;
  const maxWeight = weightValues.length ? Math.max(...weightValues) : null;
  const totalChange =
    firstWeight != null && lastWeight != null ? lastWeight - firstWeight : null;
  const weekCount = Math.max(1, compliance.totalDays / 7);
  const avgWeeklyChange = totalChange != null ? totalChange / weekCount : null;
  const remainingToTarget =
    lastWeight != null && season.targetWeight != null
      ? lastWeight - season.targetWeight
      : null;

  const weightReport: WeightReport = {
    firstWeight,
    lastWeight,
    minWeight,
    maxWeight,
    totalChange,
    avgWeeklyChange,
    remainingToTarget,
    chartData: weights.slice(-30).map((w) => ({
      dateKey: toDateInputValue(w.date),
      weight: w.weight,
    })),
  };

  let totalSets = 0;
  let totalVolume = 0;
  const volumes: { dateKey: string; volume: number; group: WorkoutGroup }[] = [];
  const groupVolumes: Record<WorkoutGroup, number> = {
    PUSH: 0,
    PULL: 0,
    LEGS: 0,
    OTHER: 0,
  };

  for (const s of sessions) {
    const vol = s.totalVolume ?? calcSessionVolume(s.setLogs);
    totalVolume += vol;
    totalSets += s.setLogs.length;
    const group = (s.workoutGroup as WorkoutGroup) ?? inferGroupFromName(s.title);
    groupVolumes[group] = (groupVolumes[group] ?? 0) + vol;
    volumes.push({ dateKey: toDateInputValue(s.date), volume: vol, group });
  }

  const last = volumes[volumes.length - 1];
  const best = volumes.reduce(
    (max, v) => (v.volume > max.volume ? v : max),
    volumes[0] ?? { volume: 0, dateKey: "", group: WORKOUT_GROUPS.OTHER }
  );

  const sessionRows: CompletedSessionRow[] = sessions.map((s) => ({
    id: s.id,
    date: s.date,
    title: s.title,
    workoutGroup: s.workoutGroup,
    totalVolume: s.totalVolume ?? calcSessionVolume(s.setLogs),
    completed: true,
  }));

  const lastSession = sessionRows[sessionRows.length - 1];
  const sameTypeDelta = lastSession
    ? getSameTypeVolumeDelta(sessionRows, lastSession)
    : { prevVolume: null, delta: null };

  const workoutReport: WorkoutReport = {
    totalWorkouts: sessions.length,
    totalSets,
    totalVolume,
    avgWorkoutVolume: sessions.length ? totalVolume / sessions.length : 0,
    bestWorkoutVolume: best?.volume ?? 0,
    bestWorkoutDate: best?.dateKey ?? null,
    lastVolume: last?.volume ?? 0,
    prevVolume: sameTypeDelta.prevVolume ?? 0,
    volumeDelta: sameTypeDelta.delta ?? 0,
    pushVolume: groupVolumes.PUSH,
    pullVolume: groupVolumes.PULL,
    legsVolume: groupVolumes.LEGS,
    otherVolume: groupVolumes.OTHER,
  };

  const groupSummaries: GroupSummary[] = (
    [WORKOUT_GROUPS.PUSH, WORKOUT_GROUPS.PULL, WORKOUT_GROUPS.LEGS, WORKOUT_GROUPS.OTHER] as WorkoutGroup[]
  ).map((group) => {
    const groupSessions = sessions.filter(
      (s) =>
        ((s.workoutGroup as WorkoutGroup) ?? inferGroupFromName(s.title)) === group
    );
    const vols = groupSessions.map(
      (s) => s.totalVolume ?? calcSessionVolume(s.setLogs)
    );
    const sets = groupSessions.reduce((sum, s) => sum + s.setLogs.length, 0);
    const totalVol = vols.reduce((a, b) => a + b, 0);
    const groupRows = sessionRows.filter(
      (r) =>
        ((r.workoutGroup as WorkoutGroup) ?? inferGroupFromName(r.title)) === group
    );
    const lastGroupSession = groupRows[groupRows.length - 1];
    const groupDelta = lastGroupSession
      ? getSameTypeVolumeDelta(sessionRows, lastGroupSession)
      : { prevVolume: null, delta: null };
    return {
      group,
      workoutCount: groupSessions.length,
      totalSets: sets,
      totalVolume: totalVol,
      avgVolume: groupSessions.length ? totalVol / groupSessions.length : 0,
      lastVolume: vols[vols.length - 1] ?? 0,
      bestVolume: vols.length ? Math.max(...vols) : 0,
      prevVolume: groupDelta.prevVolume ?? 0,
      volumeDelta: groupDelta.delta ?? 0,
    };
  });

  const exerciseSessions = new Map<
    string,
    { date: Date; logs: { weight: number | null; reps: number | null }[] }[]
  >();

  for (const s of sessions) {
    const byName = new Map<string, typeof s.setLogs>();
    for (const log of s.setLogs) {
      if (!byName.has(log.exerciseName)) byName.set(log.exerciseName, []);
      byName.get(log.exerciseName)!.push(log);
    }
    for (const [name, logs] of byName) {
      if (!exerciseSessions.has(name)) exerciseSessions.set(name, []);
      exerciseSessions.get(name)!.push({
        date: s.date,
        logs: logs.map((l) => ({ weight: l.weight, reps: l.reps })),
      });
    }
  }

  const topExercises: ExerciseProgressRow[] = Array.from(exerciseSessions.entries())
    .map(([name, sess]) => {
      const sorted = [...sess].sort((a, b) => a.date.getTime() - b.date.getTime());
      const first = sorted[0];
      const last = sorted[sorted.length - 1];
      const firstBest = bestSet(first.logs);
      const lastBest = bestSet(last.logs);
      if (!firstBest || !lastBest) return null;
      const firstVol = calcSessionVolume(first.logs);
      const lastVol = calcSessionVolume(last.logs);
      const { status, change, sortKey } = compareExerciseProgress(
        firstBest,
        lastBest,
        firstVol,
        lastVol
      );
      return {
        name,
        firstPerf: formatPerf(firstBest.weight, firstBest.reps),
        lastPerf: formatPerf(lastBest.weight, lastBest.reps),
        change,
        status,
        sortKey,
      };
    })
    .filter((row): row is ExerciseProgressRow => row !== null)
    .sort((a, b) => {
      const statusOrder = { Arttı: 3, Sabit: 2, Düştü: 1 };
      const diff = statusOrder[b.status] - statusOrder[a.status];
      if (diff !== 0) return diff;
      return b.sortKey - a.sortKey;
    })
    .slice(0, 5);

  const dailyLogs: DailyLogRow[] = days.map((d) => {
    const key = toDateInputValue(d);
    const wd = getWeekdayNumber(d);
    const log = logsByDate.get(key) ?? null;
    const rawTasks = tasksByDate.get(key) ?? [];
    const dayTasks = getActiveTasksForDate(d, rawTasks, plansById);
    const sessionDone = sessionsByDate.get(key) ?? false;
    const context = getDayPlanContext(d, activePlans, workoutWeekdays.has(wd));
    const status = computeDayCompletion(log, dayTasks, context, sessionDone, d);

    const fmt = (planned: boolean, done: boolean) =>
      !planned ? "—" : done ? "Tamam" : "Eksik";

    return {
      dateKey: key,
      weight: getEffectiveWeight(log),
      dietStatus: fmt(context.hasDietPlan, status.dietDone),
      workoutStatus: fmt(context.hasWorkoutPlan, status.workoutDone),
      supplementStatus: fmt(context.suppCount > 0, status.supplementsDone),
      cycleStatus: fmt(context.cycleCount > 0, status.cycleDone),
      overallStatus: status.allComplete ? "Tamam" : status.isNeutral ? "—" : "Eksik",
    };
  });

  return {
    season,
    evalEnd,
    compliance,
    weight: weightReport,
    workout: workoutReport,
    macro,
    groupSummaries,
    topExercises,
    dailyLogs,
  };
}

export async function getSeasonListSummaryLight(
  seasonId: string
): Promise<SeasonListSummary | null> {
  const season = await prisma.season.findUnique({ where: { id: seasonId } });
  if (!season) return null;

  const core = await fetchSeasonCoreData(season);
  const totalChange =
    core.firstWeight != null && core.lastWeight != null
      ? core.lastWeight - core.firstWeight
      : null;

  return {
    id: season.id,
    compliancePct: core.compliance.overallCompliancePct,
    workoutCount: core.sessions.length,
    weightChange: totalChange,
    currentWeight: core.lastWeight,
  };
}

export async function getSeasonListSummariesLight(
  seasons: Season[]
): Promise<Map<string, SeasonListSummary>> {
  const map = new Map<string, SeasonListSummary>();
  await Promise.all(
    seasons.map(async (season) => {
      const summary = await getSeasonListSummaryLight(season.id);
      if (summary) map.set(season.id, summary);
    })
  );
  return map;
}

export interface SeasonListSummary {
  id: string;
  compliancePct: number;
  workoutCount: number;
  weightChange: number | null;
  currentWeight: number | null;
}

export async function getSeasonListSummaries(
  seasons: Season[]
): Promise<Map<string, SeasonListSummary>> {
  const map = new Map<string, SeasonListSummary>();

  await Promise.all(
    seasons.map(async (season) => {
      const report = await getSeasonReport(season.id);
      if (!report) return;
      map.set(season.id, {
        id: season.id,
        compliancePct: report.compliance.overallCompliancePct,
        workoutCount: report.workout.totalWorkouts,
        weightChange: report.weight.totalChange,
        currentWeight: report.weight.lastWeight,
      });
    })
  );

  return map;
}
