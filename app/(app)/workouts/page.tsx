import { getWorkoutSessions } from "@/lib/actions/workouts";
import { WorkoutsClient } from "@/components/workouts/workouts-client";

export default async function WorkoutsPage() {
  const sessions = await getWorkoutSessions();
  return <WorkoutsClient sessions={sessions} />;
}
