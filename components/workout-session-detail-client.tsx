"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateShort } from "@/lib/date";
import { WORKOUT_GROUP_LABELS, type WorkoutGroup } from "@/lib/workout-groups";

interface ExerciseDetail {
  name: string;
  sets: { setNumber: number; weight: number | null; reps: number | null; volume: number }[];
  totalVolume: number;
}

interface WorkoutSessionDetailClientProps {
  date: Date;
  title: string;
  workoutGroup: string | null;
  totalVolume: number;
  prevVolume: number | null;
  volumeDelta: number | null;
  exercises: ExerciseDetail[];
}

export function WorkoutSessionDetailClient({
  date,
  title,
  workoutGroup,
  totalVolume,
  prevVolume,
  volumeDelta,
  exercises,
}: WorkoutSessionDetailClientProps) {
  const groupLabel =
    workoutGroup && WORKOUT_GROUP_LABELS[workoutGroup as WorkoutGroup]
      ? WORKOUT_GROUP_LABELS[workoutGroup as WorkoutGroup]
      : title;

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center gap-3">
        <Link href="/workout">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">{groupLabel}</h1>
          <p className="text-xs text-muted-foreground">{formatDateShort(date)}</p>
        </div>
        <Badge className="ml-auto bg-success/15 text-success border-success/30">
          Tamamlandı
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Özet</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Toplam volume</p>
            <p className="font-semibold">{Math.round(totalVolume).toLocaleString("tr-TR")}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Önceki {groupLabel}&apos;a göre</p>
            <p className="font-semibold">
              {volumeDelta != null
                ? `${volumeDelta >= 0 ? "+" : ""}${Math.round(volumeDelta).toLocaleString("tr-TR")}`
                : "—"}
            </p>
          </div>
          {prevVolume != null && (
            <div>
              <p className="text-xs text-muted-foreground">Önceki volume</p>
              <p className="font-semibold">
                {Math.round(prevVolume).toLocaleString("tr-TR")}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {exercises.map((ex) => (
        <Card key={ex.name}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">{ex.name}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {ex.sets.map((set) => (
              <div key={set.setNumber} className="flex justify-between text-sm">
                <span className="text-muted-foreground">Set {set.setNumber}</span>
                <span>
                  {set.weight ?? 0} kg x {set.reps ?? 0} ={" "}
                  {Math.round(set.volume).toLocaleString("tr-TR")}
                </span>
              </div>
            ))}
            <div className="flex justify-between text-sm font-medium pt-2 border-t border-border/50 mt-2">
              <span>Toplam</span>
              <span>{Math.round(ex.totalVolume).toLocaleString("tr-TR")}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
