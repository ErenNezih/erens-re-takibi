import { format } from "date-fns";
import { getPlanItems } from "@/lib/actions/calendar";
import { CalendarClient } from "@/components/calendar/calendar-client";

interface CalendarPageProps {
  searchParams: Promise<{ month?: string }>;
}

export default async function CalendarPage({ searchParams }: CalendarPageProps) {
  const params = await searchParams;
  const month = params.month ?? format(new Date(), "yyyy-MM");
  const items = await getPlanItems(month);

  return <CalendarClient items={items} month={month} />;
}
