import { scanForFraud } from "@/lib/fraud";
import { requireAdmin } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const result = await scanForFraud();
    return Response.json(result);
  } catch (error) {
    console.error("Failed to scan for fraud:", error);
    return Response.json({ error: "Unable to scan for fraud right now." }, { status: 500 });
  }
}
