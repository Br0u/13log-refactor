export const ADMIN_SESSION_COOKIE = "admin_session";
const SESSION_LIFETIME_SECONDS = 8 * 60 * 60;
const MINIMUM_SESSION_SECRET_LENGTH = 32;

function getCryptoApi() {
  const cryptoApi = globalThis.crypto;
  if (!cryptoApi?.subtle) {
    throw new Error("Web Crypto API is not available");
  }
  return cryptoApi;
}

function getSessionSecret() {
  const secret = process.env.SESSION_SECRET;
  return typeof secret === "string" && secret.length >= MINIMUM_SESSION_SECRET_LENGTH
    ? secret
    : null;
}

async function importSessionKey(secret, usages) {
  const cryptoApi = getCryptoApi();
  const encoder = new TextEncoder();
  return cryptoApi.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    usages
  );
}

async function signSessionPayload(payload, secret) {
  const cryptoApi = getCryptoApi();
  const encoder = new TextEncoder();
  const key = await importSessionKey(secret, ["sign"]);
  const signature = await cryptoApi.subtle.sign("HMAC", key, encoder.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(value) {
  if (!/^[0-9a-f]{64}$/i.test(value)) {
    return null;
  }

  return Uint8Array.from(
    value.match(/.{2}/g),
    (byte) => Number.parseInt(byte, 16)
  );
}

async function verifySessionPayload(payload, signature, secret) {
  const signatureBytes = hexToBytes(signature);
  if (!signatureBytes) {
    return false;
  }

  const cryptoApi = getCryptoApi();
  const encoder = new TextEncoder();
  const key = await importSessionKey(secret, ["verify"]);
  return cryptoApi.subtle.verify(
    "HMAC",
    key,
    signatureBytes,
    encoder.encode(payload)
  );
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
  const secret = getSessionSecret();
  if (!secret) {
    throw new Error("SESSION_SECRET must be at least 32 characters");
  }

  const issuedAt = Math.floor(Date.now() / 1000);
  const payload = encodeBase64Url(JSON.stringify({
    username,
    iat: issuedAt,
    exp: issuedAt + SESSION_LIFETIME_SECONDS,
  }));
  const signature = await signSessionPayload(payload, secret);
  return `${payload}.${signature}`;
}

export async function readAdminSession(token) {
  const secret = getSessionSecret();
  if (!secret || !token || typeof token !== "string") {
    return null;
  }

  const tokenParts = token.split(".");
  if (tokenParts.length !== 2 || !tokenParts[0] || !tokenParts[1]) {
    return null;
  }

  try {
    const [payload, signature] = tokenParts;
    const signatureIsValid = await verifySessionPayload(payload, signature, secret);
    if (!signatureIsValid) {
      return null;
    }

    const parsed = JSON.parse(decodeBase64Url(payload));
    const now = Math.floor(Date.now() / 1000);
    if (
      typeof parsed?.username !== "string"
      || !parsed.username
      || !Number.isInteger(parsed.iat)
      || !Number.isInteger(parsed.exp)
      || parsed.exp - parsed.iat !== SESSION_LIFETIME_SECONDS
      || parsed.exp <= now
    ) {
      return null;
    }

    return { username: parsed.username };
  } catch {
    return null;
  }
}

export function buildSessionCookie(token) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${ADMIN_SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${SESSION_LIFETIME_SECONDS}${secure}`;
}

export function buildClearedSessionCookie() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${ADMIN_SESSION_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${secure}`;
}
