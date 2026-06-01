"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import { startSeason, endSeason } from "@/lib/actions/season";
import {
  SEASON_TYPE_LABELS,
  SEASON_TYPES,
  seasonDayCount,
  type SeasonType,
} from "@/lib/season";
import { formatDateShort, toDateInputValue, today } from "@/lib/date";
import type { SeasonListSummary } from "@/lib/season-report";
import type { Season } from "@prisma/client";

interface SeasonsListClientProps {
  activeSeason: Season | null;
  history: Season[];
  summaries: Map<string, SeasonListSummary>;
}

export function SeasonsListClient({
  activeSeason,
  history,
  summaries,
}: SeasonsListClientProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const seasonTypes = Object.values(SEASON_TYPES);

  const activeSummary = activeSeason ? summaries.get(activeSeason.id) : null;

  return (
    <div className="space-y-4 pb-6">
      <h1 className="text-2xl font-bold">Süreçlerim</h1>

      {activeSeason ? (
        <Card className="border-success/40">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-base">{activeSeason.name}</CardTitle>
              <Badge className="bg-success/15 text-success border-success/30">Aktif</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {SEASON_TYPE_LABELS[activeSeason.type as SeasonType] ?? activeSeason.type}
            </p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Başlangıç</p>
                <p>{formatDateShort(activeSeason.startDate)}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Gün</p>
                <p>{seasonDayCount(activeSeason)}</p>
              </div>
              {activeSeason.startWeight != null && (
                <div>
                  <p className="text-xs text-muted-foreground">Başlangıç kilo</p>
                  <p>{activeSeason.startWeight} kg</p>
                </div>
              )}
              {activeSummary?.currentWeight != null && (
                <div>
                  <p className="text-xs text-muted-foreground">Güncel kilo</p>
                  <p>{activeSummary.currentWeight} kg</p>
                </div>
              )}
              {activeSeason.targetWeight != null && (
                <div>
                  <p className="text-xs text-muted-foreground">Hedef kilo</p>
                  <p>{activeSeason.targetWeight} kg</p>
                </div>
              )}
              {activeSummary?.weightChange != null && (
                <div>
                  <p className="text-xs text-muted-foreground">Kilo değişimi</p>
                  <p>
                    {activeSummary.weightChange >= 0 ? "+" : ""}
                    {activeSummary.weightChange.toFixed(1)} kg
                  </p>
                </div>
              )}
              {activeSummary?.currentWeight != null &&
                activeSeason.targetWeight != null && (
                  <div>
                    <p className="text-xs text-muted-foreground">Hedefe kalan</p>
                    <p>
                      {(activeSummary.currentWeight - activeSeason.targetWeight).toFixed(1)} kg
                    </p>
                  </div>
                )}
              {activeSummary && (
                <div>
                  <p className="text-xs text-muted-foreground">Uyum</p>
                  <p>{activeSummary.compliancePct}%</p>
                </div>
              )}
            </div>
            {activeSeason.note && (
              <p className="text-sm text-muted-foreground whitespace-pre-wrap line-clamp-2">
                {activeSeason.note}
              </p>
            )}
            <div className="flex gap-2">
              <Link href={`/seasons/${activeSeason.id}`} className="flex-1">
                <Button className="w-full h-11">Süreci Gör</Button>
              </Link>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                startTransition(async () => {
                  await endSeason(new FormData(e.currentTarget));
                  toast({ title: "Süreç bitirildi" });
                  router.refresh();
                });
              }}
              className="space-y-2 pt-2 border-t border-border"
            >
              <p className="text-sm font-medium">Süreci Bitir</p>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs">Bitiş tarihi</Label>
                  <Input
                    name="endDate"
                    type="date"
                    defaultValue={toDateInputValue(today())}
                    required
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Bitiş kilosu</Label>
                  <Input
                    name="endWeight"
                    type="number"
                    step="0.1"
                    defaultValue={activeSummary?.currentWeight ?? ""}
                  />
                </div>
              </div>
              <Textarea name="note" rows={2} placeholder="Kapanış notu..." />
              <Button
                type="submit"
                variant="destructive"
                className="w-full h-10"
                disabled={isPending}
              >
                Süreci Bitir
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Aktif süreç yok.</p>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-3">Geçmiş Süreçler</h2>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">Henüz geçmiş süreç yok</p>
        ) : (
          <div className="space-y-2">
            {history.map((s) => {
              const summary = summaries.get(s.id);
              return (
                <Link key={s.id} href={`/seasons/${s.id}`}>
                  <Card className="hover:bg-accent/30 transition-colors">
                    <CardContent className="p-4 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{s.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {SEASON_TYPE_LABELS[s.type as SeasonType] ?? s.type}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDateShort(s.startDate)}
                          {s.endDate ? ` — ${formatDateShort(s.endDate)}` : ""}
                        </p>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-muted-foreground">
                          {s.startWeight != null && s.endWeight != null && (
                            <span>
                              {s.startWeight} → {s.endWeight} kg
                            </span>
                          )}
                          {summary?.weightChange != null && (
                            <span>
                              {summary.weightChange >= 0 ? "+" : ""}
                              {summary.weightChange.toFixed(1)} kg
                            </span>
                          )}
                          {summary && <span>Uyum: {summary.compliancePct}%</span>}
                          {summary && <span>{summary.workoutCount} antrenman</span>}
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground" />
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>

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
