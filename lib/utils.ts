import { format, startOfDay, subDays, differenceInDays } from "date-fns";
import { tr } from "date-fns/locale";

export function formatDate(date: Date | string): string {
  return format(new Date(date), "dd MMM yyyy", { locale: tr });
}

export function formatDateShort(date: Date | string): string {
  return format(new Date(date), "dd.MM.yyyy");
}

export function toDateInputValue(date: Date | string): string {
  return format(new Date(date), "yyyy-MM-dd");
}

export function parseDateInput(value: string): Date {
  const [year, month, day] = value.split("-").map(Number);
  return startOfDay(new Date(year, month - 1, day));
}

export function today(): Date {
  return startOfDay(new Date());
}

export function daysAgo(n: number): Date {
  return startOfDay(subDays(new Date(), n));
}

export function average(values: (number | null | undefined)[]): number | null {
  const valid = values.filter((v): v is number => v != null && !isNaN(v));
  if (valid.length === 0) return null;
  return valid.reduce((a, b) => a + b, 0) / valid.length;
}

export function round(value: number, decimals = 1): number {
  const factor = Math.pow(10, decimals);
  return Math.round(value * factor) / factor;
}

export function getWeightFromLog(
  morningWeight?: number | null,
  eveningWeight?: number | null
): number | null {
  if (morningWeight != null && eveningWeight != null) {
    return (morningWeight + eveningWeight) / 2;
  }
  return morningWeight ?? eveningWeight ?? null;
}

export interface DailyLogData {
  date: Date;
  morningWeight?: number | null;
  eveningWeight?: number | null;
  caloriesIn?: number | null;
  protein?: number | null;
  activeCalories?: number | null;
  steps?: number | null;
  workoutDone?: boolean;
  cardioDone?: boolean;
}

export interface SettingsData {
  startDate: Date;
  startWeight?: number | null;
  calorieTargetMin: number;
  calorieTargetMax: number;
  proteinTarget: number;
  stepTargetMin: number;
  stepTargetMax: number;
}

export function calculateNetCalories(
  caloriesIn?: number | null,
  activeCalories?: number | null
): number | null {
  if (caloriesIn == null && activeCalories == null) return null;
  return (caloriesIn ?? 0) - (activeCalories ?? 0);
}

export function calculateWeeklyWeightChange(
  logs: DailyLogData[],
  referenceDate: Date = new Date()
): number | null {
  const sorted = [...logs]
    .filter((l) => getWeightFromLog(l.morningWeight, l.eveningWeight) != null)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (sorted.length < 2) return null;

  const ref = startOfDay(referenceDate);
  const weekAgo = subDays(ref, 7);

  const recentLogs = sorted.filter((l) => {
    const d = startOfDay(new Date(l.date));
    return d <= ref && d >= weekAgo;
  });

  const olderLogs = sorted.filter((l) => {
    const d = startOfDay(new Date(l.date));
    return d < weekAgo && d >= subDays(weekAgo, 7);
  });

  const recentAvg = average(
    recentLogs.map((l) => getWeightFromLog(l.morningWeight, l.eveningWeight))
  );
  const olderAvg = average(
    olderLogs.map((l) => getWeightFromLog(l.morningWeight, l.eveningWeight))
  );

  if (recentAvg == null || olderAvg == null) {
    const first = getWeightFromLog(
      sorted[0].morningWeight,
      sorted[0].eveningWeight
    )!;
    const last = getWeightFromLog(
      sorted[sorted.length - 1].morningWeight,
      sorted[sorted.length - 1].eveningWeight
    )!;
    const days = differenceInDays(
      new Date(sorted[sorted.length - 1].date),
      new Date(sorted[0].date)
    );
    if (days === 0) return null;
    return round(((last - first) / days) * 7, 2);
  }

  return round(recentAvg - olderAvg, 2);
}

export function calculateCompliancePercentage(
  logs: DailyLogData[],
  planItems: { completed: boolean; date: Date }[],
  days = 7
): number {
  const ref = startOfDay(new Date());
  let totalChecks = 0;
  let passedChecks = 0;

  for (let i = 0; i < days; i++) {
    const day = subDays(ref, i);
    const dayStr = format(day, "yyyy-MM-dd");

    const log = logs.find(
      (l) => format(new Date(l.date), "yyyy-MM-dd") === dayStr
    );

    totalChecks += 4;

    if (log?.morningWeight != null || log?.eveningWeight != null)
      passedChecks++;
    if (log?.caloriesIn != null) passedChecks++;
    if (log?.steps != null) passedChecks++;
    if (log?.workoutDone || log?.cardioDone) passedChecks++;

    const dayPlans = planItems.filter(
      (p) => format(new Date(p.date), "yyyy-MM-dd") === dayStr
    );
    if (dayPlans.length > 0) {
      totalChecks += dayPlans.length;
      passedChecks += dayPlans.filter((p) => p.completed).length;
    }
  }

  if (totalChecks === 0) return 0;
  return Math.round((passedChecks / totalChecks) * 100);
}

export function getWeightTrend(
  logs: DailyLogData[],
  periodDays = 7
): "up" | "down" | "stable" | null {
  const sorted = [...logs]
    .filter((l) => getWeightFromLog(l.morningWeight, l.eveningWeight) != null)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, periodDays);

  if (sorted.length < 3) return null;

  const weights = sorted
    .map((l) => getWeightFromLog(l.morningWeight, l.eveningWeight)!)
    .reverse();

  const firstHalf = average(weights.slice(0, Math.floor(weights.length / 2)));
  const secondHalf = average(weights.slice(Math.floor(weights.length / 2)));

  if (firstHalf == null || secondHalf == null) return null;

  const diff = secondHalf - firstHalf;
  if (Math.abs(diff) < 0.2) return "stable";
  return diff > 0 ? "up" : "down";
}

export function exportToCSV(
  data: Record<string, unknown>[],
  filename: string
): void {
  if (data.length === 0) return;

  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers
      .map((h) => {
        const val = row[h];
        if (val == null) return "";
        const str = String(val);
        return str.includes(",") || str.includes('"')
          ? `"${str.replace(/"/g, '""')}"`
          : str;
      })
      .join(",")
  );

  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export function exportToJSON(data: unknown, filename: string): void {
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export const PLAN_TYPES = [
  { value: "workout", label: "Antrenman" },
  { value: "cardio", label: "Kardiyo" },
  { value: "measurement", label: "Ölçüm Günü" },
  { value: "photo", label: "Fotoğraf Günü" },
  { value: "supplement", label: "Takviye" },
  { value: "medication", label: "İlaç" },
  { value: "blood_test", label: "Kan Tahlili" },
  { value: "doctor", label: "Doktor Kontrolü" },
  { value: "note", label: "Serbest Not" },
] as const;

export const BODY_PARTS = [
  "Göğüs",
  "Sırt",
  "Omuz",
  "Kol",
  "Bacak",
  "Full Body",
  "Kardiyo",
] as const;

export const SUBSTANCE_CATEGORIES = [
  { value: "supplement", label: "Takviye" },
  { value: "medication", label: "İlaç" },
  { value: "hormone", label: "Hormon" },
  { value: "other", label: "Diğer" },
] as const;

export const PHOTO_TYPES = [
  { value: "front", label: "Ön" },
  { value: "back", label: "Arka" },
  { value: "side", label: "Yan" },
  { value: "free", label: "Serbest" },
] as const;

export const MEDICAL_DISCLAIMER =
  "Bu uygulama tıbbi tavsiye vermez. İlaç ve hormon kullanımı yalnızca doktor kontrolünde değerlendirilmelidir.";

export const SUBSTANCE_DISCLAIMER =
  "Bu kayıt sadece kişisel takip amaçlıdır. Uygulama tıbbi tavsiye, doz önerisi veya kullanım yönlendirmesi sağlamaz.";

export const COMMON_ABBREVIATIONS = [
  "P-Fazı",
  "E-Fazı",
  "C-Fazı",
  "HGH",
  "Proviron",
  "Arimidex",
  "Omega-3",
  "Magnezyum",
  "B12",
  "NAC",
  "L-Carnitine",
  "Whey",
  "Berberine",
  "ALA",
] as const;
