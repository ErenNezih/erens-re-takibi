"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Save, Download } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/use-toast";
import { updateSettings } from "@/lib/actions/settings";
import { createPhase } from "@/lib/actions/substances";
import { exportAllData } from "@/lib/actions/export";
import { exportToCSV, exportToJSON, toDateInputValue } from "@/lib/utils";
import type { UserSetting, Phase } from "@prisma/client";

interface SettingsClientProps {
  settings: UserSetting;
  phases: Phase[];
}

export function SettingsClient({ settings, phases }: SettingsClientProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  async function handleSettingsSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await updateSettings(formData);
      toast({ title: "Ayarlar kaydedildi" });
      router.refresh();
    });
  }

  async function handlePhaseSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      await createPhase(formData);
      toast({ title: "Faz oluşturuldu" });
      router.refresh();
    });
  }

  async function handleExportJSON() {
    const data = await exportAllData();
    exportToJSON(data, `cpt-export-${new Date().toISOString().split("T")[0]}.json`);
    toast({ title: "JSON export tamamlandı" });
  }

  async function handleExportCSV() {
    const data = await exportAllData();
    if (data.dailyLogs.length > 0) {
      exportToCSV(
        data.dailyLogs.map((l) => ({
          date: l.date,
          morningWeight: l.morningWeight,
          eveningWeight: l.eveningWeight,
          caloriesIn: l.caloriesIn,
          protein: l.protein,
          steps: l.steps,
          workoutDone: l.workoutDone,
        })),
        `cpt-daily-${new Date().toISOString().split("T")[0]}.csv`
      );
    }
    toast({ title: "CSV export tamamlandı" });
  }

  return (
    <>
      <PageHeader title="Ayarlar" description="Hedefler, fazlar ve veri yönetimi" />

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">Genel</TabsTrigger>
          <TabsTrigger value="targets">Hedefler</TabsTrigger>
          <TabsTrigger value="phases">Fazlar</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Genel Ayarlar</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSettingsSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Başlangıç Tarihi</Label>
                    <Input id="startDate" name="startDate" type="date" defaultValue={toDateInputValue(settings.startDate)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="theme">Tema</Label>
                    <select id="theme" name="theme" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" defaultValue={settings.theme}>
                      <option value="dark">Koyu</option>
                      <option value="light">Açık</option>
                      <option value="system">Sistem</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="startWeight">Başlangıç Kilosu (kg)</Label>
                    <Input id="startWeight" name="startWeight" type="number" step="0.1" defaultValue={settings.startWeight ?? ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="targetWeight">Hedef Kilo (kg)</Label>
                    <Input id="targetWeight" name="targetWeight" type="number" step="0.1" defaultValue={settings.targetWeight ?? ""} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="targetWaist">Hedef Bel (cm)</Label>
                    <Input id="targetWaist" name="targetWaist" type="number" step="0.1" defaultValue={settings.targetWaist ?? ""} />
                  </div>
                </div>

                <input type="hidden" name="calorieTargetMin" value={settings.calorieTargetMin} />
                <input type="hidden" name="calorieTargetMax" value={settings.calorieTargetMax} />
                <input type="hidden" name="proteinTarget" value={settings.proteinTarget} />
                <input type="hidden" name="carbTarget" value={settings.carbTarget} />
                <input type="hidden" name="fatTarget" value={settings.fatTarget} />
                <input type="hidden" name="waterTargetMin" value={settings.waterTargetMin} />
                <input type="hidden" name="waterTargetMax" value={settings.waterTargetMax} />
                <input type="hidden" name="stepTargetMin" value={settings.stepTargetMin} />
                <input type="hidden" name="stepTargetMax" value={settings.stepTargetMax} />

                <div className="rounded-lg border border-border p-4 bg-muted/30">
                  <p className="text-sm text-muted-foreground">
                    Uygulama şifresi <code className="text-xs bg-muted px-1 rounded">APP_PASSWORD</code> environment variable ile ayarlanır.
                    Vercel dashboard&apos;dan değiştirebilirsiniz.
                  </p>
                </div>

                <Button type="submit" disabled={isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  Kaydet
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="targets" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Günlük Hedefler</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSettingsSubmit} className="space-y-4">
                <input type="hidden" name="startDate" value={toDateInputValue(settings.startDate)} />
                <input type="hidden" name="startWeight" value={settings.startWeight ?? ""} />
                <input type="hidden" name="targetWeight" value={settings.targetWeight ?? ""} />
                <input type="hidden" name="targetWaist" value={settings.targetWaist ?? ""} />
                <input type="hidden" name="theme" value={settings.theme} />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Kalori Min</Label>
                    <Input name="calorieTargetMin" type="number" defaultValue={settings.calorieTargetMin} />
                  </div>
                  <div className="space-y-2">
                    <Label>Kalori Max</Label>
                    <Input name="calorieTargetMax" type="number" defaultValue={settings.calorieTargetMax} />
                  </div>
                  <div className="space-y-2">
                    <Label>Protein (g)</Label>
                    <Input name="proteinTarget" type="number" defaultValue={settings.proteinTarget} />
                  </div>
                  <div className="space-y-2">
                    <Label>Karbonhidrat (g)</Label>
                    <Input name="carbTarget" type="number" defaultValue={settings.carbTarget} />
                  </div>
                  <div className="space-y-2">
                    <Label>Yağ (g)</Label>
                    <Input name="fatTarget" type="number" defaultValue={settings.fatTarget} />
                  </div>
                  <div className="space-y-2">
                    <Label>Su Min (L)</Label>
                    <Input name="waterTargetMin" type="number" step="0.1" defaultValue={settings.waterTargetMin} />
                  </div>
                  <div className="space-y-2">
                    <Label>Su Max (L)</Label>
                    <Input name="waterTargetMax" type="number" step="0.1" defaultValue={settings.waterTargetMax} />
                  </div>
                  <div className="space-y-2">
                    <Label>Adım Min</Label>
                    <Input name="stepTargetMin" type="number" defaultValue={settings.stepTargetMin} />
                  </div>
                  <div className="space-y-2">
                    <Label>Adım Max</Label>
                    <Input name="stepTargetMax" type="number" defaultValue={settings.stepTargetMax} />
                  </div>
                </div>
                <Button type="submit" disabled={isPending}>
                  <Save className="h-4 w-4 mr-2" />
                  Hedefleri Kaydet
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="phases" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Yeni Faz Oluştur</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePhaseSubmit} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Faz Adı</Label>
                    <Input name="name" placeholder="Definasyon, Clean Bulk..." required />
                  </div>
                  <div className="space-y-1">
                    <Label>Başlangıç</Label>
                    <Input name="startDate" type="date" defaultValue={toDateInputValue(new Date())} required />
                  </div>
                  <div className="space-y-1">
                    <Label>Bitiş</Label>
                    <Input name="endDate" type="date" />
                  </div>
                  <div className="space-y-1">
                    <Label>Kalori Hedefi</Label>
                    <Input name="calorieTarget" type="number" />
                  </div>
                  <div className="space-y-1">
                    <Label>Adım Hedefi</Label>
                    <Input name="stepTarget" type="number" />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Hedef</Label>
                  <Input name="goal" />
                </div>
                <div className="flex items-center gap-2">
                  <input type="checkbox" id="phaseActive" name="active" defaultChecked className="rounded" />
                  <Label htmlFor="phaseActive">Aktif faz olarak ayarla</Label>
                </div>
                <Button type="submit" disabled={isPending}>Faz Oluştur</Button>
              </form>
            </CardContent>
          </Card>

          {phases.map((phase) => (
            <Card key={phase.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{phase.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {toDateInputValue(phase.startDate)}
                      {phase.endDate && ` — ${toDateInputValue(phase.endDate)}`}
                    </p>
                    {phase.goal && <p className="text-sm mt-1">{phase.goal}</p>}
                  </div>
                  {phase.active && (
                    <span className="text-xs bg-success/20 text-success px-2 py-1 rounded-full">Aktif</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="export" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Veri Export</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Tüm verilerinizi JSON veya CSV formatında indirebilirsiniz.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleExportJSON}>
                  <Download className="h-4 w-4 mr-2" />
                  JSON Export
                </Button>
                <Button variant="outline" onClick={handleExportCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  CSV Export (Günlük)
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
