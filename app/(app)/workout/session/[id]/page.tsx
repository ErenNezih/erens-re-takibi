import { notFound } from "next/navigation";
import { WorkoutSessionDetailClient } from "@/components/workout-session-detail-client";
import { getWorkoutSessionDetail } from "@/lib/workout";

interface WorkoutSessionPageProps {
  params: Promise<{ id: string }>;
}

export default async function WorkoutSessionPage({ params }: WorkoutSessionPageProps) {
  const { id } = await params;
  const detail = await getWorkoutSessionDetail(id);
  if (!detail) notFound();

  return (
    <WorkoutSessionDetailClient
      date={detail.session.date}
      title={detail.session.title}
      workoutGroup={detail.session.workoutGroup}
      totalVolume={detail.totalVolume}
      prevVolume={detail.prevVolume}
      volumeDelta={detail.volumeDelta}
      exercises={detail.exercises}
    />
  );
}
