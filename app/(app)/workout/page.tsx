import { WorkoutPageClient } from "@/components/workout-page-client";
import { getWorkoutPageData } from "@/lib/actions/workout";
import { getExerciseHistory } from "@/lib/workout";
import { prisma } from "@/lib/db";

export default async function WorkoutPage() {
  const { template, activeSession } = await getWorkoutPageData();

  const exerciseNames = template?.exercises.map((e) => e.name) ?? [];
  const allNames = exerciseNames.length
    ? exerciseNames
    : [...new Set(
        (await prisma.workoutSetLog.findMany({ select: { exerciseName: true }, distinct: ["exerciseName"] }))
          .map((l) => l.exerciseName)
      )];

  const exerciseHistories = await Promise.all(
    allNames.map(async (name) => ({
      name,
      history: await getExerciseHistory(name, 10),
    }))
  );

  return (
    <WorkoutPageClient
      template={template}
      activeSession={activeSession}
      exerciseHistories={exerciseHistories}
    />
  );
}
