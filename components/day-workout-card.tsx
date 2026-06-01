"use client";

import Link from "next/link";
import { Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import type { WorkoutTemplate, WorkoutExerciseTemplate } from "@prisma/client";

type TemplateWithExercises = WorkoutTemplate & {
  exercises: WorkoutExerciseTemplate[];
};

interface DayWorkoutCardProps {
  date: string;
  template: TemplateWithExercises | null;
  completed: boolean;
  completedTitle?: string | null;
}

export function DayWorkoutCard({
  date,
  template,
  completed,
  completedTitle,
}: DayWorkoutCardProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Dumbbell className="h-4 w-4" />
          Antrenman
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {!template && !completed ? (
          <p className="text-sm text-muted-foreground">Bugün aktif antrenman yok</p>
        ) : completed ? (
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="font-medium">{completedTitle ?? template?.name ?? "Antrenman"}</p>
              {template && (
                <p className="text-xs text-muted-foreground">
                  {template.exercises.length} hareket
                </p>
              )}
            </div>
            <StatusBadge variant="done" label="Tamamlandı" />
          </div>
        ) : template ? (
          <>
            <div>
              <p className="font-medium">{template.name}</p>
              <p className="text-xs text-muted-foreground">
                {template.exercises.length} hareket
              </p>
            </div>
            <Link href={`/workout/start?date=${date}`}>
              <Button className="w-full h-11">
                <Dumbbell className="h-4 w-4 mr-2" />
                Antrenmana Başla
              </Button>
            </Link>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}
