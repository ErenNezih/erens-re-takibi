import { WorkoutPageClient } from "@/components/workout-page-client";
import { getWorkoutPageData } from "@/lib/actions/workout";

export default async function WorkoutPage() {
  const { template, activeSession, sessionHistory } = await getWorkoutPageData();

  return (
    <WorkoutPageClient
      template={template}
      activeSession={activeSession}
      sessionHistory={sessionHistory}
    />
  );
}
