"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { parseDateInput } from "@/lib/utils";

export async function createPhoto(formData: FormData) {
  await prisma.progressPhoto.create({
    data: {
      date: parseDateInput(formData.get("date") as string),
      photoType: formData.get("photoType") as string,
      imageUrl: (formData.get("imageUrl") as string) || null,
      notes: (formData.get("notes") as string) || null,
      weight: parseFloatOrNull(formData.get("weight")),
      waist: parseFloatOrNull(formData.get("waist")),
      phase: (formData.get("phase") as string) || null,
    },
  });
  revalidatePath("/photos");
  return { success: true };
}

export async function deletePhoto(id: string) {
  await prisma.progressPhoto.delete({ where: { id } });
  revalidatePath("/photos");
}

export async function getPhotos() {
  return prisma.progressPhoto.findMany({ orderBy: { date: "desc" } });
}

export async function createNote(formData: FormData) {
  await prisma.note.create({
    data: {
      date: parseDateInput(formData.get("date") as string),
      title: (formData.get("title") as string) || null,
      content: formData.get("content") as string,
      category: (formData.get("category") as string) || null,
    },
  });
  revalidatePath("/photos");
  return { success: true };
}

export async function deleteNote(id: string) {
  await prisma.note.delete({ where: { id } });
  revalidatePath("/photos");
}

export async function getNotes() {
  return prisma.note.findMany({ orderBy: { date: "desc" } });
}

function parseFloatOrNull(value: FormDataEntryValue | null): number | null {
  if (!value || value === "") return null;
  const n = parseFloat(value as string);
  return isNaN(n) ? null : n;
}
