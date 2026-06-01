"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import type { WorkoutTemplate, WorkoutExerciseTemplate } from "@prisma/client";

type TemplateWithExercises = WorkoutTemplate & { exercises: WorkoutExerciseTemplate[] };

export function WorkoutTemplateManager({ templates }: { templates: TemplateWithExercises[] }) {
  const [open, setOpen] = useState(false);
  const [exOpen, setExOpen] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold">Antrenman Şablonları</h2>
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

      {templates.length === 0 ? (
        <p className="text-center text-muted-foreground py-8 text-sm">Henüz şablon yok</p>
      ) : (
        templates.map((tpl) => (
          <Card key={tpl.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{weekdayLabel(tpl.weekday)} — {tpl.name}</CardTitle>
                <Button variant="ghost" size="icon" onClick={() => {
                  if (confirm("Silinsin mi?")) {
                    startTransition(async () => {
                      await deleteWorkoutTemplate(tpl.id);
                      router.refresh();
                    });
                  }
                }}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {tpl.exercises.map((ex) => (
                <div key={ex.id} className="flex justify-between text-sm py-1 border-b border-border/50 last:border-0">
                  <span>{ex.name} — {ex.sets}x{ex.targetReps}</span>
                  <Button variant="ghost" size="icon" onClick={() => {
                    startTransition(async () => {
                      await deleteExerciseTemplate(ex.id);
                      router.refresh();
                    });
                  }}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              ))}
              <Dialog open={exOpen === tpl.id} onOpenChange={(o) => setExOpen(o ? tpl.id : null)}>
                <DialogTrigger>
                  <Button variant="outline" size="sm" className="w-full"><Plus className="h-3 w-3 mr-1" />Hareket</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Hareket Ekle</DialogTitle></DialogHeader>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      const fd = new FormData(e.currentTarget);
                      fd.set("workoutTemplateId", tpl.id);
                      startTransition(async () => {
                        await addExerciseTemplate(fd);
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
                    <Button type="submit" className="w-full" disabled={isPending}>Ekle</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
