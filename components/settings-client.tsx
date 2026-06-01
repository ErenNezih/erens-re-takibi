"use client";

import { useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import { Save, Download, Upload, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { updateSettings, exportDataAction, importDataAction } from "@/lib/actions/settings";
import { logoutAction } from "@/lib/actions/auth";
import type { UserSetting } from "@prisma/client";

interface SettingsClientProps {
  settings: UserSetting;
}

export function SettingsClient({ settings }: SettingsClientProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleExport() {
    const data = await exportDataAction();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `fitcycle-export-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Export tamamlandı" });
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    startTransition(async () => {
      try {
        await importDataAction(text);
        toast({ title: "Import tamamlandı" });
        router.refresh();
      } catch {
        toast({ title: "Import hatası", variant: "destructive" });
      }
    });
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Ayarlar</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Görünüm</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              startTransition(async () => {
                await updateSettings(new FormData(e.currentTarget));
                toast({ title: "Kaydedildi" });
                router.refresh();
              });
            }}
            className="space-y-3"
          >
            <div className="space-y-1">
              <Label>Tema</Label>
              <select
                name="theme"
                defaultValue={settings.theme}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="dark">Koyu</option>
                <option value="light">Açık</option>
                <option value="system">Sistem</option>
              </select>
            </div>
            <Button type="submit" className="w-full h-11" disabled={isPending}>
              <Save className="h-4 w-4 mr-2" />
              Kaydet
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Veri</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full h-11" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            JSON Export
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            className="hidden"
            onChange={handleImport}
          />
          <Button
            variant="outline"
            className="w-full h-11"
            onClick={() => fileRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            JSON Import
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">
            Uygulama şifresi{" "}
            <code className="bg-muted px-1 rounded">APP_PASSWORD</code> environment variable ile
            ayarlanır.
          </p>
        </CardContent>
      </Card>

      <form action={logoutAction}>
        <Button variant="ghost" className="w-full text-muted-foreground">
          <LogOut className="h-4 w-4 mr-2" />
          Çıkış
        </Button>
      </form>
    </div>
  );
}
