import { prisma } from "./db";
import {
  getWeekdayNumber,
  parseWeekdays,
  startOfDay,
  toDateInputValue,
} from "./date";

export const PLAN_TYPES = {
  DIET: "DIET",
  SUPPLEMENT: "SUPPLEMENT",
  CYCLE: "CYCLE",
  BLOODWORK: "BLOODWORK",
  WORKOUT: "WORKOUT",
} as const;

export type PlanType = (typeof PLAN_TYPES)[keyof typeof PLAN_TYPES];

export const CYCLE_DISCLAIMER =
  "Bu bölüm yalnızca kişisel kayıt içindir. Uygulama tıbbi tavsiye, doz önerisi veya kullanım yönlendirmesi vermez. Sağlık kararları doktor kontrolünde verilmelidir.";

export function isPlanApplicable(
  plan: { startDate: Date; endDate: Date | null; weekdays: string; active: boolean },
  date: Date
): boolean {
  if (!plan.active) return false;
  const d = startOfDay(date);
  const start = startOfDay(plan.startDate);
  if (d < start) return false;
  if (plan.endDate && d > startOfDay(plan.endDate)) return false;
  const wd = getWeekdayNumber(d);
  return parseWeekdays(plan.weekdays).includes(wd);
}

export async function getApplicablePlans(date: Date, type?: PlanType) {
  const plans = await prisma.plan.findMany({
    where: { active: true, ...(type ? { type } : {}) },
    orderBy: { name: "asc" },
  });
  return plans.filter((p) => isPlanApplicable(p, date));
}

export async function syncDayTasks(date: Date) {
  const d = startOfDay(date);
  const plans = await getApplicablePlans(d);

  for (const plan of plans) {
    if (plan.type === PLAN_TYPES.DIET || plan.type === PLAN_TYPES.WORKOUT) continue;

    await prisma.dayTask.upsert({
      where: { planId_date: { planId: plan.id, date: d } },
      create: {
        date: d,
        planId: plan.id,
        title: plan.name,
        type: plan.type,
        completed: false,
      },
      update: { title: plan.name, type: plan.type },
    });
  }

  return prisma.dayTask.findMany({
    where: { date: d },
    include: { plan: true },
    orderBy: { title: "asc" },
  });
}

export async function getOrCreateDayLog(date: Date) {
  const d = startOfDay(date);
  let log = await prisma.dayLog.findUnique({ where: { date: d } });
  if (!log) {
    const dietPlan = (await getApplicablePlans(d, PLAN_TYPES.DIET))[0];
    log = await prisma.dayLog.create({
      data: {
        date: d,
        dietText: dietPlan?.content ?? null,
      },
    });
  }
  return log;
}

export async function updateAggregateFlags(date: Date) {
  const d = startOfDay(date);
  const tasks = await prisma.dayTask.findMany({ where: { date: d } });

  const allOfType = (type: string) => {
    const filtered = tasks.filter((t) => t.type === type);
    return filtered.length === 0 ? null : filtered.every((t) => t.completed);
  };

  const supplementsDone = allOfType(PLAN_TYPES.SUPPLEMENT);
  const cycleDone = allOfType(PLAN_TYPES.CYCLE);
  const bloodTasks = tasks.filter((t) => t.type === PLAN_TYPES.BLOODWORK);
  const bloodworkPlanned = bloodTasks.length > 0;
  const bloodworkDone =
    bloodTasks.length === 0 ? null : bloodTasks.every((t) => t.completed);

  await prisma.dayLog.upsert({
    where: { date: d },
    create: {
      date: d,
      supplementsDone: supplementsDone ?? false,
      cycleDone: cycleDone ?? false,
      bloodworkPlanned: bloodworkPlanned,
      bloodworkDone: bloodworkDone ?? false,
    },
    update: {
      ...(supplementsDone !== null && { supplementsDone }),
      ...(cycleDone !== null && { cycleDone }),
      bloodworkPlanned,
      ...(bloodworkDone !== null && { bloodworkDone }),
    },
  });
}

export interface DayStatus {
  hasWeight: boolean;
  dietDone: boolean;
  workoutDone: boolean;
  supplementsDone: boolean;
  cycleDone: boolean;
  bloodworkPlanned: boolean;
  bloodworkDone: boolean;
  allComplete: boolean;
}

export async function getDayStatus(date: Date): Promise<DayStatus> {
  const d = startOfDay(date);
  const [log, tasks, session] = await Promise.all([
    prisma.dayLog.findUnique({ where: { date: d } }),
    prisma.dayTask.findMany({ where: { date: d } }),
    prisma.workoutSession.findFirst({
      where: { date: d, completed: true },
    }),
  ]);

  const suppTasks = tasks.filter((t) => t.type === PLAN_TYPES.SUPPLEMENT);
  const cycleTasks = tasks.filter((t) => t.type === PLAN_TYPES.CYCLE);
  const bloodTasks = tasks.filter((t) => t.type === PLAN_TYPES.BLOODWORK);

  const hasWeight = !!(log?.morningWeight ?? log?.eveningWeight);
  const dietDone = log?.dietDone ?? false;
  const workoutDone = log?.workoutDone ?? session?.completed ?? false;
  const supplementsDone =
    suppTasks.length === 0 ? true : suppTasks.every((t) => t.completed);
  const cycleDone =
    cycleTasks.length === 0 ? true : cycleTasks.every((t) => t.completed);
  const bloodworkPlanned = bloodTasks.length > 0 || (log?.bloodworkPlanned ?? false);
  const bloodworkDone =
    bloodTasks.length === 0
      ? !(log?.bloodworkPlanned)
      : bloodTasks.every((t) => t.completed);

  const allComplete =
    hasWeight &&
    dietDone &&
    workoutDone &&
    supplementsDone &&
    cycleDone &&
    (!bloodworkPlanned || bloodworkDone);

  return {
    hasWeight,
    dietDone,
    workoutDone,
    supplementsDone,
    cycleDone,
    bloodworkPlanned,
    bloodworkDone,
    allComplete,
  };
}

export async function getMonthDayStatuses(year: number, month: number) {
  const start = startOfDay(new Date(year, month - 1, 1));
  const end = startOfDay(new Date(year, month, 0));

  const [logs, tasks, sessions] = await Promise.all([
    prisma.dayLog.findMany({
      where: { date: { gte: start, lte: end } },
    }),
    prisma.dayTask.findMany({
      where: { date: { gte: start, lte: end } },
    }),
    prisma.workoutSession.findMany({
      where: { date: { gte: start, lte: end }, completed: true },
    }),
  ]);

  const statusMap = new Map<string, DayStatus>();

  const daysInMonth = end.getDate();
  for (let day = 1; day <= daysInMonth; day++) {
    const d = startOfDay(new Date(year, month - 1, day));
    const key = toDateInputValue(d);
    const log = logs.find((l) => toDateInputValue(l.date) === key);
    const dayTasks = tasks.filter((t) => toDateInputValue(t.date) === key);
    const session = sessions.find((s) => toDateInputValue(s.date) === key);

    const suppTasks = dayTasks.filter((t) => t.type === PLAN_TYPES.SUPPLEMENT);
    const cycleTasks = dayTasks.filter((t) => t.type === PLAN_TYPES.CYCLE);
    const bloodTasks = dayTasks.filter((t) => t.type === PLAN_TYPES.BLOODWORK);

    statusMap.set(key, {
      hasWeight: !!(log?.morningWeight ?? log?.eveningWeight),
      dietDone: log?.dietDone ?? false,
      workoutDone: log?.workoutDone ?? session?.completed ?? false,
      supplementsDone:
        suppTasks.length === 0 ? false : suppTasks.every((t) => t.completed),
      cycleDone:
        cycleTasks.length === 0 ? false : cycleTasks.every((t) => t.completed),
      bloodworkPlanned: bloodTasks.length > 0 || (log?.bloodworkPlanned ?? false),
      bloodworkDone:
        bloodTasks.length > 0 && bloodTasks.every((t) => t.completed),
      allComplete: false,
    });
  }

  return statusMap;
}
