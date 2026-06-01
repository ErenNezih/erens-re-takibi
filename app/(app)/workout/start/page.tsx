import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkoutStartFlow } from "@/components/workout-start-flow";
import { getActiveSession, getTodayTemplate, startWorkoutSession } from "@/lib/workout";
import { startOfDay } from "@/lib/date";
import { prisma } from "@/lib/db";

export default async function WorkoutStartPage() {
  const activeSession = await getActiveSession();
  const template = await getTodayTemplate();

  const session = activeSession ?? (await startWorkoutSession(startOfDay(new Date()), template?.id));

  const existingLogs = await prisma.workoutSetLog.findMany({
    where: { workoutSessionId: session.id },
    select: { exerciseName: true, setNumber: true, weight: true, reps: true },
  });

  const exercises = template?.exercises ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/workout">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-xl font-bold">{session.title}</h1>
      </div>
      <WorkoutStartFlow
        sessionId={session.id}
        exercises={exercises}
        existingLogs={existingLogs}
      />
    </div>
  );
}
