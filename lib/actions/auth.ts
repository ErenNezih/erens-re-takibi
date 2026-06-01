"use server";

import { redirect } from "next/navigation";
import { createSession, destroySession, verifyPassword } from "@/lib/auth";

export async function loginAction(formData: FormData) {
  const password = formData.get("password") as string;
  if (!password || !(await verifyPassword(password))) {
    return { error: "Geçersiz şifre" };
  }
  await createSession(password);
  redirect("/calendar");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}
