import { getSettings } from "@/lib/db";
import { getPhases } from "@/lib/actions/substances";
import { SettingsClient } from "@/components/settings/settings-client";

export default async function SettingsPage() {
  const [settings, phases] = await Promise.all([getSettings(), getPhases()]);
  return <SettingsClient settings={settings} phases={phases} />;
}
