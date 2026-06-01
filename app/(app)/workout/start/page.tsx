import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkoutStartFlow } from "@/components/workout-start-flow";
import { getActiveSession, getTodayTemplate, startWorkoutSession } from "@/lib/workout";
import { parseDateInput, startOfDay, today } from "@/lib/date";
import { prisma } from "@/lib/db";

interface WorkoutStartPageProps {
  searchParams: Promise<{ date?: string }>;
}

export default async function WorkoutStartPage({ searchParams }: WorkoutStartPageProps) {
  const params = await searchParams;
  const date = params.date ? parseDateInput(params.date) : today();

  const [activeSession, template] = await Promise.all([
    getActiveSession(date),
    getTodayTemplate(date),
  ]);

  const session =
    activeSession ?? (await startWorkoutSession(date, template?.id));

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
