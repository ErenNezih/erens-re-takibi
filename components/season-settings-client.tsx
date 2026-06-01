"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/use-toast";
import { startSeason, endSeason } from "@/lib/actions/season";
import {
  SEASON_TYPE_LABELS,
  SEASON_TYPES,
  type SeasonType,
} from "@/lib/season";
import { formatDateShort, toDateInputValue, today } from "@/lib/date";
import type { SeasonListSummary } from "@/lib/season-report";
import type { Season } from "@prisma/client";

interface SeasonSettingsClientProps {
  activeSeason: Season | null;
  activeSummary: SeasonListSummary | null;
}

export function SeasonSettingsClient({
  activeSeason,
  activeSummary,
}: SeasonSettingsClientProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const seasonTypes = Object.values(SEASON_TYPES);

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center gap-3">
        <Link href="/calendar">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Süreç Ayarları</h1>
      </div>

      {activeSeason ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Aktif Süreç</CardTitle>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="font-medium">{activeSeason.name}</p>
            <p className="text-muted-foreground">
              {SEASON_TYPE_LABELS[activeSeason.type as SeasonType] ?? activeSeason.type}
            </p>
            <p className="text-xs text-muted-foreground">
              Başlangıç: {formatDateShort(activeSeason.startDate)}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Aktif süreç yok.</p>
          </CardContent>
        </Card>
      )}

      {activeSeason && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Süreci Bitir</CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                startTransition(async () => {
                  await endSeason(new FormData(e.currentTarget));
                  toast({ title: "Süreç bitirildi" });
                  router.refresh();
                });
              }}
              className="space-y-3"
            >
              <div className="space-y-1">
                <Label>Bitiş tarihi</Label>
                <Input
                  name="endDate"
                  type="date"
                  defaultValue={toDateInputValue(today())}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Bitiş kilosu</Label>
                <Input
                  name="endWeight"
                  type="number"
                  step="0.1"
                  defaultValue={activeSummary?.currentWeight ?? ""}
                />
              </div>
              <div className="space-y-1">
                <Label>Kapanış notu</Label>
                <Textarea name="note" rows={2} placeholder="Kapanış notu..." />
              </div>
              <Button type="submit" variant="destructive" className="w-full h-11" disabled={isPending}>
                Süreci Bitir
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            {activeSeason ? "Yeni Süreç Başlat" : "Süreç Başlat"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeSeason && (
            <p className="text-xs text-muted-foreground mb-3">
              Yeni süreç başlatıldığında mevcut aktif süreç otomatik kapatılır.
            </p>
          )}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              startTransition(async () => {
                await startSeason(new FormData(e.currentTarget));
                toast({ title: "Süreç başlatıldı" });
                router.refresh();
              });
            }}
            className="space-y-3"
          >
            <div className="space-y-1">
              <Label>Süreç adı</Label>
              <Input name="name" placeholder="Definasyon Süreci" required />
            </div>
            <div className="space-y-1">
              <Label>Süreç tipi</Label>
              <select
                name="type"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                defaultValue={SEASON_TYPES.DEFINITION}
              >
                {seasonTypes.map((t) => (
                  <option key={t} value={t}>
                    {SEASON_TYPE_LABELS[t as SeasonType]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Başlangıç tarihi</Label>
              <Input
                name="startDate"
                type="date"
                defaultValue={toDateInputValue(today())}
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Başlangıç kilo</Label>
                <Input name="startWeight" type="number" step="0.1" />
              </div>
              <div className="space-y-1">
                <Label>Hedef kilo</Label>
                <Input name="targetWeight" type="number" step="0.1" />
              </div>
            </div>
            <div className="space-y-1">
              <Label>Not</Label>
              <Textarea name="note" rows={2} />
            </div>
            <Button type="submit" className="w-full h-11" disabled={isPending}>
              Süreci Başlat
            </Button>
          </form>
        </CardContent>
      </Card>

      <Link href="/seasons">
        <Button variant="outline" className="w-full h-11">
          Süreç Raporlarına Git
        </Button>
      </Link>
    </div>
  );
}
