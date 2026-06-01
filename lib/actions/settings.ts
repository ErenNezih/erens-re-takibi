"use server";

import { revalidatePath } from "next/cache";
import { prisma, getSettings } from "@/lib/db";
import { exportAllData, importAllData } from "@/lib/export";

export async function updateSettings(formData: FormData) {
  const settings = await getSettings();
  await prisma.userSetting.update({
    where: { id: settings.id },
    data: {
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
