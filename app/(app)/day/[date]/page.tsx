import { DayDetailForm } from "@/components/day-detail-form";
import { getDayData } from "@/lib/actions/day";
import { syncDayTasks } from "@/lib/tasks";
import { parseDateInput } from "@/lib/date";

interface DayPageProps {
  params: Promise<{ date: string }>;
}

export default async function DayPage({ params }: DayPageProps) {
  const { date } = await params;
  await syncDayTasks(parseDateInput(date));
  const { log, tasks, dietPlan } = await getDayData(date);

  return (
    <DayDetailForm
      date={date}
      log={log}
      tasks={tasks}
      dietPlan={dietPlan}
    />
  );
}
