import { PageHeader } from "@/components/layout/page-header";
import { StatCard, ChartCard } from "@/components/charts/chart-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getWeightStats } from "@/lib/calculations";
import { formatDateShort, round } from "@/lib/utils";

export default async function WeightPage() {
  const { weights, stats } = await getWeightStats();

  const trendLabel =
    stats.weeklyChange == null
      ? "Yetersiz veri"
      : stats.weeklyChange < -0.2
      ? "Düşüş trendi"
      : stats.weeklyChange > 0.2
      ? "Yükseliş trendi"
      : "Stabil";

  const trendVariant =
    stats.weeklyChange == null
      ? "secondary"
      : stats.weeklyChange < -0.2
      ? "success"
      : stats.weeklyChange > 0.2
      ? "warning"
      : "secondary";

  return (
    <>
      <PageHeader
        title="Kilo Takibi"
        description="Haftalık ortalamaya göre trend — günlük dalgalanmalar abartılı yorumlanmaz"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <StatCard title="Haftalık Ort." value={stats.weeklyAvg != null ? `${round(stats.weeklyAvg)} kg` : "—"} />
        <StatCard title="Son 7 Gün Ort." value={stats.avg7 != null ? `${round(stats.avg7)} kg` : "—"} />
        <StatCard title="Son 30 Gün Ort." value={stats.avg30 != null ? `${round(stats.avg30)} kg` : "—"} />
        <StatCard title="En Düşük" value={stats.min != null ? `${round(stats.min)} kg` : "—"} status="success" />
        <StatCard title="En Yüksek" value={stats.max != null ? `${round(stats.max)} kg` : "—"} status="warning" />
        <StatCard
          title="Toplam Değişim"
          value={
            stats.totalChange != null
              ? `${stats.totalChange > 0 ? "+" : ""}${round(stats.totalChange)} kg`
              : "—"
          }
        />
        <StatCard
          title="Haftalık Trend"
          value={
            stats.weeklyChange != null
              ? `${stats.weeklyChange > 0 ? "+" : ""}${round(stats.weeklyChange)} kg`
              : "—"
          }
          subtitle={trendLabel}
        />
      </div>

      <div className="mb-4">
        <Badge variant={trendVariant as "success" | "warning" | "secondary"}>
          Haftalık ortalamaya göre: {trendLabel}
        </Badge>
      </div>

      <ChartCard
        title="Kilo Grafiği (Sabah / Akşam / Ortalama)"
        data={weights}
        lines={[
          { key: "morning", color: "hsl(217, 91%, 60%)", name: "Sabah" },
          { key: "evening", color: "hsl(38, 92%, 50%)", name: "Akşam" },
          { key: "avg", color: "hsl(142, 70%, 45%)", name: "Ortalama" },
        ]}
      />

      <Card className="mt-4">
        <CardHeader>
          <CardTitle className="text-base">Kilo Geçmişi</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-2 pr-4">Tarih</th>
                <th className="pb-2 pr-4">Sabah</th>
                <th className="pb-2 pr-4">Akşam</th>
                <th className="pb-2">Ortalama</th>
              </tr>
            </thead>
            <tbody>
              {weights.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-muted-foreground">
                    Henüz kilo kaydı yok — Günlük Kayıt ekranından ekleyin
                  </td>
                </tr>
              ) : (
                [...weights].reverse().map((w, i) => (
                  <tr key={i} className="border-b border-border/50">
                    <td className="py-2 pr-4">{formatDateShort(w.date)}</td>
                    <td className="py-2 pr-4">{w.morning ?? "—"}</td>
                    <td className="py-2 pr-4">{w.evening ?? "—"}</td>
                    <td className="py-2 font-medium">{w.avg != null ? round(w.avg) : "—"}</td>
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
