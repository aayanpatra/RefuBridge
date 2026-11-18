import { runDistribution } from "@/lib/distribution";
import { requireAdmin } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const summary = await runDistribution();
    return Response.json(summary);
  } catch (error) {
    console.error("Failed to run distribution:", error);
    return Response.json({ error: "Unable to distribute donations right now." }, { status: 500 });
  }
}
