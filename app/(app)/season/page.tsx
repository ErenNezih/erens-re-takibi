import { SeasonSettingsClient } from "@/components/season-settings-client";
import { getActiveSeason, ensureSeasonFromSettings } from "@/lib/season";
import { getSeasonListSummaries } from "@/lib/season-report";

export default async function SeasonSettingsPage() {
  await ensureSeasonFromSettings();
  const activeSeason = await getActiveSeason();
  const summaries = activeSeason
    ? await getSeasonListSummaries([activeSeason])
    : new Map();
  const activeSummary = activeSeason ? summaries.get(activeSeason.id) ?? null : null;

  return (
    <SeasonSettingsClient activeSeason={activeSeason} activeSummary={activeSummary} />
  );
}
