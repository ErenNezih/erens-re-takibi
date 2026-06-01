import { SettingsClient } from "@/components/settings-client";
import { getSettings } from "@/lib/db";

export default async function SettingsPage() {
  const settings = await getSettings();
  return <SettingsClient settings={settings} />;
}
