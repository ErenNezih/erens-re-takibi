"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { parseDateInput } from "@/lib/utils";

export async function createSubstance(formData: FormData) {
  await prisma.substanceLog.create({
    data: {
      name: formData.get("name") as string,
      category: formData.get("category") as string,
      abbreviation: (formData.get("abbreviation") as string) || null,
      startDate: parseDateInput(formData.get("startDate") as string),
      endDate: formData.get("endDate")
        ? parseDateInput(formData.get("endDate") as string)
        : null,
      frequency: (formData.get("frequency") as string) || null,
      userNotes: (formData.get("userNotes") as string) || null,
      doctorSupervised:
        formData.get("doctorSupervised") === "on" ||
        formData.get("doctorSupervised") === "true",
      active: formData.get("active") !== "off",
      warningAccepted: true,
    },
  });
  revalidatePath("/substances");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateSubstance(id: string, formData: FormData) {
  await prisma.substanceLog.update({
    where: { id },
    data: {
      name: formData.get("name") as string,
      category: formData.get("category") as string,
      abbreviation: (formData.get("abbreviation") as string) || null,
      startDate: parseDateInput(formData.get("startDate") as string),
      endDate: formData.get("endDate")
        ? parseDateInput(formData.get("endDate") as string)
        : null,
      frequency: (formData.get("frequency") as string) || null,
      userNotes: (formData.get("userNotes") as string) || null,
      doctorSupervised:
        formData.get("doctorSupervised") === "on" ||
        formData.get("doctorSupervised") === "true",
      active: formData.get("active") !== "off",
    },
  });
  revalidatePath("/substances");
  return { success: true };
}

export async function deleteSubstance(id: string) {
  await prisma.substanceLog.delete({ where: { id } });
  revalidatePath("/substances");
  revalidatePath("/dashboard");
}

export async function getSubstances() {
  return prisma.substanceLog.findMany({ orderBy: { startDate: "desc" } });
}

export async function createPhase(formData: FormData) {
  const active = formData.get("active") === "on" || formData.get("active") === "true";

  if (active) {
    await prisma.phase.updateMany({ data: { active: false } });
  }

  await prisma.phase.create({
    data: {
      name: formData.get("name") as string,
      startDate: parseDateInput(formData.get("startDate") as string),
      endDate: formData.get("endDate")
        ? parseDateInput(formData.get("endDate") as string)
        : null,
      goal: (formData.get("goal") as string) || null,
      calorieTarget: parseIntOrNull(formData.get("calorieTarget")),
      stepTarget: parseIntOrNull(formData.get("stepTarget")),
      notes: (formData.get("notes") as string) || null,
      active,
    },
  });
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function getPhases() {
  return prisma.phase.findMany({ orderBy: { startDate: "desc" } });
}

function parseIntOrNull(value: FormDataEntryValue | null): number | null {
  if (!value || value === "") return null;
  const n = parseInt(value as string, 10);
  return isNaN(n) ? null : n;
}
