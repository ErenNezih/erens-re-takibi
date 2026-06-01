import type { DayStatus } from "@/lib/tasks";

interface DayStatusDotsProps {
  status: DayStatus;
  compact?: boolean;
}

export function DayStatusDots({ status, compact }: DayStatusDotsProps) {
  const dots = [
    status.hasWeight && { color: "bg-foreground/60", title: "Kilo" },
    status.dietDone && { color: "bg-success", title: "Diyet" },
    status.workoutDone && { color: "bg-workout", title: "Antrenman" },
    status.supplementsDone && { color: "bg-supplement", title: "Supplement" },
    status.cycleDone && { color: "bg-cycle", title: "Kür" },
    status.bloodworkPlanned && { color: "bg-bloodwork", title: "Kan tahlili" },
  ].filter(Boolean) as { color: string; title: string }[];

  if (dots.length === 0) {
    return compact ? null : (
      <span className="text-[10px] text-muted-foreground/50">—</span>
    );
  }

  return (
    <div className={compact ? "flex gap-0.5 justify-center flex-wrap" : "flex gap-1 flex-wrap"}>
      {dots.map((d, i) => (
        <span
          key={i}
          title={d.title}
          className={`${compact ? "h-1.5 w-1.5" : "h-2 w-2"} rounded-full ${d.color}`}
        />
      ))}
    </div>
  );
}
