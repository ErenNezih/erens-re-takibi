import { prisma } from "./db";
import {
  getWeekdayNumber,
  parseWeekdays,
  startOfDay,
  toDateInputValue,
  today,
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

type PlanForDate = {
  startDate: Date;
  endDate: Date | null;
  weekdays: string;
  active: boolean;
  repeatType?: string | null;
  type?: string;
};

export function isPlanActiveForDate(plan: PlanForDate, date: Date): boolean {
  if (!plan.active) return false;
  const d = startOfDay(date);
  const start = startOfDay(plan.startDate);
  if (d < start) return false;
  if (plan.endDate && d > startOfDay(plan.endDate)) return false;

  if (plan.type === PLAN_TYPES.BLOODWORK && plan.repeatType === "once") {
    return toDateInputValue(d) === toDateInputValue(start);
  }

  const wd = getWeekdayNumber(d);
  return parseWeekdays(plan.weekdays).includes(wd);
}

/** @deprecated use isPlanActiveForDate */
export const isPlanApplicable = isPlanActiveForDate;

const TASK_PLAN_SELECT = {
  id: true,
  name: true,
  type: true,
  startDate: true,
  endDate: true,
  weekdays: true,
  active: true,
  repeatType: true,
  abbreviation: true,
  content: true,
} as const;

export interface DayPlanContext {
  hasDietPlan: boolean;
  hasWorkoutPlan: boolean;
  suppCount: number;
  cycleCount: number;
  bloodCount: number;
}

export function getDayPlanContext(
  date: Date,
  activePlans: PlanForDate[],
  hasWorkoutTemplate: boolean
): DayPlanContext {
  const applicable = activePlans.filter((p) => isPlanActiveForDate(p, date));
  return {
    hasDietPlan: applicable.some((p) => p.type === PLAN_TYPES.DIET),
    hasWorkoutPlan: hasWorkoutTemplate,
    suppCount: applicable.filter((p) => p.type === PLAN_TYPES.SUPPLEMENT).length,
    cycleCount: applicable.filter((p) => p.type === PLAN_TYPES.CYCLE).length,
    bloodCount: applicable.filter((p) => p.type === PLAN_TYPES.BLOODWORK).length,
  };
}

export interface DayStatus {
  hasWeight: boolean;
  dietDone: boolean;
  workoutDone: boolean;
  supplementsDone: boolean;
  cycleDone: boolean;
  bloodworkPlanned: boolean;
  bloodworkDone: boolean;
  hasPlannedDiet: boolean;
  hasPlannedWorkout: boolean;
  hasPlannedSupplements: boolean;
  hasPlannedCycle: boolean;
  allComplete: boolean;
  hasIncomplete: boolean;
  isNeutral: boolean;
}

export function getEffectiveWeight(log: {
  weight?: number | null;
  morningWeight?: number | null;
  eveningWeight?: number | null;
} | null): number | null {
  if (!log) return null;
  return log.weight ?? log.morningWeight ?? log.eveningWeight ?? null;
}

export function computeDayCompletion(
  log: {
    dietDone?: boolean;
    workoutDone?: boolean;
    weight?: number | null;
    morningWeight?: number | null;
    eveningWeight?: number | null;
    bloodworkPlanned?: boolean;
    bloodworkDone?: boolean;
  } | null,
  tasks: { type: string; completed: boolean }[],
  context: DayPlanContext,
  workoutSessionCompleted: boolean
): DayStatus {
  const suppTasks = tasks.filter((t) => t.type === PLAN_TYPES.SUPPLEMENT);
  const cycleTasks = tasks.filter((t) => t.type === PLAN_TYPES.CYCLE);
  const bloodTasks = tasks.filter((t) => t.type === PLAN_TYPES.BLOODWORK);

  const hasWeight = getEffectiveWeight(log) !== null;
  const dietDone = log?.dietDone ?? false;
  const workoutDone = log?.workoutDone ?? workoutSessionCompleted;
  const supplementsDone =
    context.suppCount === 0
      ? false
      : suppTasks.length > 0
        ? suppTasks.every((t) => t.completed)
        : false;
  const cycleDone =
    context.cycleCount === 0
      ? false
      : cycleTasks.length > 0
        ? cycleTasks.every((t) => t.completed)
        : false;
  const bloodworkPlanned = context.bloodCount > 0 || (log?.bloodworkPlanned ?? false);
  const bloodworkDone =
    context.bloodCount === 0
      ? false
      : bloodTasks.length > 0
        ? bloodTasks.every((t) => t.completed)
        : (log?.bloodworkDone ?? false);

  const checks: boolean[] = [];
  if (context.hasDietPlan) checks.push(dietDone);
  if (context.suppCount > 0) checks.push(suppTasks.every((t) => t.completed));
  if (context.cycleCount > 0) checks.push(cycleTasks.every((t) => t.completed));
  if (context.bloodCount > 0) checks.push(bloodTasks.every((t) => t.completed));
  if (context.hasWorkoutPlan) checks.push(workoutDone);

  const hasAnyPlan =
    context.hasDietPlan ||
    context.suppCount > 0 ||
    context.cycleCount > 0 ||
    context.bloodCount > 0 ||
    context.hasWorkoutPlan;

  const allComplete = hasAnyPlan && checks.length > 0 && checks.every(Boolean);
  const hasIncomplete = hasAnyPlan && checks.some((c) => !c);

  return {
    hasWeight,
    dietDone,
    workoutDone,
    supplementsDone,
    cycleDone,
    bloodworkPlanned,
    bloodworkDone,
    hasPlannedDiet: context.hasDietPlan,
    hasPlannedWorkout: context.hasWorkoutPlan,
    hasPlannedSupplements: context.suppCount > 0,
    hasPlannedCycle: context.cycleCount > 0,
    allComplete,
    hasIncomplete,
    isNeutral: !hasAnyPlan && !hasWeight,
  };
}

async function fetchActivePlans(type?: PlanType) {
  const where =
    type === PLAN_TYPES.DIET
      ? { active: true, type: PLAN_TYPES.DIET }
      : type
        ? { active: true, type }
        : { active: true, type: { notIn: [PLAN_TYPES.DIET, PLAN_TYPES.WORKOUT] } };

  return prisma.plan.findMany({
    where,
    select: TASK_PLAN_SELECT,
    orderBy: { name: "asc" },
  });
}

export async function getApplicablePlans(date: Date, type?: PlanType) {
  const plans = await prisma.plan.findMany({
    where: { active: true, ...(type ? { type } : {}) },
    orderBy: { name: "asc" },
  });
  return plans.filter((p) => isPlanActiveForDate(p, date));
}

async function upsertDayTasksForDate(
  date: Date,
  plans: Awaited<ReturnType<typeof fetchActivePlans>>
) {
  const d = startOfDay(date);
  const applicable = plans.filter((p) => isPlanActiveForDate(p, d));

  if (applicable.length === 0) {
    return prisma.dayTask.findMany({
      where: { date: d },
      include: { plan: { select: { id: true, name: true, abbreviation: true, content: true } } },
      orderBy: { title: "asc" },
    });
  }

  const existing = await prisma.dayTask.findMany({
    where: { date: d },
    select: { id: true, planId: true, title: true, type: true },
  });
  const existingByPlan = new Map(existing.map((t) => [t.planId, t]));

  const toUpsert = applicable.filter((plan) => {
    const ex = existingByPlan.get(plan.id);
    return !ex || ex.title !== plan.name || ex.type !== plan.type;
  });

  if (toUpsert.length > 0) {
    await prisma.$transaction(
      toUpsert.map((plan) =>
        prisma.dayTask.upsert({
          where: { planId_date: { planId: plan.id, date: d } },
          create: {
            date: d,
            planId: plan.id,
            title: plan.name,
            type: plan.type,
            completed: false,
          },
          update: { title: plan.name, type: plan.type },
        })
      )
    );
  }

  return prisma.dayTask.findMany({
    where: { date: d },
    include: { plan: { select: { id: true, name: true, abbreviation: true, content: true } } },
    orderBy: { title: "asc" },
  });
}

export async function syncDayTasks(date: Date) {
  const plans = await fetchActivePlans();
  return upsertDayTasksForDate(date, plans);
}

export async function syncMonthDayTasks(year: number, month: number) {
  const start = startOfDay(new Date(year, month - 1, 1));
  const end = startOfDay(new Date(year, month, 0));
  const plans = await fetchActivePlans();

  const daysInMonth = end.getDate();
  const dates: Date[] = [];
  for (let day = 1; day <= daysInMonth; day++) {
    dates.push(startOfDay(new Date(year, month - 1, day)));
  }

  const existingTasks = await prisma.dayTask.findMany({
    where: { date: { gte: start, lte: end } },
    select: { planId: true, date: true, title: true, type: true },
  });

  const existingKey = new Set(
    existingTasks.map((t) => `${t.planId}:${toDateInputValue(t.date)}`)
  );

  const toCreate: {
    date: Date;
    planId: string;
    title: string;
    type: string;
    completed: boolean;
  }[] = [];

  for (const d of dates) {
    for (const plan of plans) {
      if (!isPlanActiveForDate(plan, d)) continue;
      const key = `${plan.id}:${toDateInputValue(d)}`;
      if (!existingKey.has(key)) {
        toCreate.push({
          date: d,
          planId: plan.id,
          title: plan.name,
          type: plan.type,
          completed: false,
        });
        existingKey.add(key);
      }
    }
  }

  if (toCreate.length > 0) {
    await prisma.dayTask.createMany({ data: toCreate, skipDuplicates: true });
  }

  const toUpdate = existingTasks.filter((t) => {
    const plan = plans.find((p) => p.id === t.planId);
    return plan && (t.title !== plan.name || t.type !== plan.type);
  });

  if (toUpdate.length > 0) {
    await prisma.$transaction(
      toUpdate.map((t) => {
        const plan = plans.find((p) => p.id === t.planId)!;
        return prisma.dayTask.updateMany({
          where: { planId: t.planId, date: t.date },
          data: { title: plan.name, type: plan.type },
        });
      })
    );
  }
}

export async function getOrCreateDayLog(date: Date) {
  const d = startOfDay(date);
  let log = await prisma.dayLog.findUnique({ where: { date: d } });
  if (!log) {
    const dietPlans = await fetchActivePlans(PLAN_TYPES.DIET);
    const dietPlan = dietPlans.find((p) => isPlanActiveForDate(p, d));
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

export async function getDayStatus(date: Date): Promise<DayStatus> {
  const d = startOfDay(date);
  const weekday = getWeekdayNumber(d);

  const [log, tasks, session, allPlans, workoutTemplate] = await Promise.all([
    prisma.dayLog.findUnique({ where: { date: d } }),
    prisma.dayTask.findMany({ where: { date: d } }),
    prisma.workoutSession.findFirst({
      where: { date: d, completed: true },
      select: { id: true },
    }),
    prisma.plan.findMany({
      where: { active: true },
      select: TASK_PLAN_SELECT,
    }),
    prisma.workoutTemplate.findFirst({
      where: { weekday, active: true },
      select: { id: true },
    }),
  ]);

  const context = getDayPlanContext(d, allPlans, !!workoutTemplate);
  return computeDayCompletion(log, tasks, context, !!session);
}

export async function getMonthDayStatuses(year: number, month: number) {
  const start = startOfDay(new Date(year, month - 1, 1));
  const end = startOfDay(new Date(year, month, 0));

  const [logs, tasks, sessions, allPlans, workoutTemplates] = await Promise.all([
    prisma.dayLog.findMany({ where: { date: { gte: start, lte: end } } }),
    prisma.dayTask.findMany({ where: { date: { gte: start, lte: end } } }),
    prisma.workoutSession.findMany({
      where: { date: { gte: start, lte: end }, completed: true },
      select: { date: true },
    }),
    prisma.plan.findMany({
      where: { active: true },
      select: TASK_PLAN_SELECT,
    }),
    prisma.workoutTemplate.findMany({
      where: { active: true },
      select: { weekday: true },
    }),
  ]);

  const workoutWeekdays = new Set(workoutTemplates.map((t) => t.weekday));
  const statusMap = new Map<string, DayStatus>();
  const daysInMonth = end.getDate();
  const todayDate = today();

  for (let day = 1; day <= daysInMonth; day++) {
    const d = startOfDay(new Date(year, month - 1, day));
    const key = toDateInputValue(d);
    const log = logs.find((l) => toDateInputValue(l.date) === key) ?? null;
    const dayTasks = tasks.filter((t) => toDateInputValue(t.date) === key);
    const session = sessions.some((s) => toDateInputValue(s.date) === key);
    const wd = getWeekdayNumber(d);

    const context = getDayPlanContext(d, allPlans, workoutWeekdays.has(wd));
    const status = computeDayCompletion(log, dayTasks, context, session);

    if (d > todayDate) {
      status.hasIncomplete = false;
    }

    statusMap.set(key, status);
  }

  return statusMap;
}
