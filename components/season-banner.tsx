"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateShort } from "@/lib/date";
import { SEASON_TYPE_LABELS, seasonDayCount } from "@/lib/season";
import type { Season } from "@prisma/client";

interface SeasonBannerProps {
  season: Season | null;
}

export function SeasonBanner({ season }: SeasonBannerProps) {
  if (!season) {
    return (
      <Card className="mb-4 border-supplement/40 bg-supplement/5">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">
            Aktif süreç yok. Takibi düzenli yapmak için bir süreç başlat.
          </p>
          <Link href="/seasons" className="mt-2 inline-block">
            <Button size="sm" variant="outline">
              Süreç Başlat
            </Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  const dayNum = seasonDayCount(season);
  const typeLabel =
    SEASON_TYPE_LABELS[season.type as keyof typeof SEASON_TYPE_LABELS] ?? season.type;

  return (
    <Card className="mb-4">
      <CardContent className="p-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold truncate">{season.name}</p>
          <p className="text-xs text-muted-foreground">{typeLabel}</p>
          <div className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
            <span>Başlangıç: {formatDateShort(season.startDate)}</span>
            <span>Gün: {dayNum}</span>
            {season.startWeight != null && (
              <span>Başlangıç kilo: {season.startWeight} kg</span>
            )}
            {season.targetWeight != null && (
              <span>Hedef kilo: {season.targetWeight} kg</span>
            )}
          </div>
        </div>
        <Link href={`/seasons/${season.id}`}>
          <Button size="sm" variant="outline" className="shrink-0">
            Süreç
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}
