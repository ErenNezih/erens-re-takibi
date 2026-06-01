"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, Save } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { upsertDailyLog, copyPreviousDay } from "@/lib/actions/daily";
import { toDateInputValue, today } from "@/lib/utils";
import type { DailyLog } from "@prisma/client";

interface DailyPageClientProps {
  initialLog: DailyLog | null;
  initialDate: string;
}

export function DailyPageClient({ initialLog, initialDate }: DailyPageClientProps) {
  const [date, setDate] = useState(initialDate);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDateChange(newDate: string) {
    setDate(newDate);
    router.push(`/daily?date=${newDate}`);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("date", date);

    startTransition(async () => {
      await upsertDailyLog(formData);
      toast({ title: "Kaydedildi", description: "Günlük kayıt güncellendi." });
      router.refresh();
    });
  }

  async function handleCopyPrevious() {
    startTransition(async () => {
      const result = await copyPreviousDay(date);
      if (result?.error) {
        toast({ title: "Hata", description: result.error, variant: "destructive" });
      } else {
        toast({ title: "Kopyalandı", description: "Dünün verileri kopyalandı (kilo hariç)." });
        router.refresh();
      }
    });
  }

  const log = initialLog;

  return (
    <>
      <PageHeader title="Günlük Kayıt" description="Günün tüm verilerini tek sayfadan girin">
        <Input
          type="date"
          value={date}
          onChange={(e) => handleDateChange(e.target.value)}
          className="w-auto"
        />
        <Button variant="outline" size="sm" onClick={() => handleDateChange(toDateInputValue(today()))}>
          Bugün
        </Button>
        <Button variant="outline" size="sm" onClick={handleCopyPrevious} disabled={isPending}>
          <Copy className="h-4 w-4 mr-1" />
          Dünü Kopyala
        </Button>
      </PageHeader>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Kilo & Beslenme</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="morningWeight">Sabah Kilosu (kg)</Label>
                <Input id="morningWeight" name="morningWeight" type="number" step="0.1" defaultValue={log?.morningWeight ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eveningWeight">Akşam Kilosu (kg)</Label>
                <Input id="eveningWeight" name="eveningWeight" type="number" step="0.1" defaultValue={log?.eveningWeight ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="caloriesIn">Toplam Kalori</Label>
                <Input id="caloriesIn" name="caloriesIn" type="number" defaultValue={log?.caloriesIn ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="protein">Protein (g)</Label>
                <Input id="protein" name="protein" type="number" defaultValue={log?.protein ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="carbs">Karbonhidrat (g)</Label>
                <Input id="carbs" name="carbs" type="number" defaultValue={log?.carbs ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fat">Yağ (g)</Label>
                <Input id="fat" name="fat" type="number" defaultValue={log?.fat ?? ""} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Aktivite & Sağlık</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="activeCalories">Aktif Kalori</Label>
                <Input id="activeCalories" name="activeCalories" type="number" defaultValue={log?.activeCalories ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="steps">Adım Sayısı</Label>
                <Input id="steps" name="steps" type="number" defaultValue={log?.steps ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="waterLiters">Su (litre)</Label>
                <Input id="waterLiters" name="waterLiters" type="number" step="0.1" defaultValue={log?.waterLiters ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sleepHours">Uyku (saat)</Label>
                <Input id="sleepHours" name="sleepHours" type="number" step="0.5" defaultValue={log?.sleepHours ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="energyLevel">Enerji (1-10)</Label>
                <Input id="energyLevel" name="energyLevel" type="number" min="1" max="10" defaultValue={log?.energyLevel ?? ""} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hungerLevel">Açlık (1-10)</Label>
                <Input id="hungerLevel" name="hungerLevel" type="number" min="1" max="10" defaultValue={log?.hungerLevel ?? ""} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Antrenman</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="workoutDone"
                  name="workoutDone"
                  defaultChecked={log?.workoutDone ?? false}
                  className="h-4 w-4 rounded border border-primary"
                />
                <Label htmlFor="workoutDone">Antrenman yapıldı</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="cardioDone"
                  name="cardioDone"
                  defaultChecked={log?.cardioDone ?? false}
                  className="h-4 w-4 rounded border border-primary"
                />
                <Label htmlFor="cardioDone">Kardiyo yapıldı</Label>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Not</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea name="notes" placeholder="Günün genel notu..." defaultValue={log?.notes ?? ""} rows={4} />
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex justify-end">
          <Button type="submit" disabled={isPending}>
            <Save className="h-4 w-4 mr-2" />
            {isPending ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>
      </form>
    </>
  );
}
