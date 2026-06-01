"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { DayWorkoutCard } from "@/components/day-workout-card";
import { WarningBox } from "@/components/warning-box";
import { formatDateLong } from "@/lib/date";
import { PLAN_TYPES, CYCLE_DISCLAIMER, getEffectiveWeight } from "@/lib/tasks";
import type { DayLog, Plan, DayTask, WorkoutTemplate, WorkoutExerciseTemplate } from "@prisma/client";
import { DayDetailEdit } from "@/components/day-detail-edit";

type TaskWithPlan = DayTask & {
  plan: Pick<Plan, "id" | "name" | "abbreviation" | "content">;
};

type TemplateWithExercises = WorkoutTemplate & {
  exercises: WorkoutExerciseTemplate[];
};

interface DayDetailViewProps {
  date: string;
  log: DayLog;
  tasks: TaskWithPlan[];
  dietPlan: Plan | undefined;
  workoutTemplate: TemplateWithExercises | null;
  workoutCompleted: boolean;
  completedSessionTitle: string | null;
  seasonName: string | null;
  isPastDay: boolean;
}

export function DayDetailView({
  date,
  log,
  tasks,
  dietPlan,
  workoutTemplate,
  workoutCompleted,
  completedSessionTitle,
  seasonName,
  isPastDay,
}: DayDetailViewProps) {
  const [editMode, setEditMode] = useState(false);
  const showReport = isPastDay && !editMode;

  if (!showReport) {
    return (
      <DayDetailEdit
        date={date}
        log={log}
        tasks={tasks}
        dietPlan={dietPlan}
        workoutTemplate={workoutTemplate}
        workoutCompleted={workoutCompleted}
        completedSessionTitle={completedSessionTitle}
        seasonName={seasonName}
        onCancelEdit={isPastDay ? () => setEditMode(false) : undefined}
      />
    );
  }

  const suppTasks = tasks.filter((t) => t.type === PLAN_TYPES.SUPPLEMENT);
  const cycleTasks = tasks.filter((t) => t.type === PLAN_TYPES.CYCLE);
  const bloodTasks = tasks.filter((t) => t.type === PLAN_TYPES.BLOODWORK);
  const weight = getEffectiveWeight(log);

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/calendar">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="min-w-0">
            <h1 className="text-xl font-bold truncate">{formatDateLong(date)}</h1>
            {seasonName && (
              <p className="text-xs text-muted-foreground truncate">{seasonName}</p>
            )}
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditMode(true)}>
          <Pencil className="h-3.5 w-3.5 mr-1" />
          Düzenle
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Günlük Kilo</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold">
            {weight != null ? `${weight} kg` : "—"}
          </p>
        </CardContent>
      </Card>

      {(dietPlan || log.dietText) && (
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Diyet</CardTitle>
            <StatusBadge variant={log.dietDone ? "done" : "missing"} />
          </CardHeader>
          <CardContent>
            {(log.dietText ?? dietPlan?.content) && (
              <p className="text-sm whitespace-pre-wrap text-muted-foreground mb-2">
                {log.dietText ?? dietPlan?.content}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {suppTasks.length > 0 && (
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Supplement</CardTitle>
            <StatusBadge
              variant={
                suppTasks.every((t) => t.completed)
                  ? "done"
                  : suppTasks.some((t) => t.completed)
                    ? "partial"
                    : "missing"
              }
              label={`${suppTasks.filter((t) => t.completed).length}/${suppTasks.length} tamamlandı`}
            />
          </CardHeader>
          <CardContent className="space-y-1">
            {suppTasks.map((t) => (
              <p key={t.id} className="text-sm">
                {t.title}{" "}
                <StatusBadge
                  variant={t.completed ? "done" : "missing"}
                  label={t.completed ? "✓" : "—"}
                  className="ml-1 py-0"
                />
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      {cycleTasks.length > 0 && (
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Kür / İlaç</CardTitle>
            <StatusBadge
              variant={
                cycleTasks.every((t) => t.completed) ? "done" : "partial"
              }
              label={`${cycleTasks.filter((t) => t.completed).length}/${cycleTasks.length} tamamlandı`}
            />
          </CardHeader>
          <CardContent className="space-y-1">
            <WarningBox text={CYCLE_DISCLAIMER} />
            {cycleTasks.map((t) => (
              <p key={t.id} className="text-sm">
                {t.title}
                {t.plan.abbreviation && (
                  <span className="text-muted-foreground"> ({t.plan.abbreviation})</span>
                )}
              </p>
            ))}
          </CardContent>
        </Card>
      )}

      {(bloodTasks.length > 0 || log.bloodworkPlanned) && (
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Kan Tahlili</CardTitle>
            <StatusBadge
              variant={
                bloodTasks.length > 0
                  ? bloodTasks.every((t) => t.completed)
                    ? "done"
                    : "missing"
                  : log.bloodworkDone
                    ? "done"
                    : log.bloodworkPlanned
                      ? "partial"
                      : "none"
              }
              label={
                bloodTasks.length > 0
                  ? bloodTasks.every((t) => t.completed)
                    ? "Yapıldı"
                    : "Planlandı"
                  : log.bloodworkDone
                    ? "Yapıldı"
                    : "Planlandı"
              }
            />
          </CardHeader>
          {log.bloodworkNote && (
            <CardContent>
              <p className="text-sm text-muted-foreground">{log.bloodworkNote}</p>
            </CardContent>
          )}
        </Card>
      )}

      <DayWorkoutCard
        date={date}
        template={workoutTemplate}
        completed={workoutCompleted || log.workoutDone}
        completedTitle={completedSessionTitle}
      />

      {log.note && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Not</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{log.note}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
