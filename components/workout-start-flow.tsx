"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/components/ui/use-toast";
import { saveSetLog, finishWorkout } from "@/lib/actions/workout";
import type { WorkoutExerciseTemplate } from "@prisma/client";

interface WorkoutStartFlowProps {
  sessionId: string;
  exercises: WorkoutExerciseTemplate[];
  existingLogs: { exerciseName: string; setNumber: number; weight: number | null; reps: number | null }[];
}

export function WorkoutStartFlow({ sessionId, exercises, existingLogs }: WorkoutStartFlowProps) {
  const [exerciseIdx, setExerciseIdx] = useState(0);
  const [setIdx, setSetIdx] = useState(0);
  const [weight, setWeight] = useState("");
  const [reps, setReps] = useState("");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (exercises.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Bugün için antrenman hareketi tanımlı değil.</p>
        <Button className="mt-4" onClick={() => router.push("/plans")}>
          Planlara git
        </Button>
      </div>
    );
  }

  const exercise = exercises[exerciseIdx];
  const totalSets = exercise.sets;
  const progress = ((exerciseIdx * 100) / exercises.length) + ((setIdx + 1) / totalSets) * (100 / exercises.length);

  const prevLog = existingLogs.find(
    (l) => l.exerciseName === exercise.name && l.setNumber === setIdx + 1
  );

  async function handleCompleteSet() {
    startTransition(async () => {
      await saveSetLog(
        sessionId,
        exercise.name,
        setIdx + 1,
        weight ? parseFloat(weight) : null,
        reps ? parseInt(reps, 10) : null
      );

      if (setIdx + 1 < totalSets) {
        setSetIdx(setIdx + 1);
        setWeight("");
        setReps("");
        toast({ title: `Set ${setIdx + 1} kaydedildi` });
      } else if (exerciseIdx + 1 < exercises.length) {
        setExerciseIdx(exerciseIdx + 1);
        setSetIdx(0);
        setWeight("");
        setReps("");
        toast({ title: `${exercise.name} tamamlandı` });
      } else {
        await finishWorkout(sessionId);
        toast({ title: "Antrenman tamamlandı!" });
        router.push("/today");
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span>Hareket {exerciseIdx + 1}/{exercises.length}</span>
          <span>Set {setIdx + 1}/{totalSets}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">{exercise.name}</CardTitle>
          {exercise.targetReps && (
            <p className="text-sm text-muted-foreground">Hedef: {exercise.targetReps} tekrar</p>
          )}
          {exercise.note && (
            <p className="text-sm text-muted-foreground">Not: {exercise.note}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Ağırlık (kg)</Label>
              <Input
                type="number"
                step="0.5"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                defaultValue={prevLog?.weight ?? ""}
                className="h-14 text-xl text-center"
                inputMode="decimal"
              />
            </div>
            <div className="space-y-1">
              <Label>Tekrar</Label>
              <Input
                type="number"
                value={reps}
                onChange={(e) => setReps(e.target.value)}
                defaultValue={prevLog?.reps ?? ""}
                className="h-14 text-xl text-center"
                inputMode="numeric"
              />
            </div>
          </div>

          <Button
            className="w-full h-14 text-base"
            onClick={handleCompleteSet}
            disabled={isPending}
          >
            <Check className="h-5 w-5 mr-2" />
            {setIdx + 1 < totalSets
              ? `Set ${setIdx + 1} Tamamla`
              : exerciseIdx + 1 < exercises.length
              ? "Sonraki Hareket"
              : "Antrenmanı Bitir"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
