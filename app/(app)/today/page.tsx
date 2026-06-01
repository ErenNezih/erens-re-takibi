import { TodayChecklist } from "@/components/today-checklist";
import { getDayData } from "@/lib/actions/day";
import { getDayStatus, syncDayTasks } from "@/lib/tasks";
import { toDateInputValue, today } from "@/lib/date";

export default async function TodayPage() {
  const dateStr = toDateInputValue(today());
  await syncDayTasks(today());
  const [{ log, tasks }, status] = await Promise.all([
    getDayData(dateStr),
    getDayStatus(today()),
  ]);

  return (
    <TodayChecklist
      date={dateStr}
      log={log}
      tasks={tasks}
      status={status}
    />
  );
}
