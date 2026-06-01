import { TodayChecklist } from "@/components/today-checklist";
import { getDayData } from "@/lib/actions/day";
import { getDayStatus } from "@/lib/tasks";
import { toDateInputValue, today } from "@/lib/date";
import { getActiveSeason, ensureSeasonFromSettings } from "@/lib/season";

export default async function TodayPage() {
  const dateStr = toDateInputValue(today());
  await ensureSeasonFromSettings();

  const [data, status, season] = await Promise.all([
    getDayData(dateStr),
    getDayStatus(today()),
    getActiveSeason(),
  ]);

  return (
    <TodayChecklist
      date={dateStr}
      log={data.log}
      tasks={data.tasks}
      status={status}
      dietPlan={data.dietPlan}
      workoutTemplate={data.workoutTemplate}
      workoutCompleted={data.workoutCompleted}
      completedSessionTitle={data.completedSessionTitle}
      seasonName={season?.name ?? null}
    />
  );
}
