import { formatDateShort } from "@/lib/date";

interface HistoryEntry {
  date: Date;
  bestSet: { weight: number | null; reps: number | null } | null;
}

interface WorkoutHistoryTableProps {
  exerciseName: string;
  history: HistoryEntry[];
}

export function WorkoutHistoryTable({ exerciseName, history }: WorkoutHistoryTableProps) {
  if (history.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-2">Henüz kayıt yok</p>
    );
  }

  const latest = history[0]?.bestSet;
  const previous = history[1]?.bestSet;
  const diff =
    latest?.weight != null && previous?.weight != null
      ? latest.weight - previous.weight
      : null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="font-medium text-sm">{exerciseName}</p>
        {diff != null && (
          <span className={`text-xs font-medium ${diff >= 0 ? "text-success" : "text-warning"}`}>
            {diff >= 0 ? "+" : ""}{diff} kg
          </span>
        )}
      </div>
      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/30">
              <th className="text-left p-2 font-medium">Tarih</th>
              <th className="text-right p-2 font-medium">Ağırlık</th>
              <th className="text-right p-2 font-medium">Tekrar</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h, i) => (
              <tr key={i} className="border-b border-border/50 last:border-0">
                <td className="p-2">{formatDateShort(h.date)}</td>
                <td className="p-2 text-right font-medium">
                  {h.bestSet?.weight != null ? `${h.bestSet.weight} kg` : "—"}
                </td>
                <td className="p-2 text-right">{h.bestSet?.reps ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
