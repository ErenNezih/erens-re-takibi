import { prisma, getSettings } from "./db";
import { subDays } from "date-fns";
import {
  average,
  calculateCompliancePercentage,
  calculateNetCalories,
  calculateWeeklyWeightChange,
  getWeightFromLog,
  today,
} from "./utils";

export async function getDashboardData() {
  const settings = await getSettings();
  const todayDate = today();

  const [
    todayLog,
    recentLogs,
    recentMeasurements,
    todayWorkouts,
    activeSubstances,
    recentPlanItems,
    activePhase,
  ] = await Promise.all([
    prisma.dailyLog.findFirst({
      where: { date: todayDate },
    }),
    prisma.dailyLog.findMany({
      orderBy: { date: "desc" },
      take: 30,
    }),
    prisma.bodyMeasurement.findMany({
      orderBy: { date: "desc" },
      take: 30,
    }),
    prisma.workoutSession.findMany({
      where: { date: todayDate },
    }),
    prisma.substanceLog.findMany({
      where: { active: true },
    }),
    prisma.planItem.findMany({
      where: {
        date: {
          gte: subDays(todayDate, 7),
          lte: todayDate,
        },
      },
    }),
    prisma.phase.findFirst({
      where: { active: true },
    }),
  ]);

  const sortedLogsAsc = [...recentLogs].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const todayWeight = getWeightFromLog(
    todayLog?.morningWeight,
    todayLog?.eveningWeight
  );

  const startWeight = settings.startWeight;
  const totalChange =
    todayWeight != null && startWeight != null
      ? todayWeight - startWeight
      : null;

  const weeklyChange = calculateWeeklyWeightChange(sortedLogsAsc);

  const netCalories = calculateNetCalories(
    todayLog?.caloriesIn,
    todayLog?.activeCalories
  );

  const lastWaist = recentMeasurements.find((m) => m.waist != null)?.waist;
  const lastArm = recentMeasurements.find((m) => m.arm != null)?.arm;
  const lastShoulder = recentMeasurements.find((m) => m.shoulder != null)?.shoulder;

  const workoutDone =
    todayLog?.workoutDone ||
    todayWorkouts.some((w) => w.completed) ||
    false;

  const compliance = calculateCompliancePercentage(
    recentLogs.slice(0, 7),
    recentPlanItems,
    7
  );

  const chartLogs = sortedLogsAsc.slice(-14);
  const chartMeasurements = [...recentMeasurements]
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-14);

  return {
    settings,
    activePhase,
    stats: {
      todayWeight,
      startWeight,
      totalChange,
      weeklyChange,
      caloriesIn: todayLog?.caloriesIn ?? null,
      activeCalories: todayLog?.activeCalories ?? null,
      netCalories,
      steps: todayLog?.steps ?? null,
      lastWaist: lastWaist ?? null,
      lastArm: lastArm ?? null,
      lastShoulder: lastShoulder ?? null,
      workoutDone,
      cardioDone: todayLog?.cardioDone ?? false,
      substancesActive: activeSubstances.length,
      compliance,
      protein: todayLog?.protein ?? null,
    },
    charts: {
      weight: chartLogs.map((l) => ({
        date: l.date,
        weight: getWeightFromLog(l.morningWeight, l.eveningWeight),
        morning: l.morningWeight,
        evening: l.eveningWeight,
      })),
      waist: chartMeasurements
        .filter((m) => m.waist != null)
        .map((m) => ({ date: m.date, value: m.waist })),
      calories: chartLogs.map((l) => ({
        date: l.date,
        calories: l.caloriesIn,
        active: l.activeCalories,
        net: calculateNetCalories(l.caloriesIn, l.activeCalories),
      })),
      steps: chartLogs.map((l) => ({
        date: l.date,
        steps: l.steps,
      })),
      measurements: chartMeasurements.map((m) => ({
        date: m.date,
        waist: m.waist,
        arm: m.arm,
        shoulder: m.shoulder,
      })),
    },
  };
}

export async function getWeightStats() {
  const settings = await getSettings();
  const logs = await prisma.dailyLog.findMany({
    orderBy: { date: "asc" },
  });

  const weights = logs
    .map((l) => ({
      date: l.date,
      morning: l.morningWeight,
      evening: l.eveningWeight,
      avg: getWeightFromLog(l.morningWeight, l.eveningWeight),
    }))
    .filter((w) => w.avg != null);

  const allAvgs = weights.map((w) => w.avg!);
  const last7 = weights.slice(-7).map((w) => w.avg);
  const last30 = weights.slice(-30).map((w) => w.avg);

  const weeklyAvg = average(allAvgs.slice(-7));
  const avg7 = average(last7);
  const avg30 = average(last30);
  const min = allAvgs.length ? Math.min(...allAvgs) : null;
  const max = allAvgs.length ? Math.max(...allAvgs) : null;

  const totalChange =
    allAvgs.length && settings.startWeight != null
      ? allAvgs[allAvgs.length - 1] - settings.startWeight
      : null;

  const weeklyChange = calculateWeeklyWeightChange(logs);

  return {
    settings,
    weights,
    stats: {
      weeklyAvg,
      avg7,
      avg30,
      min,
      max,
      totalChange,
      weeklyChange,
      startWeight: settings.startWeight,
    },
  };
}
