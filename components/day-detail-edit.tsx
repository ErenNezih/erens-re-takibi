"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckboxCard } from "@/components/checkbox-card";
import { WarningBox } from "@/components/warning-box";
import { DayWorkoutCard } from "@/components/day-workout-card";
import { toast } from "@/components/ui/use-toast";
import { saveDayLog, toggleDayTask } from "@/lib/actions/day";
import { formatDateLong } from "@/lib/date";
import { PLAN_TYPES, CYCLE_DISCLAIMER, getEffectiveWeight } from "@/lib/tasks";
import type { DayLog, Plan, DayTask, WorkoutTemplate, WorkoutExerciseTemplate } from "@prisma/client";

type TaskWithPlan = DayTask & {
  plan: Pick<Plan, "id" | "name" | "abbreviation" | "content">;
};

type TemplateWithExercises = WorkoutTemplate & {
  exercises: WorkoutExerciseTemplate[];
};

interface DayDetailEditProps {
  date: string;
  log: DayLog;
  tasks: TaskWithPlan[];
  dietPlan: Plan | undefined;
  workoutTemplate: TemplateWithExercises | null;
  workoutCompleted: boolean;
  completedSessionTitle: string | null;
  seasonName: string | null;
  onCancelEdit?: () => void;
}

export function DayDetailEdit({
  date,
  log,
  tasks,
  dietPlan,
  workoutTemplate,
  workoutCompleted,
  completedSessionTitle,
  seasonName,
  onCancelEdit,
}: DayDetailEditProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const suppTasks = tasks.filter((t) => t.type === PLAN_TYPES.SUPPLEMENT);
  const cycleTasks = tasks.filter((t) => t.type === PLAN_TYPES.CYCLE);
  const bloodTasks = tasks.filter((t) => t.type === PLAN_TYPES.BLOODWORK);
  const weight = getEffectiveWeight(log);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("date", date);
    startTransition(async () => {
      await saveDayLog(formData);
      toast({ title: "Kaydedildi" });
      router.refresh();
      onCancelEdit?.();
    });
  }

  function handleTaskToggle(taskId: string, completed: boolean) {
    startTransition(async () => {
      await toggleDayTask(taskId, completed);
      router.refresh();
    });
  }

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
        {onCancelEdit && (
          <Button variant="ghost" size="sm" onClick={onCancelEdit}>
            <X className="h-4 w-4 mr-1" />
            İptal
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Günlük Kilo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <Label htmlFor="weight">Kilo (kg)</Label>
              <Input
                id="weight"
                name="weight"
                type="number"
                step="0.1"
                defaultValue={weight ?? ""}
                className="h-12 text-lg"
                placeholder="78.4"
              />
            </div>
          </CardContent>
        </Card>

        {(dietPlan || log.dietText) && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Diyet</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {(dietPlan?.targetCalories ||
                dietPlan?.targetProtein ||
                dietPlan?.targetCarbs ||
                dietPlan?.targetFat) && (
                <p className="text-xs text-muted-foreground">
                  Hedef:{" "}
                  {[
                    dietPlan?.targetCalories && `${dietPlan.targetCalories} kcal`,
                    dietPlan?.targetProtein && `${dietPlan.targetProtein}g P`,
                    dietPlan?.targetCarbs && `${dietPlan.targetCarbs}g K`,
                    dietPlan?.targetFat && `${dietPlan.targetFat}g Y`,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
              )}
              <Textarea
                name="dietText"
                defaultValue={log.dietText ?? dietPlan?.content ?? ""}
                rows={4}
                placeholder="Günün diyet planı..."
                className="text-sm"
              />
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="calories">Kalori</Label>
                  <Input
                    id="calories"
                    name="calories"
                    type="number"
                    defaultValue={log.calories ?? ""}
                    placeholder={dietPlan?.targetCalories?.toString() ?? ""}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="protein">Protein (g)</Label>
                  <Input
                    id="protein"
                    name="protein"
                    type="number"
                    defaultValue={log.protein ?? ""}
                    placeholder={dietPlan?.targetProtein?.toString() ?? ""}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="carbs">Karbonhidrat (g)</Label>
                  <Input
                    id="carbs"
                    name="carbs"
                    type="number"
                    defaultValue={log.carbs ?? ""}
                    placeholder={dietPlan?.targetCarbs?.toString() ?? ""}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="fat">Yağ (g)</Label>
                  <Input
                    id="fat"
                    name="fat"
                    type="number"
                    defaultValue={log.fat ?? ""}
                    placeholder={dietPlan?.targetFat?.toString() ?? ""}
                  />
                </div>
              </div>
              <label className="flex items-center gap-3 min-h-[44px]">
                <input
                  type="checkbox"
                  name="dietDone"
                  defaultChecked={log.dietDone}
                  className="h-5 w-5 rounded"
                />
                <span className="font-medium">Diyet uygulandı</span>
              </label>
            </CardContent>
          </Card>
        )}

        {suppTasks.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Supplementler</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {suppTasks.map((t) => (
                <CheckboxCard
                  key={t.id}
                  label={t.title}
                  checked={t.completed}
                  onChange={(c) => handleTaskToggle(t.id, c)}
                  color="supplement"
                />
              ))}
            </CardContent>
          </Card>
        )}

        {cycleTasks.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Kür / İlaç</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <WarningBox text={CYCLE_DISCLAIMER} />
              {cycleTasks.map((t) => (
                <CheckboxCard
                  key={t.id}
                  label={t.title}
                  subtitle={t.plan.abbreviation ?? undefined}
                  checked={t.completed}
                  onChange={(c) => handleTaskToggle(t.id, c)}
                  color="cycle"
                />
              ))}
            </CardContent>
          </Card>
        )}

        {(bloodTasks.length > 0 || log.bloodworkPlanned) && (
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Kan Tahlili</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {bloodTasks.map((t) => (
                <CheckboxCard
                  key={t.id}
                  label={t.title}
                  checked={t.completed}
                  onChange={(c) => handleTaskToggle(t.id, c)}
                  color="bloodwork"
                />
              ))}
              <label className="flex items-center gap-3 min-h-[44px]">
                <input
                  type="checkbox"
                  name="bloodworkPlanned"
                  defaultChecked={log.bloodworkPlanned || bloodTasks.length > 0}
                  className="h-5 w-5 rounded"
                />
                <span className="font-medium">Kan tahlili günü</span>
              </label>
              <label className="flex items-center gap-3 min-h-[44px]">
                <input
                  type="checkbox"
                  name="bloodworkDone"
                  defaultChecked={log.bloodworkDone}
                  className="h-5 w-5 rounded"
                />
                <span className="font-medium">Kan tahlili yapıldı</span>
              </label>
              <Textarea
                name="bloodworkNote"
                defaultValue={log.bloodworkNote ?? ""}
                rows={2}
                placeholder="Not..."
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

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Not</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea name="note" defaultValue={log.note ?? ""} rows={3} placeholder="Günün notu..." />
          </CardContent>
        </Card>

        <Button type="submit" className="w-full h-12 text-base" disabled={isPending}>
          <Save className="h-4 w-4 mr-2" />
          {isPending ? "Kaydediliyor..." : "Kaydet"}
        </Button>
      </form>
    </div>
  );
}
