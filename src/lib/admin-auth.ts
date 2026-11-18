import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "refubridge-admin";
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

export function isAdminAuthConfigured() {
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.ADMIN_SESSION_SECRET;

  return Boolean(password && password.length >= 16 && secret && Buffer.byteLength(secret) >= 32);
}

export function verifyAdminPassword(password: string, expectedPassword: string | undefined) {
  if (!expectedPassword || expectedPassword.length < 16) return false;

  const submittedHash = createHash("sha256").update(password).digest();
  const expectedHash = createHash("sha256").update(expectedPassword).digest();
  return timingSafeEqual(submittedHash, expectedHash);
}

export function createAdminSession(secret: string, now = Date.now()) {
  const expiresAt = now + ADMIN_SESSION_MAX_AGE_SECONDS * 1000;
  const payload = String(expiresAt);
  const signature = createHmac("sha256", secret).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function isValidAdminSession(
  token: string | undefined,
  secret: string | undefined,
  now = Date.now(),
) {
  if (!token || !secret || Buffer.byteLength(secret) < 32) return false;

  const [expiresAtText, signature, ...extra] = token.split(".");
  if (!expiresAtText || !signature || extra.length > 0) return false;

  const expiresAt = Number(expiresAtText);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= now) return false;

  const expectedSignature = createHmac("sha256", secret)
    .update(expiresAtText)
    .digest("base64url");
  const actualBytes = Buffer.from(signature);
  const expectedBytes = Buffer.from(expectedSignature);

  return actualBytes.length === expectedBytes.length && timingSafeEqual(actualBytes, expectedBytes);
}

export function requireAdmin(request: Request) {
  const cookie = request.headers
    .get("cookie")
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${ADMIN_SESSION_COOKIE}=`));
  const token = cookie?.slice(ADMIN_SESSION_COOKIE.length + 1);

  if (isValidAdminSession(token, process.env.ADMIN_SESSION_SECRET)) {
    return null;
  }

  return Response.json(
    { error: "Authentication required." },
    { status: 401, headers: { "Cache-Control": "no-store" } },
  );
}
