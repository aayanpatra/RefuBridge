import {
  ADMIN_SESSION_COOKIE,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  createAdminSession,
  isAdminAuthConfigured,
  verifyAdminPassword,
} from "@/lib/admin-auth";

export async function POST(request: Request) {
  if (!isAdminAuthConfigured()) {
    return Response.json(
      { error: "Admin authentication is not configured on this deployment." },
      { status: 503 },
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  if (
    typeof payload !== "object" ||
    payload === null ||
    !("password" in payload) ||
    typeof payload.password !== "string"
  ) {
    return Response.json({ error: "A password is required." }, { status: 400 });
  }
  if (payload.password.length > 1024) {
    return Response.json({ error: "Password is too long." }, { status: 400 });
  }

  if (!verifyAdminPassword(payload.password, process.env.ADMIN_PASSWORD)) {
    return Response.json({ error: "Incorrect password." }, { status: 401 });
  }

  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    return Response.json(
      { error: "Admin authentication is not configured on this deployment." },
      { status: 503 },
    );
  }

  const response = Response.json({ ok: true });
  response.headers.append(
    "Set-Cookie",
    `${ADMIN_SESSION_COOKIE}=${createAdminSession(secret)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${ADMIN_SESSION_MAX_AGE_SECONDS}${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
  );
  response.headers.set("Cache-Control", "no-store");
  return response;
}
