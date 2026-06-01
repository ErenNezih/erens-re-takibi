"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, CheckCircle2, Circle, ChevronDown, ChevronUp } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import {
  createWorkoutSession,
  deleteWorkoutSession,
  toggleWorkoutComplete,
  createExercise,
  deleteExercise,
} from "@/lib/actions/workouts";
import { BODY_PARTS, formatDateShort, toDateInputValue, today } from "@/lib/utils";
import type { WorkoutSession, WorkoutExercise } from "@prisma/client";

type SessionWithExercises = WorkoutSession & { exercises: WorkoutExercise[] };

interface WorkoutsClientProps {
  sessions: SessionWithExercises[];
}

export function WorkoutsClient({ sessions }: WorkoutsClientProps) {
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [exerciseDialog, setExerciseDialog] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleCreateSession(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await createWorkoutSession(formData);
      toast({ title: "Antrenman eklendi" });
      setOpen(false);
      router.refresh();
    });
  }

  async function handleAddExercise(e: React.FormEvent<HTMLFormElement>, sessionId: string) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("workoutSessionId", sessionId);
    startTransition(async () => {
      await createExercise(formData);
      toast({ title: "Egzersiz eklendi" });
      setExerciseDialog(null);
      router.refresh();
    });
  }

  return (
    <>
      <PageHeader title="Antrenman" description="Antrenman ve egzersiz kayıtları">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Yeni Antrenman
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Antrenman</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreateSession} className="space-y-3">
              <div className="space-y-1">
                <Label>Tarih</Label>
                <Input name="date" type="date" defaultValue={toDateInputValue(today())} required />
              </div>
              <div className="space-y-1">
                <Label>Antrenman Adı</Label>
                <Input name="title" placeholder="Push Day" required />
              </div>
              <div className="space-y-1">
                <Label htmlFor="bodyPart">Bölge</Label>
                <select
                  id="bodyPart"
                  name="bodyPart"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  defaultValue="Göğüs"
                >
                  {BODY_PARTS.map((part) => (
                    <option key={part} value={part}>{part}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="completed" name="completed" />
                <Label htmlFor="completed">Tamamlandı</Label>
              </div>
              <div className="space-y-1">
                <Label>Not</Label>
                <Textarea name="notes" rows={2} />
              </div>
              <Button type="submit" disabled={isPending} className="w-full">Kaydet</Button>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="space-y-4">
        {sessions.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Henüz antrenman kaydı yok
            </CardContent>
          </Card>
        ) : (
          sessions.map((session) => (
            <Card key={session.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        startTransition(async () => {
                          await toggleWorkoutComplete(session.id, !session.completed);
                          router.refresh();
                        })
                      }
                    >
                      {session.completed ? (
                        <CheckCircle2 className="h-6 w-6 text-success" />
                      ) : (
                        <Circle className="h-6 w-6 text-muted-foreground" />
                      )}
                    </button>
                    <div>
                      <CardTitle className="text-base">{session.title}</CardTitle>
                      <p className="text-xs text-muted-foreground">
                        {formatDateShort(session.date)} • {session.bodyPart}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={session.completed ? "success" : "secondary"}>
                      {session.completed ? "Tamamlandı" : "Devam ediyor"}
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setExpandedId(expandedId === session.id ? null : session.id)}
                    >
                      {expandedId === session.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm("Silmek istediğinize emin misiniz?")) {
                          startTransition(async () => {
                            await deleteWorkoutSession(session.id);
                            router.refresh();
                          });
                        }
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {expandedId === session.id && (
                <CardContent>
                  {session.exercises.length > 0 && (
                    <div className="mb-4 overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border text-left">
                            <th className="pb-2 pr-3">Egzersiz</th>
                            <th className="pb-2 pr-3">Set</th>
                            <th className="pb-2 pr-3">Tekrar</th>
                            <th className="pb-2 pr-3">Ağırlık</th>
                            <th className="pb-2 pr-3">RPE</th>
                            <th className="pb-2"></th>
                          </tr>
                        </thead>
                        <tbody>
                          {session.exercises.map((ex) => (
                            <tr key={ex.id} className="border-b border-border/50">
                              <td className="py-2 pr-3 font-medium">{ex.exerciseName}</td>
                              <td className="py-2 pr-3">{ex.sets ?? "—"}</td>
                              <td className="py-2 pr-3">{ex.reps ?? "—"}</td>
                              <td className="py-2 pr-3">{ex.weight != null ? `${ex.weight} kg` : "—"}</td>
                              <td className="py-2 pr-3">{ex.rpe ?? "—"}</td>
                              <td className="py-2">
                                <Button variant="ghost" size="icon" onClick={() => {
                                  startTransition(async () => {
                                    await deleteExercise(ex.id);
                                    router.refresh();
                                  });
                                }}>
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <Dialog open={exerciseDialog === session.id} onOpenChange={(o) => setExerciseDialog(o ? session.id : null)}>
                    <DialogTrigger>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-1" />
                        Egzersiz Ekle
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Egzersiz Ekle</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={(e) => handleAddExercise(e, session.id)} className="space-y-3">
                        <div className="space-y-1">
                          <Label>Egzersiz Adı</Label>
                          <Input name="exerciseName" required />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label>Set</Label>
                            <Input name="sets" type="number" />
                          </div>
                          <div className="space-y-1">
                            <Label>Tekrar</Label>
                            <Input name="reps" type="number" />
                          </div>
                          <div className="space-y-1">
                            <Label>Ağırlık (kg)</Label>
                            <Input name="weight" type="number" step="0.5" />
                          </div>
                          <div className="space-y-1">
                            <Label>RPE (1-10)</Label>
                            <Input name="rpe" type="number" min="1" max="10" />
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Checkbox id={`fail-${session.id}`} name="toFailure" />
                          <Label htmlFor={`fail-${session.id}`}>Tükenişe gidildi</Label>
                        </div>
                        <Button type="submit" disabled={isPending} className="w-full">Ekle</Button>
                      </form>
                    </DialogContent>
                  </Dialog>

                  {session.exercises.length > 0 && (
                    <div className="mt-4">
                      <p className="text-xs text-muted-foreground mb-2">Progressive Overload — Aynı egzersiz geçmişi:</p>
                      {[...new Set(session.exercises.map((e) => e.exerciseName))].map((name) => {
                        const history = sessions
                          .flatMap((s) => s.exercises.filter((e) => e.exerciseName === name))
                          .slice(0, 5);
                        return (
                          <div key={name} className="text-xs mb-1">
                            <span className="font-medium">{name}:</span>{" "}
                            {history.map((h) => h.weight).filter(Boolean).join(" → ")} kg
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </>
  );
}
