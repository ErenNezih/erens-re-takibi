"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, LineChart } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartCard } from "@/components/charts/chart-card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import { createMeasurement, deleteMeasurement } from "@/lib/actions/measurements";
import { formatDateShort, toDateInputValue, today } from "@/lib/utils";
import type { BodyMeasurement } from "@prisma/client";

interface MeasurementsClientProps {
  measurements: BodyMeasurement[];
}

const MEASUREMENT_FIELDS = [
  { key: "weight", label: "Kilo (kg)" },
  { key: "waist", label: "Bel (cm)" },
  { key: "abdomen", label: "Göbek (cm)" },
  { key: "arm", label: "Kol (cm)" },
  { key: "shoulder", label: "Omuz (cm)" },
  { key: "chest", label: "Göğüs (cm)" },
  { key: "hip", label: "Kalça (cm)" },
  { key: "thigh", label: "Bacak (cm)" },
  { key: "neck", label: "Boyun (cm)" },
  { key: "estimatedBodyFat", label: "Tahmini Yağ (%)" },
] as const;

export function MeasurementsClient({ measurements }: MeasurementsClientProps) {
  const [open, setOpen] = useState(false);
  const [chartField, setChartField] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await createMeasurement(formData);
      toast({ title: "Eklendi", description: "Ölçüm kaydedildi." });
      setOpen(false);
      router.refresh();
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Bu ölçümü silmek istediğinize emin misiniz?")) return;
    startTransition(async () => {
      await deleteMeasurement(id);
      toast({ title: "Silindi" });
      router.refresh();
    });
  }

  const chartData = measurements
    .slice()
    .reverse()
    .map((m) => ({
      date: m.date,
      value: (m as Record<string, unknown>)[chartField ?? "waist"] as number | null,
    }))
    .filter((d) => d.value != null);

  const chartLabel = MEASUREMENT_FIELDS.find((f) => f.key === chartField)?.label ?? "";

  return (
    <>
      <PageHeader title="Vücut Ölçüleri" description="Tarih bazlı vücut ölçüm takibi">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Yeni Ölçüm
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Yeni Ölçüm Ekle</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="date">Tarih</Label>
                <Input id="date" name="date" type="date" defaultValue={toDateInputValue(today())} required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                {MEASUREMENT_FIELDS.map((field) => (
                  <div key={field.key} className="space-y-1">
                    <Label htmlFor={field.key}>{field.label}</Label>
                    <Input id={field.key} name={field.key} type="number" step="0.1" />
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Not</Label>
                <Textarea id="notes" name="notes" rows={2} />
              </div>
              <Button type="submit" disabled={isPending} className="w-full">
                Kaydet
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {chartField && (
        <div className="mb-6">
          <ChartCard
            title={`${chartLabel} Grafiği`}
            data={chartData}
            lines={[{ key: "value", color: "hsl(217, 91%, 60%)", name: chartLabel }]}
          />
          <Button variant="ghost" size="sm" className="mt-2" onClick={() => setChartField(null)}>
            Grafiği Kapat
          </Button>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Ölçüm Geçmişi</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-2 pr-4 font-medium">Tarih</th>
                {MEASUREMENT_FIELDS.map((f) => (
                  <th key={f.key} className="pb-2 pr-4 font-medium whitespace-nowrap">
                    <button
                      type="button"
                      className="flex items-center gap-1 hover:text-primary"
                      onClick={() => setChartField(f.key)}
                    >
                      {f.label.split(" ")[0]}
                      <LineChart className="h-3 w-3" />
                    </button>
                  </th>
                ))}
                <th className="pb-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {measurements.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-8 text-center text-muted-foreground">
                    Henüz ölçüm kaydı yok
                  </td>
                </tr>
              ) : (
                measurements.map((m) => (
                  <tr key={m.id} className="border-b border-border/50">
                    <td className="py-2 pr-4 whitespace-nowrap">{formatDateShort(m.date)}</td>
                    {MEASUREMENT_FIELDS.map((f) => (
                      <td key={f.key} className="py-2 pr-4">
                        {(m as Record<string, unknown>)[f.key]?.toString() ?? "—"}
                      </td>
                    ))}
                    <td className="py-2">
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(m.id)} disabled={isPending}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </>
  );
}
