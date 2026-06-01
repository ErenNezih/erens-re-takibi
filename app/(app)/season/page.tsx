import { SeasonPageClient } from "@/components/season-page-client";
import {
  getActiveSeason,
  getSeasonHistory,
  getSeasonWeightLogs,
  getCurrentWeightForSeason,
  getVolumeAnalytics,
  ensureSeasonFromSettings,
} from "@/lib/season";
import { toDateInputValue } from "@/lib/date";

export default async function SeasonPage() {
  await ensureSeasonFromSettings();
  const activeSeason = await getActiveSeason();
  const history = await getSeasonHistory();

  let weightLogs: { dateKey: string; weight: number }[] = [];
  let currentWeight: number | null = null;
  let volumeAnalytics = null;

  if (activeSeason) {
    const [logs, current, volume] = await Promise.all([
      getSeasonWeightLogs(activeSeason),
      getCurrentWeightForSeason(activeSeason),
      getVolumeAnalytics(activeSeason),
    ]);
    weightLogs = logs.map((l) => ({
      dateKey: toDateInputValue(l.date),
      weight: l.weight,
    }));
    currentWeight = current;
    volumeAnalytics = {
      ...volume,
      last10: volume.last10.map((v) => ({
        dateKey: v.dateKey,
        volume: v.volume,
        title: v.title,
      })),
    };
  }

  return (
    <SeasonPageClient
      activeSeason={activeSeason}
      history={history}
      weightLogs={weightLogs}
      currentWeight={currentWeight}
      volumeAnalytics={volumeAnalytics}
    />
  );
}
