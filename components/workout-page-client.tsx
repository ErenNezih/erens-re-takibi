"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { WorkoutSessionHistory, type SessionHistoryItem } from "@/components/workout-session-history";
import { beginWorkout } from "@/lib/actions/workout";
import type { WorkoutTemplate, WorkoutExerciseTemplate, WorkoutSession } from "@prisma/client";

type TemplateWithExercises = WorkoutTemplate & { exercises: WorkoutExerciseTemplate[] };

interface WorkoutPageClientProps {
  template: TemplateWithExercises | null;
  activeSession: WorkoutSession | null;
  sessionHistory: SessionHistoryItem[];
}

export function WorkoutPageClient({
  template,
  activeSession,
  sessionHistory,
}: WorkoutPageClientProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleStart() {
    startTransition(async () => {
      await beginWorkout();
      router.push("/workout/start");
    });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Antrenman</h1>

      <Card>
        <CardContent className="p-4">
          {template ? (
            <>
              <p className="text-sm text-muted-foreground">Bugünkü antrenman</p>
              <p className="text-xl font-bold mt-1">{template.name}</p>
              <p className="text-sm text-muted-foreground">
                {template.exercises.length} hareket
              </p>
              {template.programName && (
                <p className="text-xs text-muted-foreground mt-1">{template.programName}</p>
              )}
            </>
          ) : (
            <p className="text-muted-foreground text-sm">Bugün antrenman günü değil</p>
          )}
          {activeSession ? (
            <Link href="/workout/start">
              <Button className="w-full h-14 mt-4 text-base">
                <Dumbbell className="h-5 w-5 mr-2" />
                Antrenmana Devam Et
              </Button>
            </Link>
          ) : (
            <Button
              className="w-full h-14 mt-4 text-base"
              onClick={handleStart}
              disabled={isPending || !template}
            >
              <Dumbbell className="h-5 w-5 mr-2" />
              Antrenmana Başla
            </Button>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="history">
        <TabsList className="w-full">
          <TabsTrigger value="history" className="flex-1">
            Geçmiş
          </TabsTrigger>
        </TabsList>
        <TabsContent value="history" className="mt-4">
          <WorkoutSessionHistory sessions={sessionHistory} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
