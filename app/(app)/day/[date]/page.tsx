import { Suspense } from "react";
import { DayDetailView } from "@/components/day-detail-view";
import { DayDetailSkeleton } from "@/components/day-detail-skeleton";
import { getDayData } from "@/lib/actions/day";
import { getActiveSeason, ensureSeasonFromSettings } from "@/lib/season";
import { isPastDate } from "@/lib/date";

interface DayDetailContentProps {
  date: string;
}

async function DayDetailContent({ date }: DayDetailContentProps) {
  await ensureSeasonFromSettings();
  const [data, season] = await Promise.all([getDayData(date), getActiveSeason()]);

  return (
    <DayDetailView
      date={date}
      log={data.log}
      tasks={data.tasks}
      dietPlan={data.dietPlan}
      workoutTemplate={data.workoutTemplate}
      workoutCompleted={data.workoutCompleted}
      completedSessionTitle={data.completedSessionTitle}
      seasonName={season?.name ?? null}
      isPastDay={isPastDate(date)}
    />
  );
}

interface DayPageProps {
  params: Promise<{ date: string }>;
}

export default async function DayPage({ params }: DayPageProps) {
  const { date } = await params;

  return (
    <Suspense fallback={<DayDetailSkeleton />}>
      <DayDetailContent date={date} />
    </Suspense>
  );
}
