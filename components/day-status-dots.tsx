import type { DayStatus } from "@/lib/tasks";
import { cn } from "@/lib/cn";

interface DayStatusDotsProps {
  status: DayStatus;
  compact?: boolean;
}

export function DayStatusDots({ status, compact }: DayStatusDotsProps) {
  const dotClass = compact ? "h-1.5 w-1.5" : "h-2 w-2";

  const dots = [
    status.hasPlannedDiet &&
      status.dietDone && { color: "bg-success", title: "Diyet" },
    status.hasPlannedWorkout &&
      status.workoutDone && { color: "bg-workout", title: "Antrenman" },
    status.hasPlannedSupplements &&
      status.supplementsDone && { color: "bg-supplement", title: "Supplement" },
    status.hasPlannedCycle &&
      status.cycleDone && { color: "bg-cycle", title: "Kür" },
    status.bloodworkPlanned && { color: "bg-bloodwork", title: "Kan tahlili" },
  ].filter(Boolean) as { color: string; title: string }[];

  if (!status.hasWeight && dots.length === 0) {
    return compact ? null : (
      <span className="text-[10px] text-muted-foreground/50">—</span>
    );
  }

  return (
    <div
      className={cn(
        compact ? "flex gap-0.5 justify-center flex-wrap items-center" : "flex gap-1 flex-wrap items-center"
      )}
    >
      {status.hasWeight && (
        <span
          title="Kilo"
          className={cn(
            "font-bold text-muted-foreground leading-none",
            compact ? "text-[8px]" : "text-[9px]"
          )}
        >
          kg
        </span>
      )}
      {dots.map((d, i) => (
        <span
          key={i}
          title={d.title}
          className={cn("rounded-full", dotClass, d.color)}
        />
      ))}
    </div>
  );
}
