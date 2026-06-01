"use server";

import { revalidatePath } from "next/cache";
import { prisma, getSettings } from "@/lib/db";
import { parseDateInput } from "@/lib/utils";

export async function updateSettings(formData: FormData) {
  const settings = await getSettings();

  await prisma.userSetting.update({
    where: { id: settings.id },
    data: {
      startDate: parseDateInput(formData.get("startDate") as string),
      startWeight: parseFloatOrNull(formData.get("startWeight")),
      targetWeight: parseFloatOrNull(formData.get("targetWeight")),
      targetWaist: parseFloatOrNull(formData.get("targetWaist")),
      calorieTargetMin: parseInt(formData.get("calorieTargetMin") as string) || 1500,
      calorieTargetMax: parseInt(formData.get("calorieTargetMax") as string) || 1800,
      proteinTarget: parseInt(formData.get("proteinTarget") as string) || 150,
      carbTarget: parseInt(formData.get("carbTarget") as string) || 150,
      fatTarget: parseInt(formData.get("fatTarget") as string) || 50,
      waterTargetMin: parseFloat(formData.get("waterTargetMin") as string) || 2.5,
      waterTargetMax: parseFloat(formData.get("waterTargetMax") as string) || 3.5,
      stepTargetMin: parseInt(formData.get("stepTargetMin") as string) || 10000,
      stepTargetMax: parseInt(formData.get("stepTargetMax") as string) || 15000,
      theme: (formData.get("theme") as string) || "dark",
    },
  });

  revalidatePath("/settings");
  revalidatePath("/dashboard");
  revalidatePath("/nutrition");
  return { success: true };
}

function parseFloatOrNull(value: FormDataEntryValue | null): number | null {
  if (!value || value === "") return null;
  const n = parseFloat(value as string);
  return isNaN(n) ? null : n;
}
