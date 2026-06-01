"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateShort } from "@/lib/date";
import { WORKOUT_GROUP_LABELS, type WorkoutGroup } from "@/lib/workout-groups";

export type SessionHistoryItem = {
  id: string;
  date: Date;
  title: string;
  workoutGroup: string | null;
  totalVolume: number;
  completed: boolean;
  prevVolume: number | null;
  volumeDelta: number | null;
};

interface WorkoutSessionHistoryProps {
  sessions: SessionHistoryItem[];
}

export function WorkoutSessionHistory({ sessions }: WorkoutSessionHistoryProps) {
  if (sessions.length === 0) {
    return (
      <p className="text-center text-muted-foreground py-8 text-sm">
        Henüz tamamlanmış antrenman yok
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {sessions.map((s) => {
        const groupLabel =
          s.workoutGroup &&
          WORKOUT_GROUP_LABELS[s.workoutGroup as WorkoutGroup]
            ? WORKOUT_GROUP_LABELS[s.workoutGroup as WorkoutGroup]
            : s.title;

        return (
          <Link key={s.id} href={`/workout/session/${s.id}`}>
            <Card className="hover:bg-accent/30 transition-colors">
              <CardContent className="p-4 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{formatDateShort(s.date)}</p>
                    <Badge variant="outline" className="text-xs">
                      Tamamlandı
                    </Badge>
                  </div>
                  <p className="text-sm mt-0.5">{groupLabel}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Volume: {Math.round(s.totalVolume).toLocaleString("tr-TR")}
                    {s.volumeDelta != null && (
                      <span className="ml-2">
                        Önceki {groupLabel}&apos;a göre:{" "}
                        {s.volumeDelta >= 0 ? "+" : ""}
                        {Math.round(s.volumeDelta).toLocaleString("tr-TR")}
                      </span>
                    )}
                    {s.volumeDelta == null && (
                      <span className="ml-2">İlk {groupLabel} kaydı</span>
                    )}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
