import Link from "next/link";
import { format } from "date-fns";
import { tr } from "date-fns/locale";
import {
  Scale,
  TrendingDown,
  Flame,
  Footprints,
  Dumbbell,
  Pill,
  Target,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard, ChartCard } from "@/components/charts/chart-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getDashboardData } from "@/lib/calculations";
import { round } from "@/lib/utils";

export default async function DashboardPage() {
  const { settings, activePhase, stats, charts } = await getDashboardData();

  const calorieInRange =
    stats.caloriesIn != null &&
    stats.caloriesIn >= settings.calorieTargetMin &&
    stats.caloriesIn <= settings.calorieTargetMax;

  const stepsOk =
    stats.steps != null && stats.steps >= settings.stepTargetMin;

  const proteinOk =
    stats.protein != null && stats.protein >= settings.proteinTarget;

  return (
    <>
      <PageHeader
        title="Dashboard"
        description={
          activePhase
            ? `Aktif faz: ${activePhase.name} — ${format(new Date(), "dd MMMM yyyy", { locale: tr })}`
            : format(new Date(), "dd MMMM yyyy", { locale: tr })
        }
      >
        <Link href="/daily">
          <Button size="sm">Bugünü Aç</Button>
        </Link>
      </PageHeader>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-6">
        <StatCard
          title="Bugünkü Kilo"
          value={stats.todayWeight != null ? `${round(stats.todayWeight)} kg` : null}
          icon={<Scale className="h-5 w-5" />}
        />
        <StatCard
          title="Başlangıç"
          value={stats.startWeight != null ? `${round(stats.startWeight)} kg` : "—"}
          icon={<Target className="h-5 w-5" />}
        />
        <StatCard
          title="Toplam Değişim"
          value={
            stats.totalChange != null
              ? `${stats.totalChange > 0 ? "+" : ""}${round(stats.totalChange)} kg`
              : null
          }
          status={
            stats.totalChange != null
              ? stats.totalChange < 0
                ? "success"
                : stats.totalChange > 0
                ? "warning"
                : "neutral"
              : "neutral"
          }
          icon={<TrendingDown className="h-5 w-5" />}
        />
        <StatCard
          title="Haftalık Değişim"
          value={
            stats.weeklyChange != null
              ? `${stats.weeklyChange > 0 ? "+" : ""}${round(stats.weeklyChange)} kg`
              : null
          }
          subtitle="Haftalık ortalamaya göre"
        />
        <StatCard
          title="Alınan Kalori"
          value={stats.caloriesIn ?? "—"}
          status={stats.caloriesIn == null ? "danger" : calorieInRange ? "success" : "warning"}
          subtitle={`Hedef: ${settings.calorieTargetMin}-${settings.calorieTargetMax}`}
          icon={<Flame className="h-5 w-5" />}
        />
        <StatCard
          title="Aktif Kalori"
          value={stats.activeCalories ?? "—"}
        />
        <StatCard
          title="Net Kalori"
          value={stats.netCalories ?? "—"}
          subtitle="Alınan − Aktif"
        />
        <StatCard
          title="Adım"
          value={stats.steps?.toLocaleString("tr-TR") ?? "—"}
          status={stats.steps == null ? "danger" : stepsOk ? "success" : "warning"}
          subtitle={`Hedef: ${settings.stepTargetMin.toLocaleString("tr-TR")}+`}
          icon={<Footprints className="h-5 w-5" />}
        />
        <StatCard
          title="Son Bel"
          value={stats.lastWaist != null ? `${stats.lastWaist} cm` : "—"}
        />
        <StatCard
          title="Son Kol"
          value={stats.lastArm != null ? `${stats.lastArm} cm` : "—"}
        />
        <StatCard
          title="Son Omuz"
          value={stats.lastShoulder != null ? `${stats.lastShoulder} cm` : "—"}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
          {stats.workoutDone ? (
            <CheckCircle2 className="h-8 w-8 text-success shrink-0" />
          ) : (
            <XCircle className="h-8 w-8 text-destructive shrink-0" />
          )}
          <div>
            <p className="text-xs text-muted-foreground">Antrenman</p>
            <p className="font-semibold">{stats.workoutDone ? "Tamamlandı" : "Yapılmadı"}</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
          {stats.cardioDone ? (
            <CheckCircle2 className="h-8 w-8 text-success shrink-0" />
          ) : (
            <XCircle className="h-8 w-8 text-muted-foreground shrink-0" />
          )}
          <div>
            <p className="text-xs text-muted-foreground">Kardiyo</p>
            <p className="font-semibold">{stats.cardioDone ? "Tamamlandı" : "Yapılmadı"}</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
          <Pill className="h-8 w-8 text-primary shrink-0" />
          <div>
            <p className="text-xs text-muted-foreground">Aktif Takviye/İlaç</p>
            <p className="font-semibold">{stats.substancesActive} kayıt</p>
          </div>
        </div>
        <div className="rounded-xl border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-muted-foreground">7 Gün Uyum</p>
            <Badge variant={stats.compliance >= 70 ? "success" : stats.compliance >= 40 ? "warning" : "destructive"}>
              %{stats.compliance}
            </Badge>
          </div>
          <Progress value={stats.compliance} className="h-2" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ChartCard
          title="Kilo Değişimi"
          data={charts.weight}
          lines={[
            { key: "weight", color: "hsl(217, 91%, 60%)", name: "Ortalama Kilo (kg)" },
          ]}
        />
        <ChartCard
          title="Bel Ölçüsü"
          data={charts.waist}
          lines={[{ key: "value", color: "hsl(142, 70%, 45%)", name: "Bel (cm)" }]}
        />
        <ChartCard
          title="Günlük Kalori"
          data={charts.calories}
          lines={[
            { key: "calories", color: "hsl(217, 91%, 60%)", name: "Alınan" },
            { key: "active", color: "hsl(38, 92%, 50%)", name: "Aktif" },
          ]}
        />
        <ChartCard
          title="Adım Sayısı"
          data={charts.steps}
          lines={[{ key: "steps", color: "hsl(280, 65%, 60%)", name: "Adım" }]}
          type="bar"
        />
        <ChartCard
          title="Aktif Kalori"
          data={charts.calories}
          lines={[{ key: "active", color: "hsl(38, 92%, 50%)", name: "Aktif Kalori" }]}
        />
        <ChartCard
          title="Kol / Omuz / Bel Karşılaştırma"
          data={charts.measurements}
          lines={[
            { key: "waist", color: "hsl(217, 91%, 60%)", name: "Bel" },
            { key: "arm", color: "hsl(142, 70%, 45%)", name: "Kol" },
            { key: "shoulder", color: "hsl(38, 92%, 50%)", name: "Omuz" },
          ]}
        />
      </div>
    </>
  );
}
