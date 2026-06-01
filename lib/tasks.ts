import { prisma } from "./db";
import {
  getWeekdayNumber,
  isFutureDate,
  isPastDate,
  isTodayDate,
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

export type CategoryState = "complete" | "incomplete" | "not_planned";

type PlanForDate = {
  id?: string;
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
  diet: CategoryState;
  workout: CategoryState;
  supplement: CategoryState;
  cycle: CategoryState;
  bloodwork: CategoryState;
  hasAnyPlan: boolean;
  isPast: boolean;
  isToday: boolean;
  isFuture: boolean;
}

export function getEffectiveWeight(log: {
  weight?: number | null;
  morningWeight?: number | null;
  eveningWeight?: number | null;
} | null): number | null {
  if (!log) return null;
  return log.weight ?? log.morningWeight ?? log.eveningWeight ?? null;
}

type TaskRow = { planId?: string; type: string; completed: boolean };

export function getActiveTasksForDate<T extends TaskRow>(
  date: Date,
  tasks: T[],
  plansById: Map<string, PlanForDate>
): T[] {
  const d = startOfDay(date);
  return tasks.filter((task) => {
    if (!task.planId) return false;
    const plan = plansById.get(task.planId);
    if (!plan) return false;
    return isPlanActiveForDate(plan, d);
  });
}

function categoryTasksComplete(
  plannedCount: number,
  typeTasks: { completed: boolean }[]
): boolean {
  if (plannedCount === 0) return false;
  return (
    typeTasks.length > 0 &&
    typeTasks.length === plannedCount &&
    typeTasks.every((t) => t.completed)
  );
}

function toCategoryState(planned: boolean, done: boolean): CategoryState {
  if (!planned) return "not_planned";
  return done ? "complete" : "incomplete";
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
  workoutSessionCompleted: boolean,
  date?: Date
): DayStatus {
  const suppTasks = tasks.filter((t) => t.type === PLAN_TYPES.SUPPLEMENT);
  const cycleTasks = tasks.filter((t) => t.type === PLAN_TYPES.CYCLE);
  const bloodTasks = tasks.filter((t) => t.type === PLAN_TYPES.BLOODWORK);

  const hasWeight = getEffectiveWeight(log) !== null;
  const dietDone = log?.dietDone ?? false;
  const workoutDone = log?.workoutDone ?? workoutSessionCompleted;
  const supplementsDone = categoryTasksComplete(context.suppCount, suppTasks);
  const cycleDone = categoryTasksComplete(context.cycleCount, cycleTasks);
  const bloodworkPlanned = context.bloodCount > 0 || (log?.bloodworkPlanned ?? false);
  const bloodworkDone =
    context.bloodCount === 0
      ? false
      : categoryTasksComplete(context.bloodCount, bloodTasks);

  const checks: boolean[] = [];
  if (context.hasDietPlan) checks.push(dietDone);
  if (context.suppCount > 0) checks.push(supplementsDone);
  if (context.cycleCount > 0) checks.push(cycleDone);
  if (context.bloodCount > 0) checks.push(bloodworkDone);
  if (context.hasWorkoutPlan) checks.push(workoutDone);

  const hasAnyPlan =
    context.hasDietPlan ||
    context.suppCount > 0 ||
    context.cycleCount > 0 ||
    context.bloodCount > 0 ||
    context.hasWorkoutPlan;

  let allComplete = hasAnyPlan && checks.length > 0 && checks.every(Boolean);
  let hasIncomplete = hasAnyPlan && checks.some((c) => !c);

  const d = date ? startOfDay(date) : today();
  const isPast = isPastDate(d);
  const isToday = isTodayDate(d);
  const isFuture = isFutureDate(d);

  if (isFuture) {
    hasIncomplete = false;
  }

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
    diet: toCategoryState(context.hasDietPlan, dietDone),
    workout: toCategoryState(context.hasWorkoutPlan, workoutDone),
    supplement: toCategoryState(context.suppCount > 0, supplementsDone),
    cycle: toCategoryState(context.cycleCount > 0, cycleDone),
    bloodwork: toCategoryState(context.bloodCount > 0, bloodworkDone),
    hasAnyPlan,
    isPast,
    isToday,
    isFuture,
  };
}

function buildPlansById(plans: PlanForDate[]): Map<string, PlanForDate> {
  return new Map(plans.filter((p) => p.id).map((p) => [p.id!, p]));
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

async function fetchAllPlansForTaskFilter() {
  return prisma.plan.findMany({ select: TASK_PLAN_SELECT });
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
    const allTasks = await prisma.dayTask.findMany({
      where: { date: d },
      include: { plan: { select: { id: true, name: true, abbreviation: true, content: true } } },
      orderBy: { title: "asc" },
    });
    const allPlans = await fetchAllPlansForTaskFilter();
    const plansById = buildPlansById(allPlans);
    return getActiveTasksForDate(d, allTasks, plansById);
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

  const allTasks = await prisma.dayTask.findMany({
    where: { date: d },
    include: { plan: { select: { id: true, name: true, abbreviation: true, content: true } } },
    orderBy: { title: "asc" },
  });
  const allPlans = await fetchAllPlansForTaskFilter();
  const plansById = buildPlansById(allPlans);
  return getActiveTasksForDate(d, allTasks, plansById);
}

export async function syncDayTasks(date: Date) {
  const plans = await fetchActivePlans();
  return upsertDayTasksForDate(date, plans);
}

export async function cleanupInvalidFutureDayTasks() {
  const now = today();
  const futureTasks = await prisma.dayTask.findMany({
    where: { date: { gt: now } },
    select: { id: true, planId: true, date: true },
  });

  if (futureTasks.length === 0) return { deleted: 0 };

  const plans = await fetchAllPlansForTaskFilter();
  const plansById = buildPlansById(plans);

  const toDelete = futureTasks.filter((task) => {
    const plan = plansById.get(task.planId);
    if (!plan) return true;
    return !isPlanActiveForDate(plan, task.date);
  });

  if (toDelete.length > 0) {
    await prisma.dayTask.deleteMany({
      where: { id: { in: toDelete.map((t) => t.id) } },
    });
  }

  return { deleted: toDelete.length };
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

  await cleanupInvalidFutureDayTasks();
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
  const [allTasks, allPlans, activePlans, workoutTemplate] = await Promise.all([
    prisma.dayTask.findMany({ where: { date: d } }),
    fetchAllPlansForTaskFilter(),
    prisma.plan.findMany({ where: { active: true }, select: TASK_PLAN_SELECT }),
    prisma.workoutTemplate.findFirst({
      where: { weekday: getWeekdayNumber(d), active: true },
      select: { id: true },
    }),
  ]);

  const plansById = buildPlansById(allPlans);
  const activeTasks = getActiveTasksForDate(d, allTasks, plansById);
  const context = getDayPlanContext(d, activePlans, !!workoutTemplate);

  const suppTasks = activeTasks.filter((t) => t.type === PLAN_TYPES.SUPPLEMENT);
  const cycleTasks = activeTasks.filter((t) => t.type === PLAN_TYPES.CYCLE);
  const bloodTasks = activeTasks.filter((t) => t.type === PLAN_TYPES.BLOODWORK);

  const supplementsDone =
    context.suppCount > 0 ? categoryTasksComplete(context.suppCount, suppTasks) : false;
  const cycleDone =
    context.cycleCount > 0 ? categoryTasksComplete(context.cycleCount, cycleTasks) : false;
  const bloodworkPlanned = context.bloodCount > 0;
  const bloodworkDone =
    context.bloodCount > 0
      ? categoryTasksComplete(context.bloodCount, bloodTasks)
      : false;

  await prisma.dayLog.upsert({
    where: { date: d },
    create: {
      date: d,
      supplementsDone,
      cycleDone,
      bloodworkPlanned,
      bloodworkDone,
    },
    update: {
      supplementsDone,
      cycleDone,
      bloodworkPlanned,
      bloodworkDone,
    },
  });
}

export async function recalculateAllDayLogAggregateFlags() {
  const logs = await prisma.dayLog.findMany({ select: { date: true } });
  for (const log of logs) {
    await updateAggregateFlags(log.date);
  }
}

export async function getDayStatus(date: Date): Promise<DayStatus> {
  const d = startOfDay(date);
  const weekday = getWeekdayNumber(d);

  const [log, tasks, session, activePlans, allPlans, workoutTemplate] =
    await Promise.all([
      prisma.dayLog.findUnique({ where: { date: d } }),
      prisma.dayTask.findMany({ where: { date: d } }),
      prisma.workoutSession.findFirst({
        where: { date: d, completed: true },
        select: { id: true },
      }),
      prisma.plan.findMany({ where: { active: true }, select: TASK_PLAN_SELECT }),
      fetchAllPlansForTaskFilter(),
      prisma.workoutTemplate.findFirst({
        where: { weekday, active: true },
        select: { id: true },
      }),
    ]);

  const plansById = buildPlansById(allPlans);
  const activeTasks = getActiveTasksForDate(d, tasks, plansById);
  const context = getDayPlanContext(d, activePlans, !!workoutTemplate);
  return computeDayCompletion(log, activeTasks, context, !!session, d);
}

export async function getMonthDayStatuses(year: number, month: number) {
  const start = startOfDay(new Date(year, month - 1, 1));
  const end = startOfDay(new Date(year, month, 0));

  const [logs, tasks, sessions, activePlans, allPlans, workoutTemplates] =
    await Promise.all([
      prisma.dayLog.findMany({ where: { date: { gte: start, lte: end } } }),
      prisma.dayTask.findMany({ where: { date: { gte: start, lte: end } } }),
      prisma.workoutSession.findMany({
        where: { date: { gte: start, lte: end }, completed: true },
        select: { date: true },
      }),
      prisma.plan.findMany({ where: { active: true }, select: TASK_PLAN_SELECT }),
      fetchAllPlansForTaskFilter(),
      prisma.workoutTemplate.findMany({
        where: { active: true },
        select: { weekday: true },
      }),
    ]);

  const plansById = buildPlansById(allPlans);
  const workoutWeekdays = new Set(workoutTemplates.map((t) => t.weekday));
  const statusMap = new Map<string, DayStatus>();
  const daysInMonth = end.getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const d = startOfDay(new Date(year, month - 1, day));
    const key = toDateInputValue(d);
    const log = logs.find((l) => toDateInputValue(l.date) === key) ?? null;
    const dayTasksRaw = tasks.filter((t) => toDateInputValue(t.date) === key);
    const activeTasks = getActiveTasksForDate(d, dayTasksRaw, plansById);
    const session = sessions.some((s) => toDateInputValue(s.date) === key);
    const wd = getWeekdayNumber(d);

    const context = getDayPlanContext(d, activePlans, workoutWeekdays.has(wd));
    const status = computeDayCompletion(log, activeTasks, context, session, d);
    statusMap.set(key, status);
  }

  return statusMap;
}
