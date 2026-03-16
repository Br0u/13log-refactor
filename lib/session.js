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

function bytesToBase64(bytes) {
  let binary = "";
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

function base64ToBytes(base64) {
  const binary = atob(base64);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

function encodeBase64Url(value) {
  const bytes = new TextEncoder().encode(value);
  return bytesToBase64(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function decodeBase64Url(value) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padding = (4 - (base64.length % 4 || 4)) % 4;
  const normalized = `${base64}${"=".repeat(padding)}`;
  const bytes = base64ToBytes(normalized);
  return new TextDecoder().decode(bytes);
}

export async function createAdminSession({ username }) {
  const payload = encodeBase64Url(JSON.stringify({ username }));
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
    const parsed = JSON.parse(decodeBase64Url(payload));
    return parsed?.username ? { username: parsed.username } : null;
  } catch {
    return null;
  }
}

export function buildSessionCookie(token) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${ADMIN_SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax${secure}`;
}

export function buildClearedSessionCookie() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${ADMIN_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}
