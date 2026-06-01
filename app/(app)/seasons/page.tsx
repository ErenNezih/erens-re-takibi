import { SeasonsListClient } from "@/components/seasons-list-client";
import {
  getActiveSeason,
  getSeasonHistory,
  ensureSeasonFromSettings,
} from "@/lib/season";
import { getSeasonListSummariesLight, getSeasonReport } from "@/lib/season-report";

export default async function SeasonsPage() {
  await ensureSeasonFromSettings();
  const [activeSeason, history] = await Promise.all([
    getActiveSeason(),
    getSeasonHistory(),
  ]);

  const allSeasons = [...(activeSeason ? [activeSeason] : []), ...history];
  const [summaries, activeReport] = await Promise.all([
    getSeasonListSummariesLight(allSeasons),
    activeSeason ? getSeasonReport(activeSeason.id) : Promise.resolve(null),
  ]);

  return (
    <SeasonsListClient
      activeSeason={activeSeason}
      activeReport={activeReport}
      history={history}
      summaries={summaries}
    />
  );
}
