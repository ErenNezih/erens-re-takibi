"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { WarningBox } from "@/components/warning-box";
import { toast } from "@/components/ui/use-toast";
import { createPlan, deletePlan, togglePlanActive } from "@/lib/actions/plans";
import { toDateInputValue, today, weekdayLabel, WEEKDAY_LABELS } from "@/lib/date";
import { PLAN_TYPES, CYCLE_DISCLAIMER } from "@/lib/tasks";
import type { Plan } from "@prisma/client";

const TAB_CONFIG = [
  { type: PLAN_TYPES.DIET, label: "Diyet" },
  { type: PLAN_TYPES.SUPPLEMENT, label: "Supplement" },
  { type: PLAN_TYPES.CYCLE, label: "Kür/İlaç" },
  { type: PLAN_TYPES.BLOODWORK, label: "Kan" },
] as const;

interface PlansClientProps {
  plans: Plan[];
  activeTab: string;
}

export function PlansClient({ plans, activeTab }: PlansClientProps) {
  const [open, setOpen] = useState(false);
  const [selectedDays, setSelectedDays] = useState<number[]>([1, 2, 3, 4, 5, 6, 7]);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const filtered = plans.filter((p) => p.type === activeTab);

  function toggleDay(day: number) {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("type", activeTab);
    selectedDays.forEach((d) => formData.append("weekdays", String(d)));
    startTransition(async () => {
      await createPlan(formData);
      toast({ title: "Plan eklendi" });
      setOpen(false);
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Planlar</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Ekle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {TAB_CONFIG.find((t) => t.type === activeTab)?.label} Ekle
              </DialogTitle>
            </DialogHeader>
            {activeTab === PLAN_TYPES.CYCLE && <WarningBox text={CYCLE_DISCLAIMER} />}
            <form onSubmit={handleSubmit} className="space-y-3 mt-2">
              <div className="space-y-1">
                <Label>Ad</Label>
                <Input name="name" required />
              </div>
              {activeTab === PLAN_TYPES.CYCLE && (
                <div className="space-y-1">
                  <Label>Kısaltma</Label>
                  <Input name="abbreviation" placeholder="Opsiyonel" />
                </div>
              )}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label>Başlangıç</Label>
                  <Input name="startDate" type="date" defaultValue={toDateInputValue(today())} required />
                </div>
                <div className="space-y-1">
                  <Label>Bitiş</Label>
                  <Input name="endDate" type="date" />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Günler</Label>
                <div className="flex flex-wrap gap-1">
                  {WEEKDAY_LABELS.map((label, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => toggleDay(i + 1)}
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border min-h-[36px] ${
                        selectedDays.includes(i + 1)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              {(activeTab === PLAN_TYPES.DIET || activeTab === PLAN_TYPES.BLOODWORK) && (
                <div className="space-y-1">
                  <Label>İçerik / Not</Label>
                  <Textarea name="content" rows={4} />
                </div>
              )}
              {activeTab === PLAN_TYPES.CYCLE && (
                <label className="flex items-center gap-2 min-h-[44px]">
                  <input type="checkbox" name="doctorSupervised" className="h-4 w-4" />
                  <span className="text-sm">Doktor kontrolünde</span>
                </label>
              )}
              <label className="flex items-center gap-2 min-h-[44px]">
                <input type="checkbox" name="active" defaultChecked className="h-4 w-4" />
                <span className="text-sm">Aktif</span>
              </label>
              <Button type="submit" className="w-full h-11" disabled={isPending}>
                Kaydet
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {activeTab === PLAN_TYPES.CYCLE && <WarningBox text={CYCLE_DISCLAIMER} />}

      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-12 text-sm">Henüz plan yok</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((plan) => (
            <div key={plan.id} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold">{plan.name}</p>
                    {plan.abbreviation && <Badge variant="secondary">{plan.abbreviation}</Badge>}
                    <Badge variant={plan.active ? "success" : "secondary"}>
                      {plan.active ? "Aktif" : "Pasif"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {plan.weekdays.split(",").map((d) => weekdayLabel(parseInt(d))).join(", ")}
                  </p>
                  {plan.content && (
                    <p className="text-sm mt-2 whitespace-pre-wrap text-muted-foreground">{plan.content}</p>
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      startTransition(async () => {
                        await togglePlanActive(plan.id, !plan.active);
                        router.refresh();
                      })
                    }
                  >
                    {plan.active ? "Kapat" : "Aç"}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      if (confirm("Silinsin mi?")) {
                        startTransition(async () => {
                          await deletePlan(plan.id);
                          router.refresh();
                        });
                      }
                    }}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
