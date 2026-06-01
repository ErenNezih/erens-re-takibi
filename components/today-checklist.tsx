"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { CheckboxCard } from "@/components/checkbox-card";
import { DayStatusDots } from "@/components/day-status-dots";
import { toast } from "@/components/ui/use-toast";
import { saveDayLog, toggleDayTask } from "@/lib/actions/day";
import { toDateInputValue, formatDateLong } from "@/lib/date";
import { PLAN_TYPES } from "@/lib/tasks";
import type { DayLog, Plan, DayTask } from "@prisma/client";
import type { DayStatus } from "@/lib/tasks";
import { cn } from "@/lib/cn";

type TaskWithPlan = DayTask & { plan: Plan };

interface TodayChecklistProps {
  date: string;
  log: DayLog;
  tasks: TaskWithPlan[];
  status: DayStatus;
}

export function TodayChecklist({ date, log, tasks, status }: TodayChecklistProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const suppTasks = tasks.filter((t) => t.type === PLAN_TYPES.SUPPLEMENT);
  const cycleTasks = tasks.filter((t) => t.type === PLAN_TYPES.CYCLE);

  async function quickSaveWeight(formData: FormData) {
    formData.set("date", date);
    formData.set("dietDone", log.dietDone ? "true" : "false");
    formData.set("workoutDone", log.workoutDone ? "true" : "false");
    startTransition(async () => {
      await saveDayLog(formData);
      toast({ title: "Kilo kaydedildi" });
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
      </div>

      {status.allComplete && (
        <div className="rounded-xl border border-success/40 bg-success/10 p-4 flex items-center gap-3">
          <CheckCircle2 className="h-8 w-8 text-success shrink-0" />
          <div>
            <p className="font-semibold text-success">Gün tamamlandı!</p>
            <p className="text-xs text-muted-foreground">Tüm görevler işaretlendi</p>
          </div>
        </div>
      )}

      <Card className={cn(status.allComplete && "border-success/30")}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">Gün durumu</span>
            <DayStatusDots status={status} />
          </div>
          <form action={quickSaveWeight} className="grid grid-cols-2 gap-2">
            <Input name="morningWeight" type="number" step="0.1" placeholder="Sabah kg" defaultValue={log.morningWeight ?? ""} className="h-12" />
            <Input name="eveningWeight" type="number" step="0.1" placeholder="Akşam kg" defaultValue={log.eveningWeight ?? ""} className="h-12" />
            <Button type="submit" variant="outline" className="col-span-2 h-11" disabled={isPending}>
              Kiloyu Kaydet
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-2">
        <CheckboxCard label="Diyet uygulandı" checked={log.dietDone} onChange={() => {}} color="success" disabled />
        <CheckboxCard label="Antrenman yapıldı" checked={log.workoutDone} onChange={() => {}} color="workout" disabled />
        {suppTasks.map((t) => (
          <CheckboxCard key={t.id} label={t.title} checked={t.completed} onChange={(c) => handleTaskToggle(t.id, c)} color="supplement" />
        ))}
        {cycleTasks.map((t) => (
          <CheckboxCard key={t.id} label={t.title} checked={t.completed} onChange={(c) => handleTaskToggle(t.id, c)} color="cycle" />
        ))}
      </div>

      <Link href={`/day/${date}`}>
        <Button variant="outline" className="w-full h-12 justify-between">
          Gün detayına git
          <ChevronRight className="h-4 w-4" />
        </Button>
      </Link>

      <Link href={`/workout/start`}>
        <Button className="w-full h-14 text-base">
          Antrenmana Başla
        </Button>
      </Link>
    </div>
  );
}
