import { SeasonsListClient } from "@/components/seasons-list-client";
import {
  getActiveSeason,
  getSeasonHistory,
  ensureSeasonFromSettings,
} from "@/lib/season";
import { getSeasonListSummaries } from "@/lib/season-report";

export default async function SeasonsPage() {
  await ensureSeasonFromSettings();
  const [activeSeason, history] = await Promise.all([
    getActiveSeason(),
    getSeasonHistory(),
  ]);

  const allSeasons = [...(activeSeason ? [activeSeason] : []), ...history];
  const summaries = await getSeasonListSummaries(allSeasons);

  return (
    <SeasonsListClient
      activeSeason={activeSeason}
      history={history}
      summaries={summaries}
    />
  );
}
