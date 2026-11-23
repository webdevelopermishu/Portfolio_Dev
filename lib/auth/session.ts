import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { db } from "@/lib/db";
import type { Role } from "@/lib/generated/prisma/enums";

const COOKIE = "pf_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) {
    throw new Error("AUTH_SECRET must be set to a random string of at least 32 characters");
  }
  return new TextEncoder().encode(value);
}

export type SessionUser = { id: string; email: string; name: string; role: Role };

export async function createSession(user: { id: string; tokenVersion: number }) {
  const token = await new SignJWT({ tv: user.tokenVersion })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

/** Returns the signed-in user, re-checked against the database on every request. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: ["HS256"] });
    if (!payload.sub) return null;
    const user = await db.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true, name: true, role: true, tokenVersion: true },
    });
    if (!user || user.tokenVersion !== payload.tv) return null;
    return { id: user.id, email: user.email, name: user.name, role: user.role };
  } catch {
    return null;
  }
});

/** For pages: redirects to the login screen when not signed in. */
export async function requireUser(role?: Role) {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  if (role === "ADMIN" && user.role !== "ADMIN") redirect("/admin?denied=1");
  return user;
}

export class AuthError extends Error {}

/** For server actions and route handlers: throws instead of redirecting. */
export async function assertUser(role?: Role) {
  const user = await getSessionUser();
  if (!user) throw new AuthError("You are not signed in.");
  if (role === "ADMIN" && user.role !== "ADMIN") throw new AuthError("Only administrators can do this.");
  return user;
}
