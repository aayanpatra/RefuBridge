import { runDistribution } from "@/lib/distribution";

export async function POST() {
  try {
    const summary = await runDistribution();
    return Response.json(summary);
  } catch (error) {
    console.error("Failed to run distribution:", error);
    return Response.json({ error: "Unable to distribute donations right now." }, { status: 500 });
  }
}
