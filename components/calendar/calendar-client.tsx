"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, CheckCircle2, Circle } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth } from "date-fns";
import { tr } from "date-fns/locale";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { createPlanItem, togglePlanItem, deletePlanItem } from "@/lib/actions/calendar";
import { PLAN_TYPES, toDateInputValue, today } from "@/lib/utils";
import type { PlanItem } from "@prisma/client";

interface CalendarClientProps {
  items: PlanItem[];
  month: string;
}

const TYPE_COLORS: Record<string, string> = {
  workout: "bg-blue-500/20 text-blue-400",
  cardio: "bg-green-500/20 text-green-400",
  measurement: "bg-purple-500/20 text-purple-400",
  photo: "bg-pink-500/20 text-pink-400",
  supplement: "bg-yellow-500/20 text-yellow-400",
  medication: "bg-orange-500/20 text-orange-400",
  blood_test: "bg-red-500/20 text-red-400",
  doctor: "bg-cyan-500/20 text-cyan-400",
  note: "bg-gray-500/20 text-gray-400",
};

export function CalendarClient({ items, month }: CalendarClientProps) {
  const [open, setOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(toDateInputValue(today()));
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const [year, m] = month.split("-").map(Number);
  const currentMonth = new Date(year, m - 1, 1);
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const startDayOfWeek = monthStart.getDay();
  const paddingDays = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  function navigateMonth(delta: number) {
    const newMonth = new Date(year, m - 1 + delta, 1);
    router.push(`/calendar?month=${format(newMonth, "yyyy-MM")}`);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await createPlanItem(formData);
      toast({ title: "Görev eklendi" });
      setOpen(false);
      router.refresh();
    });
  }

  function getItemsForDay(day: Date) {
    return items.filter((item) => isSameDay(new Date(item.date), day));
  }

  const selectedItems = items.filter((item) =>
    isSameDay(new Date(item.date), new Date(selectedDate))
  );

  return (
    <>
      <PageHeader title="Takvim / Plan" description="Antrenman, ölçüm ve görev planlaması">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigateMonth(-1)}>←</Button>
          <span className="text-sm font-medium min-w-[120px] text-center">
            {format(currentMonth, "MMMM yyyy", { locale: tr })}
          </span>
          <Button variant="outline" size="sm" onClick={() => navigateMonth(1)}>→</Button>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Görev Ekle
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Yeni Görev</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-1">
                <Label>Başlık</Label>
                <Input name="title" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Tür</Label>
                  <select name="type" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue="workout">
                    {PLAN_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label>Tekrarlama</Label>
                  <select name="repeatType" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue="once">
                    <option value="once">Tek seferlik</option>
                    <option value="daily">Günlük</option>
                    <option value="weekly">Haftalık</option>
                    <option value="weekdays">Belirli günler</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Tarih</Label>
                  <Input name="date" type="date" defaultValue={selectedDate} required />
                </div>
                <div className="space-y-1">
                  <Label>Saat</Label>
                  <Input name="time" type="time" />
                </div>
              </div>
              <div className="space-y-1">
                <Label>Açıklama</Label>
                <Textarea name="description" rows={2} />
              </div>
              <Button type="submit" disabled={isPending} className="w-full">Kaydet</Button>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardContent className="p-4">
            <div className="grid grid-cols-7 gap-1 mb-2">
              {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((d) => (
                <div key={d} className="text-center text-xs font-medium text-muted-foreground py-1">{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: paddingDays }).map((_, i) => (
                <div key={`pad-${i}`} className="aspect-square" />
              ))}
              {days.map((day) => {
                const dayItems = getItemsForDay(day);
                const isSelected = isSameDay(day, new Date(selectedDate));
                const isToday = isSameDay(day, new Date());
                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => setSelectedDate(format(day, "yyyy-MM-dd"))}
                    className={`aspect-square rounded-lg border p-1 text-left transition-colors ${
                      isSelected
                        ? "border-primary bg-primary/10"
                        : isToday
                        ? "border-primary/50"
                        : "border-border hover:bg-accent"
                    } ${!isSameMonth(day, currentMonth) ? "opacity-40" : ""}`}
                  >
                    <span className={`text-xs font-medium ${isToday ? "text-primary" : ""}`}>
                      {format(day, "d")}
                    </span>
                    <div className="mt-0.5 space-y-0.5">
                      {dayItems.slice(0, 2).map((item) => (
                        <div
                          key={item.id}
                          className={`text-[9px] px-1 rounded truncate ${TYPE_COLORS[item.type] ?? TYPE_COLORS.note}`}
                        >
                          {item.title}
                        </div>
                      ))}
                      {dayItems.length > 2 && (
                        <div className="text-[9px] text-muted-foreground">+{dayItems.length - 2}</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {format(new Date(selectedDate), "dd MMMM yyyy", { locale: tr })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {selectedItems.length === 0 ? (
              <p className="text-sm text-muted-foreground">Bu gün için görev yok</p>
            ) : (
              selectedItems.map((item) => {
                const typeLabel = PLAN_TYPES.find((t) => t.value === item.type)?.label ?? item.type;
                return (
                  <div key={item.id} className="flex items-start gap-2 p-2 rounded-lg border border-border">
                    <button
                      type="button"
                      onClick={() =>
                        startTransition(async () => {
                          await togglePlanItem(item.id, !item.completed);
                          router.refresh();
                        })
                      }
                      className="mt-0.5"
                    >
                      {item.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-success" />
                      ) : (
                        <Circle className="h-5 w-5 text-muted-foreground" />
                      )}
                    </button>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium ${item.completed ? "line-through text-muted-foreground" : ""}`}>
                        {item.title}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="secondary" className="text-[10px]">{typeLabel}</Badge>
                        {item.time && <span className="text-[10px] text-muted-foreground">{item.time}</span>}
                      </div>
                      {item.description && (
                        <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => {
                        startTransition(async () => {
                          await deletePlanItem(item.id);
                          router.refresh();
                        });
                      }}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
