import { cookies } from "next/headers";
import { createHash } from "crypto";

const SESSION_COOKIE = "cpt_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function hashToken(password: string): string {
  const secret = process.env.SESSION_SECRET || "default-secret";
  return createHash("sha256")
    .update(`${password}:${secret}`)
    .digest("hex");
}

export async function verifyPassword(password: string): Promise<boolean> {
  const appPassword = process.env.APP_PASSWORD;
  if (!appPassword) return false;
  return password === appPassword;
}

export async function createSession(password: string): Promise<void> {
  const token = hashToken(password);
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
}

export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function isAuthenticated(): Promise<boolean> {
  const appPassword = process.env.APP_PASSWORD;
  if (!appPassword) return false;

  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);
  if (!session?.value) return false;

  const expectedToken = hashToken(appPassword);
  return session.value === expectedToken;
}

export function verifySessionToken(token: string): boolean {
  const appPassword = process.env.APP_PASSWORD;
  if (!appPassword) return false;
  return token === hashToken(appPassword);
}

export { SESSION_COOKIE, SESSION_MAX_AGE };
