"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { parseDateInput } from "@/lib/utils";

export async function createMeasurement(formData: FormData) {
  const data = {
    date: parseDateInput(formData.get("date") as string),
    weight: parseFloatOrNull(formData.get("weight")),
    waist: parseFloatOrNull(formData.get("waist")),
    abdomen: parseFloatOrNull(formData.get("abdomen")),
    arm: parseFloatOrNull(formData.get("arm")),
    shoulder: parseFloatOrNull(formData.get("shoulder")),
    chest: parseFloatOrNull(formData.get("chest")),
    hip: parseFloatOrNull(formData.get("hip")),
    thigh: parseFloatOrNull(formData.get("thigh")),
    neck: parseFloatOrNull(formData.get("neck")),
    estimatedBodyFat: parseFloatOrNull(formData.get("estimatedBodyFat")),
    notes: (formData.get("notes") as string) || null,
  };

  await prisma.bodyMeasurement.create({ data });
  revalidatePath("/measurements");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateMeasurement(id: string, formData: FormData) {
  const data = {
    date: parseDateInput(formData.get("date") as string),
    weight: parseFloatOrNull(formData.get("weight")),
    waist: parseFloatOrNull(formData.get("waist")),
    abdomen: parseFloatOrNull(formData.get("abdomen")),
    arm: parseFloatOrNull(formData.get("arm")),
    shoulder: parseFloatOrNull(formData.get("shoulder")),
    chest: parseFloatOrNull(formData.get("chest")),
    hip: parseFloatOrNull(formData.get("hip")),
    thigh: parseFloatOrNull(formData.get("thigh")),
    neck: parseFloatOrNull(formData.get("neck")),
    estimatedBodyFat: parseFloatOrNull(formData.get("estimatedBodyFat")),
    notes: (formData.get("notes") as string) || null,
  };

  await prisma.bodyMeasurement.update({ where: { id }, data });
  revalidatePath("/measurements");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteMeasurement(id: string) {
  await prisma.bodyMeasurement.delete({ where: { id } });
  revalidatePath("/measurements");
  revalidatePath("/dashboard");
}

export async function getMeasurements() {
  return prisma.bodyMeasurement.findMany({ orderBy: { date: "desc" } });
}

function parseFloatOrNull(value: FormDataEntryValue | null): number | null {
  if (!value || value === "") return null;
  const n = parseFloat(value as string);
  return isNaN(n) ? null : n;
}
