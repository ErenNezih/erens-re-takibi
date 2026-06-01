"use client";

import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SEASON_TYPE_LABELS, seasonDayCount, type SeasonType } from "@/lib/season";
import { WORKOUT_GROUP_LABELS, type WorkoutGroup } from "@/lib/workout-groups";
import { formatDateShort } from "@/lib/date";
import type { SeasonReport } from "@/lib/season-report";

interface SeasonDetailClientProps {
  report: SeasonReport;
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-semibold text-sm">{value}</p>
    </div>
  );
}

export function SeasonDetailClient({ report }: SeasonDetailClientProps) {
  const { season, compliance, weight, workout, macro, groupSummaries, topExercises, dailyLogs } =
    report;

  return (
    <div className="space-y-4 pb-6">
      <div className="flex items-center gap-3">
        <Link href="/seasons">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">{season.name}</h1>
          <p className="text-xs text-muted-foreground">
            {SEASON_TYPE_LABELS[season.type as SeasonType] ?? season.type}
          </p>
        </div>
        {season.active && (
          <Badge className="ml-auto bg-success/15 text-success border-success/30">Aktif</Badge>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Süreç Özeti</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3">
          <Metric label="Başlangıç" value={formatDateShort(season.startDate)} />
          {season.endDate && (
            <Metric label="Bitiş" value={formatDateShort(season.endDate)} />
          )}
          <Metric label="Toplam gün" value={compliance.totalDays} />
          {season.startWeight != null && (
            <Metric label="Başlangıç kilo" value={`${season.startWeight} kg`} />
          )}
          {weight.lastWeight != null && (
            <Metric label="Son kilo" value={`${weight.lastWeight} kg`} />
          )}
          {season.targetWeight != null && (
            <Metric label="Hedef kilo" value={`${season.targetWeight} kg`} />
          )}
          {weight.totalChange != null && (
            <Metric
              label="Kilo değişimi"
              value={`${weight.totalChange >= 0 ? "+" : ""}${weight.totalChange.toFixed(1)} kg`}
            />
          )}
          {weight.remainingToTarget != null && (
            <Metric label="Hedefe kalan" value={`${weight.remainingToTarget.toFixed(1)} kg`} />
          )}
          {season.note && (
            <div className="col-span-2">
              <p className="text-xs text-muted-foreground">Not</p>
              <p className="text-sm whitespace-pre-wrap">{season.note}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Uyum Özeti</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-sm">
          <Metric label="Toplam gün" value={compliance.totalDays} />
          <Metric label="İşlenen gün" value={compliance.processedDays} />
          <Metric label="Pas geçilen gün" value={compliance.skippedDays} />
          <Metric label="Genel uyum" value={`${compliance.overallCompliancePct}%`} />
          <Metric
            label="Diyet uyum"
            value={`${compliance.dietCompletedDays} gün (${compliance.dietCompliancePct}%)`}
          />
          <Metric
            label="Antrenman uyum"
            value={`${compliance.workoutCompletedDays} gün (${compliance.workoutCompliancePct}%)`}
          />
          <Metric
            label="Supplement uyum"
            value={`${compliance.supplementCompletedDays} gün (${compliance.supplementCompliancePct}%)`}
          />
          <Metric
            label="Kür uyum"
            value={`${compliance.cycleCompletedDays} gün (${compliance.cycleCompliancePct}%)`}
          />
          {macro.daysLogged > 0 && (
            <>
              <Metric label="Kalori girilen gün" value={macro.daysLogged} />
              {macro.avgCalories != null && (
                <Metric label="Ort. kalori" value={macro.avgCalories} />
              )}
              {macro.avgProtein != null && (
                <Metric label="Ort. protein (g)" value={macro.avgProtein} />
              )}
              {macro.targetCalories != null && (
                <Metric label="Hedef kalori" value={macro.targetCalories} />
              )}
              {macro.targetCalories != null && (
                <Metric label="Kalori uyum" value={`${macro.macroCompliancePct}%`} />
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Kilo Raporu</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            {weight.firstWeight != null && (
              <Metric label="İlk kilo" value={`${weight.firstWeight} kg`} />
            )}
            {weight.lastWeight != null && (
              <Metric label="Son kilo" value={`${weight.lastWeight} kg`} />
            )}
            {weight.minWeight != null && (
              <Metric label="En düşük" value={`${weight.minWeight} kg`} />
            )}
            {weight.maxWeight != null && (
              <Metric label="En yüksek" value={`${weight.maxWeight} kg`} />
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
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weight.chartData}>
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
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Antrenman / Volume</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-3 text-sm">
          <Metric label="Toplam antrenman" value={workout.totalWorkouts} />
          <Metric label="Toplam set" value={workout.totalSets} />
          <Metric label="Toplam volume" value={Math.round(workout.totalVolume)} />
          <Metric label="Ort. volume" value={Math.round(workout.avgWorkoutVolume)} />
          <Metric label="En iyi volume" value={Math.round(workout.bestWorkoutVolume)} />
          <Metric label="Son volume" value={Math.round(workout.lastVolume)} />
          <Metric
            label="Önceki aynı tipe göre"
            value={`${workout.volumeDelta >= 0 ? "+" : ""}${Math.round(workout.volumeDelta)}`}
          />
          <Metric label="Push volume" value={Math.round(workout.pushVolume)} />
          <Metric label="Pull volume" value={Math.round(workout.pullVolume)} />
          <Metric label="Legs volume" value={Math.round(workout.legsVolume)} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Push / Pull / Legs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {groupSummaries
            .filter((g) => g.workoutCount > 0)
            .map((g) => (
              <div key={g.group} className="border-b border-border pb-2 last:border-0">
                <p className="font-medium text-sm">
                  {WORKOUT_GROUP_LABELS[g.group as WorkoutGroup]}
                </p>
                <div className="grid grid-cols-3 gap-2 mt-1 text-xs text-muted-foreground">
                  <span>{g.workoutCount} antrenman</span>
                  <span>{g.totalSets} set</span>
                  <span>{Math.round(g.totalVolume)} vol</span>
                  <span>Ort: {Math.round(g.avgVolume)}</span>
                  <span>Son: {Math.round(g.lastVolume)}</span>
                  <span>En iyi: {Math.round(g.bestVolume)}</span>
                  <span>
                    Fark: {g.volumeDelta >= 0 ? "+" : ""}
                    {Math.round(g.volumeDelta)}
                  </span>
                </div>
              </div>
            ))}
        </CardContent>
      </Card>

      {topExercises.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">En Çok Gelişen Hareketler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {topExercises.map((ex) => (
              <div
                key={ex.name}
                className="flex flex-col gap-0.5 border-b border-border pb-2 last:border-0 text-sm"
              >
                <div className="flex justify-between gap-2">
                  <span className="font-medium">{ex.name}</span>
                  <Badge
                    variant="outline"
                    className={
                      ex.status === "Arttı"
                        ? "text-success border-success/30"
                        : ex.status === "Düştü"
                          ? "text-destructive border-destructive/30"
                          : ""
                    }
                  >
                    {ex.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  İlk: {ex.firstPerf} → Son: {ex.lastPerf}
                  {ex.change !== "—" && ` (${ex.change})`}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Günlük Kayıtlar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 max-h-64 overflow-y-auto">
          {[...dailyLogs].reverse().map((day) => (
            <Link
              key={day.dateKey}
              href={`/day/${day.dateKey}`}
              className="flex items-center justify-between gap-2 py-2 border-b border-border last:border-0 text-xs hover:bg-accent/30 rounded px-1 -mx-1"
            >
              <span className="font-medium">{day.dateKey}</span>
              <div className="flex gap-2 text-muted-foreground shrink-0">
                {day.weight != null && <span>{day.weight}kg</span>}
                <span
                  className={
                    day.overallStatus === "Tamam"
                      ? "text-success"
                      : day.overallStatus === "Eksik"
                        ? "text-destructive/80"
                        : ""
                  }
                >
                  {day.overallStatus}
                </span>
              </div>
            </Link>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
