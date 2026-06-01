"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
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
  seasonDayCount,
  type SeasonType,
} from "@/lib/season";
import { formatDateShort, toDateInputValue, today } from "@/lib/date";
import type { Season } from "@prisma/client";

interface WeightPoint {
  dateKey: string;
  weight: number;
}

interface VolumePoint {
  dateKey: string;
  volume: number;
  title: string;
}

interface SeasonPageClientProps {
  activeSeason: Season | null;
  history: Season[];
  weightLogs: WeightPoint[];
  currentWeight: number | null;
  volumeAnalytics: {
    totalWorkouts: number;
    lastVolume: number;
    prevVolume: number;
    volumeDelta: number;
    bestVolume: number;
    bestVolumeDate: string | null;
    last10: VolumePoint[];
    topExercises: { name: string; last: number; prev: number; delta: number }[];
  } | null;
}

export function SeasonPageClient({
  activeSeason,
  history,
  weightLogs,
  currentWeight,
  volumeAnalytics,
}: SeasonPageClientProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const seasonTypes = Object.entries(SEASON_TYPES).map(([, v]) => v);

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center gap-3">
        <Link href="/calendar">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Süreç</h1>
      </div>

      {activeSeason ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Aktif Süreç</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p className="font-semibold text-lg">{activeSeason.name}</p>
              <p className="text-muted-foreground">
                {SEASON_TYPE_LABELS[activeSeason.type as SeasonType] ?? activeSeason.type}
              </p>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div>
                  <p className="text-xs text-muted-foreground">Başlangıç</p>
                  <p>{formatDateShort(activeSeason.startDate)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Geçen gün</p>
                  <p>{seasonDayCount(activeSeason)}</p>
                </div>
                {activeSeason.startWeight != null && (
                  <div>
                    <p className="text-xs text-muted-foreground">Başlangıç kilo</p>
                    <p>{activeSeason.startWeight} kg</p>
                  </div>
                )}
                {currentWeight != null && (
                  <div>
                    <p className="text-xs text-muted-foreground">Güncel kilo</p>
                    <p>{currentWeight} kg</p>
                  </div>
                )}
                {activeSeason.targetWeight != null && (
                  <div>
                    <p className="text-xs text-muted-foreground">Hedef kilo</p>
                    <p>{activeSeason.targetWeight} kg</p>
                  </div>
                )}
                {activeSeason.startWeight != null &&
                  activeSeason.targetWeight != null &&
                  currentWeight != null && (
                    <div>
                      <p className="text-xs text-muted-foreground">Hedefe kalan</p>
                      <p>{(currentWeight - activeSeason.targetWeight).toFixed(1)} kg</p>
                    </div>
                  )}
              </div>
              {activeSeason.note && (
                <p className="text-muted-foreground pt-2 whitespace-pre-wrap">{activeSeason.note}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Kilo Trendi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeSeason.startWeight != null && currentWeight != null && (
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-lg bg-muted p-2">
                    <p className="text-muted-foreground">Başlangıç</p>
                    <p className="font-semibold">{activeSeason.startWeight} kg</p>
                  </div>
                  <div className="rounded-lg bg-muted p-2">
                    <p className="text-muted-foreground">Güncel</p>
                    <p className="font-semibold">{currentWeight} kg</p>
                  </div>
                  <div className="rounded-lg bg-muted p-2">
                    <p className="text-muted-foreground">Hedef</p>
                    <p className="font-semibold">{activeSeason.targetWeight ?? "—"} kg</p>
                  </div>
                </div>
              )}
              {weightLogs.length > 0 ? (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weightLogs.slice(-30)}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="dateKey" tick={{ fontSize: 10 }} />
                      <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10 }} width={36} />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="weight"
                        stroke="hsl(var(--primary))"
                        dot={false}
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Henüz kilo kaydı yok</p>
              )}
            </CardContent>
          </Card>

          {volumeAnalytics && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ağırlık / Volume Özeti</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-xs text-muted-foreground">Toplam antrenman</p>
                    <p className="font-semibold">{volumeAnalytics.totalWorkouts}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Son volume</p>
                    <p className="font-semibold">{Math.round(volumeAnalytics.lastVolume)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Öncekine göre</p>
                    <p
                      className={`font-semibold ${
                        volumeAnalytics.volumeDelta >= 0 ? "text-success" : "text-destructive"
                      }`}
                    >
                      {volumeAnalytics.volumeDelta >= 0 ? "+" : ""}
                      {Math.round(volumeAnalytics.volumeDelta)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">En iyi volume</p>
                    <p className="font-semibold">{Math.round(volumeAnalytics.bestVolume)}</p>
                  </div>
                </div>
                {volumeAnalytics.last10.length > 0 && (
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={volumeAnalytics.last10}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="dateKey" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} width={40} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="volume"
                          stroke="hsl(var(--workout))"
                          dot={false}
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {volumeAnalytics.topExercises.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      En çok gelişen hareketler
                    </p>
                    {volumeAnalytics.topExercises.map((ex) => (
                      <div
                        key={ex.name}
                        className="flex justify-between text-sm border-b border-border pb-1"
                      >
                        <span>{ex.name}</span>
                        <span className={ex.delta >= 0 ? "text-success" : "text-destructive"}>
                          {ex.delta >= 0 ? "+" : ""}
                          {Math.round(ex.delta)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

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
                    defaultValue={currentWeight ?? ""}
                  />
                </div>
                <div className="space-y-1">
                  <Label>Kapanış notu</Label>
                  <Textarea name="note" rows={2} />
                </div>
                <Button type="submit" variant="destructive" className="w-full" disabled={isPending}>
                  Süreci Bitir
                </Button>
              </form>
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Aktif süreç yok. Yeni süreç başlatın.</p>
          </CardContent>
        </Card>
      )}

      {history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sezon Geçmişi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {history.map((s) => (
              <div key={s.id} className="border-b border-border pb-2 last:border-0">
                <p className="font-medium">{s.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatDateShort(s.startDate)}
                  {s.endDate ? ` — ${formatDateShort(s.endDate)}` : ""}
                </p>
                <p className="text-xs text-muted-foreground">
                  {s.startWeight != null ? `${s.startWeight} kg` : "—"}
                  {s.endWeight != null ? ` → ${s.endWeight} kg` : ""}
                </p>
                {s.note && <p className="text-xs mt-1 whitespace-pre-wrap">{s.note}</p>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Yeni Süreç Başlat</CardTitle>
        </CardHeader>
        <CardContent>
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
    </div>
  );
}
