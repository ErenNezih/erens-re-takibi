"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckboxCard } from "@/components/checkbox-card";
import { WarningBox } from "@/components/warning-box";
import { toast } from "@/components/ui/use-toast";
import { saveDayLog, toggleDayTask } from "@/lib/actions/day";
import { formatDateLong } from "@/lib/date";
import { PLAN_TYPES, CYCLE_DISCLAIMER } from "@/lib/tasks";
import type { DayLog, Plan, DayTask } from "@prisma/client";

type TaskWithPlan = DayTask & { plan: Plan };

interface DayDetailFormProps {
  date: string;
  log: DayLog;
  tasks: TaskWithPlan[];
  dietPlan: Plan | undefined;
}

export function DayDetailForm({ date, log, tasks, dietPlan }: DayDetailFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const suppTasks = tasks.filter((t) => t.type === PLAN_TYPES.SUPPLEMENT);
  const cycleTasks = tasks.filter((t) => t.type === PLAN_TYPES.CYCLE);
  const bloodTasks = tasks.filter((t) => t.type === PLAN_TYPES.BLOODWORK);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("date", date);
    startTransition(async () => {
      await saveDayLog(formData);
      toast({ title: "Kaydedildi" });
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
    <div className="space-y-4 pb-4">
      <div className="flex items-center gap-3">
        <Link href="/calendar">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">{formatDateLong(date)}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Kilo</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="morningWeight">Sabah (kg)</Label>
              <Input id="morningWeight" name="morningWeight" type="number" step="0.1" defaultValue={log.morningWeight ?? ""} className="h-12 text-lg" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="eveningWeight">Akşam (kg)</Label>
              <Input id="eveningWeight" name="eveningWeight" type="number" step="0.1" defaultValue={log.eveningWeight ?? ""} className="h-12 text-lg" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Diyet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              name="dietText"
              defaultValue={log.dietText ?? dietPlan?.content ?? ""}
              rows={4}
              placeholder="Günün diyet planı..."
              className="text-sm"
            />
            <label className="flex items-center gap-3 min-h-[44px]">
              <input type="checkbox" name="dietDone" defaultChecked={log.dietDone} className="h-5 w-5 rounded" />
              <span className="font-medium">Diyet uygulandı</span>
            </label>
          </CardContent>
        </Card>

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
              <input type="hidden" name="supplementsDone" value={suppTasks.every((t) => t.completed) ? "true" : "false"} />
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
              <input type="hidden" name="cycleDone" value={cycleTasks.every((t) => t.completed) ? "true" : "false"} />
            </CardContent>
          </Card>
        )}

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
              <input type="checkbox" name="bloodworkPlanned" defaultChecked={log.bloodworkPlanned || bloodTasks.length > 0} className="h-5 w-5 rounded" />
              <span className="font-medium">Kan tahlili günü</span>
            </label>
            <label className="flex items-center gap-3 min-h-[44px]">
              <input type="checkbox" name="bloodworkDone" defaultChecked={log.bloodworkDone} className="h-5 w-5 rounded" />
              <span className="font-medium">Kan tahlili yapıldı</span>
            </label>
            <Textarea name="bloodworkNote" defaultValue={log.bloodworkNote ?? ""} rows={2} placeholder="Not..." />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Antrenman & Not</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <label className="flex items-center gap-3 min-h-[44px]">
              <input type="checkbox" name="workoutDone" defaultChecked={log.workoutDone} className="h-5 w-5 rounded" />
              <span className="font-medium">Antrenman yapıldı</span>
            </label>
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
