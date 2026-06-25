import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { prisma, type User } from "@orma/database";

const sessionCookieName = "nexus_session";
const sessionTtlSeconds = 60 * 60 * 8;

export type AuthSession = {
  userId: string;
  roles: string[];
  primaryBirdepId: string | null;
  permissions: string[];
  mustChangePassword: boolean;
};

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash: string) {
  const [algorithm, salt, hash] = storedHash.split(":");
  if (algorithm !== "scrypt" || !salt || !hash) {
    return false;
  }

  const expected = Buffer.from(hash, "hex");
  const actual = scryptSync(password, salt, 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function encodeSession(session: AuthSession) {
  return Buffer.from(JSON.stringify(session), "utf8").toString("base64url");
}

function decodeSession(value: string): AuthSession | null {
  try {
    return JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

export async function setSession(session: AuthSession) {
  const cookieStore = await cookies();
  cookieStore.set(sessionCookieName, encodeSession(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionTtlSeconds,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(sessionCookieName);
}

export async function getSession() {
  const cookieStore = await cookies();
  const value = cookieStore.get(sessionCookieName)?.value;
  return value ? decodeSession(value) : null;
}

export async function requireAuth() {
  const session = await getSession();
  if (!session) {
    throw new Error("UNAUTHORIZED");
  }
  return session;
}

export async function buildSession(user: User): Promise<AuthSession> {
  const { getEffectivePermissions } = await import("./permissions");
  const roles = await prisma.roleAssignment.findMany({
    where: { userId: user.id },
    include: { role: true },
  });

  return {
    userId: user.id,
    roles: roles.map((assignment) => assignment.role.code),
    primaryBirdepId: user.primaryBirdepId,
    permissions: await getEffectivePermissions(user.id),
    mustChangePassword: user.mustChangePassword,
  };
}

export async function requirePermission(permission: string) {
  const session = await requireAuth();
  if (!session.permissions.includes(permission)) {
    throw new Error("FORBIDDEN");
  }
  return session;
}
