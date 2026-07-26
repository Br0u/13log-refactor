const MINIMUM_SECRET_LENGTH = 32;
const MAX_TIMESTAMP_DRIFT_MS = 60_000;
const SIGNATURE_HEX_PATTERN = /^[0-9a-f]{64}$/i;
const TIMESTAMP_PATTERN = /^\d+$/;

function getRiskSecret() {
  const riskSecret = process.env.RISK_INTERNAL_SECRET;
  if (typeof riskSecret !== "string" || riskSecret.length < MINIMUM_SECRET_LENGTH) {
    throw new Error("RISK_INTERNAL_SECRET must be at least 32 characters");
  }

  if (riskSecret === process.env.SESSION_SECRET) {
    throw new Error("RISK_INTERNAL_SECRET must be distinct from SESSION_SECRET");
  }

  return riskSecret;
}

async function importRiskKey(secret: string, usage: KeyUsage) {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    {
      name: "HMAC",
      hash: "SHA-256",
    },
    false,
    [usage],
  );
}

function encodeSignedContent(timestamp: string, body: string) {
  return new TextEncoder().encode(`${timestamp}.${body}`);
}

function decodeHex(value: string) {
  if (!SIGNATURE_HEX_PATTERN.test(value)) {
    return null;
  }

  const bytes = new Uint8Array(value.length / 2);
  for (let index = 0; index < value.length; index += 2) {
    bytes[index / 2] = Number.parseInt(value.slice(index, index + 2), 16);
  }
  return bytes;
}

export async function signInternalRiskBody(body: string, now = Date.now()) {
  if (!Number.isSafeInteger(now) || now < 0) {
    throw new Error("Internal risk timestamp must be a non-negative safe integer");
  }

  const timestamp = String(now);
  const key = await importRiskKey(getRiskSecret(), "sign");
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encodeSignedContent(timestamp, body),
  );

  return {
    timestamp,
    signature: Array.from(new Uint8Array(signature), (byte) => (
      byte.toString(16).padStart(2, "0")
    )).join(""),
  };
}

export async function verifyInternalRiskBody(
  body: string,
  timestamp: string | null,
  signature: string | null,
  now = Date.now(),
) {
  if (
    timestamp === null
    || signature === null
    || !TIMESTAMP_PATTERN.test(timestamp)
  ) {
    return false;
  }

  const timestampValue = Number(timestamp);
  if (
    !Number.isSafeInteger(timestampValue)
    || String(timestampValue) !== timestamp
    || !Number.isSafeInteger(now)
    || Math.abs(now - timestampValue) > MAX_TIMESTAMP_DRIFT_MS
  ) {
    return false;
  }

  const signatureBytes = decodeHex(signature);
  if (signatureBytes === null) {
    return false;
  }

  try {
    const key = await importRiskKey(getRiskSecret(), "verify");
    return await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes,
      encodeSignedContent(timestamp, body),
    );
  } catch {
    return false;
  }
}
