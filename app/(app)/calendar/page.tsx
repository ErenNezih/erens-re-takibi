import { CalendarMonthView } from "@/components/calendar-month-view";
import { SeasonBanner } from "@/components/season-banner";
import { getMonthDayStatuses, syncMonthDayTasks } from "@/lib/tasks";
import { getActiveSeason, ensureSeasonFromSettings } from "@/lib/season";

interface CalendarPageProps {
  searchParams: Promise<{ year?: string; month?: string }>;
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const params = await searchParams;
  const now = new Date();
  const year = parseInt(params.year ?? String(now.getFullYear()), 10);
  const month = parseInt(params.month ?? String(now.getMonth() + 1), 10);

  await Promise.all([syncMonthDayTasks(year, month), ensureSeasonFromSettings()]);
  const [statusMap, season] = await Promise.all([
    getMonthDayStatuses(year, month),
    getActiveSeason(),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Takvim</h1>
      <SeasonBanner season={season} />
      <CalendarMonthView year={year} month={month} statusMap={statusMap} />
    </div>
  );
}
