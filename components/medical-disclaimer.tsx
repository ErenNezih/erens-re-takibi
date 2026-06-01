import { AlertTriangle } from "lucide-react";

interface MedicalDisclaimerProps {
  text?: string;
  variant?: "default" | "compact";
  className?: string;
}

export function MedicalDisclaimer({ text, variant = "default", className }: MedicalDisclaimerProps) {
  const defaultText =
    "Bu uygulama tıbbi tavsiye vermez. İlaç ve hormon kullanımı yalnızca doktor kontrolünde değerlendirilmelidir.";

  if (variant === "compact") {
    return (
      <p className="text-xs text-warning flex items-start gap-1.5">
        <AlertTriangle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        {text ?? defaultText}
      </p>
    );
  }

  return (
    <div className={`rounded-lg border border-warning/30 bg-warning/10 p-3 flex items-start gap-2 ${className ?? ""}`}>
      <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
      <p className="text-sm text-warning">{text ?? defaultText}</p>
    </div>
  );
}
