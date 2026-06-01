"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import {
  createWorkoutTemplate,
  addExerciseTemplate,
  deleteWorkoutTemplate,
  deleteExerciseTemplate,
} from "@/lib/actions/workout";
import { weekdayLabel, WEEKDAY_LABELS } from "@/lib/date";
import { TRAINING_2026_PROGRAM } from "@/lib/seed-workout-program";
import type { WorkoutTemplate, WorkoutExerciseTemplate } from "@prisma/client";

type TemplateWithExercises = WorkoutTemplate & { exercises: WorkoutExerciseTemplate[] };

interface WorkoutTemplateManagerProps {
  activeTemplates: TemplateWithExercises[];
  inactiveTemplates: TemplateWithExercises[];
}

export function WorkoutTemplateManager({
  activeTemplates,
  inactiveTemplates,
}: WorkoutTemplateManagerProps) {
  const [open, setOpen] = useState(false);
  const [exOpen, setExOpen] = useState<string | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const templateByWeekday = new Map(activeTemplates.map((t) => [t.weekday, t]));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Haftalık Program</h2>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" />Ekle</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Antrenman Şablonu</DialogTitle></DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                startTransition(async () => {
                  await createWorkoutTemplate(new FormData(e.currentTarget));
                  toast({ title: "Şablon eklendi" });
                  setOpen(false);
                  router.refresh();
                });
              }}
              className="space-y-3"
            >
              <Input name="name" placeholder="Push" required />
              <select name="weekday" className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                {WEEKDAY_LABELS.map((l, i) => (
                  <option key={i} value={i + 1}>{l}</option>
                ))}
              </select>
              <Button type="submit" className="w-full" disabled={isPending}>Kaydet</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{TRAINING_2026_PROGRAM}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {WEEKDAY_LABELS.map((label, i) => {
            const weekday = i + 1;
            const tpl = templateByWeekday.get(weekday);
            const isRest = weekday === 7;

            return (
              <div key={weekday}>
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">
                    {label} — {isRest ? "Dinlenme" : tpl?.name ?? "—"}
                  </p>
                  {!isRest && tpl && (
                    <span className="text-xs text-muted-foreground">
                      {tpl.exercises.length} hareket
                    </span>
                  )}
                </div>
                {!isRest && tpl && tpl.exercises.length > 0 && (
                  <div className="mt-1 space-y-0.5 pl-2 border-l-2 border-border/50">
                    {tpl.exercises.map((ex) => (
                      <p key={ex.id} className="text-xs text-muted-foreground">
                        {ex.name} — {ex.sets}x{ex.targetReps}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      {inactiveTemplates.length > 0 && (
        <div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={() => setShowInactive(!showInactive)}
          >
            Pasif şablonları göster ({inactiveTemplates.length})
            {showInactive ? (
              <ChevronUp className="h-4 w-4 ml-1" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-1" />
            )}
          </Button>
          {showInactive &&
            inactiveTemplates.map((tpl) => (
              <InactiveTemplateCard
                key={tpl.id}
                tpl={tpl}
                exOpen={exOpen}
                setExOpen={setExOpen}
                isPending={isPending}
                router={router}
              />
            ))}
        </div>
      )}
    </div>
  );
}

function InactiveTemplateCard({
  tpl,
  exOpen,
  setExOpen,
  isPending,
  router,
}: {
  tpl: TemplateWithExercises;
  exOpen: string | null;
  setExOpen: (id: string | null) => void;
  isPending: boolean;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <Card className="mt-2 opacity-70">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">
            {weekdayLabel(tpl.weekday)} — {tpl.name}
            <span className="text-xs text-muted-foreground ml-2">(pasif)</span>
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (confirm("Silinsin mi?")) {
                deleteWorkoutTemplate(tpl.id).then(() => router.refresh());
              }
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {tpl.exercises.map((ex) => (
          <div
            key={ex.id}
            className="flex justify-between text-sm py-1 border-b border-border/50 last:border-0"
          >
            <span>
              {ex.name} — {ex.sets}x{ex.targetReps}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                deleteExerciseTemplate(ex.id).then(() => router.refresh());
              }}
            >
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </div>
        ))}
        <Dialog open={exOpen === tpl.id} onOpenChange={(o) => setExOpen(o ? tpl.id : null)}>
          <DialogTrigger>
            <Button variant="outline" size="sm" className="w-full">
              <Plus className="h-3 w-3 mr-1" />
              Hareket
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Hareket Ekle</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const fd = new FormData(e.currentTarget);
                fd.set("workoutTemplateId", tpl.id);
                addExerciseTemplate(fd).then(() => {
                  toast({ title: "Eklendi" });
                  setExOpen(null);
                  router.refresh();
                });
              }}
              className="space-y-3"
            >
              <Input name="name" placeholder="Chest Press" required />
              <div className="grid grid-cols-2 gap-2">
                <Input name="sets" type="number" defaultValue={3} />
                <Input name="targetReps" placeholder="8-12" />
              </div>
              <Button type="submit" className="w-full" disabled={isPending}>
                Ekle
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
