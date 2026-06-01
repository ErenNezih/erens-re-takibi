"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  SEASON_TYPE_LABELS,
  seasonDayCount,
  type SeasonType,
} from "@/lib/season";
import { formatDateShort } from "@/lib/date";
import type { SeasonListSummary, SeasonReport } from "@/lib/season-report";
import type { Season } from "@prisma/client";

interface SeasonsListClientProps {
  activeSeason: Season | null;
  activeReport: SeasonReport | null;
  history: Season[];
  summaries: Map<string, SeasonListSummary>;
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold text-sm">{value}</p>
    </div>
  );
}

export function SeasonsListClient({
  activeSeason,
  activeReport,
  history,
  summaries,
}: SeasonsListClientProps) {
  const weight = activeReport?.weight;
  const workout = activeReport?.workout;
  const compliance = activeReport?.compliance;
  const completedDays =
    activeReport?.dailyLogs.filter((d) => d.overallStatus === "Tamam").length ?? 0;

  return (
    <div className="space-y-4 pb-6">
      <h1 className="text-2xl font-bold">Süreçlerim</h1>

      {!activeSeason ? (
        <Card>
          <CardContent className="p-4 space-y-2">
            <p className="text-sm text-muted-foreground">Aktif süreç yok.</p>
            <p className="text-xs text-muted-foreground">
              Yeni süreç başlatmak için takvimdeki Süreç Ayarları bölümünü kullanın.
            </p>
            <Link href="/season">
              <Button variant="outline" size="sm">
                Süreç Ayarları
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <>
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
              <div className="grid grid-cols-2 gap-2">
                <Metric label="Başlangıç" value={formatDateShort(activeSeason.startDate)} />
                <Metric label="Gün" value={seasonDayCount(activeSeason)} />
                {activeSeason.startWeight != null && (
                  <Metric label="Başlangıç kilo" value={`${activeSeason.startWeight} kg`} />
                )}
                {weight?.lastWeight != null && (
                  <Metric label="Güncel kilo" value={`${weight.lastWeight} kg`} />
                )}
                {activeSeason.targetWeight != null && (
                  <Metric label="Hedef kilo" value={`${activeSeason.targetWeight} kg`} />
                )}
                {weight?.totalChange != null && (
                  <Metric
                    label="Kilo değişimi"
                    value={`${weight.totalChange >= 0 ? "+" : ""}${weight.totalChange.toFixed(1)} kg`}
                  />
                )}
                {weight?.remainingToTarget != null && (
                  <Metric
                    label="Hedefe kalan"
                    value={`${weight.remainingToTarget.toFixed(1)} kg`}
                  />
                )}
                {compliance && (
                  <Metric label="Genel uyum" value={`${compliance.overallCompliancePct}%`} />
                )}
              </div>
              <Link href={`/seasons/${activeSeason.id}`}>
                <Button className="w-full h-11">Detaylı Raporu Gör</Button>
              </Link>
            </CardContent>
          </Card>

          {weight && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Kilo Trendi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  {weight.firstWeight != null && (
                    <Metric label="Başlangıç kilo" value={`${weight.firstWeight} kg`} />
                  )}
                  {weight.lastWeight != null && (
                    <Metric label="Son kayıt" value={`${weight.lastWeight} kg`} />
                  )}
                  {weight.totalChange != null && (
                    <Metric
                      label="Toplam değişim"
                      value={`${weight.totalChange >= 0 ? "+" : ""}${weight.totalChange.toFixed(1)} kg`}
                    />
                  )}
                  {weight.avgWeeklyChange != null && (
                    <Metric
                      label="Haftalık ort."
                      value={`${weight.avgWeeklyChange >= 0 ? "+" : ""}${weight.avgWeeklyChange.toFixed(2)} kg`}
                    />
                  )}
                </div>
                {weight.chartData.length > 0 && (
                  <>
                    <p className="text-xs text-muted-foreground font-medium">Son 7 kayıt</p>
                    <div className="text-xs space-y-0.5">
                      {weight.chartData.slice(-7).map((p) => (
                        <div key={p.dateKey} className="flex justify-between">
                          <span className="text-muted-foreground">{p.dateKey}</span>
                          <span>{p.weight} kg</span>
                        </div>
                      ))}
                    </div>
                    <div className="h-36">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={weight.chartData.slice(-14)}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="dateKey" tick={{ fontSize: 9 }} />
                          <YAxis domain={["auto", "auto"]} tick={{ fontSize: 9 }} width={32} />
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
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {workout && workout.totalWorkouts === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ağırlık / Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Henüz tamamlanmış antrenman yok</p>
              </CardContent>
            </Card>
          ) : workout ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Ağırlık / Volume</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                <Metric label="Toplam antrenman" value={workout.totalWorkouts} />
                <Metric label="Son volume" value={Math.round(workout.lastVolume)} />
                <Metric label="En iyi volume" value={Math.round(workout.bestWorkoutVolume)} />
                <Metric
                  label="Önceki aynı tipe göre"
                  value={`${workout.volumeDelta >= 0 ? "+" : ""}${Math.round(workout.volumeDelta)}`}
                />
                <Metric label="Push" value={Math.round(workout.pushVolume)} />
                <Metric label="Pull" value={Math.round(workout.pullVolume)} />
                <Metric label="Legs" value={Math.round(workout.legsVolume)} />
              </CardContent>
            </Card>
          ) : null}

          {compliance && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Uyum</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                <Metric label="Genel uyum" value={`${compliance.overallCompliancePct}%`} />
                <Metric label="Diyet" value={`${compliance.dietCompliancePct}%`} />
                <Metric label="Antrenman" value={`${compliance.workoutCompliancePct}%`} />
                <Metric label="Supplement" value={`${compliance.supplementCompliancePct}%`} />
                <Metric label="Kür" value={`${compliance.cycleCompliancePct}%`} />
                <Metric label="Tamamlanan gün" value={completedDays} />
                <Metric label="Pas geçilen gün" value={compliance.skippedDays} />
              </CardContent>
            </Card>
          )}
        </>
      )}

      <div>
        <h2 className="text-lg font-semibold mb-3">Geçmiş Süreçler</h2>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">Henüz geçmiş süreç yok</p>
        ) : (
          <div className="space-y-2">
            {history.map((s) => {
              const summary = summaries.get(s.id);
              const weightChange =
                s.startWeight != null && s.endWeight != null
                  ? s.endWeight - s.startWeight
                  : summary?.weightChange ?? null;
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
                          {s.startWeight != null && (
                            <span>Başlangıç: {s.startWeight} kg</span>
                          )}
                          {s.endWeight != null && <span>Bitiş: {s.endWeight} kg</span>}
                          {weightChange != null && (
                            <span>
                              {weightChange >= 0 ? "+" : ""}
                              {weightChange.toFixed(1)} kg
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
    </div>
  );
}
