import { cn } from "@/lib/cn";

type BadgeVariant = "done" | "missing" | "none" | "partial";

interface StatusBadgeProps {
  variant: BadgeVariant;
  label?: string;
  className?: string;
}

const styles: Record<BadgeVariant, string> = {
  done: "bg-success/15 text-success border-success/30",
  missing: "bg-destructive/10 text-destructive border-destructive/30",
  partial: "bg-supplement/15 text-supplement border-supplement/30",
  none: "bg-muted text-muted-foreground border-border",
};

export function StatusBadge({ variant, label, className }: StatusBadgeProps) {
  const text =
    label ??
    (variant === "done"
      ? "Tamamlandı"
      : variant === "missing"
        ? "Eksik"
        : variant === "partial"
          ? "Kısmen"
          : "Plan yok");

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        styles[variant],
        className
      )}
    >
      {text}
    </span>
  );
}
