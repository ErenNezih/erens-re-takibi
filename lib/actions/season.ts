"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { parseDateInput } from "@/lib/date";
import { SEASON_TYPES } from "@/lib/season";

export async function startSeason(formData: FormData) {
  await prisma.season.updateMany({
    where: { active: true },
    data: { active: false },
  });

  const season = await prisma.season.create({
    data: {
      name: (formData.get("name") as string) || "Yeni Süreç",
      type: (formData.get("type") as string) || SEASON_TYPES.OTHER,
      startDate: parseDateInput(formData.get("startDate") as string),
      startWeight: parseFloatOrNull(formData.get("startWeight")),
      targetWeight: parseFloatOrNull(formData.get("targetWeight")),
      note: (formData.get("note") as string) || null,
      active: true,
    },
  });

  revalidatePath("/calendar");
  revalidatePath("/season");
  revalidatePath("/seasons");
  revalidatePath(`/seasons/${season.id}`);
  return { success: true };
}

export async function endSeason(formData: FormData) {
  const active = await prisma.season.findFirst({ where: { active: true } });
  if (!active) return { success: false };

  await prisma.season.update({
    where: { id: active.id },
    data: {
      active: false,
      endDate: parseDateInput(formData.get("endDate") as string),
      endWeight: parseFloatOrNull(formData.get("endWeight")),
      note: formData.get("note")
        ? `${active.note ? active.note + "\n\n" : ""}${formData.get("note")}`
        : active.note,
    },
  });

  revalidatePath("/calendar");
  revalidatePath("/season");
  revalidatePath("/seasons");
  revalidatePath(`/seasons/${active.id}`);
  return { success: true };
}

function parseFloatOrNull(v: FormDataEntryValue | null): number | null {
  if (!v || v === "") return null;
  const n = parseFloat(v as string);
  return isNaN(n) ? null : n;
}
