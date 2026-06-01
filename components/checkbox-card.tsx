"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/cn";

interface CheckboxCardProps {
  label: string;
  subtitle?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  color?: "success" | "workout" | "supplement" | "cycle" | "bloodwork" | "default";
  disabled?: boolean;
}

const colorMap = {
  success: "border-success/40 bg-success/10",
  workout: "border-workout/40 bg-workout/10",
  supplement: "border-supplement/40 bg-supplement/10",
  cycle: "border-cycle/40 bg-cycle/10",
  bloodwork: "border-bloodwork/40 bg-bloodwork/10",
  default: "border-border bg-card",
};

const dotMap = {
  success: "bg-success",
  workout: "bg-workout",
  supplement: "bg-supplement",
  cycle: "bg-cycle",
  bloodwork: "bg-bloodwork",
  default: "bg-primary",
};

export function CheckboxCard({
  label,
  subtitle,
  checked,
  onChange,
  color = "default",
  disabled,
}: CheckboxCardProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "w-full flex items-center gap-3 p-4 rounded-xl border min-h-[56px] text-left transition-all active:scale-[0.98]",
        checked ? colorMap[color] : "border-border bg-card",
        disabled && "opacity-50 pointer-events-none"
      )}
    >
      <div
        className={cn(
          "flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-colors",
          checked ? `${dotMap[color]} border-transparent` : "border-muted-foreground/40"
        )}
      >
        {checked && <Check className="h-4 w-4 text-white" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn("font-medium text-sm", checked && "line-through text-muted-foreground")}>
          {label}
        </p>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{subtitle}</p>
        )}
      </div>
    </button>
  );
}
