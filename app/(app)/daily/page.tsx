import { getDailyLog } from "@/lib/actions/daily";
import { toDateInputValue, today } from "@/lib/utils";
import { DailyPageClient } from "@/components/daily/daily-form";

interface DailyPageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function DailyPage({ searchParams }: DailyPageProps) {
  const params = await searchParams;
  const dateStr = params.date ?? toDateInputValue(today());
  const log = await getDailyLog(dateStr);

  return <DailyPageClient initialLog={log} initialDate={dateStr} />;
}
