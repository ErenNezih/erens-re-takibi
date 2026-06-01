import { CalendarMonthView } from "@/components/calendar-month-view";
import { getMonthDayStatuses } from "@/lib/tasks";

interface CalendarPageProps {
  searchParams: Promise<{ year?: string; month?: string }>;
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const params = await searchParams;
  const now = new Date();
  const year = parseInt(params.year ?? String(now.getFullYear()), 10);
  const month = parseInt(params.month ?? String(now.getMonth() + 1), 10);

  const statusMap = await getMonthDayStatuses(year, month);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Takvim</h1>
      <CalendarMonthView year={year} month={month} statusMap={statusMap} />
    </div>
  );
}
