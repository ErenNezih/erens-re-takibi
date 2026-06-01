"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { CheckboxCard } from "@/components/checkbox-card";
import { DayWorkoutCard } from "@/components/day-workout-card";
import { StatusBadge } from "@/components/status-badge";
import { toast } from "@/components/ui/use-toast";
import { saveDayLog, toggleDayTask } from "@/lib/actions/day";
import { formatDateLong } from "@/lib/date";
import { PLAN_TYPES, getEffectiveWeight } from "@/lib/tasks";
import type { DayLog, Plan, DayTask, WorkoutTemplate, WorkoutExerciseTemplate } from "@prisma/client";
import type { DayStatus } from "@/lib/tasks";

type TaskWithPlan = DayTask & {
  plan: Pick<Plan, "id" | "name" | "abbreviation" | "content">;
};

type TemplateWithExercises = WorkoutTemplate & {
  exercises: WorkoutExerciseTemplate[];
};

interface TodayChecklistProps {
  date: string;
  log: DayLog;
  tasks: TaskWithPlan[];
  status: DayStatus;
  dietPlan: Plan | undefined;
  workoutTemplate: TemplateWithExercises | null;
  workoutCompleted: boolean;
  completedSessionTitle: string | null;
  seasonName: string | null;
}

export function TodayChecklist({
  date,
  log,
  tasks,
  status,
  dietPlan,
  workoutTemplate,
  workoutCompleted,
  completedSessionTitle,
  seasonName,
}: TodayChecklistProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const suppTasks = tasks.filter((t) => t.type === PLAN_TYPES.SUPPLEMENT);
  const cycleTasks = tasks.filter((t) => t.type === PLAN_TYPES.CYCLE);
  const bloodTasks = tasks.filter((t) => t.type === PLAN_TYPES.BLOODWORK);
  const weight = getEffectiveWeight(log);

  async function quickSaveWeight(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("date", date);
    formData.set("dietDone", log.dietDone ? "true" : "false");
    formData.set("supplementsDone", log.supplementsDone ? "true" : "false");
    formData.set("cycleDone", log.cycleDone ? "true" : "false");
    formData.set("bloodworkPlanned", log.bloodworkPlanned ? "true" : "false");
    formData.set("bloodworkDone", log.bloodworkDone ? "true" : "false");
    formData.set("dietText", log.dietText ?? "");
    formData.set("note", log.note ?? "");
    startTransition(async () => {
      await saveDayLog(formData);
      toast({ title: "Kilo kaydedildi" });
      router.refresh();
    });
  }

  function handleDietToggle(checked: boolean) {
    const formData = new FormData();
    formData.set("date", date);
    formData.set("weight", weight?.toString() ?? "");
    formData.set("dietDone", checked ? "true" : "false");
    formData.set("supplementsDone", log.supplementsDone ? "true" : "false");
    formData.set("cycleDone", log.cycleDone ? "true" : "false");
    formData.set("bloodworkPlanned", log.bloodworkPlanned ? "true" : "false");
    formData.set("bloodworkDone", log.bloodworkDone ? "true" : "false");
    formData.set("dietText", log.dietText ?? dietPlan?.content ?? "");
    formData.set("note", log.note ?? "");
    startTransition(async () => {
      await saveDayLog(formData);
      router.refresh();
    });
  }

  function handleTaskToggle(taskId: string, completed: boolean) {
    startTransition(async () => {
      await toggleDayTask(taskId, completed);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Bugün</h1>
        <p className="text-sm text-muted-foreground">{formatDateLong(date)}</p>
        {seasonName && (
          <p className="text-xs text-muted-foreground mt-0.5">{seasonName}</p>
        )}
      </div>

      {status.allComplete && (
        <div className="rounded-xl border border-success/40 bg-success/10 p-4 flex items-center gap-3">
          <CheckCircle2 className="h-8 w-8 text-success shrink-0" />
          <div>
            <p className="font-semibold text-success">Gün tamamlandı!</p>
            <p className="text-xs text-muted-foreground">Planlanan görevler tamamlandı</p>
          </div>
        </div>
      )}

      <Card>
        <CardContent className="p-4">
          <form onSubmit={quickSaveWeight} className="space-y-2">
            <Label htmlFor="weight">Günlük Kilo</Label>
            <Input
              id="weight"
              name="weight"
              type="number"
              step="0.1"
              placeholder="78.4 kg"
              defaultValue={weight ?? ""}
              className="h-12 text-lg"
            />
            <Button type="submit" variant="outline" className="w-full h-11" disabled={isPending}>
              Kiloyu Kaydet
            </Button>
          </form>
        </CardContent>
      </Card>

      {(dietPlan || log.dietText) && (
        <CheckboxCard
          label="Diyet uygulandı"
          checked={log.dietDone}
          onChange={handleDietToggle}
          color="success"
        />
      )}

      {suppTasks.map((t) => (
        <CheckboxCard
          key={t.id}
          label={t.title}
          checked={t.completed}
          onChange={(c) => handleTaskToggle(t.id, c)}
          color="supplement"
        />
      ))}

      {cycleTasks.map((t) => (
        <CheckboxCard
          key={t.id}
          label={t.title}
          checked={t.completed}
          onChange={(c) => handleTaskToggle(t.id, c)}
          color="cycle"
        />
      ))}

      {(bloodTasks.length > 0 || log.bloodworkPlanned) && (
        <Card>
          <CardContent className="p-4 flex items-center justify-between">
            <span className="text-sm font-medium">Kan tahlili</span>
            <StatusBadge
              variant={log.bloodworkDone || bloodTasks.every((t) => t.completed) ? "done" : "partial"}
              label={
                log.bloodworkDone || bloodTasks.every((t) => t.completed)
                  ? "Yapıldı"
                  : "Planlandı"
              }
            />
          </CardContent>
        </Card>
      )}

      <DayWorkoutCard
        date={date}
        template={workoutTemplate}
        completed={workoutCompleted || log.workoutDone}
        completedTitle={completedSessionTitle}
      />

      <Link href={`/day/${date}`}>
        <Button variant="outline" className="w-full h-12 justify-between">
          Gün detayına git
          <ChevronRight className="h-4 w-4" />
        </Button>
      </Link>
    </div>
  );
}
