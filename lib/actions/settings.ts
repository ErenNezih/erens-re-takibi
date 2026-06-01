"use server";

import { revalidatePath } from "next/cache";
import { prisma, getSettings } from "@/lib/db";
import { parseDateInput } from "@/lib/date";
import { exportAllData, importAllData } from "@/lib/export";

export async function updateSettings(formData: FormData) {
  const settings = await getSettings();
  await prisma.userSetting.update({
    where: { id: settings.id },
    data: {
      startDate: parseDateInput(formData.get("startDate") as string),
      startWeight: parseFloatOrNull(formData.get("startWeight")),
      targetWeight: parseFloatOrNull(formData.get("targetWeight")),
      theme: (formData.get("theme") as string) || "dark",
    },
  });
  revalidatePath("/settings");
  return { success: true };
}

export async function exportDataAction() {
  return exportAllData();
}

export async function importDataAction(json: string) {
  const data = JSON.parse(json);
  await importAllData(data);
  revalidatePath("/", "layout");
  return { success: true };
}

function parseFloatOrNull(v: FormDataEntryValue | null): number | null {
  if (!v || v === "") return null;
  const n = parseFloat(v as string);
  return isNaN(n) ? null : n;
}
