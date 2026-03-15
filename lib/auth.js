import bcrypt from "bcryptjs";
import { db } from "./db";

const SESSION_SECRET = process.env.SESSION_SECRET || "dev-session-secret";
export const ADMIN_SESSION_COOKIE = "admin_session";

function getCryptoApi() {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.subtle) {
    throw new Error("Web Crypto API is not available");
  }
  return cryptoApi;
}

async function signSessionPayload(payload) {
  const cryptoApi = getCryptoApi();
  const encoder = new TextEncoder();
  const key = await cryptoApi.subtle.importKey(
    "raw",
    encoder.encode(SESSION_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await cryptoApi.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash);
}

export async function createAdminSession({ username }) {
  const payload = Buffer.from(JSON.stringify({ username }), "utf8").toString("base64url");
  const signature = await signSessionPayload(payload);
  return `${payload}.${signature}`;
}

export async function readAdminSession(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) {
    return null;
  }

  const [payload, signature] = token.split(".");
  const expectedSignature = await signSessionPayload(payload);
  if (signature !== expectedSignature) {
    return null;
  }

  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    return parsed?.username ? { username: parsed.username } : null;
  } catch {
    return null;
  }
}

export function clearAdminSession() {
  return "";
}

export async function verifyAdminLogin(username, password) {
  const adminUser = await db.adminUser.findUnique({
    where: { username },
  });

  if (!adminUser) {
    throw new Error("Invalid credentials");
  }

  const valid = await verifyPassword(password, adminUser.passwordHash);

  if (!valid) {
    throw new Error("Invalid credentials");
  }

  return { username: adminUser.username };
}

export function buildSessionCookie(token) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${ADMIN_SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax${secure}`;
}

export function buildClearedSessionCookie() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${ADMIN_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}
