"use client";

import { useRouter } from "next/navigation";
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  getDay,
} from "date-fns";
import { ChevronLeft, ChevronRight, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DayStatusDots } from "@/components/day-status-dots";
import { toDateInputValue, today, formatMonthYear, isPastDate, isFutureDate } from "@/lib/date";
import type { DayStatus } from "@/lib/tasks";
import { cn } from "@/lib/cn";

interface CalendarMonthViewProps {
  year: number;
  month: number;
  statusMap: Map<string, DayStatus>;
}

export function CalendarMonthView({ year, month, statusMap }: CalendarMonthViewProps) {
  const router = useRouter();
  const currentMonth = new Date(year, month - 1, 1);
  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const startPad = (getDay(startOfMonth(currentMonth)) + 6) % 7;
  const todayDate = today();

  function navigate(delta: number) {
    const d = new Date(year, month - 1 + delta, 1);
    router.push(`/calendar?year=${d.getFullYear()}&month=${d.getMonth() + 1}`);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-lg font-semibold capitalize">
          {formatMonthYear(currentMonth)}
        </h2>
        <Button variant="ghost" size="icon" onClick={() => navigate(1)}>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"].map((d) => (
          <div key={d} className="text-center text-xs text-muted-foreground py-1 font-medium">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: startPad }).map((_, i) => (
          <div key={`pad-${i}`} />
        ))}
        {days.map((day) => {
          const key = toDateInputValue(day);
          const status = statusMap.get(key) ?? {
            hasWeight: false,
            dietDone: false,
            workoutDone: false,
            supplementsDone: false,
            cycleDone: false,
            bloodworkPlanned: false,
            bloodworkDone: false,
            hasPlannedDiet: false,
            hasPlannedWorkout: false,
            hasPlannedSupplements: false,
            hasPlannedCycle: false,
            allComplete: false,
            hasIncomplete: false,
            isNeutral: true,
          };
          const isToday = isSameDay(day, todayDate);
          const isPast = isPastDate(day);
          const isFuture = isFutureDate(day);

          const showCompleteBadge = isPast && status.allComplete;
          const showIncompleteBadge =
            (isPast || isToday) && !isFuture && status.hasIncomplete && !status.allComplete;

          return (
            <button
              key={key}
              type="button"
              onClick={() => router.push(`/day/${key}`)}
              className={cn(
                "relative aspect-square rounded-xl border p-1 flex flex-col items-center justify-between min-h-[52px] transition-colors active:scale-95",
                isToday
                  ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                  : "border-border bg-card hover:bg-accent/50",
                showCompleteBadge && "border-success/50 bg-success/5",
                showIncompleteBadge && isToday && "border-supplement/50"
              )}
            >
              {showCompleteBadge && (
                <Check className="absolute top-0.5 right-0.5 h-3 w-3 text-success" />
              )}
              {showIncompleteBadge && (
                <AlertCircle
                  className={cn(
                    "absolute top-0.5 right-0.5 h-3 w-3",
                    isToday ? "text-supplement" : "text-destructive/80"
                  )}
                />
              )}
              <span
                className={cn(
                  "text-sm font-medium leading-none",
                  isToday && "text-primary"
                )}
              >
                {format(day, "d")}
              </span>
              <DayStatusDots status={status} compact />
            </button>
          );
        })}
      </div>
    </div>
  );
}
