import { AlertTriangle } from "lucide-react";

interface WarningBoxProps {
  text?: string;
}

export function WarningBox({ text }: WarningBoxProps) {
  return (
    <div className="rounded-xl border border-cycle/30 bg-cycle/10 p-3 flex items-start gap-2">
      <AlertTriangle className="h-4 w-4 text-cycle shrink-0 mt-0.5" />
      <p className="text-xs text-cycle leading-relaxed">
        {text ??
          "Bu bölüm yalnızca kişisel kayıt içindir. Uygulama tıbbi tavsiye, doz önerisi veya kullanım yönlendirmesi vermez. Sağlık kararları doktor kontrolünde verilmelidir."}
      </p>
    </div>
  );
}
